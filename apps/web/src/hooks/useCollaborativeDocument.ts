/**
 * useCollaborativeDocument.ts
 * Custom hook untuk CRDT + WebSocket dengan senderId
 *
 * ✅ FIX: Menggunakan isActive flag untuk mencegah skip message
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { RGADocument, type Operation } from "@collab-editor/crdt-core";
import { CollabWebSocketClient } from "../lib/websocket-client";
import { getOrCreateSiteId } from "../lib/site-id";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";

interface SyncMessage {
    type: "sync";
    operations: Operation[];
}

export function useCollaborativeDocument(documentId: string) {
    const docRef = useRef<RGADocument>(new RGADocument(getOrCreateSiteId()));
    const clientRef = useRef<CollabWebSocketClient | null>(null);
    const pendingOpsRef = useRef<Operation[]>([]);
    const lastInsertRef = useRef<{ char: string; index: number; time: number } | null>(null);

    const [text, setText] = useState(() => docRef.current.toText());
    const [isConnected, setIsConnected] = useState(false);

    console.log(`[hook] 🔄 render, siteId: ${docRef.current.siteId}, connected: ${isConnected}, text: "${text}"`);

    const syncText = useCallback(() => {
        const currentText = docRef.current.toText();
        console.log(`[hook] 📝 syncText: "${currentText}"`);
        setText(currentText);
    }, []);

    // ============ WEBSOCKET SETUP ============
    useEffect(() => {
        // ⭐ Local flag, bukan ref - ini yang bener!
        let isActive = true;

        console.log(`[hook] 🚀 initializing for document: "${documentId}"`);
        console.log(`[hook] 🆔 My siteId: ${docRef.current.siteId}`);

        // Cleanup existing client
        if (clientRef.current) {
            console.log("[hook] 🧹 closing existing client");
            clientRef.current.close();
            clientRef.current = null;
        }

        setIsConnected(false);

        const client = new CollabWebSocketClient(
            WS_URL,
            documentId,
            // ⭐ ONMESSAGE CALLBACK
            (message) => {
                console.log("🔥🔥🔥 [hook] ONMESSAGE CALLBACK TRIGGERED 🔥🔥🔥");
                console.log("[hook] 📥 raw message:", message);

                // ⭐ Cek isActive (bukan isMountedRef)
                if (!isActive) {
                    console.log("[hook] ⏭️ component not active, skipping message");
                    return;
                }

                // Handle sync message
                if (message && typeof message === 'object' && 'type' in message && message.type === 'sync') {
                    const syncMsg = message as { type: "sync"; sequenceSnapshot: RGANode[] };
                    console.log("[hook] 📥 received sync with snapshot, nodes:", syncMsg.sequenceSnapshot.length);
                    docRef.current.loadSnapshot(syncMsg.sequenceSnapshot);
                    const newText = docRef.current.toText();
                    console.log(`[hook] ✅ loaded snapshot, text: "${newText}"`);
                    setText(newText);
                    return;
                }

                const op = message as Operation;
                console.log(`[hook] 📥 received op: type=${op.type}, senderId=${op.senderId}, value=${op.type === 'insert' ? op.value : 'N/A'}`);

                // ⭐ SKIP OWN OPERATIONS
                if (op.senderId === docRef.current.siteId) {
                    console.log(`[hook] ⏭️ skipping own op: ${op.senderId} (sama dengan siteId saya)`);
                    return;
                }

                console.log(`[hook] ✅ ini adalah REMOTE op dari: ${op.senderId}`);

                try {
                    if (op.type === "insert") {
                        console.log(`[hook] 📥 applying remote insert: value="${op.value}"`);
                        docRef.current.applyRemoteInsert(op.id, op.originId, op.value);
                    } else {
                        console.log(`[hook] 📥 applying remote delete`);
                        docRef.current.applyRemoteDelete(op.id);
                    }

                    const newText = docRef.current.toText();
                    console.log(`[hook] ✅ remote applied, new text: "${newText}"`);
                    syncText();
                } catch (err) {
                    console.error("[hook] ❌ error applying remote op:", err);
                }
            },
            // onConnect
            () => {
                if (!isActive) return;
                console.log("[hook] ✅ WebSocket connected");
                setIsConnected(true);

                if (pendingOpsRef.current.length > 0) {
                    console.log(`[hook] 📤 sending ${pendingOpsRef.current.length} pending ops`);
                    const ops = [...pendingOpsRef.current];
                    pendingOpsRef.current = [];
                    for (const op of ops) {
                        clientRef.current?.send(op);
                    }
                }
            },
            // onDisconnect
            () => {
                if (!isActive) return;
                console.log("[hook] 🔌 WebSocket disconnected");
                setIsConnected(false);
            }
        );

        clientRef.current = client;

        // ⭐ CLEANUP - set isActive = false
        return () => {
            console.log("[hook] 🧹 cleanup, setting isActive = false");
            isActive = false;
            if (clientRef.current) {
                clientRef.current.close();
                clientRef.current = null;
            }
        };
    }, [documentId, syncText]);

    // ============ INSERT CHARACTER ============
    const insertChar = useCallback(
        (visibleIndex: number, char: string) => {
            console.log(`[hook] 📝 insertChar: idx=${visibleIndex}, char="${char}", connected=${isConnected}`);

            if (!char || char.length !== 1) return;
            if (visibleIndex < 0) return;

            const now = Date.now();
            const last = lastInsertRef.current;
            if (last && last.char === char && last.index === visibleIndex && (now - last.time) < 100) {
                console.log("[hook] ⏭️ duplicate local insert, skipping");
                return;
            }
            lastInsertRef.current = { char, index: visibleIndex, time: now };

            const originId = visibleIndex === 0
                ? null
                : docRef.current.getVisibleIdAtIndex(visibleIndex - 1);

            const localOp = docRef.current.insertLocal(originId, char);
            const newText = docRef.current.toText();
            console.log(`[hook] ✅ local insert: "${newText}"`);

            setText(newText);

            const op: Operation = {
                type: "insert",
                id: localOp.id,
                value: localOp.value,
                originId: localOp.originId,
                documentId,
                timestamp: Date.now(),
                senderId: docRef.current.siteId,
            };

            if (clientRef.current && isConnected) {
                console.log("[hook] 📤 sending via WebSocket");
                clientRef.current.send(op);
            } else {
                console.log("[hook] ⏳ queueing (not connected)");
                pendingOpsRef.current.push(op);
            }
        },
        [documentId, isConnected]
    );

    // ============ DELETE CHARACTER ============
    const deleteChar = useCallback(
        (visibleIndex: number) => {
            console.log(`[hook] 🗑️ deleteChar: idx=${visibleIndex}, connected=${isConnected}`);

            if (visibleIndex < 0) return;

            const id = docRef.current.getVisibleIdAtIndex(visibleIndex);
            if (id === null) {
                console.log(`[hook] ⚠️ no char at index ${visibleIndex}`);
                return;
            }

            docRef.current.deleteLocal(id);
            const newText = docRef.current.toText();
            console.log(`[hook] ✅ local delete: "${newText}"`);

            setText(newText);

            const op: Operation = {
                type: "delete",
                id,
                documentId,
                timestamp: Date.now(),
                senderId: docRef.current.siteId,
            };

            if (clientRef.current && isConnected) {
                clientRef.current.send(op);
            } else {
                pendingOpsRef.current.push(op);
            }
        },
        [documentId, isConnected]
    );

    const getVisibleIdAtIndex = useCallback((index: number) => {
        return docRef.current.getVisibleIdAtIndex(index);
    }, []);

    const getDocumentState = useCallback(() => ({
        text: docRef.current.toText(),
        sequence: docRef.current.getSequenceSnapshot(),
        siteId: docRef.current.siteId,
    }), []);

    const resetDocument = useCallback(() => {
        const siteId = docRef.current.siteId;
        docRef.current = new RGADocument(siteId);
        lastInsertRef.current = null;
        pendingOpsRef.current = [];
        setText(docRef.current.toText());
    }, []);

    const getDebugInfo = useCallback(() => ({
        text: docRef.current.toText(),
        sequenceLength: docRef.current.getSequenceSnapshot().length,
        siteId: docRef.current.siteId,
        pendingOps: pendingOpsRef.current.length,
        isConnected,
        wsState: clientRef.current?.getState() || 'no client',
    }), [isConnected]);

    return {
        text,
        insertChar,
        deleteChar,
        isConnected,
        getText: () => docRef.current.toText(),
        getVisibleIdAtIndex,
        getDocumentState,
        resetDocument,
        getDebugInfo,
    };
}