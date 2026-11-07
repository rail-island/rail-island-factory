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
  // the deck box from Y - 13 to Y over the open water gap; the columns from the pontoons (13 m) into it
  const box0 = Y - 13;
  type P = [number, number, number];
  const lerp = (a: P, b: P, f: number): P => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const sdn = (sd: number): string => (sd > 0 ? "starboard" : "port");
  // the 10,000 t cranes: slewing tub, red house, the black A-frame, the lattice boom on its foot pins
  const crane = (sd: number, angle: number): Item[] => {
    const zc = sd * 30;
    const out: Item[] = [
      { k: "cyl", u: 29, z: zc, y: [Y - 0.1, 56.2], r: 14.5, mat: "black", n: 20, name: `crane ${sdn(sd)} slewing tub` },
      { k: "box", u: [10, 48], z: [zc - 15, zc + 15], y: [56, 74], mat: "red", name: `crane ${sdn(sd)} house` },
      // the operator's cab on the house's front inboard corner, its windscreen
      { k: "box", u: [47.8, 51], z: sd > 0 ? [zc - 14.6, zc - 10] : [zc + 10, zc + 14.6], y: [63, 67.5], mat: "white", name: `crane ${sdn(sd)} cab` },
      { k: "box", u: [50.9, 51.15], z: sd > 0 ? [zc - 14.2, zc - 10.4] : [zc + 10.4, zc + 14.2], y: [64.6, 66.8], mat: "glass", name: `crane ${sdn(sd)} cab window` },
      // the machinery house and the vents on the roof
      { k: "box", u: [14, 26], z: [zc - 10, zc + 10], y: [73.8, 77], mat: "white", name: `crane ${sdn(sd)} machinery house` },
      // the boom's foot pins on their brackets at the house front
      rod([47.6, 60, zc - 9.5], [47.6, 60, zc + 9.5], 1.1, "black", `crane ${sdn(sd)} boom foot pin`),
    ];
    // the A-frame: a side frame each side of the house, a back leg and a front leg meeting under the cap, girts and X-braces
    const back0: P = [12, 73.8, 0];
    const back1: P = [21, 139, 0];
    const front0: P = [45, 73.8, 0];
    const front1: P = [31, 139, 0];
    for (const dz of [-13, 13]) {
      const z = zc + dz;
      const at = (p: P): P => [p[0], p[1], z];
      // box-section legs (two plated members), girts at the platforms, one diagonal per panel
      out.push(rod(at(back0), at(back1), 1.9, "crane", `crane ${sdn(sd)} A-frame back leg`));
      out.push(rod(at(front0), at(front1), 1.9, "crane", `crane ${sdn(sd)} A-frame front leg`));
      const lv = [0.02, 0.3, 0.55, 0.78, 0.97];
      for (let k = 0; k < lv.length; k++) {
        const f = lv[k]!;
        if (k > 0) out.push(rod(at(lerp(back0, back1, f)), at(lerp(front0, front1, f)), 1, "crane", `crane ${sdn(sd)} A-frame girt`));
        if (k + 1 < lv.length) {
          const g = lv[k + 1]!;
          out.push(k % 2 ? rod(at(lerp(front0, front1, f)), at(lerp(back0, back1, g)), 0.75, "crane", `crane ${sdn(sd)} A-frame brace`) : rod(at(lerp(back0, back1, f)), at(lerp(front0, front1, g)), 0.75, "crane", `crane ${sdn(sd)} A-frame brace`));
        }
      }
      // the platforms at the girts, red-railed in the photographs: walkways along each side frame
      for (const f of [0.3, 0.55, 0.78]) {
        const pb = lerp(back0, back1, f);
        const pf = lerp(front0, front1, f);
        out.push({ k: "box", u: [pb[0] - 1, pf[0] + 1], z: [z - 2.4, z + 2.4], y: [pb[1] - 1.5, pb[1] - 1.1], mat: "steel", name: `crane ${sdn(sd)} A-frame platform` });
      }
    }
    // the ties between the side frames and the cap on top
    for (const f of [0.5, 0.82]) for (const [a, b] of [[back0, back1], [front0, front1]] as const) {
      const p = lerp(a, b, f);
      out.push(rod([p[0], p[1], zc - 13], [p[0], p[1], zc + 13], 0.7, "crane", `crane ${sdn(sd)} A-frame tie`));
    }
    out.push({ k: "box", u: [19, 33], z: [zc - 14.5, zc + 14.5], y: [138, 142.5], mat: "crane", name: `crane ${sdn(sd)} A-frame cap` });
    // the boom: four chords through three stations (narrow at the foot pins, deepest a fifth up, tapering to the head)
    const len = 144;
    const pivot: P = [47.6, 60, zc];
    const d: P = [Math.cos(angle), Math.sin(angle), 0];
    const n: P = [-Math.sin(angle), Math.cos(angle), 0];
    const st = [[0, 0.6, 9], [0.2, 4, 8], [1, 1.4, 2.4]] as const;
    const pt = (f: number, a: number, b: number): P => [pivot[0] + d[0] * len * f + n[0] * a, pivot[1] + d[1] * len * f + n[1] * a, zc + b];
    const sec = (s: readonly [number, number, number], sa: number, sb: number): P => pt(s[0], sa * s[1], sb * s[2]);
    const cs = [[1, 1], [1, -1], [-1, -1], [-1, 1]] as const;
    for (const [sa, sb] of cs) for (let k = 0; k + 1 < st.length; k++) out.push(rod(sec(st[k]!, sa, sb), sec(st[k + 1]!, sa, sb), 0.75, "crane", `crane ${sdn(sd)} boom chord`));
    // lattice: zigzag braces on the four faces
    const panels = 11;
    const stAt = (f: number): [number, number] => {
      if (f <= 0.2) return [0.6 + (4 - 0.6) * (f / 0.2), 9 + (8 - 9) * (f / 0.2)];
      const g = (f - 0.2) / 0.8;
      return [4 + (1.4 - 4) * g, 8 + (2.4 - 8) * g];
    };
    for (let k = 0; k < panels; k++) {
      const f0 = 0.04 + (0.95 * k) / panels;
      const f1 = 0.04 + (0.95 * (k + 1)) / panels;
      const [h0, w0] = stAt(f0);
      const [h1, w1] = stAt(f1);
      const zig = k % 2 ? 1 : -1;
      // the sides (+-b): from upper to lower chord; the top and bottom faces (+-a): across
      for (const sb of [1, -1]) out.push(rod(pt(f0, zig * h0, sb * w0), pt(f1, -zig * h1, sb * w1), 0.35, "crane", `crane ${sdn(sd)} boom lacing`));
      for (const sa of [1, -1]) out.push(rod(pt(f0, sa * h0, zig * w0), pt(f1, sa * h1, -zig * w1), 0.35, "crane", `crane ${sdn(sd)} boom lacing`));
    }
    const tip = pt(1, 0, 0);
    // the boom head with its sheaves, the luffing wires from the A-frame cap, the main hook on its falls
    out.push({ k: "box", u: [tip[0] - 2.4, tip[0] + 2.6], z: [zc - 2.8, zc + 2.8], y: [tip[1] - 2.2, tip[1] + 2], mat: "red", name: `crane ${sdn(sd)} boom head` });
    for (const dz of [-5.5, -3, 3, 5.5]) out.push(rod([26, 141, zc + dz], [tip[0] - 1, tip[1] + 1, zc + dz * 0.35], 0.35, "rope", `crane ${sdn(sd)} luffing wires`));
    const hookY = tip[1] - 24;
    for (const dz of [-1.2, 1.2]) out.push(rod([tip[0] + 0.5, tip[1] - 2, zc + dz], [tip[0] + 0.5, hookY + 6.8, zc + dz], 0.25, "rope", `crane ${sdn(sd)} hook falls`));
    out.push({ k: "box", u: [tip[0] - 2.5, tip[0] + 3.5], z: [zc - 2.4, zc + 2.4], y: [hookY + 2, hookY + 7], mat: "yellow", name: `crane ${sdn(sd)} hook block` });
    out.push({ k: "box", u: [tip[0] - 0.4, tip[0] + 1.4], z: [zc - 0.9, zc + 0.9], y: [hookY, hookY + 2.05], mat: "steel", name: `crane ${sdn(sd)} hook` });
    // the boom rest forward on the deck: two posts and the cradle the lowered boom lies in
    out.push(
      ...[-6, 6].map((dz): Item => ({ k: "box", u: [113, 115], z: [zc + dz - 1, zc + dz + 1], y: [Y - 0.1, 66.2], mat: "crane", name: `boom rest ${sdn(sd)} post` })),
      { k: "box", u: [112.5, 115.5], z: [zc - 8, zc + 8], y: [66, 67.6], mat: "yellow", name: `boom rest ${sdn(sd)} cradle` },
      ...[-1, 1].map((s): Item => rod([114, Y, zc + s * 9], [114, 64, zc + s * 6.5], 0.35, "crane", `boom rest ${sdn(sd)} brace`)),
    );
    return out;
  };
  // the accommodation forward: 7 decks, its lifeboats on platforms along each side, under davits
  const hw = 26;
  const Pt = Y + 3.45;
  const boats = [170, 180, 190];
  const boatItems: Item[] = [
    ...[1, -1].flatMap((sd): Item[] => [
      { k: "box", u: [165, 195], z: sd > 0 ? [hw - 0.2, hw + 3.4] : [-hw - 3.4, -hw + 0.2], y: [Pt - 0.4, Pt], mat: "steel", name: `boat platform ${sdn(sd)}` },
      ...boats.flatMap((u): Item[] => [-3.6, 3.6].flatMap((du): Item[] => [
        rod([u + du, Pt - 0.1, sd * (hw + 3.1)], [u + du, Pt + 4.6, sd * (hw + 3.1)], 0.18, "steel", "davit"),
        rod([u + du, Pt + 4.6, sd * (hw + 3.1)], [u + du, Pt + 5.6, sd * (hw - 0.2)], 0.18, "steel", "davit arm"),
        rod([u + du * 0.8, Pt + 4.5, sd * (hw + 1.3)], [u + du * 0.8, Pt + 2.4, sd * (hw + 1.3)], 0.06, "rope", "davit fall"),
      ])),
    ]),
    { k: "boats", at: boats, z: hw + 1.3, y: Pt + 1.35, len: 9, r: 1.45, name: "lifeboats" },
  ];
  // the helideck cantilevered over the bow at the fourth deck, on its trusses to the deck box front and the house
  const hy = Y + 12;
  const helideck: Item[] = [
    { k: "helideck", u: 213, y: hy, r: 13, name: "helideck" },
    { k: "box", u: [203.5, 222.5], z: [-9, 9], y: [hy - 1.3, hy + 0.1], mat: "steel", name: "helideck girders" },
    { k: "box", u: [199.6, 203.6], z: [-1.6, 1.6], y: [hy - 0.3, hy + 0.05], mat: "steel", name: "helideck access bridge" },
    ...[-8, 8].flatMap((z): Item[] => [
      rod([204, hy - 1.2, z], [203, Y, z * 1.1], 0.55, "steel", "helideck post"),
      rod([213, hy - 1.2, z], [204, Y, z * 1.1], 0.4, "steel", "helideck truss"),
      rod([222, hy - 1.2, z], [217.6, Y - 6, z], 0.55, "steel", "helideck knee brace"),
      rod([213, hy - 1.2, z], [217.6, Y - 3, z], 0.4, "steel", "helideck truss"),
    ]),
    rod([204, Y + 5, -8.8], [204, Y + 5, 8.8], 0.35, "steel", "helideck tie"),
    rod([217.6, Y - 4.5, -8], [217.6, Y - 4.5, 8], 0.35, "steel", "helideck tie"),
  ];
  // the funnel casings beside the accommodation, two each side, their exhaust pipes
  const casings: Item[] = [1, -1].flatMap((sd): Item[] => [[127, 140], [143, 156]].flatMap(([a, b]): Item[] => [
    { k: "box", u: [a!, b!], z: sd > 0 ? [36, 49] : [-49, -36], y: [Y - 0.1, 81], mat: "red", name: `funnel casing ${sdn(sd)}` },
    { k: "box", u: [a! + 1, b! - 1], z: sd > 0 ? [35.8, 49.2] : [-49.2, -35.8], y: [66, 68], mat: "steel", name: "casing louvres" },
    ...[0.2, 0.4, 0.6, 0.8].map((f): Item => ({ k: "cyl", u: a! + (b! - a!) * f, z: sd * 42.5, y: [80.5, 84.5], r: 0.9, mat: "black", n: 8, name: "exhaust pipe" })),
  ]));
  // the auxiliary cranes on the bow corners: red pedestal and cab, black lattice jib
  const aux = (sd: number): Item[] => {
    const u = 205;
    const z = sd * 42;
    const a: P = [u - 1.5, Y + 15, z];
    const b: P = [u - 22, Y + 53, z - sd * 3];
    return [
      { k: "cyl", u, z, y: [Y - 0.1, Y + 13], r: 2, mat: "red", n: 10, name: `auxiliary crane ${sdn(sd)} pedestal` },
      { k: "box", u: [u - 3, u + 3], z: [z - 2.5, z + 2.5], y: [Y + 12.8, Y + 17], mat: "red", name: `auxiliary crane ${sdn(sd)} house` },
      rod([a[0], a[1], z - 1.2], b, 0.45, "crane", "auxiliary crane jib"),
      rod([a[0], a[1], z + 1.2], b, 0.45, "crane", "auxiliary crane jib"),
      rod([u + 1, Y + 17, z], b, 0.12, "rope", "auxiliary crane pendant"),
      rod(b, [b[0], b[1] - 12, b[2]], 0.1, "rope", "auxiliary crane hook wire"),
      { k: "box", u: [b[0] - 0.6, b[0] + 0.6], z: [b[2] - 0.6, b[2] + 0.6], y: [b[1] - 13.2, b[1] - 11.95], mat: "yellow", name: "auxiliary crane hook" },
    ];
  };
  // the columns: four on each pontoon, the corner ones longest, flared into the pontoon at their feet
  const cols: ReadonlyArray<readonly [number, number]> = [[2, 34], [68, 96], [124, 152], [182, 218]];
  const columns: Item[] = cols.flatMap(([a, b]): Item[] => [1, -1].flatMap((sd): Item[] => {
    const z: [number, number] = sd > 0 ? [26, 49.8] : [-49.8, -26];
    const zm = (z[0] + z[1]) / 2;
    return [
      { k: "box", u: [a, b], z, y: [12.9, box0 + 0.2], mat: "hull", name: `column ${a} ${sd > 0 ? "s" : "p"}` },
      ...(a > 2 ? [{ k: "plate", pts: [[a + 0.2, 12.95], [a - 4, 12.95], [a + 0.2, 19]], z: zm, t: 23.2, mat: "hull", name: "column flare" } as Item] : []),
      ...(b < 218 ? [{ k: "plate", pts: [[b - 0.2, 12.95], [b + 4, 12.95], [b - 0.2, 19]], z: zm, t: 23.2, mat: "hull", name: "column flare" } as Item] : []),
      // the anchor fairleads on the columns' outer faces
      { k: "box", u: [(a + b) / 2 - 1.5, (a + b) / 2 + 1.5], z: sd > 0 ? [49.7, 50.6] : [-50.6, -49.7], y: [30, 34], mat: "steel", name: "fairlead" },
    ];
  }));
  return {
    kind: "service",
    // the two pontoons, awash at the transit draught; the columns rise to the deck box
    hull: { length: L, beam: 102, depth: 13, draft: 12, twin: 26, bow: "barge", stern: "sternwheel", section: "flat", entry: 0.06, run: 0.04, transom: 0.92, rake: 0.04, boot: 0.6, stripe: 0, rudder: false, fine: true },
    livery: { hull: "#22272e", bottom: "#7d2a24", boot: "#2e3338", deck: "#6b6f6c", house: "#f2f0ea", crane: "#1f2328", red: "#c8302a" },
    items: [
      ...columns,
      { k: "box", u: [2, 218], z: [-50, 50], y: [box0, Y], mat: "hull", name: "deck box" },
      { k: "rail", u: [3, 217], y: Y, hw: 49.6, h: 1.1, mat: "steel", name: "deck box railing" },
      ...deckhouse({ u: [164, 200], y0: Y, decks: 7, hw, h: 3.2, wings: 29, detail: true }),
      { k: "mast", u: 192, y: [Y + 22.3, Y + 38], r: 0.45, yards: [[Y + 33, 4]], radar: true, mat: "white", name: "radar mast" },
      ...boatItems,
      ...helideck,
      ...casings,
      // the deck's sea fastening grillage, deck containers, the mooring winches on the corners
      { k: "box", u: [78, 108], z: [-22, 22], y: [Y - 0.05, Y + 1.2], mat: "steel", top: false, name: "grillage" },
      ...[84, 94, 104].map((u): Item => ({ k: "box", u: [u - 0.6, u + 0.6], z: [-22, 22], y: [Y + 1.2, Y + 2.4], mat: "yellow", name: "grillage beam" })),
      { k: "containers", u: [56, 72], bays: 2, hw: 10, y: Y, tiers: 1, seed: 71, rows: 2.5, name: "deck containers" },
      ...[[5, 44], [5, -44], [214, 44], [214, -44]].map(([u, z]): Item => ({ k: "box", u: [u! - 2.5, u! + 2.5], z: [z! - 3, z! + 3], y: [Y - 0.1, Y + 3.4], mat: "steel", name: "mooring winch" })),
      // the two cranes on the stern corners, their booms raised forward (starboard 50, port 58 degrees)
      ...crane(1, (50 * Math.PI) / 180),
      ...crane(-1, (58 * Math.PI) / 180),
      ...aux(1),
      ...aux(-1),
      { k: "marks", at: [L * 0.9, L * 0.5, L * 0.1], y: [8, 13], step: 1, s: 1 },
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

export function cableLayerSpec(): ShipSpec {
  const L = 140;
  const D = 12;
  const B = 30;
  return {
    kind: "service",
    hull: { length: L, beam: B, depth: D, draft: 7, bow: "raked", stern: "transom", section: "round", entry: 0.28, run: 0.12, transom: 0.9, rake: 0.05, sheer: [0, 2], forecastle: [34, 2.8], boot: 0.6, stripe: 0, screws: 2, fine: true },
    livery: { hull: "#23426e", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#23426e", crane: "#e8bf2a" },
    items: [
      ...deckhouse({ u: [108, 130], y0: D + 2.6, decks: 5, hw: 14, h: 2.9, wings: 15, detail: true }),
      mast(122, D + 2.6 + 5 * 2.9, D + 26, 0.3),
      { k: "helideck", u: 118, y: D + 2.6 + 5 * 2.9 + 1.4, r: 10, legs: 4 },
      ...[8, -8].flatMap((z): Item[] => [funnel([100, 106], 2.2, [D + 2.6, D + 16], [["funnel", 0.85], ["black", 1]], 0.3, z), { k: "cyl", u: 104.4, z, y: [D + 15.6, D + 17.2], r: 0.4, mat: "black", name: "exhaust pipe" }]),
      // the cable carousel with its rim and cone, its loading arm, the tensioners, the stern chute and sheaves
      { k: "cyl", u: 62, z: 0, y: [D - 0.2, D + 5.5], r: 14, mat: "steel", n: 20, name: "carousel" },
      { k: "cyl", u: 62, z: 0, y: [D + 5.5, D + 6], r: 14.4, mat: "yellow", n: 20, name: "carousel rim" },
      { k: "cyl", u: 62, z: 0, y: [D + 5.5, D + 6.5], r: 3, mat: "grey", n: 12, name: "carousel hub" },
      { k: "domes", u: [62, 62], n: 1, r: 4, y: D + 6.5, h: 1, mat: "grey", name: "carousel cone" },
      { k: "gantry", u: 62, hw: 14.4, y: D, h: 9, t: 0.6, mat: "crane", name: "loading arm" },
      { k: "box", u: [20, 40], z: [-1.6, 1.6], y: [D, D + 2.4], mat: "grey", name: "tensioners" },
      ...[24, 30, 36].map((u): Item => ({ k: "box", u: [u - 1.2, u + 1.2], z: [-2.2, 2.2], y: [D + 2.4, D + 3.4], mat: "yellow", name: "tensioner frame" })),
      { k: "box", u: [4, 20], z: [-0.8, 0.8], y: [D + 1, D + 1.6], mat: "steel", name: "cable chute" },
      rod([1, D + 1.6, -4], [1, D + 1.6, 4], 2.2, "crane", "stern sheaves"),
      { k: "gantry", u: 5, hw: 8, y: D, h: 11, t: 0.8, lean: 2, mat: "crane", name: "stern A-frame" },
      // the plough on the deck and the ROV hangar beside its launch frame
      { k: "box", u: [8, 18], z: [7, 12], y: [D, D + 3.6], mat: "yellow", name: "cable plough" },
      { k: "tier", u: [84, 98], y: [D - 0.2, D + 6], hw: 12, lip: 0.3, windows: [{ y: 0.4, h: 4.6, w: 5, pitch: 8, from: 88, to: 94, mat: "grey" }], name: "ROV hangar" },
      { k: "gantry", u: 90, hw: 3, y: D + 6, h: 5, t: 0.5, mat: "crane", name: "ROV launch frame" },
      { k: "crane", u: 80, z: -12, y: D, h: 5, jib: 22, dir: -Math.PI * 0.95 },
      { k: "freefall", u: 104, y: D + 3, len: 8, tilt: 0.55 },
      ...fittings({ L, B, D, fc: [34, 2.8], aft: [], draft: 7 }),
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
/**
 * The crane vessel from afar: the twin pontoons' plan rings alone take the kit's whole
 * 100 triangles, so its distant model is drawn from blocks instead - the deck box on its
 * four corner columns (down to the pontoons, under the water), the crane houses, the
 * A-frames and the raised booms.
 */
export function shipCraneVesselLod(): MeshBuilder {
  const s = craneVesselSpec();
  const Y = 49.5;
  const boom = (sd: number, deg: number): Item => {
    const a = (deg * Math.PI) / 180;
    return { k: "boom", a: [47.6, 60, sd * 30], b: [47.6 + 144 * Math.cos(a), 60 + 144 * Math.sin(a), sd * 30], w: 3.5, mat: "crane", name: "boom" };
  };
  return shipLod({
    kind: s.kind, hull: null, length: 220, livery: s.livery,
    items: [
      ...[[2, 34], [182, 218]].flatMap(([a, b]): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [a!, b!], z: sd > 0 ? [26, 49.8] : [-49.8, -26], y: [0, Y - 13.2], mat: "hull", name: "column" }))),
      { k: "box", u: [2, 218], z: [-50, 50], y: [Y - 13, Y], mat: "hull", name: "deck box" },
      ...[1, -1].flatMap((sd): Item[] => [
        { k: "box", u: [10, 48], z: [sd * 30 - 15, sd * 30 + 15], y: [Y, 74], mat: "red", name: "crane house" },
        { k: "boom", a: [28, 74, sd * 30], b: [26, 141, sd * 30], w: 5, mat: "crane", name: "A-frame" },
      ]),
      boom(1, 50),
      boom(-1, 58),
    ],
  });
}
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
