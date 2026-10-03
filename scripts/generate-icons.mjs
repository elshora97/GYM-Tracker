// Generates PWA icons from an inline SVG. Run: npm run icons
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";

const mark = (scale = 1) => {
  // Barbell mark centred in a 512 canvas; `scale` shrinks it for maskable safe zone.
  const s = scale;
  const t = (v) => 256 + (v - 256) * s;
  const r = (x, y, w, h, rx) =>
    `<rect x="${t(x)}" y="${t(y)}" width="${w * s}" height="${h * s}" rx="${rx * s}"/>`;
  return `<g fill="#1c120c">${[
    r(80, 176, 48, 160, 16),
    r(136, 136, 56, 240, 20),
    r(192, 236, 128, 40, 12),
    r(320, 136, 56, 240, 20),
    r(384, 176, 48, 160, 16),
  ].join("")}</g>`;
};

const svg = ({ rounded, scale }) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ff9a4a"/><stop offset="1" stop-color="#e5481a"/>
  </linearGradient></defs>
  <rect width="512" height="512" rx="${rounded ? 128 : 0}" fill="url(#g)"/>
  ${mark(scale)}
</svg>`;

await mkdir("public/icons", { recursive: true });
const standard = svg({ rounded: true, scale: 1 });
const square = svg({ rounded: false, scale: 1 });
const maskable = svg({ rounded: false, scale: 0.72 });
await writeFile("public/icons/icon.svg", standard);

const out = [
  [standard, "icon-192.png", 192],
  [standard, "icon-512.png", 512],
  [maskable, "maskable-512.png", 512],
  [square, "apple-touch-icon.png", 180],
  [standard, "favicon-32.png", 32],
];
for (const [src, name, size] of out) {
  await sharp(Buffer.from(src)).resize(size, size).png().toFile(`public/icons/${name}`);
  console.log("wrote", name);
}
