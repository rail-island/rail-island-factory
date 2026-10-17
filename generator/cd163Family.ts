// The CD 163 family as two parametric designs on one body (cd163.ts):
//
// - `veh-cd-163` (CD 163 / 363): the 3 kV DC 162 and 163 and the dual-system
//   362 and 363, portholes on one side and continuous intake shutters on the
//   other. Eleven vlakosimdb liveries as one `livery` enum; the default is the
//   green 163 244-7 the design was first built as.
// - `veh-cd-263` (CD 263 / 371 / 372): the 25 kV AC 263 and the 371/372
//   (Skoda 85E/76E/78E), the same body and cabs with a different machine room:
//   two banks of grilles on the right and windows on the left. Five liveries.
//
// The liveries are read from the native vlakosimdb side BMPs (170 x 60 pixels,
// 0.1 m a pixel; height = 6.0 - 0.1 * row): the band rows, the colours, which
// emblems are painted. See docs/models/loco-liveries.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { CD163_GREEN, cd163Body, runningNumber, type Band, type Cd163Layout, type Cd163Livery } from "./cd163.ts";

/** One livery: what the picker shows, the vlakosimdb model it comes from, and the paint. */
interface FamilyLivery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/electric. */
  source: string;
  /** Where the running number comes from. */
  numberSource: string;
  livery: Cd163Livery;
  /** The CD 263 family only: the left side's windows. */
  layout?: Cd163Layout;
}

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, metallic: 0.1, roughness });

/** The light grey roof of the later vlakosimdb repaints (cd_*.022, .044, .054). */
const LIGHT_ROOF = { roof: { color: "#8e8f8e", roughness: 0.7 } };

/** Green below and above a band from 1.70 to 2.30 m (all the classic liveries). */
const banded = (body: string, band: string): Band[] => [[1.03, 1.7, body], [1.7, 2.3, band], [2.3, 3.7, body]];

const FROM_NAME = "the vlakosimdb model's name";
const ILLUSTRATIVE = "illustrative, a unit of the class; the native plate does not resolve digits";

export const CD163_LIVERIES = {
  cd163: {
    title: "CD 163",
    source: "cd_163",
    numberSource: "photo-163-244-front.jpg",
    livery: CD163_GREEN,
  },
  cd162: {
    title: "CD 162",
    source: "cd_162",
    numberSource: ILLUSTRATIVE,
    livery: { ...CD163_GREEN, number: runningNumber("162", "035") },
  },
  cd162No022: {
    title: "CD 162 022",
    source: "cd_162.022",
    numberSource: FROM_NAME,
    livery: { ...CD163_GREEN, number: runningNumber("162", "022"), palette: LIGHT_ROOF },
  },
  cd163No022: {
    title: "CD 163 022",
    source: "cd_163.022",
    numberSource: FROM_NAME,
    livery: {
      ...CD163_GREEN,
      number: runningNumber("163", "022"),
      palette: { ...LIGHT_ROOF, paleYellow: c("#d9c47a") },
      bands: banded("green", "paleYellow"),
      frame: "white",
    },
  },
  cd163No021: {
    title: "CD 163 021",
    source: "cd_163_021",
    numberSource: FROM_NAME,
    livery: {
      ...CD163_GREEN,
      number: runningNumber("163", "021"),
      palette: { turquoise: c("#1f6b58"), cream: c("#e6e2b0") },
      bands: banded("turquoise", "cream"),
      frame: "cream",
    },
  },
  cd362: {
    title: "CD 362",
    source: "cd_362",
    numberSource: ILLUSTRATIVE,
    livery: {
      number: runningNumber("362", "024"),
      palette: { blue: c("#3a43a8") },
      bands: banded("blue", "yellow"),
      frame: "white",
      sideEmblem: false,
      frontEmblem: false,
    },
  },
  cd362No054: {
    title: "CD 362 054",
    source: "cd_362.054",
    numberSource: FROM_NAME,
    livery: {
      number: runningNumber("362", "054"),
      palette: { ...LIGHT_ROOF, blue: c("#3a43a8") },
      bands: banded("blue", "yellow"),
      frame: "white",
      sideEmblem: false,
      frontEmblem: true,
    },
  },
  cd363: {
    title: "CD 363",
    source: "cd_363",
    numberSource: ILLUSTRATIVE,
    livery: {
      ...CD163_GREEN,
      number: runningNumber("363", "060"),
      palette: { blue: c("#24479a"), cream: c("#e3dfac") },
      bands: banded("blue", "cream"),
      frame: "cream",
    },
  },
  cd363No044: {
    title: "CD 363 044",
    source: "cd_363.044",
    numberSource: FROM_NAME,
    livery: {
      ...CD163_GREEN,
      number: runningNumber("363", "044"),
      palette: { ...LIGHT_ROOF, blue: c("#24479a"), cream: c("#e3dfac") },
      bands: banded("blue", "cream"),
      frame: "cream",
    },
  },
  cd363No037: {
    title: "CD 363 037",
    source: "cd_363_037",
    numberSource: FROM_NAME,
    livery: {
      number: runningNumber("363", "037"),
      palette: {
        silver: c("#d2d2d2"),
        skyBlue: c("#5f86e6"),
        navy: c("#23198a"),
        darkGrey: c("#3d3d3d", 0.7),
        pantograph: { color: "#b0121a", metallic: 0.2, roughness: 0.6 },
      },
      // rows 47-50 dark grey, 42-46 navy, 36-41 sky blue, 26-35 silver (the one-pixel navy
      // line at row 26 is left out to keep the livery within the triangle budget)
      bands: [[1.03, 1.3, "darkGrey"], [1.3, 1.8, "navy"], [1.8, 2.4, "skyBlue"], [2.4, 3.7, "silver"]],
      // the cab sections at x = 8 px: silver over a navy skirt (rows 44-50; its dark grey
      // bottom row is hidden behind the steps), a blue line under the windows (rows 35-36)
      cabBands: [[1.03, 1.6, "navy"], [1.6, 2.3, "silver"], [2.3, 2.5, "skyBlue"], [2.5, 3.7, "silver"]],
      frame: "white",
      sideEmblem: true,
      frontEmblem: true,
    },
  },
  cd363No009: {
    title: "CD 363 009",
    source: "cd_363_009",
    numberSource: FROM_NAME,
    livery: {
      number: runningNumber("363", "009"),
      palette: { red: c("#a8141a"), charcoal: c("#363636", 0.6), logo: { color: "#eeeeee", roughness: 0.5 } },
      // rows 47-50 charcoal, 37-46 red, 27-36 charcoal, 26 red
      bands: [[1.03, 1.3, "charcoal"], [1.3, 2.3, "red"], [2.3, 3.3, "charcoal"], [3.3, 3.7, "red"]],
      // the cabs: red, a charcoal stripe at the band's height (rows 37-39)
      cabBands: [[1.03, 1.3, "charcoal"], [1.3, 2.0, "red"], [2.0, 2.3, "charcoal"], [2.3, 3.7, "red"]],
      frame: "white",
      sideEmblem: true,
      frontEmblem: true,
    },
  },
} as const satisfies Record<string, FamilyLivery>;

const red263 = (red: string): Record<string, MaterialSpec> => ({ red: c(red) });

export const CD263_LIVERIES = {
  cd263: {
    title: "CD 263",
    source: "cd_263",
    numberSource: ILLUSTRATIVE,
    livery: { ...CD163_GREEN, number: runningNumber("263", "002"), palette: red263("#c8161a"), bands: banded("red", "yellow") },
  },
  cd263No015: {
    title: "CD 263 015",
    source: "cd_263.015",
    numberSource: FROM_NAME,
    livery: { ...CD163_GREEN, number: runningNumber("263", "015"), palette: { ...LIGHT_ROOF, ...red263("#c8161a") }, bands: banded("red", "yellow") },
  },
  cd371No002: {
    title: "CD 371 002",
    source: "cd_371_002",
    numberSource: FROM_NAME,
    livery: {
      ...CD163_GREEN,
      number: runningNumber("371", "002"),
      palette: { red: c("#a8121a"), cream: c("#ece9cf") },
      // rows 46-50 red, 40-45 cream, 38-39 yellow, 37 cream
      bands: [[1.03, 1.4, "red"], [1.4, 2.0, "cream"], [2.0, 2.2, "yellow"], [2.2, 2.3, "cream"], [2.3, 3.7, "red"]],
      frame: "red",
    },
  },
  cd371No005: {
    title: "CD 371 005",
    source: "cd_371.005",
    numberSource: FROM_NAME,
    layout: "371",
    livery: {
      ...CD163_GREEN,
      number: runningNumber("371", "005"),
      palette: { ...LIGHT_ROOF, red: c("#b8121a"), cream: c("#e2df98"), lemon: c("#f2e600") },
      // rows 47-50 red, 39-46 cream, 38 lemon, 37 cream
      bands: [[1.03, 1.3, "red"], [1.3, 2.1, "cream"], [2.1, 2.2, "lemon"], [2.2, 2.3, "cream"], [2.3, 3.7, "red"]],
      frame: "rubber",
    },
  },
  cd372: {
    title: "CD 372",
    source: "cd_372",
    numberSource: ILLUSTRATIVE,
    livery: { ...CD163_GREEN, number: runningNumber("372", "011"), palette: { ...LIGHT_ROOF, ...red263("#c0151a") }, bands: banded("red", "yellow") },
  },
  // The DB 180 is the DR 230 / CD 372 (Skoda 66E); vlakosimdb draws both on the 372 body.
  db180: {
    title: "DB 180",
    source: "db_180",
    numberSource: ILLUSTRATIVE,
    livery: {
      number: runningNumber("180", "008"),
      // rows 27-50 red (ribs #b80000 / #900000), the white line at row 42; red up to the roof
      palette: { red: c("#a80000"), roof: { color: "#8c1010", roughness: 0.7 } },
      bands: [[1.03, 1.7, "red"], [1.7, 1.8, "white"], [1.8, 3.7, "red"]],
      frame: "rubber",
      sideEmblem: false,
      frontEmblem: false,
    },
  },
  dbAg180: {
    title: "DB AG 180",
    source: "db ag_180",
    numberSource: ILLUSTRATIVE,
    livery: {
      number: runningNumber("180", "014"),
      // rows 27-50 orient red (#9c1212 / #650c0c), the white line at row 42; the light grey roof
      palette: { ...LIGHT_ROOF, red: c("#821010") },
      bands: [[1.03, 1.7, "red"], [1.7, 1.8, "white"], [1.8, 3.7, "red"]],
      frame: "rubber",
      sideEmblem: false,
      frontEmblem: false,
    },
  },
} as const satisfies Record<string, FamilyLivery>;

function liveryParam(liveries: Record<string, FamilyLivery>, def: string): ParamSpec[] {
  return [{
    name: "livery",
    title: "Livery",
    default: def,
    values: Object.entries(liveries).map(([value, l]) => ({ value, title: l.title })),
  }];
}

export const CD163_PARAMS: readonly ParamSpec[] = liveryParam(CD163_LIVERIES, "cd163");
export const CD263_PARAMS: readonly ParamSpec[] = liveryParam(CD263_LIVERIES, "cd263");

/** The CD 163 / 363 in one of its liveries; the default is the green 163 244-7. */
export function cd163(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(CD163_PARAMS, params);
  return cd163Body(CD163_LIVERIES[livery as keyof typeof CD163_LIVERIES].livery, "163");
}

/** The CD 263 / 371 / 372 in one of its liveries: the 163's body with the 263's machine room. */
export function cd263(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(CD263_PARAMS, params);
  const l: FamilyLivery = CD263_LIVERIES[livery as keyof typeof CD263_LIVERIES];
  return cd163Body(l.livery, l.layout ?? "263");
}
