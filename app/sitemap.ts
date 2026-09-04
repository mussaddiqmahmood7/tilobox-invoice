import type { MetadataRoute } from "next";

import { languageAlternates, localePath } from "@/lib/seo";
import { BASE_URL, LOCALES } from "@/lib/variables";

/**
 * One entry per locale, each carrying the full hreflang set.
 *
 * There was no sitemap at all, and `app/robots.txt` had no `Sitemap:` line to
 * point at one, so the eighteen locale pages had to be discovered by crawling.
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const languages = languageAlternates();
    const lastModified = new Date();

    const entry = (path: string, priority: number, suffix = "") => ({
        url: `${BASE_URL}${path}${suffix}`,
        lastModified,
        changeFrequency: "weekly" as const,
        priority,
        alternates: {
            languages: Object.fromEntries(
                Object.entries(languages).map(([lang, p]) => [
                    lang,
                    `${BASE_URL}${p}${suffix}`,
                ])
            ),
        },
    });

    return LOCALES.flatMap(({ code }) => [
        entry(localePath(code), code === "en" ? 1 : 0.8),
        // The long-form copy, its own indexable page since round 4.
        entry(localePath(code), code === "en" ? 0.7 : 0.6, "/guide"),
    ]);
}
