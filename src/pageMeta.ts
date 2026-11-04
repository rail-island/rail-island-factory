// What each page of the site is called and how it describes itself: its title, its
// description, its heading and its canonical path, for the home page, a model page
// and a category page (docs/site/seo-pages.md). Pure, no DOM: the app sets the head
// from it as the view changes, and the build's prerendered pages
// (generator/sitePages.ts) write the very same text, so a crawler and a visitor read
// one description.

import { GROUPS, categoryPath, chipLabel, chipSlug, formatNumber, groupOf, level2Of, level3Of, modelPath, type CatalogRecord, type ChipPath } from "./catalogQuery";

export const SITE_URL = "https://factory.railisland.com";
export const SITE_NAME = "Rail Island Factory";
export const HOME_TITLE = "Rail Island Factory - buildings and vehicles for Rail Island";
export const HOME_DESCRIPTION =
  "Browse in 3D the buildings, trains, trams, buses, ships and aircraft of the game Rail Island, all generated from code - and make your own.";

export interface PageMeta {
  /** The site-relative canonical path, e.g. "/model/proc-vehicle-cd-163/". */
  path: string;
  /** The document title. */
  title: string;
  description: string;
  /** The page's own heading. */
  heading: string;
}

/** One step of a page's breadcrumb: its label and its path. */
export interface Crumb {
  label: string;
  path: string;
}

/** A first-row chip's label, by id. */
export function groupLabel(id: string): string {
  return GROUPS.find((g) => g.id === id)?.label ?? id;
}

/** A thing of each first-row chip, in the singular, for a model's description. */
const GROUP_NOUN: Readonly<Record<string, string>> = {
  train: "railway vehicle",
  moto: "road vehicle",
  tram: "tram",
  ship: "ship",
  aircraft: "aircraft",
  cablecar: "cable car",
  building: "building",
  tree: "tree",
  woods: "woods type",
  structure: "structure",
  way: "rail or road type",
  block: "city block",
  prop: "prop",
  character: "character",
  texture: "texture",
};

/**
 * Which chip levels split each group and level 2: a level is a page of its own only
 * where the chips offer a choice there (more than one value), as the site's chip rows
 * do (chipRows). Built once from the whole catalog.
 */
export interface CategoryTree {
  /** Group id -> its level-2 values (raw), sorted by label; empty when it has no second row. */
  l2: Map<string, string[]>;
  /** "<group>/<l2 slug>" -> its level-3 values (raw); empty when it has no third row. */
  l3: Map<string, string[]>;
}

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

export function categoryTree(records: readonly CatalogRecord[]): CategoryTree {
  const l2 = new Map<string, Set<string>>();
  const l3 = new Map<string, Set<string>>();
  for (const r of records) {
    const g = groupOf(r);
    const v2 = level2Of(r);
    if (!l2.has(g)) l2.set(g, new Set());
    l2.get(g)!.add(v2);
    const key = `${g}/${chipSlug(v2)}`;
    if (!l3.has(key)) l3.set(key, new Set());
    l3.get(key)!.add(level3Of(r));
  }
  const offered = (s: Set<string>) => (s.size > 1 ? [...s].sort((a, b) => collator.compare(chipLabel(a), chipLabel(b)) || (a < b ? -1 : a > b ? 1 : 0)) : []);
  return {
    l2: new Map([...l2].map(([k, s]) => [k, offered(s)])),
    l3: new Map([...l3].map(([k, s]) => [k, offered(s)])),
  };
}

/** The deepest category page a model is listed on: its group, then its l2 and l3 where those split. */
export function categoryOf(r: CatalogRecord, tree: CategoryTree): ChipPath {
  const group = groupOf(r);
  if ((tree.l2.get(group) ?? []).length === 0) return { group, l2: null, l3: null };
  const l2 = chipSlug(level2Of(r));
  if ((tree.l3.get(`${group}/${l2}`) ?? []).length === 0) return { group, l2, l3: null };
  return { group, l2, l3: chipSlug(level3Of(r)) };
}

/** The label of a chip slug at a level, looked up among the raw values it came from. */
function levelLabel(slug: string, values: readonly string[]): string {
  return chipLabel(values.find((v) => chipSlug(v) === slug) ?? slug);
}

/** The breadcrumb of a category page, from the home page down to the page itself. */
export function categoryCrumbs(c: ChipPath, tree: CategoryTree): Crumb[] {
  const crumbs: Crumb[] = [{ label: SITE_NAME, path: "/" }];
  if (!c.group) return crumbs;
  crumbs.push({ label: groupLabel(c.group), path: categoryPath({ group: c.group, l2: null, l3: null }) });
  if (c.l2) {
    crumbs.push({ label: levelLabel(c.l2, tree.l2.get(c.group) ?? []), path: categoryPath({ group: c.group, l2: c.l2, l3: null }) });
    if (c.l3) crumbs.push({ label: levelLabel(c.l3, tree.l3.get(`${c.group}/${c.l2}`) ?? []), path: categoryPath(c) });
  }
  return crumbs;
}

/** The category part of a breadcrumb as one phrase: "Trains > Locomotive > Electric". */
function trail(crumbs: readonly Crumb[]): string {
  return crumbs
    .slice(1)
    .map((c) => c.label)
    .join(" > ");
}

export function homeMeta(): PageMeta {
  return { path: "/", title: HOME_TITLE, description: HOME_DESCRIPTION, heading: SITE_NAME };
}

/** A model's size as "W x D x H m", one decimal. */
export function sizeText(r: CatalogRecord): string {
  const m = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  return `${m(r.sizeX)} x ${m(r.sizeZ)} x ${m(r.sizeY)} m`;
}

export function modelMeta(r: CatalogRecord, tree: CategoryTree): PageMeta {
  const crumbs = categoryCrumbs(categoryOf(r, tree), tree);
  const noun = GROUP_NOUN[groupOf(r)] ?? "model";
  const variants = r.params?.length ? ` Parametric: ${r.params.map((p) => p.title.toLowerCase()).join(", ")}.` : "";
  const by = r.author ? ` by ${r.author}` : "";
  const license = r.license ? `, ${r.license}` : "";
  const description =
    `${r.title}: a procedural 3D ${noun} model for the game Rail Island, in ${trail(crumbs)}. ` +
    `${sizeText(r)}, ${formatNumber(r.triangles)} triangles${by}${license}.${variants}`;
  return { path: modelPath(r.id), title: `${r.title} - ${trail(crumbs)} | ${SITE_NAME}`, description, heading: r.title };
}

export function categoryMeta(c: ChipPath, tree: CategoryTree, records: readonly CatalogRecord[]): PageMeta {
  const crumbs = categoryCrumbs(c, tree);
  const name = trail(crumbs);
  const n = records.length;
  const sample = records
    .slice(0, 5)
    .map((r) => r.title)
    .join(", ");
  const description = `${n} procedural 3D ${n === 1 ? "model" : "models"} in ${name} for the game Rail Island${sample ? `: ${sample}${n > 5 ? " and more" : ""}` : ""}. View them in 3D, compare and download.`;
  const title = `${crumbs
    .slice(1)
    .map((x) => x.label)
    .reverse()
    .join(" - ")} | ${SITE_NAME}`;
  return { path: categoryPath(c), title, description, heading: name };
}
