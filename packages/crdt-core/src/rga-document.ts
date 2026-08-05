/**
 * rga-document.ts
 * Core CRDT engine - dengan loadSnapshot
 */
import { compareIdentifier, identifiersEqual, type Identifier } from "./identifier";
import type { RGANode } from "./rga-node";

export class RGADocument {
    private sequence: RGANode[] = [];
    private readonly _siteId: string;
    private localCounter = 0;

    constructor(siteId: string) {
        this._siteId = siteId;
    }

    get siteId(): string {
        return this._siteId;
    }

    // ⭐ BARU: Load snapshot langsung (skip replay)
    loadSnapshot(nodes: ReadonlyArray<RGANode>): void {
        this.sequence = nodes.map((n) => ({ ...n }));
    }

    private generateNextId(): Identifier {
        this.localCounter += 1;
        return { siteId: this._siteId, counter: this.localCounter };
    }

    private findIndexById(id: Identifier | null): number {
        if (id === null) return -1;
        return this.sequence.findIndex((node) => identifiersEqual(node.id, id));
    }

    insertLocal(afterId: Identifier | null, value: string) {
        const id = this.generateNextId();
        const node: RGANode = { id, originId: afterId, value, isDeleted: false };
        this.integrateInsert(node);
        return { id, originId: afterId, value };
    }

    applyRemoteInsert(id: Identifier, originId: Identifier | null, value: string): void {
        const node: RGANode = { id, originId, value, isDeleted: false };
        this.integrateInsert(node);
    }

    deleteLocal(id: Identifier): void {
        this.applyDelete(id);
    }

    applyRemoteDelete(id: Identifier): void {
        this.applyDelete(id);
    }

    private applyDelete(id: Identifier): void {
        const index = this.findIndexById(id);
        if (index === -1) return;
        this.sequence[index]!.isDeleted = true;
    }

    private integrateInsert(newNode: RGANode): void {
        let insertIndex = this.findIndexById(newNode.originId) + 1;

        while (insertIndex < this.sequence.length) {
            const candidate = this.sequence[insertIndex]!;
            const isSameOrigin = identifiersEqual(candidate.originId, newNode.originId);
            if (!isSameOrigin) break;

            if (compareIdentifier(candidate.id, newNode.id) > 0) {
                insertIndex++;
            } else {
                break;
            }
        }

        this.sequence.splice(insertIndex, 0, newNode);
    }

    toText(): string {
        return this.sequence
            .filter((node) => !node.isDeleted)
            .map((node) => node.value)
            .join("");
    }

    getSequenceSnapshot(): ReadonlyArray<RGANode> {
        return this.sequence;
    }

    getVisibleIdAtIndex(visibleIndex: number): Identifier | null {
        let count = 0;
        for (const node of this.sequence) {
            if (node.isDeleted) continue;
            if (count === visibleIndex) return node.id;
            count++;
        }
        return null;
    }
}