import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke tests — a tripwire, not coverage.
 *
 * Each of these asserts something a type checker cannot: that the app renders,
 * that state changes do not loop, that the layout does not overflow, and that
 * the PDF endpoint still returns a PDF.
 */

/**
 * Requests that legitimately fail outside a Vercel deployment.
 *
 * The analytics script is injected by @vercel/analytics and is only served by
 * Vercel's edge, so it 404s on any local or CI run. Allow-listing it by URL
 * keeps the assertion strict about everything else, rather than the easier and
 * much worse option of ignoring 404s in general.
 */
const EXPECTED_FAILING_REQUESTS = [/\/_vercel\/insights\//];

/**
 * Records console errors and failed requests.
 *
 * This is the check that would have caught round 2's render loop: React logs
 * "Maximum update depth exceeded" as a console error while the page is
 * otherwise still serving HTML, so an HTTP-level check sees nothing wrong.
 *
 * "Failed to load resource" console messages are dropped because the browser
 * reports them without a URL — the network listener below catches the same
 * failures and can say which request it was.
 */
function collectProblems(page: Page, problems: string[]) {
    page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        const text = msg.text();
        if (text.includes("Failed to load resource")) return;
        problems.push(`console: ${text}`);
    });

    page.on("pageerror", (err) => problems.push(`pageerror: ${err}`));

    page.on("response", (res) => {
        if (res.status() < 400) return;
        const url = res.url();
        if (EXPECTED_FAILING_REQUESTS.some((re) => re.test(url))) return;

        /*
         * One tolerated 4xx, and only this exact one.
         *
         * Every page mount pings the warm endpoint, so a full suite run
         * eventually trips its per-IP rate limit — from one IP, which is
         * precisely what the limiter is for. The "warm endpoint" test below
         * already accounts for this; without the same allowance here, whichever
         * test happens to load the page after the limit is reached fails, and
         * the suite reports on the order it ran in rather than on the app.
         *
         * Narrow on purpose: a 429 anywhere else, or any other status on this
         * path, is still a problem.
         */
        if (
            res.status() === 429 &&
            new URL(url).pathname === "/api/invoice/warm"
        ) {
            return;
        }

        problems.push(`http ${res.status()}: ${url}`);
    });
}

/**
 * Opens the app's encrypted store inside the page and returns its handles.
 *
 * A test can no longer read these keys with JSON.parse — everything the app
 * persists about people is encrypted at rest. This pulls the origin's key back
 * out of IndexedDB and uses it, which is exactly the point: the key is
 * non-extractable so nothing can copy it out, but anything running on the
 * origin can still use it.
 */
const VAULT_SETUP = `
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open("invoify-secure", 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const idbGet = (store, id) => new Promise((resolve, reject) => {
    const request = db.transaction(store, "readonly").objectStore(store).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
`;

/** Decrypts one stored value, or reads a legacy plaintext one. */
async function readStored<T>(page: Page, storageKey: string): Promise<T | null> {
    return page.evaluate<T | null, string>(
        new Function(
            "key",
            `return (async () => {
        ${VAULT_SETUP}
        const stored = await idbGet("values", key);
        if (!stored) {
          const raw = window.localStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        }
        const cryptoKey = await idbGet("keys", "storage-key");
        const bytes = new Uint8Array(stored);
        const plaintext = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: bytes.subarray(0, 12) },
          cryptoKey,
          bytes.subarray(12)
        );
        return JSON.parse(new TextDecoder().decode(plaintext));
      })();`
        ) as (key: string) => Promise<T | null>,
        storageKey
    );
}

/**
 * Everything on disk for one key, as text, for asserting what is *not* legible
 * in it: the ciphertext bytes plus whatever localStorage still holds.
 */
async function rawStored(page: Page, storageKey: string): Promise<string> {
    return page.evaluate<string, string>(
        new Function(
            "key",
            `return (async () => {
        ${VAULT_SETUP}
        const stored = await idbGet("values", key);
        const bytes = stored ? Array.from(new Uint8Array(stored)) : [];
        const asText = bytes.map((b) => String.fromCharCode(b)).join("");
        return (window.localStorage.getItem(key) || "") + asText;
      })();`
        ) as (key: string) => Promise<string>,
        storageKey
    );
}

/** True when the key has ciphertext in the encrypted store. */
async function isEncrypted(page: Page, storageKey: string): Promise<boolean> {
    return page.evaluate<boolean, string>(
        new Function(
            "key",
            `return (async () => {
        ${VAULT_SETUP}
        const stored = await idbGet("values", key);
        return Boolean(stored && stored.byteLength > 12);
      })();`
        ) as (key: string) => Promise<boolean>,
        storageKey
    );
}

/**
 * The language popover, wherever it is portalled to.
 *
 * Scoped by the BETA badge in its own header rather than by `role="dialog"`
 * alone: on a phone the switcher lives inside the settings Sheet, which is
 * also a dialog, and an unscoped locator matches both.
 */
function languageMenu(page: Page) {
    return page.getByRole("dialog").filter({ has: page.getByText("BETA") });
}

/**
 * Opens the language switcher on either layout. Below sm the navbar has no
 * room for it beside the logo, so it moves into the settings sheet.
 */
async function openLanguageMenu(page: Page) {
    if (page.viewportSize()!.width < 640) {
        await page.getByRole("button", { name: /open settings/i }).click();
    }
    await page.getByRole("button", { name: "Languages" }).click();
}

/**
 * Pre-populates the saved draft so a test starts from a filled invoice.
 *
 * Deliberately not the dev-only "Fill in the form" button: these tests run
 * against the production build, where that button does not exist. Providers
 * hydrates the form from this key on mount.
 *
 * Writes plaintext on purpose: that is the shape an older build left behind,
 * so every test that seeds also exercises the migration path.
 */
async function seedDraft(page: Page) {
    await page.addInitScript((invoice) => {
        window.localStorage.setItem("invoify:invoiceDraft", JSON.stringify(invoice));
    }, SAMPLE_INVOICE);
}

/** Measures every element that sticks out past the viewport horizontally. */
async function horizontalOverflow(page: Page) {
    return page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const offenders: { tag: string; cls: string; right: number }[] = [];

        document.querySelectorAll<HTMLElement>("*").forEach((el) => {
            // Elements that scroll horizontally on purpose are allowed to be
            // wider than the viewport — that is what the scroller is for.
            const style = getComputedStyle(el);
            if (style.overflowX === "auto" || style.overflowX === "scroll") return;
            if (el.closest("[data-allow-x-overflow]")) return;

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            if (rect.right > docWidth + 1) {
                offenders.push({
                    tag: el.tagName.toLowerCase(),
                    cls: el.className?.toString().slice(0, 80) ?? "",
                    right: Math.round(rect.right - docWidth),
                });
            }
        });

        return { docWidth, scrollWidth: document.documentElement.scrollWidth, offenders };
    });
}

test.describe("invoice builder", () => {
    test("renders without page problems", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator('input[name="sender.name"]')).toBeVisible();

        // Give any render loop a chance to announce itself.
        await page.waitForTimeout(1500);
        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("typing persists a draft without errors", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");
        const name = page.locator('input[name="sender.name"]');
        await name.fill("Alexandria Consulting Group");
        await expect(name).toHaveValue("Alexandria Consulting Group");

        // Past the autosave debounce.
        await page.waitForTimeout(1200);
        const draft = await readStored<{ sender: { name: string } }>(
            page,
            "invoify:invoiceDraft"
        );
        expect(draft, "draft should be written after the debounce").toBeTruthy();
        expect(draft!.sender.name).toBe("Alexandria Consulting Group");

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("every wizard step renders without horizontal overflow", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");

        const dots = page.locator('nav[aria-label] ol button');
        const count = await dots.count();
        expect(count).toBe(5);

        for (let i = 0; i < count; i++) {
            await dots.nth(i).click();
            await page.waitForTimeout(250);

            const { offenders, scrollWidth, docWidth } = await horizontalOverflow(page);
            expect(
                offenders,
                `step ${i + 1} overflows horizontally: ${JSON.stringify(offenders, null, 2)}`
            ).toEqual([]);
            expect(scrollWidth, `step ${i + 1} document scrolls sideways`).toBeLessThanOrEqual(
                docWidth + 1
            );
        }

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("template gallery opens and switches template", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");
        await page.locator("nav[aria-label] ol button").nth(1).click();

        /*
         * Two entry points by design: the chip row above the invoice on
         * desktop, the labelled thumbnail inside the Details step below xl.
         * Both open the same dialog.
         *
         * `.or()` rather than sampling `count()`, because count does not
         * auto-wait and useIsDesktop is false on its first render — a bare
         * count can observe the moment before the chips mount.
         */
        const chip = page.getByRole("button", { name: /^Template/ });
        const thumbnail = page.getByRole("button", { name: /change template/i });
        await chip.or(thumbnail).first().click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        // 13 layouts, each a pressable card.
        const cards = dialog.locator('button[aria-pressed]').filter({ hasText: /./ });
        await expect(cards.first()).toBeVisible();

        await dialog.getByText("Sidebar", { exact: true }).click();
        await expect(dialog).toBeHidden();

        await page.waitForTimeout(500);
        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("step is reflected in the URL and survives reload", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");

        // Navigating updates the URL...
        await page.locator("nav[aria-label] ol button").nth(3).click();
        await expect(page).toHaveURL(/[?&]step=payment/);

        // ...and a reload lands back on the same step rather than step 1.
        await page.reload();
        await expect(
            page.locator("nav[aria-label] ol button").nth(3)
        ).toHaveAttribute("aria-current", "step");

        // Deep link straight to a step.
        await page.goto("/en?step=items");
        await expect(
            page.locator("nav[aria-label] ol button").nth(2)
        ).toHaveAttribute("aria-current", "step");

        // Back returns to the previous step rather than leaving the app.
        await page.goBack();
        await expect(page).toHaveURL(/[?&]step=payment/);

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("editing after generating returns to the live preview", async ({ page }) => {
        test.skip(
            page.viewportSize()!.width < 1280,
            "below xl the preview lives in a sheet, covered by its own test"
        );

        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);
        await page.goto("/en");

        /*
         * Assert on the surfaces, not on their labels. In the desktop shell the
         * "Live Preview" heading is deliberately gone — the paper on its ground
         * says what it is — and "Back to Live Preview" is a button whose text
         * also matches /live preview/, so a text match would pass for the wrong
         * reason.
         */
        const livePreview = page.locator(".invoice-live-preview");
        const finalPdf = page.getByRole("heading", { name: /final pdf/i });

        await expect(livePreview).toBeVisible();

        await page.getByRole("button", { name: "Generate PDF" }).click();
        await expect(finalPdf).toBeVisible({ timeout: 60_000 });

        // One character of editing should hand the preview back on its own.
        await page.locator("nav[aria-label] ol button").nth(0).click();
        await page.locator('input[name="sender.name"]').fill("Edited Name Ltd");

        await expect(livePreview).toBeVisible();
        await expect(finalPdf).toBeHidden();

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("clicking the preview jumps to the field behind it", async ({ page }) => {
        test.skip(
            page.viewportSize()!.width < 1280,
            "the live preview is behind a sheet on mobile"
        );

        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);
        await page.goto("/en?step=summary");

        const region = page
            .locator('.invoice-live-preview [data-edit-field="receiver.name"]')
            .first();

        // Wait for the preview to actually render the seeded invoice rather
        // than guessing at a timeout.
        await expect(region).toBeVisible({ timeout: 15_000 });
        await region.click();

        await expect(page).toHaveURL(/[?&]step=from-and-to/);
        await expect(page.locator('input[name="receiver.name"]')).toBeFocused();

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("desktop shell pins the app and gives each pane its own scroll", async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()!.width < 1280,
            "the shell is a desktop-only layout"
        );

        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);
        await page.goto("/en");
        await page.waitForTimeout(1200);

        const shell = await page.evaluate(() => {
            const de = document.documentElement;
            const panes = Array.from(document.querySelectorAll("div")).filter((el) => {
                const style = getComputedStyle(el);
                return (
                    (style.overflowY === "auto" || style.overflowY === "scroll") &&
                    el.clientHeight > 200
                );
            });
            /*
             * The app region must fit the viewport without scrolling. The
             * document itself is much taller — the marketing section and the
             * footer sit below the fold on purpose — so measuring document
             * height would test the wrong thing.
             */
            const main = document.querySelector("main");
            const mainBottom = main ? main.getBoundingClientRect().bottom : Infinity;

            return {
                paneCount: panes.length,
                horizontal: de.scrollWidth > de.clientWidth + 1,
                mainBottom: Math.round(mainBottom),
                viewportHeight: de.clientHeight,
            };
        });

        expect(shell.paneCount, "form and preview should each scroll").toBe(2);
        expect(shell.horizontal).toBe(false);
        expect(
            shell.mainBottom,
            "the builder should fit the viewport without scrolling"
        ).toBeLessThanOrEqual(shell.viewportHeight + 1);

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("nothing overflows the narrow form rail", async ({ page }) => {
        test.skip(
            page.viewportSize()!.width < 1280,
            "the rail only exists in the desktop shell"
        );

        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);
        await page.goto("/en");

        /*
         * The mirror of the 375px audit, scoped to the form column. The rail is
         * ~420px inside a 1440px viewport, so a viewport breakpoint like `sm:`
         * would fire there and lay out for a width the column does not have.
         * The line-items step is the one that breaks first.
         */
        const dots = page.locator("nav[aria-label] ol button");
        const count = await dots.count();

        for (let i = 0; i < count; i++) {
            await dots.nth(i).click();
            await page.waitForTimeout(250);

            const result = await page.evaluate(() => {
                // Found by computed style: `.@container` is not a valid
                // CSS selector without escaping, and the escape differs
                // between the DOM API and Playwright's parser.
                const pane = [
                    ...document.querySelectorAll<HTMLElement>("div"),
                ].find(
                    (el) => getComputedStyle(el).containerType === "inline-size"
                );
                if (!pane) return { paneWidth: 0, offenders: ["no @container pane found"] };

                const right = pane.getBoundingClientRect().right;
                const offenders: string[] = [];

                pane.querySelectorAll<HTMLElement>("*").forEach((el) => {
                    const style = getComputedStyle(el);
                    if (style.overflowX === "auto" || style.overflowX === "scroll") return;
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;
                    if (rect.right > right + 1) {
                        offenders.push(
                            `${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 50)} +${Math.round(rect.right - right)}px`
                        );
                    }
                });

                return { paneWidth: Math.round(pane.clientWidth), offenders };
            });

            expect(
                result.offenders,
                `step ${i + 1} overflows the ${result.paneWidth}px rail`
            ).toEqual([]);
        }

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("generate endpoint returns a real PDF", async ({ request }) => {
        const res = await request.post("/api/invoice/generate?locale=en", {
            data: SAMPLE_INVOICE,
        });

        expect(res.status(), await res.text().catch(() => "")).toBe(200);
        expect(res.headers()["content-type"]).toContain("application/pdf");

        const body = await res.body();
        // Magic bytes, not just a non-empty response — a JSON error body has a
        // non-zero length too, which is exactly how a broken generation once
        // reported itself as a success.
        expect(body.subarray(0, 5).toString()).toBe("%PDF-");
        expect(body.length).toBeGreaterThan(5000);
    });

    test("identical invoices are served from cache", async ({ request }) => {
        // Unique so this test does not depend on what other tests generated.
        const invoice = {
            ...SAMPLE_INVOICE,
            details: { ...SAMPLE_INVOICE.details, invoiceNumber: "CACHE-1" },
        };

        const first = await request.post("/api/invoice/generate?locale=en", {
            data: invoice,
        });
        expect(first.status()).toBe(200);

        const second = await request.post("/api/invoice/generate?locale=en", {
            data: invoice,
        });
        expect(second.status()).toBe(200);
        expect(second.headers()["x-pdf-cache"]).toBe("hit");

        // A cache hit must return the same bytes, not merely a fast response.
        expect(await second.body()).toEqual(await first.body());
    });

    test("concurrent generations do not share a page", async ({ request }) => {
        // The renderer reuses one Chromium page behind a lock. Without the lock
        // two requests would race on a single document and the second would
        // print the first one's invoice.
        const make = (name: string, template: number) => ({
            ...SAMPLE_INVOICE,
            sender: { ...SAMPLE_INVOICE.sender, name },
            details: {
                ...SAMPLE_INVOICE.details,
                invoiceNumber: `RACE-${name}`,
                pdfTemplate: template,
            },
        });

        const [a, b] = await Promise.all([
            request.post("/api/invoice/generate?locale=en", { data: make("Alpha Corp", 1) }),
            request.post("/api/invoice/generate?locale=en", { data: make("Beta Industries", 7) }),
        ]);

        expect(a.status()).toBe(200);
        expect(b.status()).toBe(200);

        const [bodyA, bodyB] = [await a.body(), await b.body()];
        expect(bodyA.subarray(0, 5).toString()).toBe("%PDF-");
        expect(bodyB.subarray(0, 5).toString()).toBe("%PDF-");
        expect(bodyA.equals(bodyB)).toBe(false);
    });

    test("every template renders a single A4 page", async ({ request }) => {
        // 13 layouts; each must produce a valid, single-page A4 document.
        for (let id = 1; id <= 13; id++) {
            const res = await request.post("/api/invoice/generate?locale=en", {
                data: {
                    ...SAMPLE_INVOICE,
                    details: {
                        ...SAMPLE_INVOICE.details,
                        pdfTemplate: id,
                        invoiceNumber: `TPL-${id}`,
                    },
                },
            });

            expect(res.status(), `template ${id} failed`).toBe(200);
            const body = await res.body();
            expect(body.subarray(0, 5).toString()).toBe("%PDF-");

            const text = body.toString("latin1");
            const boxes = [...text.matchAll(/\/MediaBox\s*\[([^\]]*)\]/g)].map((m) =>
                m[1].trim()
            );
            expect(new Set(boxes).size, `template ${id} mixed page sizes`).toBe(1);
            expect(boxes[0]).toContain("595.9");
            expect(boxes[0]).toContain("841.9");
        }
    });

    test("an uploaded logo reaches the PDF", async ({ request }) => {
        // A 1x1 transparent PNG is enough: we are asserting the image is
        // embedded at all, which is what three layouts previously failed to do.
        const logo =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

        // Compact (7) and Statement (11) used to drop the logo entirely.
        for (const id of [7, 11]) {
            const base = {
                ...SAMPLE_INVOICE,
                details: { ...SAMPLE_INVOICE.details, pdfTemplate: id },
            };

            const without = await request.post("/api/invoice/generate?locale=en", {
                data: { ...base, details: { ...base.details, invoiceNumber: `NL-${id}` } },
            });
            const with_ = await request.post("/api/invoice/generate?locale=en", {
                data: {
                    ...base,
                    details: {
                        ...base.details,
                        invoiceNumber: `WL-${id}`,
                        invoiceLogo: logo,
                    },
                },
            });

            const a = (await without.body()).length;
            const b = (await with_.body()).length;
            expect(b, `template ${id} did not embed the logo`).toBeGreaterThan(a + 100);
        }
    });

    test("extended-Latin locales embed every glyph they need", async ({ request }) => {
        /*
         * The PDF embeds its fonts and issues no network requests, so a
         * character with no glyph in the embedded set falls back to whatever
         * the render machine happens to have — Segoe UI locally, nothing at all
         * on Lambda. This shipped silently for Turkish and Polish until the
         * latin-ext subsets were added, so it is worth a tripwire.
         */
        const CASES: [string, string, string][] = [
            ["az", "Şirkət Əməkdaşlıq MMC", "Ənbər ölçü ğıışə"],
            ["tr", "Yılmaz Şirketi Ltd. Şti.", "Çğıöşü ürün"],
            ["pl", "Firma Łąka Spółka z o.o.", "Zażółć gęślą jaźń"],
            ["de", "Müller & Söhne GmbH", "Größe Straße"],
            ["fr", "Société Générale SARL", "Éphémère à côté"],
        ];

        for (const [locale, sender, item] of CASES) {
            const res = await request.post(
                `/api/invoice/generate?locale=${locale}`,
                {
                    data: {
                        ...SAMPLE_INVOICE,
                        sender: { ...SAMPLE_INVOICE.sender, name: sender },
                        details: {
                            ...SAMPLE_INVOICE.details,
                            invoiceNumber: `GLYPH-${locale}`,
                            items: [
                                {
                                    name: item,
                                    description: item,
                                    quantity: 2,
                                    unitPrice: 1234.5,
                                    total: 2469,
                                },
                            ],
                            subTotal: 2469,
                            totalAmount: 2469,
                        },
                    },
                }
            );

            expect(res.status(), `${locale} failed to generate`).toBe(200);

            const text = (await res.body()).toString("latin1");
            const families = [
                ...new Set(
                    [...text.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-,]+)/g)].map((m) =>
                        m[1].replace(/^[A-Z]{6}\+/, "")
                    )
                ),
            ];

            // Only the families the build embeds. Anything else means Chromium
            // reached for a system font because a glyph was missing.
            const foreign = families.filter(
                (f) => !/^(Outfit|IBMPlex|SourceSerif)/.test(f)
            );

            expect(
                foreign,
                `${locale} fell back to non-embedded fonts: ${foreign.join(", ")}`
            ).toEqual([]);
        }
    });

    test("each locale advertises itself correctly to crawlers", async ({ request }) => {
        const en = await request.get("/en");
        const az = await request.get("/az");
        expect(en.status()).toBe(200);
        expect(az.status()).toBe(200);

        const enHtml = await en.text();
        const azHtml = await az.text();

        const titleOf = (html: string) =>
            html.match(/<title>(.*?)<\/title>/i)?.[1] ?? "";
        const canonicalOf = (html: string) =>
            html.match(/rel="canonical"[^>]*href="([^"]+)"/i)?.[1] ?? "";

        // Every locale served one English title and one canonical before this.
        expect(titleOf(enHtml)).not.toBe(titleOf(azHtml));
        expect(canonicalOf(enHtml)).toMatch(/\/en$/);
        expect(canonicalOf(azHtml)).toMatch(/\/az$/);

        // hreflang: one per locale plus x-default. Next serialises the
        // attribute as `hrefLang`, which HTML parses case-insensitively.
        const alternates = enHtml.match(/rel="alternate"[^>]*hreflang=/gi) ?? [];
        expect(alternates.length).toBeGreaterThanOrEqual(18);
        expect(enHtml).toMatch(/hreflang="x-default"/i);

        // Open Graph and Twitter, neither of which existed.
        expect(enHtml).toMatch(/property="og:image"/i);
        expect(enHtml).toMatch(/name="twitter:card"/i);

        // Exactly one h1 — the invoice templates used to render their own
        // inside the live preview, out of the user's data.
        expect((enHtml.match(/<h1/g) ?? []).length).toBe(1);

        // Structured data: the app, and the FAQ that matches the rendered one.
        const blocks = [
            ...enHtml.matchAll(
                /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs
            ),
        ].map((m) => JSON.parse(m[1]));
        const types = blocks.map((b) => b["@type"]);
        expect(types).toContain("WebApplication");
        expect(types).toContain("FAQPage");

        const faq = blocks.find((b) => b["@type"] === "FAQPage");
        const rendered = (enHtml.match(/<dt[^>]*>/g) ?? []).length;
        expect(faq.mainEntity.length).toBe(rendered);

        // There is prose on the page at all.
        const text = enHtml
            .replace(/<script[\s\S]*?<\/script[^>]*>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        /*
         * 1,200 rather than the 2,000 this once asserted: the long-form
         * sections moved to /guide in round 4, taking the homepage from ~3,000
         * characters to ~1,800. The floor is what the homepage needs to stand
         * on its own — a heading, a real paragraph and the FAQ — not the total
         * before the split.
         */
        expect(text.length).toBeGreaterThan(1200);
    });

    test("sitemap, robots and manifest are served", async ({ request }) => {
        const sitemap = await request.get("/sitemap.xml");
        expect(sitemap.status()).toBe(200);
        const xml = await sitemap.text();
        // One entry per locale, plus one per locale for /guide.
        expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThanOrEqual(34);
        expect((xml.match(/\/guide<\/loc>/g) ?? []).length).toBeGreaterThanOrEqual(17);
        expect(xml).toContain("xhtml:link");

        const robots = await request.get("/robots.txt");
        expect(robots.status()).toBe(200);
        const txt = await robots.text();
        // The static robots.txt it replaced named no sitemap at all.
        expect(txt).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/);
        expect(txt).toMatch(/Disallow:\s*\/api\//);

        const manifest = await request.get("/manifest.webmanifest");
        expect(manifest.status()).toBe(200);
        expect((await manifest.json()).icons.length).toBeGreaterThan(0);

        const favicon = await request.get("/favicon.ico");
        expect(favicon.status()).toBe(200);

        const og = await request.get("/en/opengraph-image");
        expect(og.status()).toBe(200);
        expect(og.headers()["content-type"]).toContain("image/png");
    });

    test("clients can be saved and reused", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);
        await page.goto("/en");

        // Save the seeded receiver.
        await page.getByRole("button", { name: /save client/i }).click();
        await expect(page.getByRole("button", { name: /^clients/i })).toBeEnabled();

        // Wipe the receiver, then restore it from the address book.
        await page.locator('input[name="receiver.name"]').fill("");
        await page.locator('input[name="receiver.city"]').fill("");

        await page.getByRole("button", { name: /^clients/i }).click();
        // The row and its delete button both carry the client's name, so match
        // the row's full accessible name rather than a substring.
        await page
            .getByRole("button", { name: "Jane Smith Other Town, Canada" })
            .click();

        await expect(page.locator('input[name="receiver.name"]')).toHaveValue(
            "Jane Smith"
        );
        // The whole address comes back, not just the name.
        await expect(page.locator('input[name="receiver.city"]')).toHaveValue(
            "Other Town"
        );

        // Survives a reload — it is in storage, not in component state.
        await page.reload();
        await expect(page.getByRole("button", { name: /^clients/i })).toBeEnabled();

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("a new invoice suggests the next number but leaves it editable", async ({
        page,
    }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.addInitScript(() => {
            window.localStorage.setItem(
                "savedInvoices",
                JSON.stringify([{ details: { invoiceNumber: "INV0042" } }])
            );
        });
        await page.goto("/en");

        /*
         * Desktop hides the secondary actions behind an overflow menu; below xl
         * they are a plain column under the form.
         */
        const overflow = page.getByRole("button", { name: /more actions/i });
        if (await overflow.count()) await overflow.click();

        await page.getByRole("button", { name: /^new invoice$/i }).first().click();
        // Confirm the alert.
        await page
            .getByRole("button", { name: /^(continue|ok|new invoice)$/i })
            .last()
            .click()
            .catch(() => undefined);

        /*
         * Wait for the new number to reach storage before navigating away.
         *
         * The draft is written on a 600ms debounce and the write is async now
         * that it is encrypted, so a hard navigation issued immediately can
         * outrun it. This used to pass on a synchronous setItem; polling for
         * the state the next assertion depends on is what it should have been
         * doing either way.
         */
        await expect
            .poll(
                async () =>
                    (
                        await readStored<{
                            details?: { invoiceNumber?: string };
                        }>(page, "invoify:invoiceDraft")
                    )?.details?.invoiceNumber ?? null,
                { timeout: 5000 }
            )
            .toBe("INV0043");

        // A fresh invoice opens on step 1; the number lives on step 2.
        await page.goto("/en?step=details");

        const field = page.locator('input[name="details.invoiceNumber"]');
        await expect(field).toHaveValue("INV0043");

        // Prefilled, never locked.
        await expect(field).toBeEditable();
        await field.fill("2026-01");
        await expect(field).toHaveValue("2026-01");

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("payment term presets fill the field", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);
        await page.goto("/en?step=summary");

        const terms = page.locator('textarea[name="details.paymentTerms"]');
        await expect(terms).toBeVisible();

        await page.getByRole("button", { name: "Net 60", exact: true }).click();
        await expect(terms).toHaveValue("Net 60");

        // Still free text underneath.
        await terms.fill("Payable in 45 days");
        await expect(terms).toHaveValue("Payable in 45 days");

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("the autosave indicator reports a saved draft", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");
        await page.locator('input[name="sender.name"]').fill("Northwind Studio");

        /*
         * Poll for the write rather than racing the 600ms debounce, and assert
         * on the draft itself — several controls in this form have "save" in
         * their label, so a text match would be ambiguous.
         */
        await expect
            .poll(
                async () =>
                    (
                        await readStored<{ sender?: { name?: string } }>(
                            page,
                            "invoify:invoiceDraft"
                        )
                    )?.sender?.name ?? null,
                { timeout: 5000 }
            )
            .toBe("Northwind Studio");

        // Then the indicator reports it.
        await expect(
            page.locator("form").getByText(/^Saved ·/)
        ).toBeVisible();

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("right-to-left locales mirror and do not overflow", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);

        /*
         * The mirror check reads positions out of the live preview, which only
         * exists inline above xl — below it the preview lives in a sheet that
         * is not mounted until opened. `dir` and the overflow audit apply at
         * every width; only the position comparison is desktop-only.
         */
        const hasInlinePreview = page.viewportSize()!.width >= 1280;

        const read = async (locale: string) => {
            await page.goto(`/${locale}`);

            if (hasInlinePreview) {
                /*
                 * Wait for the element being measured, not a guessed number of
                 * milliseconds — a fixed wait reports on machine load rather
                 * than on the layout.
                 */
                await expect(
                    page.locator(
                        '.invoice-live-preview [data-edit-field="sender.name"]'
                    )
                ).toBeVisible({ timeout: 15_000 });
            } else {
                await expect(
                    page.locator('input[name="sender.name"]')
                ).toBeVisible({ timeout: 15_000 });
            }

            return page.evaluate(() => {
                const paper = document.querySelector(".invoice-live-preview");
                const left = (sel: string) => {
                    const el = paper?.querySelector(sel);
                    return el ? Math.round(el.getBoundingClientRect().left) : null;
                };
                return {
                    dir: document.documentElement.getAttribute("dir"),
                    sender: left('[data-edit-field="sender.name"]'),
                    receiver: left('[data-edit-field="receiver.name"]'),
                };
            });
        };

        const ltr = await read("en");
        expect(ltr.dir).toBe("ltr");

        for (const locale of ["he", "ar"]) {
            const rtl = await read(locale);

            // `dir` was missing entirely before this: Arabic shipped for
            // months rendering right-to-left text in a left-to-right document.
            expect(rtl.dir, `${locale} should be rtl`).toBe("rtl");

            // The parties swap sides, which is what proves the logical
            // properties resolved rather than the page merely claiming rtl.
            if (hasInlinePreview) {
                expect(ltr.sender, "no sender in the ltr preview").not.toBeNull();
                expect(ltr.sender!).toBeLessThan(ltr.receiver!);
                expect(rtl.sender!).toBeGreaterThan(rtl.receiver!);
            }

            const { offenders } = await horizontalOverflow(page);
            expect(
                offenders,
                `${locale} overflows: ${JSON.stringify(offenders, null, 2)}`
            ).toEqual([]);
        }

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("rtl PDFs embed their script fonts", async ({ request }) => {
        /*
         * The PDF embeds its fonts and issues no network requests, and none of
         * the four Latin body families contains a Hebrew or Arabic glyph — so
         * without the Noto subsets these render as tofu on any machine with no
         * system font, which includes the Lambda that generates them.
         */
        const CASES: [string, string][] = [
            ["he", "סטודיו נורת׳ווינד"],
            ["ar", "شركة الشمال للتصميم"],
        ];

        for (const [locale, name] of CASES) {
            const res = await request.post(
                `/api/invoice/generate?locale=${locale}`,
                {
                    data: {
                        ...SAMPLE_INVOICE,
                        sender: { ...SAMPLE_INVOICE.sender, name },
                        details: {
                            ...SAMPLE_INVOICE.details,
                            invoiceNumber: `RTL-${locale}`,
                        },
                    },
                }
            );

            expect(res.status(), `${locale} failed to generate`).toBe(200);

            const text = (await res.body()).toString("latin1");
            const families = [
                ...new Set(
                    [...text.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-,]+)/g)].map((m) =>
                        m[1].replace(/^[A-Z]{6}\+/, "")
                    )
                ),
            ];

            expect(
                families.some((f) => f.startsWith("NotoSans")),
                `${locale} did not embed a script font: ${families.join(", ")}`
            ).toBe(true);

            const foreign = families.filter(
                (f) => !/^(Outfit|IBMPlex|SourceSerif|NotoSans)/.test(f)
            );
            expect(
                foreign,
                `${locale} fell back to non-embedded fonts: ${foreign.join(", ")}`
            ).toEqual([]);
        }
    });

    test("no template filters the logo away", async ({ page }) => {
        test.skip(
            page.viewportSize()!.width < 1280,
            "below xl the preview lives in a sheet that is not mounted until opened"
        );

        /*
         * Sidebar and BoldHeader used to wrap the logo in
         * `filter: brightness(0) invert(1)` to make a dark monochrome mark
         * legible on a dark accent. It is not a contrast fix: brightness(0)
         * zeroes all three colour channels and invert(1) then raises every
         * pixel to white, so a logo exported on an opaque canvas — the common
         * case — painted as a solid white rectangle. Measured before the fix:
         * one distinct colour, #ffffff.
         *
         * Asserting on computed style rather than pixels because it is the
         * filter that is the bug, and because reading the image back through a
         * canvas bypasses filters entirely — which is how this got missed the
         * first time.
         */
        const LOGO =
            "data:image/svg+xml;base64," +
            Buffer.from(
                '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60">' +
                    '<rect width="120" height="60" fill="#ffffff"/>' +
                    '<rect width="60" height="60" fill="#e11d48"/></svg>'
            ).toString("base64");

        // Every template that renders a logo (Minimal, 5, deliberately does not).
        for (const id of [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13]) {
            await page.addInitScript(
                ({ invoice, logo, template }) => {
                    window.localStorage.setItem(
                        "invoify:invoiceDraft",
                        JSON.stringify({
                            ...invoice,
                            details: {
                                ...invoice.details,
                                invoiceLogo: logo,
                                pdfTemplate: template,
                            },
                        })
                    );
                },
                { invoice: SAMPLE_INVOICE, logo: LOGO, template: id }
            );

            await page.goto("/en");

            const logo = page.locator('.invoice-live-preview img[alt*="Logo"]');
            await expect(logo, `template ${id} did not render a logo`).toBeVisible({
                timeout: 10_000,
            });

            const filters = await page.evaluate(() => {
                const img = document.querySelector(
                    '.invoice-live-preview img[alt*="Logo"]'
                );
                const found: string[] = [];
                let node: Element | null = img;
                while (node && !node.classList.contains("invoice-live-preview")) {
                    const f = getComputedStyle(node).filter;
                    if (f && f !== "none") found.push(f);
                    node = node.parentElement;
                }
                return found;
            });

            expect(
                filters,
                `template ${id} filters its logo: ${filters.join(", ")}`
            ).toEqual([]);
        }
    });

    test("the guide is its own page, not a copy of the homepage", async ({
        request,
    }) => {
        const home = await request.get("/en");
        const guide = await request.get("/en/guide");
        expect(guide.status()).toBe(200);

        const homeHtml = await home.text();
        const guideHtml = await guide.text();

        const h1 = (html: string) =>
            html.match(/<h1[^>]*>(.*?)<\/h1>/i)?.[1] ?? "";
        const canonical = (html: string) =>
            html.match(/rel="canonical"[^>]*href="([^"]+)"/i)?.[1] ?? "";
        const types = (html: string) =>
            [
                ...html.matchAll(
                    /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs
                ),
            ].map((m) => JSON.parse(m[1])["@type"]);

        // Distinct heading and canonical, or the two pages compete.
        expect(h1(guideHtml)).not.toBe(h1(homeHtml));
        expect(canonical(guideHtml)).toMatch(/\/en\/guide$/);

        // One h1 each.
        expect((guideHtml.match(/<h1/g) ?? []).length).toBe(1);

        /*
         * The FAQ schema belongs to one URL. Emitting the same FAQPage from
         * both makes them compete for the same rich result.
         */
        expect(types(homeHtml)).toContain("FAQPage");
        expect(types(guideHtml)).not.toContain("FAQPage");

        // Both still carry real prose.
        const prose = (html: string) =>
            html
                .replace(/<script[\s\S]*?<\/script[^>]*>/gi, " ")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim().length;
        expect(prose(homeHtml)).toBeGreaterThan(1200);
        expect(prose(guideHtml)).toBeGreaterThan(1200);
    });

    test("warm endpoint reports the renderer is ready", async ({ request }) => {
        const res = await request.get("/api/invoice/warm");

        /*
         * 200 or 429, and both are correct behaviour.
         *
         * The client pings this on every mount, so across a full suite run the
         * tests' own traffic reaches the endpoint's rate limit — from one IP,
         * which is exactly what the limiter is for. Asserting a bare 200 made
         * this pass alone and fail in the suite, which is a test that reports
         * on the order it ran in rather than on the endpoint.
         */
        expect([200, 429]).toContain(res.status());

        if (res.status() === 200) {
            expect(await res.json()).toEqual({ ready: true });
        } else {
            expect(res.headers()["retry-after"]).toBeTruthy();
        }
    });

    test("appearance chips drop down instead of opening the gallery", async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()!.width < 1280,
            "the chip row is part of the desktop preview toolbar"
        );

        const problems: string[] = [];
        collectProblems(page, problems);

        await page.goto("/en");

        /*
         * The regression this guards: all four chips used to call the same
         * handler, so "Density · Comfortable" opened a modal whose main
         * content was thirteen template thumbnails.
         */
        await page.getByRole("button", { name: /^Font/ }).click();

        const menu = page
            .getByRole("dialog")
            .filter({ hasText: "IBM Plex Sans" });
        await expect(menu).toBeVisible();
        await expect(page.getByText("Choose a template")).toHaveCount(0);

        // Picking dismisses the menu and the chip reports the new value.
        await menu.getByRole("button", { name: "Source Serif" }).click();
        await expect(menu).toBeHidden();
        await expect(
            page.getByRole("button", { name: /^Font/ })
        ).toContainText("Source Serif");

        // The template chip is the one that still needs the room.
        await page.getByRole("button", { name: /^Template/ }).click();
        await expect(page.getByText("Choose a template")).toBeVisible();

        await page.keyboard.press("Escape");
        await page.waitForTimeout(400);
        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("bill from and bill to sit side by side in the rail", async ({
        page,
    }) => {
        test.skip(
            page.viewportSize()!.width < 1280,
            "phones keep the single stacked column"
        );

        await page.goto("/en");

        const boxes = await page.evaluate(() => {
            const sections = [...document.querySelectorAll("section")].filter(
                (s) => s.querySelector("input")
            );
            return sections.slice(0, 2).map((s) => {
                const r = s.getBoundingClientRect();
                return { top: Math.round(r.top), width: Math.round(r.width) };
            });
        });

        expect(boxes).toHaveLength(2);
        // Same row, not stacked.
        expect(Math.abs(boxes[0].top - boxes[1].top)).toBeLessThanOrEqual(2);

        /*
         * Each half is far too narrow for a 7rem label beside its input, so
         * the rows inside must fall back to stacking — `shell:@[20rem]:` in
         * fieldStyles.ts. A paired row here would leave a ~76px field.
         */
        const rowDisplay = await page.evaluate(() => {
            const input = document.querySelector<HTMLElement>(
                'input[name="sender.name"]'
            );
            const row = input?.closest<HTMLElement>('[class*="@[20rem]"]');
            return row ? getComputedStyle(row).display : null;
        });
        expect(rowDisplay).toBe("flex");

        /*
         * And the two halves start at the same line.
         *
         * They did not: the address book existed on the receiver side only, so
         * its two buttons pushed Bill To's first field ~84px below Bill From's
         * and the columns read as misaligned. Giving the sender the same
         * feature — which it wanted on its own merits — squares them up.
         */
        const firstFields = await page.evaluate(() => {
            const top = (name: string) =>
                Math.round(
                    document
                        .querySelector(`input[name="${name}"]`)!
                        .getBoundingClientRect().top
                );
            return { sender: top("sender.name"), receiver: top("receiver.name") };
        });
        expect(
            Math.abs(firstFields.sender - firstFields.receiver)
        ).toBeLessThanOrEqual(1);
    });

    test("the sender has its own address book", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);
        await page.goto("/en");

        await page.getByRole("button", { name: /save sender/i }).click();
        await expect(
            page.getByRole("button", { name: /^senders/i })
        ).toBeEnabled();

        // Wipe the sender, then restore it from its own book.
        await page.locator('input[name="sender.name"]').fill("");
        await page.locator('input[name="sender.city"]').fill("");

        await page.getByRole("button", { name: /^senders/i }).click();
        await page
            .getByRole("dialog")
            .getByRole("button", { name: /^John Doe/ })
            .click();

        await expect(page.locator('input[name="sender.name"]')).toHaveValue(
            "John Doe"
        );
        await expect(page.locator('input[name="sender.city"]')).toHaveValue(
            "Anytown"
        );

        /*
         * Separate books, not one shared list: saving a sender must not put
         * your own company into the client picker.
         */
        const senders =
            (await readStored<{ name: string }[]>(page, "invoify:senders")) ??
            [];
        const clients =
            (await readStored<{ name: string }[]>(page, "invoify:clients")) ??
            [];
        expect(senders.map((p) => p.name)).toEqual(["John Doe"]);
        expect(clients).toEqual([]);

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("stored personal data is not legible on disk", async ({ page }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        await seedDraft(page);
        await page.goto("/en");

        await page.getByRole("button", { name: /save client/i }).click();
        await expect(
            page.getByRole("button", { name: /^clients/i })
        ).toBeEnabled();

        // Give the draft debounce time to write too.
        await page.waitForTimeout(1500);

        /*
         * The point of the whole exercise: someone reading the browser profile
         * off disk gets ciphertext. Checked against the actual values in the
         * seeded invoice rather than a token string, because a partial
         * encryption would still leak exactly these.
         */
        for (const key of ["invoify:clients", "invoify:invoiceDraft"]) {
            expect(await isEncrypted(page, key), `${key} ciphertext`).toBe(true);

            /*
             * Everything on disk for this key — the ciphertext bytes and
             * anything localStorage still holds. Checked against the real
             * values in the seeded invoice rather than a token string, because
             * a partial encryption would leak exactly these.
             */
            const onDisk = await rawStored(page, key);
            for (const secret of [
                "Jane Smith",
                "janesmith@example.com",
                "987-654-3210",
                "456 Elm St",
            ]) {
                expect(onDisk.includes(secret), `${key} leaks ${secret}`).toBe(
                    false
                );
            }
        }

        // And it is genuinely the data, not just scrambled beyond use.
        const clients = await readStored<{ name: string }[]>(
            page,
            "invoify:clients"
        );
        expect(clients?.map((c) => c.name)).toEqual(["Jane Smith"]);

        /*
         * The key must be non-extractable. This is the property that makes the
         * IndexedDB record worthless on its own: the browser will hand out a
         * usable handle and refuse to ever produce the bytes.
         */
        const keyState = await page.evaluate(async () => {
            const db = await new Promise<IDBDatabase>((resolve, reject) => {
                // Must match the app's DB_VERSION; opening with a lower one
                // throws VersionError rather than downgrading.
                const request = indexedDB.open("invoify-secure", 2);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            const key = await new Promise<CryptoKey>((resolve, reject) => {
                const request = db
                    .transaction("keys", "readonly")
                    .objectStore("keys")
                    .get("storage-key");
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            let exported = "did not throw";
            try {
                await crypto.subtle.exportKey("raw", key);
            } catch {
                exported = "refused";
            }
            return {
                algorithm: (key.algorithm as AesKeyAlgorithm).name,
                length: (key.algorithm as AesKeyAlgorithm).length,
                extractable: key.extractable,
                exported,
            };
        });

        expect(keyState).toEqual({
            algorithm: "AES-GCM",
            length: 256,
            extractable: false,
            exported: "refused",
        });

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("a plaintext address book from an older build is migrated", async ({
        page,
    }) => {
        const problems: string[] = [];
        collectProblems(page, problems);

        // Exactly what the previous release wrote.
        await page.addInitScript(() => {
            window.localStorage.setItem(
                "invoify:clients",
                JSON.stringify([
                    {
                        id: "legacy-1",
                        name: "Legacy Client",
                        address: "1 Old Road",
                        zipCode: "00001",
                        city: "Oldtown",
                        country: "Nowhere",
                        email: "legacy@example.com",
                        phone: "555-0000",
                        customInputs: [],
                    },
                ])
            );
        });
        await page.goto("/en");

        // Still there, and usable.
        await page.getByRole("button", { name: /^clients/i }).click();
        await page
            .getByRole("dialog")
            .getByRole("button", { name: /^Legacy Client/ })
            .click();
        await expect(page.locator('input[name="receiver.name"]')).toHaveValue(
            "Legacy Client"
        );

        // And rewritten encrypted, rather than left as it was found.
        await expect
            .poll(() => isEncrypted(page, "invoify:clients"))
            .toBe(true);

        /*
         * And the plaintext copy is gone, not merely superseded. Leaving it
         * beside the ciphertext would encrypt nothing in practice.
         */
        expect(
            await page.evaluate(() =>
                window.localStorage.getItem("invoify:clients")
            )
        ).toBeNull();
        expect(
            (await rawStored(page, "invoify:clients")).includes(
                "legacy@example.com"
            )
        ).toBe(false);

        expect(problems, `page problems:\n${problems.join("\n")}`).toEqual([]);
    });

    test("languages list English and Azerbaijani first, then alphabetically", async ({
        page,
    }) => {
        await page.goto("/en");
        await openLanguageMenu(page);

        const names = await languageMenu(page)
            .locator("button span.truncate")
            .allTextContents();

        expect(names.slice(0, 4)).toEqual([
            "English",
            "Azərbaycanca",
            "Bahasa Indonesia",
            "Català",
        ]);

        /*
         * Latin-script names sort among themselves and the other scripts group
         * after them — Intl.Collator's root order, which is what makes a
         * mixed-script list readable rather than arbitrary.
         */
        expect(names.slice(-5)).toEqual([
            "Српски",
            "עברית",
            "العربية",
            "日本語",
            "简体中文",
        ]);
    });

    test("switching language shows progress and keeps what was typed", async ({
        page,
    }) => {
        await page.goto("/en");

        const name = page.locator('input[name="sender.name"]');
        await name.fill("Persisted Ltd");

        /*
         * Hold the German payload back for a moment.
         *
         * Without this the assertion below is a race against the network: on a
         * warm production server the navigation can land before Playwright
         * looks, and the test would then pass or fail on timing rather than on
         * whether the pending state exists at all.
         */
        await page.route("**/de**", async (route) => {
            await new Promise((resolve) => setTimeout(resolve, 800));
            await route.continue();
        });

        await openLanguageMenu(page);
        await languageMenu(page)
            .getByRole("button", { name: /Deutsch/ })
            .click();

        /*
         * The point of the whole change: a locale switch is a server
         * navigation, and until this landed nothing on screen said so.
         */
        await expect(
            page.getByRole("button", { name: "Languages" }).first()
        ).toHaveAttribute("aria-busy", "true");

        await expect(page).toHaveURL(/\/de/);
        // The draft is restored, so an in-progress invoice survives the switch.
        await expect(page.locator('input[name="sender.name"]')).toHaveValue(
            "Persisted Ltd"
        );
    });
});

const SAMPLE_INVOICE = {
    sender: {
        name: "John Doe",
        address: "123 Main St",
        zipCode: "12345",
        city: "Anytown",
        country: "USA",
        email: "johndoe@example.com",
        phone: "123-456-7890",
    },
    receiver: {
        name: "Jane Smith",
        address: "456 Elm St",
        zipCode: "54321",
        city: "Other Town",
        country: "Canada",
        email: "janesmith@example.com",
        phone: "987-654-3210",
    },
    details: {
        invoiceLogo: "",
        invoiceNumber: "INV0001",
        invoiceDate: "2026-01-15T00:00:00.000Z",
        dueDate: "2026-02-15T00:00:00.000Z",
        items: [
            { name: "Product 1", description: "A thing", quantity: 4, unitPrice: 50, total: 200 },
        ],
        currency: "USD",
        language: "English",
        taxDetails: { amount: 15, amountType: "percentage", taxID: "987654321" },
        discountDetails: { amount: 5, amountType: "percentage" },
        shippingDetails: { cost: 5, costType: "percentage" },
        paymentInformation: {
            bankName: "Bank Inc.",
            accountName: "John Doe",
            accountNumber: "445566998877",
        },
        additionalNotes: "Thank you for your business",
        paymentTerms: "Net 30",
        subTotal: 200,
        totalAmount: 200,
        totalAmountInWords: "Two Hundred",
        pdfTemplate: 1,
        theme: { accentColor: "#4F46E5", fontId: "outfit", density: "comfortable" },
    },
};
