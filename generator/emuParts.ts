// Shared parts of the Czech electric multiple units: the CD 471 CityElefant
// family (emu471.ts) and the CD 680 Pendolino (emu680.ts). Bodies are lofted by
// the coach builder (csdCoachParts.ts); this module adds what a multiple unit
// has and a coach has not: a single-arm pantograph, a centre buffer coupler, a
// sloped cab front to lay panels on, and the unit's catalog fields. No `node:`
// imports. See docs/models/czech-emus.md.

import { ngon, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { tubeX } from "./cd163.ts";
import type { CatalogFields, ParamSpec } from "./design.ts";

/** The catalog fields of an electric multiple unit's cars: a powered unit that carries passengers. */
export const EMU_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "unit",
  traction: "electric",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** The catalog fields of a diesel railcar or diesel multiple unit. */
export const DMU_CATALOG: CatalogFields = { ...EMU_CATALOG, traction: "diesel" };

/** The CSD/CD check digit of a six-digit traction number (weights 2, 1, ... from the right; digit sums). */
export function tractionCheckDigit(six: string): number {
  const d = [...six.replace(/\D/g, "")].map(Number).reverse();
  const sum = d.reduce((a, x, i) => a + (i % 2 === 0 ? Math.floor((2 * x) / 10) + ((2 * x) % 10) : x), 0);
  return (10 - (sum % 10)) % 10;
}

/** "ABC DEF-G": a class and serial with its check digit (`471`, `014` -> `471 014-1`). */
export function tractionNumber(cls: string, serial: string): string {
  return `${cls} ${serial}-${tractionCheckDigit(cls + serial)}`;
}

/** An enum parameter from a record of values: `{ key: title }`, the default first. */
export function enumParam(name: string, title: string, values: Record<string, string>): ParamSpec {
  const keys = Object.keys(values);
  return { name, title, default: keys[0]!, values: keys.map((value) => ({ value, title: values[value]! })) };
}

/** A post insulator standing on y0: a core with `sheds` discs and a steel cap. */
export function insulator(m: MeshBuilder, x: number, z: number, y0: number, y1: number, sheds: number): void {
  m.prism("insulator", ngon(6, 0.04, 0, x, z), y0, y1 - 0.03);
  const span = y1 - y0 - 0.1;
  for (let i = 0; i < sheds; i++) {
    const y = y0 + 0.04 + (span * i) / Math.max(1, sheds - 1);
    m.prism("insulator", ngon(8, 0.07, Math.PI / 8, x, z), y, y + 0.018);
  }
  m.prism("steel", ngon(6, 0.05, Math.PI / 6, x, z), y1 - 0.035, y1);
}

export interface PantographSpec {
  /** Factory x of the base frame's centre. */
  x: number;
  /** The roof the insulators stand on. */
  roof: number;
  /** +1 when the hinge is at the +x end of the base, -1 at the -x end. */
  hinge: number;
  raised: boolean;
  /** Lower and upper arm lengths (m). */
  lower?: number;
  upper?: number;
  /** How far the raised head stands above the base frame. */
  rise?: number;
}

/**
 * A single-arm pantograph on four insulators: base frame, A-frame lower arm,
 * push rod, upper arm and a two-strip collector head with drooping horns. The
 * raised linkage is unfolded by intersecting circles about the hinge and the
 * head, so neither arm stretches (as cd163.ts does). Returns the head's height.
 */
export function pantograph(m: MeshBuilder, p: PantographSpec): number {
  const h = p.hinge;
  const xc = p.x;
  const y = p.roof + 0.2;
  const L1 = p.lower ?? 1.6;
  const L2 = p.upper ?? 1.2;
  m.scope("insulators", () => {
    for (const dx of [-0.5, 0.5]) for (const z of [-0.45, 0.45]) insulator(m, xc + dx, z, p.roof - 0.01, y, 2);
  });
  m.scope("base", () => {
    for (const z of [-0.45, 0.45]) block(m, "pantograph", xc - 0.65, xc + 0.65, y, y + 0.06, z - 0.03, z + 0.03);
    for (const dx of [-0.58, 0.58]) block(m, "pantograph", xc + dx - 0.03, xc + dx + 0.03, y - 0.005, y + 0.055, -0.48, 0.48);
    const [a, b] = [xc + h * 0.1, xc + h * 0.45].sort((q, r) => q - r) as [number, number];
    block(m, "pantograph", a, b, y + 0.05, y + 0.16, -0.15, 0.15); // the drive
  });
  const xh = xc + h * 0.55;
  const hx = xc + h * 0.1;
  const headY = y + 0.3 + (p.raised ? (p.rise ?? 1.1) : 0);
  // local u runs from the hinge toward the head, v up from the hinge shaft
  let ku = L1;
  let kv = 0.09;
  if (p.raised) {
    const du = h * (xh - hx);
    const dv = headY - 0.02 - (y + 0.11);
    const distance = Math.hypot(du, dv);
    const along = (L1 ** 2 - L2 ** 2 + distance ** 2) / (2 * distance);
    const across = Math.sqrt(Math.max(0, L1 ** 2 - along ** 2));
    // the knee bends away from the hinge, beyond the head
    ku = (along * du + across * dv) / distance;
    kv = (along * dv - across * du) / distance;
  }
  const kx = xh - h * ku;
  const ky = y + 0.11 + kv;
  m.scope("arms", () => {
    for (const s of [-1, 1]) block(m, "pantograph", xh - 0.04, xh + 0.04, y + 0.04, y + 0.14, ...side(s, 0.34, 0.42));
    const shaft = ngon(8, 0.035, 0, xh, y + 0.11);
    m.sweep("pantograph", "z", shaft, -0.4, shaft, 0.4);
    m.scope("lower arms", () => {
      for (const s of [-1, 1]) tubeX(m, "pantograph", 0.04, xh, y + 0.11, s * 0.28, kx, ky, s * 0.04);
    });
    tubeX(m, "pantograph", 0.016, xc + h * 0.68, y + 0.08, 0, kx + (xh - kx) * 0.08, ky - 0.03, 0, 6); // the push rod
    const knee = ngon(8, 0.05, 0, kx, ky + 0.005);
    m.sweep("pantograph", "z", knee, -0.08, knee, 0.08);
    m.scope("upper arms", () => {
      for (const s of [-1, 1]) tubeX(m, "pantograph", 0.026, kx, ky + 0.02, s * 0.04, hx, headY, s * 0.3);
    });
  });
  m.scope("head", () => {
    for (const s of [-1, 1]) block(m, "pantograph", hx - 0.15, hx + 0.15, headY - 0.005, headY + 0.025, ...side(s, 0.26, 0.34));
    for (const dx of [-0.12, 0.12]) {
      const x = hx + dx;
      block(m, "carbon", x - 0.03, x + 0.03, headY + 0.02, headY + 0.07, -0.6, 0.6);
      for (const s of [-1, 1]) {
        const top: Ring = [[x - 0.03, headY + 0.02], [x + 0.03, headY + 0.02], [x + 0.03, headY + 0.07], [x - 0.03, headY + 0.07]];
        const tip: Ring = [[x - 0.02, headY - 0.07], [x + 0.02, headY - 0.07], [x + 0.02, headY - 0.03], [x - 0.02, headY - 0.03]];
        m.sweep("pantograph", "z", s > 0 ? top : tip, s > 0 ? 0.59 : -0.9, s > 0 ? tip : top, s > 0 ? 0.9 : -0.59);
      }
    }
  });
  return headY + 0.07;
}

/**
 * A centre buffer coupler (Scharfenberg type) on end e: the draw gear from the
 * headstock at x `beam` to the coupler head whose face is at x `face`, its
 * centre `y` above the rail.
 */
export function centreCoupler(m: MeshBuilder, e: number, beam: number, face: number, y: number, mat = "coupler"): void {
  const [a, b] = [beam, face - e * 0.32].sort((p, q) => p - q) as [number, number];
  m.scope("draw bar", () => {
    const bar = ngon(8, 0.07, Math.PI / 8, 0, y);
    m.sweep("underframe", "x", bar, a, bar, b);
  });
  m.scope("head", () => {
    const [c, d] = [face - e * 0.32, face - e * 0.04].sort((p, q) => p - q) as [number, number];
    block(m, mat, c, d, y - 0.16, y + 0.16, -0.17, 0.17);
    const [f, g] = [face - e * 0.04, face].sort((p, q) => p - q) as [number, number];
    block(m, mat, f, g, y - 0.13, y + 0.13, -0.14, 0.14);
    // the guide horn below the face plate
    block(m, mat, Math.min(c, d) + 0.04, Math.max(c, d) - 0.04, y - 0.3, y - 0.16, -0.06, 0.06);
  });
}

/**
 * A flat panel on a sloped cab front that is a plane through (x0, y0) and
 * (x1, y1) seen from the side (x a function of y), between heights y0 <= ya <
 * yb <= y1 and across za..zb: `proud` off the plane, `depth` into it. `e` is
 * the end (+1 the cab faces +x).
 */
export function slopePanel(m: MeshBuilder, mat: string, e: number, plane: { x0: number; y0: number; x1: number; y1: number }, za: number, zb: number, ya: number, yb: number, proud: number, depth = 0.02): void {
  const t = (yy: number) => (yy - plane.y0) / (plane.y1 - plane.y0);
  const xAt = (yy: number) => plane.x0 + t(yy) * (plane.x1 - plane.x0);
  // the outward normal of the plane in the (x, y) side view
  const dx = plane.x1 - plane.x0;
  const dy = plane.y1 - plane.y0;
  const l = Math.hypot(dx, dy);
  const k = dy * e >= 0 ? 1 : -1;
  const n: [number, number] = [(k * dy) / l, (-k * dx) / l];
  const pt = (z: number, yy: number): Vec3 => [xAt(yy) + n[0] * proud, yy + n[1] * proud, z];
  m.slab(mat, [pt(za, ya), pt(zb, ya), pt(zb, yb), pt(za, yb)], [-n[0] * depth, -n[1] * depth, 0]);
}

/** A rectangular block between two x values in either order. */
export function blockX(m: MeshBuilder, mat: string, xa: number, xb: number, y0: number, y1: number, z0: number, z1: number): void {
  block(m, mat, Math.min(xa, xb), Math.max(xa, xb), y0, y1, z0, z1);
}
