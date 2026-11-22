// A German half-timbered town hall (Fachwerk-Rathaus) for a village or town square
// (docs/models/plaza-landmarks.md): a generic composite in the manner of the late
// Gothic and Renaissance town halls of Michelstadt (1484), Alsfeld (1512-16),
// Wernigerode (1497-1544) and the Altes Rathaus of Esslingen, after the photographs
// in assets/half-timbered-town-hall/ (SOURCES.md).
//
// The ground floor is the open market hall: grey stone walls pierced by pointed arches
// on three sides (five in front, three on each end), with bases, imposts and moulded
// archivolts, a paved floor, a timber ceiling on a long beam carried by two braced oak
// posts, and a closed back wall with a door. Above it two jettied (overhanging) timber-
// framed storeys: each oversails the one below on a row of joist ends and a timber
// band, the second on carved brackets as well. Every storey's framing is real raised
// beams over cream plaster: sill, plate, posts, breast and head rails, the "Mann"
// figures (a post with two curved foot braces and head braces), St Andrew's crosses
// under the windows and rows of small leaded windows with mullion and transom. Two
// octagonal corner oriels (Erker) on the front corners are corbelled out from the stone
// corners, framed storey by storey and rise through the eaves to tall pointed helmets
// with gilt finials. The steep (55 degree) tiled roof has framed gables at the ends,
// barge boards, three rows of dormers on both slopes, a central clock gable
// (Zwerchhaus) over the front with a blue clock dial, and a roof turret (Dachreiter) on
// the ridge: an open octagonal bell lantern with a bell, under a copper onion with a
// gilt spike and ball.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin, the arcade front
// facing +Z. About 21.8 m across the oriels (X), 15.4 m deep over the eaves and oriels
// (Z), the ridge 21.6 m up and the turret's spike 29.6 m. Deterministic: the same code
// gives the same bytes.
//
// The id is what the game's saved maps store, so the design is never renamed.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox, lodLoft } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  stone: { color: "#9c968b", roughness: 0.92 },
  trim: { color: "#b9b1a2", roughness: 0.9 },
  paving: { color: "#7d7770", roughness: 0.95 },
  timber: { color: "#4e2a20", roughness: 0.85 },
  plaster: { color: "#ece3cf", roughness: 0.92 },
  roof: { color: "#9a4630", roughness: 0.8 },
  course: { color: "#7e3626", roughness: 0.85 },
  slate: { color: "#3d4146", roughness: 0.7 },
  pane: { color: "#2b3236", metallic: 0.3, roughness: 0.35 },
  dial: { color: "#2f5d8c", roughness: 0.6 },
  gilt: { color: "#c9a14a", metallic: 0.75, roughness: 0.35 },
  copper: { color: "#5f9a84", metallic: 0.35, roughness: 0.55 },
};

// --- vector and geometry helpers --------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];

/** A planar quad wound so it faces along `n`. */
function face(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  const pts = [a, b, c, d];
  const nv: Vec3 = [0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % 4]!;
    nv[0] += (p[1] - q[1]) * (p[2] + q[2]);
    nv[1] += (p[2] - q[2]) * (p[0] + q[0]);
    nv[2] += (p[0] - q[0]) * (p[1] + q[1]);
  }
  if (nv[0] * n[0] + nv[1] * n[1] + nv[2] * n[2] >= 0) m.quad(mat, a, b, c, d);
  else m.quad(mat, a, d, c, b);
}

/** An octagon of corner radius r with a flat side facing each of +-X and +-Z. */
const oct = (r: number, cx = 0, cz = 0): Ring => ngon(8, r, Math.PI / 8, cx, cz);

/**
 * A vertical wall face: `o` is its point at u = 0 on the plaster (o[1] the wall's base
 * height), `u` the horizontal unit along it and `n` the horizontal outward normal.
 */
interface Wall {
  o: Vec3;
  u: Vec3;
  n: Vec3;
}
/** The point (u along, y up from the base, d out from the plaster) of a wall. */
const at = (w: Wall, u: number, y: number, d = 0): Vec3 => [w.o[0] + w.u[0] * u + w.n[0] * d, w.o[1] + y, w.o[2] + w.u[2] * u + w.n[2] * d];

const DP = 0.08; // how far the framing stands proud of the plaster

/** A straight timber from (u0, y0) to (u1, y1) on a wall, bw wide, standing dp proud; `ext` lengthens both ends. */
function wbeam(m: MeshBuilder, w: Wall, u0: number, y0: number, u1: number, y1: number, bw: number, dp = DP, ext = 0, mat = "timber"): void {
  const L = Math.hypot(u1 - u0, y1 - y0);
  if (L < 1e-6) return;
  const du = (u1 - u0) / L;
  const dy = (y1 - y0) / L;
  u0 -= du * ext; y0 -= dy * ext; u1 += du * ext; y1 += dy * ext;
  const pu = (-dy * bw) / 2;
  const py = (du * bw) / 2;
  m.slab(mat, [at(w, u0 + pu, y0 + py, dp), at(w, u1 + pu, y1 + py, dp), at(w, u1 - pu, y1 - py, dp), at(w, u0 - pu, y0 - py, dp)], mul(w.n, -dp));
}

/** A curved timber: a quadratic Bezier from p0 over control c to p2, in `seg` straight pieces. */
function wcurve(m: MeshBuilder, w: Wall, p0: [number, number], c: [number, number], p2: [number, number], bw: number, seg = 4): void {
  const P = (t: number): [number, number] => [
    (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p2[0],
    (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p2[1],
  ];
  for (let k = 0; k < seg; k++) {
    const a = P(k / seg);
    const b = P((k + 1) / seg);
    wbeam(m, w, a[0], a[1], b[0], b[1], bw, DP, bw * 0.35);
  }
}

/** A leaded window: the dark pane between (u0, y0) and (u1, y1), a mullion and a transom. */
function window(m: MeshBuilder, w: Wall, u0: number, y0: number, u1: number, y1: number, transom = true): void {
  face(m, "pane", at(w, u0, y0, 0.02), at(w, u1, y0, 0.02), at(w, u1, y1, 0.02), at(w, u0, y1, 0.02), w.n);
  const um = (u0 + u1) / 2;
  wbeam(m, w, um, y0, um, y1, 0.06, 0.05);
  if (transom) {
    const yt = y0 + 0.64 * (y1 - y0);
    wbeam(m, w, u0, yt, u1, yt, 0.06, 0.05);
  }
}

/**
 * One timber-framed storey on a wall from ua to ub, H high: sill, plate, a post at every
 * field boundary, breast and head rails, and per field (the pattern's letters): W a
 * window with a St Andrew's cross under it, L a curved foot brace falling to the left
 * from the post on its right (with a head brace), R its mirror image -- so "LR" draws a
 * Mann -- and P rails only. Returns the u of every Mann post (between an L and an R).
 */
function framedStorey(m: MeshBuilder, w: Wall, ua: number, ub: number, H: number, pattern: string): number[] {
  const n = pattern.length;
  const fw = (ub - ua) / n;
  const BR = 0.95;
  const HR = H - 0.85;
  const mann: number[] = [];
  wbeam(m, w, ua, 0.11, ub, 0.11, 0.22);
  wbeam(m, w, ua, H - 0.11, ub, H - 0.11, 0.22);
  wbeam(m, w, ua, BR, ub, BR, 0.15);
  wbeam(m, w, ua, HR, ub, HR, 0.15);
  for (let i = 0; i <= n; i++) {
    const u = ua + i * fw;
    wbeam(m, w, u, 0.22, u, H - 0.22, 0.2);
  }
  for (let i = 0; i < n; i++) {
    const c = pattern[i]!;
    const u0 = ua + i * fw + 0.1;
    const u1 = ua + (i + 1) * fw - 0.1;
    if (c === "W") {
      window(m, w, u0, BR + 0.075, u1, HR - 0.075);
      wbeam(m, w, u0, 0.22, u1, BR - 0.075, 0.12);
      wbeam(m, w, u0, BR - 0.075, u1, 0.22, 0.12);
    } else if (c === "D") {
      // a door: a boarded leaf standing proud of the rails, with a gilt knob
      m.slab("timber", [at(w, u0 + 0.05, 0.22, 0.11), at(w, u1 - 0.05, 0.22, 0.11), at(w, u1 - 0.05, 2.35, 0.11), at(w, u0 + 0.05, 2.35, 0.11)], mul(w.n, -0.09));
      wbeam(m, w, u0, 2.42, u1, 2.42, 0.14, 0.13);
      const k = u1 - 0.22;
      m.slab("gilt", [at(w, k - 0.04, 1.1, 0.14), at(w, k + 0.04, 1.1, 0.14), at(w, k + 0.04, 1.18, 0.14), at(w, k - 0.04, 1.18, 0.14)], mul(w.n, -0.03));
    } else if (c === "L" || c === "R") {
      const post = c === "L" ? u1 : u0;
      const far = c === "L" ? u0 : u1;
      const s = c === "L" ? -1 : 1; // the brace runs this way from the post
      wcurve(m, w, [post, HR - 0.1], [post + s * 0.3 * (u1 - u0), 0.5 * HR], [far, 0.24], 0.16);
      wbeam(m, w, post, H - 0.75, post + s * 0.42, H - 0.22, 0.14, DP, 0.06);
      if (c === "L" && pattern[i + 1] === "R") mann.push(ua + (i + 1) * fw);
    }
  }
  return mann;
}

/**
 * The framing of a triangular gable on a wall from 0 to `span` wide (the apex `rise` up
 * over its middle): a collar rail every 3 m, posts clipped under the rakes, rafters
 * along both rakes, windows in the middle fields, crosses beside them.
 */
function framedGable(m: MeshBuilder, w: Wall, span: number, rise: number, posts: number): void {
  const half = span / 2;
  const tan = rise / half;
  const top = (u: number): number => (half - Math.abs(u - half)) * tan;
  // rafters just under the rakes
  const r0 = 0.25;
  wbeam(m, w, 0.2, 0.12, half, rise - r0 * 1.6, 0.22, DP, 0.1);
  wbeam(m, w, span - 0.2, 0.12, half, rise - r0 * 1.6, 0.22, DP, 0.1);
  wbeam(m, w, 0.1, 0.11, span - 0.1, 0.11, 0.22);
  const levels = [3.0, 6.0, 8.4].filter((y) => y < rise - 1.0);
  for (const y of levels) {
    const hw = half - y / tan - 0.25;
    if (hw > 0.3) wbeam(m, w, half - hw, y, half + hw, y, 0.2);
  }
  const fw = span / posts;
  for (let i = 1; i < posts; i++) {
    const u = i * fw;
    const yt = top(u) - 0.35;
    if (yt > 0.7) wbeam(m, w, u, 0.22, u, yt, 0.2);
  }
  // windows and crosses between the posts, level by level
  const rows: Array<[number, number]> = [[0.95, 2.35], [3.85, 5.2], [6.75, 7.75]];
  for (const [y0, y1] of rows) {
    for (let i = 0; i < posts; i++) {
      const u0 = i * fw + 0.12;
      const u1 = (i + 1) * fw - 0.12;
      const clear = Math.min(top(u0), top(u1)) - 0.45;
      if (y1 > clear) continue;
      const mid = (u0 + u1) / 2;
      const inner = Math.abs(mid - half) < (y0 < 1 ? half * 0.42 : y0 < 4 ? half * 0.3 : half);
      if (inner) window(m, w, u0 + 0.05, y0, u1 - 0.05, y1, y0 < 1);
      else {
        wbeam(m, w, u0, y0 - 0.6, u1, y1 - 0.2, 0.14);
        wbeam(m, w, u0, y1 - 0.2, u1, y0 - 0.6, 0.14);
      }
    }
  }
}

/**
 * A pointed (two-centred) arch from (a, ys) to (b, ys), radius k * span, as points
 * left to right, each with the centre of its arc: n segments a half.
 */
function archPoints(a: number, b: number, ys: number, k: number, n: number): Array<{ u: number; y: number; cu: number }> {
  const s = b - a;
  const R = k * s;
  const ta = Math.acos((s / 2 - R) / R);
  const pts: Array<{ u: number; y: number; cu: number }> = [];
  for (let i = 0; i <= n; i++) {
    const t = Math.PI + ((ta - Math.PI) * i) / n;
    pts.push({ u: a + R + R * Math.cos(t), y: ys + R * Math.sin(t), cu: a + R });
  }
  for (let i = 0; i <= n; i++) {
    const t = Math.PI - ta - ((Math.PI - ta) * i) / n;
    pts.push({ u: b - R + R * Math.cos(t), y: ys + R * Math.sin(t), cu: b - R });
  }
  return pts;
}

// --- dimensions -------------------------------------------------------------------

const TAN = 1.43; // the roof pitch, about 55 degrees
const FLOOR = 0.12; // the paved floor of the market hall
const G = { x: 9.3, z: 6.3, top: 5.0, thick: 0.7 }; // the stone ground floor
const S1 = { x: 9.65, z: 6.65, y0: G.top + 0.3, y1: G.top + 3.6 }; // first jettied storey
const S2 = { x: 10.0, z: 7.0, y0: S1.y1 + 0.3, y1: S1.y1 + 3.4 }; // second jettied storey
const PLATE = S2.y1 + 0.2; // top of the wall plate: the roof springs here at z = +-S2.z
const EAVE = 0.5; // eaves overhang (z)
const VERGE = 0.4; // gable overhang (x)
const RIDGE = PLATE + S2.z * TAN;
const ROOF_T = 0.25; // roof thickness, square to the slope
/** The roof's top surface height at depth z. */
const roofY = (z: number): number => PLATE + (S2.z - Math.abs(z)) * TAN;
/** The depth (>= 0) at which the roof's top surface is at height y. */
const roofZ = (y: number): number => S2.z - (y - PLATE) / TAN;

// the corner oriels
const OX = 9.45;
const OZ = 6.45;
const OR = 1.55; // corner radius
const OF = OR * Math.cos(Math.PI / 8); // flat radius
const O_TOP = PLATE + 1.8;
const O_TIP = O_TOP + 10.2;
// the clock gable
const CG_HW = 2.8;
const CG_WALL = 3.0;
// the roof turret
const DR_TOP = RIDGE + 8.0;

// --- parts ------------------------------------------------------------------------

/** One arcaded stone wall of the market hall: nOpen pointed arches between piers. */
function arcade(m: MeshBuilder, w: Wall, L: number, nOpen: number, pier: number, ys: number, k: number): void {
  const open = (L - (nOpen + 1) * pier) / nOpen;
  const t = G.thick;
  const H = G.top - FLOOR;
  const back = mul(w.n, -t);
  for (let i = 0; i <= nOpen; i++) {
    const u0 = i * (open + pier);
    const u1 = u0 + pier;
    m.slab("stone", [at(w, u0, -0.06, 0), at(w, u1, -0.06, 0), at(w, u1, H, 0), at(w, u0, H, 0)], back);
    const e = 0.07;
    const wide = mul(w.n, -(t + 2 * e));
    const lo = u0 - e;
    const hi = u1 + e;
    m.slab("trim", [at(w, lo, 0, e), at(w, hi, 0, e), at(w, hi, 0.42, e), at(w, lo, 0.42, e)], wide);
    m.slab("trim", [at(w, lo, ys - 0.2, e), at(w, hi, ys - 0.2, e), at(w, hi, ys, e), at(w, lo, ys, e)], wide);
  }
  for (let i = 0; i < nOpen; i++) {
    const a = pier + i * (open + pier);
    const b = a + open;
    const pts = archPoints(a, b, ys, k, 4);
    const R = k * open;
    for (let j = 0; j + 1 < pts.length; j++) {
      const p = pts[j]!;
      const q = pts[j + 1]!;
      if (Math.abs(p.u - q.u) < 1e-6 && Math.abs(p.y - q.y) < 1e-6) continue;
      m.slab("stone", [at(w, p.u, p.y), at(w, q.u, q.y), at(w, q.u, H), at(w, p.u, H)], back);
      if (p.cu !== q.cu) continue;
      // the archivolt: a moulded band round the arch, standing proud of the face
      const off = (r: { u: number; y: number; cu: number }, s: number): [number, number] => [r.u + ((r.u - r.cu) / R) * s, r.y + ((r.y - ys) / R) * s];
      const po = off(p, 0.24);
      const qo = off(q, 0.24);
      m.slab("trim", [at(w, p.u, p.y, 0.06), at(w, q.u, q.y, 0.06), at(w, qo[0], qo[1], 0.06), at(w, po[0], po[1], 0.06)], mul(w.n, -0.06));
    }
    // the keystone over the joint of the two arcs
    const apex = pts[4]!;
    const hwk = 0.16;
    m.slab("trim", [at(w, apex.u - hwk, apex.y - 0.05, 0.09), at(w, apex.u + hwk, apex.y - 0.05, 0.09), at(w, apex.u + hwk * 1.3, apex.y + 0.22, 0.09), at(w, apex.u - hwk * 1.3, apex.y + 0.22, 0.09)], mul(w.n, -0.09));
  }
}

function groundFloor(m: MeshBuilder): void {
  m.scope("market hall", () => {
    m.scope("paving", () => m.box("paving", 0, 0, 2 * G.x + 0.8, 2 * G.z + 0.8, 0, FLOOR));
    const H = G.top - FLOOR;
    m.scope("front arcade", () => arcade(m, { o: [-G.x, FLOOR, G.z], u: [1, 0, 0], n: [0, 0, 1] }, 2 * G.x, 4, 1.6, 2.85 - FLOOR, 0.7));
    m.scope("east arcade", () => arcade(m, { o: [G.x, FLOOR, G.z], u: [0, 0, -1], n: [1, 0, 0] }, 2 * G.z, 3, 1.4, 3.0 - FLOOR, 0.7));
    m.scope("west arcade", () => arcade(m, { o: [-G.x, FLOOR, -G.z], u: [0, 0, 1], n: [-1, 0, 0] }, 2 * G.z, 3, 1.4, 3.0 - FLOOR, 0.7));
    m.scope("back wall", () => {
      const w: Wall = { o: [G.x, FLOOR, -G.z], u: [-1, 0, 0], n: [0, 0, -1] };
      m.slab("stone", [at(w, 0, -0.06), at(w, 2 * G.x, -0.06), at(w, 2 * G.x, H), at(w, 0, H)], mul(w.n, -G.thick));
      m.slab("trim", [at(w, 0, 0, 0.07), at(w, 2 * G.x, 0, 0.07), at(w, 2 * G.x, 0.42, 0.07), at(w, 0, 0.42, 0.07)], mul(w.n, -0.07));
      // the door, inside and out, in a stone frame
      for (const inner of [false, true]) {
        const d = inner ? -G.thick : 0;
        const nn = inner ? mul(w.n, -1) : w.n;
        const pd = (u: number, y: number, dd: number): Vec3 => at(w, u, y, d + (inner ? -dd : dd));
        const uc = G.x;
        m.slab("trim", [pd(uc - 1.0, 0.42, 0.06), pd(uc + 1.0, 0.42, 0.06), pd(uc + 1.0, 2.95, 0.06), pd(uc - 1.0, 2.95, 0.06)], mul(nn, -0.06));
        face(m, "timber", pd(uc - 0.75, 0.42, 0.08), pd(uc + 0.75, 0.42, 0.08), pd(uc + 0.75, 2.7, 0.08), pd(uc - 0.75, 2.7, 0.08), nn);
        for (const du of [-0.38, 0.38]) face(m, "gilt", pd(uc + du - 0.04, 1.3, 0.09), pd(uc + du + 0.04, 1.3, 0.09), pd(uc + du + 0.04, 1.42, 0.09), pd(uc + du - 0.04, 1.42, 0.09), nn);
      }
      // small barred windows in the back wall
      for (const uc of [12.4, 15.6]) {
        m.slab("trim", [at(w, uc - 0.55, 2.0, 0.06), at(w, uc + 0.55, 2.0, 0.06), at(w, uc + 0.55, 3.4, 0.06), at(w, uc - 0.55, 3.4, 0.06)], mul(w.n, -0.06));
        window(m, { o: add(w.o, mul(w.n, 0.06)), u: w.u, n: w.n }, uc - 0.4, 2.12, uc + 0.4, 3.28, false);
      }
    });
    m.scope("ceiling", () => {
      const ix = G.x - G.thick;
      const iz = G.z - G.thick;
      m.cap("timber", rect(2 * ix, 2 * iz), G.top, false);
      // the long beam on two braced posts
      m.box("timber", 0, 0, 2 * ix, 0.4, G.top - 0.38, G.top, 0, false);
      m.cap("timber", rect(2 * ix, 0.4), G.top - 0.38, false);
      for (const x of [-3.2, 3.2]) {
        m.box("trim", x, 0, 0.6, 0.6, FLOOR, FLOOR + 0.45);
        m.box("timber", x, 0, 0.34, 0.34, FLOOR + 0.45, G.top - 0.38, 0, false);
        for (const s of [-1, 1]) {
          const w: Wall = { o: [x, 0, -0.08], u: [1, 0, 0], n: [0, 0, 1] };
          wcurve(m, w, [s * 0.15, G.top - 1.6], [s * 0.35, G.top - 0.7], [s * 1.25, G.top - 0.4], 0.18, 3);
        }
      }
      // ceiling joists across the hall
      for (let x = -ix + 0.8; x < ix - 0.4; x += 1.6) m.box("timber", x, 0, 0.2, 2 * iz, G.top - 0.18, G.top, 0, false);
    });
  });
}

/**
 * A jetty at height y: the underside between the lower and upper storey footprints,
 * the timber band of the upper storey from y to y + 0.3, and the joist ends.
 */
function jetty(m: MeshBuilder, lx: number, lz: number, ux: number, uz: number, y: number, spacing: number): void {
  const dn: Vec3 = [0, -1, 0];
  face(m, "timber", [-lx, y, lz], [lx, y, lz], [ux, y, uz], [-ux, y, uz], dn);
  face(m, "timber", [-lx, y, -lz], [lx, y, -lz], [ux, y, -uz], [-ux, y, -uz], dn);
  face(m, "timber", [lx, y, -lz], [lx, y, lz], [ux, y, uz], [ux, y, -uz], dn);
  face(m, "timber", [-lx, y, -lz], [-lx, y, lz], [-ux, y, uz], [-ux, y, -uz], dn);
  m.prism("timber", rect(2 * ux, 2 * uz), y, y + 0.3, false);
  const joist = (cx: number, cz: number, nx: number, nz: number, len: number): void => {
    const tx = -nz;
    const tz = nx;
    const p = (t: number, yy: number): Vec3 => [cx + tx * t, yy, cz + tz * t];
    m.slab("timber", [p(-0.08, y - 0.15), p(0.08, y - 0.15), p(0.08, y + 0.1), p(-0.08, y + 0.1)], [-nx * len, 0, -nz * len]);
  };
  const out = 0.06;
  for (let x = -ux + 0.35; x <= ux - 0.3; x += spacing) {
    if (Math.abs(Math.abs(x) - OX) > OF + 0.1) joist(x, uz + out, 0, 1, uz + out - lz);
    joist(x, -uz - out, 0, -1, uz + out - lz);
  }
  for (let z = -uz + 0.35; z <= uz - 0.3; z += spacing) {
    if (z < OZ - OF - 0.1) {
      joist(ux + out, z, 1, 0, ux + out - lx);
      joist(-ux - out, z, -1, 0, ux + out - lx);
    }
  }
}

/** The four framed walls of a jettied storey (X, Z its half footprint). */
function storey(m: MeshBuilder, X: number, Z: number, y0: number, y1: number, brackets: boolean, backPat: string): void {
  const H = y1 - y0;
  m.prism("plaster", rect(2 * X, 2 * Z), y0, y1, false);
  const edge = OX - OF + 0.05; // the oriels hide the framing beyond this
  const walls: Array<{ w: Wall; ua: number; ub: number; pat: string }> = [
    { w: { o: [-X, y0, Z], u: [1, 0, 0], n: [0, 0, 1] }, ua: X - edge, ub: X + edge, pat: "LRWWLRWWLRWWLR" },
    { w: { o: [X, y0, -Z], u: [-1, 0, 0], n: [0, 0, -1] }, ua: 0, ub: 2 * X, pat: backPat },
    { w: { o: [X, y0, Z], u: [0, 0, -1], n: [1, 0, 0] }, ua: Z - (OZ - OF + 0.05), ub: 2 * Z, pat: "LRWWLRWWLR" },
    { w: { o: [-X, y0, -Z], u: [0, 0, 1], n: [-1, 0, 0] }, ua: 0, ub: Z + (OZ - OF + 0.05), pat: "LRWWLRWWLR" },
  ];
  for (const { w, ua, ub, pat } of walls) {
    const mann = framedStorey(m, w, ua, ub, H, pat);
    if (!brackets) continue;
    // carved brackets under the next jetty at every Mann post
    for (const u of mann) {
      const jet = S2.z - S1.z;
      const a = at(w, u - 0.09, H - 0.85, DP);
      const b = at(w, u - 0.09, H, DP);
      const c = at(w, u - 0.09, H, jet + 0.02);
      const d = at(w, u - 0.09, H - 0.2, jet + 0.02);
      m.slab("timber", [a, b, c, d], mul(w.u, 0.18));
    }
  }
  // carved corner posts at the back corners
  for (const sx of [-1, 1]) {
    const cx = sx * X;
    const cz = -Z;
    m.box("timber", cx, cz, 0.36, 0.36, y0, y1, 0, false);
    for (const f of [0.22, 0.5, 0.78]) {
      const y = y0 + f * H;
      m.loft("timber", oct(0.24, cx, cz), y - 0.12, oct(0.29, cx, cz), y, false);
      m.loft("timber", oct(0.29, cx, cz), y, oct(0.24, cx, cz), y + 0.12, false);
    }
  }
}

/** The outside stair along the back to the first storey's door, with its parapet. */
function outsideStair(m: MeshBuilder): void {
  m.scope("outside stair", () => {
    const xs = 1.9; // foot of the flight
    const xl = 8.3; // head of the flight, start of the landing
    const xw = S1.x - 0.03; // the outer face of the landing's end wall
    const xe = xw - 0.2; // end of the landing
    const zi = -G.z; // against the stone back wall
    const zo = -(S1.z + 1.4); // the outer edge of the treads
    const zp = zo - 0.05; // the parapet's inner face
    const top = S1.y0;
    const N = 24;
    const rise = top / N;
    const run = (xl - xs) / (N - 1);
    m.slab("stone", [[xs, 0, zo], [xw, 0, zo], [xw, top - 0.25, zo], [xl, top - 0.25, zo]], [0, 0, zi + 0.1 - zo]);
    for (let k = 1; k < N; k++) m.box("trim", xs + (k - 0.5) * run, (zp + zi - 0.05) / 2, run, zi - 0.05 - zp, Math.max(0, k * rise - 0.3), k * rise);
    m.box("trim", (xl + xe) / 2, (zp + zi - 0.05) / 2, xe - xl, zi - 0.05 - zp, top - 0.4, top);
    // the parapet wall on the outer side and at the landing's end, with its coping
    const pt = 0.22;
    const ph = 0.95;
    m.slab("stone", [[xs - 0.3, 0, zp], [xw, 0, zp], [xw, top + ph, zp], [xl, top + ph, zp], [xs - 0.3, ph - 0.25, zp]], [0, 0, -pt]);
    const ze = -S1.z - 0.045;
    m.box("stone", xw - 0.1, (zp - pt + ze) / 2, 0.2, ze - (zp - pt), 0, top + ph, 0, false);
    const sl = (top + 0.25) / (xl - xs + 0.3);
    m.slab("trim", [[xs - 0.35, ph - 0.25 - 0.05 * sl - 0.04, zp + 0.03], [xl, top + ph - 0.04, zp + 0.03], [xl, top + ph + 0.1, zp + 0.03], [xs - 0.35, ph - 0.25 - 0.05 * sl + 0.1, zp + 0.03]], [0, 0, -pt - 0.06]);
    m.box("trim", (xl + xw + 0.015) / 2, zp - pt / 2, xw + 0.015 - xl, pt + 0.06, top + ph - 0.04, top + ph + 0.1);
    m.box("trim", xw - 0.1, (zp - pt + ze) / 2, 0.23, ze - (zp - pt) - 0.05, top + ph - 0.04, top + ph + 0.1);
  });
}

function upperStoreys(m: MeshBuilder): void {
  m.scope("upper storeys", () => {
    m.scope("first jetty", () => jetty(m, G.x, G.z, S1.x, S1.z, G.top, 0.62));
    m.scope("first storey", () => storey(m, S1.x, S1.z, S1.y0, S1.y1, true, "DRWWLRWWWWLRWWLR"));
    m.scope("second jetty", () => jetty(m, S1.x, S1.z, S2.x, S2.z, S1.y1, 0.62));
    m.scope("second storey", () => storey(m, S2.x, S2.z, S2.y0, S2.y1, false, "LRWWLRWWWWLRWWLR"));
    m.scope("wall plate", () => m.prism("timber", rect(2 * S2.x, 2 * S2.z), S2.y1, PLATE, false));
  });
}

function oriel(m: MeshBuilder, sx: number): void {
  const cx = sx * OX;
  const cz = OZ;
  const ring = (r: number): Ring => oct(r, cx, cz);
  m.scope(sx > 0 ? "east oriel" : "west oriel", () => {
    m.scope("corbel", () => {
      const y = G.top - 4.4;
      m.loft("trim", ring(0.3), y + 2.7, ring(0.85), y + 3.5, false);
      m.loft("trim", ring(0.85), y + 3.5, ring(OR + 0.08), y + 4.25, false);
      m.cap("trim", ring(0.3), y + 2.7, false);
      m.prism("trim", ring(OR + 0.08), y + 4.25, G.top, false);
      m.cap("trim", ring(OR + 0.08), y + 4.25, false);
    });
    const storeys: Array<[number, number]> = [[S1.y0, S1.y1], [S2.y0, S2.y1], [PLATE, O_TOP]];
    m.scope("bands", () => {
      m.prism("timber", ring(OR + 0.06), G.top, S1.y0, false);
      m.prism("timber", ring(OR + 0.06), S1.y1, S2.y0, false);
      m.prism("timber", ring(OR + 0.06), S2.y1, PLATE, false);
    });
    m.scope("framing", () => {
      for (const [y0, y1] of storeys) {
        m.prism("plaster", ring(OR), y0, y1, false);
        const H = y1 - y0;
        for (let i = 0; i < 8; i++) {
          const a0 = Math.PI / 8 + (i * Math.PI) / 4;
          const a1 = a0 + Math.PI / 4;
          const am = (a0 + a1) / 2;
          const nx = Math.cos(am);
          const nz = -Math.sin(am);
          if (nx * sx + nz < -0.5) continue; // faces buried in the building
          const p0: Vec3 = [cx + OR * Math.cos(a0), y0, cz - OR * Math.sin(a0)];
          const p1: Vec3 = [cx + OR * Math.cos(a1), y0, cz - OR * Math.sin(a1)];
          const len = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
          const w: Wall = { o: p0, u: [(p1[0] - p0[0]) / len, 0, (p1[2] - p0[2]) / len], n: [nx, 0, nz] };
          wbeam(m, w, 0, 0.11, len, 0.11, 0.22, DP, 0.04);
          wbeam(m, w, 0, H - 0.11, len, H - 0.11, 0.22, DP, 0.04);
          wbeam(m, w, 0.02, 0.22, 0.02, H - 0.22, 0.2);
          if (H > 2.5) {
            wbeam(m, w, 0, 0.95, len, 0.95, 0.15);
            wbeam(m, w, 0, H - 0.8, len, H - 0.8, 0.15);
            window(m, w, 0.14, 1.03, len - 0.14, H - 0.88);
            wbeam(m, w, 0.12, 0.22, len - 0.12, 0.88, 0.11);
            wbeam(m, w, 0.12, 0.88, len - 0.12, 0.22, 0.11);
          } else {
            window(m, w, 0.16, 0.4, len - 0.16, H - 0.35, false);
          }
        }
      }
    });
    m.scope("helmet", () => {
      m.loft("timber", ring(OR + 0.02), O_TOP, ring(OR + 0.22), O_TOP + 0.25, false);
      m.cap("timber", ring(OR + 0.22), O_TOP + 0.25, false);
      m.prism("timber", ring(OR + 0.22), O_TOP + 0.25, O_TOP + 0.35, false);
      m.loft("roof", ring(OR + 0.3), O_TOP + 0.35, ring(OR - 0.1), O_TOP + 1.0, false);
      m.cap("roof", ring(OR + 0.3), O_TOP + 0.35, false);
      m.spire("roof", ring(OR - 0.1), O_TOP + 1.0, O_TIP);
      m.rod("gilt", [cx, O_TIP - 0.4, cz], [cx, O_TIP + 1.1, cz], 0.035, 6);
      ball(m, cx, O_TIP + 0.45, cz, 0.13);
    });
  });
}

/** A gilt ball of radius r about (x, y, z). */
function ball(m: MeshBuilder, x: number, y: number, z: number, r: number): void {
  const lat = [-1.2, -0.6, 0, 0.6, 1.2];
  let prev = oct(r * Math.cos(lat[0]!), x, z);
  let prevY = y + r * Math.sin(lat[0]!);
  m.cap("gilt", prev, prevY, false);
  for (let k = 1; k < lat.length; k++) {
    const ring = oct(r * Math.cos(lat[k]!), x, z);
    const yy = y + r * Math.sin(lat[k]!);
    m.loft("gilt", prev, prevY, ring, yy, k === lat.length - 1);
    prev = ring;
    prevY = yy;
  }
}

/**
 * A gabled dormer (or the clock gable) on the front (s = 1) or back (s = -1) slope:
 * its front wall stands where the roof is at yb (or at zFront), h high to the eaves,
 * hw half wide, its own roof at slope tanD. Returns the wall of its front face.
 */
function dormer(m: MeshBuilder, s: number, xc: number, yb: number, hw: number, h: number, tanD: number, opts: { zFront?: number; ov?: number; ovF?: number; wallT?: number; cheek?: string } = {}): Wall {
  const zf = opts.zFront ?? roofZ(yb);
  const ov = opts.ov ?? 0.12;
  const ovF = opts.ovF ?? 0.16;
  const wallT = opts.wallT ?? 0.12;
  const cheek = opts.cheek ?? "roof";
  const P = (x: number, y: number, z: number): Vec3 => [x, y, s * z];
  const yr = yb + h + hw * tanD;
  // the front wall, a pentagon
  const dn = 0.04 * Math.hypot(1, tanD); // the rakes stop 4 cm under the roof's top
  m.slab("plaster", [P(xc - hw, yb, zf), P(xc + hw, yb, zf), P(xc + hw, yb + h - dn, zf), P(xc, yr - dn, zf), P(xc - hw, yb + h - dn, zf)], [0, 0, -s * wallT]);
  // the cheeks, just outside the front wall
  for (const t of [-1, 1]) {
    const x = xc + t * (hw + 0.06);
    m.slab(cheek, [P(x, yb, zf), P(x, yb + h - dn, zf), P(x, yb + h - dn, roofZ(yb + h - dn))], [-t * 0.06, 0, 0]);
  }
  // the roof
  const ye = yb + h - ov * tanD;
  const zr = roofZ(yr);
  const ze = roofZ(ye);
  for (const t of [-1, 1]) {
    const nrm = Math.hypot(tanD, 1);
    const depth: Vec3 = [(-t * tanD * 0.08) / nrm, -0.08 / nrm, 0];
    m.slab("roof", [P(xc + t * (hw + ov), ye, zf + ovF), P(xc, yr, zf + ovF), P(xc, yr, zr), P(xc + t * (hw + ov), ye, ze)], depth);
  }
  // the barge boards
  for (const t of [-1, 1]) {
    const z = zf + ovF + 0.06;
    const a = P(xc + t * (hw + ov), ye - 0.03, z);
    const b = P(xc, yr - 0.03, z);
    const dy = 0.2;
    m.slab("timber", [a, b, add(b, [0, -dy, 0]), add(a, [0, -dy, 0])], [0, 0, -s * 0.06]);
  }
  return { o: P(xc - s * hw, yb, zf), u: [s, 0, 0], n: [0, 0, s] };
}

/** A small dormer with a framed leaded window. */
function smallDormer(m: MeshBuilder, s: number, xc: number, yb: number, hw: number, h: number): void {
  const ww = dormer(m, s, xc, yb, hw, h, 1.25);
  const span = 2 * hw;
  const m0 = 0.14;
  window(m, ww, m0, 0.16, span - m0, h - 0.1, false);
  wbeam(m, ww, m0 - 0.05, 0.05, m0 - 0.05, h - 0.02, 0.1, 0.06);
  wbeam(m, ww, span - m0 + 0.05, 0.05, span - m0 + 0.05, h - 0.02, 0.1, 0.06);
  wbeam(m, ww, 0.04, h - 0.05, span - 0.04, h - 0.05, 0.1, 0.06);
  wbeam(m, ww, 0.04, 0.08, span - 0.04, 0.08, 0.1, 0.06);
}

function roof(m: MeshBuilder): void {
  m.scope("roof", () => {
    const L = Math.hypot(1, TAN);
    const xa = -(S2.x + VERGE);
    const xb = S2.x + VERGE;
    const zE = S2.z + EAVE;
    const yE = roofY(zE);
    m.scope("slopes", () => {
      for (const s of [1, -1]) {
        const depth: Vec3 = [0, -ROOF_T / L, (-s * ROOF_T * TAN) / L];
        const lift = mul(depth, -0.03 / ROOF_T);
        const slab = (x0: number, x1: number, z0: number, courses = true): void => {
          m.slab("roof", [[x0, roofY(z0), s * z0], [x1, roofY(z0), s * z0], [x1, RIDGE, 0], [x0, RIDGE, 0]], depth);
          if (!courses) return;
          // the tile courses: darker bands standing 3 cm proud of the slope
          for (let z = z0 - 0.35; z > 0.5; z -= 0.62) {
            const za = z;
            const zb = z - 0.1;
            const P = (x: number, zz: number): Vec3 => add([x, roofY(zz), s * zz], lift);
            m.slab("course", [P(x0 + 0.02, za), P(x1 - 0.02, za), P(x1 - 0.02, zb), P(x0 + 0.02, zb)], mul(lift, -1.7));
          }
        };
        if (s > 0) {
          slab(xa, -CG_HW - 0.03, zE);
          slab(CG_HW + 0.03, xb, zE);
          slab(-CG_HW, CG_HW, roofZ(PLATE + CG_WALL), false);
        } else slab(xa, xb, zE);
      }
      m.rod("roof", [xa, RIDGE + 0.02, 0], [xb, RIDGE + 0.02, 0], 0.14, 6);
    });
    m.scope("gables", () => {
      for (const sx of [1, -1]) {
        const w: Wall = sx > 0 ? { o: [S2.x, PLATE, S2.z], u: [0, 0, -1], n: [1, 0, 0] } : { o: [-S2.x, PLATE, -S2.z], u: [0, 0, 1], n: [-1, 0, 0] };
        const g = 0.1 / TAN; // the gable stops 0.1 m under the roof's top surface
        m.slab("plaster", [at(w, g, 0), at(w, 2 * S2.z - g, 0), at(w, S2.z, RIDGE - PLATE - 0.1)], mul(w.n, -0.2));
        framedGable(m, w, 2 * S2.z, RIDGE - PLATE, 10);
        // the barge boards along the rakes
        const x = sx * (xb + 0.08);
        for (const s of [1, -1]) {
          const a: Vec3 = [x, yE - 0.03, s * zE];
          const b: Vec3 = [x, RIDGE - 0.03, 0];
          m.slab("timber", [a, b, add(b, [0, -0.55, 0]), add(a, [0, -0.55, 0])], [-sx * 0.08, 0, 0]);
        }
      }
    });
    m.scope("dormers", () => {
      const rows: Array<{ y: number; hw: number; h: number; front: number[]; back: number[] }> = [
        { y: PLATE + 1.7, hw: 0.55, h: 1.1, front: [-6.2, -4.3, 4.3, 6.2], back: [-7.4, -4.5, -1.5, 1.5, 4.5, 7.4] },
        { y: PLATE + 4.7, hw: 0.45, h: 0.85, front: [-6.3, -4.0, 4.0, 6.3], back: [-6.0, -3.0, 3.0, 6.0] },
        { y: PLATE + 7.4, hw: 0.32, h: 0.55, front: [-4.6, -2.4, 2.4, 4.6], back: [-4.6, -2.4, 2.4, 4.6] },
      ];
      for (const r of rows) {
        for (const x of r.front) smallDormer(m, 1, x, r.y, r.hw, r.h);
        for (const x of r.back) smallDormer(m, -1, x, r.y, r.hw, r.h);
      }
    });
  });
}

function clockGable(m: MeshBuilder): void {
  m.scope("clock gable", () => {
    const tanD = TAN;
    const w = dormer(m, 1, 0, PLATE, CG_HW, CG_WALL, tanD, { zFront: S2.z, ov: 0.3, ovF: 0.4, wallT: 0.25, cheek: "plaster" });
    const span = 2 * CG_HW;
    framedStorey(m, w, 0, span, CG_WALL, "LWWR");
    // the gable triangle over it
    const gw: Wall = { o: [w.o[0], PLATE + CG_WALL, w.o[2]], u: w.u, n: w.n };
    const rise = CG_HW * tanD;
    wbeam(m, gw, 0.25, 0.12, CG_HW, rise - 0.45, 0.2, DP, 0.08);
    wbeam(m, gw, span - 0.25, 0.12, CG_HW, rise - 0.45, 0.2, DP, 0.08);
    for (const u of [1.0, span - 1.0]) wbeam(m, gw, u, 0.1, u, (CG_HW - Math.abs(u - CG_HW)) * tanD - 0.35, 0.18);
    wbeam(m, gw, CG_HW, 2.2, CG_HW, rise - 0.3, 0.18);
    // the side walls' top plates
    for (const t of [-1, 1]) {
      const x = t * (CG_HW + 0.16);
      m.slab("timber", [[x, PLATE + CG_WALL - 0.2, S2.z + 0.02], [x, PLATE + CG_WALL, S2.z + 0.02], [x, PLATE + CG_WALL, roofZ(PLATE + CG_WALL)], [x, PLATE + CG_WALL - 0.2, roofZ(PLATE + CG_WALL - 0.2)]], [-t * 0.1, 0, 0]);
    }
    // the clock
    const yc = PLATE + CG_WALL + 1.25;
    const zc = S2.z;
    const disc = (r: number, d: number, mat: string, depth: number): void => {
      const pts: Vec3[] = [];
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        pts.push([r * Math.cos(a), yc + r * Math.sin(a), zc + d]);
      }
      m.slab(mat, pts, [0, 0, -depth]);
    };
    disc(0.82, 0.12, "gilt", 0.04);
    disc(0.72, 0.15, "dial", 0.03);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const c: Vec3 = [0.6 * Math.cos(a), yc + 0.6 * Math.sin(a), zc + 0.17];
      const r = k % 3 === 0 ? 0.06 : 0.035;
      m.slab("gilt", [add(c, [-r, -r, 0]), add(c, [r, -r, 0]), add(c, [r, r, 0]), add(c, [-r, r, 0])], [0, 0, -0.02]);
    }
    const hand = (len: number, ang: number, wd: number): void => {
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      const px = -dy * wd;
      const py = dx * wd;
      m.slab("gilt", [[px - dx * 0.08, yc + py - dy * 0.08, zc + 0.19], [dx * len, yc + dy * len, zc + 0.19], [-px - dx * 0.08, yc - py - dy * 0.08, zc + 0.19]], [0, 0, -0.02]);
    };
    hand(0.38, Math.PI * 0.32, 0.05);
    hand(0.58, Math.PI * 0.5 + 0.9, 0.035);
  });
}

function roofTurret(m: MeshBuilder): void {
  m.scope("roof turret", () => {
    const y0 = RIDGE - 1.6;
    m.scope("base", () => {
      m.box("slate", 0, 0, 1.8, 1.8, y0, RIDGE + 0.5, 0, false);
      m.prism("timber", oct(1.3), RIDGE + 0.5, RIDGE + 0.7);
      m.cap("timber", oct(1.3), RIDGE + 0.5, false);
    });
    const yl = RIDGE + 0.7;
    const yt = yl + 2.3;
    m.scope("bell lantern", () => {
      for (let i = 0; i < 8; i++) {
        const a = Math.PI / 8 + (i * Math.PI) / 4;
        const x = 1.05 * Math.cos(a);
        const z = -1.05 * Math.sin(a);
        m.box("timber", x, z, 0.17, 0.17, yl, yt, -a, false);
        // a curved arch head and a rail between this post and the next
        const b = a + Math.PI / 4;
        const x1 = 1.05 * Math.cos(b);
        const z1 = -1.05 * Math.sin(b);
        const len = Math.hypot(x1 - x, z1 - z);
        const am = (a + b) / 2;
        const w: Wall = { o: [x, yl, z], u: [(x1 - x) / len, 0, (z1 - z) / len], n: [Math.cos(am), 0, -Math.sin(am)] };
        wcurve(m, w, [0.05, yt - yl - 0.55], [len / 2, yt - yl - 0.05], [len - 0.05, yt - yl - 0.55], 0.1, 3);
        wbeam(m, w, 0, 0.75, len, 0.75, 0.1, DP, 0.03);
      }
      m.prism("timber", oct(1.22), yt, yt + 0.28);
      m.cap("timber", oct(1.22), yt, false);
      // the bell on its yoke
      m.box("timber", 0, 0, 1.9, 0.14, yt - 0.3, yt - 0.14, 0, true);
      const bell: Array<[number, number]> = [[0.08, yt - 0.3], [0.2, yt - 0.42], [0.3, yt - 0.75], [0.36, yt - 1.05], [0.46, yt - 1.25]];
      for (let k = 0; k + 1 < bell.length; k++) m.loft("gilt", oct(bell[k + 1]![0]), bell[k + 1]![1], oct(bell[k]![0]), bell[k]![1], k === 0);
    });
    m.scope("onion", () => {
      const prof: Array<[number, number]> = [[1.15, yt + 0.28], [1.32, yt + 0.75], [1.24, yt + 1.2], [0.92, yt + 1.65], [0.48, yt + 2.05], [0.2, yt + 2.35], [0.14, yt + 2.6]];
      m.cap("copper", oct(prof[0]![0]), prof[0]![1], false);
      for (let k = 0; k + 1 < prof.length; k++) m.loft("copper", oct(prof[k]![0]), prof[k]![1], oct(prof[k + 1]![0]), prof[k + 1]![1], false);
      const yn = yt + 2.6;
      m.prism("copper", oct(0.14), yn, yn + 0.35, false);
      m.loft("copper", oct(0.14), yn + 0.35, oct(0.3), yn + 0.6, false);
      m.spire("copper", oct(0.3), yn + 0.6, yn + 1.3);
      m.rod("gilt", [0, yn + 1.1, 0], [0, DR_TOP - 0.05, 0], 0.035, 6);
      ball(m, 0, yn + 1.55, 0, 0.16);
      // a small gilt star on top
      const ys = DR_TOP - 0.25;
      m.slab("gilt", [[0, ys - 0.2, 0], [0.2, ys, 0], [0, ys + 0.2, 0], [-0.2, ys, 0]], [0, 0, 0.03]);
    });
  });
}

export function halfTimberedTownHall(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("half-timbered town hall", () => {
    groundFloor(m);
    upperStoreys(m);
    outsideStair(m);
    oriel(m, 1);
    oriel(m, -1);
    roof(m);
    clockGable(m);
    roofTurret(m);
  });
  return m;
}

export function halfTimberedTownHallLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  lodBox(m, "stone", 0, 0, 2 * G.x, 2 * G.z, 0, G.top);
  // the arches as dark blocks just proud of the front and ends
  {
    const fo = (2 * G.x - 5 * 1.6) / 4;
    for (let i = 0; i < 4; i++) lodBox(m, "timber", -G.x + 1.6 + fo / 2 + i * (fo + 1.6), G.z + 0.02, fo, 0.06, FLOOR, 4.3);
    const so = (2 * G.z - 4 * 1.4) / 3;
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) lodBox(m, "timber", sx * (G.x + 0.02), -G.z + 1.4 + so / 2 + i * (so + 1.4), 0.06, so, FLOOR, 4.2);
  }
  lodBox(m, "timber", 0, 0, 2 * S1.x, 2 * S1.z, G.top, S1.y0);
  lodBox(m, "plaster", 0, 0, 2 * S1.x, 2 * S1.z, S1.y0, S1.y1);
  lodBox(m, "timber", 0, 0, 2 * S2.x, 2 * S2.z, S1.y1, S2.y0);
  lodBox(m, "plaster", 0, 0, 2 * S2.x, 2 * S2.z, S2.y0, S2.y1);
  // the roof: a gabled prism with its eaves and verges
  const xa = -(S2.x + VERGE);
  const xb = S2.x + VERGE;
  const zE = S2.z + EAVE;
  const yE = roofY(zE);
  const slope = (s: number, x0: number, x1: number, z0: number): void => face(m, "roof", [x0, roofY(z0), s * z0], [x1, roofY(z0), s * z0], [x1, RIDGE, 0], [x0, RIDGE, 0], [0, 1, s * TAN]);
  slope(-1, xa, xb, zE);
  slope(1, xa, -CG_HW, zE);
  slope(1, CG_HW, xb, zE);
  slope(1, -CG_HW, CG_HW, roofZ(PLATE + CG_WALL));
  face(m, "roof", [xa, yE, zE], [xb, yE, zE], [xb, yE, -zE], [xa, yE, -zE], [0, -1, 0]);
  for (const sx of [-1, 1]) {
    const x = sx * xb;
    m.facets("plaster", [[x, yE, zE], [x, yE, -zE], [x, RIDGE, 0]], [sx, 0, 0]);
  }
  // the clock gable
  const yw = PLATE + CG_WALL;
  const yr = yw + CG_HW * TAN;
  m.slab("plaster", [[-CG_HW, PLATE, S2.z], [CG_HW, PLATE, S2.z], [CG_HW, yw, S2.z], [0, yr, S2.z], [-CG_HW, yw, S2.z]], [0, 0, roofZ(yr) - S2.z]);
  for (const t of [-1, 1]) face(m, "roof", [t * (CG_HW + 0.3), yw - 0.3 * TAN + 0.05, S2.z + 0.35], [0, yr + 0.05, S2.z + 0.35], [0, yr + 0.05, roofZ(yr)], [t * (CG_HW + 0.3), yw - 0.3 * TAN + 0.05, roofZ(yw - 0.3 * TAN)], [t * TAN, 1, 0]);
  // the oriels
  for (const sx of [-1, 1]) {
    const cx = sx * OX;
    lodLoft(m, "stone", oct(0.4, cx, OZ), G.top - 1.6, oct(OR, cx, OZ), G.top);
    m.prism("plaster", oct(OR, cx, OZ), G.top, O_TOP, false);
    m.prism("timber", oct(OR + 0.2, cx, OZ), O_TOP, O_TOP + 0.35, false);
    m.cap("timber", oct(OR + 0.2, cx, OZ), O_TOP, false);
    m.spire("roof", oct(OR + 0.2, cx, OZ), O_TOP + 0.35, O_TIP + 1.0);
  }
  // the roof turret
  lodBox(m, "slate", 0, 0, 1.8, 1.8, RIDGE - 1.6, RIDGE + 3.2);
  lodLoft(m, "copper", oct(1.25), RIDGE + 3.2, oct(0.9), RIDGE + 4.6);
  m.spire("copper", oct(0.9), RIDGE + 4.6, DR_TOP - 0.1);
  return m;
}

export const HALF_TIMBERED_TOWN_HALL: ProceduralDesign[] = [
  {
    id: "bld-half-timbered-town-hall",
    game: { plaza: { cities: ["village", "town"], layouts: ["rect"], fit: "footprint" } },
    title: "Half-Timbered Town Hall",
    build: halfTimberedTownHall,
    buildLod: halfTimberedTownHallLod,
    references: "half-timbered-town-hall",
    catalog: PLAZA_CATALOG,
  },
];
