// The shapes the world trams share (docs/models/world-trams.md): the bases a
// spec starts from - a classic high-floor car, a low-floor car, a vintage car, a
// double-decker, an open cross-bench car - the layout helpers that place trucks
// and doors by section, and the extras the kit cannot say: a horse, a tram
// engine's chimney and cab, a cable car's grip, a pusher's buffer. The designs'
// specs are in worldTramsEurope.ts and worldTramsWorld.ts.

import type { MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { GameProperties, ParamSpec, ParamValues, ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { lodSideBox } from "./lodKit.ts";
import { tramLodBudget, type Collector, type FrontKind, type Stack, type TramCtx, type TruckSpec, type WorldTramSpec } from "./worldTramKit.ts";
import { TRAM_CATALOG } from "./trams.ts";

export type Doors = ReadonlyArray<readonly [number, number]>;

export interface Base {
  sections: readonly number[];
  gap?: number;
  width?: number;
  height?: number;
  doors: Doors;
  trucks: readonly TruckSpec[];
  collector: Collector;
  colors: Record<string, string>;
  paint?: Stack;
  front?: FrontKind;
  rear?: FrontKind;
  doubleEnded?: boolean;
  roofBoxes?: WorldTramSpec["roofBoxes"];
  gauge?: number;
  wheelRadius?: number;
  pitch?: number;
  /** Anything else of the spec, as it is. */
  over?: Partial<WorldTramSpec>;
}

// ---------------------------------------------------------------------------
// running gear, collectors, doors

export const bogies = (wb: number, ...at: number[]): TruckSpec[] => at.map((a) => ({ at: a, kind: "bogie", wb }));
export const jacobs = (wb: number, ...at: number[]): TruckSpec[] => at.map((a) => ({ at: a, kind: "jacobs", wb }));
export const portals = (...at: number[]): TruckSpec[] => at.map((a) => ({ at: a, kind: "portal", wb: 0 }));
export const guided = (...at: number[]): TruckSpec[] => at.map((a) => ({ at: a, kind: "guided", wb: 0 }));
export const truck = (wb: number, ...at: number[]): TruckSpec[] => at.map((a) => ({ at: a, kind: "truck", wb }));
export const diamond = (at: number, reach?: number): Collector => ({ kind: "diamond", at, ...(reach ? { reach } : {}) });
export const arm = (at: number): Collector => ({ kind: "single", at });
/** A double-decker's single arm on short insulators, folding half a metre under the wire. */
export const lowArm = (at: number): Collector => ({ kind: "single", at, low: true });
export const pole = (at: number, length?: number): Collector => ({ kind: "pole", at, ...(length ? { length } : {}) });
export const NO_COLLECTOR: Collector = { kind: "none" };

/** Doors `w` wide starting at each of `at`, metres from the nose. */
export const doorsAt = (w: number, ...at: number[]): Doors => at.map((a) => [a, a + w] as const);

/** The sections laid out from the nose: where a section starts, its middle, a joint's middle. */
export function lay(sections: readonly number[], gap: number): { at: (i: number, off: number) => number; mid: (i: number) => number; joint: (i: number) => number; L: number } {
  const starts: number[] = [];
  let u = 0;
  for (const len of sections) { starts.push(u); u += len + gap; }
  return {
    at: (i, off) => starts[i]! + off,
    mid: (i) => starts[i]! + sections[i]! / 2,
    joint: (i) => starts[i]! + sections[i]! + gap / 2,
    L: u - gap,
  };
}

/**
 * A multi-articulated low-floor car: `sections` with a bogie under the middle of
 * each section listed in `carried` (the others floating between them), and
 * doors `w` wide centred on the floating modules and on the carried sections
 * clear of their bogies (`doors` lists [section, offset of the door's start]).
 */
export function modular(sections: readonly number[], gap: number, carried: readonly number[], wb: number): { trucks: TruckSpec[]; l: ReturnType<typeof lay> } {
  const l = lay(sections, gap);
  return { trucks: carried.map((i) => ({ at: l.mid(i), kind: "bogie" as const, wb })), l };
}

/** Doors `w` wide at [section, offset] places. */
export const secDoors = (l: ReturnType<typeof lay>, w: number, ...at: Array<readonly [number, number]>): Doors => at.map(([i, off]) => [l.at(i, off), l.at(i, off) + w] as const);

// ---------------------------------------------------------------------------
// the bases

/**
 * A high-floor car of the 1950s to 1990s (the Tatra, Duewag and Soviet cars): the
 * body's underside 0.36 m over the rail, steps behind folding doors, windows over
 * a tall belt, an arched roof, 700 mm wheels.
 */
export function classic(o: Base): WorldTramSpec {
  const H = o.height ?? 3.1;
  const eave = H - 0.3;
  return {
    sections: o.sections, gap: o.gap ?? 0.45, width: o.width ?? 2.5, height: H, eave, floor: 0.36, roof: "arched",
    front: o.front ?? "tatra", ...(o.rear ? { rear: o.rear } : {}), doubleEnded: o.doubleEnded ?? false,
    windows: [1.62, eave - 0.12], pitch: o.pitch ?? 1.5, screen: [1.55, eave - 0.02], sign: 0.2,
    doors: o.doors, doorKind: "fold", doorSill: 0.4, doorTop: eave - 0.1,
    trucks: o.trucks, wheelRadius: o.wheelRadius ?? 0.35, gauge: o.gauge ?? 1435, collector: o.collector,
    ...(o.roofBoxes ? { roofBoxes: o.roofBoxes } : {}),
    colors: o.colors, paint: o.paint ?? [[0.95, "skirt"], [1.55, "body"], [3.5, "upper"]],
    lamps: 0.85,
    ...o.over,
  };
}

/**
 * A high-floor light rail car (the Stadtbahn, the US LRVs): taller and wider than
 * a street tram, its floor near a metre over the rail, plug doors with steps,
 * a flatter roof, 680 mm wheels.
 */
export function lrv(o: Base): WorldTramSpec {
  const H = o.height ?? 3.7;
  const eave = H - 0.28;
  return {
    sections: o.sections, gap: o.gap ?? 0.5, width: o.width ?? 2.65, height: H, eave, floor: 0.45, roof: "flat",
    front: o.front ?? "duewag", ...(o.rear ? { rear: o.rear } : {}), doubleEnded: o.doubleEnded ?? true,
    windows: [1.75, eave - 0.18], pitch: o.pitch ?? 1.6, screen: [1.6, eave - 0.05], sign: 0.25,
    doors: o.doors, doorKind: "plug", doorSill: 0.5, doorTop: eave - 0.22, doorPaint: "doorLeaf",
    trucks: o.trucks, wheelRadius: o.wheelRadius ?? 0.34, gauge: o.gauge ?? 1435, collector: o.collector,
    ...(o.roofBoxes ? { roofBoxes: o.roofBoxes } : {}),
    colors: { doorLeaf: o.colors.body ?? "#dddddd", ...o.colors }, paint: o.paint ?? [[1.0, "skirt"], [3.9, "body"]],
    lamps: 1.0,
    ...o.over,
  };
}

/**
 * A low-floor car of the 1990s on (Combino, Citadis, Flexity): the body's
 * underside 0.22 m over the rail, plug doors, deep glazing, a flatter roof with
 * its equipment under fairings, 600 mm wheels.
 */
export function lowFloor(o: Base): WorldTramSpec {
  const H = o.height ?? 3.4;
  const eave = H - 0.24;
  return {
    sections: o.sections, gap: o.gap ?? 0.4, width: o.width ?? 2.4, height: H, eave, floor: 0.22, roof: "flat",
    front: o.front ?? "modern", ...(o.rear ? { rear: o.rear } : {}), doubleEnded: o.doubleEnded ?? true,
    windows: [1.0, eave - 0.18], pitch: o.pitch ?? 1.6, screen: [0.95, eave - 0.05], sign: 0.26,
    doors: o.doors, doorKind: "plug", doorSill: 0.3, doorTop: eave - 0.3, doorPaint: "doorLeaf",
    trucks: o.trucks, wheelRadius: o.wheelRadius ?? 0.3, gauge: o.gauge ?? 1435, collector: o.collector,
    ...(o.roofBoxes ? { roofBoxes: o.roofBoxes } : {}),
    colors: { doorLeaf: o.colors.body ?? "#dddddd", ...o.colors }, paint: o.paint ?? [[0.62, "skirt"], [3.6, "body"]],
    lamps: 0.62,
    ...o.over,
  };
}

/**
 * A vintage car (a wooden or steel car before the 1950s): a high body on its
 * trucks, an arched roof carried over upright vestibule ends, small windows,
 * swinging doors, larger wheels.
 */
export function vintage(o: Base): WorldTramSpec {
  const H = o.height ?? 3.25;
  const eave = H - 0.32;
  return {
    sections: o.sections, gap: o.gap ?? 0.45, width: o.width ?? 2.2, height: H, eave, floor: 0.72, roof: "arched",
    front: o.front ?? "retro", ...(o.rear ? { rear: o.rear } : {}), doubleEnded: o.doubleEnded ?? true,
    windows: [1.55, eave - 0.15], pitch: o.pitch ?? 0.95, screen: [1.55, eave - 0.1], sign: 0.18,
    doors: o.doors, doorKind: "swing", doorSill: 0.76, doorTop: eave - 0.12, doorPaint: "body",
    trucks: o.trucks, wheelRadius: o.wheelRadius ?? 0.38, gauge: o.gauge ?? 1435, collector: o.collector,
    ...(o.roofBoxes ? { roofBoxes: o.roofBoxes } : {}),
    colors: o.colors, paint: o.paint ?? [[1.5, "body"], [3.5, "upper"]],
    lamps: 1.1, clerestory: true,
    ...o.over,
  };
}

/**
 * A double-decker: the lower saloon's windows over a short skirt, the upper
 * deck's under the roof, the stairs inside (a covered top), or an open top deck
 * on the saloon's roof (`over: { deck: "open" }`, the height then the saloon's).
 */
export function doubleDeck(o: Base): WorldTramSpec {
  const H = o.height ?? 4.5;
  const eave = H - 0.22;
  return {
    sections: o.sections, gap: o.gap ?? 0.45, width: o.width ?? 2.3, height: H, eave, floor: 0.62, roof: "arched",
    front: o.front ?? "retro", ...(o.rear ? { rear: o.rear } : {}), doubleEnded: o.doubleEnded ?? true,
    windows: [1.3, 2.15], upper: [2.95, eave - 0.12], pitch: o.pitch ?? 1.0, screen: [1.3, 2.25], sign: 0,
    doors: o.doors, doorKind: "fold", doorSill: 0.66, doorTop: 2.3, doorPaint: "body",
    trucks: o.trucks, wheelRadius: o.wheelRadius ?? 0.34, gauge: o.gauge ?? 1435, collector: o.collector,
    ...(o.roofBoxes ? { roofBoxes: o.roofBoxes } : {}),
    colors: o.colors, paint: o.paint ?? [[1.25, "skirt"], [2.25, "body"], [2.9, "skirt"], [4.6, "upper"]],
    lamps: 0.95,
    ...o.over,
  };
}

// ---------------------------------------------------------------------------
// extras

/**
 * A horse in front of the car, between the rails at `u` metres ahead of the nose
 * (negative), in its harness: a blocky figure of boxes - body, neck and head,
 * four legs, a tail - and the shafts back to the dash.
 */
export function horse(u: number, coat = "horseCoat"): (k: TramCtx) => void {
  return ({ m, X }) => {
    const x = X(u);
    m.scope("horse", () => {
      m.scope("body", () => block(m, coat, x - 0.75, x + 0.75, 1.0, 1.55, -0.28, 0.28));
      m.scope("neck", () => m.rod(coat, [x + 0.65, 1.35, 0], [x + 1.05, 1.95, 0], 0.17, 6));
      m.scope("head", () => block(m, coat, x + 0.95, x + 1.5, 1.72, 2.02, -0.12, 0.12));
      m.scope("ears", () => { for (const s of [-1, 1]) block(m, coat, x + 1.0, x + 1.07, 2.02, 2.14, ...side(s, 0.05, 0.1)); });
      m.scope("mane", () => block(m, "horseMane", x + 0.62, x + 1.02, 1.62, 2.04, -0.04, 0.04));
      m.scope("legs", () => {
        for (const dx of [-0.6, 0.6]) for (const s of [-1, 1]) {
          block(m, coat, x + dx - 0.08, x + dx + 0.08, 0.12, 1.04, ...side(s, 0.1, 0.24));
          block(m, "horseMane", x + dx - 0.09, x + dx + 0.09, 0.0, 0.12, ...side(s, 0.09, 0.25));
        }
      });
      m.scope("tail", () => m.rod("horseMane", [x - 0.74, 1.45, 0], [x - 0.95, 0.85, 0], 0.07, 6));
      m.scope("harness", () => {
        block(m, "harness", x + 0.25, x + 0.45, 0.98, 1.57, -0.3, 0.3);
        for (const s of [-1, 1]) m.rod("timber", [x + 0.35, 1.2, s * 0.34], [X(0) - 0.05, 1.0, s * 0.34], 0.03, 6);
      });
    });
  };
}

/** A horse's distant model: its body and legs as two side boxes. */
export function horseLod(u: number): (m: MeshBuilder, k: { X: (u: number) => number }) => void {
  return (m, { X }) => {
    const x = X(u);
    lodSideBox(m, "horseCoat", [[x - 0.75, 0.0], [x + 0.75, 0.0], [x + 0.75, 1.55], [x + 1.5, 2.0], [x - 0.75, 1.55]], -0.25, 0.25);
  };
}

/** A tram engine's chimney: a stack through the roof at `u`, its cowl on top. */
export function chimney(u: number): (k: TramCtx) => void {
  return ({ m, s, X }) => {
    const x = X(u);
    m.scope("chimney", () => {
      m.prism("underframe", ngon(10, 0.13, 0, x, 0), s.height - 0.1, s.height + 0.95);
      m.prism("underframe", ngon(10, 0.19, 0, x, 0), s.height + 0.95, s.height + 1.15);
    });
    m.emit("smoke", [x, s.height + 1.15, 0], 0.15);
  };
}

/** A chimney's distant model. */
export function chimneyLod(u: number): (m: MeshBuilder, k: { s: WorldTramSpec; X: (u: number) => number }) => void {
  return (m, { s, X }) => {
    const x = X(u);
    lodSideBox(m, "underframe", [[x - 0.13, s.height - 0.1], [x + 0.13, s.height - 0.1], [x + 0.18, s.height + 1.15], [x - 0.18, s.height + 1.15]], -0.15, 0.15);
  };
}

/** A cable car's grip: the gripman's lever and the grip's shank down through the floor into the slot, at `u`. */
export function grip(u: number): (k: TramCtx) => void {
  return ({ m, s, X }) => {
    const x = X(u);
    m.scope("grip", () => {
      block(m, "steel", x - 0.08, x + 0.08, 0.02, s.floor + 0.2, -0.03, 0.03);
      block(m, "underframe", x - 0.22, x + 0.22, s.floor - 0.12, s.floor, -0.12, 0.12);
      m.rod("steel", [x, s.floor + 0.2, 0], [x + 0.25, s.floor + 1.35, 0], 0.03, 6);
      block(m, "rubber", x + 0.2, x + 0.3, s.floor + 1.33, s.floor + 1.43, -0.05, 0.05);
    });
  };
}

/** The buffer plate a pusher car leans on, under the lower end at `u` (the Opicina cars' cable tractors). */
export function pusherPlate(u: number): (k: TramCtx) => void {
  return ({ m, X }) => {
    const x = X(u);
    m.scope("pusher buffer", () => {
      block(m, "underframe", x - 0.3, x + 0.05, 0.62, 0.78, -0.08, 0.08);
      block(m, "steel", x - 0.36, x - 0.3, 0.5, 0.9, -0.75, 0.75);
    });
  };
}

// ---------------------------------------------------------------------------
// the design records

type Builder = (p?: ParamValues) => MeshBuilder;

export interface WorldTram {
  id: string;
  title: string;
  spec: (p?: ParamValues) => WorldTramSpec;
  build: Builder;
  buildLod: Builder;
  params?: readonly ParamSpec[];
  finishParams?: readonly string[];
  game: GameProperties;
  references: string;
}

export const g = (weight: number, power: number, maxspeed: number, variants?: GameProperties["variants"]): GameProperties =>
  ({ weight, power, maxspeed, accel: null, ...(variants ? { variants } : {}) });

/** The LOD budget of a design: its largest combination's (worldTramKit.ts tramLodBudget). */
function lodOf(t: WorldTram): 100 | 200 | 300 | 500 {
  const combos = (t.params ?? []).flatMap((p) => p.values.map((v) => ({ [p.name]: v.value })));
  return Math.max(tramLodBudget(t.spec()), ...combos.map((c) => tramLodBudget(t.spec(c)))) as 100 | 200 | 300 | 500;
}

/** The catalog design of a world tram. */
export function tramDesign(t: WorldTram): ProceduralDesign {
  return {
    id: t.id,
    title: t.title,
    game: t.game,
    build: t.build,
    buildLod: t.buildLod,
    ...(t.params ? { params: t.params } : {}),
    ...(t.finishParams ? { finishParams: t.finishParams } : {}),
    references: t.references,
    lodTriangles: lodOf(t),
    catalog: TRAM_CATALOG,
  };
}

/** A livery parameter: values with titles, the first the default. */
export const liveryParam = (...values: Array<readonly [string, string]>): ParamSpec => ({
  name: "livery", title: "Livery", default: values[0]![0], values: values.map(([value, title]) => ({ value, title })),
});
