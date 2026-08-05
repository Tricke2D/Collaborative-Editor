/**
 * websocket-client.ts
 * Wrapper untuk browser WebSocket API dengan reconnect yang aman.
 */
import { serializeOperation, type Operation } from "@collab-editor/crdt-core";

type IncomingMessage = Operation | { type: "sync"; operations: Operation[] };

export class CollabWebSocketClient {
    private socket: WebSocket | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private isConnecting = false;
    private isClosed = false;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 10;

    constructor(
        private wsUrl: string,
        private documentId: string,
        private onMessage: (message: IncomingMessage) => void,
        private onConnect?: () => void,
        private onDisconnect?: () => void
    ) {
        console.log("[ws] 🆕 client created");
        this.wsUrl = wsUrl.replace(/\/$/, '');
        this.connect();
    }

    private connect(): void {
        if (this.isClosed) {
            console.log("[ws] ⏭️ client is closed, not connecting");
            return;
        }

        if (this.isConnecting) {
            console.log("[ws] ⏭️ already connecting");
            return;
        }

        if (this.socket) {
            console.log("[ws] 🧹 cleaning up existing socket");
            try {
                this.socket.onopen = null;
                this.socket.onmessage = null;
                this.socket.onerror = null;
                this.socket.onclose = null;
                this.socket.close();
            } catch (e) {}
            this.socket = null;
        }

        this.isConnecting = true;

        try {
            console.log(`[ws] 🔌 connecting to ${this.wsUrl}...`);
            this.socket = new WebSocket(this.wsUrl);
            this.socket.onopen = this.handleOpen.bind(this);
            this.socket.onmessage = this.handleMessage.bind(this);
            this.socket.onerror = this.handleError.bind(this);
            this.socket.onclose = this.handleClose.bind(this);
        } catch (err) {
            console.error("[ws] ❌ connection error:", err);
            this.isConnecting = false;
            this.scheduleReconnect();
        }
    }

    private handleOpen(): void {
        console.log("[ws] ✅ connected to server");
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        if (this.isClosed) {
            console.log("[ws] ⏭️ client is closed, closing new connection");
            this.socket?.close();
            return;
        }

        const joinMsg = JSON.stringify({ type: "join", documentId: this.documentId });
        console.log(`[ws] 📤 sending join: ${joinMsg}`);
        this.socket?.send(joinMsg);
        this.onConnect?.();
    }

    private handleMessage(event: MessageEvent): void {
        if (this.isClosed) {
            console.log("[ws] ⏭️ skipping message (client closed)");
            return;
        }

        try {
            const data = JSON.parse(event.data as string);
            console.log(`[ws] 📥 received:`, data);

            // ⭐ FORWARD TO HOOK
            console.log("[ws] 📤 📤 📤 FORWARDING TO HOOK CALLBACK 📤 📤 📤");

            if (typeof this.onMessage === 'function') {
                this.onMessage(data);
                console.log("[ws] ✅ hook callback executed successfully");
            } else {
                console.error("[ws] ❌ onMessage is not a function!");
            }
        } catch (err) {
            console.error("[ws] ❌ failed to parse message:", err);
        }
    }

    private handleError(event: Event): void {
        console.error("[ws] ❌ error:", event);
        this.isConnecting = false;
    }

    private handleClose(event: CloseEvent): void {
        console.log(`[ws] 🔌 disconnected (code: ${event.code})`);
        this.isConnecting = false;
        this.socket = null;

        if (event.code === 1000 || this.isClosed) {
            console.log("[ws] ⏭️ intentional close, not reconnecting");
            this.onDisconnect?.();
            return;
        }

        this.scheduleReconnect();
    }

    private scheduleReconnect(): void {
        if (this.isClosed) {
            console.log("[ws] ⏭️ client is closed, not reconnecting");
            return;
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log(`[ws] ❌ max reconnect attempts reached`);
            this.isClosed = true;
            return;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;

        console.log(`[ws] 🔄 reconnecting in ${delay}ms...`);
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }

    send(operation: Operation): void {
        if (this.isClosed) {
            console.warn("[ws] ⚠️ client is closed, dropping message");
            return;
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn(`[ws] ⚠️ socket not open, dropping message`);
            return;
        }

        const msg = serializeOperation(operation);
        console.log(`[ws] 📤 sending: ${msg.substring(0, 80)}...`);
        this.socket.send(msg);
    }

    close(): void {
        console.log("[ws] 🧹 closing client");
        this.isClosed = true;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.socket) {
            try {
                this.socket.onopen = null;
                this.socket.onmessage = null;
                this.socket.onerror = null;
                this.socket.onclose = null;
                if (this.socket.readyState === WebSocket.OPEN) {
                    this.socket.close(1000, "normal close");
                } else {
                    this.socket.close();
                }
            } catch (e) {}
            this.socket = null;
        }

        console.log("[ws] ✅ client closed");
    }

    isConnected(): boolean {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN && !this.isClosed;
    }

    getState(): string {
        if (this.isClosed) return "closed";
        if (!this.socket) return "disconnected";
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING: return "connecting";
            case WebSocket.OPEN: return "open";
            case WebSocket.CLOSING: return "closing";
            case WebSocket.CLOSED: return "closed";
            default: return "unknown";
        }
    }
}