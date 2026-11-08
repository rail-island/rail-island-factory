// The North American streamlined carbodies: the EMD F7A cab unit (1949), the GE
// P42DC "Genesis" (1996), the Siemens ALC-42 "Charger" (2022), the Pennsylvania
// Railroad's GG1 electric (1935) and the first Acela Express (2000) with its
// coaches and train. Drawn at their real size (the US loading gauge,
// loadingGauge.ts) on the carbody kit (carbodyKit.ts): each body is lofted
// through slices from its nose tables. Registered in generate.ts as one family:
// a design's JS model imports its builder by name from this module.
// See docs/models/us-carbodies.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import { MeshBuilder as Builder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { bogie, exhaust, extrude, horn, paint, roofFan, tankX, type BogieSpec } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { cross, unit as norm, type Pt } from "./sliceLoft.ts";
import { crownPane, crownPoint, halfSlice, roundedPane, shapedCrownPane, sideDecal, sideLettering, sidePanel, sliceCabin, surfaceDisc, surfacePoint, type PaneOutline, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { openable, plugMove } from "./doors.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, endDiaphragm, faceLamps, pilotPlate, type CarbodySpec, type Painter } from "./carbodyKit.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { diamond, singleArm } from "./czElectricKit.ts";
import { EMU_CATALOG, enumParam } from "./emuParts.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { articulate } from "./tramKit.ts";
import { LOD_GLASS, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, pantographParts, roofPart, turnBody, type UnitBody } from "./lodUnits.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;
const COUPLER_Y = 0.88;

// ---------------------------------------------------------------------------
// Shared fittings

/** The first d (from the +X tip) at which the body's centre line reaches height y: where a lamp on the nose stands. */
function noseD(b: SliceBody, y: number, rear = false): number {
  for (let k = 0; k <= 400; k++) {
    const d = k * 0.01;
    const dd = rear ? b.length - d : d;
    if (b.B(dd) <= y && b.C(dd) >= y) return d;
  }
  return 0;
}

/** Lamps on the nose's centre: each at its height, standing on the nose's front (e +1 the +X end). */
function noseLamps(m: MeshBuilder, b: SliceBody, X: (d: number) => number, e: number, lamps: ReadonlyArray<readonly [z: number, y: number, r: number, lens: string]>): void {
  for (const l of lamps) {
    const d = noseD(b, l[1], e < 0);
    const x = X(e > 0 ? d + 0.02 : b.length - d - 0.02);
    faceLamps(m, e, e * x, [l]);
  }
}

/** A window on the side: its rubber and its glass on the slice body. */
function sideWindow(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number, frame = "rubber", glass = "glass"): void {
  sidePanel(m, b, X, s, frame, d0, d1, y0, y1, 0.006, 0.03);
  sidePanel(m, b, X, s, glass, d0 + 0.04, d1 - 0.04, y0 + 0.04, y1 - 0.04, 0.012, 0.004);
}

/** A shaped pane (roundedPane) on the crown, on side s. */
function outlinePane(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, o: PaneOutline, proud: number): void {
  shapedCrownPane(m, b, X, s, mat, o.d, o.z0, o.z1, proud, o.rows);
}

/** The d at which the slice's outer surface at height y has half width z (the first, from the +X tip): where a lamp on the nose's face stands. */
function noseDAt(b: SliceBody, y: number, z: number): number {
  let best = 0, err = Infinity;
  for (let k = 0; k <= 300; k++) {
    const d = k * 0.01;
    if (y < b.B(d) || y > b.C(d)) continue;
    const e = Math.abs(surfacePoint(b, d, y, 1).p[0] - z);
    if (e < err) [best, err] = [d, e];
    if (surfacePoint(b, d, y, 1).p[0] > z) break;
  }
  return best;
}

/** A round lamp on the nose's flank at height y and half width |z| (side sign(z)), tangent to it: its bezel and lens. */
function flankLamp(m: MeshBuilder, b: SliceBody, X: (d: number) => number, z: number, y: number, r: number, lens: string, sides = 10): void {
  const s = z < 0 ? -1 : 1;
  const d = noseDAt(b, y, Math.abs(z));
  surfaceDisc(m, b, X, d, y, s, "black", r + 0.03, 0.012, 0.05, sides);
  surfaceDisc(m, b, X, d, y, s, lens, r, 0.022, 0.01, sides);
}

/**
 * A round lamp on the crown of the nose at half width |z| (side sign(z)), where
 * the crown reaches height y, turned from the surface toward the front: its
 * housing and lens.
 */
function crownLamp(m: MeshBuilder, b: SliceBody, X: (d: number) => number, z: number, y: number, r: number, lens: string, sides = 12): void {
  const s = z < 0 ? -1 : 1;
  const zz = Math.abs(z);
  const f = (d: number, w: number) => crownPoint(b, d, w)[1];
  let d = 0;
  while (d < b.length / 2 && f(d, zz) < y) d += 0.005;
  const e = Math.sign(X(0) - X(1));
  const h = 0.02;
  const n0 = norm([e * (f(d + h, zz) - f(d - h, zz)) / (2 * h), 1, -s * (f(d, zz + h) - f(d, zz - h)) / (2 * h)]);
  const n = norm([n0[0] + e * 0.6, n0[1], n0[2]]);
  const base: Vec3 = [X(d), f(d, zz), s * zz];
  const u = norm(cross([0, 1, 0], n));
  const v = norm(cross(n, u));
  // the tilted disc's upper rim clears the surface rising behind it
  const out = 0.02 + r * 0.45;
  const ring = (rr: number, o: number): Vec3[] => Array.from({ length: sides }, (_, i) => {
    const a = (2 * Math.PI * i) / sides;
    return [0, 1, 2].map((k) => base[k]! + n[k]! * o + u[k]! * rr * Math.cos(a) + v[k]! * rr * Math.sin(a)) as Vec3;
  });
  m.slab("black", ring(r + 0.03, out), n.map((c) => -c * (out + 0.12)) as Vec3);
  m.slab(lens, ring(r, out + 0.01), n.map((c) => -c * 0.01) as Vec3);
}

/** A box standing out of the side over d0..d1, y0..y1 along the chord of the surface (a number board): `out` proud of it, `depth` deep. */
function chordBox(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, y0: number, y1: number, out: number, depth: number): void {
  const ym = (y0 + y1) / 2;
  const [p0, p1] = [d0, d1].map((d): Vec3 => [X(d), ym, s * surfacePoint(b, d, ym, s).p[0]]);
  const t = [p1![0] - p0![0], p1![2] - p0![2]];
  const l = Math.hypot(t[0]!, t[1]!);
  let n: Vec3 = [-t[1]! / l, 0, t[0]! / l];
  if (n[2] * s < 0) n = [-n[0], 0, -n[2]];
  // the chord pushed out past the surface's bulge between its ends
  const mid = surfacePoint(b, (d0 + d1) / 2, ym, s).p[0];
  const sag = Math.max(0, mid - (Math.abs(p0![2]) + Math.abs(p1![2])) / 2) * Math.abs(n[2]);
  const at = (p: Vec3, y: number): Vec3 => [p[0] + n[0] * (out + sag), y, p[2] + n[2] * (out + sag)];
  m.slab(mat, [at(p0!, y0), at(p1!, y0), at(p1!, y1), at(p0!, y1)], [-n[0] * depth, 0, -n[2] * depth]);
}

/** A grille panel on the side: its frame and slats. */
function sideGrille(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number, vertical = false): void {
  sidePanel(m, b, X, s, "grille", d0, d1, y0, y1, 0.006, 0.02);
  if (vertical) for (let d = d0 + 0.08; d < d1 - 0.05; d += 0.12) sidePanel(m, b, X, s, "louvre", d, d + 0.04, y0 + 0.05, y1 - 0.05, 0.01, 0.004);
  else for (let y = y0 + 0.06; y < y1 - 0.04; y += 0.09) sidePanel(m, b, X, s, "louvre", d0 + 0.05, d1 - 0.05, y, y + 0.035, 0.01, 0.004);
}

/** A US truck (the diesel toolkit's bogie) at model x. */
function truck(m: MeshBuilder, x: number, spec: BogieSpec): void {
  bogie(m, x, spec);
}

/** The skirt's cut-outs over trucks at model x = +-centre, for a body whose +X tip is at `tip` (d = tip - x). */
const truckCuts = (tip: number, centre: number, reach: number): Array<readonly [number, number]> =>
  [tip - centre, tip + centre].map((d) => [d - reach, d + reach] as const);

const truckSpec = (axles: number[], wheelR: number, frameHalf: number, bolster: number): BogieSpec => ({
  axles, wheelR, frameHalf, frameTop: wheelR + 0.48, frameBottom: wheelR + 0.1, frameZ: [0.92, 1.06], primary: "coil",
  secondary: axles.length > 2 ? [-1.0, 1.0] : [-0.45, 0.45], secondaryZ: 1.12, bolster,
});

/** A livery of a carbody: horizontal bands over the side, a nose field, decals and lettering. */
export interface CarbodyLivery {
  title: string;
  palette: Record<string, MaterialSpec>;
  /** Side paint by height (the faces between the skirt and the shoulder), bottom up. */
  bands: ReadonlyArray<readonly [number, number, string]>;
  roof: string;
  skirt: string;
  under: string;
  /** The nose painted over to this d from the tip (both tips of a double-ended body), up to `maxY`. */
  nose?: { d: number; mat: string; maxY?: number };
  /** Lettering along the sides: text, d of its centre, foot height, letter height, paint. */
  lettering?: { text: string; d: number; y: number; h: number; mat: string };
  number: string;
  numberMat: string;
  /** Extra decals on each side (a warbonnet's band, a GG1's pinstripes). */
  decals?: (m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number) => void;
}

function painter(l: CarbodyLivery, length: number, doubleEnded: boolean): Painter {
  const base = bandPainter(l.bands, l.roof, l.under, l.skirt);
  return (d, y, region) => {
    const n = l.nose;
    const near = n && (d < n.d || (doubleEnded && length - d < n.d));
    if (near && region !== "bottom" && region !== "skirt" && y <= (n.maxY ?? Infinity)) return n.mat;
    return base(d, y, region);
  };
}

/** The livery's edges: the band boundaries between belly and shoulder. */
const edgesOf = (l: CarbodyLivery, Y: number, S: number): number[] => [...new Set(l.bands.flatMap(([a, b]) => [a, b]))].filter((y) => y > Y + 0.01 && y < S - 0.01).sort((a, b) => a - b);

/** A strip decal along the side from d0 to d1 whose foot and head follow lo(d) and hi(d). */
function stripDecal(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, lo: (d: number) => number, hi: (d: number) => number, proud: number, n = 16): void {
  const tris: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const [a, c] = [d0 + ((d1 - d0) * i) / n, d0 + ((d1 - d0) * (i + 1)) / n];
    if (hi(a) - lo(a) < 1e-4 && hi(c) - lo(c) < 1e-4) continue;
    tris.push([a, lo(a)], [c, lo(c)], [c, hi(c)], [a, lo(a)], [c, hi(c)], [a, hi(a)]);
  }
  if (tris.length) sideDecal(m, b, X, s, mat, tris, proud);
}

// ---------------------------------------------------------------------------
// EMD F7: the A (cab) unit, the B (booster) unit and their sets

const F7_LENGTH = ft(50, 8); // 15.44 m over the couplers
const F7B_LENGTH = ft(50, 0); // 15.24 m
const F7_REACH = 0.45; // the nose tip behind the front coupler face
const F7_REAR = 0.35; // a flat end behind its coupler face
const F7_BODY = F7_LENGTH - F7_REACH - F7_REAR;
const F7B_BODY = F7B_LENGTH - 2 * F7_REAR;
const F7_TRUCK = ft(30) / 2;
const F7_LAMP_Y = 2.98;
/** The filter grilles' band along the top of the side, and the portholes' height under it. */
const F7_VENT_Y: [number, number] = [3.3, 3.66];
const F7_PORT_Y = 2.85;

export const F7_SPEC: CarbodySpec = {
  length: F7_BODY, W: 1.58, Y: 1.5, S: 3.75, C: 4.32, lean: 0.95, arc: 7, B: 1.2, wl: 1.5, A: 1.26, wa: 1.56,
  front: {
    len: 2.3, tip: 0.3, power: 2.2,
    C: [[0, 2.25], [0.08, 2.6], [0.25, 2.86], [0.55, 3.04], [1.0, 3.18], [1.6, 3.28], [1.75, 3.42], [2.2, 4.12], [2.55, 4.44], [3.0, 4.55], [4.8, 4.55], [5.2, 4.32]],
    S: [[0, 2.15], [0.3, 2.62], [1.0, 2.92], [1.6, 3.06], [2.2, 3.5], [2.6, 3.75]],
    Y: [[0, 1.95], [0.3, 1.72], [0.8, 1.55], [1.2, 1.5]],
    A: [[0, 1.62], [0.3, 1.36], [0.8, 1.26]],
    B: [[0, 1.58], [0.3, 1.32], [0.8, 1.2]],
  },
  edges: [], step: 0.6, noseStep: 0.15,
};
const { front: _f7Nose, ...F7_FLAT } = F7_SPEC;
/** The B unit: the A unit's flat body between two flat ends. */
export const F7B_SPEC: CarbodySpec = { ...F7_FLAT, length: F7B_BODY };

const F7_PAL = {
  silver: paint("#c4c8cc", 0.35), warRed: paint("#b8222a"), warYellow: paint("#f0c21c"), warBlack: paint("#1e1f21"),
  upYellow: paint("#f4b92a"), upGrey: paint("#9fa2a3"), upRed: paint("#b5202b"),
  spRed: paint("#b0262a"), spOrange: paint("#ec6c1f"), spBlack: paint("#1c1d1f"), spWhite: paint("#efefea"),
  truckGrey: paint("#4c4e50", 0.8), truckBlack: paint("#242527", 0.85),
  f7Vent: paint("#9ea2a6", 0.55), f7Slat: paint("#64686c", 0.6),
};
const pickF7 = (...n: Array<keyof typeof F7_PAL>) => Object.fromEntries(n.map((k) => [k, F7_PAL[k]]));

/** An F7 livery: the carbody's, the headlight hood's paint, the nose's herald and the B unit's side decals. */
export interface F7Livery extends CarbodyLivery {
  /** The headlight hood's paint (default the nose's). */
  hood?: string;
  /** Decals on the A unit's nose (Santa Fe's herald and whiskers). */
  front?: (m: MeshBuilder, b: SliceBody, X: (d: number) => number) => void;
  /** The B unit's side decals. */
  bDecals?: (m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number) => void;
}

// --- Santa Fe's warbonnet -----------------------------------------------------------

/** The warbonnet's heights and lengths along the A unit's side (d from the nose tip). */
const WB = {
  /** The stripe along the whole side, and the silver tongue reaching forward over it under the bonnet. */
  stripe: [1.8, 1.94] as const, tongueTop: 2.42, tongueTip: 5.0,
  /** The bonnet's top (under the shoulder), its rounded tail and the corners' radius; where the decals start (over the painted cab). */
  top: F7_SPEC.S - 0.09, tail: 7.6, corner: 0.45, from: 4.7,
  /** The yellow outline's width. */
  line: 0.06,
};

/** The red stripe along a side from d0 to d1, outlined in yellow (both units). */
function warStripe(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number): void {
  const [lo, hi] = WB.stripe;
  stripDecal(m, b, X, s, "warYellow", d0, d1, () => lo - WB.line, () => hi + WB.line, 0.004, 4);
  stripDecal(m, b, X, s, "warRed", d0, d1, () => lo, () => hi, 0.008, 4);
}

/**
 * The warbonnet on the A unit's side behind the painted cab: the red bonnet under
 * the shoulder to its rounded tail, the silver tongue reaching forward into it over
 * the stripe, the stripe running on to the rear; every edge against the silver
 * outlined in yellow (the yellow layer is the red one grown by the line's width).
 */
function warbonnet(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number): void {
  const [lo, hi] = WB.stripe;
  const mid = (WB.tongueTop + hi) / 2;
  const dc = WB.tongueTip + (WB.tongueTop - hi) / 2;
  for (const [mat, g, proud] of [["warYellow", WB.line, 0.004], ["warRed", 0, 0.008]] as const) {
    // the tongue's half height at d: a round tip, shrunk by the outline
    const r = (WB.tongueTop - hi) / 2 - g;
    const h = (d: number) => (d <= dc - r ? 0 : d >= dc ? r : Math.sqrt(Math.max(0, r * r - (dc - d) ** 2)));
    stripDecal(m, b, X, s, mat, WB.from, dc, () => lo - g, (d) => mid - h(d), proud, 10);
    stripDecal(m, b, X, s, mat, dc, F7_BODY, () => lo - g, () => hi + g, proud, 4);
    // the bonnet over the tongue, its tail's corners rounded
    const top = WB.top + g, tail = WB.tail + g, q = WB.corner + g;
    const k = (d: number) => (d <= tail - q ? 0 : q - Math.sqrt(Math.max(0, q * q - (d - (tail - q)) ** 2)));
    stripDecal(m, b, X, s, mat, WB.from, dc, (d) => mid + h(d), () => top, proud, 10);
    stripDecal(m, b, X, s, mat, dc, tail - q, () => WB.tongueTop - g, () => top, proud, 4);
    stripDecal(m, b, X, s, mat, tail - q, tail, (d) => WB.tongueTop - g + k(d), (d) => top - k(d), proud, 10);
  }
}

/** The lofted shell's half slice at d: its neighbouring stations' slices interpolated point by point, as the loft draws it. */
function shellSlice(b: SliceBody, d: number): Pt[] {
  const st = b.stations;
  let i = 0;
  while (i + 2 < st.length && st[i + 1]! < d) i++;
  const [d0, d1] = [st[i]!, st[i + 1]!];
  const t = d1 > d0 ? Math.min(1, Math.max(0, (d - d0) / (d1 - d0))) : 0;
  const [h0, h1] = [halfSlice(b, d0), halfSlice(b, d1)];
  return h0.map((p, k): Pt => [p[0] + (h1[k]![0] - p[0]) * t, p[1] + (h1[k]![1] - p[1]) * t]);
}

/** The half width of the nose's lofted surface at d and height y (-1 above its crown). */
function noseWidth(b: SliceBody, d: number, y: number): number {
  const h = shellSlice(b, d);
  if (y > h[h.length - 1]![1]) return -1;
  for (let k = 2; k + 1 < h.length; k++) {
    const [za, ya] = h[k]!;
    const [zb, yb] = h[k + 1]!;
    if ((y - ya) * (y - yb) <= 0 && Math.abs(yb - ya) > 1e-9) return za + ((y - ya) / (yb - ya)) * (zb - za);
  }
  return h[3]![0];
}

/** The d where the nose's surface at height y reaches half width z: 0 on the blunt tip. */
function frontD(b: SliceBody, y: number, z: number): number {
  if (noseWidth(b, 0, y) >= z) return 0;
  let [lo, hi] = [0, 2.4];
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (noseWidth(b, mid, y) >= z) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** A point of the nose seen from the front, (z, y), `proud` off the surface along its normal. */
function frontPt(b: SliceBody, X: (d: number) => number, z: number, y: number, proud: number): Vec3 {
  const p = (zz: number, yy: number): Vec3 => [X(frontD(b, yy, Math.abs(zz))), yy, zz];
  const e = 0.01;
  const [a, u0, u1, v0, v1] = [p(z, y), p(z, y + e), p(z, y - e), p(z + e, y), p(z - e, y)];
  const n = norm(cross([u0[0] - u1[0], u0[1] - u1[1], u0[2] - u1[2]], [v0[0] - v1[0], v0[1] - v1[1], v0[2] - v1[2]]));
  // and forward too: at the crease round the blunt tip the normal turns sideways, and a
  // chord from there would sink behind the tip's flat face
  return [a[0] + n[0] * proud + 0.6 * proud, a[1] + n[1] * proud, a[2] + n[2] * proud];
}

/** A decal on the nose's front: columns over z0..z1, each from lo(z) to hi(z), laid on the surface. */
function frontDecal(m: MeshBuilder, b: SliceBody, X: (d: number) => number, mat: string, z0: number, z1: number, lo: (z: number) => number, hi: (z: number) => number, proud: number, nz: number, ny: number): void {
  const pts: Vec3[] = [];
  const at = (z: number, t: number) => frontPt(b, X, z, lo(z) + (hi(z) - lo(z)) * t, proud);
  // the columns: even steps, broken at the crease where the blunt tip meets the
  // rounded nose (a chord across it would sink under the layer beneath)
  const crease = noseWidth(b, 0, (lo((z0 + z1) / 2) + hi((z0 + z1) / 2)) / 2);
  const zs = [...new Set([...Array.from({ length: nz + 1 }, (_, i) => z0 + ((z1 - z0) * i) / nz), ...[-crease, crease].filter((z) => z > z0 + 0.01 && z < z1 - 0.01)].map((z) => Math.round(z * 1e4) / 1e4))].sort((p, q) => p - q);
  for (let i = 0; i + 1 < zs.length; i++) {
    const [za, zb] = [zs[i]!, zs[i + 1]!];
    if (hi(za) - lo(za) < 1e-4 && hi(zb) - lo(zb) < 1e-4) continue;
    for (let j = 0; j < ny; j++) {
      const [t0, t1] = [j / ny, (j + 1) / ny];
      const [p00, p10, p11, p01] = [at(za, t0), at(zb, t0), at(zb, t1), at(za, t1)];
      pts.push(p00, p01, p11, p00, p11, p10);
    }
  }
  if (pts.length) m.facets(mat, pts, [1, 0, 0]);
}

/** Each triangle (three points in a row) split in four at its edges' midpoints. */
function splitTris(t: Array<[number, number]>): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const mid = (p: [number, number], q: [number, number]): [number, number] => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  for (let i = 0; i + 2 < t.length; i += 3) {
    const [a, b, c] = [t[i]!, t[i + 1]!, t[i + 2]!];
    const [ab, bc, ca] = [mid(a, b), mid(b, c), mid(c, a)];
    out.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
  }
  return out;
}

/** An ellipse's upper and lower edge over z (centre zc, yc; half axes rx, ry). */
const ellipse = (zc: number, yc: number, rx: number, ry: number, sign: number) => (z: number) => yc + sign * ry * Math.sqrt(Math.max(0, 1 - ((z - zc) / rx) ** 2));

/**
 * Santa Fe's nose: the yellow stripe down its middle from the headlight hood, with
 * black pinstripes between the lamps; the yellow oval herald outlined in black and
 * lettered SANTA FE; the yellow whiskers with their black pinstripes running back
 * along both flanks.
 */
function santaFeNose(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const [yc, rx, ry, o] = [2.07, 1.02, 0.25, 0.035];
  const P = 0.02;
  // one layer on the nose, its pieces side by side (stacked layers sink into each
  // other where the blunt tip meets the rounded nose): the stripe above and below
  // the herald, the herald's black ring and its yellow field; only the letters and
  // pinstripes lie on top
  const outerTop = ellipse(0, yc, rx + o, ry + o, 1), outerBottom = ellipse(0, yc, rx + o, ry + o, -1);
  const innerTop = ellipse(0, yc, rx, ry, 1), innerBottom = ellipse(0, yc, rx, ry, -1);
  m.scope("stripe", () => {
    frontDecal(m, b, X, "warYellow", -0.42, 0.42, outerTop, () => 2.95, P, 12, 24);
    frontDecal(m, b, X, "warYellow", -0.42, 0.42, () => 1.66, outerBottom, P, 12, 4);
    for (const z of [-0.14, 0.14]) frontDecal(m, b, X, "warBlack", z - 0.0125, z + 0.0125, () => 2.56, () => 2.8, P + 0.008, 1, 6);
  });
  m.scope("herald", () => {
    frontDecal(m, b, X, "warBlack", -rx, rx, innerTop, outerTop, P, 48, 1);
    frontDecal(m, b, X, "warBlack", -rx, rx, outerBottom, innerBottom, P, 48, 1);
    for (const sd of [-1, 1]) frontDecal(m, b, X, "warBlack", sd > 0 ? rx : -rx - o, sd > 0 ? rx + o : -rx, outerBottom, outerTop, P, 3, 4);
    frontDecal(m, b, X, "warYellow", -rx, rx, innerBottom, innerTop, P, 48, 6);
    // the letters, read from the front (its right hand is -z), each stroke split so it follows the nose
    const h = 0.2, w = h * 0.58, gap = h * 0.18;
    const width = strokeWidth("SANTA FE", w, gap);
    let tris = strokeText("SANTA FE", -width / 2, yc - h / 2, h, w, gap, false, h * 0.15);
    for (let k = 0; k < 2; k++) tris = splitTris(tris);
    m.facets("warBlack", tris.map(([u, v]) => frontPt(b, X, -u, v, P + 0.008)), [1, 0, 0]);
  });
  m.scope("whiskers", () => {
    for (const s of [1, -1]) {
      const d0 = frontD(b, 2.1, 0.98);
      stripDecal(m, b, X, s, "warBlack", d0, 1.93, () => 1.92, () => 2.28, 0.007, 6);
      stripDecal(m, b, X, s, "warYellow", d0, 1.9, () => 1.95, () => 2.25, 0.011, 6);
      for (const y of [2.04, 2.135]) stripDecal(m, b, X, s, "warBlack", d0, 1.88, () => y, () => y + 0.025, 0.015, 6);
    }
  });
}

export const F7_LIVERIES: Record<string, F7Livery> = {
  santaFe: {
    title: "Santa Fe", palette: pickF7("silver", "warRed", "warYellow", "warBlack", "truckGrey", "f7Vent", "f7Slat"),
    bands: [[0, 9, "silver"]], roof: "silver", skirt: "silver", under: "truckGrey",
    // the red cab, its roof too, to the cab's back; the warbonnet's decals carry it on
    nose: { d: 4.8, mat: "warRed" },
    lettering: { text: "SANTA FE", d: 10.2, y: 2.06, h: 0.26, mat: "warBlack" },
    number: "37", numberMat: "warBlack", decals: warbonnet, hood: "warYellow", front: santaFeNose,
    bDecals: (m, b, X, s) => warStripe(m, b, X, s, 0, F7B_BODY),
  },
  unionPacific: {
    title: "Union Pacific", palette: pickF7("upYellow", "upGrey", "upRed", "truckGrey", "f7Vent", "f7Slat"),
    bands: [[0, 1.62, "upGrey"], [1.62, 1.68, "upRed"], [1.68, 3.62, "upYellow"], [3.62, 3.68, "upRed"], [3.68, 9, "upGrey"]],
    roof: "upGrey", skirt: "upGrey", under: "truckGrey",
    lettering: { text: "UNION PACIFIC", d: 8.7, y: 2.3, h: 0.36, mat: "upRed" },
    number: "1469", numberMat: "upRed",
  },
  southernPacific: {
    title: "SP Daylight", palette: pickF7("spRed", "spOrange", "spBlack", "spWhite", "truckBlack", "f7Vent", "f7Slat"),
    bands: [[0, 2.05, "spRed"], [2.05, 2.1, "spWhite"], [2.1, 3.1, "spOrange"], [3.1, 3.15, "spWhite"], [3.15, 9, "spRed"]],
    roof: "spBlack", skirt: "spBlack", under: "truckBlack",
    lettering: { text: "SOUTHERN PACIFIC", d: 8.7, y: 2.35, h: 0.34, mat: "spWhite" },
    number: "6402", numberMat: "spWhite",
  },
};

const f7Painter = (l: CarbodyLivery) => painter(l, F7_BODY, false);

/**
 * The filter grilles along the top of the side, d0..d1, as `n` panels: each a
 * framed vent of vertical slats in the metal's grey (not glass: the windows are the
 * portholes under them).
 */
function f7Vents(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, n: number): void {
  const gap = 0.07, w = (d1 - d0 - gap * (n - 1)) / n;
  const [y0, y1] = F7_VENT_Y;
  for (let i = 0; i < n; i++) {
    const a = d0 + i * (w + gap);
    sidePanel(m, b, X, s, "f7Vent", a, a + w, y0, y1, 0.014, 0.03);
    const slats = Math.max(1, Math.round((w - 0.08) / 0.11));
    const pitch = (w - 0.08) / slats;
    for (let k = 0; k < slats; k++) {
      const c = a + 0.04 + pitch * (k + 0.5);
      sidePanel(m, b, X, s, "f7Slat", c - 0.018, c + 0.018, y0 + 0.04, y1 - 0.04, 0.018, 0.004);
    }
  }
}

/** Portholes on the side at the given d, under the grilles. */
function f7Portholes(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, ds: readonly number[]): void {
  for (const d of ds) {
    surfaceDisc(m, b, X, d, F7_PORT_Y, s, "rubber", 0.23, 0.005, 0.03, 16);
    surfaceDisc(m, b, X, d, F7_PORT_Y, s, "glass", 0.18, 0.012, 0.004, 16);
  }
}

/** The roof's radiator fans, dynamic brake fan, exhaust, at their distances ahead of the rear wall. */
function f7Roof(m: MeshBuilder, X: (d: number) => number, body: number): void {
  m.scope("fans", () => { for (const r of [4.04, 2.74, 1.44]) roofFan(m, X(body - r), 0, 4.32, 0.46); });
  m.scope("dynamic brake fan", () => roofFan(m, X(body - 8.64), 0, 4.32, 0.42));
  m.scope("exhaust", () => exhaust(m, X(body - 6.04), 0, 4.3, 4.45, 0.3, 0.55));
}

/** The trucks and the tanks between them, about model x = 0; the underframe from x0 to x1. */
function f7RunningGear(m: MeshBuilder, l: CarbodyLivery, x0: number, x1: number): void {
  const spec = truckSpec([-ft(4, 6), ft(4, 6)], ft(0, 20), 2.0, 1.2);
  m.scope("front truck", () => truck(m, F7_TRUCK, spec));
  m.scope("rear truck", () => truck(m, -F7_TRUCK, spec));
  m.scope("fuel tank", () => {
    block(m, l.under, -2.4, 2.4, 0.5, 1.0, -1.25, 1.25);
    block(m, l.under, x0, x1, 1.0, F7_SPEC.B - 0.01, -1.3, 1.3);
    for (const s of [-1, 1]) tankX(m, "tank", 2.5, 2.6 + 0.0, s * 0.8, 0.9, 0.2);
  });
}

/** A flat end at x facing e: its coupler, end sill and, when it is free (not inside a set), the diaphragm and lamps. */
function f7FlatEnd(m: MeshBuilder, l: CarbodyLivery, e: number, x: number, face: number, free: boolean, lamps: boolean): void {
  if (free) {
    endDiaphragm(m, e, x, 1.35, 3.95);
    if (lamps) faceLamps(m, e, e * x, [[0, 3.95, 0.12, "lampHead"], [-1.1, 2.0, 0.07, "lampRed"], [1.1, 2.0, 0.07, "lampRed"]]);
  }
  m.scope("coupler", () => knuckleCoupler(m, e, e * x - 0.1, face, COUPLER_Y));
  const sill = "truckBlack" in l.palette ? "truckBlack" : "underframe";
  if (e < 0) block(m, sill, x - 0.3, x + 0.02, 0.45, 1.22, -1.2, 1.2);
  else block(m, sill, x - 0.02, x + 0.3, 0.45, 1.22, -1.2, 1.2);
}

/** The A unit about model x = 0, its nose toward +X; `rearFree` draws the rear's diaphragm and lamps. */
function drawF7A(m: MeshBuilder, l: F7Livery, rearFree: boolean): void {
  const b = carbody({ ...F7_SPEC, edges: edgesOf(l, F7_SPEC.Y, F7_SPEC.S) });
  const tip = F7_LENGTH / 2 - F7_REACH;
  const X = (d: number) => tip - d;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, f7Painter(l)));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        if (l.decals) m.scope("paint", () => l.decals!(m, b, X, s));
        m.scope("cab windows", () => sideWindow(m, b, X, s, 2.65, 3.45, 3.05, 3.62));
        m.scope("cab door", () => sidePanel(m, b, X, s, "black", 3.75, 4.5, 1.65, 3.5, 0.003, 0.004));
        m.scope("portholes", () => f7Portholes(m, b, X, s, [5.45, 11.75]));
        m.scope("grilles", () => f7Vents(m, b, X, s, 4.75, F7_BODY - 0.35, 11));
        if (l.lettering) m.scope("lettering", () => sideLettering(m, b, X, s, l.lettering!.text, l.lettering!.d, l.lettering!.y, l.lettering!.h, l.lettering!.mat, 0.012));
        m.scope("number", () => sideLettering(m, b, X, s, l.number, 3.05, 2.55, 0.26, l.numberMat, 0.012));
      });
  });
  const nosePaint = f7Painter(l);
  m.scope("nose", () => {
    // two wide, low panes either side of the centre post under the cab roof's brow
    // (more than twice as wide as high: 1.1 m by 0.48 m up the rake, a thin brow over them), their outer edge
    // slanting in toward the roof, its corners rounded, set in a rubber gasket in a
    // frame of the cab's paint
    m.scope("windscreen", () => {
      const frame = nosePaint(2.1, 4.0, "arc");
      for (const s of [1, -1]) {
        outlinePane(m, b, X, s, frame, roundedPane([2.04, 2.46], 0.05, [1.26, 1.04], 0.18, 0.05, 0.2), 0.004);
        outlinePane(m, b, X, s, "rubber", roundedPane([2.07, 2.43], 0.08, [1.22, 1.01], 0.16, 0.04, 0.18), 0.008);
        outlinePane(m, b, X, s, "cabGlass", roundedPane([2.1, 2.4], 0.11, [1.18, 0.98], 0.14, 0.03, 0.16), 0.012);
      }
    });
    if (l.front) m.scope("herald", () => l.front!(m, b, X));
    // the headlight in its hood on top of the nose, the oscillating light in the nose door below
    m.scope("headlights", () => {
      const d = noseD(b, F7_LAMP_Y) + 0.02;
      const [front, back] = [X(d) + 0.12, X(1.05)];
      const hood = l.hood ?? nosePaint(0.6, F7_LAMP_Y + 0.1, "arc");
      m.scope("hood", () => m.sweep(hood, "x", ngon(16, 0.13, 0, 0, F7_LAMP_Y + 0.06), back, ngon(16, 0.25, 0, 0, F7_LAMP_Y), front));
      m.sweep("black", "x", ngon(16, 0.22, 0, 0, F7_LAMP_Y), front - 0.01, ngon(16, 0.22, 0, 0, F7_LAMP_Y), front + 0.03);
      m.sweep("lampHead", "x", ngon(16, 0.17, 0, 0, F7_LAMP_Y), front + 0.03, ngon(16, 0.17, 0, 0, F7_LAMP_Y), front + 0.045);
      // standing out of the herald's stripe when the livery paints one over the nose
      noseLamps(m, b, l.front ? (d) => X(d) + 0.035 : X, 1, [[0, 2.42, 0.13, "lampHead"]]);
    });
    // the number boards stand out of the nose's flanks under the windscreen
    m.scope("number boards", () => {
      for (const s of [1, -1]) {
        chordBox(m, b, X, s, nosePaint(1.3, 2.8, "side"), 0.95, 1.72, 2.64, 2.98, 0.02, 0.12);
        chordBox(m, b, X, s, "black", 1.0, 1.67, 2.68, 2.94, 0.03, 0.02);
        chordBox(m, b, X, s, "numberBoard", 1.04, 1.63, 2.71, 2.91, 0.035, 0.004);
      }
    });
    m.scope("class lights", () => { for (const z of [-1, 1]) flankLamp(m, b, X, z * 1.02, 2.5, 0.07, "lampRed"); });
    m.scope("pilot", () => pilotPlate(m, "warBlack" in l.palette ? "warBlack" : l.skirt, 1, tip - 0.05, 0.15, 1.3, 1.25, 0.4, 0.6));
    m.scope("coupler", () => knuckleCoupler(m, 1, tip - 0.25, F7_LENGTH / 2, COUPLER_Y));
  });
  m.scope("rear end", () => f7FlatEnd(m, l, -1, X(F7_BODY), F7_LENGTH / 2, rearFree, true));
  m.scope("roof", () => {
    f7Roof(m, X, F7_BODY);
    m.scope("horn", () => horn(m, 1, X(3.4), 0.45, 4.68));
  });
  m.scope("running gear", () => f7RunningGear(m, l, X(F7_BODY) + 0.05, tip - 0.9));
}

/** The B unit about model x = 0: the A unit's engine room between two flat ends, no cab. */
function drawF7B(m: MeshBuilder, l: F7Livery, frontFree: boolean, rearFree: boolean): void {
  const b = carbody({ ...F7B_SPEC, edges: edgesOf(l, F7B_SPEC.Y, F7B_SPEC.S) });
  const front = F7B_LENGTH / 2 - F7_REAR;
  const X = (d: number) => front - d;
  const { nose: _nose, ...flat } = l;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, painter(flat, F7B_BODY, false)));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        if (l.bDecals) m.scope("paint", () => l.bDecals!(m, b, X, s));
        m.scope("portholes", () => f7Portholes(m, b, X, s, [2.3, 7.27, 12.2]));
        m.scope("grilles", () => f7Vents(m, b, X, s, 0.45, F7B_BODY - 0.35, 15));
        if (l.lettering) m.scope("lettering", () => sideLettering(m, b, X, s, l.lettering!.text, F7B_BODY / 2, l.lettering!.y, l.lettering!.h, l.lettering!.mat, 0.012));
      });
  });
  m.scope("front end", () => f7FlatEnd(m, l, 1, X(0), F7B_LENGTH / 2, frontFree, false));
  m.scope("rear end", () => f7FlatEnd(m, l, -1, X(F7B_BODY), F7B_LENGTH / 2, rearFree, false));
  m.scope("roof", () => f7Roof(m, X, F7B_BODY));
  m.scope("running gear", () => f7RunningGear(m, l, X(F7B_BODY) + 0.05, X(0) - 0.05));
}

export type F7Unit = "aUnit" | "bUnit";
export const F7_UNIT_LENGTH: Record<F7Unit, number> = { aUnit: F7_LENGTH, bUnit: F7B_LENGTH };
/** The sets' lengths in units. */
export const F7_SET_UNITS = [2, 3, 4] as const;
export interface F7Slot { unit: F7Unit; lo: number; hi: number; turned: boolean }

/**
 * The units of an n-unit set, front first, between their coupling planes and
 * centred on x = 0: the A unit leads, the B units follow, and a set of three or
 * more ends in a second A unit turned (A-B, A-B-A, A-B-B-A).
 */
export function f7Set(n: number): F7Slot[] {
  const units: F7Unit[] = Array.from({ length: n }, (_, k) => (k === 0 || (n >= 3 && k === n - 1) ? "aUnit" : "bUnit"));
  const total = units.reduce((t, u) => t + F7_UNIT_LENGTH[u], 0);
  let hi = total / 2;
  return units.map((unit, i) => {
    const lo = hi - F7_UNIT_LENGTH[unit];
    const out = { unit, lo, hi, turned: unit === "aUnit" && i > 0 };
    hi = lo;
    return out;
  });
}

/** The diaphragm closing the gap between two units. */
const F7_BELLOWS: Array<[number, number]> = [[-0.75, 1.35], [0.75, 1.35], [0.75, 3.8], [0.6, 3.95], [-0.6, 3.95], [-0.75, 3.8]];
/** A unit's body end behind its coupling plane, at its front (+X) end. */
const f7Front = (u: F7Unit) => (u === "aUnit" ? F7_REACH : F7_REAR);

export function buildF7(l: F7Livery, unit: F7Unit | "train" = "aUnit", units = 2): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  if (unit === "aUnit") drawF7A(m, l, true);
  else if (unit === "bUnit") drawF7B(m, l, true, true);
  else {
    const slots = f7Set(units);
    const sections = slots.map((slot, k) => {
      const cx = (slot.lo + slot.hi) / 2;
      const draw = () => m.moved((p) => [p[0] + cx, p[1], p[2]], () => (slot.unit === "aUnit" ? drawF7A(m, l, false) : drawF7B(m, l, false, false)));
      return {
        // a turned unit's front is at its lo end
        x0: slot.lo + (slot.turned ? f7Front(slot.unit) : F7_REAR),
        x1: slot.hi - (k === 0 ? 0 : slot.turned ? F7_REAR : f7Front(slot.unit)),
        draw: () => m.scope(`unit ${k + 1}`, () => (slot.turned ? m.turned(cx, draw) : draw())),
      };
    });
    articulate({ m }, sections, COUPLER_Y, { profile: F7_BELLOWS, folds: 4, depth: 0.03 }, 10, slots.slice(0, -1).map((s) => s.lo));
  }
  return m;
}

// ---------------------------------------------------------------------------
// GE P42DC Genesis
//
// Measured from the photographs in assets/ge-p42dc/ (SOURCES.md): the near-orthographic
// side of 167 (51 px/m) for every opening, grille and step along the body and the face's
// rake; 27 head-on (136 px/m) for the face's heights and widths; 78, 99, 107, 59 and 95
// for the V-shaped face, its corner chamfers, the rear end and the Phase V fields; 145
// for Phase III and 915 for VIA. d is metres back from the face's apex at the knee.

import { drawShell, edgeRole, sliceHalf } from "./sliceBody.ts";
import { add, sub } from "./sliceLoft.ts";
import { plate } from "./vehicleParts.ts";
import { lodRoofBox } from "./lodKit.ts";

const P42_LENGTH = ft(69); // 21.03 m
const P42_REACH = 0.4;
const P42_BODY = P42_LENGTH - P42_REACH - 0.35;
const P42_TRUCK = ft(43, 2.5) / 2;
const P42_TIP = P42_LENGTH / 2 - P42_REACH;

/** The section: 10 ft wide; the skirt's bottom, the body's foot and belly; the crease where the upper band leans in, its top; the crown (14 ft 4 in). */
const P42_W = 1.524;
const P42_B = 0.72, P42_A = 1.1, P42_Y = 1.12;
const P42_CREASE = 3.3, P42_BAND = 4.02, P42_CROWN = 4.37;
/** The section's top from the crease inward: the leaning band, the roof's rounded edge, [z, y]. */
const P42_TOP: readonly Pt[] = [[P42_W, P42_CREASE], [1.33, P42_BAND], [1.2, 4.23], [1.06, 4.32], [0.75, 4.36], [0.375, P42_CROWN], [0, P42_CROWN]];
/** The arc's points' half widths: the section's corners and the face's kink at the V's corner. */
const P42_ARC_Z = [1.33, 1.27, 1.2, 1.06, 0.75, 0.375];
/**
 * The face: the knee's height; the upper face's rake (1.64 m up per metre back, 58.6 degrees);
 * the V in plan, its corners `VD` behind the apex at half width `VW`; the corner chamfer to the
 * full width over `CD`; the rounding where the face meets the roof.
 */
const P42_KNEE = 2.15, P42_RAKE = 1.64, P42_VD = 0.27, P42_VW = 1.27, P42_CD = 0.25, P42_ROUND = 0.14;
/** The skirt's cut-outs: the front truck, and from the fairing's tail past the rear truck to the end. */
const P42_CUTS: ReadonlyArray<readonly [number, number]> = [[1.55, 5.95], [13.55, P42_BODY]];
const P42_CUT_R = 0.5;
/** The rear end's corners, rounded in plan. */
const P42_REAR_R = 0.12;

const p42TopAt = (z: number): number => {
  for (let i = 0; i + 1 < P42_TOP.length; i++) {
    const [[za, ya], [zb, yb]] = [P42_TOP[i]!, P42_TOP[i + 1]!];
    if (z <= za + 1e-9 && z >= zb - 1e-9) return za - zb < 1e-9 ? ya : ya + ((za - z) / (za - zb)) * (yb - ya);
  }
  return z > P42_W ? P42_CREASE : P42_CROWN;
};
/** The face's setback behind the apex at half width z (the knee's plan). */
const p42Setback = (z: number): number => (z <= P42_VW ? (P42_VD * z) / P42_VW : P42_VD + P42_CD * Math.min(1, (z - P42_VW) / (P42_W - P42_VW)));
/** The half width at d: the V, the corner chamfer, the rear's rounded corners. */
function p42Plan(d: number): number {
  let v = d <= P42_VD ? Math.max(0.03, (P42_VW * d) / P42_VD) : d < P42_VD + P42_CD ? P42_VW + ((P42_W - P42_VW) * (d - P42_VD)) / P42_CD : P42_W;
  const t = d - (P42_BODY - P42_REAR_R);
  if (t > 0) v = Math.min(v, P42_W - P42_REAR_R + P42_REAR_R * Math.sqrt(Math.max(0, 1 - (t / P42_REAR_R) ** 2)));
  return v;
}
/** The upper face's height at (d, z). */
const p42Face = (d: number, z: number): number => P42_KNEE + P42_RAKE * (d - p42Setback(z));
const smin = (a: number, b: number, k: number): number => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
};
/** The body's top at (d, z): the section under the face. */
const p42Top = (d: number, z: number): number => smin(p42TopAt(z), p42Face(d, z), P42_ROUND);

/** The skirt's bottom: lifted to the foot over the cuts, the fairing's ends rounded. */
function p42Skirt(d: number): number {
  for (const [a, c] of P42_CUTS) {
    if (d < a - 1e-9 || d > c + 1e-9) continue;
    const e = Math.min(d - a, c >= P42_BODY - 1e-6 ? Infinity : c - d);
    if (e >= P42_CUT_R) return P42_A;
    return P42_B + (P42_A - P42_B) * Math.sqrt(Math.max(0, 1 - (1 - e / P42_CUT_R) ** 2));
  }
  return P42_B;
}

/** The P42's body as a slice body: its own section (the leaning band, the rounded roof) and the V-shaped face. */
function p42Body(edges: readonly number[], extra: readonly number[] = []): SliceBody {
  const L = P42_BODY;
  const S = (d: number) => Math.min(P42_CREASE, p42Face(d, p42Plan(d)));
  const st = new Set<number>([0, L, P42_VD, P42_VD + P42_CD, 0.52 + (P42_CREASE - P42_KNEE) / P42_RAKE, ...extra]);
  for (let d = 0; d <= 2.0 + 1e-9; d += 0.08) st.add(d);
  for (let d = 2.0; d < L; d += 1.0) st.add(d);
  // a cut's ends and the stations round its arches
  for (const [a, c] of P42_CUTS)
    for (const e of [0, ...[1, 2, 3, 4].map((k) => P42_CUT_R * (1 - Math.cos((k / 4) * (Math.PI / 2))))]) {
      st.add(a + e);
      if (c < L - 1e-6) st.add(c - e);
    }
  for (const t of [0.12, 0.07, 0.03]) st.add(L - t);
  const stations = [...st].map((d) => Math.round(d * 1000) / 1000).filter((d, i, a) => d >= 0 && d <= L && a.indexOf(d) === i).sort((p, q) => p - q);
  return {
    length: L,
    B: p42Skirt, wl: (d) => Math.max(0.02, p42Plan(d) - 0.1), A: () => P42_A, wa: (d) => p42Plan(d) * 0.997,
    Y: () => P42_Y, w: p42Plan, S, C: (d) => Math.max(S(d) + 0.01, p42Top(d, 0)),
    edges: (d) => edges.map((y) => Math.min(S(d), Math.max(P42_Y, y))),
    lean: 1, arc: P42_ARC_Z.length + 1, stations,
    arcProfile: (d) => {
      const w = p42Plan(d), s = S(d);
      return P42_ARC_Z.map((z0, i): Pt => {
        const z = Math.min(z0, w - 0.004 * (i + 1));
        return [z, Math.max(s, p42Top(d, z))];
      });
    },
  };
}

/** A P42 livery: the side's bands, the cab's field over the face and the cab, the upper band's paint, decorations. */
export interface P42Livery extends CarbodyLivery {
  /** The cab's paint: the face over `face` (its height at the centre and at the V's corners), the cab's side over `cabLine` ([d, y] to the band's top), the roof. */
  cab: string;
  face: readonly [number, number];
  cabLine: readonly Pt[];
  /** The leaning upper band's paint behind the cab. */
  band: string;
  /** The face under `face`, by height (default the side's bands). */
  faceBands?: ReadonlyArray<readonly [number, number, string]>;
  /** Phase V: the roof's paint coming down the band at the rear, its lower edge [d, y]. */
  swoosh?: readonly Pt[];
  /** VIA: a field over the side from the nose, its lower edge [d, y] up to the crease. */
  wedge?: { mat: string; edge: readonly Pt[] };
  truck: string;
  pilot: string;
  /** The side's lettering besides `lettering`: [text, d, y, h, paint]. */
  marks?: ReadonlyArray<readonly [string, number, number, number, string]>;
  /** The Amtrak travel mark under the lettering. */
  travelMark?: string;
  /** The side number: d of its centre, foot, height. */
  sideNumber: readonly [number, number, number];
}

const P42_PAL = {
  silver: paint("#c3c7cb", 0.35), amBlue: paint("#1f5b97"), amRed: paint("#c0262c"), amWhite: paint("#f0f0ec"), amDark: paint("#1f2124", 0.6),
  p42Skirt: paint("#6c7177", 0.6), p42Truck: paint("#5d6064", 0.7), p42Pilot: paint("#3d4043", 0.8), p42Lens: paint("#3d7fc4", 0.2),
  viaBlue: paint("#1f5f7e"), viaYellow: paint("#ecc22a"), viaGrey: paint("#aeb2b6", 0.4),
  truckBlack: paint("#242527", 0.85),
};
const pickP42 = (...n: Array<keyof typeof P42_PAL>) => Object.fromEntries(n.map((k) => [k, P42_PAL[k]]));

export const P42_LIVERIES: Record<string, P42Livery> = {
  phaseV: {
    title: "Amtrak Phase V", palette: pickP42("silver", "amBlue", "amRed", "p42Skirt", "p42Truck", "p42Pilot", "p42Lens", "truckBlack"),
    bands: [[0, 1.17, "amRed"], [1.17, 9, "silver"]],
    roof: "amBlue", skirt: "p42Skirt", under: "truckBlack", truck: "p42Truck", pilot: "p42Pilot",
    cab: "amBlue", band: "silver", face: [2.2, 2.48], cabLine: [[0.72, 2.48], [2.84, P42_CREASE], [4.0, P42_BAND]],
    swoosh: [[13.4, P42_BAND], [14.3, 3.86], [15.3, 3.77], [P42_BODY, 3.75]],
    lettering: { text: "AMTRAK", d: 5.7, y: 2.98, h: 0.3, mat: "amBlue" }, travelMark: "amBlue",
    number: "78", numberMat: "amBlue", sideNumber: [14.6, 1.7, 0.62],
  },
  phaseIII: {
    title: "Amtrak Phase III", palette: pickP42("silver", "amBlue", "amRed", "amWhite", "amDark", "p42Lens", "truckBlack"),
    bands: [[0, 1.17, "amDark"], [1.17, 1.9, "silver"], [1.9, 2.16, "amBlue"], [2.16, 2.36, "amWhite"], [2.36, 2.61, "amRed"], [2.61, 9, "silver"]],
    roof: "amDark", skirt: "amDark", under: "truckBlack", truck: "truckBlack", pilot: "amDark",
    cab: "amDark", band: "silver", face: [2.61, 2.61], cabLine: [[0.8, 2.61], [2.84, P42_CREASE], [3.4, P42_BAND]],
    lettering: { text: "AMTRAK", d: 11.0, y: 2.72, h: 0.32, mat: "amDark" },
    number: "145", numberMat: "amDark", sideNumber: [11.0, 2.19, 0.14],
  },
  via: {
    title: "VIA Rail", palette: pickP42("viaBlue", "viaYellow", "viaGrey", "amWhite", "amRed", "p42Pilot", "p42Lens", "truckBlack"),
    bands: [[0, 1.3, "viaBlue"], [1.3, 1.45, "viaYellow"], [1.45, 9, "viaGrey"]],
    roof: "viaBlue", skirt: "viaBlue", under: "truckBlack", truck: "truckBlack", pilot: "p42Pilot",
    cab: "viaBlue", band: "viaBlue", face: [2.2, 2.2], faceBands: [[0, 9, "viaYellow"]],
    // the blue comes down the cab from the nose and runs the length a little under the crease
    cabLine: [[0.55, 2.2], [1.4, 2.7], [2.1, 2.93], [3.3, 3.07], [4.8, 3.15], [P42_BODY, 3.18]],
    wedge: { mat: "viaYellow", edge: [[0, 1.45], [4.5, 1.5], [13.1, P42_CREASE]] },
    lettering: { text: "VIA", d: 15.0, y: 2.7, h: 0.45, mat: "viaYellow" },
    marks: [["CANADA", 11.2, 0.7, 0.24, "amWhite"]],
    number: "915", numberMat: "amWhite", sideNumber: [2.45, 3.0, 0.2],
  },
};

const p42Lerp = (t: readonly Pt[], d: number): number => {
  if (d <= t[0]![0]) return t[0]![1];
  for (let i = 0; i + 1 < t.length; i++) {
    const [[a, ya], [c, yc]] = [t[i]!, t[i + 1]!];
    if (d <= c) return ya + ((d - a) / Math.max(1e-9, c - a)) * (yc - ya);
  }
  return t[t.length - 1]![1];
};
const p42BandOf = (bands: ReadonlyArray<readonly [number, number, string]>, y: number): string => {
  for (const [a, c, mt] of bands) if (y >= a - 1e-9 && y < c - 1e-9) return mt;
  return bands[bands.length - 1]![2];
};
/** The d where the cab's line crosses the band's middle: the shell's band changes paint there. */
const p42CabSwitch = (l: P42Livery): number => {
  const mid = (P42_CREASE + P42_BAND) / 2;
  const t = l.cabLine;
  for (let i = 0; i + 1 < t.length; i++) if (t[i]![1] <= mid && t[i + 1]![1] >= mid) return t[i]![0] + ((mid - t[i]![1]) / (t[i + 1]![1] - t[i]![1])) * (t[i + 1]![0] - t[i]![0]);
  return t[t.length - 1]![0];
};

/** The upper face's point at half width z and height y on side s (the V's planes and the corner chamfers'), `out` off it, and its normal. */
function p42FaceAt(X: (d: number) => number, z: number, y: number, s: number, out = 0): { p: Vec3; n: Vec3 } {
  const a = z <= P42_VW ? P42_VD / P42_VW : P42_CD / (P42_W - P42_VW);
  const n = norm([P42_RAKE, 1, s * P42_RAKE * a]);
  const d = p42Setback(z) + (y - P42_KNEE) / P42_RAKE;
  return { p: [X(d) + n[0] * out, y + n[1] * out, s * z + n[2] * out], n };
}
/** The lower face's point (the knee's V, vertical) at half width z and height y on side s, `out` off it, and its normal. */
function p42LowAt(X: (d: number) => number, z: number, y: number, s: number, out = 0): { p: Vec3; n: Vec3 } {
  const a = z <= P42_VW ? P42_VD / P42_VW : P42_CD / (P42_W - P42_VW);
  const n = norm([1, 0, s * a]);
  return { p: [X(p42Setback(z)) + n[0] * out, y, s * z + n[2] * out], n };
}
/** A flat panel (z, y polygon) on a face plane, `proud` off it and `depth` into it. */
function p42FacePanel(m: MeshBuilder, X: (d: number) => number, s: number, mat: string, poly: readonly Pt[], proud: number, depth: number, low = false): void {
  const at = low ? p42LowAt : p42FaceAt;
  const pts = poly.map(([z, y]) => at(X, z, y, s, proud).p);
  const zc = poly.reduce((t, p) => t + p[0], 0) / poly.length;
  const n = at(X, zc, poly[0]![1], s).n;
  m.slab(mat, pts, mul3(n, -depth));
}
/** A round lamp on the upper face, turned from it toward the front: its bezel and lens. */
function p42FaceLamp(m: MeshBuilder, X: (d: number) => number, z: number, y: number, s: number, r: number, lens: string, sides = 12): void {
  const { p, n: n0 } = p42FaceAt(X, z, y, s);
  const n = norm([n0[0] + 0.9, n0[1], n0[2]]);
  const u = norm(cross([0, 1, 0], n));
  const v = norm(cross(n, u));
  const out = 0.015 + (r + 0.03) * 0.5;
  const ring = (rr: number, o: number): Vec3[] => Array.from({ length: sides }, (_, i) => {
    const t = (2 * Math.PI * i) / sides;
    return [0, 1, 2].map((k) => p[k]! + n[k]! * o + u[k]! * rr * Math.cos(t) + v[k]! * rr * Math.sin(t)) as Vec3;
  });
  m.slab("black", ring(r + 0.03, out), mul3(n, -(out + 0.1)));
  m.slab(lens, ring(r, out + 0.008), mul3(n, -0.01));
}
const mul3 = (v: Vec3, k: number): Vec3 => [v[0] * k, v[1] * k, v[2] * k];
/** A convex polygon (z, y) clipped to y <= lineY(z) (a straight line). */
function clipUnder(poly: readonly Pt[], lineY: (z: number) => number): Pt[] {
  const out: Pt[] = [];
  const inside = (p: Pt) => p[1] <= lineY(p[0]) + 1e-9;
  for (let i = 0; i < poly.length; i++) {
    const [p, q] = [poly[i]!, poly[(i + 1) % poly.length]!];
    if (inside(p)) out.push(p);
    if (inside(p) !== inside(q)) {
      const fp = p[1] - lineY(p[0]), fq = q[1] - lineY(q[0]);
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/** A point on the body's surface at (d, y) on side s, `proud` off it along its normal. */
function p42Surf(b: SliceBody, X: (d: number) => number, d: number, y: number, s: number, proud: number): Vec3 {
  const P = (dd: number, yy: number): Vec3 => [X(dd), yy, s * sliceHalf(b, dd, yy)];
  const e = 0.01;
  const tD = sub(P(d + e, y), P(d - e, y));
  const tY = sub(P(d, y + e), P(d, y - e));
  let n = norm(cross(tD, tY));
  if (n[2] * s < 0) n = mul3(n, -1);
  return add(P(d, y), mul3(n, proud));
}
/** Decal triangles in (d, y) laid on the body's side (the side, the band, the skirt, a V face) on side s. */
function p42Decal(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, tris: readonly Pt[], proud = 0.005): void {
  const pts = tris.map(([d, y]) => p42Surf(b, X, d, y, s, proud));
  for (let i = 0; i + 2 < pts.length; i += 3) {
    const [a, c, e] = [pts[i]!, pts[i + 1]!, pts[i + 2]!];
    const fn = cross(sub(c, a), sub(e, a));
    if (Math.hypot(...fn) < 1e-12) continue;
    m.facets(mat, [a, c, e], fn[2] * s >= 0 ? fn : mul3(fn, -1));
  }
}
/** A strip decal from d0 to d1 between lo(d) and hi(d), cut at the heights in `breaks` (the section's creases). */
function p42Strip(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, lo: (d: number) => number, hi: (d: number) => number, n: number, breaks: readonly number[] = [P42_CREASE]): void {
  const tris: Pt[] = [];
  const cols = [...new Set([...Array.from({ length: n + 1 }, (_, i) => d0 + ((d1 - d0) * i) / n), ...b.stations.filter((d) => d > d0 + 1e-4 && d < d1 - 1e-4)])].sort((p, q) => p - q);
  for (let i = 0; i + 1 < cols.length; i++) {
    const [a, c] = [cols[i]!, cols[i + 1]!];
    if (c - a < 1e-5) continue;
    const levels = (d: number) => {
      const [l0, h0] = [lo(d), hi(d)];
      return [l0, ...breaks.map((y) => Math.min(h0, Math.max(l0, y))), h0];
    };
    const [la, lc] = [levels(a), levels(c)];
    for (let k = 0; k + 1 < la.length; k++) {
      if (la[k + 1]! - la[k]! < 1e-5 && lc[k + 1]! - lc[k]! < 1e-5) continue;
      tris.push([a, la[k]!], [c, lc[k]!], [c, lc[k + 1]!], [a, la[k]!], [c, lc[k + 1]!], [a, la[k + 1]!]);
    }
  }
  p42Decal(m, b, X, s, mat, tris);
}
/** Lettering on the side (any part of it), centred at d, its foot at y, h tall, reading from outside. */
function p42Lettering(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, text: string, d: number, y: number, h: number, mat: string): void {
  const w = h * 0.58, gap = h * 0.18;
  const width = strokeWidth(text, w, gap);
  const tris = strokeText(text, -width / 2, y, h, w, gap, false, h * 0.13).map(([u, v]): Pt => [d - s * u, v]);
  p42Decal(m, b, X, s, mat, tris, 0.009);
}
/** Amtrak's travel mark: three stripes fanning from a point at the front top, d0 its front, y1 its top. */
function p42TravelMark(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, y1: number): void {
  const tris: Pt[] = [];
  const ends: Array<readonly [number, number, number]> = [[1.75, 0.42, 0.3], [1.3, 0.8, 0.28], [0.72, 1.12, 0.24]];
  for (const [k, [dd, dy, wd]] of ends.entries()) {
    const p0: Pt = [d0 + 0.05 + k * 0.03, y1 - k * 0.04];
    const p2: Pt = [d0 + dd, y1 - dy];
    const p1: Pt = [d0 + dd * 0.45, y1 - dy * 0.15];
    const n = 8;
    const at = (t: number): Pt => [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
    for (let i = 0; i < n; i++) {
      const [t0, t1] = [i / n, (i + 1) / n];
      const [a, c] = [at(t0), at(t1)];
      // tapered: a point at the front, `wd` thick at the end, below the curve
      const [ha, hc] = [0.02 + wd * t0 ** 1.4, 0.02 + wd * t1 ** 1.4];
      tris.push(a, c, [c[0], c[1] - hc], a, [c[0], c[1] - hc], [a[0], a[1] - ha]);
    }
  }
  p42Decal(m, b, X, s, mat, tris, 0.009);
}

/** The band's (the leaning upper side's) half width at height y and its outward normal on side s. */
const p42BandZ = (y: number): number => P42_W - ((y - P42_CREASE) * (P42_W - 1.33)) / (P42_BAND - P42_CREASE);
const P42_BAND_N = norm([0, P42_W - 1.33, P42_BAND - P42_CREASE]);
/** A panel on the band over d0..d1 and y0..y1: `proud` off it, `depth` deep. */
function p42BandPanel(m: MeshBuilder, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, y0: number, y1: number, proud: number, depth: number): void {
  const n: Vec3 = [0, P42_BAND_N[1], s * P42_BAND_N[2]];
  const pt = (d: number, y: number): Vec3 => add([X(d), y, s * p42BandZ(y)], mul3(n, proud));
  m.slab(mat, [pt(d0, y0), pt(d1, y0), pt(d1, y1), pt(d0, y1)], mul3(n, -depth));
}
/** A louvred grille on the band: its frame, the opening and the slats. */
function p42BandGrille(m: MeshBuilder, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number, frame: string | null, pitch = 0.085): void {
  if (frame) p42BandPanel(m, X, s, frame, d0 - 0.05, d1 + 0.05, y0 - 0.05, y1 + 0.05, 0.0075, 0.02);
  p42BandPanel(m, X, s, "louvre", d0, d1, y0, y1, frame ? 0.011 : 0.0075, 0.02);
  for (let y = y0 + 0.05; y < y1 - 0.03; y += pitch) p42BandPanel(m, X, s, "grille", d0 + 0.02, d1 - 0.02, y, y + 0.03, frame ? 0.017 : 0.014, 0.006);
}
/** A grille on the vertical side with horizontal slats. */
function p42SideGrille(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number, frame: string, pitch = 0.075): void {
  sidePanel(m, b, X, s, frame, d0 - 0.04, d1 + 0.04, y0 - 0.04, y1 + 0.04, 0.0075, 0.02);
  sidePanel(m, b, X, s, "louvre", d0, d1, y0, y1, 0.011, 0.02);
  for (let y = y0 + 0.04; y < y1 - 0.02; y += pitch) sidePanel(m, b, X, s, "grille", d0 + 0.02, d1 - 0.02, y, y + 0.028, 0.017, 0.006);
}
/** A panel's seam on the side: four thin dark strips round d0..d1, y0..y1. */
function p42Seam(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number): void {
  const t = 0.018;
  for (const [a, c, e, f] of [[d0, d1, y0, y0 + t], [d0, d1, y1 - t, y1], [d0, d0 + t, y0 + t, y1 - t], [d1 - t, d1, y0 + t, y1 - t]] as const) sidePanel(m, b, X, s, "rubber", a, c, e, f, 0.0075, 0.01);
}
/** A vertical handrail standing off the side at d, from y0 to y1. */
function p42Handrail(m: MeshBuilder, X: (d: number) => number, s: number, d: number, y0: number, y1: number): void {
  const z = s * (P42_W + 0.07);
  m.rod("handrail", [X(d), y0, z], [X(d), y1, z], 0.018, 6);
  for (const y of [y0 + 0.04, y1 - 0.04]) m.rod("handrail", [X(d), y, s * (P42_W - 0.01)], [X(d), y, z], 0.012, 4, false);
}
/** A ladder hanging under the side from d0 to d1. */
function p42Ladder(m: MeshBuilder, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number): void {
  const z = s * (P42_W - 0.06);
  for (const d of [d0, d1]) block(m, "handrail", ...[X(d) - 0.02, X(d) + 0.02].sort((p, q) => p - q) as [number, number], y0, y1, ...side(s, P42_W - 0.1, P42_W - 0.03));
  for (let y = y0 + 0.1; y < y1 - 0.05; y += 0.25) m.rod("handrail", [X(d0), y, z], [X(d1), y, z], 0.016, 4, false);
}

/** A GE truck under the P42 (Krupp design): the fish-belly side frames, coil springs either side of each axle box, swing arms, dampers, traction rods. */
function p42Truck(m: MeshBuilder, xc: number, mat: string): void {
  m.bogie(() => {
    const r = 0.508, N = 20, ay = r * Math.cos(Math.PI / N);
    const axles = [-1.372, 1.372];
    for (const dx of axles)
      m.scope("wheelset", () => {
        const x = xc + dx;
        const axle = ngon(8, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -0.95, axle, 0.95);
        for (const s of [-1, 1]) {
          extrude(m, "steel", "z", ngon(N, r, Math.PI / N, x, ay), side(s, 0.665, 0.8));
          extrude(m, "wheel", "z", ngon(16, r * 0.82, 0, x, ay), side(s, 0.8, 0.82));
        }
      });
    const xs = [-1.95, -1.62, -1.1, -0.62, 0, 0.62, 1.1, 1.62, 1.95];
    const top: Pt[] = xs.map((x) => [xc + x, Math.abs(x) > 1.9 ? 0.98 : 1.05]);
    const bot: Pt[] = xs.map((x, i) => [xc + x, [0.87, 0.86, 0.8, 0.48, 0.4, 0.48, 0.8, 0.86, 0.87][i]!]);
    m.scope("frame", () => {
      for (const s of [-1, 1]) plate(m, mat, top, bot, ...side(s, 0.96, 1.08));
      for (const x of [-0.5, 0.5]) block(m, mat, xc + x - 0.1, xc + x + 0.1, 0.62, 0.95, -0.96, 0.96);
      for (const x of [-1.88, 1.88]) block(m, mat, xc + x - 0.06, xc + x + 0.06, 0.86, 0.97, -0.96, 0.96);
      for (const s of [-1, 1]) block(m, mat, xc - 0.24, xc + 0.24, 0.3, 0.56, ...side(s, 0.92, 1.1));
    });
    m.scope("axle boxes", () => {
      for (const dx of axles)
        for (const s of [-1, 1]) {
          const x = xc + dx;
          block(m, mat, x - 0.17, x + 0.17, ay - 0.17, ay + 0.15, ...side(s, 0.84, 1.1));
          block(m, mat, x - 0.46, x + 0.46, ay + 0.03, ay + 0.1, ...side(s, 0.96, 1.08));
          m.rod("spring", [x, ay + 0.15, s * 1.15], [x, 1.0, s * 1.15], 0.045, 6);
        }
    });
    m.scope("primary suspension", () => {
      for (const dx of axles)
        for (const s of [-1, 1])
          for (const o of [-0.36, 0.36]) {
            const ring = ngon(8, 0.1, Math.PI / 8, xc + dx + o, s * 1.02);
            m.prism("spring", ring, ay + 0.1, Math.abs(dx + o) > 1.6 ? 0.86 : 0.8);
          }
    });
    m.scope("traction rods", () => {
      for (const s of [-1, 1]) for (const dx of axles) m.rod(mat, [xc + dx * 0.78, ay - 0.04, s * 1.02], [xc + Math.sign(dx) * 0.24, 0.42, s * 1.02], 0.035, 6);
    });
    m.scope("brake cylinders", () => {
      for (const s of [-1, 1]) for (const x of [-0.75, 0.75]) m.sweep(mat, "x", ngon(8, 0.07, 0, s * 1.12, 0.92), xc + x - 0.22, ngon(8, 0.07, 0, s * 1.12, 0.92), xc + x + 0.22);
    });
    m.scope("traction motors", () => {
      for (const dx of axles) {
        const motor = ngon(10, 0.3, 0, xc + dx - Math.sign(dx) * 0.55, ay + 0.06);
        m.sweep(mat, "z", motor, -0.6, motor, 0.6);
      }
    });
  });
}

export function buildP42(l: P42Livery): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  const tip = P42_TIP;
  const X = (d: number) => tip - d;
  const L = P42_BODY;
  const sw = p42CabSwitch(l);
  const edges = [...new Set(l.bands.flatMap(([a, c]) => [a, c]))].filter((y) => y > P42_Y + 0.01 && y < P42_CREASE - 0.01).sort((p, q) => p - q);
  const b = p42Body(edges, [sw, ...l.cabLine.map(([d]) => d)]);
  const sideMat = (y: number) => p42BandOf(l.bands, y);
  const lineAt = (d: number) => p42Lerp(l.cabLine, d);
  const faceLine = (z: number) => l.face[0] + ((l.face[1] - l.face[0]) * Math.min(z, P42_VW)) / P42_VW;
  m.scope("body", () => {
    m.scope("shell", () => {
      const mat = (d: number, k: number) => {
        const h = halfSlice(b, d);
        const y = (h[k]![1] + h[k + 1]![1]) / 2;
        const role = edgeRole(b, k).kind;
        if (role === "bottom") return l.under;
        if (role === "skirt") return l.skirt;
        if (role === "lower" || role === "side") return sideMat(y);
        if (d < sw) return l.cab;
        return y < P42_BAND - 1e-6 ? l.band : l.cab;
      };
      const bands = (d: number): Array<[number, number, string]> => {
        const ys = [...new Set([...halfSlice(b, d).map((p) => p[1]), P42_A, P42_CREASE, ...edges])].sort((p, q) => p - q);
        const out: Array<[number, number, string]> = [];
        for (let i = 0; i + 1 < ys.length; i++) {
          const [y0, y1] = [ys[i]!, ys[i + 1]!];
          if (y1 - y0 < 1e-6) continue;
          const ym = (y0 + y1) / 2;
          const mt = ym < P42_A ? l.skirt : ym < P42_CREASE ? sideMat(ym) : l.band;
          const last = out[out.length - 1];
          if (last && last[2] === mt) last[1] = y1;
          else out.push([y0, y1, mt]);
        }
        return out;
      };
      drawShell(m, b, X, mat, bands);
    });
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("paint", () => {
          // the face under its line: the side's bands across the V's planes and the corner chamfers
          for (const [a, c, mt] of l.faceBands ?? l.bands) {
            const [y0, y1] = [Math.max(a, P42_KNEE), Math.min(c, Math.max(l.face[0], l.face[1]))];
            if (y1 <= y0 + 1e-6) continue;
            const v = clipUnder([[0, y0], [P42_VW, y0], [P42_VW, y1], [0, y1]], faceLine);
            if (v.length >= 3) p42FacePanel(m, X, s, mt, v, 0.005, 0.002);
            const yc = Math.min(y1, l.face[1]);
            if (yc > y0 + 1e-6) p42FacePanel(m, X, s, mt, [[P42_VW, y0], [P42_W, y0], [P42_W, yc], [P42_VW, yc]], 0.005, 0.002);
          }
          // the cab's field down the side
          const [c0] = l.cabLine[0]!;
          const cEnd = l.cabLine.find(([, y]) => y >= P42_CREASE - 1e-6)?.[0] ?? l.cabLine[l.cabLine.length - 1]![0];
          p42Strip(m, b, X, s, l.cab, c0, cEnd, lineAt, (d) => b.S(d), Math.ceil((cEnd - c0) / 0.2), []);
          if (l.band !== l.cab) {
            const top = l.cabLine[l.cabLine.length - 1]![0];
            const zl = (d: number) => sliceHalf(b, d, lineAt(d));
            // under the line over the band before the switch, the band's paint; over it after, the cab's
            if (sw > cEnd) shapedCrownPane(m, b, X, s, l.band, [cEnd, sw], zl, (d) => p42Plan(d), 0.005, [cEnd + (sw - cEnd) / 2]);
            if (top > sw) shapedCrownPane(m, b, X, s, l.cab, [sw, top], () => 1.33, zl, 0.005, [sw + (top - sw) / 3, sw + (2 * (top - sw)) / 3]);
          }
          if (l.swoosh) {
            const t = l.swoosh;
            const rows = Array.from({ length: 12 }, (_, i) => t[0]![0] + ((L - t[0]![0]) * (i + 1)) / 13);
            shapedCrownPane(m, b, X, s, l.cab, [t[0]![0], L], () => 1.33, (d) => sliceHalf(b, d, p42Lerp(t, d)), 0.005, rows);
          }
          if (l.wedge) {
            const e = l.wedge.edge;
            const end = e[e.length - 1]![0];
            const [c1] = l.cabLine[l.cabLine.length - 1]!;
            p42Strip(m, b, X, s, l.wedge.mat, 0, end, (d) => Math.min(p42Lerp(e, d), b.S(d)), (d) => (d < c1 ? Math.min(b.S(d), lineAt(d), P42_CREASE) : Math.min(b.S(d), P42_CREASE)), 60, []);
          }
        });
        m.scope("cab window", () => {
          for (const [d0, d1] of [[1.5, 2.03], [2.07, 2.6]] as const) {
            p42BandPanel(m, X, s, "rubber", d0, d1, 3.43, 3.88, 0.0075, 0.03);
            p42BandPanel(m, X, s, "glass", d0 + 0.04, d1 - 0.04, 3.47, 3.84, 0.011, 0.004);
          }
          // the mirror plate standing out at the window's front edge
          const x = X(1.44);
          const pt = (y: number, o: number): Vec3 => [x, y, s * (p42BandZ(y) + o)];
          m.slab("frameSilver", [pt(3.38, -0.02), pt(3.38, 0.12), pt(4.0, 0.12), pt(4.0, -0.02)], [-0.04, 0, 0]);
        });
        m.scope("cab door", () => {
          // the leaf's seam up the side and over the band, its window; the step well under it and its treads
          const t = 0.018;
          for (const [a, c] of [[2.84, 2.84 + t], [3.42 - t, 3.42]] as const) {
            sidePanel(m, b, X, s, "rubber", a, c, 2.26, P42_CREASE, 0.0075, 0.01);
            p42BandPanel(m, X, s, "rubber", a, c, P42_CREASE, 4.0, 0.0075, 0.01);
          }
          p42BandPanel(m, X, s, "rubber", 2.84 + t, 3.42 - t, 4.0 - t, 4.0, 0.0075, 0.01);
          sidePanel(m, b, X, s, "rubber", 2.97, 3.29, 2.72, 3.24, 0.0075, 0.01);
          sidePanel(m, b, X, s, "glass", 3.0, 3.26, 2.75, 3.21, 0.011, 0.004);
          sidePanel(m, b, X, s, "black", 2.84, 3.42, 1.5, 2.26, 0.0075, 0.02);
          for (const y of [1.6, 1.95]) sidePanel(m, b, X, s, "handrail", 2.88, 3.38, y, y + 0.04, 0.03, 0.03);
          p42Handrail(m, X, s, 2.78, 1.55, 3.3);
          p42Handrail(m, X, s, 3.5, 1.55, 3.3);
        });
        m.scope("ladders", () => {
          p42Ladder(m, X, s, 2.96, 3.36, 0.36, P42_A);
          p42Ladder(m, X, s, 19.12, 19.52, 0.36, P42_A);
        });
        m.scope("cab side", () => {
          // the hatch by the nose and the cabinet under the window with its grille and slot
          p42Seam(m, b, X, s, 0.62, 1.12, 1.5, 2.12);
          surfaceDisc(m, b, X, 0.9, 1.75, s, "black", 0.03, 0.012, 0.02, 8);
          p42Seam(m, b, X, s, 1.29, 2.67, 1.49, 2.24);
          p42SideGrille(m, b, X, s, 1.9, 2.55, 1.62, 2.16, "grille");
          sidePanel(m, b, X, s, "louvre", 1.58, 1.66, 1.64, 2.0, 0.011, 0.01);
        });
        m.scope("grilles", () => {
          // the upper band: the cab's inertial filters (framed on the left, one fine grille on the right), the engine room's louvres
          if (s < 0) for (const [a, c] of [[4.15, 5.01], [5.23, 6.08]] as const) p42BandGrille(m, X, s, a, c, 3.42, 3.94, "frameSilver", 0.06);
          else p42BandGrille(m, X, s, 4.15, 6.08, 3.42, 3.94, "frameSilver", 0.045);
          const louvres = s < 0 ? [[6.23, 6.93], [6.97, 7.68], [7.79, 8.79]] : [[6.23, 7.45], [7.55, 8.79]];
          for (const [a, c] of louvres) p42BandGrille(m, X, s, a!, c!, 3.4, 3.96, null);
          p42BandGrille(m, X, s, 14.15, 15.07, 3.4, 3.96, null);
          // the radiator intakes: four panes in two frames over the rear truck
          for (const [a, c] of [[15.22, 16.04], [16.08, 16.95], [17.09, 17.93], [17.97, 18.82]] as const) p42SideGrille(m, b, X, s, a, c, 1.56, 2.36, "grille");
        });
        m.scope("rear door", () => {
          p42Seam(m, b, X, s, 19.07, 19.6, 1.49, 3.27);
          sidePanel(m, b, X, s, "rubber", 19.17, 19.5, 2.65, 3.2, 0.0075, 0.01);
          sidePanel(m, b, X, s, "glass", 19.2, 19.47, 2.68, 3.17, 0.011, 0.004);
          p42Handrail(m, X, s, 18.98, 1.55, 3.2);
          p42Handrail(m, X, s, 19.7, 1.55, 3.2);
          // the engine room's hatch
          p42Seam(m, b, X, s, 12.88, 13.46, 1.49, 3.23);
        });
        m.scope("lettering", () => {
          if (l.lettering) p42Lettering(m, b, X, s, l.lettering.text, l.lettering.d, l.lettering.y, l.lettering.h, l.lettering.mat);
          if (l.travelMark) p42TravelMark(m, b, X, s, l.travelMark, 4.85, 2.86);
          for (const [t, d, y, h, mt] of l.marks ?? []) p42Lettering(m, b, X, s, t, d, y, h, mt);
          p42Lettering(m, b, X, s, l.number, l.sideNumber[0], l.sideNumber[1], l.sideNumber[2], l.numberMat);
        });
      });
  });
  m.scope("nose", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right half" : "left half", () => {
        m.scope("windscreen", () => {
          const pane: Pt[] = [[0.075, 3.53], [1.2, 3.53], [1.17, 3.97], [0.075, 3.97]];
          p42FacePanel(m, X, s, "rubber", pane.map(([z, y]): Pt => [z + (z > 0.5 ? 0.03 : -0.03), y + (y > 3.8 ? 0.03 : -0.03)]), 0.0075, 0.03);
          p42FacePanel(m, X, s, "cabGlass", pane, 0.011, 0.004);
          // the wiper, parked up the outer edge
          const [a, c] = [p42FaceAt(X, 0.88, 3.45, s, 0.02).p, p42FaceAt(X, 1.08, 3.92, s, 0.02).p];
          m.rod("black", a, c, 0.012, 4);
        });
        m.scope("lamps", () => {
          p42FacePanel(m, X, s, "black", [[0, 2.36], [0.27, 2.36], [0.31, 2.47], [0.27, 2.58], [0, 2.58]], 0.0075, 0.02);
          p42FaceLamp(m, X, 0.155, 2.47, s, 0.095, "lampHead");
          p42FaceLamp(m, X, 0.82, 2.47, s, 0.06, "lampRed", 10);
          // the ditch light in its bezel and the lamp box under it, on the knee's V
          const ditch = (r: number): Pt[] => Array.from({ length: 12 }, (_, i) => [0.88 + r * Math.cos((2 * Math.PI * i) / 12), 2.06 + r * Math.sin((2 * Math.PI * i) / 12)] as Pt);
          p42FacePanel(m, X, s, "frameSilver", ditch(0.135), 0.0075, 0.02, true);
          p42FacePanel(m, X, s, "ditch", ditch(0.1), 0.02, 0.01, true);
          p42FacePanel(m, X, s, "black", [[0.68, 1.57], [1.07, 1.57], [1.07, 1.86], [0.68, 1.86]], 0.0075, 0.02, true);
          for (const z of [0.78, 0.97]) p42FacePanel(m, X, s, "p42Lens", Array.from({ length: 8 }, (_, i) => [z + 0.055 * Math.cos((2 * Math.PI * i) / 8), 1.7 + 0.055 * Math.sin((2 * Math.PI * i) / 8)] as Pt), 0.016, 0.01, true);
        });
        m.scope("pilot", () => {
          // the plow follows the face's V ahead of it, leaning back, cut away round the coupler
          const pt = (z: number, y: number): Vec3 => [tip - p42Setback(z) + 0.27 - 0.15 * ((y - 0.22) / 0.8), y, s * z];
          m.slab(l.pilot, [pt(0.38, 0.22), pt(P42_VW, 0.22), pt(P42_VW, 1.02), pt(0.38, 1.02)], [-0.07, 0, 0]);
          m.slab(l.pilot, [pt(P42_VW, 0.22), pt(1.42, 0.22), pt(1.42, 1.02), pt(P42_VW, 1.02)], [-0.07, 0, 0]);
          m.slab(l.pilot, [pt(0, 0.22), pt(0.4, 0.22), pt(0.4, 0.62), pt(0, 0.62)], [-0.07, 0, 0]);
        });
      });
    m.scope("number board", () => {
      // a flat box standing out of the V through its apex, the number on it
      const n = norm([P42_RAKE, 1, 0]);
      const at = (z: number, y: number, o: number): Vec3 => [X((y - P42_KNEE) / P42_RAKE) + n[0] * o, y + n[1] * o, z];
      m.slab("black", [at(-0.37, 3.13, 0.01), at(0.37, 3.13, 0.01), at(0.37, 3.4, 0.01), at(-0.37, 3.4, 0.01)], mul3(n, -0.12));
      const h = 0.16, w = h * 0.58, gap = h * 0.18;
      const width = strokeWidth(l.number, w, gap);
      m.facets("white", strokeText(l.number, -width / 2, 3.185, h, w, gap, false, h * 0.14).map(([u, v]) => at(-u, v, 0.014)), n);
    });
    if (l.travelMark)
      m.scope("face lettering", () => {
        // the small white AMTRAK and travel mark under the number board, vertex by vertex on the V
        const onV = (u: number, v: number): Vec3 => (u >= 0 ? p42FaceAt(X, u, v, -1, 0.012).p : p42FaceAt(X, -u, v, 1, 0.012).p);
        const h = 0.075, w = h * 0.58, gap = h * 0.18;
        const width = strokeWidth("AMTRAK", w, gap);
        const pts = strokeText("AMTRAK", -width / 2, 2.98, h, w, gap, false, h * 0.16).map(([u, v]) => onV(u, v));
        for (let i = 0; i < 3; i++) {
          const y0 = 2.93 - i * 0.055;
          const quad: Pt[] = [[-0.18 + i * 0.07, y0 - 0.035], [0.2, y0], [0.2, y0 + 0.02], [-0.2 + i * 0.07, y0 - 0.005]];
          pts.push(...[quad[0]!, quad[1]!, quad[2]!, quad[0]!, quad[2]!, quad[3]!].map(([u, v]) => onV(u, v)));
        }
        m.facets("white", pts, [0.85, 0.52, 0]);
      });
    m.scope("coupler", () => {
      block(m, "black", tip - 0.3, tip + 0.05, 0.74, 1.08, -0.36, 0.36);
      knuckleCoupler(m, 1, tip - 0.25, P42_LENGTH / 2, COUPLER_Y);
      for (const z of [-0.55, 0.55]) m.rod("hose", [tip + 0.02, 1.0, z], [tip + 0.18, 0.62, z * 1.1], 0.03, 6);
    });
  });
  m.scope("rear end", () => {
    const x = X(L);
    const face = -x;
    const at = (z: number, y: number, o: number): Vec3 => [x - o, y, z];
    const panel = (mat: string, z0: number, z1: number, y0: number, y1: number, o: number, depth = 0.02) =>
      m.slab(mat, [at(z0, y0, o), at(z1, y0, o), at(z1, y1, o), at(z0, y1, o)], [depth, 0, 0]);
    panel("rubber", -1.06, -0.46, 1.3, 3.32, 0.002);
    panel(sideMat(2.5), -1.03, -0.49, 1.33, 3.29, 0.006);
    panel("rubber", -0.94, -0.6, 2.55, 3.18, 0.009, 0.01);
    panel("glass", -0.91, -0.63, 2.58, 3.15, 0.013, 0.004);
    panel("black", -1.08, -0.45, 3.98, 4.2, 0.006);
    panel("black", -1.08, -0.45, 3.42, 3.62, 0.006);
    panel("black", 0.72, 1.0, 2.95, 3.35, 0.006);
    faceLamps(m, -1, face, [[-0.88, 3.79, 0.075, "lampHead"], [-0.66, 3.79, 0.075, "lampHead"], [-1.22, 3.88, 0.06, "lampRed"], [0.75, 3.88, 0.06, "lampRed"]]);
    const h = 0.22, w = h * 0.58, gap = h * 0.18;
    const width = strokeWidth(l.number, w, gap);
    const tris = strokeText(l.number, -width / 2, 3.42, h, w, gap, false, h * 0.13).map(([u, v]): Vec3 => [x - 0.008, v, 0.78 + u]);
    m.facets(l.numberMat, tris, [-1, 0, 0]);
    block(m, l.under, x - 0.06, x + 0.3, 0.8, P42_A + 0.004, -1.3, 1.3);
    m.scope("coupler", () => knuckleCoupler(m, -1, face - 0.1, P42_LENGTH / 2, COUPLER_Y));
  });
  m.scope("roof", () => {
    m.scope("cab", () => {
      horn(m, 1, X(2.6), 0.35, 4.47);
      for (const [d, z] of [[1.95, -0.45], [3.0, 0.1]] as const) block(m, "black", X(d) - 0.08, X(d) + 0.08, 4.3, 4.44, z - 0.05, z + 0.05);
    });
    m.scope("exhaust", () => exhaust(m, X(13.2), 0, 4.33, 4.47, 0.75, 0.45));
    m.scope("radiator hatch", () => {
      block(m, l.cab, X(20.0), X(15.7), 4.3, 4.43, -0.88, 0.88);
      for (const d of [16.8, 18.9]) roofFan(m, X(d), 0, 4.43, 0.55);
    });
  });
  m.scope("running gear", () => {
    m.scope("front truck", () => p42Truck(m, P42_TRUCK, l.truck));
    m.scope("rear truck", () => p42Truck(m, -P42_TRUCK, l.truck));
    m.scope("reservoirs", () => {
      // the air reservoirs under the fairing's tail and the battery box behind it
      for (const z of [-0.6, 0.6]) tankX(m, "tank", X(12.3), X(9.8), z, 0.47, 0.21);
      block(m, l.under, X(14.1), X(13.2), 0.3, P42_A + 0.01, -1.2, 1.2);
    });
    m.scope("frame", () => block(m, l.under, X(L) + 0.3, tip - 0.3, 0.98, P42_A + 0.002, -1.3, 1.3));
  });
  return m;
}

// ---------------------------------------------------------------------------
// EMD F40PH

const F40_LENGTH = ft(56, 2); // 17.12 m over the couplers
const F40_REACH = 0.55; // the nose tip behind the front coupler face (the pilot stands out)
const F40_REAR = 0.4;
const F40_BODY = F40_LENGTH - F40_REACH - F40_REAR;
const F40_TRUCK = ft(30, 6) / 2;
/** Height of the nose's top (its shoulder) and of the body's roof crown. */
const F40_NOSE_TOP = 3.35;
const F40_ROOF = 4.6;
/** The cab front: the windscreen from the nose top at d = 1.55 to its head at d = 1.9; the roof reached at d = 2.4. */
const F40_CAB = 1.55;

export const F40_SPEC: CarbodySpec = {
  length: F40_BODY, W: 1.59, Y: 1.42, S: 4.36, C: F40_ROOF, lean: 0.99, arc: 5, B: 1.3, wl: 1.57, A: 1.4, wa: 1.58,
  front: {
    len: 0.32, tip: 0.8, power: 1.4,
    C: [[0, F40_NOSE_TOP - 0.05], [0.25, F40_NOSE_TOP + 0.06], [F40_CAB, F40_NOSE_TOP + 0.14], [F40_CAB + 0.05, F40_NOSE_TOP + 0.24], [1.9, 4.12], [2.15, 4.42], [2.4, F40_ROOF]],
    S: [[0, F40_NOSE_TOP - 0.12], [0.25, F40_NOSE_TOP], [F40_CAB, F40_NOSE_TOP + 0.08], [F40_CAB + 0.05, F40_NOSE_TOP + 0.15], [1.9, 3.97], [2.15, 4.22], [2.4, 4.36]],
    Y: [[0, 1.5], [0.2, 1.42]],
    A: [[0, 1.45], [0.2, 1.4]],
    B: [[0, 1.4], [0.2, 1.3]],
  },
  edges: [], step: 0.8, noseStep: 0.12,
};

const F40_PAL = {
  silver: paint("#c3c7cb", 0.35), amBlue: paint("#1f4f9e"), amRed: paint("#c8262c"), amWhite: paint("#eeeeea"), amBlack: paint("#202225"),
  truckBlack: paint("#242527", 0.85), bell: paint("#b08d3c", 0.4),
};

/** Amtrak's Phase III: silver with the red, white and blue stripes, the nose top and cab front black. */
export const F40_LIVERIES: Record<string, CarbodyLivery> = {
  phaseIII: {
    title: "Amtrak Phase III", palette: F40_PAL,
    bands: [[0, 2.16, "silver"], [2.16, 2.36, "amBlue"], [2.36, 2.54, "amWhite"], [2.54, 2.76, "amRed"], [2.76, 9, "silver"]],
    roof: "silver", skirt: "amBlack", under: "truckBlack",
    lettering: { text: "Amtrak", d: 9.6, y: 3.15, h: 0.66, mat: "amBlack" },
    number: "406", numberMat: "amBlack",
  },
  phaseII: {
    title: "Amtrak Phase II", palette: F40_PAL,
    bands: [[0, 2.44, "silver"], [2.44, 2.56, "amBlue"], [2.56, 2.68, "amWhite"], [2.68, 2.8, "amRed"], [2.8, 9, "silver"]],
    roof: "silver", skirt: "amBlack", under: "truckBlack",
    lettering: { text: "Amtrak", d: 9.0, y: 3.2, h: 0.66, mat: "amBlack" },
    number: "257", numberMat: "amBlack",
  },
};

/** The cab roof's black ends here (d from the nose tip): behind the cab door. */
const F40_CAB_ROOF = 4.6;

/**
 * The Amtrak wordmark's glyphs ("Amtrak" in the bold lower-case sans of the
 * Phase II-IV schemes): polylines in units of the capital's height, each with its
 * advance width. Drawn by `wordmark` as bars on the side, like strokeFont.ts.
 */
const AMTRAK_GLYPHS: ReadonlyArray<{ w: number; lines: Array<Array<[number, number]>> }> = [
  { w: 0.78, lines: [[[0, 0], [0.39, 1], [0.78, 0]], [[0.17, 0.36], [0.61, 0.36]]] },
  { w: 0.74, lines: [[[0, 0], [0, 0.64]], [[0, 0.44], [0.1, 0.58], [0.22, 0.64], [0.31, 0.6], [0.37, 0.48], [0.37, 0]], [[0.37, 0.44], [0.47, 0.58], [0.59, 0.64], [0.68, 0.6], [0.74, 0.48], [0.74, 0]]] },
  { w: 0.34, lines: [[[0.14, 0.86], [0.14, 0.1], [0.22, 0.01], [0.34, 0.01]], [[0, 0.62], [0.32, 0.62]]] },
  { w: 0.34, lines: [[[0, 0], [0, 0.64]], [[0, 0.42], [0.1, 0.57], [0.21, 0.63], [0.34, 0.63]]] },
  { w: 0.5, lines: [[[0.5, 0.64], [0.5, 0]], [[0.5, 0.44], [0.4, 0.59], [0.25, 0.64], [0.1, 0.58], [0.01, 0.42], [0.01, 0.22], [0.1, 0.06], [0.25, 0], [0.4, 0.05], [0.5, 0.2]]] },
  { w: 0.46, lines: [[[0, 0], [0, 1]], [[0.44, 0.64], [0, 0.26]], [[0.14, 0.38], [0.46, 0]]] },
];

/** The wordmark on side s, centred at d, its foot at y, capitals h tall: bold bars (a fifth of h) as decals. */
function wordmark(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d: number, y: number, h: number, mat: string, proud = 0.012): void {
  const gap = 0.15, t = h * 0.2;
  const width = AMTRAK_GLYPHS.reduce((a, g) => a + g.w + gap, -gap) * h;
  const dir = Math.sign(X(0) - X(1));
  const tris: Pt[] = [];
  let u0 = -width / 2;
  for (const g of AMTRAK_GLYPHS) {
    for (const line of g.lines)
      for (let j = 1; j < line.length; j++) {
        const [x0, y0] = [u0 + line[j - 1]![0] * h, line[j - 1]![1] * h];
        const [x1, y1] = [u0 + line[j]![0] * h, line[j]![1] * h];
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        const [dx, dy] = [((x1 - x0) / len) * (t / 2), ((y1 - y0) / len) * (t / 2)];
        const q: Pt[] = [[x0 - dx - dy, y0 - dy + dx], [x0 - dx + dy, y0 - dy - dx], [x1 + dx + dy, y1 + dy - dx], [x1 + dx - dy, y1 + dy + dx]];
        for (const k of [0, 1, 2, 0, 2, 3]) tris.push([d - dir * s * q[k]![0], y + q[k]![1]]);
      }
    u0 += (g.w + gap) * h;
  }
  sideDecal(m, b, X, s, mat, tris, proud);
}

/** The livery's bands, the black nose top and cab front (anti-glare) over them. */
function f40Painter(l: CarbodyLivery): Painter {
  const base = painter(l, F40_BODY, false);
  return (d, y, region) => {
    // the cab's roof black back to the cab's rear wall, as on Kato's Phase III model
    if (region === "arc" && d < F40_CAB_ROOF) return "amBlack";
    if (region === "side" && d < F40_CAB + 0.04 && y > F40_NOSE_TOP - 0.12) return "amBlack";
    if (region === "lower" || region === "skirt") return "amBlack";
    return base(d, y, region);
  };
}

export function buildF40(l: CarbodyLivery): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  const b = carbody({ ...F40_SPEC, edges: [...edgesOf(l, F40_SPEC.Y, F40_SPEC.S), F40_NOSE_TOP - 0.12].sort((p, q) => p - q) });
  const tip = F40_LENGTH / 2 - F40_REACH;
  const X = (d: number) => tip - d;
  const roofY = F40_ROOF;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, f40Painter(l)));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab windows", () => {
          sideWindow(m, b, X, s, 2.5, 3.12, 3.38, 4.12);
          sideWindow(m, b, X, s, 3.2, 3.7, 3.38, 4.12);
        });
        m.scope("cab door", () => sidePanel(m, b, X, s, "black", 3.85, 4.5, 1.55, 4.12, 0.003, 0.004));
        // the engine-room doors' seams below the grilles
        m.scope("door seams", () => {
          for (const d of [5.0, 6.0, 7.0, 8.0, 9.0, 11.6, 12.6, 13.6]) sidePanel(m, b, X, s, "louvre", d, d + 0.025, 1.6, 3.95, 0.003, 0.002);
        });
        m.scope("grilles", () => {
          // the inertial filter behind the cab, the dynamic brake intake and the radiators' long band at the rear
          sideGrille(m, b, X, s, 4.75, 5.85, 3.8, 4.25);
          sideGrille(m, b, X, s, 6.2, 7.6, 3.95, 4.25);
          sideGrille(m, b, X, s, 10.6, F40_BODY - 0.25, 3.85, 4.28, true);
        });
        if (l.lettering) m.scope("logo", () => wordmark(m, b, X, s, l.lettering!.d, l.lettering!.y, l.lettering!.h, l.lettering!.mat));
        // the nose's wordmark in the white stripe, the number under the side's
        const white = l.bands.find((band) => band[2] === "amWhite")!;
        m.scope("nose logo", () => wordmark(m, b, X, s, 0.95, white[0] + 0.022, white[1] - white[0] - 0.044, "amBlack"));
        if (l.lettering) m.scope("number", () => sideLettering(m, b, X, s, l.number, l.lettering!.d, l.lettering!.y - 0.36, 0.24, l.numberMat, 0.012));
        m.scope("handrails", () => {
          for (const d of [3.78, 4.58]) {
            const z = s * (bodyHalf(b, d) + 0.03);
            m.rod("handrail", [X(d), 1.55, z], [X(d), 3.9, z], 0.016, 6);
          }
        });
      });
  });
  m.scope("nose", () => {
    m.scope("windscreen", () => {
      for (const s of [1, -1]) {
        crownPane(m, b, X, s, "rubber", [F40_CAB + 0.08, 1.86], [0.08, 1.4], 0.006);
        crownPane(m, b, X, s, "cabGlass", [F40_CAB + 0.12, 1.82], [0.13, 1.35], 0.012);
      }
    });
    m.scope("headlights", () => {
      const x = tip + 0.01;
      faceLamps(m, 1, x, [[0, 3.05, 0.085, "lampHead"], [0, 2.85, 0.085, "lampHead"], [-1.08, 1.62, 0.075, "ditch"], [1.08, 1.62, 0.075, "ditch"]]);
    });
    m.scope("number boards", () => {
      // the boards and the red marker lamps over the windscreen, on the cab front's head
      const d = 2.12, y = 4.3;
      for (const sz of [-1, 1]) {
        block(m, "amBlack", X(d) - 0.12, X(d) + 0.1, y - 0.12, y + 0.12, ...side(sz, 0.22, 0.75));
        block(m, "numberBoard", X(d) + 0.1, X(d) + 0.11, y - 0.08, y + 0.08, ...side(sz, 0.26, 0.71));
        faceLamps(m, 1, X(d) + 0.08, [[sz * 1.0, y, 0.07, "lampRed"]]);
      }
    });
    m.scope("pilot", () => pilotPlate(m, "amBlack", 1, tip + 0.15, 0.18, 1.42, 1.45, 0.35, 0.55));
    m.scope("coupler", () => knuckleCoupler(m, 1, tip, F40_LENGTH / 2, COUPLER_Y));
  });
  m.scope("rear end", () => {
    const x = X(F40_BODY);
    faceLamps(m, -1, -x, [[0, 4.05, 0.1, "lampHead"], [-1.15, 3.95, 0.07, "lampRed"], [1.15, 3.95, 0.07, "lampRed"]]);
    for (const sz of [-1, 1]) block(m, "numberBoard", x - 0.02, x + 0.01, 4.12, 4.28, ...side(sz, 0.25, 0.7));
    m.scope("coupler", () => knuckleCoupler(m, -1, -x, F40_LENGTH / 2, COUPLER_Y));
    pilotPlate(m, "amBlack", -1, -x + 0.12, 0.25, 1.42, 1.4, 0.2, 0.45);
  });
  m.scope("roof", () => {
    m.scope("dynamic brake", () => {
      // the blister over the grids, louvred either side of its fan
      block(m, "silver", X(6.6), X(4.6), roofY - 0.06, roofY + 0.1, -1.05, 1.05);
      roofFan(m, X(5.6), 0, roofY + 0.12, 0.42);
      for (let d = 4.75; d < 6.5; d += 0.16) for (const sz of [-1, 1]) block(m, "louvre", X(d) - 0.035, X(d) + 0.035, roofY + 0.09, roofY + 0.125, ...side(sz, 0.5, 0.97));
    });
    m.scope("exhaust", () => exhaust(m, X(8.6), 0, roofY - 0.02, roofY + 0.18, 0.35, 0.7));
    m.scope("fans", () => {
      for (const d of [12.3, 14.3]) {
        roofFan(m, X(d), 0, roofY, 0.68);
        // the guard's bars across the fan
        for (const k of [-2, -1, 0, 1, 2]) block(m, "fanGuard", X(d) + k * 0.24 - 0.018, X(d) + k * 0.24 + 0.018, roofY + 0.065, roofY + 0.09, -Math.sqrt(0.62 ** 2 - (k * 0.24) ** 2), Math.sqrt(0.62 ** 2 - (k * 0.24) ** 2));
        block(m, "fanGuard", X(d) - 0.62, X(d) + 0.62, roofY + 0.09, roofY + 0.11, -0.02, 0.02);
      }
    });
    m.scope("horn", () => {
      // a five-chime horn on its stand behind the cab: three trumpets forward, two back
      block(m, "horn", X(3.35) - 0.12, X(3.35) + 0.12, roofY - 0.04, roofY + 0.08, 0.38, 0.62);
      for (const [e, dx, z, dy] of [[1, 0, 0.42, 0.18], [1, 0.08, 0.5, 0.28], [1, -0.06, 0.58, 0.18], [-1, 0.05, 0.44, 0.24], [-1, -0.04, 0.56, 0.24]] as const) horn(m, e, X(3.35) + dx, z, roofY + dy);
    });
    m.scope("bell", () => {
      const x = X(7.4), z = -0.55, y = roofY - 0.03;
      block(m, "horn", x - 0.1, x + 0.1, y, y + 0.06, z - 0.03, z + 0.03);
      m.loft("bell", ngon(10, 0.11, 0, x, z), y + 0.04, ngon(10, 0.06, 0, x, z), y + 0.2);
    });
    m.scope("antenna", () => {
      block(m, "fanGuard", X(3.9) - 0.08, X(3.9) + 0.08, roofY - 0.03, roofY + 0.02, -0.38, -0.22);
      m.rod("horn", [X(3.9), roofY, -0.3], [X(3.9), roofY + 0.32, -0.3], 0.012, 6);
    });
  });
  m.scope("running gear", () => {
    const spec = truckSpec([-ft(4, 6), ft(4, 6)], ft(0, 20), 2.0, 1.3);
    m.scope("front truck", () => truck(m, F40_TRUCK, spec));
    m.scope("rear truck", () => truck(m, -F40_TRUCK, spec));
    m.scope("fuel tank", () => {
      const q: Array<[number, number]> = [[-1.3, 1.29], [-1.3, 0.72], [-1.05, 0.5], [1.05, 0.5], [1.3, 0.72], [1.3, 1.29]];
      m.sweep("amBlack", "x", q.map(([z, y]) => [z, y] as [number, number]), -2.6, q.map(([z, y]) => [z, y] as [number, number]), 1.5);
      for (const sz of [-1, 1]) tankX(m, "tank", 1.75, 3.65, sz * 1.05, 1.0, 0.2, 10);
    });
  });
  return m;
}

/** Half width of the body's side at d and height y (the side's plane). */
function bodyHalf(b: SliceBody, d: number): number {
  return b.w(d);
}

// ---------------------------------------------------------------------------
// Siemens ALC-42 Charger

const ALC_LENGTH = 21.79;
const ALC_REACH = 0.4;
const ALC_BODY = ALC_LENGTH - ALC_REACH - 0.35;
const ALC_TRUCK = 12.436 / 2;
const ALC_WHEEL = 0.6;

const ALC_SPEC: CarbodySpec = {
  length: ALC_BODY, W: 1.52, Y: 1.45, S: 4.02, C: 4.39, lean: 0.95, arc: 6, B: 1.05, wl: 1.42, A: 1.38, wa: 1.49,
  front: {
    len: 2.3, tip: 0.22, power: 2.4,
    C: [[0, 2.05], [0.15, 2.55], [0.5, 2.95], [1.0, 3.22], [1.6, 3.48], [2.4, 4.2], [2.9, 4.39]],
    S: [[0, 1.95], [0.15, 2.42], [0.5, 2.78], [1.0, 3.0], [1.6, 3.22], [2.4, 3.88], [2.9, 4.02]],
    Y: [[0, 1.6], [0.4, 1.48], [0.8, 1.45]],
    A: [[0, 1.5], [0.5, 1.38]],
    B: [[0, 1.48], [0.25, 1.1], [0.5, 1.05]],
  },
  cuts: truckCuts(ALC_LENGTH / 2 - ALC_REACH, ALC_TRUCK, 2.1),
  edges: [], step: 1.0, noseStep: 0.15,
};

const ALC_PAL = {
  midnight: paint("#1d2c52"), amRed: paint("#b8222a"), silverLight: paint("#d3d6d9", 0.35), amBlue: paint("#2a5aa8"), truckBlack: paint("#242527", 0.85),
};
const pickAlc = (...n: Array<keyof typeof ALC_PAL>) => Object.fromEntries(n.map((k) => [k, ALC_PAL[k]]));

export const ALC_LIVERIES: Record<string, CarbodyLivery> = {
  phaseVII: {
    title: "Amtrak Phase VII", palette: pickAlc("midnight", "amRed", "silverLight", "truckBlack"),
    bands: [[0, 1.5, "silverLight"], [1.5, 1.6, "amRed"], [1.6, 9, "midnight"]],
    roof: "midnight", skirt: "silverLight", under: "truckBlack",
    lettering: { text: "AMTRAK", d: 11.0, y: 2.6, h: 0.5, mat: "silverLight" },
    number: "301", numberMat: "silverLight",
  },
  midwest: {
    title: "Amtrak Midwest", palette: pickAlc("silverLight", "amBlue", "midnight", "truckBlack"),
    bands: [[0, 1.75, "amBlue"], [1.75, 2.35, "silverLight"], [2.35, 2.48, "amBlue"], [2.48, 9, "silverLight"]],
    roof: "silverLight", skirt: "amBlue", under: "truckBlack", nose: { d: 2.0, mat: "amBlue", maxY: 3.4 },
    lettering: { text: "AMTRAK", d: 11.0, y: 2.7, h: 0.5, mat: "amBlue" },
    number: "4601", numberMat: "midnight",
  },
};

export function buildAlc42(l: CarbodyLivery): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  const b = carbody({ ...ALC_SPEC, edges: edgesOf(l, ALC_SPEC.Y, ALC_SPEC.S) });
  const tip = ALC_LENGTH / 2 - ALC_REACH;
  const X = (d: number) => tip - d;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, painter(l, ALC_BODY, false)));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab window", () => sideWindow(m, b, X, s, 2.75, 3.55, 3.15, 3.75));
        m.scope("cab door", () => sidePanel(m, b, X, s, "black", 3.7, 4.3, 1.55, 3.7, 0.003, 0.004));
        m.scope("grilles", () => {
          for (const [a, c] of [[6.0, 9.0], [12.0, 15.5], [16.2, 19.6]] as const) sideGrille(m, b, X, s, a, c, 3.25, 3.85, true);
        });
        if (l.lettering) m.scope("lettering", () => sideLettering(m, b, X, s, l.lettering!.text, l.lettering!.d, l.lettering!.y, l.lettering!.h, l.lettering!.mat, 0.012));
        m.scope("number", () => sideLettering(m, b, X, s, l.number, 4.8, 2.4, 0.28, l.numberMat, 0.012));
      });
  });
  m.scope("nose", () => {
    m.scope("windscreen", () => {
      for (const s of [1, -1]) {
        crownPane(m, b, X, s, "rubber", [1.68, 2.62], [0.03, 1.15], 0.006);
        crownPane(m, b, X, s, "cabGlass", [1.73, 2.57], [0.07, 1.1], 0.012);
      }
    });
    m.scope("headlights", () => noseLamps(m, b, X, 1, [[-0.55, 2.0, 0.09, "lampHead"], [0.55, 2.0, 0.09, "lampHead"], [-1.0, 1.25, 0.08, "ditch"], [1.0, 1.25, 0.08, "ditch"]]));
    m.scope("pilot", () => pilotPlate(m, l.skirt, 1, tip - 0.02, 0.15, 1.1, 1.3, 0.3, 0.5));
    m.scope("coupler", () => knuckleCoupler(m, 1, tip - 0.25, ALC_LENGTH / 2, COUPLER_Y));
  });
  m.scope("rear end", () => {
    const x = X(ALC_BODY);
    endDiaphragm(m, -1, x, 1.35, 3.85);
    faceLamps(m, -1, -x, [[-1.1, 3.95, 0.08, "lampRed"], [1.1, 3.95, 0.08, "lampRed"]]);
    m.scope("coupler", () => knuckleCoupler(m, -1, -x - 0.1, ALC_LENGTH / 2, COUPLER_Y));
    block(m, "truckBlack", x - 0.3, x + 0.02, 0.25, 1.07, -1.2, 1.2);
  });
  m.scope("roof", () => {
    m.scope("fans", () => { for (const d of [16.4, 18.2]) roofFan(m, X(d), 0, 4.39, 0.55); });
    m.scope("exhaust", () => exhaust(m, X(10.5), 0, 4.37, 4.52, 0.4, 0.7));
    m.scope("horn", () => horn(m, 1, X(3.6), 0.35, 4.5));
  });
  m.scope("running gear", () => {
    const spec = truckSpec([-1.5, 1.5], ALC_WHEEL, 2.15, 1.05);
    m.scope("front truck", () => truck(m, ALC_TRUCK, spec));
    m.scope("rear truck", () => truck(m, -ALC_TRUCK, spec));
    m.scope("fuel tank", () => block(m, l.under, -3.5, 3.5, 0.42, 1.05, -1.3, 1.3));
    m.scope("frame", () => block(m, l.under, X(ALC_BODY) + 0.05, tip - 0.6, 1.05, ALC_SPEC.A - 0.01, -1.3, 1.3));
  });
  return m;
}

// ---------------------------------------------------------------------------
// PRR GG1: a double-ended streamlined electric, 2-C+C-2 on two articulated frames

const GG1_LENGTH = ft(79, 6); // 24.23 m over the coupler faces
const GG1_REACH = 0.45;
const GG1_BODY = GG1_LENGTH - 2 * GG1_REACH;
const GG1_DRIVER_R = ft(0, 57) / 2;
const GG1_LEAD_R = ft(0, 36) / 2;
/** Axles from the centre of one half (toward its end): three drivers 6 ft 10 in apart, the guiding truck's two. */
const GG1_DRIVERS = [ft(7, 0), ft(13, 10), ft(20, 8)];
const GG1_LEAD = [ft(28, 6), ft(34, 6)];
const GG1_CAB_FROM = 7.4;

const gg1Nose = {
  len: 3.0, tip: 0.3, power: 2.3,
  C: [[0, 1.95], [0.15, 2.45], [0.45, 2.85], [1.0, 3.1], [3.0, 3.36], [6.0, 3.55], [GG1_CAB_FROM - 0.2, 3.62], [GG1_CAB_FROM + 0.25, 4.22], [GG1_CAB_FROM + 0.6, 4.35]] as Pt[],
  S: [[0, 1.9], [0.2, 2.3], [0.6, 2.62], [1.2, 2.82], [3.0, 2.98], [GG1_CAB_FROM - 0.2, 3.12], [GG1_CAB_FROM + 0.3, 3.7], [GG1_CAB_FROM + 0.6, 3.78]] as Pt[],
  Y: [[0, 1.78], [0.4, 1.62], [1.0, 1.58]] as Pt[],
  A: [[0, 1.7], [0.4, 1.53]] as Pt[],
  B: [[0, 1.68], [0.4, 1.5]] as Pt[],
};

const GG1_SPEC: CarbodySpec = {
  length: GG1_BODY, W: 1.56, Y: 1.58, S: 3.78, C: 4.35, lean: 0.95, arc: 7, B: 1.5, wl: 1.5, A: 1.53, wa: 1.55,
  front: gg1Nose, rear: gg1Nose, edges: [], step: 0.8, noseStep: 0.2,
};

const GG1_PAL = {
  brunswick: paint("#1e2d24"), tuscan: paint("#6e2a20"), gold: paint("#d4b05a", 0.4), pcBlack: paint("#1b1c1e"), pcWhite: paint("#eeeeea"),
  truckBlack: paint("#242527", 0.85),
};
const pickGg1 = (...n: Array<keyof typeof GG1_PAL>) => Object.fromEntries(n.map((k) => [k, GG1_PAL[k]]));

/** The five pinstripes along the side, gathering into the "cat whiskers" toward each nose. */
function pinstripes(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number): void {
  const ys = [1.92, 2.17, 2.42, 2.67, 2.92];
  const yc = 2.15, gather = 3.2;
  for (const y of ys) {
    const at = (d: number) => {
      const e = Math.min(d, GG1_BODY - d);
      return yc + (y - yc) * Math.min(1, Math.max(0.12, e / gather));
    };
    stripDecal(m, b, X, s, "gold", 0.12, GG1_BODY - 0.12, (d) => at(d) - 0.018, (d) => at(d) + 0.018, 0.005, 60);
  }
}

export const GG1_LIVERIES: Record<string, CarbodyLivery> = {
  brunswick: {
    title: "Brunswick green", palette: pickGg1("brunswick", "gold", "truckBlack"),
    bands: [[0, 9, "brunswick"]], roof: "brunswick", skirt: "brunswick", under: "truckBlack",
    number: "4935", numberMat: "gold", decals: pinstripes,
  },
  tuscan: {
    title: "Tuscan red", palette: pickGg1("tuscan", "gold", "truckBlack"),
    bands: [[0, 9, "tuscan"]], roof: "tuscan", skirt: "tuscan", under: "truckBlack",
    number: "4800", numberMat: "gold", decals: pinstripes,
  },
  pennCentral: {
    title: "Penn Central", palette: pickGg1("pcBlack", "pcWhite", "truckBlack"),
    bands: [[0, 9, "pcBlack"]], roof: "pcBlack", skirt: "pcBlack", under: "truckBlack",
    lettering: { text: "PENN CENTRAL", d: GG1_BODY / 2, y: 2.3, h: 0.36, mat: "pcWhite" },
    number: "4872", numberMat: "pcWhite",
  },
};

/** A GG1 wheelset at x: tyres, wheel centres (spoked on the drivers), axle and its boxes. */
function gg1Wheel(m: MeshBuilder, x: number, r: number, spokes: boolean): void {
  m.scope("wheelset", () => {
    const ay = r * Math.cos(Math.PI / 24);
    const axle = ngon(8, 0.09, 0, x, ay);
    m.sweep("steel", "z", axle, -0.85, axle, 0.85);
    for (const s of [-1, 1]) {
      extrude(m, "steel", "z", ngon(24, r, Math.PI / 24, x, ay), side(s, 0.665, 0.8));
      extrude(m, "wheel", "z", ngon(20, r * 0.86, 0, x, ay), side(s, 0.8, 0.82));
      if (spokes) for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        const q: Vec3 = [x + Math.cos(a) * r * 0.78, ay + Math.sin(a) * r * 0.78, 0];
        m.rod("bogie", [x, ay, s * 0.825], [q[0], q[1], s * 0.825], 0.045, 6);
      }
      extrude(m, "bogie", "z", ngon(8, 0.16, Math.PI / 8, x, ay), side(s, 0.82, 0.9));
    }
  });
}

/**
 * One half's running gear toward end e: the three drivers in their frame, one
 * bogie node (the articulated frames turn about the centre hinge), and the
 * two-axle guiding truck ahead of them, a bogie node of its own.
 */
function gg1Half(m: MeshBuilder, e: number, spec: { under: string }): void {
  const span = (a: number, b: number): [number, number] => [Math.min(e * a, e * b), Math.max(e * a, e * b)];
  m.scope("driving frame", () => m.bogie(() => {
    for (const a of GG1_DRIVERS) gg1Wheel(m, e * a, GG1_DRIVER_R, true);
    const [f0, f1] = span(GG1_DRIVERS[0]! - 0.9, GG1_DRIVERS[2]! + 0.9);
    block(m, spec.under, f0, f1, 1.0, 1.48, -1.05, 1.05);
    for (const s of [-1, 1]) block(m, "bogie", f0, f1, 0.62, 1.0, ...side(s, 0.9, 1.0));
  }));
  m.scope("guiding truck", () => m.bogie(() => {
    for (const a of GG1_LEAD) gg1Wheel(m, e * a, GG1_LEAD_R, false);
    const [g0, g1] = span(GG1_LEAD[0]! - 0.6, GG1_LEAD[1]! + 0.5);
    for (const s of [-1, 1]) block(m, "bogie", g0, g1, 0.42, 0.78, ...side(s, 0.9, 1.0));
    block(m, spec.under, g0, g1, 0.78, 0.95, -0.95, 0.95);
  }));
  // the frame's extension over the guiding truck, carrying the body's end
  m.scope("frame extension", () => {
    const [a, b] = span(GG1_DRIVERS[2]! + 0.9, GG1_LEAD[0]! - 0.6);
    block(m, spec.under, a, b, 1.0, 1.48, -1.0, 1.0);
  });
}

export function buildGg1(l: CarbodyLivery): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  const b = carbody({ ...GG1_SPEC, edges: edgesOf(l, GG1_SPEC.Y, GG1_SPEC.S) });
  const tip = GG1_LENGTH / 2 - GG1_REACH;
  const X = (d: number) => tip - d;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, painter(l, GG1_BODY, true)));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        if (l.decals) m.scope("paint", () => l.decals!(m, b, X, s));
        // the cab windows at each end of the centre cab, the louvres along it
        m.scope("cab windows", () => {
          for (const d of [GG1_CAB_FROM + 0.75, GG1_BODY - GG1_CAB_FROM - 1.45]) sideWindow(m, b, X, s, d, d + 0.7, 3.0, 3.55);
        });
        m.scope("louvres", () => {
          for (let i = 0; i < 4; i++) {
            const d = GG1_CAB_FROM + 2.0 + i * 1.3;
            sideGrille(m, b, X, s, d, d + 0.9, 3.05, 3.55);
          }
        });
        if (l.lettering) m.scope("lettering", () => sideLettering(m, b, X, s, l.lettering!.text, l.lettering!.d, l.lettering!.y, l.lettering!.h, l.lettering!.mat, 0.012));
        m.scope("number", () => sideLettering(m, b, X, s, l.number, GG1_BODY / 2, l.lettering ? 1.82 : 3.1, 0.24, l.numberMat, 0.012));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const at = (d: number) => (e > 0 ? d : GG1_BODY - d);
      m.scope("windscreen", () => {
        for (const s of [1, -1]) {
          const [d0, d1] = e > 0 ? [GG1_CAB_FROM - 0.15, GG1_CAB_FROM + 0.4] : [at(GG1_CAB_FROM + 0.4), at(GG1_CAB_FROM - 0.15)];
          crownPane(m, b, X, s, "rubber", [d0, d1], [0.15, 0.85], 0.006, 4, 3);
          crownPane(m, b, X, s, "cabGlass", [d0 + 0.03, d1 - 0.03], [0.2, 0.8], 0.012, 4, 3);
        }
      });
      m.scope("headlight", () => noseLamps(m, b, X, e, [[0, 2.55, 0.13, "lampHead"], [-0.75, 1.95, 0.07, e > 0 ? "lampHead" : "lampRed"], [0.75, 1.95, 0.07, e > 0 ? "lampHead" : "lampRed"]]));
      m.scope("pilot", () => pilotPlate(m, l.skirt, e, tip - 0.1, 0.15, 1.55, 1.2, 0.45, 0.7));
      m.scope("coupler", () => knuckleCoupler(m, e, tip - 0.35, GG1_LENGTH / 2, COUPLER_Y));
      m.scope("running gear", () => gg1Half(m, e, { under: l.under }));
    });
  m.scope("roof", () => {
    // the two diamond pantographs over the cab's ends, the rear one raised
    for (const e of [1, -1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => {
        const x = X(e > 0 ? GG1_CAB_FROM + 1.6 : GG1_BODY - GG1_CAB_FROM - 1.6);
        diamond(m, { xc: x, roofY: 4.33, baseY: 4.62, raised: e < 0 });
      });
    m.scope("horn", () => horn(m, 1, X(GG1_CAB_FROM + 3.2), 0.4, 4.48));
  });
  return m;
}

// ---------------------------------------------------------------------------
// The Acela Express (first generation): power cars and tilting coaches

export type AcelaUnit = "powerCar" | "businessClass" | "firstClass" | "cafe" | "train";
export type AcelaCar = Exclude<AcelaUnit, "train">;
export const ACELA_CARS = [3, 4, 5, 6, 7, 8];

export const ACELA_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", { powerCar: "Power car", businessClass: "Business class", firstClass: "First class", cafe: "Cafe car", train: "Full train" }),
  { ...enumParam("cars", "Cars", Object.fromEntries(ACELA_CARS.map((n) => [String(n), `${n} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
];

export const ACELA_LENGTH = { powerCar: 21.22, coach: 26.64 } as const;
const ACELA_GAP = 0.3;
const ACELA_POWER_TRUCKS = 10.74;
const ACELA_COACH_TRUCKS = 18.14;
const isPower = (c: AcelaCar) => c === "powerCar";
export const acelaLength = (c: AcelaCar) => (isPower(c) ? ACELA_LENGTH.powerCar : ACELA_LENGTH.coach);

const ACELA_PAL = {
  acSilver: paint("#c7cbce", 0.35), acMask: paint("#15181c", 0.25), acDark: paint("#3a4049", 0.5), acBlue: paint("#1f3d6b"), acTeal: paint("#3f8f9c"), truckBlack: paint("#2a2c2f", 0.85),
};

const ACELA_BANDS: ReadonlyArray<readonly [number, number, string]> = [[0, 1.45, "acDark"], [1.45, 2.12, "acSilver"], [2.12, 2.18, "acTeal"], [2.18, 2.28, "acSilver"], [2.28, 3.02, "acDark"], [3.02, 9, "acSilver"]];
const acelaPaint = bandPainter(ACELA_BANDS, "acSilver", "truckBlack", "acDark");
/** The power car's paint: silver sides (the coaches' dark window band left out), the dark skirt and the teal line kept. */
const acelaPowerPaint: Painter = (d, y, region) => {
  const mat = acelaPaint(d, y, region);
  return mat === "acDark" && y > 2.2 ? "acSilver" : mat;
};

const ACELA_POWER_BODY = ACELA_LENGTH.powerCar - ACELA_GAP - 0.4;
const ACELA_POWER: CarbodySpec = {
  length: ACELA_POWER_BODY, W: 1.58, Y: 1.4, S: 3.95, C: 4.32, lean: 0.95, arc: 6, B: 0.85, wl: 1.48, A: 1.2, wa: 1.56,
  front: {
    len: 3.4, tip: 0.2, power: 2.2,
    C: [[0, 1.78], [0.12, 2.06], [0.45, 2.36], [1.5, 2.74], [3.0, 3.36], [4.0, 3.9], [4.6, 4.2], [5.2, 4.32]],
    S: [[0, 1.72], [0.12, 1.98], [0.45, 2.24], [1.5, 2.52], [3.0, 3.02], [4.2, 3.62], [5.2, 3.95]],
    Y: [[0, 1.35], [1.0, 1.4]],
    A: [[0, 1.3], [0.8, 1.2]],
    B: [[0, 1.12], [0.25, 0.6], [1.2, 0.5], [1.8, 0.85]],
  },
  edges: [], step: 1.0, noseStep: 0.2,
};
/** The power car's windscreen mask, its glass and the blue headlight band under it (d, half width on the crown). */
const ACELA_MASK: PaneOutline = { ...roundedPane([2.72, 4.62], 0, [1.6, 1.6], 0.3, 0, 0.5), z0: () => 0 };
const ACELA_SCREEN = roundedPane([2.82, 4.38], 0.05, [1.05, 0.88], 0.14, 0.03, 0.22);
const ACELA_BAND: PaneOutline = {
  d: [1.45, 2.74], z0: () => 0,
  // its lower edge a smile: narrow at the front, the full width at the windscreen
  z1: (d) => 0.5 + 1.1 * Math.sqrt(Math.min(1, Math.max(0, (d - 1.45) / 1.1))), rows: [1.48, 1.55, 1.65, 1.8, 2.0, 2.25, 2.5],
};
/** The side window's sill: a teardrop's lower edge, pointed toward the nose. */
const acelaSideLo = (d: number) => 3.0 + 0.62 * Math.max(0, (5.05 - d) / 0.63) ** 1.6;
const ACELA_COACH_BODY = ACELA_LENGTH.coach - 2 * ACELA_GAP;
const ACELA_COACH: CarbodySpec = {
  length: ACELA_COACH_BODY, W: 1.57, Y: 1.4, S: 3.7, C: 4.23, lean: 0.93, arc: 6, B: 0.85, wl: 1.48, A: 1.2, wa: 1.55,
  edges: [], step: 1.0,
};

/** Truck positions (d) of a car, metres back from its body's +X end. */
function acelaTrucks(c: AcelaCar): [number, number] {
  if (isPower(c)) {
    const mid = ACELA_POWER_BODY / 2 + 0.6;
    return [mid - ACELA_POWER_TRUCKS / 2, mid + ACELA_POWER_TRUCKS / 2];
  }
  return [ACELA_COACH_BODY / 2 - ACELA_COACH_TRUCKS / 2, ACELA_COACH_BODY / 2 + ACELA_COACH_TRUCKS / 2];
}

function acelaSpec(c: AcelaCar): CarbodySpec {
  const base = isPower(c) ? ACELA_POWER : ACELA_COACH;
  const reach = isPower(c) ? 1.6 : 1.55;
  return { ...base, cuts: acelaTrucks(c).map((d) => [d - reach, d + reach] as const), edges: edgesOf({ bands: ACELA_BANDS } as CarbodyLivery, base.Y, base.S) };
}

/** A coach's doors (d spans) at both ends, on both sides; the doorway's sill and head. */
const ACELA_DOORS: ReadonlyArray<readonly [number, number]> = [[0.5, 1.5], [ACELA_COACH_BODY - 1.5, ACELA_COACH_BODY - 0.5]];
const ACELA_DOOR_Y: [number, number] = [1.3, 3.15];
const ACELA_WIN: [number, number] = [2.33, 2.97];
const LEAF_INSET = 0.02;

/** A coach's side windows (d spans). */
function acelaWindows(c: AcelaCar): Array<[number, number]> {
  const first = c === "firstClass";
  const n = first ? 11 : c === "cafe" ? 8 : 13;
  const pitch = first ? 1.85 : 1.6;
  const w = first ? 1.35 : 1.15;
  const mid = ACELA_COACH_BODY / 2;
  return Array.from({ length: n }, (_, i): [number, number] => {
    const d = mid + (i - (n - 1) / 2) * pitch;
    return [d - w / 2, d + w / 2];
  });
}

/** The doors' leaf boxes on both sides: the doorways into the coach's cabin (doors.ts). */
const acelaLeaves = (): SliceDoorway[] => [1, -1].flatMap((s) => ACELA_DOORS.map(([a, b]) => ({ s, d0: a + LEAF_INSET, d1: b - LEAF_INSET, y0: ACELA_DOOR_Y[0] + LEAF_INSET, y1: ACELA_DOOR_Y[1] - LEAF_INSET })));

/** A plug door: its frame round the doorway, the leaf in the body's bands with its window, sliding toward the car's middle; the step. */
function plugDoor(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, bands: ReadonlyArray<readonly [number, number, string]>, [y0, y1]: [number, number], glass: [number, number], step: string): void {
  const k = LEAF_INSET;
  m.scope("outline", () => {
    sidePanel(m, b, X, s, "rubber", d0, d0 + k, y0, y1, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d1 - k, d1, y0, y1, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.004, 0.03);
  });
  const slide = (d0 + d1) / 2 < b.length / 2 ? 1 : -1;
  const dx = X(d0 + slide * (d1 - d0)) - X(d0);
  openable(m, (mm, o) =>
    mm.moved(plugMove(o, s, dx), () => {
      mm.scope("leaf", () => {
        for (const [a, c, mat] of bands) {
          const [lo, hi] = [Math.max(a, y0 + 0.02), Math.min(c, y1 - 0.02)];
          if (hi - lo > 1e-6) sidePanel(mm, b, X, s, mat, d0 + 0.02, d1 - 0.02, lo, hi, 0.008, 0.003);
        }
      });
      mm.scope("glass", () => sidePanel(mm, b, X, s, "glass", d0 + 0.2, d1 - 0.2, glass[0], glass[1], 0.012, 0.004));
    }),
  );
  m.scope("step", () => sidePanel(m, b, X, s, step, d0, d1, y0 - 0.08, y0, 0.006, 0.2));
}

function acelaDoor(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number): void {
  plugDoor(m, b, X, s, d0, d1, ACELA_BANDS, ACELA_DOOR_Y, [2.4, 2.95], "truckBlack");
}

/** A car facing +X drawn into m with X(d) the map from d to model x. */
function drawAcelaCar(m: MeshBuilder, c: AcelaCar, X: (d: number) => number, ends: { front: boolean; rear: boolean }): void {
  const b = carbody(acelaSpec(c));
  const power = isPower(c);
  m.scope("body", () => {
    const leaves = power ? [] : acelaLeaves();
    const cut = leaves.map((o) => ({ ...o, d0: o.d0 - 0.002, d1: o.d1 + 0.002, y0: o.y0 - 0.002, y1: o.y1 + 0.002 }));
    m.scope("shell", () => carbodyShell(m, b, X, power ? acelaPowerPaint : acelaPaint, cut));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        if (power) {
          m.scope("grilles", () => { for (const [a, e] of [[7.0, 10.5], [11.2, 14.7]] as const) sideGrille(m, b, X, s, a, e, 2.4, 3.4, true); });
          m.scope("lettering", () => sideLettering(m, b, X, s, "AMTRAK", 16.0, 2.45, 0.34, "acDark"));
        } else {
          const mid = ACELA_COACH_BODY / 2;
          m.scope("windows", () => acelaWindows(c).forEach(([a, e], i) => m.scope(`window ${i + 1}`, () => sideWindow(m, b, X, s, a, e, ACELA_WIN[0], ACELA_WIN[1], "acDark", "glass"))));
          m.scope("doors", () => ACELA_DOORS.forEach(([a, e], i) => m.scope(`door ${i + 1}`, () => acelaDoor(m, b, X, s, a, e))));
          m.scope("lettering", () => sideLettering(m, b, X, s, c === "firstClass" ? "FIRST" : c === "cafe" ? "CAFE" : "BUSINESS", mid, 1.7, 0.2, "acDark", 0.012));
        }
      });
    if (!power) {
      const panes = [1, -1].flatMap((s) => acelaWindows(c).map(([a, e]) => ({ s, d0: a + 0.04, d1: e - 0.04, y0: ACELA_WIN[0] + 0.04, y1: ACELA_WIN[1] - 0.04 })));
      sliceCabin(m, b, X, 0, b.length, leaves, panes);
    }
  });
  const L = b.length;
  if (power)
    m.scope("nose", () => {
      // the black mask: one sweep of glass across the nose, wrapping over the
      // shoulders, split by the centre post; behind it a teardrop side window
      m.scope("windscreen", () => {
        for (const s of [1, -1]) {
          outlinePane(m, b, X, s, "acMask", ACELA_MASK, 0.006);
          outlinePane(m, b, X, s, "cabGlass", ACELA_SCREEN, 0.012);
          m.scope("side window", () => {
            stripDecal(m, b, X, s, "acMask", 4.42, 5.75, acelaSideLo, (d) => Math.max(acelaSideLo(d), b.S(d) - 0.08), 0.004, 14);
            stripDecal(m, b, X, s, "cabGlass", 4.56, 5.68, (d) => acelaSideLo(d) + 0.04, (d) => Math.max(acelaSideLo(d) + 0.04, b.S(d) - 0.12), 0.008, 12);
          });
        }
      });
      // the blue band under the windscreen with its four round headlights
      m.scope("headlight band", () => { for (const s of [1, -1]) outlinePane(m, b, X, s, "acBlue", ACELA_BAND, 0.004); });
      m.scope("headlights", () => {
        for (const z of [-0.66, -0.23, 0.23, 0.66]) crownLamp(m, b, X, z, 2.86 - 0.1 * Math.abs(z), 0.1, "lampHead");
      });
      m.scope("coupler", () => knuckleCoupler(m, 1, X(0) - 0.2, X(0) + 0.4, COUPLER_Y));
    });
  else
    m.scope("front end", () => {
      if (ends.front) endDiaphragm(m, 1, X(0), 1.3, 3.5);
      m.scope("coupler", () => knuckleCoupler(m, 1, X(0) - 0.3, X(0) + ACELA_GAP, COUPLER_Y));
    });
  m.scope("rear end", () => {
    if (ends.rear) endDiaphragm(m, -1, X(L), 1.3, 3.5);
    m.scope("coupler", () => knuckleCoupler(m, -1, -X(L) - 0.3, -X(L) + ACELA_GAP, COUPLER_Y));
  });
  if (power)
    m.scope("roof", () => {
      m.scope("pantograph", () => singleArm(m, { xc: X(15.5), roofY: 4.31, baseY: 4.55, h: 1, raised: true }));
      m.scope("equipment", () => { block(m, "acDark", X(12.5), X(9.0), 4.3, 4.42, -0.7, 0.7); });
    });
  m.scope("running gear", () => {
    const [t1, t2] = acelaTrucks(c);
    const spec = power ? truckSpec([-1.5, 1.5], ft(0, 20), 2.1, 0.85) : truckSpec([-1.5, 1.5], ft(0, 18), 2.0, 0.85);
    m.scope("front truck", () => truck(m, X(t1), spec));
    m.scope("rear truck", () => truck(m, X(t2), spec));
    if (!power) m.scope("underframe", () => block(m, "truckBlack", X(t2 - 2.4), X(t1 + 2.4), 0.55, 0.86, -1.2, 1.2));
  });
}

export interface AcelaSlot { car: AcelaCar; lo: number; hi: number; turned: boolean }

/** The cars of an n-car train, front first: a power car at each end (the rear one turned), first class behind the front one, the cafe in the middle of five or more. */
export function acelaTrain(n: number): AcelaSlot[] {
  const cars: AcelaCar[] = Array.from({ length: n }, (_, k) => (k === 0 || k === n - 1 ? "powerCar" : k === 1 ? "firstClass" : "businessClass"));
  if (n >= 5) cars[Math.floor(n / 2)] = "cafe";
  const total = cars.reduce((t, c) => t + acelaLength(c), 0);
  let hi = total / 2;
  return cars.map((car, i) => {
    const lo = hi - acelaLength(car);
    const out = { car, lo, hi, turned: i === n - 1 };
    hi = lo;
    return out;
  });
}

const ACELA_BELLOWS: Array<[number, number]> = [[-0.8, 1.2], [0.8, 1.2], [0.8, 3.5], [0.65, 3.65], [-0.65, 3.65], [-0.8, 3.5]];

/** The body's +X end behind the car's front coupling plane. */
const acelaFront = (c: AcelaCar) => (isPower(c) ? 0.4 : ACELA_GAP);

export function acela(params?: ParamValues): MeshBuilder {
  const p = resolveParams(ACELA_PARAMS, params);
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...ACELA_PAL });
  const unit = p.unit as AcelaUnit;
  if (unit !== "train") {
    const len = acelaLength(unit);
    drawAcelaCar(m, unit, (d) => len / 2 - acelaFront(unit) - d, { front: true, rear: true });
    return m;
  }
  const slots = acelaTrain(Number(p.cars));
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = acelaLength(slot.car);
    const X = (d: number) => cx + len / 2 - acelaFront(slot.car) - d;
    return {
      x0: slot.lo + ACELA_GAP,
      x1: slot.hi - (k === 0 ? 0 : ACELA_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => (slot.turned ? m.turned(cx, () => drawAcelaCar(m, slot.car, X, { front: false, rear: false })) : drawAcelaCar(m, slot.car, X, { front: false, rear: false }))),
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: ACELA_BELLOWS, folds: 4, depth: 0.03 }, 10, slots.slice(0, -1).map((s) => s.lo));
  return m;
}

// ---------------------------------------------------------------------------
// Amtrak Superliner: the bi-level long-distance car (1979), coach and sleeper

export type SuperlinerUnit = "coach" | "sleeper";
export const SUPERLINER_PARAMS: readonly ParamSpec[] = [enumParam("unit", "Car", { coach: "Coach", sleeper: "Sleeper" })];
export const SUPERLINER_LENGTH = ft(85);
const SL_GAP = 0.35;
const SL_BODY = SUPERLINER_LENGTH - 2 * SL_GAP;
const SL_TRUCKS = ft(59, 6);
const SL_PAL = { slSilver: paint("#c3c7cb", 0.3), slRed: paint("#c0222c"), slBlue: paint("#24407a"), slDark: paint("#2a2c2f", 0.85) };
/** Phase IV: fluted stainless steel, a red line low, two red lines over the blue band under the upper windows. */
const SL_BANDS: ReadonlyArray<readonly [number, number, string]> = [
  [0, 1.1, "slSilver"], [1.1, 1.15, "slRed"], [1.15, 2.6, "slSilver"], [2.6, 2.64, "slRed"], [2.64, 2.68, "slSilver"],
  [2.68, 2.72, "slRed"], [2.72, 2.76, "slSilver"], [2.76, 2.9, "slBlue"], [2.9, 9, "slSilver"],
];
const SL_DOOR_Y: [number, number] = [0.72, 2.75];
const SL_DOOR: [number, number] = [SL_BODY / 2 - 0.55, SL_BODY / 2 + 0.55];
const SL_UPPER: [number, number] = [3.05, 3.8];
const SL_LOWER: [number, number] = [1.4, 1.95];
const SL_SPEC: CarbodySpec = {
  length: SL_BODY, W: 1.55, Y: 1.0, S: 4.35, C: 4.9, lean: 0.97, arc: 6, B: 0.6, wl: 1.45, A: 0.7, wa: 1.53,
  cuts: [SL_BODY / 2 - SL_TRUCKS / 2, SL_BODY / 2 + SL_TRUCKS / 2].map((d) => [d - 1.6, d + 1.6] as const),
  edges: [], step: 1.0,
};

/** The windows (d spans) of each deck on a side. */
function superlinerWindows(u: SuperlinerUnit): { upper: Array<[number, number]>; lower: Array<[number, number]> } {
  const row = (from: number, to: number, n: number, w: number) =>
    Array.from({ length: n }, (_, i): [number, number] => { const d = from + ((to - from) * (i + 0.5)) / n; return [d - w / 2, d + w / 2]; });
  if (u === "coach") return { upper: row(1.2, SL_BODY - 1.2, 12, 1.55), lower: [...row(1.4, SL_DOOR[0] - 4.2, 2, 1.1), ...row(SL_DOOR[1] + 4.2, SL_BODY - 1.4, 2, 1.1)] };
  return { upper: row(1.2, SL_BODY - 1.2, 14, 1.05), lower: [...row(1.4, SL_DOOR[0] - 4.2, 3, 0.85), ...row(SL_DOOR[1] + 4.2, SL_BODY - 1.4, 3, 0.85)] };
}

const slPaint = bandPainter(SL_BANDS, "slSilver", "slDark", "slDark");

function drawSuperliner(m: MeshBuilder, u: SuperlinerUnit, X: (d: number) => number): void {
  const b = carbody({ ...SL_SPEC, edges: edgesOf({ bands: SL_BANDS } as CarbodyLivery, SL_SPEC.Y, SL_SPEC.S) });
  const leaves: SliceDoorway[] = [1, -1].map((s) => ({ s, d0: SL_DOOR[0] + LEAF_INSET, d1: SL_DOOR[1] - LEAF_INSET, y0: SL_DOOR_Y[0] + LEAF_INSET, y1: SL_DOOR_Y[1] - LEAF_INSET }));
  const cut = leaves.map((o) => ({ ...o, d0: o.d0 - 0.002, d1: o.d1 + 0.002, y0: o.y0 - 0.002, y1: o.y1 + 0.002 }));
  const win = superlinerWindows(u);
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, slPaint, cut));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("upper windows", () => win.upper.forEach(([a, e], i) => m.scope(`window ${i + 1}`, () => sideWindow(m, b, X, s, a, e, SL_UPPER[0], SL_UPPER[1], "slDark", "glass"))));
        m.scope("lower windows", () => win.lower.forEach(([a, e], i) => m.scope(`window ${i + 1}`, () => sideWindow(m, b, X, s, a, e, SL_LOWER[0], SL_LOWER[1], "slDark", "glass"))));
        m.scope("door", () => plugDoor(m, b, X, s, SL_DOOR[0], SL_DOOR[1], SL_BANDS, SL_DOOR_Y, [1.75, 2.3], "slDark"));
        // the fluting of the lower body, broken by the door
        m.scope("fluting", () => {
          for (let y = 1.2; y < 2.55; y += 0.09)
            for (const [a, e] of [[0.3, SL_DOOR[0] - 0.08], [SL_DOOR[1] + 0.08, SL_BODY - 0.3]] as const) {
              const clear = win.lower.filter(([p, q]) => q > a && p < e && y > SL_LOWER[0] - 0.06 && y < SL_LOWER[1] + 0.06);
              const spans: Array<[number, number]> = [];
              let from = a;
              for (const [p, q] of clear.sort((x, z) => x[0] - z[0])) { if (p - 0.05 > from) spans.push([from, p - 0.05]); from = q + 0.05; }
              if (e > from) spans.push([from, e]);
              for (const [p, q] of spans) stripDecal(m, b, X, s, "slDark", p, q, () => y, () => y + 0.018, 0.003, 1);
            }
        });
        m.scope("lettering", () => sideLettering(m, b, X, s, "AMTRAK", SL_DOOR[1] + 2.2, 2.25, 0.22, "slBlue", 0.012));
      });
    const panes = [1, -1].flatMap((s) => [...win.upper.map(([a, e]) => ({ s, d0: a + 0.04, d1: e - 0.04, y0: SL_UPPER[0] + 0.04, y1: SL_UPPER[1] - 0.04 })), ...win.lower.map(([a, e]) => ({ s, d0: a + 0.04, d1: e - 0.04, y0: SL_LOWER[0] + 0.04, y1: SL_LOWER[1] - 0.04 }))]);
    sliceCabin(m, b, X, 0, b.length, leaves, panes);
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const x = X(e > 0 ? 0 : b.length);
      endDiaphragm(m, e, x, 2.3, 4.3, 0.5);
      m.scope("coupler", () => knuckleCoupler(m, e, e * x - 0.3, e * x + SL_GAP, COUPLER_Y));
    });
  m.scope("running gear", () => {
    const spec = truckSpec([-ft(4, 3), ft(4, 3)], ft(0, 18), 1.9, 0.6);
    const [t1, t2] = [SL_BODY / 2 - SL_TRUCKS / 2, SL_BODY / 2 + SL_TRUCKS / 2];
    m.scope("front truck", () => truck(m, X(t1), spec));
    m.scope("rear truck", () => truck(m, X(t2), spec));
  });
}

export function amtrakSuperliner(params?: ParamValues): MeshBuilder {
  const u = resolveParams(SUPERLINER_PARAMS, params).unit as SuperlinerUnit;
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...SL_PAL });
  drawSuperliner(m, u, (d) => SUPERLINER_LENGTH / 2 - SL_GAP - d);
  return m;
}

export function amtrakSuperlinerLod(params?: ParamValues): MeshBuilder {
  const u = resolveParams(SUPERLINER_PARAMS, params).unit as SuperlinerUnit;
  const b = carbody({ ...SL_SPEC, edges: [] });
  const X = (d: number) => SUPERLINER_LENGTH / 2 - SL_GAP - d;
  const bands: LodBand[] = [...lodBandsOf({ bands: SL_BANDS } as CarbodyLivery, SL_SPEC.B, SL_SPEC.S), [SL_SPEC.S, SL_SPEC.C, "slSilver"]];
  const win = superlinerWindows(u);
  const glass = [[win.upper[0]![0], win.upper[win.upper.length - 1]![1], SL_UPPER[0], SL_UPPER[1]] as const];
  const body = carbodyLodBody(b, X, bands, "slSilver", false, false, glass);
  const parts = bogieParts([X(SL_BODY / 2 - SL_TRUCKS / 2), X(SL_BODY / 2 + SL_TRUCKS / 2)].map((x) => [x, 1.9] as const), SL_SPEC.B);
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...SL_PAL }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Distant models

/** A carbody's LOD body: its section, its noses' centre lines and the livery's bands. */
function carbodyLodBody(b: SliceBody, X: (d: number) => number, bands: readonly LodBand[], roof: string, frontNose: boolean, rearNose: boolean, glass: ReadonlyArray<readonly [number, number, number, number]>, section?: number): UnitBody {
  const top = b.C(b.length / 2);
  const mid = b.length / 2;
  const hw: Array<readonly [number, number]> = [[b.B(mid), b.wl(mid)], [b.A(mid), b.wa(mid)], [b.Y(mid), b.w(mid)], [b.S(mid), b.w(mid) * b.lean], [top, 0.45]];
  const tipAt = (rear: boolean): Array<readonly [number, number]> => {
    const ys = [b.B(mid), 1.6, 2.2, 2.8, 3.4, 4.0, top].filter((y, i, a) => i === 0 || y > a[i - 1]!);
    return ys.map((y) => [y, X(rear ? b.length - noseD(b, Math.min(y, top - 0.01), true) : noseD(b, Math.min(y, top - 0.01)))] as const);
  };
  return {
    y0: b.B(mid), hw, side: bands, roof,
    front: frontNose ? { tip: tipAt(false), setback: [[b.B(mid), 1.0], [top, 0.6]] } : { tip: [[b.B(mid), X(0)]] },
    rear: rearNose ? { tip: tipAt(true), setback: [[b.B(mid), 1.0], [top, 0.6]] } : { tip: [[b.B(mid), X(b.length)]] },
    windows: glass.map(([d0, d1, y0, y1]) => ({ u: [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))] as const, y: [y0, y1] as const, mat: LOD_GLASS })),
    ...(section !== undefined ? { section } : {}),
  };
}

const lodBandsOf = (l: CarbodyLivery, y0: number, top: number): LodBand[] => {
  const out: Array<[number, number, string]> = [];
  for (const [a, c, mt] of l.bands) {
    const lo = Math.max(a, y0), hi = Math.min(c, top);
    if (hi > lo + 1e-6) out.push([lo, hi, mt]);
  }
  return out;
};

function locoCarbodyLod(spec: CarbodySpec, l: CarbodyLivery, tip: number, trucks: number[], truckHalf: number, opts: { rearNose?: boolean; pantographs?: number[]; roofY?: number } = {}): MeshBuilder {
  const b = carbody({ ...spec, edges: [] });
  const X = (d: number) => tip - d;
  const top = spec.C;
  const body = carbodyLodBody(b, X, [...lodBandsOf(l, spec.B, spec.S), [spec.S, top, l.roof]], l.roof, true, !!opts.rearNose, []);
  const parts: LodPart[] = [
    ...bogieParts(trucks.map((x) => [x, truckHalf] as const), spec.B),
    ...(opts.pantographs ? pantographParts(opts.pantographs, opts.roofY ?? top, (opts.roofY ?? top) + 0.25) : []),
  ];
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...l.palette }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Parameters, builders and designs

const liveryParam = (l: Record<string, CarbodyLivery>): ParamSpec[] => [{
  name: "livery", title: "Livery", default: Object.keys(l)[0]!,
  values: Object.entries(l).map(([value, v]) => ({ value, title: v.title })),
}];

export const F7_PARAMS: readonly ParamSpec[] = [
  ...liveryParam(F7_LIVERIES),
  enumParam("unit", "Unit", { aUnit: "A unit (cab)", bUnit: "B unit (booster)", train: "Locomotive set" }),
  { ...enumParam("cars", "Units", { "2": "A-B", "3": "A-B-A", "4": "A-B-B-A" }), when: { name: "unit", values: ["train"] } },
];
export const P42_PARAMS = liveryParam(P42_LIVERIES);
export const ALC_PARAMS = liveryParam(ALC_LIVERIES);
export const GG1_PARAMS = liveryParam(GG1_LIVERIES);
export const F40_PARAMS = liveryParam(F40_LIVERIES);

const pick = (params: readonly ParamSpec[], l: Record<string, CarbodyLivery>, v?: ParamValues) => l[resolveParams(params, v).livery!]!;

export function emdF7(params?: ParamValues): MeshBuilder {
  const p = resolveParams(F7_PARAMS, params);
  return buildF7(F7_LIVERIES[p.livery!]!, p.unit as F7Unit | "train", Number(p.cars));
}

/** A unit's distant body and trucks: at its centre cx, turned or not, as section k of a set. */
function f7LodUnit(l: F7Livery, unit: F7Unit, cx: number, turned: boolean, section?: number): { body: UnitBody; parts: LodPart[] } {
  const spec = unit === "aUnit" ? F7_SPEC : F7B_SPEC;
  const b = carbody({ ...spec, edges: [] });
  const front = F7_UNIT_LENGTH[unit] / 2 - f7Front(unit);
  const X = (d: number) => cx + front - d;
  let body = carbodyLodBody(b, X, [...lodBandsOf(l, spec.B, spec.S), [spec.S, spec.C, l.roof]], l.roof, unit === "aUnit", false, [], section);
  if (turned) body = turnBody(body, cx);
  const trucks = [cx + F7_TRUCK, cx - F7_TRUCK].map((x) => [x, 2.0, ...(section !== undefined ? [section] : [])] as const);
  return { body, parts: bogieParts(trucks as unknown as ReadonlyArray<readonly [number, number, number?]>, spec.B) };
}

export function emdF7Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(F7_PARAMS, params);
  const l = F7_LIVERIES[p.livery!]!;
  const palette = { ...CARBODY_PALETTE, ...l.palette };
  if (p.unit !== "train") {
    const { body, parts } = f7LodUnit(l, p.unit as F7Unit, 0, false);
    return fitUnit({ palette, bodies: [body], parts }, 100);
  }
  const slots = f7Set(Number(p.cars));
  const built = slots.map((slot, k) => f7LodUnit(l, slot.unit, (slot.lo + slot.hi) / 2, slot.turned, k));
  const gapAt = (slot: F7Slot, atLo: boolean) => (slot.turned === atLo ? f7Front(slot.unit) : F7_REAR);
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, COUPLER_Y, 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({
      sections: [i, i + 1] as [number, number], front: slot.lo + gapAt(slot, true), rear: slots[i + 1]!.hi - gapAt(slots[i + 1]!, false),
      profile: [[-0.75, 1.35], [0.75, 1.35], [0.75, 3.95], [-0.75, 3.95]] as Array<[number, number]>,
    })),
    maxBendDeg: 10,
  };
  return fitUnit({ palette, bodies: built.map((x) => x.body), parts: built.flatMap((x) => x.parts), sections }, 100 * slots.length);
}

/** Published weights: the A unit 247,300 lb, the B unit 238,000 lb; both 1,500 hp. */
const F7_WEIGHT: Record<F7Unit, number> = { aUnit: 112, bUnit: 108 };
const F7_POWER_KW = 1119;

function f7Game(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const livery of Object.keys(F7_LIVERIES)) {
    const lv: ParamValues = livery === "santaFe" ? {} : { livery };
    variants.push({ params: { ...lv, unit: "bUnit" }, weight: F7_WEIGHT.bUnit });
    for (const n of F7_SET_UNITS) {
      const set = f7Set(n);
      variants.push({ params: { ...lv, unit: "train", ...(n === 2 ? {} : { cars: String(n) }) }, weight: set.reduce((t, s) => t + F7_WEIGHT[s.unit], 0), power: set.length * F7_POWER_KW });
    }
  }
  return { weight: F7_WEIGHT.aUnit, power: F7_POWER_KW, maxspeed: 121, accel: null, variants };
}

const pickP42Livery = (params?: ParamValues): P42Livery => P42_LIVERIES[resolveParams(P42_PARAMS, params).livery!]!;
export function geP42dc(params?: ParamValues): MeshBuilder { return buildP42(pickP42Livery(params)); }
/** The P42's distant model: its section with the leaning band, the raked V face, the skirt's fairing, the cab's paint and windows. */
export function geP42dcLod(params?: ParamValues): MeshBuilder {
  const l = pickP42Livery(params);
  const X = (d: number) => P42_TIP - d;
  const top = P42_CROWN;
  const cabY = p42Lerp(l.cabLine, 1.8);
  const face = Math.min(l.face[0], l.face[1]);
  const body: UnitBody = {
    y0: P42_A,
    hw: [[P42_A, P42_W], [P42_CREASE, P42_W], [P42_BAND, 1.33], [4.25, 1.13], [top, 0.75]],
    side: [...lodBandsOf(l, P42_A, P42_CREASE), [P42_CREASE, P42_BAND, l.band], [P42_BAND, top, l.cab]],
    roof: l.cab,
    front: {
      tip: [[P42_A, X(0)], [P42_KNEE, X(0)], [4.3, X((4.3 - P42_KNEE) / P42_RAKE)], [top, X(1.45)]],
      setback: [[P42_A, 0.52], [P42_KNEE, 0.52], [top, 0.25]],
      paint: [...lodBandsOf({ bands: l.faceBands ?? l.bands } as CarbodyLivery, P42_A, face), [face, top, l.cab]],
      windows: [{ u: [-1.2, -0.075], y: [3.55, 4.03], mat: LOD_GLASS }, { u: [0.075, 1.2], y: [3.55, 4.03], mat: LOD_GLASS }],
    },
    rear: { tip: [[P42_A, X(P42_BODY)]] },
    cabs: [{ x0: X(3.0), x1: X(0), side: [...lodBandsOf(l, P42_A, cabY), [cabY, top, l.cab]] }],
    windows: [{ u: [X(2.6), X(1.5)], y: [3.43, 3.88], mat: LOD_GLASS }],
  };
  const skirt = (d0: number, d1: number): LodPart => ({ draw: (m) => m.scope("body", () => lodRoofBox(m, l.skirt, X(d1), X(d0), P42_W - 0.1, P42_W, P42_B, P42_A + 0.01)) });
  const parts: LodPart[] = [
    ...bogieParts([[P42_TRUCK, 2.0], [-P42_TRUCK, 2.0]], P42_A),
    skirt(5.95, 13.55),
  ];
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...l.palette }, bodies: [body], parts }, 100);
}
export function emdF40ph(params?: ParamValues): MeshBuilder { return buildF40(pick(F40_PARAMS, F40_LIVERIES, params)); }
export function emdF40phLod(params?: ParamValues): MeshBuilder {
  return locoCarbodyLod(F40_SPEC, pick(F40_PARAMS, F40_LIVERIES, params), F40_LENGTH / 2 - F40_REACH, [F40_TRUCK, -F40_TRUCK], 2.0);
}
export function siemensAlc42(params?: ParamValues): MeshBuilder { return buildAlc42(pick(ALC_PARAMS, ALC_LIVERIES, params)); }
export function siemensAlc42Lod(params?: ParamValues): MeshBuilder {
  return locoCarbodyLod(ALC_SPEC, pick(ALC_PARAMS, ALC_LIVERIES, params), ALC_LENGTH / 2 - ALC_REACH, [ALC_TRUCK, -ALC_TRUCK], 2.15);
}
export function prrGg1(params?: ParamValues): MeshBuilder { return buildGg1(pick(GG1_PARAMS, GG1_LIVERIES, params)); }
export function prrGg1Lod(params?: ParamValues): MeshBuilder {
  const tip = GG1_LENGTH / 2 - GG1_REACH;
  return locoCarbodyLod(GG1_SPEC, pick(GG1_PARAMS, GG1_LIVERIES, params), tip, [7.3, -7.3], 3.3, {
    rearNose: true, pantographs: [tip - (GG1_BODY - GG1_CAB_FROM - 1.6), tip - (GG1_CAB_FROM + 1.6)], roofY: 4.33,
  });
}

const acelaLodCar = (c: AcelaCar, X: (d: number) => number, cx: number, turned: boolean, section?: number): { body: UnitBody; parts: LodPart[] } => {
  const spec = acelaSpec(c);
  const b = carbody({ ...spec, edges: [] });
  const bands: LodBand[] = [...lodBandsOf({ bands: ACELA_BANDS } as CarbodyLivery, spec.B, spec.S), [spec.S, spec.C, "acSilver"]];
  const glass = isPower(c) ? [] : [[2.0, ACELA_COACH_BODY - 2.0, 2.33, 2.97] as const];
  let body = carbodyLodBody(b, X, bands, "acSilver", isPower(c), false, glass, section);
  if (turned) body = turnBody(body, cx);
  const T = (x: number) => (turned ? 2 * cx - x : x);
  const parts: LodPart[] = [
    ...bogieParts(acelaTrucks(c).map((d) => [T(X(d)), 2.0, ...(section !== undefined ? [section] : [])] as const) as unknown as ReadonlyArray<readonly [number, number, number?]>, spec.B),
    ...(isPower(c) ? [{ ...roofPart("pantograph", T(X(15.5)) - 0.8, T(X(15.5)) + 0.8, 0.45, 0.45, spec.C, 5.88, section), optional: 8 }] : []),
  ];
  return { body, parts };
};

export function acelaLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(ACELA_PARAMS, params);
  const palette = { ...CARBODY_PALETTE, ...ACELA_PAL };
  const unit = p.unit as AcelaUnit;
  if (unit !== "train") {
    const len = acelaLength(unit);
    const { body, parts } = acelaLodCar(unit, (d) => len / 2 - acelaFront(unit) - d, 0, false);
    return fitUnit({ palette, bodies: [body], parts }, 100);
  }
  const slots = acelaTrain(Number(p.cars));
  const built = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = acelaLength(slot.car);
    return acelaLodCar(slot.car, (d) => cx + len / 2 - acelaFront(slot.car) - d, cx, slot.turned, k);
  });
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, COUPLER_Y, 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({
      sections: [i, i + 1] as [number, number], front: slot.lo + ACELA_GAP, rear: slots[i + 1]!.hi - ACELA_GAP,
      profile: [[-0.8, 1.2], [0.8, 1.2], [0.8, 3.65], [-0.8, 3.65]] as Array<[number, number]>,
    })),
    maxBendDeg: 10,
  };
  return fitUnit({ palette, bodies: built.map((x) => x.body), parts: built.flatMap((x) => x.parts), sections }, Math.min(500, 100 * slots.length));
}

/** Car weights (published), the power cars' 4.6 MW. */
const ACELA_WEIGHT: Record<AcelaCar, number> = { powerCar: 93, businessClass: 63, firstClass: 64, cafe: 62 };
const ACELA_POWER_KW = 4600;

function acelaGame(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const unit of ["businessClass", "firstClass", "cafe"] as const) variants.push({ params: { unit }, weight: ACELA_WEIGHT[unit], power: 0 });
  for (const n of ACELA_CARS) {
    const weight = acelaTrain(n).reduce((t, s) => t + ACELA_WEIGHT[s.car], 0);
    variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), unit: "train" }, weight, power: 2 * ACELA_POWER_KW });
  }
  return { weight: ACELA_WEIGHT.powerCar, power: ACELA_POWER_KW, maxspeed: 241, accel: null, variants };
}

export const US_CARBODIES: ProceduralDesign[] = [
  { id: "proc-vehicle-emd-f7", title: "EMD F7", build: emdF7, buildLod: emdF7Lod, params: F7_PARAMS, lodTriangles: 500, game: f7Game(), catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "emd-f7" },
  { id: "proc-vehicle-ge-p42dc", title: "GE P42DC Genesis", build: geP42dc, buildLod: geP42dcLod, params: P42_PARAMS, game: { weight: 122, power: 3169, maxspeed: 177, accel: null }, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "ge-p42dc" },
  { id: "proc-vehicle-emd-f40ph", title: "EMD F40PH", build: emdF40ph, buildLod: emdF40phLod, params: F40_PARAMS, game: { weight: 118, power: 2237, maxspeed: 166, accel: null }, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "emd-f40ph" },
  { id: "proc-vehicle-siemens-alc42", title: "Siemens ALC-42 Charger", build: siemensAlc42, buildLod: siemensAlc42Lod, params: ALC_PARAMS, game: { weight: 120, power: 3132, maxspeed: 201, accel: null }, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "siemens-alc42" },
  { id: "proc-vehicle-prr-gg1", title: "PRR GG1", build: prrGg1, buildLod: prrGg1Lod, params: GG1_PARAMS, game: { weight: 215, power: 3445, maxspeed: 161, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, loadingGauge: "us", references: "prr-gg1" },
  { id: "proc-vehicle-amtrak-superliner", title: "Amtrak Superliner", build: amtrakSuperliner, buildLod: amtrakSuperlinerLod, params: SUPERLINER_PARAMS, game: { weight: 75, power: 0, maxspeed: 161, accel: null, variants: [{ params: { unit: "sleeper" }, weight: 73 }] }, catalog: COACH_CATALOG, loadingGauge: "us", references: "amtrak-superliner" },
  { id: "proc-vehicle-amtrak-acela", title: "Acela Express", build: acela, buildLod: acelaLod, params: ACELA_PARAMS, lodTriangles: 500, game: acelaGame(), catalog: EMU_CATALOG, loadingGauge: "us", references: "amtrak-acela" },
];
