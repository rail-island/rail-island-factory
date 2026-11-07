// The world's passenger ships (docs/models/world-ships-passenger.md): city and car
// ferries (many double-ended), fast craft (catamarans, a hovercraft, hydrofoils),
// paddle steamers and river boats, coastal ships, cruise ships and the great
// liners, each a ShipSpec on the hull kit (hullKit.ts) at its real size, modelled
// on the photographs in assets/<references>/ and the published figures in each
// folder's SOURCES.md. Metres from the stern (u), heights from the keel. The ids
// are stored in the game's saved maps: never rename one.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { hullGeometry, shipLod, worldShip, type HullForm, type Item, type ShipSpec, type Tier } from "./hullKit.ts";
import { colourParam, detailed, exhausts, fittings, funnel, liferafts, liveryParam, mast, passengerFittings, pick, shipDesigns, type WorldShip } from "./worldShips.ts";

/** A rod between two points (u, y, z). */
const rod = (a: [number, number, number], b: [number, number, number], r: number, mat: string, name?: string): Item => ({ k: "rod", a, b, r, mat, ...(name ? { name } : {}) });

/**
 * Passenger decks: `n` tiers of `h` metres from y0, each from u0 to u1 drawn in
 * by `step` metres at each end per deck and `inset` from the hull's side (or at
 * a fixed half-width), a row of windows on each.
 */
function decks(o: { u: readonly [number, number]; y0: number; n: number; h?: number; step?: readonly [number, number]; hw?: number; inset?: number; dhw?: number; round?: readonly [number, number]; mat?: string; pitch?: number; win?: number; glazed?: boolean; name?: string }): Tier[] {
  const h = o.h ?? 2.8;
  const [sa, sf] = o.step ?? [0, 0];
  return Array.from({ length: o.n }, (_, k): Tier => ({
    k: "tier",
    u: [o.u[0] + sa * k, o.u[1] - sf * k],
    y: [o.y0 + h * k, o.y0 + h * (k + 1)],
    ...(o.hw !== undefined ? { hw: o.hw - (o.dhw ?? 0) * k } : { inset: (o.inset ?? 0.4) + (o.dhw ?? 0) * k }),
    ...(o.round ? { round: o.round } : {}),
    ...(o.mat ? { mat: o.mat } : {}),
    windows: [o.glazed
      ? { y: h * 0.2, h: h * 0.62, w: Math.min(2.4, (o.pitch ?? 2.6) * 0.85), pitch: o.pitch ?? 2.6 }
      : { y: h * 0.36, h: h * 0.38, w: o.win ?? Math.min(1.4, h * 0.45), pitch: o.pitch ?? Math.max(2, h * 0.85) }],
    name: `${o.name ?? "deck"} ${k + 1}`,
  }));
}

/** A double-ended ferry's hull: both ends alike, a little sheer at each. */
function doubleEnded(o: { length: number; beam: number; depth: number; draft: number; entry?: number; sheer?: number; boot?: number; stripe?: number }): HullForm {
  const e = o.entry ?? 0.22;
  return { fine: true, length: o.length, beam: o.beam, depth: o.depth, draft: o.draft, bow: "canoe", stern: "canoe", section: "round", entry: e, run: e, rake: 0.03, sheer: [o.sheer ?? 0.4, o.sheer ?? 0.4], boot: o.boot ?? 0.3, stripe: o.stripe ?? 0, rudder: false };
}

/** A pilothouse at each end of a double-ended ferry, on its top deck. */
function pilothouses(L: number, y: number, hw: number, len: number, h: number, inset = 3): Item[] {
  return [
    { k: "tier", u: [L - inset - len, L - inset], y: [y, y + h], hw, lip: 0.4, front: { y: h * 0.3, h: h * 0.5, w: Math.min(1.4, hw * 0.4), n: Math.max(3, Math.round(hw)) }, windows: [{ y: h * 0.3, h: h * 0.5, w: 1.1, pitch: 1.6 }], name: "forward pilothouse" },
    { k: "tier", u: [inset, inset + len], y: [y, y + h], hw, lip: 0.4, windows: [{ y: h * 0.3, h: h * 0.5, w: 1.1, pitch: 1.6 }], name: "after pilothouse" },
    ...[L - inset - len / 2, inset + len / 2].map((u): Item => ({ k: "mast", u, y: [y + h, y + h + 2.4], r: 0.08, radar: true, name: "pilothouse radar" })),
  ];
}

// ---------------------------------------------------------------------------
// city ferries

export function statenIslandSpec(): ShipSpec {
  const L = 94.5;
  const D = 6.5;
  return {
    kind: "passenger",
    hull: doubleEnded({ length: L, beam: 21, depth: D, draft: 4.1, entry: 0.2, stripe: 0.5 }),
    livery: { hull: "#e8712a", stripe: "#e8712a", bottom: "#1d2024", boot: "#1d2024", deck: "#7d8287", house: "#e8712a", roof: "#c8cbc7" },
    items: detailed([
      ...decks({ u: [6, L - 6], y0: D - 0.2, n: 2, h: 3.2, round: [8, 8], inset: 0.6, pitch: 2.4, glazed: true }),
      { k: "tier", u: [16, L - 16], y: [D - 0.2 + 6.4, D - 0.2 + 9.4], inset: 2.4, round: [6, 6], windows: [{ y: 0.8, h: 1.4, w: 1.6, pitch: 2.4 }], name: "upper deck" },
      ...pilothouses(L, D - 0.2 + 9.4, 4, 6, 2.8, 12),
      funnel([44, 50], 1.6, [D + 9.2, D + 15], [["house", 0.8], ["black", 1]], 0, 0),
      mast(L - 15, D + 12, D + 18, 0.15), mast(15, D + 12, D + 18, 0.15),
      { k: "rail", u: [18, L - 18], y: D - 0.2 + 9.4, hw: 7.6, h: 1.1, name: "hurricane deck rail" },
      ...exhausts([44, 50], 1.6, D + 15),
      ...liferafts(24, L - 24, 6, 9.4, D - 0.2 + 6.5),
      ...[16, L - 16].map((u): Item => ({ k: "domes", u: [u, u], n: 1, r: 0.8, y: D + 18, h: 0.8, mat: "white", name: "radome" })),
      ...passengerFittings({ L, B: 21, D, T: 4.1, both: true, fender: 0.45 }),
    ]),
  };
}

export function starFerrySpec(): ShipSpec {
  const L = 33.8;
  const D = 3;
  return {
    kind: "passenger",
    hull: doubleEnded({ length: L, beam: 9.1, depth: D, draft: 2.4, entry: 0.28, stripe: 0.4 }),
    livery: { hull: "#2f6a45", stripe: "#f2f0ea", bottom: "#8f2a22", boot: "#1d2024", deck: "#7d6a55", house: "#f2f0ea", roof: "#2f6a45" },
    items: detailed([
      { k: "tier", u: [3, L - 3], y: [D - 0.1, D + 2.6], inset: 0.4, round: [3, 3], windows: [{ y: 0.9, h: 1.3, w: 1.2, pitch: 1.6 }], name: "lower saloon" },
      { k: "tier", u: [5, L - 5], y: [D + 2.6, D + 5.2], inset: 0.8, round: [3, 3], mat: "house", windows: [{ y: 0.7, h: 1.4, w: 1.2, pitch: 1.6 }], name: "upper saloon" },
      { k: "tier", u: [L - 7, L - 4], y: [D + 5.2, D + 6.8], hw: 1.6, front: { y: 0.4, h: 0.8, w: 0.7, n: 3 }, name: "forward wheelhouse" },
      { k: "tier", u: [4, 7], y: [D + 5.2, D + 6.8], hw: 1.6, windows: [{ y: 0.4, h: 0.8, w: 0.6, pitch: 1 }], name: "after wheelhouse" },
      { k: "cyl", u: L / 2, z: 0, y: [D + 5.2, D + 7.2], r: 0.4, mat: "black", name: "exhaust" },
      { k: "cyl", u: L - 4, z: 0, y: [D + 6.8, D + 9], r: 0.08, mat: "white", name: "forward mast" },
      { k: "rail", u: [5.4, L - 5.4], y: D + 5.2, hw: 3.4, h: 0.9, name: "top deck rail" },
      { k: "rail", u: [0.8, 3], y: D, hw: 3.6, h: 1, name: "after deck rail" },
      { k: "rail", u: [L - 3, L - 0.8], y: D, hw: 3.6, h: 1, name: "forward deck rail" },
      ...[1, -1].flatMap((sd): Item[] => [8, 16, 24].map((u): Item => ({ k: "cyl", u, z: sd * 3.9, y: [D + 1.2, D + 1.9], r: 0.32, n: 8, mat: "orange", name: "lifebuoy" }))),
      { k: "cyl", u: L - 5.5, z: 0, y: [D + 6.8, D + 7.2], r: 0.25, mat: "black", name: "searchlight" },
      ...passengerFittings({ L, B: 9.1, D, T: 2.4, both: true, fender: 0.3 }),
    ]),
  };
}

export function bcSpiritSpec(): ShipSpec {
  const L = 167.5;
  const D = 11;
  return {
    kind: "passenger",
    hull: doubleEnded({ length: L, beam: 32.9, depth: D, draft: 6.7, entry: 0.18, boot: 0.5, stripe: 2.2 }),
    livery: { hull: "#f2f0ea", stripe: "#1f4f9a", bottom: "#8f2a22", boot: "#1d2024", deck: "#7d8287", house: "#f2f0ea", funnel: "#f2f0ea", red: "#c23128" },
    items: detailed([
      // the car decks' side shell, then the passenger decks
      { k: "tier", u: [4, L - 4], y: [D - 0.2, D + 5.6], inset: 0.05, round: [10, 10], mat: "hull", top: "deck", name: "car deck" },
      ...decks({ u: [14, L - 14], y0: D + 5.6, n: 3, h: 3, round: [8, 8], inset: 1.0, dhw: 0.8, pitch: 2.6, glazed: true, step: [3, 3] }),
      ...pilothouses(L, D + 14.6, 9, 7, 3, 20),
      funnel([72, 80], 3, [D + 14.6, D + 22], [["funnel", 0.7], ["red", 0.85], ["funnel", 1]], 0, 6),
      funnel([88, 96], 3, [D + 14.6, D + 22], [["funnel", 0.7], ["red", 0.85], ["funnel", 1]], 0, -6),
      { k: "boats", at: [50, 118], z: 15.8, y: D + 7, len: 8, r: 1.3 },
      { k: "rail", u: [20, L - 20], y: D + 14.6, hw: 11.4, h: 1.1, name: "sun deck rail" },
      ...[50, 118].map((u): Item => ({ k: "boats", at: [u + 12], z: 15.8, y: D + 7, len: 8, r: 1.3, name: "lifeboats" })),
      ...liferafts(30, L - 30, 8, 15.4, D + 5.7),
      ...exhausts([72, 80], 3, D + 22).map((it) => ({ ...it, z: (it as { z: number }).z + 6 }) as Item),
      ...exhausts([88, 96], 3, D + 22).map((it) => ({ ...it, z: (it as { z: number }).z - 6 }) as Item),
      ...[30, L - 30].map((u): Item => ({ k: "domes", u: [u, u], n: 1, r: 1, y: D + 17.6, h: 1, mat: "white", name: "radome" })),
      ...passengerFittings({ L, B: 32.9, D, T: 6.7, both: true, fender: 0.5 }),
    ]),
  };
}

export function wsfJumboSpec(): ShipSpec {
  const L = 140;
  const D = 9;
  return {
    kind: "passenger",
    hull: doubleEnded({ length: L, beam: 27, depth: D, draft: 5.3, entry: 0.18, boot: 0.4, stripe: 1.2 }),
    livery: { hull: "#f2f0ea", stripe: "#2f6a45", bottom: "#2f6a45", boot: "#1d2024", deck: "#7d8287", house: "#f2f0ea", funnel: "#f2f0ea" },
    items: detailed([
      { k: "tier", u: [3, L - 3], y: [D - 0.2, D + 5.2], inset: 0.05, round: [9, 9], mat: "hull", top: "deck", name: "car deck" },
      ...decks({ u: [10, L - 10], y0: D + 5.2, n: 2, h: 3, round: [8, 8], inset: 1.2, dhw: 1, pitch: 2.4, glazed: true, step: [4, 4] }),
      ...pilothouses(L, D + 11.2, 6, 6, 3, 14),
      funnel([64, 70], 2.6, [D + 11.2, D + 17], [["funnel", 0.85], ["black", 1]], 0, 5),
      funnel([70, 76], 2.6, [D + 11.2, D + 17], [["funnel", 0.85], ["black", 1]], 0, -5),
      { k: "rail", u: [16, L - 16], y: D + 11.2, hw: 9.6, h: 1.1, name: "sun deck rail" },
      ...liferafts(24, L - 24, 6, 12.8, D + 5.3),
      { k: "boats", at: [40, L - 40], z: 13.2, y: D + 6.4, len: 7, r: 1.1, name: "rescue boats" },
      ...[67, 73].map((u, i): Item => ({ k: "cyl", u: u + 1.8, z: i ? -5 : 5, y: [D + 16.6, D + 18], r: 0.4, mat: "black", name: "exhaust pipe" })),
      ...[18, L - 18].map((u): Item => ({ k: "domes", u: [u, u], n: 1, r: 0.9, y: D + 14.2, h: 0.9, mat: "white", name: "radome" })),
      ...passengerFittings({ L, B: 27, D, T: 5.3, both: true, fender: 0.45 }),
    ]),
  };
}

export function sydneyFirstFleetSpec(): ShipSpec {
  const L = 25.4;
  const D = 2.6;
  return {
    kind: "passenger", small: true,
    hull: doubleEnded({ length: L, beam: 7.5, depth: D, draft: 1.9, entry: 0.3, stripe: 0.4 }),
    livery: { hull: "#2f6a45", stripe: "#e8bf2a", bottom: "#8f2a22", boot: "#1d2024", deck: "#7d6a55", house: "#efe6cf", roof: "#2f6a45" },
    items: detailed([
      { k: "tier", u: [2.5, L - 2.5], y: [D - 0.1, D + 2.4], inset: 0.35, round: [2.4, 2.4], windows: [{ y: 0.9, h: 1.1, w: 1, pitch: 1.4 }], name: "saloon" },
      { k: "tier", u: [5, L - 5], y: [D + 2.4, D + 4.6], inset: 0.8, round: [2, 2], windows: [{ y: 0.7, h: 1.1, w: 1, pitch: 1.4 }], name: "upper saloon" },
      { k: "tier", u: [L / 2 - 1.6, L / 2 + 1.6], y: [D + 4.6, D + 6.3], hw: 1.6, front: { y: 0.5, h: 0.8, w: 0.7, n: 3 }, windows: [{ y: 0.5, h: 0.8, w: 0.6, pitch: 1 }], name: "wheelhouse" },
      { k: "cyl", u: L / 2 - 2.4, z: 0, y: [D + 4.6, D + 6.6], r: 0.25, mat: "black", name: "exhaust" },
      { k: "rail", u: [5.4, L - 5.4], y: D + 4.6, hw: 2.8, h: 0.9, name: "top deck rail" },
      { k: "rail", u: [0.6, 2.4], y: D, hw: 3.4, h: 1, name: "after deck rail" },
      { k: "rail", u: [L - 2.4, L - 0.6], y: D, hw: 3.4, h: 1, name: "forward deck rail" },
      ...[1, -1].flatMap((sd): Item[] => [7, 18].map((u): Item => ({ k: "cyl", u, z: sd * 3.3, y: [D + 0.9, D + 1.6], r: 0.3, n: 8, mat: "orange", name: "lifebuoy" }))),
      ...passengerFittings({ L, B: 7.5, D, T: 1.9, both: true, fender: 0.25 }),
    ]),
  };
}

export function manlyFreshwaterSpec(): ShipSpec {
  const L = 70.4;
  const D = 4;
  return {
    kind: "passenger",
    hull: doubleEnded({ length: L, beam: 12.5, depth: D, draft: 2.4, entry: 0.24, stripe: 0.6 }),
    livery: { hull: "#2f6a45", stripe: "#efe6cf", bottom: "#8f2a22", boot: "#1d2024", deck: "#7d6a55", house: "#efe6cf", roof: "#2f6a45", funnel: "#efe6cf" },
    items: detailed([
      { k: "tier", u: [4, L - 4], y: [D - 0.1, D + 2.8], inset: 0.4, round: [5, 5], windows: [{ y: 0.9, h: 1.3, w: 1.2, pitch: 1.8 }], name: "lower saloon" },
      { k: "tier", u: [7, L - 7], y: [D + 2.8, D + 5.6], inset: 1, round: [5, 5], windows: [{ y: 0.8, h: 1.4, w: 1.2, pitch: 1.8 }], name: "upper saloon" },
      ...pilothouses(L, D + 5.6, 2.6, 4, 2.2, 9),
      funnel([L / 2 - 1.5, L / 2 + 1.5], 1.4, [D + 5.6, D + 9], [["funnel", 0.8], ["black", 1]], 0),
      { k: "rail", u: [8, L - 8], y: D + 5.6, hw: 5, h: 1, name: "top deck rail" },
      { k: "rail", u: [1, 4], y: D, hw: 5.6, h: 1, name: "after deck rail" },
      { k: "rail", u: [L - 4, L - 1], y: D, hw: 5.6, h: 1, name: "forward deck rail" },
      ...liferafts(14, L - 14, 5, 5.2, D + 5.7),
      ...exhausts([L / 2 - 1.5, L / 2 + 1.5], 1.4, D + 9),
      ...passengerFittings({ L, B: 12.5, D, T: 2.4, both: true, fender: 0.35 }),
    ]),
  };
}

export function bosphorusSpec(): ShipSpec {
  const L = 70;
  const D = 4;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 12.5, depth: D, draft: 2.5, bow: "raked", stern: "cruiser", section: "round", entry: 0.28, run: 0.2, rake: 0.06, sheer: [0.6, 1.6], boot: 0.3, stripe: 0.5, screws: 1 },
    livery: { hull: "#f2f0ea", stripe: "#1d2024", bottom: "#8f2a22", boot: "#1d2024", deck: "#7d6a55", house: "#f2f0ea", funnel: "#e8bf2a" },
    items: detailed([
      { k: "tier", u: [4, L - 10], y: [D - 0.1, D + 2.8], inset: 0.4, round: [5, 3], windows: [{ y: 0.9, h: 1.3, w: 1.2, pitch: 1.8 }], name: "main saloon" },
      { k: "tier", u: [8, L - 14], y: [D + 2.8, D + 5.4], inset: 1.2, round: [4, 2], windows: [{ y: 0.8, h: 1.3, w: 1.2, pitch: 1.8 }], name: "upper saloon" },
      { k: "tier", u: [L - 22, L - 15], y: [D + 5.4, D + 7.8], hw: 3, front: { y: 0.8, h: 1, w: 0.9, n: 4 }, wings: { hw: 5.6, h: 1.4 }, name: "wheelhouse" },
      funnel([30, 35], 1.6, [D + 5.4, D + 10.5], [["funnel", 0.82], ["black", 1]], 0.6),
      mast(L - 8, D + 0.4, D + 10, 0.12),
      { k: "rail", u: [9, L - 15], y: D + 5.4, hw: 4.6, h: 1, name: "top deck rail" },
      { k: "rail", u: [L - 10, L - 2], y: D + 0.4, hw: 4, h: 1, name: "foredeck rail" },
      { k: "boats", at: [16, 24], z: 5.4, y: D + 5.6, len: 5, r: 0.8, name: "lifeboats" },
      ...exhausts([30, 35], 1.6, D + 10.5, 0.6),
      ...passengerFittings({ L, B: 12.5, D, T: 2.5, fender: 0.3 }),
    ]),
  };
}

export function vaporettoSpec(): ShipSpec {
  const L = 23.5;
  const D = 1.8;
  return {
    kind: "passenger", small: true,
    hull: { fine: true, length: L, beam: 4.5, depth: D, draft: 1.2, bow: "raked", stern: "cruiser", section: "round", entry: 0.3, run: 0.2, rake: 0.05, sheer: [0.1, 0.4], boot: 0.15, stripe: 0.3, screws: 1 },
    livery: { hull: "#f2f0ea", stripe: "#1d2024", bottom: "#8f2a22", boot: "#1d2024", deck: "#5b6266", house: "#d8d8d4", roof: "#2a3b5f", skirt: "#3a3c3e" },
    items: detailed([
      { k: "box", u: [0.2, L - 0.2], z: [-2.3, 2.3], y: [D - 0.35, D - 0.05], mat: "skirt", name: "rubbing strake" },
      { k: "tier", u: [4, L - 5], y: [D - 0.1, D + 2.1], inset: 0.15, round: [1.6, 1], windows: [{ y: 0.7, h: 1.1, w: 1, pitch: 1.3 }], name: "cabin" },
      { k: "tier", u: [L - 5.2, L - 3.4], y: [D + 1.0, D + 2.6], hw: 0.9, front: { y: 0.4, h: 0.8, w: 0.6, n: 2 }, name: "wheelhouse" },
      { k: "rail", u: [0.5, 4], y: D, hw: 2.1, h: 0.9, name: "stern rail" },
      { k: "rail", u: [L - 3.2, L - 0.6], y: D, hw: 1.8, h: 0.9, name: "bow rail" },
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: 2.2, z: sd * 2, y: [D + 0.5, D + 1.1], r: 0.28, n: 8, mat: "orange", name: "lifebuoy" })),
      { k: "cyl", u: L - 4.2, z: 0.6, y: [D + 2.6, D + 3.6], r: 0.03, mat: "white", name: "antenna" },
      { k: "cyl", u: L - 4.2, z: -0.6, y: [D + 2.6, D + 2.9], r: 0.1, mat: "yellow", name: "navigation light" },
      ...passengerFittings({ L, B: 4.5, D, T: 1.2, fender: 0 }),
    ]),
  };
}

export function ijveerSpec(): ShipSpec {
  const L = 34;
  const D = 2.4;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 13, depth: D, draft: 1.5, bow: "barge", stern: "sternwheel", section: "flat", entry: 0.06, run: 0.06, transom: 0.9, rake: 0.04, boot: 0.15, stripe: 0.3, rudder: false },
    livery: { hull: "#f2f0ea", stripe: "#1f4f9a", bottom: "#1d2024", boot: "#1d2024", deck: "#6b6f6c", house: "#f2f0ea", roof: "#1f4f9a" },
    items: detailed([
      { k: "tier", u: [L / 2 - 4, L / 2 + 4], y: [D - 0.1, D + 2.4], hw: 1.6, windows: [{ y: 0.9, h: 1, w: 0.9, pitch: 1.3 }], name: "centre house" },
      { k: "tier", u: [L / 2 - 2.5, L / 2 + 2.5], y: [D + 2.4, D + 4.6], hw: 2.6, front: { y: 0.6, h: 1.1, w: 1, n: 4 }, windows: [{ y: 0.6, h: 1.1, w: 1, pitch: 1.3 }], name: "wheelhouse" },
      { k: "rail", u: [1, L - 1], y: D, hw: 6.2, h: 1.1, name: "deck rail" },
      { k: "box", u: [0.3, 1.3], z: [-5, 5], y: [D, D + 0.3], mat: "yellow", name: "after ramp" },
      { k: "box", u: [L - 1.3, L - 0.3], z: [-5, 5], y: [D, D + 0.3], mat: "yellow", name: "forward ramp" },
      ...[4, L - 4].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "cyl", u, z: sd * 6, y: [D, D + 5], r: 0.08, mat: "white", name: "lamp post" }))),
      // the passengers' shelters fore and aft of the centre house, on their posts
      ...[[L / 2 - 11, L / 2 - 5], [L / 2 + 5, L / 2 + 11]].flatMap(([a, b]): Item[] => [
        { k: "canopy", u: [a!, b!], hw: 2.2, y: D + 2.2, h: 0.5, mat: "roof", name: "shelter roof" },
        ...[a! + 0.3, b! - 0.3].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "cyl", u, z: sd * 2, y: [D, D + 2.2], r: 0.06, mat: "white", name: "shelter post" }))),
      ]),
      ...[0.3, L - 1.3].map((u): Item => rod([u + 0.5, D + 0.3, -4.8], [u + 0.5, D + 0.3, 4.8], 0.2, "steel", "ramp hinge")),
      { k: "box", u: [L / 2 - 6, L / 2 - 4], z: [-2, 2], y: [D - 0.05, D + 0.9], mat: "white", name: "bench" },
      { k: "box", u: [L / 2 + 4, L / 2 + 6], z: [-2, 2], y: [D - 0.05, D + 0.9], mat: "white", name: "bench forward" },
      ...passengerFittings({ L, B: 13, D, T: 1.5, both: true, fender: 0.3, mooring: false }),
    ]),
  };
}

// ---------------------------------------------------------------------------
// fast craft

export function stenaHssSpec(): ShipSpec {
  const L = 126.6;
  const D = 8;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 40, depth: D, draft: 4.8, twin: 11, bow: "raked", stern: "transom", section: "vee", entry: 0.4, run: 0.05, transom: 0.85, rake: 0.08, boot: 0.4, stripe: 0, rudder: false },
    livery: { hull: "#f2f0ea", bottom: "#1d2024", boot: "#c23128", deck: "#7d8287", house: "#f2f0ea", red: "#c23128", blue: "#1f4f9a" },
    items: detailed([
      { k: "box", u: [2, L - 30], z: [-14.6, 14.6], y: [5, D + 0.1], mat: "house", name: "wet deck" },
      { k: "tier", u: [2, L - 6], y: [D - 0.2, D + 8], hw: 19.8, round: [0, 26], windows: [{ y: 5.2, h: 1.6, w: 2.2, pitch: 3 }], name: "car deck and saloon" },
      { k: "tier", u: [40, L - 12], y: [D + 8, D + 11], hw: 16, round: [2, 18], windows: [{ y: 0.6, h: 1.8, w: 2.2, pitch: 3 }], name: "upper saloon" },
      { k: "tier", u: [L - 32, L - 18], y: [D + 11, D + 13.6], hw: 9, round: [0, 6], front: { y: 0.5, h: 1.4, w: 1.4, n: 5 }, name: "bridge" },
      { k: "box", u: [10, 30], z: [-16, -8], y: [D + 8, D + 12], mat: "blue", name: "port exhaust casing" },
      { k: "box", u: [10, 30], z: [8, 16], y: [D + 8, D + 12], mat: "blue", name: "starboard exhaust casing" },
      { k: "box", u: [40, 110], z: [19.85, 19.95], y: [D + 2, D + 3], mat: "red", name: "starboard stripe" },
      { k: "box", u: [40, 110], z: [-19.95, -19.85], y: [D + 2, D + 3], mat: "red", name: "port stripe" },
      { k: "rail", u: [44, L - 30], y: D + 11, hw: 15.2, h: 1.1, name: "upper deck rail" },
      ...liferafts(46, 100, 6, 15.6, D + 11.1),
      { k: "mast", u: L - 25, y: [D + 13.6, D + 20], r: 0.25, radar: true, yards: [[D + 18, 2]], name: "radar mast" },
      ...[[-12, 1], [12, -1]].map(([z]): Item => ({ k: "cyl", u: 26, z: z!, y: [D + 12, D + 13.6], r: 0.9, mat: "black", name: "exhaust" })),
      ...passengerFittings({ L, B: 40, D, T: 4.8, fender: 0, mooring: false }),
      { k: "mooring", at: [4, L - 32], hw: 18, s: 0.9 },
    ]),
  };
}

export const INCAT_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["white", "White"], ["blue", "Blue"], ["red", "Red"])];
export function incatSpec(p?: ParamValues): ShipSpec {
  const L = 98;
  const D = 7;
  const liv = pick(INCAT_PARAMS, p, "livery");
  const accent = liv === "blue" ? "#1f4f9a" : liv === "red" ? "#c23128" : "#7d8287";
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 26.6, depth: D, draft: 3.5, twin: 5, bow: "raked", stern: "transom", section: "vee", entry: 0.45, run: 0.04, transom: 0.85, rake: 0.12, boot: 0.3, stripe: 0, rudder: false },
    livery: { hull: "#f2f0ea", bottom: "#1d2024", boot: accent, deck: "#7d8287", house: "#f2f0ea", accent },
    items: detailed([
      // the centre bow between the wave-piercing hulls, the deck box over them
      { k: "box", u: [4, L - 18], z: [-10.8, 10.8], y: [4.4, D + 0.1], mat: "house", name: "bridging deck" },
      { k: "tier", u: [L - 30, L - 6], y: [4.6, D + 5.4], hw: 4, round: [0, 12], name: "centre bow" },
      { k: "tier", u: [3, L - 14], y: [D - 0.2, D + 5.4], hw: 13.2, round: [0, 14], windows: [{ y: 3, h: 1.6, w: 2.2, pitch: 3 }], name: "vehicle deck" },
      { k: "tier", u: [22, L - 22], y: [D + 5.4, D + 8.4], hw: 11.6, round: [2, 10], windows: [{ y: 0.7, h: 1.8, w: 2.2, pitch: 3 }], name: "passenger deck" },
      { k: "tier", u: [L - 34, L - 24], y: [D + 8.4, D + 10.8], hw: 6, front: { y: 0.4, h: 1.3, w: 1.3, n: 5 }, name: "bridge" },
      { k: "box", u: [30, 76], z: [13.25, 13.35], y: [D + 1, D + 2], mat: "accent", name: "starboard band" },
      { k: "box", u: [30, 76], z: [-13.35, -13.25], y: [D + 1, D + 2], mat: "accent", name: "port band" },
      mast(L - 28, D + 10.8, D + 15, 0.15),
      { k: "rail", u: [26, L - 26], y: D + 8.4, hw: 11, h: 1.1, name: "upper deck rail" },
      ...liferafts(30, 70, 5, 11.2, D + 8.5),
      { k: "mast", u: L - 30, y: [D + 10.8, D + 16], r: 0.2, radar: true, yards: [[D + 14, 1.6]], name: "radar mast" },
      ...[-6, 6].map((z): Item => ({ k: "cyl", u: 26, z, y: [D + 8.4, D + 10], r: 0.7, mat: "black", name: "exhaust" })),
      ...passengerFittings({ L, B: 26.6, D, T: 3.5, fender: 0, mooring: false }),
      { k: "mooring", at: [4, L - 20], hw: 12, s: 0.8 },
    ]),
  };
}

export function srn4Spec(): ShipSpec {
  const L = 56.4;
  return {
    kind: "passenger", length: L,
    hull: null,
    livery: { skirt: "#2b2d30", house: "#f2f0ea", red: "#c23128", blue: "#1f4f9a", grey: "#6b6f6c", deck: "#7d8287" },
    items: detailed([
      { k: "skirt", u: [0, L], hw: 11.6, h: 2.6, c: 5 },
      { k: "box", u: [1, L - 1], z: [-11, 11], y: [2.6, 3.6], mat: "red", name: "buoyancy raft" },
      { k: "tier", u: [4, L - 5], y: [3.6, 7.8], hw: 9.6, round: [2, 7], windows: [{ y: 1.6, h: 1, w: 1.2, pitch: 1.6 }, { y: 3, h: 0.7, w: 1.2, pitch: 1.6, from: 8, to: L - 12 }], name: "cabin" },
      { k: "tier", u: [L - 14, L - 7], y: [7.8, 9.4], hw: 3, round: [0, 2], front: { y: 0.4, h: 0.8, w: 0.9, n: 4 }, name: "control cabin" },
      // the four propeller pylons, their fins and the twin tail fins
      ...[[12, 7.2], [12, -7.2], [36, 7.6], [36, -7.6]].map(([u, z], i): Item => ({ k: "prop", u: u!, z: z!, y: 11.4, r: 3.6, blades: 4, pylon: 3.6, mat: "grey", name: `propeller ${i + 1}` })),
      { k: "plate", pts: [[1.5, 7.85], [6, 7.85], [4.8, 11.5], [2.4, 11.5]], z: 4, t: 0.3, mat: "house", name: "starboard fin" },
      { k: "plate", pts: [[1.5, 7.85], [6, 7.85], [4.8, 11.5], [2.4, 11.5]], z: -4, t: 0.3, mat: "house", name: "port fin" },
      { k: "rail", u: [6, 30], y: 7.8, hw: 9, h: 1, name: "roof rail" },
      ...[[24, 3], [24, -3]].map(([u, z]): Item => ({ k: "cyl", u: u!, z: z!, y: [7.8, 9.6], r: 0.5, mat: "black", name: "gas turbine exhaust" })),
      ...[1, -1].flatMap((sd): Item[] => [10, 26, 42].map((u): Item => ({ k: "box", u: [u - 0.6, u + 0.6], z: sd > 0 ? [9.73, 9.77] : [-9.77, -9.73], y: [3.8, 6.2], mat: "grey", name: "cabin door" }))),
      { k: "cyl", u: L - 8.2, z: 1.6, y: [9.4, 11.6], r: 0.05, mat: "white", name: "antenna" },
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: L - 7.6, z: sd * 2.8, y: [9.4, 9.8], r: 0.15, mat: sd > 0 ? "green" : "red", name: "navigation light" })),
      // the skirt's bag band, the rudders behind the propellers, the engine air intakes, the cabin's upper windows
      { k: "tier", u: [0.4, L - 0.4], y: [2.0, 2.45], hw: 11.9, round: [4.6, 4.6], mat: "black", name: "skirt bag band" },
      ...[[12, 7.2], [12, -7.2], [36, 7.6], [36, -7.6]].flatMap(([u, z]): Item[] => [-1, 1].map((d): Item => ({ k: "plate", pts: [[u! - 2.6, 7.9], [u! - 1.4, 7.9], [u! - 1.4, 13.6], [u! - 2.6, 13.6]], z: z! + d * 1.2, t: 0.15, mat: "house", name: "rudder" }))),
      ...[[18, 5], [18, -5], [30, 5], [30, -5]].map(([u, z]): Item => ({ k: "box", u: [u! - 2, u! + 2], z: [z! - 1.4, z! + 1.4], y: [7.8, 8.8], mat: "grey", name: "engine air intake" })),
      { k: "tier", u: [L - 13.4, L - 7.4], y: [9.4, 9.6], hw: 2.6, mat: "grey", name: "control cabin roof" },
      { k: "mast", u: L - 10, y: [9.6, 12.4], r: 0.12, radar: true, name: "radar mast" },
      // the bow ramp raised against the cabin's front, its hinge and side rails
      { k: "plate", pts: [[L - 4.9, 7.3], [L - 4.4, 7.3], [L - 0.5, 2.9], [L - 1.0, 2.9]], z: 0, t: 8, mat: "grey", name: "bow ramp" },
      rod([L - 0.8, 2.9, -4.2], [L - 0.8, 2.9, 4.2], 0.25, "black", "ramp hinge"),
      ...[1, -1].map((sd): Item => rod([L - 1.2, 3.4, sd * 4.1], [L - 4.6, 7.3, sd * 4.1], 0.08, "white", "ramp side rail")),
      ...[1, -1].map((sd): Item => ({ k: "box", u: [14, 34], z: sd > 0 ? [9.62, 9.7] : [-9.7, -9.62], y: [4.4, 4.7], mat: "red", name: "cabin stripe" })),
    ]),
  };
}

export function raketaSpec(): ShipSpec {
  const L = 26.96;
  const D = 3.1;
  return {
    kind: "passenger", small: true,
    hull: { fine: true, length: L, beam: 5, depth: D - 1.0, draft: 1.8, lift: 1.0, bow: "raked", stern: "transom", section: "vee", entry: 0.4, run: 0.05, transom: 0.8, rake: 0.14, sheer: [0, 0.5], boot: 0.15, stripe: 0, rudder: false },
    livery: { hull: "#e9ebe8", bottom: "#c0202c", boot: "#c0202c", deck: "#8d918c", house: "#e9ebe8", roof: "#c0202c", steel: "#2d5ca8" },
    items: detailed([
      { k: "tier", u: [3, L - 6], y: [D - 0.1, D + 1.9], inset: 0.2, round: [0.6, 3], windows: [{ y: 0.6, h: 0.8, w: 0.9, pitch: 1.2 }], name: "saloon" },
      { k: "tier", u: [L - 9, L - 5.5], y: [D + 1.9, D + 2.9], hw: 1.4, round: [0, 1.2], front: { y: 0.2, h: 0.6, w: 0.6, n: 3 }, name: "wheelhouse" },
      // the bow and stern foils on their struts, under the hull
      { k: "foil", u: L - 6, span: 2.6, y: 0.0, chord: 1, strut: 1.2, inner: 1.4 },
      { k: "foil", u: 3.5, span: 2.2, y: 0.0, chord: 0.9, strut: 1.0, inner: 1.2 },
      { k: "cyl", u: 2, z: 0, y: [D + 1.9, D + 3.2], r: 0.06, mat: "white", name: "flagstaff" },
      { k: "rail", u: [L - 5.5, L - 1], y: D, hw: 1.9, h: 0.8, name: "foredeck rail" },
      { k: "rail", u: [0.6, 3], y: D, hw: 2.1, h: 0.8, name: "after deck rail" },
      { k: "cyl", u: L - 7, z: 0, y: [D + 2.9, D + 4], r: 0.04, mat: "white", name: "antenna mast" },
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: 6, z: sd * 2.3, y: [D + 0.6, D + 1.2], r: 0.24, n: 8, mat: "orange", name: "lifebuoy" })),
      ...passengerFittings({ L, B: 5, D, T: 1.8, fender: 0.12 }),
    ]),
  };
}

export const JETFOIL_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["blue", "Blue"], ["red", "Red"], ["green", "Green"])];
export function jetfoilSpec(p?: ParamValues): ShipSpec {
  const L = 27.4;
  const D = 4.8;
  const liv = pick(JETFOIL_PARAMS, p, "livery");
  const accent = liv === "red" ? "#c23128" : liv === "green" ? "#2f7a4b" : "#1f4f9a";
  return {
    kind: "passenger", small: true,
    hull: { fine: true, length: L, beam: 8.5, depth: D - 1.6, draft: 2.6, lift: 1.6, bow: "raked", stern: "transom", section: "vee", entry: 0.35, run: 0.04, transom: 0.85, rake: 0.1, sheer: [0, 0.4], boot: 0.2, stripe: 0.6, rudder: false },
    livery: { hull: "#f2f0ea", stripe: accent, bottom: "#1d2024", boot: accent, deck: "#7d8287", house: "#f2f0ea", roof: accent, steel: "#5b6266" },
    items: detailed([
      { k: "tier", u: [1.5, L - 3], y: [D - 0.1, D + 2.2], inset: 0.15, round: [0.5, 5], windows: [{ y: 0.8, h: 0.8, w: 1.1, pitch: 1.4 }], name: "lower saloon" },
      { k: "tier", u: [4, L - 6], y: [D + 2.2, D + 4.2], inset: 0.8, round: [0.5, 4], windows: [{ y: 0.6, h: 0.8, w: 1.1, pitch: 1.4 }], name: "upper saloon" },
      { k: "tier", u: [L - 10, L - 6.5], y: [D + 4.2, D + 5.2], hw: 1.8, front: { y: 0.2, h: 0.6, w: 0.8, n: 3 }, name: "bridge" },
      // the fully submerged foils, raised for harbour, and the water jet pods
      { k: "foil", u: L - 5, span: 1.6, y: 0.2, chord: 1.2, strut: 1.4, inner: 0.8 },
      { k: "foil", u: 3, span: 4.3, y: 0.0, chord: 1.6, strut: 1.8, inner: 3.2 },
      { k: "box", u: [0.2, 1.6], z: [-2.2, -0.8], y: [0.4, 1.4], mat: "steel", name: "port jet" },
      { k: "box", u: [0.2, 1.6], z: [0.8, 2.2], y: [0.4, 1.4], mat: "steel", name: "starboard jet" },
      { k: "rail", u: [L - 6, L - 3], y: D + 2.2, hw: 3, h: 0.8, name: "upper deck rail" },
      { k: "mast", u: L - 8.2, y: [D + 5.2, D + 6.6], r: 0.06, radar: true, name: "radar mast" },
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: 3, z: sd * 3.6, y: [D + 2.3, D + 3.2], r: 0.36, n: 8, mat: "white", name: "liferaft" })),
      ...passengerFittings({ L, B: 8.5, D: D - 0.1, T: 2.6, fender: 0.12 }),
    ]),
  };
}

// ---------------------------------------------------------------------------
// paddle steamers and river boats

export function swissPaddleSpec(): ShipSpec {
  const L = 62.5;
  const D = 2.8;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 7.5, depth: D, draft: 1.5, bow: "clipper", stern: "cruiser", section: "round", entry: 0.3, run: 0.22, rake: 0.06, sheer: [0.4, 1.2], boot: 0.2, stripe: 0.3, screws: 0 },
    livery: { hull: "#f2f0ea", stripe: "#c9a14a", bottom: "#2f6a45", boot: "#1d2024", deck: "#8a5a33", house: "#f2f0ea", funnel: "#e8bf2a", red: "#c23128" },
    items: detailed([
      { k: "tier", u: [4, L - 14], y: [D - 0.1, D + 2.6], inset: 0.2, round: [3, 2], windows: [{ y: 0.8, h: 1.3, w: 1, pitch: 1.6 }], name: "saloon" },
      { k: "tier", u: [6, 22], y: [D + 2.6, D + 4.8], hw: 3, round: [2, 0], windows: [{ y: 0.6, h: 1.1, w: 1, pitch: 1.6 }], name: "upper saloon" },
      { k: "box", u: [26, 34], z: [-7.3, 7.3], y: [D + 2.6, D + 2.9], mat: "deck", name: "paddle bridge" },
      { k: "tier", u: [30, 33], y: [D + 2.9, D + 5], hw: 1.4, front: { y: 0.6, h: 0.9, w: 0.6, n: 3 }, name: "wheelhouse" },
      { k: "paddle", u: 30, r: 2.4, w: 2.4, z: 5.2, y: 2.5, box: "house", mat: "red", rays: "funnel" },
      funnel([23, 26], 0.9, [D + 2.6, D + 8.8], [["funnel", 0.88], ["black", 1]], 0.5),
      { k: "mast", u: L - 6, y: [D, D + 10], r: 0.12, yards: [[D + 7, 1.4]], name: "foremast" },
      { k: "rail", u: [6.4, 21.6], y: D + 4.8, hw: 2.8, h: 0.9, name: "upper deck rail" },
      { k: "rail", u: [L - 13.6, L - 3], y: D, hw: 2.8, h: 0.9, name: "foredeck rail" },
      { k: "rail", u: [1, 4], y: D, hw: 2.9, h: 0.9, name: "after deck rail" },
      { k: "canopy", u: [6.4, 14], hw: 3, y: D + 5.8, h: 0.5, mat: "white", posts: "spar", name: "awning" },
      ...[1.2, L - 1].map((u): Item => ({ k: "cyl", u, z: 0, y: [D, D + 4], r: 0.05, mat: "spar", name: "flagstaff" })),
      ...[1, -1].flatMap((sd): Item[] => [12, 40].map((u): Item => ({ k: "cyl", u, z: sd * 3.6, y: [D + 1, D + 1.6], r: 0.28, n: 8, mat: "red", name: "lifebuoy" }))),
      ...exhausts([23, 26], 0.9, D + 8.8, 0.5),
      ...passengerFittings({ L, B: 7.5, D, T: 1.5, fender: 0.15 }),
    ]),
  };
}

export function sternwheelerSpec(): ShipSpec {
  const L = 116;
  const D = 3.4;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 21, depth: D, draft: 2.6, bow: "raked", stern: "sternwheel", section: "flat", entry: 0.2, run: 0.04, transom: 0.92, rake: 0.06, sheer: [0.2, 0.8], boot: 0.2, stripe: 0.4, rudder: false },
    livery: { hull: "#f2f0ea", stripe: "#c23128", bottom: "#1d2024", boot: "#c23128", deck: "#8a5a33", house: "#f2f0ea", funnel: "#1d2024", red: "#c23128", roof: "#c23128" },
    items: detailed([
      ...decks({ u: [6, L - 10], y0: D - 0.1, n: 4, h: 3, round: [2, 8], inset: 0.4, dhw: 0.6, pitch: 2.4, step: [2, 6] }),
      { k: "tier", u: [L - 34, L - 26], y: [D - 0.1 + 12, D - 0.1 + 14.6], hw: 4, front: { y: 0.6, h: 1.3, w: 1, n: 5 }, windows: [{ y: 0.6, h: 1.3, w: 1, pitch: 1.4 }], name: "pilothouse" },
      { k: "cyl", u: L - 38, z: 5, y: [D + 11.9, D + 24], r: 0.9, mat: "funnel", name: "starboard stack" },
      { k: "cyl", u: L - 38, z: -5, y: [D + 11.9, D + 24], r: 0.9, mat: "funnel", name: "port stack" },
      // the stern wheel on its booms, astern of the transom
      { k: "paddle", u: -4.6, r: 4.2, w: 13, z: 0, y: 4.4, stern: true, mat: "red" },
      { k: "rod", a: [2, D + 1, 7], b: [-6, 4.4, 7], r: 0.5, mat: "house", name: "starboard wheel beam" },
      { k: "rod", a: [2, D + 1, -7], b: [-6, 4.4, -7], r: 0.5, mat: "house", name: "port wheel beam" },
      ...[0, 1, 2].map((k): Item => ({ k: "rail", u: [8 + 2 * (k + 1), L - 16 - 6 * (k + 1)], y: D - 0.1 + 3 * (k + 1), hw: 10.1 - 0.6 * (k + 1) - 0.6, h: 1, name: `deck ${k + 2} rail` })),
      ...[5, -5].map((z): Item => ({ k: "cyl", u: L - 38, z, y: [D + 24, D + 25], r: 1.3, n: 12, mat: "funnel", name: "stack crown" })),
      // the landing stage on its boom over the bow, the bell
      rod([L - 6, D, 0], [L + 6, D + 2.6, 0], 0.35, "house", "landing stage"),
      rod([L - 20, D + 9, 0], [L + 4, D + 3, 0], 0.08, "rope", "stage tackle"),
      { k: "cyl", u: L - 18, z: 0, y: [D - 0.1, D + 9], r: 0.25, mat: "house", name: "stage boom" },
      { k: "cyl", u: L - 30, z: 0, y: [D + 14.6, D + 15.4], r: 0.35, mat: "yellow", name: "bell" },
      ...passengerFittings({ L, B: 21, D, T: 2.6, fender: 0.3 }),
    ]),
  };
}

export function elbePaddleSpec(): ShipSpec {
  const L = 68.7;
  const D = 2.4;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 6.6, depth: D, draft: 0.9, bow: "plumb", stern: "cruiser", section: "round", entry: 0.28, run: 0.22, sheer: [0.4, 1], boot: 0.15, stripe: 0.25, screws: 0 },
    livery: { hull: "#f2f0ea", stripe: "#c9a14a", bottom: "#c23128", boot: "#1d2024", deck: "#8a5a33", house: "#f2f0ea", funnel: "#1d2024", red: "#c23128" },
    items: detailed([
      { k: "tier", u: [6, 26], y: [D - 0.1, D + 2.4], inset: 0.25, round: [2.5, 0], windows: [{ y: 0.8, h: 1.1, w: 0.9, pitch: 1.5 }], name: "after saloon" },
      { k: "tier", u: [40, L - 14], y: [D - 0.1, D + 2.4], inset: 0.25, round: [0, 2], windows: [{ y: 0.8, h: 1.1, w: 0.9, pitch: 1.5 }], name: "forward saloon" },
      { k: "box", u: [30, 37], z: [-6.4, 6.4], y: [D + 2.4, D + 2.7], mat: "deck", name: "paddle bridge" },
      { k: "tier", u: [32.5, 35], y: [D + 2.7, D + 4.6], hw: 1.2, front: { y: 0.6, h: 0.8, w: 0.6, n: 2 }, name: "wheelhouse" },
      { k: "paddle", u: 33.5, r: 2.2, w: 2, z: 4.3, y: 2.3, box: "house", mat: "red", rays: "red" },
      funnel([27, 29.6], 0.85, [D + 1.6, D + 8], [["funnel", 1]], 0.4),
      { k: "mast", u: L - 8, y: [D, D + 8], r: 0.1, yards: [[D + 6, 1.2]], name: "foremast" },
      { k: "canopy", u: [8, 24], hw: 3.3, y: D + 2.45, h: 0.6, mat: "white", name: "sun deck awning" },
      { k: "rail", u: [6.4, 25.6], y: D + 2.4, hw: 3, h: 0.9, name: "after saloon roof rail" },
      { k: "rail", u: [40.4, L - 14.4], y: D + 2.4, hw: 3, h: 0.9, name: "forward saloon roof rail" },
      { k: "rail", u: [L - 13.6, L - 2], y: D, hw: 2.6, h: 0.9, name: "foredeck rail" },
      ...[1.2, L - 1].map((u): Item => ({ k: "cyl", u, z: 0, y: [D, D + 3.6], r: 0.05, mat: "spar", name: "flagstaff" })),
      ...[1, -1].flatMap((sd): Item[] => [14, 50].map((u): Item => ({ k: "cyl", u, z: sd * 3.2, y: [D + 0.9, D + 1.5], r: 0.26, n: 8, mat: "red", name: "lifebuoy" }))),
      ...passengerFittings({ L, B: 6.6, D, T: 0.9, fender: 0.15 }),
    ]),
  };
}

export function bateauMoucheSpec(): ShipSpec {
  const L = 55;
  const D = 2;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 10, depth: D, draft: 1.3, bow: "raked", stern: "transom", section: "flat", entry: 0.22, run: 0.1, transom: 0.85, rake: 0.05, sheer: [0, 0.6], boot: 0.15, stripe: 0.3, screws: 2 },
    livery: { hull: "#1d2024", stripe: "#f2f0ea", bottom: "#8f2a22", boot: "#1d2024", deck: "#6b6f6c", house: "#e8e8e4", roof: "#2a2d30" },
    items: detailed([
      // the glazed saloon: glass sides and roof edge from end to end
      { k: "tier", u: [3, L - 6], y: [D - 0.1, D + 2.6], inset: 0.3, round: [3, 5], windows: [{ y: 0.3, h: 2.1, w: 1.8, pitch: 2 }], name: "glazed saloon" },
      { k: "tier", u: [6, L - 10], y: [D + 2.6, D + 2.9], inset: 0.9, round: [2, 4], mat: "glass", name: "glass roof" },
      { k: "tier", u: [L - 9.5, L - 7], y: [D + 2.6, D + 3.8], hw: 1.4, front: { y: 0.2, h: 0.8, w: 0.6, n: 3 }, name: "wheelhouse" },
      { k: "rail", u: [0.6, 3], y: D, hw: 4.6, h: 1 },
      { k: "rail", u: [L - 6, L - 1], y: D, hw: 4.4, h: 1, name: "foredeck rail" },
      ...[10, 20, 30, 40].map((u): Item => ({ k: "box", u: [u - 0.15, u + 0.15], z: [-4.6, 4.6], y: [D + 2.6, D + 2.75], mat: "roof", name: "roof frame" })),
      ...[2, L - 3].map((u): Item => ({ k: "cyl", u, z: 0, y: [D, D + 2.8], r: 0.05, mat: "white", name: "flagstaff" })),
      { k: "cyl", u: L - 8.2, z: 0, y: [D + 3.8, D + 4.6], r: 0.04, mat: "white", name: "antenna" },
      ...passengerFittings({ L, B: 10, D, T: 1.3, fender: 0.3 }),
    ]),
  };
}

export function nileCruiserSpec(): ShipSpec {
  const L = 72;
  const D = 2.6;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 14.4, depth: D, draft: 1.6, bow: "raked", stern: "transom", section: "flat", entry: 0.22, run: 0.1, transom: 0.85, rake: 0.06, sheer: [0, 0.8], boot: 0.15, stripe: 0.3, screws: 2 },
    livery: { hull: "#f2f0ea", stripe: "#c9a14a", bottom: "#1d2024", boot: "#1d2024", deck: "#8a5a33", house: "#f2f0ea", roof: "#3a7aa8", canopy: "#efe6cf" },
    items: detailed([
      ...decks({ u: [3, L - 8], y0: D - 0.1, n: 3, h: 2.8, round: [2, 5], inset: 0.4, pitch: 2.2, win: 1.4 }),
      { k: "tier", u: [L - 16, L - 10], y: [D + 8.3, D + 10.6], hw: 3.6, front: { y: 0.5, h: 1, w: 1, n: 4 }, name: "wheelhouse" },
      { k: "canopy", u: [6, 40], hw: 6, y: D + 10.4, h: 0.6, mat: "canopy", posts: "white", name: "sun deck awning" },
      { k: "rail", u: [3, L - 16], y: D + 8.3, hw: 6.8, h: 1 },
      { k: "box", u: [40, 48], z: [-3, 3], y: [D + 8.3, D + 8.9], mat: "blue", name: "pool" },
      ...[0, 1].map((k): Item => ({ k: "rail", u: [3.4, L - 8.4], y: D - 0.1 + 2.8 * (k + 1), hw: 6.6, h: 1, name: `deck ${k + 2} promenade rail` })),
      { k: "cyl", u: L - 13, z: 0, y: [D + 10.6, D + 12.6], r: 0.08, mat: "white", name: "radar mast" },
      ...[12, 20, 28, 36].flatMap((u): Item[] => [-2.6, 2.6].map((z): Item => ({ k: "box", u: [u - 0.9, u + 0.9], z: [z - 0.4, z + 0.4], y: [D + 8.3, D + 8.6], mat: "white", name: "sun lounger" }))),
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: L - 4, z: sd * 6.8, y: [D + 1.2, D + 1.8], r: 0.28, n: 8, mat: "orange", name: "lifebuoy" })),
      ...passengerFittings({ L, B: 14.4, D, T: 1.6, fender: 0.25 }),
    ]),
  };
}

export function hurtigrutenSpec(): ShipSpec {
  const L = 121.8;
  const D = 9;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 19.2, depth: D, draft: 4.7, bow: "bulbous", stern: "transom", section: "round", entry: 0.28, run: 0.18, transom: 0.8, sheer: [0, 1.6], boot: 0.4, stripe: 0, screws: 2, bulb: 0.12 },
    livery: { hull: "#1d2024", bottom: "#b02a22", boot: "#b02a22", deck: "#7d8287", house: "#f2f0ea", funnel: "#1d2024", red: "#c23128" },
    items: detailed([
      ...decks({ u: [6, L - 22], y0: D - 0.2, n: 5, h: 2.9, round: [6, 6], inset: 0.4, dhw: 0.3, pitch: 2.6, step: [2, 1.5] }),
      { k: "tier", u: [L - 34, L - 22], y: [D + 14.3, D + 17.2], hw: 7, front: { y: 0.8, h: 1.3, w: 1.2, n: 6 }, wings: { hw: 9.6, h: 1.8 }, name: "bridge" },
      funnel([30, 38], 2.4, [D + 14.3, D + 21], [["funnel", 0.82], ["red", 1]], 0.6),
      mast(L - 28, D + 17.2, D + 26, 0.25),
      { k: "boats", at: [40, 56, 72], z: 9.1, y: D + 4.5, len: 8, r: 1.2 },
      { k: "crane", u: L - 14, z: 3, y: D + 1.4, h: 3, jib: 10, dir: 0.1, mat: "white" },
      { k: "rail", u: [8, L - 30], y: D - 0.2 + 5 * 2.9, hw: 7.6, h: 1.1, name: "sun deck rail" },
      { k: "rail", u: [L - 20, L - 4], y: D + 1.6, hw: 8.6, h: 1.1, name: "foredeck rail" },
      ...exhausts([30, 38], 2.4, D + 21, 0.6),
      ...liferafts(46, 80, 4, 9.2, D + 8.8),
      { k: "domes", u: [L - 30, L - 26], n: 2, r: 0.9, y: D + 17.2, h: 0.9, z: 3, mat: "white", name: "radomes" },
      { k: "freefall", u: 4.4, y: D + 1, len: 7, tilt: 0.5 },
      ...fittings({ L, B: 19.2, D, fc: [20, 0], aft: [], draft: 4.7, rail: [0.6, L - 22] }),
    ]),
  };
}

// ---------------------------------------------------------------------------
// ro-pax ferries

export const ROPAX_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["blue", "Blue"], ["white", "White"], ["red", "Red"])];
/** A ro-pax ferry: car decks in the hull's colour, the passenger decks above, a funnel aft. */
function ropax(o: { L: number; B: number; D: number; T: number; hull: string; house?: string; funnel: string; stripe?: string; carTop: number; tiers: number; bridgeAt: number; funnelU: readonly [number, number]; twinFunnel?: boolean }): ShipSpec {
  const { L, B, D } = o;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: B, depth: D, draft: o.T, bow: "bulbous", stern: "transom", section: "round", entry: 0.28, run: 0.14, transom: 0.9, sheer: [0, 1.2], boot: 0.5, stripe: o.stripe ? 1.2 : 0, screws: 2, bulb: 0.12 },
    livery: { hull: o.hull, stripe: o.stripe ?? o.hull, bottom: "#8f2a22", boot: "#1d2024", deck: "#7d8287", house: o.house ?? "#f2f0ea", funnel: o.funnel },
    items: detailed([
      { k: "tier", u: [0.6, L - 18], y: [D - 0.2, o.carTop], inset: 0.05, round: [0, 18], mat: "hull", top: "deck", windows: [{ y: (o.carTop - D) * 0.55, h: 1.6, w: 4, pitch: 9, from: 20, to: L - 40, mat: "black" }], name: "car decks" },
      ...decks({ u: [6, L - 26], y0: o.carTop, n: o.tiers, h: 2.9, round: [4, 10], inset: 0.6, dhw: 0.25, pitch: 2.6, step: [1.5, 2.5] }),
      { k: "tier", u: [o.bridgeAt - 10, o.bridgeAt], y: [o.carTop + o.tiers * 2.9, o.carTop + o.tiers * 2.9 + 3], hw: B / 2 - 4, front: { y: 0.8, h: 1.4, w: 1.4, n: 9 }, wings: { hw: B / 2 + 0.6, h: 2 }, name: "bridge" },
      ...(o.twinFunnel
        ? [funnel(o.funnelU, 2.4, [o.carTop + o.tiers * 2.9 - 1, o.carTop + o.tiers * 2.9 + 9], [["funnel", 0.85], ["black", 1]], 1, B * 0.25), funnel(o.funnelU, 2.4, [o.carTop + o.tiers * 2.9 - 1, o.carTop + o.tiers * 2.9 + 9], [["funnel", 0.85], ["black", 1]], 1, -B * 0.25)]
        : [funnel(o.funnelU, 3.6, [o.carTop + o.tiers * 2.9 - 1, o.carTop + o.tiers * 2.9 + 9], [["funnel", 0.85], ["black", 1]], 1.4)]),
      mast(o.bridgeAt - 5, o.carTop + o.tiers * 2.9 + 3, o.carTop + o.tiers * 2.9 + 12, 0.3),
      { k: "boats", at: [L * 0.3, L * 0.45, L * 0.6], z: B / 2 - 0.6, y: o.carTop + 2, len: 9, r: 1.4 },
      { k: "rail", u: [10, L - 32], y: o.carTop + o.tiers * 2.9, hw: B / 2 - 1.8 - o.tiers * 0.25, h: 1.1, name: "sun deck rail" },
      ...liferafts(L * 0.22, L * 0.68, 8, B / 2 - 0.8, o.carTop + 0.1),
      ...(o.twinFunnel ? [] : exhausts(o.funnelU, 3.6, o.carTop + o.tiers * 2.9 + 9, 1.4)),
      { k: "domes", u: [o.bridgeAt - 8, o.bridgeAt - 2], n: 2, r: 1, y: o.carTop + o.tiers * 2.9 + 3, h: 1, z: B / 4, mat: "white", name: "radomes" },
      { k: "plate", pts: [[0.2, D - 1], [0.2, o.carTop - 2], [0.6, o.carTop - 2], [0.6, D - 1]], z: 0, t: B * 0.5, mat: "steel", name: "stern door" },
      { k: "freefall", u: L - 20, y: o.carTop + 0.4, len: 8, tilt: -0.4, name: "rescue boat" },
      ...fittings({ L, B, D, fc: [18, 0], aft: [3], draft: o.T, rail: false }),
      // the bow visor's seam on both sides
      { k: "hullLine", pts: [[L - 26, o.carTop - 0.6], [L - 21, D + 2], [L - 13, o.T + 1.6]], w: 0.12, mat: "black", name: "bow visor seam" },
    ]),
  };
}

export function channelRopaxSpec(p?: ParamValues): ShipSpec {
  const liv = pick(ROPAX_PARAMS, p, "livery");
  const hull = liv === "white" ? "#eeeeea" : liv === "red" ? "#a8302a" : "#1f2f4f";
  return ropax({ L: 213, B: 31.4, D: 9.5, T: 6.5, hull, funnel: hull, carTop: 22, tiers: 4, bridgeAt: 186, funnelU: [44, 60], twinFunnel: true });
}

export function megastarSpec(): ShipSpec {
  return ropax({ L: 212, B: 30.6, D: 9.5, T: 7.1, hull: "#f2f0ea", stripe: "#1f3f7a", funnel: "#f2f0ea", carTop: 21, tiers: 4, bridgeAt: 188, funnelU: [30, 44] });
}

export function jpOvernightSpec(): ShipSpec {
  return ropax({ L: 199.9, B: 27, D: 9.5, T: 6.9, hull: "#f2f0ea", stripe: "#d9681e", funnel: "#d9681e", carTop: 20, tiers: 5, bridgeAt: 178, funnelU: [36, 50] });
}

// ---------------------------------------------------------------------------
// cruise ships and liners

export function oasisSpec(): ShipSpec {
  const L = 362;
  const D = 22;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 47, depth: D, draft: 9.3, bow: "bulbous", stern: "transom", section: "round", entry: 0.22, run: 0.16, transom: 0.92, sheer: [0, 1], boot: 0.6, stripe: 2, screws: 0, bulb: 0.1 },
    livery: { hull: "#f2f0ea", stripe: "#1f3f7a", bottom: "#1f3f7a", boot: "#1d2024", deck: "#a1a5a6", house: "#f2f0ea", funnel: "#f2f0ea", blue: "#2a6fae", green: "#4a8a4a" },
    items: detailed([
      { k: "tier", u: [2, L - 22], y: [D - 0.2, D + 9], inset: 0.05, round: [0, 30], mat: "hull", windows: [{ y: 3, h: 1.2, w: 1.4, pitch: 3 }, { y: 6, h: 1.2, w: 1.4, pitch: 3 }], name: "public decks" },
      // the two balcony towers either side of the open park, joined at the ends
      ...decks({ u: [10, L - 50], y0: D + 9, n: 9, h: 3, round: [6, 20], inset: 0.4, dhw: 0, pitch: 3, glazed: true, step: [0, 2] }),
      { k: "box", u: [60, 250], z: [-6, 6], y: [D + 36, D + 37], mat: "green", name: "central park" },
      { k: "tier", u: [36, L - 80], y: [D + 36, D + 41], inset: 4, round: [4, 10], windows: [{ y: 1.4, h: 2.4, w: 2.4, pitch: 3 }], name: "sports deck" },
      { k: "tier", u: [L - 66, L - 52], y: [D + 36, D + 40], hw: 30, front: { y: 1, h: 2, w: 2, n: 14 }, name: "bridge" },
      funnel([120, 140], 8, [D + 41, D + 50], [["funnel", 0.8], ["blue", 1]], 1.5),
      { k: "box", u: [200, 230], z: [-4, 4], y: [D + 41, D + 43], mat: "blue", name: "pool deck" },
      { k: "boats", at: [100, 130, 160, 190, 220, 250], z: 23, y: D + 2.5, len: 16, r: 2.4 },
      // the balcony rails along every cabin deck, the sun deck rails, the lifeboats' davits, the fittings
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k): Item => ({ k: "box", u: [14, L - 54 - 2 * k], z: [22.9, 23.0], y: [D + 9 + 3 * k + 0.3, D + 9 + 3 * k + 1.3], mat: "glass", name: "starboard balcony glass" })),
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k): Item => ({ k: "box", u: [14, L - 54 - 2 * k], z: [-23.0, -22.9], y: [D + 9 + 3 * k + 0.3, D + 9 + 3 * k + 1.3], mat: "glass", name: "port balcony glass" })),
      { k: "rail", u: [40, L - 84], y: D + 41, hw: 17, h: 1.2, name: "sports deck rail" },
      ...exhausts([120, 140], 8, D + 50, 1.5),
      ...[60, 80, 290, 300].map((u): Item => ({ k: "domes", u: [u, u], n: 1, r: 2, y: D + 36, h: 2, mat: "white", name: "radome" })),
      ...[100, 130, 160, 190, 220, 250].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 0.4, u + 0.4], z: sd > 0 ? [22.2, 23.2] : [-23.2, -22.2], y: [D + 2, D + 6.5], mat: "steel", name: "davit" }))),
      ...fittings({ L, B: 47, D, fc: [22, 0], aft: [3], draft: 9.3, rail: false }),
    ]),
  };
}

export function iconSpec(): ShipSpec {
  const L = 364.75;
  const D = 22;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 48.5, depth: D, draft: 9.25, bow: "bulbous", stern: "transom", section: "round", entry: 0.22, run: 0.16, transom: 0.92, sheer: [0, 1], boot: 0.6, stripe: 2, screws: 0, bulb: 0.1 },
    livery: { hull: "#f2f0ea", stripe: "#1f3f7a", bottom: "#1f3f7a", boot: "#1d2024", deck: "#a1a5a6", house: "#f2f0ea", funnel: "#f2f0ea", blue: "#2a6fae", orange: "#e57a1f", yellow: "#e8bf2a" },
    items: detailed([
      { k: "tier", u: [2, L - 22], y: [D - 0.2, D + 9], inset: 0.05, round: [0, 30], mat: "hull", windows: [{ y: 3, h: 1.2, w: 1.4, pitch: 3 }, { y: 6, h: 1.2, w: 1.4, pitch: 3 }], name: "public decks" },
      ...decks({ u: [10, L - 50], y0: D + 9, n: 10, h: 3, round: [6, 22], inset: 0.4, pitch: 3, glazed: true, step: [0, 2] }),
      // the AquaDome forward on top, the water park aft
      { k: "spheres", u: [L - 110, L - 70], n: 1, r: 19, y: D + 39, base: D + 38.5, mat: "glass", cover: "house", name: "AquaDome" },
      { k: "tier", u: [L - 76, L - 62], y: [D + 39, D + 43], hw: 30, front: { y: 1, h: 2, w: 2, n: 14 }, name: "bridge" },
      funnel([110, 132], 8.5, [D + 39, D + 49], [["funnel", 0.8], ["blue", 1]], 1.5),
      { k: "tier", u: [30, 100], y: [D + 39, D + 42], inset: 6, round: [6, 6], mat: "blue", name: "water park" },
      ...[[40, 8], [60, -8], [80, 6]].map(([u, z], i): Item => ({ k: "rod", a: [u!, D + 42, z!], b: [u! + 18, D + 48, z! * 0.5], r: 1.2, mat: i === 1 ? "orange" : "yellow", name: `water slide ${i + 1}` })),
      { k: "boats", at: [100, 130, 160, 190, 220, 250], z: 23.6, y: D + 2.5, len: 16, r: 2.4 },
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k): Item => ({ k: "box", u: [14, L - 54 - 2 * k], z: [23.65, 23.75], y: [D + 9 + 3 * k + 0.3, D + 9 + 3 * k + 1.3], mat: "glass", name: "starboard balcony glass" })),
      ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k): Item => ({ k: "box", u: [14, L - 54 - 2 * k], z: [-23.75, -23.65], y: [D + 9 + 3 * k + 0.3, D + 9 + 3 * k + 1.3], mat: "glass", name: "port balcony glass" })),
      { k: "rail", u: [34, 96], y: D + 42, hw: 17, h: 1.2, name: "water park rail" },
      ...exhausts([110, 132], 8.5, D + 49, 1.5),
      ...[140, 150].map((u): Item => ({ k: "domes", u: [u, u], n: 1, r: 2, y: D + 39, h: 2, mat: "white", name: "radome" })),
      ...[100, 130, 160, 190, 220, 250].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 0.4, u + 0.4], z: sd > 0 ? [22.8, 23.8] : [-23.8, -22.8], y: [D + 2, D + 6.5], mat: "steel", name: "davit" }))),
      ...fittings({ L, B: 48.5, D, fc: [22, 0], aft: [3], draft: 9.25, rail: false }),
    ]),
  };
}

/** A liner's funnel: a raked oval in the line's bands. */
function linerFunnel(u: number, hw: number, y0: number, h: number, bands: Array<readonly [string, number]>, rake: number): Item {
  return funnel([u - hw * 1.3, u + hw * 1.3], hw, [y0, y0 + h], bands, rake);
}

export function queenMary2Spec(): ShipSpec {
  const L = 345;
  const D = 19;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 41, depth: D, draft: 10, bow: "bulbous", stern: "transom", section: "round", entry: 0.3, run: 0.18, transom: 0.7, rake: 0.05, sheer: [0, 2], boot: 0.8, stripe: 0, screws: 0, bulb: 0.1 },
    livery: { hull: "#1d2024", bottom: "#b02a22", boot: "#b02a22", deck: "#a1a5a6", house: "#f2f0ea", funnel: "#c23128", white: "#f2f0ea" },
    items: detailed([
      { k: "tier", u: [2, L - 34], y: [D - 0.2, D + 6], inset: 0.05, round: [0, 26], mat: "white", windows: [{ y: 1.6, h: 1.4, w: 1.6, pitch: 3 }, { y: 4.2, h: 1.2, w: 1.4, pitch: 3 }], name: "promenade decks" },
      ...decks({ u: [6, L - 56], y0: D + 6, n: 6, h: 3, round: [6, 18], inset: 0.6, dhw: 0.3, pitch: 3, glazed: true, step: [3, 3] }),
      { k: "tier", u: [L - 82, L - 66], y: [D + 24, D + 27], hw: 16, front: { y: 0.8, h: 1.6, w: 1.6, n: 10 }, wings: { hw: 22.5, h: 2.2 }, name: "bridge" },
      linerFunnel(140, 6, D + 24, 14, [["funnel", 0.82], ["black", 1]], 3),
      mast(L - 76, D + 27, D + 44, 0.4),
      { k: "boats", at: [90, 115, 140, 165, 190, 215, 240], z: 20.2, y: D + 7.5, len: 12, r: 2 },
      { k: "portholes", u: [20, L - 30], y: D - 3, pitch: 3, r: 0.35, name: "hull lights" },
      { k: "portholes", u: [30, L - 40], y: D - 6, pitch: 3, r: 0.35, name: "lower hull lights" },
      ...[0, 1, 2, 3, 4, 5].map((k): Item => ({ k: "rail", u: [8 + 3 * k, L - 58 - 3 * k], y: D + 9 + 3 * k, hw: 20.3 - 0.6 - 0.3 * k - 0.4, h: 1.1, name: `deck ${k + 1} rail` })).slice(5),
      { k: "rail", u: [L - 54, L - 36], y: D + 6, hw: 19.6, h: 1.1, name: "observation deck rail" },
      ...exhausts([140 - 7.8, 140 + 7.8], 6, D + 38, 3),
      ...[L - 80, L - 72].map((u): Item => ({ k: "domes", u: [u, u], n: 1, r: 1.6, y: D + 27, h: 1.6, mat: "white", name: "radome" })),
      ...fittings({ L, B: 41, D, fc: [34, 0], aft: [3], draft: 10, rail: [L - 34, L - 4] }),
    ]),
  };
}

/**
 * RMS Olympic as built (1911), measured off the class's profile plan and the
 * photographs in assets/ship-olympic/: the hull black up to the B deck, the
 * forecastle and poop one deck up with the well decks between them and the
 * house, the white B-deck strake flush with the hull, the A-deck promenade open
 * along its length under the boat deck, sixteen boats in their davits, the
 * officers' quarters and the bridge at the front of the boat deck, four raked
 * buff funnels with black tops (the aft one a dummy) on their deckhouses, two
 * raked masts with the wireless aerials between them, and the cargo cranes.
 */
export function olympicSpec(): ShipSpec {
  const L = 269;
  const D = 20.4; // the C (shelter) deck: the well decks amidships
  const hull: HullForm = { fine: true, length: L, beam: 28.2, depth: D, draft: 10.5, bow: "plumb", stern: "cruiser", section: "round", entry: 0.22, run: 0.16, rake: 0.008, sheer: [0.8, 3], forecastle: [40, 3.7], poop: [33, 2.4], boot: 0.35, stripe: 0, screws: 0, counter: [9, 17.2, 19.4] };
  const g = hullGeometry(hull);
  const dk = (u: number): number => g.deck(u);
  const hb = (u: number): number => g.halfBeam(u, g.deck(u));
  const B = D + 2.4; // B deck: the poop's level, the top of the black amidships
  const A = D + 5.6; // A deck: the promenade
  const BD = D + 8.6; // the boat deck
  const HT = BD + 2.6; // the boat deck's houses
  const H0 = 46; // the house's aft end (the aft well deck before it)
  const H1 = 213.9; // its front (the forward well deck before it)
  const funnels = [85, 122, 156, 192];
  const FT = 53.2; // the funnels' tops, 175 ft over the keel
  const RAKE = 3.6;
  const fore = { u: 230.6, top: 70 };
  const main = { u: 45.2, top: 69 };
  const lean = 0.04; // the masts' rake aft, metres per metre
  const mastAt = (m: { u: number; top: number }, y: number): [number, number, number] => [m.u - (y - dk(m.u)) * lean, y, 0];
  const [ma, fa] = [mastAt(main, main.top - 1.2), mastAt(fore, fore.top - 1.2)];
  const aerialY = (u: number): number => ma[1] + ((u - ma[0]) / (fa[0] - ma[0])) * (fa[1] - ma[1]);
  const boats = [70.5, 80.8, 91, 101.3, 168.5, 178.5, 188.5, 198.6];
  const BZ = 12.3; // the boats' centres off the centreline
  const houses: Array<[number, number, string]> = [[181, 207.4, "officers' quarters"], [165, 177.4, "gymnasium and forward entrance"], [146, 163, "second funnel house"], [112, 138, "lounge house"], [80, 100, "aft entrance house"], [62, 77, "after deckhouse"]];
  const F0 = BD - 0.02; // the funnels' foot, inside their houses
  const fcU = (u: number, y: number): number => u - (RAKE * (y - F0)) / (FT - F0); // a funnel's centre at height y
  const GY = HT + (FT - HT) * 0.7; // where the guys meet the funnels
  // the cargo cranes: u, off the centreline, base height, jib heading (0 forward)
  const cranes: Array<[number, number, number, number]> = [[249, 4, dk(249), Math.PI], [217.5, 5.2, dk(217.5), 0], [29.5, 5.2, dk(29.5), 0], [50, 6, BD, Math.PI]];
  return {
    kind: "passenger",
    hull,
    livery: { hull: "#1d2024", bottom: "#8f2620", boot: "#b02a22", deck: "#c9b48a", house: "#f2f0ea", roof: "#d9d8d2", funnel: "#c98a3c", mast: "#a8865a", white: "#f2f0ea", gold: "#c9a227", boat: "#f2f0ea", shade: "#80837f" },
    items: [
      // the boat deck's houses (listed first: the distant model draws the hull's decks as one block and the funnels before them)
      ...houses.map(([u0, u1, name]): Item => ({ k: "tier", u: [u0, u1], y: [BD, HT], hw: 6.5, lip: 0.15, windows: [{ y: 0.8, h: 1, w: 0.8, pitch: 2.4 }], front: { y: 0.8, h: 1, w: 0.8, n: 5 }, name })),
      { k: "tier", u: [207.4, 211.2], y: [BD, HT], hw: 6.5, lip: 0.15, windows: [{ y: 0.9, h: 1.1, w: 0.9, pitch: 1.4 }], front: { y: 0.9, h: 1.1, w: 1.1, n: 8 }, wings: { hw: 14.15, h: 2.6, len: 2.2 }, name: "bridge" },
      { k: "tier", u: [126.4, 136], y: [HT, HT + 1.3], hw: 4.2, lip: 0.1, mat: "white", windows: [{ y: 0.3, h: 0.7, w: 1, pitch: 1.6 }], name: "lounge clerestory" },
      { k: "domes", u: [170, 170], n: 1, r: 2.2, y: HT - 0.02, h: 0.7, mat: "white", name: "forward staircase dome" },
      { k: "domes", u: [93, 93], n: 1, r: 1.8, y: HT - 0.02, h: 0.6, mat: "white", name: "aft staircase dome" },
      // the funnels stand on the boat deck inside their houses: raked, buff with black tops
      ...funnels.map((u): Item => linerFunnel(u, 2.9, F0, FT - F0, [["funnel", (FT - 6.7 - F0) / (FT - F0)], ["black", 1]], RAKE)),
      // each funnel's whistle and steam pipes up its forward and after faces, its guys to the deck's edge
      ...funnels.flatMap((u): Item[] => [[3.95, 0.16], [-3.95, 0.12]].map(([du, r]): Item => rod([fcU(u, HT - 0.05) + du!, HT - 0.05, 0], [fcU(u, FT - 1.2) + du!, FT - 1.2, 0], r!, "funnel", "steam pipe"))),
      ...funnels.flatMap((u): Item[] => [[-5.5, 1], [3.5, 1], [-5.5, -1], [3.5, -1]].map(([du, sd]): Item => rod([fcU(u, GY), GY, sd! * 2.2], [u + du!, BD + 0.1, sd! * 13.6], 0.05, "rope", "funnel guy"))),
      // the hull above the C deck: black up to the B deck along the sheer, the white B-deck strake flush with it
      { k: "bulwark", u: [H0, H1], h: 2.4, t: 0.3, mat: "hull", name: "C deck shell" },
      ...[[H1, H1 + 0.05], [H0 - 0.05, H0]].map(([u0, u1]): Item => ({ k: "box", u: [u0!, u1!], z: [-(hb(u0!) - 0.005), hb(u0!) - 0.005], y: [dk(u0!) - 0.05, dk(u0!) + 2.4], mat: "hull", name: "C deck shell end" })),
      { k: "tier", u: [H0, H1], y: [D - 0.2, A], inset: 0.03, lip: 0, top: "deck", windows: [{ y: 3.85, h: 0.85, w: 0.7, pitch: 1.9 }], front: { y: 3.7, h: 1, w: 0.9, n: 11 }, name: "B deck" },
      // A deck: the cabins set in from the side under the boat deck (their walls in shade), the promenade open along its length
      { k: "tier", u: [H0 + 2.4, H1 - 2.4], y: [A, BD], inset: 2.4, lip: 2.35, top: "deck", windows: [{ y: 0.9, h: 1.2, w: 1.1, pitch: 2.6 }], name: "A deck" },
      ...[1, -1].map((sd): Item => ({ k: "box", u: [H0 + 3.4, H1 - 3.4], z: sd > 0 ? [11.705, 11.72] : [-11.72, -11.705], y: [A + 0.02, BD - 0.32], mat: "shade", name: sd > 0 ? "promenade in shade" : "promenade in shade port" })),
      ...[1, -1].map((sd): Item => ({ k: "box", u: [H0 + 0.25, H1 - 0.25], z: sd > 0 ? [13.72, 14.0] : [-14.0, -13.72], y: [A - 0.02, A + 1.1], mat: "white", name: sd > 0 ? "promenade screen" : "promenade screen port" })),
      ...[1, -1].flatMap((sd): Item[] => Array.from({ length: 56 }, (_, k) => H0 + 0.6 + k * ((H1 - H0 - 1.2) / 55)).map((u): Item => ({ k: "box", u: [u - 0.13, u + 0.13], z: sd > 0 ? [13.74, 13.98] : [-13.98, -13.74], y: [A + 1.05, BD - 0.27], mat: "white", name: "promenade stanchion" }))),
      { k: "tier", u: [H1 - 0.45, H1 - 0.12], y: [A, BD - 0.26], inset: 0.1, lip: 0, mat: "white", front: { y: 1.1, h: 1.2, w: 1.2, n: 9 }, name: "A deck front screen" },
      { k: "tier", u: [H0 + 0.12, H0 + 0.45], y: [A, BD - 0.26], inset: 0.1, lip: 0, mat: "white", name: "A deck aft screen" },
      // the boat deck's white edge over the shaded promenade, its rail
      ...[1, -1].map((sd): Item => ({ k: "box", u: [H0 + 0.02, H1 - 0.02], z: sd > 0 ? [14.02, 14.08] : [-14.08, -14.02], y: [BD - 0.34, BD + 0.02], mat: "white", name: sd > 0 ? "boat deck edge" : "boat deck edge port" })),
      ...[H0 + 0.02, H1 - 0.08].map((u): Item => ({ k: "box", u: [u, u + 0.06], z: [-14.02, 14.02], y: [BD - 0.34, BD + 0.02], mat: "white", name: "boat deck edge end" })),
      { k: "rail", u: [H0 + 0.4, H1 - 0.4], y: BD, hw: 13.85, h: 1.1, name: "boat deck rail" },
      // the boats in their chocks and their davits
      { k: "boats", at: boats, z: BZ, y: BD + 1.5, len: 9.1, r: 1.15, name: "lifeboats" },
      ...boats.flatMap((u): Item[] => [1, -1].flatMap((sd): Item[] => [u - 2.6, u + 2.6].map((uc): Item => ({ k: "box", u: [uc - 0.25, uc + 0.25], z: [sd * BZ - 0.75, sd * BZ + 0.75].sort((a, b) => a - b) as [number, number], y: [BD - 0.02, BD + 0.55], mat: "white", name: "boat chock" })))),
      ...boats.flatMap((u): Item[] => [1, -1].flatMap((sd): Item[] => [u - 4.9, u + 4.9].flatMap((ud): Item[] => [
        { k: "box", u: [ud - 0.3, ud + 0.3], z: [sd * 13.3 - 0.3, sd * 13.3 + 0.3].sort((a, b) => a - b) as [number, number], y: [BD - 0.02, BD + 0.9], mat: "white", name: "davit base" },
        rod([ud, BD + 0.85, sd * 13.3], [ud, BD + 4.6, sd * 13.5], 0.15, "white", "davit"),
        rod([ud, BD + 4.6, sd * 13.5], [ud, BD + 4.9, sd * BZ], 0.13, "white", "davit arm"),
        rod([ud, BD + 4.9, sd * BZ], [ud + (ud < u ? 0.9 : -0.9), BD + 1.9, sd * BZ], 0.04, "rope", "boat fall"),
      ]))),
      { k: "vents", at: [[142, 5], [142, -5], [106, 5], [106, -5], [179.2, 4], [179.2, -4], [164, 3], [164, -3], [78.5, 3], [78.5, -3], [55, 6], [55, -6], [58.5, 2.5], [58.5, -2.5]], y: BD, h: 1.8, r: 0.45, cowl: true, mat: "white", name: "boat deck ventilators" },
      // the hull: portholes deck by deck, the gold line along the sheer
      ...Array.from({ length: 8 }, (_, k) => H0 + 1 + k * 20.9).map((u): Item => ({ k: "portholes", u: [u, u + 20], y: dk(u + 10) + 1.05, pitch: 2.2, r: 0.24, name: "C deck portholes" })),
      { k: "portholes", u: [14, 258], y: D - 1.5, pitch: 2.4, r: 0.24, name: "D deck portholes" },
      { k: "portholes", u: [22, 250], y: D - 4.3, pitch: 2.8, r: 0.22, name: "E deck portholes" },
      { k: "portholes", u: [190, 250], y: D - 7, pitch: 3, r: 0.2, name: "F deck portholes" },
      { k: "portholes", u: [233, 262], y: dk(245) - 1.6, pitch: 2.4, r: 0.24, name: "forecastle portholes" },
      { k: "portholes", u: [8, 32], y: B - 1.2, pitch: 2.4, r: 0.24, name: "poop portholes" },
      { k: "hullLine", pts: Array.from({ length: 28 }, (_, k) => Math.min(268.2, 1 + k * 10)).map((u): [number, number] => [u, D + 0.8 * Math.max(0, (134.5 - u) / 134.5) ** 2 + 3 * Math.max(0, (u - 134.5) / 134.5) ** 2 - 0.9]), w: 0.16, mat: "gold", name: "gold line" },
      // the well decks: their bulwarks, hatches and cranes; the forecastle's hatch and cranes
      { k: "bulwark", u: [33.6, H0], h: 1.2, mat: "hull", name: "aft well bulwark" },
      { k: "bulwark", u: [H1, 229], h: 1.2, mat: "hull", name: "forward well bulwark" },
      ...([[222, 3.4], [39.5, 3.2], [241, 3.5], [20, 3]] as const).map(([u, hw]): Item => ({ k: "hatches", u: [u - 2.6, u + 2.6], n: 1, hw, y: dk(u), h: 0.35, coaming: 0.7, mat: "wood", name: "hatch" })),
      ...cranes.flatMap(([u, z, y, dir]): Item[] => [1, -1].map((sd): Item => ({ k: "crane", u, z: sd * z, y: y - 0.05, h: 2.6, jib: 7.5, dir: dir + sd * (dir > 0 ? -0.25 : 0.25), lift: 0.7, mat: "white", name: "cargo crane" }))),
      // the rudder's stock above the waterline, black like the hull
      { k: "box", u: [3.74, 9.01], z: [-0.18, 0.18], y: [10.5 + 0.35, 17.6], mat: "hull", name: "rudder above the waterline" },
      // the docking bridge across the poop
      { k: "box", u: [11.2, 13.2], z: [-hb(12.2) + 0.2, hb(12.2) - 0.2], y: [dk(12.2) + 2.5, dk(12.2) + 2.75], mat: "white", name: "docking bridge" },
      { k: "box", u: [11.4, 13], z: [-1.6, 1.6], y: [dk(12.2) + 2.74, dk(12.2) + 4.6], mat: "white", name: "docking bridge cab" },
      ...[-1, 1].flatMap((sd): Item[] => [2.2, 7.5].map((zz): Item => ({ k: "box", u: [12, 12.4], z: [sd * zz - 0.15, sd * zz + 0.15].sort((a, b) => a - b) as [number, number], y: [dk(12.2) - 0.05, dk(12.2) + 2.52], mat: "white", name: "docking bridge post" }))),
      { k: "edgeRail", u: [0.6, 33.2], h: 1.1, name: "poop rail" },
      // the raked masts: crow's nest, aerial spreaders, shrouds and stays, the wireless aerials between them
      ...[fore, main].map((mm): Item => rod([mm.u, dk(mm.u) - 0.15, 0], mastAt(mm, mm.top), 0.42, "mast", mm === fore ? "foremast" : "mainmast")),
      { k: "cyl", u: mastAt(fore, 36)[0], y: [35.6, 37.4], r: 0.95, mat: "mast", name: "crow's nest" },
      ...[fore, main].map((mm): Item => rod([mastAt(mm, mm.top - 1.2)[0], mm.top - 1.2, -1.6], [mastAt(mm, mm.top - 1.2)[0], mm.top - 1.2, 1.6], 0.09, "mast", "aerial spreader")),
      rod([mastAt(fore, 52)[0], 52, -2.6], [mastAt(fore, 52)[0], 52, 2.6], 0.1, "mast", "signal yard"),
      ...[1, -1].map((sd): Item => rod([mastAt(main, main.top - 1.2)[0], main.top - 1.2, sd * 1.4], [mastAt(fore, fore.top - 1.2)[0], fore.top - 1.2, sd * 1.4], 0.04, "rope", "wireless aerial")),
      rod([182, aerialY(182), 1.4], [181.6, HT - 0.02, 0.6], 0.04, "rope", "aerial lead-in"),
      rod(mastAt(fore, fore.top - 0.6), [L - 0.3, dk(L - 0.3) + 0.4, 0], 0.06, "rope", "forestay"),
      rod(mastAt(main, main.top - 0.6), [1.2, dk(1.2) + 0.4, 0], 0.06, "rope", "backstay"),
      ...[1, -1].flatMap((sd): Item[] => [229.9, 231.4, 232.9].map((u): Item => rod(mastAt(fore, 46), [u, dk(u) + 0.05, sd * (hb(u) - 0.3)], 0.04, "rope", "foremast shroud"))),
      ...[1, -1].flatMap((sd): Item[] => [40.6, 42.1, 43.6].map((u): Item => rod(mastAt(main, 45), [u, dk(u) + 0.05, sd * (hb(u) - 0.3)], 0.04, "rope", "mainmast shroud"))),
      ...fittings({ L, B: 28.2, D: D + 3, fc: [40, 3.7], aft: [3, 31], draft: 10.5, rake: 0.01, rail: false }),
    ],
  };
}

export function unitedStatesSpec(): ShipSpec {
  const L = 302;
  const D = 22;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 31, depth: D, draft: 9.5, bow: "raked", stern: "cruiser", section: "round", entry: 0.3, run: 0.18, rake: 0.05, sheer: [1, 3], boot: 0.6, stripe: 0, screws: 0 },
    livery: { hull: "#1d2024", bottom: "#b02a22", boot: "#b02a22", deck: "#a1a5a6", house: "#f2f0ea", funnel: "#c23128", blue: "#1f3f7a" },
    items: detailed([
      { k: "portholes", u: [20, 280], y: 17.5, pitch: 3.6, r: 0.3 },
      ...decks({ u: [30, 232], y0: D - 0.2, n: 4, h: 2.9, round: [6, 10], inset: 0.4, dhw: 0.3, pitch: 2.6, step: [3, 4] }),
      { k: "tier", u: [206, 222], y: [D + 11.4, D + 14.2], hw: 9, front: { y: 0.8, h: 1.1, w: 1, n: 8 }, wings: { hw: 15.5, h: 1.6 }, name: "bridge" },
      linerFunnel(178, 6.4, D + 11.4, 17, [["house", 0.62], ["funnel", 0.86], ["blue", 1]], 2.5),
      linerFunnel(126, 6.4, D + 11.4, 17, [["house", 0.62], ["funnel", 0.86], ["blue", 1]], 2.5),
      mast(214, D + 14.2, D + 30, 0.4),
      { k: "boats", at: [100, 112, 124, 150, 162, 190], z: 14.4, y: D + 6.5, len: 10, r: 1.4 },
      { k: "portholes", u: [24, 276], y: 14, pitch: 3.6, r: 0.3, name: "lower portholes" },
      ...[0, 1, 2, 3].map((k): Item => ({ k: "rail", u: [30 + 3 * k + 0.6, 232 - 4 * k - 0.6], y: D - 0.2 + 2.9 * (k + 1), hw: 15.5 - 0.4 - 0.3 * (k + 1) - 0.2, h: 1.1, name: `deck ${k + 2} rail` })).slice(3),
      ...exhausts([178 - 8.3, 178 + 8.3], 6.4, D + 28.4, 2.5),
      ...exhausts([126 - 8.3, 126 + 8.3], 6.4, D + 28.4, 2.5),
      ...[100, 112, 124, 150, 162, 190].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 0.2, u + 0.2], z: sd > 0 ? [14.9, 15.3] : [-15.3, -14.9], y: [D + 5, D + 9], mat: "white", name: "davit" }))),
      ...fittings({ L, B: 31, D, fc: [64, 0], aft: [4], draft: 9.5, rail: [L - 66, L - 4] }),
    ]),
  };
}

export function normandieSpec(): ShipSpec {
  const L = 313.8;
  const D = 23;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 36.4, depth: D, draft: 11.2, bow: "clipper", stern: "cruiser", section: "round", entry: 0.32, run: 0.18, rake: 0.05, sheer: [1, 4], boot: 0.6, stripe: 0, screws: 0 },
    livery: { hull: "#1d2024", bottom: "#b02a22", boot: "#f2f0ea", deck: "#c9b48a", house: "#f2f0ea", funnel: "#c23128" },
    items: detailed([
      { k: "portholes", u: [20, 290], y: 18.5, pitch: 3.6, r: 0.3 },
      // the whaleback over the forecastle, the stepped decks
      { k: "tier", u: [252, 296], y: [D - 0.2, D + 2.4], inset: 0.2, round: [0, 26], mat: "hull", top: "deck", name: "whaleback" },
      ...decks({ u: [36, 244], y0: D - 0.2, n: 4, h: 2.9, round: [10, 8], inset: 0.5, dhw: 0.4, pitch: 2.6, step: [6, 3] }),
      { k: "tier", u: [222, 238], y: [D + 11.4, D + 14.2], hw: 10, front: { y: 0.8, h: 1.1, w: 1, n: 8 }, wings: { hw: 18, h: 1.6 }, name: "bridge" },
      ...[196, 160, 124].map((u, i): Item => linerFunnel(u, 6 - i * 0.3, D + 11.4, 22 - i * 2, [["funnel", 0.84], ["black", 1]], 4)),
      mast(244, D + 2.4, D + 40, 0.5),
      mast(70, D + 11, D + 38, 0.5),
      { k: "boats", at: [110, 140, 172, 204], z: 16.8, y: D + 6.5, len: 10, r: 1.4 },
      { k: "portholes", u: [24, 286], y: 15, pitch: 3.6, r: 0.3, name: "lower portholes" },
      { k: "rail", u: [48, 232], y: D - 0.2 + 4 * 2.9, hw: 15.2, h: 1.1, name: "sun deck rail" },
      ...[196, 160, 124].flatMap((u, i): Item[] => exhausts([u - 7.8, u + 7.8], 6 - i * 0.3, D + 33.4 - i * 2, 4)),
      ...[110, 140, 172, 204].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 0.2, u + 0.2], z: sd > 0 ? [16.6, 17] : [-17, -16.6], y: [D + 5, D + 9], mat: "white", name: "davit" }))),
      rod([244, D + 40, 0], [L + 0.5, D + 3, 0], 0.06, "rope", "forestay"),
      ...fittings({ L, B: 36.4, D: D + 2.4, fc: [44, 0], aft: [3], draft: 11.2, rake: 0.05, rail: false }),
    ]),
  };
}

export function expeditionSpec(): ShipSpec {
  const L = 140;
  const D = 9;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 23.6, depth: D, draft: 5.3, bow: "ice", stern: "transom", section: "round", entry: 0.3, run: 0.18, transom: 0.85, sheer: [0, 2], boot: 0.5, stripe: 0, screws: 2 },
    livery: { hull: "#1d2024", bottom: "#b02a22", boot: "#b02a22", deck: "#7d8287", house: "#f2f0ea", funnel: "#1d2024", glass: "#1a242b" },
    items: detailed([
      ...decks({ u: [4, L - 24], y0: D - 0.2, n: 6, h: 2.9, round: [4, 10], inset: 0.4, dhw: 0.35, pitch: 2.4, glazed: true, step: [2, 1.5] }),
      { k: "tier", u: [L - 42, L - 30], y: [D + 17.2, D + 20], hw: 8, round: [0, 4], front: { y: 0.4, h: 1.8, w: 1.4, n: 6 }, wings: { hw: 11.8, h: 2 }, name: "bridge" },
      funnel([30, 38], 2.4, [D + 17.2, D + 22], [["funnel", 1]], 0.6),
      mast(L - 36, D + 20, D + 28, 0.25),
      { k: "boats", at: [26, 40], z: 11.4, y: D + 2.6, len: 7, r: 1.1, mat: "orange", name: "expedition boats" },
      { k: "rail", u: [6, L - 26], y: D - 0.2 + 6 * 2.9, hw: 9.2, h: 1.1, name: "observation deck rail" },
      { k: "rail", u: [L - 22, L - 4], y: D + 2, hw: 10.4, h: 1.1, name: "foredeck rail" },
      ...exhausts([30, 38], 2.4, D + 22, 0.6),
      { k: "domes", u: [L - 40, L - 34], n: 2, r: 0.9, y: D + 20, h: 0.9, z: 4, mat: "white", name: "radomes" },
      { k: "crane", u: 18, z: 9, y: D + 2.6, h: 3.4, jib: 12, dir: Math.PI * 0.6, mat: "white", name: "boat crane" },
      ...[60, 80, 100].map((u): Item => ({ k: "boats", at: [u], z: 11.6, y: D + 3.2, len: 8, r: 1.2, name: "lifeboats" })),
      ...fittings({ L, B: 23.6, D, fc: [24, 0], aft: [], draft: 5.3, rake: 0.08, rail: false }),
    ]),
  };
}

export const RIVER_CRUISE_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ liveryParam(["blue", "Blue"], ["white", "White"], ["red", "Red"])];
export function riverCruiseSpec(p?: ParamValues): ShipSpec {
  const L = 135;
  const D = 2.6;
  const liv = pick(RIVER_CRUISE_PARAMS, p, "livery");
  const accent = liv === "white" ? "#d8d8d4" : liv === "red" ? "#8f2a22" : "#1f3f7a";
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 11.45, depth: D, draft: 1.6, bow: "raked", stern: "transom", section: "flat", entry: 0.1, run: 0.06, transom: 0.85, rake: 0.04, sheer: [0, 0.4], boot: 0.15, stripe: 0.8, screws: 2 },
    livery: { hull: "#f2f0ea", stripe: accent, bottom: "#1d2024", boot: "#1d2024", deck: "#7d8287", house: "#f2f0ea", roof: "#7d8287", accent },
    items: detailed([
      ...decks({ u: [3, L - 8], y0: D - 0.1, n: 2, h: 2.7, round: [2, 6], inset: 0.2, pitch: 2.6, glazed: true }),
      { k: "tier", u: [L - 22, L - 12], y: [D + 5.3, D + 7.6], hw: 4.4, front: { y: 0.4, h: 1.3, w: 1.2, n: 5 }, name: "wheelhouse" },
      { k: "tier", u: [L - 36, L - 22], y: [D + 5.3, D + 7.4], hw: 5.2, round: [2, 0], windows: [{ y: 0.3, h: 1.6, w: 2, pitch: 2.4 }], name: "lounge" },
      { k: "rail", u: [3, L - 36], y: D + 5.3, hw: 5.4, h: 1 },
      { k: "canopy", u: [40, 70], hw: 4.6, y: D + 7, h: 0.4, mat: "accent", posts: "white", name: "sun awning" },
      ...[1, -1].map((sd): Item => ({ k: "rail", u: [4, L - 9], y: D - 0.1 + 2.7, hw: 5.3, h: 1, name: sd > 0 ? "promenade rail" : "promenade rail port" })).slice(1),
      ...[48, 54, 60, 66].flatMap((u): Item[] => [-2.6, 2.6].map((z): Item => ({ k: "box", u: [u - 0.9, u + 0.9], z: [z - 0.4, z + 0.4], y: [D + 5.3, D + 5.6], mat: "white", name: "sun lounger" }))),
      { k: "box", u: [76, 86], z: [-2.4, 2.4], y: [D + 5.3, D + 5.8], mat: "blue", name: "pool" },
      { k: "cyl", u: L - 17, z: 0, y: [D + 7.6, D + 9.4], r: 0.08, mat: "white", name: "radar mast" },
      ...passengerFittings({ L, B: 11.45, D, T: 1.6, fender: 0.2 }),
    ]),
  };
}

// ---------------------------------------------------------------------------
// the colourful river boats

export const AMAZON_PARAMS: readonly ParamSpec[] = [/* @__PURE__ */ colourParam(["blue", "Blue"], ["green", "Green"], ["red", "Red"], ["yellow", "Yellow"])];
const BAND: Record<string, string> = { blue: "#2a6fae", green: "#2f7a4b", red: "#b02a22", yellow: "#e8bf2a" };
export function amazonSpec(p?: ParamValues): ShipSpec {
  const L = 30;
  const D = 2.2;
  const band = BAND[pick(AMAZON_PARAMS, p, "colour")]!;
  return {
    kind: "passenger",
    hull: { fine: true, length: L, beam: 7, depth: D, draft: 1.8, bow: "raked", stern: "transom", section: "round", entry: 0.3, run: 0.18, transom: 0.8, rake: 0.06, sheer: [0.3, 1.2], boot: 0.15, stripe: 0.4, screws: 1 },
    livery: { hull: "#f2f0ea", stripe: band, bottom: "#8f2a22", boot: "#1d2024", deck: "#8a5a33", house: "#f2f0ea", roof: band, band, red: "#c23128", yellow: "#e8bf2a" },
    items: detailed([
      // three open decks under their roofs, posts and rails, hammocks slung across
      ...[0, 1, 2].flatMap((k): Item[] => {
        const y = D + k * 2.5;
        const u0 = 2 + k * 1;
        const u1 = L - 5 - k * 2;
        return [
          { k: "box", u: [u0, u1], z: [-3.3, 3.3], y: [y + 2.3, y + 2.5], mat: k === 2 ? "band" : "house", name: `deck ${k + 1} roof` },
          ...[u0 + 0.2, (u0 + u1) / 2, u1 - 0.2].flatMap((u): Item[] => [1, -1].map((sd): Item => ({ k: "box", u: [u - 0.08, u + 0.08], z: [sd * 3.2 - 0.08, sd * 3.2 + 0.08], y: [y + 0.02, y + 2.3], mat: "white", name: `deck ${k + 1} post ${Math.round(u)} ${sd > 0 ? "s" : "p"}` }))),
          { k: "rail", u: [u0 + 0.3, u1 - 0.3], y, hw: 3.25, h: 0.9, mat: "band", name: `deck ${k + 1} rail` },
          ...[0, 1, 2, 3].map((i): Item => ({ k: "box", u: [u0 + 2 + i * 3.6, u0 + 2.6 + i * 3.6], z: [-2.6, 2.6], y: [y + 1.2, y + 1.35], mat: i % 2 ? "red" : "yellow", name: `deck ${k + 1} hammock ${i + 1}` })),
        ];
      }),
      { k: "tier", u: [L - 6.5, L - 4], y: [D + 5, D + 7.2], hw: 1.6, front: { y: 0.8, h: 0.8, w: 0.8, n: 3 }, name: "wheelhouse" },
      { k: "cyl", u: L - 5, z: 0, y: [D + 7.2, D + 8.6], r: 0.06, mat: "white", name: "mast" },
      ...[1, -1].map((sd): Item => ({ k: "cyl", u: L - 3, z: sd * 3.3, y: [D + 0.8, D + 1.4], r: 0.26, n: 8, mat: "orange", name: "lifebuoy" })),
      { k: "boats", at: [3.2], z: 0, y: D + 7.6, len: 4, r: 0.6, mat: "band", name: "canoe on the roof" },
      ...[10, 14, 18].map((u): Item => ({ k: "box", u: [u - 0.5, u + 0.5], z: [-1.2, 1.2], y: [D, D + 0.7], mat: "wood", name: "cargo crates" })),
      ...passengerFittings({ L, B: 7, D, T: 1.8, fender: 0.2 }),
    ]),
  };
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names (jsModel.ts imports a design's builders by name)

export function shipStatenIsland(): MeshBuilder { return worldShip(statenIslandSpec()); }
export function shipStatenIslandLod(): MeshBuilder { return shipLod(statenIslandSpec()); }
export function shipStarFerry(): MeshBuilder { return worldShip(starFerrySpec()); }
export function shipStarFerryLod(): MeshBuilder { return shipLod(starFerrySpec()); }
export function shipBcSpirit(): MeshBuilder { return worldShip(bcSpiritSpec()); }
export function shipBcSpiritLod(): MeshBuilder { return shipLod(bcSpiritSpec()); }
export function shipWsfJumbo(): MeshBuilder { return worldShip(wsfJumboSpec()); }
export function shipWsfJumboLod(): MeshBuilder { return shipLod(wsfJumboSpec()); }
export function shipSydneyFirstFleet(): MeshBuilder { return worldShip(sydneyFirstFleetSpec()); }
export function shipSydneyFirstFleetLod(): MeshBuilder { return shipLod(sydneyFirstFleetSpec()); }
export function shipManlyFreshwater(): MeshBuilder { return worldShip(manlyFreshwaterSpec()); }
export function shipManlyFreshwaterLod(): MeshBuilder { return shipLod(manlyFreshwaterSpec()); }
export function shipBosphorus(): MeshBuilder { return worldShip(bosphorusSpec()); }
export function shipBosphorusLod(): MeshBuilder { return shipLod(bosphorusSpec()); }
export function shipVaporetto(): MeshBuilder { return worldShip(vaporettoSpec()); }
export function shipVaporettoLod(): MeshBuilder { return shipLod(vaporettoSpec()); }
export function shipIjveer(): MeshBuilder { return worldShip(ijveerSpec()); }
export function shipIjveerLod(): MeshBuilder { return shipLod(ijveerSpec()); }
export function shipStenaHss(): MeshBuilder { return worldShip(stenaHssSpec()); }
export function shipStenaHssLod(): MeshBuilder { return shipLod(stenaHssSpec()); }
export function shipIncat(p?: ParamValues): MeshBuilder { return worldShip(incatSpec(p)); }
export function shipIncatLod(p?: ParamValues): MeshBuilder { return shipLod(incatSpec(p)); }
export function shipChannelRopax(p?: ParamValues): MeshBuilder { return worldShip(channelRopaxSpec(p)); }
export function shipChannelRopaxLod(p?: ParamValues): MeshBuilder { return shipLod(channelRopaxSpec(p)); }
export function shipMegastar(): MeshBuilder { return worldShip(megastarSpec()); }
export function shipMegastarLod(): MeshBuilder { return shipLod(megastarSpec()); }
export function shipJpOvernight(): MeshBuilder { return worldShip(jpOvernightSpec()); }
export function shipJpOvernightLod(): MeshBuilder { return shipLod(jpOvernightSpec()); }
export function shipSrn4(): MeshBuilder { return worldShip(srn4Spec()); }
export function shipSrn4Lod(): MeshBuilder { return shipLod(srn4Spec()); }
export function shipRaketa(): MeshBuilder { return worldShip(raketaSpec()); }
export function shipRaketaLod(): MeshBuilder { return shipLod(raketaSpec()); }
export function shipJetfoil(p?: ParamValues): MeshBuilder { return worldShip(jetfoilSpec(p)); }
export function shipJetfoilLod(p?: ParamValues): MeshBuilder { return shipLod(jetfoilSpec(p)); }
export function shipSwissPaddle(): MeshBuilder { return worldShip(swissPaddleSpec()); }
export function shipSwissPaddleLod(): MeshBuilder { return shipLod(swissPaddleSpec()); }
export function shipSternwheeler(): MeshBuilder { return worldShip(sternwheelerSpec()); }
export function shipSternwheelerLod(): MeshBuilder { return shipLod(sternwheelerSpec()); }
export function shipElbePaddle(): MeshBuilder { return worldShip(elbePaddleSpec()); }
export function shipElbePaddleLod(): MeshBuilder { return shipLod(elbePaddleSpec()); }
export function shipBateauMouche(): MeshBuilder { return worldShip(bateauMoucheSpec()); }
export function shipBateauMoucheLod(): MeshBuilder { return shipLod(bateauMoucheSpec()); }
export function shipNileCruiser(): MeshBuilder { return worldShip(nileCruiserSpec()); }
export function shipNileCruiserLod(): MeshBuilder { return shipLod(nileCruiserSpec()); }
export function shipAmazon(p?: ParamValues): MeshBuilder { return worldShip(amazonSpec(p)); }
export function shipAmazonLod(p?: ParamValues): MeshBuilder { return shipLod(amazonSpec(p)); }
export function shipHurtigruten(): MeshBuilder { return worldShip(hurtigrutenSpec()); }
export function shipHurtigrutenLod(): MeshBuilder { return shipLod(hurtigrutenSpec()); }
export function shipOasis(): MeshBuilder { return worldShip(oasisSpec()); }
export function shipOasisLod(): MeshBuilder { return shipLod(oasisSpec()); }
export function shipIcon(): MeshBuilder { return worldShip(iconSpec()); }
export function shipIconLod(): MeshBuilder { return shipLod(iconSpec()); }
export function shipQueenMary2(): MeshBuilder { return worldShip(queenMary2Spec()); }
export function shipQueenMary2Lod(): MeshBuilder { return shipLod(queenMary2Spec()); }
export function shipOlympic(): MeshBuilder { return worldShip(olympicSpec()); }
export function shipOlympicLod(): MeshBuilder { return shipLod(olympicSpec()); }
export function shipUnitedStates(): MeshBuilder { return worldShip(unitedStatesSpec()); }
export function shipUnitedStatesLod(): MeshBuilder { return shipLod(unitedStatesSpec()); }
export function shipNormandie(): MeshBuilder { return worldShip(normandieSpec()); }
export function shipNormandieLod(): MeshBuilder { return shipLod(normandieSpec()); }
export function shipExpedition(): MeshBuilder { return worldShip(expeditionSpec()); }
export function shipExpeditionLod(): MeshBuilder { return shipLod(expeditionSpec()); }
export function shipRiverCruise(p?: ParamValues): MeshBuilder { return worldShip(riverCruiseSpec(p)); }
export function shipRiverCruiseLod(p?: ParamValues): MeshBuilder { return shipLod(riverCruiseSpec(p)); }

// ---------------------------------------------------------------------------
// the designs, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md)

export const PASSENGER_SHIP_SPECS: readonly WorldShip[] = [
  { id: "veh-ship-staten-island", title: "Staten Island Ferry", spec: statenIslandSpec, build: shipStatenIsland, buildLod: shipStatenIslandLod, game: { weight: 3_300, power: 6_000, maxspeed: 30 }, references: "ship-staten-island" },
  { id: "veh-ship-star-ferry", title: "Star Ferry", spec: starFerrySpec, build: shipStarFerry, buildLod: shipStarFerryLod, game: { weight: 250, power: 400, maxspeed: 17 }, references: "ship-star-ferry" },
  { id: "veh-ship-bc-spirit", title: "BC Ferries Spirit Class", spec: bcSpiritSpec, build: shipBcSpirit, buildLod: shipBcSpiritLod, game: { weight: 18_000, power: 15_800, maxspeed: 36 }, references: "ship-bc-spirit" },
  { id: "veh-ship-wsf-jumbo", title: "Washington Jumbo Mark II", spec: wsfJumboSpec, build: shipWsfJumbo, buildLod: shipWsfJumboLod, game: { weight: 6_200, power: 11_000, maxspeed: 33 }, references: "ship-wsf-jumbo" },
  { id: "veh-ship-sydney-first-fleet", title: "Sydney First Fleet Ferry", spec: sydneyFirstFleetSpec, build: shipSydneyFirstFleet, buildLod: shipSydneyFirstFleetLod, game: { weight: 110, power: 550, maxspeed: 19 }, references: "ship-sydney-first-fleet" },
  { id: "veh-ship-manly-freshwater", title: "Manly Freshwater Class", spec: manlyFreshwaterSpec, build: shipManlyFreshwater, buildLod: shipManlyFreshwaterLod, game: { weight: 1_150, power: 2_400, maxspeed: 28 }, references: "ship-manly-freshwater" },
  { id: "veh-ship-bosphorus-vapur", title: "Bosphorus Ferry", spec: bosphorusSpec, build: shipBosphorus, buildLod: shipBosphorusLod, game: { weight: 1_000, power: 1_500, maxspeed: 26 }, references: "ship-bosphorus-vapur" },
  { id: "veh-ship-vaporetto", title: "Venice Vaporetto", spec: vaporettoSpec, build: shipVaporetto, buildLod: shipVaporettoLod, game: { weight: 60, power: 250, maxspeed: 20 }, references: "ship-vaporetto" },
  { id: "veh-ship-amsterdam-ijveer", title: "Amsterdam IJ Ferry", spec: ijveerSpec, build: shipIjveer, buildLod: shipIjveerLod, game: { weight: 300, power: 600, maxspeed: 15 }, references: "ship-amsterdam-ijveer" },
  { id: "veh-ship-stena-hss", title: "Stena HSS 1500", spec: stenaHssSpec, build: shipStenaHss, buildLod: shipStenaHssLod, game: { weight: 4_500, power: 68_000, maxspeed: 74 }, references: "ship-stena-hss" },
  { id: "veh-ship-incat", title: "Incat Wave-Piercer", spec: incatSpec, build: shipIncat, buildLod: shipIncatLod, params: INCAT_PARAMS, finishParams: ["livery"], game: { weight: 1_700, power: 28_800, maxspeed: 74 }, references: "ship-incat" },
  { id: "veh-ship-channel-ropax", title: "Channel Ro-Pax Ferry", spec: channelRopaxSpec, build: shipChannelRopax, buildLod: shipChannelRopaxLod, params: ROPAX_PARAMS, finishParams: ["livery"], game: { weight: 25_000, power: 30_400, maxspeed: 41 }, references: "ship-channel-ropax" },
  { id: "veh-ship-tallink-megastar", title: "Tallink Megastar", spec: megastarSpec, build: shipMegastar, buildLod: shipMegastarLod, game: { weight: 22_000, power: 45_600, maxspeed: 50 }, references: "ship-tallink-megastar" },
  { id: "veh-ship-jp-overnight-ferry", title: "Japanese Overnight Ferry", spec: jpOvernightSpec, build: shipJpOvernight, buildLod: shipJpOvernightLod, game: { weight: 20_000, power: 26_000, maxspeed: 43 }, references: "ship-jp-overnight-ferry" },
  { id: "veh-ship-srn4", title: "SR.N4 Hovercraft", spec: srn4Spec, build: shipSrn4, buildLod: shipSrn4Lod, game: { weight: 320, power: 11_400, maxspeed: 120 }, references: "ship-srn4" },
  { id: "veh-ship-raketa", title: "Raketa Hydrofoil", spec: raketaSpec, build: shipRaketa, buildLod: shipRaketaLod, game: { weight: 25, power: 800, maxspeed: 60 }, references: "ship-raketa" },
  { id: "veh-ship-jetfoil", title: "Boeing Jetfoil", spec: jetfoilSpec, build: shipJetfoil, buildLod: shipJetfoilLod, params: JETFOIL_PARAMS, finishParams: ["livery"], game: { weight: 115, power: 5_600, maxspeed: 83 }, references: "ship-jetfoil" },
  { id: "veh-ship-swiss-paddle", title: "Swiss Lake Paddle Steamer", spec: swissPaddleSpec, build: shipSwissPaddle, buildLod: shipSwissPaddleLod, game: { weight: 400, power: 900, maxspeed: 30 }, references: "ship-swiss-paddle" },
  { id: "veh-ship-sternwheeler", title: "Mississippi Sternwheeler", spec: sternwheelerSpec, build: shipSternwheeler, buildLod: shipSternwheelerLod, game: { weight: 3_000, power: 1_500, maxspeed: 18 }, references: "ship-sternwheeler" },
  { id: "veh-ship-elbe-paddle", title: "Elbe Paddle Steamer", spec: elbePaddleSpec, build: shipElbePaddle, buildLod: shipElbePaddleLod, game: { weight: 230, power: 300, maxspeed: 20 }, references: "ship-elbe-paddle" },
  { id: "veh-ship-bateau-mouche", title: "Bateau-Mouche", spec: bateauMoucheSpec, build: shipBateauMouche, buildLod: shipBateauMoucheLod, game: { weight: 300, power: 400, maxspeed: 15 }, references: "ship-bateau-mouche" },
  { id: "veh-ship-nile-cruiser", title: "Nile Cruise Boat", spec: nileCruiserSpec, build: shipNileCruiser, buildLod: shipNileCruiserLod, game: { weight: 1_200, power: 1_200, maxspeed: 22 }, references: "ship-nile-cruiser" },
  { id: "veh-ship-amazon-riverboat", title: "Amazon Riverboat", spec: amazonSpec, build: shipAmazon, buildLod: shipAmazonLod, params: AMAZON_PARAMS, finishParams: ["colour"], game: { weight: 200, power: 400, maxspeed: 20 }, references: "ship-amazon-riverboat" },
  { id: "veh-ship-hurtigruten", title: "Hurtigruten Coastal Ship", spec: hurtigrutenSpec, build: shipHurtigruten, buildLod: shipHurtigrutenLod, game: { weight: 6_500, power: 9_000, maxspeed: 33 }, references: "ship-hurtigruten" },
  { id: "veh-ship-oasis", title: "Oasis Class Cruise Ship", spec: oasisSpec, build: shipOasis, buildLod: shipOasisLod, game: { weight: 100_000, power: 97_000, maxspeed: 42 }, references: "ship-oasis" },
  { id: "veh-ship-icon", title: "Icon Class Cruise Ship", spec: iconSpec, build: shipIcon, buildLod: shipIconLod, game: { weight: 110_000, power: 67_500, maxspeed: 41 }, references: "ship-icon" },
  { id: "veh-ship-queen-mary-2", title: "Queen Mary 2", spec: queenMary2Spec, build: shipQueenMary2, buildLod: shipQueenMary2Lod, game: { weight: 76_000, power: 117_000, maxspeed: 56 }, references: "ship-queen-mary-2" },
  { id: "veh-ship-olympic", title: "Olympic Class Ocean Liner", spec: olympicSpec, build: shipOlympic, buildLod: shipOlympicLod, game: { weight: 52_067, power: 38_000, maxspeed: 43 }, references: "ship-olympic" },
  { id: "veh-ship-ss-united-states", title: "SS United States", spec: unitedStatesSpec, build: shipUnitedStates, buildLod: shipUnitedStatesLod, game: { weight: 45_400, power: 180_000, maxspeed: 64 }, references: "ship-ss-united-states" },
  { id: "veh-ship-normandie", title: "SS Normandie", spec: normandieSpec, build: shipNormandie, buildLod: shipNormandieLod, game: { weight: 68_500, power: 120_000, maxspeed: 59 }, references: "ship-normandie" },
  { id: "veh-ship-expedition-cruise", title: "Expedition Cruise Ship", spec: expeditionSpec, build: shipExpedition, buildLod: shipExpeditionLod, game: { weight: 12_000, power: 20_000, maxspeed: 28 }, references: "ship-expedition-cruise" },
  { id: "veh-ship-river-cruise", title: "Rhine River Cruise Ship", spec: riverCruiseSpec, build: shipRiverCruise, buildLod: shipRiverCruiseLod, params: RIVER_CRUISE_PARAMS, finishParams: ["livery"], game: { weight: 1_700, power: 2_000, maxspeed: 22 }, references: "ship-river-cruise" },
];

export const PASSENGER_SHIPS = /* @__PURE__ */ shipDesigns(PASSENGER_SHIP_SPECS);
