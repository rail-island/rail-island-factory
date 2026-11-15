// Indian Railways' LHB coach (Linke-Hofmann-Busch design, built by RCF, ICF and MCF since 2000):
// the AC three-tier sleeper (3A) and the AC chair car, in the Rajdhani, Shatabdi, Humsafar and Tejas
// liveries. Measured on photographs of 3A and chair cars (assets/ir-lhb-coach/SOURCES.md) and drawn on
// the passenger car builder (usTransit.ts drawCar) with the coach's own layout: the published 23.54 m
// body, 3.24 m wide, 4.04 m high, the FIAT bogies 14.9 m apart; one plug door near each end, the
// 3A's toilet window in the end panel beyond it, the chair car's toilet window inside it; the window
// row; the diagonal grey end panels of the red and blue liveries; the two roof-mounted AC packages.
// See docs/models/india-trains.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE } from "./carbodyKit.ts";
import { sideDecal, sideLettering, sidePanel, surfaceDisc, type SliceBody } from "./sliceBody.ts";
import type { Pt } from "./sliceLoft.ts";
import { lodSideBox } from "./lodKit.ts";
import { carLodBody, drawCar, truckSpec, type CarDef } from "./usTransit.ts";
import { bogieParts, fitUnit } from "./lodUnits.ts";
import type { CoachLivery, WorldCoach } from "./worldCoaches.ts";

const c = (hex: string, r = 0.45) => paint(hex, r);

/** The grey lower band's top (the photographs: 0.35 m under the window sills). */
const GREY_TOP = 1.68;
const GREY = c("#a9acae", 0.45), ROOF = c("#b4b7b9", 0.6), SKIRT = c("#8e9193", 0.6);

export const IR_LHB: WorldCoach = {
  length: 24.0, W: 1.62, Y: 1.25, S: 3.55, C: 3.99, B: 0.98, A: 1.12, rows: [[2.02, 2.82]], doorIn: 1.7, doorW: 0.9, door: [1.27, 3.42],
  bogieCentres: 14.9, wheelR: 0.4575, wheelbase: 2.56, coupler: "knuckle", maxspeed: 160,
  types: {
    ac3: { title: "AC three-tier", windows: 9, windowW: 1.16, number: "3A 211303", weight: 47 },
    chairCar: { title: "AC chair car", windows: 8, windowW: 1.38, number: "CC 211251", weight: 45 },
  },
  liveries: {
    // red over the grey band; the end panels' grey rising diagonally to the roof; the doors red
    rajdhani: { title: "Rajdhani", palette: { red: c("#e2342a"), grey: GREY, roofG: ROOF, skirtG: SKIRT }, bands: [[0, GREY_TOP, "grey"], [GREY_TOP, 9, "red"]], doorBands: [[0, 9, "red"]], roof: "roofG", skirt: "skirtG" },
    // the same scheme in the Shatabdi's sky blue
    shatabdi: { title: "Shatabdi", palette: { blue: c("#3d7fd3"), grey: GREY, roofG: ROOF, skirtG: SKIRT }, bands: [[0, GREY_TOP, "grey"], [GREY_TOP, 9, "blue"]], doorBands: [[0, 9, "blue"]], roof: "roofG", skirt: "skirtG" },
    // teal over an orange band with a yellow and a green line on its top
    humsafar: { title: "Humsafar", palette: { teal: c("#20afc2"), orange: c("#ef7d1a"), yellow: c("#f6c21c"), green: c("#3e9a3a"), roofG: ROOF, skirtG: SKIRT }, bands: [[0, 1.42, "orange"], [1.42, 1.55, "yellow"], [1.55, 1.6, "green"], [1.6, 9, "teal"]], roof: "roofG", skirt: "skirtG" },
    // yellow fading to orange down the side
    tejas: { title: "Tejas", palette: { amber: c("#f7a823"), orange: c("#f38a1e"), deep: c("#f07a1c"), roofG: ROOF, skirtG: SKIRT }, bands: [[0, 1.6, "deep"], [1.6, 2.15, "orange"], [2.15, 9, "amber"]], roof: "roofG", skirt: "skirtG" },
  },
};

/** The body over its ends (the photographs scaled on the 23.54 m body): the coupling planes 0.23 m beyond it. */
const L = 23.54;
const GAP = (IR_LHB.length - L) / 2;
const X = (d: number) => L / 2 - d;

/**
 * A car's openings, d from each end (both ends alike): the door, the toilet window (3A: in the end
 * panel beyond the door, louvred over its top; chair car: inside the door, shallow under the cant
 * rail), the window row (equal pitch, centred on the car).
 */
interface Layout { door: readonly [number, number]; toilet: readonly [number, number]; toiletY: readonly [number, number]; pitch: number }
const LAYOUT: Record<string, Layout> = {
  // Tejas 3A side view (projective fit, 9 windows, 1.87 m pitch, windows 0.62 of it): door 1.70-2.60, toilet window 0.55-1.20
  ac3: { door: [1.7, 2.6], toilet: [0.55, 1.2], toiletY: [2.06, 2.94], pitch: 1.87 },
  // Shatabdi chair car (12017 and 12277 views): 8 windows at 1.91 m; the door 1.25 m in, the toilet's shallow window beside it
  chairCar: { door: [1.25, 2.15], toilet: [2.25, 3.5], toiletY: [2.42, 2.86], pitch: 1.91 },
};
const SILL = 2.02, HEAD = 2.82;
const mirror = (sp: readonly [number, number]): Array<readonly [number, number]> => [[sp[0], sp[1]], [L - sp[1], L - sp[0]]];

/** The red and blue liveries' end panel: grey below a line from the door's outer edge at the band's top up to the end below the roof. */
const wedged = (key: string) => key === "rajdhani" || key === "shatabdi";
const WEDGE_TOP = 3.32;

const PALETTE: Record<string, MaterialSpec> = {
  ...INTERIOR_PALETTE, ...CARBODY_PALETTE,
  under: c("#2a2c2f", 0.85), lettering: c("#2a2c30"), classText: c("#1f2f6e"), frost: c("#dfe3e4", 0.3), louvre: c("#2b2e31", 0.7),
  endWall: c("#7f8386", 0.6), endDoor: c("#55595d", 0.6), underBox: c("#4b4e52", 0.75), lampRed: c("#b01818", 0.4), nameText: c("#fbd769", 0.45), bellows: c("#1c1d1f", 0.9), endYellow: c("#f0b912", 0.45), rmpu: c("#9da1a4", 0.55), grille: c("#3a3d40", 0.75),
  tank: c("#c9cbcc", 0.5), emblemRed: c("#d43a20", 0.45), emblemW: c("#f1efe8", 0.4), steps: c("#5d6064", 0.6),
};

function lhbDef(unit: string, liveryKey: string, l: CoachLivery, lod: boolean): CarDef {
  const s = IR_LHB, t = s.types[unit]!, lay = LAYOUT[unit]!;
  const tr = [L / 2 - s.bogieCentres / 2, L / 2 + s.bogieCentres / 2];
  const reach = s.wheelbase / 2 + s.wheelR + 0.25;
  const first = (L - (t.windows - 1) * lay.pitch) / 2;
  const row = Array.from({ length: t.windows }, (_, i): [number, number] => { const d = first + i * lay.pitch; return [d - t.windowW / 2, d + t.windowW / 2]; });
  // the end walls: the roof's crown rolls down into them, the corners rounded in plan
  const endCap = { len: 0.22, tip: 0.9, power: 2, C: [[0, 3.72], [0.12, 3.86], [0.3, 3.94], [0.55, 3.98], [0.8, 3.99]] as Pt[], S: [] as Pt[] };
  const doors = mirror(lay.door);
  const wedge = wedged(liveryKey);
  return {
    spec: {
      length: L, W: s.W, Y: s.Y, S: s.S, C: s.C, lean: 0.995, arc: 6, roofPower: 2.4, B: s.B, wl: s.W * 0.93, A: s.A, wa: s.W * 0.985, edges: [], step: 1.0,
      cuts: tr.map((d) => [d - reach, d + reach] as const), front: endCap, rear: endCap,
    },
    bands: l.bands, roof: l.roof, skirt: l.skirt, under: "under",
    ...(l.doorBands ? { doorBands: l.doorBands } : {}),
    ends: { d: 0, bands: l.bands, cap: "endWall" },
    windows: [
      { y: [SILL, HEAD], spans: row, frame: "rubber", cornerR: 0.1 },
      { y: lay.toiletY, spans: mirror(lay.toilet), frame: "rubber", cornerR: 0.07, glass: "frost" },
    ],
    doors: { spans: doors, y: s.door, glass: [1.95, 3.0], glassW: 0.36, glassCornerR: 0.12 },
    cabEnds: [], diaphragm: null,
    trucks: tr, truck: truckSpec(s.wheelbase, s.wheelR, s.B),
    coupler: "knuckle", couplerY: 1.05, gap: [GAP, GAP],
    lettering: [{ text: t.number, d: lay.door[1] + 1.0, y: 1.42, h: 0.09, mat: "lettering" }],
    extras: (m, b, Xb) => { if (!lod) lhbExtras(m, b, Xb, unit, l, wedge, lay, tr); },
  };
}

function lhbExtras(m: MeshBuilder, b: SliceBody, Xb: (d: number) => number, unit: string, l: CoachLivery, wedge: boolean, lay: Layout, tr: readonly number[]): void {
  const s = IR_LHB;
  const ends = [0, L] as const;
  const fromEnd = (end: number, d: number) => (end === 0 ? d : L - d);
  if (wedge)
    m.scope("end panels", () => {
      for (const end of ends)
        for (const sd of [1, -1]) {
          // in strips that follow the end's rounded corners, then one triangle over the flat side
          const dz = lay.door[0];
          const top = (d: number) => WEDGE_TOP + ((GREY_TOP - WEDGE_TOP) * d) / dz;
          const ds = [0.01, 0.05, 0.1, 0.16, 0.24, dz];
          const tris: Pt[] = [];
          for (let i = 0; i + 1 < ds.length; i++) {
            const [p, q] = [ds[i]!, ds[i + 1]!];
            const P = (d: number, y: number): Pt => [fromEnd(end, d), y];
            if (q < dz) tris.push(P(p, GREY_TOP), P(q, GREY_TOP), P(q, top(q)), P(p, GREY_TOP), P(q, top(q)), P(p, top(p)));
            else tris.push(P(p, GREY_TOP), P(q, GREY_TOP), P(p, top(p)));
          }
          sideDecal(m, b, Xb, sd, "grey", tris, 0.004);
        }
    });
  // the end corners' yellow marking
  m.scope("end markings", () => {
    const strip = (end: number): Pt[] => {
      const P = (d: number, y: number): Pt => [fromEnd(end, d), y];
      return [0.04, 0.08].flatMap((p) => [P(p, 1.15), P(p + 0.04, 1.15), P(p + 0.04, 3.45), P(p, 1.15), P(p + 0.04, 3.45), P(p, 3.45)]);
    };
    for (const end of ends) for (const sd of [1, -1]) sideDecal(m, b, Xb, sd, "endYellow", strip(end), 0.01);
  });
  // the 3A toilet window's louvre over its top
  if (unit === "ac3")
    m.scope("toilet louvres", () => {
      const [y0, y1] = lay.toiletY;
      for (const sp of mirror(lay.toilet))
        for (const sd of [1, -1]) {
          sidePanel(m, b, Xb, sd, "louvre", sp[0] + 0.05, sp[1] - 0.05, y1 - 0.28, y1 - 0.05, 0.014, 0.002);
          for (let i = 0; i < 4; i++) {
            const y = y1 - 0.26 + i * 0.055;
            sidePanel(m, b, Xb, sd, "frameSilver", sp[0] + 0.07, sp[1] - 0.07, y, y + 0.018, 0.017, 0.002);
          }
        }
      void y0;
    });
  // the door leaves' feet beside the steps, below the body's flat side
  m.scope("door feet", () => {
    const mat = l.doorBands?.[0]?.[2] ?? l.bands[0]![2];
    for (const [d0, d1] of mirror(lay.door))
      for (const sd of [1, -1]) {
        const [a, cc] = [Xb(d0 + 0.02), Xb(d1 - 0.02)].sort((p, q) => p - q) as [number, number];
        block(m, mat, a, cc, s.B + 0.02, s.door[0] - 0.06, ...side(sd, s.W * 0.985 - 0.06, s.W * 0.985 - 0.004));
      }
  });
  // the folding steps under each door
  m.scope("steps", () => {
    for (const [d0, d1] of mirror(lay.door))
      for (const sd of [1, -1]) {
        const [a, cc] = [Xb(d0 + 0.06), Xb(d1 - 0.06)].sort((p, q) => p - q) as [number, number];
        for (const x of [a, cc - 0.04]) block(m, "steps", x, x + 0.04, 0.42, s.B + 0.02, ...side(sd, 1.36, 1.5));
        for (const y of [0.45, 0.72]) block(m, "steps", a + 0.04, cc - 0.04, y, y + 0.04, ...side(sd, 1.3, 1.5));
      }
  });
  // the Indian Railways roundel in the grey band, mid-car
  m.scope("emblem", () => {
    for (const sd of [1, -1]) {
      surfaceDisc(m, b, Xb, L * 0.46, 1.42, sd, "emblemRed", 0.16, 0.006, 0.004, 16);
      surfaceDisc(m, b, Xb, L * 0.46, 1.42, sd, "emblemW", 0.1, 0.009, 0.002, 12);
    }
  });
  // the class lettering high on the side near the -X end, as on the photographs
  m.scope("class lettering", () => {
    const text = unit === "ac3" ? "A.C. THREE TIER" : "AC CHAIR CAR";
    for (const sd of [1, -1]) sideLettering(m, b, Xb, sd, text, L - 5.6, 3.1, 0.15, "classText", 0.006);
  });
  // the Tejas name low on the side, pale on the orange
  if (l.palette.amber)
    m.scope("train name", () => {
      for (const sd of [1, -1]) sideLettering(m, b, Xb, sd, "TEJAS", L * 0.36, 1.3, 0.22, "nameText", 0.006);
    });
  // the gangway: sealed bellows standing out to the coupling plane, round the end door
  for (const e of [1, -1])
    m.scope(e > 0 ? "front gangway" : "rear gangway", () => {
      const wall = Xb(e > 0 ? 0 : L);
      const [a, cc] = [wall - e * 0.05, wall + e * (GAP - 0.015)].sort((p, q) => p - q) as [number, number];
      for (const sd of [1, -1]) block(m, "bellows", a, cc, 1.2, 3.62, ...side(sd, 0.5, 0.66));
      block(m, "bellows", a, cc, 3.46, 3.7, -0.51, 0.51);
      block(m, "bellows", a, cc, 1.2, 1.32, -0.51, 0.51);
      // the end door inside it
      const [f0, f1] = [wall - e * 0.05, wall + e * 0.006].sort((p, q) => p - q) as [number, number];
      block(m, "endDoor", f0, f1, 1.33, 3.45, -0.49, 0.49);
      const [g0, g1] = [wall + e * 0.008, wall + e * 0.012].sort((p, q) => p - q) as [number, number];
      block(m, "glass", g0, g1, 2.3, 3.0, -0.24, 0.24);
      // the tail lamp brackets either side of the gangway
      for (const sd of [1, -1]) {
        const [l0, l1] = [wall + e * 0.002, wall + e * 0.08].sort((p, q) => p - q) as [number, number];
        block(m, "lampRed", l0, l1, 1.42, 1.56, ...side(sd, 0.95, 1.09));
      }
    });
  // the two roof-mounted AC packages over the ends, their grilles along both sides
  for (const end of ends)
    m.scope(end === 0 ? "front AC package" : "rear AC package", () => {
      const d0 = fromEnd(end, 0.45), d1 = fromEnd(end, 3.0);
      const [xa, xb] = [Xb(d0), Xb(d1)].sort((p, q) => p - q) as [number, number];
      const base = 3.86, top = 4.035, hw = 0.82;
      const sec: Array<[number, number]> = [[xa, base], [xb, base], [xb - 0.12, top], [xa + 0.12, top]];
      m.sweep("rmpu", "z", sec, -hw, sec, hw);
      for (const sd of [1, -1]) block(m, "grille", xa + 0.3, xb - 0.3, base + 0.04, top - 0.04, ...side(sd, hw - 0.01, hw + 0.006));
    });
  // the underfloor: the equipment boxes and the air reservoirs beside the bogies
  m.scope("underfloor", () => {
    for (const [a, cc, h] of [[-3.6, -1.9, 0.5], [-1.6, 0.4, 0.42], [0.8, 2.2, 0.5], [2.5, 3.6, 0.36]] as const)
      block(m, "underBox", Xb(L / 2 + cc), Xb(L / 2 + a), s.B - h, s.B, -1.1, 1.1);
    block(m, "under", Xb(tr[0]! + 2.6), Xb(tr[0]! + 1.9), s.B - 0.38, s.B, -1.2, 1.2);
    block(m, "under", Xb(tr[1]! - 1.9), Xb(tr[1]! - 2.6), s.B - 0.38, s.B, -1.2, 1.2);
    for (const k of [0, 1, 2]) {
      const x = Xb(tr[1]! - 2.0 - k * 0.55);
      m.sweep("tank", "z", ngon(12, 0.2, 0, x, s.B - 0.24), -1.25, ngon(12, 0.2, 0, x, s.B - 0.24), 1.25);
    }
  });
}

function pick(params: readonly ParamSpec[], v: ParamValues | undefined, lod: boolean): { l: CoachLivery; c: CarDef } {
  const p = resolveParams(params, v);
  const key = p.livery ?? Object.keys(IR_LHB.liveries)[0]!;
  const l = IR_LHB.liveries[key]!;
  return { l, c: lhbDef(p.unit!, key, l, lod) };
}

export function lhbCoach(params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const { l, c: def } = pick(params, v, false);
  const m = new MeshBuilder({ ...PALETTE, ...l.palette });
  drawCar(m, def, X);
  return m;
}

/** The distant model: the body with its bands and window row, the end panels' grey, the AC packages and the bogies. */
export function lhbCoachLod(params: readonly ParamSpec[], v?: ParamValues): MeshBuilder {
  const p = resolveParams(params, v);
  const { l, c: def } = pick(params, v, true);
  const body = carLodBody({ ...def, windows: def.windows.slice(0, 1) }, X);
  const lay = LAYOUT[p.unit!]!;
  const endSide = [[IR_LHB.B, (GREY_TOP + WEDGE_TOP) / 2, "grey"], [(GREY_TOP + WEDGE_TOP) / 2, IR_LHB.S, l.bands[l.bands.length - 1]![2]]] as const;
  const cabs = wedged(p.livery ?? "rajdhani") ? [{ x0: X(lay.door[0]), x1: X(0), side: endSide }, { x0: X(L), x1: X(L - lay.door[0]), side: endSide }] : [];
  const rmpu = (end: number) => ({
    draw: (m: MeshBuilder) => {
      const [xa, xb] = end === 0 ? [X(3.0), X(0.45)] : [X(L - 0.45), X(L - 3.0)];
      lodSideBox(m, "rmpu", [[xa, 3.9], [xb, 3.9], [xb, 4.035], [xa, 4.035]], -0.82, 0.82);
    },
    optional: 1,
  });
  return fitUnit({
    palette: { ...CARBODY_PALETTE, under: PALETTE.under!, grey: GREY, rmpu: PALETTE.rmpu!, ...l.palette },
    bodies: [{ ...body, ...(cabs.length ? { cabs } : {}) }],
    parts: [rmpu(0), rmpu(L), ...bogieParts(def.trucks.map((d) => [X(d), def.truck.frameHalf] as const), def.spec.B)],
  }, 100);
}
