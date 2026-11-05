// Locomotive-hauled coaches of the eight countries' families on the passenger
// car builder (usTransit.ts drawCar), stated in a few measures: the length over
// the buffers, the body, the window row of each type of car (`unit`), the end
// doors, the bogies, the coupler and the liveries. See docs/models/world-coaches.md.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { paint, type BogieSpec } from "./dieselParts.ts";
import { block } from "./vehicleParts.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE } from "./carbodyKit.ts";
import { carLod, drawCar, type CarDef } from "./usTransit.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";

type Band = readonly [number, number, string];

export interface CoachType {
  title: string;
  /** Windows: how many a side, their width; a second row for a double-deck car. */
  windows: number;
  windowW: number;
  number: string;
  weight: number;
}

export interface CoachLivery {
  title: string;
  palette: Record<string, MaterialSpec>;
  bands: readonly Band[];
  roof: string;
  skirt: string;
}

export interface WorldCoach {
  /** Over the buffers (couplers); the body's half width, belly, eaves and crown, skirt bottom and top. */
  length: number;
  W: number;
  Y: number;
  S: number;
  C: number;
  B: number;
  A: number;
  /** The window rows' sill and head (two for a double-deck car). */
  rows: ReadonlyArray<readonly [number, number]>;
  /** The doors at each end (d from the body's end), their width and sill and head. */
  doorIn: number;
  doorW: number;
  door: readonly [number, number];
  bogieCentres: number;
  wheelR: number;
  wheelbase: number;
  coupler: "buffers" | "knuckle" | "centre";
  types: Record<string, CoachType>;
  liveries: Record<string, CoachLivery>;
  maxspeed: number;
}

const GAP = 0.65;
const gapOf = (s: WorldCoach) => (s.coupler === "buffers" ? GAP : 0.35);
const truck = (s: WorldCoach): BogieSpec => ({
  axles: [-s.wheelbase / 2, s.wheelbase / 2], wheelR: s.wheelR, frameHalf: s.wheelbase / 2 + s.wheelR + 0.15, frameTop: s.wheelR + 0.42, frameBottom: s.wheelR + 0.08,
  frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.4, 0.4], secondaryZ: 1.08, bolster: s.B,
});

function coachDef(s: WorldCoach, t: CoachType, l: CoachLivery): CarDef {
  // the bogie's brake cylinders stand 0.55 m inside its axles: a shorter wheelbase puts them on its transoms
  if (s.wheelbase < 2.05) throw new Error(`coach: wheelbase ${s.wheelbase} m is shorter than the bogie kit's 2.05 m`);
  const L = s.length - 2 * gapOf(s);
  const tr = [L / 2 - s.bogieCentres / 2, L / 2 + s.bogieCentres / 2];
  const from = s.doorIn + s.doorW + 0.5, to = L - s.doorIn - s.doorW - 0.5;
  const spans = Array.from({ length: t.windows }, (_, i): [number, number] => { const d = from + (to - from) * ((i + 0.5) / t.windows); return [d - t.windowW / 2, d + t.windowW / 2]; });
  const reach = s.wheelbase / 2 + s.wheelR + 0.25;
  return {
    spec: { length: L, W: s.W, Y: s.Y, S: s.S, C: s.C, lean: 0.98, arc: 6, B: s.B, wl: s.W * 0.95, A: s.A, wa: s.W * 0.99, edges: [], step: 1.0, cuts: tr.map((d) => [d - reach, d + reach] as const) },
    bands: l.bands, roof: l.roof, skirt: l.skirt, under: "under",
    windows: s.rows.map((y) => ({ y, spans, frame: "rubber" })),
    doors: { spans: [[s.doorIn, s.doorIn + s.doorW], [L - s.doorIn - s.doorW, L - s.doorIn]], y: s.door, glass: [s.rows[0]![0] + 0.05, s.rows[0]![1] - 0.05] },
    cabEnds: [], diaphragm: [s.door[0], s.door[1] + 0.2],
    trucks: tr, truck: truck(s),
    coupler: s.coupler, couplerY: s.coupler === "buffers" ? 1.03 : 0.88, gap: [gapOf(s), gapOf(s)],
    lettering: [{ text: t.number, d: L / 2, y: s.Y + 0.12, h: 0.1, mat: "lettering" }],
    extras: (m, _b, X) => m.scope("underfloor", () => block(m, "under", X(L / 2 + 3.5), X(L / 2 - 3.5), s.B - 0.4, s.B, -s.W * 0.75, s.W * 0.75)),
  };
}

const PALETTE: Record<string, MaterialSpec> = { ...INTERIOR_PALETTE, ...CARBODY_PALETTE, under: paint("#2a2c2f", 0.85), lettering: paint("#2a2c30") };

export function coachParams(s: WorldCoach): ParamSpec[] {
  const out = [enumParam("unit", "Car", Object.fromEntries(Object.entries(s.types).map(([k, v]) => [k, v.title])))];
  if (Object.keys(s.liveries).length > 1) out.push(enumParam("livery", "Livery", Object.fromEntries(Object.entries(s.liveries).map(([k, v]) => [k, v.title]))));
  return out;
}

function pick(s: WorldCoach, params: readonly ParamSpec[], v?: ParamValues): { t: CoachType; l: CoachLivery } {
  const p = resolveParams(params, v);
  return { t: s.types[p.unit!]!, l: s.liveries[p.livery ?? Object.keys(s.liveries)[0]!]! };
}

export function buildCoach(s: WorldCoach, params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { t, l } = pick(s, params, v);
  const m = new MeshBuilder({ ...PALETTE, ...l.palette });
  drawCar(m, coachDef(s, t, l), (d) => s.length / 2 - gapOf(s) - d);
  return m;
}

export function buildCoachLod(s: WorldCoach, params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { t, l } = pick(s, params, v);
  return carLod(coachDef(s, t, l), (d) => s.length / 2 - gapOf(s) - d, { ...CARBODY_PALETTE, under: PALETTE.under!, ...l.palette });
}

export function coachGame(s: WorldCoach): GameProperties {
  const [first, ...rest] = Object.entries(s.types);
  return { weight: first![1].weight, power: 0, maxspeed: s.maxspeed, accel: null, variants: rest.map(([unit, t]) => ({ params: { unit }, weight: t.weight })) };
}

export const coachDesign = (id: string, title: string, s: WorldCoach, params: ParamSpec[], build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, references: string, loadingGauge?: "us"): ProceduralDesign => ({
  id, title, build, buildLod, params, game: coachGame(s), catalog: COACH_CATALOG, references, ...(loadingGauge ? { loadingGauge } : {}),
});

const c = (hex: string, r = 0.45) => paint(hex, r);

// ---------------------------------------------------------------------------
// Germany: the Intercity coaches (Avmz first class, Bpmz second class, 26.4 m)

export const DB_IC: WorldCoach = {
  length: 26.4, W: 1.41, Y: 1.4, S: 3.2, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.85]], doorIn: 0.7, doorW: 0.75, door: [1.2, 3.1],
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 200,
  types: {
    avmz: { title: "First class", windows: 11, windowW: 1.4, number: "61 80 19-91 001-2", weight: 47 },
    bpmz: { title: "Second class", windows: 12, windowW: 1.25, number: "61 80 22-91 101-3", weight: 45 },
  },
  liveries: {
    tee: { title: "TEE", palette: { red: c("#8a1c2b"), beige: c("#e3d3a6"), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "red"], [1.85, 2.95, "beige"], [2.95, 9, "red"]], roof: "roofG", skirt: "skirtG" },
    oceanBlue: { title: "Ocean blue", palette: { blue: c("#104058"), beige: c("#e3d3a6"), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "blue"], [1.85, 2.95, "beige"], [2.95, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
    intercity: { title: "Intercity", palette: { white: c("#eceeee", 0.35), red: c("#ec0016"), roofG: c("#b9bdc0", 0.6), skirtG: c("#4a4d50", 0.7) }, bands: [[0, 1.7, "white"], [1.7, 1.84, "red"], [1.84, 9, "white"]], roof: "roofG", skirt: "skirtG" },
  },
};

// ---------------------------------------------------------------------------
// France: the Corail (VTU), the Grand Confort and the Wagons-Lits cars

export const SNCF_CORAIL: WorldCoach = {
  length: 26.4, W: 1.42, Y: 1.4, S: 3.25, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.8]], doorIn: 0.7, doorW: 0.8, door: [1.2, 3.1],
  bogieCentres: 18.4, wheelR: 0.45, wheelbase: 2.56, coupler: "buffers", maxspeed: 200,
  types: {
    a10tu: { title: "First class", windows: 12, windowW: 1.3, number: "A10TU 50 87 19-70 110-4", weight: 42 },
    b11tu: { title: "Second class", windows: 13, windowW: 1.2, number: "B11TU 50 87 21-70 412-4", weight: 42 },
  },
  liveries: {
    corail: { title: "Corail", palette: { grey: c("#9aa0a5", 0.45), white: c("#efefea", 0.4), orange: c("#e8701e"), roofG: c("#6a6c6e", 0.7), skirtG: c("#3a3d40", 0.8) }, bands: [[0, 1.82, "grey"], [1.82, 1.9, "orange"], [1.9, 9, "white"]], roof: "roofG", skirt: "skirtG" },
    teoz: { title: "Teoz", palette: { dark: c("#3f4448", 0.45), white: c("#efefea", 0.4), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "dark"], [1.85, 9, "white"]], roof: "roofG", skirt: "skirtG" },
  },
};

export const SNCF_GRAND_CONFORT: WorldCoach = {
  length: 24.5, W: 1.43, Y: 1.4, S: 3.25, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.8]], doorIn: 0.7, doorW: 0.75, door: [1.2, 3.1],
  bogieCentres: 17.2, wheelR: 0.45, wheelbase: 2.56, coupler: "buffers", maxspeed: 200,
  types: {
    a8u: { title: "Compartments", windows: 9, windowW: 1.6, number: "A8U 61 87 19-70 001-7", weight: 46 },
    a7d: { title: "Bar car", windows: 7, windowW: 1.9, number: "A7DU 61 87 89-70 001-2", weight: 48 },
  },
  liveries: {
    capitole: { title: "Capitole", palette: { red: c("#b5232b"), grey: c("#9aa0a5", 0.45), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "red"], [1.85, 2.9, "grey"], [2.9, 9, "red"]], roof: "roofG", skirt: "skirtG" },
    tee: { title: "TEE", palette: { red: c("#8a1c2b"), beige: c("#e3d3a6"), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "red"], [1.85, 2.9, "beige"], [2.9, 9, "red"]], roof: "roofG", skirt: "skirtG" },
  },
};

export const CIWL: WorldCoach = {
  length: 23.45, W: 1.43, Y: 1.4, S: 3.3, C: 4.05, B: 1.0, A: 1.15, rows: [[1.9, 2.75]], doorIn: 0.7, doorW: 0.75, door: [1.2, 3.05],
  bogieCentres: 16.5, wheelR: 0.5, wheelbase: 3.0, coupler: "buffers", maxspeed: 140,
  types: {
    pullman: { title: "Pullman car", windows: 9, windowW: 1.25, number: "4141", weight: 52 },
    sleeping: { title: "Sleeping car", windows: 10, windowW: 0.8, number: "3425", weight: 56 },
  },
  liveries: {
    pullman: { title: "Pullman", palette: { blue: c("#1d2a5a"), cream: c("#e8dcc0"), gold: c("#c9a55a", 0.35), roofG: c("#3a3d40", 0.7), skirtG: c("#1d2a5a", 0.6) }, bands: [[0, 1.82, "blue"], [1.82, 1.86, "gold"], [1.86, 2.95, "cream"], [2.95, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
    ciwlBlue: { title: "CIWL blue", palette: { blue: c("#1d2a5a"), gold: c("#c9a55a", 0.35), roofG: c("#3a3d40", 0.7), skirtG: c("#1d2a5a", 0.6) }, bands: [[0, 3.05, "blue"], [3.05, 3.09, "gold"], [3.09, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
  },
};

// ---------------------------------------------------------------------------
// The Netherlands: the ICR (Intercity rijtuig)

export const NS_ICR: WorldCoach = {
  length: 26.4, W: 1.42, Y: 1.4, S: 3.25, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.85]], doorIn: 0.7, doorW: 0.8, door: [1.2, 3.1],
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 160,
  types: {
    a: { title: "First class", windows: 11, windowW: 1.35, number: "A 7101", weight: 41 },
    b: { title: "Second class", windows: 12, windowW: 1.25, number: "B 7201", weight: 40 },
  },
  liveries: {
    yellowGrey: { title: "NS yellow, grey", palette: { yellow: c("#ffc917"), grey: c("#6f757a"), roofG: c("#8f9396", 0.6), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.75, "grey"], [1.75, 9, "yellow"]], roof: "roofG", skirt: "skirtG" },
    yellowBlue: { title: "NS yellow, blue", palette: { yellow: c("#ffc917"), blue: c("#003082"), roofG: c("#8f9396", 0.6), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.75, "blue"], [1.75, 9, "yellow"]], roof: "roofG", skirt: "skirtG" },
  },
};

// ---------------------------------------------------------------------------
// Switzerland: the EW IV, the IC 2000 double-deck coach and the metre-gauge Glacier Express

const sbbBands = (o: { white?: string; grey?: string; red?: string } = {}): CoachLivery => ({
  title: "SBB", palette: { white: c(o.white ?? "#f1f1ee", 0.4), grey: c(o.grey ?? "#4d5257"), red: c(o.red ?? "#eb0000"), roofG: c("#9aa0a5", 0.6), skirtG: c("#3a3d40", 0.8) },
  bands: [[0, 1.6, "grey"], [1.6, 1.72, "red"], [1.72, 9, "white"]], roof: "roofG", skirt: "skirtG",
});

export const SBB_EW4: WorldCoach = {
  length: 26.4, W: 1.41, Y: 1.4, S: 3.25, C: 4.05, B: 1.0, A: 1.15, rows: [[1.95, 2.85]], doorIn: 0.7, doorW: 0.8, door: [1.2, 3.1],
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 200,
  types: {
    a: { title: "First class", windows: 11, windowW: 1.35, number: "50 85 19-73 101-5", weight: 43 },
    b: { title: "Second class", windows: 12, windowW: 1.25, number: "50 85 20-73 201-3", weight: 42 },
  },
  liveries: {
    redGrey: { title: "Red and grey", palette: { red: c("#c8102e"), grey: c("#9aa0a5", 0.45), roofG: c("#6a6c6e", 0.7), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.85, "red"], [1.85, 9, "grey"]], roof: "roofG", skirt: "skirtG" },
    sbb: sbbBands(),
  },
};

export const SBB_IC2000: WorldCoach = {
  length: 26.8, W: 1.4, Y: 1.2, S: 3.85, C: 4.6, B: 0.7, A: 0.9, rows: [[1.25, 1.95], [2.85, 3.55]], doorIn: 3.3, doorW: 1.3, door: [1.0, 3.05],
  bogieCentres: 20.0, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 200,
  types: {
    a: { title: "First class", windows: 10, windowW: 1.4, number: "50 85 26-94 001-8", weight: 50 },
    b: { title: "Second class", windows: 11, windowW: 1.3, number: "50 85 26-94 101-6", weight: 49 },
  },
  liveries: { sbb: sbbBands() },
};

export const GLACIER: WorldCoach = {
  length: 18.4, W: 1.32, Y: 1.25, S: 2.65, C: 3.55, B: 0.85, A: 1.0, rows: [[1.6, 3.3]], doorIn: 0.6, doorW: 0.75, door: [1.05, 2.9],
  bogieCentres: 12.5, wheelR: 0.38, wheelbase: 2.2, coupler: "centre", maxspeed: 90,
  types: {
    first: { title: "First class", windows: 6, windowW: 2.1, number: "A 4021", weight: 21 },
    second: { title: "Second class", windows: 7, windowW: 1.8, number: "B 4041", weight: 20 },
  },
  liveries: { glacier: { title: "Glacier Express", palette: { red: c("#c8102e"), white: c("#f1f1ee", 0.4), roofG: c("#3a3d40", 0.6), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.45, "red"], [1.45, 9, "white"]], roof: "roofG", skirt: "skirtG" } },
};

const P = { ew4: coachParams(SBB_EW4), ic2000: coachParams(SBB_IC2000), glacier: coachParams(GLACIER), nsIcr: coachParams(NS_ICR), dbIc: coachParams(DB_IC), corail: coachParams(SNCF_CORAIL), grandConfort: coachParams(SNCF_GRAND_CONFORT), ciwl: coachParams(CIWL) };
export function sncfCorail(v?: ParamValues): MeshBuilder { return buildCoach(SNCF_CORAIL, P.corail, v); }
export function sncfCorailLod(v?: ParamValues): MeshBuilder { return buildCoachLod(SNCF_CORAIL, P.corail, v); }
export function sncfGrandConfort(v?: ParamValues): MeshBuilder { return buildCoach(SNCF_GRAND_CONFORT, P.grandConfort, v); }
export function sncfGrandConfortLod(v?: ParamValues): MeshBuilder { return buildCoachLod(SNCF_GRAND_CONFORT, P.grandConfort, v); }
export function nsIcr(v?: ParamValues): MeshBuilder { return buildCoach(NS_ICR, P.nsIcr, v); }
export function nsIcrLod(v?: ParamValues): MeshBuilder { return buildCoachLod(NS_ICR, P.nsIcr, v); }
export function sbbEw4(v?: ParamValues): MeshBuilder { return buildCoach(SBB_EW4, P.ew4, v); }
export function sbbEw4Lod(v?: ParamValues): MeshBuilder { return buildCoachLod(SBB_EW4, P.ew4, v); }
export function sbbIc2000(v?: ParamValues): MeshBuilder { return buildCoach(SBB_IC2000, P.ic2000, v); }
export function sbbIc2000Lod(v?: ParamValues): MeshBuilder { return buildCoachLod(SBB_IC2000, P.ic2000, v); }
export function glacierExpress(v?: ParamValues): MeshBuilder { return buildCoach(GLACIER, P.glacier, v); }
export function glacierExpressLod(v?: ParamValues): MeshBuilder { return buildCoachLod(GLACIER, P.glacier, v); }
export function ciwlCar(v?: ParamValues): MeshBuilder { return buildCoach(CIWL, P.ciwl, v); }
export function ciwlCarLod(v?: ParamValues): MeshBuilder { return buildCoachLod(CIWL, P.ciwl, v); }
export function dbIcCoach(v?: ParamValues): MeshBuilder { return buildCoach(DB_IC, P.dbIc, v); }
export function dbIcCoachLod(v?: ParamValues): MeshBuilder { return buildCoachLod(DB_IC, P.dbIc, v); }

export const WORLD_COACHES: ProceduralDesign[] = [
  coachDesign("proc-vehicle-db-ic-coach", "DB Intercity coach", DB_IC, P.dbIc, dbIcCoach, dbIcCoachLod, "db-ic-coach"),
  coachDesign("proc-vehicle-sncf-corail-coach", "SNCF Corail coach", SNCF_CORAIL, P.corail, sncfCorail, sncfCorailLod, "sncf-corail-coach"),
  coachDesign("proc-vehicle-sncf-grand-confort", "SNCF Grand Confort", SNCF_GRAND_CONFORT, P.grandConfort, sncfGrandConfort, sncfGrandConfortLod, "sncf-grand-confort"),
  coachDesign("proc-vehicle-ns-icr-coach", "NS ICR coach", NS_ICR, P.nsIcr, nsIcr, nsIcrLod, "ns-icr-coach"),
  coachDesign("proc-vehicle-sbb-ew4-coach", "SBB EW IV coach", SBB_EW4, P.ew4, sbbEw4, sbbEw4Lod, "sbb-ew4-coach"),
  coachDesign("proc-vehicle-sbb-ic2000", "SBB IC 2000 coach", SBB_IC2000, P.ic2000, sbbIc2000, sbbIc2000Lod, "sbb-ic2000"),
  coachDesign("proc-vehicle-glacier-express", "Glacier Express coach", GLACIER, P.glacier, glacierExpress, glacierExpressLod, "glacier-express"),
  coachDesign("proc-vehicle-ciwl-car", "Wagons-Lits car", CIWL, P.ciwl, ciwlCar, ciwlCarLod, "ciwl-car"),
];
