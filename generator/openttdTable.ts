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
    presets: presets({ unit: "middleCar" }),
    formations: [formation("5 cars", {}, { unit: "middleCar" }, { unit: "middleCar" }, { unit: "middleCar" }, [{}, "turned"])],
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

  // --- trucks ----------------------------------------------------------------------
  "proc-vehicle-american-truck": truck(1980, 25, "GOOD", ["piece", "covered", "express"], { presets: presets() }), // approx.
  "proc-vehicle-cistern-semi-truck": truck(1990, 30, "OIL_", ["liquid"], { presets: presets() }), // approx.
  "proc-vehicle-mixer-truck": truck(1985, 10, "GOOD", ["piece"], { presets: presets() }), // approx.
  "proc-vehicle-reefer-semi-truck": truck(1995, 25, "GOOD", ["piece", "refrigerated"], { presets: presets() }), // approx.
  "proc-vehicle-tatra-815-tipper": truck(1983, 15, "COAL", ["bulk"], { presets: presets() }),
  "proc-vehicle-praga-rv": truck(1935, 2, "GOOD", ["piece", "express"], { presets: presets() }),
  "proc-vehicle-mercedes-atego-1224": truck(1998, 6, "GOOD", ["piece", "covered", "express"], { presets: presets() }),

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

  // --- ships -----------------------------------------------------------------------
  "proc-vehicle-ocean-liner": pax(1930, 2000, null, { presets: presets() }), // approx.
  "proc-vehicle-cruise-ferry": pax(1990, 2000, null, { presets: presets() }), // approx.
  "proc-vehicle-hydrofoil-ferry": pax(1960, 150, null, { presets: presets() }), // approx.
  "proc-vehicle-passenger-ferry": pax(1950, 300, null, { presets: presets() }), // approx.
};
