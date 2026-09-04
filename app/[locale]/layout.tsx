// Components
import { BaseFooter, BaseNavbar } from "@/app/components";
// ShadCn
import { Toaster } from "@/components/ui/toaster";
// Contexts
import Providers from "@/contexts/Providers";
// Fonts
import {
    alexBrush,
    dancingScript,
    greatVibes,
    outfit,
    parisienne,
} from "@/lib/fonts";
// SEO
import {
    buildJsonLd,
    languageAlternates,
    localePath,
    ROOTKEYWORDS,
} from "@/lib/seo";
// Variables
import {
    BASE_URL,
    dirForLocale,
    GOOGLE_SC_VERIFICATION,
    LOCALES,
} from "@/lib/variables";
// Vercel Analytics
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import Script from "next/script";
// Next Intl
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "@/i18n/messages";
import { notFound } from "next/navigation";

/**
 * Per-locale metadata.
 *
 * This was a single static object: one English title and description served to
 * all eighteen locales, no metadataBase, no Open Graph, no Twitter card, no
 * hreflang, and `canonical` hardcoded to the bare origin — which, since every
 * locale is path-prefixed, is a redirect rather than a page. Each locale was
 * telling search engines that the canonical version of itself was somewhere
 * else.
 */
export async function generateMetadata(props: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await props.params;
    const messages = await getMessages(locale);
    const meta = (messages as Record<string, Record<string, string>>)?.meta ?? {};

    const title = meta.title ?? "Invoify | Free Invoice Generator";
    const description =
        meta.description ??
        "Create invoices effortlessly with Invoify, the free invoice generator. Try it now!";

    return {
        // Resolves every relative URL below, including the generated OG image.
        metadataBase: new URL(BASE_URL),
        title,
        description,
        keywords: ROOTKEYWORDS,
        robots: { index: true, follow: true },
        alternates: {
            canonical: localePath(locale),
            languages: languageAlternates(),
        },
        openGraph: {
            type: "website",
            siteName: "Invoify",
            title,
            description,
            url: localePath(locale),
            locale,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        authors: {
            name: "Ali Abbasov",
            url: "https://aliabb.vercel.app",
        },
        verification: {
            google: GOOGLE_SC_VERIFICATION,
        },
    };
}

export const viewport = {
    width: "device-width",
    initialScale: 1,
};

export function generateStaticParams() {
    // Next.js expects an array of objects: [{ locale: 'en' },
    // ...]
    const locales = LOCALES.map((locale) => ({ locale: locale.code }));
    return locales;
}

export default async function LocaleLayout(props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const params = await props.params;

    const { locale } = params;

    const { children } = props;

    let messages;
    try {
        // English-backed so a key missing from a translation renders readable
        // copy instead of an error. See i18n/messages.ts
        messages = await getMessages(locale);
    } catch {
        notFound();
    }

    return (
        /*
         * `dir` was missing entirely. Arabic has been in LOCALES since before
         * this branch and rendered right-to-left text inside a left-to-right
         * document the whole time.
         */
        <html
            lang={locale}
            dir={dirForLocale(locale)}
            suppressHydrationWarning
        >
            <head suppressHydrationWarning>
                <script
                    type="application/ld+json"
                    id="json-ld"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(buildJsonLd(locale)),
                    }}
                />
            </head>
            <body
                className={`${outfit.className} ${dancingScript.variable} ${parisienne.variable} ${greatVibes.variable} ${alexBrush.variable} antialiased min-h-dvh bg-background text-foreground`}
                suppressHydrationWarning
            >
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Providers>
                        <BaseNavbar />

                        <div className="flex flex-col">{children}</div>

                        <BaseFooter />

                        {/* Toast component */}
                        <Toaster />

                        {/* Vercel analytics */}
                        <Analytics />

                        {/*
                         * Buy Me a Coffee widget. Loaded via next/script with
                         * lazyOnload so this third party does not block parsing
                         * — it was previously a synchronous <script> in <head>.
                         */}
                        <Script
                            src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
                            strategy="lazyOnload"
                            data-name="BMC-Widget"
                            data-cfasync="false"
                            data-id="aliabb"
                            data-description="Support me on Buy me a coffee!"
                            data-message="Thank you for using Invoify"
                            data-color="#5F7FFF"
                            data-position="Right"
                            data-x_margin="18"
                            data-y_margin="18"
                        />
                    </Providers>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
