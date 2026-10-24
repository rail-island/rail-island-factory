// Party walls (docs/models/game-properties.md, "City variants"): the sides of a
// building a neighbour stands against. A city that stands buildings wall to wall
// (a `touching` block, generator/sets/blockType.ts) tells each one which of its
// sides are covered; a design that supports it has a `party<Side>` parameter per
// side and draws that side as a blank wall -- no windows, no trim or roof
// overhang reaching into the neighbour. Front is +Z (the street), right is +X.
//
// The parameters change no extent (a blank side's slab reaches as far as the
// windowed variant does), so the game's city sizes a lot without them, and the
// tests vary them one at a time (design.ts coverageCombinations).
//
// No node: imports.

import type { ParamSpec, ParamValues } from "./design.ts";

// The names and the blank value the city fill sets (sets/blockType.ts: partyParam,
// PARTY_BLANK), repeated here so a model's bundle does not carry the set module;
// test/partyWalls.test.ts holds the two together.
export const PARTY_BLANK = "yes";
export function partyParam(side: "front" | "back" | "left" | "right"): string {
  return `party${side[0]!.toUpperCase()}${side.slice(1)}`;
}

export type PartySide = "back" | "left" | "right";

const TITLES: Record<PartySide, string> = { back: "Back party wall", left: "Left party wall", right: "Right party wall" };

/** The party-wall parameters of the given sides: windows by default, or a blank wall. */
export function partyParams(sides: readonly PartySide[]): ParamSpec[] {
  return sides.map((side) => ({
    name: partyParam(side),
    title: TITLES[side],
    default: "no",
    values: [{ value: "no", title: "Windows" }, { value: PARTY_BLANK, title: "Blank wall" }],
  }));
}

/** Which sides of a resolved selection are blank. */
export interface Blank {
  back: boolean;
  left: boolean;
  right: boolean;
}

export function blankSides(p: ParamValues): Blank {
  return {
    back: p[partyParam("back")] === PARTY_BLANK,
    left: p[partyParam("left")] === PARTY_BLANK,
    right: p[partyParam("right")] === PARTY_BLANK,
  };
}

/** How far a band, cornice or plinth stops inside a blank side's wall plane, hidden behind the party wall. */
export const BLANK_INSET = 0.02;

/**
 * A box round a `w` x `d` plan grown by `grow` on every side but the blank ones,
 * where it stops just inside the wall: `[cx, cz, sx, sz]` for MeshBuilder.box. The
 * front always grows. The inset grows with `grow` (BLANK_INSET plus a tenth of it),
 * so two parts that overhang by different amounts never end on one plane.
 */
export function grownPlan(w: number, d: number, grow: number, blank: Blank): [number, number, number, number] {
  const inset = BLANK_INSET + grow / 10;
  const x0 = -w / 2 - (blank.left ? -inset : grow), x1 = w / 2 + (blank.right ? -inset : grow);
  const z0 = -d / 2 - (blank.back ? -inset : grow), z1 = d / 2 + grow;
  return [(x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0];
}

/** Whether a face of the plan is blank: axis x sign -1 is the left, +1 the right; axis z sign -1 the back. */
export function faceBlank(blank: Blank, axis: "x" | "z", sign: number): boolean {
  return axis === "x" ? (sign < 0 ? blank.left : blank.right) : sign < 0 && blank.back;
}

/** Whether a selection draws any side blank. */
export function anyBlank(blank: Blank): boolean {
  return blank.back || blank.left || blank.right;
}

/** The same selection with every side windowed: the variant whose extent a blank one keeps. */
export function windowed(p: ParamValues): ParamValues {
  const out = { ...p };
  for (const side of ["back", "left", "right"] as const) if (partyParam(side) in out) out[partyParam(side)] = "no";
  return out;
}

/**
 * The party walls themselves: on each blank side a solid slab of `mat` from the
 * wall plane (a `w` x `d` plan about the origin, `h` high) out to where the
 * windowed variant's extent ends (`ref`, its positions). A party wall therefore
 * keeps the model's extent -- the game centres a building on it and stands the
 * next one against it -- and two neighbours meet slab to slab, wall to wall.
 */
export function partySlabs(m: { box(mat: string, cx: number, cz: number, w: number, d: number, y0: number, y1: number): void }, ref: ArrayLike<number>, blank: Blank, w: number, d: number, h: number, mat: string): void {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity;
  for (let i = 0; i < ref.length; i += 3) {
    minX = Math.min(minX, ref[i]!);
    maxX = Math.max(maxX, ref[i]!);
    minZ = Math.min(minZ, ref[i + 2]!);
  }
  const slab = (x0: number, x1: number, z0: number, z1: number): void => {
    if (x1 - x0 > 1e-6 && z1 - z0 > 1e-6) m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0, h);
  };
  if (blank.left) slab(minX, -w / 2, -d / 2, d / 2);
  if (blank.right) slab(w / 2, maxX, -d / 2, d / 2);
  if (blank.back) slab(blank.left ? minX : -w / 2, blank.right ? maxX : w / 2, minZ, -d / 2);
}
