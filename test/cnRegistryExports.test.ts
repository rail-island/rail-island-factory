// The model build (generator/generate.ts) writes one module per design that imports the
// design's builders by name from its registry module, so each Chinese registry must export
// every builder it lists (the DJJ2 China Star and the HXD3C once broke the build this way).
import { describe, expect, it } from "vitest";
import * as units from "../generator/cnUnits.ts";
import * as locos from "../generator/cnLocos.ts";

describe("the Chinese registries", () => {
  const cases: Array<[string, Record<string, unknown>, Array<{ id: string; build: Function; buildLod?: Function }>]> = [
    ["cnUnits.ts", units, units.CN_UNITS],
    ["cnLocos.ts", locos, locos.CN_LOCOS],
  ];
  for (const [name, mod, list] of cases) {
    it(`${name} exports every design's builders under their own names`, () => {
      for (const d of list) for (const f of [d.build, d.buildLod]) {
        if (!f) continue;
        expect(mod[f.name], `${d.id}: ${f.name}`).toBe(f);
      }
    });
  }
});
