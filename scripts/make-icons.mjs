import sharp from "sharp";
import fs from "fs/promises";

function diamondSvg(size) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <path d="M32 6 L58 32 L32 58 L6 32 Z" fill="#ff2d2d"/>
</svg>`);
}

async function writeSvgIcon(size, file) {
  const buf = await sharp(diamondSvg(size)).png().toBuffer();
  await fs.writeFile(file, buf);
  console.log("wrote", file, size);
}

async function inspect(p) {
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let trans = 0;
  let opaque = 0;
  let white = 0;
  let black = 0;
  let red = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 20) {
      trans++;
      continue;
    }
    opaque++;
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) white++;
    else if (data[i] < 30 && data[i + 1] < 30 && data[i + 2] < 30) black++;
    else if (data[i] > 180 && data[i + 1] < 100 && data[i + 2] < 100) red++;
  }
  console.log(p, `${info.width}x${info.height}`, { opaque, trans, white, black, red });
}

await writeSvgIcon(32, "public/favicon.png");
await writeSvgIcon(64, "src/app/icon.png");
await writeSvgIcon(180, "src/app/apple-icon.png");

for (const p of ["src/app/icon.png", "src/app/apple-icon.png", "public/favicon.png"]) {
  await inspect(p);
}
