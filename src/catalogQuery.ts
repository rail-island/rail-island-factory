// Everything the site decides about its listing, as pure functions: the column
// table, the comparator, the search, the formatters and the URL round-trip. No
// Solid, no JSX, no DOM, so test/catalogQuery.test.ts drives it in Vitest's node
// environment.
//
// Columns are DATA: the table header, the card's stat row, the sort <select>, the
// detail panel's spec list and the comparator all read the same list, so a column
// cannot offer an ordering the comparator does not implement.

import type { CatalogRecord } from "../generator/catalog.ts";

export type { CatalogRecord };

export type SortDir = "asc" | "desc";

/** A record plus the one lower-cased string the search box matches against. */
export interface Row extends CatalogRecord {
  hay: string;
}

export type ColumnType = "text" | "num" | "bytes";

export interface Column {
  /** Stable id; doubles as the `?sort=` token. */
  key: string;
  label: string;
  /** Rendered after the value, e.g. "m". */
  unit: string | null;
  type: ColumnType;
  /** Direction this column starts in when first chosen -- counts and sizes read largest first. */
  dir: SortDir;
  /** In the wide table. Every column is in the detail panel and the sort control regardless. */
  table: boolean;
  value: (r: CatalogRecord) => number | string | null;
  /** Site-relative URL of the file the cell is the size of; the cell then downloads it. */
  file?: (r: CatalogRecord) => string;
}

// The order here is the order of the table's columns, of the sort <select> and of
// the detail panel's spec list.
export const COLUMNS: readonly Column[] = [
  { key: "title", label: "Title", unit: null, type: "text", dir: "asc", table: true, value: (r) => r.title },
  { key: "id", label: "Id", unit: null, type: "text", dir: "asc", table: false, value: (r) => r.id },
  { key: "category", label: "Category", unit: null, type: "text", dir: "asc", table: false, value: (r) => r.category },
  { key: "group", label: "City pool", unit: null, type: "text", dir: "asc", table: true, value: (r) => r.group },
  { key: "triangles", label: "Triangles", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.triangles },
  { key: "vertices", label: "Vertices", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.vertices },
  { key: "glbBytes", label: "GLB", unit: null, type: "bytes", dir: "desc", table: true, value: (r) => r.glbBytes, file: (r) => r.glbUrl },
  { key: "glbGzipBytes", label: "GLB gzip", unit: null, type: "bytes", dir: "desc", table: false, value: (r) => r.glbGzipBytes },
  { key: "jsBytes", label: "JS", unit: null, type: "bytes", dir: "desc", table: true, value: (r) => r.jsBytes, file: (r) => r.jsUrl },
  { key: "jsGzipBytes", label: "JS gzip", unit: null, type: "bytes", dir: "desc", table: false, value: (r) => r.jsGzipBytes },
  { key: "primitives", label: "Prims", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.primitives },
  { key: "materials", label: "Mats", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.materials },
  { key: "thumbBytes", label: "Thumbnail", unit: null, type: "bytes", dir: "desc", table: false, value: (r) => r.thumbBytes },
  { key: "sizeX", label: "Width", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeX },
  { key: "sizeZ", label: "Depth", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeZ },
  { key: "sizeY", label: "Height", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeY },
  { key: "defaultScale", label: "Scale", unit: null, type: "num", dir: "desc", table: false, value: (r) => r.defaultScale ?? null },
  { key: "author", label: "Author", unit: null, type: "text", dir: "asc", table: false, value: (r) => r.author },
  { key: "license", label: "License", unit: null, type: "text", dir: "asc", table: true, value: (r) => r.license },
  { key: "source", label: "Source", unit: null, type: "text", dir: "asc", table: false, value: (r) => r.source },
];

const BY_KEY = new Map(COLUMNS.map((c) => [c.key, c]));
export const DEFAULT_SORT = "title";
export const DEFAULT_DIR: SortDir = "asc";

export function column(key: string): Column | undefined {
  return BY_KEY.get(key);
}

/** Attach the search haystack, once, when the catalog lands. */
export function prepareRows(records: readonly CatalogRecord[]): Row[] {
  return records.map((r) => ({
    ...r,
    hay: [r.title, r.id, r.category, r.group, r.author, r.license, r.source].join(" ").toLowerCase(),
  }));
}

/** Every whitespace-separated word of the query must appear somewhere in the row. */
export function matches(r: Row, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((w) => r.hay.includes(w));
}

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/**
 * Compare two rows on one column. A missing value sorts last in BOTH directions --
 * flipping the direction should reorder what is there, not bring the blanks to
 * the top. Ties fall back to the title, then the id, so the order is total.
 */
export function compareRows(a: Row, b: Row, col: Column, dir: SortDir): number {
  const va = col.value(a);
  const vb = col.value(b);
  const sign = dir === "asc" ? 1 : -1;
  if (va == null || vb == null) {
    if (va == null && vb != null) return 1;
    if (vb == null && va != null) return -1;
  } else {
    const c = typeof va === "number" && typeof vb === "number" ? va - vb : collator.compare(String(va), String(vb));
    if (c !== 0) return c * sign;
  }
  return collator.compare(a.title, b.title) || collator.compare(a.id, b.id);
}

export function queryRows(rows: readonly Row[], q: string, sort: string, dir: SortDir, path: ChipPath = NO_CHIPS): Row[] {
  const col = column(sort) ?? column(DEFAULT_SORT)!;
  return rows.filter((r) => onPath(r, path) && matches(r, q)).sort((a, b) => compareRows(a, b, col, dir));
}

// --------------------------------------------------------------- the chips

/**
 * The filter chips, as the webapp Creator draws them (without its origin switch:
 * everything here is the factory's own). The first row is one chip per fleet plus
 * one for every building; under a pick, a second row splits it by type (a
 * vehicle's group, a building's category) and a third by what is left (a
 * building's city pool). The first row's order and labels are the Creator's.
 */
export interface Group {
  id: string;
  label: string;
}

export const GROUPS: readonly Group[] = [
  { id: "train", label: "Trains" },
  { id: "moto", label: "Road vehicles" },
  { id: "tram", label: "Trams" },
  { id: "ship", label: "Ships" },
  { id: "aircraft", label: "Aircraft" },
  { id: "cablecar", label: "Cable cars" },
  { id: "building", label: "Buildings" },
];

const GROUP_IDS = new Set(GROUPS.map((g) => g.id));

/** The vehicle categories a record can carry, by first-row chip. Any other category is a building's. */
const VEHICLE_CATEGORIES: ReadonlyMap<string, string> = new Map([
  ["Rail vehicles", "train"],
  ["Road vehicles", "moto"],
  ["Trams", "tram"],
  ["Ships", "ship"],
  ["Aircraft", "aircraft"],
  ["Cable cars", "cablecar"],
]);

export function groupOf(r: CatalogRecord): string {
  return VEHICLE_CATEGORIES.get(r.category) ?? "building";
}

/** The chip a model lands on when it has no value for a level, so every model is reachable through the chips. */
export const OTHER_CHIP = "other";

/** The second chip level: a vehicle's group (loco, coach, truck, ...), a building's category. */
export function level2Of(r: CatalogRecord): string {
  return (groupOf(r) === "building" ? r.category : r.group) || OTHER_CHIP;
}

/** The third chip level: a building's city pool. A vehicle has nothing finer. */
export function level3Of(r: CatalogRecord): string {
  return (groupOf(r) === "building" ? r.group : "") || OTHER_CHIP;
}

/** What the three chip rows have picked: one value per row at most, null for All. */
export interface ChipPath {
  group: string | null;
  l2: string | null;
  l3: string | null;
}

export const NO_CHIPS: ChipPath = { group: null, l2: null, l3: null };

function onPath(r: CatalogRecord, path: ChipPath): boolean {
  if (path.group !== null && groupOf(r) !== path.group) return false;
  if (path.l2 !== null && level2Of(r) !== path.l2) return false;
  return path.l3 === null || level3Of(r) === path.l3;
}

/** The chips each row offers. A row with nothing to offer is empty. */
export interface ChipRows {
  groups: string[];
  l2: string[];
  l3: string[];
}

/**
 * Which chips each row offers, derived from every row (not the search, so the
 * chips hold still while somebody types). A first-row chip is offered only for a
 * group that has models; a lower row appears only under a pick and only when it
 * would offer a choice. A PICKED chip is always offered, even when nothing matches
 * it (an old link), so it can be switched off.
 */
export function chipRows(rows: readonly CatalogRecord[], path: ChipPath): ChipRows {
  const groups = new Set<string>();
  const l2 = new Set<string>();
  const l3 = new Set<string>();
  for (const r of rows) {
    const g = groupOf(r);
    groups.add(g);
    if (g !== path.group) continue;
    const v2 = level2Of(r);
    l2.add(v2);
    if (v2 !== path.l2) continue;
    l3.add(level3Of(r));
  }
  const offer = (found: Set<string>, picked: string | null, parent: string | null): string[] => {
    if (parent === null) return [];
    if (picked !== null) found.add(picked);
    return found.size > 1 || picked !== null ? [...found].sort((a, b) => collator.compare(chipLabel(a), chipLabel(b))) : [];
  };
  return {
    groups: GROUPS.map((g) => g.id).filter((id) => groups.has(id) || id === path.group),
    l2: offer(l2, path.l2, path.group),
    l3: offer(l3, path.l3, path.l2),
  };
}

/** Labels of the lower-row values the Creator names; any other value reads as itself. */
const CHIP_LABELS: Readonly<Record<string, string>> = {
  loco: "Locomotive",
  diesel: "Diesel",
  electric: "Electric",
  steam: "Steam",
  coach: "Coach",
  dmu: "DMU",
  emu: "EMU",
  metro: "Metro",
  truck: "Truck",
  tram: "Tram",
  other: "Other",
};

export function chipLabel(value: string): string {
  return CHIP_LABELS[value] ?? value;
}

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} kB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** One cell of the listing, as text. A missing value is a dash. */
export function cellText(r: CatalogRecord, col: Column): string {
  const v = col.value(r);
  if (v == null || v === "") return "-";
  if (typeof v === "number") return col.type === "bytes" ? formatBytes(v) : formatNumber(v);
  return v;
}

/** Where a cell's file is downloaded from, or null when the column has none. */
export function cellFile(r: CatalogRecord, col: Column): { href: string; name: string } | null {
  const url = col.file?.(r);
  return url ? { href: `/${url}`, name: url.slice(url.lastIndexOf("/") + 1) } : null;
}

// ------------------------------------------------------------- the URL state

/**
 * What the query string carries: the search, the chips, the ordering and the open model. All
 * of it lives in the URL so back/forward walks it and a link can share a model.
 */
export interface ViewState extends ChipPath {
  q: string;
  sort: string;
  dir: SortDir;
  /** The id of the model whose detail page is open, or null for the list. */
  model: string | null;
  /** The model page's side panel: the spec list, the procedural source tree, or the source images. */
  tab: DetailTab;
  /** The selected source-tree node (its slash-path id), or null. Kept only on the source tab. */
  node: string | null;
  /** A parametric model's chosen values (`?p.<name>=<value>`), as given; see effectiveParams. */
  params: Record<string, string>;
}

export type DetailTab = "specs" | "source" | "references";

const DETAIL_TABS: readonly DetailTab[] = ["specs", "source", "references"];

export function parseView(search: string): ViewState {
  const p = new URLSearchParams(search);
  const sort = column(p.get("sort") ?? "") ? p.get("sort")! : DEFAULT_SORT;
  const rawDir = p.get("dir");
  const dir: SortDir = rawDir === "asc" || rawDir === "desc" ? rawDir : column(sort)!.dir;
  const model = p.get("model") || null;
  // the tab and the node belong to an open model; a node only to the source tab
  const rawTab = p.get("tab") as DetailTab | null;
  const tab: DetailTab = model && rawTab && DETAIL_TABS.includes(rawTab) ? rawTab : "specs";
  const node = tab === "source" ? p.get("node") : null;
  const params: Record<string, string> = {};
  if (model) for (const [k, v] of p) if (k.startsWith("p.") && k.length > 2 && v) params[k.slice(2)] = v;
  // the chips as the Creator writes them: ?cat=<group>&sub=<l2>&sub2=<l3>, each only under the one above
  const group = readChip(p.get("cat"));
  const l2 = group !== null && GROUP_IDS.has(group) ? readChip(p.get("sub")) : null;
  const l3 = l2 !== null ? readChip(p.get("sub2")) : null;
  return {
    q: p.get("q") ?? "",
    group: group !== null && GROUP_IDS.has(group) ? group : null,
    l2,
    l3,
    sort,
    dir,
    model,
    tab,
    node: node ?? null,
    params,
  };
}

/** A chip value from the address bar, sanitized by shape: one that matches nothing simply lists nothing. */
function readChip(raw: string | null): string | null {
  return raw && raw.length <= 40 ? raw : null;
}

/** The inverse of parseView; defaults are left out, so the bare list is a bare `?`-less URL. */
export function serializeView(v: ViewState): string {
  const p = new URLSearchParams();
  if (v.q) p.set("q", v.q);
  if (v.group) p.set("cat", v.group);
  if (v.group && v.l2) p.set("sub", v.l2);
  if (v.group && v.l2 && v.l3) p.set("sub2", v.l3);
  if (v.sort !== DEFAULT_SORT) p.set("sort", v.sort);
  if (v.dir !== (column(v.sort)?.dir ?? DEFAULT_DIR)) p.set("dir", v.dir);
  if (v.model) {
    p.set("model", v.model);
    if (v.tab !== "specs") p.set("tab", v.tab);
    if (v.tab === "source" && v.node != null) p.set("node", v.node);
    for (const k of Object.keys(v.params).sort()) p.set(`p.${k}`, v.params[k]!);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ------------------------------------------------------------- parameters

/**
 * A parametric record's values: each declared parameter takes the chosen value
 * when its enum lists it, else its default; names it does not declare are
 * dropped. A fixed record has none.
 */
export function effectiveParams(r: CatalogRecord, chosen: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of r.params ?? []) out[p.name] = p.values.some((v) => v.value === chosen[p.name]) ? chosen[p.name]! : p.default;
  return out;
}

/** The values that differ from the defaults: what the URL keeps. */
export function nonDefaultParams(r: CatalogRecord, values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of r.params ?? []) if (values[p.name] !== undefined && values[p.name] !== p.default) out[p.name] = values[p.name]!;
  return out;
}

/** True when every parameter is at its default, i.e. the exported GLB is the model. */
export function isDefaultParams(r: CatalogRecord, values: Record<string, string>): boolean {
  return Object.keys(nonDefaultParams(r, effectiveParams(r, values))).length === 0;
}

// --- posing a rigged model (generator/rig.ts) ---------------------------------------

/** One slider of a rigged model's Pose block: the steering, or the bend at one hinge. */
export interface PoseControl {
  /** "steer", or "bend<i>" for the hinge between sections i and i + 1. */
  key: string;
  label: string;
  /** Degrees, symmetric about 0. */
  max: number;
}

/** The pose sliders' values, degrees, by control key; a missing one is 0. */
export type PoseValues = Record<string, number>;

/**
 * The largest steering angle in degrees: the virtual middle wheel's angle that
 * turns the inner wheel to its lock. The same formula as rig.ts's steerLock,
 * which the site cannot import (it only imports types from generator/).
 */
export function steerLockDeg(s: { maxAngleDeg: number; axles: Array<{ wheelbase: number }>; track: number }): number {
  const wheelbase = s.axles[0]!.wheelbase;
  const radius = wheelbase / Math.tan((s.maxAngleDeg * Math.PI) / 180) + s.track / 2;
  return (Math.atan(wheelbase / radius) * 180) / Math.PI;
}

/** The Pose block's sliders: steering, then one per hinge, named after the body behind it. */
export function poseControls(r: CatalogRecord): PoseControl[] {
  const rig = r.rig;
  if (!rig) return [];
  const out: PoseControl[] = [];
  if (rig.steer) out.push({ key: "steer", label: "Steering", max: Math.floor(steerLockDeg(rig.steer)) });
  const sections = rig.sections ?? [];
  for (let i = 0; i + 1 < sections.length; i++) {
    const behind = sections[i + 1]!.node.replace(/^section(\d+)$/, "section $1");
    out.push({ key: `bend${i}`, label: sections.length > 2 ? `Joint ${i + 1}` : behind === "trailer" ? "Trailer" : "Joint", max: rig.maxBendDeg ?? 45 });
  }
  return out;
}

/** The slider values as the model's pose() takes them: radians, + counter-clockwise seen from above. */
export function poseOf(r: CatalogRecord, values: PoseValues): { steer: number; bend: number[] } {
  const rad = (deg: number): number => (deg * Math.PI) / 180;
  const hinges = Math.max(0, (r.rig?.sections?.length ?? 0) - 1);
  return { steer: rad(values.steer ?? 0), bend: Array.from({ length: hinges }, (_, i) => rad(values[`bend${i}`] ?? 0)) };
}

/**
 * Poses the preview through the model's JS module with the preview's OWN rig
 * (`userData.rig`): the GLB's scene carries the default build's, a JS build the
 * rig of its own parameters -- a non-default Karosa Long's hinge and joint faces
 * are not the default's. The catalog record's rig is for the sliders' limits only.
 * Returns whether the module could pose it.
 */
export function posePreview<T>(
  mod: { pose?: (root: T, pose: { steer: number; bend: number[] }) => void },
  target: T,
  pose: { steer: number; bend: number[] },
): boolean {
  if (!mod.pose) return false;
  mod.pose(target, pose);
  return true;
}

/** Which model and parameter values a preview was built for, as one comparable string. */
export function previewKey(id: string, params: Record<string, string>): string {
  return `${id}?${JSON.stringify(Object.keys(params).sort().map((k) => [k, params[k]]))}`;
}

/**
 * What a key does on the model page: Escape closes it, the left and right arrows
 * step through the list -- except while a form control has the focus, whose own
 * arrows they are (a Pose slider, a parameter's select). Null for anything else.
 */
export function pageKey(key: string, target: unknown): "close" | -1 | 1 | null {
  if (key === "Escape") return "close";
  const t = target as { tagName?: unknown; isContentEditable?: unknown } | null;
  const control = !!t && (t.isContentEditable === true || (typeof t.tagName === "string" && /^(INPUT|SELECT|TEXTAREA)$/i.test(t.tagName)));
  if (control) return null;
  return key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : null;
}
