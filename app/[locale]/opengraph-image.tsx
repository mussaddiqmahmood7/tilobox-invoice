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
export const alt = "TiloBox Invoice — Free In-Browser Invoice & Receipt Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const messages = await getMessages(locale);
    const meta = (messages as Record<string, Record<string, string>>)?.meta ?? {};

    const title = meta.ogTitle ?? "TiloBox Invoice – Free In-Browser Invoice & Receipt Generator";
    const description =
        meta.ogDescription ??
        "Generate, customize, and download professional PDF invoices and retail receipts directly in your browser. 100% private, zero sign-up, and no database required.";

    return new ImageResponse(
        (
            <div
                style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    background: "#0F172A",
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
                            background: "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 34,
                            fontWeight: 700,
                        }}
                    >
                        T
                    </div>
                    <div style={{ color: "#60A5FA", fontSize: 34, fontWeight: 700 }}>
                        TiloBox Invoice
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div
                        style={{
                            color: "#F8FAFC",
                            fontSize: 62,
                            fontWeight: 700,
                            lineHeight: 1.15,
                            maxWidth: 950,
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            color: "#94A3B8",
                            fontSize: 28,
                            lineHeight: 1.4,
                            maxWidth: 880,
                        }}
                    >
                        {description}
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        color: "#64748B",
                        fontSize: 24,
                    }}
                >
                    <span>invoice.tilobox.com</span>
                </div>
            </div>
        ),
        size
    );
}
