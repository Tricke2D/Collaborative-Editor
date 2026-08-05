/**
 * document-state-manager.ts
 * Menjaga instance RGADocument IN-MEMORY per dokumen yang sedang aktif
 */
// apps/server/src/ws/document-state-manager.ts
import { RGADocument, type Operation, type RGANode } from "@collab-editor/crdt-core";
import { getLatestSnapshot, saveSnapshot } from "../db/snapshot-repository.js";
import { getOperationsAfter, getOperationsByDocument } from "../db/operation-repository.js";

// ... sisanya sama

interface DocumentState {
    doc: RGADocument;
    operationsSinceSnapshot: number;
    lastOperationId: number;
}

export class DocumentStateManager {
    private states = new Map<string, DocumentState>();

    constructor(private readonly snapshotInterval: number = 5) {} // default 5 untuk test

    async getOrHydrate(documentId: string): Promise<RGADocument> {
        const existing = this.states.get(documentId);
        if (existing) return existing.doc;

        const doc = new RGADocument(`server-replay-${documentId}`);
        const snapshot = await getLatestSnapshot(documentId);

        let lastOperationId = 0;
        if (snapshot) {
            doc.loadSnapshot(snapshot.sequenceSnapshot);
            lastOperationId = snapshot.upToOperationId;
        }

        const deltaOps = snapshot
            ? await getOperationsAfter(documentId, snapshot.upToOperationId)
            : await getOperationsByDocument(documentId);

        for (const { dbId, operation } of deltaOps) {
            this.applyToDoc(doc, operation);
            lastOperationId = Math.max(lastOperationId, dbId);
        }

        this.states.set(documentId, { doc, operationsSinceSnapshot: deltaOps.length, lastOperationId });
        return doc;
    }

    async recordOperation(documentId: string, op: Operation, dbOperationId: number): Promise<void> {
        const state = this.states.get(documentId);
        if (!state) return;

        this.applyToDoc(state.doc, op);
        state.operationsSinceSnapshot += 1;
        state.lastOperationId = dbOperationId;

        if (state.operationsSinceSnapshot >= this.snapshotInterval) {
            const nodes = state.doc.getSequenceSnapshot() as RGANode[];
            await saveSnapshot(documentId, nodes, state.lastOperationId);
            state.operationsSinceSnapshot = 0;
            console.log(`[snapshot] created document=${documentId} up_to_operation_id=${state.lastOperationId}`);
        }
    }

    private applyToDoc(doc: RGADocument, op: Operation): void {
        if (op.type === "insert") doc.applyRemoteInsert(op.id, op.originId, op.value);
        else doc.applyRemoteDelete(op.id);
    }

    evictIfEmpty(documentId: string, roomSize: number): void {
        if (roomSize === 0) {
            this.states.delete(documentId);
            console.log(`[snapshot] evicted document=${documentId} from memory`);
        }
    }
}