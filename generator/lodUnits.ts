// The dedicated low level of detail of the multiple units and railcars
// (docs/models/lod.md): the Czech DMUs (dmuKit.ts), the classic Czech EMUs
// (emuClassicKit.ts), the CD 471 and 680, the foreign units (unitParts.ts: DB
// 628, MAV MDmot, ICE 1, TGV), the JR KiHa 40 and the 81-71 metro car.
//
// Every one of these bodies is lofted by the coach builder (csdCoachParts.ts)
// from a section, a plan and an elevation, or ends in a painted cab nose
// (cabNose.ts). The adapters here read those same tables: `coachBody` turns a
// car's volumes into a unit body (the section's half widths, each end's centre
// line and the plan's rounding as the corners' setback, the bands as side and
// end paint), `noseEnd` turns a cab nose's profile, half widths and corner
// radii into an end. A unit body is the shared kit's shell with its two ends
// from their own tables, so a single-cab car keeps its nose and a square inner
// end; `fitUnit` fits it with the kit's `fitLod`.
//
// Metres, +X forward, +Y up, +Z right, as the full models.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import {
  fitLod, LATE, LOD_GLASS, lerp, lodBandAt, lodBands, lodBogie, lodPantograph, lodRoofBox, lodSideBox, sameBands,
  windowBands, type LodBand, type LodPart, type LodRect, type LodSections, type LodShell, type Table,
} from "./lodKit.ts";
import { sectionHalf, type Pt, type Volume } from "./csdCoachParts.ts";
import type { NoseSpec } from "./cabNose.ts";
import { frameMaps, scaleVolume, type CarFrame, type EndItem, type PxBox, type SideItem } from "./dmuKit.ts";

/** The running gear's and roof equipment's materials, under every unit's own palette. */
export const UNIT_LOD_PALETTE: Record<string, MaterialSpec> = {
  bogie: { color: "#353739", roughness: 0.8 },
  underframe: { color: "#26282a", roughness: 0.85 },
  pantograph: { color: "#4b4f55", metallic: 0.2, roughness: 0.6 },
  bellows: { color: "#2a2b2d", roughness: 0.9 },
};

// --- the body -------------------------------------------------------------------------------

/** One end of a unit body. */
export interface UnitEnd {
  /** [y, x] of the end's centre line in model x (its outermost point at that height), bottom first; one row: a flat end. */
  tip: Table;
  /** [y, setback] of the corners behind the centre line: a rounded or pointed nose seen from above. */
  setback?: Table;
  /** The end's paint, bottom first to the crown; default the sides'. */
  paint?: readonly LodBand[];
  /** Windscreens: u across the end as seen from outside it (z at the +X end, -z at the -X end), y up. */
  windows?: readonly LodRect[];
  /** Not drawn: an end inside an articulated set, covered by its bellows. */
  hidden?: boolean;
}

/** A car body: its section's half widths, its two ends, its side paint, cab paint and windows. */
export interface UnitBody {
  /** The body's bottom. */
  y0: number;
  /** [y, half width], bottom first; the last row is the crown. */
  hw: Table;
  /** The sides' paint, bottom first, to the crown. */
  side: readonly LodBand[];
  /** The crown's cap. */
  roof: string;
  front: UnitEnd;
  rear: UnitEnd;
  /** Cab paint: from model x0 to x1 the sides carry these bands instead. */
  cabs?: ReadonlyArray<{ x0: number; x1: number; side: readonly LodBand[] }>;
  /** Side windows, u = model x. */
  windows?: readonly LodRect[];
  /** The section of an articulated LOD it belongs to; default 0. */
  section?: number;
}

/** A unit's whole LOD: bodies, parts besides them and an articulated set's sections. */
export interface UnitSpec {
  palette: Record<string, MaterialSpec>;
  bodies: UnitBody[];
  parts: LodPart[];
  sections?: LodSections;
}

const tableYs = (...ts: Array<Table | undefined>): number[] => [...new Set(ts.flatMap((t) => (t ?? []).map(([y]) => y)))].sort((a, b) => a - b);

/** A body mirrored front to back (x to -x). */
function mirrorBody(b: UnitBody): UnitBody {
  const flip = (r: LodRect): LodRect => ({ ...r, u: [-r.u[1], -r.u[0]] });
  const end = (e: UnitEnd): UnitEnd => ({ ...e, tip: e.tip.map(([y, x]) => [y, -x] as const), ...(e.windows ? { windows: e.windows.map(flip) } : {}) });
  return {
    ...b, front: end(b.rear), rear: end(b.front),
    ...(b.cabs ? { cabs: b.cabs.map((c) => ({ ...c, x0: -c.x1, x1: -c.x0 })) } : {}),
    ...(b.windows ? { windows: b.windows.map(flip) } : {}),
  };
}

/** A body moved along x by dx. */
export function shiftBody(b: UnitBody, dx: number): UnitBody {
  const end = (e: UnitEnd): UnitEnd => ({ ...e, tip: e.tip.map(([y, x]) => [y, x + dx] as const) });
  return {
    ...b, front: end(b.front), rear: end(b.rear),
    ...(b.cabs ? { cabs: b.cabs.map((c) => ({ ...c, x0: c.x0 + dx, x1: c.x1 + dx })) } : {}),
    ...(b.windows ? { windows: b.windows.map((w) => ({ ...w, u: [w.u[0] + dx, w.u[1] + dx] as const })) } : {}),
  };
}

/** A body turned end for end about x = cx (a set's rear car; the bodies are alike on both sides). */
export const turnBody = (b: UnitBody, cx: number): UnitBody => shiftBody(mirrorBody(b), 2 * cx);

/** An end shallower than this (its centre line's run and its corners' setback) is drawn flat opposite a nose. */
const SHALLOW = 0.5;
const depth = (e: UnitEnd): number => Math.max(Math.max(...e.tip.map(([, x]) => x)) - Math.min(...e.tip.map(([, x]) => x)), ...(e.setback ?? []).map(([, v]) => v));
/** A shallow end as a flat one at its outermost point (sign: +1 the +X end). */
const flatten = (e: UnitEnd, sign: number): UnitEnd => ({ ...e, tip: [[e.tip[0]![0], sign * Math.max(...e.tip.map(([, x]) => sign * x))]], setback: undefined });

/**
 * A unit body as the kit's shell, each end from its own tables (a single-cab
 * car's nose and flat inner end). A shallow end opposite a nose (a rounded
 * roof's last metre, a chamfered corner) is drawn flat: from afar its kinks are
 * not worth their layers.
 */
function toShell(b0: UnitBody): LodShell {
  let b = b0;
  const dF = depth(b.front), dR = depth(b.rear);
  if (dF > SHALLOW && dR > 1e-6 && dR <= SHALLOW) b = { ...b, rear: flatten(b.rear, -1) };
  else if (dR > SHALLOW && dF > 1e-6 && dF <= SHALLOW) b = { ...b, front: flatten(b.front, 1) };
  // the kit's tables run from the bottom to the crown: a one-row (flat) end is stretched over it
  const top = b.hw[b.hw.length - 1]![0];
  const span = (t: Table): Table => tableYs(t, [[b.y0, 0], [top, 0]]).filter((y) => y >= b.y0 && y <= top).map((y) => [y, lerp(t, y)] as const);
  const end = (e: UnitEnd) => ({ tip: span(e.tip), ...(e.setback ? { setback: e.setback } : {}), ...(e.paint ? { paint: e.paint } : {}) });
  return {
    y0: b.y0, hw: b.hw, side: b.side, roof: b.roof,
    front: end(b.front), rear: end(b.rear),
    ...(b.cabs ? { cabs: b.cabs } : {}),
    sideWindows: b.windows ?? [],
    endWindows: [...(b.front.windows ?? []).map((w) => ({ ...w, ends: [1] })), ...(b.rear.windows ?? []).map((w) => ({ ...w, ends: [-1] }))],
    ends: [...(b.rear.hidden ? [] : [-1]), ...(b.front.hidden ? [] : [1])],
    ...(b.section !== undefined ? { section: b.section } : {}),
  };
}

// --- fitting ----------------------------------------------------------------------------------

/**
 * Builds `spec` within `budget` triangles with the shared kit's `fitLod`: the
 * optional parts and small windows (second window rows ranked `LATE`, after
 * the profile), the profile's finer kinks, the least visible colour band -
 * given up on every car of a set alike, the roof band kept - then the smallest
 * window. Deterministic.
 */
export function fitUnit(spec: UnitSpec, budget: number): MeshBuilder {
  return fitLod({ palette: { ...UNIT_LOD_PALETTE, ...spec.palette }, shells: spec.bodies.map(toShell), parts: spec.parts, ...(spec.sections ? { sections: spec.sections } : {}), coarse: true }, budget);
}

// --- adapters: the coach builder's volumes and the cab noses ------------------------------------

/** A volume in its builder's x and the map from that x to model x (the Coach's `X`). */
export interface PlacedVolume {
  v: Volume;
  X: (x: number) => number;
}

/** The least setback a nose is drawn as a vee for: a flatter rounding is a flat end from afar. */
const NOSE_VEE = 0.15;

/** A volume's material in a LOD: its glass bands are the LOD glass. */
const lodMat = (mat: string): string => (/glass/i.test(mat) ? LOD_GLASS : mat);

/** A volume's bands as LOD paint from y0 to the crown. */
export function volumePaint(v: Volume, y0: number, top: number, map: (mat: string) => string = lodMat): LodBand[] {
  return lodBands(v.bands.map(([a, b, mat]): LodBand => [a, b, map(mat)]), y0, top);
}


/**
 * One end of a set of volumes (e = +1 the +X end): at each height the
 * outermost x where a volume stands (its elevation's top above, its bottom
 * below), and the plan's rounding behind it as the corners' setback - the
 * vee that leaves out as much plan as the rounding does.
 */
function volumeEnd(vols: readonly PlacedVolume[], e: number, ys: readonly number[]): { tip: Table; setback?: Table } {
  const tip: Array<readonly [number, number]> = [];
  const setback: Array<readonly [number, number]> = [];
  for (const y of ys) {
    let best = -Infinity, sb = 0;
    for (const { v, X } of vols) {
      const plan = v.plan;
      const [p0, p1] = [plan[0]![0], plan[plan.length - 1]![0]];
      const stand = (x: number) => (v.top ? lerp(v.top, x) >= y - 1e-6 : true) && (v.bottom ? lerp(v.bottom, x) <= y + 1e-6 : true);
      // the outermost standing x: sampled finely from the end inward
      const n = 400;
      let at: number | null = null;
      for (let i = 0; i <= n; i++) {
        const x = e > 0 ? p1 - ((p1 - p0) * i) / n : p0 + ((p1 - p0) * i) / n;
        if (stand(x)) { at = x; break; }
      }
      if (at === null) continue;
      // refine between the last sample out and this one
      // `inside` stands, `outside` (one sample further out) does not
      let [inside, outside] = [at, at + (e * (p1 - p0)) / n];
      if (e * (outside - (e > 0 ? p1 : p0)) > 1e-9) outside = inside;
      for (let k = 0; k < 30 && outside !== inside; k++) {
        const mid = (inside + outside) / 2;
        if (stand(mid)) inside = mid; else outside = mid;
      }
      const xs = inside;
      const mx = e * X(xs);
      if (mx > best) {
        best = mx;
        // the plan's rounding behind the tip: 2 x the area it leaves out over the half width
        const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
        let missing = 0;
        const m = 200, span = Math.min(4, p1 - p0);
        for (let i = 0; i < m; i++) {
          const x = e > 0 ? xs - (span * (i + 0.5)) / m : xs + (span * (i + 0.5)) / m;
          missing += Math.max(0, 1 - lerp(plan, x) / hw0) * (span / m);
        }
        sb = 2 * missing;
      }
    }
    tip.push([y, e * best]);
    setback.push([y, Math.round(sb * 1e4) / 1e4]);
  }
  const round = (t: Array<readonly [number, number]>) => t.map(([y, x]) => [y, Math.round(x * 1e4) / 1e4] as const);
  return { tip: round(tip), ...(setback.some(([, s]) => s > NOSE_VEE) ? { setback } : {}) };
}

/** The heights a set of volumes changes shape at: section and elevation stations. */
function volumeHeights(vols: readonly PlacedVolume[], y0: number, top: number): number[] {
  const ys = vols.flatMap(({ v }) => [...v.section.map((p) => p[1]), ...(v.top ?? []).map((p) => p[1]), ...(v.bottom ?? []).map((p) => p[1])]);
  return [...new Set([y0, top, ...ys].filter((y) => y >= y0 - 1e-9 && y <= top + 1e-9).map((y) => Math.round(y * 1e6) / 1e6))].sort((a, b) => a - b);
}

export interface CoachBodyOpts {
  /** The body's bottom (default the sections' lowest point). */
  y0?: number;
  /** Paint of the ends (default: the end volume's bands, or its end paint). */
  frontPaint?: readonly LodBand[];
  rearPaint?: readonly LodBand[];
  /** A flat end at this model x instead of the volumes' own (e.g. a cab nose drawn apart). */
  front?: UnitEnd;
  rear?: UnitEnd;
  /** The volume whose bands paint the sides (default the longest). */
  main?: number;
  windows?: readonly LodRect[];
  frontWindows?: readonly LodRect[];
  rearWindows?: readonly LodRect[];
  roof?: string;
  section?: number;
  /** Material renames for the LOD (e.g. a livery's band that is the full model's glass). */
  map?: (mat: string) => string;
}

/**
 * A unit body from a car's coach-builder volumes (csdCoachParts.ts): the
 * section's half widths, the ends from the plan and elevation, the main
 * volume's bands on the sides and the other volumes' bands as cab paint over
 * their length.
 */
export function coachBody(vols: readonly PlacedVolume[], o: CoachBodyOpts = {}): UnitBody {
  const map = o.map ?? lodMat;
  const len = (p: PlacedVolume) => p.v.plan[p.v.plan.length - 1]![0] - p.v.plan[0]![0];
  const main = o.main ?? vols.reduce((a, p, i) => (len(p) > len(vols[a]!) ? i : a), 0);
  const y0 = o.y0 ?? Math.min(...vols.flatMap(({ v }) => v.section.map((p) => p[1])));
  // the crown: the section's top, or lower where only a hump or housing mid-body stands higher
  // (both ends' centre lines more than 3 m back from the plan's ends): that is a roof part of its own
  const ys0 = volumeHeights(vols, y0, Math.max(...vols.flatMap(({ v }) => v.section.map((p) => p[1]))));
  const reach = (e: number) => Math.max(...vols.map((p) => e * p.X(e > 0 ? p.v.plan[p.v.plan.length - 1]![0] : p.v.plan[0]![0])));
  const whole = (y: number) => [1, -1].some((e) => reach(e) - e * lerp(volumeEnd(vols, e, [y]).tip, y) < 3);
  const top = ys0.filter(whole).pop()!;
  const ys = ys0.filter((y) => y <= top);
  const hw: Table = ys.map((y) => [y, Math.round(Math.max(...vols.map(({ v }) => sectionHalf(v.section, y))) * 1e4) / 1e4] as const);
  const mv = vols[main]!;
  const side = volumePaint(mv.v, y0, top, map);
  // a volume's own heights: its elevation's lowest bottom to its highest top
  const span = (p: PlacedVolume): [number, number] => [
    Math.max(y0, p.v.bottom ? Math.min(...p.v.bottom.map((q) => q[1])) : -Infinity),
    Math.min(top, p.v.top ? Math.max(...p.v.top.map((q) => q[1])) : Infinity),
  ];
  // its bands over its own heights, the main volume's elsewhere
  const own = (p: PlacedVolume, bands: LodBand[]): LodBand[] => {
    const [a, b] = span(p);
    const cuts = [...new Set([y0, top, a, b, ...side.flatMap(([u, v]) => [u, v]), ...bands.flatMap(([u, v]) => [u, v])])].filter((y) => y >= y0 && y <= top).sort((u, v) => u - v);
    const out: LodBand[] = [];
    for (let i = 1; i < cuts.length; i++) {
      const y = (cuts[i - 1]! + cuts[i]!) / 2;
      out.push([cuts[i - 1]!, cuts[i]!, lodBandAt(y >= a && y <= b ? bands : side, y)]);
    }
    return lodBands(out, y0, top);
  };

  const paint = (p: PlacedVolume): LodBand[] => (p.v.endPaint ? [[y0, top, p.v.endPaint]] : volumePaint(p.v, y0, top, map));
  // an end's paint: at each height the bands of the volume reaching furthest out there
  const endPaint = (e: number): LodBand[] => {
    const cuts = [...new Set([y0, top, ...vols.flatMap((p) => [...paint(p).flatMap(([u, v]) => [u, v]), ...span(p)])])].filter((y) => y >= y0 && y <= top).sort((a, b) => a - b);
    const out: LodBand[] = [];
    for (let i = 1; i < cuts.length; i++) {
      const y = (cuts[i - 1]! + cuts[i]!) / 2;
      const p = vols.reduce((a, q) => (lerp(volumeEnd([q], e, [y]).tip, y) * e > lerp(volumeEnd([a], e, [y]).tip, y) * e ? q : a));
      out.push([cuts[i - 1]!, cuts[i]!, lodBandAt(paint(p), y)]);
    }
    return lodBands(out, y0, top);
  };
  const cabs = vols.filter((_, i) => i !== main).map((p) => {
    const [a, b] = [p.X(p.v.plan[0]![0]), p.X(p.v.plan[p.v.plan.length - 1]![0])];
    return { x0: Math.min(a, b), x1: Math.max(a, b), side: own(p, volumePaint(p.v, y0, top, map)) };
  }).filter((c) => !sameBands(c.side, side)).sort((a, b) => a.x0 - b.x0)
    // neighbouring regions painted alike (a nose and its cab section) as one
    .reduce<Array<{ x0: number; x1: number; side: LodBand[] }>>((out, c) => {
      const last = out[out.length - 1];
      if (last && c.x0 <= last.x1 + 0.05 && sameBands(last.side, c.side)) last.x1 = Math.max(last.x1, c.x1);
      else out.push({ ...c });
      return out;
    }, []);
  const front: UnitEnd = { ...(o.front ?? volumeEnd(vols, 1, ys)), paint: o.frontPaint ?? o.front?.paint ?? endPaint(1), ...(o.frontWindows ? { windows: o.frontWindows } : {}) };
  const rear: UnitEnd = { ...(o.rear ?? volumeEnd(vols, -1, ys)), paint: o.rearPaint ?? o.rear?.paint ?? endPaint(-1), ...(o.rearWindows ? { windows: o.rearWindows } : {}) };
  return {
    y0, hw, side, roof: o.roof ?? side[side.length - 1]![2], front, rear,
    ...(cabs.length ? { cabs } : {}), ...(o.windows ? { windows: o.windows } : {}), ...(o.section !== undefined ? { section: o.section } : {}),
  };
}

/**
 * The end a cab nose (cabNose.ts) makes: its centre-line profile as the tip,
 * and its rounded corners and bulge as the setback of a vee leaving out as
 * much plan.
 */
export function noseEnd(s: Pick<NoseSpec, "e" | "xTip" | "profile" | "half" | "corner" | "bulge" | "rows">, paint?: readonly LodBand[], windows?: readonly LodRect[]): UnitEnd {
  const ys = [...new Set([...s.profile.map((p) => p[0]), ...s.half.map((p) => p[0]), ...s.corner.map((p) => p[0])])].filter((y) => y >= s.rows[0]! - 1e-9 && y <= s.rows[s.rows.length - 1]! + 1e-9).sort((a, b) => a - b);
  const tip: Table = ys.map((y) => [y, Math.round(s.e * (s.xTip - lerp(s.profile, y)) * 1e4) / 1e4] as const);
  const setback: Table = ys.map((y) => {
    const hw = lerp(s.half, y), r = Math.min(lerp(s.corner, y), hw * 0.98), a = hw - r, b = s.bulge ?? 0;
    return [y, Math.round(((2 * (b * a / 3 + b * r + r * r * (1 - Math.PI / 4))) / Math.max(hw, 1e-6)) * 1e4) / 1e4] as const;
  });
  return { tip, ...(setback.some(([, v]) => v > NOSE_VEE) ? { setback } : {}), ...(paint ? { paint } : {}), ...(windows ? { windows } : {}) };
}

/**
 * Side windows (model x boxes) as window bands: the row covering the most
 * length (windows of about one height) joined where their gaps are under
 * `gap`; a band shorter than 2 m and any window off that row are small
 * windows, optional parts given up smallest first.
 */
export function sideGlass(boxes: ReadonlyArray<{ x0: number; x1: number; y0: number; y1: number }>, gap: number, rows = 1): LodRect[] {
  const key = (b: { y0: number; y1: number }) => `${Math.round(b.y0 * 5)}|${Math.round(b.y1 * 5)}`;
  const length = new Map<string, number>();
  for (const b of boxes) length.set(key(b), (length.get(key(b)) ?? 0) + b.x1 - b.x0);
  const main = new Set([...length].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, rows).map(([k]) => k));
  const rects = (bs: typeof boxes) => windowBands(bs.map((b) => ({ u: [b.x0, b.x1] as const, y: [b.y0, b.y1] as const })), gap);
  const small = (w: LodRect): LodRect => ({ ...w, optional: (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]) });
  // the longest row is kept to the last; further rows give way before a colour band
  const order = [...length].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k).filter((k) => main.has(k));
  return order.flatMap((k, i) => rects(boxes.filter((b) => key(b) === k)).map((w) => (w.u[1] - w.u[0] < 2 ? small(w) : i > 0 ? { ...w, optional: LATE + (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]) } : w)))
    .concat(rects(boxes.filter((b) => !main.has(key(b)))).map(small));
}

/** Native side boxes (a classic EMU frame's `sb`) shifted to model x by the car's centre. */
export const shifted = (boxes: ReadonlyArray<{ x0: number; x1: number; y0: number; y1: number }>, centre: number) => boxes.map((b) => ({ ...b, x0: b.x0 - centre, x1: b.x1 - centre }));

// --- parts ----------------------------------------------------------------------------------

/** Bogies (centre x, half length, and the section it rides in) as dark blocks from the rail to the body's bottom. */
export function bogieParts(bogies: ReadonlyArray<readonly [x: number, half: number, section?: number]>, top: number): LodPart[] {
  return bogies.map(([x, half, section]) => ({ ...(section !== undefined ? { section } : {}), draw: (m: MeshBuilder) => m.scope("running gear", () => lodBogie(m, x, half, top)) }));
}

/** A two-axle car's wheelsets (x, wheel radius) as blocks to the body's bottom. */
export function axleParts(axles: ReadonlyArray<readonly [x: number, r: number]>, top: number): LodPart {
  return { draw: (m) => m.scope("running gear", () => { for (const [x, r] of axles) lodBogie(m, x, r + 0.35, top, 1.08); }) };
}

/** Underframe equipment from x0 to x1 as one dark box, an optional part. */
export function underPart(x0: number, x1: number, y0: number, y1: number, hw: number, optional: number | undefined = 50, section?: number, mat = "underframe"): LodPart {
  const [a, b] = [Math.min(x0, x1), Math.max(x0, x1)];
  return { ...(optional !== undefined ? { optional } : {}), ...(section !== undefined ? { section } : {}), draw: (m) => m.scope("equipment", () => lodSideBox(m, mat, [[a, y0], [b, y0], [b, y1], [a, y1]], -hw, hw)) };
}

/** A roof box from x0 to x1, half width w0 at its foot y0 narrowing to w1 at y1; short ones are optional. */
export function roofPart(mat: string, xa: number, xb: number, w0: number, w1: number, y0: number, y1: number, section?: number): LodPart {
  const [x0, x1] = [Math.min(xa, xb), Math.max(xa, xb)];
  return {
    ...(x1 - x0 < 2 ? { optional: 10 + (x1 - x0) } : {}), ...(section !== undefined ? { section } : {}),
    draw: (m) => m.scope("roof equipment", () => lodRoofBox(m, mat, x0, x1, w0, w1, y0, y1)),
  };
}

/** A unit's pantographs: the one at the lowest x raised (the rear), any other folded and optional. */
export function pantographParts(xs: readonly number[], roofY: number, baseY: number, raisedTop: number, opts: { lower?: number; upper?: number; halfHead?: number; section?: number } = {}): LodPart[] {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted.map((x, i) => ({
    ...(i > 0 ? { optional: 0 } : {}), ...(opts.section !== undefined ? { section: opts.section } : {}),
    draw: (m: MeshBuilder) => m.scope(i === 0 ? "raised pantograph" : "folded pantograph", () => lodPantograph(m, {
      x, roofY, baseY, h: i === 0 ? 1 : -1, raised: i === 0, raisedTop,
      ...(opts.lower ? { lower: opts.lower } : {}), ...(opts.upper ? { upper: opts.upper } : {}), ...(opts.halfHead ? { halfHead: opts.halfHead } : {}),
    })),
  }));
}

/** `base` painted over by the bands `over`, in order. */
export function paintOver(base: readonly LodBand[], ...over: ReadonlyArray<readonly [number, number, string]>): LodBand[] {
  let out: LodBand[] = [...base];
  const [lo, hi] = [base[0]![0], base[base.length - 1]![1]];
  for (const [a, b, mat] of over) {
    const below = out.filter(([y0]) => y0 < a).map(([y0, y1, m]): LodBand => [y0, Math.min(y1, a), m]);
    const above = out.filter(([, y1]) => y1 > b).map(([y0, y1, m]): LodBand => [Math.max(y0, b), y1, m]);
    out = [...below, [Math.max(a, lo), Math.min(b, hi), mat], ...above];
  }
  return lodBands(out, lo, hi);
}

// --- the DMU kit (dmuKit.ts) ------------------------------------------------------------------

export interface DmuBodyOpts extends CoachBodyOpts {
  /** The side's items; its windows (and `glass`, door glass) make the window bands. */
  items: readonly SideItem[];
  glass?: readonly PxBox[];
  /** Window rectangles within `gap` of each other join into one band. */
  gap?: number;
  /** The cab ends (+1 the +X end) and the items of a cab front. */
  cabs?: readonly number[];
  cabItems?: readonly EndItem[];
}

/**
 * A DMU car's body from its frame and its volume in source metres (dmuKit.ts):
 * the volume's ends, bands and section, its side windows and door glass as
 * window bands, and the cab fronts' windows joined into windscreens.
 */
export function dmuBody(f: CarFrame, v: Volume, o: DmuBodyOpts): UnitBody {
  const F = frameMaps(f);
  const sv = scaleVolume(f, v);
  const boxes = [...o.items.filter((i) => i.kind === "window").map((i) => F.side(i.box)), ...(o.glass ?? []).map((b) => F.side(b))];
  const screens = (e: number) => (o.cabs ?? []).includes(e) && o.cabItems
    ? windowBands(o.cabItems.filter((i) => i.kind === "window").map((i) => { const b = F.front(i.box, 1); return { u: [b.x0, b.x1] as const, y: [b.y0, b.y1] as const }; }), 0.45)
    : undefined;
  const [fw, rw] = [screens(1), screens(-1)];
  return coachBody([{ v: sv, X: (x) => x - f.centre * f.kx }], {
    ...o, windows: o.windows ?? sideGlass(boxes, o.gap ?? 0.6),
    ...(fw ? { frontWindows: fw } : {}), ...(rw ? { rearWindows: rw } : {}),
  });
}

/**
 * Skirts reaching below the body's bottom `y0`: each run of a volume's
 * bottom elevation (model x, y) lower than it, as a block of the bottom
 * band's colour from its lowest point to the body.
 */
export function skirtParts(bottom: readonly Pt[], y0: number, hw: number, mat: string): LodPart[] {
  const out: LodPart[] = [];
  let run: Pt[] = [];
  const flush = () => {
    if (run.length >= 2) {
      const [a, b] = [run[0]![0], run[run.length - 1]![0]];
      const lo = Math.min(...run.map((p) => p[1]));
      // sides only: its ends hide under the body; a short one is an optional part
      if (b - a > 0.3) out.push({ ...(b - a < 2 ? { optional: 20 + b - a } : {}), draw: (m) => m.scope("skirt", () => lodSideBox(m, mat, [[a, lo], [b, lo], [b, y0], [a, y0]], -hw, hw, false)) });
    }
    run = [];
  };
  for (const p of [...bottom].sort((u, v) => u[0] - v[0])) {
    if (p[1] < y0 - 0.05) run.push(p);
    else flush();
  }
  flush();
  return out;
}
