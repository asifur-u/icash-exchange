import fs from "node:fs";

function fix(file, id) {
  let svg = fs.readFileSync(file, "utf8");
  svg = svg
    .replace(/width="100%"/, 'width="125"')
    .replace(/clip0_4134_3786/g, id)
    .replace(/shape-rendering="geometricPrecision"/g, "");
  if (!svg.includes('height="24"')) {
    svg = svg.replace(/width="125"/, 'width="125" height="24"');
  }
  if (!svg.includes("shape-rendering")) {
    svg = svg.replace("<svg", '<svg shape-rendering="geometricPrecision"');
  }
  fs.writeFileSync(file, svg);
  console.log("fixed", file);
}

fix("public/brand/icash-one-wordmark.svg", "clip_icash_wordmark_light");
fix("public/brand/icash-one-wordmark-dark.svg", "clip_icash_wordmark_dark");
