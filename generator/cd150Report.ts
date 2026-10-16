// Run: pnpm exec tsx generator/cd150Report.ts (after build:models).
import fs from "node:fs";
import { PNG } from "pngjs";
import { createHash } from "node:crypto";
import { cd150 } from "./cd150.ts";
import { cd150Comparison } from "./cd150Comparison.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";

const root = new URL("../", import.meta.url);
const dir = new URL("export/review/cd-150/", root);
fs.mkdirSync(dir, { recursive: true });
const rows = cd150Comparison();
const baseline = JSON.parse(
  fs.readFileSync(new URL("assets/cd-150/native/baseline.json", root), "utf8"),
) as typeof rows;
const mesh = cd150();
const bytes = mesh.toGlb("CD 150 comparison");
const revision = createHash("sha256").update(bytes).digest("hex");
const { json, bin } = parseGlb(bytes);
const triangles = collectTriangles(json, bin);
const tree = mesh.sourceTree("proc-vehicle-cd-150", "CD 150");
const colors = new Map(tree.materials.map((m, i) => [m, tree.colors[i]!]));
const metric = (rs: typeof rows) =>
  rs.reduce((sum, r) => sum + r.delta.reduce((a, x) => a + Math.abs(x), 0), 0) /
  (4 * rs.length);
const fmt = (xs: number[]) => xs.map((x) => x.toFixed(3)).join(", ");
const summary = [
  "| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |",
  "|---|---:|---:|---:|",
];
for (const view of ["x_both", "z_dec", "z_inc"]) {
  const rs = rows.filter((r) => r.view === view);
  summary.push(
    `| ${view} | ${rs.length} | ${metric(baseline.filter((r) => r.view === view)).toFixed(3)} | ${metric(rs).toFixed(3)} |`,
  );
}
summary.push(
  `| All | ${rows.length} | ${metric(baseline).toFixed(3)} | ${metric(rows).toFixed(3)} |`,
);
for (const view of ["x_both", "rear", "z_dec", "z_inc"]) {
  const front = view === "x_both" || view === "rear";
  const width = front ? 30 : 170,
    height = 60,
    scale = 8;
  const project = (p: readonly number[]) => [
    (front ? (view === "rear" ? 1.5 + p[2]! : 1.5 - p[2]!) : p[0]! + 8.5) * 10,
    (6 - p[1]!) * 10,
  ];
  // Opposite side is mirrored into native source texture coordinates for comparison.
  const depth = (p: readonly number[]) =>
    front
      ? view === "rear"
        ? -p[0]!
        : p[0]!
      : view === "z_dec"
        ? p[2]!
        : -p[2]!;
  // Per-pixel depth resolves intersections between large shell triangles and
  // inset windows; sorting whole triangles by average depth cannot do that.
  const W = width * scale,
    H = height * scale;
  const png = new PNG({ width: W, height: H });
  const zbuffer = new Float64Array(W * H).fill(-Infinity);
  for (let i = 0; i < W * H; i++) png.data.set([229, 231, 235, 255], i * 4);
  for (const t of triangles) {
    const p = t.p.map((v) => project(v).map((x) => x * scale));
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
  const rs = rows.filter((r) => r.view === (view === "rear" ? "x_both" : view));
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
  if (view !== "rear") {
    const bmp = fs
      .readFileSync(new URL(`assets/cd-150/native/${view}.bmp`, root))
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
  "# CD 150 native reference comparison",
  "",
  "**Covers** - native pixel annotations, baseline and final orthographic errors.",
  "**Code** - `generator/cd150.ts`, `generator/cd150Comparison.ts`, `generator/cd150Report.ts`.",
  "**See also** - [source notes](SOURCES.md), [vehicle reference](../../docs/models/vehicles.md).",
  "",
  `Model geometry revision (SHA-256 of comparison GLB): \`${revision}\`.`,
  "",
  "Regenerate with `pnpm build:models && pnpm exec tsx generator/cd150Report.ts`.",
  "The initial authored model is the baseline; this is a new model, so no prior factory CD 150 existed.",
  "Baseline and final use the same annotations. Buffer selectors were corrected before baseline capture; the number-plate selector was renamed to housing when its panel was split at the cab slope, without changing its baseline measurement.",
  "",
  "Canvases: front 3 x 6 m (30 x 60 px), sides 17 x 6 m (170 x 60 px), including empty space. Origin is top left; X right, Y down. Source x maps to Factory x + 8.5; source z maps to -Factory z. Both side plots use source x increasing to the right, so the left elevation is mirrored relative to an outside observer. The front plot uses (1.5 - z, 6 - y).",
  "",
  "Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Actual GLB vertices are selected by named scope/material triangle ranges; bounds include occluded vertices. Frames and lenses are separate where annotated. Native BMPs, never enhanced 4x textures, define the measurements, except where a row's reference is `photo`: there a box measured on the photographs (blue in the views) supersedes the native estimate (red), which stays in the record. Baseline columns are against the native boxes.",
  "",
  ...summary,
  "",
  "One pixel is 3.333 pp horizontally at the front, 0.588 pp horizontally at the sides, and 1.667 pp vertically. The 1.75 m buffer spacing is retained; the coarse front silhouettes differ by up to 1.75 px. The CD emblem is a shared outline approximation. The front plate and marker lamps follow the photographs: the plate just below the cream/green boundary, chrome-rimmed white/red lamp pairs level with it, a dark twin-lens headlight on the roof edge. Full running gear uses 1.25 m wheels rather than the source's painted low box. These choices are outside a claim of photographic accuracy.",
  "",
  "Annotated views (generated locally, not committed):",
  "",
  ...["x_both", "z_dec", "z_inc"].map(
    (v) =>
      `- ${v}: [native](../../export/review/cd-150/${v}-native.svg), [model](../../export/review/cd-150/${v}-model.svg)`,
  ),
  "- [Rear model](../../export/review/cd-150/rear-model.svg)",
  "- [Three-quarter thumbnail](../../export/thumbs/veh-cd-150.png)",
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
  new URL("assets/cd-150/COMPARISON.md", root),
  lines.join("\n"),
);
console.log(summary.join("\n"));
