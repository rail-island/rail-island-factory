// The site's listing logic (src/catalogQuery.ts): search, sort and the URL state.

import { describe, expect, it } from "vitest";
import {
  COLUMNS, DEFAULT_SORT, cellFile, cellText, column, compareRows, effectiveParams, formatBytes, isDefaultParams, nonDefaultParams, parseView,
  NO_CHIPS, chipLabel, chipRows, groupOf, prepareRows, queryRows, serializeView,
  MAX_SHOWN_VARIANTS, representativeVariants, variantCaption, variantCount, variantThumbKey,
  type CatalogRecord,
} from "../src/catalogQuery";

function rec(id: string, title: string, triangles: number, extra: Partial<CatalogRecord> = {}): CatalogRecord {
  return {
    id, title, category: "Commercial", group: "skyscraper_c", js: `${id}.js`, thumb: `${id}.png`,
    defaultScale: 0.5, license: "CC0", author: "Rail Island", source: "Rail Island",
    thumbUrl: `thumbs/${id}.png`, jsUrl: `js/${id}.js`,
    jsBytes: triangles * 2, jsGzipBytes: triangles, thumbBytes: 100,
    triangles, vertices: triangles * 3, primitives: 3, materials: 3, sizeX: 20, sizeY: 80, sizeZ: 20, references: [],
    ...extra,
  };
}

const ROWS = prepareRows([
  rec("proc-building-sky-pagoda", "Pagoda Tower", 912),
  rec("proc-building-sky-art-deco", "Art Deco Tower", 1272),
  rec("proc-building-sky-twin-towers", "Twin Towers", 2930, { license: "CC-BY" }),
]);

describe("queryRows", () => {
  it("sorts by title by default", () => {
    expect(queryRows(ROWS, "", DEFAULT_SORT, "asc").map((r) => r.id)).toEqual(["proc-building-sky-art-deco", "proc-building-sky-pagoda", "proc-building-sky-twin-towers"]);
  });

  it("sorts numbers numerically in both directions", () => {
    expect(queryRows(ROWS, "", "triangles", "desc").map((r) => r.triangles)).toEqual([2930, 1272, 912]);
    expect(queryRows(ROWS, "", "triangles", "asc").map((r) => r.triangles)).toEqual([912, 1272, 2930]);
  });

  it("matches every word of the search, case-insensitively, across fields", () => {
    expect(queryRows(ROWS, "TOWER deco", "title", "asc").map((r) => r.id)).toEqual(["proc-building-sky-art-deco"]);
    expect(queryRows(ROWS, "cc-by", "title", "asc").map((r) => r.id)).toEqual(["proc-building-sky-twin-towers"]);
    expect(queryRows(ROWS, "nothing", "title", "asc")).toEqual([]);
  });

  it("finds a parametric model by the title or token of one of its variants", () => {
    const rows = prepareRows([
      rec("proc-vehicle-cd-749", "CD 749 Bardotka", 9000, {
        category: "Rail vehicles", group: "loco", traction: "diesel",
        params: [{ name: "livery", title: "Livery", default: "cd749", values: [
          { value: "cd749", title: "CD 749" },
          { value: "cd749No264", title: "CD 749 264" },
        ] }],
      }),
      ...ROWS,
    ]);
    expect(queryRows(rows, "749 264", "title", "asc").map((r) => r.id)).toEqual(["proc-vehicle-cd-749"]);
    expect(queryRows(rows, "cd749no264", "title", "asc").map((r) => r.id)).toEqual(["proc-vehicle-cd-749"]);
    expect(queryRows(rows, "diesel", "title", "asc").map((r) => r.id)).toEqual(["proc-vehicle-cd-749"]);
  });

  it("breaks ties on the title, so the order is total", () => {
    const tied = prepareRows([rec("b", "Beta", 5), rec("a", "Alpha", 5)]);
    expect(compareRows(tied[0]!, tied[1]!, column("triangles")!, "desc")).toBeGreaterThan(0);
  });

  it("offers a sort for every column", () => {
    for (const c of COLUMNS) expect(() => queryRows(ROWS, "", c.key, c.dir)).not.toThrow();
  });
});

describe("cellText", () => {
  it("formats numbers, sizes and units", () => {
    expect(cellText(ROWS[2]!, column("triangles")!)).toBe("2,930");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2.0 kB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.00 MB");
  });
});

describe("the filter chips", () => {
  const MIXED = prepareRows([
    ...ROWS,
    rec("proc-vehicle-american-truck", "American Truck", 9000, { category: "Road vehicles", group: "truck" }),
    rec("proc-vehicle-cd-150", "CD 150", 8000, { category: "Rail vehicles", group: "loco", traction: "electric" }),
    rec("proc-vehicle-cd-163", "CD 163", 8100, { category: "Rail vehicles", group: "loco", traction: "electric" }),
    rec("veh-bmo", "Bmo", 7000, { category: "Rail vehicles", group: "coach" }),
    rec("sky-village", "Village Tower", 500, { category: "Village", group: "village" }),
    rec("sky-village-red", "Red Village House", 400, { category: "Village", group: "village_red" }),
  ]);
  const ids = (path: Partial<typeof NO_CHIPS>) => queryRows(MIXED, "", "title", "asc", { ...NO_CHIPS, ...path }).map((r) => r.id);

  it("files vehicles under their fleet and everything else under Buildings", () => {
    expect(MIXED.map(groupOf)).toEqual(["building", "building", "building", "moto", "train", "train", "train", "building", "building"]);
  });

  it("files a cable car cabin under Cable cars, not Buildings (its category is the singular 'Cable car')", () => {
    expect(groupOf(rec("proc-vehicle-gondola-cabin", "Small Gondola", 900, { category: "Cable car", group: "cabin" }))).toBe("cablecar");
    expect(groupOf(rec("proc-vehicle-cabin-classic", "Classic Cabin", 900, { category: "Cable car", group: "cablecar" }))).toBe("cablecar");
  });

  it("files a tram under Trams, though its category is Rail vehicles", () => {
    expect(groupOf(rec("proc-vehicle-tatra-t3", "Tatra T3", 9000, { category: "Rail vehicles", group: "tram" }))).toBe("tram");
  });

  it("offers only the fleets that have models, in the Creator's order, and no lower row without a pick", () => {
    expect(chipRows(MIXED, NO_CHIPS)).toEqual({ groups: ["train", "moto", "building"], l2: [], l3: [] });
  });

  it("splits a fleet by its group and a building by category, with no city-pool row", () => {
    expect(chipRows(MIXED, { ...NO_CHIPS, group: "train" })).toEqual({ groups: ["train", "moto", "building"], l2: ["coach", "loco"], l3: [] });
    expect(chipRows(MIXED, { ...NO_CHIPS, group: "building" }).l2).toEqual(["Commercial", "Village"]);
    // two city pools under Village are still no third row
    expect(chipRows(MIXED, { group: "building", l2: "Village", l3: null }).l3).toEqual([]);
    // a fleet of one type has no second row
    expect(chipRows(MIXED, { ...NO_CHIPS, group: "moto" }).l2).toEqual([]);
  });

  it("splits locomotives and units by traction, and keeps units apart from locomotives", () => {
    const fleet = prepareRows([
      rec("loco-e", "CD 150", 1, { category: "Rail vehicles", group: "loco", traction: "electric" }),
      rec("loco-d", "CD 750", 1, { category: "Rail vehicles", group: "loco", traction: "diesel" }),
      rec("loco-s", "CSD 433.0", 1, { category: "Rail vehicles", group: "loco", traction: "steam" }),
      rec("unit-e", "CD 471 CityElefant", 1, { category: "Rail vehicles", group: "unit", traction: "electric" }),
      rec("unit-d", "CD 810", 1, { category: "Rail vehicles", group: "unit", traction: "diesel" }),
      rec("coach", "Bmo", 1, { category: "Rail vehicles", group: "coach" }),
    ]);
    expect(chipRows(fleet, { ...NO_CHIPS, group: "train" }).l2).toEqual(["coach", "loco", "unit"]);
    expect(chipRows(fleet, { group: "train", l2: "loco", l3: null }).l3).toEqual(["diesel", "electric", "steam"]);
    expect(chipRows(fleet, { group: "train", l2: "unit", l3: null }).l3).toEqual(["diesel", "electric"]);
    expect(chipRows(fleet, { group: "train", l2: "coach", l3: null }).l3).toEqual([]);
    const pick = (l2: string, l3: string) => queryRows(fleet, "", "title", "asc", { group: "train", l2, l3 }).map((r) => r.id);
    expect(pick("loco", "steam")).toEqual(["loco-s"]);
    expect(pick("unit", "electric")).toEqual(["unit-e"]);
    expect(chipLabel("unit")).toBe("Unit");
  });

  it("filters the listing by the picked chips", () => {
    expect(ids({ group: "train" })).toEqual(["veh-bmo", "proc-vehicle-cd-150", "proc-vehicle-cd-163"]);
    expect(ids({ group: "train", l2: "loco" })).toEqual(["proc-vehicle-cd-150", "proc-vehicle-cd-163"]);
    expect(ids({ group: "building", l2: "Village" })).toEqual(["sky-village-red", "sky-village"]);
    expect(ids({ group: "ship" })).toEqual([]);
  });

  it("keeps a picked chip that matches nothing, so it can be switched off", () => {
    expect(chipRows(MIXED, { ...NO_CHIPS, group: "ship" }).groups).toContain("ship");
    expect(chipRows(MIXED, { group: "train", l2: "dmu", l3: null }).l2).toContain("dmu");
  });

  it("labels a value the Creator names, and any other as itself", () => {
    expect(chipLabel("loco")).toBe("Locomotive");
    expect(chipLabel("skyscraper_c")).toBe("skyscraper_c");
  });

  it("round-trips the chips in the URL, a lower one only under the one above", () => {
    const v = { ...parseView(""), group: "train", l2: "loco", l3: null };
    expect(serializeView(v)).toBe("?cat=train&sub=loco");
    expect(parseView(serializeView(v))).toEqual(v);
    expect(parseView("?cat=bogus&sub=loco")).toMatchObject({ group: null, l2: null, l3: null });
    expect(parseView("?sub=loco&sub2=x")).toMatchObject(NO_CHIPS);
  });
});

describe("the URL state", () => {
  it("round-trips, leaving defaults out", () => {
    expect(serializeView(parseView(""))).toBe("");
    const v = { q: "tower", layout: "table" as const, ...NO_CHIPS, sort: "triangles", dir: "asc" as const, model: "proc-building-sky-pagoda", tab: "specs" as const, node: null, params: {} };
    expect(parseView(serializeView(v))).toEqual(v);
  });

  it("carries the source tab and the selected node of an open model", () => {
    const v = { q: "", layout: "table" as const, ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc" as const, model: "proc-building-sky-art-deco", tab: "source" as const, node: "tier-3/piers", params: {} };
    expect(serializeView(v)).toBe("?model=proc-building-sky-art-deco&tab=source&node=tier-3%2Fpiers");
    expect(parseView(serializeView(v))).toEqual(v);
    // the root scope's id is the empty string, and still a selection
    expect(parseView("?model=proc-building-sky-pagoda&tab=source&node=").node).toBe("");
    expect(parseView(serializeView({ ...v, node: "" })).node).toBe("");
  });

  it("carries the references tab of an open model, without a node", () => {
    const v = { q: "", layout: "table" as const, ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc" as const, model: "proc-vehicle-cd-150", tab: "references" as const, node: null, params: {} };
    expect(serializeView(v)).toBe("?model=proc-vehicle-cd-150&tab=references");
    expect(parseView(serializeView(v))).toEqual(v);
    expect(parseView("?model=proc-vehicle-cd-150&tab=references&node=crown")).toMatchObject({ tab: "references", node: null });
    expect(serializeView({ ...v, node: "crown" })).toBe("?model=proc-vehicle-cd-150&tab=references");
  });
  it("drops a tab or node that has no model or no source tab to belong to", () => {
    expect(parseView("?tab=source&node=crown")).toMatchObject({ model: null, tab: "specs", node: null, params: {} });
    expect(parseView("?model=proc-building-sky-pagoda&node=crown")).toMatchObject({ tab: "specs", node: null });
    expect(parseView("?model=proc-building-sky-pagoda&tab=bogus")).toMatchObject({ tab: "specs", node: null });
    expect(serializeView({ q: "", layout: "table", ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc", model: "proc-building-sky-pagoda", tab: "specs", node: "crown", params: {} })).toBe("?model=proc-building-sky-pagoda");
  });

  it("carries a parametric model's chosen values, only with an open model", () => {
    const v = { q: "", layout: "table" as const, ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc" as const, model: "proc-vehicle-csd-classic-green-coach", tab: "specs" as const, node: null, params: { variant: "classB" } };
    expect(serializeView(v)).toBe("?model=proc-vehicle-csd-classic-green-coach&p.variant=classB");
    expect(parseView(serializeView(v))).toEqual(v);
    expect(parseView("?p.variant=classB").params).toEqual({});
    expect(serializeView({ ...v, model: null })).toBe("");
  });

  it("gives a column its own starting direction and ignores an unknown sort", () => {
    expect(parseView("?sort=triangles").dir).toBe("desc");
    expect(parseView("?sort=bogus&dir=sideways")).toEqual({ q: "", layout: "table", ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc", model: null, tab: "specs", node: null, params: {} });
  });
});

describe("parameters", () => {
  const coach = rec("veh-coach", "Coach", 100, {
    params: [{ name: "variant", title: "Variant", default: "classA", values: [{ value: "classA", title: "A" }, { value: "classB", title: "B" }] }],
  });
  it("resolve chosen values against the record's enums, falling back to the defaults", () => {
    expect(effectiveParams(coach, {})).toEqual({ variant: "classA" });
    expect(effectiveParams(coach, { variant: "classB" })).toEqual({ variant: "classB" });
    expect(effectiveParams(coach, { variant: "classZ", colour: "red" })).toEqual({ variant: "classA" });
    expect(effectiveParams(rec("sky-x", "X", 1), { variant: "classB" })).toEqual({});
  });
  it("tell the default build (the GLB) from a variant, and keep only non-defaults", () => {
    expect(isDefaultParams(coach, {})).toBe(true);
    expect(isDefaultParams(coach, { variant: "classA" })).toBe(true);
    expect(isDefaultParams(coach, { variant: "classB" })).toBe(false);
    expect(isDefaultParams(coach, { variant: "bogus" })).toBe(true);
    expect(nonDefaultParams(coach, { variant: "classA" })).toEqual({});
    expect(nonDefaultParams(coach, { variant: "classB" })).toEqual({ variant: "classB" });
  });
});

describe("the layout switch", () => {
  it("keeps the thumbnail layout in the URL, the table being the default", () => {
    expect(parseView("").layout).toBe("table");
    expect(parseView("?view=thumbs").layout).toBe("thumbs");
    expect(parseView("?view=bogus").layout).toBe("table");
    const v = { ...parseView(""), layout: "thumbs" as const, q: "tower" };
    expect(serializeView(v)).toBe("?q=tower&view=thumbs");
    expect(parseView(serializeView(v))).toEqual(v);
  });
});

describe("variants", () => {
  const livery = { name: "livery", title: "Livery", default: "red", values: ["red", "blue", "green"].map((v) => ({ value: v, title: v.toUpperCase() })) };
  const loco = rec("veh-loco", "Loco", 100, {
    params: [livery, { name: "cab", title: "Cab", default: "one", values: [{ value: "one", title: "One cab" }, { value: "two", title: "Two cabs" }] }],
  });
  // a TGV-like set: `cars` applies only to the `set` unit
  const tgv = rec("veh-tgv", "TGV", 100, {
    params: [
      { name: "unit", title: "Unit", default: "power", values: [{ value: "power", title: "Power car" }, { value: "set", title: "Set" }] },
      { name: "cars", title: "Cars", default: "1", when: { name: "unit", values: ["set"] }, values: ["1", "2", "3"].map((v) => ({ value: v, title: `${v} cars` })) },
    ],
  });

  it("counts every combination, a conditional parameter only where it applies", () => {
    expect(variantCount(rec("sky-x", "X", 1))).toBe(1);
    expect(variantCount(loco)).toBe(6);
    expect(variantCount(tgv)).toBe(4);
    const big = rec("big", "Big", 1, {
      params: ["a", "b", "c", "d", "e", "f"].map((n) => ({ name: n, title: n, default: "0", values: Array.from({ length: 10 }, (_, i) => ({ value: String(i), title: String(i) })) })),
    });
    expect(variantCount(big)).toBe(1_000_000);
  });

  it("picks the defaults first, then each parameter's values in turns, then combinations, at most ten", () => {
    expect(representativeVariants(rec("sky-x", "X", 1))).toEqual([{}]);
    // one parameter at a time, then the combinations left, spread over all of them
    expect(representativeVariants(loco)).toEqual([{}, { livery: "blue" }, { cab: "two" }, { livery: "green" }, { livery: "blue", cab: "two" }, { livery: "green", cab: "two" }]);
    expect(representativeVariants(loco, 4)).toHaveLength(4);
    expect(representativeVariants(tgv)).toEqual([{}, { unit: "set" }, { unit: "set", cars: "2" }, { unit: "set", cars: "3" }]);
    const many = rec("many", "Many", 1, {
      params: [{ name: "livery", title: "Livery", default: "v0", values: Array.from({ length: 30 }, (_, i) => ({ value: `v${i}`, title: `V${i}` })) }],
    });
    const shown = representativeVariants(many);
    expect(shown).toHaveLength(MAX_SHOWN_VARIANTS);
    expect(new Set(shown.map((p) => JSON.stringify(p))).size).toBe(MAX_SHOWN_VARIANTS);
  });

  it("captions a variant by its non-default values", () => {
    expect(variantCaption(loco, {})).toBe("Default");
    expect(variantCaption(loco, { livery: "blue", cab: "two" })).toBe("BLUE / Two cabs");
  });

  // Regression: the export panel showed the default's build thumbnail for every
  // listed variant. Its thumbnail is now looked up by the variant's own key.
  it("keys a variant thumbnail by the variant, the defaults and unknown values collapsing", () => {
    expect(variantThumbKey(loco, { livery: "blue" })).not.toBe(variantThumbKey(loco, {}));
    expect(variantThumbKey(loco, { livery: "red" })).toBe(variantThumbKey(loco, {}));
    expect(variantThumbKey(loco, { livery: "bogus", colour: "x" })).toBe(variantThumbKey(loco, {}));
    expect(variantThumbKey(loco, { livery: "blue", cab: "two" })).toBe(variantThumbKey(loco, { cab: "two", livery: "blue" }));
  });

  it("changes a thumbnail's key when the model's build changes", () => {
    expect(variantThumbKey({ ...loco, jsHash: "aaaa" }, {})).not.toBe(variantThumbKey({ ...loco, jsHash: "bbbb" }, {}));
  });
});

describe("downloads", () => {
  it("makes the JS size a link to its file, and no other column; there is no GLB", () => {
    const r = ROWS[0]!;
    expect(column("glbBytes")).toBeUndefined();
    expect(cellFile(r, column("jsBytes")!)).toEqual({ href: "/js/proc-building-sky-pagoda.js", name: "proc-building-sky-pagoda.js" });
    for (const c of COLUMNS.filter((c) => c.key !== "jsBytes")) expect(cellFile(r, c)).toBeNull();
  });

  it("lists the JS size and the gzip sizes as sortable columns", () => {
    expect(column("jsBytes")!.table).toBe(true);
    const sorted = queryRows(ROWS, "", "jsGzipBytes", "desc").map((r) => r.id);
    expect(sorted).toEqual(["proc-building-sky-twin-towers", "proc-building-sky-art-deco", "proc-building-sky-pagoda"]);
  });
});

describe("previewKey", () => {
  it("tells full, low, coarse and Max detail apart", async () => {
    const { previewKey } = await import("../src/catalogQuery");
    const keys = [previewKey("proc-tree-oak", {}), previewKey("proc-tree-oak", {}, true), previewKey("proc-tree-oak", {}, "coarse"), previewKey("proc-tree-oak", {}, "max")];
    expect(new Set(keys).size).toBe(4);
    expect(previewKey("proc-tree-oak", {}, false)).toBe(keys[0]);
  });
});

describe("the Trees chip", () => {
  it("files the tree species under a first-row chip of their own", async () => {
    const { groupOf } = await import("../src/catalogQuery");
    expect(groupOf({ category: "Trees", group: "tree" } as never)).toBe("tree");
  });
});


describe("detail selection", () => {
  it("offers Max detail only where supported and falls back to full when stepping away", async () => {
    const { previewLod } = await import("../src/catalogQuery");
    expect(previewLod({ maxDetail: true }, "max")).toBe("max");
    expect(previewLod({}, "max")).toBe(false);
    expect(previewLod({ coarse: true }, "coarse")).toBe("coarse");
    expect(previewLod({}, "coarse")).toBe(true);
  });
});


describe("retired oak seeds", () => {
  it("keeps old seed URLs on their original numbered shapes", async () => {
    const { OAK_PARAMS } = await import("../generator/oak");
    const { effectiveParams } = await import("../src/catalogQuery");
    const record = { params: OAK_PARAMS } as import("../generator/catalog").CatalogRecord;
    expect(effectiveParams(record, { seed: "7" }).seed).toBe("1");
    expect(effectiveParams(record, { seed: "19" }).seed).toBe("2");
  });
});
