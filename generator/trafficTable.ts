// Every building's passengers and cargo, stated by hand (docs/models/traffic.md):
// residents, jobs and its role in the supply chain - the commodities it makes from
// nothing in tonnes per minute of game time (a primary industry's raw commodity, a
// town's mail), the ones it consumes (`accepts`: towns and sinks) and its recipe
// when it is a processor (`processes`, its rate in tonnes per minute, its stock
// about 10 minutes of input) - at its default parameters, with variants where a
// parameter (a tower's size, a house's storeys, an industry's type) changes them.
// Keyed by the exported model id. The export marks every non-empty block
// `unit: "min"` (traffic.ts exportedBlock).
//
// Tuning (docs/models/traffic.md): the chain runs at 12 x a real hourly figure per
// minute (a standard coal mine fills a 5-wagon train in about a minute); mail stays
// town-scale (about 1 t a minute from a town of some 100 buildings).
// A building of every category but Station and Decor must have an entry
// (traffic.ts mustCarry); the export writes `game.traffic`, `{}` for the rest.
//
// A tourist destination (a cathedral, a castle, a lookout tower) also states
// `visitors`: how many tourists it holds at once and their mean stay in minutes -
// its pull, independent of its staff. The capacities follow the site's fame, from a
// village chapel (30) to Prague Castle and the Louvre (3,000).
//
// The numbers are for the model as drawn at scale 1; the game scales them by the
// building's on-map size itself, so a variant states only what the parameter changes.

import type { BuildingTrafficEntry, Commodity, Recipe } from "./traffic.ts";

/**
 * What every town building takes in: the processed goods, fuel, the building
 * materials (wood, lumber, stone, sand, cement) and mail. One list for homes, shops,
 * offices and landmarks alike, so a delivery to a town never depends on the block.
 */
const TOWN: Commodity[] = ["wood", "stone", "sand", "goods", "steel", "lumber", "cement", "fuel", "mail"];

/**
 * Every factory's recipes: whatever it is delivered, one tonne in, one tonne out.
 * A design states only its shared rate and stock (factory()).
 */
const FACTORY_OUTPUTS: Recipe["outputs"] = { grain: "goods", wood: "lumber", coal: "goods", "iron-ore": "steel", stone: "cement" };
const factory = (rate: number): Recipe => ({ outputs: FACTORY_OUTPUTS, rate, stock: rate * 10 });

export const BUILDING_TRAFFIC: Readonly<Record<string, BuildingTrafficEntry>> = {
  "proc-building-arc-de-triomphe": {
    jobs: 12,
    visitors: { capacity: 800, stayMin: 10 },
    source: "monument: ticket and museum staff in the attic; its tourists are its visitors",
  },
  "proc-building-atomium": {
    jobs: 60, produces: { mail: 0.0083 }, accepts: TOWN,
    visitors: { capacity: 600, stayMin: 15 },
    source: "museum, exhibition and the top-sphere restaurant staff",
  },
  "proc-building-bandstand": {
    jobs: 2,
    visitors: { capacity: 60, stayMin: 10 },
    source: "park bandstand: musicians and a caretaker",
  },
  "proc-building-baroque-church": {
    jobs: 4,
    visitors: { capacity: 150, stayMin: 10 },
    source: "parish church: priest, sexton, organist, verger",
  },
  "proc-building-belfry-of-bruges": {
    jobs: 25, produces: { mail: 0.0083 }, accepts: TOWN,
    visitors: { capacity: 500, stayMin: 10 },
    source: "belfry and its market halls: tower staff, shops and a museum in the halls",
  },
  "proc-building-brandenburg-gate": {
    jobs: 4,
    visitors: { capacity: 800, stayMin: 5 },
    source: "city gate monument: an information point and guards",
  },
  "proc-building-brussels-town-hall": {
    jobs: 300, produces: { mail: 0.2 }, accepts: TOWN,
    visitors: { capacity: 400, stayMin: 10 },
    source: "size: 71 x 49 m, about 4 office floors around the courtyard, city administration and ceremonial rooms",
  },
  "proc-building-castle": {
    residents: 8, jobs: 40, produces: { mail: 0.03 }, accepts: TOWN,
    visitors: { capacity: 600, stayMin: 20 },
    source: "size: 72 x 63 m courtyard castle, a castellan's household and museum, shop and cafe staff",
    variants: [
      { params: { layout: "keep" }, residents: 4, jobs: 15, produces: { mail: 0.0117 }, visitors: { capacity: 300, stayMin: 15 } },
      { params: { layout: "fortress" }, residents: 20, jobs: 70, produces: { mail: 0.0567 }, visitors: { capacity: 1000, stayMin: 25 } },
    ],
  },
  "proc-building-chemical-factory": {
    jobs: 120, processes: { outputs: { oil: "fuel" }, rate: 480, stock: 4800 },
    source: "size: 36 x 28 m process plant: reactors and columns, about 120 operators; a small refinery: crude oil in, fuel out, about 10 minutes of feed in stock; the refinery type a larger one",
    variants: [
      { params: { type: "refinery" }, jobs: 150, processes: { outputs: { oil: "fuel" }, rate: 960, stock: 9600 } },
    ],
  },
  "proc-building-church-vrchlabi": {
    jobs: 4,
    visitors: { capacity: 100, stayMin: 10 },
    source: "town parish church: priest, sexton, organist, verger",
  },
  "proc-building-cloth-hall": {
    jobs: 120, produces: { mail: 0.0333 }, accepts: TOWN,
    visitors: { capacity: 800, stayMin: 15 },
    source: "Krakow Sukiennice: about 40 market stalls on the ground floor and the gallery museum upstairs",
  },
  "proc-building-comm-balcony-house": {
    residents: 8, jobs: 4, produces: { mail: 0.0067 }, accepts: TOWN,
    source: "size: 8 x 10 m, a shop on the ground floor, one 2.5-person flat per upper storey (1.5 when broad)",
    variants: [
      { params: { storeys: "four", width: "broad" }, residents: 11, jobs: 6, produces: { mail: 0.01 } },
      { params: { storeys: "three", width: "compact" }, residents: 5, produces: { mail: 0.005 } },
      { params: { storeys: "three", width: "broad" }, jobs: 6, produces: { mail: 0.0083 } },
      { params: { storeys: "five", width: "compact" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "five", width: "broad" }, residents: 15, jobs: 6, produces: { mail: 0.0117 } },
    ],
  },
  "proc-building-comm-corner-shop": {
    residents: 5, jobs: 4, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 8.5 x 10 m, a corner shop on the ground floor, one 2.5-person flat per upper storey (1.5 when broad)",
    variants: [
      { params: { storeys: "three", width: "broad" }, residents: 8, jobs: 6, produces: { mail: 0.0083 } },
      { params: { storeys: "two", width: "compact" }, residents: 2, produces: { mail: 0.0033 } },
      { params: { storeys: "two", width: "broad" }, residents: 4, jobs: 6, produces: { mail: 0.0067 } },
      { params: { storeys: "four", width: "compact" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "four", width: "broad" }, residents: 11, jobs: 6, produces: { mail: 0.01 } },
    ],
  },
  "proc-building-comm-market-block": {
    residents: 12, jobs: 10, produces: { mail: 0.0133 }, accepts: TOWN,
    source: "size: 14 x 10 m at four bays, market shops on the ground floor (2.5 jobs a bay), flats above (1.5 people a bay and storey)",
    variants: [
      { params: { storeys: "three", bays: "five" }, residents: 15, jobs: 12, produces: { mail: 0.015 } },
      { params: { storeys: "three", bays: "six" }, residents: 18, jobs: 15, produces: { mail: 0.0183 } },
      { params: { storeys: "four", bays: "four" }, residents: 18, produces: { mail: 0.015 } },
      { params: { storeys: "four", bays: "five" }, residents: 22, jobs: 12, produces: { mail: 0.0183 } },
      { params: { storeys: "four", bays: "six" }, residents: 27, jobs: 15, produces: { mail: 0.0233 } },
    ],
  },
  "proc-building-comm-office-house": {
    jobs: 34, produces: { mail: 0.0233 }, accepts: TOWN,
    source: "size: 8 x 11 m (85 m2) floors, a shop on the ground floor and offices above at 1 job per 17 m2",
    variants: [
      { params: { storeys: "seven", width: "broad" }, jobs: 51, produces: { mail: 0.0333 } },
      { params: { storeys: "five", width: "compact" }, jobs: 24, produces: { mail: 0.0167 } },
      { params: { storeys: "five", width: "broad" }, jobs: 36 },
      { params: { storeys: "nine", width: "compact" }, jobs: 44, produces: { mail: 0.03 } },
      { params: { storeys: "nine", width: "broad" }, jobs: 66, produces: { mail: 0.0433 } },
    ],
  },
  "proc-building-comm-terrace-house": {
    residents: 15, jobs: 6, produces: { mail: 0.0117 }, accepts: TOWN,
    source: "size: 14 x 11.5 m, shops on the ground floor, two 2.5-person flats per upper storey",
    variants: [
      { params: { storeys: "three" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "five" }, residents: 20, produces: { mail: 0.0133 } },
    ],
  },
  "proc-building-commercial-annex": {
    residents: 5, jobs: 8, produces: { mail: 0.0083 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor and a shop wing beside it, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay plus 4 in the wing",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 7, produces: { mail: 0.005 } },
      { params: { storeys: "2", width: "standard" }, residents: 3, produces: { mail: 0.0067 } },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 12, produces: { mail: 0.01 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 7, produces: { mail: 0.0067 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 12, produces: { mail: 0.0117 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 7, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.01 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 12, produces: { mail: 0.015 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 7 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.01 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 12, produces: { mail: 0.0167 } },
    ],
  },
  "proc-building-commercial-balcony": {
    residents: 8, jobs: 1, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, flats on every storey, a caretaker's office: 0.85 people a bay and storey, 1 job",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 3, produces: { mail: 0.0017 } },
      { params: { storeys: "2", width: "standard" }, residents: 5, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "wide" }, jobs: 2 },
      { params: { storeys: "3", width: "narrow" }, residents: 5, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "wide" }, residents: 13, jobs: 2, produces: { mail: 0.0083 } },
      { params: { storeys: "4", width: "narrow" }, residents: 7 },
      { params: { storeys: "4", width: "standard" }, residents: 10 },
      { params: { storeys: "4", width: "wide" }, residents: 17, jobs: 2, produces: { mail: 0.01 } },
      { params: { storeys: "5", width: "standard" }, residents: 13, produces: { mail: 0.0067 } },
      { params: { storeys: "5", width: "wide" }, residents: 21, jobs: 2, produces: { mail: 0.0117 } },
    ],
  },
  "proc-building-commercial-baroque": {
    residents: 5, jobs: 4, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.01 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.0117 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.0133 } },
    ],
  },
  "proc-building-commercial-barrel": {
    residents: 5, jobs: 4, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.01 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.0117 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.0133 } },
    ],
  },
  "proc-building-commercial-brick": {
    residents: 5, jobs: 4, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "2", width: "extraWide" }, residents: 7, jobs: 12, produces: { mail: 0.0117 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.01 } },
      { params: { storeys: "3", width: "extraWide" }, residents: 14, jobs: 12, produces: { mail: 0.015 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.0117 } },
      { params: { storeys: "4", width: "extraWide" }, residents: 20, jobs: 12, produces: { mail: 0.0183 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.0133 } },
      { params: { storeys: "5", width: "extraWide" }, residents: 27, jobs: 12, produces: { mail: 0.0217 } },
    ],
  },
  "proc-building-commercial-classical": {
    residents: 5, jobs: 4, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.01 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.0117 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.0133 } },
    ],
  },
  "proc-building-commercial-gable": {
    residents: 5, jobs: 4, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, arcade shops on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.01 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.0117 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.0133 } },
    ],
  },
  "proc-building-commercial-modern": {
    residents: 5, jobs: 4, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.01 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.0117 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.0133 } },
    ],
  },
  "proc-building-commercial-shop": {
    jobs: 6, produces: { mail: 0.0033 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a store on the ground floor, a flat above when two storeys: 0.85 people a bay and storey above the ground floor, 2 jobs a bay",
    variants: [
      { params: { storeys: "1", width: "narrow" }, jobs: 4 },
      { params: { storeys: "1", width: "wide" }, jobs: 10, produces: { mail: 0.0067 } },
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 4 },
      { params: { storeys: "2", width: "standard" }, residents: 3, produces: { mail: 0.005 } },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 10, produces: { mail: 0.0083 } },
    ],
  },
  "proc-building-commercial-tenement": {
    residents: 10, jobs: 4, produces: { mail: 0.0083 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "standard" }, residents: 3, produces: { mail: 0.005 } },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "2", width: "extraWide" }, residents: 7, jobs: 12, produces: { mail: 0.0117 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "standard" }, residents: 5, produces: { mail: 0.005 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.01 } },
      { params: { storeys: "3", width: "extraWide" }, residents: 14, jobs: 12, produces: { mail: 0.015 } },
      { params: { storeys: "4", width: "narrow" }, residents: 5, jobs: 3, produces: { mail: 0.005 } },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.0117 } },
      { params: { storeys: "4", width: "extraWide" }, residents: 20, jobs: 12, produces: { mail: 0.0183 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3, produces: { mail: 0.005 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.0133 } },
      { params: { storeys: "5", width: "extraWide" }, residents: 27, jobs: 12, produces: { mail: 0.0217 } },
    ],
  },
  "proc-building-commercial-terrace": {
    residents: 5, jobs: 4, produces: { mail: 0.005 }, accepts: TOWN,
    source: "size: 3 bays x 9.7 m (83 m2) a storey, a shop on the ground floor, flats above: 0.85 people a bay and storey above the ground floor, 1.5 jobs a bay",
    variants: [
      { params: { storeys: "2", width: "narrow" }, residents: 2, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "2", width: "standard" }, residents: 3 },
      { params: { storeys: "2", width: "wide" }, residents: 4, jobs: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "3", width: "narrow" }, residents: 3, jobs: 3, produces: { mail: 0.0033 } },
      { params: { storeys: "3", width: "wide" }, residents: 8, jobs: 8, produces: { mail: 0.01 } },
      { params: { storeys: "4", width: "narrow" }, jobs: 3 },
      { params: { storeys: "4", width: "standard" }, residents: 8, produces: { mail: 0.0067 } },
      { params: { storeys: "4", width: "wide" }, residents: 13, jobs: 8, produces: { mail: 0.0117 } },
      { params: { storeys: "5", width: "narrow" }, residents: 7, jobs: 3 },
      { params: { storeys: "5", width: "standard" }, residents: 10, produces: { mail: 0.0083 } },
      { params: { storeys: "5", width: "wide" }, residents: 17, jobs: 8, produces: { mail: 0.0133 } },
    ],
  },
  "proc-building-equestrian-statue": {
    jobs: 1,
    visitors: { capacity: 40, stayMin: 5 },
    source: "statue: a caretaker; visitors attracted through jobs",
  },
  "proc-building-gate-of-heavenly-peace": {
    jobs: 40, produces: { mail: 0.0083 }, accepts: ["mail"],
    visitors: { capacity: 1500, stayMin: 10 },
    source: "Tiananmen gate tower: museum, ticket and guard staff",
  },
  "proc-building-gateway-of-india": {
    jobs: 6,
    visitors: { capacity: 800, stayMin: 5 },
    source: "monument: guards and guides",
  },
  "proc-building-hagia-sophia": {
    jobs: 150, produces: { mail: 0.0167 }, accepts: TOWN,
    visitors: { capacity: 2000, stayMin: 15 },
    source: "size: 88 x 87 m mosque and visitor site: imams, attendants, guards and guides",
  },
  "proc-building-half-timbered-town-hall": {
    jobs: 30, produces: { mail: 0.025 }, accepts: TOWN,
    visitors: { capacity: 150, stayMin: 10 },
    source: "size: 22 x 16.5 m, three floors of town offices and a ground-floor tavern",
  },
  "proc-building-hist-colosseum": {
    jobs: 150, produces: { mail: 0.0083 }, accepts: TOWN,
    visitors: { capacity: 2500, stayMin: 20 },
    source: "amphitheatre site: ticket, guard, guide and conservation staff",
  },
  "proc-building-hist-pagoda": {
    residents: 6, jobs: 4, produces: { mail: 0.0033 }, accepts: TOWN,
    visitors: { capacity: 400, stayMin: 10 },
    source: "temple pagoda: monks living in it and temple staff",
  },
  "proc-building-hist-palace": {
    residents: 20, jobs: 200, produces: { mail: 0.1 }, accepts: TOWN,
    visitors: { capacity: 1000, stayMin: 20 },
    source: "size: 73 x 68 m palace: a household of about 20 and court, museum and service staff",
  },
  "proc-building-hospital": {
    jobs: 700, produces: { mail: 0.0833 }, accepts: TOWN,
    source: "size: 68 x 48 m, 7 floors: about 300 beds at 2.3 staff a bed",
  },
  "proc-building-ind-building-a": {
    jobs: 120, processes: factory(180),
    source: "size: 24 x 22 m, multi-storey brick mill at its compact site, about 120 workers; a factory: whatever it is delivered (grain, wood, coal, iron ore, stone), one tonne in, one out; about 10 minutes of input in stock",
    variants: [
      { params: { size: "extended" }, jobs: 180, processes: factory(264) },
    ],
  },
  "proc-building-ind-building-h": {
    jobs: 80, processes: factory(144),
    source: "size: 24 x 22 m single-storey assembly hall, about 80 workers; a factory like every other (FACTORY_OUTPUTS)",
    variants: [
      { params: { size: "extended" }, jobs: 120, processes: factory(216) },
    ],
  },
  "proc-building-ind-building-k": {
    jobs: 70, processes: factory(120),
    source: "size: 24 x 22 m sawtooth workshop, about 70 workers; a factory like every other (FACTORY_OUTPUTS)",
    variants: [
      { params: { size: "extended" }, jobs: 105, processes: factory(180) },
    ],
  },
  "proc-building-ind-building-s": {
    jobs: 25,
    source: "size: 24 x 26 m warehouse with loading docks, about 25 workers; no longer a consumer: goods go to towns",
    variants: [
      { params: { size: "extended" }, jobs: 38 },
    ],
  },
  "proc-building-ind-chimney-basic": {
    jobs: 1,
    source: "a free-standing chimney: a stoker or inspector",
  },
  "proc-building-ind-detail-tank": {
    jobs: 3,
    source: "size: 15 x 11 m tank farm, a few operators; no longer a consumer: fuel goes to towns",
  },
  "proc-building-industry-factory-a": {
    jobs: 200, processes: factory(360),
    source: "size: 28 x 26 m heavy works (foundry), about 200 workers; a factory like every other (FACTORY_OUTPUTS): its iron ore becomes steel",
    variants: [
      { params: { size: "extended" }, jobs: 300, processes: factory(540) },
    ],
  },
  "proc-building-industry-farm": {
    residents: 4, jobs: 6, produces: { grain: 180 }, harvests: "field",
    source: "size: 42 x 30 m arable farm with a field strip and two grain bins, a farming family and a few hands; grain out, from the fields painted around it",
    variants: [
      { params: { size: "large" }, residents: 6, jobs: 10, produces: { grain: 300 } },
    ],
  },
  "proc-building-industry-iron-mine": {
    jobs: 120, produces: { "iron-ore": 360 },
    source: "size: 46 x 32 m iron ore mine head with its crusher house and a bunker over the siding, about 120 miners a shift; iron ore out",
  },
  "proc-building-industry-offshore-platform": {
    jobs: 120, produces: { oil: 1800 },
    source: "offshore oil platform: a crew of about 120 on rotation, some 150 t of crude oil an hour in reality, x12 a minute in game time as the whole chain; oil out only",
  },
  "proc-building-industry-logging-camp": {
    jobs: 15, produces: { wood: 144 }, harvests: "woods",
    source: "size: 44 x 32 m logging camp with four log decks and a loader, a felling crew of about 15; logs out, from the woods around it",
  },
  "proc-building-industry-mine": {
    jobs: 120, produces: { coal: 300 },
    source: "size: 46 x 32 m coal mine head with a bunker over the siding, about 120 miners a shift; coal out",
  },
  "proc-building-industry-oil-pump": {
    jobs: 1, produces: { oil: 36 },
    source: "a single pumpjack: about 3 t of crude oil an hour in reality, x12 a minute in game time as the whole chain, one visiting operator",
    variants: [
      { params: { size: "large" }, produces: { oil: 72 } },
    ],
  },
  "proc-building-industry-power-plant": {
    jobs: 150,
    source: "size: 46 x 38 m gas and oil-fired thermal plant, about 150 staff; takes in no commodity (fuel goes to towns); the coal type burns coal, the nuclear type takes in nothing either",
    variants: [
      { params: { type: "coal" }, jobs: 250, accepts: ["coal"] },
      { params: { type: "nuclear" }, jobs: 600, accepts: [] },
    ],
  },
  "proc-building-industry-quarry": {
    jobs: 60, produces: { stone: 300 },
    source: "size: 46 x 32 m stone quarry: benches cut into a rock face, a crusher plant and loading silos over the siding, about 60 drillers, blasters, drivers and plant staff a shift; crushed stone out",
  },
  "proc-building-industry-sand-pit": {
    jobs: 20, produces: { sand: 240 }, harvests: "sand",
    source: "size: 46 x 32 m sand pit: a loader at the pit face, a washing and screening plant and a loading bin over a road bay, about 20 hands; washed sand out, dug from the sand ground around it",
  },
  "proc-building-industry-wind-turbine": {
    jobs: 1,
    source: "a single wind turbine: a visiting service technician",
  },
  "proc-building-leaning-tower-of-pisa": {
    jobs: 10,
    visitors: { capacity: 1000, stayMin: 10 },
    source: "bell tower open to visitors: ticket and guide staff",
  },
  "proc-building-louvre-pyramid": {
    jobs: 200, produces: { mail: 0.0333 }, accepts: TOWN,
    visitors: { capacity: 3000, stayMin: 25 },
    source: "the museum's main entrance hall: reception, security and shop staff",
  },
  "proc-building-market-cross": {
    jobs: 1,
    visitors: { capacity: 40, stayMin: 5 },
    source: "market cross: a caretaker",
  },
  "proc-building-market-hall": {
    jobs: 80, produces: { mail: 0.0167 }, accepts: TOWN,
    source: "size: 49 x 34 m covered market, about 40 stalls at 2 jobs each",
  },
  "proc-building-nelsons-column": {
    jobs: 1,
    visitors: { capacity: 300, stayMin: 5 },
    source: "column monument: a caretaker",
  },
  "proc-building-notre-dame": {
    jobs: 60, produces: { mail: 0.0083 }, accepts: TOWN,
    visitors: { capacity: 2000, stayMin: 15 },
    source: "cathedral: clergy, sacristans, musicians, guides and guards",
  },
  "proc-building-panel-slab": {
    residents: 120, produces: { mail: 0.06 }, accepts: TOWN,
    source: "size: 34 x 12.5 m, 3 sections x 8 storeys x 2 flats x 2.5 people",
    variants: [
      { params: { sections: "3", storeys: "4" }, residents: 60, produces: { mail: 0.03 } },
      { params: { sections: "3", storeys: "6" }, residents: 90, produces: { mail: 0.045 } },
      { params: { sections: "3", storeys: "12" }, residents: 180, produces: { mail: 0.09 } },
      { params: { sections: "2", storeys: "8" }, residents: 80, produces: { mail: 0.04 } },
      { params: { sections: "2", storeys: "4" }, residents: 40, produces: { mail: 0.02 } },
      { params: { sections: "2", storeys: "6" }, residents: 60, produces: { mail: 0.03 } },
      { params: { sections: "1", storeys: "8" }, residents: 40, produces: { mail: 0.02 } },
      { params: { sections: "1", storeys: "4" }, residents: 20, produces: { mail: 0.01 } },
      { params: { sections: "1", storeys: "6" }, residents: 30, produces: { mail: 0.015 } },
      { params: { sections: "1", storeys: "12" }, residents: 60, produces: { mail: 0.03 } },
    ],
  },
  "proc-building-panel-tower": {
    residents: 120, produces: { mail: 0.06 }, accepts: TOWN,
    source: "size: 16 x 15 m point block, 12 storeys x 4 flats x 2.5 people",
    variants: [
      { params: { storeys: "10" }, residents: 100, produces: { mail: 0.05 } },
      { params: { storeys: "14" }, residents: 140, produces: { mail: 0.07 } },
    ],
  },
  "proc-building-pantheon": {
    jobs: 20, produces: { mail: 0.0033 }, accepts: ["mail"],
    visitors: { capacity: 1200, stayMin: 10 },
    source: "church and visitor site: clergy, guards and guides",
  },
  "proc-building-parthenon": {
    jobs: 25,
    visitors: { capacity: 1500, stayMin: 15 },
    source: "temple ruin on its site: guards, guides and conservators",
  },
  "proc-building-plague-column": {
    jobs: 1,
    visitors: { capacity: 50, stayMin: 5 },
    source: "column monument: a caretaker",
  },
  "proc-building-prague-castle-st-vitus": {
    jobs: 300, produces: { mail: 0.1667 }, accepts: TOWN,
    visitors: { capacity: 3000, stayMin: 25 },
    source: "Prague Castle with St Vitus: the President's office, cathedral clergy, castle guard and visitor staff",
  },
  "proc-building-prague-old-town-hall": {
    jobs: 60, produces: { mail: 0.0333 }, accepts: TOWN,
    visitors: { capacity: 800, stayMin: 10 },
    source: "town hall with the astronomical clock: municipal ceremonial offices, guides and tower staff",
  },
  "proc-building-reichstag": {
    jobs: 1200, produces: { mail: 0.5 }, accepts: TOWN,
    visitors: { capacity: 800, stayMin: 15 },
    source: "size: 140 x 100 m, 4 floors: the Bundestag's plenary, groups' offices and visitor services",
  },
  "proc-building-sky-art-deco": {
    jobs: 800, produces: { mail: 0.5333 }, accepts: TOWN,
    source: "size: 70 m, about 20 setback floors averaging 650 m2 of offices at 1 job per 16 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 344, produces: { mail: 0.23 } },
      { params: { size: "medium" }, jobs: 544, produces: { mail: 0.3633 } },
      { params: { size: "landmark" }, jobs: 1128, produces: { mail: 0.7517 } },
    ],
  },
  "proc-building-sky-brick-residential": {
    residents: 330, jobs: 10, produces: { mail: 0.1717 }, accepts: TOWN,
    source: "size: 70 m, about 22 floors x 6 flats x 2.5 people, a concierge and caretakers; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, residents: 142, jobs: 4, produces: { mail: 0.0733 } },
      { params: { size: "medium" }, residents: 224, jobs: 7, produces: { mail: 0.1167 } },
      { params: { size: "landmark" }, residents: 465, jobs: 14, produces: { mail: 0.2417 } },
    ],
  },
  "proc-building-sky-bullet": {
    jobs: 700, produces: { mail: 0.4667 }, accepts: TOWN,
    source: "size: 70 m, about 20 round floors of 600 m2 offices at 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 301, produces: { mail: 0.2 } },
      { params: { size: "medium" }, jobs: 476, produces: { mail: 0.3167 } },
      { params: { size: "landmark" }, jobs: 987, produces: { mail: 0.6583 } },
    ],
  },
  "proc-building-sky-dark-slab": {
    jobs: 1000, produces: { mail: 0.6667 }, accepts: TOWN,
    source: "size: 70 m, about 20 floors of 35 x 23.5 m slab offices, 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 430, produces: { mail: 0.2867 } },
      { params: { size: "medium" }, jobs: 680, produces: { mail: 0.4533 } },
      { params: { size: "landmark" }, jobs: 1410, produces: { mail: 0.94 } },
    ],
  },
  "proc-building-sky-glass-office": {
    jobs: 900, produces: { mail: 0.6 }, accepts: TOWN,
    source: "size: 70 m, about 18 floors of 28 x 28 m offices at 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 387, produces: { mail: 0.2583 } },
      { params: { size: "medium" }, jobs: 612, produces: { mail: 0.4083 } },
      { params: { size: "landmark" }, jobs: 1269, produces: { mail: 0.8467 } },
    ],
  },
  "proc-building-sky-pagoda": {
    jobs: 500, produces: { mail: 0.3333 }, accepts: TOWN,
    source: "size: 70 m, about 18 tapering octagonal floors averaging 480 m2 of offices at 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 215, produces: { mail: 0.1433 } },
      { params: { size: "medium" }, jobs: 340, produces: { mail: 0.2267 } },
      { params: { size: "landmark" }, jobs: 705, produces: { mail: 0.47 } },
    ],
  },
  "proc-building-sky-pyramid": {
    jobs: 600, produces: { mail: 0.4 }, accepts: TOWN,
    source: "size: 70 m, about 18 tapering floors and two side wings of offices at 1 job per 17 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 258, produces: { mail: 0.1717 } },
      { params: { size: "medium" }, jobs: 408, produces: { mail: 0.2717 } },
      { params: { size: "landmark" }, jobs: 846, produces: { mail: 0.5633 } },
    ],
  },
  "proc-building-sky-terraced": {
    residents: 200, jobs: 150, produces: { mail: 0.2 }, accepts: TOWN,
    source: "size: 70 m, stepped tower: flats in the upper steps (about 80 flats x 2.5 people), offices in the base; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, residents: 86, jobs: 64, produces: { mail: 0.085 } },
      { params: { size: "medium" }, residents: 136, jobs: 102, produces: { mail: 0.1367 } },
      { params: { size: "landmark" }, residents: 282, jobs: 212, produces: { mail: 0.2817 } },
    ],
  },
  "proc-building-sky-twin-towers": {
    jobs: 800, produces: { mail: 0.5333 }, accepts: TOWN,
    source: "size: 70 m, two round towers of about 20 floors x 330 m2 of offices each at 1 job per 16 m2; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, jobs: 344, produces: { mail: 0.23 } },
      { params: { size: "medium" }, jobs: 544, produces: { mail: 0.3633 } },
      { params: { size: "landmark" }, jobs: 1128, produces: { mail: 0.7517 } },
    ],
  },
  "proc-building-sky-twisted": {
    residents: 300, jobs: 15, produces: { mail: 0.16 }, accepts: TOWN,
    source: "size: 70 m twisting residential tower, about 22 floors x 5.5 flats x 2.5 people; size scales with height x plan area (50 m 0.43, 60 m 0.68, 80 m 1.41)",
    variants: [
      { params: { size: "compact" }, residents: 129, jobs: 6, produces: { mail: 0.0683 } },
      { params: { size: "medium" }, residents: 204, jobs: 10, produces: { mail: 0.1083 } },
      { params: { size: "landmark" }, residents: 423, jobs: 21, produces: { mail: 0.225 } },
    ],
  },
  "proc-building-st-basils-cathedral": {
    jobs: 30, produces: { mail: 0.0033 }, accepts: ["mail"],
    visitors: { capacity: 1200, stayMin: 15 },
    source: "cathedral museum: curators, guides, guards and clergy",
  },
  "proc-building-st-nicholas-church": {
    jobs: 6,
    visitors: { capacity: 500, stayMin: 10 },
    source: "town church: clergy, sexton, organist and concert staff",
  },
  "proc-building-statue-of-liberty": {
    jobs: 50, produces: { mail: 0.005 }, accepts: TOWN,
    visitors: { capacity: 1500, stayMin: 20 },
    source: "statue on its star fort: National Park rangers, security and concession staff",
  },
  "proc-building-taj-mahal": {
    jobs: 200, produces: { mail: 0.0083 }, accepts: ["mail"],
    visitors: { capacity: 2500, stayMin: 20 },
    source: "mausoleum complex: guards, guides, gardeners and conservators",
  },
  "proc-building-temple-of-heaven": {
    jobs: 60, produces: { mail: 0.005 }, accepts: ["mail"],
    visitors: { capacity: 1500, stayMin: 15 },
    source: "temple complex in its park: guards, guides and park staff",
  },
  "proc-building-tower-bell": {
    jobs: 2,
    visitors: { capacity: 100, stayMin: 10 },
    source: "bell tower: a bell-ringer and caretaker",
  },
  "proc-building-tower-bigben": {
    jobs: 10,
    visitors: { capacity: 800, stayMin: 10 },
    source: "clock tower: clock keepers, guides and guards",
  },
  "proc-building-tower-eiffel": {
    jobs: 500, produces: { mail: 0.0167 }, accepts: TOWN,
    visitors: { capacity: 2500, stayMin: 20 },
    source: "Eiffel Tower operator staff (about 360) and its restaurants and shops",
  },
  "proc-building-tower-kenney": {
    residents: 2, jobs: 1, produces: { mail: 0.0017 }, accepts: TOWN,
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
    residents: 3, jobs: 1, produces: { mail: 0.0017 }, accepts: TOWN,
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
    visitors: { capacity: 80, stayMin: 15 },
    source: "watch tower: two lookouts or guards",
  },
  "proc-building-twin-tower-baroque-church": {
    jobs: 6,
    visitors: { capacity: 300, stayMin: 10 },
    source: "large baroque church: clergy, sexton, organist and guides",
  },
  "proc-building-us-capitol": {
    jobs: 2000, produces: { mail: 0.8333 }, accepts: TOWN,
    visitors: { capacity: 800, stayMin: 15 },
    source: "United States Capitol: members' and committee staff, Capitol Police and visitor centre in the 195 x 104 m building",
  },
  "proc-building-village-alpine-hut": {
    residents: 3, produces: { mail: 0.0017 }, accepts: TOWN,
    source: "size: 7 x 7 m mountain hut, a herder family or a hut warden's household",
    variants: [
      { params: { storeys: "one" }, residents: 2 },
    ],
  },
  "proc-building-village-chapel": {
    jobs: 1,
    visitors: { capacity: 30, stayMin: 5 },
    source: "village chapel: a sexton",
  },
  "proc-building-village-cottage": {
    residents: 4, produces: { mail: 0.0017 }, accepts: TOWN,
    source: "size: 10 x 9 m two-storey cottage, one family",
    variants: [
      { params: { storeys: "one" }, residents: 2 },
    ],
  },
  "proc-building-village-family-house": {
    residents: 4, produces: { mail: 0.0017 }, accepts: TOWN,
    source: "size: 13.6 x 10 m family house, one family",
    variants: [
      { params: { annex: "wing" }, residents: 5 },
    ],
  },
  "proc-building-village-l-house": {
    residents: 4, produces: { mail: 0.0017 }, accepts: TOWN,
    source: "size: 11 x 10.6 m L-shaped house, one family",
    variants: [
      { params: { storeys: "one" }, residents: 3 },
    ],
  },
  "proc-building-village-modern-house": {
    residents: 4, produces: { mail: 0.0017 }, accepts: TOWN,
    source: "size: 15 x 9.4 m modern house, one family",
    variants: [
      { params: { storeys: "one" }, residents: 3 },
    ],
  },
  "proc-building-village-narrow-house": {
    residents: 3, produces: { mail: 0.0017 }, accepts: TOWN,
    source: "size: 7.4 x 11 m narrow house, a small family",
    variants: [
      { params: { storeys: "three" }, residents: 5 },
    ],
  },
  "proc-building-village-timber-cottage": {
    residents: 3, produces: { mail: 0.0017 }, accepts: TOWN,
    source: "size: 8.4 x 9.5 m timber cottage, a small family",
  },
  "proc-building-village-timber-house": {
    residents: 4, produces: { mail: 0.0017 }, accepts: TOWN,
    source: "size: 9.2 x 11.5 m timber house, one family",
  },
  "proc-building-war-memorial": {
    jobs: 1,
    visitors: { capacity: 50, stayMin: 5 },
    source: "memorial: a caretaker; visitors attracted through jobs",
  },
  "proc-building-white-house": {
    residents: 4, jobs: 500, produces: { mail: 0.3333 }, accepts: TOWN,
    visitors: { capacity: 500, stayMin: 10 },
    source: "White House: the first family and about 100 residence staff, West Wing and visitor staff",
  },
};
