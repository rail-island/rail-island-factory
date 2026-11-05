// A compact way to state a box locomotive for the box locomotive kit
// (boxLocoKit.ts): a few measures - the length over the buffers, the body's
// width and heights, the bogies - a nose type and a livery give the kit's
// profile tables (the end's centre line, the half width, the end's plan) and
// the usual skin items (windscreens, lamps, cab doors and windows, a row of
// machine-room windows or grilles, number plates). The electric and diesel
// locomotives of the eight countries' families are drawn with it
// (docs/models/world-locos.md).
//
// Nose types, in side elevation:
// - `flat`: an upright end, the roof's edge rounded (Re 4/4 II, Class 86);
// - `raked`: the windscreen leaning back above the waist (BR 120, 101);
// - `streamlined`: a rounded nose, low at the buffer beam (BR 103, Re 460);
// - `nezCasse`: Paul Arzens's "broken nose", the windscreen leaning forward
//   under a visor (CC 6500, BB 22200, NS 1700);
// - `hoods`: a centre cab between two lower hoods (a crocodile, BR 218), the
//   hoods drawn at the cab's width (a deviation the families' docs state).

import type { MaterialSpec } from "./meshBuilder.ts";
import type { Band } from "./cd163.ts";
import { c } from "./czElectricKit.ts";
import type { BogieSpec, EndItem, LocoSpec, RoofBox, SideItem } from "./boxLocoKit.ts";

export type NoseType = "flat" | "raked" | "streamlined" | "nezCasse" | "hoods";

export interface WorldLoco {
  /** Length over the buffers (or couplers). */
  length: number;
  /** The body's half width and the shell's bottom (the frame's top) and roof heights. */
  W: number;
  y0: number;
  roof: number;
  nose: NoseType;
  /** How far the cab's front stands back from the buffer beam, for `hoods` the cab's half length. */
  cabHalf?: number;
  /** For `hoods`: the hoods' top. */
  hoodTop?: number;
  /** The bogies: centre, axle offsets, wheel radius. */
  bogies: ReadonlyArray<readonly [number, readonly number[], number]>;
  /** Pantographs (electric) or exhaust stacks (diesel, x positions). */
  pantograph?: "singleArm" | "diamond";
  pantographX?: number;
  exhausts?: readonly number[];
  /** Machine-room windows (`windows`) or grilles along the side between the cabs: their count and height span. */
  room?: { kind: "windows" | "grilles"; n: number; y: readonly [number, number] };
  /** Paint. */
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end?: readonly Band[];
  roofMat?: string;
  /** Paint laid on the sides (a stripe's ends, an emblem), as the kit's side items. */
  paint?: readonly SideItem[];
  endPaint?: readonly EndItem[];
  number: string;
  /** Extra roof boxes (resistors, a roof cover). */
  roofItems?: readonly RoofBox[];
}

/** The end's centre line [y, |x|] for a nose type. */
function tipTable(s: WorldLoco, N: number): Array<readonly [number, number]> {
  const { y0, roof } = s;
  const h = roof - y0;
  switch (s.nose) {
    case "flat":
      return [[y0, N], [roof - 0.35, N], [roof - 0.12, N - 0.12], [roof, N - 0.4]];
    case "raked":
      return [[y0, N], [y0 + h * 0.38, N], [roof - 0.3, N - 0.55], [roof - 0.1, N - 0.75], [roof, N - 1.0]];
    case "streamlined":
      return [[y0, N - 0.05], [y0 + h * 0.2, N], [y0 + h * 0.45, N - 0.25], [y0 + h * 0.72, N - 0.95], [roof - 0.15, N - 1.6], [roof, N - 1.95]];
    case "nezCasse":
      // the lower nose, the break, the windscreen leaning out to the visor
      return [[y0, N], [y0 + h * 0.36, N], [y0 + h * 0.46, N - 0.55], [roof - 0.3, N - 0.25], [roof - 0.12, N - 0.2], [roof, N - 0.5]];
    case "hoods": {
      const top = s.hoodTop ?? y0 + h * 0.55;
      const cab = s.cabHalf ?? 1.6;
      return [[y0, N], [top - 0.12, N], [top, N - 0.15], [top + 0.01, cab], [roof - 0.12, cab], [roof, cab - 0.25]];
    }
  }
}

/** The end's plan at height y and half width w: [z, setback]. */
function planOf(s: WorldLoco): (y: number, w: number) => ReadonlyArray<readonly [number, number]> {
  switch (s.nose) {
    case "streamlined":
      return (_y, w) => [[0, 0], [w * 0.35, 0.08], [w * 0.7, 0.35], [w * 0.9, 0.7], [w, 1.05]];
    case "raked":
      return (_y, w) => [[0, 0], [w * 0.45, 0.05], [w * 0.85, 0.25], [w, 0.5]];
    case "nezCasse":
      return (_y, w) => [[0, 0], [w * 0.6, 0.06], [w * 0.9, 0.22], [w, 0.4]];
    default:
      return (_y, w) => [[0, 0], [w * 0.7, 0.03], [w, 0.12]];
  }
}

/** The height of the windscreens' sill and head for a nose type. */
function screen(s: WorldLoco): [number, number] {
  const h = s.roof - s.y0;
  if (s.nose === "hoods") return [Math.max((s.hoodTop ?? s.y0 + h * 0.55) + 0.25, s.roof - 1.0), s.roof - 0.3];
  if (s.nose === "nezCasse") return [s.y0 + h * 0.5, s.roof - 0.35];
  return [s.y0 + h * 0.52, s.roof - (s.nose === "flat" ? 0.45 : 0.4)];
}

export function worldLocoSpec(s: WorldLoco): LocoSpec {
  const half = s.length / 2;
  const N = half - 0.62;
  const W = s.W;
  const [w0, w1] = screen(s);
  const lampY = s.y0 + 0.35;
  const cabX = s.nose === "hoods" ? s.cabHalf ?? 1.6 : N - (s.nose === "streamlined" ? 1.9 : s.nose === "raked" ? 1.0 : 0.6);
  const doorX = s.nose === "hoods" ? [cabX - 1.0, cabX - 0.2] as const : [cabX - 1.15, cabX - 0.35] as const;
  const room = s.room;
  const roomItems: SideItem[] = [];
  if (room) {
    const [a, b] = [-(doorX[0] - 0.6), doorX[0] - 0.6];
    const pitch = (b - a) / room.n;
    for (let i = 0; i < room.n; i++) {
      const x0 = a + i * pitch + pitch * 0.12, x1 = a + (i + 1) * pitch - pitch * 0.12;
      roomItems.push(room.kind === "windows"
        ? { kind: "window", name: `window ${i + 1}`, x: [x0, x1], y: room.y, mat: "rubber" }
        : { kind: "grille", name: `grille ${i + 1}`, x: [x0, x1], y: room.y, slats: "v", pitch: 0.1 });
    }
  }
  const pX = s.pantographX ?? Math.min(N - 2.2, half * 0.55);
  return {
    palette: { roof: { color: "#6a6c6e", roughness: 0.75 }, plate: c("#3a3b3d", 0.6), exhaust: c("#2b2b2b", 0.9), ...s.palette },
    y0: s.y0,
    tip: tipTable(s, N),
    hw: [[s.y0, W], [s.roof - 0.45, W], [s.roof - 0.12, W - 0.22], [s.roof, W - 0.5]],
    endPlan: planOf(s),
    corner: "end",
    side: s.side,
    end: s.end ?? s.side,
    roof: s.roofMat ?? "roof",
    buffers: half,
    beam: N,
    frame: { y0: s.y0 - 0.35, y1: s.y0, half: N, hw: W - 0.05, mat: "frame" },
    bogies: s.bogies.map(([xc, axles, wheelR]): BogieSpec => ({ xc, axles, wheelR, frameTop: wheelR + 0.25 })),
    ...(s.pantograph ? { pantograph: { kind: s.pantograph, x: pX, roofY: s.roof, baseY: s.roof + 0.15 } } : {}),
    ...(s.exhausts ? { exhausts: s.exhausts.map((x) => [x, 0, s.roof] as const) } : {}),
    sideItems: [
      { kind: "door", name: "cab door", x: doorX, y: [s.y0 + 0.1, w1], rails: true, mirror: true },
      { kind: "window", name: "cab window", x: [doorX[1] + 0.1, Math.min(cabX + 0.55, N - 0.35)], y: [w0, w1 - 0.05], mat: "rubber", mirror: true },
      ...roomItems,
      ...(s.paint ?? []),
      { kind: "plate", name: "number", x: [-0.5, 0.5], y: [s.y0 + 0.08, s.y0 + 0.26] },
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.08, W - 0.22], y: [w0, w1], wiper: true },
      { kind: "window", name: "windscreen right", z: [-(W - 0.22), -0.08], y: [w0, w1], wiper: true },
      ...(s.endPaint ?? []),
      { kind: "lamp", name: "top headlight", z: [-0.08, 0.08], y: [w1 + 0.1, w1 + 0.26], r: 0.07 },
      { kind: "lamp", name: "headlight left", z: [W - 0.72, W - 0.58], y: [lampY - 0.07, lampY + 0.07], r: 0.065 },
      { kind: "lamp", name: "headlight right", z: [-(W - 0.58), -(W - 0.72)], y: [lampY - 0.07, lampY + 0.07], r: 0.065 },
      { kind: "lamp", name: "tail lamp left", z: [W - 0.38, W - 0.26], y: [lampY - 0.06, lampY + 0.06], r: 0.05, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-(W - 0.26), -(W - 0.38)], y: [lampY - 0.06, lampY + 0.06], r: 0.05, mat: "lampRed" },
      { kind: "plate", name: "number", z: [-0.45, 0.45], y: [s.y0 + 0.05, s.y0 + 0.21] },
    ],
    roofItems: s.roofItems ?? (s.pantograph ? [{ name: "roof cover", x: [-(pX - 1.0), pX - 1.0], w: [W * 0.62, W * 0.52], y: [s.roof - 0.02, s.roof + 0.3], mat: "roof" }] : []),
    // the tanks between the bogies, unless a bogie's frame reaches into the middle
    ...(s.bogies.some(([xc, axles, r]) => Math.abs(xc) - Math.max(...axles.map(Math.abs)) - r - 0.3 < 1.4) ? {} : { underItems: [[-1.3, 1.3, s.y0 - 0.85, s.y0 - 0.35, W - 0.4] as const] }),
    plough: "frame",
    number: s.number,
  };
}
