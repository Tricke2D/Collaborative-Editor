# 📝 Collaborative Editor (CRDT)

> **Real-Time Collaborative Editor** built with **Conflict-free Replicated Data Types (CRDT)** using the **Replicated Growable Array (RGA)** algorithm, enabling multiple users to edit the same document simultaneously with **strong eventual consistency**, **real-time synchronization**, and **persistent operation history**.

<p align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Protocol-000000?logo=websocket&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)

</p>

---

## 📖 Overview

Collaborative Editor is a real-time collaborative text editor inspired by systems such as **Google Docs**, built using **Conflict-free Replicated Data Types (CRDT)** instead of Operational Transformation (OT).

The project demonstrates how distributed replicas can independently process insert and delete operations while eventually converging to the exact same document state without requiring complex conflict resolution algorithms.

The implementation combines:

- **CRDT (Replicated Growable Array / RGA)**
- **WebSocket-based real-time synchronization**
- **PostgreSQL persistence**
- **Snapshot mechanism**
- **Optimistic UI updates**
- **Concurrent editing**
- **Cursor synchronization**
- **Chaos testing**

---

# 📑 Table of Contents

- [📖 Overview](#-overview)
- [🎯 Case Study](#-case-study)
- [✨ Features](#-features)
- [🏗️ System Architecture](#️-system-architecture)
- [⚙️ Technology Stack](#️-technology-stack)
- [📦 Requirements](#-requirements)
- [🚀 Installation](#-installation)
- [🧪 Testing](#-testing)
- [📈 Monitoring](#-monitoring)
- [📊 Experimental Results](#-experimental-results)
- [⚠️ Limitations](#️-limitations)
- [🚀 Future Development](#-future-development)
- [🤝 Contributing](#-contributing)

---

# 🎯 Case Study

Imagine multiple users editing the same document simultaneously.

Without an appropriate synchronization mechanism, collaborative editing usually suffers from several problems:

| Problem | Description |
|----------|-------------|
| ❌ Conflict Chaos | Concurrent edits overwrite each other |
| ❌ Lost Updates | New changes disappear after synchronization |
| ❌ Inconsistent State | Every user sees a different document |
| ❌ No Persistence | Refreshing the browser removes all changes |
| ❌ No History | Previous operations cannot be reconstructed |
| ❌ No Cursor Awareness | Users cannot see collaborators' cursor positions |

---

## 💡 Proposed Solution

Collaborative Editor solves these issues by combining several distributed-system techniques:

- ✅ CRDT (Replicated Growable Array)
- ✅ Real-time WebSocket synchronization
- ✅ Optimistic UI
- ✅ Automatic convergence
- ✅ Tombstone deletion
- ✅ Persistent operation log
- ✅ Snapshot loading
- ✅ Cursor synchronization
- ✅ Chaos-tested concurrency

The result is a collaborative editing environment where every replica eventually converges to the same document regardless of operation ordering or network latency.

---

# ✨ Features

## 🏗️ CRDT Core (Replicated Growable Array)

The editor is powered by a custom implementation of the **Replicated Growable Array (RGA)**, a sequence-based CRDT that guarantees deterministic ordering across all replicas without centralized conflict resolution.

### Key Capabilities

| Feature | Description |
|----------|-------------|
| **Replicated Growable Array (RGA)** | Sequence CRDT optimized for collaborative text editing |
| **Deterministic Total Order** | Every replica produces the exact same ordering |
| **Insert Operation** | Concurrent character insertion |
| **Delete Operation** | Tombstone-based deletion |
| **Conflict Resolution** | Identifier-based ordering (no merge algorithm required) |
| **Strong Eventual Consistency** | All replicas eventually converge |

---

## 🚀 Real-Time Synchronization

The synchronization layer is implemented using the native **WebSocket protocol**.

Every editing operation is immediately propagated to all clients connected to the same collaborative document.

### Synchronization Features

| Feature | Description |
|----------|-------------|
| WebSocket Server | Raw WebSocket implementation (`ws`) |
| Room Management | One room per collaborative document |
| Broadcast | Send operations to every connected replica |
| Sender Filter | Ignore operations originating from the same client |
| Auto Reconnect | Automatic reconnection after disconnect |

---

## 📨 Data Persistence

Instead of storing only the latest document state, every operation is persisted.

This makes the editor capable of reconstructing any document version while supporting fast loading through snapshots.

### Persistence Components

| Component | Responsibility |
|------------|---------------|
| PostgreSQL | Store metadata and operations |
| Operation Repository | Persist insert/delete operations |
| Snapshot Mechanism | Materialize document state periodically |
| Snapshot Hydration | Load snapshot then replay remaining operations |
| Document State Manager | Maintain active document cache |

---

## 🎯 Killer Features

Unlike a simple collaborative editor, this implementation includes several production-inspired optimizations.

### ⚡ Snapshot Loading

Instead of replaying thousands of operations every time a user joins,

```
Snapshot
      +
Remaining Operations
      ↓
Current Document State
```

This dramatically reduces startup time.

---

### 👥 Cursor Synchronization

Users can see collaborators' cursor positions in real time.

```
User A
Hello |World

User B
Hello Wor|ld
```

---

### 🆔 Session-based Replica Identity

Each browser tab receives its own unique **Site ID** stored in **sessionStorage**.

Advantages:

- Different tabs behave as independent replicas.
- Closing a tab removes its identity.
- Prevents conflicts between multiple opened tabs.

---

### ⚡ Optimistic UI

User actions are immediately reflected on the interface before server acknowledgment.

```
Keyboard Input
      │
      ▼
Local CRDT Update
      │
      ▼
UI Updated Instantly
      │
      ▼
Send via WebSocket
      │
      ▼
Server Broadcast
```

This creates a highly responsive editing experience.

---

### 🧪 Chaos Tested

The CRDT implementation has been validated under concurrent editing scenarios involving:

- 20+ replicas
- Random network delay
- Random delivery order
- Concurrent insert/delete operations

The result remains identical across every replica.

---

# 📊 Frontend Read Models

The frontend maintains several read models that are continuously synchronized with the CRDT engine.

| Read Model | Purpose |
|------------|---------|
| **text** | Current visible document |
| **sequenceSnapshot** | Full CRDT sequence including tombstones |
| **siteId** | Replica identifier |
| **remoteCursors** | Cursor positions from collaborators |

---

# 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    Collaborative Editor (CRDT)                             │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Browser A (React)                                                          │
│        │                                                                   │
│        ▼                                                                   │
│ WebSocket Server                                                           │
│        │                                                                   │
│        ▼                                                                   │
│ Room Manager                                                               │
│        │                                                                   │
│        ▼                                                                   │
│ Document State Manager                                                     │
│      ┌──────┴────────┐                                                     │
│      ▼               ▼                                                     │
│ PostgreSQL       CRDT Engine (RGA)                                         │
│ Operations       Replica State                                             │
│ Snapshots        Ordering Logic                                            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

```

---

## 🔄 Data Flow

```
User Types
     │
     ▼
CRDT Local Insert
     │
     ▼
Optimistic UI Update
     │
     ▼
WebSocket Send
     │
     ▼
Server Broadcast
     │
     ▼
Remote Replica
     │
     ▼
CRDT Apply Remote Operation
     │
     ▼
UI Update
     │
     ▼
Persist to PostgreSQL
     │
     ▼
Snapshot (Every 1000 Operations)
```

---

# ⚙️ Technology Stack

| Layer | Technology |
|---------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js 20 + TypeScript |
| Communication | WebSocket (`ws`) |
| Database | PostgreSQL 16 |
| Validation | Zod |
| Testing | Vitest |
| CRDT Engine | Custom Replicated Growable Array |
| Containerization | Docker + Docker Compose |

---

# 📦 Requirements

Before running the project, ensure the following software is installed on your machine.

| Software | Version |
|-----------|----------|
| Node.js | 20.x or later |
| pnpm | 9.x or later |
| Docker | 20.x or later |
| Docker Compose | Latest |
| PostgreSQL | 16.x (via Docker) |
| Git | Latest |

---

# 📁 Project Structure

```
collab-editor/
│
├── apps/
│   ├── server/
│   │   ├── src/
│   │   │   ├── db/
│   │   │   ├── ws/
│   │   │   ├── repositories/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── pages/
│       │   └── App.tsx
│       │
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
│   └── crdt-core/
│       ├── src/
│       │   ├── model/
│       │   ├── operations/
│       │   ├── sequence/
│       │   └── tests/
│       │
│       └── package.json
│
├── docker/
│   └── postgres/
│       └── init.sql
│
├── docs/
│   └── adr/
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

# 🚀 Installation

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/collab-editor.git

cd collab-editor
```

---

## 2. Install pnpm

If pnpm is not installed:

```bash
npm install -g pnpm
```

Verify installation:

```bash
pnpm --version
```

---

## 3. Install Dependencies

```bash
pnpm install
```

This command installs dependencies for every workspace inside the monorepo.

---

## 4. Create Project Structure

If starting from scratch, create the required directories.

```bash
mkdir -p packages/crdt-core/src

mkdir -p apps/server/src/{ws,db}

mkdir -p apps/web/src/{components,hooks,lib}

mkdir -p docker/postgres

mkdir -p docs/adr
```

---

# ⚙️ Environment Configuration

## Backend Environment

```bash
cp apps/server/.env.example apps/server/.env
```

Example:

```env
PORT=8080

DATABASE_URL=postgres://collab_editor:password@localhost:5432/collab_editor_dev

SNAPSHOT_INTERVAL=1000
```

---

## Frontend Environment

```bash
cp apps/web/.env.example apps/web/.env
```

Example:

```env
VITE_WS_URL=ws://localhost:8080
```

---

# 🐳 Running PostgreSQL

Start PostgreSQL using Docker Compose.

```bash
docker compose up -d postgres
```

Verify the container is running.

```bash
docker ps
```

Expected output:

```
collab-editor-postgres
```

---

# 🗄️ Database Initialization

Initialize the database schema.

```bash
docker exec -i collab-editor-postgres \
psql \
-U collab_editor \
-d collab_editor_dev \
< docker/postgres/init.sql
```

The initialization script creates:

- Operations table
- Document snapshots table
- Required indexes
- Constraints

---

# ▶️ Running the Backend

Open a terminal.

Execute:

```bash
pnpm dev:server
```

Expected output:

```text
[ws] server listening on ws://localhost:8080
```

---

# 💻 Running the Frontend

Open another terminal.

```bash
pnpm dev:web
```

Expected output:

```
VITE v5.x ready in ...

➜ Local:
http://localhost:5173
```

---

# 🌐 Access the Application

| Service | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| WebSocket Server | ws://localhost:8080 |

---

# 🚀 First Run

Open the application in multiple browser tabs.

```
Tab 1
↓

Type "Hello"

↓

Operation Created

↓

Broadcast

↓

Tab 2 Receives Operation

↓

Document Updated
```

Both tabs should immediately display identical content.

---

# 📌 What Happens Internally?

```
Keyboard Input
      │
      ▼
React Editor
      │
      ▼
CRDT Engine
      │
      ▼
Optimistic Update
      │
      ▼
WebSocket Send
      │
      ▼
Backend
      │
      ▼
PostgreSQL Persistence
      │
      ▼
Broadcast
      │
      ▼
Other Clients
```

---

> 💡 **Tip**
>
> Open **two or more browser tabs** to experience real-time collaborative editing.
>
> Each tab automatically receives a unique **Site ID**, allowing it to function as an independent CRDT replica.
>
> # 🧪 Testing

The project includes multiple layers of testing to ensure correctness, convergence, performance, and reliability under concurrent editing scenarios.

---

## Unit Testing

Unit tests validate the correctness of the CRDT implementation in isolation.

### Run Unit Tests

```bash
pnpm --filter @collab-editor/crdt-core test
```

Expected output:

```text
✓ Insert Operation
✓ Delete Operation
✓ Identifier Ordering
✓ Tombstone Handling
✓ Sequence Traversal
✓ Concurrent Insert
✓ Concurrent Delete
✓ Replica Merge

Test Files: 12 passed
Tests:      29 passed
```

### What is Tested?

| Component | Description |
|------------|-------------|
| Character Node | Node creation and ordering |
| Identifier | Site ID and logical clock ordering |
| Insert Operation | Local and remote insertion |
| Delete Operation | Tombstone behavior |
| Traversal | Sequence reconstruction |
| Convergence | Replica synchronization |
| Serialization | Snapshot encoding |

---

# 🔗 Integration Testing

Integration tests validate communication between:

- React Client
- WebSocket Server
- PostgreSQL
- CRDT Engine

Run:

```bash
pnpm --filter @collab-editor/server test
```

Example scenarios:

- Client joins room
- Client disconnects
- Broadcast operations
- Snapshot loading
- Database persistence
- Cursor synchronization

---

# 🌪️ Chaos Testing

One of the most important parts of this project is **Chaos Testing**.

Instead of assuming operations always arrive in order, random delivery order is intentionally simulated.

```
Replica A

Insert A
        \
         \
          \
           Random Delay

Replica B

Insert B

↓

Random Delivery

↓

Replica Merge

↓

Same Final Document
```

Run:

```bash
pnpm --filter @collab-editor/crdt-core test chaos
```

Chaos test simulates:

- Random latency
- Packet reordering
- Concurrent insertion
- Concurrent deletion
- Multiple replicas
- Network jitter

---

## Chaos Test Configuration

| Parameter | Value |
|------------|------:|
| Replicas | 20 |
| Operations per Replica | 200 |
| Delivery Order | Random |
| Insert/Delete Ratio | Random |
| Expected Result | Deterministic Convergence |

---

# 📊 Test Coverage

| Module | Coverage |
|---------|---------:|
| CRDT Core | 100% |
| Operations | 100% |
| Sequence | 100% |
| Repository | High |
| WebSocket | High |

---

# 📈 Monitoring & Observability

The backend exposes sufficient logging to monitor synchronization.

---

## PostgreSQL Monitoring

Display every operation stored.

```bash
docker exec -it collab-editor-postgres \
psql \
-U collab_editor \
-d collab_editor_dev \
-c "SELECT * FROM operations;"
```

Check snapshots.

```bash
docker exec -it collab-editor-postgres \
psql \
-U collab_editor \
-d collab_editor_dev \
-c "SELECT * FROM document_snapshots;"
```

Show all database tables.

```bash
docker exec -it collab-editor-postgres \
psql \
-U collab_editor \
-d collab_editor_dev \
-c "\dt"
```

---

## WebSocket Monitoring

Backend logs provide useful runtime information.

Example:

```text
[ws] server listening on ws://localhost:8080

[ws] new client connected

[RoomManager] join room demo-doc

[RoomManager] room size: 2

[ws] broadcast operation

[ws] client disconnected
```

---

## Frontend Debug Logs

Open browser DevTools.

```
F12

↓

Console
```

Example logs:

```text
[hook] render
siteId: site-2b8b9c0d

connected: true

text: "Hello World"
```

Sending operation:

```text
[hook] sending via WebSocket
```

Receiving operation:

```text
[hook] applying remote operation
```

---

# 📊 Experimental Results

Several experiments were conducted to validate correctness and performance.

---

## (A) Convergence Test

| Scenario | Result | Status |
|----------|--------|--------|
| Two replicas insert concurrently | Identical | ✅ |
| Mixed insert/delete | Identical | ✅ |
| Three replicas insert simultaneously | Converged | ✅ |
| Delete before insert arrival | Safe No-op | ✅ |
| Replica reconnect | Converged | ✅ |

---

## (B) Performance Benchmark

| Metric | Result | Status |
|---------|-------:|--------|
| Local Insert | < 10 ms | ✅ |
| WebSocket Broadcast | < 50 ms | ✅ |
| Snapshot Loading | < 100 ms | ✅ |
| UI Rendering | < 16 ms | ✅ |
| Chaos Test | < 5 s | ✅ |

---

## (C) Chaos Test Result

| Scenario | Result |
|----------|--------|
| 20 replicas | ✅ Converged |
| Random network delay | ✅ Converged |
| Random operation ordering | ✅ Converged |
| Mixed insert/delete | ✅ Converged |
| Replica recovery | ✅ Converged |

---

# 📉 Convergence Visualization

```
Replica A
Hello

Replica B
HeXllo

Replica C
Hello!

↓

Random Delivery

↓

Merge

↓

Replica A
HelloX!

Replica B
HelloX!

Replica C
HelloX!
```

Every replica eventually reaches the exact same document state.

---

# ⚡ Performance Summary

```
Latency

Local Insert
██████████ <10ms

Broadcast
██████████████ <50ms

Snapshot
████████████████ <100ms

Rendering
████████ <16ms
```

---

## ✅ Key Findings

- Strong eventual consistency achieved.
- Deterministic ordering across replicas.
- No centralized conflict resolution required.
- Snapshot loading significantly reduces startup latency.
- Stable under concurrent editing and random network conditions.
- Successfully validated with 20 concurrent replicas.

# ⚠️ Current Limitations

Although the project demonstrates a fully functional CRDT-based collaborative editor, several production-level features have not yet been implemented.

| Feature | Current Status | Notes |
|----------|---------------|------|
| Authentication | ❌ Not Implemented | Suitable for local development only |
| Authorization | ❌ Not Implemented | No role-based permissions |
| Rich Text | ❌ Plain text only | No bold, italic, underline, lists, etc. |
| Multi-document | ⚠️ Single document | Routing can be added later |
| Cursor Timeout | ⚠️ Static | Remote cursors remain until refresh |
| Undo / Redo | ❌ Not Available | Requires CRDT-aware history |
| Presence Indicator | ❌ Not Available | Online/offline status not tracked |
| Offline Editing | ⚠️ Partial | Synchronization after reconnect can be improved |

---

# 🚀 Future Roadmap

The following improvements are planned for future development.

## Phase 1

- [ ] JWT Authentication
- [ ] Authorization
- [ ] User Management
- [ ] Multi-document Support

---

## Phase 2

- [ ] Rich Text Formatting
- [ ] Markdown Support
- [ ] Image Embedding
- [ ] File Attachments

---

## Phase 3

- [ ] Undo / Redo
- [ ] Presence System
- [ ] Cursor Timeout
- [ ] Document Sharing

---

## Phase 4

- [ ] Offline-first Mode
- [ ] IndexedDB Cache
- [ ] Conflict Visualization
- [ ] Operation Replay

---

## Phase 5

- [ ] Horizontal Scaling
- [ ] Redis Pub/Sub
- [ ] Distributed WebSocket Server
- [ ] Kubernetes Deployment

---

# 📸 Demo

## Collaborative Editing

```
Browser A

Hello World|

            ↓

WebSocket Broadcast

            ↓

Browser B

Hello World|
```

---

## Cursor Synchronization

```
User A

Hello |World


User B

Hello Wor|ld
```

---

## Multiple Replica Synchronization

```
Replica A
↓

Replica B
↓

Replica C
↓

Replica D
↓

Eventually

↓

Same Document
```

---

# 🏛️ Architectural Decisions

The project follows several architectural principles.

## Why CRDT Instead of Operational Transformation?

| CRDT | Operational Transformation |
|------|----------------------------|
| Conflict-free | Transformation required |
| Deterministic | Operational ordering required |
| Offline-friendly | Harder to implement |
| Peer-to-peer capable | Usually centralized |
| Eventually consistent | Depends on server transformation |

---

## Why Replicated Growable Array (RGA)?

RGA is specifically designed for sequence-based collaborative editing.

Advantages include:

- Deterministic ordering
- Efficient insertion
- Tombstone deletion
- Simple merge semantics
- Strong eventual consistency

---

## Why WebSocket?

Compared to polling, WebSocket provides:

- Low latency
- Full-duplex communication
- Real-time updates
- Reduced bandwidth
- Better collaborative experience

---

## Why Snapshot?

Without snapshots:

```
Join Document

↓

Replay

25,000 Operations

↓

Render
```

With snapshots:

```
Join

↓

Load Snapshot

↓

Replay Last 50 Operations

↓

Ready
```

Snapshots dramatically reduce startup latency for large collaborative documents.

---

# 📚 References

This project is inspired by the following academic papers and technologies.

### CRDT

Marc Shapiro et al.

> Conflict-free Replicated Data Types

https://hal.inria.fr/inria-00609399

---

### Replicated Growable Array

Roh, Jeon, et al.

> Replicated Abstract Data Types:
Optimistic Replication Using Atomic Broadcast

---

### Operational Transformation

Ellis & Gibbs

> Concurrency Control in Groupware Systems

---

### WebSocket

RFC 6455

https://datatracker.ietf.org/doc/html/rfc6455

---

### PostgreSQL

https://www.postgresql.org/

---

### React

https://react.dev/

---

### TypeScript

https://www.typescriptlang.org/

---

# 🤝 Contributing

Contributions are welcome!

If you'd like to improve this project:

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature/amazing-feature
```

3. Commit your changes

```bash
git commit -m "Add amazing feature"
```

4. Push the branch

```bash
git push origin feature/amazing-feature
```

5. Open a Pull Request

---

## Coding Standards

- TypeScript Strict Mode
- ESLint
- Prettier
- Conventional Commits
- Unit Tests Required

---

# ⭐ Support

If you find this project useful, consider giving it a ⭐ on GitHub.

```
⭐ Star
🍴 Fork
🐛 Report Issues
💡 Suggest Features
```

---

# 📄 License

This project is licensed under the **MIT License**.

See the LICENSE file for details.

---

# 👨‍💻 Author

**Muhamad Syukron Zakka**

Backend Engineer • Machine Learning Engineer • AI Enthusiast

GitHub:

```
https://github.com/Tricke2D
```

LinkedIn:

```
(https://www.linkedin.com/in/mhdsyukronzakka/)
```

Email:

```
mhdsyukronzakka@gmail.com
```

---

# 🙏 Acknowledgements
---

<div align="center">

## ⭐ If you like this project, don't forget to leave a star!

**Built with ❤️ using TypeScript, React, Node.js, PostgreSQL, and CRDT**

</div>
