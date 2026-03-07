const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ICON_SRC = path.join(ROOT, 'assets', 'icon.png');
const RES_DIR = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

// Android mipmap icon sizes
const ICON_SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
};

// Adaptive icon foreground sizes (with padding for safe zone)
const ADAPTIVE_SIZES = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
};

async function generateIcons() {
    console.log('🎨 Generating Android icons from assets/icon.png...\n');

    const srcImage = sharp(ICON_SRC);
    const metadata = await srcImage.metadata();
    console.log(`Source icon: ${metadata.width}x${metadata.height}\n`);

    // Generate standard launcher icons (ic_launcher.png and ic_launcher_round.png)
    for (const [folder, size] of Object.entries(ICON_SIZES)) {
        const outDir = path.join(RES_DIR, folder);
        fs.mkdirSync(outDir, { recursive: true });

        // Standard icon
        await sharp(ICON_SRC)
            .resize(size, size, { fit: 'cover' })
            .png()
            .toFile(path.join(outDir, 'ic_launcher.png'));
        console.log(`✅ ${folder}/ic_launcher.png (${size}x${size})`);

        // Round icon (circle mask)
        const roundMask = Buffer.from(
            `<svg width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
      </svg>`
        );

        await sharp(ICON_SRC)
            .resize(size, size, { fit: 'cover' })
            .composite([{ input: roundMask, blend: 'dest-in' }])
            .png()
            .toFile(path.join(outDir, 'ic_launcher_round.png'));
        console.log(`✅ ${folder}/ic_launcher_round.png (${size}x${size})`);
    }

    // Generate adaptive icon foreground
    for (const [folder, size] of Object.entries(ADAPTIVE_SIZES)) {
        const outDir = path.join(RES_DIR, folder);
        fs.mkdirSync(outDir, { recursive: true });

        // The foreground layer in adaptive icons has safe zone padding
        // The icon content should be in the center 66% of the canvas (72/108)
        const iconSize = Math.round(size * 0.667);
        const padding = Math.round((size - iconSize) / 2);

        await sharp(ICON_SRC)
            .resize(iconSize, iconSize, { fit: 'cover' })
            .extend({
                top: padding,
                bottom: size - iconSize - padding,
                left: padding,
                right: size - iconSize - padding,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toFile(path.join(outDir, 'ic_launcher_foreground.png'));
        console.log(`✅ ${folder}/ic_launcher_foreground.png (${size}x${size})`);
    }

    // Also copy the icon as adaptive-icon.png for Expo
    await sharp(ICON_SRC)
        .resize(432, 432, { fit: 'cover' })
        .png()
        .toFile(path.join(ROOT, 'assets', 'adaptive-icon.png'));
    console.log('\n✅ assets/adaptive-icon.png (432x432)');

    console.log('\n🎉 All Android icons generated successfully!');
}

generateIcons().catch(err => {
    console.error('❌ Error generating icons:', err);
    process.exit(1);
});
