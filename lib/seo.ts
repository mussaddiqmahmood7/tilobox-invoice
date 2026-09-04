import { AUTHOR_WEBSITE, BASE_URL, DEFAULT_LOCALE, LOCALES } from "@/lib/variables";

export const ROOTKEYWORDS = [
    "invoice",
    "invoice generator",
    "invoice generating",
    "invoice app",
    "invoice generator app",
    "free invoice generator",
    "invoice template",
    "pdf invoice",
];

/** Path for a locale, always prefixed — routing uses localePrefix "always". */
export const localePath = (locale: string) => `/${locale}`;

/**
 * `alternates.languages` for Next's metadata.
 *
 * Every locale points at its own path, plus an `x-default` on English. The
 * previous metadata had no hreflang at all and a single hardcoded canonical of
 * `BASE_URL` — which, because the default locale is still prefixed, is a
 * redirect rather than a page. Every locale was therefore telling search
 * engines that the canonical version of itself was a redirect to English.
 */
export function languageAlternates(): Record<string, string> {
    const languages: Record<string, string> = {};
    for (const { code } of LOCALES) {
        languages[code] = localePath(code);
    }
    languages["x-default"] = localePath(DEFAULT_LOCALE);
    return languages;
}

/**
 * Structured data for the site.
 *
 * The previous object declared `@type: "Website"` — not a real schema.org type,
 * which is `WebSite` — while *also* carrying an `@graph` with a second, almost
 * empty WebSite node, so it described the same thing twice and neither
 * completely. Its `image` pointed at a hashed `/_next/static/media/…` build
 * artefact that 404s after any rebuild.
 */
export function buildJsonLd(locale: string) {
    const url = `${BASE_URL}${localePath(locale)}`;

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": `${BASE_URL}/#app`,
        name: "Invoify",
        url,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        description:
            "Free invoice generator. Build an invoice from thirteen templates and download it as a PDF.",
        inLanguage: locale,
        keywords: ROOTKEYWORDS,
        // Generated on demand by app/[locale]/opengraph-image.tsx, so it cannot
        // go stale the way a hashed asset URL did.
        image: `${BASE_URL}${localePath(locale)}/opengraph-image`,
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        author: {
            "@type": "Person",
            name: "Ali Abbasov",
            url: AUTHOR_WEBSITE,
        },
    };
}

/** FAQPage structured data, paired with the FAQ rendered on the page. */
export function buildFaqJsonLd(faqs: { q: string; a: string }[]) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
        })),
    };
}
