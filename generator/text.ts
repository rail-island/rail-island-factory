// The factory's exported text in the game's 14 languages (docs/models/text.md).
//
// Every string the game shows from the factory -- model titles, parameter titles
// and values, set type names and descriptions, woods and species names, building
// categories, traction names -- is listed here by a stable key with its English,
// which stays where it is authored (the design's `title`, a parameter's titles,
// the set registry, the woods types). The other 13 languages live in
// text/<code>.json as a PHRASEBOOK keyed by the English itself:
//
//   { "phrases":   { "<English>": "<translation>" },
//     "overrides": { "<key>": "<translation>" } }
//
// Keying by the English is what makes a reworded English visible: the new wording
// has no phrase yet, so the check reports it missing, and the old phrase, used by
// nothing, is reported stale. An override translates one key differently from its
// phrase (a value whose grammar depends on its parameter). text/verbatim.json lists
// English strings that are names and are copied unchanged into every language
// (a proper-noun title: "CD 043", "Karosa", "Eiffel Tower").
//
// `pnpm test` (test/text.test.ts) fails on a missing, stale or unused entry, and
// the game's import refuses an export with gaps; the model build itself never
// waits for translations, so the site deploys a new model before its text is done.
// The `translate-text` skill (.agents/skills/translate-text/) fills the gaps.
//
// Node-only: reads text/.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BUILDINGS, VILLAGE_DESIGNS, ALL_VEHICLES, CHARACTER_DESIGNS } from "./generate.ts";
import { BLOCK_PARAM_TEXT, SETS } from "./sets/registry.ts";
import { WOODS } from "./woods.ts";
import { SPECIES } from "./trees.ts";
import { writeIfChanged } from "./jsModel.ts";
import type { ProceduralDesign } from "./design.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Where the phrasebooks live. */
export const TEXT_DIR = path.join(REPO_ROOT, "text");
/** The export folder's text files: one per language, key -> text. */
export const TEXT_EXPORT_DIR = "text";

/**
 * The game's languages (its src/i18n/locales.ts LOCALES), English first here. The
 * game's import refuses an export whose list differs from its own.
 */
export const LOCALES = ["en", "cs", "de", "es", "fr", "it", "hu", "nl", "pl", "pt", "sk", "ko", "ja", "zh"] as const;
export type Locale = (typeof LOCALES)[number];
/** Every language but English: the ones with a phrasebook. */
export const TRANSLATED_LOCALES = LOCALES.filter((l) => l !== "en") as Exclude<Locale, "en">[];

/** Species display names: the woods board lists the species a type plants. */
export const SPECIES_LABELS: Readonly<Record<(typeof SPECIES)[number], string>> = {
  pine: "Pine",
  spruce: "Spruce",
  oak: "Oak",
  birch: "Birch",
  aspen: "Aspen",
  willow: "Willow",
  palm: "Palm",
  bush: "Bush",
  deadtree: "Dead tree",
  scotspine: "Mature Scots pine",
  larch: "European larch",
  autumnlarch: "Autumn larch",
  hazel: "Hazel",
  orchard: "Orchard tree",
};

/**
 * Woods variants that keep a name of their own: they were woods types before the
 * factory merged them into a parameter of another (Autumn Larch Woodland is the
 * larch woodland's peak autumn). Keyed by the variant key the game stores.
 */
export const NAMED_WOODS_VARIANTS: Readonly<Record<string, string>> = {
  "larch-woodland?season=peak&spruce=none": "Autumn Larch Woodland",
};

/** The building categories of the metas, by their lower-case name: the picker's tabs. */
export const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  commercial: "Commercial",
  decor: "Decorations",
  historical: "Historical",
  industry: "Industry",
  "panel houses": "Panel houses",
  skyscrapers: "Skyscrapers",
  station: "Station",
  towers: "Towers",
  village: "Village",
};

/** A vehicle's traction (meta `traction`): a grouping label in the vehicle picker. */
export const TRACTION_LABELS: Readonly<Record<string, string>> = {
  diesel: "Diesel",
  electric: "Electric",
  steam: "Steam",
};

/** The designs the game shows: every one a game meta lists (not the trees, woods groves or props). */
export function exportedDesigns(): readonly ProceduralDesign[] {
  return [...BUILDINGS, ...VILLAGE_DESIGNS, ...ALL_VEHICLES, ...CHARACTER_DESIGNS];
}

function paramText(out: Map<string, string>, prefix: string, params: readonly { name: string; title: string; values: readonly { value: string; title: string }[]; retired?: unknown }[] | undefined): void {
  for (const p of params ?? []) {
    out.set(`${prefix}.param.${p.name}`, p.title);
    for (const v of p.values) out.set(`${prefix}.param.${p.name}.${v.value}`, v.title);
  }
}

/** Every exported text key and its English, in a stable order. */
export function exportedText(): Map<string, string> {
  const out = new Map<string, string>();
  for (const d of exportedDesigns()) {
    out.set(`model.${d.id}`, d.title);
    paramText(out, `model.${d.id}`, d.params);
  }
  for (const s of SETS) {
    for (const t of s.types) {
      out.set(`set.${s.set}.${t.id}`, t.label);
      if (t.description) out.set(`set.${s.set}.${t.id}.desc`, t.description);
    }
    for (const g of s.groups ?? []) {
      out.set(`set.${s.set}.group.${g.id}`, g.label);
      if (g.description) out.set(`set.${s.set}.group.${g.id}.desc`, g.description);
    }
  }
  for (const [name, p] of Object.entries(BLOCK_PARAM_TEXT)) {
    out.set(`set.blockType.param.${name}`, p.label);
    for (const [value, label] of Object.entries(p.values)) out.set(`set.blockType.param.${name}.${value}`, label);
  }
  for (const { design: w } of WOODS) {
    out.set(`woods.${w.name}`, w.label);
    paramText(out, `woods.${w.name}`, w.params);
  }
  for (const [key, label] of Object.entries(NAMED_WOODS_VARIANTS)) out.set(`woods.variant.${key}`, label);
  for (const s of SPECIES) out.set(`species.${s}`, SPECIES_LABELS[s]);
  for (const [c, label] of Object.entries(CATEGORY_LABELS)) out.set(`category.${c}`, label);
  for (const [c, label] of Object.entries(TRACTION_LABELS)) out.set(`traction.${c}`, label);
  return out;
}

/** One language's phrasebook (text/<code>.json). */
export interface Phrasebook {
  phrases: Record<string, string>;
  overrides: Record<string, string>;
}

export function readPhrasebook(locale: Exclude<Locale, "en">, dir = TEXT_DIR): Phrasebook {
  const file = path.join(dir, `${locale}.json`);
  if (!fs.existsSync(file)) return { phrases: {}, overrides: {} };
  const json = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<Phrasebook>;
  return { phrases: json.phrases ?? {}, overrides: json.overrides ?? {} };
}

/** The English strings copied unchanged into every language (text/verbatim.json). */
export function readVerbatim(dir = TEXT_DIR): Set<string> {
  const file = path.join(dir, "verbatim.json");
  return new Set(fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as string[]) : []);
}

/** What a phrasebook lacks, and what it holds that nothing uses. */
export interface TextGaps {
  /** English strings with no phrase (and no override for every key using them). */
  missing: string[];
  /** Phrases whose English no exported key uses any more. */
  stale: string[];
  /** Overrides naming a key that is not exported. */
  unusedOverrides: string[];
}

/** Whether `en` is copied unchanged: listed in verbatim.json, or no word at all (a number, "1:87"). */
export function isVerbatim(en: string, verbatim: ReadonlySet<string>): boolean {
  return verbatim.has(en) || !/\p{L}/u.test(en);
}

export function textGaps(locale: Exclude<Locale, "en">, text = exportedText(), book = readPhrasebook(locale), verbatim = readVerbatim()): TextGaps {
  const needed = new Set<string>();
  for (const [key, en] of text) if (!(key in book.overrides) && !isVerbatim(en, verbatim)) needed.add(en);
  const used = new Set(text.values());
  return {
    missing: [...needed].filter((en) => !(en in book.phrases)).sort(),
    stale: Object.keys(book.phrases).filter((en) => !used.has(en) || isVerbatim(en, verbatim)).sort(),
    unusedOverrides: Object.keys(book.overrides).filter((k) => !text.has(k)).sort(),
  };
}

/** One language's exported text: key -> text, English where a translation is missing. */
export function localizedText(locale: Locale, text = exportedText()): Record<string, string> {
  const out: Record<string, string> = {};
  if (locale === "en") {
    for (const key of [...text.keys()].sort()) out[key] = text.get(key)!;
    return out;
  }
  const book = readPhrasebook(locale);
  const verbatim = readVerbatim();
  for (const key of [...text.keys()].sort()) {
    const en = text.get(key)!;
    out[key] = book.overrides[key] ?? (isVerbatim(en, verbatim) ? en : book.phrases[en] ?? en);
  }
  return out;
}

/** export/text/status.json: the language list and each language's open gaps, what the game's import checks. */
export interface TextStatus {
  locales: string[];
  /** Missing translations, stale phrases and unused overrides per language; all zero when complete. */
  gaps: Record<string, number>;
}

/** Writes export/text/<code>.json for every language, and status.json. */
export function generateText(dir: string): TextStatus {
  const text = exportedText();
  const outDir = path.join(dir, TEXT_EXPORT_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  for (const locale of LOCALES) {
    writeIfChanged(path.join(outDir, `${locale}.json`), `${JSON.stringify(localizedText(locale, text), null, 1)}\n`);
  }
  const gaps: Record<string, number> = {};
  for (const locale of TRANSLATED_LOCALES) {
    const g = textGaps(locale, text);
    gaps[locale] = g.missing.length + g.stale.length + g.unusedOverrides.length;
  }
  const status: TextStatus = { locales: [...LOCALES], gaps };
  writeIfChanged(path.join(outDir, "status.json"), `${JSON.stringify(status, null, 2)}\n`);
  return status;
}
