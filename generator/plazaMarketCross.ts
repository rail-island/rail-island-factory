// An English late-Gothic market cross (a "buttercross") for a village or town square
// (docs/models/plaza-landmarks.md): a generic composite of the covered crosses of
// Chichester (1501), Malmesbury (c. 1490) and the Poultry Cross at Salisbury - the
// photos and the 1831 engraving in assets/market-cross/ - not a copy of any one of them.
//
// A three-step octagonal stone base 9.8 m across carries eight walls pierced by eight
// open pointed arches (real openings, 2 m wide and 3.5 m high) under hood moulds
// with finials, with a stepped, three-stage buttress at each of the eight corners that
// rises through the parapet into a crocketed pinnacle. Inside, a central octagonal
// pillar with a stone bench round its foot carries a fan of ribs spreading to the
// walls (the vault the market folk shelter under). Above the arches a moulded
// cornice and a pierced parapet with cresting run round a low lead roof; on it a
// stone attic with four clock faces (north, east, south, west), and from the eight
// pinnacles eight crocketed flying ribs rise as a crown to the central turret: an
// open lantern of eight colonnettes under a lead ogee cupola, a gilt ball and a
// cross on top - about 14.6 m overall.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin; the octagon's flat
// sides face the axes (a clock on each of +X, -X, +Z, -Z). Deterministic: the same
// code gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  step: { color: "#a9a291", roughness: 0.95 },
  limestone: { color: "#c8bea6", roughness: 0.92 },
  limestoneLight: { color: "#dad1bb", roughness: 0.88 },
  limestoneDark: { color: "#a69c86", roughness: 0.95 },
  lead: { color: "#5e6368", metallic: 0.2, roughness: 0.7 },
  dial: { color: "#ece6d4", roughness: 0.6 },
  gilt: { color: "#c9a240", metallic: 0.7, roughness: 0.35 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

const COS8 = Math.cos(Math.PI / 8);
const TAN8 = Math.tan(Math.PI / 8);

/** A regular octagon with flat sides facing the axes, `apo` from the centre to each side. */
const octagon = (apo: number): Ring => ngon(8, apo / COS8, Math.PI / 8);

/** The same ring wound the other way: a loft over it faces inward (a vault seen from below). */
const inward = (r: Ring): Ring => [...r].reverse();

/** The outward horizontal direction at angle a (ngon's convention: x = cos, z = -sin). */
const dirAt = (a: number): Vec3 => [Math.cos(a), 0, -Math.sin(a)];

/** A triangle wound so it faces away from `inside`. */
function triOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const n = cross(sub(b, a), sub(c, a));
  const g: Vec3 = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
  if (dot(n, sub(g, inside)) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** A planar quad wound so it faces away from `inside`. */
function quadOut(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, inside: Vec3): void {
  triOut(m, mat, a, b, c, inside);
  triOut(m, mat, a, c, d, inside);
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
 * A tube of radius r along the points `pts`, `n` sides, its rings square to the path,
 * closed ends. `ref` is a direction the path never runs along (it fixes the rings' turn).
 */
function pipe(m: MeshBuilder, mat: string, pts: Vec3[], r: number, n: number, ref: Vec3): void {
  const N = pts.length;
  const rings: Vec3[][] = [];
  for (let i = 0; i < N; i++) {
    const prev = pts[Math.max(0, i - 1)]!;
    const next = pts[Math.min(N - 1, i + 1)]!;
    const t = unit(sub(next, prev));
    const u = unit(cross(t, ref));
    const v = cross(t, u);
    const ring: Vec3[] = [];
    for (let k = 0; k < n; k++) {
      const a = (2 * Math.PI * k) / n;
      ring.push(add(pts[i]!, add(mul(u, r * Math.cos(a)), mul(v, r * Math.sin(a)))));
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
  for (const [i, inward2] of [[0, 1], [N - 1, N - 2]] as const) {
    const R = rings[i]!;
    const inside = add(pts[i]!, mul(unit(sub(pts[inward2]!, pts[i]!)), 0.01));
    for (let k = 1; k + 1 < n; k++) triOut(m, mat, R[0]!, R[k]!, R[k + 1]!, inside);
  }
}

/** A crocket: a small leaf-like tetrahedron at p pointing along `out` (and a little up). */
function crocket(m: MeshBuilder, mat: string, p: Vec3, out: Vec3, side: Vec3, s: number): void {
  const tip = add(p, add(mul(out, s), [0, s * 0.6, 0]));
  const a = add(p, mul(side, s * 0.45));
  const b = sub(p, mul(side, s * 0.45));
  const c = add(p, [0, -s * 0.6, 0]);
  const inside = add(mul(add(add(a, b), c), 1 / 3), mul(out, -0.01));
  const g = mul(add(add(add(a, b), c), tip), 0.25);
  triOut(m, mat, a, b, tip, g);
  triOut(m, mat, b, c, tip, g);
  triOut(m, mat, c, a, tip, g);
  triOut(m, mat, a, c, b, add(inside, mul(out, 0.02)));
}

// --- dimensions ---------------------------------------------------------------------

const STEP_APO = [4.9, 4.6, 4.3];
const STEP_H = 0.15;
const YP = 0.45; // the platform's top
const WALL_O = 3.6; // the walls' outer face, apothem
const WALL_I = 3.05; // their inner face
const RC = WALL_O / COS8; // a corner of the outer face from the centre
const ARCH_A = 1.0; // the arches' half span
const ARCH_R = 1.45; // the radius of each of a pointed arch's two arcs
const SPRING = YP + 2.1; // the arches' springing
const WALL_TOP = 4.95;
const VAULT_WALL = 4.45; // where the vault meets the walls
const VAULT_LOW = 3.6; // the vault's foot on the pillar's capital
const CORNICE = 5.25;
const PARAPET = 6.0;
const ATTIC_APO = 2.2;
const ATTIC_Y0 = 6.0;
const ATTIC_Y1 = 7.7;
const SHAFT_APO = 0.95;
const LANTERN_Y0 = 9.8;
const LANTERN_Y1 = 11.2;

/** The corner k of the outer octagon (angle and direction). */
const cornerAngle = (k: number): number => Math.PI / 8 + (k * Math.PI) / 4;
/** The outward normal angle of side k (between corners k and k+1). */
const sideAngle = (k: number): number => Math.PI / 4 + (k * Math.PI) / 4;

/** The points of a pointed arch of half span a and arc radius r, left spring to right spring, as (u, y). */
function archPoints(a: number, r: number, spring: number, n: number): Array<[number, number]> {
  const off = r - a;
  const phiMax = Math.acos(off / r);
  // the left half: u from -a up to 0, its arc centred at u = +off
  const left: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const f = (phiMax * i) / n;
    left.push([i === n ? 0 : off - r * Math.cos(f), spring + r * Math.sin(f)]);
  }
  const right = left.slice(0, -1).reverse().map(([u, y]): [number, number] => [-u, y]);
  return [...left, ...right];
}

// --- the base and the arcade ----------------------------------------------------------

function steps(m: MeshBuilder): void {
  for (let i = 0; i < 3; i++) m.prism(i === 2 ? "limestoneDark" : "step", octagon(STEP_APO[i]!), i * STEP_H, (i + 1) * STEP_H);
}

/**
 * One wall of the octagon (side k): its outer and inner faces round a pointed arch,
 * the jambs' reveals and the arch's soffit, then the hood mould and its finial.
 */
function wall(m: MeshBuilder, k: number): void {
  const n = dirAt(sideAngle(k));
  const t: Vec3 = [-n[2], 0, n[0]];
  const T = WALL_O - WALL_I;
  // a point u along the side, at height y, d in from the outer face
  const L = (u: number, y: number, d: number): Vec3 => add(add(mul(n, WALL_O - d), mul(t, u)), [0, y, 0]);
  const arch = archPoints(ARCH_A, ARCH_R, SPRING, 6);
  const off = ARCH_R - ARCH_A;
  const face = (d: number, top: number, out: boolean): void => {
    const half = (WALL_O - d) * TAN8;
    const inside = (p: Vec3): Vec3 => add(p, mul(n, out ? -0.1 : 0.1));
    const q = (a: Vec3, b: Vec3, c: Vec3, e: Vec3): void => quadOut(m, "limestone", a, b, c, e, inside(mul(add(a, c), 0.5)));
    q(L(-half, YP, d), L(-ARCH_A, YP, d), L(-ARCH_A, top, d), L(-half, top, d));
    q(L(ARCH_A, YP, d), L(half, YP, d), L(half, top, d), L(ARCH_A, top, d));
    for (let i = 0; i + 1 < arch.length; i++) {
      const [u0, y0] = arch[i]!, [u1, y1] = arch[i + 1]!;
      if (Math.abs(u1 - u0) < 1e-9) continue;
      const a = L(u0, y0, d), b = L(u1, y1, d), c = L(u1, top, d), e = L(u0, top, d);
      if (Math.abs(y1 - top) < 1e-9 || Math.abs(y0 - top) < 1e-9) continue;
      q(a, b, c, e);
    }
  };
  m.scope("outer face", () => face(0, WALL_TOP, true));
  m.scope("inner face", () => face(T, VAULT_WALL, false));
  m.scope("reveals", () => {
    for (const s of [-1, 1]) {
      const inside = L(s * (ARCH_A + 0.1), YP + 1, T / 2);
      quadOut(m, "limestoneDark", L(s * ARCH_A, YP, 0), L(s * ARCH_A, YP, T), L(s * ARCH_A, SPRING, T), L(s * ARCH_A, SPRING, 0), inside);
    }
    for (let i = 0; i + 1 < arch.length; i++) {
      const [u0, y0] = arch[i]!, [u1, y1] = arch[i + 1]!;
      const left = u0 + u1 < 0;
      const cu = left ? off : -off; // the arc's centre
      const mu = (u0 + u1) / 2, my = (y0 + y1) / 2;
      const inside = L(mu + (mu - cu) * 0.2, my + (my - SPRING) * 0.2 + 0.02, T / 2);
      quadOut(m, "limestoneDark", L(u0, y0, 0), L(u1, y1, 0), L(u1, y1, T), L(u0, y0, T), inside);
    }
  });
  m.scope("hood mould", () => {
    const hood = archPoints(ARCH_A, ARCH_R + 0.13, SPRING, 6).map(([u, y]): [number, number] => [u * (ARCH_A + 0.13) / ARCH_A, y]);
    // the stops at the springing turn outward a little
    const pts: Vec3[] = [L(-ARCH_A - 0.3, SPRING - 0.02, -0.03), ...hood.map(([u, y]) => L(u, y, -0.03)), L(ARCH_A + 0.3, SPRING - 0.02, -0.03)];
    pipe(m, "limestoneLight", pts, 0.085, 4, n);
    const apexY = hood[(hood.length - 1) / 2]![1];
    // a crocketed finial rising from the hood's point
    pipe(m, "limestoneLight", [L(0, apexY, -0.03), L(0, apexY + 0.62, -0.03)], 0.07, 4, t);
    blob(m, "limestoneLight", L(0, apexY + 0.68, -0.03), 0.11, 0.13, 0.11, 6, 3);
    for (const s of [-1, 1]) crocket(m, "limestoneLight", L(s * 0.05, apexY + 0.3, -0.03), mul(t, s), n, 0.16);
  });
  m.scope("plinth", () => {
    // a weathered base course standing proud of the piers' foot
    for (const s of [-1, 1]) {
      const half = WALL_O * TAN8;
      const u0 = ARCH_A + 0.03, u1 = half + 0.02;
      const c = L((s * (u0 + u1)) / 2, 0, 0);
      const ry = Math.atan2(-t[2], t[0]);
      m.box("limestoneDark", c[0], c[2], u1 - u0, 0.14, YP, YP + 0.5, ry);
    }
  });
  m.scope("blind tracery", () => {
    // two slender panel shafts each side of the hood, standing proud of the face
    for (const s of [-1, 1]) {
      for (const u of [1.22, 1.36]) {
        const ux = s * u;
        if (ux * ux > ((WALL_O * TAN8) - 0.1) ** 2) continue;
        m.slab("limestoneLight", [L(ux - 0.035, SPRING + 0.35, -0.05), L(ux + 0.035, SPRING + 0.35, -0.05), L(ux + 0.035, WALL_TOP - 0.15, -0.05), L(ux - 0.035, WALL_TOP - 0.15, -0.05)], mul(n, -0.08));
      }
    }
  });
}

/** The stepped buttress at corner k, rising through the parapet into a crocketed pinnacle. */
function buttress(m: MeshBuilder, k: number): void {
  const a = cornerAngle(k);
  const o = dirAt(a);
  const t: Vec3 = [-o[2], 0, o[0]];
  const ry = Math.atan2(-t[2], t[0]);
  const at = (r: number): Vec3 => mul(o, r);
  // stages: [outer reach beyond the corner, width, top]
  const stages: Array<[number, number, number]> = [[0.62, 0.64, YP + 1.9], [0.42, 0.58, YP + 3.55], [0.22, 0.5, PARAPET + 0.1]];
  const back = -0.5;
  let y = YP;
  for (let s = 0; s < stages.length; s++) {
    const [reach, w, top] = stages[s]!;
    const depth = reach - back;
    const c = at(RC + (reach + back) / 2);
    const last = s + 1 === stages.length;
    m.scope(`stage ${s + 1}`, () => {
      m.box(s === 0 ? "limestoneDark" : "limestone", c[0], c[2], w, depth, y, top, ry, last);
      if (!last) {
        // the sloped weathering up to the next, narrower stage
        const [r2, w2] = stages[s + 1]!;
        const c2 = at(RC + (r2 + back) / 2);
        m.loft("limestoneLight", rect(w, depth, c[0], c[2], ry), top, rect(w2, r2 - back, c2[0], c2[2], ry), top + 0.28, false);
      }
    });
    y = top + (last ? 0 : 0.28);
  }
  m.scope("pinnacle", () => {
    const c = at(RC + 0.0);
    const y0 = PARAPET + 0.1;
    m.loft("limestoneLight", rect(0.5, 0.72, c[0], c[2], ry), y0, rect(0.58, 0.8, c[0], c[2], ry), y0 + 0.1, true);
    m.box("limestone", c[0], c[2], 0.4, 0.4, y0 + 0.1, y0 + 0.85, ry, false);
    m.prism("limestoneLight", rect(0.5, 0.5, c[0], c[2], ry), y0 + 0.85, y0 + 0.95, false);
    m.spire("limestoneLight", rect(0.5, 0.5, c[0], c[2], ry), y0 + 0.95, y0 + 2.15);
    // crockets up the spire's four arrises
    for (let e = 0; e < 4; e++) {
      const ea = a + Math.PI / 4 + (e * Math.PI) / 2;
      const ed = dirAt(ea);
      const side: Vec3 = [-ed[2], 0, ed[0]];
      for (const f of [0.25, 0.55]) {
        const r = 0.35 * (1 - f) * 0.98;
        crocket(m, "limestoneLight", add(add(c, mul(ed, r)), [0, y0 + 0.95 + 1.2 * f, 0]), ed, side, 0.13);
      }
    }
    blob(m, "limestoneLight", add(c, [0, y0 + 2.2, 0]), 0.09, 0.11, 0.09, 6, 3);
  });
}

// --- inside: the pillar, the bench and the vault -------------------------------------

function interior(m: MeshBuilder): void {
  m.scope("bench", () => {
    m.loft("limestoneDark", octagon(1.15), YP, octagon(1.1), YP + 0.08, false);
    m.prism("limestoneDark", octagon(1.1), YP + 0.08, YP + 0.38, false);
    m.loft("limestoneLight", octagon(1.1), YP + 0.38, octagon(1.18), YP + 0.42, false);
    m.prism("limestoneLight", octagon(1.18), YP + 0.42, YP + 0.48);
  });
  m.scope("pillar", () => {
    m.loft("limestoneLight", octagon(0.52), YP + 0.48, octagon(0.4), YP + 0.62, false);
    m.prism("limestone", octagon(0.4), YP + 0.62, VAULT_LOW - 0.3, false);
    m.loft("limestoneLight", octagon(0.4), VAULT_LOW - 0.3, octagon(0.55), VAULT_LOW, false);
  });
  m.scope("vault", () => {
    // a fan of stone spreading from the capital to the walls, seen from below
    const rings: Array<[number, number]> = [[0.55, VAULT_LOW], [1.7, VAULT_LOW + 0.5], [WALL_I, VAULT_WALL]];
    for (let i = 0; i + 1 < rings.length; i++) {
      const [a0, y0] = rings[i]!, [a1, y1] = rings[i + 1]!;
      m.loft("limestoneLight", inward(octagon(a0)), y0, inward(octagon(a1)), y1, false);
    }
    // the ribs, just under the vault: to each corner and to each side's crown
    for (let k = 0; k < 16; k++) {
      const ang = (k * Math.PI) / 8 + Math.PI / 8;
      const corner = k % 2 === 0;
      const d = dirAt(ang);
      const scale = corner ? 1 / COS8 : 1;
      const pts: Vec3[] = rings.map(([apo, y], i) => add(mul(d, apo * scale * (i === 2 ? 0.995 : 1)), [0, y - 0.06, 0]));
      pts[0] = add(mul(d, 0.5 * scale), [0, VAULT_LOW - 0.08, 0]);
      pipe(m, "limestone", pts, 0.07, 4, [0, 1, 0]);
    }
  });
}

// --- above the arches -----------------------------------------------------------------

function cornice(m: MeshBuilder): void {
  m.loft("limestoneLight", octagon(WALL_O), WALL_TOP - 0.07, octagon(WALL_O + 0.18), WALL_TOP + 0.1, false);
  m.prism("limestoneLight", octagon(WALL_O + 0.18), WALL_TOP + 0.1, CORNICE);
}

/** The pierced parapet with its cresting on side k. */
function parapet(m: MeshBuilder, k: number): void {
  const n = dirAt(sideAngle(k));
  const t: Vec3 = [-n[2], 0, n[0]];
  const ry = Math.atan2(-t[2], t[0]);
  const apo = WALL_O + 0.02;
  const len = 2 * apo * TAN8 - 0.5;
  const c = mul(n, apo);
  m.box("limestone", c[0], c[2], len, 0.2, CORNICE, CORNICE + 0.16, ry);
  const coping = mul(n, apo + 0.01);
  m.box("limestoneLight", coping[0], coping[2], len, 0.28, PARAPET - 0.14, PARAPET, ry);
  const open = 5;
  const pitch = len / open;
  for (let i = 0; i <= open; i++) {
    const p = add(c, mul(t, -len / 2 + i * pitch));
    const w = i === 0 || i === open ? 0.16 : 0.09;
    const pc = add(p, mul(t, i === 0 ? 0.04 : i === open ? -0.04 : 0));
    m.box("limestone", pc[0], pc[2], w, 0.2, CORNICE + 0.16, PARAPET - 0.14, ry, false);
  }
  // trefoil-ish pointed heads in each opening
  for (let i = 0; i < open; i++) {
    const mid = add(c, mul(t, -len / 2 + (i + 0.5) * pitch));
    const hw = pitch / 2 - 0.045;
    const y1 = PARAPET - 0.14;
    const P = (u: number, y: number): Vec3 => add(add(mid, mul(t, u)), [0, y, 0]);
    for (const s of [-1, 1]) {
      m.slab("limestone", [add(P(s * hw, y1 - 0.2), mul(n, 0.07)), add(P(s * hw, y1), mul(n, 0.07)), add(P(s * 0.03, y1), mul(n, 0.07))], mul(n, -0.14));
    }
  }
  // cresting: small pointed leaves along the coping
  for (let i = 0; i < 6; i++) {
    const p = add(coping, mul(t, -len / 2 + (i + 0.5) * (len / 6)));
    m.spire("limestoneLight", rect(0.14, 0.14, p[0], p[2], ry + Math.PI / 4), PARAPET, PARAPET + 0.2);
  }
}

function roofAndAttic(m: MeshBuilder): void {
  m.scope("roof", () => m.loft("lead", octagon(WALL_O - 0.1), CORNICE, octagon(ATTIC_APO), ATTIC_Y0, false));
  m.scope("attic", () => {
    m.prism("limestone", octagon(ATTIC_APO), ATTIC_Y0, ATTIC_Y1, false);
    m.loft("limestoneLight", octagon(ATTIC_APO), ATTIC_Y1 - 0.12, octagon(ATTIC_APO + 0.14), ATTIC_Y1 + 0.02, false);
    m.prism("limestoneLight", octagon(ATTIC_APO + 0.14), ATTIC_Y1 + 0.02, ATTIC_Y1 + 0.12, false);
    m.loft("lead", octagon(ATTIC_APO + 0.14), ATTIC_Y1 + 0.12, octagon(SHAFT_APO + 0.1), 8.25, false);
    m.cap("lead", octagon(SHAFT_APO + 0.1), 8.25);
  });
  m.scope("clocks", () => {
    for (const k of [1, 3, 5, 7]) {
      const n = dirAt(sideAngle(k));
      const t: Vec3 = [-n[2], 0, n[0]];
      const c = add(mul(n, ATTIC_APO), [0, (ATTIC_Y0 + ATTIC_Y1) / 2 + 0.05, 0]);
      const disc = (r: number, proud: number, sides: number): Vec3[] =>
        Array.from({ length: sides }, (_, i) => {
          const f = (2 * Math.PI * i) / sides;
          return add(add(c, mul(n, proud)), add(mul(t, r * Math.cos(f)), [0, r * Math.sin(f), 0]));
        });
      m.slab("limestoneDark", disc(0.66, 0.03, 12), mul(n, -0.1));
      m.slab("dial", disc(0.55, 0.06, 12), mul(n, -0.1));
      // the hands at ten past ten, gilt
      const hand = (ang: number, len: number, w: number): void => {
        const d: Vec3 = add(mul(t, Math.cos(ang)), [0, Math.sin(ang), 0]);
        const s: Vec3 = add(mul(t, -Math.sin(ang)), [0, Math.cos(ang), 0]);
        const b = add(c, mul(n, 0.09));
        m.slab("gilt", [add(b, mul(s, -w)), add(add(b, mul(d, len)), mul(s, -w * 0.4)), add(add(b, mul(d, len)), mul(s, w * 0.4)), add(b, mul(s, w))], mul(n, -0.05));
      };
      hand(Math.PI / 2 + (2 * Math.PI) / 12 * 2, 0.32, 0.04);
      hand(Math.PI / 2 - (2 * Math.PI) / 12 * 2, 0.46, 0.03);
      // hour marks
      for (let h = 0; h < 12; h++) {
        const f = (2 * Math.PI * h) / 12;
        const p = add(add(c, mul(n, 0.07)), add(mul(t, 0.46 * Math.cos(f)), [0, 0.46 * Math.sin(f), 0]));
        const d: Vec3 = add(mul(t, Math.cos(f)), [0, Math.sin(f), 0]);
        const s: Vec3 = add(mul(t, -Math.sin(f)), [0, Math.cos(f), 0]);
        m.slab("lead", [add(p, mul(s, -0.025)), add(add(p, mul(d, 0.07)), mul(s, -0.025)), add(add(p, mul(d, 0.07)), mul(s, 0.025)), add(p, mul(s, 0.025))], mul(n, -0.03));
      }
    }
  });
}

/** The eight crocketed flying ribs from the pinnacles to the central turret. */
function crown(m: MeshBuilder): void {
  const bez = (p0: number[], p1: number[], p2: number[], p3: number[], f: number): [number, number] => {
    const g = 1 - f;
    const r = g * g * g * p0[0]! + 3 * g * g * f * p1[0]! + 3 * g * f * f * p2[0]! + f * f * f * p3[0]!;
    const y = g * g * g * p0[1]! + 3 * g * g * f * p1[1]! + 3 * g * f * f * p2[1]! + f * f * f * p3[1]!;
    return [r, y];
  };
  for (let k = 0; k < 8; k++) {
    const a = cornerAngle(k);
    const o = dirAt(a);
    const t: Vec3 = [-o[2], 0, o[0]];
    m.scope(`rib ${k + 1}`, () => {
      const P0 = [RC - 0.12, PARAPET + 0.45], P1 = [RC - 0.15, 8.3], P2 = [2.0, 9.45], P3 = [0.8, 9.2];
      const pts: Vec3[] = [];
      for (let i = 0; i <= 10; i++) {
        const [r, y] = bez(P0, P1, P2, P3, i / 10);
        pts.push(add(mul(o, r), [0, y, 0]));
      }
      pipe(m, "limestone", pts, 0.16, 4, t);
      // crockets along the rib's back
      for (let i = 2; i <= 8; i += 2) {
        const p = pts[i]!;
        const tan = unit(sub(pts[i + 1]!, pts[i - 1]!));
        const up = unit(cross(t, tan));
        const outDir = up[1] > 0 ? up : mul(up, -1);
        crocket(m, "limestoneLight", add(p, mul(outDir, 0.09)), unit(add(outDir, [0, 0.6, 0])), t, 0.15);
      }
    });
  }
}

function turret(m: MeshBuilder): void {
  m.scope("shaft", () => {
    m.prism("limestone", octagon(SHAFT_APO), 8.2, LANTERN_Y0 - 0.1, false);
    // small blind lancets on the shaft's faces
    for (let k = 0; k < 8; k++) {
      const n = dirAt(sideAngle(k));
      const t: Vec3 = [-n[2], 0, n[0]];
      const c = mul(n, SHAFT_APO + 0.03);
      const P = (u: number, y: number): Vec3 => add(add(c, mul(t, u)), [0, y, 0]);
      m.slab("limestoneDark", [P(-0.16, 8.45), P(0.16, 8.45), P(0.16, 9.2), P(0, 9.42), P(-0.16, 9.2)], mul(n, -0.06));
    }
  });
  m.scope("lantern", () => {
    m.cap("limestoneLight", octagon(SHAFT_APO + 0.2), LANTERN_Y0 - 0.1, false);
    m.prism("limestoneLight", octagon(SHAFT_APO + 0.2), LANTERN_Y0 - 0.1, LANTERN_Y0 + 0.08);
    for (let k = 0; k < 8; k++) {
      const a = cornerAngle(k);
      const p = mul(dirAt(a), (SHAFT_APO + 0.02) / COS8);
      m.box("limestone", p[0], p[2], 0.2, 0.2, LANTERN_Y0 + 0.08, LANTERN_Y1, a, false);
    }
    // a little pointed head in each opening, under the entablature
    for (let k = 0; k < 8; k++) {
      const n = dirAt(sideAngle(k));
      const t: Vec3 = [-n[2], 0, n[0]];
      const c = mul(n, SHAFT_APO + 0.02);
      const P = (u: number, y: number): Vec3 => add(add(c, mul(t, u)), [0, y, 0]);
      const hw = SHAFT_APO * TAN8 - 0.06;
      for (const s of [-1, 1]) m.slab("limestone", [add(P(s * hw, LANTERN_Y1 - 0.4), mul(n, 0.06)), add(P(s * hw, LANTERN_Y1), mul(n, 0.06)), add(P(s * 0.04, LANTERN_Y1), mul(n, 0.06))], mul(n, -0.12));
    }
    m.cap("limestoneLight", octagon(SHAFT_APO + 0.2), LANTERN_Y1, false);
    m.prism("limestoneLight", octagon(SHAFT_APO + 0.2), LANTERN_Y1, LANTERN_Y1 + 0.25, false);
  });
  m.scope("cupola", () => {
    const y0 = LANTERN_Y1 + 0.25;
    m.loft("lead", octagon(SHAFT_APO + 0.2), y0, octagon(SHAFT_APO + 0.05), y0 + 0.4, false);
    m.loft("lead", octagon(SHAFT_APO + 0.05), y0 + 0.4, octagon(0.62), y0 + 0.85, false);
    m.loft("lead", octagon(0.62), y0 + 0.85, octagon(0.22), y0 + 1.35, false);
    m.spire("lead", octagon(0.22), y0 + 1.35, y0 + 2.0);
  });
  m.scope("finial", () => {
    const y = LANTERN_Y1 + 2.25;
    blob(m, "gilt", [0, y + 0.1, 0], 0.15, 0.15, 0.15, 8, 4);
    m.prism("gilt", ngon(6, 0.035), y + 0.2, y + 1.15);
    m.box("gilt", 0, 0, 0.42, 0.06, y + 0.78, y + 0.86);
  });
}

/** The market cross, about 14.6 m tall on its 9.8 m stepped octagonal base. */
export function marketCross(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("market cross", () => {
    m.scope("steps", () => steps(m));
    m.scope("arcade", () => {
      for (let k = 0; k < 8; k++) m.scope(`wall ${k + 1}`, () => wall(m, k));
      for (let k = 0; k < 8; k++) m.scope(`buttress ${k + 1}`, () => buttress(m, k));
    });
    m.scope("interior", () => interior(m));
    m.scope("cornice", () => cornice(m));
    m.scope("parapet", () => {
      for (let k = 0; k < 8; k++) m.scope(`side ${k + 1}`, () => parapet(m, k));
    });
    m.scope("roof and attic", () => roofAndAttic(m));
    m.scope("crown", () => crown(m));
    m.scope("turret", () => turret(m));
  });
  return m;
}

/** The low level of detail: steps, the arcade block with its buttresses, the parapet band, attic, crown and turret. */
export function marketCrossLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.prism("step", octagon(STEP_APO[0]!), 0, 0.3);
  m.prism("limestoneDark", octagon(STEP_APO[2]!), 0.3, YP);
  m.prism("limestone", octagon(WALL_O), YP, WALL_TOP, false);
  m.prism("limestoneLight", octagon(WALL_O + 0.18), WALL_TOP, PARAPET);
  // the arches as dark pointed panels standing just proud of the block
  for (let k = 0; k < 8; k++) {
    const n = dirAt(sideAngle(k));
    const t: Vec3 = [-n[2], 0, n[0]];
    const P = (u: number, y: number): Vec3 => add(add(mul(n, WALL_O + 0.03), mul(t, u)), [0, y, 0]);
    m.slab("lead", [P(-ARCH_A, YP), P(ARCH_A, YP), P(ARCH_A, SPRING), P(0, SPRING + 1.38), P(-ARCH_A, SPRING)], mul(n, -0.06));
  }
  for (let k = 0; k < 8; k++) {
    const a = cornerAngle(k);
    const o = dirAt(a);
    const t: Vec3 = [-o[2], 0, o[0]];
    const ry = Math.atan2(-t[2], t[0]);
    const c = mul(o, RC + 0.05);
    m.loft("limestone", rect(0.6, 1.1, c[0], c[2], ry), YP, rect(0.5, 0.6, c[0], c[2], ry), PARAPET + 0.1, false);
    m.spire("limestoneLight", rect(0.5, 0.6, c[0], c[2], ry), PARAPET + 0.1, PARAPET + 2.2);
  }
  m.loft("lead", octagon(WALL_O), PARAPET, octagon(ATTIC_APO), 6.3, false);
  m.prism("limestone", octagon(ATTIC_APO), 6.3, ATTIC_Y1);
  // the crown as a lead-dark octagonal cone of ribs to the shaft
  m.loft("limestoneDark", octagon(3.2), ATTIC_Y1, octagon(SHAFT_APO + 0.2), 9.5, false);
  m.prism("limestone", octagon(SHAFT_APO + 0.2), 9.5, LANTERN_Y1 + 0.25);
  m.loft("lead", octagon(SHAFT_APO + 0.2), LANTERN_Y1 + 0.25, octagon(0.22), LANTERN_Y1 + 1.6, false);
  m.spire("lead", octagon(0.22), LANTERN_Y1 + 1.6, LANTERN_Y1 + 2.25);
  m.prism("gilt", ngon(4, 0.12), LANTERN_Y1 + 2.0, LANTERN_Y1 + 3.35);
  return m;
}

export const MARKET_CROSS: ProceduralDesign[] = [
  {
    id: "bld-market-cross",
    game: { plaza: { cities: ["village", "town"], layouts: ["radial"], round: true } },
    title: "Market Cross",
    build: marketCross,
    buildLod: marketCrossLod,
    references: "market-cross",
    catalog: PLAZA_CATALOG,
  },
];
