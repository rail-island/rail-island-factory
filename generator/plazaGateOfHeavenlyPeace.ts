// The Gate of Heavenly Peace (Tiananmen) in Beijing, the southern gate of the Imperial
// City (1420, rebuilt 1651): the podium and the gate tower alone. A plaza landmark
// (docs/models/plaza-landmarks.md): the game may stand it on the rectangular main
// square of a city, and supplies the ground round it and under it.
//
// What it reproduces (photos in assets/gate-of-heavenly-peace/, measured in px against
// the gate's 66 m width and 32.6 m height):
// - the podium: 66 x 37 m at the foot, 12 m high, red plastered walls with a batter
//   and a grey stone plinth, the grey coping and the white marble balustrade along
//   its top; five arched gateways pass right through it along Z, the central one the
//   largest, their walls and vaults drawn but no floor (the game's ground shows
//   through); above the central gateway a plain red wall panel;
// - the gate tower on its marble base: the nine-bay by five-bay hall, red columns
//   round a veranda before red lattice doors and windows; the blue and green painted
//   beams and the bracket sets (dougong) in two staggered courses under each eave;
// - the double-eaved hip-and-gable (xieshan) roof of golden-yellow glazed tiles: the
//   lower eave a skirt round the upper storey, the upper roof hipped below and gabled
//   above, both with a concave profile, upturned corners and tile ribs in real relief;
//   the red gables with their gilt ornament and bargeboards; the main ridge with the
//   chiwen at its ends, the hip and gable ridges and the little ridge beasts.
//
// Deviations: no forecourt (the Outer Jinshui river, its five bridges and the two
// huabiao are left out, and there is no paving: the game draws the ground); no
// portrait, banners or slogans (the wall above the central gateway is a plain panel);
// the lattice is panels and bars, not pierced; the dragons and beasts are blocks.
//
// Metres, +Y up, base at y = 0 (the podium walls' foot), centred on the podium's
// footprint; the gate faces +Z (south). Sources: Wikipedia "Tiananmen" and the
// photographs in assets/gate-of-heavenly-peace/ (SOURCES.md). Deterministic: the same
// code gives the same bytes. The id is what the game's saved maps store, so it is never
// renamed once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  plaster: { color: "#a3322b", roughness: 0.9 },
  plasterShade: { color: "#6e2420", roughness: 0.95 },
  stone: { color: "#9d9a93", roughness: 0.9 },
  marble: { color: "#ece9e1", roughness: 0.85 },
  lacquer: { color: "#b02a20", roughness: 0.55 },
  lattice: { color: "#6e1f17", roughness: 0.7 },
  gilt: { color: "#d2a645", metallic: 0.6, roughness: 0.35 },
  paintBlue: { color: "#2a5596", roughness: 0.6 },
  paintGreen: { color: "#2f8068", roughness: 0.6 },
  tile: { color: "#e3a72a", metallic: 0.1, roughness: 0.4 },
};

// --- general helpers ------------------------------------------------------------------

/** A quad wound to face along n. */
function quadN(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  m.facets(mat, [a, b, c, a, c, d], n);
}

/** The surface between two closed rings at ya and yb (equal lengths), every face turned up or down. */
function band(m: MeshBuilder, mat: string, a: Ring, ya: number, b: Ring, yb: number, up: boolean): void {
  const pts: Vec3[] = [];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    pts.push([a[i]![0], ya, a[i]![1]], [a[j]![0], ya, a[j]![1]], [b[j]![0], yb, b[j]![1]]);
    pts.push([a[i]![0], ya, a[i]![1]], [b[j]![0], yb, b[j]![1]], [b[i]![0], yb, b[i]![1]]);
  }
  m.facets(mat, pts, [0, up ? 1 : -1, 0]);
}

/** A rectangular band hx x hz (half sizes) from y0 to y1, open top, with its underside from the rect (ix, iz). */
function rectBand(m: MeshBuilder, mat: string, hx: number, hz: number, y0: number, y1: number, ix: number, iz: number): void {
  m.prism(mat, rect(2 * hx, 2 * hz), y0, y1, false);
  band(m, mat, rect(2 * ix, 2 * iz), y0, rect(2 * hx, 2 * hz), y0, false);
}

// --- the rectangular eave rings ---------------------------------------------------------

/** One sample of a rectangular ring: its plan point, its side (0 front +Z, 1 +X, 2 back, 3 -X), its distance to the nearest corner. */
interface RPt {
  x: number;
  z: number;
  side: number;
  q: number;
  corner: boolean;
  odd: boolean;
}

/** A ring round the rect hx x hz: kx segments on the long sides, kz on the ends (both even), wound like rect(). */
function rring(hx: number, hz: number, kx: number, kz: number): RPt[] {
  const out: RPt[] = [];
  const sides: Array<{ k: number; len: number; at: (t: number) => [number, number] }> = [
    { k: kx, len: 2 * hx, at: (t) => [-hx + 2 * hx * t, hz] },
    { k: kz, len: 2 * hz, at: (t) => [hx, hz - 2 * hz * t] },
    { k: kx, len: 2 * hx, at: (t) => [hx - 2 * hx * t, -hz] },
    { k: kz, len: 2 * hz, at: (t) => [-hx, -hz + 2 * hz * t] },
  ];
  sides.forEach((s, side) => {
    for (let j = 0; j < s.k; j++) {
      const t = j / s.k;
      const [x, z] = s.at(t);
      out.push({ x, z, side, q: Math.min(t, 1 - t) * s.len, corner: j === 0, odd: j % 2 === 1 });
    }
  });
  return out;
}

const SIDE_N: Vec3[] = [[0, 0, 1], [1, 0, 0], [0, 0, -1], [-1, 0, 0]];

/** A strip between two rings of points (equal lengths, closed), each quad wound along the side normal of its first point, or up/down. */
function ringSheet(m: MeshBuilder, mat: string, a: Vec3[], b: Vec3[], sides: number[], facing: "out" | "up" | "down"): void {
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const nrm: Vec3 = facing === "out" ? SIDE_N[sides[i]!]! : [0, facing === "up" ? 1 : -1, 0];
    quadN(m, mat, a[i]!, a[j]!, b[j]!, b[i]!, nrm);
  }
}

/** An eave: the bracket band and its two courses of blocks, the soffit, the fascia; the roof is drawn by the caller. */
interface Eave {
  /** The beam (architrave) band: half sizes, bottom, top; the rect its underside starts from. */
  bx: number;
  bz: number;
  yB0: number;
  yB1: number;
  ux: number;
  uz: number;
  /** The bracket band's top. */
  yDg: number;
  /** The lip's half sizes, the fascia's bottom and the lip. */
  lx: number;
  lz: number;
  yF0: number;
  yLip: number;
  kx: number;
  kz: number;
  /** Corner upturn at the lip and how far along the side it reaches. */
  lift: number;
  reach: number;
}

const cornerLift = (e: Eave, q: number): number => e.lift * Math.pow(Math.max(0, 1 - q / e.reach), 2);

function brackets(m: MeshBuilder, e: Eave): void {
  rectBand(m, "paintBlue", e.bx, e.bz, e.yB0, e.yB1, e.ux, e.uz);
  // a gilt bead between the beam and the bracket band
  rectBand(m, "gilt", e.bx + 0.06, e.bz + 0.06, e.yB1 - 0.12, e.yB1, e.bx, e.bz);
  const dx = e.bx + 0.1;
  const dz = e.bz + 0.1;
  rectBand(m, "paintGreen", dx, dz, e.yB1, e.yDg, e.bx + 0.06, e.bz + 0.06);
  const yMid = (e.yB1 + e.yDg) / 2;
  const step = 1.3;
  for (const [tier, off, out, y0, y1] of [[0, 0, 0.45, e.yB1 + 0.06, yMid], [1, 0.5, 0.85, yMid, e.yDg - 0.03]] as Array<[number, number, number, number, number]>) {
    const mat = tier ? "paintBlue" : "paintGreen";
    for (const [len, hOther, along] of [[2 * dx, dz, "x"], [2 * dz, dx, "z"]] as Array<[number, number, "x" | "z"]>) {
      const n = Math.round(len / step);
      for (let k = 0; k < n; k++) {
        const t = -len / 2 + ((k + 0.5 + off) / n) * len;
        if (Math.abs(t) > len / 2 - 0.3) continue;
        for (const s of [-1, 1]) {
          const c = s * (hOther - 0.1 + out / 2);
          const w = 0.42;
          const d = out + 0.1;
          const [cx, cz, bw, bd] = along === "x" ? [t, c, w, d] : [c, t, d, w];
          m.box(mat, cx, cz, bw, bd, y0, y1);
          m.cap(mat, rect(bw, bd, cx, cz), y0, false);
        }
      }
    }
  }
}

/** The soffit from the bracket band out to the lip and the two-coloured fascia; returns the lip ring's points. */
function soffitFascia(m: MeshBuilder, e: Eave): RPt[] {
  const lip = rring(e.lx, e.lz, e.kx, e.kz);
  const inner = rring(e.bx + 0.1, e.bz + 0.1, e.kx, e.kz);
  const sides = lip.map((p) => p.side);
  const f0 = lip.map((p): Vec3 => [p.x, e.yF0 + cornerLift(e, p.q), p.z]);
  const fm = lip.map((p): Vec3 => [p.x, e.yF0 + 0.45 * (e.yLip - e.yF0) + cornerLift(e, p.q), p.z]);
  const f1 = lip.map((p): Vec3 => [p.x, e.yLip + cornerLift(e, p.q), p.z]);
  const ins = inner.map((p): Vec3 => [p.x, e.yDg, p.z]);
  m.scope("soffit", () => ringSheet(m, "paintBlue", ins, f0, sides, "down"));
  m.scope("fascia", () => {
    ringSheet(m, "paintGreen", f0, fm, sides, "out");
    ringSheet(m, "lacquer", fm, f1, sides, "out");
  });
  return lip;
}

/** The height of a roof at depth d in from the lip: concave, steepening toward the top. */
function roofY(yLip: number, yTop: number, dTop: number, p: number, d: number): number {
  return yLip + (yTop - yLip) * Math.pow(d / dTop, p);
}

/**
 * Hipped roof rings from the lip (d = 0) to depth dEnd: lofted between rectangular
 * contours, with the corner upturn fading inward and every second point raised as a
 * tile rib. Returns the rings' corner points (for the hip ridges).
 */
function hipRings(m: MeshBuilder, e: Eave, dEnd: number, rings: number, y: (d: number) => number, ribTop: boolean): Vec3[][] {
  const levels: Vec3[][] = [];
  let sides: number[] = [];
  const corners: Vec3[][] = [[], [], [], []];
  for (let j = 0; j <= rings; j++) {
    const d = dEnd * Math.pow(j / rings, 1.15);
    const ring = rring(e.lx - d, e.lz - d, e.kx, e.kz);
    sides = ring.map((p) => p.side);
    const fade = Math.pow(Math.max(0, 1 - d / 3.5), 2);
    const rib = j === 0 || (j === rings && !ribTop) ? 0 : 0.13;
    const pts = ring.map((p): Vec3 => [p.x, y(d) + cornerLift(e, p.q) * fade + (p.odd ? rib : 0), p.z]);
    ring.forEach((p, i) => {
      if (p.corner) corners[p.side]!.push(pts[i]!);
    });
    levels.push(pts);
  }
  for (let j = 0; j < rings; j++) ringSheet(m, "tile", levels[j]!, levels[j + 1]!, sides, "up");
  return corners;
}

/** A ridge cap along a polyline: a square rod per segment, slightly above it. */
function ridgeLine(m: MeshBuilder, pts: Vec3[], r: number): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    m.rod("tile", [a[0], a[1] + r * 0.6, a[2]], [b[0], b[1] + r * 0.6, b[2]], r, 4, i === 0);
  }
}

/** The little beasts on a hip ridge near its lower end, and the end ornament. */
function ridgeBeasts(m: MeshBuilder, pts: Vec3[], n: number): void {
  const a = pts[0]!;
  const b = pts[1]!;
  const L = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const ux = (b[0] - a[0]) / L;
  const uz = (b[2] - a[2]) / L;
  const ry = Math.atan2(ux, uz);
  for (let k = 0; k < n; k++) {
    const t = (0.5 + k * 0.6) / L;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    const yb = a[1] + (b[1] - a[1]) * t + 0.2;
    const h = k === 0 ? 0.65 : 0.45;
    m.box("tile", x, z, 0.24, 0.32, yb, yb + h, ry);
  }
}

// --- the podium --------------------------------------------------------------------------

/** The podium's half sizes at its foot, its height, the batter (inward per metre of height). */
const PX = 33;
const PZ0 = 18.5;
const PH = 12;
const BATTER = 0.075;
const COPE = 1.0;
const PLINTH = 1.4;

const xF = (y: number): number => PX - BATTER * y;
const zF = (y: number): number => PZ0 - BATTER * y;

/** The five gateways: centre x, width, springing height (semicircular heads). */
const GATES: Array<{ c: number; w: number; s: number }> = [
  { c: -23, w: 3.6, s: 3.1 },
  { c: -12.5, w: 4.4, s: 3.7 },
  { c: 0, w: 5.4, s: 4.7 },
  { c: 12.5, w: 4.4, s: 3.7 },
  { c: 23, w: 3.6, s: 3.1 },
];
const ARCH_N = 10;

const archPts = (g: { c: number; w: number; s: number }): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= ARCH_N; i++) {
    const a = Math.PI - (i / ARCH_N) * Math.PI;
    out.push([g.c + (g.w / 2) * Math.cos(a), g.s + (g.w / 2) * Math.sin(a)]);
  }
  return out;
};

function podium(m: MeshBuilder): void {
  const yT = PH - COPE;
  m.scope("front and back walls", () => {
    for (const sz of [1, -1]) {
      const P = (x: number, y: number): Vec3 => [x, y, sz * zF(y)];
      const nrm: Vec3 = [0, BATTER, sz];
      const pier = (x0f: number, x0t: number, x1f: number, x1t: number): void => {
        // a pier from x0 to x1 at the foot (f) and top (t), split at the plinth
        const xa = (x0t - x0f) * (PLINTH / yT);
        const xb = (x1t - x1f) * (PLINTH / yT);
        quadN(m, "stone", P(x0f, 0), P(x1f, 0), P(x1f + xb, PLINTH), P(x0f + xa, PLINTH), nrm);
        quadN(m, "plaster", P(x0f + xa, PLINTH), P(x1f + xb, PLINTH), P(x1t, yT), P(x0t, yT), nrm);
      };
      pier(-xF(0), -xF(yT), GATES[0]!.c - GATES[0]!.w / 2, GATES[0]!.c - GATES[0]!.w / 2);
      for (let i = 0; i + 1 < GATES.length; i++) {
        const a = GATES[i]!.c + GATES[i]!.w / 2;
        const b = GATES[i + 1]!.c - GATES[i + 1]!.w / 2;
        pier(a, a, b, b);
      }
      const last = GATES[GATES.length - 1]!;
      pier(last.c + last.w / 2, last.c + last.w / 2, xF(0), xF(yT));
      for (const g of GATES) {
        const pts = archPts(g);
        for (let i = 0; i < ARCH_N; i++) {
          const [x0, y0] = pts[i]!;
          const [x1, y1] = pts[i + 1]!;
          quadN(m, "plaster", P(x0, y0), P(x1, y1), P(x1, yT), P(x0, yT), nrm);
        }
      }
    }
  });
  m.scope("end walls", () => {
    for (const sx of [1, -1]) {
      const nrm: Vec3 = [sx, BATTER, 0];
      const Q = (y: number, s: number): Vec3 => [sx * xF(y), y, s * zF(y)];
      quadN(m, "stone", Q(0, -1), Q(0, 1), Q(PLINTH, 1), Q(PLINTH, -1), nrm);
      quadN(m, "plaster", Q(PLINTH, -1), Q(PLINTH, 1), Q(yT, 1), Q(yT, -1), nrm);
    }
  });
  m.scope("gateways", () => {
    for (const g of GATES) {
      // the jambs, then the vault, all facing into the passage
      for (const s of [-1, 1]) {
        const x = g.c + (s * g.w) / 2;
        quadN(m, "plasterShade", [x, 0, -zF(0)], [x, 0, zF(0)], [x, g.s, zF(g.s)], [x, g.s, -zF(g.s)], [-s, 0, 0]);
      }
      const pts = archPts(g);
      for (let i = 0; i < ARCH_N; i++) {
        const [x0, y0] = pts[i]!;
        const [x1, y1] = pts[i + 1]!;
        const nrm: Vec3 = [g.c - (x0 + x1) / 2, g.s - (y0 + y1) / 2, 0];
        quadN(m, "plasterShade", [x0, y0, zF(y0)], [x1, y1, zF(y1)], [x1, y1, -zF(y1)], [x0, y0, -zF(y0)], nrm);
      }
    }
  });
  m.scope("coping", () => {
    const hx = xF(yT) + 0.25;
    const hz = zF(yT) + 0.25;
    m.prism("stone", rect(2 * hx, 2 * hz), yT, PH);
    band(m, "stone", rect(2 * xF(yT), 2 * zF(yT)), yT, rect(2 * hx, 2 * hz), yT, false);
  });
  m.scope("wall panel", () => {
    // the plain red panel above the central gateway, framed, standing proud of the batter
    const nl = Math.hypot(BATTER, 1);
    const n: Vec3 = [0, BATTER / nl, 1 / nl];
    const at = (x: number, y: number, o: number): Vec3 => [x, y + n[1] * o, zF(y) + n[2] * o];
    const into = (dep: number): Vec3 => [0, -n[1] * dep, -n[2] * dep];
    m.slab("stone", [at(-4.1, 8.1, 0.06), at(4.1, 8.1, 0.06), at(4.1, 10.4, 0.06), at(-4.1, 10.4, 0.06)], into(0.12));
    m.slab("plaster", [at(-3.85, 8.3, 0.1), at(3.85, 8.3, 0.1), at(3.85, 10.2, 0.1), at(-3.85, 10.2, 0.1)], into(0.08));
  });
  m.scope("balustrade", () => {
    const hx = xF(yT) - 0.1;
    const hz = zF(yT) - 0.1;
    const y = PH;
    const run = (ax: number, az: number, bx: number, bz: number): void => {
      const L = Math.hypot(bx - ax, bz - az);
      const n = Math.max(1, Math.round(L / 2.4));
      const ux = (bx - ax) / L;
      const uz = (bz - az) / L;
      for (let i = 0; i < n; i++) {
        const x = ax + ((bx - ax) * i) / n;
        const z = az + ((bz - az) * i) / n;
        m.box("marble", x, z, 0.3, 0.3, y, y + 1.1, 0, false);
        m.spire("marble", rect(0.3, 0.3, x, z), y + 1.1, y + 1.3);
        const x1 = ax + ((bx - ax) * (i + 1)) / n;
        const z1 = az + ((bz - az) * (i + 1)) / n;
        const nx = -uz;
        const nz = ux;
        const a: Vec3 = [x + ux * 0.15 + nx * 0.07, y, z + uz * 0.15 + nz * 0.07];
        const b: Vec3 = [x1 - ux * 0.15 + nx * 0.07, y, z1 - uz * 0.15 + nz * 0.07];
        m.slab("marble", [a, b, [b[0], y + 0.9, b[2]], [a[0], y + 0.9, a[2]]], [-nx * 0.14, 0, -nz * 0.14]);
      }
    };
    run(-hx, hz, hx, hz);
    run(hx, hz, hx, -hz);
    run(hx, -hz, -hx, -hz);
    run(-hx, -hz, -hx, hz);
  });
}

// --- the gate tower -----------------------------------------------------------------------

const Y_BASE = PH + 0.55;
const Y_COL = 18.0;
/** Column lines: nine bays along X (the central one wider), five along Z. */
const COL_X: number[] = (() => {
  const mid = 6.6;
  const side = (54 - mid) / 8;
  const xs: number[] = [];
  for (let i = 0; i <= 9; i++) xs.push(i <= 4 ? -27 + i * side : 27 - (9 - i) * side);
  return xs;
})();
const COL_Z: number[] = [-12, -7.2, -2.4, 2.4, 7.2, 12];
const WALL_X = 24.6;
const WALL_Z = 9.6;

const LOWER: Eave = { bx: 27.0, bz: 12.0, yB0: Y_COL, yB1: 18.7, ux: WALL_X, uz: WALL_Z, yDg: 19.4, lx: 30.0, lz: 15.0, yF0: 19.4, yLip: 19.8, kx: 96, kz: 48, lift: 1.0, reach: 7 };
const UPPER_WALL_X = 25.4;
const UPPER_WALL_Z = 10.4;
const UPPER: Eave = { bx: 25.5, bz: 10.5, yB0: 22.0, yB1: 22.6, ux: UPPER_WALL_X, uz: UPPER_WALL_Z, yDg: 23.3, lx: 28.8, lz: 13.8, yF0: 23.3, yLip: 23.7, kx: 92, kz: 44, lift: 1.1, reach: 7 };
/** The skirt of the lower eave reaches the upper wall at this depth and height. */
const SKIRT_D = LOWER.lx - UPPER_WALL_X;
const SKIRT_TOP = 21.5;
/** The upper roof: the hips end at depth DG (the gables), the ridge at depth UPPER.lz. */
const DG = 6;
const XG = UPPER.lx - DG;
const ZG = UPPER.lz - DG;
const Y_RIDGE = 30.0;
const upperY = (d: number): number => roofY(UPPER.yLip, Y_RIDGE, UPPER.lz, 1.6, d);
const skirtY = (d: number): number => roofY(LOWER.yLip, SKIRT_TOP, SKIRT_D, 1.3, d);
const OVER = 0.6;

function lowerStorey(m: MeshBuilder): void {
  m.scope("marble base", () => m.box("marble", 0, 0, 57.6, 27.6, PH, Y_BASE));
  m.scope("columns", () => {
    const at: Array<[number, number]> = [];
    for (const x of COL_X) at.push([x, 12], [x, -12]);
    for (const z of COL_Z.slice(1, -1)) at.push([27, z], [-27, z]);
    for (const [x, z] of at) {
      m.box("stone", x, z, 1.0, 1.0, Y_BASE, Y_BASE + 0.18);
      m.prism("lacquer", ngon(10, 0.42, 0, x, z), Y_BASE + 0.18, Y_COL, false);
    }
  });
  m.scope("walls", () => m.prism("lacquer", rect(2 * WALL_X, 2 * WALL_Z), Y_BASE, Y_COL, false));
  m.scope("lattice doors", () => {
    const leaf = (x0: number, x1: number, sz: number, along: "x" | "z", y0: number, y1: number): void => {
      // a lattice panel set proud of the wall, its frame bars and a transom
      const face = along === "x" ? WALL_Z : WALL_X;
      const P = (u: number, y: number, o: number): Vec3 => (along === "x" ? [u, y, sz * (face + o)] : [sz * (face + o), y, u]);
      const into = (dep: number): Vec3 => (along === "x" ? [0, 0, -sz * dep] : [-sz * dep, 0, 0]);
      m.slab("lattice", [P(x0, y0, 0.05), P(x1, y0, 0.05), P(x1, y1, 0.05), P(x0, y1, 0.05)], into(0.1));
      const leaves = 4;
      for (let k = 1; k < leaves; k++) {
        const u = x0 + ((x1 - x0) * k) / leaves;
        m.slab("lacquer", [P(u - 0.07, y0 + 0.06, 0.1), P(u + 0.07, y0 + 0.06, 0.1), P(u + 0.07, y1 - 0.06, 0.1), P(u - 0.07, y1 - 0.06, 0.1)], into(0.08));
      }
      const yt = y1 - 1.1;
      m.slab("lacquer", [P(x0 + 0.06, yt - 0.08, 0.1), P(x1 - 0.06, yt - 0.08, 0.1), P(x1 - 0.06, yt + 0.08, 0.1), P(x0 + 0.06, yt + 0.08, 0.1)], into(0.08));
      m.slab("gilt", [P(x0 + 0.06, y0 + 1.0, 0.13), P(x1 - 0.06, y0 + 1.0, 0.13), P(x1 - 0.06, y0 + 1.15, 0.13), P(x0 + 0.06, y0 + 1.15, 0.13)], into(0.1));
    };
    for (const sz of [1, -1]) {
      for (let i = 0; i + 1 < COL_X.length; i++) leaf(COL_X[i]! + 0.55, COL_X[i + 1]! - 0.55, sz, "x", Y_BASE + 0.25, Y_COL - 0.35);
    }
    for (const sx of [1, -1]) {
      for (let i = 1; i + 2 < COL_Z.length; i++) leaf(COL_Z[i]! + 0.5, COL_Z[i + 1]! - 0.5, sx, "z", Y_BASE + 1.2, Y_COL - 0.6);
    }
  });
}

function upperStorey(m: MeshBuilder): void {
  m.scope("wall", () => {
    m.prism("lacquer", rect(2 * UPPER_WALL_X, 2 * UPPER_WALL_Z), 20.6, UPPER.yB0, false);
    // painted panels between the skirt and the beams
    for (const sz of [1, -1]) {
      for (let i = 0; i + 1 < COL_X.length; i++) {
        const x0 = COL_X[i]! * 0.94 + 0.4;
        const x1 = COL_X[i + 1]! * 0.94 - 0.4;
        const z = sz * (UPPER_WALL_Z + 0.04);
        m.slab("paintGreen", [[x0, SKIRT_TOP + 0.05, z], [x1, SKIRT_TOP + 0.05, z], [x1, UPPER.yB0 - 0.08, z], [x0, UPPER.yB0 - 0.08, z]], [0, 0, -sz * 0.1]);
      }
    }
  });
}

function upperRoof(m: MeshBuilder): void {
  let corners: Vec3[][] = [];
  m.scope("hipped skirt", () => {
    corners = hipRings(m, UPPER, DG, 5, upperY, false);
  });
  const rows = 7;
  const ds: number[] = [];
  for (let j = 0; j <= rows; j++) ds.push(DG + (UPPER.lz - DG) * (j / rows));
  m.scope("front and back slopes", () => {
    for (const sz of [1, -1]) {
      const grid: Vec3[][] = ds.map((d, j) => {
        const z = sz * (UPPER.lz - d);
        const y = upperY(d);
        const rib = j === 0 ? 0 : 0.13;
        const row: Vec3[] = [[-XG - OVER, y, z]];
        for (let i = 0; i <= UPPER.kx; i++) row.push([-XG + (2 * XG * i) / UPPER.kx, y + (i % 2 ? rib : 0), z]);
        row.push([XG + OVER, y, z]);
        return row;
      });
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i + 1 < grid[j]!.length; i++) quadN(m, "tile", grid[j]![i]!, grid[j]![i + 1]!, grid[j + 1]![i + 1]!, grid[j + 1]![i]!, [0, 1, 0]);
      }
    }
  });
  m.scope("gables", () => {
    for (const sx of [1, -1]) {
      const xp = sx * (XG - 0.4);
      const yb = upperY(DG);
      // the ledge between the hips' top and the gable
      quadN(m, "tile", [xp, yb, -ZG], [sx * XG, yb, -ZG], [sx * XG, yb, ZG], [xp, yb, ZG], [0, 1, 0]);
      for (const sz of [1, -1]) {
        for (let j = 0; j < rows; j++) {
          const za = sz * (UPPER.lz - ds[j]!);
          const zb = sz * (UPPER.lz - ds[j + 1]!);
          quadN(m, "lacquer", [xp, yb, za], [xp, yb, zb], [xp, upperY(ds[j + 1]!) - 0.05, zb], [xp, upperY(ds[j]!) - 0.05, za], [sx, 0, 0]);
          // the bargeboard under the slope's edge
          const xo = sx * (XG + OVER);
          const ya = upperY(ds[j]!);
          const yb2 = upperY(ds[j + 1]!);
          quadN(m, "gilt", [xo, ya - 0.55, za], [xo, yb2 - 0.55, zb], [xo, yb2, zb], [xo, ya, za], [sx, 0, 0]);
        }
      }
      // the gilt ornament on the gable
      const xo = xp + sx * 0.04;
      const yr = upperY(UPPER.lz);
      m.slab("gilt", [[xo, yb + 1.0, -ZG * 0.6], [xo, yb + 1.0, ZG * 0.6], [xo, yr - 1.2, 0]], [-sx * 0.08, 0, 0]);
      m.slab("gilt", [[xo, yb + 0.05, -ZG], [xo, yb + 0.05, ZG], [xo, yb + 0.25, ZG], [xo, yb + 0.25, -ZG]], [-sx * 0.08, 0, 0]);
    }
  });
  m.scope("ridges", () => {
    const yr = upperY(UPPER.lz);
    const L = 2 * (XG + OVER) - 0.1;
    m.box("tile", 0, 0, L, 0.7, yr - 0.3, yr + 0.55);
    m.box("gilt", 0, 0, L - 0.2, 0.74, yr + 0.15, yr + 0.3, 0, false);
    // the gable ridges down the bargeboards
    for (const sx of [1, -1]) {
      for (const sz of [1, -1]) {
        const pts = ds.map((d): Vec3 => [sx * (XG + OVER - 0.25), upperY(d) + 0.05, sz * (UPPER.lz - d)]);
        ridgeLine(m, pts.reverse(), 0.2);
      }
    }
    // the hip ridges from the corners up to the gables
    for (const c of corners) {
      ridgeLine(m, c, 0.2);
      ridgeBeasts(m, c, 5);
    }
  });
  m.scope("chiwen", () => {
    const yr = upperY(UPPER.lz) + 0.55;
    for (const sx of [1, -1]) {
      const x = sx * (XG + OVER - 0.5);
      const d: Vec3 = [-sx * 0.55, 0, 0];
      const xo = x + sx * 0.275;
      // the body, the tail curling inward and the sword hilt
      m.slab("tile", [[xo, yr - 0.1, -0.75], [xo, yr - 0.1, 0.75], [xo, yr + 1.25, 0.6], [xo, yr + 1.6, -0.1], [xo, yr + 1.3, -0.7]], d);
      m.slab("tile", [[xo, yr + 1.2, 0.55], [xo, yr + 1.55, -0.05], [xo, yr + 2.05, 0.15], [xo, yr + 1.85, 0.75]], d);
      m.box("gilt", x - sx * 0.05, -0.25, 0.16, 0.16, yr + 1.4, yr + 2.05);
    }
  });
}

function lowerRoof(m: MeshBuilder): void {
  let corners: Vec3[][] = [];
  m.scope("tiled skirt", () => {
    corners = hipRings(m, LOWER, SKIRT_D, 4, skirtY, true);
  });
  m.scope("hip ridges", () => {
    for (const c of corners) {
      ridgeLine(m, c, 0.2);
      ridgeBeasts(m, c, 4);
    }
  });
}

function gateTower(m: MeshBuilder): void {
  m.scope("lower storey", () => lowerStorey(m));
  m.scope("lower eave", () => {
    m.scope("beams and bracket sets", () => brackets(m, LOWER));
    soffitFascia(m, LOWER);
    lowerRoof(m);
  });
  m.scope("upper storey", () => upperStorey(m));
  m.scope("upper eave", () => {
    m.scope("beams and bracket sets", () => brackets(m, UPPER));
    soffitFascia(m, UPPER);
    upperRoof(m);
  });
}

// --- the whole ------------------------------------------------------------------------

export function gateOfHeavenlyPeace(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("podium", () => podium(m));
  m.scope("gate tower", () => gateTower(m));
  return m;
}

/** The distant model: the battered podium with its gateways, the hall, the two roofs and the gables, the ridge and chiwen. */
export function gateOfHeavenlyPeaceLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const yT = PH - COPE;
  // the podium's long faces stand 0.06 m in, so the gateway slabs on them stay inside the full model
  const zL = (y: number): number => zF(y) - 0.06;
  m.loft("plaster", rect(2 * PX, 2 * zL(0)), 0, rect(2 * xF(yT), 2 * zL(yT)), yT, false);
  m.box("stone", 0, 0, 2 * xF(yT) + 0.5, 2 * zF(yT) + 0.5, yT, PH);
  for (const g of GATES.filter((g) => g.c >= 0)) {
    for (const sx of g.c === 0 ? [1] : [1, -1]) {
      m.slab("plasterShade", [[sx * g.c - g.w / 2, 0, zL(0) + 0.05], [sx * g.c + g.w / 2, 0, zL(0) + 0.05], [sx * g.c + g.w / 2, g.s, zL(g.s) + 0.05], [sx * g.c, g.s + g.w / 2, zL(g.s + g.w / 2) + 0.05], [sx * g.c - g.w / 2, g.s, zL(g.s) + 0.05]], [0, 0, -0.2]);
    }
  }
  m.box("lacquer", 0, 0, 54, 24, PH, LOWER.yLip);
  m.loft("tile", rect(2 * LOWER.lx, 2 * LOWER.lz), LOWER.yLip, rect(2 * UPPER_WALL_X, 2 * UPPER_WALL_Z), SKIRT_TOP, false);
  m.box("paintGreen", 0, 0, 2 * UPPER_WALL_X, 2 * UPPER_WALL_Z, SKIRT_TOP, UPPER.yLip, 0, false);
  const yg = upperY(DG);
  m.loft("tile", rect(2 * UPPER.lx, 2 * UPPER.lz), UPPER.yLip, rect(2 * XG, 2 * ZG), yg, false);
  const yr = upperY(UPPER.lz);
  m.sweep("tile", "x", [[ZG + 0.6, yg - 0.5], [0, yr], [-ZG - 0.6, yg - 0.5]], -XG - OVER, [[ZG + 0.6, yg - 0.5], [0, yr], [-ZG - 0.6, yg - 0.5]], XG + OVER);
  m.box("tile", 0, 0, 2 * (XG + OVER), 0.7, yr - 0.3, yr + 0.55);
  for (const sx of [1, -1]) m.box("tile", sx * (XG + OVER - 0.5), 0, 0.55, 1.4, yr + 0.5, yr + 0.55 + 2.05);
  return m;
}

export const GATE_OF_HEAVENLY_PEACE: ProceduralDesign[] = [
  {
    id: "bld-gate-of-heavenly-peace",
    game: { plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" } },
    title: "Gate of Heavenly Peace",
    build: gateOfHeavenlyPeace,
    buildLod: gateOfHeavenlyPeaceLod,
    references: "gate-of-heavenly-peace",
    catalog: PLAZA_CATALOG,
  },
];
