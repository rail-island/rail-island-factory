// The committed OpenTTD id table (generator/openttdIds.json, generator/openttdIds.ts;
// docs/site/openttd-export.md, "Ids"): every exported model, preset and formation
// has its ids, the ranges hold, no two blocks overlap, and the table only grows.

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES, catalogFields } from "../generator/generate";
import { catalogOpenttd, openttdFeatureOf } from "../generator/openttd";
import { formationKey, idsOf, OPENTTD_ID_TABLE, presetKey, updateIds, wantedIds, type IdTable, type WantedIds } from "../generator/openttdIds";
import {
  blockSizeFor, FIRST_LOCAL_ID, HASHED_FIRST_ID, LAST_TABLE_ID, MAX_PARTS, MIN_BLOCK, MODEL_GRF_FIRST, MODEL_GRF_LAST, oneClickItems, presetBlock,
} from "../src/openttd/properties";
import type { CatalogRecord } from "../src/catalogQuery";

const wanted = (): WantedIds[] => ALL_VEHICLES.flatMap((d) => {
  const f = openttdFeatureOf(catalogFields(d));
  return f ? [wantedIds(d, f)] : [];
});

const empty = (): IdTable => ({ version: 1, grf: {}, vehicles: { train: {}, road: {}, ship: {}, aircraft: {} }, aliases: {} });

describe("the committed id table", () => {
  it("is up to date: nothing to add or retire (run `pnpm openttd:ids`)", () => {
    const measure = (): number => { throw new Error("nothing new should be measured"); };
    expect(updateIds(OPENTTD_ID_TABLE, wanted(), measure)).toEqual(OPENTTD_ID_TABLE);
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
        expect(b.size >= MIN_BLOCK && b.size <= MAX_PARTS).toBe(true);
        if (i > 0) expect(b.id).toBeGreaterThanOrEqual(sorted[i - 1]!.id + sorted[i - 1]!.size);
      }
    }
    expect(LAST_TABLE_ID).toBeLessThan(HASHED_FIRST_ID);
  });

  it("reaches the catalog: the CD 163's GRF and its presets' blocks", () => {
    const d = ALL_VEHICLES.find((x) => x.id === "proc-vehicle-cd-163")!;
    const ids = catalogOpenttd(d, catalogFields(d))!.ids!;
    expect(ids.grf).toBe(OPENTTD_ID_TABLE.grf[d.id]);
    const own = OPENTTD_ID_TABLE.vehicles.train[presetKey(d.id, {})]!;
    expect(ids.presets[0]).toEqual({ id: own.id, size: own.size });
    expect(ids.presets).toHaveLength(d.openttd!.presets!.length);
    const r = { id: d.id, openttd: { ...catalogOpenttd(d, catalogFields(d)) } } as unknown as CatalogRecord;
    const items = oneClickItems(r);
    expect(items.map((i) => ({ id: i.baseId, size: i.blockSize }))).toEqual(ids.presets);
    // an export-list entry that is a preset keeps its ids; any other is hashed
    expect(presetBlock(r, { livery: "cd362" })).toEqual(ids.presets[d.openttd!.presets!.findIndex((p) => p.livery === "cd362")]);
    expect(presetBlock(r, { livery: "cd163No022" })).toBeUndefined();
  });
});

describe("updateIds", () => {
  const w = (model: string, presets: string[], formations: string[] = []): WantedIds => ({
    model, feature: "train",
    presets: presets.map((p) => ({ key: `${model}?${p}`, cars: [{ params: {} }] })),
    formations: formations.map((f) => ({ key: formationKey(model, f), cars: [{ params: {} }, { params: {} }] })),
  });
  // a car is 3 parts: a preset reserves 6, a two-car formation (6 parts) 12
  const measure = (_: WantedIds, item: { cars: unknown[] }): number => 3 * item.cars.length;

  it("sizes a new block to twice its measured parts, within MIN_BLOCK..MAX_PARTS", () => {
    expect([1, 2, 3, 15, 16, 32].map(blockSizeFor)).toEqual([4, 4, 6, 30, 32, 32]);
  });

  it("appends: a new model the next GRF id, a new item the next free block", () => {
    const t1 = updateIds(empty(), [w("a", ["", "livery=red"], ["4 cars"])], measure);
    expect(t1.grf).toEqual({ a: 1 });
    expect(t1.vehicles.train).toEqual({
      "a?": { id: 0x100, size: 6 }, "a?livery=red": { id: 0x106, size: 6 }, "a?formation=4 cars": { id: 0x10c, size: 12 },
    });
    const t2 = updateIds(t1, [w("a", ["", "livery=red", "livery=blue"], ["4 cars"]), w("b", [""])], measure);
    expect(t2.grf).toEqual({ a: 1, b: 2 });
    expect(t2.vehicles.train["a?livery=blue"]).toEqual({ id: 0x118, size: 6 });
    expect(t2.vehicles.train["b?"]).toEqual({ id: 0x11e, size: 6 });
    expect(t2.vehicles.train["a?"]).toEqual(t1.vehicles.train["a?"]);
  });

  it("keeps an existing block's size, measuring only what is new", () => {
    const old: IdTable = { ...empty(), grf: { a: 1 }, vehicles: { ...empty().vehicles, train: { "a?": { id: 0x100, size: 16 } } } };
    const asked: string[] = [];
    const t = updateIds(old, [w("a", ["", "livery=red"])], (_, item) => { asked.push(item.key); return 2; });
    expect(asked).toEqual(["a?livery=red"]);
    expect(t.vehicles.train).toEqual({ "a?": { id: 0x100, size: 16 }, "a?livery=red": { id: 0x110, size: 4 } });
  });

  it("retires what is no longer exported, never reusing its ids, and revives it", () => {
    const t1 = updateIds(empty(), [w("a", ["", "livery=red"])], measure);
    const t2 = updateIds(t1, [w("a", [""])], measure);
    expect(t2.vehicles.train["a?livery=red"]).toEqual({ id: 0x106, size: 6, retired: true });
    const t3 = updateIds(t2, [w("a", ["", "livery=blue"])], measure);
    expect(t3.vehicles.train["a?livery=blue"]!.id).toBe(0x10c);
    expect(updateIds(t3, [w("a", ["", "livery=red"])], measure).vehicles.train["a?livery=red"]).toEqual({ id: 0x106, size: 6 });
  });

  it("hands a renamed item its old block through an alias", () => {
    const t1 = updateIds(empty(), [w("a", [""], ["4 cars"])], measure);
    const t2 = updateIds({ ...t1, aliases: { [formationKey("a", "four cars")]: formationKey("a", "4 cars") } }, [w("a", [""], ["four cars"])], measure);
    expect(t2.vehicles.train[formationKey("a", "four cars")]).toEqual({ id: 0x106, size: 12 });
    expect(t2.vehicles.train[formationKey("a", "4 cars")]!.retired).toBe(true);
  });

  it("names a design's ids, or none while the table lacks one", () => {
    const d = ALL_VEHICLES.find((x) => x.id === "proc-vehicle-shinkansen-0")!;
    expect(idsOf(d, "train")!.formations).toHaveLength(1);
    expect(idsOf(d, "train", empty())).toBeNull();
  });
});
