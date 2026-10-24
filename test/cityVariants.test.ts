// City variants (generator/cityVariants.ts): what the game's cities may stand of
// each building -- its shape variants with their measured sizes, its colour values
// tagged with palettes, its height bands and its party-wall sides -- exported as
// game.city. Nothing the old fixed presets built is lost (the baseline is their last
// table), and every value a city samples is described.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { BUILDINGS, VILLAGE_DESIGNS, catalogFields } from "../generator/generate.ts";
import { exportMeta, measuredExtent, metaEntry, withCityUse } from "../generator/catalog.ts";
import { resolveParams } from "../generator/design.ts";
import { CITY_POOLS, NOT_IN_CITIES, cityColours, cityExport, cityShapes, heightBand, inCities } from "../generator/cityVariants.ts";
import { PALETTES } from "../generator/sets/blockType.ts";

const baseline = JSON.parse(fs.readFileSync(new URL("./fixtures/city-presets-baseline.json", import.meta.url), "utf8")) as { presets: Record<string, Array<Record<string, string>>> };
const all = [...BUILDINGS, ...VILLAGE_DESIGNS];
const cityDesigns = all.filter((d) => inCities(d.id, catalogFields(d).group));

describe("city variants", () => {
  it("are offered by exactly the designs the old presets built", () => {
    expect(cityDesigns.map((d) => d.id).sort()).toEqual(Object.keys(baseline.presets).sort());
    for (const id of NOT_IN_CITIES) expect(all.some((d) => d.id === id), id).toBe(true);
  });

  it("still reach every variant an old preset built: its shape is a city shape, its colours a city colour", () => {
    for (const d of cityDesigns) {
      const group = catalogFields(d).group;
      const shapes = cityShapes(d, group, d.game?.city).map((s) => resolveParams(d.params ?? [], s));
      const colours = new Map(cityColours(d).map((c) => [c.name, c.values.map((v) => v.value)]));
      for (const preset of baseline.presets[d.id]!) {
        const shapeOnly = Object.fromEntries(Object.entries(preset).filter(([k]) => !colours.has(k)));
        const want = resolveParams(d.params ?? [], shapeOnly);
        expect(shapes.some((s) => JSON.stringify(s) === JSON.stringify(want)), `${d.id} ${JSON.stringify(preset)}`).toBe(true);
        for (const [k, v] of Object.entries(preset)) if (colours.has(k)) expect(colours.get(k), `${d.id} ${k}`).toContain(v);
      }
    }
  });

  it("list the defaults first and every shape once", () => {
    for (const d of cityDesigns) {
      const shapes = cityShapes(d, catalogFields(d).group, d.game?.city);
      expect(shapes[0], d.id).toEqual({});
      expect(new Set(shapes.map((s) => JSON.stringify(s))).size, d.id).toBe(shapes.length);
    }
  });

  it("tag every colour value with a known palette, leaving only an `original` finish neutral", () => {
    for (const d of cityDesigns) {
      for (const c of cityColours(d)) {
        for (const v of c.values) {
          for (const p of v.palettes) expect(PALETTES as readonly string[]).toContain(p);
          if (v.value !== "original") expect(v.palettes.length, `${d.id} ${c.name}=${v.value}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("give a height band to every storey count a city varies", () => {
    for (const d of cityDesigns) {
      const group = catalogFields(d).group;
      if (!["commercial", "comm_classic", "skyscraper_c"].includes(group)) continue;
      for (const s of cityShapes(d, group, d.game?.city)) expect(heightBand(d, group, s), `${d.id} ${JSON.stringify(s)}`).toBeDefined();
    }
  });

  it("export their sizes, colours and party sides as game.city", () => {
    const pick = all.filter((d) => ["proc-building-castle", "proc-building-sky-twin-towers", "proc-building-commercial-brick", "proc-building-comm-corner-shop"].includes(d.id));
    const meta = exportMeta(pick);
    const castle = meta.buildings.find((b) => b.id === "proc-building-castle")!;
    expect(castle.game?.city?.variants.map((v) => v.params ?? {})).toEqual([{}, { layout: "keep" }, { layout: "fortress" }]);
    const brick = meta.buildings.find((b) => b.id === "proc-building-commercial-brick")!;
    const design = pick.find((d) => d.id === "proc-building-commercial-brick")!;
    expect(brick.game?.city?.party).toEqual(["back", "left", "right"]);
    expect(brick.game?.city?.colours?.map((c) => c.name)).toEqual(["finish"]);
    for (const v of brick.game!.city!.variants) {
      const size = measuredExtent(design, v.params ?? {});
      expect(v.size).toEqual(size.map((n) => Math.round(n * 1e4) / 1e4));
    }
    expect(brick.game!.city!.variants.find((v) => v.params?.storeys === "2")?.band).toBe("low");
    // the corner shop's right side is a second shop front
    expect(meta.buildings.find((b) => b.id === "proc-building-comm-corner-shop")!.game?.city?.party).toEqual(["back", "left"]);
    expect(meta.buildings.find((b) => b.id === "proc-building-sky-twin-towers")!.game?.city).toBeUndefined();
    const fountain = all.find((d) => d.id === "proc-building-fountain-modern")!;
    expect(withCityUse(metaEntry(fountain, catalogFields(fountain)), fountain).game?.city?.variants).toHaveLength(1);
  });

  it("are offered by the city pools only", () => {
    expect(cityExport({ id: "proc-building-station-hotel" }, "station", () => [1, 1, 1])).toBeNull();
    expect(CITY_POOLS.has("commercial")).toBe(true);
  });
});
