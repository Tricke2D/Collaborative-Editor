/**
 * rga-document.test.ts
 * -----------------------------------------------------------------------
 * Test suite RGADocument. Test PALING PENTING ada di bagian:
 * 1. CONVERGENCE test — memverifikasi properti utama CRDT
 * 2. DELETE test — memverifikasi tombstone behavior
 * 3. Complex scenario — insert + delete campuran
 */
import { describe, it, expect, beforeEach } from "vitest";
import { RGADocument } from "./rga-document";

describe("RGADocument — insertLocal", () => {
    let doc: RGADocument;

    beforeEach(() => {
        doc = new RGADocument("site-a");
    });

    it("insert karakter pertama di posisi awal (afterId = null)", () => {
        doc.insertLocal(null, "H");
        expect(doc.toText()).toBe("H");
    });

    it("insert berurutan membentuk string yang benar", () => {
        const opH = doc.insertLocal(null, "H");
        doc.insertLocal(opH.id, "I");
        expect(doc.toText()).toBe("HI");
    });

    it("insert 3 karakter berurutan", () => {
        const op1 = doc.insertLocal(null, "A");
        const op2 = doc.insertLocal(op1.id, "B");
        const op3 = doc.insertLocal(op2.id, "C");
        expect(doc.toText()).toBe("ABC");
    });
});

describe("RGADocument — CONVERGENCE (properti terpenting CRDT)", () => {
    it("2 site insert karakter berbeda di posisi SAMA secara concurrent → hasil akhir identik, terlepas urutan penerimaan operation", () => {
        // Dokumen kosong. Site A dan Site B SAMA-SAMA insert setelah null
        // (posisi awal) secara bersamaan — khas race condition real-time editing.
        const docA = new RGADocument("site-a");
        const docB = new RGADocument("site-b");

        const opFromA = docA.insertLocal(null, "A");
        const opFromB = docB.insertLocal(null, "B");

        // Replica A terima operation dari B SETELAH punya sendiri
        docA.applyRemoteInsert(opFromB.id, opFromB.originId, opFromB.value);
        // Replica B terima operation dari A SETELAH punya sendiri
        docB.applyRemoteInsert(opFromA.id, opFromA.originId, opFromA.value);

        // 🔑 ASSERTION UTAMA: hasil akhir HARUS identik di kedua replica.
        expect(docA.toText()).toBe(docB.toText());
    });

    it("convergen juga saat urutan penerimaan operation dibalik total", () => {
        const docA = new RGADocument("site-a");
        const docB = new RGADocument("site-b");

        const opFromA = docA.insertLocal(null, "A");
        const opFromB = docB.insertLocal(null, "B");

        docB.applyRemoteInsert(opFromA.id, opFromA.originId, opFromA.value);
        docA.applyRemoteInsert(opFromB.id, opFromB.originId, opFromB.value);

        expect(docA.toText()).toBe(docB.toText());
    });

    it("3 site concurrent insert di posisi sama → semua konvergen", () => {
        const sites = ["site-a", "site-b", "site-c"].map((id) => new RGADocument(id));
        const ops = sites.map((doc) => doc.insertLocal(null, doc["siteId"].slice(-1).toUpperCase()));

        // Broadcast semua operation ke semua site (termasuk diri sendiri)
        for (let i = 0; i < sites.length; i++) {
            for (let j = 0; j < ops.length; j++) {
                if (i !== j) {
                    sites[i]!.applyRemoteInsert(ops[j]!.id, ops[j]!.originId, ops[j]!.value);
                }
            }
        }

        // Semua site harus punya hasil yang sama
        const results = sites.map((doc) => doc.toText());
        for (let i = 1; i < results.length; i++) {
            expect(results[i]).toBe(results[0]);
        }
    });
});

describe("RGADocument — delete (tombstone)", () => {
    it("karakter yang di-delete tidak muncul di toText, tapi tetap ada di sequence (tombstone)", () => {
        const doc = new RGADocument("site-a");
        const op = doc.insertLocal(null, "X");
        doc.deleteLocal(op.id);

        expect(doc.toText()).toBe("");
        expect(doc.getSequenceSnapshot()).toHaveLength(1); // tombstone, bukan dihapus fisik
        expect(doc.getSequenceSnapshot()[0]!.isDeleted).toBe(true);
    });

    it("delete karakter di tengah tidak merusak karakter lain", () => {
        const doc = new RGADocument("site-a");
        const opH = doc.insertLocal(null, "H");
        const opE = doc.insertLocal(opH.id, "E");
        doc.insertLocal(opE.id, "Y"); // "HEY"

        doc.deleteLocal(opE.id); // hapus "E"
        expect(doc.toText()).toBe("HY");

        // Verifikasi node "E" tetap ada sebagai tombstone
        const sequence = doc.getSequenceSnapshot();
        expect(sequence).toHaveLength(3);
        expect(sequence[1]!.value).toBe("E");
        expect(sequence[1]!.isDeleted).toBe(true);
    });

    it("delete node yang belum ada (remote delete sebelum insert) — aman no-op", () => {
        const doc = new RGADocument("site-a");
        const fakeId = { siteId: "site-b", counter: 1 };

        // Delete sebelum insert datang → tidak crash
        doc.applyRemoteDelete(fakeId);
        expect(doc.toText()).toBe("");

        // Insert datang belakangan
        doc.applyRemoteInsert(fakeId, null, "Z");
        expect(doc.toText()).toBe("Z"); // Node baru muncul, bukan tombstone
    });

    it("multiple delete pada node yang sama aman (idempotent)", () => {
        const doc = new RGADocument("site-a");
        const op = doc.insertLocal(null, "X");

        doc.deleteLocal(op.id);
        doc.deleteLocal(op.id); // Delete kedua kalinya
        doc.applyRemoteDelete(op.id); // Delete ketiga kalinya dari remote

        expect(doc.toText()).toBe("");
        expect(doc.getSequenceSnapshot()[0]!.isDeleted).toBe(true);
    });
});

describe("RGADocument — convergence dengan delete", () => {
    it("insert lalu delete oleh site berbeda tetap convergent", () => {
        const docA = new RGADocument("site-a");
        const docB = new RGADocument("site-b");

        // Site A insert "Z"
        const opInsert = docA.insertLocal(null, "Z");
        docB.applyRemoteInsert(opInsert.id, opInsert.originId, opInsert.value);

        expect(docA.toText()).toBe("Z");
        expect(docB.toText()).toBe("Z");

        // Site B delete "Z"
        docB.deleteLocal(opInsert.id);
        docA.applyRemoteDelete(opInsert.id);

        expect(docA.toText()).toBe("");
        expect(docB.toText()).toBe("");
        expect(docA.toText()).toBe(docB.toText());
    });

    it("complex scenario: insert, delete, insert lagi secara concurrent", () => {
        const docA = new RGADocument("site-a");
        const docB = new RGADocument("site-b");

        // 1. Site A insert "A"
        const opA = docA.insertLocal(null, "A");
        docB.applyRemoteInsert(opA.id, opA.originId, opA.value);
        expect(docA.toText()).toBe("A");
        expect(docB.toText()).toBe("A");

        // 2. Site B insert "B" di posisi awal (concurrent)
        const opB = docB.insertLocal(null, "B");
        docA.applyRemoteInsert(opB.id, opB.originId, opB.value);

        // Hasil: "BA" (B lebih besar ID-nya)
        expect(docA.toText()).toBe("BA");
        expect(docB.toText()).toBe("BA");

        // 3. Site A delete "B" (punya site B)
        docA.deleteLocal(opB.id);
        docB.applyRemoteDelete(opB.id);

        // 4. Site B insert "C" setelah "A" (posisi: setelah A)
        const opC = docB.insertLocal(opA.id, "C");
        docA.applyRemoteInsert(opC.id, opC.originId, opC.value);

        // Hasil akhir harus: "AC" (B dihapus)
        expect(docA.toText()).toBe("AC");
        expect(docB.toText()).toBe("AC");
        expect(docA.toText()).toBe(docB.toText());
    });

    it("delete di site A, insert di site B dengan originId merujuk ke node yang di-delete", () => {
        const docA = new RGADocument("site-a");
        const docB = new RGADocument("site-b");

        // Site A: insert "X"
        const opX = docA.insertLocal(null, "X");
        docB.applyRemoteInsert(opX.id, opX.originId, opX.value);
        expect(docA.toText()).toBe("X");
        expect(docB.toText()).toBe("X");

        // Site A: delete "X"
        docA.deleteLocal(opX.id);
        docB.applyRemoteDelete(opX.id);
        expect(docA.toText()).toBe("");
        expect(docB.toText()).toBe("");

        // Site B: insert "Y" setelah "X" (walau X udah di-delete)
        // Di CRDT, node X tetap ada sebagai tombstone, jadi originId-nya valid
        const opY = docB.insertLocal(opX.id, "Y");
        docA.applyRemoteInsert(opY.id, opY.originId, opY.value);

        // Hasil akhir: "Y" (X tombstone tidak tampil)
        expect(docA.toText()).toBe("Y");
        expect(docB.toText()).toBe("Y");
        expect(docA.toText()).toBe(docB.toText());

        // Verifikasi X tetap ada di sequence sebagai tombstone
        expect(docA.getSequenceSnapshot()).toHaveLength(2);
        expect(docA.getSequenceSnapshot()[0]!.value).toBe("X");
        expect(docA.getSequenceSnapshot()[0]!.isDeleted).toBe(true);
        expect(docA.getSequenceSnapshot()[1]!.value).toBe("Y");
        expect(docA.getSequenceSnapshot()[1]!.isDeleted).toBe(false);
    });
});

describe("RGADocument — getVisibleIdAtIndex", () => {
    it("mengembalikan ID yang benar untuk setiap visible character", () => {
        const doc = new RGADocument("site-a");
        const op1 = doc.insertLocal(null, "A");
        const op2 = doc.insertLocal(op1.id, "B");
        const op3 = doc.insertLocal(op2.id, "C");

        expect(doc.getVisibleIdAtIndex(0)).toEqual(op1.id);
        expect(doc.getVisibleIdAtIndex(1)).toEqual(op2.id);
        expect(doc.getVisibleIdAtIndex(2)).toEqual(op3.id);
        expect(doc.getVisibleIdAtIndex(3)).toBeNull();
    });

    it("skip tombstone saat menghitung index", () => {
        const doc = new RGADocument("site-a");
        const op1 = doc.insertLocal(null, "A");
        const op2 = doc.insertLocal(op1.id, "B");
        const op3 = doc.insertLocal(op2.id, "C");

        // Delete "B" (tombstone)
        doc.deleteLocal(op2.id);

        // Sekarang hanya "A" dan "C" yang visible
        expect(doc.getVisibleIdAtIndex(0)).toEqual(op1.id);
        expect(doc.getVisibleIdAtIndex(1)).toEqual(op3.id);
        expect(doc.getVisibleIdAtIndex(2)).toBeNull();
    });
});