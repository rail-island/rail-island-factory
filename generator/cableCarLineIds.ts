// How the site names a cable car line (docs/site/catalog-site.md, "Scenery"): the line
// preview's id and the parameter values it takes for a cabin and a station type, shared
// by the preview (previews/cableCarLine.ts) and a cabin's scenery (catalog.ts sceneryOf),
// which hands them to the viewer. Pure data, no imports: catalog.ts reaches the site's types.

/** The line preview a cabin's Scenery checkbox shows the cabin in. */
export const LINE_PREVIEW_ID = "proc-preview-cablecar-line";

/** A cabin's value of the line preview's `cabin` parameter: its id less the prefix, in camelCase. */
export function lineCabinValue(id: string): string {
  return id.replace(/^(proc-vehicle-|veh-)/, "").replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** A station type id as the line preview's `station` value (letters and digits only): open_gantry -> openGantry. */
export function lineStationValue(type: string): string {
  return type.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** The station types a line may be shown between, in the set's picker order, with their names. */
export const LINE_STATIONS: ReadonlyArray<{ type: string; title: string }> = [
  { type: "open_gantry", title: "Open gantry" },
  { type: "alpine_chalet", title: "Alpine chalet" },
  { type: "glass_modern", title: "Glass modern" },
  { type: "concrete_drive", title: "Concrete drive" },
];

/** The cabin counts the line preview offers: one shuttles, two run a jig-back, six circulate. */
export const LINE_COUNTS: ReadonlyArray<{ value: string; title: string }> = [
  { value: "1", title: "One, shuttle" },
  { value: "2", title: "Two, jig-back" },
  { value: "6", title: "Six, circulating" },
];
