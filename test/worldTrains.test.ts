// The trains of the eight-country plan (docs/specs/2026-11-05-trains-of-eight-countries.md):
// every family's designs at their defaults - inside their loading gauge, within the
// triangle budget, at their published length, filed under their country, every
// parameter value fitting the game's 16-character button. The catalog sweep runs
// the per-design checks on a sampled combination too.

import { describe, expect, it } from "vitest";
import type { ProceduralDesign } from "../generator/design";
import { DE_UNITS } from "../generator/deUnits";
import { DE_LOCOS } from "../generator/deLocos";
import { FR_UNITS } from "../generator/frUnits";
import { FR_LOCOS } from "../generator/frLocos";
import { NL_UNITS } from "../generator/nlUnits";
import { NL_LOCOS } from "../generator/nlLocos";
import { WORLD_STEAM_DESIGNS } from "../generator/worldSteamLocos";
import { WORLD_COACHES } from "../generator/worldCoaches";
import { COUNTRY_OF } from "../generator/countryTable";
import { loadingGaugeOf } from "../generator/loadingGauge";
import { glbStats } from "../generator/glbStats";
import { RAIL_COLLECTOR_TOP } from "../generator/collector";

/** Every design of the plan's families, and the length (m) each default build spans over its buffers or couplers. */
const FAMILIES: ProceduralDesign[] = [...DE_UNITS, ...DE_LOCOS, ...FR_UNITS, ...FR_LOCOS, ...NL_UNITS, ...NL_LOCOS, ...WORLD_STEAM_DESIGNS, ...WORLD_COACHES];
const LENGTHS: Record<string, number> = {
  "proc-vehicle-db-103": 20.2, "proc-vehicle-db-101": 19.1, "proc-vehicle-db-120": 19.2, "proc-vehicle-drg-e18": 16.92,
  "proc-vehicle-drg-e94": 18.6, "proc-vehicle-db-v200": 18.53, "proc-vehicle-db-218": 16.4, "proc-vehicle-db-ic-coach": 26.4,
  "proc-vehicle-db-vt98": 13.95, "proc-vehicle-db-650": 25.5,
  "proc-vehicle-sncf-cc6500": 20.19, "proc-vehicle-sncf-cc40100": 22.03, "proc-vehicle-sncf-bb22200": 17.48, "proc-vehicle-sncf-cc7100": 18.92,
  "proc-vehicle-sncf-bb9200": 16.2, "proc-vehicle-sncf-bb27000": 19.52, "proc-vehicle-sncf-bb67400": 17.09, "proc-vehicle-sncf-cc72000": 20.19,
  "proc-vehicle-sncf-corail-coach": 26.4, "proc-vehicle-sncf-grand-confort": 24.5, "proc-vehicle-ciwl-car": 23.45, "proc-vehicle-sncf-x3800": 21.85, "proc-vehicle-sncf-x73500": 28.9,
  "proc-vehicle-ns-1700": 17.48, "proc-vehicle-ns-1100": 12.93, "proc-vehicle-ns-1300": 18.95, "proc-vehicle-ns-1200": 18.08, "proc-vehicle-ns-2200": 14.1,
  "proc-vehicle-ns-icr-coach": 26.4, "proc-vehicle-ns-de1": 26.0,
};
const COUNTRY: Record<string, string> = { db: "de", dr: "de", drg: "de", kpev: "de", sncf: "fr", ratp: "fr", ciwl: "fr", ns: "nl" };

describe("the eight countries' trains", () => {
  it("file every design under its country", () => {
    for (const d of FAMILIES) {
      const prefix = d.id.replace("proc-vehicle-", "").split("-")[0]!;
      expect(COUNTRY_OF.get(d.id), d.id).toBe(COUNTRY[prefix]);
    }
  });

  it("fit every parameter value's title on the game's button", () => {
    for (const d of FAMILIES) for (const p of d.params ?? []) for (const v of p.values) expect(v.title.length, `${d.id} ${v.value}`).toBeLessThanOrEqual(16);
  });

  for (const d of FAMILIES)
    it(`${d.id}: its default inside its gauge and budget, at its length`, () => {
      const s = glbStats(d.build().toGlb(d.id));
      const g = loadingGaugeOf(d);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(g.width);
      // a raised pantograph reaches for the wire, above the body's gauge
      expect(s.max[1]).toBeLessThanOrEqual(d.catalog?.traction === "electric" ? RAIL_COLLECTOR_TOP + 0.01 : g.height);
      expect(s.triangles).toBeLessThanOrEqual(16000);
      const want = LENGTHS[d.id];
      if (want) expect(Math.abs(s.max[0] - s.min[0] - want), `${d.id} length`).toBeLessThan(0.05 * want);
    });
});
