import { pool } from "./src/db/pool.js";

async function test() {
    try {
        console.log("🔍 Connecting to database...");
        const result = await pool.query("SELECT 1");
        console.log("✅ Database connected!", result.rows);
        await pool.end();
    } catch (err) {
        console.error("❌ Database connection failed:", err);
    }
}

test();