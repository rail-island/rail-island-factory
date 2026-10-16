// Shared parts of the Czech mainline diesel locomotives (dieselLocos.ts): a
// carbody lofted in plan from height profiles (the vlakosimdb `alongz`
// elevation gives each end's tip, the `alongx` section the half width, the
// `alongy` plan the end's corners), panels laid on its sloped and pointed ends,
// flat panels and decals on its sides, Bo'Bo' and Co'Co' bogies, buffers,
// couplings, ploughs, fuel tanks and roof fittings.
//
// Frame: metres, +X forward, +Y up, +Z right, rail top at y = 0, centred on z = 0.
// A source x (the JT7 models' x along the body from 0) maps to the Factory by
// X = x - centre, so a native side BMP column c sits at x = c / 10 - centre.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { bandAt, coil, lettering, letteringWidth, type Band } from "./cd163.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

export type { Band };
export { block, side, plate, coil, lettering, letteringWidth };

const c = (color: string, roughness = 0.5, metallic = 0.1): MaterialSpec => ({ color, metallic, roughness });

/** Materials every diesel shares; a livery adds its paints. */
export const DIESEL_PALETTE: Record<string, MaterialSpec> = {
  roof: c("#6f7273", 0.75),
  underframe: c("#26282a", 0.85),
  bogie: c("#33363a", 0.8),
  spring: c("#55585c", 0.6, 0.2),
  steel: c("#8c9198", 0.45, 0.3),
  wheel: c("#46484b", 0.6, 0.2),
  glass: c("#26323f", 0.15, 0.2),
  rubber: c("#1c1c1e", 0.95, 0),
  lampHead: c("#f3f5f6", 0.2, 0),
  lampRed: c("#c8202c", 0.3, 0),
  plate: c("#b3241f", 0.5),
  white: c("#f2f2ee", 0.5),
  black: c("#1f2022", 0.7),
  louvre: c("#2e3134", 0.8),
  grille: c("#4a4e52", 0.7, 0.2),
  exhaust: c("#2b2b2b", 0.9),
  horn: c("#9aa0a6", 0.4, 0.3),
  tank: c("#2f3133", 0.8),
  hazard: c("#e8b818", 0.5),
  handrail: c("#c9ccce", 0.5, 0.2),
  hose: c("#a01c1c", 0.6),
};

/** Paint materials, fully specified: c(color). */
export const paint = (color: string, roughness = 0.5): MaterialSpec => c(color, roughness);

export function lerpTable(table: ReadonlyArray<readonly [number, number]>, y: number): number {
  if (y <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < table.length; i++) {
    const [y0, v0] = table[i - 1]!;
    const [y1, v1] = table[i]!;
    if (y <= y1 + 1e-12) return y1 - y0 < 1e-12 ? v1 : v0 + ((v1 - v0) * (y - y0)) / (y1 - y0);
  }
  return table[table.length - 1]![1];
}

export const rect = (x0: number, y0: number, x1: number, y1: number): Ring => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** A prism of the section `q` along `axis` across a0..a1. */
export function extrude(m: MeshBuilder, mat: string, axis: "x" | "z", q: Ring, [a0, a1]: [number, number]): void {
  m.sweep(mat, axis, q, a0, q, a1);
}

// ---------------------------------------------------------------------------
// The carbody, lofted in plan

/**
 * A carbody with two alike ends. At every height y its plan is a ring: the +X
 * end from the centre line out to the side (`end(y)`: points [setback behind
 * the tip, z], z rising to the half width, a fixed count), the straight sides,
 * the -X end mirrored. `tip(y)` is the end's foremost x, `half(y)` the half width.
 */
export interface PlanBody {
  tip: (y: number) => number;
  half: (y: number) => number;
  end: (y: number) => Array<[number, number]>;
  /** Heights where the profiles change slope (the loft's rings), ascending, bottom and top included. */
  heights: readonly number[];
  /** Paint by height: the ends (their corners included), the sides, and optionally the cab sections of the sides. */
  face: readonly Band[];
  side: readonly Band[];
  cab?: readonly Band[];
  /** The cab sections run from +-cabX to the ends. */
  cabX?: number;
  /** The material of the flat top. */
  top: string;
}

interface RingPoint {
  x: number;
  z: number;
  region: "front" | "rear" | "cab" | "side";
  sign: number;
}

function bodyRing(b: PlanBody, y: number): RingPoint[] {
  const tip = b.tip(y);
  const end = b.end(y);
  const hw = b.half(y);
  const corner = tip - end[end.length - 1]![0];
  const cab = b.cabX !== undefined ? Math.min(b.cabX, corner - 0.02) : undefined;
  const out: RingPoint[] = [];
  const push = (x: number, z: number, region: RingPoint["region"], sign: number) => out.push({ x, z, region, sign });
  const last = end.length - 1;
  // +X end, centre to -z side
  for (let i = 0; i < last; i++) push(tip - end[i]![0], -end[i]![1], "front", 1);
  push(corner, -hw, cab !== undefined ? "cab" : "side", -1);
  if (cab !== undefined) {
    push(cab, -hw, "side", -1);
    push(-cab, -hw, "cab", -1);
  }
  for (let i = last; i > 0; i--) push(-(tip - end[i]![0]), -end[i]![1], "rear", -1);
  for (let i = 0; i < last; i++) push(-(tip - end[i]![0]), end[i]![1], "rear", -1);
  push(-corner, hw, cab !== undefined ? "cab" : "side", 1);
  if (cab !== undefined) {
    push(-cab, hw, "side", 1);
    push(cab, hw, "cab", 1);
  }
  for (let i = last; i > 0; i--) push(tip - end[i]![0], end[i]![1], "front", 1);
  return out;
}

/** The heights the body is cut at: its profile stations and every band edge. */
export function bodyHeights(b: PlanBody): number[] {
  const lo = b.heights[0]!, hi = b.heights[b.heights.length - 1]!;
  const hs = new Set<number>(b.heights);
  for (const bands of [b.face, b.side, b.cab ?? []]) for (const [y0, y1] of bands) for (const h of [y0, y1]) if (h > lo + 1e-9 && h < hi - 1e-9) hs.add(h);
  return [...hs].sort((p, q) => p - q);
}

/**
 * Draws the body: one leaf per region and band (`front/band-<i>`, `side right/band-<i>`...),
 * every triangle turned outward, and the flat top.
 */
export function planBody(m: MeshBuilder, b: PlanBody): void {
  const heights = bodyHeights(b);
  const groups = new Map<string, { mat: string; normal: Vec3; pts: Vec3[] }>();
  for (let i = 1; i < heights.length; i++) {
    const [y0, y1] = [heights[i - 1]!, heights[i]!];
    const lo = bodyRing(b, y0), hi = bodyRing(b, y1);
    const ym = (y0 + y1) / 2;
    for (let j = 0; j < lo.length; j++) {
      const k = (j + 1) % lo.length;
      const { region, sign } = lo[j]!;
      const bands = region === "side" ? b.side : region === "cab" ? b.cab! : b.face;
      const band = bandAt(bands, ym);
      const where = region === "front" || region === "rear" ? region : `${region} ${sign > 0 ? "right" : "left"}`;
      const key = `${where}|${bands.indexOf(band)}`;
      const normal: Vec3 = region === "front" ? [1, 0, 0] : region === "rear" ? [-1, 0, 0] : [0, 0, sign];
      if (!groups.has(key)) groups.set(key, { mat: band[2], normal, pts: [] });
      const a: Vec3 = [lo[j]!.x, y0, lo[j]!.z], bb: Vec3 = [lo[k]!.x, y0, lo[k]!.z];
      const cc: Vec3 = [hi[k]!.x, y1, hi[k]!.z], d: Vec3 = [hi[j]!.x, y1, hi[j]!.z];
      groups.get(key)!.pts.push(a, bb, cc, a, cc, d);
    }
  }
  const keys = [...groups.keys()];
  const order = ["front", "rear", "side right", "side left", "cab right", "cab left"];
  for (const where of order) {
    const mine = keys.filter((k) => k.split("|")[0] === where).sort((p, q) => Number(p.split("|")[1]) - Number(q.split("|")[1]));
    if (!mine.length) continue;
    m.scope(where, () => {
      for (const key of mine) {
        const g = groups.get(key)!;
        m.scope(`band ${key.split("|")[1]}`, () => m.facets(g.mat, g.pts, g.normal));
      }
    });
  }
  const top = heights[heights.length - 1]!;
  const ring = bodyRing(b, top);
  const pts: Vec3[] = [];
  for (let i = 1; i + 1 < ring.length; i++) pts.push([ring[0]!.x, top, ring[0]!.z], [ring[i]!.x, top, ring[i]!.z], [ring[i + 1]!.x, top, ring[i + 1]!.z]);
  m.scope("top", () => m.facets(b.top, pts, [0, 1, 0]));
}

/** The x of the +X end's skin at (z, y), and its outward normal. */
export function endSurface(b: PlanBody, z: number, y: number): { x: number; n: Vec3 } {
  const xAt = (zz: number, yy: number): number => {
    const tip = b.tip(yy);
    const end = b.end(yy);
    const hw = b.half(yy);
    const az = Math.min(Math.abs(zz), hw);
    for (let i = 1; i < end.length; i++) {
      const [s0, z0] = end[i - 1]!;
      const [s1, z1] = end[i]!;
      if (az <= z1 + 1e-9) return tip - (z1 - z0 < 1e-9 ? s1 : s0 + ((s1 - s0) * (az - z0)) / (z1 - z0));
    }
    return tip - end[end.length - 1]![0];
  };
  const h = 1e-3;
  const x = xAt(z, y);
  const dz = (xAt(z + h, y) - xAt(z - h, y)) / (2 * h);
  const dy = (xAt(z, y + h) - xAt(z, y - h)) / (2 * h);
  const l = Math.hypot(1, dz, dy);
  return { x, n: [1 / l, -dy / l, -dz / l] };
}

type ZY = [number, number];
/** The y span of a convex (u, y) outline at u. */
function spanAt(poly: ZY[], u: number): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [a, b] = [poly[i]!, poly[(i + 1) % poly.length]!];
    if (Math.abs(a[0] - u) < 1e-9) [lo, hi] = [Math.min(lo, a[1]), Math.max(hi, a[1])];
    if ((a[0] - u) * (b[0] - u) >= 0 || a[0] === b[0]) continue;
    const y = a[1] + ((u - a[0]) * (b[1] - a[1])) / (b[0] - a[0]);
    [lo, hi] = [Math.min(lo, y), Math.max(hi, y)];
  }
  return [lo, hi];
}

/**
 * A panel laid on end `e` (+1 front) of the body: the convex outline in (u, y)
 * -- u = the viewer's left-to-right across the face, so z = -e * u -- from `d0`
 * (sunk into the skin) out to `d1`. Its face is cut into columns at the plan's
 * corners and rows at the profile's heights so it follows a pointed, raked end.
 */
export function endPanel(m: MeshBuilder, b: PlanBody, mat: string, e: number, poly: ZY[], d0: number, d1: number): void {
  const at = (u: number, y: number, d: number): Vec3 => {
    const z = -e * u;
    const s = endSurface(b, z, y);
    const p: Vec3 = [s.x + d * s.n[0], y + d * s.n[1], z + d * s.n[2]];
    return [e * p[0], p[1], p[2]];
  };
  const u0 = Math.min(...poly.map((p) => p[0])), u1 = Math.max(...poly.map((p) => p[0]));
  const cols = new Set<number>(poly.map((p) => p[0]));
  const ys = (poly.map((p) => p[1]));
  const yMid = (Math.min(...ys) + Math.max(...ys)) / 2;
  for (const [, z] of b.end(yMid)) for (const u of [z, -z]) if (u > u0 + 1e-4 && u < u1 - 1e-4) cols.add(u);
  const k = Math.ceil((u1 - u0) / 0.25);
  for (let i = 1; i < k; i++) cols.add(u0 + ((u1 - u0) * i) / k);
  const us = [...cols].sort((p, q) => p - q).filter((u, i, a) => i === 0 || u - a[i - 1]! > 1e-4);
  const spans = us.map((u) => spanAt(poly, u));
  const front: Vec3[] = [], up: Vec3[] = [], down: Vec3[] = [];
  const quad = (out: Vec3[], a: Vec3, bb: Vec3, cc: Vec3, d: Vec3) => out.push(a, bb, cc, a, cc, d);
  for (let i = 1; i < us.length; i++) {
    const [a, bb] = [us[i - 1]!, us[i]!];
    const [[la, ha], [lb, hb]] = [spans[i - 1]!, spans[i]!];
    const cuts = b.heights.filter((h) => h > Math.max(la, lb) + 1e-4 && h < Math.min(ha, hb) - 1e-4);
    const rows: Array<[number, number]> = [[la, lb], ...cuts.map((h): [number, number] => [h, h]), [ha, hb]];
    for (let r = 1; r < rows.length; r++) {
      const [[ya0, yb0], [ya1, yb1]] = [rows[r - 1]!, rows[r]!];
      quad(front, at(a, ya0, d1), at(bb, yb0, d1), at(bb, yb1, d1), at(a, ya1, d1));
    }
    quad(down, at(a, la, d0), at(bb, lb, d0), at(bb, lb, d1), at(a, la, d1));
    quad(up, at(a, ha, d0), at(bb, hb, d0), at(bb, hb, d1), at(a, ha, d1));
  }
  m.facets(mat, front, [e, 0, 0]);
  m.facets(mat, up, [0, 1, 0]);
  m.facets(mat, down, [0, -1, 0]);
  for (const [i, dir] of [[0, -1], [us.length - 1, 1]] as const) {
    const [lo, hi] = spans[i]!;
    if (hi - lo < 1e-4) continue;
    const u = us[i]!;
    const wall: Vec3[] = [];
    quad(wall, at(u, lo, d0), at(u, hi, d0), at(u, hi, d1), at(u, lo, d1));
    m.facets(mat, wall, [0, 0, -e * dir]);
  }
}

/** Lettering (digits) on end e at centre u = 0, baseline y, standing d off the skin. */
export function endNumber(m: MeshBuilder, b: PlanBody, e: number, text: string, uc: number, y: number, h: number, w: number, gap: number, d: number, mat = "white"): void {
  const width = letteringWidth(text, w, gap);
  const tris = lettering(text, uc - width / 2, y, h, w, gap, false);
  const pts = tris.map(([u, v]): Vec3 => {
    const z = -e * u;
    const s = endSurface(b, z, v);
    return [e * (s.x + d * s.n[0]), v + d * s.n[1], z + d * s.n[2]];
  });
  m.facets(mat, pts, [e, 0, 0]);
}

/** A rounded rectangle in (u, y), convex, counter-clockwise. */
export function roundRect(u0: number, u1: number, y0: number, y1: number, r: number, n = 2): ZY[] {
  const rr = Math.min(r, (u1 - u0) / 2, (y1 - y0) / 2);
  if (rr <= 1e-6) return [[u0, y0], [u1, y0], [u1, y1], [u0, y1]];
  const out: ZY[] = [];
  const corner = (cu: number, cy: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (Math.PI / 2) * (i / n);
      out.push([cu + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  };
  corner(u1 - rr, y0 + rr, -Math.PI / 2);
  corner(u1 - rr, y1 - rr, 0);
  corner(u0 + rr, y1 - rr, Math.PI / 2);
  corner(u0 + rr, y0 + rr, Math.PI);
  return out;
}

// ---------------------------------------------------------------------------
// The sides: flat panels and decals on a wall whose half width is half(y)

/** Splits an (x, y) outline at the heights where the side wall changes its lean. */
export function splitAt(q: Ring, breaks: readonly number[]): Ring[] {
  let rings: Ring[] = [q];
  for (const h of breaks)
    rings = rings.flatMap((r) => {
      const ys = r.map((p) => p[1]);
      if (Math.min(...ys) >= h - 1e-9 || Math.max(...ys) <= h + 1e-9) return [r];
      const clip = (above: boolean): Ring => {
        const out: Ring = [];
        for (let i = 0; i < r.length; i++) {
          const [a, b] = [r[i]!, r[(i + 1) % r.length]!];
          const inside = (p: readonly number[]) => (above ? p[1]! >= h : p[1]! <= h);
          if (inside(a)) out.push(a);
          if (inside(a) !== inside(b)) {
            const t = (h - a[1]) / (b[1] - a[1]);
            out.push([a[0] + t * (b[0] - a[0]), h]);
          }
        }
        return out;
      };
      return [clip(false), clip(true)];
    });
  return rings;
}

/** A side wall: half(y) and the heights where it changes its lean. */
export interface Wall {
  half: (y: number) => number;
  breaks: readonly number[];
}

/** A flat panel on side s: the (x, y) outline from d - depth to d off the wall. */
export function sidePanel(m: MeshBuilder, w: Wall, mat: string, s: number, q: Ring, d: number, depth = 0.03): void {
  for (const ring of splitAt(q, w.breaks)) m.slab(mat, ring.map(([x, y]): Vec3 => [x, y, s * (w.half(y) + d)]), [0, 0, -s * depth]);
}

/** One-sided outlines painted d off side s's wall (stripes, seams): two triangles a quad. */
export function sideDecal(m: MeshBuilder, w: Wall, mat: string, s: number, qs: Ring[], d: number): void {
  const pts: Vec3[] = [];
  for (const q of qs)
    for (const ring of splitAt(q, w.breaks)) {
      const p = ring.map(([x, y]): Vec3 => [x, y, s * (w.half(y) + d)]);
      for (let i = 1; i + 1 < p.length; i++) pts.push(p[0]!, p[i]!, p[i + 1]!);
    }
  m.facets(mat, pts, [0, 0, s]);
}

/** A louvred grille on side s: a frame, a dark recess and `n` horizontal slats. */
export function sideGrille(m: MeshBuilder, w: Wall, s: number, x0: number, x1: number, y0: number, y1: number, frame: string, slats: number, vertical = false): void {
  m.scope("frame", () => sidePanel(m, w, frame, s, rect(x0, y0, x1, y1), 0.012, 0.03));
  m.scope("recess", () => sidePanel(m, w, "louvre", s, rect(x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04), 0.018, 0.012));
  if (slats > 0)
    m.scope("slats", () => {
      const qs: Ring[] = [];
      for (let i = 0; i < slats; i++) {
        if (vertical) {
          const x = x0 + 0.04 + ((x1 - x0 - 0.08) * (i + 0.5)) / slats;
          qs.push(rect(x - 0.025, y0 + 0.05, x + 0.025, y1 - 0.05));
        } else {
          const y = y0 + 0.04 + ((y1 - y0 - 0.08) * (i + 0.5)) / slats;
          qs.push(rect(x0 + 0.05, y - 0.018, x1 - 0.05, y + 0.018));
        }
      }
      sideDecal(m, w, "grille", s, qs, 0.024);
    });
}

/** A framed window on side s: rubber frame and glass. */
export function sideWindow(m: MeshBuilder, w: Wall, s: number, x0: number, x1: number, y0: number, y1: number, frame = "rubber", r = 0.06): void {
  const ring = (inset: number): Ring => roundRect(x0 + inset, x1 - inset, y0 + inset, y1 - inset, Math.max(0, r - inset));
  m.scope("frame", () => sidePanel(m, w, frame, s, ring(0), 0.012, 0.03));
  m.scope("glass", () => sidePanel(m, w, "glass", s, ring(0.035), 0.018, 0.012));
}

/** A number plate on side s centred at xc, its lower edge at y. */
export function sidePlate(m: MeshBuilder, w: Wall, s: number, text: string, xc: number, y: number, plateMat = "plate", textMat = "white"): void {
  const ww = strokeWidth(text, 0.05, 0.014) + 0.08;
  sidePanel(m, w, plateMat, s, rect(xc - ww / 2, y, xc + ww / 2, y + 0.16), 0.018, 0.02);
  const tw = strokeWidth(text, 0.05, 0.014);
  m.facets(textMat, strokeText(text, s < 0 ? xc + tw / 2 : xc - tw / 2, y + 0.03, 0.1, 0.05, 0.014, s < 0).map(([x, yy]): Vec3 => [x, yy, s * (w.half(yy) + 0.022)]), [0, 0, s]);
}

/** A vertical handrail on side s at x, from y0 to y1, standing off the wall. */
export function sideHandrail(m: MeshBuilder, w: Wall, s: number, x: number, y0: number, y1: number, mat = "handrail"): void {
  const z = (y: number) => s * (w.half(y) + 0.035);
  m.loft(mat, ngon(6, 0.012, 0, x, z(y0)), y0, ngon(6, 0.012, 0, x, z(y1)), y1);
  for (const y of [y0 + 0.03, y1 - 0.03]) block(m, mat, x - 0.012, x + 0.012, y - 0.012, y + 0.012, ...side(s, w.half(y) - 0.005, w.half(y) + 0.035));
}

// ---------------------------------------------------------------------------
// Running gear

export interface BogieSpec {
  /** Axle offsets from the bogie centre. */
  axles: readonly number[];
  wheelR: number;
  /** Half the frame's length. */
  frameHalf: number;
  /** The side frame's top and its lowest edge between the axles. */
  frameTop: number;
  frameBottom: number;
  /** The side frames' inner and outer z. */
  frameZ: [number, number];
  /** Springs over the axle boxes: coils or leaf springs. */
  primary: "coil" | "leaf";
  /** Secondary suspension coil positions (dx) beside the pivot, at |z| = secondaryZ. */
  secondary: readonly number[];
  secondaryZ: number;
  /** The height the body's frame rests at (secondary springs' top). */
  bolster: number;
}

/** A bogie centred at xc: wheelsets, axle boxes, a cast side frame with pedestals, springs, brake cylinders. */
export function bogie(m: MeshBuilder, xc: number, b: BogieSpec): void {
  m.bogie(() => bogieGeometry(m, xc, b));
}

function bogieGeometry(m: MeshBuilder, xc: number, b: BogieSpec): void {
  const N = 20;
  const ay = b.wheelR * Math.cos(Math.PI / N);
  const [fz0, fz1] = b.frameZ;
  for (const dx of b.axles)
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -0.9, axle, 0.9);
      for (const s of [-1, 1]) {
        const tread = ngon(N, b.wheelR, Math.PI / N, x, ay);
        extrude(m, "steel", "z", tread, side(s, 0.665, 0.8));
        const disc = ngon(16, b.wheelR * 0.82, 0, x, ay);
        extrude(m, "wheel", "z", disc, side(s, 0.8, 0.82));
        m.scope("axle box", () => extrude(m, "bogie", "z", ngon(8, 0.14, Math.PI / 8, x, ay), side(s, 0.82, fz1 + 0.04)));
        m.scope("box cover", () => extrude(m, "spring", "z", ngon(8, 0.09, Math.PI / 8, x, ay), side(s, fz1 + 0.04, fz1 + 0.07)));
      }
    });
  // the side frame: a plate along x whose lower edge dips into pedestals around each axle
  const xs: number[] = [-b.frameHalf];
  const bottom: number[] = [b.frameBottom + 0.1];
  const sorted = [...b.axles].sort((p, q) => p - q);
  for (const a of sorted) {
    for (const [dx, y] of [[-0.42, b.frameBottom], [-0.3, ay + 0.12], [0.3, ay + 0.12], [0.42, b.frameBottom]] as const) {
      xs.push(a + dx);
      bottom.push(y);
    }
  }
  xs.push(b.frameHalf);
  bottom.push(b.frameBottom + 0.1);
  const top = xs.map((x): [number, number] => {
    const end = Math.abs(x) > b.frameHalf - 0.25;
    return [xc + x, end ? b.frameTop - 0.08 : b.frameTop];
  });
  const bot = xs.map((x, i): [number, number] => [xc + x, Math.min(bottom[i]!, top[i]![1] - 0.08)]);
  m.scope("frame", () => {
    for (const s of [-1, 1]) plate(m, "bogie", top, bot, ...side(s, fz0, fz1));
    // transoms between the side frames
    for (const x of [xc - 0.35, xc + 0.35]) block(m, "bogie", x - 0.09, x + 0.09, b.frameTop - 0.24, b.frameTop - 0.04, -fz0, fz0);
    for (const x of [xc - b.frameHalf + 0.06, xc + b.frameHalf - 0.06]) block(m, "bogie", x - 0.05, x + 0.05, b.frameTop - 0.2, b.frameTop - 0.06, -fz0, fz0);
  });
  m.scope("primary suspension", () => {
    for (const dx of b.axles)
      for (const s of [-1, 1]) {
        const x = xc + dx;
        const zc = s * ((fz0 + fz1) / 2);
        if (b.primary === "coil") {
          for (const d of [-0.24, 0.24]) coil(m, "spring", x + d, zc, ay + 0.02, b.frameTop - 0.12, 0.075, 2, 6);
        } else {
          // a leaf spring over the axle box, hung from the frame
          const leaf: Ring = [[x - 0.45, ay + 0.3], [x + 0.45, ay + 0.3], [x + 0.3, ay + 0.2], [x - 0.3, ay + 0.2]];
          extrude(m, "spring", "z", leaf, side(s, fz1 + 0.01, fz1 + 0.09));
        }
      }
  });
  m.scope("secondary suspension", () => {
    for (const s of [-1, 1]) for (const d of b.secondary) coil(m, "spring", xc + d, s * b.secondaryZ, b.frameTop - 0.15, b.bolster, 0.11, 3, 6);
  });
  m.scope("brake cylinders", () => {
    for (const s of [-1, 1])
      for (const dx of [sorted[0]! + 0.55, sorted[sorted.length - 1]! - 0.55]) {
        const cyl = ngon(8, 0.08, Math.PI / 8, xc + dx, b.frameTop - 0.06);
        extrude(m, "spring", "z", cyl, side(s, fz0 - 0.18, fz0));
      }
  });
  m.scope("traction motors", () => {
    for (const dx of b.axles) {
      // nose-suspended, beside its axle toward the bogie's middle (the middle axle's toward +x)
      const motor = ngon(10, 0.26, 0, xc + dx + (dx > 0.1 ? -0.5 : 0.5), ay + 0.05);
      m.sweep("bogie", "z", motor, -0.5, motor, 0.5);
    }
  });
}

// ---------------------------------------------------------------------------
// The ends: buffer beam fittings

/** Buffers on end e: barrels from the beam face at xBeam out to xHead, heads `head` (round or rectangular). */
export function buffers(m: MeshBuilder, e: number, xBeam: number, xHead: number, y: number, head: "round" | "rect", spacing = 1.75): void {
  for (const z of [-spacing / 2, spacing / 2])
    m.scope(z * e < 0 ? "left buffer" : "right buffer", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      const [a0, a1] = along(xBeam, xBeam + 0.14);
      const base = ngon(8, 0.16, Math.PI / 8, z, y);
      m.sweep("underframe", "x", base, a0, base, a1);
      const [b0, b1] = along(xBeam + 0.14, xHead - 0.05);
      const barrel = ngon(10, 0.1, 0, z, y);
      m.sweep("steel", "x", barrel, b0, barrel, b1);
      const [h0, h1] = along(xHead - 0.05, xHead);
      const shape: Ring = head === "round" ? ngon(14, 0.2, 0, z, y) : [[z - 0.26, y - 0.14], [z + 0.26, y - 0.14], [z + 0.3, y - 0.1], [z + 0.3, y + 0.1], [z + 0.26, y + 0.14], [z - 0.26, y + 0.14], [z - 0.3, y + 0.1], [z - 0.3, y - 0.1]];
      m.scope("head", () => m.sweep("steel", "x", shape, h0, shape, h1));
    });
}

/** The screw coupling's hook and the draw gear box, plus brake hoses, on end e. */
export function coupling(m: MeshBuilder, e: number, xBeam: number, y: number, reach = 0.44): void {
  const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
  m.scope("coupling", () => {
    block(m, "underframe", ...along(xBeam, xBeam + reach * 0.57), y - 0.08, y + 0.08, -0.12, 0.12);
    block(m, "steel", ...along(xBeam + reach * 0.57, xBeam + reach * 0.95), y - 0.04, y + 0.04, -0.04, 0.04);
    block(m, "steel", ...along(xBeam + reach * 0.82, xBeam + reach), y - 0.12, y + 0.04, -0.04, 0.04);
  });
  m.scope("hoses", () => {
    for (const z of [-0.45, 0.45]) {
      const x0 = e * (xBeam + 0.02), x1 = e * (xBeam + 0.12);
      m.loft("hose", ngon(6, 0.025, 0, x0, z), y - 0.4, ngon(6, 0.025, 0, x1, z), y - 0.05);
    }
  });
}

/** A plough under end e: its face at xFace, from the rail-top clearance y0 up to y1, half widths at foot and top. */
export function plough(m: MeshBuilder, e: number, mat: string, xFace: number, depth: number, y0: number, y1: number, hwFoot: number, hwTop: number, lean = 0.15): void {
  const ring = (x: number, hw: number): Ring => (e > 0 ? [[x, -hw], [x - depth, -hw], [x - depth, hw], [x, hw]] : [[-x + depth, -hw], [-x, -hw], [-x, hw], [-x + depth, hw]]);
  m.scope("plough", () => {
    m.loft(mat, ring(xFace - lean, hwFoot), y0, ring(xFace, hwTop), y1, false);
    m.cap(mat, ring(xFace - lean, hwFoot), y0, false);
  });
}

/** A horizontal cylinder along x from x0 to x1 at (z, y), capped: a fuel or air tank. */
export function tankX(m: MeshBuilder, mat: string, x0: number, x1: number, z: number, y: number, r: number, n = 12): void {
  const q = ngon(n, r, Math.PI / n, z, y);
  m.sweep(mat, "x", q, x0, q, x1);
}

/** A round lamp on end e: housing and lens, centre (u, y), on the body skin. */
export function endLamp(m: MeshBuilder, b: PlanBody, e: number, u: number, y: number, r: number, lens: string, rim = "black"): void {
  const ring = (rr: number): ZY[] => ngon(12, rr, 0, u, y).map(([a, bb]) => [a, bb] as ZY);
  m.scope("rim", () => endPanel(m, b, rim, e, ring(r), -0.02, 0.03));
  m.scope("lens", () => endPanel(m, b, lens, e, ring(r * 0.72), -0.01, 0.045));
}

/**
 * The windscreen on end e: an optional painted surround (u0, u1, y0, y1 in the
 * face's centred u), then each pane's rubber and glass, laid on the skin.
 */
export function endWindscreen(
  m: MeshBuilder, b: PlanBody, e: number,
  surround: { mat: string; u0: number; u1: number; y0: number; y1: number; r: number } | null,
  panes: ReadonlyArray<readonly [name: string, u0: number, u1: number, y0: number, y1: number]>, r: number,
): void {
  m.scope("windscreen", () => {
    if (surround) m.scope("surround", () => endPanel(m, b, surround.mat, e, roundRect(surround.u0, surround.u1, surround.y0, surround.y1, surround.r), -0.02, 0.02));
    for (const [name, a, bb, y0, y1] of panes)
      m.scope(name, () => {
        m.scope("rubber", () => endPanel(m, b, "rubber", e, roundRect(a, bb, y0, y1, r), -0.01, 0.028));
        m.scope("glass", () => endPanel(m, b, "glass", e, roundRect(a + 0.03, bb - 0.03, y0 + 0.03, y1 - 0.03, Math.max(0.02, r - 0.02)), -0.005, 0.034));
      });
  });
}

/** x0..x1 measured outward from the centre at end e, low first. */
export const along = (e: number, a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);

/** A round lamp standing on a flat vertical face at |x| = face on end e: rim and lens about (z, y). */
export function faceLamp(m: MeshBuilder, e: number, face: number, z: number, y: number, r: number, lens: string, n = 10): void {
  const rim = ngon(n, r + 0.03, 0, z, y), glass = ngon(n, r, 0, z, y);
  m.scope("rim", () => extrude(m, "black", "x", rim, along(e, face - 0.01, face + 0.04)));
  m.scope("lens", () => extrude(m, lens, "x", glass, along(e, face + 0.04, face + 0.06)));
}

/** A number plate on a flat vertical face at |x| = face on end e: plate centred at (0, yc), the running number on it. */
export function facePlate(m: MeshBuilder, e: number, face: number, text: string, yc: number, plateMat = "plate", textMat = "white"): void {
  const w = strokeWidth(text, 0.055, 0.016);
  block(m, plateMat, ...along(e, face - 0.03, face + 0.01), yc - 0.1, yc + 0.1, -(w / 2 + 0.06), w / 2 + 0.06);
  const pts = strokeText(text, -w / 2, yc - 0.065, 0.13, 0.055, 0.016, false).map(([u, v]): Vec3 => [e * (face + 0.012), v, -e * u]);
  m.facets(textMat, pts, [e, 0, 0]);
}

/** An exhaust stack: a short rectangular or round chimney on the roof at (x, z). */
export function exhaust(m: MeshBuilder, x: number, z: number, y0: number, y1: number, w: number, d: number): void {
  m.emit("smoke", [x, y1, z], Math.min(w, d) / 2);
  m.scope("exhaust", () => {
    block(m, "exhaust", x - w / 2, x + w / 2, y0, y1, z - d / 2, z + d / 2);
  });
}

/** A horn: a small trumpet along x on a bracket, pointing toward end e. */
export function horn(m: MeshBuilder, e: number, x: number, z: number, y: number): void {
  m.scope("horn", () => {
    m.sweep("horn", "x", ngon(8, 0.025, 0, z, y), x - e * 0.15, ngon(8, 0.06, 0, z, y), x + e * 0.12);
    block(m, "horn", x - 0.03, x + 0.03, y - 0.12, y - 0.02, z - 0.02, z + 0.02);
  });
}

/** A round roof fan: a low ring with a grille on top, at (x, z) on a roof at y. */
export function roofFan(m: MeshBuilder, x: number, z: number, y: number, r: number): void {
  m.scope("fan", () => {
    m.prism("grille", ngon(16, r, 0, x, z), y - 0.05, y + 0.06);
    m.prism("louvre", ngon(16, r * 0.82, 0, x, z), y + 0.06, y + 0.065);
  });
}
