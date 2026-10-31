// The rail and road station types' site previews (docs/models/previews.md): one page
// per type. A railway station is laid out by its type's recipe for the chosen track
// count and furnished by the station set's module over the chosen length, standing on
// its ballast beds and rails; a road station is dressed by the road-station set's
// module on a solved layout of two stands. Glass draws opaque and the name boards
// stay blank: the game paints the station's name on them.

import { resolveParams, type ParamSpec, type ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import * as station from "../sets/station.ts";
import * as roadStation from "../sets/roadStation.ts";
import { Sketch } from "./sketch.ts";
import { RAILHEAD_Y, trackAlongZ } from "./wayKit.ts";
import { setPassenger } from "../passengerHints.ts";

// both are what a player picks for a station in the game
export const STATION_PARAMS: ParamSpec[] = [
  { name: "tracks", title: "Tracks", default: "2", values: ["1", "2", "4"].map((v) => ({ value: v, title: v })) },
  { name: "length", title: "Length", default: "60", values: ["40", "60", "120"].map((v) => ({ value: v, title: `${v} studs` })) },
];

/** The station tracks' sleepers (concrete). */
const SLEEPER = [180, 180, 170] as const;
/** The rails' top above the terrain: the game's railhead (wayKit.ts). */
const RAIL_TOP = RAILHEAD_Y;
const ROOFED = new Set(["roof", "glass", "tile", "steel", "brick"]);

function stationSketch(values: ParamValues | undefined, type: string, lod: boolean): Sketch {
  const p = resolveParams(STATION_PARAMS, values);
  const length = Number(p.length), layout = station.buildLayout(type, Number(p.tracks));
  const s = new Sketch();
  const furnished = station.furnish(type, length, layout);
  if (!lod) {
    // the materials drawn on thin parts only first (a sign's letters, a machine's
    // screen), so they take the smallest coplanar steps: the rest keep their order,
    // and so the steps between them
    const thick = new Set(furnished.filter((b) => partSize(b) > 0.06).map((b) => `${b.material}|${b.color.join(",")}`));
    for (const b of furnished) if (!thick.has(`${b.material}|${b.color.join(",")}`)) s.mat(b.material, b.color);
    for (const b of furnished) drawStationBox(s, b);
  }
  else {
    // the distant station: the deck, and one box round the roofs, vaults and walls over it
    const width = layout.rows.reduce((w, r) => w + r.width, 0);
    s.box(s.mat("platform", [180, 170, 155]), { cx: 0, cy: station.PLATFORM_HEIGHT / 2, cz: 0, sx: width, sy: station.PLATFORM_HEIGHT - 0.7, sz: length });
    const over = furnished.filter((b) => b.lod === "shell" && ROOFED.has(b.material));
    if (over.length) {
      const lo = (b: station.StationBox, c: "cx" | "cy" | "cz", z: "sx" | "sy" | "sz"): number => b[c] - b[z] / 2;
      const hi = (b: station.StationBox, c: "cx" | "cy" | "cz", z: "sx" | "sy" | "sz"): number => b[c] + b[z] / 2;
      const x0 = Math.min(...over.map((b) => lo(b, "cx", "sx"))), x1 = Math.max(...over.map((b) => hi(b, "cx", "sx")));
      const y0 = Math.max(station.PLATFORM_HEIGHT + 2, Math.min(...over.map((b) => lo(b, "cy", "sy")))), y1 = Math.max(...over.map((b) => hi(b, "cy", "sy")));
      const z0 = Math.min(...over.map((b) => lo(b, "cz", "sz"))), z1 = Math.max(...over.map((b) => hi(b, "cz", "sz")));
      if (y1 > y0) s.box(s.mat("roof", over[0]!.color), { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0 });
    }
  }
  // the ballast bed and rails of every rail row, a little past the platforms
  let x = -layout.rows.reduce((w, r) => w + r.width, 0) / 2;
  for (const row of layout.rows) {
    const cx = x + row.width / 2;
    // the game's own track section (the rail type pages' kit): its railhead stands where
    // a train's wheels stand in the game, just below the platform's edge
    if (row.type === "rail") trackAlongZ(s, length + 8, cx, SLEEPER, lod, station.BALLAST_WIDTH);
    x += row.width;
  }
  return s;
}

/** How small a part is: its thinnest side (an arc's thickness). */
function partSize(b: station.StationBox): number {
  return b.shape === "arc" ? b.arc?.thick ?? 0.2 : Math.min(b.sx, b.sy, b.sz);
}

/**
 * One box of the station vocabulary: a box through the sketch, a shape from the set's
 * own mesh (the game draws the same), grown by its material's coplanar step.
 */
function drawStationBox(s: Sketch, b: station.StationBox): void {
  const mat = s.mat(b.material, b.color);
  if (!b.shape) {
    s.box(mat, b);
    return;
  }
  const e = s.grow(mat);
  let grown: station.StationBox = { ...b, sx: b.sx + 2 * e, sy: b.sy + 2 * e, sz: b.sz + 2 * e };
  if (b.shape === "bar" && b.from && b.to) {
    const d = [b.to[0] - b.from[0], b.to[1] - b.from[1], b.to[2] - b.from[2]];
    const l = Math.hypot(d[0]!, d[1]!, d[2]!) || 1;
    const k = e / l;
    grown = { ...grown, from: [b.from[0] - d[0]! * k, b.from[1] - d[1]! * k, b.from[2] - d[2]! * k], to: [b.to[0] + d[0]! * k, b.to[1] + d[1]! * k, b.to[2] + d[2]! * k] };
  }
  if (b.shape === "arc" && b.arc) grown = { ...grown, arc: { ...b.arc, thick: b.arc.thick + 2 * e } };
  s.triangles(mat, station.stationBoxMesh(grown).positions, b.shape === "arc" && station.arcIsSheet(b));
}

/**
 * The passenger view's hints (docs/models/previews.md): the eye height, and every
 * track's centreline, extent and rail top, along which the site lays its parked train
 * and catenary. The sketch stands on y = 0 already (the ballast's foot), so these are
 * its own coordinates.
 */
function withPassenger(m: MeshBuilder, values: ParamValues | undefined, type: string): MeshBuilder {
  const p = resolveParams(STATION_PARAMS, values);
  const length = Number(p.length), layout = station.buildLayout(type, Number(p.tracks));
  let x = -layout.rows.reduce((w, r) => w + r.width, 0) / 2;
  const tracks = [];
  for (const row of layout.rows) {
    if (row.type === "rail") tracks.push({ x: x + row.width / 2, z0: -length / 2 - 4, z1: length / 2 + 4, top: RAIL_TOP });
    x += row.width;
  }
  setPassenger(m, { eye: 2.55, tracks });
  return m;
}

export function stationPreview(values: ParamValues | undefined, type: string): MeshBuilder { return withPassenger(stationSketch(values, type, false).build("station"), values, type); }
export function stationPreviewLod(values: ParamValues | undefined, type: string): MeshBuilder { return withPassenger(stationSketch(values, type, true).build("station"), values, type); }

// a road station's layout and stand count are what a player picks for it in the game
export const ROAD_STATION_PARAMS: ParamSpec[] = [
  { name: "stands", title: "Stands", default: "2", values: ["1", "2", "4"].map((v) => ({ value: v, title: v })) },
];

/** A solved road station: an island either side of every stand, the stands' road between them. */
function site(stands: number): roadStation.DressSite {
  const pitch = 10.5, x0 = -(stands * pitch) / 2;
  return {
    islands: Array.from({ length: stands + 1 }, (_, i) => ({ cx: x0 + i * pitch, cz: 0, dirX: 0, dirZ: 1, width: 5, length: 34 })),
    stands,
    mps: [{ x: x0 - 6, z: -22, outX: -1, outZ: 0 }, { x: -x0 + 6, z: 22, outX: 1, outZ: 0 }],
    layout: "drive_through",
    standLength: 30,
    islandTop: 1.27,
    clearance: 9.5,
  };
}

function roadStationSketch(values: ParamValues | undefined, type: string, lod: boolean): Sketch {
  const stands = Number(resolveParams(ROAD_STATION_PARAMS, values).stands);
  const st = site(stands);
  const s = new Sketch();
  for (const isl of st.islands) s.box(s.mat("pavement", [155, 155, 150], "road-pavement"), { cx: isl.cx, cy: st.islandTop / 2, cz: isl.cz, sx: isl.width, sy: st.islandTop, sz: isl.length });
  for (let i = 0; i < stands; i++) {
    const a = st.islands[i]!, b = st.islands[i + 1]!;
    s.box(s.mat("pavement", [60, 60, 64], "road-asphalt"), { cx: (a.cx + b.cx) / 2, cy: 0.5, cz: 0, sx: b.cx - a.cx - a.width / 2 - b.width / 2, sy: 1, sz: 40 });
  }
  for (const b of roadStation.dress(type, st)) {
    if (lod && b.material !== "roof") continue;
    const surface = b.texture === "wood" ? "stop-wood" : b.texture === "concrete" ? "stop-concrete" : b.texture === "wall" ? "stop-wall" : undefined;
    s.box(s.mat(b.material, b.color, surface), { cx: b.x, cy: b.y + b.sy / 2, cz: b.z, sx: b.sx, sy: b.sy, sz: b.sz, yaw: b.yaw });
  }
  return s;
}

export function roadStationPreview(values: ParamValues | undefined, type: string): MeshBuilder { return roadStationSketch(values, type, false).build("station"); }
export function roadStationPreviewLod(values: ParamValues | undefined, type: string): MeshBuilder { return roadStationSketch(values, type, true).build("station"); }
