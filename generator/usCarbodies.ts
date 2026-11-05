// The North American streamlined carbodies: the EMD F7A cab unit (1949), the GE
// P42DC "Genesis" (1996), the Siemens ALC-42 "Charger" (2022), the Pennsylvania
// Railroad's GG1 electric (1935) and the first Acela Express (2000) with its
// coaches and train. Drawn at their real size (the US loading gauge,
// loadingGauge.ts) on the carbody kit (carbodyKit.ts): each body is lofted
// through slices from its nose tables. Registered in generate.ts as one family:
// a design's JS model imports its builder by name from this module.
// See docs/models/us-carbodies.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import { MeshBuilder as Builder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { bogie, exhaust, extrude, horn, paint, roofFan, tankX, type BogieSpec } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import type { Pt } from "./sliceLoft.ts";
import { crownPane, sideDecal, sideLettering, sidePanel, sliceCabin, surfaceDisc, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { openable, plugMove } from "./doors.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, endDiaphragm, faceLamps, pilotPlate, type CarbodySpec, type Painter } from "./carbodyKit.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import { diamond, singleArm } from "./czElectricKit.ts";
import { EMU_CATALOG, enumParam } from "./emuParts.ts";
import { articulate } from "./tramKit.ts";
import { LOD_GLASS, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, pantographParts, roofPart, turnBody, type UnitBody } from "./lodUnits.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;
const COUPLER_Y = 0.88;

// ---------------------------------------------------------------------------
// Shared fittings

/** The first d (from the +X tip) at which the body's centre line reaches height y: where a lamp on the nose stands. */
function noseD(b: SliceBody, y: number, rear = false): number {
  for (let k = 0; k <= 400; k++) {
    const d = k * 0.01;
    const dd = rear ? b.length - d : d;
    if (b.B(dd) <= y && b.C(dd) >= y) return d;
  }
  return 0;
}

/** Lamps on the nose's centre: each at its height, standing on the nose's front (e +1 the +X end). */
function noseLamps(m: MeshBuilder, b: SliceBody, X: (d: number) => number, e: number, lamps: ReadonlyArray<readonly [z: number, y: number, r: number, lens: string]>): void {
  for (const l of lamps) {
    const d = noseD(b, l[1], e < 0);
    const x = X(e > 0 ? d + 0.02 : b.length - d - 0.02);
    faceLamps(m, e, e * x, [l]);
  }
}

/** A window on the side: its rubber and its glass on the slice body. */
function sideWindow(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number, frame = "rubber", glass = "glass"): void {
  sidePanel(m, b, X, s, frame, d0, d1, y0, y1, 0.006, 0.03);
  sidePanel(m, b, X, s, glass, d0 + 0.04, d1 - 0.04, y0 + 0.04, y1 - 0.04, 0.012, 0.004);
}

/** A grille panel on the side: its frame and slats. */
function sideGrille(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number, vertical = false): void {
  sidePanel(m, b, X, s, "grille", d0, d1, y0, y1, 0.006, 0.02);
  if (vertical) for (let d = d0 + 0.08; d < d1 - 0.05; d += 0.12) sidePanel(m, b, X, s, "louvre", d, d + 0.04, y0 + 0.05, y1 - 0.05, 0.01, 0.004);
  else for (let y = y0 + 0.06; y < y1 - 0.04; y += 0.09) sidePanel(m, b, X, s, "louvre", d0 + 0.05, d1 - 0.05, y, y + 0.035, 0.01, 0.004);
}

/** A US truck (the diesel toolkit's bogie) at model x. */
function truck(m: MeshBuilder, x: number, spec: BogieSpec): void {
  bogie(m, x, spec);
}

/** The skirt's cut-outs over trucks at model x = +-centre, for a body whose +X tip is at `tip` (d = tip - x). */
const truckCuts = (tip: number, centre: number, reach: number): Array<readonly [number, number]> =>
  [tip - centre, tip + centre].map((d) => [d - reach, d + reach] as const);

const truckSpec = (axles: number[], wheelR: number, frameHalf: number, bolster: number): BogieSpec => ({
  axles, wheelR, frameHalf, frameTop: wheelR + 0.48, frameBottom: wheelR + 0.1, frameZ: [0.92, 1.06], primary: "coil",
  secondary: axles.length > 2 ? [-1.0, 1.0] : [-0.45, 0.45], secondaryZ: 1.12, bolster,
});

/** A livery of a carbody: horizontal bands over the side, a nose field, decals and lettering. */
export interface CarbodyLivery {
  title: string;
  palette: Record<string, MaterialSpec>;
  /** Side paint by height (the faces between the skirt and the shoulder), bottom up. */
  bands: ReadonlyArray<readonly [number, number, string]>;
  roof: string;
  skirt: string;
  under: string;
  /** The nose painted over to this d from the tip (both tips of a double-ended body), up to `maxY`. */
  nose?: { d: number; mat: string; maxY?: number };
  /** Lettering along the sides: text, d of its centre, foot height, letter height, paint. */
  lettering?: { text: string; d: number; y: number; h: number; mat: string };
  number: string;
  numberMat: string;
  /** Extra decals on each side (a warbonnet's band, a GG1's pinstripes). */
  decals?: (m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number) => void;
}

function painter(l: CarbodyLivery, length: number, doubleEnded: boolean): Painter {
  const base = bandPainter(l.bands, l.roof, l.under, l.skirt);
  return (d, y, region) => {
    const n = l.nose;
    const near = n && (d < n.d || (doubleEnded && length - d < n.d));
    if (near && region !== "bottom" && region !== "skirt" && y <= (n.maxY ?? Infinity)) return n.mat;
    return base(d, y, region);
  };
}

/** The livery's edges: the band boundaries between belly and shoulder. */
const edgesOf = (l: CarbodyLivery, Y: number, S: number): number[] => [...new Set(l.bands.flatMap(([a, b]) => [a, b]))].filter((y) => y > Y + 0.01 && y < S - 0.01).sort((a, b) => a - b);

/** A strip decal along the side from d0 to d1 whose foot and head follow lo(d) and hi(d). */
function stripDecal(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, lo: (d: number) => number, hi: (d: number) => number, proud: number, n = 16): void {
  const tris: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const [a, c] = [d0 + ((d1 - d0) * i) / n, d0 + ((d1 - d0) * (i + 1)) / n];
    if (hi(a) - lo(a) < 1e-4 && hi(c) - lo(c) < 1e-4) continue;
    tris.push([a, lo(a)], [c, lo(c)], [c, hi(c)], [a, lo(a)], [c, hi(c)], [a, hi(a)]);
  }
  if (tris.length) sideDecal(m, b, X, s, mat, tris, proud);
}

// ---------------------------------------------------------------------------
// EMD F7A

const F7_LENGTH = ft(50, 8); // 15.44 m over the couplers
const F7_REACH = 0.45; // the nose tip behind the front coupler face
const F7_REAR = 0.35;
const F7_BODY = F7_LENGTH - F7_REACH - F7_REAR;
const F7_TRUCK = ft(30) / 2;

export const F7_SPEC: CarbodySpec = {
  length: F7_BODY, W: 1.58, Y: 1.5, S: 3.75, C: 4.32, lean: 0.95, arc: 7, B: 1.2, wl: 1.5, A: 1.26, wa: 1.56,
  front: {
    len: 2.3, tip: 0.3, power: 2.2,
    C: [[0, 2.25], [0.08, 2.6], [0.25, 2.86], [0.55, 3.04], [1.0, 3.18], [1.6, 3.28], [1.75, 3.42], [2.2, 4.12], [2.55, 4.44], [3.0, 4.55], [4.8, 4.55], [5.2, 4.32]],
    S: [[0, 2.15], [0.3, 2.62], [1.0, 2.92], [1.6, 3.06], [2.2, 3.5], [2.6, 3.75]],
    Y: [[0, 1.95], [0.3, 1.72], [0.8, 1.55], [1.2, 1.5]],
    A: [[0, 1.62], [0.3, 1.36], [0.8, 1.26]],
    B: [[0, 1.58], [0.3, 1.32], [0.8, 1.2]],
  },
  edges: [], step: 0.6, noseStep: 0.15,
};

const F7_PAL = {
  silver: paint("#c4c8cc", 0.35), warRed: paint("#b8222a"), warYellow: paint("#f0c21c"), warBlack: paint("#1e1f21"),
  upYellow: paint("#f4b92a"), upGrey: paint("#9fa2a3"), upRed: paint("#b5202b"),
  spRed: paint("#b0262a"), spOrange: paint("#ec6c1f"), spBlack: paint("#1c1d1f"), spWhite: paint("#efefea"),
  truckGrey: paint("#4c4e50", 0.8), truckBlack: paint("#242527", 0.85),
};
const pickF7 = (...n: Array<keyof typeof F7_PAL>) => Object.fromEntries(n.map((k) => [k, F7_PAL[k]]));

/** The warbonnet: the red bonnet over the nose sweeping back as a band, outlined in yellow, to a point behind the cab. */
function warbonnet(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number): void {
  const [d0, d1] = [1.3, 6.4];
  const t = (d: number) => Math.min(1, Math.max(0, (d - 1.6) / (d1 - 1.6)));
  const hi = (d: number) => 3.05 - 0.55 * t(d);
  const lo = (d: number) => 2.05 + 0.45 * t(d);
  stripDecal(m, b, X, s, "warYellow", d0, d1 + 0.25, (d) => lo(d) - 0.07, (d) => Math.max(lo(d) - 0.07, hi(d) + 0.07), 0.004, 20);
  stripDecal(m, b, X, s, "warRed", d0, d1, lo, (d) => Math.max(lo(d), hi(d)), 0.008, 20);
}

export const F7_LIVERIES: Record<string, CarbodyLivery> = {
  santaFe: {
    title: "Santa Fe", palette: pickF7("silver", "warRed", "warYellow", "warBlack", "truckGrey"),
    bands: [[0, 9, "silver"]], roof: "silver", skirt: "silver", under: "truckGrey",
    nose: { d: 1.68, mat: "warRed", maxY: 3.34 },
    lettering: { text: "SANTA FE", d: 8.7, y: 3.42, h: 0.24, mat: "warBlack" },
    number: "37", numberMat: "warBlack", decals: warbonnet,
  },
  unionPacific: {
    title: "Union Pacific", palette: pickF7("upYellow", "upGrey", "upRed", "truckGrey"),
    bands: [[0, 1.62, "upGrey"], [1.62, 1.68, "upRed"], [1.68, 3.62, "upYellow"], [3.62, 3.68, "upRed"], [3.68, 9, "upGrey"]],
    roof: "upGrey", skirt: "upGrey", under: "truckGrey",
    lettering: { text: "UNION PACIFIC", d: 8.7, y: 2.3, h: 0.36, mat: "upRed" },
    number: "1469", numberMat: "upRed",
  },
  southernPacific: {
    title: "SP Daylight", palette: pickF7("spRed", "spOrange", "spBlack", "spWhite", "truckBlack"),
    bands: [[0, 2.05, "spRed"], [2.05, 2.1, "spWhite"], [2.1, 3.1, "spOrange"], [3.1, 3.15, "spWhite"], [3.15, 9, "spRed"]],
    roof: "spBlack", skirt: "spBlack", under: "truckBlack",
    lettering: { text: "SOUTHERN PACIFIC", d: 8.7, y: 2.35, h: 0.34, mat: "spWhite" },
    number: "6402", numberMat: "spWhite",
  },
};

const f7Painter = (l: CarbodyLivery) => painter(l, F7_BODY, false);

function f7Body(l: CarbodyLivery): SliceBody {
  return carbody({ ...F7_SPEC, edges: edgesOf(l, F7_SPEC.Y, F7_SPEC.S) });
}

export function buildF7(l: CarbodyLivery): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  const b = f7Body(l);
  const tip = F7_LENGTH / 2 - F7_REACH;
  const X = (d: number) => tip - d;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, f7Painter(l), { front: true, rear: true }));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        if (l.decals) m.scope("paint", () => l.decals!(m, b, X, s));
        m.scope("cab windows", () => sideWindow(m, b, X, s, 2.65, 3.45, 3.05, 3.62));
        m.scope("cab door", () => sidePanel(m, b, X, s, "black", 3.75, 4.5, 1.65, 3.5, 0.003, 0.004));
        // three portholes along the engine room and the filter grilles between them
        m.scope("portholes", () => {
          for (const d of [6.3, 8.6, 10.9]) {
            surfaceDisc(m, b, X, d, 3.05, s, "rubber", 0.24, 0.005, 0.03, 16);
            surfaceDisc(m, b, X, d, 3.05, s, "glass", 0.19, 0.012, 0.004, 16);
          }
        });
        m.scope("grilles", () => {
          for (const [a, c] of [[5.0, 5.95], [6.65, 8.25], [8.95, 10.55], [11.25, 13.6]] as const) sideGrille(m, b, X, s, a, c, 3.33, 3.68, true);
        });
        if (l.lettering) m.scope("lettering", () => sideLettering(m, b, X, s, l.lettering!.text, l.lettering!.d, l.lettering!.y, l.lettering!.h, l.lettering!.mat, 0.012));
        m.scope("number", () => sideLettering(m, b, X, s, l.number, 3.05, 2.55, 0.26, l.numberMat, 0.012));
      });
  });
  m.scope("nose", () => {
    m.scope("windscreen", () => {
      for (const s of [1, -1]) {
        crownPane(m, b, X, s, "rubber", [1.74, 2.48], [0.06, 0.92], 0.006);
        crownPane(m, b, X, s, "cabGlass", [1.8, 2.42], [0.11, 0.87], 0.012);
      }
    });
    m.scope("headlights", () => noseLamps(m, b, X, 1, [[0, 2.85, 0.15, "lampHead"], [0, 2.45, 0.1, "lampHead"]]));
    m.scope("number boards", () => {
      for (const s of [1, -1]) sidePanel(m, b, X, s, "numberBoard", 0.75, 1.25, 2.85, 3.0, 0.006, 0.02);
    });
    m.scope("pilot", () => pilotPlate(m, "warBlack" in l.palette ? "warBlack" : l.skirt, 1, tip - 0.05, 0.15, 1.3, 1.25, 0.4, 0.6));
    m.scope("coupler", () => knuckleCoupler(m, 1, tip - 0.25, F7_LENGTH / 2, COUPLER_Y));
  });
  m.scope("rear end", () => {
    const x = X(F7_BODY);
    endDiaphragm(m, -1, x, 1.35, 3.95);
    faceLamps(m, -1, -x, [[0, 3.95, 0.12, "lampHead"], [-1.1, 2.0, 0.07, "lampRed"], [1.1, 2.0, 0.07, "lampRed"]]);
    m.scope("coupler", () => knuckleCoupler(m, -1, -x - 0.1, F7_LENGTH / 2, COUPLER_Y));
    block(m, "truckBlack" in l.palette ? "truckBlack" : "underframe", x - 0.3, x + 0.02, 0.45, 1.22, -1.2, 1.2);
  });
  m.scope("roof", () => {
    m.scope("fans", () => { for (const d of [10.6, 11.9, 13.2]) roofFan(m, X(d), 0, 4.32, 0.46); });
    m.scope("dynamic brake fan", () => roofFan(m, X(6.0), 0, 4.32, 0.42));
    m.scope("exhaust", () => exhaust(m, X(8.6), 0, 4.3, 4.45, 0.3, 0.55));
    m.scope("horn", () => horn(m, 1, X(3.4), 0.45, 4.68));
  });
  m.scope("running gear", () => {
    const spec = truckSpec([-ft(4, 6), ft(4, 6)], ft(0, 20), 2.0, 1.2);
    m.scope("front truck", () => truck(m, F7_TRUCK, spec));
    m.scope("rear truck", () => truck(m, -F7_TRUCK, spec));
    m.scope("fuel tank", () => {
      block(m, l.under, -2.4, 2.4, 0.5, 1.0, -1.25, 1.25);
      block(m, l.under, X(F7_BODY) + 0.05, tip - 0.9, 1.0, F7_SPEC.B - 0.01, -1.3, 1.3);
      for (const s of [-1, 1]) tankX(m, "tank", 2.5, 2.6 + 0.0, s * 0.8, 0.9, 0.2);
    });
  });
  return m;
}

// ---------------------------------------------------------------------------
// GE P42DC Genesis

const P42_LENGTH = ft(69); // 21.03 m
const P42_REACH = 0.4;
const P42_BODY = P42_LENGTH - P42_REACH - 0.35;
const P42_TRUCK = ft(43, 2.5) / 2;

const P42_SPEC: CarbodySpec = {
  length: P42_BODY, W: 1.52, Y: 1.4, S: 4.05, C: 4.37, lean: 0.94, arc: 5, B: 1.0, wl: 1.42, A: 1.32, wa: 1.49,
  front: {
    len: 1.2, tip: 0.55, power: 1.6,
    C: [[0, 2.3], [0.12, 2.78], [0.55, 3.08], [0.75, 3.14], [1.55, 4.12], [1.95, 4.37]],
    S: [[0, 2.2], [0.12, 2.68], [0.55, 2.98], [0.75, 3.04], [1.55, 3.86], [1.95, 4.05]],
    Y: [[0, 1.6], [0.3, 1.45], [0.6, 1.4]],
    A: [[0, 1.45], [0.4, 1.32]],
    B: [[0, 1.42], [0.2, 1.05], [0.4, 1.0]],
  },
  cuts: truckCuts(P42_LENGTH / 2 - P42_REACH, P42_TRUCK, 1.95),
  edges: [], step: 1.0, noseStep: 0.15,
};

const P42_PAL = {
  silver: paint("#c2c6ca", 0.35), amBlue: paint("#1f3f7a"), amRed: paint("#b8222a"), amWhite: paint("#f0f0ec"), amDark: paint("#23272d"),
  viaBlue: paint("#1b2f6b"), viaYellow: paint("#f2c31a"), viaGrey: paint("#a8abaf", 0.4),
  truckBlack: paint("#242527", 0.85),
};
const pickP42 = (...n: Array<keyof typeof P42_PAL>) => Object.fromEntries(n.map((k) => [k, P42_PAL[k]]));

export const P42_LIVERIES: Record<string, CarbodyLivery> = {
  phaseV: {
    title: "Amtrak Phase V", palette: pickP42("silver", "amBlue", "amRed", "amDark", "truckBlack"),
    bands: [[0, 1.62, "amBlue"], [1.62, 1.68, "amRed"], [1.68, 3.75, "silver"], [3.75, 9, "amBlue"]],
    roof: "amBlue", skirt: "amBlue", under: "truckBlack",
    lettering: { text: "AMTRAK", d: 11.5, y: 2.55, h: 0.42, mat: "amBlue" },
    number: "100", numberMat: "amBlue",
  },
  phaseIII: {
    title: "Amtrak Phase III", palette: pickP42("silver", "amBlue", "amRed", "amWhite", "amDark", "truckBlack"),
    bands: [[0, 2.0, "silver"], [2.0, 2.16, "amRed"], [2.16, 2.22, "amWhite"], [2.22, 2.38, "amBlue"], [2.38, 9, "silver"]],
    roof: "silver", skirt: "amDark", under: "truckBlack",
    lettering: { text: "AMTRAK", d: 11.5, y: 2.75, h: 0.42, mat: "amDark" },
    number: "42", numberMat: "amDark",
  },
  via: {
    title: "VIA Rail", palette: pickP42("viaBlue", "viaYellow", "viaGrey", "truckBlack"),
    bands: [[0, 1.75, "viaBlue"], [1.75, 1.88, "viaYellow"], [1.88, 9, "viaGrey"]],
    roof: "viaGrey", skirt: "viaBlue", under: "truckBlack",
    lettering: { text: "VIA", d: 11.5, y: 2.6, h: 0.5, mat: "viaBlue" },
    number: "901", numberMat: "viaBlue",
  },
};

export function buildP42(l: CarbodyLivery): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  const b = carbody({ ...P42_SPEC, edges: edgesOf(l, P42_SPEC.Y, P42_SPEC.S) });
  const tip = P42_LENGTH / 2 - P42_REACH;
  const X = (d: number) => tip - d;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, painter(l, P42_BODY, false), { front: true, rear: true }));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab window", () => sideWindow(m, b, X, s, 1.95, 2.85, 3.05, 3.65));
        m.scope("cab door", () => sidePanel(m, b, X, s, "black", 3.0, 3.6, 1.5, 3.6, 0.003, 0.004));
        m.scope("grilles", () => {
          for (const [a, c] of [[5.0, 7.6], [8.2, 10.6], [14.5, 19.4]] as const) sideGrille(m, b, X, s, a, c, 3.1, 3.85);
        });
        if (l.lettering) m.scope("lettering", () => sideLettering(m, b, X, s, l.lettering!.text, l.lettering!.d, l.lettering!.y, l.lettering!.h, l.lettering!.mat, 0.012));
        m.scope("number", () => sideLettering(m, b, X, s, l.number, 3.9, 2.1, 0.3, l.numberMat, 0.012));
      });
  });
  m.scope("nose", () => {
    m.scope("windscreen", () => {
      for (const s of [1, -1]) {
        crownPane(m, b, X, s, "rubber", [0.85, 1.6], [0.05, 1.12], 0.006);
        crownPane(m, b, X, s, "cabGlass", [0.9, 1.55], [0.1, 1.07], 0.012);
      }
    });
    m.scope("headlights", () => noseLamps(m, b, X, 1, [[-0.32, 2.55, 0.1, "lampHead"], [0.32, 2.55, 0.1, "lampHead"], [-1.0, 1.25, 0.09, "ditch"], [1.0, 1.25, 0.09, "ditch"]]));
    m.scope("pilot", () => pilotPlate(m, l.skirt, 1, tip - 0.02, 0.15, 1.05, 1.3, 0.3, 0.5));
    m.scope("coupler", () => knuckleCoupler(m, 1, tip - 0.25, P42_LENGTH / 2, COUPLER_Y));
  });
  m.scope("rear end", () => {
    const x = X(P42_BODY);
    endDiaphragm(m, -1, x, 1.3, 3.8);
    faceLamps(m, -1, -x, [[-1.1, 3.9, 0.08, "lampRed"], [1.1, 3.9, 0.08, "lampRed"], [0, 3.95, 0.1, "lampHead"]]);
    m.scope("coupler", () => knuckleCoupler(m, -1, -x - 0.1, P42_LENGTH / 2, COUPLER_Y));
    block(m, "truckBlack", x - 0.3, x + 0.02, 0.25, 1.02, -1.2, 1.2);
  });
  m.scope("roof", () => {
    m.scope("fans", () => { for (const d of [15.4, 17.0, 18.6]) roofFan(m, X(d), 0, 4.37, 0.5); });
    m.scope("exhaust", () => exhaust(m, X(11.0), 0, 4.35, 4.5, 0.4, 0.7));
    m.scope("horn", () => horn(m, 1, X(3.0), 0.4, 4.5));
  });
  m.scope("running gear", () => {
    const spec = truckSpec([-ft(4, 6), ft(4, 6)], ft(0, 20), 2.0, 1.0);
    m.scope("front truck", () => truck(m, P42_TRUCK, spec));
    m.scope("rear truck", () => truck(m, -P42_TRUCK, spec));
    m.scope("fuel tank", () => block(m, l.under, -3.6, 3.6, 0.42, 1.0, -1.3, 1.3));
    m.scope("frame", () => block(m, l.under, X(P42_BODY) + 0.05, tip - 0.6, 0.98, P42_SPEC.A - 0.01, -1.3, 1.3));
  });
  return m;
}

// ---------------------------------------------------------------------------
// Siemens ALC-42 Charger

const ALC_LENGTH = 21.79;
const ALC_REACH = 0.4;
const ALC_BODY = ALC_LENGTH - ALC_REACH - 0.35;
const ALC_TRUCK = 12.436 / 2;
const ALC_WHEEL = 0.6;

const ALC_SPEC: CarbodySpec = {
  length: ALC_BODY, W: 1.52, Y: 1.45, S: 4.02, C: 4.39, lean: 0.95, arc: 6, B: 1.05, wl: 1.42, A: 1.38, wa: 1.49,
  front: {
    len: 2.3, tip: 0.22, power: 2.4,
    C: [[0, 2.05], [0.15, 2.55], [0.5, 2.95], [1.0, 3.22], [1.6, 3.48], [2.4, 4.2], [2.9, 4.39]],
    S: [[0, 1.95], [0.15, 2.42], [0.5, 2.78], [1.0, 3.0], [1.6, 3.22], [2.4, 3.88], [2.9, 4.02]],
    Y: [[0, 1.6], [0.4, 1.48], [0.8, 1.45]],
    A: [[0, 1.5], [0.5, 1.38]],
    B: [[0, 1.48], [0.25, 1.1], [0.5, 1.05]],
  },
  cuts: truckCuts(ALC_LENGTH / 2 - ALC_REACH, ALC_TRUCK, 2.1),
  edges: [], step: 1.0, noseStep: 0.15,
};

const ALC_PAL = {
  midnight: paint("#1d2c52"), amRed: paint("#b8222a"), silverLight: paint("#d3d6d9", 0.35), amBlue: paint("#2a5aa8"), truckBlack: paint("#242527", 0.85),
};
const pickAlc = (...n: Array<keyof typeof ALC_PAL>) => Object.fromEntries(n.map((k) => [k, ALC_PAL[k]]));

export const ALC_LIVERIES: Record<string, CarbodyLivery> = {
  phaseVII: {
    title: "Amtrak Phase VII", palette: pickAlc("midnight", "amRed", "silverLight", "truckBlack"),
    bands: [[0, 1.5, "silverLight"], [1.5, 1.6, "amRed"], [1.6, 9, "midnight"]],
    roof: "midnight", skirt: "silverLight", under: "truckBlack",
    lettering: { text: "AMTRAK", d: 11.0, y: 2.6, h: 0.5, mat: "silverLight" },
    number: "301", numberMat: "silverLight",
  },
  midwest: {
    title: "Amtrak Midwest", palette: pickAlc("silverLight", "amBlue", "midnight", "truckBlack"),
    bands: [[0, 1.75, "amBlue"], [1.75, 2.35, "silverLight"], [2.35, 2.48, "amBlue"], [2.48, 9, "silverLight"]],
    roof: "silverLight", skirt: "amBlue", under: "truckBlack", nose: { d: 2.0, mat: "amBlue", maxY: 3.4 },
    lettering: { text: "AMTRAK", d: 11.0, y: 2.7, h: 0.5, mat: "amBlue" },
    number: "4601", numberMat: "midnight",
  },
};

export function buildAlc42(l: CarbodyLivery): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  const b = carbody({ ...ALC_SPEC, edges: edgesOf(l, ALC_SPEC.Y, ALC_SPEC.S) });
  const tip = ALC_LENGTH / 2 - ALC_REACH;
  const X = (d: number) => tip - d;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, painter(l, ALC_BODY, false), { front: true, rear: true }));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab window", () => sideWindow(m, b, X, s, 2.75, 3.55, 3.15, 3.75));
        m.scope("cab door", () => sidePanel(m, b, X, s, "black", 3.7, 4.3, 1.55, 3.7, 0.003, 0.004));
        m.scope("grilles", () => {
          for (const [a, c] of [[6.0, 9.0], [12.0, 15.5], [16.2, 19.6]] as const) sideGrille(m, b, X, s, a, c, 3.25, 3.85, true);
        });
        if (l.lettering) m.scope("lettering", () => sideLettering(m, b, X, s, l.lettering!.text, l.lettering!.d, l.lettering!.y, l.lettering!.h, l.lettering!.mat, 0.012));
        m.scope("number", () => sideLettering(m, b, X, s, l.number, 4.8, 2.4, 0.28, l.numberMat, 0.012));
      });
  });
  m.scope("nose", () => {
    m.scope("windscreen", () => {
      for (const s of [1, -1]) {
        crownPane(m, b, X, s, "rubber", [1.68, 2.62], [0.03, 1.15], 0.006);
        crownPane(m, b, X, s, "cabGlass", [1.73, 2.57], [0.07, 1.1], 0.012);
      }
    });
    m.scope("headlights", () => noseLamps(m, b, X, 1, [[-0.55, 2.0, 0.09, "lampHead"], [0.55, 2.0, 0.09, "lampHead"], [-1.0, 1.25, 0.08, "ditch"], [1.0, 1.25, 0.08, "ditch"]]));
    m.scope("pilot", () => pilotPlate(m, l.skirt, 1, tip - 0.02, 0.15, 1.1, 1.3, 0.3, 0.5));
    m.scope("coupler", () => knuckleCoupler(m, 1, tip - 0.25, ALC_LENGTH / 2, COUPLER_Y));
  });
  m.scope("rear end", () => {
    const x = X(ALC_BODY);
    endDiaphragm(m, -1, x, 1.35, 3.85);
    faceLamps(m, -1, -x, [[-1.1, 3.95, 0.08, "lampRed"], [1.1, 3.95, 0.08, "lampRed"]]);
    m.scope("coupler", () => knuckleCoupler(m, -1, -x - 0.1, ALC_LENGTH / 2, COUPLER_Y));
    block(m, "truckBlack", x - 0.3, x + 0.02, 0.25, 1.07, -1.2, 1.2);
  });
  m.scope("roof", () => {
    m.scope("fans", () => { for (const d of [16.4, 18.2]) roofFan(m, X(d), 0, 4.39, 0.55); });
    m.scope("exhaust", () => exhaust(m, X(10.5), 0, 4.37, 4.52, 0.4, 0.7));
    m.scope("horn", () => horn(m, 1, X(3.6), 0.35, 4.5));
  });
  m.scope("running gear", () => {
    const spec = truckSpec([-1.5, 1.5], ALC_WHEEL, 2.15, 1.05);
    m.scope("front truck", () => truck(m, ALC_TRUCK, spec));
    m.scope("rear truck", () => truck(m, -ALC_TRUCK, spec));
    m.scope("fuel tank", () => block(m, l.under, -3.5, 3.5, 0.42, 1.05, -1.3, 1.3));
    m.scope("frame", () => block(m, l.under, X(ALC_BODY) + 0.05, tip - 0.6, 1.05, ALC_SPEC.A - 0.01, -1.3, 1.3));
  });
  return m;
}

// ---------------------------------------------------------------------------
// PRR GG1: a double-ended streamlined electric, 2-C+C-2 on two articulated frames

const GG1_LENGTH = ft(79, 6); // 24.23 m over the coupler faces
const GG1_REACH = 0.45;
const GG1_BODY = GG1_LENGTH - 2 * GG1_REACH;
const GG1_DRIVER_R = ft(0, 57) / 2;
const GG1_LEAD_R = ft(0, 36) / 2;
/** Axles from the centre of one half (toward its end): three drivers 6 ft 10 in apart, the guiding truck's two. */
const GG1_DRIVERS = [ft(7, 0), ft(13, 10), ft(20, 8)];
const GG1_LEAD = [ft(28, 6), ft(34, 6)];
const GG1_CAB_FROM = 7.4;

const gg1Nose = {
  len: 3.0, tip: 0.3, power: 2.3,
  C: [[0, 1.95], [0.15, 2.45], [0.45, 2.85], [1.0, 3.1], [3.0, 3.36], [6.0, 3.55], [GG1_CAB_FROM - 0.2, 3.62], [GG1_CAB_FROM + 0.25, 4.22], [GG1_CAB_FROM + 0.6, 4.35]] as Pt[],
  S: [[0, 1.9], [0.2, 2.3], [0.6, 2.62], [1.2, 2.82], [3.0, 2.98], [GG1_CAB_FROM - 0.2, 3.12], [GG1_CAB_FROM + 0.3, 3.7], [GG1_CAB_FROM + 0.6, 3.78]] as Pt[],
  Y: [[0, 1.78], [0.4, 1.62], [1.0, 1.58]] as Pt[],
  A: [[0, 1.7], [0.4, 1.53]] as Pt[],
  B: [[0, 1.68], [0.4, 1.5]] as Pt[],
};

const GG1_SPEC: CarbodySpec = {
  length: GG1_BODY, W: 1.56, Y: 1.58, S: 3.78, C: 4.35, lean: 0.95, arc: 7, B: 1.5, wl: 1.5, A: 1.53, wa: 1.55,
  front: gg1Nose, rear: gg1Nose, edges: [], step: 0.8, noseStep: 0.2,
};

const GG1_PAL = {
  brunswick: paint("#1e2d24"), tuscan: paint("#6e2a20"), gold: paint("#d4b05a", 0.4), pcBlack: paint("#1b1c1e"), pcWhite: paint("#eeeeea"),
  truckBlack: paint("#242527", 0.85),
};
const pickGg1 = (...n: Array<keyof typeof GG1_PAL>) => Object.fromEntries(n.map((k) => [k, GG1_PAL[k]]));

/** The five pinstripes along the side, gathering into the "cat whiskers" toward each nose. */
function pinstripes(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number): void {
  const ys = [1.92, 2.17, 2.42, 2.67, 2.92];
  const yc = 2.15, gather = 3.2;
  for (const y of ys) {
    const at = (d: number) => {
      const e = Math.min(d, GG1_BODY - d);
      return yc + (y - yc) * Math.min(1, Math.max(0.12, e / gather));
    };
    stripDecal(m, b, X, s, "gold", 0.12, GG1_BODY - 0.12, (d) => at(d) - 0.018, (d) => at(d) + 0.018, 0.005, 60);
  }
}

export const GG1_LIVERIES: Record<string, CarbodyLivery> = {
  brunswick: {
    title: "Brunswick green", palette: pickGg1("brunswick", "gold", "truckBlack"),
    bands: [[0, 9, "brunswick"]], roof: "brunswick", skirt: "brunswick", under: "truckBlack",
    number: "4935", numberMat: "gold", decals: pinstripes,
  },
  tuscan: {
    title: "Tuscan red", palette: pickGg1("tuscan", "gold", "truckBlack"),
    bands: [[0, 9, "tuscan"]], roof: "tuscan", skirt: "tuscan", under: "truckBlack",
    number: "4800", numberMat: "gold", decals: pinstripes,
  },
  pennCentral: {
    title: "Penn Central", palette: pickGg1("pcBlack", "pcWhite", "truckBlack"),
    bands: [[0, 9, "pcBlack"]], roof: "pcBlack", skirt: "pcBlack", under: "truckBlack",
    lettering: { text: "PENN CENTRAL", d: GG1_BODY / 2, y: 2.3, h: 0.36, mat: "pcWhite" },
    number: "4872", numberMat: "pcWhite",
  },
};

/** A GG1 wheelset at x: tyres, wheel centres (spoked on the drivers), axle and its boxes. */
function gg1Wheel(m: MeshBuilder, x: number, r: number, spokes: boolean): void {
  m.scope("wheelset", () => {
    const ay = r * Math.cos(Math.PI / 24);
    const axle = ngon(8, 0.09, 0, x, ay);
    m.sweep("steel", "z", axle, -0.85, axle, 0.85);
    for (const s of [-1, 1]) {
      extrude(m, "steel", "z", ngon(24, r, Math.PI / 24, x, ay), side(s, 0.665, 0.8));
      extrude(m, "wheel", "z", ngon(20, r * 0.86, 0, x, ay), side(s, 0.8, 0.82));
      if (spokes) for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        const q: Vec3 = [x + Math.cos(a) * r * 0.78, ay + Math.sin(a) * r * 0.78, 0];
        m.rod("bogie", [x, ay, s * 0.825], [q[0], q[1], s * 0.825], 0.045, 6);
      }
      extrude(m, "bogie", "z", ngon(8, 0.16, Math.PI / 8, x, ay), side(s, 0.82, 0.9));
    }
  });
}

/**
 * One half's running gear toward end e: the three drivers in their frame, one
 * bogie node (the articulated frames turn about the centre hinge), and the
 * two-axle guiding truck ahead of them, a bogie node of its own.
 */
function gg1Half(m: MeshBuilder, e: number, spec: { under: string }): void {
  const span = (a: number, b: number): [number, number] => [Math.min(e * a, e * b), Math.max(e * a, e * b)];
  m.scope("driving frame", () => m.bogie(() => {
    for (const a of GG1_DRIVERS) gg1Wheel(m, e * a, GG1_DRIVER_R, true);
    const [f0, f1] = span(GG1_DRIVERS[0]! - 0.9, GG1_DRIVERS[2]! + 0.9);
    block(m, spec.under, f0, f1, 1.0, 1.48, -1.05, 1.05);
    for (const s of [-1, 1]) block(m, "bogie", f0, f1, 0.62, 1.0, ...side(s, 0.9, 1.0));
  }));
  m.scope("guiding truck", () => m.bogie(() => {
    for (const a of GG1_LEAD) gg1Wheel(m, e * a, GG1_LEAD_R, false);
    const [g0, g1] = span(GG1_LEAD[0]! - 0.6, GG1_LEAD[1]! + 0.5);
    for (const s of [-1, 1]) block(m, "bogie", g0, g1, 0.42, 0.78, ...side(s, 0.9, 1.0));
    block(m, spec.under, g0, g1, 0.78, 0.95, -0.95, 0.95);
  }));
  // the frame's extension over the guiding truck, carrying the body's end
  m.scope("frame extension", () => {
    const [a, b] = span(GG1_DRIVERS[2]! + 0.9, GG1_LEAD[0]! - 0.6);
    block(m, spec.under, a, b, 1.0, 1.48, -1.0, 1.0);
  });
}

export function buildGg1(l: CarbodyLivery): MeshBuilder {
  const m = new Builder({ ...CARBODY_PALETTE, ...l.palette });
  const b = carbody({ ...GG1_SPEC, edges: edgesOf(l, GG1_SPEC.Y, GG1_SPEC.S) });
  const tip = GG1_LENGTH / 2 - GG1_REACH;
  const X = (d: number) => tip - d;
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, painter(l, GG1_BODY, true), { front: false, rear: false }));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        if (l.decals) m.scope("paint", () => l.decals!(m, b, X, s));
        // the cab windows at each end of the centre cab, the louvres along it
        m.scope("cab windows", () => {
          for (const d of [GG1_CAB_FROM + 0.75, GG1_BODY - GG1_CAB_FROM - 1.45]) sideWindow(m, b, X, s, d, d + 0.7, 3.0, 3.55);
        });
        m.scope("louvres", () => {
          for (let i = 0; i < 4; i++) {
            const d = GG1_CAB_FROM + 2.0 + i * 1.3;
            sideGrille(m, b, X, s, d, d + 0.9, 3.05, 3.55);
          }
        });
        if (l.lettering) m.scope("lettering", () => sideLettering(m, b, X, s, l.lettering!.text, l.lettering!.d, l.lettering!.y, l.lettering!.h, l.lettering!.mat, 0.012));
        m.scope("number", () => sideLettering(m, b, X, s, l.number, GG1_BODY / 2, l.lettering ? 1.82 : 3.1, 0.24, l.numberMat, 0.012));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const at = (d: number) => (e > 0 ? d : GG1_BODY - d);
      m.scope("windscreen", () => {
        for (const s of [1, -1]) {
          const [d0, d1] = e > 0 ? [GG1_CAB_FROM - 0.15, GG1_CAB_FROM + 0.4] : [at(GG1_CAB_FROM + 0.4), at(GG1_CAB_FROM - 0.15)];
          crownPane(m, b, X, s, "rubber", [d0, d1], [0.15, 0.85], 0.006, 4, 3);
          crownPane(m, b, X, s, "cabGlass", [d0 + 0.03, d1 - 0.03], [0.2, 0.8], 0.012, 4, 3);
        }
      });
      m.scope("headlight", () => noseLamps(m, b, X, e, [[0, 2.55, 0.13, "lampHead"], [-0.75, 1.95, 0.07, e > 0 ? "lampHead" : "lampRed"], [0.75, 1.95, 0.07, e > 0 ? "lampHead" : "lampRed"]]));
      m.scope("pilot", () => pilotPlate(m, l.skirt, e, tip - 0.1, 0.15, 1.55, 1.2, 0.45, 0.7));
      m.scope("coupler", () => knuckleCoupler(m, e, tip - 0.35, GG1_LENGTH / 2, COUPLER_Y));
      m.scope("running gear", () => gg1Half(m, e, { under: l.under }));
    });
  m.scope("roof", () => {
    // the two diamond pantographs over the cab's ends, the rear one raised
    for (const e of [1, -1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => {
        const x = X(e > 0 ? GG1_CAB_FROM + 1.6 : GG1_BODY - GG1_CAB_FROM - 1.6);
        diamond(m, { xc: x, roofY: 4.33, baseY: 4.62, raised: e < 0 });
      });
    m.scope("horn", () => horn(m, 1, X(GG1_CAB_FROM + 3.2), 0.4, 4.48));
  });
  return m;
}

// ---------------------------------------------------------------------------
// The Acela Express (first generation): power cars and tilting coaches

export type AcelaUnit = "powerCar" | "businessClass" | "firstClass" | "cafe" | "train";
export type AcelaCar = Exclude<AcelaUnit, "train">;
export const ACELA_CARS = [3, 4, 5, 6, 7, 8];

export const ACELA_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", { powerCar: "Power car", businessClass: "Business class", firstClass: "First class", cafe: "Cafe car", train: "Full train" }),
  { ...enumParam("cars", "Cars", Object.fromEntries(ACELA_CARS.map((n) => [String(n), `${n} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
];

export const ACELA_LENGTH = { powerCar: 21.22, coach: 26.64 } as const;
const ACELA_GAP = 0.3;
const ACELA_POWER_TRUCKS = 10.74;
const ACELA_COACH_TRUCKS = 18.14;
const isPower = (c: AcelaCar) => c === "powerCar";
export const acelaLength = (c: AcelaCar) => (isPower(c) ? ACELA_LENGTH.powerCar : ACELA_LENGTH.coach);

const ACELA_PAL = {
  acSilver: paint("#c7cbce", 0.35), acDark: paint("#3a4049", 0.5), acBlue: paint("#1f3d6b"), acTeal: paint("#3f8f9c"), truckBlack: paint("#2a2c2f", 0.85),
};

const ACELA_BANDS: ReadonlyArray<readonly [number, number, string]> = [[0, 1.45, "acDark"], [1.45, 2.12, "acSilver"], [2.12, 2.18, "acTeal"], [2.18, 2.28, "acSilver"], [2.28, 3.02, "acDark"], [3.02, 9, "acSilver"]];
const acelaPaint = bandPainter(ACELA_BANDS, "acSilver", "truckBlack", "acDark");

const ACELA_POWER_BODY = ACELA_LENGTH.powerCar - ACELA_GAP - 0.4;
const ACELA_POWER: CarbodySpec = {
  length: ACELA_POWER_BODY, W: 1.58, Y: 1.4, S: 3.95, C: 4.32, lean: 0.95, arc: 6, B: 0.85, wl: 1.48, A: 1.2, wa: 1.56,
  front: {
    len: 3.6, tip: 0.12, power: 2.2,
    C: [[0, 1.55], [0.3, 2.0], [1.5, 2.6], [3.2, 3.3], [4.2, 3.92], [4.8, 4.22], [5.2, 4.32]],
    S: [[0, 1.5], [0.3, 1.92], [1.5, 2.42], [3.2, 3.02], [4.2, 3.62], [5.2, 3.95]],
    Y: [[0, 1.35], [1.0, 1.4]],
    A: [[0, 1.3], [0.8, 1.2]],
    B: [[0, 1.25], [0.3, 0.55], [1.2, 0.5], [1.8, 0.85]],
  },
  edges: [], step: 1.0, noseStep: 0.2,
};
const ACELA_COACH_BODY = ACELA_LENGTH.coach - 2 * ACELA_GAP;
const ACELA_COACH: CarbodySpec = {
  length: ACELA_COACH_BODY, W: 1.57, Y: 1.4, S: 3.7, C: 4.23, lean: 0.93, arc: 6, B: 0.85, wl: 1.48, A: 1.2, wa: 1.55,
  edges: [], step: 1.0,
};

/** Truck positions (d) of a car, metres back from its body's +X end. */
function acelaTrucks(c: AcelaCar): [number, number] {
  if (isPower(c)) {
    const mid = ACELA_POWER_BODY / 2 + 0.6;
    return [mid - ACELA_POWER_TRUCKS / 2, mid + ACELA_POWER_TRUCKS / 2];
  }
  return [ACELA_COACH_BODY / 2 - ACELA_COACH_TRUCKS / 2, ACELA_COACH_BODY / 2 + ACELA_COACH_TRUCKS / 2];
}

function acelaSpec(c: AcelaCar): CarbodySpec {
  const base = isPower(c) ? ACELA_POWER : ACELA_COACH;
  const reach = isPower(c) ? 1.6 : 1.55;
  return { ...base, cuts: acelaTrucks(c).map((d) => [d - reach, d + reach] as const), edges: edgesOf({ bands: ACELA_BANDS } as CarbodyLivery, base.Y, base.S) };
}

/** A coach's doors (d spans) at both ends, on both sides; the doorway's sill and head. */
const ACELA_DOORS: ReadonlyArray<readonly [number, number]> = [[0.5, 1.5], [ACELA_COACH_BODY - 1.5, ACELA_COACH_BODY - 0.5]];
const ACELA_DOOR_Y: [number, number] = [1.3, 3.15];
const ACELA_WIN: [number, number] = [2.33, 2.97];
const LEAF_INSET = 0.02;

/** A coach's side windows (d spans). */
function acelaWindows(c: AcelaCar): Array<[number, number]> {
  const first = c === "firstClass";
  const n = first ? 11 : c === "cafe" ? 8 : 13;
  const pitch = first ? 1.85 : 1.6;
  const w = first ? 1.35 : 1.15;
  const mid = ACELA_COACH_BODY / 2;
  return Array.from({ length: n }, (_, i): [number, number] => {
    const d = mid + (i - (n - 1) / 2) * pitch;
    return [d - w / 2, d + w / 2];
  });
}

/** The doors' leaf boxes on both sides: the doorways into the coach's cabin (doors.ts). */
const acelaLeaves = (): SliceDoorway[] => [1, -1].flatMap((s) => ACELA_DOORS.map(([a, b]) => ({ s, d0: a + LEAF_INSET, d1: b - LEAF_INSET, y0: ACELA_DOOR_Y[0] + LEAF_INSET, y1: ACELA_DOOR_Y[1] - LEAF_INSET })));

/** A plug door: its frame round the doorway, the leaf in the body's bands with its window, sliding toward the car's middle; the step. */
function acelaDoor(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number): void {
  const [y0, y1] = ACELA_DOOR_Y;
  const k = LEAF_INSET;
  m.scope("outline", () => {
    sidePanel(m, b, X, s, "rubber", d0, d0 + k, y0, y1, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d1 - k, d1, y0, y1, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.004, 0.03);
    sidePanel(m, b, X, s, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.004, 0.03);
  });
  const slide = (d0 + d1) / 2 < b.length / 2 ? 1 : -1;
  const dx = X(d0 + slide * (d1 - d0)) - X(d0);
  openable(m, (mm, o) =>
    mm.moved(plugMove(o, s, dx), () => {
      mm.scope("leaf", () => {
        for (const [a, c, mat] of ACELA_BANDS) {
          const [lo, hi] = [Math.max(a, y0 + 0.02), Math.min(c, y1 - 0.02)];
          if (hi - lo > 1e-6) sidePanel(mm, b, X, s, mat, d0 + 0.02, d1 - 0.02, lo, hi, 0.008, 0.003);
        }
      });
      mm.scope("glass", () => sidePanel(mm, b, X, s, "glass", d0 + 0.2, d1 - 0.2, 2.4, 2.95, 0.012, 0.004));
    }),
  );
  m.scope("step", () => sidePanel(m, b, X, s, "truckBlack", d0, d1, 1.22, 1.3, 0.006, 0.2));
}

/** A car facing +X drawn into m with X(d) the map from d to model x. */
function drawAcelaCar(m: MeshBuilder, c: AcelaCar, X: (d: number) => number, ends: { front: boolean; rear: boolean }): void {
  const b = carbody(acelaSpec(c));
  const power = isPower(c);
  m.scope("body", () => {
    const leaves = power ? [] : acelaLeaves();
    const cut = leaves.map((o) => ({ ...o, d0: o.d0 - 0.002, d1: o.d1 + 0.002, y0: o.y0 - 0.002, y1: o.y1 + 0.002 }));
    m.scope("shell", () => carbodyShell(m, b, X, acelaPaint, { front: !power, rear: true }, cut));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        if (power) {
          m.scope("cab window", () => sideWindow(m, b, X, s, 4.6, 5.5, 2.95, 3.5));
          m.scope("grilles", () => { for (const [a, e] of [[7.0, 10.5], [11.2, 14.7]] as const) sideGrille(m, b, X, s, a, e, 2.4, 3.4, true); });
          m.scope("lettering", () => sideLettering(m, b, X, s, "AMTRAK", 16.0, 2.45, 0.34, "acDark"));
        } else {
          const mid = ACELA_COACH_BODY / 2;
          m.scope("windows", () => acelaWindows(c).forEach(([a, e], i) => m.scope(`window ${i + 1}`, () => sideWindow(m, b, X, s, a, e, ACELA_WIN[0], ACELA_WIN[1], "acDark", "glass"))));
          m.scope("doors", () => ACELA_DOORS.forEach(([a, e], i) => m.scope(`door ${i + 1}`, () => acelaDoor(m, b, X, s, a, e))));
          m.scope("lettering", () => sideLettering(m, b, X, s, c === "firstClass" ? "FIRST" : c === "cafe" ? "CAFE" : "BUSINESS", mid, 1.7, 0.2, "acDark", 0.012));
        }
      });
    if (!power) {
      const panes = [1, -1].flatMap((s) => acelaWindows(c).map(([a, e]) => ({ s, d0: a + 0.04, d1: e - 0.04, y0: ACELA_WIN[0] + 0.04, y1: ACELA_WIN[1] - 0.04 })));
      sliceCabin(m, b, X, 0, b.length, leaves, panes);
    }
  });
  const L = b.length;
  if (power)
    m.scope("nose", () => {
      m.scope("windscreen", () => {
        for (const s of [1, -1]) {
          crownPane(m, b, X, s, "rubber", [3.25, 4.55], [0.02, 1.2], 0.006);
          crownPane(m, b, X, s, "cabGlass", [3.32, 4.48], [0.06, 1.15], 0.012);
        }
      });
      m.scope("headlights", () => noseLamps(m, b, X, 1, [[-0.6, 1.62, 0.09, "lampHead"], [0.6, 1.62, 0.09, "lampHead"], [0, 2.1, 0.1, "lampHead"]]));
      m.scope("coupler", () => knuckleCoupler(m, 1, X(0) - 0.2, X(0) + 0.4, COUPLER_Y));
    });
  else
    m.scope("front end", () => {
      if (ends.front) endDiaphragm(m, 1, X(0), 1.3, 3.5);
      m.scope("coupler", () => knuckleCoupler(m, 1, X(0) - 0.3, X(0) + ACELA_GAP, COUPLER_Y));
    });
  m.scope("rear end", () => {
    if (ends.rear) endDiaphragm(m, -1, X(L), 1.3, 3.5);
    m.scope("coupler", () => knuckleCoupler(m, -1, -X(L) - 0.3, -X(L) + ACELA_GAP, COUPLER_Y));
  });
  if (power)
    m.scope("roof", () => {
      m.scope("pantograph", () => singleArm(m, { xc: X(15.5), roofY: 4.31, baseY: 4.55, h: 1, raised: true }));
      m.scope("equipment", () => { block(m, "acDark", X(12.5), X(9.0), 4.3, 4.42, -0.7, 0.7); });
    });
  m.scope("running gear", () => {
    const [t1, t2] = acelaTrucks(c);
    const spec = power ? truckSpec([-1.5, 1.5], ft(0, 20), 2.1, 0.85) : truckSpec([-1.5, 1.5], ft(0, 18), 2.0, 0.85);
    m.scope("front truck", () => truck(m, X(t1), spec));
    m.scope("rear truck", () => truck(m, X(t2), spec));
    if (!power) m.scope("underframe", () => block(m, "truckBlack", X(t2 - 2.4), X(t1 + 2.4), 0.55, 0.86, -1.2, 1.2));
  });
}

export interface AcelaSlot { car: AcelaCar; lo: number; hi: number; turned: boolean }

/** The cars of an n-car train, front first: a power car at each end (the rear one turned), first class behind the front one, the cafe in the middle of five or more. */
export function acelaTrain(n: number): AcelaSlot[] {
  const cars: AcelaCar[] = Array.from({ length: n }, (_, k) => (k === 0 || k === n - 1 ? "powerCar" : k === 1 ? "firstClass" : "businessClass"));
  if (n >= 5) cars[Math.floor(n / 2)] = "cafe";
  const total = cars.reduce((t, c) => t + acelaLength(c), 0);
  let hi = total / 2;
  return cars.map((car, i) => {
    const lo = hi - acelaLength(car);
    const out = { car, lo, hi, turned: i === n - 1 };
    hi = lo;
    return out;
  });
}

const ACELA_BELLOWS: Array<[number, number]> = [[-0.8, 1.2], [0.8, 1.2], [0.8, 3.5], [0.65, 3.65], [-0.65, 3.65], [-0.8, 3.5]];

/** The body's +X end behind the car's front coupling plane. */
const acelaFront = (c: AcelaCar) => (isPower(c) ? 0.4 : ACELA_GAP);

export function acela(params?: ParamValues): MeshBuilder {
  const p = resolveParams(ACELA_PARAMS, params);
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...ACELA_PAL });
  const unit = p.unit as AcelaUnit;
  if (unit !== "train") {
    const len = acelaLength(unit);
    drawAcelaCar(m, unit, (d) => len / 2 - acelaFront(unit) - d, { front: true, rear: true });
    return m;
  }
  const slots = acelaTrain(Number(p.cars));
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = acelaLength(slot.car);
    const X = (d: number) => cx + len / 2 - acelaFront(slot.car) - d;
    return {
      x0: slot.lo + ACELA_GAP,
      x1: slot.hi - (k === 0 ? 0 : ACELA_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => (slot.turned ? m.turned(cx, () => drawAcelaCar(m, slot.car, X, { front: false, rear: false })) : drawAcelaCar(m, slot.car, X, { front: false, rear: false }))),
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: ACELA_BELLOWS, folds: 4, depth: 0.03 }, 10, slots.slice(0, -1).map((s) => s.lo));
  return m;
}

// ---------------------------------------------------------------------------
// Distant models

/** A carbody's LOD body: its section, its noses' centre lines and the livery's bands. */
function carbodyLodBody(b: SliceBody, X: (d: number) => number, bands: readonly LodBand[], roof: string, frontNose: boolean, rearNose: boolean, glass: ReadonlyArray<readonly [number, number, number, number]>, section?: number): UnitBody {
  const top = b.C(b.length / 2);
  const mid = b.length / 2;
  const hw: Array<readonly [number, number]> = [[b.B(mid), b.wl(mid)], [b.A(mid), b.wa(mid)], [b.Y(mid), b.w(mid)], [b.S(mid), b.w(mid) * b.lean], [top, 0.45]];
  const tipAt = (rear: boolean): Array<readonly [number, number]> => {
    const ys = [b.B(mid), 1.6, 2.2, 2.8, 3.4, 4.0, top].filter((y, i, a) => i === 0 || y > a[i - 1]!);
    return ys.map((y) => [y, X(rear ? b.length - noseD(b, Math.min(y, top - 0.01), true) : noseD(b, Math.min(y, top - 0.01)))] as const);
  };
  return {
    y0: b.B(mid), hw, side: bands, roof,
    front: frontNose ? { tip: tipAt(false), setback: [[b.B(mid), 1.0], [top, 0.6]] } : { tip: [[b.B(mid), X(0)]] },
    rear: rearNose ? { tip: tipAt(true), setback: [[b.B(mid), 1.0], [top, 0.6]] } : { tip: [[b.B(mid), X(b.length)]] },
    windows: glass.map(([d0, d1, y0, y1]) => ({ u: [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))] as const, y: [y0, y1] as const, mat: LOD_GLASS })),
    ...(section !== undefined ? { section } : {}),
  };
}

const lodBandsOf = (l: CarbodyLivery, y0: number, top: number): LodBand[] => {
  const out: Array<[number, number, string]> = [];
  for (const [a, c, mt] of l.bands) {
    const lo = Math.max(a, y0), hi = Math.min(c, top);
    if (hi > lo + 1e-6) out.push([lo, hi, mt]);
  }
  return out;
};

function locoCarbodyLod(spec: CarbodySpec, l: CarbodyLivery, tip: number, trucks: number[], truckHalf: number, opts: { rearNose?: boolean; pantographs?: number[]; roofY?: number } = {}): MeshBuilder {
  const b = carbody({ ...spec, edges: [] });
  const X = (d: number) => tip - d;
  const top = spec.C;
  const body = carbodyLodBody(b, X, [...lodBandsOf(l, spec.B, spec.S), [spec.S, top, l.roof]], l.roof, true, !!opts.rearNose, []);
  const parts: LodPart[] = [
    ...bogieParts(trucks.map((x) => [x, truckHalf] as const), spec.B),
    ...(opts.pantographs ? pantographParts(opts.pantographs, opts.roofY ?? top, (opts.roofY ?? top) + 0.25) : []),
  ];
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...l.palette }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Parameters, builders and designs

const liveryParam = (l: Record<string, CarbodyLivery>): ParamSpec[] => [{
  name: "livery", title: "Livery", default: Object.keys(l)[0]!,
  values: Object.entries(l).map(([value, v]) => ({ value, title: v.title })),
}];

export const F7_PARAMS = liveryParam(F7_LIVERIES);
export const P42_PARAMS = liveryParam(P42_LIVERIES);
export const ALC_PARAMS = liveryParam(ALC_LIVERIES);
export const GG1_PARAMS = liveryParam(GG1_LIVERIES);

const pick = (params: readonly ParamSpec[], l: Record<string, CarbodyLivery>, v?: ParamValues) => l[resolveParams(params, v).livery!]!;

export function emdF7(params?: ParamValues): MeshBuilder { return buildF7(pick(F7_PARAMS, F7_LIVERIES, params)); }
export function emdF7Lod(params?: ParamValues): MeshBuilder {
  return locoCarbodyLod(F7_SPEC, pick(F7_PARAMS, F7_LIVERIES, params), F7_LENGTH / 2 - F7_REACH, [F7_TRUCK, -F7_TRUCK], 2.0);
}
export function geP42dc(params?: ParamValues): MeshBuilder { return buildP42(pick(P42_PARAMS, P42_LIVERIES, params)); }
export function geP42dcLod(params?: ParamValues): MeshBuilder {
  return locoCarbodyLod(P42_SPEC, pick(P42_PARAMS, P42_LIVERIES, params), P42_LENGTH / 2 - P42_REACH, [P42_TRUCK, -P42_TRUCK], 2.0);
}
export function siemensAlc42(params?: ParamValues): MeshBuilder { return buildAlc42(pick(ALC_PARAMS, ALC_LIVERIES, params)); }
export function siemensAlc42Lod(params?: ParamValues): MeshBuilder {
  return locoCarbodyLod(ALC_SPEC, pick(ALC_PARAMS, ALC_LIVERIES, params), ALC_LENGTH / 2 - ALC_REACH, [ALC_TRUCK, -ALC_TRUCK], 2.15);
}
export function prrGg1(params?: ParamValues): MeshBuilder { return buildGg1(pick(GG1_PARAMS, GG1_LIVERIES, params)); }
export function prrGg1Lod(params?: ParamValues): MeshBuilder {
  const tip = GG1_LENGTH / 2 - GG1_REACH;
  return locoCarbodyLod(GG1_SPEC, pick(GG1_PARAMS, GG1_LIVERIES, params), tip, [7.3, -7.3], 3.3, {
    rearNose: true, pantographs: [tip - (GG1_BODY - GG1_CAB_FROM - 1.6), tip - (GG1_CAB_FROM + 1.6)], roofY: 4.33,
  });
}

const acelaLodCar = (c: AcelaCar, X: (d: number) => number, cx: number, turned: boolean, section?: number): { body: UnitBody; parts: LodPart[] } => {
  const spec = acelaSpec(c);
  const b = carbody({ ...spec, edges: [] });
  const bands: LodBand[] = [...lodBandsOf({ bands: ACELA_BANDS } as CarbodyLivery, spec.B, spec.S), [spec.S, spec.C, "acSilver"]];
  const glass = isPower(c) ? [] : [[2.0, ACELA_COACH_BODY - 2.0, 2.33, 2.97] as const];
  let body = carbodyLodBody(b, X, bands, "acSilver", isPower(c), false, glass, section);
  if (turned) body = turnBody(body, cx);
  const T = (x: number) => (turned ? 2 * cx - x : x);
  const parts: LodPart[] = [
    ...bogieParts(acelaTrucks(c).map((d) => [T(X(d)), 2.0, ...(section !== undefined ? [section] : [])] as const) as unknown as ReadonlyArray<readonly [number, number, number?]>, spec.B),
    ...(isPower(c) ? [{ ...roofPart("pantograph", T(X(15.5)) - 0.8, T(X(15.5)) + 0.8, 0.45, 0.45, spec.C, 5.88, section), optional: 8 }] : []),
  ];
  return { body, parts };
};

export function acelaLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(ACELA_PARAMS, params);
  const palette = { ...CARBODY_PALETTE, ...ACELA_PAL };
  const unit = p.unit as AcelaUnit;
  if (unit !== "train") {
    const len = acelaLength(unit);
    const { body, parts } = acelaLodCar(unit, (d) => len / 2 - acelaFront(unit) - d, 0, false);
    return fitUnit({ palette, bodies: [body], parts }, 100);
  }
  const slots = acelaTrain(Number(p.cars));
  const built = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = acelaLength(slot.car);
    return acelaLodCar(slot.car, (d) => cx + len / 2 - acelaFront(slot.car) - d, cx, slot.turned, k);
  });
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, COUPLER_Y, 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({
      sections: [i, i + 1] as [number, number], front: slot.lo + ACELA_GAP, rear: slots[i + 1]!.hi - ACELA_GAP,
      profile: [[-0.8, 1.2], [0.8, 1.2], [0.8, 3.65], [-0.8, 3.65]] as Array<[number, number]>,
    })),
    maxBendDeg: 10,
  };
  return fitUnit({ palette, bodies: built.map((x) => x.body), parts: built.flatMap((x) => x.parts), sections }, Math.min(500, 100 * slots.length));
}

/** Car weights (published), the power cars' 4.6 MW. */
const ACELA_WEIGHT: Record<AcelaCar, number> = { powerCar: 93, businessClass: 63, firstClass: 64, cafe: 62 };
const ACELA_POWER_KW = 4600;

function acelaGame(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const unit of ["businessClass", "firstClass", "cafe"] as const) variants.push({ params: { unit }, weight: ACELA_WEIGHT[unit], power: 0 });
  for (const n of ACELA_CARS) {
    const weight = acelaTrain(n).reduce((t, s) => t + ACELA_WEIGHT[s.car], 0);
    variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), unit: "train" }, weight, power: 2 * ACELA_POWER_KW });
  }
  return { weight: ACELA_WEIGHT.powerCar, power: ACELA_POWER_KW, maxspeed: 241, accel: null, variants };
}

export const US_CARBODIES: ProceduralDesign[] = [
  { id: "proc-vehicle-emd-f7", title: "EMD F7", build: emdF7, buildLod: emdF7Lod, params: F7_PARAMS, game: { weight: 112, power: 1119, maxspeed: 121, accel: null }, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "emd-f7" },
  { id: "proc-vehicle-ge-p42dc", title: "GE P42DC Genesis", build: geP42dc, buildLod: geP42dcLod, params: P42_PARAMS, game: { weight: 122, power: 3169, maxspeed: 177, accel: null }, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "ge-p42dc" },
  { id: "proc-vehicle-siemens-alc42", title: "Siemens ALC-42 Charger", build: siemensAlc42, buildLod: siemensAlc42Lod, params: ALC_PARAMS, game: { weight: 120, power: 3132, maxspeed: 201, accel: null }, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "siemens-alc42" },
  { id: "proc-vehicle-prr-gg1", title: "PRR GG1", build: prrGg1, buildLod: prrGg1Lod, params: GG1_PARAMS, game: { weight: 215, power: 3445, maxspeed: 161, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, loadingGauge: "us", references: "prr-gg1" },
  { id: "proc-vehicle-amtrak-acela", title: "Acela Express", build: acela, buildLod: acelaLod, params: ACELA_PARAMS, lodTriangles: 500, game: acelaGame(), catalog: EMU_CATALOG, loadingGauge: "us", references: "amtrak-acela" },
];
