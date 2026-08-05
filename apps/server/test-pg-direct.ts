import postgres from 'postgres';

async function test() {
    const sql = postgres({
        host: "127.0.0.1",
        port: 5432,
        database: "collab_editor_dev",
        username: "postgres",
        // ⭐ TANPA PASSWORD
        ssl: false,
    });

    try {
        console.log("🔍 Connecting...");
        const result = await sql`SELECT 1`;
        console.log("✅ Connected!", result);
        await sql.end();
    } catch (err) {
        console.error("❌ Failed:", err);
    }
}

test();