// A labelled side-by-side sheet of photos and renders (detailed-vehicle skill), run from a checkout root:
//   node .agents/skills/detailed-vehicle/scripts/sheet.cjs out.png "photo 502 405" a.jpg "model" b.png ...
const path = require("node:path");
const sharp = require(path.join(process.cwd(), "node_modules/sharp"));
const [out, ...r] = process.argv.slice(2);
const items = [];
for (let i = 0; i + 1 < r.length; i += 2) items.push([r[i], r[i + 1]]);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
(async () => {
  const W = 512, H = 552, comps = [];
  for (let i = 0; i < items.length; i++) {
    const [label, file] = items[i];
    const img = await sharp(file).resize(512, 512, { fit: "contain", background: "#d3d9de" }).flatten({ background: "#d3d9de" }).toBuffer();
    comps.push({ input: img, left: i * W, top: 40 });
    comps.push({ input: Buffer.from(`<svg width="${W}" height="40"><text x="12" y="28" font-family="sans-serif" font-size="22" fill="#222">${esc(label)}</text></svg>`), left: i * W, top: 0 });
  }
  await sharp({ create: { width: W * items.length, height: H, channels: 3, background: "#d3d9de" } }).composite(comps).png().toFile(out);
})();
