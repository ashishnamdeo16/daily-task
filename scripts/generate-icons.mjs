/**
 * Generates LifeOS PWA icons (192, 512, maskable).
 * Run: node scripts/generate-icons.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { deflateSync } from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BRAND = [91, 91, 214]; // #5b5bd6
const BRAND_END = [168, 85, 247]; // #a855f7
const BG = [26, 26, 31]; // #1a1a1f

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function mixColor(t) {
  return [lerp(BRAND[0], BRAND_END[0], t), lerp(BRAND[1], BRAND_END[1], t), lerp(BRAND[2], BRAND_END[2], t)];
}

function inRoundedRect(x, y, size, radius) {
  const r = radius;
  if (x >= r && x <= size - r) return true;
  if (y >= r && y <= size - r) return true;
  const corners = [
    [r, r],
    [size - r, r],
    [r, size - r],
    [size - r, size - r],
  ];
  for (const [cx, cy] of corners) {
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= r * r) return true;
  }
  return false;
}

/** Lucide-style flame, normalized 0–1 in icon box */
function inFlame(nx, ny) {
  const x = (nx - 0.5) * 2;
  const y = (ny - 0.52) * 2.2;
  const body = x * x * 1.4 + y * y * 0.95 < 0.42 && y > -0.55;
  const tip = y < -0.15 && Math.abs(x) < 0.22 * (0.55 + y);
  return body || tip;
}

function pixelColor(x, y, size, maskable) {
  const pad = maskable ? size * 0.1 : 0;
  const inner = size - pad * 2;
  const lx = x - pad;
  const ly = y - pad;

  if (maskable && (x < pad || y < pad || x >= size - pad || y >= size - pad)) {
    return BG;
  }

  const radius = inner * 0.22;
  if (!inRoundedRect(lx, ly, inner, radius)) {
    return maskable ? BG : BG;
  }

  const t = (lx + ly) / (inner * 2);
  const [r, g, b] = mixColor(Math.min(1, Math.max(0, t)));

  const nx = lx / inner;
  const ny = ly / inner;
  if (inFlame(nx, ny)) {
    return [255, 255, 255];
  }

  return [r, g, b];
}

function png(size, maskable = false) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + size * 3);
  const raw = Buffer.alloc((1 + size * 3) * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelColor(x, y, size, maskable);
      const idx = 1 + x * 3;
      row[idx] = r;
      row[idx + 1] = g;
      row[idx + 2] = b;
    }
    raw.writeUInt8(0, y * row.length);
    row.copy(raw, y * row.length + 1);
  }

  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

for (const [name, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
]) {
  const path = join(outDir, name);
  writeFileSync(path, png(size, maskable));
  console.log(`Wrote ${path}`);
}
