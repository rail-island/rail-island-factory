// The Atomium, Brussels (Andre Waterkeyn, A. and J. Polak; Expo 58) for a city's main
// square (docs/models/plaza-landmarks.md), after the photos in assets/atomium/.
//
// A unit cell of an iron crystal - a body-centred cubic cell magnified 165 billion
// times - standing on one corner, so the cube's body diagonal is vertical: nine
// stainless-steel spheres 18 m across at the eight corners and the centre, joined by
// twenty tubes 3.3 m across along the twelve cube edges and the eight half-diagonals
// to the centre (the escalator and lift tubes, with their small windows and collars
// at the spheres). Every sphere is clad in triangular plates with sunken dark seams
// (the 2006 stainless cladding, its upper half mirroring the sky and its lower half
// the ground); the top sphere carries the restaurant's window band, the visited
// spheres glazed triangles in alternate sectors of two bands. Three tapering lattice
// pylons (the "bipods", with the emergency stairs inside) carry the three lower
// spheres; the lowest sphere stands on a short column over the round entrance
// pavilion with its canopy to +Z. There is no ground: the pylons' pads, the pavilion
// and its canopy stand straight on y = 0, on the game's own ground.
//
// The lowest sphere's underside is 5 m above the ground and the top sphere's crown
// 102 m, so the vertical diagonal between the lowest and top centres is 79 m and the
// cube edge 45.6 m centre to centre (the edge tubes run about 27.6 m between the
// spheres, the diagonal tubes about 21.5 m). One diagonal plane of the cell - the
// lowest, centre and top spheres with one lower and one upper sphere - is the plane
// z = 0, facing +Z.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin. Deterministic: the
// same code gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox, lodLoft } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  // polished stainless steel: the upper half mirrors the sky, the lower the ground
  steel: { color: "#d5dce4", metallic: 0.8, roughness: 0.22 },
  steelLow: { color: "#8e949a", metallic: 0.8, roughness: 0.25 },
  seam: { color: "#454b52", metallic: 0.5, roughness: 0.5 },
  tube: { color: "#bfc4c9", metallic: 0.35, roughness: 0.45 },
  collar: { color: "#8b929a", metallic: 0.6, roughness: 0.35 },
  pylon: { color: "#a7adb3", metallic: 0.3, roughness: 0.55 },
  glass: { color: "#2b3a48", metallic: 0.5, roughness: 0.15 },
  concrete: { color: "#d8d6d0", roughness: 0.9 },
};

// --- vector helpers -----------------------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const unit = (a: Vec3): Vec3 => mul(a, 1 / (len(a) || 1));
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, mul(sub(b, a), t));

/** A triangle wound so it faces along `n`. */
function triFacing(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, n: Vec3): void {
  if (dot(cross(sub(b, a), sub(c, a)), n) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** A quad wound so it faces along `n`. */
function quadFacing(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  triFacing(m, mat, a, b, c, n);
  triFacing(m, mat, a, c, d, n);
}

/** The two unit axes across the segment a -> b: `v` as close to `up` as it can be, `u` beside it. */
function frameOf(a: Vec3, b: Vec3, up: Vec3 = [0, 1, 0]): { d: Vec3; u: Vec3; v: Vec3 } {
  const d = unit(sub(b, a));
  let v = sub(up, mul(d, dot(up, d)));
  if (len(v) < 1e-6) v = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  v = unit(sub(v, mul(d, dot(v, d))));
  return { d, u: cross(d, v), v };
}

/** A straight bar from a to b, w wide and h deep across it. */
function beam(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, w: number, h: number, up: Vec3 = [0, 1, 0]): void {
  const { u, v } = frameOf(a, b, up);
  const c = (su: number, sv: number): Vec3 => add(a, add(mul(u, (su * w) / 2), mul(v, (sv * h) / 2)));
  m.slab(mat, [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], sub(b, a));
}

/** A leaning post with horizontal ends: a w x w square about `foot` (y = foot's) sheared to `head`. */
function post(m: MeshBuilder, mat: string, foot: Vec3, head: Vec3, w: number): void {
  const h = w / 2;
  const sq: Array<[number, number]> = [[-h, -h], [h, -h], [h, h], [-h, h]];
  const lo = sq.map(([x, z]): Vec3 => [foot[0] + x, foot[1], foot[2] + z]);
  const hi = sq.map(([x, z]): Vec3 => [head[0] + x, head[1], head[2] + z]);
  const mid = lerp3(foot, head, 0.5);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const n = sub(lerp3(lo[i]!, hi[j]!, 0.5), mid);
    quadFacing(m, mat, lo[i]!, lo[j]!, hi[j]!, hi[i]!, n);
  }
}

// --- the crystal cell ---------------------------------------------------------------

const R_SPHERE = 9; // 18 m spheres
const R_TUBE = 1.65; // 3.3 m tubes
const Y_LOW = 5 + R_SPHERE; // centre of the lowest sphere (its underside 5 m up)
const Y_TOP = 102 - R_SPHERE - 0.1; // centre of the top sphere (its plated crown 102 m up)
const DIAG = Y_TOP - Y_LOW; // the vertical body diagonal, 79 m
const EDGE = DIAG / Math.sqrt(3); // the cube edge, 45.6 m
const Y_MID = (Y_LOW + Y_TOP) / 2;

// The cell's axes in the model: the body diagonal (1,1,1) up, the diagonal plane
// through (0,0,0), (1,1,0), (0,0,1), (1,1,1) facing +Z.
const AX: Vec3 = mul([1, 1, -2], 1 / Math.sqrt(6));
const AY: Vec3 = mul([1, 1, 1], 1 / Math.sqrt(3));
const AZ: Vec3 = mul([1, -1, 0], 1 / Math.sqrt(2));

/** Cube corner (i, j, k) in {0,1}^3, or the centre for [0.5, 0.5, 0.5], in model coordinates. */
function cellPoint(c: Vec3): Vec3 {
  const p = mul(sub(c, [0.5, 0.5, 0.5]), EDGE);
  return [dot(p, AX), Y_MID + dot(p, AY), dot(p, AZ)];
}

const CORNERS: Vec3[] = [];
for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) CORNERS.push([i, j, k]);
const CENTRE: Vec3 = [0.5, 0.5, 0.5];
/** Sphere names by layer: 0 lowest, 1 the three lower, 2 the three upper, 3 the top. */
const layerOf = (c: Vec3): number => c[0] + c[1] + c[2];

/** The twenty tubes: the twelve cube edges, then the eight half-diagonals to the centre. */
function tubes(): Array<[Vec3, Vec3]> {
  const out: Array<[Vec3, Vec3]> = [];
  for (let a = 0; a < 8; a++) {
    for (let b = a + 1; b < 8; b++) {
      const ca = CORNERS[a]!;
      const cb = CORNERS[b]!;
      const diff = Math.abs(ca[0] - cb[0]) + Math.abs(ca[1] - cb[1]) + Math.abs(ca[2] - cb[2]);
      if (diff === 1) out.push([ca, cb]);
    }
  }
  for (const c of CORNERS) out.push([c, CENTRE]);
  return out;
}

// --- the spheres ----------------------------------------------------------------------

const LON = 16; // panels round a latitude ring
const LAT = 10; // latitude bands pole to pole
const PLATE_INSET = 0.93; // a plate's size against its panel
const PLATE_RISE = 0.1; // how far a plate stands out of the seams

interface SphereDress {
  /** Latitude bands (0 at the crown) whose plates are glazed: a window band. */
  glassBands?: number[];
  /** Latitude bands whose upward panels are glazed in every other of eight sectors: the gallery windows. */
  sectorBands?: number[];
}

/** The panel triangles of a sphere of radius r about c: [a, b, c, band, index in band]. */
function spherePanels(c: Vec3, r: number): Array<[Vec3, Vec3, Vec3, number, number]> {
  const ring = (k: number): Vec3[] => {
    const th = (Math.PI * k) / LAT;
    const off = k % 2 ? 0.5 : 0;
    return Array.from({ length: LON }, (_, i): Vec3 => {
      const ph = (2 * Math.PI * (i + off)) / LON;
      return add(c, [r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), -r * Math.sin(th) * Math.sin(ph)]);
    });
  };
  const out: Array<[Vec3, Vec3, Vec3, number, number]> = [];
  const crown = add(c, [0, r, 0]);
  const foot = add(c, [0, -r, 0]);
  const first = ring(1);
  for (let i = 0; i < LON; i++) out.push([crown, first[i]!, first[(i + 1) % LON]!, 0, i]);
  for (let k = 1; k < LAT - 1; k++) {
    const A = ring(k);
    const B = ring(k + 1);
    // ring k+1 is turned half a panel from ring k (one way or the other)
    for (let i = 0; i < LON; i++) {
      const j = (i + 1) % LON;
      if (k % 2) {
        // B[i] lies between A[i] and A[i+1]
        out.push([A[i]!, B[i]!, A[j]!, k, 2 * i]);
        out.push([B[i]!, B[j]!, A[j]!, k, 2 * i + 1]);
      } else {
        // A[i] lies between B[i] and B[i+1]
        out.push([A[i]!, B[i]!, B[j]!, k, 2 * i]);
        out.push([A[i]!, B[j]!, A[j]!, k, 2 * i + 1]);
      }
    }
  }
  const last = ring(LAT - 1);
  for (let i = 0; i < LON; i++) out.push([last[i]!, foot, last[(i + 1) % LON]!, LAT - 1, i]);
  return out;
}

/** One sphere: raised steel plates in sunken dark seams, glazed bands and windows. */
function sphere(m: MeshBuilder, c: Vec3, dress: SphereDress = {}): void {
  for (const [a, b, d, band, idx] of spherePanels(c, R_SPHERE)) {
    const g = mul(add(add(a, b), d), 1 / 3);
    const n = unit(sub(g, c));
    const lift = mul(n, PLATE_RISE);
    const plate = [a, b, d].map((p) => add(add(g, mul(sub(p, g), PLATE_INSET)), lift));
    const sectors = band === 0 || band === LAT - 1 ? LON : 2 * LON;
    const glazed = (dress.glassBands?.includes(band) ?? false) || ((dress.sectorBands?.includes(band) ?? false) && idx % 2 === 0 && Math.floor((idx * 8) / sectors) % 2 === 0);
    triFacing(m, glazed ? "glass" : g[1] > c[1] ? "steel" : "steelLow", plate[0]!, plate[1]!, plate[2]!, n);
    const base = [a, b, d];
    for (let e = 0; e < 3; e++) {
      const f = (e + 1) % 3;
      const out = sub(lerp3(base[e]!, base[f]!, 0.5), g);
      quadFacing(m, "seam", base[e]!, base[f]!, plate[f]!, plate[e]!, add(n, mul(unit(out), 1.2)));
    }
  }
}

// --- the tubes ------------------------------------------------------------------------

const TUBE_SIDES = 16;

/** A tube between the centres of two spheres, its ends buried in them, with collars and windows. */
function tube(m: MeshBuilder, ca: Vec3, cb: Vec3, windows: boolean): void {
  const { d, u, v } = frameOf(ca, cb);
  const span = len(sub(cb, ca));
  const into = Math.sqrt(R_SPHERE * R_SPHERE - 2.4 * 2.4) - 0.3; // where a collar's rim is still inside
  const at = (s: number): Vec3 => add(ca, mul(d, s));
  const ringAt = (s: number, r: number): Vec3[] =>
    Array.from({ length: TUBE_SIDES }, (_, i) => {
      const f = (2 * Math.PI * (i + 0.5)) / TUBE_SIDES;
      return add(at(s), add(mul(u, r * Math.cos(f)), mul(v, r * Math.sin(f))));
    });
  const shell = (s0: number, s1: number, r: number, mat: string, ends: boolean): void => {
    const A = ringAt(s0, r);
    const B = ringAt(s1, r);
    for (let i = 0; i < TUBE_SIDES; i++) {
      const j = (i + 1) % TUBE_SIDES;
      const out = sub(lerp3(A[i]!, A[j]!, 0.5), at(s0));
      quadFacing(m, mat, A[i]!, A[j]!, B[j]!, B[i]!, out);
    }
    if (!ends) return;
    for (const [R0, s, nd] of [[A, s0, mul(d, -1)], [B, s1, d]] as Array<[Vec3[], number, Vec3]>) {
      const inner = ringAt(s, R_TUBE - 0.02);
      for (let i = 0; i < TUBE_SIDES; i++) {
        const j = (i + 1) % TUBE_SIDES;
        quadFacing(m, mat, R0[i]!, R0[j]!, inner[j]!, inner[i]!, nd);
      }
    }
  };
  shell(into - 2, span - into + 2, R_TUBE, "tube", false);
  // a collar where the tube leaves each sphere
  shell(into, R_SPHERE + 1.2, 2.25, "collar", true);
  shell(span - R_SPHERE - 1.2, span - into, 2.25, "collar", true);
  if (!windows) return;
  // two rows of small windows, one on each flank, 3 cm proud of the tube's facets
  const s0 = R_SPHERE + 2.4;
  const s1 = span - R_SPHERE - 2.4;
  const count = Math.max(2, Math.floor((s1 - s0) / 2.6));
  const apo = R_TUBE * Math.cos(Math.PI / TUBE_SIDES) + 0.03;
  const half = R_TUBE * Math.sin(Math.PI / TUBE_SIDES) * 0.8;
  for (const face of [0, TUBE_SIDES / 2]) {
    const f = (2 * Math.PI * (face + 1)) / TUBE_SIDES; // the facet between corners face and face + 1
    const nrm = add(mul(u, Math.cos(f)), mul(v, Math.sin(f)));
    const side = cross(d, nrm);
    for (let k = 0; k < count; k++) {
      const s = s0 + ((k + 0.5) * (s1 - s0)) / count;
      const cc = add(at(s), mul(nrm, apo));
      const p = (x: number, y: number): Vec3 => add(cc, add(mul(side, x), mul(d, y)));
      m.facets("glass", [p(-half, -0.5), p(half, -0.5), p(half, 0.5), p(-half, -0.5), p(half, 0.5), p(-half, 0.5)], nrm);
    }
  }
}

// --- the pylons, column and pavilion -----------------------------------------------------

const PAV_R = 12;
const PAV_ROOF = 3.9;

/** A tapering lattice pylon (a "bipod") from the ground up into the lower sphere at c. */
function pylon(m: MeshBuilder, c: Vec3): void {
  const radial = unit([c[0], 0, c[2]]);
  const tang: Vec3 = [-radial[2], 0, radial[0]];
  const foot = add([c[0], 0, c[2]], mul(radial, 1.5));
  const yTop = c[1] - R_SPHERE + 1.6;
  const head: Vec3 = [c[0], yTop, c[2]];
  const corner = (y: number, st: number, sr: number): Vec3 => {
    const t = y / yTop;
    const ctr = lerp3(foot, head, t);
    const wt = 4.0 + (1.7 - 4.0) * t; // half width across
    const wr = 2.4 + (1.3 - 2.4) * t; // half depth along the radius
    return add(ctr, add(mul(tang, st * wt), mul(radial, sr * wr)));
  };
  const signs: Array<[number, number]> = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  m.scope("legs", () => {
    for (const [st, sr] of signs) post(m, "pylon", corner(0, st, sr), corner(yTop, st, sr), 0.6);
  });
  m.scope("bracing", () => {
    const levels = 6;
    const yAt = (k: number): number => 2.5 + ((yTop - 4.5) * k) / levels;
    for (let k = 0; k <= levels; k++) {
      const y = yAt(k);
      for (let s = 0; s < 4; s++) {
        const [a0, b0] = signs[s]!;
        const [a1, b1] = signs[(s + 1) % 4]!;
        beam(m, "pylon", corner(y, a0, b0), corner(y, a1, b1), 0.35, 0.35);
        if (k < levels) {
          const y1 = yAt(k + 1);
          const flip = (k + s) % 2 === 0;
          beam(m, "pylon", corner(flip ? y : y1, a0, b0), corner(flip ? y1 : y, a1, b1), 0.25, 0.25, [0, 0, 1]);
        }
      }
    }
  });
  m.scope("stair core", () => {
    const w = 1.3;
    post(m, "seam", add(foot, mul(radial, 0)), add(head, [0, -0.5, 0]), 2 * w);
  });
}

function base(m: MeshBuilder): void {
  m.scope("pylon pads", () => {
    for (const c of CORNERS) {
      if (layerOf(c) !== 1) continue;
      const p = cellPoint(c);
      const r = unit([p[0], 0, p[2]]);
      const ctr = add([p[0], 0, p[2]], mul(r, 1.5));
      const ang = Math.atan2(-r[2], r[0]);
      m.prism("concrete", ngon(4, 6.2, ang + Math.PI / 4, ctr[0], ctr[2]), 0, 0.35);
    }
  });
  m.scope("entrance pavilion", () => {
    m.prism("concrete", ngon(32, PAV_R - 0.3), 0, 0.45, false);
    m.prism("glass", ngon(32, PAV_R - 0.6), 0.45, PAV_ROOF - 0.05, false);
    // mullions
    for (let i = 0; i < 16; i++) {
      const a = (2 * Math.PI * (i + 0.5)) / 16;
      const r = PAV_R - 0.5;
      m.box("concrete", r * Math.cos(a), -r * Math.sin(a), 0.25, 0.25, 0.45, PAV_ROOF - 0.05, a, false);
    }
    m.loft("concrete", ngon(32, PAV_R + 1.2), PAV_ROOF - 0.05, ngon(32, PAV_R + 1.2), PAV_ROOF + 0.55);
    m.cap("concrete", ngon(32, PAV_R + 1.2), PAV_ROOF - 0.05, false);
    m.prism("collar", ngon(16, 5.5), PAV_ROOF + 0.55, PAV_ROOF + 0.85);
  });
  m.scope("entrance canopy", () => {
    const z0 = PAV_R - 0.4;
    const z1 = PAV_R + 9;
    m.box("concrete", 0, (z0 + z1) / 2, 9, z1 - z0, 3.1, 3.45);
    m.cap("concrete", [[-4.5, z1], [4.5, z1], [4.5, z0], [-4.5, z0]] as Ring, 3.1, false);
    for (const x of [-4, 4]) m.box("collar", x, z1 - 0.6, 0.3, 0.3, 0, 3.1, 0, false);
  });
  m.scope("column", () => {
    m.prism("collar", ngon(16, 2.6), PAV_ROOF + 0.85, Y_LOW - R_SPHERE + 1.5, false);
  });
}

// --- the model ------------------------------------------------------------------------------

export function atomium(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("atomium", () => {
    base(m);
    m.scope("pylons", () => {
      let n = 0;
      for (const c of CORNERS) if (layerOf(c) === 1) m.scope(`pylon ${++n}`, () => pylon(m, cellPoint(c)));
    });
    m.scope("spheres", () => {
      for (const c of [...CORNERS, CENTRE]) {
        const layer = c === CENTRE ? -1 : layerOf(c);
        const name = c === CENTRE ? "centre" : `${["lowest", "lower", "upper", "top"][layer]} ${c.join("")}`;
        const dress: SphereDress =
          layer === 3 ? { glassBands: [3] }
          : layer === 2 ? {}
          : { sectorBands: [3, 6] };
        m.scope(`sphere ${name}`, () => sphere(m, cellPoint(c), dress));
      }
    });
    m.scope("tubes", () => {
      for (const [a, b] of tubes()) {
        const windows = layerOf(a) + layerOf(b) < 5 || b === CENTRE;
        m.scope(`tube ${a.join("")}-${b === CENTRE ? "c" : b.join("")}`, () => tube(m, cellPoint(a), cellPoint(b), windows));
      }
    });
  });
  return m;
}

/** A low sphere: six meridians, a band between two rings, poles on the axis; its lower cone darker. */
function lodSphere(m: MeshBuilder, c: Vec3, r: number): void {
  const rows = [Math.PI / 3, (2 * Math.PI) / 3].map((th) => ngon(6, r * Math.sin(th), 0, c[0], c[2]));
  const ys = [c[1] + r * 0.5, c[1] - r * 0.5];
  m.spire("steel", rows[0]!, ys[0]!, c[1] + r);
  m.loft("steel", rows[1]!, ys[1]!, rows[0]!, ys[0]!, false);
  const bottom = rows[1]!;
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    m.tri("steelLow", [bottom[j]![0], ys[1]!, bottom[j]![1]], [bottom[i]![0], ys[1]!, bottom[i]![1]], [c[0], c[1] - r, c[2]]);
  }
}

export function atomiumLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  lodLoft(m, "concrete", ngon(8, PAV_R + 1.2, Math.PI / 8), 0, ngon(8, PAV_R + 1.2, Math.PI / 8), PAV_ROOF + 0.55);
  lodBox(m, "collar", 0, 0, 4.4, 4.4, PAV_ROOF + 0.55, Y_LOW - R_SPHERE + 1.5);
  for (const c of [...CORNERS, CENTRE]) lodSphere(m, cellPoint(c), R_SPHERE);
  for (const [a, b] of tubes()) {
    const pa = cellPoint(a);
    const pb = cellPoint(b);
    const { d, u, v } = frameOf(pa, pb);
    const s0 = R_SPHERE - 1.5;
    const s1 = len(sub(pb, pa)) - s0;
    const sq = (s: number): Vec3[] => [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, y]) => add(add(pa, mul(d, s)), add(mul(u, x! * 1.4), mul(v, y! * 1.4))));
    const A = sq(s0);
    const B = sq(s1);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      quadFacing(m, "tube", A[i]!, A[j]!, B[j]!, B[i]!, sub(lerp3(A[i]!, A[j]!, 0.5), add(pa, mul(d, s0))));
    }
  }
  for (const c of CORNERS) {
    if (layerOf(c) !== 1) continue;
    const p = cellPoint(c);
    const r = unit([p[0], 0, p[2]]);
    const tang: Vec3 = [-r[2], 0, r[0]];
    const foot = add([p[0], 0, p[2]], mul(r, 1.5));
    const yTop = p[1] - R_SPHERE + 1.6;
    const lo = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]): Vec3 => add(foot, add(mul(tang, a! * 4), mul(r, b! * 2.4))));
    const hi = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]): Vec3 => add([p[0], yTop, p[2]], add(mul(tang, a! * 1.7), mul(r, b! * 1.3))));
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      quadFacing(m, "pylon", lo[i]!, lo[j]!, hi[j]!, hi[i]!, sub(lerp3(lo[i]!, lo[j]!, 0.5), foot));
    }
  }
  return m;
}

export const ATOMIUM: ProceduralDesign[] = [
  { id: "bld-atomium", game: { plaza: { cities: ["city"], layouts: ["radial"], round: true } }, title: "Atomium", build: atomium, buildLod: atomiumLod, references: "atomium", catalog: PLAZA_CATALOG },
];
