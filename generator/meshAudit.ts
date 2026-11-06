// Read-only questions about a built model that only the build and the tests ask
// (helipad.ts, test/trees.test.ts): kept out of the mesh builder on purpose, since
// every model's JS bundles that class, so a method there grows them all
// (test/catalogSweep.ts holds each model's JS under its GLB's size).

import type { MeshBuilder } from "./meshBuilder.ts";

/** The triangle corners a model drew in one material, x,y,z flat (a helipad's surface). */
export function materialPositions(m: MeshBuilder, mat: string): number[] {
  return [...(groupsOf(m).get(mat)?.pos ?? [])];
}

/** Whether any triangle of the model carries a corner colour (`triShaded`). */
export function hasVertexColors(m: MeshBuilder): boolean {
  for (const g of groupsOf(m).values()) if (g.col) return true;
  return false;
}

const groupsOf = (m: MeshBuilder): Map<string, { pos: number[]; col?: number[] }> =>
  (m as unknown as { groups: Map<string, { pos: number[]; col?: number[] }> }).groups;
