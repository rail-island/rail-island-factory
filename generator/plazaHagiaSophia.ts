// The Hagia Sophia in Istanbul (537, Ottoman additions 1453-1574): the great domed
// church, later mosque, with its four Ottoman minarets. A plaza landmark
// (docs/models/plaza-landmarks.md): the game may stand it on the rectangular main
// square of a city.
//
// What it reproduces (photos in assets/hagia-sophia/, measured against the 31 m
// dome and its 55.6 m crown; the plan from the published ground plan):
// - the central dome: a shallow lead cap 34 m across over the drum, its crown at
//   55.6 m with the gilt finial; the drum's ring of 40 arched windows with a small
//   buttress between every two;
// - the central square block on the four great piers: the north and south great
//   arches with their recessed tympanum walls, painted red-orange, pierced by a
//   row of seven and a row of five windows;
// - the two great semidomes east and west (along X) on their windowed walls, and
//   the four smaller exedra semidomes at their feet; the east apse with its
//   half-dome;
// - the four buttress towers at the corners of the central square, rising from the
//   ground through the aisle roofs to 40 m, with their medallions and blind arches;
//   the Ottoman sloping buttresses against them and against the east wall;
// - the aisles and galleries: a 66 x 73 m block with two storeys of arched windows,
//   the lean-to lead roofs of the north and south aisles;
// - on the west (-X) the inner narthex and the lower exonarthex with its arcade;
// - the four Ottoman minarets at the corners, about 60 m: square pedestals, slender
//   sixteen-sided shafts, two balconies on the western pair, one on the eastern,
//   pencil-pointed lead caps with gilt finials; the south-east one is red brick,
//   the others stone.
//
// Deviations: the plan is simplified to rectangles; the pendentives, the gallery
// stair towers, the small roof domes, the tombs and the ablution fountain are left
// out; the arches are recesses (the windows dark panels), the drum is a single
// ring; the minarets differ only in colour and number of balconies.
//
// Metres, +Y up, base at y = 0, centred on the central dome's axis; the long axis
// runs along X, the entrance (narthex) at -X (west), the apse at +X (east); +Z is
// south. Sources: Wikipedia "Hagia Sophia" and the photographs in
// assets/hagia-sophia/ (SOURCES.md). Deterministic: the same code gives the same
// bytes. The id is what the game's saved maps store, so it is never renamed.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  plaster: { color: "#d9a68b", roughness: 0.9 },
  plasterLight: { color: "#e4c6a2", roughness: 0.9 },
  tympanum: { color: "#c65a3c", roughness: 0.9 },
  lead: { color: "#a4adb3", metallic: 0.3, roughness: 0.55 },
  leadDark: { color: "#5f676d", metallic: 0.2, roughness: 0.65 },
  window: { color: "#2e2b2d", roughness: 0.6 },
  stone: { color: "#e7e1d5", roughness: 0.8 },
  brick: { color: "#a0553d", roughness: 0.9 },
  gilt: { color: "#c9a14a", metallic: 0.6, roughness: 0.35 },
};

// --- the plan -----------------------------------------------------------------------------

/** The aisle and gallery block: half its length (x) and width (z), its height. */
const MB_X = 33;
const MB_Z = 36.5;
const Y_MB = 22;
/** The central square block: half its side, its top (the drum's foot). */
const SQ = 17;
const Y_SQ = 41;
/** The buttress towers: x from TW_X0 to TW_X1, z from TW_Z0 to TW_Z1, top. */
const TW_X0 = 14;
const TW_X1 = 22.5;
const TW_Z0 = 13;
const TW_Z1 = 37.5;
const Y_TW = 40;
/** Where the tall inner part of a tower gives way to the lower outer part, and the outer part's top. */
const TW_ZS = 26;
const Y_TWO = 31;
/** The great semidomes: radius, springing. */
const SD_R = 15.5;
const Y_SD = 25.5;
/** The drum and the dome. */
const DR_R = 16.8;
const Y_DR = 46.8;
const Y_DOME = 55.6;
/** The narthex and the exonarthex (x ranges), their half width and heights. */
const NX0 = -42;
const EX0 = -47;
const N_Z = 30.5;
const Y_NX = 17;
const Y_EX = 10;

/** Rotates a point of the local frame (x across, z outward along phi = 0, +Z) to the axis phi. */
const turn = (phi: number) => ([x, y, z]: Vec3): Vec3 => [x * Math.cos(phi) + z * Math.sin(phi), y, -x * Math.sin(phi) + z * Math.cos(phi)];
/** The local frame of a wall face looking along phi whose plane passes through (cx, cz). */
const faceAt = (cx: number, cz: number, phi: number) => (p: Vec3): Vec3 => {
  const [x, y, z] = turn(phi)(p);
  return [x + cx, y, z + cz];
};

/** A quad drawn as two triangles facing along n. */
function quad(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  m.facets(mat, [a, b, c, a, c, d], n);
}

/** The surface between ring a at ya and ring b at yb (equal lengths), every face turned up or down. */
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

/** A round band from y0 to y1 of radius r, its ledge under it from rIn (none when negative) and on top to topIn (none when 0). */
function ringBand(m: MeshBuilder, mat: string, n: number, r: number, y0: number, y1: number, rIn: number, topIn: number, cx = 0, cz = 0, rot = 0): void {
  const o = ngon(n, r, rot, cx, cz);
  m.loft(mat, o, y0, o, y1, false);
  if (rIn >= 0) band(m, mat, ngon(n, rIn, rot, cx, cz), y0, o, y0, false);
  if (topIn > 0) band(m, mat, ngon(n, topIn, rot, cx, cz), y1, o, y1, true);
}

/**
 * A curved surface from a grid of rows (each row a list of points); every quad
 * faces away from `centre`. Rows must be equally long; `closed` joins each row's
 * last point to its first.
 */
function surface(m: MeshBuilder, mat: string, rows: Vec3[][], centre: Vec3, closed: boolean): void {
  for (let r = 0; r + 1 < rows.length; r++) {
    const a = rows[r]!;
    const b = rows[r + 1]!;
    const n = a.length;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const j = (i + 1) % n;
      const mid: Vec3 = [(a[i]![0] + b[j]![0]) / 2, (a[i]![1] + b[j]![1]) / 2, (a[i]![2] + b[j]![2]) / 2];
      quad(m, mat, a[i]!, a[j]!, b[j]!, b[i]!, [mid[0] - centre[0], mid[1] - centre[1], mid[2] - centre[2]]);
    }
  }
}

/**
 * A spherical shell about (cx, cy, cz) of radius r: azimuth (from +X toward +Z)
 * from a0 to a1 in na steps, elevation from e0 to 90 degrees in ne steps.
 */
function sphereRows(cx: number, cy: number, cz: number, r: number, a0: number, a1: number, na: number, e0: number, ne: number, closed: boolean): Vec3[][] {
  const rows: Vec3[][] = [];
  for (let k = 0; k <= ne; k++) {
    const e = e0 + ((Math.PI / 2 - e0) * k) / ne;
    const row: Vec3[] = [];
    const cnt = closed ? na : na + 1;
    for (let i = 0; i < cnt; i++) {
      const a = a0 + ((a1 - a0) * i) / na;
      row.push([cx + r * Math.cos(e) * Math.cos(a), cy + r * Math.sin(e), cz + r * Math.cos(e) * Math.sin(a)]);
    }
    rows.push(row);
  }
  return rows;
}

/** An arc of points about (cx, cz) at y: azimuth (from +X toward +Z) a0 to a1 in n steps. */
function arcRow(cx: number, cz: number, r: number, y: number, a0: number, a1: number, n: number): Vec3[] {
  return Array.from({ length: n + 1 }, (_, i): Vec3 => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
  });
}

// --- arches -------------------------------------------------------------------------------

/** An arched opening in a wall's face: centre, width, sill, springing, apex, depth. */
interface Arch {
  cx: number;
  w: number;
  yb: number;
  ys: number;
  ya: number;
  dep: number;
}

/** The arch's intrados from the left springing over the apex to the right one (2k + 1 points), and its two centres. */
function archCurve(a: Arch, k: number): { pts: Array<[number, number]>; cl: number; cr: number } {
  const h = a.ya - a.ys;
  const R = a.w / 4 + (h * h) / a.w;
  const cl = a.cx - a.w / 2 + R;
  const cr = a.cx + a.w / 2 - R;
  const th = Math.atan2(h, a.cx - cl);
  const left: Array<[number, number]> = [];
  for (let i = 0; i <= k; i++) {
    const t = Math.PI + ((th - Math.PI) * i) / k;
    left.push([i === k ? a.cx : cl + R * Math.cos(t), i === k ? a.ya : a.ys + R * Math.sin(t)]);
  }
  const right = left.slice(0, k).reverse().map(([x, y]): [number, number] => [2 * a.cx - x, y]);
  return { pts: [...left, ...right], cl, cr };
}

/**
 * A wall face from x0 to x1 and y0 to y1 in the plane z = 0 of the local frame
 * (looking along +z), pierced by arched recesses: the face, each recess's jambs,
 * sill and soffit (in `jamb`) and its back (in `back`). Arches must not overlap
 * in x and must stay below y1.
 */
function archWall(m: MeshBuilder, mat: string, jamb: string, back: string, x0: number, x1: number, y0: number, y1: number, arches: Arch[], k: number): void {
  const face: Vec3[] = [];
  const rq = (xa: number, xb: number, ya: number, yb: number): void => {
    if (xb - xa < 1e-6 || yb - ya < 1e-6) return;
    face.push([xa, ya, 0], [xb, ya, 0], [xb, yb, 0], [xa, ya, 0], [xb, yb, 0], [xa, yb, 0]);
  };
  let cur = x0;
  for (const a of arches) {
    const l = a.cx - a.w / 2;
    const r = a.cx + a.w / 2;
    const zb = -a.dep;
    rq(cur, l, y0, y1);
    rq(l, r, y0, a.yb);
    const { pts, cl, cr } = archCurve(a, k);
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, ya] = pts[i]!;
      const [xb, yb] = pts[i + 1]!;
      face.push([xa, ya, 0], [xb, yb, 0], [xb, y1, 0], [xa, ya, 0], [xb, y1, 0], [xa, y1, 0]);
      const mx = (xa + xb) / 2;
      const my = (ya + yb) / 2;
      const c = i < k ? cl : cr;
      quad(m, jamb, [xa, ya, 0], [xb, yb, 0], [xb, yb, zb], [xa, ya, zb], [c - mx, a.ys - my, 0]);
    }
    quad(m, jamb, [l, a.yb, 0], [l, a.ys, 0], [l, a.ys, zb], [l, a.yb, zb], [1, 0, 0]);
    quad(m, jamb, [r, a.yb, 0], [r, a.ys, 0], [r, a.ys, zb], [r, a.yb, zb], [-1, 0, 0]);
    if (a.yb > y0 + 1e-6) quad(m, jamb, [l, a.yb, 0], [r, a.yb, 0], [r, a.yb, zb], [l, a.yb, zb], [0, 1, 0]);
    const ring: Vec3[] = [[l, a.yb, zb], [r, a.yb, zb], ...pts.slice().reverse().map(([x, y]): Vec3 => [x, y, zb])];
    const fan: Vec3[] = [];
    for (let i = 1; i + 1 < ring.length; i++) fan.push(ring[0]!, ring[i]!, ring[i + 1]!);
    m.facets(back, fan, [0, 0, 1]);
    cur = r;
  }
  rq(cur, x1, y0, y1);
  m.facets(mat, face, [0, 0, 1]);
}

/** A flat arched panel in the plane z (convex), proud by `proud` and sunk to z - sink. */
function archPanel(m: MeshBuilder, mat: string, a: Arch, z: number, proud: number, sink: number, k: number): void {
  const { pts } = archCurve(a, k);
  const outline: Vec3[] = [[a.cx - a.w / 2, a.yb, z + proud], [a.cx + a.w / 2, a.yb, z + proud], ...pts.slice().reverse().map(([x, y]): Vec3 => [x, y, z + proud])];
  m.slab(mat, outline, [0, 0, -(proud + sink)]);
}

/** n round-headed arches of width w spread evenly between x0 and x1: sill yb, springing ys, depth dep. */
function evenArches(x0: number, x1: number, n: number, w: number, yb: number, ys: number, dep: number): Arch[] {
  const p = (x1 - x0) / n;
  return Array.from({ length: n }, (_, i) => ({ cx: x0 + (i + 0.5) * p, w, yb, ys, ya: ys + w / 2, dep }));
}

/** A run of wall segments [x0, x1, windows] of a two-storey wall: ground row and gallery row. */
function galleryWall(m: MeshBuilder, segs: Array<[number, number, number]>, y1: number, ext: number): void {
  for (const [x0, x1, n] of segs) {
    const lo = n > 0 ? evenArches(x0, x1, n, 2.0, 3.0, 7.0, 0.55) : [];
    const hi = n > 0 ? evenArches(x0, x1, n, 2.4, 13.2, 17.6, 0.55) : [];
    archWall(m, "plaster", "plasterLight", "window", x0, x1, 0, 11, lo, 4);
    archWall(m, "plaster", "plasterLight", "window", x0, x1, 11, y1, hi, 4);
  }
  // the string course between the storeys, one piece along the whole wall
  const a = segs[0]![0];
  const b = segs[segs.length - 1]![1];
  m.box("plasterLight", (a + b) / 2, 0.05, b - a + 2 * ext, 0.4, 10.8, 11.2, 0);
}

// --- the aisle block, the narthex and the exonarthex --------------------------------------

function aisleBlock(m: MeshBuilder): void {
  m.scope("north and south walls", () => {
    const segs: Array<[number, number, number]> = [[-MB_X, -TW_X1, 3], [-TW_X0, TW_X0, 8], [TW_X1, MB_X, 3]];
    for (const phi of [0, Math.PI]) m.moved(faceAt(0, phi === 0 ? MB_Z : -MB_Z, phi), () => galleryWall(m, segs, Y_MB, 0.25));
  });
  m.scope("east wall", () => {
    const segs: Array<[number, number, number]> = [[-MB_Z, -23, 4], [-23, -19, 0], [-19, -6.5, 3], [-6.5, 6.5, 0], [6.5, 19, 3], [19, 23, 0], [23, MB_Z, 4]];
    m.moved(faceAt(MB_X, 0, Math.PI / 2), () => galleryWall(m, segs, Y_MB, -0.25));
  });
  m.scope("west wall", () => {
    m.moved(faceAt(-MB_X, 0, -Math.PI / 2), () => {
      for (const s of [-1, 1]) {
        const [x0, x1] = s < 0 ? [-MB_Z, -N_Z] : [N_Z, MB_Z];
        archWall(m, "plaster", "plasterLight", "window", x0, x1, 0, Y_MB, evenArches(x0, x1, 1, 2.2, 13.2, 17.6, 0.55), 4);
      }
      archWall(m, "plaster", "plasterLight", "window", -N_Z, N_Z, Y_NX, Y_MB, [], 4);
    });
  });
  m.scope("cornice", () => {
    // the long sides run past the corners, the short ones stop at them: no shared faces
    for (const s of [-1, 1]) {
      m.box("plasterLight", 0, s * (MB_Z + 0.1), 2 * MB_X + 0.8, 0.6, Y_MB - 0.7, Y_MB - 0.1);
      m.box("plasterLight", s * (MB_X + 0.1), 0, 0.6, 2 * MB_Z - 0.1, Y_MB - 0.75, Y_MB - 0.15);
    }
  });
  m.scope("roof", () => {
    m.cap("lead", rect(2 * MB_X, 2 * MB_Z), Y_MB);
    // the lean-to roofs of the north and south aisles, from the tympana down to the eaves
    for (const s of [-1, 1]) {
      const zi = s * (SQ - 0.2);
      const zo = s * (MB_Z + 0.5);
      m.slab("lead", [[-MB_X - 0.5, 26.5, zi], [MB_X + 0.5, 26.5, zi], [MB_X + 0.5, Y_MB + 0.35, zo], [-MB_X - 0.5, Y_MB + 0.35, zo]], [0, -0.3, 0]);
    }
  });
}

function narthex(m: MeshBuilder): void {
  const cx = (NX0 - MB_X) / 2;
  const hw = (-MB_X - NX0) / 2;
  m.scope("narthex", () => {
    for (const [phi, cz] of [[0, N_Z], [Math.PI, -N_Z]] as Array<[number, number]>) {
      m.moved(faceAt(cx, cz, phi), () => {
        archWall(m, "plaster", "plasterLight", "window", -hw, hw, 0, 8.5, evenArches(-hw, hw, 2, 1.8, 2.5, 5.8, 0.5), 4);
        archWall(m, "plaster", "plasterLight", "window", -hw, hw, 8.5, Y_NX, evenArches(-hw, hw, 2, 2.0, 10.5, 13.8, 0.5), 4);
      });
    }
    m.moved(faceAt(NX0, 0, -Math.PI / 2), () => {
      archWall(m, "plaster", "plasterLight", "window", -N_Z, N_Z, Y_EX, Y_NX, evenArches(-N_Z, N_Z, 11, 2.0, 12.0, 14.8, 0.5), 4);
    });
    m.cap("lead", rect(-MB_X - NX0, 2 * N_Z, cx, 0), Y_NX);
    m.slab("lead", [[-MB_X + 0.2, 19.4, -N_Z - 0.4], [-MB_X + 0.2, 19.4, N_Z + 0.4], [NX0 - 0.4, Y_NX + 0.35, N_Z + 0.4], [NX0 - 0.4, Y_NX + 0.35, -N_Z - 0.4]], [0, -0.3, 0]);
  });
  const ex = (EX0 + NX0) / 2;
  const ehw = (NX0 - EX0) / 2;
  m.scope("exonarthex", () => {
    for (const [phi, cz] of [[0, N_Z], [Math.PI, -N_Z]] as Array<[number, number]>) {
      m.moved(faceAt(ex, cz, phi), () => archWall(m, "plaster", "plasterLight", "window", -ehw, ehw, 0, Y_EX, evenArches(-ehw, ehw, 1, 2.4, 0.8, 5.2, 0.5), 4));
    }
    m.moved(faceAt(EX0, 0, -Math.PI / 2), () => {
      const arc = evenArches(-N_Z, N_Z, 13, 3.0, 0.8, 5.4, 1.5).map((a, i) => (i === 6 ? { ...a, yb: 0, w: 3.4, ya: a.ys + 1.7 } : a));
      archWall(m, "plaster", "plasterLight", "window", -N_Z, N_Z, 0, Y_EX, arc, 4);
      m.box("plasterLight", 0, 0.05, 2 * N_Z - 0.5, 0.4, 8.0, 8.4, 0);
    });
    m.cap("lead", rect(NX0 - EX0, 2 * N_Z, ex, 0), Y_EX);
    m.slab("lead", [[NX0 + 0.2, 11.4, -N_Z - 0.4], [NX0 + 0.2, 11.4, N_Z + 0.4], [EX0 - 0.4, Y_EX + 0.4, N_Z + 0.4], [EX0 - 0.4, Y_EX + 0.4, -N_Z - 0.4]], [0, -0.3, 0]);
  });
}

/** The east apse: a half-hexagon with tall windows under its lead half-dome. */
function apse(m: MeshBuilder): void {
  const r = 6.8;
  const cx = MB_X - 0.5;
  const yt = 21;
  // the half-hexagon outline from north to south and back along the chord inside the wall
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= 3; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    pts.push([cx + r * Math.cos(a), r * Math.sin(a)]);
  }
  for (let i = 0; i < 3; i++) {
    const [ax, az] = pts[i]!;
    const [bx, bz] = pts[i + 1]!;
    const mx = (ax + bx) / 2;
    const mz = (az + bz) / 2;
    const phi = Math.atan2(mx - cx, mz);
    const hw = Math.hypot(bx - ax, bz - az) / 2;
    m.moved(faceAt(mx, mz, phi), () => {
      archWall(m, "plaster", "plasterLight", "window", -hw, hw, 0, 10, [{ cx: 0, w: 2.2, yb: 3.5, ys: 7.4, ya: 8.5, dep: 0.5 }], 4);
      archWall(m, "plaster", "plasterLight", "window", -hw, hw, 10, yt, [{ cx: 0, w: 2.6, yb: 12.5, ys: 17.4, ya: 18.7, dep: 0.5 }], 4);
    });
  }
  // the lead half-dome: rows of the half-hexagon shrinking toward the wall
  const rows: Vec3[][] = [];
  for (let k = 0; k <= 3; k++) {
    const e = (k / 3) * (Math.PI / 2);
    const s = Math.cos(e) * 1.04;
    rows.push(pts.map(([x, z]): Vec3 => [cx + (x - cx) * s, yt + 2.6 * Math.sin(e), z * s]));
  }
  surface(m, "lead", rows, [cx, yt - 2, 0], false);
  m.facets("lead", [[cx, yt, pts[0]![1] * 1.04], [pts[1]![0] + (pts[1]![0] - cx) * 0.04, yt, pts[1]![1] * 1.04], [pts[2]![0] + (pts[2]![0] - cx) * 0.04, yt, pts[2]![1] * 1.04],
    [cx, yt, pts[0]![1] * 1.04], [pts[2]![0] + (pts[2]![0] - cx) * 0.04, yt, pts[2]![1] * 1.04], [cx, yt, pts[3]![1] * 1.04]], [0, -1, 0]);
}

// --- the towers and the buttresses --------------------------------------------------------

function tower(m: MeshBuilder, sx: number, sz: number): void {
  const cx = (sx * (TW_X0 + TW_X1)) / 2;
  const w = TW_X1 - TW_X0;
  // the tall inner part beside the great arch and the lower outer part over the aisles
  const ci = (sz * (TW_Z0 + TW_ZS)) / 2;
  const di = TW_ZS - TW_Z0;
  const co = (sz * (TW_ZS - 0.2 + TW_Z1)) / 2;
  const dO = TW_Z1 - TW_ZS + 0.2;
  const wo = w - 0.3;
  m.scope("inner part", () => {
    m.box("plasterLight", cx, ci, w, di, 0, Y_TW, 0, false);
    m.box("plasterLight", cx, ci, w + 0.6, di + 0.6, Y_TW - 0.8, Y_TW + 0.3);
    m.loft("lead", rect(w + 0.2, di + 0.2, cx, ci), Y_TW + 0.3, rect(w - 3.5, di - 3.5, cx, ci), Y_TW + 1.9);
    // the face above the outer part: the round medallion and a pair of blind arches
    m.moved(faceAt(cx, sz * TW_ZS, sz > 0 ? 0 : Math.PI), () => {
      m.slab("plaster", ngon(16, 1.7).map(([x, z]): Vec3 => [x, 36.8 + z, 0.15]), [0, 0, -0.2]);
      m.slab("plasterLight", ngon(16, 1.1).map(([x, z]): Vec3 => [x, 36.8 + z, 0.25]), [0, 0, -0.15]);
      for (const s of [-1, 1]) archPanel(m, "plaster", { cx: s * 2.6, w: 1.6, yb: 33.0, ys: 36.4, ya: 37.2, dep: 0 }, 0, 0.12, 0.05, 3);
    });
    // the tympanum side: a tall blind arch over the aisle roof
    m.moved(faceAt(sx * TW_X0, ci, sx > 0 ? -Math.PI / 2 : Math.PI / 2), () => {
      archPanel(m, "plaster", { cx: 0, w: 3.0, yb: 29, ys: 35, ya: 36.5, dep: 0 }, 0, 0.12, 0.05, 4);
    });
  });
  m.scope("outer part", () => {
    m.box("plasterLight", cx, co, wo, dO, 0, Y_TWO, 0, false);
    m.box("plasterLight", cx, co, wo + 0.6, dO + 0.6, Y_TWO - 0.8, Y_TWO + 0.3);
    m.loft("lead", rect(wo + 0.2, dO + 0.2, cx, co), Y_TWO + 0.3, rect(wo - 3.0, dO - 3.0, cx, co), Y_TWO + 1.5);
    m.moved(faceAt(cx, sz * TW_Z1, sz > 0 ? 0 : Math.PI), () => {
      for (const s of [-1, 1]) archPanel(m, "plaster", { cx: s * 2.0, w: 2.4, yb: 23.6, ys: 27.4, ya: 28.6, dep: 0 }, 0, 0.12, 0.05, 4);
      m.box("plaster", 0, 0.05, wo + 0.4, 0.5, 22.6, 23.0, 0);
    });
  });
}

/** Small domes on drums at the corners of the gallery roof. */
function cornerDomes(m: MeshBuilder): void {
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * 28;
      const cz = sz * 30.5;
      m.scope("corner dome", () => {
        m.prism("plaster", ngon(12, 3.0, 0, cx, cz), Y_MB, 25.4, false);
        ringBand(m, "plasterLight", 12, 3.3, 25.2, 25.7, -1, 2.9, cx, cz);
        for (let k = 0; k < 6; k++) {
          const phi = Math.PI / 12 + (k * 2 * Math.PI) / 6 + Math.PI / 2;
          const ap = 3.0 * Math.cos(Math.PI / 12);
          m.moved(faceAt(cx + ap * Math.sin(phi), cz + ap * Math.cos(phi), phi), () => archPanel(m, "window", { cx: 0, w: 0.8, yb: 23.6, ys: 24.6, ya: 25.0, dep: 0 }, 0, 0.04, 0.05, 3));
        }
        surface(m, "lead", sphereRows(cx, 24.9, cz, 3.2, 0, 2 * Math.PI, 12, 0.25, 4, true), [cx, 24.9, cz], true);
        m.spire("gilt", ngon(6, 0.12, 0, cx, cz), 28.0, 29.3);
      });
    }
  }
}

/** An Ottoman sloping buttress: a wedge of width w across, from the wall plane at `wall` out by `out`, top yt, in the face frame. */
function wedge(m: MeshBuilder, w: number, out: number, yt: number): void {
  const x = -w / 2;
  m.slab("stone", [[x, 0, -0.1], [x, 0, out], [x, 1.6, out], [x, yt, -0.1]], [w, 0, 0]);
  m.slab("plasterLight", [[x - 0.15, 1.6, out + 0.15], [x - 0.15, yt + 0.25, -0.1], [x - 0.15, yt + 0.75, -0.1], [x - 0.15, 2.1, out + 0.15]], [w + 0.3, 0, 0]);
}

function buttresses(m: MeshBuilder): void {
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      m.moved(faceAt((sx * (TW_X0 + TW_X1)) / 2, sz * TW_Z1, sz > 0 ? 0 : Math.PI), () => wedge(m, 6, 6, 27));
      m.moved(faceAt(MB_X, sz * 21, Math.PI / 2), () => wedge(m, 3.6, 5, 20));
    }
  }
}

// --- the central square, the semidomes, the drum and the dome -----------------------------

function centralBlock(m: MeshBuilder): void {
  const great: Arch = { cx: 0, w: 26, yb: 26.6, ys: 26.7, ya: 39.7, dep: 2.0 };
  for (const [phi, cz] of [[0, SQ], [Math.PI, -SQ]] as Array<[number, number]>) {
    m.scope("tympanum", () => m.moved(faceAt(0, cz, phi), () => {
      archWall(m, "plasterLight", "tympanum", "tympanum", -TW_X0, TW_X0, Y_MB, Y_SQ, [great], 12);
      const zb = -great.dep;
      for (const a of evenArches(-10.5, 10.5, 7, 1.7, 27.6, 30.6, 0)) archPanel(m, "window", a, zb, 0.05, 0.05, 4);
      for (const a of evenArches(-6.5, 6.5, 5, 1.6, 32.6, 35.4, 0)) archPanel(m, "window", a, zb, 0.05, 0.05, 4);
      // the arch's moulded rim
      m.box("plaster", 0, 0.1, 2 * TW_X0, 0.5, Y_SQ - 1.2, Y_SQ - 0.6, 0);
    }));
  }
  m.scope("east and west faces", () => {
    for (const s of [-1, 1]) {
      const x = s * SQ;
      quad(m, "plasterLight", [x, Y_MB, -SQ], [x, Y_MB, SQ], [x, Y_SQ, SQ], [x, Y_SQ, -SQ], [s, 0, 0]);
    }
  });
  m.scope("top", () => m.cap("plasterLight", rect(2 * SQ, 2 * SQ), Y_SQ));
}

/** A great semidome on the side s (+1 east, -1 west): its windowed wall, the shell, the exedrae. */
function semidome(m: MeshBuilder, s: number): void {
  const cx = s * SQ;
  const n = 25;
  const a0 = s > 0 ? -Math.PI / 2 : Math.PI / 2;
  const a1 = s > 0 ? Math.PI / 2 : (3 * Math.PI) / 2;
  m.scope("wall", () => {
    surface(m, "plaster", [arcRow(cx, 0, SD_R, Y_MB, a0, a1, n), arcRow(cx, 0, SD_R, Y_SD, a0, a1, n)], [cx, Y_MB, 0], false);
    // five windows, clear of the exedrae
    const ap = SD_R * Math.cos(Math.PI / (2 * n));
    for (const i of [1, 9, 12, 15, 23]) {
      const a = a0 + ((a1 - a0) * (i + 0.5)) / n;
      const phi = Math.atan2(Math.cos(a), Math.sin(a));
      m.moved(faceAt(cx + ap * Math.cos(a), ap * Math.sin(a), phi), () => archPanel(m, "window", { cx: 0, w: 1.3, yb: 22.6, ys: 24.1, ya: 24.75, dep: 0 }, 0, 0.05, 0.05, 3));
    }
    surface(m, "plasterLight", [arcRow(cx, 0, SD_R + 0.35, Y_SD - 0.5, a0, a1, n), arcRow(cx, 0, SD_R + 0.35, Y_SD - 0.1, a0, a1, n)], [cx, Y_MB, 0], false);
  });
  m.scope("shell", () => {
    surface(m, "lead", sphereRows(cx, Y_SD - 0.1, 0, SD_R + 0.4, a0, a1, n, 0, 10, false), [cx, Y_SD - 0.1, 0], false);
  });
  m.scope("exedrae", () => {
    for (const t of [-1, 1]) {
      const a = (s > 0 ? 0 : Math.PI) + t * (Math.PI / 4) * s;
      const ex = cx + SD_R * Math.cos(a);
      const ez = SD_R * Math.sin(a);
      const e0 = Math.asin(2 / 5.5);
      surface(m, "lead", sphereRows(ex, 20, ez, 5.5, 0, 2 * Math.PI, 16, e0, 4, true), [ex, 20, ez], true);
    }
  });
}

function drumAndDome(m: MeshBuilder): void {
  const N = 40;
  m.scope("drum", () => {
    // facets centred on phi_k = pi / 40 + k * 2 pi / 40 (the window bays)
    m.prism("leadDark", ngon(N, DR_R, -Math.PI / 2), Y_SQ, Y_DR, false);
    ringBand(m, "plasterLight", N, DR_R + 0.5, Y_SQ, Y_SQ + 0.6, -1, DR_R, 0, 0, -Math.PI / 2);
    const ap = DR_R * Math.cos(Math.PI / N);
    for (let k = 0; k < N; k++) {
      const phi = Math.PI / N + (k * 2 * Math.PI) / N;
      m.moved(faceAt(ap * Math.sin(phi), ap * Math.cos(phi), phi), () => archPanel(m, "window", { cx: 0, w: 1.55, yb: 42.2, ys: 44.6, ya: 45.375, dep: 0 }, 0, 0.05, 0.05, 3));
      // the buttress between two windows, its top sloping into the drum
      const pb = phi + Math.PI / N;
      m.moved(faceAt(DR_R * Math.sin(pb), DR_R * Math.cos(pb), pb), () => {
        m.slab("lead", [[-0.45, Y_SQ + 0.5, -0.2], [-0.45, Y_SQ + 0.5, 1.3], [-0.45, Y_DR - 1.6, 1.3], [-0.45, Y_DR - 0.3, -0.2]], [0.9, 0, 0]);
      });
    }
    ringBand(m, "plasterLight", N, DR_R + 0.45, Y_DR - 0.3, Y_DR + 0.2, DR_R - 0.2, DR_R, 0, 0, -Math.PI / 2);
  });
  m.scope("dome", () => {
    // a spherical cap from radius 17 at the drum's cornice to the crown
    const rb = DR_R + 0.2;
    const y0 = Y_DR + 0.2;
    const h = Y_DOME - y0;
    const R = (rb * rb + h * h) / (2 * h);
    const cy = Y_DOME - R;
    const e0 = Math.asin((y0 - cy) / R);
    surface(m, "lead", sphereRows(0, cy, 0, R, 0, 2 * Math.PI, 80, e0, 12, true), [0, cy, 0], true);
    // forty ribs over the lower part of the cap
    for (let k = 0; k < N; k++) {
      const a = (k * 2 * Math.PI) / N + Math.PI / 2;
      const pts: Vec3[] = [];
      for (const e of [e0, e0 + 0.12, e0 + 0.24]) pts.push([R * Math.cos(e) * Math.cos(a), cy + R * Math.sin(e), R * Math.cos(e) * Math.sin(a)]);
      const tx = -Math.sin(a) * 0.14;
      const tz = Math.cos(a) * 0.14;
      const o = 0.1;
      const ox = Math.cos(a) * o;
      const oz = Math.sin(a) * o;
      for (let i = 0; i + 1 < pts.length; i++) {
        const p = pts[i]!;
        const q = pts[i + 1]!;
        m.slab("lead", [[p[0] - tx + ox, p[1] + 0.06, p[2] - tz + oz], [p[0] + tx + ox, p[1] + 0.06, p[2] + tz + oz], [q[0] + tx + ox, q[1] + 0.06, q[2] + tz + oz], [q[0] - tx + ox, q[1] + 0.06, q[2] - tz + oz]], [-ox * 3, -0.3, -oz * 3]);
      }
    }
  });
  m.scope("finial", () => {
    const at = (r: number): Ring => ngon(10, r);
    m.loft("lead", at(1.1), Y_DOME - 0.15, at(0.8), Y_DOME + 0.5);
    m.loft("gilt", at(0.25), Y_DOME + 0.5, at(0.18), Y_DOME + 1.0, false);
    m.loft("gilt", at(0.18), Y_DOME + 1.0, at(0.55), Y_DOME + 1.45, false);
    m.loft("gilt", at(0.55), Y_DOME + 1.45, at(0.12), Y_DOME + 1.9, false);
    m.prism("gilt", at(0.12), Y_DOME + 1.9, Y_DOME + 2.6, false);
    for (const s of [-1, 1]) {
      const yc = Y_DOME + 2.7;
      m.slab("gilt", [[0.06, yc + 0.6, s * 0.65], [0.06, yc, s * 0.3], [0.06, yc, s * 0.1], [0.06, yc + 0.25, s * 0.1]], [-0.12, 0, 0]);
    }
    m.spire("gilt", at(0.12), Y_DOME + 2.6, Y_DOME + 3.6);
  });
}

// --- the minarets -------------------------------------------------------------------------

/** A minaret at (cx, cz): shaft material, the balcony heights, the cap's foot and the tip. */
function minaret(m: MeshBuilder, cx: number, cz: number, shaft: string, balconies: number[], yCap: number, top: number): void {
  const n = 20;
  const c = (r: number): Ring => ngon(n, r, 0, cx, cz);
  m.scope("pedestal", () => {
    m.box("stone", cx, cz, 5.4, 5.4, 0, 7.2, 0, false);
    m.box("stone", cx, cz, 5.9, 5.9, 7.2, 7.8);
    m.loft("stone", ngon(8, 3.0, Math.PI / 8, cx, cz), 7.8, ngon(8, 2.6, Math.PI / 8, cx, cz), 9.6, false);
    m.cap("stone", ngon(8, 2.6, Math.PI / 8, cx, cz), 9.6);
  });
  let y = 9.6;
  let r = 2.15;
  const rTop = 1.75;
  const slope = (r - rTop) / (yCap - y);
  m.scope("shaft", () => {
    for (const yb of balconies) {
      const r1 = r - slope * (yb - y);
      m.loft(shaft, c(r), y - 0.05, c(r1), yb, false);
      // the balcony: a flaring corbel, the deck and the railing
      m.loft("stone", c(r1), yb - 1.8, c(r1 + 0.85), yb - 0.4, false);
      ringBand(m, "stone", n, r1 + 1.05, yb - 0.4, yb, r1 + 0.85, 0, cx, cz);
      band(m, "stone", c(r1), yb, c(r1 + 0.85), yb, true);
      m.loft("stone", c(r1 + 1.05), yb, c(r1 + 1.05), yb + 1.0, false);
      m.loft("stone", c(r1 + 0.85).slice().reverse(), yb, c(r1 + 0.85).slice().reverse(), yb + 1.0, false);
      band(m, "stone", c(r1 + 0.85), yb + 1.0, c(r1 + 1.05), yb + 1.0, true);
      y = yb;
      r = r1;
    }
    m.loft(shaft, c(r), y - 0.05, c(rTop), yCap, false);
    ringBand(m, "stone", n, rTop + 0.3, yCap - 0.5, yCap, rTop, 0, cx, cz);
  });
  m.scope("cap", () => {
    m.spire("lead", c(rTop + 0.3), yCap, top - 2.2);
    m.prism("gilt", ngon(6, 0.1, 0, cx, cz), top - 2.6, top - 1.2, false);
    m.loft("gilt", ngon(8, 0.1, 0, cx, cz), top - 1.6, ngon(8, 0.3, 0, cx, cz), top - 1.35, false);
    m.loft("gilt", ngon(8, 0.3, 0, cx, cz), top - 1.35, ngon(8, 0.1, 0, cx, cz), top - 1.1, false);
    m.spire("gilt", ngon(6, 0.1, 0, cx, cz), top - 1.2, top);
  });
}

/** The minarets' axes: west pair (two balconies) and east pair (one; the south-east one in brick). */
const MIN_W: [number, number] = [-45, 37.5];
const MIN_E: [number, number] = [37, 40];

// --- the whole ----------------------------------------------------------------------------

export function hagiaSophia(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("aisles and galleries", () => aisleBlock(m));
  m.scope("narthexes", () => narthex(m));
  m.scope("apse", () => apse(m));
  m.scope("buttress towers", () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.scope("tower", () => tower(m, sx, sz));
  });
  m.scope("sloping buttresses", () => buttresses(m));
  m.scope("corner domes", () => cornerDomes(m));
  m.scope("central square", () => centralBlock(m));
  m.scope("east semidome", () => semidome(m, 1));
  m.scope("west semidome", () => semidome(m, -1));
  m.scope("drum and dome", () => drumAndDome(m));
  m.scope("minarets", () => {
    for (const s of [-1, 1]) {
      m.scope("west minaret", () => minaret(m, MIN_W[0], s * MIN_W[1], "stone", [36, 46], 50, 60));
      m.scope("east minaret", () => minaret(m, MIN_E[0], s * MIN_E[1], s > 0 ? "brick" : "stone", [44], 48.5, 58.5));
    }
  });
  return m;
}

/** The distant model: the blocks, the towers, the semidomes, the drum and dome, the minarets. */
export function hagiaSophiaLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.box("plaster", 0, 0, 2 * MB_X, 2 * MB_Z, 0, Y_MB);
  m.slab("lead", [[-MB_X, 26.5, SQ - 0.2], [MB_X, 26.5, SQ - 0.2], [MB_X, Y_MB + 0.3, MB_Z + 0.3], [-MB_X, Y_MB + 0.3, MB_Z + 0.3]], [0, -0.3, 0]);
  m.slab("lead", [[-MB_X, 26.5, -SQ + 0.2], [MB_X, 26.5, -SQ + 0.2], [MB_X, Y_MB + 0.3, -MB_Z - 0.3], [-MB_X, Y_MB + 0.3, -MB_Z - 0.3]], [0, -0.3, 0]);
  m.box("plaster", ((NX0 - MB_X) / 2), 0, -MB_X - NX0 + 0.2, 2 * N_Z, 0, Y_NX);
  m.box("plaster", ((EX0 + NX0) / 2), 0, NX0 - EX0 + 0.2, 2 * N_Z - 0.2, 0, Y_EX);
  m.box("plaster", MB_X + 3, 0, 6.4, 11, 0, 21);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      m.box("plasterLight", (sx * (TW_X0 + TW_X1)) / 2, (sz * (TW_Z0 + TW_ZS)) / 2, TW_X1 - TW_X0, TW_ZS - TW_Z0, 0, Y_TW);
      m.box("plasterLight", (sx * (TW_X0 + TW_X1)) / 2, (sz * (TW_ZS - 0.2 + TW_Z1)) / 2, TW_X1 - TW_X0 - 0.3, TW_Z1 - TW_ZS + 0.2, 0, Y_TWO);
      m.slab("stone", [[(sx * (TW_X0 + TW_X1)) / 2 - 3, 0, sz * (TW_Z1 - 0.1)], [(sx * (TW_X0 + TW_X1)) / 2 - 3, 0, sz * (TW_Z1 + 6)], [(sx * (TW_X0 + TW_X1)) / 2 - 3, 27, sz * (TW_Z1 - 0.1)]], [6, 0, 0]);
    }
  }
  m.box("plasterLight", 0, 0, 2 * SQ - 0.2, 2 * SQ, Y_MB - 0.5, Y_SQ);
  m.slab("tympanum", [[-12, 26.6, SQ + 0.05], [12, 26.6, SQ + 0.05], [12, 32, SQ + 0.05], [0, 39, SQ + 0.05], [-12, 32, SQ + 0.05]], [0, 0, -0.1]);
  m.slab("tympanum", [[-12, 26.6, -SQ - 0.05], [12, 26.6, -SQ - 0.05], [12, 32, -SQ - 0.05], [0, 39, -SQ - 0.05], [-12, 32, -SQ - 0.05]], [0, 0, 0.1]);
  for (const s of [-1, 1]) {
    const cx = s * SQ;
    const a0 = s > 0 ? -Math.PI / 2 : Math.PI / 2;
    const a1 = s > 0 ? Math.PI / 2 : (3 * Math.PI) / 2;
    surface(m, "lead", sphereRows(cx, Y_MB, 0, SD_R + 0.4, a0, a1, 6, 0, 3, false), [cx, Y_MB, 0], false);
  }
  m.prism("leadDark", ngon(12, DR_R), Y_SQ, Y_DR + 0.2, false);
  const rb = DR_R + 0.2;
  const h = Y_DOME - Y_DR - 0.2;
  const R = (rb * rb + h * h) / (2 * h);
  const cy = Y_DOME - R;
  surface(m, "lead", sphereRows(0, cy, 0, R, 0, 2 * Math.PI, 12, Math.asin((Y_DR + 0.2 - cy) / R), 3, true), [0, cy, 0], true);
  m.spire("gilt", ngon(4, 0.4), Y_DOME - 0.2, Y_DOME + 3.6);
  for (const s of [-1, 1]) {
    for (const [cx, cz, cap, top, mat] of [[MIN_W[0], s * MIN_W[1], 50, 60, "stone"], [MIN_E[0], s * MIN_E[1], 48.5, 58.5, s > 0 ? "brick" : "stone"]] as Array<[number, number, number, number, string]>) {
      m.box("stone", cx, cz, 5.9, 5.9, 0, 9.6);
      m.loft(mat, ngon(6, 2.2, 0, cx, cz), 9.6, ngon(6, 1.8, 0, cx, cz), cap, false);
      m.spire("lead", ngon(6, 2.05, 0, cx, cz), cap, top);
    }
  }
  return m;
}

export const HAGIA_SOPHIA: ProceduralDesign[] = [
  {
    id: "bld-hagia-sophia",
    game: { plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" } },
    title: "Hagia Sophia",
    build: hagiaSophia,
    buildLod: hagiaSophiaLod,
    references: "hagia-sophia",
    catalog: PLAZA_CATALOG,
  },
];
