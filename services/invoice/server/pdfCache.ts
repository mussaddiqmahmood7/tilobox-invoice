import { createHash } from "node:crypto";

/**
 * Small in-memory cache of recently generated PDFs.
 *
 * Clicking Generate twice without editing anything used to re-render the
 * template, re-launch a page and re-serialise the document for a byte-identical
 * result. Users do this constantly — generate, look, download, generate again.
 *
 * Deliberately per-instance and unshared: it is an optimisation, not a store.
 * A serverless cold start simply starts empty.
 */
const MAX_ENTRIES = 8;

/** Total cache ceiling. A PDF with a large embedded logo is not small. */
const MAX_BYTES = 16 * 1024 * 1024;

type Entry = { key: string; pdf: Uint8Array };

// Ordered oldest-first; the array is short enough that shift/splice is fine.
let entries: Entry[] = [];
let totalBytes = 0;

/**
 * Keys on the validated body rather than the raw request, so two requests that
 * differ only in JSON key order or date formatting still hit the same entry —
 * zod has already normalised both by this point.
 */
export function pdfCacheKey(body: unknown, locale: string): string {
    return createHash("sha256")
        .update(locale)
        .update("\u0000")
        .update(JSON.stringify(body))
        .digest("hex");
}

export function getCachedPdf(key: string): Uint8Array | null {
    const index = entries.findIndex((entry) => entry.key === key);
    if (index === -1) return null;

    // Move to the end: least-recently-used is evicted first.
    const [entry] = entries.splice(index, 1);
    entries.push(entry);
    return entry.pdf;
}

export function setCachedPdf(key: string, pdf: Uint8Array): void {
    // A single oversized PDF must not evict the entire cache to store itself.
    if (pdf.byteLength > MAX_BYTES) return;

    entries = entries.filter((entry) => {
        if (entry.key !== key) return true;
        totalBytes -= entry.pdf.byteLength;
        return false;
    });

    entries.push({ key, pdf });
    totalBytes += pdf.byteLength;

    while (entries.length > MAX_ENTRIES || totalBytes > MAX_BYTES) {
        const evicted = entries.shift();
        if (!evicted) break;
        totalBytes -= evicted.pdf.byteLength;
    }
}

/** Test seam. */
export function clearPdfCache(): void {
    entries = [];
    totalBytes = 0;
}
