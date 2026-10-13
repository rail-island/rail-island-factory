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
  { key: "glbBytes", label: "GLB", unit: null, type: "bytes", dir: "desc", table: true, value: (r) => r.glbBytes },
  { key: "primitives", label: "Prims", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.primitives },
  { key: "materials", label: "Mats", unit: null, type: "num", dir: "desc", table: true, value: (r) => r.materials },
  { key: "thumbBytes", label: "Thumbnail", unit: null, type: "bytes", dir: "desc", table: false, value: (r) => r.thumbBytes },
  { key: "sizeX", label: "Width", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeX },
  { key: "sizeZ", label: "Depth", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeZ },
  { key: "sizeY", label: "Height", unit: "m", type: "num", dir: "desc", table: true, value: (r) => r.sizeY },
  { key: "defaultScale", label: "Scale", unit: null, type: "num", dir: "desc", table: false, value: (r) => r.defaultScale },
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

export function queryRows(rows: readonly Row[], q: string, sort: string, dir: SortDir): Row[] {
  const col = column(sort) ?? column(DEFAULT_SORT)!;
  return rows.filter((r) => matches(r, q)).sort((a, b) => compareRows(a, b, col, dir));
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

// ------------------------------------------------------------- the URL state

/**
 * What the query string carries: the search, the ordering and the open model. All
 * of it lives in the URL so back/forward walks it and a link can share a model.
 */
export interface ViewState {
  q: string;
  sort: string;
  dir: SortDir;
  /** The id of the model whose detail page is open, or null for the list. */
  model: string | null;
}

export function parseView(search: string): ViewState {
  const p = new URLSearchParams(search);
  const sort = column(p.get("sort") ?? "") ? p.get("sort")! : DEFAULT_SORT;
  const rawDir = p.get("dir");
  const dir: SortDir = rawDir === "asc" || rawDir === "desc" ? rawDir : column(sort)!.dir;
  return { q: p.get("q") ?? "", sort, dir, model: p.get("model") || null };
}

/** The inverse of parseView; defaults are left out, so the bare list is a bare `?`-less URL. */
export function serializeView(v: ViewState): string {
  const p = new URLSearchParams();
  if (v.q) p.set("q", v.q);
  if (v.sort !== DEFAULT_SORT) p.set("sort", v.sort);
  if (v.dir !== (column(v.sort)?.dir ?? DEFAULT_DIR)) p.set("dir", v.dir);
  if (v.model) p.set("model", v.model);
  const s = p.toString();
  return s ? `?${s}` : "";
}
