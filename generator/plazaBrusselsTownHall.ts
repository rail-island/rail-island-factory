// The Town Hall of Brussels (Hotel de Ville / Stadhuis) on the Grand-Place: the
// Gothic front of the 15th century with its open ground-floor arcade of pointed
// arches, two storeys of pointed windows between buttress pilasters carrying rows
// of statues under canopies, the crenellated parapet with its octagonal corner
// turrets, the steep slate roof with rows of small dormers, and the 96 m tower
// over the entrance arch: a square shaft, three octagonal openwork stages ringed
// by galleries and pinnacled buttress turrets, and the openwork spire with the
// gilded St Michael slaying the dragon. The wings behind (round a courtyard) are
// simplified to their walls and roof masses. See docs/models/plaza-landmarks.md.
//
// Modelled in metres, +Y up, base at y = 0, centred on the origin. The square lies
// to the south-east of the real building; here the front faces +Z. The front is
// 66 m long between its corner turrets (x), the complex about 47 m deep (z); the
// tower stands right of centre (as seen from the square), over the passage to the
// courtyard. The longer left wing has eleven arcade bays, the right wing seven.
//
// Sources: the photographs in assets/brussels-town-hall/ (SOURCES.md) and the
// Wikipedia article "Brussels Town Hall"; proportions measured from the frontal
// photograph (about 9.5 px/m), simplified.
//
// Deterministic: the same code gives the same bytes. The id is stored in the
// game's saved maps, so it is never renamed once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox, lodLoft } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  stone: { color: "#ad9e82", roughness: 0.92 },
  stoneDark: { color: "#8c7e66", roughness: 0.9 },
  stoneLight: { color: "#e8dfc8", roughness: 0.85 },
  shade: { color: "#6e6452", roughness: 0.95 },
  slate: { color: "#3b4048", metallic: 0.1, roughness: 0.75 },
  lead: { color: "#5d636b", metallic: 0.3, roughness: 0.6 },
  windowGlass: { color: "#262b33", metallic: 0.2, roughness: 0.3 },
  door: { color: "#5a3a22", roughness: 0.8 },
  gilt: { color: "#d4a937", metallic: 0.7, roughness: 0.35 },
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

/** A box given by its spans; no underside. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

/** An octagon of apothem `ap` about (cx, cz), flat faces toward +X, +Z, -X, -Z and the diagonals. */
const oct = (ap: number, cx: number, cz: number): Ring => ngon(8, ap / Math.cos(Math.PI / 8), Math.PI / 8, cx, cz);

/** A pinnacle: an octagonal shaft of apothem r from y0 to y1, then a spirelet to yTip. */
function pinnacle(m: MeshBuilder, mat: string, x: number, z: number, r: number, y0: number, y1: number, yTip: number): void {
  m.prism(mat, oct(r, x, z), y0, y1, false);
  m.spire(mat, oct(r * 1.15, x, z), y1, yTip);
  m.cap(mat, oct(r * 1.15, x, z), y1, false);
}

// --- facade frames -----------------------------------------------------------------

/**
 * A vertical wall plane: a point (ox, oz) on it, the horizontal axis u along it and
 * the outward normal n. A facade point is (u along, y up, d out of the wall).
 */
interface Face { ox: number; oz: number; ux: number; uz: number; nx: number; nz: number }
const faceZ = (z: number, s: number): Face => ({ ox: 0, oz: z, ux: 1, uz: 0, nx: 0, nz: s });
const faceX = (x: number, s: number): Face => ({ ox: x, oz: 0, ux: 0, uz: 1, nx: s, nz: 0 });
/** A wall facing (nx, nz) through (cx, cz) + n * dist; u = 0 on that point. */
const faceDir = (cx: number, cz: number, nx: number, nz: number, dist: number): Face => ({ ox: cx + nx * dist, oz: cz + nz * dist, ux: -nz, uz: nx, nx, nz });
const P = (f: Face, u: number, y: number, d: number): Vec3 => [f.ox + f.ux * u + f.nx * d, y, f.oz + f.uz * u + f.nz * d];

/** The extra burial depth of each material's hidden back face (see fpoly). */
const BURY: Record<string, number> = {
  stone: 0.01, stoneDark: 0.02, stoneLight: 0.03, shade: 0.04, slate: 0.05, lead: 0.06, windowGlass: 0.07, door: 0.08, gilt: 0.09,
};

/** A convex outline (u, y) on face f, d0..d1 out of the wall. */
function fpoly(m: MeshBuilder, mat: string, f: Face, pts: Array<[number, number]>, d0: number, d1: number): void {
  // faces buried in the wall keep a per-material depth, so two never share a plane
  if (d0 < 0) d0 -= BURY[mat] ?? 0;
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

/** A lancet outline: the sill y0, the jambs up to ys and the pointed arch. */
const lancet = (u0: number, u1: number, y0: number, ys: number, n = 3): Array<[number, number]> => [[u0, y0], ...pointedArc(u0, u1, ys, n)];

/** The wall over an arch up to yTop: vertical strips from the arc to the top line. */
function spandrel(m: MeshBuilder, mat: string, f: Face, arc: Array<[number, number]>, yTop: number, d0: number, d1: number): void {
  for (let i = 0; i + 1 < arc.length; i++) {
    const a = arc[i]!;
    const b = arc[i + 1]!;
    fpoly(m, mat, f, [a, b, [b[0], yTop], [a[0], yTop]], d0, d1);
  }
}

/** One-sided faces: the convex outline (u, y) on face f at d out of the wall, looking out. */
function fface(m: MeshBuilder, mat: string, f: Face, pts: Array<[number, number]>, d: number): void {
  const out: Vec3[] = [];
  for (let i = 1; i + 1 < pts.length; i++) out.push(P(f, pts[0]![0], pts[0]![1], d), P(f, pts[i]![0], pts[i]![1], d), P(f, pts[i + 1]![0], pts[i + 1]![1], d));
  m.facets(mat, out, [f.nx, 0, f.nz]);
}

/** A one-sided quad a, b, c, d (world points) looking along n. */
function wquad(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  m.facets(mat, [a, b, c, a, c, d], n);
}

/**
 * The wall over an arch, seen from the front only: its face at d1 from the arc
 * up to yTop and the soffit under the arc back to d0 (the back is never seen).
 */
function archWall(m: MeshBuilder, mat: string, f: Face, arc: Array<[number, number]>, yTop: number, d0: number, d1: number): void {
  for (let i = 0; i + 1 < arc.length; i++) {
    const a = arc[i]!;
    const b = arc[i + 1]!;
    fface(m, mat, f, [a, b, [b[0], yTop], [a[0], yTop]], d1);
    wquad(m, mat, P(f, a[0], a[1], d0), P(f, b[0], b[1], d0), P(f, b[0], b[1], d1), P(f, a[0], a[1], d1), inward(f, arc, a, b));
  }
}

/** The direction from the arc segment a-b toward the arch's opening (down and to its middle). */
function inward(f: Face, arc: Array<[number, number]>, a: [number, number], b: [number, number]): Vec3 {
  const c = (arc[0]![0] + arc[arc.length - 1]![0]) / 2;
  const du = c - (a[0] + b[0]) / 2;
  const dy = arc[0]![1] - (a[1] + b[1]) / 2;
  return [f.ux * du, dy, f.uz * du];
}

/** A moulded arch rib along an arc: its face at d1 and its inner and outer edges back to d0. */
function arcRib(m: MeshBuilder, mat: string, f: Face, inner: Array<[number, number]>, outer: Array<[number, number]>, d0: number, d1: number): void {
  for (let i = 0; i + 1 < inner.length; i++) {
    const a = inner[i]!;
    const b = inner[i + 1]!;
    const c = outer[i]!;
    const e = outer[i + 1]!;
    fface(m, mat, f, [a, b, e, c], d1);
    const n = inward(f, inner, a, b);
    wquad(m, mat, P(f, a[0], a[1], d0), P(f, b[0], b[1], d0), P(f, b[0], b[1], d1), P(f, a[0], a[1], d1), n);
    wquad(m, mat, P(f, c[0], c[1], d0), P(f, e[0], e[1], d0), P(f, e[0], e[1], d1), P(f, c[0], c[1], d1), [-n[0], -n[1], -n[2]]);
  }
}

/**
 * A Gothic window: the moulded frame (a lancet a little larger than the light),
 * the dark light in front of it, and with `tracery` a mullion, a transom and the
 * pointed heads of the two lights; a sill under it.
 */
function gothicWindow(m: MeshBuilder, f: Face, uc: number, y0: number, ys: number, w: number, tracery = true): void {
  const u0 = uc - w / 2;
  const u1 = uc + w / 2;
  const g = 0.17;
  fpoly(m, "stoneDark", f, lancet(u0 - g, u1 + g, y0 - 0.02, ys, 2), -0.05, 0.12);
  fface(m, "windowGlass", f, lancet(u0, u1, y0, ys, 2), 0.15);
  fbox(m, "stoneDark", f, u0 - 0.26, u1 + 0.26, y0 - 0.18, y0 - 0.02, -0.05, 0.24);
  if (!tracery) return;
  fbox(m, "stoneDark", f, uc - 0.05, uc + 0.05, y0, ys + w * 0.62, 0.1, 0.22);
  const yt = y0 + (ys - y0) * 0.55;
  fbox(m, "stoneDark", f, u0, u1, yt - 0.05, yt + 0.05, 0.1, 0.2);
  fface(m, "stoneDark", f, [[uc - 0.05, ys], [uc - w * 0.25, ys + w * 0.4], [uc - w * 0.45, ys]], 0.18);
  fface(m, "stoneDark", f, [[uc + 0.05, ys], [uc + w * 0.45, ys], [uc + w * 0.25, ys + w * 0.4]], 0.18);
}

/** A plain light with a sill (the courtyard, ends and back walls). */
function plainWindow(m: MeshBuilder, f: Face, uc: number, y0: number, y1: number, w: number, pointed = false): void {
  if (pointed) fface(m, "windowGlass", f, lancet(uc - w / 2, uc + w / 2, y0, y1 - w * 0.866, 2), 0.03);
  else fface(m, "windowGlass", f, [[uc - w / 2, y0], [uc + w / 2, y0], [uc + w / 2, y1], [uc - w / 2, y1]], 0.03);
  fbox(m, "stoneDark", f, uc - w / 2 - 0.12, uc + w / 2 + 0.12, y0 - 0.15, y0, -0.05, 0.16);
}

/**
 * A statue in its niche on face f at (u, y), standing d out of the wall: the
 * corbel, the figure (robe and head) and the canopy over it with its spirelet;
 * h is the figure's height.
 */
function niche(m: MeshBuilder, f: Face, u: number, y: number, h: number, d: number): void {
  m.scope("statue", () => {
    const dc = d + 0.24;
    fbox(m, "stoneDark", f, u - 0.26, u + 0.26, y - 0.3, y, d, d + 0.5);
    const c = P(f, u, 0, dc);
    m.loft("stoneLight", ngon(5, h * 0.14, Math.PI / 2, c[0], c[2]), y, ngon(5, h * 0.09, Math.PI / 2, c[0], c[2]), y + h * 0.76, false);
    m.loft("stoneLight", ngon(4, h * 0.09, Math.PI / 4, c[0], c[2]), y + h * 0.74, ngon(4, h * 0.06, Math.PI / 4, c[0], c[2]), y + h * 0.93);
    const yc = y + h + 0.08;
    fbox(m, "stoneDark", f, u - 0.3, u + 0.3, yc, yc + 0.3, d, d + 0.62);
    const t = P(f, u, 0, d + 0.3);
    m.spire("stoneDark", rect(0.46, 0.46, t[0], t[2]), yc + 0.3, yc + 1.05);
  });
}

// --- the layout --------------------------------------------------------------------

/** The front wall plane (+Z) and the ends of the front. */
const ZF = 22;
const XE = 33;
/** The front wing's depth (its courtyard wall) and the back of the complex. */
const ZC = 8;
const ZB = -24;
/** The back wing's courtyard wall. */
const ZK = ZB + 14;
/** The courtyard's half width (the side wings run from it to XE). */
const XC = 19;
/** The tower's square shaft. */
const TX0 = -1.2;
const TX1 = 10.8;
const TXC = (TX0 + TX1) / 2;
const TZ0 = 11;
const TZ1 = 23;
const TZC = (TZ0 + TZ1) / 2;
/** The passage under the tower. */
const PW = 4.5;
const PY = 8.4;
/** Heights: the arcade, the string courses, the eaves (parapet walk) and the roof pitch. */
const ARC = 7.0;
const EAVE = 24;
const PITCH = 12 / 7;
const GAL = 4.0;
/** The bays of the two wings: their edges. */
const LEFT = Array.from({ length: 12 }, (_, i) => -30.6 + (i * (TX0 - -30.6)) / 11);
const RIGHT = Array.from({ length: 8 }, (_, i) => TX1 + (i * (30.6 - TX1)) / 7);

// --- the front ---------------------------------------------------------------------

/** One wing of the front between bay edges `edges`: arcade, windows, pilasters and statues. */
function frontWing(m: MeshBuilder, edges: number[], name: string): void {
  const f = faceZ(ZF, 1);
  const x0 = edges[0]!;
  const x1 = edges[edges.length - 1]!;
  m.scope(name, () => {
    m.scope("body", () => {
      span(m, "stone", x0, x1, ARC, EAVE, ZC, ZF, false);
      span(m, "stone", x0, x1, 0, ARC + 0.01, ZC, ZF - GAL, false);
      m.cap("shade", rect(x1 - x0, GAL, (x0 + x1) / 2, ZF - GAL / 2), ARC, false);
    });
    m.scope("arcade", () => {
      const fb = faceZ(ZF - GAL, 1);
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i]!;
        const a = i === 0 ? e - 0.15 : e - 0.38;
        const b = i === edges.length - 1 ? e + 0.15 : e + 0.38;
        fbox(m, "stone", f, a, b, 0, ARC + 0.02, -0.8, 0.12);
        fbox(m, "stoneDark", f, a - 0.06, b + 0.06, 0, 0.5, -0.86, 0.18);
        if (i > 0 && i < edges.length - 1) niche(m, f, e, 4.1, 1.35, 0.12);
      }
      for (let i = 0; i + 1 < edges.length; i++) {
        const a = edges[i]! + (i === 0 ? 0.15 : 0.38);
        const b = edges[i + 1]! - (i + 1 === edges.length - 1 ? 0.15 : 0.38);
        const ys = 4.0;
        const arc = pointedArc(a, b, ys, 4);
        archWall(m, "stone", f, arc, ARC + 0.02, -0.8, 0.02);
        arcRib(m, "stoneDark", f, arc, pointedArc(a - 0.16, b + 0.16, ys, 4), 0.02, 0.14);
        // the gallery's back wall: a door in every other bay, windows between
        const c = (a + b) / 2;
        if (i % 2 === 0) fbox(m, "door", fb, c - 0.75, c + 0.75, 0, 3.4, -0.05, 0.08);
        else fbox(m, "windowGlass", fb, c - 0.6, c + 0.6, 1.2, 3.4, -0.05, 0.06);
      }
    });
    m.scope("string courses", () => {
      fbox(m, "stone", f, x0, x1, ARC, ARC + 1.1, 0, 0.32);
      fbox(m, "stone", f, x0, x1, 15.2, 15.6, -0.05, 0.25);
      fbox(m, "stone", f, x0, x1, 23.2, 23.8, -0.05, 0.5);
    });
    m.scope("windows", () => {
      for (let i = 0; i + 1 < edges.length; i++) {
        const c = (edges[i]! + edges[i + 1]!) / 2;
        gothicWindow(m, f, c, 8.9, 12.6, 1.3);
        gothicWindow(m, f, c, 16.9, 20.7, 1.3);
        // the blind tracery panel over the upper window
        fbox(m, "stoneDark", f, c - 0.75, c + 0.75, 22.3, 22.9, -0.05, 0.08);
        // the openwork balustrade over the arcade: a row of small pointed lights
        const a0 = edges[i]! + 0.36;
        const n = 5;
        const w = (edges[i + 1]! - 0.36 - a0) / n;
        for (let k = 0; k < n; k++) fface(m, "shade", f, lancet(a0 + k * w + 0.08, a0 + (k + 1) * w - 0.08, 7.55, 7.95, 1), 0.34);
      }
    });
    m.scope("pilasters", () => {
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i]!;
        fbox(m, "stone", f, e - 0.3, e + 0.3, ARC, 26.4, 0, 0.36);
        pinnacle(m, "stone", e, ZF + 0.18, 0.2, 26.4, 26.9, 28.0);
        niche(m, f, e, 8.3, 1.8, 0.36);
        niche(m, f, e, 16.2, 1.8, 0.36);
      }
    });
    m.scope("parapet", () => {
      fbox(m, "stone", f, x0, x1, 23.8, 25.2, -0.45, 0.3);
      for (let i = 0; i + 1 < edges.length; i++) {
        const a = edges[i]! + 0.3;
        const b = edges[i + 1]! - 0.3;
        const n = 2;
        const w = (b - a) / (2 * n + 1);
        for (let k = 0; k < n; k++) fbox(m, "stone", f, a + (2 * k + 1) * w, a + (2 * k + 2) * w, 25.2, 26.0, -0.45, 0.3);
      }
    });
  });
}

/** A crenellated parapet with a cornice along face f from u0 to u1 (the ends and the courtyard). */
function parapet(m: MeshBuilder, f: Face, u0: number, u1: number, merlons = true): void {
  fbox(m, "stone", f, u0, u1, 23.2, 23.8, -0.05, 0.45);
  fbox(m, "stone", f, u0, u1, 23.8, 25.0, -0.45, 0.25);
  if (!merlons) return;
  const n = Math.floor((u1 - u0) / 1.6);
  const w = (u1 - u0) / n;
  for (let k = 0; k < n; k++) fbox(m, "stone", f, u0 + k * w + w * 0.3, u0 + k * w + w * 0.75, 25.0, 25.8, -0.45, 0.25);
}

/** A corner turret: octagonal shaft, string rings, slit windows, the pinnacled gallery and the spire. */
function turret(m: MeshBuilder, x: number, z: number, ap: number, yTop: number, outX: number, outZ: number): void {
  m.scope("corner turret", () => {
    m.prism("stone", oct(ap, x, z), 0, yTop, false);
    for (const y of [ARC + 0.05, 15.2, 23.2]) {
      m.prism("stone", oct(ap + 0.22, x, z), y, y + 0.45);
      m.cap("stone", oct(ap + 0.22, x, z), y, false);
    }
    // windows on the faces that look out
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const nx = Math.cos(a);
      const nz = -Math.sin(a);
      if (nx * outX + nz * outZ < 0.5) continue;
      const fc = faceDir(x, z, nx, nz, ap);
      const w = ap * 0.38;
      for (const [y0, ys] of [[9.5, 12.6], [17.4, 20.6], [26.0, 28.6], [30.6, 33.0]] as Array<[number, number]>) {
        if (ys + w > yTop - 1) continue;
        fpoly(m, "windowGlass", fc, lancet(-w / 2, w / 2, y0, ys, 2), -0.05, 0.05);
      }
    }
    // the gallery at the top: a wider ring, pinnacles at its corners, the spire
    const g = oct(ap + 0.55, x, z);
    m.prism("stone", g, yTop - 0.4, yTop + 0.9);
    m.cap("stone", g, yTop - 0.4, false);
    const R = (ap + 0.4) / Math.cos(Math.PI / 8);
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k * Math.PI) / 4;
      pinnacle(m, "stone", x + R * Math.cos(a), z - R * Math.sin(a), 0.16, yTop + 0.9, yTop + 1.6, yTop + 2.8);
    }
    m.prism("stone", oct(ap * 0.75, x, z), yTop + 0.9, yTop + 2.6, false);
    m.spire("stone", oct(ap * 0.8, x, z), yTop + 2.6, yTop + 9.0);
    m.cap("stone", oct(ap * 0.8, x, z), yTop + 2.6, false);
    m.prism("gilt", ngon(4, 0.08, 0, x, z), yTop + 8.4, yTop + 10.0);
  });
}

// --- the roofs -----------------------------------------------------------------------

/** A hipped slate roof over x0..x1, z0..z1 from yE at PITCH, ridge along the long side, with a lead cresting. */
function hipRoof(m: MeshBuilder, x0: number, x1: number, z0: number, z1: number, yE: number): void {
  // the eaves overhang the walls by 0.3 m, so no edge of the slate lies on a wall
  const o = 0.3;
  [x0, x1, z0, z1, yE] = [x0 - o, x1 + o, z0 - o, z1 + o, yE - o * PITCH];
  const w = x1 - x0;
  const d = z1 - z0;
  const t: Vec3 = [0, -0.3, 0];
  if (w >= d) {
    const yR = yE + (d / 2) * PITCH;
    const zc = (z0 + z1) / 2;
    const a = x0 + d / 2;
    const b = x1 - d / 2;
    m.slab("slate", [[x0, yE, z1], [x1, yE, z1], [b, yR, zc], [a, yR, zc]], t);
    m.slab("slate", [[x1, yE, z0], [x0, yE, z0], [a, yR, zc], [b, yR, zc]], t);
    m.slab("slate", [[x0, yE, z0], [x0, yE, z1], [a, yR, zc]], t);
    m.slab("slate", [[x1, yE, z1], [x1, yE, z0], [b, yR, zc]], t);
    beam(m, "lead", [a + 0.2, yR + 0.05, zc], [b - 0.2, yR + 0.05, zc], 0.3, 0.3);
  } else {
    const yR = yE + (w / 2) * PITCH;
    const xc = (x0 + x1) / 2;
    const a = z0 + w / 2;
    const b = z1 - w / 2;
    m.slab("slate", [[x1, yE, z0], [x1, yE, z1], [xc, yR, b], [xc, yR, a]], t);
    m.slab("slate", [[x0, yE, z1], [x0, yE, z0], [xc, yR, a], [xc, yR, b]], t);
    m.slab("slate", [[x0, yE, z0], [x1, yE, z0], [xc, yR, a]], t);
    m.slab("slate", [[x1, yE, z1], [x0, yE, z1], [xc, yR, b]], t);
    beam(m, "lead", [xc, yR + 0.05, a + 0.2], [xc, yR + 0.05, b - 0.2], 0.3, 0.3);
  }
}

/**
 * A small dormer on a roof slope whose eave line is face f at EAVE (the slope rises
 * PITCH into the wall): a slate-hung body, the dark light, a pointed gable roof.
 */
function dormer(m: MeshBuilder, f: Face, u: number, y0: number, tall: number, w: number): void {
  const y1 = y0 + tall;
  const dF = -(y0 - EAVE) / PITCH + 0.25;
  const yA = y1 + w * 0.95;
  const dB = -(yA - EAVE) / PITCH - 0.1;
  const yL = y0 - 0.8; // below the slope, hidden
  const side: Vec3 = [f.ux, 0, f.uz];
  // only the faces that can be seen: the front, the two cheeks and the two roof planes
  fface(m, "slate", f, [[u - w / 2, yL], [u + w / 2, yL], [u + w / 2, y1], [u, yA - 0.1], [u - w / 2, y1]], dF);
  for (const s of [-1, 1]) {
    const q = (dd: number, yy: number): Vec3 => P(f, u + (s * w) / 2, yy, dd);
    wquad(m, "slate", q(dB, yL), q(dF, yL), q(dF, y1), q(dB, y1), [s * side[0], 0, s * side[2]]);
    const h = w / 2 + 0.12;
    const r = (uu: number, yy: number, dd: number): Vec3 => P(f, uu, yy, dd);
    wquad(m, "slate", r(u + s * h, y1 - 0.08, dF + 0.1), r(u, yA, dF + 0.1), r(u, yA, dB), r(u + s * h, y1 - 0.08, dB), [s * side[0] * 0.8, 0.6, s * side[2] * 0.8]);
  }
  fface(m, "windowGlass", f, [[u - w * 0.3, y0 + 0.1], [u + w * 0.3, y0 + 0.1], [u + w * 0.3, y1 - 0.12], [u, y1 + w * 0.3], [u - w * 0.3, y1 - 0.12]], dF + 0.03);
}

/** Rows of dormers along face f between u0 and u1 (the slope narrows at the hips). */
function dormerRows(m: MeshBuilder, f: Face, u0: number, u1: number, rows: Array<[number, number, number, number]>, hips: [boolean, boolean]): void {
  for (const [y0, tall, w, step] of rows) {
    const inset = (y0 + tall + w - EAVE) / PITCH + 0.8;
    const a = u0 + (hips[0] ? inset : 1.0);
    const b = u1 - (hips[1] ? inset : 1.0);
    const n = Math.max(1, Math.floor((b - a) / step) + 1);
    const s = n > 1 ? (b - a) / (n - 1) : 0;
    for (let k = 0; k < n; k++) dormer(m, f, n > 1 ? a + k * s : (a + b) / 2, y0, tall, w);
  }
}

// --- the tower ---------------------------------------------------------------------

/** One octagonal openwork stage of apothem ap from y0 to y1: corner piers, open lancets, a gallery under it. */
function octStage(m: MeshBuilder, ap: number, y0: number, y1: number, gallery: number): void {
  const R = ap / Math.cos(Math.PI / 8);
  m.scope("gallery", () => {
    const g = oct(gallery, TXC, TZC);
    m.prism("stone", g, y0 - 0.7, y0);
    m.cap("stone", g, y0 - 0.7, false);
    // the openwork balustrade: eight low rails on posts
    const Rg = (gallery - 0.12) / Math.cos(Math.PI / 8);
    for (let k = 0; k < 8; k++) {
      const a0 = Math.PI / 8 + (k * Math.PI) / 4;
      const a1 = a0 + Math.PI / 4;
      const p0: Vec3 = [TXC + Rg * Math.cos(a0), y0 + 0.95, TZC - Rg * Math.sin(a0)];
      const p1: Vec3 = [TXC + Rg * Math.cos(a1), y0 + 0.95, TZC - Rg * Math.sin(a1)];
      beam(m, "stone", p0, p1, 0.16, 0.18);
      m.prism("stone", rect(0.22, 0.22, p0[0], p0[2]), y0, y0 + 1.2);
    }
  });
  m.scope("openwork stage", () => {
    const pier = 0.8;
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k * Math.PI) / 4;
      const x = TXC + (R - 0.25) * Math.cos(a);
      const z = TZC - (R - 0.25) * Math.sin(a);
      m.prism("stone", rect(pier, pier, x, z, a), y0, y1, false);
    }
    const hw = ap * Math.tan(Math.PI / 8);
    const ys = y1 - 0.5 - (2 * hw - pier) * 0.866 - 0.3;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const fc = faceDir(TXC, TZC, Math.cos(a), -Math.sin(a), ap);
      const u0 = -hw + pier * 0.6;
      const u1 = hw - pier * 0.6;
      fbox(m, "stone", fc, -hw, hw, y0, y0 + 0.7, -0.5, 0);
      const arc = pointedArc(u0, u1, ys, 2);
      spandrel(m, "stone", fc, arc, y1, -0.5, 0);
      arcRib(m, "stoneDark", fc, arc, pointedArc(u0 - 0.14, u1 + 0.14, ys, 2), 0, 0.12);
      // the tracery: a mullion and the two pointed heads of the lights
      fbox(m, "stoneDark", fc, -0.07, 0.07, y0 + 0.7, ys + (u1 - u0) * 0.55, -0.35, -0.15);
      // a gablet (wimperg) over the arch
      fpoly(m, "stoneDark", fc, [[u0 - 0.1, y1 - 0.02], [u1 + 0.1, y1 - 0.02], [0, y1 + 1.1]], -0.2, 0.08);
    }
    m.prism("stone", oct(ap + 0.1, TXC, TZC), y1, y1 + 0.35, false);
    m.cap("stone", oct(ap + 0.1, TXC, TZC), y1, false);
    // the four buttress turrets on the diagonals, pinnacled above the stage
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const r = ap + 0.35;
      pinnacle(m, "stone", TXC + r * Math.cos(a), TZC - r * Math.sin(a), 0.32, y0, y1 + 1.0, y1 + 3.2);
    }
  });
}

function tower(m: MeshBuilder): void {
  m.scope("tower", () => {
    const f = faceZ(TZ1, 1);
    const pa = TXC - PW / 2;
    const pb = TXC + PW / 2;
    m.scope("base", () => {
      // the block over the passage, from the square to the courtyard
      span(m, "stone", TX0, pa, 0, EAVE, ZC, TZ1, false);
      span(m, "stone", pb, TX1, 0, EAVE, ZC, TZ1, false);
      span(m, "stone", pa, pb, PY, EAVE, ZC, TZ1, false);
      m.cap("shade", rect(PW, TZ1 - ZC, TXC, (ZC + TZ1) / 2), PY, false);
      for (const [fa, zs] of [[f, 1], [faceZ(ZC, -1), -1]] as Array<[Face, number]>) {
        const arc = pointedArc(pa, pb, PY - PW * 0.866, 5);
        archWall(m, "stone", fa, arc, PY + 0.01, -0.6, 0.02);
        arcRib(m, "stoneDark", fa, arc, pointedArc(pa - 0.45, pb + 0.45, PY - PW * 0.866, 5), 0.02, 0.3);
        if (zs > 0) {
          fbox(m, "stoneDark", fa, pa - 0.45, pa, 0, PY - PW * 0.866 + 0.01, 0.02, 0.3);
          fbox(m, "stoneDark", fa, pb, pb + 0.45, 0, PY - PW * 0.866 + 0.01, 0.02, 0.3);
        }
      }
      // the far end of the passage: the courtyard beyond is open
    });
    m.scope("shaft", () => {
      span(m, "stone", TX0, TX1, EAVE, 45.5, TZ0, TZ1, false);
      // corner buttresses, stepped
      for (const x of [TX0, TX1]) {
        for (const z of [TZ0, TZ1]) {
          const sx = x === TX0 ? -1 : 1;
          const sz = z === TZ0 ? -1 : 1;
          span(m, "stone", Math.min(x, x + sx * 0.6), Math.max(x, x + sx * 0.6), z === TZ1 ? 0 : EAVE - 0.5, 44.0, Math.min(z - sz * 0.6, z + sz * 0.6), Math.max(z - sz * 0.6, z + sz * 0.6));
        }
      }
    });
    m.scope("front", () => {
      // the windows of the two storeys and the tower storeys above the roof
      for (const c of [TXC - 1.6, TXC + 1.6]) {
        gothicWindow(m, f, c, 11.6, 14.0, 1.2);
        gothicWindow(m, f, c, 17.0, 20.7, 1.2);
      }
      fbox(m, "stone", f, TX0 + 0.6, TX1 - 0.6, 15.2, 15.6, -0.05, 0.25);
      fbox(m, "stone", f, TX0 + 0.6, TX1 - 0.6, 23.2, 23.8, -0.05, 0.4);
      for (const u of [TXC - 3.4, TXC, TXC + 3.4]) niche(m, f, u, 9.4, 1.6, 0.05);
      for (const u of [TXC - 3.4, TXC + 3.4]) niche(m, f, u, 16.3, 1.6, 0.05);
      fbox(m, "stoneDark", f, TXC - 1.4, TXC + 1.4, 15.8, 16.6, -0.05, 0.1);
    });
    m.scope("shaft windows", () => {
      const faces: Array<[Face, number]> = [[faceZ(TZ1, 1), TXC], [faceZ(TZ0, -1), TXC], [faceX(TX0, -1), TZC], [faceX(TX1, 1), TZC]];
      for (const [fc, c] of faces) {
        for (const u of [c - 1.7, c + 1.7]) {
          gothicWindow(m, fc, u, 26.6, 30.6, 1.5);
          gothicWindow(m, fc, u, 35.6, 40.4, 1.5);
        }
        fbox(m, "stone", fc, c - 5.4, c + 5.4, 33.6, 34.0, -0.05, 0.3);
        fbox(m, "stone", fc, c - 5.4, c + 5.4, 43.8, 44.4, -0.05, 0.4);
        if (fc !== faces[0]![0]) continue;
        for (const u of [c - 4.0, c, c + 4.0]) niche(m, fc, u, 30.0, 1.7, 0.05);
      }
    });
    m.scope("square gallery", () => {
      const g = rect(TX1 - TX0 + 1.6, TZ1 - TZ0 + 1.6, TXC, TZC);
      m.prism("stone", g, 44.4, 45.6);
      m.cap("stone", g, 44.4, false);
      const h = (TX1 - TX0) / 2 + 0.65;
      for (const [a, b] of [[[-h, h], [h, h]], [[h, h], [h, -h]], [[h, -h], [-h, -h]], [[-h, -h], [-h, h]]] as Array<[[number, number], [number, number]]>) {
        beam(m, "stone", [TXC + a[0], 46.6, TZC + a[1]], [TXC + b[0], 46.6, TZC + b[1]], 0.18, 0.2);
        const n = 6;
        for (let k = 1; k < n; k++) {
          const t = k / n;
          m.prism("stone", rect(0.2, 0.2, TXC + a[0] + (b[0] - a[0]) * t, TZC + a[1] + (b[1] - a[1]) * t), 45.6, 46.5);
        }
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) pinnacle(m, "stone", TXC + sx * h, TZC + sz * h, 0.55, 41.0, 49.0, 53.0);
    });
    octStage(m, 4.4, 46.3, 57.5, 5.3);
    octStage(m, 3.9, 58.2, 70.0, 4.8);
    octStage(m, 3.3, 70.7, 79.4, 4.2);
    spire(m);
    stMichael(m);
  });
}

/** The openwork spire: eight crocketed ribs, rings between them and the solid tip. */
function spire(m: MeshBuilder): void {
  m.scope("spire", () => {
    const y0 = 80.1;
    const yT = 93.3;
    const ap = 3.0;
    const g = oct(3.7, TXC, TZC);
    m.prism("stone", g, 79.4, 80.1);
    m.cap("stone", g, 79.4, false);
    const R = ap / Math.cos(Math.PI / 8);
    const rAt = (y: number): number => R * (1 - (y - y0) / (yT - y0));
    const yS = 90.6; // the solid tip starts here
    for (let k = 0; k < 8; k++) {
      const a = Math.PI / 8 + (k * Math.PI) / 4;
      const c = Math.cos(a);
      const s = -Math.sin(a);
      const p0: Vec3 = [TXC + R * c, y0, TZC + R * s];
      const p1: Vec3 = [TXC + rAt(yS) * c, yS, TZC + rAt(yS) * s];
      beam(m, "stone", p0, p1, 0.42, 0.42, [c, 0, s]);
      // crockets along the rib
      for (const y of [82.5, 85.0, 87.5]) {
        const r = rAt(y) + 0.22;
        m.spire("stoneDark", ngon(4, 0.18, 0, TXC + r * c, TZC + r * s), y, y + 0.6);
      }
    }
    for (const y of [83.6, 87.2]) {
      const r = rAt(y) - 0.05;
      for (let k = 0; k < 8; k++) {
        const a0 = Math.PI / 8 + (k * Math.PI) / 4;
        const a1 = a0 + Math.PI / 4;
        beam(m, "stone", [TXC + r * Math.cos(a0), y, TZC - r * Math.sin(a0)], [TXC + r * Math.cos(a1), y, TZC - r * Math.sin(a1)], 0.24, 0.3);
      }
    }
    // the tracery of the lowest openings: a gablet on each face
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      const fc = faceDir(TXC, TZC, Math.cos(a), -Math.sin(a), ap * (1 - 0.6 / (yT - y0)) - 0.12);
      const hw = ap * Math.tan(Math.PI / 8) - 0.3;
      fpoly(m, "stoneDark", fc, [[-hw, y0 + 0.01], [hw, y0 + 0.01], [0, y0 + 2.0]], -0.08, 0.08);
    }
    const tip = oct(rAt(yS) + 0.08, TXC, TZC);
    m.spire("stone", tip, yS, yT);
    m.cap("stone", tip, yS, false);
  });
}

/** The gilded St Michael on the spire's tip: a globe, the figure with its wings, shield and raised lance. */
function stMichael(m: MeshBuilder): void {
  m.scope("st michael", () => {
    const x = TXC;
    const z = TZC;
    m.loft("gilt", ngon(6, 0.18, 0, x, z), 93.1, ngon(6, 0.3, 0, x, z), 93.4, false);
    m.loft("gilt", ngon(6, 0.3, 0, x, z), 93.4, ngon(6, 0.16, 0, x, z), 93.65);
    // the dragon under his feet
    beam(m, "gilt", [x - 0.45, 93.75, z + 0.1], [x + 0.45, 93.7, z - 0.1], 0.22, 0.2);
    m.loft("gilt", ngon(6, 0.26, 0, x, z), 93.65, ngon(6, 0.16, 0, x, z), 95.0, false);
    m.prism("gilt", ngon(6, 0.11, 0, x, z), 95.0, 95.32);
    for (const s of [-1, 1]) {
      m.slab("gilt", [[x + s * 0.12, 94.5, z - 0.12], [x + s * 0.75, 95.45, z - 0.3], [x + s * 0.5, 95.75, z - 0.3], [x + s * 0.12, 94.95, z - 0.12]], [0, 0, -0.05]);
    }
    m.slab("gilt", [[x - 0.28, 94.2, z + 0.16], [x - 0.04, 94.2, z + 0.16], [x - 0.04, 94.7, z + 0.16], [x - 0.28, 94.7, z + 0.16]], [0, 0, 0.06]);
    beam(m, "gilt", [x + 0.08, 94.85, z], [x + 0.34, 95.2, z], 0.08, 0.08);
    beam(m, "gilt", [x + 0.34, 93.6, z], [x + 0.34, 96.0, z], 0.06, 0.06);
  });
}

// --- the wings behind ----------------------------------------------------------------

function ends(m: MeshBuilder): void {
  for (const s of [-1, 1]) {
    m.scope(s < 0 ? "left end" : "right end", () => {
      const f = faceX(s * XE, s);
      // the front wing's end and the side wing's outer wall
      span(m, "stone", Math.min(s * XE, s * XC), Math.max(s * XE, s * XC), 0, EAVE, ZB, ZC + 0.01, false);
      for (let z = ZB + 3; z < ZF - 2; z += 3.2) {
        if (Math.abs(z - ZC) < 2.2) continue;
        gothicWindow(m, f, z, 9.0, 12.4, 1.1, false);
        gothicWindow(m, f, z, 16.9, 20.4, 1.1, false);
        if (z < ZC) plainWindow(m, f, z, 1.4, 4.6, 1.0, true);
      }
      fbox(m, "stone", f, ZB, ZF - 2.2, ARC, ARC + 0.4, -0.05, 0.3);
      fbox(m, "stone", f, ZB, ZF - 2.2, 15.2, 15.6, -0.05, 0.25);
      parapet(m, f, ZB + 0.1, ZF - 2.2);
      // the courtyard wall of the side wing
      const fc = faceX(s * XC, -s);
      for (let z = ZK + 3; z <= ZC - 3; z += 3) {
        for (const [y0, y1] of [[1.4, 4.4], [9.0, 12.4], [16.9, 20.4]] as Array<[number, number]>) plainWindow(m, fc, z, y0, y1, 1.2, true);
      }
      parapet(m, fc, ZK, ZC, false);
    });
  }
  m.scope("back wing", () => {
    span(m, "stone", -XC, XC, 0, EAVE, ZB, ZK, false);
    const fb = faceZ(ZB, -1);
    for (let x = -XE + 3; x <= XE - 3; x += 3.3) {
      for (const [y0, y1] of [[1.6, 5.0], [8.6, 12.6], [16.6, 20.6]] as Array<[number, number]>) plainWindow(m, fb, x, y0, y1, 1.3);
    }
    fbox(m, "stone", fb, -XE + 0.6, XE - 0.6, 0, 0.8, -0.05, 0.2);
    parapet(m, fb, -XE + 0.6, XE - 0.6, false);
    const fc = faceZ(ZK, 1);
    for (let x = -16; x <= 16; x += 4) {
      for (const [y0, y1] of [[1.4, 4.4], [9.0, 12.4], [16.9, 20.4]] as Array<[number, number]>) plainWindow(m, fc, x, y0, y1, 1.2, true);
    }
  });
  m.scope("courtyard front wall", () => {
    const fc = faceZ(ZC, -1);
    for (const x of [-16, -12, -8, -4, 14, 17]) {
      for (const [y0, y1] of [[1.4, 4.4], [9.0, 12.4], [16.9, 20.4]] as Array<[number, number]>) plainWindow(m, fc, x, y0, y1, 1.2, true);
    }
    parapet(m, fc, -XC, XC, false);
  });
}

function roofs(m: MeshBuilder): void {
  m.scope("roofs", () => {
    hipRoof(m, -XE, XE, ZC, ZF, EAVE);
    hipRoof(m, -XE, -XC, ZB, ZF, EAVE);
    hipRoof(m, XC, XE, ZB, ZF, EAVE);
    hipRoof(m, -XE, XE, ZB, ZK, EAVE);
  });
  m.scope("dormers", () => {
    const rows: Array<[number, number, number, number]> = [[26.4, 1.9, 1.3, 2.7], [29.4, 1.5, 1.1, 2.2], [32.0, 1.2, 0.9, 2.4], [34.2, 0.8, 0.7, 3.0]];
    dormerRows(m, faceZ(ZF, 1), -XE, TX0 - 0.8, rows, [true, false]);
    dormerRows(m, faceZ(ZF, 1), TX1 + 0.8, XE, rows, [false, true]);
    const back = rows.slice(0, 2);
    dormerRows(m, faceZ(ZB, -1), -XE, XE, back.map(([a, b, c, d]) => [a, b, c, d * 1.4]), [true, true]);
    for (const s of [-1, 1]) {
      const fs = faceX(s * XE, s);
      dormerRows(m, fs, ZB + 0.5, ZC - 0.5, rows.slice(0, 3).map(([a, b, c, d]) => [a, b, c, d * 1.2]), [true, false]);
    }
  });
}

// --- the model -----------------------------------------------------------------------

export function brusselsTownHall(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("brussels town hall", () => {
    frontWing(m, LEFT, "left wing");
    frontWing(m, RIGHT, "right wing");
    tower(m);
    m.scope("left wing end", () => span(m, "stone", -XE, LEFT[0]!, 0, EAVE, ZC, ZF, false));
    m.scope("right wing end", () => span(m, "stone", RIGHT[RIGHT.length - 1]!, XE, 0, EAVE, ZC, ZF, false));
    ends(m);
    roofs(m);
    for (const s of [-1, 1]) {
      turret(m, s * XE, ZF, 2.1, 38.0, s * 0.7, 0.7);
      turret(m, s * XE, ZC, 1.6, 33.0, s, 0);
    }
  });
  return m;
}

export function brusselsTownHallLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  // the wings round the courtyard and their hipped roofs
  lodBox(m, "stone", 0, (ZC + ZF) / 2, 2 * XE, ZF - ZC, 0, EAVE);
  lodBox(m, "stone", -(XE + XC) / 2, (ZB + ZC) / 2, XE - XC, ZC - ZB, 0, EAVE);
  lodBox(m, "stone", (XE + XC) / 2, (ZB + ZC) / 2, XE - XC, ZC - ZB, 0, EAVE);
  lodBox(m, "stone", 0, (ZB + ZK) / 2, 2 * XC, ZK - ZB, 0, EAVE);
  m.box("shade", 0, ZF - 0.01, 2 * XE - 6, 0.2, 0.5, ARC - 0.5);
  // the hipped roofs: each wing's footprint lofted to a narrow ridge
  const ridge = EAVE + 7 * PITCH;
  const hip = (x0: number, x1: number, z0: number, z1: number): void => {
    const w = x1 - x0;
    const d = z1 - z0;
    const k = Math.min(w, d) - 0.2;
    m.loft("slate", rect(w + 0.6, d + 0.6, (x0 + x1) / 2, (z0 + z1) / 2), EAVE - 0.5, rect(w - k, d - k, (x0 + x1) / 2, (z0 + z1) / 2), ridge);
  };
  hip(-XE, XE, ZC, ZF);
  hip(-XE, XE, ZB, ZK);
  for (const s of [-1, 1]) {
    hip(Math.min(s * XE, s * XC), Math.max(s * XE, s * XC), ZB, ZF);
    lodLoft(m, "stone", oct(2.1, s * XE, ZF), 0, oct(2.1, s * XE, ZF), 38.9);
    m.spire("stone", oct(2.1, s * XE, ZF), 38.9, 47.0);
  }
  // the tower: the square shaft, the stepped octagonal stages, the spire and St Michael
  lodBox(m, "stone", TXC, (ZC + TZ1) / 2, TX1 - TX0, TZ1 - ZC, 0, EAVE);
  lodBox(m, "stone", TXC, TZC, TX1 - TX0, TZ1 - TZ0, EAVE - 0.5, 46.3);
  lodLoft(m, "stone", oct(4.4, TXC, TZC), 46.3, oct(4.4, TXC, TZC), 58.2);
  lodLoft(m, "stone", oct(3.9, TXC, TZC), 58.2, oct(3.9, TXC, TZC), 70.7);
  lodLoft(m, "stone", oct(3.3, TXC, TZC), 70.7, oct(3.3, TXC, TZC), 80.1);
  m.spire("stone", oct(3.0, TXC, TZC), 80.1, 93.3);
  m.prism("gilt", ngon(4, 0.3, 0, TXC, TZC), 93.3, 96.0);
  return m;
}

export const BRUSSELS_TOWN_HALL: ProceduralDesign[] = [
  {
    id: "bld-brussels-town-hall",
    game: { plaza: { cities: ["town", "city"], layouts: ["rect"], fit: "footprint" } },
    title: "Brussels Town Hall",
    build: brusselsTownHall,
    buildLod: brusselsTownHallLod,
    references: "brussels-town-hall",
    catalog: PLAZA_CATALOG,
  },
];
