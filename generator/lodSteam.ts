// The dedicated low level of detail of the steam locomotives and tenders
// (steamLocos.ts) and of the freight wagons (freightWagons.ts, hopperWagons.ts,
// wagonExtras.ts), on the shared kit (lodKit.ts, docs/models/lod.md).
//
// Steam: one adapter reads a LocoSpec -- the boiler as an octagonal prism along
// x with its smokebox, the chimney and domes as small blocks, the cab, tanks,
// bunkers and tender bodies as painted shells (their prisms' own sections), a
// streamlined casing's volumes as shells with a vee nose, the running board, and
// the wheels as blocks in the wheel paint reaching the rail. No rods, no
// animation: a LOD is static.
//
// Freight wagons: one adapter turns a wagon's bodies -- boxes over a section,
// JT7 clip solids (freightWagonParts.ts), side plates swept across the wagon --
// into shells and parts, with bogies or wheelsets as dark blocks, draw gear and
// loads (a load's surface is the open top's crown).
//
// Steam specs are in source coordinates (x from the front buffer rearward,
// model X = xc - x); wagons' in theirs (model X = x - centre).

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { fitLod, lerp, mergeBand, windowBands, lodBogie, lodHipRoof, lodPolygon, lodRoofBox, lodShell, lodSideBox, simplifyTable, type LodBand, type LodPart, type LodRect, type LodShell, type Table } from "./lodKit.ts";
import type { LocoSpec } from "./steamLoco.ts";
import { STEAM_PALETTE, halfAt, type Pt } from "./steamParts.ts";
import type { Clip } from "./freightWagonParts.ts";

// --- shared helpers ------------------------------------------------------------------------

/** A (y, half width) table from a section's right half listed bottom to top; a step in it becomes a 3 cm slope. */
export function halfTable(half: readonly Pt[]): Table {
  const out: Array<[number, number]> = [];
  for (const [z, y] of half) {
    const last = out[out.length - 1];
    if (last && y <= last[0] + 1e-6) {
      if (Math.abs(z - last[1]) < 1e-6) continue;
      out.push([last[0] + 0.03, z]);
    } else out.push([y, z]);
  }
  return out;
}

/** A half width table kept off zero: an apex becomes a 6 cm ridge (lodShell divides by the half width). */
export const offZero = (t: Table): Table => t.map(([y, v]) => [y, Math.max(v, 0.03)] as const);

/** A shell of constant section between model X0 and X1 (X0 < X1): `hw` its half width table. */
export function boxShell(X0: number, X1: number, hw0: Table, side: readonly LodBand[], o: { end?: readonly LodBand[]; roof?: string; ends?: readonly number[]; sideWindows?: readonly LodRect[]; endWindows?: readonly LodRect[] } = {}): LodShell {
  const hw = offZero(hw0);
  const y0 = hw[0]![0], top = hw[hw.length - 1]![0];
  const half = (X1 - X0) / 2;
  return {
    y0, tip: [[y0, half], [top, half]], hw, xc: (X0 + X1) / 2,
    side, end: o.end ?? side, roof: o.roof ?? side[side.length - 1]![2],
    ...(o.ends ? { ends: o.ends } : {}),
    ...(o.sideWindows ? { sideWindows: o.sideWindows } : {}),
    ...(o.endWindows ? { endWindows: o.endWindows } : {}),
  };
}

/** Bands painted alike joined: a band whose colour matches its neighbour's takes the neighbour's material. */
export function joinSameColour(bands: readonly LodBand[], palette: Record<string, MaterialSpec>): LodBand[] {
  const colour = (m: string) => palette[m]?.color ?? m;
  const out: LodBand[] = [];
  for (const b of bands) {
    const last = out[out.length - 1];
    if (last && colour(last[2]) === colour(b[2])) out[out.length - 1] = [last[0], b[1], last[2]];
    else out.push([b[0], b[1], b[2]]);
  }
  return out;
}

/** The shell's extent: model X range, heights and half width, for telling which ends another shell hides. */
interface Extent { X0: number; X1: number; y0: number; top: number; hw: (y: number) => number; ys: number[] }

const extentOf = (sh: LodShell): Extent => {
  // the steam adapter's shells are all symmetric (tip from xc)
  const tip = sh.tip!;
  const xc = sh.xc ?? 0, t = Math.max(...tip.map(([, v]) => v));
  return { X0: xc - t, X1: xc + t, y0: sh.y0, top: tip[tip.length - 1]![0], hw: (y) => lerp(sh.hw, y), ys: sh.hw.map(([y]) => y) };
};

/**
 * The ends of `sh` that no other body hides: an end is left out where another
 * body continues past it at least as tall and about as wide (a bunker against
 * its cab; up to 12 cm narrower: the sliver is not seen from afar).
 */
export function visibleEnds(sh: LodShell, others: readonly LodShell[], ends: readonly number[] = [-1, 1]): number[] {
  const a = extentOf(sh);
  return ends.filter((e) => {
    const at = e > 0 ? a.X1 : a.X0;
    return !others.some((o) => {
      if (o === sh) return false;
      const b = extentOf(o);
      const past = e > 0 ? b.X0 <= at + 0.03 && b.X1 >= at + 0.1 : b.X1 >= at - 0.03 && b.X0 <= at - 0.1;
      return past && b.y0 <= a.y0 + 0.02 && b.top >= a.top - 0.02 && a.ys.every((y) => y < b.y0 || y > b.top || b.hw(y) >= a.hw(y) - 0.12);
    });
  });
}

/** Faces of a convex (x, y) outline swept across z from -hz to hz: both sides, and the edges listed in `walls` (index i: edge i..i+1). */
export function zSweep(m: MeshBuilder, mat: string, poly: readonly Pt[], hz: number, walls: readonly number[] = []): void {
  for (const s of [-1, 1]) lodPolygon(m, mat, poly.map(([x, y]): Vec3 => [x, y, s * hz]), [0, 0, s]);
  const cx = poly.reduce((t, p) => t + p[0], 0) / poly.length, cy = poly.reduce((t, p) => t + p[1], 0) / poly.length;
  for (const i of walls) {
    const [p, q] = [poly[i]!, poly[(i + 1) % poly.length]!];
    lodPolygon(m, mat, [[p[0], p[1], -hz], [q[0], q[1], -hz], [q[0], q[1], hz], [p[0], p[1], hz]], [(p[0] + q[0]) / 2 - cx, (p[1] + q[1]) / 2 - cy, 0]);
  }
}

/** A plate on both sides at |z| = hz: the convex (x, y) outline facing out, nothing else (a deflector, a fishbelly). */
export function sidePlates(m: MeshBuilder, mat: string, poly: readonly Pt[], hz: number): void {
  for (const s of [-1, 1]) lodPolygon(m, mat, poly.map(([x, y]): Vec3 => [x, y, s * hz]), [0, 0, s]);
}

/** Running gear from afar: wheels grouped where their treads nearly touch, each group a block narrowing toward the rail. */
export function wheelBlocks(m: MeshBuilder, mat: string, wheels: ReadonlyArray<{ X: number; d: number }>, hz: number, top?: number): void {
  const sorted = [...wheels].sort((a, b) => a.X - b.X);
  const groups: Array<{ X0: number; X1: number; d: number }> = [];
  for (const w of sorted) {
    const g = groups[groups.length - 1];
    if (g && Math.abs(g.d - w.d) < 0.3 && w.X - g.X1 - Math.max(g.d, w.d) < 1.0) [g.X1, g.d] = [w.X, Math.max(g.d, w.d)];
    else groups.push({ X0: w.X, X1: w.X, d: w.d });
  }
  for (const g of groups) {
    // sides only: the ends stand behind the buffer beams or the next block
    const r = g.d / 2, t = top ?? g.d * 0.95;
    lodSideBox(m, mat, [[g.X0 - r * 0.55, 0.02], [g.X1 + r * 0.55, 0.02], [g.X1 + r, t], [g.X0 - r, t]], -hz, hz, false);
  }
}

/** The convex hull of `pts`, reduced to at most `n` corners by dropping the corner whose triangle is smallest. */
export function hullOf(pts: readonly Pt[], n: number): Pt[] {
  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: Pt[]) => {
    const h: Pt[] = [];
    for (const p of list) {
      while (h.length >= 2 && cr(h[h.length - 2]!, h[h.length - 1]!, p) <= 1e-12) h.pop();
      h.push(p);
    }
    return h.slice(0, -1);
  };
  let hull = [...half(sorted), ...half([...sorted].reverse())];
  while (hull.length > n) {
    let at = 0, least = Infinity;
    hull.forEach((p, i) => {
      const a = Math.abs(cr(hull[(i + hull.length - 1) % hull.length]!, p, hull[(i + 1) % hull.length]!));
      if (a < least - 1e-12) [least, at] = [a, i];
    });
    hull = hull.filter((_, i) => i !== at);
  }
  return hull;
}

/** `bands` with every band thinner than `min` painted over by its neighbour (lining is invisible from afar). */
export function dropThin(bands: readonly LodBand[], min = 0.08): LodBand[] {
  let out = [...bands];
  for (;;) {
    const i = out.findIndex(([a, b]) => b - a < min);
    if (i < 0 || out.length < 2) return out;
    out = mergeBand(out, i);
  }
}

// --- steam ------------------------------------------------------------------------------------

/** A horizontal octagon of radius r about height y as a (y, half width) table, from the bottom facet up. */
export const octagon = (y: number, r: number): Table => {
  const [a, b] = [r * Math.sin(Math.PI / 8), r * Math.cos(Math.PI / 8)];
  return [[y - b, a], [y - a, b], [y + a, b], [y + b, a]];
};

/** A box (chimney, dome) standing from y0 to top, half length lx and half width hz, narrowing to `k` at the top. */
const standing = (X: number, y0: number, top: number, lx: number, hz: number, mat: string, k = 1): LodShell => ({
  y0, tip: [[y0, lx], [top, lx * k]], hw: [[y0, hz], [top, hz * k]], xc: X, side: [[y0, top, mat]], end: [[y0, top, mat]], roof: mat,
});

type Volume = NonNullable<LocoSpec["volumes"]>[number];

/** A streamlined volume (Steam.volume) sampled: its heights, and at height y its half width, front, width at x and paint. */
function sampleVolume(v: Volume) {
  const at = (pts: readonly Pt[], x: number) => lerp(pts.map(([a, b]) => [a, b] as const), x);
  const hw0 = Math.max(...v.sec.map((p) => Math.abs(p[0])));
  const planMax = Math.max(...v.plan.map((p) => p[1]));
  const [x0, x1] = [v.plan[0]![0], v.plan[v.plan.length - 1]![0]];
  const hi = (x: number) => (v.top ? at(v.top, x) : Infinity);
  const lo = (x: number) => (v.bottom ? at(v.bottom, x) : -Infinity);
  const secY = v.sec.map((p) => p[1]);
  const [s0, s1] = [Math.min(...secY), Math.max(...secY)];
  const y0 = Math.max(s0, v.bottom ? Math.min(...v.bottom.map((p) => p[1])) : -Infinity);
  const y1 = Math.min(s1, v.top ? Math.max(...v.top.map((p) => p[1])) : Infinity);
  const ys = [...secY, ...(v.top ?? []).map((p) => p[1]), ...(v.bottom ?? []).map((p) => p[1]), y0, y1].filter((y) => y >= y0 && y <= y1);
  const sec = (y: number) => halfAt(v.sec, Math.min(Math.max(y, s0 + 1e-6), s1 - 1e-6));
  return {
    x0, x1, y0, y1, ys,
    hw: (y: number) => (sec(y) * planMax) / hw0,
    // the first station (2 cm steps) the elevation reaches at height y
    front: (y: number) => {
      for (let x = x0; x <= x1 + 1e-9; x += 0.02) if (lo(x) <= y + 1e-6 && hi(x) >= y - 1e-6) return x;
      return x1;
    },
    width: (x: number, y: number) => (lo(x) <= y + 1e-6 && hi(x) >= y - 1e-6 ? (at(v.plan, x) * sec(y)) / hw0 : 0),
    bands: v.bands.map(([a, b, m]): LodBand => [a, b, m]),
  };
}

/**
 * The shells of a streamlined body (Steam.volume, one or several stacked): at
 * each height the widest volume there, the front where the elevations reach, as
 * a nose shell (the rounded front as a vee, from the plans) and a body behind it
 * to the rearmost station with a flat rear. A volume standing on a wider one
 * steps in by a 3 cm slope, which closes the ledge.
 */
function volumeShells(vols: readonly Volume[], X: (x: number) => number): LodShell[] {
  const vs = vols.map(sampleVolume);
  const covering = (y: number) => vs.filter((v) => y >= v.y0 - 1e-9 && y <= v.y1 + 1e-9);
  const outer = (y: number) => covering(y).reduce((a, v) => (v.hw(y) > a.hw(y) + 1e-9 ? v : a));
  // the heights: every volume's, and a step just above a volume's top where a narrower one goes on
  let ys = [...new Set(vs.flatMap((v) => v.ys))];
  for (const v of vs) {
    const above = vs.filter((w) => w !== v && w.y1 > v.y1 + 0.05 && w.y0 < v.y1);
    if (above.length) ys = ys.filter((y) => y <= v.y1 || y >= v.y1 + 0.03).concat([v.y1 + 0.03]);
  }
  ys = [...new Set(ys.map((y) => Math.round(y * 1e6) / 1e6))].sort((a, b) => a - b);
  const rows = ys.flatMap((y) => {
    const c = covering(y);
    if (!c.length) return [];
    const v = outer(y);
    const f = Math.min(...c.map((w) => w.front(y)));
    let w = f;
    const x1 = Math.max(...c.map((u) => u.x1));
    while (w < x1 && Math.max(...c.map((u) => u.width(w, y))) < 0.9 * v.hw(y)) w += 0.02;
    return [{ y, f, sb: w - f, hw: v.hw(y) }];
  });
  // an apex comes down 1 cm: its 6 cm ridge (offZero) must not share the plane of a cab roof at the same height
  const last = rows[rows.length - 1]!;
  if (last.hw < 0.03) last.y -= 0.01;
  // the paint: each volume's bands where it is the outermost
  const bands: LodBand[] = [];
  for (let i = 0; i + 1 < rows.length; i++) {
    const [ya, yb] = [rows[i]!.y, rows[i + 1]!.y];
    const v = outer((ya + yb) / 2);
    for (const [a, b, m] of v.bands) {
      const [lo, hi] = [Math.max(a, ya), Math.min(b, yb)];
      if (hi > lo + 1e-9) bands.push([lo, hi, m]);
    }
  }
  const paint = dropThin(joinBands(bands));
  const ymin = rows[0]!.y;
  const hw: Table = offZero(simplifyTable(rows.map((r) => [r.y, r.hw] as const), 0.2));
  const kinked = rows.filter((r) => hw.some(([y]) => Math.abs(y - r.y) < 1e-9));
  const split = Math.max(...kinked.map((r) => r.f + r.sb));
  const [x0, x1] = [Math.min(...vs.map((v) => v.x0)), Math.max(...vs.map((v) => v.x1))];
  const out: LodShell[] = [];
  if (split - Math.min(...kinked.map((r) => r.f)) > 0.25) {
    out.push({
      y0: ymin, xc: X(split), hw, side: paint, end: paint, roof: paint[paint.length - 1]![2], ends: [1],
      // the nose sampled only where the section kinks: a layer costs eight triangles here
      tip: kinked.map((r) => [r.y, Math.max(split - r.f, 0.1)] as const),
      setback: kinked.map((r) => [r.y, Math.min(r.sb, 0.9 * Math.max(split - r.f, 0.1))] as const),
    });
  }
  const from = out.length ? split : x0;
  if (x1 - from > 0.05) out.push(boxShell(X(x1), X(from), hw, paint, { ends: out.length ? [-1] : [-1, 1] }));
  return out;
}

/** Bands sorted, gaps closed, neighbours of one material joined. */
function joinBands(bands: readonly LodBand[]): LodBand[] {
  const out: LodBand[] = [];
  for (const [a, b, m] of [...bands].sort((p, q) => p[0] - q[0])) {
    const last = out[out.length - 1];
    if (last && last[2] === m) out[out.length - 1] = [last[0], Math.max(last[1], b), m];
    else out.push([last ? Math.max(a, last[1]) : a, b, m]);
  }
  return out;
}

/** Two paints that read as one from afar: no channel more than 24 apart. */
function alike(palette: Record<string, MaterialSpec>, a: string, b: string): boolean {
  const rgb = (m: string) => { const c = palette[m]?.color ?? "#000000"; return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); };
  const [p, q] = [rgb(a), rgb(b)];
  return a === b || p.every((v, i) => Math.abs(v - q[i]!) <= 24);
}

/** A horizontal hexagon of radius r about height y (flat top and bottom) as a (y, half width) table. */
export const hexagon = (y: number, r: number): Table => [[y - r * 0.866, r * 0.5], [y, r], [y + r * 0.866, r * 0.5]];

/**
 * A steam locomotive or tender from afar, from its LocoSpec: boiler and
 * smokebox (an octagon along x, a hexagon where the budget is short), chimney,
 * domes, cab, tanks, bunkers and tender bodies, streamlined volumes, running
 * board, frames, cylinders, deflectors, buffer beams and the wheels as blocks in
 * their paint reaching the rail. Fits `budget` (fitLod: beams, cab windows,
 * cylinders, the valance and frames give way first, then deflectors and domes,
 * then the bodies' profile detail and bands).
 */
export function steamLocoLod(spec: LocoSpec, budget = 100): MeshBuilder {
  const core = (lod: { palette: Record<string, MaterialSpec>; shells: LodShell[]; parts: LodPart[] }) =>
    fitLod({ ...lod, parts: lod.parts.filter((p) => p.optional === undefined || p.optional >= 50), shells: lod.shells.map((sh) => ({ ...sh, sideWindows: [] })) }, 1e6).triangleCount();
  // the round boiler first; a hexagon where the bodies, domes and deflectors would not fit beside
  // it; last, a smokebox in the barrel's paint
  const octo = steamLodSpec(spec, octagon);
  if (core(octo) <= budget) return fitLod(octo, budget);
  try {
    return fitLod(steamLodSpec(spec, hexagon), budget);
  } catch {
    return fitLod(steamLodSpec(spec, hexagon, true), budget);
  }
}

/** The LodSpec of a steam locomotive or tender, its boiler's section drawn by `ring` (octagon or hexagon). */
export function steamLodSpec(spec: LocoSpec, ring: (y: number, r: number) => Table = octagon, oneColour = false): { palette: Record<string, MaterialSpec>; shells: LodShell[]; parts: LodPart[] } {
  const xc = (spec.heads[0] + spec.heads[1]) / 2;
  const X = (x: number) => xc - x;
  const palette = { ...STEAM_PALETTE, ...spec.palette };
  const paint = (mat: string, y0: number, y1: number): LodBand[] => [[y0, y1, mat]];
  // the bodies: [shell, fixed ends or null (decided by what hides them)]
  const bodies: Array<[LodShell, readonly number[] | null]> = [];
  // the boiler: drawn as parts (its section is never simplified), but it hides the ends of what abuts it
  const boiler: LodShell[] = [];

  const b = spec.boiler;
  if (b) {
    const barrel = (b as { paint?: string }).paint ?? "paint";
    const sx = b.x0 + b.smokebox;
    const br = ring(b.y, b.r);
    const top = br[br.length - 1]![0];
    if (oneColour || alike(palette, "smokebox", barrel)) boiler.push({ ...boxShell(X(b.x1), X(b.x0), br, paint(barrel, br[0]![0], top)), ends: [1] });
    else {
      const sm = ring(b.y, b.r + 0.04);
      boiler.push({ ...boxShell(X(sx), X(b.x0), sm, paint("smokebox", sm[0]![0], sm[sm.length - 1]![0])), ends: [1] });
      if (b.x1 - sx > 0.05) boiler.push({ ...boxShell(X(b.x1), X(sx), br, paint(barrel, br[0]![0], top)), ends: [] });
    }
  }
  const volumes = spec.volumes?.length ? volumeShells(spec.volumes, X) : [];
  for (const sh of volumes) bodies.push([sh, sh.ends ?? null]);

  const c = spec.cab;
  if (c) {
    const hw = simplifyTable(halfTable(c.half), 0.2);
    const [y0, top] = [hw[0]![0], hw[hw.length - 1]![0]];
    const mat = c.mat ?? "paint";
    // a streamlined cab carries its casing's stripes
    const casing = volumes.reduce<LodShell | null>((a, s) => (!a || extentOf(s).top > extentOf(a).top ? s : a), null);
    const side = joinSameColour(casing ? clipBands(casing.side, y0, top) : [[y0, top, mat]], palette);
    // the side windows as one band, its edges moved onto the profile's kinks nearby (no sliver layers)
    const snap = (y: number) => hw.reduce((a, [k]) => (Math.abs(k - y) < Math.abs(a - y) ? k : a), y);
    const windows = windowBands(c.windows.map((w) => ({ u: [X(w.x1), X(w.x0)] as const, y: [w.y0, w.y1] as const })), 0.6).map((w): LodRect => {
      const [a, b2] = [snap(w.y[0]), snap(w.y[1])];
      return { ...w, y: [Math.abs(a - w.y[0]) < 0.15 ? a : w.y[0], Math.abs(b2 - w.y[1]) < 0.15 ? b2 : w.y[1]], optional: 15 + (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]) };
    });
    bodies.push([boxShell(X(c.x1), X(c.x0), hw, side, { roof: "roof", sideWindows: windows }), null]);
  }
  // a prism standing on another (a coal box on its bunker, toolboxes) is a part that may give way
  const toppers: LodShell[] = [];
  const heaps: LodPart[] = [];
  for (const p of spec.prisms ?? []) {
    const hw = simplifyTable(halfTable(p.half), 0.2);
    const top = hw[hw.length - 1]![0];
    const mat = p.mat ?? "paint";
    // a bunker or tender body topped by the coal: its crown is the coal
    const co = spec.coal;
    const coal = co && Math.abs(top - co.y) < 0.2 && Math.min(co.x1, p.x1) - Math.max(co.x0, p.x0) > 0.5 * (co.x1 - co.x0);
    const sh = boxShell(X(p.x1), X(p.x0), hw, paint(mat, hw[0]![0], top), { roof: coal ? "coal" : mat });
    // the heap above the rim
    if (co && coal && co.y + co.rise > top + 0.1) heaps.push({ optional: 40, draw: (m) => m.scope("coal", () => lodRoofBox(m, "coal", X(co.x1), X(co.x0), Math.min(co.half, lerp(hw, top)), co.half * 0.4, top, co.y + co.rise)) });
    const onTop = (spec.prisms ?? []).some((q) => q !== p && Math.abs(q.half[q.half.length - 1]![1] - hw[0]![0]) < 0.05 && q.x0 <= p.x0 + 0.2 && q.x1 >= p.x1 - 0.2);
    if (onTop) toppers.push(sh);
    else bodies.push([sh, null]);
  }
  const all = [...bodies.map(([s]) => s), ...boiler, ...toppers];
  const shells = bodies.map(([s, ends]) => ({ ...s, ends: visibleEnds(s, all, ends ?? [-1, 1]) }));

  const parts: LodPart[] = [...heaps];
  if (boiler.length) parts.push({ draw: (m) => m.scope("boiler", () => { for (const sh of boiler) lodShell(m, { ...sh, ends: visibleEnds(sh, all, sh.ends) }); }) });
  for (const t of toppers) {
    const ext = extentOf(t);
    parts.push({ optional: 55 + (ext.X1 - ext.X0) * (ext.top - ext.y0), draw: (m) => m.scope("bunker top", () => lodShell(m, { ...t, ends: visibleEnds(t, all) })) });
  }
  if (spec.chimney) {
    const ch = spec.chimney;
    const base = ch.base ?? (b ? b.y + b.r * 0.6 : 0);
    parts.push({ draw: (m) => m.scope("chimney", () => lodShell(m, standing(X(ch.x), base, ch.top, ch.r + 0.03, ch.r + 0.03, "smokebox"))) });
  }
  if (b) for (const d of spec.domes ?? []) {
    // a dome from afar: a hipped block from inside the boiler to its top
    const len = d.len ?? 2 * d.r;
    const [x0, x1] = [X(d.x) - len / 2, X(d.x) + len / 2];
    parts.push({ optional: 60 + len, draw: (m) => m.scope("dome", () => lodHipRoof(m, d.mat ?? "paint", x0, x1, -d.r, d.r, b.y + b.r * 0.7, d.top, Math.min(len, 2 * d.r) * 0.2)) });
  }
  const rb = spec.runningBoard;
  if (rb) {
    // the board's top and front edge; its valance (a white or red line on some) given up early
    const segs = rb.profile.slice(1).map((q, i) => [rb.profile[i]!, q] as const).filter(([p, q]) => Math.abs(q[0] - p[0]) >= 0.25);
    const val = rb.valance ?? 0.12;
    const mat = rb.mat ?? "black", vmat = rb.valanceMat ?? mat;
    parts.push({ draw: (m) => m.scope("running board", () => {
      for (const [[xa, ya], [xb, yb]] of segs) {
        const [Xa, Xb] = [X(xa), X(xb)];
        lodPolygon(m, mat, [[Xa, ya, -rb.half], [Xa, ya, rb.half], [Xb, yb, rb.half], [Xb, yb, -rb.half]], [(yb - ya) * Math.sign(Xa - Xb), Math.abs(Xb - Xa), 0]);
      }
      // the front edge 1 cm proud: the frames may end in its plane
      const [xf, yf] = segs[0]![0];
      const Xf = X(xf) + 0.01;
      lodPolygon(m, mat, [[Xf, yf - 0.04 - val, -rb.half], [Xf, yf - 0.04 - val, rb.half], [Xf, yf, rb.half], [Xf, yf, -rb.half]], [1, 0, 0]);
    }) });
    parts.push({ optional: vmat === mat ? 25 : 45, draw: (m) => m.scope("valance", () => {
      for (const [[xa, ya], [xb, yb]] of segs) sidePlates(m, vmat, [[X(xa), ya - 0.04 - val], [X(xb), yb - 0.04 - val], [X(xb), yb], [X(xa), ya]], rb.half);
    }) });
  }
  const g = spec.gear;
  parts.push({ draw: (m) => m.scope("running gear", () => wheelBlocks(m, g.wheelMaterial, g.wheels.map((w) => ({ X: X(w.x), d: w.d })), 0.84)) });
  if (spec.frame) {
    const f = spec.frame;
    // the plate frames between the wheel groups: their sides only
    parts.push({ draw: (m) => m.scope("frames", () => lodSideBox(m, "frame", [[X(f.x1), 0.45], [X(f.x0), 0.45], [X(f.x0), f.top], [X(f.x1), f.top]], -0.6, 0.6, false)) });
  }
  for (const e of g.engines) {
    const cy = e.cylinder;
    parts.push({ optional: 20, draw: (m) => m.scope("cylinders", () => lodSideBox(m, "paint", [[X(cy.x1), cy.y - cy.r], [X(cy.x0), cy.y - cy.r], [X(cy.x0), cy.y + cy.r], [X(cy.x1), cy.y + cy.r]], -(g.cylinderZ + cy.r), g.cylinderZ + cy.r)) });
  }
  if (spec.deflectors) {
    const d = spec.deflectors;
    parts.push({ optional: 50, draw: (m) => m.scope("smoke deflectors", () => { sidePlates(m, "paint", hullOf(d.outlines.flat().map(([x, y]): Pt => [X(x), y]), 5), d.z + 0.025); }) });
  }
  const beams = spec.beams ?? {};
  for (const e of [1, -1]) {
    if ((e > 0 ? beams.front : beams.rear) === false) continue;
    const head = e > 0 ? spec.heads[0] : spec.heads[1];
    const len = beams.length?.[e > 0 ? 0 : 1] ?? 0.62;
    const face = X(head + e * len) + e * 0.004;
    const [y0, y1, half] = [beams.y0 ?? 0.78, beams.y1 ?? 1.32, beams.half ?? 1.45];
    const inner = face - e * 0.16;
    const [a, c2] = [Math.min(face, inner), Math.max(face, inner)];
    parts.push({ optional: 47, draw: (m) => m.scope("buffer beam", () => lodSideBox(m, "beam", [[a, y0], [c2, y0], [c2, y1], [a, y1]], -half, half)) });
  }
  return { palette, shells, parts };
}

/** `bands` clipped to y0..y1 (lodKit's lodBands, here for a band list that may not reach). */
function clipBands(bands: readonly LodBand[], y0: number, y1: number): LodBand[] {
  const out: LodBand[] = [];
  for (const [a, b, m] of bands) {
    const lo = Math.max(a, y0), hi = Math.min(b, y1);
    if (hi > lo + 1e-9) out.push([lo, hi, m]);
  }
  if (!out.length) return [[y0, y1, bands[0]![2]]];
  out[0] = [y0, out[0]![1], out[0]![2]];
  out[out.length - 1] = [out[out.length - 1]![0], y1, out[out.length - 1]![2]];
  return out;
}

// --- freight wagons -----------------------------------------------------------------------------

/** The (y, half width) table of a convex (z, y) section between its lowest and highest point. */
export function sectionTable(section: readonly Pt[], y0?: number, y1?: number): Table {
  const ys = [...new Set(section.map((p) => p[1]))].sort((a, b) => a - b);
  const [lo, hi] = [y0 ?? ys[0]!, y1 ?? ys[ys.length - 1]!];
  const pts = [lo, ...ys.filter((y) => y > lo + 1e-6 && y < hi - 1e-6), hi];
  const sec = [...section];
  return pts.map((y) => [y, halfAt(sec, Math.min(Math.max(y, ys[0]! + 1e-7), ys[ys.length - 1]! - 1e-7))] as const);
}

/**
 * A stack of JT7 clip solids (freightWagonParts.ts) as one shell: the sections'
 * half widths and the elevations' lengths at each height, about the elevations'
 * common centre; model X = x - centre.
 */
export function clipShell(centre: number, clips: readonly Clip[], side: readonly LodBand[], o: { end?: readonly LodBand[]; roof?: string; ends?: readonly number[] } = {}): LodShell {
  const span = (c: Clip, y: number): [number, number] | null => {
    const e = c.elevation!;
    let [a, b] = [Infinity, -Infinity];
    for (let i = 0; i < e.length; i++) {
      const [p, q] = [e[i]!, e[(i + 1) % e.length]!];
      if ((p[1] - y) * (q[1] - y) > 1e-12) continue;
      const xs = Math.abs(q[1] - p[1]) < 1e-12 ? [p[0], q[0]] : [p[0] + ((y - p[1]) / (q[1] - p[1])) * (q[0] - p[0])];
      for (const x of xs) [a, b] = [Math.min(a, x), Math.max(b, x)];
    }
    return a <= b ? [a, b] : null;
  };
  const ys = [...new Set(clips.flatMap((c) => [...c.section!, ...c.elevation!].map((p) => p[1])))].sort((a, b) => a - b);
  const yTop = Math.max(...clips.map((c) => Math.max(...c.elevation!.map((p) => p[1]))));
  const yBot = Math.min(...clips.map((c) => Math.min(...c.elevation!.map((p) => p[1]))));
  const hs = ys.filter((y) => y >= yBot - 1e-9 && y <= yTop + 1e-9);
  // the clip covering each height (the upper one where two meet)
  const owner = (y: number) => [...clips].reverse().find((c) => {
    const ey = c.elevation!.map((p) => p[1]), sy = c.section!.map((p) => p[1]);
    return y >= Math.max(Math.min(...ey), Math.min(...sy)) - 1e-9 && y <= Math.min(Math.max(...ey), Math.max(...sy)) + 1e-9;
  });
  const rows = hs.flatMap((y) => {
    const c = owner(y);
    if (!c) return [];
    const s = span(c, y)!;
    const sy = c.section!.map((p) => p[1]);
    return [{ y, s, hw: halfAt([...c.section!], Math.min(Math.max(y, Math.min(...sy) + 1e-7), Math.max(...sy) - 1e-7)) }];
  });
  const mid = (Math.min(...rows.map((r) => r.s[0])) + Math.max(...rows.map((r) => r.s[1]))) / 2;
  return {
    y0: rows[0]!.y, xc: mid - centre,
    tip: rows.map((r) => [r.y, (r.s[1] - r.s[0]) / 2] as const),
    hw: offZero(rows.map((r) => [r.y, r.hw] as const)),
    side, end: o.end ?? side, roof: o.roof ?? side[side.length - 1]![2],
    ...(o.ends ? { ends: o.ends } : {}),
  };
}

/** A wagon's distant model: its bodies as shells, the rest as parts (wagonBogies, wagonAxles, drawGearLod ...). */
export interface WagonLodSpec {
  palette: Record<string, MaterialSpec>;
  shells: LodShell[];
  parts: LodPart[];
}

/** Two-axle bogies (centre, wheelbase) from source x, `top` their frames' top. */
export function wagonBogies(centre: number, bogies: ReadonlyArray<readonly [number, number]>, top: number, r = 0.46): LodPart {
  return { draw: (m) => m.scope("running gear", () => { for (const [x, wb] of bogies) lodBogie(m, x - centre, wb / 2 + r + 0.2, top, 1.12); }) };
}

/** A two-axle wagon's wheelsets at source x: each a block narrowing toward the rail, up to `top`. */
export function wagonAxles(centre: number, xs: readonly number[], top: number, r = 0.46): LodPart {
  return { draw: (m) => m.scope("running gear", () => { for (const x of xs) lodSideBox(m, "bogie", [[x - centre - r * 0.6, 0.02], [x - centre + r * 0.6, 0.02], [x - centre + r + 0.12, top], [x - centre - r - 0.12, top]], -0.95, 0.95); }) };
}

/** The buffer beams: at each end the beam's source x range, its height and half width. */
export function drawGearLod(centre: number, beams: ReadonlyArray<readonly [number, number]>, y0: number, y1: number, half: number, mat: string, optional = 10): LodPart {
  return { optional, draw: (m) => m.scope("draw gear", () => { for (const [a, b] of beams) lodSideBox(m, mat, [[Math.min(a, b) - centre, y0], [Math.max(a, b) - centre, y0], [Math.max(a, b) - centre, y1], [Math.min(a, b) - centre, y1]], -half, half); }) };
}

/** A box shell over source x0..x1 of a wagon (model X = x - centre). */
export function wagonBox(centre: number, x0: number, x1: number, hw: Table, side: readonly LodBand[], o: Parameters<typeof boxShell>[4] = {}): LodShell {
  return boxShell(x0 - centre, x1 - centre, hw, side, o);
}

/** Plates on both sides at |z| = hz through the convex source (x, y) outline (a fishbelly, a brace). */
export function platesPart(centre: number, mat: string, poly: readonly Pt[], hz: number, optional?: number): LodPart {
  return { ...(optional !== undefined ? { optional } : {}), draw: (m) => m.scope("side plates", () => sidePlates(m, mat, poly.map(([x, y]): Pt => [x - centre, y]), hz)) };
}

/** A block over source x0..x1, y0..y1 across -hz..hz: sides and ends (equipment, a platform, chutes, bolsters). */
export function blockPart(centre: number, mat: string, x0: number, x1: number, y0: number, y1: number, hz: number, optional?: number): LodPart {
  const [a, b] = [Math.min(x0, x1) - centre, Math.max(x0, x1) - centre];
  return { ...(optional !== undefined ? { optional } : {}), draw: (m) => m.scope("block", () => lodSideBox(m, mat, [[a, y0], [b, y0], [b, y1], [a, y1]], -hz, hz)) };
}

/** A box narrowing from half width w0 to w1 over source x0..x1, y0..y1 (lodRoofBox: sides, ends and top): a ridge, a platform. */
export function roofBoxPart(centre: number, mat: string, x0: number, x1: number, w0: number, w1: number, y0: number, y1: number, optional?: number): LodPart {
  return { ...(optional !== undefined ? { optional } : {}), draw: (m) => m.scope("box", () => lodRoofBox(m, mat, x0 - centre, x1 - centre, w0, w1, y0, y1)) };
}

/**
 * An open-topped box over source x0..x1, y0..y1, half width `half`, walls `t`
 * thick: its outer and inner walls and the rim (an open wagon, seen into from above;
 * the floor is what stands below y0).
 */
export function openBoxPart(centre: number, mat: string, x0: number, x1: number, half: number, y0: number, y1: number, t: number, inner = mat): LodPart {
  const [a, b] = [x0 - centre, x1 - centre];
  return { draw: (m) => m.scope("open body", () => {
    for (const [k, [p, q]] of ([[0, [[a, half], [b, half]]], [1, [[b, -half], [a, -half]]], [2, [[b, half], [b, -half]]], [3, [[a, -half], [a, half]]]] as const)) {
      void k;
      // the wall's outer face, its inner face (t in) and its rim
      const n: Vec3 = [p[0] === q[0] ? Math.sign(p[0]) : 0, 0, p[0] === q[0] ? 0 : Math.sign(p[1])];
      const inP: Pt = [p[0] - n[0] * t, p[1] - n[2] * t], inQ: Pt = [q[0] - n[0] * t, q[1] - n[2] * t];
      lodPolygon(m, mat, [[p[0], y0, p[1]], [q[0], y0, q[1]], [q[0], y1, q[1]], [p[0], y1, p[1]]], n);
      lodPolygon(m, inner, [[inP[0], y0, inP[1]], [inQ[0], y0, inQ[1]], [inQ[0], y1, inQ[1]], [inP[0], y1, inP[1]]], [-n[0], 0, -n[2]]);
      lodPolygon(m, mat, [[p[0], y1, p[1]], [q[0], y1, q[1]], [inQ[0], y1, inQ[1]], [inP[0], y1, inP[1]]], [0, 1, 0]);
    }
  }) };
}

/** A freight wagon from afar (fitLod within `budget`). */
export function freightWagonLod(spec: WagonLodSpec, budget = 100): MeshBuilder {
  const shells = spec.shells.map((s) => ({ ...s, ends: visibleEnds(s, spec.shells, s.ends ?? [-1, 1]) }));
  return fitLod({ palette: spec.palette, shells, parts: spec.parts }, budget);
}

