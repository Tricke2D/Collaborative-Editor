// apps/server/src/db/operation-repository.ts
import { sql } from "./pool.js";
import type { Operation } from "@collab-editor/crdt-core";

export interface PersistedOperation {
    dbId: number;
    operation: Operation;
}

export async function insertOperationLog(op: Operation): Promise<number> {
    const result = await sql`
    INSERT INTO operations
      (document_id, op_type, site_id, counter, origin_site_id, origin_counter, value)
    VALUES (
      ${op.documentId},
      ${op.type},
      ${op.id.siteId},
      ${op.id.counter},
      ${op.type === 'insert' ? op.originId?.siteId ?? null : null},
      ${op.type === 'insert' ? op.originId?.counter ?? null : null},
      ${op.type === 'insert' ? op.value : null}
    )
    RETURNING id
  `;
    return Number(result[0].id);
}

export async function getOperationsByDocument(documentId: string): Promise<PersistedOperation[]> {
    const rows = await sql`
    SELECT id, op_type, site_id, counter, origin_site_id, origin_counter, value
    FROM operations WHERE document_id = ${documentId} ORDER BY id ASC
  `;
    return rows.map((row: any) => rowToPersistedOperation(row, documentId));
}

export async function getOperationsAfter(
    documentId: string,
    afterOperationId: number
): Promise<PersistedOperation[]> {
    const rows = await sql`
    SELECT id, op_type, site_id, counter, origin_site_id, origin_counter, value
    FROM operations WHERE document_id = ${documentId} AND id > ${afterOperationId} ORDER BY id ASC
  `;
    return rows.map((row: any) => rowToPersistedOperation(row, documentId));
}

function rowToPersistedOperation(row: any, documentId: string): PersistedOperation {
    const id = { siteId: row.site_id, counter: Number(row.counter) };
    const operation: Operation =
        row.op_type === "insert"
            ? {
                type: "insert",
                id,
                value: row.value,
                originId:
                    row.origin_site_id !== null
                        ? { siteId: row.origin_site_id, counter: Number(row.origin_counter) }
                        : null,
                documentId,
                timestamp: Date.now(),
                senderId: row.site_id,
            }
            : { type: "delete", id, documentId, timestamp: Date.now(), senderId: row.site_id };
    return { dbId: Number(row.id), operation };
}