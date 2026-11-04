// The committed OpenTTD id table (generator/openttdIds.json, generator/openttdIds.ts;
// docs/site/openttd-export.md, "Ids"): every exported model, preset and formation
// has its ids, the ranges hold, no two blocks overlap, and the table only grows.

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES, catalogFields } from "../generator/generate";
import { catalogOpenttd, openttdFeatureOf } from "../generator/openttd";
import { formationKey, idsOf, OPENTTD_ID_TABLE, presetKey, updateIds, wantedIds, type IdTable, type WantedIds } from "../generator/openttdIds";
import {
  FIRST_LOCAL_ID, FORMATION_BLOCK, HASHED_FIRST_ID, LAST_TABLE_ID, MODEL_GRF_FIRST, MODEL_GRF_LAST, oneClickItems, PRESET_BLOCK, presetBaseId,
} from "../src/openttd/properties";
import type { CatalogRecord } from "../src/catalogQuery";

const wanted = (): WantedIds[] => ALL_VEHICLES.flatMap((d) => {
  const f = openttdFeatureOf(catalogFields(d));
  return f ? [wantedIds(d, f)] : [];
});

const empty = (): IdTable => ({ version: 1, grf: {}, vehicles: { train: {}, road: {}, ship: {}, aircraft: {} }, aliases: {} });

describe("the committed id table", () => {
  it("is up to date: nothing to add or retire (run `pnpm openttd:ids`)", () => {
    expect(updateIds(OPENTTD_ID_TABLE, wanted())).toEqual(OPENTTD_ID_TABLE);
  });

  it("gives every model a GRF id of the models' half, once", () => {
    const ids = Object.values(OPENTTD_ID_TABLE.grf);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id >= MODEL_GRF_FIRST && id <= MODEL_GRF_LAST).toBe(true);
  });

  it("keeps every block in the table's range, none overlapping, per vehicle type", () => {
    for (const blocks of Object.values(OPENTTD_ID_TABLE.vehicles)) {
      const sorted = Object.values(blocks).sort((a, b) => a.id - b.id);
      for (const [i, b] of sorted.entries()) {
        expect(b.id).toBeGreaterThanOrEqual(FIRST_LOCAL_ID);
        expect(b.id + b.size - 1).toBeLessThanOrEqual(LAST_TABLE_ID);
        expect([PRESET_BLOCK, FORMATION_BLOCK]).toContain(b.size);
        if (i > 0) expect(b.id).toBeGreaterThanOrEqual(sorted[i - 1]!.id + sorted[i - 1]!.size);
      }
    }
    expect(LAST_TABLE_ID).toBeLessThan(HASHED_FIRST_ID);
  });

  it("reaches the catalog: the CD 163's GRF and its presets' blocks", () => {
    const d = ALL_VEHICLES.find((x) => x.id === "proc-vehicle-cd-163")!;
    const ids = catalogOpenttd(d, catalogFields(d))!.ids!;
    expect(ids.grf).toBe(OPENTTD_ID_TABLE.grf[d.id]);
    expect(ids.presets[0]).toBe(OPENTTD_ID_TABLE.vehicles.train[presetKey(d.id, {})]!.id);
    expect(ids.presets).toHaveLength(d.openttd!.presets!.length);
    const r = { id: d.id, openttd: { ...catalogOpenttd(d, catalogFields(d)) } } as unknown as CatalogRecord;
    const items = oneClickItems(r);
    expect(items.map((i) => i.baseId)).toEqual(ids.presets);
    // an export-list entry that is a preset keeps its ids; any other is hashed
    expect(presetBaseId(r, { livery: "cd362" })).toBe(ids.presets[d.openttd!.presets!.findIndex((p) => p.livery === "cd362")]);
    expect(presetBaseId(r, { livery: "cd163No022" })).toBeUndefined();
  });
});

describe("updateIds", () => {
  const w = (model: string, presets: string[], formations: string[] = []): WantedIds => ({
    model, feature: "train", presets: presets.map((p) => `${model}?${p}`), formations: formations.map((f) => formationKey(model, f)),
  });

  it("appends: a new model the next GRF id, a new item the next free block", () => {
    const t1 = updateIds(empty(), [w("a", ["", "livery=red"], ["4 cars"])]);
    expect(t1.grf).toEqual({ a: 1 });
    expect(t1.vehicles.train).toEqual({
      "a?": { id: 0x100, size: 16 }, "a?livery=red": { id: 0x110, size: 16 }, "a?formation=4 cars": { id: 0x120, size: 32 },
    });
    const t2 = updateIds(t1, [w("a", ["", "livery=red", "livery=blue"], ["4 cars"]), w("b", [""])]);
    expect(t2.grf).toEqual({ a: 1, b: 2 });
    expect(t2.vehicles.train["a?livery=blue"]).toEqual({ id: 0x140, size: 16 });
    expect(t2.vehicles.train["b?"]).toEqual({ id: 0x150, size: 16 });
    expect(t2.vehicles.train["a?"]).toEqual(t1.vehicles.train["a?"]);
  });

  it("retires what is no longer exported, never reusing its ids, and revives it", () => {
    const t1 = updateIds(empty(), [w("a", ["", "livery=red"])]);
    const t2 = updateIds(t1, [w("a", [""])]);
    expect(t2.vehicles.train["a?livery=red"]).toEqual({ id: 0x110, size: 16, retired: true });
    const t3 = updateIds(t2, [w("a", ["", "livery=blue"])]);
    expect(t3.vehicles.train["a?livery=blue"]!.id).toBe(0x120);
    expect(updateIds(t3, [w("a", ["", "livery=red"])]).vehicles.train["a?livery=red"]).toEqual({ id: 0x110, size: 16 });
  });

  it("hands a renamed item its old block through an alias", () => {
    const t1 = updateIds(empty(), [w("a", [""], ["4 cars"])]);
    const t2 = updateIds({ ...t1, aliases: { [formationKey("a", "four cars")]: formationKey("a", "4 cars") } }, [w("a", [""], ["four cars"])]);
    expect(t2.vehicles.train[formationKey("a", "four cars")]).toEqual({ id: 0x110, size: 32 });
    expect(t2.vehicles.train[formationKey("a", "4 cars")]!.retired).toBe(true);
  });

  it("names a design's ids, or none while the table lacks one", () => {
    const d = ALL_VEHICLES.find((x) => x.id === "proc-vehicle-shinkansen-0")!;
    expect(idsOf(d, "train")!.formations).toHaveLength(1);
    expect(idsOf(d, "train", empty())).toBeNull();
  });
});
