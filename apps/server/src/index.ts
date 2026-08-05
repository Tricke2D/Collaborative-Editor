/**
 * index.ts
 * -----------------------------------------------------------------------
 * Entry point aplikasi backend — load env vars lalu start WS server.
 */
import "dotenv/config";
import { startWebSocketServer } from "./ws/server";

startWebSocketServer();