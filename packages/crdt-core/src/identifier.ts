/**
 * identifier.ts
 * -----------------------------------------------------------------------
 * Merepresentasikan ID unik untuk setiap karakter dalam dokumen CRDT.
 *
 * Setiap karakter yang diketik user diberi ID unik:
 *   { siteId: string, counter: number }
 *
 * - siteId   : identitas unik tiap client/tab (mis. "site-a1b2c3")
 * - counter  : logical clock lokal, selalu naik tiap site tsb bikin
 *              karakter baru — TIDAK PERNAH reset/reuse walau karakter
 *              yang bersangkutan kemudian di-delete.
 *
 * Kombinasi (siteId, counter) dijamin GLOBALLY UNIQUE selama tiap site
 * generate siteId unik saat pertama connect.
 *
 * ID ini juga dipakai sebagai TOTAL ORDER key untuk tie-break saat dua
 * site insert karakter di posisi yang sama secara bersamaan.
 */

export interface Identifier {
    readonly siteId: string;
    readonly counter: number;
}

/**
 * compareIdentifier
 * -----------------------------------------------------------------------
 * Membandingkan dua Identifier untuk menentukan total order deterministik
 * yang SAMA di semua replica (client) — inti dari kenapa CRDT bisa
 * convergent tanpa central lock.
 *
 * Aturan:
 *  1. Bandingkan counter dulu (angka lebih besar = "menang")
 *  2. Kalau counter sama, fallback ke siteId alphabetical (tie-break
 *     deterministik untuk edge case yang jarang terjadi)
 *
 * @returns 1 kalau a > b, -1 kalau a < b, 0 kalau identik
 */
export function compareIdentifier(a: Identifier, b: Identifier): number {
    if (a.counter !== b.counter) {
        return a.counter > b.counter ? 1 : -1;
    }
    if (a.siteId === b.siteId) return 0;
    return a.siteId > b.siteId ? 1 : -1;
}

/**
 * identifiersEqual
 * -----------------------------------------------------------------------
 * Equality check untuk Identifier (termasuk handle kasus null, karena
 * originId boleh null yang berarti "posisi paling awal dokumen").
 */
export function identifiersEqual(
    a: Identifier | null,
    b: Identifier | null
): boolean {
    if (a === null || b === null) return a === b;
    return a.siteId === b.siteId && a.counter === b.counter;
}