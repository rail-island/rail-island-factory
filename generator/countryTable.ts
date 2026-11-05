// The country each vehicle comes from (docs/site/catalog-site.md, "Country"):
// the railway or operator a rail vehicle is drawn for, the maker of a road
// vehicle or an aircraft. Keyed by the exported model id (`proc-...`); a code is
// lower-case ISO 3166-1 alpha-2. A generic model (the legacy wagons, the ships,
// the cable car cabins, an unbranded truck) has none.
//
// Kept apart from the designs on purpose, like soundTable.ts: a design module is
// bundled into each of its models' JS files, so a field stated there would rewrite
// every model of that module. Read by the catalog only (catalog.ts), for the
// site; never by a model, and not part of the game's meta.

/** The English name of every country a model may name, by code. */
export const COUNTRY_NAMES: Readonly<Record<string, string>> = {
  at: "Austria",
  ch: "Switzerland",
  cn: "China",
  cz: "Czechia",
  de: "Germany",
  es: "Spain",
  fr: "France",
  gb: "United Kingdom",
  hk: "Hong Kong",
  hu: "Hungary",
  in: "India",
  jp: "Japan",
  nl: "Netherlands",
  pl: "Poland",
  ru: "Russia",
  sk: "Slovakia",
  us: "United States",
};

const each = (code: string, ...ids: string[]): Array<[string, string]> => ids.map((id) => [`proc-vehicle-${id}`, code]);

export const COUNTRY_OF: ReadonlyMap<string, string> = new Map([
  ...each("cz",
    // Czech and Czechoslovak railways
    "cd-110", "cd-130", "cd-140", "cd-150", "cd-163", "cd-169", "cd-180", "cd-230", "cd-263", "cd-451", "cd-460", "cd-470", "cd-471", "cd-680",
    "cd-704", "cd-710", "cd-714", "cd-742", "cd-749", "cd-750", "cd-771", "cd-781", "cd-810", "cd-812", "cd-843", "cd-green-white-coach", "cd-y-coach",
    "csd-386", "csd-433-0", "csd-456-0", "csd-475-1", "csd-477-0", "csd-498-1", "csd-556-0", "csd-636", "csd-m112", "csd-m131", "csd-m240", "csd-m296",
    "csd-t499", "csd-t679-0", "csd-classic-green-coach", "csd-balm", "csd-bam", "csd-bdmtee", "csd-be31", "csd-bi20", "csd-dsk", "bmo-double-deck-coach",
    "muv-69", "uic-z-coach", "vectron",
    // the Czech makers' road vehicles, trams and aircraft
    "karosa-short", "karosa-long", "karosa-renault-citybus-12m", "karosa-renault-citybus-18m", "tatra-815-tipper", "praga-rv",
    "tatra-t3", "tatra-t6", "tatra-kt8", "tatra-kt4", "aero-a10"),
  ...each("sk", "zsr-coach"),
  ...each("de", "db-ice3", "db-ice4", "db-ice-t", "db-423", "db-642", "db-650", "db-vt98", "drg-svt877",
    "db-103", "db-101", "db-120", "drg-e18", "drg-e94", "db-v200", "db-218",
    "drg-01", "dr-52", "kpev-p8", "db-ice2", "db-ic-coach",
    "db-111", "db-212", "db-628", "db-dosto", "dr-243", "dr-sbahn-berlin", "dr-vt1816", "ice-1", "kvag-gt4",
    "mercedes-atego-1224", "mb-citaro", "mb-citaro-blue", "mb-o345-g"),
  ...each("nl", "ns-mat46", "ns-mat54", "ns-plan-v", "ns-de1", "ns-icm", "ns-virm", "ns-ddz", "ns-sgm", "ns-slt", "ns-sng", "ns-icng", "ns-flirt",
    "ns-v250", "ns-1700", "ns-1100", "ns-1300", "ns-1200", "ns-2200", "ns-3700", "ns-icr-coach"),
  ...each("ch", "sbb-rae-tee", "sbb-roter-pfeil", "sbb-icn", "sbb-giruno", "sbb-fv-dosto", "sbb-flirt", "sbb-kiss", "rhb-allegra", "sbb-re460",
    "sbb-re420", "sbb-re620", "sbb-ae66", "sbb-ce68", "sbb-ae814", "rhb-ge443", "rhb-ge66", "mgb-hge442", "sbb-ew4-coach", "sbb-ic2000", "glacier-express"),
  ...each("es", "renfe-s100", "renfe-s103", "renfe-s102", "renfe-s106", "renfe-s130", "talgo-iii", "renfe-s120", "renfe-civia", "renfe-446",
    "renfe-440", "renfe-592", "iryo-s109", "renfe-354", "renfe-252", "renfe-269", "renfe-277", "renfe-319", "renfe-333", "renfe-141f", "renfe-242f"),
  ...each("gb", "br-hst", "br-ic225", "br-class-800", "br-class-390", "eurostar-373", "br-class-158", "br-class-142", "lu-1938-stock",
    "br-class-55", "br-class-37", "br-class-47", "br-class-66", "br-class-86", "lner-a4", "lner-a3", "gwr-castle", "lms-black-five", "br-9f",
    "rocket", "br-mk1-coach"),
  ...each("in", "ir-vande-bharat", "ncrtc-namo-bharat", "ir-mumbai-emu", "ir-memu", "dmrc-rs1", "ir-wdm2", "ir-wdp4d", "ir-wdg4g", "ir-wam4",
    "ir-wap4", "ir-wap7", "ir-wap5", "ir-wag12b", "ir-wp", "ir-wg", "eir-fairy-queen", "dhr-b-class", "ir-lhb-coach", "ir-icf-coach", "ir-boxn-wagon"),
  ...each("cn", "cr-cr400af", "cr-cr400bf", "cr-crh380a", "cr-crh2a", "cr-crh3c", "cr-crh5a", "cr-cr200j", "cr-crh6a", "cr-hxn5", "cr-hxd1",
    "cr-hxd3d", "cr-ss1", "cr-ss8", "cr-df4", "cr-df11", "cr-qj", "cr-sy", "cr-js", "cr-25t-coach", "cr-c70-wagon"),
  ...each("at", "obb-1012", "obb-1040"),
  ...each("hu", "mav-mdmot"),
  ...each("pl", "solaris-urbino-15"),
  ...each("ru", "metro-81-71"),
  ...each("fr", "sncf-tgv-m", "sncf-z20500", "ratp-mi09", "sncf-regio2n", "sncf-regiolis", "sncf-x3800", "sncf-x73500", "sncf-cc6500",
    "sncf-cc40100", "sncf-bb22200", "sncf-cc7100", "sncf-bb9200", "sncf-bb27000", "sncf-bb67400", "sncf-cc72000", "sncf-241p", "sncf-141r",
    "sncf-corail-coach", "sncf-grand-confort", "ciwl-car",
    "tgv", "tgv-duplex", "airbus-a380", "airbus-beluga"),
  ...each("hk", "mtr-m-train"),
  ...each("jp", "shinkansen-0", "shinkansen-n700s", "shinkansen-e5", "shinkansen-500", "shinkansen-700", "shinkansen-e6", "shinkansen-100", "shinkansen-e4",
    "jr-e235", "jnr-103", "odakyu-gse", "kintetsu-hinotori", "jr-e259", "jnr-485", "hankyu-9000", "jnr-c62", "jnr-d51", "jnr-ef66", "jnr-dd51",
    "blue-train-24", "jr-kiha40"),
  ...each("us", "emd-gp9", "emd-sd40-2", "ge-es44ac", "emd-sd70ace", "emd-f7", "ge-p42dc", "siemens-alc42", "prr-gg1", "amtrak-superliner",
    "amtrak-acela", "up-big-boy", "prr-k4s", "nyc-hudson", "american-440", "budd-rdc", "pioneer-zephyr", "nyc-r160", "cta-5000", "us-caboose",
    "us-boxcar", "us-well-car", "sf-cable-car", "american-truck", "boeing-737", "boeing-747", "mcdonnell-douglas-md11"),
]);

/** A model's country code, or undefined when it names none. */
export function countryOf(id: string): string | undefined {
  return COUNTRY_OF.get(id);
}

/** A country's English name; an unknown code reads as itself, upper-cased. */
export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code.toUpperCase();
}
