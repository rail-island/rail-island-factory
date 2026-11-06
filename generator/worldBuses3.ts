// The buses from around the world, third batch (docs/models/world-buses-2.md): 25
// bonneted buses, minibuses and historic types on the world bus kit
// (worldBusKit.ts) - the AEC Routemaster's half cab, the school buses and the
// camioneta, the 1950s bonneted buses, the jeepney and the songthaew on the kit's
// bonnet; the van-based buses on the minibus shape; the Scenicruiser's raised
// deck. Each at its real size, modelled on the photographs in
// assets/<references>/ and the published figures in each folder's SOURCES.md.
// The ids are stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { DoorStyle, PaneStyle } from "./busAssembly.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import * as refined from "./worldBusRefined.ts";
import { worldBus, worldBusLod, type Band, type Bonnet, type WorldBusSpec } from "./worldBusKit.ts";
import { doubleDeck, highFloor, lowFloor, runs, worldBusDesign, g, type Base, type WorldBus } from "./worldBuses.ts";
import { liveryParam } from "./worldBuses2.ts";

// ---------------------------------------------------------------------------
// the shapes the batch adds

/** A colour parameter: its values (the default first), colour names the phrasebooks hold. */
export const colourParam = (...values: Array<[string, string]>): readonly ParamSpec[] => [{
  name: "colour", title: "Colour", default: values[0]![0],
  values: values.map(([value, title]) => ({ value, title })),
}];

/** The colours `params`' first parameter picks from `table`. */
const pick = (params: readonly ParamSpec[], table: Record<string, Record<string, string>>, p?: ParamValues): Record<string, string> =>
  table[resolveParams(params, p)[params[0]!.name] as string]!;

/**
 * A minibus or a van-based bus: a short, narrow body with its floor over small
 * wheels, framed windows, one sliding door on the right, a near-upright front
 * (`from` and `rake` lean it back: a van's bonnet runs into its windscreen), round
 * head lamps, side-arm mirrors.
 */
export function minibus(o: Base & { from?: number; floor?: number; window?: number }): WorldBusSpec {
  const width = o.width ?? 1.9;
  const hw = width / 2;
  const eave = o.height - 0.1;
  const floor = o.floor ?? 0.32;
  const w0 = o.window ?? 1.15;
  const from = o.from ?? 1.0;
  const door: DoorStyle = { bottom: floor + 0.04, top: eave - 0.12, leafMat: "body", panes: [[w0, eave - 0.18]], leaves: 1 };
  const pane: PaneStyle = { glass: [w0, eave - 0.1], surround: [w0 - 0.04, eave - 0.06], inset: 0.04 };
  return {
    kind: "minibus", length: o.length, width, height: o.height, floor, belt: Math.min(w0 - 0.1, 1.0), eave,
    front: { from, rake: o.rake ?? 0.2, chamfer: [0.18, 0.12] }, rear: { from: eave - 0.15, rake: 0.06, chamfer: [0.12, 0.08] },
    axles: o.axles, wheelRadius: o.wheelRadius ?? 0.33,
    livery: o.livery,
    paint: o.paint ?? [],
    pane, windows: runs(o, 0.3 + (o.rake ?? 0.2), 0.3), pitch: 1.0, door, doors: o.doors,
    screen: { y0: from + 0.05, y1: eave - 0.06, half: hw - 0.1 },
    lamps: { kind: "round", y0: 0.62, y1: 0.8 },
    back: { window: [w0 + 0.05, eave - 0.1, hw - 0.18], lamps: 0.5 },
    ...(o.roof ? { roof: o.roof } : {}),
    mirrors: "arm",
    maxSteerDeg: 45,
  };
}

/**
 * A bonneted bus: the high-floor shape behind the kit's bonnet - the shell from
 * the windscreen's foot back, its windscreen over the hood's top, the windows
 * and doors behind the bonnet, the lamps and grille on the bonnet.
 */
export function bonneted(o: Base & { bonnet: Bonnet; lamps?: readonly [number, number]; floor?: number; screenTop?: number }): WorldBusSpec {
  const s = highFloor(o);
  const bl = o.bonnet.length;
  const top = Math.max(...o.bonnet.top);
  const hw = s.width / 2;
  const [l0, l1] = o.lamps ?? [top - 0.32, top - 0.12];
  return {
    ...s,
    ...(o.floor !== undefined ? { floor: o.floor } : {}),
    front: { from: top + 0.02, rake: o.rake ?? 0.12, chamfer: [0.2, 0.12] },
    windows: runs(o, bl + 0.25, 0.4),
    screen: { y0: top + 0.08, y1: o.screenTop ?? s.eave - 0.1, half: hw - 0.12 },
    lamps: { kind: "round", y0: l0, y1: l1 },
    bonnet: o.bonnet,
    mirrors: "arm",
  };
}

/** Bands of colour along the sides, from the nose to the tail. */
const bands = (length: number, ...b: Array<[number, number, string]>): Band[] => b.map(([y0, y1, mat]) => [-1, length + 1, y0, y1, mat]);

// ---------------------------------------------------------------------------
// the designs' specs

const LONDON_RED = "#c8102e";

export const ROUTEMASTER_PARAMS = liveryParam(["london", "London Transport"], ["greenLine", "Green Line"]);

export function routemasterSpec(p?: ParamValues): WorldBusSpec {
  const green = resolveParams(ROUTEMASTER_PARAMS, p).livery === "greenLine";
  const s = doubleDeck({
    length: 8.38, width: 2.44, height: 4.38,
    axles: [{ at: 1.15 }, { at: 6.28, drive: true }],
    doors: [[7.0, 8.0]],
    livery: green ? { body: "#2f6b3a", band: "#15181c", cream: "#efe6c8" } : { body: LONDON_RED, band: "#15181c", cream: "#efe6c8" },
    paint: [[-1, 8.2, 1.01, 2.16, "band"], [-1, 9.5, 2.17, 2.32, "cream"], [-1, 8.2, 2.56, 4.24, "band"]],
    rake: 0.04,
  });
  return {
    ...s,
    front: { from: s.eave - 0.02, rake: 0.0 },
    windows: runs({ length: 8.38, height: 4.38, axles: [], doors: [], livery: {} }, 2.0, 0.45),
    upper: { ...s.upper!, windows: [[0.4, 7.9]] },
    lamps: { kind: "round", y0: 0.72, y1: 0.92 },
    back: { ...s.back, grille: undefined },
    bonnet: { length: 1.86, top: [1.32, 1.32], half: 1.0, grille: [0.55, 1.28, 0.32], halfCab: { from: 2.17 } },
    // the open rear platform: a doorway with no doors
    door: { ...s.door, open: true },
    detail: true, extras: refined.routemaster,
  };
}

export function o3500Spec(): WorldBusSpec {
  return bonneted({
    length: 9.3, width: 2.48, height: 2.95, wheelRadius: 0.47,
    axles: [{ at: 1.25 }, { at: 5.75, drive: true }],
    doors: [[2.1, 2.9], [7.9, 8.7]],
    // cream with a red skirt and waist, the hood's chrome grille
    livery: { body: "#efe6c8", rub: "#3c3c3c", red: "#9b1d22", bumper: "#c9ccd0" },
    paint: bands(9.3, [0.35, 1.05, "red"], [1.4, 1.48, "red"]),
    bonnet: { length: 2.0, top: [1.42, 1.58], half: 0.55, grille: [0.95, 1.45, 0.28], fender: "red" },
    lamps: [1.12, 1.32],
  });
}

export function saturnSpec(): WorldBusSpec {
  return bonneted({
    length: 10.0, width: 2.5, height: 3.0,
    axles: [{ at: 1.3 }, { at: 6.3, drive: true }],
    doors: [[2.1, 2.9], [7.4, 8.2]],
    // cream over a deep blue skirt, the Rundhauber's rounded hood
    livery: { body: "#efe6c8", rub: "#3c3c3c", blue: "#1d3f7a", bumper: "#c9ccd0" },
    paint: bands(10.0, [0.35, 1.1, "blue"], [0.78, 0.86, "rub"]),
    bonnet: { length: 2.0, top: [1.4, 1.6], half: 0.6, grille: [0.9, 1.4, 0.3], fender: "blue" },
    lamps: [1.12, 1.32],
  });
}

export const SAMBA_PARAMS = colourParam(["red", "Red"], ["blue", "Blue"], ["green", "Green"]);

export function sambaSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(SAMBA_PARAMS, {
    red: { body: "#efeae0", low: "#b3202a" },
    blue: { body: "#efeae0", low: "#2f6aa8" },
    green: { body: "#efeae0", low: "#3f7a4a" },
  }, p);
  const s = minibus({
    length: 4.28, width: 1.75, height: 1.94, wheelRadius: 0.33,
    axles: [{ at: 0.7 }, { at: 3.1, drive: true }],
    doors: [[1.05, 2.15]],
    livery: { ...l, bumper: "#c9ccd0" },
    // the two-tone split: the colour below the belt, the V on the front
    paint: [[-1, 5.3, 0.24, 1.0, "low"]],
    from: 1.0, rake: 0.08, floor: 0.24, window: 1.15,
  });
  return { ...s, front: { ...s.front, chamfer: [0.3, 0.25] } };
}

export function aphSpec(): WorldBusSpec {
  return bonneted({
    length: 9.65, width: 2.5, height: 2.95,
    axles: [{ at: 1.1 }, { at: 6.0, drive: true }],
    doors: [[1.9, 2.8], [7.8, 8.7]],
    // Paris green under cream (the photographs)
    livery: { body: "#efe6c8", rub: "#3c3c3c", green: "#2f6b4a", bumper: "#2a2c30" },
    paint: bands(9.65, [0.35, 1.3, "green"], [2.75, 2.95, "green"]),
    bonnet: { length: 1.8, top: [1.35, 1.5], half: 0.6, grille: [0.75, 1.3, 0.35], fender: "green" },
    lamps: [1.1, 1.28],
  });
}

/** The Skoda 706 RTO's body (the Jelcz 043 is it, built under licence): a full front over the engine, ribbed sides, round lamps, the chrome grille. */
function rto(o: Base): WorldBusSpec {
  const s = highFloor(o);
  return { ...s, front: { from: 1.3, rake: 0.45, chamfer: [0.55, 0.4] }, grille: [0.55, 1.15, 0.45], lamps: { kind: "round", y0: 0.75, y1: 0.95 }, back: { ...s.back, grille: undefined }, rear: { from: 1.6, rake: 0.6, chamfer: [0.5, 0.35] } };
}

/** The ribs along a 706 RTO's sides, under the windows. */
const ribs = (length: number, mat: string): Band[] => [0.55, 0.7, 0.85, 1.0, 1.15].map((y): Band => [-1, length + 1, y, y + 0.05, mat]);

export function jelcz043Spec(): WorldBusSpec {
  return rto({
    length: 10.7, height: 2.95,
    axles: [{ at: 2.1 }, { at: 7.25, drive: true }],
    doors: [[2.7, 3.6], [8.9, 9.8]],
    // red and cream, the "ogorek" of PKS
    livery: { body: "#c42a26", rub: "#3c3c3c", cream: "#efe6c8", rib: "#d8d0b8" },
    paint: [[-1, 11.7, 1.3, 3.0, "cream"], ...ribs(10.7, "rib")],
  });
}

export const RTO_PARAMS = liveryParam(["csad", "ČSAD"], ["cedok", "Čedok"]);

export function rtoSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(RTO_PARAMS, {
    csad: { body: "#c42a26", rub: "#3c3c3c", cream: "#efe6c8", rib: "#d8d0b8" },
    cedok: { body: "#1d4f9c", rub: "#3c3c3c", cream: "#efe6c8", rib: "#d8d0b8" },
  }, p);
  return { ...rto({
    length: 10.7, height: 2.95,
    axles: [{ at: 2.1 }, { at: 7.25, drive: true }],
    doors: [[2.7, 3.6], [8.9, 9.8]],
    livery: l,
    paint: [[-1, 11.7, 1.3, 3.0, "cream"], ...ribs(10.7, "rib")],
  }), detail: true, extras: refined.rto };
}

export function paz672Spec(): WorldBusSpec {
  const s = highFloor({
    length: 7.15, width: 2.44, height: 2.95, wheelRadius: 0.47,
    axles: [{ at: 1.5 }, { at: 5.1, drive: true }],
    doors: [[0.3, 1.1], [5.6, 6.4]],
    // beige with a red waist band
    livery: { body: "#e9dcb0", rub: "#3c3c3c", red: "#b3202a" },
    paint: bands(7.15, [0.78, 0.86, "rub"], [1.25, 1.42, "red"]),
    rake: 0.2,
  });
  return { ...s, front: { ...s.front, chamfer: [0.35, 0.25] }, grille: [0.55, 1.0, 0.5] };
}

export function saurerSpec(): WorldBusSpec {
  const s = bonneted({
    length: 10.0, width: 2.4, height: 3.0,
    axles: [{ at: 1.3 }, { at: 6.0, drive: true }],
    doors: [[2.1, 2.9], [7.3, 8.1]],
    // PTT yellow with the black skirt and cream roof, the roof's glazed edges
    livery: { body: "#f6c900", rub: "#2a2c30", black: "#15181c", cream: "#efe6c8", bumper: "#c9ccd0" },
    paint: bands(10.0, [0.35, 0.9, "black"], [2.82, 3.0, "cream"]),
    bonnet: { length: 2.0, top: [1.4, 1.62], half: 0.58, grille: [0.95, 1.5, 0.3], fender: "black" },
    lamps: [1.1, 1.3],
    // the roof rack over the rear
    roof: [[6.2, 9.4, 0.9, 3.2, "black"]],
  });
  return { ...s, upper: undefined };
}

export const NEW_LOOK_PARAMS = liveryParam(["ttc", "TTC"], ["nycta", "NYCTA"]);

export function newLookSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(NEW_LOOK_PARAMS, {
    ttc: { body: "#f2efe4", rub: "#3c3c3c", red: "#d3252b" },
    nycta: { body: "#f2efe4", rub: "#3c3c3c", red: "#1d4f9c" },
  }, p);
  const s = highFloor({
    length: 12.2, width: 2.59, height: 3.05,
    axles: [{ at: 2.1 }, { at: 9.34, drive: true }],
    doors: [[0.6, 1.45], [6.0, 7.0]],
    livery: l,
    paint: bands(12.2, [0.35, 1.05, "red"], [0.78, 0.86, "rub"]),
    rake: 0.35,
  });
  // the "fishbowl": the windscreen curving down to the bumper and round the corners
  return { ...s, front: { from: 0.95, rake: 0.35, chamfer: [0.5, 0.35] }, screen: { ...s.screen, y0: 1.0 }, lamps: { kind: "round", y0: 0.6, y1: 0.8 } };
}

export function scenicruiserSpec(): WorldBusSpec {
  const s = coachLike({
    length: 12.2, width: 2.44, height: 2.95,
    axles: [{ at: 2.3 }, { at: 9.25, drive: true }, { at: 10.45, dual: false }],
    doors: [[0.4, 1.3]],
    // Greyhound's silver ribbed sides, the blue band under the windows
    livery: { body: "#c9ccd0", skirt: "#5c6166", band: "#15181c", blue: "#1d4f9c" },
    paint: [[-1, 13.2, 0.35, 0.62, "skirt"], [-1, 13.2, 1.55, 1.7, "blue"], [-1, 4.3, 1.82, 2.85, "band"]],
    rake: 0.3, mirrors: "arm",
  });
  // the split level: the raised rear deck over the lower front saloon
  return { ...s, windows: [[0.4, 11.6]], deck: { from: 4.3, to: 12.2, height: 3.4, windows: [[4.8, 11.7]], pitch: 1.3 }, detail: true, extras: refined.scenicruiser };
}

/** The coach shape (its own import kept local). */
function coachLike(o: Base): WorldBusSpec {
  const hw = (o.width ?? 2.55) / 2;
  const eave = o.height - 0.12;
  return {
    kind: "coach", length: o.length, width: o.width ?? 2.55, height: o.height, floor: 0.35, belt: 1.5, eave,
    front: { from: 1.2, rake: o.rake ?? 0.3 }, rear: { from: eave - 0.25, rake: 0.08 },
    axles: o.axles, wheelRadius: o.wheelRadius ?? 0.5,
    livery: o.livery,
    paint: o.paint ?? [],
    pane: { glass: [1.82, eave - 0.1], inset: 0.02, glassMat: "glassDark" }, windows: runs(o, 0.3, 0.6), pitch: 1.4,
    door: { bottom: 0.38, top: eave - 0.16, leafMat: "frame", panes: [[0.5, eave - 0.24]], leafWidth: 0.6 }, doors: o.doors,
    screen: { y0: 1.25, y1: eave - 0.1, half: hw - 0.1, sign: [eave - 0.36, eave - 0.14] },
    lamps: { kind: "round", y0: 0.62, y1: 0.82 },
    grille: [0.66, 1.0, 0.5],
    back: { lamps: 0.7, grille: [1.1, 1.9] },
    mirrors: o.mirrors ?? "arm",
    maxSteerDeg: 45,
  };
}

export function clipperSpec(): WorldBusSpec {
  const s = coachLike({
    length: 10.06, width: 2.44, height: 2.9,
    axles: [{ at: 2.5 }, { at: 7.6, drive: true }],
    doors: [[1.0, 1.8]],
    // the streamlined aluminium body, maroon below the windows
    livery: { body: "#c9ccd0", skirt: "#6b1e24", band: "#15181c" },
    paint: [[-1, 11, 0.35, 1.45, "skirt"]],
    rake: 0.9,
  });
  return {
    ...s, belt: 1.35, pane: { glass: [1.5, s.eave - 0.1], surround: [1.46, s.eave - 0.06], inset: 0.05 },
    front: { from: 0.9, rake: 0.9, chamfer: [0.7, 0.5] }, rear: { from: 1.5, rake: 0.9, chamfer: [0.6, 0.45] },
    screen: { ...s.screen, y0: 1.5, sign: undefined }, back: { lamps: 0.62, grille: [1.0, 1.4] },
  };
}

/** A US school bus's livery: National School Bus Glossy Yellow, black rub rails and bumpers. */
const SCHOOL = { body: "#f7b500", rub: "#15181c", black: "#15181c", bumper: "#15181c", grilleMat: "#2a2c30" };

export function visionSpec(): WorldBusSpec {
  // the side photographs: the rear overhang about 0.55 of the wheelbase, the glass
  // from 2.0 m to the eave's band, four black stripes under it, the name between
  // the upper two
  const L = 10.8;
  const s = bonneted({
    length: L, width: 2.44, height: 3.2,
    axles: [{ at: 1.1 }, { at: 7.2, drive: true }],
    doors: [[2.1, 2.85]],
    livery: { ...SCHOOL, doorFrame: "#b8bcc0" },
    // the stripe just under the glass is a fitting (worldBusRefined.ts vision): the coarse LOD keeps three bands
    paint: bands(L, [0.78, 0.86, "rub"], [1.31, 1.38, "rub"], [1.6, 1.67, "rub"]),
    bonnet: { length: 1.8, top: [1.32, 1.62], half: 0.62, grille: [0.7, 1.25, 0.32], fender: "black" },
    lamps: [1.0, 1.2], rake: 0.18,
  });
  // the eight-way warning lamps never blink as indicators: their own colours, no lamp role
  return {
    ...s, pitch: 0.62, back: { window: [2.02, 2.72, 0.5], lamps: 0.9 },
    pane: { ...s.pane, glass: [2.04, s.eave - 0.18], surround: [1.99, s.eave - 0.13] },
    // the split service door: two glazed leaves in a bright aluminium frame, swinging out
    door: { ...s.door, leafMat: "doorFrame", surround: "doorFrame", panes: [[1.2, s.eave - 0.3], [0.5, 1.1]], leaves: 2, swing: "out" },
    livery: { ...s.livery, warnAmber: "#ffab2e", warnRed: "#d0202a" },
    // the windscreen's top lowered under the cap that carries the warning lamps and the sign
    screen: { ...s.screen, y1: 2.66 },
    detail: true, extras: refined.vision,
  };
}

export function safTLinerSpec(): WorldBusSpec {
  const s = bonneted({
    length: 11.9, width: 2.44, height: 3.2,
    axles: [{ at: 1.2 }, { at: 7.3, drive: true }],
    doors: [[2.25, 3.0]],
    livery: SCHOOL,
    paint: bands(11.9, [0.78, 0.86, "rub"], [1.4, 1.46, "rub"]),
    bonnet: { length: 1.9, top: [1.28, 1.66], half: 0.6, grille: [0.65, 1.2, 0.36], fender: "black" },
    lamps: [0.95, 1.15], rake: 0.3,
  });
  return { ...s, pitch: 0.8, back: { window: [1.65, 2.6, 0.5], lamps: 0.9 } };
}

export const CAMIONETA_PARAMS = colourParam(["red", "Red"], ["blue", "Blue"], ["green", "Green"]);

export function camionetaSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(CAMIONETA_PARAMS, {
    red: { body: "#c8202e", rub: "#f7b500", stripe: "#f4f4f2", stripe2: "#1d4f9c", bumper: "#c9ccd0", luggage: "#6b4a2a", rack: "#2a2c30" },
    blue: { body: "#1d4f9c", rub: "#f7b500", stripe: "#f4f4f2", stripe2: "#c8202e", bumper: "#c9ccd0", luggage: "#6b4a2a", rack: "#2a2c30" },
    green: { body: "#2f8b3e", rub: "#f7b500", stripe: "#f4f4f2", stripe2: "#c8202e", bumper: "#c9ccd0", luggage: "#6b4a2a", rack: "#2a2c30" },
  }, p);
  const s = bonneted({
    length: 10.7, width: 2.44, height: 3.05,
    axles: [{ at: 1.2 }, { at: 6.9, drive: true }],
    doors: [[2.15, 2.85]],
    // the old school bus repainted: stripes of colour along the sides, chrome bumpers
    livery: l,
    paint: bands(10.7, [0.78, 0.86, "rub"], [1.05, 1.35, "stripe"], [2.9, 3.05, "stripe2"]),
    bonnet: { length: 2.1, top: [1.45, 1.55], half: 0.6, grille: [0.75, 1.35, 0.33], mat: "body", fender: "body" },
    lamps: [1.1, 1.3], rake: 0.12,
    // the roof rack and its load of luggage
    roof: [[2.4, 9.8, 1.05, 3.4, "luggage"]],
  });
  return { ...s, pitch: 0.8, back: { window: [1.65, 2.5, 0.5], lamps: 0.9 } };
}

export const COASTER_PARAMS = colourParam(["white", "White"], ["blue", "Blue"], ["red", "Red"]);

export function coasterSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(COASTER_PARAMS, {
    white: { body: "#f4f4f2", stripe: "#1d4f9c", bumper: "#c9ccd0" },
    blue: { body: "#2f6aa8", stripe: "#f4f4f2", bumper: "#c9ccd0" },
    red: { body: "#c8202e", stripe: "#f4f4f2", bumper: "#c9ccd0" },
  }, p);
  return minibus({
    length: 6.99, width: 2.03, height: 2.6, wheelRadius: 0.37,
    axles: [{ at: 1.15 }, { at: 5.08, drive: true }],
    doors: [[1.65, 2.4]],
    livery: l,
    paint: [[-1, 8, 0.85, 0.95, "stripe"]],
    from: 0.95, rake: 0.35, floor: 0.36, window: 1.2,
  });
}

export const JEEPNEY_PARAMS = colourParam(["red", "Red"], ["blue", "Blue"], ["yellow", "Yellow"]);

export function jeepneySpec(p?: ParamValues): WorldBusSpec {
  const l = pick(JEEPNEY_PARAMS, {
    red: { body: "#c8202e", chrome: "#c9ccd0", stripe: "#f7b500", stripe2: "#1d4f9c", bumper: "#c9ccd0" },
    blue: { body: "#1d4f9c", chrome: "#c9ccd0", stripe: "#f7b500", stripe2: "#c8202e", bumper: "#c9ccd0" },
    yellow: { body: "#f7b500", chrome: "#c9ccd0", stripe: "#c8202e", stripe2: "#1d4f9c", bumper: "#c9ccd0" },
  }, p);
  const s = bonneted({
    length: 6.3, width: 1.9, height: 2.15, wheelRadius: 0.37,
    axles: [{ at: 0.9 }, { at: 4.4, drive: true }],
    // the passengers board at the open rear: no side doors
    doors: [],
    livery: l,
    paint: bands(6.3, [0.45, 0.6, "chrome"], [0.95, 1.02, "stripe"], [1.02, 1.09, "stripe2"], [1.86, 2.15, "stripe"]),
    bonnet: { length: 1.6, top: [1.12, 1.2], half: 0.45, grille: [0.62, 1.08, 0.32], mat: "chrome", fender: "body" },
    lamps: [0.78, 0.94], rake: 0.03, floor: 0.45,
  });
  // the open windows under the overhanging roof, the open rear
  return { ...s, belt: 1.05, eave: 2.05, pane: { glass: [1.15, 1.85], inset: 0.04, glassMat: "glassDark" }, pitch: 0.7,
    screen: { y0: 1.28, y1: 1.85, half: 0.78 }, back: { window: [1.0, 1.85, 0.7], lamps: 0.6 } };
}

export const SONGTHAEW_PARAMS = colourParam(["red", "Red"], ["blue", "Blue"], ["yellow", "Yellow"]);

export function songthaewSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(SONGTHAEW_PARAMS, {
    red: { body: "#c8202e", bumper: "#c9ccd0", grey: "#3c3f44" },
    blue: { body: "#1d4f9c", bumper: "#c9ccd0", grey: "#3c3f44" },
    yellow: { body: "#f2c500", bumper: "#c9ccd0", grey: "#3c3f44" },
  }, p);
  const s = bonneted({
    length: 5.3, width: 1.8, height: 2.3, wheelRadius: 0.36,
    axles: [{ at: 0.85 }, { at: 3.9, drive: true }],
    doors: [],
    livery: l,
    paint: bands(5.3, [0.42, 0.55, "grey"]),
    bonnet: { length: 1.45, top: [0.98, 1.06], half: 0.75, grille: [0.62, 0.95, 0.5], fender: "body" },
    lamps: [0.78, 0.92], rake: 0.4, floor: 0.45,
  });
  // the pickup's cab and the covered bed with its benches, open above the waist
  return { ...s, belt: 1.0, eave: 2.2, pane: { glass: [1.1, 2.0], inset: 0.04, glassMat: "glassDark" }, pitch: 0.8,
    screen: { y0: 1.12, y1: 1.65, half: 0.72 }, back: { window: [1.05, 2.0, 0.72], lamps: 0.65 } };
}

export const JINGLE_PARAMS = colourParam(["red", "Red"], ["green", "Green"], ["blue", "Blue"]);

export function jingleSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(JINGLE_PARAMS, {
    red: { body: "#c8202e", a: "#f7b500", b: "#1d8f5a", c: "#f4f4f2", d: "#1d4f9c", bumper: "#c9ccd0", crown: "#f7b500" },
    green: { body: "#1d8f5a", a: "#f7b500", b: "#c8202e", c: "#f4f4f2", d: "#1d4f9c", bumper: "#c9ccd0", crown: "#c8202e" },
    blue: { body: "#1d4f9c", a: "#f7b500", b: "#c8202e", c: "#f4f4f2", d: "#1d8f5a", bumper: "#c9ccd0", crown: "#f7b500" },
  }, p);
  const s = bonneted({
    length: 9.5, width: 2.45, height: 3.2,
    axles: [{ at: 1.3 }, { at: 6.3, drive: true }],
    doors: [[2.15, 2.95], [7.3, 8.1]],
    // the painted panels: bands of colour from the skirt to the roof
    livery: l,
    paint: bands(9.5, [0.35, 0.65, "a"], [0.65, 0.95, "d"], [1.15, 1.3, "c"], [2.85, 3.2, "b"]),
    bonnet: { length: 2.05, top: [1.5, 1.6], half: 0.6, grille: [0.8, 1.45, 0.34], mat: "crown", fender: "body" },
    lamps: [1.15, 1.35], rake: 0.05,
    // the decorated crown over the windscreen and the roof rack
    roof: [[2.05, 2.7, 1.2, 3.75, "crown"]],
  });
  return { ...s, pitch: 0.75 };
}

export const MATATU_PARAMS = colourParam(["black", "Black"], ["red", "Red"], ["green", "Green"]);

export function matatuSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(MATATU_PARAMS, {
    black: { body: "#1b1d20", a: "#f7b500", b: "#d3252b", c: "#2fa84f", bumper: "#c9ccd0" },
    red: { body: "#c8202e", a: "#f7b500", b: "#1b1d20", c: "#f4f4f2", bumper: "#c9ccd0" },
    green: { body: "#2f8b3e", a: "#f7b500", b: "#d3252b", c: "#1b1d20", bumper: "#c9ccd0" },
  }, p);
  return minibus({
    length: 5.38, width: 1.88, height: 2.29, wheelRadius: 0.33,
    axles: [{ at: 0.85 }, { at: 3.96, drive: true }],
    doors: [[1.36, 2.18]],
    // the graffiti livery as bands of colour
    livery: l,
    paint: [[-1, 6.4, 0.5, 0.62, "a"], [-1, 6.4, 0.62, 0.78, "b"], [-1, 6.4, 0.78, 0.95, "c"]],
    from: 1.0, rake: 0.65, window: 1.12,
  });
}

export function danfoSpec(): WorldBusSpec {
  return minibus({
    length: 4.57, width: 1.84, height: 1.95, wheelRadius: 0.33,
    axles: [{ at: 0.85 }, { at: 3.31, drive: true }],
    doors: [[1.15, 2.0]],
    // Lagos yellow with its two black stripes
    livery: { body: "#f2c500", black: "#15181c", bumper: "#15181c" },
    paint: [[-1, 5.6, 0.62, 0.7, "black"], [-1, 5.6, 0.95, 1.03, "black"]],
    from: 1.0, rake: 0.25, floor: 0.3, window: 1.1,
  });
}

export const SPRINTER_PARAMS = colourParam(["white", "White"], ["yellow", "Yellow"]);

export function sprinterSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(SPRINTER_PARAMS, {
    white: { body: "#f4f4f2", bumper: "#2a2c30", grey: "#5c6166" },
    yellow: { body: "#f6c900", bumper: "#2a2c30", grey: "#5c6166" },
  }, p);
  const s = minibus({
    length: 7.0, width: 1.99, height: 2.77, wheelRadius: 0.36,
    axles: [{ at: 0.95 }, { at: 5.28, drive: true }],
    doors: [[1.55, 2.6]],
    livery: l,
    paint: [[-1, 8, 0.3, 0.5, "grey"]],
    // the van's bonnet running up into the raked windscreen
    from: 1.0, rake: 1.25, floor: 0.38, window: 1.2,
  });
  return { ...s, screen: { y0: 1.15, y1: 2.0, half: 0.86 }, grille: [0.62, 0.95, 0.4] };
}

export function tatra500Spec(): WorldBusSpec {
  const s = coachLike({
    length: 10.0, width: 2.5, height: 2.9,
    axles: [{ at: 2.1 }, { at: 7.0, drive: true }],
    doors: [[0.7, 1.45], [7.6, 8.5]],
    // red and cream, the streamlined rear-engined body
    livery: { body: "#efe6c8", skirt: "#b3202a", band: "#15181c" },
    paint: [[-1, 11, 0.35, 1.3, "skirt"]],
    rake: 0.6,
  });
  return {
    ...s, kind: "city", belt: 1.35, pane: { glass: [1.45, s.eave - 0.1], surround: [1.41, s.eave - 0.06], inset: 0.05 },
    front: { from: 1.1, rake: 0.6, chamfer: [0.6, 0.4] }, rear: { from: 1.4, rake: 0.8, chamfer: [0.5, 0.35] },
    screen: { ...s.screen, y0: 1.4 }, grille: undefined, back: { lamps: 0.62, grille: [0.8, 1.3] },
    detail: true, extras: refined.tatra500,
  };
}

export const KENT_PARAMS = liveryParam(["iett", "İETT"], ["eshot", "ESHOT"]);

export function kentSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(KENT_PARAMS, {
    iett: { body: "#f4f4f1", skirt: "#d3252b", band: "#15181c", pod: "#f4f4f1" },
    eshot: { body: "#f4f4f1", skirt: "#1d6fb8", band: "#15181c", pod: "#f4f4f1" },
  }, p);
  return lowFloor({
    length: 12.0, height: 3.15,
    axles: [{ at: 2.75 }, { at: 8.65, drive: true }],
    doors: [[0.3, 1.6], [5.1, 6.4], [9.8, 11.1]],
    livery: l, rake: 0.25,
    roof: [[2.6, 5.2, 0.85, 3.4, "pod"]],
  });
}

export const COLECTIVO_PARAMS = colourParam(["red", "Red"], ["blue", "Blue"], ["green", "Green"]);

export function colectivoSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(COLECTIVO_PARAMS, {
    red: { body: "#c8202e", rub: "#c9ccd0", cream: "#efe6c8", stripe: "#f7b500" },
    blue: { body: "#1d4f9c", rub: "#c9ccd0", cream: "#efe6c8", stripe: "#f7b500" },
    green: { body: "#2f8b3e", rub: "#c9ccd0", cream: "#efe6c8", stripe: "#c8202e" },
  }, p);
  const s = highFloor({
    length: 10.5, height: 3.0,
    axles: [{ at: 2.2 }, { at: 7.4, drive: true }],
    doors: [[0.25, 1.15], [5.0, 5.9]],
    // the painted body: cream round the windows, a fileteado stripe at the waist
    livery: l,
    paint: bands(10.5, [0.78, 0.86, "rub"], [1.25, 1.4, "stripe"], [1.4, 2.9, "cream"]),
    rake: 0.1,
  });
  return { ...s, grille: [0.6, 1.1, 0.5], back: { ...s.back, grille: undefined } };
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names (jsModel.ts)

export function aecRoutemaster(p?: ParamValues): MeshBuilder { return worldBus(routemasterSpec(p)); }
export function aecRoutemasterLod(p?: ParamValues): MeshBuilder { return worldBusLod(routemasterSpec(p)); }
export function mbO3500(): MeshBuilder { return worldBus(o3500Spec()); }
export function mbO3500Lod(): MeshBuilder { return worldBusLod(o3500Spec()); }
export function magirusSaturn(): MeshBuilder { return worldBus(saturnSpec()); }
export function magirusSaturnLod(): MeshBuilder { return worldBusLod(saturnSpec()); }
export function vwSamba(p?: ParamValues): MeshBuilder { return worldBus(sambaSpec(p)); }
export function vwSambaLod(p?: ParamValues): MeshBuilder { return worldBusLod(sambaSpec(p)); }
export function chaussonAph(): MeshBuilder { return worldBus(aphSpec()); }
export function chaussonAphLod(): MeshBuilder { return worldBusLod(aphSpec()); }
export function jelcz043(): MeshBuilder { return worldBus(jelcz043Spec()); }
export function jelcz043Lod(): MeshBuilder { return worldBusLod(jelcz043Spec()); }
export function skoda706Rto(p?: ParamValues): MeshBuilder { return worldBus(rtoSpec(p)); }
export function skoda706RtoLod(p?: ParamValues): MeshBuilder { return worldBusLod(rtoSpec(p)); }
export function paz672(): MeshBuilder { return worldBus(paz672Spec()); }
export function paz672Lod(): MeshBuilder { return worldBusLod(paz672Spec()); }
export function saurerPostbus(): MeshBuilder { return worldBus(saurerSpec()); }
export function saurerPostbusLod(): MeshBuilder { return worldBusLod(saurerSpec()); }
export function gmNewLook(p?: ParamValues): MeshBuilder { return worldBus(newLookSpec(p)); }
export function gmNewLookLod(p?: ParamValues): MeshBuilder { return worldBusLod(newLookSpec(p)); }
export function gmScenicruiser(): MeshBuilder { return worldBus(scenicruiserSpec()); }
export function gmScenicruiserLod(): MeshBuilder { return worldBusLod(scenicruiserSpec()); }
export function flxibleClipper(): MeshBuilder { return worldBus(clipperSpec()); }
export function flxibleClipperLod(): MeshBuilder { return worldBusLod(clipperSpec()); }
export function blueBirdVision(): MeshBuilder { return worldBus(visionSpec()); }
export function blueBirdVisionLod(): MeshBuilder { return worldBusLod(visionSpec()); }
export function thomasSafTLiner(): MeshBuilder { return worldBus(safTLinerSpec()); }
export function thomasSafTLinerLod(): MeshBuilder { return worldBusLod(safTLinerSpec()); }
export function chickenBus(p?: ParamValues): MeshBuilder { return worldBus(camionetaSpec(p)); }
export function chickenBusLod(p?: ParamValues): MeshBuilder { return worldBusLod(camionetaSpec(p)); }
export function toyotaCoaster(p?: ParamValues): MeshBuilder { return worldBus(coasterSpec(p)); }
export function toyotaCoasterLod(p?: ParamValues): MeshBuilder { return worldBusLod(coasterSpec(p)); }
export function jeepney(p?: ParamValues): MeshBuilder { return worldBus(jeepneySpec(p)); }
export function jeepneyLod(p?: ParamValues): MeshBuilder { return worldBusLod(jeepneySpec(p)); }
export function songthaew(p?: ParamValues): MeshBuilder { return worldBus(songthaewSpec(p)); }
export function songthaewLod(p?: ParamValues): MeshBuilder { return worldBusLod(songthaewSpec(p)); }
export function jingleBus(p?: ParamValues): MeshBuilder { return worldBus(jingleSpec(p)); }
export function jingleBusLod(p?: ParamValues): MeshBuilder { return worldBusLod(jingleSpec(p)); }
export function matatu(p?: ParamValues): MeshBuilder { return worldBus(matatuSpec(p)); }
export function matatuLod(p?: ParamValues): MeshBuilder { return worldBusLod(matatuSpec(p)); }
export function danfo(): MeshBuilder { return worldBus(danfoSpec()); }
export function danfoLod(): MeshBuilder { return worldBusLod(danfoSpec()); }
export function mbSprinterMinibus(p?: ParamValues): MeshBuilder { return worldBus(sprinterSpec(p)); }
export function mbSprinterMinibusLod(p?: ParamValues): MeshBuilder { return worldBusLod(sprinterSpec(p)); }
export function tatra500hb(): MeshBuilder { return worldBus(tatra500Spec()); }
export function tatra500hbLod(): MeshBuilder { return worldBusLod(tatra500Spec()); }
export function otokarKent(p?: ParamValues): MeshBuilder { return worldBus(kentSpec(p)); }
export function otokarKentLod(p?: ParamValues): MeshBuilder { return worldBusLod(kentSpec(p)); }
export function buenosAiresColectivo(p?: ParamValues): MeshBuilder { return worldBus(colectivoSpec(p)); }
export function buenosAiresColectivoLod(p?: ParamValues): MeshBuilder { return worldBusLod(colectivoSpec(p)); }

// ---------------------------------------------------------------------------
// the designs

const COLOUR = ["colour"] as const;
const LIVERY = ["livery"] as const;

/** The batch, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md). */
export const WORLD_BUS_SPECS_3: readonly WorldBus[] = [
  { id: "veh-aec-routemaster", title: "AEC Routemaster", spec: routemasterSpec, build: aecRoutemaster, buildLod: aecRoutemasterLod, params: ROUTEMASTER_PARAMS, finishParams: LIVERY, game: g(7.4, 86, 64), references: "aec-routemaster" },
  { id: "veh-mb-o3500", title: "Mercedes-Benz O 3500", spec: o3500Spec, build: mbO3500, buildLod: mbO3500Lod, game: g(6.5, 66, 75), references: "mb-o3500" },
  { id: "veh-magirus-saturn", title: "Magirus-Deutz Saturn II", spec: saturnSpec, build: magirusSaturn, buildLod: magirusSaturnLod, game: g(7.5, 92, 80), references: "magirus-saturn" },
  { id: "veh-vw-t1-samba", title: "Volkswagen Type 2 Samba", spec: sambaSpec, build: vwSamba, buildLod: vwSambaLod, params: SAMBA_PARAMS, finishParams: COLOUR, game: g(1.1, 22, 105), references: "vw-t1-samba" },
  { id: "veh-chausson-aph", title: "Chausson APH", spec: aphSpec, build: chaussonAph, buildLod: chaussonAphLod, game: g(7.0, 77, 70), references: "chausson-aph" },
  { id: "veh-jelcz-043", title: "Jelcz 043", spec: jelcz043Spec, build: jelcz043, buildLod: jelcz043Lod, game: g(8.0, 118, 80), references: "jelcz-043" },
  { id: "veh-skoda-706-rto", title: "Skoda 706 RTO", spec: rtoSpec, build: skoda706Rto, buildLod: skoda706RtoLod, params: RTO_PARAMS, finishParams: LIVERY, game: g(8.1, 118, 80), references: "skoda-706-rto" },
  { id: "veh-paz-672", title: "PAZ-672", spec: paz672Spec, build: paz672, buildLod: paz672Lod, game: g(5.0, 85, 80), references: "paz-672" },
  { id: "veh-saurer-postbus", title: "Saurer L4C Postbus", spec: saurerSpec, build: saurerPostbus, buildLod: saurerPostbusLod, game: g(8.0, 103, 75), references: "saurer-postbus" },
  { id: "veh-gm-new-look", title: "GM New Look", spec: newLookSpec, build: gmNewLook, buildLod: gmNewLookLod, params: NEW_LOOK_PARAMS, finishParams: LIVERY, game: g(10.4, 175, 90), references: "gm-new-look" },
  { id: "veh-gm-scenicruiser", title: "GM Scenicruiser", spec: scenicruiserSpec, build: gmScenicruiser, buildLod: gmScenicruiserLod, game: g(13.0, 223, 110), references: "gm-scenicruiser" },
  { id: "veh-flxible-clipper", title: "Flxible Clipper", spec: clipperSpec, build: flxibleClipper, buildLod: flxibleClipperLod, game: g(9.0, 112, 100), references: "flxible-clipper" },
  { id: "veh-blue-bird-vision", title: "Blue Bird Vision", spec: visionSpec, build: blueBirdVision, buildLod: blueBirdVisionLod, game: g(11.0, 160, 100), references: "blue-bird-vision" },
  { id: "veh-thomas-saf-t-liner", title: "Thomas Saf-T-Liner C2", spec: safTLinerSpec, build: thomasSafTLiner, buildLod: thomasSafTLinerLod, game: g(11.0, 164, 100), references: "thomas-saf-t-liner" },
  { id: "veh-chicken-bus", title: "Guatemalan Camioneta", spec: camionetaSpec, build: chickenBus, buildLod: chickenBusLod, params: CAMIONETA_PARAMS, finishParams: COLOUR, game: g(10.0, 150, 90), references: "chicken-bus" },
  { id: "veh-toyota-coaster", title: "Toyota Coaster", spec: coasterSpec, build: toyotaCoaster, buildLod: toyotaCoasterLod, params: COASTER_PARAMS, finishParams: COLOUR, game: g(4.4, 110, 110), references: "toyota-coaster" },
  { id: "veh-jeepney", title: "Philippine Jeepney", spec: jeepneySpec, build: jeepney, buildLod: jeepneyLod, params: JEEPNEY_PARAMS, finishParams: COLOUR, game: g(2.5, 70, 80), references: "jeepney" },
  { id: "veh-songthaew", title: "Songthaew", spec: songthaewSpec, build: songthaew, buildLod: songthaewLod, params: SONGTHAEW_PARAMS, finishParams: COLOUR, game: g(1.9, 75, 110), references: "songthaew" },
  { id: "veh-jingle-bus", title: "Pakistani Jingle Bus", spec: jingleSpec, build: jingleBus, buildLod: jingleBusLod, params: JINGLE_PARAMS, finishParams: COLOUR, game: g(8.0, 100, 80), references: "jingle-bus" },
  { id: "veh-matatu", title: "Matatu", spec: matatuSpec, build: matatu, buildLod: matatuLod, params: MATATU_PARAMS, finishParams: COLOUR, game: g(2.2, 100, 140), references: "matatu" },
  { id: "veh-danfo", title: "Lagos Danfo", spec: danfoSpec, build: danfo, buildLod: danfoLod, game: g(1.4, 51, 110), references: "danfo" },
  { id: "veh-mb-sprinter-minibus", title: "Mercedes-Benz Sprinter Minibus", spec: sprinterSpec, build: mbSprinterMinibus, buildLod: mbSprinterMinibusLod, params: SPRINTER_PARAMS, finishParams: COLOUR, game: g(3.5, 120, 130), references: "mb-sprinter-minibus" },
  { id: "veh-tatra-500-hb", title: "Tatra 500 HB", spec: tatra500Spec, build: tatra500hb, buildLod: tatra500hbLod, game: g(7.8, 88, 80), references: "tatra-500-hb" },
  { id: "veh-otokar-kent", title: "Otokar Kent", spec: kentSpec, build: otokarKent, buildLod: otokarKentLod, params: KENT_PARAMS, finishParams: LIVERY, game: g(11.5, 213, 85), references: "otokar-kent" },
  { id: "veh-buenos-aires-colectivo", title: "Buenos Aires Colectivo", spec: colectivoSpec, build: buenosAiresColectivo, buildLod: buenosAiresColectivoLod, params: COLECTIVO_PARAMS, finishParams: COLOUR, game: g(9.0, 125, 80), references: "buenos-aires-colectivo" },
];

export const WORLD_BUSES_3: ProceduralDesign[] = WORLD_BUS_SPECS_3.map(worldBusDesign);
