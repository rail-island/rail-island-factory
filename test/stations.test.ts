// The station buildings' triangle budgets (docs/models/stations.md): an ordinary
// station building is held to the row-house tier, a landmark station to the
// landmark tier, and each low level of detail to its building's limit.
import { describe, expect, it } from "vitest";
import { STATIONS } from "../generator/stations.ts";

/** The catalog ids lose their `bld-` prefix to `proc-building-` once generate.ts has loaded. */
const short = (id: string): string => id.replace(/^(bld-|proc-building-)/, "");
const LANDMARKS = new Set(["prague-main-station"]);

describe("station buildings: triangle budgets", () => {
  it("knows every station building", () => {
    expect(STATIONS.map((d) => short(d.id)).sort()).toEqual([
      "prague-main-station", "station-building", "station-halt", "station-hotel", "suburban-station",
    ]);
  });
  for (const d of STATIONS) {
    const landmark = LANDMARKS.has(short(d.id));
    it(`${d.id}: ${landmark ? "landmark 20,000-30,000" : "ordinary 4,000-10,000"} triangles, LOD within ${landmark ? 500 : 100}`, () => {
      const tris = d.build(undefined).triangleCount();
      expect(tris).toBeGreaterThanOrEqual(landmark ? 20_000 : 4_000);
      expect(tris).toBeLessThanOrEqual(landmark ? 30_000 : 10_000);
      expect(d.buildLod(undefined).triangleCount()).toBeLessThanOrEqual(landmark ? 500 : 100);
    });
  }
});
