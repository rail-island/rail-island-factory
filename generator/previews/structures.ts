// The site previews of the structure types whose world the game solves itself
// (docs/models/previews.md): bus stops, cable-car stations, ports, airports, dams and
// tunnel portals, one page per type. Each draws what its set module and props give a
// type on a representative fixture: a stop on both kerbs of a short two-lane road, a
// cable-car station's deck under its shed, a port's quay with the props its grade is
// furnished with, an airport's terminal and tower on a pad by its apron, a dam's wall
// across a flat valley, a portal's masonry round a bore. The game's own layout of a
// port or an airport is richer: these show the type, not a placed instance.

import { resolveParams, type ParamSpec, type ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import type { SurfaceId } from "../surfaces.ts";
import * as busStop from "../sets/busStop.ts";
import * as cableCarStation from "../sets/cableCarStation.ts";
import * as port from "../sets/port.ts";
import * as airport from "../sets/airport.ts";
import * as dam from "../sets/dam.ts";
import * as tunnelPortal from "../sets/tunnelPortal.ts";
import { shedBoxes, shedLodBoxes, SHED_VALUES, type StationType } from "../props/cableCarSheds.ts";
import { bollardBoxes, containerBoxes, craneBoxes, CRANE_DECKS, floodlightBoxes, hutBoxes, mooringPostBoxes } from "../props/portProps.ts";
import { towerBoxes, TOWER_HEIGHTS } from "../props/airportProps.ts";
import type { PropBox } from "../props/propKit.ts";
import { Sketch, type Rgb } from "./sketch.ts";

/** Props drawn into the sketch at (x, z), turned `yaw` about Y and scaled by `k`. */
function props(s: Sketch, boxes: readonly PropBox[], x: number, z: number, yaw = 0, k = 1): void {
  const c = Math.cos(yaw), si = Math.sin(yaw);
  for (const b of boxes) {
    s.box(s.mat(b.material, b.color), {
      cx: x + (b.cx * c + b.cz * si) * k, cy: b.cy * k, cz: z + (-b.cx * si + b.cz * c) * k,
      sx: b.sx * k, sy: b.sy * k, sz: b.sz * k, rotX: b.rotX, rotZ: b.rotZ, profile: b.profile, yaw,
    });
  }
}

// --- bus stops ---

/** Half a two-lane road's width plus the kerb margin: where a stop's kerb stands. */
const STOP_LATERAL = 4 + 1;
const STOP_ROAD = 30;

function busStopSketch(type: string, lod: boolean): Sketch {
  const s = new Sketch();
  s.box(s.mat("pavement", [60, 60, 64], "road-asphalt"), { cx: -4, cy: 0.2, cz: 0, sx: STOP_ROAD, sy: 0.4, sz: 2 * (STOP_LATERAL - 1) });
  for (const outward of [1, -1] as const) {
    for (const b of busStop.buildSide(type, STOP_LATERAL).boxes) {
      if (lod && b.detail !== false && b.material !== "pavement") continue;
      // travel runs along +X on the +Z kerb, along -X on the -Z one; a sign faces along the road
      const turned = b.axes === "sign";
      s.box(s.mat(b.material, b.color, b.material === "pavement" ? "road-pavement" : undefined), {
        cx: b.x * outward, cy: b.y + 0.4, cz: b.z * outward, sx: turned ? b.sz : b.sx, sy: b.sy, sz: turned ? b.sx : b.sz,
      });
    }
  }
  return s;
}
export function busStopPreview(_values: ParamValues | undefined, type: string): MeshBuilder { return busStopSketch(type, false).build("stop"); }
export function busStopPreviewLod(_values: ParamValues | undefined, type: string): MeshBuilder { return busStopSketch(type, true).build("stop"); }

// --- cable-car stations ---

function cableCarSketch(type: string, lod: boolean): Sketch {
  const s = new Sketch();
  const meta = cableCarStation.TYPE_META[type]!;
  // the boarding deck the game builds under the shed, at the footprint the type is placed with
  s.box(s.mat("deck", [150, 146, 138], "stop-concrete"), { cx: 0, cy: 0.5, cz: 0, sx: meta.w, sy: 1, sz: meta.d });
  const shedType = (Object.keys(SHED_VALUES) as StationType[]).find((t) => SHED_VALUES[t] === meta.shed.values.type) ?? "open_gantry";
  props(s, lod ? shedLodBoxes(shedType) : shedBoxes(shedType), 0, 0);
  return s;
}
export function cableCarStationPreview(_values: ParamValues | undefined, type: string): MeshBuilder { return cableCarSketch(type, false).build("station"); }
export function cableCarStationPreviewLod(_values: ParamValues | undefined, type: string): MeshBuilder { return cableCarSketch(type, true).build("station"); }

// --- ports ---

export const PORT_PARAMS: ParamSpec[] = [
  { name: "berth", title: "Berth", default: "short", preview: true, values: [{ value: "short", title: "40 studs" }, { value: "long", title: "80 studs" }] },
];
const DECK: Record<port.PortGrade, { color: Rgb; surface: SurfaceId; height: number }> = {
  timber: { color: [128, 96, 62], surface: "bridge-timber", height: 2.2 },
  concrete: { color: [168, 165, 158], surface: "stop-concrete", height: 2.6 },
  terminal: { color: [176, 174, 168], surface: "stop-concrete", height: 2.6 },
};

function portSketch(values: ParamValues | undefined, type: string, lod: boolean): Sketch {
  const length = resolveParams(PORT_PARAMS, values).berth === "long" ? 80 : 40;
  const { family, grade } = port.TYPE_META[type]!;
  const deck = DECK[grade];
  const s = new Sketch();
  // the water the berth faces, then the quay or jetty deck along it (+Z is the water side)
  s.box(s.mat("water", [62, 156, 182]), { cx: 0, cy: 0.05, cz: 14, sx: length + 20, sy: 0.1, sz: 16 });
  s.box(s.mat(grade === "timber" ? "wood" : "deck", deck.color, deck.surface), { cx: 0, cy: deck.height / 2, cz: 0, sx: length, sy: deck.height, sz: 12 });
  if (grade === "timber") for (let x = -length / 2 + 2; x <= length / 2 - 2; x += 6) s.box(s.mat("wood", [96, 72, 48], "bridge-timber"), { cx: x, cy: deck.height / 2, cz: 6.3, sx: 0.8, sy: deck.height, sz: 0.8 });
  const top = deck.height;
  const at = (list: readonly PropBox[], x: number, z: number, yaw = 0): void => props(s, (lod ? list.filter((b) => b.lod === "shell") : list).map((b) => ({ ...b, cy: b.cy + top })), x, z, yaw);
  // the props the grade is furnished with, along the edge and behind it
  for (let x = -length / 2 + 4; x <= length / 2 - 4; x += 8) at(grade === "timber" ? mooringPostBoxes() : bollardBoxes(), x, 5.2);
  if (grade === "timber") at(hutBoxes(), -length / 2 + 5, -3);
  else {
    at(craneBoxes(CRANE_DECKS[family]), 0, 0, Math.PI / 2);
    at(containerBoxes(1, 2), -length / 2 + 6, -3.5);
    at(containerBoxes(3, 1), -length / 2 + 6, 0.5);
    at(floodlightBoxes(), length / 2 - 4, -4.5);
    if (grade === "terminal") s.box(s.mat("glass", [132, 191, 211]), { cx: length / 2 - 12, cy: top + 3.5, cz: -2, sx: 14, sy: 7, sz: 7 });
  }
  return s;
}
export function portPreview(values: ParamValues | undefined, type: string): MeshBuilder { return portSketch(values, type, false).build("port"); }
export function portPreviewLod(values: ParamValues | undefined, type: string): MeshBuilder { return portSketch(values, type, true).build("port"); }

// --- airports ---

export const AIRPORT_PARAMS: ParamSpec[] = [
  { name: "pad", title: "Terminal pad", default: "large", preview: true, values: [{ value: "small", title: "24 studs" }, { value: "large", title: "48 studs" }] },
];
const APRON: Record<string, { color: Rgb; surface: SurfaceId }> = {
  grass_field: { color: [96, 140, 70], surface: "airport-grass" },
  regional: { color: [60, 60, 64], surface: "airport-asphalt" },
  international: { color: [150, 150, 146], surface: "airport-concrete" },
};

function airportSketch(values: ParamValues | undefined, type: string, lod: boolean): Sketch {
  const w = resolveParams(AIRPORT_PARAMS, values).pad === "small" ? 24 : 48;
  const pad: airport.TerminalPad = { cx: 0, cz: 0, w, d: w };
  const s = new Sketch();
  const apron = APRON[type] ?? APRON.regional!;
  // the terminal pad and the apron in front of it (-X), as the game paves them
  s.box(s.mat("pavement", [168, 165, 158], "stop-concrete"), { cx: 0, cy: 0.1, cz: 0, sx: w, sy: 0.2, sz: w });
  s.box(s.mat("pavement", apron.color, apron.surface), { cx: -w, cy: 0.1, cz: 0, sx: w, sy: 0.2, sz: w * 1.6 });
  for (const b of airport.terminal(pad, type)) {
    if (lod && b.lod !== "shell") continue;
    s.box(s.mat(b.material, b.color), { ...b, cy: b.cy + 0.2 });
  }
  const meta = airport.TYPE_META[type];
  if (meta?.tower) {
    const f = airport.furniture(pad, type);
    const kind = meta.tower.values.kind === "international" ? "international" : "regional";
    const boxes = towerBoxes(TOWER_HEIGHTS[kind]);
    props(s, lod ? boxes.filter((b) => b.lod === "shell") : boxes, f.tower.x, f.tower.z, 0, f.scale);
  }
  return s;
}
export function airportPreview(values: ParamValues | undefined, type: string): MeshBuilder { return airportSketch(values, type, false).build("airport"); }
export function airportPreviewLod(values: ParamValues | undefined, type: string): MeshBuilder { return airportSketch(values, type, true).build("airport"); }

// --- dams ---

export const DAM_PARAMS: ParamSpec[] = [
  { name: "valley", title: "Valley", default: "narrow", preview: true, values: [{ value: "narrow", title: "60 studs" }, { value: "wide", title: "120 studs" }] },
];
const CREST = 12, FREEBOARD = 1.5, HALF_WIDTH = 3.5;

function damSketch(values: ParamValues | undefined, type: string, lod: boolean): Sketch {
  const length = resolveParams(DAM_PARAMS, values).valley === "wide" ? 120 : 60;
  const meta = dam.TYPE_META[type] ?? dam.TYPE_META.concrete!;
  const s = new Sketch();
  const surface = meta.surface as SurfaceId;
  const matOf = (b: dam.DamBox): string => s.mat(b.material, b.color, b.material === "platform" || b.material === "edge" ? surface : undefined);
  const left = -length / 2, right = length / 2;
  const lockW = meta.lock ? meta.lock.width + 2 * meta.lock.wall : 0;
  const wallRight = right - lockW;
  const top = meta.body === "weir" ? CREST : CREST + FREEBOARD;
  const concrete = s.mat("platform", meta.arcade ? dam.COLORS.stone : dam.COLORS.concrete, surface);
  if (meta.body === "gravity") {
    // the wall: vertical upstream (+Z), battered downstream, swept along the crest
    const batter = Math.min(HALF_WIDTH * 1.1, top * 0.32);
    s.sweep(concrete, [[left, 0, 0], [wallRight, 0, 0]], [[HALF_WIDTH, 0], [HALF_WIDTH, top], [-HALF_WIDTH + batter, top], [-HALF_WIDTH, 0]], true);
    if (!lod) for (const b of dam.gravityParts({ left, right: wallRight, halfWidth: HALF_WIDTH, base: 0, top, height: top, batter }, false)) s.box(matOf(b), b);
  } else {
    // a weir: concrete wings at both banks, the overflow sill between them
    const wing = Math.min(12, length / 5), wingTop = CREST + FREEBOARD;
    for (const [a, b] of [[left, left + wing], [wallRight - wing, wallRight]] as const) s.box(concrete, { cx: (a + b) / 2, cy: wingTop / 2, cz: 0, sx: b - a, sy: wingTop, sz: HALF_WIDTH * 2 });
    s.box(concrete, { cx: (left + wallRight) / 2, cy: CREST / 2, cz: 0, sx: wallRight - left - 2 * wing, sy: CREST, sz: HALF_WIDTH * 2 });
    if (meta.arcade) {
      const arcade = dam.arcadeParts({ left, right: wallRight, halfWidth: HALF_WIDTH, base: 0, wingTop, simplified: lod });
      for (const b of arcade?.boxes ?? []) s.box(matOf(b), b);
      const tile = s.mat("roof", [dam.TILE_COLOR >> 16, (dam.TILE_COLOR >> 8) & 255, dam.TILE_COLOR & 255]);
      for (const r of arcade?.roofs ?? []) s.pyramid(tile, r.x, r.y, r.z, r.half, r.height);
    }
  }
  if (meta.lock) {
    const lock = { left: wallRight, right, centre: (wallRight + right) / 2, upstream: meta.lock.length / 2, downstream: -meta.lock.length / 2 };
    const parts = dam.lockParts(lock, meta.lock, CREST - 4, CREST + FREEBOARD, 0, lod);
    for (const b of parts.boxes) s.box(matOf(b), b);
    for (const leaf of parts.leaves) for (const b of leaf.boxes) s.box(matOf(b), { ...b, cx: b.cx + leaf.x, cy: b.cy + leaf.y, cz: b.cz + leaf.z });
  }
  return s;
}
export function damPreview(values: ParamValues | undefined, type: string): MeshBuilder { return damSketch(values, type, false).build("dam"); }
export function damPreviewLod(values: ParamValues | undefined, type: string): MeshBuilder { return damSketch(values, type, true).build("dam"); }

// --- tunnel portals ---

// what the tunnel carries: the game widens the bore for it
export const PORTAL_PARAMS: ParamSpec[] = [
  { name: "bore", title: "Carries", default: "single", values: [{ value: "single", title: "One track" }, { value: "double", title: "Two tracks" }, { value: "road", title: "Wide road" }] },
];
const BORES: Record<string, number> = { single: 3.5, double: 7.5, road: 9 };
const PORTAL_COLORS: Record<tunnelPortal.PortalMaterial, Rgb> = {
  floor: [75, 70, 66], portal: [112, 107, 98], trim: [142, 136, 126], shadow: [24, 24, 26], lining: [96, 92, 86], rib: [80, 76, 70],
};

function portalSketch(values: ParamValues | undefined, style: string, lod: boolean): Sketch {
  const half = BORES[resolveParams(PORTAL_PARAMS, values).bore!]!;
  const s = new Sketch();
  const boxes = tunnelPortal.buildPortal(style, half, { centerY: 4.85, verticalRadius: 6.85, floorDrop: 2, clearHeight: 11.7, bedY: 0.46, bedThickness: 0.42, segments: lod ? 8 : 18, wingReach: 5 });
  // the portal stands on the rail at y = floorDrop above the preview's ground
  for (const b of boxes) {
    if (lod && (b.material === "shadow" || b.material === "floor")) continue;
    const surface = b.material === "portal" || b.material === "trim" ? "tunnel-portal" : undefined;
    s.box(s.mat(b.material === "shadow" ? "shadow" : "stone", PORTAL_COLORS[b.material], surface), { cx: b.ox, cy: b.oy + 2, cz: b.oz, sx: b.sx, sy: b.sy, sz: b.sz, rotZ: b.roll });
  }
  return s;
}
export function tunnelPortalPreview(values: ParamValues | undefined, style: string): MeshBuilder { return portalSketch(values, style, false).build("portal"); }
export function tunnelPortalPreviewLod(values: ParamValues | undefined, style: string): MeshBuilder { return portalSketch(values, style, true).build("portal"); }
