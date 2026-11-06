// The buses from around the world, first batch (docs/models/world-buses.md): 25
// city buses, coaches, double-deckers, articulated buses and trolleybuses, each a
// WorldBusSpec on the world bus kit (worldBusKit.ts) at its real size, modelled on
// the photographs in assets/<references>/ and the published figures in each
// folder's SOURCES.md. The ids are stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { DoorStyle, PaneStyle } from "./busAssembly.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import * as refined from "./worldBusRefined.ts";
import { worldBus, worldBusLod, type Band, type BusKind, type WorldBusSpec } from "./worldBusKit.ts";
import { BUS_CATALOG } from "./buses.ts";

// ---------------------------------------------------------------------------
// the shapes the batch shares

export type Doors = ReadonlyArray<readonly [number, number]>;
export type Axles = WorldBusSpec["axles"];

export interface Base {
  length: number;
  width?: number;
  height: number;
  axles: Axles;
  doors: Doors;
  livery: Record<string, string>;
  paint?: readonly Band[];
  bodies?: ReadonlyArray<readonly [number, number]>;
  roof?: WorldBusSpec["roof"];
  trolley?: number;
  wheelRadius?: number;
  rake?: number;
  mirrors?: "ear" | "arm";
}

/** The window runs of each body, clear of its ends (a rigid bus has one, from the nose's corner to the tail's). */
export function runs(o: Base, from: number, toTail: number): Array<[number, number]> {
  const bodies = o.bodies ?? [[0, o.length]];
  return bodies.map(([a, b], i) => [i === 0 ? from : a + 0.2, i + 1 === bodies.length ? b - toTail : b - 0.2]);
}

/** A low-floor city bus: floor 0.27 m, deep bonded glazing, plug doors, a big windscreen under the display. */
export function lowFloor(o: Base): WorldBusSpec {
  const hw = (o.width ?? 2.55) / 2;
  const eave = o.height - 0.13;
  const door: DoorStyle = { bottom: 0.3, top: eave - 0.14, leafMat: "frame", panes: [[0.42, eave - 0.22]], leaves: 2 };
  const pane: PaneStyle = { glass: [1.06, eave - 0.12], inset: 0.02, glassMat: "glassDark" };
  return {
    kind: "city", length: o.length, width: o.width ?? 2.55, height: o.height, floor: 0.27, belt: 1.0, eave,
    front: { from: 1.0, rake: o.rake ?? 0.12 }, rear: { from: eave - 0.2, rake: 0.05 },
    axles: o.axles, wheelRadius: o.wheelRadius ?? 0.48, ...(o.bodies ? { bodies: o.bodies } : {}),
    livery: o.livery,
    paint: o.paint ?? [[-1, o.length + 1, 0.27, 0.62, "skirt"], [-1, o.length - 0.2, 1.02, eave - 0.06, "band"]],
    pane, windows: runs(o, 0.5, 0.5), pitch: 1.4, door, doors: o.doors,
    screen: { y0: 1.12, y1: eave - 0.34, half: hw - 0.12, sign: [eave - 0.32, eave - 0.08] },
    lamps: { kind: "corner", y0: 0.52, y1: 0.7 },
    grille: [0.8, 1.0, 0.5],
    back: { window: [1.9, eave - 0.3, hw - 0.27], lamps: 0.62, grille: [1.0, 1.7] },
    ...(o.roof ? { roof: o.roof } : {}),
    mirrors: o.mirrors ?? "ear",
    ...(o.trolley !== undefined ? { trolley: { at: o.trolley } } : {}),
  };
}

/** A high-floor city bus: floor 0.35 m, framed windows over a tall skirt, steps behind the doors. */
export function highFloor(o: Base): WorldBusSpec {
  const hw = (o.width ?? 2.5) / 2;
  const eave = o.height - 0.13;
  const door: DoorStyle = { bottom: 0.36, top: eave - 0.2, leafMat: "frame", panes: [[1.1, eave - 0.28], [0.45, 1.02]], leaves: 2 };
  const pane: PaneStyle = { glass: [1.55, eave - 0.18], surround: [1.5, eave - 0.13], inset: 0.05 };
  return {
    kind: "city", length: o.length, width: o.width ?? 2.5, height: o.height, floor: 0.35, belt: 1.45, eave,
    front: { from: 1.35, rake: o.rake ?? 0.1 }, rear: { from: eave - 0.25, rake: 0.06 },
    axles: o.axles, wheelRadius: o.wheelRadius ?? 0.5, ...(o.bodies ? { bodies: o.bodies } : {}),
    livery: o.livery,
    paint: o.paint ?? [[-1, o.length + 1, 0.78, 0.86, "rub"]],
    pane, windows: runs(o, 0.4, 0.4), pitch: 1.6, door, doors: o.doors,
    screen: { y0: 1.45, y1: eave - 0.08, half: hw - 0.1, sign: [eave - 0.36, eave - 0.12] },
    lamps: { kind: "round", y0: 0.72, y1: 0.9 },
    back: { window: [1.65, eave - 0.2, hw - 0.25], lamps: 0.66, grille: [0.95, 1.4] },
    ...(o.roof ? { roof: o.roof } : {}),
    mirrors: o.mirrors ?? "arm",
    ...(o.trolley !== undefined ? { trolley: { at: o.trolley } } : {}),
  };
}

/** A coach: floor 0.35 m, the passengers high over the luggage bays, a deep raked windscreen, a front door (and a middle one). */
export function coach(o: Base): WorldBusSpec {
  const hw = (o.width ?? 2.55) / 2;
  const eave = o.height - 0.12;
  const door: DoorStyle = { bottom: 0.38, top: eave - 0.16, leafMat: "frame", panes: [[0.5, eave - 0.24]], leafWidth: 0.6 };
  const pane: PaneStyle = { glass: [1.85, eave - 0.1], inset: 0.02, glassMat: "glassDark" };
  return {
    kind: "coach", length: o.length, width: o.width ?? 2.55, height: o.height, floor: 0.35, belt: 1.7, eave,
    front: { from: 1.2, rake: o.rake ?? 0.3 }, rear: { from: eave - 0.25, rake: 0.08 },
    axles: o.axles, wheelRadius: o.wheelRadius ?? 0.5,
    livery: o.livery,
    paint: o.paint ?? [[-1, o.length + 1, 0.35, 0.62, "skirt"], [-1, o.length - 0.3, 1.82, eave - 0.06, "band"]],
    pane, windows: runs(o, 0.3, 0.6), pitch: 2.0, door, doors: o.doors,
    screen: { y0: 1.25, y1: eave - 0.1, half: hw - 0.1, sign: [eave - 0.36, eave - 0.14] },
    lamps: { kind: "corner", y0: 0.6, y1: 0.8, w: 0.46 },
    grille: [0.66, 1.0, 0.5],
    back: { lamps: 0.7, grille: [1.1, 1.9] },
    ...(o.roof ? { roof: o.roof } : {}),
    mirrors: o.mirrors ?? "ear",
    maxSteerDeg: 45,
  };
}

/** A double-decker: the lower deck's glazing over a short skirt, the upper deck's under the roof, the stairs inside. */
export function doubleDeck(o: Base & { coach?: boolean }): WorldBusSpec {
  const hw = (o.width ?? 2.55) / 2;
  const eave = o.height - 0.14;
  const low = o.coach ? [1.1, 2.05] as const : [1.05, 2.12] as const;
  const up = [low[1] + 0.48, eave - 0.1] as const;
  const door: DoorStyle = { bottom: o.coach ? 0.38 : 0.32, top: low[1] + 0.05, leafMat: "frame", panes: [[0.45, low[1] - 0.03]], leaves: o.coach ? 1 : 2 };
  const pane: PaneStyle = { glass: [low[0], low[1]], inset: 0.02, glassMat: "glassDark" };
  return {
    kind: "double", length: o.length, width: o.width ?? 2.55, height: o.height, floor: o.coach ? 0.35 : 0.3, belt: 1.0, eave,
    front: { from: 1.0, rake: o.rake ?? 0.18 }, rear: { from: eave - 0.3, rake: 0.18 },
    axles: o.axles, wheelRadius: o.wheelRadius ?? 0.5,
    livery: o.livery,
    paint: o.paint ?? [[-1, o.length - 0.25, low[0] - 0.04, low[1] + 0.04, "band"], [-1, o.length - 0.25, up[0] - 0.04, up[1] + 0.04, "band"]],
    pane, windows: runs(o, 0.4, 0.45), pitch: o.coach ? 2.0 : 1.4,
    upper: { pane: { glass: [up[0], up[1]], inset: 0.02, glassMat: "glassDark" }, windows: [[0.4, o.length - 0.45]], pitch: o.coach ? 2.0 : 1.5 },
    door, doors: o.doors,
    screen: { y0: low[0], y1: low[1], half: hw - 0.12, sign: [low[1] + 0.06, up[0] - 0.06], upper: [up[0], up[1]] },
    lamps: { kind: "corner", y0: 0.55, y1: 0.72 },
    back: { window: [up[0], up[1], hw - 0.35], lamps: 0.62, grille: [0.95, 1.6] },
    ...(o.roof ? { roof: o.roof } : {}),
    mirrors: o.mirrors ?? "arm",
    ...(o.coach ? { maxSteerDeg: 45 } : {}),
  };
}

/** An articulated bus's two bodies over `length`, the joint's gap centred at `at` metres from the nose. */
export const twoBodies = (length: number, at: number): Array<[number, number]> => [[0, at - 0.4], [at + 0.4, length]];

// ---------------------------------------------------------------------------
// the designs' specs

const LONDON_RED = "#c8102e";

export function newRoutemasterSpec(): WorldBusSpec {
  return { ...doubleDeck({
    length: 11.23, width: 2.52, height: 4.39,
    axles: [{ at: 2.6 }, { at: 8.5, drive: true }],
    doors: [[0.3, 1.45], [4.5, 5.75], [9.5, 10.75]],
    livery: { body: LONDON_RED, band: "#15181c" },
    rake: 0.3,
  }), detail: true, extras: refined.newRoutemaster };
}

export const ENVIRO400_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "londonRed",
  values: [{ value: "londonRed", title: "London red" }, { value: "stagecoach", title: "Stagecoach" }],
}];

export function enviro400Spec(params?: ParamValues): WorldBusSpec {
  const p = resolveParams(ENVIRO400_PARAMS, params);
  const stage = p.livery === "stagecoach";
  return doubleDeck({
    length: 10.8, height: 4.3,
    axles: [{ at: 2.5 }, { at: 7.85, drive: true }],
    doors: [[0.3, 1.45], [4.2, 5.4]],
    livery: stage ? { body: "#f4f4f1", band: "#15181c", blue: "#1d4f9c", orange: "#f08a1c", red: "#d22630" } : { body: LONDON_RED, band: "#15181c" },
    ...(stage ? { paint: [
      [-1, 10.55, 1.01, 2.16, "band"], [-1, 10.55, 2.56, 4.2, "band"],
      [7.6, 11.8, 0.3, 0.7, "blue"], [8.6, 11.8, 0.7, 0.85, "orange"], [9.4, 11.8, 0.85, 0.98, "red"],
    ] as const } : {}),
  });
}

export const ENVIRO500_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "kmb",
  values: [{ value: "kmb", title: "KMB Hong Kong" }, { value: "mta", title: "MTA New York" }],
}];

export function enviro500Spec(params?: ParamValues): WorldBusSpec {
  const p = resolveParams(ENVIRO500_PARAMS, params);
  const mta = p.livery === "mta";
  return doubleDeck({
    length: 12.0, height: 4.4,
    axles: [{ at: 2.65 }, { at: 8.4, drive: true }, { at: 9.75, dual: false }],
    doors: [[0.3, 1.45], [4.6, 5.8]],
    livery: mta ? { body: "#f2f3f2", band: "#15181c", stripe: "#1f4fa3" } : { body: "#c8b892", band: "#15181c", stripe: "#5a5650" },
    paint: [[-1, 12.75, 0.3, 0.62, "stripe"], [-1, 11.75, 1.01, 2.16, "band"], [-1, 11.75, 2.56, 4.3, "band"]],
  });
}

export function enviro200Spec(): WorldBusSpec {
  return lowFloor({
    length: 10.8, width: 2.44, height: 2.95,
    axles: [{ at: 2.45 }, { at: 7.75, drive: true }],
    doors: [[0.25, 1.5], [4.6, 5.85]],
    // the demonstrator's red (the photographs)
    livery: { body: "#c8102e", skirt: "#b9bcc0", band: "#15181c", pod: "#c8102e" },
    roof: [[2.5, 4.6, 0.75, 3.15, "pod"]],
  });
}

export function leylandNationalSpec(): WorldBusSpec {
  return highFloor({
    length: 11.3, height: 3.05,
    axles: [{ at: 2.35 }, { at: 8.0, drive: true }],
    doors: [[0.3, 1.45], [4.6, 5.75]],
    livery: { body: "#c8312a", rub: "#f2f1ea", white: "#f2f1ea" },
    paint: [[-1, 12.3, 1.3, 1.42, "white"], [-1, 12.3, 0.78, 0.86, "rub"]],
    // the roof pod at the rear, the National's trademark (its heating unit)
    roof: [[9.2, 11.1, 0.95, 3.45, "body"]],
  });
}

export function o305Spec(): WorldBusSpec {
  return highFloor({
    length: 11.0, height: 2.94,
    axles: [{ at: 2.6 }, { at: 8.2, drive: true }],
    doors: [[0.3, 1.5], [4.4, 5.6], [9.05, 10.25]],
    // ivory with a red skirt and roof edge (the photographs)
    livery: { body: "#efe6c8", rub: "#4a4a48", red: "#8f1d22" },
    paint: [[-1, 12, 0.35, 0.86, "red"], [-1, 12, 2.68, 2.94, "red"]],
  });
}

export const O405_PARAMS: readonly ParamSpec[] = [{
  name: "length", title: "Length", default: "solo",
  values: [{ value: "solo", title: "Solo" }, { value: "articulated", title: "O 405 G" }],
}];

export function o405Spec(params?: ParamValues): WorldBusSpec {
  const g = resolveParams(O405_PARAMS, params).length === "articulated";
  return highFloor({
    length: g ? 17.9 : 11.7, height: 2.96,
    axles: g ? [{ at: 2.65 }, { at: 8.45 }, { at: 14.6, drive: true }] : [{ at: 2.65 }, { at: 8.5, drive: true }],
    doors: g ? [[0.3, 1.5], [4.6, 5.8], [11.2, 12.4], [15.6, 16.8]] : [[0.3, 1.5], [4.6, 5.8], [9.6, 10.8]],
    ...(g ? { bodies: twoBodies(17.9, 10.2) } : {}),
    livery: { body: "#f4f4f1", rub: "#3c3c3c", skirt: "#c8202c" },
    paint: [[-1, 19, 0.35, 0.7, "skirt"], [-1, 19, 0.78, 0.86, "rub"]],
    roof: [[2.6, 4.0, 0.6, 3.14, "pod"]],
  });
}

export function eCitaroSpec(): WorldBusSpec {
  return lowFloor({
    length: 12.135, height: 2.95,
    axles: [{ at: 2.85 }, { at: 8.725, drive: true }],
    doors: [[0.6, 1.95], [5.9, 7.25], [9.9, 11.25]],
    // BVG Berlin's yellow (the photographs)
    livery: { body: "#f6cf00", skirt: "#f6cf00", band: "#15181c", pod: "#e9eaea" },
    // the battery modules over most of the roof
    roof: [[2.8, 10.6, 1.0, 3.4, "pod"]],
  });
}

export const LIONS_CITY_PARAMS: readonly ParamSpec[] = [{
  name: "length", title: "Length", default: "12",
  values: [{ value: "12", title: "12 m" }, { value: "18", title: "18 m" }],
}];

export function lionsCitySpec(params?: ParamValues): WorldBusSpec {
  const g = resolveParams(LIONS_CITY_PARAMS, params).length === "18";
  return lowFloor({
    length: g ? 18.1 : 12.2, height: 3.0,
    axles: g ? [{ at: 2.7 }, { at: 8.4 }, { at: 14.5, drive: true }] : [{ at: 2.7 }, { at: 8.5, drive: true }],
    doors: g ? [[0.3, 1.6], [5.0, 6.3], [11.0, 12.3], [15.6, 16.9]] : [[0.3, 1.6], [5.0, 6.3], [9.6, 10.9]],
    ...(g ? { bodies: twoBodies(18.1, 9.8) } : {}),
    // Baden-Baden's lime (the photographs)
    livery: { body: "#7ac142", skirt: "#3a3e43", band: "#15181c", pod: "#e9ebec" },
    roof: [[2.6, 5.0, 0.85, 3.25, "pod"]],
  });
}

export function tourismoSpec(): WorldBusSpec {
  return coach({
    length: 12.14, height: 3.68,
    axles: [{ at: 2.75 }, { at: 8.75, drive: true }],
    doors: [[0.55, 1.5], [5.4, 6.3]],
    livery: { body: "#f4f4f2", skirt: "#5c6166", band: "#15181c" },
  });
}

export function setraS515Spec(): WorldBusSpec {
  return coach({
    length: 12.2, height: 3.73,
    axles: [{ at: 2.65 }, { at: 8.85, drive: true }],
    doors: [[0.55, 1.5], [5.9, 6.8]],
    livery: { body: "#e8eaeb", skirt: "#3e4a5a", band: "#15181c" },
    rake: 0.4,
  });
}

export function skylinerSpec(): WorldBusSpec {
  return { ...doubleDeck({
    coach: true, length: 13.8, height: 4.0,
    axles: [{ at: 2.8 }, { at: 9.3, drive: true }, { at: 10.65, dual: false }],
    doors: [[0.2, 1.2], [6.3, 7.2]],
    livery: { body: "#f2f2f0", band: "#15181c", skirt: "#5c6166" },
    paint: [[-1, 14.8, 0.35, 0.62, "skirt"], [-1, 13.5, 1.06, 2.09, "band"], [-1, 13.5, 2.49, 3.8, "band"]],
    rake: 0.35,
  }), detail: true, extras: refined.skyliner };
}

export function volvo7900eSpec(): WorldBusSpec {
  return lowFloor({
    length: 12.0, height: 2.95,
    axles: [{ at: 2.7 }, { at: 8.6, drive: true }],
    doors: [[0.3, 1.6], [5.2, 6.5], [9.6, 10.9]],
    // blue, as the photographed Slough bus
    livery: { body: "#2457c5", skirt: "#1b3f91", band: "#15181c", pod: "#2457c5" },
    roof: [[2.6, 9.6, 1.0, 3.3, "pod"]],
  });
}

export function citywideSpec(): WorldBusSpec {
  return lowFloor({
    length: 12.0, height: 3.0,
    axles: [{ at: 2.7 }, { at: 8.65, drive: true }],
    doors: [[0.3, 1.6], [5.2, 6.5], [10.0, 11.3]],
    livery: { body: "#d52b1e", skirt: "#a51f16", band: "#15181c" },
    roof: [[2.6, 4.8, 0.85, 3.25, "pod"]],
  });
}

export function exquiCitySpec(): WorldBusSpec {
  return { ...lowFloor({
    length: 18.6, height: 3.05,
    axles: [{ at: 3.3 }, { at: 9.0 }, { at: 15.3, drive: true }],
    doors: [[0.9, 2.2], [4.8, 6.1], [11.4, 12.7], [16.2, 17.5]],
    bodies: twoBodies(18.6, 10.4),
    // Metz Mettis grey and lime (the photographs)
    livery: { body: "#c9cdd1", skirt: "#8cc63f", band: "#15181c", pod: "#8cc63f" },
    roof: [[3.0, 8.5, 1.0, 3.4, "pod"], [12.0, 17.0, 1.0, 3.4, "pod"]],
    rake: 0.55,
  }), detail: true, extras: refined.exquiCity };
}

export const IKARUS_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "yellow",
  values: [{ value: "yellow", title: "Yellow" }, { value: "bkv", title: "BKV blue" }],
}];

const ikarusLivery = (params?: ParamValues): Record<string, string> =>
  resolveParams(IKARUS_PARAMS, params).livery === "bkv" ? { body: "#1f5aa6", rub: "#f2f1ea", white: "#f2f1ea" } : { body: "#f2a900", rub: "#3c3c3c", white: "#f2efe4" };

export function ikarus260Spec(params?: ParamValues): WorldBusSpec {
  return highFloor({
    length: 11.0, height: 3.0,
    axles: [{ at: 2.4 }, { at: 7.8, drive: true }],
    doors: [[0.3, 1.5], [4.3, 5.5], [8.8, 10.0]],
    livery: ikarusLivery(params),
    paint: [[-1, 12, 0.78, 0.86, "rub"], [-1, 12, 2.6, 2.87, "white"]],
  });
}

export function ikarus280Spec(params?: ParamValues): WorldBusSpec {
  return { ...highFloor({
    length: 16.5, height: 3.16,
    axles: [{ at: 2.4 }, { at: 7.8 }, { at: 13.6, drive: true }],
    doors: [[0.3, 1.5], [4.3, 5.5], [10.5, 11.7], [14.6, 15.8]],
    bodies: twoBodies(16.5, 9.75),
    livery: ikarusLivery(params),
    paint: [[-1, 17.5, 0.78, 0.86, "rub"], [-1, 17.5, 2.75, 3.03, "white"]],
  }), detail: true, extras: refined.ikarus280 };
}

const SKODA_TR = { body: "#efe3c0", rub: "#3c3c3c", red: "#c42a26" };

export function skoda14trSpec(): WorldBusSpec {
  return highFloor({
    length: 11.34, height: 3.05,
    axles: [{ at: 2.6 }, { at: 8.0, drive: true }],
    doors: [[0.3, 1.5], [4.4, 5.6], [9.0, 10.2]],
    livery: SKODA_TR,
    paint: [[-1, 12.4, 0.35, 0.86, "red"], [-1, 12.4, 2.72, 2.92, "red"]],
    trolley: 3.8,
  });
}

export function skoda15trSpec(): WorldBusSpec {
  return { ...highFloor({
    length: 17.4, height: 3.05,
    axles: [{ at: 2.6 }, { at: 8.1 }, { at: 14.2, drive: true }],
    doors: [[0.3, 1.5], [4.4, 5.6], [10.8, 12.0], [15.2, 16.4]],
    bodies: twoBodies(17.4, 9.8),
    livery: SKODA_TR,
    paint: [[-1, 18.4, 0.35, 0.86, "red"], [-1, 18.4, 2.72, 2.92, "red"]],
    trolley: 3.8,
  }), detail: true, extras: refined.skoda15tr };
}

export function trollinoSpec(): WorldBusSpec {
  return lowFloor({
    length: 18.0, height: 3.0,
    axles: [{ at: 2.7 }, { at: 8.5 }, { at: 14.6, drive: true }],
    doors: [[0.3, 1.6], [4.6, 5.9], [11.0, 12.3], [15.6, 16.9]],
    bodies: twoBodies(18.0, 10.0),
    livery: { body: "#f4f5f4", skirt: "#1d5fae", band: "#15181c" },
    roof: [[5.6, 8.8, 0.9, 3.3, "pod"]],
    trolley: 3.6,
  });
}

export const XCELSIOR_PARAMS: readonly ParamSpec[] = [{
  name: "length", title: "Length", default: "40",
  values: [{ value: "40", title: "40 ft" }, { value: "60", title: "60 ft" }],
}];

export function xcelsiorSpec(params?: ParamValues): WorldBusSpec {
  const g = resolveParams(XCELSIOR_PARAMS, params).length === "60";
  return lowFloor({
    length: g ? 18.3 : 12.5, width: 2.59, height: 3.05,
    axles: g ? [{ at: 2.2 }, { at: 9.3 }, { at: 15.6, drive: true }] : [{ at: 2.2 }, { at: 9.36, drive: true }],
    doors: g ? [[0.25, 1.35], [5.6, 6.9], [12.0, 13.3]] : [[0.25, 1.35], [6.0, 7.3]],
    ...(g ? { bodies: twoBodies(18.3, 10.7) } : {}),
    livery: { body: "#f4f5f4", skirt: "#1a4b8c", band: "#15181c" },
    roof: [[2.0, 6.0, 0.95, 3.4, "pod"]],
    mirrors: "arm",
  });
}

export function gilligSpec(): WorldBusSpec {
  return lowFloor({
    length: 12.2, width: 2.59, height: 3.1,
    axles: [{ at: 2.1 }, { at: 9.25, drive: true }],
    doors: [[0.25, 1.3], [6.0, 7.0]],
    // white with a green stripe (the photographed DDOT bus)
    livery: { body: "#f4f5f4", skirt: "#2e8b3e", band: "#15181c" },
    roof: [[9.6, 11.8, 0.95, 3.4, "pod"]],
    mirrors: "arm",
  });
}

export function mciD4505Spec(): WorldBusSpec {
  return coach({
    length: 13.7, width: 2.59, height: 3.5,
    axles: [{ at: 2.35 }, { at: 9.6, drive: true }, { at: 10.95, dual: false }],
    doors: [[0.55, 1.45]],
    livery: { body: "#e9ecef", skirt: "#1a4b8c", band: "#15181c" },
    mirrors: "arm",
  });
}

export function bydK9Spec(): WorldBusSpec {
  return lowFloor({
    length: 12.0, height: 3.05,
    axles: [{ at: 2.65 }, { at: 8.65, drive: true }],
    doors: [[0.3, 1.6], [5.1, 6.4]],
    // SBS Transit's lime (the photographs)
    livery: { body: "#9ad31f", skirt: "#9ad31f", band: "#15181c", pod: "#9ad31f" },
    roof: [[2.6, 5.4, 0.85, 3.36, "pod"]],
  });
}

export function universeSpec(): WorldBusSpec {
  return coach({
    length: 12.0, width: 2.49, height: 3.5,
    axles: [{ at: 2.55 }, { at: 8.65, drive: true }],
    doors: [[0.55, 1.5]],
    // red over white (the photographed Gimpo bus)
    livery: { body: "#f4f4f2", skirt: "#5c6166", band: "#15181c", red: "#d8262d" },
    paint: [[-1, 13, 0.35, 0.62, "skirt"], [-1, 11.7, 1.82, 3.32, "band"], [-1, 13, 3.32, 3.6, "red"]],
  });
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names: the JS model imports a
// design's builders by name from this module (jsModel.ts)

export function newRoutemaster(): MeshBuilder { return worldBus(newRoutemasterSpec()); }
export function newRoutemasterLod(): MeshBuilder { return worldBusLod(newRoutemasterSpec()); }
export function enviro400(p?: ParamValues): MeshBuilder { return worldBus(enviro400Spec(p)); }
export function enviro400Lod(p?: ParamValues): MeshBuilder { return worldBusLod(enviro400Spec(p)); }
export function enviro500(p?: ParamValues): MeshBuilder { return worldBus(enviro500Spec(p)); }
export function enviro500Lod(p?: ParamValues): MeshBuilder { return worldBusLod(enviro500Spec(p)); }
export function enviro200(): MeshBuilder { return worldBus(enviro200Spec()); }
export function enviro200Lod(): MeshBuilder { return worldBusLod(enviro200Spec()); }
export function leylandNational(): MeshBuilder { return worldBus(leylandNationalSpec()); }
export function leylandNationalLod(): MeshBuilder { return worldBusLod(leylandNationalSpec()); }
export function mbO305(): MeshBuilder { return worldBus(o305Spec()); }
export function mbO305Lod(): MeshBuilder { return worldBusLod(o305Spec()); }
export function mbO405(p?: ParamValues): MeshBuilder { return worldBus(o405Spec(p)); }
export function mbO405Lod(p?: ParamValues): MeshBuilder { return worldBusLod(o405Spec(p)); }
export function mbECitaro(): MeshBuilder { return worldBus(eCitaroSpec()); }
export function mbECitaroLod(): MeshBuilder { return worldBusLod(eCitaroSpec()); }
export function manLionsCity(p?: ParamValues): MeshBuilder { return worldBus(lionsCitySpec(p)); }
export function manLionsCityLod(p?: ParamValues): MeshBuilder { return worldBusLod(lionsCitySpec(p)); }
export function mbTourismo(): MeshBuilder { return worldBus(tourismoSpec()); }
export function mbTourismoLod(): MeshBuilder { return worldBusLod(tourismoSpec()); }
export function setraS515(): MeshBuilder { return worldBus(setraS515Spec()); }
export function setraS515Lod(): MeshBuilder { return worldBusLod(setraS515Spec()); }
export function neoplanSkyliner(): MeshBuilder { return worldBus(skylinerSpec()); }
export function neoplanSkylinerLod(): MeshBuilder { return worldBusLod(skylinerSpec()); }
export function volvo7900e(): MeshBuilder { return worldBus(volvo7900eSpec()); }
export function volvo7900eLod(): MeshBuilder { return worldBusLod(volvo7900eSpec()); }
export function scaniaCitywide(): MeshBuilder { return worldBus(citywideSpec()); }
export function scaniaCitywideLod(): MeshBuilder { return worldBusLod(citywideSpec()); }
export function vanHoolExquiCity(): MeshBuilder { return worldBus(exquiCitySpec()); }
export function vanHoolExquiCityLod(): MeshBuilder { return worldBusLod(exquiCitySpec()); }
export function ikarus260(p?: ParamValues): MeshBuilder { return worldBus(ikarus260Spec(p)); }
export function ikarus260Lod(p?: ParamValues): MeshBuilder { return worldBusLod(ikarus260Spec(p)); }
export function ikarus280(p?: ParamValues): MeshBuilder { return worldBus(ikarus280Spec(p)); }
export function ikarus280Lod(p?: ParamValues): MeshBuilder { return worldBusLod(ikarus280Spec(p)); }
export function skoda14tr(): MeshBuilder { return worldBus(skoda14trSpec()); }
export function skoda14trLod(): MeshBuilder { return worldBusLod(skoda14trSpec()); }
export function skoda15tr(): MeshBuilder { return worldBus(skoda15trSpec()); }
export function skoda15trLod(): MeshBuilder { return worldBusLod(skoda15trSpec()); }
export function solarisTrollino(): MeshBuilder { return worldBus(trollinoSpec()); }
export function solarisTrollinoLod(): MeshBuilder { return worldBusLod(trollinoSpec()); }
export function newFlyerXcelsior(p?: ParamValues): MeshBuilder { return worldBus(xcelsiorSpec(p)); }
export function newFlyerXcelsiorLod(p?: ParamValues): MeshBuilder { return worldBusLod(xcelsiorSpec(p)); }
export function gilligLowFloor(): MeshBuilder { return worldBus(gilligSpec()); }
export function gilligLowFloorLod(): MeshBuilder { return worldBusLod(gilligSpec()); }
export function mciD4505(): MeshBuilder { return worldBus(mciD4505Spec()); }
export function mciD4505Lod(): MeshBuilder { return worldBusLod(mciD4505Spec()); }
export function bydK9(): MeshBuilder { return worldBus(bydK9Spec()); }
export function bydK9Lod(): MeshBuilder { return worldBusLod(bydK9Spec()); }
export function hyundaiUniverse(): MeshBuilder { return worldBus(universeSpec()); }
export function hyundaiUniverseLod(): MeshBuilder { return worldBusLod(universeSpec()); }

// ---------------------------------------------------------------------------
// the designs

type Builder = (p?: ParamValues) => MeshBuilder;

export interface WorldBus {
  id: string;
  title: string;
  spec: (p?: ParamValues) => WorldBusSpec;
  build: Builder;
  buildLod: Builder;
  params?: readonly ParamSpec[];
  finishParams?: readonly string[];
  game: GameProperties;
  references: string;
  /** The LOD budget, where a parameter makes the bus articulated: two sections' (lod.ts lodBudget). */
  lodTriangles?: 200 | 300;
}

export const g = (weight: number, power: number, maxspeed: number, variants?: GameProperties["variants"]): GameProperties =>
  ({ weight, power, maxspeed, accel: null, ...(variants ? { variants } : {}) });

/** The batch, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md). */
export const WORLD_BUS_SPECS: readonly WorldBus[] = [
  { id: "veh-new-routemaster", title: "New Routemaster", spec: newRoutemasterSpec, build: newRoutemaster, buildLod: newRoutemasterLod, game: g(12.6, 138, 80), references: "new-routemaster" },
  { id: "veh-adl-enviro200", title: "Alexander Dennis Enviro200", spec: enviro200Spec, build: enviro200, buildLod: enviro200Lod, game: g(9.0, 150, 80), references: "adl-enviro200" },
  { id: "veh-adl-enviro400", title: "Alexander Dennis Enviro400", spec: enviro400Spec, build: enviro400, buildLod: enviro400Lod, params: ENVIRO400_PARAMS, game: g(11.5, 172, 80), references: "adl-enviro400" },
  { id: "veh-adl-enviro500", title: "Alexander Dennis Enviro500", spec: enviro500Spec, build: enviro500, buildLod: enviro500Lod, params: ENVIRO500_PARAMS, finishParams: ["livery"], game: g(14.0, 240, 90), references: "adl-enviro500" },
  { id: "veh-leyland-national", title: "Leyland National", spec: leylandNationalSpec, build: leylandNational, buildLod: leylandNationalLod, game: g(10.0, 125, 90), references: "leyland-national" },
  { id: "veh-mb-o305", title: "Mercedes-Benz O 305", spec: o305Spec, build: mbO305, buildLod: mbO305Lod, game: g(10.0, 147, 70), references: "mb-o305" },
  { id: "veh-mb-o405", title: "Mercedes-Benz O 405", spec: o405Spec, build: mbO405, buildLod: mbO405Lod, params: O405_PARAMS, lodTriangles: 200, game: g(10.5, 184, 80, [{ params: { length: "articulated" }, weight: 15.5 }]), references: "mb-o405" },
  { id: "veh-mb-ecitaro", title: "Mercedes-Benz eCitaro", spec: eCitaroSpec, build: mbECitaro, buildLod: mbECitaroLod, game: g(13.4, 250, 80), references: "mb-ecitaro" },
  { id: "veh-man-lions-city", title: "MAN Lion's City", spec: lionsCitySpec, build: manLionsCity, buildLod: manLionsCityLod, params: LIONS_CITY_PARAMS, lodTriangles: 200, game: g(11.0, 206, 80, [{ params: { length: "18" }, weight: 16.0, power: 250 }]), references: "man-lions-city" },
  { id: "veh-mb-tourismo", title: "Mercedes-Benz Tourismo", spec: tourismoSpec, build: mbTourismo, buildLod: mbTourismoLod, game: g(13.0, 315, 100), references: "mb-tourismo" },
  { id: "veh-setra-s515", title: "Setra S 515 HD", spec: setraS515Spec, build: setraS515, buildLod: setraS515Lod, game: g(13.5, 335, 100), references: "setra-s515" },
  { id: "veh-neoplan-skyliner", title: "Neoplan Skyliner", spec: skylinerSpec, build: neoplanSkyliner, buildLod: neoplanSkylinerLod, game: g(18.0, 375, 100), references: "neoplan-skyliner" },
  { id: "veh-volvo-7900e", title: "Volvo 7900 Electric", spec: volvo7900eSpec, build: volvo7900e, buildLod: volvo7900eLod, game: g(13.0, 200, 80), references: "volvo-7900e" },
  { id: "veh-scania-citywide", title: "Scania Citywide", spec: citywideSpec, build: scaniaCitywide, buildLod: scaniaCitywideLod, game: g(11.0, 206, 80), references: "scania-citywide" },
  { id: "veh-van-hool-exquicity", title: "Van Hool Exqui.City", spec: exquiCitySpec, build: vanHoolExquiCity, buildLod: vanHoolExquiCityLod, game: g(18.0, 250, 70), references: "van-hool-exquicity" },
  { id: "veh-skoda-14tr", title: "Skoda 14Tr", spec: skoda14trSpec, build: skoda14tr, buildLod: skoda14trLod, game: g(10.4, 100, 65), references: "skoda-14tr" },
  { id: "veh-skoda-15tr", title: "Skoda 15Tr", spec: skoda15trSpec, build: skoda15tr, buildLod: skoda15trLod, game: g(15.6, 175, 65), references: "skoda-15tr" },
  { id: "veh-ikarus-260", title: "Ikarus 260", spec: ikarus260Spec, build: ikarus260, buildLod: ikarus260Lod, params: IKARUS_PARAMS, finishParams: ["livery"], game: g(9.6, 141, 70), references: "ikarus-260" },
  { id: "veh-ikarus-280", title: "Ikarus 280", spec: ikarus280Spec, build: ikarus280, buildLod: ikarus280Lod, params: IKARUS_PARAMS, finishParams: ["livery"], game: g(14.8, 141, 70), references: "ikarus-280" },
  { id: "veh-solaris-trollino", title: "Solaris Trollino 18", spec: trollinoSpec, build: solarisTrollino, buildLod: solarisTrollinoLod, game: g(17.0, 250, 65), references: "solaris-trollino" },
  { id: "veh-gillig-low-floor", title: "Gillig Low Floor", spec: gilligSpec, build: gilligLowFloor, buildLod: gilligLowFloorLod, game: g(12.4, 209, 100), references: "gillig-low-floor" },
  { id: "veh-new-flyer-xcelsior", title: "New Flyer Xcelsior", spec: xcelsiorSpec, build: newFlyerXcelsior, buildLod: newFlyerXcelsiorLod, params: XCELSIOR_PARAMS, lodTriangles: 200, game: g(12.5, 209, 100, [{ params: { length: "60" }, weight: 19.0, power: 250 }]), references: "new-flyer-xcelsior" },
  { id: "veh-mci-d4505", title: "MCI D4505", spec: mciD4505Spec, build: mciD4505, buildLod: mciD4505Lod, game: g(17.0, 324, 110), references: "mci-d4505" },
  { id: "veh-byd-k9", title: "BYD K9", spec: bydK9Spec, build: bydK9, buildLod: bydK9Lod, game: g(13.5, 180, 70), references: "byd-k9" },
  { id: "veh-hyundai-universe", title: "Hyundai Universe", spec: universeSpec, build: hyundaiUniverse, buildLod: hyundaiUniverseLod, game: g(13.0, 302, 110), references: "hyundai-universe" },
];

/** A world bus as a catalog design (every batch's). */
export const worldBusDesign = (b: WorldBus): ProceduralDesign => ({
  id: b.id,
  title: b.title,
  game: b.game,
  build: b.build,
  buildLod: b.buildLod,
  ...(b.params ? { params: b.params } : {}),
  ...(b.finishParams ? { finishParams: b.finishParams } : {}),
  references: b.references,
  ...(b.lodTriangles ? { lodTriangles: b.lodTriangles } : {}),
  catalog: BUS_CATALOG,
});

export const WORLD_BUSES: ProceduralDesign[] = WORLD_BUS_SPECS.map(worldBusDesign);

/** The kind of every bus in the batch, for the docs and tests. */
export const busKindOf = (b: WorldBus): BusKind => b.spec().kind;
