// The Chains tab's data (src/chains.ts, docs/site/chains.md) on a synthetic catalog:
// the columns, the edges, which buildings and vehicles land on which node, the
// cards and the phone's list of chains.

import { describe, expect, it } from "vitest";
import { COMMODITIES, COMMODITY_KINDS } from "../generator/traffic.ts";
import { COMMODITY_KIND, COMMODITY_ORDER, LAYOUT, chainGraph, carriers, commodityLabel, nodeCards, sameChainInput, selectionsOf, type ChainRecord } from "../src/chains";

type Game = NonNullable<ChainRecord["game"]>;

function building(id: string, title: string, traffic: Game["traffic"], extra: Partial<ChainRecord> = {}): ChainRecord {
  return { id, title, game: { traffic } as Game, ...extra };
}

function vehicle(id: string, title: string, capacity: Game["capacity"], extra: Partial<ChainRecord> = {}): ChainRecord {
  return { id, title, game: { capacity } as Game, ...extra };
}

const SIZE = [{ name: "size", title: "Size", default: "normal", values: [{ value: "normal", title: "Normal" }, { value: "big", title: "Big" }] }] as ChainRecord["params"];

/** A small chain: oil from a pump, the steel mill and goods factory fed by nothing yet, towns and a sink. */
const CATALOG: ChainRecord[] = [
  building("proc-building-pump", "Oil pump", { produces: { oil: 3 }, variants: [{ params: { size: "big" }, produces: { oil: 6 } }] }, { params: SIZE }),
  building("proc-building-refinery", "Refinery", { processes: { outputs: { oil: "fuel" }, rate: 40, stock: 400 } }),
  building("proc-building-mill", "Steel mill", {
    processes: { outputs: { "iron-ore": "steel", coal: "steel" }, rate: 30, stock: 300 },
    variants: [{ params: { size: "big" }, processes: { outputs: { "iron-ore": "steel", coal: "steel" }, rate: 45, stock: 450 } }],
  }, { params: SIZE }),
  building("proc-building-factory", "Goods factory", { processes: { outputs: { steel: "goods", wood: "goods" }, rate: 12, stock: 120 } }),
  building("proc-building-house", "House", { residents: 4, produces: { mail: 0.1 }, accepts: ["cement", "goods", "mail"] }),
  building("proc-building-shop", "Shop", { jobs: 4, produces: { mail: 0.05 }, accepts: ["fuel", "goods", "mail"] }, { draft: true }),
  building("proc-building-power", "Power plant", { jobs: 40, accepts: ["coal", "fuel"] }),
  building("proc-building-station", "Station", {}),
  vehicle("proc-vehicle-tank", "Tank wagon", { tonnes: 60, commodities: ["oil", "fuel"] }),
  vehicle("proc-vehicle-hopper", "Hopper", { tonnes: 50, commodities: ["coal", "iron-ore", "grain"] }),
  vehicle("proc-vehicle-flat", "Flat wagon", { tonnes: 40, commodities: ["steel", "wood", "goods"], variants: [{ params: { size: "big" }, tonnes: 70, commodities: ["steel", "wood", "goods"] }] }, { params: SIZE, draft: true }),
  vehicle("proc-vehicle-van", "Mail van", { seats: 0, tonnes: 8, commodities: ["mail"] }),
  vehicle("proc-vehicle-coach", "Coach", { seats: 60 }),
  vehicle("proc-vehicle-loco", "Locomotive", {}),
];

describe("the chain's commodities", () => {
  it("mirror the generator's list and kinds", () => {
    expect([...COMMODITY_ORDER]).toEqual([...COMMODITIES]);
    expect(COMMODITY_KIND).toEqual(COMMODITY_KINDS);
    expect(commodityLabel("iron-ore")).toBe("Iron ore");
  });
});

describe("selections", () => {
  it("resolve variants by their parameters, the way the game does", () => {
    const pump = CATALOG[0]!;
    expect(selectionsOf(pump, pump.game!.traffic as never)).toEqual([{ produces: { oil: 3 } }, { produces: { oil: 6 } }]);
  });
});

describe("the graph", () => {
  const g = chainGraph(CATALOG);
  const node = (id: string) => g.nodes.get(id)!;

  it("has a node per commodity, a producer per raw commodity, a processor per recipe and the consumers", () => {
    for (const c of COMMODITIES) expect(node(c).kind).toBe("commodity");
    expect([...g.nodes.values()].filter((n) => n.kind === "producer").map((n) => n.id)).toEqual(["make-grain", "make-wood", "make-coal", "make-iron-ore", "make-stone", "make-sand", "make-oil"]);
    expect([...g.nodes.values()].filter((n) => n.kind === "processor").map((n) => n.id)).toEqual(["process-goods", "process-steel", "process-fuel"]);
    expect([...g.nodes.values()].filter((n) => n.kind === "consumer").map((n) => n.id)).toEqual(["towns", "takes-power"]);
    // the station and the coach play no part
    expect([...g.nodes.values()].some((n) => n.buildings.includes("proc-building-station"))).toBe(false);
  });

  it("puts the columns in order: producers, raw, processors by depth and their outputs, consumers", () => {
    expect(node("make-oil").col).toBe(0);
    expect(node("oil").col).toBe(1);
    expect(node("process-steel").col).toBe(2);
    expect(node("steel").col).toBe(3);
    expect(node("process-fuel").col).toBe(2);
    // goods are made from steel, so one depth further
    expect(node("process-goods").col).toBe(4);
    expect(node("goods").col).toBe(5);
    expect(node("towns").col).toBe(6);
    expect(node("takes-power").col).toBe(6);
    // a processed commodity no recipe makes stands empty beside the first processors
    expect(node("lumber")).toMatchObject({ col: 3, empty: true, lines: ["no recipe yet"] });
  });

  it("lays the boxes out without overlap, each producer beside its commodity", () => {
    expect(node("make-oil").y + node("make-oil").h / 2).toBe(node("oil").y + node("oil").h / 2);
    expect(node("oil").w).toBe(LAYOUT.commodityW);
    expect(node("process-steel").w).toBe(LAYOUT.industryW);
    const main = [...g.nodes.values()].filter((n) => n.commodityKind !== "town");
    for (const a of main) {
      for (const b of main) {
        if (a === b || a.col !== b.col) continue;
        expect(a.y + a.h <= b.y || b.y + b.h <= a.y, `${a.id} overlaps ${b.id}`).toBe(true);
      }
      expect(a.x + a.w).toBeLessThanOrEqual(g.width);
      expect(a.y + a.h).toBeLessThanOrEqual(g.height);
    }
    expect(g.bands.map((b) => b.title)).toEqual(["Raw materials", "Processing", "Consumers"]);
  });

  it("joins them with edges, mail kept apart", () => {
    const edges = g.edges.map((e) => `${e.from}>${e.to}`);
    expect(edges).toEqual(
      expect.arrayContaining([
        "make-oil>oil", "oil>process-fuel", "process-fuel>fuel", "coal>process-steel", "iron-ore>process-steel", "process-steel>steel",
        "steel>process-goods", "wood>process-goods", "process-goods>goods", "cement>towns", "fuel>towns", "goods>towns", "coal>takes-power", "fuel>takes-power",
      ]),
    );
    expect(edges.some((e) => e.includes("mail"))).toBe(false);
    for (const e of g.edges) expect(e.path).toMatch(/^M[\d.]+ [\d.]+ C/);
    expect(g.mail?.edges.map((e) => `${e.from}>${e.to}`)).toEqual(["towns>mail", "mail>towns"]);
  });

  it("shows a raw commodity with no producer as 'No producer yet'", () => {
    expect(node("make-coal")).toMatchObject({ title: "No producer yet", empty: true, buildings: [] });
    expect(node("make-oil")).toMatchObject({ title: "Oil pump", empty: false, buildings: ["proc-building-pump"], lines: ["1 design - 3-6 t/min"] });
  });

  it("names each processor's recipe, rate and stock over its variants", () => {
    expect(node("process-steel").lines).toEqual(["coal, iron ore -> steel", "30-45 t/min - stock 300-450 t"]);
    expect(node("process-steel").commodities).toEqual(["coal", "iron-ore", "steel"]);
  });

  it("gathers the mail makers as the towns, marking a node draft only when every design is", () => {
    expect(node("towns").buildings).toEqual(["proc-building-house", "proc-building-shop"]);
    expect(node("towns").draft).toBe(false);
    expect(node("towns").commodities).toEqual(["goods", "cement", "fuel", "mail"]);
  });
});

describe("the cards", () => {
  const g = chainGraph(CATALOG);

  it("open a commodity's carriers only: what makes and takes it is in the graph", () => {
    const groups = nodeCards(g, "fuel");
    expect(groups.map((x) => x.title)).toEqual(["Carries fuel"]);
    expect(groups[0]!.buildings).toBeUndefined();
    expect(groups[0]!.vehicles!.map((v) => [v.id, v.line])).toEqual([["proc-vehicle-tank", "60 t - oil, fuel"]]);
    expect(nodeCards(g, "steel")[0]!.vehicles!.map((v) => [v.id, v.tonnes, v.draft])).toEqual([["proc-vehicle-flat", 70, true]]);
    expect(nodeCards(g, "lumber")[0]!.vehicles).toEqual([]);
    expect(nodeCards(g, "lumber")[0]!.empty).toBe("No vehicle carries lumber yet.");
  });

  it("say when nothing makes a raw commodity yet", () => {
    expect(nodeCards(g, "make-coal")[0]!.buildings).toEqual([]);
    expect(nodeCards(g, "make-coal")[0]!.empty).toBe("No producer yet: nothing makes coal.");
  });

  it("open an industry's or a town's building designs only, no carriers", () => {
    const groups = nodeCards(g, "process-steel");
    expect(groups.map((x) => x.title)).toEqual(["Processors"]);
    expect(groups[0]!.vehicles).toBeUndefined();
    expect(groups[0]!.buildings!.map((c) => c.line)).toEqual(["coal, iron ore -> steel, 30-45 t/min"]);
    const towns = nodeCards(g, "towns");
    expect(towns.map((x) => x.title)).toEqual(["Buildings"]);
    expect(towns[0]!.buildings!.find((c) => c.id === "proc-building-shop")!.draft).toBe(true);
  });

  it("open each carrier in the selection that carries the commodity, the defaults when they do", () => {
    // regression: an open wagon whose covered unit carries lumber opened open, drawing coal under lumber
    const UNIT = [{ name: "unit", title: "Wagon", default: "open", values: [{ value: "open", title: "Open" }, { value: "covered", title: "Covered" }] }] as ChainRecord["params"];
    const wagon = vehicle("proc-vehicle-boxn", "Open and covered wagon", {
      tonnes: 58, commodities: ["coal", "grain"],
      variants: [{ params: { unit: "covered" }, tonnes: 58, commodities: ["goods", "lumber", "grain"] }],
    }, { params: UNIT });
    const big = vehicle("proc-vehicle-sized", "Sized flat", { tonnes: 40, commodities: ["steel"], variants: [{ params: { size: "big" }, tonnes: 70, commodities: ["steel"] }] }, { params: SIZE });
    const wg = chainGraph([wagon, big]);
    const opens = (c: string, id: string) => carriers(wg, c).find((v) => v.id === id)!.params;
    expect(opens("coal", "proc-vehicle-boxn")).toEqual({});
    expect(opens("lumber", "proc-vehicle-boxn")).toEqual({ unit: "covered" });
    expect(opens("goods", "proc-vehicle-boxn")).toEqual({ unit: "covered" });
    // carried alike at the defaults and in a variant: the defaults
    expect(opens("grain", "proc-vehicle-boxn")).toEqual({});
    // the most tonnes win
    expect(opens("steel", "proc-vehicle-sized")).toEqual({ size: "big" });
  });

  it("sort carriers by tonnes, the biggest first, and skip vehicles that carry nothing", () => {
    const more = chainGraph([...CATALOG, vehicle("proc-vehicle-big", "Big hopper", { tonnes: 90, commodities: ["coal"] })]);
    expect(carriers(more, "coal").map((v) => v.id)).toEqual(["proc-vehicle-big", "proc-vehicle-hopper"]);
    expect(carriers(more, "mail").map((v) => v.id)).toEqual(["proc-vehicle-van"]);
  });
});

describe("the phone's chains", () => {
  const g = chainGraph(CATALOG);

  it("run from the raw end through the processors to the consumers, mail last", () => {
    expect(g.chains.map((c) => c.title)).toEqual([
      "Coal -> Power plant",
      "Cement -> Towns",
      "Wood + Coal + Iron ore -> Steel -> Goods -> Towns",
      "Oil -> Fuel -> Towns, Power plant",
      "Mail: town to town",
    ].sort((a, b) => order(a) - order(b)));
    const goods = g.chains.find((c) => c.id === "goods")!;
    expect(goods.steps).toEqual(["make-wood", "wood", "make-coal", "coal", "make-iron-ore", "iron-ore", "process-steel", "steel", "process-goods", "goods", "towns"]);
    expect(g.chains.at(-1)).toEqual({ id: "mail", title: "Mail: town to town", steps: ["towns", "mail"] });
  });

  it("follow a new building into the graph by its numbers alone", () => {
    const more = chainGraph([...CATALOG, building("proc-building-mine", "Coal mine", { produces: { coal: 20 } })]);
    expect(more.nodes.get("make-coal")).toMatchObject({ title: "Coal mine", empty: false });
    expect(more.chains.find((c) => c.id === "coal")!.steps).toEqual(["make-coal", "coal", "takes-power"]);
  });
});

/** The chains in the order their end commodity comes (COMMODITY_ORDER), mail last. */
function order(title: string): number {
  const ends: Record<string, number> = { "Coal -> Power plant": 2, "Wood + Coal + Iron ore -> Steel -> Goods -> Towns": 7, "Cement -> Towns": 10, "Oil -> Fuel -> Towns, Power plant": 11, "Mail: town to town": 99 };
  return ends[title]!;
}

describe("the graph's input under pnpm dev", () => {
  // regression: every dev measurement replaced the records, rebuilt the graph and
  // remounted the panel's cards, so their thumbnails blinked and queued again
  it("is the same when records are only measured, and differs when the chain changes", () => {
    const measured = CATALOG.map((r) => ({ ...r, triangles: 1234, jsHash: "abc" }) as ChainRecord);
    expect(sameChainInput(CATALOG, measured)).toBe(true);
    const retitled = CATALOG.map((r, i) => (i === 0 ? { ...r, title: "Other" } : r));
    expect(sameChainInput(CATALOG, retitled)).toBe(false);
    const regamed = CATALOG.map((r, i) => (i === 0 ? { ...r, game: { ...r.game } } : r));
    expect(sameChainInput(CATALOG, regamed)).toBe(false);
    expect(sameChainInput(CATALOG, CATALOG.slice(1))).toBe(false);
    expect(sameChainInput(null, CATALOG)).toBe(false);
  });
});
