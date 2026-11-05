// Freight wagons of the eight countries' families: an open bogie wagon with its
// load and a covered one, on three-piece freight trucks with automatic knuckle
// couplers (the AAR-type couplers of Indian and Chinese railways), stated in a
// few measures: India's BOXN and BCNA, China's C70 and P70.
// See docs/models/world-wagons.md.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { bogieGeometry, paint, type BogieSpec } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { US_PALETTE, knuckleCoupler, paintedSweep, sideText } from "./usHoodKit.ts";
import { enumParam } from "./emuParts.ts";
import { WAGON_CATALOG } from "./wagons.ts";
import type { LodBand, LodPart } from "./lodKit.ts";
import { bogieParts, fitUnit, type UnitBody } from "./lodUnits.ts";

const COUPLER_Y = 0.88;

export interface WorldWagon {
  /** Over the coupler faces; the body's half length and half width, the floor and the top of the sides (open) or the eaves (covered). */
  length: number;
  body: number;
  half: number;
  floor: number;
  top: number;
  /** The trucks' centres (+-), their wheel radius. */
  centre: number;
  wheelR: number;
  /** Paint and lettering. */
  colour: string;
  ink: string;
  text: string;
  /** The covered wagon's roof rise over the eaves. */
  roofRise: number;
}

/** A 2.1 m freight bogie (the kit draws its brake cylinders clear of the transoms from 2.05 m). */
const truck = (r: number): BogieSpec => ({
  axles: [-1.05, 1.05], wheelR: r, frameHalf: 1.05 + r + 0.15, frameTop: r + 0.38, frameBottom: r + 0.06, frameZ: [0.9, 1.02], primary: "leaf",
  secondary: [-0.12, 0.12], secondaryZ: 0.96, bolster: 1.0,
});

/** A box body's section (z, y). */
const box = (half: number, y0: number, y1: number, r = 0.06): Array<[number, number]> => [[-half, y0], [half, y0], [half, y1 - r], [half - r, y1], [-(half - r), y1], [-half, y1 - r]];
/** A covered body's section: the sides up to the eaves, the curved roof above. */
const covered = (half: number, y0: number, y1: number, rise: number): Array<[number, number]> => [[-half, y0], [half, y0], [half, y1], [half * 0.7, y1 + rise * 0.7], [0, y1 + rise], [-half * 0.7, y1 + rise * 0.7], [-half, y1]];

export type WagonUnit = "open" | "covered";
export const WAGON_PARAMS: ParamSpec[] = [enumParam("unit", "Wagon", { open: "Open wagon", covered: "Covered wagon" })];

function palette(s: WorldWagon): Record<string, MaterialSpec> {
  return { ...US_PALETTE, wgBody: paint(s.colour, 0.75), wgInk: paint(s.ink), wgLoad: paint("#2b2a28", 0.95) };
}

export function buildWagon(open: WorldWagon, cov: WorldWagon, v?: ParamValues): MeshBuilder {
  const unit = resolveParams(WAGON_PARAMS, v).unit as WagonUnit;
  const s = unit === "open" ? open : cov;
  const m = new MeshBuilder(palette(s));
  const sill = s.body + 0.1;
  m.scope("underframe", () => block(m, "black", -sill, sill, s.floor - 0.25, s.floor, -s.half + 0.08, s.half - 0.08));
  m.scope("body", () => {
    if (unit === "open") {
      paintedSweep(m, "x", box(s.half, s.floor, s.top), -s.body, s.body, { bands: [[0, 9, "wgBody"]], roofFrom: s.top - 0.02, roof: "wgLoad" });
      // the load heaped over the sides' top
      m.scope("load", () => block(m, "wgLoad", -s.body + 0.15, s.body - 0.15, s.top - 0.02, s.top + 0.12, -s.half + 0.15, s.half - 0.15));
    } else {
      paintedSweep(m, "x", covered(s.half, s.floor, s.top, s.roofRise), -s.body, s.body, { bands: [[0, 9, "wgBody"]], roofFrom: s.top, roof: "wgBody" });
      for (const sd of [-1, 1]) m.scope(sd > 0 ? "right door" : "left door", () => block(m, "wgBody", -1.3, 1.3, s.floor + 0.05, s.top - 0.1, ...side(sd, s.half, s.half + 0.05)));
    }
    for (const sd of [-1, 1]) {
      m.scope(sd > 0 ? "right side" : "left side", () => {
        // the side stanchions
        for (let x = -s.body + 0.6; x <= s.body - 0.55; x += 1.25) if (unit === "open" || Math.abs(x) > 1.5) block(m, "wgBody", x - 0.05, x + 0.05, s.floor + 0.05, s.top - 0.06, ...side(sd, s.half, s.half + 0.04));
        sideText(m, "wgInk", s.text, sd, s.half + 0.046, -s.body * 0.55, s.floor + 0.6, 0.22);
      });
    }
  });
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => bogieGeometry(m, s.centre, truck(s.wheelR))));
    m.scope("rear truck", () => m.bogie(() => bogieGeometry(m, -s.centre, truck(s.wheelR))));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front coupler" : "rear coupler", () => knuckleCoupler(m, e, sill, s.length / 2, COUPLER_Y));
  return m;
}

export function buildWagonLod(open: WorldWagon, cov: WorldWagon, v?: ParamValues): MeshBuilder {
  const unit = resolveParams(WAGON_PARAMS, v).unit as WagonUnit;
  const s = unit === "open" ? open : cov;
  const y0 = s.floor - 0.25;
  const top = unit === "open" ? s.top : s.top + s.roofRise;
  const side: LodBand[] = [[y0, s.floor, "black"], [s.floor, top, "wgBody"]];
  const body: UnitBody = { y0, hw: [[y0, s.half], [top - 0.1, s.half], [top, s.half - 0.1]], side, roof: unit === "open" ? "wgLoad" : "wgBody", front: { tip: [[y0, s.body]] }, rear: { tip: [[y0, -s.body]] } };
  const t = truck(s.wheelR);
  const parts: LodPart[] = bogieParts([[s.centre, t.frameHalf], [-s.centre, t.frameHalf]], y0);
  return fitUnit({ palette: palette(s), bodies: [body], parts }, 100);
}

export const wagonGame = (open: number, covered: number, maxspeed: number): GameProperties => ({ weight: open, power: 0, maxspeed, accel: null, variants: [{ params: { unit: "covered" }, weight: covered }] });

// ---------------------------------------------------------------------------
// India: the BOXN open and BCNA covered wagons; China: the C70 open and P70 covered wagons

const BROWN = "#5a2e22";
export const BOXN: WorldWagon = { length: 10.71, body: 4.9, half: 1.5, floor: 1.25, top: 3.2, centre: 3.3, wheelR: 0.5, colour: BROWN, ink: "#e8e6df", text: "BOXNHL", roofRise: 0 };
export const BCNA: WorldWagon = { length: 15.43, body: 7.3, half: 1.55, floor: 1.25, top: 3.6, centre: 5.15, wheelR: 0.5, colour: BROWN, ink: "#e8e6df", text: "BCNA", roofRise: 0.4 };
export const C70: WorldWagon = { length: 13.98, body: 6.5, half: 1.5, floor: 1.15, top: 3.1, centre: 4.6, wheelR: 0.42, colour: "#3d3a37", ink: "#e8e6df", text: "C70", roofRise: 0 };
export const P70: WorldWagon = { length: 17.0, body: 8.0, half: 1.5, floor: 1.15, top: 3.55, centre: 5.95, wheelR: 0.42, colour: "#3d4a3a", ink: "#e8e6df", text: "P70", roofRise: 0.45 };

export function irBoxnWagon(v?: ParamValues): MeshBuilder { return buildWagon(BOXN, BCNA, v); }
export function irBoxnWagonLod(v?: ParamValues): MeshBuilder { return buildWagonLod(BOXN, BCNA, v); }
export function crC70Wagon(v?: ParamValues): MeshBuilder { return buildWagon(C70, P70, v); }
export function crC70WagonLod(v?: ParamValues): MeshBuilder { return buildWagonLod(C70, P70, v); }

export const WORLD_WAGONS: ProceduralDesign[] = [
  { id: "proc-vehicle-ir-boxn-wagon", title: "IR BOXN / BCNA wagon", build: irBoxnWagon, buildLod: irBoxnWagonLod, params: WAGON_PARAMS, game: wagonGame(22, 27, 100), catalog: WAGON_CATALOG, loadingGauge: "us", references: "ir-boxn-wagon" },
  { id: "proc-vehicle-cr-c70-wagon", title: "CR C70 / P70 wagon", build: crC70Wagon, buildLod: crC70WagonLod, params: WAGON_PARAMS, game: wagonGame(24, 24, 120), catalog: WAGON_CATALOG, references: "cr-c70-wagon" },
];
