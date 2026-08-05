/**
 * rga-node.ts
 * -----------------------------------------------------------------------
 * Representasi 1 node/karakter di dalam struktur RGA.
 *
 * PENTING: RGA tidak menyimpan "posisi index" secara langsung. Posisi
 * sebuah karakter ditentukan oleh URUTANNYA dalam sequence array, BUKAN
 * angka index yang di-assign manual — supaya insert di tengah dokumen
 * tidak perlu "menggeser" ID node lain (beda dengan array biasa/index-based).
 */

import type { Identifier } from "./identifier";

export interface RGANode {
    readonly id: Identifier; // ID unik & permanen, tidak pernah berubah
    readonly originId: Identifier | null; // ID node sebelum ini saat pertama kali di-insert
    value: string; // karakter aktual, mis "H" — tetap disimpan walau tombstone
    isDeleted: boolean; // tombstone flag
}