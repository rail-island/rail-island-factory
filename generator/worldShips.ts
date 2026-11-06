// The ships from around the world (docs/models/world-ships.md): what the four
// modules of the family share - the design record a ship is listed with, its game
// properties (the waterline's draftFrac measured off the built model), the load
// parameter, and the shapes many ships repeat (an ocean hull, an accommodation
// block with its bridge, a funnel, a mast). Each ship is a ShipSpec on the hull
// kit (hullKit.ts) at its real size; the ids are stored in the game's saved maps:
// never rename one.
//
// The modules by kind: worldShipsCargo.ts (container ships, tankers, gas and bulk
// carriers, ro-ro and general cargo, river cargo), worldShipsService.ts (tugs,
// fishing vessels, icebreakers and research ships, offshore and rescue craft),
// worldShipsPassenger.ts (ferries, fast craft, river and lake boats, cruise ships
// and liners), worldShipsSmall.ts (sailing ships and small craft).

import type { MeshBuilder } from "./meshBuilder.ts";
import { coverageCombinations, resolveParams, type CatalogFields, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign, type VehicleGameVariant } from "./design.ts";
import { shipDraftFrac, type HullForm, type Item, type ShipSpec, type Tier, type Windows } from "./hullKit.ts";

type Builder = (p?: ParamValues) => MeshBuilder;

/** A ship as its module lists it. */
export interface WorldShip {
  id: string;
  title: string;
  spec: (p?: ParamValues) => ShipSpec;
  build: Builder;
  buildLod: Builder;
  params?: readonly ParamSpec[];
  finishParams?: readonly string[];
  /** Displacement t, installed power kW, service speed km/h (published figures). */
  game: { weight: number; power: number; maxspeed: number };
  references: string;
}

/**
 * A ship's game properties: its running figures and the waterline's draftFrac,
 * measured off the built model the first time the export asks (the model's
 * height is its mast or funnel top), and again for each parameter value that
 * changes the height (a container ship without its load keeps its mast).
 */
function shipGame(w: WorldShip): GameProperties {
  let memo: { d: number; v: VehicleGameVariant[] } | null = null;
  const calc = (): { d: number; v: VehicleGameVariant[] } => {
    if (memo) return memo;
    const d = shipDraftFrac(w.spec());
    const v: VehicleGameVariant[] = [];
    const defaults = resolveParams(w.params ?? []);
    for (const combo of coverageCombinations(w.params, w.finishParams)) {
      const own = Object.fromEntries(Object.entries(combo).filter(([k, val]) => defaults[k] !== val));
      if (!Object.keys(own).length || Object.keys(own).some((k) => w.finishParams?.includes(k))) continue;
      const dv = shipDraftFrac(w.spec(own));
      if (Math.abs(dv - d) > 1e-4 && !v.some((x) => JSON.stringify(x.params) === JSON.stringify(own))) v.push({ params: own, draftFrac: dv });
    }
    return (memo = { d, v });
  };
  const game = { weight: w.game.weight, power: w.game.power, maxspeed: w.game.maxspeed, accel: null } as GameProperties;
  Object.defineProperty(game, "draftFrac", { enumerable: true, get: () => calc().d });
  Object.defineProperty(game, "variants", { enumerable: true, get: () => (calc().v.length ? calc().v : undefined) });
  return game;
}

/** The catalog fields of the family, as ships.ts SHIP_CATALOG (not imported: a model's JS bundle would carry ships.ts). */
const SHIP_CATALOG: CatalogFields = { category: "Ships", group: "ship", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" };

/** The catalog designs of a module's ships: bow at +X, as the cruise ferry (yaw 180). */
export function shipDesigns(list: readonly WorldShip[]): ProceduralDesign[] {
  return list.map((s) => ({
    id: s.id,
    title: s.title,
    game: shipGame(s),
    build: s.build,
    buildLod: s.buildLod,
    ...(s.params ? { params: s.params } : {}),
    ...(s.finishParams ? { finishParams: s.finishParams } : {}),
    references: s.references,
    catalog: { ...SHIP_CATALOG, yaw: 180 },
  }));
}

// --- shared parameters ---------------------------------------------------------------

/** A cargo ship's load: the containers, trailers or cargo on deck, or none. */
export const LOAD_PARAM: ParamSpec = {
  name: "load", title: "Load", default: "full",
  values: [{ value: "full", title: "Full" }, { value: "empty", title: "Empty" }],
};

/** A livery parameter from [value, title] pairs, the first the default. */
export function liveryParam(...values: ReadonlyArray<readonly [string, string]>): ParamSpec {
  return { name: "livery", title: "Livery", default: values[0]![0], values: values.map(([value, title]) => ({ value, title })) };
}

/** A colour parameter from [value, title] pairs, the first the default. */
export function colourParam(...values: ReadonlyArray<readonly [string, string]>): ParamSpec {
  return { name: "colour", title: "Colour", default: values[0]![0], values: values.map(([value, title]) => ({ value, title })) };
}

/** The resolved value of one parameter. */
export function pick(params: readonly ParamSpec[], p: ParamValues | undefined, name: string): string {
  return resolveParams(params, p ?? {})[name]!;
}

// --- shared shapes -------------------------------------------------------------------

/** An ocean hull: bulbous bow and transom stern unless stated, round bilge, a little sheer forward. */
export function oceanHull(o: Partial<HullForm> & { length: number; beam: number; depth: number; draft: number }): HullForm {
  return { bow: "bulbous", stern: "transom", section: "round", sheer: [0, 0], ...o };
}

/**
 * An accommodation block: `decks` tiers of `h` metres from `y0`, from u0 to u1 at
 * half-width hw, each a little shorter than the one below, a row of windows on
 * each, the top one the wheelhouse with its front windows and bridge wings out to
 * `wings` (0: none).
 */
export function deckhouse(o: { u: readonly [number, number]; y0: number; decks: number; hw: number; h?: number; step?: number; wings?: number; mat?: string; pitch?: number; round?: number; detail?: boolean }): Tier[] {
  const h = o.h ?? 2.8;
  const step = o.step ?? 0.6;
  const out: Tier[] = [];
  for (let k = 0; k < o.decks; k++) {
    const top = k + 1 === o.decks;
    const a = o.u[0] + step * k;
    const b = o.u[1] - step * k * 0.3;
    const y0 = o.y0 + k * h;
    const win: Windows = { y: h * 0.38, h: h * 0.36, w: Math.min(1.4, h * 0.45), pitch: o.pitch ?? Math.max(2.2, h * 0.9) };
    out.push({
      k: "tier", u: [a, b], y: [y0, y0 + h], hw: o.hw - (top ? 0 : k * 0.05), mat: o.mat ?? "house",
      ...(o.round ? { round: [o.round, 0] as const } : {}),
      windows: top ? [] : [win],
      ...(top ? { front: { y: h * 0.32, h: h * 0.45, w: Math.min(1.8, o.hw * 0.25), n: Math.max(3, Math.round(o.hw / 1.6)) } } : {}),
      ...(top && o.wings ? { wings: { hw: o.wings, h: h * 0.85 } } : {}),
      // the detailed house: deck edges, windows on the front of every deck and the wheelhouse's sides
      ...(o.detail ? {
        lip: top ? 0.7 : 0.35,
        ...(top ? { windows: [{ ...win, y: h * 0.3, h: h * 0.42, pitch: 1.8 }] } : { front: { y: win.y, h: win.h, w: win.w, n: Math.max(3, Math.round((o.hw * 2) / 3)) } }),
      } : {}),
      name: top ? "wheelhouse" : `accommodation deck ${k + 1}`,
    });
  }
  return out;
}

/**
 * A cargo ship's house aft (or forward): the accommodation block on the deck at
 * D, its wheelhouse and wings, the funnel standing on its after part (or at
 * `funnelAt`), a signal mast on the wheelhouse and, unless `boats` is false, a
 * lifeboat each side.
 */
export function aftHouse(o: {
  u: readonly [number, number]; D: number; decks: number; hw: number; h?: number; wings?: number; step?: number; mat?: string;
  funnel?: { u?: readonly [number, number]; hw?: number; h?: number; bands?: Array<readonly [string, number]>; rake?: number } | false;
  mastH?: number; boats?: boolean;
  /** The detailed house (deckhouse's detail), exhaust pipes on the funnel and, where given, a freefall lifeboat of that length aft. */
  detail?: boolean; freefall?: number;
}): Item[] {
  const h = o.h ?? 2.8;
  const top = o.D - 0.2 + o.decks * h;
  const len = o.u[1] - o.u[0];
  const out: Item[] = [...deckhouse({ u: o.u, y0: o.D - 0.2, decks: o.decks, hw: o.hw, h, wings: o.wings ?? 0, step: o.step ?? Math.min(1, len * 0.04), ...(o.mat ? { mat: o.mat } : {}), ...(o.detail ? { detail: true } : {}) })];
  if (o.funnel !== false) {
    const f = o.funnel ?? {};
    const fu = f.u ?? [o.u[0] + len * 0.08, o.u[0] + len * 0.08 + Math.max(2.5, len * 0.28)];
    const fh = f.h ?? Math.max(4, o.decks * h * 0.55);
    const fhw = f.hw ?? Math.max(1, o.hw * 0.22);
    const rake = f.rake ?? fh * 0.06;
    out.push(funnel(fu, fhw, [top - h * 0.6, top + fh], f.bands ?? [["funnel", 0.86], ["black", 1]], rake));
    if (o.detail) out.push(...exhausts(fu, fhw, top + fh, rake));
  }
  out.push(mast(o.u[1] - Math.min(len * 0.3, 4), top, top + (o.mastH ?? Math.max(4, h * 3)), Math.max(0.15, o.hw * 0.012)));
  if (o.boats !== false && !o.freefall) out.push(lifeboats([o.u[0] + len * 0.6], o.hw + 0.9, o.D - 0.2 + h * 1.5, Math.min(8, Math.max(4, len * 0.25)), Math.min(1.3, Math.max(0.7, len * 0.035))));
  if (o.freefall) {
    const tilt = 0.55;
    out.push({ k: "freefall", u: o.u[0] - (o.freefall / 2) * Math.cos(tilt) + 0.6, y: o.D - 0.2 + h * 1.1, len: o.freefall, tilt });
    // a rescue boat in its davit on the side
    out.push({ k: "boats", at: [o.u[0] + len * 0.55], z: o.hw + 0.9, y: o.D - 0.2 + h * 1.5, len: 6, r: 0.9, name: "rescue boat" });
  }
  return out;
}

/** The exhaust pipes standing out of a funnel's mouth (base u0..u1, half-width hw, top y, raked aft). */
export function exhausts(u: readonly [number, number], hw: number, y: number, rake = 0): Item[] {
  const uc = (u[0] + u[1]) / 2 - rake;
  const r = Math.max(0.25, hw * 0.22);
  return [-0.45, 0.45].map((f, i): Item => ({ k: "cyl", u: uc + (u[1] - u[0]) * 0.18 * (i ? 1 : -1), z: hw * f, y: [y - 1, y + Math.max(1, hw * 0.4)], r, mat: "black", name: `exhaust pipe ${i + 1}` }));
}

/**
 * An ocean ship's fittings (docs/models/world-ships.md, "Detail"): the forecastle's
 * bulwark, the anchors in their pockets each side of the bow, the windlasses and
 * bollards on the forecastle, the mooring winches aft at `aft` (metres from the
 * stern; none when empty) and, given the `draft`, the draft marks and the bow
 * thruster's sign on the hull.
 */
export function fittings(o: { L: number; B: number; D: number; fc: readonly [number, number]; aft?: readonly number[]; anchor?: number; bulwark?: number; rake?: number; draft?: number }): Item[] {
  const s = o.anchor ?? Math.min(4.5, Math.max(1.1, o.L / 85));
  const k = Math.min(1.6, Math.max(0.5, o.L / 200));
  const top = o.D + o.fc[1];
  const T = o.draft;
  return [
    ...(T ? [{ k: "marks", at: [o.L * 0.9, o.L * 0.5], y: [Math.max(1, T - 4 * k), T + 4 * k], step: Math.max(0.5, Math.round(k * 2) / 2), s: 0.6 * k, thruster: o.L * 0.95 } as Item] : []),
    { k: "bulwark", u: [o.L - o.fc[0] + 0.8, o.L], h: o.bulwark ?? Math.min(2, Math.max(1, o.L / 220)), t: 0.3 },
    { k: "anchors", u: o.L * (1 - (o.rake ?? 0.03)) - s * 0.9, y: top - s * 1.1, s },
    { k: "mooring", at: [o.L - o.fc[0] * 0.72, o.L - o.fc[0] * 0.4], hw: o.B / 2 - 2.5 * k, s: k, winch: true },
    ...((o.aft ?? [2.5]).length ? [{ k: "mooring", at: o.aft ?? [2.5], hw: o.B / 2 - 2.5 * k, s: k } as Item] : []),
  ];
}

/** The bay gaps of a container item (its `u`, `bays`), where lashing bridges stand. */
export function bayGaps(u: readonly [number, number], bays: number): number[] {
  const len = (u[1] - u[0] - 0.6 * (bays - 1)) / bays;
  return Array.from({ length: bays - 1 }, (_, k) => u[0] + (k + 1) * (len + 0.6) - 0.3);
}

/** A funnel: its base u0..u1 and half-width, from y0 to y1, in the bands given (fractions of its height), raked aft. */
export function funnel(u: readonly [number, number], hw: number, y: readonly [number, number], bands: Array<readonly [string, number]>, rake = 0, z?: number): Item {
  return { k: "funnel", u, hw, y, bands, rake, ...(z !== undefined ? { z } : {}) };
}

/** A signal mast with a yard and radar. */
export function mast(u: number, y0: number, y1: number, r = 0.25): Item {
  return { k: "mast", u, y: [y0, y1], r, yards: [[y0 + (y1 - y0) * 0.7, Math.max(1.5, (y1 - y0) * 0.18)]], radar: true };
}

/** Lifeboats in davits, both sides. */
export function lifeboats(at: readonly number[], z: number, y: number, len = 8, r = 1.2): Item {
  return { k: "boats", at, z, y, len, r };
}
