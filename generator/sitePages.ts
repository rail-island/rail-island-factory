// The site's prerendered pages (docs/site/seo-pages.md): after `vite build` has
// written dist/index.html (the app shell, with its hashed asset names) and copied
// the export into dist/, this writes one static page per model and per category,
// the home page's content, a 404 page, sitemap.xml and robots.txt.
//
// Every page is the shell with its own head - title, description, canonical URL,
// link-preview tags, JSON-LD - and the page's facts and links inside #root, after
// the loading line; the app replaces all of it when it mounts (src/main.tsx). The
// text comes from src/pageMeta.ts, which the app's head uses too.
//
// Node-only (the build's `site-pages` Vite plugin and the tests); `sitePages` is a
// pure function of the shell and the catalog, so its output is deterministic:
// sorted pages and links, no timestamps, no lastmod.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CatalogRecord, ModelCatalog } from "./catalog.ts";
import { GROUPS, OPENTTD_PATH, chipSlug, countryPath, formatNumber, groupOf, isOpenttdVehicle, level2Of, level3Of, makerPath, modelPath, shownId, type ChipPath } from "../src/catalogQuery.ts";
import {
  LICENSE_URLS,
  OPENTTD_INTRO,
  SITE_NAME,
  SITE_URL,
  categoryCrumbs,
  categoryMeta,
  categoryOf,
  categoryTree,
  countryMeta,
  groupLabel,
  homeMeta,
  kindNoun,
  makerMeta,
  modelFacts,
  modelMeta,
  modelSummary,
  openttdMeta,
  sizeText,
  type CategoryTree,
  type Crumb,
  type PageMeta,
} from "../src/pageMeta.ts";

/** A thumbnail's pixel size, when known: a model page names it as its link-preview image if big enough. */
export type ThumbSize = (r: CatalogRecord) => { width: number; height: number } | null;

/** Link previews need an image at least this big on both sides (Facebook's minimum); smaller ones keep the site's. */
export const MIN_PREVIEW_PX = 200;

/** A model's own link-preview image (ogImages.ts), when the build composed one: its site-relative URL, 1200 x 630. */
export type OgImage = (r: CatalogRecord) => string | null;

/** The size of a composed link-preview image, the large card's 1.91:1. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

/** A country or maker gets a page of its own from this many confirmed models: one model is the model's page already. */
export const MIN_LIST_PAGE = 2;

/** What the build writes: dist-relative file path -> content, in a fixed order. */
export type SiteFiles = Map<string, string>;

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

function byTitle(a: CatalogRecord, b: CatalogRecord): number {
  return collator.compare(a.title, b.title) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** JSON for a <script> element: no "</script>" or "<!--" can close it early. */
function jsonLd(value: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(value).replace(/</g, "\\u003c")}</script>`;
}

/** A model id as a path segment: the ids are plain, and anything else is a build error, not a strange URL. */
const ID_SHAPE = /^[a-z0-9][a-z0-9._-]*$/;

/** One category page: its chip path and the models listed on it (every model at or below it). */
interface CategoryPage {
  chips: ChipPath;
  records: CatalogRecord[];
}

/**
 * Every category page, home first-row order: each group, each l2 value of a group
 * whose second row offers a choice, each l3 value likewise. Fails on two values of
 * one level whose slugs collide, which would make two chips one URL.
 */
export function categoryPages(records: readonly CatalogRecord[], tree: CategoryTree): CategoryPage[] {
  const pages: CategoryPage[] = [];
  const sorted = [...records].sort(byTitle);
  const checkSlugs = (values: readonly string[], where: string) => {
    const seen = new Map<string, string>();
    for (const v of values) {
      const slug = chipSlug(v);
      if (!slug) throw new Error(`site pages: the chip value "${v}" in ${where} has an empty URL slug`);
      const other = seen.get(slug);
      if (other !== undefined) throw new Error(`site pages: the chip values "${other}" and "${v}" in ${where} share the URL slug "${slug}"`);
      seen.set(slug, v);
    }
  };
  for (const g of GROUPS) {
    const inGroup = sorted.filter((r) => groupOf(r) === g.id);
    if (inGroup.length === 0) continue;
    pages.push({ chips: { group: g.id, l2: null, l3: null }, records: inGroup });
    const l2s = tree.l2.get(g.id) ?? [];
    checkSlugs(l2s, g.id);
    for (const v2 of l2s) {
      const l2 = chipSlug(v2);
      const inL2 = inGroup.filter((r) => chipSlug(level2Of(r)) === l2);
      pages.push({ chips: { group: g.id, l2, l3: null }, records: inL2 });
      const l3s = tree.l3.get(`${g.id}/${l2}`) ?? [];
      checkSlugs(l3s, `${g.id}/${l2}`);
      for (const v3 of l3s) {
        const l3 = chipSlug(v3);
        pages.push({ chips: { group: g.id, l2, l3 }, records: inL2.filter((r) => chipSlug(level3Of(r)) === l3) });
      }
    }
  }
  return pages;
}

// ------------------------------------------------------------- the head

/** Replace one tag's attribute value in the shell; the shell must carry the tag, or the build fails. */
function setAttr(html: string, tag: RegExp, value: string, what: string): string {
  if (!tag.test(html)) throw new Error(`site pages: the app shell (dist/index.html) has no ${what}`);
  return html.replace(tag, (_m, pre: string, post: string) => `${pre}${escapeHtml(value)}${post}`);
}

function metaTag(attr: "name" | "property", key: string): RegExp {
  return new RegExp(`(<meta ${attr}="${key.replace(/[.:]/g, "\\$&")}" content=")[^"]*(")`);
}

interface Head {
  meta: PageMeta;
  /** The link-preview image, when the page has its own. */
  image?: { url: string; width: number; height: number; alt: string };
  ld: unknown[];
  noindex?: boolean;
}

function withHead(shell: string, head: Head): string {
  const m = head.meta;
  const url = `${SITE_URL}${m.path}`;
  let html = shell;
  if (!/<title>[^<]*<\/title>/.test(html)) throw new Error("site pages: the app shell (dist/index.html) has no <title>");
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(m.title)}</title>`);
  html = setAttr(html, metaTag("name", "description"), m.description, "description");
  html = setAttr(html, /(<link rel="canonical" href=")[^"]*(")/, url, "canonical link");
  html = setAttr(html, metaTag("property", "og:url"), url, "og:url");
  html = setAttr(html, metaTag("property", "og:title"), m.heading, "og:title");
  html = setAttr(html, metaTag("property", "og:description"), m.description, "og:description");
  html = setAttr(html, metaTag("name", "twitter:title"), m.heading, "twitter:title");
  html = setAttr(html, metaTag("name", "twitter:description"), m.description, "twitter:description");
  if (head.image) {
    const i = head.image;
    html = setAttr(html, metaTag("property", "og:image"), i.url, "og:image");
    html = setAttr(html, metaTag("property", "og:image:width"), String(i.width), "og:image:width");
    html = setAttr(html, metaTag("property", "og:image:height"), String(i.height), "og:image:height");
    html = setAttr(html, metaTag("property", "og:image:alt"), i.alt, "og:image:alt");
    html = setAttr(html, metaTag("name", "twitter:image"), i.url, "twitter:image");
  }
  const extra = [head.noindex ? `<meta name="robots" content="noindex" />` : "", ...head.ld.map(jsonLd)].filter(Boolean).join("\n    ");
  if (extra) html = html.replace("</head>", `  ${extra}\n  </head>`);
  return html;
}

/** Put a page's content into #root after the loading line (index.html; src/boot.ts needs the line). */
function withBody(html: string, content: string): string {
  const root = /(<div id="root">[\s\S]*?<\/p>)(<\/div>)/;
  if (!root.test(html)) throw new Error("site pages: the app shell (dist/index.html) has no #root with its loading line");
  return html.replace(root, (_m, open: string, close: string) => `${open}${content}${close}`);
}

// ------------------------------------------------------------- the body

function link(path: string, label: string): string {
  return `<a href="${escapeHtml(path)}">${escapeHtml(label)}</a>`;
}

function crumbsHtml(crumbs: readonly Crumb[]): string {
  return `<nav class="factory-static__crumbs" aria-label="Breadcrumb"><ol>${crumbs.map((c) => `<li>${link(c.path, c.label)}</li>`).join("")}</ol></nav>`;
}

function breadcrumbLd(crumbs: readonly Crumb[]): unknown {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${SITE_URL}${c.path}` })),
  };
}

function modelList(records: readonly CatalogRecord[]): string {
  return `<ul class="factory-static__list">${records.map((r) => `<li>${link(modelPath(r.id), r.title)}</li>`).join("")}</ul>`;
}

function fact(label: string, value: string): string {
  return `<dt>${escapeHtml(label)}</dt><dd>${value}</dd>`;
}

function isUrl(s: string): boolean {
  return /^https?:\/\//.test(s);
}

function modelBody(
  r: CatalogRecord,
  meta: PageMeta,
  crumbs: readonly Crumb[],
  siblings: readonly CatalogRecord[],
  byMaker: readonly CatalogRecord[],
  thumb: { width: number; height: number } | null,
  listed: (path: string) => boolean,
): string {
  const id = shownId(r);
  // the real-world facts first, linked where their page exists, then the model's own figures
  const real = modelFacts(r)
    .map((f) => fact(f.label, f.path && listed(f.path) ? link(f.path, f.value) : escapeHtml(f.value)))
    .join("");
  const facts = [
    real,
    id ? fact("Id", `<code>${escapeHtml(id)}</code>`) : "",
    fact("Category", crumbs.slice(1).map((c) => link(c.path, c.label)).join(" &rsaquo; ")),
    fact("Size (width x depth x height)", escapeHtml(sizeText(r))),
    fact("Triangles", escapeHtml(formatNumber(r.triangles))),
    fact("Vertices", escapeHtml(formatNumber(r.vertices))),
    fact("Materials", escapeHtml(formatNumber(r.materials))),
    r.author ? fact("Author", escapeHtml(r.author)) : "",
    r.license ? fact("License", LICENSE_URLS[r.license] ? `<a href="${escapeHtml(LICENSE_URLS[r.license]!)}" rel="license noopener">${escapeHtml(r.license)}</a>` : escapeHtml(r.license)) : "",
    r.source ? fact("Source", isUrl(r.source) ? `<a href="${escapeHtml(r.source)}" rel="noopener">${escapeHtml(r.source)}</a>` : escapeHtml(r.source)) : "",
  ].join("");
  const params = r.params?.length
    ? `<h2>Variants</h2><dl>${r.params.map((p) => fact(p.title, escapeHtml(p.values.map((v) => v.title).join(", ")))).join("")}</dl>`
    : "";
  const links = r.links?.length ? `<h2>Sources</h2><ul>${r.links.map((l) => `<li><a href="${escapeHtml(l.url)}" rel="noopener">${escapeHtml(l.title)}</a></li>`).join("")}</ul>` : "";
  const size = thumb ? ` width="${thumb.width}" height="${thumb.height}"` : "";
  const last = crumbs[crumbs.length - 1]!;
  const more = siblings.length ? `<h2>More in ${link(last.path, last.label)}</h2>${modelList(siblings)}` : "";
  const maker = r.maker && byMaker.length && listed(makerPath(r.maker)) ? `<h2>More by ${link(makerPath(r.maker), r.maker)}</h2>${modelList(byMaker)}` : "";
  const openttd = isOpenttdVehicle(r) && !r.draft ? `<p>Play it in OpenTTD: ${link(OPENTTD_PATH, "free OpenTTD vehicles")}.</p>` : "";
  return (
    `<div class="factory-static">${crumbsHtml([...crumbs, { label: r.title, path: meta.path }])}` +
    `<h1>${escapeHtml(meta.heading)}</h1>` +
    // a draft has no thumbnail file: the app renders it in the browser
    (r.draft ? "" : `<img class="factory-static__thumb" src="/${escapeHtml(r.thumbUrl)}" alt="${escapeHtml(`${r.title} - 3D model of ${kindNoun(r)}`)}"${size} />`) +
    (r.blurb ? `<p>${escapeHtml(r.blurb)}</p>` : "") +
    `<p>${escapeHtml(modelSummary(r))}</p>${openttd}<dl>${facts}</dl>${params}${links}${maker}${more}</div>`
  );
}

/** A list page of its own (a country, a maker, the OpenTTD page): heading, introduction, then its models by group. */
function listBody(meta: PageMeta, crumbs: readonly Crumb[], intro: readonly string[], records: readonly CatalogRecord[], extra = ""): string {
  const groups = GROUPS.map((g) => ({ g, rs: records.filter((r) => groupOf(r) === g.id) })).filter((x) => x.rs.length);
  const lists = groups.map(({ g, rs }) => `<h2>${escapeHtml(g.label)} (${rs.length})</h2>${modelList(rs)}`).join("");
  return `<div class="factory-static">${crumbsHtml(crumbs)}<h1>${escapeHtml(meta.heading)}</h1>${intro.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}${extra}${lists}</div>`;
}

function categoryBody(page: CategoryPage, meta: PageMeta, crumbs: readonly Crumb[], children: readonly { path: string; label: string; count: number }[]): string {
  const subs = children.length
    ? `<h2>Categories</h2><ul>${children.map((c) => `<li>${link(c.path, c.label)} (${c.count})</li>`).join("")}</ul>`
    : "";
  return (
    `<div class="factory-static">${crumbsHtml(crumbs)}<h1>${escapeHtml(meta.heading)}</h1><p>${escapeHtml(meta.description)}</p>` +
    `${subs}<h2>Models</h2>${modelList(page.records)}</div>`
  );
}

type Named = { path: string; label: string; count: number };

function namedList(items: readonly Named[]): string {
  return `<ul>${items.map((c) => `<li>${link(c.path, c.label)} (${c.count})</li>`).join("")}</ul>`;
}

function homeBody(meta: PageMeta, groups: readonly { path: string; label: string; records: CatalogRecord[] }[], countries: readonly Named[], makers: readonly Named[], openttd: number): string {
  const nav = `<ul>${groups.map((g) => `<li>${link(g.path, g.label)} (${g.records.length})</li>`).join("")}</ul>`;
  const ottd = openttd ? `<p>${link(OPENTTD_PATH, `${openttd} vehicles for OpenTTD`)}: download a NewGRF in one click or build your own set.</p>` : "";
  const by = (countries.length ? `<h2>By country</h2>${namedList(countries)}` : "") + (makers.length ? `<h2>By maker</h2>${namedList(makers)}` : "");
  const lists = groups.map((g) => `<h2>${link(g.path, g.label)}</h2>${modelList(g.records)}`).join("");
  return `<div class="factory-static"><h1>${escapeHtml(meta.heading)}</h1><p>${escapeHtml(meta.description)}</p>${ottd}${nav}${by}${lists}</div>`;
}

// ------------------------------------------------------------- the pages

/** Records grouped by a name (a country, a maker), the names sorted, each list by title; only names with `min` records or more. */
function byName(records: readonly CatalogRecord[], nameOf: (r: CatalogRecord) => string | undefined, min: number): Array<[string, CatalogRecord[]]> {
  const map = new Map<string, CatalogRecord[]>();
  for (const r of records) {
    const n = nameOf(r);
    if (n === undefined) continue;
    if (!map.has(n)) map.set(n, []);
    map.get(n)!.push(r);
  }
  return [...map]
    .filter(([, rs]) => rs.length >= min)
    .sort((a, b) => collator.compare(a[0], b[0]) || (a[0] < b[0] ? -1 : 1))
    .map(([n, rs]) => [n, [...rs].sort(byTitle)]);
}

/** The structured data of a model page: a schema.org 3DModel. */
function modelLd(r: CatalogRecord, meta: PageMeta, image: string | null): Record<string, unknown> {
  const model: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "3DModel",
    name: r.title,
    description: meta.description,
    url: `${SITE_URL}${meta.path}`,
    ...(image ? { image } : {}),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` },
    isAccessibleForFree: true,
    keywords: [kindNoun(r), r.maker, r.country, isOpenttdVehicle(r) ? "OpenTTD" : undefined, "3D model", r.license].filter(Boolean).join(", "),
  };
  // the factory's own models name it as an organisation; a contributor stays a person
  if (r.author) model.author = r.author.startsWith("Rail Island") ? { "@type": "Organization", name: "Rail Island", url: "https://www.railisland.com" } : { "@type": "Person", name: r.author };
  if (r.license) model.license = LICENSE_URLS[r.license] ?? r.license;
  if (r.country) model.countryOfOrigin = { "@type": "Country", name: r.country };
  // what the model shows: the real type, with its encyclopedia pages
  const sameAs = (r.links ?? []).map((l) => l.url).filter((u) => /wikipedia\.org\//.test(u));
  model.about = {
    "@type": "Thing",
    name: r.title,
    ...(r.blurb ? { description: r.blurb } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
  if (r.year !== undefined) (model.about as Record<string, unknown>).temporalCoverage = String(r.year);
  if (r.maker) (model.about as Record<string, unknown>).manufacturer = { "@type": "Organization", name: r.maker };
  return model;
}

/** Every file the build adds to dist/, from the app shell (dist/index.html as Vite wrote it) and the catalog. */
export function sitePages(shell: string, records: readonly CatalogRecord[], thumbSize: ThumbSize = () => null, ogImage: OgImage = () => null): SiteFiles {
  const files: SiteFiles = new Map();
  // the home and category pages list the catalog only; a workshop draft has its own
  // page, kept out of the index and the sitemap (docs/site/workshop.md)
  const published = records.filter((r) => !r.draft);
  const tree = categoryTree(published);
  const fullTree = categoryTree(records);
  const categories = categoryPages(published, tree);
  const sorted = [...records].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (let i = 1; i < sorted.length; i++) if (sorted[i]!.id === sorted[i - 1]!.id) throw new Error(`site pages: two records share the id ${sorted[i]!.id}`);
  const urls: string[] = [];
  // the country and maker pages: a name with two models or more; a slug collision is a build error
  const countries = byName(published, (r) => r.country, MIN_LIST_PAGE);
  const makers = byName(published, (r) => r.maker, MIN_LIST_PAGE);
  for (const [what, list] of [["country", countries], ["maker", makers]] as const) {
    const seen = new Map<string, string>();
    for (const [name] of list) {
      const slug = chipSlug(name);
      if (!slug) throw new Error(`site pages: the ${what} "${name}" has an empty URL slug`);
      if (seen.has(slug)) throw new Error(`site pages: the ${what}s "${seen.get(slug)}" and "${name}" share the URL slug "${slug}"`);
      seen.set(slug, name);
    }
  }
  const openttd = published.filter(isOpenttdVehicle).sort(byTitle);
  const listed = new Set<string>([...countries.map(([n]) => countryPath(n)), ...makers.map(([n]) => makerPath(n)), ...(openttd.length ? [OPENTTD_PATH] : [])]);
  const isListed = (path: string) => listed.has(path);
  const named = (list: Array<[string, CatalogRecord[]]>, pathOf: (n: string) => string) => list.map(([n, rs]) => ({ path: pathOf(n), label: n, count: rs.length }));

  // the home page
  const home = homeMeta();
  const groups = categories
    .filter((c) => c.chips.l2 === null)
    .map((c) => ({ path: categoryCrumbs(c.chips, tree)[1]!.path, label: groupLabel(c.chips.group!), records: c.records }));
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/`, description: home.description };
  files.set("index.html", withBody(withHead(shell, { meta: home, ld: [website] }), homeBody(home, groups, named(countries, countryPath), named(makers, makerPath), openttd.length)));
  urls.push("/");

  // the category pages
  for (const page of categories) {
    const meta = categoryMeta(page.chips, tree, page.records);
    const crumbs = categoryCrumbs(page.chips, tree);
    const c = page.chips;
    const children = categories
      .filter((o) => o.chips.group === c.group && (c.l2 === null ? o.chips.l2 !== null && o.chips.l3 === null : o.chips.l2 === c.l2 && c.l3 === null && o.chips.l3 !== null))
      .map((o) => {
        const oc = categoryCrumbs(o.chips, tree);
        return { path: oc[oc.length - 1]!.path, label: oc[oc.length - 1]!.label, count: o.records.length };
      });
    const ld = [
      breadcrumbLd(crumbs),
      { "@context": "https://schema.org", "@type": "CollectionPage", name: meta.heading, url: `${SITE_URL}${meta.path}`, description: meta.description },
    ];
    files.set(`${meta.path.slice(1)}index.html`, withBody(withHead(shell, { meta, ld }), categoryBody(page, meta, crumbs, children)));
    urls.push(meta.path);
  }

  // the country, maker and OpenTTD pages
  const listPage = (meta: PageMeta, intro: readonly string[], rs: readonly CatalogRecord[], extra = "") => {
    const crumbs: Crumb[] = [{ label: SITE_NAME, path: "/" }, { label: meta.heading, path: meta.path }];
    const ld = [
      breadcrumbLd(crumbs),
      { "@context": "https://schema.org", "@type": "CollectionPage", name: meta.heading, url: `${SITE_URL}${meta.path}`, description: meta.description },
    ];
    files.set(`${meta.path.slice(1)}index.html`, withBody(withHead(shell, { meta, ld }), listBody(meta, crumbs, intro, rs, extra)));
    urls.push(meta.path);
  };
  for (const [name, rs] of countries) {
    const meta = countryMeta(name, rs);
    const makersHere = byName(rs, (r) => r.maker, 1).filter(([m]) => isListed(makerPath(m)));
    listPage(meta, [meta.description], rs, makersHere.length ? `<h2>Makers</h2>${namedList(named(makersHere, makerPath))}` : "");
  }
  for (const [name, rs] of makers) {
    const meta = makerMeta(name, rs);
    const countriesHere = byName(rs, (r) => r.country, 1).filter(([c]) => isListed(countryPath(c)));
    listPage(meta, [meta.description], rs, countriesHere.length ? `<h2>Countries</h2>${namedList(named(countriesHere, countryPath))}` : "");
  }
  if (openttd.length) {
    const ottdCountries = byName(openttd, (r) => r.country, 1).filter(([c]) => isListed(countryPath(c)));
    listPage(openttdMeta(openttd), OPENTTD_INTRO, openttd, ottdCountries.length ? `<h2>By country</h2>${namedList(named(ottdCountries, countryPath))}` : "");
  }

  // the model pages
  const deepest = new Map<string, CatalogRecord[]>();
  for (const page of categories) deepest.set(categoryCrumbs(page.chips, tree).at(-1)!.path, page.records);
  const makerRecords = new Map(makers);
  for (const r of sorted) {
    if (!ID_SHAPE.test(r.id)) throw new Error(`site pages: the model id "${r.id}" is not a plain URL segment`);
    // a draft's breadcrumb stops at its group, the deepest catalog page sure to exist
    const own = r.draft ? fullTree : tree;
    const meta = modelMeta(r, own);
    const group = groupOf(r);
    const draftChips: ChipPath = published.some((o) => groupOf(o) === group) ? { group, l2: null, l3: null } : { group: null, l2: null, l3: null };
    const crumbs = categoryCrumbs(r.draft ? draftChips : categoryOf(r, tree), tree);
    const siblings = r.draft ? [] : (deepest.get(crumbs.at(-1)!.path) ?? []).filter((o) => o.id !== r.id);
    const byMaker = r.draft || !r.maker ? [] : (makerRecords.get(r.maker) ?? []).filter((o) => o.id !== r.id);
    const size = r.draft ? null : thumbSize(r);
    const thumbUrl = `${SITE_URL}/${r.thumbUrl}`;
    // the link preview: the composed 1200 x 630 card, else the thumbnail when big enough, else the site's
    const og = r.draft ? null : ogImage(r);
    const alt = `${r.title} - 3D model of ${kindNoun(r)}`;
    const image = og
      ? { url: `${SITE_URL}/${og}`, ...OG_SIZE, alt }
      : size && size.width >= MIN_PREVIEW_PX && size.height >= MIN_PREVIEW_PX
        ? { url: thumbUrl, ...size, alt }
        : undefined;
    const ld = [breadcrumbLd([...crumbs, { label: r.title, path: meta.path }]), modelLd(r, meta, r.draft ? null : thumbUrl)];
    files.set(`${meta.path.slice(1)}index.html`, withBody(withHead(shell, { meta, image, ld, noindex: r.draft }), modelBody(r, meta, crumbs, siblings, byMaker, size, isListed)));
    if (!r.draft) urls.push(meta.path);
  }

  // what any other path answers: the app, which shows "No model ..." or the list, kept out of the index
  const notFound: PageMeta = { path: "/", title: `Page not found | ${SITE_NAME}`, description: home.description, heading: SITE_NAME };
  files.set("404.html", withHead(shell, { meta: notFound, ld: [], noindex: true }));

  files.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${escapeHtml(`${SITE_URL}${u}`)}</loc></url>\n`).join("")}</urlset>\n`);
  files.set("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  return files;
}

/** A PNG's pixel size from its header, or null for anything else. */
export function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/**
 * Write the prerendered pages into a built dist/ (the `site-pages` plugin in
 * vite.config.ts): first the model pages' link-preview cards (ogImages.ts), then
 * the pages that name them.
 */
export async function writeSitePages(dist: string): Promise<number> {
  const shell = readFileSync(join(dist, "index.html"), "utf8");
  const catalog = JSON.parse(readFileSync(join(dist, "catalog.json"), "utf8")) as ModelCatalog;
  const thumbSize: ThumbSize = (r) => {
    try {
      return pngSize(readFileSync(join(dist, r.thumbUrl)));
    } catch {
      return null;
    }
  };
  const { writeOgImages, ogPath } = await import("./ogImages.ts");
  const cards = await writeOgImages(dist, catalog.records);
  const files = sitePages(shell, catalog.records, thumbSize, (r) => (cards.has(r.id) ? ogPath(r.id) : null));
  for (const [path, content] of files) {
    const out = join(dist, path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, content);
  }
  return files.size + cards.size;
}
