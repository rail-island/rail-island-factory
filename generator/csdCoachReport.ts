// Review views and measured comparison tables of the CSD coaches (csdCoaches.ts).
// Run: pnpm exec tsx generator/csdCoachReport.ts [csd-a ...]  (all coaches by default)
//
// Writes, per coach, export/review/<folder>/ (orthographic model views with the
// native annotation boxes, the native BMPs with the same boxes, a shaded
// three-quarter view; generated, not committed) and assets/<folder>/COMPARISON.md.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { CSD_COACHES } from "./csdCoaches.ts";
import { coachComparison, meanAbsoluteError, type CoachComparisonRow } from "./csdCoachComparison.ts";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";

const ROOT = new URL("../", import.meta.url);
type P3 = readonly number[];

interface Tri {
  p: P3[];
  rgb: number[];
  n: number[];
}

/** Rasterizes triangles with a per-pixel depth buffer; `project` gives (u, v, depth) in output pixels. */
function raster(tris: Tri[], W: number, H: number, project: (p: P3) => number[], shade: (t: Tri) => number[]): PNG {
  const png = new PNG({ width: W, height: H });
  const zb = new Float64Array(W * H).fill(-Infinity);
  for (let i = 0; i < W * H; i++) png.data.set([229, 231, 235, 255], i * 4);
  for (const t of tris) {
    const q = t.p.map(project);
    const [a, b, c] = q as [number[], number[], number[]];
    const den = (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
    if (Math.abs(den) < 1e-9) continue;
    const x0 = Math.max(0, Math.floor(Math.min(...q.map((v) => v[0]!))));
    const x1 = Math.min(W - 1, Math.ceil(Math.max(...q.map((v) => v[0]!))));
    const y0 = Math.max(0, Math.floor(Math.min(...q.map((v) => v[1]!))));
    const y1 = Math.min(H - 1, Math.ceil(Math.max(...q.map((v) => v[1]!))));
    const rgb = shade(t);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const l1 = ((b[1]! - c[1]!) * (x + 0.5 - c[0]!) + (c[0]! - b[0]!) * (y + 0.5 - c[1]!)) / den;
        const l2 = ((c[1]! - a[1]!) * (x + 0.5 - c[0]!) + (a[0]! - c[0]!) * (y + 0.5 - c[1]!)) / den;
        const l3 = 1 - l1 - l2;
        if (Math.min(l1, l2, l3) < -1e-7) continue;
        const z = l1 * a[2]! + l2 * b[2]! + l3 * c[2]!;
        const i = y * W + x;
        if (z <= zb[i]!) continue;
        zb[i] = z;
        png.data.set([...rgb, 255], i * 4);
      }
  }
  return png;
}

const fmt = (xs: number[]) => xs.map((x) => x.toFixed(3)).join(", ");

function report(folder: string): string[] {
  const coach = CSD_COACHES.find((c) => c.folder === folder)!;
  const dir = new URL(`export/review/${folder}/`, ROOT);
  fs.mkdirSync(dir, { recursive: true });
  const rows = coachComparison(folder);
  const baseline = JSON.parse(fs.readFileSync(new URL(`assets/${folder}/native/baseline.json`, ROOT), "utf8")) as Array<{ id: string; delta: number[] }>;
  const mesh = coach.build();
  const bytes = mesh.toGlb(`${coach.title} comparison`);
  const revision = createHash("sha256").update(bytes).digest("hex");
  const { json, bin } = parseGlb(bytes);
  const tree = mesh.sourceTree(coach.id, coach.title);
  const colors = new Map(tree.materials.map((m, i) => [m, tree.colors[i]!]));
  const tris: Tri[] = collectTriangles(json, bin).map((t) => {
    const hex = colors.get(t.material)!.slice(1);
    const u = [0, 1, 2].map((k) => t.p[1]![k]! - t.p[0]![k]!);
    const v = [0, 1, 2].map((k) => t.p[2]![k]! - t.p[0]![k]!);
    const n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    const l = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    return { p: t.p, rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)), n: n.map((x) => x / l) };
  });
  const flat = (t: Tri) => t.rgb;
  const views = [...new Set(rows.map((r) => `${r.view}|${r.side ?? r.end}`))];
  const links: string[] = [];
  const scale = 8;
  for (const key of views) {
    const [view, where] = key.split("|") as [string, string];
    const rs = rows.filter((r) => r.view === view && (r.side ?? r.end) === where);
    const [cw, ch] = rs[0]!.canvas;
    const H = ch / 10;
    const end = where === "front" || where === "rear";
    const project = (p: P3) => {
      const u = end ? (where === "rear" ? 10 * (p[2]! + 1.5) : 10 * (1.5 - p[2]!)) : 10 * (p[0]! + coach.centre);
      const depth = end ? (where === "rear" ? -p[0]! : p[0]!) : where === "right" ? p[2]! : -p[2]!;
      return [u * scale, 10 * (H - p[1]!) * scale, depth];
    };
    const png = PNG.sync.write(raster(tris, cw * scale, ch * scale, project, flat));
    const name = `${view}-${where}`;
    fs.writeFileSync(new URL(`${name}-model.png`, dir), png);
    const boxes = rs
      .map((r) => `<rect x="${r.box[0]}" y="${r.box[1]}" width="${r.box[2]! - r.box[0]!}" height="${r.box[3]! - r.box[1]!}" fill="none" stroke="#f05" stroke-width="0.12"/><text x="${r.box[0]}" y="${r.box[1]! - 0.2}" fill="#e03" font-size="1.2">${r.id}</text>`)
      .join("");
    const svg = (inside: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${cw * scale}" height="${ch * scale}" viewBox="0 0 ${cw} ${ch}"><rect width="100%" height="100%" fill="#e5e7eb"/>${inside}</svg>`;
    fs.writeFileSync(new URL(`${name}-model.svg`, dir), svg(`<image width="${cw}" height="${ch}" href="data:image/png;base64,${png.toString("base64")}"/>${boxes}`));
    const bmp = fs.readFileSync(new URL(`assets/${folder}/native/${view}.bmp`, ROOT)).toString("base64");
    fs.writeFileSync(new URL(`${name}-native.svg`, dir), svg(`<image width="${cw}" height="${ch}" href="data:image/bmp;base64,${bmp}" style="image-rendering:pixelated"/>${boxes}`));
    links.push(`- ${view}, ${where}: [native](../../export/review/${folder}/${name}-native.svg), [model](../../export/review/${folder}/${name}-model.svg)`);
  }
  // a shaded three-quarter view from the front-left, orthographic
  const yaw = (-35 * Math.PI) / 180;
  const pitch = (25 * Math.PI) / 180;
  const rot = (p: P3) => {
    const x = p[0]! * Math.cos(yaw) - p[2]! * Math.sin(yaw);
    const z = p[0]! * Math.sin(yaw) + p[2]! * Math.cos(yaw);
    return [x, p[1]! * Math.cos(pitch) - z * Math.sin(pitch), p[1]! * Math.sin(pitch) + z * Math.cos(pitch)];
  };
  const pts = tris.flatMap((t) => t.p.map(rot));
  const [minX, maxX] = [Math.min(...pts.map((p) => p[0]!)), Math.max(...pts.map((p) => p[0]!))];
  const [minY, maxY] = [Math.min(...pts.map((p) => p[1]!)), Math.max(...pts.map((p) => p[1]!))];
  const s3 = 1600 / (maxX - minX + 1);
  const W3 = Math.ceil((maxX - minX + 1) * s3);
  const H3 = Math.ceil((maxY - minY + 1) * s3);
  const light = [0.35, 0.8, 0.5].map((x) => x / Math.hypot(0.35, 0.8, 0.5));
  const lit = (t: Tri) => {
    const k = 0.5 + 0.5 * Math.max(0, t.n[0]! * light[0]! + t.n[1]! * light[1]! + t.n[2]! * light[2]!);
    return t.rgb.map((c) => Math.min(255, Math.round(c * k + 12)));
  };
  const three = raster(tris, W3, H3, (p) => {
    const r = rot(p);
    return [(r[0]! - minX + 0.5) * s3, (maxY - r[1]! + 0.5) * s3, r[2]!];
  }, lit);
  fs.writeFileSync(new URL("three-quarter.png", dir), PNG.sync.write(three));
  links.push(`- [Three-quarter view](../../export/review/${folder}/three-quarter.png), [thumbnail](../../export/thumbs/${coach.id}.png)`);

  const byView = (rs: Array<{ view: string; side?: string; end?: string }>, key: string) => rs.filter((r) => `${r.view}|${(r as { side?: string }).side ?? (r as { end?: string }).end}` === key);
  const base = (r: CoachComparisonRow) => baseline.find((b) => b.id === r.id)!;
  const summary = ["| View | Boxes | Baseline MAE (pp) | Final MAE (pp) |", "|---|---:|---:|---:|"];
  for (const key of views) {
    const rs = byView(rows, key) as CoachComparisonRow[];
    summary.push(`| ${key.replace("|", ", ")} | ${rs.length} | ${meanAbsoluteError(rs.map(base)).toFixed(3)} | ${meanAbsoluteError(rs).toFixed(3)} |`);
  }
  summary.push(`| All | ${rows.length} | ${meanAbsoluteError(rows.map(base)).toFixed(3)} | ${meanAbsoluteError(rows).toFixed(3)} |`);
  const [sw, sh] = rows.find((r) => !r.end)!.canvas;
  const lines = [
    `# ${coach.title} native reference comparison`,
    "",
    "**Covers** - native pixel annotations, baseline and final orthographic errors.",
    "**Code** - `generator/csdCoaches.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`.",
    "**See also** - [source notes](SOURCES.md), [CSD coaches](../../docs/models/csd-coaches.md).",
    "",
    `Model geometry revision (SHA-256 of comparison GLB): \`${revision}\`.`,
    "",
    `Regenerate with \`pnpm exec tsx generator/csdCoachReport.ts ${folder}\`. The baseline is the first authored geometry (\`native/baseline.json\`); baseline and final use the same annotations.`,
    "",
    `Canvases: sides ${sw / 10} x ${sh / 10} m (${sw} x ${sh} px), ends 3 x ${sh / 10} m (30 x ${sh} px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side u = 10 * source x = 10 * (Factory X + ${coach.centre}); both sides keep increasing source x, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (${sh / 10} - y).`,
    "",
    "Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.",
    "",
    ...summary,
    "",
    `One pixel is ${(100 / sw).toFixed(3)} pp horizontally on the sides, 3.333 pp horizontally on the ends and ${(100 / sh).toFixed(3)} pp vertically. The model was authored from these same measured boxes, so the residuals measure the transfer onto the XML body (tapered and rounded ends, sloped faces, 5 mm edge clearances) and the deliberate mechanical choices (1.75 m buffer spacing, round lamp lenses), not photographic accuracy.`,
    "",
    "Annotated views (generated locally, not committed):",
    "",
    ...links,
    "",
    "| ID | View | Element | Native pixel edges | Mesh scope(s) | Source % (x,y,w,h) | Model % | Signed delta (pp) | Baseline abs. mean (pp) | Final abs. mean (pp) | Uncertainty |",
    "|---|---|---|---|---|---|---|---|---:|---:|---|",
    ...rows.map((r) => `| ${r.id} | ${r.view}, ${r.side ?? r.end} | ${r.element} | ${r.box.join(", ")} | ${r.nodes.map((n) => "`" + n + "`").join(", ")} | ${fmt(r.sourcePercent)} | ${fmt(r.modelPercent)} | ${fmt(r.delta)} | ${meanAbsoluteError([base(r)]).toFixed(3)} | ${meanAbsoluteError([r]).toFixed(3)} | ${r.uncertainty} |`),
    "",
  ];
  fs.writeFileSync(new URL(`assets/${folder}/COMPARISON.md`, ROOT), lines.join("\n"));
  return [`${coach.title}: ${rows.length} boxes, baseline ${meanAbsoluteError(rows.map(base)).toFixed(3)} pp, final ${meanAbsoluteError(rows).toFixed(3)} pp`];
}

const wanted = process.argv.slice(2);
for (const c of CSD_COACHES) if (!wanted.length || wanted.includes(c.folder)) console.log(report(c.folder).join("\n"));
