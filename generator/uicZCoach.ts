// The 26.4 m UIC-Z (Eurofima-type) coaches: vlakosimdb's CD Ampz, Bmz and
// WRRmz, DB IC Ampz, Bmpz and WRmz and OBB Ampz, Bmpz and WRmz as one design
// with two parameters - `variant`, the kind of coach (the 1st class coach, the
// 2nd class coach, the dining car), and `operator` (cd, the default, db, obb),
// whose livery and layout it carries: each operator lists its own spec for each
// kind of coach. The body follows the CD XML (the DB and OBB files draw the same
// envelope more coarsely): a flatter roof than the UIC-Y coaches, ends rounded
// at the roof and at the floor, a skirt between the bogies, doors at the ends.
// Windows, doors and paint follow boxes measured on the native BMPs (side
// canvases 27 x 4 m, assets/uic-z-coach/native/<key>/landmarks.json) at 0.1 m
// a pixel; the builder is liveryCoach.ts. See docs/models/czsk-coaches.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { PxBox } from "./csdCoaches.ts";
import { liveryCoachLod } from "./lodTrams.ts";
import { buildLiveryCoach, type BodyGeo, type DoorSpec, type EndSpec, type LiveryCoachSpec, type LiverySide, type Paint, type Win } from "./liveryCoach.ts";

/** The kind of coach: the same three kinds every operator of the body runs. */
export type UicZVariant = "firstClass" | "secondClass" | "restaurant";
/** The operators whose liveries are modelled: CD (the default), DB IC, OBB. */
export type UicZOperator = "cd" | "db" | "obb";

export const UIC_Z_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "secondClass",
    values: [
      { value: "firstClass", title: "1st class" },
      { value: "secondClass", title: "2nd class" },
      { value: "restaurant", title: "Dining car" },
    ],
  },
  {
    name: "operator",
    title: "Operator",
    default: "cd",
    values: [
      { value: "cd", title: "CD" },
      { value: "db", title: "DB" },
      { value: "obb", title: "OBB" },
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
  db: {
    firstClass: { number: "61 80 19-91 164-2", source: "illustrative, DB Avmz 19-91 series (the photographed Avmz's serial, its check digit not legible)" },
    secondClass: { number: "61 80 22-94 512-4", source: "illustrative, DB Bpmz 22-94 series" },
    restaurant: { number: "61 80 88-91 105-1", source: "illustrative, DB WRmz 88-91 series" },
  },
  obb: {
    firstClass: { number: "73 81 19-70 104-8", source: "illustrative, OBB Ampz 19-70 series" },
    secondClass: { number: "73 81 21-91 111-4", source: "the OBB Bmz 73 81 21-91 111-4 of a Wikimedia Commons file title (Brugg, 2018)" },
    restaurant: { number: "61 81 88-90 203-4", source: "the OBB WRmz 61 81 88-90 203-4 of a Wikimedia Commons file title (Bregenz, 2003)" },
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
/** An entrance door's plug leaf, stepping out and sliding toward the coach's nearer end (doors.ts). */
const plugDoor = (box: PxBox): DoorSpec["opens"] => ({ kind: "plug", leaves: 1, toward: box[0] < 130 ? "low" : "high" });
const door = (box: PxBox, glass: PxBox): DoorSpec => ({ box, glass: [glass], paint: "red", opens: plugDoor(box) });

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

// The DB IC and OBB coaches share the end BMP of the CD ones (the gangway, the
// red end door with two windows, tail lamps at 2.2 m); their side doors reach
// from the window band's top down to 0.6 m, over the steps in the skirt recess.
const dbDoor = (box: PxBox, glass: PxBox): DoorSpec => ({ box, glass: [glass], paint: [[0.5, 0.9, "doorGrey"], [0.9, 1.3, "white"], [1.3, 1.6, "red"], [1.6, 3.4, "white"]], opens: plugDoor(box) });
const obbDoor = (box: PxBox, glass: PxBox): DoorSpec => ({ box, glass: [glass], paint: [[0.5, 1.9, "red"], [1.9, 3.1, "grey"], [3.1, 3.4, "red"]], opens: plugDoor(box) });

const DB_PALETTE: Record<string, MaterialSpec> = {
  white: { color: "#f2f2f2", roughness: 0.5 },
  red: { color: "#ec0016", roughness: 0.5 },
  roof: { color: "#8f9192", roughness: 0.7 },
  skirt: { color: "#5f6264", roughness: 0.8 },
  doorGrey: { color: "#6a6c6e", roughness: 0.7 },
  frame: { color: "#e6e6e6", metallic: 0.1, roughness: 0.5 },
  plate: { color: "#fafafa", roughness: 0.5 },
  marking: { color: "#3a3a3a", roughness: 0.6 },
};

const OBB_PALETTE: Record<string, MaterialSpec> = {
  red: { color: "#ef0e14", roughness: 0.5 },
  grey: { color: "#404040", roughness: 0.55 },
  roof: { color: "#8a8a8a", roughness: 0.7 },
  skirt: { color: "#363636", roughness: 0.8 },
  frame: { color: "#909090", metallic: 0.2, roughness: 0.5 },
  white: { color: "#f4f4f4", roughness: 0.5 },
  yellow: { color: "#f6e600", roughness: 0.5 },
  blue: { color: "#2a3ed0", roughness: 0.5 },
};

/** The DB IC coaches (vlakosimdb db_ic_ampz, db_ic_bmpz, db_ic_wrmz): white, the red stripe at 1.3..1.6 m. */
function dbSpec(variant: UicZVariant): LiveryCoachSpec {
  const common = {
    palette: DB_PALETTE,
    bands: [[0.9, 1.3, "white"], [1.3, 1.6, "red"], [1.6, 3.3, "white"], [3.3, 4.1, "roof"]] as Array<[number, number, string]>,
    endPaint: "white",
    endDoor: "red",
    end: Z_END,
    emblem: { kind: "db" as const, mat: "red", plate: "plate" },
    number: UIC_Z_NUMBERS.db[variant].number,
    numberMat: "marking",
    numberY: 0.95,
    vents: [] as Array<[number, number]>,
    ventMat: "steel",
    underframe: [] as Pt[][],
    steps: "plug" as const,
    handrails: [] as Array<[number, number, number]>,
  };
  if (variant === "restaurant") {
    // one passenger door per side, at opposite ends, and the kitchen's service
    // door (seams only) across from it; "Bordrestaurant" on a white gap in the stripe
    const right: LiverySide = {
      windows: [...[17, 35, 53, 71, 89, 107, 125, 145, 165].map((x) => frame(x, 15)), [185, 10, 199.6, 20], [200.4, 10, 215, 20], frame(220, 15), [256, 10, 265, 20]],
      doors: [dbDoor([5, 9, 14, 34], [7, 11, 12, 20])],
      seams: [[241, 9, 251, 29]],
      paint: [{ box: [101, 24, 131, 27], mat: "white" }],
      emblem: [30, 24, 36, 27],
      numberAt: 175,
    };
    const left: LiverySide = {
      windows: [72, 92, 112, 132, 183, 201, 219, 237].map((x) => frame(x, 15)),
      doors: [dbDoor([255, 9, 264, 34], [257, 11, 262, 20])],
      seams: [[19, 9, 29, 29]],
      paint: [{ box: [152, 24, 182, 27], mat: "white" }],
      emblem: [36, 24, 42, 27],
      numberAt: 95,
    };
    return { ...common, body: body(26.9), skirt: { x0: 5.2, x1: 21.5, mat: "skirt" }, roofBoxes: [[20.5, 22.0, 0.6, 0.12], [23.2, 24.7, 0.6, 0.12]], entrances: { rear: true, front: true }, right, left };
  }
  const first = variant === "firstClass";
  const doors = [dbDoor([5, 9, 14, 34], [7, 11, first ? 13 : 12, 20]), dbDoor([250, 9, 259, 34], [first ? 251 : 252, 11, 257, 20])];
  // the class numeral on a plate beside each toilet
  const sign = (x: number, text: string) => ({ box: [x, 11, x + 4, 16] as PxBox, text, mat: "marking", plate: "plate" });
  if (first) {
    // the toilets' windows frosted (the Avmz photograph; the BMP draws them
    // clear); the stripe breaks for a white panel near the middle
    const side = (xs: number[], gap: PxBox, emblem: PxBox, numberAt: number): LiverySide => ({
      windows: [F([18, 10, 26, 20]), ...xs.map((x) => frame(x, 15)), F([238, 10, 246, 20])],
      doors,
      paint: [{ box: gap, mat: "white" }],
      signs: [sign(27, "1"), sign(233, "1")],
      emblem,
      numberAt,
    });
    return {
      ...common,
      body: body(26.4),
      skirt: { x0: 5.1, x1: 21.3, mat: "skirt" },
      entrances: { rear: true, front: true },
      right: side([33, 56, 79, 102, 125, 148, 171, 194, 217], [137, 24, 152, 27], [232, 24, 238, 27], 175),
      left: side([32, 55, 78, 101, 124, 147, 170, 193, 216], [112, 24, 127, 27], [26, 24, 32, 27], 95),
    };
  }
  const side = (xs: number[], ends: [PxBox, PxBox], signs: [number, number], emblem: PxBox, numberAt: number): LiverySide => ({
    windows: [F([16, 10, 25, 20]), ends[0], ...xs.map((x) => frame(x, 15)), ends[1], F([239, 10, 248, 20])],
    doors,
    signs: [sign(signs[0], "2"), sign(signs[1], "2")],
    emblem,
    numberAt,
  });
  return {
    ...common,
    body: body(26.4),
    skirt: { x0: 5.1, x1: 21.3, mat: "skirt" },
    entrances: { rear: true, front: true },
    right: side([49, 68, 87, 106, 125, 144, 163, 182, 201], [[35, 10, 45, 20], [220, 10, 230, 20]], [29, 232], [231, 24, 237, 27], 175),
    left: side([48, 67, 86, 105, 124, 143, 162, 181, 200], [[34, 10, 44, 20], [219, 10, 229, 20]], [28, 231], [27, 24, 33, 27], 95),
  };
}

/** The OBB coaches (vlakosimdb obb_ampz, obb_bmpz, obb_wrmz): a dark grey window band between red. */
function obbSpec(variant: UicZVariant): LiveryCoachSpec {
  const common = {
    palette: OBB_PALETTE,
    bands: [[0.9, 1.9, "red"], [1.9, 3.1, "grey"], [3.1, 3.4, "red"], [3.4, 4.1, "roof"]] as Array<[number, number, string]>,
    endPaint: "red",
    endDoor: "red",
    end: Z_END,
    emblem: { kind: "obb" as const, mat: "white" },
    number: UIC_Z_NUMBERS.obb[variant].number,
    numberMat: "white",
    numberY: 1.32,
    vents: [] as Array<[number, number]>,
    ventMat: "steel",
    underframe: [] as Pt[][],
    steps: "plug" as const,
    handrails: [] as Array<[number, number, number]>,
  };
  const front = obbDoor([249, 8, 259, 33], [252, 11, 257, 20]);
  if (variant === "restaurant") {
    // one door, at the front end; the kitchen's lower windows at the rear and
    // a blue pictogram beside the door
    const right: LiverySide = {
      windows: [[22, 10, 35, 18], [49, 10, 59, 18], [81, 10, 90, 18], [95, 10, 104, 20], ...[113, 132, 151, 170, 189, 208, 227].map((x) => frame(x, 15))],
      doors: [front],
      paint: [{ box: [243, 10, 248, 15], mat: "blue" }, { box: [245, 18, 247, 20], mat: "blue" }],
      emblem: [214, 24, 220, 28],
      numberAt: 136,
    };
    const left: LiverySide = {
      windows: [[22, 10, 35, 19], [48, 10, 61, 19], [74, 10, 87, 19], ...[114, 133, 152, 171, 190, 209].map((x) => frame(x, 15)), [233, 10, 242, 20]],
      doors: [front],
      paint: [{ box: [226, 10, 231, 15], mat: "blue" }, { box: [228, 18, 230, 20], mat: "blue" }],
      emblem: [39, 24, 45, 28],
      numberAt: 128,
    };
    return { ...common, body: body(26.4), skirt: { x0: 5.1, x1: 21.3, mat: "skirt" }, entrances: { rear: false, front: true }, right, left };
  }
  if (variant === "firstClass") {
    const doors = [obbDoor([5, 8, 15, 33], [7, 11, 13, 20]), obbDoor([249, 8, 259, 33], [251, 11, 257, 20])];
    // the yellow first class line along the top of the window band
    const side = (xs: number[], signs: [number, number], line: PxBox, emblem: PxBox, numberAt: number): LiverySide => ({
      windows: [F([18, 10, 26, 20]), ...xs.map((x) => frame(x, 15)), F([238, 10, 246, 20])],
      doors,
      paint: [{ box: line, mat: "yellow" }],
      signs: signs.map((x) => ({ box: [x, 10, x + 2, 15] as PxBox, text: "1", mat: "white" })),
      emblem,
      numberAt,
    });
    return {
      ...common,
      body: body(26.4),
      skirt: { x0: 5.1, x1: 21.3, mat: "skirt" },
      entrances: { rear: true, front: true },
      right: side([32, 55, 78, 101, 124, 147, 170, 193, 216], [50, 211], [29, 8, 234, 9], [197, 24, 203, 28], 136),
      left: side([33, 56, 79, 102, 125, 148, 171, 194, 217], [51, 212], [30, 8, 235, 9], [61, 24, 67, 28], 128),
    };
  }
  const doors = [obbDoor([5, 8, 15, 33], [7, 11, 12, 20]), front];
  // a white "2" over a small flag pictogram beside each toilet
  const side = (signs: [number, number], emblem: PxBox, numberAt: number): LiverySide => ({
    windows: [F([17, 10, 26, 20]), ...[40, 59, 78, 97, 116, 135, 154, 173, 192, 211].map((x) => frame(x, 13)), F([238, 10, 247, 20])],
    doors,
    paint: [{ box: [30, 18, 36, 20], mat: "blue" }, { box: [228, 18, 234, 20], mat: "blue" }],
    signs: signs.map((x) => ({ box: [x, 10, x + 3, 15] as PxBox, text: "2", mat: "white" })),
    emblem,
    numberAt,
  });
  return {
    ...common,
    body: body(26.4),
    skirt: { x0: 5.1, x1: 21.3, mat: "skirt" },
    entrances: { rear: true, front: true },
    right: side([32, 230], [205, 24, 211, 28], 136),
    left: side([31, 229], [53, 24, 59, 28], 128),
  };
}

const SPECS: Record<UicZOperator, (variant: UicZVariant) => LiveryCoachSpec> = { cd: cdSpec, db: dbSpec, obb: obbSpec };

/** One UIC-Z coach. */
export function uicZCoach(params?: ParamValues): MeshBuilder {
  const p = resolveParams(UIC_Z_PARAMS, params);
  return buildLiveryCoach(SPECS[p.operator as UicZOperator](p.variant as UicZVariant));
}

/** The same coach from afar (docs/models/lod.md): the livery coach adapter of lodTrams.ts. */
export function uicZCoachLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(UIC_Z_PARAMS, params);
  return liveryCoachLod(SPECS[p.operator as UicZOperator](p.variant as UicZVariant));
}
