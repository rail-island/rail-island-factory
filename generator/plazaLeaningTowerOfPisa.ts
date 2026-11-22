// The Leaning Tower of Pisa, the free-standing campanile of Pisa Cathedral
// (docs/models/plaza-landmarks.md), a landmark the game may stand in the middle of
// a round town or city square. After the photos in assets/leaning-tower-of-pisa/
// and the Wikipedia article "Leaning Tower of Pisa".
//
// A round marble tower of eight storeys, 15.48 m across the base: a ground storey
// of 15 blind arches on engaged columns with lozenges in the lunettes and the door,
// six open galleries (loggias) of 30 columns each - real open arches with the inner
// wall set back behind the gallery floor, its stair doors, and a projecting cornice
// between storeys - the iron railing round the terrace of the sixth, and the
// narrower bell chamber with twelve open arches, seven bronze bells on their timber
// headstocks inside, its cornice and the railing of the roof. The ground storey's
// wall carries faint grey bands of marble. The tower stands on a small paved round
// plinth (27 m) with an inlaid ring and a low kerb.
//
// The lean: the whole tower is drawn upright and turned 3.97 degrees about the z
// axis through the origin, toward +X (south in reality). Its foot is a drum whose
// lower edge is cut so it lies exactly on y = 0 after the turn, so the base sits on
// the ground on every side and the lowest vertex is y = 0. About 56.3 m high on the
// high (-X) side, 55.9 m to the top railing on the low side; the top stands about
// 3.9 m out over +X.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin. Deterministic:
// the same code gives the same bytes. The id is what the game's saved maps store,
// so the design is never renamed.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodLoft } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  marble: { color: "#ece7dc", roughness: 0.6 },
  marbleGrey: { color: "#c9c5bc", roughness: 0.65 },
  marbleIn: { color: "#bdb5a6", roughness: 0.75 },
  inlay: { color: "#8d8c88", roughness: 0.6 },
  dark: { color: "#3a3631", roughness: 0.9 },
  paving: { color: "#d9d2c2", roughness: 0.9 },
  paveGrey: { color: "#9c978d", roughness: 0.85 },
  bronze: { color: "#5e7262", metallic: 0.6, roughness: 0.45 },
  timber: { color: "#8a3f2a", roughness: 0.8 },
  iron: { color: "#2c2c2c", metallic: 0.4, roughness: 0.6 },
};

// --- dimensions (metres, before the lean) ------------------------------------------

const LEAN = (3.97 * Math.PI) / 180;
const COS_L = Math.cos(LEAN);
const SIN_L = Math.sin(LEAN);
const TAN_L = Math.tan(LEAN);

const N = 60; // facets of every ring (2 per gallery bay, 4 per ground bay)
const R0 = 7.74; // outer radius of the ground storey's arcade (15.48 m across)
const R_FOOT = 7.94; // the base moulding
const R_CORE = 7.5; // the wall behind the blind arches
const Y_FOOT = 0.6;
const Y_MOULD = 0.9;
const G_BAYS = 15;
const G_ROT = (18 * Math.PI) / 180; // a ground bay's middle faces +Z (the door)
const G_SPRING = 9.0;
const G_HALF = 1.22; // half span of a blind arch (m)
const G_TOP = 10.8;
const G_STOREY = 11.6; // floor of the first gallery

const L_BAYS = 30;
const LOGGIAS = 6;
const L_H = 6.15; // storey height of a gallery
const R_WALL = 6.16; // the inner wall behind the galleries
const R_COL = 7.35; // the column ring
const R_ARC_O = 7.65; // the arcade's outer face
const R_ARC_I = 7.05; // its inner face
const L_HALF = 0.52; // half span of a gallery arch (m)
const L_SPRING = 4.25; // spring above the floor
const L_TOP = 5.1; // top of the arcade above the floor
const R_FASCIA = 7.72;
const R_CORNICE = 7.95;
const FASCIA_H = 0.6;

const Y_BELL = G_STOREY + LOGGIAS * L_H; // the terrace the bell chamber stands on
const R_BELL = 5.3;
const R_BELL_I = 4.1;
const B_BAYS = 12;
const B_SILL = 0.6;
const B_SPRING = 4.1;
const B_HALF = 0.95;
const B_TOP = 6.1;
const B_FASCIA = 0.4;
const B_CORNICE = 0.4;
const Y_ROOF = Y_BELL + B_TOP + B_FASCIA + B_CORNICE;
const RAIL_H = 1.0;

const R_PLINTH = 13.5;
const Y_PAVE = 0.12;

// --- helpers --------------------------------------------------------------------

/** The point at radius r, plan angle a (counter-clockwise from +X seen from above, as `ngon`), height y. */
const P = (r: number, a: number, y: number): Vec3 => [r * Math.cos(a), y, -r * Math.sin(a)];
const radial = (a: number): Vec3 => [Math.cos(a), 0, -Math.sin(a)];
/** The unit tangent toward increasing angle. */
const tangent = (a: number): Vec3 => [-Math.sin(a), 0, -Math.cos(a)];
const ring = (r: number, rot = 0): Ring => ngon(N, r, rot);
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];

/** The tower turned by the lean: about the z axis through the origin, the top toward +X. */
const lean = ([x, y, z]: Vec3): Vec3 => [x * COS_L + y * SIN_L, -x * SIN_L + y * COS_L, z];

/** A quad wound so its face looks along n. */
function quadN(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (f[0] * n[0] + f[1] * n[1] + f[2] * n[2] >= 0) m.quad(mat, a, b, c, d);
  else m.quad(mat, a, d, c, b);
}

/** A flat ring between radii r0 < r1 at height y, facing up or down. */
function annulus(m: MeshBuilder, mat: string, r0: number, r1: number, y: number, up: boolean, n = N, rot = 0): void {
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const b = rot + ((i + 1) / n) * Math.PI * 2;
    quadN(m, mat, P(r0, a, y), P(r0, b, y), P(r1, b, y), P(r1, a, y), [0, up ? 1 : -1, 0]);
  }
}

/** The walls of a ring of radius r from y0 to y1 facing out (or in). */
function drum(m: MeshBuilder, mat: string, r: number, y0: number, y1: number, out = true, n = N, rot = 0): void {
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const b = rot + ((i + 1) / n) * Math.PI * 2;
    const nr = radial((a + b) / 2);
    quadN(m, mat, P(r, a, y0), P(r, b, y0), P(r, b, y1), P(r, a, y1), out ? nr : mul(nr, -1));
  }
}

interface Arcade {
  mat: string;
  bays: number;
  rot: number; // angle of the first pier's middle
  ro: number;
  ri: number; // the inner face's radius (the soffits run to it)
  inner: boolean; // draw the inner face and the jambs
  y0: number;
  sill: number;
  spring: number;
  top: number;
  half: number; // half span of an opening, metres at radius rm
  rm: number;
  segs: number;
}

/**
 * A round wall from y0 to top pierced by a round-headed opening in every bay: the
 * outer face, the inner face (when `inner`), the jambs, sills and arch soffits.
 * Bay b runs between the piers at rot + b * step and rot + (b + 1) * step.
 */
function arcade(m: MeshBuilder, A: Arcade): void {
  const step = (Math.PI * 2) / A.bays;
  const h = A.half / A.rm;
  const rise = A.half;
  for (let b = 0; b < A.bays; b++) {
    const s = A.rot + b * step;
    const e = s + step;
    const mid = s + step / 2;
    const a0 = mid - h;
    const a1 = mid + h;
    const arch: Array<[number, number]> = [];
    for (let k = 0; k <= A.segs; k++) {
      const t = (k / A.segs) * Math.PI;
      arch.push([mid - h * Math.cos(t), A.spring + rise * Math.sin(t)]);
    }
    const faces: Array<[number, number]> = A.inner ? [[A.ro, 1], [A.ri, -1]] : [[A.ro, 1]];
    for (const [r, sg] of faces) {
      const face = (aa: number, ab: number, y0: number, y1: number, yb1 = y0): void => {
        quadN(m, A.mat, P(r, aa, y0), P(r, ab, yb1), P(r, ab, y1), P(r, aa, y1), mul(radial((aa + ab) / 2), sg));
      };
      face(s, a0, A.y0, A.top);
      face(a1, e, A.y0, A.top);
      if (A.sill > A.y0) face(a0, a1, A.y0, A.sill);
      for (let k = 0; k < A.segs; k++) {
        const [pa, ya] = arch[k]!;
        const [pb, yb] = arch[k + 1]!;
        face(pa, pb, ya, A.top, yb);
      }
    }
    // the soffit of the arch, from the outer face to the inner one
    for (let k = 0; k < A.segs; k++) {
      const [pa, ya] = arch[k]!;
      const [pb, yb] = arch[k + 1]!;
      const c = P((A.ro + A.ri) / 2, mid, A.spring);
      const q = P((A.ro + A.ri) / 2, (pa + pb) / 2, (ya + yb) / 2);
      quadN(m, A.mat, P(A.ro, pa, ya), P(A.ro, pb, yb), P(A.ri, pb, yb), P(A.ri, pa, ya), [c[0] - q[0], c[1] - q[1], c[2] - q[2]]);
    }
    if (A.inner && A.spring > A.sill) {
      quadN(m, A.mat, P(A.ro, a0, A.sill), P(A.ri, a0, A.sill), P(A.ri, a0, A.spring), P(A.ro, a0, A.spring), tangent(a0));
      quadN(m, A.mat, P(A.ro, a1, A.sill), P(A.ri, a1, A.sill), P(A.ri, a1, A.spring), P(A.ro, a1, A.spring), mul(tangent(a1), -1));
      quadN(m, A.mat, P(A.ro, a0, A.sill), P(A.ro, a1, A.sill), P(A.ri, a1, A.sill), P(A.ri, a0, A.sill), [0, 1, 0]);
    }
  }
}

/** A flat convex outline standing on the plane square to `a` at radius r, as (along-tangent, y) points. */
function panel(m: MeshBuilder, mat: string, r: number, a: number, pts: Array<[number, number]>, depth: number): void {
  const c = P(r, a, 0);
  const t = tangent(a);
  m.slab(mat, pts.map(([u, y]) => add(add(c, mul(t, u)), [0, y, 0])), mul(radial(a), -depth));
}

/** An iron railing round a ring: posts and a top rail. */
function railing(m: MeshBuilder, r: number, y: number, posts: number, rot = 0): void {
  m.scope("top rail", () => {
    drum(m, "iron", r + 0.03, y + RAIL_H - 0.06, y + RAIL_H, true, posts, rot);
    drum(m, "iron", r - 0.03, y + RAIL_H - 0.06, y + RAIL_H, false, posts, rot);
    annulus(m, "iron", r - 0.03, r + 0.03, y + RAIL_H, true, posts, rot);
    annulus(m, "iron", r - 0.03, r + 0.03, y + RAIL_H - 0.06, false, posts, rot);
  });
  m.scope("mid rail", () => {
    drum(m, "iron", r + 0.015, y + 0.45, y + 0.49, true, posts, rot);
    drum(m, "iron", r - 0.015, y + 0.45, y + 0.49, false, posts, rot);
  });
  m.scope("posts", () => {
    for (let i = 0; i < posts; i++) {
      const a = rot + (i / posts) * Math.PI * 2;
      const [x, , z] = P(r, a, 0);
      m.box("iron", x, z, 0.05, 0.05, y, y + RAIL_H - 0.06, a + Math.PI / 2, false);
    }
  });
}

// --- parts ----------------------------------------------------------------------

function plinth(m: MeshBuilder): void {
  m.scope("plinth", () => {
    m.scope("paving", () => {
      m.prism("paving", ngon(N, R_PLINTH - 0.4), 0, Y_PAVE);
    });
    m.scope("inlaid ring", () => {
      drum(m, "paveGrey", 10.6, Y_PAVE, Y_PAVE + 0.03, true);
      drum(m, "paveGrey", 9.8, Y_PAVE, Y_PAVE + 0.03, false);
      annulus(m, "paveGrey", 9.8, 10.6, Y_PAVE + 0.03, true);
    });
    m.scope("inlaid rays", () => {
      for (let i = 0; i < 16; i++) {
        const a = ((i + 0.5) / 16) * Math.PI * 2;
        const r = radial(a);
        const t = tangent(a);
        const p0 = mul(r, 10.7);
        const p1 = mul(r, 11.3);
        const p2 = mul(r, 12.8);
        const y = Y_PAVE + 0.02;
        m.slab("paveGrey", [add(p0, [0, y, 0]), add(add(p1, mul(t, 0.4)), [0, y, 0]), add(p2, [0, y, 0]), add(add(p1, mul(t, -0.4)), [0, y, 0])], [0, -0.05, 0]);
      }
    });
    m.scope("kerb", () => {
      drum(m, "marbleGrey", R_PLINTH, 0, 0.4, true);
      drum(m, "marbleGrey", R_PLINTH - 0.4, Y_PAVE, 0.4, false);
      annulus(m, "marbleGrey", R_PLINTH - 0.4, R_PLINTH, 0.4, true);
    });
  });
}

/** The foot: a drum whose lower edge lies on y = 0 once the tower is turned by the lean. */
function foot(m: MeshBuilder): void {
  m.scope("foot", () => {
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const b = ((i + 1) / N) * Math.PI * 2;
      const ya = R_FOOT * Math.cos(a) * TAN_L;
      const yb = R_FOOT * Math.cos(b) * TAN_L;
      quadN(m, "marbleGrey", P(R_FOOT, a, ya), P(R_FOOT, b, yb), P(R_FOOT, b, Y_FOOT), P(R_FOOT, a, Y_FOOT), radial((a + b) / 2));
    }
    annulus(m, "marbleGrey", 7.8, R_FOOT, Y_FOOT, true);
    drum(m, "marble", 7.8, Y_FOOT, Y_MOULD, true);
    annulus(m, "marble", R_CORE - 0.05, 7.8, Y_MOULD, true);
  });
}

function groundStorey(m: MeshBuilder): void {
  const step = (Math.PI * 2) / G_BAYS;
  m.scope("ground storey", () => {
    m.scope("wall", () => {
      // white marble with faint grey bands
      const bands: Array<[number, number, string]> = [
        [Y_MOULD, 2.6, "marbleIn"], [2.6, 2.75, "paveGrey"], [2.75, 4.6, "marbleIn"], [4.6, 4.75, "paveGrey"],
        [4.75, 6.6, "marbleIn"], [6.6, 6.75, "paveGrey"], [6.75, 8.6, "marbleIn"], [8.6, 8.75, "paveGrey"], [8.75, G_TOP, "marbleIn"],
      ];
      for (const [y0, y1, mat] of bands) drum(m, mat, R_CORE, y0, y1, true);
    });
    m.scope("blind arches", () => {
      arcade(m, { mat: "marble", bays: G_BAYS, rot: G_ROT, ro: R0, ri: R_CORE - 0.06, inner: false, y0: G_SPRING, sill: G_SPRING, spring: G_SPRING, top: G_TOP, half: G_HALF, rm: R0, segs: 10 });
    });
    m.scope("engaged columns", () => {
      for (let i = 0; i < G_BAYS; i++) {
        const a = G_ROT + i * step;
        const rc = 7.56;
        const [x, , z] = P(rc, a, 0);
        m.scope(`column ${i + 1}`, () => {
          m.box("marble", x, z, 0.78, 0.6, Y_MOULD, Y_MOULD + 0.3, a + Math.PI / 2);
          m.loft("marble", ngon(10, 0.36, 0, x, z), Y_MOULD + 0.3, ngon(10, 0.3, 0, x, z), Y_MOULD + 0.5, false);
          m.prism("marble", ngon(10, 0.3, 0, x, z), Y_MOULD + 0.5, G_SPRING - 0.65, false);
          m.loft("marble", ngon(10, 0.3, 0, x, z), G_SPRING - 0.65, ngon(10, 0.44, 0, x, z), G_SPRING - 0.18, false);
          m.box("marble", x, z, 0.98, 0.75, G_SPRING - 0.18, G_SPRING, a + Math.PI / 2);
        });
      }
    });
    m.scope("lozenges", () => {
      for (let i = 0; i < G_BAYS; i++) {
        const a = G_ROT + (i + 0.5) * step;
        const yc = G_SPRING + G_HALF - 0.7;
        panel(m, "inlay", R_CORE + 0.04, a, [[-0.5, yc], [0, yc + 0.5], [0.5, yc], [0, yc - 0.5]], 0.08);
        panel(m, "marbleGrey", R_CORE + 0.07, a, [[-0.22, yc], [0, yc + 0.22], [0.22, yc], [0, yc - 0.22]], 0.04);
      }
    });
    m.scope("door", () => {
      const a = -Math.PI / 2;
      const pts: Array<[number, number]> = [[-0.75, Y_MOULD + 0.02], [0.75, Y_MOULD + 0.02], [0.75, 3.38], [-0.75, 3.38]];
      panel(m, "dark", R_CORE + 0.03, a, pts, 0.08);
      panel(m, "marbleGrey", R_CORE + 0.06, a, [[-1.0, 3.4], [1.0, 3.4], [1.0, 3.7], [-1.0, 3.7]], 0.1);
    });
    cornice(m, G_TOP, G_STOREY, R_CORE - 0.1, R_WALL, 7.84, 8.02);
  });
}

/**
 * The cornice from the top of an arcade (yt) to the next floor (yf): the ceiling
 * under it back to rIn, a fascia, the projecting moulding and the floor of the
 * gallery above, from rUp out.
 */
function cornice(m: MeshBuilder, yt: number, yf: number, rIn: number, rUp: number, rF = R_FASCIA, rC = R_CORNICE): void {
  m.scope("cornice", () => {
    annulus(m, "marble", rIn, rF, yt, false);
    drum(m, "marble", rF, yt, yt + FASCIA_H, true);
    annulus(m, "marble", rF, rC, yt + FASCIA_H, false);
    drum(m, "marble", rC, yt + FASCIA_H, yf, true);
    if (rUp > 0) annulus(m, "marble", rUp, rC, yf, true);
    else m.cap("marble", ring(rC), yf);
  });
}

function loggia(m: MeshBuilder, k: number): void {
  const yb = G_STOREY + k * L_H;
  const step = (Math.PI * 2) / L_BAYS;
  const ys = yb + L_SPRING;
  const yt = yb + L_TOP;
  m.scope(`gallery ${k + 1}`, () => {
    m.scope("inner wall", () => drum(m, "marbleIn", R_WALL, yb, yt, true));
    m.scope("stair doors", () => {
      for (const b of [(k * 7 + 3) % L_BAYS, (k * 7 + 18) % L_BAYS]) {
        const a = (b + 0.5) * step;
        const pts: Array<[number, number]> = [[-0.45, yb + 0.02], [0.45, yb + 0.02], [0.45, yb + 1.9], [0.32, yb + 2.2], [0, yb + 2.32], [-0.32, yb + 2.2], [-0.45, yb + 1.9]];
        panel(m, "dark", R_WALL + 0.03, a, pts, 0.06);
      }
    });
    m.scope("columns", () => {
      for (let i = 0; i < L_BAYS; i++) {
        const a = i * step;
        const [x, , z] = P(R_COL, a, 0);
        m.box("marble", x, z, 0.5, 0.5, yb, yb + 0.22, a + Math.PI / 2);
        m.prism("marble", ngon(8, 0.19, 0, x, z), yb + 0.22, ys - 0.5, false);
        m.loft("marble", ngon(8, 0.19, 0, x, z), ys - 0.5, ngon(8, 0.3, 0, x, z), ys - 0.14, false);
        m.box("marble", x, z, 0.62, 0.62, ys - 0.14, ys, a + Math.PI / 2);
      }
    });
    m.scope("arcade", () => {
      arcade(m, { mat: "marble", bays: L_BAYS, rot: 0, ro: R_ARC_O, ri: R_ARC_I, inner: true, y0: ys, sill: ys, spring: ys, top: yt, half: L_HALF, rm: R_COL, segs: 5 });
    });
    const last = k === LOGGIAS - 1;
    cornice(m, yt, yb + L_H, R_WALL - 0.05, last ? 0 : R_WALL);
  });
}

function bell(m: MeshBuilder, a: number, size: number): void {
  const c = P((R_BELL + R_BELL_I) / 2, a, 0);
  const yTop = Y_BELL + B_SPRING - 0.25;
  const prof: Array<[number, number]> = [[1, 0], [0.92, 0.12], [0.72, 0.35], [0.64, 0.7], [0.58, 0.95], [0.4, 1.0]];
  const ring8 = (r: number): Ring => ngon(10, r * size * 0.5, 0, c[0], c[2]);
  const y = (f: number): number => yTop - size + f * size;
  m.scope("bell", () => {
    for (let k = 0; k + 1 < prof.length; k++) m.loft("bronze", ring8(prof[k]![0]), y(prof[k]![1]), ring8(prof[k + 1]![0]), y(prof[k + 1]![1]), k + 2 === prof.length);
    m.cap("bronze", ring8(prof[0]![0]), y(0), false);
  });
  m.scope("headstock", () => {
    m.box("timber", c[0], c[2], 2 * B_HALF + 0.3, 0.32, yTop, yTop + 0.34, a + Math.PI / 2);
  });
}

function bellChamber(m: MeshBuilder): void {
  const yb = Y_BELL;
  const step = (Math.PI * 2) / B_BAYS;
  m.scope("bell chamber", () => {
    m.scope("arcade", () => {
      arcade(m, { mat: "marble", bays: B_BAYS, rot: 0, ro: R_BELL, ri: R_BELL_I, inner: true, y0: yb, sill: yb + B_SILL, spring: yb + B_SPRING, top: yb + B_TOP, half: B_HALF, rm: R_BELL, segs: 8 });
    });
    m.scope("grey bands", () => {
      // grey marble courses on the piers, standing a little proud
      for (let b = 0; b < B_BAYS; b++) {
        const a = b * step;
        for (const y of [1.4, 2.4, 3.4]) {
          const pts: Array<[number, number]> = [[-0.4, yb + y], [0.4, yb + y], [0.4, yb + y + 0.22], [-0.4, yb + y + 0.22]];
          panel(m, "marbleGrey", R_BELL + 0.03, a, pts, 0.06);
        }
      }
    });
    m.scope("ceiling", () => m.cap("marbleIn", ring(R_BELL + 0.1), yb + B_TOP, false));
    m.scope("cornice", () => {
      drum(m, "marble", R_BELL + 0.1, yb + B_TOP, yb + B_TOP + B_FASCIA, true);
      annulus(m, "marble", R_BELL + 0.1, R_BELL + 0.3, yb + B_TOP + B_FASCIA, false);
      drum(m, "marble", R_BELL + 0.3, yb + B_TOP + B_FASCIA, Y_ROOF, true);
      m.cap("marbleGrey", ring(R_BELL + 0.3), Y_ROOF);
    });
    m.scope("bells", () => {
      const sizes = [1.25, 0.95, 1.1, 0.85, 1.0, 0.9, 1.05];
      const bays = [0, 2, 3, 5, 7, 9, 10];
      bays.forEach((b, i) => m.scope(`bell ${i + 1}`, () => bell(m, (b + 0.5) * step, sizes[i]!)));
    });
    m.scope("roof railing", () => railing(m, R_BELL + 0.15, Y_ROOF, 24));
  });
}

export function leaningTowerOfPisa(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("leaning tower of pisa", () => {
    plinth(m);
    m.moved(lean, () => {
      m.scope("tower", () => {
        foot(m);
        groundStorey(m);
        for (let k = 0; k < LOGGIAS; k++) loggia(m, k);
        m.scope("terrace railing", () => railing(m, 7.8, Y_BELL, 30, Math.PI / 30));
        bellChamber(m);
      });
    });
  });
  return m;
}

export function leaningTowerOfPisaLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const n = 12;
  const lr = (r: number): Ring => ngon(n, r);
  m.prism("paving", ngon(n, R_PLINTH), 0, 0.4);
  m.moved(lean, () => {
    // the foot, its lower edge on y = 0 after the lean
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const b = ((i + 1) / n) * Math.PI * 2;
      quadN(m, "marbleGrey", P(R_FOOT, a, R_FOOT * Math.cos(a) * TAN_L), P(R_FOOT, b, R_FOOT * Math.cos(b) * TAN_L), P(R_FOOT, b, Y_MOULD), P(R_FOOT, a, Y_MOULD), radial((a + b) / 2));
    }
    m.cap("marbleGrey", lr(R_FOOT), Y_MOULD);
    m.prism("marble", lr(R0), Y_MOULD, G_TOP, false);
    // the galleries as bands: the shaded colonnade and the white arcade and cornice
    let y = G_TOP;
    for (let k = 0; k < LOGGIAS; k++) {
      const yb = G_STOREY + k * L_H;
      m.prism("marble", lr(R_FASCIA), y, yb + 0.3, false);
      m.prism("marbleIn", lr(R_FASCIA), yb + 0.3, yb + L_SPRING - 0.3, false);
      y = yb + L_SPRING - 0.3;
    }
    m.prism("marble", lr(R_FASCIA), y, Y_BELL);
    m.prism("marbleIn", lr(R_BELL), Y_BELL, Y_BELL + B_SPRING, false);
    lodLoft(m, "marble", lr(R_BELL), Y_BELL + B_SPRING, lr(R_BELL + 0.3), Y_ROOF);
  });
  return m;
}

export const LEANING_TOWER_OF_PISA: ProceduralDesign[] = [
  {
    id: "bld-leaning-tower-of-pisa",
    game: { plaza: { cities: ["town", "city"], layouts: ["radial"], round: true } },
    title: "Leaning Tower of Pisa",
    build: leaningTowerOfPisa,
    buildLod: leaningTowerOfPisaLod,
    references: "leaning-tower-of-pisa",
    catalog: PLAZA_CATALOG,
  },
];
