/**
 * Generate placeholder robot sprite atlases (PNG + JSON).
 * Uses only built-in Node.js modules — no external dependencies.
 *
 * Output files are written to public/assets/images/robot/
 *
 * Run:  node scripts/generate-robot-atlas.mjs
 */

import { createWriteStream, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'assets', 'images', 'robot');
mkdirSync(OUT_DIR, { recursive: true });

// ─── Minimal PNG encoder (RGBA, no filtering, zlib deflate) ──────────────────

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array of RGBA data (width * height * 4 bytes)

  // Build raw image data with filter byte (0 = None) per row
  const rawLen = height * (1 + width * 4);
  const raw = Buffer.alloc(rawLen);
  for (let y = 0; y < height; y++) {
    const rowOff = y * (1 + width * 4);
    raw[rowOff] = 0; // filter: None
    pixels.copy(raw, rowOff + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idat = makeChunk('IDAT', compressed);

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeB, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([len, typeB, data, crc]);
}

// CRC-32 (PNG standard)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

function createPixels(w, h) {
  return { w, h, data: Buffer.alloc(w * h * 4) };
}

function setPixel(img, x, y, r, g, b, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= img.w || y < 0 || y >= img.h) return;
  const off = (y * img.w + x) * 4;
  // Alpha blending
  if (a < 255 && img.data[off + 3] > 0) {
    const srcA = a / 255;
    const dstA = img.data[off + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    img.data[off + 0] = Math.round((r * srcA + img.data[off + 0] * dstA * (1 - srcA)) / outA);
    img.data[off + 1] = Math.round((g * srcA + img.data[off + 1] * dstA * (1 - srcA)) / outA);
    img.data[off + 2] = Math.round((b * srcA + img.data[off + 2] * dstA * (1 - srcA)) / outA);
    img.data[off + 3] = Math.round(outA * 255);
  } else {
    img.data[off + 0] = r;
    img.data[off + 1] = g;
    img.data[off + 2] = b;
    img.data[off + 3] = a;
  }
}

function fillRect(img, x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(img, x + dx, y + dy, r, g, b, a);
    }
  }
}

function fillRoundRect(img, x, y, w, h, rad, r, g, b, a = 255) {
  // Simple rounded rect via filled rect + corner circles
  fillRect(img, x + rad, y, w - 2 * rad, h, r, g, b, a);
  fillRect(img, x, y + rad, w, h - 2 * rad, r, g, b, a);
  fillCircle(img, x + rad, y + rad, rad, r, g, b, a);
  fillCircle(img, x + w - rad - 1, y + rad, rad, r, g, b, a);
  fillCircle(img, x + rad, y + h - rad - 1, rad, r, g, b, a);
  fillCircle(img, x + w - rad - 1, y + h - rad - 1, rad, r, g, b, a);
}

function fillCircle(img, cx, cy, radius, r, g, b, a = 255) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        setPixel(img, cx + dx, cy + dy, r, g, b, a);
      }
    }
  }
}

function drawLine(img, x0, y0, x1, y1, r, g, b, a = 255) {
  // Bresenham's
  let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(img, x0, y0, r, g, b, a);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

function fillTriangle(img, x0, y0, x1, y1, x2, y2, r, g, b, a = 255) {
  // Simple scanline fill
  const minY = Math.max(0, Math.min(y0, y1, y2));
  const maxY = Math.min(img.h - 1, Math.max(y0, y1, y2));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    const edges = [[x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0]];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        const t = (y - ay) / (by - ay);
        xs.push(Math.round(ax + t * (bx - ax)));
      }
    }
    if (xs.length >= 2) {
      xs.sort((a, b) => a - b);
      for (let x = xs[0]; x <= xs[xs.length - 1]; x++) {
        setPixel(img, x, y, r, g, b, a);
      }
    }
  }
}

// ─── Hex to RGB ──────────────────────────────────────────────────────────────

function hex(h) {
  return [(h >> 16) & 0xff, (h >> 8) & 0xff, h & 0xff];
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const COL = {
  robot:     hex(0x4fc3f7),
  robotDark: hex(0x0288d1),
  arm:       hex(0x888888),
  armDark:   hex(0x666666),
  claw:      hex(0xcccccc),
  clawDark:  hex(0x999999),
  white:     [255, 255, 255],
  black:     [0, 0, 0],
};

// ═══════════════════════════════════════════════════════════════════════════════
// BODY ATLAS  (4 frames, each 44x44, atlas = 176x44)
// ═══════════════════════════════════════════════════════════════════════════════

const BODY_W = 44, BODY_H = 44, BODY_FRAMES = 4;

function drawBodyFrame(img, frameIdx, ox) {
  // Main body
  fillRoundRect(img, ox + 2, 2, BODY_W - 4, BODY_H - 4, 5,
    ...COL.robot);

  // Inner darker border
  fillRoundRect(img, ox + 5, 5, BODY_W - 10, BODY_H - 10, 3,
    ...COL.robotDark, 90);

  // Heading arrow (pointing right)
  fillTriangle(img,
    ox + BODY_W - 6, BODY_H / 2,
    ox + BODY_W - 14, BODY_H / 2 - 6,
    ox + BODY_W - 14, BODY_H / 2 + 6,
    ...COL.white, 230);

  // Center dot
  fillCircle(img, ox + BODY_W / 2, BODY_H / 2, 3,
    ...COL.black, 120);

  // Tread marks for move frames
  if (frameIdx > 0) {
    const shift = (frameIdx - 1) * 3;
    for (const tx of [ox + 4, ox + BODY_W - 6]) {
      for (let i = 0; i < 3; i++) {
        const ty = 8 + shift + i * 11;
        fillRect(img, tx, ty, 2, 4, ...COL.black, 40 + frameIdx * 15);
      }
    }
  }
}

function generateBodyAtlas() {
  const w = BODY_W * BODY_FRAMES;
  const h = BODY_H;
  const img = createPixels(w, h);

  const names = ['idle', 'move_0', 'move_1', 'move_2'];
  const frames = {};

  for (let i = 0; i < BODY_FRAMES; i++) {
    drawBodyFrame(img, i, i * BODY_W);
    frames[names[i]] = {
      frame: { x: i * BODY_W, y: 0, w: BODY_W, h: BODY_H },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: BODY_W, h: BODY_H },
      sourceSize: { w: BODY_W, h: BODY_H },
      duration: 100,
    };
  }

  const json = {
    frames,
    meta: {
      app: 'robot-sprite-generator',
      version: '1.0',
      image: 'robot_body.png',
      format: 'RGBA8888',
      size: { w, h },
      scale: '1',
      frameTags: [
        { name: 'idle', from: 0, to: 0, direction: 'forward' },
        { name: 'move', from: 1, to: 3, direction: 'forward' },
      ],
    },
  };

  return { img, json, name: 'robot_body' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARM ATLAS  (5 frames at elevation angles, each 30x14, atlas = 150x14)
// ═══════════════════════════════════════════════════════════════════════════════

const ARM_W = 30, ARM_H = 14, ARM_ANGLES = [0, 45, 90, 135, 180];

function drawArmFrame(img, angle, ox) {
  const lenScale = 1 - (angle / 180) * 0.35;
  const armLen = Math.round(ARM_W * lenScale);
  const cy = Math.round(ARM_H / 2);

  // Arm shaft
  const thickness = 4 + Math.round((angle / 180) * 3);
  const y0 = cy - Math.round(thickness / 2);
  fillRoundRect(img, ox + 2, y0, armLen - 4, thickness, 2, ...COL.arm);

  // Joint circle
  fillCircle(img, ox + 4, cy, 3, ...COL.armDark);

  // Elevation indicator dot
  if (angle > 0) {
    const dotY = cy - Math.round((angle / 180) * 4);
    fillCircle(img, ox + armLen - 5, dotY, 2, ...COL.white, 140);
  }
}

function generateArmAtlas() {
  const w = ARM_W * ARM_ANGLES.length;
  const h = ARM_H;
  const img = createPixels(w, h);
  const frames = {};

  ARM_ANGLES.forEach((angle, i) => {
    drawArmFrame(img, angle, i * ARM_W);
    frames[`angle_${angle}`] = {
      frame: { x: i * ARM_W, y: 0, w: ARM_W, h: ARM_H },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: ARM_W, h: ARM_H },
      sourceSize: { w: ARM_W, h: ARM_H },
      duration: 100,
    };
  });

  const json = {
    frames,
    meta: {
      app: 'robot-sprite-generator',
      version: '1.0',
      image: 'robot_arm.png',
      format: 'RGBA8888',
      size: { w, h },
      scale: '1',
      frameTags: [
        { name: 'arm_positions', from: 0, to: ARM_ANGLES.length - 1, direction: 'forward' },
      ],
    },
  };

  return { img, json, name: 'robot_arm' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLAW ATLAS  (2 frames: open, closed, each 16x16, atlas = 32x16)
// ═══════════════════════════════════════════════════════════════════════════════

const CLAW_W = 16, CLAW_H = 16;

function drawClawFrame(img, isOpen, ox) {
  const cx = ox + CLAW_W / 2;
  const cy = CLAW_H / 2;
  const spread = isOpen ? 5 : 2;

  // Left jaw
  drawLine(img, cx, cy, cx + 4, cy - spread, ...COL.claw);
  drawLine(img, cx + 4, cy - spread, cx + 7, cy - spread + 2, ...COL.claw);
  drawLine(img, cx, cy + 1, cx + 4, cy - spread + 1, ...COL.claw);

  // Right jaw
  drawLine(img, cx, cy, cx + 4, cy + spread, ...COL.claw);
  drawLine(img, cx + 4, cy + spread, cx + 7, cy + spread - 2, ...COL.claw);
  drawLine(img, cx, cy - 1, cx + 4, cy + spread - 1, ...COL.claw);

  // Joint
  fillCircle(img, cx, cy, 2, ...COL.clawDark);
}

function generateClawAtlas() {
  const w = CLAW_W * 2;
  const h = CLAW_H;
  const img = createPixels(w, h);
  const frames = {};

  drawClawFrame(img, true, 0);
  frames['open'] = {
    frame: { x: 0, y: 0, w: CLAW_W, h: CLAW_H },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: CLAW_W, h: CLAW_H },
    sourceSize: { w: CLAW_W, h: CLAW_H },
    duration: 100,
  };

  drawClawFrame(img, false, CLAW_W);
  frames['closed'] = {
    frame: { x: CLAW_W, y: 0, w: CLAW_W, h: CLAW_H },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: CLAW_W, h: CLAW_H },
    sourceSize: { w: CLAW_W, h: CLAW_H },
    duration: 100,
  };

  const json = {
    frames,
    meta: {
      app: 'robot-sprite-generator',
      version: '1.0',
      image: 'robot_claw.png',
      format: 'RGBA8888',
      size: { w, h },
      scale: '1',
      frameTags: [
        { name: 'open', from: 0, to: 0, direction: 'forward' },
        { name: 'closed', from: 1, to: 1, direction: 'forward' },
      ],
    },
  };

  return { img, json, name: 'robot_claw' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════════

const parts = [generateBodyAtlas(), generateArmAtlas(), generateClawAtlas()];

for (const { img, json, name } of parts) {
  const pngBuf = encodePNG(img.w, img.h, img.data);
  const pngPath = join(OUT_DIR, `${name}.png`);
  const jsonPath = join(OUT_DIR, `${name}.json`);

  writeFileSync(pngPath, pngBuf);
  writeFileSync(jsonPath, JSON.stringify(json, null, 2));

  console.log(`  ✓ ${pngPath}`);
  console.log(`    ${jsonPath}`);
}

console.log('\nDone! Robot atlas files generated in public/assets/images/robot/');
