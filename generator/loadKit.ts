// The load kit (docs/models/loads.md): what a freight vehicle carries, drawn as
// hidden parts named `load-<commodity>` (loadPart.ts), one per look, each
// pivoted on the bed it rests on: the game scales a heap in y with the fill and
// shows a stepped load of discrete items step by step (`step-<i>` children).
// A design draws every look it can show; the game shows the one whose
// commodities hold what the vehicle carries. The looks share one palette: a
// material per commodity look, so coal is the same black on every wagon.

import type { MaterialSpec } from "./meshCore.ts";
import { rect, type MeshCore, type Vec3 } from "./meshCore.ts";
import type { LodPart } from "./lodKit.ts";
import { itemLoadPart, loadPart, type Step } from "./loadPart.ts";

export { itemLoadPart, itemSteps, loadPart, MAX_LOAD_STEPS, type Step } from "./loadPart.ts";

/** The commodity ids a load part may stand for (the supply chain's; stored in saved maps). */
export const LOAD_COMMODITIES = ["grain", "wood", "coal", "iron-ore", "stone", "sand", "oil", "goods", "steel", "lumber", "cement", "fuel", "mail"] as const;

/** Whether a part is a load part, by its name (`load-` is reserved). */
export const isLoadName = (name: string): boolean => name.startsWith("load-");

/** The shared materials of the load looks; a design adds them to its palette. */
export const LOAD_PALETTE: Record<string, MaterialSpec> = {
  loadCoal: { color: "#1d1c20", roughness: 0.95 },
  loadIronOre: { color: "#7b3a22", roughness: 0.95 },
  loadGrain: { color: "#d2a540", roughness: 0.95 },
  loadStone: { color: "#8d8a85", roughness: 0.95 },
  loadSand: { color: "#d8c08a", roughness: 0.95 },
  loadBark: { color: "#5a4330", roughness: 0.95 },
  loadBarkDark: { color: "#43301f", roughness: 0.95 },
  loadLogEnd: { color: "#c9a26a", roughness: 0.9 },
  loadSteel: { color: "#8b9298", metallic: 0.6, roughness: 0.45 },
  loadSteelDark: { color: "#4e5459", metallic: 0.5, roughness: 0.55 },
  loadBoxRed: { color: "#a6352c", roughness: 0.7 },
  loadBoxBlue: { color: "#2e5c8a", roughness: 0.7 },
  loadBoxGreen: { color: "#3e7748", roughness: 0.7 },
  loadBoxOrange: { color: "#cf7428", roughness: 0.7 },
  loadBoxGrey: { color: "#b8bdc2", roughness: 0.7 },
  loadDark: { color: "#2a2c2f", roughness: 0.8 },
  loadLumber: { color: "#d9b77c", roughness: 0.85 },
  loadLumberEnd: { color: "#efd9aa", roughness: 0.85 },
  loadLumberGap: { color: "#6b4f2e", roughness: 0.9 },
  loadStrap: { color: "#2f4f86", roughness: 0.6 },
  loadPallet: { color: "#a27f55", roughness: 0.9 },
  loadCement: { color: "#cfcdc6", roughness: 0.9 },
};

/** The container colours a goods load cycles through. */
export const LOAD_BOXES = ["loadBoxRed", "loadBoxBlue", "loadBoxGreen", "loadBoxOrange", "loadBoxGrey"] as const;

/** A bulk load look: the commodities it stands for and its material. */
export interface BulkLook {
  commodities: readonly string[];
  mat: string;
}

/** The bulk looks of an open wagon, a hopper or a tipper: a heap each of coal, iron ore, grain, stone and sand. */
export const BULK_LOOKS: readonly BulkLook[] = [
  { commodities: ["coal"], mat: "loadCoal" },
  { commodities: ["iron-ore"], mat: "loadIronOre" },
  { commodities: ["grain"], mat: "loadGrain" },
  { commodities: ["stone"], mat: "loadStone" },
  { commodities: ["sand"], mat: "loadSand" },
];

/** The commodities of a flat wagon or a flatbed's loads. */
export const FLAT_COMMODITIES = ["steel", "wood", "goods", "lumber", "cement"] as const;

/**
 * What a container stands for: anything boxed or bagged -- goods, steel, sawn
 * lumber, bagged cement -- and grain, which ships in lined boxes by rail and sea.
 */
export const CONTAINER_COMMODITIES = ["goods", "steel", "lumber", "cement", "grain"] as const;

/** What a ro-ro's road trailers stand for: a container's commodities but grain. */
export const TRAILER_COMMODITIES = ["goods", "steel", "lumber", "cement"] as const;

/**
 * Draws one heap per bulk look (`looks`, every bulk look by default), each in its
 * own load part pivoted at `floor`: `draw(mat)` draws the heap in that material.
 */
export function bulkLoads(m: MeshCore, floor: Vec3, draw: (mat: string) => void, looks: readonly BulkLook[] = BULK_LOOKS): void {
  for (const look of looks) loadPart(m, look.commodities, floor, () => draw(look.mat));
}

/**
 * A LOD part drawn as a hidden load part standing for `commodities`, pivoted on
 * the bed at height `floor` on the model's axis.
 */
export function loadLodPart(commodities: readonly string[], floor: number, part: LodPart): LodPart {
  return { ...part, draw: (m) => loadPart(m, commodities, [0, floor, 0], () => part.draw(m)) };
}

/** A planar quad wound so its face looks along `n`. */
export function orientedFace(m: MeshCore, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (f[0]! * n[0] + f[1]! * n[1] + f[2]! * n[2] >= 0) m.quad(mat, a, b, c, d);
  else m.quad(mat, a, d, c, b);
}

/** A bag: a box without its bottom whose sides lean in by `lean` to its top, so bags stacked on it show the groove between them. */
function bagBlock(m: MeshCore, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, lean = 0.03): void {
  m.loft(mat, rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2), y0, rect(x1 - x0 - 2 * lean, z1 - z0 - 2 * lean, (x0 + x1) / 2, (z0 + z1) / 2), y1);
}

/** A box without its bottom, in model coordinates (x0 < x1, z0 < z1). */
function crate(m: MeshCore, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1);
}

/** How a lumber bundle shows its planks: layers up, planks across, strap bands along it. */
export interface LumberOptions {
  layers?: number;
  planks?: number;
  straps?: number;
}

/**
 * A bundle of sawn planks lying along x over x0..x1 and z0..z1, from y0 to y1
 * (docs/models/loads.md): pale long faces with the layers' lines, the cut ends'
 * grid of plank ends, the planks' lines on top and strap bands around it. No
 * bottom: it rests on bearers or on another bundle's.
 */
export function lumberBundle(m: MeshCore, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, o: LumberOptions = {}): void {
  const layers = o.layers ?? Math.max(2, Math.round((y1 - y0) / 0.2));
  const planks = o.planks ?? Math.max(2, Math.round((z1 - z0) / 0.2));
  const straps = o.straps ?? (x1 - x0 > 3 ? 3 : 2);
  const g = 0.012; // a line's half width
  const e = 0.004; // the lines stand this far proud of the faces
  const s = 0.009; // the straps further
  const W = "loadLumber", E = "loadLumberEnd", L = "loadLumberGap";
  // the faces: the long sides and the top in sawn wood, the ends in pale cut grain
  orientedFace(m, W, [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0]);
  for (const [z, n] of [[z0, -1], [z1, 1]] as const) orientedFace(m, W, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, n]);
  for (const [x, n] of [[x0, -1], [x1, 1]] as const) orientedFace(m, E, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], [n, 0, 0]);
  // the layers' lines on the long sides and across the ends
  for (let i = 1; i < layers; i++) {
    const y = y0 + ((y1 - y0) * i) / layers;
    for (const [z, n] of [[z0 - e, -1], [z1 + e, 1]] as const) orientedFace(m, L, [x0, y - g, z], [x1, y - g, z], [x1, y + g, z], [x0, y + g, z], [0, 0, n]);
    for (const [x, n] of [[x0 - e, -1], [x1 + e, 1]] as const) orientedFace(m, L, [x, y - g, z0], [x, y - g, z1], [x, y + g, z1], [x, y + g, z0], [n, 0, 0]);
  }
  // the planks' lines on the ends and along the top
  for (let i = 1; i < planks; i++) {
    const z = z0 + ((z1 - z0) * i) / planks;
    for (const [x, n] of [[x0 - e, -1], [x1 + e, 1]] as const) orientedFace(m, L, [x, y0, z - g], [x, y0, z + g], [x, y1, z + g], [x, y1, z - g], [n, 0, 0]);
    orientedFace(m, L, [x0, y1 + e, z - g], [x1, y1 + e, z - g], [x1, y1 + e, z + g], [x0, y1 + e, z + g], [0, 1, 0]);
  }
  // the strap bands: over the top and down both sides
  for (let i = 0; i < straps; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / straps;
    const [a, b] = [x - 0.03, x + 0.03];
    orientedFace(m, "loadStrap", [a, y1 + s, z0 - s], [b, y1 + s, z0 - s], [b, y1 + s, z1 + s], [a, y1 + s, z1 + s], [0, 1, 0]);
    for (const [z, n] of [[z0 - s, -1], [z1 + s, 1]] as const) orientedFace(m, "loadStrap", [a, y0, z], [b, y0, z], [b, y1 + s, z], [a, y1 + s, z], [0, 0, n]);
  }
}

/** Bearers across a bed under a load: timbers over z0..z1 at the given x, from y0 to y1. */
export function bearers(m: MeshCore, xs: readonly number[], z0: number, z1: number, y0: number, y1: number, mat = "loadPallet"): void {
  for (const x of xs) crate(m, mat, x - 0.06, x + 0.06, y0, y1, z0, z1);
}

/** How many bundles a lumberLoad draws: its items, in fill order. */
export const lumberItems = (o: { rows: number; across: number; high: number }): number => o.rows * o.across * o.high;

/**
 * Stacks of lumber bundles on a bed (docs/models/loads.md): `rows` bundles along
 * x0..x1, `across` side by side over z0..z1, `high` stacked, each on two bearers
 * from the bed at y0; `h` a bundle's height. Returns the top of the load. With
 * `item` each bundle (its bearers with the first across) is an item of a stepped
 * load (itemLoadPart), the bottom layer first, along the bed, then across.
 */
export function lumberLoad(m: MeshCore, x0: number, x1: number, z0: number, z1: number, y0: number, o: { rows: number; across: number; high: number; h: number; gap?: number; item?: Step }): number {
  const gap = o.gap ?? 0.15;
  const bear = 0.1;
  const len = (x1 - x0 - gap * (o.rows - 1)) / o.rows;
  const wid = (z1 - z0 - 0.08 * (o.across - 1)) / o.across;
  const item = o.item ?? ((_: number, draw: () => void) => draw());
  let y = y0;
  for (let k = 0; k < o.high; k++) {
    for (let r = 0; r < o.rows; r++) {
      const a = x0 + r * (len + gap);
      for (let i = 0; i < o.across; i++) {
        const c = z0 + i * (wid + 0.08);
        // a slight stagger, so the stacks do not look stamped
        const d = ((r + i + k) % 3) * 0.04;
        item((k * o.rows + r) * o.across + i, () => {
          if (i === 0) bearers(m, [a + len * 0.2, a + len * 0.8], z0 + 0.04, z1 - 0.04, y, y + bear);
          lumberBundle(m, a + d, a + len - 0.08 + d, c, c + wid, y + bear, y + bear + o.h);
        });
      }
    }
    y += bear + o.h;
  }
  return y;
}

/**
 * A pallet of cement bags over x0..x1 and z0..z1 standing on the bed at y0
 * (docs/models/loads.md): the pallet's deck on three runners, then `tiers` of
 * light grey bags, two to a tier, laid crosswise in turn. Returns its top.
 */
export function cementPallet(m: MeshCore, x0: number, x1: number, z0: number, z1: number, y0: number, tiers = 8): number {
  const runner = 0.1, deck = 0.04, bag = 0.12, gap = 0.015;
  const rw = 0.1;
  for (const z of [z0, (z0 + z1) / 2 - rw / 2, z1 - rw]) crate(m, "loadPallet", x0 + 0.01, x1 - 0.01, y0, y0 + runner, z, z + rw);
  crate(m, "loadPallet", x0, x1, y0 + runner, y0 + runner + deck, z0, z1);
  let y = y0 + runner + deck;
  for (let t = 0; t < tiers; t++) {
    // the tiers step in and out a little, so their lines read from afar
    const i = t % 2 ? 0.03 : 0.01;
    const [a, b, c, d] = [x0 + i, x1 - i, z0 + i, z1 - i];
    if (t % 2) {
      const mid = (a + b) / 2;
      bagBlock(m, "loadCement", a, mid - gap / 2, y, y + bag, c, d);
      bagBlock(m, "loadCement", mid + gap / 2, b, y, y + bag, c, d);
    } else {
      const mid = (c + d) / 2;
      bagBlock(m, "loadCement", a, b, y, y + bag, c, mid - gap / 2);
      bagBlock(m, "loadCement", a, b, y, y + bag, mid + gap / 2, d);
    }
    y += bag;
  }
  return y;
}

/** How many pallets a cementLoad draws: its items, in fill order. */
export const cementItems = (o: { rows: number; across: number }): number => o.rows * o.across;

/**
 * Pallets of cement over a bed (docs/models/loads.md): `rows` along x0..x1,
 * `across` side by side over z0..z1, at y0. Returns the top of the load. With
 * `item` each pallet is an item of a stepped load (itemLoadPart), along the bed,
 * then across.
 */
export function cementLoad(m: MeshCore, x0: number, x1: number, z0: number, z1: number, y0: number, o: { rows: number; across: number; tiers?: number; item?: Step }): number {
  const gap = 0.1;
  const len = (x1 - x0 - gap * (o.rows - 1)) / o.rows;
  const wid = (z1 - z0 - gap * (o.across - 1)) / o.across;
  let top = y0;
  for (let r = 0; r < o.rows; r++)
    for (let i = 0; i < o.across; i++) {
      const a = x0 + r * (len + gap), c = z0 + i * (wid + gap);
      const draw = () => { top = Math.max(top, cementPallet(m, a, a + len, c, c + wid, y0, o.tiers)); };
      if (o.item) o.item(r * o.across + i, draw);
      else draw();
    }
  return top;
}

/**
 * Lumber bundles (lumberLoad) as their own stepped load part standing for lumber,
 * pivoted at `floor`: a bundle a step, the bottom layer first (more than 16
 * bundles share steps). Returns the top of the load.
 */
export function lumberLoadPart(m: MeshCore, floor: Vec3, x0: number, x1: number, z0: number, z1: number, y0: number, o: { rows: number; across: number; high: number; h: number; gap?: number }): number {
  return itemLoadPart(m, ["lumber"], floor, lumberItems(o), (item) => m.scope("lumber", () => lumberLoad(m, x0, x1, z0, z1, y0, { ...o, item })));
}

/**
 * Cement pallets (cementLoad) as their own stepped load part standing for cement,
 * pivoted at `floor`: a pallet a step (more than 16 share steps, a row across at a
 * time). Returns the top of the load.
 */
export function cementLoadPart(m: MeshCore, floor: Vec3, x0: number, x1: number, z0: number, z1: number, y0: number, o: { rows: number; across: number; tiers?: number }): number {
  return itemLoadPart(m, ["cement"], floor, cementItems(o), (item) => m.scope("cement", () => cementLoad(m, x0, x1, z0, z1, y0, { ...o, item })));
}
