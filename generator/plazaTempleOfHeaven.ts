// The Temple of Heaven in Beijing: the Hall of Prayer for Good Harvests
// (Qiniandian, 1420, rebuilt 1890) on the Altar of Prayer for Grain, its round
// three-tier white marble terrace. A plaza landmark (docs/models/plaza-landmarks.md):
// the game may stand it on the round main square of a radial town or city.
//
// What it reproduces (photos in assets/temple-of-heaven/, measured in px against
// the hall's 38 m height and 36 m eave diameter):
// - the terrace: three concentric round tiers of white marble, 2 m each, each
//   with a projecting coping and a carved balustrade (posts with rounded heads,
//   panels between them); stairs on the four axes, the main ones on the south
//   (+Z) and north as two flights either side of the sloped, carved "dragon" ramp;
// - the hall: red lacquered columns before recessed gilt-framed lattice doors,
//   the open south door; under each eave the green and blue painted beams and
//   the stepped band of bracket sets (dougong); three round roofs of deep blue
//   glazed tiles with upturned eaves and tile ribs in real relief; the blue and
//   gold name board under the top eave; the gilded finial.
//
// Deviations: the lowest tier is 63 m across instead of about 90 m so the altar
// fits a main square (the upper tiers shrink with it); the doors are panels, not
// pierced lattice; the dragon carving is a sinuous row of raised plaques.
//
// Metres, +Y up, base at y = 0, centred on the hall's axis; the main stairs face
// +Z (south). Deterministic: the same code gives the same bytes. The id is what
// the game's saved maps store, so it is never renamed once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  marble: { color: "#ece9e1", roughness: 0.85 },
  marbleShade: { color: "#d3cec2", roughness: 0.9 },
  lacquer: { color: "#a1261d", roughness: 0.55 },
  lattice: { color: "#6e1f17", roughness: 0.7 },
  gilt: { color: "#d2a645", metallic: 0.6, roughness: 0.35 },
  paintBlue: { color: "#2a5596", roughness: 0.6 },
  paintGreen: { color: "#2f8068", roughness: 0.6 },
  tile: { color: "#26355e", metallic: 0.1, roughness: 0.35 },
  dark: { color: "#24140f", roughness: 0.9 },
};

const TAU = Math.PI * 2;

/** The plan point at radius r, angle phi measured from +Z toward +X (phi = 0 is south). */
const P = (r: number, phi: number): [number, number] => [r * Math.sin(phi), r * Math.cos(phi)];

/** n points on a circle of radius r from angle phi0, wound like ngon. */
function ring(n: number, r: number, phi0 = 0): Ring {
  const out: Ring = [];
  for (let i = 0; i < n; i++) out.push(P(r, phi0 + (i / n) * TAU));
  return out;
}

/** 2n points alternating between radius r and r + d: a ring of n tile ribs in relief. */
function zig(n: number, r: number, d: number, phi0 = 0): Ring {
  const out: Ring = [];
  for (let i = 0; i < 2 * n; i++) out.push(P(i % 2 ? r + d : r, phi0 + (i / (2 * n)) * TAU));
  return out;
}

/** The surface between ring a at ya and ring b at yb (equal lengths), every face turned toward `up` (+Y) or down. */
function band(m: MeshBuilder, mat: string, a: Ring, ya: number, b: Ring, yb: number, up: boolean): void {
  const pts: Vec3[] = [];
  const n = a.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const A: Vec3 = [a[i]![0], ya, a[i]![1]];
    const B: Vec3 = [a[j]![0], ya, a[j]![1]];
    const C: Vec3 = [b[j]![0], yb, b[j]![1]];
    const D: Vec3 = [b[i]![0], yb, b[i]![1]];
    pts.push(A, B, C, A, C, D);
  }
  m.facets(mat, pts, [0, up ? 1 : -1, 0]);
}

/**
 * A round band of radius r from y0 to y1, open at the top and bottom, with an
 * annulus under it from rIn (a ledge seen from below) and optionally one on top.
 */
function drumBand(m: MeshBuilder, mat: string, n: number, r: number, y0: number, y1: number, rIn: number, topIn = 0, phi0 = 0): void {
  m.loft(mat, ring(n, r, phi0), y0, ring(n, r, phi0), y1, false);
  band(m, mat, ring(n, rIn, phi0), y0, ring(n, r, phi0), y0, false);
  if (topIn > 0) band(m, mat, ring(n, topIn, phi0), y1, ring(n, r, phi0), y1, true);
}

/** A closed box w across and d along the radius at angle phi, centred at radius rc, from y0 to y1. */
function radialBlock(m: MeshBuilder, mat: string, rc: number, phi: number, w: number, d: number, y0: number, y1: number): void {
  const [cx, cz] = P(rc, phi);
  m.box(mat, cx, cz, w, d, y0, y1, phi);
  m.cap(mat, rect(w, d, cx, cz, phi), y0, false);
}

/** Rotates a point of the local frame (x across, z outward along the axis phi = 0) to the axis phi. */
const turn = (phi: number) => ([x, y, z]: Vec3): Vec3 => [x * Math.cos(phi) + z * Math.sin(phi), y, -x * Math.sin(phi) + z * Math.cos(phi)];

// --- the hall's storeys -------------------------------------------------------------

/** One eave of the hall: the bracket band, the soffit, the fascia and the tiled roof up to the next drum. */
interface Eave {
  /** The beam band's outer radius, where the brackets start. */
  rBeam: number;
  /** The bracket band's bottom and top. */
  yDg0: number;
  yDg1: number;
  /** The radii of the three stepped bracket courses. */
  steps: [number, number, number];
  /** Bracket sets around. */
  sets: number;
  /** The fascia's radius, its bottom and the eave's lip (the top of the fascia). */
  rF: number;
  yF0: number;
  yLip: number;
  /** Where the roof ends: inside the drum above (or the finial's neck). */
  rTop: number;
  yTop: number;
  ribs: number;
  rings: number;
}

const EAVES: Eave[] = [
  { rBeam: 15.6, yDg0: 14.9, yDg1: 16.6, steps: [15.95, 16.4, 16.85], sets: 36, rF: 18.3, yF0: 16.9, yLip: 17.9, rTop: 12.3, yTop: 21.3, ribs: 72, rings: 7 },
  { rBeam: 12.75, yDg0: 23.6, yDg1: 25.3, steps: [13.1, 13.5, 13.9], sets: 30, rF: 15.8, yF0: 25.6, yLip: 26.6, rTop: 8.6, yTop: 29.6, ribs: 60, rings: 7 },
  { rBeam: 9.0, yDg0: 31.6, yDg1: 32.8, steps: [9.35, 9.7, 10.05], sets: 22, rF: 12.0, yF0: 32.9, yLip: 33.7, rTop: 0.75, yTop: 39.5, ribs: 48, rings: 9 },
];

/** The dougong band: three stepped courses, each with its row of bracket blocks. */
function brackets(m: MeshBuilder, e: Eave): void {
  const h = (e.yDg1 - e.yDg0) / 3;
  for (let j = 0; j < 3; j++) {
    const y0 = e.yDg0 + j * h;
    const rIn = j === 0 ? e.rBeam - 0.3 : e.steps[j - 1]!;
    drumBand(m, "paintGreen", 40, e.steps[j], y0, y0 + h, rIn);
    if (j === 0) continue;
    const off = j === 1 ? 0.5 : 0;
    for (let k = 0; k < e.sets; k++) {
      radialBlock(m, j === 2 ? "paintBlue" : "paintGreen", e.steps[j] + 0.12, ((k + 0.5 + off) / e.sets) * TAU, 0.42, 0.6, y0 + 0.05, y0 + h - 0.05);
    }
  }
}

/**
 * The roof from the lip inward: a concave profile with an upturn at the eave
 * (the lip stands `lift` above where the curve would meet it), lofted as rings
 * of tile ribs in relief that fade out at the lip.
 */
function roof(m: MeshBuilder, e: Eave): void {
  const lift = 0.35;
  const y0 = e.yLip - lift;
  const rs: Array<{ ring: Ring; y: number }> = [];
  for (let j = 0; j <= e.rings; j++) {
    const u = Math.pow(j / e.rings, 1.25);
    const r = e.rF + (e.rTop - e.rF) * u;
    const y = y0 + (e.yTop - y0) * Math.pow(u, 1.7) + lift * Math.pow(1 - u, 4);
    const d = j === 0 ? 0 : 0.16 * Math.sqrt(r / e.rF);
    rs.push({ ring: zig(e.ribs, r, d), y });
  }
  for (let j = 0; j < e.rings; j++) band(m, "tile", rs[j]!.ring, rs[j]!.y, rs[j + 1]!.ring, rs[j + 1]!.y, true);
}

/** The eave: brackets, soffit, the two-coloured fascia, the roof. */
function eave(m: MeshBuilder, e: Eave): void {
  m.scope("bracket sets", () => brackets(m, e));
  m.scope("soffit", () => band(m, "paintBlue", zig(e.ribs, e.steps[2] - 0.1, 0), e.yDg1, zig(e.ribs, e.rF, 0), e.yF0, false));
  m.scope("fascia", () => {
    const f = zig(e.ribs, e.rF, 0);
    const yMid = e.yF0 + (e.yLip - e.yF0) * 0.45;
    m.loft("paintGreen", f, e.yF0, f, yMid, false);
    m.loft("lacquer", f, yMid, f, e.yLip, false);
  });
  m.scope("tiled roof", () => roof(m, e));
}

/** The painted drum of an upper storey: a blue band with green panels, gold rims and medallions. */
function paintedDrum(m: MeshBuilder, r: number, y0: number, y1: number, panels: number): void {
  drumBand(m, "paintGreen", 48, r, y0, y1, r - 0.3);
  drumBand(m, "gilt", 48, r + 0.06, y1 - 0.5, y1 - 0.38, r - 0.1, r - 0.1);
  const pw = (TAU * r) / panels - 0.5;
  const yb = y0 + 0.9;
  const yt = y1 - 0.65;
  for (let k = 0; k < panels; k++) {
    const phi = ((k + 0.5) / panels) * TAU;
    const n: Vec3 = [Math.sin(phi), 0, Math.cos(phi)];
    const t: Vec3 = [Math.cos(phi), 0, -Math.sin(phi)];
    const at = (D: number, x: number, y: number): Vec3 => [n[0] * D + t[0] * x, y, n[2] * D + t[2] * x];
    const D = r + 0.04;
    m.slab("paintBlue", [at(D, -pw / 2, yb), at(D, pw / 2, yb), at(D, pw / 2, yt), at(D, -pw / 2, yt)], [-n[0] * 0.14, 0, -n[2] * 0.14]);
    const mw = Math.min(0.5, pw * 0.2);
    const ym = (yb + yt) / 2;
    m.slab("gilt", [at(D + 0.04, -mw, ym), at(D + 0.04, 0, ym - 0.32), at(D + 0.04, mw, ym), at(D + 0.04, 0, ym + 0.32)], [-n[0] * 0.08, 0, -n[2] * 0.08]);
  }
}

// --- the ground storey: columns, lattice doors, the beam band ----------------------------

const COL_R = 15.0;
const WALL_R = 14.5;
const BAYS = 12;
const Y_FLOOR = 6.5;
const Y_BEAM = 12.8;

/** One bay of the ground storey: the recessed wall with its four lattice doors and transoms. */
function bay(m: MeshBuilder, k: number): void {
  const phi = (k / BAYS) * TAU;
  const half = Math.PI / BAYS;
  const D = WALL_R * Math.cos(half);
  const hw = WALL_R * Math.sin(half);
  const n: Vec3 = [Math.sin(phi), 0, Math.cos(phi)];
  const t: Vec3 = [Math.cos(phi), 0, -Math.sin(phi)];
  const at = (x: number, y: number, o: number): Vec3 => [n[0] * (D + o) + t[0] * x, y, n[2] * (D + o) + t[2] * x];
  const into = (dep: number): Vec3 => [-n[0] * dep, 0, -n[2] * dep];
  const panel = (mat: string, x0: number, x1: number, y0: number, y1: number, o: number, dep: number): void =>
    m.slab(mat, [at(x0, y0, o), at(x1, y0, o), at(x1, y1, o), at(x0, y1, o)], into(dep));
  const door = k === 0; // the south door stands open
  const dx = 1.55;
  const yDoor = 10.9;
  m.scope("wall", () => {
    if (!door) panel("lacquer", -hw, hw, Y_FLOOR, Y_BEAM, 0, 0.35);
    else {
      panel("lacquer", -hw, -dx, Y_FLOOR, Y_BEAM, 0, 0.35);
      panel("lacquer", dx, hw, Y_FLOOR, Y_BEAM, 0, 0.35);
      panel("lacquer", -dx, dx, yDoor, Y_BEAM, 0, 0.35);
      // the dark hall seen through the open door: jambs, head and the back
      panel("dark", -dx - 0.05, dx + 0.05, Y_FLOOR, yDoor + 0.05, -1.6, 0.2);
      m.slab("dark", [at(-dx, Y_FLOOR, -0.36), at(-dx, yDoor, -0.36), at(-dx, yDoor, -1.65), at(-dx, Y_FLOOR, -1.65)], [-t[0] * 0.2, 0, -t[2] * 0.2]);
      m.slab("dark", [at(dx, Y_FLOOR, -0.36), at(dx, yDoor, -0.36), at(dx, yDoor, -1.65), at(dx, Y_FLOOR, -1.65)], [t[0] * 0.2, 0, t[2] * 0.2]);
      m.slab("dark", [at(-dx, yDoor, -0.36), at(dx, yDoor, -0.36), at(dx, yDoor, -1.65), at(-dx, yDoor, -1.65)], [0, 0.2, 0]);
    }
  });
  m.scope("lattice doors", () => {
    const lw = 1.5;
    for (const c of [-2.4, -0.8, 0.8, 2.4]) {
      if (!(door && Math.abs(c) < 1)) {
        panel("gilt", c - lw / 2 + 0.04, c + lw / 2 - 0.04, Y_FLOOR + 0.25, 10.75, 0.05, 0.15);
        panel("lattice", c - lw / 2 + 0.16, c + lw / 2 - 0.16, Y_FLOOR + 0.42, 10.58, 0.09, 0.15);
      }
      panel("gilt", c - lw / 2 + 0.04, c + lw / 2 - 0.04, 11.05, 12.6, 0.05, 0.15);
      panel("lattice", c - lw / 2 + 0.16, c + lw / 2 - 0.16, 11.2, 12.45, 0.09, 0.15);
    }
  });
}

function groundStorey(m: MeshBuilder): void {
  m.scope("platform", () => m.prism("marble", ring(72, 16.6), 6.0, Y_FLOOR));
  m.scope("columns", () => {
    for (let k = 0; k < BAYS; k++) {
      const [cx, cz] = P(COL_R, ((k + 0.5) / BAYS) * TAU);
      m.prism("marbleShade", ngon(10, 0.78, 0, cx, cz), Y_FLOOR, Y_FLOOR + 0.3);
      m.prism("lacquer", ngon(10, 0.55, 0, cx, cz), Y_FLOOR + 0.3, Y_BEAM, false);
    }
  });
  for (let k = 0; k < BAYS; k++) m.scope(`bay ${k + 1}`, () => bay(m, k));
  m.scope("painted beams", () => {
    drumBand(m, "paintBlue", 64, 15.6, Y_BEAM, 13.85, 14.0);
    drumBand(m, "gilt", 64, 15.66, 13.85, 13.97, 15.4, 15.4);
    drumBand(m, "paintGreen", 64, 15.5, 13.97, 14.9, 15.3);
  });
}

// --- the terrace --------------------------------------------------------------------

/** The three tiers of the Altar of Prayer for Grain: radius, bottom and top. */
const TIERS: Array<{ r: number; y0: number; y1: number }> = [
  { r: 31.5, y0: 0, y1: 2.0 },
  { r: 26.5, y0: 2.0, y1: 4.0 },
  { r: 21.5, y0: 4.0, y1: 6.0 },
];
const RUN = 3.4;
const STEPS = 9;
/** The x of the stair cheeks' centres: the main (south and north) stairs and the side (east and west) ones. */
const MAIN_CHEEKS = [-4.8, -1.8, 1.8, 4.8];
const SIDE_CHEEKS = [-2.4, 2.4];

/** A balustrade post: the square shaft and its rounded head. */
function post(m: MeshBuilder, x: number, z: number, phi: number, y: number): void {
  m.box("marble", x, z, 0.3, 0.3, y > 0 ? y - 0.05 : 0, y + 1.05, phi, false);
  const head = (r: number): Ring => ngon(6, r, phi, x, z);
  m.cap("marble", head(0.2), y + 1.05, false);
  m.loft("marble", head(0.2), y + 1.05, head(0.13), y + 1.3, false);
  m.spire("marble", head(0.13), y + 1.3, y + 1.4);
}

/** The balustrade round the edge of a tier, broken by the four stairs. */
function terraceBalustrade(m: MeshBuilder, r: number, y: number): void {
  const aMain = Math.asin(4.8 / r);
  const aSide = Math.asin(2.4 / r);
  const arcs: Array<[number, number]> = [
    [aMain, Math.PI / 2 - aSide], [Math.PI / 2 + aSide, Math.PI - aMain],
    [Math.PI + aMain, 1.5 * Math.PI - aSide], [1.5 * Math.PI + aSide, TAU - aMain],
  ];
  for (const [a0, a1] of arcs) {
    const n = Math.max(1, Math.round(((a1 - a0) * r) / 3.0));
    let prev: [number, number] | null = null;
    for (let i = 0; i <= n; i++) {
      const phi = a0 + ((a1 - a0) * i) / n;
      const [x, z] = P(r, phi);
      post(m, x, z, phi, y);
      if (prev) {
        // the panel between this post and the last, on their chord
        const [px, pz] = prev;
        const L = Math.hypot(x - px, z - pz);
        const ux = (x - px) / L;
        const uz = (z - pz) / L;
        const nx = uz;
        const nz = -ux;
        const sgn = nx * x + nz * z > 0 ? 1 : -1;
        const a: Vec3 = [px + ux * 0.15 + nx * sgn * 0.08, y - 0.05, pz + uz * 0.15 + nz * sgn * 0.08];
        const b: Vec3 = [x - ux * 0.15 + nx * sgn * 0.08, y - 0.05, z - uz * 0.15 + nz * sgn * 0.08];
        m.slab("marble", [a, b, [b[0], y + 0.88, b[2]], [a[0], y + 0.88, a[2]]], [-nx * sgn * 0.16, 0, -nz * sgn * 0.16]);
      }
      prev = [x, z];
    }
  }
}

/** A flight of steps from x0 to x1 (local frame, rising toward -z), from zOut at y0 up to the tier's edge. */
function flight(m: MeshBuilder, x0: number, x1: number, zIn: number, zOut: number, y0: number, y1: number, yb: number): void {
  const rise = (y1 - y0) / STEPS;
  const tread = (zOut - zIn - 0.8) / (STEPS - 1);
  const treads: Vec3[] = [];
  const risers: Vec3[] = [];
  const left: Vec3[] = [];
  const right: Vec3[] = [];
  for (let i = 0; i < STEPS - 1; i++) {
    const h = y0 + (i + 1) * rise;
    const zf = zOut - i * tread;
    const zb = i === STEPS - 2 ? zIn : zOut - (i + 1) * tread;
    const hb = i === 0 ? yb : y0 + i * rise;
    treads.push([x0, h, zf], [x1, h, zf], [x1, h, zb], [x0, h, zf], [x1, h, zb], [x0, h, zb]);
    risers.push([x0, hb, zf], [x1, hb, zf], [x1, h, zf], [x0, hb, zf], [x1, h, zf], [x0, h, zf]);
    for (const [arr, x] of [[left, x0], [right, x1]] as Array<[Vec3[], number]>) {
      arr.push([x, yb, zf], [x, yb, zb], [x, h, zb], [x, yb, zf], [x, h, zb], [x, h, zf]);
    }
  }
  m.facets("marble", treads, [0, 1, 0]);
  m.facets("marble", risers, [0, 0, 1]);
  m.facets("marble", left, [-1, 0, 0]);
  m.facets("marble", right, [1, 0, 0]);
}

/** A stair cheek centred on x: a sloped parapet a metre above the steps, its foot post. */
function cheek(m: MeshBuilder, x: number, zIn: number, zEdge: number, zOut: number, y0: number, y1: number, yb: number, topPost: number | null): void {
  const w = 0.2;
  m.slab("marble", [[x - w, yb, zIn], [x - w, yb, zOut], [x - w, y0 + 0.9, zOut], [x - w, y1 + 0.9, zEdge], [x - w, y1 + 0.9, zIn]], [2 * w, 0, 0]);
  post(m, x, zOut - 0.2, 0, y0);
  if (topPost !== null) post(m, x, topPost, 0, y1);
}

/** The carved ramp between the main flights: a sloped slab and its sinuous row of raised plaques. */
function dragonRamp(m: MeshBuilder, zIn: number, zOut: number, y0: number, y1: number, yb: number): void {
  const w = 1.65;
  const yTop = y1 - 0.05;
  const yFoot = y0 + 0.12;
  m.slab("marble", [[-w, yb, zIn], [-w, yb, zOut], [-w, yFoot, zOut], [-w, yTop, zIn]], [2 * w, 0, 0]);
  const s = (yTop - yFoot) / (zOut - zIn);
  const nl = Math.hypot(1, s);
  const nrm: Vec3 = [0, 1 / nl, s / nl];
  const along: Vec3 = [0, -s / nl, 1 / nl];
  for (let i = 0; i < 4; i++) {
    const tz = zIn + 1.2 + i * ((zOut - zIn - 1.8) / 3);
    const cx = i % 2 ? 0.45 : -0.45;
    const cy = yTop - (tz - zIn) * s;
    const pts: Vec3[] = [];
    for (let q = 0; q < 6; q++) {
      const a = (q / 6) * TAU;
      const rx = Math.cos(a) * 0.75;
      const ra = Math.sin(a) * 0.45;
      pts.push([cx + rx, cy + nrm[1] * 0.04 + along[1] * ra, tz + nrm[2] * 0.04 + along[2] * ra]);
    }
    m.slab("marbleShade", pts, [0, -nrm[1] * 0.12, -nrm[2] * 0.12]);
  }
}

/** The stairs up to tier k on the axis phi: main ones are two flights round the ramp, side ones a single flight. */
function stairs(m: MeshBuilder, k: number, phi: number, main: boolean): void {
  const t = TIERS[k]!;
  const y0 = t.y0;
  const y1 = t.y1;
  const yb = k === 0 ? 0 : y0 - 0.05;
  const zIn = t.r - 0.8;
  const zOut = t.r + RUN;
  const rB = t.r - 0.35;
  m.moved(turn(phi), () => {
    if (main) {
      m.scope("ramp", () => dragonRamp(m, zIn, zOut, y0, y1, yb));
      for (const s of [-1, 1]) m.scope("flight", () => flight(m, s > 0 ? 1.9 : -4.7, s > 0 ? 4.7 : -1.9, zIn, zOut, y0, y1, yb));
      for (const x of MAIN_CHEEKS) {
        m.scope("cheek", () => cheek(m, x, zIn, t.r, zOut, y0, y1, yb, Math.abs(x) < 3 ? Math.sqrt(rB * rB - x * x) : null));
      }
    } else {
      m.scope("flight", () => flight(m, -2.3, 2.3, zIn, zOut, y0, y1, yb));
      for (const x of SIDE_CHEEKS) m.scope("cheek", () => cheek(m, x, zIn, t.r, zOut, y0, y1, yb, null));
    }
  });
}

function terrace(m: MeshBuilder): void {
  TIERS.forEach((t, k) => {
    m.scope(`tier ${k + 1}`, () => {
      m.scope("wall", () => {
        m.prism("marble", ring(80, t.r), t.y0, t.y1);
        // the projecting coping under the balustrade
        drumBand(m, "marbleShade", 80, t.r + 0.25, t.y1 - 0.3, t.y1, t.r, t.r);
      });
      m.scope("balustrade", () => terraceBalustrade(m, t.r - 0.35, t.y1));
      m.scope("stairs", () => {
        stairs(m, k, 0, true);
        stairs(m, k, Math.PI, true);
        stairs(m, k, Math.PI / 2, false);
        stairs(m, k, -Math.PI / 2, false);
      });
    });
  });
}

// --- the whole -------------------------------------------------------------------------

export function templeOfHeaven(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("altar of prayer for grain", () => terrace(m));
  m.scope("hall of prayer for good harvests", () => {
    m.scope("ground storey", () => groundStorey(m));
    m.scope("lower eave", () => eave(m, EAVES[0]!));
    m.scope("middle drum", () => paintedDrum(m, 12.6, 20.9, EAVES[1]!.yDg0, 16));
    m.scope("middle eave", () => eave(m, EAVES[1]!));
    m.scope("upper drum", () => paintedDrum(m, 8.9, 29.2, EAVES[2]!.yDg0, 12));
    m.scope("upper eave", () => eave(m, EAVES[2]!));
    m.scope("name board", () => {
      m.slab("gilt", [[-1.1, 29.2, 10.35], [1.1, 29.2, 10.35], [1.1, 32.45, 10.35], [-1.1, 32.45, 10.35]], [0, 0, -0.45]);
      m.slab("paintBlue", [[-0.78, 29.5, 10.4], [0.78, 29.5, 10.4], [0.78, 32.15, 10.4], [-0.78, 32.15, 10.4]], [0, 0, -0.1]);
      for (const y of [29.85, 30.6, 31.35]) m.slab("gilt", [[-0.25, y, 10.43], [0.25, y, 10.43], [0.25, y + 0.42, 10.43], [-0.25, y + 0.42, 10.43]], [0, 0, -0.06]);
      m.box("lacquer", 0, 9.4, 0.6, 1.3, 31.0, 31.4);
    });
    m.scope("finial", () => {
      m.prism("tile", ngon(16, 0.85), 39.2, 40.3);
      m.prism("gilt", ngon(16, 1.0), 40.3, 40.6);
      m.prism("gilt", ngon(16, 0.4), 40.6, 41.85, false);
      // the gilded ball, lofted from rings of latitude, ending in a short point
      const c = 42.75;
      const R = 1.05;
      const lats = [-68, -45, -22, 0, 22, 45, 63].map((d) => (d * Math.PI) / 180);
      const rr = (a: number): Ring => ngon(16, R * Math.cos(a));
      m.cap("gilt", rr(lats[0]!), c + R * Math.sin(lats[0]!), false);
      for (let i = 0; i + 1 < lats.length; i++) m.loft("gilt", rr(lats[i]!), c + R * Math.sin(lats[i]!), rr(lats[i + 1]!), c + R * Math.sin(lats[i + 1]!), false);
      m.spire("gilt", rr(lats[lats.length - 1]!), c + R * Math.sin(lats[lats.length - 1]!), 44.0);
    });
  });
  return m;
}

/** The distant model: the three tiers, the drum, three roof cones with their eaves, the finial. */
export function templeOfHeavenLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  for (const t of TIERS) {
    m.prism("marble", ngon(12, t.r), t.y0, t.y1);
  }
  // the main stairs as wedges on the south and north
  for (const phi of [0, Math.PI]) {
    m.moved(turn(phi), () => {
      for (const t of TIERS) {
        const yb = t.y0 > 0 ? t.y0 - 0.1 : 0;
        m.slab("marbleShade", [[-4.9, yb, t.r - 0.6], [-4.9, yb, t.r + RUN], [-4.9, t.y0 + 0.1, t.r + RUN], [-4.9, t.y1, t.r - 0.6]], [9.8, 0, 0]);
      }
    });
  }
  m.prism("lacquer", ngon(12, 15.4), 6.0, 14.9, false);
  const drums: Array<[number, number, number]> = [[12.6, 20.9, 23.6], [8.9, 29.2, 31.6]];
  for (const [r, y0, y1] of drums) m.prism("paintBlue", ngon(12, r), y0, y1, false);
  for (const e of EAVES) {
    const lip = ngon(12, e.rF);
    m.loft("tile", lip, e.yLip, ngon(12, Math.max(e.rTop, 1.2)), e.yTop, e === EAVES[2]);
    m.loft("paintGreen", ngon(12, e.rBeam), e.yDg0, lip, e.yLip, false);
  }
  m.prism("gilt", ngon(6, 0.9), EAVES[2]!.yTop, 41.7, false);
  m.spire("gilt", ngon(6, 0.9), 41.7, 44.0);
  return m;
}

export const TEMPLE_OF_HEAVEN: ProceduralDesign[] = [
  {
    id: "bld-temple-of-heaven",
    game: { plaza: { cities: ["town", "city"], layouts: ["radial"], round: true } },
    title: "Temple of Heaven",
    build: templeOfHeaven,
    buildLod: templeOfHeavenLod,
    references: "temple-of-heaven",
    catalog: PLAZA_CATALOG,
  },
];
