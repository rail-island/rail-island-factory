// The Eurostar e300 (Class 373, the TGV TMST) on the series kit (shinkansen.ts) with its own cab
// face (seriesCab.ts): the power car's long TGV nose - the white bumper over the dark plough, the
// lamps in the band across the front, the bonnet rising to the dark canopy round the wrap-round
// windscreen - its locomotive sides, and the low articulated trailers on Jacobs bogies, the first
// and last on a motor bogie of their own beside the power car. Matched to the photographs in
// assets/eurostar-373/ (SOURCES.md). See docs/models/uk-trains.md.
//
// Heights over the rail; d behind the nose's tip (the bumper's front, 1.1 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries, SeriesSidePanel } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { crownPane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { block } from "./vehicleParts.ts";
import { insulator, singleArm } from "./czElectricKit.ts";

/** Where the face meets the power car's body: the canopy's rear edge reaches the shoulder there. */
const JOIN = 4.5;

/**
 * The nose's centre line: the white bumper bulging forward at 1.1 m over the plough, its seam at
 * 1.25 m, the lamp band, the long bonnet rising to the canopy's foot (the windscreen's visor) at
 * 2.27 m, 2.9 m back, the windscreen raked back to 3.2 m, 4.55 m back, and the canopy's roof
 * rounding into the 3.95 m crown at the join.
 */
const PROFILE: Pt[] = [
  [0.8, 0.32], [0.9, 0.14], [1.0, 0.04], [1.1, 0], [1.2, 0.03], [1.27, 0.09], [1.32, 0.13], [1.42, 0.2], [1.52, 0.3], [1.62, 0.44],
  [1.76, 0.72], [1.9, 1.05], [2.05, 1.45], [2.18, 1.85], [2.27, 2.18], [2.36, 2.3], [2.6, 2.58], [2.9, 2.92], [3.2, 3.28],
  [3.42, 3.6], [3.6, 3.88], [3.75, 4.1], [3.86, 4.28], [3.95, JOIN],
];

/** The yellow band's lower edge on the sides, [y, d]: from under the lamps at the nose's corners up to the cantrail, where it runs on as a line. */
const YELLOW_FOOT: Pt[] = [[1.27, 0.55], [1.6, 1.2], [2.0, 2.0], [2.4, 2.75], [2.8, 3.5], [3.1, 4.25], [3.3, 5.1]];
/** The canopy's lower edge on the sides: from the windscreen's visor up to the shoulder at the join. */
const CANOPY_FOOT: Pt[] = [[2.27, 2.3], [2.6, 2.7], [2.95, 3.15], [3.2, 3.6], [3.33, 4.05], [3.39, JOIN], [3.4, 9]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.31, 1.5, 3.1, 3.3, 3.38, 1.58, 1.3])].sort((a, b) => a - b);

/** The bumper's outline: a thin dark seam over its top, dropping round the corners, and the coupler cover's centre seam. */
const seamLine = (pts: Pt[], t: number): Array<{ mat: string; pts: Pt[] }> =>
  pts.slice(1).map((b, i) => {
    const a = pts[i]!;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], k = Math.hypot(dx, dy);
    const [nx, ny] = [(-dy / k) * t, (dx / k) * t];
    return { mat: "seam", pts: [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]] as Pt[] };
  });
const BUMPER_TOP: Pt[] = [[-1.18, 0.86], [-1.12, 1.04], [-1.0, 1.16], [-0.8, 1.23], [-0.4, 1.255], [0, 1.26], [0.4, 1.255], [0.8, 1.23], [1.0, 1.16], [1.12, 1.04], [1.18, 0.86]];

export const E300_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 3.2, reach: 0.07, first: 4.6, roofFrom: 9, cols: [2, 6, 1, 1], tolerance: 0.05, wrap: true,
  profile: PROFILE,
  // a nose round in plan: the corner the whole half width, its depth growing from the blunt bumper to the long bonnet and the canopy
  corner: [[0.8, 2.0], [3.95, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => {
    const want = y < 1.27 ? 1.0 + (y - 0.8) * 0.3 : y < 2.27 ? 1.14 + (y - 1.27) * 0.8 : 1.94 - (y - 2.27) * 0.4;
    return [y, Math.max(0.05, Math.min(JOIN - d, want))];
  }),
  rows: ROWS,
  bands: () => [[0, 9, "faceBase"]],
  lodBands: [[0, 1.27, "faceBase"], [1.27, 2.27, "noseYellow"], [2.27, 9, "canopy"]],
  lodGlass: { hw: 0.8, y: [2.36, 3.2] },
  paint: [
    // the yellow band across the lamps, over the bonnet and up the canopy's sides to the cantrail
    { mat: "noseYellow", front: [[1.27, -9], [3.45, -9]], back: YELLOW_FOOT, top: 3.45 },
    // the dark canopy round the windscreen, over the cab roof back to the join
    { mat: "canopy", front: [[2.27, -9], [9, -9]], back: CANOPY_FOOT },
  ],
  fields: [
    // the lamp housings either side, their outer ends slanting back, and the perforated grille between them
    { mat: "lampBand", pts: [[0.23, 1.31], [0.9, 1.31], [0.98, 1.4], [0.96, 1.51], [0.23, 1.51]] },
    { mat: "lampBand", pts: [[-0.23, 1.51], [-0.96, 1.51], [-0.98, 1.4], [-0.9, 1.31], [-0.23, 1.31]] },
    { mat: "noseGrille", pts: [[-0.2, 1.32], [0.2, 1.32], [0.2, 1.5], [-0.2, 1.5]] },
  ],
  // the windscreen, wrapping round under the canopy
  panes: [{ lat: [-0.8, 0.8], y: [2.36, 3.2], r: 0.16 }],
  // the grille's holes as rows of dark slots
  decals: [
    ...[1.355, 1.395, 1.435, 1.475].map((y) => ({ mat: "seam", pts: [[-0.17, y - 0.008], [0.17, y - 0.008], [0.17, y + 0.008], [-0.17, y + 0.008]] as Pt[], fine: 2 })),
    // the bumper's seam over its top and round the corners, and the coupler cover's centre seam
    ...seamLine(BUMPER_TOP, 0.012).map((f) => ({ ...f, fine: 2 })),
    { mat: "seam", pts: [[-0.012, 0.84], [0.012, 0.84], [0.012, 1.25], [-0.012, 1.25]], fine: 3 },
  ],
  lamps: [[0.74, 1.41, 0.075, "lampHead"], [0.45, 1.41, 0.06, "lampRed"], [-0.74, 1.41, 0.075, "lampHead"], [-0.45, 1.41, 0.06, "lampRed"]],
  roofLamp: [0, 3.82, 0.13],
  wipers: [[[0.32, 2.42], [0.62, 3.05]], [[-0.36, 2.42], [-0.08, 3.08]]],
  lod: {
    profile: PROFILE, corner: [[0.8, 2.0], [3.95, 2.0]], rows: [0.8, 1.1, 1.27, 1.62, 2.05, 2.27, 2.9, 3.42, 3.75, 3.95],
    cornerDepth: [[0.8, 1.0], [1.27, 1.14], [2.27, 1.94], [2.9, 1.5], [3.42, 0.85], [3.75, 0.35], [3.95, 0.05]],
  },
};

/** The cab door behind the canopy and the hatch ahead of it, outlined on the nose's sides (d behind the tip). */
const outline = (d0: number, d1: number, y0: number, y1: number): NonNullable<ShinkansenLivery["endSweeps"]> => {
  const t = 0.02;
  return [
    { mat: "seam", front: [[y0, d0], [y1, d0]], back: [[y0, d0 + t], [y1, d0 + t]] },
    { mat: "seam", front: [[y0, d1 - t], [y1, d1 - t]], back: [[y0, d1], [y1, d1]] },
    { mat: "seam", front: [[y1 - t, d0], [y1, d0]], back: [[y1 - t, d1], [y1, d1]] },
  ];
};
const CAB_SIDE: NonNullable<ShinkansenLivery["endSweeps"]> = [
  ...outline(2.6, 3.15, 1.55, 2.3), ...outline(3.35, 4.0, 1.38, 2.7),
  // the porthole behind the cab door, high under the yellow band
  { mat: "lampGlass", front: [[2.42, 4.26], [2.5, 4.18], [2.85, 4.18], [2.93, 4.26]], back: [[2.42, 4.34], [2.5, 4.42], [2.85, 4.42], [2.93, 4.34]] },
];

/** The power car's machine-room grille: three ribbed panels between lighter frames (d behind the tip). */
const GRILLE: SeriesSidePanel[] = [[7.0, 11.5], [11.6, 16.0], [16.1, 20.5]].flatMap(([a, b]): SeriesSidePanel[] => [
  { d: [a!, b!], y: [1.72, 3.24], kind: "panel", mat: "grilleFrame", screen: "grille" },
]);

interface E300Paint {
  base: string; skirt: string; roof: string; canopy: string; yellow: string; grille: string; noseGrille: string;
  /** The lamp housings' band across the nose (the blue scheme has none: the nose's own grey). */
  lampBand: string;
  /** The power car's and the trailers' side bands, bottom first. */
  power: Array<[number, number, string]>;
  trailer: Array<[number, number, string]>;
}

function e300Livery(title: string, number: string, p: E300Paint, extra: Record<string, string>, sweeps: NonNullable<ShinkansenLivery["endSweeps"]>, lettering: NonNullable<ShinkansenLivery["endLettering"]>): ShinkansenLivery {
  return {
    title, number,
    palette: {
      faceBase: c(p.base, 0.35), skirtE: c(p.skirt, 0.7), roofE: c(p.roof, 0.55), canopy: c(p.canopy, 0.25), noseYellow: c(p.yellow, 0.35),
      visor: c("#15181d", 0.3), lampGlass: c("#24262b", 0.15), grille: c(p.grille, 0.6), noseGrille: c(p.noseGrille, 0.5), lampBand: c(p.lampBand, p.lampBand === p.base ? 0.35 : 0.15), grilleFrame: c("#a9adb2", 0.5), grilleRib: c("#585c62", 0.6),
      seam: c("#3a3d42", 0.6), cabMask: c("#15181d", 0.3), lettering: c("#2a2c30", 0.5),
      ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, c(v, 0.4)])),
    },
    bands: p.trailer, endBands: p.power, roof: "roofE", skirt: "skirtE",
    endSweeps: [
      // the yellow band runs on behind the face, narrowing into the cantrail line
      { mat: "noseYellow", front: [[1.27, -9], [3.45, -9]], back: YELLOW_FOOT },
      ...sweeps, ...CAB_SIDE,
    ],
    endLettering: lettering,
  };
}

const ORIGINAL: E300Paint = {
  base: "#efefea", skirt: "#2b2f3a", roof: "#8e9399", canopy: "#262c3d", yellow: "#f5bf0f", grille: "#6d7176", noseGrille: "#d39b0b", lampBand: "#24262b",
  power: [[0, 1.3, "skirtE"], [1.3, 1.6, "noseYellow"], [1.6, 3.3, "faceBase"], [3.3, 9, "noseYellow"]],
  trailer: [[0, 1.3, "skirtE"], [1.3, 1.6, "noseYellow"], [1.6, 2.87, "faceBase"], [2.87, 9, "noseYellow"]],
};

/** The refurbished sets' scheme of the 2011 brand: Eurostar blue over light grey, the yellow line between them, the grey nose under the yellow band. */
const BLUE: E300Paint = {
  base: "#c3c7cc", skirt: "#b3b8bd", roof: "#3c4452", canopy: "#1b2452", yellow: "#f2cf1d", grille: "#1f2c72", noseGrille: "#9ea3a8", lampBand: "#c3c7cc",
  power: [[0, 1.3, "skirtE"], [1.3, 1.52, "faceBase"], [1.52, 1.62, "noseYellow"], [1.62, 9, "blue"]],
  trailer: [[0, 1.3, "skirtE"], [1.3, 1.52, "faceBase"], [1.52, 1.62, "noseYellow"], [1.62, 9, "blue"]],
};

export const E300: ShinkansenSeries = {
  endLength: 22.15, midLength: 18.7, W: 1.39, Y: 1.3, S: 3.38, C: 3.95, lean: 0.95, B: 0.8, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: E300_FACE,
  // the trailers, lower than the power cars
  trailerSection: { S: 2.95, C: 3.45 },
  windows: [[2.05, 2.75]], windowW: 1.25, pitch: 1.72, door: [1.25, 2.85, 2.2, 2.6], doorW: 0.8, doorGlassW: 0.36,
  layout: {
    end: { doors: [[0.1, 0.75, 1]], windows: [] },
    // a trailer: its door at the front end over the joint, nine windows along the saloon
    middle: { doors: [[0.5, 1.3, 1]], windows: Array.from({ length: 9 }, (_, i): readonly [number, number] => [2.35 + i * 1.72, 2.35 + i * 1.72 + 1.25]) },
  },
  bogieCentres: 14.0, wheelR: 0.46, wheelbase: 3.0, cars: [4, 6, 8],
  // the power cars are locomotives: bogies 14 m apart under the middle, the porthole and the machine-room
  // door behind the cab, the long grille; their two single-arm pantographs over the rear bogie, the
  // trailing car's raised in a train
  // the front bogie 5.1 m behind the tip, under the machine-room door, the rear one 3 m from the inner end
  endBogies: [5.1 - JOIN, 19.1 - JOIN],
  endSides: { windows: [], doors: [[4.6 - JOIN, 5.25 - JOIN]] },
  sidePanels: { end: GRILLE },
  endPantograph: "trail", pantographAt: 20.0 - JOIN,
  // the trailers articulated on Jacobs bogies, the end ones on their own motor bogie 3 m inside the end beside the power car
  jacobsTrailers: 3.0,
  fittings: e300Fittings,
  liveries: {
    eurostar: e300Livery("Eurostar", "3104", ORIGINAL, { navy: "#262c3d" }, [], [
      { text: "\u224b", d: 5.45 - JOIN, y: 2.3, h: 0.36, mat: "navy" },
      { text: "eurostar", d: 4.62 - JOIN, y: 1.72, h: 0.38, mat: "noseYellow" },
    ]),
    eurostar2011: e300Livery("Eurostar 2011", "3211", BLUE, { blue: "#1f2c72", markWhite: "#f4f4f1" }, [
      // the blue over the cab sides behind the nose's grey, its front edge leaning back
      { mat: "blue", front: [[1.62, 3.3], [2.4, 3.05], [3.4, 2.9]], back: [[1.62, JOIN + 0.05], [3.4, JOIN + 0.05]] },
      { mat: "noseYellow", front: [[1.52, 3.35], [1.62, 3.3]], back: [[1.52, JOIN + 0.05], [1.62, JOIN + 0.05]] },
    ], [
      { text: "e", d: 5.4 - JOIN, y: 2.15, h: 0.8, mat: "markWhite" },
      { text: "EUROSTAR", d: 5.1 - JOIN, y: 1.9, h: 0.13, mat: "noseYellow" },
    ]),
  },
  weight: { end: 68, middle: 44 }, power: 1500, maxspeed: 300,
};

/** The underfloor equipment between the bogies; on a power car the plough under the nose and the second, folded pantograph. */
function e300Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const s = E300, tr = car.trucks;
  m.scope("underfloor", () => block(m, "under", Math.min(X(tr[1]! - 2.6), X(tr[0]! + 2.6)), Math.max(X(tr[1]! - 2.6), X(tr[0]! + 2.6)), s.B - 0.35, s.B, -s.W * 0.8, s.W * 0.8));
  if (!car.end) return;
  // the grille's ribs, standing proud of its panels
  m.scope("grille ribs", () => {
    for (const sd of [1, -1]) for (const g of GRILLE) for (let i = 1; i < 10; i++) {
      const d = g.d[0] + 0.06 + ((g.d[1] - g.d[0] - 0.12) * i) / 10 - JOIN;
      sidePanel(m, b, X, sd, "grilleRib", d - 0.015, d + 0.015, 1.8, 3.16, 0.017, 0.006);
    }
  });
  // the roof's air intakes behind the canopy and over the machine room
  m.scope("roof vents", () => {
    for (const sd of [1, -1]) for (const [d0, d1] of [[5.0, 6.6], [9.0, 10.6]] as const) {
      crownPane(m, b, X, sd, "grilleRib", [d0 - JOIN, d1 - JOIN], [0.08, 0.62], 0.004);
      for (let k = 1; k < 6; k++) crownPane(m, b, X, sd, "seam", [d0 - JOIN + 0.05, d1 - JOIN - 0.05], [0.08 + k * 0.09, 0.1 + k * 0.09], 0.008);
    }
  });
  m.scope("plough", () => {
    // rings round the plough in plan (x, z), d behind the tip, its front rounded
    const ring = (front: number, back: number, hw: number, depth: number): Array<[number, number]> => {
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= 8; i++) {
        const a = -Math.PI / 2 + (Math.PI * i) / 8;
        pts.push([X(-JOIN + front + depth * (1 - Math.cos(a))), hw * Math.sin(a)]);
      }
      pts.push([X(-JOIN + back), hw], [X(-JOIN + back), -hw]);
      const area = pts.reduce((acc, p, i) => { const q = pts[(i + 1) % pts.length]!; return acc + p[0] * q[1] - q[0] * p[1]; }, 0);
      return area > 0 ? pts.reverse() : pts;
    };
    m.loft("skirtE", ring(0.3, 2.6, 1.05, 0.8), 0.34, ring(0.18, 2.6, 1.12, 0.8), 0.5, false);
    m.loft("skirtE", ring(0.18, 2.6, 1.12, 0.8), 0.5, ring(0.6, 2.6, 1.18, 0.7), 0.81);
  });
  // the second pantograph (the other current), folded ahead of the raised one
  m.scope("folded pantograph", () => {
    const x = X(16.8 - JOIN);
    block(m, "roofE", x - 1.0, x + 1.0, s.C - 0.06, s.C + 0.04, -0.8, 0.8);
    singleArm(m, { xc: x, roofY: s.C + 0.04, baseY: s.C + 0.29, h: 1, raised: false });
    insulator(m, X(18.4 - JOIN), 0.2, s.C - 0.04, s.C + 0.2);
  });
}
