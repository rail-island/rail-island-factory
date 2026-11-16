// The site-only facts tables (docs/site/seo-pages.md, "Facts"): the year in service
// (yearTable.ts, which the OpenTTD export reads), the maker (makerTable.ts) and the
// blurb (blurbTable.ts), and the text the pages build from them (src/pageMeta.ts).

import { describe, expect, it } from "vitest";
import type { CatalogRecord } from "../generator/catalog";
import { DESIGNS } from "../generator/generate";
import { BLURBS } from "../generator/blurbTable";
import { MAKER_ENTRIES } from "../generator/makerTable";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { YEAR_OF } from "../generator/yearTable";
import { kindNoun, modelFacts, modelMeta, modelSummary, namedKind } from "../src/pageMeta";

function rec(extra: Partial<CatalogRecord>): CatalogRecord {
  return {
    id: "proc-vehicle-x", title: "X", category: "Rail vehicles", group: "loco", traction: "electric", js: "x.js", thumb: "x.png",
    license: "CC0", author: "Rail Island", source: "Rail Island", thumbUrl: "thumbs/x.png", jsUrl: "js/x.js",
    jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1, triangles: 1000, vertices: 1, primitives: 1, materials: 1, sizeX: 10, sizeY: 4, sizeZ: 3, references: [],
    ...extra,
  };
}

describe("the year table", () => {
  it("names only designs that exist, with plausible years", () => {
    for (const [id, y] of YEAR_OF) {
      expect(DESIGNS.has(id), id).toBe(true);
      expect(Number.isInteger(y.year) && y.year > 0 && y.year <= 2100, id).toBe(true);
      for (const v of y.variants ?? []) expect(Object.keys(v.params).length, id).toBeGreaterThan(0);
    }
  });

  it("gives every vehicle OpenTTD can hold its year, and the OpenTTD table states none", () => {
    for (const [id, o] of Object.entries(OPENTTD_TABLE)) {
      expect(YEAR_OF.has(id), id).toBe(true);
      expect("introYear" in o, id).toBe(false);
      for (const v of o.variants ?? []) expect("introYear" in v, id).toBe(false);
    }
  });
});

describe("the maker and blurb tables", () => {
  it("name only designs that exist, each once", () => {
    const seen = new Set<string>();
    for (const [id, maker] of MAKER_ENTRIES) {
      expect(DESIGNS.has(id), id).toBe(true);
      expect(seen.has(id), `${id} is listed twice`).toBe(false);
      expect(maker).toMatch(/^[\x20-\x7e]+$/);
      seen.add(id);
    }
    for (const [id, text] of Object.entries(BLURBS)) {
      expect(DESIGNS.has(id), id).toBe(true);
      expect(text).toMatch(/^[\x20-\x7e]+$/);
      expect(text.length, id).toBeLessThan(400);
    }
  });
});

describe("the model text", () => {
  it("says what a model is in plain words", () => {
    expect(kindNoun(rec({}))).toBe("electric locomotive");
    expect(kindNoun(rec({ group: "unit", traction: "diesel" }))).toBe("diesel multiple unit");
    expect(kindNoun(rec({ group: "tram" }))).toBe("tram");
    expect(kindNoun(rec({ category: "Road vehicles", group: "bus", traction: undefined }))).toBe("bus");
    expect(kindNoun(rec({ category: "Aircraft", group: "aircraft", traction: undefined, airframe: "helicopter" }))).toBe("helicopter");
    expect(kindNoun(rec({ category: "Towers", group: "towers", traction: undefined }))).toBe("tower");
    // the title already says what it is
    expect(namedKind(rec({ title: "Tatra T3 tram", group: "tram" }))).toBe("Tatra T3 tram");
    expect(namedKind(rec({ title: "CD 163" }))).toBe("CD 163 electric locomotive");
  });

  it("lists the real-world facts the record states, and only those", () => {
    expect(modelFacts(rec({ category: "Towers", group: "towers", traction: undefined }))).toEqual([]);
    const facts = modelFacts(rec({ year: 1950, yearApprox: true, maker: "Skoda", country: "Czechia", game: { weight: 85, power: 3480, maxspeed: 120, accel: null } }));
    expect(facts).toEqual([
      { label: "In service from", value: "c. 1950" },
      { label: "Maker", value: "Skoda", path: "/maker/skoda/" },
      { label: "Country", value: "Czechia", path: "/country/czechia/" },
      { label: "Top speed", value: "120 km/h" },
      { label: "Power", value: "3,480 kW" },
      { label: "Weight", value: "85 t" },
      { label: "OpenTTD", value: "GRF download", path: "/openttd/" },
    ]);
  });

  it("writes a summary and a description a search engine shows in full", () => {
    const r = rec({ title: "CD 163", year: 1984, maker: "Skoda", country: "Czechia" });
    expect(modelSummary(r)).toBe(
      "The CD 163 is an electric locomotive from Czechia built by Skoda, in service from 1984. This procedural 3D model measures 10.0 x 3.0 x 4.0 m and has 1,000 triangles. It is free under CC0. View it in 3D and download it as GLB or as an OpenTTD GRF.",
    );
    const long = rec({ title: "Very Long Name Of A Locomotive Class 12345 / 67890", year: 1984, maker: "Chittaranjan Locomotive Works", country: "United Kingdom" });
    expect(modelMeta(long).description.length).toBeLessThanOrEqual(160);
    expect(modelMeta(long).title).not.toContain("|");
  });
});
