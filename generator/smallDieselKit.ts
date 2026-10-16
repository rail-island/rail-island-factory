// Shared parts of the small and shunting diesel locomotives transferred from
// vlakosimdb in one package (docs/models/small-diesels.md): the CD 704, 710,
// 714, the 740 / 742 / 743 family, the DB V 100 / 212 and the MUV 69 track
// motor car. Built on czElectricKit.ts's lofted `shell` and `surfacePanel`.
//
// - `boxSpec`: a hood, a cab or a deck block as a ShellSpec: a straight box in
//   plan with chamfered corners whose half width and end setback follow tables
//   by height (a rolled hood top, a cab leaning in, a raked end).
// - `pane`, `grille`, `plate`: windows, louvred grilles and plates laid on a box.
// - `tubeRun`: handrails and railings as runs of axis-aligned tubes.
// - `hazardBeam`: a buffer beam with diagonal warning stripes.
// - `axleGear`: rigid wheelsets in a plate frame (the two- and three-axle
//   shunters), with optional coupling rods; the Bo'Bo' and B'B' locomotives use
//   czElectricKit's `bogie`.
// - `headlamp`: a round lamp on an end face.
//
// Nothing here is drawn by an existing design, so no existing GLB depends on it.

import { ngon, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { coil, lettering, letteringWidth, tubeX, type Band } from "./cd163.ts";
import { KIT_PALETTE, c, kinks, lerpTable, rect, roundRect, surfaceDecal, surfacePanel, sweepZ, type Place, type ShellSpec } from "./czElectricKit.ts";

export { c };

/** The materials every locomotive of the package shares; a livery adds its own colours. */
export const DIESEL_PALETTE = {
  ...KIT_PALETTE,
  hazardRed: c("#b8202a"),
  hazardWhite: c("#eeeeea"),
  hazardYellow: c("#e8c018"),
  hazardBlack: c("#1e1f21", 0.7),
  exhaust: c("#2a2b2d", 0.8),
  roofGrey: { color: "#7a7d7c", roughness: 0.75 },
};

export type Table = ReadonlyArray<readonly [number, number]>;

/** A rolled top edge: the half width hw up to y1 - r, then a quarter circle in two steps to hw - r at y1. */
export const rolled = (hw: number, y0: number, y1: number, r: number): Table => [
  [y0, hw], [y1 - r, hw], [y1 - 0.293 * r, hw - 0.293 * r], [y1, hw - r],
];

export interface BoxSpec {
  x0: number;
  x1: number;
  /** Half width by height, bottom first; the last height is the top, capped. */
  hw: Table;
  /** How far the ends stand back from x0 / x1 by height (default 0). */
  inset?: Table;
  /** The plan's corner chamfer (default 0.03 m). */
  chamfer?: number;
  side: readonly Band[];
  end: readonly Band[];
  corner?: "side" | "end";
  roof: string;
  ends?: readonly number[];
  bottom?: string;
}

/** A box body as czElectricKit's ShellSpec. */
export function boxSpec(b: BoxSpec): ShellSpec {
  const inset = b.inset ?? [[b.hw[0]![0], 0], [b.hw[b.hw.length - 1]![0], 0]];
  const half = (b.x1 - b.x0) / 2;
  const hw = (y: number) => lerpTable(b.hw, y);
  const ch = b.chamfer ?? 0.03;
  return {
    heights: kinks(b.hw, inset).filter((y) => y >= b.hw[0]![0] && y <= b.hw[b.hw.length - 1]![0]),
    xc: (b.x0 + b.x1) / 2,
    tip: (y) => half - lerpTable(inset, y),
    hw,
    endPlan: (y) => {
      const w = hw(y), k = Math.min(ch, w * 0.4);
      return [[0, 0], [w - k, 0], [w, k]];
    },
    side: b.side, end: b.end, corner: b.corner ?? "side", roof: b.roof, ends: b.ends, bottom: b.bottom,
  };
}

/** The heights where a box's surface kinks: what panels laid on it split at. */
export const breaksOf = (b: BoxSpec): number[] => kinks(b.hw, b.inset ?? []);

/** Sorted pair. */
export const span = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a]);

/** A window: a frame and its glass, the outline (u0..u1, v0..v1) on a surface, rounded by r. */
export function pane(m: MeshBuilder, at: Place, n: Vec3, u0: number, u1: number, v0: number, v1: number, breaks: readonly number[] = [], r = 0.05, frame = "rim", uBreaks: readonly number[] = []): void {
  m.scope("frame", () => surfacePanel(m, frame, at, n, roundRect(u0, u1, v0, v1, r), -0.01, 0.014, uBreaks, breaks));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(u0 + 0.05, u1 - 0.05, v0 + 0.05, v1 - 0.05, Math.max(0, r - 0.01)), -0.005, 0.022, uBreaks, breaks));
}

/** A flat plate (a number plate, a panel, a door leaf): the outline raised `d` off a surface. */
export function plate(m: MeshBuilder, mat: string, at: Place, n: Vec3, u0: number, u1: number, v0: number, v1: number, d = 0.02, breaks: readonly number[] = []): void {
  surfacePanel(m, mat, at, n, rect(u0, v0, u1, v1), -0.01, d, [], breaks);
}

/** A louvred grille: a rim, the dark louvre and slats across it every `pitch` (vertical slats, or horizontal with `across`). */
export function grille(m: MeshBuilder, slat: string, at: Place, n: Vec3, u0: number, u1: number, v0: number, v1: number, opts: { pitch?: number; across?: boolean; breaks?: readonly number[]; rim?: string } = {}): void {
  const pitch = opts.pitch ?? 0.1, br = opts.breaks ?? [];
  surfacePanel(m, opts.rim ?? "rim", at, n, rect(u0, v0, u1, v1), -0.01, 0.012, [], br);
  surfacePanel(m, "louvre", at, n, rect(u0 + 0.03, v0 + 0.03, u1 - 0.03, v1 - 0.03), -0.005, 0.016, [], br);
  const slats: Ring[] = [];
  if (opts.across) for (let v = v0 + 0.06; v < v1 - 0.06; v += pitch) slats.push(rect(u0 + 0.04, v, u1 - 0.04, v + pitch * 0.45));
  else for (let u = u0 + 0.06; u < u1 - 0.06; u += pitch) slats.push(rect(u, v0 + 0.04, u + pitch * 0.45, v1 - 0.04));
  surfaceDecal(m, slat, at, n, slats, 0.022);
}

/** A tube from a to b along whichever axis they differ in (they must share the other two). */
export function tubeSeg(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, r = 0.02, n = 6): void {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]].map(Math.abs);
  if (d[1]! >= d[0]! && d[1]! >= d[2]!) m.prism(mat, ngon(n, r, 0, a[0], a[2]), Math.min(a[1], b[1]), Math.max(a[1], b[1]));
  else if (d[2]! >= d[0]!) m.sweep(mat, "z", ngon(n, r, 0, a[0], a[1]), a[2], ngon(n, r, 0, b[0], b[1]), b[2]);
  else tubeX(m, mat, r, a[0], a[1], a[2], b[0], b[1], b[2], n);
}

/** A polyline of tubes (a handrail, a railing's top rail). */
export function tubeRun(m: MeshBuilder, mat: string, pts: readonly Vec3[], r = 0.02): void {
  for (let i = 1; i < pts.length; i++) tubeSeg(m, mat, pts[i - 1]!, pts[i]!, r);
}

/**
 * A deck railing along one side: posts at `xs` from the deck at y0 up to y1,
 * a top rail and a middle rail, at |z| = z on side s.
 */
export function railing(m: MeshBuilder, xs: readonly number[], s: number, z: number, y0: number, y1: number, mat = "steel"): void {
  const sorted = [...xs].sort((a, b) => a - b);
  for (const x of sorted) tubeSeg(m, mat, [x, y0, s * z], [x, y1, s * z], 0.022);
  for (const y of [y1, (y0 + y1) / 2]) tubeSeg(m, mat, [sorted[0]!, y, s * z], [sorted[sorted.length - 1]!, y, s * z], 0.018);
}

/** Clips a convex (u, v) polygon to u0 <= u <= u1. */
function clipU(poly: Ring, u0: number, u1: number): Ring {
  const cut = (p: Ring, k: number, keep: (u: number) => boolean): Ring => {
    const out: Ring = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i]!, b = p[(i + 1) % p.length]!;
      const ia = keep(a[0]), ib = keep(b[0]);
      if (ia) out.push(a);
      if (ia !== ib) {
        const t = (k - a[0]) / (b[0] - a[0]);
        out.push([k, a[1] + t * (b[1] - a[1])]);
      }
    }
    return out;
  };
  return cut(cut(poly, u0, (u) => u >= u0 - 1e-9), u1, (u) => u <= u1 + 1e-9);
}

/**
 * A buffer beam at end e: its face at |x| = x, from y0 to y1, |z| <= hw, `depth`
 * deep, painted in `stripes` -- diagonal bands `w` wide falling toward the
 * middle (a chevron), the first colour the beam's own.
 */
export function hazardBeam(m: MeshBuilder, e: number, x: number, y0: number, y1: number, hw: number, depth: number, stripes: readonly [string, string], w = 0.2): void {
  const [a, b] = span(e * (x - depth), e * x);
  m.scope("beam", () => block(m, stripes[0], a, b, y0, y1, -hw, hw));
  const at: Place = (u, v, d) => [e * (x + d), v, u];
  const h = y1 - y0;
  const polys: Ring[] = [];
  for (const s of [-1, 1]) {
    // stripes of the second colour every 2w, slanting down toward the middle
    for (let k = 0; k * 2 * w < hw + h; k++) {
      const u = k * 2 * w + w * 0.5;
      const q: Ring = [[u, y0], [u + w, y0], [u + w + h, y1], [u + h, y1]].map(([p, v]) => [p, v] as [number, number]);
      const cl = clipU(q, 0, hw);
      if (cl.length >= 3) polys.push(cl.map(([p, v]) => [s * p, v] as [number, number]));
    }
  }
  // fix the winding of the mirrored ones: surfaceDecal fans whatever order; facets are oriented by normal
  m.scope("stripes", () => surfaceDecal(m, stripes[1], at, [e, 0, 0], polys, 0.004));
}

/** A round lamp at end e: its rim from |x| = x out by `proud`, the lens on its face. */
export function headlamp(m: MeshBuilder, e: number, x: number, z: number, y: number, r: number, lens = "lampHead", proud = 0.08): void {
  const rim = ngon(12, r, 0, z, y), glass = ngon(12, r * 0.75, 0, z, y);
  const [a, b] = span(e * (x - 0.01), e * (x + proud));
  m.sweep("rim", "x", rim, a, rim, b);
  const [c0, c1] = span(e * (x + proud), e * (x + proud + 0.012));
  m.sweep(lens, "x", glass, c0, glass, c1);
}

export interface AxleGearSpec {
  /** The axles' x. */
  xs: readonly number[];
  wheelR: number;
  /** The frame plates' top (the deck's underside) and the frame's x span. */
  frameTop: number;
  frameX: [number, number];
  /** Coupling rods on the outside (a rod-coupled shunter): their crank radius. */
  rods?: number;
}

/**
 * Rigid wheelsets in a plate frame: wheels as czElectricKit's bogie draws them
 * (treads at |z| 0.665..0.8, discs, hubs), axle boxes with leaf springs in
 * horn guides, the frame plates down to just above the axles; optionally
 * cranks and coupling rods outside the frame.
 */
export function axleGear(m: MeshBuilder, g: AxleGearSpec): void {
  const N = 20, R = g.wheelR;
  const ay = R * Math.cos(Math.PI / N);
  for (const x of g.xs)
    m.scope("wheelset", () => {
      const axle = ngon(8, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -1.0, axle, 1.0);
      for (const s of [-1, 1]) {
        sweepZ(m, "steel", ngon(N, R, Math.PI / N, x, ay), side(s, 0.665, 0.8));
        sweepZ(m, "wheel", ngon(16, R * 0.8, 0, x, ay), side(s, 0.8, 0.82));
        sweepZ(m, "steel", ngon(8, 0.14, 0, x, ay), side(s, 0.82, 0.84));
        m.scope("axle box", () => {
          block(m, "bogie", x - 0.17, x + 0.17, ay - 0.16, ay + 0.17, ...side(s, 0.86, 1.1));
          // the leaf spring over the box, its hangers up to the frame
          const sy = Math.min(ay + 0.2, g.frameTop - 0.2);
          block(m, "spring", x - 0.45, x + 0.45, sy, sy + 0.1, ...side(s, 0.9, 1.06));
          for (const d of [-0.42, 0.42]) block(m, "spring", x + d - 0.025, x + d + 0.025, sy + 0.1, g.frameTop - 0.02, ...side(s, 0.95, 1.01));
        });
      }
    });
  m.scope("frame", () => {
    const [x0, x1] = g.frameX;
    for (const s of [-1, 1]) {
      // the plate dips between the axles and is cut away over each axle box
      const top = g.frameTop, low = Math.min(ay + 0.3, top - 0.1);
      block(m, "underframe", x0, x1, low, top, ...side(s, 1.1, 1.16));
      const xs = [...g.xs].sort((a, b) => a - b);
      const gaps: Array<[number, number]> = [[x0, xs[0]! - 0.5], ...xs.slice(1).map((x, i): [number, number] => [xs[i]! + 0.5, x - 0.5]), [xs[xs.length - 1]! + 0.5, x1]];
      for (const [a, b] of gaps) if (b - a > 0.1) block(m, "underframe", a, b, ay - 0.1, low, ...side(s, 1.1, 1.16));
      // horn guides beside each axle box
      for (const x of xs) for (const d of [-0.24, 0.2]) block(m, "underframe", x + d, x + d + 0.04, ay - 0.2, low - 0.002, ...side(s, 1.06, 1.1));
    }
  });
  if (g.rods)
    m.scope("rods", () => {
      const r = g.rods!;
      for (const s of [-1, 1]) {
        for (const x of g.xs) {
          m.scope("crank", () => sweepZ(m, "steel", ngon(10, 0.11, 0, x, ay), side(s, 1.16, 1.2)));
          sweepZ(m, "steel", ngon(8, 0.05, 0, x, ay + r), side(s, 1.2, 1.28));
        }
        const xs = [...g.xs].sort((a, b) => a - b);
        const bar: Ring = [[xs[0]! - 0.1, ay + r - 0.06], [xs[xs.length - 1]! + 0.1, ay + r - 0.06], [xs[xs.length - 1]! + 0.1, ay + r + 0.06], [xs[0]! - 0.1, ay + r + 0.06]];
        m.scope("coupling rod", () => sweepZ(m, "steel", bar, side(s, 1.21, 1.25)));
      }
    });
}

/** A single wheel's axle height (the polygon's flat at the rail). */
export const axleHeight = (r: number): number => r * Math.cos(Math.PI / 20);

/** Bogie-mounted coils for a rigid frame: two coils a side at x, between y0 and y1. */
export function springPair(m: MeshBuilder, x: number, y0: number, y1: number): void {
  for (const s of [-1, 1]) for (const d of [-0.2, 0.2]) coil(m, "spring", x + d, s * 1.0, y0, y1, 0.08, 2, 6);
}

/** Steps under a door or at a frame corner: two treads and their stringers, x0..x1 on side s. */
export function steps(m: MeshBuilder, x0: number, x1: number, s: number, z0: number, z1: number, treads: readonly number[], top: number): void {
  for (const y of treads) block(m, "steel", x0, x1, y, y + 0.04, ...side(s, z0, z1));
  for (const x of [x0, x1 - 0.04]) block(m, "steel", x, x + 0.04, Math.min(...treads), top, ...side(s, z1 - 0.05, z1));
}

/** czElectricKit's `numberOn` in any colour: a running number centred at (u, v) on a surface. */
export function numberText(m: MeshBuilder, mat: string, at: Place, n: Vec3, text: string, u: number, v: number, h: number, d: number, flip: boolean): void {
  const w = h * 0.45, gap = h * 0.12;
  const width = letteringWidth(text, w, gap);
  const tris = lettering(text, flip ? u + width / 2 : u - width / 2, v - h / 2, h, w, gap, flip);
  m.facets(mat, tris.map(([a, b]) => at(a, b, d)), n);
}

/** The place on side s (+1 right) of a flat wall at |z| = z. */
export const wallAt = (s: number, z: number): Place => (x, y, d) => [x, y, s * (z + d)];
/** The place on end e (+1 front) of a flat face at |x| = x: u is z. */
export const faceAt = (e: number, x: number): Place => (u, v, d) => [e * (x + d), v, u];
