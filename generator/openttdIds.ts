// The committed OpenTTD id table (generator/openttdIds.json; docs/site/openttd-export.md,
// "Ids"): the GRF id of every model's one-click download and the block of part ids
// of every preset and formation, unique across all models per OpenTTD vehicle
// type, so a saved game keeps its vehicles whatever else changes. Ids are only
// ever appended (`pnpm openttd:ids`), never reused: a key no longer exported stays,
// retired, and a renamed one takes its old block through an alias.

import {
  blockSize, FIRST_LOCAL_ID, LAST_TABLE_ID, MODEL_GRF_FIRST, MODEL_GRF_LAST, type OpenttdFeature,
} from "../src/openttd/properties.ts";
import type { OpenttdIds, ParamValues, ProceduralDesign } from "./design.ts";
import TABLE_JSON from "./openttdIds.json";

/** One block of part ids: its first id and how many it holds. */
export interface IdBlock {
  id: number;
  size: number;
  /** Set on a key no longer exported: its ids stay taken. */
  retired?: true;
}

export interface IdTable {
  version: 1;
  /** Model id -> its one-click GRF id's low 16 bits. */
  grf: Record<string, number>;
  /** Per vehicle type: item key -> its block. */
  vehicles: Record<OpenttdFeature, Record<string, IdBlock>>;
  /** A renamed item's new key -> the old key whose block it takes. */
  aliases: Record<string, string>;
}

export const OPENTTD_ID_TABLE = TABLE_JSON as IdTable;

/** A preset's key: its model and sorted non-default values ("proc-vehicle-cd-163?livery=cd362"). */
export function presetKey(model: string, params: ParamValues): string {
  return `${model}?${Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&")}`;
}

/** A formation's key ("proc-vehicle-shinkansen-0?formation=8 cars"). */
export function formationKey(model: string, name: string): string {
  return `${model}?formation=${name}`;
}

/** What one exported design needs of the table: its type and its items' keys and block sizes. */
export interface WantedIds {
  model: string;
  feature: OpenttdFeature;
  presets: string[];
  formations: string[];
}

export function wantedIds(design: ProceduralDesign, feature: OpenttdFeature): WantedIds {
  const o = design.openttd ?? {};
  return {
    model: design.id,
    feature,
    presets: (o.presets ?? [{}]).map((p) => presetKey(design.id, p)),
    formations: (o.formations ?? []).map((f) => formationKey(design.id, f.name)),
  };
}

/**
 * The table with every wanted key given an id: a new model the next GRF id, a
 * new item (or one whose old key an alias names) the next free block of its
 * size; keys no longer wanted are marked retired, never removed. Returns the
 * table unchanged (deep-equal) when nothing is missing.
 */
export function updateIds(table: IdTable, wanted: readonly WantedIds[]): IdTable {
  const out: IdTable = JSON.parse(JSON.stringify(table)) as IdTable;
  for (const f of ["train", "road", "ship", "aircraft"] as const) out.vehicles[f] ??= {};
  out.aliases ??= {};
  let nextGrf = Math.max(MODEL_GRF_FIRST - 1, ...Object.values(out.grf)) + 1;
  const live = new Set<string>();
  for (const w of wanted) {
    if (out.grf[w.model] === undefined) {
      if (nextGrf > MODEL_GRF_LAST) throw new Error("the model GRF ids are used up");
      out.grf[w.model] = nextGrf++;
    }
    const blocks = out.vehicles[w.feature];
    let next = Math.max(FIRST_LOCAL_ID, ...Object.values(blocks).map((b) => b.id + b.size));
    const add = (key: string, size: number) => {
      live.add(`${w.feature}:${key}`);
      if (blocks[key]) {
        delete blocks[key]!.retired;
        return;
      }
      const old = out.aliases[key];
      if (old && blocks[old] && blocks[old]!.size >= size) {
        blocks[key] = { id: blocks[old]!.id, size: blocks[old]!.size };
        return;
      }
      if (next + size - 1 > LAST_TABLE_ID) throw new Error(`the ${w.feature} table ids are used up`);
      blocks[key] = { id: next, size };
      next += size;
    };
    for (const k of w.presets) add(k, blockSize({}));
    for (const k of w.formations) add(k, blockSize({ formation: "x" }));
  }
  for (const f of ["train", "road", "ship", "aircraft"] as const) {
    for (const [key, block] of Object.entries(out.vehicles[f])) {
      // an aliased old key hands its block on: it stays retired
      if (!live.has(`${f}:${key}`)) block.retired = true;
    }
  }
  return sortTable(out);
}

/** Keys in sorted order, so the file is written deterministically. */
function sortTable(t: IdTable): IdTable {
  const sorted = <T,>(o: Record<string, T>): Record<string, T> => Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  return {
    version: 1,
    grf: sorted(t.grf),
    vehicles: { train: sorted(t.vehicles.train), road: sorted(t.vehicles.road), ship: sorted(t.vehicles.ship), aircraft: sorted(t.vehicles.aircraft) },
    aliases: sorted(t.aliases),
  };
}

/** A design's ids from the table, or null when the table lacks any of them (run `pnpm openttd:ids`). */
export function idsOf(design: ProceduralDesign, feature: OpenttdFeature, table: IdTable = OPENTTD_ID_TABLE): OpenttdIds | null {
  const w = wantedIds(design, feature);
  const grf = table.grf[w.model];
  const blocks = table.vehicles[feature] ?? {};
  const presets = w.presets.map((k) => blocks[k]);
  const formations = w.formations.map((k) => blocks[k]);
  if (grf === undefined || presets.some((b) => !b || b.retired) || formations.some((b) => !b || b.retired)) return null;
  return { grf, presets: presets.map((b) => b!.id), formations: formations.map((b) => b!.id) };
}
