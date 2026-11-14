// The DRG class E 94 (proc-vehicle-drg-e94, AEG, 1940 - 1956), the "German
// crocodile": a Co'Co' freight electric with a centre body and two low hoods,
// on the box locomotive kit (boxLocoKit.ts) with its own measures, taken from
// the published figures and the photographs in assets/drg-e94
// (docs/models/germany-trains.md):
//
// - the centre body (the cabs and the machine room between them) 10.3 m long,
//   the full width, the kit's shell: the flat cab fronts with three windows over
//   the hoods, the lamp over the middle one and the roof's visor ahead of them;
//   per side the cab door with its narrow window, a window, the six upper and
//   three lower louvres, the number plate between them, a window and the other
//   cab's door - turned about on the other side; the black main frame below
//   with its lightening holes and fish-belly lower edge;
// - the hoods (their own shells): 3.35 m long, 2.6 m wide - much narrower than
//   the body - and 1.45 m high, their tops rounded across and at the front, the
//   three louvres on each side and two on the front, the headlights and the
//   number plate at the foot of the front, the handrails along the top, the
//   buffer beam under them and the compressor's cooling coil;
// - the roof: grey, the raised louvred ventilator off the middle, the two red
//   diamond pantographs over the cabs (the rear raised), the roof line;
// - the bogies 10.0 m apart, 4.6 m wheelbase (2.45 m + 2.15 m), 1,250 mm wheels.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { KIT_PALETTE, c, kinks, lerpTable, onEnd, onSide, rect, shell, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import type { Band } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";
import { block } from "./vehicleParts.ts";
import { fitLod, lodBogie, lodPantograph, lodRoofBox, lodSideBox, windowBands, type LodPart, type LodShell } from "./lodKit.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (18.6 m), the buffer beam's face. */
const HALF = 9.3;
const BEAM = 8.7;
/** The centre body: its cab fronts' |x|, the shell's bottom, the black frame band's top, the eaves and the crown. */
const CAB = 5.15;
const Y0 = 1.3;
const BAND = 1.8;
const EAVE = 3.72;
const CROWN = 3.98;
/** The body's half width (3.0 m; the published 3.15 m is over the handrails, drawn inside the 3.1 m gauge). */
const W = 1.5;

/** The centre body's end [y, |x|]: the flat cab front, the roof's visor reaching 0.27 m ahead of it, the roof rounding back. */
const TIP: Table = [[Y0, CAB], [EAVE, CAB], [3.76, CAB + 0.27], [3.81, CAB + 0.27], [3.86, CAB + 0.12], [3.93, CAB - 0.05], [CROWN, CAB - 0.25]];
/** The centre body's half width: upright sides, the gutter, the roof's curve. */
const HW: Table = [[Y0, W], [EAVE, W], [3.76, W + 0.02], [3.81, W + 0.02], [3.86, W - 0.08], [3.93, W - 0.28], [CROWN, W - 0.58]];
const PLAN = (_y: number, w: number) => [[0, 0], [w * 0.9, 0], [w, 0.05]] as const;

/** The hoods: from inside the cab front to their front face, foot, the top's edge and crown, half width. */
const HOOD_X = [CAB - 0.05, 8.45] as const;
const HOOD_XC = (HOOD_X[0] + HOOD_X[1]) / 2;
const HOOD_HALF = (HOOD_X[1] - HOOD_X[0]) / 2;
const HOOD_Y0 = 1.4;
const HOOD_EDGE = 2.66;
const HOOD_TOP = 2.86;
const HOOD_W = 1.3;
const HOOD_HW: Table = [[HOOD_Y0, HOOD_W], [HOOD_EDGE, HOOD_W], [2.74, HOOD_W - 0.03], [2.8, HOOD_W - 0.1], [2.84, HOOD_W - 0.22], [HOOD_TOP, HOOD_W - 0.4]];
const HOOD_TIP: Table = [[HOOD_Y0, HOOD_HALF], [2.62, HOOD_HALF], [2.72, HOOD_HALF - 0.025], [2.79, HOOD_HALF - 0.075], [2.84, HOOD_HALF - 0.15], [HOOD_TOP, HOOD_HALF - 0.23]];
const HOOD_PLAN = (_y: number, w: number) => [[0, 0], [w * 0.8, 0.005], [w * 0.93, 0.03], [w, 0.1]] as const;

/** The bogies: pivots 10.0 m apart, axles 2.45 m and 2.15 m apart (outer to inner), 1,250 mm wheels. */
const PIVOT = 5.0;
const AXLES = [1.85, -0.6, -2.75] as const;
const WHEEL_R = 0.625;
/** The louvres' slat pitch. */
const SLAT_PITCH = 0.075;

/** The diamond pantographs over the cabs, the roof line's insulators, the ventilator on the roof. */
const PANTO_X = 3.7;
const LINE_X = 2.6;
const VENT = { x: [-2.3, 1.3] as const, w: [1.05, 0.55] as const, y: [CROWN - 0.03, CROWN + 0.36] as const };

/** The side's layout on the right (+z) side, front (+x) first; the left side is it turned about. */
const DOOR_FRONT = [3.5, 4.3] as const;
const DOOR_REAR = [-4.75, -3.95] as const;
const DOOR_Y = [BAND, 3.6] as const;
const DOOR_WIN_Y = [2.75, 3.45] as const;
const WINDOWS = [[2.55, 3.2], [-3.85, -3.2]] as const;
const WIN_Y = [2.8, 3.44] as const;
const LOUVRE_Y = { upper: [2.78, 3.38] as const, lower: [2.0, 2.66] as const };
/** The six upper louvres, front first; the lower row has the first two and the last. */
const LOUVRES = Array.from({ length: 6 }, (_, i) => [2.2 - i * 0.86 - 0.72, 2.2 - i * 0.86] as const);
const LOWER = [0, 1, 5];
const PLATE = { x: [-0.82, -0.02] as const, y: [2.26, 2.44] as const };
/** The lightening holes along the black frame band. */
const HOLES = Array.from({ length: 9 }, (_, i) => 2.85 - i * 0.62);

interface Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  number: string;
}

const LIVERIES: Record<string, Livery> = {
  // E 94 088 as preserved (DR museum, Dresden; the DRG's green with the black frame and red wheels)
  green: {
    title: "Green",
    palette: { green: c("#38523e"), black: c("#1e1f21", 0.7), roof: c("#6d706f", 0.75), wheel: c("#7d231f", 0.6), pantograph: { color: "#a1282a", metallic: 0.2, roughness: 0.6 } },
    number: "E 94 088",
  },
};

export const E94_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery => LIVERIES[resolveParams(E94_PARAMS, v).livery!]!;

const SIDE: readonly Band[] = [[Y0, BAND, "black"], [BAND, 3.88, "green"], [3.88, 4.2, "roof"]];
const HOOD_BANDS: readonly Band[] = [[HOOD_Y0, 3.0, "green"]];

/** An item on the right side and its turned copy on the left. */
function bothSides(it: SideItem): SideItem[] {
  const poly = it.poly ? { poly: it.poly.map(([u, v]) => [-u, v] as [number, number]).reverse() } : {};
  return [{ ...it, sides: [1] }, { ...it, x: [-it.x[1], -it.x[0]], ...poly, sides: [-1] }];
}

function spec(l: Livery): LocoSpec {
  const sideItems: SideItem[] = [
    ...[DOOR_FRONT, DOOR_REAR].flatMap((x, i) => [
      ...bothSides({ kind: "door", name: `cab door ${i + 1}`, x, y: DOOR_Y, rails: true }),
      ...bothSides({ kind: "window", name: `door window ${i + 1}`, x: [x[0] + 0.22, x[1] - 0.22], y: DOOR_WIN_Y, mat: "rubber", r: 0.04 }),
    ]),
    ...WINDOWS.flatMap((x, i) => bothSides({ kind: "window", name: `window ${i + 1}`, x, y: WIN_Y, mat: "rubber", r: 0.05 })),
    ...LOUVRES.flatMap((x, i) => [
      ...bothSides({ kind: "grille", name: `upper louvre ${i + 1}`, x, y: LOUVRE_Y.upper, slats: "h", pitch: 0.075, mat: "green" }),
      ...(LOWER.includes(i) ? bothSides({ kind: "grille", name: `lower louvre ${i + 1}`, x, y: LOUVRE_Y.lower, slats: "h", pitch: 0.075, mat: "green" }) : []),
    ]),
    ...bothSides({ kind: "panel", name: "number plate", x: PLATE.x, y: PLATE.y, mat: "plate" }),
    ...HOLES.flatMap((x, i) => bothSides({ kind: "paint", name: `frame hole ${i + 1}`, x: [x - 0.13, x + 0.13], y: [1.47, 1.63], poly: [[x - 0.13, 1.55], [x - 0.08, 1.47], [x + 0.08, 1.47], [x + 0.13, 1.55], [x + 0.08, 1.63], [x - 0.08, 1.63]], mat: "hole", layer: 1 })),
  ];
  const endItems: EndItem[] = [
    { kind: "window", name: "front window left", z: [0.62, 1.22], y: [2.95, 3.52], wiper: true },
    { kind: "window", name: "front window middle", z: [-0.32, 0.32], y: [2.95, 3.52], wiper: true },
    { kind: "window", name: "front window right", z: [-1.22, -0.62], y: [2.95, 3.52], wiper: true },
    { kind: "lamp", name: "top headlight", z: [-0.07, 0.07], y: [3.56, 3.7], r: 0.06 },
  ];
  return {
    palette: { hole: c("#0c0c0d", 0.9), plate: c("#1c1d1f", 0.5), rubber: c("#1a1b1d", 0.8), bogie: c("#222325", 0.8), spring: c("#2a2b2d", 0.7), underframe: c("#1e1f21", 0.75), slat: c("#38523e"), ...l.palette },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan: PLAN,
    corner: "end",
    side: SIDE,
    end: SIDE,
    roof: "roof",
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.06,
    frame: { y0: 1.12, y1: HOOD_Y0, half: BEAM - 0.02, hw: 1.42, mat: "black" },
    bogies: [-1, 1].map((e) => ({ xc: e * PIVOT, axles: AXLES.map((a) => e * a), wheelR: WHEEL_R, frameTop: 1.02 })),
    pantograph: { kind: "diamond", x: PANTO_X, roofY: CROWN, baseY: CROWN + 0.33 },
    hvLine: { x: LINE_X, y: CROWN + 0.27, z: 0 },
    sideItems,
    endItems,
    roofItems: [{ name: "ventilator", x: VENT.x, w: VENT.w, y: VENT.y, mat: "roof" }],
    number: l.number,
  };
}

// --- the hoods ------------------------------------------------------------------------

function hoodShell(e: number): ShellSpec {
  return {
    heights: kinks(HOOD_TIP, HOOD_HW),
    tip: (y) => lerpTable(HOOD_TIP, y),
    hw: (y) => lerpTable(HOOD_HW, y),
    endPlan: (y) => HOOD_PLAN(y, lerpTable(HOOD_HW, y)),
    side: HOOD_BANDS, end: HOOD_BANDS, corner: "end", roof: "green",
    xc: e * HOOD_XC,
    ends: [e],
  };
}

/** A louvre on a hood: the dark opening and its slats in the body colour (each its face and its lower lip). */
function louvre(m: MeshBuilder, at: (u: number, v: number, d: number) => Vec3, n: Vec3, u: readonly [number, number], v: readonly [number, number], vB: readonly number[]): void {
  m.scope("opening", () => surfacePanel(m, "louvre", at, n, rect(u[0], v[0], u[1], v[1]), -0.006, 0.006, [], vB));
  m.scope("slats", () => {
    const pts: Vec3[] = [], lips: Vec3[] = [];
    const [a, b] = [u[0] + 0.03, u[1] - 0.03];
    for (let y = v[0] + 0.05; y + 0.035 <= v[1] - 0.02; y += SLAT_PITCH) {
      const [p, q, r, t] = [at(a, y, 0.014), at(b, y, 0.014), at(b, y + 0.035, 0.014), at(a, y + 0.035, 0.014)];
      pts.push(p, q, r, p, r, t);
      const [p0, q0] = [at(a, y, 0.006), at(b, y, 0.006)];
      lips.push(p0, q0, q, p0, q, p);
    }
    m.facets("green", pts, n);
    m.facets("green", lips, [0, -1, 0]);
  });
}

/** The hood's side louvres (x spans at the +x end) and front louvres (z spans). */
const HOOD_LOUVRES = [[5.65, 6.35], [6.45, 7.15], [7.25, 7.95]] as const;
const HOOD_LOUVRE_Y = [1.58, 2.56] as const;
const FRONT_LOUVRES = [[0.22, 0.9], [-0.9, -0.22]] as const;
const FRONT_LOUVRE_Y = [1.95, 2.52] as const;

function hood(m: MeshBuilder, e: number, l: Livery): void {
  const sp = hoodShell(e);
  const vB = kinks(HOOD_TIP, HOOD_HW);
  m.scope("shell", () => shell(m, sp));
  m.scope("side louvres", () => {
    for (const sd of [-1, 1])
      for (const [i, [a, b]] of HOOD_LOUVRES.entries())
        m.scope(`${sd > 0 ? "right" : "left"} ${i + 1}`, () => louvre(m, onSide(sp, sd), [0, 0, sd], e > 0 ? [a, b] : [-b, -a], HOOD_LOUVRE_Y, vB));
  });
  const at = onEnd(sp, e);
  const n: Vec3 = [e, 0, 0];
  m.scope("front louvres", () => {
    for (const [i, z] of FRONT_LOUVRES.entries()) m.scope(`${i + 1}`, () => louvre(m, at, n, z, FRONT_LOUVRE_Y, vB));
  });
  m.scope("number plate", () => {
    surfacePanel(m, "plate", at, n, rect(-0.42, 1.5, 0.42, 1.7), -0.01, 0.02, [], vB);
    const h = 0.12, w = wordWidth(l.number, h, { weight: 0.14 });
    const tris = letters(l.number, e > 0 ? w / 2 : -w / 2, 1.6 - h / 2, h, e > 0, { weight: 0.14 });
    m.facets("white", tris.map(([u, v]) => at(u, v, 0.024)), n);
  });
  m.scope("headlights", () => {
    for (const z of [-1.12, 1.12]) {
      const x0 = e * (HOOD_X[1] - 0.05), x1 = e * (HOOD_X[1] + 0.16);
      const body = ngon(12, 0.13, 0, z, 1.6);
      m.sweep("black", "x", body, Math.min(x0, x1), body, Math.max(x0, x1));
      const lens = ngon(12, 0.095, 0, z, 1.6);
      const [l0, l1] = [e * (HOOD_X[1] + 0.16), e * (HOOD_X[1] + 0.175)];
      m.sweep("lampHead", "x", lens, Math.min(l0, l1), lens, Math.max(l0, l1));
    }
  });
  m.scope("handrails", () => {
    for (const s of [-1, 1]) {
      const z = s * 1.08;
      m.rod("steel", [e * 5.35, 3.0, z], [e * 8.3, 3.0, z], 0.018, 6);
      for (const x of [5.45, 6.9, 8.2]) m.rod("steel", [e * x, 2.82, z], [e * x, 3.0, z], 0.016, 6);
    }
  });
  m.scope("buffer beam", () => {
    const [a, b] = e > 0 ? [BEAM - 0.2, BEAM] : [-BEAM, -BEAM + 0.2];
    block(m, "black", a, b, 0.8, 1.38, -1.45, 1.45);
  });
  // the compressor's cooling coil under the hood's front, on the right of the +x end and the left of the other
  m.scope("cooling coil", () => {
    const z = e * 1.2;
    for (let i = 0; i < 5; i++) {
      const y = 0.72 + i * 0.075;
      m.rod("rim", [e * 7.6, y, z], [e * 8.2, y, z], 0.03, 6);
    }
  });
}

// --- the rest the kit does not draw ----------------------------------------------------

/** The fish-belly lower edge of the main frame between the bogies, the air reservoirs, the ventilator's louvres. */
function extras(m: MeshBuilder): void {
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      // the lower edge dips between the bogies
      const xs = [-4.6, -3.6, -2.4, -1.2, 0, 1.2, 2.4, 3.6, 4.6];
      const yOf = (x: number) => Y0 - 0.22 * Math.max(0, 1 - (x / 4.0) ** 2) - 0.02;
      for (let i = 0; i + 1 < xs.length; i++) {
        const q: Vec3[] = [[xs[i]!, yOf(xs[i]!), 0], [xs[i + 1]!, yOf(xs[i + 1]!), 0], [xs[i + 1]!, Y0, 0], [xs[i]!, Y0, 0]];
        m.slab("black", q.map(([x, y]): Vec3 => [x, y, s * (W - 0.005)]), [0, 0, -s * 0.06]);
      }
    }
  });
  m.scope("air reservoirs", () => {
    for (const z of [-0.6, 0.6]) {
      const r = ngon(10, 0.22, 0, z, 0.86);
      m.sweep("black", "x", r, -1.3, r, 1.3);
    }
  });
  m.scope("ventilator louvres", () => {
    const [w0, w1] = VENT.w, [y0, y1] = VENT.y;
    const n = 4, gap = 0.1, len = (VENT.x[1] - VENT.x[0] - gap * (n + 1)) / n;
    for (const s of [-1, 1])
      for (let i = 0; i < n; i++) {
        const xa = VENT.x[0] + gap + i * (len + gap), xb = xa + len;
        // a point t of the way up the slope, d off it
        const nz = (y1 - y0), ny = (w0 - w1), nl = Math.hypot(nz, ny);
        const P = (x: number, t: number, d: number): Vec3 => [x, y0 + (y1 - y0) * t + (d * ny) / nl, s * (w0 + (w1 - w0) * t + (d * nz) / nl)];
        const depth: Vec3 = [0, -ny / nl * 0.01, -s * nz / nl * 0.01];
        m.slab("louvre", [P(xa, 0.12, 0.004), P(xb, 0.12, 0.004), P(xb, 0.9, 0.004), P(xa, 0.9, 0.004)], depth);
        const slats: Vec3[] = [];
        for (let k = 0; k < 5; k++) {
          const t = 0.17 + k * 0.15;
          const [p, q, r, u] = [P(xa + 0.03, t, 0.012), P(xb - 0.03, t, 0.012), P(xb - 0.03, t + 0.06, 0.012), P(xa + 0.03, t + 0.06, 0.012)];
          slats.push(p, q, r, p, r, u);
        }
        m.facets("roof", slats, [0, ny / nl, s * nz / nl]);
      }
  });
}

/** The DRG E 94 in a livery. */
export function drgE94(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const m = buildBoxLoco(spec(l));
  m.scope("body", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front hood" : "rear hood", () => hood(m, e, l));
    extras(m);
    // the running number on the side plates
    const sp = shellOf(spec(l));
    m.scope("number", () => {
      for (const sd of [-1, 1]) {
        const at = onSide(sp, sd);
        const h = 0.11, w = wordWidth(l.number, h, { weight: 0.14 });
        const xc = sd * (PLATE.x[0] + PLATE.x[1]) / 2;
        const tris = letters(l.number, sd > 0 ? xc - w / 2 : xc + w / 2, (PLATE.y[0] + PLATE.y[1]) / 2 - h / 2, h, sd < 0, { weight: 0.14 });
        m.facets("white", tris.map(([u, v]) => at(u, v, 0.0125)), [0, 0, sd]);
      }
    });
  });
  return m;
}

// --- low level of detail ------------------------------------------------------------

/** The distant model: the centre body, both hoods, the frame, the bogies, the ventilator and the pantographs. */
export function drgE94Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const centre: LodShell = {
    y0: Y0, tip: [[Y0, CAB], [EAVE, CAB], [3.8, CAB + 0.27], [CROWN, CAB - 0.25]], hw: [[Y0, W], [EAVE, W], [3.86, W - 0.08], [CROWN, W - 0.58]],
    side: SIDE, end: SIDE, roof: "roof",
    sideWindows: [
      ...windowBands([{ u: WINDOWS[0], y: WIN_Y }], 0).map((w) => ({ ...w, sides: [1], optional: 2 })),
      ...windowBands([{ u: [-WINDOWS[0][1], -WINDOWS[0][0]], y: WIN_Y }], 0).map((w) => ({ ...w, sides: [-1], optional: 2 })),
    ],
    endWindows: windowBands([{ u: [-1.22, 1.22], y: [2.95, 3.52] }], 0.4),
  };
  const hoods: LodShell[] = [-1, 1].map((e) => ({
    y0: HOOD_Y0, tip: [[HOOD_Y0, HOOD_HALF], [2.66, HOOD_HALF], [HOOD_TOP, HOOD_HALF - 0.2]], hw: [[HOOD_Y0, HOOD_W], [2.7, HOOD_W], [HOOD_TOP, HOOD_W - 0.35]],
    xc: e * HOOD_XC, ends: [e], side: HOOD_BANDS, end: HOOD_BANDS, roof: "green",
  }));
  const p = s.pantograph!;
  const parts: LodPart[] = [
    { optional: 40, draw: (m) => m.scope("frame", () => lodSideBox(m, "black", [[-BEAM, 0.85], [BEAM, 0.85], [BEAM, HOOD_Y0], [-BEAM, HOOD_Y0]], -1.42, 1.42)) },
    { draw: (m) => m.scope("running gear", () => {
      for (const e of [-1, 1]) lodBogie(m, e * (PIVOT - 0.45), 3.4, 1.12);
    }) },
    { draw: (m) => m.scope("ventilator", () => lodRoofBox(m, "roof", VENT.x[0], VENT.x[1], VENT.w[0], VENT.w[1], VENT.y[0], VENT.y[1])) },
    { draw: (m) => m.scope("raised pantograph", () => lodPantograph(m, { x: -p.x, roofY: p.roofY, baseY: p.baseY, h: 1, raised: true })) },
    { optional: 0, draw: (m) => m.scope("folded pantograph", () => lodPantograph(m, { x: p.x, roofY: p.roofY, baseY: p.baseY, h: -1, raised: false })) },
  ];
  return fitLod({ palette: { ...KIT_PALETTE, ...s.palette }, shells: [centre, ...hoods], parts }, 100);
}
