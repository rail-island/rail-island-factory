// The CD Y-family coaches in their later liveries: four vlakosimdb vehicles
// (cd_bcc, cd_beer, cd_bnb, cd_wrrm) as the values of one `variant` parameter.
// Bcc and Beer share the 24.5 m UIC-Y body of the CD green and white coaches
// (cdGreenWhiteCoach.ts), Bnb the same plan under the lower 4.0 m roof of its
// XML, WRRm the 26.4 m body of the BDmeer. Windows, doors and paint follow
// boxes measured on the native BMPs (assets/cd-y-coach/native/<key>/landmarks.json)
// at 0.1 m a pixel; the builder is liveryCoach.ts. See docs/models/czsk-coaches.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { PxBox } from "./csdCoaches.ts";
import { BODIES, Y_UNDERFRAME_A, Y_UNDERFRAME_B } from "./cdGreenWhiteCoach.ts";
import { buildLiveryCoach, Y_END, type BodyGeo, type DoorSpec, type LiveryCoachSpec, type LiverySide, type Paint, type Win } from "./liveryCoach.ts";

export type CdYVariant = "bcc" | "beer" | "bnb" | "wrrm";

export const CD_Y_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "bcc",
    values: [
      { value: "bcc", title: "Bcc (couchette coach, blue and white)" },
      { value: "beer", title: "Beer (2nd class, white with dark blue and red ends)" },
      { value: "bnb", title: "Bnb (2nd class, cream and red, 4.0 m roof)" },
      { value: "wrrm", title: "WRRm (26.4 m dining car, white with a red band)" },
    ],
  },
];

/** The running number of each variant (UIC, with its check digit), and where it came from. */
export const CD_Y_NUMBERS: Record<CdYVariant, { number: string; source: string }> = {
  bcc: { number: "51 54 50-41 041-7", source: "illustrative, CD Bc / Bcc 50-41 couchette series; no legible photograph of the blue and white type" },
  beer: { number: "61 54 20-70 233-9", source: "illustrative, CD Beer 20-70 series; no legible photograph" },
  bnb: { number: "50 54 20-29 064-3", source: "illustrative, in the CD format; no photograph of the type" },
  wrrm: { number: "61 54 88-70 008-4", source: "illustrative, CD WRRm 88-70 series; no legible photograph" },
};

const F = (b: PxBox): Win => [b, "frosted"];
const door = (box: PxBox, glass: PxBox[], paint: DoorSpec["paint"]): DoorSpec => ({ box, glass, paint });
/** Two toilets and ten compartments: the window columns of cd_b, cd_bee and their relatives. */
const Y_COMPARTMENTS: PxBox[] = [31, 50, 69, 88, 107, 125, 144, 163, 182, 201].map((x): PxBox => [x, 19, x + 13, 30]);
const Y_VENTS: Array<[number, number]> = [[3.6, 4.2], [7.8, 8.4], [12.0, 12.6], [16.2, 16.8], [20.4, 21.0]];

/** Bnb's XML body: the Y plan under a 4.0 m roof. */
const Y40: BodyGeo = {
  length: 24.5,
  section: BODIES.bdmeer.section.map(([z, y]): Pt => [z, y]),
  plan: BODIES.y.plan.map(([x, y]): Pt => [x, y]),
  top: [[0.2, 3.8], [0.4, 4.0], [24.1, 4.0], [24.3, 3.8]],
  bogies: BODIES.y.bogies,
  canvas: 5,
};
const geo = (b: "y" | "bdmeer"): BodyGeo => ({
  length: BODIES[b].length,
  section: BODIES[b].section.map(([z, y]): Pt => [z, y]),
  plan: BODIES[b].plan.map(([x, y]): Pt => [x, y]),
  top: BODIES[b].top.map(([x, y]): Pt => [x, y]),
  bogies: BODIES[b].bogies,
  canvas: 5,
});

const base = (palette: Record<string, MaterialSpec>): Record<string, MaterialSpec> => ({
  marking: { color: "#262828", roughness: 0.6 },
  emblem: { color: "#f4f6f4", roughness: 0.5 },
  ...palette,
});

/** The Beer's ends: dark blue around the doors, a red strip at the very end, a red wedge by the door step. */
const BEER_ENDS: Paint[] = [
  { box: [15, 18, 18, 31], mat: "navy" },
  { box: [2, 18, 5, 39], mat: "red" },
  { poly: [[17, 33], [17, 38], [23, 38]], mat: "red" },
  { box: [227, 18, 240, 31], mat: "navy" },
  { box: [240, 18, 243, 39], mat: "red" },
  { poly: [[228, 32], [228, 38], [222, 38]], mat: "red" },
];

/** The WRRm's red window band, broken by a white diagonal that carries on down as a red stripe. */
const WRRM_BAND: Paint[] = [
  { poly: [[2, 18], [183, 18], [176.5, 31], [2, 31]], mat: "red" },
  { poly: [[195, 18], [262, 18], [262, 31], [189, 31]], mat: "red" },
  { poly: [[189, 31], [199, 31], [195, 41], [185, 41]], mat: "red" },
];

function variantSpec(variant: CdYVariant): LiveryCoachSpec {
  const number = CD_Y_NUMBERS[variant].number;
  switch (variant) {
    case "bcc": {
      const doors = [door([5, 18, 15, 38], [[8, 20, 13, 29]], "doorBlue"), door([230, 18, 240, 38], [[232, 20, 237, 29]], "doorBlue")];
      const signs = [[27, 21, 30, 26], [215, 21, 218, 26]].map((box) => ({ box: box as PxBox, text: "2", mat: "white" }));
      const side = (frosted: boolean, emblem: PxBox, numberAt: number): LiverySide => ({
        windows: [frosted ? F([18, 19, 26, 30]) : [18, 19, 26, 30], ...Y_COMPARTMENTS, frosted ? F([219, 19, 227, 30]) : [219, 19, 227, 30]],
        doors,
        signs,
        emblem,
        numberAt,
      });
      return {
        body: geo("y"),
        palette: base({ white: { color: "#eef3ee", roughness: 0.55 }, blue: { color: "#0a3a9a", roughness: 0.5 }, doorBlue: { color: "#0b2a86", roughness: 0.5 }, roof: { color: "#e2e6e2", roughness: 0.7 }, marking: { color: "#1a1c1c", roughness: 0.6 } }),
        bands: [[0.9, 1.9, "white"], [1.9, 3.2, "blue"], [3.2, 4.3, "roof"]],
        endPaint: "blue",
        endDoor: "doorBlue",
        end: Y_END,
        emblem: { kind: "cd", mat: "marking" },
        number,
        numberMat: "marking",
        numberY: 1.45,
        vents: [[2.2, 2.8], [21.7, 22.3]],
        ventMat: "steel",
        underframe: Y_UNDERFRAME_B,
        steps: "y",
        entrances: { rear: true, front: true },
        handrails: [[1.57, 1.3, 2.05], [22.87, 1.3, 2.05]],
        right: side(false, [195, 33, 201, 37], 122.5),
        left: side(true, [43, 33, 49, 37], 123.5),
      };
    }
    case "beer": {
      const doorBands: Array<[number, number, string]> = [[0.9, 2.1, "red"], [2.1, 3.4, "navy"]];
      const doors = [door([5, 18, 15, 38], [[8, 20, 13, 29]], doorBands), door([230, 18, 240, 38], [[232, 20, 237, 29]], doorBands)];
      const signs = [[27, 21, 30, 26], [215, 21, 218, 26]].map((box) => ({ box: box as PxBox, text: "2", mat: "signGrey" }));
      const side = (frosted: boolean, emblem: PxBox, numberAt: number): LiverySide => ({
        windows: [frosted ? F([18, 19, 26, 30]) : [18, 19, 26, 30], ...Y_COMPARTMENTS, frosted ? F([219, 19, 227, 30]) : [219, 19, 227, 30]],
        doors,
        paint: BEER_ENDS,
        signs,
        emblem,
        numberAt,
      });
      return {
        body: geo("y"),
        palette: base({ white: { color: "#eef0ee", roughness: 0.55 }, navy: { color: "#06223f", roughness: 0.5 }, red: { color: "#ee3a3a", roughness: 0.5 }, roof: { color: "#d4d6d4", roughness: 0.7 }, signGrey: { color: "#9a9c9c", roughness: 0.5 }, marking: { color: "#e8ece8", roughness: 0.6 } }),
        bands: [[0.9, 1.1, "red"], [1.1, 1.8, "navy"], [1.8, 3.2, "white"], [3.2, 4.3, "roof"]],
        endPaint: "red",
        endDoor: "red",
        end: Y_END,
        emblem: { kind: "cd", mat: "emblem" },
        number,
        numberMat: "marking",
        numberY: 1.45,
        vents: Y_VENTS,
        ventMat: "steel",
        underframe: Y_UNDERFRAME_A,
        steps: "y",
        entrances: { rear: true, front: true },
        handrails: [[1.57, 1.3, 2.05], [22.87, 1.3, 2.05]],
        right: side(false, [44, 33, 50, 37], 123.5),
        left: side(true, [195, 33, 201, 37], 123.5),
      };
    }
    case "bnb": {
      // the colorizes of cd_bnb are swapped: its z_inc.bmp paints the +z (right) side
      const doors = [door([5, 18, 16, 38], [[9, 20, 13, 29]], "bands"), door([229, 18, 240, 38], [[232, 20, 236, 29]], "bands")];
      const signs = [[29, 20, 31, 27], [226, 20, 228, 27]].map((box) => ({ box: box as PxBox, text: "2", mat: "darkRed" }));
      const windows = (frosted: boolean): Win[] => [frosted ? F([20, 19, 28, 30]) : [20, 19, 28, 30], ...[32, 50, 68, 86, 104, 122, 140, 158, 176, 194, 212].map((x): PxBox => [x, 19, x + 13, 30])];
      const paint: Paint[] = [{ box: [16, 38, 229, 39], mat: "darkRed" }];
      return {
        body: Y40,
        palette: base({ cream: { color: "#efefc0", roughness: 0.55 }, red: { color: "#b0141a", roughness: 0.5 }, darkRed: { color: "#7e0c0c", roughness: 0.5 }, roof: { color: "#8f9191", roughness: 0.7 }, marking: { color: "#e6e6e0", roughness: 0.6 } }),
        bands: [[0.9, 1.9, "red"], [1.9, 3.2, "cream"], [3.2, 4.1, "roof"]],
        endDoor: "red",
        end: Y_END,
        emblem: { kind: "cd", mat: "emblem" },
        number,
        numberMat: "marking",
        numberY: 1.45,
        vents: [[2.2, 2.8], [21.7, 22.3]],
        ventMat: "steel",
        underframe: Y_UNDERFRAME_B,
        steps: "y",
        entrances: { rear: true, front: true },
        handrails: [[1.67, 1.3, 2.05], [22.87, 1.3, 2.05]],
        right: { windows: windows(true), doors, paint, signs, emblem: [33, 32, 39, 36], numberAt: 123.5 },
        left: { windows: windows(false), doors, paint, signs, emblem: [199, 32, 205, 36], numberAt: 123.5 },
      };
    }
    case "wrrm": {
      const kitchen = [16, 33, 50, 67, 84].map((x): Win => [[x, 20, x + 12, 30], "barred"]);
      const dining = [115, 139, 163, 208, 225].map((x): PxBox => [x, 20, x + 12, 30]);
      const side = (): LiverySide => ({
        windows: [...kitchen, ...dining],
        doors: [door([249, 18, 259, 38], [[251, 20, 255, 29]], "red")],
        paint: WRRM_BAND,
        seams: [[185, 19, 194, 38]],
        emblem: [36, 33, 42, 37],
        numberAt: 160,
      });
      return {
        body: geo("bdmeer"),
        palette: base({ white: { color: "#eef3ee", roughness: 0.55 }, red: { color: "#e8141a", roughness: 0.5 }, roof: { color: "#e6eae6", roughness: 0.7 }, bars: { color: "#e4e8e4", roughness: 0.5 }, marking: { color: "#1a1c1c", roughness: 0.6 } }),
        bands: [[0.9, 3.2, "white"], [3.2, 4.1, "roof"]],
        endPaint: "red",
        endDoor: "red",
        end: Y_END,
        emblem: { kind: "cd", mat: "marking" },
        number,
        numberMat: "marking",
        numberY: 1.45,
        vents: [[0.8, 1.4], [11.3, 11.9], [12.2, 12.8], [14.6, 15.2], [15.9, 16.5], [17.2, 17.8], [18.5, 19.1], [24.1, 24.7]],
        ventMat: "steel",
        roofBoxes: [[13.5, 14.1, 0.7, 0.14], [14.2, 14.8, 0.7, 0.14], [17.4, 18.0, 0.7, 0.14], [18.9, 19.5, 0.7, 0.14]],
        underframe: [
          [[6.0, 0.4], [10.9, 0.4], [10.9, 0.9], [6.0, 0.9]],
          [[11.0, 0.5], [12.7, 0.5], [13.7, 0.6], [13.7, 0.9], [11.0, 0.9]],
          [[14.0, 0.5], [15.2, 0.5], [15.2, 0.9], [14.0, 0.9]],
          [[16.1, 0.4], [20.4, 0.4], [20.4, 0.9], [16.1, 0.9]],
        ],
        steps: "y",
        entrances: { rear: false, front: true },
        handrails: [[24.65, 1.3, 2.05]],
        right: side(),
        left: side(),
      };
    }
  }
}

/** One CD Y-family coach in a later livery (vlakosimdb cd_<variant>). */
export function cdYCoach(params?: ParamValues): MeshBuilder {
  const variant = resolveParams(CD_Y_PARAMS, params).variant as CdYVariant;
  return buildLiveryCoach(variantSpec(variant));
}
