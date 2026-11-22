// The Statue of Liberty, Liberty Island, New York (docs/models/plaza-landmarks.md), from
// the photos in assets/statue-of-liberty/ and Wikipedia "Statue of Liberty".
//
// The star fort of Fort Wood (1811), an eleven-pointed star of granite walls 6.6 m high
// with blunt bastion points, a coping, a sally port facing +Z and a paved terreplein,
// carries the stepped concrete foundation and Richard Morris Hunt's granite pedestal
// (27 m): the course of round discs over the foundation, the stepped base, the lower
// die with its rusticated corner piers, the string course, the loggias with four square
// Doric columns on every face, the entablature and cornice, the upper stage with its
// balcony gallery on posts, the observation parapet and the statue's plinth. On it stands
// Bartholdi's copper statue in verdigris, 46 m from the heel to the torch: the stola
// lofted in rings with deep running folds, the diagonal fold across the breast, the
// mantle over the left shoulder falling down the left side, the raised right arm in its
// wide sleeve with the torch, its balcony and gilded flame, the left arm holding the
// tablet inscribed JULY IV MDCCLXXVI (raised blocks), the head with brow, nose, eyes and
// chin, the hair and bun, the crown with its window band and seven rays, the right heel
// raised behind in mid-stride and the broken shackle and chain at the feet. 93 m overall
// from the ground to the torch's tip.
//
// The real star fort is about 100 m across; here its points are drawn on a circle of
// 76 m so that it fits a city's main square.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin; the statue faces +Z
// (her right arm and torch on -X, the tablet on +X). Deterministic: the same code gives
// the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  fort: { color: "#8c8577", roughness: 0.95 },
  coping: { color: "#b3ada0", roughness: 0.9 },
  paving: { color: "#c4c0b6", roughness: 0.95 },
  foundation: { color: "#d9d6cf", roughness: 0.9 },
  granite: { color: "#b8aa98", roughness: 0.9 },
  graniteDark: { color: "#9a8b79", roughness: 0.92 },
  shade: { color: "#3a3631", roughness: 1 },
  copper: { color: "#6fb09a", metallic: 0.3, roughness: 0.6 },
  copperDark: { color: "#4a8573", metallic: 0.3, roughness: 0.65 },
  gilt: { color: "#e0a93a", metallic: 0.8, roughness: 0.3 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const mean = (ps: readonly Vec3[]): Vec3 => mul(ps.reduce((s, p) => add(s, p), [0, 0, 0] as Vec3), 1 / ps.length);

/** A circle of n points about (cx, cz), wound like ngon. */
const circle = (n: number, r: number, cx = 0, cz = 0): Ring => ngon(n, r, Math.PI / n, cx, cz);

/** A triangle wound so it faces away from `inside`. */
function triOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const n = cross(sub(b, a), sub(c, a));
  const g = mean([a, b, c]);
  if (dot(n, sub(g, inside)) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** A closed ellipsoid of radii rx, ry, rz about c: `lon` meridians, `lat` bands, turned `rot` about +Y. */
function blob(m: MeshBuilder, mat: string, c: Vec3, rx: number, ry: number, rz: number, lon = 8, lat = 4, rot = 0): void {
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const P = (phi: number, th: number): Vec3 => {
    const x = rx * Math.sin(phi) * Math.cos(th);
    const z = rz * Math.sin(phi) * Math.sin(th);
    return [c[0] + x * cs + z * sn, c[1] + ry * Math.cos(phi), c[2] - x * sn + z * cs];
  };
  const top: Vec3 = [c[0], c[1] + ry, c[2]];
  const bot: Vec3 = [c[0], c[1] - ry, c[2]];
  for (let k = 1; k < lat; k++) {
    const p0 = (Math.PI * k) / lat, p1 = (Math.PI * (k + 1)) / lat;
    for (let i = 0; i < lon; i++) {
      const t0 = (2 * Math.PI * i) / lon, t1 = (2 * Math.PI * (i + 1)) / lon;
      if (k === 1) triOut(m, mat, top, P(p0, t0), P(p0, t1), c);
      if (k + 1 === lat) triOut(m, mat, bot, P(p0, t1), P(p0, t0), c);
      else {
        triOut(m, mat, P(p0, t0), P(p1, t0), P(p1, t1), c);
        triOut(m, mat, P(p0, t0), P(p1, t1), P(p0, t1), c);
      }
    }
  }
}

/** Closed rings of equal size skinned together, every face turned out from the rings' axis; the end rings capped unless asked not to. */
function skin(m: MeshBuilder, mat: string, rings: readonly Vec3[][], capStart = true, capEnd = true): void {
  const centres = rings.map(mean);
  const n = rings[0]!.length;
  for (let r = 0; r + 1 < rings.length; r++) {
    const A = rings[r]!, B = rings[r + 1]!;
    const inside = mul(add(centres[r]!, centres[r + 1]!), 0.5);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      triOut(m, mat, A[i]!, A[j]!, B[j]!, inside);
      triOut(m, mat, A[i]!, B[j]!, B[i]!, inside);
    }
  }
  const capOf = (ring: Vec3[], c: Vec3, toward: Vec3): void => {
    const inside = add(c, mul(sub(toward, c), 0.5));
    for (let i = 1; i + 1 < ring.length; i++) triOut(m, mat, ring[0]!, ring[i]!, ring[i + 1]!, inside);
  };
  if (capStart) capOf(rings[0]!, centres[0]!, centres[1]!);
  if (capEnd) capOf(rings[rings.length - 1]!, centres[rings.length - 1]!, centres[rings.length - 2]!);
}

/** The rings of a tube along `pts`, square to the path; `ref` is a direction the path never runs along. */
function tubeRings(pts: readonly Vec3[], r: number | readonly number[], n: number, ref: Vec3, loop = false): Vec3[][] {
  const N = pts.length;
  const rad = (i: number): number => (typeof r === "number" ? r : r[i]!);
  const at = (i: number): Vec3 => pts[(i + N) % N]!;
  const rings: Vec3[][] = [];
  for (let i = 0; i < N; i++) {
    const prev = loop || i > 0 ? at(i - 1) : at(i);
    const next = loop || i < N - 1 ? at(i + 1) : at(i);
    const t = unit(sub(next, prev));
    const u = unit(cross(t, ref));
    const v = cross(t, u);
    const ring: Vec3[] = [];
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n;
      ring.push(add(at(i), add(mul(u, rad(i) * Math.cos(a)), mul(v, rad(i) * Math.sin(a)))));
    }
    rings.push(ring);
  }
  return rings;
}

/** A round tube of radius r (or radii per point) along `pts`, closed ends. */
function pipe(m: MeshBuilder, mat: string, pts: Vec3[], r: number | number[], n: number, ref: Vec3): void {
  skin(m, mat, tubeRings(pts, r, n, ref));
}

/** A closed ring of tube through `pts` (a chain link). */
function loopTube(m: MeshBuilder, mat: string, pts: Vec3[], r: number, n: number, ref: Vec3): void {
  const rings = tubeRings(pts, r, n, ref, true);
  const N = rings.length;
  for (let i = 0; i < N; i++) {
    const A = rings[i]!, B = rings[(i + 1) % N]!;
    const mid = mul(add(pts[i]!, pts[(i + 1) % N]!), 0.5);
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      triOut(m, mat, A[k]!, A[j]!, B[j]!, mid);
      triOut(m, mat, A[k]!, B[j]!, B[k]!, mid);
    }
  }
}

/** A cone of `n` sides from a base ring of radius r about `base` (square to the axis) to `tip`. */
function cone(m: MeshBuilder, mat: string, base: Vec3, tip: Vec3, r: number, n: number, ref: Vec3): void {
  const t = unit(sub(tip, base));
  const u = unit(cross(t, ref));
  const v = cross(t, u);
  const ring: Vec3[] = [];
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    ring.push(add(base, add(mul(u, r * Math.cos(a)), mul(v, r * Math.sin(a)))));
  }
  const inside = add(base, mul(sub(tip, base), 0.2));
  for (let k = 0; k < n; k++) triOut(m, mat, ring[k]!, ring[(k + 1) % n]!, tip, inside);
  for (let k = 1; k + 1 < n; k++) triOut(m, mat, ring[0]!, ring[k]!, ring[k + 1]!, inside);
}

/**
 * A ring of `outer` with a hole of `inner` (equal length, same winding) from y0 to
 * y1: the outer walls facing out, the inner walls facing the middle, the top between.
 * Works for the non-convex star as well as for squares.
 */
function frameRing(m: MeshBuilder, mat: string, outer: Ring, inner: Ring, y0: number, y1: number, topMat = mat): void {
  m.loft(mat, outer, y0, outer, y1, false);
  const rev = [...inner].reverse();
  m.loft(mat, rev, y0, rev, y1, false);
  const n = outer.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a: Vec3 = [outer[i]![0], y1, outer[i]![1]], b: Vec3 = [outer[j]![0], y1, outer[j]![1]];
    const c: Vec3 = [inner[j]![0], y1, inner[j]![1]], d: Vec3 = [inner[i]![0], y1, inner[i]![1]];
    const below: Vec3 = [(a[0] + c[0]) / 2, y1 - 1, (a[2] + c[2]) / 2];
    triOut(m, topMat, a, b, c, below);
    triOut(m, topMat, a, c, d, below);
  }
}

/** A horizontal ledge between `outer` and `inner` at y facing up (or down). */
function ledge(m: MeshBuilder, mat: string, outer: Ring, inner: Ring, y: number, up: boolean): void {
  const n = outer.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a: Vec3 = [outer[i]![0], y, outer[i]![1]], b: Vec3 = [outer[j]![0], y, outer[j]![1]];
    const c: Vec3 = [inner[j]![0], y, inner[j]![1]], d: Vec3 = [inner[i]![0], y, inner[i]![1]];
    const away: Vec3 = [(a[0] + c[0]) / 2, y + (up ? -1 : 1), (a[2] + c[2]) / 2];
    triOut(m, mat, a, b, c, away);
    triOut(m, mat, a, c, d, away);
  }
}

/** A polygon star-shaped about the origin moved inward by d (outward for d < 0): each edge's line offset, neighbours intersected. */
function offsetRing(ring: Ring, d: number): Ring {
  const n = ring.length;
  const lines: Array<{ p: [number, number]; e: [number, number] }> = [];
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!;
    const e: [number, number] = [q[0] - p[0], q[1] - p[1]];
    const l = Math.hypot(e[0], e[1]);
    let nx = -e[1] / l, nz = e[0] / l;
    if (nx * -p[0] + nz * -p[1] < 0) [nx, nz] = [-nx, -nz];
    lines.push({ p: [p[0] + nx * d, p[1] + nz * d], e });
  }
  const out: Ring = [];
  for (let i = 0; i < n; i++) {
    const A = lines[(i + n - 1) % n]!, B = lines[i]!;
    // A.p + s A.e = B.p + t B.e
    const det = A.e[0] * -B.e[1] - A.e[1] * -B.e[0];
    const rx = B.p[0] - A.p[0], rz = B.p[1] - A.p[1];
    const s = (rx * -B.e[1] - rz * -B.e[0]) / det;
    out.push([A.p[0] + s * A.e[0], A.p[1] + s * A.e[1]]);
  }
  return out;
}

// --- Fort Wood --------------------------------------------------------------------

const FORT_POINTS = 11;
const FORT_TIP = 38.0; // the bastion points' radius
const FORT_NOTCH = 27.0; // the re-entrant corners' radius
const FORT_TIP_HALF = 3.4; // half the blunt face at every point
const FORT_TOP = 6.6; // the parapet's top
const FORT_FLOOR = 6.0; // the terreplein

/** The fort's outline: a blunt face at each point and a re-entrant corner between; a point faces +Z. */
function fortStar(r = FORT_TIP, rn = FORT_NOTCH, tipHalf = FORT_TIP_HALF): Ring {
  const ring: Ring = [];
  const step = (2 * Math.PI) / FORT_POINTS;
  const d = Math.asin(tipHalf / r);
  for (let k = 0; k < FORT_POINTS; k++) {
    const a = -Math.PI / 2 + k * step;
    for (const [aa, rr] of [[a - d, r], [a + d, r], [a + step / 2, rn]] as const) ring.push([rr * Math.cos(aa), -rr * Math.sin(aa)]);
  }
  return ring;
}

function fort(m: MeshBuilder): void {
  const P = fortStar();
  const plinth = offsetRing(P, -0.35);
  const coping = offsetRing(P, -0.2);
  const inner = offsetRing(P, 0.9);
  m.scope("walls", () => {
    m.loft("fort", plinth, 0, plinth, 0.9, false);
    ledge(m, "coping", plinth, P, 0.9, true);
    m.loft("fort", P, 0.9, P, 6.15, false);
    // the courses of the masonry: shallow grooves cut as a slightly smaller band
    const groove = offsetRing(P, 0.06);
    for (const y of [2.4, 4.0]) {
      ledge(m, "fort", P, groove, y, false);
      m.loft("graniteDark", groove, y, groove, y + 0.14, false);
      ledge(m, "fort", P, groove, y + 0.14, true);
    }
  });
  m.scope("coping", () => {
    ledge(m, "coping", coping, P, 6.15, false);
    frameRing(m, "coping", coping, inner, 6.15, FORT_TOP);
  });
  m.scope("terreplein", () => {
    const n = inner.length;
    for (let i = 0; i < n; i++) {
      const a = inner[i]!, b = inner[(i + 1) % n]!;
      triOut(m, "paving", [0, FORT_FLOOR, 0], [a[0], FORT_FLOOR, a[1]], [b[0], FORT_FLOOR, b[1]], [0, FORT_FLOOR - 1, 0]);
    }
  });
  m.scope("sally port", () => {
    // the gate in the blunt face of the front bastion
    const zf = FORT_TIP * Math.cos(Math.asin(FORT_TIP_HALF / FORT_TIP));
    m.box("coping", 0, zf + 0.25, 4.6, 0.9, 0, 4.9);
    m.box("coping", 0, zf + 0.3, 5.2, 1.1, 4.9, 5.4);
    m.box("shade", 0, zf + 0.71, 2.4, 0.1, 0, 3.4, 0, false);
    m.spire("shade", rect(2.4, 0.1, 0, zf + 0.71), 3.4, 4.3);
  });
}

// --- the foundation -------------------------------------------------------------

const FOUND_TOP = 19.8;

function foundation(m: MeshBuilder): void {
  m.scope("terraces", () => {
    m.box("foundation", 0, 0, 34.0, 34.0, FORT_FLOOR, 7.6);
    m.box("paving", 0, 0, 31.0, 31.0, 7.6, 9.6);
  });
  m.scope("steps", () => {
    // the stepped pyramid of the concrete foundation
    const n = 9;
    for (let i = 0; i < n; i++) {
      const w = 28.0 - i * 0.72;
      m.box("foundation", 0, 0, w, w, 9.6 + i * 0.85, 9.6 + (i + 1) * 0.85);
    }
  });
  m.scope("top", () => {
    m.box("paving", 0, 0, 21.4, 21.4, 9.6 + 9 * 0.85, FOUND_TOP);
  });
  m.scope("front stair", () => {
    // the broad flight up the front of the terraces
    for (let i = 0; i < 8; i++) {
      const z1 = 17.0 + (8 - i) * 0.4;
      m.box("foundation", 0, (16.8 + z1) / 2, 9.0 - i * 0.08, z1 - 16.8, FORT_FLOOR, FORT_FLOOR + (i + 1) * 0.195);
    }
  });
}

// --- the pedestal --------------------------------------------------------------

/** The pedestal's plan drawn at 0.9 of its design figures: Hunt's shaft is about 16 m across at the loggias. */
const PS = 0.9;
/** A square of side w (not scaled) about c. */
const SQ0 = (w: number, c: Vec3 = [0, 0, 0]): Ring => rect(w, w, c[0], c[2]);
const SQ = (w: number): Ring => rect(w * PS, w * PS);

/** A face frame of the square pedestal: k = 0 front (+Z), 1 right (+X), 2 back, 3 left. */
function faceFrame(k: number): { n: Vec3; u: Vec3 } {
  const a = (k * Math.PI) / 2;
  const n: Vec3 = [Math.sin(a), 0, Math.cos(a)];
  const u: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
  return { n, u };
}

/** A box on a face: centred s across and d out from the middle, w wide, t deep. */
function faceBox(m: MeshBuilder, mat: string, k: number, s: number, d: number, w: number, t: number, y0: number, y1: number, top = true): void {
  const { n, u } = faceFrame(k);
  const c = add(mul(u, s * PS), mul(n, d * PS));
  const [a, b] = k % 2 === 0 ? [w * PS, t * PS] : [t * PS, w * PS];
  m.prism(mat, rect(a, b, c[0], c[2]), y0, y1, top);
}

const Y_DISC0 = FOUND_TOP;
const Y_BASE0 = 21.6;
const Y_DIE0 = 23.7;
const Y_DIE1 = 30.0;
const Y_COL0 = 30.7;
const Y_COL1 = 37.0;
const Y_ENT1 = 38.4;
const Y_COR1 = 39.2;
const Y_GAL = 41.0;
const Y_UP1 = 44.6;
const Y_DECK = 45.3;
const Y_TOP = 46.9; // the statue's sole

function pedestal(m: MeshBuilder): void {
  m.scope("disc course", () => {
    m.prism("granite", SQ(20.4), Y_DISC0, Y_BASE0, false);
    for (let k = 0; k < 4; k++) {
      const { n, u } = faceFrame(k);
      for (let i = 0; i < 8; i++) {
        const s = -8.4 + i * 2.4;
        const c = add(add(mul(u, s * PS), mul(n, 10.2 * PS)), [0, (Y_DISC0 + Y_BASE0) / 2, 0]);
        m.rod("graniteDark", sub(c, mul(n, 0.05)), add(c, mul(n, 0.22)), 0.68, 12);
      }
    }
  });
  m.scope("stepped base", () => {
    const ws = [20.4, 19.8, 19.2];
    ws.forEach((w, i) => {
      const y0 = Y_BASE0 + i * 0.7;
      if (i > 0) ledge(m, "granite", SQ(ws[i - 1]!), SQ(w), y0, true);
      m.prism("granite", SQ(w), y0, y0 + 0.7, false);
    });
    // the small pyramids on the upper step's edge
    for (let k = 0; k < 4; k++) {
      const { n, u } = faceFrame(k);
      for (let i = 0; i < 9; i++) {
        const c = add(mul(u, (-8.0 + i * 2.0) * PS), mul(n, 9.25 * PS));
        m.spire("granite", rect(0.55, 0.55, c[0], c[2]), Y_DIE0, Y_DIE0 + 0.5);
      }
    }
  });
  m.scope("die", () => {
    ledge(m, "granite", SQ(19.2), SQ(17.0), Y_DIE0, true);
    m.prism("granite", SQ(17.0), Y_DIE0, Y_DIE1, false);
    rusticPiers(m, Y_DIE0, Y_DIE1, 17.6, 3.0);
    // the plain ashlar between the piers: a sunk panel with a sill
    for (let k = 0; k < 4; k++) faceBox(m, "graniteDark", k, 0, 8.55, 10.6, 0.2, Y_DIE0 + 1.4, Y_DIE0 + 1.8);
  });
  m.scope("string course", () => {
    m.cap("granite", SQ(18.0), Y_DIE1, false);
    m.prism("granite", SQ(18.0), Y_DIE1, Y_COL0);
  });
  m.scope("loggias", () => loggias(m));
  m.scope("entablature", () => {
    m.cap("granite", SQ(18.0), Y_COL1, false);
    m.prism("granite", SQ(18.0), Y_COL1, Y_ENT1, false);
    m.loft("granite", SQ(18.0), Y_ENT1, SQ(18.8), Y_ENT1 + 0.35, false);
    m.prism("granite", SQ(18.8), Y_ENT1 + 0.35, Y_COR1);
  });
  m.scope("upper stage", () => {
    m.prism("granite", SQ(16.4), Y_COR1, Y_UP1, false);
    for (let k = 0; k < 4; k++) {
      // corner blocks and a dark slot window in the middle of each face
      for (const s of [-1, 1]) faceBox(m, "graniteDark", k, s * 6.7, 8.1, 2.2, 0.4, Y_COR1, Y_GAL - 0.05);
      faceBox(m, "shade", k, 0, 8.18, 1.4, 0.1, Y_COR1 + 0.5, Y_GAL - 0.4, false);
    }
  });
  m.scope("balcony gallery", () => balcony(m));
  m.scope("observation parapet", () => {
    m.cap("granite", SQ(17.2), Y_UP1, false);
    m.prism("granite", SQ(17.2), Y_UP1, Y_DECK, false);
    frameRing(m, "granite", SQ(17.2), SQ(16.4), Y_DECK, Y_DECK + 0.9);
    ledge(m, "paving", SQ(16.4), SQ0(14.0), Y_DECK, true);
  });
  m.scope("plinth", () => {
    m.prism("granite", SQ0(14.0), Y_DECK, Y_DECK + 0.7, false);
    m.loft("granite", SQ0(14.0), Y_DECK + 0.7, SQ0(13.5), Y_DECK + 0.85, false);
    ledge(m, "granite", SQ0(13.5), SQ0(13.2), Y_DECK + 0.85, true);
    m.prism("copperDark", SQ0(13.2), Y_DECK + 0.85, Y_TOP);
  });
}

/** Four rusticated corner piers of the square `w` (pier `pw` wide): blocks alternately proud and sunk. */
function rusticPiers(m: MeshBuilder, y0: number, y1: number, w: number, pw: number): void {
  w *= PS;
  pw *= PS;
  const h = w / 2;
  const rows = Math.round((y1 - y0) / 0.9);
  const dy = (y1 - y0) / rows;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * (h - pw / 2), cz = sz * (h - pw / 2);
      for (let r = 0; r < rows; r++) {
        const ya = y0 + r * dy;
        const inset = r % 2 === 0 ? 0 : 0.08;
        m.box("graniteDark", cx, cz, pw - inset, pw - inset, ya, ya + dy - 0.1, 0, true);
        m.box("graniteDark", cx, cz, pw - 0.2, pw - 0.2, ya + dy - 0.1, ya + dy, 0, r + 1 < rows);
      }
    }
  }
}

function loggias(m: MeshBuilder): void {
  // the recessed back wall, the corner piers and the four square Doric columns on each face
  m.prism("shade", SQ(15.2), Y_COL0, Y_COL1, false);
  rusticPiers(m, Y_COL0, Y_COL1, 17.6, 3.0);
  for (let k = 0; k < 4; k++) {
    const { n } = faceFrame(k);
    // the sill wall between the columns, with a small window in the middle
    faceBox(m, "granite", k, 0, 8.05, 11.6, 1.7, Y_COL0, Y_COL0 + 1.0);
    faceBox(m, "shade", k, 0, 8.92, 1.0, 0.06, Y_COL0 + 0.25, Y_COL0 + 0.85, false);
    for (const s of [-4.35, -1.45, 1.45, 4.35]) {
      faceBox(m, "granite", k, s, 8.5, 1.15, 1.15, Y_COL0 + 1.0, Y_COL0 + 1.3);
      faceBox(m, "granite", k, s, 8.5, 0.85, 0.85, Y_COL0 + 1.3, Y_COL1 - 0.55, false);
      // the echinus and abacus of the capital
      const { u } = faceFrame(k);
      const c = add(mul(u, s * PS), mul(n, 8.5 * PS));
      m.loft("granite", SQ0(0.85 * PS, c), Y_COL1 - 0.55, SQ0(1.2 * PS, c), Y_COL1 - 0.3, false);
      m.prism("granite", SQ0(1.25 * PS, c), Y_COL1 - 0.3, Y_COL1, false);
    }
  }
}

function balcony(m: MeshBuilder): void {
  // a gallery slab round the upper stage, posts and a rail with openings between
  m.cap("granite", SQ(18.2), Y_GAL, false);
  m.prism("granite", SQ(18.2), Y_GAL, Y_GAL + 0.3);
  const yr0 = Y_GAL + 0.3, yr1 = Y_GAL + 1.35;
  for (let k = 0; k < 4; k++) {
    for (let i = 0; i < 8; i++) {
      const s = -8.6 + i * 2.15;
      faceBox(m, "granite", k, s, 8.75, 0.5, 0.5, yr0, yr1 - 0.25, false);
    }
  }
  frameRing(m, "granite", SQ(18.0), SQ(17.4), yr1 - 0.25, yr1);
  ledge(m, "granite", SQ(18.0), SQ(17.4), yr1 - 0.25, false);
}

// --- the statue -------------------------------------------------------------------

/** A point in the statue's frame: across (x), up from her sole (y), forward (z). */
const S = (x: number, y: number, z: number): Vec3 => [x, Y_TOP + y, z];

/** The stola's sections: height, centre x, centre z, half width, half depth, fold depth. */
const ROBE: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [0.0, 0.0, 0.2, 5.5, 4.5, 0.13],
  [0.8, 0.0, 0.2, 5.4, 4.35, 0.13],
  [2.5, 0.0, 0.2, 5.3, 4.1, 0.12],
  [5.0, 0.05, 0.15, 5.0, 3.85, 0.11],
  [8.0, 0.1, 0.1, 4.8, 3.65, 0.1],
  [11.0, 0.15, 0.05, 4.7, 3.55, 0.09],
  [14.0, 0.15, 0.0, 4.75, 3.5, 0.08],
  [16.5, 0.1, 0.0, 4.6, 3.35, 0.07],
  [18.5, 0.05, 0.0, 4.45, 3.25, 0.06],
  [20.5, 0.0, 0.05, 4.5, 3.3, 0.055],
  [22.5, 0.0, 0.1, 4.75, 3.45, 0.05],
  [24.3, 0.0, 0.1, 4.95, 3.45, 0.04],
  [25.9, 0.0, 0.05, 5.1, 3.25, 0.03],
  [26.9, 0.0, 0.0, 4.85, 2.95, 0.02],
  [27.6, 0.0, 0.0, 4.1, 2.6, 0.012],
  [28.1, 0.02, 0.02, 2.8, 2.05, 0.005],
  [28.5, 0.05, 0.05, 1.5, 1.5, 0.0],
];

const ROBE_SIDES = 112;

/**
 * How much a ring of the stola climbs per metre across (+X up): the rings run along
 * the drapery's diagonal (from under the tablet down to the right hip) between the
 * level hem and the level shoulders, so the overfolds can follow them crisply.
 */
function tilt(y: number): number {
  const ramp = (v: number, a: number, b: number): number => Math.min(1, Math.max(0, (v - a) / (b - a)));
  return 0.62 * ramp(y, 2.0, 7.5) * (1 - ramp(y, 21.5, 27.4));
}

/** The overfolds: side (1 front, -1 back), the hem's height on the middle line, how far up the fold reaches, how far it stands out. */
const SWAGS: ReadonlyArray<readonly [number, number, number, number]> = [
  // the stola's overfold falling from under the tablet to the right hip, and the folds under it
  [1, 20.8, 4.0, 0.62],
  [1, 16.6, 3.2, 0.46],
  [1, 12.8, 2.6, 0.3],
  // the mantle across the back from the left shoulder to the right hip, in three swags
  [-1, 21.8, 4.2, 0.75],
  [-1, 17.2, 3.6, 0.62],
  [-1, 12.6, 3.2, 0.5],
];

/** How far the stola stands out at ring height y (on the middle line), across x, on the front (side > 0) or back. */
function drape(x: number, y: number, side: number): number {
  let d = 0;
  for (const [sd, ys, len, amp] of SWAGS) {
    const w = Math.min(1, Math.max(0, sd * side * 1.8));
    if (w <= 0) continue;
    const u = (y - ys) / len;
    // a full roll just over the hem of the fold, thinning upward; it drops off sharply below
    const prof = u < 0 ? Math.max(0, 1 + u * len / 0.22) * 0.9 : u < 0.12 ? 0.9 + u / 0.12 * 0.1 : Math.max(0, 1 - (u - 0.12) / 0.88) ** 1.4;
    d += amp * prof * w;
  }
  // the striding right knee pressing the stola forward
  if (side > 0) d += 0.75 * Math.exp(-(((x + 1.6) / 1.3) ** 2) - (((y - 8.5) / 4.5) ** 2)) * Math.min(1, side * 1.6);
  return d;
}

function robeRing(y: number, cx: number, cz: number, a: number, b: number, f: number): Vec3[] {
  const ring: Vec3[] = [];
  const k = tilt(y);
  for (let i = 0; i < ROBE_SIDES; i++) {
    const t = (2 * Math.PI * i) / ROBE_SIDES;
    // running folds that drift round the figure as they rise, sharper ridges than troughs
    const s1 = Math.sin(9 * t + 0.11 * y);
    const s2 = Math.sin(14 * t - 0.07 * y + 1.3);
    const s3 = Math.sin(5 * t + 0.05 * y + 0.4);
    const fold = 0.55 * s1 * Math.abs(s1) + 0.3 * s2 + 0.35 * s3;
    const x = a * Math.cos(t), z = b * Math.sin(t);
    const nl = Math.hypot(Math.cos(t) / a, Math.sin(t) / b);
    const nx = Math.cos(t) / a / nl, nz = Math.sin(t) / b / nl;
    const d = f * fold * Math.min(a, b) * 1.3 + drape(cx + x, y, Math.sin(t));
    ring.push(S(cx + x + nx * d, y + k * x, cz + z + nz * d));
  }
  return ring;
}

/** The section at height y, through a Catmull-Rom spline of ROBE. */
function robeSection(y: number): readonly number[] {
  const n = ROBE.length;
  let i = 0;
  while (i + 2 < n && ROBE[i + 1]![0]! <= y) i++;
  const [p0, p1, p2, p3] = [ROBE[Math.max(0, i - 1)]!, ROBE[i]!, ROBE[i + 1]!, ROBE[Math.min(n - 1, i + 2)]!];
  const t = Math.min(1, Math.max(0, (y - p1[0]!) / (p2[0]! - p1[0]!)));
  const v = p1.map((_, j) => 0.5 * (2 * p1[j]! + (p2[j]! - p0[j]!) * t + (2 * p0[j]! - 5 * p1[j]! + 4 * p2[j]! - p3[j]!) * t * t + (3 * p1[j]! - p0[j]! - 3 * p2[j]! + p3[j]!) * t * t * t));
  v[0] = y;
  return v;
}

/** The ring heights: every 0.8 m, closer round each overfold's hem. */
function robeHeights(): number[] {
  const top = ROBE[ROBE.length - 1]![0]!;
  const ys = new Set<number>();
  for (let y = 0; y < top - 0.3; y += 0.8) ys.add(Math.round(y * 1000) / 1000);
  ys.add(top);
  for (const [, y0, len] of SWAGS) for (const dy of [-0.3, -0.1, 0.0, 0.25, len * 0.12, len * 0.45]) ys.add(Math.round((y0 + dy) * 1000) / 1000);
  return [...ys].sort((p, q) => p - q);
}

function robe(m: MeshBuilder): void {
  m.scope("stola", () => {
    const secs = robeHeights().map(robeSection);
    skin(m, "copper", secs.map(([y, cx, cz, a, b, f]) => robeRing(y!, cx!, cz!, a!, b!, f!)), false, true);
  });
  m.scope("mantle", () => {
    // the palla over the left shoulder, falling down her left side and across the back
    const rings: Vec3[][] = [];
    const st: Array<[number, number, number, number, number]> = [
      [27.2, 3.4, -0.3, 1.3, 2.2], [24.0, 4.9, -0.2, 1.3, 2.6], [20.0, 5.2, 0.1, 1.3, 2.9], [16.0, 5.25, 0.1, 1.25, 2.8], [12.0, 5.05, 0.0, 1.0, 2.4], [8.5, 4.85, -0.2, 0.75, 1.8], [6.5, 4.75, -0.3, 0.4, 1.0],
    ];
    for (const [y, cx, cz, a, b] of st) {
      const ring: Vec3[] = [];
      for (let i = 0; i < 24; i++) {
        const t = (2 * Math.PI * i) / 24;
        const k = 1 + 0.12 * Math.sin(4 * t + y * 0.3);
        ring.push(S(cx + a * k * Math.cos(t), y, cz + b * k * Math.sin(t)));
      }
      rings.push(ring);
    }
    skin(m, "copper", rings);
  });
  m.scope("feet", () => {
    // the left foot forward under the hem, the right heel raised behind in mid-stride
    blob(m, "copperDark", S(1.5, 0.35, 4.3), 0.75, 0.45, 1.15, 8, 4);
    blob(m, "copperDark", S(-2.0, 0.4, 4.3), 0.7, 0.42, 1.0, 8, 4);
    blob(m, "copper", S(-1.7, 1.2, -4.0), 0.8, 1.2, 1.1, 8, 4, 0.0);
    blob(m, "copperDark", S(-1.7, 0.35, -4.6), 0.6, 0.35, 0.7, 8, 3); // the raised heel
  });
  m.scope("shackles", () => {
    // the broken shackle and chain at her feet
    const links: Array<[number, number, number]> = [[-0.4, 5.25, 0], [0.55, 5.35, 1], [1.5, 5.3, 0], [2.4, 5.2, 1], [3.25, 5.0, 0]];
    for (const [x, z, o] of links) {
      const pts: Vec3[] = [];
      for (let j = 0; j < 8; j++) {
        const t = (2 * Math.PI * j) / 8;
        pts.push(o === 0 ? S(x + 0.55 * Math.cos(t), 0.16, z + 0.32 * Math.sin(t)) : S(x + 0.55 * Math.cos(t), 0.36 + 0.3 * Math.sin(t), z));
      }
      loopTube(m, "copperDark", pts, 0.13, 6, o === 0 ? [0, 1, 0] : [0, 0, 1]);
    }
  });
}

function head(m: MeshBuilder): void {
  const H = S(0.1, 31.6, 0.3);
  m.scope("neck", () => pipe(m, "copper", [S(0.05, 27.6, 0.0), S(0.08, 29.3, 0.25), S(0.1, 30.3, 0.35)], [1.25, 1.1, 1.05], 12, [1, 0, 0]));
  m.scope("head", () => {
    blob(m, "copper", H, 1.55, 2.4, 1.85, 16, 10);
    blob(m, "copper", add(H, [0, 0.75, 1.15]), 1.2, 0.28, 0.45, 10, 4); // the brow
    blob(m, "copper", add(H, [0, -0.05, 1.85]), 0.27, 0.65, 0.32, 6, 4); // the nose
    blob(m, "copper", add(H, [0, -1.75, 1.15]), 0.6, 0.45, 0.5, 8, 4); // the chin
    blob(m, "copper", add(H, [0, -0.95, 1.55]), 0.5, 0.14, 0.18, 8, 3); // the lips
    for (const s of [-1, 1]) {
      blob(m, "copperDark", add(H, [s * 0.55, 0.38, 1.5]), 0.3, 0.15, 0.12, 8, 3); // the eye
      blob(m, "copper", add(H, [s * 0.75, -0.55, 1.2]), 0.45, 0.55, 0.4, 8, 4); // the cheek
    }
  });
  m.scope("hair", () => {
    blob(m, "copper", add(H, [0, 0.5, -0.45]), 1.6, 1.85, 1.55, 12, 6);
    blob(m, "copper", add(H, [0, -1.3, -1.35]), 1.15, 1.35, 0.85, 10, 5); // the bun at the nape
    for (const s of [-1, 1]) pipe(m, "copper", [add(H, [s * 1.35, 0.5, 0.2]), add(H, [s * 1.6, -0.6, -0.2]), add(H, [s * 1.4, -2.0, -0.6])], [0.4, 0.45, 0.3], 7, [0, 0, 1]);
  });
  m.scope("crown", () => {
    const yc0 = H[1] + 1.05, yc1 = H[1] + 2.25, yc2 = H[1] + 2.75;
    const ring = (a: number, b: number, n = 24): Ring => {
      const r: Ring = [];
      for (let i = 0; i < n; i++) {
        const t = (2 * Math.PI * i) / n;
        r.push([H[0] + a * Math.cos(t), H[2] - 0.05 - b * Math.sin(t)]);
      }
      return r;
    };
    m.loft("copper", ring(1.62, 1.92), yc0, ring(1.9, 2.18), yc1, false);
    m.loft("copper", ring(1.9, 2.18), yc1, ring(1.15, 1.35), yc2, true);
    // the window band: dark lights let into the front of the diadem
    for (let i = -4; i <= 4; i++) {
      const t = Math.PI / 2 + i * 0.27; // about the front (+Z)
      const at = (tt: number, y: number, out: number): Vec3 => {
        const f = (y - yc0) / (yc1 - yc0);
        const a = 1.62 + 0.28 * f + out, b = 1.92 + 0.26 * f + out;
        return [H[0] + a * Math.cos(tt), y, H[2] - 0.05 + b * Math.sin(tt)];
      };
      const y0 = yc0 + 0.3, y1 = yc0 + 0.85, dt = 0.075;
      const quad = [at(t - dt, y0, 0.04), at(t + dt, y0, 0.04), at(t + dt, y1, 0.04), at(t - dt, y1, 0.04)];
      const n = unit([Math.cos(t), 0, Math.sin(t)]);
      m.slab("shade", quad, mul(n, -0.12));
    }
    // the seven rays, fanned round the front
    for (let i = -3; i <= 3; i++) {
      const phi = i * (Math.PI / 6.4);
      const el = (52 - Math.abs(i) * 11) * (Math.PI / 180);
      const dir: Vec3 = [Math.sin(phi) * Math.cos(el), Math.sin(el), Math.cos(phi) * Math.cos(el)];
      const base: Vec3 = [H[0] + 1.75 * Math.sin(phi), yc1 - 0.25, H[2] + 2.0 * Math.cos(phi)];
      cone(m, "copper", sub(base, mul(dir, 0.3)), add(base, mul(dir, 3.2)), 0.36, 5, [0, 1, 0.01]);
    }
  });
}

/** The torch's axis. */
const TORCH_X = -4.6, TORCH_Z = 0.9;

function rightArm(m: MeshBuilder): void {
  m.scope("sleeve", () => {
    pipe(m, "copper", [S(-3.8, 26.2, 0.1), S(-4.25, 29.5, 0.4), S(-4.5, 33.2, 0.7)], [1.65, 1.35, 1.05], 12, [0, 0, 1]);
    // the loose sleeve hanging from the raised arm
    blob(m, "copper", S(-4.5, 27.0, 0.3), 1.5, 2.6, 1.55, 10, 6);
    pipe(m, "copper", [S(-4.5, 33.0, 0.7), S(-4.9, 30.5, 0.2), S(-5.2, 27.8, -0.1)], [0.6, 0.55, 0.3], 8, [0, 0, 1]);
  });
  m.scope("forearm", () => {
    pipe(m, "copper", [S(-4.5, 32.6, 0.7), S(-4.55, 35.5, 0.82), S(-4.6, 38.2, 0.9)], [0.85, 0.7, 0.55], 10, [0, 0, 1]);
    blob(m, "copper", S(TORCH_X, 39.0, TORCH_Z), 0.78, 1.25, 0.78, 10, 5); // the fist round the torch
  });
}

function torch(m: MeshBuilder): void {
  const T = (y: number): Vec3 => S(TORCH_X, y, TORCH_Z);
  const c = (n: number, r: number): Ring => circle(n, r, TORCH_X, TORCH_Z);
  const yy = (y: number): number => Y_TOP + y;
  m.scope("handle", () => {
    m.prism("copper", c(12, 0.45), yy(38.0), yy(40.6), false);
    m.loft("copper", c(12, 0.45), yy(40.6), c(12, 0.62), yy(41.3), false);
    m.loft("copper", c(16, 0.62), yy(41.3), c(16, 1.05), yy(42.3), false);
  });
  m.scope("balcony", () => {
    m.prism("copperDark", c(20, 1.7), yy(42.3), yy(42.55));
    m.cap("copperDark", c(20, 1.7), yy(42.3), false);
    for (let i = 0; i < 12; i++) {
      const a = (2 * Math.PI * i) / 12;
      const p = T(42.55);
      m.rod("copperDark", [p[0] + 1.6 * Math.cos(a), p[1], p[2] + 1.6 * Math.sin(a)], [p[0] + 1.6 * Math.cos(a), p[1] + 0.75, p[2] + 1.6 * Math.sin(a)], 0.06, 4);
    }
    const rail: Vec3[] = [];
    for (let i = 0; i < 20; i++) {
      const a = (2 * Math.PI * (i + 0.5)) / 20;
      rail.push([TORCH_X + 1.62 * Math.cos(a), yy(43.3), TORCH_Z + 1.62 * Math.sin(a)]);
    }
    loopTube(m, "copperDark", rail, 0.07, 4, [0, 1, 0.001]);
  });
  m.scope("flame", () => {
    // the gilded flame, licked into tongues
    const st: Array<[number, number, number]> = [[42.55, 0.95, 0], [43.2, 1.2, 0.12], [44.0, 1.1, 0.18], [44.8, 0.8, 0.22], [45.5, 0.42, 0.25]];
    const rings = st.map(([y, r, f]) => {
      const ring: Vec3[] = [];
      for (let i = 0; i < 18; i++) {
        const t = (2 * Math.PI * i) / 18;
        const k = 1 + f * Math.sin(5 * t + y * 1.7);
        ring.push([TORCH_X + r * k * Math.cos(t), yy(y), TORCH_Z + r * k * Math.sin(t)]);
      }
      return ring;
    });
    skin(m, "gilt", rings, false, false);
    const top = rings[rings.length - 1]!;
    const tip = T(46.1);
    for (let i = 0; i < top.length; i++) triOut(m, "gilt", top[i]!, top[(i + 1) % top.length]!, tip, T(45.3));
  });
}

function leftArmAndTablet(m: MeshBuilder): void {
  m.scope("left arm", () => {
    pipe(m, "copper", [S(3.9, 26.4, 0.1), S(4.8, 23.8, -0.1), S(5.1, 21.4, -0.1)], [1.3, 1.1, 0.9], 10, [0, 0, 1]);
    pipe(m, "copper", [S(5.1, 21.4, -0.1), S(5.3, 19.6, 0.7), S(5.35, 18.3, 1.5)], [0.85, 0.72, 0.6], 10, [1, 0, 0]);
    blob(m, "copper", S(5.45, 17.8, 1.75), 0.75, 0.6, 0.9, 8, 4); // the hand under the tablet
  });
  m.scope("tablet", () => {
    const up = unit([0.2, 1, -0.22]);
    const n0: Vec3 = unit([0.5, 0, 1]);
    const n = unit(sub(n0, mul(up, dot(n0, up))));
    const w = unit(cross(up, n));
    const bottom = S(5.75, 17.4, 1.7);
    const C = add(bottom, mul(up, 3.6));
    const t = 0.61;
    const face = (a: number, b: number, d: number): Vec3 => add(add(add(C, mul(w, a)), mul(up, b)), mul(n, d));
    m.slab("copper", [face(-2.07, -3.6, t / 2), face(2.07, -3.6, t / 2), face(2.07, 3.6, t / 2), face(-2.07, 3.6, t / 2)], mul(n, -t));
    // JULY IV MDCCLXXVI in raised letters
    const lines: Array<[string, number]> = [["JULY", 1.6], ["IV", 0.4], ["MDCCLXXVI", -0.9]];
    for (const [text, b] of lines) {
      const pitch = 0.42;
      const x0 = -((text.length - 1) * pitch) / 2;
      for (let i = 0; i < text.length; i++) {
        const a = x0 + i * pitch;
        const ch = text[i]!;
        const wd = ch === "I" ? 0.1 : ch === "M" ? 0.34 : 0.26;
        m.slab("copperDark", [face(a - wd / 2, b - 0.3, t / 2 + 0.06), face(a + wd / 2, b - 0.3, t / 2 + 0.06), face(a + wd / 2, b + 0.3, t / 2 + 0.06), face(a - wd / 2, b + 0.3, t / 2 + 0.06)], mul(n, -0.12));
      }
    }
  });
}

function statue(m: MeshBuilder): void {
  m.scope("robe", () => robe(m));
  m.scope("head", () => head(m));
  m.scope("right arm", () => rightArm(m));
  m.scope("torch", () => torch(m));
  m.scope("left arm", () => leftArmAndTablet(m));
}

/** The Statue of Liberty on its pedestal and Fort Wood, 93 m to the torch's tip. */
export function statueOfLiberty(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("statue of liberty", () => {
    m.scope("fort wood", () => fort(m));
    m.scope("foundation", () => foundation(m));
    m.scope("pedestal", () => pedestal(m));
    m.scope("statue", () => statue(m));
  });
  return m;
}

/** The low level of detail: the star fort, the foundation and pedestal as blocks, the figure, the raised arm and torch as crude blocks. */
export function statueOfLibertyLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const star = fortStar(FORT_TIP, FORT_NOTCH, 0.01);
  const pts: Ring = star.filter((_, i) => i % 3 !== 1); // the sharp star: a point and a notch per bastion
  m.loft("fort", pts, 0, pts, FORT_TOP, false);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!, b = pts[(i + 1) % pts.length]!;
    triOut(m, "paving", [0, FORT_TOP, 0], [a[0], FORT_TOP, a[1]], [b[0], FORT_TOP, b[1]], [0, 0, 0]);
  }
  m.box("foundation", 0, 0, 31.0, 31.0, FORT_TOP, 9.6);
  m.loft("foundation", SQ(28.0), 9.6, SQ(22.0), FOUND_TOP - 0.6, false);
  m.box("paving", 0, 0, 21.4, 21.4, FOUND_TOP - 0.6, FOUND_TOP);
  m.box("granite", 0, 0, 20.4 * PS, 20.4 * PS, FOUND_TOP, Y_DIE0);
  m.box("graniteDark", 0, 0, 17.6 * PS, 17.6 * PS, Y_DIE0, Y_COL0);
  m.box("shade", 0, 0, 17.0 * PS, 17.0 * PS, Y_COL0, Y_COL1);
  m.box("granite", 0, 0, 18.8 * PS, 18.8 * PS, Y_COL1, Y_COR1);
  m.box("granite", 0, 0, 17.2 * PS, 17.2 * PS, Y_COR1, Y_TOP - 0.8);
  m.box("copperDark", 0, 0, 13.2, 13.2, Y_TOP - 0.8, Y_TOP);
  const oct = (r: number, rz: number, cz = 0): Ring => ngon(8, 1, Math.PI / 8).map(([x, z]) => [x * r, z * rz + cz]);
  m.loft("copper", oct(5.4, 4.4, 0.2), Y_TOP, oct(4.4, 3.3), Y_TOP + 16.0, false);
  m.loft("copper", oct(4.4, 3.3), Y_TOP + 16.0, oct(4.8, 3.2), Y_TOP + 26.0, false);
  m.loft("copper", oct(4.8, 3.2), Y_TOP + 26.0, oct(1.4, 1.4), Y_TOP + 28.3, true);
  m.box("copper", 0.1, 0.3, 2.8, 3.4, Y_TOP + 28.3, Y_TOP + 34.0);
  m.box("copper", 0.1, 0.3, 4.6, 1.2, Y_TOP + 33.6, Y_TOP + 35.8);
  m.box("copper", TORCH_X, TORCH_Z, 1.5, 1.5, Y_TOP + 26.0, Y_TOP + 41.5);
  m.box("copperDark", TORCH_X, TORCH_Z, 3.2, 3.2, Y_TOP + 41.5, Y_TOP + 42.6);
  m.box("gilt", TORCH_X, TORCH_Z, 1.8, 1.8, Y_TOP + 42.6, Y_TOP + 45.6);
  m.box("copper", 6.0, 1.4, 1.2, 4.2, Y_TOP + 17.4, Y_TOP + 24.6, -0.45);
  return m;
}

export const STATUE_OF_LIBERTY: ProceduralDesign[] = [
  { id: "bld-statue-of-liberty", game: { plaza: { cities: ["city"], layouts: ["radial"], round: true } }, title: "Statue of Liberty", build: statueOfLiberty, buildLod: statueOfLibertyLod, references: "statue-of-liberty", catalog: PLAZA_CATALOG },
];
