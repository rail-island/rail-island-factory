// A building's helipad as the game reads it (docs/models/game-properties.md,
// "Helipads"): the design declares the material its touchdown surface is drawn in,
// the pad's class and the parameter selection that draws it (GameProperties.helipad);
// the export builds that selection and measures the pad on the model - the centre
// of the surface's top, its height and the side of the largest square on it - so
// the game never has to look for it, and a declared pad the model does not draw (or
// draws too small for its class) fails the build.

import type { HelipadClass, HelipadDecl, ParamValues, ProceduralDesign } from "./design.ts";
import { resolveParams } from "./design.ts";

/** A helipad as the meta entry carries it: the declaration and what the export measured. */
export interface ExportedHelipad {
  pad: HelipadClass;
  /** The parameter selection that draws it; absent: every build of the model has it. */
  when?: ParamValues;
  /** The touchdown surface's centre on its top, the model's own frame and units (before the catalog yaw and scale). */
  centre: [number, number, number];
  /** The side of the square touchdown surface (its smaller extent), model units. */
  size: number;
}

const r4 = (v: number): number => Math.round(v * 1e4) / 1e4 + 0;

/**
 * Measures the declared helipad of `design` on its build with `decl.when` (every
 * other parameter at its default): the triangles in `decl.material`. Throws when the
 * build draws none, or when the surface is not level (more than 2 % of its side
 * between its highest and lowest point).
 */
export function measureHelipad(design: ProceduralDesign, decl: HelipadDecl): ExportedHelipad {
  const values = resolveParams(design.params ?? [], decl.when ?? {});
  const m = design.build(values);
  const pos = m.materialPositions(decl.material);
  if (!pos.length) throw new Error(`${design.id}: helipad material "${decl.material}" is not drawn${decl.when ? ` with ${JSON.stringify(decl.when)}` : ""} (docs/models/game-properties.md)`);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k]!, pos[i + k]!);
      max[k] = Math.max(max[k]!, pos[i + k]!);
    }
  }
  const size = Math.min(max[0]! - min[0]!, max[2]! - min[2]!);
  // the top surface: the vertices within a centimetre of the highest
  if (max[1]! - min[1]! > Math.max(0.05, size * 0.02) && !topIsLevel(pos, max[1]!)) {
    throw new Error(`${design.id}: helipad material "${decl.material}" is not a level surface`);
  }
  return {
    pad: decl.pad,
    ...(decl.when ? { when: decl.when } : {}),
    centre: [r4((min[0]! + max[0]!) / 2), r4(max[1]!), r4((min[2]! + max[2]!) / 2)],
    size: r4(size),
  };
}

/** Whether the vertices at the top height span the surface: a slab whose sides drop below its top is level. */
function topIsLevel(pos: readonly number[], top: number): boolean {
  let n = 0;
  for (let i = 1; i < pos.length; i += 3) if (top - pos[i]! < 0.01) n++;
  return n >= 4;
}
