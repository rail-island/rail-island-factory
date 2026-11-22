// A Victorian cast-iron bandstand for a village or town square
// (docs/models/plaza-landmarks.md): the octagonal music pavilion of British parks
// and greens, after the photos in assets/bandstand/ (Eastleigh, Sefton Park,
// Horniman Gardens, Eastbourne).
//
// A raised brick plinth with stone coping and corner piers, a flight of steps on
// the +Z side between stone cheeks and iron handrails, a timber deck, eight
// slender cast-iron columns with bases, collars and flared capitals, a lacy
// railing between them (open at the steps), arched spandrels with lace bars and
// scrolls under the eaves beam, bracketed eaves with a dagger-board valance, an
// ogee bell roof lofted from octagonal rings with rolled hips, and a ball finial
// with a weather vane.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin, the steps
// facing +Z. About 9.7 m across the plinth corners, 10.3 m across the eaves and
// 8.7 m to the tip of the vane. Deterministic: the same code gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  brick: { color: "#9a4a36", roughness: 0.95 },
  stone: { color: "#cbbd9c", roughness: 0.9 },
  timber: { color: "#7a5a3c", roughness: 0.85 },
  iron: { color: "#2d5238", metallic: 0.4, roughness: 0.55 },
  cream: { color: "#eee4c8", metallic: 0.2, roughness: 0.6 },
  roof: { color: "#9a3b2e", metallic: 0.3, roughness: 0.55 },
  soffit: { color: "#d9cfb4", roughness: 0.8 },
  gilt: { color: "#c8a24e", metallic: 0.7, roughness: 0.35 },
  grille: { color: "#2a2a2a", metallic: 0.3, roughness: 0.7 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => add(a, mul(sub(b, a), t));

/** The two unit axes across the segment a -> b: `v` as close to `up` as it can be, `u` beside it. */
function frameOf(a: Vec3, b: Vec3, up: Vec3): { u: Vec3; v: Vec3 } {
  const d = unit(sub(b, a));
  let v = sub(up, mul(d, dot(up, d)));
  if (Math.hypot(v[0], v[1], v[2]) < 1e-6) v = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  v = unit(sub(v, mul(d, dot(v, d))));
  return { u: cross(d, v), v };
}

/** A straight bar from a to b, w wide and h deep across it; `up` turns its h side. */
function beam(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, w: number, h: number, up: Vec3 = [0, 1, 0]): void {
  const { u, v } = frameOf(a, b, up);
  const c = (su: number, sv: number): Vec3 => add(a, add(mul(u, (su * w) / 2), mul(v, (sv * h) / 2)));
  m.slab(mat, [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], sub(b, a));
}

/** An octagon of corner radius r with a flat side facing each of +-X and +-Z. */
const oct = (r: number, cx = 0, cz = 0): Ring => ngon(8, r, Math.PI / 8, cx, cz);
/** The plan angle of octagon corner i (the same corners as `oct`). */
const cornerAngle = (i: number): number => Math.PI / 8 + (i * Math.PI) / 4;
/** Corner i of the octagon of corner radius r at height y. */
const corner = (i: number, r: number, y: number): Vec3 => {
  const a = cornerAngle(i);
  return [r * Math.cos(a), y, -r * Math.sin(a)];
};
/** The side between corners i and i + 1 that faces +Z: the steps side. */
const STEP_SIDE = 5;

// --- dimensions -----------------------------------------------------------------

const R_PLINTH = 4.85; // corner radius of the brick plinth
const R_COPING = 4.95;
const DECK = 1.23; // deck top
const R_COL = 4.45; // corner radius of the column ring
const Y_BEAM = 4.3; // underside of the eaves beam
const Y_SOFFIT = 4.6;
const Y_EAVES = 4.85; // top of the fascia, foot of the roof
const R_EAVES = 5.15;
const STEP_W = 1.1; // half width of the flight
const STEPS = 5;
const RISER = 0.2;
const TREAD = 0.3;
const FACE_Z = R_PLINTH * Math.cos(Math.PI / 8);
const FACE_COPING = R_COPING * Math.cos(Math.PI / 8);

/**
 * The ogee bell's profile, [radius, height above the eaves] from the eaves to the
 * neck: a flared kick at the eaves, a full convex shoulder and a concave neck that
 * draws up to the finial (measured off the Eastleigh and Sefton Park photos).
 */
const PROFILE: Array<[number, number]> = [
  [5.15, 0], [4.7, 0.13], [4.2, 0.3], [3.7, 0.55], [3.2, 0.88], [2.7, 1.22], [2.2, 1.5],
  [1.7, 1.72], [1.25, 1.85], [0.9, 1.94], [0.65, 2.06], [0.45, 2.24], [0.32, 2.46],
];
const ROOF_RISE = PROFILE[PROFILE.length - 1]![1];
const R_ROOF_TOP = PROFILE[PROFILE.length - 1]![0];

/** The roof profile at s = 0 (eaves) .. 1 (neck): [radius, height]. */
function roofProfile(s: number): [number, number] {
  const f = s * (PROFILE.length - 1);
  const k = Math.min(PROFILE.length - 2, Math.floor(f));
  const t = f - k;
  const [r0, y0] = PROFILE[k]!;
  const [r1, y1] = PROFILE[k + 1]!;
  return [r0 + (r1 - r0) * t, Y_EAVES + y0 + (y1 - y0) * t];
}
const ROOF_RINGS = 12;

// --- parts ----------------------------------------------------------------------

function plinth(m: MeshBuilder): void {
  m.scope("plinth", () => {
    m.scope("base course", () => m.prism("stone", oct(R_PLINTH + 0.08), 0, 0.22));
    m.scope("brick walls", () => m.prism("brick", oct(R_PLINTH), 0.22, 1.05, false));
    m.scope("coping", () => {
      m.prism("stone", oct(R_COPING), 1.05, 1.2);
      m.cap("stone", oct(R_COPING), 1.05, false);
    });
    m.scope("corner piers", () => {
      for (let i = 0; i < 8; i++) {
        const a = cornerAngle(i);
        const [x, , z] = corner(i, R_PLINTH - 0.04, 0);
        m.box("stone", x, z, 0.42, 0.42, 0.22, 1.05, -a + Math.PI / 4, false);
      }
    });
    m.scope("vent grilles", () => {
      for (let i = 0; i < 8; i++) {
        if (i === STEP_SIDE) continue;
        const a = cornerAngle(i) + Math.PI / 8;
        const n: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
        const t: Vec3 = [-n[2], 0, n[0]];
        const c = mul(n, FACE_Z + 0.025);
        for (const off of [-0.8, 0.8]) {
          const p = add(c, mul(t, off));
          m.slab("grille", [add(p, add(mul(t, -0.28), [0, 0.42, 0])), add(p, add(mul(t, 0.28), [0, 0.42, 0])), add(p, add(mul(t, 0.28), [0, 0.62, 0])), add(p, add(mul(t, -0.28), [0, 0.62, 0]))], mul(n, -0.04));
        }
      }
    });
    m.scope("deck", () => m.prism("timber", oct(R_COPING - 0.12), 1.2, DECK));
  });
}

function steps(m: MeshBuilder): void {
  m.scope("steps", () => {
    for (let k = 0; k < STEPS; k++) {
      const z0 = FACE_Z - 0.04;
      const z1 = FACE_Z + (STEPS - k) * TREAD;
      m.box("stone", 0, (z0 + z1) / 2, 2 * STEP_W + 0.04, z1 - z0, k * RISER, (k + 1) * RISER);
    }
    const zEnd = FACE_Z + STEPS * TREAD + 0.08;
    m.scope("cheeks", () => {
      for (const s of [-1, 1]) {
        const x = s * STEP_W;
        m.slab("stone", [[x, 0, FACE_Z - 0.04], [x, 0, zEnd], [x, 0.36, zEnd], [x, 1.2, FACE_Z + 0.12], [x, 1.2, FACE_Z - 0.04]], [s * 0.22, 0, 0]);
      }
    });
    m.scope("handrails", () => {
      for (const s of [-1, 1]) {
        const x = s * (STEP_W + 0.11);
        const top: Vec3 = [x, 1.2 + 0.95, FACE_Z + 0.05];
        const bot: Vec3 = [x, 0.36 + 0.9, zEnd - 0.12];
        m.rod("iron", [x, 1.2, FACE_Z + 0.05], top, 0.04, 6);
        m.rod("iron", [x, 0.36, zEnd - 0.12], add(bot, [0, 0.04, 0]), 0.04, 6);
        m.rod("iron", top, bot, 0.03, 6);
        const mid = lerp3([x, 1.2, FACE_Z + 0.05], [x, 0.36, zEnd - 0.12], 0.5);
        m.rod("iron", lerp3(top, bot, 0.5), mid, 0.018, 4);
        m.rod("gilt", add(top, [0, -0.02, 0]), add(top, [0, 0.1, 0]), 0.055, 6);
      }
    });
  });
}

function column(m: MeshBuilder, i: number): void {
  const [x, , z] = corner(i, R_COL, 0);
  const ry = -cornerAngle(i) + Math.PI / 4;
  m.scope(`column ${i + 1}`, () => {
    m.box("iron", x, z, 0.3, 0.3, DECK, DECK + 0.32, ry);
    m.loft("iron", oct(0.15, x, z), DECK + 0.32, oct(0.09, x, z), DECK + 0.45, false);
    m.prism("iron", oct(0.075, x, z), DECK + 0.45, 3.95, false);
    for (const y of [DECK + 0.95, 3.0]) m.prism("cream", oct(0.1, x, z), y, y + 0.07);
    m.loft("cream", oct(0.08, x, z), 3.95, oct(0.18, x, z), 4.2, false);
    m.box("cream", x, z, 0.38, 0.38, 4.2, Y_BEAM + 0.02, ry);
    // the eaves bracket, out under the overhang
    const a = cornerAngle(i);
    const n: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
    const t: Vec3 = [-n[2], 0, n[0]];
    const p = (r: number, y: number): Vec3 => add(mul(n, r), add([0, y, 0], mul(t, -0.025)));
    m.slab("cream", [p(R_COL + 0.1, 3.9), p(R_COL + 0.1, Y_SOFFIT + 0.02), p(R_EAVES - 0.1, Y_SOFFIT + 0.02)], mul(t, 0.05));
  });
}

/** One bay between columns i and i + 1: the railing (unless it is the steps side) and the spandrel. */
function bay(m: MeshBuilder, i: number): void {
  const A = corner(i, R_COL, 0);
  const B = corner((i + 1) % 8, R_COL, 0);
  const along = unit(sub(B, A));
  const len = Math.hypot(B[0] - A[0], B[2] - A[2]);
  const at = (u: number, y: number): Vec3 => [A[0] + along[0] * u, y, A[2] + along[2] * u];
  const inset = 0.12; // the clear of a column
  m.scope(`bay ${i + 1}`, () => {
    m.scope("railing", () => {
      const runs: Array<[number, number]> = i === STEP_SIDE
        ? [[inset, len / 2 - STEP_W - 0.05], [len / 2 + STEP_W + 0.05, len - inset]]
        : [[inset, len - inset]];
      for (const [u0, u1] of runs) {
        const yTop = DECK + 0.98;
        beam(m, "iron", at(u0, yTop), at(u1, yTop), 0.07, 0.06);
        beam(m, "iron", at(u0, DECK + 0.72), at(u1, DECK + 0.72), 0.04, 0.04);
        beam(m, "iron", at(u0, DECK + 0.12), at(u1, DECK + 0.12), 0.04, 0.05);
        const n = Math.max(2, Math.round((u1 - u0) / 0.19));
        for (let k = 1; k < n; k++) {
          const u = u0 + ((u1 - u0) * k) / n;
          beam(m, "iron", at(u, DECK), at(u, yTop - 0.03), 0.025, 0.025, [along[0], 0, along[2]]);
          // the lace: a diamond between the middle and top rails in every other gap
          if (k % 2 === 1 && k + 1 < n + 1) {
            const uc = u + (u1 - u0) / n / 2;
            const yc = DECK + 0.85;
            const d = 0.085;
            const off: Vec3 = mul(cross(along, [0, 1, 0]), 0.012);
            m.slab("iron", [add(at(uc - d, yc), off), add(at(uc, yc + d * 1.2), off), add(at(uc + d, yc), off), add(at(uc, yc - d * 1.2), off)], mul(off, -2));
          }
        }
        if (i === STEP_SIDE) {
          // the newel post at the opening
          const u = u0 < len / 2 ? u1 : u0;
          beam(m, "iron", at(u, DECK), at(u, DECK + 1.08), 0.08, 0.08, [along[0], 0, along[2]]);
          m.rod("gilt", at(u, DECK + 1.06), at(u, DECK + 1.16), 0.055, 6);
        }
      }
    });
    m.scope("eaves beam", () => beam(m, "iron", at(0, Y_BEAM + 0.17), at(len, Y_BEAM + 0.17), 0.12, 0.34));
    m.scope("spandrel", () => {
      const y0 = 3.72;
      const rise = 0.52;
      const arch = (u: number): Vec3 => at(u, y0 + rise * Math.sin((Math.PI * u) / len));
      const N = 10;
      for (let k = 0; k < N; k++) beam(m, "cream", arch((len * k) / N), arch((len * (k + 1)) / N), 0.05, 0.06);
      for (let k = 1; k < N; k++) {
        if (k === 5) continue;
        const p = arch((len * k) / N);
        if (Y_BEAM - p[1] > 0.08) beam(m, "cream", add(p, [0, 0.02, 0]), at((len * k) / N, Y_BEAM + 0.01), 0.03, 0.03, [along[0], 0, along[2]]);
      }
      // a scroll in each haunch
      for (const uc of [0.17 * len, 0.83 * len]) {
        const c = at(uc, 4.13);
        const r = 0.11;
        const S = 6;
        for (let k = 0; k < S; k++) {
          const a0 = (k / S) * Math.PI * 2;
          const a1 = ((k + 1) / S) * Math.PI * 2;
          const p0 = add(c, add(mul(along, r * Math.cos(a0)), [0, r * Math.sin(a0), 0]));
          const p1 = add(c, add(mul(along, r * Math.cos(a1)), [0, r * Math.sin(a1), 0]));
          beam(m, "cream", p0, p1, 0.04, 0.035, sub(c, lerp3(p0, p1, 0.5)));
        }
      }
      // the drop at the crown
      const top = at(len / 2, y0 + rise);
      m.slab("cream", [add(top, [0, 0.05, 0]), add(top, mul(along, 0.07)), add(top, [0, -0.16, 0]), add(top, mul(along, -0.07))], mul(cross(along, [0, 1, 0]), 0.04));
    });
  });
}

function roof(m: MeshBuilder): void {
  m.scope("roof", () => {
    m.scope("soffit", () => m.cap("soffit", oct(R_EAVES), Y_SOFFIT, false));
    m.scope("fascia", () => m.prism("cream", oct(R_EAVES), Y_SOFFIT, Y_EAVES, false));
    m.scope("valance", () => {
      for (let i = 0; i < 8; i++) {
        const A = corner(i, R_EAVES - 0.04, 0);
        const B = corner((i + 1) % 8, R_EAVES - 0.04, 0);
        const along = unit(sub(B, A));
        const len = Math.hypot(B[0] - A[0], B[2] - A[2]);
        const out = mul(cross([0, 1, 0], along), 1);
        const n = 11;
        const w = (len - 0.2) / n;
        for (let k = 0; k < n; k++) {
          const u = 0.1 + k * w;
          const p = (uu: number, y: number): Vec3 => [A[0] + along[0] * uu, y, A[2] + along[2] * uu];
          m.slab("cream", [p(u + 0.01, Y_SOFFIT + 0.03), p(u + w - 0.01, Y_SOFFIT + 0.03), p(u + w - 0.01, Y_SOFFIT - 0.12), p(u + w / 2, Y_SOFFIT - 0.3), p(u + 0.01, Y_SOFFIT - 0.12)], mul(out, -0.025));
        }
      }
    });
    const rings: Array<[number, number]> = [];
    for (let k = 0; k <= ROOF_RINGS; k++) rings.push(roofProfile(k / ROOF_RINGS));
    m.scope("bell", () => {
      for (let k = 0; k < ROOF_RINGS; k++) {
        const [r0, y0] = rings[k]!;
        const [r1, y1] = rings[k + 1]!;
        m.loft("roof", oct(r0), y0, oct(r1), y1, false);
      }
    });
    m.scope("hip rolls", () => {
      for (let i = 0; i < 8; i++) {
        for (let k = 0; k < ROOF_RINGS; k++) {
          const [r0, y0] = rings[k]!;
          const [r1, y1] = rings[k + 1]!;
          m.rod("cream", corner(i, r0 + 0.01, y0 + 0.02), corner(i, r1 + 0.01, y1 + 0.02), 0.05, 4, false);
        }
      }
    });
    m.scope("eaves band", () => {
      // a cream band a little above the eaves, standing proud of the bell
      const [ra, ya] = roofProfile(0.06);
      const [rb, yb] = roofProfile(0.16);
      for (let i = 0; i < 8; i++) {
        const a0 = corner(i, ra, ya);
        const a1 = corner((i + 1) % 8, ra, ya);
        const b0 = corner(i, rb, yb);
        const b1 = corner((i + 1) % 8, rb, yb);
        const nrm = unit(cross(sub(a1, a0), sub(b0, a0)));
        const up = dot(nrm, [0, 1, 0]) > 0 ? nrm : mul(nrm, -1);
        const lift = mul(up, 0.025);
        m.slab("cream", [add(a0, lift), add(a1, lift), add(b1, lift), add(b0, lift)], mul(up, -0.05));
      }
    });
  });
}

function finial(m: MeshBuilder): void {
  const yTop = Y_EAVES + ROOF_RISE;
  m.scope("finial", () => {
    m.prism("cream", oct(R_ROOF_TOP + 0.04), yTop - 0.04, yTop + 0.16);
    m.loft("roof", oct(0.36), yTop + 0.16, oct(0.12), yTop + 0.42, false);
    // the ball
    const yc = yTop + 0.6;
    const rb = 0.2;
    const lat = [-0.8, -0.35, 0.35, 0.8];
    let prev = oct(0.12);
    let prevY = yTop + 0.42;
    for (const la of lat) {
      const r = rb * Math.cos(la);
      const y = yc + rb * Math.sin(la);
      m.loft("gilt", prev, prevY, oct(r), y, false);
      prev = oct(r);
      prevY = y;
    }
    m.loft("gilt", prev, prevY, oct(0.04), yc + rb, true);
    m.rod("gilt", [0, yc + rb - 0.02, 0], [0, yTop + 1.2, 0], 0.025, 6);
    m.spire("gilt", oct(0.05), yTop + 1.2, yTop + 1.4);
    m.scope("weather vane", () => {
      const yv = yTop + 1.05;
      beam(m, "gilt", [-0.62, yv, 0], [0.62, yv, 0], 0.025, 0.04);
      m.slab("gilt", [[0.62, yv - 0.1, 0], [0.82, yv, 0], [0.62, yv + 0.1, 0]], [0, 0, 0.02]);
      m.slab("gilt", [[-0.62, yv - 0.02, 0], [-0.5, yv - 0.02, 0], [-0.44, yv + 0.2, 0], [-0.68, yv + 0.2, 0]], [0, 0, 0.02]);
      const yc2 = yTop + 0.88;
      beam(m, "gilt", [-0.4, yc2, 0], [0.4, yc2, 0], 0.025, 0.025);
      beam(m, "gilt", [0, yc2, -0.4], [0, yc2, 0.4], 0.025, 0.025);
      for (const p of [[0.42, 0], [-0.42, 0], [0, 0.42], [0, -0.42]] as const) m.box("gilt", p[0], p[1], 0.07, 0.07, yc2 - 0.05, yc2 + 0.06);
    });
  });
}

export function bandstand(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("bandstand", () => {
    plinth(m);
    steps(m);
    m.scope("columns", () => {
      for (let i = 0; i < 8; i++) column(m, i);
    });
    m.scope("bays", () => {
      for (let i = 0; i < 8; i++) bay(m, i);
    });
    roof(m);
    finial(m);
  });
  return m;
}

export function bandstandLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.prism("brick", oct(R_COPING), 0, 1.05, false);
  m.cap("brick", oct(R_COPING), 0, false);
  m.prism("stone", oct(R_COPING), 1.05, 1.2, false);
  m.cap("timber", oct(R_COPING), 1.2);
  for (let k = 0; k < STEPS; k += 2) {
    const z1 = FACE_Z + (STEPS - k) * TREAD;
    lodBox(m, "stone", 0, (FACE_COPING + z1) / 2, 2 * STEP_W, z1 - FACE_COPING, 0, Math.min(1.2, (k + 2) * RISER));
  }
  for (let i = 0; i < 8; i++) {
    const [x, , z] = corner(i, R_COL, 0);
    lodBox(m, "iron", x, z, 0.16, 0.16, 1.2, Y_SOFFIT);
  }
  // the railing as a low band and the eaves
  m.loft("iron", oct(R_COL - 0.02), DECK + 0.6, oct(R_COL - 0.02), DECK + 1.0, false);
  m.loft("iron", oct(R_COL - 0.06), DECK + 1.0, oct(R_COL - 0.06), DECK + 0.6, false);
  m.prism("cream", oct(R_EAVES), Y_SOFFIT - 0.2, Y_EAVES, false);
  m.cap("cream", oct(R_EAVES), Y_SOFFIT - 0.2, false);
  const rings = [0, 0.25, 0.5, 0.75, 1].map(roofProfile);
  for (let k = 0; k + 1 < rings.length; k++) m.loft("roof", oct(rings[k]![0]), rings[k]![1], oct(rings[k + 1]![0]), rings[k + 1]![1], k + 2 === rings.length);
  const yTop = Y_EAVES + ROOF_RISE;
  m.spire("gilt", oct(0.2), yTop, yTop + 1.4);
  return m;
}

export const BANDSTAND: ProceduralDesign[] = [
  { id: "bld-bandstand", game: { plaza: { cities: ["village", "town"] } }, title: "Bandstand", build: bandstand, buildLod: bandstandLod, references: "bandstand", catalog: PLAZA_CATALOG },
];
