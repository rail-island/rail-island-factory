// A First World War memorial for a village or town square (docs/models/plaza-landmarks.md):
// a generic composite of the memorials found across Europe - the Czech "pomnik padlym",
// the French "monument aux morts" with its poilu, the German "Kriegerdenkmal" - after the
// photos in assets/war-memorial/, not a copy of any one of them.
//
// A paved square platform 8.6 m across on two steps (10 m overall) is fenced by low granite
// bollards linked by sagging iron chains, open to the front (+Z). In the middle stands a
// stepped granite pedestal: a projecting plinth, a die with dark name tablets on all four
// faces (rows of small gilt raised blocks standing for the names), a cornice, a base block
// with a bronze laurel wreath relief, and a tall tapering obelisk with a gilt cross and the
// dates, 8.75 m overall. On the plinth's front a bronze soldier in greatcoat and helmet
// stands with his rifle's butt on the ground and his hands on its muzzle, head bowed.
// Two bronze wreaths lean against the plinth and two small flower beds flank it.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin; the soldier and the
// opening in the chains face +Z. Deterministic: the same code gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  granite: { color: "#8e9091", roughness: 0.85 },
  granitePale: { color: "#b5b3ac", roughness: 0.95 },
  graniteDark: { color: "#66696b", roughness: 0.8 },
  tablet: { color: "#24282a", roughness: 0.35 },
  bronze: { color: "#4f8068", metallic: 0.5, roughness: 0.55 },
  bronzeDark: { color: "#365847", metallic: 0.5, roughness: 0.6 },
  gilt: { color: "#d4a84a", metallic: 0.75, roughness: 0.3 },
  iron: { color: "#2e3032", metallic: 0.6, roughness: 0.5 },
  soil: { color: "#4b3a2b", roughness: 1 },
  foliage: { color: "#3e6a2e", roughness: 0.9 },
  flower: { color: "#b8222c", roughness: 0.8 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

/** An ellipse of n points with half axes a (x) and b (z) about (cx, cz), wound like ngon. */
const ellipse = (n: number, a: number, b: number, cx = 0, cz = 0): Ring =>
  ngon(n, 1, Math.PI / n).map(([x, z]): [number, number] => [cx + x * a, cz + z * b]);

/** A triangle wound so it faces away from `inside`. */
function triOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const n = cross(sub(b, a), sub(c, a));
  const g: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
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

/**
 * A round tube of radius r along the points `pts`, `n` sides, its rings square to the
 * path; closed ends unless `loop` joins the last point to the first. `ref` is a
 * direction the path never runs along.
 */
function pipe(m: MeshBuilder, mat: string, pts: Vec3[], r: number, n: number, ref: Vec3, loop = false): void {
  const N = pts.length;
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
      ring.push(add(at(i), add(mul(u, r * Math.cos(a)), mul(v, r * Math.sin(a)))));
    }
    rings.push(ring);
  }
  const segs = loop ? N : N - 1;
  for (let i = 0; i < segs; i++) {
    const A = rings[i]!, B = rings[(i + 1) % N]!;
    const mid = mul(add(at(i), at(i + 1)), 0.5);
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n;
      triOut(m, mat, A[k]!, A[j]!, B[j]!, mid);
      triOut(m, mat, A[k]!, B[j]!, B[k]!, mid);
    }
  }
  if (loop) return;
  for (const [i, inward] of [[0, 1], [N - 1, N - 2]] as const) {
    const R = rings[i]!;
    const inside = add(at(i), mul(unit(sub(at(inward), at(i))), 0.01));
    for (let k = 1; k + 1 < n; k++) triOut(m, mat, R[0]!, R[k]!, R[k + 1]!, inside);
  }
}

/**
 * A laurel leaf: a flat double pyramid about c, `l` long along t, `w` wide along u and
 * `d` thick along their normal (eight triangles).
 */
function leaf(m: MeshBuilder, mat: string, c: Vec3, t: Vec3, u: Vec3, l: number, w: number, d: number): void {
  const n = unit(cross(t, u));
  const eq = [add(c, mul(t, l / 2)), add(c, mul(u, w / 2)), sub(c, mul(t, l / 2)), sub(c, mul(u, w / 2))];
  for (const tip of [add(c, mul(n, d / 2)), sub(c, mul(n, d / 2))]) {
    for (let i = 0; i < 4; i++) triOut(m, mat, eq[i]!, eq[(i + 1) % 4]!, tip, c);
  }
}

/**
 * A laurel wreath about c in the plane spanned by e1 and e2 (its face looks along
 * e1 x e2): a ring of radius r with `count` leaves in two staggered rows on it.
 */
function wreath(m: MeshBuilder, mat: string, c: Vec3, e1: Vec3, e2: Vec3, r: number, count: number): void {
  const n = unit(cross(e1, e2));
  const ringPts: Vec3[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (2 * Math.PI * i) / 14;
    ringPts.push(add(c, add(mul(e1, r * Math.cos(a)), mul(e2, r * Math.sin(a)))));
  }
  pipe(m, mat, ringPts, r * 0.13, 5, n, true);
  for (let i = 0; i < count; i++) {
    const a = (2 * Math.PI * (i + 0.5)) / count;
    const radial = add(mul(e1, Math.cos(a)), mul(e2, Math.sin(a)));
    const tang = add(mul(e1, -Math.sin(a)), mul(e2, Math.cos(a)));
    for (const side of [-1, 1]) {
      // each leaf points along the ring, leaning out or in, standing a little proud
      const p = add(add(c, mul(radial, r + side * r * 0.16)), mul(n, r * 0.06));
      const t = unit(add(tang, mul(radial, side * 0.45)));
      leaf(m, mat, p, t, unit(cross(n, t)), r * 0.46, r * 0.24, r * 0.09);
    }
  }
}

// --- the platform, steps, paving, bollards and chains -------------------------------

const Y_PLAT = 0.45; // the platform's top
const Y_PAVE = 0.48; // the paving slabs' top
const PLAT = 8.6; // the platform's side
const POST = 3.95; // the bollards' line from the middle

/** The pedestal's plinth footprint: x half width and z from the back to the front. */
const PLINTH = { hx: 1.7, z0: -1.7, z1: 2.75 };

type Box2 = { x0: number; x1: number; z0: number; z1: number };

/** Clips the rectangle a by cutting the hole out of it: up to four rectangles. */
function cut(a: Box2, h: Box2): Box2[] {
  if (h.x1 <= a.x0 || h.x0 >= a.x1 || h.z1 <= a.z0 || h.z0 >= a.z1) return [a];
  const out: Box2[] = [];
  if (h.x0 > a.x0) out.push({ x0: a.x0, x1: h.x0, z0: a.z0, z1: a.z1 });
  if (h.x1 < a.x1) out.push({ x0: h.x1, x1: a.x1, z0: a.z0, z1: a.z1 });
  const x0 = Math.max(a.x0, h.x0), x1 = Math.min(a.x1, h.x1);
  if (h.z0 > a.z0) out.push({ x0, x1, z0: a.z0, z1: h.z0 });
  if (h.z1 < a.z1) out.push({ x0, x1, z0: h.z1, z1: a.z1 });
  return out;
}

/** The flower beds' centres (x) and their size. */
const BED = { x: 2.55, z: 2.45, w: 1.4, d: 0.9 };

function platform(m: MeshBuilder): void {
  m.scope("steps", () => {
    m.prism("granitePale", rect(10.0, 10.0), 0, 0.15);
    m.prism("granitePale", rect(9.3, 9.3), 0.15, 0.3);
    m.prism("granite", rect(PLAT, PLAT), 0.3, Y_PLAT);
  });
  m.scope("paving", () => {
    // square slabs with 4 cm joints, cut round the plinth and the flower beds
    const holes: Box2[] = [
      { x0: -PLINTH.hx - 0.06, x1: PLINTH.hx + 0.06, z0: PLINTH.z0 - 0.06, z1: PLINTH.z1 + 0.06 },
      ...[-1, 1].map((s) => ({ x0: s * BED.x - BED.w / 2 - 0.05, x1: s * BED.x + BED.w / 2 + 0.05, z0: BED.z - BED.d / 2 - 0.05, z1: BED.z + BED.d / 2 + 0.05 })),
    ];
    const pitch = 1.2;
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const cx = -3.0 + i * pitch, cz = -3.0 + j * pitch;
        let parts: Box2[] = [{ x0: cx - 0.58, x1: cx + 0.58, z0: cz - 0.58, z1: cz + 0.58 }];
        for (const h of holes) parts = parts.flatMap((p) => cut(p, h));
        for (const p of parts) {
          if (p.x1 - p.x0 < 0.08 || p.z1 - p.z0 < 0.08) continue;
          m.box("granitePale", (p.x0 + p.x1) / 2, (p.z0 + p.z1) / 2, p.x1 - p.x0, p.z1 - p.z0, Y_PLAT, Y_PAVE, 0);
        }
      }
    }
  });
}

/** The bollards in order round the enclosure, from the front left entrance post to the front right one. */
const POSTS: Array<[number, number]> = [
  [-1.35, POST], [-POST, POST], [-POST, 0], [-POST, -POST], [0, -POST], [POST, -POST], [POST, 0], [POST, POST], [1.35, POST],
];

const CHAIN_Y = 0.92; // where the chains hang from the posts

function bollard(m: MeshBuilder, x: number, z: number): void {
  m.box("granite", x, z, 0.36, 0.36, Y_PLAT, 0.56);
  m.box("granite", x, z, 0.26, 0.26, 0.56, 1.02, 0, false);
  m.loft("granite", rect(0.26, 0.26, x, z), 1.02, rect(0.32, 0.32, x, z), 1.08, false);
  m.prism("granite", rect(0.32, 0.32, x, z), 1.08, 1.12, false);
  m.spire("granite", rect(0.32, 0.32, x, z), 1.12, 1.27);
}

/** A sagging chain between two posts: flat links along a parabola, every other one turned a quarter. */
function chain(m: MeshBuilder, a: [number, number], b: [number, number]): void {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const dir: Vec3 = [dx / len, 0, dz / len];
  // start and end on the posts' faces (0.13 from their axes)
  const s0 = 0.12, s1 = len - 0.12;
  const sag = 0.06 * len;
  const P = (s: number): Vec3 => {
    const t = s / len;
    return [a[0] + dir[0] * s, CHAIN_Y - sag * 4 * t * (1 - t), a[1] + dir[2] * s];
  };
  const pitch = 0.15;
  const count = Math.round((s1 - s0) / pitch);
  const step = (s1 - s0) / count;
  const horiz: Vec3 = [-dir[2], 0, dir[0]];
  for (let i = 0; i < count; i++) {
    const sa = s0 + i * step, sb = sa + step;
    const pa = P(sa - 0.025), pb = P(sb + 0.025);
    const c = mul(add(pa, pb), 0.5);
    const t = unit(sub(pb, pa));
    const half = Math.hypot(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]) / 2;
    const across = i % 2 === 0 ? unit(cross(horiz, t)) : horiz; // in the vertical plane, then the flat one
    const thick = unit(cross(t, across));
    const w = 0.025, th = 0.008;
    const o = sub(c, mul(thick, th));
    const outline: Vec3[] = [
      add(o, mul(t, -half)), add(add(o, mul(t, -half * 0.6)), mul(across, w)), add(add(o, mul(t, half * 0.6)), mul(across, w)),
      add(o, mul(t, half)), add(add(o, mul(t, half * 0.6)), mul(across, -w)), add(add(o, mul(t, -half * 0.6)), mul(across, -w)),
    ];
    m.slab("iron", outline, mul(thick, 2 * th));
  }
}

function enclosure(m: MeshBuilder): void {
  m.scope("bollards", () => {
    for (const [x, z] of POSTS) bollard(m, x, z);
  });
  m.scope("chains", () => {
    for (let i = 0; i + 1 < POSTS.length; i++) chain(m, POSTS[i]!, POSTS[i + 1]!);
  });
}

// --- the pedestal ---------------------------------------------------------------------

const DIE = 2.3; // the die's side
const DIE_Y0 = 1.32, DIE_Y1 = 3.22;

/** A tiny integer hash for the names' lengths (deterministic, platform independent). */
const hash = (i: number): number => ((i * 7919 + 104729) % 997) / 997;

/**
 * A dark name tablet on the die face whose outward normal is n: a polished plate
 * standing 4 cm proud, a gilt heading and two columns of gilt raised blocks for the names.
 */
function nameTablet(m: MeshBuilder, n: Vec3, seed: number, rows: number, y0: number, y1: number): void {
  const u: Vec3 = [-n[2], 0, n[0]];
  const face = DIE / 2;
  const c: Vec3 = mul(n, face);
  const hw = 0.82;
  const P = (s: number, y: number, out: number): Vec3 => add(add(c, mul(u, s)), [n[0] * out, y, n[2] * out]);
  m.slab("tablet", [P(-hw, y0, 0.04), P(hw, y0, 0.04), P(hw, y1, 0.04), P(-hw, y1, 0.04)], mul(n, -0.1));
  // the heading (a dedication line), then the names
  const hy = y1 - 0.16;
  m.slab("gilt", [P(-0.5, hy, 0.055), P(0.5, hy, 0.055), P(0.5, hy + 0.07, 0.055), P(-0.5, hy + 0.07, 0.055)], mul(n, -0.025));
  const pitch = (hy - 0.12 - y0) / rows;
  for (let col = 0; col < 2; col++) {
    for (let r = 0; r < rows; r++) {
      const len = 0.26 + 0.3 * hash(seed * 131 + col * 37 + r);
      const s0 = col === 0 ? -0.72 : 0.08;
      const y = hy - 0.12 - (r + 0.5) * pitch;
      m.slab("gilt", [P(s0, y, 0.055), P(s0 + len, y, 0.055), P(s0 + len, y + 0.045, 0.055), P(s0, y + 0.045, 0.055)], mul(n, -0.025));
    }
  }
}

function pedestal(m: MeshBuilder): void {
  const zc = (PLINTH.z0 + PLINTH.z1) / 2, d = PLINTH.z1 - PLINTH.z0;
  m.scope("plinth", () => {
    m.prism("graniteDark", rect(2 * PLINTH.hx, d, 0, zc), Y_PLAT, 0.84);
    m.loft("granite", rect(2 * PLINTH.hx - 0.1, d - 0.1, 0, zc), 0.84, rect(2 * PLINTH.hx - 0.36, d - 0.36, 0, zc), 0.92);
    m.prism("granite", rect(2 * PLINTH.hx - 0.4, d - 0.4, 0, zc), 0.92, DIE_Y0);
  });
  m.scope("die", () => {
    m.prism("granite", rect(DIE, DIE), DIE_Y0, DIE_Y1, false);
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const n: Vec3 = [Math.sin(a), 0, Math.cos(a)];
      m.scope(`name tablet ${k + 1}`, () => nameTablet(m, n, k, k === 0 ? 8 : 11, k === 0 ? 1.55 : 1.5, 3.02));
    }
  });
  m.scope("cornice", () => {
    m.loft("granite", rect(DIE, DIE), DIE_Y1, rect(2.6, 2.6), 3.34, false);
    m.prism("granite", rect(2.6, 2.6), 3.34, 3.5);
  });
  m.scope("obelisk base", () => {
    m.prism("graniteDark", rect(1.7, 1.7), 3.5, 4.32, false);
    m.loft("granite", rect(1.7, 1.7), 4.32, rect(1.84, 1.84), 4.4, false);
    m.prism("granite", rect(1.84, 1.84), 4.4, 4.5);
    // the bronze laurel wreath relief on the front, a ribbon tied under it
    wreath(m, "bronze", [0, 3.93, 0.85 + 0.05], [1, 0, 0], [0, 1, 0], 0.27, 9);
    for (const s of [-1, 1]) {
      const z = 0.85 + 0.012;
      m.slab("bronze", [[s * 0.03, 3.66, z], [s * 0.16, 3.6, z], [s * 0.22, 3.62, z], [s * 0.08, 3.69, z]], [0, 0, -0.02]);
      m.slab("bronze", [[s * 0.16, 3.6, z + 0.004], [s * 0.2, 3.6, z + 0.004], [s * 0.26, 3.56, z + 0.004], [s * 0.21, 3.55, z + 0.004]], [0, 0, -0.03]);
    }
  });
}

// --- the obelisk -------------------------------------------------------------------------

const OB_Y0 = 4.5, OB_Y1 = 8.18, OB_TOP = 8.75;
const OB_HW0 = 0.6, OB_HW1 = 0.36;
const obHw = (y: number): number => OB_HW0 + ((y - OB_Y0) / (OB_Y1 - OB_Y0)) * (OB_HW1 - OB_HW0);

/** A gilt plate on the obelisk's front face from (x0, y0) to (x1, y1), `out` proud of it. */
function obPlate(m: MeshBuilder, x0: number, x1: number, y0: number, y1: number, out: number): void {
  m.slab("gilt", [[x0, y0, obHw(y0) + out], [x1, y0, obHw(y0) + out], [x1, y1, obHw(y1) + out], [x0, y1, obHw(y1) + out]], [0, 0, -out - 0.03]);
}

function obelisk(m: MeshBuilder): void {
  m.scope("shaft", () => {
    m.loft("granite", rect(2 * OB_HW0, 2 * OB_HW0), OB_Y0, rect(2 * OB_HW1, 2 * OB_HW1), OB_Y1, false);
    m.loft("granite", rect(2 * OB_HW1, 2 * OB_HW1), OB_Y1, rect(2 * OB_HW1 + 0.06, 2 * OB_HW1 + 0.06), OB_Y1 + 0.04, false);
    m.prism("granite", rect(2 * OB_HW1 + 0.06, 2 * OB_HW1 + 0.06), OB_Y1 + 0.04, OB_Y1 + 0.1, false);
    m.spire("granite", rect(2 * OB_HW1 + 0.06, 2 * OB_HW1 + 0.06), OB_Y1 + 0.1, OB_TOP);
  });
  m.scope("gilt cross", () => {
    obPlate(m, -0.055, 0.055, 6.55, 7.65, 0.02);
    obPlate(m, -0.24, 0.24, 7.2, 7.31, 0.032);
  });
  m.scope("dates", () => {
    // "1914" and "1918" as two rows of four gilt figures, a bar between them
    for (const [row, y] of [[0, 5.95], [1, 5.62]] as const) {
      for (let i = 0; i < 4; i++) {
        const x = -0.27 + i * 0.15 + (row === 1 && i === 3 ? 0.005 : 0);
        obPlate(m, x, x + 0.09, y, y + 0.17, 0.02);
      }
    }
    obPlate(m, -0.2, 0.2, 5.84, 5.87, 0.02);
  });
}

// --- the soldier --------------------------------------------------------------------

/**
 * A soldier h tall standing on y0 at (cx, cz), facing +Z: boots, the greatcoat lofted
 * from oval sections, belt and pouches, the bowed head under a helmet, the rifle
 * standing on its butt in front of him and both hands folded on its muzzle.
 */
function soldier(m: MeshBuilder, cx: number, cz: number, y0: number, h: number): void {
  const L = (s: number, y: number, f: number): Vec3 => [cx + s * h, y0 + y * h, cz + f * h];
  m.scope("boots", () => {
    for (const s of [-1, 1]) {
      const x = cx + s * 0.07 * h;
      m.loft("bronzeDark", ellipse(8, 0.05 * h, 0.085 * h, x, cz + 0.025 * h), y0, ellipse(8, 0.045 * h, 0.06 * h, x, cz + 0.01 * h), y0 + 0.07 * h, false);
      m.loft("bronze", ellipse(8, 0.045 * h, 0.06 * h, x, cz + 0.01 * h), y0 + 0.07 * h, ellipse(8, 0.05 * h, 0.055 * h, x, cz), y0 + 0.3 * h, false);
    }
  });
  m.scope("greatcoat", () => {
    // [height, half width, half depth, forward]
    const secs: Array<[number, number, number, number]> = [
      [0.27, 0.17, 0.135, 0.0], [0.45, 0.148, 0.108, 0.0], [0.58, 0.132, 0.097, 0.006], [0.7, 0.152, 0.1, 0.012], [0.78, 0.172, 0.096, 0.006], [0.82, 0.07, 0.06, 0.03],
    ];
    const ring = (i: number): Ring => {
      const [, a, b, f] = secs[i]!;
      return ellipse(12, a * h, b * h, cx, cz + f * h);
    };
    m.cap("bronze", ring(0), y0 + secs[0]![0] * h, false);
    for (let i = 0; i + 1 < secs.length; i++) {
      m.loft("bronze", ring(i), y0 + secs[i]![0] * h, ring(i + 1), y0 + secs[i + 1]![0] * h, i + 2 === secs.length);
    }
    // the coat's front skirts parted over the legs: a shallow fold down the front
    m.slab("bronzeDark", [L(-0.012, 0.29, 0.128), L(0.012, 0.29, 0.128), L(0.012, 0.56, 0.093), L(-0.012, 0.56, 0.093)], [0, 0, -0.02 * h]);
  });
  m.scope("belt and pouches", () => {
    m.prism("bronzeDark", ellipse(12, 0.137 * h, 0.103 * h, cx, cz + 0.006 * h), y0 + 0.565 * h, y0 + 0.6 * h);
    for (const s of [-1, 1]) m.box("bronzeDark", cx + s * 0.075 * h, cz + 0.1 * h, 0.06 * h, 0.04 * h, y0 + 0.535 * h, y0 + 0.59 * h);
    // the haversack on the left hip
    m.box("bronzeDark", cx - 0.14 * h, cz - 0.01 * h, 0.04 * h, 0.1 * h, y0 + 0.44 * h, y0 + 0.56 * h);
  });
  m.scope("head", () => {
    blob(m, "bronze", L(0, 0.868, 0.062), 0.052 * h, 0.062 * h, 0.058 * h, 8, 4);
    // the helmet: a dome and a wide brim, tipped forward with the bowed head
    blob(m, "bronzeDark", L(0, 0.893, 0.058), 0.064 * h, 0.044 * h, 0.07 * h, 10, 4);
    blob(m, "bronzeDark", L(0, 0.88, 0.07), 0.092 * h, 0.01 * h, 0.098 * h, 10, 2);
  });
  m.scope("rifle", () => {
    m.box("bronzeDark", cx + 0.005 * h, cz + 0.19 * h, 0.03 * h, 0.08 * h, y0, y0 + 0.12 * h);
    m.loft("bronzeDark", rect(0.028 * h, 0.07 * h, cx + 0.005 * h, cz + 0.19 * h), y0 + 0.12 * h, rect(0.022 * h, 0.03 * h, cx + 0.005 * h, cz + 0.19 * h), y0 + 0.22 * h, false);
    pipe(m, "bronzeDark", [L(0.005, 0.22, 0.19), L(0.005, 0.66, 0.175)], 0.011 * h, 6, [1, 0, 0]);
  });
  m.scope("arms", () => {
    for (const s of [-1, 1]) {
      pipe(m, "bronze", [L(s * 0.15, 0.765, 0.0), L(s * 0.175, 0.66, 0.06), L(s * 0.1, 0.645, 0.15), L(s * 0.03, 0.655, 0.17)], 0.036 * h, 7, [0, 0, 1]);
      blob(m, "bronze", L(s * 0.018, 0.66, 0.175), 0.026 * h, 0.022 * h, 0.03 * h, 6, 3);
    }
  });
}

// --- wreaths and flower beds --------------------------------------------------------

/** A bronze wreath leaning back against the plinth's front at x. */
function floorWreath(m: MeshBuilder, x: number, r: number): void {
  const tilt = 0.32; // radians back from upright
  const e2: Vec3 = [0, Math.cos(tilt), -Math.sin(tilt)];
  const c: Vec3 = [x, Y_PAVE - 0.02 + r * Math.cos(tilt) + r * 0.11, PLINTH.z1 + 0.03 + r * Math.sin(tilt) + 0.1];
  wreath(m, "bronze", c, [1, 0, 0], e2, r, 11);
}

function flowerBed(m: MeshBuilder, x: number): void {
  m.box("granite", x, BED.z, BED.w, BED.d, Y_PLAT, 0.62);
  m.box("soil", x, BED.z, BED.w - 0.16, BED.d - 0.16, 0.62, 0.65);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 2; j++) {
      const px = x - 0.48 + i * 0.24 + (j ? 0.12 : 0), pz = BED.z - 0.15 + j * 0.3;
      blob(m, "foliage", [px, 0.7, pz], 0.12, 0.08, 0.12, 6, 3, i + j);
      blob(m, "flower", [px + 0.02, 0.79, pz - 0.01], 0.05, 0.035, 0.05, 5, 3);
    }
  }
}

/** The war memorial, 8.75 m tall on its 10 m stepped and paved square. */
export function warMemorial(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("war memorial", () => {
    m.scope("platform", () => platform(m));
    m.scope("enclosure", () => enclosure(m));
    m.scope("pedestal", () => pedestal(m));
    m.scope("obelisk", () => obelisk(m));
    m.scope("soldier", () => {
      // the figure's own low granite base on the plinth's front
      m.box("graniteDark", 0, 1.95, 0.84, 0.78, DIE_Y0, DIE_Y0 + 0.1);
      soldier(m, 0, 1.9, DIE_Y0 + 0.1, 2.1);
    });
    m.scope("wreaths", () => {
      floorWreath(m, -0.95, 0.3);
      floorWreath(m, 0.95, 0.26);
    });
    m.scope("flower beds", () => {
      flowerBed(m, -BED.x);
      flowerBed(m, BED.x);
    });
  });
  return m;
}

/** The low level of detail: the steps, the bollards, the pedestal, the obelisk and the soldier as blocks. */
export function warMemorialLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.prism("granitePale", rect(10.0, 10.0), 0, 0.3);
  m.prism("granite", rect(PLAT, PLAT), 0.3, Y_PLAT);
  for (const [x, z] of POSTS) {
    if (x !== 0 && z !== 0) m.prism("graniteDark", rect(0.3, 0.3, x, z), Y_PLAT, 1.15);
  }
  const zc = (PLINTH.z0 + PLINTH.z1) / 2, d = PLINTH.z1 - PLINTH.z0;
  m.prism("graniteDark", rect(2 * PLINTH.hx, d, 0, zc), Y_PLAT, DIE_Y0);
  m.prism("tablet", rect(DIE + 0.08, DIE + 0.08), DIE_Y0, DIE_Y1, false);
  m.loft("granite", rect(DIE + 0.08, DIE + 0.08), DIE_Y1, rect(2.6, 2.6), 3.5);
  m.prism("graniteDark", rect(1.84, 1.84), 3.5, OB_Y0, false);
  m.loft("granite", rect(1.84, 1.84), OB_Y0, rect(2 * OB_HW1, 2 * OB_HW1), OB_Y1, false);
  m.spire("granite", rect(2 * OB_HW1, 2 * OB_HW1), OB_Y1, OB_TOP);
  // the soldier as a tapered block with a helmet cap
  m.loft("bronze", rect(0.7, 0.62, 0, 2.0), DIE_Y0, rect(0.66, 0.4, 0, 1.92), DIE_Y0 + 1.82);
  m.loft("bronzeDark", rect(0.34, 0.36, 0, 1.98), DIE_Y0 + 1.82, rect(0.2, 0.2, 0, 1.98), DIE_Y0 + 2.08);
  return m;
}

export const WAR_MEMORIAL: ProceduralDesign[] = [
  { id: "bld-war-memorial", game: { plaza: { cities: ["village", "town"] } }, title: "War Memorial", build: warMemorial, buildLod: warMemorialLod, references: "war-memorial", catalog: PLAZA_CATALOG },
];
