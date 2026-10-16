// Review views and native comparison tables of the small diesels
// (docs/models/small-diesels.md).
//
//   pnpm exec tsx generator/smallDieselReport.ts                 every COMPARISON.md
//   pnpm exec tsx generator/smallDieselReport.ts --views <id> <out-dir> [k=v ...]
//
// The views (orthographic sides, ends, top, three-quarters, and each landmark
// view's model drawn over its native BMP) are generated, not committed; the
// tables go to assets/<folder>/COMPARISON.md, and the first run records the
// measurements as assets/<folder>/native/baseline.json.
import fs from "node:fs";
import { createHash } from "node:crypto";
import { PNG } from "pngjs";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { SMALL_DIESELS } from "./smallDiesels.ts";
import { COMPARED, compare, mae, type ComparedDesign, type ComparisonRow } from "./smallDieselComparison.ts";

const ROOT = new URL("../", import.meta.url);
type P3 = readonly number[];
interface Tri { p: P3[]; rgb: number[]; n: number[] }

function raster(tris: Tri[], W: number, H: number, project: (p: P3) => number[], shade: (t: Tri) => number[], bg?: PNG): PNG {
  const png = new PNG({ width: W, height: H });
  const zb = new Float64Array(W * H).fill(-Infinity);
  for (let i = 0; i < W * H; i++) png.data.set(bg ? [...bg.data.subarray(i * 4, i * 4 + 3), 255] : [229, 231, 235, 255], i * 4);
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
  const yaw = (yawDeg * Math.PI) / 180, pitch = (pitchDeg * Math.PI) / 180;
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

export function writeViews(mesh: MeshBuilder, id: string, dir: URL): void {
  fs.mkdirSync(dir, { recursive: true });
  const tris = trianglesOf(mesh, id);
  const views: Array<[string, number, number, number]> = [
    ["side-right", 0, 0, 1600], ["side-left", 180, 0, 1600], ["front", 90, 0, 500], ["rear", -90, 0, 500],
    ["three-quarter-front", -35, 22, 1400], ["three-quarter-rear", 145, 22, 1400], ["top", 0, 89.9, 1600],
  ];
  for (const [name, yaw, pitch, w] of views) fs.writeFileSync(new URL(`${name}.png`, dir), PNG.sync.write(view(tris, yaw, pitch, w)));
}

/** The model's flat colours drawn over a native BMP (enlarged, nearest) in its view's mapping, with the landmark boxes. */
function overlay(d: ComparedDesign, rows: ComparisonRow[], dir: URL): string[] {
  const tris = trianglesOf(d.build(), d.id);
  const out: string[] = [];
  const S = 8;
  for (const v of [...new Set(rows.map((r) => r.view))]) {
    const file = new URL(`assets/${d.folder}/${d.files[v]}`, ROOT);
    const [W, H] = d.canvas[v];
    // the BMP, read through pngjs-free decoding: only 24-bit uncompressed BMPs are expected
    const buf = fs.readFileSync(file);
    const off = buf.readUInt32LE(10), bw = buf.readInt32LE(18), bh = buf.readInt32LE(22), bpp = buf.readUInt16LE(28);
    const bg = new PNG({ width: W * S, height: H * S });
    const row = Math.ceil((bw * bpp) / 32) * 4;
    for (let y = 0; y < H * S; y++)
      for (let x = 0; x < W * S; x++) {
        const sx = Math.floor(x / S), sy = Math.floor(y / S);
        let rgb = [40, 40, 40];
        if (bpp === 24 && sx < bw && sy < Math.abs(bh)) {
          const ry = bh > 0 ? bh - 1 - sy : sy;
          const p = off + ry * row + sx * 3;
          rgb = [buf[p + 2]!, buf[p + 1]!, buf[p]!];
        }
        bg.data.set([...rgb, 255], (y * W * S + x) * 4);
      }
    const half = new PNG({ width: W * S, height: H * S });
    const model = raster(tris, W * S, H * S, (p) => {
      const [u, w] = d.project(v, p as [number, number, number]);
      return [u * S, w * S, d.depth(v, p as [number, number, number])];
    }, (t) => t.rgb);
    for (let i = 0; i < W * S * H * S; i++) {
      const m = [...model.data.subarray(i * 4, i * 4 + 3)];
      const isBg = m[0] === 229 && m[1] === 231 && m[2] === 235;
      const b = [...bg.data.subarray(i * 4, i * 4 + 3)];
      half.data.set([...(isBg ? b.map((x) => x * 0.6) : m.map((x, k) => (x + b[k]!) / 2)), 255], i * 4);
    }
    for (const r of rows.filter((x) => x.view === v))
      for (const [box, col] of [[r.box, [255, 0, 255]], [[r.model[0]!, r.model[1]!, r.model[0]! + r.model[2]!, r.model[1]! + r.model[3]!], [0, 255, 255]]] as const) {
        const [x0, y0, x1, y1] = box.map((q) => Math.round(q * S));
        for (let x = Math.max(0, x0!); x <= Math.min(W * S - 1, x1!); x++) for (const y of [y0!, y1!]) if (y >= 0 && y < H * S) half.data.set([...col, 255], (y * W * S + x) * 4);
        for (let y = Math.max(0, y0!); y <= Math.min(H * S - 1, y1!); y++) for (const x of [x0!, x1!]) if (x >= 0 && x < W * S) half.data.set([...col, 255], (y * W * S + x) * 4);
      }
    const name = `overlay-${v}.png`;
    fs.writeFileSync(new URL(name, dir), PNG.sync.write(half));
    out.push(name);
  }
  return out;
}

const f = (v: number) => v.toFixed(2);

function report(d: ComparedDesign): string {
  const rows = compare(d);
  const dir = new URL(`export/review/${d.id}/`, ROOT);
  fs.mkdirSync(dir, { recursive: true });
  writeViews(d.build(), d.id, dir);
  const images = overlay(d, rows, dir);
  const baseFile = new URL(`assets/${d.folder}/native/baseline.json`, ROOT);
  if (!fs.existsSync(baseFile)) fs.writeFileSync(baseFile, JSON.stringify(rows.map((r) => ({ id: r.id, delta: r.delta.map((v) => Math.round(v * 1000) / 1000) })), null, 1) + "\n");
  const baseline = JSON.parse(fs.readFileSync(baseFile, "utf8")) as Array<{ id: string; delta: number[] }>;
  const bMae = (ids: Set<string>) => {
    const b = baseline.filter((r) => ids.has(r.id));
    return b.reduce((s, r) => s + r.delta.reduce((a, x) => a + Math.abs(x), 0), 0) / (4 * Math.max(1, b.length));
  };
  const revision = createHash("sha256").update(d.build().toGlb(`${d.title} comparison`)).digest("hex").slice(0, 12);
  const views = [...new Set(rows.map((r) => r.view))];
  const lines = [
    `# ${d.title}: native landmark comparison`,
    "",
    `**Covers** - the default build of \`${d.id}\` against ${rows.length} boxes annotated on the native vlakosimdb BMPs (\`native/landmarks.json\`).`,
    "**Code** - `generator/smallDieselComparison.ts`, `generator/smallDieselReport.ts`, `test/smallDiesels.test.ts`",
    "**See also** - [SOURCES.md](SOURCES.md), [docs/models/small-diesels.md](../../docs/models/small-diesels.md)",
    "",
    `Model GLB sha256 \`${revision}\` (the default build measured). Mapping: ${d.mapping}. Canvases: ${views.map((v) => `${v} ${d.canvas[v][0]} x ${d.canvas[v][1]} px (\`${d.files[v]}\`)`).join(", ")}.`,
    "",
    "Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left, X right, Y down. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, orthographically projected, occluded vertices included.",
    "",
    "| View | Boxes | MAE baseline (pp) | MAE now (pp) |",
    "|---|---:|---:|---:|",
    ...views.map((v) => {
      const ids = new Set(rows.filter((r) => r.view === v).map((r) => r.id));
      return `| ${v} | ${ids.size} | ${f(bMae(ids))} | ${f(mae(rows.filter((r) => r.view === v)))} |`;
    }),
    `| all | ${rows.length} | ${f(bMae(new Set(rows.map((r) => r.id))))} | ${f(mae(rows))} |`,
    "",
    `Overlays (generated by this script into \`export/review/${d.id}/\`, not committed): ${images.map((i) => `\`${i}\``).join(", ")}.`,
    "",
    "| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |",
    "|---|---|---|---|---|---|---|---|---:|---|",
    ...rows.map((r) =>
      `| ${r.id} | ${r.view} | ${r.nodes.join(", ")} | ${r.source.map(f).join(", ")} | ${r.model.map(f).join(", ")} | ${r.sourcePercent.map(f).join(", ")} | ${r.modelPercent.map(f).join(", ")} | ${r.delta.map(f).join(", ")} | ${r.tolerancePixels} | ${r.uncertainty} |`),
    "",
  ];
  fs.writeFileSync(new URL(`assets/${d.folder}/COMPARISON.md`, ROOT), lines.join("\n"));
  const bad = rows.filter((r) => r.model.some((v, i) => Math.abs(v - r.source[i]!) > r.tolerancePixels));
  return `${d.id}: ${rows.length} boxes, MAE ${f(bMae(new Set(rows.map((r) => r.id))))} -> ${f(mae(rows))} pp` +
    bad.map((r) => `\n  ${r.id} off: source ${r.source.map(f)} model ${r.model.map(f)} (tol ${r.tolerancePixels})`).join("");
}

const args = process.argv.slice(2);
if (args[0] === "--views") {
  const [, id, out, ...kv] = args;
  const d = SMALL_DIESELS.find((x) => x.id === id)!;
  const params = Object.fromEntries(kv.map((s) => s.split("=") as [string, string]));
  const mesh = d.build(params);
  console.log(id, params, mesh.triangleCount(), "triangles");
  writeViews(mesh, id!, new URL(out!.endsWith("/") ? out! : out! + "/", `file://${process.cwd()}/`));
} else {
  for (const d of COMPARED) if (!args.length || args.includes(d.id)) console.log(report(d));
}
