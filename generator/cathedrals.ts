// The two big domed landmarks of the historical centre, modelled on the photos in
// assets/: St Basil's Cathedral on Moscow's Red Square and St Nicholas Church on
// Prague's Old Town Square. See docs/models/cathedrals.md.
//
// Each design reproduces the hand-authored GLB of the same name in the webapp's
// model database (rail-island-webapp db/buildings/glb/), procedurally: the same
// axes, the same datums and bounding box (test/referenceModels.test.ts), the same
// massing and colours. The ids are stored in the game's saved maps, so a design is
// never renamed once shipped.
//
// Metres, +Y up, standing on y = 0. Deterministic: no randomness, no clock.
//
// Building blocks, all local to this module:
// - `lathe` turns a (radius, height) profile into a dome on any number of
//   segments, with a per-cell material: the twisted stripes and chequers of
//   St Basil's onion domes and the copper ribs of the Prague domes are cells of
//   one surface, not geometry laid over it, so they cannot z-fight.
// - `panel` lays a flat slab (a window, a kokoshnik gable, a pilaster strip) on a
//   wall frame (`edgeWall` of a ring edge, or `wall` for a plain wall), standing a
//   few centimetres proud of it with its back buried in the wall.

import { MeshBuilder, grow, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { CatalogFields, ProceduralDesign } from "./design.ts";

// --- vector and outline helpers ------------------------------------------------------

type Pt = [number, number];
type Tri3 = [Vec3, Vec3, Vec3];

const vadd = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const vsub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vscale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const vdot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vcross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vnorm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => vadd(a, vscale(vsub(b, a), t));

/** A ring wound like every helper of meshCore (negative shoelace area in (x, z)). */
function orient(ring: Ring): Ring {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s > 0 ? [...ring].reverse() : ring;
}

/** The angle of (x, z) about (cx, cz) in ngon's convention (x = cos a, z = -sin a). */
function angleAt(x: number, z: number, cx: number, cz: number): number {
  return Math.atan2(-(z - cz), x - cx);
}

/** An n-gon whose FACES (not corners) have the apothem `ap`, a face looking along +x. */
function polyAp(n: number, ap: number, cx: number, cz: number): Ring {
  return ngon(n, ap / Math.cos(Math.PI / n), Math.PI / n, cx, cz);
}

/** A wall frame: a point of the wall plane at y = 0, the unit tangent along it, the unit outward normal. */
interface Wall {
  o: Vec3;
  t: Vec3;
  n: Vec3;
  /** The width of the wall (an edge of a ring), 0 when unknown. */
  w: number;
}

function wall(x: number, z: number, nx: number, nz: number, w = 0): Wall {
  const n = vnorm([nx, 0, nz]);
  return { o: [x, 0, z], t: [-n[2], 0, n[0]], n, w };
}

/** The frame of edge i of a ring, facing away from the ring's centroid. */
function edgeWall(ring: Ring, i: number): Wall {
  const a = ring[i]!;
  const b = ring[(i + 1) % ring.length]!;
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const mx = (a[0] + b[0]) / 2;
  const mz = (a[1] + b[1]) / 2;
  let nx = -(b[1] - a[1]);
  let nz = b[0] - a[0];
  if (nx * (mx - cx) + nz * (mz - cz) < 0) {
    nx = -nx;
    nz = -nz;
  }
  return wall(mx, mz, nx, nz, Math.hypot(b[0] - a[0], b[1] - a[1]));
}

function onWall(f: Wall, u: number, y: number, out: number): Vec3 {
  return [f.o[0] + f.t[0] * u + f.n[0] * out, y, f.o[2] + f.t[2] * u + f.n[2] * out];
}

/**
 * A flat panel on a wall: the outline (u along the wall from the frame point, y
 * up) stands `out` proud of the wall plane, its back `back` behind the plane.
 * The default back depends on `out`, so a glass pane laid over its frame does
 * not share the frame's (buried) back plane either.
 */
function panel(m: MeshBuilder, mat: string, f: Wall, pts: Pt[], out: number, back = 0.25 + out): void {
  m.slab(mat, pts.map(([u, y]) => onWall(f, u, y, out)), vscale(f.n, -(out + back)));
}

/** A round-headed opening of width w from y0 to y1, centred on u0. */
function archPts(w: number, y0: number, y1: number, u0 = 0, seg = 4): Pt[] {
  const r = w / 2;
  const ys = Math.max(y0 + 0.02, y1 - r);
  const pts: Pt[] = [[u0 - r, y0], [u0 + r, y0]];
  for (let k = 0; k <= seg; k++) {
    const a = (k / seg) * Math.PI;
    pts.push([u0 + r * Math.cos(a), ys + (y1 - ys) * Math.sin(a)]);
  }
  return pts;
}

/** A pointed (keel) arch of width w: straight sides up to ys, then curving in to a point at y1. */
function pointedPts(w: number, y0: number, y1: number, ys: number, u0 = 0): Pt[] {
  const r = w / 2;
  const h = y1 - ys;
  const side = ys > y0 + 0.01;
  const right: Pt[] = [[u0 + 0.78 * r, ys + 0.5 * h], [u0 + 0.45 * r, ys + 0.8 * h]];
  const left: Pt[] = [[u0 - 0.45 * r, ys + 0.8 * h], [u0 - 0.78 * r, ys + 0.5 * h]];
  return [
    [u0 - r, y0], [u0 + r, y0],
    ...(side ? ([[u0 + r, ys]] as Pt[]) : []),
    ...right, [u0, y1], ...left,
    ...(side ? ([[u0 - r, ys]] as Pt[]) : []),
  ];
}

function rectPts(w: number, y0: number, y1: number, u0 = 0): Pt[] {
  return [[u0 - w / 2, y0], [u0 + w / 2, y0], [u0 + w / 2, y1], [u0 - w / 2, y1]];
}

// --- curved surfaces ---------------------------------------------------------------------

function triNormal(t: Tri3): Vec3 {
  return vnorm(vcross(vsub(t[1], t[0]), vsub(t[2], t[0])));
}

/**
 * Draws triangles already wound outward as decals (MeshBuilder.facets), in as
 * few calls as keep every triangle within 87 degrees of its call's mean normal.
 */
function soup(m: MeshBuilder, mat: string, tris: Tri3[]): void {
  if (!tris.length) return;
  const ns = tris.map(triNormal);
  const avg = vnorm(ns.reduce((a, n) => vadd(a, n), [0, 0, 0] as Vec3));
  if (tris.length === 1 || ns.every((n) => vdot(n, avg) > 0.05)) {
    m.facets(mat, tris.flat(), avg);
    return;
  }
  const h = tris.length >> 1;
  soup(m, mat, tris.slice(0, h));
  soup(m, mat, tris.slice(h));
}

interface LatheOpts {
  /** Segments around. */
  n: number;
  /** Angle of the first segment (radians). */
  rot?: number;
  /** Turn of the rings from the bottom of the profile to its top (radians): spiral stripes. */
  twist?: number;
  /** The material of a cell: segment `col` (0..n-1) of profile band `row`. */
  mat: (col: number, row: number) => string;
  /** Segments per drawing group (only the source tree sees it). */
  group?: number;
  /** Close a profile that ends above r = 0 with a flat cap. */
  cap?: boolean;
}

/**
 * A surface of revolution about the vertical through (cx, cz): the profile is
 * (radius, height above y0) from bottom to top; a radius of 0 is a pole.
 */
function lathe(m: MeshBuilder, cx: number, cz: number, y0: number, prof: Pt[], o: LatheOpts): void {
  const H = prof[prof.length - 1]![1] - prof[0]![1] || 1;
  const rings: Vec3[][] = prof.map(([r, dy]) => {
    const tw = (o.twist ?? 0) * ((dy - prof[0]![1]) / H);
    return Array.from({ length: o.n }, (_, i): Vec3 => {
      const a = (o.rot ?? 0) + tw + (i / o.n) * Math.PI * 2;
      return [cx + r * Math.cos(a), y0 + dy, cz - r * Math.sin(a)];
    });
  });
  const group = o.group ?? 2;
  const groups = new Map<string, { mat: string; tris: Tri3[] }>();
  const put = (mat: string, key: string, t: Tri3, up: boolean): void => {
    const n = vcross(vsub(t[1], t[0]), vsub(t[2], t[0]));
    if (Math.hypot(n[0], n[1], n[2]) < 1e-9) return; // a pole's degenerate half
    const c = vscale(vadd(vadd(t[0], t[1]), t[2]), 1 / 3);
    const outward: Vec3 = up ? [0, 1, 0] : [c[0] - cx, 0, c[2] - cz];
    if (vdot(n, outward) < 0) t = [t[0], t[2], t[1]];
    const k = `${mat}|${key}`;
    let g = groups.get(k);
    if (!g) groups.set(k, (g = { mat, tris: [] }));
    g.tris.push(t);
  };
  for (let row = 0; row + 1 < rings.length; row++) {
    const lo = rings[row]!;
    const hi = rings[row + 1]!;
    for (let i = 0; i < o.n; i++) {
      const j = (i + 1) % o.n;
      const mat = o.mat(i, row);
      const key = String(Math.floor(i / group));
      put(mat, key, [lo[i]!, lo[j]!, hi[j]!], false);
      put(mat, key, [lo[i]!, hi[j]!, hi[i]!], false);
    }
  }
  const last = rings[rings.length - 1]!;
  if (o.cap && prof[prof.length - 1]![0] > 0) {
    const c: Vec3 = [cx, last[0]![1], cz];
    for (let i = 0; i < o.n; i++) put(o.mat(i, rings.length - 1), "cap", [c, last[i]!, last[(i + 1) % o.n]!], true);
  }
  for (const g of groups.values()) soup(m, g.mat, g.tris);
}

/** A ball of radius r centred at (cx, y, cz). */
function ball(m: MeshBuilder, mat: string, cx: number, y: number, cz: number, r: number, n = 8): void {
  const prof: Pt[] = [];
  const rows = Math.max(3, Math.round(n / 2));
  for (let k = 0; k <= rows; k++) {
    const a = -Math.PI / 2 + (k / rows) * Math.PI;
    prof.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  lathe(m, cx, cz, y, prof, { n, mat: () => mat, group: n });
}

/** An onion dome's profile: from the drum radius r0, swelling to R, then drawn out to a point. */
function onionProfile(r0: number, R: number, h: number): Pt[] {
  const f0 = r0 / R;
  const T = [0, 0.07, 0.15, 0.25, 0.35, 0.46, 0.57, 0.67, 0.76, 0.84, 0.91, 0.96, 1];
  const F = [f0, f0 + (1 - f0) * 0.6, f0 + (1 - f0) * 0.88, 0.99, 1, 0.95, 0.82, 0.64, 0.46, 0.3, 0.17, 0.08, 0];
  return T.map((t, k) => [F[k]! * R, t * h]);
}

// =========================================================================================
// St Basil's Cathedral
// =========================================================================================

const BASIL: Record<string, MaterialSpec> = {
  brick: { color: "#bf5b3a" },
  white: { color: "#f2ebdd" },
  stone: { color: "#a9a094" },
  window: { color: "#3d3836", roughness: 0.4 },
  gilt: { color: "#e0ab2c", metallic: 0.6, roughness: 0.35 },
  blue: { color: "#2f5da8", roughness: 0.5 },
  cream: { color: "#efe2c4", roughness: 0.5 },
  green: { color: "#1f7a4a", roughness: 0.5 },
  ochre: { color: "#d9a33c", roughness: 0.5 },
  red: { color: "#a33a30", roughness: 0.5 },
  roofGreen: { color: "#2b6b4a" },
};

/** The terrace the churches stand on (top of the deck). */
const DECK = 3.94;
/** The plan centre of the podium (the reference's datum). */
const BZ = -1.9;

interface DomeStyle {
  a: string;
  b: string;
  /** spiral: twisted stripes; check: a twisted chequer (diamonds); plain: one colour. */
  kind: "spiral" | "check" | "plain";
  twist?: number;
}

/** An onion dome with its pattern, its gilt ball and its cross. */
function onionDome(
  m: MeshBuilder, cx: number, cz: number, y0: number, r0: number, R: number, top: number, crossTop: number,
  style: DomeStyle, n = 32,
): void {
  m.scope("dome", () => {
    const mat = (col: number, row: number): string => {
      const stripe = Math.floor(col / 2);
      if (style.kind === "plain") return style.a;
      if (style.kind === "spiral") return stripe % 2 ? style.b : style.a;
      return (Math.floor(col / 3) + Math.floor(row / 2)) % 2 ? style.b : style.a;
    };
    const twist = style.twist ?? (style.kind === "spiral" ? 1.5 : style.kind === "check" ? 0.6 : 0);
    lathe(m, cx, cz, y0, onionProfile(r0, R, top - y0), { n, mat, twist });
  });
  const s = R / 4.6;
  m.scope("finial", () => {
    m.prism("gilt", ngon(6, 0.14 * s + 0.05, 0, cx, cz), top - 0.5, top + 0.1);
    ball(m, "gilt", cx, top - 0.05, cz, 0.3 * s + 0.12);
  });
  orthodoxCross(m, cx, cz, top + 0.2, crossTop);
}

/** The Orthodox cross: an upright, a short top bar, the main bar and a slanted foot bar, all facing +z. */
function orthodoxCross(m: MeshBuilder, cx: number, cz: number, y0: number, y1: number): void {
  m.scope("cross", () => {
    const h = y1 - y0;
    const t = Math.max(0.07, h * 0.055);
    m.box("gilt", cx, cz, t, t, y0, y1);
    m.box("gilt", cx, cz, h * 0.55, t * 0.8, y0 + h * 0.62, y0 + h * 0.62 + t);
    m.box("gilt", cx, cz, h * 0.3, t * 0.8, y0 + h * 0.84, y0 + h * 0.84 + t * 0.8);
    const yf = y0 + h * 0.3;
    const f = h * 0.2;
    m.slab("gilt", [
      [cx - f, yf - f * 0.3, cz + t * 0.4], [cx + f, yf + f * 0.3, cz + t * 0.4],
      [cx + f, yf + f * 0.3 + t, cz + t * 0.4], [cx - f, yf - f * 0.3 + t, cz + t * 0.4],
    ], [0, 0, -t * 0.8]);
  });
}

interface Chapel {
  name: string;
  cx: number;
  cz: number;
  /** Apothem of the octagonal body. */
  ap: number;
  /** Top of the body's cornice. */
  top: number;
  /** Top of the kokoshnik gables (the drum stands here). */
  koko: number;
  belt: number;
  /** The window band. */
  win: [number, number];
  /** Windows on every face (1) or every other face (2). */
  winStep: number;
  drumR: number;
  drumTop: number;
  domeR: number;
  domeTop: number;
  crossTop: number;
  dome: DomeStyle;
}

/** An octagonal body standing on the deck: base, belt and cornice in white stone, corner pilasters, windows. */
function octBody(m: MeshBuilder, ring: Ring, cx: number, cz: number, top: number, belt: number, win: [number, number], winStep: number): void {
  m.scope("walls", () => {
    m.prism("brick", ring, DECK - 0.04, top - 0.5, false);
    m.prism("white", grow(ring, 0.12), DECK - 0.04, DECK + 0.35);
    m.prism("white", grow(ring, 0.1), belt, belt + 0.35);
    m.prism("white", grow(ring, 0.28), top - 0.5, top);
  });
  m.scope("pilasters", () => {
    for (const [x, z] of ring) m.prism("white", ngon(4, 0.26, angleAt(x, z, cx, cz), x, z), DECK + 0.35, top - 0.5);
  });
  m.scope("windows", () => {
    for (let i = 0; i < ring.length; i += winStep) {
      const f = edgeWall(ring, i);
      const fw = f.w * 0.5;
      const ys = win[0] + (win[1] - win[0]) * 0.55;
      panel(m, "white", f, pointedPts(fw, win[0] - 0.3, win[1] + 0.35, ys), 0.05);
      panel(m, "window", f, pointedPts(fw * 0.55, win[0], win[1], ys), 0.09);
    }
  });
}

/** A row of kokoshnik gables, one on every face of the ring, from y0 to y1. */
function kokoshniks(m: MeshBuilder, ring: Ring, y0: number, y1: number, widthFrac = 0.96): void {
  m.scope("kokoshniks", () => {
    for (let i = 0; i < ring.length; i++) {
      const f = edgeWall(ring, i);
      const w = f.w * widthFrac;
      const h = y1 - y0;
      panel(m, "white", f, pointedPts(w, y0, y1, y0 + h * 0.3), 0.14, 0.4);
      panel(m, "brick", f, pointedPts(w * 0.62, y0 + h * 0.12, y1 - h * 0.22, y0 + h * 0.36), 0.19, 0.1);
    }
  });
}

/** A round drum: brick, white base and cornice, pilaster strips and arched windows. */
function drum(m: MeshBuilder, cx: number, cz: number, r: number, y0: number, y1: number): void {
  m.scope("drum", () => {
    const d = ngon(16, r, 0, cx, cz);
    m.prism("brick", d, y0 - 0.5, y1 - 0.45, false);
    m.prism("white", grow(d, 0.22), y0 - 0.1, y0 + 0.3);
    m.prism("white", grow(d, 0.32), y1 - 0.45, y1);
    for (let i = 0; i < 16; i++) {
      const f = edgeWall(d, i);
      if (i % 2 === 0) panel(m, "window", f, archPts(f.w * 0.55, y0 + 0.7, y1 - 0.85), 0.05);
      else panel(m, "white", f, rectPts(0.3, y0 + 0.3, y1 - 0.45), 0.1);
    }
  });
}

function chapel(m: MeshBuilder, c: Chapel): void {
  m.scope(c.name, () => {
    const ring = polyAp(8, c.ap, c.cx, c.cz);
    m.scope("body", () => octBody(m, ring, c.cx, c.cz, c.top, c.belt, c.win, c.winStep));
    kokoshniks(m, ring, c.top - 0.05, c.koko);
    m.scope("roof", () => m.loft("brick", ngon(8, (c.ap / Math.cos(Math.PI / 8)) * 0.97, Math.PI / 8, c.cx, c.cz), c.top,
      ngon(8, c.drumR * 1.1, Math.PI / 8, c.cx, c.cz), c.koko - 0.2, false));
    drum(m, c.cx, c.cz, c.drumR, c.koko, c.drumTop);
    onionDome(m, c.cx, c.cz, c.drumTop, c.drumR, c.domeR, c.domeTop, c.crossTop, c.dome);
  });
}

/** The central church of the Intercession: a tall octagon, a ring of gables, the brick tent and its gilt cupola. */
function centralTower(m: MeshBuilder): void {
  const cx = 0;
  const cz = BZ;
  m.scope("central tower", () => {
    const ring = polyAp(8, 5.4, cx, cz);
    m.scope("body", () => octBody(m, ring, cx, cz, 23.97, 10.6, [12.1, 15.4], 1));
    kokoshniks(m, ring, 23.92, 26.82);
    const base = polyAp(8, 4.1, cx, cz);
    m.scope("tent base", () => {
      m.prism("brick", base, 23.9, 28.67, false);
      m.prism("white", polyAp(8, 4.35, cx, cz), 28.67, 29.17);
      for (let i = 0; i < 8; i++) {
        const f = edgeWall(base, i);
        panel(m, "white", f, pointedPts(f.w * 0.42, 26.95, 28.5, 27.9), 0.05);
        panel(m, "window", f, pointedPts(f.w * 0.24, 27.1, 28.3, 27.9), 0.09);
      }
    });
    const y0 = 29.17;
    const y1 = 44.67;
    const lo = polyAp(8, 4.2, cx, cz);
    const hi = polyAp(8, 0.95, cx, cz);
    m.scope("tent", () => {
      m.scope("roof", () => m.loft("brick", lo, y0, hi, y1, false));
      m.scope("ribs", () => {
        for (let i = 0; i < 8; i++) {
          const b: Vec3 = [lo[i]![0], y0, lo[i]![1]];
          const t: Vec3 = [hi[i]![0], y1, hi[i]![1]];
          const d = vnorm([b[0] - cx, 0, b[2] - cz]);
          const tan: Vec3 = [-d[2], 0, d[0]];
          const off = vscale(d, 0.06);
          m.slab("white", [
            vadd(vadd(b, vscale(tan, -0.16)), off), vadd(vadd(b, vscale(tan, 0.16)), off),
            vadd(vadd(t, vscale(tan, 0.07)), off), vadd(vadd(t, vscale(tan, -0.07)), off),
          ], vscale(d, -0.3));
        }
      });
      m.scope("lozenges", () => {
        for (let i = 0; i < 8; i++) {
          const j = (i + 1) % 8;
          const B0: Vec3 = [lo[i]![0], y0, lo[i]![1]];
          const B1: Vec3 = [lo[j]![0], y0, lo[j]![1]];
          const T0: Vec3 = [hi[i]![0], y1, hi[i]![1]];
          const T1: Vec3 = [hi[j]![0], y1, hi[j]![1]];
          const n = vnorm(vcross(vsub(B1, B0), vsub(T0, B0)));
          const out = vdot(n, [B0[0] - cx, 0, B0[2] - cz]) > 0 ? n : vscale(n, -1);
          const at = (s: number, t: number): Vec3 => vadd(lerp3(lerp3(B0, B1, s), lerp3(T0, T1, s), t), vscale(out, 0.04));
          for (const t of [0.1, 0.26, 0.42, 0.58, 0.74]) {
            for (const s of t < 0.5 ? [0.3, 0.7] : [0.5]) {
              const ds = t < 0.5 ? 0.12 : 0.17;
              m.slab("white", [at(s - ds, t), at(s, t - 0.045), at(s + ds, t), at(s, t + 0.045)], vscale(out, -0.2));
            }
          }
        }
      });
    });
    m.scope("lantern", () => {
      const l = ngon(12, 1.0, 0, cx, cz);
      m.prism("brick", l, 44.3, 45.6, false);
      m.prism("white", grow(l, 0.15), 45.6, 45.9);
      m.prism("white", grow(l, 0.12), 44.45, 44.7);
    });
    onionDome(m, cx, cz, 45.9, 0.95, 1.58, 48.07, 50.22, { a: "gilt", b: "gilt", kind: "plain" }, 24);
  });
}

/** The bell tower at the south-east corner: an octagon, an open belfry and a green tent. */
function bellTower(m: MeshBuilder): void {
  const cx = -4.56;
  const cz = 9.63;
  m.scope("bell tower", () => {
    const ring = polyAp(8, 2.3, cx, cz);
    m.scope("body", () => octBody(m, ring, cx, cz, 15.97, 8.6, [10.6, 13.2], 2));
    m.scope("belfry", () => {
      const b = polyAp(8, 2.0, cx, cz);
      m.prism("brick", b, 15.9, 20.17, false);
      for (let i = 0; i < 8; i++) panel(m, "window", edgeWall(b, i), archPts(1.0, 16.2, 18.7), 0.05);
    });
    kokoshniks(m, polyAp(8, 2.0, cx, cz), 20.1, 21.74, 0.9);
    m.scope("tent", () => m.loft("roofGreen", polyAp(8, 1.98, cx, cz), 20.17, polyAp(8, 0.32, cx, cz), 26.17, false));
    onionDome(m, cx, cz, 26.15, 0.36, 0.95, 27.47, 28.72, { a: "gilt", b: "gilt", kind: "plain" }, 16);
  });
}

/** The podium with its arcaded gallery, the terrace deck and the front stairs with their tented porch. */
function podium(m: MeshBuilder): void {
  const P = polyAp(16, 15.5, 0, BZ);
  m.scope("podium", () => {
    m.scope("plinth", () => m.prism("stone", polyAp(16, 16.1, 0, BZ), 0, 0.5));
    m.scope("walls", () => m.prism("brick", P, 0.45, 2.97, false));
    m.scope("cornice", () => m.prism("white", polyAp(16, 15.8, 0, BZ), 2.97, 3.62));
    m.scope("terrace deck", () => m.prism("stone", polyAp(16, 14.6, 0, BZ), 3.5, DECK));
    m.scope("gallery arcade", () => {
      for (let i = 0; i < 16; i++) {
        const f = edgeWall(P, i);
        if (f.n[2] > 0.9) continue; // the stairs come up this face
        for (const u of [-1.55, 1.55]) {
          panel(m, "white", f, archPts(1.7, 0.75, 2.78, u), 0.04);
          panel(m, "window", f, archPts(1.15, 0.9, 2.58, u), 0.08);
        }
      }
    });
  });
  m.scope("stairs", () => {
    for (let k = 0; k < 7; k++) {
      const z1 = 18 - k * 0.95;
      m.box("stone", 0, z1 - 0.5, 6.2 - k * 0.15, 1.0, 0, 0.58 + k * 0.55);
    }
  });
  m.scope("porch", () => {
    const cz = 12.3;
    m.scope("pillars", () => {
      for (const x of [-2.35, 2.35]) for (const z of [10.75, 13.85]) {
        m.box("white", x, z, 0.5, 0.5, 0, 7.2);
      }
    });
    m.scope("arches", () => {
      m.box("brick", 0, cz, 5.2, 3.7, 7.2, 8.67, 0, false);
      m.cap("brick", rect(5.2, 3.7, 0, cz), 7.2, false);
      const front = wall(0, cz + 1.85, 0, 1, 5.2);
      const side = (s: number): Wall => wall(s * 2.6, cz, s, 0, 3.7);
      panel(m, "white", front, archPts(4.0, 7.15, 8.45), 0.04, 0.2);
      for (const s of [-1, 1]) panel(m, "white", side(s), archPts(2.6, 7.15, 8.45), 0.04, 0.2);
      m.box("white", 0, cz, 5.45, 3.95, 8.67, 9.12);
    });
    m.scope("tent", () => m.spire("roofGreen", rect(5.5, 5.5, 0, cz), 9.1, 14.17));
    m.scope("orb", () => ball(m, "gilt", 0, 14.37, cz, 0.4, 10));
  });
}

export function stBasilsCathedral(): MeshBuilder {
  const m = new MeshBuilder(BASIL);
  podium(m);
  centralTower(m);
  const big = { ap: 3.7, belt: 9.07, win: [12.3, 14.5] as [number, number], winStep: 1, drumR: 2.67 };
  const side = { ...big, top: 18.97, koko: 21.21, drumTop: 25.55, domeR: 4.63, domeTop: 31.15, crossTop: 33.5 };
  const axial = { ...big, top: 18.17, koko: 20.41, belt: 8.8, win: [11.85, 14.05] as [number, number], drumTop: 24.75, domeR: 4.46, domeTop: 30.35, crossTop: 32.7 };
  const small = { ap: 2.6, top: 15.47, koko: 17.71, belt: 7.88, win: [10.3, 12.6] as [number, number], winStep: 2, drumR: 1.93, drumTop: 21.05, domeR: 3.35, domeTop: 25.15, crossTop: 27.5 };
  const chapels: Chapel[] = [
    { name: "north chapel", cx: 9, cz: BZ, ...side, dome: { a: "blue", b: "cream", kind: "spiral" } },
    { name: "south chapel", cx: -9, cz: BZ, ...side, dome: { a: "red", b: "cream", kind: "spiral", twist: -1.5 } },
    { name: "east chapel", cx: 0, cz: BZ + 9, ...axial, dome: { a: "green", b: "ochre", kind: "spiral", twist: -1.5 } },
    { name: "west chapel", cx: 0, cz: BZ - 9, ...axial, dome: { a: "green", b: "ochre", kind: "check" } },
    { name: "north-east chapel", cx: 5.59, cz: 3.69, ...small, dome: { a: "green", b: "cream", kind: "check" } },
    { name: "south-east chapel", cx: -5.59, cz: 3.69, ...small, dome: { a: "ochre", b: "green", kind: "spiral" } },
    { name: "south-west chapel", cx: -5.59, cz: -7.49, ...small, dome: { a: "blue", b: "blue", kind: "plain" } },
    { name: "north-west chapel", cx: 5.59, cz: -7.49, ...small, dome: { a: "red", b: "green", kind: "check" } },
  ];
  for (const c of chapels) chapel(m, c);
  bellTower(m);
  return m;
}

// =========================================================================================
// St Nicholas Church, Old Town Square
// =========================================================================================

const NICHOLAS: Record<string, MaterialSpec> = {
  grey: { color: "#ded6c4" },
  white: { color: "#f1ece0" },
  tile: { color: "#b04c31" },
  glass: { color: "#4b5761", roughness: 0.3 },
  copper: { color: "#6fa88f", metallic: 0.2, roughness: 0.6 },
  copperDark: { color: "#4e8571", metallic: 0.2, roughness: 0.6 },
  gilt: { color: "#d8ab3f", metallic: 0.6, roughness: 0.35 },
};

/** Copper with a dark rib every `every` segments. */
const ribbed = (every: number) => (col: number): string => (col % every === 0 ? "copperDark" : "copper");

/** A baroque statue on a small plinth, `s` metres to the top of the head. */
function statue(m: MeshBuilder, x: number, z: number, y0: number, s: number): void {
  m.scope("statue", () => {
    const k = s / 2.4;
    m.box("grey", x, z, 0.9 * k, 0.9 * k, y0 - 0.05, y0 + 0.45 * k);
    m.loft("white", ngon(6, 0.38 * k, 0, x, z), y0 + 0.45 * k, ngon(6, 0.27 * k, 0, x, z), y0 + 1.55 * k, false);
    m.loft("white", ngon(6, 0.27 * k, 0, x, z), y0 + 1.55 * k, ngon(6, 0.22 * k, 0, x, z), y0 + 1.98 * k, true);
    m.box("white", x + 0.2 * k, z, 0.14 * k, 0.14 * k, y0 + 1.6 * k, y0 + 2.3 * k);
    ball(m, "white", x, y0 + 2.18 * k, z, 0.2 * k, 6);
  });
}

/** A baroque cupola: a bell-shaped copper roof on ribs, then an orb, a spire and a cross. */
function cupola(m: MeshBuilder, cx: number, cz: number, y0: number, r0: number, R: number, top: number, n = 24): void {
  const h = top - y0;
  const prof: Pt[] = [[r0, 0], [R, h * 0.12], [R * 0.97, h * 0.3], [R * 0.86, h * 0.5], [R * 0.66, h * 0.7], [R * 0.4, h * 0.87], [R * 0.14, h * 0.97], [0, h]];
  lathe(m, cx, cz, y0, prof, { n, mat: ribbed(n / 8) });
}

function latinCross(m: MeshBuilder, cx: number, cz: number, y0: number, y1: number): void {
  m.scope("cross", () => {
    const h = y1 - y0;
    m.box("gilt", cx, cz, 0.11, 0.11, y0, y1);
    m.box("gilt", cx, cz, 0.11 * 0.9, h * 0.55, y1 - h * 0.37, y1 - h * 0.27);
  });
}

/** One of the two front towers, centred on (cx, cz). */
function frontTower(m: MeshBuilder, name: string, cx: number, cz: number): void {
  const s = Math.sign(cz); // which side: the outer face looks along s * z
  m.scope(name, () => {
    m.scope("shaft", () => {
      m.box("grey", cx, cz, 6.2, 6.2, 0, 1.4);
      m.box("white", cx, cz, 5.8, 5.8, 1.4, 24.0, 0, false);
      m.box("grey", cx, cz, 6.5, 6.5, 11.55, 12.45);
      m.box("grey", cx, cz, 6.9, 6.9, 24.0, 25.2);
    });
    m.scope("pilasters", () => {
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
        const x = cx + dx * 2.75;
        const z = cz + dz * 2.75;
        m.box("white", x, z, 0.94, 0.94, 1.4, 11.55);
        m.box("white", x, z, 0.8, 0.8, 12.45, 23.3);
        m.box("grey", x, z, 1.0, 1.0, 23.3, 24.0);
      }
    });
    m.scope("windows", () => {
      const front = wall(cx - 2.9, cz, -1, 0, 5.8);
      const outer = wall(cx, cz + s * 2.9, 0, s, 5.8);
      const back = wall(cx + 2.9, cz, 1, 0, 5.8);
      for (const f of [front, outer]) {
        panel(m, "grey", f, archPts(2.4, 5.3, 10.75), 0.03);
        panel(m, "glass", f, archPts(1.9, 5.6, 10.4), 0.07);
      }
      for (const f of [outer, back]) {
        panel(m, "grey", f, archPts(2.6, 17.1, 22.4), 0.03);
        panel(m, "glass", f, archPts(2.1, 17.4, 22.1), 0.07);
      }
      panel(m, "grey", front, archPts(2.6, 14.0, 18.9), 0.03);
      panel(m, "glass", front, archPts(2.1, 14.3, 18.6), 0.07);
    });
    m.scope("clock", () => {
      const f = wall(cx - 2.9, cz, -1, 0);
      const disc = ngon(12, 1.15, 0).map(([u, v]): Pt => [u, 21.2 + v]);
      panel(m, "grey", f, disc, 0.05);
      panel(m, "glass", f, ngon(12, 0.85, 0).map(([u, v]): Pt => [u, 21.2 + v]), 0.09);
    });
    m.scope("drum", () => {
      const d = polyAp(8, 3.05, cx, cz);
      m.prism("white", d, 25.15, 28.35, false);
      m.prism("grey", polyAp(8, 3.3, cx, cz), 28.35, 29.05);
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) continue; // the diagonal faces
        panel(m, "glass", edgeWall(d, i), archPts(1.3, 25.7, 28.0), 0.05);
      }
    });
    m.scope("onion", () => {
      const y0 = 29.05;
      const h = 34.5 - y0;
      const R = 3.2;
      const prof: Pt[] = [[2.95, 0], [R, h * 0.12], [R * 0.99, h * 0.26], [R * 0.9, h * 0.42], [R * 0.72, h * 0.58], [R * 0.52, h * 0.72], [R * 0.38, h * 0.84], [R * 0.33, h * 0.93], [R * 0.36, h]];
      lathe(m, cx, cz, y0, prof, { n: 32, mat: ribbed(4), cap: true });
    });
    m.scope("lantern", () => {
      const l = polyAp(8, 1.25, cx, cz);
      m.prism("white", l, 34.35, 36.6, false);
      m.prism("grey", polyAp(8, 1.5, cx, cz), 36.6, 37.0);
      for (let i = 0; i < 8; i += 2) panel(m, "glass", edgeWall(l, i), archPts(0.6, 34.7, 36.3), 0.04);
    });
    m.scope("cupola", () => cupola(m, cx, cz, 37.0, 1.25, 1.35, 39.11, 16));
    m.scope("finial", () => {
      ball(m, "gilt", cx, 39.1, cz, 0.3);
      m.prism("gilt", ngon(4, 0.09, Math.PI / 4, cx, cz), 39.35, 40.75);
    });
    latinCross(m, cx, cz, 40.63, 41.78);
  });
}

/** The arc of the convex front bay: x of the bay's front at z. */
const bayX = (z: number): number => -18.72 + 0.0462 * z * z;

export function stNicholasChurch(): MeshBuilder {
  const m = new MeshBuilder(NICHOLAS);
  const XC = 11.08; // the apse's centre
  const apseRing = (r: number, x0: number, seg = 16): Ring => {
    const pts: Ring = [[x0, r]];
    pts.push([x0, -r]);
    for (let k = 0; k <= seg; k++) {
      const a = -Math.PI / 2 + (k / seg) * Math.PI;
      pts.push([XC + r * Math.cos(a), r * Math.sin(a)]);
    }
    return orient(pts);
  };

  m.scope("plinth", () => {
    m.box("grey", -1.92, 0, 28.2, 18.2, 0, 1.2);
    m.prism("grey", apseRing(8.24, 10.0), 0, 1.2);
  });

  m.scope("nave", () => {
    m.scope("walls", () => m.box("white", -1.92, 0, 26.0, 16.0, 1.2, 16.8, 0, false));
    m.scope("cornice", () => m.box("grey", -1.92, 0, 27.1, 17.1, 16.8, 17.8));
    m.scope("roof", () => {
      const sec: Ring = [[-8.6, 17.78], [8.6, 17.78], [0, 22.4]];
      m.sweep("tile", "x", sec, -15.02, sec, -2.62);
    });
    for (const s of [-1, 1]) {
      m.scope(s < 0 ? "south side" : "north side", () => {
        const xs = [-11.42, -6.62, -1.82, 2.98, 7.78];
        m.scope("pilasters", () => {
          for (const x of xs) {
            m.box("grey", x, s * 8.5, 2.1, 1.2, 1.15, 2.0);
            m.box("white", x, s * 8.45, 1.7, 1.0, 2.0, 15.6);
            m.box("grey", x, s * 8.5, 2.24, 1.2, 15.6, 16.4);
          }
        });
        m.scope("windows", () => {
          for (let b = 0; b < 4; b++) {
            const x = (xs[b]! + xs[b + 1]!) / 2;
            const f = wall(x, s * 8, 0, s);
            panel(m, "grey", f, archPts(3.0, 7.6, 14.0), 0.03);
            panel(m, "glass", f, archPts(2.4, 7.9, 13.7), 0.07);
            m.box("grey", x, s * 8.2, 3.3, 0.9, 7.4, 7.7);
            panel(m, "grey", f, archPts(2.0, 14.25, 16.75), 0.03);
            panel(m, "glass", f, archPts(1.5, 14.45, 16.55), 0.07);
          }
        });
        m.scope("statues", () => {
          for (const x of xs) statue(m, x, s * 8.1, 17.8, 2.41);
        });
      });
    }
  });

  m.scope("apse", () => {
    m.scope("walls", () => m.prism("white", apseRing(7.94, 10.5), 1.2, 16.8, false));
    m.scope("cornice", () => m.prism("grey", apseRing(8.5, 10.5), 16.8, 17.8));
    m.scope("roof", () => {
      const steps: Pt[] = [[8.5, 17.8], [8.3, 18.9], [7.7, 19.85], [6.6, 20.7], [5.0, 21.4], [3.0, 21.95], [1.1, 22.2]];
      for (let k = 0; k + 1 < steps.length; k++) {
        const [r0, y0] = steps[k]!;
        const [r1, y1] = steps[k + 1]!;
        m.loft("tile", apseRing(r0, 2.58), y0, apseRing(r1, 2.58), y1, k + 2 === steps.length);
      }
    });
    m.scope("pilasters", () => {
      for (const deg of [-80, -48, -16, 16, 48, 80]) {
        const a = (deg * Math.PI) / 180;
        const r = 8.2;
        const x = XC + r * Math.cos(a);
        const z = r * Math.sin(a);
        m.box("white", x, z, 1.2, 1.3, 1.2, 15.6, -a);
        m.box("grey", XC + (r + 0.05) * Math.cos(a), (r + 0.05) * Math.sin(a), 1.4, 1.5, 15.6, 16.4, -a);
      }
    });
    m.scope("windows", () => {
      for (const deg of [-64, -32, 0, 32, 64]) {
        const a = (deg * Math.PI) / 180;
        const f = wall(XC + 7.94 * Math.cos(a), 7.94 * Math.sin(a), Math.cos(a), Math.sin(a));
        panel(m, "grey", f, archPts(2.6, 7.6, 13.7), 0.05, 0.4);
        panel(m, "glass", f, archPts(2.0, 7.9, 13.4), 0.09, 0.5);
      }
    });
  });

  m.scope("facade", () => {
    const front: Ring = [];
    for (let k = 0; k <= 10; k++) {
      const z = -6.1 + (k / 10) * 12.2;
      front.push([bayX(z), z]);
    }
    const bay = orient([...front, [-6.52, 6.1], [-6.52, -6.1]]);
    m.scope("bay", () => {
      m.prism("white", bay, 1.2, 21.1, false);
      m.prism("grey", grow(bay, 0.3), 11.15, 12.05);
      m.prism("grey", grow(bay, 0.55), 21.1, 22.2);
    });
    const cols: Pt[] = [[-18.86, -2.15], [-18.86, 2.15], [-16.69, -5.2], [-16.69, 5.2]];
    m.scope("columns", () => {
      for (const [x, z] of cols) {
        m.box("white", x + 0.2, z, 1.5, 1.5, 1.2, 11.0);
        m.box("grey", x, z, 2.0, 2.0, 12.05, 12.7);
        m.prism("white", ngon(12, 0.8, 0, x, z), 12.7, 21.58, false);
        m.box("grey", x, z, 1.8, 1.8, 21.58, 22.03);
      }
    });
    m.scope("portal", () => {
      const f = wall(bayX(0), 0, -1, 0);
      panel(m, "glass", f, archPts(3.8, 1.2, 8.1), 0.08, 0.7);
      m.box("grey", -18.77, 0, 1.4, 5.6, 6.73, 7.28);
      m.box("grey", -18.92, 0, 0.9, 4.4, 7.3, 7.7);
      m.box("grey", -19.02, 0, 1.2, 5.4, 0, 0.5);
      panel(m, "grey", f, archPts(3.6, 13.0, 19.6), 0.03, 0.5);
      panel(m, "glass", f, archPts(3.0, 13.2, 19.3), 0.07, 0.6);
    });
    m.scope("niches", () => {
      for (const s of [-1, 1]) {
        const f = wall(-18.45, s * 3.3, -1, 0);
        panel(m, "grey", f, archPts(1.6, 3.6, 7.9), 0.06, 0.6);
        m.box("grey", -18.75, s * 3.3, 0.8, 1.2, 3.3, 3.6);
        statue(m, -18.75, s * 3.3, 3.6, 2.25);
      }
    });
    m.scope("statues", () => {
      for (const [x, z] of [[-14.54, -5.9], [-17.37, -3.98], [-17.37, 3.98], [-14.54, 5.9]] as Pt[]) statue(m, x, z, 22.2, 2.57);
    });
    m.scope("balustrades", () => {
      for (const s of [-1, 1]) {
        const a: Pt = [-18.85, s * 4.95];
        const b: Pt = [-14.8, s * 2.25];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const ry = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
        const mx = (a[0] + b[0]) / 2;
        const mz = (a[1] + b[1]) / 2;
        m.box("grey", mx, mz, len, 0.5, 22.15, 22.45, ry);
        m.box("grey", mx, mz, len, 0.42, 23.14, 23.36, ry);
        for (let k = 0; k < 7; k++) {
          const t = (k + 0.5) / 7;
          m.box("white", a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.3, 0.3, 22.45, 23.14, ry);
        }
      }
    });
    m.scope("attic", () => {
      const ax = -12.62;
      m.prism("white", ngon(20, 5.45, 0, ax, 0), 22.1, 25.0, false);
      m.prism("grey", ngon(20, 5.85, 0, ax, 0), 25.0, 25.8);
      const prof: Pt[] = [[5.5, 0], [5.25, 0.75], [4.55, 1.45], [3.45, 2.0], [1.9, 2.4], [0, 2.55]];
      m.scope("roof", () => lathe(m, ax, 0, 25.78, prof, { n: 32, mat: ribbed(4) }));
    });
  });

  frontTower(m, "south tower", -14.62, -5.6);
  frontTower(m, "north tower", -14.62, 5.6);

  m.scope("great dome", () => {
    const cx = 2.27;
    const d = ngon(24, 6.3, 0, cx, 0);
    m.scope("drum", () => {
      m.prism("white", d, 17.6, 22.25, false);
      m.prism("grey", ngon(24, 6.75, 0, cx, 0), 22.25, 23.15);
      for (let k = 0; k < 8; k++) {
        const f = edgeWall(d, 3 * k + 1);
        panel(m, "grey", f, archPts(2.1, 18.6, 21.95), 0.03);
        panel(m, "glass", f, archPts(1.6, 18.8, 21.75), 0.07);
        const a = (k * Math.PI) / 4;
        const px = cx + 6.8 * Math.cos(a);
        const pz = -6.8 * Math.sin(a);
        m.box("white", px, pz, 1.05, 0.8, 17.6, 21.7, a);
        m.box("grey", cx + 6.85 * Math.cos(a), -6.85 * Math.sin(a), 1.15, 0.95, 21.7, 22.25, a);
      }
    });
    m.scope("shell", () => {
      const prof: Pt[] = [[6.29, 0], [6.15, 1.05], [5.75, 2.05], [5.05, 2.95], [4.1, 3.75], [2.95, 4.45], [1.85, 4.95]];
      lathe(m, cx, 0, 23.15, prof, { n: 48, mat: ribbed(4), group: 4 });
    });
    m.scope("lantern", () => {
      const l = polyAp(8, 2.05, cx, 0);
      m.prism("white", l, 27.0, 30.15, false);
      m.prism("grey", polyAp(8, 2.4, cx, 0), 30.15, 30.65);
      for (let i = 0; i < 8; i += 2) panel(m, "glass", edgeWall(l, i), archPts(0.9, 28.2, 29.9), 0.04);
    });
    m.scope("cupola", () => cupola(m, cx, 0, 30.65, 1.95, 2.13, 33.21, 24));
    m.scope("finial", () => {
      ball(m, "gilt", cx, 33.5, 0, 0.42);
      m.prism("gilt", ngon(4, 0.11, Math.PI / 4, cx, 0), 33.85, 35.65);
    });
    latinCross(m, cx, 0, 35.4, 36.8);
  });

  m.scope("apse turret", () => {
    const cx = 10.08;
    const cz = -6.42;
    m.scope("shaft", () => {
      m.box("white", cx, cz, 3.4, 3.4, 0, 18.9, 0, false);
      m.box("grey", cx, cz, 3.9, 3.9, 18.9, 19.7);
      panel(m, "glass", wall(cx - 1.7, cz, -1, 0), archPts(1.1, 15.6, 17.75), 0.05);
      panel(m, "glass", wall(cx, cz - 1.7, 0, -1), archPts(1.1, 15.6, 17.75), 0.05);
    });
    m.scope("drum", () => {
      m.prism("white", polyAp(8, 1.6, cx, cz), 19.7, 21.5, false);
      m.prism("grey", polyAp(8, 1.75, cx, cz), 21.5, 21.9);
    });
    m.scope("onion", () => {
      const prof: Pt[] = [[1.45, 0], [1.6, 0.35], [1.5, 0.8], [1.2, 1.3], [0.8, 1.8], [0.55, 2.2], [0.5, 2.45]];
      lathe(m, cx, cz, 21.9, prof, { n: 16, mat: ribbed(2), cap: true });
    });
    m.scope("lantern", () => m.prism("white", polyAp(8, 0.65, cx, cz), 24.3, 25.8, false));
    m.scope("cupola", () => cupola(m, cx, cz, 25.78, 0.7, 0.75, 27.0, 16));
    m.scope("finial", () => {
      ball(m, "gilt", cx, 27.1, cz, 0.16, 6);
      m.prism("gilt", ngon(4, 0.06, Math.PI / 4, cx, cz), 27.2, 28.15);
    });
  });
  return m;
}

/** The catalog fields of the family (meta.json, catalog.ts); a design may override the scale. */
export const CATHEDRAL_CATALOG: CatalogFields = {
  category: "Historical",
  group: "hist_center",
  defaultScale: 1.88,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Every design of the family, by catalog id; `references` is the folder of its source photos under assets/. */
export const CATHEDRALS: ProceduralDesign[] = [
  { id: "bld-st-basils-cathedral", title: "St Basil's Cathedral", build: stBasilsCathedral, references: "st-basils-cathedral", catalog: CATHEDRAL_CATALOG },
  { id: "bld-st-nicholas-church", title: "St Nicholas Church", build: stNicholasChurch, references: "st-nicholas-church", catalog: CATHEDRAL_CATALOG },
];
