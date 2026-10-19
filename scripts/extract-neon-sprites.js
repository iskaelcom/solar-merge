const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const defaultInput = path.join(__dirname, '..', 'assets', 'skins', 'neon', 'neon-sheet.png');
const input = process.argv[2] ? path.resolve(process.argv[2]) : defaultInput;
const outputDir = process.argv[3] ? path.resolve(process.argv[3]) : path.dirname(input);
const names = ['moon', 'mercury', 'mars', 'venus', 'earth', 'neptune', 'uranus', 'saturn', 'jupiter', 'sun'];

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const labels = new Int32Array(width * height);
  labels.fill(-1);
  const queue = new Int32Array(width * height);
  const components = [];

  for (let start = 0; start < labels.length; start += 1) {
    if (labels[start] !== -1 || data[start * channels + 3] < 32) continue;
    const label = components.length;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = label;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let count = 0;

    while (head < tail) {
      const index = queue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      count += 1;
      const neighbours = [index - 1, index + 1, index - width, index + width];
      for (const next of neighbours) {
        if (next < 0 || next >= labels.length || labels[next] !== -1) continue;
        const nx = next % width;
        if (Math.abs(nx - x) > 1 || data[next * channels + 3] < 32) continue;
        labels[next] = label;
        queue[tail++] = next;
      }
    }
    components.push({ label, minX, minY, maxX, maxY, count });
  }

  const sprites = components
    .filter((component) => component.count > 5000)
    .sort((a, b) => ((a.minY + a.maxY) / 2) - ((b.minY + b.maxY) / 2))
    .reduce((rows, component) => {
      const centerY = (component.minY + component.maxY) / 2;
      const row = centerY < height / 2 ? 0 : 1;
      rows[row].push(component);
      return rows;
    }, [[], []])
    .flatMap((row) => row.sort((a, b) => a.minX - b.minX));

  if (sprites.length !== names.length) {
    throw new Error(`Expected ${names.length} sprites, found ${sprites.length}`);
  }

  await Promise.all(sprites.map(async (component, spriteIndex) => {
    const outputPath = path.join(outputDir, `${names[spriteIndex]}.png`);
    // Saturn uses a bespoke 2:1 asset, matching the classic 800×400 sprite.
    // Preserve it when re-extracting the square-cell sheet.
    if (names[spriteIndex] === 'saturn') {
      try {
        await fs.access(outputPath);
        return;
      } catch { }
    }
    const left = Math.max(0, component.minX - 8);
    const top = Math.max(0, component.minY - 8);
    const right = Math.min(width - 1, component.maxX + 8);
    const bottom = Math.min(height - 1, component.maxY + 8);
    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;
    const pixels = Buffer.alloc(cropWidth * cropHeight * 4);

    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        const sourceIndex = y * width + x;
        if (labels[sourceIndex] !== component.label) continue;
        const sourceOffset = sourceIndex * channels;
        const targetOffset = ((y - top) * cropWidth + (x - left)) * 4;
        data.copy(pixels, targetOffset, sourceOffset, sourceOffset + 4);
      }
    }

    await sharp(pixels, { raw: { width: cropWidth, height: cropHeight, channels: 4 } })
      .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outputPath);
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
