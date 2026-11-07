// North American steam: the Union Pacific Big Boy 4-8-8-4 (1941), the
// Pennsylvania Railroad K4s 4-6-2 (1914), the New York Central's Dreyfuss
// streamlined J-3a Hudson 4-6-4 (1938) and a Golden Spike 4-4-0 American (1869:
// the Central Pacific's Jupiter and Union Pacific No. 119). Drawn by the steam
// kit (steamLoco.ts, steamGear.ts) from specs in source x (0 at the front
// coupler face, growing toward the rear), each a locomotive and a tender (the
// `unit` parameter), at their real size on the US loading gauge. Pilots and
// knuckle couplers replace the European buffer beams. See docs/models/us-steam.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildLoco, type LocoSpec } from "./steamLoco.ts";
import type { Steam } from "./steamParts.ts";
import { STEAM_CATALOG, UNIT_PARAM } from "./steamLocos.ts";
import { steamLocoLod } from "./lodSteam.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import type { Pt } from "./sliceLoft.ts";

type Spec = () => LocoSpec;
const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;
const COUPLER_Y = 0.88;

const US_STEAM_PALETTE: Record<string, MaterialSpec> = {
  knuckle: { color: "#3a3b3d", roughness: 0.7 },
  handrail: { color: "#c9ccce", roughness: 0.5, metallic: 0.2 },
  graphite: { color: "#55585b", roughness: 0.7, metallic: 0.2 },
  wood: { color: "#7a5532", roughness: 0.9 },
  silver: { color: "#c4c8cc", roughness: 0.35, metallic: 0.3 },
  cream: { color: "#ded6bf", roughness: 0.5 },
};

/**
 * A pilot and a knuckle coupler at a vehicle's end (e +1 the front, at source x
 * `head`): a slatted plate leaning back from the end, or a V-shaped cowcatcher
 * (`vee`) for the 19th-century engines; the coupler's face at the head. It
 * reaches `depth` metres back from the head: a front pilot reaches the frames,
 * so no gap shows between them.
 */
function pilot(t: Steam, e: number, head: number, half: number, top: number, mat: string, vee = false, depth = vee ? 1.1 : 0.55): void {
  const m = t.m;
  const face = t.X(head);
  m.scope(e > 0 ? "front pilot" : "rear pilot", () => {
    const back = face - e * depth;
    if (vee) {
      // two raked planes meeting in a point under the coupler
      for (const s of [-1, 1]) {
        const tip = [face - e * 0.15, 0] as const;
        m.slab(mat, [[tip[0], 0.12, 0], [back, 0.12, s * half], [back, top, s * half], [tip[0] - e * 0.35, top, 0]], [0, 0, -s * 0.03]);
      }
    } else {
      const sec: Pt[] = [[back, 0.15], [face - e * 0.25, 0.15], [face - e * 0.05, top], [back, top]];
      m.sweep(mat, "z", sec, -half, sec, half);
      // the footboard across the front pilot's top
      if (e > 0) t.box("black", Math.min(head + e * 0.35, head + e * 0.55), Math.max(head + e * 0.35, head + e * 0.55), top, top + 0.05, -half, half);
    }
    knuckleCoupler(m, e, e * face - 0.6, e * face, COUPLER_Y);
  });
}

/** The headlight on the smokebox front: housing and lens, `n` sides each. */
function headlight(t: Steam, x: number, y: number, r: number, n = 12): void {
  t.m.scope("headlight", () => {
    t.cylX("black", x + 0.3, x - 0.06, 0, y, r + 0.06, n);
    t.cylX("lampHead", x - 0.065, x - 0.09, 0, y, r, n);
  });
}

/** The bell on the boiler top. */
function bell(t: Steam, x: number, y: number): void {
  t.m.scope("bell", () => {
    t.cylY("brass", x, 0, y, y + 0.25, 0.14, 10);
    t.cylY("black", x, 0, y - 0.05, y, 0.05, 6);
  });
}

// ---------------------------------------------------------------------------
// Union Pacific Big Boy 4-8-8-4: two engines of four 68 in drivers under one boiler

const BB_DRIVER = ft(0, 68);

function bigBoySpec(): LocoSpec {
  const drivers = [5.45, 7.3, 9.15, 11.0, 14.5, 16.35, 18.2, 20.05];
  return {
    title: "UP Big Boy",
    palette: { ...US_STEAM_PALETTE, paint: { color: "#1d1e20", roughness: 0.6 }, wheel: { color: "#1d1e20", roughness: 0.6 }, frame: { color: "#1d1e20", roughness: 0.65 }, lining: { color: "#c4c8cc", roughness: 0.4 }, plate: { color: "#1d1e20", roughness: 0.6 }, plateText: { color: "#d9d9d4", roughness: 0.5 } },
    heads: [0, 26.0],
    beams: { front: false, rear: false },
    boiler: { x0: 1.35, x1: 19.0, y: 3.35, r: 1.2, smokebox: 2.6, bands: [6.5, 9.5, 12.5, 15.5], band: "lining" },
    chimney: { x: 3.0, top: 4.85, r: 0.36 },
    domes: [{ x: 6.4, top: 4.75, r: 0.45, len: 2.6 }, { x: 11.6, top: 4.72, r: 0.42 }],
    valves: { x: 17.6, top: 4.7 },
    handrail: { x0: 3.2, x1: 18.8, y: 3.55 },
    runningBoard: { profile: [[0.9, 1.55], [2.6, 1.55], [3.2, 2.25], [21.0, 2.25]], half: 1.6, valance: 0.1 },
    frame: { x0: 1.0, x1: 24.8, top: 2.15 },
    cab: {
      x0: 21.0, x1: 24.6, half: [[1.63, 1.95], [1.63, 4.15], [1.45, 4.45], [0.9, 4.78], [0, 4.9]], roofY: 4.45,
      windows: [{ x0: 21.4, x1: 22.4, y0: 3.3, y1: 4.0 }, { x0: 22.6, x1: 23.6, y0: 3.3, y1: 4.0 }],
      front: [{ z0: 0.95, z1: 1.45, y0: 3.6, y1: 4.1 }, { z0: -1.45, z1: -0.95, y0: 3.6, y1: 4.1 }],
    },
    prisms: [{ name: "firebox", x0: 17.0, x1: 21.0, half: [[1.3, 2.3], [1.3, 3.6], [1.15, 4.15], [0.75, 4.5], [0, 4.58]] }],
    bogies: [{ x0: 1.4, x1: 4.2, y: 0.62 }, { x0: 22.0, x1: 24.6, y: 0.7 }],
    gear: {
      wheels: [
        { x: 2.05, d: ft(0, 36), spokes: 0, outsideBoxes: true },
        { x: 3.55, d: ft(0, 36), spokes: 0, outsideBoxes: true },
        ...drivers.map((x) => ({ x, d: BB_DRIVER, spokes: 0 })),
        { x: 22.6, d: ft(0, 42), spokes: 0, outsideBoxes: true },
        { x: 24.0, d: ft(0, 42), spokes: 0, outsideBoxes: true },
      ],
      engines: [
        { coupled: [2, 3, 4, 5], main: 4, cylinder: { x0: 3.0, x1: 4.6, y: 1.12, r: 0.42 }, crank: 0.41, phase: 0.3, valveGear: true, name: "front" },
        { coupled: [6, 7, 8, 9], main: 8, cylinder: { x0: 12.0, x1: 13.6, y: 1.12, r: 0.42 }, crank: 0.41, phase: -0.5, valveGear: true, name: "rear" },
      ],
      cylinderZ: 1.2, reference: 4, wheelMaterial: "wheel",
    },
    number: { text: "4014", side: [22.9, 2.7, 1.63], front: [1.37, 2.85] },
    extras: (t) => {
      // ten-sided: the triangles its four frame stretches need within the 16,000
      headlight(t, 1.35, 3.55, 0.2, 10);
      bell(t, 1.9, 4.5);
      pilot(t, 1, 0, 1.45, 1.35, "paint", false, 1.0);
      t.m.scope("air pumps", () => { for (const s of [-1, 1]) t.cylY("graphite", 2.3, s * 1.35, 2.25, 3.3, 0.18, 6); });
      t.m.scope("drawbar", () => t.box("black", 24.6, 26.0, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function bigBoyTenderSpec(): LocoSpec {
  return {
    title: "UP Big Boy tender",
    palette: bigBoySpec().palette,
    heads: [0, 14.9],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 14.5, top: 1.35 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 14.4, half: [[1.6, 1.35], [1.6, 3.9], [1.5, 4.1]] },
      { name: "coal sides", x0: 0.6, x1: 6.8, half: [[1.6, 3.9], [1.6, 4.4], [1.45, 4.55]] },
    ],
    coal: { x0: 0.8, x1: 6.6, y: 4.5, half: 1.35, rise: 0.35 },
    bogies: [{ x0: 0.8, x1: 3.8, y: 0.62 }, { x0: 5.6, x1: 14.0, y: 0.62 }],
    gear: { wheels: [1.55, 3.05, 6.4, 8.05, 9.7, 11.35, 13.0].map((x) => ({ x, d: ft(0, 42), spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[14.42, 3.6, 0]] },
    extras: (t) => {
      t.m.scope("lettering", () => { for (const s of [-1, 1]) t.sidePlate(s, 7.2, 3.0, "UNION PACIFIC", 1.6, 0.36); });
      pilot(t, -1, 14.9, 1.3, 1.25, "paint");
    },
  };
}

// ---------------------------------------------------------------------------
// PRR K4s 4-6-2: the Pennsylvania's express Pacific, 80 in drivers and a Belpaire firebox

function k4sSpec(): LocoSpec {
  return {
    title: "PRR K4s",
    palette: { ...US_STEAM_PALETTE, paint: { color: "#1e2b23", roughness: 0.55 }, wheel: { color: "#1c1d1f", roughness: 0.6 }, frame: { color: "#1c1d1f", roughness: 0.65 }, lining: { color: "#d4b05a", roughness: 0.4 }, plate: { color: "#1e2b23", roughness: 0.55 }, plateText: { color: "#d4b05a", roughness: 0.4 } },
    heads: [0, 16.2],
    beams: { front: false, rear: false },
    boiler: { x0: 1.0, x1: 11.2, y: 3.05, r: 0.95, smokebox: 1.9, bands: [4.6, 7.0, 9.4] },
    chimney: { x: 2.0, top: 4.55, r: 0.3 },
    domes: [{ x: 4.8, top: 4.35, r: 0.4, len: 1.1 }, { x: 7.1, top: 4.38, r: 0.42 }],
    valves: { x: 10.2, top: 4.3 },
    handrail: { x0: 2.0, x1: 11.0, y: 3.25 },
    runningBoard: { profile: [[0.8, 1.5], [2.0, 1.5], [2.4, 2.15], [12.0, 2.15]], half: 1.5, valance: 0.08 },
    frame: { x0: 0.8, x1: 14.8, top: 2.05 },
    cab: {
      x0: 12.0, x1: 14.9, half: [[1.55, 1.9], [1.55, 3.95], [1.35, 4.25], [0.85, 4.45], [0, 4.52]], roofY: 4.2,
      windows: [{ x0: 12.35, x1: 13.1, y0: 3.15, y1: 3.8 }, { x0: 13.3, x1: 14.1, y0: 3.15, y1: 3.8 }],
      front: [{ z0: 0.85, z1: 1.3, y0: 3.4, y1: 3.85 }, { z0: -1.3, z1: -0.85, y0: 3.4, y1: 3.85 }],
    },
    // the Belpaire firebox: flat-topped with square shoulders
    prisms: [{ name: "firebox", x0: 9.6, x1: 12.0, half: [[1.15, 2.3], [1.15, 3.8], [1.05, 4.08], [0.8, 4.2], [0, 4.22]] }],
    bogies: [{ x0: 1.5, x1: 4.2, y: 0.6 }],
    gear: {
      wheels: [
        { x: 2.15, d: ft(0, 36), spokes: 10, outsideBoxes: true },
        { x: 3.65, d: ft(0, 36), spokes: 10, outsideBoxes: true },
        { x: 5.6, d: ft(0, 80), spokes: 20 },
        { x: 7.8, d: ft(0, 80), spokes: 20 },
        { x: 10.0, d: ft(0, 80), spokes: 20 },
        { x: 12.75, d: ft(0, 50), spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 2.3, x1: 3.5, y: 1.1, r: 0.38 }, crank: 0.36, phase: 0.4, valveGear: true }],
      cylinderZ: 1.15, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: "1361", side: [13.6, 2.6, 1.55], front: [1.02, 2.55] },
    extras: (t) => {
      headlight(t, 1.0, 4.1, 0.2);
      bell(t, 2.8, 3.95);
      pilot(t, 1, 0, 1.35, 1.3, "black", false, 0.8);
      t.m.scope("drawbar", () => t.box("black", 14.9, 16.2, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function k4sTenderSpec(): LocoSpec {
  return {
    title: "PRR K4s tender",
    palette: k4sSpec().palette,
    heads: [0, 13.4],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 12.9, top: 1.3 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 12.8, half: [[1.55, 1.3], [1.55, 3.55]] },
      { name: "coal sides", x0: 0.6, x1: 5.6, half: [[1.55, 3.55], [1.55, 3.9]] },
    ],
    coal: { x0: 0.8, x1: 5.4, y: 3.9, half: 1.35, rise: 0.4 },
    bogies: [{ x0: 1.2, x1: 4.6, y: 0.6 }, { x0: 8.4, x1: 11.8, y: 0.6 }],
    gear: { wheels: [1.7, 2.9, 4.1, 8.9, 10.1, 11.3].map((x) => ({ x, d: ft(0, 36), spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[12.82, 3.2, 0]] },
    extras: (t) => {
      t.m.scope("lettering", () => { for (const s of [-1, 1]) t.sidePlate(s, 6.8, 2.6, "PENNSYLVANIA", 1.55, 0.3); });
      pilot(t, -1, 13.4, 1.3, 1.2, "black");
    },
  };
}

// ---------------------------------------------------------------------------
// NYC J-3a Hudson 4-6-4 in Henry Dreyfuss's streamlining (the 20th Century Limited)

function hudsonSpec(): LocoSpec {
  const grey = "paint", dark = "lining";
  return {
    title: "NYC J-3a Hudson",
    palette: { ...US_STEAM_PALETTE, paint: { color: "#a9adb0", roughness: 0.45 }, lining: { color: "#3b4046", roughness: 0.5 }, wheel: { color: "#1c1d1f", roughness: 0.6 }, frame: { color: "#1c1d1f", roughness: 0.65 }, plate: { color: "#3b4046", roughness: 0.5 }, plateText: { color: "#e8e6df", roughness: 0.5 } },
    heads: [0, 17.6],
    beams: { front: false, rear: false },
    boiler: { x0: 2.3, x1: 12.4, y: 3.1, r: 0.98, smokebox: 0.6, bands: [] },
    chimney: { x: 3.0, top: 4.35, r: 0.28 },
    domes: [{ x: 6.0, top: 4.32, r: 0.38, len: 3.2 }],
    runningBoard: { profile: [[0.9, 1.45], [2.3, 1.45], [2.75, 2.05], [13.0, 2.05]], half: 1.5, valance: 0.32, mat: dark, valanceMat: grey },
    frame: { x0: 0.8, x1: 16.2, top: 2.0 },
    cab: {
      x0: 13.0, x1: 16.2, half: [[1.55, 1.85], [1.55, 4.0], [1.35, 4.3], [0.8, 4.52], [0, 4.6]], roofY: 4.3, mat: grey,
      windows: [{ x0: 13.4, x1: 14.3, y0: 3.15, y1: 3.85 }, { x0: 14.5, x1: 15.4, y0: 3.15, y1: 3.85 }],
      front: [{ z0: 0.85, z1: 1.3, y0: 3.45, y1: 3.9 }, { z0: -1.3, z1: -0.85, y0: 3.45, y1: 3.9 }],
    },
    prisms: [{ name: "firebox", x0: 10.6, x1: 13.0, half: [[1.15, 2.3], [1.15, 3.65], [0.95, 4.05], [0.55, 4.25], [0, 4.3]], mat: grey }],
    // the bullet nose over the smokebox: round, its fin along the top
    volumes: [{
      name: "nose casing",
      sec: Array.from({ length: 16 }, (_, i): Pt => { const a = (i / 16) * Math.PI * 2; return [1.0 * Math.cos(a), 3.1 + 1.0 * Math.sin(a)]; }),
      plan: [[0.85, 0.35], [1.1, 0.62], [1.5, 0.85], [2.0, 0.97], [2.6, 1.0]],
      top: [[0.85, 3.45], [1.1, 3.72], [1.5, 3.93], [2.0, 4.04], [2.6, 4.1]],
      bottom: [[0.85, 2.75], [1.1, 2.48], [1.5, 2.27], [2.0, 2.16], [2.6, 2.1]],
      bands: [[0, 2.95, grey], [2.95, 3.25, dark], [3.25, 9, grey]],
    }],
    bogies: [{ x0: 1.5, x1: 4.3, y: 0.6 }, { x0: 13.3, x1: 15.9, y: 0.66 }],
    gear: {
      wheels: [
        { x: 2.2, d: ft(0, 36), spokes: 0, outsideBoxes: true },
        { x: 3.7, d: ft(0, 36), spokes: 0, outsideBoxes: true },
        { x: 5.75, d: ft(0, 79), spokes: 0 },
        { x: 7.9, d: ft(0, 79), spokes: 0 },
        { x: 10.05, d: ft(0, 79), spokes: 0 },
        { x: 13.9, d: ft(0, 45), spokes: 0, outsideBoxes: true },
        { x: 15.3, d: ft(0, 45), spokes: 0, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 2.5, x1: 3.6, y: 1.08, r: 0.36 }, crank: 0.37, phase: 0.6, valveGear: true }],
      cylinderZ: 1.15, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: "5450", side: [14.9, 2.6, 1.55] },
    extras: (t) => {
      t.m.scope("fin", () => t.box(grey, 0.9, 2.6, 3.95, 4.32, -0.05, 0.05));
      headlight(t, 0.75, 3.25, 0.16);
      pilot(t, 1, 0, 1.4, 1.4, dark, false, 0.8);
      t.m.scope("drawbar", () => t.box("black", 16.2, 17.6, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function hudsonTenderSpec(): LocoSpec {
  return {
    title: "NYC J-3a Hudson tender",
    palette: hudsonSpec().palette,
    heads: [0, 15.4],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 14.9, top: 1.3 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 14.8, half: [[1.55, 1.3], [1.55, 3.85], [1.4, 4.1], [1.1, 4.25]] },
      { name: "skirt", x0: 0.3, x1: 14.8, half: [[1.56, 1.0], [1.56, 1.29]], mat: "lining" },
    ],
    bogies: [{ x0: 1.0, x1: 5.4, y: 0.6 }, { x0: 9.4, x1: 13.8, y: 0.6 }],
    gear: { wheels: [1.5, 3.2, 4.9, 9.9, 11.6, 13.3].map((x) => ({ x, d: ft(0, 36), spokes: 0 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[14.82, 3.4, 0]] },
    extras: (t) => {
      t.m.scope("lettering", () => { for (const s of [-1, 1]) t.sidePlate(s, 7.6, 2.6, "NEW YORK CENTRAL", 1.55, 0.28); });
      t.m.scope("stripe", () => { for (const s of [-1, 1]) t.sideBox("lining", s, 0.3, 14.8, 2.95, 3.25, 1.55, 1.556); });
      pilot(t, -1, 15.4, 1.3, 1.2, "lining");
    },
  };
}

// ---------------------------------------------------------------------------
// The Golden Spike 4-4-0 American: Central Pacific Jupiter and Union Pacific No. 119

export type AmericanLivery = "jupiter" | "no119";
const AMERICAN_PARAMS: ParamSpec[] = [
  UNIT_PARAM,
  { name: "livery", title: "Livery", default: "jupiter", values: [{ value: "jupiter", title: "Jupiter" }, { value: "no119", title: "UP No. 119" }] },
];

const AMERICAN_LIVERIES: Record<AmericanLivery, { palette: Record<string, MaterialSpec>; balloon: boolean; number: string; road: string }> = {
  // Jupiter: a royal blue boiler jacket and cab, red wheels and pilot, a balloon stack (a wood-burner)
  jupiter: { palette: { paint: { color: "#1f3b8c", roughness: 0.45 }, cabPaint: { color: "#8a1c1a", roughness: 0.5 }, wheel: { color: "#a3201f", roughness: 0.55 }, frame: { color: "#1c1d1f", roughness: 0.65 }, lining: { color: "#d4b05a", roughness: 0.4 }, plate: { color: "#8a1c1a", roughness: 0.5 }, plateText: { color: "#d4b05a", roughness: 0.4 } }, balloon: true, number: "60", road: "C.P.R.R." },
  // No. 119: a black jacket, maroon cab and red wheels, its straight stack (a coal-burner)
  no119: { palette: { paint: { color: "#232427", roughness: 0.5 }, cabPaint: { color: "#7a1f22", roughness: 0.5 }, wheel: { color: "#a3201f", roughness: 0.55 }, frame: { color: "#1c1d1f", roughness: 0.65 }, lining: { color: "#d4b05a", roughness: 0.4 }, plate: { color: "#7a1f22", roughness: 0.5 }, plateText: { color: "#d4b05a", roughness: 0.4 } }, balloon: false, number: "119", road: "U.P.R.R." },
};

function americanSpec(livery: AmericanLivery): LocoSpec {
  const l = AMERICAN_LIVERIES[livery];
  return {
    title: "Golden Spike 4-4-0",
    palette: { ...US_STEAM_PALETTE, ...l.palette },
    heads: [0, 10.4],
    beams: { front: false, rear: false },
    boiler: { x0: 1.2, x1: 7.4, y: 2.35, r: 0.62, smokebox: 1.3, bands: [3.4, 4.6, 5.8], band: "brass" },
    chimney: { x: 1.9, top: l.balloon ? 3.6 : 4.2, r: 0.2 },
    domes: [{ x: 4.1, top: 3.55, r: 0.32, mat: "brass" }, { x: 5.6, top: 3.45, r: 0.28, mat: "brass" }],
    valves: { x: 6.9, top: 3.3 },
    runningBoard: { profile: [[1.2, 1.55], [8.2, 1.55]], half: 1.35, valance: 0.06 },
    frame: { x0: 0.9, x1: 9.6, top: 1.5 },
    cab: {
      x0: 7.4, x1: 9.6, half: [[1.35, 1.6], [1.35, 3.45], [1.2, 3.62], [0.7, 3.78], [0, 3.85]], roofY: 3.55, mat: "cabPaint",
      windows: [{ x0: 7.7, x1: 8.35, y0: 2.6, y1: 3.2 }, { x0: 8.55, x1: 9.2, y0: 2.6, y1: 3.2 }],
      front: [{ z0: 0.7, z1: 1.1, y0: 2.8, y1: 3.25 }, { z0: -1.1, z1: -0.7, y0: 2.8, y1: 3.25 }],
    },
    prisms: [{ name: "firebox", x0: 6.4, x1: 7.4, half: [[0.62, 1.55], [0.62, 2.35], [0.5, 2.75], [0, 2.97]], mat: "paint" }],
    bogies: [{ x0: 1.2, x1: 3.5, y: 0.5 }],
    gear: {
      wheels: [
        { x: 1.75, d: ft(0, 30), spokes: 10, outsideBoxes: true },
        { x: 3.0, d: ft(0, 30), spokes: 10, outsideBoxes: true },
        { x: 5.0, d: ft(0, 60), spokes: 16 },
        { x: 7.4, d: ft(0, 60), spokes: 16 },
      ],
      engines: [{ coupled: [2, 3], main: 2, cylinder: { x0: 1.8, x1: 2.75, y: 1.15, r: 0.28 }, crank: 0.3, phase: 0.5 }],
      cylinderZ: 1.05, reference: 2, wheelMaterial: "wheel",
    },
    number: { text: l.number, side: [8.5, 2.1, 1.35], front: [1.22, 1.95] },
    extras: (t) => {
      // the big oil headlamp's box on the smokebox, the stack's balloon or its cap, the bell
      t.m.scope("headlamp", () => {
        t.box("cabPaint", 1.15, 1.65, 3.0, 3.58, -0.3, 0.3);
        t.box("lampHead", 1.1, 1.15, 3.12, 3.5, -0.18, 0.18);
        t.box("brass", 1.1, 1.68, 3.58, 3.66, -0.34, 0.34);
      });
      t.m.scope(l.balloon ? "balloon stack" : "stack cap", () => {
        if (l.balloon) { t.cylY("black", 1.9, 0, 3.6, 4.2, 0.55, 14); t.cylY("black", 1.9, 0, 4.2, 4.35, 0.42, 14); }
        else t.cylY("black", 1.9, 0, 4.2, 4.32, 0.3, 12);
      });
      bell(t, 3.3, 2.95);
      pilot(t, 1, 0, 1.25, 1.2, "wheel", true);
      t.m.scope("drawbar", () => t.box("black", 9.6, 10.4, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function americanTenderSpec(livery: AmericanLivery): LocoSpec {
  const l = AMERICAN_LIVERIES[livery];
  return {
    title: "Golden Spike 4-4-0 tender",
    palette: { ...US_STEAM_PALETTE, ...l.palette },
    heads: [0, 7.6],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 7.1, top: 1.25 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 7.0, half: [[1.35, 1.25], [1.35, 2.55]], mat: "cabPaint" },
      { name: "fuel sides", x0: 0.4, x1: 3.2, half: [[1.35, 2.55], [1.35, 2.75]], mat: "cabPaint" },
    ],
    ...(l.balloon ? {} : { coal: { x0: 0.5, x1: 3.1, y: 2.75, half: 1.2, rise: 0.45 } }),
    bogies: [{ x0: 0.7, x1: 3.0, y: 0.5 }, { x0: 4.4, x1: 6.7, y: 0.5 }],
    gear: { wheels: [1.25, 2.45, 4.9, 6.1].map((x) => ({ x, d: ft(0, 30), spokes: 0 })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[7.02, 2.3, 0]] },
    extras: (t) => {
      t.m.scope("lettering", () => { for (const s of [-1, 1]) t.sidePlate(s, 3.7, 1.75, l.road, 1.35, 0.26); });
      if (l.balloon) t.m.scope("wood", () => t.box("wood", 0.6, 3.0, 2.75, 3.15, -1.15, 1.15));
      pilot(t, -1, 7.6, 1.1, 1.1, "frame");
    },
  };
}

// ---------------------------------------------------------------------------
// Builders, distant models, designs

const unitOf = (params?: ParamValues) => resolveParams([UNIT_PARAM], params).unit;
const pair = (loco: Spec, tender: Spec) => (params?: ParamValues): LocoSpec => (unitOf(params) === "tender" ? tender() : loco());

const bigBoy = pair(bigBoySpec, bigBoyTenderSpec);
const k4s = pair(k4sSpec, k4sTenderSpec);
const hudson = pair(hudsonSpec, hudsonTenderSpec);
const american = (params?: ParamValues): LocoSpec => {
  const p = resolveParams(AMERICAN_PARAMS, params);
  const livery = p.livery as AmericanLivery;
  return p.unit === "tender" ? americanTenderSpec(livery) : americanSpec(livery);
};

export function upBigBoy(params?: ParamValues): MeshBuilder { return buildLoco(bigBoy(params)); }
export function upBigBoyLod(params?: ParamValues): MeshBuilder { return steamLocoLod(bigBoy(params)); }
export function prrK4s(params?: ParamValues): MeshBuilder { return buildLoco(k4s(params)); }
export function prrK4sLod(params?: ParamValues): MeshBuilder { return steamLocoLod(k4s(params)); }
export function nycHudson(params?: ParamValues): MeshBuilder { return buildLoco(hudson(params)); }
export function nycHudsonLod(params?: ParamValues): MeshBuilder { return steamLocoLod(hudson(params), 200); }
export function american440(params?: ParamValues): MeshBuilder { return buildLoco(american(params)); }
export function american440Lod(params?: ParamValues): MeshBuilder { return steamLocoLod(american(params)); }

/** The spec a US steam design builds (the tests read it). */
export function usSteamSpec(id: string, params?: ParamValues): LocoSpec {
  switch (id) {
    case "proc-vehicle-up-big-boy": return bigBoy(params);
    case "proc-vehicle-prr-k4s": return k4s(params);
    case "proc-vehicle-nyc-hudson": return hudson(params);
    case "proc-vehicle-american-440": return american(params);
    default: throw new Error(`no US steam design ${id}`);
  }
}

const withTender = (weight: number, power: number, maxspeed: number, tender: number): GameProperties => ({
  weight, power, maxspeed, accel: null, variants: [{ params: { unit: "tender" }, weight: tender, power: 0 }],
});

const AMERICAN_GAME: GameProperties = {
  weight: 40, power: 370, maxspeed: 80, accel: null,
  variants: [{ params: { unit: "tender" }, weight: 20, power: 0 }, { params: { unit: "tender", livery: "no119" }, weight: 20, power: 0 }],
};

export const US_STEAM: ProceduralDesign[] = [
  { id: "proc-vehicle-up-big-boy", title: "UP Big Boy", build: upBigBoy, buildLod: upBigBoyLod, params: [UNIT_PARAM], game: withTender(345, 4690, 129, 155), catalog: STEAM_CATALOG, loadingGauge: "us", references: "up-big-boy" },
  { id: "proc-vehicle-prr-k4s", title: "PRR K4s", build: prrK4s, buildLod: prrK4sLod, params: [UNIT_PARAM], game: withTender(141, 2400, 161, 95), catalog: STEAM_CATALOG, loadingGauge: "us", references: "prr-k4s" },
  { id: "proc-vehicle-nyc-hudson", title: "NYC J-3a Hudson", build: nycHudson, buildLod: nycHudsonLod, params: [UNIT_PARAM], game: withTender(163, 3500, 161, 130), lodTriangles: 200, catalog: STEAM_CATALOG, loadingGauge: "us", references: "nyc-hudson" },
  { id: "proc-vehicle-american-440", title: "Golden Spike 4-4-0", build: american440, buildLod: american440Lod, params: AMERICAN_PARAMS, game: AMERICAN_GAME, catalog: STEAM_CATALOG, loadingGauge: "us", references: "american-440" },
];
