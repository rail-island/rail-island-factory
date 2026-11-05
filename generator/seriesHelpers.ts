// Small helpers for the specs drawn on the series kit (shinkansen.ts): paints,
// nose tables, a flat cab front and the shared Velaro body (the ICE 3, the CRH3C
// and the AVE S-103 are one Siemens platform). See docs/models/shinkansen.md, "The series kit".

import type { MaterialSpec } from "./meshBuilder.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { NoseShape } from "./carbodyKit.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";

export const c = (hex: string, r = 0.4): MaterialSpec => paint(hex, r);

/** A nose: its length, the tip's half width, the plan's power and its crown, shoulder, belly, skirt-top and bottom lines by distance from the tip. */
export const nose = (len: number, tip: number, power: number, C: Pt[], S: Pt[], Y: Pt[], A: Pt[], B: Pt[]): NoseShape => ({ len, tip, power, C, S, Y, A, B });

/** No nose: a flat end (with `flatCab`). */
export const NO_NOSE = nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]);

/** A flat cab front's mask and three panes across a w-wide end, lamps low at its corners. */
export const flatCab = (w: number, y0: number, y1: number, mask: string, lampY: number) => ({
  mask: [y0 - 0.2, y1 + 0.15, mask] as const,
  panes: [[0.25, w - 0.12, y0, y1], [-0.2, 0.2, y0 - 0.25, y1 + 0.05], [-(w - 0.12), -0.25, y0, y1]] as Array<[number, number, number, number]>,
  lamps: [[-(w - 0.3), lampY, 0.08, "lampHead"], [w - 0.3, lampY, 0.08, "lampHead"], [-(w - 0.15), lampY, 0.05, "lampRed"], [w - 0.15, lampY, 0.05, "lampRed"]] as Array<[number, number, number, string]>,
});

/** A one-colour livery with a stripe, the usual simple scheme: body, a stripe from y0 to y1, roof and skirt paints. */
export function striped(title: string, body: string, stripe: string, y0: number, y1: number, number: string, roof = "#d9dcde", skirt = "#4a4d50", extra: Record<string, MaterialSpec> = {}): ShinkansenLivery {
  return {
    title,
    palette: { body: c(body), stripe: c(stripe), roofG: c(roof, 0.55), skirtG: c(skirt, 0.7), cabMask: c("#1d1f22", 0.3), ...extra },
    bands: [[0, y0, "body"], [y0, y1, "stripe"], [y1, 9, "body"]],
    roof: "roofG", skirt: "skirtG", number,
  };
}

/** The Velaro: 2.95 m wide, its long nose sloping to the cab; a series takes its lengths, liveries and figures. */
export function velaro(o: Pick<ShinkansenSeries, "liveries" | "weight" | "power" | "maxspeed"> & { endLength?: number; midLength?: number; W?: number }): ShinkansenSeries {
  return {
    endLength: o.endLength ?? 25.675, midLength: o.midLength ?? 24.775, W: o.W ?? 1.475, Y: 1.4, S: 3.15, C: 3.89, lean: 0.95, B: 0.75, A: 1.05,
    nose: nose(6.2, 0.05, 2.4, [[0, 1.15], [0.6, 1.5], [2.4, 2.1], [4.4, 2.75], [5.8, 3.4], [7.2, 3.89]], [[0, 1.1], [0.6, 1.4], [2.4, 1.9], [4.4, 2.5], [5.8, 2.95], [7.2, 3.15]], [[0, 1.05], [1.5, 1.25], [3.0, 1.4]], [[0, 1.0], [1.5, 1.05]], [[0, 0.98], [0.6, 0.55], [2.0, 0.75]]),
    windscreen: [4.0, 5.9, 0.07, 1.05], lamps: [1.3, 1.45],
    windows: [[1.95, 2.75]], windowW: 1.25, pitch: 1.45, door: [1.3, 3.1, 1.95, 2.65], doorW: 0.9,
    bogieCentres: 17.375, wheelR: 0.46, wheelbase: 2.5,
    liveries: o.liveries, weight: o.weight, power: o.power, maxspeed: o.maxspeed,
  };
}

/** Stadler's FLIRT: the rounded, raked front with its big windscreen; a series takes its width, car lengths, liveries and figures. */
export function flirt(o: Pick<ShinkansenSeries, "liveries" | "weight" | "power" | "maxspeed"> & { W?: number; endLength?: number; midLength?: number; cars?: readonly number[] }): ShinkansenSeries {
  return {
    endLength: o.endLength ?? 18.6, midLength: o.midLength ?? 15.5, W: o.W ?? 1.41, Y: 1.25, S: 3.2, C: 4.0, lean: 0.95, B: 0.6, A: 0.8,
    nose: nose(2.2, 0.3, 2.3, [[0, 2.2], [0.4, 2.95], [1.5, 3.7], [2.4, 4.0]], [[0, 2.1], [0.4, 2.75], [1.5, 3.1], [2.4, 3.2]], [[0, 1.25], [0.8, 1.25]], [[0, 0.95], [0.6, 0.8]], [[0, 0.85], [0.3, 0.6]]),
    windscreen: [0.45, 2.0, 0.07, 1.2], lamps: [0.15, 1.35],
    windows: [[1.45, 2.65]], windowW: 1.6, pitch: 1.85, door: [0.95, 3.0, 1.5, 2.6], doorW: 1.3,
    bogieCentres: 12.0, wheelR: 0.43, wheelbase: 2.5, cars: o.cars ?? [3, 4],
    liveries: o.liveries, weight: o.weight, power: o.power, maxspeed: o.maxspeed,
  };
}

/** Stadler's KISS: the double-deck FLIRT. */
export function kiss(o: Pick<ShinkansenSeries, "liveries" | "weight" | "power" | "maxspeed"> & { W?: number; cars?: readonly number[] }): ShinkansenSeries {
  return {
    endLength: 26.8, midLength: 25.0, W: o.W ?? 1.4, Y: 1.2, S: 3.85, C: 4.6, lean: 0.97, B: 0.6, A: 0.8,
    nose: nose(2.4, 0.3, 2.3, [[0, 2.4], [0.5, 3.4], [1.6, 4.25], [2.6, 4.6]], [[0, 2.3], [0.5, 3.2], [1.6, 3.7], [2.6, 3.85]], [[0, 1.2], [1.0, 1.2]], [[0, 0.95], [0.8, 0.8]], [[0, 0.85], [0.4, 0.6]]),
    windscreen: [0.7, 2.2, 0.07, 1.15], lamps: [0.15, 1.35],
    windows: [[1.25, 1.95], [2.85, 3.55]], windowW: 1.4, pitch: 1.7, door: [0.95, 3.05, 1.6, 2.6], doorW: 1.3,
    bogieCentres: 18.0, wheelR: 0.46, wheelbase: 2.5, cars: o.cars ?? [4, 6],
    liveries: o.liveries, weight: o.weight, power: o.power, maxspeed: o.maxspeed,
  };
}

/**
 * A Talgo set: short, low cars on single axles (the real train shares one wheel
 * pair between two cars at each joint; the kit stands each car on two of its own).
 */
export function talgo(o: Pick<ShinkansenSeries, "liveries" | "weight" | "power" | "maxspeed" | "nose" | "windscreen" | "lamps"> & { endLength?: number; cars?: readonly number[]; traction?: ShinkansenSeries["traction"]; C?: number }): ShinkansenSeries {
  return {
    endLength: o.endLength ?? 20.0, midLength: 13.14, W: 1.47, Y: 1.25, S: 2.95, C: o.C ?? 3.4, lean: 0.95, B: 0.75, A: 0.9,
    nose: o.nose, windscreen: o.windscreen, lamps: o.lamps,
    windows: [[1.55, 2.45]], windowW: 1.1, pitch: 1.4, door: [0.95, 2.85, 1.55, 2.45], doorW: 0.8,
    // the power cars at the ends raise the pantographs; the Talgo coaches between them none
    bogieCentres: 5.6, wheelR: 0.4, wheelbase: 0, cars: o.cars ?? [4, 8], endPantograph: true, ...(o.traction ? { traction: o.traction } : {}),
    liveries: o.liveries, weight: o.weight, power: o.power, maxspeed: o.maxspeed,
  };
}
