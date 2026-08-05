/**
 * server.ts
 * Entry point WebSocket server - dengan DocumentStateManager
 */
import { WebSocketServer } from "ws";
import { RoomManager } from "./room-manager.js";
import { DocumentStateManager } from "./document-state-manager.js";
import { handleConnection } from "./connection-handler.js";

const PORT = Number(process.env.WS_PORT ?? 8080);

export function startWebSocketServer(): void {
    const wss = new WebSocketServer({ port: PORT });
    const roomManager = new RoomManager();
    const stateManager = new DocumentStateManager(5); // Interval kecil untuk test

    wss.on("connection", (socket) => {
        console.log("[ws] new client connected");
        handleConnection(socket, roomManager, stateManager);
    });

    console.log(`[ws] server listening on ws://localhost:${PORT}`);
}