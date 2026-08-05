/**
 * room-manager.test.ts
 * -----------------------------------------------------------------------
 * Unit test RoomManager pakai MOCK socket
 */
import { describe, it, expect, vi } from "vitest";
import { RoomManager } from "./room-manager";

function createMockSocket() {
    return { readyState: 1, OPEN: 1, send: vi.fn() } as any;
}

describe("RoomManager", () => {
    it("broadcast tidak mengirim ke pengirim asli (excludeSocket)", () => {
        const rm = new RoomManager();
        const socketA = createMockSocket();
        const socketB = createMockSocket();
        rm.join("doc-1", socketA);
        rm.join("doc-1", socketB);

        rm.broadcast("doc-1", "hello", socketA);

        expect(socketA.send).not.toHaveBeenCalled();
        expect(socketB.send).toHaveBeenCalledWith("hello");
    });

    it("leave menghapus room kalau sudah kosong", () => {
        const rm = new RoomManager();
        const socketA = createMockSocket();
        rm.join("doc-1", socketA);
        rm.leave("doc-1", socketA);
        expect(rm.roomSize("doc-1")).toBe(0);
    });

    it("broadcast ke room yang tidak ada tidak error", () => {
        const rm = new RoomManager();
        const socketA = createMockSocket();
        expect(() => rm.broadcast("nonexistent", "hello", socketA)).not.toThrow();
    });

    it("join multiple socket ke room yang sama", () => {
        const rm = new RoomManager();
        const socketA = createMockSocket();
        const socketB = createMockSocket();
        const socketC = createMockSocket();

        rm.join("doc-1", socketA);
        rm.join("doc-1", socketB);
        rm.join("doc-2", socketC);

        expect(rm.roomSize("doc-1")).toBe(2);
        expect(rm.roomSize("doc-2")).toBe(1);
    });
});