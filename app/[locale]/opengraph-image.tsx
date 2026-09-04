import { ImageResponse } from "next/og";

import { getMessages } from "@/i18n/messages";

/**
 * Open Graph card, generated rather than committed.
 *
 * A static PNG would have to be redrawn by hand for every locale and would
 * drift the moment the wording changed. Generating it means the card always
 * says what the page says. The previous setup had no OG image at all — links
 * to the site unfurled as a bare URL — and `lib/seo.ts` pointed its JSON-LD
 * `image` at a hashed build artefact that 404s after any rebuild.
 */
export const alt = "Invoify — free invoice generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const messages = await getMessages(locale);
    const meta = (messages as Record<string, Record<string, string>>)?.meta ?? {};

    const title = meta.ogTitle ?? "Free invoice generator";
    const description =
        meta.ogDescription ??
        "Thirteen templates. Fill it in, download the PDF. No account.";

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "#0F1017",
                    padding: 72,
                    // Satori has no default font stack; system-ui resolves on
                    // the render host.
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: "#6C63FF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 34,
                            fontWeight: 700,
                        }}
                    >
                        I
                    </div>
                    <div style={{ color: "#8E88F7", fontSize: 34, fontWeight: 700 }}>
                        Invoify
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div
                        style={{
                            color: "#ECEDF3",
                            fontSize: 66,
                            fontWeight: 700,
                            lineHeight: 1.1,
                            maxWidth: 900,
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            color: "#969CB0",
                            fontSize: 30,
                            lineHeight: 1.35,
                            maxWidth: 860,
                        }}
                    >
                        {description}
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        color: "#6E7488",
                        fontSize: 24,
                    }}
                >
                    <span>invoify.vercel.app</span>
                </div>
            </div>
        ),
        size
    );
}
