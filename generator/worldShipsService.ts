// The world's service ships (docs/models/world-ships-cargo.md): tugs and a
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
import { colourParam, deckhouse, detailed, exhausts, fittings, funnel, liveryParam, mast, pick, shipDesigns, type WorldShip } from "./worldShips.ts";

/** A rod between two points (u, y, z). */
const rod = (a: [number, number, number], b: [number, number, number], r: number, mat: string, name?: string): Item => ({ k: "rod", a, b, r, mat, ...(name ? { name } : {}) });

// ---------------------------------------------------------------------------
// tugs and the towboat

export const OCEAN_TUG_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["black", "Black"], ["red", "Red"], ["blue", "Blue"])];
export function oceanTugSpec(p?: ParamValues): ShipSpec {
  const L = 80;
  const D = 8;
  const B = 18;
  const liv = pick(OCEAN_TUG_PARAMS, p, "livery");
  const side = liv === "red" ? "#a8302a" : liv === "blue" ? "#23426e" : "#1d2024";
  const top = D + 2.4 + 4 * 2.8;
  return {
    kind: "service",
    hull: { length: L, beam: B, depth: D, draft: 6.5, bow: "bulbous", stern: "transom", section: "round", entry: 0.3, run: 0.25, transom: 0.8, sheer: [0.2, 2.4], forecastle: [34, 2.6], boot: 0.4, stripe: 0.4, screws: 2, bulb: 0.12, fine: true },
    livery: { hull: side, bottom: "#8f2a22", stripe: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: side },
    items: [
      ...deckhouse({ u: [50, 64], y0: D + 2.4, decks: 4, hw: 7.6, h: 2.8, step: 0.6, wings: 9, detail: true }),
      mast(60, top, D + 22, 0.25),
      { k: "rail", u: [52, 63], y: top, hw: 7, h: 1, name: "monkey island rail" },
      ...[3.2, -3.2].flatMap((z): Item[] => [funnel([44, 49], 1.8, [D + 2.4, D + 12], [["funnel", 0.85], ["black", 1]], 0.5, z), { k: "cyl", u: 47.2, z, y: [D + 11.5, D + 13], r: 0.35, mat: "black", name: "exhaust pipe" }]),
      // the fire-fighting monitors on their platform over the wheelhouse
      ...[2.4, -2.4].map((z): Item => rod([61, top + 0.4, z], [63.4, top + 1.6, z * 1.2], 0.2, "red", "fire monitor")),
      // the towing winch with its drums, the towing staple and the pins, the stern roller
      { k: "box", u: [30, 40], z: [-5, 5], y: [D, D + 1.6], mat: "steel", name: "towing winch bed" },
      ...[-2.8, 0, 2.8].map((z, i): Item => rod([35, D + 2.4, z - 1.1], [35, D + 2.4, z + 1.1], 1.5, i === 1 ? "red" : "steel", "towing winch drum")),
      { k: "gantry", u: 14, hw: 6, y: D, h: 3.2, t: 0.6, mat: "steel", name: "towing staple" },
      rod([1.6, D + 0.3, -6], [1.6, D + 0.3, 6], 1.0, "steel", "stern roller"),
      ...[-1.8, 1.8].map((z): Item => ({ k: "cyl", u: 6, z, y: [D, D + 1.6], r: 0.3, mat: "yellow", name: "towing pin" })),
      { k: "crane", u: 26, z: -6.5, y: D, h: 3, jib: 12, dir: Math.PI, mat: "orange" },
      { k: "bulwark", u: [0, L - 34.6], h: 1.2, t: 0.3 },
      { k: "boats", at: [54], z: 8.4, y: D + 4.4, len: 6, r: 0.9, name: "rescue boat" },
      ...[46, 48.6].map((u): Item => ({ k: "cyl", u, z: 7.4, y: [D + 2.5, D + 3.5], r: 0.45, mat: "white", name: "liferaft" })),
      { k: "fender", u: [L - 4, L], y: [D + 0.6, D + 2.4], out: 0.5, name: "bow fender" },
      ...fittings({ L, B, D, fc: [34, 2.6], aft: [], draft: 6.5, rail: false }),
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
    hull: { length: L, beam: 12.8, depth: D, draft: 3.6, bow: "raked", stern: "transom", section: "round", entry: 0.42, run: 0.3, transom: 0.8, rake: 0.05, sheer: [0.3, 1.6], boot: 0.3, stripe: 0.6, screws: 2, fine: true },
    livery: { hull: side, stripe: "#1b1c1d", bottom: "#8f2a22", deck: "#6f7a77", house: "#f2f0ea", funnel: side },
    items: [
      // the rubber fenders: a band round the sheer, the heavy bow and stern fenders, tyres along the sides
      { k: "fender", u: [0, L], y: [D - 0.9, D - 0.1], out: 0.4, name: "sheer fender" },
      { k: "fender", u: [L - 3.4, L], y: [D - 2.4, D + 0.8], out: 0.7, name: "bow fender" },
      { k: "fender", u: [0, 2.6], y: [D - 1.8, D - 0.2], out: 0.6, name: "stern fender" },
      ...[8, 11, 14, 17, 20, 23].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "cyl", u, z: sd * 6.75, y: [D - 2.8, D - 1.2], r: 0.4, n: 8, mat: "skirt", name: "tyre fender" }))),
      { k: "bulwark", u: [0, L], h: 0.9, t: 0.25 },
      { k: "tier", u: [12, 22], y: [D - 0.1, D + 2.4], hw: 4.6, lip: 0.3, windows: [{ y: 0.9, h: 0.8, w: 0.8, pitch: 1.6 }], front: { y: 0.9, h: 0.8, w: 0.8, n: 5 }, name: "deckhouse" },
      { k: "tier", u: [14.5, 21], y: [D + 2.4, D + 5.2], hw: 3.8, lip: 0.5, front: { y: 0.8, h: 1.4, w: 1.1, n: 5 }, windows: [{ y: 0.8, h: 1.4, w: 1.2, pitch: 1.5 }], name: "wheelhouse" },
      { k: "rail", u: [15, 20.6], y: D + 5.2, hw: 3.5, h: 0.9, name: "wheelhouse top rail" },
      mast(18, D + 5.2, D + 10, 0.12),
      rod([20, D + 5.4, 0], [21.6, D + 6.2, 0], 0.15, "red", "fire monitor"),
      ...[2.5, -2.5].flatMap((z): Item[] => [funnel([12.4, 14], 0.6, [D + 2.4, D + 6.5], [["funnel", 0.8], ["black", 1]], 0.2, z), { k: "cyl", u: 13.4, z: z * 1.06, y: [D + 6.2, D + 7], r: 0.16, mat: "black", name: "exhaust pipe" }]),
      { k: "box", u: [24, 27], z: [-2, 2], y: [D, D + 0.8], mat: "steel", name: "towing winch bed" },
      rod([25.5, D + 1.3, -1.6], [25.5, D + 1.3, 1.6], 0.75, "red", "towing winch drum"),
      { k: "cyl", u: 6, z: 0, y: [D, D + 1.4], r: 0.5, mat: "steel", name: "towing hook" },
      { k: "gantry", u: 7.5, hw: 4.6, y: D, h: 2.4, t: 0.35, mat: "steel", name: "towing bow" },
      { k: "mooring", at: [3, 28.5], hw: 4.6, s: 0.5 },
      { k: "anchors", u: L - 2.6, y: D - 0.6, s: 0.9 },
      { k: "marks", at: [L * 0.8, L * 0.4], y: [2.4, 4.2], step: 0.5, s: 0.3 },
    ],
  };
}

export function towboatSpec(): ShipSpec {
  const L = 60;
  const D = 3.4;
  const H = 2.7;
  return {
    kind: "service",
    hull: { length: L, beam: 16, depth: D, draft: 2.7, bow: "barge", stern: "transom", section: "flat", entry: 0.04, run: 0.12, transom: 0.85, rake: 0.03, boot: 0.2, stripe: 0.3, screws: 2, fine: true },
    livery: { hull: "#1d2024", bottom: "#8f2a22", stripe: "#c23128", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#1d2024", yellow: "#e8bf2a" },
    items: [
      // the push knees on the square bow, their black facing pads
      ...[5.4, -5.4].flatMap((z): Item[] => [
        { k: "plate", pts: [[L - 0.6, D], [L + 0.2, D], [L + 0.2, D + 5.5], [L - 0.6, D + 5.5]], z, t: 0.5, mat: "yellow", name: z > 0 ? "starboard push knee" : "port push knee" },
        { k: "box", u: [L + 0.2, L + 0.6], z: [z - 0.4, z + 0.4], y: [D + 0.4, D + 5.2], mat: "black", name: "knee pad" },
      ]),
      ...deckhouse({ u: [14, 44], y0: D - 0.1, decks: 3, hw: 7.2, h: H, step: 1.2, detail: true }),
      // the walkway rails round the upper decks
      { k: "rail", u: [15.5, 43.3], y: D - 0.1 + H, hw: 7.15, h: 1 },
      { k: "rail", u: [16.7, 42.9], y: D - 0.1 + 2 * H, hw: 7.1, h: 1 },
      { k: "tier", u: [32, 42], y: [D - 0.1 + 3 * H, D + 3 * H + 3.2], hw: 4.6, lip: 0.6, front: { y: 0.9, h: 1.6, w: 1.2, n: 6 }, windows: [{ y: 0.9, h: 1.6, w: 1.3, pitch: 1.7 }], name: "pilothouse" },
      ...[3, -3].flatMap((z): Item[] => [
        { k: "cyl", u: 22, z, y: [D + 3 * H, D + 3 * H + 4.5], r: 0.55, mat: "funnel", name: z > 0 ? "starboard stack" : "port stack" },
        { k: "cyl", u: 22, z, y: [D + 3 * H + 4.5, D + 3 * H + 4.9], r: 0.75, mat: "black", name: "stack cap" },
      ]),
      mast(39, D + 3 * H + 3.1, D + 17, 0.12),
      ...[3.2, -3.2].map((z): Item => ({ k: "cyl", u: 41.6, z, y: [D + 3 * H + 3.1, D + 3 * H + 3.7], r: 0.3, mat: "black", name: "searchlight" })),
      // the face winches that hold the tow, their drums
      { k: "box", u: [46, 56], z: [-6, 6], y: [D, D + 0.6], mat: "steel", name: "winch bed" },
      ...[4, -4].map((z): Item => rod([51, D + 1.2, z - 1.4], [51, D + 1.2, z + 1.4], 0.6, "red", "face winch drum")),
      { k: "mooring", at: [3, 57.5], hw: 6.8, s: 0.6 },
      { k: "fender", u: [0, L], y: [D - 0.7, D - 0.1], out: 0.3, name: "rubbing strake" },
    ],
  };
}

// ---------------------------------------------------------------------------
// fishing vessels

export const STERN_TRAWLER_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["red", "Red"], ["blue", "Blue"], ["green", "Green"])];
export function sternTrawlerSpec(p?: ParamValues): ShipSpec {
  const L = 70;
  const D = 9;
  const B = 15;
  const liv = pick(STERN_TRAWLER_PARAMS, p, "livery");
  const side = liv === "blue" ? "#23426e" : liv === "green" ? "#2f6a45" : "#b02a22";
  return {
    kind: "service",
    hull: { length: L, beam: B, depth: D, draft: 6.5, bow: "bulbous", stern: "transom", section: "round", entry: 0.3, run: 0.2, transom: 0.85, sheer: [0, 2], forecastle: [24, 2.6], boot: 0.4, stripe: 0, screws: 1, bulb: 0.14, fine: true },
    livery: { hull: side, bottom: "#1d2024", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: side },
    items: [
      ...deckhouse({ u: [46, 60], y0: D + 2.4, decks: 3, hw: 6.4, h: 2.8, wings: 7.4, detail: true }),
      mast(56, D + 2.4 + 3 * 2.8, D + 18, 0.2),
      funnel([40, 45], 1.6, [D + 2.4, D + 11], [["funnel", 0.85], ["black", 1]], 0.4),
      ...exhausts([40, 45], 1.6, D + 11, 0.4),
      // the shelter deck over the factory, the stern ramp, the trawl gantry over it, the net drums and trawl winches
      { k: "tier", u: [14, 46], y: [D - 0.2, D + 2.4], inset: 0.4, mat: "hull", lip: 0.2, windows: [{ y: 1, h: 0.4, w: 1.2, pitch: 4, mat: "black" }], name: "shelter deck" },
      { k: "plate", pts: [[0.2, 2], [0.2, D - 0.1], [10, D - 0.1], [10, D - 0.5]], z: 0, t: 5, mat: "steel", name: "stern ramp" },
      { k: "gantry", u: 4, hw: 5.6, y: D, h: 8, t: 0.6, mat: "orange", name: "trawl gantry" },
      { k: "gantry", u: 30, hw: 4, y: D + 2.4, h: 6, t: 0.4, mat: "orange", name: "forward gantry" },
      ...[3.5, -3.5].map((z): Item => rod([11, D + 1.6, z - 1.6], [11, D + 1.6, z + 1.6], 1.4, "grey", "net drum")),
      ...[5.6, -5.6].map((z): Item => ({ k: "plate", pts: [[3, D + 1], [6, D + 1], [6, D + 4.6], [3, D + 4.6]], z, t: 0.3, mat: "black", name: "trawl door" })),
      ...[4.4, -4.4].map((z): Item => rod([36, D + 3.4, z - 1], [36, D + 3.4, z + 1], 0.8, "red", "trawl winch")),
      { k: "crane", u: 62, z: -4, y: D + 2.6, h: 3, jib: 10, dir: Math.PI * 0.9, mat: "orange" },
      { k: "bulwark", u: [0, 14], h: 1.2, t: 0.25 },
      ...[48, 50].map((u): Item => ({ k: "cyl", u, z: 6.6, y: [D + 2.5, D + 3.4], r: 0.4, mat: "white", name: "liferaft" })),
      ...fittings({ L, B, D, fc: [24, 2.6], aft: [], draft: 6.5, rail: [14.4, L - 24.4] }),
    ],
  };
}

export function purseSeinerSpec(): ShipSpec {
  const L = 80;
  const D = 7.5;
  const B = 14;
  const top = D + 2.3 + 3 * 2.8;
  return {
    kind: "service",
    hull: { length: L, beam: B, depth: D, draft: 6, bow: "raked", stern: "transom", section: "round", entry: 0.32, run: 0.2, transom: 0.8, sheer: [0.2, 2.6], forecastle: [30, 2.4], boot: 0.3, screws: 1, fine: true },
    livery: { hull: "#f2f0ea", bottom: "#8f2a22", boot: "#23426e", deck: "#6f7a77", house: "#f2f0ea", funnel: "#23426e", boat: "#d9681e" },
    items: [
      ...deckhouse({ u: [46, 62], y0: D + 2.3, decks: 3, hw: 6, h: 2.8, wings: 7, detail: true }),
      // the helideck over the wheelhouse for the spotting helicopter
      { k: "helideck", u: 54, y: top + 0.2, r: 6, legs: 4 },
      // the tuna tower with its crow's nest
      { k: "mast", u: 66, y: [D + 2.4, D + 26], r: 0.25, yards: [[D + 21, 1.2]] },
      { k: "box", u: [65, 67], z: [-1, 1], y: [D + 21, D + 22.4], mat: "white", name: "crow's nest" },
      { k: "rail", u: [65, 67], y: D + 22.4, hw: 1, h: 0.9, name: "crow's nest rail" },
      funnel([42, 46], 1.4, [D + 2.3, D + 10], [["funnel", 0.85], ["black", 1]], 0.4),
      ...exhausts([42, 46], 1.4, D + 10, 0.4),
      // the power block on its boom, the net pile, the skiff on the ramp, the speedboats
      rod([40, D + 2.3, 4], [26, D + 16, 3], 0.3, "yellow", "power block boom"),
      { k: "box", u: [25, 27], z: [2, 4], y: [D + 14.4, D + 16.2], mat: "yellow", name: "power block" },
      rod([26, D + 14.4, 3], [24, D + 1.6, 0], 0.08, "black", "net line"),
      { k: "box", u: [10, 28], z: [-5, 5], y: [D, D + 1.6], mat: "black", name: "net pile" },
      { k: "box", u: [10.5, 27.5], z: [-4.4, 4.4], y: [D + 1.6, D + 2.4], mat: "black", name: "net pile top" },
      ...[3, 7].map((u): Item => ({ k: "cyl", u, z: 5, y: [D, D + 0.8], r: 0.4, mat: "orange", name: "float" })),
      { k: "boats", at: [4.5], z: 0, y: D + 1.8, len: 9, r: 1.6, mat: "boat", name: "skiff" },
      { k: "boats", at: [38], z: 5.6, y: D + 3.2, len: 5, r: 0.8, mat: "boat", name: "speedboats" },
      { k: "box", u: [30, 40], z: [-5.6, -2], y: [D, D + 2.3], mat: "house", name: "purse winch house" },
      { k: "bulwark", u: [0, L - 30.6], h: 1.1, t: 0.25 },
      mast(70, D + 2.4, D + 12, 0.2),
      ...fittings({ L, B, D, fc: [30, 2.4], aft: [], draft: 6, rail: false }),
    ],
  };
}

export function shrimpTrawlerSpec(): ShipSpec {
  const L = 23;
  const D = 3.2;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 7, depth: D, draft: 2.7, bow: "raked", stern: "transom", section: "vee", entry: 0.4, run: 0.25, transom: 0.8, rake: 0.08, sheer: [0.3, 1.4], boot: 0.15, stripe: 0, screws: 1, fine: true },
    livery: { hull: "#f2f0ea", bottom: "#8f2a22", boot: "#1d2024", deck: "#7d6a55", house: "#f2f0ea", mast: "#d8d6cf" },
    items: [
      { k: "bulwark", u: [0, L], h: 0.8, t: 0.15 },
      { k: "fender", u: [0, L], y: [D - 0.4, D - 0.15], out: 0.12, mat: "black", name: "rubbing strake" },
      { k: "tier", u: [13, 19], y: [D - 0.1, D + 2.4], hw: 2.8, lip: 0.35, front: { y: 1.1, h: 0.9, w: 0.9, n: 3 }, windows: [{ y: 1.1, h: 0.8, w: 0.8, pitch: 1.4 }], name: "wheelhouse" },
      { k: "cyl", u: 16, z: 0, y: [D + 2.4, D + 4.4], r: 0.06, mat: "steel", name: "antenna" },
      { k: "box", u: [15.6, 16.4], z: [-0.6, 0.6], y: [D + 2.4, D + 2.6], mat: "black", name: "radar" },
      { k: "cyl", u: 12.4, z: 1.8, y: [D + 2, D + 4.4], r: 0.16, mat: "black", name: "exhaust" },
      { k: "cyl", u: 9, z: 0, y: [D, D + 11], r: 0.18, mat: "mast", name: "mast" },
      // the outrigger booms, lowered to fish, their nets' doors hanging from the tips and the nets trailing
      rod([9, D + 1.5, 0.3], [9, D + 5.5, 10.5], 0.12, "mast", "starboard outrigger"),
      rod([9, D + 1.5, -0.3], [9, D + 5.5, -10.5], 0.12, "mast", "port outrigger"),
      rod([9, D + 10.5, 0], [9, D + 5.5, 10.5], 0.04, "rope", "starboard stay"),
      rod([9, D + 10.5, 0], [9, D + 5.5, -10.5], 0.04, "rope", "port stay"),
      rod([9, D + 5.4, 10.5], [9, D + 2.2, 10], 0.03, "rope", "starboard warp"),
      rod([9, D + 5.4, -10.5], [9, D + 2.2, -10], 0.03, "rope", "port warp"),
      { k: "box", u: [8, 10], z: [9.8, 10.2], y: [D + 1, D + 2.2], mat: "wood", name: "starboard door" },
      { k: "box", u: [8, 10], z: [-10.2, -9.8], y: [D + 1, D + 2.2], mat: "wood", name: "port door" },
      // the nets streaming aft from the doors: bags tapering to their cod ends
      ...[1, -1].flatMap((sd): Item[] => [[8, 6, 0.42], [6, 4, 0.32], [4, 2.4, 0.22]].map(([a, b, r]): Item => rod([a!, D + 1.5 - (8 - a!) * 0.12, sd * (9.8 - (8 - a!) * 0.1)], [b!, D + 1.5 - (8 - b!) * 0.12, sd * (9.8 - (8 - b!) * 0.1)], r!, "green", sd > 0 ? "starboard net" : "port net"))),
      rod([2, D, 0], [9, D + 9, 0], 0.1, "mast", "boom"),
      rod([11, D + 0.8, -1.2], [11, D + 0.8, 1.2], 0.5, "red", "trawl winch"),
      { k: "box", u: [10.2, 11.8], z: [-1.4, 1.4], y: [D - 0.05, D + 0.4], mat: "steel", name: "winch bed" },
      { k: "box", u: [3, 6], z: [-2, 2], y: [D - 0.05, D + 0.5], mat: "steel", name: "culling table" },
      { k: "anchors", u: L - 1.6, y: D + 0.6, s: 0.6 },
      { k: "mooring", at: [1.2, L - 2.4], hw: 2.6, s: 0.35 },
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
    hull: { length: L, beam: 4.2, depth: D, draft: 1.1, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.2, transom: 0.85, rake: 0.08, sheer: [0.1, 0.8], boot: 0.12, stripe: 0.15, screws: 1, fine: true },
    livery: { hull: BOAT_COLOURS[pick(LOBSTER_PARAMS, p, "colour")]!, bottom: "#8f2a22", stripe: "#1d2024", deck: "#d6d0c2", house: "#f2f0ea" },
    items: [
      { k: "bulwark", u: [0, L], h: 0.5, t: 0.1, mat: "house" },
      { k: "fender", u: [0, L], y: [D - 0.3, D - 0.15], out: 0.08, mat: "house", name: "rubrail" },
      { k: "tier", u: [6.5, 9.2], y: [D - 0.1, D + 1.9], hw: 1.7, front: { y: 0.9, h: 0.8, w: 0.9, n: 3 }, windows: [{ y: 0.9, h: 0.7, w: 0.7, pitch: 1.1 }], name: "wheelhouse" },
      { k: "box", u: [3, 6.5], z: [-1.7, 1.7], y: [D + 1.7, D + 1.8], mat: "house", name: "hardtop" },
      ...[3.2, 6.3].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "cyl", u, z: sd * 1.6, y: [D, D + 1.7], r: 0.04, mat: "steel", name: `hardtop post ${u} ${sd}` }))),
      // the traps stacked aft, the buoys, the hauler on its davit
      ...[[1, -1.4, "yellow"], [1, -0.5, "green"], [2.4, -1.4, "orange"], [2.4, -0.5, "yellow"], [1, 0.6, "orange"], [2.4, 0.6, "green"]].map(([u, z, mat], i): Item => ({ k: "box", u: [u as number, (u as number) + 1.2], z: [z as number, (z as number) + 0.8], y: [D, D + 0.5 + (i % 2) * 0.5], mat: mat as string, name: "lobster traps" })),
      ...[[4, 1.2, "red"], [4.4, 1.2, "yellow"], [4.8, 1.2, "white"]].map(([u, z, mat]): Item => ({ k: "cyl", u: u as number, z: z as number, y: [D, D + 0.6], r: 0.12, mat: mat as string, name: "buoy" })),
      rod([6.2, D, 1.6], [6.2, D + 1.4, 2.1], 0.05, "steel", "hauler davit"),
      { k: "cyl", u: 6.2, z: 1.9, y: [D + 0.6, D + 0.9], r: 0.2, mat: "black", name: "pot hauler" },
      { k: "cyl", u: 8, z: 0, y: [D + 1.9, D + 3.4], r: 0.05, mat: "steel", name: "radar mast" },
      { k: "box", u: [7.6, 8.4], z: [-0.5, 0.5], y: [D + 3.4, D + 3.6], mat: "black", name: "radar" },
      ...[0.6, -0.6].map((z): Item => ({ k: "cyl", u: 7, z, y: [D + 1.9, D + 4.2], r: 0.03, mat: "white", name: "antenna" })),
      { k: "cyl", u: 9.6, z: 1.3, y: [D + 0.4, D + 2.4], r: 0.08, mat: "black", name: "exhaust stack" },
      { k: "anchors", u: L - 0.9, y: D - 0.1, s: 0.35 },
      { k: "mooring", at: [0.5, L - 1.2], hw: 1.6, s: 0.25 },
    ],
  };
}

// ---------------------------------------------------------------------------
// icebreakers and research ships

export function arktikaSpec(): ShipSpec {
  const L = 159.6;
  const D = 17.2;
  const top = D + 5.6 + 4 * 2.8;
  return {
    kind: "service",
    hull: { length: L, beam: 30, depth: D, draft: 11, bow: "ice", stern: "transom", section: "round", entry: 0.3, run: 0.2, transom: 0.7, sheer: [0, 2], boot: 1.6, stripe: 0, screws: 2, fine: true },
    livery: { hull: "#1d2024", bottom: "#b02a22", boot: "#b02a22", deck: "#6f7a77", house: "#f2f0ea", funnel: "#d9681e", orange: "#d9681e" },
    items: [
      // the long superstructure forward of midships, the bridge on top
      { k: "tier", u: [40, 112], y: [D - 0.2, D + 5.6], hw: 13.6, round: [0, 3], lip: 0.4, windows: [{ y: 1.4, h: 1, w: 0.9, pitch: 2.6 }, { y: 4.2, h: 0.9, w: 0.9, pitch: 2.6 }], name: "accommodation" },
      ...deckhouse({ u: [86, 110], y0: D + 5.6, decks: 4, hw: 11, h: 2.8, wings: 14.6, detail: true }),
      mast(100, top, D + 30, 0.3),
      { k: "rail", u: [88, 108], y: top, hw: 10.4, h: 1, name: "monkey island rail" },
      { k: "domes", u: [94, 104], n: 2, r: 1.2, y: top, h: 1.4, z: 5, mat: "white", name: "radomes" },
      // the reactors' ventilation stack aft of the house
      funnel([56, 66], 3.4, [D + 5.6, D + 17], [["orange", 0.8], ["black", 1]], 0.4),
      ...exhausts([56, 66], 3.4, D + 17, 0.4),
      { k: "helideck", u: 24, y: D + 5.6, r: 10, legs: 4 },
      { k: "tier", u: [16, 36], y: [D - 0.2, D + 5.6], hw: 9, lip: 0.3, windows: [{ y: 1, h: 3.6, w: 5, pitch: 7, from: 22, to: 30, mat: "grey" }], name: "hangar" },
      // the enclosed lifeboats along the house's sides
      ...[50, 62, 74].map((u): Item => ({ k: "boats", at: [u], z: 14.4, y: D + 3.2, len: 8, r: 1.3, name: "lifeboats" })),
      { k: "crane", u: 118, z: 8, y: D, h: 4, jib: 14, dir: Math.PI * 0.95, mat: "orange" },
      { k: "crane", u: 38, z: -8, y: D, h: 4, jib: 14, dir: -Math.PI * 0.95, mat: "orange" },
      { k: "bulwark", u: [112, L], h: 1.6, t: 0.3 },
      // the towing notch on the stern for the escorted ship's bow
      { k: "fender", u: [0, 3], y: [D - 2, D - 0.2], out: 0.6, name: "stern fender" },
      ...fittings({ L, B: 30, D, fc: [30, 0], aft: [8], draft: 11, rake: 0.08, rail: [0.6, 111.6] }),
    ],
  };
}

export function polarsternSpec(): ShipSpec {
  const L = 118;
  const D = 13.6;
  const top = D + 5.4 + 3 * 2.8;
  return {
    kind: "service",
    hull: { length: L, beam: 25, depth: D, draft: 11.2, bow: "ice", stern: "transom", section: "round", entry: 0.3, run: 0.22, transom: 0.75, sheer: [0, 2], forecastle: [40, 2.6], boot: 0.4, stripe: 0, screws: 2, fine: true },
    livery: { hull: "#b02a22", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: "#f2f0ea", crane: "#e8bf2a" },
    items: [
      { k: "tier", u: [58, 96], y: [D + 2.4, D + 5.4], hw: 11, lip: 0.35, windows: [{ y: 1.1, h: 0.9, w: 0.9, pitch: 2.4 }], front: { y: 1.1, h: 0.9, w: 0.9, n: 9 }, name: "accommodation 1" },
      ...deckhouse({ u: [72, 94], y0: D + 5.4, decks: 3, hw: 10, h: 2.8, wings: 12.4, detail: true }),
      { k: "helideck", u: 78, y: top + 0.1, r: 8 },
      mast(90, top, D + 27, 0.3),
      { k: "domes", u: [88, 92], n: 2, r: 1, y: top, h: 1.2, z: -6, mat: "white", name: "radomes" },
      funnel([60, 68], 2.4, [D + 5.4, D + 15], [["funnel", 0.6], ["red", 0.85], ["black", 1]], 0.3),
      ...exhausts([60, 68], 2.4, D + 15, 0.3),
      { k: "crane", u: 40, z: 7, y: D, h: 5, jib: 18, dir: Math.PI * 0.95 },
      { k: "crane", u: 40, z: -7, y: D, h: 5, jib: 18, dir: -Math.PI * 0.95 },
      { k: "gantry", u: 3, hw: 6, y: D, h: 9, t: 0.7, lean: 1.5, mat: "crane", name: "stern A-frame" },
      // the laboratory containers on the working deck, the winches
      { k: "containers", u: [14, 38], bays: 4, hw: 7.5, y: D, tiers: 1, seed: 61, rows: 2.5, name: "laboratory containers" },
      ...[4, -4].map((z): Item => rod([10, D + 1.2, z - 1.4], [10, D + 1.2, z + 1.4], 0.9, "grey", "deep-sea winch")),
      ...[66, 80].map((u): Item => ({ k: "boats", at: [u], z: 11.6, y: D + 3, len: 8, r: 1.2, name: "lifeboats" })),
      { k: "bulwark", u: [0, L - 40.6], h: 1.2, t: 0.3 },
      ...fittings({ L, B: 25, D, fc: [40, 2.6], aft: [], draft: 11.2, rake: 0.08, rail: false }),
    ],
  };
}

export function attenboroughSpec(): ShipSpec {
  const L = 128.9;
  const D = 12;
  const top = D + 5.6 + 3 * 2.9;
  return {
    kind: "service",
    hull: { length: L, beam: 24, depth: D, draft: 7.5, bow: "ice", stern: "transom", section: "round", entry: 0.32, run: 0.2, transom: 0.8, sheer: [0, 2], forecastle: [46, 2.8], boot: 0.4, stripe: 0, screws: 2, fine: true },
    livery: { hull: "#b02a22", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: "#e8bf2a", crane: "#e8bf2a" },
    items: [
      { k: "tier", u: [72, 118], y: [D + 2.6, D + 5.6], hw: 11, round: [0, 6], lip: 0.35, windows: [{ y: 1.1, h: 0.9, w: 0.9, pitch: 2.4 }], name: "accommodation 1" },
      ...deckhouse({ u: [92, 116], y0: D + 5.6, decks: 3, hw: 10.5, h: 2.9, wings: 12, detail: true }),
      mast(110, top, D + 28, 0.3),
      { k: "domes", u: [104, 108], n: 2, r: 1, y: top, h: 1.2, z: 6, mat: "white", name: "radomes" },
      funnel([74, 80], 2.6, [D + 5.6, D + 15], [["funnel", 0.85], ["black", 1]], 0.3),
      ...exhausts([74, 80], 2.6, D + 15, 0.3),
      { k: "tier", u: [50, 72], y: [D - 0.2, D + 7], hw: 10, lip: 0.3, windows: [{ y: 0.6, h: 5, w: 6, pitch: 9, from: 55, to: 64, mat: "grey" }], name: "hangar" },
      { k: "helideck", u: 60, y: D + 7.05, r: 9 },
      { k: "gantry", u: 2, hw: 7, y: D, h: 10, t: 0.8, lean: 1.8, mat: "crane", name: "stern A-frame" },
      { k: "gantry", u: 36, hw: 3, y: D, h: 7, t: 0.6, lean: 0, mat: "crane", name: "side A-frame" },
      { k: "crane", u: 26, z: -8, y: D, h: 4, jib: 16, dir: -Math.PI * 0.95 },
      { k: "crane", u: 44, z: 8, y: D, h: 4, jib: 12, dir: Math.PI * 0.95 },
      { k: "containers", u: [10, 30], bays: 3, hw: 6, y: D, tiers: 1, seed: 67, rows: 2.5, name: "laboratory containers" },
      ...[84, 98].map((u): Item => ({ k: "boats", at: [u], z: 11.6, y: D + 3.4, len: 8, r: 1.2, name: "lifeboats" })),
      { k: "bulwark", u: [0, L - 46.6], h: 1.2, t: 0.3 },
      ...fittings({ L, B: 24, D, fc: [46, 2.8], aft: [], draft: 7.5, rake: 0.08, rail: false }),
    ],
  };
}

export function hopperDredgerSpec(): ShipSpec {
  const L = 150;
  const D = 13;
  const B = 32;
  return {
    kind: "service",
    hull: { length: L, beam: B, depth: D, draft: 11, bow: "bulbous", stern: "transom", section: "round", entry: 0.22, run: 0.18, transom: 0.85, forecastle: [14, 2.6], boot: 0.6, stripe: 0, screws: 2, fine: true },
    livery: { hull: "#c23128", bottom: "#1d2024", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: "#c23128", steel: "#8d9396", hatch: "#4a4c4e" },
    items: [
      ...deckhouse({ u: [124, 140], y0: D + 2.4, decks: 4, hw: 13, h: 2.9, wings: 16, detail: true }),
      { k: "box", u: [122, 141], z: [-14, 14], y: [D - 0.1, D + 2.4], mat: "house", name: "deckhouse base" },
      mast(132, D + 2.4 + 4 * 2.9, D + 24, 0.3),
      // the hopper: its coamings and the overflow, the loading gutters, the drag arms in their gantries
      { k: "box", u: [36, 116], z: [-13.5, -12.5], y: [D - 0.1, D + 3], mat: "hull", name: "port coaming" },
      { k: "box", u: [36, 116], z: [12.5, 13.5], y: [D - 0.1, D + 3], mat: "hull", name: "starboard coaming" },
      { k: "box", u: [37, 115], z: [-12.4, 12.4], y: [D - 0.1, D + 0.2], mat: "hatch", name: "hopper" },
      ...[46, 62, 78, 94, 108].map((u): Item => ({ k: "box", u: [u - 0.4, u + 0.4], z: [-12.4, 12.4], y: [D + 2.2, D + 3.1], mat: "steel", name: "hopper beam" })),
      { k: "pipes", u: [38, 114], z: [0], y: D + 3.6, r: 0.8, name: "loading gutter" },
      { k: "cyl", u: 76, z: 0, y: [D, D + 5], r: 1.6, mat: "steel", name: "overflow" },
      ...[16.4, -16.4].flatMap((z): Item[] => [
        rod([24, D + 1, z], [96, D + 1, z], 0.7, "steel", z > 0 ? "starboard drag arm" : "port drag arm"),
        { k: "box", u: [20, 25], z: [z - 1.2, z + 1.2], y: [D - 0.6, D + 2.2], mat: "orange", name: "drag head" },
        { k: "box", u: [94, 98], z: [z - 1, z + 1], y: [D, D + 2], mat: "steel", name: "trunnion" },
      ]),
      ...[30, 60, 92].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 1, u + 1], z: sd > 0 ? [14, 16.2] : [-16.2, -14], y: [D, D + 6], mat: "orange", name: `drag arm gantry ${u} ${sd > 0 ? "s" : "p"}` }))),
      // the shore discharge coupling and the rainbow nozzle on the bow
      { k: "box", u: [142, 146], z: [-1.6, 1.6], y: [D + 2.6, D + 4.2], mat: "steel", name: "bow coupling" },
      rod([144, D + 4.2, 0], [L + 1, D + 6.2, 0], 0.5, "steel", "rainbow nozzle"),
      ...[6, -6].flatMap((z): Item[] => [funnel([12, 20], 2.4, [D, D + 14], [["funnel", 0.85], ["black", 1]], 0.3, z), { k: "cyl", u: 18, z, y: [D + 13.4, D + 15], r: 0.5, mat: "black", name: "exhaust pipe" }]),
      { k: "tier", u: [6, 26], y: [D - 0.1, D + 3], hw: 12, lip: 0.3, windows: [{ y: 1, h: 0.8, w: 1, pitch: 2.6 }], name: "engine casing" },
      { k: "freefall", u: 120, y: D + 3, len: 8, tilt: 0.55 },
      ...fittings({ L, B, D, fc: [14, 2.6], aft: [2.5], draft: 11 }),
    ],
  };
}

// ---------------------------------------------------------------------------
// offshore

export const PSV_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["red", "Red"], ["blue", "Blue"], ["orange", "Orange"])];
export function supplyVesselSpec(p?: ParamValues): ShipSpec {
  const L = 89;
  const D = 7.6;
  const B = 19;
  const liv = pick(PSV_PARAMS, p, "livery");
  const side = liv === "blue" ? "#23426e" : liv === "orange" ? "#d9681e" : "#b02a22";
  const top = D + 2.6 + 4 * 2.8;
  return {
    kind: "service",
    hull: { length: L, beam: B, depth: D, draft: 6.3, bow: "raked", stern: "transom", section: "round", entry: 0.3, run: 0.1, transom: 0.95, rake: 0.05, sheer: [0, 2.4], forecastle: [30, 2.8], boot: 0.3, stripe: 0, screws: 2, fine: true },
    livery: { hull: side, bottom: "#1d2024", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", funnel: side },
    items: [
      ...deckhouse({ u: [62, 78], y0: D + 2.6, decks: 4, hw: 9, h: 2.8, wings: 9.4, step: 0.2, detail: true }),
      { k: "tier", u: [60, 64], y: [D + 2.6 + 3 * 2.8, top], hw: 9, lip: 0.6, front: { y: 0.6, h: 1.4, w: 1.2, n: 6 }, name: "aft bridge" },
      mast(72, top, D + 22, 0.25),
      { k: "rail", u: [63, 76], y: top, hw: 8.6, h: 1, name: "monkey island rail" },
      ...[7.6, -7.6].flatMap((z): Item[] => [funnel([56, 60], 1.4, [D + 2.6, D + 13], [["funnel", 0.85], ["black", 1]], 0.2, z), { k: "cyl", u: 58.6, z, y: [D + 12.6, D + 14], r: 0.3, mat: "black", name: "exhaust pipe" }]),
      // the crash rails round the cargo deck, the deck cargo, the cargo hose stations, the crane
      { k: "box", u: [1, 56], z: [9.1, 9.4], y: [D, D + 2.4], mat: "hull", name: "starboard cargo rail" },
      { k: "box", u: [1, 56], z: [-9.4, -9.1], y: [D, D + 2.4], mat: "hull", name: "port cargo rail" },
      ...[10, 20, 30, 40, 50].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 0.3, u + 0.3], z: sd > 0 ? [8.4, 9.1] : [-9.1, -8.4], y: [D, D + 2.4], mat: "hull", name: "cargo rail bracket" }))),
      { k: "containers", u: [12, 48], bays: 3, hw: 6, y: D, tiers: 1, seed: 53, rows: 2.5, name: "deck cargo" },
      { k: "pipes", u: [4, 30], z: [-5, -4], y: D + 0.4, r: 0.3, mat: "yellow", name: "pipe cargo" },
      ...[20, 40].map((u): Item => ({ k: "box", u: [u - 1, u + 1], z: [8.2, 9], y: [D + 2.4, D + 3.4], mat: "steel", name: "hose station" })),
      { k: "crane", u: 54, z: 7.6, y: D, h: 4, jib: 12, dir: Math.PI, mat: "yellow" },
      ...[2.2, -2.2].map((z): Item => rod([77, top + 0.4, z], [79, top + 1.4, z * 1.2], 0.18, "red", "fire monitor")),
      { k: "boats", at: [68], z: 9.6, y: D + 5.2, len: 6, r: 0.9, name: "rescue boat" },
      ...fittings({ L, B, D, fc: [30, 2.8], aft: [], draft: 6.3, rail: false }),
    ],
  };
}

export function anchorHandlerSpec(): ShipSpec {
  const L = 91;
  const D = 9.5;
  const B = 22;
  const top = D + 2.6 + 4 * 2.8;
  return {
    kind: "service",
    hull: { length: L, beam: B, depth: D, draft: 7.8, bow: "raked", stern: "transom", section: "round", entry: 0.3, run: 0.1, transom: 0.95, rake: 0.05, sheer: [0, 2.4], forecastle: [36, 2.8], boot: 0.3, stripe: 0, screws: 2, fine: true },
    livery: { hull: "#23426e", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#23426e", crane: "#e8bf2a" },
    items: [
      ...deckhouse({ u: [64, 82], y0: D + 2.6, decks: 4, hw: 10, h: 2.8, wings: 10.6, step: 0.2, detail: true }),
      { k: "tier", u: [62, 66], y: [D + 2.6 + 3 * 2.8, top], hw: 10, lip: 0.6, front: { y: 0.6, h: 1.4, w: 1.2, n: 6 }, name: "aft bridge" },
      mast(76, top, D + 24, 0.25),
      { k: "rail", u: [65, 80], y: top, hw: 9.6, h: 1, name: "monkey island rail" },
      ...[8.6, -8.6].flatMap((z): Item[] => [funnel([58, 62], 1.6, [D + 2.6, D + 14], [["funnel", 0.85], ["black", 1]], 0.2, z), { k: "cyl", u: 60.6, z, y: [D + 13.6, D + 15], r: 0.32, mat: "black", name: "exhaust pipe" }]),
      // the stern roller across the transom, the towing pins and the shark jaws, the winch and its drums, the tuggers
      rod([1.4, D + 0.2, -6], [1.4, D + 0.2, 6], 1.3, "steel", "stern roller"),
      ...[-2.6, 2.6].map((z): Item => ({ k: "cyl", u: 8, z, y: [D, D + 1.8], r: 0.35, mat: "yellow", name: `towing pin ${z > 0 ? "starboard" : "port"}` })),
      { k: "box", u: [9, 11], z: [-0.8, 0.8], y: [D, D + 1.2], mat: "steel", name: "shark jaw" },
      { k: "box", u: [52, 60], z: [-6, 6], y: [D, D + 1.6], mat: "steel", name: "anchor handling winch" },
      ...[-3.6, 0, 3.6].map((z, i): Item => rod([56, D + 2.6, z - 1.5], [56, D + 2.6, z + 1.5], 1.7, i === 1 ? "red" : "steel", "winch drum")),
      ...[7, -7].map((z): Item => rod([46, D + 0.9, z - 0.8], [46, D + 0.9, z + 0.8], 0.7, "red", "tugger winch")),
      { k: "box", u: [1, 50], z: [10.4, 10.8], y: [D, D + 2.6], mat: "hull", name: "starboard crash rail" },
      { k: "box", u: [1, 50], z: [-10.8, -10.4], y: [D, D + 2.6], mat: "hull", name: "port crash rail" },
      { k: "crane", u: 46, z: 9, y: D, h: 3, jib: 14, dir: Math.PI, mat: "crane" },
      { k: "crane", u: 20, z: -9, y: D + 2.6, h: 2, jib: 8, dir: -Math.PI * 0.95, mat: "crane", name: "knuckle crane" },
      ...[2.2, -2.2].map((z): Item => rod([81, top + 0.4, z], [83, top + 1.4, z * 1.2], 0.18, "red", "fire monitor")),
      { k: "boats", at: [70], z: 10.6, y: D + 5.2, len: 6, r: 0.9, name: "rescue boat" },
      ...fittings({ L, B, D, fc: [36, 2.8], aft: [], draft: 7.8, rail: false }),
    ],
  };
}

export function craneVesselSpec(): ShipSpec {
  const L = 220;
  const Y = 49.5;
  return {
    kind: "service",
    // the two pontoons, awash at the transit draught; the columns rise to the deck box
    hull: { length: L, beam: 102, depth: 13, draft: 12, twin: 24, bow: "barge", stern: "sternwheel", section: "flat", entry: 0.06, run: 0.04, transom: 0.92, rake: 0.04, boot: 0.6, stripe: 0, rudder: false, fine: true },
    livery: { hull: "#c23128", bottom: "#1d2024", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", crane: "#e8bf2a" },
    items: [
      ...[18, 74, 146, 202].flatMap((u): Item[] => [1, -1].flatMap((sd): Item[] => [
        { k: "box", u: [u - 12, u + 12], z: sd > 0 ? [31, 49] : [-49, -31], y: [12.9, 37.5], mat: "hull", name: `column ${u} ${sd > 0 ? "s" : "p"}` },
        // the anchor fairleads on the columns' outer corners
        { k: "box", u: [u - 1.5, u + 1.5], z: sd > 0 ? [49, 50.2] : [-50.2, -49], y: [32, 36], mat: "steel", name: "fairlead" },
      ])),
      { k: "box", u: [2, 218], z: [-50, 50], y: [37.5, Y], mat: "hull", name: "deck box" },
      { k: "tier", u: [2.6, 217.4], y: [Y - 6, Y - 5.4], hw: 50.6, mat: "white", name: "deck box stripe" },
      ...deckhouse({ u: [176, 214], y0: Y, decks: 6, hw: 22, h: 3.2, wings: 26, detail: true }),
      { k: "helideck", u: 198, y: Y + 6 * 3.2 + 1, r: 13, legs: 4 },
      // the deck's pipe racks, the sea fastening grillage, the mooring winches on the corners
      { k: "box", u: [80, 160], z: [-30, 30], y: [Y - 0.05, Y + 1.2], mat: "steel", top: false, name: "grillage" },
      ...[90, 110, 130, 150].map((u): Item => ({ k: "box", u: [u - 0.6, u + 0.6], z: [-30, 30], y: [Y + 1.2, Y + 2.4], mat: "yellow", name: "grillage beam" })),
      { k: "containers", u: [60, 76], bays: 2, hw: 12, y: Y, tiers: 1, seed: 71, rows: 2.5, name: "deck containers" },
      ...[[8, 44], [8, -44], [212, 44], [212, -44]].map(([u, z]): Item => ({ k: "box", u: [u! - 3, u! + 3], z: [z! - 3, z! + 3], y: [Y, Y + 3.4], mat: "steel", name: "mooring winch" })),
      ...[180, 192].map((u): Item => ({ k: "freefall", u, y: Y + 2, len: 9, tilt: -0.55, name: "freefall lifeboat" })),
      // the two cranes on the stern corners, their lattice booms raised, the hooks hanging
      ...[1, -1].flatMap((sd): Item[] => [
        { k: "cyl", u: 22, z: sd * 32, y: [Y, 66], r: 14, mat: "crane", n: 16, name: `crane ${sd > 0 ? "starboard" : "port"} slew` },
        { k: "tier", u: [10, 40], y: [66, 82], hw: 11, mat: "crane", lip: 0.3, windows: [{ y: 6, h: 1.4, w: 2, pitch: 4, from: 32, to: 38 }], name: `crane house ${sd > 0 ? "starboard" : "port"}` },
        // the starboard boom raised forward over the deck, the port one slewed out over the side
        ...((): Item[] => {
          const tip: [number, number, number] = sd > 0 ? [150, 175, 30] : [122, 160, -96];
          const at = (f: number, dz: number): [number, number, number] => [40 + (tip[0] - 40) * f, 70 + (tip[1] - 70) * f, sd * 30 + (tip[2] - sd * 30) * f + dz * (1 - 0.7 * f)];
          return [
            ...[-4, 4].map((dz): Item => rod(at(0, dz), at(1, dz), 1.4, "crane", `crane boom chord ${sd > 0 ? "starboard" : "port"}`)),
            ...[0.2, 0.4, 0.6, 0.8].map((f): Item => rod(at(f, -4), at(f, 4), 0.6, "crane", "crane boom brace")),
            rod([16, 82, sd * 30], tip, 0.4, "rope", `crane topping ${sd > 0 ? "starboard" : "port"}`),
            rod(tip, [tip[0], tip[1] - 54, tip[2]], 0.25, "rope", "hook falls"),
            { k: "box", u: [tip[0] - 3, tip[0] + 3], z: [tip[2] - 3, tip[2] + 3], y: [tip[1] - 60, tip[1] - 54], mat: "yellow", name: "hook block" },
          ];
        })(),
        { k: "box", u: [12, 22], z: sd > 0 ? [26, 34] : [-34, -26], y: [82, 112], mat: "crane", name: `crane A-frame ${sd > 0 ? "starboard" : "port"}` },
      ]),
      { k: "marks", at: [L * 0.9, L * 0.5, L * 0.1], y: [8, 13], step: 1, s: 1 },
      ...[22, 22].map((u, i): Item => ({ k: "crane", u: u + 4, z: (i ? -1 : 1) * 46, y: Y, h: 6, jib: 24, dir: (i ? -1 : 1) * Math.PI * 0.6, mat: "crane", name: "auxiliary crane" })),
    ],
  };
}

export function drillshipSpec(): ShipSpec {
  const L = 228;
  const D = 19;
  return {
    kind: "service",
    hull: { ...oceanDrill(L, D), fine: true },
    livery: { hull: "#1d2024", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#1d2024", crane: "#e8bf2a", red: "#c23128" },
    items: detailed([
      ...deckhouse({ u: [196, 220], y0: D + 2.6, decks: 6, hw: 19, h: 3, wings: 21, detail: true }),
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
      // the derrick's X-bracing on each face between its girts
      ...[[12, 24], [24, 38], [38, 52], [52, 64]].flatMap(([ya, yb], i): Item[] => {
        const w = (y: number): number => 6 - (6 * 0.75 * (y - 12)) / 62;
        return [[1, 0], [-1, 0], [0, 1], [0, -1]].flatMap(([fu, fz]): Item[] => {
          const a = w(ya!);
          const b = w(yb!);
          const P = (y: number, s: number, t: number): [number, number, number] => [116 + (fu ? fu * s : t * s), D + y, fz ? fz * s : t * s];
          return [rod(P(ya!, a, -1), P(yb!, b, 1), 0.22, "red", `derrick brace ${i + 1}`), rod(P(ya!, a, 1), P(yb!, b, -1), 0.22, "red", `derrick brace ${i + 1}`)];
        });
      }),
      // the pipe racks' pipes, the riser bay, the lifeboats and the fittings
      { k: "pipes", u: [42, 94], z: [-13, -11, -9, -7, -5, -3, 3, 5, 7, 9, 11, 13], y: D + 4.6, r: 0.5, name: "drill pipe" },
      ...[60, 80].map((u): Item => ({ k: "box", u: [u - 0.4, u + 0.4], z: [-16, 16], y: [D + 4, D + 6], mat: "yellow", name: "pipe rack post" })),
      ...[140, 146, 152].map((u): Item => ({ k: "cyl", u, z: 14, y: [D, D + 20], r: 0.8, mat: "orange", name: "riser" })),
      ...exhausts([10, 22], 3, D + 14, 0.4),
      ...[188, 194].map((u): Item => ({ k: "freefall", u, y: D + 3, len: 9, tilt: -0.5, name: "freefall lifeboat" })),
      { k: "bulwark", u: [L - 22, L], h: 1.6, t: 0.3 },
      { k: "rail", u: [197.6, 219.6], y: D + 2.6 + 6 * 3, hw: 18.4, h: 1.1, name: "house top rail" },
      ...fittings({ L, B: 42, D, fc: [22, 0], aft: [3], draft: 12 }),
    ]),
  };
}
function oceanDrill(L: number, D: number) {
  return { length: L, beam: 42, depth: D, draft: 12, bow: "raked" as const, stern: "transom" as const, section: "round" as const, entry: 0.18, run: 0.12, transom: 0.9, rake: 0.04, boot: 1, stripe: 0, screws: 2 };
}

/**
 * The cable layer, after CS Cable Innovator (IMO 9101132; assets/ship-cable-layer/): 145.5 m
 * over its stern fairings, a tall red hull under a white sheer strake, the accommodation
 * forward of midships with a forward-looking cab and the bridge glazed aft over the working
 * deck, two teal casings with their exhausts, the cable tanks' hatches and the cable highway
 * with its linear engine on the after deck, two deck cranes, the A-frame, and the three stern
 * sheaves in their red fairings reaching 12.5 m beyond the transom. Positions are measured
 * off the side photograph at 6.1 px/m from the stem (`fb`, metres from the bow), heights
 * scaled 0.78 to the published draught.
 */
export function cableLayerSpec(): ShipSpec {
  const L = 133;
  const D = 22;
  const B = 24;
  const T = 7.5;
  const fb = (m: number): number => L - m;
  // the house's decks: deck 1 on the weather deck, the bridge on top
  const h = 2.9;
  const y1 = D + h;
  const y2 = D + 2 * h;
  const y3 = D + 3 * h;
  const y4 = D + 4 * h;
  const top = D + 5 * h;
  const sheave = { u: -9.8, y: D - 3.4, r: 2.4 };
  return {
    kind: "service",
    hull: { length: L, beam: B, depth: D, draft: T, bow: "raked", stern: "transom", section: "round", entry: 0.3, run: 0.15, transom: 0.85, rake: 0.06, sheer: [0, 1.2], boot: 0.5, stripe: 3, screws: 2, fine: true },
    livery: { hull: "#c73a2e", boot: "#c73a2e", bottom: "#7c2420", stripe: "#f2f2ee", deck: "#6b6f6c", house: "#f2f0ea", roof: "#c8cbc7", funnel: "#1e9aa5", teal: "#1e9aa5", crane: "#eceae4", hatch: "#7f8589", fairing: "#c73a2e" },
    items: [
      // the house: two full-width decks from 22 m to 82.5 m behind the stem, deck 3 under the cab and the bridge
      { k: "tier", u: [fb(82.5), fb(22)], y: [D - 0.2, y1], hw: 11.4, lip: 0.35, windows: [{ y: 1.1, h: 0.8, w: 0.9, pitch: 3 }], front: { y: 1.1, h: 0.8, w: 0.9, n: 7 }, name: "accommodation deck 1" },
      { k: "tier", u: [fb(82), fb(22.6)], y: [y1, y2], hw: 11.2, lip: 0.35, windows: [{ y: 1.1, h: 0.8, w: 0.9, pitch: 3 }], front: { y: 1.1, h: 0.8, w: 0.9, n: 7 }, name: "accommodation deck 2" },
      { k: "tier", u: [fb(81.5), fb(33)], y: [y2, y3], hw: 10, lip: 0.35, windows: [{ y: 1.1, h: 0.8, w: 0.9, pitch: 3 }], front: { y: 1.1, h: 0.8, w: 0.9, n: 6 }, name: "accommodation deck 3" },
      { k: "tier", u: [fb(81), fb(51.5)], y: [y3, y4], hw: 10, lip: 0.35, windows: [{ y: 1.1, h: 0.8, w: 0.9, pitch: 2.4 }], front: { y: 1.1, h: 0.8, w: 0.9, n: 6 }, name: "accommodation deck 4" },
      { k: "tier", u: [fb(81), fb(51.5)], y: [y4, top], hw: 10, lip: 0.7, windows: [{ y: 0.8, h: 1.5, w: 1.5, pitch: 1.9 }], front: { y: 0.8, h: 1.5, w: 1.5, n: 9 }, wings: { hw: 12, h: 2.5 }, name: "bridge" },
      // the cable machinery house aft of it, one deck a little lower, the deck crane on its roof
      { k: "tier", u: [fb(100.5), fb(82.5) + 0.4], y: [D - 0.2, y1 - 0.4], hw: 11.4, lip: 0.35, windows: [{ y: 1.1, h: 0.8, w: 0.9, pitch: 4.5, to: fb(83.5) }], name: "cable machinery house" },
      { k: "rail", u: [fb(100), fb(83)], y: y1 - 0.4, hw: 11.2, h: 1, name: "machinery house rail" },
      // the after bridge's windows over the working deck
      ...[-8, -6, -4, -2, 0, 2, 4, 6, 8].map((z): Item => ({ k: "box", u: [fb(81) - 0.1, fb(81) - 0.03], z: [z - 0.75, z + 0.75], y: [y4 + 0.8, y4 + 2.3], mat: "glass", name: "after bridge window" })),
      // the forward cab on deck 3, looking over the forecastle
      { k: "tier", u: [fb(45), fb(33.5)], y: [y3, y3 + 3.4], hw: 6, lip: 0.5, windows: [{ y: 1, h: 1.4, w: 1.3, pitch: 1.8 }], front: { y: 1, h: 1.4, w: 1.3, n: 6 }, name: "forward cab" },
      { k: "rail", u: [fb(32.4), fb(23.4)], y: y2, hw: 10.9, h: 1, name: "deck 2 rail" },
      { k: "rail", u: [fb(80), fb(52.5)], y: top, hw: 9.8, h: 1, name: "bridge top rail" },
      // the forward casing: teal from deck 3 to its mouth, its side panels down to deck 2, the exhausts
      { k: "box", u: [fb(58), fb(50)], z: [-3, 3], y: [y3 - 0.3, D + 20.2], mat: "teal", name: "forward casing" },
      { k: "box", u: [fb(58), fb(50)], z: [-3, 3], y: [D + 20.2, D + 20.9], mat: "black", name: "forward casing top" },
      ...[1, -1].map((sd): Item => ({ k: "box", u: [fb(57.5), fb(50.5)], z: sd > 0 ? [9.6, 10.6] : [-10.6, -9.6], y: [y2, y4 - 0.15], mat: "teal", name: "casing side panel" })),
      ...[52, 54, 56].map((m): Item => ({ k: "cyl", u: fb(m), z: 0, y: [D + 20.5, D + 22.3], r: 0.45, mat: "black", name: "exhaust pipe" })),
      // the after casing on the bridge roof
      { k: "box", u: [fb(75.5), fb(69)], z: [-2.6, 2.6], y: [top - 0.3, D + 18.2], mat: "teal", name: "after casing" },
      { k: "box", u: [fb(75.5), fb(69)], z: [-2.6, 2.6], y: [D + 18.2, D + 18.8], mat: "black", name: "after casing top" },
      ...[70.8, 73.8].map((m): Item => ({ k: "cyl", u: fb(m), z: 0, y: [D + 18.4, D + 20], r: 0.45, mat: "black", name: "exhaust pipe" })),
      mast(fb(67), top, D + 27, 0.3),
      // the radomes on their posts
      ...([[40, 3, y3 + 3.4], [78, -4, top]] as const).flatMap(([m, z, y]): Item[] => [
        { k: "cyl", u: fb(m), z, y: [y, y + 1.6], r: 0.15, mat: "white", name: "radome post" },
        { k: "domes", u: [fb(m), fb(m)], n: 1, r: 0.8, y: y + 1.6, h: 0.5, z, mat: "white", name: "radome" },
      ]),
      // the lifeboats in their davits on deck 2, beside the bridge
      { k: "boats", at: [fb(68)], z: 11, y: y2 + 1.83, len: 8.5, r: 1.3, name: "lifeboat" },
      ...[1, -1].flatMap((sd): Item[] => [-1, 1].flatMap((e): Item[] => [
        { k: "box", u: [fb(68) + e * 2.5 - 0.3, fb(68) + e * 2.5 + 0.3], z: sd > 0 ? [10.1, 11.2] : [-11.2, -10.1], y: [y2 - 0.1, y2 + 0.55], mat: "steel", name: "boat chock" },
        rod([fb(68) + e * 4.7, y2, sd * 9.9], [fb(68) + e * 4.7, y3 + 1.6, sd * 11.4], 0.2, "white", "davit arm"),
        rod([fb(68) + e * 4.7, y3 + 1.6, sd * 11.4], [fb(68) + e * 3.6, y2 + 2.6, sd * 11], 0.05, "rope", "davit fall"),
      ])),
      // the forecastle: the foremast with its platform, a crane
      mast(fb(6), D + 0.4, D + 12, 0.4),
      { k: "box", u: [fb(7.1), fb(4.9)], z: [-1.1, 1.1], y: [D + 9, D + 9.3], mat: "mast", name: "foremast platform" },
      { k: "rail", u: [fb(7), fb(5)], y: D + 9.3, hw: 1.05, h: 0.9, name: "foremast platform rail" },
      { k: "crane", u: fb(17), z: -5, y: D + 0.3, h: 2.5, jib: 9, dir: 0.5, lift: 0.5, name: "forecastle crane" },
      // the cable tanks' hatches on the after deck: coamings closed to the deck, covers with their hubs
      ...[25].flatMap((u): Item[] => [
        { k: "cyl", u, z: 0, y: [D - 0.3, D + 1.2], r: 5, n: 20, mat: "hatch", name: "cable tank hatch" },
        { k: "cyl", u, z: 0, y: [D + 1.2, D + 1.6], r: 1.4, n: 10, mat: "grey", name: "cable tank hub" },
      ]),
      // the cable highway: the trough aft to the chute, the linear engine and its tensioner frames
      { k: "box", u: [0.6, 25], z: [-0.45, 0.45], y: [D - 0.1, D + 0.9], mat: "steel", name: "cable highway" },
      { k: "box", u: [8, 18], z: [-1.4, 1.4], y: [D - 0.1, D + 2], mat: "grey", name: "linear cable engine" },
      ...[10, 13, 16].map((u): Item => ({ k: "box", u: [u - 0.5, u + 0.5], z: [-1.8, 1.8], y: [D - 0.1, D + 2.6], mat: "yellow", name: "tensioner frame" })),
      { k: "plate", pts: [[0.8, D + 0.6], [0.8, D - 0.3], [sheave.u, sheave.y + sheave.r - 0.3], [sheave.u, sheave.y + sheave.r + 0.3]], z: 0, t: 2, mat: "steel", name: "stern chute" },
      // the three stern sheaves in their fairings over the transom
      ...[-3.2, 0, 3.2].flatMap((z): Item[] => [
        { k: "plate", pts: [[8, D - 1.6], [-8.4, D - 1.6], [-11.4, D - 3.2], [-12.4, D - 4.8], [-12.5, D - 6.6], [-12, T + 5.6], [-10.4, T + 3.2], [-7, T + 1.8], [-1.5, T + 1.2], [4, T + 2], [8, T + 3.6]], z, t: 2.4, mat: "fairing", name: "sheave fairing" },
        { k: "rod", a: [sheave.u, sheave.y, z - 1.3], b: [sheave.u, sheave.y, z + 1.3], r: sheave.r, n: 12, mat: "steel", name: "stern sheave" },
        rod([sheave.u, sheave.y, z - 1.4], [sheave.u, sheave.y, z + 1.4], 0.5, "black", "sheave hub"),
      ]),
      // the A-frame over the stern, parked leaning inboard, on its foot blocks with its rams
      { k: "gantry", u: 3, hw: 7, y: D - 0.3, h: 13, t: 0.9, lean: -3, mat: "crane", name: "stern A-frame" },
      ...[1, -1].flatMap((sd): Item[] => [
        { k: "box", u: [2, 4], z: sd > 0 ? [6.2, 7.8] : [-7.8, -6.2], y: [D - 0.2, D + 1.2], mat: "crane", name: "A-frame foot" },
        rod([10, D + 0.4, sd * 7], [4.5, D + 6, sd * 7], 0.3, "steel", "A-frame ram"),
        { k: "box", u: [9.4, 10.6], z: sd > 0 ? [6.4, 7.6] : [-7.6, -6.4], y: [D - 0.2, D + 0.8], mat: "steel", name: "ram foot" },
      ]),
      // the deck cranes over the working deck
      { k: "crane", u: fb(94), z: 5, y: y1 - 0.4, h: 4.5, jib: 20, dir: Math.PI, lift: 0.35, name: "deck crane" },
      { k: "crane", u: 16, z: -7.5, y: D, h: 6, jib: 15, dir: Math.PI * 0.85, lift: 0.4, name: "stern crane" },
      // the forecastle bulwark white, as the sheer strake under it
      ...fittings({ L, B, D, fc: [24, 0], aft: [1.5, 29.5], draft: T, rake: 0.08 }).map((it): Item => (it.k === "bulwark" ? { ...it, mat: "stripe" } : it)),
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
    hull: { fine: true, length: L, beam: 9.1, depth: D, draft: 3, bow: "raked", stern: "cruiser", section: "round", entry: 0.35, run: 0.22, rake: 0.05, sheer: [0.3, 1.4], boot: 0.2, stripe: 0.3, screws: 2 },
    livery: { hull: "#b02a22", bottom: "#1d2024", boot: "#1d2024", stripe: "#f2f0ea", deck: "#7d6a55", house: "#f2f0ea", funnel: "#b02a22", red: "#b02a22", steel: "#c9b45a" },
    items: detailed([
      { k: "tier", u: [10, 30], y: [D - 0.1, D + 2.4], hw: 3.8, windows: [{ y: 0.9, h: 0.8, w: 0.6, pitch: 1.8 }], name: "deckhouse" },
      { k: "tier", u: [24, 30], y: [D + 2.4, D + 4.8], hw: 3, front: { y: 0.8, h: 1, w: 0.8, n: 4 }, windows: [{ y: 0.8, h: 0.9, w: 0.7, pitch: 1.3 }], name: "pilothouse" },
      funnel([17, 21], 1.3, [D + 2.4, D + 6], [["funnel", 0.8], ["black", 1]], 0.4),
      // the monitors: the tall water tower and the deck guns, brass
      { k: "cyl", u: 13, z: 0, y: [D + 2.4, D + 9.5], r: 0.35, mat: "red", name: "monitor tower" },
      rod([13, D + 9.5, 0], [15.5, D + 10.4, 0], 0.18, "steel", "tower monitor"),
      ...[[34, 1.6], [34, -1.6], [7, 2], [7, -2], [27, 0]].map(([u, z], i): Item => rod([u!, D + (i === 4 ? 4.8 : 0.1), z!], [u! + 1.2, D + (i === 4 ? 5.6 : 1.2), z! * 1.2], 0.14, "steel", `monitor ${i + 1}`)),
      mast(27, D + 4.8, D + 10, 0.1),
      { k: "bulwark", u: [0, L], h: 0.8, t: 0.15 },
      { k: "fender", u: [0, L], y: [D - 0.8, D - 0.4], out: 0.2, mat: "black", name: "rubbing strake" },
      { k: "rail", u: [11, 23], y: D + 2.4, hw: 3.4, h: 0.9, name: "deckhouse top rail" },
      { k: "cyl", u: 28.5, z: 1.6, y: [D + 4.8, D + 5.2], r: 0.25, mat: "black", name: "searchlight" },
      ...[1, -1].map((sd): Item => rod([9, D + 0.8, sd * 2.4 - 0.5], [9, D + 0.8, sd * 2.4 + 0.5], 0.45, "red", "hose reel")),
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: 31, z: sd * 3.9, y: [D + 0.6, D + 1.2], r: 0.28, n: 8, mat: "white", name: "lifebuoy" })),
      { k: "anchors", u: L - 2.4, y: D - 0.6, s: 0.9 },
      { k: "mooring", at: [2, L - 3], hw: 3.6, s: 0.4 },
      { k: "marks", at: [L * 0.85, L * 0.15], y: [1.5, 3.5], step: 0.5, s: 0.3 },
    ]),
  };
}

export function shannonSpec(): ShipSpec {
  const L = 13.6;
  const D = 2.2;
  return {
    kind: "small", small: true,
    hull: { fine: true, length: L, beam: 4.5, depth: D, draft: 0.9, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.15, transom: 0.85, rake: 0.1, sheer: [0, 0.6], boot: 0.15, stripe: 0, rudder: false },
    livery: { hull: "#1f2f4f", bottom: "#c23128", boot: "#1d2024", deck: "#2a2d30", house: "#e8712a", glass: "#20262c" },
    items: detailed([
      { k: "tier", u: [3.2, 9.2], y: [D - 0.1, D + 1.3], hw: 2.0, round: [0, 0.6], windows: [{ y: 0.5, h: 0.6, w: 0.9, pitch: 1.3 }], name: "cabin" },
      { k: "tier", u: [4.5, 8.5], y: [D + 1.3, D + 2.1], hw: 1.7, taper: [0.4, 1.8], front: { y: 0.15, h: 0.5, w: 0.8, n: 3 }, windows: [{ y: 0.15, h: 0.5, w: 0.8, pitch: 1.1 }], name: "wheelhouse" },
      { k: "cyl", u: 6, z: 0, y: [D + 2.1, D + 3.3], r: 0.08, mat: "house", name: "mast" },
      { k: "box", u: [5.6, 6.4], z: [-0.6, 0.6], y: [D + 3.3, D + 3.45], mat: "black", name: "radar" },
      { k: "box", u: [0.4, 2.6], z: [-1.8, 1.8], y: [D, D + 0.3], mat: "skirt", name: "after deck" },
      { k: "fender", u: [0, L], y: [D - 0.55, D - 0.1], out: 0.2, mat: "grey", name: "fender collar" },
      { k: "rail", u: [4.8, 8.2], y: D + 2.1, hw: 1.5, h: 0.6, mat: "house", name: "wheelhouse rail" },
      ...[0.5, -0.5].map((z): Item => ({ k: "cyl", u: 5.4, z, y: [D + 2.1, D + 3.6], r: 0.03, mat: "white", name: "antenna" })),
      { k: "cyl", u: 7.6, z: 0, y: [D + 2.1, D + 2.4], r: 0.16, mat: "yellow", name: "beacon" },
      { k: "cyl", u: 2.2, z: 1.2, y: [D + 0.3, D + 0.8], r: 0.26, n: 8, mat: "white", name: "liferaft" },
      { k: "rail", u: [9.6, 12.8], y: D, hw: 1.6, h: 0.7, mat: "house", name: "foredeck rail" },
      { k: "anchors", u: L - 1.2, y: D - 0.3, s: 0.45 },
      { k: "mooring", at: [0.8, L - 1.8], hw: 1.6, s: 0.25 },
      { k: "strakes", u: [0.4, L - 0.5], y: [D - 0.8], w: 0.08, mat: "house", name: "orange band" },
    ]),
  };
}

export function pilotBoatSpec(): ShipSpec {
  const L = 17;
  const D = 2.5;
  return {
    kind: "small", small: true,
    hull: { fine: true, length: L, beam: 5.5, depth: D, draft: 1.4, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.15, transom: 0.85, rake: 0.1, sheer: [0, 0.8], boot: 0.15, stripe: 0.4, screws: 1 },
    livery: { hull: "#1d2024", bottom: "#8f2a22", boot: "#1d2024", stripe: "#d9681e", deck: "#6b6f6c", house: "#d9681e" },
    items: detailed([
      { k: "tier", u: [7, 12.5], y: [D - 0.1, D + 2.2], hw: 2.1, round: [0, 0.8], front: { y: 1.1, h: 0.8, w: 0.9, n: 3 }, windows: [{ y: 1.1, h: 0.8, w: 1, pitch: 1.3 }], name: "wheelhouse" },
      { k: "box", u: [6.6, 13], z: [-2.5, 2.5], y: [D - 0.2, D + 0.1], mat: "skirt", name: "fender" },
      { k: "cyl", u: 9, z: 0, y: [D + 2.2, D + 4], r: 0.07, mat: "white", name: "mast" },
      { k: "box", u: [8.6, 9.4], z: [-0.7, 0.7], y: [D + 4, D + 4.15], mat: "black", name: "radar" },
      { k: "rail", u: [12.6, 16], y: D, hw: 2.1, h: 0.9, name: "foredeck rail" },
      { k: "fender", u: [0, L], y: [D - 0.8, D - 0.05], out: 0.35, mat: "skirt", name: "fender" },
      { k: "fender", u: [L - 1.4, L], y: [D - 1.4, D - 0.1], out: 0.3, mat: "skirt", name: "bow fender" },
      { k: "rail", u: [7.4, 12.2], y: D + 2.2, hw: 1.8, h: 0.7, name: "wheelhouse roof rail" },
      { k: "rail", u: [2, 6.6], y: D, hw: 2.4, h: 0.9, name: "boarding deck rail" },
      { k: "cyl", u: 11.8, z: 0.8, y: [D + 2.2, D + 2.5], r: 0.18, mat: "black", name: "searchlight" },
      ...[0.5, -0.5].map((z): Item => ({ k: "cyl", u: 8, z, y: [D + 2.2, D + 3.8], r: 0.03, mat: "white", name: "antenna" })),
      { k: "anchors", u: L - 1.6, y: D - 0.3, s: 0.5 },
      { k: "mooring", at: [1, L - 2], hw: 2.2, s: 0.3 },
    ]),
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
