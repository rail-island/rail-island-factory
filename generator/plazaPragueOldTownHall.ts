// The Old Town Hall of Prague (Staromestska radnice) on the Old Town Square: the
// Gothic tower with its gallery, corner turrets and steep roof, the astronomical
// clock (the Orloj) on its south face, the chapel oriel on its east face, and the
// row of historic houses west of it that make up the surviving complex (the east
// wing burned in 1945 and was never rebuilt). See docs/models/plaza-landmarks.md.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin. The square
// lies to the south, +Z: the house fronts and the Orloj face it. The tower stands
// at the +X end of the row; west of it, in order, the Kriz house (the big
// Renaissance window with "PRAGA CAPUT REGNI"), the Mikes house, the House at the
// Rooster and, on the corner, the House at the Minute with its sgraffito and
// ground-floor arcade. The tower is about 69.5 m to the tip of its finials.
//
// Sources: the photographs in assets/prague-old-town-hall/ (SOURCES.md) and the
// Wikipedia articles "Old Town Hall (Prague)" and "Prague astronomical clock";
// proportions measured from the photographs, simplified.
//
// Deterministic: the same code gives the same bytes. The id is stored in the
// game's saved maps, so it is never renamed once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox, lodLoft } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  stone: { color: "#8f8574", roughness: 0.95 },
  stoneDark: { color: "#4f4942", roughness: 0.9 },
  slate: { color: "#3a3a3e", metallic: 0.1, roughness: 0.75 },
  tile: { color: "#a34b33", roughness: 0.85 },
  plasterKriz: { color: "#eee7d6", roughness: 0.9 },
  plasterMikes: { color: "#d9a58a", roughness: 0.9 },
  plasterKohout: { color: "#e2c27c", roughness: 0.9 },
  plasterMinute: { color: "#d3c9b3", roughness: 0.9 },
  trim: { color: "#f3eee3", roughness: 0.8 },
  windowGlass: { color: "#2a2f37", metallic: 0.2, roughness: 0.25 },
  orlojBlue: { color: "#2d5a8e", roughness: 0.6 },
  gilt: { color: "#c9a24b", metallic: 0.6, roughness: 0.4 },
};

// --- vector helpers --------------------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

/** A straight bar from a to b, w wide and h deep across it; `up` turns its h side. */
function beam(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, w: number, h: number, up: Vec3 = [0, 1, 0]): void {
  const d = unit(sub(b, a));
  let v = sub(up, mul(d, dot(up, d)));
  if (Math.hypot(v[0], v[1], v[2]) < 1e-6) v = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  v = unit(sub(v, mul(d, dot(v, d))));
  const u = cross(d, v);
  const c = (su: number, sv: number): Vec3 => add(a, add(mul(u, (su * w) / 2), mul(v, (sv * h) / 2)));
  m.slab(mat, [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], sub(b, a));
}

/** A box() given by its spans; no underside. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

/** A closed box spanning x0..x1, y0..y1, z0..z1. */
function cube(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, true);
  m.cap(mat, r, y0, false);
}

// --- facade frames -----------------------------------------------------------------

/**
 * A vertical wall plane: a point (ox, oz) on it, the horizontal axis u along it and
 * the outward normal n. A facade point is (u along, y up, d out of the wall).
 */
interface Face { ox: number; oz: number; ux: number; uz: number; nx: number; nz: number }
/** The wall z = z facing +Z (s = 1) or -Z; u is world x. */
const faceZ = (z: number, s: number): Face => ({ ox: 0, oz: z, ux: 1, uz: 0, nx: 0, nz: s });
/** The wall x = x facing +X (s = 1) or -X; u is world z. */
const faceX = (x: number, s: number): Face => ({ ox: x, oz: 0, ux: 0, uz: 1, nx: s, nz: 0 });
/** A wall facing (nx, nz) through (cx, cz) + n * dist; u = 0 on that point. */
const faceDir = (cx: number, cz: number, nx: number, nz: number, dist: number): Face => ({ ox: cx + nx * dist, oz: cz + nz * dist, ux: -nz, uz: nx, nx, nz });
const P = (f: Face, u: number, y: number, d: number): Vec3 => [f.ox + f.ux * u + f.nx * d, y, f.oz + f.uz * u + f.nz * d];

/** The extra burial depth of each material's hidden back face (see fpoly). */
const BURY: Record<string, number> = {
  stone: 0.01, stoneDark: 0.02, slate: 0.025, tile: 0.03, plasterKriz: 0.035, plasterMikes: 0.04,
  plasterKohout: 0.045, plasterMinute: 0.05, trim: 0, windowGlass: 0.055, orlojBlue: 0.06, gilt: 0.065,
};

/** A convex outline (u, y) on face f, d0..d1 out of the wall. */
function fpoly(m: MeshBuilder, mat: string, f: Face, pts: Array<[number, number]>, d0: number, d1: number): void {
  // faces buried in the wall keep a per-material depth, so two never share a plane
  if (d0 < 0) d0 -= BURY[mat] ?? 0;
  // and so do their undersides on the ground
  const lift = (BURY[mat] ?? 0) * 0.2;
  m.slab(mat, pts.map(([u, y]) => P(f, u, y === 0 ? lift : y, d0)), [f.nx * (d1 - d0), 0, f.nz * (d1 - d0)]);
}

function fbox(m: MeshBuilder, mat: string, f: Face, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number): void {
  fpoly(m, mat, f, [[u0, y0], [u1, y0], [u1, y1], [u0, y1]], d0, d1);
}

/** The arc of an equilateral pointed arch over u0..u1 springing at ys: (u1, ys) up to the apex and down to (u0, ys). */
function pointedArc(u0: number, u1: number, ys: number, n: number): Array<[number, number]> {
  const w = u1 - u0;
  const pts: Array<[number, number]> = [];
  for (let k = 0; k <= n; k++) {
    const a = ((k / n) * Math.PI) / 3;
    pts.push([u0 + w * Math.cos(a), ys + w * Math.sin(a)]);
  }
  for (let k = 1; k <= n; k++) {
    const a = (2 * Math.PI) / 3 + ((k / n) * Math.PI) / 3;
    pts.push([u1 + w * Math.cos(a), ys + w * Math.sin(a)]);
  }
  return pts;
}

/** The semicircle over u0..u1 springing at ys, from (u1, ys) to (u0, ys). */
function roundArc(u0: number, u1: number, ys: number, n: number): Array<[number, number]> {
  const r = (u1 - u0) / 2;
  const uc = (u0 + u1) / 2;
  const pts: Array<[number, number]> = [];
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI;
    pts.push([uc + r * Math.cos(a), ys + r * Math.sin(a)]);
  }
  return pts;
}

/** A lancet (pointed) outline: the sill y0, the jambs up to ys and the arch. */
const lancet = (u0: number, u1: number, y0: number, ys: number, n = 3): Array<[number, number]> => [[u0, y0], ...pointedArc(u0, u1, ys, n)];
/** A round-headed outline. */
const roundHead = (u0: number, u1: number, y0: number, ys: number, n = 6): Array<[number, number]> => [[u0, y0], ...roundArc(u0, u1, ys, n)];

/** The band between two arcs of the same point count: voussoirs, each a convex quad. */
function arcBand(m: MeshBuilder, mat: string, f: Face, inner: Array<[number, number]>, outer: Array<[number, number]>, d0: number, d1: number): void {
  for (let i = 0; i + 1 < inner.length; i++) fpoly(m, mat, f, [inner[i]!, inner[i + 1]!, outer[i + 1]!, outer[i]!], d0, d1);
}

/** The spandrel wall over a round arch up to yTop: vertical strips from the arc to the top line. */
function spandrel(m: MeshBuilder, mat: string, f: Face, arc: Array<[number, number]>, yTop: number, d0: number, d1: number): void {
  for (let i = 0; i + 1 < arc.length; i++) {
    const a = arc[i]!;
    const b = arc[i + 1]!;
    fpoly(m, mat, f, [a, b, [b[0], yTop], [a[0], yTop]], d0, d1);
  }
}

/**
 * A rectangular sash window on face f, its centre uc: a trim frame of four bars
 * around the dark pane, a sill, a cross of glazing bars and an optional crown
 * (a cornice, a triangular or a segmental pediment). `plain` leaves only the
 * pane and the sill (the courtyard sides).
 */
function sashWindow(m: MeshBuilder, f: Face, uc: number, y0: number, y1: number, w: number, crown: "none" | "cornice" | "triangle" | "segment" = "none", plain = false, frameMat = "trim"): void {
  const u0 = uc - w / 2;
  const u1 = uc + w / 2;
  if (plain) {
    fbox(m, "windowGlass", f, u0, u1, y0, y1, -0.05, 0.05);
    fbox(m, frameMat, f, u0 - 0.1, u1 + 0.1, y0 - 0.15, y0, -0.05, 0.14);
    return;
  }
  const t = 0.16;
  fbox(m, "windowGlass", f, u0 + 0.05, u1 - 0.05, y0 + 0.05, y1 - 0.05, -0.05, 0.04);
  fbox(m, frameMat, f, u0, u0 + t, y0, y1, -0.05, 0.12);
  fbox(m, frameMat, f, u1 - t, u1, y0, y1, -0.05, 0.12);
  fbox(m, frameMat, f, u0 + t, u1 - t, y1 - t, y1, -0.05, 0.12);
  fbox(m, frameMat, f, u0 - 0.1, u1 + 0.1, y0 - 0.12, y0 + 0.06, -0.05, 0.2);
  fbox(m, frameMat, f, uc - 0.035, uc + 0.035, y0 + 0.06, y1 - t, -0.05, 0.08);
  const yt = y0 + (y1 - y0) * 0.64;
  fbox(m, frameMat, f, u0 + t, u1 - t, yt - 0.035, yt + 0.035, -0.05, 0.08);
  if (crown === "none") return;
  fbox(m, frameMat, f, u0 - 0.18, u1 + 0.18, y1 + 0.08, y1 + 0.26, -0.05, 0.26);
  const hw = w / 2 + 0.18;
  if (crown === "triangle") fpoly(m, frameMat, f, [[uc - hw, y1 + 0.26], [uc + hw, y1 + 0.26], [uc, y1 + 0.78]], -0.05, 0.22);
  if (crown === "segment") {
    const pts: Array<[number, number]> = [];
    for (let k = 0; k <= 6; k++) {
      const a = (k / 6) * Math.PI;
      pts.push([uc + hw * Math.cos(a), y1 + 0.26 + 0.42 * Math.sin(a)]);
    }
    fpoly(m, frameMat, f, pts, -0.05, 0.22);
  }
}

/** A Gothic lancet window: the dark pane, a mullion, a sill and a hood mould round the arch. */
function gothicWindow(m: MeshBuilder, f: Face, uc: number, y0: number, ys: number, w: number, mat = "stoneDark", mullion = true): void {
  const u0 = uc - w / 2;
  const u1 = uc + w / 2;
  fpoly(m, "windowGlass", f, lancet(u0, u1, y0, ys, 3), -0.05, 0.05);
  arcBand(m, mat, f, pointedArc(u0, u1, ys, 3), pointedArc(u0 - 0.2, u1 + 0.2, ys, 3), -0.05, 0.16);
  fbox(m, mat, f, u0 - 0.2, u0, y0, ys + 0.01, -0.05, 0.16);
  fbox(m, mat, f, u1, u1 + 0.2, y0, ys + 0.01, -0.05, 0.16);
  fbox(m, mat, f, u0 - 0.25, u1 + 0.25, y0 - 0.18, y0, -0.05, 0.22);
  if (mullion) fbox(m, mat, f, uc - 0.05, uc + 0.05, y0, ys + w * 0.55, -0.05, 0.1);
}

/** A heraldic shield on face f at (uc, y): a pointed outline standing out of the wall, a charge on it. */
function shield(m: MeshBuilder, f: Face, uc: number, y: number, s: number, field: string, charge: string): void {
  fpoly(m, field, f, [[uc - s / 2, y + s * 0.2], [uc, y - s * 0.55], [uc + s / 2, y + s * 0.2], [uc + s / 2, y + s * 0.6], [uc - s / 2, y + s * 0.6]], -0.05, 0.08);
  fbox(m, charge, f, uc - s * 0.12, uc + s * 0.12, y - s * 0.2, y + s * 0.45, 0.08, 0.11);
}

/** A standing figure on a small console at (x, y, z), h tall: robe, head and the console. */
function statue(m: MeshBuilder, robe: string, head: string, x: number, y: number, z: number, h: number, console = "stoneDark"): void {
  m.scope("statue", () => {
    span(m, console, x - h * 0.2, x + h * 0.2, y - h * 0.14, y, z - h * 0.2, z + h * 0.2);
    m.loft(robe, ngon(6, h * 0.16, 0, x, z), y, ngon(6, h * 0.1, 0, x, z), y + h * 0.74);
    m.prism(head, ngon(6, h * 0.075, Math.PI / 6, x, z), y + h * 0.72, y + h * 0.92);
    // the arms, bent forward to hold their attributes
    for (const s of [-1, 1]) {
      beam(m, robe, [x + s * h * 0.11, y + h * 0.68, z], [x + s * h * 0.15, y + h * 0.46, z + h * 0.06], h * 0.06, h * 0.06);
      beam(m, robe, [x + s * h * 0.15, y + h * 0.47, z + h * 0.05], [x + s * h * 0.08, y + h * 0.43, z + h * 0.2], h * 0.05, h * 0.05);
    }
  });
}

// --- the layout --------------------------------------------------------------------

/** The tower: its square shaft x TX0..TX1, z TZ0..TZ1 (11.5 m square). */
const TX0 = 14.2;
const TX1 = 25.7;
const TZ0 = -1.9;
const TZ1 = 9.6;
const TXC = (TX0 + TX1) / 2;
const TZC = (TZ0 + TZ1) / 2;
const SHAFT_TOP = 49.6;
/** The Orloj's centre line on the tower's south face. */
const OX = TXC + 1.2;

/** The houses west of the tower, west to east; each overlaps the next by 5 cm. */
interface House { name: string; x0: number; x1: number; zF: number; zB: number; eave: number; rise: number; plaster: string }
const MINUTE: House = { name: "house at the minute", x0: -28.0, x1: -15.6, zF: 8.9, zB: -10.4, eave: 13.0, rise: 7.6, plaster: "plasterMinute" };
const KOHOUT: House = { name: "house at the rooster", x0: -15.65, x1: -7.55, zF: 8.7, zB: -10.55, eave: 14.2, rise: 5.2, plaster: "plasterKohout" };
const MIKES: House = { name: "mikes house", x0: -7.6, x1: 1.6, zF: 8.45, zB: -10.45, eave: 15.2, rise: 8.0, plaster: "plasterMikes" };
const KRIZ: House = { name: "kriz house", x0: 1.55, x1: 14.45, zF: 8.6, zB: -10.6, eave: 16.6, rise: 8.4, plaster: "plasterKriz" };

/** The house's walls up to the eave (no top: the roof covers it). */
function houseBlock(m: MeshBuilder, h: House, y0 = 0): void {
  span(m, h.plaster, h.x0, h.x1, y0, h.eave, h.zB, h.zF, false);
}

/** A tiled roof, ridge along X: two plates and the plaster gables under them. */
function roofAlongX(m: MeshBuilder, h: House, gables: boolean, oh = 0.5): void {
  m.scope("roof", () => {
    const zc = (h.zF + h.zB) / 2;
    const yR = h.eave + h.rise;
    const kF = h.rise / (h.zF - zc);
    const yEf = h.eave - oh * kF;
    const a = h.x0 - 0.05;
    const b = h.x1 + 0.05;
    m.slab("tile", [[a, yEf, h.zF + oh], [b, yEf, h.zF + oh], [b, yR, zc], [a, yR, zc]], [0, -0.28, 0]);
    m.slab("tile", [[a, yEf, h.zB - oh], [b, yEf, h.zB - oh], [b, yR, zc], [a, yR, zc]], [0, -0.28, 0]);
    beam(m, "tile", [a, yR + 0.02, zc], [b, yR + 0.02, zc], 0.3, 0.24);
    if (gables) {
      for (const [x, s] of [[h.x0 + 0.03, 1], [h.x1 - 0.03, -1]] as Array<[number, number]>) {
        m.slab(h.plaster, [[x, h.eave, h.zB], [x, h.eave, h.zF], [x, yR - 0.12, zc]], [s * 0.3, 0, 0]);
      }
    }
  });
}

/** A string course across a front: a trim band d out of the wall. */
function band(m: MeshBuilder, f: Face, u0: number, u1: number, y0: number, y1: number, d = 0.14, mat = "trim"): void {
  fbox(m, mat, f, u0 + 0.012, u1 - 0.012, y0, y1, -0.05, d);
}

/** The eaves cornice of a house front (and its back). */
function cornice(m: MeshBuilder, h: House): void {
  m.scope("cornice", () => {
    band(m, faceZ(h.zF, 1), h.x0, h.x1, h.eave - 0.55, h.eave - 0.25, 0.22);
    band(m, faceZ(h.zF, 1), h.x0, h.x1, h.eave - 0.25, h.eave, 0.4);
    band(m, faceZ(h.zB, -1), h.x0, h.x1, h.eave - 0.3, h.eave, 0.3);
  });
}

/** A chimney on the roof at (x, z). */
function chimney(m: MeshBuilder, x: number, z: number, y0: number, y1: number, mat: string): void {
  span(m, mat, x - 0.45, x + 0.45, y0, y1, z - 0.35, z + 0.35, false);
  cube(m, "stoneDark", x - 0.55, x + 0.55, y1, y1 + 0.2, z - 0.45, z + 0.45);
}

/** The courtyard windows of a house: plain panes in rows. */
function backWindows(m: MeshBuilder, h: House, xs: number[], rows: Array<[number, number]>): void {
  m.scope("courtyard windows", () => {
    const f = faceZ(h.zB, -1);
    for (const [y0, y1] of rows) for (const x of xs) sashWindow(m, f, x, y0, y1, 1.1, "none", true);
  });
}

/** Gabled dormers on the front slope of a house roofed along X, at the xs. */
function dormers(m: MeshBuilder, h: House, xs: number[], lift: number, tall: number): void {
  m.scope("dormers", () => {
    const zc = (h.zF + h.zB) / 2;
    const k = h.rise / (h.zF - zc);
    for (const x of xs) {
      const y0 = h.eave + lift;
      const y1 = y0 + tall;
      const zd = h.zF - (y0 - h.eave) / k + 0.3;
      span(m, h.plaster, x - 0.85, x + 0.85, y0 - 0.6, y1, zc, zd, false);
      const fd = faceZ(zd, 1);
      sashWindow(m, fd, x, y0 + 0.3, y1 - 0.3, 0.9);
      fpoly(m, h.plaster, fd, [[x - 0.85, y1], [x + 0.85, y1], [x, y1 + 0.9]], -0.3, 0);
      m.slab("tile", [[x - 1.05, y1 - 0.12, zd + 0.3], [x, y1 + 1.02, zd + 0.3], [x, y1 + 1.02, zc + 0.1], [x - 1.05, y1 - 0.12, zc + 0.1]], [0, -0.18, 0]);
      m.slab("tile", [[x + 1.05, y1 - 0.12, zd + 0.3], [x, y1 + 1.02, zd + 0.3], [x, y1 + 1.02, zc + 0.1], [x + 1.05, y1 - 0.12, zc + 0.1]], [0, -0.18, 0]);
    }
  });
}

// --- the houses ----------------------------------------------------------------------

function houseAtTheMinute(m: MeshBuilder): void {
  const h = MINUTE;
  m.scope(h.name, () => {
    const AR = 4.8; // the arcade's ceiling
    const back = h.zF - 3.0; // the arcade's back wall
    const f = faceZ(h.zF, 1);
    m.scope("walls", () => {
      houseBlock(m, h, AR);
      span(m, h.plaster, h.x0, h.x1, 0, AR + 0.05, h.zB, back, false);
      m.cap(h.plaster, rect(h.x1 - h.x0, h.zF - back, (h.x0 + h.x1) / 2, (h.zF + back) / 2), AR, false);
      // the arcade's closed ends
      span(m, h.plaster, h.x0, h.x0 + 0.6, 0, AR + 0.05, back - 0.05, h.zF - 0.55, false);
      span(m, h.plaster, h.x1 - 0.6, h.x1, 0, AR + 0.05, back - 0.05, h.zF - 0.55, false);
    });
    m.scope("arcade", () => {
      const piers: Array<[number, number]> = [[-28.0, -27.2], [-24.133, -23.333], [-20.267, -19.467], [-16.4, -15.6]];
      for (const [a, b] of piers) {
        fbox(m, h.plaster, f, a, b, 0, AR + 0.05, -0.6, 0.05);
        fbox(m, "stoneDark", f, a - 0.06, b + 0.06, 0, 0.45, -0.66, 0.11);
      }
      for (let i = 0; i + 1 < piers.length; i++) {
        const a = piers[i]![1];
        const b = piers[i + 1]![0];
        spandrel(m, h.plaster, f, roundArc(a, b, 3.0, 8), AR + 0.05, -0.6, 0.05);
        // the back wall's door and windows
        const fb = faceZ(back, 1);
        const c = (a + b) / 2;
        if (i === 1) fpoly(m, "windowGlass", fb, roundHead(c - 0.7, c + 0.7, 0, 2.3, 5), -0.05, 0.08);
        else sashWindow(m, fb, c, 1.2, 3.0, 1.2, "none", true);
      }
    });
    m.scope("front windows", () => {
      const xs = [-26.2, -23.2, -20.2, -17.3];
      for (const x of xs) {
        sashWindow(m, f, x, 5.9, 8.4, 1.25, "triangle");
        sashWindow(m, f, x, 9.7, 11.9, 1.25, "cornice");
      }
      band(m, f, h.x0, h.x1, AR + 0.02, AR + 0.32, 0.18);
    });
    m.scope("sgraffito", () => {
      // dark figure panels between the windows and friezes under the sills and the cornice
      const S = "stoneDark";
      const gaps = [-27.4, -24.7, -21.7, -18.75, -16.3];
      for (const g of gaps) {
        const w = g === -27.4 || g === -16.3 ? 0.7 : 1.3;
        fbox(m, S, f, g - w / 2, g + w / 2, 6.0, 8.3, 0, 0.03);
        fbox(m, S, f, g - w / 2, g + w / 2, 9.8, 11.8, 0, 0.03);
      }
      for (const y of [5.45, 9.1, 12.05]) {
        for (let k = 0; k < 14; k++) {
          const x = -27.6 + k * 0.88;
          fbox(m, S, f, x, x + 0.5, y, y + 0.3, 0, 0.03);
        }
      }
      // the west end
      const fw = faceX(h.x0, -1);
      for (const z of [-7.5, -3.5, 0.5, 4.5]) {
        sashWindow(m, fw, z, 5.9, 8.2, 1.15, "none", false);
        sashWindow(m, fw, z, 9.6, 11.8, 1.15, "none", false);
        fbox(m, S, fw, z + 1.0, z + 2.0, 6.0, 11.8, 0, 0.03);
      }
      for (const z of [-7.5, -3.5, 0.5]) sashWindow(m, fw, z, 1.3, 3.4, 1.15, "none", true);
    });
    cornice(m, h);
    roofAlongX(m, h, true);
    backWindows(m, h, [-26.0, -22.0, -18.0], [[1.4, 3.4], [6.0, 8.2], [9.6, 11.8]]);
    chimney(m, -24.0, -3.5, 16.0, 21.4, h.plaster);
    chimney(m, -18.5, -5.0, 16.0, 21.4, h.plaster);
  });
}

function houseAtTheRooster(m: MeshBuilder): void {
  const h = KOHOUT;
  m.scope(h.name, () => {
    const f = faceZ(h.zF, 1);
    houseBlock(m, h);
    m.scope("windows", () => {
      for (const x of [-13.55, -9.65]) {
        sashWindow(m, f, x, 5.4, 7.9, 1.3, "segment");
        sashWindow(m, f, x, 8.9, 11.0, 1.3, "cornice");
        sashWindow(m, f, x, 11.8, 13.2, 1.2);
      }
      // the ground floor: a round-headed doorway and a shop window
      fpoly(m, "windowGlass", f, roundHead(-14.2, -12.6, 0, 2.6, 6), -0.05, 0.06);
      arcBand(m, "stone", f, roundArc(-14.2, -12.6, 2.6, 6), roundArc(-14.5, -12.3, 2.6, 6), -0.05, 0.25);
      fbox(m, "stone", f, -14.5, -14.2, 0, 2.61, -0.05, 0.25);
      fbox(m, "stone", f, -12.6, -12.3, 0, 2.61, -0.05, 0.25);
      sashWindow(m, f, -9.6, 1.2, 3.6, 2.0);
      band(m, f, h.x0, h.x1, 0, 0.6, 0.12, "stone");
      band(m, f, h.x0, h.x1, 4.5, 4.8, 0.16);
    });
    cornice(m, h);
    m.scope("roof", () => {
      // ridge along Z: a front gable on the square
      const xc = (h.x0 + h.x1) / 2;
      const yR = h.eave + h.rise;
      const a = h.x0 + 0.03;
      const b = h.x1 - 0.03;
      m.slab("tile", [[a, h.eave, h.zB - 0.4], [a, h.eave, h.zF + 0.45], [xc, yR, h.zF + 0.45], [xc, yR, h.zB - 0.4]], [0, -0.28, 0]);
      m.slab("tile", [[b, h.eave, h.zB - 0.4], [b, h.eave, h.zF + 0.45], [xc, yR, h.zF + 0.45], [xc, yR, h.zB - 0.4]], [0, -0.28, 0]);
      beam(m, "tile", [xc, yR + 0.02, h.zB - 0.4], [xc, yR + 0.02, h.zF + 0.45], 0.3, 0.24);
      const fg = faceZ(h.zF, 1);
      fpoly(m, h.plaster, fg, [[h.x0, h.eave], [h.x1, h.eave], [xc, yR - 0.12]], -0.3, 0);
      fpoly(m, h.plaster, faceZ(h.zB, -1), [[h.x0, h.eave], [h.x1, h.eave], [xc, yR - 0.12]], -0.3, 0);
      fpoly(m, "windowGlass", fg, roundHead(xc - 0.45, xc + 0.45, h.eave + 1.0, h.eave + 2.2, 5), 0, 0.06);
      fbox(m, "trim", fg, xc - 0.65, xc + 0.65, h.eave + 0.75, h.eave + 1.0, 0, 0.18);
      // obelisks at the foot of the gable
      for (const x of [h.x0 + 0.45, h.x1 - 0.45]) {
        const c = P(fg, x, 0, 0.1);
        m.prism("trim", rect(0.4, 0.4, c[0], c[2]), h.eave, h.eave + 0.4);
        m.spire("trim", rect(0.3, 0.3, c[0], c[2]), h.eave + 0.4, h.eave + 1.6);
      }
      // the gilt rooster on the gable
      fbox(m, "gilt", fg, xc - 0.12, xc + 0.12, yR - 0.2, yR + 0.9, 0.1, 0.3);
      fpoly(m, "gilt", fg, [[xc - 0.35, yR + 0.9], [xc + 0.3, yR + 0.9], [xc + 0.35, yR + 1.35], [xc - 0.1, yR + 1.6]], 0.12, 0.28);
    });
    backWindows(m, h, [-13.5, -9.7], [[1.4, 3.4], [5.4, 7.6], [8.9, 11.0], [11.8, 13.2]]);
  });
}

function mikesHouse(m: MeshBuilder): void {
  const h = MIKES;
  m.scope(h.name, () => {
    const f = faceZ(h.zF, 1);
    houseBlock(m, h);
    m.scope("windows", () => {
      const xs = [-5.55, -3.0, -0.45];
      for (const x of xs) {
        sashWindow(m, f, x, 5.6, 8.3, 1.35, "triangle");
        sashWindow(m, f, x, 9.4, 11.7, 1.35, "cornice");
        sashWindow(m, f, x, 12.5, 14.1, 1.25);
      }
      // the ground floor: two round-headed arches of the old vaulted shops
      for (const x of [-5.3, -0.7]) {
        fpoly(m, "windowGlass", f, roundHead(x - 1.0, x + 1.0, 0.6, 2.6, 6), -0.05, 0.06);
        arcBand(m, "trim", f, roundArc(x - 1.0, x + 1.0, 2.6, 6), roundArc(x - 1.3, x + 1.3, 2.6, 6), -0.05, 0.2);
      }
      band(m, f, h.x0, h.x1, 0, 0.6, 0.12, "stone");
      band(m, f, h.x0, h.x1, 4.6, 4.95, 0.18);
      band(m, f, h.x0, h.x1, 8.95, 9.1, 0.12);
      // rusticated corners
      for (const [a, b] of [[h.x0 + 0.02, h.x0 + 0.55], [h.x1 - 0.55, h.x1 - 0.05]] as Array<[number, number]>) fbox(m, "trim", f, a, b, 0.6, h.eave - 0.55, -0.05, 0.08);
    });
    cornice(m, h);
    roofAlongX(m, h, true);
    dormers(m, h, [-4.8, -1.2], 1.3, 1.9);
    backWindows(m, h, [-5.5, -3.0, -0.5], [[1.4, 3.4], [5.6, 7.8], [9.4, 11.4], [12.5, 14.0]]);
    chimney(m, -2.0, -6.5, 18.3, 23.6, h.plaster);
    chimney(m, -6.2, 3.5, 19.0, 23.6, h.plaster);
  });
}

function krizHouse(m: MeshBuilder): void {
  const h = KRIZ;
  m.scope(h.name, () => {
    const f = faceZ(h.zF, 1);
    houseBlock(m, h);
    m.scope("windows", () => {
      for (const x of [3.3, 6.6, 9.9, 13.0]) {
        sashWindow(m, f, x, 10.6, 13.0, 1.4, "cornice");
        sashWindow(m, f, x, 13.9, 15.4, 1.3);
      }
      for (const x of [3.3, 13.0]) sashWindow(m, f, x, 6.2, 9.0, 1.4, "triangle");
      sashWindow(m, f, 6.0, 1.3, 3.6, 1.6);
      sashWindow(m, f, 8.6, 1.3, 3.6, 1.6);
      band(m, f, h.x0, h.x1, 0, 0.6, 0.12, "stone");
      band(m, f, h.x0, h.x1, 4.6, 4.95, 0.18);
      band(m, f, h.x0, h.x1, 9.72, 9.92, 0.12);
    });
    m.scope("renaissance window", () => {
      // the big three-light window of 1520 with PRAGA CAPUT REGNI over it
      const c = 8.25;
      const u0 = c - 2.0;
      const u1 = c + 2.0;
      fbox(m, "windowGlass", f, u0, u1, 6.0, 9.4, -0.05, 0.04);
      for (const x of [u0 + 1.33, u1 - 1.33]) fbox(m, "stone", f, x - 0.1, x + 0.1, 5.95, 9.45, -0.05, 0.16);
      fbox(m, "stone", f, u0 + 0.01, u1 - 0.01, 8.1, 8.25, -0.05, 0.16);
      fbox(m, "stone", f, u0 - 0.5, u0, 5.7, 9.4, -0.05, 0.32);
      fbox(m, "stone", f, u1, u1 + 0.5, 5.7, 9.4, -0.05, 0.32);
      fbox(m, "stone", f, u0 - 0.6, u1 + 0.6, 5.45, 6.0, -0.05, 0.36);
      fbox(m, "stone", f, u0 - 0.6, u1 + 0.6, 9.4, 9.75, -0.05, 0.4);
      // the inscription band over it, gilt letters standing proud
      fbox(m, "stoneDark", f, u0 - 0.4, u1 + 0.4, 9.75, 10.35, -0.05, 0.3);
      const letters = 15;
      for (let k = 0; k < letters; k++) {
        if (k === 5 || k === 11) continue; // the word spaces
        const x = u0 - 0.15 + k * 0.33;
        fbox(m, "gilt", f, x, x + 0.2, 9.88, 10.22, 0.28, 0.33);
      }
    });
    m.scope("portal", () => {
      // the late Gothic entrance portal next to the tower
      const c = 11.6;
      fpoly(m, "windowGlass", f, lancet(c - 0.9, c + 0.9, 0, 2.6, 4), -0.05, 0.06);
      arcBand(m, "stone", f, pointedArc(c - 0.9, c + 0.9, 2.6, 4), pointedArc(c - 1.35, c + 1.35, 2.6, 4), -0.05, 0.4);
      fbox(m, "stone", f, c - 1.35, c - 0.9, 0, 2.61, -0.05, 0.4);
      fbox(m, "stone", f, c + 0.9, c + 1.35, 0, 2.61, -0.05, 0.4);
      fpoly(m, "stone", f, [[c - 0.12, 2.6 + 1.6 * 0.866], [c + 0.12, 2.6 + 1.6 * 0.866], [c + 0.12, 5.2], [c - 0.12, 5.2]], -0.05, 0.42);
    });
    cornice(m, h);
    roofAlongX(m, h, true);
    dormers(m, h, [4.0, 8.25, 12.0], 1.4, 2.2);
    backWindows(m, h, [3.5, 7.0, 10.5], [[1.4, 3.4], [5.8, 8.2], [10.6, 12.8], [13.9, 15.3]]);
    chimney(m, 5.5, -4.5, 21.5, 26.6, h.plaster);
    chimney(m, 10.5, -5.5, 21.0, 26.6, h.plaster);
  });
}

// --- the tower -------------------------------------------------------------------------

/** A clock dial on face f (axis-aligned) centred at (uc, yc): white face, dark ring, gilt hands. */
function clockDial(m: MeshBuilder, f: Face, uc: number, yc: number, r: number): void {
  m.scope("clock", () => {
    const ring = ngon(24, r, 0, 0, 0).map(([a, b]): [number, number] => [uc + a, yc + b]);
    fpoly(m, "trim", f, ring, -0.05, 0.1);
    const axis = f.nz !== 0 ? "z" : "x";
    const a0 = f.nz !== 0 ? f.oz : f.ox;
    const s = f.nz !== 0 ? f.nz : f.nx;
    m.tube("stoneDark", axis, uc, yc, r + 0.22, r - 0.08, a0, a0 + s * 0.24, 24);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const pu = uc + Math.cos(a) * r * 0.82;
      const py = yc + Math.sin(a) * r * 0.82;
      fbox(m, "stoneDark", f, pu - 0.07, pu + 0.07, py - 0.07, py + 0.07, 0.1, 0.13);
    }
    beam(m, "gilt", P(f, uc, yc, 0.12), P(f, uc + r * 0.45, yc + r * 0.45, 0.12), 0.1, 0.05, [f.nx, 0, f.nz]);
    beam(m, "gilt", P(f, uc, yc, 0.16), P(f, uc - r * 0.1, yc + r * 0.75, 0.16), 0.07, 0.05, [f.nx, 0, f.nz]);
  });
}

function towerShaft(m: MeshBuilder): void {
  m.scope("shaft", () => {
    span(m, "stone", TX0 - 0.3, TX1 + 0.3, 0, 1.0, TZ0 - 0.3, TZ1 + 0.3);
    span(m, "stone", TX0, TX1, 1.0, SHAFT_TOP, TZ0, TZ1, false);
    for (const y of [17.2, 33.4]) cube(m, "stone", TX0 - 0.18, TX1 + 0.18, y, y + 0.4, TZ0 - 0.18, TZ1 + 0.18);
    // corner buttresses up the lower half
    for (const x of [TX0, TX1]) for (const z of [TZ0, TZ1]) {
      if (x === TX0 && z === TZ1) continue; // the Kriz house stands there
      span(m, "stone", x - 0.55, x + 0.55, 0, 16.0, z - 0.55, z + 0.55, false);
      m.loft("stone", rect(1.1, 1.1, x, z), 16.0, rect(0.4, 0.4, x, z), 17.4, false);
      const px = x + (x === TX0 ? -0.35 : 0.35);
      const pz = z + (z === TZ0 ? -0.35 : 0.35);
      m.prism("stone", rect(0.45, 0.45, px, pz), 15.2, 16.4, true);
      m.spire("stone", rect(0.45, 0.45, px, pz), 16.4, 18.4);
    }
  });
  m.scope("tower windows", () => {
    const S = faceZ(TZ1, 1);
    const N = faceZ(TZ0, -1);
    const E = faceX(TX1, 1);
    const W = faceX(TX0, -1);
    gothicWindow(m, S, TXC, 24.5, 28.0, 1.5);
    gothicWindow(m, S, TXC, 35.5, 39.0, 1.5);
    gothicWindow(m, N, TXC, 26.0, 29.5, 1.5);
    gothicWindow(m, N, TXC, 35.5, 39.0, 1.5);
    gothicWindow(m, E, TZC, 24.5, 28.0, 1.5);
    gothicWindow(m, E, TZC, 35.5, 39.0, 1.5);
    gothicWindow(m, W, TZC, 28.0, 31.0, 1.5);
    gothicWindow(m, W, TZC, 35.5, 39.0, 1.5);
    gothicWindow(m, N, TXC - 2.5, 4.0, 6.5, 1.2, "stoneDark", false);
    gothicWindow(m, N, TXC + 2.5, 11.0, 13.5, 1.2, "stoneDark", false);
    for (const [f, c] of [[S, TXC], [E, TZC], [W, TZC]] as Array<[Face, number]>) clockDial(m, f, c, 45.2, 1.55);
    // the coats of arms of the lands on the south and east faces
    shield(m, S, TX0 + 1.4, 18.6, 0.9, "plasterMikes", "trim");
    shield(m, S, TX1 - 1.2, 18.6, 0.9, "gilt", "stoneDark");
    shield(m, E, TZ0 + 1.3, 20.8, 0.9, "plasterMikes", "trim");
    shield(m, E, TZ1 - 1.0, 20.8, 0.9, "orlojBlue", "gilt");
    shield(m, E, TZC + 0.4, 6.0, 1.1, "plasterMikes", "trim");
    // the window with its balcony west of the Orloj
    const bu = TX0 + 1.75;
    sashWindow(m, S, bu, 7.6, 10.0, 1.2, "cornice", false, "stoneDark");
    fbox(m, "stoneDark", S, bu - 1.0, bu + 1.0, 7.0, 7.3, -0.05, 0.75);
    for (const [a, b] of [[bu - 0.95, bu + 0.95]] as Array<[number, number]>) {
      beam(m, "stoneDark", P(S, a, 8.2, 0.7), P(S, b, 8.2, 0.7), 0.06, 0.06);
      for (let k = 0; k <= 6; k++) {
        const u = a + ((b - a) * k) / 6;
        m.rod("stoneDark", P(S, u, 7.3, 0.7), P(S, u, 8.2, 0.7), 0.025, 4);
      }
    }
    // the statues on consoles by the chapel oriel
    for (const z of [TZ0 + 0.9, TZ1 - 0.6]) statue(m, "stone", "stone", TX1 + 0.28, 12.2, z, 1.6);
  });
}

function towerCrown(m: MeshBuilder): void {
  m.scope("crown", () => {
    m.scope("corbel table", () => {
      cube(m, "stone", TX0 - 0.4, TX1 + 0.4, SHAFT_TOP, 50.4, TZ0 - 0.4, TZ1 + 0.4);
      const sides: Array<[Face, number, number]> = [
        [faceZ(TZ1, 1), TX0, TX1], [faceZ(TZ0, -1), TX0, TX1], [faceX(TX1, 1), TZ0, TZ1], [faceX(TX0, -1), TZ0, TZ1],
      ];
      for (const [f, a, b] of sides) {
        const n = 12;
        for (let k = 1; k < n; k++) {
          const u = a + ((b - a) * k) / n;
          fpoly(m, "stone", f, [[u - 0.14, SHAFT_TOP + 0.01], [u + 0.14, SHAFT_TOP + 0.01], [u + 0.14, 48.6]], -0.05, 0.32);
          fbox(m, "stone", f, u - 0.14, u + 0.14, 48.6, SHAFT_TOP + 0.01, -0.05, 0.32);
        }
      }
    });
    m.scope("blind arcade", () => {
      // a frieze of small pointed blind arches over the clocks
      const sides: Array<[Face, number, number]> = [
        [faceZ(TZ1, 1), TX0, TX1], [faceZ(TZ0, -1), TX0, TX1], [faceX(TX1, 1), TZ0, TZ1], [faceX(TX0, -1), TZ0, TZ1],
      ];
      for (const [f, a, b] of sides) {
        const n = 9;
        const step = (b - a - 0.6) / n;
        for (let k = 0; k < n; k++) {
          const u0 = a + 0.3 + k * step + 0.08;
          const u1 = u0 + step - 0.16;
          fpoly(m, "stoneDark", f, lancet(u0, u1, 47.3, 48.0, 2), -0.05, 0.03);
          arcBand(m, "stone", f, pointedArc(u0, u1, 48.0, 2), pointedArc(u0 - 0.08, u1 + 0.08, 48.0, 2), -0.05, 0.12);
        }
        fbox(m, "stone", f, a + 0.2, b - 0.2, 47.1, 47.3, -0.05, 0.14);
      }
    });
    m.scope("gallery", () => {
      const g = 0.95;
      cube(m, "stone", TX0 - g, TX1 + g, 50.4, 50.9, TZ0 - g, TZ1 + g);
      const e = 0.82; // the parapet's line outside the shaft
      const x0 = TX0 - e;
      const x1 = TX1 + e;
      const z0 = TZ0 - e;
      const z1 = TZ1 + e;
      // a low solid course, tracery posts and the coping
      for (const [a, b, c, d] of [[x0, x1, z1 - 0.1, z1 + 0.1], [x0, x1, z0 - 0.1, z0 + 0.1], [x1 - 0.1, x1 + 0.1, z0, z1], [x0 - 0.1, x0 + 0.1, z0, z1]] as Array<[number, number, number, number]>) {
        span(m, "stone", a, b, 50.9, 51.3, c, d, false);
        cube(m, "stone", a - 0.04, b + 0.04, 52.1, 52.35, c - 0.04, d + 0.04);
      }
      const n = 16;
      for (let k = 1; k < n; k++) {
        const x = x0 + ((x1 - x0) * k) / n;
        const z = z0 + ((z1 - z0) * k) / n;
        span(m, "stone", x - 0.09, x + 0.09, 51.3, 52.1, z1 - 0.09, z1 + 0.09, false);
        span(m, "stone", x - 0.09, x + 0.09, 51.3, 52.1, z0 - 0.09, z0 + 0.09, false);
        span(m, "stone", x1 - 0.09, x1 + 0.09, 51.3, 52.1, z - 0.09, z + 0.09, false);
        span(m, "stone", x0 - 0.09, x0 + 0.09, 51.3, 52.1, z - 0.09, z + 0.09, false);
      }
      // a quatrefoil lozenge in every bay of the tracery
      const lozenge = (f: Face, u: number, w: number): void => fpoly(m, "stone", f, [[u, 51.4], [u + w, 51.7], [u, 52.0], [u - w, 51.7]], -0.04, 0.04);
      for (let k = 0; k < n; k++) {
        const x = x0 + ((x1 - x0) * (k + 0.5)) / n;
        const z = z0 + ((z1 - z0) * (k + 0.5)) / n;
        lozenge(faceZ(z1, 1), x, 0.24);
        lozenge(faceZ(z0, -1), x, 0.24);
        lozenge(faceX(x1, 1), z, 0.24);
        lozenge(faceX(x0, -1), z, 0.24);
      }
    });
    m.scope("corner turrets", () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const cx = (sx > 0 ? TX1 : TX0) + sx * 0.35;
        const cz = (sz > 0 ? TZ1 : TZ0) + sz * 0.35;
        const r = 1.15;
        const oct = (rr: number): Ring => ngon(8, rr, Math.PI / 8, cx, cz);
        m.loft("stone", oct(0.3), 46.8, oct(r), 50.4, false);
        m.prism("stone", oct(r), 50.4, 55.2, false);
        m.prism("stone", oct(r + 0.15), 55.2, 55.5);
        m.spire("slate", oct(r + 0.05), 55.5, 62.4);
        m.rod("gilt", [cx, 62.2, cz], [cx, 63.1, cz], 0.06, 6);
        m.prism("gilt", ngon(6, 0.16, 0, cx, cz), 62.7, 62.95);
        const ap = r * Math.cos(Math.PI / 8);
        for (const [nx, nz] of [[sx, 0], [0, sz], [sx * Math.SQRT1_2, sz * Math.SQRT1_2]] as Array<[number, number]>) {
          const f = faceDir(cx, cz, nx, nz, ap);
          fpoly(m, "windowGlass", f, lancet(-0.22, 0.22, 51.4, 53.4, 2), -0.05, 0.04);
        }
      }
    });
    m.scope("roof", () => {
      m.loft("slate", rect(10.7, 10.7, TXC, TZC), 50.9, rect(8.6, 8.6, TXC, TZC), 54.2, false);
      m.loft("slate", rect(8.6, 8.6, TXC, TZC), 54.2, rect(2.4, 0.5, TXC, TZC), 65.7);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        beam(m, "stoneDark", [TXC + sx * 4.3, 54.25, TZC + sz * 4.3], [TXC + sx * 1.2, 65.75, TZC + sz * 0.25], 0.16, 0.12, [sx, 1, sz]);
      }
      for (const s of [-1, 1]) {
        const x = TXC + s * 1.0;
        m.rod("gilt", [x, 65.5, TZC], [x, 68.7, TZC], 0.07, 6);
        m.prism("gilt", ngon(8, 0.24, Math.PI / 8, x, TZC), 68.5, 68.95);
        m.spire("gilt", ngon(8, 0.24, Math.PI / 8, x, TZC), 68.95, 69.5);
      }
    });
    m.scope("roof dormers", () => {
      // a larger row over the gallery and a small one higher up: [half extent, y0, y1, half width, depth]
      const rows: Array<[number, number, number, number, number]> = [[4.3, 54.6, 56.9, 0.75, 2.4], [3.15, 58.8, 60.2, 0.42, 1.5]];
      for (const [e, y0, y1, hw, dep] of rows) {
        const fs: Array<[Face, number]> = [
          [faceZ(TZC + e, 1), TXC], [faceZ(TZC - e, -1), TXC], [faceX(TXC + e, 1), TZC], [faceX(TXC - e, -1), TZC],
        ];
        const gh = hw * 1.13;
        for (const [f, c] of fs) {
          fbox(m, "stone", f, c - hw, c + hw, y0, y1, -dep, 0);
          fpoly(m, "stone", f, [[c - hw, y1], [c + hw, y1], [c, y1 + gh]], -0.2, 0);
          fpoly(m, "windowGlass", f, roundHead(c - hw * 0.5, c + hw * 0.5, y0 + hw * 0.6, y1 - hw, 5), 0, 0.05);
          for (const s of [-1, 1]) {
            m.slab("slate", [P(f, c + s * (hw + 0.2), y1 - 0.15, 0.2), P(f, c, y1 + gh + 0.12, 0.2), P(f, c, y1 + gh + 0.12, -dep - 0.2), P(f, c + s * (hw + 0.2), y1 - 0.15, -dep - 0.2)], [0, -0.15, 0]);
          }
        }
      }
    });
  });
}

/** The astronomical clock on the tower's south face. */
function orloj(m: MeshBuilder): void {
  const f = faceZ(TZ1, 1);
  const z = TZ1;
  m.scope("orloj", () => {
    m.scope("frame", () => {
      fbox(m, "stoneDark", f, OX - 3.1, OX + 3.1, 1.8, 16.2, -0.05, 0.2);
      for (const s of [-1, 1]) {
        const u = OX + s * 3.35;
        fbox(m, "stoneDark", f, u - 0.22, u + 0.22, 0.6, 17.2, -0.05, 0.75);
        // the Gothic pinnacles on the pilasters
        const c = P(f, u, 0, 0.35);
        m.spire("stoneDark", rect(0.44, 0.44, c[0], c[2]), 17.2, 19.0);
        const c2 = P(f, OX + s * 1.6, 0, 0.42);
        span(m, "stoneDark", c2[0] - 0.14, c2[0] + 0.14, 8.15, 13.6, c2[2] - 0.22, c2[2] + 0.22);
      }
      // the ledge between the dials, carved with foliage
      fbox(m, "stoneDark", f, OX - 3.15, OX + 3.15, 7.65, 8.15, -0.05, 0.85);
      for (let k = 0; k < 9; k++) {
        const u = OX - 2.8 + k * 0.7;
        fpoly(m, "stoneDark", f, [[u - 0.22, 7.65], [u + 0.22, 7.65], [u, 7.2]], 0.2, 0.75);
      }
      fbox(m, "stoneDark", f, OX - 3.15, OX + 3.15, 13.15, 13.5, -0.05, 0.7);
    });
    // the parts above the ledge stand 1.6 m higher than drawn
    const up = (dy: number, fn: () => void): void => m.moved((p) => [p[0], p[1] + dy, p[2]], fn);
    up(1.6, () => m.scope("astronomical dial", () => {
      const yc = 9.35;
      const R = 2.0;
      const disc = (r: number, n: number, dx = 0, dy = 0): Array<[number, number]> => ngon(n, r, 0, 0, 0).map(([a, b]): [number, number] => [OX + dx + a, yc + dy + b]);
      fpoly(m, "orlojBlue", f, disc(R, 48), 0.1, 0.3);
      // the dark night below the horizon
      const night: Array<[number, number]> = [];
      const hy = -0.55;
      const a0 = Math.asin(hy / (R - 0.05));
      for (let k = 0; k <= 10; k++) {
        const a = Math.PI - a0 + (k / 10) * (Math.PI + 2 * a0);
        night.push([OX + (R - 0.05) * Math.cos(a), yc + (R - 0.05) * Math.sin(a)]);
      }
      fpoly(m, "stoneDark", f, night, 0.24, 0.34);
      // the dawn and dusk band just above the horizon
      fbox(m, "gilt", f, OX - 1.75, OX + 1.75, yc + hy, yc + hy + 0.06, 0.25, 0.35);
      m.tube("gilt", "z", OX, yc, R + 0.12, R - 0.22, z + 0.25, z + 0.55, 48);
      m.tube("stoneDark", "z", OX, yc, R + 0.45, R + 0.1, z + 0.15, z + 0.48, 48);
      m.tube("gilt", "z", OX, yc, R * 0.66, R * 0.62, z + 0.3, z + 0.42, 32);
      // the zodiac ring, off centre
      m.tube("gilt", "z", OX, yc + 0.5, 1.25, 1.06, z + 0.42, z + 0.6, 32);
      m.tube("gilt", "z", OX, yc + 0.5, 0.95, 0.9, z + 0.42, z + 0.52, 24);
      // the hour numerals round the rim
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const u = OX + Math.cos(a) * (R - 0.4);
        const y = yc + Math.sin(a) * (R - 0.4);
        fbox(m, "gilt", f, u - 0.06, u + 0.06, y - 0.09, y + 0.09, 0.3, 0.38);
      }
      // the hands: the sun, the moon and the star hand, and the hub
      const hub = P(f, OX, yc, 0.62);
      const at = (a: number, r: number, d: number): Vec3 => P(f, OX + Math.cos(a) * r, yc + Math.sin(a) * r, d);
      const sunA = 2.2;
      beam(m, "gilt", hub, at(sunA, R * 0.98, 0.62), 0.09, 0.05, [0, 0, 1]);
      fpoly(m, "gilt", f, ngon(10, 0.22, 0, 0, 0).map(([a, b]): [number, number] => [OX + Math.cos(sunA) * 1.3 + a, yc + Math.sin(sunA) * 1.3 + b]), 0.6, 0.7);
      const moonA = -0.5;
      beam(m, "gilt", P(f, OX, yc, 0.68), at(moonA, R * 0.85, 0.68), 0.06, 0.04, [0, 0, 1]);
      const mc = at(moonA, 1.0, 0.7);
      m.prism("stoneDark", ngon(8, 0.17, 0, mc[0], mc[2]).map(([x, zz]): [number, number] => [x, zz]), mc[1] - 0.17, mc[1] + 0.17);
      beam(m, "gilt", P(f, OX, yc, 0.74), at(0.9, R * 0.9, 0.74), 0.05, 0.03, [0, 0, 1]);
      m.rod("gilt", P(f, OX, yc, 0.25), P(f, OX, yc, 0.6), 0.06, 6);
      m.prism("gilt", ngon(8, 0.12, 0, OX, z + 0.62).map(([x, zz]): [number, number] => [x, zz]), yc - 0.12, yc + 0.12);
    }));
    m.scope("calendar dial", () => {
      const yc = 5.5;
      const R = 1.65;
      const disc = (r: number, n: number, cu: number, cy: number): Array<[number, number]> => ngon(n, r, 0, 0, 0).map(([a, b]): [number, number] => [cu + a, cy + b]);
      fpoly(m, "gilt", f, disc(R, 40, OX, yc), 0.12, 0.28);
      m.tube("stoneDark", "z", OX, yc, R + 0.32, R - 0.05, z + 0.15, z + 0.45, 40);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2 + Math.PI / 12;
        fpoly(m, "stoneDark", f, disc(0.27, 10, OX + Math.cos(a) * 1.08, yc + Math.sin(a) * 1.08), 0.28, 0.32);
      }
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        fpoly(m, "orlojBlue", f, disc(0.1, 6, OX + Math.cos(a) * 0.68, yc + Math.sin(a) * 0.68), 0.28, 0.31);
      }
      fpoly(m, "orlojBlue", f, disc(0.45, 16, OX, yc), 0.28, 0.33);
      fbox(m, "gilt", f, OX - 0.2, OX + 0.2, yc - 0.18, yc + 0.12, 0.33, 0.37);
      fpoly(m, "gilt", f, [[OX - 0.08, yc + 0.12], [OX + 0.08, yc + 0.12], [OX, yc + 0.3]], 0.33, 0.37);
      // the pointer at the top
      fpoly(m, "gilt", f, [[OX - 0.1, yc + R + 0.4], [OX + 0.1, yc + R + 0.4], [OX, yc + R - 0.1]], 0.3, 0.5);
    });
    m.scope("statues", () => {
      const d = z + 0.45;
      // by the astronomical dial: Vanity and the Miser, Death and the Turk
      statue(m, "plasterMikes", "trim", OX - 2.85, 9.6, d, 1.4);
      statue(m, "plasterKohout", "trim", OX - 2.3, 9.6, d, 1.4);
      statue(m, "trim", "trim", OX + 2.3, 9.6, d, 1.4);
      statue(m, "orlojBlue", "trim", OX + 2.85, 9.6, d, 1.4);
      m.rod("gilt", [OX + 2.1, 10.2, d + 0.15], [OX + 2.1, 11.4, d + 0.15], 0.03, 4); // Death's hourglass cord
      // by the calendar dial: the philosopher, the archangel Michael, the astronomer, the chronicler
      statue(m, "stone", "stone", OX - 2.85, 3.9, d, 1.5);
      statue(m, "gilt", "gilt", OX - 2.25, 3.9, d, 1.6);
      statue(m, "stone", "stone", OX + 2.25, 3.9, d, 1.5);
      statue(m, "stone", "stone", OX + 2.85, 3.9, d, 1.5);
    });
    up(1.6, () => m.scope("apostle windows", () => {
      for (const s of [-1, 1]) {
        const u = OX + s * 0.8;
        fbox(m, "windowGlass", f, u - 0.36, u + 0.36, 12.25, 13.45, 0.1, 0.28);
        fbox(m, "stone", f, u - 0.48, u + 0.48, 12.1, 12.25, 0.1, 0.4);
        fbox(m, "stone", f, u - 0.48, u + 0.48, 13.45, 13.6, 0.1, 0.4);
        fbox(m, "stone", f, u - 0.48, u - 0.36, 12.25, 13.45, 0.1, 0.36);
        fbox(m, "stone", f, u + 0.36, u + 0.48, 12.25, 13.45, 0.1, 0.36);
      }
      statue(m, "trim", "trim", OX, 12.1, z + 0.4, 1.1);
      // the cockerel's niche over them
      fbox(m, "windowGlass", f, OX - 0.18, OX + 0.18, 14.0, 14.45, 0.1, 0.25);
      fbox(m, "gilt", f, OX - 0.1, OX + 0.1, 14.05, 14.35, 0.25, 0.32);
    }));
    up(1.6, () => m.scope("canopy", () => {
      // the small bell-shaped gabled roof over the clock
      const prof: Array<[number, number]> = [[-2.55, 14.55], [-1.95, 14.85], [-1.05, 15.55], [0, 16.55], [1.05, 15.55], [1.95, 14.85], [2.55, 14.55]];
      const dOut = 1.85;
      for (let i = 0; i + 1 < prof.length; i++) {
        const [u0, y0] = prof[i]!;
        const [u1, y1] = prof[i + 1]!;
        m.slab("slate", [P(f, OX + u0, y0, dOut), P(f, OX + u1, y1, dOut), P(f, OX + u1, y1, -0.05), P(f, OX + u0, y0, -0.05)], [0, -0.14, 0]);
      }
      // the soffit's back wall and the gilt finial
      fpoly(m, "stone", f, [[OX - 2.4, 14.6], [OX + 2.4, 14.6], [OX + 1.0, 15.45], [OX, 16.35], [OX - 1.0, 15.45]].reverse() as Array<[number, number]>, -0.05, 0.2);
      m.rod("gilt", P(f, OX, 16.4, dOut - 0.1), P(f, OX, 17.4, dOut - 0.1), 0.05, 6);
      m.rod("gilt", P(f, OX + 2.45, 14.5, dOut - 0.05), P(f, OX + 2.45, 13.7, dOut - 0.05), 0.05, 4);
      m.rod("gilt", P(f, OX - 2.45, 14.5, dOut - 0.05), P(f, OX - 2.45, 13.7, dOut - 0.05), 0.05, 4);
    }));
    m.scope("door", () => {
      fpoly(m, "windowGlass", f, lancet(OX - 0.55, OX + 0.55, 0, 1.8, 3), 0.13, 0.25);
      arcBand(m, "stoneDark", f, pointedArc(OX - 0.55, OX + 0.55, 1.8, 3), pointedArc(OX - 0.8, OX + 0.8, 1.8, 3), 0.1, 0.35);
      fbox(m, "stoneDark", f, OX - 0.8, OX - 0.55, 0, 1.81, 0.1, 0.35);
      fbox(m, "stoneDark", f, OX + 0.55, OX + 0.8, 0, 1.81, 0.1, 0.35);
    });
  });
}

/** The chapel oriel on the tower's east face. */
function chapelOriel(m: MeshBuilder): void {
  m.scope("chapel oriel", () => {
    const zc = TZC + 0.4;
    const cx = TX1 - 0.25;
    const d = 2.6;
    const w = 2.3;
    const angs = [-90, -67.5, -22.5, 22.5, 67.5, 90];
    const ring = (s: number, back = 0): Ring => angs.map((g): [number, number] => {
      const a = (g * Math.PI) / 180;
      return [cx - back + d * s * Math.cos(a), zc - w * s * Math.sin(a)];
    });
    m.loft("stone", ring(0.25), 7.2, ring(1), 10.6, false);
    m.prism("stone", ring(1), 10.6, 18.8, false);
    m.prism("stone", ring(1.06, 0.12), 18.8, 19.3);
    // the corbel's moulding and the coats of arms panel course
    m.prism("stoneDark", ring(1.05, 0.1), 10.4, 10.8, true);
    // windows on the three outer facets (and the two narrow ones)
    const full = ring(1);
    for (let i = 1; i < full.length - 2; i++) {
      const a = full[i]!;
      const b = full[i + 1]!;
      const mx = (a[0] + b[0]) / 2;
      const mz = (a[1] + b[1]) / 2;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = (b[1] - a[1]) / len;
      const nz = -(b[0] - a[0]) / len;
      // outward: away from the oriel's centre
      const sgn = (mx - cx) * nx + (mz - zc) * nz > 0 ? 1 : -1;
      const f = faceDir(mx, mz, nx * sgn, nz * sgn, 0);
      const ww = Math.min(1.05, len - 0.5);
      gothicWindow(m, f, 0, 12.4, 16.3, ww, "stone", ww > 0.9);
      // a tracery gable over each facet
      fpoly(m, "stone", f, [[-len / 2 + 0.1, 19.3], [len / 2 - 0.1, 19.3], [0, 20.8]], -0.3, 0.05);
      // the coat of arms below
      fpoly(m, "plasterMikes", f, [[-0.32, 11.2], [0.32, 11.2], [0.32, 11.9], [0, 11.95], [-0.32, 11.9]], 0, 0.06);
    }
    // the octagonal spire
    const oc: [number, number] = [TX1 + 1.15, zc];
    m.prism("stone", ngon(8, 1.75, Math.PI / 8, oc[0], oc[1]), 19.3, 20.2);
    m.spire("slate", ngon(8, 1.7, Math.PI / 8, oc[0], oc[1]), 20.2, 31.0);
    m.rod("gilt", [oc[0], 30.8, oc[1]], [oc[0], 31.8, oc[1]], 0.05, 6);
    // small pinnacles at the oriel's corners
    for (const i of [1, 4]) {
      const p = full[i]!;
      m.spire("stone", rect(0.35, 0.35, p[0], p[1]), 19.3, 21.6);
    }
  });
}

export function pragueOldTownHall(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("old town hall", () => {
    m.scope("tower", () => {
      towerShaft(m);
      towerCrown(m);
      orloj(m);
      chapelOriel(m);
    });
    m.scope("houses", () => {
      krizHouse(m);
      mikesHouse(m);
      houseAtTheRooster(m);
      houseAtTheMinute(m);
    });
  });
  return m;
}

/** The distant model: the house row as blocks under their roofs, the tower, its crown and roof, the Orloj as a coloured block. */
export function pragueOldTownHallLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  for (const h of [MINUTE, KOHOUT, MIKES, KRIZ]) {
    span(m, h.plaster, h.x0, h.x1, 0, h.eave, h.zB, h.zF);
    const zc = (h.zF + h.zB) / 2;
    if (h === KOHOUT) {
      const xc = (h.x0 + h.x1) / 2;
      m.slab("tile", [[h.x0, h.eave, h.zF], [h.x1, h.eave, h.zF], [xc, h.eave + h.rise, h.zF]], [0, 0, h.zB - h.zF]);
    } else {
      m.slab("tile", [[h.x0, h.eave, h.zB], [h.x0, h.eave, h.zF], [h.x0, h.eave + h.rise, zc]], [h.x1 - h.x0, 0, 0]);
    }
  }
  lodBox(m, "stone", TXC, TZC, TX1 - TX0, TZ1 - TZ0, 0, 50.4);
  lodBox(m, "stone", TXC, TZC, TX1 - TX0 + 1.9, TZ1 - TZ0 + 1.9, 50.4, 52.3);
  lodLoft(m, "slate", rect(10.7, 10.7, TXC, TZC), 52.3, rect(2.4, 0.5, TXC, TZC), 65.7);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = (sx > 0 ? TX1 : TX0) + sx * 0.35;
    const cz = (sz > 0 ? TZ1 : TZ0) + sz * 0.35;
    lodLoft(m, "stone", ngon(4, 1.2, Math.PI / 4, cx, cz), 48.0, ngon(4, 1.2, Math.PI / 4, cx, cz), 55.5);
    m.spire("slate", ngon(4, 1.2, Math.PI / 4, cx, cz), 55.5, 62.4);
  }
  for (const s of [-1, 1]) m.spire("gilt", ngon(4, 0.25, Math.PI / 4, TXC + s * 1.0, TZC), 65.5, 69.5);
  // the Orloj: the dark frame, the blue and the gilt dial, the canopy
  lodBox(m, "stoneDark", OX, TZ1 + 0.2, 6.2, 0.4, 1.8, 16.2);
  lodBox(m, "orlojBlue", OX, TZ1 + 0.45, 4.0, 0.2, 9.0, 13.0);
  lodBox(m, "gilt", OX, TZ1 + 0.45, 3.3, 0.2, 3.85, 7.15);
  m.slab("slate", [[OX - 2.55, 16.2, TZ1], [OX + 2.55, 16.2, TZ1], [OX, 18.1, TZ1]], [0, 0, 1.85]);
  // the chapel oriel and its spire
  lodBox(m, "stone", TX1 + 1.1, TZC + 0.4, 2.2, 4.4, 7.5, 19.3);
  m.spire("slate", ngon(4, 1.7, Math.PI / 4, TX1 + 1.15, TZC + 0.4), 19.3, 31.0);
  return m;
}

export const PRAGUE_OLD_TOWN_HALL: ProceduralDesign[] = [
  {
    id: "bld-prague-old-town-hall",
    game: { plaza: { cities: ["town", "city"], layouts: ["rect"], fit: "footprint" } },
    title: "Prague Old Town Hall",
    build: pragueOldTownHall,
    buildLod: pragueOldTownHallLod,
    references: "prague-old-town-hall",
    catalog: PLAZA_CATALOG,
  },
];
