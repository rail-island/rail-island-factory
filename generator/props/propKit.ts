// The fixed props the game places on its structures (docs/models/props.md): a port's
// crane and containers, an airport's control tower, the trackside signals.
// Each is drawn from the box vocabulary the game's structures speak -- a box at a
// centre with a size, optionally tilted about X or Z, or a gable prism -- so a prop
// lands in the game looking exactly as it did when the game drew it.
//
// A prop's material is named `<kind>#<rrggbb>`: the game's box material kind (steel,
// glass, light, ...) and the colour. The game reads the kind back off the name and
// gives the mesh the same material its own boxes get (a lamp glows, glass is see-
// through), so the factory's flat material is only what the site, the thumbnail and
// the GLB show.
//
// Props are in studs, the game's own units, and placed at scale 1.

import { MeshBuilder, type MaterialSpec } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";

export type Rgb = readonly [number, number, number];

/** The props a structure's far level keeps: the ones whose low detail is a silhouette worth drawing. */
export const FAR_PROPS: ReadonlySet<string> = new Set([
  "proc-prop-port-crane", "proc-prop-port-container", "proc-prop-port-hut", "proc-prop-airport-tower",
]);

/** One box of a prop, in the prop's own frame: +Y up, the origin where it stands. */
export interface PropBox {
  cx: number; cy: number; cz: number;
  sx: number; sy: number; sz: number;
  /** Tilt about X, then about Z (the game's Euler order XYZ with no Y). */
  rotX?: number;
  rotZ?: number;
  /** A triangular prism instead of a box: two gable faces along Z, the ridge at +Y. */
  profile?: "gable";
  color: Rgb;
  /** The game's box material kind: steel, glass, light, wood, roof, ... */
  material: string;
  /** Kept by the low level of detail (the game's structure LOD calls it the shell). */
  lod?: "shell";
}

const hex = (c: Rgb): string => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

/** The material name a box draws with: `<kind>#<rrggbb>`. */
export function propMaterial(kind: string, color: Rgb): string {
  return `${kind}${hex(color)}`;
}

const ROUGHNESS: Record<string, number> = { steel: 0.38, glass: 0.06, light: 0.4, roof: 0.9, wood: 0.9, tile: 0.9, brick: 0.9, timber: 0.9, stone: 0.9 };
const METALLIC: Record<string, number> = { steel: 0.5, glass: 0.1, wheel: 0.5 };

/** A palette with one material per kind and colour the boxes use. */
export function propPalette(boxes: readonly PropBox[]): Record<string, MaterialSpec> {
  const out: Record<string, MaterialSpec> = {};
  for (const b of boxes) {
    const name = propMaterial(b.material, b.color);
    out[name] ??= { color: hex(b.color), roughness: ROUGHNESS[b.material] ?? 0.6, metallic: METALLIC[b.material] ?? 0 };
  }
  return out;
}

/** The corners of a box (or the six of a gable prism), placed as the game places them. */
export function propBoxCorners(b: PropBox): Vec3[] {
  const x = b.sx / 2, y = b.sy / 2, z = b.sz / 2;
  const local: Vec3[] = b.profile === "gable"
    ? [[-x, -y, z], [x, -y, z], [0, y, z], [-x, -y, -z], [x, -y, -z], [0, y, -z]]
    : [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
  const cz = Math.cos(b.rotZ ?? 0), sz = Math.sin(b.rotZ ?? 0);
  const cx = Math.cos(b.rotX ?? 0), sx = Math.sin(b.rotX ?? 0);
  return local.map(([px, py, pz]) => {
    // Rz first, then Rx: three.js Euler(rotX, 0, rotZ) in its default XYZ order
    const x1 = px * cz - py * sz, y1 = px * sz + py * cz, z1 = pz;
    const y2 = y1 * cx - z1 * sx, z2 = y1 * sx + z1 * cx;
    return [b.cx + x1, b.cy + y2, b.cz + z2];
  });
}

/** Draws boxes into `m`, each in its own scope (`prefix-<n>`). */
export function drawPropBoxes(m: MeshBuilder, boxes: readonly PropBox[], prefix = "box"): void {
  boxes.forEach((b, i) => {
    const mat = propMaterial(b.material, b.color);
    const p = propBoxCorners(b);
    m.scope(`${prefix}-${i}`, () => {
      if (b.profile === "gable") {
        m.tri(mat, p[0]!, p[1]!, p[2]!);
        m.tri(mat, p[4]!, p[3]!, p[5]!);
        m.quad(mat, p[0]!, p[2]!, p[5]!, p[3]!);
        m.quad(mat, p[2]!, p[1]!, p[4]!, p[5]!);
        m.quad(mat, p[0]!, p[3]!, p[4]!, p[1]!);
        return;
      }
      m.quad(mat, p[0]!, p[3]!, p[2]!, p[1]!); // -Z
      m.quad(mat, p[4]!, p[5]!, p[6]!, p[7]!); // +Z
      m.quad(mat, p[0]!, p[4]!, p[7]!, p[3]!); // -X
      m.quad(mat, p[1]!, p[2]!, p[6]!, p[5]!); // +X
      m.quad(mat, p[3]!, p[7]!, p[6]!, p[2]!); // +Y
      // a bottom resting on (or sunk below) the ground or deck the prop stands on is never seen
      if (b.rotX || b.rotZ || b.cy - b.sy / 2 > 1e-6) m.quad(mat, p[0]!, p[1]!, p[5]!, p[4]!); // -Y
    });
  });
}

/**
 * The boxes with flush faces of different materials pulled apart: each material
 * (in order of first use) is inset 0.0137 studs more than the one before (a step no sum of
 * others lands on), a thin box proportionally less. For props whose source geometry let two
 * materials share a face, which flickers (coplanar.ts); the change is too small to
 * see.
 */
export function separateCoplanar(boxes: readonly PropBox[]): PropBox[] {
  const rank = new Map<string, number>();
  for (const b of boxes) {
    const name = propMaterial(b.material, b.color);
    if (!rank.has(name)) rank.set(name, rank.size);
  }
  return boxes.map((b) => {
    const r = rank.get(propMaterial(b.material, b.color))!;
    const shrink = (v: number): number => v - 2 * r * Math.min(0.0137, v * 0.004);
    return { ...b, sx: shrink(b.sx), sy: shrink(b.sy), sz: shrink(b.sz) };
  });
}

/** A prop's model: every box, or (`lod`) only the ones the low detail keeps. */
export function propModel(boxes: readonly PropBox[], lod = false): MeshBuilder {
  const drawn = lod ? boxes.filter((b) => b.lod === "shell") : boxes;
  const m = new MeshBuilder(propPalette(boxes));
  drawPropBoxes(m, drawn.length ? drawn : boxes.slice(0, 8));
  return m;
}
