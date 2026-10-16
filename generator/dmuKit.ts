// Shared parts of the Czech diesel railcars and multiple units transferred from
// vlakosimdb in one package (docs/models/czech-dmus.md): the CD 810 / 812 / 912
// (dmu810.ts), the CD 843 / 943 / 043 (dmu843.ts), the CSD M 131.1 Hurvinek and
// its M 031 trailer (dmuM131.ts), the CSD M 240.0 (dmuM240.ts) and the CSD
// M 296.1 / CD 853 / 854 (dmuM296.ts). Bodies are lofted by the coach builder
// (csdCoachParts.ts) from the XML `alongx` section, `alongy` plan and `alongz`
// elevation; this module adds the mapping from native pixels and source metres
// to a car's scaled frame, item lists laid on the sides and ends, the CD emblem
// and the running number, and the catalog fields. No `node:` imports.
//
// The builders here draw nothing an existing design draws, so no existing GLB
// depends on this module.

import { ngon, type MaterialSpec, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { emblem } from "./cd163.ts";
import { block, side } from "./vehicleParts.ts";
import type { CatalogFields } from "./design.ts";

export { enumParam, slopePanel, tractionNumber, tractionCheckDigit } from "./emuParts.ts";

/** The catalog fields of the railcars: rail traction vehicles, like the locomotives and the electric units. */
export const DMU_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "loco",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Native pixel edges [left, top, right, bottom]. */
export type PxBox = [number, number, number, number];

/** Materials every car of the package shares; a livery adds its own colours. */
export const DMU_PALETTE: Record<string, MaterialSpec> = {
  glass: { color: "#323a42", metallic: 0.2, roughness: 0.15 },
  frame: { color: "#b4b8b9", metallic: 0.2, roughness: 0.45 },
  rubber: { color: "#1e1f21", roughness: 0.9 },
  roof: { color: "#8a8d8e", roughness: 0.75 },
  roofDark: { color: "#5c5f61", roughness: 0.8 },
  black: { color: "#1f2022", roughness: 0.7 },
  grey: { color: "#6b6e70", roughness: 0.7 },
  engine: { color: "#2e3033", roughness: 0.8 },
  tank: { color: "#3a3c3f", roughness: 0.75 },
  exhaust: { color: "#3b3634", metallic: 0.2, roughness: 0.7 },
  lampWhite: { color: "#f3f5f6", roughness: 0.2 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  lettering: { color: "#f2f2f2", roughness: 0.5 },
  letteringDark: { color: "#1e1f21", roughness: 0.5 },
  emblemBack: { color: "#f4f5f4", roughness: 0.5 },
  coupler: { color: "#3a3c3f", metallic: 0.3, roughness: 0.5 },
};

/** How a car's native canvases and source metres map to its model. */
export interface CarFrame {
  /** Scales from source metres to the model: along, up, across. */
  kx: number;
  ky: number;
  kz: number;
  /** The source x (unscaled) of the car's centre between its coupling faces. */
  centre: number;
  /** The heights (m) of the side and front canvases; both are 0.1 m a pixel. */
  sideH: number;
  frontH: number;
}

/** A car: the coach builder and the frame its source coordinates are scaled by. */
export class Car {
  readonly c: Coach;
  readonly m: MeshBuilder;
  constructor(palette: Record<string, MaterialSpec>, readonly f: CarFrame) {
    this.c = new Coach({ ...DMU_PALETTE, ...palette }, f.centre * f.kx);
    this.m = this.c.m;
  }

  /** Source x to model x. */
  X(x: number): number {
    return this.c.X(x * this.f.kx);
  }
  /** Source x to the coach builder's (scaled, uncentred) x. */
  sx(x: number): number {
    return x * this.f.kx;
  }
  sy(y: number): number {
    return y * this.f.ky;
  }
  sz(z: number): number {
    return z * this.f.kz;
  }

  /** A volume in source metres, scaled to the model. */
  volume(v: Volume): Volume {
    const { kx, ky, kz } = this.f;
    const xy = (p: Pt[]): Pt[] => p.map(([x, y]): Pt => [x * kx, y * ky]);
    const out: Volume = {
      name: v.name,
      section: v.section.map(([z, y]): Pt => [z * kz, y * ky]),
      plan: v.plan.map(([x, h]): Pt => [x * kx, h * kz]),
      ...(v.top ? { top: xy(v.top) } : {}),
      ...(v.bottom ? { bottom: xy(v.bottom) } : {}),
      bands: v.bands.map(([a, b, mat]): [number, number, string] => [a * ky, b * ky, mat]),
      ...(v.endPaint ? { endPaint: v.endPaint } : {}),
    };
    loft(this.c, out);
    return out;
  }

  /** A side-view pixel box as a (scaled) coach box: x along, y up. */
  side(b: PxBox): Box {
    const { kx, ky, sideH } = this.f;
    return { x0: (kx * b[0]) / 10, x1: (kx * b[2]) / 10, y0: ky * (sideH - b[3] / 10), y1: ky * (sideH - b[1] / 10) };
  }

  /** A front-view pixel box on end e (seen from outside it) as an end box: x0..x1 is z across, y up. */
  front(b: PxBox, e: number): Box {
    const { ky, kz, frontH } = this.f;
    const z = (u: number) => e * kz * (1.5 - u / 10);
    const [x0, x1] = [z(b[0]), z(b[2])].sort((p, q) => p - q) as [number, number];
    return { x0, x1, y0: ky * (frontH - b[3] / 10), y1: ky * (frontH - b[1] / 10) };
  }

  /** Native pixels of a model point: the side canvas (column, row) or the front canvas of the +X end. */
  project(view: "side" | "front", p: Vec3): [number, number] {
    const { kx, ky, kz, centre, sideH, frontH } = this.f;
    if (view === "side") return [10 * ((p[0] / kx) + centre), 10 * (sideH - p[1] / ky)];
    return [10 * (1.5 - p[2] / kz), 10 * (frontH - p[1] / ky)];
  }
}

/** What can be laid on a side: framed windows, doors, flat paint or trim panels. */
export interface SideItem {
  kind: "window" | "door" | "panel";
  box: PxBox;
  /** A panel's or a door leaf's paint; a window's frame. */
  mat?: string;
  /** Only on this side (+1 the +z side, the z_dec texture). */
  side?: number;
  name?: string;
  fw?: number;
  proud?: number;
  /** A window's sash bar: the native row of its lower edge. */
  sash?: number;
}

/** Lays items on side s of volume v; each item is a scope named `<name> <n>`. */
export function sideItems(car: Car, v: Volume, s: number, items: readonly SideItem[]): void {
  const counts = new Map<string, number>();
  for (const it of items) {
    if (it.side !== undefined && it.side !== s) continue;
    const name = it.name ?? it.kind;
    const n = (counts.get(name) ?? 0) + 1;
    counts.set(name, n);
    const b = car.side(it.box);
    car.m.scope(`${name} ${n}`, () => {
      if (it.kind === "window") car.c.window(v, s, b, { fw: it.fw ?? 0.06, ...(it.mat ? { frame: it.mat } : {}), ...(it.sash !== undefined ? { sash: car.sy(car.f.sideH - it.sash / 10) } : {}) });
      else if (it.kind === "door") car.c.door(v, s, b, it.mat ?? "bands", { seam: 0.03 });
      else car.c.sidePanel(v, it.mat ?? "black", s, b, it.proud ?? 0.004, 0.003);
    });
  }
}

/** What can be laid on an end: windows, flat panels and lamps (a flat lens on a dark ring). */
export interface EndItem {
  kind: "window" | "panel" | "lamp";
  box: PxBox;
  mat?: string;
  /** Only on this end (+1 the +X end). */
  end?: number;
  name?: string;
  fw?: number;
  proud?: number;
}

/** Lays items on end e of volume v. */
export function endItems(car: Car, v: Volume, e: number, items: readonly EndItem[]): void {
  const counts = new Map<string, number>();
  for (const it of items) {
    if (it.end !== undefined && it.end !== e) continue;
    const name = it.name ?? it.kind;
    const n = (counts.get(name) ?? 0) + 1;
    counts.set(name, n);
    const b = car.front(it.box, e);
    car.m.scope(`${name} ${n}`, () => {
      if (it.kind === "window") {
        // shallow enough that no face reaches the end cap's own 2 mm slab
        const fw = it.fw ?? 0.05;
        car.m.scope("frame", () => car.c.endPanel(v, it.mat ?? "frame", e, b, 0.012, 0.0045));
        car.m.scope("glass", () => car.c.endPanel(v, "glass", e, { x0: b.x0 + fw, x1: b.x1 - fw, y0: b.y0 + fw, y1: b.y1 - fw }, 0.022, 0.008));
      }
      else if (it.kind === "lamp") {
        car.c.endPanel(v, "black", e, b, 0.0085, 0.0035);
        const g = 0.25 * Math.min(b.x1 - b.x0, b.y1 - b.y0);
        car.c.endPanel(v, it.mat ?? "lampWhite", e, { x0: b.x0 + g, x1: b.x1 - g, y0: b.y0 + g, y1: b.y1 - g }, 0.016, 0.006);
      } else car.c.endPanel(v, it.mat ?? "black", e, b, it.proud ?? 0.004, 0.003);
    });
  }
}

/** The CD emblem on side s over the native box (centred, 62 % of its height), on a light ground when `back` is set. */
export function sideEmblem(car: Car, v: Volume, s: number, box: PxBox, mat: string, back?: string): void {
  const e = car.side(box);
  if (back) car.c.sidePanel(v, back, s, e, 0.006, 0.004);
  const h = (e.y1 - e.y0) * (back ? 0.62 : 0.9);
  const w = h * 1.5385;
  const cx = car.c.X((e.x0 + e.x1) / 2);
  const u0 = s > 0 ? cx - w / 2 : cx + w / 2;
  const y0 = (e.y0 + e.y1) / 2 - h / 2;
  const half = Math.max(...v.section.map((p) => Math.abs(p[0])));
  car.m.facets(mat, emblem(u0, y0, h, s < 0).map(([u, vv]): Vec3 => [u, vv, s * (half + (back ? 0.011 : 0.007))]), [0, 0, s]);
}

/** The running number painted on side s, centred on the native box. */
export function sideNumber(car: Car, v: Volume, s: number, box: PxBox, text: string, mat = "lettering"): void {
  const n = car.side(box);
  car.c.inscription(v, s, (n.x0 + n.x1) / 2, [{ text, y: n.y0, h: n.y1 - n.y0 }], 0.006, mat);
}

/** Two buffers and the screw coupling on each end; head and beam in source x, at the standard 1.0 m height scaled by nothing. */
export function buffersBoth(car: Car, heads: [number, number], beams: [number, number], y = 1.0): void {
  for (const [i, e] of [-1, 1].entries())
    car.m.scope(e > 0 ? "front buffers" : "rear buffers", () => {
      car.c.buffers(e, car.sx(heads[i]!), car.sx(beams[i]!), y);
      car.m.scope("coupling", () => car.c.coupling(e, car.sx(heads[i]!), car.sx(beams[i]!), y));
    });
}

/**
 * Underfloor equipment: boxes in source x (x0..x1), between heights y0..y1 (model
 * metres), across +-hw; each a scope with its name.
 */
export function underBoxes(car: Car, boxes: ReadonlyArray<{ name: string; x0: number; x1: number; y0: number; y1: number; hw: number; mat?: string }>): void {
  for (const b of boxes) car.m.scope(b.name, () => block(car.m, b.mat ?? "engine", car.X(b.x0), car.X(b.x1), b.y0, b.y1, -b.hw, b.hw));
}

/** A cylindrical tank or silencer along x at height y, off-centre by z. */
export function tankX(car: Car, x0: number, x1: number, y: number, z: number, r: number, mat = "tank"): void {
  const ring = ngon(12, r, Math.PI / 12, z, y);
  car.m.sweep(mat, "x", ring, car.X(x0), ring, car.X(x1));
}

/** An exhaust stack standing on the roof at source x, z from y0 to y1 (model metres). */
export function exhaust(car: Car, x: number, z: number, y0: number, y1: number, r = 0.07): void {
  car.m.prism("exhaust", ngon(8, r, Math.PI / 8, car.X(x), z), y0, y1);
}

/** Grab handrails beside a door: vertical bars on side s at native columns, rows top..bottom. */
export function handrails(car: Car, v: Volume, s: number, cols: readonly number[], top: number, bottom: number): void {
  for (const u of cols) {
    const b = car.side([u, top, u, bottom]);
    car.c.handrail(v, s, b.x0, b.y0, b.y1);
  }
}

/** A step under a door on side s: a plate on brackets at the native box. */
export function step(car: Car, s: number, box: PxBox, hw: number): void {
  const b = car.side(box);
  block(car.m, "black", car.c.X(b.x0), car.c.X(b.x1), b.y0, b.y0 + 0.04, ...side(s, hw - 0.3, hw - 0.02));
}

// ---------------------------------------------------------------------------
// The loft

const lerp = (pts: Pt[], x: number): number => {
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [xa, ya] = pts[i - 1]!;
    const [xb, yb] = pts[i]!;
    if (x <= xb + 1e-9) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return pts[pts.length - 1]![1];
};

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

/**
 * Coach.volume (csdCoachParts.ts) with one difference: where the elevation
 * clips a paint band away entirely at a station - a band above a cab's sloping
 * nose - the band keeps its 2 mm sliver just inside the body's top (or bottom),
 * 2 % narrower, instead of at the band's own height, so no sliver floats outside
 * the body.
 */
export function loft(c: Coach, v: Volume): void {
  const m = c.m;
  const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
  const hiAt = (x: number): number => (v.top ? lerp(v.top, x) : Infinity);
  const loAt = (x: number): number => (v.bottom ? lerp(v.bottom, x) : -Infinity);
  const xs = [...new Set([...v.plan, ...(v.top ?? []), ...(v.bottom ?? [])].map((p) => p[0]))]
    .filter((x) => x >= v.plan[0]![0] - 1e-9 && x <= v.plan[v.plan.length - 1]![0] + 1e-9)
    .sort((a, b) => a - b);
  const gone = (x: number, y0: number, y1: number) => hiAt(x) <= y0 + 1e-6 || loAt(x) >= y1 - 1e-6;
  const at = (x: number, y0: number, y1: number): Ring => {
    const k = lerp(v.plan, x) / hw0;
    let hi = hiAt(x);
    let lo = loAt(x);
    if (!gone(x, y0, y1)) return clipY(v.section, y0, y1).map(([z, y]) => [z * k, Math.min(hi, Math.max(lo, y))]);
    if (hi <= y0 + 1e-6) [lo, hi] = [hi - 0.004, hi - 0.002];
    else [lo, hi] = [lo + 0.002, lo + 0.004];
    // the band's own outline, flattened into a sliver inside the body
    return clipY(v.section, y0, y1).map(([z, y]) => [z * k * 0.98, y <= (y0 + y1) / 2 ? lo : hi]);
  };
  const bands = v.bands.map(([y0, y1, mat], i): [number, number, string] => [i > 0 ? y0 + 0.0025 : y0, i < v.bands.length - 1 ? y1 + 0.0025 : y1, mat]);
  for (const [y0, y1, mat] of bands) {
    if (clipY(v.section, y0, y1).length < 3) continue;
    m.scope(`${mat} band`, () => {
      for (let i = 0; i + 1 < xs.length; i++) {
        const a = xs[i]!;
        const b = xs[i + 1]!;
        if (b - a < 1e-6) continue;
        if (gone(a, y0, y1) && gone(b, y0, y1)) continue;
        m.sweep(mat, "x", at(a, y0, y1), c.X(a), at(b, y0, y1), c.X(b), false);
      }
      for (const x of [xs[0]!, xs[xs.length - 1]!]) {
        const s = x === xs[0] ? -1 : 1;
        if (gone(x, y0, y1)) continue;
        m.slab(mat, at(x, y0, y1).map(([z, y]): Vec3 => [c.X(x), y, z]), [-s * 0.002, 0, 0]);
      }
    });
  }
}
