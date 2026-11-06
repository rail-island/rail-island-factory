// What the site's viewer draws around a vehicle (generator/catalog.ts sceneryOf,
// src/viewerScenery.ts): the way under every road and rail vehicle, and the game's
// wire, at the height every collector reaches, over the electric ones and the trams.
// See docs/site/catalog-site.md.

import { describe, expect, it } from "vitest";
import { sceneryOf, type ExportedGame } from "../generator/catalog.ts";
import { RAIL_COLLECTOR_TOP, TRAM_COLLECTOR_TOP } from "../generator/collector.ts";
import { DESIGNS } from "../generator/generate.ts";
import { resolveParams } from "../generator/design.ts";
import { LINE_PARAMS } from "../generator/previews/cableCarLine.ts";
import { LINE_PREVIEW_ID } from "../generator/cableCarLineIds.ts";
import { lineParams } from "../src/viewerLine.ts";
import { TYPE_META } from "../generator/sets/cableCarStation.ts";

describe("viewer scenery", () => {
  it("puts a road vehicle on the road", () => {
    expect(sceneryOf({ category: "Road vehicles", group: "bus" })).toEqual({ way: "road" });
  });

  it("puts an electric rail vehicle under the contact wire and a diesel or steam one on bare track", () => {
    expect(sceneryOf({ category: "Rail vehicles", group: "loco", traction: "electric" })).toEqual({ way: "rail", wireTop: RAIL_COLLECTOR_TOP });
    expect(sceneryOf({ category: "Rail vehicles", group: "unit", traction: "diesel" })).toEqual({ way: "rail" });
    expect(sceneryOf({ category: "Rail vehicles", group: "coach" })).toEqual({ way: "rail" });
    expect(sceneryOf({ category: "Rail vehicles", group: "metro" })).toEqual({ way: "rail" });
  });

  it("puts a tram on its road under the trolley wire", () => {
    expect(sceneryOf({ category: "Rail vehicles", group: "tram" })).toEqual({ way: "tram", wireTop: TRAM_COLLECTOR_TOP });
  });

  it("draws nothing around anything else", () => {
    expect(sceneryOf({ category: "Aircraft", group: "aircraft" })).toBeNull();
    expect(sceneryOf({ category: "Commercial", group: "comm_classic" })).toBeNull();
  });

  it("hangs every cable car cabin on a line of the line preview, a jig-back one at most two to a line", () => {
    const cabins = [...DESIGNS.values()].filter((d) => d.catalog?.category === "Cable car");
    expect(cabins.length).toBeGreaterThanOrEqual(14);
    for (const d of cabins) {
      const sc = sceneryOf({ id: d.id, category: "Cable car", group: "cabin", game: d.game as ExportedGame })!;
      expect(sc.way, d.id).toBe("ropeway");
      const r = sc.ropeway!;
      expect(r.line).toBe(LINE_PREVIEW_ID);
      expect(DESIGNS.has(r.line)).toBe(true);
      // every station and count the viewer offers is one the line preview takes, for this cabin
      expect(r.stations).toHaveLength(Object.keys(TYPE_META).length);
      for (const st of r.stations) for (const c of r.counts) expect(() => resolveParams(LINE_PARAMS, lineParams(r, st.value, c.value))).not.toThrow();
      expect(r.counts.map((c) => c.value), d.id).toEqual(d.game?.ropeway === "jigback" ? ["1", "2"] : ["1", "2", "6"]);
    }
  });

  it("asks the line for the nearest count a cabin offers, and the first station for one it does not know", () => {
    const r = sceneryOf({ id: "proc-vehicle-vanoise-express", category: "Cable car", group: "cabin", game: DESIGNS.get("proc-vehicle-vanoise-express")!.game as ExportedGame })!.ropeway!;
    expect(lineParams(r, "glassModern", "6")).toEqual({ cabin: "vanoiseExpress", station: "glassModern", cabins: "2" });
    expect(lineParams(r, "nowhere", "1")).toEqual({ cabin: "vanoiseExpress", station: "openGantry", cabins: "1" });
  });
});
