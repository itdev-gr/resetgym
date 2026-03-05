import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const inputPath = join(publicDir, 'favicon.png');
const outputPath = join(publicDir, 'favicon-big.png');

// Trim transparent padding, then resize so logo fills most of the frame (looks bigger in tab)
const SIZE = 128; // high-res for sharpness
const PADDING_PERCENT = 0.08; // 8% padding so logo is ~84% of canvas

const trimmed = await sharp(inputPath)
  .trim({ threshold: 5 })
  .toBuffer();

const meta = await sharp(trimmed).metadata();
const w = meta.width;
const h = meta.height;
const max = Math.max(w, h);
const pad = Math.round(max * PADDING_PERCENT);
const targetSize = max + pad * 2;

// Extend canvas with transparency so logo is centered with small padding
const extended = await sharp(trimmed)
  .extend({
    top: pad,
    bottom: pad,
    left: pad,
    right: pad,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer();

// Resize to SIZE x SIZE for a crisp favicon (logo fills most of it)
await sharp(extended)
  .resize(SIZE, SIZE)
  .png()
  .toFile(outputPath);

// Replace original
const { renameSync, unlinkSync } = await import('fs');
const orig = join(publicDir, 'favicon.png');
try {
  unlinkSync(orig);
} catch (_) {}
renameSync(outputPath, orig);
console.log('Favicon updated: logo enlarged in frame.');
