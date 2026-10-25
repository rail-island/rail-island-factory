// The TGV Duplex, SNCF's double-deck high-speed train (from 1996): one design
// `veh-tgv-duplex` whose `unit` picks the car - the power car with its beak nose
// and two pantographs (the default, the train's locomotive), the end trailer
// R1 that couples to a power car on its own bogie, the double-deck intermediate
// trailer, the bar car R4 - or the whole train: `cars` (4 .. 12) vehicles, a
// power car at each end (the rear one turned) and the articulated trailers
// between them on Jacobs bogies. `livery` is the 2008 "Carmillon" silver and
// blue, the original silver and blue of 1996, inOui grey or Ouigo blue.
//
// Modelled from photographs (assets/tgv-duplex/) and the published figures:
// power car 22.15 m over the couplers, 2.814 m wide, its bogies 14 m apart;
// end trailer 21.845 m from its coupler to the joint, intermediate trailers
// 18.70 m joint to joint, 2.896 m wide and 4.32 m high; a ten-car train 200.19
// m. The bodies are lofted through vertical slices (sliceBody.ts): the power
// car's nose, its swoosh of paint rising from the beak to the roof and its
// machine-room panel are paint edges of the slices. See
// docs/models/tgv-duplex.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { Coach } from "./csdCoachParts.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { centreCoupler, EMU_CATALOG, enumParam, pantograph } from "./emuParts.ts";
import { unitBogie } from "./unitParts.ts";
import { articulate } from "./tramKit.ts";
import { openable, plugMove } from "./doors.ts";
import { lerp, type Pt } from "./sliceLoft.ts";
import { crownPane, drawShell, edgeRole, sideDecal, sideLettering, sidePane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { LOD_GLASS, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, pantographParts, sideGlass, turnBody, type UnitBody } from "./lodUnits.ts";

/** What the design builds: one car, or the whole train. */
export type DuplexUnit = "powerCar" | "endTrailer" | "trailer" | "bar" | "train";
export type DuplexCar = Exclude<DuplexUnit, "train">;
export type DuplexLivery = "carmillon" | "original" | "inoui" | "ouigo";

/** The train's vehicle counts: two power cars and 2 .. 6 trailers. */
export const DUPLEX_MIN_CARS = 4;
export const DUPLEX_MAX_CARS = 8;

export const DUPLEX_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    powerCar: "Power car",
    endTrailer: "End trailer R1",
    trailer: "Trailer",
    bar: "Bar car R4",
    train: "Full train",
  }),
  {
    ...enumParam("cars", "Cars", Object.fromEntries(Array.from({ length: DUPLEX_MAX_CARS - DUPLEX_MIN_CARS + 1 }, (_, i) => [String(i + DUPLEX_MIN_CARS), `${i + DUPLEX_MIN_CARS} cars`]))),
    default: "4",
    when: { name: "unit", values: ["train"] },
    // the longer trains offered before the eight-car limit
    retired: { "9": { cars: "8" }, "10": { cars: "8" }, "11": { cars: "8" }, "12": { cars: "8" } },
  },
  enumParam("livery", "Livery", {
    carmillon: "Carmillon",
    original: "Original 1996",
    inoui: "inOui",
    ouigo: "Ouigo",
  }),
];

/** Lengths (m): the power car over its couplers, the end trailer from its coupler to the joint, a trailer joint to joint. */
export const DUPLEX_LENGTH: Record<DuplexCar, number> = { powerCar: 22.15, endTrailer: 21.845, trailer: 18.7, bar: 18.7 };
/** Half the gap at a coupler (power car to end trailer) and at a joint between two trailers. */
export const DUPLEX_COUPLER_GAP = 0.35;
export const DUPLEX_JOINT_GAP = 0.15;
/** The power car's bogies, d back from the nose tip: 14 m apart, 3.0 m wheelbase, 920 mm wheels. */
export const DUPLEX_POWER_BOGIES: [number, number] = [5.2, 19.2];
/** The end trailer's own bogie, d back from its coupling plane. */
export const DUPLEX_END_BOGIE = 3.4;
export const DUPLEX_WHEELBASE = 3.0;
const WHEEL_R = 0.46;
/** Heights: the power car's roof, the trailers' crown. */
export const DUPLEX_POWER_HEIGHT = 4.05;
export const DUPLEX_TRAILER_HEIGHT = 4.32;
/** Half widths: 2.814 m and 2.896 m. */
const W_POWER = 1.407;
const W_TRAILER = 1.448;
const COUPLER_Y = 1.0;
/** The decks' window bands: sills and heads. */
const LOWER_WIN: [number, number] = [1.0, 1.68];
const UPPER_WIN: [number, number] = [2.82, 3.5];
/** The trainset number on the power car, as on the photographed Carmillon set. */
export const DUPLEX_NUMBER = "249";

const isPower = (car: DuplexCar): car is "powerCar" => car === "powerCar";
type TrailerCar = Exclude<DuplexCar, "powerCar">;

// --- liveries ----------------------------------------------------------------------------------

interface Livery {
  palette: Record<string, MaterialSpec>;
  /** The power car's paint: below the swoosh, its machine-room panel, the line along the swoosh, above it. */
  power: { low: string; panel: string; line: string; high: string };
  /** The trailers' seven side bands between the paint edges TRAILER_EDGES, bottom up. */
  trailer: [string, string, string, string, string, string, string];
  /** The trailers' doors, when not painted in the bands. */
  door?: string;
  /** Lettering on the power car: the logo and its text, or the Ouigo disc. */
  logo: "sncf" | "duplex" | "ouigo" | "none";
}

const c = (color: string, roughness = 0.4, metallic?: number): MaterialSpec => ({ color, roughness, ...(metallic !== undefined ? { metallic } : {}) });

/** The trailers' paint edges: the lower deck's band, the line under the upper deck, its window band. */
const TRAILER_EDGES = [0.92, 1.76, 2.45, 2.52, 2.74, 3.58];

const LIVERIES: Record<DuplexLivery, Livery> = {
  // the 2008 refit: silver, blue rising from the beak to the roof over a white line, the blue lower deck
  carmillon: {
    palette: { silver: c("#c6c9cc", 0.35, 0.3), blue: c("#2a49a8"), navy: c("#1d2b5c"), white: c("#f2f3f4"), roof: c("#a9adb1", 0.6), skirt: c("#3c4046", 0.7), logo: c("#d7262f") },
    power: { low: "blue", panel: "navy", line: "white", high: "silver" },
    trailer: ["blue", "blue", "blue", "white", "silver", "navy", "silver"],
    logo: "sncf",
  },
  // 1996: silver with dark blue window bands on both decks, a blue band along the power car
  original: {
    palette: { silver: c("#c3c6c9", 0.35, 0.3), blue: c("#24408f"), navy: c("#1f2f66"), white: c("#eef0f1"), roof: c("#a9adb1", 0.6), skirt: c("#3c4046", 0.7), logo: c("#24408f") },
    power: { low: "silver", panel: "navy", line: "silver", high: "silver" },
    trailer: ["silver", "navy", "silver", "silver", "silver", "navy", "silver"],
    logo: "duplex",
  },
  // inOui (2017): light grey, the anthracite lower body, a carmine line, carmine doors
  inoui: {
    palette: { grey: c("#cfd2d5", 0.4), anthracite: c("#4b4f55", 0.5), dark: c("#33363b", 0.5), carmine: c("#b5174a"), roof: c("#b3b7bb", 0.6), skirt: c("#3c4046", 0.7), logo: c("#b5174a") },
    power: { low: "anthracite", panel: "dark", line: "carmine", high: "grey" },
    trailer: ["anthracite", "anthracite", "anthracite", "carmine", "grey", "grey", "grey"],
    door: "carmine",
    logo: "none",
  },
  // Ouigo (2013): sky blue, the magenta disc and the white name on the power car, a magenta line
  ouigo: {
    palette: { sky: c("#21a6d8", 0.4), navy: c("#26367a", 0.5), magenta: c("#e0115f"), white: c("#f4f6f7"), roof: c("#8fcbe4", 0.6), skirt: c("#26367a", 0.7), logo: c("#e0115f") },
    power: { low: "sky", panel: "sky", line: "sky", high: "sky" },
    trailer: ["navy", "sky", "sky", "magenta", "sky", "sky", "white"],
    door: "magenta",
    logo: "ouigo",
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  glass: { ...c("#26303a", 0.12, 0.2), glass: true },
  cabGlass: { ...c("#1b232c", 0.1, 0.25), glass: true },
  rubber: c("#1c1c1e", 0.9),
  frame: c("#55595f", 0.5, 0.3),
  lampBand: c("#2a2f36", 0.2, 0.3),
  lampWhite: { ...c("#eef0e8", 0.15), lamp: { role: "head" } },
  lampRed: { ...c("#c8202c", 0.3), lamp: { role: "tail" } },
  grille: c("#5d6168", 0.6),
  louvre: c("#2b2f35", 0.7),
  under: c("#2a2c2f", 0.85),
  equipment: c("#33363a", 0.8),
  motor: c("#2e3033", 0.8),
  coupler: c("#2a2b2d", 0.6, 0.3),
  lettering: c("#f4f6f7", 0.5),
  pantograph: c("#5a5d63", 0.6, 0.2),
  carbon: c("#2b2b2b", 0.8),
  insulator: c("#c8c8c0", 0.4),
  bellows: c("#1c1c1e", 0.95),
};

// --- the power car ----------------------------------------------------------------------------

/** The power car's body: the nose tip at d = 0, its rear wall 0.35 m ahead of the rear coupling plane. */
const POWER_BODY = DUPLEX_LENGTH.powerCar - DUPLEX_COUPLER_GAP;
const POWER_S = 3.35;
/** The crown: the beak, the bonnet to the windscreen's foot, the windscreen and the cab roof. */
const POWER_C: Pt[] = [[0, 1.42], [0.12, 1.6], [0.4, 1.8], [1.0, 1.98], [2.0, 2.22], [2.6, 2.38], [3.5, 2.98], [4.3, 3.5], [5.0, 3.8], [5.8, 3.98], [6.6, DUPLEX_POWER_HEIGHT]];
/** The shoulder under it. */
const POWER_SH: Pt[] = [[0, 1.32], [0.25, 1.5], [0.8, 1.72], [2.6, 2.2], [4.3, 2.95], [5.8, 3.3], [6.6, POWER_S]];
/** The belly and the skirt's top: the beak's lower half rounds under. */
const POWER_Y: Pt[] = [[0, 1.08], [0.3, 1.02], [1.0, 1.0]];
const POWER_A: Pt[] = [[0, 0.82], [0.3, 0.64], [1.0, 0.62]];
/** The bottom: the spoiler under the beak, the openings over the bogies. */
function powerBottom(): Pt[] {
  const reach = DUPLEX_WHEELBASE / 2 + WHEEL_R + 0.29;
  const [b1, b2] = DUPLEX_POWER_BOGIES;
  return [[0, 0.74], [0.08, 0.5], [0.3, 0.36], [b1 - reach - 0.1, 0.36], [b1 - reach, 1.0], [b1 + reach, 1.0], [b1 + reach + 0.1, 0.36], [b2 - reach - 0.1, 0.36], [b2 - reach, 1.0], [b2 + reach, 1.0], [b2 + reach + 0.1, 0.36], [POWER_BODY, 0.36]];
}
/** The swoosh's upper edge: low on the beak, rising behind the cab to the roof. */
const SWOOSH: Pt[] = [[0, 1.2], [2.5, 1.36], [5.5, 2.0], [8.5, 3.05], [9.6, POWER_S + 0.1]];
/** The machine room's dark panel on the side. */
const PANEL: [number, number] = [9.8, 20.9];
const PANEL_Y: [number, number] = [2.15, 3.05];

function powerProfile(): SliceBody {
  const B = powerBottom();
  const w = (d: number) => Math.max(0.03, W_POWER * Math.sqrt(Math.max(0, 1 - (1 - Math.min(d + 0.06, 3.8) / 3.8) ** 2)));
  const Y = (d: number) => lerp(POWER_Y, d);
  const keys = [0, 0.04, 0.12, 0.25, 0.4, 0.6, 0.8, 1.0, 1.3, 1.6, 2.0, 2.3, 2.6, 2.9, 3.2, 3.5, 3.9, 4.3, 4.65, 5.0, 5.4, 5.8, 6.2, 6.6, 7.2, 8.0, 8.5, 9.0, 9.6, PANEL[0] - 0.01, PANEL[0], PANEL[1], PANEL[1] + 0.01];
  return {
    length: POWER_BODY,
    B: (d) => lerp(B, d),
    wl: (d) => 0.84 * w(d),
    A: (d) => Math.max(lerp(POWER_A, d), lerp(B, d)),
    wa: (d) => 0.93 * w(d),
    Y: (d) => Math.max(Y(d), lerp(B, d) + 0.1),
    w,
    S: (d) => lerp(POWER_SH, d),
    C: (d) => lerp(POWER_C, d),
    // the panel's edges collapse onto the belly ahead of it; the swoosh's two edges (its line) clamp to the shoulder behind the cab
    edges: (d) => {
      const panel = d >= PANEL[0] && d <= PANEL[1];
      const hi = lerp(SWOOSH, d);
      return [panel ? PANEL_Y[0] : Y(d), panel ? PANEL_Y[1] : Y(d), hi - 0.1, hi];
    },
    lean: 0.97,
    arc: 9,
    stations: [...new Set([...keys, ...B.map(([d]) => d), POWER_BODY])].sort((a, b) => a - b),
  };
}

function powerMat(L: Livery, b: SliceBody, d: number, k: number): string {
  const r = edgeRole(b, k);
  const P = L.power;
  if (r.kind === "bottom") return d < 0.3 ? "skirt" : "under";
  if (r.kind === "skirt") return "skirt";
  if (r.kind === "lower") return P.low;
  if (r.kind === "side") return [P.low, P.panel, P.low, P.line, P.high][r.seg!]!;
  return d < 6.6 ? P.high : "roof";
}

function powerBands(L: Livery, b: SliceBody, d: number): Array<[number, number, string]> {
  const e = b.edges(d).map((y) => Math.min(b.S(d), Math.max(b.Y(d), y)));
  const P = L.power;
  const out: Array<[number, number, string]> = [[b.B(d), b.A(d), "skirt"], [b.A(d), e[0]!, P.low], [e[0]!, e[1]!, P.panel], [e[1]!, e[2]!, P.low], [e[2]!, e[3]!, P.line], [e[3]!, b.S(d), P.high], [b.S(d), b.C(d), "roof"]];
  return out.filter(([y0, y1]) => y1 - y0 > 1e-6);
}

/** The pantographs, d back from the nose: the front one folded, the rear one raised. */
export const DUPLEX_PANTOGRAPHS: [number, number] = [15.9, 19.4];

function drawPowerCar(coach: Coach, L: Livery, X: (d: number) => number): void {
  const m = coach.m;
  const b = powerProfile();
  m.scope("body", () => {
    m.scope("shell", () => drawShell(m, b, X, (d, k) => powerMat(L, b, d, k), (d) => powerBands(L, b, d), { front: true, rear: true }));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab door", () => {
          const [a, q, y0, y1] = [5.75, 6.45, 1.15, 3.05];
          sidePanel(m, b, X, s, "rubber", a, q, y0, y1, 0.004, 0.03);
          // the leaf in the paint around it
          for (const [lo, hi, mat] of powerBands(L, b, (a + q) / 2)) {
            const [p0, p1] = [Math.max(lo, y0 + 0.03), Math.min(hi, y1 - 0.03)];
            if (p1 - p0 > 1e-6 && mat !== "roof" && mat !== "skirt") sidePanel(m, b, X, s, mat, a + 0.03, q - 0.03, p0, p1, 0.008, 0.003);
          }
          sidePanel(m, b, X, s, "cabGlass", 5.88, 6.32, 2.45, 2.92, 0.012, 0.003);
        });
        m.scope("running number", () => sideLettering(m, b, X, s, DUPLEX_NUMBER, 7.0, 1.42, 0.22, "lettering"));
        m.scope("logo", () => powerLogo(m, L, b, X, s));
        m.scope("machine room grilles", () => {
          for (let i = 0; i < 4; i++) {
            const d0 = 10.6 + i * 2.6;
            sidePanel(m, b, X, s, "louvre", d0, d0 + 1.9, 3.12, 3.3, 0.004, 0.02);
          }
        });
      });
  });
  m.scope("nose", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right lamps" : "left lamps", () => {
        sidePane(m, b, X, s, "lampBand", [0.1, 1.25], [1.5, 1.76], 0.006);
        sidePane(m, b, X, s, "lampWhite", [0.82, 1.18], [1.55, 1.71], 0.012, 3, 1);
        sidePane(m, b, X, s, "lampRed", [0.58, 0.74], [1.56, 1.7], 0.012, 2, 1);
        sidePane(m, b, X, s, "grille", [0.14, 0.48], [1.54, 1.72], 0.012, 3, 1);
      });
    m.scope("windscreen", () => {
      for (const s of [1, -1]) {
        crownPane(m, b, X, s, "rubber", [2.55, 4.42], [0, 1.12], 0.006);
        crownPane(m, b, X, s, "cabGlass", [2.75, 4.3], [0, 1.04], 0.012);
        // the louvred sill under the windscreen
        crownPane(m, b, X, s, "louvre", [2.38, 2.55], [0, 1.1], 0.01, 1, 3);
      }
    });
    m.scope("cab side windows", () => {
      for (const s of [1, -1]) {
        crownPane(m, b, X, s, "rubber", [4.55, 5.55], [1.18, 1.4], 0.006, 3, 2);
        crownPane(m, b, X, s, "cabGlass", [4.62, 5.48], [1.22, 1.37], 0.012, 3, 2);
      }
    });
  });
  m.scope("roof equipment", () => {
    // the machine room's roof grilles along both shoulders
    m.scope("roof grilles", () => {
      for (const s of [1, -1]) for (let i = 0; i < 6; i++) crownPane(m, b, X, s, "louvre", [7.0 + i * 1.45, 8.25 + i * 1.45], [0.95, 1.3], 0.008, 2, 2);
    });
    m.scope("pantographs", () => {
      const roof = DUPLEX_POWER_HEIGHT - 0.03;
      DUPLEX_PANTOGRAPHS.forEach((d, i) => m.scope(i === 1 ? "pantograph raised" : "pantograph folded", () => pantograph(m, { x: X(d), roof, hinge: Math.sign(X(0) - X(1)), raised: i === 1 })));
    });
  });
  m.scope("rear end", () => {
    const wall = POWER_BODY;
    m.scope("end plate", () => {
      const [a, q] = [X(wall), X(wall) - 0.012 * Math.sign(X(0) - X(1))].sort((u, v) => u - v) as [number, number];
      block(m, "rubber", a, q, 1.2, 3.0, -0.4, 0.4);
    });
    m.scope("coupler", () => centreCoupler(m, -Math.sign(X(0) - X(1)), X(wall - 0.9), X(DUPLEX_LENGTH.powerCar), COUPLER_Y));
  });
  m.scope("running gear", () => {
    DUPLEX_POWER_BOGIES.forEach((d, i) => m.scope(`bogie ${i + 1}`, () => unitBogie(coach, X(d), { wb: DUPLEX_WHEELBASE, r: WHEEL_R, motor: true, top: 1.0, frame: 1.0, overhang: 0.55 })));
    m.scope("transformer", () => block(m, "equipment", ...([X(15.2), X(8.8)].sort((u, v) => u - v) as [number, number]), 0.42, 1.0, -1.1, 1.1));
  });
}

/** The power car's lettering: the SNCF logo, DUPLEX, or the Ouigo disc. */
function powerLogo(m: MeshBuilder, L: Livery, b: SliceBody, X: (d: number) => number, s: number): void {
  if (L.logo === "sncf") {
    // the red rounded square, its white letters
    const tris: Pt[] = [];
    const [d0, d1, y0, y1] = [7.75, 8.55, 2.0, 2.62];
    tris.push([d0, y0], [d1, y0], [d1, y1], [d0, y0], [d1, y1], [d0, y1]);
    sideDecal(m, b, X, s, "logo", tris, 0.005);
    sideLettering(m, b, X, s, "SNCF", (d0 + d1) / 2, 2.2, 0.17, "lettering", 0.009);
  } else if (L.logo === "duplex") sideLettering(m, b, X, s, "DUPLEX", 15.4, 2.42, 0.36, "lettering", 0.006);
  else if (L.logo === "ouigo") {
    const [dc, yc, r] = [14.6, 2.15, 1.18];
    const tris: Pt[] = [];
    const n = 24;
    for (let i = 0; i < n; i++) {
      const [a, q] = [(2 * Math.PI * i) / n, (2 * Math.PI * (i + 1)) / n];
      tris.push([dc, yc], [dc + r * Math.cos(a), yc + r * Math.sin(a)], [dc + r * Math.cos(q), yc + r * Math.sin(q)]);
    }
    sideDecal(m, b, X, s, "logo", tris, 0.005);
    sideLettering(m, b, X, s, "OUIGO", dc, yc - 0.2, 0.42, "lettering", 0.009);
  }
}

// --- the trailers -----------------------------------------------------------------------------

/** A trailer's span: its body from d0 to d1 (d from its +X coupling plane), its bogies' centres, and what each end is. */
interface TrailerFrame {
  car: DuplexCar;
  d0: number;
  d1: number;
  bogies: number[];
  /** A coupler (and a gangway on a lone car) at the end, or the train's joint. */
  front: "coupler" | "joint";
  rear: "coupler" | "joint";
}

/**
 * The frame of a trailer: in the train the intermediate trailers ride on the
 * Jacobs bogies at their joints (d 0 and the length) and the end trailer on its
 * own bogie by the power car; a lone car stands on its own bogies 2.0 m in from
 * each coupling plane.
 */
export function trailerFrame(car: TrailerCar, inTrain: boolean): TrailerFrame {
  const L = DUPLEX_LENGTH[car];
  const end = car === "endTrailer";
  const d0 = end ? DUPLEX_COUPLER_GAP : DUPLEX_JOINT_GAP;
  const d1 = L - DUPLEX_JOINT_GAP;
  const bogies = inTrain ? (end ? [DUPLEX_END_BOGIE, L] : [0, L]) : [end ? DUPLEX_END_BOGIE : 2.0, L - 2.0];
  return { car, d0, d1, bogies, front: end || !inTrain ? "coupler" : "joint", rear: inTrain ? "joint" : "coupler" };
}

function trailerProfile(f: TrailerFrame): SliceBody {
  const reach = DUPLEX_WHEELBASE / 2 + WHEEL_R + 0.24;
  const low = 0.3;
  // the bottom: 0.3 m over the rail between the bogies, 1.0 m over each, with short ramps
  const covered = (d: number) => f.bogies.some((bg) => Math.abs(d - bg) <= reach);
  const B: Pt[] = [[f.d0, covered(f.d0) ? 1.0 : low]];
  for (const bg of f.bogies) {
    if (bg - reach > f.d0) B.push([bg - reach - 0.12, low], [bg - reach, 1.0]);
    if (bg + reach < f.d1) B.push([bg + reach, 1.0], [bg + reach + 0.12, low]);
  }
  B.push([f.d1, covered(f.d1) ? 1.0 : low]);
  B.sort((a, b) => a[0] - b[0]);
  const bottom = (d: number) => lerp(B, d);
  const end = f.car === "endTrailer";
  // the end trailer's roof fairs down toward the lower power car
  const C: Pt = [f.d0, end ? 4.06 : DUPLEX_TRAILER_HEIGHT];
  const crown = (d: number) => (end ? lerp([C, [f.d0 + 1.4, DUPLEX_TRAILER_HEIGHT]], d) : DUPLEX_TRAILER_HEIGHT);
  const shoulder = () => 3.74;
  const keys = end ? [f.d0 + 0.35, f.d0 + 0.7, f.d0 + 1.05, f.d0 + 1.4] : [];
  return {
    length: f.d1,
    B: bottom,
    wl: () => 0.9 * W_TRAILER,
    A: (d) => Math.max(0.42, bottom(d)),
    wa: () => 0.96 * W_TRAILER,
    Y: (d) => Math.max(0.75, bottom(d) + 0.12),
    w: () => W_TRAILER,
    S: shoulder,
    C: crown,
    edges: () => TRAILER_EDGES,
    lean: 0.985,
    arc: 9,
    stations: [...new Set([...B.map(([d]) => d), ...keys])].sort((a, b) => a - b),
  };
}

function trailerMat(L: Livery, b: SliceBody, k: number): string {
  const r = edgeRole(b, k);
  if (r.kind === "bottom") return "under";
  if (r.kind === "skirt") return "skirt";
  if (r.kind === "lower") return L.trailer[0];
  if (r.kind === "side") return L.trailer[r.seg!]!;
  return "roof";
}

function trailerBands(L: Livery, b: SliceBody, d: number): Array<[number, number, string]> {
  const ys = [b.A(d), ...TRAILER_EDGES.map((y) => Math.min(b.S(d), Math.max(b.Y(d), y))), b.S(d)];
  const out: Array<[number, number, string]> = [[b.B(d), b.A(d), "skirt"]];
  L.trailer.forEach((mat, i) => out.push([ys[i]!, ys[i + 1]!, mat]));
  out.push([b.S(d), b.C(d), "roof"]);
  return out.filter(([y0, y1]) => y1 - y0 > 1e-6);
}

/** A side opening (d0, d1). */
type Span = [number, number];
interface TrailerLayout {
  /** The door, near the +X end over the bogie. */
  door: Span;
  lower: Span[];
  upper: Span[];
  /** The class numeral beside the door. */
  numeral?: string;
}

const row = (n: number, centre: number, step: number, width: number): Span[] =>
  Array.from({ length: n }, (_, i) => {
    const x = centre + (i - (n - 1) / 2) * step;
    return [x - width / 2, x + width / 2];
  });

/** The trailers' sides: the door over the +X bogie, the lower deck's windows between the bogies, the upper deck's along the car. */
function trailerLayout(car: TrailerCar): TrailerLayout {
  switch (car) {
    case "endTrailer":
      // first class: fewer, wider-spaced seats
      return { door: [1.05, 1.95], lower: row(6, 12.7, 1.95, 1.3), upper: row(10, 12.4, 1.7, 1.3), numeral: "1" };
    case "trailer":
      return { door: [0.85, 1.75], lower: row(6, 9.6, 1.8, 1.3), upper: row(9, 10.35, 1.62, 1.26), numeral: "2" };
    case "bar":
      // the bar on the upper deck's wide windows; the lower deck's kitchen and stores have few
      return { door: [0.85, 1.75], lower: row(2, 12.4, 2.6, 1.3), upper: row(4, 10.4, 3.2, 2.3) };
  }
}

function drawTrailer(coach: Coach, L: Livery, f: TrailerFrame, X: (d: number) => number, gangway: boolean): void {
  const m = coach.m;
  const b = trailerProfile(f);
  const lay = trailerLayout(f.car as TrailerCar);
  const e = Math.sign(X(0) - X(1));
  m.scope("body", () => {
    m.scope("shell", () => drawShell(m, b, X, (_d, k) => trailerMat(L, b, k), (d) => trailerBands(L, b, d), { front: true, rear: true }));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("door", () => {
          const [a, q] = lay.door;
          sidePanel(m, b, X, s, "rubber", a, q, 1.1, 3.22, 0.004, 0.03);
          // the leaf and its window: one plug leaf sliding toward the car's middle (doors.ts)
          const dx = X(a + ((a + q) / 2 < b.length / 2 ? 1 : -1) * (q - a)) - X(a);
          openable(m, (mm, o) =>
            mm.moved(plugMove(o, s, dx), () => {
              if (L.door) sidePanel(mm, b, X, s, L.door, a + 0.03, q - 0.03, 1.13, 3.19, 0.008, 0.003);
              else
                for (const [y0, y1, mat] of trailerBands(L, b, (a + q) / 2)) {
                  const [lo, hi] = [Math.max(y0, 1.13), Math.min(y1, 3.19)];
                  if (hi - lo > 1e-6 && mat !== "roof" && mat !== "skirt") sidePanel(mm, b, X, s, mat, a + 0.03, q - 0.03, lo, hi, 0.008, 0.003);
                }
              sidePanel(mm, b, X, s, "glass", a + 0.18, q - 0.18, 2.2, 2.95, 0.012, 0.003);
            }),
          );
        });
        m.scope("lower deck windows", () => lay.lower.forEach(([a, q], i) => m.scope(`window ${i + 1}`, () => deckWindow(m, b, X, s, a, q, LOWER_WIN))));
        m.scope("upper deck windows", () => lay.upper.forEach(([a, q], i) => m.scope(`window ${i + 1}`, () => deckWindow(m, b, X, s, a, q, UPPER_WIN))));
        if (lay.numeral) m.scope("class numeral", () => sideLettering(m, b, X, s, lay.numeral!, lay.door[1] + 0.45, 2.05, 0.3, "lettering", 0.006));
      });
  });
  const end = (which: "front" | "rear") => {
    const wall = which === "front" ? f.d0 : f.d1;
    const sign = which === "front" ? e : -e;
    const kind = which === "front" ? f.front : f.rear;
    const face = which === "front" ? 0 : DUPLEX_LENGTH[f.car];
    m.scope(`${which} end`, () => {
      if (kind === "joint") return;
      if (gangway)
        m.scope("gangway", () => {
          const [a, q] = [X(wall) - sign * 0.02, X(face)].sort((u, v) => u - v) as [number, number];
          for (const z of [-1, 1]) block(m, "rubber", a, q, 1.1, 3.4, ...side(z, 0.5, 0.75));
          block(m, "rubber", a, q, 3.2, 3.4, -0.5, 0.5);
        });
      m.scope("coupler", () => centreCoupler(m, sign, X(wall + (which === "front" ? 0.9 : -0.9)), X(face), COUPLER_Y));
    });
  };
  end("front");
  end("rear");
  m.scope("running gear", () => {
    f.bogies.forEach((d, i) => {
      // a Jacobs bogie at a joint is the train's: drawn under the joint by train()
      if (d <= 0 || d >= DUPLEX_LENGTH[f.car]) return;
      m.scope(`bogie ${i + 1}`, () => unitBogie(coach, X(d), { wb: DUPLEX_WHEELBASE, r: WHEEL_R, top: 0.98, air: true, frame: 1.0 }));
    });
    m.scope("underframe", () => {
      const mid = (f.d0 + f.d1) / 2;
      for (const dd of [-3.0, 0, 3.0]) block(m, "equipment", ...([X(mid + dd - 1.0), X(mid + dd + 1.0)].sort((u, v) => u - v) as [number, number]), 0.12, 0.3, -1.0, 1.0);
    });
  });
}

function deckWindow(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, [y0, y1]: [number, number]): void {
  m.scope("frame", () => sidePanel(m, b, X, s, "frame", d0, d1, y0, y1, 0.008, 0.03));
  m.scope("glass", () => sidePanel(m, b, X, s, "glass", d0 + 0.06, d1 - 0.06, y0 + 0.06, y1 - 0.06, 0.014, 0.004));
}

// --- the train ------------------------------------------------------------------------------

export interface DuplexSlot {
  car: DuplexCar;
  lo: number;
  hi: number;
  turned: boolean;
}

/**
 * The vehicles of a train of `n`, front first: a power car at each end (the
 * rear one turned), an end trailer behind each, intermediate trailers between
 * them, the fourth trailer the bar car when there are six or more (R4 of the
 * ten-car train). Each with its span lo..hi over its coupling and joint planes,
 * the train centred on x = 0.
 */
export function duplexTrain(n: number): DuplexSlot[] {
  const t = n - 2;
  const trailers: DuplexCar[] = Array.from({ length: t }, (_, i) => (i === 0 || i === t - 1 ? "endTrailer" : t >= 6 && i === 3 ? "bar" : "trailer"));
  const cars: DuplexCar[] = ["powerCar", ...trailers, "powerCar"];
  const total = cars.reduce((sum, car) => sum + DUPLEX_LENGTH[car], 0);
  let hi = total / 2;
  return cars.map((car, i) => {
    const lo = hi - DUPLEX_LENGTH[car];
    const out = { car, lo, hi, turned: i >= n - 2 };
    hi = lo;
    return out;
  });
}

const BELLOWS: Array<[number, number]> = [[-0.75, 1.1], [0.75, 1.1], [0.75, 3.85], [0.6, 4.0], [-0.6, 4.0], [-0.75, 3.85]];
const MAX_BEND_DEG = 10;

function train(n: number, L: Livery): MeshBuilder {
  const slots = duplexTrain(n);
  const coach = new Coach({ ...PALETTE, ...L.palette }, 0);
  const m = coach.m;
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = DUPLEX_LENGTH[slot.car];
    // a car laid out facing +X from its front plane at cx + len / 2; a turned one drawn so, then turned about cx
    const X = (d: number) => cx + len / 2 - d;
    const frame = isPower(slot.car) ? null : trailerFrame(slot.car as TrailerCar, true);
    const [front, rear] = frame ? [frame.d0, frame.d1] : [0, POWER_BODY];
    const [x1, x0] = slot.turned ? [2 * cx - X(rear), 2 * cx - X(front)] : [X(front), X(rear)];
    return {
      x0,
      x1,
      draw: () => {
        m.scope(`car ${k + 1}`, () => {
          const draw = () => (frame ? drawTrailer(coach, L, frame, X, false) : drawPowerCar(coach, L, X));
          if (slot.turned) m.turned(cx, draw);
          else draw();
        });
        // the Jacobs bogie under the joint behind a trailer, carrying it and the next
        const next = slots[k + 1];
        if (!isPower(slot.car) && next && !isPower(next.car))
          m.scope(`jacobs bogie ${k + 1}`, () => unitBogie(coach, slot.lo, { wb: DUPLEX_WHEELBASE, r: WHEEL_R, top: 0.98, air: true, frame: 1.0, sections: [k, k + 1] }));
      },
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: BELLOWS, folds: 3, depth: 0.03 }, MAX_BEND_DEG, slots.slice(0, -1).map((slot) => slot.lo));
  return m;
}

export function tgvDuplex(params?: ParamValues): MeshBuilder {
  const p = resolveParams(DUPLEX_PARAMS, params);
  const L = LIVERIES[p.livery as DuplexLivery];
  const unit = p.unit as DuplexUnit;
  if (unit === "train") return train(Number(p.cars), L);
  const coach = new Coach({ ...PALETTE, ...L.palette }, 0);
  const len = DUPLEX_LENGTH[unit];
  const X = (d: number) => len / 2 - d;
  if (isPower(unit)) drawPowerCar(coach, L, X);
  else drawTrailer(coach, L, trailerFrame(unit, false), X, true);
  return coach.m;
}

// --- distant view ---------------------------------------------------------------------------

function powerLod(L: Livery, X: (d: number) => number, cx: number, turned: boolean, section: number | undefined): { body: UnitBody; parts: LodPart[] } {
  // in the train its inner end stays under the joint's bellows
  const P = L.power;
  const side: LodBand[] = [[0.36, 0.62, "skirt"], [0.62, PANEL_Y[0], P.low], [PANEL_Y[0], PANEL_Y[1], P.panel], [PANEL_Y[1], POWER_S, P.low], [POWER_S, DUPLEX_POWER_HEIGHT, "roof"]];
  let body: UnitBody = {
    y0: 0.36,
    hw: [[0.36, 0.84 * W_POWER], [0.62, 0.93 * W_POWER], [1.0, W_POWER], [POWER_S, 0.97 * W_POWER], [3.8, 1.0], [DUPLEX_POWER_HEIGHT, 0.4]],
    side,
    roof: "roof",
    front: {
      tip: [[0.36, X(0.3)], [0.74, X(0)], [1.42, X(0)], [1.98, X(1.0)], [2.38, X(2.6)], [3.5, X(4.3)], [DUPLEX_POWER_HEIGHT, X(6.6)]],
      setback: [[0.36, 2.6], [1.42, 3.4], [2.38, 2.4], [DUPLEX_POWER_HEIGHT, 1.2]],
      paint: [[0.36, 0.74, "skirt"], [0.74, 1.3, P.low], [1.3, DUPLEX_POWER_HEIGHT, P.high]],
      windows: [{ u: [-1.0, 1.0], y: [2.5, 3.45], mat: LOD_GLASS }],
    },
    rear: { tip: [[0.36, X(POWER_BODY)]], ...(section !== undefined ? { hidden: true } : {}) },
    cabs: [{ x0: Math.min(X(0), X(PANEL[0])), x1: Math.max(X(0), X(PANEL[0])), side: [[0.36, 0.62, "skirt"], [0.62, 1.6, P.low], [1.6, POWER_S, P.high], [POWER_S, DUPLEX_POWER_HEIGHT, "roof"]] }],
    ...(section !== undefined ? { section } : {}),
  };
  if (turned) body = turnBody(body, cx);
  const T = (x: number) => (turned ? 2 * cx - x : x);
  const parts: LodPart[] = [
    ...bogieParts(DUPLEX_POWER_BOGIES.map((d) => [T(X(d)), DUPLEX_WHEELBASE / 2 + WHEEL_R + 0.25, ...(section !== undefined ? [section] : [])] as const) as unknown as ReadonlyArray<readonly [number, number, number?]>, 1.0),
    ...pantographParts([T(X(DUPLEX_PANTOGRAPHS[1]))], DUPLEX_POWER_HEIGHT - 0.03, DUPLEX_POWER_HEIGHT + 0.17, section !== undefined ? { section } : {}),
  ];
  return { body, parts };
}

function trailerLod(L: Livery, f: TrailerFrame, X: (d: number) => number, cx: number, turned: boolean, section: number | undefined, inside: { front: boolean; rear: boolean }): { body: UnitBody; parts: LodPart[] } {
  const ys = [0.42, ...TRAILER_EDGES, 3.74];
  const side: LodBand[] = [[0.3, 0.42, "skirt"], ...L.trailer.map((mat, i): LodBand => [ys[i]!, ys[i + 1]!, mat]), [3.74, DUPLEX_TRAILER_HEIGHT, "roof"]];
  const lay = trailerLayout(f.car as TrailerCar);
  const boxes = [...lay.lower.map(([a, q]) => ({ x0: X(q), x1: X(a), y0: LOWER_WIN[0], y1: LOWER_WIN[1] })), ...lay.upper.map(([a, q]) => ({ x0: X(q), x1: X(a), y0: UPPER_WIN[0], y1: UPPER_WIN[1] }))];
  let body: UnitBody = {
    y0: 0.3,
    hw: [[0.3, 0.9 * W_TRAILER], [0.42, 0.96 * W_TRAILER], [0.75, W_TRAILER], [3.74, 0.985 * W_TRAILER], [4.1, 1.1], [DUPLEX_TRAILER_HEIGHT, 0.45]],
    side,
    roof: "roof",
    front: { tip: [[0.3, X(f.d0)]], ...(inside.front ? { hidden: true } : {}) },
    rear: { tip: [[0.3, X(f.d1)]], ...(inside.rear ? { hidden: true } : {}) },
    windows: sideGlass(boxes, 0.6, 2),
    ...(section !== undefined ? { section } : {}),
  };
  if (turned) body = turnBody(body, cx);
  const T = (x: number) => (turned ? 2 * cx - x : x);
  const own = f.bogies.filter((d) => d > 0 && d < DUPLEX_LENGTH[f.car]);
  const parts: LodPart[] = bogieParts(own.map((d) => [T(X(d)), DUPLEX_WHEELBASE / 2 + WHEEL_R + 0.25, ...(section !== undefined ? [section] : [])] as const) as unknown as ReadonlyArray<readonly [number, number, number?]>, 1.0);
  return { body, parts };
}

/** The distant model's budget: 100 triangles a vehicle, 500 for the longest trains. */
export const DUPLEX_LOD = 500;

/**
 * The TGV Duplex for distant views (lodUnits.ts): the power car's beak and
 * windscreen, its livery as bands (the swoosh given up for the panel's band) and
 * the raised pantograph; a trailer's two decks of windows; the train's sections
 * and joints as in the full model, the Jacobs bogies as parts, 100 triangles a
 * vehicle and 500 at most.
 */
export function tgvDuplexLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(DUPLEX_PARAMS, params);
  const L = LIVERIES[p.livery as DuplexLivery];
  const palette = { ...PALETTE, ...L.palette };
  const unit = p.unit as DuplexUnit;
  if (unit !== "train") {
    const len = DUPLEX_LENGTH[unit];
    const X = (d: number) => len / 2 - d;
    const { body, parts } = isPower(unit) ? powerLod(L, X, 0, false, undefined) : trailerLod(L, trailerFrame(unit, false), X, 0, false, undefined, { front: false, rear: false });
    return fitUnit({ palette, bodies: [body], parts }, 100);
  }
  const n = Number(p.cars);
  const slots = duplexTrain(n);
  const built = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const X = (d: number) => cx + DUPLEX_LENGTH[slot.car] / 2 - d;
    if (isPower(slot.car)) return powerLod(L, X, cx, slot.turned, k);
    // both ends of a trailer stay under the bellows of its joints
    return trailerLod(L, trailerFrame(slot.car, true), X, cx, slot.turned, k, { front: true, rear: true });
  });
  const jacobs = slots.slice(0, -1).flatMap((slot, k) => (!isPower(slot.car) && !isPower(slots[k + 1]!.car) ? [[slot.lo, DUPLEX_WHEELBASE / 2 + WHEEL_R + 0.25, k] as const] : []));
  const walls = slots.map((slot) => {
    const cx = (slot.lo + slot.hi) / 2;
    const X = (d: number) => cx + DUPLEX_LENGTH[slot.car] / 2 - d;
    const frame = isPower(slot.car) ? { d0: 0, d1: POWER_BODY } : trailerFrame(slot.car as TrailerCar, true);
    const [a, q] = [X(frame.d0), X(frame.d1)];
    return slot.turned ? [2 * cx - a, 2 * cx - q].sort((u, v) => u - v) : [q, a];
  });
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, COUPLER_Y, 0])),
    joints: slots.slice(0, -1).map((_, i) => ({
      sections: [i, i + 1] as [number, number],
      front: walls[i]![0]!,
      rear: walls[i + 1]![1]!,
      profile: [[-0.75, 1.1], [0.75, 1.1], [0.75, 4.0], [-0.75, 4.0]] as Array<[number, number]>,
    })),
    maxBendDeg: MAX_BEND_DEG,
  };
  return fitUnit({
    palette,
    bodies: built.map((b) => b.body),
    parts: [...built.flatMap((b) => b.parts), ...bogieParts(jacobs as unknown as ReadonlyArray<readonly [number, number, number?]>, 1.0).map((part) => ({ ...part, optional: 5 }))],
    sections,
  }, Math.min(DUPLEX_LOD, 100 * n));
}

// --- what the game needs ----------------------------------------------------------------------

/**
 * A power car 68 t and 4,400 kW under 25 kV (8,800 kW the train); 320 km/h. The
 * ten-car train's published 380 t empty leaves 244 t for the eight trailers,
 * split by estimate: 33 t an end trailer (its own bogie), 30.5 t the bar car,
 * 29.5 t an intermediate trailer.
 */
const CAR_WEIGHT: Record<DuplexCar, number> = { powerCar: 68, endTrailer: 33, trailer: 29.5, bar: 30.5 };
const POWER_KW = 4400;

function duplexGame(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const livery of Object.keys(LIVERIES) as DuplexLivery[]) {
    const base: ParamValues = livery === "carmillon" ? {} : { livery };
    for (const unit of ["endTrailer", "trailer", "bar"] as const) variants.push({ params: { ...base, unit }, weight: CAR_WEIGHT[unit], power: 0 });
    for (let n = DUPLEX_MIN_CARS; n <= DUPLEX_MAX_CARS; n++) {
      const weight = Math.round(duplexTrain(n).reduce((t, slot) => t + CAR_WEIGHT[slot.car], 0) * 10) / 10;
      // the default four cars are named by the unit alone
      variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" }, weight, power: 2 * POWER_KW });
    }
  }
  return { weight: CAR_WEIGHT.powerCar, power: POWER_KW, maxspeed: 320, accel: null, variants };
}

export const DUPLEX_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-tgv-duplex", game: duplexGame(), title: "TGV Duplex", build: tgvDuplex, buildLod: tgvDuplexLod, lodTriangles: DUPLEX_LOD, params: DUPLEX_PARAMS, catalog: EMU_CATALOG, references: "tgv-duplex" },
];

