// Indian Railways' ICF coach (Integral Coach Factory, Perambur, on the Schlieren design, built
// 1955-2018): the non-AC sleeper (SL) and the general unreserved (GS) second class, in the blue
// livery with its pale window band and the older all-maroon one. Measured on photographs of SL and
// GS coaches (assets/ir-icf-coach/SOURCES.md) and drawn on the passenger car builder (usTransit.ts
// drawCar) with the coach's own layout: the published 21.337 m body over 22.3 m buffers, 3.25 m
// wide, 4.025 m high, the ICF all-coil bogies 14.783 m apart (2.896 m wheelbase, 915 mm wheels);
// the toilet window at each end, the door beside it with its grab rails and hanging steps, the 18
// barred windows at 0.91 m pitch, the yellow end stripes, the roof's water-tank hatches.
// See docs/models/india-trains.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE } from "./carbodyKit.ts";
import { sideDecal, sideLettering, sidePanel, surfaceDisc, surfacePoint, type SliceBody } from "./sliceBody.ts";
import type { Pt } from "./sliceLoft.ts";
import { carLodBody, drawCar, truckSpec, type CarDef } from "./usTransit.ts";
import { bogieParts, fitUnit } from "./lodUnits.ts";
import type { CoachLivery, WorldCoach } from "./worldCoaches.ts";

const c = (hex: string, r = 0.45) => paint(hex, r);

/** The pale window band (the photographs: 0.81 m deep, its foot 0.15 m under the sills, its top 0.07 m over the heads). */
const BAND = [2.0, 2.82] as const;
const ROOF = c("#b8bcbe", 0.55), SKIRT = c("#26282b", 0.8);

export const IR_ICF: WorldCoach = {
  length: 22.3, W: 1.605, Y: 1.3, S: 3.55, C: 4.025, B: 1.0, A: 1.12, rows: [[2.15, 2.76]], doorIn: 1.52, doorW: 0.76, door: [1.15, 3.3],
  bogieCentres: 14.783, wheelR: 0.4575, wheelbase: 2.896, coupler: "buffers", maxspeed: 110,
  types: {
    sleeper: { title: "Sleeper class", windows: 18, windowW: 0.66, number: "NR 05281", weight: 48 },
    general: { title: "General class", windows: 18, windowW: 0.66, number: "WR 04555", weight: 46 },
  },
  liveries: {
    // dark blue with the pale blue band round the windows, the toilet windows and the doors
    blue: { title: "IR blue", palette: { blue: c("#1f3d7c"), pale: c("#93c1ca", 0.5), roofG: ROOF, skirtG: SKIRT }, bands: [[0, BAND[0], "blue"], [BAND[0], BAND[1], "pale"], [BAND[1], 9, "blue"]], roof: "roofG", skirt: "skirtG" },
    // the older scheme: maroon all over, the silver roof
    maroon: { title: "Maroon", palette: { maroon: c("#85232a"), roofG: ROOF, skirtG: SKIRT }, bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG" },
  },
};

/** The body over its ends (21.337 m): the buffer faces 0.48 m beyond it. */
const L = 21.337;
const GAP = (IR_ICF.length - L) / 2;
const X = (d: number) => L / 2 - d;

/**
 * A car's openings, d from each end (both ends alike), from a projective fit along a sleeper's side
 * (18 windows, 0.91 m pitch, 0.66 m wide, the first centred 2.93 m from the end): the toilet window
 * 0.18-0.86 m in, the door 1.52-2.28 m.
 */
const PITCH = 0.91, FIRST = 2.93;
const DOOR = [1.52, 2.28] as const;
const TOILET = [0.18, 0.86] as const, TOILET_Y = [2.12, 2.74] as const;
const SILL = 2.15, HEAD = 2.76;
const mirror = (sp: readonly [number, number]): Array<readonly [number, number]> => [[sp[0], sp[1]], [L - sp[1], L - sp[0]]];

/** The windows with their louvred shutter down: most of a sleeper's (the photographs), a few of a general coach's. */
const shut = (unit: string, i: number, s: number): boolean => (unit === "sleeper" ? (i * 5 + (s > 0 ? 1 : 3)) % 7 < 4 : (i * 5 + (s > 0 ? 2 : 4)) % 9 < 2);

const PALETTE: Record<string, MaterialSpec> = {
  ...INTERIOR_PALETTE, ...CARBODY_PALETTE,
  under: c("#2a2c2f", 0.85), lettering: c("#e9dfbf", 0.5), frost: c("#d9dedf", 0.3), shutter: c("#aeb6bd", 0.4), slat: c("#7f878e", 0.5), bar: c("#c3c7ca", 0.3),
  frameAlu: c("#9da3a8", 0.35), endYellow: c("#e7ad1f", 0.45), rail: c("#a7abae", 0.35), steps: c("#3c3e42", 0.7), underBox: c("#3f4246", 0.75), bellows: c("#1c1d1f", 0.9),
  endDoor: c("#3b3e43", 0.6), hatch: c("#a4a8ab", 0.55), board: c("#f0c11e", 0.45), boardText: c("#a3241b", 0.5), emblemRed: c("#c9372a", 0.45), emblemW: c("#f1efe8", 0.4), lampRed: c("#b01818", 0.4),
};

function icfDef(unit: string, l: CoachLivery, lod: boolean): CarDef {
  const s = IR_ICF, t = s.types[unit]!;
  const tr = [L / 2 - s.bogieCentres / 2, L / 2 + s.bogieCentres / 2];
  const reach = s.wheelbase / 2 + s.wheelR + 0.25;
  const row = Array.from({ length: t.windows }, (_, i): [number, number] => { const d = FIRST + i * PITCH; return [d - t.windowW / 2, d + t.windowW / 2]; });
  // the roof's arc rolls down into the flat end walls; the corners square in plan
  const endCap = { len: 0.05, tip: 0.97, power: 2, C: [[0, 3.66], [0.08, 3.84], [0.2, 3.95], [0.38, 4.01], [0.6, 4.025]] as Pt[], S: [] as Pt[] };
  const base = l.bands[0]![2];
  return {
    spec: {
      length: L, W: s.W, Y: s.Y, S: s.S, C: s.C, lean: 0.99, arc: 6, B: s.B, wl: s.W * 0.96, A: s.A, wa: s.W * 0.99, edges: [], step: 1.0,
      cuts: tr.map((d) => [d - reach, d + reach] as const), front: endCap, rear: endCap,
    },
    bands: l.bands, roof: l.roof, skirt: l.skirt, under: "under",
    ends: { d: 0, bands: l.bands, cap: base },
    windows: [
      { y: [SILL, HEAD], spans: row, frame: "frameAlu", cornerR: 0.1 },
      { y: TOILET_Y, spans: mirror(TOILET), frame: "frameAlu", cornerR: 0.08, glass: "frost" },
    ],
    doors: { spans: mirror(DOOR), y: s.door, glass: [2.18, 2.74], glassW: 0.42, glassCornerR: 0.06 },
    cabEnds: [], diaphragm: null,
    trucks: tr, truck: truckSpec(s.wheelbase, s.wheelR, s.B),
    coupler: "buffers", couplerY: 1.1, gap: [GAP, GAP],
    lettering: [{ text: t.number, d: L - 6.6, y: 3.1, h: 0.17, mat: "lettering" }],
    extras: (m, b, Xb) => { if (!lod) icfExtras(m, b, Xb, unit, l, row, tr); },
  };
}

/** A low hump on the roof's arc on side s from d0 to d1 between heights ya and yb: its sides sloping up to a top `proud` off it. */
function roofHump(m: MeshBuilder, b: SliceBody, Xb: (d: number) => number, s: number, mat: string, d0: number, d1: number, ya: number, yb: number, proud: number): void {
  const dm = (d0 + d1) / 2, k = 0.18 * (yb - ya);
  const pt = (y: number, off: number): Pt => {
    const q = surfacePoint(b, dm, y, s);
    return [s * (q.p[0] + q.n[2] * s * off), q.p[1] + q.n[1] * off];
  };
  const ring: Pt[] = [pt(ya, -0.03), pt(yb, -0.03), pt(yb, 0.004), pt(yb - k, proud), pt(ya + k, proud), pt(ya, 0.004)];
  const dx = Math.abs(Xb(d1) - Xb(d0)) / 2, x = Xb(dm);
  m.sweep(mat, "x", ring, x - dx, ring, x + dx);
}

/** A flat rectangle on the side, `proud` off it: a bar or a shutter's slat (two triangles). */
function sideRect(m: MeshBuilder, b: SliceBody, Xb: (d: number) => number, s: number, mat: string, d0: number, d1: number, y0: number, y1: number, proud: number): void {
  sideDecal(m, b, Xb, s, mat, [[d0, y0], [d1, y0], [d1, y1], [d0, y0], [d1, y1], [d0, y1]], proud);
}

function icfExtras(m: MeshBuilder, b: SliceBody, Xb: (d: number) => number, unit: string, l: CoachLivery, row: ReadonlyArray<readonly [number, number]>, tr: readonly number[]): void {
  const s = IR_ICF;
  const ends = [0, L] as const;
  const fromEnd = (end: number, d: number) => (end === 0 ? d : L - d);
  // the louvred aluminium shutters let down in some windows, the horizontal bars over every window
  m.scope("window shutters", () => {
    for (const sd of [1, -1])
      row.forEach(([a, e], i) => {
        if (!shut(unit, i, sd)) {
          // a general coach's open window: the shutter stowed in its head, its louvre showing
          if (unit === "general") {
            sidePanel(m, b, Xb, sd, "shutter", a + 0.05, e - 0.05, HEAD - 0.2, HEAD - 0.05, 0.016, 0.002);
            sideRect(m, b, Xb, sd, "slat", a + 0.07, e - 0.07, HEAD - 0.135, HEAD - 0.117, 0.02);
          }
          return;
        }
        sidePanel(m, b, Xb, sd, "shutter", a + 0.05, e - 0.05, SILL + 0.05, HEAD - 0.05, 0.016, 0.002);
        sideRect(m, b, Xb, sd, "slat", (a + e) / 2 - 0.012, (a + e) / 2 + 0.012, SILL + 0.06, HEAD - 0.06, 0.02);
        for (let k = 0; k < 5; k++) {
          const y = SILL + 0.1 + k * 0.095;
          sideRect(m, b, Xb, sd, "slat", a + 0.07, e - 0.07, y, y + 0.018, 0.02);
        }
      });
  });
  const bars = unit === "sleeper" ? 5 : 6;
  m.scope("window bars", () => {
    for (const sd of [1, -1])
      for (const [a, e] of row)
        for (let k = 0; k < bars; k++) {
          const y = SILL + 0.08 + ((HEAD - SILL - 0.16) * k) / (bars - 1);
          sideRect(m, b, Xb, sd, "bar", a + 0.02, e - 0.02, y - 0.009, y + 0.009, 0.035);
        }
  });
  // the toilet windows' vertical bars
  m.scope("toilet bars", () => {
    for (const sd of [1, -1])
      for (const [a, e] of mirror(TOILET))
        for (let k = 0; k < 5; k++) {
          const d = a + 0.1 + ((e - a - 0.2) * k) / 4;
          sideRect(m, b, Xb, sd, "bar", d - 0.012, d + 0.012, TOILET_Y[0] + 0.03, TOILET_Y[1] - 0.03, 0.035);
        }
  });
  // the yellow stripe down each end's corner
  m.scope("end stripes", () => {
    for (const end of ends) {
      const P = (d: number, y: number): Pt => [fromEnd(end, d), y];
      const tris: Pt[] = [P(0.015, s.B + 0.02), P(0.085, s.B + 0.02), P(0.085, s.S - 0.03), P(0.015, s.B + 0.02), P(0.085, s.S - 0.03), P(0.015, s.S - 0.03)];
      for (const sd of [1, -1]) sideDecal(m, b, Xb, sd, "endYellow", tris, 0.005);
    }
  });
  // the grab rails either side of each doorway, on short brackets
  m.scope("grab rails", () => {
    for (const [d0, d1] of mirror(DOOR))
      for (const sd of [1, -1])
        for (const d of [d0 - 0.07, d1 + 0.07]) {
          const x = Xb(d);
          block(m, "rail", x - 0.016, x + 0.016, 1.2, 3.0, ...side(sd, s.W + 0.014, s.W + 0.038));
          for (const y of [1.22, 2.96]) block(m, "rail", x - 0.012, x + 0.012, y - 0.015, y + 0.015, ...side(sd, s.W - 0.01, s.W + 0.02));
        }
  });
  // the door leaves' feet down to the floor beside the steps, below the body's flat side
  m.scope("door feet", () => {
    const mat = l.bands[0]![2];
    for (const [d0, d1] of mirror(DOOR))
      for (const sd of [1, -1]) {
        const [a, cc] = [Xb(d0 + 0.02), Xb(d1 - 0.02)].sort((p, q) => p - q) as [number, number];
        block(m, mat, a, cc, s.B - 0.02, s.door[0] + 0.02, ...side(sd, s.W * 0.96 - 0.05, s.W * 0.99 - 0.002));
      }
  });
  // the steps hanging under each door: two stringers and three treads
  m.scope("steps", () => {
    for (const [d0, d1] of mirror(DOOR))
      for (const sd of [1, -1]) {
        const [a, cc] = [Xb(d0 + 0.02), Xb(d1 - 0.02)].sort((p, q) => p - q) as [number, number];
        for (const x of [a, cc - 0.04]) block(m, "steps", x, x + 0.04, 0.3, s.B - 0.02, ...side(sd, 1.36, 1.54));
        for (const y of [0.32, 0.55, 0.78]) block(m, "steps", a + 0.04, cc - 0.04, y, y + 0.035, ...side(sd, 1.3, 1.52));
      }
  });
  // the roof's water-tank hatches: low humps on the arc above each door
  m.scope("roof hatches", () => {
    for (const end of ends)
      for (const sd of [1, -1]) {
        const [d0, d1] = [fromEnd(end, 1.25), fromEnd(end, 2.6)].sort((p, q) => p - q) as [number, number];
        roofHump(m, b, Xb, sd, "hatch", d0, d1, s.S + 0.1, s.S + 0.36, 0.05);
      }
  });
  // the rain gutter along each cant rail
  m.scope("gutters", () => {
    for (const sd of [1, -1]) roofHump(m, b, Xb, sd, "frameAlu", 0.4, L - 0.4, s.S + 0.01, s.S + 0.05, 0.022);
  });
  // the route board over the windows mid-car, its lettering
  m.scope("route board", () => {
    for (const sd of [1, -1]) {
      sidePanel(m, b, Xb, sd, "board", L / 2 - 1.4, L / 2 + 1.4, 2.98, 3.24, 0.03, 0.01);
      sideLettering(m, b, Xb, sd, "MUMBAI - DELHI", L / 2, 3.04, 0.13, "boardText", 0.036);
    }
  });
  // the class name high near the +d end, as painted on the photographs
  m.scope("class lettering", () => {
    const text = unit === "sleeper" ? "SLEEPER" : "GENERAL";
    for (const sd of [1, -1]) sideLettering(m, b, Xb, sd, text, 3.4, 3.12, 0.15, "lettering", 0.008);
  });
  // the Indian Railways roundel on the lower body
  m.scope("emblem", () => {
    for (const sd of [1, -1]) {
      surfaceDisc(m, b, Xb, L * 0.62, 1.55, sd, "emblemRed", 0.17, 0.006, 0.004, 16);
      surfaceDisc(m, b, Xb, L * 0.62, 1.55, sd, "emblemW", 0.11, 0.009, 0.002, 12);
    }
  });
  // the vestibule gangway: bellows standing out toward the buffers round the end door, the tail lamps
  for (const e of [1, -1])
    m.scope(e > 0 ? "front gangway" : "rear gangway", () => {
      const wall = Xb(e > 0 ? 0 : L);
      const [a, cc] = [wall - e * 0.05, wall + e * (GAP - 0.08)].sort((p, q) => p - q) as [number, number];
      for (const sd of [1, -1]) block(m, "bellows", a, cc, 1.2, 3.4, ...side(sd, 0.48, 0.64));
      block(m, "bellows", a, cc, 3.24, 3.48, -0.49, 0.49);
      block(m, "bellows", a, cc, 1.2, 1.32, -0.49, 0.49);
      const [f0, f1] = [wall - e * 0.05, wall + e * 0.006].sort((p, q) => p - q) as [number, number];
      block(m, "endDoor", f0, f1, 1.33, 3.23, -0.47, 0.47);
      const [g0, g1] = [wall + e * 0.008, wall + e * 0.012].sort((p, q) => p - q) as [number, number];
      block(m, "glass", g0, g1, 2.3, 2.9, -0.22, 0.22);
      for (const sd of [1, -1]) {
        const [l0, l1] = [wall + e * 0.002, wall + e * 0.08].sort((p, q) => p - q) as [number, number];
        block(m, "lampRed", l0, l1, 1.5, 1.64, ...side(sd, 1.0, 1.14));
      }
    });
  // the underframe: the battery boxes mid-car, the boxes behind the steps, the brake cylinders, the alternator
  m.scope("underfloor", () => {
    for (const [a, cc, h] of [[-2.6, -0.7, 0.62], [-0.4, 1.5, 0.62], [2.2, 3.4, 0.4]] as const)
      block(m, "underBox", Xb(L / 2 + cc), Xb(L / 2 + a), s.B - h, s.B, -1.05, 1.05);
    for (const end of ends) {
      const [a, cc] = [Xb(fromEnd(end, 0.35)), Xb(fromEnd(end, 1.35))].sort((p, q) => p - q) as [number, number];
      block(m, "underBox", a, cc, s.B - 0.42, s.B, -0.9, 0.9);
    }
    for (const d of [tr[0]! + 2.3, tr[1]! - 2.3]) {
      const x = Xb(d);
      m.sweep("under", "z", ngon(12, 0.2, 0, x, s.B - 0.26), -0.7, ngon(12, 0.2, 0, x, s.B - 0.26), 0.7);
    }
    const xa = Xb(tr[0]! + 1.9);
    block(m, "under", xa - 0.3, xa + 0.3, s.B - 0.5, s.B, 0.3, 0.9);
  });
}

function pick(params: readonly ParamSpec[], v: ParamValues | undefined, lod: boolean): { unit: string; key: string; l: CoachLivery; c: CarDef } {
  const p = resolveParams(params, v);
  const key = p.livery ?? Object.keys(IR_ICF.liveries)[0]!;
  const l = IR_ICF.liveries[key]!;
  return { unit: p.unit!, key, l, c: icfDef(p.unit!, l, lod) };
}

export function icfCoach(params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { l, c: def } = pick(params, v, false);
  const m = new MeshBuilder({ ...PALETTE, ...l.palette });
  drawCar(m, def, X);
  return m;
}

/** The distant model: the body with its bands (the maroon car's shutters as a grey row), and the bogies. */
export function icfCoachLod(params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { key, l, c: def } = pick(params, v, true);
  const body = carLodBody({ ...def, windows: [] }, X);
  const row = def.windows[0]!.spans;
  const windows = key === "maroon" ? [{ u: [X(row[row.length - 1]![1]), X(row[0]![0])] as const, y: [SILL, HEAD] as const, mat: "shutter" }] : [];
  return fitUnit({
    palette: { ...CARBODY_PALETTE, under: PALETTE.under!, shutter: PALETTE.shutter!, ...l.palette },
    // the ends flat walls from afar (the roof's rolled-down end is too small to draw)
    bodies: [{ ...body, front: { tip: [[IR_ICF.B, X(0)]] }, rear: { tip: [[IR_ICF.B, X(L)]] }, windows }],
    parts: [...bogieParts(def.trucks.map((d) => [X(d), def.truck.frameHalf] as const), def.spec.B)],
  }, 100);
}
