// Review views and measured comparison tables of the foreign multiple units
// (db628.ts, mavMdmot.ts, ice1.ts, tgv.ts), as emuReport.ts does for the Czech ones.
// Run: pnpm exec tsx generator/unitReport.ts [db_628 ...]   (every transfer by default)
//      pnpm exec tsx generator/unitReport.ts --views <id> <out-dir> [k=v ...]  (views only)
//
// Writes export/review/<key>/ (orthographic side and end views, the native BMPs
// with the annotation boxes, shaded three-quarter views; generated, not
// committed) and the comparison table assets/<folder>/COMPARISON.md.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { raster, trianglesOf, writeViews, type P3 } from "./unitViews.ts";
import { UNIT_TRANSFERS, unitBuild, unitComparison, unitNativeFile, unitTransfer, meanAbsoluteError } from "./unitComparison.ts";
import { DB628_DESIGNS } from "./db628.ts";
import { MDMOT_DESIGNS } from "./mavMdmot.ts";
import { ICE1_DESIGNS } from "./ice1.ts";
import { TGV_DESIGNS } from "./tgv.ts";

const ROOT = new URL("../", import.meta.url);
const fmt = (xs: number[]) => xs.map((x) => x.toFixed(3)).join(", ");

function report(key: string): string {
  const t = unitTransfer(key);
  const dir = new URL(`export/review/${key}/`, ROOT);
  fs.mkdirSync(dir, { recursive: true });
  const rows = unitComparison(key);
  const baselineFile = unitNativeFile(t, "baseline.json");
  const baseline = fs.existsSync(baselineFile) ? (JSON.parse(fs.readFileSync(baselineFile, "utf8")) as Array<{ id: string; delta: number[] }>) : rows;
  if (!fs.existsSync(baselineFile)) fs.writeFileSync(baselineFile, JSON.stringify(rows.map((r) => ({ id: r.id, delta: r.delta.map((x) => Math.round(x * 1000) / 1000) })), null, 1) + "\n");
  const mesh = unitBuild(t);
  const revision = createHash("sha256").update(mesh.toGlb(`${t.title} comparison`)).digest("hex");
  const tris = trianglesOf(mesh, t.id);
  const links: string[] = [];
  const scale = 8;
  const keys = [...new Set(rows.map((r) => `${r.view}|${r.side ?? r.end}`))];
  for (const k of keys) {
    const [v, where] = k.split("|") as [string, string];
    const rs = rows.filter((r) => r.view === v && (r.side ?? r.end) === where);
    const [cw, ch] = rs[0]!.canvas;
    const my = (rs[0] as { metresPerRow?: number }).metresPerRow ?? 0.1;
    const H = ch * my;
    const end = where === "front" || where === "rear";
    const project = (p: P3) => {
      // drawn with the documented scales undone, so the model overlays its BMP
      const u = end ? (where === "rear" ? 10 * (p[2]! / t.kZ + cw / 20) : 10 * (cw / 20 - p[2]! / t.kZ)) : t.sideUnscaled(p[0]!);
      const depth = end ? (where === "rear" ? -p[0]! : p[0]!) : where === "right" ? p[2]! : -p[2]!;
      return [u * scale, ((H - p[1]! / t.kY) / my) * scale, depth];
    };
    const png = PNG.sync.write(raster(tris, cw * scale, ch * scale, project, (x) => x.rgb));
    const name = `${v}-${where}`;
    const boxes = rs
      .map((r) => `<rect x="${r.box[0]}" y="${r.box[1]}" width="${r.box[2]! - r.box[0]!}" height="${r.box[3]! - r.box[1]!}" fill="none" stroke="#f05" stroke-width="0.12"/><text x="${r.box[0]}" y="${r.box[1]! - 0.2}" fill="#e03" font-size="1.2">${r.id}</text>`)
      .join("");
    const svg = (inside: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${cw * scale}" height="${ch * scale}" viewBox="0 0 ${cw} ${ch}"><rect width="100%" height="100%" fill="#e5e7eb"/>${inside}</svg>`;
    fs.writeFileSync(new URL(`${name}-model.png`, dir), png);
    fs.writeFileSync(new URL(`${name}-model.svg`, dir), svg(`<image width="${cw}" height="${ch}" href="data:image/png;base64,${png.toString("base64")}"/>${boxes}`));
    const bmp = fs.readFileSync(unitNativeFile(t, `${v}.bmp`)).toString("base64");
    fs.writeFileSync(new URL(`${name}-native.svg`, dir), svg(`<image width="${cw}" height="${ch}" href="data:image/bmp;base64,${bmp}" style="image-rendering:pixelated"/>${boxes}`));
    links.push(`- ${v}, ${where}: [native](../../export/review/${key}/${name}-native.svg), [model](../../export/review/${key}/${name}-model.svg)`);
  }
  writeViews(mesh, t.id, dir);
  links.push(`- [Three-quarter view](../../export/review/${key}/three-quarter-front.png), [thumbnail](../../export/thumbs/${t.id}.png)`);
  const base = (id: string) => baseline.find((b) => b.id === id)!;
  const summary = ["| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |", "|---|---:|---:|---:|"];
  for (const k of keys) {
    const rs = rows.filter((r) => `${r.view}|${r.side ?? r.end}` === k);
    summary.push(`| ${k.replace("|", ", ")} | ${rs.length} | ${meanAbsoluteError(rs.map((r) => base(r.id))).toFixed(3)} | ${meanAbsoluteError(rs).toFixed(3)} |`);
  }
  summary.push(`| All | ${rows.length} | ${meanAbsoluteError(rows.map((r) => base(r.id))).toFixed(3)} | ${meanAbsoluteError(rows).toFixed(3)} |`);
  const unscaled = unitComparison(key, true);
  summary.push("", `With the documented scales undone (side lengths / ${t.kX.toFixed(4)}, model heights / ${t.kY.toFixed(4)}, end-view widths / ${t.kZ.toFixed(4)}: the published dimensions against the XML's), the final MAE is ${meanAbsoluteError(unscaled).toFixed(3)} pp over the same ${unscaled.length} boxes; the residual left is the transfer itself.`);
  const [sw, sh] = rows.find((r) => !r.end)!.canvas;
  const lines = [
    `# ${t.title} native reference comparison`,
    "",
    "**Covers** - native pixel annotations, baseline and final orthographic errors.",
    `**Code** - ${t.files}, \`generator/unitComparison.ts\`, \`generator/unitReport.ts\`.`,
    "**See also** - [source notes](SOURCES.md), [foreign multiple units](../../docs/models/foreign-units.md).",
    "",
    `Model geometry revision (SHA-256 of comparison GLB): \`${revision}\`.`,
    "",
    `Regenerate with \`pnpm exec tsx generator/unitReport.ts ${key}\`. The baseline is the geometry when the annotations were fixed (\`${t.native}/baseline.json\`); baseline and final use the same annotations. Built with ${Object.entries(t.params).map(([k, v]) => `\`${k}=${v}\``).join(", ")} of \`${t.id}\`.`,
    "",
    `Canvases: sides ${sw / 10} x ${sh / 10} m (${sw} x ${sh} px), ends ${(rows.find((r) => r.end)?.canvas[0] ?? 30) / 10} x ${sh / 10} m, including empty space, 0.1 m a pixel (an annotation with a metresPerRow field gives its canvas's row height). Origin top left; x right, y down. Side ${t.sideRule}; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + W / 20), front u = 10 * (W / 20 - z), W the end canvas's width in pixels. v = 10 * (H - y), physical heights: no scale is undone.`,
    "",
    "Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.",
    "",
    ...summary,
    "",
    `One pixel is ${(100 / sw).toFixed(3)} pp horizontally on the sides, ${(100 / (rows.find((r) => r.end)?.canvas[0] ?? 30)).toFixed(3)} pp horizontally on the ends and ${(100 / sh).toFixed(3)} pp vertically.`,
    "",
    "Annotated views (generated locally, not committed):",
    "",
    ...links,
    "",
    "| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |",
    "|---|---|---|---|---|---|---|---|---:|---:|---|",
    ...rows.map((r) => `| ${r.id} | ${r.view}, ${r.side ?? r.end} | ${r.element} | ${r.box.join(", ")} | ${r.nodes.map((n) => "`" + n + "`").join(", ")} | ${fmt(r.sourcePercent)} | ${fmt(r.modelPercent)} | ${fmt(r.delta)} | ${meanAbsoluteError([base(r.id)]).toFixed(3)} | ${meanAbsoluteError([r]).toFixed(3)} | ${r.uncertainty} |`),
    "",
  ];
  fs.writeFileSync(new URL(`assets/${t.folder}/${t.report}`, ROOT), lines.join("\n"));
  return `${t.title}: ${rows.length} boxes, baseline ${meanAbsoluteError(rows.map((r) => base(r.id))).toFixed(3)} pp, final ${meanAbsoluteError(rows).toFixed(3)} pp`;
}

const args = process.argv.slice(2);
if (args[0] === "--views") {
  const [, id, out, ...kv] = args;
  const d = [...DB628_DESIGNS, ...MDMOT_DESIGNS, ...ICE1_DESIGNS, ...TGV_DESIGNS].find((x) => x.id === id)!;
  const params = Object.fromEntries(kv.map((s) => s.split("=") as [string, string]));
  writeViews(d.build(params), id!, new URL(out!.endsWith("/") ? out! : out! + "/", `file://${process.cwd()}/`));
} else {
  for (const t of UNIT_TRANSFERS) if (!args.length || args.includes(t.key)) console.log(report(t.key));
}
