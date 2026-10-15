// The CD green and white coaches: nine vlakosimdb vehicles (cd_a, cd_ab, cd_b,
// cd_bee, cd_beel, cd_bds, cd_ds, cd_bdmeer, cd_bdmtee) as one parametric design.
// Seven share the 24.5 m UIC-Y body of the CSD A and B, BDmeer and Bdmtee the
// 26.4 m bodies of their XML. Bodies follow the XML alongx/alongy/alongz
// profiles; windows, doors and paint follow boxes measured on the native BMPs
// (assets/cd-green-white/native/<key>/landmarks.json) at 0.1 m a pixel. The two
// sides are listed separately: z_dec is the right (+Z) side, z_inc the left.
// See docs/models/cd-green-white.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { Coach, px, type Pt, type Volume } from "./csdCoachParts.ts";
import { emblem } from "./cd163.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { endName, fpx, gangway, headstock, lamp, mirror, roofVents, sides, sideName, Y_SECTION, type PxBox } from "./csdCoaches.ts";

export type GreenWhiteVariant = "a" | "ab" | "b" | "bee" | "beel" | "bds" | "ds" | "bdmeer" | "bdmtee";

export const GREEN_WHITE_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "b",
    values: [
      { value: "a", title: "A (1st class, 9 compartments)" },
      { value: "ab", title: "AB (1st and 2nd class, 9 compartments)" },
      { value: "b", title: "B (2nd class, 10 compartments)" },
      { value: "bee", title: "Bee (2nd class, 10 compartments, modernised)" },
      { value: "beel", title: "Beel (2nd class, 10 compartments, air-conditioned)" },
      { value: "bds", title: "BDs (2nd class with a luggage compartment)" },
      { value: "ds", title: "Ds (luggage van)" },
      { value: "bdmeer", title: "BDmeer (26.4 m, 2nd class with a luggage compartment)" },
      { value: "bdmtee", title: "Bdmtee (26.4 m open coach, two double doors)" },
    ],
  },
];

/** The running number of each variant (UIC, with its check digit), and where it came from. */
export const GREEN_WHITE_NUMBERS: Record<GreenWhiteVariant, { number: string; source: string }> = {
  a: { number: "51 54 19-41 123-3", source: "illustrative, CD A149 series; no legible photograph" },
  ab: { number: "51 54 39-41 045-4", source: "illustrative, CD AB349 series; no legible photograph" },
  b: { number: "51 54 20-41 456-4", source: "illustrative, CD B249 series; no legible photograph" },
  bee: { number: "51 54 20-41 789-8", source: "illustrative, CD Bee243 series; no legible photograph" },
  beel: { number: "61 54 20-70 015-0", source: "illustrative, CD Beel series; no legible photograph" },
  bds: { number: "51 54 82-41 120-1", source: "illustrative, CD BDs449 series; no legible photograph" },
  ds: { number: "51 54 92-41 030-0", source: "illustrative, CD Ds series; no legible photograph" },
  bdmeer: { number: "50 54 82-44 017-7", source: "illustrative; no legible photograph" },
  bdmtee: { number: "50 54 22-44 268-9", source: "legible on photo-bdmtee-50-54-22-44-268-9-side-brno-2009.jpg (CD green and white)" },
};

type Win = PxBox | [PxBox, "frosted"];
interface DoorSpec {
  box: PxBox;
  glass: PxBox[];
  /** "green" a green leaf (the passenger doors), "bands" in the body's bands (the luggage doors). */
  paint: "green" | "bands";
}
interface SideSpec {
  windows: Win[];
  doors: DoorSpec[];
  /**
   * The class numerals beside the toilets and by the doors: the white 3 by 5
   * pixel marks of the native BMPs, a "1" on the A and a "2" on the others.
   */
  signs: PxBox[];
  /** The CD emblem's box on the white band. */
  emblem: PxBox;
}
interface VariantSpec {
  body: "y" | "bdmeer" | "bdmtee";
  roof: string;
  /** The first class's yellow line under the roof: native columns. */
  yellow?: [number, number];
  /** AB's yellow class numerals beside the toilets: [text, source x]. */
  classMarks?: Array<[string, number]>;
  /** The end walls' paint ("bands": roof, green and white bands as the Beel's ends). */
  endWall: "green" | "bands";
  endDoor: "green" | "red";
  lampY: number;
  /** The guard's lookout bay of BDs and Ds (XML alongy 3.2..4.4, alongx y 2.1..3.1). */
  bay?: boolean;
  vents: Array<[number, number]>;
  /** Underframe boxes of the XML alongz, source (x, y) outlines. */
  underframe: Pt[][];
  right: SideSpec;
  left: SideSpec;
}

const range = (n: number, x0: number, step: number, w: number, y0 = 19, y1 = 30): PxBox[] =>
  Array.from({ length: n }, (_, k): PxBox => [x0 + step * k, y0, x0 + step * k + w, y1]);
const F = (b: PxBox): Win => [b, "frosted"];
const endDoor = (box: PxBox, glass: PxBox, paint: DoorSpec["paint"] = "green"): DoorSpec => ({ box, glass: [glass], paint });
const luggageDoor = (box: PxBox, glass: PxBox[]): DoorSpec => ({ box, glass, paint: "bands" });

const Y_VENTS: Array<[number, number]> = [[3.6, 4.2], [7.8, 8.4], [12.0, 12.6], [16.2, 16.8], [20.4, 21.0]];
const Y_UNDERFRAME_A: Pt[][] = [
  [[7.2, 0.4], [8.7, 0.4], [8.7, 0.9], [7.2, 0.9]],
  [[11.3, 0.6], [11.8, 0.4], [12.7, 0.4], [12.8, 0.5], [12.8, 0.9], [11.3, 0.9]],
  [[13.4, 0.4], [18.5, 0.4], [18.5, 0.9], [13.4, 0.9]],
];
const Y_UNDERFRAME_B: Pt[][] = [
  [[6.3, 0.3], [10.9, 0.3], [10.9, 0.9], [6.3, 0.9]],
  [[11.4, 0.6], [13.1, 0.6], [13.1, 0.9], [11.4, 0.9]],
  [[14.2, 0.4], [18.5, 0.4], [18.5, 0.9], [14.2, 0.9]],
];
const LUGGAGE_UNDERFRAME: Pt[][] = [
  [[7.0, 0.5], [8.5, 0.5], [8.5, 0.9], [7.0, 0.9]],
  [[11.3, 0.6], [11.8, 0.4], [12.7, 0.4], [12.9, 0.5], [12.9, 0.9], [11.3, 0.9]],
  [[13.4, 0.4], [15.5, 0.4], [15.5, 0.9], [13.4, 0.9]],
];

const ROOF = "#eef4ee";
const Y_DOORS_RIGHT = [endDoor([5, 18, 15, 38], [8, 20, 13, 29]), endDoor([230, 18, 240, 38], [232, 20, 237, 29])];
const Y_SIGNS: PxBox[] = [[27, 21, 30, 26], [215, 21, 218, 26]];

const VARIANTS: Record<GreenWhiteVariant, VariantSpec> = {
  a: {
    body: "y",
    roof: ROOF,
    yellow: [15, 230],
    endWall: "green",
    endDoor: "green",
    lampY: 1.5,
    vents: Y_VENTS,
    underframe: Y_UNDERFRAME_A,
    right: { windows: [F([18, 19, 26, 30]), ...range(9, 32, 21, 13), F([219, 19, 227, 30])], doors: Y_DOORS_RIGHT, signs: Y_SIGNS, emblem: [44, 33, 50, 37] },
    left: { windows: [[18, 19, 26, 30], ...range(9, 32, 21, 13), [219, 19, 227, 30]], doors: Y_DOORS_RIGHT, signs: Y_SIGNS, emblem: [195, 33, 201, 37] },
  },
  ab: {
    body: "y",
    roof: ROOF,
    yellow: [133, 230],
    classMarks: [["2", 2.9], ["1", 21.65]],
    endWall: "green",
    endDoor: "green",
    lampY: 1.5,
    vents: Y_VENTS,
    underframe: Y_UNDERFRAME_B,
    right: {
      windows: [F([18, 19, 26, 30]), ...range(9, 32, 21, 13), F([219, 19, 227, 30])],
      doors: [endDoor([5, 18, 15, 38], [9, 20, 13, 29]), endDoor([230, 18, 240, 38], [232, 20, 236, 29])],
      signs: [],
      emblem: [45, 33, 51, 37],
    },
    left: {
      windows: [[17, 19, 25, 30], ...range(9, 31, 21, 13), [218, 19, 226, 30]],
      doors: [endDoor([5, 18, 14, 38], [9, 20, 13, 29]), endDoor([230, 18, 240, 38], [232, 20, 236, 29])],
      signs: [],
      emblem: [193, 33, 199, 37],
    },
  },
  b: {
    body: "y",
    roof: ROOF,
    endWall: "green",
    endDoor: "green",
    lampY: 1.5,
    vents: Y_VENTS,
    underframe: Y_UNDERFRAME_B,
    right: { windows: [F([18, 19, 26, 30]), ...range(10, 31, 19, 13), F([219, 19, 227, 30])], doors: Y_DOORS_RIGHT, signs: Y_SIGNS, emblem: [44, 33, 50, 37] },
    left: { windows: [[18, 19, 26, 30], ...range(10, 31, 19, 13), [219, 19, 227, 30]], doors: Y_DOORS_RIGHT, signs: Y_SIGNS, emblem: [195, 33, 201, 37] },
  },
  bee: {
    body: "y",
    roof: "#cfcfcf",
    endWall: "green",
    endDoor: "red",
    lampY: 1.5,
    vents: Y_VENTS,
    underframe: Y_UNDERFRAME_A,
    right: { windows: [[18, 19, 26, 30], ...range(10, 31, 19, 13), [219, 19, 227, 30]], doors: Y_DOORS_RIGHT, signs: Y_SIGNS, emblem: [44, 33, 50, 37] },
    left: { windows: [F([18, 19, 26, 30]), ...range(10, 31, 19, 13), F([219, 19, 227, 30])], doors: Y_DOORS_RIGHT, signs: Y_SIGNS, emblem: [195, 33, 201, 37] },
  },
  beel: {
    body: "y",
    roof: "#c0c0b0",
    endWall: "bands",
    endDoor: "red",
    lampY: 1.75,
    vents: [[0.7, 1.3], [1.6, 2.2], [23.2, 23.8]],
    underframe: [
      [[7.0, 0.4], [9.2, 0.4], [9.2, 0.9], [7.0, 0.9]],
      [[11.3, 0.6], [11.8, 0.4], [12.7, 0.4], [12.8, 0.5], [12.8, 0.9], [11.3, 0.9]],
      [[13.4, 0.4], [18.4, 0.4], [18.4, 0.9], [13.4, 0.9]],
    ],
    right: {
      windows: [F([17, 19, 25, 30]), ...range(10, 30, 19, 13), F([219, 19, 227, 30])],
      doors: [endDoor([5, 18, 15, 44], [8, 21, 13, 31]), endDoor([230, 18, 240, 44], [232, 21, 237, 31])],
      signs: [[26, 21, 29, 26], [215, 21, 218, 26]],
      emblem: [44, 33, 50, 37],
    },
    left: {
      windows: [[17, 19, 25, 30], ...range(10, 30, 19, 13), [219, 19, 227, 30]],
      doors: [endDoor([5, 18, 15, 44], [8, 21, 13, 31]), endDoor([230, 18, 240, 44], [232, 21, 237, 31])],
      signs: [[26, 21, 29, 26], [215, 21, 218, 26]],
      emblem: [195, 33, 201, 37],
    },
  },
  bds: {
    body: "y",
    roof: ROOF,
    endWall: "green",
    endDoor: "green",
    lampY: 1.5,
    bay: true,
    vents: Y_VENTS,
    underframe: [...LUGGAGE_UNDERFRAME, [[9.4, 0.6], [11.1, 0.6], [11.1, 0.9], [9.4, 0.9]], [[16.3, 0.4], [18.4, 0.4], [18.4, 0.9], [16.3, 0.9]]],
    right: {
      windows: [F([18, 19, 26, 30]), [108, 19, 116, 30], ...range(5, 125, 19, 13), F([219, 19, 227, 30])],
      doors: [...Y_DOORS_RIGHT, luggageDoor([69, 18, 86, 38], [[72, 20, 76, 30], [79, 20, 83, 29]])],
      signs: [[215, 21, 218, 26]],
      emblem: [195, 33, 201, 37],
    },
    left: {
      windows: [[18, 19, 26, 30], [108, 19, 116, 30], ...range(5, 125, 19, 13), [219, 19, 227, 30]],
      doors: [...Y_DOORS_RIGHT, luggageDoor([69, 18, 86, 38], [[72, 20, 76, 29], [79, 20, 83, 30]])],
      signs: [[215, 21, 218, 26]],
      emblem: [44, 33, 50, 37],
    },
  },
  ds: {
    body: "y",
    roof: ROOF,
    endWall: "green",
    endDoor: "green",
    lampY: 1.5,
    bay: true,
    vents: Y_VENTS,
    underframe: [...LUGGAGE_UNDERFRAME, [[15.7, 0.4], [18.4, 0.4], [18.4, 0.9], [15.7, 0.9]]],
    right: {
      windows: [[18, 19, 26, 30], [108, 19, 116, 30], [129, 19, 137, 30], [204, 19, 212, 30]],
      doors: [
        endDoor([5, 18, 15, 38], [8, 20, 13, 29]),
        luggageDoor([69, 18, 86, 38], [[72, 20, 76, 29], [79, 20, 83, 30]]),
        luggageDoor([159, 18, 176, 38], [[162, 20, 166, 29], [169, 20, 173, 30]]),
        endDoor([228, 18, 239, 38], [232, 20, 236, 29], "bands"),
      ],
      signs: [],
      emblem: [44, 33, 50, 37],
    },
    // the native z_inc is drawn about two pixels toward x = 0 against z_dec
    left: {
      windows: [F([16, 19, 24, 30]), [106, 19, 114, 30], [127, 19, 135, 30], [202, 19, 210, 30], [230, 20, 234, 29]],
      doors: [
        endDoor([3, 18, 13, 38], [6, 20, 11, 29]),
        luggageDoor([68, 18, 84, 38], [[70, 20, 74, 30], [77, 20, 81, 29]]),
        luggageDoor([158, 18, 174, 38], [[160, 20, 164, 30], [167, 20, 171, 29]]),
      ],
      signs: [],
      emblem: [193, 33, 199, 37],
    },
  },
  bdmeer: {
    body: "bdmeer",
    roof: ROOF,
    endWall: "green",
    endDoor: "green",
    lampY: 1.5,
    vents: [[3.4, 4.0], [7.7, 8.3], [15.0, 15.6], [18.3, 18.9], [22.1, 22.7]],
    underframe: [
      [[7.0, 0.5], [8.5, 0.5], [8.5, 0.9], [7.0, 0.9]],
      [[11.3, 0.6], [11.8, 0.4], [12.7, 0.4], [12.9, 0.5], [12.9, 0.9], [11.3, 0.9]],
      [[13.4, 0.4], [18.5, 0.4], [18.5, 0.9], [13.4, 0.9]],
    ],
    right: {
      windows: [[25, 19, 38, 30], [44, 19, 57, 30], ...range(6, 112, 19, 13), [226, 19, 239, 30]],
      doors: [endDoor([4, 19, 14, 44], [8, 20, 13, 30]), luggageDoor([69, 18, 86, 38], [[72, 20, 76, 29], [79, 20, 83, 30]]), endDoor([249, 19, 259, 44], [251, 20, 256, 30])],
      signs: [[221, 21, 224, 26]],
      emblem: [44, 33, 50, 37],
    },
    left: {
      windows: [[25, 19, 38, 30], [44, 19, 57, 30], ...range(6, 112, 19, 13), [226, 19, 239, 30]],
      doors: [endDoor([5, 19, 15, 44], [8, 20, 13, 30]), luggageDoor([69, 18, 86, 38], [[72, 20, 76, 29], [79, 20, 83, 30]]), endDoor([249, 19, 259, 44], [251, 20, 256, 30])],
      signs: [[221, 21, 224, 26]],
      emblem: [214, 33, 220, 37],
    },
  },
  bdmtee: {
    body: "bdmtee",
    roof: ROOF,
    endWall: "green",
    endDoor: "green",
    lampY: 2.7,
    vents: [[0.8, 1.5], [3.9, 4.5], [9.7, 10.3], [12.9, 13.5], [16.1, 16.7], [21.9, 22.5], [25.0, 25.6]],
    underframe: [
      [[8.9, 0.4], [11, 0.4], [11, 0.9], [8.9, 0.9]],
      [[12.2, 0.7], [12.5, 0.4], [15.5, 0.4], [15.5, 0.9], [12.2, 0.9]],
      [[15.8, 0.4], [16.9, 0.4], [16.9, 0.9], [15.8, 0.9]],
    ],
    right: {
      windows: [
        ...range(3, 6, 15, 12, 20), F([53, 20, 60, 30]), ...range(6, 86, 16, 12, 20), [203, 20, 210, 30], ...range(3, 216, 15, 12, 20),
      ],
      doors: [
        { box: [63, 18, 83, 44], glass: [[66, 21, 70, 30], [77, 21, 81, 30]], paint: "green" },
        { box: [181, 18, 201, 44], glass: [[184, 21, 188, 30], [195, 21, 199, 30]], paint: "green" },
      ],
      signs: [[49, 21, 52, 26], [212, 21, 215, 26]],
      emblem: [16, 34, 22, 38],
    },
    left: {
      windows: [
        ...range(3, 6, 15, 12, 20), [54, 20, 61, 30], ...range(6, 86, 16, 12, 20), F([204, 20, 211, 30]), ...range(3, 216, 15, 12, 20),
      ],
      doors: [
        { box: [63, 18, 83, 44], glass: [[65, 21, 69, 30], [76, 21, 80, 30]], paint: "green" },
        { box: [181, 18, 201, 44], glass: [[183, 21, 187, 30], [194, 21, 198, 30]], paint: "green" },
      ],
      signs: [[49, 21, 52, 26], [212, 21, 215, 26]],
      emblem: [242, 34, 248, 38],
    },
  },
};

/** The XML bodies: length over buffers, section, plan, elevation top, bogie centres. */
const BODIES = {
  y: {
    length: 24.5,
    section: Y_SECTION,
    plan: [[0.2, 1.4], [1.6, 1.5], [22.9, 1.5], [24.3, 1.4]] as Pt[],
    top: [[0.2, 4.0], [0.4, 4.2], [24.1, 4.2], [24.3, 4.0]] as Pt[],
    bogies: [3.7, 20.8],
  },
  bdmeer: {
    length: 26.4,
    section: [[1.5, 0.9], [-1.5, 0.9], [-1.5, 3.2], [-1.3, 3.6], [-1, 3.8], [-0.7, 3.9], [0, 4], [0.7, 3.9], [1, 3.8], [1.3, 3.6], [1.5, 3.2]] as Pt[],
    plan: [[0.2, 1.4], [1.6, 1.5], [24.8, 1.5], [26.2, 1.4]] as Pt[],
    top: [[0.2, 3.8], [0.4, 4.0], [26.0, 4.0], [26.2, 3.8]] as Pt[],
    bogies: [3.7, 22.7],
  },
  bdmtee: {
    length: 26.4,
    section: [[1.5, 0.9], [-1.5, 0.9], [-1.5, 3.2], [-1.3, 3.6], [-1, 3.8], [-0.7, 3.9], [0, 4], [0.7, 3.9], [1, 3.8], [1.3, 3.6], [1.5, 3.2]] as Pt[],
    plan: [[0.2, 1.4], [0.3, 1.5], [26.1, 1.5], [26.2, 1.4]] as Pt[],
    top: [[0.2, 3.9], [0.3, 4.0], [26.1, 4.0], [26.2, 3.9]] as Pt[],
    bogies: [3.7, 22.7],
  },
} as const;

/** The CD emblem's width at height 1. */
const EMBLEM_W = ((us: number[]) => Math.max(...us) - Math.min(...us))(emblem(0, 0, 1, false).map((q) => q[0]));

/** One CD green and white coach (vlakosimdb cd_<variant>). */
export function cdGreenWhiteCoach(params?: ParamValues): MeshBuilder {
  const variant = resolveParams(GREEN_WHITE_PARAMS, params).variant as GreenWhiteVariant;
  const v = VARIANTS[variant];
  const geo = BODIES[v.body];
  const H = 5;
  const palette: Record<string, MaterialSpec> = {
    green: { color: variant === "ab" ? "#1f701f" : "#0d7a1a", roughness: 0.55 },
    white: { color: "#e9eee9", roughness: 0.55 },
    roof: { color: v.roof, roughness: 0.7 },
    yellow: { color: "#d6cf1c", roughness: 0.5 },
    red: { color: "#c42a20", roughness: 0.5 },
    frame: { color: "#b0b0b0", metallic: 0.2, roughness: 0.45 },
    classMark: { color: "#f2f4f2", roughness: 0.5 },
    marking: { color: "#1b1d1c", roughness: 0.6 },
  };
  const c = new Coach(palette, geo.length / 2);
  const m = c.m;
  const top = geo.top.map(([x, y]): Pt => [x, y]);
  const body: Volume = {
    name: "body",
    section: geo.section.map(([z, y]): Pt => [z, y]),
    plan: geo.plan.map(([x, y]): Pt => [x, y]),
    top,
    bands: [[0.9, 1.9, "white"], [1.9, 3.2, "green"], [3.2, Math.max(...top.map((p) => p[1])) + 0.1, "roof"]],
    ...(v.endWall === "green" ? { endPaint: "green" } : {}),
  };
  // the XML bay reaches 1.6 m from the centreline; 1.525 m keeps it and its
  // glass inside the 3.1 m width envelope (as the CSD Dsk's duckets)
  const bay: Volume = {
    name: "bay",
    section: [[1.525, 2.1], [-1.525, 2.1], [-1.525, 3.1], [1.525, 3.1]],
    plan: [[3.2, 1.5], [3.5, 1.525], [4.1, 1.525], [4.4, 1.5]],
    bands: [[2.1, 3.1, "green"]],
  };
  const wall = [geo.plan[0]![0], geo.plan[geo.plan.length - 1]![0]] as const;
  m.scope("body", () => {
    c.volume(body);
    if (v.bay) m.scope("lookout bay", () => c.volume(bay));
    for (const s of sides)
      m.scope(sideName(s), () => {
        const spec = s > 0 ? v.right : v.left;
        spec.windows.forEach((w, i) => {
          const [b, glass] = typeof w[0] === "number" ? [w as PxBox, "glass"] : [(w as [PxBox, string])[0], "frosted"];
          const box = px(b, H);
          m.scope(`window ${i + 1}`, () => c.window(body, s, box, { fw: 0.07, glass, sash: box.x1 - box.x0 > 1 ? 2.5 : undefined }));
        });
        spec.doors.forEach((d, i) =>
          m.scope(`door ${i + 1}`, () => {
            const b = px(d.box, H);
            c.door(body, s, b, d.paint);
            d.glass.forEach((g, k) => m.scope(`window ${k + 1}`, () => c.window(body, s, px(g, H), { fw: 0.04 })));
            // a double door's two leaves meet in the middle
            const mid = (b.x0 + b.x1) / 2;
            if (d.glass.length === 2) m.scope("centre seam", () => c.sidePanel(body, "seam", s, { x0: mid - 0.02, y0: Math.max(b.y0, 0.9) + 0.03, x1: mid + 0.02, y1: b.y1 - 0.03 }, 0.016));
          }),
        );
        // the white class numeral over each 3 by 5 pixel mark, centred in its box
        if (spec.signs.length)
          m.scope("class marks", () =>
            spec.signs.forEach((p) => {
              const b = px(p, H);
              c.numeral(body, s, variant === "a" ? "1" : "2", (b.x0 + b.x1) / 2, b.y0 + 0.02, b.y1 - b.y0 - 0.04, 0.004, "classMark");
            }),
          );
        if (v.bay)
          m.scope("lookout bay", () =>
            ([[33, 20, 35, 28], [36, 20, 40, 28], [41, 20, 43, 28]] as PxBox[]).forEach((b, i) =>
              m.scope(`window ${i + 1}`, () => c.window(bay, s, px(b, H), { fw: 0.04 })),
            ),
          );
        if (v.yellow) m.scope("first class line", () => c.sidePanel(body, "yellow", s, { x0: v.yellow![0] / 10 + 0.005, y0: 3.1, x1: v.yellow![1] / 10 - 0.005, y1: 3.2 }, 0.004, 0.004));
        if (v.classMarks)
          m.scope("class marks", () => {
            for (const [text, x] of v.classMarks!) c.numeral(body, s, text, x, 2.25, 0.62, 0.004, "yellow");
          });
        // beside the end doors (native columns 15 and 230), at the very ends where
        // the doors are (Beel, BDmeer) or none are (Bdmtee): columns 3 and 261
        m.scope("handrails", () => {
          const atEnds = variant === "beel" || v.body !== "y";
          for (const x of atEnds ? [wall[0] + 0.15, wall[1] - 0.15] : [wall[0] + 1.37, wall[1] - 1.43])
            c.handrail(body, s, x, v.body === "bdmtee" ? 1.5 : 1.3, v.body === "bdmtee" ? 2.4 : 2.05);
        });
        m.scope("emblem", () => {
          const b = px(spec.emblem, H);
          const h = 0.36;
          const w = EMBLEM_W * h;
          const x0 = (b.x0 + b.x1) / 2 - w / 2;
          // read left to right from outside: toward +x on the +z side, toward -x on the -z side
          const u0 = s > 0 ? c.X(x0) : c.X(x0 + w);
          m.facets("marking", emblem(u0, (b.y0 + b.y1) / 2 - h / 2, h, s < 0).map(([u, vv]): Vec3 => [u, vv, s * 1.506]), [0, 0, s]);
        });
        m.scope("running number", () => c.inscription(body, s, geo.length / 2, [{ text: GREEN_WHITE_NUMBERS[variant].number, y: 1.5, h: 0.1 }], 0.006));
      });
  });
  for (const e of [-1, 1])
    m.scope(endName(e), () => {
      const w = e > 0 ? wall[1] : wall[0];
      const head = e > 0 ? geo.length : 0;
      const fb = (b: PxBox) => (e > 0 ? mirror(fpx(b, H)) : fpx(b, H));
      m.scope("gangway", () => gangway(c, e, w, head + -e * 0.01, H));
      m.scope("end door", () => {
        c.door(body, e, fb([9, 19, 21, 37]), v.endDoor, { end: true });
        for (const [k, b] of ([[10, 20, 13, 29], [17, 20, 20, 29]] as PxBox[]).entries())
          m.scope(`window ${k + 1}`, () => c.window(body, e, fb(b), { end: true, fw: 0.04 }));
      });
      m.scope("tail lamps", () => {
        for (const [k, z] of [-1, 1].entries()) m.scope(`lamp ${k + 1}`, () => lamp(c, body, e, z * 1.0, v.lampY, 0.09, "lampRed"));
      });
      m.scope("headstock", () => headstock(c, e, w, 0.66, 0.92, 1.4));
      m.scope("buffers", () => c.buffers(e, head, w));
      m.scope("coupling", () => c.coupling(e, head + -e * 0.02, w));
      m.scope("steps", () => {
        // the low entrance of Beel and BDmeer (XML door2 down to 0.3 m) takes one
        // more step than the Y coaches' 0.5 m one
        const low = v.body === "bdmeer" || variant === "beel";
        const inset = low ? 0.25 : 0.2;
        const [x0, x1] = v.body === "bdmtee" ? (e > 0 ? [25.2, 25.9] : [0.3, 1.0]) : e > 0 ? [w - 1.3, w - inset] : [w + inset, w + 1.3];
        for (const s of sides) {
          for (const y of low ? [0.3, 0.55] : [0.5, 0.74]) block(m, "steel", c.X(x0), c.X(x1), y, y + 0.04, ...side(s, 1.06, 1.42));
          for (const x of [x0 + 0.03, x1 - 0.07]) block(m, "underframe", c.X(x), c.X(x + 0.04), low ? 0.26 : 0.46, 0.9, ...side(s, 1.08, 1.36));
        }
      });
    });
  // the Bdmtee's centre doors reach down to 0.6 m: a green apron under each and a step
  if (v.body === "bdmtee")
    m.scope("door aprons", () => {
      for (const [a, b] of [[6.3, 8.3], [18.1, 20.1]]) {
        block(m, "green", c.X(a + 0.02), c.X(b - 0.02), 0.58, 0.92, -1.49, 1.49);
        for (const s of sides) block(m, "steel", c.X(a + 0.05), c.X(b - 0.05), 0.42, 0.47, ...side(s, 1.2, 1.46));
      }
    });
  m.scope("underframe", () => {
    block(m, "underframe", c.X(1.0), c.X(geo.length - 1.0), 0.72, 0.9, -1.2, 1.2);
    for (const poly of v.underframe) c.sideSweep("underframe", poly, -1.15, 1.15);
  });
  m.scope("running gear", () =>
    geo.bogies.forEach((x, i) => m.scope(`bogie ${i + 1}`, () => c.bogie(x, 2.5, 0.45, 0.9))),
  );
  m.scope("roof equipment", () => {
    // the Beel's two over the x = 0 end are its air-conditioning units (XML roof and gear 0.6..2.2)
    roofVents(c, v.vents, Math.max(...top.map((p) => p[1])) - 0.1, Math.max(...top.map((p) => p[1])) + (variant === "beel" ? 0.1 : 0.07), 0.3, "steel");
  });
  return m;
}
