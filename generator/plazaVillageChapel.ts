// A Central European village chapel with a bell turret for a village square
// (docs/models/plaza-landmarks.md): the small baroque "kaple" / "Dorfkapelle" of
// Czech, Austrian and Bavarian village greens, a generic composite after the photos
// in assets/village-chapel/ - not a copy of any one chapel.
//
// A rendered (ochre) nave 6.4 m wide and 7 m long on a grey stone plinth, with a
// rounded (half-dodecagonal) apse at the back (-Z). White lesenes frame the corners
// and the bays, a moulded cornice runs round the eaves. The entrance front (+Z)
// has a round-arched door with a dark panelled oak leaf in a stone surround, a two-
// step porch flanked by two benches, a niche with a statue of a saint above the
// door and a baroque curved (volute) gable screen with an oculus, a pediment and
// scrolls. Two round-arched
// windows with stone surrounds light each side, two more the apse. A steep red tile
// roof with a conical apse roof; on the front of the ridge stands a square sanctus
// turret: a rendered shaft, an open belfry with arched and louvred sound openings
// and a little bronze bell inside, a copper onion helmet and a gilt cross about
// 14.2 m above the ground. About 7.2 m across the eaves and 10.9 m from the apse
// roof to the porch step.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin in X; the entrance
// gable faces +Z. Deterministic: the same code gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  render: { color: "#e3c27a", roughness: 0.95 },
  trim: { color: "#f3eee2", roughness: 0.9 },
  shade: { color: "#b99a5a", roughness: 0.95 },
  plinth: { color: "#9d9a92", roughness: 0.95 },
  stone: { color: "#d8cdb4", roughness: 0.9 },
  roof: { color: "#94452f", roughness: 0.85 },
  copper: { color: "#5f9784", metallic: 0.35, roughness: 0.55 },
  wood: { color: "#4a3020", roughness: 0.85 },
  glass: { color: "#2b3440", metallic: 0.2, roughness: 0.3 },
  bronze: { color: "#8a6a32", metallic: 0.7, roughness: 0.4 },
  gilt: { color: "#d4a53e", metallic: 0.7, roughness: 0.35 },
};

// --- dimensions -----------------------------------------------------------------------

const HW = 3.2; // the nave's half width
const Z_BACK = -3.0; // the nave's back gable wall
const Z_FRONT = 4.0; // the entrance front
const EAVE = 5.9; // the wall head at the sides
const SLOPE = 1.25; // the roof pitch (rise per run), about 51 degrees
const RIDGE = EAVE + HW * SLOPE; // the body's ridge line, 9.9
const ROOF_T = 0.22; // the roof's thickness (vertical)
const ROOF_X = 3.6; // the eaves' half width
const APSE_R = 2.6; // the apse wall's radius about (0, Z_BACK)
const APSE_N = 6; // its facets
const TURRET_Z = 2.45; // the bell turret's centre

/** The roof's top surface height at x. */
const roofTop = (x: number): number => RIDGE + 0.03 + ROOF_T - SLOPE * Math.abs(x);

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

/** A circle of n points about (cx, cz), wound like ngon. */
const circle = (n: number, r: number, cx = 0, cz = 0): Ring => ngon(n, r, Math.PI / n, cx, cz);

/** A triangle wound so it faces along `n`. */
function triN(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, n: Vec3): void {
  if (dot(cross(sub(b, a), sub(c, a)), n) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** A planar quad wound so it faces along `n`. */
function quadN(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  triN(m, mat, a, b, c, n);
  triN(m, mat, a, c, d, n);
}

/** A triangle wound so it faces away from `inside`. */
function triOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const g: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  triN(m, mat, a, b, c, sub(g, inside));
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

/**
 * A round tube of radius r (or radii per point) along `pts`, `n` sides, its rings
 * square to the path, closed ends. `ref` is a direction the path never runs along.
 */
function pipe(m: MeshBuilder, mat: string, pts: Vec3[], r: number | number[], n: number, ref: Vec3): void {
  const N = pts.length;
  const rad = (i: number): number => (typeof r === "number" ? r : r[i]!);
  const rings: Vec3[][] = [];
  for (let i = 0; i < N; i++) {
    const prev = pts[Math.max(0, i - 1)]!, next = pts[Math.min(N - 1, i + 1)]!;
    const t = unit(sub(next, prev));
    const u = unit(cross(t, ref));
    const v = cross(t, u);
    const ring: Vec3[] = [];
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n;
      ring.push(add(pts[i]!, add(mul(u, rad(i) * Math.cos(a)), mul(v, rad(i) * Math.sin(a)))));
    }
    rings.push(ring);
  }
  for (let i = 0; i + 1 < N; i++) {
    const A = rings[i]!, B = rings[i + 1]!;
    const mid = mul(add(pts[i]!, pts[i + 1]!), 0.5);
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      triOut(m, mat, A[k]!, A[j]!, B[j]!, mid);
      triOut(m, mat, A[k]!, B[j]!, B[k]!, mid);
    }
  }
  for (const [i, inward] of [[0, 1], [N - 1, N - 2]] as const) {
    const R = rings[i]!;
    const inside = add(pts[i]!, mul(unit(sub(pts[inward]!, pts[i]!)), 0.01));
    for (let k = 1; k + 1 < n; k++) triOut(m, mat, R[0]!, R[k]!, R[k + 1]!, inside);
  }
}

/** A box spanning its centre and size, turned ry, closed underneath as well. */
function block(m: MeshBuilder, mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number, ry = 0): void {
  m.box(mat, cx, cz, w, d, y0, y1, ry);
  m.cap(mat, rect(w, d, cx, cz, ry), y0, false);
}

// --- wall features ------------------------------------------------------------------

/** A wall face: origin `o` on the face at y = 0, `u` along it, `n` out of it. */
interface Face {
  o: Vec3;
  u: Vec3;
  n: Vec3;
}

type P2 = [number, number];

/** A point on a wall face: s along it, y up, d out of it. */
const at = (f: Face, s: number, y: number, d: number): Vec3 => add(add(f.o, mul(f.u, s)), add([0, y, 0], mul(f.n, d)));

/** A round-arched outline (convex): half width hw, from y0 to the springing ys, `k` arc steps. */
function archOutline(hw: number, y0: number, ys: number, k: number): P2[] {
  const pts: P2[] = [[-hw, y0], [hw, y0]];
  for (let i = 0; i <= k; i++) {
    const a = (Math.PI * i) / k;
    pts.push([hw * Math.cos(a), ys + hw * Math.sin(a)]);
  }
  return pts;
}

/** The arched head and jambs of an opening as a polyline (left foot, up, over, down to the right foot), grown by g. */
function archLine(hw: number, y0: number, ys: number, k: number, g: number): P2[] {
  const pts: P2[] = [[-(hw + g), y0]];
  for (let i = k; i >= 0; i--) {
    const a = (Math.PI * i) / k;
    pts.push([(hw + g) * Math.cos(a), ys + (hw + g) * Math.sin(a)]);
  }
  pts.push([hw + g, y0]);
  return pts;
}

/** A circle on a face as a polyline loop. */
function ringLine(r: number, yc: number, k: number): P2[] {
  const pts: P2[] = [];
  for (let i = 0; i < k; i++) {
    const a = (2 * Math.PI * i) / k;
    pts.push([r * Math.cos(a), yc + r * Math.sin(a)]);
  }
  return pts;
}

/** A flat panel on a face: the outline at d1 out of it, its back at d0 (inside the wall). */
function panel(m: MeshBuilder, mat: string, f: Face, outline: P2[], d0: number, d1: number): void {
  m.slab(mat, outline.map(([s, y]) => at(f, s, y, d1)), mul(f.n, d0 - d1));
}

/**
 * A moulded band on a face between the polylines `inner` and `outer` (equal length):
 * its front at d1, its back at d0, edges along both lines and, unless `loop`, end faces.
 */
function band(m: MeshBuilder, mat: string, f: Face, inner: P2[], outer: P2[], d0: number, d1: number, loop = false): void {
  const N = inner.length;
  const segs = loop ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const j = (i + 1) % N;
    const ia = inner[i]!, ib = inner[j]!, oa = outer[i]!, ob = outer[j]!;
    quadN(m, mat, at(f, ia[0], ia[1], d1), at(f, ib[0], ib[1], d1), at(f, ob[0], ob[1], d1), at(f, oa[0], oa[1], d1), f.n);
    const mi: P2 = [(ia[0] + ib[0]) / 2, (ia[1] + ib[1]) / 2];
    const mo: P2 = [(oa[0] + ob[0]) / 2, (oa[1] + ob[1]) / 2];
    const toIn = sub(at(f, mi[0], mi[1], 0), at(f, mo[0], mo[1], 0));
    quadN(m, mat, at(f, ia[0], ia[1], d0), at(f, ib[0], ib[1], d0), at(f, ib[0], ib[1], d1), at(f, ia[0], ia[1], d1), toIn);
    quadN(m, mat, at(f, oa[0], oa[1], d0), at(f, ob[0], ob[1], d0), at(f, ob[0], ob[1], d1), at(f, oa[0], oa[1], d1), mul(toIn, -1));
  }
  if (loop) return;
  for (const [i, k] of [[0, 1], [N - 1, N - 2]] as const) {
    const a = inner[i]!, b = outer[i]!;
    const away = sub(at(f, a[0], a[1], 0), at(f, inner[k]![0], inner[k]![1], 0));
    quadN(m, mat, at(f, a[0], a[1], d0), at(f, b[0], b[1], d0), at(f, b[0], b[1], d1), at(f, a[0], a[1], d1), away);
  }
}

/** A round-arched window: dark glass, a stone surround with a keystone and a sill. */
function archWindow(m: MeshBuilder, f: Face, hw: number, y0: number, ys: number): void {
  const k = 10;
  const fw = hw > 0.4 ? 0.16 : 0.14;
  const sill = hw > 0.4 ? 0.26 : 0.12;
  panel(m, "glass", f, archOutline(hw + 0.05, y0 - 0.03, ys, k), -0.04, 0.02);
  band(m, "stone", f, archLine(hw, y0, ys, k, 0), archLine(hw, y0, ys, k, fw), -0.06, 0.08);
  // the keystone and the sill
  panel(m, "stone", f, [[-0.11, ys + hw - 0.04], [0.11, ys + hw - 0.04], [0.14, ys + hw + 0.24], [-0.14, ys + hw + 0.24]], -0.05, 0.11);
  panel(m, "stone", f, [[-hw - sill, y0 - 0.16], [hw + sill, y0 - 0.16], [hw + sill, y0 + 0.01], [-hw - sill, y0 + 0.01]], -0.07, 0.14);
  // the glazing bars
  panel(m, "trim", f, [[-0.025, y0], [0.025, y0], [0.025, ys + hw - 0.01], [-0.025, ys + hw - 0.01]], -0.03, 0.04);
  panel(m, "trim", f, [[-hw - 0.03, ys - 0.025], [hw + 0.03, ys - 0.025], [hw + 0.03, ys + 0.025], [-hw - 0.03, ys + 0.025]], -0.03, 0.04);
}

/** A lesene (a flat pilaster strip) on a face from y0 to y1. */
function lesene(m: MeshBuilder, f: Face, s: number, w: number, y0: number, y1: number, proud = 0.07): void {
  panel(m, "trim", f, [[s - w / 2, y0], [s + w / 2, y0], [s + w / 2, y1], [s - w / 2, y1]], -0.1, proud);
}

// --- the statue -------------------------------------------------------------------

/** A ring across a figure: half width a across, half depth b along +Z. */
function figRing(cx: number, cz: number, a: number, b: number, n = 10, back = 0): Ring {
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    ring.push([cx + a * Math.cos(t), cz - b * Math.sin(t) + back]);
  }
  return ring;
}

/** A robed saint h tall on y0 at (cx, cz), facing +Z, arms open in blessing, with a halo. */
function saint(m: MeshBuilder, mat: string, cx: number, cz: number, y0: number, h: number): void {
  const L = (s: number, y: number, f: number): Vec3 => [cx + s * h, y0 + y * h, cz + f * h];
  m.scope("robe", () => {
    // [height, half width, half depth, lean back]
    const secs: Array<[number, number, number, number]> = [
      [0, 0.19, 0.14, 0], [0.1, 0.18, 0.13, 0], [0.45, 0.13, 0.1, -0.01], [0.68, 0.14, 0.1, -0.01], [0.79, 0.15, 0.085, -0.01], [0.83, 0.055, 0.05, 0],
    ];
    for (let i = 0; i + 1 < secs.length; i++) {
      const [ya, a0, b0, k0] = secs[i]!;
      const [yb, a1, b1, k1] = secs[i + 1]!;
      m.loft(mat, figRing(cx, cz, a0 * h, b0 * h, 10, k0 * h), y0 + ya * h, figRing(cx, cz, a1 * h, b1 * h, 10, k1 * h), y0 + yb * h, i + 2 === secs.length);
    }
  });
  m.scope("head", () => blob(m, mat, L(0, 0.9, 0.005), 0.06 * h, 0.075 * h, 0.065 * h, 8, 4));
  m.scope("arms", () => {
    for (const s of [-1, 1]) pipe(m, mat, [L(s * 0.12, 0.77, 0), L(s * 0.2, 0.66, 0.06), L(s * 0.27, 0.7, 0.12)], 0.034 * h, 6, [0, 0, 1]);
  });
  m.scope("halo", () => {
    const pts: Vec3[] = [];
    for (let i = 0; i <= 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      pts.push(L(0.12 * Math.cos(a), 0.92 + 0.12 * Math.sin(a), -0.07));
    }
    pipe(m, "gilt", pts, 0.012 * h, 4, [0, 0, 1]);
  });
}

// --- the body ---------------------------------------------------------------------

/** The apse wall's ring: the half-dodecagon behind the back wall, closed inside the nave. */
function apseRing(r: number, chordZ: number): Ring {
  const ring: Ring = [];
  for (let i = 0; i <= APSE_N; i++) {
    const a = (Math.PI * i) / APSE_N;
    ring.push([r * Math.cos(a), Z_BACK - r * Math.sin(a)]);
  }
  ring.push([-r, chordZ], [r, chordZ]);
  return ring;
}

/** The outward face of apse facet i (0 = the one by +X). */
function apseFace(i: number): Face {
  const a0 = (Math.PI * i) / APSE_N, a1 = (Math.PI * (i + 1)) / APSE_N;
  const p0: Vec3 = [APSE_R * Math.cos(a0), 0, Z_BACK - APSE_R * Math.sin(a0)];
  const p1: Vec3 = [APSE_R * Math.cos(a1), 0, Z_BACK - APSE_R * Math.sin(a1)];
  const am = (a0 + a1) / 2;
  return { o: mul(add(p0, p1), 0.5), u: unit(sub(p1, p0)), n: [Math.cos(am), 0, -Math.sin(am)] };
}

function body(m: MeshBuilder): void {
  m.scope("nave walls", () => {
    // the nave as one prism of its house-shaped section, the gables its end caps
    const sec: Ring = [[-HW, 0], [HW, 0], [HW, EAVE], [0, RIDGE], [-HW, EAVE]];
    m.sweep("render", "z", sec, Z_BACK, sec, Z_FRONT);
  });
  m.scope("apse walls", () => m.prism("render", apseRing(APSE_R, Z_BACK + 0.2), 0, 6.1, false));
  m.scope("plinth", () => {
    for (const s of [-1, 1]) m.box("plinth", s * HW, (Z_BACK + 0.03 + Z_FRONT - 0.05) / 2, 0.1, Z_FRONT - 0.08 - Z_BACK, 0, 0.5);
    for (const s of [-1, 1]) {
      // the front either side of the door, the back either side of the apse
      m.box("plinth", s * (HW + 0.05 + 0.83) / 2, Z_FRONT - 0.03, HW + 0.05 - 0.83, 0.16, 0, 0.49);
      m.box("plinth", s * (HW + 0.05 + 2.55) / 2, Z_BACK + 0.0, HW + 0.05 - 2.55, 0.12, 0, 0.49);
    }
    m.prism("plinth", apseRing(APSE_R + 0.05, Z_BACK + 0.25), 0, 0.48);
  });
  m.scope("cornice", () => {
    const z0 = Z_BACK - 0.22, z1 = Z_FRONT + 0.42;
    const z0i = Z_BACK - 0.08, z1i = Z_FRONT + 0.28;
    m.loft("trim", rect(2 * HW + 0.16, z1i - z0i, 0, (z0i + z1i) / 2), 5.3, rect(2 * HW + 0.44, z1 - z0, 0, (z0 + z1) / 2), 5.45, false);
    m.prism("trim", rect(2 * HW + 0.44, z1 - z0, 0, (z0 + z1) / 2), 5.45, 5.8);
    // round the apse
    m.loft("trim", apseRing(APSE_R + 0.06, Z_BACK + 0.3), 5.32, apseRing(APSE_R + 0.2, Z_BACK + 0.3), 5.47, false);
    m.prism("trim", apseRing(APSE_R + 0.2, Z_BACK + 0.3), 5.47, 5.78);
  });
  m.scope("side walls", () => {
    for (const s of [-1, 1]) {
      const f: Face = { o: [s * HW, 0, 0], u: [0, 0, -s], n: [s, 0, 0] };
      // s runs along -s*z: z = -s * along
      const along = (z: number): number => -s * z;
      m.scope(s < 0 ? "left" : "right", () => {
        for (const z of [Z_FRONT - 0.24, 0.1, Z_BACK + 0.24]) lesene(m, f, along(z), 0.5, 0.45, 5.35);
        for (const z of [-1.45, 1.75]) archWindow(m, { ...f, o: [s * HW, 0, z] }, 0.5, 2.35, 3.95);
      });
    }
    // the back corners beside the apse
    const back: Face = { o: [0, 0, Z_BACK], u: [-1, 0, 0], n: [0, 0, -1] };
    for (const x of [-(HW - 0.24), HW - 0.24]) lesene(m, back, -x, 0.5, 0.45, 5.35);
  });
  m.scope("apse", () => {
    for (let i = 0; i < APSE_N; i++) if (i === 1 || i === 4) archWindow(m, apseFace(i), 0.34, 2.5, 3.9);
    for (let i = 1; i < APSE_N; i++) {
      const a = (Math.PI * i) / APSE_N;
      m.box("trim", APSE_R * Math.cos(a), Z_BACK - APSE_R * Math.sin(a), 0.22, 0.36, 0.45, 5.35, a, false);
    }
  });
}

// --- the entrance front ------------------------------------------------------------

const FRONT: Face = { o: [0, 0, Z_FRONT], u: [1, 0, 0], n: [0, 0, 1] };
const SCREEN_Z0 = Z_FRONT - 0.1;
const SCREEN_Z1 = Z_FRONT + 0.25;
const SHOULDER_X = 1.4; // the central stage's half width
const SHOULDER_Y = 8.5; // the shoulders' top
const STAGE_Y = 8.85; // the central stage's cornice
const GABLE_W = 3.3; // the screen's half width at its foot
const SCREEN_Y0 = 5.7;

/** The screen's top profile for x >= 0: the pediment, the step, the convex shoulder. */
function screenProfile(): P2[] {
  const right: P2[] = [[0, 10.38], [SHOULDER_X, STAGE_Y + 0.33], [SHOULDER_X, SHOULDER_Y]];
  const k = 9;
  for (let i = 1; i <= k; i++) {
    const t = (Math.PI / 2) * (i / k);
    right.push([SHOULDER_X + (GABLE_W - SHOULDER_X) * Math.sin(t), 5.8 + (SHOULDER_Y - 5.8) * Math.cos(t)]);
  }
  return right;
}

/** The curved gable screen standing on the cornice, z SCREEN_Z0..SCREEN_Z1. */
function gableScreen(m: MeshBuilder): void {
  const right = screenProfile();
  const prof: P2[] = [...right.slice(1).reverse().map(([x, y]): P2 => [-x, y]), ...right];
  const yb = SCREEN_Y0;
  for (let i = 0; i + 1 < prof.length; i++) {
    const [x0, y0] = prof[i]!, [x1, y1] = prof[i + 1]!;
    quadN(m, "render", [x0, yb, SCREEN_Z1], [x1, yb, SCREEN_Z1], [x1, y1, SCREEN_Z1], [x0, y0, SCREEN_Z1], [0, 0, 1]);
    quadN(m, "render", [x0, yb, SCREEN_Z0], [x1, yb, SCREEN_Z0], [x1, y1, SCREEN_Z0], [x0, y0, SCREEN_Z0], [0, 0, -1]);
    quadN(m, "trim", [x0, y0, SCREEN_Z0], [x1, y1, SCREEN_Z0], [x1, y1, SCREEN_Z1], [x0, y0, SCREEN_Z1], [-(y1 - y0), x1 - x0, 0]);
  }
  for (const [x, y, s] of [[prof[0]![0], prof[0]![1], -1], [prof[prof.length - 1]![0], prof[prof.length - 1]![1], 1]] as const) {
    quadN(m, "trim", [x, yb, SCREEN_Z0], [x, yb, SCREEN_Z1], [x, y, SCREEN_Z1], [x, y, SCREEN_Z0], [s, 0, 0]);
  }
  const fz = SCREEN_Z1;
  const scr: Face = { o: [0, 0, fz], u: [1, 0, 0], n: [0, 0, 1] };
  m.scope("coping", () => {
    // a rounded coping along each shoulder, scrolls where it meets the stage, vases at the feet
    for (const s of [-1, 1]) {
      const pts: Vec3[] = right.slice(2).map(([x, y]): Vec3 => [s * x, y + 0.02, (SCREEN_Z0 + SCREEN_Z1) / 2]);
      pipe(m, "trim", pts, 0.13, 6, [0, 0, 1]);
      const vol: Vec3[] = [];
      for (let i = 0; i <= 9; i++) {
        const t = Math.PI * 0.5 + (i / 9) * Math.PI * 1.7;
        const r = 0.34 - 0.024 * i;
        vol.push([s * (SHOULDER_X + 0.3 + r * Math.cos(t) * 0.9), SHOULDER_Y - 0.25 + r * Math.sin(t), fz + 0.1]);
      }
      pipe(m, "trim", vol, 0.075, 6, [0, 0, 1]);
      const vx = s * (GABLE_W - 0.12);
      m.loft("stone", circle(8, 0.13, vx, fz - 0.12), 5.8, circle(8, 0.2, vx, fz - 0.12), 6.05, false);
      m.loft("stone", circle(8, 0.2, vx, fz - 0.12), 6.05, circle(8, 0.08, vx, fz - 0.12), 6.35, false);
      blob(m, "stone", [vx, 6.43, fz - 0.12], 0.1, 0.12, 0.1, 6, 3);
    }
  });
  m.scope("stage", () => {
    for (const s of [-1, 1]) lesene(m, scr, s * (SHOULDER_X - 0.17), 0.34, SCREEN_Y0 + 0.05, STAGE_Y, 0.06);
    block(m, "trim", 0, fz - 0.1, 2 * SHOULDER_X + 0.3, 0.42, STAGE_Y - 0.05, STAGE_Y + 0.16);
    // the raking cornice of the pediment
    pipe(m, "trim", [[-SHOULDER_X - 0.15, STAGE_Y + 0.22, fz + 0.03], [0, 10.4, fz + 0.03], [SHOULDER_X + 0.15, STAGE_Y + 0.22, fz + 0.03]], 0.12, 6, [0, 0, 1]);
    // the oculus
    const k = 12;
    panel(m, "glass", scr, ringLine(0.44, 7.45, k).reverse(), -0.04, 0.02);
    band(m, "stone", scr, ringLine(0.4, 7.45, k), ringLine(0.56, 7.45, k), -0.06, 0.08, true);
    // a small ball finial on the pediment
    blob(m, "stone", [0, 10.62, fz - 0.12], 0.13, 0.15, 0.13, 6, 3);
  });
}

function entrance(m: MeshBuilder): void {
  m.scope("lesenes", () => {
    for (const s of [-1, 1]) {
      lesene(m, FRONT, s * (HW - 0.24), 0.5, 0.45, 5.35);
      lesene(m, FRONT, s * 1.55, 0.42, 0.5, 5.35);
    }
  });
  m.scope("door", () => {
    const hw = 0.66, y0 = 0.33, ys = 2.55, k = 8;
    panel(m, "wood", FRONT, archOutline(hw + 0.05, y0 - 0.03, ys, k), -0.04, 0.03);
    band(m, "stone", FRONT, archLine(hw, y0, ys, k, 0), archLine(hw, y0, ys, k, 0.2), -0.06, 0.12);
    panel(m, "stone", FRONT, [[-0.13, ys + hw - 0.04], [0.13, ys + hw - 0.04], [0.17, ys + hw + 0.3], [-0.17, ys + hw + 0.3]], -0.05, 0.16);
    // the two leaves' raised panels and the joint between them
    for (const s of [-1, 1]) {
      for (const [ya, yb] of [[0.55, 1.35], [1.55, 2.45]] as const) {
        panel(m, "wood", FRONT, [[s * 0.1, ya], [s * 0.54, ya], [s * 0.54, yb], [s * 0.1, yb]], 0, 0.06);
      }
    }
    panel(m, "shade", FRONT, [[-0.015, y0], [0.015, y0], [0.015, ys + hw - 0.02], [-0.015, ys + hw - 0.02]], 0, 0.045);
  });
  m.scope("benches", () => {
    // two wooden benches on stone feet either side of the porch, facing the square
    for (const s of [-1, 1]) {
      const x = s * 2.15, z = Z_FRONT + 0.62;
      for (const dx of [-0.6, 0.6]) m.box("stone", x + dx, z, 0.1, 0.36, 0, 0.42, 0, false);
      block(m, "wood", x, z, 1.5, 0.4, 0.42, 0.48);
      for (const dx of [-0.6, 0.6]) m.box("wood", x + dx, Z_FRONT + 0.4, 0.06, 0.05, 0.48, 0.88, 0, false);
      block(m, "wood", x, Z_FRONT + 0.4, 1.5, 0.04, 0.66, 0.9);
    }
  });
  m.scope("steps", () => {
    m.box("plinth", 0, Z_FRONT + 0.395, 2.5, 0.89, 0, 0.16);
    m.box("plinth", 0, Z_FRONT + 0.175, 1.9, 0.45, 0.16, 0.32);
  });
  m.scope("niche", () => {
    const hw = 0.42, y0 = 3.62, ys = 4.68, k = 8;
    panel(m, "shade", FRONT, archOutline(hw + 0.05, y0 - 0.03, ys, k), -0.04, 0.02);
    band(m, "stone", FRONT, archLine(hw, y0, ys, k, 0), archLine(hw, y0, ys, k, 0.14), -0.06, 0.09);
    // the console under the statue
    block(m, "stone", 0, Z_FRONT + 0.1, 0.66, 0.36, 3.44, 3.6);
    m.scope("statue", () => saint(m, "stone", 0, Z_FRONT + 0.16, 3.6, 1.12));
  });
  m.scope("gable", () => gableScreen(m));
}

// --- the roof -----------------------------------------------------------------------

function roof(m: MeshBuilder): void {
  m.scope("nave roof", () => {
    const z0 = Z_BACK - 0.4, z1 = SCREEN_Z0 + 0.15;
    const yb = (x: number): number => roofTop(x) - ROOF_T;
    for (const s of [-1, 1]) {
      const R = (x: number, y: number, z: number): Vec3 => [s * x, y, z];
      const up: Vec3 = [s * SLOPE, 1, 0];
      quadN(m, "roof", R(0, roofTop(0), z0), R(0, roofTop(0), z1), R(ROOF_X, roofTop(ROOF_X), z1), R(ROOF_X, roofTop(ROOF_X), z0), up);
      quadN(m, "roof", R(0, yb(0), z0), R(0, yb(0), z1), R(ROOF_X, yb(ROOF_X), z1), R(ROOF_X, yb(ROOF_X), z0), mul(up, -1));
      // the eaves' edge and the back verge
      quadN(m, "roof", R(ROOF_X, yb(ROOF_X), z0), R(ROOF_X, yb(ROOF_X), z1), R(ROOF_X, roofTop(ROOF_X), z1), R(ROOF_X, roofTop(ROOF_X), z0), [s, 0, 0]);
      quadN(m, "roof", R(0, yb(0), z0), R(ROOF_X, yb(ROOF_X), z0), R(ROOF_X, roofTop(ROOF_X), z0), R(0, roofTop(0), z0), [0, 0, -1]);
      // the tile courses: low ribs across the slope
      for (let i = 1; i <= 14; i++) {
        const x = (ROOF_X * i) / 15;
        const a = R(x, roofTop(x), z0), b = R(x - 0.03, roofTop(x - 0.03) + 0.035, z0), c = R(x + 0.06, roofTop(x + 0.06), z0);
        const w: Vec3 = [0, 0, z1 - z0];
        const inside = R(x + 0.01, roofTop(x + 0.01) - 0.05, z0 + 0.5);
        triOut(m, "roof", a, add(a, w), add(b, w), inside);
        triOut(m, "roof", a, add(b, w), b, inside);
        triOut(m, "roof", b, add(b, w), add(c, w), inside);
        triOut(m, "roof", b, add(c, w), c, inside);
        triN(m, "roof", a, b, c, [0, 0, -1]);
      }
    }
    // the ridge
    pipe(m, "roof", [[0, roofTop(0) - 0.02, z0 - 0.02], [0, roofTop(0) - 0.02, z1]], 0.11, 6, [1, 0, 0]);
  });
  m.scope("apse roof", () => {
    // a cone of APSE_N facets from the eaves to an apex against the back gable
    const r0 = APSE_R + 0.38, y0 = 5.75, t = 0.16;
    const apexY = y0 + r0 * SLOPE * 0.98;
    const apex: Vec3 = [0, apexY, Z_BACK];
    const P = (i: number, r: number, y: number): Vec3 => {
      const a = (Math.PI * i) / APSE_N;
      return [r * Math.cos(a), y, Z_BACK - r * Math.sin(a)];
    };
    const inside: Vec3 = [0, 4, Z_BACK - 0.5];
    for (let i = 0; i < APSE_N; i++) {
      triOut(m, "roof", P(i, r0, y0), P(i + 1, r0, y0), apex, inside);
      const lo = sub(apex, [0, t, 0]);
      triN(m, "roof", P(i, r0, y0 - t), P(i + 1, r0, y0 - t), lo, [0, -1, 0]);
      const out = P(i + 0.5, 1, 0);
      quadN(m, "roof", P(i, r0, y0 - t), P(i + 1, r0, y0 - t), P(i + 1, r0, y0), P(i, r0, y0), [out[0], 0, out[2] - Z_BACK]);
      // a hip roll on each facet edge
      if (i > 0) pipe(m, "roof", [P(i, r0 - 0.02, y0 + 0.02), [0, apexY + 0.0, Z_BACK - 0.02]], 0.07, 5, [0, 0, 1]);
    }
  });
}

// --- the bell turret -----------------------------------------------------------------

const T_HALF = 0.7; // the turret shaft's half width
const T_BASE = 8.9;
const T_SHAFT = 10.6;
const BELFRY0 = 10.75;
const BELFRY1 = 11.7;
const CROSS_H = 0.56;

/** An arched spandrel panel across an opening of half width hw on a face: the arc from ys to the top yt. */
function spandrel(m: MeshBuilder, mat: string, f: Face, hw: number, ys: number, yt: number, t: number): void {
  const k = 8;
  for (let i = 0; i < k; i++) {
    const a0 = Math.PI - (Math.PI * i) / k, a1 = Math.PI - (Math.PI * (i + 1)) / k;
    const p0: P2 = [hw * Math.cos(a0), ys + hw * Math.sin(a0)], p1: P2 = [hw * Math.cos(a1), ys + hw * Math.sin(a1)];
    quadN(m, mat, at(f, p0[0], p0[1], 0), at(f, p1[0], p1[1], 0), at(f, p1[0], yt, 0), at(f, p0[0], yt, 0), f.n);
    quadN(m, mat, at(f, p0[0], p0[1], -t), at(f, p1[0], p1[1], -t), at(f, p1[0], yt, -t), at(f, p0[0], yt, -t), mul(f.n, -1));
    const mid: P2 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
    quadN(m, mat, at(f, p0[0], p0[1], 0), at(f, p1[0], p1[1], 0), at(f, p1[0], p1[1], -t), at(f, p0[0], p0[1], -t), sub(at(f, 0, ys, 0), at(f, mid[0], mid[1], 0)));
  }
}

function turret(m: MeshBuilder): void {
  const cz = TURRET_Z;
  m.scope("shaft", () => {
    m.box("render", 0, cz, 2 * T_HALF, 2 * T_HALF, T_BASE, T_SHAFT, 0, false);
    // corner strips and a band of sheet metal at the foot
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box("trim", sx * (T_HALF - 0.06), cz + sz * (T_HALF - 0.06), 0.16, 0.16, T_BASE + 0.2, T_SHAFT, 0, false);
  });
  m.scope("belfry floor", () => {
    block(m, "trim", 0, cz, 2 * T_HALF + 0.16, 2 * T_HALF + 0.16, T_SHAFT, BELFRY0);
  });
  m.scope("belfry", () => {
    const pw = 0.2;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.box("trim", sx * (T_HALF - pw / 2), cz + sz * (T_HALF - pw / 2), pw, pw, BELFRY0, BELFRY1, 0, false);
    const hw = T_HALF - pw;
    const faces: Face[] = [
      { o: [0, 0, cz + T_HALF], u: [1, 0, 0], n: [0, 0, 1] },
      { o: [0, 0, cz - T_HALF], u: [-1, 0, 0], n: [0, 0, -1] },
      { o: [T_HALF, 0, cz], u: [0, 0, -1], n: [1, 0, 0] },
      { o: [-T_HALF, 0, cz], u: [0, 0, 1], n: [-1, 0, 0] },
    ];
    faces.forEach((f, i) => {
      spandrel(m, "trim", f, hw, BELFRY1 - hw - 0.02, BELFRY1, 0.12);
      // a low parapet under each opening, louvres in the side openings
      panel(m, "trim", f, [[-hw - 0.05, BELFRY0 - 0.02], [hw + 0.05, BELFRY0 - 0.02], [hw + 0.05, BELFRY0 + 0.2], [-hw - 0.05, BELFRY0 + 0.2]], -0.12, -0.01);
      if (i >= 2) {
        for (let k = 0; k < 4; k++) {
          const y = BELFRY0 + 0.32 + k * 0.17;
          m.slab("wood", [at(f, -hw - 0.03, y + 0.06, -0.1), at(f, hw + 0.03, y + 0.06, -0.1), at(f, hw + 0.03, y - 0.06, -0.02), at(f, -hw - 0.03, y - 0.06, -0.02)], [0, -0.025, 0]);
        }
      }
    });
  });
  m.scope("bell", () => {
    const by = BELFRY0 + 0.3;
    const prof: Array<[number, number]> = [[0, 0.27], [0.05, 0.255], [0.2, 0.17], [0.38, 0.14], [0.45, 0.12]];
    for (let i = 0; i + 1 < prof.length; i++) {
      m.loft("bronze", circle(10, prof[i]![1], 0, cz), by + prof[i]![0], circle(10, prof[i + 1]![1], 0, cz), by + prof[i + 1]![0], i + 2 === prof.length);
    }
    m.cap("bronze", circle(10, 0.27, 0, cz), by, false);
    m.box("wood", 0, cz, 0.12, 0.3, by + 0.45, by + 0.56);
    // the headstock beam between the side posts
    m.box("wood", 0, cz, 2 * (T_HALF - 0.1), 0.12, by + 0.56, by + 0.66);
  });
  m.scope("helmet", () => {
    block(m, "trim", 0, cz, 2 * T_HALF + 0.24, 2 * T_HALF + 0.24, BELFRY1, BELFRY1 + 0.14);
    const y0 = BELFRY1 + 0.14;
    m.loft("copper", rect(2 * T_HALF + 0.16, 2 * T_HALF + 0.16, 0, cz), y0, rect(2 * T_HALF - 0.1, 2 * T_HALF - 0.1, 0, cz), y0 + 0.18, false);
    // the onion: octagonal rings [height above y0, radius]
    const oct = (r: number): Ring => ngon(12, r, Math.PI / 12, 0, cz);
    const prof: Array<[number, number]> = [[0.18, 0.62], [0.36, 0.8], [0.58, 0.82], [0.8, 0.64], [0.98, 0.36], [1.1, 0.16], [1.18, 0.13], [1.27, 0.19], [1.37, 0.2], [1.47, 0.12], [1.55, 0.07]];
    for (let i = 0; i + 1 < prof.length; i++) {
      m.loft("copper", oct(prof[i]![1]), y0 + prof[i]![0], oct(prof[i + 1]![1]), y0 + prof[i + 1]![0], false);
    }
    m.spire("copper", oct(0.07), y0 + 1.55, y0 + 1.78);
    blob(m, "gilt", [0, y0 + 1.8, cz], 0.075, 0.075, 0.075, 6, 4);
    // the cross
    const c0 = y0 + 1.84;
    m.box("gilt", 0, cz, 0.06, 0.06, c0, c0 + CROSS_H);
    m.box("gilt", 0, cz, 0.36, 0.05, c0 + CROSS_H - 0.22, c0 + CROSS_H - 0.16);
  });
}

/** The village chapel: nave, apse, curved gable, bell turret; about 7.2 x 10.9 m and 14.2 m to the cross. */
export function villageChapel(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("village chapel", () => {
    m.scope("body", () => body(m));
    m.scope("entrance", () => entrance(m));
    m.scope("roof", () => roof(m));
    m.scope("bell turret", () => turret(m));
  });
  return m;
}

/** The low level of detail: the nave and apse, the gable screen, the roofs and the turret with its helmet and cross. */
export function villageChapelLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const sec: Ring = [[-HW, 0], [HW, 0], [HW, EAVE], [0, RIDGE], [-HW, EAVE]];
  m.sweep("render", "z", sec, Z_BACK, sec, Z_FRONT);
  m.prism("render", apseRing(APSE_R, Z_BACK + 0.2), 0, 6.1, false);
  m.box("plinth", 0, Z_FRONT + 0.42, 2.5, 0.84, 0, 0.16);
  // the door as a dark block, the screen as one profile
  m.box("wood", 0, Z_FRONT + 0.01, 1.3, 0.04, 0.3, 3.0);
  const right = screenProfile();
  const prof: P2[] = [...right.slice(1).reverse().map(([x, y]): P2 => [-x, y]), ...right].filter((_, i) => i % 2 === 0 || Math.abs(i - right.length + 1) <= 2);
  for (let i = 0; i + 1 < prof.length; i++) {
    const [x0, y0] = prof[i]!, [x1, y1] = prof[i + 1]!;
    quadN(m, "render", [x0, 5.7, SCREEN_Z1], [x1, 5.7, SCREEN_Z1], [x1, y1, SCREEN_Z1], [x0, y0, SCREEN_Z1], [0, 0, 1]);
    quadN(m, "render", [x0, 5.7, SCREEN_Z0], [x1, 5.7, SCREEN_Z0], [x1, y1, SCREEN_Z0], [x0, y0, SCREEN_Z0], [0, 0, -1]);
    quadN(m, "trim", [x0, y0, SCREEN_Z0], [x1, y1, SCREEN_Z0], [x1, y1, SCREEN_Z1], [x0, y0, SCREEN_Z1], [-(y1 - y0), x1 - x0, 0]);
  }
  m.box("trim", 0, (Z_BACK + Z_FRONT) / 2 + 0.1, 2 * HW + 0.44, Z_FRONT - Z_BACK + 0.64, 5.45, 5.8);
  // the roofs
  const z0 = Z_BACK - 0.4, z1 = SCREEN_Z0 + 0.15;
  for (const s of [-1, 1]) {
    const R = (x: number, y: number, z: number): Vec3 => [s * x, y, z];
    const up: Vec3 = [s * SLOPE, 1, 0];
    quadN(m, "roof", R(0, roofTop(0), z0), R(0, roofTop(0), z1), R(ROOF_X, roofTop(ROOF_X), z1), R(ROOF_X, roofTop(ROOF_X), z0), up);
    quadN(m, "roof", R(0, roofTop(0) - ROOF_T, z0), R(0, roofTop(0) - ROOF_T, z1), R(ROOF_X, roofTop(ROOF_X) - ROOF_T, z1), R(ROOF_X, roofTop(ROOF_X) - ROOF_T, z0), mul(up, -1));
    quadN(m, "roof", R(0, roofTop(0) - ROOF_T, z0), R(ROOF_X, roofTop(ROOF_X) - ROOF_T, z0), R(ROOF_X, roofTop(ROOF_X), z0), R(0, roofTop(0), z0), [0, 0, -1]);
  }
  const r0 = APSE_R + 0.38;
  const ring: Ring = [];
  for (let i = 0; i <= APSE_N; i++) ring.push([r0 * Math.cos((Math.PI * i) / APSE_N), Z_BACK - r0 * Math.sin((Math.PI * i) / APSE_N)]);
  for (let i = 0; i < APSE_N; i++) {
    triOut(m, "roof", [ring[i]![0], 5.75, ring[i]![1]], [ring[i + 1]![0], 5.75, ring[i + 1]![1]], [0, 5.75 + r0 * SLOPE * 0.98, Z_BACK], [0, 4, Z_BACK - 0.5]);
  }
  // the turret
  m.box("render", 0, TURRET_Z, 2 * T_HALF, 2 * T_HALF, T_BASE, T_SHAFT, 0, false);
  m.box("trim", 0, TURRET_Z, 2 * T_HALF + 0.1, 2 * T_HALF + 0.1, T_SHAFT, BELFRY1 + 0.14, 0, false);
  m.box("wood", 0, TURRET_Z, 2 * T_HALF + 0.12, 2 * T_HALF + 0.12, BELFRY0 + 0.3, BELFRY1 - 0.15, 0, false);
  const y0 = BELFRY1 + 0.14;
  const oct = (r: number): Ring => ngon(8, r, Math.PI / 8, 0, TURRET_Z);
  m.cap("copper", rect(2 * T_HALF + 0.1, 2 * T_HALF + 0.1, 0, TURRET_Z), y0);
  m.loft("copper", oct(0.66), y0, oct(0.82), y0 + 0.47, false);
  m.loft("copper", oct(0.82), y0 + 0.47, oct(0.36), y0 + 0.98, false);
  m.loft("copper", oct(0.36), y0 + 0.98, oct(0.14), y0 + 1.15, false);
  m.spire("copper", oct(0.14), y0 + 1.15, y0 + 1.84);
  m.box("gilt", 0, TURRET_Z, 0.08, 0.08, y0 + 1.7, y0 + 1.84 + CROSS_H);
  m.box("gilt", 0, TURRET_Z, 0.4, 0.07, y0 + 1.84 + CROSS_H - 0.23, y0 + 1.84 + CROSS_H - 0.15);
  return m;
}

export const VILLAGE_CHAPEL: ProceduralDesign[] = [
  { id: "bld-village-chapel", game: { plaza: { cities: ["village"], layouts: ["rect"] } }, title: "Village Chapel", build: villageChapel, buildLod: villageChapelLod, references: "village-chapel", catalog: PLAZA_CATALOG },
];
