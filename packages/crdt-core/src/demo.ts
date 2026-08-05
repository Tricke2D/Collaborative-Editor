/**
 * demo.ts - Simulasi CRDT
 */
import { RGADocument } from "./rga-document";
import type { Operation } from "./operation";

const siteA = new RGADocument("site-a");
const siteB = new RGADocument("site-b");

console.log("=== Simulasi Concurrent Insert ===\n");

// Site A insert "A"
const opA = siteA.insertLocal(null, "A");
console.log(`Site A insert "A" → "${siteA.toText()}"`);

// Site B insert "B" (concurrent)
const opB = siteB.insertLocal(null, "B");
console.log(`Site B insert "B" → "${siteB.toText()}"`);

// ⭐ Operation dengan senderId untuk demo
const opAWithSender: Operation = {
    type: "insert",
    id: opA.id,
    value: opA.value,
    originId: opA.originId,
    documentId: "demo-doc",
    timestamp: Date.now(),
    senderId: "site-a", // ⭐ tambah senderId
};

const opBWithSender: Operation = {
    type: "insert",
    id: opB.id,
    value: opB.value,
    originId: opB.originId,
    documentId: "demo-doc",
    timestamp: Date.now(),
    senderId: "site-b", // ⭐ tambah senderId
};

// Sinkronisasi
siteA.applyRemoteInsert(opBWithSender.id, opBWithSender.originId, opBWithSender.value);
siteB.applyRemoteInsert(opAWithSender.id, opAWithSender.originId, opAWithSender.value);

console.log(`Setelah sync:`);
console.log(`Site A: "${siteA.toText()}"`);
console.log(`Site B: "${siteB.toText()}"`);

if (siteA.toText() === siteB.toText()) {
    console.log("\n✅ CONVERGENT — Hasil identik!");
} else {
    console.log("\n❌ DIVERGENT — Ada bug!");
}