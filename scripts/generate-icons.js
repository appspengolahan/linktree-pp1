import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const iconSvgPath = path.resolve('public/icon.svg');
let svgContent = fs.readFileSync(iconSvgPath, 'utf-8');

// For maskable icon: make sure outer rect fills 100% with no rx so safe-zone background bleeds completely
const maskableSvg = svgContent.replace('<rect width="500" height="500" rx="90" fill="#0f172a"/>', '<rect width="500" height="500" fill="#0f172a"/>');

// Standard icon SVG with square bleed
const squareSvg = svgContent.replace('rx="90"', 'rx="0"');

async function generate() {
  console.log('Generating PWA icons...');
  
  // 192x192
  await sharp(Buffer.from(squareSvg))
    .resize(192, 192)
    .png()
    .toFile(path.resolve('public/pwa-192x192.png'));
  console.log('Generated public/pwa-192x192.png');

  // 512x512
  await sharp(Buffer.from(squareSvg))
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-512x512.png'));
  console.log('Generated public/pwa-512x512.png');

  // 512x512 maskable (with padded safe zone)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.resolve('public/pwa-maskable-512x512.png'));
  console.log('Generated public/pwa-maskable-512x512.png');

  // apple-touch-icon 180x180
  await sharp(Buffer.from(squareSvg))
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
  console.log('Generated public/apple-touch-icon.png');

  // favicon.ico (64x64 or 32x32)
  await sharp(Buffer.from(squareSvg))
    .resize(64, 64)
    .png()
    .toFile(path.resolve('public/favicon.png'));
  console.log('Generated public/favicon.png');

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
