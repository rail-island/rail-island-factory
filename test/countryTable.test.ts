// The country table (generator/countryTable.ts): every key is a design, every
// code is named, and every rail vehicle but the generic legacy wagons names one.

import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate";
import { COUNTRY_NAMES, COUNTRY_OF } from "../generator/countryTable";

/** Rail vehicles drawn for no country's railway. */
const GENERIC_RAIL = new Set([
  "proc-vehicle-legacy-covered-wagon", "proc-vehicle-legacy-open-wagon", "proc-vehicle-legacy-heavy-wagon",
  "proc-vehicle-nas-flat-wagon", "proc-vehicle-ua-open-wagon", "proc-vehicle-eas-open-wagon", "proc-vehicle-raj-hopper-wagon",
  "proc-vehicle-rah-tank-wagon", "proc-vehicle-sqns-container-wagon", "proc-vehicle-pao-flat-wagon", "proc-vehicle-habis-sliding-wall-wagon",
  "proc-vehicle-hadgs-hopper-wagon", "proc-vehicle-faccs-hopper-wagon", "proc-vehicle-falls-hopper-wagon", "proc-vehicle-wap-hopper-wagon",
  "proc-vehicle-dnt-184-5",
]);

describe("country table", () => {
  it("names only designs that exist, with known codes", () => {
    for (const [id, code] of COUNTRY_OF) {
      expect(DESIGNS.has(id), id).toBe(true);
      expect(COUNTRY_NAMES[code], `${id}: ${code}`).toBeDefined();
    }
  });

  it("gives every rail vehicle and tram a country", () => {
    const missing = [...DESIGNS.values()]
      .filter((d) => ["Rail vehicles", "Trams"].includes(d.catalog?.category ?? "") && !GENERIC_RAIL.has(d.id) && !COUNTRY_OF.has(d.id))
      .map((d) => d.id);
    expect(missing).toEqual([]);
  });
});
