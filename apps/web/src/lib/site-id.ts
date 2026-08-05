/**
 * site-id.ts
 * Generate & simpan siteId unik per TAB browser.
 * ⚠️ PASTIKAN pake sessionStorage, BUKAN localStorage!
 */
const SESSION_KEY = "collab-editor-site-id";

export function getOrCreateSiteId(): string {
    // ⭐ sessionStorage = berbeda per tab
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
        console.log(`[site-id] ✅ using existing: ${existing}`);
        return existing;
    }

    const generated = `site-${crypto.randomUUID().slice(0, 8)}`;
    sessionStorage.setItem(SESSION_KEY, generated);
    console.log(`[site-id] 🆕 generated new: ${generated}`);
    return generated;
}