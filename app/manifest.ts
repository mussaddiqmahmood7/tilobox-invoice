import type { MetadataRoute } from "next";

/**
 * Wires up the icons that were already sitting in public/assets/favicon but
 * that nothing referenced — `site.webmanifest` shipped in the repo and was
 * never linked.
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "TiloBox Invoice – Free In-Browser Invoice & Receipt Generator",
        short_name: "TiloBox Invoice",
        description:
            "Generate, customize, and download professional PDF invoices and retail receipts directly in your browser. 100% private, zero sign-up, and no database required.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#0b0f19",
        theme_color: "#0b5fa5",
        categories: ["business", "finance", "productivity", "utilities"],
        icons: [
            {
                src: "/assets/favicon/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/assets/favicon/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/assets/favicon/icon-maskable-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/assets/favicon/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
            },
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
        ],
        shortcuts: [
            {
                name: "New Invoice",
                url: "/",
                description: "Create a new blank invoice",
            },
            {
                name: "User Guide",
                url: "/guide",
                description: "View documentation and guide",
            },
        ],
    };
}
