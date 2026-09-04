/**
 * Per-invoice presentation options.
 *
 * Passed to the templates as a plain prop, exactly like `labels` — the
 * templates render both inside the client tree (live preview) and through
 * `renderToStaticMarkup` in a route handler (PDF), where React context and
 * next-intl hooks are unavailable.
 *
 * This module is deliberately free of React so it is safe to import anywhere.
 */

/**
 * Three levels, smallest to largest. Adjusts spacing *and* text size together,
 * so one control covers both "twenty items must fit on one page" and "three
 * items look lost on all that paper".
 */
export type InvoiceDensity = "compact" | "comfortable" | "spacious";

export type InvoiceFontId = "outfit" | "plexSans" | "sourceSerif" | "plexMono";

export type InvoiceTheme = {
    /** Hex colour used for headings, rules and accent fills. */
    accentColor: string;
    fontId: InvoiceFontId;
    density: InvoiceDensity;
};

export const DEFAULT_INVOICE_THEME: InvoiceTheme = {
    accentColor: "#4F46E5",
    fontId: "outfit",
    density: "comfortable",
};

/** Offered in the gallery; a custom hex is also allowed. */
export const ACCENT_PRESETS = [
    { name: "Indigo", value: "#4F46E5" },
    { name: "Slate", value: "#334155" },
    { name: "Teal", value: "#0F766E" },
    { name: "Forest", value: "#15803D" },
    { name: "Plum", value: "#7E22CE" },
    { name: "Rust", value: "#C2410C" },
    { name: "Crimson", value: "#BE123C" },
    { name: "Ink", value: "#111827" },
] as const;

/**
 * Font stacks. Every family here is embedded into the PDF stylesheet by
 * scripts/build-pdf-css.mjs, so the PDF renders with the chosen face rather
 * than silently falling back.
 */
/*
 * Glyph fallback for the embedded PDF fonts.
 *
 * The PDF makes zero network requests — every font is base64'd into the
 * generated stylesheet — so a character with no glyph in the chosen family has
 * nowhere to go and Chromium reaches for whatever the render machine happens
 * to have (Segoe UI on Windows, something else on Lambda). That is both ugly
 * and non-deterministic.
 *
 * Outfit in particular has no schwa (U+0259 / U+018F) in either of its
 * subsets, and the schwa is one of the most common letters in Azerbaijani.
 * IBM Plex Sans is already embedded and does have it, so naming it here means
 * only the missing character changes typeface, and it changes to a font we
 * ship rather than a system one. CSS font fallback is per-character, so
 * everything else still renders in the chosen family.
 */
const GLYPH_FALLBACK =
    "'IBM Plex Sans', 'Noto Sans Hebrew', 'Noto Sans Arabic', system-ui, sans-serif";

export const INVOICE_FONTS: {
    id: InvoiceFontId;
    name: string;
    description: string;
    stack: string;
}[] = [
    {
        id: "outfit",
        name: "Outfit",
        description: "Geometric sans",
        stack: `'Outfit', ${GLYPH_FALLBACK}`,
    },
    {
        id: "plexSans",
        name: "IBM Plex Sans",
        description: "Neutral sans",
        stack: GLYPH_FALLBACK,
    },
    {
        id: "sourceSerif",
        name: "Source Serif",
        description: "Classic serif",
        stack: `'Source Serif 4', ${GLYPH_FALLBACK}`,
    },
    {
        id: "plexMono",
        name: "IBM Plex Mono",
        description: "Technical mono",
        stack: `'IBM Plex Mono', ${GLYPH_FALLBACK}`,
    },
];

export function fontStack(fontId: InvoiceFontId): string {
    return (
        INVOICE_FONTS.find((f) => f.id === fontId)?.stack ??
        INVOICE_FONTS[0].stack
    );
}

/**
 * Density scale.
 *
 * These are literal Tailwind class strings so the PDF stylesheet generator
 * picks them up when it scans this directory — a computed class name would be
 * missing from the compiled CSS and silently do nothing in the PDF.
 */
export type InvoiceScale = ReturnType<typeof densityScale>;

const DENSITY_SCALES = {
    compact: {
        page: "p-5 sm:p-8",
        stack: "space-y-4",
        sectionGap: "mt-4",
        rowY: "py-1",
        body: "text-[11px]",
        label: "text-[9px]",
        heading: "text-lg",
        name: "text-sm",
        total: "text-base",
    },
    comfortable: {
        page: "p-6 sm:p-12",
        stack: "space-y-7",
        sectionGap: "mt-7",
        rowY: "py-2",
        body: "text-xs",
        label: "text-[10px]",
        heading: "text-2xl",
        name: "text-base",
        total: "text-lg",
    },
    spacious: {
        page: "p-7 sm:p-14",
        stack: "space-y-9",
        sectionGap: "mt-9",
        rowY: "py-3",
        body: "text-sm",
        label: "text-[11px]",
        heading: "text-3xl",
        name: "text-lg",
        total: "text-xl",
    },
} as const;

export function densityScale(density: InvoiceDensity) {
    return DENSITY_SCALES[density] ?? DENSITY_SCALES.comfortable;
}

/** Normalises a possibly-partial theme coming from stored invoices. */
export function resolveTheme(theme?: Partial<InvoiceTheme>): InvoiceTheme {
    return {
        accentColor: theme?.accentColor || DEFAULT_INVOICE_THEME.accentColor,
        fontId: theme?.fontId || DEFAULT_INVOICE_THEME.fontId,
        density: theme?.density || DEFAULT_INVOICE_THEME.density,
    };
}

/**
 * Mixes an accent with white to get a tint usable as a background behind dark
 * text. Done arithmetically rather than with colour-mix() so it works in the
 * PDF renderer and in every browser the preview runs in.
 */
export function tint(hex: string, amount: number): string {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return hex;

    const mix = (channel: number) =>
        Math.round(channel + (255 - channel) * amount);

    const r = mix(parseInt(clean.slice(0, 2), 16));
    const g = mix(parseInt(clean.slice(2, 4), 16));
    const b = mix(parseInt(clean.slice(4, 6), 16));

    return `rgb(${r}, ${g}, ${b})`;
}

/** Picks black or white text for a given background, by relative luminance. */
export function readableOn(hex: string): string {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return "#ffffff";

    const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };

    const luminance =
        0.2126 * channel(parseInt(clean.slice(0, 2), 16)) +
        0.7152 * channel(parseInt(clean.slice(2, 4), 16)) +
        0.0722 * channel(parseInt(clean.slice(4, 6), 16));

    return luminance > 0.45 ? "#111827" : "#ffffff";
}
