// Passengers and cargo (docs/models/traffic.md): the tables' checks, the variant
// matching the game copies, the exported blocks, that every confirmed design that
// must carry states its numbers, and that the supply chain has no orphan.

import { describe, expect, it } from "vitest";
import type { ParamSpec } from "../generator/design.ts";
import {
  chainOf, chainProblems, COMMODITIES, COMMODITY_KINDS, exportedBlock, exportedTraffic, mustCarry, TRAFFIC_UNIT, type BuildingTrafficEntry, type ChainDesign,
  type VehicleCapacityEntry, resolvedNumbers, trafficProblems, unknownTrafficIds,
} from "../generator/traffic.ts";
import { BUILDING_TRAFFIC } from "../generator/trafficTable.ts";
import { VEHICLE_CAPACITY } from "../generator/capacityTable.ts";
import { ALL_VEHICLES, BUILDINGS, DESIGNS, VILLAGE_DESIGNS } from "../generator/generate.ts";
import { isDraft } from "../generator/workshop.ts";
import { proceduralId } from "../generator/modelId.ts";
import { SKYSCRAPER_CATALOG } from "../generator/skyscrapers.ts";
import { VEHICLE_CATALOG } from "../generator/vehicles.ts";
import { supplyChainProblems, withTraffic, type MetaEntry } from "../generator/catalog.ts";
import { COMMODITY_LABELS, exportedText } from "../generator/text.ts";

const UNIT: ParamSpec[] = [
  { name: "unit", title: "Unit", default: "endCar", values: [{ value: "endCar", title: "End car" }, { value: "train", title: "Train" }] },
  { name: "cars", title: "Cars", default: "3", values: [{ value: "2", title: "2" }, { value: "3", title: "3" }], when: { name: "unit", values: ["train"] } },
  { name: "livery", title: "Livery", default: "red", values: [{ value: "red", title: "Red" }, { value: "blue", title: "Blue" }] },
];
const unit = { id: "proc-vehicle-test", params: UNIT };
const RAIL = { category: "Rail vehicles", group: "unit" };
const HOUSES = { category: "Village", group: "village" };
const INDUSTRY = { category: "Industry", group: "industry" };
const SIZED: ParamSpec[] = [{ name: "size", title: "Size", default: "compact", values: [{ value: "compact", title: "Compact" }, { value: "extended", title: "Extended" }] }];
const works = { id: "proc-building-works", params: SIZED };
const STEEL = { output: "steel", inputs: { "iron-ore": 1, coal: 0.5 }, rate: 30, stock: 300 } as const;

describe("the commodities", () => {
  it("are the chain's ten, in the contract's order, each with its kind and an exported name", () => {
    expect(COMMODITIES).toEqual(["grain", "wood", "coal", "iron-ore", "oil", "food", "steel", "fuel", "goods", "mail"]);
    expect(COMMODITIES.filter((c) => COMMODITY_KINDS[c] === "raw")).toEqual(["grain", "wood", "coal", "iron-ore", "oil"]);
    expect(COMMODITIES.filter((c) => COMMODITY_KINDS[c] === "processed")).toEqual(["food", "steel", "fuel", "goods"]);
    const text = exportedText();
    for (const c of COMMODITIES) expect(text.get(`commodity.${c}`), c).toBe(COMMODITY_LABELS[c]);
  });
});

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
    const entry: VehicleCapacityEntry = { seats: 60, tonnes: 2, commodities: ["mail"], source: "size", variants: [{ params: { unit: "train" }, seats: 180, tonnes: 0, commodities: [] }, { params: { unit: "train", cars: "2" }, seats: 120 }] };
    expect(trafficProblems(unit, RAIL, entry)).toEqual([]);
    expect(trafficProblems({ id: "proc-building-x" }, HOUSES, { residents: 4, jobs: 0, produces: { mail: 0.2 }, accepts: ["food", "goods", "mail"] })).toEqual([]);
    const mill: BuildingTrafficEntry = { jobs: 200, processes: STEEL, variants: [{ params: { size: "extended" }, processes: { ...STEEL, rate: 45, stock: 450 } }] };
    expect(trafficProblems(works, INDUSTRY, mill)).toEqual([]);
    expect(trafficProblems(works, INDUSTRY, { jobs: 1, produces: { oil: 3 } })).toEqual([]);
  });

  it("refuses wrong numbers, classes and fields", () => {
    const p = (e: object, f = RAIL) => trafficProblems(unit, f, e as never).join("\n");
    expect(p({ seats: -1 })).toMatch(/seats: -1 is not a number >= 0/);
    expect(p({ seats: 2.5 })).toMatch(/not a whole number/);
    expect(p({ seats: 9000 })).toMatch(/over 3000/);
    expect(p({ tonnes: 10, commodities: ["bulk"] })).toMatch(/unknown commodity "bulk"/);
    expect(p({ tonnes: 10, commodities: ["coal", "coal"] })).toMatch(/lists a commodity twice/);
    expect(p({ tonnes: 10 })).toMatch(/tonnes without commodities/);
    expect(p({ seats: 4, commodities: ["coal"] })).toMatch(/commodities without tonnes/);
    expect(p({ seats: 4, tonnes: 0, commodities: ["coal"] })).toMatch(/tonnes > 0 exactly when/);
    expect(p({ tonnes: 5, commodities: [] })).toMatch(/tonnes > 0 exactly when/);
    expect(p({ tonnes: 300_000, commodities: ["oil"] })).toMatch(/over 250000/);
    expect(p({ cargo: { goods: 10 } })).toMatch(/unknown field "cargo"/);
    expect(p({ seats: 10, residents: 3 })).toMatch(/unknown field "residents"/);
    expect(p({ residents: 3, accepts: ["goods", "goods"] }, HOUSES)).toMatch(/lists a commodity twice/);
    expect(p({ residents: 3, accepts: ["liquids"] }, HOUSES)).toMatch(/unknown commodity "liquids"/);
    expect(p({ residents: 3, produces: { bulk: 1 } }, HOUSES)).toMatch(/unknown commodity "bulk"/);
    expect(p({ residents: 3, produces: { mail: 0 } }, HOUSES)).toMatch(/mail is 0/);
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

  it("makes a processed commodity only by a recipe, and wants a sane recipe", () => {
    const p = (e: object) => trafficProblems(works, INDUSTRY, e as never).join("\n");
    expect(p({ jobs: 10, produces: { goods: 5 } })).toMatch(/produces "goods" from nothing/);
    expect(p({ jobs: 10, processes: { ...STEEL, output: "coal" } })).toMatch(/"coal" is not a processed commodity/);
    expect(p({ jobs: 10, processes: { ...STEEL, output: "plastics" } })).toMatch(/output names an unknown commodity "plastics"/);
    expect(p({ jobs: 10, processes: { ...STEEL, inputs: { steel: 1, coal: 0.5 } } })).toMatch(/its output "steel" is among its inputs/);
    expect(p({ jobs: 10, processes: { ...STEEL, inputs: {} } })).toMatch(/inputs is empty/);
    expect(p({ jobs: 10, processes: { output: "steel", rate: 1, stock: 1 } })).toMatch(/has no inputs/);
    expect(p({ jobs: 10, processes: { ...STEEL, inputs: { "iron-ore": 0 } } })).toMatch(/iron-ore is 0/);
    expect(p({ jobs: 10, processes: { ...STEEL, inputs: { "iron-ore": 20 } } })).toMatch(/over 10/);
    expect(p({ jobs: 10, processes: { ...STEEL, rate: 0 } })).toMatch(/rate is 0/);
    expect(p({ jobs: 10, processes: { ...STEEL, stock: 0 } })).toMatch(/stock is 0/);
    expect(p({ jobs: 10, processes: { ...STEEL, rate: 5000 } })).toMatch(/rate: 5000 is over 2000/);
    expect(p({ jobs: 10, processes: { ...STEEL, speed: 2 } })).toMatch(/unknown field "speed"/);
    expect(p({ jobs: 10, processes: "steel" })).toMatch(/not a recipe object/);
    // a recipe's inputs are taken implicitly; what it makes is not made from nothing too
    expect(p({ jobs: 10, processes: STEEL, accepts: ["coal"] })).toMatch(/accepts "coal", which its recipe already takes/);
    expect(p({ jobs: 10, processes: STEEL, accepts: ["food"] })).toBe("");
    // ... also where only a variant brings the recipe
    expect(p({ jobs: 10, accepts: ["coal"], variants: [{ params: { size: "extended" }, processes: STEEL }] })).toMatch(/variant 1 accepts "coal", which its recipe already takes/);
    // a recipe alone is a role: the building takes and makes something
    expect(p({ processes: STEEL })).toBe("");
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
      { params: { unit: "train" }, seats: 180, tonnes: 3, commodities: ["mail"] },
      { params: { unit: "train", cars: "2" }, seats: 120 },
    ],
  };
  it("takes every variant whose parameters all match, later ones winning field by field", () => {
    expect(resolvedNumbers(UNIT, block, {})).toEqual({ seats: 60 });
    expect(resolvedNumbers(UNIT, block, { livery: "blue" })).toEqual({ seats: 60 });
    expect(resolvedNumbers(UNIT, block, { unit: "train" })).toEqual({ seats: 180, tonnes: 3, commodities: ["mail"] });
    expect(resolvedNumbers(UNIT, block, { unit: "train", cars: "2", livery: "blue" })).toEqual({ seats: 120, tonnes: 3, commodities: ["mail"] });
  });

  it("replaces a recipe whole", () => {
    const mill: BuildingTrafficEntry = { jobs: 200, processes: STEEL, variants: [{ params: { size: "extended" }, processes: { output: "steel", inputs: { "iron-ore": 1 }, rate: 45, stock: 450 } }] };
    expect(resolvedNumbers(SIZED, mill, {}).processes).toEqual(STEEL);
    expect(resolvedNumbers(SIZED, mill, { size: "extended" })).toEqual({ jobs: 200, processes: { output: "steel", inputs: { "iron-ore": 1 }, rate: 45, stock: 450 } });
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

  it("carry a recipe and a hold in the contract's shape", () => {
    expect(withTraffic(entry("proc-building-industry-factory-a", "Industry", "industry")).game!.traffic).toEqual({
      unit: "min",
      jobs: 200,
      processes: { output: "steel", inputs: { "iron-ore": 1, coal: 0.5 }, rate: 360, stock: 3600 },
      variants: [{ params: { size: "extended" }, jobs: 300, processes: { output: "steel", inputs: { "iron-ore": 1, coal: 0.5 }, rate: 540, stock: 5400 } }],
    });
    expect(withTraffic(entry("proc-vehicle-eas-open-wagon", "Rail vehicles", "wagon")).game!.capacity).toEqual({ tonnes: 58, commodities: ["grain", "wood", "coal", "iron-ore"] });
    expect(withTraffic(entry("proc-vehicle-airbus-a380", "Aircraft", "aircraft")).game!.capacity).toEqual({ seats: 525, tonnes: 17, commodities: ["goods", "mail"] });
  });

  it("mark a building's non-empty traffic block per minute, and only that", () => {
    const mine = withTraffic(entry("proc-building-industry-mine", "Industry", "industry")).game!.traffic!;
    // the unit leads the block; a variant carries none (the block's applies)
    expect(Object.keys(mine)[0]).toBe("unit");
    expect(mine).toEqual({ unit: TRAFFIC_UNIT, jobs: 120, produces: { coal: 300 }, accepts: ["fuel"], variants: [{ params: { type: "iron" }, produces: { "iron-ore": 360 } }] });
    expect(TRAFFIC_UNIT).toBe("min");
    expect(exportedTraffic({ jobs: 1, source: "a caretaker" })).toEqual({ unit: "min", jobs: 1 });
    // empty stays empty: a station, a design that carries nothing, none at all
    expect(exportedTraffic(undefined)).toEqual({});
    expect(exportedTraffic({ nothing: true, source: "a shed" })).toEqual({});
    expect(withTraffic(entry("proc-building-nothing", "Station", "station")).game!.traffic).toEqual({});
    // a vehicle's capacity is no rate: no unit
    expect(withTraffic(entry("proc-vehicle-eas-open-wagon", "Rail vehicles", "wagon")).game!.capacity).not.toHaveProperty("unit");
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
        // every non-empty building block states its unit, an empty one none
        if (list !== ALL_VEHICLES) expect((block as { unit?: string }).unit, id).toBe(Object.keys(block!).length ? "min" : undefined);
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

describe("the supply chain", () => {
  const b = (id: string, block: object, params?: ParamSpec[]): ChainDesign => ({ id, params, block: block as ChainDesign["block"] });
  const FULL: ChainDesign[] = [
    b("farm", { produces: { grain: 10 } }),
    b("camp", { produces: { wood: 10 } }),
    b("mine", { produces: { coal: 10 }, variants: [{ params: { type: "iron-ore" }, produces: { "iron-ore": 10 } }] }, [
      { name: "type", title: "Type", default: "coal", values: [{ value: "coal", title: "Coal" }, { value: "iron-ore", title: "Iron ore" }] },
    ]),
    b("well", { produces: { oil: 10 } }),
    b("plant", { processes: { output: "food", inputs: { grain: 1 }, rate: 5, stock: 50 } }),
    b("mill", { processes: STEEL }),
    b("refinery", { processes: { output: "fuel", inputs: { oil: 1 }, rate: 5, stock: 50 } }),
    b("factory", { processes: { output: "goods", inputs: { steel: 0.5, wood: 0.5 }, rate: 5, stock: 50 } }),
    b("house", { residents: 4, produces: { mail: 0.01 }, accepts: ["food", "fuel", "goods", "mail"] }),
  ];
  const ALL_CARRIER = [b("truck", { tonnes: 10, commodities: [...COMMODITIES] })];

  it("finds no orphan in a whole chain, a variant's selection included", () => {
    expect(chainProblems(FULL, ALL_CARRIER)).toEqual([]);
    expect(chainOf(FULL, ALL_CARRIER)["iron-ore"]).toEqual({ producers: ["mine"], consumers: ["mill"], carriers: ["truck"] });
    expect(chainOf(FULL, ALL_CARRIER).goods).toEqual({ producers: ["factory"], consumers: ["house"], carriers: ["truck"] });
  });

  it("names a commodity nothing makes, takes or carries", () => {
    const noFarm = FULL.filter((d) => d.id !== "farm");
    expect(chainProblems(noFarm, ALL_CARRIER)).toEqual(["grain: no building makes it (produces, or a recipe's output)"]);
    const noTown = FULL.filter((d) => d.id !== "house");
    expect(chainProblems(noTown, ALL_CARRIER).join("\n")).toMatch(/food: no building takes it[\s\S]*goods: no building takes it[\s\S]*mail: no building makes it/);
    expect(chainProblems(FULL, [b("tanker", { tonnes: 10, commodities: ["oil", "fuel"] })])).toHaveLength(8);
    // an empty hold carries nothing, whatever it lists
    expect(chainOf(FULL, [b("van", { tonnes: 0, commodities: [] })]).mail.carriers).toEqual([]);
  });


  it("has no orphan over the confirmed designs (the build fails on one)", () => {
    expect(supplyChainProblems([...BUILDINGS, ...VILLAGE_DESIGNS], ALL_VEHICLES)).toEqual([]);
  });

});
