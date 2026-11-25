// Passengers and cargo (docs/models/traffic.md): the tables' checks, the variant
// matching the game copies, the exported blocks, and that every confirmed design
// that must carry states its numbers.

import { describe, expect, it } from "vitest";
import type { ParamSpec } from "../generator/design.ts";
import { exportedBlock, mustCarry, type VehicleCapacityEntry, resolvedNumbers, trafficProblems, unknownTrafficIds } from "../generator/traffic.ts";
import { BUILDING_TRAFFIC } from "../generator/trafficTable.ts";
import { VEHICLE_CAPACITY } from "../generator/capacityTable.ts";
import { ALL_VEHICLES, BUILDINGS, DESIGNS, VILLAGE_DESIGNS } from "../generator/generate.ts";
import { isDraft } from "../generator/workshop.ts";
import { proceduralId } from "../generator/modelId.ts";
import { SKYSCRAPER_CATALOG } from "../generator/skyscrapers.ts";
import { VEHICLE_CATALOG } from "../generator/vehicles.ts";
import { withTraffic, type MetaEntry } from "../generator/catalog.ts";

const UNIT: ParamSpec[] = [
  { name: "unit", title: "Unit", default: "endCar", values: [{ value: "endCar", title: "End car" }, { value: "train", title: "Train" }] },
  { name: "cars", title: "Cars", default: "3", values: [{ value: "2", title: "2" }, { value: "3", title: "3" }], when: { name: "unit", values: ["train"] } },
  { name: "livery", title: "Livery", default: "red", values: [{ value: "red", title: "Red" }, { value: "blue", title: "Blue" }] },
];
const unit = { id: "proc-vehicle-test", params: UNIT };
const RAIL = { category: "Rail vehicles", group: "unit" };
const HOUSES = { category: "Village", group: "village" };

describe("which designs must state their numbers", () => {
  it("every building but stations and decor, every vehicle but locomotives and cable car machinery", () => {
    expect(mustCarry("Village", "village")).toBe(true);
    expect(mustCarry("Industry", "industry")).toBe(true);
    expect(mustCarry("Station", "station")).toBe(false);
    expect(mustCarry("Decor", "decor")).toBe(false);
    expect(mustCarry("Rail vehicles", "unit")).toBe(true);
    expect(mustCarry("Rail vehicles", "loco")).toBe(false);
    expect(mustCarry("Cable car", "cablecar")).toBe(false);
    expect(mustCarry("Cable car", "cabin")).toBe(true);
  });
});

describe("trafficProblems", () => {
  it("wants an entry where the design must carry, and none elsewhere", () => {
    expect(trafficProblems(unit, RAIL, undefined).join()).toMatch(/no entry in generator\/capacityTable.ts/);
    expect(trafficProblems({ id: "proc-building-x" }, HOUSES, undefined).join()).toMatch(/no entry in generator\/trafficTable.ts/);
    expect(trafficProblems(unit, { category: "Rail vehicles", group: "loco" }, undefined)).toEqual([]);
    expect(trafficProblems({ id: "proc-building-x" }, { category: "Station", group: "station" }, undefined)).toEqual([]);
  });

  it("accepts sane numbers and real variants", () => {
    const entry: VehicleCapacityEntry = { seats: 60, cargo: { mail: 2 }, source: "size", variants: [{ params: { unit: "train" }, seats: 180 }, { params: { unit: "train", cars: "2" }, seats: 120 }] };
    expect(trafficProblems(unit, RAIL, entry)).toEqual([]);
    expect(trafficProblems({ id: "proc-building-x" }, HOUSES, { residents: 4, jobs: 0, produces: { food: 0.2 }, accepts: ["goods", "mail"] })).toEqual([]);
  });

  it("refuses wrong numbers, classes and fields", () => {
    const p = (e: object, f = RAIL) => trafficProblems(unit, f, e as never).join("\n");
    expect(p({ seats: -1 })).toMatch(/seats: -1 is not a number >= 0/);
    expect(p({ seats: 2.5 })).toMatch(/not a whole number/);
    expect(p({ seats: 9000 })).toMatch(/over 3000/);
    expect(p({ cargo: { coal: 10 } })).toMatch(/unknown class "coal"/);
    expect(p({ cargo: { goods: 0 } })).toMatch(/goods is 0/);
    expect(p({ seats: 10, residents: 3 })).toMatch(/unknown field "residents"/);
    expect(p({ residents: 3, accepts: ["goods", "goods"] }, HOUSES)).toMatch(/lists a class twice/);
    expect(p({ residents: 3, accepts: ["coal"] }, HOUSES)).toMatch(/unknown class "coal"/);
    expect(p({ seats: 0 })).toMatch(/carries nothing at its defaults or in any variant/);
    // a power car seats nobody while its set does
    expect(p({ seats: 0, variants: [{ params: { unit: "train" }, seats: 300 }] })).toBe("");
    expect(p({ jobs: 0 }, HOUSES)).toMatch(/generates and accepts nothing/);
    expect(p({ seats: 10, source: " " })).toMatch(/empty "source"/);
    // a design of a carrying group that carries nothing says so, and why
    expect(p({ nothing: true, source: "a tug" })).toBe("");
    expect(p({ nothing: true })).toMatch(/without a "source"/);
    expect(p({ nothing: true, seats: 4, source: "x" })).toMatch(/"nothing" with numbers/);
  });

  it("refuses a variant that is no real selection", () => {
    const p = (variants: object[]) => trafficProblems(unit, RAIL, { seats: 10, variants } as never).join("\n");
    expect(p([{ params: {}, seats: 5 }])).toMatch(/lists no parameters/);
    expect(p([{ params: { colour: "red" }, seats: 5 }])).toMatch(/unknown parameter "colour"/);
    expect(p([{ params: { livery: "green" }, seats: 5 }])).toMatch(/no value "green"/);
    expect(p([{ params: { cars: "2" }, seats: 5 }])).toMatch(/"cars" does not apply/);
    expect(p([{ params: { unit: "train" }, seats: 5 }, { params: { unit: "train" }, seats: 6 }])).toMatch(/repeats the parameters/);
    expect(p([{ params: { unit: "train" } }])).toMatch(/states no numbers/);
  });
});

describe("resolvedNumbers (the game's matching)", () => {
  const block: VehicleCapacityEntry = {
    seats: 60,
    variants: [
      { params: { unit: "train" }, seats: 180, cargo: { mail: 3 } },
      { params: { unit: "train", cars: "2" }, seats: 120 },
    ],
  };
  it("takes every variant whose parameters all match, later ones winning field by field", () => {
    expect(resolvedNumbers(UNIT, block, {})).toEqual({ seats: 60 });
    expect(resolvedNumbers(UNIT, block, { livery: "blue" })).toEqual({ seats: 60 });
    expect(resolvedNumbers(UNIT, block, { unit: "train" })).toEqual({ seats: 180, cargo: { mail: 3 } });
    expect(resolvedNumbers(UNIT, block, { unit: "train", cars: "2", livery: "blue" })).toEqual({ seats: 120, cargo: { mail: 3 } });
  });
});

describe("the exported blocks", () => {
  const entry = (id: string, category: string, group: string): MetaEntry =>
    ({ id, title: "T", category, group, js: "", thumb: "", license: "", author: "", source: "" }) as unknown as MetaEntry;

  it("drop the source, and are empty for a design that carries nothing", () => {
    expect(exportedBlock({ seats: 4, source: "size" })).toEqual({ seats: 4 });
    expect(exportedBlock(undefined)).toEqual({});
    expect(exportedBlock({ nothing: true, source: "a tug" })).toEqual({});
    expect(withTraffic(entry("proc-vehicle-nothing", "Rail vehicles", "loco")).game).toEqual({ capacity: {} });
    expect(withTraffic(entry("proc-building-nothing", "Station", "station")).game).toEqual({ traffic: {} });
  });

  it("carry every confirmed vehicle's capacity and building's traffic", () => {
    // withTraffic over a bare entry: the full exports (test/export.test.ts) measure every model
    for (const [list, family] of [[BUILDINGS, SKYSCRAPER_CATALOG], [VILLAGE_DESIGNS, SKYSCRAPER_CATALOG], [ALL_VEHICLES, VEHICLE_CATALOG]] as const) {
      for (const d of list) {
        if (isDraft(d.id)) continue;
        const fields = d.catalog ?? family;
        const id = proceduralId(d.id);
        const game = withTraffic(entry(id, fields.category, fields.group)).game!;
        const block = list === ALL_VEHICLES ? game.capacity : game.traffic;
        expect(block, id).toBeDefined();
        expect(JSON.stringify(block)).not.toMatch(/"source"|"nothing"/);
        // a design that must carry exports its numbers, unless it says it carries nothing
        const stated = list === ALL_VEHICLES ? VEHICLE_CAPACITY[id] : BUILDING_TRAFFIC[id];
        if (mustCarry(fields.category, fields.group) && !stated?.nothing) expect(Object.keys(block!).length, id).toBeGreaterThan(0);
      }
    }
  });
});

describe("the tables", () => {
  it("state the numbers of every confirmed design that must carry, without a problem", () => {
    const problems: string[] = [];
    for (const [list, family] of [[BUILDINGS, SKYSCRAPER_CATALOG], [VILLAGE_DESIGNS, SKYSCRAPER_CATALOG], [ALL_VEHICLES, VEHICLE_CATALOG]] as const) {
      for (const d of list) {
        if (isDraft(d.id)) continue;
        const fields = d.catalog ?? family;
        const id = proceduralId(d.id);
        const vehicle = list === ALL_VEHICLES;
        problems.push(...trafficProblems(d, fields, vehicle ? VEHICLE_CAPACITY[id] : BUILDING_TRAFFIC[id]));
      }
    }
    expect(problems).toEqual([]);
  });

  it("name only real models", () => {
    const ids = [...DESIGNS.keys()].map(proceduralId);
    expect(unknownTrafficIds(BUILDING_TRAFFIC, ids)).toEqual([]);
    expect(unknownTrafficIds(VEHICLE_CAPACITY, ids)).toEqual([]);
    expect(unknownTrafficIds({ "proc-vehicle-nope": {} }, ids)).toEqual(["proc-vehicle-nope"]);
  });

  it("give buildings only buildings' numbers and vehicles only vehicles'", () => {
    const vehicles = new Set(ALL_VEHICLES.map((d) => proceduralId(d.id)));
    expect(Object.keys(BUILDING_TRAFFIC).filter((id) => vehicles.has(id))).toEqual([]);
    expect(Object.keys(VEHICLE_CAPACITY).filter((id) => !vehicles.has(id))).toEqual([]);
  });
});
