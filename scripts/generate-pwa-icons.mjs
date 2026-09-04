import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
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

function buildIco(images) {
    const count = images.length;
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // type 1 = icon
    header.writeUInt16LE(count, 4); // count

    let offset = 6 + count * 16;
    const entries = [];
    const imageDatas = [];

    for (const img of images) {
        const entry = Buffer.alloc(16);
        entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
        entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
        entry.writeUInt8(0, 2); // palette
        entry.writeUInt8(0, 3); // reserved
        entry.writeUInt16LE(1, 4); // planes
        entry.writeUInt16LE(32, 6); // bpp
        entry.writeUInt32LE(img.data.length, 8); // size
        entry.writeUInt32LE(offset, 12); // offset
        entries.push(entry);
        imageDatas.push(img.data);
        offset += img.data.length;
    }

    return Buffer.concat([header, ...entries, ...imageDatas]);
}

async function generateIcons() {
    console.log("[pwa-icons] Generating high-resolution PWA icons & real favicon.ico from app/icon.svg...");

    // 192x192 standard icon
    await sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(resolve(outputDir, "icon-192x192.png"));
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

    // 32x32 and 16x16 PNG favicons
    const png16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
    const png32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
    const png48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();

    writeFileSync(resolve(outputDir, "favicon-16x16.png"), png16);
    writeFileSync(resolve(outputDir, "favicon-32x32.png"), png32);
    console.log("  ✓ Generated favicon-32x32.png & favicon-16x16.png");

    // Multi-resolution true ICO containing 16x16, 32x32, 48x48
    const icoBuffer = buildIco([
        { width: 16, height: 16, data: png16 },
        { width: 32, height: 32, data: png32 },
        { width: 48, height: 48, data: png48 },
    ]);

    writeFileSync(resolve(outputDir, "favicon.ico"), icoBuffer);
    writeFileSync(resolve(rootDir, "app/favicon.ico"), icoBuffer);
    writeFileSync(resolve(rootDir, "public/favicon.ico"), icoBuffer);
    console.log("  ✓ Generated real multi-res TiloBox favicon.ico for app/ and public/");

    // 512x512 maskable icon with safe-zone margin
    const innerIcon = await sharp(svgBuffer)
        .resize(384, 384)
        .toBuffer();

    await sharp({
        create: {
            width: 512,
            height: 512,
            channels: 4,
            background: { r: 11, g: 15, b: 25, alpha: 1 }, // #0b0f19 Cyberpunk Slate
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

    console.log("[pwa-icons] All PWA icons & favicons generated successfully!");
}

generateIcons().catch((err) => {
    console.error("[pwa-icons] Error generating icons:", err);
    process.exit(1);
});
