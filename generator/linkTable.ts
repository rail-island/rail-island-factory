// The web pages a model is built from (docs/site/workshop.md, "Web links"): an
// article, a manufacturer's page, a drawing or a database entry, beside the source
// images its assets/<name>/ folder holds. Keyed by the exported model id (`proc-...`).
// The site shows them on the model page's Sources tab; they are not part of the
// game's meta.
//
// Kept apart from the designs on purpose, like countryTable.ts: a design module is
// bundled into each of its models' JS files, so a field stated there would rewrite
// every model of that module. No `node:` imports.

/** One web link of a model. */
export interface ModelLink {
  /** What the page is, as the site shows it: "Wikipedia: Siemens Vectron". */
  title: string;
  /** The page's absolute https URL. */
  url: string;
}

/** Each model's web links, in the order the site lists them. */
export const MODEL_LINKS: Readonly<Record<string, readonly ModelLink[]>> = {
  "proc-vehicle-vectron": [{ title: "Wikipedia: Siemens Vectron", url: "https://en.wikipedia.org/wiki/Siemens_Vectron" }],
};

/** A model's web links; empty when it has none. */
export function linksOf(id: string, table: Readonly<Record<string, readonly ModelLink[]>> = MODEL_LINKS): readonly ModelLink[] {
  return table[id] ?? [];
}

/**
 * What is wrong with the table, one line per problem: a link of a model that does
 * not exist, an empty title, a URL that is not https, or the same URL twice on one model.
 */
export function linkTableProblems(ids: Iterable<string>, table: Readonly<Record<string, readonly ModelLink[]>> = MODEL_LINKS): string[] {
  const known = new Set(ids);
  const out: string[] = [];
  for (const [id, links] of Object.entries(table)) {
    if (!known.has(id)) out.push(`${id}: no such model`);
    const seen = new Set<string>();
    for (const l of links) {
      if (!l.title.trim()) out.push(`${id}: a link without a title (${l.url})`);
      let ok = false;
      try {
        ok = new URL(l.url).protocol === "https:";
      } catch {
        ok = false;
      }
      if (!ok) out.push(`${id}: "${l.url}" is not an https URL`);
      if (seen.has(l.url)) out.push(`${id}: "${l.url}" is listed twice`);
      seen.add(l.url);
    }
  }
  return out;
}
