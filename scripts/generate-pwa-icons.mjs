import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const svgPath = resolve(rootDir, "app/icon.svg");
const outputDir = resolve(rootDir, "public/assets/favicon");

if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
}

const svgBuffer = readFileSync(svgPath);

async function generateIcons() {
    console.log("[pwa-icons] Generating high-resolution PWA icons from app/icon.svg...");

    // 192x192 standard icon
    await sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(resolve(outputDir, "icon-192x192.png"));
    // Also update legacy android-chrome name for compatibility
    await sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(resolve(outputDir, "android-chrome-192x192.png"));
    console.log("  ✓ Generated icon-192x192.png");

    // 512x512 standard icon
    await sharp(svgBuffer)
        .resize(512, 512)
        .png()
        .toFile(resolve(outputDir, "icon-512x512.png"));
    await sharp(svgBuffer)
        .resize(512, 512)
        .png()
        .toFile(resolve(outputDir, "android-chrome-512x512.png"));
    console.log("  ✓ Generated icon-512x512.png");

    // Apple touch icon 180x180
    await sharp(svgBuffer)
        .resize(180, 180)
        .png()
        .toFile(resolve(outputDir, "apple-touch-icon.png"));
    console.log("  ✓ Generated apple-touch-icon.png");

    // 32x32 and 16x16 favicons
    await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(resolve(outputDir, "favicon-32x32.png"));
    await sharp(svgBuffer)
        .resize(16, 16)
        .png()
        .toFile(resolve(outputDir, "favicon-16x16.png"));
    console.log("  ✓ Generated favicon-32x32.png & favicon-16x16.png");

    // 512x512 maskable icon with safe-zone margin (inner icon ~400px centered on #2563EB background)
    const innerIcon = await sharp(svgBuffer)
        .resize(384, 384)
        .toBuffer();

    await sharp({
        create: {
            width: 512,
            height: 512,
            channels: 4,
            background: { r: 37, g: 99, b: 235, alpha: 1 }, // #2563EB TiloBox Blue
        },
    })
        .composite([
            {
                input: innerIcon,
                top: 64,
                left: 64,
            },
        ])
        .png()
        .toFile(resolve(outputDir, "icon-maskable-512x512.png"));
    console.log("  ✓ Generated icon-maskable-512x512.png");

    console.log("[pwa-icons] All PWA icons generated successfully!");
}

generateIcons().catch((err) => {
    console.error("[pwa-icons] Error generating icons:", err);
    process.exit(1);
});
