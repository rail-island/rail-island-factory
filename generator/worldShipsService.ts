// The world's service ships (docs/models/world-ships-service.md): tugs and a
// towboat, fishing vessels, icebreakers and research ships, a dredger, offshore
// supply, anchor-handling, crane and drilling vessels, a cable layer, a fireboat,
// a lifeboat and a pilot boat, each a ShipSpec on the hull kit (hullKit.ts) at its
// real size, modelled on the photographs in assets/<references>/ and the
// published figures in each folder's SOURCES.md. Metres from the stern (u),
// heights from the keel. The ids are stored in the game's saved maps: never
// rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { shipLod, worldShip, type Item, type ShipSpec } from "./hullKit.ts";
import { colourParam, deckhouse, funnel, liveryParam, mast, pick, shipDesigns, type WorldShip } from "./worldShips.ts";

/** A rod between two points (u, y, z). */
const rod = (a: [number, number, number], b: [number, number, number], r: number, mat: string, name?: string): Item => ({ k: "rod", a, b, r, mat, ...(name ? { name } : {}) });

// ---------------------------------------------------------------------------
// tugs and the towboat

export const OCEAN_TUG_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["black", "Black"], ["red", "Red"], ["blue", "Blue"])];
export function oceanTugSpec(p?: ParamValues): ShipSpec {
  const L = 80;
  const D = 8;
  const liv = pick(OCEAN_TUG_PARAMS, p, "livery");
  const side = liv === "red" ? "#a8302a" : liv === "blue" ? "#23426e" : "#1d2024";
  return {
    kind: "service",
    hull: { length: L, beam: 18, depth: D, draft: 6.5, bow: "bulbous", stern: "transom", section: "round", entry: 0.3, run: 0.25, transom: 0.8, sheer: [0.2, 2.4], forecastle: [34, 2.6], boot: 0.4, stripe: 0.4, screws: 2, bulb: 0.12 },
    livery: { hull: side, bottom: "#8f2a22", stripe: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: side },
    items: [
      ...deckhouse({ u: [50, 64], y0: D + 2.4, decks: 4, hw: 7.6, h: 2.8, step: 0.6, wings: 9 }),
      mast(60, D + 2.4 + 4 * 2.8, D + 22, 0.25),
      funnel([44, 49], 1.8, [D + 2.4, D + 12], [["funnel", 0.85], ["black", 1]], 0.5, 3.2),
      funnel([44, 49], 1.8, [D + 2.4, D + 12], [["funnel", 0.85], ["black", 1]], 0.5, -3.2),
      { k: "box", u: [30, 40], z: [-5, 5], y: [D, D + 3.4], mat: "steel", name: "towing winch" },
      { k: "gantry", u: 14, hw: 6, y: D, h: 3.2, t: 0.6, mat: "steel", name: "towing staple" },
      { k: "cyl", u: 2, z: 0, y: [D - 0.3, D + 1.2], r: 1.0, mat: "steel", name: "stern roller" },
      { k: "crane", u: 26, z: -6.5, y: D, h: 3, jib: 12, dir: Math.PI, mat: "orange" },
    ],
  };
}

export const HARBOUR_TUG_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["red", "Red"], ["black", "Black"], ["green", "Green"])];
export function harbourTugSpec(p?: ParamValues): ShipSpec {
  const L = 32;
  const D = 5.4;
  const liv = pick(HARBOUR_TUG_PARAMS, p, "livery");
  const side = liv === "black" ? "#1d2024" : liv === "green" ? "#2f6a45" : "#b02a22";
  return {
    kind: "service",
    hull: { length: L, beam: 12.8, depth: D, draft: 3.6, bow: "raked", stern: "transom", section: "round", entry: 0.42, run: 0.3, transom: 0.8, rake: 0.05, sheer: [0.3, 1.6], boot: 0.3, stripe: 0.6, screws: 2 },
    livery: { hull: side, stripe: "#1b1c1d", bottom: "#8f2a22", deck: "#6f7a77", house: "#f2f0ea", funnel: side },
    items: [
      // the fender band round the sheer, the bow fender
      { k: "box", u: [L - 2.2, L - 0.4], z: [-2.2, 2.2], y: [D - 1.6, D + 0.6], mat: "skirt", name: "bow fender" },
      { k: "box", u: [0.3, 1.6], z: [-4, 4], y: [D - 1.2, D + 0.2], mat: "skirt", name: "stern fender" },
      { k: "tier", u: [12, 22], y: [D - 0.1, D + 2.4], hw: 4.6, windows: [{ y: 0.9, h: 0.8, w: 0.8, pitch: 1.6 }], name: "deckhouse" },
      { k: "tier", u: [14.5, 21], y: [D + 2.4, D + 5.2], hw: 3.8, front: { y: 0.8, h: 1.4, w: 1.1, n: 5 }, windows: [{ y: 0.8, h: 1.4, w: 1.2, pitch: 1.5 }], name: "wheelhouse" },
      mast(18, D + 5.2, D + 10, 0.12),
      funnel([12.4, 14], 0.6, [D + 2.4, D + 6.5], [["funnel", 0.8], ["black", 1]], 0.2, 2.5),
      funnel([12.4, 14], 0.6, [D + 2.4, D + 6.5], [["funnel", 0.8], ["black", 1]], 0.2, -2.5),
      { k: "box", u: [24, 27], z: [-2, 2], y: [D, D + 1.6], mat: "steel", name: "towing winch" },
      { k: "cyl", u: 6, z: 0, y: [D, D + 1.4], r: 0.5, mat: "steel", name: "towing hook" },
    ],
  };
}

export function towboatSpec(): ShipSpec {
  const L = 60;
  const D = 3.4;
  return {
    kind: "service",
    hull: { length: L, beam: 16, depth: D, draft: 2.7, bow: "barge", stern: "transom", section: "flat", entry: 0.04, run: 0.12, transom: 0.85, rake: 0.03, boot: 0.2, stripe: 0.3, screws: 2 },
    livery: { hull: "#1d2024", bottom: "#8f2a22", stripe: "#c23128", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#1d2024", yellow: "#e8bf2a" },
    items: [
      // the push knees on the square bow
      { k: "plate", pts: [[L - 0.6, D], [L + 0.2, D], [L + 0.2, D + 5.5], [L - 0.6, D + 5.5]], z: 5.4, t: 0.5, mat: "yellow", name: "starboard push knee" },
      { k: "plate", pts: [[L - 0.6, D], [L + 0.2, D], [L + 0.2, D + 5.5], [L - 0.6, D + 5.5]], z: -5.4, t: 0.5, mat: "yellow", name: "port push knee" },
      ...deckhouse({ u: [14, 44], y0: D - 0.1, decks: 3, hw: 7.2, h: 2.7, step: 1.2 }),
      { k: "tier", u: [32, 42], y: [D - 0.1 + 3 * 2.7, D + 3 * 2.7 + 3.2], hw: 4.6, front: { y: 0.9, h: 1.6, w: 1.2, n: 6 }, windows: [{ y: 0.9, h: 1.6, w: 1.3, pitch: 1.7 }], name: "pilothouse" },
      { k: "cyl", u: 22, z: 3, y: [D + 3 * 2.7, D + 3 * 2.7 + 4.5], r: 0.55, mat: "funnel", name: "starboard stack" },
      { k: "cyl", u: 22, z: -3, y: [D + 3 * 2.7, D + 3 * 2.7 + 4.5], r: 0.55, mat: "funnel", name: "port stack" },
      mast(39, D + 3 * 2.7 + 3.1, D + 17, 0.12),
      { k: "box", u: [46, 56], z: [-6, 6], y: [D, D + 1.2], mat: "steel", name: "winches" },
    ],
  };
}

// ---------------------------------------------------------------------------
// fishing vessels

export const STERN_TRAWLER_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["red", "Red"], ["blue", "Blue"], ["green", "Green"])];
export function sternTrawlerSpec(p?: ParamValues): ShipSpec {
  const L = 70;
  const D = 9;
  const liv = pick(STERN_TRAWLER_PARAMS, p, "livery");
  const side = liv === "blue" ? "#23426e" : liv === "green" ? "#2f6a45" : "#b02a22";
  return {
    kind: "service",
    hull: { length: L, beam: 15, depth: D, draft: 6.5, bow: "bulbous", stern: "transom", section: "round", entry: 0.3, run: 0.2, transom: 0.85, sheer: [0, 2], forecastle: [24, 2.6], boot: 0.4, stripe: 0, screws: 1, bulb: 0.14 },
    livery: { hull: side, bottom: "#1d2024", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: side },
    items: [
      ...deckhouse({ u: [46, 60], y0: D + 2.4, decks: 3, hw: 6.4, h: 2.8, wings: 7.4 }),
      mast(56, D + 2.4 + 3 * 2.8, D + 18, 0.2),
      funnel([40, 45], 1.6, [D + 2.4, D + 11], [["funnel", 0.85], ["black", 1]], 0.4),
      // the stern ramp, the trawl gantry over it, the net drums
      { k: "plate", pts: [[0.2, 2], [0.2, D], [10, D], [10, D - 0.4]], z: 0, t: 5, mat: "steel", name: "stern ramp" },
      { k: "gantry", u: 4, hw: 5.6, y: D, h: 8, t: 0.6, mat: "orange", name: "trawl gantry" },
      { k: "gantry", u: 30, hw: 4, y: D + 2.6, h: 6, t: 0.4, mat: "orange", name: "forward gantry" },
      { k: "cyl", u: 18, z: 3.5, y: [D, D + 3], r: 1.4, mat: "grey", name: "net drum" },
      { k: "cyl", u: 18, z: -3.5, y: [D, D + 3], r: 1.4, mat: "grey", name: "net drum aft" },
    ],
  };
}

export function purseSeinerSpec(): ShipSpec {
  const L = 80;
  const D = 7.5;
  return {
    kind: "service",
    hull: { length: L, beam: 14, depth: D, draft: 6, bow: "raked", stern: "transom", section: "round", entry: 0.32, run: 0.2, transom: 0.8, sheer: [0.2, 2.6], forecastle: [30, 2.4], boot: 0.3, screws: 1 },
    livery: { hull: "#f2f0ea", bottom: "#8f2a22", boot: "#23426e", deck: "#6f7a77", house: "#f2f0ea", funnel: "#23426e", boat: "#d9681e" },
    items: [
      ...deckhouse({ u: [46, 62], y0: D + 2.3, decks: 3, hw: 6, h: 2.8, wings: 7 }),
      // the tuna tower with its crow's nest
      { k: "mast", u: 56, y: [D + 2.3 + 3 * 2.8, D + 26], r: 0.25, yards: [[D + 21, 1.2]] },
      { k: "box", u: [55, 57], z: [-1, 1], y: [D + 21, D + 22.4], mat: "white", name: "crow's nest" },
      funnel([42, 46], 1.4, [D + 2.3, D + 10], [["funnel", 0.85], ["black", 1]], 0.4),
      // the power block on its boom, the net pile, the skiff on the ramp
      rod([40, D + 2.3, 4], [26, D + 16, 3], 0.3, "yellow", "power block boom"),
      { k: "box", u: [10, 28], z: [-5, 5], y: [D, D + 1.6], mat: "black", name: "net pile" },
      { k: "boats", at: [4.5], z: 0, y: D + 1.8, len: 9, r: 1.6, mat: "boat", name: "skiff" },
      mast(70, D + 2.4, D + 12, 0.2),
    ],
  };
}

export function shrimpTrawlerSpec(): ShipSpec {
  const L = 23;
  const D = 3.2;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 7, depth: D, draft: 2.7, bow: "raked", stern: "transom", section: "vee", entry: 0.4, run: 0.25, transom: 0.8, rake: 0.08, sheer: [0.3, 1.4], boot: 0.15, stripe: 0, screws: 1 },
    livery: { hull: "#f2f0ea", bottom: "#8f2a22", boot: "#1d2024", deck: "#7d6a55", house: "#f2f0ea", mast: "#d8d6cf" },
    items: [
      { k: "tier", u: [13, 19], y: [D - 0.1, D + 2.4], hw: 2.8, front: { y: 1.1, h: 0.9, w: 0.9, n: 3 }, windows: [{ y: 1.1, h: 0.8, w: 0.8, pitch: 1.4 }], name: "wheelhouse" },
      { k: "cyl", u: 9, z: 0, y: [D, D + 11], r: 0.18, mat: "mast", name: "mast" },
      // the outrigger booms, lowered to fish, their nets' doors hanging from the tips
      rod([9, D + 1.5, 0.3], [9, D + 5.5, 10.5], 0.12, "mast", "starboard outrigger"),
      rod([9, D + 1.5, -0.3], [9, D + 5.5, -10.5], 0.12, "mast", "port outrigger"),
      rod([9, D + 10.5, 0], [9, D + 5.5, 10.5], 0.04, "rope", "starboard stay"),
      rod([9, D + 10.5, 0], [9, D + 5.5, -10.5], 0.04, "rope", "port stay"),
      { k: "box", u: [8, 10], z: [9.8, 10.2], y: [D + 1, D + 2.2], mat: "wood", name: "starboard door" },
      { k: "box", u: [8, 10], z: [-10.2, -9.8], y: [D + 1, D + 2.2], mat: "wood", name: "port door" },
      rod([2, D, 0], [9, D + 9, 0], 0.1, "mast", "boom"),
    ],
  };
}

export const LOBSTER_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["white", "White"], ["green", "Green"], ["blue", "Blue"], ["red", "Red"], ["yellow", "Yellow"])];
const BOAT_COLOURS: Record<string, string> = { white: "#f2f0ea", green: "#2f6a45", blue: "#23426e", red: "#b02a22", yellow: "#e8bf2a", black: "#1d2024", orange: "#d9681e" };
export function lobsterBoatSpec(p?: ParamValues): ShipSpec {
  const L = 12;
  const D = 1.8;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 4.2, depth: D, draft: 1.1, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.2, transom: 0.85, rake: 0.08, sheer: [0.1, 0.8], boot: 0.12, stripe: 0.15, screws: 1 },
    livery: { hull: BOAT_COLOURS[pick(LOBSTER_PARAMS, p, "colour")]!, bottom: "#8f2a22", stripe: "#1d2024", deck: "#d6d0c2", house: "#f2f0ea" },
    items: [
      { k: "tier", u: [6.5, 9.2], y: [D - 0.1, D + 1.9], hw: 1.7, front: { y: 0.9, h: 0.8, w: 0.9, n: 3 }, windows: [{ y: 0.9, h: 0.7, w: 0.7, pitch: 1.1 }], name: "wheelhouse" },
      { k: "box", u: [3, 6.5], z: [-1.7, 1.7], y: [D + 1.7, D + 1.8], mat: "house", name: "hardtop" },
      ...[3.2, 6.3].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "cyl", u, z: sd * 1.6, y: [D, D + 1.7], r: 0.04, mat: "steel", name: `hardtop post ${u} ${sd}` }))),
      { k: "box", u: [1, 2.6], z: [-1.4, -0.4], y: [D, D + 0.8], mat: "yellow", name: "lobster traps" },
      { k: "box", u: [0.6, 2.4], z: [0.4, 1.5], y: [D, D + 0.8], mat: "orange", name: "lobster traps aft" },
      { k: "cyl", u: 8, z: 0, y: [D + 1.9, D + 3.4], r: 0.05, mat: "steel", name: "radar mast" },
      { k: "box", u: [7.6, 8.4], z: [-0.5, 0.5], y: [D + 3.4, D + 3.6], mat: "black", name: "radar" },
    ],
  };
}

// ---------------------------------------------------------------------------
// icebreakers and research ships

export function arktikaSpec(): ShipSpec {
  const L = 159.6;
  const D = 17.2;
  return {
    kind: "service",
    hull: { length: L, beam: 30, depth: D, draft: 11, bow: "ice", stern: "transom", section: "round", entry: 0.3, run: 0.2, transom: 0.7, sheer: [0, 2], boot: 1.6, stripe: 0, screws: 2 },
    livery: { hull: "#1d2024", bottom: "#b02a22", boot: "#b02a22", deck: "#6f7a77", house: "#f2f0ea", funnel: "#d9681e", orange: "#d9681e" },
    items: [
      // the long superstructure forward of midships, the bridge on top
      { k: "tier", u: [40, 112], y: [D - 0.2, D + 5.6], hw: 13.6, round: [0, 3], windows: [{ y: 1.4, h: 1, w: 0.9, pitch: 2.6 }, { y: 4.2, h: 0.9, w: 0.9, pitch: 2.6 }], name: "accommodation" },
      ...deckhouse({ u: [86, 110], y0: D + 5.6, decks: 4, hw: 11, h: 2.8, wings: 14.6 }),
      mast(100, D + 5.6 + 4 * 2.8, D + 30, 0.3),
      // the reactors' ventilation stack aft of the house
      funnel([56, 66], 3.4, [D + 5.6, D + 17], [["orange", 0.8], ["black", 1]], 0.4),
      { k: "helideck", u: 24, y: D + 5.6, r: 10, legs: 4 },
      { k: "tier", u: [16, 36], y: [D - 0.2, D + 5.6], hw: 9, name: "hangar" },
      { k: "crane", u: 118, z: 8, y: D, h: 4, jib: 14, dir: Math.PI * 0.95, mat: "orange" },
    ],
  };
}

export function polarsternSpec(): ShipSpec {
  const L = 118;
  const D = 13.6;
  return {
    kind: "service",
    hull: { length: L, beam: 25, depth: D, draft: 11.2, bow: "ice", stern: "transom", section: "round", entry: 0.3, run: 0.22, transom: 0.75, sheer: [0, 2], forecastle: [40, 2.6], boot: 0.4, stripe: 0, screws: 2 },
    livery: { hull: "#b02a22", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: "#f2f0ea", crane: "#e8bf2a" },
    items: [
      { k: "tier", u: [58, 96], y: [D + 2.4, D + 5.4], hw: 11, windows: [{ y: 1.1, h: 0.9, w: 0.9, pitch: 2.4 }], name: "accommodation 1" },
      ...deckhouse({ u: [72, 94], y0: D + 5.4, decks: 3, hw: 10, h: 2.8, wings: 12.4 }),
      { k: "helideck", u: 78, y: D + 5.4 + 3 * 2.8 + 0.1, r: 8 },
      mast(90, D + 5.4 + 3 * 2.8, D + 27, 0.3),
      funnel([60, 68], 2.4, [D + 5.4, D + 15], [["funnel", 0.6], ["red", 0.85], ["black", 1]], 0.3),
      { k: "crane", u: 40, z: 7, y: D, h: 5, jib: 18, dir: Math.PI * 0.95 },
      { k: "crane", u: 40, z: -7, y: D, h: 5, jib: 18, dir: -Math.PI * 0.95 },
      { k: "gantry", u: 3, hw: 6, y: D, h: 9, t: 0.7, lean: 1.5, mat: "crane", name: "stern A-frame" },
    ],
  };
}

export function attenboroughSpec(): ShipSpec {
  const L = 128.9;
  const D = 12;
  return {
    kind: "service",
    hull: { length: L, beam: 24, depth: D, draft: 7.5, bow: "ice", stern: "transom", section: "round", entry: 0.32, run: 0.2, transom: 0.8, sheer: [0, 2], forecastle: [46, 2.8], boot: 0.4, stripe: 0, screws: 2 },
    livery: { hull: "#b02a22", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: "#e8bf2a", crane: "#e8bf2a" },
    items: [
      { k: "tier", u: [72, 118], y: [D + 2.6, D + 5.6], hw: 11, round: [0, 6], windows: [{ y: 1.1, h: 0.9, w: 0.9, pitch: 2.4 }], name: "accommodation 1" },
      ...deckhouse({ u: [92, 116], y0: D + 5.6, decks: 3, hw: 10.5, h: 2.9, wings: 12 }),
      mast(110, D + 5.6 + 3 * 2.9, D + 28, 0.3),
      funnel([74, 80], 2.6, [D + 5.6, D + 15], [["funnel", 0.85], ["black", 1]], 0.3),
      { k: "tier", u: [50, 72], y: [D - 0.2, D + 7], hw: 10, name: "hangar" },
      { k: "helideck", u: 60, y: D + 7.05, r: 9 },
      { k: "gantry", u: 2, hw: 7, y: D, h: 10, t: 0.8, lean: 1.8, mat: "crane", name: "stern A-frame" },
      { k: "gantry", u: 36, hw: 3, y: D, h: 7, t: 0.6, lean: 0, mat: "crane", name: "side A-frame" },
      { k: "crane", u: 26, z: -8, y: D, h: 4, jib: 16, dir: -Math.PI * 0.95 },
    ],
  };
}

export function hopperDredgerSpec(): ShipSpec {
  const L = 150;
  const D = 13;
  return {
    kind: "service",
    hull: { length: L, beam: 32, depth: D, draft: 11, bow: "bulbous", stern: "transom", section: "round", entry: 0.22, run: 0.18, transom: 0.85, forecastle: [14, 2.6], boot: 0.6, stripe: 0, screws: 2 },
    livery: { hull: "#c23128", bottom: "#1d2024", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: "#c23128", steel: "#8d9396", hatch: "#4a4c4e" },
    items: [
      ...deckhouse({ u: [124, 140], y0: D + 2.4, decks: 4, hw: 13, h: 2.9, wings: 16 }),
      mast(132, D + 2.4 + 4 * 2.9, D + 24, 0.3),
      // the hopper: its coamings and the overflow, the drag arms in their gantries
      { k: "box", u: [36, 116], z: [-13.5, -12.5], y: [D - 0.1, D + 3], mat: "hull", name: "port coaming" },
      { k: "box", u: [36, 116], z: [12.5, 13.5], y: [D - 0.1, D + 3], mat: "hull", name: "starboard coaming" },
      { k: "box", u: [37, 115], z: [-12.4, 12.4], y: [D - 0.1, D + 0.2], mat: "hatch", name: "hopper" },
      { k: "cyl", u: 76, z: 0, y: [D, D + 5], r: 1.6, mat: "steel", name: "overflow" },
      rod([24, D + 1, 16.4], [96, D + 1, 16.4], 0.7, "steel", "starboard drag arm"),
      rod([24, D + 1, -16.4], [96, D + 1, -16.4], 0.7, "steel", "port drag arm"),
      ...[30, 60, 92].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 1, u + 1], z: sd > 0 ? [14, 16.2] : [-16.2, -14], y: [D, D + 6], mat: "orange", name: `drag arm gantry ${u} ${sd > 0 ? "s" : "p"}` }))),
      funnel([12, 20], 2.4, [D, D + 14], [["funnel", 0.85], ["black", 1]], 0.3, 6),
      funnel([12, 20], 2.4, [D, D + 14], [["funnel", 0.85], ["black", 1]], 0.3, -6),
    ],
  };
}

// ---------------------------------------------------------------------------
// offshore

export const PSV_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["red", "Red"], ["blue", "Blue"], ["orange", "Orange"])];
export function supplyVesselSpec(p?: ParamValues): ShipSpec {
  const L = 89;
  const D = 7.6;
  const liv = pick(PSV_PARAMS, p, "livery");
  const side = liv === "blue" ? "#23426e" : liv === "orange" ? "#d9681e" : "#b02a22";
  return {
    kind: "service",
    hull: { length: L, beam: 19, depth: D, draft: 6.3, bow: "raked", stern: "transom", section: "round", entry: 0.3, run: 0.1, transom: 0.95, rake: 0.05, sheer: [0, 2.4], forecastle: [30, 2.8], boot: 0.3, stripe: 0, screws: 2 },
    livery: { hull: side, bottom: "#1d2024", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", funnel: side },
    items: [
      ...deckhouse({ u: [62, 78], y0: D + 2.6, decks: 4, hw: 9, h: 2.8, wings: 9.4, step: 0.2 }),
      { k: "tier", u: [60, 64], y: [D + 2.6 + 3 * 2.8, D + 2.6 + 4 * 2.8], hw: 9, front: { y: 0.6, h: 1.4, w: 1.2, n: 6 }, name: "aft bridge" },
      mast(72, D + 2.6 + 4 * 2.8, D + 22, 0.25),
      funnel([56, 60], 1.4, [D + 2.6, D + 13], [["funnel", 0.85], ["black", 1]], 0.2, 7.6),
      funnel([56, 60], 1.4, [D + 2.6, D + 13], [["funnel", 0.85], ["black", 1]], 0.2, -7.6),
      { k: "box", u: [1, 56], z: [9.1, 9.4], y: [D, D + 2.4], mat: "hull", name: "starboard cargo rail" },
      { k: "box", u: [1, 56], z: [-9.4, -9.1], y: [D, D + 2.4], mat: "hull", name: "port cargo rail" },
      { k: "containers", u: [12, 48], bays: 3, hw: 6, y: D, tiers: 1, groups: 2, seed: 53, name: "deck cargo" },
    ],
  };
}

export function anchorHandlerSpec(): ShipSpec {
  const L = 91;
  const D = 9.5;
  return {
    kind: "service",
    hull: { length: L, beam: 22, depth: D, draft: 7.8, bow: "raked", stern: "transom", section: "round", entry: 0.3, run: 0.1, transom: 0.95, rake: 0.05, sheer: [0, 2.4], forecastle: [36, 2.8], boot: 0.3, stripe: 0, screws: 2 },
    livery: { hull: "#23426e", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#23426e", crane: "#e8bf2a" },
    items: [
      ...deckhouse({ u: [64, 82], y0: D + 2.6, decks: 4, hw: 10, h: 2.8, wings: 10.6, step: 0.2 }),
      { k: "tier", u: [62, 66], y: [D + 2.6 + 3 * 2.8, D + 2.6 + 4 * 2.8], hw: 10, front: { y: 0.6, h: 1.4, w: 1.2, n: 6 }, name: "aft bridge" },
      mast(76, D + 2.6 + 4 * 2.8, D + 24, 0.25),
      funnel([58, 62], 1.6, [D + 2.6, D + 14], [["funnel", 0.85], ["black", 1]], 0.2, 8.6),
      funnel([58, 62], 1.6, [D + 2.6, D + 14], [["funnel", 0.85], ["black", 1]], 0.2, -8.6),
      // the stern roller across the transom, the towing pins and the shark jaws, the winch
      rod([1.4, D + 0.2, -6], [1.4, D + 0.2, 6], 1.3, "steel", "stern roller"),
      ...[-2.6, 2.6].map((z): Item => ({ k: "cyl", u: 8, z, y: [D, D + 1.8], r: 0.35, mat: "yellow", name: `towing pin ${z > 0 ? "starboard" : "port"}` })),
      { k: "box", u: [9, 11], z: [-0.8, 0.8], y: [D, D + 1.2], mat: "steel", name: "shark jaw" },
      { k: "box", u: [52, 60], z: [-6, 6], y: [D, D + 3.4], mat: "steel", name: "anchor handling winch" },
      { k: "crane", u: 46, z: 9, y: D, h: 3, jib: 14, dir: Math.PI, mat: "crane" },
    ],
  };
}

export function craneVesselSpec(): ShipSpec {
  const L = 220;
  return {
    kind: "service",
    // the two pontoons, awash at the transit draught; the columns rise to the deck box
    hull: { length: L, beam: 102, depth: 13, draft: 12, twin: 24, bow: "barge", stern: "sternwheel", section: "flat", entry: 0.06, run: 0.04, transom: 0.92, rake: 0.04, boot: 0.6, stripe: 0, rudder: false },
    livery: { hull: "#c23128", bottom: "#1d2024", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", crane: "#e8bf2a" },
    items: [
      ...[18, 74, 146, 202].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 12, u + 12], z: sd > 0 ? [31, 49] : [-49, -31], y: [12.9, 37.5], mat: "hull", name: `column ${u} ${sd > 0 ? "s" : "p"}` }))),
      { k: "box", u: [2, 218], z: [-50, 50], y: [37.5, 49.5], mat: "hull", name: "deck box" },
      ...deckhouse({ u: [176, 214], y0: 49.5, decks: 6, hw: 22, h: 3.2, wings: 26 }),
      { k: "helideck", u: 198, y: 49.5 + 6 * 3.2 + 1, r: 13, legs: 4 },
      // the two cranes on the stern corners, their booms raised
      ...[1, -1].flatMap((sd): Item[] => [
        { k: "cyl", u: 22, z: sd * 32, y: [49.5, 66], r: 14, mat: "crane", n: 16, name: `crane ${sd > 0 ? "starboard" : "port"} slew` },
        { k: "box", u: [10, 40], z: sd > 0 ? [22, 44] : [-44, -22], y: [66, 82], mat: "crane", name: `crane house ${sd > 0 ? "starboard" : "port"}` },
        rod([40, 70, sd * 30], [150, 175, sd * 30], 2.6, "crane", `crane boom ${sd > 0 ? "starboard" : "port"}`),
        rod([16, 82, sd * 30], [150, 175, sd * 30], 0.4, "rope", `crane topping ${sd > 0 ? "starboard" : "port"}`),
        { k: "box", u: [12, 22], z: sd > 0 ? [26, 34] : [-34, -26], y: [82, 112], mat: "crane", name: `crane A-frame ${sd > 0 ? "starboard" : "port"}` },
      ]),
    ],
  };
}

export function drillshipSpec(): ShipSpec {
  const L = 228;
  const D = 19;
  return {
    kind: "service",
    hull: oceanDrill(L, D),
    livery: { hull: "#1d2024", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#1d2024", crane: "#e8bf2a", red: "#c23128" },
    items: [
      ...deckhouse({ u: [196, 220], y0: D + 2.6, decks: 6, hw: 19, h: 3, wings: 21 }),
      { k: "helideck", u: 214, y: D + 2.6 + 6 * 3 + 1.5, r: 13, legs: 4 },
      // the derrick: a tapering lattice tower over the moonpool, its drill floor below
      { k: "box", u: [104, 128], z: [-12, 12], y: [D, D + 12], mat: "house", name: "drill floor" },
      ...[[-6, -6], [-6, 6], [6, -6], [6, 6]].map(([a, b], i): Item => rod([116 + a!, D + 12, b!], [116 + a! * 0.25, D + 74, b! * 0.25], 0.5, "red", `derrick leg ${i + 1}`)),
      ...[24, 38, 52, 64].map((y, i): Item => {
        const s = 6 - (6 * 0.75 * (y - 12)) / 62;
        return { k: "box", u: [116 - s - 0.3, 116 + s + 0.3], z: [-s - 0.3, s + 0.3], y: [D + y - 0.4, D + y], mat: "red", name: `derrick girt ${i + 1}` };
      }),
      { k: "box", u: [113.5, 118.5], z: [-2.5, 2.5], y: [D + 74, D + 77], mat: "red", name: "crown block" },
      { k: "box", u: [40, 96], z: [-16, 16], y: [D, D + 4], mat: "steel", name: "pipe racks" },
      { k: "crane", u: 92, z: 18, y: D, h: 8, jib: 40, dir: Math.PI * 0.95 },
      { k: "crane", u: 150, z: -18, y: D, h: 8, jib: 40, dir: Math.PI * 0.05 },
      funnel([10, 22], 3, [D, D + 14], [["funnel", 0.85], ["black", 1]], 0.4),
    ],
  };
}
function oceanDrill(L: number, D: number) {
  return { length: L, beam: 42, depth: D, draft: 12, bow: "raked" as const, stern: "transom" as const, section: "round" as const, entry: 0.18, run: 0.12, transom: 0.9, rake: 0.04, boot: 1, stripe: 0, screws: 2 };
}

export function cableLayerSpec(): ShipSpec {
  const L = 140;
  const D = 12;
  return {
    kind: "service",
    hull: { length: L, beam: 30, depth: D, draft: 7, bow: "raked", stern: "transom", section: "round", entry: 0.28, run: 0.12, transom: 0.9, rake: 0.05, sheer: [0, 2], forecastle: [34, 2.8], boot: 0.6, stripe: 0, screws: 2 },
    livery: { hull: "#23426e", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#23426e", crane: "#e8bf2a" },
    items: [
      ...deckhouse({ u: [108, 130], y0: D + 2.6, decks: 5, hw: 14, h: 2.9, wings: 15 }),
      mast(122, D + 2.6 + 5 * 2.9, D + 26, 0.3),
      funnel([100, 106], 2.2, [D + 2.6, D + 16], [["funnel", 0.85], ["black", 1]], 0.3, 8),
      funnel([100, 106], 2.2, [D + 2.6, D + 16], [["funnel", 0.85], ["black", 1]], 0.3, -8),
      // the cable carousel, its loading arm, the tensioners and the stern chute and sheaves
      { k: "cyl", u: 62, z: 0, y: [D - 0.2, D + 5.5], r: 14, mat: "steel", n: 20, name: "carousel" },
      { k: "cyl", u: 62, z: 0, y: [D + 5.5, D + 6.5], r: 3, mat: "grey", n: 12, name: "carousel hub" },
      { k: "gantry", u: 62, hw: 14.4, y: D, h: 9, t: 0.6, mat: "crane", name: "loading arm" },
      { k: "box", u: [20, 40], z: [-1.6, 1.6], y: [D, D + 2.4], mat: "grey", name: "tensioners" },
      rod([1, D + 1.6, -4], [1, D + 1.6, 4], 2.2, "crane", "stern sheaves"),
      { k: "gantry", u: 5, hw: 8, y: D, h: 11, t: 0.8, lean: 2, mat: "crane", name: "stern A-frame" },
    ],
  };
}

// ---------------------------------------------------------------------------
// fire, rescue and pilotage

export function fireboatSpec(): ShipSpec {
  const L = 40.5;
  const D = 4;
  return {
    kind: "service",
    hull: { length: L, beam: 9.1, depth: D, draft: 3, bow: "raked", stern: "cruiser", section: "round", entry: 0.35, run: 0.22, rake: 0.05, sheer: [0.3, 1.4], boot: 0.2, stripe: 0.3, screws: 2 },
    livery: { hull: "#b02a22", bottom: "#1d2024", boot: "#1d2024", stripe: "#f2f0ea", deck: "#7d6a55", house: "#f2f0ea", funnel: "#b02a22", red: "#b02a22", steel: "#c9b45a" },
    items: [
      { k: "tier", u: [10, 30], y: [D - 0.1, D + 2.4], hw: 3.8, windows: [{ y: 0.9, h: 0.8, w: 0.6, pitch: 1.8 }], name: "deckhouse" },
      { k: "tier", u: [24, 30], y: [D + 2.4, D + 4.8], hw: 3, front: { y: 0.8, h: 1, w: 0.8, n: 4 }, windows: [{ y: 0.8, h: 0.9, w: 0.7, pitch: 1.3 }], name: "pilothouse" },
      funnel([17, 21], 1.3, [D + 2.4, D + 6], [["funnel", 0.8], ["black", 1]], 0.4),
      // the monitors: the tall water tower and the deck guns, brass
      { k: "cyl", u: 13, z: 0, y: [D + 2.4, D + 9.5], r: 0.35, mat: "red", name: "monitor tower" },
      rod([13, D + 9.5, 0], [15.5, D + 10.4, 0], 0.18, "steel", "tower monitor"),
      ...[[34, 1.6], [34, -1.6], [7, 2], [7, -2], [27, 0]].map(([u, z], i): Item => rod([u!, D + (i === 4 ? 4.8 : 0.1), z!], [u! + 1.2, D + (i === 4 ? 5.6 : 1.2), z! * 1.2], 0.14, "steel", `monitor ${i + 1}`)),
      mast(27, D + 4.8, D + 10, 0.1),
    ],
  };
}

export function shannonSpec(): ShipSpec {
  const L = 13.6;
  const D = 2.2;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 4.5, depth: D, draft: 0.9, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.15, transom: 0.85, rake: 0.1, sheer: [0, 0.6], boot: 0.15, stripe: 0, rudder: false },
    livery: { hull: "#1f2f4f", bottom: "#c23128", boot: "#1d2024", deck: "#2a2d30", house: "#e8712a", glass: "#20262c" },
    items: [
      { k: "tier", u: [3.2, 9.2], y: [D - 0.1, D + 1.3], hw: 2.0, round: [0, 0.6], windows: [{ y: 0.5, h: 0.6, w: 0.9, pitch: 1.3 }], name: "cabin" },
      { k: "tier", u: [4.5, 8.5], y: [D + 1.3, D + 2.1], hw: 1.7, taper: [0.4, 1.8], front: { y: 0.15, h: 0.5, w: 0.8, n: 3 }, windows: [{ y: 0.15, h: 0.5, w: 0.8, pitch: 1.1 }], name: "wheelhouse" },
      { k: "cyl", u: 6, z: 0, y: [D + 2.1, D + 3.3], r: 0.08, mat: "house", name: "mast" },
      { k: "box", u: [5.6, 6.4], z: [-0.6, 0.6], y: [D + 3.3, D + 3.45], mat: "black", name: "radar" },
      { k: "box", u: [0.4, 2.6], z: [-1.8, 1.8], y: [D, D + 0.3], mat: "skirt", name: "after deck" },
    ],
  };
}

export function pilotBoatSpec(): ShipSpec {
  const L = 17;
  const D = 2.5;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 5.5, depth: D, draft: 1.4, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.15, transom: 0.85, rake: 0.1, sheer: [0, 0.8], boot: 0.15, stripe: 0.4, screws: 1 },
    livery: { hull: "#1d2024", bottom: "#8f2a22", boot: "#1d2024", stripe: "#d9681e", deck: "#6b6f6c", house: "#d9681e" },
    items: [
      { k: "tier", u: [7, 12.5], y: [D - 0.1, D + 2.2], hw: 2.1, round: [0, 0.8], front: { y: 1.1, h: 0.8, w: 0.9, n: 3 }, windows: [{ y: 1.1, h: 0.8, w: 1, pitch: 1.3 }], name: "wheelhouse" },
      { k: "box", u: [6.6, 13], z: [-2.5, 2.5], y: [D - 0.2, D + 0.1], mat: "skirt", name: "fender" },
      { k: "cyl", u: 9, z: 0, y: [D + 2.2, D + 4], r: 0.07, mat: "white", name: "mast" },
      { k: "box", u: [8.6, 9.4], z: [-0.7, 0.7], y: [D + 4, D + 4.15], mat: "black", name: "radar" },
      { k: "rail", u: [12.6, 16], y: D, hw: 2.1, h: 0.9, name: "foredeck rail" },
    ],
  };
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names (jsModel.ts imports a design's builders by name)

export function shipOceanTug(p?: ParamValues): MeshBuilder { return worldShip(oceanTugSpec(p)); }
export function shipOceanTugLod(p?: ParamValues): MeshBuilder { return shipLod(oceanTugSpec(p)); }
export function shipHarbourTug(p?: ParamValues): MeshBuilder { return worldShip(harbourTugSpec(p)); }
export function shipHarbourTugLod(p?: ParamValues): MeshBuilder { return shipLod(harbourTugSpec(p)); }
export function shipTowboat(): MeshBuilder { return worldShip(towboatSpec()); }
export function shipTowboatLod(): MeshBuilder { return shipLod(towboatSpec()); }
export function shipSternTrawler(p?: ParamValues): MeshBuilder { return worldShip(sternTrawlerSpec(p)); }
export function shipSternTrawlerLod(p?: ParamValues): MeshBuilder { return shipLod(sternTrawlerSpec(p)); }
export function shipPurseSeiner(): MeshBuilder { return worldShip(purseSeinerSpec()); }
export function shipPurseSeinerLod(): MeshBuilder { return shipLod(purseSeinerSpec()); }
export function shipShrimpTrawler(): MeshBuilder { return worldShip(shrimpTrawlerSpec()); }
export function shipShrimpTrawlerLod(): MeshBuilder { return shipLod(shrimpTrawlerSpec()); }
export function shipLobsterBoat(p?: ParamValues): MeshBuilder { return worldShip(lobsterBoatSpec(p)); }
export function shipLobsterBoatLod(p?: ParamValues): MeshBuilder { return shipLod(lobsterBoatSpec(p)); }
export function shipArktika(): MeshBuilder { return worldShip(arktikaSpec()); }
export function shipArktikaLod(): MeshBuilder { return shipLod(arktikaSpec()); }
export function shipPolarstern(): MeshBuilder { return worldShip(polarsternSpec()); }
export function shipPolarsternLod(): MeshBuilder { return shipLod(polarsternSpec()); }
export function shipAttenborough(): MeshBuilder { return worldShip(attenboroughSpec()); }
export function shipAttenboroughLod(): MeshBuilder { return shipLod(attenboroughSpec()); }
export function shipHopperDredger(): MeshBuilder { return worldShip(hopperDredgerSpec()); }
export function shipHopperDredgerLod(): MeshBuilder { return shipLod(hopperDredgerSpec()); }
export function shipSupplyVessel(p?: ParamValues): MeshBuilder { return worldShip(supplyVesselSpec(p)); }
export function shipSupplyVesselLod(p?: ParamValues): MeshBuilder { return shipLod(supplyVesselSpec(p)); }
export function shipAnchorHandler(): MeshBuilder { return worldShip(anchorHandlerSpec()); }
export function shipAnchorHandlerLod(): MeshBuilder { return shipLod(anchorHandlerSpec()); }
export function shipCraneVessel(): MeshBuilder { return worldShip(craneVesselSpec()); }
export function shipCraneVesselLod(): MeshBuilder { return shipLod(craneVesselSpec()); }
export function shipDrillship(): MeshBuilder { return worldShip(drillshipSpec()); }
export function shipDrillshipLod(): MeshBuilder { return shipLod(drillshipSpec()); }
export function shipCableLayer(): MeshBuilder { return worldShip(cableLayerSpec()); }
export function shipCableLayerLod(): MeshBuilder { return shipLod(cableLayerSpec()); }
export function shipFireboat(): MeshBuilder { return worldShip(fireboatSpec()); }
export function shipFireboatLod(): MeshBuilder { return shipLod(fireboatSpec()); }
export function shipRnliShannon(): MeshBuilder { return worldShip(shannonSpec()); }
export function shipRnliShannonLod(): MeshBuilder { return shipLod(shannonSpec()); }
export function shipPilotBoat(): MeshBuilder { return worldShip(pilotBoatSpec()); }
export function shipPilotBoatLod(): MeshBuilder { return shipLod(pilotBoatSpec()); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md)

export const SERVICE_SHIP_SPECS: readonly WorldShip[] = [
  { id: "veh-ship-cable-layer", title: "Cable Layer", spec: cableLayerSpec, build: shipCableLayer, buildLod: shipCableLayerLod, game: { weight: 22_000, power: 12_000, maxspeed: 24 }, references: "ship-cable-layer" },
  { id: "veh-ship-ocean-tug", title: "Ocean-Going Tug", spec: oceanTugSpec, build: shipOceanTug, buildLod: shipOceanTugLod, params: OCEAN_TUG_PARAMS, finishParams: ["livery"], game: { weight: 6_000, power: 20_000, maxspeed: 31 }, references: "ship-ocean-tug" },
  { id: "veh-ship-harbour-tug", title: "Harbour Tug", spec: harbourTugSpec, build: shipHarbourTug, buildLod: shipHarbourTugLod, params: HARBOUR_TUG_PARAMS, finishParams: ["livery"], game: { weight: 800, power: 5_000, maxspeed: 24 }, references: "ship-harbour-tug" },
  { id: "veh-ship-towboat", title: "Mississippi Towboat", spec: towboatSpec, build: shipTowboat, buildLod: shipTowboatLod, game: { weight: 1_800, power: 4_500, maxspeed: 20 }, references: "ship-towboat" },
  { id: "veh-ship-stern-trawler", title: "Stern Trawler", spec: sternTrawlerSpec, build: shipSternTrawler, buildLod: shipSternTrawlerLod, params: STERN_TRAWLER_PARAMS, finishParams: ["livery"], game: { weight: 4_500, power: 6_000, maxspeed: 28 }, references: "ship-stern-trawler" },
  { id: "veh-ship-purse-seiner", title: "Tuna Purse Seiner", spec: purseSeinerSpec, build: shipPurseSeiner, buildLod: shipPurseSeinerLod, game: { weight: 3_800, power: 4_500, maxspeed: 30 }, references: "ship-purse-seiner" },
  { id: "veh-ship-shrimp-trawler", title: "Shrimp Trawler", spec: shrimpTrawlerSpec, build: shipShrimpTrawler, buildLod: shipShrimpTrawlerLod, game: { weight: 150, power: 450, maxspeed: 18 }, references: "ship-shrimp-trawler" },
  { id: "veh-ship-lobster-boat", title: "Maine Lobster Boat", spec: lobsterBoatSpec, build: shipLobsterBoat, buildLod: shipLobsterBoatLod, params: LOBSTER_PARAMS, finishParams: ["colour"], game: { weight: 12, power: 450, maxspeed: 37 }, references: "ship-lobster-boat" },
  { id: "veh-ship-arktika", title: "Arktika Class Icebreaker", spec: arktikaSpec, build: shipArktika, buildLod: shipArktikaLod, game: { weight: 25_840, power: 55_000, maxspeed: 40 }, references: "ship-arktika" },
  { id: "veh-ship-polarstern", title: "Polarstern", spec: polarsternSpec, build: shipPolarstern, buildLod: shipPolarsternLod, game: { weight: 17_300, power: 14_000, maxspeed: 30 }, references: "ship-polarstern" },
  { id: "veh-ship-attenborough", title: "RRS Sir David Attenborough", spec: attenboroughSpec, build: shipAttenborough, buildLod: shipAttenboroughLod, game: { weight: 15_000, power: 11_000, maxspeed: 31 }, references: "ship-attenborough" },
  { id: "veh-ship-hopper-dredger", title: "Trailing Suction Hopper Dredger", spec: hopperDredgerSpec, build: shipHopperDredger, buildLod: shipHopperDredgerLod, game: { weight: 45_000, power: 20_000, maxspeed: 29 }, references: "ship-hopper-dredger" },
  { id: "veh-ship-supply-vessel", title: "Platform Supply Vessel", spec: supplyVesselSpec, build: shipSupplyVessel, buildLod: shipSupplyVesselLod, params: PSV_PARAMS, finishParams: ["livery"], game: { weight: 8_000, power: 7_000, maxspeed: 26 }, references: "ship-supply-vessel" },
  { id: "veh-ship-anchor-handler", title: "Anchor Handling Tug", spec: anchorHandlerSpec, build: shipAnchorHandler, buildLod: shipAnchorHandlerLod, game: { weight: 9_000, power: 20_000, maxspeed: 31 }, references: "ship-anchor-handler" },
  { id: "veh-ship-crane-vessel", title: "Semi-Submersible Crane Vessel", spec: craneVesselSpec, build: shipCraneVessel, buildLod: shipCraneVesselLod, game: { weight: 273_000, power: 96_000, maxspeed: 19 }, references: "ship-crane-vessel" },
  { id: "veh-ship-drillship", title: "Drillship", spec: drillshipSpec, build: shipDrillship, buildLod: shipDrillshipLod, game: { weight: 96_000, power: 42_000, maxspeed: 22 }, references: "ship-drillship" },
  { id: "veh-ship-fireboat", title: "Fire Fighter", spec: fireboatSpec, build: shipFireboat, buildLod: shipFireboatLod, game: { weight: 650, power: 2_200, maxspeed: 28 }, references: "ship-fireboat" },
  { id: "veh-ship-rnli-shannon", title: "RNLI Shannon Class", spec: shannonSpec, build: shipRnliShannon, buildLod: shipRnliShannonLod, game: { weight: 18, power: 970, maxspeed: 46 }, references: "ship-rnli-shannon" },
  { id: "veh-ship-pilot-boat", title: "Pilot Boat", spec: pilotBoatSpec, build: shipPilotBoat, buildLod: shipPilotBoatLod, game: { weight: 40, power: 1_000, maxspeed: 46 }, references: "ship-pilot-boat" },
];

export const SERVICE_SHIPS = /* @__PURE__ */ shipDesigns(SERVICE_SHIP_SPECS);
