// The shared builder of the CSD coaches (csdCoaches.ts): bodies lofted from the
// vlakosimdb XML sections, panels laid on those bodies from native BMP boxes,
// bogies, two-axle running gear, buffers and gangways. Source coordinates are
// the JT7 ones: x along the coach from 0, y up from the rail, z across (+z is
// the z_dec side). The Factory model is (x - centre, y, z): +X forward, +Z right.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { lettering, letteringWidth } from "./cd163.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

export type Pt = [number, number];

/** A rectangle in source metres: x along the coach (or z across, at an end), y up. */
export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** A box from native pixel edges [left, top, right, bottom] on a canvas `height` metres tall, 0.1 m a pixel. */
export function px(b: [number, number, number, number], height: number, uOrigin = 0): Box {
  return { x0: b[0] / 10 + uOrigin, y0: height - b[3] / 10, x1: b[2] / 10 + uOrigin, y1: height - b[1] / 10 };
}

/**
 * A prismatic body: the XML `alongx` section (z, y, symmetric and convex),
 * scaled across by the `alongy` plan (x, half width), its top and bottom
 * clamped by the `alongz` elevation, and painted in horizontal bands.
 */
export interface Volume {
  name: string;
  section: Pt[];
  plan: Pt[];
  top?: Pt[];
  bottom?: Pt[];
  bands: Array<[number, number, string]>;
  /** The end walls' paint, a slab over each end cap. Omit to leave the band colours. */
  endPaint?: string;
  /**
   * Leave out the end cap of a band the elevation clips away at that end (a
   * sloped nose's upper bands), instead of a 2 mm sliver at the clamp height.
   */
  trimCaps?: boolean;
}

export const COACH_PALETTE: Record<string, MaterialSpec> = {
  roof: { color: "#7c7f80", roughness: 0.75 },
  frame: { color: "#a9adac", metallic: 0.2, roughness: 0.5 },
  glass: { color: "#26323c", metallic: 0.2, roughness: 0.15 },
  frosted: { color: "#b9c0c2", roughness: 0.4 },
  seam: { color: "#151716", roughness: 0.9 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  underframe: { color: "#26282a", roughness: 0.85 },
  bogie: { color: "#353739", roughness: 0.8 },
  spring: { color: "#55585c", metallic: 0.2, roughness: 0.6 },
  steel: { color: "#8c9198", metallic: 0.3, roughness: 0.45 },
  wheel: { color: "#46484b", metallic: 0.2, roughness: 0.6 },
  lampHead: { color: "#f3f5f6", roughness: 0.2, lamp: { role: "head" } },
  lampRed: { color: "#c8202c", roughness: 0.3, lamp: { role: "tail" } },
  yellow: { color: "#c8b42a", roughness: 0.5 },
  marking: { color: "#d8c24a", roughness: 0.5 },
};

const lerp = (pts: Pt[], x: number): number => {
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [xa, ya] = pts[i - 1]!;
    const [xb, yb] = pts[i]!;
    if (x <= xb + 1e-9) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return pts[pts.length - 1]![1];
};

/** The convex polygon `poly` (z, y) cut to y0 <= y <= y1. */
function clipY(poly: Pt[], y0: number, y1: number): Pt[] {
  const cut = (ring: Pt[], h: number, above: boolean): Pt[] => {
    const out: Pt[] = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!;
      const b = ring[(i + 1) % ring.length]!;
      const inA = above ? a[1] >= h - 1e-9 : a[1] <= h + 1e-9;
      const inB = above ? b[1] >= h - 1e-9 : b[1] <= h + 1e-9;
      if (inA) out.push(a);
      if (inA !== inB) {
        const t = (h - a[1]) / (b[1] - a[1]);
        out.push([a[0] + t * (b[0] - a[0]), h]);
      }
    }
    return out;
  };
  return cut(cut(poly, y0, true), y1, false);
}

/** Half the width of the section at height y (the convex outline's largest z there). */
export function sectionHalf(section: Pt[], y: number): number {
  let best = 0;
  for (let i = 0; i < section.length; i++) {
    const a = section[i]!;
    const b = section[(i + 1) % section.length]!;
    if ((a[1] - y) * (b[1] - y) > 1e-12 || Math.abs(a[1] - b[1]) < 1e-12) {
      if (Math.abs(a[1] - y) < 1e-9) best = Math.max(best, Math.abs(a[0]));
      continue;
    }
    const t = (y - a[1]) / (b[1] - a[1]);
    best = Math.max(best, Math.abs(a[0] + t * (b[0] - a[0])));
  }
  return best;
}

const halfWidth = (v: Volume): number => Math.max(...v.section.map((p) => Math.abs(p[0])));
const hiAt = (v: Volume, x: number): number => (v.top ? lerp(v.top, x) : Infinity);
const loAt = (v: Volume, x: number): number => (v.bottom ? lerp(v.bottom, x) : -Infinity);
/** The x of every plan and elevation station within the plan, ascending. */
const stations = (v: Volume): number[] =>
  [...new Set([...v.plan, ...(v.top ?? []), ...(v.bottom ?? [])].map((p) => p[0]))]
    .filter((x) => x >= v.plan[0]![0] - 1e-9 && x <= v.plan[v.plan.length - 1]![0] + 1e-9)
    .sort((a, b) => a - b);

export class Coach {
  readonly m: MeshBuilder;
  /** A coach drawing into its own builder, or into `m` (another car of the same articulated set). */
  constructor(palette: Record<string, MaterialSpec>, readonly centre: number, m?: MeshBuilder) {
    this.m = m ?? new MeshBuilder({ ...COACH_PALETTE, ...palette });
  }

  /** Source x to Factory x. */
  X(x: number): number {
    return x - this.centre;
  }

  /**
   * Draws a volume: one open sweep per band per plan/elevation segment, closed
   * only at the two ends (internal caps would be hidden faces that share planes
   * with the panels laid over those stations).
   */
  volume(v: Volume): void {
    const m = this.m;
    const hw0 = halfWidth(v);
    const xs = stations(v);
    const at = (poly: Pt[], x: number, y0 = -Infinity, y1 = Infinity): Ring => {
      // a band the elevation clips away entirely keeps a sliver 2 mm thick, so no
      // ring of a sweep collapses to a line (that would turn its walls inside out)
      const k = lerp(v.plan, x) / hw0;
      const hi = Math.max(hiAt(v, x), y0 + 0.002);
      const lo = Math.min(loAt(v, x), y1 - 0.002);
      return poly.map(([z, y]) => [z * k, Math.min(hi, Math.max(lo, y))]);
    };
    // internal band boundaries sit 2.5 mm above their nominal heights, so the
    // hidden faces between two bands never share a plane with a panel's edge
    const bands = v.bands.map(([y0, y1, mat], i): [number, number, string] => [i > 0 ? y0 + 0.0025 : y0, i < v.bands.length - 1 ? y1 + 0.0025 : y1, mat]);
    for (const [y0, y1, mat] of bands) {
      const poly = clipY(v.section, y0, y1);
      if (poly.length < 3) continue;
      m.scope(`${mat} band`, () => {
        for (let i = 0; i + 1 < xs.length; i++) {
          const a = xs[i]!;
          const b = xs[i + 1]!;
          if (b - a < 1e-6) continue;
          const gone = (x: number) => hiAt(v, x) <= y0 + 1e-6 || loAt(v, x) >= y1 - 1e-6;
          if (gone(a) && gone(b)) continue;
          m.sweep(mat, "x", at(poly, a, y0, y1), this.X(a), at(poly, b, y0, y1), this.X(b), false);
        }
        for (const x of [xs[0]!, xs[xs.length - 1]!]) {
          const s = x === xs[0] ? -1 : 1;
          if (v.trimCaps && (hiAt(v, x) <= y0 + 1e-6 || loAt(v, x) >= y1 - 1e-6)) continue;
          m.slab(mat, at(poly, x, y0, y1).map(([z, y]): Vec3 => [this.X(x), y, z]), [-s * 0.002, 0, 0]);
        }
      });
    }
    if (v.endPaint) {
      const paint = v.endPaint;
      m.scope("end walls", () => {
        for (const x of [xs[0]!, xs[xs.length - 1]!]) {
          const s = x === xs[0] ? -1 : 1;
          // 2.5 mm inside the outline, so its rim never lies on a band's skin (nor
          // on a panel edge, which keeps 5 mm from the body's edges)
          const ring = at(v.section, x);
          const cy = (Math.min(...ring.map((p) => p[1])) + Math.max(...ring.map((p) => p[1]))) / 2;
          const inset = (val: number, c: number) => val + Math.sign(c - val) * 0.0025;
          m.slab(paint, ring.map(([z, y]): Vec3 => [this.X(x) + s * 0.003, inset(y, cy), inset(z, 0)]), [-s * 0.02, 0, 0]);
        }
      });
    }
  }

  /**
   * A flat panel on a volume's side `s` (+1 the +z side), over the side-view
   * box `b`, `proud` metres off the skin and `depth` deep into it. Split at the
   * plan's stations and the section's corners so every piece lies on the skin;
   * edges that would meet the body's own edges are pulled 5 mm inside them.
   */
  sidePanel(v: Volume, mat: string, s: number, b: Box, proud: number, depth = 0.04): void {
    const hw0 = halfWidth(v);
    const ys0 = v.section.map((p) => p[1]);
    const [minY, maxY] = [Math.min(...ys0), Math.max(...ys0)];
    const mid = (b.x0 + b.x1) / 2;
    const yLo = Math.max(minY, loAt(v, mid));
    const yHi = Math.min(maxY, hiAt(v, mid));
    const nudge = (val: number, edge: number, dir: number) => (Math.abs(val - edge) < 1e-6 ? val + dir * 0.005 : val);
    const xA = nudge(b.x0, v.plan[0]![0], 1);
    const xB = nudge(b.x1, v.plan[v.plan.length - 1]![0], -1);
    const yA = nudge(b.y0, yLo, 1);
    const yB = nudge(b.y1, yHi, -1);
    const xs = [xA, ...v.plan.map((p) => p[0]).filter((x) => x > xA + 1e-6 && x < xB - 1e-6), xB];
    const ys = [yA, ...ys0.filter((y) => y > minY + 1e-6 && y < maxY - 1e-6 && y > yA + 1e-6 && y < yB - 1e-6), yB].sort((a, c) => a - c);
    const surf = (x: number, y: number): Vec3 => {
      const yy = Math.min(maxY - 1e-6, Math.max(minY + 1e-6, y));
      return [this.X(x), y, s * ((sectionHalf(v.section, yy) * lerp(v.plan, x)) / hw0 + proud)];
    };
    for (let i = 0; i + 1 < xs.length; i++)
      for (let j = 0; j + 1 < ys.length; j++) {
        const [x0, x1, y0, y1] = [xs[i]!, xs[i + 1]!, ys[j]!, ys[j + 1]!];
        this.m.slab(mat, [surf(x0, y0), surf(x1, y0), surf(x1, y1), surf(x0, y1)], [0, 0, -s * depth]);
      }
  }

  /**
   * A flat panel on a volume's end `e` (+1 the high-x end) over the front-view
   * box `b` (x0..x1 is z across, y up), laid on the end cap and on the plan's
   * end facets wherever the box reaches them.
   */
  endPanel(v: Volume, mat: string, e: number, b: Box, proud: number, depth = 0.04): void {
    const plan = e > 0 ? [...v.plan].reverse() : v.plan;
    const hw0 = halfWidth(v);
    // stations from the end cap inward until the full half width
    const st: Pt[] = [plan[0]!];
    for (let i = 1; i < plan.length && st[st.length - 1]![1] < hw0 - 1e-9; i++) st.push(plan[i]!);
    const ys0 = v.section.map((p) => p[1]);
    const xe = st[0]![0];
    const yLo = Math.max(Math.min(...ys0), loAt(v, xe));
    const yHi = Math.min(Math.max(...ys0), hiAt(v, xe));
    const nudge = (val: number, edge: number, dir: number) => (Math.abs(val - edge) < 1e-6 ? val + dir * 0.005 : val);
    const yA = nudge(b.y0, yLo, 1);
    const yB = nudge(b.y1, yHi, -1);
    const zA = nudge(nudge(b.x0, -hw0, 1), -st[0]![1], 1);
    const zB = nudge(nudge(b.x1, hw0, -1), st[0]![1], -1);
    const pieces: Array<[number, number, number]> = []; // z0, z1, facet (-1 = cap)
    const capHalf = st[0]![1];
    const cut = [-capHalf, capHalf, ...st.slice(1).flatMap((p) => [p[1], -p[1]])];
    const edges = [...new Set([zA, zB, ...cut.filter((z) => z > zA + 1e-6 && z < zB - 1e-6)])].sort((a, c) => a - c);
    for (let i = 0; i + 1 < edges.length; i++) {
      const z0 = edges[i]!;
      const z1 = edges[i + 1]!;
      const mid = Math.abs((z0 + z1) / 2);
      if (mid <= capHalf + 1e-9) pieces.push([z0, z1, -1]);
      else {
        const f = st.findIndex((p, k) => k > 0 && mid <= p[1] + 1e-9);
        if (f > 0) pieces.push([z0, z1, f - 1]);
      }
    }
    const xAt = (z: number, f: number): number => {
      if (f < 0) return st[0]![0];
      const [xa, ha] = st[f]!;
      const [xb, hb] = st[f + 1]!;
      return xa + ((Math.abs(z) - ha) / (hb - ha)) * (xb - xa);
    };
    for (const [z0, z1, f] of pieces) {
      const pt = (z: number, y: number): Vec3 => [this.X(xAt(z, f)) + e * proud, y, z];
      this.m.slab(mat, [pt(z0, yA), pt(z1, yA), pt(z1, yB), pt(z0, yB)], [-e * depth, 0, 0]);
    }
  }

  /** A framed window: the frame over the whole box, the glass inset by `fw`. */
  window(v: Volume, s: number, b: Box, opts: { frame?: string; glass?: string; fw?: number; end?: boolean; sash?: number } = {}): void {
    const fw = opts.fw ?? 0.06;
    const draw = (mat: string, bb: Box, proud: number, depth = 0.04) =>
      opts.end ? this.endPanel(v, mat, s, bb, proud, depth) : this.sidePanel(v, mat, s, bb, proud, depth);
    this.m.scope("frame", () => draw(opts.frame ?? "frame", b, 0.012));
    // the glass is a thin layer in front of the frame: its walls never meet the frame's
    this.m.scope("glass", () => draw(opts.glass ?? "glass", { x0: b.x0 + fw, y0: b.y0 + fw, x1: b.x1 - fw, y1: b.y1 - fw }, 0.022, 0.008));
    // a drop light's horizontal sash bar, `sash` its lower edge, over the glass
    const y = opts.sash;
    if (y !== undefined) this.m.scope("sash", () => draw(opts.frame ?? "frame", { x0: b.x0 + fw - 0.01, y0: y, x1: b.x1 - fw + 0.01, y1: y + 0.07 }, 0.033, 0.009));
  }

  /** A vertical grab handrail on side s at source x, from y0 to y1, standing off the skin. */
  handrail(v: Volume, s: number, x: number, y0: number, y1: number): void {
    const m = this.m;
    const hw = (sectionHalf(v.section, (y0 + y1) / 2) * lerp(v.plan, x)) / halfWidth(v);
    m.prism("steel", ngon(8, 0.015, 0, this.X(x), s * (hw + 0.032)), y0, y1);
    for (const y of [y0 + 0.02, y1 - 0.04]) block(m, "steel", this.X(x) - 0.014, this.X(x) + 0.014, y, y + 0.02, ...side(s, hw - 0.01, hw + 0.032));
  }

  /**
   * A door: a dark seam over the box and the leaf just inside it, in `paint`, or
   * with `paint` "bands" in the body's own paint bands (a cream-over-red door).
   */
  door(v: Volume, s: number, b: Box, paint: string, opts: { end?: boolean; seam?: number } = {}): void {
    const sw = opts.seam ?? 0.025;
    const draw = (mat: string, bb: Box, proud: number, depth = 0.04) =>
      opts.end ? this.endPanel(v, mat, s, bb, proud, depth) : this.sidePanel(v, mat, s, bb, proud, depth);
    this.m.scope("outline", () => draw("seam", b, 0.006));
    const leaf = { x0: b.x0 + sw, y0: b.y0 + sw, x1: b.x1 - sw, y1: b.y1 - sw };
    this.m.scope("leaf", () => {
      if (paint !== "bands") draw(paint, leaf, 0.01, 0.003);
      else
        for (const [y0, y1, mat] of v.bands) {
          const [a, c] = [Math.max(y0, leaf.y0), Math.min(y1, leaf.y1)];
          if (c - a > 1e-6) draw(mat, { ...leaf, y0: a, y1: c }, 0.01, 0.003);
        }
    });
  }

  /**
   * Painted lettering on side s: each line centred at source x, its foot at y,
   * h tall, reading left to right from outside on both sides.
   */
  inscription(v: Volume, s: number, x: number, lines: Array<{ text: string; y: number; h: number }>, proud = 0.006, mat = "marking"): void {
    const hw0 = halfWidth(v);
    for (const line of lines) {
      const w = line.h * 0.58;
      const gap = line.h * 0.16;
      const width = strokeWidth(line.text, w, gap);
      const z = s * ((sectionHalf(v.section, line.y + line.h / 2) * lerp(v.plan, x)) / hw0 + proud);
      const u0 = this.X(x) + (s > 0 ? -width / 2 : width / 2);
      this.m.facets(mat, strokeText(line.text, u0, line.y, line.h, w, gap, s < 0).map(([u, vv]): Vec3 => [u, vv, z]), [0, 0, s]);
    }
  }

  /** Class numerals ("1", "2") on side s, centred at source x, its foot at y. */
  numeral(v: Volume, s: number, text: string, x: number, y: number, h = 0.42, proud = 0.004, mat = "marking"): void {
    const w = h * 0.55;
    const width = letteringWidth(text, w, w * 0.25);
    const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
    const z = s * ((sectionHalf(v.section, y + h / 2) * lerp(v.plan, x)) / hw0 + proud);
    // read left to right from outside: toward +x on the +z side, toward -x on the -z side
    const u0 = this.X(x) + (s > 0 ? -width / 2 : width / 2);
    this.m.facets(mat, lettering(text, u0, y, h, w, w * 0.25, s < 0).map(([u, vv]): Vec3 => [u, vv, z]), [0, 0, s]);
  }

  /** Two buffers at the standard 1.75 m spacing on end e, heads at source x `head`, stocks back to `beam`. */
  buffers(e: number, head: number, beam: number, y = 1.0): void {
    const m = this.m;
    for (const [i, z] of [-0.875, 0.875].entries()) m.scope(`buffer ${i + 1}`, () => {
      const disc = ngon(16, 0.22, 0, z, y);
      const xh = this.X(head);
      m.sweep("steel", "x", disc, xh, disc, xh - e * 0.06);
      const plunger = ngon(10, 0.09, 0, z, y);
      m.sweep("steel", "x", plunger, xh - e * 0.06, plunger, xh - e * 0.2);
      const stock = ngon(10, 0.14, 0, z, y);
      const xb = this.X(beam);
      if (Math.abs(xb - (xh - e * 0.2)) > 0.01) m.sweep("underframe", "x", stock, xh - e * 0.2, stock, xb);
    });
  }

  /** The screw coupling's hook and draw gear on end e: hook face at `head`, back to `beam`. */
  coupling(e: number, head: number, beam: number, y = 1.0): void {
    const [a, b] = [this.X(head) - e * 0.02, this.X(beam)].sort((p, q) => p - q) as [number, number];
    block(this.m, "underframe", a, b, y - 0.11, y + 0.07, -0.07, 0.07);
    const hook: Ring = [[-0.03, y - 0.3], [0.03, y - 0.3], [0.03, y - 0.05], [-0.03, y - 0.05]];
    const xh = this.X(head) - e * 0.1;
    this.m.sweep("steel", "x", hook, xh - 0.04, hook, xh + 0.04);
  }

  /**
   * A two-axle bogie centred at source x `xc`: wheelsets `wb` apart on wheels of
   * radius `r` (flat segment down, so the treads touch y = 0), axle boxes, side
   * frames with coil springs, and a bolster up to `top`.
   */
  bogie(xc: number, wb: number, r: number, top: number): void {
    this.m.bogie(() => this.bogieGeometry(xc, wb, r, top));
  }

  private bogieGeometry(xc: number, wb: number, r: number, top: number): void {
    const m = this.m;
    const ay = r * Math.cos(Math.PI / 24);
    const x = this.X(xc);
    for (const dx of [-wb / 2, wb / 2])
      m.scope("wheelset", () => this.wheelset(x + dx, r));
    m.scope("frame", () => {
      for (const s of [-1, 1]) {
        block(m, "bogie", x - wb / 2 - 0.35, x + wb / 2 + 0.35, ay - 0.02, ay + 0.16, ...side(s, 0.92, 1.06));
        for (const dx of [-wb / 2, wb / 2]) {
          block(m, "bogie", x + dx - 0.16, x + dx + 0.16, ay - 0.13, ay + 0.12, ...side(s, 0.86, 1.08));
          for (const d of [-0.28, 0.28])
            for (let k = 0; k < 3; k++)
              m.prism("spring", ngon(8, 0.07, 0, x + dx + d, s * 0.99), ay + 0.14 + k * 0.05, ay + 0.165 + k * 0.05);
        }
      }
      block(m, "bogie", x - 0.22, x + 0.22, ay + 0.02, Math.max(ay + 0.2, top - 0.03), -1.0, 1.0);
      block(m, "bogie", x - wb / 2 + 0.3, x + wb / 2 - 0.3, ay + 0.04, ay + 0.14, -0.92, 0.92);
    });
  }

  /** One wheelset at Factory x: an axle and two wheels with spoked discs, treads on y = 0. */
  wheelset(x: number, r: number): void {
    const m = this.m;
    const ay = r * Math.cos(Math.PI / 24);
    const axle = ngon(10, 0.075, 0, x, ay);
    m.sweep("steel", "z", axle, -1.02, axle, 1.02);
    for (const s of [-1, 1]) {
      const wheel = ngon(24, r, Math.PI / 24, x, ay);
      const [w0, w1] = side(s, 0.665, 0.8);
      m.sweep("steel", "z", wheel, w0, wheel, w1);
      const disc = ngon(16, r * 0.78, 0, x, ay);
      const [a, b] = side(s, 0.79, 0.82);
      m.sweep("wheel", "z", disc, a, disc, b);
    }
  }

  /**
   * Running gear of a two-axle coach at source x `xa`: the wheelset, an axle box
   * in W-irons (axle guards) under the solebar at `sole`, and a leaf spring.
   */
  axle(xa: number, r: number, sole: number): void {
    const m = this.m;
    const ay = r * Math.cos(Math.PI / 24);
    const x = this.X(xa);
    m.scope("wheelset", () => this.wheelset(x, r));
    m.scope("suspension", () => {
      for (const s of [-1, 1]) {
        block(m, "bogie", x - 0.15, x + 0.15, ay - 0.15, ay + 0.15, ...side(s, 0.86, 1.06));
        for (const d of [-0.32, 0.32]) block(m, "underframe", x + d - 0.04, x + d + 0.04, ay - 0.2, sole, ...side(s, 0.9, 1.02));
        // the leaf spring: a stack of plates, longest on top, on the axle box
        for (let k = 0; k < 4; k++) {
          const half = 0.85 - k * 0.15;
          const y = ay + 0.17 + (3 - k) * 0.035;
          block(m, "spring", x - half, x + half, y, y + 0.03, ...side(s, 0.91, 0.99));
        }
        for (const d of [-0.85, 0.85]) block(m, "underframe", x + d - 0.03, x + d + 0.03, ay + 0.27, sole, ...side(s, 0.92, 0.98));
      }
    });
  }

  /** A side-view polygon (source x, y) swept across z0..z1: underframe boxes, skirts, steps. */
  sideSweep(mat: string, poly: Pt[], z0: number, z1: number): void {
    this.m.sweep(mat, "z", poly.map(([x, y]): [number, number] => [this.X(x), y]), z0, poly.map(([x, y]): [number, number] => [this.X(x), y]), z1);
  }
}
