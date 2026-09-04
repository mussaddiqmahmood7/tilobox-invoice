import type { Browser, Page } from "puppeteer-core";

import { getBrowser } from "./browser";

/**
 * A single reused Chromium page, serialised behind a lock.
 *
 * `browser.newPage()` is far cheaper than launching Chromium, but it is not
 * free — it creates a target, a session and a fresh renderer process, which
 * measurably dominates what is left of the request once the browser itself is
 * shared. `setContent` replaces the whole document (style tags included), so a
 * page can be handed to the next request without leaking state from the last.
 *
 * The lock matters because a page has one document: two concurrent requests
 * sharing it would race, and the second would print the first's invoice. A
 * serverless instance handles one request at a time, but `next dev` and the
 * test suite do not.
 */
let pagePromise: Promise<Page> | null = null;

/** Tail of the queue. Each caller awaits the previous one before starting. */
let lock: Promise<unknown> = Promise.resolve();

/** A4 at 96dpi, so `sm:` and `lg:` utilities resolve the way the preview does. */
export const PDF_VIEWPORT = { width: 794, height: 1123, deviceScaleFactor: 1 };

async function createPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage();

    /*
     * Without an explicit viewport Puppeteer defaults to 800x600, so `sm:`
     * (640px) applied but `lg:` (1024px) silently never did — a whole tier of
     * template styling was dead in the PDF and only in the PDF.
     */
    await page.setViewport(PDF_VIEWPORT);

    // page.pdf() emulates print anyway, but being explicit means the `print:`
    // variants also apply to anything measured before the pdf() call.
    await page.emulateMediaType("print");

    return page;
}

async function acquirePage(): Promise<Page> {
    const browser = await getBrowser();

    if (pagePromise) {
        try {
            const existing = await pagePromise;
            if (!existing.isClosed()) return existing;
        } catch {
            // Fall through and make a new one.
        }
        pagePromise = null;
    }

    pagePromise = createPage(browser).catch((error) => {
        pagePromise = null;
        throw error;
    });

    return pagePromise;
}

/**
 * Runs `fn` against the shared page, one caller at a time.
 *
 * A page that throws is discarded rather than reused, since it may be left
 * with a half-loaded document.
 */
export async function withPdfPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const run = lock.then(async () => {
        const page = await acquirePage();
        try {
            return await fn(page);
        } catch (error) {
            pagePromise = null;
            await page.close().catch(() => undefined);
            throw error;
        }
    });

    // Keep the chain alive even when this call rejects, or one failure would
    // poison every request behind it.
    lock = run.catch(() => undefined);

    return run;
}
