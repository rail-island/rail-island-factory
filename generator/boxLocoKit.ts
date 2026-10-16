// A data-driven builder for the box-cab electric locomotives of the
// "mainline electrics" package (docs/models/mainline-electrics.md): the CD 180 /
// 181 / 182 (cd181.ts), the DNT 184.5 (dnt184.ts), the DB 111 (db111.ts), the
// DR 243 / DB 143 / 112 (dr243.ts) and the OBB 1012 and 1040 (obbElectrics.ts).
//
// A design describes its body as profile tables -- the end's centre line
// `tip(y)`, the half width `hw(y)` and the end's plan -- read from the native
// vlakosimdb XML clips, and lists what is laid on the skin (windows, grilles,
// doors, paint, lamps, plates) in the frame's metres, measured on the native
// BMPs. `buildBoxLoco` lofts the shell with the Czech electric kit's `shell`
// (czElectricKit.ts) and lays every item with its `surfacePanel`, so a window
// on a raked or curved face lies on the skin. Running gear: the kit's two-axle
// `bogie` or the three-axle `bogie3` below; the kit's buffers and both of its
// pantograph kinds (the rear raised to 5.87 m, the front folded).
//
// Nothing an existing design draws comes from here, so no shipped GLB depends on it.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { coil, tubeX, type Band } from "./cd163.ts";
import {
  KIT_PALETTE, bogie, buffers, diamond, insulator, kinks, lerpTable, numberOn, onEnd, onSide, rect, roundRect, shell, singleArm,
  surfacePanel, sweepZ, type Place, type ShellSpec,
} from "./czElectricKit.ts";

export type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

/** Something laid on a side wall (u = x, v = y). */
export interface SideItem {
  kind: "window" | "grille" | "door" | "paint" | "plate" | "ribs" | "panel";
  name: string;
  /** The x span (front half for `mirror`) and the y span. */
  x: Span;
  y: Span;
  /** The sides it is on: +1 right (+z), -1 left. Default both. */
  sides?: readonly number[];
  /** Also drawn reflected at -x (a cab item drawn at both ends). */
  mirror?: boolean;
  /** Paint, panel, rib or slat material; a window's frame. */
  mat?: string;
  /** A window divided by a horizontal bar at this height. */
  bar?: number;
  /** Grille slats: horizontal or vertical, their pitch. */
  slats?: "h" | "v";
  pitch?: number;
  /** A paint outline other than the rectangle (convex, u = x, v = y; front half for `mirror`). */
  poly?: Ring;
  /** Paint layer: a later layer lies further out. */
  layer?: number;
  /** A door's window [y0, y1], inset 0.1 m from the door's sides. */
  win?: Span;
  /** A door's handrails and steps. */
  rails?: boolean;
  /** Corner radius of a window or grille. */
  r?: number;
}

/** Something laid on an end face (u = z seen from outside, v = y), at both ends. */
export interface EndItem {
  kind: "window" | "paint" | "lamp" | "plate" | "grille";
  name: string;
  z: Span;
  y: Span;
  mat?: string;
  poly?: Ring;
  layer?: number;
  /** A lamp: a round lens of this radius at the centre of z, y. */
  r?: number;
  /** A window's wiper. */
  wiper?: boolean;
}

/** A trapezoidal box on the roof: x span, its half width at the bottom and top, heights. */
export interface RoofBox {
  name: string;
  x: Span;
  w: Span;
  y: Span;
  mat: string;
}

export interface BogieSpec {
  xc: number;
  /** The axles' offsets from the bogie's centre. */
  axles: readonly number[];
  wheelR: number;
  frameTop: number;
}

export interface LocoSpec {
  palette: Record<string, MaterialSpec>;
  /** The shell's bottom. */
  y0: number;
  /** The end's centre line: [y, |x|], bottom first. */
  tip: Table;
  /** The half width: [y, hw], bottom first. */
  hw: Table;
  /** The end's plan at height y and half width w: [z, setback] from z = 0 out to w. */
  endPlan: (y: number, w: number) => ReadonlyArray<readonly [number, number]>;
  corner: "side" | "end";
  side: readonly Band[];
  end: readonly Band[];
  roof: string;
  /** Half the length over the buffers, the buffer beam's |x|, the buffers' height and heads. */
  buffers: number;
  beam: number;
  bufferY?: number;
  bufferHead?: "round" | "rect";
  /** The underframe under the shell: from y0 to y1, `half` long, `hw` wide. */
  frame: { y0: number; y1: number; half: number; hw: number; mat: string };
  bogies: readonly BogieSpec[];
  pantograph: { kind: "singleArm" | "diamond"; x: number; roofY: number; baseY: number; lower?: number; upper?: number };
  /** A roof cable from an insulator at |x| to each pantograph, at height y. */
  hvLine?: { x: number; y: number; z: number };
  sideItems: readonly SideItem[];
  endItems: readonly EndItem[];
  roofItems: readonly RoofBox[];
  /** Boxes and tanks under the frame between the bogies: [x0, x1, y0, y1, hw]. */
  underItems?: ReadonlyArray<readonly [number, number, number, number, number]>;
  /** The plough's material, when there is one. */
  plough?: string;
  number: string;
}

/** The ShellSpec of a design. */
export function shellOf(s: LocoSpec): ShellSpec {
  const tip = (y: number) => lerpTable(s.tip, y);
  const hw = (y: number) => lerpTable(s.hw, y);
  const breaks = kinks(s.tip, s.hw);
  return {
    heights: [s.y0, ...breaks.filter((y) => y > s.y0)],
    tip, hw,
    endPlan: (y) => s.endPlan(y, hw(y)),
    side: s.side, end: s.end, corner: s.corner, roof: s.roof,
  };
}

const sorted = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a]);

/** The outline of an item as a convex (u, v) ring. */
function outline(x: Span, y: Span, r = 0, poly?: Ring): Ring {
  return poly ?? (r > 0 ? roundRect(x[0], x[1], y[0], y[1], r) : rect(x[0], y[0], x[1], y[1]));
}

/** Clips a convex (u, v) outline to v0 <= v <= v1. */
function clipV(poly: Ring, v0: number, v1: number): Ring {
  let out: Ring = poly;
  for (const [lim, keep] of [[v0, 1], [v1, -1]] as const) {
    const src = out;
    out = [];
    for (let i = 0; i < src.length; i++) {
      const a = src[i]!, b = src[(i + 1) % src.length]!;
      const ina = keep * (a[1] - lim) >= 0, inb = keep * (b[1] - lim) >= 0;
      if (ina) out.push(a);
      if (ina !== inb) {
        const t = (lim - a[1]) / (b[1] - a[1]);
        out.push([a[0] + t * (b[0] - a[0]), lim]);
      }
    }
  }
  return out;
}

/**
 * Paint: a convex outline cut into slabs at the profile's kinks, so an outline
 * whose slanted edge crosses a kink still lies on the skin (surfacePanel only
 * splits rows a whole column spans).
 */
function paint(m: MeshBuilder, mat: string, at: Place, n: Vec3, poly: Ring, d0: number, d1: number, uB: readonly number[], vB: readonly number[]): void {
  const vs = poly.map((p) => p[1]);
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const cuts = [lo, ...vB.filter((h) => h > lo + 1e-4 && h < hi - 1e-4), hi];
  for (let i = 1; i < cuts.length; i++) {
    const piece = clipV(poly, cuts[i - 1]!, cuts[i]!);
    if (piece.length >= 3) surfacePanel(m, mat, at, n, piece, d0, d1, uB, vB);
  }
}

const mirrorRing = (q: Ring): Ring => q.map(([u, v]) => [-u, v] as [number, number]).reverse();

/** A framed window: frame, glass, an optional bar. */
function window(m: MeshBuilder, at: Place, n: Vec3, x: Span, y: Span, frame: string, r: number, uB: readonly number[], vB: readonly number[], bar?: number, wiper = false): void {
  m.scope("frame", () => surfacePanel(m, frame, at, n, outline(x, y, r), -0.01, 0.014, uB, vB));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, outline([x[0] + 0.04, x[1] - 0.04], [y[0] + 0.04, y[1] - 0.04], Math.max(0, r - 0.02)), -0.005, 0.022, uB, vB));
  if (bar !== undefined) m.scope("bar", () => surfacePanel(m, frame, at, n, rect(x[0] + 0.02, bar - 0.025, x[1] - 0.02, bar + 0.025), 0.0, 0.03, uB, vB));
  if (wiper) {
    const w = (x[1] - x[0]) * 0.6;
    m.scope("wiper", () => surfacePanel(m, "rubber", at, n, rect(x[0] + 0.12, y[0] + 0.1, x[0] + 0.12 + w, y[0] + 0.125), 0.02, 0.035, uB, vB));
  }
}

/** Grille: a dark louvre panel and slats. */
function grille(m: MeshBuilder, at: Place, n: Vec3, x: Span, y: Span, mat: string, slats: "h" | "v", pitch: number, r: number, uB: readonly number[], vB: readonly number[]): void {
  m.scope("louvre", () => surfacePanel(m, "louvre", at, n, outline(x, y, r), -0.006, 0.006, uB, vB));
  m.scope("slats", () => {
    const [a0, a1] = slats === "h" ? y : x;
    const count = Math.max(1, Math.floor((a1 - a0 - 0.04) / pitch));
    const start = (a0 + a1) / 2 - ((count - 1) * pitch) / 2;
    for (let i = 0; i < count; i++) {
      const c = start + i * pitch, h = Math.min(0.035, pitch * 0.4);
      const q = slats === "h" ? rect(x[0] + 0.04, c - h, x[1] - 0.04, c + h) : rect(c - h, y[0] + 0.04, c + h, y[1] - 0.04);
      surfacePanel(m, mat, at, n, q, -0.003, 0.012, uB, vB);
    }
  });
}

function sides(m: MeshBuilder, s: LocoSpec, sp: ShellSpec, vB: readonly number[]): void {
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right side" : "left side", () => {
      const at = onSide(sp, sd);
      const n: Vec3 = [0, 0, sd];
      for (const it of s.sideItems) {
        if (!(it.sides ?? [-1, 1]).includes(sd)) continue;
        const copies: Array<[string, Span, Ring | undefined]> = [[it.mirror ? `${it.name} front` : it.name, it.x, it.poly]];
        if (it.mirror) copies.push([`${it.name} rear`, sorted(-it.x[1], -it.x[0]), it.poly ? mirrorRing(it.poly) : undefined]);
        for (const [name, x, poly] of copies)
          m.scope(name, () => {
            const mat = it.mat ?? "rubber";
            const r = it.r ?? 0;
            switch (it.kind) {
              case "window":
                window(m, at, n, x, it.y, mat, r || 0.05, [], vB, it.bar);
                break;
              case "grille":
                grille(m, at, n, x, it.y, it.mat ?? "slat", it.slats ?? "v", it.pitch ?? 0.1, r, [], vB);
                break;
              case "paint": {
                const d = 0.003 + 0.002 * (it.layer ?? 0);
                paint(m, mat, at, n, outline(x, it.y, r, poly), d - 0.002, d, [], vB);
                break;
              }
              case "panel":
                surfacePanel(m, mat, at, n, outline(x, it.y, r, poly), -0.005, 0.012, [], vB);
                break;
              case "ribs":
                for (let y = it.y[0], i = 1; y + 0.06 <= it.y[1] + 1e-6; y += it.pitch ?? 0.2, i++)
                  m.scope(`rib ${i}`, () => surfacePanel(m, mat, at, n, rect(x[0], y, x[1], y + 0.07), -0.004, 0.011, [], vB));
                break;
              case "plate":
                surfacePanel(m, "plate", at, n, rect(x[0], it.y[0], x[1], it.y[1]), -0.01, 0.02, [], vB);
                numberOn(m, at, n, s.number, (x[0] + x[1]) / 2, (it.y[0] + it.y[1]) / 2, Math.min(0.13, (it.y[1] - it.y[0]) * 0.6), 0.024, sd < 0);
                break;
              case "door": {
                const [d0, d1] = x, [y0, y1] = it.y;
                m.scope("seams", () => {
                  for (const q of [rect(d0, y0, d1, y0 + 0.02), rect(d0, y1 - 0.02, d1, y1), rect(d0, y0 + 0.02, d0 + 0.02, y1 - 0.02), rect(d1 - 0.02, y0 + 0.02, d1, y1 - 0.02)])
                    surfacePanel(m, "rubber", at, n, q, -0.002, 0.004, [], vB);
                });
                if (it.win) m.scope("window", () => window(m, at, n, [d0 + 0.1, d1 - 0.1], it.win!, "rim", 0.04, [], vB));
                if (it.rails) {
                  m.scope("handrails", () => {
                    for (const hx of [d0 - 0.06, d1 + 0.06]) {
                      const top = Math.min(y1 - 0.1, y0 + 1.6), z = sd * (sp.hw(top) + 0.03);
                      m.prism("steel", ngon(6, 0.018, 0, hx, z), y0 + 0.1, top);
                      for (const hy of [y0 + 0.1, top - 0.02]) block(m, "steel", hx - 0.015, hx + 0.015, hy, hy + 0.02, ...side(sd, sp.hw(hy) - 0.01, sp.hw(top) + 0.045));
                    }
                  });
                  m.scope("steps", () => {
                    const w = sp.hw(y0);
                    for (const y of [0.35, 0.65]) if (y < y0 - 0.1) block(m, "steel", d0 + 0.05, d1 - 0.05, y, y + 0.04, ...side(sd, w - 0.16, w - 0.02));
                    for (const hx of [d0 + 0.05, d1 - 0.09]) block(m, "steel", hx, hx + 0.04, 0.35, y0 + 0.02, ...side(sd, w - 0.06, w - 0.02));
                  });
                }
                break;
              }
            }
          });
      }
    });
}

function cabEnd(m: MeshBuilder, s: LocoSpec, sp: ShellSpec, e: number, vB: readonly number[]): void {
  const at = onEnd(sp, e);
  const n: Vec3 = [e, 0, 0];
  // seen from ahead, +z is on the left at the front: an item's z is mirrored there so both ends read alike
  // the plan's corners move with the width: break an item at the corners of every height it spans
  const uBAt = (y: Span) => [...new Set([y[0], (y[0] + y[1]) / 2, y[1], ...vB.filter((h) => h > y[0] && h < y[1])].flatMap((h) => sp.endPlan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);
  const zOf = (z: Span): Span => (e > 0 ? sorted(-z[0], -z[1]) : z);
  for (const it of s.endItems)
    m.scope(it.name, () => {
      const z = zOf(it.z);
      const uB = uBAt(it.y);
      const poly = it.poly && e > 0 ? mirrorRing(it.poly) : it.poly;
      switch (it.kind) {
        case "window":
          window(m, at, n, z, it.y, it.mat ?? "rubber", 0.06, uB, vB, undefined, it.wiper);
          break;
        case "paint": {
          const d = 0.003 + 0.002 * (it.layer ?? 0);
          paint(m, it.mat ?? "white", at, n, outline(z, it.y, 0, poly), d - 0.002, d, uB, vB);
          break;
        }
        case "grille":
          grille(m, at, n, z, it.y, it.mat ?? "slat", "h", 0.08, 0.02, uB, vB);
          break;
        case "lamp": {
          const cz = (z[0] + z[1]) / 2, cy = (it.y[0] + it.y[1]) / 2, r = it.r ?? 0.08;
          m.scope("rim", () => surfacePanel(m, "rim", at, n, ngon(12, r + 0.03, 0, cz, cy), -0.01, 0.025, uB, vB));
          m.scope("lens", () => surfacePanel(m, it.mat ?? "lampHead", at, n, ngon(12, r, 0, cz, cy), -0.005, 0.035, uB, vB));
          break;
        }
        case "plate":
          surfacePanel(m, "plate", at, n, rect(z[0], it.y[0], z[1], it.y[1]), -0.01, 0.02, uB, vB);
          numberOn(m, at, n, s.number, (z[0] + z[1]) / 2, (it.y[0] + it.y[1]) / 2, Math.min(0.11, (it.y[1] - it.y[0]) * 0.6), 0.024, e > 0);
          break;
      }
    });
  m.scope("lower end", () => {
    buffers(m, e, s.beam, s.buffers, s.bufferY ?? 1.03, s.bufferHead ?? "round");
    if (s.plough) {
      const pl = s.plough;
      m.scope("plough", () => {
        const a = e * (s.beam + 0.1);
        const ring = (x0: number, w: number, back: number): Ring => (e > 0 ? [[x0, -w], [x0 - back, -w - 0.05], [x0 - back, w + 0.05], [x0, w]] : [[x0 + back, -w - 0.05], [x0, -w], [x0, w], [x0 + back, w + 0.05]]);
        m.loft(pl, ring(a, 1.1, 0.25), 0.25, ring(e > 0 ? a + 0.03 : a - 0.03, 1.35, 0.3), s.frame.y0, false);
        m.cap(pl, ring(a, 1.1, 0.25), 0.25, false);
      });
    }
  });
}

/** A three-axle bogie (Co): wheelsets with axle boxes and coils, a long plate frame dipping between the wheels. */
export function bogie3(m: MeshBuilder, b: BogieSpec): void {
  m.bogie(() => bogie3Geometry(m, b));
}

function bogie3Geometry(m: MeshBuilder, b: BogieSpec): void {
  const { xc, wheelR: R, frameTop: ft } = b;
  const N = 20;
  const ay = R * Math.cos(Math.PI / N);
  for (const dx of b.axles)
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -1.0, axle, 1.0);
      for (const s of [-1, 1]) {
        sweepZ(m, "steel", ngon(N, R, Math.PI / N, x, ay), side(s, 0.665, 0.8));
        sweepZ(m, "wheel", ngon(16, R * 0.8, 0, x, ay), side(s, 0.8, 0.82));
        sweepZ(m, "steel", ngon(8, 0.14, 0, x, ay), side(s, 0.82, 0.84));
        m.scope("axle box", () => sweepZ(m, "bogie", ngon(8, 0.15, Math.PI / 8, x, ay), side(s, 0.84, 1.04)));
        m.scope("primary suspension", () => {
          block(m, "bogie", x - 0.35, x + 0.35, ay + 0.16, ay + 0.2, ...side(s, 0.9, 1.04));
          for (const d of [-0.25, 0.25]) coil(m, "spring", x + d, s * 0.97, ay - 0.12, ay + 0.16, 0.07, 2, 6);
        });
      }
      const motor = ngon(12, Math.min(0.3, R * 0.5), 0, x + (dx > 0 ? -1 : 1) * R * 0.85, ay + 0.02);
      m.sweep("bogie", "z", motor, -0.55, motor, 0.55);
    });
  m.scope("frame", () => {
    const xs = [...b.axles].sort((a, c) => a - c);
    const L = xs[xs.length - 1]! + 0.65, F = -xs[0]! + 0.65;
    for (const s of [-1, 1]) {
      const top: Ring = [[-F, ft]];
      const bottom: Ring = [[-F, ft - 0.16]];
      for (let i = 0; i + 1 < xs.length; i++) {
        const [a, c] = [xs[i]!, xs[i + 1]!];
        top.push([a + 0.35, ft], [a + 0.6, ft - 0.12], [c - 0.6, ft - 0.12], [c - 0.35, ft]);
        bottom.push([a + 0.3, ft - 0.16], [a + 0.55, ay - 0.1], [c - 0.55, ay - 0.1], [c - 0.3, ft - 0.16]);
      }
      top.push([L, ft]);
      bottom.push([L, ft - 0.16]);
      plate(m, "bogie", top.map(([u, v]) => [xc + u, v]), bottom.map(([u, v]) => [xc + u, v]), ...side(s, 0.92, 1.08));
    }
    for (let i = 0; i + 1 < xs.length; i++) {
      const x = xc + (xs[i]! + xs[i + 1]!) / 2;
      block(m, "bogie", x - 0.08, x + 0.08, ft - 0.26, ft - 0.06, -0.92, 0.92);
    }
    for (const x of [xc - F + 0.05, xc + L - 0.05]) block(m, "bogie", x - 0.05, x + 0.05, ft - 0.16, ft - 0.02, -1.0, 1.0);
  });
  m.scope("secondary suspension", () => {
    for (const s of [-1, 1]) for (const d of [-0.6, 0.6]) coil(m, "spring", xc + d, s * 1.16, ft - 0.4, ft + 0.02, 0.1, 2, 6);
    for (const s of [-1, 1]) block(m, "bogie", xc - 0.85, xc + 0.85, ft - 0.5, ft - 0.4, ...side(s, 0.9, 1.3));
  });
}

/** Builds a locomotive from its spec. */
export function buildBoxLoco(s: LocoSpec): MeshBuilder {
  const m = new MeshBuilder({ ...KIT_PALETTE, ...s.palette });
  const sp = shellOf(s);
  const vB = kinks(s.tip, s.hw);
  m.scope("body", () => {
    m.scope("shell", () => shell(m, sp));
    m.scope("frame", () => {
      const { half: H, hw: W, y0, y1, mat } = s.frame;
      const r: Ring = [[H, -W + 0.15], [H, W - 0.15], [H - 0.15, W], [-H + 0.15, W], [-H, W - 0.15], [-H, -W + 0.15], [-H + 0.15, -W], [H - 0.15, -W]];
      m.prism(mat, r, y0, y1, false);
      m.cap("underframe", r, y0, false);
    });
    if (s.underItems?.length)
      m.scope("equipment", () => {
        for (const [x0, x1, y0, y1, w] of s.underItems!) block(m, "underframe", x0, x1, y0, y1, -w, w);
      });
  });
  m.scope("sides", () => sides(m, s, sp, vB));
  for (const e of [-1, 1]) m.scope(e > 0 ? "front cab" : "rear cab", () => cabEnd(m, s, sp, e, vB));
  m.scope("bogies", () => {
    for (const [i, b] of s.bogies.entries())
      m.scope(s.bogies.length === 3 ? ["rear bogie", "middle bogie", "front bogie"][i]! : b.xc > 0 ? "front bogie" : "rear bogie", () => {
        if (b.axles.length === 2) bogie(m, { xc: b.xc, halfBase: Math.abs(b.axles[1]! - b.axles[0]!) / 2, wheelR: b.wheelR, frameTop: b.frameTop });
        else bogie3(m, b);
      });
  });
  m.scope("roof equipment", () => {
    for (const r of s.roofItems)
      m.scope(r.name, () => {
        const ring = (w: number): Ring => [[r.x[1], -w], [r.x[1], w], [r.x[0], w], [r.x[0], -w]];
        m.loft(r.mat, ring(r.w[0]), r.y[0], ring(r.w[1]), r.y[1]);
      });
    const p = s.pantograph;
    m.scope("pantographs", () => {
      for (const e of [-1, 1])
        m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => {
          if (p.kind === "diamond") diamond(m, { xc: e * p.x, roofY: p.roofY, baseY: p.baseY, raised: e < 0, raisedTop: 5.87 });
          else singleArm(m, { xc: e * p.x, roofY: p.roofY, baseY: p.baseY, h: -e, raised: e < 0, raisedTop: 5.87, lower: p.lower, upper: p.upper });
        });
    });
    if (s.hvLine) {
      const h = s.hvLine;
      m.scope("high voltage line", () => {
        for (const e of [-1, 1]) {
          insulator(m, e * h.x, h.z, p.roofY - 0.01, h.y - 0.02);
          tubeX(m, "copper", 0.018, e * h.x, h.y, h.z, e * (p.x - 0.6), h.y, h.z, 6);
        }
      });
    }
  });
  return m;
}
