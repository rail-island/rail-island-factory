// The Indian Railways WDM-2 (ALCO DL560C, 1962 - 1998), drawn on its own from
// photographs (assets/ir-wdm2/): the high short hood narrower than the cab, its
// face with the round twin headlight at the top, the chevron and the louvred grille
// between louvred cheeks; the full-width cab with a door in its front wall each
// side of the short hood, the sliding side window and the rounded roof; the long
// hood with the ALCO dynamic brake vents behind the cab, the hood doors, the
// exhaust stack, the radiator's big side grilles at its rear and the raised fan
// hatch over them; the end door, headlight and chevron of the long hood end; the
// deep frame, the buffer beams with side buffers, screw couplings and the bar
// cattle guards; and the ALCO asymmetric cast trimount trucks. Measures from the
// published figures (17.12 m over the buffers, 12.834 m total wheelbase, 1,092 mm
// wheels, 4.185 m high) and the photographs; docs/models/india-trains.md.
// The hood unit kit (usHoodKit.ts) lends its painted sweeps, decals, lettering
// and the distant model. +X is the short hood ("F") end.

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block, buffers, coil, coupling, exhaust, extrude, horn, paint, plate, roofFan, side, tankX } from "./dieselParts.ts";
import { US_PALETTE, decalX, decalZ, endText, paintedSweep, sideText, usHoodLod, type Paint, type UsHoodSpec, type UsLivery } from "./usHoodKit.ts";

// ---------------------------------------------------------------------------
// Measures. Published: 17.12 m over the buffers, 12.834 m between the outer
// axles, 1,092 mm wheels, 4.185 m over the rail, 2.864 m wide. Measured along the
// side of 18040 (a one-dimensional projective fit on the long hood's converging
// roof and deck lines) and on the head-on view of 16881 (buffer centres 1.956 m):
// the short hood's face 0.46 m behind the headstock, the cab 3.50 - 6.10 m, the
// long hood's end 6.85 m behind the middle, the radiator grilles its last 2.4 m,
// the exhaust 1.25 m behind the middle; the short hood 1.9 m wide, 2.45 m over
// the deck; the trucks' axles 1.88 m and 2.15 m apart, the short gap outward.

const L = 7.94; // the headstock faces
const BUFFER = 17.12 / 2; // the buffer heads
const DECK = 1.5, SILL = 1.1, DECK_HALF = 1.45;
const HOOD_TOP = 3.95;
const SHORT = { x0: 6.1, x1: 7.48, half: 0.95, r: 0.12, chamfer: 0.18 };
const CAB = { x0: 3.5, x1: 6.1, half: 1.43, eave: 3.9, top: 4.185, foot: 1.22 };
const LONG = { x0: -6.85, x1: 3.5, half: 1.0, r: 0.14 };
const RADIATOR = { x0: -6.75, x1: -4.45, hatch: 0.14 };
const EXHAUST_X = -1.25;
/** The engine room's small side windows (x spans). */
const HOOD_WINDOWS: ReadonlyArray<readonly [number, number]> = [[2.75, 3.15], [-3.95, -3.65], [-4.3, -4.0]];
const WHEEL_R = 1.092 / 2;
/** The axles' x from the middle, front truck; the rear truck mirrors them. */
const AXLES = [6.417, 4.537, 2.387] as const;
const TRUCK_C = (AXLES[0] + AXLES[2]) / 2;
const BEAM = { y0: 0.78, buffer: 1.105, spacing: 1.956 };

/** The kit's measures of the same body: the distant model (usHoodLod) is drawn from them. */
export const WDM2_BODY: UsHoodSpec = {
  length: 17.12, endSill: L, deck: DECK, sillBottom: SILL, deckHalf: DECK_HALF,
  hood: { x0: LONG.x0, x1: LONG.x1, half: LONG.half, top: HOOD_TOP, r: LONG.r },
  front: { kind: "highHood", x0: SHORT.x0, x1: SHORT.x1 },
  cab: { x0: CAB.x0, x1: CAB.x1, half: CAB.half, top: CAB.top, kind: "classic" },
  radiator: { x0: RADIATOR.x0, x1: RADIATOR.x1, kind: "grilles", fans: [-5.6], fanR: 0.62 },
  exhaustX: EXHAUST_X,
  trucks: {
    centre: TRUCK_C, sideFrame: "htc",
    spec: { axles: [AXLES[0] - TRUCK_C, AXLES[1] - TRUCK_C, AXLES[2] - TRUCK_C], wheelR: WHEEL_R, frameHalf: 2.45, frameTop: 1.05, frameBottom: 0.5, frameZ: [0.92, 1.08], primary: "coil", secondary: [], secondaryZ: 1.0, bolster: 1.1 },
  },
  tank: { x0: -1.75, x1: 1.75, y0: 0.5, half: 1.0 },
  ditchLights: false,
};

// ---------------------------------------------------------------------------
// Paint

export interface Wdm2Livery extends UsLivery {
  /** The chevron on both hood ends: its paint and the heights of its arms at the corners and at the point. */
  chevron: readonly [mat: string, yCorner: number, yPoint: number];
  /** The headstocks' paint. */
  beam: string;
  /** Where the running number stands on the long hood (x, base height, letter height). */
  hoodNumber: readonly [number, number, number];
}

const RAIL_YELLOW = paint("#d8ac24", 0.5);

/**
 * The 1980s-90s maroon (16090, 16537 at Muzaffarpur, 1993): maroon all over with a
 * cream-yellow line along the hoods and cab and a chevron on both ends; the cab roof grey.
 */
function maroon(): Wdm2Livery {
  const body: Band[] = [[0, 3.42, "irBody"], [3.42, 3.5, "irBand"], [3.5, 9, "irBody"]];
  return {
    title: "Maroon, cream", railroad: "", letterH: 0.3, letterY: 1.0, number: "16090",
    palette: { irBody: paint("#6a2124", 0.6), irBand: paint("#e2c46a"), irRoof: paint("#5b2022", 0.7), irCabRoof: paint("#8f9396", 0.5), irFrame: paint("#242526", 0.85), irBeam: paint("#7a2422", 0.6), irRail: RAIL_YELLOW },
    body, roof: "irRoof", cabRoof: "irCabRoof", frame: "irFrame",
    trucks: "underframe", pilot: "irFrame", letter: "irBand", numberMat: "irBand", rails: "irRail",
    chevron: ["irBand", 3.42, 2.72], beam: "irBeam", hoodNumber: [1.4, 2.62, 0.42],
  };
}

/**
 * Blue and cream (17970 at Secunderabad): dark blue up to the walkway rail, cream
 * over the upper body, a dark blue band under the roof edge, a blue chevron on the
 * ends; the headstocks red, the cab roof grey. Running number 16887, the last WDM-2.
 */
function blue(): Wdm2Livery {
  const body: Band[] = [[0, 2.42, "irBody"], [2.42, 3.5, "irBand"], [3.5, 9, "irBody"]];
  return {
    title: "Blue, cream", railroad: "", letterH: 0.3, letterY: 1.0, number: "16887",
    palette: { irBody: paint("#1f3462", 0.55), irBand: paint("#dcd8b8"), irRoof: paint("#2a3550", 0.7), irCabRoof: paint("#8f9396", 0.5), irFrame: paint("#242526", 0.85), irBeam: paint("#a8322a", 0.6), irRail: RAIL_YELLOW },
    body, roof: "irRoof", cabRoof: "irCabRoof", frame: "irFrame",
    trucks: "underframe", pilot: "irFrame", letter: "irBody", numberMat: "irBody", rails: "irRail",
    chevron: ["irBody", 3.42, 2.7], beam: "irBeam", hoodNumber: [1.4, 2.62, 0.42],
  };
}

/** The WDM-2's schemes by the `livery` value (keys and titles as shipped). */
export const WDM2_LIVERIES: Record<string, Wdm2Livery> = { maroon: maroon(), blue: blue() };

// ---------------------------------------------------------------------------
// Helpers

function matAt(bands: readonly Band[], y: number): string {
  for (const b of bands) if (y >= b[0] - 1e-9 && y < b[1] - 1e-9) return b[2];
  return bands[bands.length - 1]![2];
}

/** A hood's section: a box with chamfered roof corners from the deck. */
function hoodSection(y0: number, half: number, top: number, r: number): Array<[number, number]> {
  return [[-half, y0], [half, y0], [half, top - r], [half - r, top], [-(half - r), top], [-half, top - r]];
}

/** Louvres on the side wall z = s * zw: a dark recess with slats across it. */
function louvres(m: MeshBuilder, slat: string, s: number, zw: number, x0: number, x1: number, y0: number, y1: number, pitch = 0.08): void {
  decalZ(m, "louvre", s * (zw + 0.004), s, x0, x1, y0, y1);
  for (let y = y0 + pitch * 0.6; y < y1 - pitch * 0.3; y += pitch) decalZ(m, slat, s * (zw + 0.008), s, x0 + 0.02, x1 - 0.02, y, y + pitch * 0.42);
}

/** Louvres on the end face x = e * xf, across z0..z1. */
function endLouvres(m: MeshBuilder, slat: string, e: number, xf: number, z0: number, z1: number, y0: number, y1: number, pitch = 0.075): void {
  decalX(m, "louvre", e * (xf + 0.004), e, z0, z1, y0, y1);
  for (let y = y0 + pitch * 0.6; y < y1 - pitch * 0.3; y += pitch) decalX(m, slat, e * (xf + 0.008), e, z0 + 0.02, z1 - 0.02, y, y + pitch * 0.42);
}

/** The chevron on the end face x = e * xf (half width hw): two arms from the corners down to a point on the middle. */
function chevron(m: MeshBuilder, l: Wdm2Livery, e: number, xf: number, hw: number): void {
  const [mat, yc, yp] = l.chevron;
  const t = 0.09, x = e * (xf + 0.006);
  const pts: Vec3[] = [];
  for (const sd of [-1, 1]) {
    const q: Vec3[] = [[x, yc, sd * hw], [x, yp, 0], [x, yp + t * 1.4, 0], [x, yc + t, sd * hw]];
    // wound to face +X on e > 0
    const w = e * sd > 0 ? [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!] : [q[0]!, q[2]!, q[1]!, q[0]!, q[3]!, q[2]!];
    pts.push(...w);
  }
  m.facets(mat, pts, [e, 0, 0]);
}

/** A round lamp housing standing on the face x = e * xf: rim, and lenses at the given z offsets. */
function lampHousing(m: MeshBuilder, e: number, xf: number, z: number, y: number, r: number, lenses: readonly number[], lens = "lampHead"): void {
  const o = (a: number, b: number): [number, number] => (e > 0 ? [xf + a, xf + b] : [-xf - b, -xf - a]);
  extrude(m, "black", "x", ngon(12, r, 0, z, y), o(-0.01, 0.12));
  extrude(m, "steel", "x", ngon(12, r * 0.86, 0, z, y), o(0.12, 0.13));
  for (const dz of lenses) extrude(m, lens, "x", ngon(10, r * 0.36, 0, z + dz, y), o(0.13, 0.14));
}

// ---------------------------------------------------------------------------
// The design

export function buildWdm2(l: Wdm2Livery): MeshBuilder {
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  m.scope("frame", () => frame(m, l));
  m.scope("long hood", () => longHood(m, l));
  m.scope("front", () => shortHood(m, l));
  m.scope("cab", () => cab(m, l));
  m.scope("walkways", () => walkways(m, l));
  m.scope("trucks", () => {
    m.scope("front truck", () => trimount(m, 1, l));
    m.scope("rear truck", () => trimount(m, -1, l));
  });
  m.scope("underframe", () => underframe(m, l));
  return m;
}

/** The distant model: the kit's hood unit LOD on the WDM-2's measured body. */
export function wdm2Lod(l: Wdm2Livery): MeshBuilder {
  return usHoodLod(WDM2_BODY, l);
}

function frame(m: MeshBuilder, l: Wdm2Livery): void {
  m.scope("deck", () => {
    block(m, "walk", -L, L, DECK - 0.04, DECK, -DECK_HALF, DECK_HALF);
    const sill: Ring = [[-DECK_HALF, SILL], [DECK_HALF, SILL], [DECK_HALF, DECK - 0.04], [-DECK_HALF, DECK - 0.04]];
    m.sweep(l.frame, "x", sill, -(L - 0.3), sill, L - 0.3);
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the headstock: a deep beam across the end, painted, the number and class on it
      m.scope("headstock", () => {
        block(m, l.beam, ...along(L - 0.3, L), BEAM.y0, DECK - 0.04, -DECK_HALF, DECK_HALF);
        endText(m, "white", l.number, e, L + 0.002, e * 0.62, 1.2, 0.14, 0.08, 0.025);
        endText(m, "white", "WDM2", e, L + 0.002, e * -0.62, 1.2, 0.14, 0.08, 0.025);
        // marker lamps at the beam's outer ends
        for (const sd of [-1, 1]) {
          block(m, "black", ...along(L, L + 0.08), 1.22, 1.42, sd * 1.22 - 0.1, sd * 1.22 + 0.1);
          extrude(m, sd * e > 0 ? "lampRed" : "lampHead", "x", ngon(8, 0.06, 0, sd * 1.22, 1.32), along(L + 0.08, L + 0.09));
        }
      });
      m.scope("buffers", () => buffers(m, e, L, BUFFER, BEAM.buffer, "round", BEAM.spacing));
      m.scope("coupling", () => coupling(m, e, L, BEAM.buffer, 0.4));
      // the cattle guard: a frame of flat bars under the headstock, leaning back to the rail clearance
      m.scope("cattle guard", () => {
        const foot = 0.16, top = BEAM.y0;
        const xAt = (y: number) => L + 0.12 - (0.22 * (top - y)) / (top - foot);
        for (const y of [foot, foot + 0.16, foot + 0.32, foot + 0.48]) block(m, "underframe", ...along(xAt(y) - 0.05, xAt(y)), y, y + 0.05, -1.2, 1.2);
        for (const z of [-1.2, -0.6, 0, 0.6, 1.2]) {
          const q: Vec3[] = [[e * xAt(foot), foot, z - 0.03], [e * (L - 0.1), foot, z - 0.03], [e * (L - 0.1), top, z - 0.03], [e * xAt(top), top, z - 0.03]];
          m.slab("underframe", e > 0 ? q : [q[0]!, q[3]!, q[2]!, q[1]!], [0, 0, 0.06]);
        }
      });
      // the corner steps: three treads hung under each corner of the deck
      m.scope("steps", () => {
        for (const sd of [-1, 1]) {
          const z: [number, number] = side(sd, DECK_HALF - 0.55, DECK_HALF - 0.04);
          for (const y of [0.5, 0.86]) block(m, "steel", ...along(L - 0.82, L - 0.36), y, y + 0.03, ...z);
          for (const xx of [L - 0.84, L - 0.34]) block(m, l.frame, ...along(xx - 0.02, xx + 0.02), 0.44, SILL, ...z);
          for (const xx of [L - 0.86, L - 0.32]) m.rod(l.rails, [e * xx, 0.6, sd * (DECK_HALF + 0.03)], [e * xx, DECK + 1.0, sd * (DECK_HALF + 0.03)], 0.018, 6);
        }
      });
    });
}

function longHood(m: MeshBuilder, l: Wdm2Livery): void {
  const h = LONG, top = HOOD_TOP, zw = h.half;
  const p: Paint = { bands: l.body, ends: l.body, roofFrom: top - h.r * 0.5, roof: l.roof };
  m.scope("hood", () => paintedSweep(m, "x", hoodSection(DECK, h.half, top, h.r), h.x0, h.x1, p, [-1]));
  // the radiator: big louvred grilles high on each side at the rear, the fan hatch over them
  m.scope("radiator", () => {
    for (const sd of [-1, 1]) {
      decalZ(m, "louvre", sd * (zw + 0.004), sd, RADIATOR.x0 + 0.1, RADIATOR.x1, DECK + 0.45, top - h.r - 0.06);
      for (let x = RADIATOR.x0 + 0.17; x < RADIATOR.x1 - 0.05; x += 0.1) decalZ(m, "grille", sd * (zw + 0.008), sd, x, x + 0.035, DECK + 0.47, top - h.r - 0.08);
      decalZ(m, "grille", sd * (zw + 0.008), sd, RADIATOR.x0 + 0.1, RADIATOR.x1, (DECK + top) / 2 + 0.2, (DECK + top) / 2 + 0.24);
    }
    const hs = hoodSection(top - 0.02, h.half - 0.12, top + RADIATOR.hatch, 0.05);
    paintedSweep(m, "x", hs, RADIATOR.x0 + 0.1, RADIATOR.x1, { bands: [[0, 9, l.roof]], roofFrom: top + RADIATOR.hatch - 0.03, roof: l.roof });
    roofFan(m, -5.6, 0, top + RADIATOR.hatch, 0.62);
  });
  // the dynamic brake vents high on the hood behind the cab, the engine room's windows
  m.scope("vents", () => {
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x0 = 1.45 + i * 0.62;
        louvres(m, "grille", sd, zw, x0, x0 + 0.56, top - 0.68, top - h.r - 0.08);
      }
      for (const [x0, x1] of HOOD_WINDOWS) {
        decalZ(m, "rubber", sd * (zw + 0.004), sd, x0, x1, 2.55, 3.0);
        decalZ(m, "glass", sd * (zw + 0.008), sd, x0 + 0.03, x1 - 0.03, 2.58, 2.97);
      }
    }
  });
  m.scope("exhaust", () => {
    block(m, "black", EXHAUST_X - 0.4, EXHAUST_X + 0.4, top - 0.02, top + 0.06, -0.5, 0.5);
    exhaust(m, EXHAUST_X, 0, top + 0.06, top + 0.32, 0.36, 0.78);
  });
  // the hood doors: a seam between each pair and a latch near each door's top
  m.scope("doors", () => {
    const edges: number[] = [];
    for (let x = RADIATOR.x1 + 0.08; x <= 3.3; x += 0.82) edges.push(x);
    for (const sd of [-1, 1]) {
      const zz = sd * (zw + 0.004);
      for (const x of edges) {
        if (HOOD_WINDOWS.some(([a, b]) => x > a - 0.03 && x < b + 0.03)) continue;
        const yTop = x > 1.4 ? top - 0.74 : top - h.r - 0.1;
        decalZ(m, "black", zz, sd, x - 0.01, x + 0.01, DECK + 0.08, yTop);
      }
      for (let i = 0; i + 1 < edges.length; i++) {
        const xc = (edges[i]! + edges[i + 1]!) / 2;
        if ((xc > -4.4 && xc < -3.6) || (xc > 2.7 && xc < 3.2)) continue;
        decalZ(m, "black", zz, sd, xc - 0.05, xc + 0.05, DECK + 1.5, DECK + 1.55);
      }
    }
  });
  m.scope("lettering", () => {
    for (const sd of [-1, 1]) sideText(m, l.numberMat, l.number, sd, zw + 0.012, l.hoodNumber[0], l.hoodNumber[1], l.hoodNumber[2]);
  });
  m.scope("handrails", () => {
    // the grab rail along each side of the hood under the roof edge
    for (const sd of [-1, 1]) {
      const z = sd * (zw + 0.07), y = top - 0.48;
      tubeX(m, l.rails, 0.016, h.x0 + 0.3, y, z, h.x1 - 0.2, y, z, 6);
      for (const x of [h.x0 + 0.35, -3.0, 0.0, h.x1 - 0.25]) m.rod(l.rails, [x, y, z], [x, y, sd * zw], 0.012, 4, false);
    }
  });
  m.scope("rear end", () => hoodEnd(m, l, -1, -h.x0, h.half, top));
}

/** A hood's end face at x = e * xf: the headlight at the top, the chevron, the door and the marker lamps. */
function hoodEnd(m: MeshBuilder, l: Wdm2Livery, e: number, xf: number, hw: number, top: number): void {
  m.scope("headlight", () => {
    lampHousing(m, e, xf, 0.08, top - 0.32, 0.2, [-0.07, 0.07]);
    lampHousing(m, e, xf, -0.48, top - 0.3, 0.1, [0], "lampRed");
  });
  m.scope("chevron", () => chevron(m, l, e, xf, hw - 0.02));
  m.scope("door", () => {
    // the end door to the engine room: seams, a small window, the handle
    const z0 = -0.33, z1 = 0.33, y0 = DECK + 0.08, y1 = DECK + 1.95;
    for (const z of [z0, z1]) decalX(m, "black", e * (xf + 0.003), e, z - 0.01, z + 0.01, y0, y1);
    decalX(m, "black", e * (xf + 0.003), e, z0, z1, y1 - 0.01, y1 + 0.01);
    decalX(m, "rubber", e * (xf + 0.003), e, -0.18, 0.18, DECK + 1.35, DECK + 1.75);
    decalX(m, "glass", e * (xf + 0.007), e, -0.15, 0.15, DECK + 1.38, DECK + 1.72);
    block(m, "steel", ...(e > 0 ? [xf, xf + 0.05] as [number, number] : [-xf - 0.05, -xf] as [number, number]), DECK + 0.95, DECK + 1.0, z1 - 0.14, z1 - 0.05);
  });
  m.scope("grab irons", () => {
    for (const sd of [-1, 1]) m.rod(l.rails, [e * (xf + 0.08), DECK + 0.3, sd * 0.52], [e * (xf + 0.08), DECK + 1.9, sd * 0.52], 0.016, 4);
    for (const sd of [-1, 1]) for (const y of [DECK + 0.3, DECK + 1.9]) m.rod(l.rails, [e * (xf + 0.08), y, sd * 0.52], [e * xf, y, sd * 0.52], 0.012, 4, false);
  });
}

function shortHood(m: MeshBuilder, l: Wdm2Livery): void {
  const f = SHORT, top = HOOD_TOP;
  const p: Paint = { bands: l.body, ends: l.body, roofFrom: top - f.r * 0.5, roof: l.roof };
  // the hood box with its top edge chamfered toward the face
  m.scope("short hood", () => {
    paintedSweep(m, "x", hoodSection(DECK, f.half, top, f.r), f.x0, f.x1 - f.chamfer, p, []);
    const prof: Array<[number, number]> = [[f.x1 - f.chamfer, DECK], [f.x1, DECK], [f.x1, top - f.chamfer], [f.x1 - f.chamfer, top]];
    paintedSweep(m, "z", prof, -f.half, f.half, { bands: l.body, ends: l.body, roofFrom: top - 0.01, roof: l.roof }, [-1, 1]);
  });
  m.scope("face", () => {
    const xf = f.x1;
    lampHousing(m, 1, xf, 0.08, top - 0.36, 0.2, [-0.07, 0.07]);
    lampHousing(m, 1, xf, -0.5, top - 0.34, 0.1, [0], "lampRed");
    chevron(m, l, 1, xf, f.half - 0.02);
    // the grille between louvred cheeks over the lower half of the face
    endLouvres(m, "grille", 1, xf, -0.62, 0.62, DECK + 0.06, DECK + 1.0, 0.07);
    decalX(m, "black", xf + 0.012, 1, -0.012, 0.012, DECK + 0.06, DECK + 1.0);
    for (const sd of [-1, 1]) endLouvres(m, matAt(l.body, DECK + 0.5), 1, xf, ...side(sd, 0.68, 0.9), DECK + 0.1, DECK + 0.96, 0.06);
    // the grab rail across the face and its two posts
    const y = top - 0.66;
    m.rod(l.rails, [xf + 0.08, y, -0.85], [xf + 0.08, y, 0.85], 0.016, 4);
    for (const sd of [-1, 1]) m.rod(l.rails, [xf + 0.08, y, sd * 0.85], [xf, y, sd * 0.85], 0.012, 4, false);
  });
  m.scope("side doors", () => {
    for (const sd of [-1, 1]) {
      const zz = sd * (f.half + 0.004);
      for (const x of [f.x0 + 0.12, f.x0 + 0.72]) decalZ(m, "black", zz, sd, x - 0.01, x + 0.01, DECK + 0.08, top - 0.3);
      decalZ(m, "black", zz, sd, f.x0 + 0.38, f.x0 + 0.48, DECK + 1.3, DECK + 1.35);
      // the grab rail along the side
      const z = sd * (f.half + 0.07), yy = top - 0.66;
      m.rod(l.rails, [f.x0 + 0.2, yy, z], [f.x1 - 0.12, yy, z], 0.016, 4);
      for (const x of [f.x0 + 0.2, f.x1 - 0.12]) m.rod(l.rails, [x, yy, z], [x, yy, sd * f.half], 0.012, 4, false);
    }
  });
}

function cab(m: MeshBuilder, l: Wdm2Livery): void {
  const c = CAB;
  const roof = l.cabRoof ?? l.roof;
  const bands = l.cab ?? l.body;
  // the rounded roof from the eaves to the crown
  const sec: Array<[number, number]> = [[-c.half, c.foot], [c.half, c.foot], [c.half, c.eave], [c.half - 0.15, c.eave + 0.13], [c.half - 0.5, c.top - 0.04], [0.45, c.top], [-0.45, c.top], [-(c.half - 0.5), c.top - 0.04], [-(c.half - 0.15), c.eave + 0.13], [-c.half, c.eave]];
  m.scope("shell", () => paintedSweep(m, "x", sec, c.x0, c.x1, { bands, ends: bands, roofFrom: c.eave + 0.01, roof }));
  m.scope("gutter", () => {
    for (const sd of [-1, 1]) block(m, roof, c.x0 - 0.04, c.x1 + 0.04, c.eave - 0.02, c.eave + 0.02, ...side(sd, c.half - 0.01, c.half + 0.04));
  });
  // the front wall: a door each side of the short hood, its tall window rounded at the top
  m.scope("front doors", () => {
    for (const sd of [-1, 1]) {
      const [z0, z1] = side(sd, SHORT.half + 0.06, c.half - 0.05);
      decalX(m, "black", c.x1 + 0.003, 1, z0, z1, DECK + 2.12, DECK + 2.14);
      for (const z of [z0, z1]) decalX(m, "black", c.x1 + 0.003, 1, z - 0.01, z + 0.01, DECK + 0.05, DECK + 2.14);
      const [w0, w1] = side(sd, SHORT.half + 0.13, c.half - 0.12);
      const wc = (w0 + w1) / 2, ww = (w1 - w0) / 2;
      const ring = (inset: number): Array<[number, number]> => {
        const r = ww - inset, y0 = DECK + 1.0 + inset, yc = DECK + 1.95 - ww;
        const pts: Array<[number, number]> = [[wc - r, y0], [wc + r, y0]];
        for (let k = 0; k <= 4; k++) { const a = (Math.PI * k) / 4; pts.push([wc + r * Math.cos(a), yc + r * Math.sin(a)]); }
        return pts;
      };
      for (const [mat, inset, d] of [["rubber", 0, 0.004], ["glass", 0.03, 0.008]] as const) {
        const q = ring(inset);
        const pts: Vec3[] = [];
        for (let k = 1; k + 1 < q.length; k++) pts.push([c.x1 + d, q[0]![1], q[0]![0]], [c.x1 + d, q[k + 1]![1], q[k + 1]![0]], [c.x1 + d, q[k]![1], q[k]![0]]);
        m.facets(mat, pts, [1, 0, 0]);
      }
    }
  });
  m.scope("rear windows", () => {
    for (const sd of [-1, 1]) {
      const [z0, z1] = side(sd, LONG.half + 0.08, c.half - 0.08);
      decalX(m, "rubber", c.x0 - 0.004, -1, z0, z1, DECK + 1.15, DECK + 1.95);
      decalX(m, "glass", c.x0 - 0.008, -1, z0 + 0.03, z1 - 0.03, DECK + 1.18, DECK + 1.92);
    }
  });
  // the sliding side window in two panes, the running number and the shed's lettering under it
  m.scope("side windows", () => {
    const xa = 4.15, xb = 5.05, xm = (xa + xb) / 2;
    for (const sd of [-1, 1]) {
      const zz = sd * (c.half + 0.004);
      decalZ(m, "rubber", zz, sd, xa, xb, DECK + 1.12, DECK + 2.02);
      decalZ(m, "glass", zz + sd * 0.004, sd, xa + 0.05, xm - 0.015, DECK + 1.16, DECK + 1.98);
      decalZ(m, "glass", zz + sd * 0.004, sd, xm + 0.015, xb - 0.05, DECK + 1.16, DECK + 1.98);
      sideText(m, l.numberMat, l.number, sd, c.half + 0.008, xm + 0.1, DECK + 0.62, 0.22);
    }
  });
  m.scope("grab irons", () => {
    for (const sd of [-1, 1])
      for (const x of [c.x0 + 0.1, c.x1 - 0.1]) {
        const z = sd * (c.half + 0.06);
        m.rod(l.rails, [x, DECK + 0.2, z], [x, DECK + 1.5, z], 0.016, 4);
        for (const y of [DECK + 0.2, DECK + 1.5]) m.rod(l.rails, [x, y, z], [x, y, sd * c.half], 0.012, 4, false);
      }
  });
  m.scope("horns", () => {
    horn(m, 1, c.x1 - 0.35, 0.85, c.top - 0.02);
    horn(m, -1, c.x1 - 0.55, 0.85, c.top - 0.02);
  });
}

function walkways(m: MeshBuilder, l: Wdm2Livery): void {
  const y = DECK + 1.0, yMid = DECK + 0.5, z = DECK_HALF - 0.03;
  // along the long hood from the cab to the rear platform, and beside the short hood
  const runs: Array<[number, number]> = [[-L + 0.3, CAB.x0 - 0.1], [CAB.x1 + 0.1, L - 0.3]];
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      for (const [a, b] of runs) {
        const zc = sd * z;
        tubeX(m, l.rails, 0.02, a, y, zc, b, y, zc, 6);
        tubeX(m, l.rails, 0.016, a, yMid, zc, b, yMid, zc, 6);
        const n = Math.max(1, Math.round((b - a) / 1.6));
        for (let i = 0; i <= n; i++) m.prism(l.rails, ngon(6, 0.022, 0, a + ((b - a) * i) / n, zc), DECK, y);
      }
    });
  m.scope("end rails", () => {
    for (const e of [1, -1]) {
      const x = e * (L - 0.06);
      for (const sd of [-1, 1]) {
        m.rod(l.rails, [x, y, sd * 0.6], [x, y, sd * z], 0.02, 6);
        m.prism(l.rails, ngon(6, 0.022, 0, x, sd * 0.6), DECK, y);
      }
    }
  });
}

/**
 * An ALCO asymmetric trimount truck under end e: three axles, the short gap
 * outward; a cast side frame whose top chord runs over the journal boxes and whose
 * lower edge sweeps down in arches between them, coil nests standing on the
 * frame beside the middle axle, nose-hung motors, brake cylinders.
 */
function trimount(m: MeshBuilder, e: number, l: Wdm2Livery): void {
  const mat = l.trucks;
  const xs = AXLES.map((a) => e * a);
  const xc = e * TRUCK_C;
  const N = 20, R = WHEEL_R, ay = R * Math.cos(Math.PI / N);
  const fz0 = 0.92, fz1 = 1.08;
  m.bogie(() => {
    for (const x of xs)
      m.scope("wheelset", () => {
        const axle = ngon(8, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -0.9, axle, 0.9);
        for (const sd of [-1, 1]) {
          extrude(m, "steel", "z", ngon(N, R, Math.PI / N, x, ay), side(sd, 0.665, 0.8));
          extrude(m, "wheel", "z", ngon(16, R * 0.82, 0, x, ay), side(sd, 0.8, 0.815));
        }
      });
    const sorted = [...xs].sort((a, b) => a - b);
    const x0 = sorted[0]! - 0.55, x1 = sorted[2]! + 0.55;
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right frame" : "left frame", () => {
        const z = side(sd, fz0, fz1);
        // the top chord, stepping down at the ends over the outer boxes
        const top: Ring = [[x0, 0.98], [x0 + 0.35, 1.06], [x1 - 0.35, 1.06], [x1, 0.98]];
        const topIn: Ring = [[x0, 0.86], [x0 + 0.35, 0.9], [x1 - 0.35, 0.9], [x1, 0.86]];
        plate(m, mat, top, topIn, ...z);
        // the lower member: sweeping down between the axles, up over each journal box
        const low: Ring = [], lowIn: Ring = [];
        for (let i = 0; i < 3; i++) {
          const a = sorted[i]!;
          low.push([a - 0.26, ay + 0.2], [a + 0.26, ay + 0.2]);
          lowIn.push([a - 0.26, ay + 0.32], [a + 0.26, ay + 0.32]);
          if (i < 2) {
            const b = sorted[i + 1]!, mid = (a + b) / 2, w = (b - a) / 2 - 0.26;
            for (const t of [-0.6, 0, 0.6]) {
              const yy = 0.42 + 0.12 * Math.abs(t);
              low.push([mid + t * w, yy]);
              lowIn.push([mid + t * w, yy + 0.14]);
            }
          }
        }
        plate(m, mat, low, lowIn, ...z);
        // the columns tying the lower member to the chord between the axles
        for (let i = 0; i < 2; i++) {
          const mid = (sorted[i]! + sorted[i + 1]!) / 2;
          for (const d of [-0.32, 0.32]) block(m, mat, mid + d - 0.05, mid + d + 0.05, 0.5, 0.9, ...z);
        }
        for (const x of sorted) {
          // the pedestal jaws and the journal box with its lid
          for (const d of [-1, 1]) block(m, mat, x + d * 0.22 - 0.04, x + d * 0.22 + 0.04, ay - 0.18, 0.9, ...z);
          block(m, "bogie", x - 0.17, x + 0.17, ay - 0.17, ay + 0.19, ...side(sd, 0.82, fz1 + 0.03));
          extrude(m, "spring", "z", ngon(8, 0.1, Math.PI / 8, x, ay), side(sd, fz1 + 0.03, fz1 + 0.06));
        }
        // the coil nests standing on the frame between the axles, under the body's pads
        for (let i = 0; i < 2; i++) {
          const mid = (sorted[i]! + sorted[i + 1]!) / 2;
          coil(m, "spring", mid, sd * ((fz0 + fz1) / 2), 0.62, 0.86, 0.1, 3, 6);
        }
        // the brake cylinders on the frame's outer face
        for (const x of [sorted[0]! + 0.62, sorted[2]! - 0.62]) extrude(m, "spring", "z", ngon(8, 0.09, Math.PI / 8, x, 0.96), side(sd, fz1, fz1 + 0.12));
      });
    m.scope("bolster", () => block(m, mat, xc - 0.3, xc + 0.3, 0.84, 1.08, -fz0 + 0.02, fz0 - 0.02));
    m.scope("transoms", () => {
      for (const d of [-1, 1]) block(m, mat, xc + d * 1.2 - 0.08, xc + d * 1.2 + 0.08, 0.66, 0.82, -fz0 + 0.02, fz0 - 0.02);
    });
    m.scope("traction motors", () => {
      for (const x of xs) {
        const motor = ngon(10, 0.28, 0, x + (x > xc + 0.1 ? -0.52 : 0.52), ay + 0.04);
        m.sweep("bogie", "z", motor, -0.5, motor, 0.5);
      }
    });
  });
}

function underframe(m: MeshBuilder, l: Wdm2Livery): void {
  const t = WDM2_BODY.tank;
  m.scope("fuel tank", () => {
    const top = SILL - 0.02, hw = t.half;
    const sec: Ring = [[-hw, top], [hw, top], [hw, t.y0 + 0.2], [hw - 0.15, t.y0], [-(hw - 0.15), t.y0], [-hw, t.y0 + 0.2]];
    m.sweep(l.frame, "x", sec, t.x0, sec, t.x1);
    for (const sd of [-1, 1]) block(m, "steel", t.x1 - 0.45, t.x1 - 0.3, top - 0.28, top - 0.12, ...side(sd, hw, hw + 0.04));
  });
  m.scope("air reservoirs", () => {
    for (const sd of [-1, 1]) tankX(m, "tank", -1.7, 1.2, sd * 1.22, 0.86, 0.17);
  });
}

