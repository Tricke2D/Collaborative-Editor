# RGA Algorithm Design — Collaborative Editor

## 1. Struktur Identifier
Setiap karakter punya ID unik: `{ siteId: string, counter: number }`
- siteId: unik per client
- counter: logical clock lokal

## 2. Struktur Node
{ id, originId, value, isDeleted }
- originId = ID karakter SEBELUM node ini
- originId = null → node di awal dokumen

## 3. Aturan Total Order (Tie-Break)
Node dengan Identifier LEBIH BESAR diletakkan LEBIH DEKAT ke origin.
Perbandingan: counter dulu, fallback siteId.

## 4. Delete = Tombstone
Karakter tidak dihapus fisik, hanya ditandai isDeleted=true.