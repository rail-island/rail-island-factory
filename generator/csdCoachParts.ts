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
import { doorLeaves, openable, type DoorMotion } from "./doors.ts";

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
  /**
   * Doorways through the sides (an inward-opening door's leaf box, `doorOpening`):
   * the shell is left open over each, with a dark vestibule behind it, so leaves
   * that fold or swing inward stay in sight (doors.ts).
   */
  openings?: Opening[];
}

/** A doorway through side `s` of a volume, over the side-view box x0..x1, y0..y1 (source metres). */
export interface Opening extends Box {
  s: number;
}

/** How deep a doorway's vestibule reaches into the body (metres). */
const VESTIBULE_DEPTH = 0.6;

export const COACH_PALETTE: Record<string, MaterialSpec> = {
  roof: { color: "#7c7f80", roughness: 0.75 },
  frame: { color: "#a9adac", metallic: 0.2, roughness: 0.5 },
  glass: { color: "#26323c", metallic: 0.2, roughness: 0.15, glass: true },
  frosted: { color: "#b9c0c2", roughness: 0.4, glass: true },
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

  /** Runs `fn` with this coach drawing into `mm` (a mechanism's scratch builder). */
  private drawingInto<T>(mm: MeshBuilder, fn: () => T): T {
    const self = this as { m: MeshBuilder };
    const old = self.m;
    self.m = mm;
    try {
      return fn();
    } finally {
      self.m = old;
    }
  }

  /** The doorway a door over `b` on side s opens (its leaf box, inside a `seam` wide outline): see `Volume.openings`. */
  doorOpening(s: number, b: Box, seam = 0.025): Opening {
    return { s, x0: b.x0 + seam, y0: b.y0 + seam, x1: b.x1 - seam, y1: b.y1 - seam };
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
    const opens = v.openings ?? [];
    // a doorway's edges are stations too, so its span is whole segments
    const xs = opens.length ? [...new Set([...stations(v), ...opens.flatMap((o) => [o.x0, o.x1])])].sort((a, b) => a - b) : stations(v);
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
          if (this.doorwaySegment(v, mat, y0, y1, a, b, (x, p0, p1) => at(clipY(v.section, p0, p1), x, p0, p1))) continue;
          m.sweep(mat, "x", at(poly, a, y0, y1), this.X(a), at(poly, b, y0, y1), this.X(b), false);
        }
        for (const x of [xs[0]!, xs[xs.length - 1]!]) {
          const s = x === xs[0] ? -1 : 1;
          if (v.trimCaps && (hiAt(v, x) <= y0 + 1e-6 || loAt(v, x) >= y1 - 1e-6)) continue;
          m.slab(mat, at(poly, x, y0, y1).map(([z, y]): Vec3 => [this.X(x), y, z]), [-s * 0.002, 0, 0]);
        }
      });
    }
    this.vestibules(v);
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
   * Draws band `mat` (y0..y1, as the shell's band boundaries lie) of volume `v`
   * from source x `a` to `b` when the segment lies over one of its doorways
   * (`Volume.openings`), and returns true; returns false, drawing nothing, for a
   * segment clear of them. The band goes in pieces at the doorways' heights, a
   * piece within one without that side's wall; the cut runs 2 mm beyond sill and
   * head, under the door's frame and off the frame's own walls. `ring(x, y0, y1)`
   * is the band piece's ring at x, as the shell's sweep draws it.
   */
  doorwaySegment(v: Volume, mat: string, y0: number, y1: number, a: number, b: number, ring: (x: number, y0: number, y1: number) => Ring): boolean {
    const cut = (v.openings ?? []).filter((o) => o.x0 <= a + 1e-9 && b <= o.x1 + 1e-9);
    if (!cut.length) return false;
    const hole = (o: Opening): [number, number] => [o.y0 - 0.002, o.y1 + 0.002];
    const ys = [...new Set([y0, y1, ...cut.flatMap(hole).filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6)])].sort((p, q) => p - q);
    for (let k = 0; k + 1 < ys.length; k++) {
      const [p0, p1] = [ys[k]!, ys[k + 1]!];
      if (clipY(v.section, p0, p1).length < 3) continue;
      const open = cut.filter((o) => hole(o)[0] <= p0 + 1e-6 && p1 <= hole(o)[1] + 1e-6).map((o) => o.s);
      const [ra, rb] = [ring(a, p0, p1), ring(b, p0, p1)];
      if (!open.length) this.m.sweep(mat, "x", ra, this.X(a), rb, this.X(b), false);
      else this.openWalls(mat, ra, this.X(a), rb, this.X(b), open);
    }
    return true;
  }

  /** The dark vestibules behind volume `v`'s doorways (`Volume.openings`). */
  vestibules(v: Volume): void {
    (v.openings ?? []).forEach((o, i) => this.m.scope(`vestibule ${i + 1}`, () => this.vestibule(v, o)));
  }

  /**
   * The walls of a band piece swept from ring `ra` at Factory x `xa` to `rb` at
   * `xb` (rings of (z, y), as `volume` sweeps them), leaving out the chords across
   * the body and the wall on every side in `open`: the shell over a doorway.
   */
  private openWalls(mat: string, ra: Ring, xa: number, rb: Ring, xb: number, open: number[]): void {
    const n = ra.length;
    const [cz, cy] = [ra.reduce((t, p) => t + p[0], 0) / n, ra.reduce((t, p) => t + p[1], 0) / n];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const [za, ya] = ra[i]!;
      const [zb, yb] = ra[j]!;
      if (Math.abs(ya - yb) < 1e-9 && za * zb < 0) continue; // a chord, inside the body
      if (open.some((s) => s * za > 1e-6 && s * zb > 1e-6)) continue; // the doorway's side
      const out: Vec3 = [0, (ya + yb) / 2 - cy, (za + zb) / 2 - cz];
      const A: Vec3 = [xa, ya, za];
      const B: Vec3 = [xa, yb, zb];
      const C: Vec3 = [xb, rb[j]![1], rb[j]![0]];
      const D: Vec3 = [xb, rb[i]![1], rb[i]![0]];
      this.m.facets(mat, [A, B, C, A, C, D], out);
    }
  }

  /**
   * The dark vestibule behind doorway `o`: a floor, a ceiling, a back wall
   * VESTIBULE_DEPTH inside the skin and the two side walls, all facing the
   * doorway. Floor and ceiling stand 3 mm (or 6, 9) inside the doorway, clear
   * of the shell's chords at its sill and head and at the bands' boundaries.
   */
  private vestibule(v: Volume, o: Opening): void {
    const k = lerp(v.plan, (o.x0 + o.x1) / 2) / halfWidth(v);
    const skin = (y: number) => o.s * sectionHalf(v.section, y) * k;
    // the shell's internal band boundaries lie 2.5 mm above their nominal heights (volume)
    const chords = v.bands.slice(1).map(([y]) => y + 0.0025);
    const clear = (y: number, dir: number) => [0.003, 0.006, 0.009].map((d) => y + dir * d).find((c) => chords.every((h) => Math.abs(h - c) > 0.0015))!;
    const [y0, y1] = [clear(o.y0, 1), clear(o.y1, -1)];
    const zi = o.s * (Math.min(Math.abs(skin(y0)), Math.abs(skin(y1))) - VESTIBULE_DEPTH);
    const [x0, x1] = [this.X(o.x0), this.X(o.x1)];
    const mat = "seam";
    const face = (pts: Vec3[], nrm: Vec3) => this.m.facets(mat, pts.slice(1, -1).flatMap((p, i) => [pts[0]!, p, pts[i + 2]!]), nrm);
    face([[x0, y0, skin(y0)], [x1, y0, skin(y0)], [x1, y0, zi], [x0, y0, zi]], [0, 1, 0]);
    face([[x0, y1, skin(y1)], [x1, y1, skin(y1)], [x1, y1, zi], [x0, y1, zi]], [0, -1, 0]);
    face([[x0, y0, zi], [x1, y0, zi], [x1, y1, zi], [x0, y1, zi]], [0, 0, o.s]);
    // the side walls follow the skin's profile between sill and head
    const prof = [y0, ...v.section.map((p) => p[1]).filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6).sort((p, q) => p - q), y1];
    for (const [x, dir] of [[x0, 1], [x1, -1]] as const) face([...prof.map((y): Vec3 => [x, y, skin(y)]), [x, y1, zi], [x, y0, zi]], [dir, 0, 0]);
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
   *
   * A side door with `opens` opens (doors.ts): the leaf splits into the motion's
   * leaves over the outline's dark panel (the doorway), and they become moving
   * parts of the side's `door` clip. `leafWork` draws what a leaf carries (its lights), once per leaf,
   * with `clip` cutting a source box to that leaf (null where it misses it);
   * `leafPaint` draws a leaf's own panels in place of `paint` (a two-tone leaf).
   * The leaves are drawn from the low-x end, or from the high one with
   * `fromHigh` -- for a side drawing that runs against x, so what the leaves carry
   * keeps its order (and its names in the source tree).
   */
  door(
    v: Volume,
    s: number,
    b: Box,
    paint: string,
    opts: { end?: boolean; seam?: number; opens?: DoorMotion; leafWork?: (clip: (bb: Box) => Box | null) => void; leafPaint?: (bb: Box) => void; fromHigh?: boolean } = {},
  ): void {
    const sw = opts.seam ?? 0.025;
    const draw = (mat: string, bb: Box, proud: number, depth = 0.04) =>
      opts.end ? this.endPanel(v, mat, s, bb, proud, depth) : this.sidePanel(v, mat, s, bb, proud, depth);
    const leaf = { x0: b.x0 + sw, y0: b.y0 + sw, x1: b.x1 - sw, y1: b.y1 - sw };
    const near = (p: number, q: number) => Math.abs(p - q) < 1e-6;
    const doorway = !opts.end && opts.opens && v.openings?.some((o) => o.s === s && near(o.x0, leaf.x0) && near(o.x1, leaf.x1) && near(o.y0, leaf.y0) && near(o.y1, leaf.y1));
    this.m.scope("outline", () => {
      if (!doorway) return draw("seam", b, 0.006);
      // a frame round the doorway cut through the shell
      for (const f of [{ ...b, x1: leaf.x0 }, { ...b, x0: leaf.x1 }, { ...leaf, y0: b.y0, y1: leaf.y0 }, { ...leaf, y0: leaf.y1, y1: b.y1 }]) draw("seam", f, 0.006);
    });
    const leafPanel = (bb: Box) => {
      if (opts.leafPaint) opts.leafPaint(bb);
      else if (paint !== "bands") draw(paint, bb, 0.01, 0.003);
      else
        for (const [y0, y1, mat] of v.bands) {
          const [a, c] = [Math.max(y0, bb.y0), Math.min(y1, bb.y1)];
          if (c - a > 1e-6) draw(mat, { ...bb, y0: a, y1: c }, 0.01, 0.003);
        }
    };
    if (!opts.opens || opts.end) {
      this.m.scope("leaf", () => leafPanel(leaf));
      return;
    }
    // behind the leaves: the doorway cut through the shell (Volume.openings), or
    // else the outline's dark panel, which fills the whole door box
    const leaves = doorLeaves(this.X(leaf.x0), this.X(leaf.x1), s, opts.opens);
    if (opts.fromHigh) leaves.reverse();
    // the hinge line: the leaf's outer face at mid height, mid door
    const hz = s * ((sectionHalf(v.section, (leaf.y0 + leaf.y1) / 2) * lerp(v.plan, (leaf.x0 + leaf.x1) / 2)) / halfWidth(v) + 0.01);
    // each leaf's panels in a "leaf" scope, what it carries under the caller's own
    // names, so a shut door's source tree reads as a painted one's
    openable(this.m, (mm, o) =>
      this.drawingInto(mm, () =>
        leaves.forEach((l) =>
          this.m.moved(l.move(o, hz), () => {
            const lb = { x0: l.x0 + this.centre, x1: l.x1 + this.centre, y0: leaf.y0, y1: leaf.y1 };
            this.m.scope("leaf", () => leafPanel(lb));
            // a box cut at a leaf's edge keeps 1 cm inside it, its walls off the leaf's
            opts.leafWork?.((bb) => {
              const [a, c] = [Math.max(bb.x0, lb.x0 + 0.01), Math.min(bb.x1, lb.x1 - 0.01)];
              return c - a > 0.03 ? { ...bb, x0: a, x1: c } : null;
            });
          }),
        ),
      ),
    );
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
