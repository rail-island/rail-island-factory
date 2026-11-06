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
  "proc-vehicle-american-440": [
    { title: "Wikipedia: Jupiter (locomotive)", url: "https://en.wikipedia.org/wiki/Jupiter_(locomotive)" },
    { title: "Wikipedia: Union Pacific No. 119", url: "https://en.wikipedia.org/wiki/Union_Pacific_No._119" },
  ],
  "proc-vehicle-amtrak-acela": [
    { title: "Wikipedia: Acela Express (trainset)", url: "https://en.wikipedia.org/wiki/Acela_Express_(trainset)" },
  ],
  "proc-vehicle-amtrak-superliner": [
    { title: "Wikipedia: Superliner (railcar)", url: "https://en.wikipedia.org/wiki/Superliner_(railcar)" },
  ],
  "proc-vehicle-blue-train-24": [
    { title: "Wikipedia: Blue Train (Japan)", url: "https://en.wikipedia.org/wiki/Blue_Train_(Japan)" },
  ],
  "proc-vehicle-budd-rdc": [
    { title: "Wikipedia: Budd Rail Diesel Car", url: "https://en.wikipedia.org/wiki/Budd_Rail_Diesel_Car" },
  ],
  "proc-vehicle-cta-5000": [
    { title: "Wikipedia: 5000-series (CTA)", url: "https://en.wikipedia.org/wiki/5000-series_(CTA)" },
  ],
  "proc-vehicle-emd-f7": [
    { title: "Wikipedia: EMD F7", url: "https://en.wikipedia.org/wiki/EMD_F7" },
    { title: "The Diesel Shop: EMD F7 data", url: "https://www.thedieselshop.us/Data%20EMD%20F7.HTML" },
  ],
  "proc-vehicle-emd-gp9": [
    { title: "Wikipedia: EMD GP9", url: "https://en.wikipedia.org/wiki/EMD_GP9" },
    { title: "The Diesel Shop: EMD GP9 data", url: "https://www.thedieselshop.us/Data%20EMD%20GP9.HTML" },
  ],
  "proc-vehicle-emd-sd40-2": [
    { title: "Wikipedia: EMD SD40-2", url: "https://en.wikipedia.org/wiki/EMD_SD40-2" },
    { title: "The Diesel Shop: EMD SD40-2 data", url: "https://www.thedieselshop.us/Data%20EMD%20SD40-2.HTML" },
  ],
  "proc-vehicle-emd-sd70ace": [
    { title: "Wikipedia: EMD SD70 series", url: "https://en.wikipedia.org/wiki/EMD_SD70_series" },
    { title: "The Diesel Shop: EMD SD70ACe data", url: "https://www.thedieselshop.us/Data%20EMD%20SD70ACe.HTML" },
  ],
  "proc-vehicle-ge-es44ac": [
    { title: "Wikipedia: GE Evolution Series", url: "https://en.wikipedia.org/wiki/GE_Evolution_Series" },
    { title: "American-Rails: GE ES44AC", url: "https://american-rails.com/es44ac.html" },
  ],
  "proc-vehicle-ge-p42dc": [
    { title: "Wikipedia: GE Genesis", url: "https://en.wikipedia.org/wiki/GE_Genesis" },
    { title: "The Diesel Shop: GE P40DC/P42DC data", url: "https://www.thedieselshop.us/Data%20P40_42DC.HTML" },
  ],
  "proc-vehicle-hankyu-9000": [
    { title: "Wikipedia: Hankyu 9000 series", url: "https://en.wikipedia.org/wiki/Hankyu_9000_series" },
  ],
  "proc-vehicle-jnr-103": [
    { title: "Wikipedia: 103 series", url: "https://en.wikipedia.org/wiki/103_series" },
  ],
  "proc-vehicle-jnr-485": [
    { title: "Wikipedia: 485 series", url: "https://en.wikipedia.org/wiki/485_series" },
  ],
  "proc-vehicle-jnr-c62": [
    { title: "Wikipedia: JNR Class C62", url: "https://en.wikipedia.org/wiki/JNR_Class_C62" },
  ],
  "proc-vehicle-jnr-d51": [
    { title: "Wikipedia: JNR Class D51", url: "https://en.wikipedia.org/wiki/JNR_Class_D51" },
  ],
  "proc-vehicle-jnr-dd51": [
    { title: "Wikipedia: JNR Class DD51", url: "https://en.wikipedia.org/wiki/JNR_Class_DD51" },
  ],
  "proc-vehicle-jnr-ef66": [
    { title: "Wikipedia: JNR Class EF66", url: "https://en.wikipedia.org/wiki/JNR_Class_EF66" },
  ],
  "proc-vehicle-jr-e235": [
    { title: "Wikipedia: E235 series", url: "https://en.wikipedia.org/wiki/E235_series" },
  ],
  "proc-vehicle-jr-e259": [
    { title: "Wikipedia: E259 series", url: "https://en.wikipedia.org/wiki/E259_series" },
  ],
  "proc-vehicle-kintetsu-hinotori": [
    { title: "Wikipedia: Kintetsu 80000 series", url: "https://en.wikipedia.org/wiki/Kintetsu_80000_series" },
  ],
  "proc-vehicle-nyc-hudson": [
    { title: "Wikipedia: New York Central Hudson", url: "https://en.wikipedia.org/wiki/New_York_Central_Hudson" },
  ],
  "proc-vehicle-nyc-r160": [
    { title: "Wikipedia: R160 (New York City Subway car)", url: "https://en.wikipedia.org/wiki/R160_(New_York_City_Subway_car)" },
  ],
  "proc-vehicle-odakyu-gse": [
    { title: "Wikipedia: Odakyu 70000 series GSE", url: "https://en.wikipedia.org/wiki/Odakyu_70000_series_GSE" },
  ],
  "proc-vehicle-pioneer-zephyr": [
    { title: "Wikipedia: Pioneer Zephyr", url: "https://en.wikipedia.org/wiki/Pioneer_Zephyr" },
  ],
  "proc-vehicle-prr-gg1": [
    { title: "Wikipedia: Pennsylvania Railroad class GG1", url: "https://en.wikipedia.org/wiki/Pennsylvania_Railroad_class_GG1" },
  ],
  "proc-vehicle-prr-k4s": [
    { title: "Wikipedia: Pennsylvania Railroad class K4", url: "https://en.wikipedia.org/wiki/Pennsylvania_Railroad_class_K4" },
  ],
  "proc-vehicle-sf-cable-car": [
    { title: "Wikipedia: San Francisco cable car system", url: "https://en.wikipedia.org/wiki/San_Francisco_cable_car_system" },
  ],
  "proc-vehicle-shinkansen-100": [
    { title: "Wikipedia: 100 Series Shinkansen", url: "https://en.wikipedia.org/wiki/100_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-500": [
    { title: "Wikipedia: 500 Series Shinkansen", url: "https://en.wikipedia.org/wiki/500_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-700": [
    { title: "Wikipedia: 700 Series Shinkansen", url: "https://en.wikipedia.org/wiki/700_Series_Shinkansen" },
    { title: "Wikipedia: Doctor Yellow", url: "https://en.wikipedia.org/wiki/Doctor_Yellow" },
  ],
  "proc-vehicle-shinkansen-e4": [
    { title: "Wikipedia: E4 Series Shinkansen", url: "https://en.wikipedia.org/wiki/E4_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-e5": [
    { title: "Wikipedia: E5 and H5 Series Shinkansen", url: "https://en.wikipedia.org/wiki/E5_and_H5_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-e6": [
    { title: "Wikipedia: E6 Series Shinkansen", url: "https://en.wikipedia.org/wiki/E6_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-n700s": [
    { title: "Wikipedia: N700S Series Shinkansen", url: "https://en.wikipedia.org/wiki/N700S_Series_Shinkansen" },
  ],
  "proc-vehicle-siemens-alc42": [
    { title: "Wikipedia: Siemens Charger", url: "https://en.wikipedia.org/wiki/Siemens_Charger" },
  ],
  "proc-vehicle-up-big-boy": [
    { title: "Wikipedia: Union Pacific Big Boy", url: "https://en.wikipedia.org/wiki/Union_Pacific_Big_Boy" },
  ],
  "proc-vehicle-us-boxcar": [
    { title: "Wikipedia: Boxcar", url: "https://en.wikipedia.org/wiki/Boxcar" },
  ],
  "proc-vehicle-us-caboose": [
    { title: "Wikipedia: Caboose", url: "https://en.wikipedia.org/wiki/Caboose" },
  ],
  "proc-vehicle-us-well-car": [
    { title: "Wikipedia: Well car", url: "https://en.wikipedia.org/wiki/Well_car" },
  ],
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
