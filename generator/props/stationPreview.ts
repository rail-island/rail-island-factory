// Preview design of the station set (docs/models/sets.md): a short railway station of
// one, two or four tracks over its ballast beds and rails. Like the other set
// previews it is the site's only: no game meta lists it and the export list leaves it
// out. Glass draws opaque and the name boards stay blank: the game paints the names.
// The road station's preview is in roadStationPreview.ts: each source file is one
// bundle, so each preview carries only its own set module.

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import * as station from "../sets/station.ts";
import { propModel, separateCoplanar, type PropBox } from "./propKit.ts";

/** A parameter value per type id (values are alphanumeric) and its short title. */
function typeValues(titles: Record<string, string>): { value: string; title: string }[] {
  return Object.entries(titles).map(([id, title]) => ({ value: id.replace(/_/g, ""), title }));
}
function typeOf(titles: Record<string, string>, value: string): string {
  return Object.keys(titles).find((id) => id.replace(/_/g, "") === value)!;
}

// --- railway station ---

const STATION_TITLES: Record<string, string> = {
  platforms_only: "Platforms only", platforms_shared: "Island platforms", arch_shed: "Arched shed",
  cantilever_wings: "Cantilever wings", concourse: "Concourse", village_depot: "Village depot",
  heritage_canopy: "Heritage canopy", grand_terminus: "Grand terminus",
};
const STATION_LENGTH = 60;
const STATION_PARAMS: ParamSpec[] = [
  { name: "type", title: "Type", default: "platformsonly", values: typeValues(STATION_TITLES) },
  { name: "tracks", title: "Tracks", default: "2", values: ["1", "2", "4"].map((v) => ({ value: v, title: v })) },
];
const BALLAST: PropBox["color"] = [128, 122, 112];
const ROOFED = new Set(["roof", "glass", "tile", "steel", "brick"]);

/** The station's rows across the tracks: a deck slab per platform row, a ballast bed per rail row. */
function rowBoxes(layout: station.StationLayout): PropBox[] {
  const boxes: PropBox[] = [];
  let x = -layout.rows.reduce((w, r) => w + r.width, 0) / 2;
  for (const row of layout.rows) {
    const cx = x + row.width / 2;
    if (row.type === "rail") boxes.push({ cx, cy: 0.3, cz: 0, sx: station.BALLAST_WIDTH, sy: 0.6, sz: STATION_LENGTH + 8, color: BALLAST, material: "edge" });
    x += row.width;
  }
  return boxes;
}

/** A short station over its ballast beds and rails. */
function stationBoxes(values?: Record<string, string>): PropBox[] {
  const p = resolveParams(STATION_PARAMS, values);
  const layout = station.buildLayout(typeOf(STATION_TITLES, p.type!), Number(p.tracks));
  const boxes: PropBox[] = station.furnish(typeOf(STATION_TITLES, p.type!), STATION_LENGTH, layout).map((b) => ({
    cx: b.cx, cy: b.cy, cz: b.cz, sx: b.sx, sy: b.sy, sz: b.sz, rotX: b.rotX, rotZ: b.rotZ, profile: b.profile, color: b.color, material: b.material,
  }));
  for (const bed of rowBoxes(layout)) {
    boxes.push(bed);
    for (const side of [-1, 1]) boxes.push({ cx: bed.cx + side * 1.35, cy: 0.8, cz: 0, sx: 0.45, sy: 0.4, sz: STATION_LENGTH + 8, color: [92, 88, 84], material: "steel" });
  }
  return boxes;
}

/**
 * The distant station: the deck slabs and ballast beds, and one box round the
 * superstructure the type builds over them (its roofs, vaults and walls).
 */
function stationLodBoxes(values?: Record<string, string>): PropBox[] {
  const p = resolveParams(STATION_PARAMS, values);
  const type = typeOf(STATION_TITLES, p.type!);
  const layout = station.buildLayout(type, Number(p.tracks));
  const furnished = station.furnish(type, STATION_LENGTH, layout);
  const boxes: PropBox[] = rowBoxes(layout);
  const width = layout.rows.reduce((w, r) => w + r.width, 0);
  boxes.push({ cx: 0, cy: station.PLATFORM_HEIGHT / 2, cz: 0, sx: width, sy: station.PLATFORM_HEIGHT - 0.7, sz: STATION_LENGTH, color: [180, 170, 155], material: "platform" });
  const over = furnished.filter((b) => b.lod === "shell" && ROOFED.has(b.material));
  if (over.length > 0) {
    const lo = (b: station.StationBox, c: "cx" | "cy" | "cz", s: "sx" | "sy" | "sz"): number => b[c] - b[s] / 2;
    const hi = (b: station.StationBox, c: "cx" | "cy" | "cz", s: "sx" | "sy" | "sz"): number => b[c] + b[s] / 2;
    const x0 = Math.min(...over.map((b) => lo(b, "cx", "sx"))), x1 = Math.max(...over.map((b) => hi(b, "cx", "sx")));
    const y0 = Math.max(station.PLATFORM_HEIGHT + 2, Math.min(...over.map((b) => lo(b, "cy", "sy")))), y1 = Math.max(...over.map((b) => hi(b, "cy", "sy")));
    const z0 = Math.min(...over.map((b) => lo(b, "cz", "sz"))), z1 = Math.max(...over.map((b) => hi(b, "cz", "sz")));
    if (y1 > y0) boxes.push({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2, sx: x1 - x0, sy: y1 - y0, sz: z1 - z0, color: over[0]!.color, material: "roof" });
  }
  return boxes.map((b) => ({ ...b, lod: "shell" as const }));
}
export function stationPreview(values?: Record<string, string>): MeshBuilder { return propModel(separateCoplanar(stationBoxes(values))); }
export function stationPreviewLod(values?: Record<string, string>): MeshBuilder { return propModel(separateCoplanar(stationLodBoxes(values)), true); }

const PREVIEW_CATALOG = { category: "Structure types", group: "previews", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const STATION_PREVIEWS: ProceduralDesign[] = [
  { id: "proc-preview-station", title: "Railway Station", build: stationPreview, buildLod: stationPreviewLod, lodTriangles: 500 as const, params: STATION_PARAMS },
].map((d) => ({ ...d, catalog: { ...PREVIEW_CATALOG } }));
