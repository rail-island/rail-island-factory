// Writes assets/<folder>/COMPARISON.md for each diesel locomotive and annotated
// orthographic views under export/review/<folder>/ (generated, not committed).
//
//   pnpm exec tsx generator/dieselReport.ts             the report against the stored baseline
//   pnpm exec tsx generator/dieselReport.ts --baseline  (re)store the current model as the baseline
import fs from "node:fs";
import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { DIESEL_COMPARISONS, canvasOf, dieselComparison, meanAbsoluteError, project, type DieselComparisonConfig, type View } from "./dieselComparison.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";

const root = new URL("../", import.meta.url);
const VIEWS: readonly View[] = ["x_front", "x_rear", "z_right", "z_left"];
const fmt = (xs: number[]) => xs.map((x) => x.toFixed(3)).join(", ");

function render(c: DieselComparisonConfig, view: View, dir: URL, rows: ReturnType<typeof dieselComparison>): void {
  const mesh = c.build();
  const { json, bin } = parseGlb(mesh.toGlb("review"));
  const triangles = collectTriangles(json, bin);
  const tree = mesh.sourceTree(c.id, c.title);
  const colors = new Map(tree.materials.map((m, i) => [m, tree.colors[i]!]));
  const [width, height] = canvasOf(c, view);
  const scale = 8;
  const depth = (p: readonly number[]) => (view === "x_front" ? p[0]! : view === "x_rear" ? -p[0]! : view === "z_right" ? p[2]! : -p[2]!);
  const W = width * scale, H = height * scale;
  const png = new PNG({ width: W, height: H });
  const zbuffer = new Float64Array(W * H).fill(-Infinity);
  for (let i = 0; i < W * H; i++) png.data.set([229, 231, 235, 255], i * 4);
  for (const t of triangles) {
    const p = t.p.map((v) => project(c, view, v as [number, number, number]).map((x) => x * scale));
    const [a, b, cc] = p as [number[], number[], number[]];
    const den = (b[1]! - cc[1]!) * (a[0]! - cc[0]!) + (cc[0]! - b[0]!) * (a[1]! - cc[1]!);
    if (Math.abs(den) < 1e-8) continue;
    const x0 = Math.max(0, Math.floor(Math.min(...p.map((v) => v[0]!)))), x1 = Math.min(W - 1, Math.ceil(Math.max(...p.map((v) => v[0]!))));
    const y0 = Math.max(0, Math.floor(Math.min(...p.map((v) => v[1]!)))), y1 = Math.min(H - 1, Math.ceil(Math.max(...p.map((v) => v[1]!))));
    const col = colors.get(t.material)!.slice(1);
    const rgb = [0, 2, 4].map((i) => parseInt(col.slice(i, i + 2), 16));
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const u = ((b[1]! - cc[1]!) * (x + 0.5 - cc[0]!) + (cc[0]! - b[0]!) * (y + 0.5 - cc[1]!)) / den;
        const v = ((cc[1]! - a[1]!) * (x + 0.5 - cc[0]!) + (a[0]! - cc[0]!) * (y + 0.5 - cc[1]!)) / den;
        const w = 1 - u - v;
        if (Math.min(u, v, w) < -1e-7) continue;
        const z = u * depth(t.p[0]) + v * depth(t.p[1]) + w * depth(t.p[2]);
        const i = y * W + x;
        if (z <= zbuffer[i]!) continue;
        zbuffer[i] = z;
        png.data.set([...rgb, 255], i * 4);
      }
  }
  const raster = PNG.sync.write(png);
  fs.writeFileSync(new URL(`${view}-model.png`, dir), raster);
  const boxes = rows
    .filter((r) => r.view === view)
    .map((r) =>
      `<rect x="${r.box[0]}" y="${r.box[1]}" width="${r.box[2]! - r.box[0]!}" height="${r.box[3]! - r.box[1]!}" fill="none" stroke="#f05" stroke-width="0.12"/><text x="${r.box[0]}" y="${r.box[1]! - 0.2}" fill="#e03" font-size="1.2">${r.id}</text>` +
      (r.photoBox ? `<rect x="${r.photoBox[0]}" y="${r.photoBox[1]}" width="${r.photoBox[2]! - r.photoBox[0]!}" height="${r.photoBox[3]! - r.photoBox[1]!}" fill="none" stroke="#06f" stroke-width="0.12"/>` : ""),
    )
    .join("\n");
  const svg = (inside: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#e5e7eb"/>${inside}</svg>`;
  fs.writeFileSync(new URL(`${view}-model.svg`, dir), svg(`<image width="${width}" height="${height}" href="data:image/png;base64,${raster.toString("base64")}"/>` + boxes));
  const bmp = fs.readFileSync(new URL(`assets/${c.folder}/native/${view.startsWith("x_") ? "x_both" : "z_both"}.bmp`, root)).toString("base64");
  fs.writeFileSync(new URL(`${view}-native.svg`, dir), svg(`<image width="${width}" height="${height}" href="data:image/bmp;base64,${bmp}" style="image-rendering:pixelated"/>` + boxes));
}

const storeBaseline = process.argv.includes("--baseline");
for (const c of DIESEL_COMPARISONS) {
  const rows = dieselComparison(c);
  const baselineUrl = new URL(`assets/${c.folder}/native/baseline.json`, root);
  if (storeBaseline) {
    fs.writeFileSync(baselineUrl, JSON.stringify(rows.map((r) => ({ id: r.id, view: r.view, delta: r.delta })), null, 1) + "\n");
  }
  const baseline = JSON.parse(fs.readFileSync(baselineUrl, "utf8")) as Array<{ id: string; view: View; delta: number[] }>;
  const views = VIEWS.filter((v) => rows.some((r) => r.view === v));
  const dir = new URL(`export/review/${c.folder}/`, root);
  fs.mkdirSync(dir, { recursive: true });
  for (const v of views) render(c, v, dir, rows);
  const revision = createHash("sha256").update(c.build().toGlb(`${c.title} comparison`)).digest("hex");
  const summary = ["| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |", "|---|---:|---:|---:|"];
  for (const v of views)
    summary.push(`| ${v} | ${rows.filter((r) => r.view === v).length} | ${meanAbsoluteError(baseline.filter((r) => r.view === v)).toFixed(3)} | ${meanAbsoluteError(rows.filter((r) => r.view === v)).toFixed(3)} |`);
  summary.push(`| All | ${rows.length} | ${meanAbsoluteError(baseline).toFixed(3)} | ${meanAbsoluteError(rows).toFixed(3)} |`);
  const [sw, sh] = c.side, [fw] = c.front;
  const lines = [
    `# ${c.title}: native reference comparison`,
    "",
    `**Covers** - native pixel annotations, baseline and final orthographic errors of \`${c.id}\` (the default build, vlakosimdb \`${c.source}\`).`,
    "**Code** - `generator/dieselComparison.ts`, `generator/dieselReport.ts`, `native/landmarks.json`.",
    "**See also** - [source notes](SOURCES.md), [photographs](PHOTOS.md), [the models' reference](../../docs/models/diesel-locos.md).",
    "",
    `Model geometry revision (SHA-256 of the comparison GLB): \`${revision}\`.`,
    "",
    "Regenerate with `pnpm exec tsx generator/dieselReport.ts`. The baseline is the first authored model (a new model: no earlier factory version existed), stored in `native/baseline.json` with the same annotations.",
    "",
    `Canvases: side ${sw} x ${sh} px, front ${fw} x ${c.front[1]} px, 0.1 m a pixel, including empty space; origin top left, X right, Y down. Mapping: ${c.mapping}. The +X face plots (half width - z, height - y), the -X face (half width + z, height - y), both against the one shared \`x_both\` BMP; both sides plot the source x against the one shared \`z_both\` BMP, so the -Z elevation is mirrored relative to an outside observer.`,
    "",
    "Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope triangle ranges; bounds include occluded vertices. Native BMPs, never the enhanced `_4x` textures, define the measurements.",
    "",
    ...summary,
    "",
    `One pixel is ${(100 / fw).toFixed(3)} pp horizontally at the front, ${(100 / sw).toFixed(3)} pp horizontally at the sides and ${(100 / sh).toFixed(3)} pp vertically. Rows with a tolerance above about one pixel are deliberate departures, explained in their uncertainty column.`,
    "",
    "Annotated views (generated locally, not committed):",
    "",
    ...views.map((v) => `- ${v}: [native](../../export/review/${c.folder}/${v}-native.svg), [model](../../export/review/${c.folder}/${v}-model.svg)`),
    `- [Three-quarter thumbnail](../../export/thumbs/${c.id}.png)`,
    "",
    "| ID | Native pixel edges | Reference | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |",
    "|---|---|---|---|---|---|---|---:|---:|---|",
    ...rows.map((r) => {
      const b = baseline.find((x) => x.id === r.id);
      const ref = r.photoBox ? `photo ${r.photoBox.join(", ")}` : "native";
      return `| ${r.id} | ${r.box.join(", ")} | ${ref} | ${r.nodes.map((n) => "`" + n + "`").join(", ")} | ${fmt(r.sourcePercent)} | ${fmt(r.modelPercent)} | ${fmt(r.delta)} | ${b ? meanAbsoluteError([b]).toFixed(3) : "-"} | ${meanAbsoluteError([r]).toFixed(3)} | ${r.uncertainty} |`;
    }),
    "",
  ];
  fs.writeFileSync(new URL(`assets/${c.folder}/COMPARISON.md`, root), lines.join("\n"));
  console.log(c.id, summary[summary.length - 1]);
  const worst = [...rows].sort((p, q) => meanAbsoluteError([q]) - meanAbsoluteError([p])).slice(0, 6);
  for (const r of worst) console.log("   ", r.id, r.nodes[0], "delta", fmt(r.delta), "px", r.source.map((v, i) => (r.model[i]! - v).toFixed(2)).join(","), "tol", r.tolerancePixels);
}
