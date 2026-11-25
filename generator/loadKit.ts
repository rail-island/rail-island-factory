// The load kit (docs/models/loads.md): what a freight vehicle carries, drawn as
// hidden parts named `load-<commodity>` (loadPart.ts), one per look, each
// pivoted on the bed it rests on so the game can scale it in y with the fill.
// A design draws every look it can show; the game shows the one whose
// commodities hold what the vehicle carries. The looks share one palette: a
// material per commodity look, so coal is the same black on every wagon.

import type { MaterialSpec } from "./meshCore.ts";
import type { MeshCore, Vec3 } from "./meshCore.ts";
import type { LodPart } from "./lodKit.ts";
import { loadPart } from "./loadPart.ts";

export { loadPart } from "./loadPart.ts";

/** The commodity ids a load part may stand for (the supply chain's; stored in saved maps). */
export const LOAD_COMMODITIES = ["grain", "wood", "coal", "iron-ore", "oil", "food", "steel", "fuel", "goods", "mail"] as const;

/** Whether a part is a load part, by its name (`load-` is reserved). */
export const isLoadName = (name: string): boolean => name.startsWith("load-");

/** The shared materials of the load looks; a design adds them to its palette. */
export const LOAD_PALETTE: Record<string, MaterialSpec> = {
  loadCoal: { color: "#1d1c20", roughness: 0.95 },
  loadIronOre: { color: "#7b3a22", roughness: 0.95 },
  loadGrain: { color: "#d2a540", roughness: 0.95 },
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
};

/** The container colours a goods load cycles through. */
export const LOAD_BOXES = ["loadBoxRed", "loadBoxBlue", "loadBoxGreen", "loadBoxOrange", "loadBoxGrey"] as const;

/** A bulk load look: the commodities it stands for and its material. */
export interface BulkLook {
  commodities: readonly string[];
  mat: string;
}

/** The bulk looks of an open wagon, a hopper or a tipper: a heap each of coal, iron ore and grain. */
export const BULK_LOOKS: readonly BulkLook[] = [
  { commodities: ["coal"], mat: "loadCoal" },
  { commodities: ["iron-ore"], mat: "loadIronOre" },
  { commodities: ["grain"], mat: "loadGrain" },
];

/** The commodities of a flat wagon or a flatbed's loads. */
export const FLAT_COMMODITIES = ["steel", "wood", "goods"] as const;

/** What a container stack stands for. */
export const CONTAINER_COMMODITIES = ["goods", "food"] as const;

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
