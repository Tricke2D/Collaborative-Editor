📝 Collaborative Editor (CRDT) — Real-Time Collaborative Editor
CRDT-based Collaborative Editor | Real-Time Sync | Eventual Consistency | 100% TypeScript

https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white
https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white
https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white
https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white
https://img.shields.io/badge/WebSocket-Protocol-000000?logo=websocket&logoColor=white
https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white

📋 Table of Contents
📍 Studi Kasus

✨ Fitur Utama

🏗️ Arsitektur Sistem

🛠️ Tech Stack

💻 Requirements

🚀 Instalasi & Menjalankan

🧪 Testing

📊 Monitoring & Observability

📊 Hasil Eksperimen

⚠️ Batasan & Pengembangan Selanjutnya

🚀 Rencana Pengembangan

📍 Studi Kasus
Bayangkan kamu dan tim sedang mengerjakan dokumen bersama secara real-time—seperti Google Docs. Setiap orang mengetik, menghapus, dan mengedit secara bersamaan. Namun tanpa sistem yang tepat, terjadi:

❌ Conflict chaos — Editan satu orang menimpa editan orang lain

❌ Lost updates — Perubahan hilang karena overwrite

❌ No sync — Dokumen berbeda antara satu user dan user lain

❌ No history — Tidak tahu siapa yang mengubah apa dan kapan

❌ No persistence — Refresh browser = semua perubahan hilang

❌ No visibility — Tidak melihat posisi kursor user lain

Solusi:

Collaborative Editor adalah sistem real-time collaborative editing yang mengelola seluruh siklus hidup dokumen kolaboratif—dari operasi insert/delete, sinkronisasi antar client, hingga persistence—dengan:

✅ CRDT Engine (RGA) — Conflict-free Replicated Data Type, tidak ada conflict resolution yang rumit

✅ Real-time WebSocket — Perubahan disiarkan ke semua client dalam milidetik

✅ Optimistic UI — Perubahan langsung terlihat sebelum server merespon

✅ Automatic Convergence — Semua client selalu mencapai hasil akhir yang sama

✅ Tombstone Deletion — Delete tidak menghapus data fisik, aman untuk sync

✅ Operation Log — Setiap perubahan tersimpan di PostgreSQL

✅ Snapshot Mechanism — Load dokumen instan tanpa replay ribuan operasi

✅ Cursor Sync — Lihat posisi kursor user lain real-time

✅ Chaos Tested — Teruji dengan 20+ replica concurrent

Hasil: Dokumen 100% sinkron antar semua user, history lengkap, dan pengalaman kolaboratif seamless.

✨ Fitur Utama
🏗️ CRDT Core (RGA Algorithm)
RGA (Replicated Growable Array): Algoritma CRDT untuk sequence/teks

Total Order Deterministic: Semua replica menghasilkan urutan yang sama

Tombstone Deletion: Karakter tidak dihapus fisik, hanya ditandai

Insert/Delete Operation: Operasi dasar editing

Concurrent Conflict Resolution: Tie-break berdasarkan Identifier

🚀 Real-Time Sync
WebSocket Server: Raw WebSocket protocol (ws library)

Room Management: Per dokumen = satu room

Broadcast: Perubahan dikirim ke semua client di room yang sama

SenderId Filter: Operasi dari self di-skip (prevent echo)

Auto-Reconnect: Client reconnect otomatis jika koneksi putus

📨 Data Persistence
PostgreSQL: Metadata + Operation Log

Operation Repository: Simpan setiap insert/delete ke database

Snapshot Mechanism: Materialized state setiap 1000 operasi

Hydrate from Snapshot: Load dokumen dari snapshot + replay delta

DocumentStateManager: In-memory cache per dokumen aktif

🎯 Killer Features
Snapshot Load: Client baru dapat state instan (bukan replay total)

Cursor Sync: Lihat posisi kursor user lain real-time

SessionStorage SiteId: Setiap tab punya identitas unik

Optimistic Updates: Perubahan langsung muncul di UI sebelum server merespon

Chaos Test: 20+ replica concurrent dengan random delivery order

📊 Read Models (Frontend)
Read Model	Fungsi
text	Isi dokumen saat ini
sequenceSnapshot	Full node array (termasuk tombstone)
siteId	Identitas replica unik per tab
remoteCursors	Posisi kursor user lain
🏗️ Arsitektur Sistem
text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Collaborative Editor (CRDT)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────┐     ┌─────────────┐     ┌─────────────┐                     │
│  │  Browser   │────▶│  WebSocket  │────▶│  Room       │                     │
│  │  Tab A     │     │  Server     │     │  Manager    │                     │
│  │  (React)   │     │  (Node.js)  │     │             │                     │
│  └────────────┘     └─────────────┘     └──────┬──────┘                     │
│                                                  │                          │
│  ┌────────────┐     ┌─────────────┐            │                            │
│  │  Browser   │────▶│  Document   │◀────────────┘                           │
│  │  Tab B     │     │  State      │                                         │
│  │  (React)   │     │  Manager    │                                         │
│  └────────────┘     └──────┬──────┘                                         │
│                             │                                               │
│                             ▼                                               │
│                      ┌──────────────┐  ┌──────────────┐                     │
│                      │ PostgreSQL   │  │ CRDT Engine  │                     │
│                      │ Operations   │  │ (RGA)        │                     │
│                      │ Snapshots    │  │              │                     │
│                      └──────────────┘  └──────────────┘                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Data Flow                                      │    │
│  │  1. User types → 2. CRDT local insert → 3. Optimistic UI update    │     │
│  │  4. Send operation via WebSocket → 5. Server broadcast to room     │     │
│  │  6. Other client receive → 7. CRDT remote insert → 8. UI update    │     │
│  │  9. Persist to PostgreSQL → 10. Snapshot tiap 1000 operasi         │     │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
🛠️ Tech Stack
Komponen	Teknologi
Backend	Node.js 20 + TypeScript + WebSocket (ws)
Database	PostgreSQL 16 (Operations + Snapshots)
Frontend	React 18 + TypeScript + Vite
Styling	Vanilla CSS / TailwindCSS
CRDT Engine	Custom RGA (Replicated Growable Array)
Validation	Zod (Runtime schema validation)
Testing	Vitest (Unit + Integration + Chaos)
Containerization	Docker + Docker Compose
💻 Requirements
Node.js: v20.x atau lebih baru

pnpm: v9.x atau lebih baru

Docker: v20.x atau lebih baru (PostgreSQL)

Browser: Chrome/Edge/Firefox terbaru

🚀 Instalasi & Menjalankan
1. Clone Repository
   bash
   git clone https://github.com/yourusername/colab-editor.git
   cd colab-editor
2. Setup Environment
   bash
# Install pnpm (jika belum)
npm install -g pnpm

# Install dependencies
pnpm install
3. Setup Struktur Project
   bash
# Buat folder yang diperlukan
mkdir -p packages/crdt-core/src
mkdir -p apps/server/src/{ws,db}
mkdir -p apps/web/src/{components,hooks,lib}
mkdir -p docker/postgres
mkdir -p docs/adr
4. Konfigurasi .env
   bash
# Backend .env
cp apps/server/.env.example apps/server/.env

# Frontend .env
cp apps/web/.env.example apps/web/.env
5. Jalankan Infrastruktur (Docker Compose)
   bash
   docker compose up -d postgres
6. Setup Database Schema
   bash
# Jalankan init.sql
docker exec -i collab-editor-postgres psql -U collab_editor -d collab_editor_dev < docker/postgres/init.sql
7. Jalankan Backend
   bash
# Terminal 1: Backend
pnpm dev:server
8. Jalankan Frontend
   bash
# Terminal 2: Frontend
pnpm dev:web
9. Akses Aplikasi
   Service	URL
   Backend WebSocket	ws://localhost:8080
   Frontend	http://localhost:5173
   🧪 Testing
   Unit Tests (CRDT Core)
   bash
# Test CRDT engine (Fase 1)
pnpm --filter @collab-editor/crdt-core test
Hasil: 29 tests PASS

Integration Tests (Server)
bash
# Test WebSocket + Database
pnpm --filter @collab-editor/server test
Chaos Tests
bash
# 20+ replica concurrent with random delivery order
pnpm --filter @collab-editor/crdt-core test chaos
📊 Monitoring & Observability
PostgreSQL Monitoring
bash
# Check operations
docker exec -it collab-editor-postgres psql -U collab_editor -d collab_editor_dev -c "SELECT * FROM operations;"

# Check snapshots
docker exec -it collab-editor-postgres psql -U collab_editor -d collab_editor_dev -c "SELECT * FROM document_snapshots;"

# Check table list
docker exec -it collab-editor-postgres psql -U collab_editor -d collab_editor_dev -c "\dt"
WebSocket Monitoring
Backend log akan menampilkan:

[ws] server listening on ws://localhost:8080

[ws] new client connected

[RoomManager] join: demo-doc-1, size: 2

Frontend Debug
Buka DevTools (F12) → Console:

[hook] 🔄 render, siteId: site-xxx, connected: true, text: "hello"

[hook] 📤 sending via WebSocket

[hook] ✅ applying remote op from: site-yyy

📊 Hasil Eksperimen
(a) CRDT Convergence Test
Skenario	Result	Status
2 site insert concurrent di posisi sama	Identik	✅
Insert + delete mixed	Identik	✅
3 site concurrent insert	Semua konvergen	✅
Remote delete sebelum insert	No-op aman	✅
(b) Performance Test
Metrik	Hasil	Status
Local insert latency	< 10ms	✅
WebSocket broadcast	< 50ms	✅
Snapshot load (1000 ops)	< 100ms	✅
Frontend render	< 16ms	✅
Chaos test (20 replica × 200 ops)	< 5s	✅
(c) Chaos Test Results
Skenario	Result	Status
20 replica, 200 ops, random order	Semua convergent	✅
Insert + delete random	Semua convergent	✅
Network jitter (5 clients)	Semua convergent	✅
⚠️ Batasan & Pengembangan Selanjutnya
Authentication: Belum ada — perlu ditambahkan untuk production

Rich Text: Saat ini hanya plain text — bisa ditambah bold/italic

Multi-document: Saat ini single document — bisa ditambah routing

Cursor TTL: Cursor remote tidak hilang otomatis saat disconnect

Undo/Redo: Belum ada — CRDT punya karakteristik unik untuk undo

🚀 Rencana Pengembangan
□ Authentication & Authorization (JWT)
□ Multi-document routing
□ Rich text formatting (bold, italic, underline)
□ Undo/Redo functionality
□ Cursor TTL (auto-hilang saat disconnect)
□ Production deployment (Fly.io/Railway)
□ E2E Testing (Playwright)
□ CI/CD Pipeline (GitHub Actions)
📊 Hasil Eksperimen & Demo
Demo Screenshot
text
Collaborative Editor — 2 Tabs

Tab 1 (site-2b8b9c0d)          Tab 2 (site-db0399d4)
┌─────────────────────────┐    ┌─────────────────────────┐
│ Hello World!            │    │ Hello World!            │
│                         │    │                         │
│ [cursor at position 6]  │    │ [cursor at position 6]  │
└─────────────────────────┘    └─────────────────────────┘

✅ Real-time sync ✅
✅ Cursor sync ✅
✅ Delete sync ✅
✅ Refresh restore ✅
📞 Kontak & Kontribusi
Repository: https://github.com/yourusername/colab-editor

Live Demo: (coming soon)

Email: your.email@example.com

Contributions are welcome! Silakan fork repository ini dan submit pull request. 😊