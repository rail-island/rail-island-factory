// The Renfe 277 (proc-vehicle-renfe-277): English Electric / Vulcan Foundry's Co'Co'
// 3,000 V DC electric of 1952 - 1959 ("la Inglesa", the 7701 - 7775, renumbered 277 001 -
// 075 in 1971), built for the Pajares and Branuelas ramps. A single-cab locomotive worked
// in pairs: a rounded nose ("morro") ahead of the cab at the front, a flat end for
// multiple working at the rear. Its own body (the box kit's shell is the same at both
// ends) with the kit's surface panels, three-axle bogies and diamond pantographs, measured
// on the reference photographs (assets/renfe-277/SOURCES.md; docs/models/spain-trains.md):
//
// - the published figures: 20.567 m over the buffers, 2.953 m wide, 4.28 m high (the
//   folded pantographs), 1.22 m wheels, 120 t, 2,208 kW (six EE 514/B), 110 km/h;
// - the side, by a joint 1-D projective fit over the two three-quarter photographs of
//   7766 and 7702 (the bogies' frame ends, the doors, grilles, the rear end and the nose's
//   near corner, 3.6 px rms; 13 - 43 px/m along the side, about 66 px/m in height at the
//   middle), checked by resampling both photos to model x: the nose 2.8 m from the cab
//   front to its face, the cab door over the front bogie, the bogie pivots 11.0 m apart
//   (3.7 m from the flat rear end), the machine room's grilles, plates and doors;
// - the face, on the head-on 7702 (about 107 px/m across, 2.95 m wide): the face upright
//   with corners rounded 0.5 m in plan, its top edge and the nose top's long edges
//   rounded, the big headlight on the nose top, four lamp pods, the nose door, the two
//   pairs of jumper sockets, the yellow line running round the corners into a V
//   (1.7 m at the centre, 2.5 m at the sides), "RFE" and the number either side;
// - the cab: the two windscreens on the raked cab front over the nose, the roof rounding
//   over them, the cab door with its drop light right behind the cab front;
// - the side (both alike): the number plate under the windscreen's corner, the three red
//   plates, the tall grille in the middle, the three low louvres, the machine room door
//   with its handrails, the narrow grille and the small window near the rear end, the
//   narrow louvre low on the nose; the deep skirt round the nose and the cab, the
//   valance between the bogies, the arches over them;
// - two diamond pantographs on the machine room's roof, the rear one raised;
// - `green`: Renfe's dark green with the yellow line, the red buffer beam, 7701 (as
//   277 026 and 277 047 still wore it); `blue`: the Renfe blue with the same yellow line,
//   277 015 (no photograph of a blue 277 was found: drawn as the scheme Renfe gave its
//   older electrics, see SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { bogie3, type BogieSpec } from "./boxLocoKit.ts";
import { KIT_PALETTE, buffers, c, diamond, insulator, lerpTable, rect, roundRect, surfaceDecal, surfacePanel, type Place } from "./czElectricKit.ts";
import { lettering, letteringWidth, tubeX, type Band } from "./cd163.ts";
import { block, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";
import { LOD_GLASS, fitLod, lodBogie, lodPantograph, lodSideBox, type LodPart, type LodShell } from "./lodKit.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Pt = readonly [number, number];

// --- the measures ------------------------------------------------------------------------

/** Half the length over the buffers (20.567 m). */
const HALF = 10.2835;
/** The flat rear end's face, the cab front (the nose's root), the nose's face. */
const XR = -9.7;
const CAB = 6.92;
const NF = 9.72;
const NOSE_LEN = NF - CAB;
/** The body's sides' bottom (over the bogies' arches), the nose's skirt's bottom. */
const YB = 1.3;
const SKIRT = 0.75;
/** The sides' top, the roof's crown. */
const CANT = 3.5;
const CROWN = 3.97;
/** The body's half width (2.95 m). */
const W = 1.475;
/**
 * The nose top, its face's top edge's and its long edges' radii, the face corners' radius in plan,
 * and how much narrower each side of the nose is at the face than at the cab (the bonnet tapers in
 * plan). The long edges roll over with 0.5 m, from just above the yellow line: the face's shoulders
 * round in, its top reads about 2.3 m wide over 2.8 m at the beam, as on the head-on 7702.
 */
const NT = 3.02;
const RT = 0.3;
const RS = 0.5;
const RC = 0.5;
const NOSE_TAPER = 0.08;
/** The yellow line along the sides. */
const LINE: readonly [number, number] = [2.45, 2.55];
/** The windscreens' sill and head on the raked cab front. */
const SCREEN: readonly [number, number] = [3.07, 3.69];

/** The half width: upright sides to the cant, the roof rounding to a narrow crown. */
const HW: Table = [[YB, W], [CANT, W], [3.62, W - 0.04], [3.73, W - 0.12], [3.82, W - 0.26], [3.9, W - 0.46], [3.95, W - 0.72], [CROWN, W - 0.95]];
/** The cab front's centre line (model x): upright inside the nose, raked over it, the roof rounding back. */
const TIP_F: Table = [[YB, CAB], [NT, CAB], [3.72, CAB - 0.22], [3.83, CAB - 0.34], [3.91, CAB - 0.5], [CROWN, CAB - 0.72]];
/** The flat rear end's centre line (model x): upright to the cant, the roof rounding down to it. */
const TIP_R: Table = [[YB, XR], [3.25, XR], [3.5, XR + 0.07], [3.72, XR + 0.22], [3.88, XR + 0.42], [CROWN, XR + 0.65]];
/** The cab front's corner radius: square under the nose top (the nose covers it), rounded above. */
const cabCorner = (y: number): number => (y <= NT + 1e-6 ? 0.01 : 0.55);
/** The rear end's corner radius. */
const REAR_CORNER = 0.3;
const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);

/** An end's plan at height y: [z, setback] from the centre line out to the side. */
function plan(w: number, r: number, bow: number): Array<readonly [number, number]> {
  const rr = Math.min(r, w * 0.9);
  const flat = w - rr;
  return [[0, 0], [flat * 0.5, bow * 0.25], [flat, bow], ...ANGLES.map((a) => [flat + rr * Math.sin(a), bow + (rr - bow) * (1 - Math.cos(a))] as const)];
}
const hwAt = (y: number) => lerpTable(HW, y);
const frontPlan = (y: number) => plan(hwAt(y), cabCorner(y), y > NT + 1e-6 ? 0.02 : 0);
const rearPlan = (y: number) => plan(hwAt(y), REAR_CORNER, 0);

/** The setback of a plan at |z|. */
function setback(p: ReadonlyArray<readonly [number, number]>, z: number): number {
  const az = Math.abs(z);
  for (let i = 1; i < p.length; i++) {
    const [z0, b0] = p[i - 1]!, [z1, b1] = p[i]!;
    if (az <= z1 + 1e-9) return z1 === z0 ? b1 : b0 + ((b1 - b0) * (az - z0)) / (z1 - z0);
  }
  return p[p.length - 1]![1];
}

/** The heights where the body's profiles kink. */
const KINKS = [...new Set([...HW.map(([y]) => y), ...TIP_F.map(([y]) => y), ...TIP_R.map(([y]) => y)])].sort((a, b) => a - b);

/** Places on the body: a side (+1 right), the cab front, the rear end. */
const onSide = (s: number): Place => (x, y, d) => [x, y, s * (hwAt(y) + d)];
const onCab: Place = (z, y, d) => [lerpTable(TIP_F, y) - setback(frontPlan(y), z) + d, y, z];
const onRear: Place = (z, y, d) => [lerpTable(TIP_R, y) + setback(rearPlan(y), z) - d, y, z];

// --- liveries ----------------------------------------------------------------------------

interface Es277Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  /** The body's paint from the bottom to the crown; the nose is `body` with the line laid on. */
  side: readonly Band[];
  roof: string;
  beam: string;
  number: string;
  /** The cast plate's number on the cab sides. */
  plate: string;
  /** The face's lettering: "RFE" (before 1971) or none, the number's ink. */
  rfe: boolean;
  faceInk: string;
}

const LIVERIES: Record<string, Es277Livery> = {
  green: {
    title: "Renfe green",
    palette: { body: c("#2f5a3d", 0.55), line: c("#e9b523", 0.5), roofG: c("#34483a", 0.7), red: c("#b3261e", 0.55), ink: c("#c9c2a0", 0.5), brass: { color: "#b8955a", metallic: 0.6, roughness: 0.35 } },
    side: [[YB, LINE[0], "body"], [LINE[0], LINE[1], "line"], [LINE[1], CROWN, "body"]],
    roof: "roofG",
    beam: "red",
    number: "7701",
    plate: "7701",
    rfe: true,
    faceInk: "ink",
  },
  blue: {
    title: "Renfe blue",
    palette: { body: c("#1d3f80", 0.5), line: c("#f2c31a", 0.5), roofG: c("#4e5459", 0.7), red: c("#b3261e", 0.55), ink: c("#e9e9e4", 0.5), brass: { color: "#b8955a", metallic: 0.6, roughness: 0.35 } },
    side: [[YB, LINE[0], "body"], [LINE[0], LINE[1], "line"], [LINE[1], CROWN, "body"]],
    roof: "roofG",
    beam: "red",
    number: "277-015-4",
    plate: "277-015-4",
    rfe: false,
    faceInk: "ink",
  },
};

export const ES277_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Es277Livery => LIVERIES[resolveParams(ES277_PARAMS, v).livery!]!;

const PALETTE: Record<string, MaterialSpec> = {
  ...KIT_PALETTE,
  rim: c("#9a9fa1", 0.45), slat: c("#3c4a40", 0.65), louvre: c("#1f2523", 0.85), seam: c("#1d211f", 0.8),
  bogie: c("#2b2d2c", 0.8), steel: c("#4a4d51", 0.5), spring: c("#353736", 0.7), wheel: c("#2c2d2e", 0.6), frame: c("#262827", 0.8),
  plateDark: c("#22262a", 0.5), wiper: c("#2a2c2e", 0.5),
};

const bandAt = (bands: readonly Band[], y: number): string => (bands.find(([a, b]) => y >= a - 1e-9 && y <= b + 1e-9) ?? bands[bands.length - 1]!)[2];

// --- the body ----------------------------------------------------------------------------

interface RingPt { x: number; z: number; where: "front" | "rear" | "side" }

/** The body's ring at height y: the cab front from its centre to -z, the -z side, the rear end, the +z side, back. */
function bodyRing(y: number): RingPt[] {
  const fp = frontPlan(y), rp = rearPlan(y);
  const xf = lerpTable(TIP_F, y), xr = lerpTable(TIP_R, y);
  const n = fp.length - 1;
  const out: RingPt[] = [];
  for (let i = 0; i <= n; i++) out.push({ x: xf - fp[i]![1], z: -fp[i]![0], where: i === n ? "side" : "front" });
  for (let i = n; i >= 1; i--) out.push({ x: xr + rp[i]![1], z: -rp[i]![0], where: "rear" });
  for (let i = 0; i <= n; i++) out.push({ x: xr + rp[i]![1], z: rp[i]![0], where: i === n ? "side" : "rear" });
  for (let i = n; i >= 1; i--) out.push({ x: xf - fp[i]![1], z: fp[i]![0], where: "front" });
  return out;
}

/** The body's shell between YB and the crown, painted in bands, the crown capped. */
function bodyShell(m: MeshBuilder, l: Es277Livery): void {
  const hs = [...new Set([...KINKS, ...l.side.flatMap(([a, b]) => [a, b])])].filter((h) => h >= YB - 1e-9 && h <= CROWN + 1e-9).sort((a, b) => a - b);
  const groups = new Map<string, { mat: string; tris: Array<[Vec3, Vec3, Vec3, Vec3]> }>();
  for (let k = 1; k < hs.length; k++) {
    const [ya, yb] = [hs[k - 1]!, hs[k]!];
    const lo = bodyRing(ya), hi = bodyRing(yb);
    const mat = bandAt(l.side, (ya + yb) / 2);
    for (let j = 0; j < lo.length; j++) {
      const q = (j + 1) % lo.length;
      const a: Vec3 = [lo[j]!.x, ya, lo[j]!.z], b: Vec3 = [lo[q]!.x, ya, lo[q]!.z];
      const cc: Vec3 = [hi[q]!.x, yb, hi[q]!.z], d: Vec3 = [hi[j]!.x, yb, hi[j]!.z];
      if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 1e-6 && Math.hypot(cc[0] - d[0], cc[2] - d[2]) < 1e-6) continue;
      // the outward normal in plan: the ring runs clockwise seen from above
      const e = Math.hypot(b[0] - a[0], b[2] - a[2]) > 1e-9 ? [a, b] : [d, cc];
      const nrm: Vec3 = [-(e[1]![2] - e[0]![2]), 0, e[1]![0] - e[0]![0]];
      const where = lo[j]!.where === "side" || hi[j]!.where === "side" ? (a[2] > 0 ? "side right" : "side left") : lo[j]!.where;
      const key = `${where}|${mat}`;
      if (!groups.has(key)) groups.set(key, { mat, tris: [] });
      groups.get(key)!.tris.push([a, b, cc, nrm], [a, cc, d, nrm]);
    }
  }
  for (const key of [...groups.keys()].sort())
    m.scope(key.replace("|", " "), () => {
      const g = groups.get(key)!;
      for (const [a, b, cc, n] of g.tris) m.facets(g.mat, [a, b, cc], n);
    });
  m.scope("roof", () => {
    const r = bodyRing(CROWN);
    const pts: Vec3[] = [];
    for (let i = 1; i + 1 < r.length; i++) pts.push([r[0]!.x, CROWN, r[0]!.z], [r[i]!.x, CROWN, r[i]!.z], [r[i + 1]!.x, CROWN, r[i + 1]!.z]);
    m.facets(l.roof, pts, [0, 1, 0]);
  });
}

// --- the nose ----------------------------------------------------------------------------

/** How far a round edge of radius r sets the surface back at distance d from its start. */
const inset = (r: number, d: number): number => (d >= r ? 0 : r - Math.sqrt(r * r - (r - d) * (r - d)));
/** The skirt's lower edge rising over the front bogie's leading wheels: [d behind the face, bottom]. */
const SKIRT_EDGE: Table = [[0.55, SKIRT], [0.8, 0.8], [1.05, 0.92], [1.25, 1.08], [1.45, YB]];
const skirtAt = (d: number): number => lerpTable(SKIRT_EDGE, d);
/** Where the nose's sections are taken, behind the face. */
const NOSE_D = [0, 0.012, 0.045, 0.1, 0.17, 0.25, RT, 0.38, RC, ...SKIRT_EDGE.map(([d]) => d), NOSE_LEN];
const noseW = (d: number) => W - NOSE_TAPER * (1 - d / NOSE_LEN) - inset(RC, d);
const noseTop = (d: number) => NT - inset(RT, d);

/** The nose's cross-section (z, y) at d: upright sides, the top's long edges rounded. */
function section(d: number): Ring {
  const w = noseW(d), top = noseTop(d), yb = skirtAt(d);
  const out: Array<[number, number]> = [[-w, yb], [w, yb]];
  for (let i = 0; i <= 6; i++) {
    const a = (i * Math.PI) / 12;
    out.push([w - RS + RS * Math.cos(a), top - RS + RS * Math.sin(a)]);
  }
  for (let i = 6; i >= 0; i--) {
    const a = (i * Math.PI) / 12;
    out.push([-(w - RS + RS * Math.cos(a)), top - RS + RS * Math.sin(a)]);
  }
  return out;
}

/** The nose's plan from the face's centre round the corner and back along the side: (d, |z|). */
const PERIM: ReadonlyArray<readonly [number, number]> = [[0, 0], ...NOSE_D.filter((d) => d <= RC).map((d) => [d, noseW(d)] as const), [NOSE_LEN, W]];
const PERIM_U: number[] = PERIM.reduce<number[]>((acc, p, i) => (i === 0 ? [0] : [...acc, acc[i - 1]! + Math.hypot(p[0] - PERIM[i - 1]![0], p[1] - PERIM[i - 1]![1])]), []);
const U_END = PERIM_U[PERIM_U.length - 1]!;
const segN = (i: number): [number, number] => {
  const [a, b] = [PERIM[i]!, PERIM[i + 1]!];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
};
/** A place on the nose's face and sides, side s: u along the plan from the face's centre (below the top's rounding). */
const onNose = (s: number): Place => (u, y, dd) => {
  let i = 0;
  while (i < PERIM_U.length - 2 && u > PERIM_U[i + 1]! + 1e-9) i++;
  const t = (u - PERIM_U[i]!) / (PERIM_U[i + 1]! - PERIM_U[i]!);
  const [a, b] = [PERIM[i]!, PERIM[i + 1]!];
  let n = segN(i);
  if (t < 1e-6 && i > 0) { const q = segN(i - 1); n = [(n[0] + q[0]) / 2, (n[1] + q[1]) / 2]; }
  if (t > 1 - 1e-6 && i < PERIM.length - 2) { const q = segN(i + 1); n = [(n[0] + q[0]) / 2, (n[1] + q[1]) / 2]; }
  const d = a[0] + t * (b[0] - a[0]) + n[0] * dd;
  const z = a[1] + t * (b[1] - a[1]) + n[1] * dd;
  return [NF - d, y, s * z];
};
/** The flat face: u = z. */
const onFace: Place = (z, y, d) => [NF + d, y, z];
const FACE_N: Vec3 = [1, 0, 0];

/** Clips a convex (u, v) outline to u0 <= u <= u1. */
function clipU(poly: ReadonlyArray<Pt>, u0: number, u1: number): Ring {
  let out: Array<[number, number]> = poly.map(([u, v]) => [u, v]);
  for (const [lim, keep] of [[u0, 1], [u1, -1]] as const) {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[i]!, b = src[(i + 1) % src.length]!;
      const ina = keep * (a[0] - lim) >= 0, inb = keep * (b[0] - lim) >= 0;
      if (ina) out.push(a);
      if (ina !== inb) {
        const t = (lim - a[0]) / (b[0] - a[0]);
        out.push([lim, a[1] + t * (b[1] - a[1])]);
      }
    }
  }
  return out;
}

/** A stroke along a (u, v) polyline, `t` wide, as convex quads mitred at the joints (counter-clockwise). */
function strokeQuads(pts: ReadonlyArray<Pt>, t: number): Ring[] {
  const n = pts.length;
  const normal = (a: Pt, b: Pt) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    return [-dy / len, dx / len] as const;
  };
  const off = pts.map((p, i) => {
    const n0 = i > 0 ? normal(pts[i - 1]!, p) : normal(p, pts[i + 1]!);
    const n1 = i < n - 1 ? normal(p, pts[i + 1]!) : n0;
    const mx = n0[0] + n1[0], my = n0[1] + n1[1], ml = Math.hypot(mx, my);
    const k = t / 2 / Math.max(0.35, (mx * n1[0] + my * n1[1]) / ml);
    return [[p[0] + (mx / ml) * k, p[1] + (my / ml) * k], [p[0] - (mx / ml) * k, p[1] - (my / ml) * k]] as const;
  });
  const quads: Ring[] = [];
  for (let i = 0; i + 1 < n; i++) {
    const [l0, r0] = off[i]!, [l1, r1] = off[i + 1]!;
    quads.push([[r0[0], r0[1]], [r1[0], r1[1]], [l1[0], l1[1]], [l0[0], l0[1]]]);
  }
  return quads;
}

/**
 * The yellow line's centre on the nose (u from the face's centre, y), from the head-on 7702:
 * the V's foot just under the nose door's sill (1.8 m), round the corner, level with the sides' line behind it.
 */
const NOSE_LINE: ReadonlyArray<Pt> = [[0, 1.74], [0.13, 1.83], [0.36, 1.98], [0.62, 2.12], [0.88, 2.22], [1.19, 2.3], [1.57, 2.36], [2.3, 2.43], [2.9, 2.48], [3.4, 2.5], [U_END, 2.5]];

/** Lays (u, v) outlines on the nose's side s, split at the plan's corners so each piece lies on one facet. */
function onNoseDecal(m: MeshBuilder, mat: string, s: number, polys: readonly Ring[], d: number): void {
  const at = onNose(s);
  for (const q of polys) {
    const u0 = Math.min(...q.map((p) => p[0])), u1 = Math.max(...q.map((p) => p[0]));
    const cuts = [u0, ...PERIM_U.filter((u) => u > u0 + 1e-6 && u < u1 - 1e-6), u1];
    for (let i = 1; i < cuts.length; i++) {
      const piece = clipU(q, cuts[i - 1]!, cuts[i]!);
      if (piece.length < 3) continue;
      // the piece lies on one facet of the plan: its normal there, at the piece's middle
      const um = (cuts[i - 1]! + cuts[i]!) / 2;
      const [p0, p1] = [at(um, 2, 0), at(um, 2, 1)];
      surfaceDecal(m, mat, at, [p1[0] - p0[0], 0, p1[2] - p0[2]], [piece], d);
    }
  }
}

/** A lamp pod standing out of the face: its housing, rim and lens. */
function pod(m: MeshBuilder, mat: string, z: number, y: number, r: number, len: number, lens = "lampHead", root = 0.12): void {
  const ring = ngon(12, r, 0, z, y);
  m.sweep(mat, "x", ring, NF - root, ring, NF + len);
  const rim = ngon(12, r * 0.85, 0, z, y);
  m.scope("rim", () => m.sweep("rim", "x", rim, NF + len, rim, NF + len + 0.01));
  const glass = ngon(12, r * 0.6, 0, z, y);
  m.scope("lens", () => m.sweep(lens, "x", glass, NF + len + 0.01, glass, NF + len + 0.02));
}

function nose(m: MeshBuilder, l: Es277Livery): void {
  const X = (d: number) => NF - d;
  m.scope("shell", () => {
    for (let i = 1; i < NOSE_D.length; i++) {
      const [d0, d1] = [NOSE_D[i - 1]!, NOSE_D[i]!];
      m.sweep("body", "x", section(d1), X(d1), section(d0), X(d0), false);
    }
    const f = section(0).map(([z, y]): Vec3 => [X(0), y, z]);
    const pts: Vec3[] = [];
    for (let i = 1; i + 1 < f.length; i++) pts.push(f[0]!, f[i]!, f[i + 1]!);
    m.facets("body", pts, FACE_N);
  });
  m.scope("yellow line", () => {
    for (const s of [-1, 1]) m.scope(s > 0 ? "right" : "left", () => onNoseDecal(m, "line", s, strokeQuads(NOSE_LINE, LINE[1] - LINE[0]), 0.004));
  });
  m.scope("fittings", () => {
    m.scope("headlight", () => {
      const r = 0.25, y = NT + 0.05;
      const ring = ngon(16, r, 0, 0, y);
      m.sweep("body", "x", ngon(16, r * 0.85, 0, 0, y), NF - 0.62, ring, NF - 0.38);
      m.sweep("body", "x", ring, NF - 0.38, ring, NF - 0.1);
      const rim = ngon(16, r * 0.95, 0, 0, y);
      m.scope("rim", () => m.sweep("rubber", "x", rim, NF - 0.1, rim, NF - 0.07));
      const glass = ngon(16, r * 0.78, 0, 0, y);
      m.scope("glass", () => m.sweep("glass", "x", glass, NF - 0.07, glass, NF - 0.06));
      const lens = ngon(12, r * 0.3, 0, 0, y);
      m.scope("lens", () => m.sweep("lampHead", "x", lens, NF - 0.06, lens, NF - 0.05));
    });
    for (const s of [-1, 1])
      m.scope(s > 0 ? "left" : "right", () => {
        // round pods standing out of the rounded upper corners and proud of the face, the lens at their front
        m.scope("upper lamp", () => pod(m, "body", s * 0.9, 2.84, 0.12, 0.2, "lampHead", 0.45));
        m.scope("lower lamp", () => pod(m, "body", s * 0.86, 1.75, 0.13, 0.22));
        m.scope("jumper sockets", () => {
          for (const z of [0.46, 0.62]) {
            block(m, "steel", NF - 0.02, NF + 0.1, 2.5, 2.64, s * z - 0.06, s * z + 0.06);
            m.sweep("steel", "x", ngon(8, 0.05, 0, s * z, 2.52), NF + 0.02, ngon(8, 0.05, 0, s * z, 2.52), NF + 0.13);
          }
        });
        m.scope("reflector", () => surfacePanel(m, "lampRed", onFace, FACE_N, rect(s * 0.66 - 0.06, 1.6, s * 0.66 + 0.06, 1.66), -0.004, 0.012));
      });
    m.scope("nose door", () => {
      const [z0, z1, y0, y1] = [-0.24, 0.24, 1.8, 2.64];
      for (const q of [rect(z0, y0, z1, y0 + 0.015), rect(z0, y1 - 0.015, z1, y1), rect(z0, y0 + 0.015, z0 + 0.015, y1 - 0.015), rect(z1 - 0.015, y0 + 0.015, z1, y1 - 0.015)])
        surfacePanel(m, "seam", onFace, FACE_N, q, -0.002, 0.004);
      surfacePanel(m, "steel", onFace, FACE_N, rect(0.12, 2.28, 0.16, 2.4), -0.002, 0.03);
    });
    m.scope("face lettering", () => {
      const h = 0.16, style = { weight: 0.16 };
      if (l.rfe) {
        // "R" with a small "FE" raised over a bar, on the reader's left (+z at the front, read toward -z)
        const u0 = 0.9, wr = wordWidth("R", h, style), hf = h * 0.5, wf = wordWidth("FE", hf, style);
        const tris = [...letters("R", u0, 1.86, h, true, style), ...letters("FE", u0 - wr - 0.02, 1.86 + h - hf, hf, true, style)];
        m.facets(l.faceInk, tris.map(([u, v]) => onFace(u, v, 0.006)), FACE_N);
        const [b0, b1] = [u0 - wr - 0.02 - wf, u0 - wr - 0.02];
        surfaceDecal(m, l.faceInk, onFace, FACE_N, [[[b1, 1.88], [b1, 1.895], [b0, 1.895], [b0, 1.88]]], 0.006);
      }
      // the number on the reader's right (-z at the front)
      const nh = l.number.length > 5 ? 0.11 : 0.16, w = nh * 0.45, gap = nh * 0.14;
      const width = letteringWidth(l.number, w, gap);
      const tris = lettering(l.number, -0.62 + width / 2, 1.86, nh, w, gap, true);
      m.facets(l.faceInk, tris.map(([a, b]) => onFace(a, b, 0.006)), FACE_N);
    });
  });
  m.scope("buffer beam", () => {
    // the red beam between the black buffer housings, the nose's green skirt showing under it
    block(m, l.beam, NF - 0.12, 9.82, 1.0, 1.38, -1.06, 1.06);
    m.scope("buffer housings", () => {
      for (const s of [-1, 1]) block(m, "frame", NF - 0.12, 9.83, 0.9, 1.27, s > 0 ? 1.06 : -1.4, s > 0 ? 1.4 : -1.06);
    });
    block(m, l.beam, 9.82, 9.9, 1.0, 1.16, -0.16, 0.16);
    m.scope("coupling", () => {
      m.sweep("steel", "x", ngon(8, 0.05, 0, 0, 1.08), 9.9, ngon(8, 0.05, 0, 0, 1.08), 10.12);
      block(m, "steel", 10.08, 10.16, 0.98, 1.12, -0.05, 0.05);
    });
  });
}

// --- the side's fittings ------------------------------------------------------------------

/** A framed window on place `at`. */
function framedWindow(m: MeshBuilder, at: Place, n: Vec3, x0: number, x1: number, y0: number, y1: number, r: number, frame = "rubber", vB: readonly number[] = []): void {
  m.scope("frame", () => surfacePanel(m, frame, at, n, roundRect(x0, x1, y0, y1, r), -0.01, 0.014, [], vB));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(x0 + 0.04, x1 - 0.04, y0 + 0.04, y1 - 0.04, Math.max(0.005, r - 0.02)), -0.005, 0.022, [], vB));
}

/** A louvre panel with horizontal slats. */
function louvre(m: MeshBuilder, at: Place, n: Vec3, x0: number, x1: number, y0: number, y1: number, pitch: number): void {
  m.scope("louvre", () => surfacePanel(m, "louvre", at, n, roundRect(x0, x1, y0, y1, 0.02), -0.006, 0.006));
  m.scope("slats", () => {
    const count = Math.max(1, Math.floor((y1 - y0 - 0.04) / pitch));
    const start = (y0 + y1) / 2 - ((count - 1) * pitch) / 2;
    for (let i = 0; i < count; i++) {
      const cy = start + i * pitch, h = Math.min(0.03, pitch * 0.35);
      surfacePanel(m, "slat", at, n, rect(x0 + 0.03, cy - h, x1 - 0.03, cy + h), -0.003, 0.012);
    }
  });
}

/** A door's seams, and its handrails and step when it has them. */
function door(m: MeshBuilder, s: number, x0: number, x1: number, y0: number, y1: number, rails: boolean, step = true): void {
  const at = onSide(s);
  const n: Vec3 = [0, 0, s];
  m.scope("seams", () => {
    for (const q of [rect(x0, y0, x1, y0 + 0.02), rect(x0, y1 - 0.02, x1, y1), rect(x0, y0 + 0.02, x0 + 0.02, y1 - 0.02), rect(x1 - 0.02, y0 + 0.02, x1, y1 - 0.02)])
      surfacePanel(m, "seam", at, n, q, -0.002, 0.004);
  });
  m.scope("handle", () => surfacePanel(m, "steel", at, n, rect(x1 - 0.12, 2.2, x1 - 0.08, 2.32), -0.002, 0.03));
  if (!rails) return;
  m.scope("handrails", () => {
    for (const hx of [x0 - 0.06, x1 + 0.06]) {
      const top = y0 + 1.55, z = s * (W + 0.04);
      m.prism("steel", ngon(6, 0.016, 0, hx, z), y0 + 0.1, top);
      for (const hy of [y0 + 0.1, top - 0.02]) block(m, "steel", hx - 0.014, hx + 0.014, hy, hy + 0.02, ...side(s, W - 0.01, W + 0.055));
    }
  });
  if (step) m.scope("step", () => block(m, "steel", x0 + 0.05, x1 - 0.05, 1.08, 1.12, ...side(s, W - 0.18, W - 0.02)));
  if (step) m.scope("step hangers", () => { for (const hx of [x0 + 0.05, x1 - 0.09]) block(m, "steel", hx, hx + 0.04, 1.08, YB + 0.02, ...side(s, W - 0.06, W - 0.02)); });
}

/** One side's fittings (both sides alike), from the cab to the rear end. */
function sideFittings(m: MeshBuilder, l: Es277Livery, s: number): void {
  const at = onSide(s);
  const n: Vec3 = [0, 0, s];
  m.scope("cab door", () => {
    door(m, s, 5.45, 6.2, YB + 0.04, 3.36, true);
    m.scope("drop light", () => framedWindow(m, at, n, 5.57, 6.08, 2.62, 3.22, 0.05));
  });
  m.scope("number plate", () => {
    const h = l.plate.length > 5 ? 0.08 : 0.1, w = h * 0.45, gap = h * 0.14;
    const width = letteringWidth(l.plate, w, gap);
    const u = 6.56, flip = s < 0;
    surfacePanel(m, "plateDark", at, n, rect(u - width / 2 - 0.06, 2.7, u + width / 2 + 0.06, 2.86), -0.005, 0.016);
    const tris = lettering(l.plate, flip ? u + width / 2 : u - width / 2, 2.78 - h / 2, h, w, gap, flip);
    m.facets("brass", tris.map(([a, b]) => at(a, b, 0.02)), n);
  });
  m.scope("red plates", () => {
    for (const x of [-5.15, -0.2, 4.2]) m.scope(`plate ${x}`, () => surfacePanel(m, "red", at, n, rect(x - 0.08, 2.88, x + 0.08, 3.06), -0.004, 0.012));
  });
  m.scope("tall grille", () => louvre(m, at, n, 1.9, 3.0, 2.62, 3.4, 0.07));
  m.scope("low louvres", () => {
    for (const [i, x0] of [-1.95, -0.68, 0.59].entries()) m.scope(`louvre ${i + 1}`, () => louvre(m, at, n, x0, x0 + 1.25, 1.62, 2.18, 0.08));
  });
  m.scope("machine room door", () => door(m, s, -2.85, -2.12, YB + 0.04, 3.32, true, false));
  m.scope("narrow grille", () => louvre(m, at, n, -3.95, -3.5, 2.65, 3.4, 0.07));
  m.scope("rear windows", () => {
    m.scope("rear pane", () => framedWindow(m, at, n, -7.85, -7.15, 2.8, 3.38, 0.05));
    m.scope("front pane", () => framedWindow(m, at, n, -7.05, -6.35, 2.8, 3.38, 0.05));
  });
  m.scope("nose louvre", () => louvre(m, at, n, 7.55, 7.92, 1.65, 2.3, 0.07));
}

/** The windscreens on the raked cab front, their wipers, the horns over them. */
function cabFront(m: MeshBuilder): void {
  const vB = KINKS;
  const uB = [...new Set([SCREEN[0], SCREEN[1], (SCREEN[0] + SCREEN[1]) / 2].flatMap((h) => frontPlan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);
  const n: Vec3 = [1, 0, 0];
  m.scope("windscreens", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "left" : "right", () => {
        const [z0, z1] = s > 0 ? [0.08, 1.36] : [-1.36, -0.08];
        const pane = (k: number): Ring => {
          const q = roundRect(z0 + k, z1 - k, SCREEN[0] + k, SCREEN[1] - k, Math.max(0.01, 0.12 - k));
          return q;
        };
        m.scope("frame", () => surfacePanel(m, "rubber", onCab, n, pane(0), -0.01, 0.014, uB, vB));
        m.scope("glass", () => surfacePanel(m, "glass", onCab, n, pane(0.04), -0.005, 0.022, uB, vB));
        m.scope("wiper", () => surfacePanel(m, "wiper", onCab, n, rect(s * 0.55 - 0.012, SCREEN[0] + 0.08, s * 0.55 + 0.012, SCREEN[1] - 0.12), 0.024, 0.04, uB, vB));
      });
  });
  m.scope("horns", () => {
    for (const z of [-0.35, 0.35]) {
      const x = CAB - 0.85;
      m.prism("steel", ngon(6, 0.025, 0, x, z), CROWN - 0.01, CROWN + 0.12);
      m.sweep("steel", "x", ngon(8, 0.035, 0, z, CROWN + 0.14), x - 0.18, ngon(8, 0.06, 0, z, CROWN + 0.14), x + 0.12);
    }
  });
}

/** The flat rear end: the gangway door, two lamps, the beam and buffers. */
function rearEnd(m: MeshBuilder, l: Es277Livery): void {
  const n: Vec3 = [-1, 0, 0];
  const vB = KINKS;
  m.scope("end door", () => {
    const [z0, z1, y0, y1] = [-0.3, 0.3, YB + 0.08, 3.22];
    for (const q of [rect(z0, y0, z1, y0 + 0.02), rect(z0, y1 - 0.02, z1, y1), rect(z0, y0 + 0.02, z0 + 0.02, y1 - 0.02), rect(z1 - 0.02, y0 + 0.02, z1, y1 - 0.02)])
      surfacePanel(m, "seam", onRear, n, q, -0.002, 0.004, [], vB);
    m.scope("window", () => {
      m.scope("frame", () => surfacePanel(m, "rubber", onRear, n, roundRect(-0.2, 0.2, 2.62, 3.1, 0.05), -0.01, 0.014, [], vB));
      m.scope("glass", () => surfacePanel(m, "glass", onRear, n, roundRect(-0.16, 0.16, 2.66, 3.06, 0.03), -0.005, 0.022, [], vB));
    });
    for (const z of [-0.42, 0.42]) m.scope(`grab rail ${z > 0 ? "left" : "right"}`, () => {
      m.rod("steel", [XR - 0.06, 1.6, z], [XR - 0.06, 2.9, z], 0.016, 6);
      for (const y of [1.64, 2.86]) block(m, "steel", XR - 0.07, XR + 0.01, y - 0.012, y + 0.012, z - 0.012, z + 0.012);
    });
  });
  m.scope("lamps", () => {
    for (const z of [-0.95, 0.95])
      m.scope(z > 0 ? "left" : "right", () => {
        const ring = ngon(12, 0.1, 0, z, 1.62);
        m.sweep("body", "x", ring, XR - 0.12, ring, XR + 0.05);
        const lens = ngon(12, 0.08, 0, z, 1.62);
        m.scope("lens", () => m.sweep("lampRed", "x", lens, XR - 0.132, lens, XR - 0.12));
      });
  });
  m.scope("buffer beam", () => block(m, l.beam, -9.92, XR + 0.1, 0.88, 1.38, -1.42, 1.42));
}

// --- running gear and underframe ------------------------------------------------------------

/** The bogie pivots: 2.97 m from the rear end and 9.03 m apart; the axles 2.0 m apart, 1.22 m wheels. */
const BOGIE_X = [XR + 3.71, XR + 3.71 + 11.01] as const;
const AXLES = [-2.2, 0, 2.2];
const WHEEL_R = 0.61;
const FRAME_TOP = 1.14;
const BOGIES: BogieSpec[] = BOGIE_X.map((xc) => ({ xc, axles: AXLES, wheelR: WHEEL_R, frameTop: FRAME_TOP }));

/** The valance between the bogies, the frame closing the body's bottom, the equipment under it. */
function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const r: Ring = [[CAB, -1.38], [XR + 0.05, -1.38], [XR + 0.05, 1.38], [CAB, 1.38]];
    m.prism("frame", [[CAB, 1.38], [XR + 0.05, 1.38], [XR + 0.05, -1.38], [CAB, -1.38]], 1.2, YB + 0.01, false);
    m.cap("frame", r, 1.2, false);
  });
  m.scope("valance", () => {
    const x0 = BOGIE_X[0] + 2.95, x1 = BOGIE_X[1] - 2.95;
    const q: Ring = [[x0, YB + 0.02], [x0, 1.1], [x0 + 0.22, 0.92], [x1 - 0.22, 0.92], [x1, 1.1], [x1, YB + 0.02]];
    for (const s of [-1, 1]) m.sweep("body", "z", q, s * (W - 0.07), q, s * (W - 0.004));
  });
  m.scope("equipment", () => {
    block(m, "frame", BOGIE_X[0] + 3.05, BOGIE_X[1] - 3.05, 0.62, 1.2, -1.2, 1.2);
    for (const s of [-1, 1]) {
      const r = ngon(10, 0.2, 0, s * 0.95, 0.82);
      m.sweep("steel", "x", r, BOGIE_X[0] + 3.2, r, BOGIE_X[0] + 5.2);
    }
  });
}

// --- the roof -------------------------------------------------------------------------------

/** The pantographs: the rear one raised over the machine room's middle, the front one folded behind the cab. */
const PANTO_X = [0.8, 5.3] as const;
const PANTO_BASE = CROWN + 0.32;

function roof(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    m.scope("rear pantograph", () => diamond(m, { xc: PANTO_X[0], roofY: CROWN, baseY: PANTO_BASE, raised: true }));
    m.scope("front pantograph", () => diamond(m, { xc: PANTO_X[1], roofY: CROWN, baseY: PANTO_BASE, raised: false }));
  });
  m.scope("roof line", () => {
    const y = CROWN + 0.36, z = 0.32;
    for (const x of [1.9, 3.6, -1.5]) insulator(m, x, z, CROWN - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -2.3, y, z, PANTO_X[1] - 0.55, y, z, 6);
    m.scope("breaker", () => {
      block(m, "steel", -3.2, -2.3, CROWN - 0.01, CROWN + 0.18, -0.35, 0.35);
      insulator(m, -2.75, 0, CROWN + 0.17, y - 0.02);
    });
  });
  m.scope("roof hatch", () => {
    const q: Ring = [[-8.6, -0.5], [-8.6, 0.5], [-6.6, 0.5], [-6.6, -0.5]];
    m.loft("roofG", q, CROWN - 0.01, [[-8.55, -0.45], [-8.55, 0.45], [-6.65, 0.45], [-6.65, -0.45]], CROWN + 0.06);
  });
}

/** The Renfe 277 in a livery. */
export function renfe277(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const m = new MeshBuilder({ ...PALETTE, ...l.palette });
  m.scope("body", () => {
    m.scope("shell", () => bodyShell(m, l));
    m.scope("nose", () => nose(m, l));
    m.scope("cab front", () => cabFront(m));
    m.scope("rear end", () => rearEnd(m, l));
    m.scope("underframe", () => underframe(m));
  });
  m.scope("sides", () => {
    for (const s of [-1, 1]) m.scope(s > 0 ? "right side" : "left side", () => sideFittings(m, l, s));
  });
  m.scope("lower ends", () => {
    m.scope("front buffers", () => buffers(m, 1, 9.82, HALF, 1.08, "rect"));
    m.scope("rear buffers", () => buffers(m, -1, 9.92, HALF, 1.08, "rect"));
  });
  m.scope("bogies", () => {
    for (const b of BOGIES) m.scope(b.xc > 0 ? "front bogie" : "rear bogie", () => bogie3(m, b));
  });
  m.scope("roof equipment", () => roof(m));
  return m;
}

// --- the distant model ----------------------------------------------------------------------

/** The distant model: the body and the nose as two shells, the nose's skirt, the bogies and the pantographs. */
export function renfe277Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const body: LodShell = {
    y0: YB, hw: HW,
    front: { tip: TIP_F, setback: [[YB, 0], [NT, 0], [3.1, 0.55], [CROWN, 0.55]] },
    rear: { tip: TIP_R, setback: [[YB, REAR_CORNER], [CROWN, REAR_CORNER]] },
    side: l.side, roof: l.roof,
    endWindows: [{ u: [-1.2, 1.2], y: SCREEN, mat: LOD_GLASS, ends: [1] }],
    sideWindows: [{ u: [5.57, 6.08], y: [2.62, 3.22], mat: LOD_GLASS, optional: 5 }],
  };
  const nose: LodShell = {
    y0: SKIRT, hw: [[SKIRT, W], [NT - RS, W], [NT, W - RS]],
    front: { tip: [[SKIRT, NF], [NT - RT, NF], [NT, NF - RT]], setback: [[SKIRT, RC], [NT, RC]] },
    rear: { tip: [[SKIRT, CAB], [NT, CAB]] },
    ends: [1],
    side: [[SKIRT, LINE[0], "body"], [LINE[0], LINE[1], "line"], [LINE[1], NT, "body"]],
    end: [[SKIRT, NT, "body"]],
    roof: "body",
  };
  const parts: LodPart[] = [
    { draw: (m) => m.scope("running gear", () => { for (const xc of BOGIE_X) lodBogie(m, xc, 2.2 + WHEEL_R + 0.2, YB); }) },
    { draw: (m) => m.scope("raised pantograph", () => lodPantograph(m, { x: PANTO_X[0], roofY: CROWN, baseY: PANTO_BASE, h: 1, raised: true })) },
    { optional: 20, draw: (m) => m.scope("beams", () => {
      lodSideBox(m, l.beam, [[NF, 0.88], [9.82, 0.88], [9.82, 1.38], [NF, 1.38]], -1.42, 1.42);
      lodSideBox(m, l.beam, [[-9.92, 0.88], [XR, 0.88], [XR, 1.38], [-9.92, 1.38]], -1.42, 1.42);
    }) },
    { optional: 30, draw: (m) => m.scope("valance", () => {
      const x0 = BOGIE_X[0] + 2.95, x1 = BOGIE_X[1] - 2.95;
      lodSideBox(m, "body", [[x0 + 0.22, 0.92], [x1 - 0.22, 0.92], [x1, YB], [x0, YB]], -W + 0.01, W - 0.01);
    }) },
  ];
  return fitLod({ palette: { ...PALETTE, ...l.palette }, shells: [body, nose], parts }, 100);
}
