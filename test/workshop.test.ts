// The catalog and the workshop (generator/workshop.ts, docs/site/workshop.md): a
// model not listed in generator/catalogModels.json is a draft. The site lists it
// under Workshop, the game's meta files leave it out, its prerendered page stays out
// of the index. And the web links a model page shows (generator/linkTable.ts).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import CATALOG_JSON from "../generator/catalogModels.json";
import { CATALOG_FILE, VEHICLE_META_FILE, catalogRecord, metaEntry, type CatalogRecord, type ModelCatalog, type VehicleExportMeta } from "../generator/catalog";
import { DESIGNS, buildExport } from "../generator/generate";
import { CATALOG_IDS, isDraft, unknownCatalogIds } from "../generator/workshop";
import { MODEL_LINKS, linkTableProblems, linksOf } from "../generator/linkTable";
import { sitePages } from "../generator/sitePages";
import { parseView, prepareRows, sectionHeading, sectionRows, viewUrl } from "../src/catalogQuery";
import { readStoredFacts } from "../generator/buildCache";

const CONFIRMED = "proc-vehicle-cd-150";
// a Dutch locomotive, added after the Vectron: a draft (the Japanese trains are confirmed)
const DRAFT = "proc-vehicle-ns-1700";

describe("catalogModels.json", () => {
  it("is sorted, without duplicates, and names only existing models", () => {
    const ids = CATALOG_JSON.ids;
    expect([...ids].sort()).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(unknownCatalogIds(DESIGNS.keys())).toEqual([]);
  });

  it("confirms the models up to the Vectron and leaves the later ones in the workshop", () => {
    expect(isDraft("proc-vehicle-vectron")).toBe(false);
    expect(isDraft(CONFIRMED)).toBe(false);
    expect(isDraft(DRAFT)).toBe(true);
    // a model nobody listed yet is a draft: a new model starts in the workshop
    expect(isDraft("proc-vehicle-brand-new")).toBe(true);
    expect(unknownCatalogIds(["a"], new Set(["a", "b"]))).toEqual(["b"]);
    expect(CATALOG_IDS.size).toBe(CATALOG_JSON.ids.length);
  });
});

describe("a draft in the export", () => {
  it("is in catalog.json, flagged, and in no game meta file", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-workshop-"));
    try {
      await buildExport(dir, [DESIGNS.get(CONFIRMED)!, DESIGNS.get(DRAFT)!]);
      const vehicles = JSON.parse(fs.readFileSync(path.join(dir, VEHICLE_META_FILE), "utf8")) as VehicleExportMeta;
      const catalog = JSON.parse(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")) as ModelCatalog;
      expect(vehicles.vehicles.map((v) => v.id)).toEqual([CONFIRMED]);
      expect(vehicles.count).toBe(1);
      expect(catalog.records.map((r) => [r.id, r.draft ?? false])).toEqual([[CONFIRMED, false], [DRAFT, true]]);
      // the site still shows it: its model is written, its thumbnail is not (the
      // browser renders it when shown); the confirmed model's is
      expect(fs.existsSync(path.join(dir, "js", `${DRAFT}.js`))).toBe(true);
      expect(fs.existsSync(path.join(dir, "thumbs", `${DRAFT}.png`))).toBe(false);
      expect(fs.existsSync(path.join(dir, "thumbs", `${CONFIRMED}.png`))).toBe(true);
      const draft = catalog.records.find((r) => r.id === DRAFT)!;
      expect(draft.thumbBytes).toBe(0);
      // a side-view vehicle still states its frame, so the browser's thumbnail keeps the scale
      expect(draft.thumbSide).toBeDefined();
      // the build cache keeps both models' facts, and only the confirmed model's thumbnail
      const cache = readStoredFacts(path.join(dir, ".build-cache"));
      expect([...cache.keys()]).toEqual([CONFIRMED, DRAFT].sort());
      expect(fs.readdirSync(path.join(dir, ".build-cache", "thumbs"))).toEqual([`${CONFIRMED}.png`]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

function rec(id: string, extra: Partial<CatalogRecord> = {}): CatalogRecord {
  return {
    id, title: id, category: "Rail vehicles", group: "loco", traction: "electric", js: `${id}.js`, thumb: `${id}.png`,
    license: "CC0", author: "Rail Island", source: "Rail Island", thumbUrl: `thumbs/${id}.png`, jsUrl: `js/${id}.js`,
    jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1, triangles: 1, vertices: 3, primitives: 1, materials: 1, sizeX: 1, sizeY: 1, sizeZ: 1, references: [],
    ...extra,
  };
}

describe("the site's sections", () => {
  const rows = prepareRows([rec("proc-vehicle-a"), rec("proc-vehicle-b", { draft: true })]);

  it("lists the catalog by default and the drafts under Workshop", () => {
    expect(parseView("").section).toBe("catalog");
    expect(parseView("?section=workshop").section).toBe("workshop");
    expect(parseView("?section=bogus").section).toBe("catalog");
    expect(sectionRows(rows, "catalog").map((r) => r.id)).toEqual(["proc-vehicle-a"]);
    expect(sectionRows(rows, "workshop").map((r) => r.id)).toEqual(["proc-vehicle-b"]);
    expect(sectionHeading("catalog")).toBe("Rail Island Catalog");
    expect(sectionHeading("workshop")).toBe("Rail Island Workshop");
  });

  it("round-trips the workshop in the URL, the catalog being the bare one", () => {
    expect(viewUrl(parseView("?section=workshop"))).toBe("/?section=workshop");
    expect(viewUrl(parseView("?section=workshop", "/category/train/"))).toBe("/category/train/?section=workshop");
    expect(viewUrl(parseView(""))).toBe("/");
  });

  it("prerenders a draft's page out of the index, the sitemap and the catalog's lists", () => {
    const files = sitePages(fs.readFileSync("index.html", "utf8"), [rec("proc-vehicle-a"), rec("proc-vehicle-b", { draft: true })]);
    const draftPage = files.get("model/proc-vehicle-b/index.html")!;
    expect(draftPage).toContain(`<meta name="robots" content="noindex" />`);
    expect(files.get("model/proc-vehicle-a/index.html")!).not.toContain("noindex");
    expect(files.get("sitemap.xml")!).not.toContain("proc-vehicle-b");
    expect(files.get("sitemap.xml")!).toContain("proc-vehicle-a");
    expect(files.get("index.html")!).not.toContain("/model/proc-vehicle-b/");
    // no thumbnail file to point at: neither an <img> nor a link preview image
    expect(draftPage).not.toContain("thumbs/proc-vehicle-b.png");
    expect(files.get("model/proc-vehicle-a/index.html")!).toContain("thumbs/proc-vehicle-a.png");
  });
});

describe("web links", () => {
  it("the table names existing models with titled, unique https links", () => {
    expect(linkTableProblems(DESIGNS.keys())).toEqual([]);
    expect(linksOf("proc-vehicle-vectron").length).toBeGreaterThan(0);
    expect(linksOf("proc-vehicle-no-such")).toEqual([]);
  });

  it("reports a bad table", () => {
    const bad = { "proc-x": [{ title: "", url: "http://example.com" }, { title: "a", url: "http://example.com" }] };
    expect(linkTableProblems([], bad)).toEqual([
      "proc-x: no such model",
      "proc-x: a link without a title (http://example.com)",
      'proc-x: "http://example.com" is not an https URL',
      'proc-x: "http://example.com" is not an https URL',
      'proc-x: "http://example.com" is listed twice',
    ]);
  });

  it("reaches a model's catalog record, and only its own", () => {
    const facts = { jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1, triangles: 1, vertices: 1, primitives: 1, materials: 1, min: [0, 0, 0] as [number, number, number], max: [1, 1, 1] as [number, number, number] };
    const vectron = catalogRecord(metaEntry(DESIGNS.get("proc-vehicle-vectron")!), facts);
    expect(vectron.links).toEqual(MODEL_LINKS["proc-vehicle-vectron"]);
    expect("draft" in vectron).toBe(false);
    const draft = catalogRecord(metaEntry(DESIGNS.get(DRAFT)!), facts);
    expect(draft.links).toEqual(MODEL_LINKS[DRAFT]);
    expect(draft.draft).toBe(true);
    // a model without links carries no links field
    const cd150 = catalogRecord(metaEntry(DESIGNS.get(CONFIRMED)!), facts);
    expect(MODEL_LINKS[CONFIRMED]).toBeUndefined();
    expect("links" in cd150).toBe(false);
  });
});
