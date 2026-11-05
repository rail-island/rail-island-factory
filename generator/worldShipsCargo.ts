// The world's cargo ships (docs/models/world-ships-cargo.md): container ships,
// tankers, gas and bulk carriers, ro-ro, heavy-lift and general cargo ships, and
// river cargo vessels, each a ShipSpec on the hull kit (hullKit.ts) at its real
// size, modelled on the photographs in assets/<references>/ and the published
// figures in each folder's SOURCES.md. Metres from the stern (u), heights from the
// keel. The ids are stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { shipLod, worldShip, type Item, type ShipSpec } from "./hullKit.ts";
import { aftHouse, deckhouse, funnel, LOAD_PARAM, liveryParam, mast, oceanHull, pick, shipDesigns, type WorldShip } from "./worldShips.ts";

const loaded = (p: ParamValues | undefined, params: readonly ParamSpec[] = [LOAD_PARAM]): boolean => pick(params, p, "load") === "full";
/** The items only a loaded ship carries. */
const cargo = (p: ParamValues | undefined, items: Item[], params: readonly ParamSpec[] = [LOAD_PARAM]): Item[] => (loaded(p, params) ? items : []);

// ---------------------------------------------------------------------------
// container ships

const MAERSK = { hull: "#6b8fae", bottom: "#8b2b25", boot: "#25292d", deck: "#6f7a77", house: "#f1f1ec", funnel: "#6b8fae", stripe: "#f1f1ec" };

export function tripleESpec(p?: ParamValues): ShipSpec {
  const D = 33;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 399, beam: 59, depth: D, draft: 14.5, entry: 0.22, run: 0.24, transom: 0.8, boot: 1.2, forecastle: [22, 2.6] }),
    livery: MAERSK,
    items: [
      { k: "hatches", u: [14, 380], n: 26, hw: 27, y: D, h: 1.2, gap: 1.6 },
      ...cargo(p, [
        { k: "containers", u: [14, 80], bays: 5, hw: 28.4, y: D + 1.2, tiers: 9, seed: 3 },
        { k: "containers", u: [100, 228], bays: 10, hw: 28.4, y: D + 1.2, tiers: 10, seed: 5 },
        { k: "containers", u: [252, 372], bays: 9, hw: 28.4, y: D + 1.2, tiers: 9, seed: 11 },
      ]),
      // the engine room's casing and the twin uptakes aft
      { k: "tier", u: [82, 98], y: [D - 0.2, D + 16], hw: 10, name: "engine casing" },
      funnel([84, 96], 4.2, [D + 16, D + 34], [["funnel", 0.85], ["black", 1]], 1.2, -4.6),
      funnel([84, 96], 4.2, [D + 16, D + 34], [["funnel", 0.85], ["black", 1]], 1.2, 4.6),
      // the island deckhouse forward of midships, its bridge over the stacks
      ...deckhouse({ u: [230, 250], y0: D - 0.2, decks: 12, hw: 17, h: 2.9, step: 0.3, wings: 29.5 }),
      mast(240, D - 0.2 + 12 * 2.9, D + 42),
      { k: "box", u: [368, 374], z: [-9, 9], y: [D + 2.6, D + 7.5], mat: "house", name: "breakwater" },
    ],
  };
}

export function emmaMaerskSpec(p?: ParamValues): ShipSpec {
  const D = 30.2;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 397.7, beam: 56.4, depth: D, draft: 15.5, entry: 0.24, run: 0.22, transom: 0.78, boot: 1.2, forecastle: [20, 2.6] }),
    livery: MAERSK,
    items: [
      { k: "hatches", u: [10, 382], n: 27, hw: 25.8, y: D, h: 1.2, gap: 1.5 },
      ...cargo(p, [
        { k: "containers", u: [10, 68], bays: 4, hw: 27, y: D + 1.2, tiers: 8, seed: 2 },
        { k: "containers", u: [86, 152], bays: 5, hw: 27, y: D + 1.2, tiers: 9, seed: 4 },
        { k: "containers", u: [170, 374], bays: 15, hw: 27, y: D + 1.2, tiers: 8, seed: 6 },
      ]),
      { k: "tier", u: [70, 84], y: [D - 0.2, D + 15], hw: 9, name: "engine casing" },
      funnel([71, 83], 5.5, [D + 15, D + 31], [["funnel", 0.85], ["black", 1]], 1.2),
      ...deckhouse({ u: [153, 168], y0: D - 0.2, decks: 12, hw: 16, h: 2.85, step: 0.3, wings: 28 }),
      mast(160, D - 0.2 + 12 * 2.85, D + 41),
      { k: "box", u: [367, 373], z: [-9, 9], y: [D + 2.6, D + 7.5], mat: "house", name: "breakwater" },
    ],
  };
}

export function gulsunSpec(p?: ParamValues): ShipSpec {
  const D = 33.2;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 399.9, beam: 61.5, depth: D, draft: 16, entry: 0.2, run: 0.24, transom: 0.82, boot: 1.2, forecastle: [16, 2.6] }),
    livery: { hull: "#1e2226", bottom: "#8f2a22", boot: "#c9c6bd", deck: "#5d6466", house: "#f2f0ea", funnel: "#d9b23e" },
    items: [
      { k: "hatches", u: [12, 384], n: 26, hw: 28.6, y: D, h: 1.2, gap: 1.6 },
      ...cargo(p, [
        { k: "containers", u: [12, 52], bays: 3, hw: 29.6, y: D + 1.2, tiers: 10, seed: 13 },
        { k: "containers", u: [70, 318], bays: 19, hw: 29.6, y: D + 1.2, tiers: 11, seed: 17 },
        { k: "containers", u: [340, 380], bays: 3, hw: 29.6, y: D + 1.2, tiers: 9, seed: 19 },
      ]),
      { k: "tier", u: [54, 68], y: [D - 0.2, D + 17], hw: 9, name: "engine casing" },
      funnel([56, 66], 5, [D + 17, D + 34], [["funnel", 0.85], ["black", 1]], 1.0),
      ...deckhouse({ u: [320, 338], y0: D - 0.2, decks: 13, hw: 15, h: 2.9, step: 0.3, wings: 31 }),
      mast(329, D - 0.2 + 13 * 2.9, D + 45),
    ],
  };
}

export const PANAMAX_PARAMS: readonly ParamSpec[] = [LOAD_PARAM, /* @__PURE__ */ liveryParam(["orange", "Orange"], ["green", "Green"], ["blue", "Blue"])];
const PANAMAX_LIVERIES: Record<string, Record<string, string>> = {
  orange: { hull: "#d9681e", funnel: "#d9681e", deck: "#6b6f6c" },
  green: { hull: "#2f6a45", funnel: "#2f6a45", deck: "#6b6f6c", stripe: "#f2f0ea" },
  blue: { hull: "#23426e", funnel: "#23426e", deck: "#6b6f6c" },
};

export function panamaxSpec(p?: ParamValues): ShipSpec {
  const D = 21.8;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 294, beam: 32.2, depth: D, draft: 12, entry: 0.24, run: 0.22, boot: 1, forecastle: [16, 2.5] }),
    livery: { house: "#f2f0ea", ...PANAMAX_LIVERIES[pick(PANAMAX_PARAMS, p, "livery")]! },
    items: [
      { k: "hatches", u: [8, 270], n: 19, hw: 14.8, y: D, h: 1.1, gap: 1.4 },
      ...cargo(p, [
        { k: "containers", u: [8, 30], bays: 2, hw: 15.6, y: D + 1.1, tiers: 5, seed: 23 },
        { k: "containers", u: [64, 268], bays: 16, hw: 15.6, y: D + 1.1, tiers: 6, seed: 29 },
      ], PANAMAX_PARAMS),
      ...aftHouse({ u: [34, 60], D, decks: 7, hw: 12, wings: 16.1, funnel: { u: [36, 44], hw: 3.2, h: 9 } }),
    ],
  };
}

export function feederSpec(p?: ParamValues): ShipSpec {
  const D = 11;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 134, beam: 22.5, depth: D, draft: 8, entry: 0.26, run: 0.22, boot: 0.7, forecastle: [10, 2.2] }),
    livery: { hull: "#3a3f46", bottom: "#8f2a22", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#d23a2a", crane: "#e3b021" },
    items: [
      { k: "hatches", u: [24, 120], n: 8, hw: 9.8, y: D, h: 1, gap: 1.2 },
      ...cargo(p, [{ k: "containers", u: [24, 120], bays: 8, hw: 10.4, y: D + 1, tiers: 4, seed: 31 }]),
      ...aftHouse({ u: [4, 20], D, decks: 5, hw: 8, wings: 11.2, funnel: { u: [5.5, 10], hw: 1.8, h: 6 } }),
      { k: "crane", u: 54, z: -9.6, y: D, h: 14, jib: 28, dir: Math.PI * 0.62, lift: 0.75 },
      { k: "crane", u: 92, z: -9.6, y: D, h: 14, jib: 28, dir: Math.PI * 0.62, lift: 0.75 },
    ],
  };
}

export function idealXSpec(): ShipSpec {
  const D = 12.2;
  return {
    kind: "cargo",
    hull: { length: 159.6, beam: 20.7, depth: D, draft: 9.2, bow: "raked", stern: "cruiser", section: "round", sheer: [0.8, 2.2], forecastle: [14, 2.4], poop: [26, 2.4], boot: 0.5, screws: 1 },
    livery: { hull: "#2f3438", bottom: "#7a2c26", deck: "#76695a", house: "#e9e6de", funnel: "#2f3438", mast: "#cfcac0", steel: "#a9adae" },
    items: [
      // the spar deck built over the tanks to carry the trailers' boxes
      { k: "box", u: [30, 142], z: [-9.4, 9.4], y: [D + 1.2, D + 1.8], mat: "steel", name: "spar deck" },
      { k: "containers", u: [31, 141], bays: 9, hw: 8.8, y: D + 1.8, tiers: 1, groups: 2, seed: 37 },
      { k: "tier", u: [76, 88], y: [D + 1.8, D + 4.6], hw: 6.5, windows: [{ y: 1, h: 0.8, w: 0.7, pitch: 2 }], name: "bridge house" },
      { k: "tier", u: [80, 87.5], y: [D + 4.6, D + 7.2], hw: 5.5, front: { y: 0.8, h: 0.9, w: 0.8, n: 5 }, wings: { hw: 8.6, h: 1.4 }, name: "wheelhouse" },
      { k: "tier", u: [4, 26], y: [D + 2.2, D + 5], hw: 8.5, windows: [{ y: 1, h: 0.8, w: 0.6, pitch: 2.2 }], name: "after house" },
      funnel([8, 14], 2.4, [D + 5, D + 13], [["funnel", 0.86], ["black", 1]], 0.8),
      mast(150, D + 2.4, D + 18, 0.25),
      mast(84, D + 7.2, D + 16, 0.2),
    ],
  };
}

// ---------------------------------------------------------------------------
// tankers

const TANKER = { hull: "#2c3a4a", bottom: "#8f2a22", boot: "#24282c", deck: "#9b4a35", house: "#f2f0ea", funnel: "#2c3a4a" };
const TANKER_LIVERIES: Record<string, Record<string, string>> = {
  navy: TANKER,
  green: { ...TANKER, hull: "#2f5a3e", funnel: "#2f5a3e" },
  black: { ...TANKER, hull: "#1d2024", funnel: "#c23128" },
  red: { ...TANKER, hull: "#9a2a22", funnel: "#9a2a22", deck: "#6f7a77" },
};
const tankerLivery = (...keys: string[]): ParamSpec => /* @__PURE__ */ liveryParam(...keys.map((k) => [k, k[0]!.toUpperCase() + k.slice(1)] as const));

/** A crude tanker's deck: the pipe runs, the catwalk, the manifold and its cranes. */
function tankDeck(u0: number, u1: number, D: number, hw: number, hose = 0.5): Item[] {
  const mid = (u0 + u1) / 2;
  const n = hw > 20 ? 5 : 3;
  return [
    { k: "pipes", u: [u0, u1], z: Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * 1.5), y: D + 0.8, r: 0.35 },
    { k: "box", u: [u0, u1], z: [-0.6, 0.6], y: [D, D + 2.4], mat: "steel", name: "catwalk" },
    { k: "box", u: [mid - 4, mid + 4], z: [-hw * 0.95, hw * 0.95], y: [D, D + 1.4], mat: "steel", name: "manifold" },
    { k: "crane", u: mid + 7, z: hw * 0.6, y: D, h: 5, jib: hw * hose * 1.2, dir: Math.PI * 0.97, mat: "white" },
    { k: "crane", u: mid + 7, z: -hw * 0.6, y: D, h: 5, jib: hw * hose * 1.2, dir: -Math.PI * 0.97, mat: "white" },
  ];
}

export const VLCC_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ tankerLivery("navy", "green", "black")];
export function vlccSpec(p?: ParamValues): ShipSpec {
  const D = 29.7;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 330, beam: 60, depth: D, draft: 21, entry: 0.16, run: 0.17, transom: 0.75, boot: 1.4, forecastle: [16, 2.6] }),
    livery: TANKER_LIVERIES[pick(VLCC_PARAMS, p, "livery")]!,
    items: [...aftHouse({ u: [8, 36], D, decks: 6, hw: 21, h: 2.9, wings: 30, funnel: { u: [10, 20], hw: 4.2, h: 16 } }), ...tankDeck(42, 312, D, 28)],
  };
}

export function seawiseGiantSpec(): ShipSpec {
  const D = 29.8;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 458.45, beam: 68.8, depth: D, draft: 24.6, bow: "raked", entry: 0.15, run: 0.15, transom: 0.72, boot: 1.5, forecastle: [18, 2.8] }),
    livery: { ...TANKER, hull: "#1d2024", funnel: "#2a3b5f", deck: "#8d3b2c" },
    items: [...aftHouse({ u: [10, 42], D, decks: 7, hw: 24, h: 3, wings: 34.2, funnel: { u: [12, 24], hw: 5, h: 18 } }), ...tankDeck(48, 436, D, 32)],
  };
}

export const AFRAMAX_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ tankerLivery("red", "navy", "black")];
export function aframaxSpec(p?: ParamValues): ShipSpec {
  const D = 21;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 245, beam: 42, depth: D, draft: 14.8, entry: 0.18, run: 0.18, boot: 1.2, forecastle: [14, 2.5] }),
    livery: TANKER_LIVERIES[pick(AFRAMAX_PARAMS, p, "livery")]!,
    items: [...aftHouse({ u: [6, 30], D, decks: 6, hw: 15, wings: 21, funnel: { u: [8, 16], hw: 3.2, h: 12 } }), ...tankDeck(36, 230, D, 20)],
  };
}

export const PRODUCT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ tankerLivery("red", "navy", "green")];
export function productTankerSpec(p?: ParamValues): ShipSpec {
  const D = 19;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 183, beam: 32.2, depth: D, draft: 12, entry: 0.2, run: 0.2, boot: 1, forecastle: [12, 2.4] }),
    livery: TANKER_LIVERIES[pick(PRODUCT_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [5, 25], D, decks: 6, hw: 12, wings: 16.1, funnel: { u: [6, 12], hw: 2.6, h: 9 } }),
      ...tankDeck(30, 170, D, 15, 0.8),
      { k: "crane", u: 100, z: 0, y: D, h: 8, jib: 22, dir: Math.PI, lift: 0.5, mat: "white", name: "manifold crane" },
    ],
  };
}

export function lngMossSpec(): ShipSpec {
  const D = 26.5;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 290, beam: 48, depth: D, draft: 11.5, entry: 0.2, run: 0.2, boot: 1.2, forecastle: [18, 2.5] }),
    livery: { hull: "#2b3138", bottom: "#a3342b", boot: "#2b3138", deck: "#b7a990", house: "#f0eee8", funnel: "#2b3138", tank: "#d3cfc3" },
    items: [
      ...aftHouse({ u: [6, 30], D, decks: 7, hw: 19, wings: 24, funnel: { u: [8, 17], hw: 3.6, h: 15 } }),
      { k: "spheres", u: [36, 270], n: 5, r: 19.5, y: D + 6, mat: "tank" },
      { k: "pipes", u: [36, 270], z: [21, 21.8], y: D + 1.4, r: 0.4 },
    ],
  };
}

export function qmaxSpec(): ShipSpec {
  const D = 27;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 345, beam: 53.8, depth: D, draft: 12, entry: 0.2, run: 0.2, transom: 0.78, boot: 1.2, forecastle: [18, 2.6] }),
    livery: { hull: "#7a1f2b", bottom: "#8f2a22", boot: "#2b3138", deck: "#8d9493", house: "#f0eee8", funnel: "#7a1f2b", tank: "#c9ccc8" },
    items: [
      ...aftHouse({ u: [6, 32], D, decks: 7, hw: 20, wings: 26.9, funnel: { u: [8, 18], hw: 4, h: 15 } }),
      // the membrane tanks' trunk deck, with its domes and pipe run
      { k: "box", u: [40, 326], z: [-17, 17], y: [D - 0.2, D + 3.2], mat: "tank", name: "trunk deck" },
      { k: "domes", u: [60, 306], n: 4, r: 2.6, y: D + 3.2, h: 2.2, mat: "steel" },
      { k: "pipes", u: [40, 326], z: [-8, 8], y: D + 4, r: 0.6 },
      { k: "box", u: [178, 186], z: [-26, 26], y: [D, D + 1.4], mat: "steel", name: "manifold" },
    ],
  };
}

export function lpgSpec(): ShipSpec {
  const D = 10;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 120, beam: 19.6, depth: D, draft: 7.2, entry: 0.24, run: 0.22, boot: 0.6, forecastle: [9, 2.2] }),
    livery: { hull: "#c23128", bottom: "#2b3138", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: "#c23128", tank: "#e8e6df" },
    items: [
      ...aftHouse({ u: [4, 18], D, decks: 5, hw: 8, wings: 9.7, funnel: { u: [5, 9], hw: 1.6, h: 5 } }),
      // three pairs of pressure tanks, half above the deck
      { k: "tanks", u: [22, 106], n: 3, r: 4.2, y: D + 1.4, z: [-4.6, 4.6] },
      { k: "pipes", u: [22, 106], z: [0], y: D + 6.4, r: 0.3 },
      { k: "box", u: [22, 106], z: [-0.5, 0.5], y: [D, D + 6], mat: "steel", name: "catwalk" },
    ],
  };
}

export const CHEMICAL_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ tankerLivery("red", "navy", "green", "black")];
export function chemicalTankerSpec(p?: ParamValues): ShipSpec {
  const D = 18;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 183, beam: 32, depth: D, draft: 11.5, entry: 0.2, run: 0.2, boot: 1, forecastle: [12, 2.4] }),
    livery: TANKER_LIVERIES[pick(CHEMICAL_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [5, 25], D, decks: 6, hw: 12, wings: 16, funnel: { u: [6, 12], hw: 2.6, h: 9 } }),
      // a forest of pipes: one line per tank
      { k: "pipes", u: [30, 170], z: [-6, -4.8, -3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6, 4.8, 6], y: D + 0.9, r: 0.22 },
      { k: "box", u: [30, 170], z: [-0.4, 0.4], y: [D, D + 2.6], mat: "steel", name: "catwalk" },
      { k: "domes", u: [36, 164], n: 8, r: 0.9, y: D, h: 1.3, z: 10, mat: "steel" },
      { k: "domes", u: [36, 164], n: 8, r: 0.9, y: D, h: 1.3, z: -10, mat: "steel" },
      { k: "box", u: [96, 104], z: [-15, 15], y: [D, D + 1.4], mat: "steel", name: "manifold" },
      { k: "crane", u: 108, z: 8, y: D, h: 5, jib: 14, dir: Math.PI * 0.97, mat: "white" },
    ],
  };
}

// ---------------------------------------------------------------------------
// bulk carriers

const BULK_LIVERIES: Record<string, Record<string, string>> = {
  black: { hull: "#1d2024", bottom: "#8f2a22", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#d6b23a", hatch: "#7f8a5a" },
  red: { hull: "#8f2a22", bottom: "#2b3138", deck: "#6f7a77", house: "#f2f0ea", funnel: "#1d2024", hatch: "#3f5f7a" },
  blue: { hull: "#23426e", bottom: "#8f2a22", deck: "#7d5a40", house: "#f2f0ea", funnel: "#23426e", hatch: "#7f8a5a" },
  grey: { hull: "#5b6266", bottom: "#8f2a22", deck: "#7d5a40", house: "#f2f0ea", funnel: "#c23128", hatch: "#3d7a4a" },
};
const bulkLivery = (...keys: string[]): ParamSpec => /* @__PURE__ */ liveryParam(...keys.map((k) => [k, k[0]!.toUpperCase() + k.slice(1)] as const));

export const CAPESIZE_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ bulkLivery("black", "red", "blue")];
export function capesizeSpec(p?: ParamValues): ShipSpec {
  const D = 24.7;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 292, beam: 45, depth: D, draft: 18.2, entry: 0.16, run: 0.18, boot: 1.2, forecastle: [14, 2.6] }),
    livery: BULK_LIVERIES[pick(CAPESIZE_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [6, 30], D, decks: 6, hw: 15, wings: 22.5, funnel: { u: [8, 16], hw: 3.2, h: 12 } }),
      { k: "hatches", u: [40, 272], n: 9, hw: 11, y: D, h: 2.2, gap: 9 },
      mast(282, D + 2.6, D + 14),
    ],
  };
}

export function valemaxSpec(): ShipSpec {
  const D = 30.4;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 362, beam: 65, depth: D, draft: 23, entry: 0.15, run: 0.17, boot: 1.4, forecastle: [16, 2.8] }),
    livery: { hull: "#1d2024", bottom: "#8f2a22", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#2f6a45", hatch: "#d6b23a" },
    items: [
      ...aftHouse({ u: [8, 38], D, decks: 7, hw: 21, h: 2.9, wings: 32.5, funnel: { u: [10, 20], hw: 4.4, h: 15 } }),
      { k: "hatches", u: [46, 342], n: 7, hw: 15, y: D, h: 2.6, gap: 14 },
      mast(352, D + 2.8, D + 16),
    ],
  };
}

export const HANDYSIZE_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ bulkLivery("red", "black", "blue", "grey")];
export function handysizeSpec(p?: ParamValues): ShipSpec {
  const D = 15;
  return {
    kind: "cargo",
    hull: oceanHull({ length: 180, beam: 30, depth: D, draft: 10, entry: 0.2, run: 0.2, boot: 0.9, forecastle: [11, 2.4] }),
    livery: BULK_LIVERIES[pick(HANDYSIZE_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [4, 22], D, decks: 6, hw: 11, wings: 15, funnel: { u: [5, 11], hw: 2.4, h: 8 } }),
      { k: "hatches", u: [30, 166], n: 5, hw: 8.5, y: D, h: 1.8, gap: 9 },
      // the four deck cranes between the hatches
      ...[59.8, 88.6, 117.4, 146.2].map((u): Item => ({ k: "crane", u, z: 0, y: D, h: 13, jib: 24, dir: Math.PI * 0.85, lift: 0.85, mat: "crane" })),
      mast(174, D + 2.4, D + 12),
    ],
  };
}

const LAKER_LIVERIES: Record<string, Record<string, string>> = {
  red: { hull: "#8f2a22", bottom: "#2b3138", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#1d2024", hatch: "#6c6f72", stripe: "#f2f0ea" },
  black: { hull: "#1d2024", bottom: "#8f2a22", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#c23128", hatch: "#6c6f72", stripe: "#f2f0ea" },
};
export const LAKER_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["red", "Red"], ["black", "Black"])];

/** A Great Lakes freighter: the pilothouse at the bow, the engine house aft, a long run of small hatches. */
function lakeFreighter(L: number, B: number, D: number, T: number, liv: Record<string, string>, extra: Item[]): ShipSpec {
  return {
    kind: "cargo",
    hull: { length: L, beam: B, depth: D, draft: T, bow: "raked", stern: "transom", section: "flat", entry: 0.08, run: 0.08, transom: 0.85, rake: 0.012, sheer: [0, 0.6], forecastle: [12, 2.4], poop: [22, 2.4], boot: 0.5, stripe: 0.5 },
    livery: liv,
    items: [
      { k: "tier", u: [L - 14, L - 4], y: [D + 2.2, D + 5], hw: B / 2 - 1.6, windows: [{ y: 1, h: 0.8, w: 0.7, pitch: 2 }], name: "texas deck" },
      { k: "tier", u: [L - 13, L - 6], y: [D + 5, D + 7.6], hw: B / 2 - 3, front: { y: 0.8, h: 1.1, w: 1, n: 7 }, name: "pilothouse" },
      mast(L - 9, D + 7.6, D + 14, 0.2),
      { k: "tier", u: [3, 20], y: [D + 2.2, D + 5.2], hw: B / 2 - 1.2, windows: [{ y: 1.1, h: 0.8, w: 0.7, pitch: 2.2 }], name: "after house" },
      funnel([5, 10], 2, [D + 5.2, D + 11.5], [["funnel", 0.85], ["black", 1]], 0.4),
      ...extra,
    ],
  };
}

export function lakerSpec(p?: ParamValues): ShipSpec {
  const L = 222.5;
  return lakeFreighter(L, 22.9, 11.3, 7.9, LAKER_LIVERIES[pick(LAKER_PARAMS, p, "livery")]!, [
    { k: "hatches", u: [26, L - 18], n: 21, hw: 7.2, y: 11.3, h: 0.7, gap: 3.6 },
  ]);
}

export function selfUnloaderSpec(): ShipSpec {
  const L = 304.8;
  const D = 17;
  return lakeFreighter(L, 32, D, 9.4, { ...LAKER_LIVERIES.red!, hull: "#5a2a24", stripe: "#1d2024" }, [
    { k: "hatches", u: [30, L - 18], n: 36, hw: 11, y: D, h: 0.7, gap: 2.6 },
    // the unloading boom on its saddles, stowed along the deck forward from the stern
    { k: "boom", a: [24, D + 4.4, 0], b: [24 + 79, D + 4.4, 0], w: 1.3, mat: "grey" },
    { k: "box", u: [21, 27], z: [-3, 3], y: [D + 2.4, D + 5.2], mat: "grey", name: "boom slewing tower" },
    { k: "box", u: [96, 98], z: [-2, 2], y: [D, D + 3.2], mat: "grey", name: "boom saddle" },
  ]);
}

// ---------------------------------------------------------------------------
// ro-ro, car carriers, heavy lift, reefers and the general cargo ships

export const PCTC_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["blue", "Blue"], ["white", "White"], ["red", "Red"])];
export function pctcSpec(p?: ParamValues): ShipSpec {
  const L = 199.9;
  const D = 14;
  const liv = pick(PCTC_PARAMS, p, "livery");
  const side = liv === "white" ? "#eeeeea" : liv === "red" ? "#a8302a" : "#2a3b6b";
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 32.3, depth: D, draft: 9.5, entry: 0.24, run: 0.18, transom: 0.92, boot: 0.8 }),
    livery: { hull: side, house: side, deck: "#6f7a77", funnel: side, stripe: "#eeeeea" },
    items: [
      // the box of car decks to the top, the bridge across its fore end
      { k: "tier", u: [0.2, L - 12], y: [D - 0.3, 36.8], inset: 0.02, round: [0, 14], mat: "house", top: "house", name: "car decks" },
      { k: "tier", u: [L - 36, L - 20], y: [36.8, 39.6], hw: 15.6, front: { y: 0.8, h: 1.3, w: 1.6, n: 11 }, name: "wheelhouse" },
      funnel([10, 18], 2.8, [36.8, 42], [["funnel", 1]], 0.4),
      mast(L - 28, 39.6, 46, 0.25),
      // the quarter ramp, stowed upright on the starboard quarter
      { k: "plate", pts: [[6, 14], [30, 14], [24, 30], [8, 30]], z: 16.25, t: 0.4, mat: "steel", name: "stern ramp" },
    ],
  };
}

export const RORO_PARAMS: readonly ParamSpec[] = [LOAD_PARAM, /* @__PURE__ */ liveryParam(["white", "White"], ["blue", "Blue"], ["orange", "Orange"])];
export function roroSpec(p?: ParamValues): ShipSpec {
  const L = 190;
  const D = 16;
  const liv = pick(RORO_PARAMS, p, "livery");
  const side = liv === "blue" ? "#23426e" : liv === "orange" ? "#d9681e" : "#eeeeea";
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 26, depth: D, draft: 7.5, entry: 0.22, run: 0.16, transom: 0.92, boot: 0.8, forecastle: [30, 3] }),
    livery: { hull: side, house: "#eeeeea", deck: "#6f7a77", funnel: side },
    items: [
      ...deckhouse({ u: [L - 30, L - 14], y0: D + 2.8, decks: 4, hw: 12, wings: 13, step: 0.4 }),
      mast(L - 20, D + 2.8 + 4 * 2.8, D + 22),
      funnel([14, 22], 2.4, [D, D + 9], [["funnel", 0.86], ["black", 1]], 0.4, 9),
      funnel([14, 22], 2.4, [D, D + 9], [["funnel", 0.86], ["black", 1]], 0.4, -9),
      ...cargo(p, [{ k: "containers", u: [26, L - 34], bays: 9, hw: 11.5, y: D, tiers: 1, groups: 4, seed: 41, name: "trailers" }], RORO_PARAMS),
      { k: "plate", pts: [[0.3, D - 6], [0.3, D + 0.2], [1.2, D + 9], [1.2, D - 6]], z: 0, t: 18, mat: "steel", name: "stern ramp" },
    ],
  };
}

export const HEAVY_LIFT_PARAMS: readonly ParamSpec[] = [LOAD_PARAM];
export function heavyLiftSpec(p?: ParamValues): ShipSpec {
  const L = 275;
  const D = 15.5;
  return {
    kind: "cargo",
    hull: { length: L, beam: 70, depth: D, draft: 10.5, bow: "raked", stern: "transom", section: "flat", entry: 0.08, run: 0.04, transom: 0.95, rake: 0.03, boot: 1, stripe: 0, screws: 2 },
    livery: { hull: "#1d2024", bottom: "#8f2a22", boot: "#c23128", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#d6b23a" },
    items: [
      // the forward house across the whole beam, and the stern's buoyancy casings
      ...deckhouse({ u: [L - 30, L - 4], y0: D - 0.2, decks: 7, hw: 30, h: 3, wings: 34.6 }),
      { k: "tier", u: [L - 22, L - 10], y: [D + 21, D + 25], hw: 10, name: "helideck pedestal" },
      { k: "helideck", u: L - 16, y: D + 25, r: 11 },
      funnel([L - 30, L - 24], 3, [D + 18, D + 28], [["funnel", 0.86], ["black", 1]], 0.4, 22),
      funnel([L - 30, L - 24], 3, [D + 18, D + 28], [["funnel", 0.86], ["black", 1]], 0.4, -22),
      { k: "box", u: [2, 16], z: [24, 34], y: [D, D + 14], mat: "house", name: "starboard casing" },
      { k: "box", u: [2, 16], z: [-34, -24], y: [D, D + 14], mat: "house", name: "port casing" },
      ...cargo(p, [
        // a jack-up rig's hull on the deck
        { k: "box", u: [60, 170], z: [-30, 30], y: [D, D + 8], mat: "yellow", name: "cargo hull" },
        { k: "tier", u: [130, 166], y: [D + 8, D + 20], hw: 18, mat: "white", windows: [{ y: 2, h: 1, w: 1, pitch: 3 }], name: "cargo accommodation" },
        ...[[70, 24], [70, -24], [158, 24], [158, -24]].map(([u, z]): Item => ({ k: "cyl", u: u!, z: z!, y: [D + 8, D + 60], r: 2.2, mat: "orange", name: "cargo leg" })),
      ]),
    ],
  };
}

export const REEFER_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["white", "White"], ["blue", "Blue"], ["red", "Red"])];
export function reeferSpec(p?: ParamValues): ShipSpec {
  const L = 150;
  const D = 13;
  const liv = pick(REEFER_PARAMS, p, "livery");
  const side = liv === "blue" ? "#23426e" : liv === "red" ? "#a8302a" : "#eeeeea";
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 23, depth: D, draft: 9, entry: 0.26, run: 0.22, boot: 0.8, sheer: [0.4, 1.4], forecastle: [12, 2.4] }),
    livery: { hull: side, bottom: "#8f2a22", deck: "#6f7a77", house: "#f2f0ea", funnel: "#1f4f9a", hatch: "#3d7a4a", mast: "#e3b021" },
    items: [
      ...aftHouse({ u: [6, 24], D, decks: 5, hw: 9, wings: 11.4, funnel: { u: [7, 12], hw: 2, h: 7 } }),
      { k: "hatches", u: [30, 136], n: 4, hw: 6.5, y: D, h: 1.6, gap: 8 },
      ...[52, 82, 112].map((u): Item => ({ k: "derrick", u, y: D, h: 14, boom: 13, dir: Math.PI, pair: true, mat: "mast" })),
    ],
  };
}

export function libertySpec(): ShipSpec {
  const D = 11.4;
  return {
    kind: "cargo",
    hull: { length: 134.6, beam: 17.3, depth: D, draft: 8.5, bow: "raked", stern: "cruiser", section: "round", sheer: [1.2, 2.6], forecastle: [12, 2.4], poop: [10, 2.2], boot: 0.4, screws: 1 },
    livery: { hull: "#6f777b", bottom: "#7a2c26", boot: "#2a2d30", deck: "#6b5a46", house: "#7c8487", funnel: "#6f777b", mast: "#7c8487" },
    items: [
      // the midship house over the boiler room, the bridge on top
      { k: "tier", u: [58, 78], y: [D - 0.1, D + 2.6], hw: 7.6, windows: [{ y: 1.0, h: 0.7, w: 0.6, pitch: 2.2 }], name: "midship house" },
      { k: "tier", u: [63, 77], y: [D + 2.6, D + 5.0], hw: 6.6, windows: [{ y: 0.9, h: 0.7, w: 0.6, pitch: 2 }], name: "boat deck house" },
      { k: "tier", u: [71, 77], y: [D + 5.0, D + 7.4], hw: 5.4, front: { y: 0.8, h: 0.8, w: 0.7, n: 5 }, wings: { hw: 8.4, h: 1.2 }, name: "wheelhouse" },
      funnel([65, 69.5], 1.7, [D + 5.0, D + 13.5], [["funnel", 0.88], ["black", 1]], 0.6),
      { k: "boats", at: [66.5, 74], z: 6.9, y: D + 3.6, len: 7, r: 1.1 },
      { k: "hatches", u: [16, 54], n: 2, hw: 4.5, y: D, h: 1.2, gap: 8 },
      { k: "hatches", u: [82, 122], n: 3, hw: 4.5, y: D, h: 1.2, gap: 6 },
      { k: "derrick", u: 104, y: D, h: 20, boom: 14, dir: 0, pair: true },
      { k: "derrick", u: 86, y: D, h: 18, boom: 13, dir: 0, pair: true },
      { k: "derrick", u: 34, y: D, h: 18, boom: 13, dir: Math.PI, pair: true },
    ],
  };
}

export function victorySpec(): ShipSpec {
  const D = 11.6;
  return {
    kind: "cargo",
    hull: { length: 138.8, beam: 18.9, depth: D, draft: 8.7, bow: "raked", stern: "cruiser", section: "round", rake: 0.05, sheer: [1.0, 2.8], forecastle: [14, 2.4], poop: [8, 2.2], boot: 0.4, screws: 1 },
    livery: { hull: "#5d666b", bottom: "#7a2c26", boot: "#2a2d30", deck: "#6b5a46", house: "#e9e6de", funnel: "#5d666b", mast: "#e9e6de" },
    items: [
      { k: "tier", u: [60, 82], y: [D - 0.1, D + 2.6], hw: 8.2, windows: [{ y: 1.0, h: 0.7, w: 0.6, pitch: 2.2 }], name: "midship house" },
      { k: "tier", u: [64, 81], y: [D + 2.6, D + 5.0], hw: 7, windows: [{ y: 0.9, h: 0.7, w: 0.6, pitch: 2 }], name: "boat deck house" },
      { k: "tier", u: [74, 80.5], y: [D + 5.0, D + 7.6], hw: 5.8, front: { y: 0.8, h: 0.9, w: 0.7, n: 6 }, wings: { hw: 9.2, h: 1.2 }, name: "wheelhouse" },
      funnel([66, 72], 2.2, [D + 5.0, D + 12.5], [["funnel", 0.86], ["black", 1]], 0.9),
      { k: "boats", at: [68, 76], z: 7.4, y: D + 3.6, len: 7, r: 1.1 },
      { k: "hatches", u: [18, 56], n: 2, hw: 4.8, y: D, h: 1.2, gap: 8 },
      { k: "hatches", u: [86, 124], n: 3, hw: 4.8, y: D, h: 1.2, gap: 6 },
      { k: "derrick", u: 112, y: D, h: 16, boom: 13, dir: 0, pair: true },
      { k: "derrick", u: 91, y: D, h: 16, boom: 13, dir: 0, pair: true },
      { k: "derrick", u: 38, y: D, h: 16, boom: 13, dir: Math.PI, pair: true },
      mast(128, D + 2.4, D + 22, 0.3),
      mast(30, D + 0.2, D + 20, 0.3),
    ],
  };
}

// ---------------------------------------------------------------------------
// river and coastal cargo

export const EUROPA_PARAMS: readonly ParamSpec[] = [LOAD_PARAM];
export function europaschiffSpec(p?: ParamValues): ShipSpec {
  const L = 80;
  const D = 2.9;
  return {
    kind: "cargo",
    hull: { length: L, beam: 9.5, depth: D, draft: 2.5, bow: "barge", stern: "transom", section: "flat", entry: 0.07, run: 0.1, transom: 0.8, rake: 0.06, sheer: [0.2, 0.6], boot: 0.15, stripe: 0.2, screws: 1 },
    livery: { hull: "#1d2024", bottom: "#8f2a22", boot: "#1d2024", stripe: "#c23128", deck: "#6b6f6c", house: "#f2f0ea", hatch: "#5a6a72", funnel: "#1d2024" },
    items: [
      { k: "box", u: [12, 74], z: [-4.25, 4.25], y: [D - 0.1, D + 0.9], mat: "hull", name: "hold coaming" },
      ...(loaded(p)
        ? [{ k: "containers", u: [12.4, 73.6], bays: 5, hw: 3.9, y: D + 0.9, tiers: 2, groups: 3, seed: 43 } as Item]
        : [{ k: "hatches", u: [12.4, 73.6], n: 12, hw: 4.1, y: D + 0.9, h: 0.5, gap: 0.15 } as Item]),
      { k: "tier", u: [1.5, 10], y: [D - 0.1, D + 2.4], hw: 4.4, windows: [{ y: 0.9, h: 0.8, w: 0.9, pitch: 1.8 }], name: "accommodation" },
      { k: "tier", u: [6, 10], y: [D + 2.4, D + 4.6], hw: 2.3, front: { y: 0.8, h: 1.1, w: 0.9, n: 3 }, windows: [{ y: 0.8, h: 1.1, w: 1, pitch: 1.4 }], name: "wheelhouse" },
      { k: "cyl", u: 3, z: 3.2, y: [D + 2.4, D + 4.2], r: 0.25, mat: "funnel", name: "exhaust" },
      mast(8, D + 4.6, D + 6.6, 0.08),
    ],
  };
}

export function rhineTankerSpec(): ShipSpec {
  const L = 110;
  const D = 5;
  return {
    kind: "cargo",
    hull: { length: L, beam: 11.45, depth: D, draft: 3.5, bow: "barge", stern: "transom", section: "flat", entry: 0.07, run: 0.1, transom: 0.82, rake: 0.05, sheer: [0.2, 0.6], boot: 0.2, stripe: 0.3, screws: 2 },
    livery: { hull: "#1f3a5a", bottom: "#8f2a22", boot: "#1d2024", stripe: "#e8bf2a", deck: "#c23128", house: "#f2f0ea", funnel: "#1d2024" },
    items: [
      { k: "pipes", u: [14, 104], z: [-1.6, -0.8, 0, 0.8, 1.6], y: D + 0.5, r: 0.14 },
      { k: "box", u: [14, 104], z: [-0.25, 0.25], y: [D, D + 1.3], mat: "steel", name: "catwalk" },
      { k: "domes", u: [18, 100], n: 6, r: 0.6, y: D, h: 0.9, z: 3.5, mat: "steel" },
      { k: "box", u: [55, 59], z: [-5.2, 5.2], y: [D, D + 1], mat: "steel", name: "manifold" },
      { k: "crane", u: 61, z: 3, y: D, h: 2, jib: 7, dir: Math.PI * 0.97, mat: "white", name: "hose crane" },
      { k: "tier", u: [1.5, 12], y: [D - 0.1, D + 2.5], hw: 5.2, windows: [{ y: 0.9, h: 0.8, w: 0.9, pitch: 1.8 }], name: "accommodation" },
      { k: "tier", u: [7, 11.5], y: [D + 2.5, D + 4.8], hw: 2.6, front: { y: 0.8, h: 1.1, w: 1, n: 3 }, windows: [{ y: 0.8, h: 1.1, w: 1, pitch: 1.4 }], name: "wheelhouse" },
      { k: "cyl", u: 3, z: 3.6, y: [D + 2.5, D + 4.4], r: 0.28, mat: "funnel", name: "exhaust" },
      { k: "box", u: [L - 6, L - 2], z: [-4, 4], y: [D, D + 1.8], mat: "house", name: "fore cabin" },
    ],
  };
}

export const PUSH_BARGE_PARAMS: readonly ParamSpec[] = [LOAD_PARAM];
export function pushBargeSpec(p?: ParamValues): ShipSpec {
  const L = 76.5;
  const D = 4;
  return {
    kind: "cargo",
    hull: { length: L, beam: 11.4, depth: D, draft: loaded(p) ? 3.5 : 0.7, bow: "barge", stern: "sternwheel", section: "flat", entry: 0.07, run: 0.04, transom: 0.96, rake: 0.06, boot: 0.15, rudder: false },
    livery: { hull: "#2b2f33", bottom: "#8f2a22", boot: "#1d2024", deck: "#5f6466", hatch: "#3b3f43", black: "#1b1c1d" },
    items: [
      { k: "box", u: [4, 72], z: [-5.3, 5.3], y: [D - 0.1, D + 1], mat: "hull", top: false, name: "hold coaming" },
      ...cargo(p, [
        { k: "box", u: [6, 70], z: [-4.8, 4.8], y: [D + 0.4, D + 1.4], mat: "black", name: "coal" },
        { k: "box", u: [12, 64], z: [-3.6, 3.6], y: [D + 1.4, D + 2.2], mat: "black", name: "coal heap" },
      ]),
      { k: "box", u: [1, 3], z: [-5, 5], y: [D, D + 0.5], mat: "steel", name: "coupling" },
    ],
  };
}

export const YANGTZE_PARAMS: readonly ParamSpec[] = [LOAD_PARAM];
export function yangtzeSpec(p?: ParamValues): ShipSpec {
  const L = 90;
  const D = 4.5;
  return {
    kind: "cargo",
    hull: { length: L, beam: 15.8, depth: D, draft: 3.5, bow: "raked", stern: "transom", section: "flat", entry: 0.14, run: 0.1, transom: 0.8, rake: 0.05, sheer: [0.3, 1.2], boot: 0.3, stripe: 0.3, screws: 2 },
    livery: { hull: "#2a3b5f", bottom: "#8f2a22", boot: "#1d2024", stripe: "#c23128", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#2a3b5f" },
    items: [
      { k: "box", u: [14, 82], z: [-7.2, 7.2], y: [D - 0.1, D + 1.2], mat: "hull", top: false, name: "hold coaming" },
      ...cargo(p, [{ k: "containers", u: [14.5, 81.5], bays: 5, hw: 6.6, y: D + 0.4, tiers: 3, groups: 5, seed: 47 }]),
      ...deckhouse({ u: [1, 12], y0: D - 0.1, decks: 3, hw: 7, h: 2.6, step: 0.3, wings: 7.6 }),
      { k: "cyl", u: 2.5, z: 4.5, y: [D + 5.2, D + 9], r: 0.4, mat: "funnel", name: "exhaust" },
      mast(8, D + 7.7, D + 11, 0.1),
    ],
  };
}

export function volgaDonSpec(): ShipSpec {
  const L = 138.3;
  const D = 5.5;
  return {
    kind: "cargo",
    hull: { length: L, beam: 16.5, depth: D, draft: 3.5, bow: "raked", stern: "transom", section: "flat", entry: 0.12, run: 0.1, transom: 0.8, rake: 0.04, sheer: [0.3, 1.4], forecastle: [10, 1.8], boot: 0.3, screws: 2 },
    livery: { hull: "#25303a", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#7d4a3a", house: "#f2f0ea", funnel: "#c23128", hatch: "#6c6f72" },
    items: [
      { k: "hatches", u: [16, 126], n: 4, hw: 6.8, y: D, h: 1.8, gap: 2.2 },
      ...deckhouse({ u: [2, 14], y0: D - 0.1, decks: 3, hw: 7.4, h: 2.6, step: 0.3, wings: 8.1 }),
      funnel([3, 6], 1.3, [D + 5, D + 9.5], [["funnel", 0.8], ["black", 1]], 0.3),
      mast(10, D + 7.7, D + 12, 0.12),
      mast(L - 6, D + 1.8, D + 9, 0.15),
    ],
  };
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names (jsModel.ts imports a design's builders by name)

export function shipTripleE(p?: ParamValues): MeshBuilder { return worldShip(tripleESpec(p)); }
export function shipTripleELod(p?: ParamValues): MeshBuilder { return shipLod(tripleESpec(p)); }
export function shipEmmaMaersk(p?: ParamValues): MeshBuilder { return worldShip(emmaMaerskSpec(p)); }
export function shipEmmaMaerskLod(p?: ParamValues): MeshBuilder { return shipLod(emmaMaerskSpec(p)); }
export function shipMscGulsun(p?: ParamValues): MeshBuilder { return worldShip(gulsunSpec(p)); }
export function shipMscGulsunLod(p?: ParamValues): MeshBuilder { return shipLod(gulsunSpec(p)); }
export function shipPanamax(p?: ParamValues): MeshBuilder { return worldShip(panamaxSpec(p)); }
export function shipPanamaxLod(p?: ParamValues): MeshBuilder { return shipLod(panamaxSpec(p)); }
export function shipFeeder(p?: ParamValues): MeshBuilder { return worldShip(feederSpec(p)); }
export function shipFeederLod(p?: ParamValues): MeshBuilder { return shipLod(feederSpec(p)); }
export function shipIdealX(): MeshBuilder { return worldShip(idealXSpec()); }
export function shipIdealXLod(): MeshBuilder { return shipLod(idealXSpec()); }
export function shipVlcc(p?: ParamValues): MeshBuilder { return worldShip(vlccSpec(p)); }
export function shipVlccLod(p?: ParamValues): MeshBuilder { return shipLod(vlccSpec(p)); }
export function shipSeawiseGiant(): MeshBuilder { return worldShip(seawiseGiantSpec()); }
export function shipSeawiseGiantLod(): MeshBuilder { return shipLod(seawiseGiantSpec()); }
export function shipAframax(p?: ParamValues): MeshBuilder { return worldShip(aframaxSpec(p)); }
export function shipAframaxLod(p?: ParamValues): MeshBuilder { return shipLod(aframaxSpec(p)); }
export function shipProductTanker(p?: ParamValues): MeshBuilder { return worldShip(productTankerSpec(p)); }
export function shipProductTankerLod(p?: ParamValues): MeshBuilder { return shipLod(productTankerSpec(p)); }
export function shipLngMoss(): MeshBuilder { return worldShip(lngMossSpec()); }
export function shipLngMossLod(): MeshBuilder { return shipLod(lngMossSpec()); }
export function shipQmax(): MeshBuilder { return worldShip(qmaxSpec()); }
export function shipQmaxLod(): MeshBuilder { return shipLod(qmaxSpec()); }
export function shipLpg(): MeshBuilder { return worldShip(lpgSpec()); }
export function shipLpgLod(): MeshBuilder { return shipLod(lpgSpec()); }
export function shipChemicalTanker(p?: ParamValues): MeshBuilder { return worldShip(chemicalTankerSpec(p)); }
export function shipChemicalTankerLod(p?: ParamValues): MeshBuilder { return shipLod(chemicalTankerSpec(p)); }
export function shipCapesize(p?: ParamValues): MeshBuilder { return worldShip(capesizeSpec(p)); }
export function shipCapesizeLod(p?: ParamValues): MeshBuilder { return shipLod(capesizeSpec(p)); }
export function shipValemax(): MeshBuilder { return worldShip(valemaxSpec()); }
export function shipValemaxLod(): MeshBuilder { return shipLod(valemaxSpec()); }
export function shipHandysize(p?: ParamValues): MeshBuilder { return worldShip(handysizeSpec(p)); }
export function shipHandysizeLod(p?: ParamValues): MeshBuilder { return shipLod(handysizeSpec(p)); }
export function shipLaker(p?: ParamValues): MeshBuilder { return worldShip(lakerSpec(p)); }
export function shipLakerLod(p?: ParamValues): MeshBuilder { return shipLod(lakerSpec(p)); }
export function shipSelfUnloader(): MeshBuilder { return worldShip(selfUnloaderSpec()); }
export function shipSelfUnloaderLod(): MeshBuilder { return shipLod(selfUnloaderSpec()); }
export function shipPctc(p?: ParamValues): MeshBuilder { return worldShip(pctcSpec(p)); }
export function shipPctcLod(p?: ParamValues): MeshBuilder { return shipLod(pctcSpec(p)); }
export function shipRoro(p?: ParamValues): MeshBuilder { return worldShip(roroSpec(p)); }
export function shipRoroLod(p?: ParamValues): MeshBuilder { return shipLod(roroSpec(p)); }
export function shipHeavyLift(p?: ParamValues): MeshBuilder { return worldShip(heavyLiftSpec(p)); }
export function shipHeavyLiftLod(p?: ParamValues): MeshBuilder { return shipLod(heavyLiftSpec(p)); }
export function shipReefer(p?: ParamValues): MeshBuilder { return worldShip(reeferSpec(p)); }
export function shipReeferLod(p?: ParamValues): MeshBuilder { return shipLod(reeferSpec(p)); }
export function shipLiberty(): MeshBuilder { return worldShip(libertySpec()); }
export function shipLibertyLod(): MeshBuilder { return shipLod(libertySpec()); }
export function shipVictory(): MeshBuilder { return worldShip(victorySpec()); }
export function shipVictoryLod(): MeshBuilder { return shipLod(victorySpec()); }
export function shipEuropaschiff(p?: ParamValues): MeshBuilder { return worldShip(europaschiffSpec(p)); }
export function shipEuropaschiffLod(p?: ParamValues): MeshBuilder { return shipLod(europaschiffSpec(p)); }
export function shipRhineTanker(): MeshBuilder { return worldShip(rhineTankerSpec()); }
export function shipRhineTankerLod(): MeshBuilder { return shipLod(rhineTankerSpec()); }
export function shipPushBarge(p?: ParamValues): MeshBuilder { return worldShip(pushBargeSpec(p)); }
export function shipPushBargeLod(p?: ParamValues): MeshBuilder { return shipLod(pushBargeSpec(p)); }
export function shipYangtze(p?: ParamValues): MeshBuilder { return worldShip(yangtzeSpec(p)); }
export function shipYangtzeLod(p?: ParamValues): MeshBuilder { return shipLod(yangtzeSpec(p)); }
export function shipVolgaDon(): MeshBuilder { return worldShip(volgaDonSpec()); }
export function shipVolgaDonLod(): MeshBuilder { return shipLod(volgaDonSpec()); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md)

export const CARGO_SHIP_SPECS: readonly WorldShip[] = [
  { id: "veh-ship-triple-e", title: "Maersk Triple E Class", spec: tripleESpec, build: shipTripleE, buildLod: shipTripleELod, params: [LOAD_PARAM], game: { weight: 250_000, power: 59_360, maxspeed: 43 }, references: "ship-triple-e" },
  { id: "veh-ship-emma-maersk", title: "Emma Maersk", spec: emmaMaerskSpec, build: shipEmmaMaersk, buildLod: shipEmmaMaerskLod, params: [LOAD_PARAM], game: { weight: 220_000, power: 80_080, maxspeed: 46 }, references: "ship-emma-maersk" },
  { id: "veh-ship-msc-gulsun", title: "MSC Gulsun Class", spec: gulsunSpec, build: shipMscGulsun, buildLod: shipMscGulsunLod, params: [LOAD_PARAM], game: { weight: 260_000, power: 62_500, maxspeed: 42 }, references: "ship-msc-gulsun" },
  { id: "veh-ship-panamax-container", title: "Panamax Container Ship", spec: panamaxSpec, build: shipPanamax, buildLod: shipPanamaxLod, params: PANAMAX_PARAMS, finishParams: ["livery"], game: { weight: 80_000, power: 40_000, maxspeed: 44 }, references: "ship-panamax-container" },
  { id: "veh-ship-feeder-container", title: "Feeder Container Ship", spec: feederSpec, build: shipFeeder, buildLod: shipFeederLod, params: [LOAD_PARAM], game: { weight: 17_000, power: 8_400, maxspeed: 33 }, references: "ship-feeder-container" },
  { id: "veh-ship-ideal-x", title: "Ideal X", spec: idealXSpec, build: shipIdealX, buildLod: shipIdealXLod, game: { weight: 22_000, power: 4_500, maxspeed: 27 }, references: "ship-ideal-x" },
  { id: "veh-ship-vlcc", title: "Very Large Crude Carrier", spec: vlccSpec, build: shipVlcc, buildLod: shipVlccLod, params: VLCC_PARAMS, finishParams: ["livery"], game: { weight: 340_000, power: 27_000, maxspeed: 28 }, references: "ship-vlcc" },
  { id: "veh-ship-seawise-giant", title: "Seawise Giant", spec: seawiseGiantSpec, build: shipSeawiseGiant, buildLod: shipSeawiseGiantLod, game: { weight: 657_000, power: 37_300, maxspeed: 24 }, references: "ship-seawise-giant" },
  { id: "veh-ship-aframax", title: "Aframax Tanker", spec: aframaxSpec, build: shipAframax, buildLod: shipAframaxLod, params: AFRAMAX_PARAMS, finishParams: ["livery"], game: { weight: 135_000, power: 15_000, maxspeed: 28 }, references: "ship-aframax" },
  { id: "veh-ship-product-tanker", title: "Product Tanker", spec: productTankerSpec, build: shipProductTanker, buildLod: shipProductTankerLod, params: PRODUCT_PARAMS, finishParams: ["livery"], game: { weight: 60_000, power: 9_500, maxspeed: 27 }, references: "ship-product-tanker" },
  { id: "veh-ship-lng-moss", title: "Moss LNG Carrier", spec: lngMossSpec, build: shipLngMoss, buildLod: shipLngMossLod, game: { weight: 100_000, power: 29_000, maxspeed: 35 }, references: "ship-lng-moss" },
  { id: "veh-ship-lng-qmax", title: "Q-Max LNG Carrier", spec: qmaxSpec, build: shipQmax, buildLod: shipQmaxLod, game: { weight: 170_000, power: 37_000, maxspeed: 36 }, references: "ship-lng-qmax" },
  { id: "veh-ship-lpg-carrier", title: "LPG Carrier", spec: lpgSpec, build: shipLpg, buildLod: shipLpgLod, game: { weight: 11_000, power: 4_500, maxspeed: 28 }, references: "ship-lpg-carrier" },
  { id: "veh-ship-chemical-tanker", title: "Chemical Tanker", spec: chemicalTankerSpec, build: shipChemicalTanker, buildLod: shipChemicalTankerLod, params: CHEMICAL_PARAMS, finishParams: ["livery"], game: { weight: 58_000, power: 9_000, maxspeed: 27 }, references: "ship-chemical-tanker" },
  { id: "veh-ship-capesize", title: "Capesize Bulk Carrier", spec: capesizeSpec, build: shipCapesize, buildLod: shipCapesizeLod, params: CAPESIZE_PARAMS, finishParams: ["livery"], game: { weight: 205_000, power: 16_000, maxspeed: 27 }, references: "ship-capesize" },
  { id: "veh-ship-valemax", title: "Valemax Ore Carrier", spec: valemaxSpec, build: shipValemax, buildLod: shipValemaxLod, game: { weight: 450_000, power: 29_400, maxspeed: 27 }, references: "ship-valemax" },
  { id: "veh-ship-handysize", title: "Handysize Bulk Carrier", spec: handysizeSpec, build: shipHandysize, buildLod: shipHandysizeLod, params: HANDYSIZE_PARAMS, finishParams: ["livery"], game: { weight: 45_000, power: 7_000, maxspeed: 26 }, references: "ship-handysize" },
  { id: "veh-ship-laker", title: "Great Lakes Freighter", spec: lakerSpec, build: shipLaker, buildLod: shipLakerLod, params: LAKER_PARAMS, finishParams: ["livery"], game: { weight: 35_000, power: 5_600, maxspeed: 26 }, references: "ship-laker" },
  { id: "veh-ship-self-unloader", title: "Self-Unloading Laker", spec: selfUnloaderSpec, build: shipSelfUnloader, buildLod: shipSelfUnloaderLod, game: { weight: 90_000, power: 14_000, maxspeed: 26 }, references: "ship-self-unloader" },
  { id: "veh-ship-pctc", title: "Pure Car and Truck Carrier", spec: pctcSpec, build: shipPctc, buildLod: shipPctcLod, params: PCTC_PARAMS, finishParams: ["livery"], game: { weight: 42_000, power: 14_000, maxspeed: 37 }, references: "ship-pctc" },
  { id: "veh-ship-roro", title: "Ro-Ro Cargo Ship", spec: roroSpec, build: shipRoro, buildLod: shipRoroLod, params: RORO_PARAMS, finishParams: ["livery"], game: { weight: 25_000, power: 16_000, maxspeed: 37 }, references: "ship-roro" },
  { id: "veh-ship-heavy-lift", title: "Semi-Submersible Heavy-Lift Ship", spec: heavyLiftSpec, build: shipHeavyLift, buildLod: shipHeavyLiftLod, params: HEAVY_LIFT_PARAMS, game: { weight: 160_000, power: 27_000, maxspeed: 26 }, references: "ship-heavy-lift" },
  { id: "veh-ship-reefer", title: "Refrigerated Cargo Ship", spec: reeferSpec, build: shipReefer, buildLod: shipReeferLod, params: REEFER_PARAMS, finishParams: ["livery"], game: { weight: 20_000, power: 12_000, maxspeed: 39 }, references: "ship-reefer" },
  { id: "veh-ship-liberty", title: "Liberty Ship", spec: libertySpec, build: shipLiberty, buildLod: shipLibertyLod, game: { weight: 14_245, power: 1_900, maxspeed: 20 }, references: "ship-liberty" },
  { id: "veh-ship-victory", title: "Victory Ship", spec: victorySpec, build: shipVictory, buildLod: shipVictoryLod, game: { weight: 15_200, power: 6_300, maxspeed: 28 }, references: "ship-victory" },
  { id: "veh-ship-europaschiff", title: "Rhine Motor Cargo Vessel", spec: europaschiffSpec, build: shipEuropaschiff, buildLod: shipEuropaschiffLod, params: EUROPA_PARAMS, game: { weight: 1_650, power: 600, maxspeed: 18 }, references: "ship-europaschiff" },
  { id: "veh-ship-rhine-tanker", title: "Rhine Tanker Barge", spec: rhineTankerSpec, build: shipRhineTanker, buildLod: shipRhineTankerLod, game: { weight: 3_900, power: 1_500, maxspeed: 20 }, references: "ship-rhine-tanker" },
  { id: "veh-ship-push-barge", title: "Push Barge", spec: pushBargeSpec, build: shipPushBarge, buildLod: shipPushBargeLod, params: PUSH_BARGE_PARAMS, game: { weight: 3_000, power: 0, maxspeed: 15 }, references: "ship-push-barge" },
  { id: "veh-ship-yangtze-cargo", title: "Yangtze River Cargo Ship", spec: yangtzeSpec, build: shipYangtze, buildLod: shipYangtzeLod, params: YANGTZE_PARAMS, game: { weight: 4_200, power: 1_200, maxspeed: 18 }, references: "ship-yangtze-cargo" },
  { id: "veh-ship-volga-don", title: "Volga-Don River Ship", spec: volgaDonSpec, build: shipVolgaDon, buildLod: shipVolgaDonLod, game: { weight: 6_500, power: 1_320, maxspeed: 19 }, references: "ship-volga-don" },
];

export const CARGO_SHIPS = /* @__PURE__ */ shipDesigns(CARGO_SHIP_SPECS);
