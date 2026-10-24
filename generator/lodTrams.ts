// The dedicated low level of detail (docs/models/lod.md) of the trams
// (trams.ts on tramKit.ts), the Czech and Slovak coaches in their later
// liveries (liveryCoach.ts) and the German double-deck coaches
// (germanCoachParts.ts). All three families build their bodies as volumes of
// csdCoachParts.ts - an XML section scaled along a plan and clamped by an
// elevation - so one reading serves them all: `volumeShell` turns a volume into
// plan-ring tables an end at a time, for the kit's shell with two ends of its
// own (a tram section's rounded cab end and flat joint end, a driving trailer's
// sloped cab and flat gangway end), fitted by the kit's `fitLod`.
//
// Metres, +X forward, +Y up, +Z right, as the full models.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import {
  fitLod, lerp, lodBands, lodBogie, lodPantograph, lodPolygon, lodRod, lodRoofBox, lodSideBox, simplifyTable, windowBands, LOD_GLASS,
  type LodBand, type LodEnd, type LodPart, type LodRect, type LodSections, type LodShell, type Table,
} from "./lodKit.ts";
import { COACH_PALETTE, px, sectionHalf, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { fpx, mirror, type PxBox } from "./csdCoaches.ts";
import { knee, Tram, TRAM_PALETTE, type SourceVolume, type TramMap } from "./tramKit.ts";
import type { LiveryCoachSpec } from "./liveryCoach.ts";

// --- reading a volume ---------------------------------------------------------------------


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
  const inside = (x: number, y: number) => (!v.bottom || lerp(v.bottom, x) <= y + 1e-6) && (!v.top || lerp(v.top, x) >= y - 1e-6);
  // the extreme x inside the elevation at height y, toward end e
  const extreme = (y: number, e: number): number => {
    const cands = [...stations];
    for (let i = 0; i + 1 < stations.length; i++) {
      const [a, b] = [stations[i]!, stations[i + 1]!];
      for (const line of [v.top, v.bottom]) {
        if (!line) continue;
        const [ya, yb] = [lerp(line, a), lerp(line, b)];
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
      area += ((H - lerp(v.plan, a) + H - lerp(v.plan, b)) / 2) * (b - a);
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
  collector(m, mat, p.x, base + lift + 0.03, p.bow ?? 0.85); // its ridge at head, as the full collector's carbon
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
  const shells: LodShell[] = [];
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
      ...(frontCab || rearCab ? { cabs: [
        ...(frontCab ? [{ x0: t.fx(spec.cabs[0]), x1: 1e3, side: glazed(scaled(spec.cab), spec.glass, tab.y0, tab.top) }] : []),
        ...(rearCab ? [{ x0: -1e3, x1: t.fx(spec.cabs[1]), side: glazed(scaled(spec.cab), spec.glass, tab.y0, tab.top) }] : []),
      ] } : {}),
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
  return fitLod({
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
  const shell: LodShell = {
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
  return fitLod({ palette: { ...COACH_PALETTE, ...spec.palette }, shells: [shell], parts }, budget);
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
  const shell: LodShell = {
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
  return fitLod({ palette: { ...COACH_PALETTE, ...spec.palette }, shells: [shell], parts }, budget);
}
