// Shared parts of the Czech box-cab electric locomotives transferred from
// vlakosimdb in one package: the CD 110 / 111 / 210 shunter (cd110.ts), the
// CD 123 / 130 (cd130.ts), the CD 140 "bobina" (cd140.ts) and the CD 169
// prototype (cd169.ts). docs/models/cz-electrics.md.
//
// - `shell`: a body lofted in plan between horizontal rings, as the CD 230's
//   (cd230.ts) is: at every height a ring whose sides stand `hw(y)` off the
//   centre line and whose ends follow `endPlan(y)` (a flat face with chamfered
//   corners, or a bowed nose), so the elevation, the cross-section and the plan
//   of the native XML clips all shape it. Painted per livery band and region.
// - `surfacePanel`: a convex (u, v) outline laid on any such surface -- a side
//   wall (u = x) or an end face (u = z) -- cut where the surface kinks, so a
//   window or a lamp lies on the skin instead of cutting through it.
// - running gear (`bogie`), `buffers`, `coupling`, and the two collector kinds:
//   the single-arm half pantograph (`singleArm`, from cd163.ts) and the diamond
//   (`diamond`, from cd230.ts), both with constant arm lengths in either pose.
//
// The builders here draw nothing an existing design draws, so no existing GLB
// depends on this module.

import { ngon, type MaterialSpec, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { CD163_PALETTE, bandAt, coil, lettering, letteringWidth, pushRod, type Band } from "./cd163.ts";
import { liftable } from "./liftable.ts";
import { RAIL_COLLECTOR_TOP } from "./collector.ts";

export const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, metallic: 0.1, roughness });

/** The materials every locomotive of the package shares; a livery adds its own colours. */
export const KIT_PALETTE: Record<string, MaterialSpec> = {
  ...CD163_PALETTE,
  roof: { color: "#6e7271", roughness: 0.75 },
  rim: c("#9a9fa1", 0.45),
  frame: c("#2c2e31", 0.75),
  pantograph: { color: "#5a5e63", metallic: 0.2, roughness: 0.6 },
  louvre: { color: "#2e3134", roughness: 0.8 },
  slat: { color: "#7d8285", roughness: 0.6 },
  hazard: c("#e8b818"),
  black: c("#1e1f21", 0.7),
  breaker: c("#a8231c"),
};

export function lerpTable(table: ReadonlyArray<readonly [number, number]>, y: number): number {
  if (y <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    const [y0, v0] = table[i - 1]!;
    const [y1, v1] = table[i]!;
    if (y <= y1) return y1 === y0 ? v1 : v0 + ((v1 - v0) * (y - y0)) / (y1 - y0);
  }
  return table[table.length - 1]![1];
}

export const rect = (x0: number, y0: number, x1: number, y1: number): Ring => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** A rounded rectangle in (u, v), counter-clockwise. */
export function roundRect(u0: number, u1: number, v0: number, v1: number, r: number, n = 3): Ring {
  const rr = Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2);
  if (rr <= 1e-6) return rect(u0, v0, u1, v1);
  const out: Ring = [];
  const corner = (cu: number, cv: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI / 2) * (i / n);
      out.push([cu + rr * Math.cos(a), cv + rr * Math.sin(a)]);
    }
  };
  corner(u1 - rr, v0 + rr, -Math.PI / 2);
  corner(u1 - rr, v1 - rr, 0);
  corner(u0 + rr, v1 - rr, Math.PI / 2);
  corner(u0 + rr, v0 + rr, Math.PI);
  return out;
}

// ---------------------------------------------------------------------------
// The shell

export interface ShellSpec {
  /** The heights where the profiles change, bottom first; the last is the roof's crown, capped. */
  heights: readonly number[];
  /** The end face's centre line at height y: its distance from `xc`. */
  tip: (y: number) => number;
  /** Half the body's width at height y. */
  hw: (y: number) => number;
  /**
   * The end's plan at height y from its centre line out to the side: [z, setback]
   * pairs, z rising from 0 to hw(y), the setback measured back from tip(y). The
   * same number of points at every height.
   */
  endPlan: (y: number) => ReadonlyArray<readonly [number, number]>;
  side: readonly Band[];
  end: readonly Band[];
  /** Which bands paint the last end segment (the corner): the side's or the end's. */
  corner: "side" | "end";
  roof: string;
  /** The body's centre along x. */
  xc?: number;
  /** Close the underside with a cap. */
  bottom?: string;
  /** Draw only these ends (a hood that abuts the cab has one end hidden): +1 front, -1 rear. */
  ends?: readonly number[];
}

type Region = "front" | "rear" | "side";
interface RingPoint { x: number; z: number; region: Region; sign: number }

function shellRing(sp: ShellSpec, y: number): RingPoint[] {
  const xc = sp.xc ?? 0;
  const tip = sp.tip(y), hw = sp.hw(y);
  const plan = sp.endPlan(y).map(([z, b]) => [Math.min(z, hw), b] as const);
  const n = plan.length - 1;
  const out: RingPoint[] = [];
  // the edge from plan point i toward the side: an end edge, the corner (i = n - 1) or the side itself (i = n)
  const kind = (e: number, i: number, zs: number): [Region, number] =>
    i === n || (i === n - 1 && sp.corner === "side") ? ["side", zs] : [e > 0 ? "front" : "rear", e];
  const at = (e: number, i: number, zs: number, edge: number) => {
    const [region, sign] = kind(e, edge, zs);
    out.push({ x: xc + e * (tip - plan[i]![1]), z: zs * plan[i]![0], region, sign });
  };
  // front centre -> -z corner, along the -z side, rear -z corner -> centre -> +z corner, along +z, front +z corner -> centre
  for (let i = 0; i <= n; i++) at(1, i, -1, i);
  for (let i = n; i >= 1; i--) at(-1, i, -1, i - 1);
  for (let i = 0; i <= n; i++) at(-1, i, 1, i);
  for (let i = n; i >= 1; i--) at(1, i, 1, i - 1);
  return out;
}

/** The triangle wound to face along n. */
function orient(t: [Vec3, Vec3, Vec3], n: Vec3): Vec3[] {
  const [a, b, cc] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const nn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  return nn[0]! * n[0] + nn[1]! * n[1] + nn[2]! * n[2] >= 0 ? [a, b, cc] : [a, cc, b];
}

/** Lofts the body between its rings, one leaf per region and band: `front`, `rear`, `side left|right`, `band <i>`. */
export function shell(m: MeshBuilder, sp: ShellSpec): void {
  const y0 = sp.heights[0]!, y1 = sp.heights[sp.heights.length - 1]!;
  const hs = new Set<number>(sp.heights);
  for (const bands of [sp.side, sp.end]) for (const [a, b] of bands) for (const h of [a, b]) if (h > y0 && h < y1) hs.add(h);
  const heights = [...hs].sort((a, b) => a - b);
  const ends = sp.ends ?? [-1, 1];
  const groups = new Map<string, { mat: string; normal: Vec3; pts: Vec3[] }>();
  for (let i = 1; i < heights.length; i++) {
    const [ya, yb] = [heights[i - 1]!, heights[i]!];
    const [lo, hi] = [shellRing(sp, ya), shellRing(sp, yb)];
    const ym = (ya + yb) / 2;
    for (let j = 0; j < lo.length; j++) {
      const k = (j + 1) % lo.length;
      const { region, sign } = lo[j]!;
      if (region !== "side" && !ends.includes(region === "front" ? 1 : -1)) continue;
      const a: Vec3 = [lo[j]!.x, ya, lo[j]!.z], b: Vec3 = [lo[k]!.x, ya, lo[k]!.z];
      const cc: Vec3 = [hi[k]!.x, yb, hi[k]!.z], d: Vec3 = [hi[j]!.x, yb, hi[j]!.z];
      if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 1e-6 && Math.hypot(cc[0] - d[0], cc[2] - d[2]) < 1e-6) continue;
      const bands = region === "side" ? sp.side : sp.end;
      const band = bandAt(bands, ym);
      const where = region === "side" ? `side ${sign > 0 ? "right" : "left"}` : region;
      const key = `${where}|${bands.indexOf(band)}`;
      const normal: Vec3 = region === "front" ? [1, 0, 0] : region === "rear" ? [-1, 0, 0] : [0, 0, sign];
      if (!groups.has(key)) groups.set(key, { mat: band[2], normal, pts: [] });
      // the edge's outward normal, (-dz, dx) along the ring (it runs clockwise seen from above);
      // the upper edge's where the lower one is a point
      const en: Vec3 = [-(b[2] - a[2]), 0, b[0] - a[0]];
      const edge: Vec3 = Math.hypot(en[0], en[2]) > 1e-9 ? en : [-(cc[2] - d[2]), 0, cc[0] - d[0]];
      const g = groups.get(key)!;
      g.pts.push(...orient([a, b, cc], edge), ...orient([a, cc, d], edge));
    }
  }
  const keys = [...groups.keys()].sort();
  for (const where of [...new Set(keys.map((k) => k.split("|")[0]!))])
    m.scope(where, () => {
      for (const key of keys.filter((k) => k.startsWith(where + "|")).sort((a, b) => Number(a.split("|")[1]) - Number(b.split("|")[1]))) {
        const g = groups.get(key)!;
        m.scope(`band ${key.split("|")[1]}`, () => m.facets(g.mat, g.pts, g.normal));
      }
    });
  m.scope("roof", () => m.cap(sp.roof, shellRing(sp, y1).map((p) => [p.x, p.z]), y1));
  if (sp.bottom) m.cap(sp.bottom, shellRing(sp, y0).map((p) => [p.x, p.z]), y0, false);
}

/** The setback of the end at height y, |z| from the centre line, interpolated in the end's plan. */
export function setbackAt(sp: ShellSpec, y: number, z: number): number {
  const plan = sp.endPlan(y);
  const az = Math.abs(z);
  for (let i = 1; i < plan.length; i++) {
    const [z0, b0] = plan[i - 1]!, [z1, b1] = plan[i]!;
    if (az <= z1 + 1e-9) return z1 === z0 ? b1 : b0 + ((b1 - b0) * (az - z0)) / (z1 - z0);
  }
  return plan[plan.length - 1]![1];
}

/** Places (u, v, d) on a surface: the point and the surface's outward direction there. */
export type Place = (u: number, v: number, d: number) => Vec3;

/** The point d off side s's wall (+1 right) at x, height y. */
export const onSide = (sp: ShellSpec, s: number): Place => (x, y, d) => [x, y, s * (sp.hw(y) + d)];
/** The point d off end e's face (+1 front) at z (u), height y. */
export const onEnd = (sp: ShellSpec, e: number): Place => (z, y, d) => [(sp.xc ?? 0) + e * (sp.tip(y) - setbackAt(sp, y, z) + d), y, z];

/** The y span of a convex (u, v) outline at u. */
function spanAt(poly: Ring, u: number): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i]!, poly[(i + 1) % poly.length]!];
    if ((a[0] - u) * (b[0] - u) > 0 || a[0] === b[0]) {
      if (a[0] === u) [lo, hi] = [Math.min(lo, a[1]), Math.max(hi, a[1])];
      continue;
    }
    const v = a[1] + ((u - a[0]) * (b[1] - a[1])) / (b[0] - a[0]);
    [lo, hi] = [Math.min(lo, v), Math.max(hi, v)];
  }
  return [lo, hi];
}

/**
 * A panel on a surface: the convex (u, v) outline from `d0` (sunk in) out to
 * `d1`, its face cut into columns at the outline's corners and `uBreaks`, and
 * into rows at `vBreaks` (where the surface kinks), walled round its edge. The
 * triangles go out in five one-sided groups wound by the outward normal `n`
 * (the face), up, down and the two end walls along u.
 */
export function surfacePanel(m: MeshBuilder, mat: string, at: Place, n: Vec3, poly: Ring, d0: number, d1: number, uBreaks: readonly number[] = [], vBreaks: readonly number[] = []): void {
  const u0 = Math.min(...poly.map((p) => p[0])), u1 = Math.max(...poly.map((p) => p[0]));
  const cols = new Set<number>(poly.map((p) => p[0]));
  for (const u of uBreaks) if (u > u0 && u < u1) cols.add(u);
  const us = [...cols].sort((a, b) => a - b).filter((u, i, a) => i === 0 || u - a[i - 1]! > 1e-4);
  const spans = us.map((u) => spanAt(poly, u));
  const face: Vec3[] = [], up: Vec3[] = [], down: Vec3[] = [];
  const quad = (out: Vec3[], a: Vec3, b: Vec3, c: Vec3, d: Vec3) => out.push(a, b, c, a, c, d);
  for (let i = 1; i < us.length; i++) {
    const [a, b] = [us[i - 1]!, us[i]!];
    const [[la, ha], [lb, hb]] = [spans[i - 1]!, spans[i]!];
    const ys = vBreaks.filter((h) => h > Math.max(la, lb) + 1e-4 && h < Math.min(ha, hb) - 1e-4);
    const rows: Array<[number, number]> = [[la, lb], ...ys.map((h): [number, number] => [h, h]), [ha, hb]];
    for (let r = 1; r < rows.length; r++) {
      const [[ya0, yb0], [ya1, yb1]] = [rows[r - 1]!, rows[r]!];
      quad(face, at(a, ya0, d1), at(b, yb0, d1), at(b, yb1, d1), at(a, ya1, d1));
    }
    quad(down, at(a, la, d0), at(b, lb, d0), at(b, lb, d1), at(a, la, d1));
    quad(up, at(a, ha, d0), at(b, hb, d0), at(b, hb, d1), at(a, ha, d1));
  }
  // drop degenerate triangles (a pointed outline's corner)
  const clean = (pts: Vec3[]): Vec3[] => {
    const out: Vec3[] = [];
    for (let i = 0; i + 2 < pts.length; i += 3) {
      const [p, q, r] = [pts[i]!, pts[i + 1]!, pts[i + 2]!];
      const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], v = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
      const cr = Math.hypot(u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!);
      if (cr > 1e-9) out.push(p, q, r);
    }
    return out;
  };
  m.facets(mat, clean(face), n);
  // the walls along the top and bottom edges face away from the panel's middle in v
  const upN = sub(at(u0, 1, 0), at(u0, 0, 0)), downN: Vec3 = [-upN[0], -upN[1], -upN[2]];
  const cu = clean(up), cd = clean(down);
  if (cu.length) m.facets(mat, cu, upN);
  if (cd.length) m.facets(mat, cd, downN);
  for (const [i, dir] of [[0, -1], [us.length - 1, 1]] as const) {
    const [lo, hi] = spans[i]!;
    if (hi - lo < 1e-4) continue;
    const u = us[i]!;
    const t = sub(at(u + 0.01, (lo + hi) / 2, 0), at(u, (lo + hi) / 2, 0));
    const wall: Vec3[] = [];
    quad(wall, at(u, lo, d0), at(u, hi, d0), at(u, hi, d1), at(u, lo, d1));
    m.facets(mat, wall, [t[0] * dir, t[1] * dir, t[2] * dir]);
  }
}
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** One-sided outlines painted `d` off a surface (a seam, a stripe): no walls, fan-triangulated convex outlines. */
export function surfaceDecal(m: MeshBuilder, mat: string, at: Place, n: Vec3, polys: readonly Ring[], d: number): void {
  const pts: Vec3[] = [];
  for (const q of polys) {
    const p = q.map(([u, v]) => at(u, v, d));
    for (let i = 1; i + 1 < p.length; i++) pts.push(p[0]!, p[i]!, p[i + 1]!);
  }
  m.facets(mat, pts, n);
}

/**
 * A running number laid on a surface, centred at (u, v): white strokes `h`
 * high, `d` off it. `flip` reads it toward -u (a surface seen from its -u side).
 */
export function numberOn(m: MeshBuilder, at: Place, n: Vec3, text: string, u: number, v: number, h: number, d: number, flip: boolean): void {
  const w = h * 0.45, gap = h * 0.12;
  const width = letteringWidth(text, w, gap);
  const tris = lettering(text, flip ? u + width / 2 : u - width / 2, v - h / 2, h, w, gap, flip);
  m.facets("white", tris.map(([a, b]) => at(a, b, d)), n);
}

// ---------------------------------------------------------------------------
// Running gear

export interface BogieSpec {
  xc: number;
  /** Half the bogie's wheelbase. */
  halfBase: number;
  wheelR: number;
  /** Height of the side frame's top. */
  frameTop: number;
}
/** A two-axle bogie: wheelsets with axle boxes and coils, plate side frames, bolster coils, brake cylinders. */
export function bogie(m: MeshBuilder, b: BogieSpec): void {
  m.bogie(() => bogieGeometry(m, b));
}

function bogieGeometry(m: MeshBuilder, b: BogieSpec): void {
  const { xc, halfBase: hb, wheelR: R, frameTop: ft } = b;
  const N = 20;
  const ay = R * Math.cos(Math.PI / N);
  for (const dx of [-hb, hb])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -1.0, axle, 1.0);
      for (const s of [-1, 1]) {
        const wheel = ngon(N, R, Math.PI / N, x, ay), disc = ngon(16, R * 0.8, 0, x, ay), hub = ngon(8, 0.14, 0, x, ay);
        sweepZ(m, "steel", wheel, side(s, 0.665, 0.8));
        sweepZ(m, "wheel", disc, side(s, 0.8, 0.82));
        sweepZ(m, "steel", hub, side(s, 0.82, 0.84));
        m.scope("axle box", () => sweepZ(m, "bogie", ngon(8, 0.15, Math.PI / 8, x, ay), side(s, 0.84, 1.04)));
        m.scope("primary suspension", () => {
          block(m, "bogie", x - 0.4, x + 0.4, ay + 0.16, ay + 0.2, ...side(s, 0.9, 1.04));
          for (const d of [-0.3, 0.3]) coil(m, "spring", x + d, s * 0.97, ay - 0.12, ay + 0.16, 0.075, 2, 6);
        });
      }
      const motor = ngon(12, Math.min(0.3, R * 0.5), 0, x - Math.sign(dx) * (R * 0.85), ay + 0.02);
      m.sweep("bogie", "z", motor, -0.55, motor, 0.55);
    });
  m.scope("frame", () => {
    const L = hb + 0.6;
    for (const s of [-1, 1]) {
      // the side frame dips between the wheels and rises over the axle boxes
      const top: Ring = [[-L, ft], [-hb + 0.35, ft], [-hb + 0.6, ft - 0.12], [hb - 0.6, ft - 0.12], [hb - 0.35, ft], [L, ft]];
      const bottom: Ring = [[-L, ft - 0.16], [-hb + 0.3, ft - 0.16], [-hb + 0.55, ay - 0.1], [hb - 0.55, ay - 0.1], [hb - 0.3, ft - 0.16], [L, ft - 0.16]];
      plate(m, "bogie", top.map(([u, v]) => [xc + u, v]), bottom.map(([u, v]) => [xc + u, v]), ...side(s, 0.92, 1.08));
    }
    for (const x of [xc - 0.55, xc + 0.55]) block(m, "bogie", x - 0.08, x + 0.08, ft - 0.26, ft - 0.06, -0.92, 0.92);
    for (const x of [xc - L + 0.05, xc + L - 0.05]) block(m, "bogie", x - 0.05, x + 0.05, ft - 0.16, ft - 0.02, -1.0, 1.0);
  });
  m.scope("secondary suspension", () => {
    for (const s of [-1, 1]) for (const d of [-0.25, 0.25]) coil(m, "spring", xc + d, s * 1.16, ft - 0.4, ft + 0.02, 0.1, 2, 6);
    for (const s of [-1, 1]) block(m, "bogie", xc - 0.45, xc + 0.45, ft - 0.5, ft - 0.4, ...side(s, 0.9, 1.3));
  });
  m.scope("brake cylinders", () => {
    for (const s of [-1, 1])
      for (const d of [-0.95, 0.95]) {
        const cyl = ngon(8, 0.08, Math.PI / 8, xc + d, ft - 0.2);
        sweepZ(m, "spring", cyl, side(s, 0.62, 0.88));
      }
  });
}

/** A prism of the (x, y) section `q` across z0..z1. */
export function sweepZ(m: MeshBuilder, mat: string, q: Ring, [z0, z1]: [number, number]): void {
  m.sweep(mat, "z", q, z0, q, z1);
}

/**
 * The buffers and the screw coupling at end e: the beam's face at `beam`, the
 * buffer heads' faces at `face` (|x|), the centres at `y` and +-0.875 m across.
 */
export function buffers(m: MeshBuilder, e: number, beam: number, face: number, y = 1.03, head: "round" | "rect" = "round"): void {
  const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
  m.scope("buffers", () => {
    for (const z of [-0.875, 0.875])
      m.scope(z > 0 ? "right" : "left", () => {
        const [a, b] = along(beam - 0.01, face - 0.32);
        const casing = ngon(12, 0.13, 0, z, y);
        m.sweep("steel", "x", casing, a, casing, b);
        const [p0, p1] = along(face - 0.32, face - 0.05);
        const plunger = ngon(12, 0.085, 0, z, y);
        m.sweep("steel", "x", plunger, p0, plunger, p1);
        const [h0, h1] = along(face - 0.05, face);
        const shape: Ring = head === "round" ? ngon(16, 0.2, 0, z, y) : [[z - 0.27, y - 0.13], [z + 0.27, y - 0.13], [z + 0.3, y - 0.1], [z + 0.3, y + 0.1], [z + 0.27, y + 0.13], [z - 0.27, y + 0.13], [z - 0.3, y + 0.1], [z - 0.3, y - 0.1]];
        m.scope("head", () => m.sweep("underframe", "x", shape, h0, shape, h1));
      });
  });
  m.scope("coupling", () => {
    const [a, b] = along(beam - 0.01, face - 0.2);
    block(m, "underframe", a, b, y - 0.06, y + 0.06, -0.08, 0.08);
    const [c0, c1] = along(face - 0.2, face - 0.12);
    block(m, "underframe", c0, c1, y - 0.12, y + 0.08, -0.06, 0.06);
    // the screw coupling's link hanging from the hook
    const [l0, l1] = along(face - 0.16, face - 0.1);
    for (const z of [-0.09, 0.09]) block(m, "steel", l0, l1, y - 0.42, y - 0.06, z - 0.015, z + 0.015);
    const [r0, r1] = along(face - 0.2, face - 0.06);
    block(m, "steel", r0, r1, y - 0.45, y - 0.41, -0.1, 0.1);
  });
}

// ---------------------------------------------------------------------------
// Pantographs

/** A post insulator: a core with sheds, from y0 to y1. */
export function insulator(m: MeshBuilder, x: number, z: number, y0: number, y1: number): void {
  m.prism("insulator", ngon(8, 0.045, 0, x, z), y0, y1 - 0.02);
  const span = y1 - y0;
  for (const f of [0.3, 0.65]) m.prism("insulator", ngon(8, 0.075, Math.PI / 8, x, z), y0 + span * f - 0.015, y0 + span * f + 0.015);
  m.prism("steel", ngon(8, 0.05, 0, x, z), y1 - 0.02, y1);
}

export interface SingleArmSpec {
  /** The base frame's centre along x. */
  xc: number;
  /** The roof the insulators stand on. */
  roofY: number;
  /** The base frame's top. */
  baseY: number;
  /** +1: the hinge stands toward +x of the centre and the knee points to -x. */
  h: number;
  raised: boolean;
  /** The collector strips' top when raised (the game's contact wire unless given). */
  raisedTop?: number;
  lower?: number;
  upper?: number;
}
/**
 * The single-arm "half pantograph" (cd163.ts's, sized to fit): an A-frame lower
 * arm from the hinge to the knee and a two-arm upper arm from the knee to the
 * head, with one length for each in every pose -- the knee is found by
 * intersecting circles about the hinge and the head. A raised one is drawn as a
 * `liftable` mechanism, so the game can lower and raise it.
 */
export function singleArm(m: MeshBuilder, p: SingleArmSpec): void {
  if (p.raised) liftable(m, "pantograph", (mm, lift) => singleArmAt(mm, p, lift));
  else singleArmAt(m, p, 0);
}

/** The hinge, knee and head of a single-arm pantograph at `lift` (0 folded, 1 raised). */
function singleArmPose(p: SingleArmSpec, lift: number): { xh: number; hingeY: number; kx: number; ky: number; hx: number; headY: number } {
  const { xc, baseY: y, h } = p;
  const L1 = p.lower ?? 1.55, L2 = p.upper ?? 1.3;
  const xh = xc + h * 0.5; // the hinge, toward the h end of the base
  const hingeY = y + 0.11;
  // the collector stands where both arms lie flat when folded, in every pose
  const f1 = Math.sqrt(L1 * L1 - 0.11 * 0.11), f2 = Math.sqrt(L2 * L2 - 0.09 * 0.09);
  const hx = xh - h * f1 + h * f2;
  const headY = y + 0.33 + ((p.raisedTop ?? RAIL_COLLECTOR_TOP) - 0.07 - (y + 0.33)) * lift;
  // intersect circles about the hinge and the head; the knee points away from the hinge's end
  const dx = hx - xh, dy = headY - 0.02 - hingeY;
  const dist = Math.hypot(dx, dy);
  const along = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const across = Math.sqrt(Math.max(0, L1 * L1 - along * along));
  const cands = [1, -1].map((k) => [xh + (along * dx - k * across * dy) / dist, hingeY + (along * dy + k * across * dx) / dist] as const);
  const [kx, ky] = cands.reduce((p0, p1) => (h * (p1[0] - xh) < h * (p0[0] - xh) ? p1 : p0));
  return { xh, hingeY, kx, ky, hx, headY };
}

function singleArmAt(m: MeshBuilder, p: SingleArmSpec, lift: number): void {
  const { xc, baseY: y, h } = p;
  m.scope("insulators", () => {
    for (const dx of [-0.5, 0.5]) for (const z of [-0.45, 0.45]) insulator(m, xc + dx, z, p.roofY - 0.01, y);
  });
  m.scope("base", () => {
    for (const z of [-0.45, 0.45]) block(m, "pantograph", xc - 0.62, xc + 0.62, y, y + 0.06, z - 0.03, z + 0.03);
    for (const dx of [-0.55, 0.55]) block(m, "pantograph", xc + dx - 0.03, xc + dx + 0.03, y - 0.005, y + 0.055, -0.48, 0.48);
    const [d0, d1] = h > 0 ? [0.1, 0.42] : [-0.42, -0.1];
    block(m, "pantograph", xc + d0, xc + d1, y + 0.05, y + 0.15, -0.14, 0.14); // the drive
  });
  const { xh, hingeY, kx, ky, hx, headY } = singleArmPose(p, lift);
  m.scope("arms", () => {
    for (const s of [-1, 1]) block(m, "pantograph", xh - 0.04, xh + 0.04, y + 0.04, y + 0.14, ...side(s, 0.34, 0.42));
    const shaft = ngon(8, 0.035, 0, xh, hingeY);
    m.sweep("pantograph", "z", shaft, -0.4, shaft, 0.4);
    m.scope("lower arms", () => {
      for (const s of [-1, 1]) m.rod("pantograph", [xh, hingeY, s * 0.3], [kx, ky, s * 0.04], 0.04);
    });
    // the push rod, from the drive to the lower arm by the knee
    pushRod(m, "pantograph", 0.016, [xc + h * 0.62, y + 0.08], (l) => {
      const q = singleArmPose(p, l);
      return [q.kx + (q.xh - q.kx) * 0.07, q.ky + (q.hingeY - q.ky) * 0.07 - 0.03];
    }, lift);
    const knee = ngon(8, 0.05, 0, kx, ky + 0.005);
    m.sweep("pantograph", "z", knee, -0.08, knee, 0.08);
    m.scope("upper arms", () => {
      for (const s of [-1, 1]) m.rod("pantograph", [kx, ky + 0.02, s * 0.04], [hx, headY, s * 0.32], 0.026);
    });
  });
  collectorHead(m, hx, headY);
}

/** The collector head: two carbon strips with horns bent down at both ends, on a frame at headY. */
function collectorHead(m: MeshBuilder, hx: number, headY: number): void {
  m.scope("head", () => {
    for (const s of [-1, 1]) block(m, "pantograph", hx - 0.15, hx + 0.15, headY - 0.005, headY + 0.025, ...side(s, 0.28, 0.36));
    for (const dx of [-0.12, 0.12]) {
      const x = hx + dx;
      block(m, "carbon", x - 0.03, x + 0.03, headY + 0.02, headY + 0.07, -0.62, 0.62);
      for (const s of [-1, 1]) {
        const top: Ring = [[x - 0.03, headY + 0.02], [x + 0.03, headY + 0.02], [x + 0.03, headY + 0.07], [x - 0.03, headY + 0.07]];
        const tip: Ring = [[x - 0.02, headY - 0.07], [x + 0.02, headY - 0.07], [x + 0.02, headY - 0.03], [x - 0.02, headY - 0.03]];
        m.sweep("pantograph", "z", s > 0 ? top : tip, s > 0 ? 0.61 : -0.92, s > 0 ? tip : top, s > 0 ? 0.92 : -0.61);
      }
    }
  });
}

export interface DiamondSpec {
  xc: number;
  roofY: number;
  baseY: number;
  raised: boolean;
  /** The collector strips' top when raised (the game's contact wire unless given). */
  raisedTop?: number;
  arm?: number;
}
/**
 * The diamond (rhombic) pantograph (cd230.ts's): four lower and four upper arms of
 * one length about two knees. A raised one is drawn as a `liftable` mechanism.
 */
export function diamond(m: MeshBuilder, p: DiamondSpec): void {
  if (p.raised) liftable(m, "pantograph", (mm, lift) => diamondAt(mm, p, lift));
  else diamondAt(m, p, 0);
}

function diamondAt(m: MeshBuilder, p: DiamondSpec, lift: number): void {
  const { xc, baseY } = p;
  const ARM = p.arm ?? 1.3, A = 0.3;
  // raised: the strips' top (head + 0.05) at raisedTop; folded: 0.2 m over the base
  const hgt = 0.2 + ((p.raisedTop ?? RAIL_COLLECTOR_TOP) - 0.05 - baseY - 0.2) * lift;
  const w = A + Math.sqrt(ARM * ARM - (hgt / 2) * (hgt / 2) - 0.01);
  const top = baseY + hgt;
  m.scope("insulators", () => {
    for (const d of [-0.6, 0.6]) for (const z of [-0.42, 0.42]) insulator(m, xc + d, z, p.roofY - 0.01, baseY - 0.06);
  });
  m.scope("base", () => {
    for (const z of [-0.42, 0.42]) block(m, "pantograph", xc - 0.75, xc + 0.75, baseY - 0.06, baseY, z - 0.04, z + 0.04);
    for (const d of [-A, A]) block(m, "pantograph", xc + d - 0.03, xc + d + 0.03, baseY - 0.05, baseY + 0.01, -0.46, 0.46);
  });
  m.scope("arms", () => {
    for (const k of [-1, 1])
      for (const s of [-1, 1]) {
        m.rod("pantograph", [xc + k * A, baseY, s * 0.42], [xc + k * w, baseY + hgt / 2, s * 0.32], 0.03);
        m.rod("pantograph", [xc + k * w, baseY + hgt / 2, s * 0.32], [xc + k * A, top, s * 0.22], 0.025);
      }
  });
  m.scope("head", () => {
    for (const d of [-0.12, 0.12]) {
      block(m, "carbon", xc + d - 0.03, xc + d + 0.03, top, top + 0.05, -0.65, 0.65);
      for (const s of [-1, 1]) {
        const a = ngon(8, 0.02, 0, xc + d, top + 0.02), b = ngon(8, 0.02, 0, xc + d, top - 0.08);
        m.sweep("pantograph", "z", a, s * 0.65, b, s * 0.9);
      }
    }
    block(m, "pantograph", xc - A, xc + A, top - 0.04, top, -0.25, 0.25);
  });
}

/** Number of distinct heights where a lerp table changes slope: what panels must split at. */
export const kinks = (...tables: ReadonlyArray<ReadonlyArray<readonly [number, number]>>): number[] =>
  [...new Set(tables.flatMap((t) => t.map(([y]) => y)))].sort((a, b) => a - b);
