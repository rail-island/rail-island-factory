// A cable car cabin as the game measures it for a line (docs/models/cable-car-stations.md,
// "The view"): its size in studs off the built model, as the game's catalog recentres and
// scales it, its rope datums and the ropes the game draws for it. The station tests hold
// every station type to every catalog cabin through it, and the line preview
// (previews/cableCarLine.ts) hangs its cabins with it. No node: imports (a preview bundles it).

import type { ParamValues, ProceduralDesign, Ropeway } from "./design.ts";
import type { StationRope, StationView } from "./sets/cableCarStation.ts";

/** The game's studs per model unit (its VehicleCatalog's STUD_SCALE), before a design's own scale. */
export const STUD_SCALE = 1.5;

export interface CabinLine {
  /** The model's height, width and length along the rope, studs. */
  height: number;
  halfWidth: number;
  halfLength: number;
  /** Studs from the rope down to the underside and to the door sill. */
  drop: number;
  sillDrop: number;
  /** The ropes the game draws for it, studs (StationRope). */
  ropes: StationRope[];
  ropeway: Ropeway;
  /** Studs per model unit: STUD_SCALE times the design's scale. */
  k: number;
  /** The recentred model's bounding box in model units, after the catalog's yaw: what the game hangs. */
  box: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };
}

/** Measures a cable car cabin design (one with `ropeFrac`) for the game's line. */
export function cabinLine(design: ProceduralDesign, params?: ParamValues): CabinLine {
  const g = design.game;
  if (g?.ropeFrac === undefined || !g.ropes || !g.ropeway) throw new Error(`${design.id} is not a cable car cabin`);
  const pos = design.build(params).positions();
  const yaw = ((design.catalog?.yaw ?? 0) * Math.PI) / 180;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, z0: Infinity, z1: -Infinity };
  for (let i = 0; i + 2 < pos.length; i += 3) {
    // three.js's rotation about +Y: x' = x cos + z sin, z' = -x sin + z cos
    const x = pos[i]! * c + pos[i + 2]! * s, y = pos[i + 1]!, z = -pos[i]! * s + pos[i + 2]! * c;
    box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x);
    box.y0 = Math.min(box.y0, y); box.y1 = Math.max(box.y1, y);
    box.z0 = Math.min(box.z0, z); box.z1 = Math.max(box.z1, z);
  }
  const k = STUD_SCALE * (g.scale ?? 1);
  const height = (box.y1 - box.y0) * k;
  return {
    height,
    halfWidth: ((box.z1 - box.z0) / 2) * k,
    halfLength: ((box.x1 - box.x0) / 2) * k,
    drop: g.ropeFrac * height,
    sillDrop: (g.ropeFrac - (g.boardFrac ?? 0)) * height,
    ropes: g.ropes.map((r) => ({ kind: r.kind, z: r.zFrac * height, dy: r.dyFrac * height })),
    ropeway: g.ropeway,
    k,
    box,
  };
}

/** The view a station is drawn with for a line of this cabin. */
export function cabinView(line: CabinLine, circulating: boolean): StationView {
  return { circulating, sillDrop: line.sillDrop, halfWidth: line.halfWidth, drop: line.drop, halfLength: line.halfLength, ropes: line.ropes };
}
