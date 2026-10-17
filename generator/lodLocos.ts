// The dedicated low level of detail (docs/models/lod.md) of the Czech box-cab
// electrics (czElectricKit.ts), the mainline diesels (dieselParts.ts) and the
// small and shunting diesels (smallDieselKit.ts): one shell adapter per kit --
// a czElectricKit ShellSpec, a dieselParts PlanBody or a smallDieselKit BoxSpec
// sampled at its own profile heights into the shared kit's LodShell, with the
// kit's own bands, cab bands and roof -- and one assembly, `locoLod`, that adds
// the frame, the running gear as dark blocks reaching the rail, roof boxes,
// underframe boxes and the pantographs, and fits it all with `fitLod`.
//
// A hood unit is several shells (hoods and cab), each hood's end against the
// cab hidden (LodShell `ends`). Metres, +X forward, +Y up, +Z right, rail top
// at y = 0, as the full models.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import {
  fitLod, lodBands, lodBogie, lodPantograph, lodPolygon, lodRoofBox, lodShell, lodSideBox, windowBands,
  type LodBand, type LodPart, type LodRect, type LodShell, type Table,
} from "./lodKit.ts";
import type { ShellSpec } from "./czElectricKit.ts";
import type { PlanBody } from "./dieselParts.ts";
import { boxSpec, type BoxSpec } from "./smallDieselKit.ts";

export { windowBands, type LodRect };

// --- shell adapters ------------------------------------------------------------------------

/** A setback this deep makes the end a vee in plan (a rounded or bowed nose); shallower, a flat end. */
const VEE = 0.12;

/** The shell from sampled profiles: a flat end unless the corners stand back more than VEE. */
function sampled(hs: readonly number[], tip: (y: number) => number, hw: (y: number) => number, setback: (y: number) => number): Pick<LodShell, "y0" | "tip" | "hw" | "setback"> {
  const ys = [...new Set(hs)].sort((a, b) => a - b);
  const sb: Table = ys.map((y) => [y, setback(y)] as const);
  const vee = sb.some(([, b]) => b > VEE);
  return {
    y0: ys[0]!,
    tip: ys.map((y) => [y, tip(y)] as const),
    hw: ys.map((y) => [y, hw(y)] as const),
    ...(vee ? { setback: sb } : {}),
  };
}

/** A czElectricKit ShellSpec as a LodShell: its profile heights, bands, roof, centre and drawn ends. */
export function czShellLod(sp: ShellSpec, extra: Partial<LodShell> = {}): LodShell {
  const corner = (y: number) => { const p = sp.endPlan(y); return p[p.length - 1]![1]; };
  return {
    ...sampled(sp.heights, sp.tip, sp.hw, corner),
    ...(sp.xc !== undefined ? { xc: sp.xc } : {}),
    side: sp.side, end: sp.end, roof: sp.roof,
    ...(sp.ends ? { ends: sp.ends } : {}),
    ...extra,
  };
}

/** A smallDieselKit BoxSpec (a hood, a cab, a deck block) as a LodShell. */
export const boxLod = (b: BoxSpec, extra: Partial<LodShell> = {}): LodShell => czShellLod(boxSpec(b), extra);

/** A dieselParts PlanBody as a LodShell: the face bands on the ends, the cab bands beyond cabX on the sides. */
export function planBodyLod(pb: PlanBody, extra: Partial<LodShell> = {}): LodShell {
  const corner = (y: number) => { const e = pb.end(y); return e[e.length - 1]![0]; };
  return {
    ...sampled(pb.heights, pb.tip, pb.half, corner),
    side: pb.side, end: pb.face, roof: pb.top,
    ...(pb.cab && pb.cabX !== undefined ? { cab: { x: pb.cabX, side: pb.cab } } : {}),
    ...extra,
  };
}

/** A BoxSpec cut to x0..x1 (a hood running through the cab, split either side of it); its cut ends hidden. */
export function cutBox(b: BoxSpec, x0: number, x1: number): BoxSpec {
  const ends = [...(x0 <= b.x0 + 1e-9 ? [-1] : []), ...(x1 >= b.x1 - 1e-9 ? [1] : [])].filter((e) => !b.ends || b.ends.includes(e));
  return { ...b, x0: Math.max(x0, b.x0), x1: Math.min(x1, b.x1), ends };
}

/** A BoxSpec's profile tables cut at `top` (the part hidden under a roof or sun roof dropped). */
export function lowerBox(b: BoxSpec, top: number): BoxSpec {
  const cut = (t: Table): Table => {
    const lerpAt = (y: number) => {
      for (let i = 1; i < t.length; i++) if (y <= t[i]![0]) return t[i - 1]![1] + ((t[i]![1] - t[i - 1]![1]) * (y - t[i - 1]![0])) / (t[i]![0] - t[i - 1]![0]);
      return t[t.length - 1]![1];
    };
    return [...t.filter(([y]) => y < top - 1e-9), [top, lerpAt(top)] as const];
  };
  return { ...b, hw: cut(b.hw), ...(b.inset ? { inset: cut(b.inset) } : {}) };
}

/** `bands` with mat painted over y0..y1 (a windscreen's surround, a stripe). */
export function overlay(bands: readonly LodBand[], y0: number, y1: number, mat: string): LodBand[] {
  const lo = bands[0]![0], hi = bands[bands.length - 1]![1];
  return lodBands([...(y0 > lo + 1e-9 ? lodBands(bands, lo, y0) : []), [y0, y1, mat], ...(y1 < hi - 1e-9 ? lodBands(bands, y1, hi) : [])], lo, hi);
}

/** Side windows seen from afar: rectangles on the cab sides, joined into bands, optional by area (smallest first), mirrored to -x when asked. */
export function sideWindows(rects: ReadonlyArray<{ u: readonly [number, number]; y: readonly [number, number] }>, gap = 0.3, mirror = false, sides?: readonly number[]): LodRect[] {
  return windowBands(rects, gap).map((w) => ({ ...w, optional: (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]), ...(mirror ? { mirror } : {}), ...(sides ? { sides } : {}) }));
}

/** Two windscreen panes either side of the middle (|z| from a to b) as one band. */
export const screen = (a: number, b: number, y0: number, y1: number, ends?: readonly number[]): LodRect[] =>
  windowBands([{ u: [-b, -a], y: [y0, y1] }, { u: [a, b], y: [y0, y1] }], 2 * a + 0.5).map((w) => (ends ? { ...w, ends } : w));

// --- parts -------------------------------------------------------------------------------------

/** A box x0..x1, y0..y1, z0..z1: sides, ends and (unless `top` is false) the top in `top`'s material; no bottom. */
export function lodBlock(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top: string | false = mat): void {
  const p = (x: number, y: number, z: number): Vec3 => [x, y, z];
  lodPolygon(m, mat, [p(x0, y0, z0), p(x1, y0, z0), p(x1, y1, z0), p(x0, y1, z0)], [0, 0, -1]);
  lodPolygon(m, mat, [p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)], [0, 0, 1]);
  lodPolygon(m, mat, [p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1), p(x0, y1, z0)], [-1, 0, 0]);
  lodPolygon(m, mat, [p(x1, y0, z0), p(x1, y0, z1), p(x1, y1, z1), p(x1, y1, z0)], [1, 0, 0]);
  if (top !== false) lodPolygon(m, top, [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, z1), p(x0, y1, z1)], [0, 1, 0]);
}

/** A box of the LOD: a frame, a tank, a roof cover, an exhaust; `w` a half width or [at y0, at y1] (a tapering roof box, centred). */
export interface LocoBox {
  name: string;
  mat: string;
  x: readonly [number, number];
  y: readonly [number, number];
  w: number | readonly [number, number];
  /** The centre across (default 0; a box off the centre line is straight). */
  zc?: number;
  /** The top's material, or false for none (a frame under a body, a tank). Default: the box's. */
  top?: string | false;
  optional?: number;
}

/** A bogie or a rigid frame's wheelsets as one dark block from the rail to `top`. */
export interface LocoGear {
  xc: number;
  half: number;
  top: number;
  hz?: number;
}

/** The pantographs: one raised at x, or a pair at +-x, the rear raised and the front folded (optional). */
export interface LocoPantographs {
  x: number;
  pair: boolean;
  roofY: number;
  baseY: number;
  raisedTop?: number;
  lower?: number;
  upper?: number;
}

export interface LocoLodSpec {
  palette: Record<string, MaterialSpec>;
  shells: LodShell[];
  /** Shells that give way first like optional parts (a low cabinet beside a hood): drawn at full profile. */
  optionalShells?: ReadonlyArray<{ shell: LodShell; optional: number }>;
  boxes?: readonly LocoBox[];
  gear: readonly LocoGear[];
  pantographs?: LocoPantographs;
}

/** A locomotive of the three kits for distant views, fitted to `budget` triangles. */
export function locoLod(s: LocoLodSpec, budget = 100): MeshBuilder {
  const parts: LodPart[] = [
    { draw: (m) => m.scope("running gear", () => { for (const g of s.gear) lodBogie(m, g.xc, g.half, g.top, g.hz ?? 1.12); }) },
    ...(s.boxes ?? []).map((b): LodPart => ({
      ...(b.optional !== undefined ? { optional: b.optional } : {}),
      draw: (m) => m.scope(b.name, () => {
        const zc = b.zc ?? 0;
        if (typeof b.w === "number") lodBlock(m, b.mat, b.x[0], b.x[1], b.y[0], b.y[1], zc - b.w, zc + b.w, b.top ?? b.mat);
        else if (b.top === false) lodSideBox(m, b.mat, [[b.x[0], b.y[0]], [b.x[1], b.y[0]], [b.x[1], b.y[1]], [b.x[0], b.y[1]]], -b.w[0], b.w[0]);
        else lodRoofBox(m, b.mat, b.x[0], b.x[1], b.w[0], b.w[1], b.y[0], b.y[1]);
      }),
    })),
    ...(s.optionalShells ?? []).map(({ shell, optional }): LodPart => ({ optional, draw: (m) => m.scope("cabinet", () => lodShell(m, shell)) })),
  ];
  const p = s.pantographs;
  if (p) {
    const common = { roofY: p.roofY, baseY: p.baseY, raisedTop: p.raisedTop ?? 5.87, ...(p.lower ? { lower: p.lower } : {}), ...(p.upper ? { upper: p.upper } : {}) };
    parts.push({ draw: (m) => m.scope("raised pantograph", () => lodPantograph(m, { ...common, x: p.pair ? -p.x : p.x, h: 1, raised: true })) });
    if (p.pair) parts.push({ optional: 0, draw: (m) => m.scope("folded pantograph", () => lodPantograph(m, { ...common, x: p.x, h: -1, raised: false })) });
  }
  return fitLod({ palette: s.palette, shells: s.shells, parts }, budget);
}
