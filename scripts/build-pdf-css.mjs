/**
 * Compiles the Tailwind CSS used by the invoice PDF templates into a plain
 * string module that the PDF service can inject directly.
 *
 * Previously every PDF request did `page.addStyleTag({ url: TAILWIND_CDN })`,
 * a serial network round trip to a CDN pinned at Tailwind v2.2.19 — two majors
 * behind the app's own 3.3.5, which is why generated PDFs could drift visually
 * from the live preview. Compiling here removes the request entirely and puts
 * the PDF on the same Tailwind version as the rest of the app.
 *
 * It also embeds the fonts as base64 @font-face rules. Previously the
 * templates linked Google Fonts, which meant the PDF depended on a third party
 * at request time — and worse, the wait for it was unreliable:
 * `document.fonts.ready` resolves immediately when the stylesheet has not been
 * fetched yet (nothing is pending), so Chromium printed with a fallback font.
 * Embedding removes both the network dependency and the race.
 *
 * Fonts are read from node_modules (@fontsource/*) rather than downloaded, so
 * builds stay reproducible and work offline.
 *
 * Runs from the `prebuild` / `predev` npm scripts.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";
import tailwindcss from "tailwindcss";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const outFile = resolve(projectRoot, "lib/pdfStyles.generated.ts");

/**
 * Unicode ranges, copied from what Google Fonts serves for these families.
 *
 * The `latin` subset stops at Latin-1. That leaves no glyph at all for the
 * characters several shipped locales need — Azerbaijani `e-schwa`, Turkish
 * dotless-i and s-cedilla, Polish l-stroke and ogoneks, Serbian-latin carons —
 * and since the PDF embeds its fonts and makes zero network requests, there is
 * no fallback to rescue them. Turkish and Polish invoices were already
 * rendering those characters as missing glyphs.
 *
 * Emitting both subsets with a `unicode-range` lets Chromium load only the one
 * a given document actually needs, so the common case costs nothing extra.
 */
const UNICODE_RANGES = {
    latin:
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC," +
        "U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193," +
        "U+2212,U+2215,U+FEFF,U+FFFD",
    "latin-ext":
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304," +
        "U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB," +
        "U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
    hebrew: "U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F",
    arabic:
        "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1," +
        "U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF," +
        "U+FE70-FE74,U+FE76-FEFC",
};

const SUBSETS = ["latin", "latin-ext"];

/**
 * Script fonts for the right-to-left locales.
 *
 * None of the four body families above contain a single Hebrew or Arabic
 * glyph, and the PDF embeds its fonts and makes no network requests — so
 * without these, a Hebrew invoice renders as tofu boxes on any machine with no
 * system font to fall back to, which includes the Lambda that generates them.
 *
 * Only the script subset is embedded: the Latin coverage in these families
 * duplicates what is already here, and `unicode-range` means Chromium only
 * reaches for them when the document actually contains those characters.
 */
const SCRIPT_FACES = [
    { family: "Noto Sans Hebrew", pkg: "noto-sans-hebrew", subset: "hebrew", weights: [400, 700] },
    { family: "Noto Sans Arabic", pkg: "noto-sans-arabic", subset: "arabic", weights: [400, 700] },
];

/**
 * Only the weights the templates actually use. Each weight is ~15-20kB of
 * base64 per subset in the generated module, which is server-only.
 */
const FONT_FACES = [
    { family: "Outfit", pkg: "outfit", weights: [400, 500, 600, 700] },
    { family: "Dancing Script", pkg: "dancing-script", weights: [400] },
    { family: "Parisienne", pkg: "parisienne", weights: [400] },
    { family: "Great Vibes", pkg: "great-vibes", weights: [400] },
    { family: "Alex Brush", pkg: "alex-brush", weights: [400] },
    // Selectable invoice faces (see invoiceTheme.ts)
    { family: "IBM Plex Sans", pkg: "ibm-plex-sans", weights: [400, 600, 700] },
    { family: "Source Serif 4", pkg: "source-serif-4", weights: [400, 600, 700] },
    { family: "IBM Plex Mono", pkg: "ibm-plex-mono", weights: [400, 600, 700] },
];

async function buildFontFaces() {
    const rules = [];

    for (const { family, pkg, weights } of FONT_FACES) {
        for (const weight of weights) {
            for (const subset of SUBSETS) {
                const file = resolve(
                    projectRoot,
                    `node_modules/@fontsource/${pkg}/files/${pkg}-${subset}-${weight}-normal.woff2`
                );

                const base64 = (await readFile(file)).toString("base64");

                rules.push(
                    `@font-face{font-family:'${family}';font-style:normal;` +
                        `font-weight:${weight};font-display:block;` +
                        `unicode-range:${UNICODE_RANGES[subset]};` +
                        `src:url(data:font/woff2;base64,${base64}) format('woff2');}`
                );
            }
        }
    }

    for (const { family, pkg, subset, weights } of SCRIPT_FACES) {
        for (const weight of weights) {
            const file = resolve(
                projectRoot,
                `node_modules/@fontsource/${pkg}/files/${pkg}-${subset}-${weight}-normal.woff2`
            );

            const base64 = (await readFile(file)).toString("base64");

            rules.push(
                `@font-face{font-family:'${family}';font-style:normal;` +
                    `font-weight:${weight};font-display:block;` +
                    `unicode-range:${UNICODE_RANGES[subset]};` +
                    `src:url(data:font/woff2;base64,${base64}) format('woff2');}`
            );
        }
    }

    return rules.join("");   // CSS needs no separator between rules
}

const templateGlob = resolve(
    projectRoot,
    "app/components/templates/invoice-pdf/**/*.{ts,tsx}"
).replace(/\\/g, "/");

async function main() {
    const result = await postcss([
        tailwindcss({
            content: [templateGlob],
            // The PDF is standalone HTML rendered by Chromium — it does not
            // inherit the app's theme tokens or dark mode.
            darkMode: "media",
            theme: {},
            plugins: [],
        }),
    ]).process("@tailwind base;\n@tailwind utilities;\n", {
        from: undefined,
    });

    const fontCss = await buildFontFaces();
    const css = fontCss + result.css;

    const banner = [
        "// AUTO-GENERATED by scripts/build-pdf-css.mjs — do not edit by hand.",
        "// Regenerate with `npm run build:pdf-css`.",
        "",
        "export const PDF_TAILWIND_CSS = String.raw`",
    ].join("\n");

    // String.raw still terminates on a backtick and interpolates on ${.
    const escaped = css.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

    await mkdir(dirname(outFile), { recursive: true });
    await writeFile(outFile, `${banner}${escaped}\`;\n`, "utf8");

    const kb = (Buffer.byteLength(css, "utf8") / 1024).toFixed(1);
    const fontKb = (Buffer.byteLength(fontCss, "utf8") / 1024).toFixed(1);
    console.log(
        `[pdf-css] wrote ${outFile} (${kb} kB total, ${fontKb} kB embedded fonts)`
    );
}

main().catch((error) => {
    console.error("[pdf-css] failed to build PDF stylesheet:", error);
    process.exit(1);
});
