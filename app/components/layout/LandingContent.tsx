import { getMessages } from "@/i18n/messages";
import { buildFaqJsonLd } from "@/lib/seo";
import { FaqAccordion } from "@/app/components/layout/FaqAccordion";
import { BrandMark } from "@/app/components/reusables/BrandMark";

// Icons
import {
    ArrowUpRight,
    Globe2,
    Lock,
    Printer,
    QrCode,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Zap,
} from "lucide-react";

type Feature = { title: string; body: string };
type Faq = { q: string; a: string };

type Landing = {
    h1: string;
    intro: string;
    guideH1?: string;
    guideIntro?: string;
    featuresHeading: string;
    features: Record<string, Feature>;
    howHeading: string;
    how: Record<string, Feature>;
    faqHeading: string;
    faq: Record<string, Faq>;
};

type Variant = "home" | "guide";

export default async function LandingContent({
    locale,
    variant = "home",
}: {
    locale: string;
    variant?: Variant;
}) {
    const messages = await getMessages(locale);
    const landing = (messages as Record<string, unknown>)?.landing as
        | Landing
        | undefined;

    if (!landing) return null;

    const isGuide = variant === "guide";
    const faqList = Object.values(landing.faq);

    const featureHighlights = [
        {
            icon: Printer,
            title: "A4 & 80mm POS Receipts",
            description:
                "Switch seamlessly between 13 designer A4 invoice layouts and compact 80mm thermal receipt rolls for retail point-of-sale.",
        },
        {
            icon: Lock,
            title: "100% In-Browser Privacy",
            description:
                "Zero sign-up, zero server databases, and no tracking. Your invoice data is encrypted and saved strictly in your own local device storage.",
        },
        {
            icon: Zap,
            title: "Available Offline",
            description:
                "Make it offline on desktop, iOS, or Android. Works completely without an active internet connection with direct browser printing.",
        },
        {
            icon: QrCode,
            title: "Payment QR Codes",
            description:
                "Generate scannable payment QR codes (UPI, SEPA, Crypto, or web links) embedded directly into your invoices for instant client checkout.",
        },
        {
            icon: Globe2,
            title: "170+ Currencies & Locales",
            description:
                "Format invoices in 170+ international currencies with live exchange rate integration and 18 native translations.",
        },
        {
            icon: SlidersHorizontal,
            title: "Brand Styling & Signatures",
            description:
                "Upload your company logo, choose curated accent palettes, customize typographic scale, and draw or upload authenticated signatures.",
        },
    ];

    return (
        <section className="relative overflow-hidden border-t border-border bg-gradient-to-b from-background via-card/50 to-background py-16 sm:py-24">
            {/* Ambient Background Glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[48rem] -translate-x-1/2 bg-primary/10 blur-[130px] dark:bg-primary/15"
            />

            <div className="container relative z-10 flex flex-col gap-16">
                {/* Hero Feature Showcase */}
                <div className="mx-auto max-w-4xl text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>TiloBox Suite • 100% In-Browser • Zero Database</span>
                    </div>

                    <h1 className="mt-6 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
                        {isGuide ? (
                            (landing.guideH1 ?? landing.h1)
                        ) : (
                            <>
                                Free In-Browser Invoice &{" "}
                                <span className="bg-gradient-to-r from-primary via-sky-500 to-teal-400 bg-clip-text text-transparent">
                                    Thermal Receipt
                                </span>{" "}
                                Generator
                            </>
                        )}
                    </h1>

                    <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                        {isGuide
                            ? (landing.guideIntro ?? landing.intro)
                            : landing.intro}
                    </p>

                    {/* Quick Trust Badges */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-2xs">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                            Zero Signup
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-2xs">
                            <Lock className="h-3.5 w-3.5 text-primary" />
                            Encrypted Local Drafts
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-2xs">
                            <Printer className="h-3.5 w-3.5 text-sky-500" />
                            13 Templates + 80mm POS
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-2xs">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            Make It Offline
                        </span>
                    </div>
                </div>

                {/* 6-Card Feature Grid */}
                <div className="mx-auto max-w-5xl">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {featureHighlights.map((feat) => {
                            const Icon = feat.icon;
                            return (
                                <div
                                    key={feat.title}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card/70 p-6 shadow-xs backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card hover:shadow-card-hover"
                                >
                                    <div>
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="mt-4 text-base font-bold tracking-tight text-foreground">
                                            {feat.title}
                                        </h3>
                                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                            {feat.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Guide-Specific How It Works */}
                {isGuide && (
                    <div className="mx-auto max-w-4xl">
                        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
                            {landing.howHeading}
                        </h2>
                        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
                            {Object.values(landing.how).map((step, index) => (
                                <li
                                    key={step.title}
                                    className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xs"
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                        {index + 1}
                                    </span>
                                    <h3 className="mt-4 text-base font-bold text-foreground">
                                        {step.title}
                                    </h3>
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                                        {step.body}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* Interactive FAQ Section */}
                {!isGuide && (
                    <div className="mx-auto w-full max-w-3xl">
                        <div className="mb-8 text-center">
                            <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                                {landing.faqHeading}
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Everything you need to know about TiloBox Invoice and zero-database billing.
                            </p>
                        </div>

                        <FaqAccordion items={faqList} />
                    </div>
                )}

                {/* TiloBox Ecosystem Banner */}
                <div className="mx-auto w-full max-w-4xl">
                    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-card via-primary/5 to-card p-6 sm:p-8 shadow-xs">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <BrandMark className="h-12 w-12 rounded-2xl shadow-md shrink-0" />
                                <div>
                                    <h3 className="text-base font-bold text-foreground sm:text-lg">
                                        Part of the TiloBox Suite
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-md">
                                        Discover verified open-source software, free developer tools, and privacy-first web utilities at TiloBox.
                                    </p>
                                </div>
                            </div>
                            <a
                                href="https://tilobox.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 hover:shadow-md"
                            >
                                <span>Visit TiloBox</span>
                                <ArrowUpRight className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Structured Data for SEO Rich Snippets */}
            {!isGuide && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(buildFaqJsonLd(faqList)),
                    }}
                />
            )}
        </section>
    );
}
