/**
 * operation.test.ts
 * Unit test untuk serialization/deserialization operation
 */
import { describe, it, expect } from "vitest";
import { serializeOperation, deserializeOperation } from "./operation";
import type { InsertOperation, DeleteOperation } from "./operation";

describe("Operation serialization round-trip", () => {
    it("insert operation survive JSON round-trip", () => {
        const op: InsertOperation = {
            type: "insert",
            id: { siteId: "site-a", counter: 1 },
            value: "H",
            originId: null,
            documentId: "doc-1",
            timestamp: 1710000000000,
            senderId: "site-a",
        };
        const json = serializeOperation(op);
        const decoded = deserializeOperation(json);
        expect(decoded).toEqual(op);
    });

    it("delete operation survive JSON round-trip", () => {
        const op: DeleteOperation = {
            type: "delete",
            id: { siteId: "site-b", counter: 5 },
            documentId: "doc-1",
            timestamp: 1710000000001,
            senderId: "site-b",
        };
        const json = serializeOperation(op);
        const decoded = deserializeOperation(json);
        expect(decoded).toEqual(op);
    });

    it("insert operation dengan originId tidak null", () => {
        const op: InsertOperation = {
            type: "insert",
            id: { siteId: "site-a", counter: 2 },
            value: "X",
            originId: { siteId: "site-a", counter: 1 },
            documentId: "doc-1",
            timestamp: 1710000000002,
            senderId: "site-a",
        };
        const json = serializeOperation(op);
        const decoded = deserializeOperation(json);
        expect(decoded).toEqual(op);
    });
});

describe("Operation validation — reject invalid payload", () => {
    it("reject payload dengan value lebih dari 1 karakter", () => {
        const invalidJson = JSON.stringify({
            type: "insert",
            id: { siteId: "site-a", counter: 1 },
            value: "HELLO",
            originId: null,
            documentId: "doc-1",
            timestamp: Date.now(),
            senderId: "site-a",
        });
        expect(() => deserializeOperation(invalidJson)).toThrow();
    });

    it("reject payload tanpa senderId", () => {
        const invalidJson = JSON.stringify({
            type: "insert",
            id: { siteId: "site-a", counter: 1 },
            value: "X",
            originId: null,
            documentId: "doc-1",
            timestamp: Date.now(),
        });
        expect(() => deserializeOperation(invalidJson)).toThrow();
    });

    it("reject payload dengan type tidak dikenal", () => {
        const invalidJson = JSON.stringify({
            type: "update",
            id: { siteId: "site-a", counter: 1 },
            value: "X",
            originId: null,
            documentId: "doc-1",
            timestamp: Date.now(),
            senderId: "site-a",
        });
        expect(() => deserializeOperation(invalidJson)).toThrow();
    });

    it("reject payload dengan counter negatif", () => {
        const invalidJson = JSON.stringify({
            type: "insert",
            id: { siteId: "site-a", counter: -1 },
            value: "X",
            originId: null,
            documentId: "doc-1",
            timestamp: Date.now(),
            senderId: "site-a",
        });
        expect(() => deserializeOperation(invalidJson)).toThrow();
    });
});