// Every building's passengers and cargo, stated by hand (docs/models/traffic.md):
// residents, jobs and its role in the supply chain - the commodities it makes from
// nothing in tonnes per hour of game time (a primary industry's raw commodity, a
// town's mail), the ones it consumes (`accepts`: towns and sinks) and its recipe
// when it is a processor (`processes`) - at its default parameters, with variants
// where a parameter (a tower's size, a house's storeys, an industry's type) changes
// them. Keyed by the exported model id.
// A building of every category but Station and Decor must have an entry
// (traffic.ts mustCarry); the export writes `game.traffic`, `{}` for the rest.
//
// The numbers are for the model as drawn at scale 1; the game scales them by the
// building's on-map size itself, so a variant states only what the parameter changes.

import type { BuildingTrafficEntry } from "./traffic.ts";

export const BUILDING_TRAFFIC: Readonly<Record<string, BuildingTrafficEntry>> = {
  "proc-building-arc-de-triomphe": {
    jobs: 12,
    source: "monument: ticket and museum staff in the attic, visitors attracted through jobs",
  },
  "proc-building-atomium": {
    jobs: 60, produces: { mail: 0.05 }, accepts: ["food", "goods", "mail"],
    source: "museum, exhibition and the top-sphere restaurant staff",
  },
  "proc-building-bandstand": {
    jobs: 2,
    source: "park bandstand: musicians and a caretaker",
  },
  "proc-building-baroque-church": {
    jobs: 4,
    source: "parish church: priest, sexton, organist, verger",
  },
  "proc-building-belfry-of-bruges": {
    jobs: 25, produces: { mail: 0.05 }, accepts: ["food", "goods", "mail"],
    source: "belfry and its market halls: tower staff, shops and a museum in the halls",
  },
  "proc-building-brandenburg-gate": {
    jobs: 4,
    source: "city gate monument: an information point and guards",
  },
  "proc-building-brussels-town-hall": {
    jobs: 300, produces: { mail: 1.2 }, accepts: ["food", "goods", "mail"],
    source: "size: 71 x 49 m, about 4 office floors around the courtyard, city administration and ceremonial rooms",
  },
  "proc-building-castle": {
    residents: 8, jobs: 40, produces: { mail: 0.18 }, accepts: ["food", "goods", "mail"],
    source: "size: 72 x 63 m courtyard castle, a castellan's household and museum, shop and cafe staff",
    variants: [
      { params: { layout: "keep" }, residents: 4, jobs: 15, produces: { mail: 0.07 } },
      { params: { layout: "fortress" }, residents: 20, jobs: 70, produces: { mail: 0.34 } },
    ],
  },
  "proc-building-chemical-factory": {
    jobs: 120, processes: { output: "fuel", inputs: { oil: 1 }, rate: 40, stock: 400 },
    source: "size: 36 x 28 m process plant: reactors and columns, about 120 operators; a small refinery: crude oil in, fuel out, about 10 hours of feed in stock; the refinery type a larger one",
    variants: [
      { params: { type: "refinery" }, jobs: 150, processes: { output: "fuel", inputs: { oil: 1 }, rate: 80, stock: 800 } },
    ],
  },
  "proc-building-church-vrchlabi": {
    jobs: 4,
    source: "town parish church: priest, sexton, organist, verger",
  },
  "proc-building-cloth-hall": {
    jobs: 120, produces: { mail: 0.2 }, accepts: ["food", "goods", "mail"],
    source: "Krakow Sukiennice: about 40 market stalls on the ground floor and the gallery museum upstairs",
  },
  "proc-building-comm-balcony-house": {
    residents: 8, jobs: 4, produces: { mail: 0.04 }, accepts: ["food", "goods", "mail"],
    source: "size: 8 x 10 m, a shop on the ground floor, one 2.5-person flat per upper storey (1.5 when broad)",
    variants: [
      { params: { storeys: "four", width: "broad" }, residents: 11, jobs: 6, produces: { mail: 0.06 } },
      { params: { storeys: "three", width: "compact" }, residents: 5, produces: { mail: 0.03 } },
      { params: { storeys: "three", width: "broad" }, jobs: 6, produces: { mail: 0.05 } },
      { params: { storeys: "five", width: "compact" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "five", width: "broad" }, residents: 15, jobs: 6, produces: { mail: 0.07 } },
    ],
  },
  "proc-building-comm-corner-shop": {
    residents: 5, jobs: 4, produces: { mail: 0.03 }, accepts: ["food", "fuel", "goods", "mail"],
    source: "size: 8.5 x 10 m, a corner shop on the ground floor, one 2.5-person flat per upper storey (1.5 when broad)",
    variants: [
      { params: { storeys: "three", width: "broad" }, residents: 8, jobs: 6, produces: { mail: 0.05 } },
      { params: { storeys: "two", width: "compact" }, residents: 2, produces: { mail: 0.02 } },
      { params: { storeys: "two", width: "broad" }, residents: 4, jobs: 6, produces: { mail: 0.04 } },
      { params: { storeys: "four", width: "compact" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "four", width: "broad" }, residents: 11, jobs: 6, produces: { mail: 0.06 } },
    ],
  },
  "proc-building-comm-market-block": {
    residents: 12, jobs: 10, produces: { mail: 0.08 }, accepts: ["food", "fuel", "goods", "mail"],
    source: "size: 14 x 10 m at four bays, market shops on the ground floor (2.5 jobs a bay), flats above (1.5 people a bay and storey)",
    variants: [
      { params: { storeys: "three", bays: "five" }, residents: 15, jobs: 12, produces: { mail: 0.09 } },
      { params: { storeys: "three", bays: "six" }, residents: 18, jobs: 15, produces: { mail: 0.11 } },
      { params: { storeys: "four", bays: "four" }, residents: 18, produces: { mail: 0.09 } },
      { params: { storeys: "four", bays: "five" }, residents: 22, jobs: 12, produces: { mail: 0.11 } },
      { params: { storeys: "four", bays: "six" }, residents: 27, jobs: 15, produces: { mail: 0.14 } },
    ],
  },
  "proc-building-comm-office-house": {
    jobs: 34, produces: { mail: 0.14 }, accepts: ["food", "goods", "mail"],
    source: "size: 8 x 11 m (85 m2) floors, a shop on the ground floor and offices above at 1 job per 17 m2",
    variants: [
      { params: { storeys: "seven", width: "broad" }, jobs: 51, produces: { mail: 0.2 } },
      { params: { storeys: "five", width: "compact" }, jobs: 24, produces: { mail: 0.1 } },
      { params: { storeys: "five", width: "broad" }, jobs: 36 },
      { params: { storeys: "nine", width: "compact" }, jobs: 44, produces: { mail: 0.18 } },
      { params: { storeys: "nine", width: "broad" }, jobs: 66, produces: { mail: 0.26 } },
    ],
  },
  "proc-building-comm-terrace-house": {
    residents: 15, jobs: 6, produces: { mail: 0.07 }, accepts: ["food", "goods", "mail"],
    source: "size: 14 x 11.5 m, shops on the ground floor, two 2.5-person flats per upper storey",
    variants: [
      { params: { storeys: "three" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "five" }, residents: 20, produces: { mail: 0.08 } },
    ],
  },
  "proc-building-commercial-annex": {
    residents: 5, jobs: 8, produces: { mail: 0.05 }, accepts: ["food", "fuel", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor and a shop wing beside it, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay plus 4 in the wing",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 7, produces: { mail: 0.03 } },
      { params: { storeys: "2", width: "standard" }, residents: 3, produces: { mail: 0.04 } },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 12, produces: { mail: 0.06 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 7, produces: { mail: 0.04 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 12, produces: { mail: 0.07 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 7, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.06 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 12, produces: { mail: 0.09 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 7 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.06 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 12, produces: { mail: 0.1 } },
    ],
  },
  "proc-building-commercial-balcony": {
    residents: 8, jobs: 1, produces: { mail: 0.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, flats on every storey, a caretaker's office: 0.85 people a bay and storey, 1 job",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 3, produces: { mail: 0.01 } },
      { params: { storeys: "2", width: "standard" }, residents: 5, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "wide" }, jobs: 2 },
      { params: { storeys: "3", width: "narrow" }, residents: 5, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "wide" }, residents: 13, jobs: 2, produces: { mail: 0.05 } },
      { params: { storeys: "4", width: "narrow" }, residents: 7 },
      { params: { storeys: "4", width: "standard" }, residents: 10 },
      { params: { storeys: "4", width: "wide" }, residents: 17, jobs: 2, produces: { mail: 0.06 } },
      { params: { storeys: "5", width: "standard" }, residents: 13, produces: { mail: 0.04 } },
      { params: { storeys: "5", width: "wide" }, residents: 21, jobs: 2, produces: { mail: 0.07 } },
    ],
  },
  "proc-building-commercial-baroque": {
    residents: 5, jobs: 4, produces: { mail: 0.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.04 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.06 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.07 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.08 } },
    ],
  },
  "proc-building-commercial-barrel": {
    residents: 5, jobs: 4, produces: { mail: 0.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.04 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.06 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.07 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.08 } },
    ],
  },
  "proc-building-commercial-brick": {
    residents: 5, jobs: 4, produces: { mail: 0.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.04 } },
      { params: { storeys: "2", width: "extraWide" }, residents: 7, jobs: 12, produces: { mail: 0.07 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.06 } },
      { params: { storeys: "3", width: "extraWide" }, residents: 14, jobs: 12, produces: { mail: 0.09 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.07 } },
      { params: { storeys: "4", width: "extraWide" }, residents: 20, jobs: 12, produces: { mail: 0.11 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.08 } },
      { params: { storeys: "5", width: "extraWide" }, residents: 27, jobs: 12, produces: { mail: 0.13 } },
    ],
  },
  "proc-building-commercial-classical": {
    residents: 5, jobs: 4, produces: { mail: 0.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.04 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.06 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.07 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.08 } },
    ],
  },
  "proc-building-commercial-gable": {
    residents: 5, jobs: 4, produces: { mail: 0.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, arcade shops on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.04 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.06 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.07 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.08 } },
    ],
  },
  "proc-building-commercial-modern": {
    residents: 5, jobs: 4, produces: { mail: 0.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.04 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.06 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.07 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.08 } },
    ],
  },
  "proc-building-commercial-shop": {
    jobs: 6, produces: { mail: 0.02 }, accepts: ["food", "fuel", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a store on the ground floor, a flat above when two storeys: 0.85 people a bay and storey above the ground floor, 2 jobs a bay",
    variants: [
      { params: { storeys: "1", width: "narrow" }, jobs: 4 },
      { params: { storeys: "1", width: "wide" }, jobs: 10, produces: { mail: 0.04 } },
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 4 },
      { params: { storeys: "2", width: "standard" }, residents: 3, produces: { mail: 0.03 } },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 10, produces: { mail: 0.05 } },
    ],
  },
  "proc-building-commercial-tenement": {
    residents: 10, jobs: 4, produces: { mail: 0.05 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "standard" }, residents: 3, produces: { mail: 0.03 } },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.04 } },
      { params: { storeys: "2", width: "extraWide" }, residents: 7, jobs: 12, produces: { mail: 0.07 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "standard" }, residents: 5, produces: { mail: 0.03 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.06 } },
      { params: { storeys: "3", width: "extraWide" }, residents: 14, jobs: 12, produces: { mail: 0.09 } },
      { params: { storeys: "4", width: "narrow" }, residents: 5, jobs: 3, produces: { mail: 0.03 } },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.07 } },
      { params: { storeys: "4", width: "extraWide" }, residents: 20, jobs: 12, produces: { mail: 0.11 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3, produces: { mail: 0.03 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.08 } },
      { params: { storeys: "5", width: "extraWide" }, residents: 27, jobs: 12, produces: { mail: 0.13 } },
    ],
  },
  "proc-building-commercial-terrace": {
    residents: 5, jobs: 4, produces: { mail: 0.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.04 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.02 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.06 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.04 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.07 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.05 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.08 } },
    ],
  },
  "proc-building-equestrian-statue": {
    jobs: 1,
    source: "statue: a caretaker; visitors attracted through jobs",
  },
  "proc-building-gate-of-heavenly-peace": {
    jobs: 40, produces: { mail: 0.05 }, accepts: ["mail"],
    source: "Tiananmen gate tower: museum, ticket and guard staff",
  },
  "proc-building-gateway-of-india": {
    jobs: 6,
    source: "monument: guards and guides",
  },
  "proc-building-hagia-sophia": {
    jobs: 150, produces: { mail: 0.1 }, accepts: ["food", "goods", "mail"],
    source: "size: 88 x 87 m mosque and visitor site: imams, attendants, guards and guides",
  },
  "proc-building-half-timbered-town-hall": {
    jobs: 30, produces: { mail: 0.15 }, accepts: ["food", "goods", "mail"],
    source: "size: 22 x 16.5 m, three floors of town offices and a ground-floor tavern",
  },
  "proc-building-hist-colosseum": {
    jobs: 150, produces: { mail: 0.05 }, accepts: ["goods", "mail"],
    source: "amphitheatre site: ticket, guard, guide and conservation staff",
  },
  "proc-building-hist-pagoda": {
    residents: 6, jobs: 4, produces: { mail: 0.02 }, accepts: ["food", "mail"],
    source: "temple pagoda: monks living in it and temple staff",
  },
  "proc-building-hist-palace": {
    residents: 20, jobs: 200, produces: { mail: 0.6 }, accepts: ["food", "goods", "mail"],
    source: "size: 73 x 68 m palace: a household of about 20 and court, museum and service staff",
  },
  "proc-building-hospital": {
    jobs: 700, produces: { mail: 0.5 }, accepts: ["food", "goods", "mail"],
    source: "size: 68 x 48 m, 7 floors: about 300 beds at 2.3 staff a bed",
  },
  "proc-building-ind-building-a": {
    jobs: 120, processes: { output: "food", inputs: { grain: 1 }, rate: 15, stock: 150 },
    source: "size: 24 x 22 m, multi-storey brick mill at its compact site, about 120 workers; the food plant: mills grain into food, about 10 hours of grain in stock",
    variants: [
      { params: { size: "extended" }, jobs: 180, processes: { output: "food", inputs: { grain: 1 }, rate: 22, stock: 220 } },
    ],
  },
  "proc-building-ind-building-h": {
    jobs: 80, processes: { output: "goods", inputs: { steel: 0.5, wood: 0.5 }, rate: 12, stock: 120 },
    source: "size: 24 x 22 m single-storey assembly hall, about 80 workers; a goods factory: assembles steel and wood into goods",
    variants: [
      { params: { size: "extended" }, jobs: 120, processes: { output: "goods", inputs: { steel: 0.5, wood: 0.5 }, rate: 18, stock: 180 } },
    ],
  },
  "proc-building-ind-building-k": {
    jobs: 70, processes: { output: "goods", inputs: { steel: 0.5, wood: 0.5 }, rate: 10, stock: 100 },
    source: "size: 24 x 22 m sawtooth workshop, about 70 workers; a goods factory: works steel and wood into goods",
    variants: [
      { params: { size: "extended" }, jobs: 105, processes: { output: "goods", inputs: { steel: 0.5, wood: 0.5 }, rate: 15, stock: 150 } },
    ],
  },
  "proc-building-ind-building-s": {
    jobs: 25, accepts: ["food", "goods"],
    source: "size: 24 x 26 m warehouse with loading docks, about 25 workers; a sink: takes in food and goods for the region",
    variants: [
      { params: { size: "extended" }, jobs: 38 },
    ],
  },
  "proc-building-ind-chimney-basic": {
    jobs: 1,
    source: "a free-standing chimney: a stoker or inspector",
  },
  "proc-building-ind-detail-tank": {
    jobs: 3, accepts: ["fuel"],
    source: "size: 15 x 11 m tank farm, a few operators; a sink: takes in fuel",
  },
  "proc-building-industry-factory-a": {
    jobs: 200, processes: { output: "steel", inputs: { "iron-ore": 1, coal: 0.5 }, rate: 30, stock: 300 },
    source: "size: 28 x 26 m heavy works (foundry), about 200 workers; the steel mill: steel from iron ore and coal, about 10 hours of ore in stock",
    variants: [
      { params: { size: "extended" }, jobs: 300, processes: { output: "steel", inputs: { "iron-ore": 1, coal: 0.5 }, rate: 45, stock: 450 } },
    ],
  },
  "proc-building-industry-farm": {
    residents: 4, jobs: 6, produces: { grain: 15 }, accepts: ["fuel", "goods"],
    source: "size: 42 x 30 m arable farm with a field strip and two grain bins, a farming family and a few hands; grain out, diesel and supplies in",
    variants: [
      { params: { size: "large" }, residents: 6, jobs: 10, produces: { grain: 25 } },
    ],
  },
  "proc-building-industry-offshore-platform": {
    jobs: 120, produces: { oil: 150 }, accepts: ["food", "goods"],
    source: "offshore oil platform: a crew of about 120 on rotation, some 150 t of crude oil an hour; supplied with food and goods",
  },
  "proc-building-industry-logging-camp": {
    jobs: 15, produces: { wood: 12 }, accepts: ["fuel"],
    source: "size: 44 x 32 m logging camp with four log decks and a loader, a felling crew of about 15; logs out, diesel for the saws and the loader in",
  },
  "proc-building-industry-mine": {
    jobs: 120, produces: { coal: 25 }, accepts: ["fuel"],
    source: "size: 46 x 32 m mine head with a bunker over the siding, about 120 miners a shift; coal out, fuel for the winding engine and the plant in",
    variants: [
      { params: { type: "iron" }, produces: { "iron-ore": 30 } },
    ],
  },
  "proc-building-industry-oil-pump": {
    jobs: 1, produces: { oil: 3 },
    source: "a single pumpjack: about 3 t of crude oil an hour, one visiting operator",
    variants: [
      { params: { size: "large" }, produces: { oil: 6 } },
    ],
  },
  "proc-building-industry-power-plant": {
    jobs: 150, accepts: ["fuel"],
    source: "size: 46 x 38 m gas and oil-fired thermal plant, about 150 staff; burns fuel; the coal type burns coal, the nuclear type takes in no commodity",
    variants: [
      { params: { type: "coal" }, jobs: 250, accepts: ["coal"] },
      { params: { type: "nuclear" }, jobs: 600, accepts: [] },
    ],
  },
  "proc-building-industry-wind-turbine": {
    jobs: 1,
    source: "a single wind turbine: a visiting service technician",
  },
  "proc-building-leaning-tower-of-pisa": {
    jobs: 10,
    source: "bell tower open to visitors: ticket and guide staff",
  },
  "proc-building-louvre-pyramid": {
    jobs: 200, produces: { mail: 0.2 }, accepts: ["food", "goods", "mail"],
    source: "the museum's main entrance hall: reception, security and shop staff",
  },
  "proc-building-market-cross": {
    jobs: 1,
    source: "market cross: a caretaker",
  },
  "proc-building-market-hall": {
    jobs: 80, produces: { mail: 0.1 }, accepts: ["food", "goods", "mail"],
    source: "size: 49 x 34 m covered market, about 40 stalls at 2 jobs each",
  },
  "proc-building-nelsons-column": {
    jobs: 1,
    source: "column monument: a caretaker",
  },
  "proc-building-notre-dame": {
    jobs: 60, produces: { mail: 0.05 }, accepts: ["food", "mail"],
    source: "cathedral: clergy, sacristans, musicians, guides and guards",
  },
  "proc-building-panel-slab": {
    residents: 120, produces: { mail: 0.36 }, accepts: ["food", "goods", "mail"],
    source: "size: 34 x 12.5 m, 3 sections x 8 storeys x 2 flats x 2.5 people",
    variants: [
      { params: { sections: "3", storeys: "4" }, residents: 60, produces: { mail: 0.18 } },
      { params: { sections: "3", storeys: "6" }, residents: 90, produces: { mail: 0.27 } },
      { params: { sections: "3", storeys: "12" }, residents: 180, produces: { mail: 0.54 } },
      { params: { sections: "2", storeys: "8" }, residents: 80, produces: { mail: 0.24 } },
      { params: { sections: "2", storeys: "4" }, residents: 40, produces: { mail: 0.12 } },
      { params: { sections: "2", storeys: "6" }, residents: 60, produces: { mail: 0.18 } },
      { params: { sections: "1", storeys: "8" }, residents: 40, produces: { mail: 0.12 } },
      { params: { sections: "1", storeys: "4" }, residents: 20, produces: { mail: 0.06 } },
      { params: { sections: "1", storeys: "6" }, residents: 30, produces: { mail: 0.09 } },
      { params: { sections: "1", storeys: "12" }, residents: 60, produces: { mail: 0.18 } },
    ],
  },
  "proc-building-panel-tower": {
    residents: 120, produces: { mail: 0.36 }, accepts: ["food", "goods", "mail"],
    source: "size: 16 x 15 m point block, 12 storeys x 4 flats x 2.5 people",
    variants: [
      { params: { storeys: "10" }, residents: 100, produces: { mail: 0.3 } },
      { params: { storeys: "14" }, residents: 140, produces: { mail: 0.42 } },
    ],
  },
  "proc-building-pantheon": {
    jobs: 20, produces: { mail: 0.02 }, accepts: ["mail"],
    source: "church and visitor site: clergy, guards and guides",
  },
  "proc-building-parthenon": {
    jobs: 25,
    source: "temple ruin on its site: guards, guides and conservators",
  },
  "proc-building-plague-column": {
    jobs: 1,
    source: "column monument: a caretaker",
  },
  "proc-building-prague-castle-st-vitus": {
    jobs: 300, produces: { mail: 1 }, accepts: ["food", "goods", "mail"],
    source: "Prague Castle with St Vitus: the President's office, cathedral clergy, castle guard and visitor staff",
  },
  "proc-building-prague-old-town-hall": {
    jobs: 60, produces: { mail: 0.2 }, accepts: ["food", "goods", "mail"],
    source: "town hall with the astronomical clock: municipal ceremonial offices, guides and tower staff",
  },
  "proc-building-reichstag": {
    jobs: 1200, produces: { mail: 3 }, accepts: ["food", "goods", "mail"],
    source: "size: 140 x 100 m, 4 floors: the Bundestag's plenary, groups' offices and visitor services",
  },
  "proc-building-sky-art-deco": {
    jobs: 800, produces: { mail: 3.2 }, accepts: ["goods", "mail"],
    source: "size: 70 m, about 20 setback floors averaging 650 m2 of offices at 1 job per 16 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 344, produces: { mail: 1.38 } },
      { params: { size: "medium" }, jobs: 544, produces: { mail: 2.18 } },
      { params: { size: "landmark" }, jobs: 1128, produces: { mail: 4.51 } },
    ],
  },
  "proc-building-sky-brick-residential": {
    residents: 330, jobs: 10, produces: { mail: 1.03 }, accepts: ["food", "goods", "mail"],
    source: "size: 70 m, about 22 floors x 6 flats x 2.5 people, a concierge and caretakers; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, residents: 142, jobs: 4, produces: { mail: 0.44 } },
      { params: { size: "medium" }, residents: 224, jobs: 7, produces: { mail: 0.7 } },
      { params: { size: "landmark" }, residents: 465, jobs: 14, produces: { mail: 1.45 } },
    ],
  },
  "proc-building-sky-bullet": {
    jobs: 700, produces: { mail: 2.8 }, accepts: ["goods", "mail"],
    source: "size: 70 m, about 20 round floors of 600 m2 offices at 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 301, produces: { mail: 1.2 } },
      { params: { size: "medium" }, jobs: 476, produces: { mail: 1.9 } },
      { params: { size: "landmark" }, jobs: 987, produces: { mail: 3.95 } },
    ],
  },
  "proc-building-sky-dark-slab": {
    jobs: 1000, produces: { mail: 4 }, accepts: ["goods", "mail"],
    source: "size: 70 m, about 20 floors of 35 x 23.5 m slab offices, 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 430, produces: { mail: 1.72 } },
      { params: { size: "medium" }, jobs: 680, produces: { mail: 2.72 } },
      { params: { size: "landmark" }, jobs: 1410, produces: { mail: 5.64 } },
    ],
  },
  "proc-building-sky-glass-office": {
    jobs: 900, produces: { mail: 3.6 }, accepts: ["goods", "mail"],
    source: "size: 70 m, about 18 floors of 28 x 28 m offices at 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 387, produces: { mail: 1.55 } },
      { params: { size: "medium" }, jobs: 612, produces: { mail: 2.45 } },
      { params: { size: "landmark" }, jobs: 1269, produces: { mail: 5.08 } },
    ],
  },
  "proc-building-sky-pagoda": {
    jobs: 500, produces: { mail: 2 }, accepts: ["goods", "mail"],
    source: "size: 70 m, about 18 tapering octagonal floors averaging 480 m2 of offices at 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 215, produces: { mail: 0.86 } },
      { params: { size: "medium" }, jobs: 340, produces: { mail: 1.36 } },
      { params: { size: "landmark" }, jobs: 705, produces: { mail: 2.82 } },
    ],
  },
  "proc-building-sky-pyramid": {
    jobs: 600, produces: { mail: 2.4 }, accepts: ["goods", "mail"],
    source: "size: 70 m, about 18 tapering floors and two side wings of offices at 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 258, produces: { mail: 1.03 } },
      { params: { size: "medium" }, jobs: 408, produces: { mail: 1.63 } },
      { params: { size: "landmark" }, jobs: 846, produces: { mail: 3.38 } },
    ],
  },
  "proc-building-sky-terraced": {
    residents: 200, jobs: 150, produces: { mail: 1.2 }, accepts: ["food", "goods", "mail"],
    source: "size: 70 m, stepped tower: flats in the upper steps (about 80 flats x 2.5 people), offices in the base; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, residents: 86, jobs: 64, produces: { mail: 0.51 } },
      { params: { size: "medium" }, residents: 136, jobs: 102, produces: { mail: 0.82 } },
      { params: { size: "landmark" }, residents: 282, jobs: 212, produces: { mail: 1.69 } },
    ],
  },
  "proc-building-sky-twin-towers": {
    jobs: 800, produces: { mail: 3.2 }, accepts: ["goods", "mail"],
    source: "size: 70 m, two round towers of about 20 floors x 330 m2 of offices each at 1 job per 16 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 344, produces: { mail: 1.38 } },
      { params: { size: "medium" }, jobs: 544, produces: { mail: 2.18 } },
      { params: { size: "landmark" }, jobs: 1128, produces: { mail: 4.51 } },
    ],
  },
  "proc-building-sky-twisted": {
    residents: 300, jobs: 15, produces: { mail: 0.96 }, accepts: ["food", "goods", "mail"],
    source: "size: 70 m twisting residential tower, about 22 floors x 5.5 flats x 2.5 people; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, residents: 129, jobs: 6, produces: { mail: 0.41 } },
      { params: { size: "medium" }, residents: 204, jobs: 10, produces: { mail: 0.65 } },
      { params: { size: "landmark" }, residents: 423, jobs: 21, produces: { mail: 1.35 } },
    ],
  },
  "proc-building-st-basils-cathedral": {
    jobs: 30, produces: { mail: 0.02 }, accepts: ["mail"],
    source: "cathedral museum: curators, guides, guards and clergy",
  },
  "proc-building-st-nicholas-church": {
    jobs: 6,
    source: "town church: clergy, sexton, organist and concert staff",
  },
  "proc-building-statue-of-liberty": {
    jobs: 50, produces: { mail: 0.03 }, accepts: ["food", "mail"],
    source: "statue on its star fort: National Park rangers, security and concession staff",
  },
  "proc-building-taj-mahal": {
    jobs: 200, produces: { mail: 0.05 }, accepts: ["mail"],
    source: "mausoleum complex: guards, guides, gardeners and conservators",
  },
  "proc-building-temple-of-heaven": {
    jobs: 60, produces: { mail: 0.03 }, accepts: ["mail"],
    source: "temple complex in its park: guards, guides and park staff",
  },
  "proc-building-tower-bell": {
    jobs: 2,
    source: "bell tower: a bell-ringer and caretaker",
  },
  "proc-building-tower-bigben": {
    jobs: 10,
    source: "clock tower: clock keepers, guides and guards",
  },
  "proc-building-tower-eiffel": {
    jobs: 500, produces: { mail: 0.1 }, accepts: ["food", "goods", "mail"],
    source: "Eiffel Tower operator staff (about 360) and its restaurants and shops",
  },
  "proc-building-tower-kenney": {
    residents: 2, jobs: 1, produces: { mail: 0.01 }, accepts: ["food", "mail"],
    source: "size: 12.5 m stone turret, a keeper's dwelling",
    variants: [
      { params: { storeys: "4" }, residents: 3 },
    ],
  },
  "proc-building-tower-radio": {
    jobs: 2,
    source: "radio mast with its equipment room: two technicians",
  },
  "proc-building-tower-stone": {
    residents: 3, jobs: 1, produces: { mail: 0.01 }, accepts: ["food", "mail"],
    source: "size: 11 x 13 m stone tower, a small household on its upper floors",
    variants: [
      { params: { storeys: "2" }, residents: 2 },
      { params: { storeys: "4" }, residents: 4 },
    ],
  },
  "proc-building-tower-transmission": {
    jobs: 1,
    source: "power pylon: a visiting line inspector",
  },
  "proc-building-tower-watch": {
    jobs: 2,
    source: "watch tower: two lookouts or guards",
  },
  "proc-building-twin-tower-baroque-church": {
    jobs: 6,
    source: "large baroque church: clergy, sexton, organist and guides",
  },
  "proc-building-us-capitol": {
    jobs: 2000, produces: { mail: 5 }, accepts: ["food", "goods", "mail"],
    source: "United States Capitol: members' and committee staff, Capitol Police and visitor centre in the 195 x 104 m building",
  },
  "proc-building-village-alpine-hut": {
    residents: 3, produces: { mail: 0.01 }, accepts: ["food", "goods", "mail"],
    source: "size: 7 x 7 m mountain hut, a herder family or a hut warden's household",
    variants: [
      { params: { storeys: "one" }, residents: 2 },
    ],
  },
  "proc-building-village-chapel": {
    jobs: 1,
    source: "village chapel: a sexton",
  },
  "proc-building-village-cottage": {
    residents: 4, produces: { mail: 0.01 }, accepts: ["food", "goods", "mail"],
    source: "size: 10 x 9 m two-storey cottage, one family",
    variants: [
      { params: { storeys: "one" }, residents: 2 },
    ],
  },
  "proc-building-village-family-house": {
    residents: 4, produces: { mail: 0.01 }, accepts: ["food", "goods", "mail"],
    source: "size: 13.6 x 10 m family house, one family",
    variants: [
      { params: { annex: "wing" }, residents: 5 },
    ],
  },
  "proc-building-village-l-house": {
    residents: 4, produces: { mail: 0.01 }, accepts: ["food", "goods", "mail"],
    source: "size: 11 x 10.6 m L-shaped house, one family",
    variants: [
      { params: { storeys: "one" }, residents: 3 },
    ],
  },
  "proc-building-village-modern-house": {
    residents: 4, produces: { mail: 0.01 }, accepts: ["food", "goods", "mail"],
    source: "size: 15 x 9.4 m modern house, one family",
    variants: [
      { params: { storeys: "one" }, residents: 3 },
    ],
  },
  "proc-building-village-narrow-house": {
    residents: 3, produces: { mail: 0.01 }, accepts: ["food", "goods", "mail"],
    source: "size: 7.4 x 11 m narrow house, a small family",
    variants: [
      { params: { storeys: "three" }, residents: 5 },
    ],
  },
  "proc-building-village-timber-cottage": {
    residents: 3, produces: { mail: 0.01 }, accepts: ["food", "goods", "mail"],
    source: "size: 8.4 x 9.5 m timber cottage, a small family",
  },
  "proc-building-village-timber-house": {
    residents: 4, produces: { mail: 0.01 }, accepts: ["food", "goods", "mail"],
    source: "size: 9.2 x 11.5 m timber house, one family",
  },
  "proc-building-war-memorial": {
    jobs: 1,
    source: "memorial: a caretaker; visitors attracted through jobs",
  },
  "proc-building-white-house": {
    residents: 4, jobs: 500, produces: { mail: 2 }, accepts: ["food", "goods", "mail"],
    source: "White House: the first family and about 100 residence staff, West Wing and visitor staff",
  },
};
