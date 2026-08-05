// apps/server/src/db/pool.ts
import postgres from 'postgres';

export const sql = postgres({
    host: "127.0.0.1",
    port: 5432,
    database: "collab_editor_dev",
    username: "postgres",
    password: "postgres",
    ssl: false,
});