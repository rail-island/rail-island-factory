// What the site's viewer draws around a vehicle (generator/catalog.ts sceneryOf,
// src/viewerScenery.ts): the way under every road and rail vehicle, and the game's
// wire, at the height every collector reaches, over the electric ones and the trams.
// See docs/site/catalog-site.md.

import { describe, expect, it } from "vitest";
import { sceneryOf } from "../generator/catalog.ts";
import { RAIL_COLLECTOR_TOP, TRAM_COLLECTOR_TOP } from "../generator/collector.ts";

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
});
