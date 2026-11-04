// The prerendered pages (generator/sitePages.ts, docs/site/seo-pages.md): one page
// per model and per category, built from the app shell and the catalog. Driven by a
// small fixture catalog and the repository's index.html as the shell, so no model is
// built here.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CatalogRecord } from "../generator/catalog.ts";
import { MIN_PREVIEW_PX, pngSize, sitePages } from "../generator/sitePages.ts";

const SHELL = readFileSync("index.html", "utf8");

function rec(id: string, title: string, extra: Partial<CatalogRecord> = {}): CatalogRecord {
  return {
    id, title, category: "Rail vehicles", group: "loco", traction: "electric", js: `${id}.js`, thumb: `${id}.png`,
    license: "CC0", author: "Rail Island", source: "Rail Island",
    thumbUrl: `thumbs/${id}.png`, jsUrl: `js/${id}.js`,
    jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1,
    triangles: 1234, vertices: 3000, primitives: 3, materials: 3, sizeX: 16.8, sizeY: 4.2, sizeZ: 3.1, references: [],
    ...extra,
  };
}

const RECORDS: CatalogRecord[] = [
  rec("proc-vehicle-cd-163", "CD 163", { params: [{ name: "livery", title: "Livery", default: "a", values: [{ value: "a", title: "Original" }, { value: "b", title: "Blue" }] }] }),
  rec("proc-vehicle-cd-150", "CD 150"),
  rec("proc-vehicle-t478", "T 478", { traction: "diesel" }),
  rec("proc-vehicle-coach", "Coach <B&\"1\">", { group: "coach", traction: undefined }),
  rec("proc-building-pagoda", "Pagoda", { category: "Panel houses", group: "residential" }),
  rec("proc-building-tower", "Tower", { category: "Commercial", group: "skyscraper_c" }),
  rec("proc-vehicle-a380", "Airbus A380", { category: "Aircraft", group: "aircraft", traction: undefined }),
];

const FILES = sitePages(SHELL, RECORDS, (r) => (r.id === "proc-vehicle-a380" ? { width: 512, height: 512 } : { width: 288, height: 120 }));

function page(path: string): string {
  const html = FILES.get(path);
  if (html === undefined) throw new Error(`no ${path}`);
  return html;
}

function attr(html: string, re: RegExp): string | undefined {
  return html.match(re)?.[1];
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/<a href="([^"]*)"/g)].map((m) => m[1]!);
}

describe("sitePages", () => {
  it("writes the home page, a page per category that splits and per model, 404, sitemap and robots", () => {
    expect([...FILES.keys()]).toEqual([
      "index.html",
      "category/train/index.html",
      "category/train/coach/index.html",
      "category/train/loco/index.html",
      "category/train/loco/diesel/index.html",
      "category/train/loco/electric/index.html",
      "category/aircraft/index.html",
      "category/building/index.html",
      "category/building/commercial/index.html",
      "category/building/panel-houses/index.html",
      "model/proc-building-pagoda/index.html",
      "model/proc-building-tower/index.html",
      "model/proc-vehicle-a380/index.html",
      "model/proc-vehicle-cd-150/index.html",
      "model/proc-vehicle-cd-163/index.html",
      "model/proc-vehicle-coach/index.html",
      "model/proc-vehicle-t478/index.html",
      "404.html",
      "sitemap.xml",
      "robots.txt",
    ]);
  });

  it("is deterministic: the same input gives the same bytes, whatever the record order", () => {
    const again = sitePages(SHELL, [...RECORDS].reverse(), (r) => (r.id === "proc-vehicle-a380" ? { width: 512, height: 512 } : { width: 288, height: 120 }));
    expect([...again]).toEqual([...FILES]);
  });

  it("gives every page its own canonical URL, og:url and title", () => {
    const titles = new Set<string>();
    for (const [path, html] of FILES) {
      if (!path.endsWith("index.html")) continue;
      const url = `https://factory.railisland.com/${path.replace(/index\.html$/, "")}`;
      expect(attr(html, /<link rel="canonical" href="([^"]*)"/)).toBe(url);
      expect(attr(html, /<meta property="og:url" content="([^"]*)"/)).toBe(url);
      const title = attr(html, /<title>([^<]*)<\/title>/)!;
      expect(titles.has(title)).toBe(false);
      titles.add(title);
    }
  });

  it("links every model from the home page and from its deepest category page", () => {
    const home = hrefs(page("index.html"));
    for (const r of RECORDS) expect(home).toContain(`/model/${r.id}/`);
    expect(hrefs(page("category/train/loco/electric/index.html"))).toEqual(expect.arrayContaining(["/model/proc-vehicle-cd-150/", "/model/proc-vehicle-cd-163/"]));
    expect(hrefs(page("category/train/loco/electric/index.html"))).not.toContain("/model/proc-vehicle-t478/");
    expect(hrefs(page("category/train/index.html"))).toEqual(expect.arrayContaining(["/category/train/coach/", "/category/train/loco/"]));
    expect(hrefs(page("category/train/loco/index.html"))).toEqual(expect.arrayContaining(["/category/train/loco/diesel/", "/category/train/loco/electric/"]));
  });

  it("files a model under its breadcrumb, with its facts, variants and siblings", () => {
    const html = page("model/proc-vehicle-cd-163/index.html");
    const links = hrefs(html);
    expect(links.slice(0, 5)).toEqual(["/", "/category/train/", "/category/train/loco/", "/category/train/loco/electric/", "/model/proc-vehicle-cd-163/"]);
    expect(links).toContain("/model/proc-vehicle-cd-150/");
    expect(html).toContain("<h1>CD 163</h1>");
    expect(html).toContain("Original, Blue");
    expect(html).toContain("1,234");
    expect(attr(html, /<meta name="description" content="([^"]*)"/)).toContain("Trains &gt; Locomotive &gt; Electric");
    // the content goes after the loading line, inside #root
    expect(html).toMatch(/<div id="root"><p class="factory-boot" id="factory-boot">[^<]*<\/p><div class="factory-static">/);
  });

  it("writes valid JSON-LD: a breadcrumb and a 3DModel", () => {
    const html = page("model/proc-vehicle-coach/index.html");
    const ld = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));
    expect(ld.map((x) => x["@type"])).toEqual(["BreadcrumbList", "3DModel"]);
    expect(ld[0].itemListElement.map((i: { item: string }) => i.item)).toEqual([
      "https://factory.railisland.com/",
      "https://factory.railisland.com/category/train/",
      "https://factory.railisland.com/category/train/coach/",
      "https://factory.railisland.com/model/proc-vehicle-coach/",
    ]);
    expect(ld[1].name).toBe('Coach <B&"1">');
    // no "<" can close the script element early
    expect(html).not.toContain('"name":"Coach <B');
  });

  it("escapes a title in the markup", () => {
    const html = page("model/proc-vehicle-coach/index.html");
    expect(html).toContain("<h1>Coach &lt;B&amp;&quot;1&quot;&gt;</h1>");
    expect(html).not.toContain("<B&");
  });

  it("names a model's thumbnail as its link preview only when it is big enough", () => {
    const big = page("model/proc-vehicle-a380/index.html");
    expect(attr(big, /<meta property="og:image" content="([^"]*)"/)).toBe("https://factory.railisland.com/thumbs/proc-vehicle-a380.png");
    expect(attr(big, /<meta property="og:image:width" content="([^"]*)"/)).toBe("512");
    const small = page("model/proc-vehicle-cd-150/index.html");
    expect(120).toBeLessThan(MIN_PREVIEW_PX);
    expect(attr(small, /<meta property="og:image" content="([^"]*)"/)).toBe("https://factory.railisland.com/social-preview.png");
  });

  it("keeps the 404 page out of the index, and lists every page in the sitemap", () => {
    expect(page("404.html")).toContain('<meta name="robots" content="noindex" />');
    expect(page("index.html")).not.toContain("noindex");
    const locs = [...page("sitemap.xml").matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
    const pages = [...FILES.keys()].filter((p) => p.endsWith("index.html")).map((p) => `https://factory.railisland.com/${p.replace(/index\.html$/, "")}`);
    expect(locs).toEqual(pages);
    expect(page("sitemap.xml")).not.toContain("lastmod");
    expect(page("robots.txt")).toContain("Sitemap: https://factory.railisland.com/sitemap.xml");
  });

  it("fails on two chip values that share a URL slug", () => {
    const clash = [...RECORDS, rec("proc-building-x", "X", { category: "panel-houses", group: "residential" })];
    expect(() => sitePages(SHELL, clash)).toThrow(/share the URL slug "panel-houses"/);
  });

  it("fails on a shell without the tags it fills", () => {
    expect(() => sitePages(SHELL.replace(/<link rel="canonical"[^>]*>/, ""), RECORDS)).toThrow(/canonical/);
    expect(() => sitePages(SHELL.replace('id="root"', 'id="app"'), RECORDS)).toThrow(/#root/);
  });

  it("reads a PNG's size from its header", () => {
    expect(pngSize(readFileSync("src/social-preview.png"))).toEqual({ width: 1200, height: 630 });
    expect(pngSize(new Uint8Array(10))).toBeNull();
  });
});
