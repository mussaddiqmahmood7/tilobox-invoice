import type { Metadata } from "next";

// Components
import LandingContent from "@/app/components/layout/LandingContent";

// i18n
import { getMessages } from "@/i18n/messages";

// SEO
import { languageAlternates, ROOTKEYWORDS } from "@/lib/seo";
import { BASE_URL } from "@/lib/variables";

/**
 * The long-form copy, on its own page.
 *
 * It used to sit entirely below the builder. Moving "what you get" and "how it
 * works" here keeps the homepage short while giving the site a second
 * indexable page — the homepage keeps its heading, intro and FAQ, which is
 * what it needs to rank at all.
 */
export async function generateMetadata(props: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await props.params;
    const messages = await getMessages(locale);
    const meta = (messages as Record<string, Record<string, string>>)?.meta ?? {};
    const landing =
        (messages as Record<string, Record<string, string>>)?.landing ?? {};

    const title = `${
        landing.guideH1 ?? landing.h1 ?? "How it works"
    } — Invoify`;
    const description = meta.description ?? "";

    // hreflang for this page's own path, not the homepage's.
    const languages = Object.fromEntries(
        Object.entries(languageAlternates()).map(([lang, path]) => [
            lang,
            `${path}/guide`,
        ])
    );

    return {
        metadataBase: new URL(BASE_URL),
        title,
        description,
        keywords: ROOTKEYWORDS,
        robots: { index: true, follow: true },
        alternates: { canonical: `/${locale}/guide`, languages },
        openGraph: {
            type: "article",
            siteName: "Invoify",
            title,
            description,
            url: `/${locale}/guide`,
            locale,
        },
        twitter: { card: "summary_large_image", title, description },
    };
}

export default async function GuidePage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;

    return (
        <main>
            <LandingContent locale={locale} variant="guide" />
        </main>
    );
}
