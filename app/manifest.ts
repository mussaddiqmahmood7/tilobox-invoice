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
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#2563EB",
        icons: [
            {
                src: "/assets/favicon/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/assets/favicon/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/assets/favicon/apple-touch-icon.png",
                sizes: "180x180",
                type: "image/png",
                purpose: "maskable",
            },
        ],
    };
}
