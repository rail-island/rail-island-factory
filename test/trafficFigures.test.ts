// A building's passengers-and-cargo columns (src/trafficFigures.ts, the catalog's
// COLUMNS in src/catalogQuery.ts; docs/site/catalog-site.md): the default's figure,
// a range over the variants, the per-minute trips, and which pages show them.

import { describe, expect, it } from "vitest";
import { cellText, column, compareRows, prepareRows, type CatalogRecord } from "../src/catalogQuery";
import { formatAmount } from "../src/chains";
import { tripsPerMinute } from "../src/trafficFigures";

type Game = NonNullable<CatalogRecord["game"]>;

const SIZE = [{ name: "size", title: "Size", default: "normal", values: [{ value: "normal", title: "Normal" }, { value: "extended", title: "Extended" }] }] as CatalogRecord["params"];

function rec(id: string, game: Game | undefined, params?: CatalogRecord["params"]): CatalogRecord {
  return {
    id, title: id, category: "Industry", group: "industry", js: `${id}.js`, thumb: `${id}.png`, license: "CC0", author: "Rail Island", source: "Rail Island",
    thumbUrl: `thumbs/${id}.png`, jsUrl: `js/${id}.js`, jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1,
    triangles: 1, vertices: 1, primitives: 1, materials: 1, sizeX: 1, sizeY: 1, sizeZ: 1, references: [],
    ...(game ? { game } : {}), ...(params ? { params } : {}),
  };
}

const MILL = rec("mill", {
  traffic: {
    unit: "min", jobs: 200,
    processes: { output: "steel", inputs: { "iron-ore": 1, coal: 0.5 }, rate: 360, stock: 3600 },
    variants: [{ params: { size: "extended" }, jobs: 300, processes: { output: "steel", inputs: { "iron-ore": 1, coal: 0.5 }, rate: 540, stock: 5400 } }],
  },
} as Game, SIZE);
const MINE = rec("mine", {
  traffic: { unit: "min", jobs: 120, produces: { coal: 300 }, accepts: ["fuel"], variants: [{ params: { size: "extended" }, produces: { "iron-ore": 360 } }] },
} as Game, SIZE);
const HOUSE = rec("house", { traffic: { unit: "min", residents: 4, produces: { mail: 0.0017 }, accepts: ["food", "goods", "mail"] } } as Game);
const STATION = rec("station", { traffic: {} } as Game);
const WAGON = rec("wagon", { capacity: { tonnes: 58, commodities: ["coal"] } } as Game);

const text = (key: string, r: CatalogRecord) => cellText(r, column(key)!);

describe("the passengers-and-cargo columns", () => {
  it("show the default's figures when no variant differs", () => {
    expect(text("residents", HOUSE)).toBe("4");
    expect(text("jobs", HOUSE)).toBe("-");
    // 4 residents x 5 / 60 trips a minute
    expect(text("passengers", HOUSE)).toBe("0.33");
    expect(text("produces", HOUSE)).toBe("mail 0.0017");
    expect(text("consumes", HOUSE)).toBe("food, goods, mail");
    expect(text("recipe", HOUSE)).toBe("-");
  });

  it("show a range over the variants", () => {
    expect(text("jobs", MILL)).toBe("200-300");
    // 200 jobs x 2.5 / 60 = 8.33, 300 jobs = 12.5
    expect(text("passengers", MILL)).toBe("8.33-12.5");
    expect(text("recipe", MILL)).toBe("1 iron ore + 0.5 coal -> steel, 360-540 t/min");
    // a recipe's inputs are taken in too
    expect(text("consumes", MILL)).toBe("coal, iron ore");
    expect(text("produces", MINE)).toBe("coal 300, iron ore 360");
    expect(text("jobs", MINE)).toBe("120");
  });

  it("count trips per minute with the game's constants", () => {
    expect(tripsPerMinute({ residents: 12, jobs: 24 })).toBeCloseTo(2);
    expect(tripsPerMinute({})).toBe(0);
  });

  it("sort by the default's figure, blanks last", () => {
    const rows = prepareRows([HOUSE, MILL, MINE, STATION, WAGON]);
    const sorted = (key: string) => [...rows].sort((a, b) => compareRows(a, b, column(key)!, "desc")).map((r) => r.id);
    // a mill's default 8.33 trips, a mine's 120 jobs = 5, a house 0.33; the station and the wagon have none
    expect(sorted("passengers")).toEqual(["mill", "mine", "house", "station", "wagon"]);
    // the mine's default makes 300 t/min, not the 360 of its variant
    expect(sorted("produces")).toEqual(["mine", "house", "mill", "station", "wagon"]);
    expect(sorted("recipe")[0]).toBe("mill");
  });

  it("are a building's only: a vehicle's spec list leaves them out, the table shows four", () => {
    const traffic = ["residents", "jobs", "passengers", "produces", "consumes", "recipe"].map((k) => column(k)!);
    for (const c of traffic) {
      expect(c.only!(WAGON), c.key).toBe(false);
      expect(c.only!(STATION), c.key).toBe(true);
      expect(text(c.key, WAGON), c.key).toBe("-");
    }
    expect(traffic.filter((c) => c.table).map((c) => c.key)).toEqual(["residents", "jobs", "passengers", "produces"]);
  });
});

describe("formatAmount", () => {
  it("keeps a small amount readable, never 0", () => {
    expect(formatAmount(0.0017)).toBe("0.0017");
    expect(formatAmount(0.0083)).toBe("0.0083");
    expect(formatAmount(0.33333)).toBe("0.33");
    expect(formatAmount(540)).toBe("540");
    expect(formatAmount(0)).toBe("0");
  });
});
