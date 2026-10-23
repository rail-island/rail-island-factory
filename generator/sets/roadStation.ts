// The road station types (docs/models/sets.md): how a road station is dressed. The
// game solves where a station's stands, islands, access roads and mount points lie
// for a chosen layout and stand count, paves the islands and rails the footprint; a
// type decides everything stood on that solved layout -- bay posts, canopies, a
// terminal hall, floodlights, loading docks, container stacks and a gantry -- and
// which group (bus or truck) it serves and how wide its islands are.
//
// Frame: the station's local frame (x across the stands, z along them, origin at the
// footprint centre, y up from the pad).
//
// Pure data and functions, no imports: bundled into export/sets/roadStation.js.

type Rgb = [number, number, number];

export type DressMaterial = "column" | "sign" | "roof" | "bench" | "frame" | "glass" | "pavement";

/** One box: centre (x, z), bottom y above the pad, size along its own axes, yaw turning its Z axis. */
export interface DressBox {
  x: number; y: number; z: number;
  sx: number; sy: number; sz: number;
  yaw: number;
  material: DressMaterial;
  color: Rgb;
  /** Small furniture the game drops at distance. */
  detail?: boolean;
  /** A named photo set. */
  texture?: string;
}

/** One island of the solved layout: its centre, direction along the stand, width and length. */
export interface DressIsland { cx: number; cz: number; dirX: number; dirZ: number; width: number; length: number }

/** What the game solved and the heights it dresses to. */
export interface DressSite {
  islands: DressIsland[];
  /** How many stands; stand i is flanked on its left by island i. */
  stands: number;
  /** The two mount points: where the access roads leave, and the way out. */
  mps: { x: number; z: number; outX: number; outZ: number }[];
  layout: string;
  standLength: number;
  /** The islands' top above the pad. */
  islandTop: number;
  /** Nothing but the islands may stand lower than this over a driven lane. */
  clearance: number;
}

/** One type: the vehicles it serves and its islands' width. */
export interface RoadStationTypeData { group: "bus" | "truck"; island: number }

export const TYPE_META: Record<string, RoadStationTypeData> = {
  open_bays: { group: "bus", island: 4 },
  sawtooth_canopy: { group: "bus", island: 5 },
  terminal_hall: { group: "bus", island: 6 },
  gravel_yard: { group: "truck", island: 3 },
  loading_docks: { group: "truck", island: 6 },
  logistics_hub: { group: "truck", island: 5 },
};

const C = {
  concrete: [176, 174, 168] as Rgb,
  steel: [70, 76, 84] as Rgb,
  white: [225, 228, 230] as Rgb,
  roofDark: [55, 60, 66] as Rgb,
  roofRed: [150, 60, 45] as Rgb,
  glass: [175, 205, 225] as Rgb,
  sign: [40, 80, 200] as Rgb,
  yellow: [220, 180, 40] as Rgb,
  wood: [120, 85, 50] as Rgb,
  door: [200, 120, 40] as Rgb,
  container: [[190, 60, 50], [50, 100, 160], [60, 140, 80], [210, 160, 50]] as Rgb[],
};

/**
 * Everything a `type` station stands on its solved `site`: a bay number post at the
 * entry end of every stand, then the type's own dressing. A type this module does
 * not know is dressed with the posts alone; the game resolves an unknown stored type
 * to its default first.
 */
export function dress(type: string, site: DressSite): DressBox[] {
  const out: DressBox[] = [];
  const box = (b: Omit<DressBox, "yaw"> & { yaw?: number }): void => { out.push({ yaw: 0, ...b }); };
  const truck = TYPE_META[type]?.group === "truck";
  const islandTop = site.islandTop;
  // Points along an island: (along -1..1, across -1..1) -> local XZ.
  const at = (isl: DressIsland, along: number, across: number): { x: number; z: number } => ({
    x: isl.cx + isl.dirX * along * isl.length / 2 + isl.dirZ * across * isl.width / 2,
    z: isl.cz + isl.dirZ * along * isl.length / 2 - isl.dirX * across * isl.width / 2,
  });
  const yawOf = (isl: DressIsland): number => Math.atan2(isl.dirX, isl.dirZ);

  // Bay number posts at the entry end of every stand's left island (all types).
  for (let i = 0; i < site.stands; i++) {
    const isl = site.islands[i]!;
    const p = at(isl, -0.85, 0);
    box({ x: p.x, y: islandTop, z: p.z, sx: 0.2, sy: 3, sz: 0.2, material: "column", color: C.steel, detail: true });
    box({ x: p.x, y: islandTop + 3, z: p.z, sx: 1.2, sy: 1, sz: 0.12, yaw: yawOf(isl) + Math.PI / 2, material: "sign", color: truck ? C.yellow : C.sign, detail: true });
  }

  const roofOver = (h: number, color: Rgb, glazed: boolean): void => {
    // One roof over every stand and island, on columns standing on the islands.
    const first = site.islands[0]!;
    const last = site.islands[site.islands.length - 1]!;
    const yaw = yawOf(first);
    const cx = (first.cx + last.cx) / 2;
    const cz = (first.cz + last.cz) / 2;
    const span = Math.hypot(last.cx - first.cx, last.cz - first.cz) + first.width;
    box({ x: cx, y: islandTop + h, z: cz, sx: span, sy: 0.6, sz: site.standLength + 4, yaw, material: "roof", color });
    for (const isl of site.islands) {
      for (const along of [-0.8, 0, 0.8]) {
        const p = at(isl, along, 0);
        box({ x: p.x, y: islandTop, z: p.z, sx: 0.6, sy: h, sz: 0.6, yaw, material: "column", color: C.steel });
      }
    }
    if (glazed) {
      for (const isl of [first, last]) {
        const side = isl === first ? -1 : 1;
        const p = at(isl, 0, side * 0.9);
        box({ x: p.x, y: islandTop + 0.8, z: p.z, sx: 0.15, sy: h - 0.8, sz: isl.length, yaw, material: "glass", color: C.glass });
      }
    }
  };

  switch (type) {
    case "open_bays":
      for (const isl of site.islands) {
        const yaw = yawOf(isl);
        for (const along of [-0.3, 0.3]) {
          const p = at(isl, along, 0);
          const len = Math.min(6, isl.length * 0.25);
          box({ x: p.x, y: islandTop, z: p.z, sx: 0.25, sy: 3.4, sz: 0.25, yaw, material: "column", color: C.steel });
          box({ x: p.x, y: islandTop + 3.4, z: p.z, sx: isl.width - 0.6, sy: 0.25, sz: len, yaw, material: "roof", color: C.roofDark });
          box({ x: p.x, y: islandTop + 0.45, z: p.z, sx: 0.8, sy: 0.25, sz: len * 0.7, yaw, material: "bench", color: C.wood, detail: true, texture: "wood" });
        }
      }
      break;
    case "sawtooth_canopy":
      for (const isl of site.islands) {
        const yaw = yawOf(isl);
        // A folded canopy: alternate panels set a little higher, so the edge reads
        // as a sawtooth along the island.
        const panels = Math.max(2, Math.round(isl.length / 6));
        for (let k = 0; k < panels; k++) {
          const along = -1 + (2 * k + 1) / panels;
          const p = at(isl, along, 0);
          const lift = k % 2 === 0 ? 0 : 0.6;
          box({ x: p.x, y: islandTop + 4.2 + lift, z: p.z, sx: isl.width, sy: 0.3, sz: isl.length / panels + 0.05, yaw, material: "roof", color: C.white });
          box({ x: p.x, y: islandTop, z: p.z, sx: 0.35, sy: 4.2 + lift, sz: 0.35, yaw, material: "column", color: C.steel });
          box({ x: p.x, y: islandTop + 0.45, z: p.z, sx: 0.8, sy: 0.25, sz: isl.length / panels * 0.6, yaw, material: "bench", color: C.wood, detail: true, texture: "wood" });
        }
        const b = at(isl, 0.6, 0);
        box({ x: b.x, y: islandTop + 2.4, z: b.z, sx: 0.2, sy: 1.0, sz: 2.2, yaw, material: "sign", color: [30, 30, 34], detail: true });
      }
      break;
    case "terminal_hall": {
      roofOver(site.clearance + 0.5, C.roofDark, true);
      // Clock tower at the entry end of the first island, rising through the roof.
      const first = site.islands[0]!;
      const t = at(first, -0.9, 0);
      const yaw = yawOf(first);
      box({ x: t.x, y: islandTop, z: t.z, sx: 2.6, sy: 16, sz: 2.6, yaw, material: "frame", color: C.white, texture: "wall" });
      box({ x: t.x, y: islandTop + 13, z: t.z, sx: 2.8, sy: 2.2, sz: 2.8, yaw, material: "sign", color: C.white, detail: true });
      break;
    }
    case "gravel_yard": {
      // Floodlight masts on the outer islands, and a portacabin on the first.
      for (const isl of [site.islands[0]!, site.islands[site.islands.length - 1]!]) {
        for (const along of [-0.9, 0.9]) {
          const p = at(isl, along, 0);
          box({ x: p.x, y: islandTop, z: p.z, sx: 0.3, sy: 11, sz: 0.3, material: "column", color: C.steel });
          box({ x: p.x, y: islandTop + 11, z: p.z, sx: 1.4, sy: 0.4, sz: 0.6, yaw: yawOf(isl), material: "frame", color: C.white, detail: true });
        }
      }
      const first = site.islands[0]!;
      const c = at(first, 0, 0);
      box({ x: c.x, y: islandTop, z: c.z, sx: first.width - 0.4, sy: 2.6, sz: Math.min(6, first.length * 0.4), yaw: yawOf(first), material: "frame", color: [210, 200, 170] });
      break;
    }
    case "loading_docks":
      for (const isl of site.islands) {
        const yaw = yawOf(isl);
        // A raised dock down the island with a warehouse wall on its spine; roll-up
        // doors face the stand on each side (side-loading).
        const c = at(isl, 0, 0);
        box({ x: c.x, y: islandTop, z: c.z, sx: isl.width - 0.4, sy: 1.0, sz: isl.length, yaw, material: "pavement", color: C.concrete, texture: "concrete" });
        box({ x: c.x, y: islandTop + 1.0, z: c.z, sx: 0.8, sy: 6, sz: isl.length, yaw, material: "frame", color: C.white, texture: "wall" });
        box({ x: c.x, y: islandTop + 7.0, z: c.z, sx: isl.width - 0.2, sy: 0.3, sz: isl.length + 1, yaw, material: "roof", color: C.roofDark });
        const doors = Math.max(1, Math.floor(isl.length / 10));
        for (let k = 0; k < doors; k++) {
          const along = -1 + (2 * k + 1) / doors;
          for (const across of [-1, 1]) {
            const p = at(isl, along, across * (0.95 / isl.width));
            box({ x: p.x, y: islandTop + 1.2, z: p.z, sx: 0.12, sy: 3.6, sz: 3.2, yaw, material: "sign", color: C.door, detail: true });
          }
        }
      }
      break;
    case "logistics_hub": {
      roofOver(site.clearance + 0.5, C.white, false);
      // Container stacks on the outer islands.
      let k = 0;
      for (const isl of [site.islands[0]!, site.islands[site.islands.length - 1]!]) {
        for (const along of [-0.6, 0.0, 0.6]) {
          const p = at(isl, along, 0);
          box({ x: p.x, y: islandTop, z: p.z, sx: isl.width - 1, sy: 2.6, sz: 6, yaw: yawOf(isl), material: "frame", color: C.container[k++ % 4]! });
        }
      }
      // Entry gantry with the name board over the first MP's road, high above it.
      const mp = site.mps[0]!;
      // Right at the MP, legs far enough out to clear a slanted first stand too.
      const gx = mp.x;
      const span = 6.5;
      box({ x: gx, y: 0, z: mp.z - span, sx: 0.6, sy: site.clearance + 2, sz: 0.6, material: "column", color: C.steel });
      box({ x: gx, y: 0, z: mp.z + span, sx: 0.6, sy: site.clearance + 2, sz: 0.6, material: "column", color: C.steel });
      box({ x: gx, y: site.clearance + 0.5, z: mp.z, sx: 0.4, sy: 1.8, sz: span * 2 + 0.6, material: "sign", color: C.sign });
      // Weighbridge kiosk beside the second MP.
      const mp2 = site.mps[1]!;
      box({ x: mp2.x - mp2.outX * 6, y: 0, z: mp2.z + (site.layout === "comb" ? -5.5 : 5.5), sx: 2.5, sy: 3, sz: 2.5, material: "frame", color: C.white, texture: "concrete" });
      break;
    }
  }
  return out;
}
