// Review views and the native landmark comparison of the Czech diesel railcars
// (docs/models/czech-dmus.md).
//
//   pnpm exec tsx generator/dmuReport.ts                        COMPARISON.md of every compared default car
//   pnpm exec tsx generator/dmuReport.ts --views <id> <dir> [k=v ...]   orthographic and three-quarter views
//
// The first report run of a design records its measurements as
// assets/<folder>/native/baseline.json, the model the later revisions are compared with.
import fs from "node:fs";
import { execSync } from "node:child_process";
import { PNG } from "pngjs";
import { collectTriangles, parseGlb } from "./glbTriangles.ts";
import { findCoplanarOverlaps } from "./coplanar.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { CZ_DMUS } from "./czDmus.ts";
import { DMU_COMPARED, compare, mae, type ComparisonRow } from "./dmuComparison.ts";

const ROOT = new URL("../", import.meta.url);
type P3 = readonly number[];
interface Tri {
  p: P3[];
  rgb: number[];
  n: number[];
}

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

function writeViews(mesh: MeshBuilder, id: string, dir: URL): void {
  fs.mkdirSync(dir, { recursive: true });
  const tris = trianglesOf(mesh, id);
  const views: Array<[string, number, number, number]> = [
    ["side-right", 0, 0, 1600],
    ["side-left", 180, 0, 1600],
    ["front", 90, 0, 500],
    ["rear", -90, 0, 500],
    ["three-quarter-front", -35, 22, 1400],
    ["three-quarter-rear", 145, 22, 1400],
  ];
  for (const [name, yaw, pitch, w] of views) fs.writeFileSync(new URL(`${name}.png`, dir), PNG.sync.write(view(tris, yaw, pitch, w)));
}

let revision = "working tree";
try {
  revision = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
} catch {
  // not a checkout
}
const f = (v: number) => v.toFixed(2);

function report(): void {
  for (const d of DMU_COMPARED) {
    const rows = compare(d);
    const baseFile = new URL(`assets/${d.folder}/native/${d.key}/baseline.json`, ROOT);
    if (!fs.existsSync(baseFile)) fs.writeFileSync(baseFile, JSON.stringify(rows.map((r) => ({ id: r.id, delta: r.delta.map((v) => Math.round(v * 1000) / 1000) })), null, 2) + "\n");
    const baseline = JSON.parse(fs.readFileSync(baseFile, "utf8")) as Array<{ id: string; delta: number[] }>;
    const bMae = (ids: Set<string>) => {
      const b = baseline.filter((r) => ids.has(r.id));
      return b.reduce((s, r) => s + r.delta.reduce((a, x) => a + Math.abs(x), 0), 0) / (4 * Math.max(1, b.length));
    };
    const views = [...new Set(rows.map((r) => r.view))];
    const lines = [
      `# ${d.title}: native landmark comparison`,
      "",
      `**Covers** - the build \`${d.id}\` ${JSON.stringify(d.params)} against ${rows.length} boxes annotated on the native vlakosimdb BMPs (\`native/${d.key}/landmarks.json\`).`,
      "**Code** - `generator/dmuComparison.ts`, `generator/dmuReport.ts`, `test/czechDmus.test.ts`",
      "**See also** - [SOURCES.md](SOURCES.md), [docs/models/czech-dmus.md](../../docs/models/czech-dmus.md)",
      "",
      `Model revision: \`${revision}\` (measured when this file was written). Mapping: ${d.mapping}. Canvases: ${views.map((v) => `${v} ${d.canvas[v][0]} x ${d.canvas[v][1]} px (\`${d.files[v]}\`)`).join(", ")}.`,
      "",
      "Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, projected orthographically with the documented scales undone, occluded vertices included.",
      "",
      "| View | Boxes | MAE baseline (pp) | MAE now (pp) |",
      "|---|---:|---:|---:|",
      ...views.map((v) => {
        const rs = rows.filter((r) => r.view === v);
        return `| ${v} | ${rs.length} | ${f(bMae(new Set(rs.map((r) => r.id))))} | ${f(mae(rs))} |`;
      }),
      `| all | ${rows.length} | ${f(bMae(new Set(rows.map((r) => r.id))))} | ${f(mae(rows))} |`,
      "",
      "| ID | View | Scope | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |",
      "|---|---|---|---|---|---|---|---|---:|---|",
      ...rows.map((r: ComparisonRow) =>
        `| ${r.id} | ${r.view} | ${r.nodes.join(", ")} | ${r.source.map(f).join(", ")} | ${r.model.map(f).join(", ")} | ${r.sourcePercent.map(f).join(", ")} | ${r.modelPercent.map(f).join(", ")} | ${r.delta.map(f).join(", ")} | ${r.tolerancePixels} | ${r.uncertainty} |`,
      ),
      "",
    ];
    fs.writeFileSync(new URL(`assets/${d.folder}/${d.report}`, ROOT), lines.join("\n"));
    console.log(`${d.id} ${d.key}: ${rows.length} boxes, MAE ${f(bMae(new Set(rows.map((r) => r.id))))} -> ${f(mae(rows))} pp`);
    for (const r of rows) {
      const worst = Math.max(...r.model.map((v, i) => Math.abs(v - r.source[i]!)));
      if (worst > r.tolerancePixels) console.log(`  ${r.id} off by ${worst.toFixed(2)} px (tolerance ${r.tolerancePixels}): source ${r.source.map(f)} model ${r.model.map(f)}`);
    }
  }
}

const args = process.argv.slice(2);
if (args[0] === "--views") {
  const [, id, out, ...kv] = args;
  const d = CZ_DMUS.find((x) => x.id === id)!;
  const params = Object.fromEntries(kv.map((s) => s.split("=") as [string, string]));
  const mesh = d.build(params);
  const glb = mesh.toGlb(id!);
  const overlaps = findCoplanarOverlaps(glb);
  console.log(`${id} ${JSON.stringify(params)}: ${mesh.triangleCount()} triangles, ${overlaps.length} coplanar overlaps`);
  for (const o of overlaps.slice(0, 12)) console.log("  ", JSON.stringify(o).slice(0, 300));
  writeViews(mesh, id!, new URL(out!.endsWith("/") ? out! : out! + "/", `file://${process.cwd()}/`));
} else report();
