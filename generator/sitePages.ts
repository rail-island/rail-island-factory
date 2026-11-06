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
import { GROUPS, chipSlug, formatNumber, groupOf, level2Of, level3Of, modelPath, shownId, type ChipPath } from "../src/catalogQuery.ts";
import {
  SITE_NAME,
  SITE_URL,
  categoryCrumbs,
  categoryMeta,
  categoryOf,
  categoryTree,
  groupLabel,
  homeMeta,
  modelMeta,
  sizeText,
  type CategoryTree,
  type Crumb,
  type PageMeta,
} from "../src/pageMeta.ts";

/** A thumbnail's pixel size, when known: a model page names it as its link-preview image if big enough. */
export type ThumbSize = (r: CatalogRecord) => { width: number; height: number } | null;

/** Link previews need an image at least this big on both sides (Facebook's minimum); smaller ones keep the site's. */
export const MIN_PREVIEW_PX = 200;

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

function modelBody(r: CatalogRecord, meta: PageMeta, crumbs: readonly Crumb[], siblings: readonly CatalogRecord[], thumb: { width: number; height: number } | null): string {
  const id = shownId(r);
  const facts = [
    id ? fact("Id", `<code>${escapeHtml(id)}</code>`) : "",
    fact("Category", crumbs.slice(1).map((c) => link(c.path, c.label)).join(" &rsaquo; ")),
    fact("Size (width x depth x height)", escapeHtml(sizeText(r))),
    fact("Triangles", escapeHtml(formatNumber(r.triangles))),
    fact("Vertices", escapeHtml(formatNumber(r.vertices))),
    fact("Materials", escapeHtml(formatNumber(r.materials))),
    r.author ? fact("Author", escapeHtml(r.author)) : "",
    r.license ? fact("License", escapeHtml(r.license)) : "",
    r.source ? fact("Source", isUrl(r.source) ? `<a href="${escapeHtml(r.source)}" rel="noopener">${escapeHtml(r.source)}</a>` : escapeHtml(r.source)) : "",
  ].join("");
  const params = r.params?.length
    ? `<h2>Variants</h2><dl>${r.params.map((p) => fact(p.title, escapeHtml(p.values.map((v) => v.title).join(", ")))).join("")}</dl>`
    : "";
  const size = thumb ? ` width="${thumb.width}" height="${thumb.height}"` : "";
  const last = crumbs[crumbs.length - 1]!;
  const more = siblings.length ? `<h2>More in ${link(last.path, last.label)}</h2>${modelList(siblings)}` : "";
  return (
    `<div class="factory-static">${crumbsHtml([...crumbs, { label: r.title, path: meta.path }])}` +
    `<h1>${escapeHtml(meta.heading)}</h1>` +
    `<img class="factory-static__thumb" src="/${escapeHtml(r.thumbUrl)}" alt="${escapeHtml(`${r.title} - 3D model`)}"${size} />` +
    `<p>${escapeHtml(meta.description)}</p><dl>${facts}</dl>${params}${more}</div>`
  );
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

function homeBody(meta: PageMeta, groups: readonly { path: string; label: string; records: CatalogRecord[] }[]): string {
  const nav = `<ul>${groups.map((g) => `<li>${link(g.path, g.label)} (${g.records.length})</li>`).join("")}</ul>`;
  const lists = groups.map((g) => `<h2>${link(g.path, g.label)}</h2>${modelList(g.records)}`).join("");
  return `<div class="factory-static"><h1>${escapeHtml(meta.heading)}</h1><p>${escapeHtml(meta.description)}</p>${nav}${lists}</div>`;
}

// ------------------------------------------------------------- the pages

/** Every file the build adds to dist/, from the app shell (dist/index.html as Vite wrote it) and the catalog. */
export function sitePages(shell: string, records: readonly CatalogRecord[], thumbSize: ThumbSize = () => null): SiteFiles {
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

  // the home page
  const home = homeMeta();
  const groups = categories
    .filter((c) => c.chips.l2 === null)
    .map((c) => ({ path: categoryCrumbs(c.chips, tree)[1]!.path, label: groupLabel(c.chips.group!), records: c.records }));
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/`, description: home.description };
  files.set("index.html", withBody(withHead(shell, { meta: home, ld: [website] }), homeBody(home, groups)));
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

  // the model pages
  const deepest = new Map<string, CatalogRecord[]>();
  for (const page of categories) deepest.set(categoryCrumbs(page.chips, tree).at(-1)!.path, page.records);
  for (const r of sorted) {
    if (!ID_SHAPE.test(r.id)) throw new Error(`site pages: the model id "${r.id}" is not a plain URL segment`);
    // a draft's breadcrumb stops at its group, the deepest catalog page sure to exist
    const own = r.draft ? fullTree : tree;
    const meta = modelMeta(r, own);
    const group = groupOf(r);
    const draftChips: ChipPath = published.some((o) => groupOf(o) === group) ? { group, l2: null, l3: null } : { group: null, l2: null, l3: null };
    const crumbs = categoryCrumbs(r.draft ? draftChips : categoryOf(r, tree), tree);
    const siblings = r.draft ? [] : (deepest.get(crumbs.at(-1)!.path) ?? []).filter((o) => o.id !== r.id);
    const size = thumbSize(r);
    const imageUrl = `${SITE_URL}/${r.thumbUrl}`;
    const image = size && size.width >= MIN_PREVIEW_PX && size.height >= MIN_PREVIEW_PX ? { url: imageUrl, ...size, alt: `${r.title} - 3D model` } : undefined;
    const model: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "3DModel",
      name: r.title,
      description: meta.description,
      url: `${SITE_URL}${meta.path}`,
      image: imageUrl,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE_URL}/` },
    };
    if (r.author) model.author = { "@type": "Person", name: r.author };
    if (r.license) model.license = r.license;
    files.set(`${meta.path.slice(1)}index.html`, withBody(withHead(shell, { meta, image, ld: [breadcrumbLd([...crumbs, { label: r.title, path: meta.path }]), model], noindex: r.draft }), modelBody(r, meta, crumbs, siblings, size)));
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

/** Write the prerendered pages into a built dist/ (the `site-pages` plugin in vite.config.ts). */
export function writeSitePages(dist: string): number {
  const shell = readFileSync(join(dist, "index.html"), "utf8");
  const catalog = JSON.parse(readFileSync(join(dist, "catalog.json"), "utf8")) as ModelCatalog;
  const thumbSize: ThumbSize = (r) => {
    try {
      return pngSize(readFileSync(join(dist, r.thumbUrl)));
    } catch {
      return null;
    }
  };
  const files = sitePages(shell, catalog.records, thumbSize);
  for (const [path, content] of files) {
    const out = join(dist, path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, content);
  }
  return files.size;
}
