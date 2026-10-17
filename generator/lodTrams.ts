// The dedicated low level of detail (docs/models/lod.md) of the trams
// (trams.ts on tramKit.ts), the Czech and Slovak coaches in their later
// liveries (liveryCoach.ts) and the German double-deck coaches
// (germanCoachParts.ts). All three families build their bodies as volumes of
// csdCoachParts.ts - an XML section scaled along a plan and clamped by an
// elevation - so one reading serves them all: `volumeShell` turns a volume into
// plan-ring tables an end at a time, and `lodEndsShell` draws a shell whose two
// ends differ (a tram section's rounded cab end and flat joint end, a driving
// trailer's sloped cab and flat gangway end), which the kit's symmetric
// `lodShell` cannot. `fitEnds` fits such shells as `fitLod` fits the kit's own:
// the optional parts, the profile's detail, the least visible colour band, then
// the smallest window or painted stripe.
//
// Metres, +X forward, +Y up, +Z right, as the full models.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import {
  fitLod, lerp, lodBandAt, lodBands, lodBogie, lodPantograph, lodPolygon, lodRod, lodRoofBox, lodSideBox, mergeBand, simplifyTable, windowBands, LOD_GLASS,
  type LodBand, type LodPart, type LodRect, type LodSections, type Table,
} from "./lodKit.ts";
import { COACH_PALETTE, px, sectionHalf, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { fpx, mirror, type PxBox } from "./csdCoaches.ts";
import { knee, Tram, TRAM_PALETTE, type SourceVolume, type TramMap } from "./tramKit.ts";
import type { LiveryCoachSpec } from "./liveryCoach.ts";

// --- a shell with two different ends ----------------------------------------------------

/** One end of a shell: the x of its centre line at height y and, for a vee nose, the corners' setback behind it. */
export interface LodEnd {
  /** [y, x], bottom first, absolute (the front's x > the rear's); the last height is the crown. */
  tip: Table;
  /** [y, setback] of the corners behind the tip; omitted for a flat end. */
  setback?: Table;
}

/** A LodShell (lodKit.ts) whose front and rear ends are drawn from their own tables. */
export interface LodEndsShell {
  y0: number;
  /** [y, half width], bottom first. */
  hw: Table;
  front: LodEnd;
  rear: LodEnd;
  side: readonly LodBand[];
  end: readonly LodBand[];
  /** The cab sections (x beyond `front`, x short of `rear`) painted in their own bands on the sides. */
  cab?: { front?: number; rear?: number; side: readonly LodBand[] };
  roof: string;
  sideWindows?: readonly LodRect[];
  endWindows?: readonly LodRect[];
  ends?: readonly number[];
  section?: number;
}

type Cell = [u0: number | null, u1: number | null, mat: string];

function cells(base: string, regions: ReadonlyArray<readonly [number, number, string]>): Cell[] {
  const cuts = [...new Set(regions.flatMap(([a, b]) => [a, b]))].sort((a, b) => a - b);
  const bounds: Array<number | null> = [null, ...cuts, null];
  const out: Cell[] = [];
  for (let i = 1; i < bounds.length; i++) {
    const [a, b] = [bounds[i - 1]!, bounds[i]!];
    const mid = a === null ? (b ?? 0) - 1e3 : b === null ? a + 1e3 : (a + b) / 2;
    let mat = base;
    for (const [r0, r1, rm] of regions) if (mid > r0 && mid < r1) mat = rm;
    const last = out[out.length - 1];
    if (last && last[2] === mat) last[1] = b;
    else out.push([a, b, mat]);
  }
  return out;
}

const sameCells = (a: Cell[], b: Cell[]) => a.length === b.length && a.every((c, k) => c[0] === b[k]![0] && c[1] === b[k]![1] && c[2] === b[k]![2]);
const sameBands = (a: readonly LodBand[], b: readonly LodBand[]): boolean =>
  a.length === b.length && a.every((x, k) => x[0] === b[k]![0] && x[1] === b[k]![1] && x[2] === b[k]![2]);

function layers(hs: number[], kinks: Set<number>, at: (y0: number, y1: number) => Cell[]): Array<[number, number, Cell[]]> {
  const out: Array<[number, number, Cell[]]> = [];
  for (let i = 1; i < hs.length; i++) {
    const [y0, y1] = [hs[i - 1]!, hs[i]!];
    const c = at(y0, y1);
    const last = out[out.length - 1];
    if (last && !kinks.has(y0) && sameCells(last[2], c)) last[1] = y1;
    else out.push([y0, y1, c]);
  }
  return out;
}

/**
 * Draws `sh` as `lodShell` draws a LodShell, each end from its own tables;
 * `tol` simplifies the tables first, `flat` draws a vee nose as a flat end
 * halfway back.
 */
export function lodEndsShell(m: MeshBuilder, sh: LodEndsShell, tol = 0, flat = false): void {
  const prep = (end: LodEnd, e: number) => {
    const tip0: Table = flat && end.setback ? end.tip.map(([y, x]) => [y, x - (e * lerp(end.setback!, y)) / 2] as const) : end.tip;
    return { tip: simplifyTable(tip0, tol), sb: end.setback && !flat ? simplifyTable(end.setback, tol) : null };
  };
  const F = prep(sh.front, 1), R = prep(sh.rear, -1);
  const of = (e: number) => (e > 0 ? F : R);
  const hwT = simplifyTable(sh.hw, tol);
  const y0 = sh.y0, top = F.tip[F.tip.length - 1]![0];
  const hw = (y: number) => lerp(hwT, y);
  const tip = (e: number, y: number) => lerp(of(e).tip, y);
  const sb = (e: number, y: number) => (of(e).sb ? lerp(of(e).sb!, y) : 0);
  const corner = (e: number, y: number) => tip(e, y) - e * sb(e, y);
  const kinks = new Set([...F.tip, ...R.tip, ...hwT, ...(F.sb ?? []), ...(R.sb ?? [])].map(([y]) => y).filter((y) => y > y0 && y < top));
  const breaks = (bands: readonly LodBand[], wins: readonly LodRect[]) => [y0, top, ...kinks, ...bands.flatMap(([a, b]) => [a, b]), ...wins.flatMap((w) => [w.y[0], w.y[1]])];
  const sorted = (ys: number[]) => [...new Set(ys.filter((y) => y >= y0 && y <= top).map((y) => Math.round(y * 1e6) / 1e6))].sort((a, b) => a - b);

  // the sides: x cells between the two ends' corners
  for (const s of [-1, 1]) {
    const wins = (sh.sideWindows ?? []).filter((w) => !w.sides || w.sides.includes(s)).flatMap((w) => (w.mirror ? [w, { ...w, u: [-w.u[1], -w.u[0]] as const }] : [w]));
    const hs = sorted(breaks([...sh.side, ...(sh.cab?.side ?? [])], wins));
    const ls = layers(hs, kinks, (ya, yb) => {
      const ym = (ya + yb) / 2;
      const regions: Array<[number, number, string]> = [];
      if (sh.cab) {
        const cm = lodBandAt(sh.cab.side, ym);
        if (cm !== lodBandAt(sh.side, ym)) {
          if (sh.cab.rear !== undefined) regions.push([-1e3, sh.cab.rear, cm]);
          if (sh.cab.front !== undefined) regions.push([sh.cab.front, 1e3, cm]);
        }
      }
      for (const w of wins) if (w.y[0] <= ya + 1e-9 && w.y[1] >= yb - 1e-9) regions.push([w.u[0], w.u[1], w.mat]);
      return cells(lodBandAt(sh.side, ym), regions);
    });
    for (const [ya, yb, cs] of ls) {
      for (const [u0, u1, mat] of cs) {
        const pt = (u: number | null, y: number, end: number): Vec3 => [u === null ? corner(end, y) : Math.max(corner(-1, y), Math.min(corner(1, y), u)), y, s * hw(y)];
        lodPolygon(m, mat, [pt(u0, ya, -1), pt(u1, ya, 1), pt(u1, yb, 1), pt(u0, yb, -1)], [0, 0, s]);
      }
    }
  }

  // the ends: z cells across the face; a vee nose splits at the centre line
  for (const e of sh.ends ?? [-1, 1]) {
    const snap = (u: number, y: number) => (Math.abs(u) >= hw(y) - 0.2 ? Math.sign(u) * 1e3 : u);
    const wins = (sh.endWindows ?? []).filter((w) => !w.ends || w.ends.includes(e)).map((w) => {
      const u = e > 0 ? w.u : [-w.u[1], -w.u[0]];
      const y = (w.y[0] + w.y[1]) / 2;
      return { ...w, u: [snap(u[0]!, y), snap(u[1]!, y)] as readonly [number, number] };
    });
    const hs = sorted(breaks(sh.end, wins));
    const ls = layers(hs, kinks, (ya, yb) => {
      const regions: Array<[number, number, string]> = [];
      for (const w of wins) if (w.y[0] <= ya + 1e-9 && w.y[1] >= yb - 1e-9) regions.push([w.u[0], w.u[1], w.mat]);
      return cells(lodBandAt(sh.end, (ya + yb) / 2), regions);
    });
    const vee = of(e).sb !== null;
    for (const [ya, yb, cs] of ls) {
      for (const [u0, u1, mat] of cs) {
        const spans: Array<[number | null, number | null]> = vee && (u0 === null || u0 < 0) && (u1 === null || u1 > 0) ? [[u0, 0], [0, u1]] : [[u0, u1]];
        for (const [a, b] of spans) {
          const pt = (u: number | null, y: number, side: number): Vec3 => {
            const z = u === null ? side * hw(y) : Math.max(-hw(y), Math.min(hw(y), u));
            return [tip(e, y) - (e * sb(e, y) * Math.abs(z)) / hw(y), y, z];
          };
          const q = [pt(a, ya, -1), pt(b, ya, 1), pt(b, yb, 1), pt(a, yb, -1)];
          lodPolygon(m, mat, [q[0]!, q[1]!, q[2]!], [e, 0, 0]);
          lodPolygon(m, mat, [q[0]!, q[2]!, q[3]!], [e, 0, 0]);
        }
      }
    }
  }

  // the crown
  const cw = hw(top);
  const endPts = (e: number): Vec3[] => {
    const [ct, cc] = [tip(e, top), corner(e, top)];
    const pts: Vec3[] = Math.abs(ct - cc) > 1e-4 ? [[cc, top, -e * cw], [ct, top, 0], [cc, top, e * cw]] : [[ct, top, -e * cw], [ct, top, e * cw]];
    return pts;
  };
  if (cw > 1e-6) lodPolygon(m, sh.roof, [...endPts(1), ...endPts(-1)], [0, 1, 0]);
}

// --- fitting ----------------------------------------------------------------------------

/** The profile's detail, step by step (as lodKit.ts's fitLod). */
const PROFILE: ReadonlyArray<readonly [tol: number, flat: boolean]> = [[0, false], [0.03, false], [0.08, false], [0.08, true], [0.15, true], [0.25, true], [0.4, true]];

export interface LodEndsSpec {
  palette: Record<string, MaterialSpec>;
  shells: LodEndsShell[];
  parts: LodPart[];
  sections?: LodSections;
}

/**
 * Builds `spec` within `budget` triangles in the kit's order: `fitLod` gives up
 * the optional parts; when that is not enough, the shells give up their
 * profile's detail, then their least visible colour band (shells painted alike,
 * an articulated tram's sections, lose it together), then their smallest
 * window or stripe, and the optional parts that fit again come back.
 */
export function fitEnds(spec: LodEndsSpec, budget: number): MeshBuilder {
  let shells = spec.shells;
  let tol = 0;
  // the optional rectangles (small windows, doors), lowest rank first, and those given up
  const optional = shells.flatMap((sh) => [...(sh.sideWindows ?? []), ...(sh.endWindows ?? [])]).filter((w) => w.optional !== undefined).sort((a, b) => a.optional! - b.optional!);
  const gone = new Set<LodRect>();
  const keep = (ws?: readonly LodRect[]) => ws?.filter((w) => !gone.has(w));
  const attempt = (): MeshBuilder | null => {
    const parts: LodPart[] = [
      ...shells.map((sh): LodPart => ({ section: sh.section ?? 0, draw: (m) => m.scope("body", () => lodEndsShell(m, { ...sh, sideWindows: keep(sh.sideWindows), endWindows: keep(sh.endWindows) }, ...PROFILE[tol]!)) })),
      ...spec.parts,
    ];
    try {
      return fitLod({ palette: spec.palette, shells: [], parts, ...(spec.sections ? { sections: spec.sections } : {}) }, budget);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("the LOD does not fit")) return null;
      throw err;
    }
  };
  for (;;) {
    let m = attempt();
    if (m) {
      // the optional rectangles that fit again come back, best first
      for (const w of optional.filter((o) => gone.has(o)).reverse()) {
        gone.delete(w);
        const more = attempt();
        if (more) m = more;
        else gone.add(w);
      }
      return m;
    }
    const next = optional.find((o) => !gone.has(o));
    if (next) { gone.add(next); continue; }
    if (tol < PROFILE.length - 1) { tol++; continue; }
    // the least visible band, from every shell painted alike
    let best: { score: number; apply: () => void } | null = null;
    const offer = (score: number, apply: () => void) => { if (!best || score < best.score - 1e-9) best = { score, apply }; };
    shells.forEach((sh) => {
      const patch = (alike: (x: LodEndsShell) => boolean, p: (x: LodEndsShell) => Partial<LodEndsShell>) => () => {
        shells = shells.map((x) => (alike(x) ? { ...x, ...p(x) } : x));
      };
      const twin = (b: LodBand) => sh.end.findIndex((e) => e[0] === b[0] && e[1] === b[1] && e[2] === b[2]);
      if (sh.side.length > 1) sh.side.forEach((b, i) => {
        const j = sh.end.length > 1 ? twin(b) : -1;
        offer((b[1] - b[0]) * (j >= 0 ? 1.5 : 1), j >= 0
          ? patch((x) => sameBands(x.side, sh.side) && sameBands(x.end, sh.end), (x) => ({ side: mergeBand(x.side, i), end: mergeBand(x.end, j) }))
          : patch((x) => sameBands(x.side, sh.side), (x) => ({ side: mergeBand(x.side, i) })));
      });
      if (sh.end.length > 1) sh.end.forEach((b, j) => {
        if (sh.side.some((x) => x[0] === b[0] && x[1] === b[1] && x[2] === b[2])) return;
        offer((b[1] - b[0]) * 0.5, patch((x) => sameBands(x.end, sh.end), (x) => ({ end: mergeBand(x.end, j) })));
      });
      if (sh.cab) sh.cab.side.forEach(([a, b, mat], i) => {
        if (lodBands(sh.side, a, b).every(([, , bm]) => bm === mat)) return;
        const cab = sh.cab!;
        offer((b - a) * 0.5, patch((x) => !!x.cab && sameBands(x.cab.side, cab.side) && sameBands(x.side, sh.side), (x) => {
          const merged = lodBands([...cab.side.slice(0, i), ...lodBands(x.side, a, b), ...cab.side.slice(i + 1)], cab.side[0]![0], cab.side[cab.side.length - 1]![1]);
          return { cab: sameBands(merged, lodBands(x.side, merged[0]![0], merged[merged.length - 1]![1])) ? undefined : { ...x.cab!, side: merged } };
        }));
      });
    });
    if (best) { (best as { apply: () => void }).apply(); continue; }
    // the smallest window or painted stripe
    const area = (w: LodRect) => (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]);
    const wins = shells.flatMap((sh, k) => [
      ...(sh.sideWindows ?? []).map((w) => ({ k, w, side: true })),
      ...(sh.endWindows ?? []).map((w) => ({ k, w, side: false })),
    ].filter(({ w }) => !gone.has(w)));
    if (!wins.length) throw new Error(`the LOD does not fit ${budget} triangles`);
    const small = wins.reduce((a, b) => (area(b.w) < area(a.w) - 1e-9 ? b : a));
    shells = shells.map((sh, j) => j !== small.k ? sh : small.side
      ? { ...sh, sideWindows: sh.sideWindows!.filter((w) => w !== small.w) }
      : { ...sh, endWindows: sh.endWindows!.filter((w) => w !== small.w) });
  }
}

// --- reading a volume ---------------------------------------------------------------------

const lerpPts = (pts: Pt[], x: number): number => lerp(pts.map(([a, b]) => [a, b] as const), x);

/** The tables of a csdCoachParts volume. */
export interface VolumeTables {
  y0: number;
  /** The crown: the highest height drawn. */
  top: number;
  hw: Table;
  front: LodEnd;
  rear: LodEnd;
}

/**
 * A volume's plan-ring tables in Factory metres (`X` maps its x to the
 * Factory's): its half width from the section, and per end the farthest x
 * still inside its elevation at each height (a sloped or rounded nose pulls
 * back) and, where its plan narrows toward the end, a vee setback holding the
 * same area. `flat` ends stay vertical at the plan's end (an articulated
 * section's joint face, whose skirt the elevation cuts away).
 */
export function volumeShell(v: Volume, opts: { X?: (x: number) => number; y0?: number; top?: number; flat?: { front?: boolean; rear?: boolean } } = {}): VolumeTables {
  const X = opts.X ?? ((x: number) => x);
  const secYs = v.section.map((p) => p[1]);
  const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
  const secTop = Math.max(...secYs);
  const H = Math.max(...v.plan.map((p) => p[1]));
  const [xa, xb] = [v.plan[0]![0], v.plan[v.plan.length - 1]![0]];
  const mid = (xa + xb) / 2;
  const y0 = opts.y0 ?? Math.max(Math.min(...secYs), v.bottom ? Math.min(...v.bottom.map((p) => p[1])) : -Infinity);
  // the crown: the highest corner of the section still 35 % of its width (not a ridge's apex), at most the elevation's top
  let top = opts.top ?? Math.max(...v.section.filter(([z]) => Math.abs(z) >= 0.35 * hw0).map((p) => p[1]));
  if (opts.top === undefined && v.top) top = Math.min(top, Math.max(...v.top.map((p) => p[1])));
  const half = (y: number) => (sectionHalf(v.section, Math.min(Math.max(y, Math.min(...secYs) + 1e-6), secTop - 1e-6)) * H) / hw0;
  const stations = [...new Set([...v.plan, ...(v.top ?? []), ...(v.bottom ?? [])].map((p) => p[0]))].filter((x) => x >= xa - 1e-9 && x <= xb + 1e-9).sort((a, b) => a - b);
  const inside = (x: number, y: number) => (!v.bottom || lerpPts(v.bottom, x) <= y + 1e-6) && (!v.top || lerpPts(v.top, x) >= y - 1e-6);
  // the extreme x inside the elevation at height y, toward end e
  const extreme = (y: number, e: number): number => {
    const cands = [...stations];
    for (let i = 0; i + 1 < stations.length; i++) {
      const [a, b] = [stations[i]!, stations[i + 1]!];
      for (const line of [v.top, v.bottom]) {
        if (!line) continue;
        const [ya, yb] = [lerpPts(line, a), lerpPts(line, b)];
        if ((ya - y) * (yb - y) < 0) cands.push(a + ((y - ya) / (yb - ya)) * (b - a));
      }
    }
    const ok = cands.filter((x) => inside(x, y) && e * (x - mid) >= 0);
    return ok.length ? (e > 0 ? Math.max(...ok) : Math.min(...ok)) : mid;
  };
  // the area the plan leaves out of the full width between x and the middle, as a vee's setback
  const setback = (x: number, e: number): number => {
    const xs = [x, ...stations.filter((s) => e * (s - mid) > 0 && e * (x - s) > 0), mid].sort((a, b) => a - b);
    let area = 0;
    for (let i = 0; i + 1 < xs.length; i++) {
      const [a, b] = [xs[i]!, xs[i + 1]!];
      area += ((H - lerpPts(v.plan, a) + H - lerpPts(v.plan, b)) / 2) * (b - a);
    }
    return Math.min((2 * area) / H, 0.8 * Math.abs(x - mid));
  };
  const ys = [...new Set([y0, top, ...secYs, ...(v.top ?? []).map((p) => p[1]), ...(v.bottom ?? []).map((p) => p[1]), ...Array.from({ length: 60 }, (_, k) => y0 + ((top - y0) * k) / 59)]
    .filter((y) => y >= y0 - 1e-9 && y <= top + 1e-9).map((y) => Math.round(y * 1e6) / 1e6))].sort((a, b) => a - b);
  const end = (e: number, isFlat?: boolean): LodEnd => {
    const xEnd = e > 0 ? xb : xa;
    const tipX = (y: number) => (isFlat ? xEnd : extreme(y, e));
    const tip = simplifyTable(ys.map((y) => [y, X(tipX(y))] as const), 0.04);
    if (isFlat) return { tip };
    const sb = ys.map((y) => [y, setback(tipX(y), e)] as const);
    return Math.max(...sb.map(([, s]) => s)) < 0.05 ? { tip } : { tip, setback: simplifyTable(sb, 0.08) };
  };
  return {
    y0, top,
    hw: simplifyTable(ys.map((y) => [y, half(y)] as const), 0.02),
    front: end(1, opts.flat?.front),
    rear: end(-1, opts.flat?.rear),
  };
}

/** Bands with the livery's own glass painted in the LOD glass, clipped to y0..y1. */
const glazed = (bands: ReadonlyArray<readonly [number, number, string]>, glass: readonly string[], y0: number, y1: number): LodBand[] =>
  lodBands(bands.map(([a, b, mat]): LodBand => [a, b, glass.includes(mat) ? LOD_GLASS : mat]), y0, y1);

/** The bar of a pantograph's collector at height y over x: two sloped walls across z (4 triangles). */
function collector(m: MeshBuilder, mat: string, x: number, y: number, half: number): void {
  const [a, b, c]: Array<[number, number]> = [[x - 0.15, y - 0.02], [x + 0.15, y - 0.02], [x, y + 0.07]];
  for (const [p, q, nx] of [[b, c, 1], [c, a, -1]] as const) lodPolygon(m, mat, [[p[0], p[1], -half], [q[0], q[1], -half], [q[0], q[1], half], [p[0], p[1], half]], [nx, 1, 0]);
}

/**
 * A raised diamond pantograph from afar: both frames' lower and upper arms as
 * rods to the knees the full model finds (tramKit.ts `diamond`), and the
 * collector bar; 20 triangles.
 */
export function lodDiamond(m: MeshBuilder, p: { x: number; roof: number; head: number; reach?: number; bow?: number; mat?: string }): void {
  const mat = p.mat ?? "pantograph";
  const base = p.roof + 0.22, bx = 0.5, hx = 0.14, reach = p.reach ?? 1.2;
  const lower = Math.hypot(reach - bx, 1.1), upper = Math.hypot(reach - hx, 1.1);
  const lift = p.head - base - 0.1;
  const k = knee([bx, 0], lower, [hx, lift], upper, -1);
  for (const d of [-1, 1]) {
    lodRod(m, mat, [p.x + d * bx, p.roof - 0.02, 0], [p.x + d * k[0], base + k[1], 0], 0.07);
    lodRod(m, mat, [p.x + d * k[0], base + k[1], 0], [p.x + d * hx, base + lift, 0], 0.05);
  }
  collector(m, mat, p.x, base + lift + 0.05, p.bow ?? 0.85);
}

// --- the trams ------------------------------------------------------------------------------

type Band = [number, number, string];

/** A tram's distant model, from the same source data its full build (trams.ts) draws. */
export interface TramLodSpec {
  map: TramMap;
  /** The livery's colours (over TRAM_PALETTE). */
  palette: Record<string, MaterialSpec>;
  section: Pt[];
  body: SourceVolume;
  /** The bodies' source x ranges, front first: one for a rigid tram, one per section for an articulated one. */
  bodies: Array<[number, number]>;
  /** Source x where the front cab ends and where the rear one begins. */
  cabs: [front: number, rear: number];
  /** Paint bands in source heights: the saloon's and the cabs'. */
  main: Band[];
  cab: Band[];
  /** The band materials that are glass (drawn in LOD_GLASS). */
  glass: readonly string[];
  /** Side windows (native boxes): right, left. */
  windows: { right: PxBox[]; left: PxBox[] };
  /** Roof boxes: source x and y ranges, half width; `optional` ones give way first. */
  roofBoxes: Array<{ x: [number, number]; y: [number, number]; half: number; optional?: boolean }>;
  /** Pantographs at source x: a diamond (its knees `reach` out), or a single arm hinged at `x` with its head over `head`. */
  pantographs: Array<{ kind: "diamond"; x: number; reach?: number; raised: boolean } | { kind: "single"; x: number; head: number; raised: boolean }>;
  /** Bogies: source x, wheelbase (m), wheel radius, top (source y) and the section that carries them. */
  bogies: Array<{ x: number; wb: number; r: number; top: number; section?: number }>;
  /** An articulated tram's joints, as trams.ts hands them to `articulate`: hinge height (source), bellows profile (Factory), bend limit. */
  joint?: { hingeY: number; profile: Array<[number, number]>; maxBendDeg: number };
  /** The raised collector's height (TRAM_WIRE). */
  wire: number;
}

/** The LOD sections of an articulated tram: the pivots and bellows `articulate` (tramKit.ts) gives the full model. */
export function tramSections(t: Tram, bodies: Array<[number, number]>, joint: NonNullable<TramLodSpec["joint"]>): LodSections {
  const secs = bodies.map(([a, b]) => ({ x0: t.fx(b), x1: t.fx(a) }));
  return {
    pivots: secs.map((s, i): Vec3 => (i === 0 ? [0, 0, 0] : [(secs[i - 1]!.x0 + s.x1) / 2, t.fy(joint.hingeY), 0])),
    joints: secs.slice(0, -1).map((s, i) => ({ sections: [i, i + 1] as [number, number], front: s.x0, rear: secs[i + 1]!.x1, profile: joint.profile })),
    maxBendDeg: joint.maxBendDeg,
    material: "bellows",
  };
}

/**
 * A tram from afar: every body (section) one shell, its cab ends rounded from
 * the XML plan and elevation and painted in the cab bands (the windscreen in
 * LOD glass), its joint ends flat and hidden by the bellows; the side windows
 * as bands; roof boxes, the raised pantograph (a second one folded, optional)
 * and the bogies as dark blocks; an articulated tram keeps its sections and
 * bellows as the full rig's nodes.
 */
export function tramLod(spec: TramLodSpec, budget: number): MeshBuilder {
  const t = new Tram(spec.palette, spec.map);
  const n = spec.bodies.length;
  const sectionOf = (x: number) => {
    const k = spec.bodies.findIndex(([a, b]) => x >= a - 0.05 && x <= b + 0.05);
    if (k >= 0) return k;
    const d = spec.bodies.map(([a, b]) => Math.min(Math.abs(x - a), Math.abs(x - b)));
    return d.indexOf(Math.min(...d));
  };
  const shells: LodEndsShell[] = [];
  let crown = Infinity;
  spec.bodies.forEach(([a, b], i) => {
    const [frontCab, rearCab] = [i === 0, i === n - 1];
    const v = t.vol("lod", spec.section, spec.body, a, b, spec.main);
    const tab = volumeShell(v, { flat: { front: !frontCab, rear: !rearCab } });
    crown = Math.min(crown, tab.top);
    const own = (bx: PxBox) => bx[0] / 10 >= a - 0.05 && bx[2] / 10 <= b + 0.05;
    const rects = (list: PxBox[], s: number): LodRect[] => windowBands(list.filter(own).map((bx) => { const q = t.box(bx); return { u: [q.x0, q.x1] as const, y: [q.y0, q.y1] as const }; }), 0.35).map((w) => ({ ...w, sides: [s] }));
    const scaled = (bands: Band[]) => bands.map(([y0, y1, mat]): Band => [t.fy(y0), t.fy(y1), mat]);
    shells.push({
      y0: tab.y0, hw: tab.hw, front: tab.front, rear: tab.rear,
      side: glazed(scaled(spec.main), spec.glass, tab.y0, tab.top),
      end: glazed(scaled(spec.cab), spec.glass, tab.y0, tab.top),
      ...(frontCab || rearCab ? { cab: { ...(frontCab ? { front: t.fx(spec.cabs[0]) } : {}), ...(rearCab ? { rear: t.fx(spec.cabs[1]) } : {}), side: glazed(scaled(spec.cab), spec.glass, tab.y0, tab.top) } } : {}),
      roof: "roof",
      sideWindows: [...rects(spec.windows.right, 1), ...rects(spec.windows.left, -1)],
      ends: [...(rearCab ? [-1] : []), ...(frontCab ? [1] : [])],
      section: i,
    });
  });
  const parts: LodPart[] = [
    ...spec.bogies.map((g): LodPart => ({
      section: g.section ?? sectionOf(g.x),
      // under the skirts: the sides only
      draw: (m) => m.scope("running gear", () => {
        const [x, l] = [t.fx(g.x), g.wb / 2 + g.r + 0.15];
        lodSideBox(m, "bogie", [[x - l + 0.3, 0.08], [x + l - 0.3, 0.08], [x + l, t.fy(g.top)], [x - l, t.fy(g.top)]], -1.0, 1.0, false);
      }),
    })),
    ...spec.roofBoxes.map((r): LodPart => ({
      section: sectionOf((r.x[0] + r.x[1]) / 2),
      ...(r.optional ? { optional: 10 + (r.x[1] - r.x[0]) } : {}),
      draw: (m) => m.scope("roof equipment", () => lodRoofBox(m, "roofBox", t.fx(r.x[1]), t.fx(r.x[0]), r.half, r.half - 0.05, crown - 0.01, t.fy(r.y[1]))),
    })),
    ...spec.pantographs.map((p): LodPart => ({
      section: sectionOf(p.x),
      ...(p.raised ? {} : { optional: 0 }),
      draw: (m) => m.scope(p.raised ? "raised pantograph" : "folded pantograph", () => {
        if (!p.raised) lodPantograph(m, { x: t.fx(p.x), roofY: crown, baseY: crown + 0.2, h: 1, raised: false, raisedTop: spec.wire });
        else if (p.kind === "diamond") lodDiamond(m, { x: t.fx(p.x), roof: crown, head: spec.wire, ...(p.reach ? { reach: p.reach } : {}) });
        else {
          // the single arm: its hinge half a metre toward +x of the base's centre, the knee toward -x
          lodPantograph(m, { x: t.fx(p.x) - 0.5, roofY: crown, baseY: crown + 0.2, h: 1, raised: true, raisedTop: spec.wire, lower: 1.45, upper: 1.6, halfHead: 0.8 });
        }
      }),
    })),
  ];
  return fitEnds({
    palette: { ...TRAM_PALETTE, ...spec.palette },
    shells,
    parts,
    ...(spec.joint && n > 1 ? { sections: tramSections(t, spec.bodies, spec.joint) } : {}),
  }, budget);
}

// --- the Czech and Slovak coaches ----------------------------------------------------------------

/** A coach's side window and stripe rectangles (source boxes), as Factory LodRects on side s. */
function coachRects(X: (x: number) => number, s: number, glass: Box[], paint: Array<{ box: Box; mat: string }>, gap: number): LodRect[] {
  const bands = windowBands(glass.map((b) => ({ u: [X(b.x0), X(b.x1)] as const, y: [b.y0, b.y1] as const })), gap);
  // painted stripes and patches 2.5 m long or more; runs of one colour at one height joined
  const groups = new Map<string, Array<{ u: readonly [number, number]; y: readonly [number, number] }>>();
  for (const p of paint) {
    if (p.box.x1 - p.box.x0 < 2.5) continue;
    const key = `${p.mat}|${p.box.y0.toFixed(3)}|${p.box.y1.toFixed(3)}`;
    groups.set(key, [...(groups.get(key) ?? []), { u: [X(p.box.x0), X(p.box.x1)], y: [p.box.y0, p.box.y1] }]);
  }
  const stripes = [...groups.entries()].flatMap(([key, rs]) => windowBands(rs, 1.5, key.split("|")[0]!));
  // stripes first: the windows lie over them; a window under 3 m2 (a toilet's, an end section's) is optional
  const small = (w: LodRect) => (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]) < 3;
  return [...stripes, ...bands.map((w) => (small(w) ? { ...w, optional: (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]) } : w))].map((w) => ({ ...w, sides: [s] }));
}

/** A painted area of a livery coach as a box: a box as it is, a convex outline as its extent at mid height. */
function paintBox(p: NonNullable<LiveryCoachSpec["right"]["paint"]>[number], H: number): Box {
  if ("box" in p) return px(p.box, H);
  const pts = p.poly.map(([u, v]): Pt => [u / 10, H - v / 10]);
  const [y0, y1] = [Math.min(...pts.map((q) => q[1])), Math.max(...pts.map((q) => q[1]))];
  const ym = (y0 + y1) / 2;
  const xs: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const [a, b] = [pts[i]!, pts[(i + 1) % pts.length]!];
    if ((a[1] - ym) * (b[1] - ym) <= 0 && a[1] !== b[1]) xs.push(a[0] + ((ym - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
  }
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0, y1 };
}

/**
 * A livery coach (liveryCoach.ts) from afar: the XML body as one shell painted
 * in its bands (the ends in their end paint), the windows as bands and the
 * long painted stripes as rectangles on each side, the bogies, the UIC-Z
 * skirt, and as optional parts the underframe equipment and the dining cars'
 * roof boxes.
 */
export function liveryCoachLod(spec: LiveryCoachSpec, budget = 100): MeshBuilder {
  const geo = spec.body, H = geo.canvas;
  const X = (x: number) => x - geo.length / 2;
  const v: Volume = { name: "lod", section: geo.section, plan: geo.plan, top: geo.top, ...(geo.bottom ? { bottom: geo.bottom } : {}), bands: spec.bands };
  const tab = volumeShell(v, { X });
  const roof = spec.bands[spec.bands.length - 1]![2];
  const side = (s: number): LodRect[] => {
    const sp = s > 0 ? spec.right : spec.left;
    const glass = sp.windows.filter((w) => typeof w[0] === "number" || (w as [PxBox, string])[1] !== "frosted").map((w) => px(typeof w[0] === "number" ? (w as PxBox) : (w as [PxBox, string])[0], H));
    return coachRects(X, s, glass, (sp.paint ?? []).filter((p) => !p.layer).map((p) => ({ box: paintBox(p, H), mat: p.mat })), 0.8);
  };
  const shell: LodEndsShell = {
    y0: tab.y0, hw: tab.hw, front: tab.front, rear: tab.rear,
    side: lodBands(spec.bands, tab.y0, tab.top),
    end: spec.endPaint ? [[tab.y0, tab.top, spec.endPaint]] : lodBands(spec.bands, tab.y0, tab.top),
    roof,
    sideWindows: [...side(1), ...side(-1)],
  };
  const under = spec.underframe.flat();
  const parts: LodPart[] = [
    { draw: (m) => m.scope("running gear", () => { for (const x of geo.bogies) lodBogie(m, X(x), 1.25 + 0.45 + 0.1, tab.y0, 1.06); }) },
    ...(spec.skirt ? [{ draw: (m: MeshBuilder) => m.scope("skirt", () => {
      const sk = spec.skirt!;
      lodSideBox(m, sk.mat, [[X(sk.x0), 0.4], [X(sk.x1), 0.4], [X(sk.x1), tab.y0], [X(sk.x0), tab.y0]], -1.45, 1.45);
    }) }] : []),
    ...(under.length && !spec.skirt ? [{ optional: 50, draw: (m: MeshBuilder) => m.scope("underframe", () => {
      const [x0, x1, y0] = [Math.min(...under.map((p) => p[0])), Math.max(...under.map((p) => p[0])), Math.min(...under.map((p) => p[1]))];
      lodSideBox(m, "underframe", [[X(x0), y0], [X(x1), y0], [X(x1), tab.y0], [X(x0), tab.y0]], -1.15, 1.15);
    }) }] : []),
    ...(spec.roofBoxes ?? []).map(([a, b, half, h]): LodPart => ({
      optional: 10 + (b - a),
      draw: (m) => m.scope("roof boxes", () => lodRoofBox(m, spec.ventMat, X(a), X(b), half, half, tab.top - 0.05, Math.max(...geo.top.map((p) => p[1])) + h)),
    })),
  ];
  return fitEnds({ palette: { ...COACH_PALETTE, ...spec.palette }, shells: [shell], parts }, budget);
}

// --- the German double-deck coaches ----------------------------------------------------------

/** A German double-deck coach's distant model, from its full build's volume and boxes (dbDoubleDeck.ts, drDoubleDeck.ts). */
export interface DoubleDeckLodSpec {
  palette: Record<string, MaterialSpec>;
  /** Source x of the model's x = 0. */
  centre: number;
  /** The body volume (source x); its bottom drops between the bogies to the lower deck's floor. */
  body: Volume;
  /** The floor over the bogies: the shell's foot; the drop below it is the belly. */
  floor: number;
  /** The side canvas's height. */
  canvas: number;
  /** Windows on both sides (germanCoachParts.ts Win): the decks and the end sections. */
  windows: Array<PxBox | [PxBox, "frosted"]>;
  /** Side doors: their native boxes and leaf material. */
  doors: Array<{ box: PxBox; mat: string }>;
  /** A cab's windscreen on end e: its end-view native box (frame included). */
  windscreen?: { box: PxBox; end: number };
  bogies: Array<{ x: number; top: number }>;
  /** The equipment boxes under the dropped floor: source x ranges, bottom height. */
  equipment: { x: Array<[number, number]>; y0: number };
}

/**
 * A double-deck coach from afar: the body as one shell from the floor over the
 * bogies, its two decks' window bands and the end sections' windows, the doors,
 * the lowered belly between the bogies painted in its bands, a cab's
 * windscreen, the bogies and, optional, the equipment under the belly.
 */
export function doubleDeckLod(spec: DoubleDeckLodSpec, budget = 100): MeshBuilder {
  const v = spec.body, H = spec.canvas;
  const X = (x: number) => x - spec.centre;
  const tab = volumeShell(v, { X, y0: spec.floor });
  const glass = spec.windows.filter((w) => typeof w[0] === "number").map((w) => px(w as PxBox, H));
  const rect = (s: number): LodRect[] => [
    ...spec.doors.map((d): LodRect => { const b = px(d.box, H); return { u: [X(b.x0), X(b.x1)], y: [Math.max(b.y0, spec.floor), b.y1], mat: d.mat, sides: [s], optional: 5 }; }),
    ...coachRects(X, s, glass, [], 0.5),
  ];
  const ws = spec.windscreen && (() => {
    const b = spec.windscreen!.end > 0 ? mirror(fpx(spec.windscreen!.box, H)) : fpx(spec.windscreen!.box, H);
    return { u: [b.x0, b.x1] as const, y: [b.y0, b.y1] as const, mat: LOD_GLASS, ends: [spec.windscreen!.end] };
  })();
  const shell: LodEndsShell = {
    y0: tab.y0, hw: tab.hw, front: tab.front, rear: tab.rear,
    side: lodBands(v.bands, tab.y0, tab.top),
    end: v.endPaint ? [[tab.y0, tab.top, v.endPaint]] : lodBands(v.bands, tab.y0, tab.top),
    roof: v.bands[v.bands.length - 1]![2],
    sideWindows: [...rect(1), ...rect(-1)],
    ...(ws ? { endWindows: [ws] } : {}),
  };
  // the belly: where the bottom drops below the floor, one box per band
  const bottom = v.bottom!;
  const low = Math.min(...bottom.map((p) => p[1]));
  const span = (y: number): [number, number] => {
    const xs: number[] = [];
    for (let i = 0; i + 1 < bottom.length; i++) {
      const [[xa, ya], [xb, yb]] = [bottom[i]!, bottom[i + 1]!];
      if (ya <= y + 1e-9) xs.push(xa);
      if (yb <= y + 1e-9) xs.push(xb);
      if ((ya - y) * (yb - y) < 0) xs.push(xa + ((y - ya) / (yb - ya)) * (xb - xa));
    }
    return [Math.min(...xs), Math.max(...xs)];
  };
  const hz = (sectionHalf(v.section, low + 1e-6) * Math.max(...v.plan.map((p) => p[1]))) / Math.max(...v.section.map((p) => Math.abs(p[0])));
  const parts: LodPart[] = [
    { draw: (m) => m.scope("belly", () => {
      for (const [y0, y1, mat] of lodBands(v.bands, low, spec.floor)) {
        const [a, b] = [span(y0), span(y1)];
        lodSideBox(m, mat, [[X(a[0]), y0], [X(a[1]), y0], [X(b[1]), y1], [X(b[0]), y1]], -hz, hz);
      }
    }) },
    { draw: (m) => m.scope("running gear", () => { for (const g of spec.bogies) lodBogie(m, X(g.x), 1.25 + 0.46 + 0.1, g.top, 1.06); }) },
    { optional: 50, draw: (m) => m.scope("underframe", () => {
      const [x0, x1] = [Math.min(...spec.equipment.x.map((r) => r[0])), Math.max(...spec.equipment.x.map((r) => r[1]))];
      lodSideBox(m, "underframe", [[X(x0), spec.equipment.y0], [X(x1), spec.equipment.y0], [X(x1), low], [X(x0), low]], -1.1, 1.1);
    }) },
  ];
  return fitEnds({ palette: { ...COACH_PALETTE, ...spec.palette }, shells: [shell], parts }, budget);
}
