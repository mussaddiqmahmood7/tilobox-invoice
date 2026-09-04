import React from "react";
import { NextRequest, NextResponse } from "next/server";

// Next Intl
import { getMessages } from "@/i18n/messages";

// Invoice document labels
import { buildInvoiceLabels } from "@/app/components/templates/invoice-pdf/invoiceLabels";

// Helpers
import { getInvoiceTemplate } from "@/lib/helpers";

// Variables
import { DEFAULT_LOCALE, LOCALES } from "@/lib/variables";

/** Only known locales are accepted; anything else falls back to the default. */
function resolveLocale(requested: string | null): string {
    if (requested && LOCALES.some((locale) => locale.code === requested)) {
        return requested;
    }
    return DEFAULT_LOCALE;
}

// Validation
import { InvoiceSchema } from "@/lib/schemas";
import { parseJsonBody } from "@/lib/server/validateRequest";

// Generated stylesheet
import { PDF_TAILWIND_CSS } from "@/lib/pdfStyles.generated";

// Browser
import { withPdfPage } from "./pdfPage";
import { getCachedPdf, pdfCacheKey, setCachedPdf } from "./pdfCache";

// Types
import { InvoiceType } from "@/types";

/**
 * Generate a PDF document of an invoice based on the provided data.
 *
 * @async
 * @param {NextRequest} req - The Next.js request object.
 * @throws {Error} If there is an error during the PDF generation process.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object containing the generated PDF.
 */
export async function generatePdfService(req: NextRequest) {
    // Client-side zod validation is bypassable by calling this route directly,
    // so the body is re-validated (and size-capped) here.
    const parsed = await parseJsonBody(req, InvoiceSchema);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data as InvoiceType;
    const locale = resolveLocale(req.nextUrl.searchParams.get("locale"));

    /*
     * Identical input, identical output — so re-submitting an unchanged invoice
     * should not cost a full render. Checked before any work is done.
     */
    const cacheKey = pdfCacheKey(body, locale);
    const cached = getCachedPdf(cacheKey);
    if (cached) return pdfResponse(cached, true);

    try {
        const ReactDOMServer = (await import("react-dom/server")).default;
        const templateId = body.details.pdfTemplate;
        const InvoiceTemplate = await getInvoiceTemplate(templateId);

        if (!InvoiceTemplate) {
            return NextResponse.json(
                { error: "Unknown invoice template" },
                { status: 400 }
            );
        }

        /*
         * The template was invoked as a plain function — `InvoiceTemplate(body)`
         * — which runs its body outside React's render cycle, so it could not
         * use hooks. Rendering it as a real element inside NextIntlClientProvider
         * lets the templates call useTranslations, which is what makes the PDF
         * follow the user's locale instead of always emitting English.
         */
        const messages = await getMessages(locale);

        const htmlTemplate = ReactDOMServer.renderToStaticMarkup(
            React.createElement(InvoiceTemplate, {
                ...body,
                labels: buildInvoiceLabels(messages),
                // Drives Intl number/currency formatting inside the document.
                locale,
            })
        );

        /*
         * One shared, pre-configured page reused across requests — see
         * pdfPage.ts. Creating a page per request was the largest remaining
         * fixed cost once the browser itself was shared.
         */
        const pdf = await withPdfPage(async (page) => {
            /*
             * `networkidle0` waits for 500ms of complete network silence. The
             * stylesheet is inlined below and the fonts are embedded in it, so
             * this document issues no requests at all — waiting for the DOM is
             * both correct and much faster.
             */
            await page.setContent(htmlTemplate, {
                waitUntil: "domcontentloaded",
                timeout: 30000,
            });

            // Inlined rather than fetched from a CDN on every request.
            await page.addStyleTag({ content: PDF_TAILWIND_CSS });

            // Fonts are embedded, so this resolves immediately. Kept as a cheap
            // guard rather than a load-bearing wait.
            await page
                .evaluate(() => document.fonts.ready.then(() => undefined))
                .catch(() => undefined);

            /*
             * No page margin.
             *
             * A 0.4in gutter on all four sides meant a full-bleed template
             * could never actually reach the paper: TwoTone, BoldHeader,
             * Corner, LeftRail and Sidebar paint their headers and rails
             * edge-to-edge within the sheet element, and every one of them
             * stopped 0.4in short with white around it — which is the "extra
             * space above the coloured band" that looked like a bug.
             *
             * Each template already carries its own page padding via
             * densityScale().page (p-6 sm:p-12, i.e. ~0.5in at 96dpi), so the
             * printed margin is now the template's decision rather than a
             * fixed frame imposed on all thirteen.
             */
            return page.pdf({
                format: "a4",
                printBackground: true,
                margin: { top: "0", right: "0", bottom: "0", left: "0" },
            });
        });

        setCachedPdf(cacheKey, pdf);

        return pdfResponse(pdf, false);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json(
            { error: "Failed to generate PDF" },
            { status: 500 }
        );
    }
}

/**
 * Builds the PDF response.
 *
 * The buffer is passed straight through — an earlier `new Blob([pdf])` copied
 * it again for no reason. `inline` lets the browser preview it rather than
 * forcing a download. `no-store` because an invoice is not something to leave
 * in a shared cache; the in-process cache above never crosses a request
 * boundary and is keyed on the full validated body.
 */
function pdfResponse(pdf: Uint8Array, cacheHit: boolean) {
    return new NextResponse(pdf, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline; filename=invoice.pdf",
            "Content-Length": String(pdf.byteLength),
            "Cache-Control": "no-store",
            // Diagnostic only — makes a cache hit observable in the network tab
            // and assertable from a test.
            "X-Pdf-Cache": cacheHit ? "hit" : "miss",
        },
        status: 200,
    });
}
