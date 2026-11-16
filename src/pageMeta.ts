// What each page of the site is called and how it describes itself: its title, its
// description, its heading and its canonical path, for the home page, a model page
// and a category page (docs/site/seo-pages.md). Pure, no DOM: the app sets the head
// from it as the view changes, and the build's prerendered pages
// (generator/sitePages.ts) write the very same text, so a crawler and a visitor read
// one description.

import { GROUPS, OPENTTD_PATH, categoryPath, chipLabel, chipMatches, chipSlug, countryPath, formatNumber, groupOf, isOpenttdVehicle, level2Of, level3Of, makerPath, modelPath, type CatalogRecord, type ChipPath } from "./catalogQuery";

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

/** A thing of each building category and structure group, in the singular. */
const KIND_NOUN: Readonly<Record<string, string>> = {
  Skyscrapers: "skyscraper", Commercial: "town house", "Panel houses": "panel house", Historical: "historic building", Decor: "decoration",
  Towers: "tower", Industry: "industrial building", Station: "station building", Village: "village house",
  bridge: "bridge", station: "railway station", roadStation: "road station", busStop: "bus stop", cableCarStation: "cable car station",
  port: "port", airport: "airport", dam: "dam", tunnelPortal: "tunnel portal", railType: "railway track", roadType: "road",
  decoration: "roadside decoration", animal: "draft animal",
};

/**
 * What a model is, in the singular and in plain words: "electric locomotive",
 * "diesel multiple unit", "tram", "jet aircraft", "skyscraper". For titles,
 * descriptions and the model page's summary.
 */
export function kindNoun(r: CatalogRecord): string {
  const g = groupOf(r);
  const animal = r.traction === "animal";
  const traction = r.traction === "electric" || r.traction === "diesel" || r.traction === "steam" ? r.traction : "";
  switch (g) {
    case "train":
      if (r.group === "loco") return `${traction} locomotive`.trim();
      if (r.group === "unit") return traction === "steam" ? "steam railcar" : `${traction} multiple unit`.trim();
      if (r.group === "coach") return animal ? "horse-drawn railway coach" : "passenger coach";
      if (r.group === "wagon") return animal ? "horse-drawn wagon" : "freight wagon";
      if (r.group === "metro") return "metro train";
      return "railway vehicle";
    case "tram":
      return animal ? "horse-drawn tram" : r.traction === "cable" ? "cable car" : "tram";
    case "moto":
      if (animal) return "horse-drawn coach";
      return r.group === "bus" ? "bus" : r.group === "truck" ? "truck" : "road vehicle";
    case "aircraft":
      return r.airframe === "helicopter" ? "helicopter" : r.airframe === "propeller" ? "propeller aircraft" : r.airframe === "jet" ? "jet aircraft" : "aircraft";
    case "building":
      return KIND_NOUN[r.category] ?? "building";
    case "structure":
    case "way":
      return KIND_NOUN[r.group] ?? GROUP_NOUN[g]!;
    case "block":
      return "city block";
    case "woods":
      return "woodland";
    case "cablecar":
      return "cable car cabin";
    case "texture":
      return "ground texture";
    default:
      return GROUP_NOUN[g] ?? "model";
  }
}

/** "a" or "an" before a word. */
function article(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

/** The model's name with what it is, unless the title already says so: "Tatra T3 tram", "CD 163 / 363 electric locomotive". */
export function namedKind(r: CatalogRecord): string {
  const noun = kindNoun(r);
  const last = noun.split(" ").at(-1)!.toLowerCase();
  return r.title.toLowerCase().includes(last) ? r.title : `${r.title} ${noun}`;
}

/** The year a model entered service as the page shows it: "1984", or "c. 1950" for an estimate. */
export function yearText(r: Pick<CatalogRecord, "year" | "yearApprox">): string | null {
  return r.year === undefined ? null : r.yearApprox ? `c. ${r.year}` : String(r.year);
}

/** One fact of a model page: a label, a value and, for a fact with a page of its own, the page's path. */
export interface ModelFact {
  label: string;
  value: string;
  path?: string;
}

/**
 * The real-world facts a model page lists (docs/site/seo-pages.md, "Facts"): the year
 * it entered service, its maker and country (linked to their pages), its running
 * figures from the game properties, and the OpenTTD page for a vehicle OpenTTD can
 * hold. Only the facts the model states; none for a model with none.
 */
export function modelFacts(r: CatalogRecord): ModelFact[] {
  const facts: ModelFact[] = [];
  const year = yearText(r);
  if (year) facts.push({ label: "In service from", value: year });
  if (r.maker) facts.push({ label: "Maker", value: r.maker, path: makerPath(r.maker) });
  if (r.country) facts.push({ label: "Country", value: r.country, path: countryPath(r.country) });
  const game = r.game ?? {};
  const num = (v: unknown): number | null => (typeof v === "number" && v > 0 ? v : null);
  const speed = num(game.maxspeed);
  const power = num(game.power);
  const weight = num(game.weight);
  if (speed) facts.push({ label: "Top speed", value: `${formatNumber(speed)} km/h` });
  if (power) facts.push({ label: "Power", value: `${formatNumber(power)} kW` });
  if (weight) facts.push({ label: "Weight", value: `${formatNumber(weight)} t` });
  if (isOpenttdVehicle(r) && !r.draft) facts.push({ label: "OpenTTD", value: "GRF download", path: OPENTTD_PATH });
  return facts;
}

/** How many variants a parametric model has, as a phrase: "13 liveries", "4 variants"; null for a fixed model. */
function variantPhrase(r: CatalogRecord): string | null {
  const ps = (r.params ?? []).filter((p) => !p.preview);
  if (!ps.length) return null;
  const p = ps.reduce((a, b) => (b.values.length > a.values.length ? b : a));
  const noun = p.name === "livery" ? "liveries" : p.title.toLowerCase().endsWith("s") ? p.title.toLowerCase() : `${p.title.toLowerCase()}s`;
  return p.values.length > 1 ? `${p.values.length} ${noun}` : null;
}

/** What the visitor can do with a model, as one sentence. */
function offer(r: CatalogRecord): string {
  return isOpenttdVehicle(r) ? "View it in 3D and download it as GLB or as an OpenTTD GRF." : "View it in 3D and download it as GLB.";
}

/**
 * The model page's summary, generated from its facts: what it is, where it is from,
 * who built it and when, then the model itself. Shown under the blurb (blurbTable.ts)
 * on the model page and in its prerendered text.
 */
export function modelSummary(r: CatalogRecord): string {
  const noun = kindNoun(r);
  const from = r.country ? ` from ${r.country}` : "";
  const by = r.maker ? ` built by ${r.maker}` : "";
  const year = r.year !== undefined ? `, in service from ${r.yearApprox ? "about " : ""}${r.year}` : "";
  const variants = variantPhrase(r);
  const license = r.license ? ` It is free under ${r.license}.` : "";
  return (
    `The ${r.title} is ${article(noun)} ${noun}${from}${by}${year}. ` +
    `This procedural 3D model measures ${sizeText(r)} and has ${formatNumber(r.triangles)} triangles${variants ? `, in ${variants}` : ""}.${license} ${offer(r)}`
  );
}

/** The longest meta description a search engine shows in full, about. */
const DESCRIPTION_MAX = 160;

/** A model page's head. `_tree` is kept for the callers' shape: the title names the kind, not the chip path. */
export function modelMeta(r: CatalogRecord, _tree?: CategoryTree): PageMeta {
  const noun = kindNoun(r);
  const free = r.license ? `Free ${r.license} 3D model` : "Free 3D model";
  const shortOffer = isOpenttdVehicle(r) ? "View in 3D, download as GLB or OpenTTD GRF." : "View in 3D, download as GLB.";
  // the fullest description that fits: drop the year, then the maker, then the country, then shorten the offer
  const leads = [
    { country: true, maker: true, year: true },
    { country: true, maker: true, year: false },
    { country: true, maker: false, year: false },
    { country: false, maker: false, year: false },
  ].map((k) => {
    const from = k.country && r.country ? ` from ${r.country}` : "";
    const by = k.maker && r.maker ? ` by ${r.maker}` : "";
    const year = k.year && r.year !== undefined ? ` (${r.yearApprox ? "c. " : ""}${r.year})` : "";
    return `${free} of the ${r.title}, ${article(noun)} ${noun}${from}${by}${year}.`;
  });
  const candidates = [...leads.map((l) => `${l} ${offer(r)}`), ...leads.map((l) => `${l} ${shortOffer}`), leads.at(-1)!];
  const fitting = candidates.find((c) => c.length <= DESCRIPTION_MAX);
  const description = fitting ?? `${leads.at(-1)!.slice(0, DESCRIPTION_MAX - 3).replace(/\s+\S*$/, "")}...`;
  const name = `${namedKind(r)} - free 3D model`;
  const title = name.length + SITE_NAME.length + 3 <= 70 ? `${name} | ${SITE_NAME}` : name;
  return { path: modelPath(r.id), title, description, heading: r.title };
}

/** Group labels of a list of models, most models first, as a phrase: "trains, trams and buses". */
function kindsPhrase(records: readonly CatalogRecord[], most = 3): string {
  const counts = new Map<string, number>();
  for (const r of records) counts.set(groupOf(r), (counts.get(groupOf(r)) ?? 0) + 1);
  const labels = [...counts].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, most).map(([g]) => groupLabel(g).toLowerCase());
  return labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}` : (labels[0] ?? "models");
}

/** The first few titles of a list, as a phrase. */
function sampleTitles(records: readonly CatalogRecord[], n = 4): string {
  return records
    .slice(0, n)
    .map((r) => r.title)
    .join(", ");
}

/** The country page (`/country/<slug>/`): every confirmed model from one country. */
export function countryMeta(country: string, records: readonly CatalogRecord[]): PageMeta {
  const n = records.length;
  const kinds = kindsPhrase(records);
  return {
    path: countryPath(country),
    title: `${country}: ${n} free 3D models of ${kinds} | ${SITE_NAME}`,
    description: `${n} free 3D ${n === 1 ? "model" : "models"} from ${country}: ${kinds}, such as ${sampleTitles(records)}. View them in 3D and download them as GLB or for OpenTTD.`,
    heading: `3D models from ${country}`,
  };
}

/** The maker page (`/maker/<slug>/`): every confirmed model of one maker. */
export function makerMeta(maker: string, records: readonly CatalogRecord[]): PageMeta {
  const n = records.length;
  const kinds = kindsPhrase(records);
  return {
    path: makerPath(maker),
    title: `${maker}: ${n} free 3D models of ${kinds} | ${SITE_NAME}`,
    description: `${n} free 3D ${n === 1 ? "model" : "models"} of ${kinds} built by ${maker}, such as ${sampleTitles(records)}. View them in 3D and download them as GLB or for OpenTTD.`,
    heading: `3D models by ${maker}`,
  };
}

/** The OpenTTD page (`/openttd/`): every vehicle OpenTTD can hold. */
export function openttdMeta(records: readonly CatalogRecord[]): PageMeta {
  const n = records.length;
  return {
    path: OPENTTD_PATH,
    title: `Free OpenTTD vehicles - download a GRF or build your own set | ${SITE_NAME}`,
    description: `${n} real-world trains, trams, buses, ships and aircraft for OpenTTD. Download any of them as a NewGRF in one click, or put your own vehicle set together - free.`,
    heading: "Vehicles for OpenTTD",
  };
}

/**
 * The OpenTTD page's introduction, paragraph by paragraph: what the site offers an
 * OpenTTD player and how to install what it downloads (docs/site/openttd-export.md).
 */
export const OPENTTD_INTRO: readonly string[] = [
  "Every vehicle here is a real-world type - a locomotive, a multiple unit, a coach or wagon, a tram, a bus, a truck, a ship or an aircraft - drawn from code for the game Rail Island and rendered into OpenTTD sprites in your browser.",
  "On a vehicle's page, \"Download for OpenTTD\" gives a NewGRF with its liveries and its fixed formations, and the OpenTTD view shows how it looks in the game. To build a set of your own, add vehicles to the export list and export it as one GRF, with a set name and a GRF id of your choice.",
  "The figures are the real vehicle's: the year it entered service, its capacity, top speed, power and weight. Put the downloaded .grf file in OpenTTD's newgrf folder and enable it in the NewGRF settings before you start a game.",
];

/** A list page's introduction: the meta description, or the OpenTTD page's own text. */
export function listIntro(meta: PageMeta): readonly string[] {
  return meta.path === OPENTTD_PATH ? OPENTTD_INTRO : [meta.description];
}

/** The license's page, for the structured data, by the catalog's license name. */
export const LICENSE_URLS: Readonly<Record<string, string>> = {
  CC0: "https://creativecommons.org/publicdomain/zero/1.0/",
  "CC-BY-3.0": "https://creativecommons.org/licenses/by/3.0/",
  "CC-BY-4.0": "https://creativecommons.org/licenses/by/4.0/",
  MIT: "https://opensource.org/licenses/MIT",
};

/** Whether a country name or slug is the one picked (for a country page's records). */
export function countryMatches(r: CatalogRecord, country: string): boolean {
  return r.country !== undefined && chipMatches(r.country, country);
}

export function categoryMeta(c: ChipPath, tree: CategoryTree, records: readonly CatalogRecord[]): PageMeta {
  const crumbs = categoryCrumbs(c, tree);
  const name = trail(crumbs);
  const n = records.length;
  const sample = records
    .slice(0, 5)
    .map((r) => r.title)
    .join(", ");
  const description = `${n} procedural 3D ${n === 1 ? "model" : "models"} in ${name} for the game Rail Island${sample ? `: ${sample}${n > 5 ? " and more" : ""}` : ""}. Free to use: view them in 3D, compare and download.`;
  const title = `${crumbs
    .slice(1)
    .map((x) => x.label)
    .reverse()
    .join(" - ")}: free 3D models | ${SITE_NAME}`;
  return { path: categoryPath(c), title, description, heading: name };
}
