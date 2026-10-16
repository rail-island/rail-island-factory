// The 26.4 m UIC-Z (Eurofima-type) coaches: vlakosimdb cd_ampz, cd_bmz and
// cd_wrrmz as one design with a `variant` parameter - the 1st class coach, the
// 2nd class coach and the dining car - so the operators that run the same body
// can come in as an `operator` parameter (cd, the default, then db and obb: the
// vlakosimdb db_ic_ampz/bmpz/wrmz and obb_ampz/bmpz/wrmz) without renaming
// anything: each operator lists its own spec for each kind of coach. The body
// follows the XML: a flatter roof than the UIC-Y coaches, ends rounded at the
// roof and at the floor, a skirt between the bogies, plug doors at the ends.
// Windows, doors and paint follow boxes measured on the native BMPs (side
// canvases 27 x 4 m, assets/uic-z-coach/native/<key>/landmarks.json) at 0.1 m
// a pixel; the builder is liveryCoach.ts. See docs/models/czsk-coaches.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { PxBox } from "./csdCoaches.ts";
import { buildLiveryCoach, type BodyGeo, type DoorSpec, type EndSpec, type LiveryCoachSpec, type LiverySide, type Paint, type Win } from "./liveryCoach.ts";

/** The kind of coach: the same three kinds every operator of the body runs. */
export type UicZVariant = "firstClass" | "secondClass" | "restaurant";
/** The operators whose liveries are modelled (the db and obb liveries are to follow). */
export type UicZOperator = "cd";

export const UIC_Z_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "secondClass",
    values: [
      { value: "firstClass", title: "1st class (CD Ampz)" },
      { value: "secondClass", title: "2nd class (CD Bmz)" },
      { value: "restaurant", title: "Dining car (CD WRRmz)" },
    ],
  },
];

/** The running number of each coach (UIC, with its check digit), and where it came from. */
export const UIC_Z_NUMBERS: Record<UicZOperator, Record<UicZVariant, { number: string; source: string }>> = {
  cd: {
    firstClass: { number: "73 54 10-91 008-8", source: "the CD Ampz 73 54 10-91 008-8 of a Wikimedia Commons file title (EC 176, Praha hl.n., 2005)" },
    secondClass: { number: "73 54 21-91 026-7", source: "the CD Bmz245 21-91 026 of a Wikimedia Commons file title; check digit computed" },
    restaurant: { number: "73 54 88-91 003-6", source: "illustrative, CD WRmz 88-91 series; no legible photograph of the red livery" },
  },
};

/** The XML body: 26.4 m (the dining car 26.9 m) over buffers, rounded at the roof and floor ends. */
function body(length: number): BodyGeo {
  const e = length - 0.2;
  return {
    length,
    section: [[1.5, 0.9], [-1.5, 0.9], [-1.5, 3.2], [-1.3, 3.6], [-1, 3.8], [-0.3, 4], [0.3, 4], [1, 3.8], [1.3, 3.6], [1.5, 3.2]],
    plan: [[0.2, 1.4], [1.5, 1.5], [e - 1.3, 1.5], [e, 1.4]],
    top: [[0.2, 3.6], [0.4, 4.0], [e - 0.2, 4.0], [e, 3.6]],
    bottom: [[0.2, 1.2], [0.4, 0.9], [e - 0.2, 0.9], [e, 1.2]],
    // GP200-type bogies 19.0 m apart (19.5 m under the longer dining car)
    bogies: length > 26.5 ? [3.7, 23.2] : [3.7, 22.7],
    canvas: 4,
  };
}

/** The end BMP (30 by 40 px): the gangway, the red end door with two windows, tail lamps at 2.2 m. */
const Z_END: EndSpec = { gangway: [7, 7, 23, 29], door: [9, 9, 21, 24], doorWindows: [[10, 11, 13, 18], [17, 11, 20, 18]], lampY: 2.2, lampZ: 1.0 };

const F = (b: PxBox): Win => [b, "frosted"];
const frame = (x: number, w: number): PxBox => [x, 10, x + w, 20];
const door = (box: PxBox, glass: PxBox): DoorSpec => ({ box, glass: [glass], paint: "red" });

const CD_PALETTE: Record<string, MaterialSpec> = {
  red: { color: "#f01010", roughness: 0.5 },
  light: { color: "#e0e0e0", roughness: 0.55 },
  roof: { color: "#959295", roughness: 0.7 },
  skirt: { color: "#525152", roughness: 0.8 },
  endGrey: { color: "#909090", roughness: 0.6 },
  yellow: { color: "#f6f600", roughness: 0.5 },
  grille: { color: "#b2b2b2", roughness: 0.6 },
  plate: { color: "#f4f4f4", roughness: 0.5 },
  marking: { color: "#1c1c1c", roughness: 0.6 },
};

function cdSpec(variant: UicZVariant): LiveryCoachSpec {
  const number = UIC_Z_NUMBERS.cd[variant].number;
  const common = {
    palette: CD_PALETTE,
    bands: [[0.9, 1.9, "light"], [1.9, 3.2, "red"], [3.2, 4.1, "roof"]] as Array<[number, number, string]>,
    endPaint: "endGrey",
    endDoor: "red",
    end: Z_END,
    emblem: { kind: "cd" as const, mat: "marking" },
    number,
    numberMat: "marking",
    numberY: 1.25,
    vents: [] as Array<[number, number]>,
    ventMat: "steel",
    underframe: [] as Pt[][],
    steps: "plug" as const,
    handrails: [] as Array<[number, number, number]>,
  };
  if (variant === "restaurant") {
    // one plug door at the x = 0 end; the white diagonal across the red band
    // carries on below it as a red stripe
    const paint: Paint[] = [
      { poly: [[211, 8], [222, 8], [213.5, 21], [204.5, 21]], mat: "light" },
      { poly: [[214.5, 21], [226, 21], [221, 31], [209.5, 31]], mat: "red" },
    ];
    const first = [25, 44, 63, 82, 101].map((x) => frame(x, 16));
    const right: LiverySide = {
      windows: [...first, [136, 10, 152, 19], [162, 10, 178, 19], [188, 10, 204, 19], frame(221, 16)],
      doors: [door([6, 8, 15, 35], [8, 11, 14, 20])],
      paint,
      signs: [{ box: [20, 11, 24, 17], text: "1", mat: "red", plate: "plate" }],
      emblem: [46, 23, 52, 27],
      numberAt: 135,
    };
    const left: LiverySide = { ...right, windows: [...first, [124, 10, 134, 20], [142, 10, 152, 19], [168, 10, 178, 19], [193, 10, 203, 19], frame(221, 16)], emblem: [183, 23, 189, 27] };
    return { ...common, body: body(26.9), skirt: { x0: 5.2, x1: 21.5, mat: "skirt" }, roofBoxes: [[15.5, 16.4, 0.3, 0.12]], entrances: { rear: true, front: false }, right, left };
  }
  const doors = [door([5, 8, 14, 35], [7, 11, 13, 20]), door([249, 8, 258, 35], [251, 11, 257, 20])];
  const grilles: Paint[] = [{ box: [16, 23, 27, 28], mat: "grille" }, { box: [233, 23, 244, 28], mat: "grille" }];
  if (variant === "firstClass") {
    const mid = [48, 67, 86, 105].map((x) => frame(x, 15));
    const side = (sign2: PxBox, rest: number[], emblem: PxBox): LiverySide => ({
      windows: [F([17, 10, 25, 20]), frame(29, 15), ...mid, ...rest.map((x) => frame(x, 15)), frame(220, 15), F([239, 10, 247, 20])],
      doors,
      paint: [{ box: [15, 8, 249, 9], mat: "yellow" }, ...grilles],
      signs: [{ box: [25, 11, 29, 17], text: "1", mat: "red", plate: "plate" }, { box: sign2, text: "1", mat: "red", plate: "plate" }],
      emblem,
      numberAt: 135,
    });
    return {
      ...common,
      body: body(26.4),
      skirt: { x0: 5.1, x1: 21.3, mat: "skirt" },
      entrances: { rear: true, front: true },
      right: side([236, 11, 239, 17], [125, 144, 163, 182, 201], [62, 23, 68, 27]),
      left: side([235, 11, 239, 17], [124, 144, 163, 182, 201], [196, 23, 202, 27]),
    };
  }
  const side = (xs: number[], frosted: boolean, emblem: PxBox): LiverySide => ({
    windows: [frosted ? F([18, 10, 26, 20]) : [18, 10, 26, 20], ...xs.map((x) => frame(x, 13)), frosted ? F([238, 10, 246, 20]) : [238, 10, 246, 20]],
    doors,
    paint: grilles,
    signs: [{ box: [26, 11, 30, 17], text: "2", mat: "red", plate: "plate" }, { box: [234, 11, 238, 17], text: "2", mat: "red", plate: "plate" }],
    emblem,
    numberAt: 135,
  });
  return {
    ...common,
    body: body(26.4),
    skirt: { x0: 5.1, x1: 21.3, mat: "skirt" },
    entrances: { rear: true, front: true },
    right: side([31, 50, 69, 88, 107, 126, 145, 164, 183, 201, 220], true, [62, 23, 68, 27]),
    left: side([31, 50, 68, 87, 106, 125, 144, 163, 182, 201, 220], false, [196, 23, 202, 27]),
  };
}

/** One UIC-Z coach. */
export function uicZCoach(params?: ParamValues): MeshBuilder {
  const variant = resolveParams(UIC_Z_PARAMS, params).variant as UicZVariant;
  return buildLiveryCoach(cdSpec(variant));
}
