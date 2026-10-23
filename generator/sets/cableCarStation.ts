// The cable car station types (docs/models/sets.md). A type is a footprint, a
// rope-head height and the shed prop drawn round the head (generator/props/
// cableCarSheds.ts, an ordinary factory model); the game places the shed, builds
// the shared head and the boarding platform, and solves the rope. This module also
// carries the PYLON: a sized part, built for whatever height the game's rope solver
// stands it at.
//
// Pure data, no imports: bundled into export/sets/cableCarStation.js for the game.

export type CableCarMaterial = "steel" | "timber" | "glass" | "concrete" | "stone" | "deck" | "rope" | "wheel";
export type Rgb = [number, number, number];

/** One box in a pylon's frame: x across the line, z along it, y up from the anchor. */
export interface PylonBox {
  x: number; y: number; z: number;
  sx: number; sy: number; sz: number;
  color: Rgb;
  material: CableCarMaterial;
}

/** Per type: the footprint and rope-head height a station is placed with, and its shed prop. */
export const TYPE_META: Record<string, { w: number; d: number; ropeHeadY: number; shed: { prop: string; values: Record<string, string> } }> = {
  open_gantry: { w: 14, d: 18, ropeHeadY: 16, shed: { prop: "proc-prop-cablecar-shed", values: { type: "gantry" } } },
  alpine_chalet: { w: 18, d: 24, ropeHeadY: 15, shed: { prop: "proc-prop-cablecar-shed", values: { type: "chalet" } } },
  glass_modern: { w: 18, d: 26, ropeHeadY: 17, shed: { prop: "proc-prop-cablecar-shed", values: { type: "glass" } } },
  concrete_drive: { w: 22, d: 30, ropeHeadY: 19, shed: { prop: "proc-prop-cablecar-shed", values: { type: "drive" } } },
};

const STEEL: Rgb = [120, 128, 136];
const CONCRETE: Rgb = [168, 165, 158];
const WHEEL: Rgb = [70, 74, 80];
/** How far a free-standing column reaches below its anchor, so sloping ground never shows a gap. */
export const COLUMN_SINK = 16;
/** Half the distance between the two rope strands. */
export const WHEEL_RADIUS = 5;

/**
 * A pylon `height` studs tall: a mast sunk into the ground (no footing pad -- a slab
 * on uneven ground reads as floating), a collar straddling grade, the cross-head
 * carrying both strands, and a sheave train and brace under each strand.
 */
export function buildPylon(height: number): PylonBox[] {
  const out: PylonBox[] = [];
  const push = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: Rgb, material: CableCarMaterial): void => {
    out.push({ x, y, z, sx, sy, sz, color, material });
  };
  push(0, (height - COLUMN_SINK) / 2, 0, 1.8, height + COLUMN_SINK, 1.8, STEEL, "steel");
  push(0, -0.5, 0, 2.6, 3.0, 2.6, CONCRETE, "concrete");
  push(0, height, 0, 2 * WHEEL_RADIUS + 3, 0.7, 1.4, STEEL, "steel");
  for (const sx of [-1, 1]) {
    push(sx * WHEEL_RADIUS, height - 0.5, 0, 1.4, 0.9, 3.4, WHEEL, "wheel");
    push(sx * WHEEL_RADIUS * 0.55, height - 1.6, 0, 0.5, 2.4, 0.5, STEEL, "steel");
  }
  return out;
}
