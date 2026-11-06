// Everything the site decides about its listing, as pure functions: the column
// table, the comparator, the search, the formatters and the URL round-trip. No
// Solid, no JSX, no DOM, so test/catalogQuery.test.ts drives it in Vitest's node
// environment.
//
// Columns are DATA: the table header, the card's stat row, the sort <select>, the
// detail panel's spec list and the comparator all read the same list, so a column
// cannot offer an ordering the comparator does not implement.

import type { CatalogRecord, Scenery } from "../generator/catalog.ts";
import { soundIdsOf } from "./modelSounds";

export type { CatalogRecord, Scenery };

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
  { key: "id", label: "Id", unit: null, type: "text", dir: "asc", table: false, value: (r) => shownId(r) },
  { key: "category", label: "Category", unit: null, type: "text", dir: "asc", table: false, value: (r) => r.category },
  { key: "group", label: "City pool", unit: null, type: "text", dir: "asc", table: true, value: (r) => r.group },
  { key: "triangles", label: "Triangles", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.triangles },
  { key: "vertices", label: "Vertices", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.vertices },
  { key: "jsBytes", label: "JS", unit: null, type: "bytes", dir: "desc", table: true, value: (r) => r.jsBytes, file: (r) => r.jsUrl },
  { key: "jsGzipBytes", label: "JS gzip", unit: null, type: "bytes", dir: "desc", table: false, value: (r) => r.jsGzipBytes },
  { key: "primitives", label: "Prims", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.primitives },
  { key: "materials", label: "Mats", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.materials },
  { key: "thumbBytes", label: "Thumbnail", unit: null, type: "bytes", dir: "desc", table: false, value: (r) => r.thumbBytes },
  { key: "sizeX", label: "Width", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeX },
  { key: "sizeZ", label: "Depth", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeZ },
  { key: "sizeY", label: "Height", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeY },
  { key: "defaultScale", label: "Scale", unit: null, type: "num", dir: "desc", table: false, value: (r) => r.defaultScale ?? null },
  { key: "country", label: "Country", unit: null, type: "text", dir: "asc", table: false, value: (r) => r.country ?? null },
  { key: "author", label: "Author", unit: null, type: "text", dir: "asc", table: false, value: (r) => r.author },
  // The sound designs it plays (docs/models/sounds.md), its variants' included.
  { key: "sounds", label: "Sounds", unit: null, type: "text", dir: "asc", table: true, value: (r) => soundIdsOf(r.game).join(", ") || null },
  { key: "license", label: "License", unit: null, type: "text", dir: "asc", table: true, value: (r) => r.license },
  { key: "source", label: "Source", unit: null, type: "text", dir: "asc", table: false, value: (r) => r.source },
];

const BY_KEY = new Map(COLUMNS.map((c) => [c.key, c]));
export const DEFAULT_SORT = "title";
export const DEFAULT_DIR: SortDir = "asc";

export function column(key: string): Column | undefined {
  return BY_KEY.get(key);
}

/**
 * Attach the search haystack, once, when the catalog lands. A parametric model is
 * found by its variants too: each parameter value's title and token, so "green cream"
 * finds the CD 749 Bardotka that wears it as one of its liveries.
 */
export function prepareRows(records: readonly CatalogRecord[]): Row[] {
  return records.map((r) => ({
    ...r,
    hay: [
      r.title, r.id, r.gameId ?? "", r.category, r.group, r.traction ?? "", r.country ?? "", r.author, r.license, r.source,
      ...soundIdsOf(r.game),
      ...(r.params ?? []).flatMap((p) => p.values.flatMap((v) => [v.title, v.value])),
    ].join(" ").toLowerCase(),
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

export function queryRows(rows: readonly Row[], q: string, sort: string, dir: SortDir, path: ChipPath & CountryPick = NO_CHIPS): Row[] {
  const col = column(sort) ?? column(DEFAULT_SORT)!;
  return rows.filter((r) => onPath(r, path) && inCountry(r, path.country ?? null) && matches(r, q)).sort((a, b) => compareRows(a, b, col, dir));
}

// ------------------------------------------------------------- the country chips

/**
 * The country row: a filter of its own beside the three chip rows, not a level
 * of them. It keeps its pick while the chips above change, offers the countries
 * of the models on the current chip path, and is a query parameter
 * (`?country=<slug>`, "united-kingdom"), not part of a category page's path.
 */
export interface CountryPick {
  /** A country's chip slug ("united-kingdom"), or null for every country. */
  country?: string | null;
}

function inCountry(r: CatalogRecord, country: string | null): boolean {
  return country === null || (r.country !== undefined && chipMatches(r.country, country));
}

/**
 * The country chips under a chip path, sorted by name: offered only when the path
 * holds models of more than one country, or a country is picked (an old link's,
 * even one nothing matches, so it can be switched off).
 */
export function countryChips(rows: readonly CatalogRecord[], path: ChipPath, picked: string | null): string[] {
  const found = new Set<string>();
  for (const r of rows) if (r.country && onPath(r, path)) found.add(r.country);
  if (picked !== null && ![...found].some((v) => chipMatches(v, picked))) found.add(picked);
  return found.size > 1 || picked !== null ? [...found].sort((a, b) => collator.compare(a, b)) : [];
}

// --------------------------------------------------------------- the chips

/**
 * The filter chips, as the webapp Creator draws them (without its origin switch:
 * everything here is the factory's own). The first row is one chip per fleet plus
 * one for every building; under a pick, a second row splits it by type (a
 * vehicle's group, a building's category) and a third, under a locomotive or a
 * unit, by traction. The first row's order and labels are the Creator's.
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
  { id: "tree", label: "Trees" },
  { id: "woods", label: "Woods" },
  { id: "structure", label: "Structures" },
  { id: "way", label: "Rails and roads" },
  { id: "block", label: "City blocks" },
  { id: "prop", label: "Props" },
  { id: "character", label: "Characters" },
  { id: "texture", label: "Textures" },
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
  ["Cable car", "cablecar"],
  // not a vehicle, but a fleet of its own: the tree species (generator/trees.ts)
  ["Trees", "tree"],
  // the woods types as grove models, browsed with their parameters (generator/woodsModels.ts)
  ["Woods", "woods"],
  // the props the game places on its structures, and the parts a set module draws (generator/props/, previews/props.ts)
  ["Props", "prop"],
  // the characters the game's walk mode moves (generator/characters.ts)
  ["Characters", "character"],
  // one page per set type, block type and texture (generator/previews/)
  ["Structures", "structure"],
  ["Rails and roads", "way"],
  ["City blocks", "block"],
  ["Textures", "texture"],
]);

/** The first-row chip: a tram is filed with the rail vehicles but listed with the trams. */
export function groupOf(r: CatalogRecord): string {
  const g = VEHICLE_CATEGORIES.get(r.category) ?? "building";
  return g === "train" && r.group === "tram" ? "tram" : g;
}

/** The fleets whose models are all one kind, so a second row would only split near-synonyms (ship / ships). */
const NO_LEVEL2: ReadonlySet<string> = new Set(["ship", "aircraft", "cablecar", "tram", "tree", "woods", "prop", "character", "texture"]);

/** The chip a model lands on when it has no value for a level, so every model is reachable through the chips. */
export const OTHER_CHIP = "other";

/** The second chip level: a vehicle's group (loco, unit, coach, truck, ...), a building's category. */
export function level2Of(r: CatalogRecord): string {
  const g = groupOf(r);
  if (NO_LEVEL2.has(g)) return OTHER_CHIP;
  return (g === "building" ? r.category : r.group) || OTHER_CHIP;
}

/** The third chip level: a locomotive's or a unit's traction. Nothing else has a finer split. */
export function level3Of(r: CatalogRecord): string {
  return (groupOf(r) === "train" ? r.traction : "") || OTHER_CHIP;
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
  if (path.l2 !== null && !chipMatches(level2Of(r), path.l2)) return false;
  return path.l3 === null || chipMatches(level3Of(r), path.l3);
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
    if (!chipMatches(v2, path.l2)) continue;
    l3.add(level3Of(r));
  }
  const offer = (found: Set<string>, picked: string | null, parent: string | null): string[] => {
    if (parent === null) return [];
    if (picked !== null && ![...found].some((v) => chipMatches(v, picked))) found.add(picked);
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
  unit: "Unit",
  wagon: "Wagon",
  bus: "Bus",
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
  // the Structures, Rails and roads and City blocks rows: a set, a district
  bridge: "Bridges",
  busStop: "Bus stops",
  station: "Railway stations",
  roadStation: "Bus and truck stations",
  cableCarStation: "Cable car stations",
  port: "Ports",
  airport: "Airports",
  dam: "Dams",
  tunnelPortal: "Tunnel portals",
  railType: "Rail types",
  roadType: "Road types",
  decoration: "Line decorations",
  residential: "Residential",
  commercial: "Commercial",
  industrial: "Industrial",
  historic: "Historic",
  highrise: "High-rise",
};

/**
 * The id a row shows: a site preview's set type id as a saved game stores it, else the model
 * id. A preview's own `proc-preview-*` id only names its files and its page and is never shown,
 * so a preview of no set type (a texture, the pylon) shows none.
 */
export function shownId(r: CatalogRecord): string | null {
  return r.gameId ?? (r.id.startsWith("proc-preview-") ? null : r.id);
}

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
 * What the URL carries: the search, the chips, the ordering and the open model. All
 * of it lives in the URL so back/forward walks it and a link can share a model.
 *
 * The page is the PATH (docs/site/seo-pages.md): `/` is the list, `/model/<id>/` a
 * model, `/category/<group>/[<l2>/[<l3>/]]` a chip pick. Everything else stays in the
 * query string. A model page keeps the list's chips in the query (`?cat=&sub=&sub2=`,
 * the webapp Creator's form) so Back returns to the same list; the old all-query form
 * (`/?model=...`, `/?cat=...`) is still read, and the app rewrites it to the path form.
 */
export interface ViewState extends ChipPath {
  q: string;
  /** The listing's layout: the table (cards on a phone) or a row of variant thumbnails per model. */
  layout: Layout;
  sort: string;
  dir: SortDir;
  /** The id of the model whose detail page is open, or null for the list. */
  model: string | null;
  /** The model page's side panel: the spec list, the procedural source tree, or the source images. */
  tab: DetailTab;
  /** The selected source-tree node (its slash-path id), or null. Kept only on the source tab. */
  node: string | null;
  /** The model page's stage: the 3D viewer or, for a vehicle OpenTTD can hold, the OpenTTD view (`?stage=openttd`). */
  stage: Stage;
  /** A parametric model's chosen values (`?p.<name>=<value>`), as given; see effectiveParams. */
  params: Record<string, string>;
  /** The country chip's pick as a slug (`?country=<slug>`), or null for every country. */
  country: string | null;
  /** Which models the list shows: the confirmed catalog, or the workshop's drafts (`?section=workshop`). */
  section: Section;
}

/**
 * The site's two lists (docs/site/workshop.md): the catalog of confirmed models, the
 * default, and the workshop of drafts not yet confirmed (a record's `draft`).
 */
export type Section = "catalog" | "workshop";

/** The section a record is listed in. */
export function sectionOf(r: Pick<CatalogRecord, "draft">): Section {
  return r.draft ? "workshop" : "catalog";
}

/** The records one section lists. */
export function sectionRows<T extends Pick<CatalogRecord, "draft">>(rows: readonly T[], section: Section): T[] {
  return rows.filter((r) => sectionOf(r) === section);
}

/** The app bar's heading of a section's list. */
export function sectionHeading(section: Section): string {
  return section === "workshop" ? "Rail Island Workshop" : "Rail Island Catalog";
}

export type DetailTab = "specs" | "source" | "references";

export type Layout = "table" | "thumbs";

export type Stage = "3d" | "openttd";

const DETAIL_TABS: readonly DetailTab[] = ["specs", "source", "references"];

/** The path prefixes of a model page and a category page. */
export const MODEL_PATH = "/model/";
export const CATEGORY_PATH = "/category/";

/**
 * A chip value as a URL segment: camelCase split, lower case, anything but letters
 * and digits a hyphen ("busStop" -> "bus-stop", "Panel houses" -> "panel-houses").
 * Idempotent, so a slug is its own slug: the view state holds slugs, and a chip
 * matches by its value's slug (chipMatches).
 */
export function chipSlug(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Whether a chip value is the picked one (the view state holds slugs; a raw value matches too). */
export function chipMatches(value: string, picked: string | null): boolean {
  return picked !== null && chipSlug(value) === chipSlug(picked);
}

/** The view a URL shows. `search` is `location.search`, `pathname` is `location.pathname`. */
export function parseView(search: string, pathname = "/"): ViewState {
  const p = new URLSearchParams(search);
  const sort = column(p.get("sort") ?? "") ? p.get("sort")! : DEFAULT_SORT;
  const rawDir = p.get("dir");
  const dir: SortDir = rawDir === "asc" || rawDir === "desc" ? rawDir : column(sort)!.dir;
  const route = parsePath(pathname);
  const model = route.model ?? (p.get("model") || null);
  // the tab and the node belong to an open model; a node only to the source tab
  const rawTab = p.get("tab") as DetailTab | null;
  const tab: DetailTab = model && rawTab && DETAIL_TABS.includes(rawTab) ? rawTab : "specs";
  const node = tab === "source" ? p.get("node") : null;
  const stage: Stage = model && p.get("stage") === "openttd" ? "openttd" : "3d";
  const params: Record<string, string> = {};
  if (model) for (const [k, v] of p) if (k.startsWith("p.") && k.length > 2 && v) params[k.slice(2)] = v;
  // the chips from a category path, else as the Creator writes them: ?cat=<group>&sub=<l2>&sub2=<l3>, each only under the one above
  const chips = route.chips ?? [p.get("cat"), p.get("sub"), p.get("sub2")];
  const rawGroup = readChip(chips[0] ?? null);
  const group = rawGroup !== null && GROUP_IDS.has(rawGroup) ? rawGroup : null;
  const l2 = group !== null ? readChip(chips[1] ?? null) : null;
  const l3 = l2 !== null ? readChip(chips[2] ?? null) : null;
  const country = readChip(p.get("country"));
  return {
    q: p.get("q") ?? "",
    layout: p.get("view") === "thumbs" ? "thumbs" : "table",
    group,
    l2,
    l3,
    sort,
    dir,
    model,
    tab,
    node: node ?? null,
    stage,
    params,
    country,
    section: p.get("section") === "workshop" ? "workshop" : "catalog",
  };
}

/** A model or category path's parts; neither for `/` or any other path. */
function parsePath(pathname: string): { model?: string; chips?: (string | null)[] } {
  const parts = pathname.split("/").filter((s) => s !== "");
  let decoded: string[];
  try {
    decoded = parts.map((s) => decodeURIComponent(s));
  } catch {
    return {};
  }
  if (`/${decoded[0]}/` === MODEL_PATH && decoded.length === 2) return { model: decoded[1]! };
  if (`/${decoded[0]}/` === CATEGORY_PATH && decoded.length >= 2 && decoded.length <= 4) return { chips: decoded.slice(1) };
  return {};
}

/** A chip value from the address bar, sanitized by shape and slugged: one that matches nothing simply lists nothing. */
function readChip(raw: string | null): string | null {
  if (!raw || raw.length > 40) return null;
  return chipSlug(raw) || null;
}

/** The path of a chip pick: `/category/<group>/[<l2>/[<l3>/]]`, or `/` for none. */
export function categoryPath(c: ChipPath): string {
  if (!c.group) return "/";
  let path = `${CATEGORY_PATH}${c.group}/`;
  if (c.l2) {
    path += `${chipSlug(c.l2)}/`;
    if (c.l3) path += `${chipSlug(c.l3)}/`;
  }
  return path;
}

/** The path of a model's page. */
export function modelPath(id: string): string {
  return `${MODEL_PATH}${encodeURIComponent(id)}/`;
}

/** The page a view is: its model's, else its chips' category, else `/`. */
export function viewPath(v: ViewState): string {
  return v.model ? modelPath(v.model) : categoryPath(v);
}

/**
 * The query string of a view, beside its path (viewPath); defaults are left out, so
 * the bare list is a bare `?`-less URL. A model page carries the list's chips here.
 */
export function serializeView(v: ViewState): string {
  const p = new URLSearchParams();
  if (v.q) p.set("q", v.q);
  if (v.layout === "thumbs") p.set("view", "thumbs");
  if (v.model && v.group) {
    p.set("cat", v.group);
    if (v.l2) {
      p.set("sub", chipSlug(v.l2));
      if (v.l3) p.set("sub2", chipSlug(v.l3));
    }
  }
  if (v.country) p.set("country", chipSlug(v.country));
  if (v.section === "workshop") p.set("section", "workshop");
  if (v.sort !== DEFAULT_SORT) p.set("sort", v.sort);
  if (v.dir !== (column(v.sort)?.dir ?? DEFAULT_DIR)) p.set("dir", v.dir);
  if (v.model) {
    if (v.tab !== "specs") p.set("tab", v.tab);
    if (v.tab === "source" && v.node != null) p.set("node", v.node);
    if (v.stage === "openttd") p.set("stage", "openttd");
    for (const k of Object.keys(v.params).sort()) p.set(`p.${k}`, v.params[k]!);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** The whole site-relative URL of a view: its path and its query. The inverse of parseView. */
export function viewUrl(v: ViewState): string {
  return `${viewPath(v)}${serializeView(v)}`;
}

// ------------------------------------------------------------- parameters

/** One parameter of a record (its spec as the catalog carries it). */
type RecordParam = NonNullable<CatalogRecord["params"]>[number];

/** The values of a parameter offered under the values chosen before it (a value's `when`, design.ts ParamValue). */
export function offeredValues(p: RecordParam, chosen: Record<string, string>): RecordParam["values"] {
  return p.values.filter((v) => !v.when || v.when.values.includes(chosen[v.when.name] ?? ""));
}

/**
 * A parametric record's values: retired tokens migrate first, then each parameter takes the chosen value
 * when its enum lists it, else its default; names it does not declare are
 * dropped, and so is a parameter whose condition (`when`) the values before it
 * do not meet. A fixed record has none.
 */
export function effectiveParams(r: CatalogRecord, chosen: Record<string, string>): Record<string, string> {
  for (const p of r.params ?? []) {
    const replacement = p.retired?.[chosen[p.name] ?? ""];
    if (replacement) chosen = { ...chosen, ...replacement };
  }
  const out: Record<string, string> = {};
  for (const p of r.params ?? []) {
    // a conditional parameter (a TGV's car count) is absent where it does not apply
    if (p.when && !p.when.values.includes(out[p.when.name] ?? "")) continue;
    // a value the values before it do not offer (the MTR's Disneyland livery on a trailer) falls back too
    out[p.name] = offeredValues(p, out).some((v) => v.value === chosen[p.name]) ? chosen[p.name]! : p.default;
  }
  return out;
}

/** The values that differ from the defaults: what the URL keeps. */
export function nonDefaultParams(r: CatalogRecord, values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of r.params ?? []) if (values[p.name] !== undefined && values[p.name] !== p.default) out[p.name] = values[p.name]!;
  return out;
}

/** True when every parameter is at its default, i.e. the thumbnail and source tree show the model. */
export function isDefaultParams(r: CatalogRecord, values: Record<string, string>): boolean {
  return Object.keys(nonDefaultParams(r, effectiveParams(r, values))).length === 0;
}

/**
 * How many variants a model has: every combination of its parameters' values, a
 * conditional parameter counted only where it applies; 1 for a fixed model.
 * Counted without listing them (a commercial family has thousands): the
 * combinations so far are grouped by the values a later condition reads.
 */
export function variantCount(r: CatalogRecord): number {
  const specs = r.params ?? [];
  const read = new Set(specs.flatMap((p) => [...(p.when ? [p.when.name] : []), ...p.values.flatMap((v) => (v.when ? [v.when.name] : []))]));
  let states = new Map<string, { values: Record<string, string>; count: number }>([["", { values: {}, count: 1 }]]);
  for (const p of specs) {
    const next = new Map<string, { values: Record<string, string>; count: number }>();
    const add = (values: Record<string, string>, count: number) => {
      const key = JSON.stringify([...read].map((n) => values[n] ?? ""));
      const at = next.get(key);
      if (at) at.count += count;
      else next.set(key, { values, count });
    };
    for (const st of states.values()) {
      if (p.when && !p.when.values.includes(st.values[p.when.name] ?? "")) add(st.values, st.count);
      else for (const v of offeredValues(p, st.values)) add(read.has(p.name) ? { ...st.values, [p.name]: v.value } : st.values, st.count);
    }
    states = next;
  }
  let total = 0;
  for (const st of states.values()) total += st.count;
  return total;
}

/** The most variants the thumbnail view shows of one model. */
export const MAX_SHOWN_VARIANTS = 10;

/**
 * The variants that show a model best, at most `max`, as non-default values: the
 * defaults first, then each other value of each parameter with the rest at their
 * defaults, taken in turns across the parameters (each one's second value, then
 * each one's third...), so a model with a livery and a length shows both. A
 * conditional parameter is varied under the first value that enables it.
 */
export function representativeVariants(r: CatalogRecord, max = MAX_SHOWN_VARIANTS): Record<string, string>[] {
  const specs = r.params ?? [];
  const defaults = effectiveParams(r, {});
  const lanes = specs.map((p) => {
    const base = p.when && !p.when.values.includes(defaults[p.when.name] ?? "") ? { ...defaults, [p.when.name]: p.when.values[0]! } : defaults;
    const others = p.values.filter((v) => v.value !== p.default);
    // under an enabling value the parameter's default is a variant of its own;
    // a conditional value is shown under the first value that offers it
    const under = (v: RecordParam["values"][number]) => (v.when && !v.when.values.includes(base[v.when.name] ?? "") ? { ...base, [v.when.name]: v.when.values[0]! } : base);
    return [...(base === defaults ? [] : [{ ...base, [p.name]: p.default }]), ...others.map((v) => ({ ...under(v), [p.name]: v.value }))];
  });
  const out: Record<string, string>[] = [{}];
  const seen = new Set([previewKey(r.id, {})]);
  for (let i = 0; out.length < max && lanes.some((l) => i < l.length); i++) {
    for (const lane of lanes) {
      if (out.length >= max) break;
      const chosen = lane[i];
      if (!chosen) continue;
      const values = nonDefaultParams(r, effectiveParams(r, chosen));
      const key = previewKey(r.id, values);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(values);
    }
  }
  // Slots left over (a few parameters of few values each): combinations, spread
  // evenly over every variant, so they mix the parameters rather than vary one.
  if (out.length < max && variantCount(r) <= MAX_SPREAD_COMBINATIONS) {
    const all = [...combinations(r)].filter((c) => !seen.has(previewKey(r.id, c)));
    const want = Math.min(max - out.length, all.length);
    for (let i = 0; i < want; i++) out.push(all[Math.floor(((i + 0.5) * all.length) / want)]!);
  }
  return out;
}

/** The most variants representativeVariants lists to spread its leftover slots over. */
const MAX_SPREAD_COMBINATIONS = 20_000;

/** Every variant of a model as non-default values, the defaults first (design.ts paramCombinations). */
function* combinations(r: CatalogRecord, from = 0, chosen: Record<string, string> = {}): Generator<Record<string, string>> {
  const specs = r.params ?? [];
  const p = specs[from];
  if (!p) {
    yield nonDefaultParams(r, chosen);
    return;
  }
  if (p.when && !p.when.values.includes(chosen[p.when.name] ?? "")) {
    yield* combinations(r, from + 1, chosen);
    return;
  }
  for (const v of [p.default, ...offeredValues(p, chosen).map((x) => x.value).filter((x) => x !== p.default)]) yield* combinations(r, from + 1, { ...chosen, [p.name]: v });
}

/** A variant's short name for a thumbnail caption: its non-default values' titles, or "Default". */
export function variantCaption(r: CatalogRecord, values: Record<string, string>): string {
  const parts = (r.params ?? []).flatMap((p) => {
    const v = values[p.name];
    return v === undefined || v === p.default ? [] : [p.values.find((x) => x.value === v)?.title ?? v];
  });
  return parts.length ? parts.join(" / ") : "Default";
}

/** Bump when the browser thumbnail's framing, lighting or size changes: part of every cache key. */
export const VARIANT_THUMB_VERSION = 2;

/**
 * The browser-rendered thumbnail cache key of a model variant: the model's id and
 * build (its JS hash, or its size for a catalog without one), the variant's
 * resolved values and the renderer's version. Values equal to the defaults, or
 * names the model does not take, give the same key as leaving them out.
 */
export function variantThumbKey(r: CatalogRecord, values: Record<string, string>): string {
  const resolved = effectiveParams(r, values);
  const canon = Object.keys(resolved).sort().map((k) => `${k}=${resolved[k]}`).join("&");
  return `${r.id}|${r.jsHash ?? `b${r.jsBytes}`}|${canon}|v${VARIANT_THUMB_VERSION}`;
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
 * (`userData.rig`): each JS build carries the
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
/** Which level a preview builds: the full model, its low LOD (true), a tree's coarse level, or optional Max detail. */
export type PreviewLod = boolean | "coarse" | "max";

/** Resolve a retained selector choice when moving to another model. */
export function previewLod(record: Pick<CatalogRecord, "coarse" | "maxDetail">, detail: "full" | "low" | "coarse" | "max"): PreviewLod {
  if (detail === "max") return record.maxDetail ? "max" : false;
  if (detail === "coarse") return record.coarse ? "coarse" : true;
  return detail === "low";
}

export function previewKey(id: string, params: Record<string, string>, lod: PreviewLod = false): string {
  return `${id}?${JSON.stringify(Object.keys(params).sort().map((k) => [k, params[k]]))}${lod ? `&lod=${lod}` : ""}`;
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
