import fs from "node:fs";
import path from "node:path";

const pdfPath = process.argv[2] ?? "C:/Users/MAHAFUJ/Downloads/icash.pdf";
const out = path.join(process.cwd(), "public", "brand");
fs.mkdirSync(out, { recursive: true });

const buf = fs.readFileSync(pdfPath);
const formats = [
  { name: "jpg", start: Buffer.from([0xff, 0xd8, 0xff]), end: Buffer.from([0xff, 0xd9]) },
  {
    name: "png",
    start: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    end: Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]),
  },
];

let count = 0;
for (const format of formats) {
  let index = 0;
  while ((index = buf.indexOf(format.start, index)) !== -1) {
    const end = buf.indexOf(format.end, index + format.start.length);
    if (end === -1) break;
    const slice = buf.subarray(index, end + format.end.length);
    if (slice.length > 2500) {
      count += 1;
      const file = path.join(out, `extract-${count}.${format.name}`);
      fs.writeFileSync(file, slice);
    }
    index = end + format.end.length;
  }
}

console.log(`wrote ${count} images into ${out}`);
for (const file of fs.readdirSync(out)) {
  const size = fs.statSync(path.join(out, file)).size;
  console.log(`${file}\t${size}`);
}
