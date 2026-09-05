// Script to generate PWA icons
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create SVG Icon (High quality Emerald & Slate modern icon with cart + pill)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#0f766e" />
    </linearGradient>
    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25" />
    </filter>
  </defs>
  <!-- Background with rounded rectangle -->
  <rect width="512" height="512" rx="110" fill="url(#bgGrad)" />
  
  <!-- Subtle inner glow ring -->
  <rect x="16" y="16" width="480" height="480" rx="98" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4" />

  <!-- Main emblem group -->
  <g filter="url(#shadow)">
    <!-- Shopping Cart body -->
    <path d="M120 150 h44 l32 144 h164 l28 -112 H190" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="210" cy="340" r="22" fill="#ffffff" />
    <circle cx="340" cy="340" r="22" fill="#ffffff" />

    <!-- Medicine Pill badge in center of cart -->
    <g transform="translate(250, 160) rotate(45)">
      <!-- Pill base -->
      <rect x="-24" y="-55" width="48" height="110" rx="24" fill="#ffffff" />
      <!-- Pill top half in vibrant blue -->
      <path d="M -24 0 h 48 v -31 a 24 24 0 0 0 -48 0 z" fill="#0284c7" />
      <!-- Pill dividing line -->
      <line x1="-24" y1="0" x2="24" y2="0" stroke="#0f766e" stroke-width="3" />
      <!-- Pill highlight -->
      <line x1="-12" y1="-30" x2="-12" y2="30" stroke="rgba(255,255,255,0.5)" stroke-width="4" stroke-linecap="round" />
    </g>

    <!-- Checklist / Memo indicator tick in top right -->
    <circle cx="380" cy="130" r="42" fill="#10b981" stroke="#ffffff" stroke-width="8" />
    <path d="M362 130 l12 12 l24 -24" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- Bengali text badge at bottom: আমার মেমো -->
  <text x="256" y="442" text-anchor="middle" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="44" letter-spacing="2">MY MEMO</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

// Function to generate raw PNG with basic CRC32 and Zlib
function createSolidPng(width, height, r, g, b, a = 255) {
  // Simple uncompressed or deflate PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      let byte = buf[i];
      crc = crc ^ byte;
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanline filter byte = 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  
  // Draw an emerald green icon with rounded border and white center emblem
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.45;
  const cornerRadius = width * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle test
      const dx = Math.max(0, Math.abs(x - cx) - (cx - cornerRadius));
      const dy = Math.max(0, Math.abs(y - cy) - (cy - cornerRadius));
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > cornerRadius) {
        // Outside rounded rect - transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      } else {
        // Inner circle pattern
        const dCenter = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dCenter < width * 0.25) {
          // White center
          rawData[pixelOffset] = 255;
          rawData[pixelOffset + 1] = 255;
          rawData[pixelOffset + 2] = 255;
          rawData[pixelOffset + 3] = 255;
        } else {
          // Emerald gradient
          const grad = y / height;
          rawData[pixelOffset] = Math.round(5 * (1 - grad) + 15 * grad);
          rawData[pixelOffset + 1] = Math.round(150 * (1 - grad) + 118 * grad);
          rawData[pixelOffset + 2] = Math.round(105 * (1 - grad) + 110 * grad);
          rawData[pixelOffset + 3] = 255;
        }
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate PNG icons
const png192 = createSolidPng(192, 192, 5, 150, 105);
const png512 = createSolidPng(512, 512, 5, 150, 105);
const appleIcon = createSolidPng(180, 180, 5, 150, 105);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png192);

console.log('Icons generated successfully in public/');
