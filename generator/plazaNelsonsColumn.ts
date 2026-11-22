// Nelson's Column, Trafalgar Square, London (docs/models/plaza-landmarks.md), from the
// photos in assets/nelsons-column/ and Wikipedia "Nelson's Column".
//
// A granite flight of five steps 25 m square on all four sides carries the square
// pedestal: a base course, the die with its four raised bronze reliefs (the battles
// of Cape St Vincent, the Nile, Copenhagen and Trafalgar, figure masses and a ship's
// mast in each) and a cornice. On four plinths that project east and west from the
// pedestal's corners lie Landseer's four colossal bronze lions, recumbent with their
// forepaws stretched out and heads raised: body, haunches, mane, head with brow,
// muzzle, nose and chin, ears, and a tail curled round the hind foot. Above the
// pedestal stand the Attic base and the fluted Corinthian column of Dartmoor granite
// (3.2 m across at the foot), its bronze capital with three rows of acanthus leaves,
// corner volutes and fleurons under the abacus, the round drum, and the 5.3 m statue
// of Nelson: bicorne hat worn athwart, coat with epaulettes and skirts, the empty
// right sleeve pinned across his chest, his left hand on the sword, a coil of rope
// behind him. 51.6 m overall. The two fountains of the square are left out.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin; Nelson and the
// Trafalgar relief face +Z, the lions face +X and -X. Deterministic: the same code
// gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, chamferedRect, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  granite: { color: "#8f8c86", roughness: 0.9 },
  graniteDark: { color: "#77746e", roughness: 0.95 },
  graniteLight: { color: "#aaa79f", roughness: 0.85 },
  bronze: { color: "#3b3830", metallic: 0.6, roughness: 0.5 },
  bronzeDark: { color: "#2a2822", metallic: 0.55, roughness: 0.55 },
  statue: { color: "#b3aea3", roughness: 0.85 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

/** A circle of n points about (cx, cz), wound like ngon. */
const circle = (n: number, r: number, cx = 0, cz = 0): Ring => ngon(n, r, Math.PI / n, cx, cz);

/** A triangle wound so it faces away from `inside`. */
function triOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const n = cross(sub(b, a), sub(c, a));
  const g: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  if (dot(n, sub(g, inside)) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** A closed ellipsoid of radii rx, ry, rz about c: `lon` meridians, `lat` bands. */
function blob(m: MeshBuilder, mat: string, c: Vec3, rx: number, ry: number, rz: number, lon = 8, lat = 4): void {
  const P = (phi: number, th: number): Vec3 => [c[0] + rx * Math.sin(phi) * Math.cos(th), c[1] + ry * Math.cos(phi), c[2] + rz * Math.sin(phi) * Math.sin(th)];
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
 * A round tube of radius r (or radii per point) along the points `pts`, `n` sides,
 * its rings square to the path; closed ends unless `loop` joins the last point to
 * the first. `ref` is a direction the path never runs along.
 */
function pipe(m: MeshBuilder, mat: string, pts: Vec3[], r: number | number[], n: number, ref: Vec3, loop = false): void {
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

/** A ring across a figure facing +Z: half width a, half depth b, its centre moved `back` along Z. */
function figRing(cx: number, cz: number, a: number, b: number, n = 10, back = 0): Ring {
  const ring: Ring = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    ring.push([cx + a * Math.cos(t), cz - b * Math.sin(t) + back]);
  }
  return ring;
}

// --- the steps and the pedestal ------------------------------------------------------

const STEP_RISE = 0.18;
const STEP_W = [25.0, 24.6, 24.2, 23.8, 23.4];
const Y_PLAT = STEP_RISE * STEP_W.length; // 0.9, the platform's top
const DIE_HALF = 4.4; // the pedestal die's half width
const Y_DIE0 = 2.4;
const Y_DIE1 = 9.4;
const Y_PED = 10.3; // the pedestal's top

function steps(m: MeshBuilder): void {
  STEP_W.forEach((w, i) => m.box(i % 2 === 0 ? "graniteDark" : "granite", 0, 0, w, w, i * STEP_RISE, (i + 1) * STEP_RISE));
}

/** One relief panel on the die face whose outward normal is n: the bronze plate and its figure masses. */
function relief(m: MeshBuilder, k: number, n: Vec3): void {
  const u: Vec3 = [-n[2], 0, n[0]]; // across the face, left to right seen from outside
  const yc = (Y_DIE0 + Y_DIE1) / 2 + 0.35;
  const half = 2.7;
  const face = DIE_HALF + 0.09;
  const at = (s: number, y: number, d = 0): Vec3 => add(add(mul(n, face + d), mul(u, s)), [0, y, 0]);
  m.scope("plate", () => {
    m.slab("bronzeDark", [at(-half, yc - half), at(half, yc - half), at(half, yc + half), at(-half, yc + half)], mul(n, -0.18));
    // a heavier frame bead along the bottom, the ground the figures stand on
    m.slab("bronze", [at(-half + 0.05, yc - half + 0.05, 0.05), at(half - 0.05, yc - half + 0.05, 0.05), at(half - 0.05, yc - half + 0.3, 0.05), at(-half + 0.05, yc - half + 0.3, 0.05)], mul(n, -0.12));
  });
  const ground = yc - half + 0.3;
  // a spar running up across the scene and a furled sail in an upper corner, mirrored on alternate panels
  m.scope("ship", () => {
    const g = k % 2 === 0 ? 1 : -1;
    m.slab("bronze", [at(-g * 2.3, yc - 0.6, 0.03), at(-g * 2.15, yc - 0.85, 0.03), at(g * 0.6, yc + 2.0, 0.03), at(g * 0.45, yc + 2.2, 0.03)], mul(n, -0.1));
    m.slab("bronze", [at(g * 0.2, yc + 2.45, 0.02), at(g * 2.5, yc + 2.45, 0.02), at(g * 2.5, yc + 0.4, 0.02), at(g * 1.2, yc + 0.9, 0.02)], mul(n, -0.1));
  });
  // the figures: [position across, height, lean, arm (-1 down, 0 forward, 1 raised)]
  const crowds: Array<Array<[number, number, number, number]>> = [
    [[-2.2, 3.0, 0.1, 1], [-1.4, 3.2, 0, 0], [-0.5, 3.3, -0.1, 1], [0.4, 3.1, 0.1, -1], [1.3, 3.3, 0, 1], [2.2, 3.0, -0.1, 0]],
    [[-2.2, 3.1, 0, 0], [-1.3, 3.3, -0.1, 1], [-0.4, 3.0, 0.1, -1], [0.5, 3.3, 0, 1], [1.4, 3.1, 0.1, 0], [2.2, 3.2, 0, 1]],
    [[-2.2, 3.2, 0.05, 1], [-1.4, 3.0, 0, -1], [-0.5, 3.3, 0, 0], [0.4, 3.2, 0.1, 1], [1.3, 3.0, -0.05, 0], [2.2, 3.3, 0, 1]],
    [[-2.2, 3.2, 0, 0], [-1.45, 3.0, 0.1, 1], [-0.7, 3.25, 0, -1], [0.9, 3.35, -0.1, 1], [1.65, 3.1, 0.05, 1], [2.3, 3.3, 0, 0]],
  ];
  m.scope("figures", () => {
    for (const [s, h, lean, arm] of crowds[k]!) {
      blob(m, "bronze", at(s, ground + h * 0.27, 0.0), 0.3, h * 0.27, 0.2, 6, 3); // legs and skirts
      blob(m, "bronze", at(s + lean * 0.5, ground + h * 0.62, 0.02), 0.38, h * 0.2, 0.24, 6, 3); // the torso
      blob(m, "bronze", at(s + lean, ground + h * 0.88, 0.06), 0.17, 0.2, 0.17, 6, 3);
      const sh = at(s + lean * 0.5 + 0.3, ground + h * 0.74, 0.12);
      const hand = arm > 0 ? at(s + 0.75, ground + h * 1.02, 0.15) : arm < 0 ? at(s + 0.45, ground + h * 0.42, 0.15) : at(s + 0.9, ground + h * 0.7, 0.2);
      pipe(m, "bronze", [sh, hand], 0.09, 4, [0, 1, 0]);
    }
    if (k === 3) {
      // the dying Nelson, held up on the deck in the middle of the Trafalgar panel
      blob(m, "bronze", at(0.05, ground + 0.75, 0.1), 0.85, 0.42, 0.22, 8, 3);
      blob(m, "bronze", at(-0.75, ground + 1.2, 0.14), 0.19, 0.2, 0.17, 6, 3);
    }
  });
  m.scope("inscription", () => {
    m.slab("bronzeDark", [at(-2.4, Y_DIE0 + 0.4, -0.04), at(2.4, Y_DIE0 + 0.4, -0.04), at(2.4, Y_DIE0 + 0.68, -0.04), at(-2.4, Y_DIE0 + 0.68, -0.04)], mul(n, -0.1));
  });
}

function pedestal(m: MeshBuilder): void {
  m.scope("base course", () => {
    m.prism("granite", rect(10.4, 10.4), Y_PLAT, 1.6, false);
    m.loft("graniteLight", rect(10.4, 10.4), 1.6, rect(9.6, 9.6), 1.9, false);
    m.prism("granite", rect(9.6, 9.6), 1.9, Y_DIE0);
  });
  m.scope("die", () => m.prism("graniteLight", rect(DIE_HALF * 2, DIE_HALF * 2), Y_DIE0, Y_DIE1, false));
  const names = ["the Nile", "Cape St Vincent", "Copenhagen", "Trafalgar"];
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const n: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
    m.scope(`relief ${names[k]}`, () => relief(m, k, n));
  }
  m.scope("cornice", () => {
    m.loft("granite", rect(DIE_HALF * 2, DIE_HALF * 2), Y_DIE1, rect(9.5, 9.5), 9.8, false);
    m.prism("granite", rect(9.5, 9.5), 9.8, Y_PED);
  });
}

// --- the lions -------------------------------------------------------------------------

const Y_LION = 2.6; // the plinths' top

/** A lion plinth reaching out from the pedestal along `sg` X at z = cz. */
function lionPlinth(m: MeshBuilder, sg: number, cz: number): void {
  const x0 = 4.6, x1 = 11.4;
  const cx = sg * (x0 + x1) / 2, len = x1 - x0;
  m.prism("granite", rect(len, 2.9, cx, cz), Y_PLAT, 2.3, false);
  m.loft("graniteLight", rect(len, 2.9, cx, cz), 2.3, rect(len + 0.2, 3.1, cx, cz), 2.45, false);
  m.prism("graniteLight", rect(len + 0.2, 3.1, cx, cz), 2.45, Y_LION);
}

/** A Landseer lion lying on its plinth at (cx, cz), facing along sg X (+1 or -1). */
function lion(m: MeshBuilder, cx: number, cz: number, sg: number): void {
  const L = (f: number, s: number, y: number): Vec3 => [cx + sg * f, Y_LION + y, cz + s * sg];
  const B = "bronze";
  m.scope("body", () => {
    blob(m, B, L(-0.7, 0, 0.88), 2.0, 0.95, 0.92, 10, 6);
    blob(m, B, L(0.85, 0, 1.3), 1.05, 1.15, 0.9, 10, 5); // the chest and shoulders
  });
  m.scope("haunches", () => {
    for (const s of [-1, 1]) {
      blob(m, B, L(-1.75, s * 0.55, 0.78), 0.95, 0.78, 0.45, 8, 4);
      blob(m, B, L(-0.75, s * 0.95, 0.16), 0.6, 0.19, 0.24, 7, 3); // the hind foot along the flank
    }
  });
  m.scope("forelegs", () => {
    for (const s of [-1, 1]) {
      pipe(m, B, [L(1.25, s * 0.55, 1.0), L(1.55, s * 0.58, 0.35), L(2.3, s * 0.55, 0.22), L(2.85, s * 0.52, 0.2)], [0.36, 0.3, 0.24, 0.22], 7, [0, 0, 1]);
      blob(m, B, L(3.1, s * 0.52, 0.17), 0.4, 0.2, 0.3, 8, 3); // the paw
    }
  });
  m.scope("mane", () => {
    blob(m, B, L(1.45, 0, 2.05), 0.9, 1.08, 1.0, 10, 5);
    blob(m, B, L(1.75, 0, 1.25), 0.62, 0.85, 0.8, 9, 4); // falling over the chest
    blob(m, B, L(0.6, 0, 2.0), 0.8, 0.55, 0.65, 8, 4); // down the neck to the back
  });
  m.scope("head", () => {
    blob(m, B, L(2.05, 0, 2.4), 0.62, 0.58, 0.56, 10, 5);
    blob(m, B, L(2.3, 0, 2.66), 0.35, 0.16, 0.48, 8, 3); // the brow
    blob(m, B, L(2.62, 0, 2.18), 0.4, 0.32, 0.34, 9, 4); // the muzzle
    blob(m, B, L(2.95, 0, 2.3), 0.16, 0.13, 0.17, 6, 3); // the nose
    blob(m, B, L(2.5, 0, 1.86), 0.32, 0.16, 0.25, 7, 3); // the chin and lower jaw
    for (const s of [-1, 1]) {
      blob(m, "bronzeDark", L(2.5, s * 0.25, 2.5), 0.08, 0.06, 0.08, 5, 3); // the eye
      blob(m, B, L(1.85, s * 0.42, 2.92), 0.12, 0.17, 0.14, 6, 3); // the ear
    }
  });
  m.scope("tail", () => {
    const pts = [L(-2.55, 0.1, 0.85), L(-2.9, 0.35, 0.45), L(-2.85, 0.8, 0.14), L(-2.2, 1.18, 0.11), L(-1.35, 1.25, 0.11)];
    pipe(m, B, pts, [0.16, 0.13, 0.12, 0.11, 0.11], 6, [0, 1, 0]);
    blob(m, B, L(-1.15, 1.25, 0.13), 0.28, 0.15, 0.17, 7, 3); // the tuft
  });
}

// --- the column --------------------------------------------------------------------------

const SHAFT_Y0 = 12.35;
const SHAFT_Y1 = 40.3;
const CAP_Y1 = 44.4; // the bell's top, under the abacus
const ABACUS_Y = 45.0;

/** The fluted shaft's section: n flutes, each a fillet at r and a V flute d deep. */
function fluted(r: number, d: number, n = 24): Ring {
  const ring: Ring = [];
  const fw = (0.22 * Math.PI) / n;
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    for (const [ang, rr] of [[a - fw, r], [a + fw, r], [a + Math.PI / n, r - d]] as const) ring.push([rr * Math.cos(ang), -rr * Math.sin(ang)]);
  }
  return ring;
}

function column(m: MeshBuilder): void {
  m.scope("plinth", () => {
    m.prism("granite", rect(6.0, 6.0), Y_PED, 11.2);
  });
  m.scope("base", () => {
    // the Attic base: a torus, a scotia, a smaller torus
    const prof: Array<[number, number]> = [[11.2, 2.4], [11.45, 2.5], [11.7, 2.35], [11.85, 2.05], [12.0, 2.0], [12.12, 2.1], [12.25, 1.95], [SHAFT_Y0, 1.75]];
    for (let i = 0; i + 1 < prof.length; i++) {
      const [y0, r0] = prof[i]!, [y1, r1] = prof[i + 1]!;
      m.loft("graniteLight", circle(32, r0), y0, circle(32, r1), y1, i + 2 === prof.length);
    }
  });
  m.scope("shaft", () => {
    const ym = (SHAFT_Y0 + SHAFT_Y1) / 2;
    m.loft("graniteLight", fluted(1.6, 0.11), SHAFT_Y0, fluted(1.55, 0.11), ym, false);
    m.loft("graniteLight", fluted(1.55, 0.11), ym, fluted(1.4, 0.1), SHAFT_Y1, false);
  });
}

/** An acanthus leaf on the bell at angle a: a curled solid wedge from yb to yt. */
function leaf(m: MeshBuilder, a: number, yb: number, yt: number, half: number, out: number, bell: (y: number) => number): void {
  const R = (ang: number, r: number, y: number): Vec3 => [Math.cos(ang) * r, y, -Math.sin(ang) * r];
  const bl = R(a - half, bell(yb) - 0.03, yb), br = R(a + half, bell(yb) - 0.03, yb);
  const ym = yb + (yt - yb) * 0.55;
  const ml = R(a - half * 0.95, bell(ym) + 0.06, ym), mr = R(a + half * 0.95, bell(ym) + 0.06, ym);
  const belly = R(a, bell(ym) + out * 0.45, ym);
  const back = R(a, bell(yt) - 0.05, yt - 0.1);
  const tip = R(a, bell(yt) + out, yt);
  const droop = R(a, bell(yt) + out * 1.25, yt - (yt - yb) * 0.22);
  const inside = R(a, 0.2, (yb + yt) / 2);
  const T = (p: Vec3, q: Vec3, r: Vec3): void => triOut(m, "bronze", p, q, r, inside);
  T(bl, br, belly);
  T(bl, belly, ml);
  T(br, mr, belly);
  T(ml, belly, tip);
  T(mr, tip, belly);
  T(ml, tip, back);
  T(mr, back, tip);
  T(tip, droop, ml);
  T(tip, mr, droop);
  T(ml, droop, mr);
}

function capital(m: MeshBuilder): void {
  const bell = (y: number): number => 1.42 + ((y - SHAFT_Y1) / (CAP_Y1 - SHAFT_Y1)) * 0.72;
  m.scope("astragal", () => {
    m.prism("bronze", circle(32, 1.55), SHAFT_Y1 - 0.15, SHAFT_Y1 + 0.12, false);
  });
  m.scope("bell", () => m.loft("bronzeDark", circle(24, 1.42), SHAFT_Y1 + 0.12, circle(24, 2.14), CAP_Y1, false));
  m.scope("acanthus", () => {
    for (let i = 0; i < 8; i++) leaf(m, ((i + 0.5) / 8) * Math.PI * 2, SHAFT_Y1 + 0.15, SHAFT_Y1 + 1.6, 0.36, 0.55, bell);
    for (let i = 0; i < 8; i++) leaf(m, (i / 8) * Math.PI * 2, SHAFT_Y1 + 0.9, SHAFT_Y1 + 2.75, 0.34, 0.6, bell);
    for (let i = 0; i < 8; i++) leaf(m, ((i + 0.5) / 8) * Math.PI * 2, SHAFT_Y1 + 2.2, CAP_Y1 - 0.15, 0.22, 0.45, bell);
  });
  m.scope("volutes", () => {
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const o: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
      const P = (d: number, y: number): Vec3 => add(mul(o, d), [0, y, 0]);
      // a stalk rising out of the leaves and rolling into a spiral under the abacus corner
      pipe(m, "bronze", [P(1.9, 42.4), P(2.4, 43.5), P(2.95, 44.25), P(3.5, 44.2), P(3.62, 43.75), P(3.35, 43.5), P(3.12, 43.7), P(3.25, 43.92)], [0.2, 0.2, 0.2, 0.2, 0.19, 0.17, 0.15, 0.13], 6, [-o[2], 0, o[0]]);
    }
    for (let k = 0; k < 4; k++) {
      // the fleuron in the middle of each abacus face
      const a = (k * Math.PI) / 2;
      const o: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
      blob(m, "bronze", add(mul(o, 2.86), [0, 44.7, 0]), 0.28, 0.28, 0.28, 6, 3);
    }
  });
  m.scope("abacus", () => {
    const ab = chamferedRect(5.7, 5.7, 0.6);
    m.cap("bronzeDark", ab, CAP_Y1, false);
    m.loft("bronzeDark", ab, CAP_Y1, chamferedRect(5.95, 5.95, 0.65), ABACUS_Y);
  });
}

// --- the drum and Nelson ---------------------------------------------------------------

const DRUM_TOP = 46.15;
const NELSON_H = 5.3;

function drum(m: MeshBuilder): void {
  m.loft("granite", circle(24, 1.5), ABACUS_Y, circle(24, 1.35), 45.2, false);
  m.prism("granite", circle(24, 1.3), 45.2, 45.95, false);
  m.prism("bronzeDark", circle(24, 1.34), 45.72, 45.84, false); // the metal band
  m.loft("granite", circle(24, 1.3), 45.95, circle(24, 1.45), 46.05, false);
  m.prism("granite", circle(24, 1.45), 46.05, DRUM_TOP);
}

function nelson(m: MeshBuilder): void {
  const h = NELSON_H, y0 = DRUM_TOP;
  const L = (s: number, y: number, f: number): Vec3 => [s * h, y0 + y * h, f * h];
  const S = "statue";
  m.scope("feet", () => {
    m.box(S, -0.065 * h, 0.02 * h, 0.07 * h, 0.13 * h, y0 - 0.03, y0 + 0.03 * h);
    m.box(S, 0.065 * h, 0.04 * h, 0.07 * h, 0.13 * h, y0 - 0.03, y0 + 0.03 * h);
  });
  m.scope("legs", () => {
    for (const s of [-1, 1]) pipe(m, S, [L(s * 0.065, 0.02, 0.0), L(s * 0.065, 0.25, 0.0), L(s * 0.07, 0.5, -0.01)], [0.04 * h, 0.046 * h, 0.062 * h], 7, [0, 0, 1]);
  });
  m.scope("coat", () => {
    // the skirts, open in front over the breeches
    m.loft(S, figRing(0, 0, 0.15 * h, 0.075 * h, 10, -0.065 * h), y0 + 0.27 * h, figRing(0, 0, 0.13 * h, 0.075 * h, 10, -0.03 * h), y0 + 0.56 * h, false);
    m.cap(S, figRing(0, 0, 0.15 * h, 0.075 * h, 10, -0.065 * h), y0 + 0.27 * h, false);
    const secs: Array<[number, number, number]> = [[0.5, 0.115, 0.075], [0.62, 0.125, 0.08], [0.74, 0.15, 0.085], [0.8, 0.16, 0.08], [0.835, 0.055, 0.05]];
    for (let i = 0; i + 1 < secs.length; i++) {
      const [ya, a0, b0] = secs[i]!, [yb, a1, b1] = secs[i + 1]!;
      m.loft(S, figRing(0, 0, a0 * h, b0 * h), y0 + ya * h, figRing(0, 0, a1 * h, b1 * h), y0 + yb * h, i + 2 === secs.length);
    }
    for (const s of [-1, 1]) blob(m, S, L(s * 0.15, 0.8, 0), 0.05 * h, 0.022 * h, 0.045 * h, 6, 3); // the epaulettes
  });
  m.scope("head", () => {
    blob(m, S, L(0, 0.88, 0.005), 0.055 * h, 0.065 * h, 0.06 * h, 8, 4);
    // the bicorne, worn athwart, with its cockade
    const hat = [L(-0.17, 0.925, 0.05), L(0.17, 0.925, 0.05), L(0.115, 0.975, 0.05), L(0.04, 1.02, 0.05), L(-0.04, 1.02, 0.05), L(-0.115, 0.975, 0.05)];
    m.slab(S, hat, [0, 0, -0.1 * h]);
    blob(m, S, L(0.07, 0.99, 0.055), 0.03 * h, 0.03 * h, 0.012 * h, 5, 3);
  });
  m.scope("arms", () => {
    // the left arm down to the sword's hilt
    pipe(m, S, [L(0.15, 0.78, 0), L(0.19, 0.63, 0.01), L(0.215, 0.5, 0.06)], [0.04 * h, 0.036 * h, 0.032 * h], 7, [0, 0, 1]);
    blob(m, S, L(0.218, 0.475, 0.075), 0.03 * h, 0.035 * h, 0.03 * h, 6, 3);
    // the empty right sleeve, pinned across the chest
    pipe(m, S, [L(-0.15, 0.78, 0), L(-0.17, 0.7, 0.045), L(-0.08, 0.67, 0.088)], [0.036 * h, 0.03 * h, 0.024 * h], 6, [0, 1, 0]);
  });
  m.scope("sword", () => {
    pipe(m, S, [L(0.22, 0.47, 0.085), L(0.17, 0.005, 0.2)], [0.012 * h, 0.006 * h], 5, [1, 0, 0]);
    pipe(m, S, [L(0.18, 0.43, 0.1), L(0.26, 0.43, 0.08)], 0.008 * h, 4, [0, 1, 0]);
  });
  m.scope("rope", () => {
    // the coil of rope behind his right leg
    const cx = -0.085, cz = -0.09;
    for (let i = 0; i < 5; i++) {
      const y = 0.024 + i * 0.052;
      const r = 0.088 - i * 0.004;
      const pts: Vec3[] = [];
      for (let j = 0; j < 8; j++) {
        const t = (2 * Math.PI * j) / 8;
        pts.push(L(cx + r * Math.cos(t), y + (j / 8) * 0.01, cz - r * Math.sin(t)));
      }
      pipe(m, S, pts, 0.026 * h, 5, [0, 1, 0], true);
    }
  });
}

/** Nelson's Column, 51.6 m to the top of the hat, on its 25 m flight of steps. */
export function nelsonsColumn(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("nelsons column", () => {
    m.scope("steps", () => steps(m));
    m.scope("pedestal", () => pedestal(m));
    m.scope("lions", () => {
      for (const sg of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const cz = sz * 3.5;
          m.scope(`plinth ${sg > 0 ? "east" : "west"} ${sz > 0 ? "south" : "north"}`, () => lionPlinth(m, sg, cz));
          m.scope(`lion ${sg > 0 ? "east" : "west"} ${sz > 0 ? "south" : "north"}`, () => lion(m, sg * 7.85, cz, sg));
        }
      }
    });
    m.scope("column", () => column(m));
    m.scope("capital", () => capital(m));
    m.scope("drum", () => drum(m));
    m.scope("nelson", () => nelson(m));
  });
  return m;
}

/** The low level of detail: steps, pedestal, plinths and lions as blocks, the column, capital, drum and Nelson as a crude block. */
export function nelsonsColumnLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.box("graniteDark", 0, 0, 25.0, 25.0, 0, 0.45);
  m.box("granite", 0, 0, 24.2, 24.2, 0.45, Y_PLAT);
  m.box("granite", 0, 0, 10.4, 10.4, Y_PLAT, Y_DIE0);
  m.box("graniteLight", 0, 0, DIE_HALF * 2, DIE_HALF * 2, Y_DIE0, Y_DIE1, 0, false);
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const c: Vec3 = [Math.cos(a) * (DIE_HALF + 0.05), 5.9, -Math.sin(a) * (DIE_HALF + 0.05)];
    m.box("bronze", c[0], c[2], 5.4, 0.1, 3.2, 8.6, a);
  }
  m.box("granite", 0, 0, 9.5, 9.5, Y_DIE1, Y_PED);
  for (const sg of [-1, 1]) {
    for (const sz of [-1, 1]) {
      m.box("granite", sg * 8.0, sz * 3.5, 7.0, 3.1, Y_PLAT, Y_LION);
      // a lion: body, raised head and mane, paws
      m.box("bronze", sg * 7.3, sz * 3.5, 4.6, 1.8, Y_LION, Y_LION + 1.7);
      m.box("bronze", sg * 9.4, sz * 3.5, 1.4, 1.6, Y_LION + 1.0, Y_LION + 3.0);
      m.box("bronze", sg * 10.4, sz * 3.5, 1.9, 1.3, Y_LION, Y_LION + 0.4);
    }
  }
  m.box("granite", 0, 0, 6.0, 6.0, Y_PED, 11.2);
  m.loft("graniteLight", circle(8, 2.4), 11.2, circle(8, 1.7), SHAFT_Y0);
  m.loft("graniteLight", circle(8, 1.65), SHAFT_Y0, circle(8, 1.45), SHAFT_Y1, false);
  m.loft("bronzeDark", circle(8, 1.5), SHAFT_Y1, circle(8, 2.8), CAP_Y1, false);
  m.box("bronzeDark", 0, 0, 5.9, 5.9, CAP_Y1, ABACUS_Y);
  m.cap("bronzeDark", rect(5.9, 5.9), CAP_Y1, false);
  m.loft("granite", circle(8, 1.45), ABACUS_Y, circle(8, 1.35), DRUM_TOP);
  m.box("statue", 0, -0.2, 1.6, 1.3, DRUM_TOP, DRUM_TOP + 3.0);
  m.box("statue", 0, 0, 1.0, 0.8, DRUM_TOP + 3.0, DRUM_TOP + 4.85);
  m.box("statue", 0, 0, 1.8, 0.5, DRUM_TOP + 4.85, DRUM_TOP + 5.4);
  return m;
}

export const NELSONS_COLUMN: ProceduralDesign[] = [
  { id: "bld-nelsons-column", game: { plaza: { cities: ["city"] } }, title: "Nelson's Column", build: nelsonsColumn, buildLod: nelsonsColumnLod, references: "nelsons-column", catalog: PLAZA_CATALOG },
];
