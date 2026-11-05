// The world bus kit (docs/models/world-buses.md): a bus from one typed
// `WorldBusSpec` in metres from the nose, on the city bus builder (cityBuses.ts
// `cityBus`, the shell of busBody.ts, the fittings and doors of busAssembly.ts):
// city buses (high floor, low floor, low entry), coaches, double-deckers,
// articulated buses and trolleybuses. The kit draws the parts every bus has from
// the spec - the windscreen and its destination display, the head and tail lamps,
// the grille, the plates, the rear window, the roof pods, the mirrors, an upper
// deck's glazing and a trolleybus's two poles - so a design is data.
//
// Axes as every bus's: metres, +X forward (the nose at the largest x), +Y up, +Z
// to the right, centred on z 0, the wheels on y 0. The passenger doors are on the
// right (+z), the game's kerb side, whichever side the real bus has them.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { DoorStyle, PaneStyle } from "./busAssembly.ts";
import { cityBus, cityBusLod, earMirrors, armMirrors, roofBox, type CityCtx, type CitySpec } from "./cityBuses.ts";
import { endLamp, endSlab } from "./busKit.ts";
import { liftable } from "./liftable.ts";
import { TRAM_COLLECTOR_TOP } from "./collector.ts";

export type BusKind = "city" | "coach" | "double" | "minibus";

/** A band of paint along the sides and ends: from metre u0 to u1 off the nose, y0 to y1 above the road. */
export type Band = readonly [u0: number, u1: number, y0: number, y1: number, mat: string];

export interface WorldBusSpec {
  kind: BusKind;
  /** Over the body, bumpers aside; the width; the roof's crown (pods and poles aside). */
  length: number;
  width: number;
  height: number;
  /** The underside of the body above the road. */
  floor: number;
  /** Where the sides start to lean in, and the eave (the roof's edge). */
  belt: number;
  eave: number;
  /** The nose: upright to `from`, raked back `rake` to the eave; the plan's corner chamfers. */
  front: { from: number; rake: number; chamfer?: [number, number] };
  rear: { from: number; rake: number; chamfer?: [number, number] };
  /** The axles, metres from the nose, front first; the first is steered. */
  axles: ReadonlyArray<{ at: number; dual?: boolean; drive?: boolean }>;
  wheelRadius: number;
  /** An articulated bus's rigid bodies, metres from the nose, front first; one body when absent. */
  bodies?: ReadonlyArray<readonly [number, number]>;
  /** Colours by material name; `body` is the base. */
  livery: Record<string, string>;
  paint: readonly Band[];
  /** The side glazing: its style, the window runs (metres from the nose) and the pane pitch. */
  pane: PaneStyle;
  windows: ReadonlyArray<readonly [number, number]>;
  pitch: number;
  /** A double-decker's upper deck: its pane style and runs. */
  upper?: { pane: PaneStyle; windows: ReadonlyArray<readonly [number, number]>; pitch: number };
  door: DoorStyle;
  /** The doors on the right, metres from the nose. */
  doors: ReadonlyArray<readonly [number, number]>;
  /** The nose's glazing: the windscreen (and an upper deck's front windows) and the destination display. */
  screen: { y0: number; y1: number; half: number; sign?: [number, number]; upper?: [number, number] };
  /** The head lamps: rectangles in the lower corners, or round pairs. */
  lamps: { kind: "corner" | "round"; y0: number; y1: number; w?: number };
  /** A grille across the nose: its height range and half width. */
  grille?: [number, number, number];
  /** The rear: its window (height range, half width), the tail lamps' foot, the engine grille's height range. */
  back: { window?: [number, number, number]; lamps: number; grille?: [number, number] };
  /** Roof pods: metres from the nose, half width, top, material. */
  roof?: ReadonlyArray<readonly [number, number, number, number, string]>;
  mirrors: "ear" | "arm";
  /** A trolleybus's poles: where their bases stand, metres from the nose. */
  trolley?: { at: number };
  maxSteerDeg?: number;
  maxBendDeg?: number;
}

/** The trolley poles' length, and the spacing of the two wires they run on (z). */
const POLE_LENGTH = 6.0;
const POLE_GAP = 0.3;

/** The tyre spans of a bus `hw` half wide: a single front tyre, a twin pair's inner and outer. */
function tyres(hw: number): CitySpec["tyres"] {
  return { single: [hw - 0.31, hw - 0.05], inner: [hw - 0.61, hw - 0.35], outer: [hw - 0.32, hw - 0.06] };
}

/** The city bus description of a world bus: u is metres from the nose. */
export function worldCitySpec(s: WorldBusSpec): CitySpec {
  const hw = s.width / 2;
  const r = s.wheelRadius;
  const roof = s.height;
  const articulated = (s.bodies?.length ?? 1) > 1;
  return {
    livery: { band: "#1d2023", bumper: "#2a2c30", pod: s.livery.body ?? "#eeeeee", pole: "#2b2d31", ...s.livery },
    nose: 0, tail: s.length, length: s.length,
    bodies: (s.bodies ?? [[0, s.length]]).map(([a, b]) => [a, b]),
    axles: s.axles.map((a, i) => ({ at: a.at, dual: a.dual ?? i > 0, ...(a.drive ? { drive: true } : {}) })),
    wheelRadius: r, hw, bottom: s.floor, belt: s.belt, eave: s.eave, roof, tumble: 0.02, corner: 0.12,
    front: { from: s.front.from, rake: s.front.rake, cap: 0.12, low: 0.18, chamfer: s.front.chamfer ?? [0.3, 0.12] },
    rear: { from: s.rear.from, rake: s.rear.rake, cap: 0.14, low: 0.45, chamfer: s.rear.chamfer ?? [0.22, 0.1] },
    paint: s.paint.map(([u0, u1, y0, y1, mat]) => ({ u0, u1, y0, y1, mat })),
    pane: s.pane, pitch: s.pitch, door: s.door,
    doors: s.doors.map(([a, b]) => [a, b]),
    windows: s.windows.map(([a, b]) => [a, b]),
    arch: { half: r + 0.12, side: Math.max(r * 1.25, s.floor + 0.05), top: Math.max(r * 2.17, s.floor + 0.35) },
    tyres: tyres(hw),
    ...(articulated ? { bellows: {
      profile: [[-hw + 0.07, s.floor + 0.12], [hw - 0.07, s.floor + 0.12], [hw - 0.07, s.eave - 0.18], [hw - 0.2, s.eave + 0.04], [0, roof - 0.05], [-hw + 0.2, s.eave + 0.04], [-hw + 0.07, s.eave - 0.18]],
      folds: 9, depth: 0.05,
    } } : {}),
    maxSteerDeg: s.maxSteerDeg ?? (s.kind === "coach" ? 45 : 50),
    ...(articulated ? { maxBendDeg: s.maxBendDeg ?? 50 } : {}),
    details: (c) => details(c, s),
  };
}

/** The parts every world bus draws from its spec. */
function details(c: CityCtx, s: WorldBusSpec): void {
  const { x, hw } = c;
  const sc = s.screen;
  // the nose: the windscreen with its frame, the display behind its top, the wipers
  c.d.glaze(1, -sc.half, sc.half, sc.y0, sc.y1);
  if (sc.upper) c.d.glaze(1, -sc.half, sc.half, sc.upper[0], sc.upper[1]);
  c.d.fit("front", c.nose, () => {
    const m = c.m();
    endSlab(m, "frame", c.frame, 1, -sc.half - 0.05, sc.half + 0.05, sc.y0 - 0.04, sc.y1 + 0.03, 0.01);
    endSlab(m, "glass", c.frame, 1, -sc.half, sc.half, sc.y0, sc.y1, 0.02);
    if (sc.sign) {
      endSlab(m, "sign", c.frame, 1, -sc.half + 0.12, sc.half - 0.12, sc.sign[0], sc.sign[1], 0.026);
      endSlab(m, "signText", c.frame, 1, -sc.half + 0.3, sc.half - 0.3, sc.sign[0] + 0.05, sc.sign[1] - 0.05, 0.03);
    }
    for (const z of [-sc.half + 0.1, 0.06]) endSlab(m, "frame", c.frame, 1, z, z + sc.half - 0.16, sc.y0 + 0.05, sc.y0 + 0.08, 0.03);
    if (sc.upper) {
      endSlab(m, "frame", c.frame, 1, -sc.half - 0.05, sc.half + 0.05, sc.upper[0] - 0.04, sc.upper[1] + 0.03, 0.01);
      endSlab(m, "glass", c.frame, 1, -sc.half, sc.half, sc.upper[0], sc.upper[1], 0.02);
    }
    const l = s.lamps;
    for (const sd of [-1, 1]) {
      if (l.kind === "corner") {
        const w = l.w ?? 0.36;
        const z1 = sd * (hw - 0.07);
        const z0 = z1 - sd * w;
        endSlab(m, "frame", c.frame, 1, Math.min(z0, z1) - 0.02, Math.max(z0, z1) + 0.02, l.y0 - 0.02, l.y1 + 0.02, 0.008);
        endSlab(m, "lampHead", c.frame, 1, Math.min(z0, z1) + (sd > 0 ? 0 : w * 0.45), Math.max(z0, z1) - (sd > 0 ? w * 0.45 : 0), l.y0 + 0.01, l.y1 - 0.01, 0.016);
        endSlab(m, "lampAmber", c.frame, 1, sd > 0 ? Math.max(z0, z1) - w * 0.4 : Math.min(z0, z1), sd > 0 ? Math.max(z0, z1) : Math.min(z0, z1) + w * 0.4, l.y0 + 0.01, l.y1 - 0.01, 0.016);
      } else {
        const zc = sd * (hw - 0.3);
        const yc = (l.y0 + l.y1) / 2;
        const rr = (l.y1 - l.y0) / 2;
        endSlab(m, "frame", c.frame, 1, zc - 0.22, zc + 0.22, l.y0 - 0.02, l.y1 + 0.02, 0.008);
        for (const dz of [-0.1, 0.1]) endLamp(m, "lampHead", c.frame, 1, zc + dz, yc, rr * 0.8, 0.016, undefined, 10);
        endSlab(m, "lampAmber", c.frame, 1, sd * (hw - 0.09) - 0.04, sd * (hw - 0.09) + 0.04, l.y0, l.y1, 0.016);
      }
    }
    if (s.grille) {
      const [g0, g1, gh] = s.grille;
      endSlab(m, "grille", c.frame, 1, -gh, gh, g0, g1, 0.012);
    }
    const py = Math.max(s.floor + 0.12, 0.38);
    endSlab(m, "plate", c.frame, 1, -0.26, 0.26, py, py + 0.12, 0.016);
  });
  // the rear: its window, the engine's grille, the tail lamp columns, the plate
  const b = s.back;
  if (b.window) c.d.glaze(-1, -b.window[2], b.window[2], b.window[0], b.window[1]);
  c.d.fit("rear", c.tail, () => {
    const m = c.m();
    if (b.window) {
      endSlab(m, "frame", c.frame, -1, -b.window[2] - 0.05, b.window[2] + 0.05, b.window[0] - 0.04, b.window[1] + 0.04, 0.01);
      endSlab(m, "glassDark", c.frame, -1, -b.window[2], b.window[2], b.window[0], b.window[1], 0.02);
    }
    if (b.grille) {
      const n = Math.max(2, Math.floor((b.grille[1] - b.grille[0]) / 0.11));
      for (let i = 0; i < n; i++) endSlab(m, "grille", c.frame, -1, -hw + 0.35, hw - 0.35, b.grille[0] + i * 0.11, b.grille[0] + i * 0.11 + 0.06, 0.012);
    }
    for (const sd of [-1, 1]) {
      const zc = sd * (hw - 0.12);
      let y = b.lamps;
      for (const [mat, h] of [["lampHead", 0.1], ["lampRed", 0.14], ["lampRed", 0.14], ["lampAmber", 0.12]] as const) {
        endSlab(m, mat, c.frame, -1, zc - 0.07, zc + 0.07, y, y + h - 0.01, 0.015);
        y += h;
      }
    }
    const py = Math.max(s.floor + 0.12, 0.38);
    endSlab(m, "plate", c.frame, -1, -0.26, 0.26, py, py + 0.12, 0.016);
  });
  // an upper deck's windows, both sides
  if (s.upper) for (const side of [-1, 1]) for (const [u0, u1] of s.upper.windows) c.d.run(side, x(u1), x(u0), s.upper.pane, s.upper.pitch);
  for (const [u0, u1, half, top, mat] of s.roof ?? []) roofBox(c, "roof", x(u1), x(u0), -half, half, top, mat, s.height - 0.08);
  if (s.mirrors === "ear") earMirrors(c, Math.min(s.eave, s.screen.y1 + 0.25), 0.18);
  else armMirrors(c, Math.min(s.screen.y1 - 0.1, 2.5));
  if (s.trolley) trolleyPoles(c, s);
}

/**
 * A trolleybus's two poles: from bases on the roof at `trolley.at` back to the
 * wires, each a rod and its shoe, a `liftable` mechanism ("trolleypole") from
 * lowered on the roof (lift 0) to raised (lift 1) with the shoes' tops at the
 * game's trolley wire (collector.ts TRAM_COLLECTOR_TOP); the base and its hooks
 * stay put.
 */
function trolleyPoles(c: CityCtx, s: WorldBusSpec): void {
  const xb = c.x(s.trolley!.at);
  const yb = s.height + 0.3; // the poles' hinge, on the base frame
  c.d.roofItem(xb - 0.7, xb + 0.5, -0.45, 0.45, s.height - 0.08, yb - 0.1, "pole");
  c.d.fit("trolley poles", xb, () => {
    const m = c.m();
    roofBase(m, xb, s.height - 0.08, yb);
    // the angle a pole lies at, and its raised angle whose shoe top touches the wire
    const shoe = 0.06;
    const shoeR = 0.035;
    const up = Math.asin((TRAM_COLLECTOR_TOP - shoe - shoeR - yb) / POLE_LENGTH);
    const down = Math.asin(0.12 / POLE_LENGTH);
    for (const zs of [-1, 1]) {
      const z = zs * POLE_GAP;
      liftable(m, "trolleypole", (mm, lift) => {
        const a = down + (up - down) * lift;
        const tip: [number, number, number] = [xb - POLE_LENGTH * Math.cos(a), yb + POLE_LENGTH * Math.sin(a), z];
        mm.rod("pole", [xb, yb, z], tip, 0.03, 6);
        // the shoe on the pole's end: it stays level as the pole swings (a piece of its own)
        mm.rod("frame", [tip[0] - 0.1, tip[1] + shoe, z], [tip[0] + 0.1, tip[1] + shoe, z], shoeR, 6);
      });
    }
  });
}

/** The poles' base frame on the roof: a plinth and two hinge blocks. */
function roofBase(m: MeshBuilder, xb: number, y0: number, yb: number): void {
  m.box("pole", xb - 0.1, 0, 1.2, 0.9, y0, yb - 0.1);
  for (const zs of [-1, 1]) m.box("frame", xb, zs * POLE_GAP, 0.2, 0.14, yb - 0.11, yb - 0.04);
}

/** Builds a world bus. */
export function worldBus(s: WorldBusSpec): MeshBuilder {
  return cityBus(worldCitySpec(s));
}

/** A world bus's distant model. */
export function worldBusLod(s: WorldBusSpec): MeshBuilder {
  return cityBusLod(worldCitySpec(s));
}

/** The kit options a bus spec uses (worldFleet.ts). */
export function busFeatures(s: WorldBusSpec, params: readonly string[]): string[] {
  const sections = s.bodies?.length ?? 1;
  return [
    `kind:${s.kind}`,
    `sections:${sections}`,
    `axles:${s.axles.length}`,
    s.floor < 0.3 ? "floor:low" : "floor:high",
    `lamps:${s.lamps.kind}`,
    `mirrors:${s.mirrors}`,
    ...(s.upper ? ["upper-deck"] : []),
    ...(s.trolley ? ["trolley"] : []),
    ...(s.back.window ? ["rear-window"] : []),
    ...(s.grille ? ["grille"] : []),
    ...(s.roof?.length ? ["roof-pods"] : []),
    ...params.map((p) => `param:${p}`),
  ];
}
