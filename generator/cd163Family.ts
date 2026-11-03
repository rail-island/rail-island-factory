// The CD 163 family as two parametric designs on one body (cd163.ts):
//
// - `veh-cd-163` (CD 163 / 363): the 3 kV DC 162 and 163 and the dual-system
//   362 and 363, portholes on one side and continuous intake shutters on the
//   other. Eleven vlakosimdb liveries as one `livery` enum; the default is the
//   green 163 244-7 the design was first built as.
// - `veh-cd-263` (CD 263 / 371 / 372): the 25 kV AC 263 and the 371/372
//   (Skoda 85E/76E/78E), the same body and cabs with a different machine room:
//   two banks of grilles on the right and windows on the left. Seven vlakosimdb
//   liveries and the 263's and 371's CD blue.
//
// The vlakosimdb liveries are read from the native side BMPs (170 x 60 pixels,
// 0.1 m a pixel; height = 6.0 - 0.1 * row): the band rows, the colours, which
// emblems are painted; the RegioJet and CD blue ones from photographs. See docs/models/loco-liveries.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { CD163_GREEN, cd163Body, cd163LodBody, runningNumber, type Band, type Cd163Layout, type Cd163Livery } from "./cd163.ts";

/** One livery: what the picker shows, the vlakosimdb model it comes from, and the paint. */
interface FamilyLivery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/electric; a livery read from photographs names its photo instead. */
  source?: string;
  /** The reference photograph a livery without a vlakosimdb model is read from (assets/cd-163/). */
  photo?: string;
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
  // RegioJet's 162 112 - 120, read from photo-162-120-regiojet.jpg, photo-162-114-regiojet-side.jpg
  // and photo-162-120-regiojet-front.jpg: yellow all over, the dark grey roof and the dark
  // machine-room shutters, no CD emblems; the "|| REGIO" in red and "JET" in navy along the lower
  // side from the cab at the reader's left, and small on the noses right of the middle
  regiojet: {
    title: "RegioJet 162",
    photo: "photo-162-120-regiojet.jpg",
    numberSource: "photo-162-120-regiojet.jpg (CZ-RJ 91 54 7 162 120-0)",
    livery: {
      number: runningNumber("162", "120"),
      palette: {
        rjYellow: c("#e9a81e"),
        rjRed: c("#d2202a"),
        rjNavy: c("#243a8c"),
        roof: { color: "#55585b", roughness: 0.7 },
        slat: { color: "#2e3033", roughness: 0.7 },
        plate: c("#2a2b2d", 0.6),
      },
      bands: [[1.03, 3.7, "rjYellow"]],
      frame: "rjYellow",
      sideEmblem: false,
      frontEmblem: false,
      wordmark: {
        runs: [["|| REGIO", "rjRed"], ["JET", "rjNavy"]],
        style: { width: 0.75, weight: 0.2, slant: 0.2, gap: 0.14 },
        side: { h: 0.55, v: 1.2, u: -3.3 },
        end: { h: 0.1, v: 2.08, u: 0.7 },
      },
    },
  },
  // CD's current blue (the Najbrt scheme on the 162 / 163), read from photo-162-039-cd-blue.jpg:
  // navy to 1.2 m (the photo: 1.3 m; 1.2 m is the shell's apron kink, one loft fewer), the white band
  // to 1.92 m, light blue to the eave; the white emblem over the
  // white band with the "Ceske drahy" lettering after it, the red number plates
  cdBlue: {
    title: "CD 162 blue",
    photo: "photo-162-039-cd-blue.jpg",
    numberSource: "photo-162-039-cd-blue.jpg",
    livery: {
      number: runningNumber("162", "039"),
      palette: {
        navy: c("#1f3a7a"),
        skyBlue: c("#3c97de"),
        white: c("#eef0f2"),
        logo: { color: "#eef0f2", roughness: 0.5 },
        roof: { color: "#9a9c9e", roughness: 0.7 },
        slat: { color: "#2e3033", roughness: 0.7 },
      },
      bands: [[1.03, 1.2, "navy"], [1.2, 1.92, "white"], [1.92, 3.7, "skyBlue"]],
      frame: "white",
      sideEmblem: true,
      frontEmblem: true,
      emblemY: 1.98,
      wordmark: { runs: [["\u010Cesk\u00E9 dr\u00E1hy", "logo"]], side: { h: 0.14, v: 2.11 } },
    },
  },
} as const satisfies Record<string, FamilyLivery>;

const red263 = (red: string): Record<string, MaterialSpec> => ({ red: c(red) });

/** The Najbrt blue's colours on the 263 / 371 (the shared navy, light blue and white of cdBlue, the darker machine-room blue). */
const NAJBRT_263: Record<string, MaterialSpec> = {
  midBlue: c("#2a6cbf"),
  midRib: c("#3279cc"),
  navy: c("#1f3a7a"),
  skyBlue: c("#3c97de"),
  silver: c("#c9cdd0"),
  logo: { color: "#eef0f2", roughness: 0.5 },
  slat: { color: "#2e3033", roughness: 0.7 },
};

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
  // CD's current blue (the Najbrt scheme) on the 263 and the 371: not the 162's drawing. The ribbed
  // machine room mid blue over a lower band; the cab sections in zones - navy from the seam over
  // the door, light silver-grey ahead of it and on the noses, the light blue windscreen band from
  // the nose's kink to the roof; the frame dark grey, the roof light grey.
  // 263 001-0 ("Maja"), read from photo-263-001-cd-blue.jpg: a silver lower band, red number
  // plates, the white emblem beside the side plate and the navy emblem on the noses.
  cd263Blue: {
    title: "CD 263 blue",
    photo: "photo-263-001-cd-blue.jpg",
    numberSource: "photo-263-001-cd-blue.jpg",
    livery: {
      number: runningNumber("263", "001"),
      palette: { ...NAJBRT_263, roof: { color: "#b4b8bb", roughness: 0.7 } },
      bands: [[1.03, 1.45, "silver"], [1.45, 3.5, "midBlue", "midRib"], [3.5, 3.7, "skyBlue"]],
      cabBands: [[1.03, 3.7, "silver"]],
      cabZones: { rearTo: 6.86, rear: [[1.03, 1.45, "silver"], [1.45, 3.7, "navy"]], end: [[1.03, 2.3, "silver"], [2.3, 3.7, "skyBlue"]] },
      frame: "skyBlue",
      sideEmblem: true,
      frontEmblem: true,
      frontLogo: "navy",
    },
  },
  // 371 002-7, read from photo-371-002-cd-blue.jpg: the lower band dark grey along the whole
  // locomotive, under the noses too; the number lettered black on the noses and small in white
  // on the lower band, no plates; the white emblem and "Ceske drahy" on the machine room, the
  // black emblem on the noses.
  cd371Blue: {
    title: "CD 371 blue",
    photo: "photo-371-002-cd-blue.jpg",
    numberSource: "photo-371-002-cd-blue.jpg",
    livery: {
      number: runningNumber("371", "002"),
      palette: { ...NAJBRT_263, darkGrey: c("#5a5d60", 0.6), roof: { color: "#c3c6c8", roughness: 0.7 }, plate: c("#c9cdd0"), ink: c("#1c1d20", 0.6) },
      bands: [[1.03, 1.35, "darkGrey"], [1.35, 3.5, "midBlue", "midRib"], [3.5, 3.7, "skyBlue"]],
      cabBands: [[1.03, 1.35, "darkGrey"], [1.35, 3.7, "silver"]],
      cabZones: {
        rearTo: 6.86,
        rear: [[1.03, 1.35, "darkGrey"], [1.35, 3.7, "navy"]],
        end: [[1.03, 1.35, "darkGrey"], [1.35, 2.3, "silver"], [2.3, 3.7, "skyBlue"]],
      },
      frame: "skyBlue",
      sideEmblem: true,
      frontEmblem: true,
      frontLogo: "ink",
      numberInk: "ink",
      sideNumber: "lowerBand",
      wordmark: { runs: [["\u010Cesk\u00E9 dr\u00E1hy", "logo"]], side: { h: 0.15, v: 1.92 } },
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

/** The CD 163 / 363 for distant views (docs/models/lod.md). */
export function cd163Lod(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(CD163_PARAMS, params);
  return cd163LodBody(CD163_LIVERIES[livery as keyof typeof CD163_LIVERIES].livery);
}

/** The CD 263 / 371 / 372 for distant views: from afar its machine room looks like the 163's. */
export function cd263Lod(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(CD263_PARAMS, params);
  return cd163LodBody(CD263_LIVERIES[livery as keyof typeof CD263_LIVERIES].livery);
}
