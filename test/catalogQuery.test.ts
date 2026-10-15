// The site's listing logic (src/catalogQuery.ts): search, sort and the URL state.

import { describe, expect, it } from "vitest";
import {
  COLUMNS, DEFAULT_SORT, cellFile, cellText, column, compareRows, formatBytes, parseView, prepareRows, queryRows, serializeView,
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

describe("the URL state", () => {
  it("round-trips, leaving defaults out", () => {
    expect(serializeView(parseView(""))).toBe("");
    const v = { q: "tower", sort: "triangles", dir: "asc" as const, model: "sky-pagoda", tab: "specs" as const, node: null };
    expect(parseView(serializeView(v))).toEqual(v);
  });

  it("carries the source tab and the selected node of an open model", () => {
    const v = { q: "", sort: DEFAULT_SORT, dir: "asc" as const, model: "sky-art-deco", tab: "source" as const, node: "tier-3/piers" };
    expect(serializeView(v)).toBe("?model=sky-art-deco&tab=source&node=tier-3%2Fpiers");
    expect(parseView(serializeView(v))).toEqual(v);
    // the root scope's id is the empty string, and still a selection
    expect(parseView("?model=sky-pagoda&tab=source&node=").node).toBe("");
    expect(parseView(serializeView({ ...v, node: "" })).node).toBe("");
  });

  it("carries the references tab of an open model, without a node", () => {
    const v = { q: "", sort: DEFAULT_SORT, dir: "asc" as const, model: "veh-cd-150", tab: "references" as const, node: null };
    expect(serializeView(v)).toBe("?model=veh-cd-150&tab=references");
    expect(parseView(serializeView(v))).toEqual(v);
    expect(parseView("?model=veh-cd-150&tab=references&node=crown")).toMatchObject({ tab: "references", node: null });
    expect(serializeView({ ...v, node: "crown" })).toBe("?model=veh-cd-150&tab=references");
  });
  it("drops a tab or node that has no model or no source tab to belong to", () => {
    expect(parseView("?tab=source&node=crown")).toMatchObject({ model: null, tab: "specs", node: null });
    expect(parseView("?model=sky-pagoda&node=crown")).toMatchObject({ tab: "specs", node: null });
    expect(parseView("?model=sky-pagoda&tab=bogus")).toMatchObject({ tab: "specs", node: null });
    expect(serializeView({ q: "", sort: DEFAULT_SORT, dir: "asc", model: "sky-pagoda", tab: "specs", node: "crown" })).toBe("?model=sky-pagoda");
  });

  it("gives a column its own starting direction and ignores an unknown sort", () => {
    expect(parseView("?sort=triangles").dir).toBe("desc");
    expect(parseView("?sort=bogus&dir=sideways")).toEqual({ q: "", sort: DEFAULT_SORT, dir: "asc", model: null, tab: "specs", node: null });
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
