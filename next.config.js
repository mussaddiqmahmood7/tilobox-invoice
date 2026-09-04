const path = require("path");
const patchPath = path.resolve(__dirname, "scripts/patch-fs.js");
require(patchPath);
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes("patch-fs.js")) {
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ""} --require "${patchPath}"`.trim();
}

const withNextIntl = require("next-intl/plugin")("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
    webpack: (config) => {
        config.resolve = config.resolve || {};
        config.resolve.symlinks = false;
        config.module.rules.push({
            test: /\.map$/,
            use: "ignore-loader",
        });
        return config;
    },
};

// Bundle analyzer
const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));
