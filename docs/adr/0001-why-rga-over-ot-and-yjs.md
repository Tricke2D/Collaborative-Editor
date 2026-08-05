# ADR 0001: Why RGA over OT and Yjs

## Context
Kita perlu memilih algoritma CRDT untuk collaborative editor.

## Decision
Pilih RGA custom-built.

## Rationale
1. OT (Operational Transformation): kompleks, butuh transform function, rawan bug
2. Yjs: black-box, tujuan project ini belajar internal CRDT
3. RGA: sederhana, deterministic, cocok untuk eventual consistency

## Consequences
- Harus implementasi sendiri (lebih banyak kode)
- Dapat kontrol penuh atas optimasi
- Paham internal CRDT secara mendalam