// The Indian Railways WP class Pacific (2'C1' h2, 1947 - 1967) with its bogie
// tender, drawn on the steam kit (steamLoco.ts) from photographs of 7200 (the
// Baldwin prototype), 7161 'Akbar' (CLW) and 7043 in service
// (assets/ir-wp/SOURCES.md): the bullet-nosed conical smokebox door with its
// eight-pointed silver star, chrome rim and headlamp at the point, the big
// boiler pitched high with chrome bands and a squat chimney, the high running
// board whose deep valance sweeps down in an S to the buffer beam, the
// outside cylinders between the bogie wheels, the cowcatcher, the handrails
// rising past the nose, the cab and the high rectangular tender on two bogies.
// See docs/models/india-trains.md.
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Pt, Steam } from "./steamParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { hexagon, octagon, steamLocoLod, steamLodSpec } from "./lodSteam.ts";
import { fitLod, lodPolygon } from "./lodKit.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** A livery: the cab and tender (`paint`), the valance, sweep and cylinders (`trim`), lining, wheels and the number. */
export interface WpLivery {
  paint: string;
  trim: string;
  lining?: string;
  wheel: string;
  frame: string;
  number: string;
  /** The name on the board over the buffer beam, if any. */
  name?: string;
}

/** The two liveries (WORLD_STEAM keys `black` and `greenYellow`). */
export const WP_LIVERIES: Record<string, WpLivery> = {
  // in service: black, the valance, sweep, cylinders and buffer beam crimson, red wheels with white tyres (7043, 7200 'Ruby Queen')
  black: { paint: "#1d1e20", trim: "#a51a1f", wheel: "#a51a1f", frame: "#2a2224", number: "7200" },
  // 7161 'Akbar' (CLW 1965): green cab, tender, valance and cylinders lined in yellow, black wheels with white tyres
  greenYellow: { paint: "#1f5a3c", trim: "#1f5a3c", lining: "#d9b54a", wheel: "#1d1e20", frame: "#1d1e20", number: "7161", name: "AKBAR" },
};

function palette(l: WpLivery): Record<string, MaterialSpec> {
  return {
    paint: mat(l.paint, 0.55),
    trim: mat(l.trim, 0.55),
    lining: mat(l.lining ?? l.trim, 0.5),
    // the boiler, smokebox and nose: glossy black in both liveries
    jacket: mat("#18191b", 0.4),
    smokebox: mat("#1c1d22", 0.85),
    wheel: mat(l.wheel, 0.6),
    frame: mat(l.frame, 0.7),
    beam: mat("#b01e22", 0.55),
    tyre: { color: "#d4d7da", metallic: 0.4, roughness: 0.35 },
    // the star, the nose rim, the boiler bands, buffers, handrails and cowcatcher: polished or silver-painted
    chrome: { color: "#c9cdd1", metallic: 0.6, roughness: 0.25 },
    // buffers, couplings and fittings painted silver, as on every preserved WP
    steel: { color: "#aeb3b8", metallic: 0.4, roughness: 0.35 },
    numberYellow: mat("#e3b53a", 0.45),
    coal: { color: "#2a2b2e", metallic: 0.1, roughness: 0.8 },
  };
}

// --- the engine: 23.60 m over the buffers with the tender (77 ft 5 3/8 in) ---

/** Bogie axles (3 ft 7 in wheels), the coupled axles (5 ft 7 in drivers, 13 ft coupled wheelbase), the trailing truck. */
const LEAD = [1.7, 3.9];
const COUPLED = [5.9, 7.88, 9.86];
const TRAIL = 12.0;
const LEAD_D = 1.092;
const DRIVER_D = 1.702;
/** The engine's rear buffer heads. */
const END = 13.75;
/** Boiler centre and radius over the cladding (5 ft 11 in barrel), the running board's top. */
const BY = 2.88;
const BR = 0.92;
const RB = 2.02;
/** The smokebox from its front ring to the barrel; the nose ahead of it; the cab. */
const SMOKEBOX = [1.95, 3.6] as const;
const NOSE_DEPTH = 0.62;
const CAB0 = 11.3;
const CAB1 = 13.45;
const HALF = 1.58;
/** The running board's profile: down from the high board in an S to the buffer beam. */
const BOARD: Pt[] = [[0.78, 1.33], [1.05, 1.36], [1.35, 1.48], [1.65, 1.66], [1.95, 1.84], [2.25, 1.96], [2.55, 2.02], [CAB1 - 0.02, RB]];
const VALANCE = 0.28;
/** The S's segments drawn here (the first FRONT of BOARD); its fender plate 0.45 m deep, narrowing to the valance behind. */
const FRONT = 6;
const fenderDepth = (x: number) => (x <= 2.0 ? 0.45 : x >= 2.55 ? VALANCE : 0.45 + ((x - 2.0) / 0.55) * (VALANCE - 0.45));

/** The cab's right half section: wide, its roof about level with the boiler top. */
const CAB_HALF: Pt[] = [[HALF, RB], [HALF, 3.68], [1.45, 3.86], [0.85, 3.97], [0, 4.0]];

/** The nose's radius `d` ahead of the smokebox front: an ellipsoid cap, the headlamp at its point. */
const R_NOSE = BR + 0.04;
const noseR = (d: number) => R_NOSE * Math.sqrt(Math.max(0, 1 - (d / NOSE_DEPTH) ** 2));
/** The nose's stations ahead of the smokebox front, back to front; it is cut where the headlamp sits. */
const NOSE_D = [0, 0.16, 0.3, 0.41, 0.49, 0.55, 0.585];
const LAMP_R = 0.2;

/** A point on the nose at distance d ahead of the smokebox, radius rho, angle a (0 = right, counter-clockwise from ahead), `off` out along the surface's normal. */
function nosePoint(t: Steam, d: number, rho: number, a: number, off: number): Vec3 {
  // ellipse (d / D)^2 + (rho / R)^2 = 1: normal (d / D^2, rho / R^2)
  const nd = d / NOSE_DEPTH ** 2, nr = rho / R_NOSE ** 2;
  const l = Math.hypot(nd, nr) || 1;
  const dd = d + (off * nd) / l, rr = rho + (off * nr) / l;
  return [t.X(SMOKEBOX[0] - dd), BY + rr * Math.sin(a), rr * Math.cos(a)];
}

/** The distance ahead of the smokebox at which the nose has radius rho. */
const noseD = (rho: number) => NOSE_DEPTH * Math.sqrt(Math.max(0, 1 - (rho / R_NOSE) ** 2));

function nose(t: Steam): void {
  const m = t.m;
  const n = 24;
  m.scope("bullet nose", () => {
    for (let i = 0; i + 1 < NOSE_D.length; i++) {
      const [a, b] = [NOSE_D[i]!, NOSE_D[i + 1]!];
      m.sweep("jacket", "x", ngon(n, noseR(a), Math.PI / n, 0, BY), t.X(SMOKEBOX[0] - a), ngon(n, noseR(b), Math.PI / n, 0, BY), t.X(SMOKEBOX[0] - b), false);
    }
    // the chrome rim where the door meets the smokebox
    m.tube("chrome", "x", 0, BY, R_NOSE + 0.035, R_NOSE - 0.03, t.X(SMOKEBOX[0]) - 0.05, t.X(SMOKEBOX[0]) + 0.04, n, Math.PI / n);
  });
  m.scope("star", () => {
    // eight points: the four long ones up, down and to the sides reach the rim, the diagonals shorter
    const pts: Vec3[] = [];
    const base = 0.27;
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4 + Math.PI / 2;
      const tip = k % 2 === 0 ? R_NOSE * 0.9 : R_NOSE * 0.62;
      const w = Math.PI / 7;
      const steps = 4;
      const at = (j: number, side: number): Vec3 => {
        const f = j / steps;
        const rho = base + (tip - base) * f;
        return nosePoint(t, noseD(rho), rho, a + side * w * (1 - f) * (base / rho), 0.008);
      };
      for (let j = 0; j < steps; j++) {
        const [l0, r0, l1, r1] = [at(j, 1), at(j, -1), at(j + 1, 1), at(j + 1, -1)];
        pts.push(l0, r0, r1);
        if (j + 1 < steps) pts.push(l0, r1, l1);
      }
      // the hub between the points' feet, round the headlamp
      const b0 = nosePoint(t, noseD(base), base, a - w, 0.008), b1 = nosePoint(t, noseD(base), base, a + w, 0.008);
      const c0 = nosePoint(t, noseD(LAMP_R + 0.01), LAMP_R + 0.01, a - w, 0.008), c1 = nosePoint(t, noseD(LAMP_R + 0.01), LAMP_R + 0.01, a + w, 0.008);
      const b2 = nosePoint(t, noseD(base), base, a + Math.PI / 4 - w, 0.008), c2 = nosePoint(t, noseD(LAMP_R + 0.01), LAMP_R + 0.01, a + Math.PI / 4 - w, 0.008);
      pts.push(c0, b0, b1, c0, b1, c1, c1, b1, b2, c1, b2, c2);
    }
    // each facet looks forward and out
    for (let i = 0; i + 2 < pts.length; i += 3) m.facets("chrome", pts.slice(i, i + 3), [1, 0, 0]);
  });
  m.scope("headlamp", () => {
    const d0 = NOSE_D[NOSE_D.length - 1]!;
    const x = SMOKEBOX[0] - d0;
    t.cylX("chrome", x + 0.04, x - 0.2, 0, BY, LAMP_R + 0.03, 16);
    const lens = ngon(16, LAMP_R - 0.03, Math.PI / 16, 0, BY);
    m.sweep("lampHead", "x", lens, t.X(x - 0.2) - 0.01, lens, t.X(x - 0.2) + 0.008);
  });
}

function engineExtras(t: Steam, l: WpLivery): void {
  const m = t.m;
  nose(t);
  m.scope("front frames", () => {
    // the plate frames ahead of the high running board: low, under the sloping front deck
    for (const s of [-1, 1]) t.sideFrame("frame", s, 0.82, 2.6, 0.45, 1.25, 0.52, 0.6);
  });
  // the running board's front S: a tread along each side and the broad fender plate under it
  // (the high board behind is the kit's runningBoard), the middle left open over the frames
  const [zIn, zOut] = [HALF - 0.08 - 0.03, HALF - 0.08 - 0.005];
  m.scope("front fenders", () => {
    for (let i = 0; i < FRONT; i++) {
      const [[xa, ya], [xb, yb]] = [BOARD[i]!, BOARD[i + 1]!];
      const tread: Pt[] = [[t.X(xa), ya - 0.04], [t.X(xb), yb - 0.04], [t.X(xb), yb], [t.X(xa), ya]];
      for (const s of [-1, 1]) m.sweep("black", "z", tread, s * 1.12, tread, s * zOut);
      const plate: Pt[] = [[t.X(xa), ya - 0.04 - fenderDepth(xa)], [t.X(xb), yb - 0.04 - fenderDepth(xb)], [t.X(xb), yb - 0.04], [t.X(xa), ya - 0.04]];
      for (const s of [-1, 1]) m.sweep("trim", "z", plate, s * zIn, plate, s * zOut);
    }
  });
  m.scope("front step", () => {
    // the platform behind the buffer beam, the smokebox's front plate under the nose
    t.box("black", 0.8, 1.62, 1.4, 1.46, -1.1, 1.1);
    t.box("smokebox", 1.62, 2.12, 1.4, 2.02, -0.75, 0.75);
  });
  if (l.name) m.scope("nameboard", () => {
    // the board on its bracket over the beam, under the nose (7161 'Akbar'; 7200 and the engines in service carry none)
    for (const z of [-0.32, 0.32]) t.box("steel", 0.86, 0.9, 1.46, 1.62, z - 0.025, z + 0.025);
    t.box("lining", 0.82, 0.86, 1.6, 1.98, -0.5, 0.5);
    t.box("trim", 0.808, 0.84, 1.63, 1.95, -0.47, 0.47);
    if (l.name) {
      const h = 0.15, w = h * 0.62, gap = h * 0.2;
      const width = strokeWidth(l.name, w, gap);
      m.facets("lining", strokeText(l.name, width / 2, 1.715, h, w, gap, true).map(([u, v]): Vec3 => [t.X(0.808) + 0.004, v, u]), [1, 0, 0]);
    }
  });
  if (l.lining) {
    m.scope("valance lining", () => {
      // a yellow line along the fender's and valance's foot, both sides, following the S
      for (const s of [-1, 1]) for (let i = 0; i + 1 < BOARD.length; i++) {
        const [[xa, ya], [xb, yb]] = [BOARD[i]!, BOARD[i + 1]!];
        const [y0, y1] = [ya - fenderDepth(xa), yb - fenderDepth(xb)];
        const z = s * (zOut + 0.006);
        const pts: Vec3[] = [[t.X(xa), y0, z], [t.X(xb), y1, z], [t.X(xb), y1 + 0.05, z], [t.X(xa), y0 + 0.05, z]];
        m.slab("lining", pts, [0, 0, -s * 0.003]);
      }
    });
  }
  m.scope("cowcatcher", () => {
    // the bar pilot: heavy horizontal bars raked back toward the rail, on uprights
    const rows = [0.68, 0.54, 0.4, 0.27, 0.15];
    const front = (y: number) => 0.62 + (0.72 - y) * 0.42;
    for (const y of rows) {
      const half = 1.12 - (0.72 - y) * 0.25;
      t.box("chrome", front(y), front(y) + 0.06, y - 0.04, y + 0.04, -half, half);
    }
    for (const z of [-1.0, -0.5, 0, 0.5, 1.0]) m.rod("chrome", [t.X(front(0.74) + 0.07), 0.74, z], [t.X(front(0.1) + 0.07), 0.1, z * 0.95], 0.03, 4);
  });
  m.scope("nose handrails", () => {
    // the bright rails from the buffer beam up beside the nose to the height of the star's upper points, then in to the smokebox
    for (const s of [-1, 1]) {
      const p: Vec3[] = [[t.X(0.74), 1.34, s * 1.02], [t.X(1.5), 2.7, s * 1.04], [t.X(1.75), 3.3, s * 1.0], [t.X(2.15), 3.38, s * 0.86]];
      for (let i = 0; i + 1 < p.length; i++) m.rod("chrome", p[i]!, p[i + 1]!, 0.022, 6);
    }
    // the rail across the nose below the headlamp
    m.rod("chrome", nosePoint(t, noseD(0.62), 0.62, -Math.PI / 2 - 0.55, 0.05), nosePoint(t, noseD(0.62), 0.62, -Math.PI / 2 + 0.55 - Math.PI * 2, 0.05), 0.02, 6);
  });
  m.scope("buffer beam figures", () => {
    // the number and class in yellow on the red beam between the buffers
    const X = t.X(0.62) + 0.006;
    const h = 0.15;
    const text = (s: string, z: number) => {
      const w = h * 0.58, gap = h * 0.18;
      const width = strokeWidth(s, w, gap);
      m.facets("numberYellow", strokeText(s, z + width / 2, 1.1, h, w, gap, true).map(([u, v]): Vec3 => [X, v, u]), [1, 0, 0]);
    };
    text(l.number, 0.36);
    text("WP", -0.4);
  });
  m.scope("cab roof vent", () => t.box("roof", 11.8, 12.9, 4.03, 4.11, -0.35, 0.35));
  m.scope("whistle", () => t.cylY("brass", CAB0 - 0.25, 0.3, BY + BR * 0.95, BY + BR + 0.28, 0.035, 8));
}

function engine(l: WpLivery): LocoSpec {
  const bands = [4.4, 5.25, 6.1, 6.95, 7.8, 8.65, 9.5, 10.35];
  // the barrel in the jacket's black (Steam.boiler and the distant model read `paint`)
  const boiler = { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands, band: "chrome", n: 24, paint: "jacket" };
  return {
    title: "IR WP",
    palette: palette(l),
    heads: [0, END],
    beams: { y0: 0.78, y1: 1.33, length: [0.62, 0.3], half: 1.5 },
    boiler,
    // the chimney squat on the smokebox top
    chimney: { x: 2.8, top: 3.98, r: 0.3 },
    // a low steam dome halfway along the barrel
    domes: [{ x: 7.4, top: 3.98, r: 0.42, len: 1.2, mat: "jacket" }],
    valves: { x: CAB0 - 0.7, top: 3.98 },
    handrail: { x0: 3.9, x1: 10.9, y: BY + 0.28 },
    runningBoard: { profile: BOARD.slice(FRONT), half: HALF - 0.08, valance: VALANCE, valanceMat: "trim" },
    frame: { x0: 2.6, x1: CAB1, top: Math.min(RB - 0.1, BY - BR - 0.05) },
    cab: {
      x0: CAB0, x1: CAB1, half: CAB_HALF, roofY: 3.68,
      windows: [{ x0: 11.45, x1: 12.15, y0: 2.88, y1: 3.48 }, { x0: 12.35, x1: 13.0, y0: 2.88, y1: 3.48 }],
      front: [{ z0: 0.98, z1: 1.42, y0: 3.08, y1: 3.52 }, { z0: -1.42, z1: -0.98, y0: 3.08, y1: 3.52 }],
    },
    // the round-topped firebox behind the barrel, down to the running board
    prisms: [{ name: "firebox", x0: 9.95, x1: CAB0, mat: "jacket", half: [[BR + 0.05, RB], [BR + 0.05, BY + 0.3], [BR * 0.85, BY + BR * 0.6], [BR * 0.5, BY + BR * 0.9], [0, BY + BR]] }],
    bogies: [
      { x0: LEAD[0]! - 0.65, x1: LEAD[1]! + 0.65, y: LEAD_D * 0.62 },
      { x0: TRAIL - 0.75, x1: TRAIL + 0.75, y: LEAD_D * 0.62 },
    ],
    gear: {
      wheels: [
        ...LEAD.map((x) => ({ x, d: LEAD_D, spokes: 10, outsideBoxes: true })),
        ...COUPLED.map((x) => ({ x, d: DRIVER_D, spokes: 20 })),
        { x: TRAIL, d: LEAD_D, spokes: 12 },
      ],
      // two outside cylinders 20 1/4 x 28 in between the bogie axles; the main rods drive the middle coupled axle
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 2.3, x1: 3.35, y: 1.05, r: 0.4 }, crank: 0.356, phase: 0.3, valveGear: true }],
      cylinderZ: 1.12, reference: 3, wheelMaterial: "wheel", cylinderMat: "trim", cylinderCoverMat: "chrome",
    },
    lamps: { front: [[0.7, 1.33, 0.62], [0.7, 1.33, -0.62]], rear: [[CAB1 - 0.05, 1.33, 0.7], [CAB1 - 0.05, 1.33, -0.7]] },
    number: { text: l.number, side: [12.75, 2.35, HALF] },
    extras: (t) => engineExtras(t, l),
  };
}

// --- the bogie tender: 9.85 m over the buffers, 5,500 gallons and 15 tons of coal ---

const T_END = 9.85;
const T_AXLES = [1.35, 3.05, 6.8, 8.5];
const TANK = [0.45, 9.2] as const;
const TANK_FOOT = 1.25;
const TANK_TOP = 3.3;
const T_HALF = 1.58;
/** The coal space at the front, its boards higher than the tank. */
const COAL = [0.5, 5.6] as const;
const COAL_TOP = 3.72;
const COAL_HALF = 1.5;

function tenderExtras(t: Steam, l: WpLivery): void {
  const m = t.m;
  if (l.lining) {
    m.scope("lining", () => {
      // a yellow line round the tank sides
      for (const s of [-1, 1]) t.sideBox("lining", s, TANK[0] + 0.2, TANK[1] - 0.2, 2.75, 2.8, T_HALF - 0.004, T_HALF + 0.004);
    });
  }
  m.scope("sole bars", () => {
    for (const s of [-1, 1]) t.sideBox("trim", s, 0.35, 9.3, 1.02, TANK_FOOT + 0.04, T_HALF - 0.16, T_HALF - 0.04);
  });
  m.scope("coal board louvres", () => {
    // the vents at the front of the coal boards
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) t.sideBox("black", s, 0.75 + i * 0.14, 0.83 + i * 0.14, 3.0, 3.6, COAL_HALF - 0.004, COAL_HALF + 0.012);
  });
  m.scope("water filler", () => t.cylY("paint", 8.2, 0, TANK_TOP - 0.02, TANK_TOP + 0.12, 0.3, 12));
  m.scope("rear ladder", () => {
    for (const z of [-0.3, 0.3]) t.box("chrome", TANK[1] + 0.03, TANK[1] + 0.06, 1.4, TANK_TOP, z - 0.02, z + 0.02);
    for (let i = 0; i < 5; i++) t.box("chrome", TANK[1] + 0.03, TANK[1] + 0.06, 1.6 + i * 0.35, 1.63 + i * 0.35, -0.3, 0.3);
  });
  m.scope("numbers", () => t.endPlate(-1, TANK[1], 2.6, l.number));
}

function tender(l: WpLivery): LocoSpec {
  return {
    title: "IR WP tender",
    palette: palette(l),
    heads: [0, T_END],
    beams: { y0: 0.78, y1: 1.33, length: [0.3, 0.62], half: 1.5 },
    frame: { x0: 0.35, x1: 9.25, top: TANK_FOOT + 0.02 },
    prisms: [
      { name: "tank", x0: TANK[0], x1: TANK[1], half: [[T_HALF, TANK_FOOT], [T_HALF, TANK_TOP - 0.1], [T_HALF - 0.08, TANK_TOP - 0.01], [T_HALF - 0.2, TANK_TOP]] },
      { name: "coal boards", x0: COAL[0], x1: COAL[1], half: [[COAL_HALF, TANK_TOP - 0.02], [COAL_HALF, COAL_TOP - 0.06], [COAL_HALF - 0.08, COAL_TOP]] },
    ],
    coal: { x0: COAL[0] + 0.1, x1: COAL[1] - 0.1, y: COAL_TOP - 0.1, half: COAL_HALF - 0.12, rise: 0.3 },
    bogies: [{ x0: T_AXLES[0]! - 0.6, x1: T_AXLES[1]! + 0.6, y: 0.6 }, { x0: T_AXLES[2]! - 0.6, x1: T_AXLES[3]! + 0.6, y: 0.6 }],
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 0.95, spokes: 10 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[9.3, 1.33, 0.7], [9.3, 1.33, -0.7]] },
    extras: (t) => tenderExtras(t, l),
  };
}

/** The WP's engine or tender spec, by the `unit` and `livery` parameters' values. */
export function wpSpec(unit: string, livery: string): LocoSpec {
  const l = WP_LIVERIES[livery] ?? WP_LIVERIES.black!;
  return unit === "tender" ? tender(l) : engine(l);
}

/** The distant model: the kit's, with the bullet nose as a short cone ahead of the smokebox (octagonal, hexagonal where the budget is short). */
export function wpLod(unit: string, livery: string): MeshBuilder {
  const spec = wpSpec(unit, livery);
  if (unit === "tender") return steamLocoLod(spec);
  const xc = (spec.heads[0] + spec.heads[1]) / 2;
  const X0 = xc - SMOKEBOX[0], X1 = xc - (SMOKEBOX[0] - NOSE_DEPTH * 0.85);
  // the running board's S as three straight stretches
  const board: Pt[] = [BOARD[0]!, BOARD[3]!, BOARD[6]!, BOARD[BOARD.length - 1]!];
  const far: LocoSpec = { ...spec, runningBoard: { ...spec.runningBoard!, profile: board } };
  const withNose = (n: number, ring: typeof octagon) => {
    const lod = steamLodSpec(far, ring);
    // the smokebox ring's corners: the octagon's 22.5 degrees off the horizontal, the hexagon's on it
    const rot = n === 8 ? Math.PI / 8 : 0;
    const P = (i: number): Vec3 => [X0, BY + R_NOSE * Math.sin(rot + (i * 2 * Math.PI) / n), R_NOSE * Math.cos(rot + (i * 2 * Math.PI) / n)];
    const tip: Vec3 = [X1, BY, 0];
    lod.parts.push({ draw: (m) => m.scope("nose", () => {
      // a low pyramid on the smokebox front
      for (let i = 0; i < n; i++) {
        const mid = rot + ((i + 0.5) * 2 * Math.PI) / n;
        lodPolygon(m, "jacket", [P(i), P(i + 1), tip], [R_NOSE, (X1 - X0) * Math.sin(mid), (X1 - X0) * Math.cos(mid)]);
      }
    }) });
    return fitLod(lod, 100);
  };
  try {
    return withNose(8, octagon);
  } catch {
    return withNose(6, hexagon);
  }
}
