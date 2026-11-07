// The SBB "Roter Pfeil" railcar's own fittings (chUnits.ts RED_ARROW, docs/models/switzerland-trains.md):
// the low rounded bonnet ahead of each cab - its lower part, the crease and the dome over it, the
// lamps and side grilles, the buffers coming out of its lower front and the hook between them -
// the roof's resistor grids, the pantograph's two fairings and the underfloor equipment. The cab
// face (seriesCab.ts) stands behind the bonnet; the bonnet's sides run back to the face's join.
// Measured on the SBB works drawing L 56926 (assets/sbb-roter-pfeil/, the CLe 2/4 203 - 206):
// 21.5 m over the bonnets, 16.3 m bogie centres, the bonnet 2.0 m long, its dome 2.14 m high.
// No `node:` imports.

import type { MeshBuilder } from "./meshBuilder.ts";
import { ngon, type Ring, type Vec3 } from "./meshCore.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

type Row = readonly [y: number, dF: number, hb: number];

/**
 * The bonnet's slices, ascending: height, the front's distance behind the tip on the centre line
 * and the half width the plan's half ellipse reaches at `D`. The lower part runs up to the crease
 * (1.555 m), the dome from just above it: a little ahead of the lower part at the front (its lip)
 * and narrower at the sides (the ledge), its top meeting the cab under the windscreens.
 */
const ROWS: readonly Row[] = [
  [0.48, 0.34, 1.36], [0.53, 0.17, 1.41], [0.6, 0.08, 1.43], [0.72, 0.03, 1.44], [0.86, 0.005, 1.44], [1.0, 0.0, 1.44], [1.15, 0.015, 1.44],
  [1.3, 0.055, 1.44], [1.44, 0.12, 1.44], [1.555, 0.2, 1.44],
  [1.56, 0.15, 1.33], [1.62, 0.24, 1.31], [1.7, 0.36, 1.25], [1.78, 0.51, 1.18], [1.86, 0.7, 1.1], [1.94, 0.94, 0.96],
  [2.0, 1.15, 0.82], [2.05, 1.38, 0.64], [2.09, 1.57, 0.46], [2.12, 1.76, 0.27], [2.14, 1.92, 0.06],
];
/** Where the plan's half ellipse reaches its half width, behind the tip; the straight sides run on to the cab face's join. */
const D = 2.05;
/** The dark skirt's top on the bonnet. */
const SKIRT = 0.72;
/** Columns per half over the ellipse. */
const N = 8;

/** A point of the bonnet on end e at column phi (-2..2: the ellipse within 1, the straight side beyond) and slice row. */
function point(e: number, xTip: number, dEnd: number, phi: number, r: Row): Vec3 {
  const [y, dF, hb] = r;
  const a = Math.abs(phi), sg = phi < 0 ? -1 : 1;
  let lat: number, d: number;
  if (a <= 1) {
    const th = (a * Math.PI) / 2;
    lat = hb * Math.sin(th);
    d = D - (D - dF) * Math.cos(th);
  } else {
    lat = hb;
    d = D + (a - 1) * (dEnd - D);
  }
  return [e * (xTip - d), y, sg * lat];
}

const lerpRow = (y: number): Row => {
  if (y <= ROWS[0]![0]) return ROWS[0]!;
  for (let i = 1; i < ROWS.length; i++) {
    const a = ROWS[i - 1]!, b = ROWS[i]!;
    if (y <= b[0]) { const t = (y - a[0]) / (b[0] - a[0]); return [y, a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])]; }
  }
  return ROWS[ROWS.length - 1]!;
};

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => { const l = Math.hypot(...a); return l < 1e-12 ? [0, 0, 0] : mul(a, 1 / l); };

/** The surface on the bonnet's lower front or side at (lat, y): the point and its outward normal (on the ellipse). */
function frame(e: number, xTip: number, lat: number, y: number): { p: Vec3; n: Vec3; t: Vec3; b: Vec3 } {
  const at = (l: number, yy: number): Vec3 => {
    const r = lerpRow(yy);
    const phi = (Math.asin(Math.min(1, Math.abs(l) / r[2])) / (Math.PI / 2)) * (l < 0 ? -1 : 1);
    return point(e, xTip, 9, phi, r);
  };
  const h = 1e-3;
  const p = at(lat, y);
  const dl = sub(at(lat + h, y), at(lat - h, y));
  const dy = sub(at(lat, y + h), at(lat, y - h));
  let n = unit(cross(dl, dy));
  // outward: away from the bonnet's inside, a metre behind the point on the centre line
  const inner: Vec3 = [e * (xTip - D - 1), y, 0];
  if (n[0] * (p[0] - inner[0]) + n[2] * (p[2] - inner[2]) < 0) n = mul(n, -1);
  return { p, n, t: unit(dl), b: unit(dy) };
}

/** A flat disc (or polygon) standing `proud` off the bonnet at (lat, y), `depth` deep. */
function plate(m: MeshBuilder, e: number, xTip: number, mat: string, lat: number, y: number, outline: ReadonlyArray<readonly [number, number]>, proud: number, depth: number): void {
  const f = frame(e, xTip, lat, y);
  const pts = outline.map(([a, b]): Vec3 => add(add(f.p, mul(f.n, proud)), add(mul(f.t, a), mul(f.b, b))));
  m.slab(mat, pts, mul(f.n, -depth));
}

/** A patch laid on the bonnet's side over d0..d1 behind the tip (positive lat side s), y0..y1: quads following the surface. */
function sidePatch(m: MeshBuilder, e: number, xTip: number, s: number, mat: string, d0: number, d1: number, y0: number, y1: number, proud: number, nd = 4, ny = 2): void {
  const at = (d: number, y: number): Vec3 => {
    const r = lerpRow(y);
    const c = Math.min(1, Math.max(0, (D - d) / (D - r[1])));
    const phi = (Math.acos(c) / (Math.PI / 2)) * s;
    const p = point(e, xTip, 9, phi, r);
    const f = frame(e, xTip, s * Math.abs(p[2]), y);
    return add(p, mul(f.n, proud));
  };
  for (let i = 0; i < nd; i++)
    for (let j = 0; j < ny; j++) {
      const [da, db] = [d0 + ((d1 - d0) * i) / nd, d0 + ((d1 - d0) * (i + 1)) / nd];
      const [ya, yb] = [y0 + ((y1 - y0) * j) / ny, y0 + ((y1 - y0) * (j + 1)) / ny];
      const q = [at(da, ya), at(db, ya), at(db, yb), at(da, yb)] as const;
      const n = cross(sub(q[1], q[0]), sub(q[3], q[0]));
      const out = frame(e, xTip, s * Math.abs(q[0][2]), ya).n;
      if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) m.quad(mat, q[0], q[1], q[2], q[3]);
      else m.quad(mat, q[0], q[3], q[2], q[1]);
    }
}

/** The colours the bonnet takes: the body's paint, the skirt's and the buffers' heads. */
export interface BonnetPaint { body: string; skirt: string }

/** One bonnet on end e (+1 the +X end), its tip at model x e * xTip, its sides running back to dEnd behind the tip. */
export function drawBonnet(m: MeshBuilder, e: number, xTip: number, dEnd: number, paint: BonnetPaint): void {
  const cols: number[] = [];
  for (let k = -N; k <= N; k++) cols.push(k / N);
  const phis = [-2, ...cols, 2];
  m.scope("skin", () => {
    // the winding that faces out, from a quad on the front at the lamps' height
    const ref = (() => {
      const r0 = ROWS[5]!, r1 = ROWS[6]!;
      const [a, b, c] = [point(e, xTip, dEnd, -0.05, r0), point(e, xTip, dEnd, 0.05, r0), point(e, xTip, dEnd, 0.05, r1)];
      return cross(sub(b, a), sub(c, a))[0] * e > 0;
    })();
    for (let j = 0; j + 1 < ROWS.length; j++) {
      const mat = ROWS[j + 1]![0] <= SKIRT + 1e-6 ? paint.skirt : paint.body;
      m.scope(mat === paint.skirt ? "skirt" : j === 9 ? "crease" : j > 9 ? "dome" : "lower", () => {
        for (let i = 0; i + 1 < phis.length; i++) {
          const a = point(e, xTip, dEnd, phis[i]!, ROWS[j]!), b = point(e, xTip, dEnd, phis[i + 1]!, ROWS[j]!);
          const c = point(e, xTip, dEnd, phis[i + 1]!, ROWS[j + 1]!), d = point(e, xTip, dEnd, phis[i]!, ROWS[j + 1]!);
          if (ref) m.quad(mat, a, b, c, d);
          else m.quad(mat, a, d, c, b);
        }
      });
    }
    // the dome's top, a narrow ridge closed over
    m.scope("dome", () => {
      const top = ROWS[ROWS.length - 1]!;
      const ring = phis.map((ph) => point(e, xTip, dEnd, ph, top));
      for (let i = 1; i + 1 < ring.length; i++) {
        const [a, b, c] = [ring[0]!, ring[i]!, ring[i + 1]!];
        if (cross(sub(b, a), sub(c, a))[1] >= 0) m.tri(paint.body, a, b, c);
        else m.tri(paint.body, a, c, b);
      }
    });
  });
  // the head lamps at the lower front's top corners, under the crease
  m.scope("lamps", () => {
    for (const lat of [-0.8, 0.8]) {
      plate(m, e, xTip, "black", lat, 1.36, ngon(12, 0.11), 0.035, 0.06);
      plate(m, e, xTip, "lampHead", lat, 1.36, ngon(12, 0.08), 0.045, 0.012);
    }
  });
  // the radiator grilles on the bonnet's sides: dark louvres
  m.scope("grilles", () => {
    for (const s of [-1, 1]) {
      sidePatch(m, e, xTip, s, "black", 0.68, 1.52, 1.09, 1.5, 0.008, 8, 4);
      for (let k = 1; k < 8; k++) {
        const d = 0.68 + (0.84 * k) / 8;
        sidePatch(m, e, xTip, s, "rubber", d - 0.012, d + 0.012, 1.11, 1.48, 0.016, 1, 2);
      }
    }
  });
  // the buffers out of the lower front: long red housings, the plungers and round grey heads, 0.45 m
  // ahead of the tip (22.4 m over the buffers); the coupling hook between them
  m.scope("buffers", () => {
    const y = 1.02;
    for (const z of [-0.875, 0.875]) {
      const skin = frame(e, xTip, z, y).p[0];
      const at = (d: number) => e * (xTip - d);
      const ring = (r: number, n = 10): Ring => ngon(n, r, 0, z, y);
      m.scope("housing", () => m.sweep(paint.body, "x", ring(0.16), skin - e * 0.08, ring(0.12), at(-0.12)));
      m.scope("plunger", () => m.sweep("steel", "x", ring(0.08, 8), at(-0.1), ring(0.08, 8), at(-0.4)));
      m.scope("head", () => m.sweep("steel", "x", ring(0.2, 14), at(-0.4), ring(0.2, 14), at(-0.45)));
    }
    m.scope("hook", () => {
      const [x0, x1] = [at0(e, xTip, 0.08), at0(e, xTip, -0.3)];
      block(m, "steel", Math.min(x0, x1), Math.max(x0, x1), 0.97, 1.05, -0.05, 0.05);
      const [h0, h1] = [at0(e, xTip, -0.24), at0(e, xTip, -0.32)];
      block(m, "steel", Math.min(h0, h1), Math.max(h0, h1), 0.88, 0.99, -0.05, 0.05);
    });
  });
}

const at0 = (e: number, xTip: number, d: number) => e * (xTip - d);

/** An elliptical ring in (z, y): half width a, half height b, centred (z, y). */
const oval = (n: number, a: number, b: number, z: number, y: number): Ring => Array.from({ length: n }, (_, i) => [z + a * Math.cos((2 * Math.PI * i) / n), y + b * Math.sin((2 * Math.PI * i) / n)] as [number, number]);

export interface ArrowRoof {
  /** The crown's height. */
  C: number;
  /** The roof's resistor grids: d spans behind the +X tip (the cab without the pantograph). */
  resistors: ReadonlyArray<readonly [number, number]>;
  /** The cab face's join behind the tip. */
  dJoin: number;
  roof: string;
}

/** The roof: the resistor grids over the +X half, the two fairings either side of the pantograph (at x, over the -X end). */
export function arrowRoof(m: MeshBuilder, X: (d: number) => number, r: ArrowRoof, panX: number): void {
  m.scope("resistors", () => {
    for (const [a, b] of r.resistors) {
      const [x0, x1] = [X(b - r.dJoin), X(a - r.dJoin)];
      block(m, "under", x0, x1, r.C - 0.1, r.C + 0.03, -0.48, 0.48);
      const n = Math.round((x1 - x0) / 0.25);
      for (let k = 0; k <= n; k++) {
        const x = x0 + 0.04 + ((x1 - x0 - 0.08) * k) / n;
        block(m, "steel", x - 0.02, x + 0.02, r.C + 0.03, r.C + 0.1, -0.44, 0.44);
      }
    }
  });
  // two streamlined fairings either side of the pantograph's insulators, their ends rounded down
  m.scope("pantograph fairings", () => {
    for (const z of [-0.64, 0.64]) {
      const y = r.C + 0.08, k = 0.13, h = 0.17;
      // along x from the pantograph (the -X end's tip lies toward -x): 3.1 m long, reaching on toward the cab's brow
      const st: Array<[number, number]> = [[-1.85, 0.25], [-1.6, 0.75], [-1.3, 1], [1.0, 1], [1.2, 0.75], [1.3, 0.3]];
      for (let i = 0; i + 1 < st.length; i++) {
        const [a, sa] = st[i]!, [b, sb] = st[i + 1]!;
        m.sweep(r.roof, "x", oval(10, k * sa, h * sa, z, y - h * (1 - sa) * 0.6), panX + a, oval(10, k * sb, h * sb, z, y - h * (1 - sb) * 0.6), panX + b, i === 0 || i === st.length - 2);
      }
    }
  });
}

/** The underfloor between the bogies: the equipment box and two air reservoirs. */
export function arrowUnderfloor(m: MeshBuilder, X: (d: number) => number, trucks: readonly number[], B: number, W: number): void {
  m.scope("underfloor", () => {
    const [x0, x1] = [X(trucks[1]! - 2.4), X(trucks[0]! + 2.4)];
    block(m, "under", x0 + 2.5, x1 - 1.2, B - 0.32, B + 0.02, -W * 0.72, W * 0.72);
    for (const z of [-0.55, 0.55]) m.sweep("under", "x", ngon(12, 0.17, 0, z, B - 0.2), x0 + 0.3, ngon(12, 0.17, 0, z, B - 0.2), x0 + 2.2);
  });
}

/** Everything the series kit leaves to the railcar: both bonnets, the roof equipment, the underfloor. */
export function arrowFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }, r: ArrowRoof & { B: number; W: number; paint: BonnetPaint }): void {
  const L = car.length;
  m.scope("bonnet", () => drawBonnet(m, 1, X(-r.dJoin), r.dJoin, r.paint));
  m.scope("rear bonnet", () => drawBonnet(m, -1, -X(L + r.dJoin), r.dJoin, r.paint));
  arrowRoof(m, X, r, X(car.trucks[1]! - 1.5));
  arrowUnderfloor(m, X, car.trucks, r.B, r.W);
}
