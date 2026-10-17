// The export list: the model variants a visitor has added from model pages, kept
// in the browser's localStorage under one key and exported as a GRF for OpenTTD
// or as a ZIP of GLBs (docs/site/openttd-export.md).
//
// The pure functions (parse, add, remove, file names) take no DOM, so
// test/exportList.test.ts drives them in node; `loadExport` and `saveExport`
// are the only ones that touch storage.

import type { CatalogRecord } from "../generator/catalog.ts";
import { effectiveParams, nonDefaultParams } from "./catalogQuery";

/** The localStorage key; a future format bumps `version` in the value, not the key. */
export const EXPORT_KEY = "factory.openttdExport";
export const EXPORT_VERSION = 1;
export const DEFAULT_SET_NAME = "Rail Island Factory set";

/** One model variant in the export: a model id and its non-default parameter values. */
export interface ExportEntry {
  id: string;
  params: Record<string, string>;
}

export interface ExportState {
  name: string;
  entries: ExportEntry[];
}

/** The stored value. */
interface StoredExport {
  version: number;
  name: string;
  entries: ExportEntry[];
}

export const EMPTY_EXPORT: ExportState = { name: DEFAULT_SET_NAME, entries: [] };

/** One entry's identity: the model id and its sorted non-default values. */
export function entryKey(e: ExportEntry): string {
  return `${e.id}?${Object.keys(e.params).sort().map((k) => `${k}=${e.params[k]}`).join("&")}`;
}

/** Whether `entries` already holds this model variant. */
export function hasEntry(entries: readonly ExportEntry[], e: ExportEntry): boolean {
  const key = entryKey(e);
  return entries.some((x) => entryKey(x) === key);
}

/** Add a model variant at the end; an identical one already listed makes this a no-op. */
export function addEntry(state: ExportState, e: ExportEntry): ExportState {
  if (hasEntry(state.entries, e)) return state;
  return { ...state, entries: [...state.entries, { id: e.id, params: { ...e.params } }] };
}

/** Remove one model variant. */
export function removeEntry(state: ExportState, e: ExportEntry): ExportState {
  const key = entryKey(e);
  return { ...state, entries: state.entries.filter((x) => entryKey(x) !== key) };
}

/**
 * The entry a model page adds: the model with the chosen values, keeping only
 * those that differ from the defaults.
 */
export function entryFor(r: CatalogRecord, chosen: Record<string, string>): ExportEntry {
  return { id: r.id, params: nonDefaultParams(r, effectiveParams(r, chosen)) };
}

/**
 * The stored export, checked against the catalog: an entry whose model no
 * longer exists, or whose parameter values the model no longer takes, is dropped
 * and counted; duplicates collapse. An unreadable value or an unknown version
 * starts empty.
 */
export function parseExport(raw: string | null, records: readonly CatalogRecord[]): { state: ExportState; dropped: number } {
  if (!raw) return { state: EMPTY_EXPORT, dropped: 0 };
  let stored: StoredExport;
  try {
    stored = JSON.parse(raw) as StoredExport;
  } catch {
    return { state: EMPTY_EXPORT, dropped: 0 };
  }
  if (!stored || stored.version !== EXPORT_VERSION || !Array.isArray(stored.entries)) return { state: EMPTY_EXPORT, dropped: 0 };
  const byId = new Map(records.map((r) => [r.id, r]));
  let state: ExportState = { name: typeof stored.name === "string" && stored.name.trim() ? stored.name : DEFAULT_SET_NAME, entries: [] };
  let dropped = 0;
  for (const e of stored.entries) {
    const r = e && typeof e.id === "string" ? byId.get(e.id) : undefined;
    const params = e && typeof e.params === "object" && e.params ? (e.params as Record<string, string>) : {};
    const normal = r ? nonDefaultParams(r, effectiveParams(r, params)) : null;
    if (!r || !normal || entryKey({ id: r.id, params: normal }) !== entryKey({ id: r.id, params })) {
      dropped++;
      continue;
    }
    if (hasEntry(state.entries, { id: r.id, params })) {
      dropped++;
      continue;
    }
    state = addEntry(state, { id: r.id, params });
  }
  return { state, dropped };
}

/** The value written to storage. */
export function serializeExport(state: ExportState): string {
  const stored: StoredExport = { version: EXPORT_VERSION, name: state.name, entries: state.entries };
  return JSON.stringify(stored);
}

/** Read the stored export; storage that throws (a private window) reads as empty. */
export function loadExport(records: readonly CatalogRecord[]): { state: ExportState; dropped: number } {
  try {
    return parseExport(localStorage.getItem(EXPORT_KEY), records);
  } catch {
    return { state: EMPTY_EXPORT, dropped: 0 };
  }
}

/** Write the export; storage that throws only loses persistence, never the page. */
export function saveExport(state: ExportState): void {
  try {
    localStorage.setItem(EXPORT_KEY, serializeExport(state));
  } catch {
    // private window or full storage: the list still works for this visit
  }
}

/** A file name part from free text: letters, digits, dot, dash and underscore, the rest as "_". */
export function safeName(text: string): string {
  return text.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "export";
}

/** An entry's GLB file name: `<id>.glb`, or `<id>--<name>-<value>[--...].glb` for a variant, names sorted. */
export function glbFileName(e: ExportEntry): string {
  const variant = Object.keys(e.params).sort().map((k) => `--${safeName(k)}-${safeName(e.params[k]!)}`).join("");
  return `${safeName(e.id)}${variant}.glb`;
}

/** The parameter values' titles of an entry, for listing it: "Livery: CD 162", or "" for the defaults. */
export function variantLabel(r: CatalogRecord | undefined, e: ExportEntry): string {
  return Object.keys(e.params).sort().map((k) => {
    const spec = r?.params?.find((p) => p.name === k);
    const value = spec?.values.find((v) => v.value === e.params[k])?.title ?? e.params[k];
    return `${spec?.title ?? k}: ${value}`;
  }).join(", ");
}
