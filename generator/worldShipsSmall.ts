// The world's sailing ships and small craft (docs/models/world-ships-small.md):
// tall ships and a schooner, traditional craft under lateen, junk, sprit and
// crab-claw sails, a Viking longship, canal and river boats, and yachts and
// runabouts, each a ShipSpec on the hull kit (hullKit.ts) at its real size,
// modelled on the photographs in assets/<references>/ and the published figures
// in each folder's SOURCES.md. Metres from the stern (u), heights from the keel.
// The ids are stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { shipLod, worldShip, type Item, type Mast, type Sail, type ShipSpec } from "./hullKit.ts";
import { colourParam, funnel, pick, shipDesigns, type WorldShip } from "./worldShips.ts";

const COLOURS: Record<string, string> = { white: "#f2f0ea", green: "#2f6a45", blue: "#23426e", red: "#b02a22", yellow: "#e8bf2a", black: "#1d2024", navy: "#1f2f4f", grey: "#7d8287", orange: "#d9681e" };

/** A square-rigged mast's sails from the course up: [bottom, top, half-span at the foot] each, tapering 6 %. */
function squares(rows: ReadonlyArray<readonly [number, number, number]>): Sail[] {
  return rows.map(([y0, y1, w]) => ({ kind: "square" as const, y: [y0, y1] as const, w: [w, w * 0.94] as const }));
}

/** A tall ship's mast: its height and its square sails stepped from the deck at D. */
function squareMast(u: number, D: number, top: number, spans: readonly number[], r = 0.45): Mast {
  const n = spans.length;
  const y0 = D + 3;
  const yt = top - 4;
  const h = (yt - y0) / n;
  return { u, y: [D, top], r, sails: squares(spans.map((w, i) => [y0 + h * i + 0.3, y0 + h * (i + 1), w] as const)) };
}

/** A mast with head sails added to its own. */
function withJibs(ms: Mast, jibs: readonly Sail[]): Mast {
  return { ...ms, sails: [...ms.sails, ...jibs] };
}

// ---------------------------------------------------------------------------
// tall ships and schooners

export function sedovSpec(): ShipSpec {
  const L = 108;
  const D = 8.5;
  return {
    kind: "sail",
    hull: { length: L, beam: 14.6, depth: D, draft: 6.3, bow: "clipper", stern: "cruiser", section: "keel", entry: 0.3, run: 0.2, rake: 0.06, sheer: [1.2, 2.2], forecastle: [14, 2.2], poop: [16, 2.2], boot: 0.3, stripe: 1.4, screws: 1 },
    livery: { hull: "#1d2024", stripe: "#f2f0ea", bottom: "#b02a22", boot: "#1d2024", deck: "#a07a52", house: "#f2f0ea", sail: "#efe9da", spar: "#3b3f43" },
    items: [
      { k: "tier", u: [44, 60], y: [D - 0.1, D + 2.4], hw: 4, windows: [{ y: 0.9, h: 0.8, w: 0.8, pitch: 1.8 }], name: "midship house" },
      { k: "tier", u: [6, 14], y: [D + 2, D + 4.2], hw: 3.4, front: { y: 0.6, h: 0.9, w: 0.8, n: 4 }, name: "chart house" },
      {
        k: "rig", bowsprit: { len: 9.5, rise: 3 },
        masts: [
          withJibs(squareMast(86, D, 56, [10.5, 9.6, 9, 7.6, 6.6, 5.2]), [{ kind: "jib", y: [D + 6, D + 38], tack: L + 9, len: 14 }, { kind: "jib", y: [D + 5, D + 30], tack: L + 5, len: 12 }]),
          squareMast(64, D, 58, [11, 10, 9.4, 8, 7, 5.6]),
          squareMast(42, D, 56, [10.5, 9.6, 9, 7.6, 6.6, 5.2]),
          { u: 20, y: [D, 46], r: 0.4, sails: [{ kind: "gaff", y: [D + 3, D + 22], len: 15, head: 11 }, { kind: "gaff", y: [D + 24, D + 32], len: 10, head: 0.5 }] },
        ],
      },
      { k: "boats", at: [52], z: 6.4, y: D + 2.6, len: 7, r: 0.9, mat: "white" },
    ],
  };
}

export function cuttySarkSpec(): ShipSpec {
  const L = 64.7;
  const D = 6.6;
  return {
    kind: "sail",
    hull: { length: L, beam: 11, depth: D, draft: 6.1, bow: "clipper", stern: "cruiser", section: "keel", entry: 0.36, run: 0.28, rake: 0.07, sheer: [1.4, 2.2], forecastle: [9, 1.8], poop: [12, 1.6], boot: 0, stripe: 0.4, screws: 0 },
    livery: { hull: "#1d2024", stripe: "#c9a14a", bottom: "#b87333", deck: "#a07a52", house: "#f2f0ea", sail: "#efe9da", spar: "#3b2a1a", mast: "#8a6a3a" },
    items: [
      { k: "tier", u: [30, 38], y: [D - 0.1, D + 2.2], hw: 2.6, mat: "wood", windows: [{ y: 0.9, h: 0.6, w: 0.6, pitch: 1.6 }], name: "deckhouse" },
      { k: "tier", u: [42, 47], y: [D - 0.1, D + 2.0], hw: 2.2, mat: "wood", name: "forward house" },
      {
        k: "rig", bowsprit: { len: 12, rise: 3 },
        masts: [
          withJibs(squareMast(48, D, 44, [8, 7.2, 6.6, 5.6, 4.6, 3.6], 0.4), [{ kind: "jib", y: [D + 4, D + 30], tack: L + 11, len: 11 }, { kind: "jib", y: [D + 3, D + 22], tack: L + 6, len: 9 }]),
          squareMast(34, D, 47, [8.6, 7.8, 7, 6, 5, 4], 0.45),
          // the mizzen's spanker in place of a crossjack
          { ...squareMast(20, D, 38, [6.6, 6, 5.2, 4.4, 3.6], 0.35), sails: [...squareMast(20, D, 38, [6.6, 6, 5.2, 4.4, 3.6], 0.35).sails.slice(1), { kind: "gaff", y: [D + 3, D + 13], len: 11, head: 7 }] },
        ],
      },
    ],
  };
}

export function bluenoseSpec(): ShipSpec {
  const L = 43.6;
  const D = 5.2;
  return {
    kind: "sail",
    hull: { length: L, beam: 8.2, depth: D, draft: 4.8, bow: "clipper", stern: "transom", section: "keel", entry: 0.4, run: 0.3, transom: 0.4, rake: 0.1, sheer: [0.6, 1.6], boot: 0.15, stripe: 0.25, screws: 0 },
    livery: { hull: "#1d2024", stripe: "#f2f0ea", bottom: "#b02a22", boot: "#f2f0ea", deck: "#a07a52", house: "#f2f0ea", sail: "#efe9da", spar: "#c9a14a" },
    items: [
      { k: "tier", u: [6, 10], y: [D - 0.1, D + 0.9], hw: 1.6, mat: "white", name: "after house" },
      {
        k: "rig", bowsprit: { len: 7, rise: 1.2 },
        masts: [
          { u: 29, y: [D, D + 31], r: 0.3, sails: [{ kind: "gaff", y: [D + 1.6, D + 20], len: 11, head: 8 }, { kind: "gaff", y: [D + 21, D + 29], len: 6, head: 0.4 }, { kind: "jib", y: [D + 2, D + 21], tack: L + 6, len: 9 }, { kind: "jib", y: [D + 1.4, D + 16], tack: L - 0.5, len: 6 }] },
          { u: 16, y: [D, D + 35], r: 0.32, sails: [{ kind: "gaff", y: [D + 1.6, D + 24], len: 16, head: 11 }, { kind: "gaff", y: [D + 25, D + 33], len: 7, head: 0.4 }] },
        ],
      },
    ],
  };
}

export function greatBritainSpec(): ShipSpec {
  const L = 98;
  const D = 9.8;
  return {
    kind: "sail",
    hull: { length: L, beam: 15.4, depth: D, draft: 5.5, bow: "clipper", stern: "cruiser", section: "round", entry: 0.3, run: 0.22, rake: 0.04, sheer: [0.8, 1.6], boot: 0, stripe: 1.4, screws: 1 },
    livery: { hull: "#1d2024", stripe: "#f2f0ea", bottom: "#b02a22", deck: "#a07a52", house: "#f2f0ea", sail: "#efe9da", spar: "#3b2a1a", funnel: "#1d2024" },
    items: [
      { k: "portholes", u: [12, 88], y: D - 0.7, pitch: 3.2, r: 0.35, mat: "black", name: "gunports" },
      funnel([50, 54], 1.6, [D - 0.1, D + 11], [["funnel", 1]], 0.6),
      { k: "tier", u: [46, 58], y: [D - 0.1, D + 1.6], hw: 4, mat: "wood", name: "skylights" },
      {
        k: "rig", bowsprit: { len: 9, rise: 2.4 },
        masts: [
          { u: 84, y: [D, D + 30], r: 0.4, sails: [{ kind: "gaff", y: [D + 2, D + 18], len: 9, head: 6 }, { kind: "jib", y: [D + 3, D + 22], tack: L + 8, len: 10 }] },
          { ...squareMast(70, D, D + 34, [7.6, 6.8, 5.8], 0.45) },
          ...[40, 30, 20, 10].map((u): Mast => ({ u, y: [D, D + 28], r: 0.36, sails: [{ kind: "gaff", y: [D + 2, D + 17], len: 8.5, head: 6 }] })),
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// traditional sailing craft

export function thamesBargeSpec(): ShipSpec {
  const L = 25;
  const D = 2;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 6, depth: D, draft: 1, bow: "plumb", stern: "transom", section: "flat", entry: 0.22, run: 0.12, transom: 0.7, sheer: [0.3, 0.6], boot: 0.1, stripe: 0.3, rudder: true, screws: 0 },
    livery: { hull: "#1d2024", stripe: "#c23128", bottom: "#1d2024", boot: "#c9a14a", deck: "#7d6a55", house: "#7d6a55", sail: "#9a4a2a", spar: "#5a3b20", wood: "#4a3420" },
    items: [
      { k: "box", u: [6, 19], z: [-2.4, 2.4], y: [D - 0.1, D + 0.6], mat: "house", name: "hatch coamings" },
      { k: "plate", pts: [[9, 0.2], [13, 0.4], [13, D + 0.3], [9, D + 0.3]], z: 3.1, t: 0.15, mat: "wood", name: "starboard leeboard" },
      { k: "plate", pts: [[9, 0.2], [13, 0.4], [13, D + 0.3], [9, D + 0.3]], z: -3.1, t: 0.15, mat: "wood", name: "port leeboard" },
      {
        k: "rig", bowsprit: { len: 3, rise: 0.6 },
        masts: [
          { u: 17, y: [D, D + 24], r: 0.25, sails: [{ kind: "sprit", y: [D + 0.8, D + 14], len: 10, head: 8 }, { kind: "gaff", y: [D + 15, D + 22], len: 5, head: 0.3 }, { kind: "jib", y: [D + 1, D + 13], tack: L + 2.6, len: 6 }] },
          { u: 1, y: [D, D + 8], r: 0.12, sails: [{ kind: "sprit", y: [D + 1, D + 7], len: 3, head: 2.6 }] },
        ],
      },
    ],
  };
}

export function dhowSpec(): ShipSpec {
  const L = 20;
  const D = 3;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 6, depth: D, draft: 2.5, bow: "clipper", stern: "transom", section: "round", entry: 0.4, run: 0.25, transom: 0.6, rake: 0.18, sheer: [1.2, 1.4], poop: [5, 0.8], boot: 0.1, stripe: 0.3, screws: 0 },
    livery: { hull: "#a87a4a", stripe: "#f2f0ea", bottom: "#f2f0ea", boot: "#5a3b20", deck: "#8a5a33", sail: "#f2ead8", spar: "#5a3b20" },
    items: [
      { k: "rig", masts: [{ u: 12, y: [D, D + 15], r: 0.25, rake: -1.2, sails: [{ kind: "lateen", y: [D + 1.6, D + 19], len: 22, fwd: 9.5 }] }] },
      { k: "box", u: [1, 5], z: [-2.4, 2.4], y: [D + 0.7, D + 1.6], mat: "wood", name: "poop rail" },
    ],
  };
}

export function junkSpec(): ShipSpec {
  const L = 30;
  const D = 3.5;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 7, depth: D, draft: 2.5, bow: "barge", stern: "transom", section: "round", entry: 0.18, run: 0.22, transom: 0.7, rake: 0.08, sheer: [2.4, 1.4], poop: [8, 1.6], boot: 0.1, stripe: 0.4, screws: 0 },
    livery: { hull: "#5a3b20", stripe: "#c23128", bottom: "#2b2d30", boot: "#2b2d30", deck: "#8a5a33", house: "#8a5a33", sail: "#a8452e", spar: "#3b2a1a" },
    items: [
      { k: "tier", u: [1.5, 7], y: [D + 1.4, D + 3.2], hw: 2.4, mat: "house", top: "red", name: "stern cabin" },
      {
        k: "rig", stays: false,
        masts: [
          { u: 25, y: [D, D + 14], r: 0.22, rake: -0.8, sails: [{ kind: "junk", y: [D + 1.6, D + 13], len: 7 }] },
          { u: 16, y: [D, D + 21], r: 0.3, sails: [{ kind: "junk", y: [D + 1.6, D + 20], len: 11 }] },
          { u: 6, y: [D + 1.4, D + 13], r: 0.18, sails: [{ kind: "junk", y: [D + 3.4, D + 12.4], len: 5.5 }] },
        ],
      },
    ],
  };
}

export function feluccaSpec(): ShipSpec {
  const L = 9;
  const D = 1;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 3, depth: D, draft: 0.6, bow: "clipper", stern: "transom", section: "round", entry: 0.45, run: 0.25, transom: 0.6, rake: 0.15, sheer: [0.3, 0.5], boot: 0.08, stripe: 0.15, screws: 0 },
    livery: { hull: "#f2f0ea", stripe: "#2a6fae", bottom: "#2a6fae", boot: "#1d2024", deck: "#a07a52", sail: "#f4efe2", spar: "#5a3b20" },
    items: [
      { k: "rig", stays: false, masts: [{ u: 6, y: [D, D + 7], r: 0.1, sails: [{ kind: "lateen", y: [D + 0.6, D + 12], len: 14, fwd: 5 }] }] },
    ],
  };
}

export function vikingSpec(): ShipSpec {
  const L = 23;
  const D = 1.6;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 5.2, depth: D, draft: 1, bow: "canoe", stern: "canoe", section: "vee", entry: 0.36, run: 0.36, rake: 0.14, sheer: [1.8, 2], boot: 0, stripe: 0.2, rudder: false },
    livery: { hull: "#8a5a33", stripe: "#5a3b20", bottom: "#3b2a1a", deck: "#a07a52", sail: "#b02a22", spar: "#5a3b20", yellow: "#e8bf2a", red: "#b02a22" },
    items: [
      // the shields along the gunwale, the steering oar, the stem's dragon
      { k: "portholes", u: [6, 17], y: D - 0.05, pitch: 1.1, r: 0.42, mat: "yellow", name: "shields" },
      { k: "plate", pts: [[L - 0.3, D + 1.6], [L + 0.5, D + 2.6], [L + 0.1, D + 3.2], [L - 0.5, D + 2.2]], z: 0, t: 0.15, mat: "wood", name: "dragon head" },
      { k: "plate", pts: [[2.2, 0.3], [2.8, 0.3], [3.4, D + 1.2], [2.9, D + 1.2]], z: 2.5, t: 0.12, mat: "wood", name: "steering oar" },
      { k: "rig", stays: true, masts: [{ u: 11.5, y: [D, D + 11], r: 0.18, sails: [{ kind: "square", y: [D + 2.4, D + 10.4], w: [5.2, 5] }] }] },
    ],
  };
}

export function voyagingCanoeSpec(): ShipSpec {
  const L = 18.7;
  const D = 1.6;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 5.4, depth: D, draft: 0.75, twin: 1.4, bow: "canoe", stern: "canoe", section: "vee", entry: 0.36, run: 0.36, rake: 0.1, sheer: [0.8, 0.9], boot: 0, stripe: 0.3, rudder: false },
    livery: { hull: "#3b2a1a", stripe: "#c9a14a", bottom: "#1d2024", deck: "#3b2a1a", sail: "#d9c79a", spar: "#5a3b20", wood: "#8a6a3a" },
    items: [
      { k: "box", u: [3, 15.7], z: [-2.7, 2.7], y: [D + 0.1, D + 0.3], mat: "wood", name: "deck platform" },
      ...[4, 7.6, 11.2, 14.8].map((u, i): Item => ({ k: "rod", a: [u, D + 0.05, -2.78], b: [u, D + 0.05, 2.78], r: 0.12, mat: "spar", name: `cross beam ${i + 1}` })),
      { k: "box", u: [7, 10], z: [-1.2, 1.2], y: [D + 0.3, D + 1.2], mat: "sail", name: "deck shelter" },
      { k: "rig", stays: false, masts: [
        { u: 12.4, y: [D, D + 9], r: 0.12, sails: [{ kind: "crabclaw", y: [D + 0.6, D + 11], len: 8, fwd: 2 }] },
        { u: 6.6, y: [D, D + 8], r: 0.11, sails: [{ kind: "crabclaw", y: [D + 0.6, D + 9.5], len: 7, fwd: 1.6 }] },
      ] },
      { k: "plate", pts: [[0.3, 0.4], [0.8, 0.4], [1.6, D + 1.4], [1.1, D + 1.4]], z: 2, t: 0.1, mat: "wood", name: "steering paddle" },
    ],
  };
}

// ---------------------------------------------------------------------------
// canal and river craft

export const NARROWBOAT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["green", "Green"], ["red", "Red"], ["blue", "Blue"], ["black", "Black"])];
export function narrowboatSpec(p?: ParamValues): ShipSpec {
  const L = 21;
  const D = 1.0;
  const c = COLOURS[pick(NARROWBOAT_PARAMS, p, "colour")]!;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 2.08, depth: D, draft: 0.6, bow: "raked", stern: "cruiser", section: "flat", entry: 0.14, run: 0.1, rake: 0.04, sheer: [0.1, 0.35], boot: 0.08, stripe: 0, screws: 1 },
    livery: { hull: "#1d2024", bottom: "#1d2024", boot: "#c23128", deck: "#3b3f43", house: c, roof: "#c23128", yellow: "#e8bf2a" },
    items: [
      { k: "tier", u: [2.4, 18.2], y: [D - 0.05, D + 1.2], hw: 0.98, windows: [{ y: 0.4, h: 0.45, w: 0.5, pitch: 1.4 }], name: "cabin" },
      { k: "box", u: [2.6, 18], z: [0.99, 1.01], y: [D + 0.95, D + 1.05], mat: "yellow", name: "starboard coach line" },
      { k: "box", u: [2.6, 18], z: [-1.01, -0.99], y: [D + 0.95, D + 1.05], mat: "yellow", name: "port coach line" },
      { k: "cyl", u: 16.8, z: 0.4, y: [D + 1.2, D + 1.75], r: 0.07, mat: "black", name: "chimney" },
      { k: "box", u: [10, 13], z: [-0.3, 0.3], y: [D + 1.2, D + 1.35], mat: "wood", name: "roof plank" },
    ],
  };
}

export function kettuvallamSpec(): ShipSpec {
  const L = 20;
  const D = 1.4;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 4.5, depth: D, draft: 0.8, bow: "canoe", stern: "canoe", section: "round", entry: 0.32, run: 0.32, rake: 0.12, sheer: [0.6, 0.8], boot: 0, stripe: 0.25, rudder: false },
    livery: { hull: "#4a3420", stripe: "#6b4a2a", bottom: "#2b2018", deck: "#8a6a3a", canopy: "#b8945a", wood: "#6b4a2a" },
    items: [
      // the thatched coir and bamboo roof on its posts, the cabin under it
      { k: "box", u: [4.5, 15.5], z: [-1.9, 1.9], y: [D - 0.05, D + 1.4], mat: "wood", name: "cabin walls" },
      { k: "canopy", u: [3, 17], hw: 2.15, y: D + 1.4, h: 1.5, mat: "canopy", posts: "wood", name: "thatched roof" },
      { k: "canopy", u: [15.6, 17.6], hw: 1.4, y: D + 1.4, h: 1, mat: "canopy", name: "bow canopy" },
    ],
  };
}

export function gondolaSpec(): ShipSpec {
  const L = 11;
  const D = 0.6;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 1.4, depth: D, draft: 0.25, bow: "canoe", stern: "canoe", section: "round", entry: 0.38, run: 0.36, rake: 0.16, sheer: [0.7, 0.9], boot: 0, stripe: 0.08, rudder: false },
    livery: { hull: "#16181b", stripe: "#c9a14a", bottom: "#16181b", deck: "#3b2a1a", steel: "#c9c9c4", red: "#8f2a22", wood: "#3b2a1a" },
    items: [
      // the ferro on the bow, the forcola and the oar, the seats
      { k: "plate", pts: [[L - 0.4, D + 0.6], [L + 0.35, D + 0.8], [L + 0.35, D + 1.7], [L - 0.1, D + 1.5]], z: 0, t: 0.03, mat: "steel", name: "ferro" },
      { k: "box", u: [4.2, 6], z: [-0.55, 0.55], y: [D - 0.2, D + 0.15], mat: "red", name: "seats" },
      { k: "cyl", u: 2.3, z: 0.55, y: [D - 0.05, D + 0.55], r: 0.07, mat: "wood", name: "forcola" },
      { k: "rod", a: [2.3, D + 0.55, 0.6], b: [0.2, 0.05, 1.6], r: 0.04, mat: "wood", name: "oar" },
    ],
  };
}

export function longtailSpec(): ShipSpec {
  const L = 10;
  const D = 0.8;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 1.8, depth: D, draft: 0.4, bow: "canoe", stern: "transom", section: "round", entry: 0.4, run: 0.15, transom: 0.6, rake: 0.25, sheer: [0.1, 1.1], boot: 0, stripe: 0.12, rudder: false },
    livery: { hull: "#6b4a2a", stripe: "#2a6fae", bottom: "#4a3420", deck: "#8a6a3a", steel: "#9ba1a4", red: "#c23128", yellow: "#e8bf2a", green: "#2f7a4b", canopy: "#2a6fae" },
    items: [
      // the car engine on its swivel and the long shaft to the propeller astern
      { k: "box", u: [0.4, 1.3], z: [-0.3, 0.3], y: [D + 0.1, D + 0.65], mat: "steel", name: "engine" },
      { k: "rod", a: [0.85, D + 0.35, 0], b: [-3.8, 0.08, 0], r: 0.04, mat: "steel", name: "long tail shaft" },
      { k: "rod", a: [0.6, D + 0.6, 0], b: [2.2, D + 1.1, 0], r: 0.025, mat: "steel", name: "tiller" },
      // the garlands on the bow post, the awning
      { k: "box", u: [L - 0.6, L - 0.2], z: [-0.12, 0.12], y: [D + 0.9, D + 1.25], mat: "red", name: "garland red" },
      { k: "box", u: [L - 0.7, L - 0.3], z: [-0.1, 0.1], y: [D + 0.6, D + 0.9], mat: "yellow", name: "garland yellow" },
      { k: "canopy", u: [3, 7], hw: 0.85, y: D + 1.1, h: 0.25, mat: "canopy", posts: "wood", name: "awning" },
      { k: "box", u: [3.2, 6.8], z: [-0.7, 0.7], y: [D - 0.25, D - 0.05], mat: "deck", name: "benches" },
    ],
  };
}

export function sampanSpec(): ShipSpec {
  const L = 7;
  const D = 0.8;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 2, depth: D, draft: 0.35, bow: "barge", stern: "transom", section: "flat", entry: 0.2, run: 0.15, transom: 0.7, rake: 0.12, sheer: [0.3, 0.4], boot: 0, stripe: 0.12, rudder: false },
    livery: { hull: "#6b4a2a", stripe: "#3b2a1a", bottom: "#3b2a1a", deck: "#8a6a3a", canopy: "#8a7048", wood: "#5a3b20", steel: "#5b6266" },
    items: [
      { k: "canopy", u: [2, 5], hw: 0.9, y: D + 0.1, h: 0.9, mat: "canopy", posts: "wood", name: "canopy" },
      { k: "box", u: [0.2, 0.6], z: [-0.25, 0.25], y: [D - 0.1, D + 0.35], mat: "steel", name: "outboard" },
      { k: "rod", a: [0.4, D + 0.1, 0.5], b: [-1.8, 0.05, 0.9], r: 0.03, mat: "wood", name: "yuloh" },
    ],
  };
}

// ---------------------------------------------------------------------------
// yachts, runabouts and a fishing cutter

export const SUPERYACHT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["white", "White"], ["navy", "Navy"], ["grey", "Grey"], ["black", "Black"])];
export function superyachtSpec(p?: ParamValues): ShipSpec {
  const L = 90;
  const D = 7.5;
  const c = COLOURS[pick(SUPERYACHT_PARAMS, p, "colour")]!;
  return {
    kind: "passenger",
    hull: { length: L, beam: 14, depth: D, draft: 4, bow: "raked", stern: "transom", section: "round", entry: 0.34, run: 0.1, transom: 0.85, rake: 0.08, sheer: [0, 1.2], boot: 0.2, stripe: 0, screws: 2 },
    livery: { hull: c, bottom: "#1d2024", boot: "#1d2024", deck: "#b08a5a", house: "#f4f4f0", roof: "#f4f4f0", glass: "#141a20" },
    items: [
      { k: "tier", u: [10, L - 14], y: [D - 0.2, D + 3], inset: 0.4, round: [6, 18], windows: [{ y: 0.6, h: 1.8, w: 2.6, pitch: 3 }], name: "main deck" },
      { k: "tier", u: [16, L - 22], y: [D + 3, D + 6], inset: 1.1, round: [6, 16], windows: [{ y: 0.6, h: 1.8, w: 2.6, pitch: 3 }], name: "upper deck" },
      { k: "tier", u: [26, L - 30], y: [D + 6, D + 8.8], inset: 2, round: [6, 12], windows: [{ y: 0.5, h: 1.7, w: 2.6, pitch: 3 }], name: "bridge deck" },
      { k: "tier", u: [38, L - 40], y: [D + 8.8, D + 11], inset: 3.4, round: [5, 8], windows: [{ y: 0.4, h: 1.4, w: 2.6, pitch: 3 }], name: "sun deck" },
      { k: "cyl", u: 50, z: 0, y: [D + 11, D + 16], r: 0.5, mat: "house", name: "mast" },
      { k: "spheres", u: [48, 52], n: 1, r: 1, y: D + 16, base: D + 15.9, mat: "white", cover: "white", name: "radome" },
      { k: "boats", at: [16], z: 4.2, y: D + 3.8, len: 7, r: 0.9, mat: "white", name: "tenders" },
    ],
  };
}

export const SAILING_YACHT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["white", "White"], ["navy", "Navy"], ["red", "Red"], ["green", "Green"])];
export function sailingYachtSpec(p?: ParamValues): ShipSpec {
  const L = 12;
  const lift = 1.4;
  const D = 1.5 + lift;
  const c = COLOURS[pick(SAILING_YACHT_PARAMS, p, "colour")]!;
  return {
    kind: "sail", small: true,
    hull: { length: L, beam: 3.9, depth: D - lift, draft: 2, lift, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.2, transom: 0.75, rake: 0.1, sheer: [0, 0.3], boot: 0.08, stripe: 0.1, rudder: false },
    livery: { hull: c, stripe: "#1d2024", bottom: "#1f2f4f", boot: "#1d2024", deck: "#d6d0c2", house: "#f2f0ea", sail: "#f4f4f0", spar: "#c9c9c4", wood: "#8a6a3a" },
    items: [
      // the fin keel with its bulb, the spade rudder
      { k: "plate", pts: [[4.6, 0], [6.4, 0], [6.8, lift + 0.2], [5, lift + 0.2]], z: 0, t: 0.18, mat: "bottom", name: "fin keel" },
      { k: "rod", a: [4.4, 0.27, 0], b: [6.6, 0.27, 0], r: 0.24, mat: "bottom", name: "keel bulb" },
      { k: "plate", pts: [[0.9, 0.6], [1.5, 0.6], [1.5, lift + 0.3], [0.9, lift + 0.3]], z: 0, t: 0.08, mat: "bottom", name: "rudder" },
      { k: "tier", u: [4.4, 8], y: [D - 0.05, D + 0.6], hw: 1.3, round: [0, 1], windows: [{ y: 0.15, h: 0.3, w: 0.6, pitch: 0.9 }], name: "coachroof" },
      { k: "rig", masts: [{ u: 7.6, y: [D, D + 16], r: 0.09, sails: [{ kind: "bermuda", y: [D + 1.4, D + 15.6], len: 5.6 }, { kind: "jib", y: [D + 0.9, D + 14], tack: L - 0.2, len: 4.6 }] }] },
    ],
  };
}

export function rivaAquaramaSpec(): ShipSpec {
  const L = 8.02;
  const D = 1.1;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 2.6, depth: D, draft: 0.7, bow: "raked", stern: "transom", section: "vee", entry: 0.5, run: 0.1, transom: 0.85, rake: 0.14, sheer: [0, 0.2], boot: 0.06, stripe: 0, screws: 0 },
    livery: { hull: "#7a3a1a", bottom: "#f2f0ea", boot: "#1f2f4f", deck: "#8a4a22", house: "#efe6cf", white: "#efe6cf" },
    items: [
      // the windscreen, the cream sunbed and seats, the engine hatch
      { k: "tier", u: [4.6, 5.0], y: [D - 0.05, D + 0.45], hw: 1.1, mat: "glass", name: "windscreen" },
      { k: "box", u: [3.4, 4.5], z: [-1, 1], y: [D - 0.1, D + 0.3], mat: "white", name: "seats" },
      { k: "box", u: [0.4, 2.4], z: [-1, 1], y: [D - 0.1, D + 0.12], mat: "white", name: "sunbed" },
      { k: "box", u: [2.5, 3.3], z: [-0.9, 0.9], y: [D - 0.1, D + 0.06], mat: "deck", name: "engine hatch" },
      { k: "cyl", u: 0.3, z: 0, y: [D, D + 0.8], r: 0.02, mat: "steel", name: "flagstaff" },
    ],
  };
}

export const CUTTER_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["blue", "Blue"], ["green", "Green"], ["red", "Red"], ["black", "Black"])];
export function fishingCutterSpec(p?: ParamValues): ShipSpec {
  const L = 24;
  const D = 3.6;
  const c = COLOURS[pick(CUTTER_PARAMS, p, "colour")]!;
  return {
    kind: "small", small: true,
    hull: { length: L, beam: 7, depth: D, draft: 2.8, bow: "raked", stern: "cruiser", section: "round", entry: 0.38, run: 0.24, rake: 0.08, sheer: [0.4, 1.4], boot: 0.15, stripe: 0.3, screws: 1 },
    livery: { hull: c, stripe: "#f2f0ea", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#7d6a55", house: "#f2f0ea", mast: "#d8d6cf", grey: "#5b6266" },
    items: [
      { k: "tier", u: [4, 9], y: [D - 0.1, D + 2.3], hw: 2.4, front: { y: 1.2, h: 0.8, w: 0.8, n: 3 }, windows: [{ y: 1.2, h: 0.8, w: 0.8, pitch: 1.3 }], name: "wheelhouse" },
      { k: "cyl", u: 13, z: 0, y: [D, D + 10], r: 0.18, mat: "mast", name: "mast" },
      // the two beam trawl booms, raised, and the beams hanging from them
      { k: "rod", a: [13, D + 1.2, 0.3], b: [13, D + 8, 7.5], r: 0.12, mat: "mast", name: "starboard boom" },
      { k: "rod", a: [13, D + 1.2, -0.3], b: [13, D + 8, -7.5], r: 0.12, mat: "mast", name: "port boom" },
      { k: "rod", a: [9, D + 4, 7.4], b: [17, D + 4, 7.4], r: 0.14, mat: "grey", name: "starboard beam" },
      { k: "rod", a: [9, D + 4, -7.4], b: [17, D + 4, -7.4], r: 0.14, mat: "grey", name: "port beam" },
      { k: "cyl", u: 6, z: 1.6, y: [D + 2.3, D + 3.8], r: 0.2, mat: "black", name: "exhaust" },
      { k: "box", u: [15, 19], z: [-1.5, 1.5], y: [D, D + 0.8], mat: "grey", name: "winch" },
    ],
  };
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names (jsModel.ts imports a design's builders by name)

export function shipNarrowboat(p?: ParamValues): MeshBuilder { return worldShip(narrowboatSpec(p)); }
export function shipNarrowboatLod(p?: ParamValues): MeshBuilder { return shipLod(narrowboatSpec(p)); }
export function shipThamesBarge(): MeshBuilder { return worldShip(thamesBargeSpec()); }
export function shipThamesBargeLod(): MeshBuilder { return shipLod(thamesBargeSpec()); }
export function shipDhow(): MeshBuilder { return worldShip(dhowSpec()); }
export function shipDhowLod(): MeshBuilder { return shipLod(dhowSpec()); }
export function shipJunk(): MeshBuilder { return worldShip(junkSpec()); }
export function shipJunkLod(): MeshBuilder { return shipLod(junkSpec()); }
export function shipFelucca(): MeshBuilder { return worldShip(feluccaSpec()); }
export function shipFeluccaLod(): MeshBuilder { return shipLod(feluccaSpec()); }
export function shipKettuvallam(): MeshBuilder { return worldShip(kettuvallamSpec()); }
export function shipKettuvallamLod(): MeshBuilder { return shipLod(kettuvallamSpec()); }
export function shipSedov(): MeshBuilder { return worldShip(sedovSpec()); }
export function shipSedovLod(): MeshBuilder { return shipLod(sedovSpec()); }
export function shipCuttySark(): MeshBuilder { return worldShip(cuttySarkSpec()); }
export function shipCuttySarkLod(): MeshBuilder { return shipLod(cuttySarkSpec()); }
export function shipBluenose(): MeshBuilder { return worldShip(bluenoseSpec()); }
export function shipBluenoseLod(): MeshBuilder { return shipLod(bluenoseSpec()); }
export function shipGreatBritain(): MeshBuilder { return worldShip(greatBritainSpec()); }
export function shipGreatBritainLod(): MeshBuilder { return shipLod(greatBritainSpec()); }
export function shipVikingLongship(): MeshBuilder { return worldShip(vikingSpec()); }
export function shipVikingLongshipLod(): MeshBuilder { return shipLod(vikingSpec()); }
export function shipVoyagingCanoe(): MeshBuilder { return worldShip(voyagingCanoeSpec()); }
export function shipVoyagingCanoeLod(): MeshBuilder { return shipLod(voyagingCanoeSpec()); }
export function shipGondola(): MeshBuilder { return worldShip(gondolaSpec()); }
export function shipGondolaLod(): MeshBuilder { return shipLod(gondolaSpec()); }
export function shipLongtail(): MeshBuilder { return worldShip(longtailSpec()); }
export function shipLongtailLod(): MeshBuilder { return shipLod(longtailSpec()); }
export function shipSuperyacht(p?: ParamValues): MeshBuilder { return worldShip(superyachtSpec(p)); }
export function shipSuperyachtLod(p?: ParamValues): MeshBuilder { return shipLod(superyachtSpec(p)); }
export function shipSailingYacht(p?: ParamValues): MeshBuilder { return worldShip(sailingYachtSpec(p)); }
export function shipSailingYachtLod(p?: ParamValues): MeshBuilder { return shipLod(sailingYachtSpec(p)); }
export function shipRivaAquarama(): MeshBuilder { return worldShip(rivaAquaramaSpec()); }
export function shipRivaAquaramaLod(): MeshBuilder { return shipLod(rivaAquaramaSpec()); }
export function shipFishingCutter(p?: ParamValues): MeshBuilder { return worldShip(fishingCutterSpec(p)); }
export function shipFishingCutterLod(p?: ParamValues): MeshBuilder { return shipLod(fishingCutterSpec(p)); }
export function shipSampan(): MeshBuilder { return worldShip(sampanSpec()); }
export function shipSampanLod(): MeshBuilder { return shipLod(sampanSpec()); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md)

export const SMALL_SHIP_SPECS: readonly WorldShip[] = [
  { id: "veh-ship-narrowboat", title: "Canal Narrowboat", spec: narrowboatSpec, build: shipNarrowboat, buildLod: shipNarrowboatLod, params: NARROWBOAT_PARAMS, finishParams: ["colour"], game: { weight: 18, power: 30, maxspeed: 6 }, references: "ship-narrowboat" },
  { id: "veh-ship-thames-barge", title: "Thames Sailing Barge", spec: thamesBargeSpec, build: shipThamesBarge, buildLod: shipThamesBargeLod, game: { weight: 150, power: 0, maxspeed: 13 }, references: "ship-thames-barge" },
  { id: "veh-ship-dhow", title: "Dhow", spec: dhowSpec, build: shipDhow, buildLod: shipDhowLod, game: { weight: 100, power: 0, maxspeed: 15 }, references: "ship-dhow" },
  { id: "veh-ship-junk", title: "Chinese Junk", spec: junkSpec, build: shipJunk, buildLod: shipJunkLod, game: { weight: 250, power: 0, maxspeed: 13 }, references: "ship-junk" },
  { id: "veh-ship-felucca", title: "Felucca", spec: feluccaSpec, build: shipFelucca, buildLod: shipFeluccaLod, game: { weight: 3, power: 0, maxspeed: 10 }, references: "ship-felucca" },
  { id: "veh-ship-kettuvallam", title: "Kerala Houseboat", spec: kettuvallamSpec, build: shipKettuvallam, buildLod: shipKettuvallamLod, game: { weight: 25, power: 50, maxspeed: 10 }, references: "ship-kettuvallam" },
  { id: "veh-ship-sedov", title: "Sedov", spec: sedovSpec, build: shipSedov, buildLod: shipSedovLod, game: { weight: 7_320, power: 1_300, maxspeed: 33 }, references: "ship-sedov" },
  { id: "veh-ship-cutty-sark", title: "Cutty Sark", spec: cuttySarkSpec, build: shipCuttySark, buildLod: shipCuttySarkLod, game: { weight: 2_100, power: 0, maxspeed: 32 }, references: "ship-cutty-sark" },
  { id: "veh-ship-bluenose", title: "Bluenose", spec: bluenoseSpec, build: shipBluenose, buildLod: shipBluenoseLod, game: { weight: 285, power: 0, maxspeed: 30 }, references: "ship-bluenose" },
  { id: "veh-ship-ss-great-britain", title: "SS Great Britain", spec: greatBritainSpec, build: shipGreatBritain, buildLod: shipGreatBritainLod, game: { weight: 3_675, power: 750, maxspeed: 20 }, references: "ship-ss-great-britain" },
  { id: "veh-ship-viking-longship", title: "Viking Longship", spec: vikingSpec, build: shipVikingLongship, buildLod: shipVikingLongshipLod, game: { weight: 20, power: 0, maxspeed: 15 }, references: "ship-viking-longship" },
  { id: "veh-ship-voyaging-canoe", title: "Polynesian Voyaging Canoe", spec: voyagingCanoeSpec, build: shipVoyagingCanoe, buildLod: shipVoyagingCanoeLod, game: { weight: 12, power: 0, maxspeed: 10 }, references: "ship-voyaging-canoe" },
  { id: "veh-ship-gondola", title: "Venetian Gondola", spec: gondolaSpec, build: shipGondola, buildLod: shipGondolaLod, game: { weight: 0.6, power: 0, maxspeed: 5 }, references: "ship-gondola" },
  { id: "veh-ship-longtail", title: "Thai Longtail Boat", spec: longtailSpec, build: shipLongtail, buildLod: shipLongtailLod, game: { weight: 1.5, power: 75, maxspeed: 35 }, references: "ship-longtail" },
  { id: "veh-ship-superyacht", title: "Superyacht", spec: superyachtSpec, build: shipSuperyacht, buildLod: shipSuperyachtLod, params: SUPERYACHT_PARAMS, finishParams: ["colour"], game: { weight: 2_400, power: 6_000, maxspeed: 31 }, references: "ship-superyacht" },
  { id: "veh-ship-sailing-yacht", title: "Sailing Yacht", spec: sailingYachtSpec, build: shipSailingYacht, buildLod: shipSailingYachtLod, params: SAILING_YACHT_PARAMS, finishParams: ["colour"], game: { weight: 8, power: 40, maxspeed: 15 }, references: "ship-sailing-yacht" },
  { id: "veh-ship-riva-aquarama", title: "Riva Aquarama", spec: rivaAquaramaSpec, build: shipRivaAquarama, buildLod: shipRivaAquaramaLod, game: { weight: 3, power: 440, maxspeed: 83 }, references: "ship-riva-aquarama" },
  { id: "veh-ship-fishing-cutter", title: "North Sea Fishing Cutter", spec: fishingCutterSpec, build: shipFishingCutter, buildLod: shipFishingCutterLod, params: CUTTER_PARAMS, finishParams: ["colour"], game: { weight: 120, power: 300, maxspeed: 19 }, references: "ship-fishing-cutter" },
  { id: "veh-ship-sampan", title: "Sampan", spec: sampanSpec, build: shipSampan, buildLod: shipSampanLod, game: { weight: 0.8, power: 10, maxspeed: 10 }, references: "ship-sampan" },
];

export const SMALL_SHIPS = /* @__PURE__ */ shipDesigns(SMALL_SHIP_SPECS);
