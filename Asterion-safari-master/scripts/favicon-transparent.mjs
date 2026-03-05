import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const inputPath = join(publicDir, 'favicon.png');
const outputPath = join(publicDir, 'favicon-transparent.png');

const { data, info } = await sharp(inputPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
// channels is 4 (RGBA) after ensureAlpha

for (let i = 0; i < data.length; i += channels) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  // Make black / very dark pixels transparent (threshold ~30)
  if (r < 35 && g < 35 && b < 35) {
    data[i + 3] = 0;
  }
}

await sharp(data, { raw: { width, height, channels } })
  .png()
  .toFile(outputPath);

// Replace original
const { renameSync, unlinkSync } = await import('fs');
const orig = join(publicDir, 'favicon.png');
try { unlinkSync(orig); } catch (_) {}
renameSync(outputPath, orig);
console.log('Favicon updated with transparent background.');
