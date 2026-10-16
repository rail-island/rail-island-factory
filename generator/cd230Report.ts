// Run: pnpm exec tsx generator/cd230Report.ts (after build:models).
import fs from "node:fs";
import { PNG } from "pngjs";
import { createHash } from "node:crypto";
import { cd230 } from "./cd230.ts";
import { cd230Comparison, canvasOf, project, type Cd230Landmark } from "./cd230Comparison.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";

const root = new URL("../", import.meta.url);
const dir = new URL("export/review/cd-230/", root);
fs.mkdirSync(dir, { recursive: true });
const rows = cd230Comparison();
const baseline = JSON.parse(
  fs.readFileSync(new URL("assets/cd-230/native/baseline.json", root), "utf8"),
) as typeof rows;
const mesh = cd230();
const bytes = mesh.toGlb("CD 230 comparison");
const revision = createHash("sha256").update(bytes).digest("hex");
const { json, bin } = parseGlb(bytes);
const triangles = collectTriangles(json, bin);
const tree = mesh.sourceTree("proc-vehicle-cd-230", "CD 230");
const colors = new Map(tree.materials.map((m, i) => [m, tree.colors[i]!]));
const metric = (rs: typeof rows) =>
  rs.reduce((sum, r) => sum + r.delta.reduce((a, x) => a + Math.abs(x), 0), 0) /
  (4 * rs.length);
const fmt = (xs: number[]) => xs.map((x) => x.toFixed(3)).join(", ");
const summary = [
  "| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |",
  "|---|---:|---:|---:|",
];
const VIEWS = ["x_both", "x_both_rear", "z_right", "z_left"] as const;
for (const view of VIEWS) {
  const rs = rows.filter((r) => r.view === view);
  summary.push(
    `| ${view} | ${rs.length} | ${metric(baseline.filter((r) => r.view === view)).toFixed(3)} | ${metric(rs).toFixed(3)} |`,
  );
}
summary.push(
  `| All | ${rows.length} | ${metric(baseline).toFixed(3)} | ${metric(rows).toFixed(3)} |`,
);
for (const view of VIEWS) {
  const [width, height] = canvasOf(view);
  const scale = 8;
  const front = view.startsWith("x_");
  const depth = (p: readonly number[]) =>
    view === "x_both" ? p[0]! : view === "x_both_rear" ? -p[0]! : view === "z_right" ? p[2]! : -p[2]!;
  const proj = (p: readonly number[]) => project(view as Cd230Landmark["view"], p as [number, number, number]);
  // Per-pixel depth resolves intersections between large shell triangles and
  // inset windows; sorting whole triangles by average depth cannot do that.
  const W = width * scale,
    H = height * scale;
  const png = new PNG({ width: W, height: H });
  const zbuffer = new Float64Array(W * H).fill(-Infinity);
  for (let i = 0; i < W * H; i++) png.data.set([229, 231, 235, 255], i * 4);
  for (const t of triangles) {
    const p = t.p.map((v) => proj(v).map((x) => x * scale));
    const [a, b, c] = p as [number[], number[], number[]];
    const den =
      (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
    if (Math.abs(den) < 1e-8) continue;
    const x0 = Math.max(0, Math.floor(Math.min(...p.map((v) => v[0]!))));
    const x1 = Math.min(W - 1, Math.ceil(Math.max(...p.map((v) => v[0]!))));
    const y0 = Math.max(0, Math.floor(Math.min(...p.map((v) => v[1]!))));
    const y1 = Math.min(H - 1, Math.ceil(Math.max(...p.map((v) => v[1]!))));
    const col = colors.get(t.material)!.slice(1),
      rgb = [0, 2, 4].map((i) => parseInt(col.slice(i, i + 2), 16));
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const u =
          ((b[1]! - c[1]!) * (x + 0.5 - c[0]!) +
            (c[0]! - b[0]!) * (y + 0.5 - c[1]!)) /
          den;
        const v =
          ((c[1]! - a[1]!) * (x + 0.5 - c[0]!) +
            (a[0]! - c[0]!) * (y + 0.5 - c[1]!)) /
          den;
        const w = 1 - u - v;
        if (Math.min(u, v, w) < -1e-7) continue;
        const z = u * depth(t.p[0]) + v * depth(t.p[1]) + w * depth(t.p[2]),
          i = y * W + x;
        if (z <= zbuffer[i]!) continue;
        zbuffer[i] = z;
        png.data.set([...rgb, 255], i * 4);
      }
  }
  const raster = PNG.sync.write(png);
  fs.writeFileSync(new URL(`${view}-model.png`, dir), raster);
  const polys = `<image width="${width}" height="${height}" href="data:image/png;base64,${raster.toString("base64")}"/>`;
  const rs = rows.filter((r) => r.view === view);
  const boxes = rs
    .map(
      (r) =>
        `<rect x="${r.box[0]}" y="${r.box[1]}" width="${r.box[2]! - r.box[0]!}" height="${r.box[3]! - r.box[1]!}" fill="none" stroke="#f05" stroke-width="0.12"/><text x="${r.box[0]}" y="${r.box[1]! - 0.2}" fill="#e03" font-size="1.2">${r.id}</text>` +
        (r.photoBox
          ? `<rect x="${r.photoBox[0]}" y="${r.photoBox[1]}" width="${r.photoBox[2]! - r.photoBox[0]!}" height="${r.photoBox[3]! - r.photoBox[1]!}" fill="none" stroke="#06f" stroke-width="0.12"/>`
          : ""),
    )
    .join("\n");
  const svg = (inside: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#e5e7eb"/>${inside}</svg>`;
  fs.writeFileSync(new URL(`${view}-model.svg`, dir), svg(polys + boxes));
  {
    const bmp = fs
      .readFileSync(new URL(`assets/cd-230/native/${front ? "x_both" : "z_both"}.bmp`, root))
      .toString("base64");
    fs.writeFileSync(
      new URL(`${view}-native.svg`, dir),
      svg(
        `<image width="${width}" height="${height}" href="data:image/bmp;base64,${bmp}" style="image-rendering:pixelated"/>` +
          boxes,
      ),
    );
  }
}
const lines = [
  "# CD 230 native reference comparison",
  "",
  "**Covers** - native pixel annotations, baseline and final orthographic errors of the laminatka (default livery, 230 025-9).",
  "**Code** - `generator/cd230.ts`, `generator/cd230Comparison.ts`, `generator/cd230Report.ts`.",
  "**See also** - [source notes](SOURCES.md), [the model's reference](../../docs/models/cd-230.md).",
  "",
  `Model geometry revision (SHA-256 of comparison GLB): \`${revision}\`.`,
  "",
  "Regenerate with `pnpm build:models && pnpm exec tsx generator/cd230Report.ts`.",
  "The initial authored model is the baseline: this is a new model, so no prior factory CD 230 existed. Baseline and final use the same annotations. Before the baseline was captured, four annotation errors were corrected (rear-end left/right selectors, window numbering, the side rails' rows, the lip's native outline); after it, R17/L17 were changed from the frame-and-glass box to the glass rows, like F04/F05, and the baseline was recomputed from the initial model with that correction.",
  "",
  "Canvases: front 3 x 6 m (30 x 60 px), side 17 x 6 m (170 x 60 px), including empty space. Origin is top left; X right, Y down. Source x = 8.2 - Factory x; source z = Factory z. The front plot of the +X end uses (1.5 - z, 6 - y), of the -X end (1.5 + z, 6 - y): both noses against the one shared `x_both` BMP. Both sides use (8.2 - x, 6 - y) against the one shared `z_both` BMP, so the -Z elevation is mirrored relative to an outside observer.",
  "",
  "Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope/material triangle ranges; bounds include occluded vertices. Native BMPs, never enhanced 4x textures, define the measurements, except where a row's reference is `photo`: there a box measured on the photographs (blue in the views) supersedes the native estimate (red), which stays in the record.",
  "",
  ...summary,
  "",
  "One pixel is 3.333 pp horizontally at the front, 0.588 pp horizontally at the sides, and 1.667 pp vertically. Deliberate departures: the standard 1.75 m buffer spacing (native frames 2.0 m apart), the plough as the XML clip draws it (the ploughx BMP fills the canvas width), the breaker after the XML roof clip, and the pantographs: the source stretches its folded diamond to 4.4 m while the model keeps one arm length in both poses, so rows T02 and T03 are recorded but not tight landmarks. The running gear follows the published dimensions (7.80 m pivots, 2.80 m wheelbase, 1.25 m wheels) rather than the painted bogies and is not annotated.",
  "",
  "Annotated views (generated locally, not committed):",
  "",
  ...["x_both", "x_both_rear", "z_right", "z_left"].map(
    (v) => `- ${v}: [native](../../export/review/cd-230/${v}-native.svg), [model](../../export/review/cd-230/${v}-model.svg)`,
  ),
  "- [Three-quarter thumbnail](../../export/thumbs/veh-cd-230.png)",
  "",
  "| ID | Native pixel edges | Reference | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |",
  "|---|---|---|---|---|---|---|---:|---:|---|",
  ...rows.map((r) => {
    const b = baseline.find((x) => x.id === r.id)!;
    const ref = r.photoBox ? `photo ${r.photoBox.join(", ")}` : "native";
    return `| ${r.id} | ${r.box.join(", ")} | ${ref} | ${r.nodes.map((n) => "`" + n + "`").join(", ")} | ${fmt(r.sourcePercent)} | ${fmt(r.modelPercent)} | ${fmt(r.delta)} | ${metric([b]).toFixed(3)} | ${metric([r]).toFixed(3)} | ${r.uncertainty} |`;
  }),
  "",
];
fs.writeFileSync(
  new URL("assets/cd-230/COMPARISON.md", root),
  lines.join("\n"),
);
console.log(summary.join("\n"));
