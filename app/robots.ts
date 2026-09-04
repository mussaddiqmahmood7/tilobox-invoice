import type { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/variables";

/**
 * Replaces the static app/robots.txt, which allowed everything and named no
 * sitemap.
 *
 * The API routes are disallowed because they are POST endpoints that return
 * PDFs and JSON errors — nothing a crawler should spend budget on.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/"],
        },
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
