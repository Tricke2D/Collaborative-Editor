/**
 * operation.ts
 * -----------------------------------------------------------------------
 * Mendefinisikan bentuk "Operation" dengan senderId untuk identifikasi pengirim.
 */
import { z } from "zod";
import type { Identifier } from "./identifier";

/** Operation untuk insert 1 karakter baru ke dokumen */
export interface InsertOperation {
    type: "insert";
    id: Identifier;
    value: string;
    originId: Identifier | null;
    documentId: string;
    timestamp: number;
    senderId: string; // ⭐ ID unik client pengirim
}

/** Operation untuk delete (tombstone) 1 karakter yang sudah ada */
export interface DeleteOperation {
    type: "delete";
    id: Identifier;
    documentId: string;
    timestamp: number;
    senderId: string; // ⭐ ID unik client pengirim
}

export type Operation = InsertOperation | DeleteOperation;

// --- Runtime validation schema (zod) -----------------------------------

const identifierSchema = z.object({
    siteId: z.string().min(1),
    counter: z.number().int().nonnegative(),
});

const insertOperationSchema = z.object({
    type: z.literal("insert"),
    id: identifierSchema,
    value: z.string().length(1),
    originId: identifierSchema.nullable(),
    documentId: z.string().min(1),
    timestamp: z.number(),
    senderId: z.string().min(1),
});

const deleteOperationSchema = z.object({
    type: z.literal("delete"),
    id: identifierSchema,
    documentId: z.string().min(1),
    timestamp: z.number(),
    senderId: z.string().min(1),
});

export const operationSchema = z.discriminatedUnion("type", [
    insertOperationSchema,
    deleteOperationSchema,
]);

/**
 * serializeOperation
 * ---------------------------------------------------------------------
 * Operation → JSON string siap kirim lewat WebSocket.
 */
export function serializeOperation(op: Operation): string {
    return JSON.stringify(op);
}

/**
 * deserializeOperation
 * ---------------------------------------------------------------------
 * JSON string → Operation yang SUDAH TERVALIDASI.
 * Throw ZodError kalau payload tidak sesuai schema.
 */
export function deserializeOperation(raw: string): Operation {
    const parsed: unknown = JSON.parse(raw);
    return operationSchema.parse(parsed);
}