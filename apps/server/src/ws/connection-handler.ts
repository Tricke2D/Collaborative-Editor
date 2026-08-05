/**
 * connection-handler.ts
 * Menangani lifecycle 1 koneksi WebSocket - dengan snapshot support
 */
import type { WebSocket } from "ws";
import { operationSchema } from "@collab-editor/crdt-core";
import { z } from "zod";
import type { RoomManager } from "./room-manager.js";
import type { DocumentStateManager } from "./document-state-manager.js";
import { insertOperationLog } from "../db/operation-repository.js";

const joinMessageSchema = z.object({ type: z.literal("join"), documentId: z.string().min(1) });

const cursorMessageSchema = z.object({
    type: z.literal("cursor"),
    siteId: z.string().min(1),
    documentId: z.string().min(1),
    visibleIndex: z.number().int().nonnegative(),
});

export function handleConnection(
    socket: WebSocket,
    roomManager: RoomManager,
    stateManager: DocumentStateManager
): void {
    let joinedDocumentId: string | null = null;

    socket.on("message", (raw) => {
        const text = raw.toString();
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            console.error("[ws] non-JSON payload dropped");
            return;
        }

        if (joinedDocumentId === null) {
            const parsedJoin = joinMessageSchema.safeParse(parsed);
            if (!parsedJoin.success) {
                socket.close(4000, "First message must be a valid join message");
                return;
            }
            joinedDocumentId = parsedJoin.data.documentId;
            roomManager.join(joinedDocumentId, socket);

            void stateManager.getOrHydrate(joinedDocumentId).then((doc) => {
                socket.send(JSON.stringify({ type: "sync", sequenceSnapshot: doc.getSequenceSnapshot() }));
            });
            return;
        }

        // Cursor message - ephemeral, relay only
        const maybeCursor = cursorMessageSchema.safeParse(parsed);
        if (maybeCursor.success) {
            roomManager.broadcast(joinedDocumentId, text, socket);
            return;
        }

        // Operation message - persist + broadcast
        const maybeOperation = operationSchema.safeParse(parsed);
        if (maybeOperation.success) {
            roomManager.broadcast(joinedDocumentId, text, socket);
            void insertOperationLog(maybeOperation.data).then((dbId) => {
                void stateManager.recordOperation(joinedDocumentId!, maybeOperation.data, dbId);
            });
            return;
        }

        console.error("[ws] payload tidak cocok schema manapun, dropped");
    });

    socket.on("close", () => {
        if (joinedDocumentId !== null) {
            roomManager.leave(joinedDocumentId, socket);
            stateManager.evictIfEmpty(joinedDocumentId, roomManager.roomSize(joinedDocumentId));
        }
    });
}