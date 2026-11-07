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
import { crownPane, sideLettering, sidePanel } from "./sliceBody.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, endDiaphragm, faceLamps, type CarbodySpec, type NoseShape } from "./carbodyKit.ts";
import { buildUsHood, knuckleCoupler, usHoodLod, type UsHoodSpec, type UsLivery } from "./usHoodKit.ts";
import { diamond } from "./czElectricKit.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { drawCar, type CarDef } from "./usTransit.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, pantographParts, type UnitBody } from "./lodUnits.ts";
import { sideDecal, type SliceBody } from "./sliceBody.ts";
import { decalX, decalZ } from "./usHoodKit.ts";
import { ngon, type Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";

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
// EF66: a Bo-Bo-Bo electric with the "brow" nose at both ends

export const EF66_LENGTH = 18.2;
const EF66_BODY = EF66_LENGTH - 2 * 0.45;
const EF66_NOSE: NoseShape = { len: 0.9, tip: 0.86, power: 3.0, C: [[0, 3.0], [0.25, 3.35], [0.6, 3.52], [0.9, 3.6]], S: [[0, 2.3], [0.3, 3.0], [0.9, 3.3]], Y: [[0, 1.75], [0.5, 1.5]], A: [[0, 1.3], [0.4, 1.15]], B: [[0, 1.25], [0.3, 1.05]] };
const EF66_SPEC: CarbodySpec = { length: EF66_BODY, W: 1.4, Y: 1.5, S: 3.3, C: 3.6, lean: 0.97, arc: 6, B: 1.05, wl: 1.35, A: 1.15, wa: 1.39, front: EF66_NOSE, rear: EF66_NOSE, edges: [], step: 1.0, noseStep: 0.15 };
const EF66_TRUCKS = [6.1, 0, -6.1];
const EF66_LIVERIES: Record<string, { title: string; palette: Record<string, MaterialSpec>; bands: ReadonlyArray<readonly [number, number, string]>; roof: string; nose: string }> = {
  jnr: { title: "JNR blue, cream", palette: { blue: c("#2a4f9a"), cream: c("#efe3c2"), roofG: c("#7d8084", 0.6) }, bands: [[0, 1.42, "cream"], [1.42, 9, "blue"]], roof: "roofG", nose: "cream" },
  jrFreight: { title: "JR Freight", palette: { lightBlue: c("#6fa8d6"), grey: c("#c9ccce"), navy: c("#2a3f6a"), roofG: c("#7d8084", 0.6) }, bands: [[0, 1.42, "navy"], [1.42, 2.35, "lightBlue"], [2.35, 9, "grey"]], roof: "roofG", nose: "grey" },
};
const EF66_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { jnr: EF66_LIVERIES.jnr!.title, jrFreight: EF66_LIVERIES.jrFreight!.title })];

export function jnrEf66(v?: ParamValues): MeshBuilder {
  const l = EF66_LIVERIES[resolveParams(EF66_PARAMS, v).livery!]!;
  const m = new MeshBuilder({ ...CARBODY_PALETTE, under: c("#2a2c2f", 0.85), ...l.palette });
  const b = carbody({ ...EF66_SPEC, edges: [...new Set(l.bands.flatMap(([p, q]) => [p, q]))].filter((y) => y > 1.51 && y < 3.29) });
  const tip = EF66_LENGTH / 2 - 0.45;
  const X = (d: number) => tip - d;
  const base = bandPainter(l.bands, l.roof, "under", l.bands[0]![2]);
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, (d, y, r) => ((d < 0.5 || EF66_BODY - d < 0.5) && r !== "arc" && r !== "bottom" && y < 2.4 ? l.nose : base(d, y, r))));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        for (const d of [1.3, EF66_BODY - 2.1]) sidePanel(m, b, X, s, "glass", d, d + 0.75, 2.45, 3.05, 0.01, 0.004);
        for (let i = 0; i < 6; i++) sidePanel(m, b, X, s, "grille", 3.3 + i * 1.75, 4.6 + i * 1.75, 2.35, 3.0, 0.006, 0.02);
        sideLettering(m, b, X, s, "EF66 27", EF66_BODY / 2, 1.75, 0.22, "white", 0.012);
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const at = (d: number) => (e > 0 ? d : EF66_BODY - d);
      m.scope("windscreen", () => {
        for (const s of [1, -1]) {
          const [d0, d1] = e > 0 ? [0.08, 0.62] : [at(0.62), at(0.08)];
          crownPane(m, b, X, s, "rubber", [d0, d1], [0.08, 1.05], 0.01, 4, 3);
          crownPane(m, b, X, s, "cabGlass", [d0 + 0.04, d1 - 0.04], [0.12, 1.0], 0.03, 4, 3);
        }
      });
      faceLamps(m, e, e * X(at(0)) + 0.0, [[-0.85, 1.9, 0.1, "lampHead"], [0.85, 1.9, 0.1, "lampHead"], [-1.1, 1.6, 0.06, "lampRed"], [1.1, 1.6, 0.06, "lampRed"]]);
      m.scope("skirt", () => block(m, "under", ...(e > 0 ? [tip - 0.35, tip + 0.02] : [-tip - 0.02, -tip + 0.35]) as [number, number], 0.35, 1.1, -1.25, 1.25));
      m.scope("coupler", () => knuckleCoupler(m, e, tip - 0.25, EF66_LENGTH / 2, COUPLER_Y));
    });
  m.scope("roof", () => {
    for (const e of [1, -1]) m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => diamond(m, { xc: e * 5.0, roofY: 3.6, baseY: 3.9, raised: e < 0 }));
  });
  m.scope("running gear", () => {
    const spec: BogieSpec = { axles: [-1.25, 1.25], wheelR: 0.56, frameHalf: 1.95, frameTop: 1.0, frameBottom: 0.62, frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.45, 0.45], secondaryZ: 1.1, bolster: 1.05 };
    EF66_TRUCKS.forEach((x, i) => m.scope(`truck ${i + 1}`, () => m.bogie(() => bogieGeometry(m, x, spec))));
  });
  return m;
}

export function jnrEf66Lod(v?: ParamValues): MeshBuilder {
  const l = EF66_LIVERIES[resolveParams(EF66_PARAMS, v).livery!]!;
  const tip = EF66_LENGTH / 2 - 0.45;
  const body: UnitBody = {
    y0: 1.05, hw: [[1.05, 1.35], [1.5, 1.4], [3.3, 1.36], [3.6, 0.5]], side: [...l.bands.map(([a, e, mt]): [number, number, string] => [Math.max(a, 1.05), Math.min(e, 3.3), mt]).filter(([a, e]) => e > a), [3.3, 3.6, l.roof]], roof: l.roof,
    front: { tip: [[1.05, tip], [3.6, tip - 0.85]], setback: [[1.05, 0.3], [3.6, 0.3]], windows: [{ u: [-1.0, 1.0], y: [2.45, 3.1], mat: LOD_GLASS }] },
    rear: { tip: [[1.05, -tip], [3.6, -tip + 0.85]], setback: [[1.05, 0.3], [3.6, 0.3]], windows: [{ u: [-1.0, 1.0], y: [2.45, 3.1], mat: LOD_GLASS }] },
  };
  const parts = [...bogieParts(EF66_TRUCKS.map((x) => [x, 1.95] as const), 1.05), ...pantographParts([-5.0, 5.0], 3.6, 3.9)];
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
// The Blue Train: the 24 series' 25-type two-tier B sleeper (OHaNe 25, 1974) and
// the OShi 24 dining car, laid out from photographs (assets/blue-train-24/SOURCES.md).
// d runs from the sleeper's door end (the dining car's kitchen end) at +X; the
// layouts below are in the prototype's metres along its 20.0 m body (`bt`).

export type BlueTrainCar = "sleeper" | "dining";
const BLUE_PARAMS: ParamSpec[] = [enumParam("unit", "Car", { sleeper: "Sleeper", dining: "Dining car" })];
export const BLUE_LENGTH = 20.8;
const BLUE_BODY = BLUE_LENGTH - 0.5;
/** The prototype's metres along its 20.0 m body to the model's d. */
const bt = (d: number) => (d * BLUE_BODY) / 20.0;
const BLUE_PAL: Record<string, MaterialSpec> = {
  btBlue: c("#1d3478"),
  btLine: { ...c("#c3c7cb", 0.3), metallic: 0.6 },
  btRoof: { ...c("#a9aeb3", 0.45), metallic: 0.4 },
  btHood: c("#80868c", 0.6),
  btFrost: c("#c6cdd3", 0.3),
  btHatch: c("#192e6a", 0.55),
  btSign: c("#eceeec", 0.4),
  under: c("#2a2c2f", 0.85),
};
/** The body's section: bottom, foot, belly, eaves and crown (from the photos' end faces), the air conditioners' top. */
const BT = { B: 1.05, A: 1.08, Y: 1.1, S: 3.55, C: 3.98, W: 1.475, lean: 0.985, hood: 4.085 };
/** The two stainless lines: one along the foot, one under the windows; both stop at the doors. */
const BT_BANDS: Array<[number, number, string]> = [[0, 1.12, "btBlue"], [1.12, 1.17, "btLine"], [1.17, 1.94, "btBlue"], [1.94, 2.0, "btLine"], [2.0, 9, "btBlue"]];

/** A window: d span (prototype metres), sill and head, corner radius, glass. */
interface BtPane { d: readonly [number, number]; y: readonly [number, number]; r: number; mat?: string }
/** A painted or grille panel on a side: d span (prototype metres), heights, material. */
interface BtPanel { d: readonly [number, number]; y: readonly [number, number]; mat: string }
interface BtSide { panes: BtPane[]; panels: BtPanel[] }
const btRow = (c0: number, pitch: number, n: number, w: number, y: readonly [number, number], r: number): BtPane[] =>
  Array.from({ length: n }, (_, i) => ({ d: [c0 + i * pitch - w / 2, c0 + i * pitch + w / 2] as const, y, r }));

/** The B sleeper's sides: wide, low berth windows on one, tall corridor windows and the washroom on the other. */
const BT_DOOR_SIGN: BtPanel = { d: [0.45, 1.05], y: [3.33, 3.45], mat: "btSign" };
const BT_DEST: BtPanel = { d: [19.0, 19.6], y: [3.08, 3.3], mat: "btSign" };
const BT_SLEEPER: { berth: BtSide; corridor: BtSide } = {
  berth: {
    panes: [{ d: [2.45, 3.05], y: [2.09, 2.78], r: 0.08 }, ...btRow(4.56, 1.866, 8, 1.15, [2.09, 2.78], 0.08),
      { d: [18.6, 19.05], y: [2.68, 2.95], r: 0.08, mat: "btFrost" }, { d: [19.3, 19.72], y: [2.68, 2.95], r: 0.08, mat: "btFrost" }],
    panels: [{ d: [1.32, 1.85], y: [1.22, 1.48], mat: "louvre" }, BT_DOOR_SIGN, BT_DEST],
  },
  corridor: {
    panes: [{ d: [1.7, 2.05], y: [2.13, 3.05], r: 0.06 }, ...btRow(3.25, 1.84, 7, 1.07, [2.09, 3.03], 0.08),
      { d: [15.75, 16.9], y: [2.09, 2.97], r: 0.08, mat: "btFrost" },
      { d: [17.5, 18.15], y: [2.58, 2.86], r: 0.13, mat: "btFrost" }, { d: [18.6, 19.25], y: [2.58, 2.86], r: 0.13, mat: "btFrost" }],
    // and two service hatches low under the toilets
    panels: [BT_DOOR_SIGN, BT_DEST, { d: [17.6, 18.2], y: [1.3, 1.66], mat: "btHatch" }, { d: [18.3, 18.9], y: [1.3, 1.66], mat: "btHatch" }],
  },
};
/** The dining car's side: the kitchen's sliding door and its rail, four windows, a vent, the dining room's five. */
const BT_DINER: BtSide = {
  panes: [...btRow(3.72, 1.58, 4, 1.2, [2.38, 3.0], 0.09), ...btRow(10.72, 1.675, 5, 1.2, [2.38, 3.0], 0.09)],
  panels: [{ d: [1.22, 3.0], y: [3.1, 3.15], mat: "rubber" }, { d: [9.3, 9.65], y: [2.08, 2.42], mat: "louvre" }, { d: [0.5, 0.98], y: [1.2, 1.48], mat: "louvre" }],
};
/** Which side (+1 the +Z side) carries the sleeper's berth windows. */
const BT_BERTH_S = -1;
/** Both end walls: corners rounded in plan, the roof dropping a little to the wall (the photos' end faces). */
const BT_END = { len: 0.3, tip: 0.85, power: 2.2, C: [[0, 3.9], [0.3, BT.C]] as Pt[], S: [[0, 3.5], [0.3, BT.S]] as Pt[] };

/** A rounded rectangle in (d, y), counter-clockwise, `n` steps a corner. */
function btRound(d0: number, d1: number, y0: number, y1: number, r: number, n = 3): Pt[] {
  const q = Math.min(r, (d1 - d0) / 2 - 0.002, (y1 - y0) / 2 - 0.002);
  const out: Pt[] = [];
  for (const [cd, cy, a0] of [[d1 - q, y1 - q, 0], [d0 + q, y1 - q, 90], [d0 + q, y0 + q, 180], [d1 - q, y0 + q, 270]] as const)
    for (let i = 0; i <= n; i++) { const a = ((a0 + (90 * i) / n) * Math.PI) / 180; out.push([cd + q * Math.cos(a), cy + q * Math.sin(a)]); }
  return out;
}
const btFan = (p: Pt[]): Pt[] => p.slice(1, -1).flatMap((v, i) => [p[0]!, v, p[i + 2]!]);
const btRing = (o: Pt[], n: Pt[]): Pt[] => o.flatMap((v, i) => { const j = (i + 1) % o.length; return [v, o[j]!, n[j]!, v, n[j]!, n[i]!]; });

/** A side's windows (a silver frame round the glass) and panels, flush on the skin. */
function btSide(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, side: BtSide): void {
  m.scope("windows", () => side.panes.forEach((p, i) => m.scope(`window ${i + 1}`, () => {
    const [d0, d1] = [bt(p.d[0]), bt(p.d[1])], f = 0.035;
    const glass = btRound(d0, d1, p.y[0], p.y[1], p.r);
    sideDecal(m, b, X, s, "frameSilver", btRing(btRound(d0 - f, d1 + f, p.y[0] - f, p.y[1] + f, p.r + f), glass), 0.006);
    sideDecal(m, b, X, s, p.mat ?? "glass", btFan(glass), 0.006);
  })));
  m.scope("panels", () => {
    for (const p of side.panels) sideDecal(m, b, X, s, p.mat, btFan(btRound(bt(p.d[0]), bt(p.d[1]), p.y[0], p.y[1], 0.01, 1)), 0.005);
  });
}

/** An air conditioner's housing on the roof over an end: from d0 to d1 (prototype metres), sloping into the roof beyond d1. */
function btHood(m: MeshBuilder, X: (d: number) => number, d0: number, d1: number, top: number): void {
  const z = 1.18, zt = 1.02, y0 = 3.6;
  const high: Ring = [[-z, y0], [z, y0], [z, top - 0.11], [zt, top], [-zt, top], [-z, top - 0.11]];
  const low: Ring = [[-z, y0], [z, y0], [z, 3.64], [zt, 3.7], [-zt, 3.7], [-z, 3.64]];
  const [a, e] = [X(bt(d0)), X(bt(d1))], tail = X(bt(d1 + 0.55 * Math.sign(d1 - d0)));
  m.scope("air conditioner", () => {
    m.sweep("btHood", "x", high, Math.min(a, e), high, Math.max(a, e));
    if (tail < e) m.sweep("btHood", "x", low, tail, high, e);
    else m.sweep("btHood", "x", high, e, low, tail);
    // the condensers' grilles on top and the louvres along its sides
    const [g0, g1] = [Math.min(a, e) + 0.25, Math.max(a, e) - 0.25];
    const gm = (g0 + g1) / 2;
    for (const [p, q] of [[g0, gm - 0.1], [gm + 0.1, g1]] as const)
      m.facets("louvre", [[p, top + 0.004, -0.62], [q, top + 0.004, -0.62], [q, top + 0.004, 0.62], [p, top + 0.004, -0.62], [q, top + 0.004, 0.62], [p, top + 0.004, 0.62]], [0, 1, 0]);
    for (const s of [-1, 1]) decalZ(m, "louvre", s * (z + 0.004), s, g0, g1, top - 0.26, top - 0.14);
  });
}

/** An end wall at |x| = face facing e: the gangway door inside the bellows, the tail lamps, grab rails. */
function btEnd(m: MeshBuilder, e: number, face: number): void {
  const x = e * (face + 0.004);
  // the bellows (the kit leaves them off a shaped end)
  m.scope("diaphragm", () => endDiaphragm(m, e, e * face, 1.15, 3.4, 0.42));
  m.scope("gangway door", () => {
    for (const [z0, z1, y0, y1] of [[-0.37, -0.34, 1.17, 3.28], [0.34, 0.37, 1.17, 3.28], [-0.34, 0.34, 3.25, 3.28]] as const) decalX(m, "rubber", x, e, z0, z1, y0, y1);
    decalX(m, "rubber", x, e, -0.24, 0.24, 2.42, 3.06);
    decalX(m, "glass", e * (face + 0.007), e, -0.2, 0.2, 2.46, 3.02);
  });
  m.scope("tail lamps", () => faceLamps(m, e, face, [[-0.98, 1.66, 0.075, "lampRed"], [0.98, 1.66, 0.075, "lampRed"]]));
  m.scope("grab rails", () => { for (const z of [-0.78, 0.78]) m.rod("handrail", [e * (face + 0.06), 1.35, z], [e * (face + 0.06), 2.6, z], 0.015, 6); });
}

/** The underfloor equipment between the bogies: boxes (d0, d1, bottom, z0, z1) and tanks (d0, d1, radius, y, z). */
const BT_UNDER: Record<BlueTrainCar, { boxes: Array<readonly [number, number, number, number, number]>; tanks: Array<readonly [number, number, number, number, number]> }> = {
  sleeper: {
    boxes: [[4.8, 5.8, 0.55, -0.2, 1.1], [6.1, 7.3, 0.6, -1.1, 0.4], [7.6, 8.3, 0.5, 0.2, 1.1], [10.8, 12.0, 0.6, -1.05, 0.3], [12.3, 12.9, 0.55, 0.3, 1.1]],
    tanks: [[8.6, 10.4, 0.18, 0.78, 0.7], [13.2, 15.1, 0.3, 0.68, -0.45]],
  },
  dining: {
    boxes: [[4.8, 6.0, 0.55, -0.4, 1.1], [6.3, 7.2, 0.6, -1.1, 0.2], [7.5, 8.5, 0.5, 0.1, 1.1], [8.8, 9.6, 0.62, -1.0, 0.0]],
    tanks: [[9.9, 10.5, 0.16, 0.8, 0.75], [10.8, 12.9, 0.34, 0.66, 0.55], [13.1, 15.1, 0.34, 0.66, 0.55]],
  },
};

function blueDef(u: BlueTrainCar): CarDef {
  const L = BLUE_BODY;
  const trucks = [L / 2 - 7.075, L / 2 + 7.075];
  const sleeper = u === "sleeper";
  return {
    spec: { length: L, W: BT.W, Y: BT.Y, S: BT.S, C: BT.C, lean: BT.lean, arc: 6, B: BT.B, wl: 1.43, A: BT.A, wa: 1.46, front: BT_END, rear: BT_END, edges: [], step: 1.0, noseStep: 0.06, cuts: trucks.map((d) => [d - 1.6, d + 1.6] as const) },
    bands: BT_BANDS, doorBands: [[0, 9, "btBlue"]],
    roof: "btRoof", skirt: "btBlue", under: "under",
    windows: [],
    // the sleeper's folding vestibule door (two leaves, a tall narrow window each), the dining car's kitchen door
    doors: sleeper
      ? { spans: [[bt(0.35), bt(1.15)]], y: [1.1, 3.28], glass: [2.07, 3.18], glassW: 0.16, glassPair: 0.4 }
      : { spans: [[bt(1.3), bt(2.15)]], y: [1.12, 3.06], glass: [2.38, 2.96], glassW: 0.45 },
    cabEnds: [], diaphragm: [1.15, 3.4], diaphragmW: 0.42,
    trucks, truck: { axles: [-1.05, 1.05], wheelR: 0.43, frameHalf: 1.65, frameTop: 0.92, frameBottom: 0.55, frameZ: [0.92, 1.04], primary: "coil", secondary: [0], secondaryZ: 1.05, bolster: BT.B },
    coupler: "knuckle", couplerY: COUPLER_Y, gap: [0.25, 0.25],
    lettering: [{ text: sleeper ? "OHANE 25 118" : "OSHI 24 101", d: bt(10.4), y: 1.63, h: 0.09, mat: "btSign" }],
    extras: (m, b, X) => {
      for (const s of [1, -1])
        m.scope(s > 0 ? "right side" : "left side", () => btSide(m, b, X, s, sleeper ? (s === BT_BERTH_S ? BT_SLEEPER.berth : BT_SLEEPER.corridor) : BT_DINER));
      m.scope("roof", () => {
        btHood(m, X, 0.12, 2.45, BT.hood);
        if (sleeper) btHood(m, X, 19.88, 17.55, BT.hood);
        else btHood(m, X, 19.88, 18.5, BT.hood - 0.05);
      });
      for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => btEnd(m, e, Math.abs(X(e > 0 ? 0 : L))));
      m.scope("underfloor", () => {
        const g = BT_UNDER[u];
        for (const [d0, d1, y0, z0, z1] of g.boxes) block(m, "under", X(bt(d1)), X(bt(d0)), y0, BT.B + 0.01, z0, z1);
        for (const [d0, d1, r, y, z] of g.tanks) { const ring = ngon(12, r, 0, z, y); m.sweep("tank", "x", ring, X(bt(d1)), ring, X(bt(d0))); }
      });
    },
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
  const side: LodBand[] = [[BT.B, 1.12, "btBlue"], [1.12, 1.17, "btLine"], [1.17, 1.94, "btBlue"], [1.94, 2.0, "btLine"], [2.0, BT.S, "btBlue"], [BT.S, BT.C, "btRoof"]];
  const [w0, w1, wy] = u === "sleeper" ? [2.45, 18.2, [2.09, 2.78] as const] : [3.12, 18.02, [2.38, 3.0] as const];
  const body: UnitBody = { y0: BT.B, hw: [[BT.B, 1.43], [BT.A, 1.46], [BT.Y, BT.W], [BT.S, BT.W * BT.lean], [BT.C, 0.4]], side, roof: "btRoof", front: { tip: [[BT.B, X(0)]] }, rear: { tip: [[BT.B, X(BLUE_BODY)]] },
    windows: [{ u: [X(bt(w1)), X(bt(w0))], y: wy, mat: LOD_GLASS }] };
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...BLUE_PAL }, bodies: [body], parts: bogieParts(def.trucks.map((d) => [X(d), 1.65] as const), BT.B) }, 100);
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
