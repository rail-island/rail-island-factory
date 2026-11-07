// The world's cargo ships (docs/models/world-ships-cargo.md): container ships,
// tankers, gas and bulk carriers, ro-ro, heavy-lift and general cargo ships, and
// river cargo vessels, each a ShipSpec on the hull kit (hullKit.ts) at its real
// size, modelled on the photographs in assets/<references>/ and the published
// figures in each folder's SOURCES.md. Metres from the stern (u), heights from the
// keel. The ids are stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { shipLod, worldShip, type Item, type ShipSpec } from "./hullKit.ts";
import { aftHouse, bayGaps, deckhouse, exhausts, fittings, funnel, LOAD_PARAM, liveryParam, mast, oceanHull, pick, shipDesigns, type WorldShip } from "./worldShips.ts";

const loaded = (p: ParamValues | undefined, params: readonly ParamSpec[] = [LOAD_PARAM]): boolean => pick(params, p, "load") === "full";
/** A rod between two points (u, y, z). */
const rod = (a: [number, number, number], b: [number, number, number], r: number, mat: string, name?: string): Item => ({ k: "rod", a, b, r, mat, ...(name ? { name } : {}) });
/** The items only a loaded ship carries. */
const cargo = (p: ParamValues | undefined, items: Item[], params: readonly ParamSpec[] = [LOAD_PARAM]): Item[] => (loaded(p, params) ? items : []);

// ---------------------------------------------------------------------------
// container ships

const MAERSK = { hull: "#6b8fae", bottom: "#8b2b25", boot: "#25292d", deck: "#6f7a77", house: "#f1f1ec", funnel: "#6b8fae", stripe: "#f1f1ec" };

/** Container stacks over the hatch covers: one stack a row of boxes (2.5 m), lashing bridges two tiers high in the bay gaps. */
function stacks(groups: ReadonlyArray<{ u: readonly [number, number]; bays: number; tiers: number; seed: number }>, hw: number, y: number, lash = 5.2): Item[] {
  return groups.flatMap((g): Item[] => [
    { k: "containers", u: g.u, bays: g.bays, hw, y, tiers: g.tiers, seed: g.seed, rows: 2.5 },
    ...(g.bays > 1 ? [{ k: "lashing", at: bayGaps(g.u, g.bays), hw: hw - 0.2, y, h: lash } as Item] : []),
  ]);
}

/** A container ship's hatch covers on their coamings: the stacks stand on y + h + 1. */
function coveredHatches(u: readonly [number, number], n: number, hw: number, y: number, h: number, gap: number): Item {
  return { k: "hatches", u, n, hw, y, h, gap, coaming: 1, coamingMat: "hull", ribs: 2 };
}

export function tripleESpec(p?: ParamValues): ShipSpec {
  const L = 399;
  const D = 33;
  const T = D + 1 + 1.2;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 59, depth: D, draft: 14.5, entry: 0.22, run: 0.24, transom: 0.8, boot: 1.2, forecastle: [22, 2.6], fine: true }),
    livery: MAERSK,
    items: [
      coveredHatches([14, 380], 26, 27, D, 1.2, 1.6),
      ...cargo(p, stacks([{ u: [14, 80], bays: 5, tiers: 9, seed: 3 }, { u: [100, 228], bays: 10, tiers: 10, seed: 5 }, { u: [252, 372], bays: 9, tiers: 9, seed: 11 }], 28.4, T)),
      // the engine room's casing and the twin uptakes aft
      { k: "tier", u: [82, 98], y: [D - 0.2, D + 16], hw: 10, lip: 0.3, windows: [{ y: 6, h: 0.5, w: 2.4, pitch: 3.2, mat: "black" }], name: "engine casing" },
      ...[-4.6, 4.6].flatMap((z): Item[] => [funnel([84, 96], 4.2, [D + 16, D + 34], [["funnel", 0.85], ["black", 1]], 1.2, z), { k: "cyl", u: 92.6, z, y: [D + 33, D + 35.5], r: 1.1, mat: "black", name: "exhaust pipe" }]),
      // the island deckhouse forward of midships, its bridge over the stacks
      ...deckhouse({ u: [230, 250], y0: D - 0.2, decks: 12, hw: 17, h: 2.9, step: 0.3, wings: 29.5, detail: true }),
      mast(240, D - 0.2 + 12 * 2.9, D + 42),
      { k: "freefall", u: 225, y: D + 6, len: 9, tilt: 0.55 },
      { k: "box", u: [368, 374], z: [-9, 9], y: [D + 2.6, D + 7.5], mat: "house", name: "breakwater" },
      ...fittings({ L, B: 59, D, fc: [22, 2.6], aft: [3, 8], draft: 14.5 }),
    ],
  };
}

export function emmaMaerskSpec(p?: ParamValues): ShipSpec {
  const L = 397.7;
  const D = 30.2;
  const T = D + 1 + 1.2;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 56.4, depth: D, draft: 15.5, entry: 0.24, run: 0.22, transom: 0.78, boot: 1.2, forecastle: [20, 2.6], fine: true }),
    livery: MAERSK,
    items: [
      coveredHatches([10, 382], 27, 25.8, D, 1.2, 1.5),
      ...cargo(p, stacks([{ u: [10, 68], bays: 4, tiers: 8, seed: 2 }, { u: [86, 152], bays: 5, tiers: 9, seed: 4 }, { u: [170, 374], bays: 15, tiers: 8, seed: 6 }], 27, T)),
      { k: "tier", u: [70, 84], y: [D - 0.2, D + 15], hw: 9, lip: 0.3, windows: [{ y: 6, h: 0.5, w: 2.4, pitch: 3.2, mat: "black" }], name: "engine casing" },
      funnel([71, 83], 5.5, [D + 15, D + 31], [["funnel", 0.85], ["black", 1]], 1.2),
      ...exhausts([71, 83], 5.5, D + 31, 1.2),
      ...deckhouse({ u: [153, 168], y0: D - 0.2, decks: 12, hw: 16, h: 2.85, step: 0.3, wings: 28, detail: true }),
      mast(160, D - 0.2 + 12 * 2.85, D + 41),
      { k: "freefall", u: 149, y: D + 6, len: 9, tilt: 0.55 },
      { k: "box", u: [367, 373], z: [-9, 9], y: [D + 2.6, D + 7.5], mat: "house", name: "breakwater" },
      ...fittings({ L, B: 56.4, D, fc: [20, 2.6], aft: [3, 7], draft: 15.5 }),
    ],
  };
}

export function gulsunSpec(p?: ParamValues): ShipSpec {
  const L = 399.9;
  const D = 33.2;
  const T = D + 1 + 1.2;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 61.5, depth: D, draft: 16, entry: 0.2, run: 0.24, transom: 0.82, boot: 1.2, forecastle: [16, 2.6], fine: true }),
    livery: { hull: "#1e2226", bottom: "#8f2a22", boot: "#c9c6bd", deck: "#5d6466", house: "#f2f0ea", funnel: "#d9b23e" },
    items: [
      coveredHatches([12, 384], 26, 28.6, D, 1.2, 1.6),
      ...cargo(p, stacks([{ u: [12, 52], bays: 3, tiers: 10, seed: 13 }, { u: [70, 318], bays: 19, tiers: 11, seed: 17 }, { u: [340, 380], bays: 3, tiers: 9, seed: 19 }], 29.6, T)),
      { k: "tier", u: [54, 68], y: [D - 0.2, D + 17], hw: 9, lip: 0.3, windows: [{ y: 7, h: 0.5, w: 2.4, pitch: 3.2, mat: "black" }], name: "engine casing" },
      funnel([56, 66], 5, [D + 17, D + 34], [["funnel", 0.85], ["black", 1]], 1.0),
      ...exhausts([56, 66], 5, D + 34, 1.0),
      ...deckhouse({ u: [320, 338], y0: D - 0.2, decks: 13, hw: 15, h: 2.9, step: 0.3, wings: 31, detail: true }),
      mast(329, D - 0.2 + 13 * 2.9, D + 45),
      { k: "freefall", u: 316, y: D + 6, len: 9, tilt: 0.55 },
      ...fittings({ L, B: 61.5, D, fc: [16, 2.6], aft: [3, 8], draft: 16 }),
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
  const L = 294;
  const D = 21.8;
  const T = D + 1 + 1.1;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 32.2, depth: D, draft: 12, entry: 0.24, run: 0.22, boot: 1, forecastle: [16, 2.5], fine: true }),
    livery: { house: "#f2f0ea", ...PANAMAX_LIVERIES[pick(PANAMAX_PARAMS, p, "livery")]! },
    items: [
      coveredHatches([64, 270], 14, 14.8, D, 1.1, 1.4),
      coveredHatches([8, 30], 2, 14.8, D, 1.1, 1.4),
      ...cargo(p, stacks([{ u: [8, 30], bays: 2, tiers: 5, seed: 23 }, { u: [64, 268], bays: 16, tiers: 6, seed: 29 }], 15.6, T), PANAMAX_PARAMS),
      ...aftHouse({ u: [34, 60], D, decks: 7, hw: 12, wings: 16.1, funnel: { u: [36, 44], hw: 3.2, h: 9 }, detail: true, freefall: 8 }),
      ...fittings({ L, B: 32.2, D, fc: [16, 2.5], aft: [3], draft: 12 }),
      { k: "box", u: [262, 266], z: [-6, 6], y: [D + 2.5, D + 6], mat: "house", name: "breakwater" },
    ],
  };
}

/**
 * A geared feeder of the Zhejiang 950 type (Vega Scorpio, 2010: 139.1 x 22.6 m,
 * 966-997 TEU, two 45 t cranes on the port side; assets/ship-feeder-container).
 * Seven 40 ft bays from the house to the forecastle: two aft of the after crane
 * (the one at the house in green cell guides), three between the cranes, two
 * forward; the cranes' jibs stowed forward on tall rests, green coamings and
 * lashing bridges standing on the deck, the house on a raised poop aft.
 */
export function feederSpec(p?: ParamValues): ShipSpec {
  const L = 139.1;
  const B = 22.6;
  const D = 11.8;
  const P = 2.6; // the poop and the forecastle, over the main deck
  const fc = 11.8;
  const co = 1.6; // the hatch coaming
  const T = D + co + 0.9; // the cover tops: the boxes' base
  const bay = 12.3;
  const hw = 9.9; // the stacks' half-width: 8 rows of boxes
  // three groups of 40 ft bays, aft to forward, 0.6 m lashing gaps in a group, 3.3 m between groups where a crane stands
  const groups: Array<{ u: readonly [number, number]; bays: number; tiers: number; seed: number }> = [];
  let u = 31;
  for (const [n, tiers, seed] of [[2, 4, 31], [3, 4, 37], [2, 3, 43]] as const) {
    groups.push({ u: [u, u + n * bay + (n - 1) * 0.6], bays: n, tiers, seed });
    u += n * bay + (n - 1) * 0.6 + 3.3;
  }
  const [gA, gB, gC] = groups as [typeof groups[0], typeof groups[0], typeof groups[0]];
  const craneAt = [gB.u[0] - 1.65, gC.u[0] - 1.65];
  const restAt = bayGaps(gB.u, gB.bays)[1]!; // the after crane's jib rest, between the 2nd and 3rd middle bays
  const zc = -(B / 2 - 2); // the cranes' columns at the port side
  /** A lashing bridge in a bay gap: posts from the deck between the covers, two walkways and a top rail across. */
  const lashing = (uc: number, k: number): Item[] => [
    ...[-hw, -hw / 2, 0, hw / 2, hw].map((z, j): Item => ({ k: "box", u: [uc - 0.12, uc + 0.12], z: [z - 0.15, z + 0.15], y: [D - 0.05, T + 3.7], mat: "lash", name: `lashing bridge ${k + 1} post ${j + 1}` })),
    ...[T + 0.05, T + 2.65].map((y, j): Item => ({ k: "box", u: [uc - 0.18, uc + 0.18], z: [-hw - 0.2, hw + 0.2], y: [y, y + 0.15], mat: "lash", name: `lashing bridge ${k + 1} walkway ${j + 1}` })),
    { k: "box", u: [uc - 0.07, uc + 0.07], z: [-hw - 0.1, hw + 0.1], y: [T + 3.6, T + 3.75], mat: "lash", name: `lashing bridge ${k + 1} rail` },
  ];
  /** The open cell guides at the house's front: corner posts at each row, from the deck, a head rail across them. */
  const guides = (b: readonly [number, number]): Item[] => [b[0] - 0.2].flatMap((ue, e): Item[] => [
    ...Array.from({ length: 9 }, (_, j): Item => {
      const z = -hw + (j * 2 * hw) / 8;
      return { k: "box", u: [ue - 0.15, ue + 0.15], z: [z - 0.15, z + 0.15], y: [D - 0.05, T + 5.5], mat: "lash", name: `cell guide ${e + 1} post ${j + 1}` };
    }),
    { k: "box", u: [ue - 0.2, ue + 0.2], z: [-hw - 0.2, hw + 0.2], y: [T + 5.5, T + 5.9], mat: "lash", name: `cell guide ${e + 1} head` },
  ]);
  /**
   * A 45 t deck crane: the green pedestal on the deck, the yellow column with its
   * slewing collar and cab, the box jib from the collar stowed forward (rising) on
   * its rest - a post from the deck under the tip - and the luffing wires.
   */
  const crane = (uc: number, k: number, tip: readonly [number, number, number], restBase: number): Item[] => {
    const heel: [number, number, number] = [uc + 1.3, D + 13.4, zc];
    const top = D + 23;
    return [
      { k: "box", u: [uc - 1.5, uc + 1.5], z: [zc - 1.5, zc + 1.5], y: [D - 0.05, D + 2.6], mat: "lash", name: `crane ${k + 1} pedestal` },
      { k: "box", u: [uc - 1.35, uc + 1.35], z: [zc - 1.35, zc + 1.35], y: [D + 2.6, D + 11.2], mat: "crane", top: false, name: `crane ${k + 1} trunk` },
      { k: "box", u: [uc - 1.6, uc + 1.6], z: [zc - 1.6, zc + 1.6], y: [D + 11.2, D + 12.4], mat: "crane", name: `crane ${k + 1} slewing collar` },
      { k: "box", u: [uc - 1.2, uc + 1.2], z: [zc - 1.2, zc + 1.2], y: [D + 12.4, top], mat: "crane", name: `crane ${k + 1} column` },
      { k: "box", u: [uc - 1, uc + 0.6], z: [zc + 1.2, zc + 2.8], y: [D + 12.4, D + 14.6], mat: "crane", name: `crane ${k + 1} cab` },
      { k: "box", u: [uc - 0.5, uc + 0.3], z: [zc + 2.81, zc + 2.84], y: [D + 13.3, D + 14.3], mat: "glass", name: `crane ${k + 1} cab window` },
      rod(heel, [tip[0], tip[1], tip[2]], 0.55, "crane", `crane ${k + 1} jib`),
      rod([uc + 0.6, top - 0.4, zc], [tip[0] - 0.3, tip[1] + 0.4, tip[2]], 0.06, "rope", `crane ${k + 1} luffing wire`),
      rod([uc + 0.6, top - 0.4, zc + 0.5], [tip[0] - 0.3, tip[1] + 0.4, tip[2] + 0.4], 0.06, "rope", `crane ${k + 1} luffing wire 2`),
      // the hook block, hung on the jib before its head
      rod([tip[0] - 2.2, tip[1] - 0.6, tip[2]], [tip[0] - 2.2, tip[1] - 2.6, tip[2]], 0.05, "rope", `crane ${k + 1} hoist wire`),
      { k: "box", u: [tip[0] - 2.55, tip[0] - 1.85], z: [tip[2] - 0.35, tip[2] + 0.35], y: [tip[1] - 3.4, tip[1] - 2.6], mat: "crane", name: `crane ${k + 1} hook block` },
      // the jib rest under the jib's head: its post from the deck, the cradle the jib lies in and its cheeks
      { k: "box", u: [tip[0] - 0.8, tip[0] - 0.4], z: [tip[2] - 0.45, tip[2] + 0.45], y: [restBase - 0.05, tip[1] - 0.55], mat: "crane", name: `crane ${k + 1} jib rest` },
      { k: "box", u: [tip[0] - 1.1, tip[0] - 0.1], z: [tip[2] - 0.75, tip[2] + 0.75], y: [tip[1] - 0.6, tip[1] - 0.42], mat: "crane", name: `crane ${k + 1} jib rest cradle` },
      ...[-1, 1].map((s): Item => ({ k: "box", u: [tip[0] - 1.1, tip[0] - 0.1], z: s < 0 ? [tip[2] - 0.75, tip[2] - 0.58] : [tip[2] + 0.58, tip[2] + 0.75], y: [tip[1] - 0.42, tip[1] + 0.3], mat: "crane", name: `crane ${k + 1} jib rest cheek ${s < 0 ? 1 : 2}` })),
    ];
  };
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: B, depth: D, draft: 8.8, entry: 0.26, run: 0.22, boot: 1, forecastle: [fc, P], poop: [30, P], fine: true }),
    livery: {
      hull: "#363a3e", bottom: "#8c3626", boot: "#b0533a", deck: "#55615a", house: "#f2f0ea", funnel: "#1d2024",
      crane: "#e8c35a", lash: "#2f7552", hatch: "#3d6a50", yellow: "#e2b02c",
      c0: "#8a3a33", c3: "#d8c27a", c6: "#c98479", c7: "#6e2b2e",
    },
    items: [
      ...groups.map((g): Item => ({ k: "hatches", u: g.u, n: g.bays, hw: hw - 0.4, y: D, h: 0.9, gap: 0.6, coaming: co, coamingMat: "lash", ribs: 2 })),
      ...cargo(p, groups.map((g): Item => ({ k: "containers", u: g.u, bays: g.bays, hw, y: T, tiers: g.tiers, seed: g.seed, rows: 2.5 }))),
      ...[...bayGaps(gA.u, gA.bays), ...bayGaps(gB.u, gB.bays), ...bayGaps(gC.u, gC.bays)].flatMap(lashing),
      ...guides(gA.u),
      // the after crane's jib on its rest in the gap between the middle bays, the forward one's on the forecastle, inboard
      ...crane(craneAt[0]!, 0, [restAt + 0.6, D + 16.6, zc], D),
      ...crane(craneAt[1]!, 1, [L - fc + 2.4, D + 15.2, -2.6], D + P),
      // the house: sparse windows on its sides as on the ship, the kit's rescue boat replaced by ones in cradles on the poop deck
      ...aftHouse({ u: [8, 30], D: D + P, decks: 7, hw: 7.8, h: 2.85, step: 0.15, wings: 11.1, funnel: { u: [15.5, 20], hw: 1.3, h: 4.5, bands: [["yellow", 0.47], ["red", 0.68], ["black", 1]], rake: 0.2 }, mastH: 7, detail: true, freefall: 6 })
        .filter((it) => it.name !== "rescue boat")
        .map((it): Item => (it.k === "tier" && it.name !== "wheelhouse" && it.windows?.length ? { ...it, windows: it.windows.map((w) => ({ ...w, pitch: 3.6 })) } : it)),
      { k: "boats", at: [21.5], z: 9.1, y: D + P + 1.5, len: 6, r: 0.9, name: "rescue boat" },
      ...[1, -1].flatMap((s): Item[] => [
        ...[19.8, 23.2].map((uc, j): Item => ({ k: "box", u: [uc - 0.3, uc + 0.3], z: s > 0 ? [8.4, 9.8] : [-9.8, -8.4], y: [D + P - 0.05, D + P + 0.8], mat: "steel", name: `rescue boat cradle ${s > 0 ? "S" : "P"}${j + 1}` })),
        { k: "cyl", u: 25.4, z: s * 8.2, y: [D + P - 0.05, D + P + 4.6], r: 0.2, mat: "white", name: `rescue boat davit ${s > 0 ? "S" : "P"}` },
        rod([25.4, D + P + 4.4, s * 8.2], [21.5, D + P + 4.6, s * 9.1], 0.14, "white", `rescue boat davit arm ${s > 0 ? "S" : "P"}`),
        rod([21.5, D + P + 4.5, s * 9.1], [21.5, D + P + 2.3, s * 9.1], 0.04, "rope", `rescue boat fall ${s > 0 ? "S" : "P"}`),
      ]),
      mast(27.5, D + P - 0.2 + 7 * 2.85, D + P + 24.5, 0.18),
      // the foremast on the forecastle
      { k: "mast", u: L - 6.5, y: [D + P - 0.05, D + P + 13], r: 0.28, yards: [[D + P + 9, 1.6]], mat: "crane", name: "foremast" },
      // the provision crane at the house's after end, starboard, its jib across the after face
      { k: "cyl", u: 6.6, z: 3.5, y: [D + P - 0.05, D + P + 12.5], r: 0.45, mat: "crane", name: "provision crane column" },
      rod([6.6, D + P + 11.6, 3.5], [6.6, D + P + 11.9, -4.5], 0.25, "crane", "provision crane jib"),
      ...fittings({ L, B, D, fc: [fc, P], aft: [3], draft: 8.8, bulwark: 2 }),
    ],
  };
}

export function idealXSpec(): ShipSpec {
  const L = 159.6;
  const D = 12.2;
  return {
    kind: "cargo",
    hull: { length: L, beam: 20.7, depth: D, draft: 9.2, bow: "raked", stern: "cruiser", section: "round", sheer: [0.8, 2.2], forecastle: [14, 2.4], poop: [26, 2.4], boot: 0.5, screws: 1, fine: true },
    livery: { hull: "#2f3438", bottom: "#7a2c26", deck: "#76695a", house: "#e9e6de", funnel: "#2f3438", mast: "#cfcac0", steel: "#a9adae" },
    items: [
      // the spar deck built over the tanks to carry the trailers' boxes, on its frames
      { k: "box", u: [30, 142], z: [-9.4, 9.4], y: [D + 1.2, D + 1.8], mat: "steel", name: "spar deck" },
      ...spacedAt(32, 140, 9).map((u): Item => ({ k: "box", u: [u - 0.3, u + 0.3], z: [-9.2, 9.2], y: [D - 0.1, D + 1.2], mat: "steel", top: false, name: "spar deck frame" })),
      { k: "containers", u: [31, 141], bays: 9, hw: 8.8, y: D + 1.8, tiers: 1, seed: 37, rows: 2.5 },
      { k: "tier", u: [76, 88], y: [D + 1.8, D + 4.6], hw: 6.5, lip: 0.3, windows: [{ y: 1, h: 0.8, w: 0.7, pitch: 2 }], front: { y: 1, h: 0.8, w: 0.7, n: 6 }, name: "bridge house" },
      { k: "tier", u: [80, 87.5], y: [D + 4.6, D + 7.2], hw: 5.5, lip: 0.5, front: { y: 0.8, h: 0.9, w: 0.8, n: 5 }, wings: { hw: 8.6, h: 1.4 }, name: "wheelhouse" },
      { k: "tier", u: [4, 26], y: [D + 2.2, D + 5], hw: 8.5, lip: 0.3, windows: [{ y: 1, h: 0.8, w: 0.6, pitch: 2.2 }], front: { y: 1, h: 0.8, w: 0.6, n: 6 }, name: "after house" },
      funnel([8, 14], 2.4, [D + 5, D + 13], [["funnel", 0.86], ["black", 1]], 0.8),
      { k: "boats", at: [18], z: 9.2, y: D + 5.6, len: 7, r: 1.1 },
      mast(150, D + 2.4, D + 18, 0.25),
      mast(84, D + 7.2, D + 16, 0.2),
      { k: "vents", at: [[20, -5], [20, 5], [140, -3], [140, 3]], h: 2.2, r: 0.35, cowl: true },
      { k: "bulwark", u: [26, 145.6], h: 1.1, t: 0.25 },
      ...fittings({ L, B: 20.7, D: D + 2.2, fc: [14, 0], aft: [2], rake: 0.03, draft: 9.2, rail: false }),
    ],
  };
}

/** n positions spread evenly from a to b. */
function spacedAt(a: number, b: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / Math.max(1, n - 1));
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

/**
 * A tanker's deck: the cargo lines along it and the red fire main, the catwalk on
 * its posts, the manifold with its crossovers, the hose cranes, the tank hatches
 * and the vent risers in two rows, a foam monitor platform before the house.
 */
function tankDeck(u0: number, u1: number, D: number, hw: number, hose = 0.5): Item[] {
  const mid = (u0 + u1) / 2;
  const n = hw > 20 ? 5 : 3;
  const s = Math.min(1.4, Math.max(0.7, hw / 20));
  const tanks = Math.max(5, Math.round((u1 - u0) / 32));
  return [
    { k: "pipes", u: [u0, u1], z: Array.from({ length: n }, (_, i) => -2.5 - i * 1.3 * s), y: D + 0.8 * s, r: 0.35 * s },
    { k: "pipes", u: [u0, u1], z: [hw * 0.55], y: D + 0.5, r: 0.25 * s, mat: "red", name: "fire main" },
    { k: "catwalk", u: [u0, u1], y: D + 2.6 * s, z: 0.8, w: 1.4, pitch: 9 },
    // the deck paint: the green walkway under the catwalk, the yellow lines of the safe ways along both sides
    { k: "box", u: [u0, u1], z: [-0.4, 2], y: [D - 0.02, D + 0.03], mat: "green", name: "walkway paint" },
    ...[1, -1].map((sd): Item => ({ k: "box", u: [u0, u1], z: sd > 0 ? [hw * 0.82, hw * 0.82 + 0.4] : [-hw * 0.82 - 0.4, -hw * 0.82], y: [D - 0.02, D + 0.03], mat: "yellow", name: "safe way line" })),
    ...spacedAt(u0 + 2, u1 - 2, Math.round((u1 - u0) / 9)).map((u): Item => ({ k: "box", u: [u - 0.25, u + 0.25], z: [-3 - n * 1.3 * s, -1.8], y: [D - 0.05, D + 0.5 * s], mat: "steel", top: false, name: "pipe support" })),
    { k: "box", u: [mid - 3, mid + 3], z: [-hw * 0.95, hw * 0.95], y: [D, D + 0.5], mat: "steel", name: "manifold platform" },
    ...[-1.8, 0, 1.8].map((du, i): Item => ({ k: "rod", a: [mid + du, D + 1.3, -hw * 0.95], b: [mid + du, D + 1.3, hw * 0.95], r: 0.3 * s, mat: "steel", name: `manifold crossover ${i + 1}` })),
    { k: "crane", u: mid + 7, z: hw * 0.6, y: D, h: 5, jib: hw * hose * 1.2, dir: Math.PI * 0.97, mat: "white" },
    { k: "crane", u: mid + 7, z: -hw * 0.6, y: D, h: 5, jib: hw * hose * 1.2, dir: -Math.PI * 0.97, mat: "white" },
    { k: "domes", u: [u0 + 10, u1 - 10], n: tanks, r: 0.9 * s, y: D, h: 1.1, z: hw * 0.3, mat: "steel", name: "tank hatches" },
    { k: "domes", u: [u0 + 10, u1 - 10], n: tanks, r: 0.9 * s, y: D, h: 1.1, z: -hw * 0.3, mat: "steel", name: "tank hatches" },
    { k: "vents", at: spacedAt(u0 + 16, u1 - 16, tanks).flatMap((u) => [[u, hw * 0.72], [u, -hw * 0.72]] as const), h: 5 * s, r: 0.3 * s, mat: "steel", name: "vent risers" },
    { k: "tier", u: [u0 + 1, u0 + 5], y: [D, D + 3.5 * s], hw: 2.2 * s, mat: "steel", name: "foam monitor platform" },
  ];
}

export const VLCC_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ tankerLivery("navy", "green", "black")];
export function vlccSpec(p?: ParamValues): ShipSpec {
  const L = 330;
  const D = 29.7;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 60, depth: D, draft: 21, entry: 0.16, run: 0.17, transom: 0.75, boot: 1.4, forecastle: [16, 2.6], fine: true }),
    livery: TANKER_LIVERIES[pick(VLCC_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [8, 36], D, decks: 6, hw: 21, h: 2.9, wings: 30, funnel: { u: [10, 20], hw: 4.2, h: 16 }, detail: true, freefall: 9 }),
      ...tankDeck(42, 312, D, 28),
      mast(L - 10, D + 2.6, D + 16, 0.35),
      ...fittings({ L, B: 60, D, fc: [16, 2.6], aft: [], draft: 21 }),
    ],
  };
}

export function seawiseGiantSpec(): ShipSpec {
  const L = 458.45;
  const D = 29.8;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 68.8, depth: D, draft: 24.6, bow: "raked", entry: 0.15, run: 0.15, transom: 0.72, boot: 1.5, forecastle: [18, 2.8], fine: true }),
    livery: { ...TANKER, hull: "#1d2024", funnel: "#2a3b5f", deck: "#8d3b2c" },
    items: [
      ...aftHouse({ u: [10, 42], D, decks: 7, hw: 24, h: 3, wings: 34.2, funnel: { u: [12, 24], hw: 5, h: 18 }, detail: true }),
      ...tankDeck(48, 436, D, 32),
      mast(L - 10, D + 2.8, D + 17, 0.35),
      ...fittings({ L, B: 68.8, D, fc: [18, 2.8], aft: [], draft: 24.6 }),
    ],
  };
}

export const AFRAMAX_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ tankerLivery("red", "navy", "black")];
export function aframaxSpec(p?: ParamValues): ShipSpec {
  const L = 245;
  const D = 21;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 42, depth: D, draft: 14.8, entry: 0.18, run: 0.18, boot: 1.2, forecastle: [14, 2.5], fine: true }),
    livery: TANKER_LIVERIES[pick(AFRAMAX_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [6, 30], D, decks: 6, hw: 15, wings: 21, funnel: { u: [8, 16], hw: 3.2, h: 12 }, detail: true, freefall: 8 }),
      ...tankDeck(36, 230, D, 20),
      mast(L - 8, D + 2.5, D + 14, 0.3),
      ...fittings({ L, B: 42, D, fc: [14, 2.5], aft: [], draft: 14.8 }),
    ],
  };
}

export const PRODUCT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ tankerLivery("red", "navy", "green")];
export function productTankerSpec(p?: ParamValues): ShipSpec {
  const L = 183;
  const D = 19;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 32.2, depth: D, draft: 12, entry: 0.2, run: 0.2, boot: 1, forecastle: [12, 2.4], fine: true }),
    livery: TANKER_LIVERIES[pick(PRODUCT_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [5, 25], D, decks: 6, hw: 12, wings: 16.1, funnel: { u: [6, 12], hw: 2.6, h: 9 }, detail: true, freefall: 7 }),
      ...tankDeck(30, 170, D, 15, 0.8),
      { k: "crane", u: 100, z: 0, y: D, h: 8, jib: 22, dir: Math.PI, lift: 0.5, mat: "white", name: "manifold crane" },
      mast(L - 7, D + 2.4, D + 13, 0.25),
      ...fittings({ L, B: 32.2, D, fc: [12, 2.4], aft: [], draft: 12 }),
    ],
  };
}

export function lngMossSpec(): ShipSpec {
  const L = 290;
  const D = 26.5;
  const r = 19.5;
  const pitch = (270 - 36) / 5;
  const topY = D + 6 + r;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 48, depth: D, draft: 11.5, entry: 0.2, run: 0.2, boot: 1.2, forecastle: [18, 2.5], fine: true }),
    livery: { hull: "#2b3138", bottom: "#a3342b", boot: "#2b3138", deck: "#b7a990", house: "#f0eee8", funnel: "#2b3138", tank: "#d3cfc3" },
    items: [
      ...aftHouse({ u: [6, 30], D, decks: 7, hw: 19, wings: 24, funnel: { u: [8, 17], hw: 3.6, h: 15 }, detail: true, freefall: 8 }),
      { k: "spheres", u: [36, 270], n: 5, r, y: D + 6, mat: "tank" },
      // each tank's dome and the walkway from top to top on its trestles
      { k: "domes", u: [36 + pitch / 2, 270 - pitch / 2], n: 5, r: 2.6, y: topY - 0.4, h: 1.8, mat: "steel", name: "tank domes" },
      { k: "catwalk", u: [32, 270], y: topY + 1.6, w: 1.6, pitch: pitch / 2 },
      { k: "pipes", u: [36, 270], z: [21, 21.8], y: D + 1.4, r: 0.4 },
      { k: "pipes", u: [36, 270], z: [-21], y: D + 0.8, r: 0.3, mat: "red", name: "fire main" },
      { k: "box", u: [150, 156], z: [-23, 23], y: [D, D + 1.4], mat: "steel", name: "manifold" },
      { k: "crane", u: 160, z: 18, y: D, h: 6, jib: 12, dir: Math.PI * 0.97, mat: "white" },
      { k: "tier", u: [271, 276], y: [D - 0.2, D + 6], hw: 4, mat: "steel", name: "forward compressor house" },
      { k: "cyl", u: 273, z: 0, y: [D + 6, D + 24], r: 0.6, mat: "steel", name: "vent mast" },
      ...fittings({ L, B: 48, D, fc: [18, 2.5], aft: [], draft: 11.5 }),
    ],
  };
}

export function qmaxSpec(): ShipSpec {
  const L = 345;
  const D = 27;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 53.8, depth: D, draft: 12, entry: 0.2, run: 0.2, transom: 0.78, boot: 1.2, forecastle: [18, 2.6], fine: true }),
    livery: { hull: "#7a1f2b", bottom: "#8f2a22", boot: "#2b3138", deck: "#8d9493", house: "#f0eee8", funnel: "#7a1f2b", tank: "#c9ccc8" },
    items: [
      ...aftHouse({ u: [6, 32], D, decks: 7, hw: 20, wings: 26.9, funnel: { u: [8, 18], hw: 4, h: 15 }, detail: true, freefall: 9 }),
      // the membrane tanks' trunk deck, with its domes, pipe runs and walkway
      { k: "box", u: [40, 326], z: [-17, 17], y: [D - 0.2, D + 3.2], mat: "tank", name: "trunk deck" },
      { k: "domes", u: [60, 306], n: 4, r: 2.6, y: D + 3.2, h: 2.2, mat: "steel" },
      { k: "domes", u: [70, 296], n: 4, r: 1.2, y: D + 3.2, h: 3, z: 9, mat: "steel", name: "liquid domes" },
      { k: "pipes", u: [40, 326], z: [-8, -6.8, 8, 6.8], y: D + 4, r: 0.6 },
      { k: "catwalk", u: [40, 326], y: D + 6.4, z: 0, w: 1.6, pitch: 12 },
      { k: "vents", at: [[64, -12], [126, -12], [188, -12], [250, -12], [312, -12]], h: 14, r: 0.5, mat: "steel", name: "vent masts" },
      { k: "box", u: [178, 186], z: [-26, 26], y: [D, D + 1.4], mat: "steel", name: "manifold" },
      { k: "crane", u: 190, z: 20, y: D, h: 6, jib: 14, dir: Math.PI * 0.97, mat: "white" },
      { k: "crane", u: 190, z: -20, y: D, h: 6, jib: 14, dir: -Math.PI * 0.97, mat: "white" },
      { k: "tier", u: [33, 40], y: [D - 0.2, D + 7], hw: 12, mat: "house", lip: 0.3, windows: [{ y: 3, h: 0.6, w: 2, pitch: 3, mat: "black" }], name: "compressor house" },
      mast(L - 10, D + 2.6, D + 16, 0.3),
      ...fittings({ L, B: 53.8, D, fc: [18, 2.6], aft: [], draft: 12 }),
    ],
  };
}

export function lpgSpec(): ShipSpec {
  const L = 120;
  const D = 10;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 19.6, depth: D, draft: 7.2, entry: 0.24, run: 0.22, boot: 0.6, forecastle: [9, 2.2], fine: true }),
    livery: { hull: "#c23128", bottom: "#2b3138", boot: "#f2f0ea", deck: "#6f7a77", house: "#f2f0ea", funnel: "#c23128", tank: "#e8e6df" },
    items: [
      ...aftHouse({ u: [4, 18], D, decks: 5, hw: 8, wings: 9.7, funnel: { u: [5, 9], hw: 1.6, h: 5 }, detail: true, freefall: 5.5 }),
      // three pairs of pressure tanks, half above the deck, each with its dome
      { k: "tanks", u: [22, 106], n: 3, r: 4.2, y: D + 1.4, z: [-4.6, 4.6] },
      { k: "domes", u: [36, 92], n: 3, r: 0.9, y: D + 5.3, h: 1.1, z: 4.6, mat: "steel" },
      { k: "domes", u: [36, 92], n: 3, r: 0.9, y: D + 5.3, h: 1.1, z: -4.6, mat: "steel" },
      { k: "pipes", u: [22, 106], z: [-0.4, 0.4], y: D + 6.4, r: 0.25 },
      { k: "catwalk", u: [22, 106], y: D + 6, z: 0, w: 1.1, pitch: 7 },
      { k: "box", u: [62, 66], z: [-9, 9], y: [D, D + 1.2], mat: "steel", name: "manifold" },
      { k: "crane", u: 68, z: 7, y: D, h: 4, jib: 8, dir: Math.PI * 0.97, mat: "white" },
      { k: "cyl", u: 108, z: 0, y: [D, D + 14], r: 0.35, mat: "steel", name: "vent mast" },
      ...fittings({ L, B: 19.6, D, fc: [9, 2.2], aft: [], draft: 7.2 }),
    ],
  };
}

export const CHEMICAL_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ tankerLivery("red", "navy", "green", "black")];
export function chemicalTankerSpec(p?: ParamValues): ShipSpec {
  const L = 183;
  const D = 18;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 32, depth: D, draft: 11.5, entry: 0.2, run: 0.2, boot: 1, forecastle: [12, 2.4], fine: true }),
    livery: TANKER_LIVERIES[pick(CHEMICAL_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [5, 25], D, decks: 6, hw: 12, wings: 16, funnel: { u: [6, 12], hw: 2.6, h: 9 }, detail: true, freefall: 7 }),
      // a forest of pipes: one line per tank, on its racks
      { k: "pipes", u: [30, 170], z: [-6, -4.8, -3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6, 4.8, 6], y: D + 0.9, r: 0.22 },
      ...spacedAt(32, 168, 12).map((u): Item => ({ k: "box", u: [u - 0.2, u + 0.2], z: [-6.6, 6.6], y: [D - 0.05, D + 0.65], mat: "steel", top: false, name: "pipe rack" })),
      { k: "catwalk", u: [30, 170], y: D + 2.6, z: 0, w: 1.2, pitch: 8 },
      { k: "domes", u: [36, 164], n: 12, r: 0.9, y: D, h: 1.3, z: 10, mat: "steel" },
      { k: "domes", u: [36, 164], n: 12, r: 0.9, y: D, h: 1.3, z: -10, mat: "steel" },
      { k: "vents", at: spacedAt(38, 162, 6).flatMap((u) => [[u, 12.5], [u, -12.5]] as const), h: 4, r: 0.25, mat: "steel", name: "vent risers" },
      { k: "box", u: [96, 104], z: [-15, 15], y: [D, D + 1.4], mat: "steel", name: "manifold" },
      { k: "crane", u: 108, z: 8, y: D, h: 5, jib: 14, dir: Math.PI * 0.97, mat: "white" },
      mast(L - 7, D + 2.4, D + 13, 0.25),
      ...fittings({ L, B: 32, D, fc: [12, 2.4], aft: [], draft: 11.5 }),
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

/** A bulker's side-rolling hatch covers: each pair on its coaming, ridged along the centreline, ribbed across. */
function bulkHatches(u: readonly [number, number], n: number, hw: number, D: number, h: number, gap: number): Item {
  return { k: "hatches", u, n, hw, y: D, h, gap, coaming: h * 0.9, coamingMat: "deck", ridge: h * 0.55, ribs: 5, ribMat: "steel" };
}

/** A bulker's deck paint: the green walkways along both sides of the hatches. */
function bulkWalkways(u: readonly [number, number], z: number, D: number): Item[] {
  return [1, -1].map((sd): Item => ({ k: "box", u, z: sd > 0 ? [z, z + 1.2] : [-z - 1.2, -z], y: [D - 0.02, D + 0.03], mat: "green", name: "walkway paint" }));
}

export const CAPESIZE_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ bulkLivery("black", "red", "blue")];
export function capesizeSpec(p?: ParamValues): ShipSpec {
  const L = 292;
  const D = 24.7;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 45, depth: D, draft: 18.2, entry: 0.16, run: 0.18, boot: 1.2, forecastle: [14, 2.6], fine: true }),
    livery: BULK_LIVERIES[pick(CAPESIZE_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [6, 30], D, decks: 6, hw: 15, wings: 22.5, funnel: { u: [8, 16], hw: 3.2, h: 12 }, detail: true, freefall: 8 }),
      bulkHatches([40, 272], 9, 11, D, 2.2, 9),
      ...bulkWalkways([36, 276], 13, D),
      { k: "pipes", u: [36, 276], z: [19.5], y: D + 0.5, r: 0.25, mat: "red", name: "fire main" },
      { k: "vents", at: spacedAt(48, 264, 9).flatMap((u) => [[u, 16.5], [u, -16.5]] as const), h: 1.4, r: 0.4, mat: "steel", name: "hold vents" },
      mast(282, D + 2.6, D + 14),
      ...fittings({ L, B: 45, D, fc: [14, 2.6], aft: [], draft: 18.2 }),
    ],
  };
}

export function valemaxSpec(): ShipSpec {
  const L = 362;
  const D = 30.4;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 65, depth: D, draft: 23, entry: 0.15, run: 0.17, boot: 1.4, forecastle: [16, 2.8], fine: true }),
    livery: { hull: "#1d2024", bottom: "#8f2a22", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#2f6a45", hatch: "#d6b23a" },
    items: [
      ...aftHouse({ u: [8, 38], D, decks: 7, hw: 21, h: 2.9, wings: 32.5, funnel: { u: [10, 20], hw: 4.4, h: 15 }, detail: true, freefall: 9 }),
      bulkHatches([46, 342], 7, 15, D, 2.6, 14),
      ...bulkWalkways([42, 346], 18, D),
      { k: "pipes", u: [42, 346], z: [28], y: D + 0.5, r: 0.3, mat: "red", name: "fire main" },
      { k: "vents", at: spacedAt(56, 332, 7).flatMap((u) => [[u, 22], [u, -22]] as const), h: 1.6, r: 0.5, mat: "steel", name: "hold vents" },
      mast(352, D + 2.8, D + 16),
      ...fittings({ L, B: 65, D, fc: [16, 2.8], aft: [], draft: 23 }),
    ],
  };
}

export const HANDYSIZE_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ bulkLivery("red", "black", "blue", "grey")];
export function handysizeSpec(p?: ParamValues): ShipSpec {
  const L = 180;
  const D = 15;
  return {
    kind: "cargo",
    hull: oceanHull({ length: L, beam: 30, depth: D, draft: 10, entry: 0.2, run: 0.2, boot: 0.9, forecastle: [11, 2.4], fine: true }),
    livery: BULK_LIVERIES[pick(HANDYSIZE_PARAMS, p, "livery")]!,
    items: [
      ...aftHouse({ u: [4, 22], D, decks: 6, hw: 11, wings: 15, funnel: { u: [5, 11], hw: 2.4, h: 8 }, detail: true, freefall: 7 }),
      bulkHatches([30, 166], 5, 8.5, D, 1.8, 9),
      ...bulkWalkways([26, 170], 10, D),
      // the four deck cranes between the hatches, each on its pedestal with its cab
      ...[59.8, 88.6, 117.4, 146.2].flatMap((u): Item[] => [
        { k: "cyl", u, z: 0, y: [D - 0.1, D + 4], r: 2, n: 12, mat: "crane", name: "crane pedestal" },
        { k: "crane", u, z: 0, y: D + 4, h: 9, jib: 24, dir: Math.PI * 0.85, lift: 0.85, mat: "crane" },
        { k: "box", u: [u + 1.6, u + 3.6], z: [1.6, 3.4], y: [D + 10, D + 12.4], mat: "crane", name: "crane cab" },
      ]),
      { k: "vents", at: spacedAt(36, 160, 5).flatMap((u) => [[u, 11.8], [u, -11.8]] as const), h: 1.2, r: 0.35, mat: "steel", name: "hold vents" },
      mast(174, D + 2.4, D + 12),
      ...fittings({ L, B: 30, D, fc: [11, 2.4], aft: [], draft: 10 }),
    ],
  };
}

const LAKER_LIVERIES: Record<string, Record<string, string>> = {
  red: { hull: "#8f2a22", bottom: "#2b3138", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#1d2024", hatch: "#6c6f72", stripe: "#f2f0ea" },
  black: { hull: "#1d2024", bottom: "#8f2a22", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#c23128", hatch: "#6c6f72", stripe: "#f2f0ea" },
};
export const LAKER_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["red", "Red"], ["black", "Black"])];

/** A Great Lakes freighter: the pilothouse at the bow, the engine house aft, a long run of small hatches on their coamings. */
function lakeFreighter(L: number, B: number, D: number, T: number, liv: Record<string, string>, extra: Item[]): ShipSpec {
  return {
    kind: "cargo",
    hull: { length: L, beam: B, depth: D, draft: T, bow: "raked", stern: "transom", section: "flat", entry: 0.08, run: 0.08, transom: 0.85, rake: 0.012, sheer: [0, 0.6], forecastle: [12, 2.4], poop: [22, 2.4], boot: 0.5, stripe: 0.5, fine: true },
    livery: liv,
    items: [
      { k: "tier", u: [L - 14, L - 4], y: [D + 2.2, D + 5], hw: B / 2 - 1.6, lip: 0.4, windows: [{ y: 1, h: 0.8, w: 0.7, pitch: 2 }], front: { y: 1, h: 0.8, w: 0.7, n: 8 }, name: "texas deck" },
      { k: "tier", u: [L - 13, L - 6], y: [D + 5, D + 7.6], hw: B / 2 - 3, lip: 0.6, front: { y: 0.8, h: 1.1, w: 1, n: 7 }, windows: [{ y: 0.8, h: 1.1, w: 1, pitch: 1.6 }], name: "pilothouse" },
      mast(L - 9, D + 7.6, D + 14, 0.2),
      { k: "tier", u: [3, 20], y: [D + 2.2, D + 5.2], hw: B / 2 - 1.2, lip: 0.4, windows: [{ y: 1.1, h: 0.8, w: 0.7, pitch: 2.2 }], front: { y: 1.1, h: 0.8, w: 0.7, n: 8 }, name: "after house" },
      { k: "tier", u: [8, 19], y: [D + 5.2, D + 7.8], hw: B / 2 - 3, lip: 0.4, windows: [{ y: 1, h: 0.8, w: 0.7, pitch: 2.2 }], name: "after house upper deck" },
      funnel([4, 9], 2, [D + 5.2, D + 12.5], [["funnel", 0.85], ["black", 1]], 0.4),
      { k: "boats", at: [14], z: B / 2 - 0.6, y: D + 5.8, len: 7, r: 1.1 },
      { k: "bulwark", u: [L - 13, L], h: 1.2, t: 0.25 },
      { k: "bulwark", u: [0, 21.5], h: 1.2, t: 0.25 },
      { k: "anchors", u: L - 4, y: D + 0.6, s: 2.4 },
      { k: "pipes", u: [24, L - 16], z: [B / 2 - 1.5, -(B / 2 - 1.5)], y: D + 0.4, r: 0.18, mat: "white", name: "deck rails" },
      ...extra,
    ],
  };
}

export function lakerSpec(p?: ParamValues): ShipSpec {
  const L = 222.5;
  return lakeFreighter(L, 22.9, 11.3, 7.9, LAKER_LIVERIES[pick(LAKER_PARAMS, p, "livery")]!, [
    { k: "hatches", u: [26, L - 18], n: 21, hw: 7.2, y: 11.3, h: 0.7, gap: 3.6, coaming: 0.6, coamingMat: "hull", ribs: 1 },
    // the hatch crane on its rails along the deck
    { k: "gantry", u: 120, hw: 9.6, y: 11.3, h: 4.2, mat: "yellow", name: "hatch crane" },
  ]);
}

export function selfUnloaderSpec(): ShipSpec {
  const L = 304.8;
  const D = 17;
  return lakeFreighter(L, 32, D, 9.4, { ...LAKER_LIVERIES.red!, hull: "#5a2a24", stripe: "#1d2024" }, [
    { k: "hatches", u: [30, L - 18], n: 36, hw: 11, y: D, h: 0.7, gap: 2.6, coaming: 0.6, coamingMat: "hull", ribs: 1 },
    // the unloading boom on its saddles, stowed along the deck forward from the stern, its belt casing and A-frame
    { k: "boom", a: [24, D + 4.4, 0], b: [24 + 79, D + 4.4, 0], w: 1.3, mat: "grey" },
    { k: "box", u: [26, 103], z: [-1.6, 1.6], y: [D + 5.2, D + 6], mat: "grey", name: "belt casing" },
    { k: "box", u: [21, 27], z: [-3, 3], y: [D + 2.4, D + 5.2], mat: "grey", name: "boom slewing tower" },
    { k: "gantry", u: 24, hw: 3, y: D + 5.2, h: 8, lean: -2, mat: "grey", name: "boom A-frame" },
    { k: "rod", a: [22, D + 13, 0], b: [70, D + 5.4, 0], r: 0.12, mat: "rope", name: "boom pendant" },
    { k: "box", u: [96, 98], z: [-2, 2], y: [D, D + 3.2], mat: "grey", name: "boom saddle" },
    { k: "box", u: [60, 62], z: [-2, 2], y: [D, D + 3.2], mat: "grey", name: "boom saddle 2" },
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
    hull: oceanHull({ length: L, beam: 32.3, depth: D, draft: 9.5, entry: 0.24, run: 0.18, transom: 0.92, boot: 0.8, fine: true }),
    livery: { hull: side, house: side, deck: "#6f7a77", funnel: side, stripe: "#eeeeea" },
    items: [
      // the box of car decks to the top, its rows of vent openings and the deck lines, the bridge across its fore end
      {
        k: "tier", u: [0.2, L - 12], y: [D - 0.3, 36.8], inset: 0.02, round: [0, 14], mat: "house", top: "house", lip: 0.4,
        windows: [
          { y: 20.4, h: 1.2, w: 2.2, pitch: 5, from: 12, to: L - 30, mat: "black" },
          { y: 11.6, h: 1.2, w: 2.2, pitch: 5, from: 12, to: L - 30, mat: "black" },
          { y: 16.2, h: 0.35, w: L - 50, pitch: L, from: 12 + (L - 50) / 2, to: 12 + (L - 50) / 2, mat: "stripe" },
        ],
        name: "car decks",
      },
      { k: "tier", u: [L - 36, L - 20], y: [36.8, 39.6], hw: 15.6, lip: 0.6, front: { y: 0.8, h: 1.3, w: 1.6, n: 11 }, windows: [{ y: 0.8, h: 1.3, w: 1.3, pitch: 1.8 }], wings: { hw: 16.1, h: 2.4 }, name: "wheelhouse" },
      funnel([10, 18], 2.8, [36.8, 42], [["funnel", 1]], 0.4),
      ...exhausts([10, 18], 2.8, 42, 0.4),
      mast(L - 28, 39.6, 46, 0.25),
      { k: "boats", at: [40], z: 16.6, y: 30, len: 7, r: 1.1, name: "lifeboats" },
      // the quarter ramp, stowed upright on the starboard quarter, and the side ramp's door
      { k: "plate", pts: [[6, 14], [30, 14], [24, 30], [8, 30]], z: 16.25, t: 0.4, mat: "steel", name: "stern ramp" },
      { k: "plate", pts: [[96, 15], [108, 15], [108, 21], [96, 21]], z: -16.2, t: 0.2, mat: "steel", name: "side ramp door" },
      { k: "anchors", u: L - 9, y: D - 1.6, s: 2.4 },
      { k: "mooring", at: [L - 6], hw: 10, s: 0.9, winch: true },
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
    hull: oceanHull({ length: L, beam: 26, depth: D, draft: 7.5, entry: 0.22, run: 0.16, transom: 0.92, boot: 0.8, forecastle: [30, 3], fine: true }),
    livery: { hull: side, house: "#eeeeea", deck: "#6f7a77", funnel: side },
    items: [
      ...deckhouse({ u: [L - 30, L - 14], y0: D + 2.8, decks: 4, hw: 12, wings: 13, step: 0.4, detail: true }),
      mast(L - 20, D + 2.8 + 4 * 2.8, D + 22),
      ...[9, -9].flatMap((z): Item[] => [funnel([14, 22], 2.4, [D, D + 9], [["funnel", 0.86], ["black", 1]], 0.4, z), { k: "cyl", u: 20.6, z, y: [D + 8.4, D + 10], r: 0.5, mat: "black", name: "exhaust pipe" }]),
      ...cargo(p, [{ k: "containers", u: [26, L - 34], bays: 9, hw: 11.5, y: D, tiers: 1, seed: 41, rows: 2.6, name: "trailers" }], RORO_PARAMS),
      { k: "plate", pts: [[0.3, D - 6], [0.3, D + 0.2], [1.2, D + 9], [1.2, D - 6]], z: 0, t: 18, mat: "steel", name: "stern ramp" },
      { k: "bulwark", u: [22, L - 30], h: 1.1, t: 0.25 },
      { k: "freefall", u: L - 34, y: D + 5.6, len: 7, tilt: 0.55 },
      { k: "freefall", u: L - 46, y: D + 5.6, len: 7, tilt: -0.45, name: "freefall lifeboat aft-facing" },
      ...fittings({ L, B: 26, D, fc: [30, 3], aft: [3], draft: 7.5, rail: [0.6, 21.6] }),
    ],
  };
}

export const HEAVY_LIFT_PARAMS: readonly ParamSpec[] = [LOAD_PARAM];
export function heavyLiftSpec(p?: ParamValues): ShipSpec {
  const L = 275;
  const D = 15.5;
  return {
    kind: "cargo",
    hull: { length: L, beam: 70, depth: D, draft: 10.5, bow: "raked", stern: "transom", section: "flat", entry: 0.08, run: 0.04, transom: 0.95, rake: 0.03, boot: 1, stripe: 0, screws: 2, fine: true },
    livery: { hull: "#1d2024", bottom: "#8f2a22", boot: "#c23128", deck: "#8d3b2c", house: "#f2f0ea", funnel: "#d6b23a" },
    items: [
      // the forward house across the whole beam, and the stern's buoyancy casings
      ...deckhouse({ u: [L - 30, L - 4], y0: D - 0.2, decks: 7, hw: 30, h: 3, wings: 34.6, detail: true }),
      { k: "tier", u: [L - 22, L - 10], y: [D + 21, D + 25], hw: 10, name: "helideck pedestal" },
      { k: "helideck", u: L - 16, y: D + 25, r: 11 },
      ...[22, -22].flatMap((z): Item[] => [funnel([L - 30, L - 24], 3, [D + 18, D + 28], [["funnel", 0.86], ["black", 1]], 0.4, z), { k: "cyl", u: L - 25, z, y: [D + 27.4, D + 29.2], r: 0.6, mat: "black", name: "exhaust pipe" }]),
      ...[29, -29].flatMap((z): Item[] => [
        { k: "box", u: [2, 16], z: [z - 5, z + 5], y: [D, D + 14], mat: "house", name: z > 0 ? "starboard casing" : "port casing" },
        { k: "box", u: [4, 14], z: [z - 0.6, z + 0.6], y: [D + 14, D + 15], mat: "yellow", name: "casing rail" },
      ]),
      { k: "boats", at: [L - 18], z: 34.8, y: D + 6, len: 8, r: 1.3, name: "lifeboats" },
      { k: "mooring", at: [3, 18], hw: 32, s: 1.2, winch: true },
      { k: "anchors", u: L - 6, y: D - 3, s: 3.4 },
      ...cargo(p, [
        // a jack-up rig's hull on the deck, its accommodation, its four legs, its crane and drilling derrick
        { k: "box", u: [60, 170], z: [-30, 30], y: [D, D + 8], mat: "yellow", name: "cargo hull" },
        { k: "tier", u: [130, 166], y: [D + 8, D + 20], hw: 18, mat: "white", lip: 0.4, windows: [{ y: 2, h: 1, w: 1, pitch: 3 }, { y: 6, h: 1, w: 1, pitch: 3 }], front: { y: 2, h: 1, w: 1, n: 10 }, name: "cargo accommodation" },
        { k: "helideck", u: 160, y: D + 20.2, r: 9 },
        ...[[70, 24], [70, -24], [158, 24], [158, -24]].map(([u, z]): Item => ({ k: "cyl", u: u!, z: z!, y: [D + 8, D + 60], r: 2.2, n: 12, mat: "orange", name: "cargo leg" })),
        { k: "crane", u: 96, z: 20, y: D + 8, h: 10, jib: 34, dir: Math.PI * 0.95, lift: 0.4, mat: "orange", name: "cargo crane" },
        { k: "tier", u: [84, 104], y: [D + 8, D + 12], hw: 9, mat: "grey", name: "drill floor" },
        { k: "tier", u: [90, 98], y: [D + 12, D + 40], hw: 4, mat: "white", taper: [0.08, 28], name: "derrick" },
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
    hull: oceanHull({ length: L, beam: 23, depth: D, draft: 9, entry: 0.26, run: 0.22, boot: 0.8, sheer: [0.4, 1.4], forecastle: [12, 2.4], fine: true }),
    livery: { hull: side, bottom: "#8f2a22", deck: "#6f7a77", house: "#f2f0ea", funnel: "#1f4f9a", hatch: "#3d7a4a", mast: "#e3b021" },
    items: [
      ...aftHouse({ u: [6, 24], D, decks: 5, hw: 9, wings: 11.4, funnel: { u: [7, 12], hw: 2, h: 7 }, detail: true }),
      { k: "hatches", u: [30, 136], n: 4, hw: 6.5, y: D, h: 1.2, gap: 8, coaming: 1, coamingMat: "hull", ribs: 3 },
      ...[52, 82, 112].map((u): Item => ({ k: "derrick", u, y: D, h: 14, boom: 13, dir: Math.PI, pair: true, mat: "mast" })),
      ...[52, 82, 112].map((u): Item => ({ k: "box", u: [u - 1.4, u + 1.4], z: [-4, 4], y: [D - 0.1, D + 2.6], mat: "house", name: "winch house" })),
      { k: "vents", at: [[27, 7.5], [27, -7.5], [66, 7.5], [66, -7.5], [97, 7.5], [97, -7.5]], h: 2, r: 0.45, cowl: true, mat: "house", name: "hold ventilators" },
      { k: "bulwark", u: [0, 24], h: 1.1, t: 0.25 },
      ...fittings({ L, B: 23, D, fc: [12, 2.4], aft: [], draft: 9, rail: [24.4, L - 12.4] }),
    ],
  };
}

export function libertySpec(): ShipSpec {
  const L = 134.6;
  const D = 11.4;
  return {
    kind: "cargo",
    hull: { length: L, beam: 17.3, depth: D, draft: 8.5, bow: "raked", stern: "cruiser", section: "round", sheer: [1.2, 2.6], forecastle: [12, 2.4], poop: [10, 2.2], boot: 0.4, screws: 1, fine: true },
    livery: { hull: "#6f777b", bottom: "#7a2c26", boot: "#2a2d30", deck: "#6b5a46", house: "#7c8487", funnel: "#6f777b", mast: "#7c8487" },
    items: [
      // the midship house over the boiler room, the bridge on top
      { k: "tier", u: [58, 78], y: [D - 0.1, D + 2.6], hw: 7.6, lip: 0.3, windows: [{ y: 1.0, h: 0.7, w: 0.6, pitch: 2.2 }], front: { y: 1, h: 0.7, w: 0.6, n: 8 }, name: "midship house" },
      { k: "tier", u: [63, 77], y: [D + 2.6, D + 5.0], hw: 6.6, lip: 0.3, windows: [{ y: 0.9, h: 0.7, w: 0.6, pitch: 2 }], front: { y: 0.9, h: 0.7, w: 0.6, n: 7 }, name: "boat deck house" },
      { k: "tier", u: [71, 77], y: [D + 5.0, D + 7.4], hw: 5.4, lip: 0.4, front: { y: 0.8, h: 0.8, w: 0.7, n: 5 }, wings: { hw: 8.4, h: 1.2 }, name: "wheelhouse" },
      funnel([65, 69.5], 1.7, [D + 5.0, D + 13.5], [["funnel", 0.88], ["black", 1]], 0.6),
      { k: "boats", at: [66.5, 74], z: 6.9, y: D + 3.6, len: 7, r: 1.1 },
      { k: "hatches", u: [16, 54], n: 2, hw: 4.5, y: D, h: 0.6, gap: 8, coaming: 0.8, coamingMat: "hull" },
      { k: "hatches", u: [82, 122], n: 3, hw: 4.5, y: D, h: 0.6, gap: 6, coaming: 0.8, coamingMat: "hull" },
      { k: "derrick", u: 104, y: D, h: 20, boom: 14, dir: 0, pair: true },
      { k: "derrick", u: 86, y: D, h: 18, boom: 13, dir: 0, pair: true },
      { k: "derrick", u: 34, y: D, h: 18, boom: 13, dir: Math.PI, pair: true },
      // the deck houses at the masts' feet, the ventilator cowls and the gun tubs fore and aft
      ...[104, 86, 34].map((u): Item => ({ k: "box", u: [u - 1.5, u + 1.5], z: [-2.4, 2.4], y: [D - 0.1, D + 2.2], mat: "house", name: "mast house" })),
      { k: "vents", at: [[56, 4], [56, -4], [80, 4], [80, -4], [62, 6.4], [62, -6.4], [14, 3], [14, -3]], h: 2.6, r: 0.45, cowl: true, mat: "house", name: "ventilators" },
      { k: "cyl", u: 128, z: 0, y: [D + 2.4, D + 3.6], r: 2.2, n: 12, mat: "house", name: "forward gun tub" },
      { k: "cyl", u: 4, z: 0, y: [D + 2.2, D + 3.4], r: 2.4, n: 12, mat: "house", name: "after gun tub" },
      { k: "bulwark", u: [L - 12.4, L], h: 1, t: 0.2 },
      { k: "bulwark", u: [0, 10.4], h: 1, t: 0.2 },
      { k: "bulwark", u: [10.6, L - 12.6], h: 0.9, t: 0.2, name: "well deck bulwark" },
      { k: "anchors", u: L - 5.5, y: D + 1.6, s: 1.8 },
      { k: "mooring", at: [L - 6], hw: 5, s: 0.6, winch: true },
    ],
  };
}

export function victorySpec(): ShipSpec {
  const L = 138.8;
  const D = 11.6;
  return {
    kind: "cargo",
    hull: { length: L, beam: 18.9, depth: D, draft: 8.7, bow: "raked", stern: "cruiser", section: "round", rake: 0.05, sheer: [1.0, 2.8], forecastle: [14, 2.4], poop: [8, 2.2], boot: 0.4, screws: 1, fine: true },
    livery: { hull: "#5d666b", bottom: "#7a2c26", boot: "#2a2d30", deck: "#6b5a46", house: "#e9e6de", funnel: "#5d666b", mast: "#e9e6de" },
    items: [
      { k: "tier", u: [60, 82], y: [D - 0.1, D + 2.6], hw: 8.2, lip: 0.3, windows: [{ y: 1.0, h: 0.7, w: 0.6, pitch: 2.2 }], front: { y: 1, h: 0.7, w: 0.6, n: 9 }, name: "midship house" },
      { k: "tier", u: [64, 81], y: [D + 2.6, D + 5.0], hw: 7, lip: 0.3, windows: [{ y: 0.9, h: 0.7, w: 0.6, pitch: 2 }], front: { y: 0.9, h: 0.7, w: 0.6, n: 8 }, name: "boat deck house" },
      { k: "tier", u: [74, 80.5], y: [D + 5.0, D + 7.6], hw: 5.8, lip: 0.4, front: { y: 0.8, h: 0.9, w: 0.7, n: 6 }, wings: { hw: 9.2, h: 1.2 }, name: "wheelhouse" },
      funnel([66, 72], 2.2, [D + 5.0, D + 12.5], [["funnel", 0.86], ["black", 1]], 0.9),
      { k: "boats", at: [68, 76], z: 7.4, y: D + 3.6, len: 7, r: 1.1 },
      { k: "hatches", u: [18, 56], n: 2, hw: 4.8, y: D, h: 0.6, gap: 8, coaming: 0.8, coamingMat: "hull" },
      { k: "hatches", u: [86, 124], n: 3, hw: 4.8, y: D, h: 0.6, gap: 6, coaming: 0.8, coamingMat: "hull" },
      { k: "derrick", u: 112, y: D, h: 16, boom: 13, dir: 0, pair: true },
      { k: "derrick", u: 91, y: D, h: 16, boom: 13, dir: 0, pair: true },
      { k: "derrick", u: 38, y: D, h: 16, boom: 13, dir: Math.PI, pair: true },
      ...[112, 91, 38].map((u): Item => ({ k: "box", u: [u - 1.5, u + 1.5], z: [-2.6, 2.6], y: [D - 0.1, D + 2.2], mat: "house", name: "mast house" })),
      mast(128, D + 2.4, D + 22, 0.3),
      mast(30, D + 0.2, D + 20, 0.3),
      { k: "vents", at: [[58, 4.2], [58, -4.2], [84, 4.2], [84, -4.2], [63, 7], [63, -7], [12, 3], [12, -3]], h: 2.6, r: 0.45, cowl: true, mat: "house", name: "ventilators" },
      { k: "bulwark", u: [L - 14.4, L], h: 1, t: 0.2 },
      { k: "bulwark", u: [0, 8.4], h: 1, t: 0.2 },
      { k: "bulwark", u: [8.6, L - 14.6], h: 0.9, t: 0.2, name: "well deck bulwark" },
      { k: "anchors", u: L - 6.5, y: D + 1.6, s: 1.8 },
      { k: "mooring", at: [L - 7], hw: 5.4, s: 0.6, winch: true },
    ],
  };
}

// ---------------------------------------------------------------------------
// river and coastal cargo

export const EUROPA_PARAMS: readonly ParamSpec[] = [LOAD_PARAM];
/** A river vessel's fittings: bollards along both sides, the anchors in the bow and the stern, the rubbing strake, the draft marks. */
function riverFittings(L: number, B: number, D: number, T: number, every = 12): Item[] {
  const at = Array.from({ length: Math.max(2, Math.round((L - 4) / every) + 1) }, (_, i) => 2 + ((L - 4) * i) / Math.max(1, Math.round((L - 4) / every)));
  return [
    { k: "mooring", at, hw: B / 2 - 0.45, s: 0.45 },
    { k: "anchors", u: L - 2.2, y: D - 0.6, s: 1.1 },
    { k: "fender", u: [0, L], y: [D - 0.55, D - 0.25], out: 0.15, mat: "black", name: "rubbing strake" },
    { k: "marks", at: [L * 0.85, L * 0.5, L * 0.12], y: [Math.max(0.6, T - 1.5), T + 0.5], step: 0.5, s: 0.3 },
  ];
}

/** A river vessel's wheelhouse on its lift, the car on the deck aft, the radar mast and the exhaust. */
function riverAft(u0: number, u1: number, D: number, hw: number, car = true): Item[] {
  return [
    { k: "tier", u: [u0, u1], y: [D - 0.1, D + 2.4], hw, lip: 0.25, windows: [{ y: 0.9, h: 0.8, w: 0.9, pitch: 1.8 }], front: { y: 0.9, h: 0.8, w: 0.9, n: 5 }, name: "accommodation" },
    { k: "cyl", u: u1 - 2.2, z: 0, y: [D + 2.4, D + 3.4], r: 1, n: 10, mat: "steel", name: "wheelhouse lift" },
    { k: "tier", u: [u1 - 4.2, u1 - 0.2], y: [D + 3.4, D + 5.6], hw: Math.min(2.6, hw - 1.6), lip: 0.35, front: { y: 0.8, h: 1.1, w: 0.9, n: 3 }, windows: [{ y: 0.8, h: 1.1, w: 1, pitch: 1.4 }], name: "wheelhouse" },
    { k: "rail", u: [u0 + 0.4, u1 - 4.6], y: D + 2.4, hw: hw - 0.2, h: 0.9, name: "roof rail" },
    { k: "cyl", u: u0 + 1.5, z: hw - 1, y: [D + 2.4, D + 4.4], r: 0.25, mat: "funnel", name: "exhaust" },
    { k: "mast", u: u1 - 2.2, y: [D + 5.6, D + 7.4], r: 0.07, radar: true, name: "radar mast" },
    ...(car ? [{ k: "box", u: [u0 + 1, u0 + 5], z: [-0.9, 0.9], y: [D + 2.4, D + 3.4], mat: "c1", name: "car" } as Item, { k: "tier", u: [u0 + 2, u0 + 4], y: [D + 3.4, D + 4], hw: 0.8, mat: "c1", windows: [{ y: 0.1, h: 0.4, w: 0.5, pitch: 0.8 }], name: "car cabin" } as Item] : []),
  ];
}

export function europaschiffSpec(p?: ParamValues): ShipSpec {
  const L = 80;
  const D = 2.9;
  return {
    kind: "cargo",
    hull: { length: L, beam: 9.5, depth: D, draft: 2.5, bow: "barge", stern: "transom", section: "flat", entry: 0.07, run: 0.1, transom: 0.8, rake: 0.06, sheer: [0.2, 0.6], boot: 0.15, stripe: 0.2, screws: 1, fine: true },
    livery: { hull: "#1d2024", bottom: "#8f2a22", boot: "#1d2024", stripe: "#c23128", deck: "#6b6f6c", house: "#f2f0ea", hatch: "#5a6a72", funnel: "#1d2024" },
    items: [
      { k: "box", u: [12, 74], z: [-4.25, 4.25], y: [D - 0.1, D + 0.9], mat: "hull", name: "hold coaming" },
      ...(loaded(p)
        ? [{ k: "containers", u: [12.4, 73.6], bays: 5, hw: 3.9, y: D + 0.9, tiers: 2, seed: 43, rows: 2.5 } as Item]
        : [{ k: "hatches", u: [12.4, 73.6], n: 12, hw: 4.1, y: D + 0.9, h: 0.5, gap: 0.15, ridge: 0.2 } as Item]),
      ...riverAft(1.5, 10, D, 4.4),
      // the fore deck: its cabin and the anchor winch
      { k: "tier", u: [L - 5.5, L - 2], y: [D - 0.1, D + 1.8], hw: 3.6, lip: 0.2, windows: [{ y: 0.7, h: 0.6, w: 0.6, pitch: 1.4 }], name: "fore cabin" },
      rod([L - 1.2, D + 0.5, -1], [L - 1.2, D + 0.5, 1], 0.35, "red", "anchor winch"),
      { k: "pipes", u: [12, 74], z: [4.5, -4.5], y: D + 0.15, r: 0.06, mat: "white", name: "gangboard rails" },
      ...riverFittings(L, 9.5, D, 2.5),
    ],
  };
}

export function rhineTankerSpec(): ShipSpec {
  const L = 110;
  const D = 5;
  return {
    kind: "cargo",
    hull: { length: L, beam: 11.45, depth: D, draft: 3.5, bow: "barge", stern: "transom", section: "flat", entry: 0.07, run: 0.1, transom: 0.82, rake: 0.05, sheer: [0.2, 0.6], boot: 0.2, stripe: 0.3, screws: 2, fine: true },
    livery: { hull: "#1f3a5a", bottom: "#8f2a22", boot: "#1d2024", stripe: "#e8bf2a", deck: "#c23128", house: "#f2f0ea", funnel: "#1d2024" },
    items: [
      { k: "pipes", u: [14, 104], z: [-1.6, -0.8, 0, 0.8, 1.6], y: D + 0.5, r: 0.14 },
      ...Array.from({ length: 11 }, (_, i): Item => ({ k: "box", u: [16 + i * 8.6 - 0.15, 16 + i * 8.6 + 0.15], z: [-1.9, 1.9], y: [D - 0.05, D + 0.36], mat: "steel", top: false, name: "pipe support" })),
      { k: "catwalk", u: [14, 104], y: D + 1.8, z: 2.4, w: 0.9, pitch: 6 },
      { k: "domes", u: [18, 100], n: 9, r: 0.6, y: D, h: 0.9, z: -3.5, mat: "steel", name: "tank hatches" },
      { k: "vents", at: [[22, 4.4], [40, 4.4], [58, 4.4], [76, 4.4], [94, 4.4]], h: 1.6, r: 0.12, mat: "steel", name: "vent risers" },
      { k: "box", u: [55, 59], z: [-5.2, 5.2], y: [D, D + 0.4], mat: "steel", name: "manifold" },
      ...[-1.2, 0, 1.2].map((du): Item => rod([57 + du, D + 0.8, -5.2], [57 + du, D + 0.8, 5.2], 0.12, "steel", "manifold crossover")),
      { k: "crane", u: 61, z: 3, y: D, h: 2, jib: 7, dir: Math.PI * 0.97, mat: "white", name: "hose crane" },
      ...riverAft(1.5, 12, D, 5.2),
      { k: "box", u: [L - 6, L - 2], z: [-4, 4], y: [D, D + 1.8], mat: "house", name: "fore cabin" },
      rod([L - 1.2, D + 0.5, -1], [L - 1.2, D + 0.5, 1], 0.35, "red", "anchor winch"),
      ...riverFittings(L, 11.45, D, 3.5),
    ],
  };
}

export const PUSH_BARGE_PARAMS: readonly ParamSpec[] = [LOAD_PARAM];
export function pushBargeSpec(p?: ParamValues): ShipSpec {
  const L = 76.5;
  const D = 4;
  const T = loaded(p) ? 3.5 : 0.7;
  return {
    kind: "cargo",
    hull: { length: L, beam: 11.4, depth: D, draft: T, bow: "barge", stern: "sternwheel", section: "flat", entry: 0.07, run: 0.04, transom: 0.96, rake: 0.06, boot: 0.15, rudder: false, fine: true },
    livery: { hull: "#2b2f33", bottom: "#8f2a22", boot: "#1d2024", deck: "#5f6466", hatch: "#3b3f43", black: "#1b1c1d" },
    items: [
      { k: "box", u: [4, 72], z: [-5.3, 5.3], y: [D - 0.1, D + 1], mat: "hull", top: false, name: "hold coaming" },
      ...cargo(p, [
        { k: "box", u: [6, 70], z: [-4.8, 4.8], y: [D + 0.4, D + 1.4], mat: "black", name: "coal" },
        { k: "box", u: [12, 64], z: [-3.6, 3.6], y: [D + 1.4, D + 2.2], mat: "black", name: "coal heap" },
        { k: "box", u: [20, 56], z: [-2.2, 2.2], y: [D + 2.2, D + 2.7], mat: "black", name: "coal crest" },
      ]),
      // the coupling winches and the bollards along both sides, the stiffeners of the coaming
      { k: "box", u: [1, 3], z: [-5, 5], y: [D, D + 0.5], mat: "steel", name: "coupling" },
      ...[2, L - 2].flatMap((u): Item[] => [3.6, -3.6].map((z): Item => rod([u, D + 0.6, z - 0.6], [u, D + 0.6, z + 0.6], 0.3, "steel", "coupling winch"))),
      ...[12, 24, 36, 48, 60].flatMap((u): Item[] => [5.35, -5.35].map((z): Item => ({ k: "box", u: [u - 0.15, u + 0.15], z: [z - 0.15, z + 0.15], y: [D - 0.1, D + 1], mat: "hull", name: "coaming stiffener" }))),
      { k: "mooring", at: [3.5, 20, 38, 56, L - 3.5], hw: 5.25, s: 0.45 },
      { k: "fender", u: [0, L], y: [D - 0.5, D - 0.2], out: 0.15, mat: "black", name: "rubbing strake" },
      { k: "marks", at: [L * 0.9, L * 0.5, L * 0.1], y: [0.5, 3.5], step: 0.5, s: 0.3 },
    ],
  };
}

export const YANGTZE_PARAMS: readonly ParamSpec[] = [LOAD_PARAM];
export function yangtzeSpec(p?: ParamValues): ShipSpec {
  const L = 90;
  const D = 4.5;
  return {
    kind: "cargo",
    hull: { length: L, beam: 15.8, depth: D, draft: 3.5, bow: "raked", stern: "transom", section: "flat", entry: 0.14, run: 0.1, transom: 0.8, rake: 0.05, sheer: [0.3, 1.2], boot: 0.3, stripe: 0.3, screws: 2, fine: true },
    livery: { hull: "#2a3b5f", bottom: "#8f2a22", boot: "#1d2024", stripe: "#c23128", deck: "#6b6f6c", house: "#f2f0ea", funnel: "#2a3b5f" },
    items: [
      { k: "box", u: [14, 82], z: [-7.2, 7.2], y: [D - 0.1, D + 1.2], mat: "hull", top: false, name: "hold coaming" },
      ...cargo(p, [{ k: "containers", u: [14.5, 81.5], bays: 5, hw: 6.6, y: D + 0.4, tiers: 3, seed: 47, rows: 2.5 }, { k: "lashing", at: bayGaps([14.5, 81.5], 5), hw: 6.4, y: D + 0.4, h: 2.6 }]),
      ...deckhouse({ u: [1, 12], y0: D - 0.1, decks: 3, hw: 7, h: 2.6, step: 0.3, wings: 7.6, detail: true }),
      { k: "cyl", u: 2.5, z: 4.5, y: [D + 5.2, D + 9], r: 0.4, mat: "funnel", name: "exhaust" },
      { k: "cyl", u: 2.5, z: -4.5, y: [D + 5.2, D + 9], r: 0.4, mat: "funnel", name: "exhaust port" },
      mast(8, D + 7.7, D + 11, 0.1),
      { k: "box", u: [83, 88], z: [-6, 6], y: [D - 0.1, D + 1], mat: "hull", name: "forecastle deck" },
      { k: "mast", u: 86, y: [D + 1, D + 7], r: 0.1, name: "fore mast" },
      { k: "bulwark", u: [82, L], h: 1, t: 0.2 },
      ...riverFittings(L, 15.8, D, 3.5, 14),
    ],
  };
}

export function volgaDonSpec(): ShipSpec {
  const L = 138.3;
  const D = 5.5;
  const B = 16.5;
  return {
    kind: "cargo",
    hull: { length: L, beam: B, depth: D, draft: 3.5, bow: "raked", stern: "transom", section: "flat", entry: 0.12, run: 0.1, transom: 0.8, rake: 0.04, sheer: [0.3, 1.4], forecastle: [10, 1.8], boot: 0.3, screws: 2, fine: true },
    livery: { hull: "#25303a", bottom: "#8f2a22", boot: "#f2f0ea", deck: "#7d4a3a", house: "#f2f0ea", funnel: "#c23128", hatch: "#6c6f72" },
    items: [
      { k: "hatches", u: [16, 126], n: 4, hw: 6.8, y: D, h: 1.2, gap: 2.2, coaming: 0.8, coamingMat: "hull", ribs: 4 },
      ...deckhouse({ u: [2, 14], y0: D - 0.1, decks: 3, hw: 7.4, h: 2.6, step: 0.3, wings: 8.1, detail: true }),
      funnel([3, 6], 1.3, [D + 5, D + 9.5], [["funnel", 0.8], ["black", 1]], 0.3),
      { k: "boats", at: [9], z: 7.9, y: D + 2.6, len: 5, r: 0.8 },
      mast(10, D + 7.7, D + 12, 0.12),
      mast(L - 6, D + 1.8, D + 9, 0.15),
      { k: "pipes", u: [16, 126], z: [B / 2 - 0.8, -(B / 2 - 0.8)], y: D + 0.4, r: 0.08, mat: "white", name: "deck rails" },
      ...fittings({ L, B, D, fc: [10, 1.8], aft: [], draft: 3.5, anchor: 1.4, rail: false }),
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
