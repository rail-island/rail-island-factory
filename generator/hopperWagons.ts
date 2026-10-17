// The open hopper wagons transferred from vlakosimdb (listed with the other
// freight wagons in freightWagons.ts): the Faccs ballast hopper and the Falls
// coal hopper in their liveries, and the older Wap (the CSD name of the same
// self-discharging type) with its load. Each body is the JT7 clip solid of its
// XML `box`/`base` shapes (freightWagonParts.ts clipSolid), open at the top over
// its load. Source coordinates as in freightWagons.ts. See docs/models/freight-wagons.md.

import { type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ParamSpec, ParamValues } from "./design.ts";
import { resolveParams } from "./design.ts";
import { WAGON_PALETTE, Wagon } from "./wagonParts.ts";
import { blockPart, clipShell, drawGearLod, freightWagonLod, joinSameColour, roofBoxPart, wagonBogies, wagonBox } from "./lodSteam.ts";
import { FREIGHT_NUMBERS, boldText, clipSolid, numberLines, surfaceStrip, type Clip, type Pt } from "./freightWagonParts.ts";
import { strokeText as strokeLetters } from "./strokeFont.ts";

const sideName = (s: number) => (s > 0 ? "right side" : "left side");
const endName = (e: number) => (e > 0 ? "front end" : "rear end");

const lerp = (pts: Pt[], x: number): number => {
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [xa, ya] = pts[i - 1]!;
    const [xb, yb] = pts[i]!;
    if (x <= xb) return ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return pts[pts.length - 1]![1];
};

/** The hoppers' shared materials; a livery adds `upper`, `lower`, `shade` and `frame`. */
const HOPPER_PALETTE: Record<string, MaterialSpec> = {
  ballast: { color: "#6f6c66", roughness: 0.95 },
  ballastDark: { color: "#4a4844", roughness: 0.95 },
  coal: { color: "#1e1d22", roughness: 0.95 },
  ink: { color: "#141414", roughness: 0.6 },
  yellowInk: { color: "#e8e000", roughness: 0.5 },
  handrail: { color: "#d8c838", roughness: 0.5 },
  steelwork: { color: "#3a3a3c", roughness: 0.7 },
};

/** A livery of a hopper: its parameter value, title, vlakosimdb folder and paints. */
export interface HopperLivery {
  value: string;
  title: string;
  source: string;
  paint: Record<string, MaterialSpec>;
}

const liveryParam = (liveries: readonly HopperLivery[]): readonly ParamSpec[] => [
  { name: "livery", title: "Livery", default: liveries[0]!.value, values: liveries.map((l) => ({ value: l.value, title: l.title })) },
];

/** An open-topped body: the faces of `clip` but its top, which the load fills. */
function openTop(c: Wagon, mat: string, clip: Clip): void {
  clipSolid(c, mat, clip, (n) => n[1] < 0.999);
}

/**
 * A bulk load filling an open top: a flat-shaded height field over the top's
 * rectangle x0..x1, -half..half, its edges on the rim at `y`, rising up to
 * `rise` above it in `mounds` mounds along the wagon.
 */
function loadSurface(c: Wagon, mat: string, x0: number, x1: number, half: number, y: number, rise: number, mounds: number): void {
  c.heap(mat, x0, x1, half, Math.max(8, Math.round((x1 - x0) / 0.6)), 6, (x, z) => {
    const t = (x - x0) / (x1 - x0);
    const along = 0.55 + 0.45 * Math.cos(t * mounds * 2 * Math.PI) ** 2;
    const across = 1 - (z / half) ** 2;
    const edge = Math.min(1, (x - x0) / 0.3, (x1 - x) / 0.3, (half - Math.abs(z)) / 0.2);
    return y + rise * along * across * Math.max(0, edge);
  });
}

// --- the Faccs ballast hopper --------------------------------------------------------

export const FACCS_LIVERIES: readonly HopperLivery[] = [
  {
    value: "cd", title: "CD", source: "n_faccs",
    paint: { upper: { color: "#622500", roughness: 0.7 }, shade: { color: "#481c00", roughness: 0.75 }, lower: { color: "#2f1300", roughness: 0.8 }, frame: { color: "#3c3c3c", roughness: 0.8 } },
  },
  {
    value: "viamont", title: "Viamont", source: "viamont_faccs",
    paint: { upper: { color: "#e8e201", roughness: 0.6 }, shade: { color: "#c8c301", roughness: 0.65 }, lower: { color: "#b5b001", roughness: 0.7 }, frame: { color: "#3c3c3c", roughness: 0.8 } },
  },
];
export const FACCS_PARAMS = liveryParam(FACCS_LIVERIES);

/** The Faccs hopper body (XML `box`): its section (z, y), and its elevation (x, y) -- concave, so as two convex pieces split at 2.1 m. */
const FACCS_SECTION: Pt[] = [[-1.3, 3.8], [-0.8, 4.2], [0.8, 4.2], [1.3, 3.8], [1.5, 3.0], [1.5, 2.5], [0.3, 1.2], [-0.3, 1.2], [-1.5, 2.5], [-1.5, 3.0]];
const FACCS_LOWER: Clip = { section: FACCS_SECTION, elevation: [[3.6, 1.2], [3.3, 2.1], [9.5, 2.1], [9.2, 1.2]] };
const FACCS_UPPER: Clip = { section: FACCS_SECTION, elevation: [[3.3, 2.1], [2.0, 3.9], [2.1, 4.2], [10.7, 4.2], [10.8, 3.9], [9.5, 2.1]] };

/** The Faccs self-discharging ballast hopper (vlakosimdb n_faccs, viamont_faccs). */
export function faccsHopperWagon(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(FACCS_PARAMS, params);
  const L = FACCS_LIVERIES.find((l) => l.value === livery)!;
  const c = new Wagon({ ...HOPPER_PALETTE, ...L.paint }, 6.4);
  const m = c.m;
  m.scope("hopper", () => {
    m.scope("body", () => {
      clipSolid(c, "upper", FACCS_LOWER, (n) => n[1] < 0.999);
      clipSolid(c, "upper", FACCS_UPPER, (n) => Math.abs(n[1]) < 0.999);
    });
    // the ballast in the open top (native y_dec: grey stones over x 2.2..10.6, |z| < 0.7)
    m.scope("load", () => loadSurface(c, "ballast", 2.1, 10.7, 0.8, 4.2, 0.08, 3));
    // the darker lower slopes under the side's crease at 2.5 m (native rows 20..27)
    m.scope("lower slopes", () => {
      for (const s of [-1, 1]) {
        const pts: Vec3[] = [];
        const P = (x: number, y: number): Vec3 => [c.X(x), y, s * (0.3 + ((y - 1.2) / 1.3) * 1.2 + 0.01)];
        for (const [a, b, d, e] of [[3.6, 9.2, 9.5, 3.3]] as Array<[number, number, number, number]>) {
          // the trapezoid between y 1.2 (x 3.6..9.2) and y 2.1 (x 3.3..9.5) on the sloped side
          pts.push(P(a, 1.2), P(b, 1.2), P(d, 2.1), P(a, 1.2), P(d, 2.1), P(e, 2.1));
        }
        m.facets("lower", pts, [0, -1.2 / Math.hypot(1.2, 1.3), (s * 1.3) / Math.hypot(1.2, 1.3)]);
      }
    });
    // the stiffeners the native z_both paints: columns 40 and 87 down to 2.5 m, 62 and 65 down to 1.3 m
    for (const s of [1, -1])
      m.scope(`${sideName(s)} stiffeners`, () =>
        ([[4.0, 2.5], [6.2, 1.3], [6.5, 1.3], [8.7, 2.5]] as Pt[]).forEach(([x, y0], i) => m.scope(`stiffener ${i + 1}`, () => surfaceStrip(c, "shade", FACCS_SECTION, s, x, x + 0.1, y0, 4.2, 0.012))),
      );
  });
  m.scope("underframe", () => {
    m.scope("frame", () => c.box("frame", 0.2, 12.6, 0.9, 1.2, -1.45, 1.45));
    // the discharge chutes under the hopper (XML `unload` 4.4..6.2 and 6.6..8.4, 0.1..0.9 m)
    m.scope("chutes", () => {
      ([[4.4, 6.2], [6.6, 8.4]] as Pt[]).forEach(([x0, x1], i) =>
        m.scope(`chute ${i + 1}`, () => {
          const elevation: Pt[] = [[x0, 0.1], [x1, 0.1], [x1, 0.9], [x0, 0.9]];
          clipSolid(c, "lower", { section: [[-1.5, 0.9], [-1.4, 0.1], [-0.5, 0.9]], elevation });
          clipSolid(c, "lower", { section: [[1.5, 0.9], [0.5, 0.9], [1.4, 0.1]], elevation });
        }),
      );
    });
    // the end frames on the frame, their posts (XML `zab2` at 1.8 and 10.9) and the diagonal braces up to the hopper's ends (`zeb`)
    for (const e of [-1, 1])
      m.scope(`${endName(e)} frame`, () => {
        const [xp, xw] = e < 0 ? [1.8, 0.2] : [10.9, 12.5];
        m.scope("end wall", () => c.box("upper", xw, xw + 0.1, 1.2, 2.3, -1.5, 1.5));
        m.scope("rails", () => {
          for (const s of [-1, 1]) {
            c.sideBox("upper", s, Math.min(xw, xp), Math.max(xw + 0.1, xp + 0.1), 2.2, 2.3, 1.4, 1.5);
            c.sideBox("upper", s, xp, xp + 0.1, 1.2, 2.3, 1.4, 1.5);
          }
        });
        m.scope("braces", () => {
          const [xa, xb] = e < 0 ? [1.15, 2.05] : [11.65, 10.75];
          for (const z of [-0.35, 0.35]) c.sideSweep("upper", [[xa - 0.05, 1.2], [xa + 0.05, 1.2], [xb + 0.05, 3.9], [xb - 0.05, 3.9]], z - 0.05, z + 0.05);
        });
        m.scope("steps", () => {
          for (const y of [1.7, 2.3, 2.9, 3.5]) {
            const x = e < 0 ? 1.3 + (y - 1.7) / 3 : 11.5 - (y - 1.7) / 3;
            c.box("steelwork", x - 0.05, x + 0.05, y, y + 0.06, -0.3, 0.3);
          }
        });
      });
    for (const s of [1, -1])
      m.scope(`${sideName(s)} number`, () => c.letters(s, 1.456, s > 0 ? 3.0 : 9.8, numberLines(FREIGHT_NUMBERS.faccs.number, "\u010cD", 0.93, 0.08)));
  });
  if (livery === "viamont")
    m.scope("viamont board", () => {
      // the black board with yellow VIAMONT on the upper side (native z_inc columns 67..98 on +z, z_dec 30..61 on -z, rows 1..9)
      for (const s of [1, -1]) {
        const [x0, x1] = s > 0 ? [6.7, 9.9] : [3.0, 6.2];
        const zAt = (y: number) => 1.5 - ((y - 3.0) / 0.8) * 0.2;
        const pts: Vec3[] = [[c.X(x0), 3.1, s * (zAt(3.1) + 0.01)], [c.X(x1), 3.1, s * (zAt(3.1) + 0.01)], [c.X(x1), 3.75, s * (zAt(3.75) + 0.01)], [c.X(x0), 3.75, s * (zAt(3.75) + 0.01)]];
        m.slab("ink", pts, [0, 0, -s * 0.02]);
        const word = "VIAMONT";
        const pts2: Vec3[] = [];
        const h = 0.42;
        const w = 0.32;
        const gap = 0.1;
        const width = word.length * w + (word.length - 1) * gap;
        // the letters lie on the slightly inclined board: z follows y
        const u0 = c.X((x0 + x1) / 2) + (s > 0 ? -width / 2 : width / 2);
        for (const [u, v] of strokeLetters(word, u0, 3.22, h, w, gap, s < 0, 0.07)) pts2.push([u, v, s * (zAt(v) + 0.016)]);
        m.facets("yellowInk", pts2, [0, 0.24, s]);
      }
    });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.2, 0.3, 0.88, 1.2, 1.45, "frame") : c.drawGear(1, 12.8, 12.6, 12.5, 0.88, 1.2, 1.45, "frame")));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.25, 2.0));
    m.scope("bogie 2", () => c.freightBogie(10.55, 2.0));
  });
  return m;
}

/** The Faccs from afar (lodSteam.ts): the hopper with its darker lower slopes and the ballast top, frame, end frames, chutes and bogies. */
export function faccsHopperWagonLod(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(FACCS_PARAMS, params);
  const L = FACCS_LIVERIES.find((l) => l.value === livery)!;
  const C = 6.4;
  // the VIAMONT board on the upper side
  const board = (s: number) => ({ u: [(s > 0 ? 6.7 : 3.0) - C, (s > 0 ? 9.9 : 6.2) - C] as const, y: [3.1, 3.75] as const, mat: "ink", sides: [s], optional: 40 });
  const hopper = clipShell(C, [FACCS_LOWER, FACCS_UPPER], [[1.2, 2.1, "lower"], [2.1, 4.2, "upper"]], { end: [[1.2, 4.2, "upper"]], roof: "ballast" });
  return freightWagonLod({
    palette: { ...WAGON_PALETTE, ...HOPPER_PALETTE, ...L.paint },
    shells: [
      livery === "viamont" ? { ...hopper, sideWindows: [board(1), board(-1)] } : hopper,
      wagonBox(C, 0.2, 12.6, [[0.9, 1.45], [1.2, 1.45]], [[0.9, 1.2, "frame"]]),
    ],
    parts: [
      // the end frames: the end wall and its top rails at each end
      roofBoxPart(C, "upper", 0.2, 0.3, 1.5, 1.5, 1.2, 2.3, 30),
      roofBoxPart(C, "upper", 12.5, 12.6, 1.5, 1.5, 1.2, 2.3, 30),
      blockPart(C, "lower", 4.4, 8.4, 0.1, 0.9, 1.4, 20),
      wagonBogies(C, [[2.25, 2.0], [10.55, 2.0]], 0.9),
    ],
  });
}

// --- the Falls coal hopper --------------------------------------------------------

export const FALLS_LIVERIES: readonly HopperLivery[] = [
  {
    value: "cd", title: "CD", source: "n_falls",
    paint: { upper: { color: "#7e3a12", roughness: 0.7 }, lower: { color: "#773711", roughness: 0.7 }, shade: { color: "#5f2d0e", roughness: 0.75 }, panel: { color: "#773711", roughness: 0.7 }, frame: { color: "#29242c", roughness: 0.8 }, letter2: { color: "#f2f2f2", roughness: 0.6 } },
  },
  {
    value: "sd", title: "SD", source: "sd_falls",
    paint: { upper: { color: "#008000", roughness: 0.6 }, lower: { color: "#007000", roughness: 0.6 }, shade: { color: "#005e00", roughness: 0.65 }, panel: { color: "#a8a8a8", roughness: 0.6 }, frame: { color: "#29242c", roughness: 0.8 }, letter2: { color: "#151515", roughness: 0.6 } },
  },
  {
    value: "viamont", title: "Viamont", source: "viamont_falls",
    paint: { upper: { color: "#adadad", roughness: 0.6 }, lower: { color: "#1a1a22", roughness: 0.7 }, shade: { color: "#959595", roughness: 0.65 }, panel: { color: "#1a1a22", roughness: 0.7 }, frame: { color: "#29242c", roughness: 0.8 }, letter2: { color: "#c0c0c0", roughness: 0.6 } },
  },
];
export const FALLS_PARAMS = liveryParam(FALLS_LIVERIES);

/** The Falls body: the lower box (XML `base`, two halves either side of the centre post) and the upper bulge (`box`). */
const FALLS_LOWER_SECTION: Pt[] = [[-1.4, 0.9], [-1.5, 1.1], [-1.5, 2.9], [1.5, 2.9], [1.5, 1.1], [1.4, 0.9]];
const FALLS_UPPER: Clip = {
  section: [[-1.4, 3.0], [-1.5, 3.2], [-1.5, 3.5], [-1.4, 3.9], [-1.2, 4.3], [1.2, 4.3], [1.4, 3.9], [1.5, 3.5], [1.5, 3.2], [1.4, 3.0]],
  elevation: [[0.1, 4.0], [0.4, 3.0], [12.6, 3.0], [12.9, 4.0], [12.9, 4.3], [0.1, 4.3]],
};

/** The Falls self-discharging coal hopper (vlakosimdb n_falls, sd_falls, viamont_falls). */
export function fallsHopperWagon(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(FALLS_PARAMS, params);
  const L = FALLS_LIVERIES.find((l) => l.value === livery)!;
  const c = new Wagon({ ...HOPPER_PALETTE, ...L.paint }, 6.75);
  const m = c.m;
  m.scope("body", () => {
    m.scope("lower", () => {
      ([[0.4, 6.1], [6.9, 12.6]] as Pt[]).forEach(([x0, x1], i) => m.scope(`half ${i + 1}`, () => clipSolid(c, "lower", { section: FALLS_LOWER_SECTION, elevation: [[x0, 0.9], [x1, 0.9], [x1, 2.9], [x0, 2.9]] })));
      // the core across the centre post (XML `pod` 0.3..12.7, |z| 1.4, 0.9..3.0)
      m.scope("centre post", () => c.box("shade", 6.1, 6.9, 0.92, 3.0, -1.4, 1.4));
    });
    m.scope("upper", () => openTop(c, "upper", FALLS_UPPER));
    m.scope("load", () => loadSurface(c, "coal", 0.1, 12.9, 1.2, 4.3, 0.12, 2));
    if (livery !== "cd")
      m.scope("panels", () => {
        // the lower side panels inside their border (SD grey, Viamont black; native rows 31..48)
        for (const s of [-1, 1]) for (const [x0, x1] of [[0.5, 6.0], [7.0, 12.5]] as Pt[]) c.sideBox("panel", s, x0, x1, 1.2, 2.88, 1.495, 1.505);
      });
  });
  m.scope("underframe", () => {
    m.scope("frame", () => c.box("frame", 0.3, 12.7, 0.88, 1.1, -1.38, 1.38));
    m.scope("chutes", () => {
      for (const s of [-1, 1]) for (const x of [2.6, 9.6]) c.sideBox("frame", s, x, x + 1.3, 0.55, 0.9, 0.6, 1.3);
    });
  });
  // the brake platform at the +x end (XML `box` 12.7..13.2), its railing (`zab`) and the ladder up the end (`stairs`)
  m.scope("brake platform", () => {
    c.box("frame", 12.7, 13.2, 0.9, 0.95, -1.5, 1.5);
    for (const s of [-1, 1]) c.sideBox("handrail", s, 13.2, 13.25, 1.15, 2.2, 1.2, 1.25);
    c.box("handrail", 13.2, 13.25, 2.15, 2.2, -1.2, 1.2);
    for (const z of [0.15, 0.8]) c.sideSweep("handrail", [[13.15, 1.2], [13.2, 1.2], [13.05, 3.8], [13.0, 3.8]], z, z + 0.05);
    for (const y of [1.7, 2.4, 3.1, 3.8]) {
      const x = 13.17 - ((y - 1.2) / 2.6) * 0.15;
      c.box("handrail", x - 0.03, x + 0.03, y, y + 0.06, 0.2, 0.8);
    }
  });
  for (const s of [1, -1])
    m.scope(`${sideName(s)} lettering`, () => {
      const x0 = s > 0 ? 3.3 : 10.0;
      m.scope("running number", () => c.letters(s, 1.51, x0, numberLines(FREIGHT_NUMBERS.falls.number, livery === "cd" ? "\u010cD" : livery === "sd" ? "SD" : "VADS", 1.45, 0.09), "letter2"));
      if (livery === "viamont") boldText(c, "yellowInk", s, 1.512, s > 0 ? 11.2 : 2.3, 1.35, "VIAMONT", 0.28, 0.2, 0.06, 0.05);
      if (livery === "sd")
        m.scope("logo", () => {
          // the SD green triangle on the panel (native z_dec columns 61..75)
          const xc = s > 0 ? 10.2 : 3.3;
          const z = s * 1.512;
          m.facets("upper", [[c.X(xc - 0.4), 2.6, z], [c.X(xc + 0.4), 2.6, z], [c.X(xc), 2.05, z]], [0, 0, s]);
        });
    });
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.3, 0.4, 0.85, 1.2, 1.45, "frame") : c.drawGear(1, 13.5, 13.2, 12.7, 0.85, 0.95, 1.45, "frame")));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(2.45, 2.0));
    m.scope("bogie 2", () => c.freightBogie(10.55, 2.0));
  });
  return m;
}

/** The Falls from afar (lodSteam.ts): the lower box with its panels, the upper bulge, the coal top, chutes, beams and bogies. */
export function fallsHopperWagonLod(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(FALLS_PARAMS, params);
  const L = FALLS_LIVERIES.find((l) => l.value === livery)!;
  const C = 6.75;
  const palette = { ...WAGON_PALETTE, ...HOPPER_PALETTE, ...L.paint };
  const lower: Clip = { section: FALLS_LOWER_SECTION, elevation: [[0.4, 0.9], [12.6, 0.9], [12.6, 2.9], [0.4, 2.9]] };
  const side = joinSameColour([[0.9, 1.2, "lower"], [1.2, 2.88, "panel"], [2.88, 2.95, "lower"], [2.95, 4.3, "upper"]], palette);
  return freightWagonLod({
    palette,
    // the centre post between the two halves of the lower box
    shells: [{ ...clipShell(C, [lower, FALLS_UPPER], side, { end: [[0.9, 2.95, "lower"], [2.95, 4.3, "upper"]], roof: "coal" }), sideWindows: [{ u: [6.1 - C, 6.9 - C] as const, y: [0.9, 2.95] as const, mat: "shade", optional: 35 }] }],
    parts: [
      blockPart(C, "frame", 2.6, 10.9, 0.55, 0.9, 1.3, 20),
      roofBoxPart(C, "frame", 12.6, 13.2, 1.5, 1.5, 0.85, 0.95, 15),
      drawGearLod(C, [[0.3, 0.4]], 0.85, 1.2, 1.45, "frame"),
      wagonBogies(C, [[2.45, 2.0], [10.55, 2.0]], 0.9),
    ],
  });
}

// --- the Wap -----------------------------------------------------------------------

const WAP_PALETTE: Record<string, MaterialSpec> = {
  ...HOPPER_PALETTE,
  upper: { color: "#b9c0a0", roughness: 0.65 },
  shade: { color: "#6f7a6f", roughness: 0.7 },
  lower: { color: "#a3a68b", roughness: 0.65 },
  frame: { color: "#33363a", roughness: 0.8 },
  letter2: { color: "#ecece4", roughness: 0.6 },
  gravel: { color: "#77746e", roughness: 0.95 },
};

/** The Wap body: the lower box and the upper bulge (XML `base`). */
const WAP_LOWER: Clip = {
  section: [[-1.4, 1.2], [-1.4, 3.0], [1.4, 3.0], [1.4, 1.2], [1.2, 0.8], [-1.2, 0.8]],
  elevation: [[1.4, 0.8], [12.8, 0.8], [12.8, 3.0], [1.4, 3.0]],
};
const WAP_UPPER: Clip = {
  section: [[1.4, 3.0], [1.5, 3.2], [1.5, 3.4], [1.4, 3.7], [1.1, 4.1], [-1.1, 4.1], [-1.4, 3.7], [-1.5, 3.4], [-1.5, 3.2], [-1.4, 3.0]],
  elevation: [[0.9, 3.5], [1.4, 3.0], [12.8, 3.0], [13.3, 3.5], [13.3, 4.1], [0.9, 4.1]],
};

/** The loaded Wap self-discharging hopper (vlakosimdb n_wap-full#2). */
export const WAP_PARAMS: ParamSpec[] = [{name:"cargo",title:"Cargo",default:"coal",values:[{value:"coal",title:"Loaded"},{value:"empty",title:"Empty"}]}];
export function wapHopperWagon(given?: ParamValues): MeshBuilder {
  const {cargo} = resolveParams(WAP_PARAMS, given);
  const c = new Wagon(WAP_PALETTE, 6.75);
  const m = c.m;
  m.scope("body", () => {
    m.scope("lower", () => clipSolid(c, "lower", WAP_LOWER));
    m.scope("upper", () => openTop(c, "upper", WAP_UPPER));
    // the side flaps (XML `door` 1.4..6.8 and 7.4..12.8, 0.8..2.7 m, 0.1 m proud) and the post between them
    for (const s of [-1, 1])
      m.scope(`${sideName(s)} flaps`, () => {
        ([[1.5, 6.75], [7.45, 12.7]] as Pt[]).forEach(([x0, x1], i) => m.scope(`flap ${i + 1}`, () => c.sideBox("lower", s, x0, x1, 1.2, 2.6, 1.4, 1.5)));
        m.scope("post", () => c.sideBox("shade", s, 6.8, 7.4, 0.9, 3.0, 1.4, 1.48));
        m.scope("rail", () => c.sideBox("shade", s, 1.4, 12.8, 2.95, 3.02, 1.4, 1.46));
      });
    // the gravel heaped above the rim (XML `load`: up to 4.5 m)
    if (cargo === "coal") m.scope("load", () => {
      const elev: Pt[] = [[1.4, 4.1], [3.2, 4.5], [5.2, 4.1], [6.1, 4.4], [9.1, 4.5], [12.8, 4.1]];
      const sect: Pt[] = [[-1.1, 4.1], [-0.9, 4.1], [-0.1, 4.5], [0.5, 4.4], [0.9, 4.1], [1.1, 4.1]];
      c.heap("gravel", 0.9, 13.3, 1.1, 24, 8, (x, z) => Math.max(4.1, Math.min(lerp(elev, x), lerp(sect, z))));
    });
  });
  m.scope("underframe", () => {
    m.scope("frame", () => c.box("frame", 0.5, 13.0, 0.78, 1.2, -1.3, 1.3));
  });
  // the brake platform at the -x end (XML `front` 0.5..1.4) with its railing and the ladder (`ladder`)
  m.scope("brake platform", () => {
    c.box("frame", 0.5, 1.4, 1.2, 1.3, -1.4, 1.4);
    for (const s of [-1, 1]) {
      c.sideBox("shade", s, 0.5, 0.6, 1.3, 2.3, 1.3, 1.4);
      c.sideBox("shade", s, 0.5, 0.6, 1.8, 1.9, 0.5, 1.3);
    }
    c.box("shade", 0.5, 0.6, 2.2, 2.3, -1.3, 1.3);
    for (const z of [-0.25, 0.25]) c.sideSweep("shade", [[0.5, 1.3], [0.6, 1.3], [0.9, 4.0], [0.8, 4.0]], z - 0.05, z + 0.05);
    for (const y of [1.85, 2.45, 3.05, 3.65]) {
      const x = 0.55 + ((y - 1.3) / 2.7) * 0.3;
      c.box("shade", x, x + 0.06, y, y + 0.06, -0.2, 0.2);
    }
  });
  for (const s of [1, -1])
    m.scope(`${sideName(s)} number`, () => c.letters(s, 1.506, s > 0 ? 2.8 : 10.7, numberLines(FREIGHT_NUMBERS.wap.number, "\u010cSD", 1.6, 0.09), "letter2"));
  for (const e of [-1, 1])
    m.scope(endName(e), () => (e < 0 ? c.drawGear(-1, 0, 0.5, 0.6, 0.8, 1.2, 1.4, "frame") : c.drawGear(1, 13.5, 13.0, 12.8, 0.8, 1.2, 1.4, "frame")));
  m.scope("running gear", () => {
    m.scope("bogie 1", () => c.freightBogie(3.55, 2.0));
    m.scope("bogie 2", () => c.freightBogie(10.65, 2.0));
  });
  return m;
}


/** The Wap from afar (lodSteam.ts): the lower box and upper bulge, the gravel heaped above the rim (loaded), the brake platform and bogies. */
export function wapHopperWagonLod(given?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(WAP_PARAMS, given);
  const C = 6.75;
  // the post between the side flaps
  const shells = [{ ...clipShell(C, [WAP_LOWER, WAP_UPPER], [[0.8, 3.0, "lower"], [3.0, 4.1, "upper"]], { roof: cargo === "coal" ? "gravel" : "shade" }), sideWindows: [{ u: [6.8 - C, 7.4 - C] as const, y: [0.9, 3.0] as const, mat: "shade", optional: 35 }] }];
  const parts = [
    blockPart(C, "shade", 0.5, 1.4, 1.2, 1.3, 1.4, 15),
    drawGearLod(C, [[0.5, 0.6], [12.8, 13.0]], 0.8, 1.2, 1.4, "frame"),
    wagonBogies(C, [[3.55, 2.0], [10.65, 2.0]], 0.8),
  ];
  // the heap above the rim
  if (cargo === "coal") parts.push(roofBoxPart(C, "gravel", 1.4, 12.8, 1.1, 0.45, 4.1, 4.5, 45));
  return freightWagonLod({ palette: { ...WAGON_PALETTE, ...WAP_PALETTE }, shells, parts });
}
