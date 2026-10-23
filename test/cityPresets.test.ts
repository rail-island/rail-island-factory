// City presets (generator/cityPresets.ts): the variants the game's cities build of
// each building, exported as game.city.presets. The move from the game was 1:1 --
// the baseline is its old table -- and every preset resolves strictly.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { BUILDINGS, VILLAGE_DESIGNS, catalogFields } from "../generator/generate.ts";
import { exportMeta, withCityPresets, metaEntry } from "../generator/catalog.ts";
import { NOT_IN_CITIES, checkCityPresets, cityPresetsOf } from "../generator/cityPresets.ts";

const baseline = JSON.parse(fs.readFileSync(new URL("./fixtures/city-presets-baseline.json", import.meta.url), "utf8")) as { presets: Record<string, Array<Record<string, string>>> };
const all = [...BUILDINGS, ...VILLAGE_DESIGNS];

describe("city presets", () => {
  it("reproduce the game's table exactly (the 1:1 move)", () => {
    const got: Record<string, Array<Record<string, string>>> = {};
    for (const d of all) {
      const presets = cityPresetsOf(d.id, catalogFields(d).group, d.game?.city);
      if (presets.length) got[d.id] = presets.map((p) => p.params ?? {});
    }
    expect(got).toEqual(baseline.presets);
  });

  it("resolve strictly, name only non-default values and never repeat a variant", () => {
    for (const d of all) checkCityPresets(d.id, d.params, cityPresetsOf(d.id, catalogFields(d).group, d.game?.city));
  });

  it("refuse a preset that does not resolve or repeats one", () => {
    const castle = all.find((d) => d.id === "proc-building-castle")!;
    expect(() => checkCityPresets(castle.id, castle.params, [{ params: { layout: "nonsense" } }])).toThrow(/does not resolve/);
    expect(() => checkCityPresets(castle.id, castle.params, [{}, {}])).toThrow(/same variant/);
  });

  it("give a new design in a pool family its family default, and none to an opted-out or pool-less one", () => {
    expect(cityPresetsOf("proc-building-commercial-new", "commercial")).toHaveLength(4);
    expect(cityPresetsOf("proc-building-sky-twin-towers", "skyscraper_c")).toEqual([]);
    expect(cityPresetsOf("proc-building-station-hotel", undefined)).toEqual([]);
    for (const id of NOT_IN_CITIES) expect(all.some((d) => d.id === id), id).toBe(true);
  });

  it("export them as game.city.presets on the building entries", () => {
    const meta = exportMeta(all.filter((d) => ["proc-building-castle", "proc-building-sky-twin-towers"].includes(d.id)));
    const castle = meta.buildings.find((b) => b.id === "proc-building-castle")!;
    expect(castle.game?.city?.presets).toEqual([{}, { params: { layout: "keep" } }, { params: { layout: "fortress" } }]);
    expect(meta.buildings.find((b) => b.id === "proc-building-sky-twin-towers")!.game?.city).toBeUndefined();
    const fountain = all.find((d) => d.id === "proc-building-fountain-modern")!;
    expect(withCityPresets(metaEntry(fountain, catalogFields(fountain)), fountain).game?.city?.presets).toEqual([{}]);
  });
});
