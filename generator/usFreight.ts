// North American freight cars and the San Francisco cable car: a cupola
// caboose, a 50 ft boxcar and a double-stack well car (its `cargo` single by
// default, double reaching the US double-stack gauge), and the Powell Street
// cable car. Boxes drawn with the hood kit's painted sweeps (usHoodKit.ts),
// US trucks and knuckle couplers. See docs/models/us-freight.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { bogieGeometry, exhaust, paint, type BogieSpec } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { decalX, decalZ, knuckleCoupler, paintedSweep, sideText, US_PALETTE, type Band } from "./usHoodKit.ts";
import { WAGON_CATALOG } from "./wagons.ts";
import { TRAM_CATALOG } from "./trams.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, type UnitBody } from "./lodUnits.ts";
import type { LodPart } from "./lodKit.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;
const COUPLER_Y = 0.88;

const freightTruck = (wheelR = ft(0, 16.5), wb = 1.45, bolster = 1.0): BogieSpec => ({
  axles: [-wb / 2, wb / 2], wheelR, frameHalf: wb / 2 + wheelR + 0.15, frameTop: wheelR + 0.38, frameBottom: wheelR + 0.06, frameZ: [0.9, 1.02], primary: "leaf",
  secondary: [-0.12, 0.12], secondaryZ: 0.96, bolster,
});

/** The freight truck's wheelbase is 1.45 m (a real 70-ton truck's 5 ft 8 in is 1.73 m), its brake cylinders clear of the transoms. */

/** Trucks at +-centre and knuckle couplers at both ends (the end sills at |x| = sill, the faces at length / 2). */
function runningGear(m: MeshBuilder, centre: number, sill: number, length: number, truck: BogieSpec): void {
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => bogieGeometry(m, centre, truck)));
    m.scope("rear truck", () => m.bogie(() => bogieGeometry(m, -centre, truck)));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front coupler" : "rear coupler", () => knuckleCoupler(m, e, sill, length / 2, COUPLER_Y));
}

/** A box body along x from x0 to x1: its section (z, y), painted by height, both ends closed. */
const box = (half: number, y0: number, y1: number, r = 0.08): Array<[number, number]> => [[-half, y0], [half, y0], [half, y1 - r], [half - r, y1], [-(half - r), y1], [-half, y1 - r]];

/** A plain distant model: one body box, its roof, and the trucks. */
function boxLod(palette: Record<string, MaterialSpec>, x0: number, x1: number, y0: number, y1: number, half: number, side: readonly LodBand[], roof: string, centre: number, truck: BogieSpec, windows: UnitBody["windows"] = []): MeshBuilder {
  const body: UnitBody = { y0, hw: [[y0, half], [y1 - 0.1, half], [y1, half - 0.1]], side, roof, front: { tip: [[y0, x1]] }, rear: { tip: [[y0, x0]] }, windows };
  const parts: LodPart[] = bogieParts([[centre, truck.frameHalf], [-centre, truck.frameHalf]], y0);
  return fitUnit({ palette, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Cupola caboose

export const CABOOSE_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "santaFe",
  values: [{ value: "santaFe", title: "Santa Fe" }, { value: "unionPacific", title: "Union Pacific" }],
}];
const CABOOSE_LIVERIES: Record<string, { body: string; trim: string; text: string; palette: Record<string, MaterialSpec> }> = {
  santaFe: { body: "cabRed", trim: "cabWhite", text: "SANTA FE", palette: { cabRed: paint("#9e2a23"), cabWhite: paint("#ecebe6") } },
  unionPacific: { body: "upYellow", trim: "upRed", text: "UNION PACIFIC", palette: { upYellow: paint("#f4b92a"), upRed: paint("#b5202b") } },
};
export const CABOOSE_LENGTH = ft(36);
const CB = { sill: 5.0, body: 4.0, half: 1.5, deck: 1.15, top: 3.85, cupola: { x0: -1.2, x1: 1.2, half: 1.15, top: 4.6 }, centre: 3.0 };

export function caboose(params?: ParamValues): MeshBuilder {
  const l = CABOOSE_LIVERIES[resolveParams(CABOOSE_PARAMS, params).livery!]!;
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  const paintOf = { bands: [[0, 9, l.body]] as readonly Band[], roofFrom: CB.top - 0.04, roof: l.body };
  m.scope("frame", () => {
    block(m, "black", -CB.sill, CB.sill, 0.95, CB.deck, -1.5, 1.5);
    block(m, "walk", -CB.sill, CB.sill, CB.deck, CB.deck + 0.04, -1.45, 1.45);
  });
  m.scope("body", () => {
    paintedSweep(m, "x", box(CB.half, CB.deck + 0.04, CB.top, 0.12), -CB.body, CB.body, paintOf);
    m.scope("cupola", () => paintedSweep(m, "x", box(CB.cupola.half, CB.top - 0.05, CB.cupola.top, 0.08), CB.cupola.x0, CB.cupola.x1, { ...paintOf, roofFrom: CB.cupola.top - 0.04 }));
    m.scope("roof walk", () => block(m, "walk", -CB.body - 0.1, CB.body + 0.1, CB.top, CB.top + 0.05, -0.3, 0.3));
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        for (const x of [-2.6, 2.6]) {
          decalZ(m, "rubber", s * (CB.half + 0.004), s, x - 0.4, x + 0.4, 2.3, 3.0);
          decalZ(m, "glass", s * (CB.half + 0.008), s, x - 0.35, x + 0.35, 2.35, 2.95);
        }
        for (const x of [-0.6, 0.6]) {
          decalZ(m, "rubber", s * (CB.cupola.half + 0.004), s, x - 0.35, x + 0.35, 4.0, 4.4);
          decalZ(m, "glass", s * (CB.cupola.half + 0.008), s, x - 0.3, x + 0.3, 4.04, 4.36);
        }
        sideText(m, l.trim, l.text, s, CB.half + 0.008, 0, 1.6, 0.3);
        decalZ(m, l.trim, s * (CB.half + 0.004), s, -CB.body, CB.body, 1.2, 1.26);
      });
    for (const e of [1, -1])
      m.scope(e > 0 ? "front end" : "rear end", () => {
        const x = e * CB.body;
        decalX(m, "rubber", x + e * 0.004, e, -0.4, 0.4, 1.3, 3.2);
        decalX(m, "glass", x + e * 0.008, e, -0.25, 0.25, 2.4, 3.0);
        // the platform railing and the ladder to the roof
        const xr = e * (CB.sill - 0.08);
        for (const sd of [-1, 1]) {
          m.prism("handrail", ngon(6, 0.025, 0, xr, sd * 1.35), CB.deck, CB.deck + 1.0);
          m.rod("handrail", [xr, CB.deck + 1.0, sd * 1.35], [xr, CB.deck + 1.0, sd * 0.45], 0.022, 6);
          m.rod("handrail", [xr, CB.deck + 1.0, sd * 1.35], [e * CB.body, CB.deck + 1.0, sd * 1.35], 0.022, 6);
        }
        for (const z of [-0.95, -0.65]) m.rod("handrail", [x + e * 0.12, CB.deck, z], [x + e * 0.12, CB.top + 0.1, z], 0.02, 6);
        for (let y = CB.deck + 0.3; y < CB.top; y += 0.35) m.rod("handrail", [x + e * 0.12, y, -0.95], [x + e * 0.12, y, -0.65], 0.016, 6);
        // marker lamps at the corners
        for (const sd of [-1, 1]) m.sweep(e > 0 ? "lampHead" : "lampRed", "x", ngon(8, 0.07, 0, sd * 1.3, 3.5), Math.min(x, x + e * 0.12), ngon(8, 0.07, 0, sd * 1.3, 3.5), Math.max(x, x + e * 0.12));
        for (const sd of [-1, 1]) for (const y of [0.55, 0.85]) block(m, "steel", ...(e > 0 ? [CB.sill - 0.6, CB.sill - 0.1] : [-CB.sill + 0.1, -CB.sill + 0.6]) as [number, number], y, y + 0.03, ...side(sd, 1.0, 1.45));
      });
    m.scope("stove pipe", () => exhaust(m, 2.0, -0.6, CB.top - 0.05, CB.top + 0.45, 0.14, 0.14));
  });
  runningGear(m, CB.centre, CB.sill, CABOOSE_LENGTH, freightTruck());
  return m;
}

export function cabooseLod(params?: ParamValues): MeshBuilder {
  const l = CABOOSE_LIVERIES[resolveParams(CABOOSE_PARAMS, params).livery!]!;
  return boxLod({ ...US_PALETTE, ...l.palette }, -CB.sill, CB.sill, 0.95, CB.top, CB.half, [[0.95, CB.deck, "black"], [CB.deck, CB.top, l.body]], l.body, CB.centre, freightTruck(),
    [{ u: [-3.0, -2.2], y: [2.3, 3.0], mat: LOD_GLASS, optional: 2 }, { u: [2.2, 3.0], y: [2.3, 3.0], mat: LOD_GLASS, optional: 2 }]);
}

// ---------------------------------------------------------------------------
// 50 ft boxcar

export const BOXCAR_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "boxcarRed",
  values: [{ value: "boxcarRed", title: "Boxcar red" }, { value: "railbox", title: "Railbox" }],
}];
const BOXCAR_LIVERIES: Record<string, { body: string; text: string; ink: string; palette: Record<string, MaterialSpec> }> = {
  boxcarRed: { body: "bxRed", text: "SOUTHERN PACIFIC", ink: "bxWhite", palette: { bxRed: paint("#7b2b22", 0.7), bxWhite: paint("#e8e6df") } },
  railbox: { body: "bxYellow", text: "RAILBOX", ink: "bxBlack", palette: { bxYellow: paint("#f1c21c", 0.6), bxBlack: paint("#1f2022") } },
};
export const BOXCAR_LENGTH = ft(55, 4);
const BX = { sill: 7.95, body: 7.85, half: 1.52, floor: 1.1, top: ft(15, 1), centre: ft(40, 6) / 2 };

export function boxcar(params?: ParamValues): MeshBuilder {
  const l = BOXCAR_LIVERIES[resolveParams(BOXCAR_PARAMS, params).livery!]!;
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  m.scope("underframe", () => block(m, "black", -BX.sill, BX.sill, 0.85, BX.floor, -1.45, 1.45));
  m.scope("body", () => {
    paintedSweep(m, "x", box(BX.half, BX.floor, BX.top, 0.1), -BX.body, BX.body, { bands: [[0, 9, l.body]], roofFrom: BX.top - 0.04, roof: l.body });
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        // the exterior posts, the sliding door on its track
        for (let x = -BX.body + 0.4; x <= BX.body - 0.35; x += 0.62) if (Math.abs(x) > 1.75) block(m, l.body, x - 0.04, x + 0.04, BX.floor + 0.05, BX.top - 0.12, ...side(s, BX.half, BX.half + 0.05));
        m.scope("door", () => {
          block(m, l.body, -1.55, 1.55, BX.floor + 0.02, BX.top - 0.2, ...side(s, BX.half + 0.02, BX.half + 0.08));
          for (const x of [-0.8, 0, 0.8]) block(m, "black", x - 0.03, x + 0.03, BX.floor + 0.1, BX.top - 0.3, ...side(s, BX.half + 0.08, BX.half + 0.1));
          block(m, "steel", -3.2, 3.2, BX.top - 0.2, BX.top - 0.14, ...side(s, BX.half + 0.006, BX.half + 0.1));
        });
        sideText(m, l.ink, l.text, s, BX.half + 0.056, -4.8, 3.4, 0.32);
        sideText(m, l.ink, "BOXCAR", s, BX.half + 0.056, 4.8, 1.4, 0.2);
      });
    for (const e of [1, -1])
      m.scope(e > 0 ? "front end" : "rear end", () => {
        const x = e * BX.body;
        for (let y = BX.floor + 0.5; y < BX.top - 0.2; y += 0.55) block(m, l.body, Math.min(x, x + e * 0.05), Math.max(x, x + e * 0.05), y, y + 0.08, -1.4, 1.4);
        for (const z of [1.1, 1.4]) m.rod("handrail", [x + e * 0.1, 1.2, z], [x + e * 0.1, BX.top - 0.2, z], 0.02, 6);
        for (let y = 1.5; y < BX.top - 0.2; y += 0.4) m.rod("handrail", [x + e * 0.1, y, 1.1], [x + e * 0.1, y, 1.4], 0.016, 6);
      });
  });
  runningGear(m, BX.centre, BX.sill, BOXCAR_LENGTH, freightTruck());
  return m;
}

export function boxcarLod(params?: ParamValues): MeshBuilder {
  const l = BOXCAR_LIVERIES[resolveParams(BOXCAR_PARAMS, params).livery!]!;
  return boxLod({ ...US_PALETTE, ...l.palette }, -BX.sill, BX.sill, 0.85, BX.top, BX.half, [[0.85, BX.floor, "black"], [BX.floor, BX.top, l.body]], l.body, BX.centre, freightTruck());
}

// ---------------------------------------------------------------------------
// Double-stack well car

export const WELL_PARAMS: readonly ParamSpec[] = [{
  name: "cargo", title: "Cargo", default: "single",
  values: [{ value: "empty", title: "Empty" }, { value: "single", title: "Single stack" }, { value: "double", title: "Double stack" }],
}];
export const WELL_LENGTH = ft(63, 6);
const WL = { sill: 9.2, well: 6.25, deck: 0.36, girder: 1.75, half: 1.42, centre: ft(52) / 2 };
/** An ISO 40 ft high-cube container: 12.19 by 2.44 by 2.9 m. */
const CONTAINER = { len: 12.19, half: 1.22, h: 2.9 };

function container(m: MeshBuilder, y0: number, mat: string): void {
  const [x0, x1] = [-CONTAINER.len / 2, CONTAINER.len / 2];
  block(m, mat, x0, x1, y0, y0 + CONTAINER.h, -CONTAINER.half, CONTAINER.half);
  // the corrugated sides and the doors at the rear
  for (const s of [-1, 1]) for (let x = x0 + 0.3; x < x1 - 0.3; x += 0.3) decalZ(m, "louvre", s * (CONTAINER.half + 0.003), s, x, x + 0.1, y0 + 0.1, y0 + CONTAINER.h - 0.1);
  for (const z of [-0.6, 0.6]) decalX(m, "steel", x0 - 0.003, -1, z - 0.55, z + 0.55, y0 + 0.1, y0 + CONTAINER.h - 0.1);
}

export function wellCar(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(WELL_PARAMS, params);
  const m = new MeshBuilder({ ...US_PALETTE, wcGrey: paint("#5d6266", 0.7), cBlue: paint("#24508f", 0.6), cRed: paint("#a3281f", 0.6) });
  m.scope("car", () => {
    // the two end platforms over the trucks and the side girders round the well
    for (const e of [1, -1]) block(m, "wcGrey", ...(e > 0 ? [WL.well, WL.sill] : [-WL.sill, -WL.well]) as [number, number], 0.95, 1.35, -1.4, 1.4);
    for (const s of [-1, 1]) {
      const sec: Array<[number, number]> = [[-WL.sill + 0.05, 0.95], [-WL.well, 0.95], [-WL.well + 0.6, 0.3], [WL.well - 0.6, 0.3], [WL.well, 0.95], [WL.sill - 0.05, 0.95]];
      // the girder: a plate from its deep middle to the ends, its top rail along
      for (let i = 0; i + 1 < sec.length; i++) {
        const [[xa, ya], [xb, yb]] = [sec[i]!, sec[i + 1]!];
        const q: Vec3[] = [[xa, ya, s * WL.half], [xb, yb, s * WL.half], [xb, WL.girder, s * WL.half], [xa, WL.girder, s * WL.half]];
        m.slab("wcGrey", q, [0, 0, -s * 0.1]);
      }
      block(m, "steel", -WL.sill + 0.05, WL.sill - 0.05, WL.girder, WL.girder + 0.06, ...side(s, WL.half - 0.12, WL.half + 0.04));
    }
    block(m, "wcGrey", -WL.well + 0.6, WL.well - 0.6, WL.deck - 0.1, WL.deck, -1.32, 1.32);
    if (cargo === "empty") for (const x of [-4.0, 0, 4.0]) block(m, "wcGrey", x - 0.1, x + 0.1, WL.deck, 0.8, -1.32, 1.32);
  });
  if (cargo !== "empty")
    m.scope("containers", () => {
      m.scope("lower", () => container(m, WL.deck, "cBlue"));
      if (cargo === "double") m.scope("upper", () => container(m, WL.deck + CONTAINER.h + 0.02, "cRed"));
    });
  runningGear(m, WL.centre, WL.sill, WELL_LENGTH, freightTruck());
  return m;
}

export function wellCarLod(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(WELL_PARAMS, params);
  const top = cargo === "empty" ? WL.girder : WL.deck + CONTAINER.h * (cargo === "double" ? 2 : 1);
  const bands: LodBand[] = cargo === "empty" ? [[0.3, WL.girder, "wcGrey"]] : [[0.3, WL.girder, "wcGrey"], [WL.girder, WL.deck + CONTAINER.h, "cBlue"], ...(cargo === "double" ? [[WL.deck + CONTAINER.h, top, "cRed"] as LodBand] : [])];
  return boxLod({ ...US_PALETTE, wcGrey: paint("#5d6266", 0.7), cBlue: paint("#24508f", 0.6), cRed: paint("#a3281f", 0.6) }, -WL.sill, WL.sill, 0.3, top, WL.half, bands, cargo === "double" ? "cRed" : cargo === "single" ? "cBlue" : "wcGrey", WL.centre, freightTruck());
}

// ---------------------------------------------------------------------------
// San Francisco cable car (the Powell Street type): an open grip section and a closed cabin

export const CABLE_CAR_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "powell",
  values: [{ value: "powell", title: "Powell Street" }, { value: "california", title: "California St" }],
}];
const CABLE_LIVERIES: Record<string, Record<string, MaterialSpec>> = {
  powell: { ccBody: paint("#6e1f24"), ccPanel: paint("#e6dcc1"), ccTrim: paint("#2b4a7a"), ccRoof: paint("#e9e4d7") },
  california: { ccBody: paint("#a3201f"), ccPanel: paint("#e6dcc1"), ccTrim: paint("#1f2022"), ccRoof: paint("#e9e4d7") },
};
export const CABLE_CAR_LENGTH = ft(27, 6);
const CC = { half: ft(4), floor: 0.85, roof: ft(10, 3) - 0.15, cabin: 1.9, end: CABLE_CAR_LENGTH / 2 - 0.06, centre: 2.0 };

export function cableCar(params?: ParamValues): MeshBuilder {
  const livery = resolveParams(CABLE_CAR_PARAMS, params).livery!;
  const pal = CABLE_LIVERIES[livery]!;
  const m = new MeshBuilder({ ...US_PALETTE, ...pal, wood: paint("#8a5a33", 0.8), brass: { color: "#b8913a", metallic: 0.45, roughness: 0.35 } });
  m.scope("floor", () => {
    block(m, "black", -CC.end, CC.end, CC.floor - 0.15, CC.floor, -CC.half, CC.half);
    // the running boards along the open sections, the wooden step
    for (const s of [-1, 1]) for (const [a, b] of [[-CC.end, -CC.cabin], [CC.cabin, CC.end]] as const) block(m, "wood", a, b, CC.floor - 0.3, CC.floor - 0.24, ...side(s, CC.half, CC.half + 0.25));
  });
  m.scope("cabin", () => {
    paintedSweep(m, "x", box(CC.half, CC.floor, CC.roof - 0.1, 0.05), -CC.cabin, CC.cabin, { bands: [[0, 1.55, "ccBody"], [1.55, 2.4, "ccPanel"], [2.4, 9, "ccBody"]], roofFrom: CC.roof, roof: "ccBody" });
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
      const x = -CC.cabin + 0.25 + i * 0.9;
      decalZ(m, "rubber", s * (CC.half + 0.004), s, x, x + 0.7, 1.62, 2.32);
      decalZ(m, "glass", s * (CC.half + 0.008), s, x + 0.05, x + 0.65, 1.67, 2.27);
    }
  });
  m.scope("open sections", () => {
    for (const e of [1, -1]) {
      const [a, b] = e > 0 ? [CC.cabin, CC.end] : [-CC.end, -CC.cabin];
      // the outward-facing benches, the dash panel at the end, the brass poles
      for (const s of [-1, 1]) {
        block(m, "wood", a + 0.1, b - 0.3, CC.floor + 0.45, CC.floor + 0.5, ...side(s, CC.half - 0.55, CC.half - 0.05));
        block(m, "ccBody", a + 0.1, b - 0.3, CC.floor, CC.floor + 0.45, ...side(s, CC.half - 0.5, CC.half - 0.45));
        for (let x = a + 0.2; x < b - 0.2; x += 0.75) m.prism("brass", ngon(6, 0.025, 0, x, s * (CC.half - 0.02)), CC.floor, CC.roof - 0.1);
      }
      block(m, "ccBody", e > 0 ? b - 0.12 : a, e > 0 ? b : a + 0.12, CC.floor, CC.floor + 1.1, -CC.half, CC.half);
      decalX(m, "ccPanel", e * (CC.end + 0.004), e, -0.7, 0.7, CC.floor + 0.6, CC.floor + 1.0);
      m.sweep("lampHead", "x", ngon(10, 0.1, 0, 0, CC.floor + 0.85), Math.min(e * CC.end, e * (CC.end + 0.06)), ngon(10, 0.1, 0, 0, CC.floor + 0.85), Math.max(e * CC.end, e * (CC.end + 0.06)));
    }
  });
  m.scope("roof", () => {
    paintedSweep(m, "x", [[-CC.half - 0.12, CC.roof - 0.1], [CC.half + 0.12, CC.roof - 0.1], [CC.half - 0.2, CC.roof + 0.05], [-(CC.half - 0.2), CC.roof + 0.05]], -CC.end - 0.04, CC.end + 0.04, { bands: [[0, 9, "ccTrim"]], roofFrom: CC.roof + 0.04, roof: "ccRoof" });
    paintedSweep(m, "x", box(0.7, CC.roof + 0.05, CC.roof + 0.3, 0.04), -CC.end + 0.8, CC.end - 0.8, { bands: [[0, 9, "ccPanel"]], roofFrom: CC.roof + 0.28, roof: "ccRoof" });
    for (const s of [-1, 1]) sideText(m, "ccPanel", livery === "powell" ? "POWELL AND MASON" : "CALIFORNIA ST", s, CC.half + 0.124, 0, CC.roof - 0.07, 0.1);
  });
  m.scope("grip", () => {
    m.rod("steel", [CC.cabin + 0.6, CC.floor, 0], [CC.cabin + 0.75, CC.floor + 1.3, 0], 0.03, 6);
    m.prism("black", ngon(8, 0.08, 0, CC.cabin + 0.6, 0), 0.25, CC.floor - 0.15);
  });
  m.scope("trucks", () => {
    const t: BogieSpec = freightTruck(0.3, 1.5, CC.floor - 0.15);
    m.scope("front truck", () => m.bogie(() => bogieGeometry(m, CC.centre + 0.4, t)));
    m.scope("rear truck", () => m.bogie(() => bogieGeometry(m, -CC.centre - 0.4, t)));
  });
  return m;
}

export function cableCarLod(params?: ParamValues): MeshBuilder {
  const pal = CABLE_LIVERIES[resolveParams(CABLE_CAR_PARAMS, params).livery!]!;
  const t: BogieSpec = freightTruck(0.3, 1.5, CC.floor - 0.15);
  return boxLod({ ...US_PALETTE, ...pal }, -CC.end, CC.end, CC.floor - 0.15, CC.roof + 0.05, CC.half, [[CC.floor - 0.15, 1.55, "ccBody"], [1.55, 2.4, "ccPanel"], [2.4, CC.roof + 0.05, "ccBody"]], "ccRoof", CC.centre + 0.4, t,
    [{ u: [-CC.cabin + 0.25, CC.cabin - 0.25], y: [1.62, 2.32], mat: LOD_GLASS }]);
}

// ---------------------------------------------------------------------------

const wagonGame = (weight: number, variants: GameProperties["variants"] = []): GameProperties => ({ weight, power: 0, maxspeed: 113, accel: null, ...(variants.length ? { variants } : {}) });

export const US_FREIGHT: ProceduralDesign[] = [
  { id: "proc-vehicle-us-caboose", title: "Cupola caboose", build: caboose, buildLod: cabooseLod, params: CABOOSE_PARAMS, finishParams: ["livery"], game: wagonGame(22), catalog: WAGON_CATALOG, loadingGauge: "us", references: "us-caboose" },
  { id: "proc-vehicle-us-boxcar", title: "50 ft boxcar", build: boxcar, buildLod: boxcarLod, params: BOXCAR_PARAMS, finishParams: ["livery"], game: wagonGame(30), catalog: WAGON_CATALOG, loadingGauge: "us", references: "us-boxcar" },
  { id: "proc-vehicle-us-well-car", title: "Double-stack well car", build: wellCar, buildLod: wellCarLod, params: WELL_PARAMS, game: wagonGame(32, [{ params: { cargo: "empty" }, weight: 22 }, { params: { cargo: "double" }, weight: 42 }]), catalog: WAGON_CATALOG, loadingGauge: "usDoubleStack", references: "us-well-car" },
  { id: "proc-vehicle-sf-cable-car", title: "San Francisco cable car", build: cableCar, buildLod: cableCarLod, params: CABLE_CAR_PARAMS, finishParams: ["livery"], game: { weight: 7, power: 40, maxspeed: 15, accel: null }, catalog: TRAM_CATALOG, loadingGauge: "us", references: "sf-cable-car" },
];
