// The ZSR (Slovak railways) coaches: eight vlakosimdb vehicles (zsr_a, zsr_ab,
// zsr_b, zsr_bh, zsr_bds, zsr_bdmeer, zsr_wrrm, zsr_apee) as the values of one
// `variant` parameter. A, AB, B, Bh, BDs and Apee share the 24.5 m UIC-Y body
// of the CD green and white coaches (cdGreenWhiteCoach.ts), BDmeer and WRRm the
// 26.4 m body of the BDmeer. Windows, doors and paint follow boxes measured on
// the native BMPs (assets/zsr-coach/native/<key>/landmarks.json) at 0.1 m a
// pixel; the builder is liveryCoach.ts. See docs/models/czsk-coaches.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import type { PxBox } from "./csdCoaches.ts";
import { BODIES, LUGGAGE_UNDERFRAME, Y_UNDERFRAME_A, Y_UNDERFRAME_B, Y_VENTS } from "./cdGreenWhiteCoach.ts";
import { liveryCoachLod } from "./lodTrams.ts";
import { buildLiveryCoach, Y_END, type BodyGeo, type DoorSpec, type LiveryCoachSpec, type LiverySide, type Paint, type Win } from "./liveryCoach.ts";

export type ZsrVariant = "a" | "ab" | "b" | "bh" | "bds" | "bdmeer" | "wrrm" | "apee";

export const ZSR_PARAMS: readonly ParamSpec[] = [
  {
    name: "variant",
    title: "Variant",
    default: "b",
    values: [
      { value: "a", title: "A" },
      { value: "ab", title: "AB" },
      { value: "b", title: "B" },
      { value: "bh", title: "Bh" },
      { value: "bds", title: "BDs" },
      { value: "bdmeer", title: "BDmeer" },
      { value: "wrrm", title: "WRRm" },
      { value: "apee", title: "Apee" },
    ],
  },
];

/** The running number of each variant (UIC, country code 56, with its check digit), and where it came from. */
export const ZSR_NUMBERS: Record<ZsrVariant, { number: string; source: string }> = {
  a: { number: "51 56 19-41 015-9", source: "illustrative, ZSR A 19-41 series; no legible photograph of the red livery" },
  ab: { number: "50 56 39-41 001-6", source: "the AB 50 56 39-41 001-6 photographed in a later ZSSK livery (photo-ab-50-56-39-41-001-6.jpg)" },
  b: { number: "51 56 20-41 816-7", source: "the B 51 56 20-41 816-7 of the ZSSK B 20-41 category on Wikimedia Commons; illustrative for the red livery" },
  bh: { number: "51 56 20-41 902-5", source: "illustrative, in the ZSR format; no photograph of the green Bh" },
  bds: { number: "51 56 82-40 110-1", source: "illustrative, ZSR BDs 82-40 series; no legible photograph" },
  bdmeer: { number: "50 56 82-44 012-6", source: "illustrative, in the ZSR format; no photograph of the type" },
  wrrm: { number: "61 56 88-70 004-1", source: "illustrative, ZSR WRRm 88-70 series; no legible photograph" },
  apee: { number: "61 56 19-70 101-9", source: "illustrative, ZSR Apee 19-70 series; no legible photograph" },
};

const F = (b: PxBox): Win => [b, "frosted"];
/**
 * A door; a passenger door opens, one leaf swinging inward on the jamb toward the
 * coach's nearer end (doors.ts) -- a luggage door stays shut.
 */
const door = (box: PxBox, glass: PxBox[], paint: DoorSpec["paint"] = "orange", passenger = true): DoorSpec => ({
  box,
  glass,
  paint,
  ...(passenger ? { opens: { kind: "swing" as const, leaves: 1 as const, from: box[0] < 130 ? ("low" as const) : ("high" as const) } } : {}),
});
const Y_DOORS = [door([5, 18, 15, 38], [[8, 20, 13, 29]]), door([230, 18, 240, 38], [[232, 20, 237, 29]])];
/** Toilet window, nine first class compartments at 2.1 m, toilet window (zsr_a, zsr_ab). */
const A_WINDOWS = (frosted: boolean): Win[] => [frosted ? F([18, 19, 26, 30]) : [18, 19, 26, 30], ...[32, 53, 74, 95, 116, 137, 158, 179, 200].map((x): PxBox => [x, 19, x + 13, 30]), frosted ? F([219, 19, 227, 30]) : [219, 19, 227, 30]];
/** Toilet window, ten second class compartments, toilet window (zsr_b, zsr_bh). */
const B_WINDOWS = (frosted: boolean): Win[] => [frosted ? F([18, 19, 26, 30]) : [18, 19, 26, 30], ...[31, 50, 69, 88, 107, 125, 144, 163, 182, 201].map((x): PxBox => [x, 19, x + 13, 30]), frosted ? F([219, 19, 227, 30]) : [219, 19, 227, 30]];

const geo = (b: "y" | "bdmeer"): BodyGeo => ({
  length: BODIES[b].length,
  section: BODIES[b].section.map(([z, y]): Pt => [z, y]),
  plan: BODIES[b].plan.map(([x, y]): Pt => [x, y]),
  top: BODIES[b].top.map(([x, y]): Pt => [x, y]),
  bogies: BODIES[b].bogies,
  canvas: 5,
});

const PALETTE: Record<string, MaterialSpec> = {
  red: { color: "#bf0f0f", roughness: 0.5 },
  darkRed: { color: "#901700", roughness: 0.5 },
  white: { color: "#fbfbfb", roughness: 0.5 },
  pink: { color: "#ffc0c0", roughness: 0.5 },
  yellow: { color: "#e0e700", roughness: 0.5 },
  orange: { color: "#ff571f", roughness: 0.5 },
  roof: { color: "#c0c0c0", roughness: 0.7 },
  plate: { color: "#f6f2f6", roughness: 0.5 },
  emblem: { color: "#fbf4f4", roughness: 0.5 },
  marking: { color: "#f2f2f2", roughness: 0.6 },
};

/**
 * The ZSR stripes: white rows 33 and 35 with a pale line between (y 1.4..1.7),
 * in the given column runs, and the dark red line at row 38 (y 1.1..1.2).
 */
function stripes(runs: Array<[number, number]>, dark: Array<[number, number]>, white = "white", pale = "pink", deep = "darkRed"): Paint[] {
  return [
    ...runs.map(([a, b]): Paint => ({ box: [a, 33, b, 36], mat: white })),
    ...runs.map(([a, b]): Paint => ({ box: [a, 34, b, 35], mat: pale, layer: 1 })),
    ...dark.map(([a, b]): Paint => ({ box: [a, 38, b, 39], mat: deep })),
  ];
}

const plates = (list: Array<[PxBox, string]>) => list.map(([box, text]) => ({ box, text, mat: "yellow", plate: "plate" }));

function ySpec(
  variant: ZsrVariant,
  sides: { right: LiverySide; left: LiverySide },
  opts: { body?: "y" | "bdmeer"; palette?: Record<string, MaterialSpec>; underframe?: Pt[][]; vents?: Array<[number, number]>; bay?: LiveryCoachSpec["bay"]; entrances?: LiveryCoachSpec["entrances"]; handrails?: LiveryCoachSpec["handrails"]; steps?: LiveryCoachSpec["steps"]; roofBoxes?: LiveryCoachSpec["roofBoxes"] } = {},
): LiveryCoachSpec {
  const body = geo(opts.body ?? "y");
  return {
    body,
    palette: { ...PALETTE, ...opts.palette },
    bands: [[0.9, 3.2, "red"], [3.2, Math.max(...body.top.map((p) => p[1])) + 0.1, "roof"]],
    endPaint: "red",
    endDoor: "red",
    end: Y_END,
    emblem: { kind: "zsr", mat: "emblem" },
    number: ZSR_NUMBERS[variant].number,
    numberMat: "marking",
    numberY: 1.25,
    ...(opts.bay ? { bay: opts.bay } : {}),
    vents: opts.vents ?? Y_VENTS,
    ventMat: "steel",
    ...(opts.roofBoxes ? { roofBoxes: opts.roofBoxes } : {}),
    underframe: opts.underframe ?? Y_UNDERFRAME_B,
    steps: opts.steps ?? "y",
    entrances: opts.entrances ?? { rear: true, front: true },
    handrails: opts.handrails ?? [[1.57, 1.3, 2.05], [22.87, 1.3, 2.05]],
    ...sides,
  };
}

function variantSpec(variant: ZsrVariant): LiveryCoachSpec {
  switch (variant) {
    case "a":
    case "ab": {
      // A: the yellow first class line over the whole coach; AB: over the first class half (x >= 13.3 m)
      const yellow: Paint = { box: [variant === "a" ? 15 : 133, 18, 230, 19], mat: "yellow" };
      const paint = [yellow, ...stripes([[18, 54], [65, 228]], [[14, 56], [59, 231]])];
      const signs = plates([[[27, 21, 30, 27], variant === "a" ? "1" : "2"], [[215, 21, 218, 27], "1"]]);
      const side: LiverySide = { windows: A_WINDOWS(true), doors: Y_DOORS, paint, signs, emblem: [56, 31, 65, 38], numberAt: 140 };
      return ySpec(variant, { right: side, left: side }, { underframe: [[[6.0, 0.4], [10.3, 0.4], [10.3, 0.9], [6.0, 0.9]], [[11.4, 0.6], [13.1, 0.6], [13.1, 0.9], [11.4, 0.9]], [[13.6, 0.3], [18.5, 0.3], [18.5, 0.9], [13.6, 0.9]]], vents: [[2.2, 2.8], [21.6, 22.2]] });
    }
    case "b":
    case "bh": {
      const signs = plates([[[27, 21, 30, 27], "2"], [[215, 21, 218, 27], "2"]]);
      const runs: Array<[number, number]> = variant === "b" ? [[18, 51], [62, 228]] : [[18, 53], [61, 228]];
      const paint = stripes(runs, variant === "b" ? [[14, 231]] : [[14, 54], [59, 231]], "white", variant === "b" ? "pink" : "paleGreen", variant === "b" ? "darkRed" : "darkGreen");
      const emblem: PxBox = variant === "b" ? [52, 31, 61, 38] : [53, 31, 61, 38];
      const right: LiverySide = { windows: B_WINDOWS(true), doors: Y_DOORS, paint, signs, emblem, numberAt: 140 };
      const left: LiverySide = { ...right, windows: B_WINDOWS(variant === "bh") };
      const green: Record<string, MaterialSpec> = { red: { color: "#00a040", roughness: 0.5 }, darkGreen: { color: "#007000", roughness: 0.5 }, paleGreen: { color: "#c0ffc0", roughness: 0.5 } };
      return ySpec(variant, { right, left }, { underframe: [[[6.0, 0.4], [10.3, 0.4], [10.3, 0.9], [6.0, 0.9]], [[11.4, 0.6], [13.1, 0.6], [13.1, 0.9], [11.4, 0.9]], [[13.6, 0.3], [18.5, 0.3], [18.5, 0.9], [13.6, 0.9]]], vents: [[2.2, 2.8], [21.6, 22.2]], ...(variant === "bh" ? { palette: green } : {}) });
    }
    case "bds": {
      const paint = stripes([[18, 50], [61, 69], [70, 77], [78, 119], [126, 228]], [[14, 70], [85, 231]]);
      const side: LiverySide = {
        windows: [[18, 19, 26, 30], [108, 19, 116, 30], ...[125, 144, 163, 182, 201].map((x): PxBox => [x, 19, x + 13, 30]), [219, 19, 227, 30]],
        doors: [...Y_DOORS, door([69, 18, 86, 38], [[72, 20, 76, 29], [79, 20, 83, 29]], "bands", false)],
        paint,
        signs: plates([[[215, 21, 218, 27], "2"]]),
        emblem: [51, 31, 60, 38],
        numberAt: 160,
      };
      return ySpec(variant, { right: side, left: side }, {
        underframe: [...LUGGAGE_UNDERFRAME, [[15.7, 0.4], [16.1, 0.4], [16.1, 0.9], [15.7, 0.9]], [[16.3, 0.4], [18.4, 0.4], [18.4, 0.9], [16.3, 0.9]]],
        bay: { mat: "red", windows: [[33, 20, 35, 29], [36, 20, 41, 29], [42, 20, 44, 29]] },
      });
    }
    case "bdmeer": {
      const doors = (first: PxBox): DoorSpec[] => [door(first, [[8, 20, 13, 30]]), door([69, 18, 86, 38], [[72, 20, 76, 29], [79, 20, 83, 30]], "bands", false), door([249, 19, 259, 44], [[251, 20, 256, 30]])];
      const windows: Win[] = [[25, 19, 38, 30], [44, 19, 57, 30], ...[112, 131, 150, 169, 188, 207].map((x): PxBox => [x, 19, x + 13, 30]), [226, 19, 239, 30]];
      const signs = plates([[[221, 21, 224, 26], "2"]]);
      const right: LiverySide = { windows, doors: doors([4, 19, 14, 44]), paint: stripes([[16, 46], [54, 69], [70, 77], [78, 85], [86, 248]], [[15, 47], [53, 69], [86, 249]]), signs, emblem: [46, 31, 54, 38], numberAt: 160 };
      const left: LiverySide = { windows, doors: doors([5, 19, 15, 44]), paint: stripes([[16, 69], [70, 77], [78, 85], [86, 210], [218, 248]], [[15, 69], [86, 210], [218, 249]]), signs, emblem: [210, 31, 218, 38], numberAt: 160 };
      return ySpec(variant, { right, left }, {
        body: "bdmeer",
        palette: { red: { color: "#c00000", roughness: 0.5 }, darkRed: { color: "#a00000", roughness: 0.5 } },
        underframe: [[[7.0, 0.5], [8.5, 0.5], [8.5, 0.9], [7.0, 0.9]], [[11.3, 0.6], [11.8, 0.4], [12.7, 0.4], [12.9, 0.5], [12.9, 0.9], [11.3, 0.9]], [[13.4, 0.4], [18.5, 0.4], [18.5, 0.9], [13.4, 0.9]]],
        vents: [[3.4, 4.0], [7.7, 8.3], [15.0, 15.6], [18.3, 18.9], [22.1, 22.7]],
        steps: "low",
        handrails: [[0.35, 1.3, 2.05], [26.05, 1.3, 2.05]],
      });
    }
    case "wrrm": {
      const kitchen = [16, 33, 50, 67, 84].map((x): Win => [[x, 20, x + 12, 30], "barred"]);
      const dining = [115, 139, 163, 208, 225].map((x): PxBox => [x, 20, x + 12, 30]);
      const side = (runs: Array<[number, number]>, emblem: PxBox): LiverySide => ({
        windows: [...kitchen, ...dining],
        doors: [door([249, 18, 259, 38], [[251, 20, 255, 29]])],
        paint: stripes(runs, [[4, 55], [61, 250]]),
        seams: [[185, 19, 194, 38]],
        emblem,
        numberAt: 160,
      });
      return ySpec(variant, { right: side([[12, 54], [62, 248]], [54, 31, 62, 38]), left: side([[12, 197], [205, 247]], [197, 31, 205, 38]) }, {
        body: "bdmeer",
        palette: { red: { color: "#bf080f", roughness: 0.5 }, darkRed: { color: "#901000", roughness: 0.5 }, roof: { color: "#bfbfbf", roughness: 0.7 }, bars: { color: "#e4e8e4", roughness: 0.5 } },
        underframe: [
          [[6.0, 0.4], [10.9, 0.4], [10.9, 0.9], [6.0, 0.9]],
          [[11.0, 0.5], [12.7, 0.5], [13.7, 0.6], [13.7, 0.9], [11.0, 0.9]],
          [[14.0, 0.5], [15.2, 0.5], [15.2, 0.9], [14.0, 0.9]],
          [[16.1, 0.4], [20.4, 0.4], [20.4, 0.9], [16.1, 0.9]],
        ],
        vents: [[0.8, 1.4], [11.3, 11.9], [12.2, 12.8], [14.6, 15.2], [15.9, 16.5], [17.2, 17.8], [18.5, 19.1], [24.1, 24.7]],
        roofBoxes: [[13.5, 14.1, 0.7, 0.14], [14.2, 14.8, 0.7, 0.14], [17.4, 18.0, 0.7, 0.14], [18.9, 19.5, 0.7, 0.14]],
        entrances: { rear: false, front: true },
        handrails: [[24.65, 1.3, 2.05]],
      });
    }
    case "apee": {
      // white over blue with a cyan foot and the yellow first class line; folding
      // doors at the very ends, and the ends painted in the side bands
      const windows: Win[] = [F([17, 19, 26, 31]), ...[30, 49, 68, 87, 106, 125, 144, 163, 182, 201].map((x): PxBox => [x, 19, x + 14, 31]), F([219, 19, 228, 31])];
      const doors = [door([5, 18, 14, 38], [[9, 20, 13, 30]], "white"), door([231, 18, 240, 38], [[232, 20, 236, 30]], "white")];
      const side: LiverySide = { windows, doors, paint: [{ box: [14, 18, 231, 19], mat: "yellow" }], emblem: [117, 33, 128, 38], numberAt: 175 };
      const spec = ySpec(variant, { right: side, left: side }, {
        palette: { white: { color: "#fcfcfc", roughness: 0.5 }, blue: { color: "#0a14f0", roughness: 0.5 }, cyan: { color: "#08c8f8", roughness: 0.5 }, roof: { color: "#e8e8e8", roughness: 0.7 } },
        underframe: Y_UNDERFRAME_A,
        vents: [],
      });
      const { endPaint: _ends, ...rest } = spec;
      return {
        ...rest,
        bands: [[0.9, 1.2, "cyan"], [1.2, 1.8, "blue"], [1.8, 3.2, "white"], [3.2, 4.3, "roof"]],
        endDoor: "white",
        end: { ...Y_END, lampY: 1.65 },
        numberY: 1.45,
      };
    }
  }
}

/** One ZSR coach (vlakosimdb zsr_<variant>). */
export function zsrCoach(params?: ParamValues): MeshBuilder {
  const variant = resolveParams(ZSR_PARAMS, params).variant as ZsrVariant;
  return buildLiveryCoach(variantSpec(variant));
}

/** The same coach from afar (docs/models/lod.md): the livery coach adapter of lodTrams.ts. */
export function zsrCoachLod(params?: ParamValues): MeshBuilder {
  return liveryCoachLod(variantSpec(resolveParams(ZSR_PARAMS, params).variant as ZsrVariant));
}
