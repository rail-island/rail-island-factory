// The airframe kit (docs/models/world-aircraft.md): a whole fixed-wing aircraft
// from one typed `AirframeSpec` at its real size - fuselage stations (nose kind,
// cabin tube, tail cone, an upper-deck hump, a hull's keel), the wing planform
// (span, chords, sweep, dihedral, low / mid / high, struts, a biplane's upper
// wing, wingtip devices), engines (wing pods, rear-fuselage pods, a centre engine
// in the tail or behind an S-duct, engines buried in the wing root, turboprop,
// radial and inline nacelles with their propellers, over-wing pods), the
// empennage (conventional, T, cruciform, twin and triple fins), the gear
// (tricycle or taildragger, retractable or fixed, bogies, gear pods, spats,
// floats, skis, wingtip floats and sponsons), windows and doors, and a livery
// (`Scheme`: colour fields by section height, cheatlines, fin bands and shapes,
// plain titles; no logos). Its LOD adapter `airframeLod` feeds the same spec to
// `airLod` (lodAir.ts), and `aircraftFeatures` names the kit options a spec uses
// for the fleet's covering sample (worldFleet.ts).
//
// Axes as the wide bodies of aircraft.ts: metres, nose at +X (catalog yaw 180),
// wings along Z, +Y up, the wheels (floats, a hull's keel) on y = 0, the
// fuselage centred on x = 0. Positions along the fuselage are given in a spec as
// `d`, metres behind the nose tip. A retractable gear is the part "gear" (the
// game hides it in flight), everything else the part "airframe".

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import {
  PALETTE, axleY, body, circle, closeTo, fan, fin, gridTris, hullSec, insideAny, lerp, liveryFin, lobe, nacelle,
  oval, ovalOutline, paintedBody, secAt, plate, rod, skinDecal, skinEnd, skinStripe, skinY, smooth, splitLong, wheel, wing, wingAt, annulus, cutBody,
  type FinRing, type Livery, type Lobe, type P2, type Sec, type Station, type WingStation,
} from "./airframeShapes.ts";
import { airLod, lodAxleWheel, lodBar, type AirEngine, type AirFin, type AirPod, type AirWing } from "./lodAir.ts";
import { lodPolygon } from "./lodKit.ts";

// --- the spec ----------------------------------------------------------------------------

/** How the nose closes: an airliner's, a turboprop's blunter one, a business jet's long one, a supersonic needle, a glazed navigator's nose, a single engine's cowl, a flying boat's bow. */
export type NoseKind = "airliner" | "blunt" | "bizjet" | "pointed" | "glazed" | "cowl" | "boat";

export interface FuselageSpec {
  /** The cabin's width and depth (the section's height; default the width). */
  width: number;
  depth?: number;
  /** The keel's height above the ground under the cabin, gear down. */
  keel: number;
  nose: NoseKind;
  /** Scales the nose kind's closing lengths (1: the kind's own). */
  noseScale?: number;
  /** The tail cone's length, and its last point's height above the keel as a fraction of the depth (default 0.72). */
  tailLen: number;
  tailY?: number;
  /** The tail cone's end: its half width (default 4 % of the width); an S-duct trijet's ends at its nozzle. */
  tailEnd?: number;
  /** A rounded-box section (light aircraft, Ju 52): the corner radius as a fraction of the half width; absent: an ellipse. */
  corner?: number;
  /** An upper lobe: the 747's upper deck, the Stratocruiser's double bubble. Its crown (above the ground), half width, where it starts, is full and fairs into the cabin's crown. */
  hump?: { start: number; full: number; end: number; crown: number; hw: number };
  /** A flying boat's hull: a narrow lower lobe this fraction of the half width, its keel at the fuselage's. */
  hull?: number;
  /** A lobe added to the profile's at d, or null (the Dreamlifter's and the Beluga XL's cargo bulges). */
  bulge?: (d: number) => Lobe | null;
  /** Replaces the profile: the section's lobes at d (the Beluga XL's and Dreamlifter's bulges). */
  lobes?: (d: number) => Lobe[];
  /** The tip heights for a `lobes` override: the nose's and the tail's. */
  tips?: { nose: number; tail: number };
  /** Points per section (default 32). */
  n?: number;
}

export type TipDevice = "none" | "blended" | "split" | "sharklet" | "fence" | "raked" | "curved" | "canted" | "tiptank";

export interface WingSpec {
  /** Tip to tip, the devices included. */
  span: number;
  /** The chord at the centre line, at the kink (a fraction of the half span) and at the tip. */
  root: number;
  kink?: { at: number; chord: number };
  tip: number;
  /** The leading edge's sweep and the dihedral, degrees (negative: anhedral). */
  sweep: number;
  dihedral: number;
  /** The root leading edge, metres behind the nose tip. */
  at: number;
  pos: "low" | "mid" | "high" | "shoulder";
  /** The chord line's height at the root, overriding `pos`'s. */
  y?: number;
  /** Thickness over chord at the root and the tip (default 0.14, 0.1). */
  thick?: [number, number];
  tipDevice?: TipDevice;
  /** A winglet's height (default by device). */
  devHeight?: number;
  /** Struts from the fuselage's lower side to this fraction of the half span (a strut-braced high wing). */
  strut?: number;
  /** A biplane's upper wing: its height above the lower, span, chord, stagger (metres forward) and the interplane struts (fractions of its half span). */
  upper?: { gap: number; span: number; chord: number; stagger: number; struts: number[] };
  /** An explicit planform instead of the chords and sweep (a delta): [half-span position, leading edge d, chord], root first. */
  plan?: Array<[number, number, number]>;
}

export type EngineSpec =
  /** Turbofans under the wing at these half-span positions (metres), or over it. */
  | { kind: "pod"; s: number[]; r: number; len: number; ahead?: number; drop?: number; jet?: boolean; over?: boolean }
  /** Pods on the rear fuselage: intake d, axis height above the ground and lateral offset; `pair`: two a side (VC10, Il-62). */
  | { kind: "rear"; d: number; y: number; z: number; r: number; len: number; pair?: boolean }
  /** The centre engine: in a nacelle through the fin root (`straight`), or behind an S-duct intake on the spine. */
  | { kind: "tail"; d: number; r: number; len: number; duct: "straight" | "s" }
  /** Engines buried in the wing roots (Comet, Tu-104): intakes in the leading edge. */
  | { kind: "buried"; s: number[]; r: number; len: number }
  /** Propeller engines on the wing at these half-span positions, 0 for the nose: turboprop, radial or inline nacelles. */
  | { kind: "prop"; style: "turboprop" | "radial" | "inline"; s: number[]; r: number; len: number; blades: number; prop: number; over?: boolean; ahead?: number; drop?: number };

export type TailKind = "conventional" | "T" | "cruciform" | "twin" | "triple";

export interface TailSpec {
  kind: TailKind;
  /** The fin: root and tip chords, leading-edge sweep (deg), its root leading edge (d); the top is the aircraft's height. */
  fin: { root: number; tip: number; sweep: number; at: number; dorsal?: number };
  /** The tailplane: span, chords, sweep, dihedral, root leading edge (d); `y` overrides its height. */
  plane?: { span: number; root: number; tip: number; sweep: number; dihedral?: number; at: number; y?: number };
}

export interface GearLeg { d: number; z: number; r: number; twin?: boolean; axles?: number; top?: number }

export interface GearSpec {
  kind: "tricycle" | "taildragger" | "floats" | "skis" | "none";
  retract: boolean;
  /** The nose leg (a taildragger's tail wheel); the main legs, mirrored unless z is 0. */
  nose?: GearLeg;
  mains: GearLeg[];
  /** Fairings behind the wing the main legs retract into (Tu-134, Tu-154). */
  pods?: boolean;
  /** Spats over fixed wheels. */
  spats?: boolean;
  /** Floats: length, front (d), track, depth. */
  floats?: { len: number; d: number; track: number; depth: number };
  /** Wingtip floats on a flying boat: half-span position, length, depth below the wing. */
  tipFloats?: { s: number; len: number; drop: number };
  /** Fairings low on the fuselage's sides the main legs retract into (ATR, Hercules): from d0 to d1, their outer half width and height. */
  fairing?: { d0: number; d1: number; hw: number; h: number };
  /** A flying boat's sponsons: d of the leading edge, half span, chord. */
  sponsons?: { d: number; span: number; chord: number };
}

export interface WindowRow {
  /** Height above the keel as a fraction of the depth (default 0.6). */
  y?: number;
  from: number;
  to: number;
  pitch: number;
  /** Half sizes; shape. */
  w?: number;
  h?: number;
  shape?: "oval" | "round" | "rect" | "tri";
}

/** A livery: colour fields, lines, fin and titles, in the kit's relative terms. */
export interface Scheme {
  title: string;
  /** The scheme's own colours, by name (the materials are named `<key><Name>`). */
  colors: Record<string, string>;
  /** The skin: the base, below (s < at) and above (s > at) colours by section height (-1 keel .. 1 crown), bands between. */
  body?: string;
  belly?: [number, string];
  top?: [number, string];
  bands?: Array<[number, number, string]>;
  /** The tail cone's colour aft of this fraction of the length, cut along a slanted line (`slope`, m of x per m of y). */
  tail?: { from: number; mat: string; slope?: number };
  /** The nose's colour ahead of this fraction (a black anti-glare or a coloured nose). */
  nose?: { to: number; mat: string };
  /** Cheatlines: heights above the keel as fractions of the depth. */
  stripes?: Array<[number, number, string]>;
  /** The fin: one colour or bands from fractions of its height (0 root .. 1 tip). */
  fin: string | Array<[number, string]>;
  /** Shapes on the fin, convex outlines in (chord fraction, height fraction). */
  art?: Array<{ mat: string; polys: P2[][] }>;
  cowl?: string;
  winglet?: string;
  wing?: string;
  /** Plain titles along the upper fuselage. */
  titles?: { text: string; mat: string };
}

export interface AirframeSpec {
  /** Overall length (nose tip to tail cone), span and height (fin top), metres. */
  length: number;
  height: number;
  fuselage: FuselageSpec;
  wing: WingSpec;
  engines: EngineSpec[];
  tail: TailSpec;
  gear: GearSpec;
  windows: WindowRow[];
  /** Door positions (d), both sides. */
  doors: number[];
  scheme: Scheme;
  /** The scheme's key, prefixing its materials. */
  schemeKey: string;
  /** No passenger windows (a freighter's). */
  cargo?: boolean;
  /** Things the kit cannot say: drawn inside the airframe part with the kit's geometry. */
  extra?: (m: MeshBuilder, g: Geometry) => void;
}

// --- liveries ----------------------------------------------------------------------------

/** A livery parameter over schemes; the first is the default. */
export function schemeParam(schemes: Record<string, Scheme>, name = "livery", title = "Livery"): ParamSpec {
  const values = Object.entries(schemes).map(([value, s]) => ({ value, title: s.title }));
  return { name, title, default: values[0]!.value, values };
}

const cap = (s: string): string => s[0]!.toUpperCase() + s.slice(1);

/** The material name of colour `c` of a scheme: its own (`<key><Name>`) or the shared palette's. */
const matOf = (key: string, scheme: Scheme, c: string): string => (scheme.colors[c] !== undefined ? `${key}${cap(c)}` : c);

/** The palette of a spec: the shared aircraft materials and the scheme's colours. */
export function airframePalette(spec: AirframeSpec): Record<string, MaterialSpec> {
  const out: Record<string, MaterialSpec> = { ...PALETTE, prop: { color: "#2a2b2e", roughness: 0.5 }, cowlRing: { color: "#3a3d42", metallic: 0.2, roughness: 0.5 } };
  for (const [c, hex] of Object.entries(spec.scheme.colors)) out[`${spec.schemeKey}${cap(c)}`] = { color: hex, roughness: 0.4 };
  return out;
}

// --- the geometry --------------------------------------------------------------------------

/** Nose closing lengths (keel, crown, sides) as multiples of the width, their powers, and the tip's height above the keel as a fraction of the depth; `floor`: the face a cowl closes to. */
const NOSES: Record<NoseKind, { len: [number, number, number]; p: [number, number, number]; tip: number; floor: number }> = {
  airliner: { len: [1.0, 1.6, 1.3], p: [2.0, 1.45, 1.8], tip: 0.38, floor: 0 },
  blunt: { len: [0.85, 1.35, 1.05], p: [2.0, 1.5, 1.9], tip: 0.42, floor: 0 },
  bizjet: { len: [1.5, 2.5, 2.0], p: [1.7, 1.3, 1.6], tip: 0.32, floor: 0 },
  pointed: { len: [5.0, 6.0, 5.5], p: [1.35, 1.2, 1.3], tip: 0.42, floor: 0 },
  glazed: { len: [1.25, 1.7, 1.5], p: [1.6, 1.45, 1.7], tip: 0.36, floor: 0 },
  cowl: { len: [0.55, 1.2, 0.5], p: [2.2, 1.3, 2.2], tip: 0.45, floor: 0.4 },
  boat: { len: [1.6, 1.4, 1.2], p: [1.4, 1.6, 1.9], tip: 0.55, floor: 0 },
};

/** Everything the builder and the LOD share, derived once from a spec. */
export interface Geometry {
  spec: AirframeSpec;
  half: number;
  /** x of a position d behind the nose tip. */
  x: (d: number) => number;
  W: number;
  D: number;
  keelY: number;
  /** The fuselage's profile at d: keel, crown, half width. */
  keel: (d: number) => number;
  crown: (d: number) => number;
  hw: (d: number) => number;
  lobes: (d: number) => Lobe[];
  /** Stations tail first (rising x). */
  stations: Station[];
  noseTip: Vec3;
  tailTip: Vec3;
  /** The nose's longest closing length. */
  noseLen: number;
  /** The windscreen's d range and heights. */
  screen: { d0: number; d1: number; y0: number; y1: number; u1: number };
  wing: WingStation[];
  upper: WingStation[] | null;
  plane: WingStation[];
  fin: FinRing[] | null;
  endFins: FinRing[][];
  /** Mirrored device rings (each side), drawn as fins: [rings, closed top]. */
  devices: Array<{ rings: FinRing[]; top: boolean }>;
  livery: Livery;
  mats: { wing: string; cowl: string; winglet: string };
}

/** A strut-free superellipse closing from 1 at `full` to `floor` at the tip (d = 0). */
const closing = (d: number, full: number, p: number, floor: number): number => floor + (1 - floor) * closeTo(d, 0, full, p);

/** A rounded-box section (keel, crown, half width, corner radius as a fraction): `n` support points placed as `oval` and `hullSec` place theirs. */
function boxSection(n: number, keel: number, crown: number, hw: number, f: number): Sec {
  const r = Math.max(0.01, Math.min(hw, (crown - keel) / 2) * f);
  const out: Sec = [];
  for (let k = 0; k < n; k++) {
    const t = ((k + 0.5) / n) * Math.PI * 2;
    const [c, s] = [Math.cos(t), Math.sin(t)];
    out.push([Math.sign(c) * (hw - r) + r * c, (s >= 0 ? crown - r : keel + r) + r * s]);
  }
  return out;
}

/** Derives the kit's geometry from a spec. */
export function geometry(spec: AirframeSpec): Geometry {
  const f = spec.fuselage;
  const L = spec.length;
  const half = L / 2;
  // a nose propeller's spinner is part of the published length: the fuselage starts behind it
  const noseProp = spec.engines.find((e) => e.kind === "prop" && e.s.includes(0));
  const sp = noseProp?.kind === "prop" ? (noseProp.style === "radial" ? 0.05 : 0.02) + 0.07 + 1.55 * Math.max(0.12, noseProp.r * 0.45) : 0;
  const Lf = L - sp;
  const x = (d: number): number => half - sp - d;
  const W = f.width;
  const D = f.depth ?? f.width;
  const k = f.keel;
  const crownC = k + D;
  const cy = k + D / 2;
  const nk = NOSES[f.nose];
  const ns = f.noseScale ?? 1;
  const [lk, lc, ls] = nk.len.map((v) => v * W * ns) as [number, number, number];
  const tipY = f.tips?.nose ?? k + nk.tip * D;
  const floor = nk.floor;
  const tailStart = Lf - f.tailLen;
  const th = f.tailEnd ?? W * 0.04;
  const tailMid = k + (f.tailY ?? 0.72) * D;
  const split = (Math.max(lk, lc, ls) + tailStart) / 2;
  const tailU = (d: number, from: number): number => Math.min(1, Math.max(0, (d - from) / (Lf - from)));
  const keel = (d: number): number => {
    if (d < split) return tipY - (tipY - k) * closing(d, lk, nk.p[0], floor);
    const u = tailU(d, tailStart);
    return k + (tailMid - th - k) * Math.pow(u, 1.5);
  };
  const crown = (d: number): number => {
    if (d < split) return tipY + (crownC - tipY) * closing(d, lc, nk.p[1], floor);
    const u = tailU(d, tailStart + f.tailLen * 0.3);
    return crownC - (crownC - tailMid - th) * Math.pow(u, 1.6);
  };
  const hw = (d: number): number => {
    if (d < split) return (W / 2) * closing(d, ls, nk.p[2], floor);
    const u = tailU(d, tailStart + f.tailLen * 0.1);
    return th + (W / 2 - th) * (1 - Math.pow(u, 1.8));
  };
  const mid = (d: number): number => {
    if (d < split) return lerp(cy, tipY, Math.pow(Math.max(0, 1 - d / ls), 1.5));
    return lerp(cy, (keel(d) + crown(d)) / 2, smooth(d, tailStart, Lf));
  };
  const n = f.n ?? 32;
  const lobes = f.lobes ?? ((d: number): Lobe[] => {
    const out = [lobe(keel(d), crown(d), hw(d), mid(d))];
    const h = f.hump;
    if (h && d > h.start && d < h.end) {
      const yF = tipY + (crownC - tipY) * 0.55;
      const uCrown = d < h.full ? yF + (h.crown - yF) * closeTo(d, h.start, h.full, 1.75) : h.crown - (h.crown - crownC + 0.25) * smooth(d, h.end - (h.end - h.full) * 0.45, h.end);
      const uKeel = Math.min(cy, uCrown - 0.3);
      const uHw = d < h.full ? h.hw * closeTo(d, h.start, lerp(h.start, h.full, 0.8), 2) : lerp(h.hw, Math.min(h.hw, W / 2) * 0.85, smooth(d, h.end - (h.end - h.full) * 0.45, h.end));
      out.push(lobe(uKeel, uCrown, uHw, uKeel + (uCrown - uKeel) * 0.45));
    }
    const b = f.bulge?.(d);
    if (b) out.push(b);
    if (f.hull) out.push(lobe(keel(d), keel(d) + (crown(d) - keel(d)) * 0.6, hw(d) * f.hull, keel(d) + (crown(d) - keel(d)) * 0.3));
    return out;
  });
  const section = (d: number): Sec => {
    if (f.corner !== undefined && !f.lobes) return boxSection(n, keel(d), crown(d), hw(d), f.corner);
    return hullSec(n, lobes(d), Math.max(0.05, W * 0.05));
  };
  // stations: dense at the nose, two along the cabin, dense along the tail cone, and at a hump's ends
  const nl = Math.max(lk, lc, ls);
  const ds = new Set<number>();
  for (const t of [0.006, 0.02, 0.045, 0.08, 0.125, 0.18, 0.25, 0.33, 0.43, 0.55, 0.68, 0.82, 1]) ds.add(Math.min(nl * t, split - 0.05));
  for (const t of [0, 0.12, 0.26, 0.4, 0.53, 0.65, 0.76, 0.85, 0.92, 0.97, 0.995]) ds.add(Math.max(tailStart + f.tailLen * t, split + 0.05));
  ds.add(split - 0.04);
  ds.add(split + 0.04);
  if (f.hump) for (const t of [0.02, 0.1, 0.3, 0.55, 0.8, 1]) ds.add(lerp(f.hump.start, f.hump.full, t)), ds.add(lerp(f.hump.full, f.hump.end, t * 0.999));
  if (f.lobes) for (let i = 1; i < 60; i++) ds.add((Lf * i) / 60);
  const sorted = [...ds].filter((d) => d > 0.004 && d < Lf - 0.004).sort((a, b) => a - b).filter((d, i, a) => i === 0 || d - a[i - 1]! > 0.03);
  const stations: Station[] = sorted.reverse().map((d) => ({ a: x(d), sec: section(d) }));
  const tailTipY = f.tips?.tail ?? tailMid;

  // the windscreen: from where the crown passes y1 to where it passes y0
  const y1 = k + D * (f.nose === "cowl" ? 0.86 : 0.8);
  const y0 = k + D * (f.nose === "cowl" ? 0.6 : f.nose === "bizjet" ? 0.6 : 0.65);
  const crossing = (y: number): number => {
    let lo = 0;
    let hi = split;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (crown(m) < y) lo = m;
      else hi = m;
    }
    return lo;
  };
  const screen = { d0: crossing(y0), d1: crossing(Math.min(y1, crownC - 0.03)), y0, y1, u1: W * 0.27 };

  // the wing
  const w = spec.wing;
  const semi = w.span / 2;
  const [t0, t1] = w.thick ?? [0.14, 0.1];
  const devOut = w.tipDevice === "canted" || w.tipDevice === "blended" || w.tipDevice === "split" || w.tipDevice === "curved" ? (w.devHeight ?? semi * 0.1) * 0.25 : w.tipDevice === "tiptank" ? Math.max(2, w.tip * 2.6) * 0.12 * 1.6 : 0;
  const tipS = semi - devOut;
  const rootY = w.y ?? (w.pos === "low" ? k + D * 0.16 : w.pos === "mid" ? cy : w.pos === "shoulder" ? crownC - D * 0.22 : crownC - D * 0.08 + w.root * t0 * 0.15);
  const tan = (deg: number): number => Math.tan((deg * Math.PI) / 180);
  const chordAt = (s: number): number => {
    if (w.kink && s < w.kink.at * tipS) return lerp(w.root, w.kink.chord, s / (w.kink.at * tipS));
    const s0 = w.kink ? w.kink.at * tipS : 0;
    const c0 = w.kink ? w.kink.chord : w.root;
    return lerp(c0, w.tip, (s - s0) / (tipS - s0));
  };
  const wst = (s: number, rake = 0): WingStation => {
    const chord = chordAt(s);
    const ratio = lerp(t0, t1, s / tipS);
    return { s, lead: x(w.at) - tan(w.sweep) * s - rake, chord, thick: chord * ratio, mid: rootY + tan(w.dihedral) * s };
  };
  const wingSs = [0, Math.min(W / 2, tipS * 0.3), ...(w.kink ? [w.kink.at * tipS] : []), tipS * 0.7, tipS].filter((s, i, a) => i === 0 || s > a[i - 1]! + 0.05);
  let wingSt = wingSs.map((s) => wst(s));
  if (w.plan) wingSt = w.plan.map(([sp, d, chord], i) => ({ s: sp, lead: x(d), chord, thick: chord * lerp(t0, t1, i / (w.plan!.length - 1)), mid: rootY + tan(w.dihedral) * sp }));
  else if (w.tipDevice === "raked") {
    // the raked tip: the last fifth swept back harder, closing to a narrow tip
    const s0 = tipS * 0.86;
    wingSt = [...wingSs.filter((s) => s < s0).map((s) => wst(s)), wst(s0), { ...wst(tipS), lead: wst(s0).lead - (tipS - s0) * tan(w.sweep + 22), chord: w.tip * 0.45, thick: w.tip * 0.45 * t1 }];
  }
  const upper = w.upper
    ? [0, w.upper.span * 0.25, w.upper.span / 2].map((s): WingStation => ({ s, lead: x(w.at) + w.upper!.stagger - (s > w.upper!.span * 0.45 ? 0.15 : 0), chord: w.upper!.chord * (s > w.upper!.span * 0.45 ? 0.85 : 1), thick: w.upper!.chord * 0.11, mid: rootY + w.upper!.gap + tan(w.dihedral) * s }))
    : null;

  // the empennage, moved forward as a whole where its fin or tailplane would reach past the published length
  const t = spec.tail;
  const engine = spec.engines.find((e) => e.kind === "tail");
  const finTop = spec.height;
  const finRing = (y: number, chord: number, lead: number, thick: number): FinRing => [y, lead, chord, thick, 0];
  const empennage = (shift: number) => {
    const fa = t.fin.at - shift;
    const finRootD = fa + t.fin.root * 0.35;
    const finRoot = engine?.kind === "tail" && engine.duct === "straight" ? crown(engine.d) + engine.r * 1.7 : crown(Math.min(finRootD, Lf - 0.3)) - 0.06;
    const fin0: FinRing[] | null = t.kind === "twin" ? null : [
      ...(t.fin.dorsal ? [finRing(finRoot - 0.02, t.fin.root + t.fin.dorsal, x(fa - t.fin.dorsal), t.fin.root * 0.09)] : []),
      finRing(finRoot + (t.fin.dorsal ? Math.min(0.6, (finTop - finRoot) * 0.12) : 0), t.fin.root, x(fa) - (t.fin.dorsal ? tan(t.fin.sweep) * Math.min(0.6, (finTop - finRoot) * 0.12) : 0), t.fin.root * 0.1),
      finRing(finTop, t.fin.tip, x(fa) - tan(t.fin.sweep) * (finTop - finRoot), t.fin.tip * 0.1),
    ];
    const finLeadAt = (y: number): number => x(fa) - tan(t.fin.sweep) * (y - finRoot);
    const finChordAt = (y: number): number => lerp(t.fin.root, t.fin.tip, (y - finRoot) / (finTop - finRoot));
    const p = t.plane ?? { span: 0.02, root: 0.01, tip: 0.01, sweep: 0, at: Lf - 1 };
    const pa = p.at - shift;
    const tpSemi = p.span / 2;
    const planeY = p.y ?? (t.kind === "T" ? finTop - finChordAt(finTop) * 0.05 - 0.04 : t.kind === "cruciform" ? lerp(finRoot, finTop, 0.42) : t.kind === "twin" || t.kind === "triple" ? crown(pa + p.root * 0.3) - 0.1 : (keel(pa + p.root * 0.4) + crown(pa + p.root * 0.4)) / 2 + D * 0.12);
    const planeLead = t.kind === "T" ? finLeadAt(planeY) + (finChordAt(planeY) - p.root) * 0.5 : x(pa);
    const plane: WingStation[] = [0, tpSemi].map((sp2) => ({ s: sp2, lead: planeLead - tan(p.sweep) * sp2, chord: lerp(p.root, p.tip, sp2 / tpSemi), thick: lerp(p.root, p.tip, sp2 / tpSemi) * 0.1, mid: planeY + tan(p.dihedral ?? 0) * sp2 }));
    const endFins: FinRing[][] = [];
    if (t.kind === "twin" || t.kind === "triple") {
      const tipSt = plane[1]!;
      const below = (finTop - planeY) * 0.42;
      for (const side of [-1, 1]) {
        endFins.push([
          [planeY - below, tipSt.lead + 0.1 - t.fin.root * 0.1, t.fin.root * 0.8, t.fin.root * 0.08, side * (tpSemi - 0.05)],
          [planeY, tipSt.lead + 0.25, t.fin.root, t.fin.root * 0.09, side * (tpSemi - 0.05)],
          [finTop, tipSt.lead + 0.25 - tan(t.fin.sweep) * (finTop - planeY), t.fin.tip, t.fin.tip * 0.08, side * (tpSemi - 0.05)],
        ]);
      }
    }
    return { fin0, plane, endFins, planeY };
  };
  let emp = empennage(0);
  const reach = Math.min(...[...(emp.fin0 ?? []), ...emp.endFins.flat()].map((r) => r[1] - r[2]), ...(t.plane ? emp.plane.map((st) => st.lead - st.chord) : []));
  if (reach < -half - 0.02) emp = empennage(-half - reach);
  const { fin0, plane, endFins, planeY } = emp;

  // wingtip devices
  const devices: Geometry["devices"] = [];
  const tw = wingSt[wingSt.length - 1]!;
  const dh = w.devHeight ?? (w.tipDevice === "fence" ? tw.chord * 0.9 : w.tipDevice === "canted" ? semi * 0.06 : w.tipDevice === "split" ? semi * 0.15 : semi * 0.12);
  for (const side of [-1, 1]) {
    const [tl, tc, ty, ts] = [tw.lead, tw.chord, tw.mid, side * tw.s];
    const out = side * devOut;
    switch (w.tipDevice) {
      case "blended": case "curved": case "split": case "sharklet":
        devices.push({ top: true, rings: [
          [ty - 0.02, tl - 0.02, tc * 0.96, tc * 0.1, ts - side * 0.02],
          [ty + dh * 0.2, tl - tc * 0.18, tc * 0.72, tc * 0.08, ts + out * 0.55],
          [ty + dh * 0.5, tl - tc * 0.45, tc * 0.5, tc * 0.06, ts + out * 0.85],
          [ty + dh, tl - tc * 0.62 - dh * (w.tipDevice === "sharklet" ? 0.45 : 0.3), tc * (w.tipDevice === "curved" ? 0.22 : 0.32), tc * 0.04, ts + out],
        ] });
        if (w.tipDevice === "split") devices.push({ top: false, rings: [
          [ty - dh * 0.4, tl - tc * 0.75 - dh * 0.25, tc * 0.25, tc * 0.04, ts + out * 0.5],
          [ty - 0.02, tl - tc * 0.05, tc * 0.7, tc * 0.08, ts - side * 0.05],
        ] });
        break;
      case "canted":
        devices.push({ top: true, rings: [[ty - 0.05, tl - 0.05, tc * 0.95, tc * 0.1, ts - side * 0.05], [ty + dh * 0.3, tl - tc * 0.25, tc * 0.7, tc * 0.08, ts + out * 0.4], [ty + dh, tl - tc * 0.7 - dh * 0.4, tc * 0.3, tc * 0.05, ts + out]] });
        break;
      case "fence":
        devices.push({ top: true, rings: [[ty - dh * 0.45, tl + 0.05, tc * 0.45, tc * 0.05, ts - side * 0.03], [ty + 0.02, tl + tc * 0.1, tc * 0.85, tc * 0.07, ts - side * 0.04], [ty + dh * 0.6, tl - tc * 0.2, tc * 0.45, tc * 0.05, ts - side * 0.03]] });
        break;
      default:
        break;
    }
  }

  // the livery in the shapes' terms
  const sc = spec.scheme;
  const key = spec.schemeKey;
  const mm = (c: string | undefined, dflt: string): string => (c === undefined ? dflt : matOf(key, sc, c));
  const base = mm(sc.body, "white");
  const tailX = sc.tail ? x(sc.tail.from * L) : -Infinity;
  const noseX = sc.nose ? x(sc.nose.to * L) : Infinity;
  const skin = (s: number, a: number): string => {
    if (a > noseX) return mm(sc.nose!.mat, base);
    if (sc.tail && !sc.tail.slope && a < tailX) return mm(sc.tail.mat, base);
    if (sc.top && s > sc.top[0]) return mm(sc.top[1], base);
    if (sc.belly && s < sc.belly[0]) return mm(sc.belly[1], base);
    for (const [s0, s1, c] of sc.bands ?? []) if (s >= s0 && s < s1) return mm(c, base);
    return base;
  };
  const finTopY = fin0 ? finTop : finTop;
  const finRootY = fin0 ? fin0[0]![0] : planeY - (finTop - planeY) * 0.42;
  const finH = finTopY - finRootY;
  const finBands: Array<[number, string]> = typeof sc.fin === "string" ? [[0, mm(sc.fin, base)]] : sc.fin.map(([fr, c]) => [fr <= 0 ? 0 : finRootY + fr * finH, mm(c, base)]);
  // stripes along the cabin where the section covers them
  const covers = (d: number, ya: number, yb: number): boolean => keel(d) < ya - 0.05 && crown(d) > yb + 0.05 && hw(d) > W * 0.3;
  const stripeRange = (ya: number, yb: number): [number, number] => {
    let d0 = 0.2;
    while (d0 < L / 2 && !covers(d0, ya, yb)) d0 += 0.1;
    let d1 = L - 0.2;
    while (d1 > L / 2 && !covers(d1, ya, yb)) d1 -= 0.1;
    return [x(d0 + 0.1), x(d1 - 0.1)];
  };
  const livery: Livery = {
    title: sc.title,
    colors: {},
    skin,
    stripes: (sc.stripes ?? []).map(([f0, f1, c]) => {
      const [ya, yb] = [k + f0 * D, k + f1 * D];
      const [a0, a1] = stripeRange(ya, yb);
      return { mat: mm(c, base), a0, a1, y0: ya, y1: yb };
    }),
    fin: finBands,
    finArt: (sc.art ?? []).map((a) => ({ mat: mm(a.mat, base), polys: a.polys.map((poly) => poly.map(([fr, h]): P2 => [fr, finRootY + h * finH])) })),
    cowl: mm(sc.cowl, "white"),
    winglet: mm(sc.winglet, typeof sc.fin === "string" ? mm(sc.fin, base) : base),
    ...(sc.tail?.slope ? { cut: { mat: mm(sc.tail.mat, base), x0: tailX, y0: k, slope: sc.tail.slope } } : {}),
  };
  return {
    spec, half, x, W, D, keelY: k, keel, crown, hw, lobes, stations, noseLen: nl,
    noseTip: [x(0), tipY, 0], tailTip: [-half, tailTipY, 0], screen,
    wing: wingSt, upper, plane, fin: fin0, endFins, devices, livery,
    mats: { wing: mm(sc.wing, "alloy"), cowl: livery.cowl, winglet: livery.winglet },
  };
}

// --- drawing -------------------------------------------------------------------------------

const ENGINE_MATS = (cowl: string) => ({ cowl, lip: "alloy", duct: "darkGrey", fan: "glass", nozzle: "metalGrey", plug: "darkGrey" });

/** The wing's lower surface height at half-span s (on side +). */
const wingUnder = (st: WingStation[], s: number): number => {
  const w = wingAt(st, s);
  return w.mid - w.thick * 0.42;
};

/** A propeller standing still in the plane x = px about (y, z): `blades` flat, slightly pitched blades of radius `r`, and a spinner. */
function propeller(m: MeshBuilder, px: number, c: [number, number], r: number, blades: number, spinner: number, phase = 0): void {
  m.scope("propeller", () => {
    const [cy, cz] = c;
    for (let i = 0; i < blades; i++) {
      const t = phase + (i * 2 * Math.PI) / blades + Math.PI / 2;
      const radial: Vec3 = [0, Math.sin(t), Math.cos(t)];
      // the blade's chord: across the radius, pitched 25 degrees out of the disc
      const tang: Vec3 = [Math.sin(0.44), Math.cos(t) * Math.cos(0.44), -Math.sin(t) * Math.cos(0.44)];
      const cw = Math.max(0.1, r * 0.13);
      const outline: P2[] = [[spinner * 0.6, -cw * 0.5], [r * 0.35, -cw * 0.62], [r, -cw * 0.3], [r, cw * 0.25], [r * 0.35, cw * 0.5], [spinner * 0.6, cw * 0.4]];
      plate(m, "prop", [px, cy, cz], radial, tang, outline, Math.max(0.02, cw * 0.12));
    }
    const st: Station[] = [[0, spinner], [spinner * 0.6, spinner * 0.8], [spinner * 1.2, spinner * 0.35]].map(([dx, rr]) => ({ a: px + 0.05 + dx!, sec: circle(12, cz, cy, rr!) }));
    // the body along x takes (z, y) sections
    body(m, "white", "x", st);
    fan(m, "white", "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1, [px + 0.05 + spinner * 1.55, cy, cz]);
    fan(m, "white", "x", st[0]!.sec, st[0]!.a, -1);
  });
}

/** A body of circular sections along x through (z, y): (offset from x0, radius) pairs, closed at both ends. */
function pod(m: MeshBuilder, mat: string, x0: number, z: number, y: number, prof: Array<[number, number]>, n = 12, tipFront?: number, tipBack?: number): void {
  const st: Station[] = prof.map(([dx, r]) => ({ a: x0 + dx, sec: circle(n, z, y, Math.max(r, 0.01)) })).sort((a, b) => a.a - b.a);
  body(m, mat, "x", st);
  fan(m, mat, "x", st[0]!.sec, st[0]!.a, -1, tipBack !== undefined ? [st[0]!.a - tipBack, y, z] : undefined);
  fan(m, mat, "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1, tipFront !== undefined ? [st[st.length - 1]!.a + tipFront, y, z] : undefined);
}

/** The engines a spec names, drawn on the airframe. */
function drawEngines(m: MeshBuilder, g: Geometry): void {
  const sides = g.W > 4.5 ? 22 : g.W > 2.6 ? 18 : 14;
  g.spec.engines.forEach((e, ei) => m.scope(`engines ${ei + 1}`, () => {
    if (e.kind === "pod") {
      for (const side of [-1, 1]) for (const s of e.s) m.scope("engine", () => {
        const w = wingAt(g.wing, s);
        const lower = w.mid - w.thick * 0.42;
        const upperY = w.mid + w.thick * 0.45;
        const y = e.over ? upperY + (e.drop ?? e.r * 1.1) : lower - (e.drop ?? e.r * 0.85);
        const front = w.lead + (e.ahead ?? e.len * 0.55);
        const back = front - e.len;
        nacelle(m, "x", 1, { c: [side * s, y], front, back, r: e.r, nozzle: e.r * (e.jet ? 1.3 : 0.9), plug: e.r * 0.45, mats: ENGINE_MATS(g.mats.cowl) }, sides);
        m.scope("pylon", () => {
          const pw = Math.max(0.12, e.r * 0.16);
          const sec: Sec = e.over
            ? [[front - e.len * 0.45, y - e.r * 0.8], [w.lead - w.chord * 0.6, upperY - 0.05], [w.lead - w.chord * 0.2, upperY - 0.05], [back + e.len * 0.1, y - e.r * 0.7]]
            : [[front - e.len * 0.25, y + e.r * 0.85], [back + e.len * 0.05, y + e.r * 0.7], [w.lead - w.chord * 0.55, lower + 0.12], [Math.min(w.lead + 0.2, front - e.len * 0.2), lower + 0.25]];
          m.sweep(g.mats.cowl === "white" ? "white" : "alloy", "z", sec, side * s - pw, sec, side * s + pw);
        });
      });
    } else if (e.kind === "rear") {
      const zs = e.pair ? [e.z, e.z + e.r * 2.15] : [e.z];
      for (const side of [-1, 1]) for (const z of zs) m.scope("engine", () => {
        const front = g.x(e.d);
        nacelle(m, "x", 1, { c: [side * z, e.y], front, back: front - e.len, r: e.r, nozzle: e.r * 0.6, plug: e.r * 0.35, mats: ENGINE_MATS(g.mats.cowl) }, sides);
      });
      m.scope("pylon", () => {
        const front = g.x(e.d);
        const zOut = zs[zs.length - 1]! - e.r * 0.5;
        const sec: Sec = [[front - e.len * 0.25, e.y + e.r * 0.25], [front - e.len * 0.85, e.y + e.r * 0.15], [front - e.len * 0.85, e.y - e.r * 0.2], [front - e.len * 0.3, e.y - e.r * 0.25]];
        m.sweep(g.mats.cowl === "white" ? "white" : "alloy", "z", sec, -zOut, sec, zOut);
      });
    } else if (e.kind === "tail") {
      const front = g.x(e.d);
      if (e.duct === "straight") {
        const y = g.crown(e.d) + e.r * 0.9;
        m.scope("engine", () => nacelle(m, "x", 1, { c: [0, y], front, back: front - e.len, r: e.r, nozzle: e.r * 0.9, plug: e.r * 0.4, mats: ENGINE_MATS(g.mats.cowl) }, sides));
        m.scope("pylon", () => fin(m, "white", "x", [[g.crown(e.d + e.len * 0.5) - 0.1, front - e.len * 0.1, e.len * 0.85, e.r * 1.4, 0], [y, front - e.len * 0.15, e.len * 0.8, e.r * 1.2, 0]]));
      } else {
        // the S-duct's intake on the spine ahead of the fin, the nozzle at the tail cone's end
        const y = g.crown(e.d) + e.r * 0.55;
        m.scope("intake", () => {
          const prof: Array<[number, number, number]> = [[0, e.r, 1], [e.len * 0.25, e.r * 1.05, 1], [e.len * 0.7, e.r * 0.8, 0.7]];
          const st: Station[] = prof.map(([dd, rr, f]) => ({ a: front - dd, sec: oval(sides, 0, y - (1 - f) * e.r * 0.4, rr * 0.95, rr, rr * 1.15) })).reverse();
          body(m, g.mats.cowl, "x", st);
          annulus(m, "alloy", "x", oval(sides, 0, y, e.r * 0.95, e.r, e.r * 1.15), oval(sides, 0, y, e.r * 0.75, e.r * 0.8, e.r * 0.92), front, 1);
          fan(m, "darkGrey", "x", oval(sides, 0, y, e.r * 0.75, e.r * 0.8, e.r * 0.92), front - 0.3, 1);
          body(m, "darkGrey", "x", [{ a: front - 0.3, sec: oval(sides, 0, y, e.r * 0.75, e.r * 0.8, e.r * 0.92) }, { a: front, sec: oval(sides, 0, y, e.r * 0.75, e.r * 0.8, e.r * 0.92) }]);
        });
        m.scope("nozzle", () => {
          const tx = -g.half;
          const r = (g.spec.fuselage.tailEnd ?? e.r * 0.8) * 0.98;
          const ty = g.tailTip[1];
          annulus(m, "metalGrey", "x", circle(sides, 0, ty, r), circle(sides, 0, ty, r * 0.75), tx + 0.001, -1);
          body(m, "darkGrey", "x", [{ a: tx - 0.3, sec: circle(sides, 0, ty, r * 0.75) }, { a: tx + 0.002, sec: circle(sides, 0, ty, r * 0.75) }]);
          fan(m, "darkGrey", "x", circle(sides, 0, ty, r * 0.75), tx - 0.3, -1);
        });
      }
    } else if (e.kind === "buried") {
      for (const side of [-1, 1]) for (const s of e.s) m.scope("engine", () => {
        const w = wingAt(g.wing, s);
        // the intake stands a little ahead of the leading edge, the nacelle's top and bottom just proud of the wing's skin
        const front = w.lead + e.r * 1.2;
        nacelle(m, "x", 1, { c: [side * s, w.mid], front, back: front - e.len, r: e.r, nozzle: e.r * 0.5, plug: e.r * 0.25, mats: ENGINE_MATS(g.mats.wing) }, sides);
      });
    } else {
      for (const side of e.s.some((s) => s === 0) ? [1] : [-1, 1]) for (const s of e.s) m.scope("engine", () => {
        const nose = s === 0;
        const w = nose ? null : wingAt(g.wing, s);
        const z = side * s;
        const yc = nose ? g.noseTip[1] : e.over ? w!.mid + w!.thick * 0.45 + e.r * 0.6 : w!.mid - (e.drop ?? propDrop(g, e.style, e.r));
        const front = nose ? g.noseTip[0] + (e.style === "radial" ? 0.05 : 0.02) : w!.lead + (e.ahead ?? e.r * 2.2);
        const nsides = e.style === "radial" ? 16 : sides;
        if (e.style === "radial") {
          // a short cowl ring, the dark cylinder face inside, a fairing back to the wing
          const prof: Array<[number, number]> = [[0, e.r * 0.86], [0.05 * e.len, e.r * 0.97], [0.2 * e.len, e.r], [0.5 * e.len, e.r * 0.97]];
          const st: Station[] = prof.map(([dd, rr]) => ({ a: front - dd, sec: circle(nsides, z, yc, rr) })).reverse();
          body(m, g.mats.cowl, "x", st);
          annulus(m, g.mats.cowl, "x", circle(nsides, z, yc, e.r * 0.86), circle(nsides, z, yc, e.r * 0.62), front, 1);
          fan(m, "cowlRing", "x", circle(nsides, z, yc, e.r * 0.62), front - 0.12, 1);
          body(m, "cowlRing", "x", [{ a: front - 0.12, sec: circle(nsides, z, yc, e.r * 0.62) }, { a: front, sec: circle(nsides, z, yc, e.r * 0.62) }]);
          if (!nose) {
            const back = w!.lead - w!.chord * 0.75;
            const st2: Station[] = [[front - 0.5 * e.len, e.r * 0.96], [w!.lead - w!.chord * 0.2, e.r * 0.8], [back, e.r * 0.3]].map(([a, rr]) => ({ a: a!, sec: oval(12, z, yc - e.r * 0.05, rr!, rr! * 0.9, rr!) })).reverse();
            body(m, g.mats.cowl, "x", st2);
            fan(m, g.mats.cowl, "x", st2[0]!.sec, st2[0]!.a, -1, [back - e.r * 0.4, yc, z]);
          }
        } else if (!nose) {
          // a turboprop's or inline engine's nacelle: deep under (or over) the wing, tapering behind it
          const deep = e.style === "turboprop" ? 1.35 : 1.1;
          const back = Math.min(w!.lead - w!.chord - e.r * (e.style === "turboprop" ? 1.5 : 0.8), front - e.len);
          const prof: Array<[number, number, number]> = [[front, 0.55, 0.55], [front - e.r * 0.5, 0.92, 0.9], [front - e.r * 1.4, 1, 1], [w!.lead - w!.chord * 0.6, 0.95, 1], [back + e.r * 0.8, 0.5, 0.6], [back, 0.14, 0.2]];
          const st: Station[] = prof.map(([a, fw, fh]) => ({ a, sec: oval(nsides, z, yc, e.r * fw, e.r * fh * (e.over ? deep : 0.95), e.r * fh * (e.over ? 0.95 : deep)) })).reverse();
          body(m, g.mats.cowl, "x", st);
          fan(m, g.mats.cowl, "x", st[0]!.sec, st[0]!.a, -1);
          fan(m, g.mats.cowl, "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1);
          if (e.style === "turboprop") m.scope("exhaust", () => {
            const ex: Station[] = [[front - e.r * 2.2, 0.16], [front - e.r * 3.2, 0.16]].map(([a, rr]) => ({ a: a!, sec: circle(6, z + side * e.r * 0.92, yc + e.r * 0.05, e.r * rr!) })).reverse();
            body(m, "darkGrey", "x", ex);
            fan(m, "darkGrey", "x", ex[0]!.sec, ex[0]!.a, -1);
          });
        }
        propeller(m, front + 0.02, [yc, z], e.prop, e.blades, Math.max(0.12, e.r * (nose ? 0.45 : 0.42)), side > 0 ? 0 : Math.PI / e.blades / 2);
      });
    }
  }));
}

/** How far a wing propeller's axis sits below the wing's chord line: under a high wing, a little above a low one. */
const propDrop = (g: Geometry, style: "turboprop" | "radial" | "inline", r: number): number =>
  g.spec.wing.pos === "high" || g.spec.wing.pos === "shoulder" ? (style === "turboprop" ? r * 0.25 : r * 0.1) : style === "radial" ? -r * 0.05 : -r * 0.25;

/** Rods between two model points per side. */
const mirrorRod = (m: MeshBuilder, mat: string, p: Vec3, q: Vec3, r: number, n = 6): void => {
  rod(m, mat, p, q, r, n);
  rod(m, mat, [p[0], p[1], -p[2]], [q[0], q[1], -q[2]], r, n);
};

/** The gear legs, wheels, floats or skis. */
function drawGear(m: MeshBuilder, g: Geometry): void {
  const gs = g.spec.gear;
  const wingLow = g.spec.wing.pos === "low" || g.spec.wing.pos === "mid";
  const tyreN = g.W > 4 ? 16 : 12;
  const topOf = (leg: GearLeg): number => {
    if (leg.top !== undefined) return leg.top;
    const az = Math.abs(leg.z);
    if (wingLow && az > g.hw(leg.d) * 0.8 && az < g.wing[g.wing.length - 1]!.s) return wingUnder(g.wing, az) + 0.1;
    return g.keel(leg.d) + Math.min(0.4, g.D * 0.12);
  };
  const leg = (name: string, l: GearLeg, z: number): void => m.scope(name, () => {
    const xg = g.x(l.d);
    const y = axleY(gs.kind === "skis" ? 0.12 : 0, l.r, tyreN);
    const top = topOf(l);
    const axles = l.axles ?? 1;
    const pitch = l.r * 2.3;
    const tw = l.twin ? l.r * 0.72 : 0;
    const width = Math.max(0.1, l.r * 0.55);
    rod(m, "alloy", [xg, top, z], [xg, y + (axles > 1 ? l.r * 0.15 : 0.02), z], Math.max(0.04, l.r * (axles > 1 ? 0.26 : 0.2)), 8);
    if (axles > 1) rod(m, "steel", [xg - pitch * (axles - 1) / 2 - l.r * 0.3, y, z], [xg + pitch * (axles - 1) / 2 + l.r * 0.3, y, z], Math.max(0.05, l.r * 0.18));
    for (let i = 0; i < axles; i++) {
      const a = xg + (i - (axles - 1) / 2) * pitch;
      if (l.twin) {
        rod(m, "alloy", [a, y, z - tw - width * 0.4], [a, y, z + tw + width * 0.4], Math.max(0.03, l.r * 0.12));
        for (const sd of [-1, 1]) wheel(m, "z", z + sd * tw - width / 2, z + sd * tw + width / 2, [a, y], l.r, l.r * 0.45, "alloy", tyreN);
      } else wheel(m, "z", z - width / 2, z + width / 2, [a, y], l.r, l.r * 0.45, "alloy", tyreN);
      if (gs.kind === "skis") m.scope("ski", () => {
        const len = l.r * 4.2;
        plate(m, "metalGrey", [a, 0.06, z], [1, 0, 0], [0, 0, 1], [[-len * 0.45, -width * 0.9], [len * 0.4, -width * 0.9], [len * 0.55, -width * 0.6], [len * 0.55, width * 0.6], [len * 0.4, width * 0.9], [-len * 0.45, width * 0.9]], 0.06);
      });
    }
    if (gs.spats) m.scope("spat", () => pod(m, matOfCowl(g), xg, z, y + l.r * 0.15, [[-l.r * 1.6, l.r * 0.25], [-l.r * 0.6, width * 0.9], [l.r * 0.5, width * 0.95], [l.r * 1.3, width * 0.5]], 8));
  });
  if (gs.nose) leg(gs.kind === "taildragger" ? "tail wheel" : "nose gear", gs.nose, 0);
  for (const l of gs.mains) {
    if (l.z === 0) leg("centre gear", l, 0);
    else for (const side of [-1, 1]) leg(`${side > 0 ? "right" : "left"} main gear`, l, side * l.z);
  }
}

const matOfCowl = (g: Geometry): string => (g.mats.cowl === "white" ? "white" : g.mats.cowl);

/** Floats, a hull's wingtip floats and sponsons, gear pods: fixed shapes under the airframe. */
function drawFloats(m: MeshBuilder, g: Geometry): void {
  const gs = g.spec.gear;
  if (gs.floats) m.scope("floats", () => {
    const f = gs.floats!;
    const x0 = g.x(f.d);
    const hwF = f.depth * 0.55;
    for (const side of [-1, 1]) {
      const z = side * f.track / 2;
      // a float: a pointed, raised bow, a flat deck, a stern tapering up to a point
      const prof: Array<[number, number, number]> = [[0, 0.1, 0.35], [0.04, 0.55, 0.62], [0.12, 0.9, 0.85], [0.3, 1, 1], [0.55, 1, 1], [0.75, 0.8, 0.75], [1, 0.15, 0.25]];
      const st: Station[] = prof.map(([t, fw, fh]) => {
        const depth = f.depth * fh!;
        return { a: x0 - t! * f.len, sec: oval(10, z, f.depth - depth / 2 + (t! < 0.12 ? (0.12 - t!) * f.depth * 1.5 : t! > 0.6 ? (t! - 0.6) * f.depth * 0.9 : 0), hwF * fw!, depth / 2, depth / 2, 2.6) };
      }).reverse();
      body(m, "white", "x", st);
      fan(m, "white", "x", st[0]!.sec, st[0]!.a, -1);
      fan(m, "white", "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1);
      // struts up to the fuselage
      for (const t of [0.2, 0.55]) rod(m, "alloy", [x0 - t * f.len, f.depth - 0.05, z], [x0 - t * f.len, g.keel(f.d + t * f.len) + 0.15, side * g.W * 0.3], 0.05);
    }
  });
  if (gs.tipFloats) m.scope("wingtip floats", () => {
    const tf = gs.tipFloats!;
    for (const side of [-1, 1]) {
      const w = wingAt(g.wing, tf.s);
      const yb = w.mid - w.thick * 0.4 - tf.drop;
      const xf = w.lead - w.chord * 0.1;
      pod(m, "white", xf - tf.len, side * tf.s, yb, [[0, tf.len * 0.04], [tf.len * 0.3, tf.len * 0.13], [tf.len * 0.7, tf.len * 0.14], [tf.len, tf.len * 0.05]], 10, tf.len * 0.08, tf.len * 0.05);
      rod(m, "white", [xf - tf.len * 0.45, yb + tf.len * 0.1, side * tf.s], [xf - tf.len * 0.35, w.mid - w.thick * 0.3, side * tf.s], 0.08);
    }
  });
  if (gs.sponsons) m.scope("sponsons", () => {
    const sp = gs.sponsons!;
    const y = g.keelY + g.D * 0.28;
    for (const side of [-1, 1]) wing(m, "white", "z", [0, sp.span].map((s) => ({ s: side * s, lead: g.x(sp.d) - s * 0.2, chord: sp.chord * (s > 0 ? 0.7 : 1), thick: sp.chord * 0.18, mid: y - s * 0.05 })));
  });
  if (gs.fairing) m.scope("gear fairings", () => {
    const f = gs.fairing!;
    const len = f.d1 - f.d0;
    for (const side of [-1, 1]) {
      const st: Station[] = [[0, 0.2, 0.5], [0.12, 0.85, 0.9], [0.3, 1, 1], [0.7, 1, 1], [0.9, 0.8, 0.85], [1, 0.2, 0.4]].map(([t, fw, fh]) => ({
        a: g.x(f.d0 + t! * len), sec: oval(10, side * (f.hw - f.hw * 0.2 * fw!), g.keel(f.d0 + len / 2) + f.h * 0.5, f.hw * 0.42 * fw!, f.h * 0.5 * fh!, f.h * 0.5 * fh!),
      })).reverse();
      body(m, g.livery.skin!(-0.6, 0), "x", st);
      fan(m, g.livery.skin!(-0.6, 0), "x", st[0]!.sec, st[0]!.a, -1);
      fan(m, g.livery.skin!(-0.6, 0), "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1);
    }
  });
  if (gs.pods) m.scope("gear pods", () => {
    for (const l of gs.mains.filter((l) => l.z !== 0)) for (const side of [-1, 1]) {
      const w = wingAt(g.wing, l.z);
      const len = w.chord * 1.7;
      pod(m, g.mats.wing, w.lead - w.chord * 0.2 - len, side * l.z, w.mid - w.thick * 0.2, [[0, 0.05], [len * 0.25, l.r * 0.9], [len * 0.75, l.r * 1.1], [len, l.r * 0.4]], 10, 0.3, 0.2);
    }
  });
}

/** The triangles of `pts` whose corners are all finite: a decal corner the skin search missed drops its triangle. */
function finite(pts: Vec3[]): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i + 2 < pts.length; i += 3) if ([pts[i]!, pts[i + 1]!, pts[i + 2]!].every((p) => p.every(Number.isFinite))) out.push(pts[i]!, pts[i + 1]!, pts[i + 2]!);
  return out;
}

/** Cabin windows, doors, the cockpit glazing, cheatlines and titles: decals on the fuselage. */
function drawDecals(m: MeshBuilder, g: Geometry): void {
  const fus = g.stations;
  const s = g.spec;
  const off = Math.max(0.012, g.W * 0.008);
  const dw = Math.min(0.55, Math.max(0.3, g.D * 0.12));
  const dh = Math.min(1.0, Math.max(0.55, g.D * 0.27));
  // whether the section at d spans heights y0..y1 on its side, with a margin
  const covered = (d: number, y0: number, y1: number): boolean => {
    const sec = secAt(fus, g.x(d));
    const lo = Math.min(...sec.map((p) => p[1]));
    const hi = Math.max(...sec.map((p) => p[1]));
    return lo < y0 - 0.05 && hi > y1 + 0.05;
  };
  if (!s.cargo) m.scope("cabin windows", () => {
    for (const side of [-1, 1]) {
      const pts: Vec3[] = [];
      for (const row of s.windows) {
        const yc = g.keelY + (row.y ?? 0.6) * g.D;
        const hw = row.w ?? Math.min(0.14, g.D * 0.035);
        const hh = row.h ?? hw * 1.4;
        for (let d = row.from; d <= row.to + 1e-6; d += row.pitch) {
          if (s.doors.some((dd) => Math.abs(dd - d) < dw + hw + 0.05)) continue;
          if (!covered(d, yc - hh, yc + hh)) continue;
          const xa = g.x(d);
          const outline: P2[] = row.shape === "rect" ? [[xa - hw, yc - hh], [xa + hw, yc - hh], [xa + hw, yc + hh], [xa - hw, yc + hh]]
            : row.shape === "tri" ? [[xa - hw, yc + hh], [xa - hw * 0.15, yc - hh], [xa + hw * 0.15, yc - hh], [xa + hw, yc + hh]]
            : ovalOutline(xa, yc, hw, hh, row.shape === "round" ? 8 : 6);
          pts.push(...skinDecal("x", fus, outline, side, off * 2.2, 1));
        }
      }
      if (pts.length) m.facets("glass", finite(pts), [0, 0, side]);
    }
  });
  if (s.doors.length) m.scope("doors", () => {
    for (const side of [-1, 1]) {
      const pts: Vec3[] = [];
      const yc = g.keelY + 0.48 * g.D;
      for (const d of s.doors) {
        if (!covered(d, yc - dh / 2, yc + dh / 2)) continue;
        pts.push(...gridTris((u, v) => skinY("x", fus, lerp(g.x(d) - dw, g.x(d) + dw, u), lerp(yc - dh / 2, yc + dh / 2, v), side, off * 1.8), 2, 4));
      }
      if (pts.length) m.facets("door", finite(pts), [0, 0, side]);
    }
  });
  m.scope("cockpit windows", () => {
    const sc = g.screen;
    if (sc.d1 >= sc.d0 - 0.02) return;
    for (const side of [-1, 1]) {
      const screen = gridTris((u, v) => skinEnd("x", fus, side * lerp(0.05, sc.u1, u), lerp(lerp(sc.y0, sc.y0 + 0.03, u), lerp(sc.y1, sc.y1 - 0.05, u), v), g.x(sc.d0 + 1.5), g.noseTip[0], off * 2.5, insideAny), 5, 3);
      m.facets("glass", screen, [0.8, 0.5, side * 0.4]);
      // the side panes, just behind the windscreen
      const a0 = g.x(sc.d0 + 0.08);
      const len = Math.max(0.35, g.W * 0.2);
      const pane: P2[] = [[a0, sc.y0], [a0 - len, sc.y0], [a0 - len, sc.y1 - (sc.y1 - sc.y0) * 0.2], [a0 - len * 0.1, sc.y1 - (sc.y1 - sc.y0) * 0.1]];
      m.facets("glass", skinDecal("x", fus, pane, side, off * 2.5, 2, 2), [0, 0, side]);
    }
    if (s.fuselage.nose === "glazed") {
      // the navigator's glazed nose: panes round the lower nose
      for (const side of [-1, 1]) {
        const yb = g.noseTip[1];
        const tip = gridTris((u, v) => skinEnd("x", fus, side * lerp(0.03, g.W * 0.22, u), lerp(yb - g.D * 0.1, yb + g.D * 0.12, v), g.x(g.noseLen * 0.6), g.noseTip[0], off * 2.5, insideAny), 3, 3);
        m.facets("glass", tip, [1, 0, side * 0.3]);
      }
    }
  });
  const l = g.livery;
  if (l.stripes?.length) m.scope("cheatline", () => {
    for (const st of l.stripes!) for (const side of [-1, 1]) m.facets(st.mat, skinStripe("x", fus, st.a0, st.a1, st.y0, st.y1, side, off * 1.2), [0, 0, side]);
  });
  const titles = s.scheme.titles;
  if (titles) m.scope("titles", () => {
    const h = Math.min(1.4, Math.max(0.25, g.D * 0.13));
    const [w, gap] = [h * 0.72, h * 0.22];
    const width = strokeWidth(titles.text, w, gap);
    const y = g.keelY + g.D * 0.74;
    const c = g.x(Math.max(g.noseLen * 1.3, s.length * 0.3));
    const fits = y + h < g.crown(g.half - c) - 0.05;
    if (!fits) return;
    const mat = matOf(s.schemeKey, s.scheme, titles.mat);
    for (const side of [-1, 1]) {
      const uv = strokeText(titles.text, side > 0 ? c - width / 2 : c + width / 2, y, h, w, gap, side < 0, h * 0.16);
      m.facets(mat, splitLong(uv, Math.max(0.3, g.W * 0.12)).map(([u, v]) => skinY("x", fus, u, v, side, off * 2.8)), [0, 0, side]);
    }
  });
}

/** The fuselage skin, nose and tail cone. */
function drawFuselage(m: MeshBuilder, g: Geometry): void {
  const fus = g.stations;
  const l = g.livery;
  m.scope("skin", () => (l.cut ? cutBody(m, "x", fus, l.skin!, l.cut) : paintedBody(m, "x", fus, l.skin!)));
  const last = fus[fus.length - 1]!;
  const first = fus[0]!;
  const noseMat = l.skin!(0, last.a);
  m.scope("nose", () => {
    if (g.spec.fuselage.nose === "cowl") fan(m, noseMat, "x", last.sec, last.a, 1);
    else fan(m, noseMat, "x", last.sec, last.a, 1, g.noseTip);
  });
  const tailMat = l.cut?.mat ?? l.skin!(0, first.a);
  const sDuct = g.spec.engines.some((e) => e.kind === "tail" && e.duct === "s");
  m.scope("tail cone", () => (sDuct ? fan(m, tailMat, "x", first.sec, first.a, -1) : fan(m, tailMat, "x", first.sec, first.a, -1, g.tailTip)));
  // a low-wing airliner's belly fairing under the wing box
  const w = g.spec.wing;
  if (w.pos === "low" && g.W >= 2.9 && !w.plan && !g.spec.fuselage.hull) m.scope("belly fairing", () => {
    const [d0, d1] = [w.at - w.root * 0.12, w.at + w.root * 0.95];
    const y = g.keel((d0 + d1) / 2) + g.D * 0.06;
    const hw = g.W * 0.4;
    const dy = g.D * 0.11;
    const st: Station[] = [[0, 0.15, 0.3], [0.08, 0.6, 0.7], [0.25, 1, 1], [0.75, 1, 1], [0.92, 0.65, 0.75], [1, 0.15, 0.3]]
      .map(([f, fw, fh]) => ({ a: g.x(lerp(d1, d0, f!)), sec: oval(14, 0, y + dy * (1 - fh!) * 0.5, hw * fw!, dy * fh!, dy * fh!) }));
    const mat = l.skin!(-0.95, g.x((d0 + d1) / 2)) === "white" ? "belly" : l.skin!(-0.95, g.x((d0 + d1) / 2));
    body(m, mat, "x", st);
    fan(m, mat, "x", st[0]!.sec, st[0]!.a, -1);
    fan(m, mat, "x", st[st.length - 1]!.sec, st[st.length - 1]!.a, 1);
  });
}

/** Builds an aircraft from its spec. */
export function airframe(spec: AirframeSpec): MeshBuilder {
  const g = geometry(spec);
  const m = new MeshBuilder(airframePalette(spec));
  const draw = (): void => {
    m.scope("fuselage", () => {
      drawFuselage(m, g);
      drawDecals(m, g);
    });
    m.scope("wings", () => {
      for (const side of [-1, 1]) m.scope(side > 0 ? "right wing" : "left wing", () => {
        m.scope("wing", () => wing(m, g.mats.wing, "z", g.wing.map((w) => ({ ...w, s: side * w.s }))));
        if (g.upper) m.scope("upper wing", () => wing(m, g.mats.wing, "z", g.upper!.map((w) => ({ ...w, s: side * w.s }))));
      });
      if (g.devices.length) m.scope("winglets", () => g.devices.forEach((d) => fin(m, g.mats.winglet, "x", d.rings, 1, d.top)));
      if (spec.wing.tipDevice === "tiptank") m.scope("tip tanks", () => {
        const tw = g.wing[g.wing.length - 1]!;
        const len = Math.max(2, tw.chord * 2.6);
        const r = len * 0.12;
        for (const side of [-1, 1]) pod(m, g.mats.winglet, tw.lead - tw.chord * 0.5 - len / 2, side * (tw.s + r * 0.6), tw.mid, [[0, r * 0.3], [len * 0.25, r], [len * 0.6, r], [len, r * 0.25]], 12, r * 0.8, r * 0.4);
      });
      if (spec.wing.strut !== undefined) m.scope("struts", () => {
        const s = spec.wing.strut! * g.wing[g.wing.length - 1]!.s;
        const w = wingAt(g.wing, s);
        const xr = g.x(spec.wing.at + spec.wing.root * 0.3);
        const dRoot = spec.wing.at + spec.wing.root * 0.3;
        mirrorRod(m, "alloy", [xr, g.keel(dRoot) + g.D * 0.12, g.hw(dRoot) * 0.9], [w.lead - w.chord * 0.3, w.mid - w.thick * 0.3, s], Math.max(0.03, g.W * 0.025), 6);
      });
      if (g.upper && spec.wing.upper) m.scope("interplane struts", () => {
        const u = spec.wing.upper!;
        for (const f of u.struts) {
          const s = f * u.span / 2;
          const lw = wingAt(g.wing, s);
          const uw = wingAt(g.upper!, s);
          for (const fr of [0.2, 0.7]) mirrorRod(m, "alloy", [lerp(lw.lead, lw.lead - lw.chord, fr), lw.mid + lw.thick * 0.3, s], [lerp(uw.lead, uw.lead - uw.chord, fr), uw.mid - uw.thick * 0.3, s], 0.04, 5);
        }
        // the cabane struts over the fuselage
        const uw = wingAt(g.upper!, g.W * 0.35);
        for (const fr of [0.2, 0.7]) mirrorRod(m, "alloy", [lerp(uw.lead, uw.lead - uw.chord, fr), g.crown(spec.length / 3) - 0.05, g.W * 0.3], [lerp(uw.lead, uw.lead - uw.chord, fr), uw.mid - uw.thick * 0.3, g.W * 0.35], 0.04, 5);
      });
      drawEngines(m, g);
    });
    m.scope("tail", () => {
      if (g.fin) m.scope("fin", () => liveryFin(m, g.livery, "x", g.fin!));
      g.endFins.forEach((r, i) => m.scope(`fin ${i + 1}`, () => liveryFin(m, g.livery, "x", r)));
      if (spec.tail.plane) m.scope("tailplane", () => {
        for (const side of [-1, 1]) wing(m, g.mats.wing, "z", g.plane.map((w) => ({ ...w, s: side * w.s })));
      });
    });
    m.scope("fixed undercarriage", () => drawFloats(m, g));
    if (!spec.gear.retract && spec.gear.kind !== "floats" && spec.gear.kind !== "none") m.scope("undercarriage", () => drawGear(m, g));
    if (spec.extra) m.scope("details", () => spec.extra!(m, g));
  };
  const retract = spec.gear.retract && spec.gear.kind !== "none" && spec.gear.kind !== "floats";
  if (retract) {
    m.part("airframe", [0, 0, 0], draw);
    m.part("gear", [0, 0, 0], () => drawGear(m, g));
  } else draw();
  return m;
}

// --- the distant model ---------------------------------------------------------------------

/** The aircraft's LOD: the same spec on `airLod` (lodAir.ts), 200 triangles. */
export function airframeLod(spec: AirframeSpec): MeshBuilder {
  const g = geometry(spec);
  const l = g.livery;
  const half = (st: WingStation[], mat: string, optional?: number): AirWing => ({ axis: "z", stations: st, mirror: true, mat, ...(optional !== undefined ? { optional } : {}) });
  const engines: AirEngine[] = [];
  const pods: AirPod[] = [];
  const parts: Array<{ draw: (m: MeshBuilder) => void; optional?: number }> = [];
  for (const e of spec.engines) {
    if (e.kind === "pod") {
      e.s.forEach((s, i) => {
        const w = wingAt(g.wing, s);
        const y = e.over ? w.mid + w.thick * 0.45 + (e.drop ?? e.r * 1.1) : w.mid - w.thick * 0.42 - (e.drop ?? e.r * 0.85);
        const front = w.lead + (e.ahead ?? e.len * 0.55);
        for (const side of [-1, 1]) engines.push({ axis: "x", c: [side * s, y], front, back: front - e.len - e.r * 0.8, r: e.r, cowl: l.cowl, intake: "darkGrey", nozzle: "metalGrey", ...(i > 0 ? { optional: 4 } : {}) });
      });
    } else if (e.kind === "rear") {
      (e.pair ? [e.z, e.z + e.r * 2.15] : [e.z]).forEach((z, i) => { for (const side of [-1, 1]) engines.push({ axis: "x", c: [side * z, e.y], front: g.x(e.d), back: g.x(e.d) - e.len - e.r * 0.5, r: e.r, cowl: l.cowl, intake: "darkGrey", nozzle: "metalGrey", ...(i > 0 ? { optional: 4 } : {}) }); });
    } else if (e.kind === "tail") {
      const y = e.duct === "straight" ? g.crown(e.d) + e.r * 0.9 : g.crown(e.d) + e.r * 0.55;
      engines.push({ axis: "x", c: [0, y], front: g.x(e.d), back: g.x(e.d) - e.len * (e.duct === "straight" ? 1.1 : 0.6), r: e.r, cowl: l.cowl, intake: "darkGrey", nozzle: "metalGrey" });
    } else if (e.kind === "buried") {
      for (const side of [-1, 1]) for (const s of e.s) {
        const w = wingAt(g.wing, s);
        engines.push({ axis: "x", c: [side * s, w.mid], front: w.lead + e.r * 1.2, back: w.lead + e.r * 1.2 - e.len, r: e.r, cowl: g.mats.wing, intake: "darkGrey", nozzle: "metalGrey", optional: 3 });
      }
    } else {
      const nose = e.s.includes(0);
      for (const s of e.s) {
        if (s === 0) continue;
        const w = wingAt(g.wing, s);
        const yc = e.over ? w.mid + w.thick * 0.45 + e.r * 0.6 : w.mid - (e.drop ?? propDrop(g, e.style, e.r));
        const front = w.lead + (e.ahead ?? e.r * 2.2);
        for (const side of [-1, 1]) engines.push({ axis: "x", c: [side * s, yc], front, back: Math.min(w.lead - w.chord - e.r, front - e.len), r: e.r, cowl: l.cowl, intake: e.style === "radial" ? "darkGrey" : l.cowl, nozzle: l.cowl });
      }
      // the propellers standing still: a blade up and down, a thin slab
      parts.push({ optional: 1, draw: (m) => {
        for (const s of e.s) for (const side of s === 0 ? [1] : [-1, 1]) {
          const w = s === 0 ? null : wingAt(g.wing, s);
          const yc = s === 0 ? g.noseTip[1] : e.over ? w!.mid + w!.thick * 0.45 + e.r * 0.6 : w!.mid - (e.drop ?? propDrop(g, e.style, e.r));
          const px = (s === 0 ? g.noseTip[0] + 0.08 : w!.lead + (e.ahead ?? e.r * 2.2) + 0.06);
          const z = side * s;
          const cw = Math.max(0.1, e.prop * 0.1);
          for (const [dx, nx] of [[0.02, 1], [-0.02, -1]] as const) lodPolygon(m, "prop", [[px + dx, yc - e.prop, z - cw], [px + dx, yc - e.prop, z + cw], [px + dx, yc + e.prop, z + cw], [px + dx, yc + e.prop, z - cw]], [nx, 0, 0]);
        }
      } });
      void nose;
    }
  }
  const fins: AirFin[] = [];
  if (g.fin) fins.push({ chordAxis: "x", rings: g.fin, bands: l.fin });
  for (const r of g.endFins) fins.push({ chordAxis: "x", rings: r, bands: l.fin });
  g.devices.forEach((d) => fins.push({ chordAxis: "x", rings: d.rings, bands: [[-1e3, l.winglet]], top: d.top, optional: 2 }));
  const wings: AirWing[] = [half(g.wing, g.mats.wing), ...(spec.tail.plane ? [half(g.plane, g.mats.wing)] : [])];
  if (g.upper) wings.push(half(g.upper, g.mats.wing));
  const gs = spec.gear;
  if (gs.floats) {
    const f = gs.floats;
    for (const side of [-1, 1]) pods.push({ axis: "x", stations: [[1, 0.6], [0.7, 1], [0.15, 0.9], [0, 0.3]].map(([t, r]) => ({ a: g.x(f.d) - t! * f.len, sec: circle(8, side * f.track / 2, f.depth / 2, f.depth * 0.5 * r!) })), mat: "white", sides: 5 });
  }
  if (spec.wing.tipDevice === "tiptank") {
    const tw = g.wing[g.wing.length - 1]!;
    const len = Math.max(2, tw.chord * 2.6);
    for (const side of [-1, 1]) pods.push({ axis: "x", stations: [[0, 0.3], [0.3, 1], [0.7, 1], [1, 0.3]].map(([t, r]) => ({ a: tw.lead - tw.chord * 0.5 - len / 2 + t! * len, sec: circle(8, side * (tw.s + len * 0.07), tw.mid, len * 0.12 * r!) })), mat: g.mats.winglet, sides: 5, optional: 2 });
  }
  if (!gs.retract && gs.kind !== "floats" && gs.kind !== "none") {
    parts.push({ draw: (m) => {
      for (const leg of [...(gs.nose ? [gs.nose] : []), ...gs.mains]) for (const side of leg.z === 0 ? [1] : [-1, 1]) {
        const z = side * leg.z;
        const xg = g.x(leg.d);
        lodAxleWheel(m, "darkGrey", "z", xg, leg.r, leg.r, z - leg.r * 0.25, z + leg.r * 0.25 * (z === 0 ? 1 : 1), 6);
      }
    } });
    parts.push({ optional: 2, draw: (m) => {
      for (const leg of gs.mains) for (const side of leg.z === 0 ? [1] : [-1, 1]) lodBar(m, "alloy", [g.x(leg.d), g.keel(leg.d) + 0.1, side * Math.min(leg.z, g.W * 0.4)], [g.x(leg.d), leg.r * 1.2, side * leg.z], Math.max(0.04, leg.r * 0.2), 3);
    } });
  }
  if (spec.wing.strut !== undefined) parts.push({ optional: 2, draw: (m) => {
    const s = spec.wing.strut! * g.wing[g.wing.length - 1]!.s;
    const w = wingAt(g.wing, s);
    const dRoot = spec.wing.at + spec.wing.root * 0.3;
    for (const side of [-1, 1]) lodBar(m, "alloy", [g.x(dRoot), g.keel(dRoot) + g.D * 0.12, side * g.hw(dRoot) * 0.9], [w.lead - w.chord * 0.3, w.mid - w.thick * 0.3, side * s], Math.max(0.03, g.W * 0.025), 3);
  } });
  const sc = g.screen;
  return airLod({
    palette: airframePalette(spec), axis: "x", fuselage: g.stations,
    ...(spec.fuselage.nose === "cowl" ? {} : { nose: g.noseTip }),
    ...(spec.engines.some((e) => e.kind === "tail" && e.duct === "s") ? {} : { tail: g.tailTip }),
    noseMat: l.skin!(0, g.stations[g.stations.length - 1]!.a), tailMat: l.cut?.mat ?? l.skin!(0, g.stations[0]!.a),
    paint: (s, a, p) => (l.cut && p[0] < l.cut.x0 - l.cut.slope * (p[1] - l.cut.y0) ? l.cut.mat : l.skin!(s, a)),
    ...(sc.d1 < sc.d0 - 0.02 ? { windscreen: { a0: g.x(sc.d0 + g.W * 0.2), a1: g.x(Math.max(0, sc.d1 - 0.2)), s: 0.35 } } : {}),
    keep: l.cut && !spec.fuselage.hump ? [0, 0.5, 1].map((f) => l.cut!.x0 - l.cut!.slope * f * g.D) : [],
    wings, fins, engines, pods, parts,
  });
}

// --- the fleet harness ------------------------------------------------------------------------

/** The kit options a spec uses (worldFleet.ts): the covering sample sweeps each at least once. */
export function aircraftFeatures(spec: AirframeSpec, params: readonly string[]): string[] {
  const f = spec.fuselage;
  const engines = spec.engines.map((e) => (e.kind === "prop" ? `engine:${e.style}${e.s.includes(0) ? "-nose" : ""}${e.over ? "-over" : ""}` : e.kind === "pod" ? `engine:pod${e.over ? "-over" : ""}` : e.kind === "tail" ? `engine:tail-${e.duct}` : e.kind === "rear" && e.pair ? "engine:rear-pair" : `engine:${e.kind}`));
  const count = spec.engines.reduce((n, e) => n + (e.kind === "pod" || e.kind === "prop" ? e.s.reduce((k, s) => k + (s === 0 ? 1 : 2), 0) : e.kind === "rear" ? (e.pair ? 4 : 2) : e.kind === "buried" ? 2 * e.s.length : 1), 0);
  return [
    `nose:${f.nose}`,
    ...(f.hump ? ["hump"] : []), ...(f.hull ? ["hull"] : []), ...(f.lobes ? ["lobes"] : []), ...(f.corner !== undefined ? ["box-section"] : []),
    `wing:${spec.wing.pos}`, `tip:${spec.wing.tipDevice ?? "none"}`,
    ...(spec.wing.kink ? ["wing:kink"] : []), ...(spec.wing.strut !== undefined ? ["wing:strut"] : []), ...(spec.wing.upper ? ["wing:biplane"] : []),
    ...new Set(engines), `engines:${count}`,
    `tail:${spec.tail.kind}`, ...(spec.tail.fin.dorsal ? ["fin:dorsal"] : []),
    `gear:${spec.gear.kind}`, spec.gear.retract ? "gear:retract" : "gear:fixed",
    ...(spec.gear.pods ? ["gear:pods"] : []), ...(spec.gear.spats ? ["gear:spats"] : []), ...(spec.gear.tipFloats ? ["gear:tip-floats"] : []), ...(spec.gear.sponsons ? ["gear:sponsons"] : []),
    ...(spec.gear.mains.some((l) => (l.axles ?? 1) > 1) ? ["gear:bogie"] : []),
    ...(spec.cargo ? ["cargo"] : []), ...new Set(spec.windows.map((w) => `window:${w.shape ?? "oval"}`)),
    ...(spec.scheme.titles ? ["titles"] : []), ...(spec.scheme.stripes?.length ? ["cheatline"] : []), ...(spec.scheme.tail?.slope ? ["tail-cut"] : []),
    ...(spec.extra ? ["extra"] : []),
    ...(spec.wing.plan ? ["wing:plan"] : []), ...(spec.gear.fairing ? ["gear:fairings"] : []), ...(f.bulge ? ["bulge"] : []),
    ...(spec.tail.plane ? [] : ["no-tailplane"]), ...(spec.gear.mains.some((l) => l.twin) ? ["gear:twin"] : []),
    ...params.map((p) => `param:${p}`),
  ];
}

/** Resolves a spec function's parameters (re-exported for the designs). */
export type SpecFn = (p?: ParamValues) => AirframeSpec;
