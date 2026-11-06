// The OpenTTD facts of every vehicle a GRF can hold (docs/site/openttd-export.md):
// the year it entered service, its capacity (seats, or standing room too for a
// metro, tram or city bus; a freight vehicle's payload in tonnes, a tank's in
// kilolitres), its cargo and refits, its climates, a train's rail type, the
// presets the one-click download exports and the fixed formations of its cars.
// The balance figures (costs, lives, reliability decay) are derived
// (openttd.ts deriveBalance) unless an entry states them.
//
// The figures are real-world, researched from the designs' references and
// published data; "approx." marks a figure that is an estimate (an unclear
// first-service year, a seat count taken from a sister type). Each family's doc
// lists its figures. The table is keyed by model id and put on the designs by
// generate.ts, so the source modules - and their JS models - stay as they are.

import type { OpenttdClimate, OpenttdFormation, OpenttdProperties, OpenttdVariant, ParamValues } from "./design.ts";

/** Every climate but toyland: the factory's vehicles are real ones. */
const REAL: OpenttdClimate[] = ["temperate", "arctic", "tropical"];

type Extra = Partial<OpenttdProperties>;

/** A locomotive or power car: no capacity. */
const loco = (introYear: number, railType: string, extra: Extra = {}): OpenttdProperties => ({
  introYear, capacity: 0, cargo: "PASS", refitClasses: [], climates: REAL, railType, ...extra,
});

/** A passenger vehicle; `railType` only for a train. */
const pax = (introYear: number, capacity: number, railType: string | null, extra: Extra = {}): OpenttdProperties => ({
  introYear, capacity, cargo: "PASS", refitClasses: ["passengers"], climates: REAL, ...(railType ? { railType } : {}), ...extra,
});

/** A freight wagon on plain rail. */
const wagon = (introYear: number, capacity: number, cargo: string, refitClasses: OpenttdProperties["refitClasses"], extra: Extra = {}): OpenttdProperties => ({
  introYear, capacity, cargo, refitClasses, climates: REAL, railType: "RAIL", ...extra,
});

/** A road vehicle carrying freight. */
const truck = (introYear: number, capacity: number, cargo: string, refitClasses: OpenttdProperties["refitClasses"], extra: Extra = {}): OpenttdProperties => ({
  introYear, capacity, cargo, refitClasses, climates: REAL, ...extra,
});

/** The presets: the default first, then the given selections. */
const presets = (...more: ParamValues[]): ParamValues[] => [{}, ...more];

/** One parameter's values as selections. */
const each = (name: string, ...values: string[]): ParamValues[] => values.map((v) => ({ [name]: v }));

/** A variant entry. */
const at = (params: ParamValues, fields: Omit<OpenttdVariant, "params">): OpenttdVariant => ({ params, ...fields });

/** A formation: car selections front first; `turn` marks the cars drawn facing backwards. */
const formation = (name: string, ...cars: Array<ParamValues | [ParamValues, "turned"]>): OpenttdFormation => ({
  name,
  cars: cars.map((c) => (Array.isArray(c) ? { params: c[0], turned: true } : { params: c })),
});

const ELRL = "ELRL";
const RAIL = "RAIL";

/**
 * A unit on the series kit (shinkansen.ts): the end car's and a middle car's
 * seats, its presets (the middle car, every other livery) and its formation of
 * `cars` (end car, middle cars, the end car turned). A two-car unit has no
 * middle car; a single railcar only its liveries.
 */
const series = (introYear: number, endSeats: number, midSeats: number, railType: string, o: { cars: number; liveries?: string[] } | { single: true; liveries?: string[] }): OpenttdProperties => {
  const liveries = each("livery", ...(o.liveries ?? []));
  if ("single" in o) return pax(introYear, endSeats, railType, { presets: presets(...liveries) });
  if (o.cars <= 2) return pax(introYear, endSeats, railType, { presets: presets(...liveries), formations: [formation("2 cars", {}, [{}, "turned"])] });
  const middles = Array.from({ length: o.cars - 2 }, () => ({ unit: "middleCar" }));
  return pax(introYear, endSeats, railType, {
    variants: [at({ unit: "middleCar" }, { capacity: midSeats })],
    presets: presets({ unit: "middleCar" }, ...liveries),
    formations: [formation(`${o.cars} cars`, {}, ...middles, [{}, "turned"])],
  });
};

export const OPENTTD_TABLE: Readonly<Record<string, OpenttdProperties>> = {
  // --- freight wagons --------------------------------------------------------------
  "proc-vehicle-legacy-covered-wagon": wagon(1950, 25, "GOOD", ["piece", "covered", "express"], {
    variants: [at({ body: "beer" }, { refitClasses: ["piece", "covered", "refrigerated"] }), at({ body: "sliding" }, { introYear: 1965, capacity: 30 })],
    presets: presets(...each("body", "beer", "sliding")),
  }), // approx.
  "proc-vehicle-legacy-open-wagon": wagon(1955, 30, "COAL", ["bulk", "piece"], { presets: presets() }), // approx.
  "proc-vehicle-legacy-heavy-wagon": wagon(1970, 150, "GOOD", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-nas-flat-wagon": wagon(1975, 50, "WOOD", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-ua-open-wagon": wagon(1970, 50, "COAL", ["bulk", "piece"], { presets: presets() }), // approx.
  "proc-vehicle-eas-open-wagon": wagon(1970, 55, "COAL", ["bulk", "piece"], { presets: presets() }),
  "proc-vehicle-raj-hopper-wagon": wagon(1980, 55, "COAL", ["bulk"], { presets: presets() }), // approx.
  "proc-vehicle-rah-tank-wagon": wagon(1975, 60, "OIL_", ["liquid"], { presets: presets() }), // approx.
  "proc-vehicle-sqns-container-wagon": wagon(2005, 60, "GOOD", ["piece", "express"], { presets: presets() }),
  "proc-vehicle-pao-flat-wagon": wagon(1970, 50, "STEL", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-habis-sliding-wall-wagon": wagon(1985, 60, "GOOD", ["piece", "covered", "express"], { presets: presets({ livery: "tw2" }) }),
  "proc-vehicle-hadgs-hopper-wagon": wagon(1975, 55, "GRAI", ["bulk", "covered"], { presets: presets() }), // approx.
  "proc-vehicle-faccs-hopper-wagon": wagon(1985, 55, "COAL", ["bulk"], { presets: presets({ livery: "viamont" }) }), // approx.
  "proc-vehicle-falls-hopper-wagon": wagon(1980, 60, "COAL", ["bulk"], { presets: presets(...each("livery", "sd", "viamont")) }), // approx.
  "proc-vehicle-wap-hopper-wagon": wagon(1960, 60, "COAL", ["bulk"], { presets: presets() }), // approx.

  // --- coaches ---------------------------------------------------------------------
  "proc-vehicle-csd-classic-green-coach": pax(1960, 54, RAIL, {
    variants: [at({ variant: "classB" }, { capacity: 80 })],
    presets: presets({ variant: "classB" }),
  }),
  "proc-vehicle-csd-balm": pax(1928, 64, RAIL, { presets: presets() }), // approx.
  "proc-vehicle-csd-bam": pax(1928, 60, RAIL, { presets: presets() }), // approx.
  "proc-vehicle-csd-bdmtee": pax(1970, 48, RAIL, { presets: presets() }),
  "proc-vehicle-csd-be31": pax(1931, 72, RAIL, { presets: presets() }), // approx.
  "proc-vehicle-csd-bi20": pax(1920, 50, RAIL, { presets: presets() }), // approx.
  "proc-vehicle-csd-dsk": wagon(1930, 20, "MAIL", ["mail", "express"], { presets: presets() }), // approx.
  "proc-vehicle-bmo-double-deck-coach": pax(1976, 126, RAIL, { presets: presets(...each("livery", "cdBlue", "cdNajbrt")) }),
  "proc-vehicle-cd-green-white-coach": pax(1995, 80, RAIL, {
    variants: [
      at({ variant: "a" }, { capacity: 54 }), at({ variant: "ab" }, { capacity: 66 }), at({ variant: "bee" }, { capacity: 66 }),
      at({ variant: "beel" }, { capacity: 60 }), at({ variant: "bds" }, { capacity: 40 }),
      at({ variant: "ds" }, { capacity: 25, cargo: "MAIL", refitClasses: ["mail", "express"] }),
      at({ variant: "bdmeer" }, { capacity: 40 }), at({ variant: "bdmtee" }, { capacity: 48 }), at({ variant: "beeBlue" }, { capacity: 66 }),
    ],
    presets: presets(...each("variant", "a", "ab", "bee", "bds", "ds", "bdmtee")),
  }),
  "proc-vehicle-cd-y-coach": pax(1970, 54, RAIL, {
    variants: [at({ variant: "beer" }, { capacity: 80 }), at({ variant: "bnb" }, { introYear: 1965, capacity: 80 }), at({ variant: "wrrm" }, { capacity: 42 })],
    presets: presets(...each("variant", "beer", "bnb", "wrrm")),
  }), // approx.
  "proc-vehicle-zsr-coach": pax(1993, 80, RAIL, {
    variants: [
      at({ variant: "a" }, { capacity: 54 }), at({ variant: "ab" }, { capacity: 66 }), at({ variant: "bds" }, { capacity: 40 }),
      at({ variant: "bdmeer" }, { capacity: 40 }), at({ variant: "wrrm" }, { capacity: 42 }), at({ variant: "apee" }, { capacity: 54 }),
    ],
    presets: presets(...each("variant", "a", "ab", "bh", "bdmeer", "wrrm", "apee")),
  }),
  "proc-vehicle-uic-z-coach": pax(1980, 66, RAIL, {
    variants: [at({ variant: "firstClass" }, { capacity: 54 }), at({ variant: "restaurant" }, { capacity: 36 })],
    presets: presets(...each("variant", "firstClass", "restaurant"), ...each("operator", "db", "obb", "regiojet", "cdBlue")),
  }),
  "proc-vehicle-db-dosto": pax(1994, 126, RAIL, {
    variants: [at({ variant: "firstClass" }, { capacity: 100 }), at({ variant: "drivingTrailer" }, { capacity: 100 })],
    presets: presets(...each("variant", "firstClass", "drivingTrailer")),
    formations: [formation("3 coaches, driving trailer", { variant: "firstClass" }, {}, {}, [{ variant: "drivingTrailer" }, "turned"])],
  }),
  "proc-vehicle-dr-sbahn-berlin": pax(1974, 126, RAIL, {
    variants: [at({ variant: "drivingTrailer" }, { capacity: 110 })],
    presets: presets({ variant: "drivingTrailer" }),
    formations: [formation("4 coaches, driving trailer", {}, {}, {}, {}, [{ variant: "drivingTrailer" }, "turned"])],
  }), // approx.

  // --- steam locomotives -----------------------------------------------------------
  "proc-vehicle-csd-433-0": loco(1909, RAIL, { presets: presets({ livery: "redLining" }) }), // approx.
  "proc-vehicle-csd-456-0": loco(1925, RAIL, { presets: presets() }), // approx.
  "proc-vehicle-csd-475-1": loco(1947, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-csd-477-0": loco(1951, RAIL, { presets: presets() }),
  "proc-vehicle-csd-498-1": loco(1954, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-csd-556-0": loco(1951, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-csd-636": loco(1921, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }), // approx.
  "proc-vehicle-csd-386": loco(1934, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }), // approx.
  "proc-vehicle-csd-m112": pax(1905, 40, RAIL, { presets: presets() }), // approx.

  // --- electric locomotives --------------------------------------------------------
  "proc-vehicle-cd-150": loco(1978, ELRL, {
    variants: [at({ livery: "cd151" }, { introYear: 1996 }), at({ livery: "cd151Cez" }, { introYear: 1996 }), at({ livery: "zsr350" }, { introYear: 1974 })],
    presets: presets(...each("livery", "cd151", "zsr350", "cdBlue")),
  }),
  "proc-vehicle-cd-163": loco(1984, ELRL, {
    vehicleLife: 40,
    variants: [at({ livery: "cd362" }, { introYear: 1990 }), at({ livery: "cd162" }, { introYear: 1991 }), at({ livery: "cd363" }, { introYear: 1980 })],
    presets: presets(...each("livery", "cd162", "cd362", "cd363", "regiojet", "cdBlue")),
  }),
  "proc-vehicle-cd-230": loco(1966, ELRL, {
    variants: [at({ livery: "cd240" }, { introYear: 1968 }), at({ livery: "cd242" }, { introYear: 1975 }), at({ livery: "cd340" }, { introYear: 1993 })],
    presets: presets(...each("livery", "cd240", "cd242", "cd340", "cd242Blue")),
  }),
  "proc-vehicle-cd-263": loco(1984, ELRL, {
    variants: [at({ livery: "cd372" }, { introYear: 1988 }), at({ livery: "db180" }, { introYear: 1991 }), at({ livery: "cd371No002" }, { introYear: 1996 })],
    presets: presets(...each("livery", "cd372", "cd371No002", "db180", "cd263Blue")),
  }),
  "proc-vehicle-cd-110": loco(1971, ELRL, {
    variants: [at({ livery: "cd111" }, { introYear: 1981 }), at({ livery: "cd210" }, { introYear: 1973 })],
    presets: presets(...each("livery", "cd111", "cd210", "cd111Blue")),
  }),
  "proc-vehicle-cd-130": loco(1977, ELRL, { variants: [at({ livery: "cd123" }, { introYear: 1971 })], presets: presets({ livery: "cd123" }) }),
  "proc-vehicle-cd-140": loco(1953, ELRL, { presets: presets() }),
  "proc-vehicle-cd-169": loco(2014, ELRL, { presets: presets() }), // approx.
  "proc-vehicle-cd-180": loco(1961, ELRL, {
    variants: [at({ livery: "cd180" }, { introYear: 1958 }), at({ livery: "cd182" }, { introYear: 1963 })],
    presets: presets(...each("livery", "cd180", "cd182", "cd181Okd")),
  }),
  "proc-vehicle-dnt-184-5": loco(1967, ELRL, { presets: presets({ livery: "dnt1845No1" }) }), // approx.
  "proc-vehicle-db-111": loco(1974, ELRL, { presets: presets(...each("livery", "db111Bb", "db111S")) }),
  "proc-vehicle-dr-243": loco(1984, ELRL, {
    variants: [at({ livery: "db143" }, { introYear: 1991 }), at({ livery: "db143vr" }, { introYear: 1991 }), at({ livery: "db112" }, { introYear: 1992 })],
    presets: presets(...each("livery", "db143", "db143vr", "db112")),
  }),
  "proc-vehicle-obb-1012": loco(1996, ELRL, { presets: presets() }),
  "proc-vehicle-obb-1040": loco(1953, ELRL, { presets: presets() }),
  "proc-vehicle-vectron": loco(2011, ELRL, { presets: presets(...each("livery", "regiojet", "cdWhite")) }),

  // --- diesel locomotives ----------------------------------------------------------
  "proc-vehicle-cd-704": loco(1988, RAIL, { variants: [at({ livery: "t2380" }, { introYear: 1985 })], presets: presets({ livery: "t2380" }) }), // approx.
  "proc-vehicle-cd-710": loco(1958, RAIL, { presets: presets() }),
  "proc-vehicle-cd-714": loco(1992, RAIL, { presets: presets() }),
  "proc-vehicle-cd-742": loco(1977, RAIL, {
    variants: [at({ variant: "viamont740" }, { introYear: 1973 }), at({ variant: "cd743" }, { introYear: 1987 })],
    presets: presets(...each("variant", "viamont740", "cd743")),
  }),
  "proc-vehicle-db-212": loco(1962, RAIL, { presets: presets(...each("livery", "oceanBlue", "trafficRed")) }),
  "proc-vehicle-muv-69": pax(1971, 6, RAIL, { presets: presets() }), // approx.
  "proc-vehicle-cd-750": loco(1992, RAIL, {
    variants: [at({ livery: "cd753" }, { introYear: 1970 }), at({ livery: "cd754" }, { introYear: 1975 }), at({ livery: "cd754Blue" }, { introYear: 1975 })],
    presets: presets(...each("livery", "cd753", "cd754", "cd754Blue")),
  }),
  "proc-vehicle-cd-749": loco(1992, RAIL, { presets: presets({ livery: "cd749No121" }) }),
  "proc-vehicle-cd-781": loco(1966, RAIL, { presets: presets({ livery: "cd781No462" }) }),
  "proc-vehicle-csd-t679-0": loco(1963, RAIL, { presets: presets() }),
  "proc-vehicle-csd-t499": loco(1973, RAIL, { presets: presets() }),
  "proc-vehicle-cd-771": loco(1968, RAIL, { presets: presets(...each("livery", "cd771", "cd771No421")) }),

  // --- North American diesels ------------------------------------------------------
  "proc-vehicle-emd-gp9": loco(1954, RAIL, { presets: presets(...each("livery", "pennsylvania", "santaFe")) }),
  "proc-vehicle-emd-sd40-2": loco(1972, RAIL, { presets: presets(...each("livery", "conrail", "unionPacific")) }),
  "proc-vehicle-ge-es44ac": loco(2005, RAIL, { presets: presets(...each("livery", "unionPacific", "csx")) }),
  "proc-vehicle-emd-sd70ace": loco(2004, RAIL, { presets: presets(...each("livery", "norfolkSouthern", "bnsf")) }),
  "proc-vehicle-emd-f7": loco(1949, RAIL, { presets: presets(...each("livery", "unionPacific", "southernPacific")) }),
  "proc-vehicle-emd-f40ph": loco(1976, RAIL, { presets: presets({ livery: "phaseII" }) }),
  "proc-vehicle-ge-p42dc": loco(1996, RAIL, { presets: presets(...each("livery", "phaseIII", "via")) }),
  "proc-vehicle-siemens-alc42": loco(2022, RAIL, { variants: [at({ livery: "midwest" }, { introYear: 2017 })], presets: presets({ livery: "midwest" }) }),
  "proc-vehicle-prr-gg1": loco(1935, ELRL, { presets: presets(...each("livery", "tuscan", "pennCentral")) }),
  "proc-vehicle-up-big-boy": loco(1941, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-prr-k4s": loco(1914, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-nyc-hudson": loco(1938, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-american-440": loco(1868, RAIL, {
    presets: presets({ unit: "tender" }, { livery: "no119" }, { unit: "tender", livery: "no119" }),
    formations: [formation("with tender", {}, { unit: "tender" }), formation("No. 119 with tender", { livery: "no119" }, { unit: "tender", livery: "no119" })],
  }),
  "proc-vehicle-amtrak-superliner": pax(1979, 74, RAIL, { variants: [at({ unit: "sleeper" }, { capacity: 44 })], presets: presets({ unit: "sleeper" }) }),
  "proc-vehicle-budd-rdc": pax(1949, 90, RAIL, { variants: [at({ variant: "rdc2" }, { capacity: 70 })], presets: presets({ variant: "rdc2" }) }),
  "proc-vehicle-pioneer-zephyr": pax(1934, 0, RAIL, {
    variants: [at({ unit: "coach" }, { capacity: 40 }), at({ unit: "observation" }, { capacity: 32 }), at({ unit: "train" }, { capacity: 72 })],
    presets: presets(...each("unit", "coach", "observation")),
    formations: [formation("3 cars", {}, { unit: "coach" }, { unit: "observation" })],
  }),
  "proc-vehicle-nyc-r160": pax(2005, 240, ELRL, { variants: [at({ unit: "trailer" }, { capacity: 246 })], presets: presets({ unit: "trailer" }) }),
  "proc-vehicle-cta-5000": pax(2009, 110, ELRL, { presets: presets() }),
  "proc-vehicle-us-caboose": wagon(1925, 5, "MAIL", ["mail"], { presets: presets({ livery: "unionPacific" }) }), // approx.
  "proc-vehicle-us-boxcar": wagon(1970, 70, "GOOD", ["piece", "covered", "express"], { presets: presets({ livery: "railbox" }) }), // approx.
  "proc-vehicle-us-well-car": wagon(1984, 40, "GOOD", ["piece", "express"], { variants: [at({ cargo: "double" }, { capacity: 80 })], presets: presets({ cargo: "empty" }, { cargo: "double" }) }),
  "proc-vehicle-sf-cable-car": pax(1888, 60, null, { presets: presets({ livery: "california" }) }), // approx.
  "proc-vehicle-amtrak-acela": loco(2000, ELRL, {
    variants: [
      at({ unit: "businessClass" }, { capacity: 65, cargo: "PASS", refitClasses: ["passengers"] }),
      at({ unit: "firstClass" }, { capacity: 44, cargo: "PASS", refitClasses: ["passengers"] }),
      at({ unit: "cafe" }, { capacity: 20, cargo: "PASS", refitClasses: ["passengers"] }),
    ],
    presets: presets(...each("unit", "businessClass", "firstClass", "cafe")),
    formations: [formation("8 cars", {}, { unit: "firstClass" }, { unit: "businessClass" }, { unit: "businessClass" }, { unit: "cafe" }, { unit: "businessClass" }, { unit: "businessClass" }, [{}, "turned"])],
  }),

  // --- electric units --------------------------------------------------------------
  "proc-vehicle-cd-471": pax(1997, 92, ELRL, {
    variants: [at({ unit: "trailer" }, { capacity: 134 }), at({ unit: "drivingTrailer" }, { capacity: 98 })],
    presets: presets(...each("unit", "trailer", "drivingTrailer"), ...each("variant", "cd675", "cdBlue")),
    formations: [formation("3 cars", {}, { unit: "trailer" }, [{ unit: "drivingTrailer" }, "turned"])],
  }),
  "proc-vehicle-cd-680": pax(2004, 44, ELRL, {
    variants: [at({ unit: "car683" }, { capacity: 62 }), at({ unit: "car685" }, { capacity: 30 }), at({ unit: "car686" }, { capacity: 62 })],
    presets: presets(...each("unit", "car683", "car685", "car686")),
    formations: [formation("7 cars", {}, { unit: "car683" }, { unit: "car686" }, { unit: "car685" }, { unit: "car683" }, { unit: "car686" }, [{}, "turned"])],
  }), // approx.
  "proc-vehicle-metro-81-71": pax(1974, 160, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 170 })],
    presets: presets({ unit: "middleCar" }, { livery: "budapest" }, { unit: "middleCar", livery: "budapest" }),
    formations: [
      formation("5 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"]),
      formation("5 cars Budapest", { livery: "budapest" }, ...[1, 2, 3].map(() => ({ unit: "middleCar", livery: "budapest" })), [{ livery: "budapest" }, "turned"]),
    ],
  }),
  "proc-vehicle-cd-451": pax(1964, 80, ELRL, {
    variants: [at({ unit: "trailer" }, { capacity: 90 })],
    presets: presets({ unit: "trailer" }, { livery: "cdBlue" }),
    formations: [formation("4 cars", {}, { unit: "trailer" }, { unit: "trailer" }, [{}, "turned"])],
  }),
  "proc-vehicle-cd-460": pax(1974, 64, ELRL, {
    variants: [at({ unit: "trailer" }, { capacity: 80 })],
    presets: presets({ unit: "trailer" }, ...each("livery", "csd", "cdBlue")),
    formations: [formation("5 cars", {}, { unit: "trailer" }, { unit: "trailer" }, { unit: "trailer" }, [{}, "turned"])],
  }),
  "proc-vehicle-cd-470": pax(1991, 110, ELRL, {
    variants: [at({ unit: "trailer" }, { capacity: 160 })],
    presets: presets({ unit: "trailer" }),
    formations: [formation("5 cars", {}, { unit: "trailer" }, { unit: "trailer" }, { unit: "trailer" }, [{}, "turned"])],
  }),
  "proc-vehicle-ice-1": loco(1991, ELRL, {
    variants: [
      at({ unit: "coach" }, { capacity: 66, cargo: "PASS", refitClasses: ["passengers"] }),
      at({ unit: "restaurant" }, { capacity: 24, cargo: "PASS", refitClasses: ["passengers"] }),
    ],
    presets: presets(...each("unit", "coach", "restaurant")),
    formations: [formation("power cars, 6 coaches", {}, { unit: "coach" }, { unit: "coach" }, { unit: "restaurant" }, { unit: "coach" }, { unit: "coach" }, { unit: "coach" }, [{}, "turned"])],
  }),
  "proc-vehicle-tgv": loco(1981, ELRL, {
    variants: [
      at({ livery: "atlantique" }, { introYear: 1989 }),
      ...["1", "2", "3", "4", "5", "6"].map((n) => at(n === "1" ? { unit: "set" } : { unit: "set", cars: n }, { capacity: 48 * Number(n), cargo: "PASS", refitClasses: ["passengers"] })),
    ],
    presets: presets({ unit: "set" }, { unit: "set", cars: "6" }, { livery: "atlantique" }),
    formations: [formation("power cars, 6 trailers", {}, { unit: "set", cars: "6" }, [{}, "turned"])],
  }),
  "proc-vehicle-shinkansen-0": pax(1964, 75, ELRL, {
    variants: [
      at({ unit: "motorCar" }, { capacity: 100 }), at({ unit: "pantographCar" }, { capacity: 100 }),
      at({ unit: "greenCar" }, { capacity: 64 }), at({ unit: "buffetCar" }, { capacity: 40 }),
      at({ livery: "freshGreen" }, { introYear: 1986 }),
    ],
    presets: presets(...each("unit", "motorCar", "pantographCar", "greenCar", "buffetCar"), ...each("livery", "freshGreen", "doctorYellow")),
    formations: [formation("8 cars", {}, { unit: "motorCar" }, { unit: "pantographCar" }, { unit: "greenCar" }, { unit: "buffetCar" }, { unit: "motorCar" }, { unit: "pantographCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-shinkansen-n700s": pax(2020, 60, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 85 })],
    presets: presets({ unit: "middleCar" }, { livery: "jrKyushu" }),
    formations: [formation("8 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-shinkansen-e5": pax(2011, 29, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 100 })],
    presets: presets({ unit: "middleCar" }, { livery: "h5" }),
    formations: [formation("8 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-shinkansen-500": pax(1997, 53, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 80 })],
    presets: presets({ unit: "middleCar" }, { livery: "kodama" }),
    formations: [formation("8 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-shinkansen-700": pax(1999, 65, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 100 })],
    presets: presets({ unit: "middleCar" }, { livery: "doctorYellow" }),
    formations: [formation("8 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-shinkansen-e6": pax(2013, 22, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 60 })],
    presets: presets({ unit: "middleCar" }, { livery: "akita" }),
    formations: [formation("8 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-shinkansen-100": pax(1985, 65, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 90 })],
    presets: presets({ unit: "middleCar" }, { livery: "jrWest" }),
    formations: [formation("8 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-shinkansen-e4": pax(1997, 75, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 135 })],
    presets: presets({ unit: "middleCar" }, { livery: "toki" }),
    formations: [formation("8 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-jr-e235": pax(2015, 40, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 54 })],
    presets: presets({ unit: "middleCar" }, { livery: "yokosuka" }),
    formations: [formation("6 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-jnr-103": pax(1963, 48, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 54 })],
    presets: presets({ unit: "middleCar" }, { livery: "yamanote" }),
    formations: [formation("6 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-odakyu-gse": pax(2018, 42, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 52 })],
    presets: presets({ unit: "middleCar" }, { livery: "lse" }),
    formations: [formation("6 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-kintetsu-hinotori": pax(2020, 32, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 42 })],
    presets: presets({ unit: "middleCar" }, { livery: "ace" }),
    formations: [formation("6 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-jr-e259": pax(2009, 28, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 56 })],
    presets: presets({ unit: "middleCar" }, { livery: "original" }),
    formations: [formation("6 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-jnr-485": pax(1964, 48, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 64 })],
    presets: presets({ unit: "middleCar" }, { livery: "kyushu" }),
    formations: [formation("6 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-hankyu-9000": pax(2006, 120, ELRL, {
    variants: [at({ unit: "middleCar" }, { capacity: 140 })],
    presets: presets({ unit: "middleCar" }, { livery: "allMaroon" }),
    formations: [formation("6 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-jnr-c62": loco(1948, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-jnr-d51": loco(1936, RAIL, {
    presets: presets({ unit: "tender" }, { variant: "namekuji" }),
    formations: [formation("with tender", {}, { unit: "tender" }), formation("Namekuji with tender", { variant: "namekuji" }, { unit: "tender", variant: "namekuji" })],
  }),
  "proc-vehicle-jnr-ef66": loco(1968, ELRL, { presets: presets({ livery: "jrFreight" }) }),
  "proc-vehicle-jnr-dd51": loco(1962, RAIL, { presets: presets({ livery: "hokutosei" }) }),
  "proc-vehicle-blue-train-24": pax(1973, 34, RAIL, { variants: [at({ unit: "dining" }, { capacity: 24 })], presets: presets({ unit: "dining" }) }),
  "proc-vehicle-mtr-m-train": pax(1979, 230, ELRL, {
    variants: [at({ unit: "bCar" }, { capacity: 250 }), at({ unit: "cCar" }, { capacity: 250 }), at({ unit: "dCar" }, { capacity: 250 })],
    presets: presets(...each("unit", "bCar", "cCar", "dCar"), ...each("livery", "retro", "disneyland")),
    formations: [formation("8 cars", {}, { unit: "cCar" }, { unit: "dCar" }, { unit: "bCar" }, { unit: "cCar" }, { unit: "dCar" }, { unit: "cCar" }, [{}, "turned"])],
  }),
  "proc-vehicle-tgv-duplex": loco(1996, ELRL, {
    variants: [
      at({ unit: "endTrailer" }, { capacity: 60, cargo: "PASS", refitClasses: ["passengers"] }),
      at({ unit: "trailer" }, { capacity: 70, cargo: "PASS", refitClasses: ["passengers"] }),
      at({ unit: "bar" }, { capacity: 30, cargo: "PASS", refitClasses: ["passengers"] }),
      at({ livery: "ouigo" }, { introYear: 2013 }), at({ livery: "inoui" }, { introYear: 2017 }),
    ],
    presets: presets(...each("unit", "endTrailer", "trailer", "bar"), ...each("livery", "original", "inoui", "ouigo")),
    formations: [formation("power cars, 8 trailers",
      {}, { unit: "endTrailer" }, { unit: "trailer" }, { unit: "trailer" }, { unit: "bar" }, { unit: "trailer" }, { unit: "trailer" }, { unit: "trailer" },
      [{ unit: "endTrailer" }, "turned"], [{}, "turned"])],
  }),

  // --- diesel units ----------------------------------------------------------------
  "proc-vehicle-cd-810": pax(1975, 55, RAIL, { presets: presets(...each("livery", "yellowBand", "blueWhite", "cdBlue")) }),
  "proc-vehicle-cd-812": pax(2007, 45, RAIL, {
    variants: [at({ unit: "drivingTrailer" }, { capacity: 50 })],
    presets: presets({ unit: "drivingTrailer" }),
    formations: [formation("with driving trailer", {}, [{ unit: "drivingTrailer" }, "turned"])],
  }),
  "proc-vehicle-cd-843": pax(1995, 64, RAIL, {
    variants: [at({ unit: "trailer" }, { capacity: 80 })],
    presets: presets(...each("unit", "trailer", "drivingTrailer"), { livery: "cdBlue" }),
    formations: [formation("3 cars", {}, { unit: "trailer" }, [{ unit: "drivingTrailer" }, "turned"])],
  }),
  "proc-vehicle-csd-m131": pax(1948, 48, RAIL, {
    variants: [at({ unit: "trailer" }, { capacity: 50 })],
    presets: presets({ unit: "trailer" }),
    formations: [formation("with trailer", {}, { unit: "trailer" })],
  }),
  "proc-vehicle-csd-m240": pax(1963, 64, RAIL, { presets: presets() }),
  "proc-vehicle-csd-m296": pax(1981, 64, RAIL, {
    variants: [at({ variant: "cd853" }, { introYear: 1996 }), at({ variant: "cd854" }, { introYear: 1997 }), at({ variant: "cd854Blue" }, { introYear: 1997 })],
    presets: presets(...each("variant", "cd853", "cd854", "cd854Blue")),
  }), // approx.
  "proc-vehicle-db-628": pax(1986, 64, RAIL, {
    variants: [at({ unit: "bn" }, { capacity: 80 }), at({ unit: "abn" }, { capacity: 64 }), at({ unit: "bdnrf" }, { capacity: 56 })],
    presets: presets(...each("unit", "bn", "abn", "bdnrf"), { livery: "red" }),
    formations: [formation("with n-coaches", {}, { unit: "bn" }, { unit: "abn" }, { unit: "bdnrf" })],
  }),
  "proc-vehicle-jr-kiha40": pax(1977, 66, RAIL, { presets: presets(...each("livery", "tarako", "jnr")) }),
  "proc-vehicle-dr-vt1816": pax(1964, 48, RAIL, {
    variants: [at({ unit: "dining" }, { capacity: 30 }), at({ unit: "firstClass" }, { capacity: 42 }), at({ unit: "trailer" }, { capacity: 60 })],
    presets: presets(...each("unit", "dining", "firstClass", "trailer")),
    formations: [formation("4 cars", {}, { unit: "trailer" }, { unit: "dining" }, [{}, "turned"])],
  }),
  "proc-vehicle-mav-mdmot": pax(1966, 40, RAIL, {
    variants: [at({ unit: "trailerAx" }, { capacity: 54 }), at({ unit: "trailerBx" }, { capacity: 80 }), at({ unit: "drivingTrailer" }, { capacity: 64 })],
    presets: presets(...each("unit", "trailerAx", "trailerBx", "drivingTrailer")),
    formations: [formation("4 cars", {}, { unit: "trailerAx" }, { unit: "trailerBx" }, [{ unit: "drivingTrailer" }, "turned"])],
  }), // approx.

  // --- trams (OpenTTD road vehicles on tram tracks) --------------------------------
  "proc-vehicle-tatra-t3": pax(1962, 110, null, {
    variants: [at({ variant: "t3m" }, { introYear: 1973 }), at({ variant: "t3prototype" }, { introYear: 1960 })],
    presets: presets(...each("variant", "t3m", "t3prototype")),
  }),
  "proc-vehicle-tatra-t6": pax(1991, 130, null, { presets: presets() }),
  "proc-vehicle-tatra-kt8": pax(1986, 230, null, { presets: presets(...each("livery", "red", "modern")) }),
  "proc-vehicle-tatra-kt4": pax(1974, 120, null, { presets: presets() }),
  "proc-vehicle-kvag-gt4": pax(1959, 100, null, { presets: presets() }),
  // the world trams (worldTramsEurope.ts, worldTramsWorld.ts, docs/models/world-trams.md): seats and standing room
  "proc-vehicle-tatra-t1": pax(1952, 95, null, { presets: presets() }),
  "proc-vehicle-tatra-t2": pax(1955, 100, null, { presets: presets() }),
  "proc-vehicle-tatra-t4": pax(1968, 105, null, { variants: [at({ unit: "trailer" }, { capacity: 110 })], presets: presets(...each("unit", "trailer")) }),
  "proc-vehicle-tatra-k2": pax(1966, 157, null, { presets: presets(...each("livery", "modern")) }),
  "proc-vehicle-tatra-t5c5": pax(1979, 116, null, { presets: presets() }),
  "proc-vehicle-skoda-14t": pax(2005, 202, null, { presets: presets() }),
  "proc-vehicle-skoda-15t": pax(2009, 210, null, { presets: presets(...each("livery", "riga")) }),
  "proc-vehicle-skoda-13t": pax(2008, 210, null, { presets: presets() }), // approx.
  "proc-vehicle-skoda-29t": pax(2015, 200, null, { presets: presets() }), // approx.
  "proc-vehicle-skoda-10t": pax(2001, 157, null, { presets: presets(...each("livery", "tacoma")) }),
  "proc-vehicle-vario-lf": pax(2004, 120, null, { presets: presets() }), // approx.
  "proc-vehicle-ganz-csmg": pax(1967, 170, null, { presets: presets() }), // approx.
  "proc-vehicle-siemens-combino": pax(1996, 180, null, { variants: [at({ length: "3" }, { capacity: 100 }), at({ length: "7" }, { capacity: 250 })], presets: presets(...each("length", "3", "7"), ...each("livery", "amsterdam", "freiburg")) }), // approx.
  "proc-vehicle-siemens-combino-supra": pax(2006, 350, null, { presets: presets() }),
  "proc-vehicle-siemens-avenio": pax(2014, 250, null, { presets: presets(...each("livery", "hague")) }), // approx.
  "proc-vehicle-siemens-ulf": pax(1997, 136, null, { variants: [at({ length: "b" }, { capacity: 207 })], presets: presets(...each("length", "b")) }),
  "proc-vehicle-vienna-e1": pax(1966, 159, null, { variants: [at({ unit: "trailer" }, { capacity: 100 })], presets: presets(...each("unit", "trailer")) }), // approx.
  "proc-vehicle-vienna-flexity": pax(2018, 211, null, { presets: presets() }),
  "proc-vehicle-duewag-gt8": pax(1956, 190, null, { presets: presets(...each("livery", "heidelberg")) }), // approx.
  "proc-vehicle-duewag-u2": pax(1968, 160, null, { presets: presets(...each("livery", "edmonton", "calgary")) }), // approx.
  "proc-vehicle-duewag-b80": pax(1973, 180, null, { presets: presets() }), // approx.
  "proc-vehicle-gotha-t2-62": pax(1962, 80, null, { variants: [at({ unit: "trailer" }, { capacity: 85 })], presets: presets(...each("unit", "trailer")) }), // approx.
  "proc-vehicle-berlin-flexity": pax(2011, 180, null, { variants: [at({ length: "long" }, { capacity: 240 })], presets: presets(...each("length", "long")) }),
  "proc-vehicle-stadler-variobahn": pax(2002, 180, null, { presets: presets(...each("livery", "graz")) }), // approx.
  "proc-vehicle-stadler-tango": pax(2009, 280, null, { presets: presets(...each("livery", "basel")) }), // approx.
  "proc-vehicle-zurich-cobra": pax(2001, 230, null, { presets: presets() }),
  "proc-vehicle-zurich-tram-2000": pax(1976, 150, null, { presets: presets() }), // approx.
  "proc-vehicle-swiss-standard-tram": pax(1940, 100, null, { presets: presets() }), // approx.
  "proc-vehicle-brussels-pcc": pax(1971, 160, null, { presets: presets() }), // approx.
  "proc-vehicle-amsterdam-9g": pax(1979, 140, null, { presets: presets() }), // approx.
  "proc-vehicle-hague-gtl8": pax(1981, 180, null, { presets: presets() }), // approx.
  "proc-vehicle-lisbon-remodelado": pax(1936, 58, null, { presets: presets() }),
  "proc-vehicle-milan-ventotto": pax(1928, 130, null, { presets: presets() }),
  "proc-vehicle-florence-sirio": pax(2002, 190, null, { presets: presets(...each("livery", "milan", "gothenburg")) }), // approx.
  "proc-vehicle-alstom-citadis": pax(2006, 300, null, { presets: presets(...each("livery", "dublin", "dubai")) }),
  "proc-vehicle-alstom-citadis-x05": pax(2016, 210, null, { presets: presets(...each("livery", "nice")) }), // approx.
  "proc-vehicle-alstom-tfs": pax(1987, 170, null, { presets: presets() }), // approx.
  "proc-vehicle-translohr": pax(2006, 127, null, { presets: presets() }),
  "proc-vehicle-caf-urbos": pax(2011, 250, null, { presets: presets(...each("livery", "belgrade", "kaohsiung")) }),
  "proc-vehicle-flexity-outlook": pax(2005, 200, null, { presets: presets(...each("livery", "marseille", "innsbruck")) }), // approx.
  "proc-vehicle-croydon-cr4000": pax(2000, 208, null, { presets: presets() }),
  "proc-vehicle-blackpool-balloon": pax(1934, 94, null, { presets: presets() }),
  "proc-vehicle-blackpool-flexity": pax(2012, 222, null, { presets: presets() }),
  "proc-vehicle-sheffield-supertram": pax(1994, 250, null, { presets: presets() }),
  "proc-vehicle-nottingham-incentro": pax(2003, 200, null, { presets: presets() }),
  "proc-vehicle-konstal-105n": pax(1973, 125, null, { presets: presets() }), // approx.
  "proc-vehicle-pesa-swing": pax(2011, 220, null, { presets: presets(...each("livery", "krakow")) }), // approx.
  "proc-vehicle-solaris-tramino": pax(2011, 220, null, { presets: presets(...each("livery", "jena")) }), // approx.
  "proc-vehicle-ktm-5": pax(1969, 129, null, { presets: presets() }),
  "proc-vehicle-lm-68": pax(1968, 120, null, { presets: presets() }), // approx.
  "proc-vehicle-vityaz-m": pax(2017, 260, null, { presets: presets() }), // approx.
  "proc-vehicle-electron-t5l64": pax(2014, 200, null, { presets: presets() }), // approx.
  "proc-vehicle-bucharest-v3a": pax(1973, 230, null, { presets: presets() }), // approx.
  "proc-vehicle-koncar-tmk2200": pax(2005, 200, null, { presets: presets() }),
  "proc-vehicle-durmazlar-silkworm": pax(2013, 280, null, { presets: presets() }), // approx.
  "proc-vehicle-helsinki-artic": pax(2013, 160, null, { presets: presets() }), // approx.
  "proc-vehicle-helsinki-valmet": pax(1973, 130, null, { presets: presets() }), // approx.
  "proc-vehicle-oslo-sl79": pax(1982, 170, null, { presets: presets() }), // approx.
  "proc-vehicle-gothenburg-m29": pax(1969, 100, null, { presets: presets() }), // approx.
  "proc-vehicle-pcc-streamliner": pax(1936, 100, null, { presets: presets(...each("livery", "toronto", "philadelphia")) }),
  "proc-vehicle-toronto-clrv": pax(1979, 132, null, { presets: presets() }),
  "proc-vehicle-toronto-flexity": pax(2014, 251, null, { presets: presets() }),
  "proc-vehicle-birney-safety-car": pax(1916, 40, null, { presets: presets() }), // approx.
  "proc-vehicle-new-orleans-perley-thomas": pax(1923, 100, null, { presets: presets() }), // approx.
  "proc-vehicle-boston-type-8": pax(1999, 165, null, { presets: presets() }), // approx.
  "proc-vehicle-siemens-s70": pax(2003, 220, null, { presets: presets(...each("livery", "sandiego", "portland")) }), // approx.
  "proc-vehicle-kinki-sharyo-lrv": pax(1996, 180, null, { presets: presets(...each("livery", "phoenix")) }), // approx.
  "proc-vehicle-brookville-liberty": pax(2016, 150, null, { presets: presets(...each("livery", "milwaukee")) }), // approx.
  "proc-vehicle-philadelphia-kawasaki": pax(1981, 100, null, { presets: presets() }), // approx.
  "proc-vehicle-rio-bonde": pax(1896, 32, null, { presets: presets() }), // approx.
  "proc-vehicle-buenos-aires-premetro": pax(1987, 120, null, { presets: presets() }), // approx.
  "proc-vehicle-hong-kong-tram": pax(1949, 115, null, { presets: presets(...each("livery", "advertising")) }),
  "proc-vehicle-hiroshima-green-mover": pax(2005, 150, null, { presets: presets() }),
  "proc-vehicle-toei-9000": pax(2007, 62, null, { presets: presets() }), // approx.
  "proc-vehicle-toyama-portram": pax(2006, 80, null, { presets: presets(...each("livery", "green", "blue")) }),
  "proc-vehicle-tokyu-300": pax(1999, 120, null, { presets: presets(...each("livery", "red", "green")) }), // approx.
  "proc-vehicle-kolkata-tram": pax(1940, 200, null, { presets: presets() }), // approx.
  "proc-vehicle-dalian-tram": pax(1936, 90, null, { presets: presets() }), // approx.
  "proc-vehicle-foshan-hydrogen": pax(2019, 250, null, { presets: presets() }), // approx.
  "proc-vehicle-alexandria-double-deck": pax(1995, 200, null, { presets: presets() }), // approx.
  "proc-vehicle-addis-ababa-lrt": pax(2015, 254, null, { presets: presets() }),
  "proc-vehicle-melbourne-w-class": pax(1923, 80, null, { presets: presets(...each("livery", "maroon")) }), // approx.
  "proc-vehicle-melbourne-b-class": pax(1984, 180, null, { presets: presets() }), // approx.
  "proc-vehicle-melbourne-e-class": pax(2013, 210, null, { presets: presets() }),
  "proc-vehicle-glenelg-h-class": pax(1929, 110, null, { presets: presets() }), // approx.
  "proc-vehicle-sydney-r-class": pax(1933, 110, null, { presets: presets() }), // approx.
  "proc-vehicle-christchurch-boon": pax(1906, 50, null, { presets: presets() }), // approx.
  "proc-vehicle-horse-tram": pax(1880, 40, null, { presets: presets() }), // approx.
  "proc-vehicle-steam-tram": pax(1885, 60, null, { presets: presets(...each("unit", "trailer")) }), // approx.: the engine's preset stands for engine and trailer
  "proc-vehicle-cable-car-dunedin": pax(1881, 50, null, { presets: presets() }), // approx.
  "proc-vehicle-istanbul-nostalgic": pax(1914, 50, null, { presets: presets() }), // approx.
  "proc-vehicle-trieste-opicina": pax(1935, 90, null, { presets: presets() }), // approx.
  "proc-vehicle-budapest-ganz-uv": pax(1956, 105, null, { presets: presets() }), // approx.
  "proc-vehicle-wroclaw-skoda-16t": pax(2006, 200, null, { presets: presets() }), // approx.
  "proc-vehicle-strasbourg-eurotram": pax(1994, 210, null, { presets: presets() }), // approx.
  "proc-vehicle-montpellier-citadis": pax(2000, 220, null, { presets: presets(...each("livery", "line2")) }), // approx.
  "proc-vehicle-gmunden-vario": pax(2014, 170, null, { presets: presets() }), // approx.
  "proc-vehicle-sarajevo-k2yu": pax(1973, 157, null, { presets: presets() }),
  "proc-vehicle-turin-2800": pax(1958, 150, null, { presets: presets() }), // approx.
  "proc-vehicle-dubai-citadis": pax(2014, 300, null, { presets: presets() }),
  // (end of the world trams)

  // --- buses -----------------------------------------------------------------------
  "proc-vehicle-karosa-short": pax(1981, 90, null, {
    variants: [
      at({ variant: "b732" }, { introYear: 1982 }), at({ variant: "c734" }, { capacity: 50 }), at({ variant: "lc735" }, { introYear: 1983, capacity: 47 }),
      at({ variant: "b931" }, { introYear: 1996 }), at({ variant: "b931e" }, { introYear: 1999 }), at({ variant: "b951e" }, { introYear: 2002 }),
    ],
    presets: presets(...each("variant", "b732", "c734", "lc735", "b931", "b951e")),
  }),
  "proc-vehicle-karosa-long": pax(1991, 140, null, {
    variants: [at({ variant: "b941" }, { introYear: 1997 }), at({ variant: "b941e" }, { introYear: 2000 }), at({ variant: "b961" }, { introYear: 2003, capacity: 150 })],
    presets: presets(...each("variant", "b941", "b961")),
  }),
  "proc-vehicle-karosa-renault-citybus-12m": pax(1996, 100, null, { presets: presets() }),
  "proc-vehicle-karosa-renault-citybus-18m": pax(2001, 150, null, { presets: presets() }),
  "proc-vehicle-mb-citaro": pax(1997, 100, null, { presets: presets() }),
  "proc-vehicle-mb-citaro-blue": pax(1997, 100, null, { presets: presets() }),
  "proc-vehicle-mb-o345-g": pax(1994, 140, null, { presets: presets() }),
  "proc-vehicle-solaris-urbino-15": pax(1999, 130, null, { presets: presets() }),
  "proc-vehicle-bus-1": pax(1990, 80, null, { presets: presets() }), // approx.
  // the world buses, first batch (worldBuses.ts, docs/models/world-buses.md): seats and standing room
  "proc-vehicle-new-routemaster": pax(2012, 87, null, { presets: presets() }),
  "proc-vehicle-adl-enviro200": pax(2006, 70, null, { presets: presets() }), // approx.
  "proc-vehicle-adl-enviro400": pax(2005, 87, null, { presets: presets(...each("livery", "stagecoach")) }), // approx.
  "proc-vehicle-adl-enviro500": pax(2002, 130, null, { presets: presets(...each("livery", "mta")) }), // approx.
  "proc-vehicle-leyland-national": pax(1972, 80, null, { presets: presets() }), // approx.
  "proc-vehicle-mb-o305": pax(1967, 100, null, { presets: presets() }), // approx.
  "proc-vehicle-mb-o405": pax(1984, 100, null, { variants: [at({ length: "articulated" }, { introYear: 1985, capacity: 150 })], presets: presets(...each("length", "articulated")) }), // approx.
  "proc-vehicle-mb-ecitaro": pax(2018, 88, null, { presets: presets() }),
  "proc-vehicle-man-lions-city": pax(2018, 90, null, { variants: [at({ length: "18" }, { capacity: 140 })], presets: presets(...each("length", "18")) }), // approx.
  "proc-vehicle-mb-tourismo": pax(1994, 53, null, { presets: presets() }),
  "proc-vehicle-setra-s515": pax(2012, 53, null, { presets: presets() }),
  "proc-vehicle-neoplan-skyliner": pax(2004, 83, null, { presets: presets() }),
  "proc-vehicle-volvo-7900e": pax(2018, 85, null, { presets: presets() }), // approx.
  "proc-vehicle-scania-citywide": pax(2011, 95, null, { presets: presets() }), // approx.
  "proc-vehicle-van-hool-exquicity": pax(2011, 120, null, { presets: presets() }), // approx.
  "proc-vehicle-skoda-14tr": pax(1982, 90, null, { presets: presets() }), // approx.
  "proc-vehicle-skoda-15tr": pax(1988, 160, null, { presets: presets() }), // approx.
  "proc-vehicle-ikarus-260": pax(1971, 100, null, { presets: presets(...each("livery", "bkv")) }), // approx.
  "proc-vehicle-ikarus-280": pax(1973, 160, null, { presets: presets(...each("livery", "bkv")) }), // approx.
  "proc-vehicle-solaris-trollino": pax(2001, 150, null, { presets: presets() }), // approx.
  "proc-vehicle-gillig-low-floor": pax(1997, 75, null, { presets: presets() }), // approx.
  "proc-vehicle-new-flyer-xcelsior": pax(2008, 80, null, { variants: [at({ length: "60" }, { capacity: 120 })], presets: presets(...each("length", "60")) }), // approx.
  "proc-vehicle-mci-d4505": pax(2001, 57, null, { presets: presets() }),
  "proc-vehicle-byd-k9": pax(2010, 80, null, { presets: presets() }), // approx.
  "proc-vehicle-hyundai-universe": pax(2006, 45, null, { presets: presets() }), // approx.
  // the world buses, later batches (worldBuses2.ts, docs/models/world-buses-2.md): seats and standing room
  "proc-vehicle-leyland-atlantean": pax(1958, 78, null, { presets: presets(...each("livery", "glasgow")) }),
  "proc-vehicle-bristol-lodekka": pax(1949, 60, null, { presets: presets(...each("livery", "eastern")) }),
  "proc-vehicle-plaxton-panorama": pax(1968, 49, null, { presets: presets(...each("livery", "national")) }), // approx.
  "proc-vehicle-mb-o302": pax(1965, 50, null, { presets: presets(...each("livery", "touring")) }), // approx.
  "proc-vehicle-man-sl200": pax(1973, 100, null, { presets: presets(...each("livery", "mvg")) }), // approx.
  "proc-vehicle-neoplan-cityliner": pax(1971, 49, null, { presets: presets() }), // approx.
  "proc-vehicle-bussing-d2u": pax(1951, 100, null, { presets: presets() }), // approx.
  "proc-vehicle-cobus-3000": pax(1999, 110, null, { presets: presets(...each("livery", "fraport")) }),
  "proc-vehicle-volvo-9700": pax(2001, 55, null, { presets: presets(...each("livery", "flixbus")) }), // approx.
  "proc-vehicle-van-hool-a330": pax(1995, 100, null, { presets: presets(...each("livery", "stib")) }), // approx.
  "proc-vehicle-van-hool-astromega": pax(2010, 80, null, { presets: presets(...each("livery", "megabus")) }), // approx.
  "proc-vehicle-vdl-citea": pax(2009, 95, null, { presets: presets(...each("livery", "connexxion")) }), // approx.
  "proc-vehicle-irisbus-citelis": pax(2005, 100, null, { presets: presets(...each("livery", "atm")) }), // approx.
  "proc-vehicle-heuliez-gx337": pax(2013, 100, null, { presets: presets(...each("livery", "tcl")) }), // approx.
  "proc-vehicle-renault-pr100": pax(1971, 100, null, { presets: presets(...each("livery", "tcl")) }), // approx.
  "proc-vehicle-iveco-crossway": pax(2006, 60, null, { presets: presets(...each("livery", "postbus")) }), // approx.
  "proc-vehicle-irizar-i8": pax(2014, 55, null, { presets: presets(...each("livery", "alsa")) }), // approx.
  "proc-vehicle-solaris-urbino-12e": pax(2013, 90, null, { presets: presets(...each("livery", "bvg")) }), // approx.
  "proc-vehicle-karosa-sm11": pax(1964, 100, null, { presets: presets(...each("livery", "csad")) }), // approx.
  "proc-vehicle-sor-nb12": pax(2010, 100, null, { presets: presets(...each("livery", "dpmb")) }), // approx.
  "proc-vehicle-ikarus-55": pax(1953, 41, null, { presets: presets() }), // approx.
  "proc-vehicle-laz-695": pax(1956, 67, null, { presets: presets() }), // approx.
  "proc-vehicle-liaz-677": pax(1967, 110, null, { presets: presets() }),
  "proc-vehicle-liaz-5292": pax(2004, 108, null, { presets: presets() }), // approx.
  "proc-vehicle-ziu-9": pax(1972, 120, null, { presets: presets() }), // approx.
  // (worldBuses3.ts) the bonneted buses, minibuses and historic types
  "proc-vehicle-aec-routemaster": pax(1956, 64, null, { presets: presets(...each("livery", "greenLine")) }),
  "proc-vehicle-mb-o3500": pax(1949, 40, null, { presets: presets() }), // approx.
  "proc-vehicle-magirus-saturn": pax(1956, 45, null, { presets: presets() }), // approx.
  "proc-vehicle-vw-t1-samba": pax(1951, 8, null, { presets: presets(...each("colour", "blue", "green")) }),
  "proc-vehicle-chausson-aph": pax(1950, 60, null, { presets: presets() }), // approx.
  "proc-vehicle-jelcz-043": pax(1964, 45, null, { presets: presets() }), // approx.
  "proc-vehicle-skoda-706-rto": pax(1958, 41, null, { presets: presets(...each("livery", "cedok")) }), // approx.
  "proc-vehicle-paz-672": pax(1967, 45, null, { presets: presets() }), // approx.
  "proc-vehicle-saurer-postbus": pax(1959, 37, null, { presets: presets() }), // approx.
  "proc-vehicle-gm-new-look": pax(1959, 70, null, { presets: presets(...each("livery", "nycta")) }), // approx.
  "proc-vehicle-gm-scenicruiser": pax(1954, 43, null, { presets: presets() }),
  "proc-vehicle-flxible-clipper": pax(1937, 29, null, { presets: presets() }), // approx.
  "proc-vehicle-blue-bird-vision": pax(2003, 72, null, { presets: presets() }),
  "proc-vehicle-thomas-saf-t-liner": pax(2004, 77, null, { presets: presets() }),
  "proc-vehicle-chicken-bus": pax(1990, 70, null, { presets: presets(...each("colour", "blue", "green")) }), // approx.
  "proc-vehicle-toyota-coaster": pax(1969, 29, null, { presets: presets(...each("colour", "blue")) }),
  "proc-vehicle-jeepney": pax(1950, 18, null, { presets: presets(...each("colour", "blue", "yellow")) }), // approx.
  "proc-vehicle-songthaew": pax(1980, 12, null, { presets: presets(...each("colour", "blue", "yellow")) }), // approx.
  "proc-vehicle-jingle-bus": pax(1970, 60, null, { presets: presets(...each("colour", "green")) }), // approx.
  "proc-vehicle-matatu": pax(2000, 14, null, { presets: presets(...each("colour", "red")) }),
  "proc-vehicle-danfo": pax(1990, 14, null, { presets: presets() }), // approx.
  "proc-vehicle-mb-sprinter-minibus": pax(2006, 20, null, { presets: presets(...each("colour", "yellow")) }), // approx.
  "proc-vehicle-tatra-500-hb": pax(1953, 45, null, { presets: presets() }), // approx.
  "proc-vehicle-otokar-kent": pax(2008, 100, null, { presets: presets(...each("livery", "eshot")) }), // approx.
  "proc-vehicle-buenos-aires-colectivo": pax(1990, 60, null, { presets: presets(...each("colour", "blue")) }), // approx.
  // (worldBuses4.ts) the Americas, Asia, Africa and Oceania; the camello's trailer is the load
  "proc-vehicle-hess-lightram": pax(2003, 210, null, { presets: presets() }), // approx.
  "proc-vehicle-nova-lfs": pax(1996, 75, null, { presets: presets(...each("livery", "ttc")) }), // approx.
  "proc-vehicle-proterra-catalyst": pax(2014, 77, null, { presets: presets(...each("livery", "kingCounty")) }), // approx.
  "proc-vehicle-marcopolo-paradiso-dd": pax(2009, 66, null, { presets: presets(...each("livery", "itapemirim")) }), // approx.
  "proc-vehicle-marcopolo-torino": pax(2007, 80, null, { presets: presets(...each("livery", "urbs")) }), // approx.
  "proc-vehicle-curitiba-biarticulado": pax(1992, 270, null, { presets: presets() }),
  "proc-vehicle-transmilenio": pax(2000, 160, null, { presets: presets() }),
  "proc-vehicle-havana-camello": pax(1995, 300, null, { presets: presets() }), // approx.
  "proc-vehicle-hino-blue-ribbon": pax(1982, 77, null, { presets: presets(...each("livery", "yokohama")) }), // approx.
  "proc-vehicle-isuzu-erga": pax(2000, 77, null, { presets: presets(...each("livery", "kyoto")) }), // approx.
  "proc-vehicle-fuso-aero-queen": pax(1982, 55, null, { presets: presets(...each("livery", "nishitetsu")) }), // approx.
  "proc-vehicle-hyundai-elec-city": pax(2017, 70, null, { presets: presets(...each("colour", "green")) }), // approx.
  "proc-vehicle-daewoo-bs106": pax(1991, 70, null, { presets: presets(...each("colour", "green")) }), // approx.
  "proc-vehicle-yutong-e12": pax(2016, 80, null, { presets: presets(...each("colour", "green")) }), // approx.
  "proc-vehicle-king-long-coach": pax(2010, 53, null, { presets: presets(...each("colour", "red")) }), // approx.
  "proc-vehicle-dennis-trident-hk": pax(1997, 130, null, { presets: presets(...each("livery", "citybus")) }), // approx.
  "proc-vehicle-singapore-double-deck": pax(2015, 131, null, { presets: presets() }),
  "proc-vehicle-ashok-leyland-viking": pax(1980, 70, null, { presets: presets(...each("livery", "dtc")) }), // approx.
  "proc-vehicle-tata-starbus": pax(2007, 70, null, { presets: presets(...each("livery", "best")) }), // approx.
  "proc-vehicle-cairo-cta-bus": pax(2009, 90, null, { presets: presets() }), // approx.
  "proc-vehicle-za-rea-vaya": pax(2009, 112, null, { presets: presets() }), // approx.
  "proc-vehicle-volgren-optimus": pax(2010, 80, null, { presets: presets(...each("livery", "translink")) }), // approx.
  "proc-vehicle-designline-olymbus": pax(2004, 70, null, { presets: presets(...each("livery", "metro")) }), // approx.
  "proc-vehicle-sydney-leyland-atlantean": pax(1970, 85, null, { presets: presets() }), // approx.
  "proc-vehicle-kyiv-12": pax(1993, 165, null, { presets: presets() }), // approx.

  // --- trucks ----------------------------------------------------------------------
  "proc-vehicle-american-truck": truck(1980, 25, "GOOD", ["piece", "covered", "express"], { presets: presets() }), // approx.
  "proc-vehicle-cistern-semi-truck": truck(1990, 30, "OIL_", ["liquid"], { presets: presets() }), // approx.
  "proc-vehicle-mixer-truck": truck(1985, 10, "GOOD", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-reefer-semi-truck": truck(1995, 25, "GOOD", ["piece", "refrigerated"], { presets: presets() }), // approx.
  "proc-vehicle-tatra-815-tipper": truck(1983, 15, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-praga-rv": truck(1935, 2, "GOOD", ["piece", "express"], { presets: presets() }),
  "proc-vehicle-mercedes-atego-1224": truck(1998, 6, "GOOD", ["piece", "covered", "express"], { presets: presets() }),
  // the world trucks (worldTrucks.ts, docs/models/world-trucks.md): payload in tonnes (a tank's in
  // kilolitres); cargo and refits follow the body - a tanker OIL_, a tipper bulk, a log truck WOOD, a
  // flatbed or low loader STEL; fire engines, the crane and the sweeper carry nothing
  "proc-vehicle-scania-r": truck(2004, 25, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 30 })], presets: presets(...each("body", "box", "tank")) }),
  "proc-vehicle-scania-s-v8": truck(2016, 25, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "reefer" }, { refitClasses: ["piece", "refrigerated"] })], presets: presets(...each("body", "reefer")) }),
  "proc-vehicle-scania-lb141": truck(1976, 22, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 26 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-volvo-fh16": truck(1993, 45, "STEL", ["piece"], { variants: [at({ body: "curtain" }, { cargo: "GOOD", refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "curtain")) }),
  "proc-vehicle-volvo-f88": truck(1965, 18, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 22 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-volvo-fmx-tipper": truck(2010, 18, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-mb-actros": truck(2018, 25, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("body", "box")) }),
  "proc-vehicle-mb-arocs": truck(2013, 15, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-mb-unimog": truck(2013, 5, "STEL", ["piece"], { variants: [at({ body: "plough" }, { cargo: "GOOD", refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "plough")) }),
  "proc-vehicle-mb-kurzhauber": truck(1959, 5, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tipper" }, { cargo: "COAL", refitClasses: ["bulk"] })], presets: presets(...each("body", "tipper")) }),
  "proc-vehicle-mb-ng": truck(1973, 22, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 26 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-man-f8": truck(1967, 22, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-man-tgl": truck(2005, 5, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("body", "curtain")) }),
  "proc-vehicle-daf-xf": truck(2017, 25, "GOOD", ["piece", "express"], { variants: [at({ body: "curtain" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "curtain")) }),
  "proc-vehicle-daf-2600": truck(1962, 15, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 18 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-daf-cf-refuse": truck(2001, 10, "GOOD", ["piece"], { presets: presets(...each("livery", "green")) }),
  "proc-vehicle-iveco-s-way": truck(2019, 25, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 30 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-iveco-turbostar": truck(1984, 24, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("body", "curtain")) }),
  "proc-vehicle-iveco-daily": truck(1978, 1, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-fiat-682": truck(1952, 9, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 11 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-renault-t": truck(2013, 25, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("body", "box")) }),
  "proc-vehicle-renault-magnum": truck(1990, 24, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "reefer" }, { refitClasses: ["piece", "refrigerated"] })], presets: presets(...each("body", "reefer")) }),
  "proc-vehicle-berliet-t100": truck(1957, 50, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-citroen-h-van": truck(1947, 1, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("colour", "red", "blue")) }),
  "proc-vehicle-pegaso-comet": truck(1964, 8, "GOOD", ["piece", "bulk"], { variants: [at({ body: "box" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "box")) }),
  "proc-vehicle-tatra-148": truck(1969, 14, "COAL", ["bulk"], { variants: [at({ body: "dropside" }, { cargo: "GOOD", refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-tatra-815": truck(1983, 20, "COAL", ["bulk"], { variants: [at({ body: "crane" }, { cargo: "GOOD", refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "crane")) }),
  "proc-vehicle-tatra-phoenix": truck(2011, 18, "COAL", ["bulk"], { variants: [at({ body: "mixer" }, { cargo: "GOOD", refitClasses: ["piece"] })], presets: presets(...each("body", "mixer")) }),
  "proc-vehicle-avia-a31": truck(1968, 3, "GOOD", ["piece", "bulk"], { variants: [at({ body: "box" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "box")) }),
  "proc-vehicle-liaz-100": truck(1974, 22, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 26 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-praga-v3s": truck(1953, 5, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-skoda-706-rt": truck(1957, 15, "GOOD", ["piece", "bulk"], { variants: [at({ body: "box" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "box")) }),
  "proc-vehicle-star-266": truck(1973, 4, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-csepel-d450": truck(1960, 5, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tipper" }, { cargo: "COAL", refitClasses: ["bulk"] })], presets: presets(...each("body", "tipper")) }),
  "proc-vehicle-kamaz-5320": truck(1976, 8, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-kamaz-54901": truck(2019, 25, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 30 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-zil-130": truck(1964, 6, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tanker" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 7 })], presets: presets(...each("body", "tanker")) }),
  "proc-vehicle-gaz-51": truck(1946, 3, "GOOD", ["piece", "bulk"], { presets: presets() }),
  "proc-vehicle-gaz-66": truck(1964, 2, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-maz-500": truck(1965, 8, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tipper" }, { cargo: "COAL", refitClasses: ["bulk"] })], presets: presets(...each("body", "tipper")) }),
  "proc-vehicle-belaz-75710": truck(2013, 450, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-kraz-255": truck(1967, 7, "GOOD", ["piece", "bulk"], { variants: [at({ body: "canvas" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "canvas")) }),
  "proc-vehicle-ural-4320": truck(1977, 6, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-bedford-tk": truck(1960, 5, "GOOD", ["piece", "bulk"], { variants: [at({ body: "box" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "box")) }),
  "proc-vehicle-aec-mammoth-major": truck(1948, 15, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tanker" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 18 })], presets: presets(...each("body", "tanker")) }),
  "proc-vehicle-scammell-contractor": truck(1964, 100, "STEL", ["piece"], { presets: presets() }),
  "proc-vehicle-ford-transit-mk1": truck(1965, 1, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("colour", "red", "blue")) }),
  "proc-vehicle-dennis-fire-engine": truck(1995, 0, "GOOD", [], { presets: presets() }),
  "proc-vehicle-magirus-ladder": truck(2010, 0, "GOOD", [], { presets: presets() }),
  "proc-vehicle-rosenbauer-panther": truck(2005, 0, "GOOD", [], { presets: presets() }),
  "proc-vehicle-liebherr-ltm": truck(2010, 0, "GOOD", [], { presets: presets() }),
  "proc-vehicle-lohr-car-transporter": truck(2010, 12, "GOOD", ["piece", "express"], { presets: presets(...each("load", "empty")) }),
  "proc-vehicle-peterbilt-379": truck(1987, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "flatbed" }, { cargo: "STEL", refitClasses: ["piece"] })], presets: presets(...each("body", "flatbed")) }),
  "proc-vehicle-peterbilt-579": truck(2012, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "reefer" }, { refitClasses: ["piece", "refrigerated"] })], presets: presets(...each("body", "reefer")) }),
  "proc-vehicle-kenworth-w900": truck(1961, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 24 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-kenworth-t680": truck(2013, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "flatbed" }, { cargo: "STEL", refitClasses: ["piece"] })], presets: presets(...each("body", "flatbed")) }),
  "proc-vehicle-kenworth-k100": truck(1960, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 24 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-kenworth-c500-log": truck(1970, 30, "WOOD", ["piece"], { presets: presets() }),
  "proc-vehicle-kenworth-t909-road-train": truck(2009, 75, "COAL", ["bulk"], { variants: [at({ load: "3" }, { capacity: 113 })], presets: presets(...each("load", "3")) }),
  "proc-vehicle-freightliner-cascadia": truck(2007, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "reefer" }, { refitClasses: ["piece", "refrigerated"] })], presets: presets(...each("body", "reefer")) }),
  "proc-vehicle-mack-b61": truck(1953, 15, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 18 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-mack-anthem": truck(2018, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 24 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-mack-granite-dump": truck(2002, 14, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-international-transtar": truck(1968, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 24 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-international-acco": truck(1965, 10, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tipper" }, { cargo: "COAL", refitClasses: ["bulk"] })], presets: presets(...each("body", "tipper")) }),
  "proc-vehicle-western-star-4900": truck(1990, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "flatbed" }, { cargo: "STEL", refitClasses: ["piece"] })], presets: presets(...each("body", "flatbed")) }),
  "proc-vehicle-volvo-vnl": truck(2018, 20, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "reefer" }, { refitClasses: ["piece", "refrigerated"] })], presets: presets(...each("body", "reefer")) }),
  "proc-vehicle-tesla-semi": truck(2022, 19, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "reefer" }, { refitClasses: ["piece", "refrigerated"] })], presets: presets(...each("body", "reefer")) }),
  "proc-vehicle-ford-model-tt": truck(1917, 1, "GOOD", ["piece", "bulk"], { variants: [at({ body: "box" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "box")) }),
  "proc-vehicle-white-3000": truck(1949, 13, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 16 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-autocar-acx-refuse": truck(2005, 12, "GOOD", ["piece"], { presets: presets() }),
  "proc-vehicle-pierce-arrow-xt": truck(2010, 0, "GOOD", [], { presets: presets() }),
  "proc-vehicle-american-lafrance": truck(1947, 0, "GOOD", [], { presets: presets() }),
  "proc-vehicle-cat-797": truck(2009, 363, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-mb-l1113": truck(1969, 7, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tanker" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 8 })], presets: presets(...each("body", "tanker")) }),
  "proc-vehicle-vw-constellation": truck(2005, 15, "GOOD", ["piece", "bulk"], { variants: [at({ body: "tipper" }, { cargo: "COAL", refitClasses: ["bulk"] })], presets: presets(...each("body", "tipper")) }),
  "proc-vehicle-scania-111": truck(1976, 22, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 26 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-ford-cargo": truck(1981, 9, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-hino-300": truck(1999, 3, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-hino-profia": truck(1992, 13, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tipper" }, { cargo: "COAL", refitClasses: ["bulk"] })], presets: presets(...each("body", "tipper")) }),
  "proc-vehicle-isuzu-elf": truck(1959, 3, "GOOD", ["piece", "bulk"], { variants: [at({ body: "box" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "box")) }),
  "proc-vehicle-isuzu-giga": truck(1994, 13, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tipper" }, { cargo: "COAL", refitClasses: ["bulk"] })], presets: presets(...each("body", "tipper")) }),
  "proc-vehicle-fuso-canter": truck(1963, 3, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-fuso-super-great": truck(1996, 22, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 26 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-ud-quon": truck(2004, 13, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "mixer" }, { refitClasses: ["piece"] })], presets: presets(...each("body", "mixer")) }),
  "proc-vehicle-kei-truck": truck(1961, 1, "GOOD", ["piece", "bulk"], { presets: presets(...each("colour", "silver", "red", "green")) }),
  "proc-vehicle-dekotora": truck(1975, 13, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("colour", "blue", "pink")) }),
  "proc-vehicle-hyundai-xcient": truck(2013, 25, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("variant", "fuelCell")) }),
  "proc-vehicle-tata-lpt": truck(1980, 10, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("colour", "blue", "green")) }),
  "proc-vehicle-ashok-leyland-captain": truck(2010, 18, "COAL", ["bulk"], { variants: [at({ body: "dropside" }, { cargo: "GOOD", refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-pakistani-truck-art": truck(1970, 10, "GOOD", ["piece", "covered", "express"], { presets: presets(...each("colour", "green", "blue")) }),
  "proc-vehicle-faw-jiefang-ca10": truck(1956, 4, "GOOD", ["piece", "bulk"], { variants: [at({ body: "canvas" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "canvas")) }),
  "proc-vehicle-faw-j7": truck(2018, 30, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 36 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-dongfeng-eq140": truck(1978, 5, "GOOD", ["piece", "bulk"], { variants: [at({ body: "canvas" }, { refitClasses: ["piece", "covered", "express"] })], presets: presets(...each("body", "canvas")) }),
  "proc-vehicle-sinotruk-howo": truck(2007, 30, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "tank" }, { cargo: "OIL_", refitClasses: ["liquid"], capacity: 36 })], presets: presets(...each("body", "tank")) }),
  "proc-vehicle-shacman-x3000": truck(2012, 20, "COAL", ["bulk"], { variants: [at({ body: "mixer" }, { cargo: "GOOD", refitClasses: ["piece"] })], presets: presets(...each("body", "mixer")) }),
  "proc-vehicle-mb-zetros": truck(2008, 8, "GOOD", ["piece", "covered", "express"], { variants: [at({ body: "dropside" }, { refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-bell-b60e": truck(2017, 55, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-man-cla": truck(2006, 18, "COAL", ["bulk"], { variants: [at({ body: "dropside" }, { cargo: "GOOD", refitClasses: ["piece", "bulk"] })], presets: presets(...each("body", "dropside")) }),
  "proc-vehicle-mb-econic": truck(1998, 10, "GOOD", ["piece"], { variants: [at({ body: "sweeper" }, { refitClasses: [], capacity: 0 })], presets: presets(...each("body", "sweeper")) }),

  // --- aircraft --------------------------------------------------------------------
  "proc-vehicle-mcdonnell-douglas-md11": pax(1990, 290, null, {
    variants: [at({ livery: "fedex" }, { capacity: 90, cargo: "GOOD", refitClasses: ["piece", "express"] })],
    presets: presets(...each("livery", "klm", "swissair", "fedex")),
  }),
  "proc-vehicle-boeing-747": pax(1989, 416, null, { presets: presets(...each("livery", "britishAirways", "lufthansa", "klm")) }),
  "proc-vehicle-airbus-beluga": truck(1995, 47, "GOOD", ["piece", "express"], { presets: presets() }),
  "proc-vehicle-aero-a10": pax(1922, 4, null, { presets: presets() }),
  "proc-vehicle-airbus-a380": pax(2007, 555, null, { presets: presets(...each("livery", "emirates", "singapore", "qantas", "lufthansa", "britishAirways")) }),
  "proc-vehicle-boeing-737": pax(1998, 189, null, { presets: presets(...each("livery", "ryanair", "southwest", "united", "klm", "turkish")) }),
  "proc-vehicle-light-jet": pax(2000, 7, null, { presets: presets() }), // approx.
  "proc-vehicle-small-airplane": pax(1960, 3, null, { presets: presets(...each("color", "red", "yellow", "green")) }), // approx.
  // the world aircraft (worldJets.ts, worldProps.ts, worldRotorcraft.ts; docs/models/world-aircraft.md):
  // typical seats (a freighter's payload in tonnes); presets of every other livery and variant
  ...worldAircraftTable(),

  // --- ships -----------------------------------------------------------------------
  "proc-vehicle-ocean-liner": pax(1930, 2000, null, { presets: presets() }), // approx.
  "proc-vehicle-cruise-ferry": pax(1990, 2000, null, { presets: presets() }), // approx.
  "proc-vehicle-hydrofoil-ferry": pax(1960, 150, null, { presets: presets() }), // approx.
  "proc-vehicle-passenger-ferry": pax(1950, 300, null, { presets: presets() }), // approx.
  // --- the world ships (worldShips*.ts, docs/models/world-ships.md) -------------------
  // Capacity in the cargo's units (TEU as crates of goods, tonnes, kilolitres, seats),
  // capped at the GRF's word (65,535): the largest ships carry more than it holds.
  // A car carrier carries GOOD: no default climate has VEHI (FIRS's refits take it as piece goods).
  // cargo ships
  "proc-vehicle-ship-triple-e": truck(2013, 18_340, "GOOD", ["piece", "express"], { presets: presets(...each("load", "empty")) }),
  "proc-vehicle-ship-emma-maersk": truck(2006, 15_500, "GOOD", ["piece", "express"], { presets: presets() }),
  "proc-vehicle-ship-msc-gulsun": truck(2019, 23_756, "GOOD", ["piece", "express"], { presets: presets() }),
  "proc-vehicle-ship-panamax-container": truck(1990, 4_500, "GOOD", ["piece", "express"], { presets: presets(...each("livery", "green", "blue")) }), // approx.
  "proc-vehicle-ship-feeder-container": truck(2000, 1_100, "GOOD", ["piece", "express"], { presets: presets() }), // approx.
  "proc-vehicle-ship-ideal-x": truck(1956, 58, "GOOD", ["piece", "express"], { presets: presets() }),
  "proc-vehicle-ship-vlcc": truck(2002, 65_535, "OIL_", ["liquid"], { presets: presets(...each("livery", "green", "black")) }),
  "proc-vehicle-ship-seawise-giant": truck(1979, 65_535, "OIL_", ["liquid"], { presets: presets() }),
  "proc-vehicle-ship-aframax": truck(1990, 65_535, "OIL_", ["liquid"], { presets: presets(...each("livery", "navy")) }), // approx.
  "proc-vehicle-ship-product-tanker": truck(2005, 50_000, "OIL_", ["liquid"], { presets: presets(...each("livery", "navy")) }), // approx.
  "proc-vehicle-ship-lng-moss": truck(1975, 65_535, "OIL_", ["liquid"], { presets: presets() }), // approx.
  "proc-vehicle-ship-lng-qmax": truck(2008, 65_535, "OIL_", ["liquid"], { presets: presets() }),
  "proc-vehicle-ship-lpg-carrier": truck(2010, 8_000, "OIL_", ["liquid"], { presets: presets() }), // approx.
  "proc-vehicle-ship-chemical-tanker": truck(2010, 45_000, "OIL_", ["liquid", "hazardous"], { presets: presets(...each("livery", "navy")) }), // approx.
  "proc-vehicle-ship-capesize": truck(2010, 65_535, "COAL", ["bulk"], { variants: [at({ livery: "red" }, { cargo: "IORE" })], presets: presets(...each("livery", "red")) }), // approx.
  "proc-vehicle-ship-valemax": truck(2011, 65_535, "IORE", ["bulk"], { presets: presets() }),
  "proc-vehicle-ship-handysize": truck(2010, 35_000, "GRAI", ["bulk", "piece"], { presets: presets(...each("livery", "black")) }), // approx.
  "proc-vehicle-ship-laker": truck(1958, 26_000, "IORE", ["bulk"], { presets: presets(...each("livery", "black")) }), // approx.
  "proc-vehicle-ship-self-unloader": truck(1981, 65_535, "COAL", ["bulk"], { presets: presets() }), // approx.
  "proc-vehicle-ship-pctc": truck(2016, 8_000, "GOOD", ["piece"], { presets: presets(...each("livery", "white")) }), // approx.
  "proc-vehicle-ship-roro": truck(2000, 12_000, "GOOD", ["piece", "express"], { presets: presets(...each("livery", "blue")) }), // approx.
  "proc-vehicle-ship-heavy-lift": truck(2018, 65_535, "GOOD", ["piece"], { presets: presets() }),
  "proc-vehicle-ship-reefer": truck(1990, 9_000, "FOOD", ["refrigerated", "piece"], { presets: presets(...each("livery", "blue")) }), // approx.
  "proc-vehicle-ship-liberty": truck(1941, 10_850, "GOOD", ["piece", "bulk"], { presets: presets() }),
  "proc-vehicle-ship-victory": truck(1944, 10_600, "GOOD", ["piece", "bulk"], { presets: presets() }),
  "proc-vehicle-ship-europaschiff": truck(1960, 1_350, "GOOD", ["piece", "bulk"], { presets: presets(...each("load", "empty")) }),
  "proc-vehicle-ship-rhine-tanker": truck(2000, 3_000, "OIL_", ["liquid"], { presets: presets() }), // approx.
  "proc-vehicle-ship-push-barge": truck(1970, 2_800, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-ship-yangtze-cargo": truck(2010, 3_000, "GOOD", ["piece", "bulk"], { presets: presets() }), // approx.
  "proc-vehicle-ship-volga-don": truck(1960, 5_000, "GRAI", ["bulk", "piece"], { presets: presets() }), // approx.
  // service ships: a tug, a towboat or an offshore vessel carries deck cargo, a fishing vessel its catch as food,
  // a research ship or icebreaker its scientists or passengers, a lifeboat the people it rescues
  "proc-vehicle-ship-cable-layer": truck(2015, 7_000, "GOOD", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-ship-ocean-tug": truck(2010, 100, "GOOD", ["piece"], { presets: presets(...each("livery", "red")) }), // approx.
  "proc-vehicle-ship-harbour-tug": truck(2005, 20, "GOOD", ["piece"], { presets: presets(...each("livery", "black", "green")) }), // approx.
  "proc-vehicle-ship-towboat": truck(1980, 50, "GOOD", ["piece", "bulk"], { presets: presets() }), // approx.
  "proc-vehicle-ship-stern-trawler": truck(1990, 1_500, "FOOD", ["refrigerated"], { presets: presets(...each("livery", "blue")) }), // approx.
  "proc-vehicle-ship-purse-seiner": truck(2000, 1_200, "FOOD", ["refrigerated"], { presets: presets() }), // approx.
  "proc-vehicle-ship-shrimp-trawler": truck(1980, 40, "FOOD", ["refrigerated"], { presets: presets() }), // approx.
  "proc-vehicle-ship-lobster-boat": truck(1980, 3, "FOOD", ["refrigerated"], { presets: presets(...each("colour", "green", "red")) }), // approx.
  "proc-vehicle-ship-arktika": pax(2007, 128, null, { presets: presets() }),
  "proc-vehicle-ship-polarstern": pax(1982, 100, null, { presets: presets() }),
  "proc-vehicle-ship-attenborough": pax(2021, 90, null, { presets: presets() }),
  "proc-vehicle-ship-hopper-dredger": truck(2010, 30_000, "COAL", ["bulk"], { presets: presets() }), // approx.
  "proc-vehicle-ship-supply-vessel": truck(2010, 4_500, "GOOD", ["piece", "liquid", "bulk"], { presets: presets(...each("livery", "blue", "orange")) }), // approx.
  "proc-vehicle-ship-anchor-handler": truck(2010, 2_500, "GOOD", ["piece", "liquid"], { presets: presets() }), // approx.
  "proc-vehicle-ship-crane-vessel": truck(2019, 20_000, "GOOD", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-ship-drillship": truck(2010, 10_000, "OIL_", ["liquid"], { presets: presets() }), // approx.
  "proc-vehicle-ship-fireboat": pax(1938, 30, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-rnli-shannon": pax(2014, 20, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-pilot-boat": pax(2010, 12, null, { presets: presets() }), // approx.
  // passenger ships: seats and berths (a car ferry's cars aside)
  "proc-vehicle-ship-staten-island": pax(2004, 4_427, null, { presets: presets() }),
  "proc-vehicle-ship-star-ferry": pax(1958, 560, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-bc-spirit": pax(1993, 2_100, null, { presets: presets() }),
  "proc-vehicle-ship-wsf-jumbo": pax(1997, 2_500, null, { presets: presets() }),
  "proc-vehicle-ship-sydney-first-fleet": pax(1984, 393, null, { presets: presets() }),
  "proc-vehicle-ship-manly-freshwater": pax(1982, 1_100, null, { presets: presets() }),
  "proc-vehicle-ship-bosphorus-vapur": pax(1960, 1_500, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-vaporetto": pax(1960, 230, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-amsterdam-ijveer": pax(2000, 400, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-stena-hss": pax(1996, 1_500, null, { presets: presets() }),
  "proc-vehicle-ship-incat": pax(1990, 900, null, { presets: presets(...each("livery", "blue", "red")) }), // approx.
  "proc-vehicle-ship-channel-ropax": pax(2011, 2_000, null, { presets: presets(...each("livery", "white", "red")) }),
  "proc-vehicle-ship-tallink-megastar": pax(2017, 2_800, null, { presets: presets() }),
  "proc-vehicle-ship-jp-overnight-ferry": pax(2017, 700, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-srn4": pax(1968, 418, null, { presets: presets() }),
  "proc-vehicle-ship-raketa": pax(1957, 64, null, { presets: presets() }),
  "proc-vehicle-ship-jetfoil": pax(1975, 260, null, { presets: presets(...each("livery", "red", "green")) }),
  "proc-vehicle-ship-swiss-paddle": pax(1928, 1_200, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-sternwheeler": pax(1975, 400, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-elbe-paddle": pax(1926, 600, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-bateau-mouche": pax(1960, 600, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-nile-cruiser": pax(1990, 130, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-amazon-riverboat": pax(1990, 300, null, { presets: presets(...each("colour", "green", "red")) }), // approx.
  "proc-vehicle-ship-hurtigruten": pax(1993, 590, null, { presets: presets() }),
  "proc-vehicle-ship-oasis": pax(2009, 6_780, null, { presets: presets() }),
  "proc-vehicle-ship-icon": pax(2024, 7_600, null, { presets: presets() }),
  "proc-vehicle-ship-queen-mary-2": pax(2004, 2_695, null, { presets: presets() }),
  "proc-vehicle-ship-olympic": pax(1911, 2_435, null, { presets: presets() }),
  "proc-vehicle-ship-ss-united-states": pax(1952, 1_928, null, { presets: presets() }),
  "proc-vehicle-ship-normandie": pax(1935, 1_972, null, { presets: presets() }),
  "proc-vehicle-ship-expedition-cruise": pax(2019, 530, null, { presets: presets() }),
  "proc-vehicle-ship-river-cruise": pax(2010, 190, null, { presets: presets(...each("livery", "white", "red")) }), // approx.
  // sailing ships and small craft: a trader its cargo, a fishing boat its catch, the rest passengers
  "proc-vehicle-ship-narrowboat": truck(1900, 25, "COAL", ["bulk", "piece"], { presets: presets(...each("colour", "red", "blue")) }),
  "proc-vehicle-ship-thames-barge": truck(1900, 100, "GRAI", ["bulk", "piece"], { presets: presets() }),
  "proc-vehicle-ship-dhow": truck(1900, 60, "GOOD", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-ship-junk": truck(1900, 150, "GOOD", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-ship-felucca": pax(1900, 12, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-kettuvallam": pax(1990, 8, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-sedov": pax(1921, 164, null, { presets: presets() }),
  "proc-vehicle-ship-cutty-sark": truck(1869, 1_300, "GOOD", ["piece", "covered"], { presets: presets() }),
  "proc-vehicle-ship-bluenose": truck(1921, 100, "FOOD", ["refrigerated"], { presets: presets() }), // approx.
  "proc-vehicle-ship-ss-great-britain": pax(1845, 360, null, { presets: presets() }),
  "proc-vehicle-ship-viking-longship": pax(900, 60, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-voyaging-canoe": pax(1976, 16, null, { presets: presets() }),
  "proc-vehicle-ship-gondola": pax(1900, 6, null, { presets: presets() }),
  "proc-vehicle-ship-longtail": pax(1960, 12, null, { presets: presets() }), // approx.
  "proc-vehicle-ship-superyacht": pax(2015, 36, null, { presets: presets(...each("colour", "navy")) }), // approx.
  "proc-vehicle-ship-sailing-yacht": pax(2000, 8, null, { presets: presets(...each("colour", "navy", "red")) }), // approx.
  "proc-vehicle-ship-riva-aquarama": pax(1962, 6, null, { presets: presets() }),
  "proc-vehicle-ship-fishing-cutter": truck(1960, 40, "FOOD", ["refrigerated"], { presets: presets(...each("colour", "green")) }), // approx.
  "proc-vehicle-ship-sampan": pax(1950, 6, null, { presets: presets() }), // approx.
  // Germany (docs/models/germany-trains.md)
  "proc-vehicle-db-ice3": series(2000, 50, 60, ELRL, { cars: 8, liveries: ["nsInternational"] }),
  "proc-vehicle-db-ice4": series(2017, 60, 80, ELRL, { cars: 8, liveries: ["greenStripe"] }),
  "proc-vehicle-db-ice-t": series(1999, 45, 60, ELRL, { cars: 7, liveries: ["obb"] }),
  "proc-vehicle-db-423": series(1998, 50, 50, ELRL, { cars: 4 }),
  "proc-vehicle-db-642": series(2000, 60, 60, RAIL, { cars: 2, liveries: ["erzgebirgsbahn"] }),
  "proc-vehicle-db-650": series(1996, 71, 71, RAIL, { single: true, liveries: ["odeg"] }),
  "proc-vehicle-db-vt98": series(1955, 56, 56, RAIL, { single: true, liveries: ["orientRed"] }),
  "proc-vehicle-drg-svt877": series(1933, 51, 51, RAIL, { cars: 2, liveries: ["dbVt04"] }),
  "proc-vehicle-db-103": loco(1970, ELRL, { presets: presets(...each("livery", "orientRed", "trafficRed")) }),
  "proc-vehicle-db-101": loco(1996, ELRL, { presets: presets(...each("livery", "intercity")) }),
  "proc-vehicle-db-120": loco(1979, ELRL, { presets: presets(...each("livery", "trafficRed")) }),
  "proc-vehicle-drg-e18": loco(1935, ELRL, { presets: presets() }),
  "proc-vehicle-drg-e94": loco(1940, ELRL, { presets: presets() }),
  "proc-vehicle-db-v200": loco(1953, RAIL, { presets: presets(...each("livery", "orientRed")) }),
  "proc-vehicle-db-218": loco(1968, RAIL, { presets: presets(...each("livery", "orientRed", "trafficRed")) }),
  "proc-vehicle-drg-01": loco(1926, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-dr-52": loco(1942, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-kpev-p8": loco(1906, RAIL, { presets: presets({ unit: "tender" }, { livery: "drBlack" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-db-ice2": loco(1996, ELRL, {
    variants: [at({ unit: "coach" }, { capacity: 64, cargo: "PASS", refitClasses: ["passengers"] }), at({ unit: "drivingTrailer" }, { capacity: 50, cargo: "PASS", refitClasses: ["passengers"] })],
    presets: presets({ unit: "coach" }, { unit: "drivingTrailer" }),
    formations: [formation("7 cars", {}, { unit: "coach" }, { unit: "coach" }, { unit: "coach" }, { unit: "coach" }, { unit: "coach" }, [{ unit: "drivingTrailer" }, "turned"])],
  }),
  "proc-vehicle-db-ic-coach": pax(1971, 54, RAIL, { variants: [at({ unit: "bpmz" }, { capacity: 72 })], presets: presets({ unit: "bpmz" }, ...each("livery", "oceanBlue", "intercity")) }),
  // France (docs/models/france-trains.md)
  "proc-vehicle-sncf-tgv-m": series(2025, 40, 90, ELRL, { cars: 8, liveries: ["ouigo"] }),
  "proc-vehicle-sncf-z20500": series(1988, 140, 160, ELRL, { cars: 4, liveries: ["ileDeFrance"] }),
  "proc-vehicle-ratp-mi09": series(2011, 100, 110, ELRL, { cars: 5 }),
  "proc-vehicle-sncf-regio2n": series(2014, 90, 100, ELRL, { cars: 4, liveries: ["transilien"] }),
  "proc-vehicle-sncf-regiolis": series(2014, 60, 60, ELRL, { cars: 4, liveries: ["grandEst"] }),
  "proc-vehicle-sncf-x3800": series(1950, 62, 62, RAIL, { single: true }),
  "proc-vehicle-sncf-x73500": series(1999, 64, 64, RAIL, { single: true, liveries: ["alsace"] }),
  "proc-vehicle-sncf-cc6500": loco(1969, ELRL, { presets: presets(...each("livery", "maurienne", "beton")) }),
  "proc-vehicle-sncf-cc40100": loco(1964, ELRL, { presets: presets() }),
  "proc-vehicle-sncf-bb22200": loco(1976, ELRL, { presets: presets(...each("livery", "enVoyage", "fret")) }),
  "proc-vehicle-sncf-cc7100": loco(1952, ELRL, { presets: presets(...each("livery", "green")) }),
  "proc-vehicle-sncf-bb9200": loco(1957, ELRL, { presets: presets(...each("livery", "capitole")) }),
  "proc-vehicle-sncf-bb27000": loco(2001, ELRL, { presets: presets() }),
  "proc-vehicle-sncf-bb67400": loco(1969, RAIL, { presets: presets(...each("livery", "fret")) }),
  "proc-vehicle-sncf-cc72000": loco(1967, RAIL, { presets: presets(...each("livery", "multiservice")) }),
  "proc-vehicle-sncf-241p": loco(1948, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-sncf-141r": loco(1945, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-sncf-corail-coach": pax(1975, 58, RAIL, { variants: [at({ unit: "b11tu" }, { capacity: 88 })], presets: presets({ unit: "b11tu" }, ...each("livery", "teoz")) }),
  "proc-vehicle-sncf-grand-confort": pax(1970, 48, RAIL, { variants: [at({ unit: "a7d" }, { capacity: 30 })], presets: presets({ unit: "a7d" }, ...each("livery", "tee")) }),
  "proc-vehicle-ciwl-car": pax(1929, 28, RAIL, { variants: [at({ unit: "sleeping" }, { capacity: 20 })], presets: presets({ unit: "sleeping" }, ...each("livery", "ciwlBlue")) }), // approx.
  // the Netherlands (docs/models/netherlands-trains.md)
  "proc-vehicle-ns-mat46": series(1949, 76, 76, ELRL, { cars: 2, liveries: ["yellowGrey"] }),
  "proc-vehicle-ns-mat54": series(1957, 64, 80, ELRL, { cars: 4, liveries: ["yellowGrey"] }),
  "proc-vehicle-ns-plan-v": series(1966, 72, 72, ELRL, { cars: 2, liveries: ["yellowBlue"] }),
  "proc-vehicle-ns-de1": series(1954, 64, 64, RAIL, { single: true }),
  "proc-vehicle-ns-icm": series(1977, 64, 80, ELRL, { cars: 4, liveries: ["yellowGrey"] }),
  "proc-vehicle-ns-virm": series(1994, 100, 140, ELRL, { cars: 6, liveries: ["yellowGrey"] }),
  "proc-vehicle-ns-ddz": series(1992, 110, 140, ELRL, { cars: 4, liveries: ["yellowGrey"] }),
  "proc-vehicle-ns-sgm": series(1975, 76, 84, ELRL, { cars: 3, liveries: ["sprinter"] }),
  "proc-vehicle-ns-slt": series(2009, 40, 50, ELRL, { cars: 4 }),
  "proc-vehicle-ns-sng": series(2018, 44, 54, ELRL, { cars: 4 }),
  "proc-vehicle-ns-icng": series(2023, 50, 64, ELRL, { cars: 5 }),
  "proc-vehicle-ns-flirt": series(2016, 44, 52, ELRL, { cars: 4 }),
  "proc-vehicle-ns-v250": series(2012, 40, 64, ELRL, { cars: 8 }),
  "proc-vehicle-ns-1700": loco(1981, ELRL, { presets: presets(...each("livery", "railion")) }),
  "proc-vehicle-ns-1100": loco(1950, ELRL, { presets: presets(...each("livery", "yellowGrey")) }),
  "proc-vehicle-ns-1300": loco(1952, ELRL, { presets: presets(...each("livery", "yellowGrey")) }),
  "proc-vehicle-ns-1200": loco(1951, ELRL, { presets: presets(...each("livery", "yellowGrey")) }),
  "proc-vehicle-ns-2200": loco(1955, RAIL, { presets: presets(...each("livery", "yellowGrey")) }),
  "proc-vehicle-ns-3700": loco(1910, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-ns-icr-coach": pax(1981, 52, RAIL, { variants: [at({ unit: "b" }, { capacity: 80 })], presets: presets({ unit: "b" }, ...each("livery", "yellowBlue")) }),
  // Switzerland (docs/models/switzerland-trains.md)
  "proc-vehicle-sbb-rae-tee": series(1961, 30, 42, ELRL, { cars: 6, liveries: ["gottardo"] }),
  "proc-vehicle-sbb-roter-pfeil": series(1935, 70, 70, ELRL, { single: true }),
  "proc-vehicle-sbb-icn": series(2000, 50, 60, ELRL, { cars: 7 }),
  "proc-vehicle-sbb-giruno": series(2019, 40, 50, ELRL, { cars: 8 }),
  "proc-vehicle-sbb-fv-dosto": series(2018, 90, 110, ELRL, { cars: 8 }),
  "proc-vehicle-sbb-flirt": series(2004, 50, 60, ELRL, { cars: 4 }),
  "proc-vehicle-sbb-kiss": series(2012, 90, 110, ELRL, { cars: 6 }),
  "proc-vehicle-rhb-allegra": series(2010, 40, 50, ELRL, { cars: 3 }),
  "proc-vehicle-sbb-re460": loco(1992, ELRL, { presets: presets() }),
  "proc-vehicle-sbb-re420": loco(1964, ELRL, { presets: presets(...each("livery", "red")) }),
  "proc-vehicle-sbb-re620": loco(1972, ELRL, { presets: presets(...each("livery", "red")) }),
  "proc-vehicle-sbb-ae66": loco(1952, ELRL, { presets: presets(...each("livery", "red")) }),
  "proc-vehicle-sbb-ce68": loco(1919, ELRL, { presets: presets(...each("livery", "green")) }),
  "proc-vehicle-sbb-ae814": loco(1939, ELRL, { presets: presets() }),
  "proc-vehicle-rhb-ge443": loco(1993, ELRL, { presets: presets() }),
  "proc-vehicle-rhb-ge66": loco(1921, ELRL, { presets: presets(...each("livery", "green")) }),
  "proc-vehicle-mgb-hge442": loco(1985, ELRL, { presets: presets() }),
  "proc-vehicle-sbb-ew4-coach": pax(1981, 54, RAIL, { variants: [at({ unit: "b" }, { capacity: 78 })], presets: presets({ unit: "b" }, ...each("livery", "sbb")) }),
  "proc-vehicle-sbb-ic2000": pax(1997, 100, RAIL, { variants: [at({ unit: "b" }, { capacity: 130 })], presets: presets({ unit: "b" }) }),
  "proc-vehicle-glacier-express": pax(2006, 36, RAIL, { variants: [at({ unit: "second" }, { capacity: 48 })], presets: presets({ unit: "second" }) }),
  // Spain (docs/models/spain-trains.md)
  "proc-vehicle-renfe-s100": series(1992, 40, 50, ELRL, { cars: 8, liveries: ["avlo"] }),
  "proc-vehicle-renfe-s103": series(2007, 40, 50, ELRL, { cars: 8 }),
  "proc-vehicle-renfe-s102": series(2005, 0, 26, ELRL, { cars: 8, liveries: ["avlo"] }),
  "proc-vehicle-renfe-s106": series(2022, 30, 36, ELRL, { cars: 8, liveries: ["ave"] }),
  "proc-vehicle-renfe-s130": series(2007, 0, 26, ELRL, { cars: 8 }),
  "proc-vehicle-talgo-iii": series(1964, 22, 26, RAIL, { cars: 8 }),
  "proc-vehicle-renfe-s120": series(2006, 60, 70, ELRL, { cars: 4, liveries: ["mediaDistancia"] }),
  "proc-vehicle-renfe-civia": series(2003, 80, 90, ELRL, { cars: 4 }),
  "proc-vehicle-renfe-446": series(1989, 70, 80, ELRL, { cars: 3 }),
  "proc-vehicle-renfe-440": series(1974, 76, 84, ELRL, { cars: 3, liveries: ["cercanias"] }),
  "proc-vehicle-renfe-592": series(1981, 76, 84, RAIL, { cars: 3, liveries: ["mediaDistancia"] }),
  "proc-vehicle-iryo-s109": series(2022, 40, 56, ELRL, { cars: 8 }),
  "proc-vehicle-renfe-354": loco(1964, RAIL, { presets: presets() }),
  "proc-vehicle-renfe-252": loco(1991, ELRL, { presets: presets(...each("livery", "mercancias")) }),
  "proc-vehicle-renfe-269": loco(1973, ELRL, { presets: presets(...each("livery", "estrella")) }),
  "proc-vehicle-renfe-277": loco(1952, ELRL, { presets: presets(...each("livery", "blue")) }),
  "proc-vehicle-renfe-319": loco(1965, RAIL, { presets: presets(...each("livery", "mercancias")) }),
  "proc-vehicle-renfe-333": loco(1974, RAIL, { presets: presets(...each("livery", "talgo")) }),
  "proc-vehicle-renfe-141f": loco(1953, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-renfe-242f": loco(1956, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  // the United Kingdom (docs/models/uk-trains.md)
  "proc-vehicle-br-hst": series(1976, 0, 76, RAIL, { cars: 8, liveries: ["blueGrey"] }),
  "proc-vehicle-br-ic225": series(1988, 0, 76, ELRL, { cars: 8, liveries: ["lner"] }),
  "proc-vehicle-br-class-800": series(2017, 60, 80, ELRL, { cars: 5, liveries: ["azuma"] }),
  "proc-vehicle-br-class-390": series(2002, 40, 70, ELRL, { cars: 8, liveries: ["avanti"] }),
  "proc-vehicle-eurostar-373": series(1994, 0, 48, ELRL, { cars: 8, liveries: ["eurostar2011"] }),
  "proc-vehicle-br-class-158": series(1989, 70, 70, RAIL, { cars: 2, liveries: ["northern"] }),
  "proc-vehicle-br-class-142": series(1985, 56, 56, RAIL, { cars: 2, liveries: ["northern"] }),
  "proc-vehicle-lu-1938-stock": series(1938, 100, 110, ELRL, { cars: 7 }),
  "proc-vehicle-br-class-378": series(2009, 50, 57, ELRL, { cars: 5 }),
  "proc-vehicle-br-class-55": loco(1961, RAIL, { presets: presets(...each("livery", "brBlue")) }),
  "proc-vehicle-br-class-37": loco(1960, RAIL, { presets: presets(...each("livery", "brBlue", "railfreight")) }),
  "proc-vehicle-br-class-47": loco(1962, RAIL, { presets: presets(...each("livery", "brBlue", "intercity")) }),
  "proc-vehicle-br-class-66": loco(1998, RAIL, { presets: presets(...each("livery", "freightliner", "gbrf")) }),
  "proc-vehicle-br-class-86": loco(1965, ELRL, { presets: presets(...each("livery", "intercity")) }),
  "proc-vehicle-lner-a4": loco(1935, RAIL, { presets: presets({ unit: "tender" }, { livery: "brGreen" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-lner-a3": loco(1923, RAIL, { presets: presets({ unit: "tender" }, { livery: "brGreen" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-gwr-castle": loco(1923, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-lms-black-five": loco(1934, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-br-9f": loco(1954, RAIL, { presets: presets({ unit: "tender" }, { livery: "eveningStar" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-rocket": loco(1829, RAIL, { presets: presets({ unit: "tender" }, { version: "rebuilt" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-br-mk1-coach": pax(1951, 64, RAIL, { variants: [at({ unit: "bsk" }, { capacity: 24 })], presets: presets({ unit: "bsk" }, ...each("livery", "maroon", "southernGreen")) }),
  // India (docs/models/india-trains.md)
  "proc-vehicle-ir-vande-bharat": series(2019, 44, 78, ELRL, { cars: 8, liveries: ["saffron"] }),
  "proc-vehicle-ncrtc-namo-bharat": series(2023, 60, 72, ELRL, { cars: 6 }),
  "proc-vehicle-ir-mumbai-emu": series(2007, 100, 110, ELRL, { cars: 6, liveries: ["alt"] }),
  "proc-vehicle-ir-memu": series(1995, 90, 100, ELRL, { cars: 8, liveries: ["alt"] }),
  "proc-vehicle-dmrc-rs1": series(2002, 240, 260, ELRL, { cars: 6 }),
  "proc-vehicle-ir-wdm2": loco(1962, RAIL, { presets: presets(...each("livery", "blue")) }),
  "proc-vehicle-ir-wdp4d": loco(2010, RAIL, { presets: presets() }),
  "proc-vehicle-ir-wdg4g": loco(2018, RAIL, { presets: presets() }),
  "proc-vehicle-ir-wam4": loco(1971, ELRL, { presets: presets(...each("livery", "maroon")) }),
  "proc-vehicle-ir-wap4": loco(1994, ELRL, { presets: presets(...each("livery", "shatabdi")) }),
  "proc-vehicle-ir-wap7": loco(2000, ELRL, { presets: presets(...each("livery", "blue", "wag9")) }),
  "proc-vehicle-ir-wap5": loco(1995, ELRL, { presets: presets(...each("livery", "gatimaan")) }),
  "proc-vehicle-ir-wag12b": loco(2017, ELRL, { presets: presets() }),
  "proc-vehicle-ir-wp": loco(1947, RAIL, { presets: presets({ unit: "tender" }, { livery: "greenYellow" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-ir-wg": loco(1950, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-eir-fairy-queen": loco(1855, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-dhr-b-class": loco(1889, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-ir-lhb-coach": pax(2000, 72, RAIL, { variants: [at({ unit: "chairCar" }, { capacity: 78 })], presets: presets({ unit: "chairCar" }, ...each("livery", "shatabdi", "humsafar", "tejas")) }),
  "proc-vehicle-ir-icf-coach": pax(1955, 72, RAIL, { variants: [at({ unit: "general" }, { capacity: 100 })], presets: presets({ unit: "general" }, ...each("livery", "maroon")) }),
  "proc-vehicle-ir-boxn-wagon": wagon(1981, 58, "COAL", ["bulk"], { variants: [at({ unit: "covered" }, { capacity: 58, cargo: "GOOD", refitClasses: ["piece", "express"] })], presets: presets({ unit: "covered" }) }),
  "proc-vehicle-cr-c70-wagon": wagon(2006, 70, "COAL", ["bulk"], { variants: [at({ unit: "covered" }, { capacity: 70, cargo: "GOOD", refitClasses: ["piece", "express"] })], presets: presets({ unit: "covered" }) }),
  // China (docs/models/china-trains.md)
  "proc-vehicle-cr-cr400af": series(2017, 40, 90, ELRL, { cars: 8, liveries: ["smart"] }),
  "proc-vehicle-cr-cr400bf": series(2017, 40, 90, ELRL, { cars: 8, liveries: ["red"] }),
  "proc-vehicle-cr-crh380a": series(2010, 40, 90, ELRL, { cars: 8 }),
  "proc-vehicle-cr-crh2a": series(2007, 50, 100, ELRL, { cars: 8 }),
  "proc-vehicle-cr-crh3c": series(2008, 40, 80, ELRL, { cars: 8 }),
  "proc-vehicle-cr-crh5a": series(2007, 50, 90, ELRL, { cars: 8 }),
  "proc-vehicle-cr-cr200j": series(2019, 0, 90, ELRL, { cars: 8, liveries: ["whiteRed"] }),
  "proc-vehicle-cr-crh6a": series(2014, 60, 90, ELRL, { cars: 8 }),
  "proc-vehicle-cr-hxn5": loco(2008, RAIL, { presets: presets() }),
  "proc-vehicle-cr-hxd1": loco(2006, ELRL, { presets: presets() }),
  "proc-vehicle-cr-hxd3d": loco(2013, ELRL, { presets: presets() }),
  "proc-vehicle-cr-ss1": loco(1958, ELRL, { presets: presets() }),
  "proc-vehicle-cr-ss8": loco(1997, ELRL, { presets: presets() }),
  "proc-vehicle-cr-df4": loco(1969, RAIL, { presets: presets(...each("livery", "green")) }),
  "proc-vehicle-cr-df11": loco(1992, RAIL, { presets: presets() }),
  "proc-vehicle-cr-qj": loco(1956, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-cr-sy": loco(1960, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-cr-js": loco(1957, RAIL, { presets: presets({ unit: "tender" }), formations: [formation("with tender", {}, { unit: "tender" })] }),
  "proc-vehicle-cr-25t-coach": pax(1999, 36, RAIL, { variants: [at({ unit: "hardSeat" }, { capacity: 118 })], presets: presets({ unit: "hardSeat" }, ...each("livery", "green25b")) }),
};

// --- the world aircraft -------------------------------------------------------------

/**
 * The world aircraft's entries: [id, introduction year, seats, the other liveries or
 * colours worth a preset]. Every aircraft takes passengers (an aircraft is always
 * refittable to them); the freighters carry goods, their capacity their payload in
 * tonnes. OpenTTD's helicopter subtype is not written by the GRF encoder, so the
 * helicopters are planes there.
 */
function worldAircraftTable(): Record<string, OpenttdProperties> {
  const L = (...v: string[]) => each("livery", ...v);
  const C = each("colour", "red", "green", "gold", "black");
  const rows: Array<[string, number, number, ParamValues[]]> = [
    ["boeing-707", 1959, 189, L("qantas", "lufthansa")], ["boeing-727", 1967, 189, L("lufthansa", "american")],
    ["boeing-737-200", 1968, 130, L("united", "malaysia")], ["boeing-737-max", 2017, 189, L("ryanair", "aeromexico")],
    ["boeing-757", 1983, 200, L("britishAirways", "icelandair")], ["boeing-767", 1986, 269, L("american", "lot")],
    ["boeing-777", 2004, 396, L("airFrance", "cathay")], ["boeing-787", 2014, 296, L("qatar", "united")],
    ["douglas-dc8", 1967, 259, L("sas", "united")], ["douglas-dc9", 1967, 115, L("delta", "alitalia")],
    ["md-80", 1981, 155, L("alitalia", "sas")], ["douglas-dc10", 1972, 270, L("lufthansa", "swissair")],
    ["lockheed-tristar", 1972, 256, L("twa", "britishAirways")], ["convair-880", 1960, 110, L("twa", "cathay")],
    ["airbus-a300", 1974, 266, L("lufthansa", "thai")], ["airbus-a310", 1983, 220, L("lufthansa", "airIndia")],
    ["airbus-a320neo", 2017, 220, L("turkish", "chinaSouthern")], ["airbus-a330", 1994, 300, L("turkish", "aerLingus")],
    ["airbus-a340", 2002, 380, L("iberia", "etihad")], ["airbus-a350", 2015, 325, L("singapore", "finnair")],
    ["airbus-a220", 2016, 140, L("airCanada", "delta")], ["concorde", 1976, 100, L("airFrance")],
    ["caravelle", 1959, 80, L("sas", "sabena")], ["dh-comet", 1958, 81, L("bea", "aerolineas")],
    ["vickers-vc10", 1964, 135, L("britishAirways", "kenya")], ["hs-trident", 1964, 115, L("britishAirways", "airChina")],
    ["bac-111", 1965, 119, L("tarom", "aerLingus")], ["bae-146", 1983, 100, L("lufthansa", "swiss")],
    ["fokker-f28", 1969, 65, L("garuda", "sas")], ["fokker-100", 1988, 107, L("swissair", "american")],
    ["tupolev-tu104", 1956, 70, L("csa")], ["tupolev-tu134", 1967, 76, L("csa", "interflug")],
    ["tupolev-tu154", 1972, 164, L("balkan", "malev")], ["tupolev-tu144", 1977, 140, []],
    ["ilyushin-il62", 1967, 174, L("csa", "interflug")], ["ilyushin-il86", 1980, 350, L("aeroflotNew")],
    ["ilyushin-il96", 1993, 262, L("cubana", "rossiya")], ["yakovlev-yak40", 1968, 32, L("csa")],
    ["yakovlev-yak42", 1980, 120, L("cubana")], ["sukhoi-superjet", 2011, 98, L("rossiya")],
    ["antonov-an148", 2009, 75, L("ukraine")], ["embraer-e190", 2005, 100, L("lot", "aeromexico")],
    ["embraer-e195-e2", 2019, 132, L("embraer", "klm")], ["embraer-erj145", 1997, 50, L("airFrance", "lot")],
    ["bombardier-crj200", 1992, 50, L("delta", "airCanada")], ["bombardier-crj900", 2003, 90, L("lufthansa", "garuda")],
    ["comac-c919", 2023, 168, L("comac", "airChina")], ["comac-arj21", 2016, 90, L("chinaSouthern", "airChina")],
    ["namc-ys11", 1965, 64, L("jalClassic", "olympic")], ["dhc-dash8", 2000, 78, L("airCanada", "sas")],
    ["saab-340", 1984, 34, L("swissair", "finnair")], ["saab-2000", 1994, 50, L("swiss")],
    ["fokker-f27", 1958, 48, L("aerLingus", "sabena")], ["fokker-50", 1987, 56, L("sas", "austrian")],
    ["embraer-brasilia", 1985, 30, L("united", "embraer")], ["embraer-bandeirante", 1973, 18, L("navyBand")],
    ["let-l410", 1971, 19, L("aeroflot", "navyBand")], ["xian-ma60", 2000, 60, L("garuda", "plain")],
    ["antonov-an24", 1962, 50, L("interflug", "cubana")], ["ilyushin-il18", 1959, 100, L("interflug", "csa")],
    ["vickers-viscount", 1953, 75, L("aerLingus", "lufthansa")], ["lockheed-electra", 1959, 98, L("american", "klm")],
    ["douglas-dc3", 1936, 28, L("klm", "swissair")], ["douglas-dc6", 1951, 102, L("sas", "sabena")],
    ["lockheed-constellation", 1951, 95, L("lufthansa", "airFrance")], ["boeing-377", 1949, 100, L("boac", "united")],
    ["ford-trimotor", 1926, 15, []], ["junkers-ju52", 1932, 17, L("lufthansa")], ["dh-dragon-rapide", 1935, 8, []],
    ["bn-islander", 1967, 9, L("coastGuard")], ["pilatus-pc12", 1994, 9, L("navyBand")], ["cessna-172", 1956, 3, C],
    ["piper-cherokee", 1961, 3, C], ["beech-king-air", 1990, 11, C],
    ["antonov-an2", 1949, 12, each("gear", "floats")], ["canadair-cl415", 1994, 8, L("coastGuard")],
    ["shinmaywa-us2", 2007, 20, []], ["boeing-314", 1939, 74, []],
    ["gulfstream-g650", 2012, 19, C], ["bombardier-global", 2018, 19, C], ["dassault-falcon-7x", 2007, 16, C],
    ["learjet-35", 1974, 8, C], ["embraer-phenom-300", 2009, 9, C], ["hondajet", 2015, 6, C],
    ["sikorsky-s92", 2004, 19, L("rescue")], ["airbus-h145", 2014, 9, L("police")], ["mil-mi8", 1967, 24, L("utair")],
    ["bell-206", 1967, 4, C], ["zeppelin-nt", 1997, 12, L("goodyear")],
    ["dhc-twin-otter", 1966, 19, each("gear", "floats", "skis")], ["dhc-beaver", 1948, 6, each("gear", "floats")],
    ["cessna-caravan", 1985, 13, each("gear", "floats")],
  ];
  const out: Record<string, OpenttdProperties> = {};
  for (const [id, year, seats, more] of rows) out[`proc-vehicle-${id}`] = pax(year, seats, null, { presets: presets(...more) });
  // the length variants and the freighters
  out["proc-vehicle-airbus-a320"] = pax(1988, 180, null, {
    variants: [at({ length: "a319" }, { introYear: 1996, capacity: 140 }), at({ length: "a321" }, { introYear: 1994, capacity: 220 })],
    presets: presets(...each("length", "a319", "a321"), ...L("easyJet", "iberia")),
  });
  out["proc-vehicle-atr-72"] = pax(2011, 72, null, { variants: [at({ length: "42" }, { capacity: 48 })], presets: presets({ length: "42" }, ...L("alitalia", "malaysia")) });
  out["proc-vehicle-boeing-747-8"] = pax(2011, 467, null, {
    variants: [at({ variant: "freighter" }, { capacity: 134, cargo: "GOOD", refitClasses: ["piece", "express"] })],
    presets: presets({ variant: "freighter" }),
  });
  out["proc-vehicle-antonov-an124"] = truck(1986, 150, "GOOD", ["piece", "express"], { presets: presets(...L("volgaDnepr")) });
  out["proc-vehicle-antonov-an225"] = truck(1988, 250, "GOOD", ["piece", "express"], { presets: presets() });
  out["proc-vehicle-lockheed-l100"] = truck(1965, 22, "GOOD", ["piece", "express"], { presets: presets(...L("navyBand", "saa")) });
  out["proc-vehicle-boeing-dreamlifter"] = truck(2007, 113, "GOOD", ["piece", "express"], { presets: presets() });
  out["proc-vehicle-airbus-beluga-xl"] = truck(2020, 51, "GOOD", ["piece", "express"], { presets: presets() });
  return out;
}
