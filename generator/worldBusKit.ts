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
import { AXLE_FACTOR, endLamp, endSlab, sideSlab, type BusFrame } from "./busKit.ts";
import { drawShell, type Paint } from "./busBody.ts";
import { arc, block, plate } from "./vehicleParts.ts";
import type { Ring } from "./meshCore.ts";
import { liftable } from "./liftable.ts";
import { TRAM_COLLECTOR_TOP } from "./collector.ts";

export type BusKind = "city" | "coach" | "double" | "minibus";

/**
 * A bonnet ahead of a shorter shell (a conventional school bus, a 1950s
 * bonneted bus, a jeepney): the shell starts `length` behind the nose, at the
 * windscreen's foot, and the kit draws the hood, the engine under it, the
 * fenders round the steered wheels (clear of the tyres at full lock), the
 * bumper, the grille, the head lamps and the plate as fittings ahead of it.
 */
export interface Bonnet {
  /** From the nose (the bumper's face) back to the shell's front. */
  length: number;
  /** The hood's top at its front and at the windscreen. */
  top: readonly [number, number];
  /** The hood's half width; the fenders reach out to the body's side. */
  half: number;
  /** The grille on the hood's front: height range and half width. */
  grille?: readonly [number, number, number];
  /** Colours: the hood (the body's by default), the fenders (the hood's), the bumper ("bumper"). */
  mat?: string;
  fender?: string;
  bumper?: string;
  /**
   * A front-engined double-decker's half cab: the body above `from` carried
   * forward over the bonnet to the nose, the driver's cab under it on the right,
   * the bonnet on the left.
   */
  halfCab?: { from: number };
}

/** A raised deck on the roof (a split-level coach's): metres from the nose, its roof's crown, its window runs. */
export interface Deck {
  from: number;
  to: number;
  height: number;
  windows: ReadonlyArray<readonly [number, number]>;
  pitch: number;
}

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
  /** A bonnet ahead of the shell; the spec's lamps and grille are then on it. */
  bonnet?: Bonnet;
  /** A raised deck on the roof. */
  deck?: Deck;
}

/** The trolley poles' length, and the spacing of the two wires they run on (z). */
const POLE_LENGTH = 6.0;
const POLE_GAP = 0.3;

/** The tyre spans of a bus `hw` half wide: a single front tyre, a twin pair's inner and outer. */
export function tyres(hw: number): CitySpec["tyres"] {
  return { single: [hw - 0.31, hw - 0.05], inner: [hw - 0.61, hw - 0.35], outer: [hw - 0.32, hw - 0.06] };
}

/** The city bus description of a world bus: u is metres from the nose. */
export function worldCitySpec(s: WorldBusSpec): CitySpec {
  const hw = s.width / 2;
  const r = s.wheelRadius;
  const roof = s.height;
  const articulated = (s.bodies?.length ?? 1) > 1;
  // a bonnet: the shell starts behind it; u stays metres from the nose
  const bl = s.bonnet?.length ?? 0;
  return {
    livery: { band: "#1d2023", bumper: "#2a2c30", pod: s.livery.body ?? "#eeeeee", pole: "#2b2d31", ...s.livery },
    nose: bl, tail: s.length, length: s.length - bl,
    bodies: (s.bodies ?? [[0, s.length]]).map(([a, b]) => [a, b]),
    axles: s.axles.map((a, i) => ({ ...(bl ? { u: a.at } : { at: a.at }), dual: a.dual ?? i > 0, ...(a.drive ? { drive: true } : {}) })),
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
  // (a half cab's are on the body carried over the bonnet, drawn with it)
  const halfCab = s.bonnet?.halfCab;
  if (!halfCab) {
    c.d.glaze(1, -sc.half, sc.half, sc.y0, sc.y1);
    if (sc.upper) c.d.glaze(1, -sc.half, sc.half, sc.upper[0], sc.upper[1]);
  }
  c.d.fit("front", c.nose, () => {
    const m = c.m();
    if (!halfCab) noseGlazing(m, c.frame, s);
    if (s.bonnet) return; // the lamps, grille and plate are on the bonnet
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
  if (s.bonnet) bonnet(c, s);
  if (s.deck) deck(c, s);
}

/** The windscreen with its frame, the display behind its top, the wipers, an upper deck's front windows, on the nose `f` describes. */
function noseGlazing(m: MeshBuilder, f: BusFrame, s: WorldBusSpec): void {
  const sc = s.screen;
  endSlab(m, "frame", f, 1, -sc.half - 0.05, sc.half + 0.05, sc.y0 - 0.04, sc.y1 + 0.03, 0.01);
  endSlab(m, "glass", f, 1, -sc.half, sc.half, sc.y0, sc.y1, 0.02);
  if (sc.sign) {
    endSlab(m, "sign", f, 1, -sc.half + 0.12, sc.half - 0.12, sc.sign[0], sc.sign[1], 0.026);
    endSlab(m, "signText", f, 1, -sc.half + 0.3, sc.half - 0.3, sc.sign[0] + 0.05, sc.sign[1] - 0.05, 0.03);
  }
  for (const z of [-sc.half + 0.1, 0.06]) endSlab(m, "frame", f, 1, z, z + sc.half - 0.16, sc.y0 + 0.05, sc.y0 + 0.08, 0.03);
  if (sc.upper) {
    endSlab(m, "frame", f, 1, -sc.half - 0.05, sc.half + 0.05, sc.upper[0] - 0.04, sc.upper[1] + 0.03, 0.01);
    endSlab(m, "glass", f, 1, -sc.half, sc.half, sc.upper[0], sc.upper[1], 0.02);
  }
}

/** The bus's cross-section at half width `hw`, from `bottom` to the crown `roof`, the sides leaning in from `belt` to `eave`. */
export function sectionOf(hw: number, bottom: number, belt: number, eave: number, roof: number): Array<[number, number]> {
  const r: Array<[number, number]> = [[hw - 0.02, eave], [hw - 0.07, eave + (roof - eave) * 0.55], [hw - 0.2, roof - 0.02]];
  return [[-hw, bottom], [hw, bottom], [hw, belt], ...r, [0, roof], ...r.map(([z, y]): [number, number] => [-z, y]).reverse(), [-hw, belt]];
}

/** The livery's bands in the factory's x (u metres from the nose). */
const paintX = (s: WorldBusSpec): Paint[] => s.paint.map(([u0, u1, y0, y1, mat]) => ({ x0: Math.min(s.length - u0, s.length - u1), x1: Math.max(s.length - u0, s.length - u1), y0, y1, mat }));

/** The inside radius of a fender over a front tyre of radius `r` and width `w`: clear of the tyre's side outline at any lock. */
export const fenderRadius = (r: number, w: number): number => r + w / 2 + 0.06;

/**
 * The bonnet (Bonnet): the hood swept from its side profile 2 cm into the
 * shell's front, the engine under it narrower than the tyres' paths at full
 * lock, a fender arched over each front wheel with its nose down ahead of the
 * tyre, the bumper and plate, the grille and the round head lamps on the hood's
 * front; for a half cab, the body above `from` carried on to the nose (a shell
 * of its own, its upper windows and display on its front) and the driver's cab
 * on the right under it. Each is noted for the distant model as a box.
 */
function bonnet(c: CityCtx, s: WorldBusSpec): void {
  const b = s.bonnet!;
  const L = s.length;
  const xs = c.nose;
  const hw = c.hw;
  const r = s.wheelRadius;
  const ay = r * AXLE_FACTOR;
  const ax = L - s.axles[0]!.at;
  const ty = tyres(hw).single;
  const R1 = fenderRadius(r, ty[1] - ty[0]);
  const R2 = R1 + 0.05;
  if (xs > ax - R1 - 0.01) throw new Error(`a bonnet of ${b.length} m is too short for the front axle at ${s.axles[0]!.at} m`);
  if (ax + R1 > L - 0.12) throw new Error(`the front axle at ${s.axles[0]!.at} m leaves no room for the fenders' noses`);
  const rho = Math.hypot(r, (ty[1] - ty[0]) / 2);
  const inner = Math.min(b.half, (ty[0] + ty[1]) / 2 - rho - 0.05);
  const hood = b.mat ?? "body";
  const fender = b.fender ?? hood;
  const xf = L - 0.1;
  const yb = ay + r + 0.06;
  const [h0, h1] = b.top;
  const cab = b.halfCab;
  const zr = cab ? 0.05 : b.half;
  const a0 = 0.12;
  const yTop = ay + R2;
  // the distant model: the hood and fenders as one box (up to a half cab's body, carried on above it)
  c.d.roofItem(xs, xf, -hw + 0.05, hw - 0.05, 0.4, cab ? cab.from : Math.max(h0, h1), hood);
  if (cab) c.d.roofItem(xs, L, -hw, hw, cab.from, s.height, "body");
  c.d.fit("bonnet", (xs + L) / 2, () => {
    const m = c.m();
    const prof: Ring = [[xs - 0.02, yb], [xf, yb], [xf, h0 - 0.06], [xf - 0.08, h0], [xs - 0.02, h1]];
    m.sweep(hood, "z", prof, -b.half, prof, zr);
    block(m, hood, xs - 0.02, xf, 0.4, yb + 0.02, -inner, inner);
    for (const sd of [-1, 1]) {
      const [z0, z1] = sd > 0 ? [b.half - 0.03, hw] : [-hw, -b.half + 0.03];
      plate(m, fender, arc(ax, ay, R2, a0, Math.PI - a0, 7), arc(ax, ay, R1, a0, Math.PI - a0, 7), z0, z1);
      block(m, fender, ax + R1 + 0.01, xf - 0.02, 0.42, ay + R1 * 0.55, z0, z1);
    }
    block(m, b.bumper ?? "bumper", L - 0.08, L, 0.36, 0.56, -hw + 0.04, hw - 0.04);
    block(m, "plate", L - 0.02, L + 0.012, 0.39, 0.53, -0.26, 0.26);
    if (b.grille) {
      const [g0, g1, gh] = b.grille;
      block(m, "grille", xf - 0.02, xf + 0.014, g0, g1, -gh, Math.min(gh, zr - 0.04));
    }
    // round head lamps on the hood's front (on the engine's, below the hood or for a
    // half cab), amber indicators under them
    const l = s.lamps;
    const yc = (l.y0 + l.y1) / 2;
    const rr = (l.y1 - l.y0) / 2;
    const zl = (yc >= yb && !cab ? b.half : inner) - rr - 0.06;
    for (const sd of [-1, 1]) {
      const ring: Ring = Array.from({ length: 10 }, (_, i): [number, number] => [sd * zl + rr * Math.cos((i / 10) * Math.PI * 2), yc + rr * Math.sin((i / 10) * Math.PI * 2)]);
      m.sweep("lampHead", "x", ring, xf - 0.03, ring, xf + 0.018);
      const ya = Math.abs(yc - rr - 0.1 - yb) < 0.01 ? yc - rr - 0.085 : yc - rr - 0.1;
      block(m, "lampAmber", xf - 0.035, xf + 0.016, ya, yc - rr - 0.02, sd * zl - 0.05, sd * zl + 0.05);
    }
    if (cab) {
      // the cab under the body carried forward: its windscreen and side window
      const top = cab.from;
      block(m, "body", xs - 0.02, xf - 0.15, yTop + 0.02, top, zr, hw - 0.02);
      block(m, "glass", xf - 0.17, xf - 0.135, top - 0.62, top - 0.08, zr + 0.1, hw - 0.12);
      block(m, "glass", xs + 0.15, xf - 0.35, top - 0.6, top - 0.08, hw - 0.03, hw - 0.005);
      // the body above, carried to the nose: the upper deck's front windows and the display on its front
      const side: Ring = [[xs, top], [L, top], [L, s.eave - 0.25], [L - 0.08, s.eave], [L - 0.2, s.height], [xs, s.height]];
      const plan: Ring = [[xs, -hw], [L - 0.12, -hw], [L, -hw + 0.12], [L, hw - 0.12], [L - 0.12, hw], [xs, hw]];
      drawShell(m, { section: c.frame.section, side, plan, base: "body", paint: paintX(s), arches: [], under: "under" }, "half cab body");
      const f: BusFrame = { section: c.frame.section, side };
      const sc = s.screen;
      const [u0, u1] = sc.upper ?? [s.eave - 0.8, s.eave - 0.1];
      endSlab(m, "frame", f, 1, -sc.half - 0.05, sc.half + 0.05, u0 - 0.04, u1 + 0.03, 0.01);
      endSlab(m, "glass", f, 1, -sc.half, sc.half, u0, u1, 0.02);
      if (sc.sign) {
        endSlab(m, "sign", f, 1, -0.6, 0.6, sc.sign[0], sc.sign[1], 0.026);
        endSlab(m, "signText", f, 1, -0.45, 0.45, sc.sign[0] + 0.05, sc.sign[1] - 0.05, 0.03);
      }
    }
  });
}

/** A raised deck on the roof (Deck): a shell of its own 1 cm inside the sides, raked at its front, its windows both sides. */
function deck(c: CityCtx, s: WorldBusSpec): void {
  const d = s.deck!;
  const hw = c.hw - 0.01;
  const xr = c.tail + s.rear.rake + 0.02;
  const x1 = c.x(d.from);
  const y0 = s.eave - 0.04;
  const eave = d.height - 0.12;
  const section = sectionOf(hw, y0, y0 + 0.05, eave, d.height);
  const side: Ring = [[xr, y0], [x1, y0], [x1, y0 + 0.1], [x1 - 0.4, eave], [x1 - 0.55, d.height], [xr + 0.12, d.height], [xr, eave]];
  const plan: Ring = [[xr, -hw], [x1, -hw], [x1, hw], [xr, hw]];
  const f: BusFrame = { section, side };
  c.d.roofItem(xr, x1, -hw, hw, y0, d.height, "body");
  c.d.fit("deck", (xr + x1) / 2, () => {
    const m = c.m();
    drawShell(m, { section, side, plan, base: "body", paint: paintX(s), arches: [], under: "under" }, "deck");
    for (const sd of [-1, 1]) for (const [u0, u1] of d.windows) {
      const n = Math.max(1, Math.round((u1 - u0) / d.pitch));
      const w = (u1 - u0) / n;
      for (let i = 0; i < n; i++) sideSlab(m, "glassDark", f, sd, c.x(u0 + (i + 1) * w) + 0.05, c.x(u0 + i * w) - 0.05, y0 + 0.2, eave - 0.06, 0.02);
    }
    endSlab(m, "glassDark", f, 1, -hw + 0.15, hw - 0.15, y0 + 0.2, eave - 0.06, 0.02);
  });
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
    ...(s.bonnet ? [s.bonnet.halfCab ? "half-cab" : "bonnet"] : []),
    ...(s.deck ? ["raised-deck"] : []),
    ...params.map((p) => `param:${p}`),
  ];
}
