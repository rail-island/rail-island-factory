// The site's listing logic (src/catalogQuery.ts): search, sort and the URL state.

import { describe, expect, it } from "vitest";
import {
  COLUMNS, DEFAULT_SORT, cellFile, cellText, column, compareRows, effectiveParams, formatBytes, isDefaultParams, nonDefaultParams, parseView,
  NO_CHIPS, chipLabel, chipRows, groupOf, prepareRows, queryRows, serializeView,
  type CatalogRecord,
} from "../src/catalogQuery";

function rec(id: string, title: string, triangles: number, extra: Partial<CatalogRecord> = {}): CatalogRecord {
  return {
    id, title, category: "Commercial", group: "skyscraper_c", glb: `${id}.glb`, thumb: `${id}.png`,
    defaultScale: 0.5, license: "CC0", author: "Rail Island", source: "Rail Island",
    glbUrl: `glb/${id}.glb`, thumbUrl: `thumbs/${id}.png`, glbBytes: triangles * 72, glbGzipBytes: triangles * 6, jsUrl: `js/${id}.js`,
    jsBytes: triangles * 2, jsGzipBytes: triangles, thumbBytes: 100,
    triangles, vertices: triangles * 3, primitives: 3, materials: 3, sizeX: 20, sizeY: 80, sizeZ: 20, references: [],
    ...extra,
  };
}

const ROWS = prepareRows([
  rec("sky-pagoda", "Pagoda Tower", 912),
  rec("sky-art-deco", "Art Deco Tower", 1272),
  rec("sky-twin-towers", "Twin Towers", 2930, { license: "CC-BY" }),
]);

describe("queryRows", () => {
  it("sorts by title by default", () => {
    expect(queryRows(ROWS, "", DEFAULT_SORT, "asc").map((r) => r.id)).toEqual(["sky-art-deco", "sky-pagoda", "sky-twin-towers"]);
  });

  it("sorts numbers numerically in both directions", () => {
    expect(queryRows(ROWS, "", "triangles", "desc").map((r) => r.triangles)).toEqual([2930, 1272, 912]);
    expect(queryRows(ROWS, "", "triangles", "asc").map((r) => r.triangles)).toEqual([912, 1272, 2930]);
  });

  it("matches every word of the search, case-insensitively, across fields", () => {
    expect(queryRows(ROWS, "TOWER deco", "title", "asc").map((r) => r.id)).toEqual(["sky-art-deco"]);
    expect(queryRows(ROWS, "cc-by", "title", "asc").map((r) => r.id)).toEqual(["sky-twin-towers"]);
    expect(queryRows(ROWS, "nothing", "title", "asc")).toEqual([]);
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
    rec("veh-american-truck", "American Truck", 9000, { category: "Road vehicles", group: "truck" }),
    rec("veh-cd-150", "CD 150", 8000, { category: "Rail vehicles", group: "loco" }),
    rec("veh-cd-163", "CD 163", 8100, { category: "Rail vehicles", group: "loco" }),
    rec("veh-bmo", "Bmo", 7000, { category: "Rail vehicles", group: "coach" }),
    rec("sky-village", "Village Tower", 500, { category: "Village", group: "village" }),
  ]);
  const ids = (path: Partial<typeof NO_CHIPS>) => queryRows(MIXED, "", "title", "asc", { ...NO_CHIPS, ...path }).map((r) => r.id);

  it("files vehicles under their fleet and everything else under Buildings", () => {
    expect(MIXED.map(groupOf)).toEqual(["building", "building", "building", "moto", "train", "train", "train", "building"]);
  });

  it("offers only the fleets that have models, in the Creator's order, and no lower row without a pick", () => {
    expect(chipRows(MIXED, NO_CHIPS)).toEqual({ groups: ["train", "moto", "building"], l2: [], l3: [] });
  });

  it("splits a fleet by its group, and a building by category, then city pool", () => {
    expect(chipRows(MIXED, { ...NO_CHIPS, group: "train" })).toEqual({ groups: ["train", "moto", "building"], l2: ["coach", "loco"], l3: [] });
    expect(chipRows(MIXED, { ...NO_CHIPS, group: "building" }).l2).toEqual(["Commercial", "Village"]);
    // one city pool under Commercial is no choice, so no third row
    expect(chipRows(MIXED, { group: "building", l2: "Commercial", l3: null }).l3).toEqual([]);
    // a fleet of one type has no second row
    expect(chipRows(MIXED, { ...NO_CHIPS, group: "moto" }).l2).toEqual([]);
  });

  it("filters the listing by the picked chips", () => {
    expect(ids({ group: "train" })).toEqual(["veh-bmo", "veh-cd-150", "veh-cd-163"]);
    expect(ids({ group: "train", l2: "loco" })).toEqual(["veh-cd-150", "veh-cd-163"]);
    expect(ids({ group: "building", l2: "Village" })).toEqual(["sky-village"]);
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
    const v = { q: "tower", ...NO_CHIPS, sort: "triangles", dir: "asc" as const, model: "sky-pagoda", tab: "specs" as const, node: null, params: {} };
    expect(parseView(serializeView(v))).toEqual(v);
  });

  it("carries the source tab and the selected node of an open model", () => {
    const v = { q: "", ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc" as const, model: "sky-art-deco", tab: "source" as const, node: "tier-3/piers", params: {} };
    expect(serializeView(v)).toBe("?model=sky-art-deco&tab=source&node=tier-3%2Fpiers");
    expect(parseView(serializeView(v))).toEqual(v);
    // the root scope's id is the empty string, and still a selection
    expect(parseView("?model=sky-pagoda&tab=source&node=").node).toBe("");
    expect(parseView(serializeView({ ...v, node: "" })).node).toBe("");
  });

  it("carries the references tab of an open model, without a node", () => {
    const v = { q: "", ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc" as const, model: "veh-cd-150", tab: "references" as const, node: null, params: {} };
    expect(serializeView(v)).toBe("?model=veh-cd-150&tab=references");
    expect(parseView(serializeView(v))).toEqual(v);
    expect(parseView("?model=veh-cd-150&tab=references&node=crown")).toMatchObject({ tab: "references", node: null });
    expect(serializeView({ ...v, node: "crown" })).toBe("?model=veh-cd-150&tab=references");
  });
  it("drops a tab or node that has no model or no source tab to belong to", () => {
    expect(parseView("?tab=source&node=crown")).toMatchObject({ model: null, tab: "specs", node: null, params: {} });
    expect(parseView("?model=sky-pagoda&node=crown")).toMatchObject({ tab: "specs", node: null });
    expect(parseView("?model=sky-pagoda&tab=bogus")).toMatchObject({ tab: "specs", node: null });
    expect(serializeView({ q: "", ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc", model: "sky-pagoda", tab: "specs", node: "crown", params: {} })).toBe("?model=sky-pagoda");
  });

  it("carries a parametric model's chosen values, only with an open model", () => {
    const v = { q: "", ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc" as const, model: "veh-csd-classic-green-coach", tab: "specs" as const, node: null, params: { variant: "classB" } };
    expect(serializeView(v)).toBe("?model=veh-csd-classic-green-coach&p.variant=classB");
    expect(parseView(serializeView(v))).toEqual(v);
    expect(parseView("?p.variant=classB").params).toEqual({});
    expect(serializeView({ ...v, model: null })).toBe("");
  });

  it("gives a column its own starting direction and ignores an unknown sort", () => {
    expect(parseView("?sort=triangles").dir).toBe("desc");
    expect(parseView("?sort=bogus&dir=sideways")).toEqual({ q: "", ...NO_CHIPS, sort: DEFAULT_SORT, dir: "asc", model: null, tab: "specs", node: null, params: {} });
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

describe("downloads", () => {
  it("makes the GLB and JS sizes links to their files, and no other column", () => {
    const r = ROWS[0]!;
    expect(cellFile(r, column("glbBytes")!)).toEqual({ href: "/glb/sky-pagoda.glb", name: "sky-pagoda.glb" });
    expect(cellFile(r, column("jsBytes")!)).toEqual({ href: "/js/sky-pagoda.js", name: "sky-pagoda.js" });
    for (const c of COLUMNS.filter((c) => c.key !== "glbBytes" && c.key !== "jsBytes")) expect(cellFile(r, c)).toBeNull();
  });

  it("lists the JS size and the gzip sizes as sortable columns", () => {
    expect(column("jsBytes")!.table).toBe(true);
    const sorted = queryRows(ROWS, "", "jsGzipBytes", "desc").map((r) => r.id);
    expect(sorted).toEqual(["sky-twin-towers", "sky-art-deco", "sky-pagoda"]);
  });
});
