// JNR locomotives and the Blue Train: the C62 4-6-4 express and the D51 2-8-2
// freight steam locomotives (the steam kit, steamLoco.ts), the EF66 Bo-Bo-Bo
// electric (the carbody kit), the DD51 centre-cab diesel (the hood unit kit,
// usHoodKit.ts) and a 24-series Blue Train sleeper coach (the car builder,
// usTransit.ts). Narrow-gauge (1,067 mm) prototypes at their real body size on
// the game's standard-gauge wheelsets (docs/models/jr-kiha40.md, "Gauge"), inside
// the UIC gauge. See docs/models/jnr-locos.md.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildLoco, type LocoSpec } from "./steamLoco.ts";
import type { Steam } from "./steamParts.ts";
import { STEAM_CATALOG, UNIT_PARAM } from "./steamLocos.ts";
import { steamLocoLod } from "./lodSteam.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { bogieGeometry, paint, type BogieSpec } from "./dieselParts.ts";
import { block } from "./vehicleParts.ts";
import { sideDecal, sideLettering, sidePanel } from "./sliceBody.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, type CarbodySpec, type NoseShape } from "./carbodyKit.ts";
import { bodyHalf, cabFaceLod, drawCabFace, type FacePaint, type FaceRect, type SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildUsHood, knuckleCoupler, usHoodLod, type UsHoodSpec, type UsLivery } from "./usHoodKit.ts";
import { diamond } from "./czElectricKit.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { drawCar, type CarDef } from "./usTransit.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, pantographParts, type UnitBody } from "./lodUnits.ts";

const c = (hex: string, r = 0.5) => paint(hex, r);
const COUPLER_Y = 0.88;

// ---------------------------------------------------------------------------
// Steam: C62 and D51

const JNR_STEAM: Record<string, MaterialSpec> = {
  paint: c("#1d1e20", 0.6), wheel: c("#1d1e20", 0.6), frame: c("#1d1e20", 0.65), lining: c("#e8e6df"),
  plate: c("#1d1e20", 0.6), plateText: c("#d9d0b0", 0.4), knuckle: c("#3a3b3d", 0.7), handrail: c("#c9ccce", 0.5),
};

/** The front buffer beam with its automatic coupler, the headlight on the smokebox top. */
function jnrFront(t: Steam, headX: number, headY: number): void {
  t.m.scope("front beam", () => {
    t.box("beam", 0.15, 0.4, 0.75, 1.15, -1.3, 1.3);
    knuckleCoupler(t.m, 1, t.X(0) - 0.6, t.X(0), COUPLER_Y);
  });
  t.m.scope("headlight", () => {
    t.cylX("black", headX + 0.35, headX - 0.02, 0, headY, 0.2, 12);
    t.cylX("lampHead", headX - 0.03, headX - 0.06, 0, headY, 0.15, 12);
  });
}

function c62Spec(): LocoSpec {
  return {
    title: "JNR C62",
    palette: JNR_STEAM,
    heads: [0, 13.6],
    beams: { front: false, rear: false },
    boiler: { x0: 1.0, x1: 10.3, y: 2.75, r: 0.86, smokebox: 1.6, bands: [4.0, 6.0, 8.0] },
    chimney: { x: 2.0, top: 3.95, r: 0.26 },
    domes: [{ x: 4.7, top: 3.88, r: 0.38, len: 2.3 }],
    valves: { x: 9.3, top: 3.82 },
    handrail: { x0: 2.0, x1: 10.1, y: 2.95 },
    runningBoard: { profile: [[0.4, 1.4], [1.5, 1.4], [2.1, 1.95], [10.6, 1.95]], half: 1.4, valance: 0.08 },
    frame: { x0: 0.5, x1: 13.0, top: 1.85 },
    cab: {
      x0: 10.3, x1: 12.9, half: [[1.45, 1.8], [1.45, 3.5], [1.25, 3.78], [0.8, 3.93], [0, 3.98]], roofY: 3.75,
      windows: [{ x0: 10.6, x1: 11.4, y0: 2.75, y1: 3.35 }, { x0: 11.6, x1: 12.4, y0: 2.75, y1: 3.35 }],
      front: [{ z0: 0.8, z1: 1.2, y0: 2.95, y1: 3.4 }, { z0: -1.2, z1: -0.8, y0: 2.95, y1: 3.4 }],
    },
    prisms: [{ name: "firebox", x0: 8.8, x1: 10.3, half: [[1.0, 2.0], [1.0, 3.0], [0.85, 3.45], [0.5, 3.62], [0, 3.66]] }],
    // the large smoke deflectors of the express engines
    deflectors: { outlines: [[[0.9, 2.0], [2.7, 2.0], [2.7, 3.55], [1.25, 3.55], [0.9, 3.2]]], z: 1.3 },
    bogies: [{ x0: 1.2, x1: 3.6, y: 0.55 }, { x0: 10.5, x1: 12.8, y: 0.58 }],
    gear: {
      wheels: [
        { x: 1.75, d: 0.86, spokes: 10, outsideBoxes: true },
        { x: 3.05, d: 0.86, spokes: 10, outsideBoxes: true },
        { x: 4.7, d: 1.75, spokes: 20 },
        { x: 6.65, d: 1.75, spokes: 20 },
        { x: 8.6, d: 1.75, spokes: 20 },
        { x: 11.0, d: 0.92, spokes: 12, outsideBoxes: true },
        { x: 12.3, d: 0.92, spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 1.9, x1: 2.9, y: 1.0, r: 0.33 }, crank: 0.33, phase: 0.4, valveGear: true }],
      cylinderZ: 1.1, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: "C62 2", side: [11.6, 2.45, 1.45], front: [0.98, 2.45] },
    extras: (t) => {
      jnrFront(t, 1.15, 3.55);
      t.m.scope("drawbar", () => t.box("black", 12.9, 13.6, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function c62TenderSpec(): LocoSpec {
  return {
    title: "JNR C62 tender",
    palette: JNR_STEAM,
    heads: [0, 8.9],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 8.5, top: 1.2 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 8.4, half: [[1.4, 1.2], [1.4, 2.95]] },
      { name: "coal sides", x0: 0.5, x1: 5.5, half: [[1.4, 2.95], [1.3, 3.3]] },
    ],
    coal: { x0: 0.7, x1: 5.3, y: 3.3, half: 1.15, rise: 0.35 },
    bogies: [{ x0: 0.7, x1: 3.5, y: 0.55 }, { x0: 5.3, x1: 8.1, y: 0.55 }],
    gear: { wheels: [1.3, 2.9, 5.9, 7.5].map((x) => ({ x, d: 0.86, spokes: 0 })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[8.42, 2.6, 0]] },
    extras: (t) => t.m.scope("rear beam", () => { t.box("beam", 8.4, 8.55, 0.75, 1.15, -1.3, 1.3); knuckleCoupler(t.m, -1, -t.X(8.9) - 0.6, -t.X(8.9), COUPLER_Y); }),
  };
}

export type D51Variant = "standard" | "namekuji";
const D51_PARAMS: ParamSpec[] = [UNIT_PARAM, enumParam("variant", "Type", { standard: "Standard", namekuji: "Namekuji" })];

function d51Spec(variant: D51Variant): LocoSpec {
  return {
    title: "JNR D51",
    palette: JNR_STEAM,
    heads: [0, 11.6],
    beams: { front: false, rear: false },
    boiler: { x0: 0.9, x1: 8.6, y: 2.6, r: 0.82, smokebox: 1.5, bands: [3.6, 5.6, 7.4] },
    chimney: { x: 1.8, top: 3.95, r: 0.26 },
    // the standard engine's separate sand and steam domes, or the early "namekuji" (slug) casing from the chimney back
    domes: variant === "namekuji" ? [{ x: 3.6, top: 3.82, r: 0.36, len: 3.2 }] : [{ x: 3.6, top: 3.85, r: 0.36 }, { x: 5.2, top: 3.85, r: 0.38 }],
    valves: { x: 7.7, top: 3.65 },
    handrail: { x0: 1.8, x1: 8.4, y: 2.8 },
    runningBoard: { profile: [[0.4, 1.35], [1.3, 1.35], [1.8, 1.9], [8.9, 1.9]], half: 1.4, valance: 0.08 },
    frame: { x0: 0.5, x1: 11.0, top: 1.8 },
    cab: {
      x0: 8.6, x1: 11.0, half: [[1.45, 1.75], [1.45, 3.5], [1.25, 3.78], [0.8, 3.93], [0, 3.98]], roofY: 3.75,
      windows: [{ x0: 8.9, x1: 9.6, y0: 2.75, y1: 3.35 }, { x0: 9.8, x1: 10.5, y0: 2.75, y1: 3.35 }],
      front: [{ z0: 0.8, z1: 1.2, y0: 2.95, y1: 3.4 }, { z0: -1.2, z1: -0.8, y0: 2.95, y1: 3.4 }],
    },
    prisms: [{ name: "firebox", x0: 7.2, x1: 8.6, half: [[0.95, 2.0], [0.95, 2.95], [0.8, 3.35], [0.5, 3.5], [0, 3.55]] }],
    deflectors: { outlines: [[[0.8, 1.95], [2.3, 1.95], [2.3, 3.3], [1.1, 3.3], [0.8, 3.0]]], z: 1.3 },
    bogies: [{ x0: 1.6, x1: 2.8, y: 0.55 }],
    gear: {
      wheels: [
        { x: 2.2, d: 0.86, spokes: 10, outsideBoxes: true },
        { x: 3.85, d: 1.4, spokes: 16 },
        { x: 5.4, d: 1.4, spokes: 16 },
        { x: 6.95, d: 1.4, spokes: 16 },
        { x: 8.5, d: 1.4, spokes: 16 },
        { x: 10.2, d: 1.07, spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 1.4, x1: 2.4, y: 0.95, r: 0.33 }, crank: 0.33, phase: 0.2, valveGear: true }],
      cylinderZ: 1.1, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: variant === "namekuji" ? "D51 1" : "D51 200", side: [9.7, 2.4, 1.45], front: [0.88, 2.35] },
    extras: (t) => {
      jnrFront(t, 1.05, 3.4);
      t.m.scope("drawbar", () => t.box("black", 11.0, 11.6, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function d51TenderSpec(): LocoSpec {
  return { ...c62TenderSpec(), title: "JNR D51 tender", heads: [0, 8.2],
    frame: { x0: 0.3, x1: 7.8, top: 1.2 },
    prisms: [{ name: "tank", x0: 0.3, x1: 7.7, half: [[1.4, 1.2], [1.4, 2.85]] }, { name: "coal sides", x0: 0.5, x1: 4.8, half: [[1.4, 2.85], [1.3, 3.2]] }],
    coal: { x0: 0.7, x1: 4.6, y: 3.2, half: 1.15, rise: 0.35 },
    bogies: [{ x0: 0.6, x1: 3.2, y: 0.55 }, { x0: 4.8, x1: 7.4, y: 0.55 }],
    gear: { wheels: [1.15, 2.65, 5.35, 6.85].map((x) => ({ x, d: 0.86, spokes: 0 })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[7.72, 2.5, 0]] },
    extras: (t) => t.m.scope("rear beam", () => { t.box("beam", 7.7, 7.85, 0.75, 1.15, -1.3, 1.3); knuckleCoupler(t.m, -1, -t.X(8.2) - 0.6, -t.X(8.2), COUPLER_Y); }),
  };
}

const c62 = (v?: ParamValues) => (resolveParams([UNIT_PARAM], v).unit === "tender" ? c62TenderSpec() : c62Spec());
const d51 = (v?: ParamValues) => { const p = resolveParams(D51_PARAMS, v); return p.unit === "tender" ? d51TenderSpec() : d51Spec(p.variant as D51Variant); };
export function jnrC62(v?: ParamValues): MeshBuilder { return buildLoco(c62(v)); }
export function jnrC62Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(c62(v)); }
export function jnrD51(v?: ParamValues): MeshBuilder { return buildLoco(d51(v)); }
export function jnrD51Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(d51(v)); }
export const jnrSteamSpec = (id: string, v?: ParamValues): LocoSpec => (id === "proc-vehicle-jnr-c62" ? c62(v) : d51(v));

// ---------------------------------------------------------------------------
// EF66: a Bo-Bo-Bo electric with the same cab at both ends (docs/models/jnr-locos.md,
// "The EF66"): the windscreen leaning back under the raised cab roof's visor, a blue shelf
// sloping down from it to the brow, the cream front under the brow with the number plate on
// its gold vee, the louvred grille between two lamp housings at the chamfered corners, and the
// grey skirt; drawn as a cab face (seriesCab.ts) on a square-ended carbody. d_f is metres back
// from a face's tip plane; the body runs between the two faces' joins.

export const EF66_LENGTH = 18.2;
/** Body length (17,100 mm), the face's join behind its tip, the tip plane's model x. */
const EF66_BODY_LENGTH = 17.1;
const EF66_JOIN = 0.95;
const EF66_TIP = EF66_BODY_LENGTH / 2;
/** The raised cab roof ends this far behind the tip; the body's roof (3,670 mm) is lower behind it. */
const EF66_HUMP = 1.65;
const EF66_CAB_ROOF = 3.87;
const EF66_ROOF = 3.67;
/** Bogie centres 5,300 mm apart, wheelbase 2,800 mm, wheels 1,120 mm. */
const EF66_TRUCKS = [5.3, 0, -5.3];
const EF66_PAN = 5.65;
/** The cab hump's crown and shoulder over the body's d (the body starts at the join). */
const EF66_CAB: NoseShape = { len: 0.01, tip: 1, power: 2, C: [[0, EF66_CAB_ROOF], [EF66_HUMP - EF66_JOIN - 0.08, EF66_CAB_ROOF], [EF66_HUMP - EF66_JOIN, EF66_ROOF]], S: [[0, 3.62], [EF66_HUMP - EF66_JOIN - 0.08, 3.62], [EF66_HUMP - EF66_JOIN, 3.5]] };
const EF66_SPEC: CarbodySpec = { length: EF66_BODY_LENGTH - 2 * EF66_JOIN, W: 1.4, Y: 1.4, S: 3.5, C: EF66_ROOF, lean: 0.98, arc: 6, B: 1.32, wl: 1.39, A: 1.36, wa: 1.4, front: EF66_CAB, rear: EF66_CAB, edges: [], step: 2.0, noseStep: 0.2 };
/** The seven upper windows and the louvres under them: starts behind the tip, pitch, widths. */
const EF66_WIN0 = 2.53, EF66_PITCH = 1.74, EF66_WIN_W = 1.575;
/** The number plate ([lat, y] corners) and the gold vee behind it, as the convex pieces round the plate. */
const EF66_PLATE = { lat: [-0.37, 0.37], y: [2.44, 2.64] } as const;
const EF66_VEE: Pt[][] = [
  [[-0.63, 2.665], [0.63, 2.665], [0.596, 2.64], [-0.596, 2.64]],
  [[-0.596, 2.64], [-0.37, 2.64], [-0.37, 2.478]], [[0.37, 2.64], [0.596, 2.64], [0.37, 2.478]],
  [[-0.284, 2.44], [0.284, 2.44], [0, 2.335]],
];

interface Ef66Livery {
  title: string;
  number: string;
  palette: Record<string, MaterialSpec>;
  /** The body's side bands (bottom up) and its roof; the cab roof's colour. */
  side: ReadonlyArray<readonly [number, number, string]>;
  roof: string;
  cabRoof: string;
  /** The face's bands, its roof from this height, its painted fields; the lamp housings' paint, the louvres' slats, the skirt. */
  face: ReadonlyArray<readonly [number, number, string]>;
  faceRoofFrom: number;
  fields: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  decals?: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  pod: string;
  slat: string;
  skirt: string;
  /** Paint over the face's cab sides (seriesCab.ts `paint`) and over the body's sides: polygons in [d_f, y]. */
  cabPaint?: ReadonlyArray<{ mat: string; front: readonly Pt[]; back: readonly Pt[]; top?: number }>;
  sweeps?: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  /** The distant model's face and side bands (the vee and the side band as level bands). */
  lodFace: ReadonlyArray<readonly [number, number, string]>;
  lodSide?: ReadonlyArray<readonly [number, number, string]>;
}

/** The face's bands: `lower` up to the brow, `upper` over it, the stainless windscreen frame. */
const ef66FaceBands = (lower: string, upper: string, brow = 2.72): Array<readonly [number, number, string]> => [[0, brow, lower], [brow, 3.05, upper], [3.05, 3.61, "frameSilver"], [3.61, 9, upper]];

const EF66_LIVERIES: Record<string, Ef66Livery> = {
  // JNR blue No. 15 and cream No. 1 (EF66 27, 11, 35): the cream front under the brow, narrowing
  // between the lamp housings; a cream stripe along the sides at the grille's height
  jnr: {
    title: "JNR blue, cream", number: "EF66 27",
    palette: { efBlue: c("#22468c", 0.45), efCream: c("#ece0bf", 0.45), efRoof: c("#8d9093", 0.6), efSkirt: c("#aeb4b9", 0.55), efGold: c("#b49048", 0.35), efPlate: c("#203c78", 0.4) },
    side: [[0, 1.92, "efBlue"], [1.92, 2.02, "efCream"], [2.02, 9, "efBlue"]], roof: "efRoof", cabRoof: "efBlue",
    lodFace: [[0, 1.69, "efBlue"], [1.69, 2.72, "efCream"], [2.72, 9, "efBlue"]],
    face: [[0, 2.27, "efBlue"], ...ef66FaceBands("efCream", "efBlue").map(([a, z, mt]) => [Math.max(a, 2.27), z, mt] as const)], faceRoofFrom: 9,
    // the cream between the lamp housings down to the blue skirt band, the side stripe on the corners
    fields: [
      { mat: "efCream", pts: [[-0.91, 1.69], [0.91, 1.69], [0.91, 2.28], [-0.91, 2.28]] },
    ],
    decals: [
      ...EF66_VEE.map((pts) => ({ mat: "efGold", pts })),
      { mat: "efCream", pts: [[1.24, 1.92], [1.5, 1.92], [1.5, 2.02], [1.24, 2.02]] }, { mat: "efCream", pts: [[-1.5, 1.92], [-1.24, 1.92], [-1.24, 2.02], [-1.5, 2.02]] },
    ],
    pod: "efBlue", slat: "efBlue", skirt: "efSkirt",
  },
  // JR Freight's colours on EF66 20 (c. 1990): light grey, the blue vee over the front from
  // the corners down under the grille, a blue band along the sides falling behind the cab
  jrFreight: {
    title: "JR Freight", number: "EF66 20",
    palette: { jfGrey: c("#d8dad5", 0.45), jfBlue: c("#2458a8", 0.45), jfRoof: c("#8f8a7f", 0.6), jfSkirt: c("#9ebfcf", 0.55), efPlate: c("#203c78", 0.4) },
    side: [[0, 9, "jfGrey"]], roof: "jfRoof", cabRoof: "jfRoof",
    lodFace: [[0, 2.0, "jfGrey"], [2.0, 2.72, "jfBlue"], [2.72, 9, "jfGrey"]], lodSide: [[0, 2.2, "jfGrey"], [2.2, 2.6, "jfBlue"], [2.6, 9, "jfGrey"]],
    face: ef66FaceBands("jfGrey", "jfGrey"), faceRoofFrom: 3.71,
    fields: [{ mat: "jfBlue", pts: [[-1.6, 2.72], [-0.64, 2.72], [0, 2.0], [0.64, 2.72], [1.6, 2.72], [1.6, 2.3], [0, 1.6], [-1.6, 2.3]] }],
    pod: "black", slat: "jfGrey", skirt: "jfSkirt",
    cabPaint: [{ mat: "jfBlue", front: [[2.3, 0.12], [2.72, 0.12]], back: [[2.3, 1.2], [2.72, 1.2]], top: 2.72 }],
    sweeps: [{ mat: "jfBlue", pts: [[0, 2.3], [2.6, 2.3], [5.6, 2.18], [EF66_BODY_LENGTH - 5.6, 2.18], [EF66_BODY_LENGTH - 2.6, 2.3], [EF66_BODY_LENGTH, 2.3], [EF66_BODY_LENGTH, 2.9], [EF66_BODY_LENGTH - 2.6, 2.9], [EF66_BODY_LENGTH - 5.6, 2.45], [5.6, 2.45], [2.6, 2.9], [0, 2.9]] }],
  },
};
const EF66_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { jnr: EF66_LIVERIES.jnr!.title, jrFreight: EF66_LIVERIES.jrFreight!.title })];

/** The cab face of one livery: profile measured from EF66 11, 27 and 35 (assets/jnr-ef66/). */
function ef66Face(l: Ef66Livery): SeriesCabFace {
  const plate: FaceRect = { ...EF66_PLATE, r: 0, mat: "efPlate" };
  const strip = (lat: number, w: number, y0: number, y1: number, mat = "frameSilver") => ({ mat, pts: [[lat - w / 2, y0], [lat + w / 2, y0], [lat + w / 2, y1], [lat - w / 2, y1]] as Pt[], fine: 1 });
  return {
    dJoin: EF66_JOIN, dSide: 0.93, roofFrom: l.faceRoofFrom, cols: [4, 2, 1, 1], tolerance: 0.05, reach: 0.55,
    // upright from the skirt to the brow, the shelf sloping back to the windscreen's foot, the
    // windscreen leaning back under the visor, the cab roof rounding up behind the visor's lip
    profile: [[1.32, 0.02], [1.4, 0], [2.72, 0], [2.76, 0.03], [3.0, 0.33], [3.05, 0.38], [3.62, 0.6], [3.645, 0.47], [3.71, 0.44], [3.79, 0.52], [3.85, 0.68], [EF66_CAB_ROOF, EF66_JOIN]],
    // chamfered corners: small at the lamp housings, wider at the windscreen's corner panes
    corner: [[1.32, 0.22], [2.72, 0.22], [2.76, 0.24], [3.05, 0.36], [3.62, 0.4], [3.71, 0.42], [EF66_CAB_ROOF, 0.3]],
    cornerDepth: [[1.32, 0.22], [2.72, 0.22], [3.05, 0.38], [3.62, 0.3], [3.71, 0.36], [3.85, 0.22], [EF66_CAB_ROOF, 0]],
    rows: [1.32, 1.4, 2.72, 2.76, 3.0, 3.05, 3.62, 3.645, 3.71, 3.79, 3.85, EF66_CAB_ROOF],
    bands: () => l.face, lodBands: l.lodFace,
    fields: l.fields,
    ...(l.cabPaint ? { paint: l.cabPaint } : {}),
    masks: [
      // the louvred grille's opening, the number plate
      { lat: [-0.91, 0.91], y: [1.81, 2.07], r: 0, mat: "black" },
      plate,
    ],
    // one pane across the windscreen and round its corners; the stainless pillars over it
    panes: [{ lat: [-1.6, 1.6], y: [3.09, 3.57], r: 0 }],
    decals: [
      strip(0, 0.08, 3.09, 3.57), ...[-1, 1].map((sd) => ({ ...strip(sd * 1.0, 0.07, 3.09, 3.57), fine: 2 })),
      // the grille's five chromed slats
      ...[0, 1, 2, 3, 4].map((i) => strip(0, 1.76, 1.83 + i * 0.048, 1.853 + i * 0.048)),
      ...(l.decals ?? []).map((dc) => ({ ...dc, fine: 1 })),
    ],
    pods: [-1, 1].flatMap((s) => [
      // the tall housing at each corner, the headlight over the tail light
      { lat: s * 1.08, y: 2.105, w: 0.34, h: 0.32, r: 0.05, proud: 0.125, depth: 0.3, mat: l.pod, lamps: [[0, 0.1, "lampHead"]] as Array<[number, number, string]> },
      { lat: s * 1.08, y: 1.795, w: 0.34, h: 0.32, r: 0.05, proud: 0.12, depth: 0.3, mat: l.pod, lamps: [[0, 0.088, "lampRed"]] as Array<[number, number, string]> },
    ]),
    number: { lat: -0.3, y: 2.485, h: 0.11, mat: "white" },
    wipers: [[[-0.62, 3.12], [-0.28, 3.47]], [[0.32, 3.12], [0.66, 3.47]]],
    lod: { profile: [[1.32, 0], [2.72, 0], [3.05, 0.38], [3.62, 0.6], [EF66_ROOF, 0.95]], corner: [[1.32, 0.22], [3.05, 0.36], [EF66_ROOF, 0.4]], rows: [1.32, 2.72, 3.05, 3.62, EF66_ROOF] },
  };
}

const ef66Paint = (l: Ef66Livery): FacePaint => ({ sides: l.side, face: l.face, roof: l.cabRoof, skirt: l.side[0]![2], S: 3.62, A: 1.36, number: l.number });

export function jnrEf66(v?: ParamValues): MeshBuilder {
  const l = EF66_LIVERIES[resolveParams(EF66_PARAMS, v).livery!]!;
  const m = new MeshBuilder({ ...CARBODY_PALETTE, under: c("#2a2c2f", 0.85), ...l.palette });
  const L = EF66_BODY_LENGTH;
  const b = carbody({ ...EF66_SPEC, edges: [...new Set(l.side.flatMap(([p, q]) => [p, q]))].filter((y) => y > 1.41 && y < 3.49) });
  // body d from the front face's tip plane (d_f), as the photographs were measured
  const X = (df: number) => EF66_TIP - EF66_JOIN - df;
  const Bd = (df: number) => df - EF66_JOIN;
  const base = bandPainter(l.side, l.roof, "under", l.side[0]![2]);
  const face = ef66Face(l), fp = ef66Paint(l), half = bodyHalf(b, 0);
  m.scope("body", () => {
    // the raised cab roofs keep the cab's colour
    m.scope("shell", () => carbodyShell(m, b, X, (d, y, r) => (r === "arc" && (d < EF66_HUMP - EF66_JOIN + 0.01 || b.length - d < EF66_HUMP - EF66_JOIN + 0.01) ? l.cabRoof : base(d, y, r))));
    // both sides alike, the two cab ends mirrored: [d_f0, d_f1] from the front end, or from the rear
    const span = (e: number, a: number, z: number): [number, number] => (e > 0 ? [Bd(a), Bd(z)] : [Bd(L - z), Bd(L - a)]);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        for (const e of [1, -1])
          m.scope(e > 0 ? "front cab" : "rear cab", () => {
            m.scope("cab window", () => {
              sidePanel(m, b, X, s, "rubber", ...span(e, 0.98, 1.36), 3.06, 3.56, 0.008, 0.004);
              sidePanel(m, b, X, s, "cabGlass", ...span(e, 1.01, 1.33), 3.09, 3.53, 0.012, 0.004);
            });
            m.scope("door", () => {
              for (const [a, z, y0, y1] of [[1.7, 1.725, 1.45, 3.45], [2.395, 2.42, 1.45, 3.45], [1.725, 2.395, 3.425, 3.45]] as const) sidePanel(m, b, X, s, "rubber", ...span(e, a, z), y0, y1, 0.006, 0.004);
              sidePanel(m, b, X, s, "rubber", ...span(e, 1.85, 2.11), 2.62, 3.3, 0.008, 0.004);
              sidePanel(m, b, X, s, "cabGlass", ...span(e, 1.875, 2.085), 2.645, 3.275, 0.012, 0.004);
            });
            m.scope("handrails", () => {
              for (const a of [1.66, 2.46]) {
                const [d] = span(e, a, a), q = X(d), z = s * (1.4 * 0.995 + 0.07);
                m.rod("handrail", [q, 1.7, z], [q, 3.0, z], 0.016, 6);
              }
            });
          });
        m.scope("windows", () => {
          for (let i = 0; i < 7; i++) {
            const d0 = EF66_WIN0 + i * EF66_PITCH;
            sidePanel(m, b, X, s, "frameSilver", Bd(d0), Bd(d0 + EF66_WIN_W), 2.98, 3.32, 0.008, 0.004);
            sidePanel(m, b, X, s, "cabGlass", Bd(d0 + 0.03), Bd(d0 + EF66_WIN_W - 0.03), 3.0, 3.3, 0.012, 0.004);
          }
        });
        m.scope("louvres", () => {
          for (let i = 0; i < 7; i++) {
            const d0 = EF66_WIN0 + 0.02 + i * EF66_PITCH, d1 = d0 + EF66_WIN_W - 0.04;
            sidePanel(m, b, X, s, "grille", Bd(d0), Bd(d1), 2.41, 2.88, 0.008, 0.004);
            // the slats as flat strips over the opening
            const tris: Pt[] = [];
            for (let k = 0; k < 8; k++) {
              const [a, z, y0, y1] = [Bd(d0 + 0.02), Bd(d1 - 0.02), 2.43 + k * 0.055, 2.46 + k * 0.055];
              tris.push([a, y0], [z, y0], [z, y1], [a, y0], [z, y1], [a, y1]);
            }
            sideDecal(m, b, X, s, l.slat, tris, 0.014);
          }
        });
        if (l.sweeps)
          m.scope("band", () => l.sweeps!.forEach((w) => {
            // a strip of quads between the band's lower and upper edges, both listed from the front
            const n = w.pts.length / 2, lo = w.pts.slice(0, n), hi = w.pts.slice(n).reverse();
            const tris: Pt[] = [];
            for (let i = 0; i + 1 < n; i++) {
              const [a, bb, cc, dd] = [lo[i]!, lo[i + 1]!, hi[i + 1]!, hi[i]!].map(([df, y]): Pt => [Bd(Math.min(L - EF66_JOIN, Math.max(EF66_JOIN, df))), y]);
              tris.push(a!, bb!, cc!, a!, cc!, dd!);
            }
            sideDecal(m, b, X, s, w.mat, tris, 0.003);
          }));
        sideLettering(m, b, X, s, l.number, Bd(L / 2), 2.12, 0.14, "frameSilver", 0.004);
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      m.scope("cab face", () => drawCabFace(m, face, e, EF66_TIP, half, fp));
      // the grey skirt with chamfered corners, the dark plough under it, the coupler in its pocket
      const xf = EF66_TIP - 0.03;
      const ring = (x0: number, x1: number, hw: number, ch: number): Array<[number, number]> =>
        ([[x1, -hw + ch], [x1, hw - ch], [x1 - ch, hw], [x0, hw], [x0, -hw], [x1 - ch, -hw]] as Array<[number, number]>).map(([x, z]) => [e * x, z]);
      m.scope("skirt", () => m.prism(l.skirt, ring(xf - 1.15, xf, 1.28, 0.28), 0.55, 1.3));
      m.scope("plough", () => m.prism("under", ring(xf - 0.6, xf + 0.05, 1.25, 0.36), 0.2, 0.6));
      m.scope("pocket", () => block(m, "black", ...((e > 0 ? [xf - 0.01, xf + 0.006] : [-xf - 0.006, -xf + 0.01]) as [number, number]), 0.68, 1.12, -0.32, 0.32));
      m.scope("coupler", () => knuckleCoupler(m, e, EF66_TIP - 0.25, EF66_LENGTH / 2, COUPLER_Y));
    });
  m.scope("roof", () => {
    for (const e of [1, -1]) m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => diamond(m, { xc: e * EF66_PAN, roofY: EF66_ROOF, baseY: 3.95, raised: e < 0 }));
    // the hatches over the machinery room, the high-tension line between the pantographs on its insulators
    m.scope("hatches", () => { for (const [x0, x1] of [[-3.7, -1.3], [-1.1, 1.1], [1.3, 3.7]] as const) block(m, l.roof, x0, x1, 3.6, 3.71, -0.62, 0.62); });
    m.scope("roof line", () => {
      m.rod("steel", [-EF66_PAN + 0.6, 3.86, 0.35], [EF66_PAN - 0.6, 3.86, 0.35], 0.02, 6, false);
      for (const x of [-3.0, 0, 3.0]) m.rod("insulator", [x, 3.7, 0.35], [x, 3.86, 0.35], 0.045, 6);
    });
  });
  m.scope("running gear", () => {
    const spec: BogieSpec = { axles: [-1.4, 1.4], wheelR: 0.56, frameHalf: 2.05, frameTop: 1.02, frameBottom: 0.62, frameZ: [0.92, 1.04], primary: "coil", secondary: [0], secondaryZ: 1.1, bolster: 1.05 };
    EF66_TRUCKS.forEach((x, i) => m.scope(`truck ${i + 1}`, () => m.bogie(() => bogieGeometry(m, x, spec))));
  });
  // the equipment hung under the frame between the bogies
  m.scope("underframe", () => {
    for (const s of [1, -1]) block(m, "under", ...((s > 0 ? [2.15, 3.15] : [-3.15, -2.15]) as [number, number]), 0.72, 1.31, -1.15, 1.15);
  });
  return m;
}

export function jnrEf66Lod(v?: ParamValues): MeshBuilder {
  const l = EF66_LIVERIES[resolveParams(EF66_PARAMS, v).livery!]!;
  const b = carbody({ ...EF66_SPEC, edges: [] });
  const face = ef66Face(l), fp = ef66Paint(l), half = bodyHalf(b, 0);
  const body: UnitBody = {
    y0: 1.32, hw: [[1.32, 1.39], [1.4, 1.4], [3.5, 1.37], [EF66_ROOF, 0.5]],
    side: [...(l.lodSide ?? l.side).map(([a, e, mt]): [number, number, string] => [Math.max(a, 1.32), Math.min(e, 3.5), mt]).filter(([a, e]) => e > a), [3.5, EF66_ROOF, l.roof]], roof: l.roof,
    front: cabFaceLod(face, 1, EF66_TIP, half, fp, EF66_ROOF),
    rear: cabFaceLod(face, -1, EF66_TIP, half, fp, EF66_ROOF),
    windows: [{ u: [-(EF66_TIP - EF66_WIN0), EF66_TIP - EF66_WIN0], y: [2.98, 3.32], mat: LOD_GLASS }],
  };
  const parts = [...bogieParts(EF66_TRUCKS.map((x) => [x, 2.05] as const), 1.02), ...pantographParts([-EF66_PAN, EF66_PAN], EF66_ROOF, 3.95)];
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...l.palette }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// DD51: the centre-cab diesel-hydraulic on two powered trucks and an idle one

const DD51_TRUCK = (r: number): BogieSpec => ({ axles: [-1.1, 1.1], wheelR: r, frameHalf: 1.75, frameTop: 0.95, frameBottom: 0.58, frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.42, 0.42], secondaryZ: 1.1, bolster: 1.0 });
export const DD51_SPEC: UsHoodSpec = {
  length: 18.0, endSill: 8.45, deck: 1.3, sillBottom: 1.0, deckHalf: 1.47,
  hood: { x0: -8.2, x1: -1.35, half: 1.12, top: 3.35, r: 0.18 },
  front: { kind: "highHood", x0: 1.35, x1: 8.2 },
  cab: { x0: -1.35, x1: 1.35, half: 1.47, top: 3.96, kind: "classic" },
  radiator: { x0: -8.0, x1: -6.3, kind: "grilles", fans: [-7.15], fanR: 0.5 },
  exhaustX: -3.6,
  trucks: { centre: 5.9, sideFrame: "blomberg", spec: DD51_TRUCK(0.43), middle: DD51_TRUCK(0.43) },
  tank: { x0: 2.4, x1: 3.9, y0: 0.5, half: 1.2 },
  ditchLights: false,
};
const DD51_LIVERIES: Record<string, UsLivery> = {
  jnr: {
    title: "JNR red", railroad: "", letterH: 0.3, letterY: 1.0, number: "DD51 842",
    palette: { ddRed: c("#c8462a"), ddGrey: c("#8f9396", 0.6), ddWhite: c("#efefea") },
    body: [[0, 9, "ddRed"]], roof: "ddGrey", frame: "ddGrey", sillStripe: [0.04, 0.12, "ddWhite"], trucks: "underframe", pilot: "ddGrey",
    letter: "ddWhite", numberMat: "ddWhite", rails: "ddWhite",
  },
  hokutosei: {
    title: "Hokutosei blue", railroad: "", letterH: 0.3, letterY: 1.0, number: "DD51 1100",
    palette: { ddBlue: c("#1d3f80"), ddGold: c("#c9a55a", 0.35), ddGrey: c("#8f9396", 0.6) },
    body: [[0, 2.1, "ddBlue"], [2.1, 2.16, "ddGold"], [2.16, 9, "ddBlue"]], roof: "ddGrey", frame: "ddBlue", sillStripe: [0.04, 0.12, "ddGold"], trucks: "underframe", pilot: "ddBlue",
    letter: "ddGold", numberMat: "ddGold", rails: "ddGold",
  },
};
const DD51_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { jnr: "JNR red", hokutosei: "Hokutosei blue" })];
export function jnrDd51(v?: ParamValues): MeshBuilder { return buildUsHood(DD51_SPEC, DD51_LIVERIES[resolveParams(DD51_PARAMS, v).livery!]!); }
export function jnrDd51Lod(v?: ParamValues): MeshBuilder { return usHoodLod(DD51_SPEC, DD51_LIVERIES[resolveParams(DD51_PARAMS, v).livery!]!); }

// ---------------------------------------------------------------------------
// The Blue Train: a 24-series sleeper and dining car

export type BlueTrainCar = "sleeper" | "dining";
const BLUE_PARAMS: ParamSpec[] = [enumParam("unit", "Car", { sleeper: "Sleeper", dining: "Dining car" })];
export const BLUE_LENGTH = 20.8;
const BLUE_BODY = BLUE_LENGTH - 0.5;
const BLUE_PAL = { btBlue: c("#1d3576"), btWhite: c("#e6e8ea", 0.35), btRoof: c("#3b4351", 0.6), under: c("#2a2c2f", 0.85) };

function blueDef(u: BlueTrainCar): CarDef {
  const L = BLUE_BODY;
  const n = u === "sleeper" ? 13 : 8;
  const w = u === "sleeper" ? 0.95 : 1.35;
  const spans = Array.from({ length: n }, (_, i): [number, number] => { const d = 2.2 + (L - 3.6) * ((i + 0.5) / n); return [d - w / 2, d + w / 2]; });
  return {
    spec: { length: L, W: 1.475, Y: 1.35, S: 3.3, C: 3.93, lean: 0.98, arc: 6, B: 1.0, wl: 1.42, A: 1.1, wa: 1.47, edges: [], step: 1.0, cuts: [L / 2 - 7.075, L / 2 + 7.075].map((d) => [d - 1.6, d + 1.6] as const) },
    bands: [[0, 1.25, "btBlue"], [1.25, 1.29, "btWhite"], [1.29, 1.33, "btBlue"], [1.33, 1.37, "btWhite"], [1.37, 1.41, "btBlue"], [1.41, 1.45, "btWhite"], [1.45, 9, "btBlue"]],
    roof: "btRoof", skirt: "btBlue", under: "under",
    windows: [{ y: [2.0, 2.8], spans, frame: "rubber" }],
    doors: { spans: [[0.5, 1.2]], y: [1.15, 3.0], glass: [2.05, 2.6] },
    cabEnds: [], diaphragm: [1.2, 3.1],
    trucks: [L / 2 - 7.075, L / 2 + 7.075], truck: { axles: [-1.05, 1.05], wheelR: 0.43, frameHalf: 1.65, frameTop: 0.92, frameBottom: 0.55, frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.42, 0.42], secondaryZ: 1.1, bolster: 1.0 },
    coupler: "knuckle", couplerY: COUPLER_Y, gap: [0.25, 0.25],
    lettering: [{ text: u === "sleeper" ? "OHANE 25" : "SHISHI 24", d: L - 2.0, y: 1.6, h: 0.12, mat: "btWhite" }],
    extras: (m, _b, X) => m.scope("underfloor", () => block(m, "under", X(L / 2 + 4.6), X(L / 2 - 4.6), 0.5, 1.01, -1.1, 1.1)),
  };
}

export function blueTrain24(v?: ParamValues): MeshBuilder {
  const u = resolveParams(BLUE_PARAMS, v).unit as BlueTrainCar;
  const m = new MeshBuilder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...BLUE_PAL });
  drawCar(m, blueDef(u), (d) => BLUE_LENGTH / 2 - 0.25 - d);
  return m;
}
export function blueTrain24Lod(v?: ParamValues): MeshBuilder {
  const u = resolveParams(BLUE_PARAMS, v).unit as BlueTrainCar;
  const def = blueDef(u);
  const X = (d: number) => BLUE_LENGTH / 2 - 0.25 - d;
  const side: LodBand[] = [[1.0, 3.3, "btBlue"], [3.3, 3.93, "btRoof"]];
  const sp = def.windows[0]!.spans;
  const body: UnitBody = { y0: 1.0, hw: [[1.0, 1.42], [1.35, 1.475], [3.3, 1.45], [3.93, 0.4]], side, roof: "btRoof", front: { tip: [[1.0, X(0)]] }, rear: { tip: [[1.0, X(BLUE_BODY)]] },
    windows: [{ u: [X(sp[sp.length - 1]![1]), X(sp[0]![0])], y: [2.0, 2.8], mat: LOD_GLASS }] };
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...BLUE_PAL }, bodies: [body], parts: bogieParts(def.trucks.map((d) => [X(d), 1.65] as const), 1.0) }, 100);
}

// ---------------------------------------------------------------------------

const steamGame = (weight: number, power: number, maxspeed: number, tender: number, extra: GameProperties["variants"] = []): GameProperties => ({
  weight, power, maxspeed, accel: null, variants: [{ params: { unit: "tender" }, weight: tender, power: 0 }, ...(extra ?? [])],
});

export const JNR_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-jnr-c62", title: "JNR C62", build: jnrC62, buildLod: jnrC62Lod, params: [UNIT_PARAM], game: steamGame(89, 1210, 100, 56), catalog: STEAM_CATALOG, references: "jnr-c62" },
  { id: "proc-vehicle-jnr-d51", title: "JNR D51", build: jnrD51, buildLod: jnrD51Lod, params: D51_PARAMS, game: steamGame(78, 950, 85, 47, [{ params: { unit: "tender", variant: "namekuji" }, weight: 47, power: 0 }]), catalog: STEAM_CATALOG, references: "jnr-d51" },
  { id: "proc-vehicle-jnr-ef66", title: "JNR EF66", build: jnrEf66, buildLod: jnrEf66Lod, params: EF66_PARAMS, game: { weight: 101, power: 3900, maxspeed: 110, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "jnr-ef66" },
  { id: "proc-vehicle-jnr-dd51", title: "JNR DD51", build: jnrDd51, buildLod: jnrDd51Lod, params: DD51_PARAMS, finishParams: ["livery"], game: { weight: 84, power: 1640, maxspeed: 95, accel: null }, catalog: DIESEL_LOCO_CATALOG, references: "jnr-dd51" },
  { id: "proc-vehicle-blue-train-24", title: "Blue Train 24 series", build: blueTrain24, buildLod: blueTrain24Lod, params: BLUE_PARAMS, game: { weight: 33, power: 0, maxspeed: 110, accel: null, variants: [{ params: { unit: "dining" }, weight: 38 }] }, catalog: COACH_CATALOG, references: "blue-train-24" },
];
