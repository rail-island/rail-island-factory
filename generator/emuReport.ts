// Review views and measured comparison tables of the Czech electric units.
// Run: pnpm exec tsx generator/emuReport.ts [cd_471 ...]   (every transfer by default)
//      pnpm exec tsx generator/emuReport.ts --views <id> <out-dir> [k=v ...]  (views only)
//
// Writes export/review/<key>/ (orthographic side and end views of the model, the
// native BMPs with the annotation boxes, a shaded three-quarter view; generated,
// not committed) and the comparison table assets/<folder>/<report>.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { EMU_TRANSFERS, emuBuild, emuComparison, emuNativeFile, emuTransfer, meanAbsoluteError } from "./emuComparison.ts";
import { EMU471_DESIGNS } from "./emu471.ts";
import { EMU680_DESIGNS } from "./emu680.ts";
import { EMU451_DESIGNS } from "./emu451.ts";
import { EMU460_DESIGNS } from "./emu460.ts";
import { EMU470_DESIGNS } from "./emu470.ts";

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

function trianglesOf(mesh: MeshBuilder, id: string): Tri[] {
  const { json, bin } = parseGlb(mesh.toGlb(id));
  const tree = mesh.sourceTree(id, id);
  const colors = new Map(tree.materials.map((m, i) => [m, tree.colors[i]!]));
  return collectTriangles(json, bin).map((t) => {
    const hex = colors.get(t.material)!.slice(1);
    const u = [0, 1, 2].map((k) => t.p[1]![k]! - t.p[0]![k]!);
    const v = [0, 1, 2].map((k) => t.p[2]![k]! - t.p[0]![k]!);
    const n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    const l = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
    return { p: t.p, rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)), n: n.map((x) => x / l) };
  });
}

const lit = (t: Tri) => {
  const light = [0.35, 0.8, 0.5].map((x) => x / Math.hypot(0.35, 0.8, 0.5));
  const k = 0.55 + 0.45 * Math.max(0, t.n[0]! * light[0]! + t.n[1]! * light[1]! + t.n[2]! * light[2]!);
  return t.rgb.map((c) => Math.min(255, Math.round(c * k + 10)));
};

/** A shaded orthographic view: yaw about y (degrees, 0 = looking at the +Z side), pitch down. */
function view(tris: Tri[], yawDeg: number, pitchDeg: number, width: number): PNG {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const rot = (p: P3) => {
    const x = p[0]! * Math.cos(yaw) - p[2]! * Math.sin(yaw);
    const z = p[0]! * Math.sin(yaw) + p[2]! * Math.cos(yaw);
    return [x, p[1]! * Math.cos(pitch) - z * Math.sin(pitch), p[1]! * Math.sin(pitch) + z * Math.cos(pitch)];
  };
  const pts = tris.flatMap((t) => t.p.map(rot));
  const [minX, maxX] = [Math.min(...pts.map((p) => p[0]!)), Math.max(...pts.map((p) => p[0]!))];
  const [minY, maxY] = [Math.min(...pts.map((p) => p[1]!)), Math.max(...pts.map((p) => p[1]!))];
  const s = width / (maxX - minX + 0.4);
  return raster(tris, Math.ceil((maxX - minX + 0.4) * s), Math.ceil((maxY - minY + 0.4) * s), (p) => {
    const r = rot(p);
    return [(r[0]! - minX + 0.2) * s, (maxY - r[1]! + 0.2) * s, r[2]!];
  }, lit);
}

/** Writes the standard review views of a mesh into `dir`. */
export function writeViews(mesh: MeshBuilder, id: string, dir: URL): void {
  fs.mkdirSync(dir, { recursive: true });
  const tris = trianglesOf(mesh, id);
  const views: Array<[string, number, number, number]> = [
    ["side-right", 0, 0, 1800],
    ["side-left", 180, 0, 1800],
    ["front", 90, 0, 500],
    ["rear", -90, 0, 500],
    ["three-quarter-front", -35, 22, 1600],
    ["three-quarter-rear", 145, 22, 1600],
    ["top", 0, 89.9, 1800],
  ];
  for (const [name, yaw, pitch, w] of views) fs.writeFileSync(new URL(`${name}.png`, dir), PNG.sync.write(view(tris, yaw, pitch, w)));
}

/** The older units' modules, which their reports name. */
const CLASSIC: Record<string, string> = { "proc-vehicle-cd-451": "emu451.ts", "proc-vehicle-cd-460": "emu460.ts", "proc-vehicle-cd-470": "emu470.ts" };

const fmt = (xs: number[]) => xs.map((x) => x.toFixed(3)).join(", ");

function report(key: string): string {
  const t = emuTransfer(key);
  const dir = new URL(`export/review/${key}/`, ROOT);
  fs.mkdirSync(dir, { recursive: true });
  const rows = emuComparison(key);
  const baselineFile = emuNativeFile(t, "baseline.json");
  const baseline = fs.existsSync(baselineFile) ? (JSON.parse(fs.readFileSync(baselineFile, "utf8")) as Array<{ id: string; delta: number[] }>) : rows;
  if (!fs.existsSync(baselineFile)) fs.writeFileSync(baselineFile, JSON.stringify(rows.map((r) => ({ id: r.id, delta: r.delta.map((x) => Math.round(x * 1000) / 1000) })), null, 1) + "\n");
  const mesh = emuBuild(t);
  const revision = createHash("sha256").update(mesh.toGlb(`${t.title} comparison`)).digest("hex");
  const tris = trianglesOf(mesh, t.id);
  const links: string[] = [];
  const scale = 8;
  const keys = [...new Set(rows.map((r) => `${r.view}|${r.side ?? r.end}`))];
  for (const k of keys) {
    const [v, where] = k.split("|") as [string, string];
    const rs = rows.filter((r) => r.view === v && (r.side ?? r.end) === where);
    const [cw, ch] = rs[0]!.canvas;
    const H = ch / 10;
    const end = where === "front" || where === "rear";
    const project = (p: P3) => {
      // drawn with the documented scales undone, so the model overlays its BMP
      const u = end ? (where === "rear" ? 10 * (p[2]! / t.kZ + 1.5) : 10 * (1.5 - p[2]! / t.kZ)) : t.sideUnscaled(p[0]!);
      const depth = end ? (where === "rear" ? -p[0]! : p[0]!) : where === "right" ? p[2]! : -p[2]!;
      return [u * scale, 10 * (H - p[1]! / t.kY) * scale, depth];
    };
    const png = PNG.sync.write(raster(tris, cw * scale, ch * scale, project, (x) => x.rgb));
    const name = `${v}-${where}`;
    const boxes = rs
      .map((r) => `<rect x="${r.box[0]}" y="${r.box[1]}" width="${r.box[2]! - r.box[0]!}" height="${r.box[3]! - r.box[1]!}" fill="none" stroke="#f05" stroke-width="0.12"/><text x="${r.box[0]}" y="${r.box[1]! - 0.2}" fill="#e03" font-size="1.2">${r.id}</text>`)
      .join("");
    const svg = (inside: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${cw * scale}" height="${ch * scale}" viewBox="0 0 ${cw} ${ch}"><rect width="100%" height="100%" fill="#e5e7eb"/>${inside}</svg>`;
    fs.writeFileSync(new URL(`${name}-model.png`, dir), png);
    fs.writeFileSync(new URL(`${name}-model.svg`, dir), svg(`<image width="${cw}" height="${ch}" href="data:image/png;base64,${png.toString("base64")}"/>${boxes}`));
    const bmp = fs.readFileSync(emuNativeFile(t, `${v}.bmp`)).toString("base64");
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
  const unscaled = emuComparison(key, true);
  summary.push("", `With the documented scales undone (side lengths / ${t.kX.toFixed(4)}, model heights / ${t.kY.toFixed(4)}, end-view widths / ${t.kZ.toFixed(4)}: the published dimensions against the XML's), the final MAE is ${meanAbsoluteError(unscaled).toFixed(3)} pp over the same ${unscaled.length} boxes; the residual left is the transfer itself.`);
  const [sw, sh] = rows.find((r) => !r.end)!.canvas;
  const lines = [
    `# ${t.title} native reference comparison`,
    "",
    "**Covers** - native pixel annotations, baseline and final orthographic errors.",
    ...(CLASSIC[t.id]
      ? [`**Code** - \`generator/${CLASSIC[t.id]}\`, \`generator/emuClassicKit.ts\`, \`generator/emuComparison.ts\`, \`generator/emuReport.ts\`.`, "**See also** - [source notes](SOURCES.md), [older Czech electric units](../../docs/models/czech-emus-classic.md)."]
      : ["**Code** - `generator/emu471.ts`, `generator/emu680.ts`, `generator/emuComparison.ts`, `generator/emuReport.ts`.", "**See also** - [source notes](SOURCES.md), [Czech electric units](../../docs/models/czech-emus.md)."]),
    "",
    `Model geometry revision (SHA-256 of comparison GLB): \`${revision}\`.`,
    "",
    `Regenerate with \`pnpm exec tsx generator/emuReport.ts ${key}\`. The baseline is the first authored geometry (\`${t.native}/baseline.json\`); baseline and final use the same annotations. Built with ${Object.entries(t.params).map(([k, v]) => `\`${k}=${v}\``).join(", ")} of \`${t.id}\`.`,
    "",
    `Canvases: sides ${sw / 10} x ${sh / 10} m (${sw} x ${sh} px), ends 3 x ${sh / 10} m (30 x ${sh} px), including empty space, 0.1 m a pixel. Origin top left; x right, y down. Side ${t.sideRule}; both sides use the same mapping, so the left (-Z) elevation is mirrored relative to an outside observer, as its BMP is. Ends are seen from outside: rear u = 10 * (z + 1.5), front u = 10 * (1.5 - z). v = 10 * (${sh / 10} - y), physical heights: no scale is undone.`,
    "",
    "Each vector is (left, top, width, height). Percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the native canvas. Signed delta = model minus source in percentage points. MAE = sum(abs(delta)) / (4 * number of boxes). Model boxes are the bounds of actual GLB vertices of the named scopes, occluded vertices included. Only the original BMPs define the measurements, never the 4x textures.",
    "",
    ...summary,
    "",
    `One pixel is ${(100 / sw).toFixed(3)} pp horizontally on the sides, 3.333 pp horizontally on the ends and ${(100 / sh).toFixed(3)} pp vertically.`,
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

// run only as a script, so the views can be imported
if (process.argv[1]?.endsWith("emuReport.ts")) {
  const args = process.argv.slice(2);
  if (args[0] === "--views") {
    const [, id, out, ...kv] = args;
    const d = [...EMU471_DESIGNS, ...EMU680_DESIGNS, ...EMU451_DESIGNS, ...EMU460_DESIGNS, ...EMU470_DESIGNS].find((x) => x.id === id)!;
    const params = Object.fromEntries(kv.map((s) => s.split("=") as [string, string]));
    writeViews(d.build(params), id!, new URL(out!.endsWith("/") ? out! : out! + "/", `file://${process.cwd()}/`));
  } else {
    for (const t of EMU_TRANSFERS) if (!args.length || args.includes(t.key)) console.log(report(t.key));
  }
}
