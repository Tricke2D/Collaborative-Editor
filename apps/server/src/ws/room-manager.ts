/**
 * room-manager.ts
 * Mengelola room dengan logging
 */
import type { WebSocket } from "ws";

export class RoomManager {
    private rooms = new Map<string, Set<WebSocket>>();

    join(documentId: string, socket: WebSocket): void {
        if (!this.rooms.has(documentId)) {
            this.rooms.set(documentId, new Set());
        }
        this.rooms.get(documentId)!.add(socket);
        console.log(`[RoomManager] join: ${documentId}, size: ${this.rooms.get(documentId)!.size}`);
    }

    leave(documentId: string, socket: WebSocket): void {
        const room = this.rooms.get(documentId);
        if (!room) return;
        room.delete(socket);
        if (room.size === 0) this.rooms.delete(documentId);
        console.log(`[RoomManager] leave: ${documentId}, size: ${room.size}`);
    }

    broadcast(documentId: string, message: string, excludeSocket: WebSocket): void {
        const room = this.rooms.get(documentId);
        if (!room) {
            console.log(`[RoomManager] broadcast: room ${documentId} not found`);
            return;
        }

        let sentCount = 0;
        for (const socket of room) {
            if (socket === excludeSocket) continue;
            if (socket.readyState === socket.OPEN) {
                socket.send(message);
                sentCount++;
            }
        }
        console.log(`[RoomManager] broadcast: sent to ${sentCount} clients in ${documentId}`);
    }

    roomSize(documentId: string): number {
        return this.rooms.get(documentId)?.size ?? 0;
    }
}