// A passenger's view of a structure, rendered headlessly (docs/models/station-types.md,
// "Passenger view"): a perspective camera standing inside the model at eye height,
// looking where it is told, over a pale sky. The site's viewer offers the same view in
// the browser; this is what the station skill's checks and the images sent to the
// user are made with, without a browser.
//
//   pnpm exec tsx generator/renderPassengerView.ts <design id> <out.png> [options]
//     --params tracks=4,length=120   the design's parameter values
//     --eye x,y,z --look x,y,z        the camera and the point it looks at (model units)
//     --view <name>                   a railway station preview's named view (below)
//     --size 960x540                  the image size
//
// A railway station preview (`proc-preview-station-*`) has named views computed from
// its layout: `platform` (on the first platform, near one end, looking along it),
// `island` (on the first island, looking along it), `across` (from the first island
// across the tracks) and `up` (on the first island, looking up into the roof).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { cross, dot, norm, sub, type Tri, type Vec3 } from "./glbTriangles.ts";
import { rasterize, readTriangles, type GlbSource } from "./renderGlbThumb.ts";

const SS_NEAR = 0.05;
const FOV_DEG = 70;
const SKY: Vec3 = [0.80, 0.86, 0.92];
const KEY_DIR = norm([40, 80, 30]);
const FILL_DIR = norm([-30, 20, -40]);

export interface PassengerCamera { eye: Vec3; look: Vec3; fovDeg?: number }

/** The part of each triangle in front of the plane `dot(p - eye, fwd) >= near`, as triangles. */
function clipNear(tris: readonly Tri[], eye: Vec3, fwd: Vec3, near: number): Tri[] {
  const out: Tri[] = [];
  const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  for (const t of tris) {
    const d = t.p.map((p) => dot(sub(p, eye), fwd) - near);
    const inside = d.filter((v) => v >= 0).length;
    if (inside === 3) { out.push(t); continue; }
    if (inside === 0) continue;
    // walk the triangle's edges, keeping the corners in front and the crossings
    const poly: Array<{ p: Vec3; n: Vec3 }> = [];
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      if (d[i]! >= 0) poly.push({ p: t.p[i]!, n: t.n[i]! });
      if ((d[i]! >= 0) !== (d[j]! >= 0)) {
        const k = d[i]! / (d[i]! - d[j]!);
        poly.push({ p: lerp(t.p[i]!, t.p[j]!, k), n: lerp(t.n[i]!, t.n[j]!, k) });
      }
    }
    for (let i = 1; i + 1 < poly.length; i++) {
      out.push({ ...t, corners: undefined, p: [poly[0]!.p, poly[i]!.p, poly[i + 1]!.p], n: [poly[0]!.n, poly[i]!.n, poly[i + 1]!.n] });
    }
  }
  return out;
}

/** Render the GLB as seen from `camera`, a `width` x `height` PNG over a pale sky. */
export function renderPassengerView(glb: GlbSource, width: number, height: number, camera: PassengerCamera): PNG {
  return renderTrianglesView(readTriangles(glb), width, height, camera);
}

/** The same view of plain triangles (several models laid together: a station and its parked train). */
export function renderTrianglesView(all: readonly Tri[], width: number, height: number, camera: PassengerCamera): PNG {
  const fwd = norm(sub(camera.look, camera.eye));
  const right = norm(cross(fwd, [0, 1, 0]));
  const up = cross(right, fwd);
  const tris = clipNear(all, camera.eye, fwd, SS_NEAR);
  const f = 1 / Math.tan(((camera.fovDeg ?? FOV_DEG) * Math.PI) / 360);
  const aspect = width / height;
  const SS = 3;
  const png = rasterize(
    tris, width, height,
    (p) => {
      const v = sub(p, camera.eye);
      const w = dot(v, fwd);
      if (w < SS_NEAR * 0.999) return null;
      return { x: ((dot(v, right) * f) / (w * aspect) * 0.5 + 0.5) * width * SS, y: (0.5 - (dot(v, up) * f) / w * 0.5) * height * SS, w };
    },
    true,
    (world) => norm(sub(camera.eye, world)),
    (n) => 0.42 + 0.62 * Math.max(0, dot(n, KEY_DIR)) + 0.22 * Math.max(0, dot(n, FILL_DIR)),
  );
  // over the sky
  const sky = SKY.map((c) => Math.round(c * 255));
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3]! / 255;
    for (let c = 0; c < 3; c++) png.data[i + c] = Math.round(png.data[i + c]! * a + sky[c]! * (1 - a));
    png.data[i + 3] = 255;
  }
  return png;
}

/** A railway station preview's named views, from its type's layout (in studs). */
export async function stationViews(type: string, tracks: number, length: number): Promise<Record<string, PassengerCamera>> {
  const station = await import("./sets/station.ts");
  const layout = station.buildLayout(type, tracks);
  const width = layout.rows.reduce((w, r) => w + r.width, 0);
  let x = -width / 2;
  const rows = layout.rows.map((r) => { const row = { ...r, cx: x + r.width / 2 }; x += r.width; return row; });
  const platform = rows.find((r) => r.type === "platform") ?? rows[0]!;
  const island = rows.find((r) => r.type === "island") ?? rows.find((r) => r.type === "building") ?? platform;
  const firstRail = rows.find((r) => r.type === "rail") ?? platform;
  const y = station.PLATFORM_HEIGHT + 2.55;
  const end = -length / 2 + 8;
  // a passenger stands a little toward the track, off the centreline where posts stand
  const toward = (r: { cx: number }): number => Math.sign(firstRail.cx - r.cx) || 1;
  const px = platform.cx + toward(platform) * 1.6, ix = island.cx + 1.2;
  return {
    platform: { eye: [px, y, end], look: [px + toward(platform) * 4, y - 0.6, end + 30] },
    island: { eye: [ix, y, end], look: [ix - 2, y - 0.4, end + 30] },
    across: { eye: [ix, y, -length / 8], look: [platform.cx, y, -length / 8 + 18] },
    up: { eye: [ix, y, -length / 8], look: [ix + 6, y + 9, -length / 8 + 14] },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [id, out, ...rest] = process.argv.slice(2);
  if (!id || !out) {
    console.error("usage: tsx generator/renderPassengerView.ts <design id> <out.png> [--params k=v,...] [--eye x,y,z --look x,y,z | --view name] [--size WxH]");
    process.exit(1);
  }
  const opt = (name: string): string | undefined => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : undefined; };
  const params = Object.fromEntries((opt("params") ?? "").split(",").filter(Boolean).map((kv) => kv.split("=") as [string, string]));
  const [w, h] = (opt("size") ?? "960x540").split("x").map(Number) as [number, number];
  const vec = (s: string): Vec3 => s.split(",").map(Number) as Vec3;
  let camera: PassengerCamera;
  if (opt("eye") && opt("look")) camera = { eye: vec(opt("eye")!), look: vec(opt("look")!) };
  else {
    const type = id.replace(/^proc-preview-station-/, "").replace(/-/g, "_");
    const views = await stationViews(type, Number(params.tracks ?? 2), Number(params.length ?? 60));
    camera = views[opt("view") ?? "platform"] ?? views.platform!;
  }
  const { designGlb } = await import("./generate.ts");
  const png = renderPassengerView(designGlb(id, params), w, h, camera);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, PNG.sync.write(png));
  console.log(`wrote ${out} (${png.width}x${png.height})`);
}
