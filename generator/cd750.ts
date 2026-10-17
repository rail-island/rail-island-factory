// The CKD T 478.x Bo'Bo' diesel-electric locomotives of CSD / CD: the T 478.3
// "Brejlovec" (CD 753, rebuilt with electric train heating as the 750) and the
// T 478.4 (CD 754) on one body -- this design, `livery` -- and the T 478.1
// "Bardotka" or "Zamracena" (CD 751, rebuilt as the 749) on its own body, its
// own design in cd749.ts. Both are drawn by `buildT478` here, the livery naming
// its body. Reconstructed from the native JT7 XML and BMPs of six vlakosimdb
// models (assets/cd-750/native) and photographs (assets/cd-750/*.jpg).
//
// Source coordinates: x along the body from the end the side BMP draws at its
// left, y up, z across; Factory X = x - centre, so a side BMP column c lies at
// X = c / 10 - centre and a front BMP column u at z = 1.5 - u / 10 (seen from ahead).
// Brejlovec: 16.54 m over the buffers, a 15.3 m body (source 0 .. 15.3);
// Bardotka: 16.50 m, body 0.6 .. 15.9 with its noses to 0.2 and 16.3. Both: 9.0 m
// between the pivots, 2.4 m bogie wheelbase, 1.0 m wheels (assets/cd-750/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { bandAt, emblem, lettering, runningNumber } from "./cd163.ts";
import {
  DIESEL_PALETTE, block, bogie, buffers, coupling, endPanel, endSurface, exhaust, extrude, horn, lerpTable, paint, planBody, plough,
  rect, roofFan, roundRect, side, sideDecal, sideGrille, sideHandrail, sidePlate, sideWindow, tankX,
  type Band, type BogieSpec, type PlanBody, type Wall,
} from "./dieselParts.ts";
import { locoLod, overlay, planBodyLod, screen as lodScreen, sideWindows } from "./lodLocos.ts";

export type Cd750Body = "brejlovec" | "bardotka";

/** A livery of the T 478 family: its paint by height and the body it is painted on. */
export interface Cd750Livery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/diesel. */
  source: string;
  body: Cd750Body;
  number: string;
  numberSource: string;
  palette: Record<string, MaterialSpec>;
  /** The ends (face) and sides by height from the frame's top (1.6 m) to the roof; `cab` the cab sections of the sides. */
  face: readonly Band[];
  side: readonly Band[];
  cab?: readonly Band[];
  roof: string;
  /** The frame (1.1 to 1.6 m) and the buffer beam below it. */
  frame: string;
  plough: string;
  /** Diagonal hazard stripes on the plough. */
  ploughStripes?: string;
  /** The windscreen's surround (the "glasses") and the headlight housing. */
  screen: string;
  housing: string;
  /** The yellow sweep of the 750 liveries: low at the cabs, high along the machine room. */
  sweep?: string;
  /** The CD emblem on the face and the side, and its colour. */
  emblem?: string;
}

const C = (hex: string) => paint(hex);

export const CD750_LIVERIES = {
  cd750: {
    title: "CD 750",
    source: "cd_750",
    body: "brejlovec",
    number: runningNumber("750", "330"),
    numberSource: "illustrative, a unit of the class; the native plate does not resolve digits",
    palette: { green: C("#326350"), greenDark: C("#294a42"), grey: C("#ceced6"), yellow: C("#f2d84a"), frameGrey: C("#5a5a5a") },
    face: [[1.6, 1.9, "yellow"], [1.9, 2.6, "grey"], [2.6, 5, "green"]],
    side: [[1.6, 2.6, "grey"], [2.6, 3.65, "green"], [3.65, 5, "greenDark"]],
    roof: "greenDark",
    frame: "frameGrey",
    plough: "black",
    ploughStripes: "grey",
    screen: "white",
    housing: "white",
    sweep: "yellow",
    emblem: "black",
  },
  cd750No308: {
    title: "CD 750 308",
    source: "cd_750_308",
    body: "brejlovec",
    number: runningNumber("750", "308"),
    numberSource: "the vlakosimdb model's name",
    palette: { red: C("#d62908"), brown: C("#705436"), yellow: C("#ffce5a") },
    face: [[1.6, 1.9, "yellow"], [1.9, 2.6, "red"], [2.6, 3.55, "red"], [3.55, 5, "brown"]],
    side: [[1.6, 3.65, "red"], [3.65, 5, "brown"]],
    roof: "brown",
    frame: "red",
    plough: "red",
    ploughStripes: "black",
    screen: "white",
    housing: "white",
    sweep: "yellow",
    emblem: "white",
  },
  cd753: {
    title: "CD 753",
    source: "cd_753",
    body: "brejlovec",
    number: runningNumber("753", "286"),
    numberSource: "753 286-4, photographed in this livery (photo-753-286-front.jpg)",
    palette: { red: C("#d00000"), cream: C("#ffffd0"), redFrame: C("#c01010") },
    face: [[1.6, 2.0, "red"], [2.0, 2.6, "cream"], [2.6, 5, "red"]],
    side: [[1.6, 2.0, "red"], [2.0, 2.6, "cream"], [2.6, 5, "red"]],
    roof: "red",
    frame: "redFrame",
    plough: "grey",
    screen: "cream",
    housing: "cream",
    emblem: "black",
  },
  cd754: {
    title: "CD 754",
    source: "cd_754",
    body: "brejlovec",
    number: runningNumber("754", "046"),
    numberSource: "754 046-1, photographed in this livery (photo-754-046-three-quarter.jpg)",
    palette: { red: C("#d60000"), redFrame: C("#bd1010"), yellow: C("#f7de42"), slate: C("#4d4d4d") },
    face: [[1.6, 2.0, "red"], [2.0, 2.6, "yellow"], [2.6, 3.55, "yellow"], [3.55, 5, "slate"]],
    side: [[1.6, 2.0, "red"], [2.0, 2.6, "yellow"], [2.6, 3.35, "red"], [3.35, 5, "slate"]],
    roof: "slate",
    frame: "redFrame",
    plough: "redFrame",
    ploughStripes: "black",
    screen: "yellow",
    housing: "yellow",
    emblem: "black",
  },
  cd754No013: {
    title: "CD 754 013",
    source: "cd_754_013",
    body: "brejlovec",
    number: runningNumber("754", "013"),
    numberSource: "the vlakosimdb model's name",
    palette: { blue: C("#466f9b"), navy: C("#003a73"), yellow: C("#f7de42") },
    face: [[1.6, 2.0, "blue"], [2.0, 2.6, "yellow"], [2.6, 5, "blue"]],
    side: [[1.6, 2.0, "blue"], [2.0, 2.6, "yellow"], [2.6, 5, "blue"]],
    roof: "blue",
    frame: "navy",
    plough: "blue",
    ploughStripes: "black",
    screen: "white",
    housing: "white",
    emblem: "black",
  },
} as const satisfies Record<string, Cd750Livery>;

export const CD750_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd750",
  values: Object.entries(CD750_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];

/** The default livery's running number. */
export const CD750_NUMBER = CD750_LIVERIES.cd750.number;

// ---------------------------------------------------------------------------
// The two bodies (XML alongz / alongx / alongy, source metres from the left end)

interface Geometry {
  /** Half the source canvas: Factory x = source x - centre. */
  centre: number;
  /** The source x of the left end's skin at height y (the right end mirrors). */
  endX: (y: number) => number;
  /** The plan's points from the centre line: z and the source x at that z for a height. */
  plan: (y: number) => Array<[number, number]>;
  half: (y: number) => number;
  heights: number[];
  /** The frame's ends (source x) and its plan chamfer. */
  frameEnd: number;
  frameChamfer: [number, number];
  /** The cab sections: source x where the machine room begins. */
  cabX: number;
  /** Buffer heads' faces (Factory |x|). */
  overBuffers: number;
}

/** The T 478.3 / 478.4 "Brejlovec": a square cab with a V windscreen, the roof sloping down to a headlight housing. */
const BREJLOVEC: Geometry = {
  centre: 7.65,
  // XML alongz: the lower body leans out from 0.2 at 1.6 m to the cab face at 2.6 m, the roof rolls down to the face
  endX: (y) => lerpTable([[1.6, 0.2], [2.6, 0.1], [2.62, 0.0], [3.6, 0.0], [3.8, 0.3], [4.1, 1.1], [4.2, 2.1]], y),
  // XML alongy: a chamfered lower body (0.4 by 0.2 corners), a 0.1 m V cab face above 2.6 m
  plan: (y) => (y <= 2.6 + 1e-9 ? [[0, 0], [1.3, 0.087], [1.5, 0.4]] : [[0, 0], [1.3, 0.087], [1.5, 0.1]]),
  // XML alongx: vertical sides to 3.6 m, the roof rounding in to 4.2 m
  half: (y) => lerpTable([[1.6, 1.5], [3.6, 1.5], [3.8, 1.4], [4.0, 1.0], [4.2, 0.2]], y),
  heights: [1.6, 2.6, 2.62, 3.6, 3.8, 4.0, 4.1, 4.2],
  frameEnd: 0,
  frameChamfer: [0.4, 0.2],
  cabX: 1.95,
  overBuffers: 8.27,
};

/** The T 478.1 "Bardotka": the V nose leaning out under the windscreen, the roof's brow overhanging it. */
const BARDOTKA: Geometry = {
  centre: 8.25,
  // XML alongz "front", "cab" and "light": the nose from 0.7 at 1.6 m out to 0.2 at 2.7 m, the
  // sill back to 0.6, the windscreen raked back to 0.8 at 3.7 m, the brow overhanging to 0.6
  endX: (y) => lerpTable([[1.6, 0.7], [2.7, 0.2], [2.9, 0.6], [3.7, 0.8], [3.72, 0.6], [3.9, 0.6], [4.1, 0.9], [4.2, 1.3], [4.3, 2.6]], y),
  plan: (y) => {
    const tip = BARDOTKA.endX(y);
    // the nose's V plan (XML alongy "front") below the windscreen, the cab's above
    const v = (z: number) => (y < 2.9 - 1e-9 ? lerpTable([[0, 0.2], [1.1, 0.3], [1.5, 0.8]], z) : lerpTable([[0, 0.6], [1.4, 0.7], [1.5, 0.8]], z));
    return [0, 1.1, 1.4, 1.5].map((z): [number, number] => [z, Math.max(tip, v(z))]);
  },
  half: (y) => lerpTable([[1.6, 1.5], [3.7, 1.5], [3.9, 1.4], [4.1, 1.0], [4.3, 0.2]], y),
  heights: [1.6, 2.7, 2.9, 3.7, 3.72, 3.9, 4.1, 4.2, 4.3],
  frameEnd: 0.6,
  frameChamfer: [0.3, 0.3],
  cabX: 2.45,
  overBuffers: 8.25,
};

const geometryOf = (l: Cd750Livery): Geometry => (l.body === "bardotka" ? BARDOTKA : BREJLOVEC);

function planBodyOf(g: Geometry, l: Cd750Livery): PlanBody {
  return {
    tip: (y) => g.centre - g.endX(y),
    half: g.half,
    end: (y) => {
      const pts = g.plan(y);
      const x0 = pts[0]![1];
      return pts.map(([z, x]): [number, number] => [x - x0, z === 1.5 ? g.half(y) : Math.min(z, g.half(y) - 0.01)]);
    },
    heights: g.heights,
    face: l.face,
    side: l.side,
    ...(l.cab ? { cab: l.cab, cabX: g.centre - g.cabX } : {}),
    top: l.roof,
  };
}

// ---------------------------------------------------------------------------

/** The CD 750 / 753 / 754 in one of its liveries; the default is a CD 750 in green and grey. */
export function cd750(params?: ParamValues): MeshBuilder {
  const { livery: key } = resolveParams(CD750_PARAMS, params);
  return buildT478(CD750_LIVERIES[key as keyof typeof CD750_LIVERIES]);
}

/** The CD 750 / 753 / 754 for distant views (docs/models/lod.md). */
export function cd750Lod(params?: ParamValues, budget = 100): MeshBuilder {
  const { livery: key } = resolveParams(CD750_PARAMS, params);
  return t478Lod(CD750_LIVERIES[key as keyof typeof CD750_LIVERIES], budget);
}

/**
 * A T 478 for distant views (lodLocos.ts): the plan body with the windscreen's
 * painted surround as an end band and the 750's yellow sweep as side bands
 * (low along the cabs, high along the machine room), the headlight housings,
 * the frame, ploughs, fuel tank and bogies.
 */
export function t478Lod(l: Cd750Livery, budget = 100): MeshBuilder {
  const g = geometryOf(l);
  const brej = g === BREJLOVEC;
  const X = (sx: number) => sx - g.centre;
  const pb = planBodyOf(g, l);
  const [s0, s1] = brej ? [2.6, 3.5] : [2.82, 3.69];
  const sweep = l.sweep;
  const cabWindows = brej ? [[0.3, 0.5, 2.8, 3.3], [0.6, 1.1, 2.8, 3.3], [1.3, 1.7, 2.8, 3.3]] : [[1.05, 1.75, 2.9, 3.55], [1.88, 2.32, 3.0, 3.45]];
  const shell = planBodyLod(pb, {
    end: overlay(pb.face, s0, s1, l.screen),
    ...(sweep ? { side: overlay(pb.side, 2.3, 2.6, sweep), cab: { x: g.centre - 4.6, side: overlay(pb.cab ?? pb.side, 1.6, 1.9, sweep) } } : {}),
    endWindows: brej ? lodScreen(0.1, 1.4, 2.7, 3.4) : lodScreen(0.1, 1.4, 2.9, 3.6),
    sideWindows: sideWindows(cabWindows.map(([a, b, y0, y1]) => ({ u: [X(a!), X(b!)] as const, y: [y0!, y1!] as const })), 0.2, true),
  });
  const beam = g.centre - g.frameEnd;
  const [ta, tb] = brej ? [5.4, 9.9] : [6.9, 10.5];
  // the headlight housing over the windscreen (Brejlovec) or on the brow (Bardotka)
  const housing = (e: number) => {
    const tip = brej ? 7.65 : 8.25 - 0.6;
    const [x0, x1] = brej ? [tip - 1.2, tip + 0.08] : [tip - 0.9, tip + 0.06];
    return { name: "headlight housing", mat: bandAt(l.face, 3.9)[2], x: e > 0 ? [x0, x1] as const : [-x1, -x0] as const, y: brej ? [3.5, 4.1] as const : [3.75, 4.3] as const, w: brej ? [0.5, 0.3] as const : [0.4, 0.25] as const, optional: 20 };
  };
  return locoLod({
    palette: { ...DIESEL_PALETTE, ...l.palette, grey: C("#9da2a4"), cream: C("#efe7bf"), ...l.palette },
    shells: [shell],
    boxes: [
      { name: "frame", mat: l.frame, x: [-beam, beam], y: [1.1, 1.6], w: 1.5 },
      ...[-1, 1].map((e) => ({ name: "plough", mat: l.plough, x: e > 0 ? [beam - 0.6, beam] as const : [-beam, -beam + 0.6] as const, y: [0.15, 1.1] as const, w: 1.4, top: false as const, optional: 30 })),
      { name: "fuel tank", mat: "tank", x: [X(ta), X(tb)], y: [0.2, 1.1], w: 1.25, top: false, optional: 35 },
      housing(1), housing(-1),
    ],
    gear: [-1, 1].map((e) => ({ xc: e * 4.5, half: 1.2 + 0.5 + 0.2, top: 1.1 })),
  }, budget);
}

/** A T 478 in livery `l`, on the body the livery names (the CD 749's design uses it too). */
export function buildT478(l: Cd750Livery): MeshBuilder {
  const g = geometryOf(l);
  const m = new MeshBuilder({ ...DIESEL_PALETTE, ...l.palette, grey: C("#9da2a4"), cream: C("#efe7bf"), ...l.palette });
  const X = (sx: number) => sx - g.centre;
  const pb = planBodyOf(g, l);
  const wall: Wall = { half: g.half, breaks: [3.6, 3.7] };
  m.scope("body", () => {
    m.scope("shell", () => planBody(m, pb));
    m.scope("frame", () => frame(m, g, l));
    m.scope("roof", () => roof(m, g, l));
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => {
      m.scope("face", () => (l.body === "bardotka" ? bardotkaFace(m, pb, e, l) : brejlovecFace(m, pb, e, l)));
      m.scope("lower end", () => lowerEnd(m, g, e, l));
    });
  m.scope("sides", () => sides(m, g, wall, l, X));
  const spec: BogieSpec = {
    axles: [-1.2, 1.2], wheelR: 0.5, frameHalf: 1.8, frameTop: 0.98, frameBottom: 0.62, frameZ: [0.92, 1.06],
    primary: "coil", secondary: [-0.35, 0.35], secondaryZ: 1.18, bolster: 1.1,
  };
  m.scope("bogies", () => {
    m.scope("rear bogie", () => bogie(m, -4.5, spec));
    m.scope("front bogie", () => bogie(m, 4.5, spec));
  });
  m.scope("underframe", () => underframe(m, g, l, X));
  return m;
}

function frame(m: MeshBuilder, g: Geometry, l: Cd750Livery): void {
  const t = g.centre - g.frameEnd;
  const [cx, cz] = g.frameChamfer;
  const r: Ring = [[t, -(1.5 - cz)], [t - cx, -1.5], [-(t - cx), -1.5], [-t, -(1.5 - cz)], [-t, 1.5 - cz], [-(t - cx), 1.5], [t - cx, 1.5], [t, 1.5 - cz]];
  m.prism(l.frame, r, 1.1, 1.6, false);
  m.cap("underframe", r, 1.1, false);
  // the frame's top ledge where the body stands back from it
  m.cap(l.frame, r, 1.6, true);
}

function roof(m: MeshBuilder, g: Geometry, l: Cd750Livery): void {
  const X = (sx: number) => sx - g.centre;
  if (g === BREJLOVEC) {
    // the raised hatch over the engine (XML roof clip, source x 5.0 .. 10.6)
    const q: Ring = [[-0.8, 4.17], [0.8, 4.17], [0.3, 4.3], [-0.3, 4.3]];
    m.scope("hatch", () => m.sweep(l.roof, "x", q, X(5.0), q, X(10.6)));
    // the cooler fans (native roof BMP: two pairs at source x 10.8 .. 12.8)
    m.scope("fans", () => {
      for (const x of [11.25, 12.35]) for (const z of [-0.45, 0.45]) roofFan(m, X(x), z, 4.17, 0.4);
    });
    exhaust(m, X(3.5), 0, 4.15, 4.32, 0.36, 0.5);
    horn(m, 1, X(13.6), 0.3, 4.32);
    horn(m, -1, X(1.7), -0.3, 4.32);
  } else {
    // the raised radiator roof (XML "tank" clip, source x 6.9 .. 11.1) and the exhaust (5.4 .. 5.6, to 4.6 m)
    const q: Ring = [[-0.5, 4.25], [0.5, 4.25], [0.4, 4.4], [-0.4, 4.4]];
    m.scope("hatch", () => m.sweep(l.roof, "x", q, X(6.9), q, X(11.1)));
    m.scope("fans", () => {
      for (const x of [12.2, 13.3]) for (const z of [-0.45, 0.45]) roofFan(m, X(x), z, 4.27, 0.38);
    });
    exhaust(m, X(5.5), 0, 4.25, 4.6, 0.22, 0.4);
    horn(m, 1, X(14.4), 0.3, 4.38);
    horn(m, -1, X(2.1), -0.3, 4.38);
  }
}

// ---------------------------------------------------------------------------
// The faces (native x_both rows: y = 5 - row / 10; columns: u = column / 10)

function screen(m: MeshBuilder, pb: PlanBody, e: number, l: Cd750Livery, y0: number, y1: number, frameY: [number, number]): void {
  m.scope("windscreen", () => {
    m.scope("surround", () => endPanel(m, pb, l.screen, e, roundRect(-1.5, 1.5, frameY[0], frameY[1], 0.08), -0.02, 0.02));
    for (const [name, a, b] of [["left pane", -1.4, -0.1], ["right pane", 0.1, 1.4]] as const)
      m.scope(name, () => {
        m.scope("rubber", () => endPanel(m, pb, "rubber", e, roundRect(a, b, y0, y1, 0.06), -0.01, 0.028));
        m.scope("glass", () => endPanel(m, pb, "glass", e, roundRect(a + 0.03, b - 0.03, y0 + 0.03, y1 - 0.03, 0.05), -0.005, 0.034));
      });
  });
}

function brejlovecFace(m: MeshBuilder, pb: PlanBody, e: number, l: Cd750Livery): void {
  // rows 15..23: the surround 2.6 .. 3.5 m; glass rows 16..22, 2.7 .. 3.4 m
  screen(m, pb, e, l, 2.7, 3.4, [2.6, 3.5]);
  // the headlight housing over the windscreen (XML "light" clip; rows 9..14, columns 11..19)
  m.scope("headlight", () => {
    const tip = 7.65;
    const sec: Ring = [[-0.5, 3.5], [0.5, 3.5], [0.4, 3.9], [0.1, 4.1], [-0.1, 4.1], [-0.4, 3.9]];
    m.scope("housing", () => m.sweep(bandAt(l.face, 3.9)[2], "x", sec, e * (tip - 1.2), sec, e * (tip + 0.08)));
    const lens = ngon(14, 0.24, 0, 0, 3.78);
    m.scope("lens", () => m.sweep("lampHead", "x", lens, e * (tip + 0.08), lens, e * (tip + 0.1)));
    // the housing's painted face round the lens: 0.9 m wide, 3.5 .. 4.1 m
    const rim = sec.map(([z, y]): [number, number] => [z * 0.9, Math.max(y, 3.505)]);
    m.scope("rim", () => m.sweep(l.housing, "x", rim, e * (tip + 0.075), rim, e * (tip + 0.09)));
  });
  faceCommon(m, pb, e, l, 2.1);
}

function bardotkaFace(m: MeshBuilder, pb: PlanBody, e: number, l: Cd750Livery): void {
  // rows 13..21: the surround 2.8 .. 3.7 m; glass rows 14..20, 2.9 .. 3.6 m
  screen(m, pb, e, l, 2.9, 3.6, [2.82, 3.69]);
  m.scope("headlight", () => {
    // the housing on the brow (XML "light": +-0.4, 3.7 .. 4.2 m, to the face at source 0.6)
    const tip = 8.25 - 0.6;
    const sec: Ring = [[-0.4, 3.75], [0.4, 3.75], [0.4, 4.15], [0.25, 4.3], [-0.25, 4.3], [-0.4, 4.15]];
    m.scope("housing", () => m.sweep(bandAt(l.face, 3.9)[2], "x", sec, e * (tip - 0.9), sec, e * (tip + 0.06)));
    const lens = ngon(14, 0.2, 0, 0, 4.02);
    m.scope("lens", () => m.sweep("lampHead", "x", lens, e * (tip + 0.06), lens, e * (tip + 0.08)));
    const rim = ngon(14, 0.3, 0, 0, 4.02);
    m.scope("rim", () => m.sweep(l.housing, "x", rim, e * (tip + 0.05), rim, e * (tip + 0.07)));
  });
  faceCommon(m, pb, e, l, 2.1);
}

/** The CD emblem h tall, its lower edge at v0, centred on u = 0. */
function centredEmblem(v0: number, h: number, flipU: boolean): Array<[number, number]> {
  const tris = emblem(0, v0, h, flipU);
  const us = tris.map(([u]) => u);
  const mid = (Math.min(...us) + Math.max(...us)) / 2;
  return tris.map(([u, v]) => [u - mid, v]);
}

/** The emblem, lamps and number plate common to both faces. */
function faceCommon(m: MeshBuilder, pb: PlanBody, e: number, l: Cd750Livery, emblemY: number): void {
  if (l.emblem)
    m.scope("emblem", () => {
      // x_both columns 12..17, rows 25..28: 0.6 by 0.4 m, centred
      const tris = centredEmblem(emblemY, 0.4, false);
      const pts = tris.map(([u, v]): Vec3 => {
        const z = -e * u;
        const s = endSurface(pb, z, v);
        return [e * (s.x + 0.006 * s.n[0]), v + 0.006 * s.n[1], z + 0.006 * s.n[2]];
      });
      m.facets(l.emblem!, pts, [e, 0, 0]);
    });
  // the lower face, frame 1.1 .. 1.6 m: white lamps at u 0.6 .. 0.8, red ones at 0.3 .. 0.5 (rows 35..36)
  m.scope("lamps", () => {
    for (const [u, mat, r] of [[0.7, "lampHead", 0.1], [2.3, "lampHead", 0.1], [0.4, "lampRed", 0.075], [2.6, "lampRed", 0.075]] as const)
      m.scope(mat === "lampRed" ? "tail lamp" : "head lamp", () => frameLamp(m, e, beamOf(l), u, 1.4, r, mat));
  });
  m.scope("number plate", () => {
    const xb = beamOf(l) + 0.02;
    block(m, "plate", ...along(e, xb - 0.03, xb + 0.01), 1.3, 1.5, -0.4, 0.4);
    const pts = numberTris(l.number, 1.33, 0.13, 0.055, 0.016).map(([u, v]): Vec3 => [e * (xb + 0.012), v, -e * u]);
    m.facets("white", pts, [e, 0, 0]);
  });
}

/** Lettering centred on u = 0 (u to the viewer's right), baseline y. */
function numberTris(text: string, y: number, h: number, w: number, gap: number): Array<[number, number]> {
  const n = text.length * w + (text.length - 1) * gap;
  return lettering(text, -n / 2, y, h, w, gap, false);
}

const along = (e: number, a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);

/** A round lamp set into the buffer beam's face at x = beam, at u (front BMP column / 10), height y. */
function frameLamp(m: MeshBuilder, e: number, beam: number, u: number, y: number, r: number, lens: string): void {
  const z = -e * (u - 1.5);
  const rim = ngon(10, r + 0.03, 0, z, y), glass = ngon(10, r, 0, z, y);
  m.scope("rim", () => extrude(m, "black", "x", rim, along(e, beam - 0.01, beam + 0.04)));
  m.scope("lens", () => extrude(m, lens, "x", glass, along(e, beam + 0.04, beam + 0.06)));
}
const beamOf = (l: Cd750Livery): number => (l.body === "bardotka" ? BARDOTKA.centre - BARDOTKA.frameEnd : BREJLOVEC.centre - BREJLOVEC.frameEnd);

function lowerEnd(m: MeshBuilder, g: Geometry, e: number, l: Cd750Livery): void {
  const beam = g.centre - g.frameEnd; // the buffer beam's face
  // the buffer beam's lower part, 0.8 .. 1.1 m (XML base clip), and the plough under it (0.1 .. 0.8 m)
  m.scope("buffer beam", () => block(m, l.frame, ...along(e, beam - 0.9, beam), 0.8, 1.1, -1.45, 1.45));
  buffers(m, e, beam, g.overBuffers, 1.03, "round");
  coupling(m, e, beam, 1.03);
  plough(m, e, l.plough, beam - 0.05, 0.6, 0.15, 0.8, 1.3, 1.45);
  if (l.ploughStripes)
    m.scope("plough stripes", () => {
      const qs: Vec3[] = [];
      const x = e * (beam - 0.05 + 0.006);
      for (let i = -4; i <= 4; i++) {
        const z = i * 0.3;
        const quad: Vec3[] = [[x, 0.2, z - 0.06], [x, 0.2, z + 0.06], [x, 0.75, z + 0.06 + 0.12 * Math.sign(z || 1)], [x, 0.75, z - 0.06 + 0.12 * Math.sign(z || 1)]];
        // the plough leans back 0.15 m toward its foot
        const lean = (p: Vec3): Vec3 => [p[0] - e * 0.15 * ((0.8 - p[1]) / 0.65), p[1], p[2]];
        const [a, b, cc, d] = quad.map(lean) as [Vec3, Vec3, Vec3, Vec3];
        qs.push(a, b, cc, a, cc, d);
      }
      m.facets(l.ploughStripes!, qs, [e, 0.2, 0]);
    });
}

// ---------------------------------------------------------------------------
// The sides (native z_both: column c is source x = c / 10, row r is y = 5 - r / 10)

function sides(m: MeshBuilder, g: Geometry, w: Wall, l: Cd750Livery, X: (sx: number) => number): void {
  const brej = g === BREJLOVEC;
  for (const s of [1, -1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      // cab windows: Brejlovec columns 3..4, 6..10, 13..16, rows 17..21; Bardotka 11..16 and the door's 19..22, rows 15..20
      const cabWindows: Array<[number, number, number, number]> = brej
        ? [[0.3, 0.5, 2.8, 3.3], [0.6, 1.1, 2.8, 3.3], [1.3, 1.7, 2.8, 3.3]]
        : [[1.05, 1.75, 2.9, 3.55], [1.88, 2.32, 3.0, 3.45]];
      for (const [end, mirror] of [["left cab", false], ["right cab", true]] as const)
        m.scope(end, () => {
          const sx = (x: number) => X(mirror ? 2 * g.centre - x : x);
          const span = (a: number, b: number): [number, number] => [Math.min(sx(a), sx(b)), Math.max(sx(a), sx(b))];
          cabWindows.forEach(([a, b, y0, y1], i) =>
            m.scope(`window ${i + 1}`, () => sideWindow(m, w, s, ...span(a, b), y0, y1, "rubber", 0.04)),
          );
          // the door: Brejlovec 1.25 .. 1.85, Bardotka 1.8 .. 2.4 (the native door lines)
          const [d0, d1] = brej ? span(1.22, 1.82) : span(1.8, 2.4);
          m.scope("door", () => sideDecal(m, w, "rubber", s, [rect(d0, 1.7, d1, 1.72), rect(d0, brej ? 3.42 : 3.55, d1, brej ? 3.44 : 3.57), rect(d0, 1.72, d0 + 0.02, brej ? 3.42 : 3.55), rect(d1 - 0.02, 1.72, d1, brej ? 3.42 : 3.55)], 0.004));
          m.scope("handrails", () => {
            for (const x of [d0 - 0.08, d1 + 0.08]) sideHandrail(m, w, s, x, 1.75, 3.2);
          });
          m.scope("steps", () => {
            for (const y of [0.55, 0.85]) block(m, "steel", d0 + 0.02, d1 - 0.02, y, y + 0.04, ...side(s, 1.28, 1.48));
            for (const x of [d0 + 0.02, d1 - 0.05]) block(m, "steel", x, x + 0.03, 0.55, 1.1, ...side(s, 1.44, 1.48));
          });
        });
      // the machine room's small windows: Brejlovec columns 25, 39, 53, 68, 82, 96 (4 px, rows 19..22); Bardotka 47, 63, 80, 96 (rows 19..22)
      m.scope("windows", () => {
        const xs = brej ? [2.5, 3.9, 5.3, 6.8, 8.2, 9.6] : [4.7, 6.3, 8.0, 9.6];
        xs.forEach((x, i) => m.scope(`window ${i + 1}`, () => sideWindow(m, w, s, X(x), X(x + (brej ? 0.4 : 0.55)), 2.7, 3.1, "rubber", 0.03)));
      });
      // the radiator shutters: Brejlovec columns 107..129, rows 18..23 (two panels); Bardotka 113..136, rows 19..31
      m.scope("radiator", () => {
        const [a, b, y0, y1] = brej ? [10.7, 12.9, 2.6, 3.2] : [11.3, 13.6, 1.8, 3.1];
        const mid = (a + b) / 2;
        m.scope("left panel", () => sideGrille(m, w, s, X(a), X(mid), y0, y1, "grille", brej ? 6 : 11));
        m.scope("right panel", () => sideGrille(m, w, s, X(mid), X(b), y0, y1, "grille", brej ? 6 : 11));
      });
      // the louvres along the cant (Brejlovec rows 11..14, columns 9..47 and 108..147; Bardotka rows 9..12, columns 57..109)
      m.scope("cant louvres", () => {
        const runs: Array<[number, number]> = brej ? [[0.9, 4.7], [10.8, 14.4]] : [[5.7, 10.9]];
        const [y0, y1] = brej ? [3.62, 3.75] : [3.72, 3.85];
        for (const [a, b] of runs) {
          const qs: Ring[] = [];
          for (let x = a; x < b - 0.05; x += 0.25) qs.push(rect(X(x), y0, X(Math.min(b, x + 0.18)), y1));
          sideDecal(m, cantWall(g), "louvre", s, qs, 0.006);
        }
      });
      if (l.sweep)
        m.scope("sweep", () => {
          // the 750 liveries' yellow: 1.6 .. 1.9 m at the cabs, rising on a diagonal to 2.3 .. 2.6 m between source x 4.6 and 12.8
          const qs: Ring[] = [
            rect(X(0.0), 1.6, X(3.6), 1.9),
            [[X(3.6), 1.6], [X(4.6), 2.3], [X(4.6), 2.6], [X(3.6), 1.9]] as Ring,
            rect(X(4.6), 2.3, X(12.8), 2.6),
            [[X(12.8), 2.3], [X(11.8), 1.6], [X(11.8), 1.9], [X(12.8), 2.6]] as Ring,
            rect(X(11.7), 1.6, X(15.3), 1.9),
          ];
          sideDecal(m, w, l.sweep!, s, qs.map(ccw), 0.003);
        });
      if (l.emblem)
        m.scope("emblem", () => {
          // z_both: Brejlovec columns 33..37, Bardotka 39..44, rows 26..29 (2.0 .. 2.4 m); read from outside on both sides
          const xc = X(brej ? 3.55 : 4.15);
          const tris = centredEmblem(2.04, 0.36, s < 0);
          m.facets(l.emblem!, tris.map(([u, y]): Vec3 => [xc + u, y, s * (g.half(y) + 0.004)]), [0, 0, s]);
        });
      // z_both: the plate at columns 74..81 (Brejlovec) / 80..87 (Bardotka), rows 27..29 (2.0 .. 2.3 m)
      m.scope("number plate", () => sidePlate(m, w, s, l.number, X(brej ? 7.8 : 8.4), 2.07));
    });
}

/** The roof's cant: the side wall rolled in above 3.6 m (for decals laid on it). */
const cantWall = (g: Geometry): Wall => ({ half: g.half, breaks: g === BREJLOVEC ? [3.6, 3.8] : [3.7, 3.9] });

/** The ring counter-clockwise in (x, y). */
function ccw(q: Ring): Ring {
  let a = 0;
  for (let i = 0; i < q.length; i++) {
    const [x0, y0] = q[i]!;
    const [x1, y1] = q[(i + 1) % q.length]!;
    a += x0 * y1 - x1 * y0;
  }
  return a < 0 ? [...q].reverse() : q;
}

function underframe(m: MeshBuilder, g: Geometry, l: Cd750Livery, X: (sx: number) => number): void {
  // the fuel tank between the bogies (Brejlovec XML base clip 5.4 .. 9.9, 0.2 .. 1.1 m; Bardotka "tank" 7.2 .. 10.5)
  const [a, b] = g === BREJLOVEC ? [5.4, 9.9] : [6.3 + 0.6, 10.5];
  m.scope("fuel tank", () => {
    const sec: Ring = [[-1.25, 0.4], [-1.1, 0.2], [1.1, 0.2], [1.25, 0.4], [1.25, 1.1], [-1.25, 1.1]];
    m.sweep("tank", "x", sec, X(a), sec, X(b));
    // filler and gauge on each side
    for (const s of [-1, 1]) block(m, "steel", X((a + b) / 2) - 0.15, X((a + b) / 2) + 0.15, 0.7, 0.9, ...side(s, 1.25, 1.29));
  });
  m.scope("air reservoirs", () => {
    for (const s of [-1, 1]) tankX(m, "spring", X(b + 0.05), X(b + 0.6), s * 0.75, 0.75, 0.22);
  });
  m.scope("battery boxes", () => {
    for (const s of [-1, 1]) block(m, l.frame, X(a - 0.55), X(a - 0.05), 0.55, 1.08, ...side(s, 0.6, 1.3));
  });
}
