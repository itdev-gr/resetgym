import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const icons = ['self-driving.png', 'go-off-road.png', 'Free-Cancelation.png'];

const threshold = 240; // pixels with r,g,b >= this become transparent (white + light gray)

async function makeTransparent(inputPath, outputPath) {
  const buffer = await readFile(inputPath);
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const len = data.length;
  for (let i = 0; i < len; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0;
    }
  }
  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png()
    .toFile(outputPath);
}

for (const name of icons) {
  const path = join(publicDir, name);
  await makeTransparent(path, path);
  console.log('OK', name);
}
