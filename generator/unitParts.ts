// Shared parts of the foreign multiple units transferred from vlakosimdb: the DB
// 628 (db628.ts), the MAV MDmot set (mavMdmot.ts), the ICE 1 (ice1.ts) and the
// TGV (tgv.ts). Bodies are lofted by the coach builder (csdCoachParts.ts); this
// module adds the side-box mapping of a car whose BMP has its cab on the left,
// a modern two-axle bogie with coil and air springs, round lamps and roof boxes.
// No `node:` imports. See docs/models/foreign-units.md.

import { ngon, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import { coil } from "./cd163.ts";
import type { Box, Coach, Pt } from "./csdCoachParts.ts";
import { block, side } from "./vehicleParts.ts";

/** A native pixel box [left, top, right, bottom], pixel edges, origin top left. */
export type PxBox = [number, number, number, number];

/**
 * The column-to-body mapping of one car: native column u (0.1 m a pixel) to
 * body metres b = k * (x0 - u / 10), so the BMP's left edge (a cab) lands at
 * the high b end, the +X end of the model; heights are v -> H - v / 10, scaled by kY.
 */
export interface SideMap {
  /** Source x (metres along the BMP) of body metre 0: the -X coupling plane. */
  x0: number;
  /** The canvas height in metres. */
  H: number;
  /** Length scale (published over source), default 1. */
  k?: number;
  /** Height scale, default 1. */
  kY?: number;
}

/** Source x (metres from the BMP's left edge) to body metres. */
export const bOf = (s: SideMap, x: number): number => (s.k ?? 1) * (s.x0 - x);

/** A native side box as a body box. */
export function sideBox(s: SideMap, b: PxBox): Box {
  const [x0, x1] = [bOf(s, b[0] / 10), bOf(s, b[2] / 10)].sort((p, q) => p - q) as [number, number];
  const kY = s.kY ?? 1;
  return { x0, x1, y0: kY * (s.H - b[3] / 10), y1: kY * (s.H - b[1] / 10) };
}

/** A polyline in source (x, y) as ascending body (b, y), y scaled by kY. */
export function toBody(s: SideMap, pts: Pt[]): Pt[] {
  const kY = s.kY ?? 1;
  return pts.map(([x, y]): Pt => [bOf(s, x), y * kY]).sort((a, c) => a[0] - c[0]);
}

export interface BogieSpec {
  /** Wheelbase (m). */
  wb: number;
  /** Wheel radius (m). */
  r: number;
  /** A powered bogie: traction motors between the axles. */
  motor?: boolean;
  /** The bolster's top: where the body rests. */
  top: number;
  /** Air springs (a modern bogie) or a coil-sprung bolster. */
  air?: boolean;
  /** Half the side frames' spacing (m), default 1.0. */
  frame?: number;
}

/**
 * A two-axle bogie at Factory x: wheelsets, side frames with axle boxes on coil
 * springs, a bolster on air springs (or coils), brake units, and traction motors
 * when powered. Treads on y = 0.
 */
export function unitBogie(c: Coach, x: number, b: BogieSpec): void {
  const m = c.m;
  const ay = b.r * Math.cos(Math.PI / 24);
  const fz = b.frame ?? 1.0;
  const h = b.wb / 2;
  for (const dx of [-h, h]) m.scope("wheelset", () => c.wheelset(x + dx, b.r));
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      // the side frame: high over the axle boxes, dropped between them
      block(m, "bogie", x - h - 0.42, x - h + 0.25, ay + 0.06, ay + 0.24, ...side(s, fz - 0.07, fz + 0.07));
      block(m, "bogie", x + h - 0.25, x + h + 0.42, ay + 0.06, ay + 0.24, ...side(s, fz - 0.07, fz + 0.07));
      block(m, "bogie", x - h + 0.25, x + h - 0.25, ay - 0.08, ay + 0.12, ...side(s, fz - 0.07, fz + 0.07));
      for (const dx of [-h, h]) {
        // the axle box and its pair of primary coils
        block(m, "bogie", x + dx - 0.16, x + dx + 0.16, ay - 0.12, ay + 0.06, ...side(s, fz - 0.1, fz + 0.1));
        for (const d of [-0.24, 0.24]) coil(m, "spring", x + dx + d, s * fz, ay - 0.02, ay + 0.06, 0.06, 1, 8);
      }
    }
    // the transoms
    for (const d of [-0.25, 0.25]) block(m, "bogie", x + d - 0.06, x + d + 0.06, ay - 0.06, ay + 0.1, -fz + 0.07, fz - 0.07);
  });
  m.scope("bolster", () => {
    const top = Math.max(b.top, ay + 0.36);
    block(m, "bogie", x - 0.2, x + 0.2, top - 0.12, top, -fz - 0.05, fz + 0.05);
    for (const s of [-1, 1]) {
      if (b.air) {
        const bag = ngon(12, 0.2, 0, x, s * fz);
        m.loft("rubber", bag, ay + 0.12, ngon(12, 0.24, 0, x, s * fz), (ay + 0.12 + top - 0.12) / 2, false);
        m.loft("rubber", ngon(12, 0.24, 0, x, s * fz), (ay + 0.12 + top - 0.12) / 2, bag, top - 0.12, false);
      } else coil(m, "spring", x, s * fz, ay + 0.12, top - 0.12, 0.13, 3, 10);
    }
  });
  m.scope("brakes", () => {
    // a brake shoe unit inside each wheel
    for (const dx of [-h, h]) {
      const [a, c2] = [x + dx - Math.sign(dx) * (b.r + 0.1), x + dx - Math.sign(dx) * (b.r + 0.02)].sort((p, q) => p - q) as [number, number];
      for (const s of [-1, 1]) block(m, "underframe", a, c2, ay - 0.07, ay + 0.07, ...side(s, 0.56, 0.74));
    }
  });
  if (b.motor)
    m.scope("traction motors", () => {
      for (const dx of [-h, h]) block(m, "motor", x + dx * 0.45 - 0.22, x + dx * 0.45 + 0.22, ay - 0.2, ay + 0.18, -0.55, 0.55);
    });
}

/** A round lamp lens on an end wall: a disc of radius r at (z, y), from wall x `x0` outward by `t` along e. */
export function endLamp(m: MeshBuilder, mat: string, e: number, x0: number, z: number, y: number, r: number, t = 0.02, sides = 12): void {
  const lens = ngon(sides, r, 0, z, y);
  m.sweep(mat, "x", lens, x0, lens, x0 + e * t);
}

/** A roof box swept along x between Factory xa and xb: a trapezoid `w` wide at its foot y0, `h` tall. */
export function roofBox(m: MeshBuilder, mat: string, xa: number, xb: number, y0: number, w: number, h: number, inset = 0.15): void {
  const ring: Ring = [[-w / 2, y0], [w / 2, y0], [w / 2 - inset, y0 + h], [-w / 2 + inset, y0 + h]];
  m.sweep(mat, "x", ring, Math.min(xa, xb), ring, Math.max(xa, xb));
}
