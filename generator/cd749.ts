// The CKD T 478.1 "Bardotka" or "Zamracena" (CD 751, rebuilt with electric
// train heating as the 749): its own design, not a livery of the CD 750, since
// its body differs -- the V nose leaning out under the windscreen and the roof's
// brow over it, 16.50 m over the buffers. The body and running gear are drawn by
// `buildT478` (cd750.ts) from the vlakosimdb `cd_749` model; this module holds
// the liveries, read from the native BMPs and photographs (assets/cd-750).

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { runningNumber } from "./cd163.ts";
import { paint } from "./dieselParts.ts";
import { buildT478, t478Lod, type Cd750Livery } from "./cd750.ts";

const C = (hex: string) => paint(hex);

export const CD749_LIVERIES = {
  cd749: {
    title: "CD 749",
    source: "cd_749",
    body: "bardotka",
    number: runningNumber("749", "107"),
    numberSource: "749 107-9, which ran in the grey and red (CT24, 2018); the native plate does not resolve digits",
    palette: { red: C("#a00000"), grey: C("#b0b7b0"), rib: C("#7f787f") },
    face: [[1.6, 3.7, "grey"], [3.7, 5, "red"]],
    side: [[1.6, 2.6, "grey"], [2.6, 5, "red"]],
    cab: [[1.6, 3.7, "grey"], [3.7, 5, "red"]],
    roof: "red",
    frame: "black",
    plough: "red",
    screen: "rib",
    housing: "grey",
    emblem: "black",
  },
  cd749No264: {
    title: "CD 749 264",
    source: "cd_749",
    body: "bardotka",
    number: runningNumber("749", "264"),
    numberSource: "749 264-8, photographed in this livery (photo-749-264-side.jpg, photo-749-264-three-quarter.jpg)",
    palette: { green: C("#23784a"), cream: C("#ebe6cc"), maroon: C("#6a2f2b"), red: C("#d8452a") },
    // the cream nose up to the windscreen, green round it, the maroon brow and roof
    face: [[1.6, 2.85, "cream"], [2.85, 3.7, "green"], [3.7, 5, "maroon"]],
    // a green skirt, the cream band under the windows, green to the cant
    side: [[1.6, 1.85, "green"], [1.85, 2.6, "cream"], [2.6, 3.7, "green"], [3.7, 5, "maroon"]],
    cab: [[1.6, 2.6, "cream"], [2.6, 3.7, "green"], [3.7, 5, "maroon"]],
    roof: "maroon",
    frame: "black",
    plough: "red",
    screen: "green",
    housing: "maroon",
    emblem: "black",
  },
  cd749No121: {
    title: "CD 749 121",
    source: "cd_749",
    body: "bardotka",
    number: runningNumber("749", "121"),
    numberSource: "749 121-0, photographed in this livery (photo-749-121-front.jpg, photo-749-121-three-quarter.jpg)",
    palette: { navy: C("#26346a"), red: C("#e2402a"), cream: C("#e8dfae") },
    // the nose's red, cream and red bands, the navy windscreen, brow and roof
    face: [[1.6, 1.72, "red"], [1.72, 2.5, "cream"], [2.5, 2.88, "red"], [2.88, 5, "navy"]],
    // the red band from the frame to the windows, navy above
    side: [[1.6, 2.65, "red"], [2.65, 5, "navy"]],
    roof: "navy",
    frame: "navy",
    plough: "red",
    screen: "navy",
    housing: "navy",
    emblem: "black",
  },
} as const satisfies Record<string, Cd750Livery>;

export const CD749_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd749",
  values: Object.entries(CD749_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];

/** The default livery's running number. */
export const CD749_NUMBER = CD749_LIVERIES.cd749.number;

/** The CD 749 Bardotka in one of its liveries; the default is red and grey. */
export function cd749(params?: ParamValues): MeshBuilder {
  const { livery: key } = resolveParams(CD749_PARAMS, params);
  return buildT478(CD749_LIVERIES[key as keyof typeof CD749_LIVERIES]);
}

/** The CD 749 for distant views (docs/models/lod.md). */
export function cd749Lod(params?: ParamValues, budget = 100): MeshBuilder {
  const { livery: key } = resolveParams(CD749_PARAMS, params);
  return t478Lod(CD749_LIVERIES[key as keyof typeof CD749_LIVERIES], budget);
}
