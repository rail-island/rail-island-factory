// The facts table (generator/factTable.ts, docs/site/seo-pages.md "Facts"): every key
// is a design, every country code is named, every rail vehicle but the generic
// wagons names a country, every vehicle OpenTTD can hold states a year (the export's
// introduction year, which the OpenTTD table no longer states), and the text is ASCII.

import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate";
import { COUNTRY_NAMES, FACTS, countryOf, yearOf } from "../generator/factTable";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { isDraft } from "../generator/workshop";

/** Rail vehicles drawn for no country's railway. */
const GENERIC_RAIL = new Set([
  "proc-vehicle-legacy-covered-wagon", "proc-vehicle-legacy-open-wagon", "proc-vehicle-legacy-heavy-wagon",
  "proc-vehicle-nas-flat-wagon", "proc-vehicle-ua-open-wagon", "proc-vehicle-eas-open-wagon", "proc-vehicle-raj-hopper-wagon",
  "proc-vehicle-rah-tank-wagon", "proc-vehicle-sqns-container-wagon", "proc-vehicle-pao-flat-wagon", "proc-vehicle-habis-sliding-wall-wagon",
  "proc-vehicle-hadgs-hopper-wagon", "proc-vehicle-faccs-hopper-wagon", "proc-vehicle-falls-hopper-wagon", "proc-vehicle-wap-hopper-wagon",
  "proc-vehicle-dnt-184-5",
]);

const ASCII = /^[\x20-\x7e]+$/;

describe("the facts table", () => {
  it("names only designs that exist, with known country codes, plausible years and ASCII text", () => {
    for (const [id, f] of Object.entries(FACTS)) {
      expect(DESIGNS.has(id), id).toBe(true);
      if (f.country !== undefined) expect(COUNTRY_NAMES[f.country], `${id}: ${f.country}`).toBeDefined();
      if (f.maker !== undefined) expect(f.maker, id).toMatch(ASCII);
      if (f.year !== undefined) expect(Number.isInteger(f.year) && f.year > 0 && f.year <= 2100, id).toBe(true);
      expect(f.approx === undefined || f.year !== undefined, `${id}: approx without a year`).toBe(true);
      expect(f.yearVariants === undefined || f.year !== undefined, `${id}: variant years without a year`).toBe(true);
      for (const v of f.yearVariants ?? []) expect(Object.keys(v.params).length, id).toBeGreaterThan(0);
      if (f.blurb !== undefined) {
        expect(f.blurb, id).toMatch(ASCII);
        expect(f.blurb.length, id).toBeLessThan(400);
      }
    }
  });

  it("gives every rail vehicle and tram a country", () => {
    const missing = [...DESIGNS.values()]
      .filter((d) => ["Rail vehicles", "Trams"].includes(d.catalog?.category ?? "") && !GENERIC_RAIL.has(d.id) && !countryOf(d.id))
      .map((d) => d.id);
    expect(missing).toEqual([]);
  });

  it("gives every vehicle OpenTTD can hold its year, which the OpenTTD table states nowhere", () => {
    for (const [id, o] of Object.entries(OPENTTD_TABLE)) {
      expect(yearOf(id), id).toBeDefined();
      expect("introYear" in o, id).toBe(false);
      for (const v of o.variants ?? []) expect("introYear" in v, id).toBe(false);
    }
  });

  it("gives every confirmed vehicle a blurb", () => {
    const vehicles = ["Rail vehicles", "Road vehicles", "Aircraft", "Ships", "Cable car"];
    const missing = [...DESIGNS.values()].filter((d) => vehicles.includes(d.catalog?.category ?? "") && !isDraft(d.id) && !FACTS[d.id]?.blurb).map((d) => d.id);
    expect(missing).toEqual([]);
  });
});
