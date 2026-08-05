/**
 * identifier.test.ts
 * -----------------------------------------------------------------------
 * Unit test untuk compareIdentifier & identifiersEqual — paling krusial
 * karena SELURUH correctness algoritma RGA bergantung pada konsistensi
 * total order ini.
 */
import { describe, it, expect } from "vitest";
import { compareIdentifier, identifiersEqual } from "./identifier";

describe("compareIdentifier", () => {
    it("membandingkan berdasarkan counter dulu", () => {
        const a = { siteId: "site-b", counter: 1 };
        const b = { siteId: "site-a", counter: 2 };
        expect(compareIdentifier(b, a)).toBe(1); // counter 2 > 1, walau "a" < "b" alfabetis
    });

    it("fallback ke siteId kalau counter sama", () => {
        const a = { siteId: "site-a", counter: 5 };
        const b = { siteId: "site-b", counter: 5 };
        expect(compareIdentifier(b, a)).toBe(1); // "site-b" > "site-a"
        expect(compareIdentifier(a, b)).toBe(-1);
    });

    it("return 0 untuk identifier identik", () => {
        const a = { siteId: "site-a", counter: 5 };
        expect(compareIdentifier(a, { ...a })).toBe(0);
    });
});

describe("identifiersEqual", () => {
    it("true untuk dua null", () => {
        expect(identifiersEqual(null, null)).toBe(true);
    });

    it("false kalau salah satu null", () => {
        expect(identifiersEqual(null, { siteId: "a", counter: 1 })).toBe(false);
    });

    it("true untuk identifier yang sama", () => {
        const a = { siteId: "site-a", counter: 1 };
        const b = { siteId: "site-a", counter: 1 };
        expect(identifiersEqual(a, b)).toBe(true);
    });

    it("false untuk identifier beda siteId", () => {
        const a = { siteId: "site-a", counter: 1 };
        const b = { siteId: "site-b", counter: 1 };
        expect(identifiersEqual(a, b)).toBe(false);
    });

    it("false untuk identifier beda counter", () => {
        const a = { siteId: "site-a", counter: 1 };
        const b = { siteId: "site-a", counter: 2 };
        expect(identifiersEqual(a, b)).toBe(false);
    });
});