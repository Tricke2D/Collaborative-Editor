// apps/server/src/db/snapshot-repository.ts
import { sql } from "./pool.js";
import type { RGANode } from "@collab-editor/crdt-core";

export interface DocumentSnapshot {
    sequenceSnapshot: RGANode[];
    upToOperationId: number;
}

export async function getLatestSnapshot(documentId: string): Promise<DocumentSnapshot | null> {
    const rows = await sql`
    SELECT sequence_snapshot, up_to_operation_id
    FROM document_snapshots WHERE document_id = ${documentId}
    ORDER BY created_at DESC LIMIT 1
  `;
    if (rows.length === 0) return null;
    return {
        sequenceSnapshot: rows[0].sequence_snapshot,
        upToOperationId: Number(rows[0].up_to_operation_id),
    };
}

export async function saveSnapshot(
    documentId: string,
    sequenceSnapshot: RGANode[],
    upToOperationId: number
): Promise<void> {
    await sql`
    INSERT INTO document_snapshots (document_id, sequence_snapshot, up_to_operation_id)
    VALUES (${documentId}, ${JSON.stringify(sequenceSnapshot)}::jsonb, ${upToOperationId})
  `;
}