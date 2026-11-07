// The JNR DD51 centre-cab diesel-hydraulic (1962, B-2-B, 18.0 m; docs/models/jnr-locos.md):
// its own builder, measured from the photographs in assets/jnr-dd51/. A cab taller than the
// hoods with two windscreens front and back either side of a round column; the two hoods with
// their rolled roof edges, rounded corners and flat ends carrying the two sealed-beam lamps and
// the cut-out number in the grey top; the radiator section at each hood end standing proud,
// meshed, the fan on its roof; louvres over the side doors; the low grille box beside each hood
// at the cab; the grey roofs and the white line under them; the light grey end beams with the
// walkway frames; two DT113 powered bogies and the idle TR106 in the middle.
// Metres, +X toward the hood end "1", +Y up, +Z right, rail top at y = 0.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { onEnd, onSide, rect, roundRect, shell, surfaceDecal, surfacePanel, type Place, type ShellSpec } from "./czElectricKit.ts";
import { DIESEL_PALETTE, bogie, exhaust, horn, paint, roofFan, type BogieSpec } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { endText, knuckleCoupler, sideText } from "./usHoodKit.ts";
import type { Band } from "./cd163.ts";
import { czShellLod, locoLod, screen, sideWindows, type LocoBox } from "./lodLocos.ts";
import { lodBands, type LodShell } from "./lodKit.ts";

// ---------------------------------------------------------------------------
// Measures (ja.wikipedia "国鉄DD51形ディーゼル機関車": 18,000 mm over couplers, 2,950.6 mm wide,
// 3,800 mm roof, 860 mm wheels, 2,200 mm powered and 1,600 mm idle wheelbase; the rest from the
// photographs, see assets/jnr-dd51/SOURCES.md)

export const DD51_LENGTH = 18.0;
const SILL = 8.45; // the end beams' faces
const DECK = 1.25; // the walkways' top
const FRAME_BOTTOM = 0.9;
const HALF = 1.475; // the frame's and the cab's half width
const BEAM_BOTTOM = 0.45;
const HOOD = { x0: 1.45, x1: 6.4, half: 1.08, top: 3.0, r: 0.2 };
/** The radiator section at each hood end: a little wider and taller than the hood. */
const RAD = { x0: 6.25, x1: 7.8, half: 1.11, top: 3.05, r: 0.2, endR: 0.13, endRoll: 0.12 };
const CAB = { half: 1.5, w: HALF, eave: 3.62, top: 3.82 };
/** The white line (or the gold band) under the grey hood top, at the same height on hoods and cab. */
const LINE: readonly [number, number] = [2.53, 2.65];
const SCREEN = { z0: 0.3, z1: 1.3, y0: 3.06, y1: 3.48 };
const TRUCK_X = 5.9;
const DT113: BogieSpec = { axles: [-1.1, 1.1], wheelR: 0.43, frameHalf: 1.75, frameTop: 0.95, frameBottom: 0.58, frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.42, 0.42], secondaryZ: 1.1, bolster: 1.0 };
// the idle TR106: 1,600 mm wheelbase drawn as 1,460 mm so its brake cylinders clear the shared bogie's transoms
const TR106: BogieSpec = { axles: [-0.73, 0.73], wheelR: 0.43, frameHalf: 1.3, frameTop: 0.95, frameBottom: 0.6, frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.5, 0.5], secondaryZ: 1.1, bolster: 1.0 };
const TANK = { x0: 1.45, x1: 3.95, y0: 0.45 };
/** The low grille box beside each hood next to the cab. */
const BOX = { x0: 1.5, x1: 4.0, top: DECK + 0.55, out: 1.38 };

export interface Dd51Livery {
  title: string;
  number: string;
  palette: Record<string, MaterialSpec>;
  /** Hood paint by height (sides and ends), to the roof. */
  hood: readonly Band[];
  /** Cab paint by height, to the roof. */
  cab: readonly Band[];
  /** The materials: body colour, roof, the column between the windscreens, the lamp housings, numbers, handrails. */
  body: string;
  roof: string;
  column: string;
  lampBox: string;
  numberMat: string;
  numberSide: string;
  rails: string;
  /** The end beams' paint. */
  beam: string;
  /** A round train headboard on each hood end (its face and rim). */
  headboard?: readonly [string, string];
}

const PALETTE: Record<string, MaterialSpec> = {
  ...DIESEL_PALETTE,
  knuckle: paint("#3a3b3d", 0.7),
  ddFrame: paint("#2a2b2d", 0.8),
  ddWalk: paint("#4a4c4f", 0.9),
  ddBeam: paint("#c4c6c5", 0.55),
  ddEdge: paint("#efefea", 0.45),
  ddMesh: paint("#5b5f62", 0.7),
  ddSeam: paint("#5a2016", 0.8),
  ddRail: paint("#ecedea", 0.45),
  ddSilver: { color: "#b9bdbf", metallic: 0.5, roughness: 0.35 },
};

export const DD51_LIVERIES: Record<string, Dd51Livery> = {
  jnr: {
    title: "JNR red", number: "DD51 842",
    palette: { ddRed: paint("#c9412b"), ddGrey: paint("#c2c4c3", 0.6), ddLine: paint("#f0f0ea", 0.45), ddNum: paint("#3b3e41", 0.5) },
    hood: [[0, LINE[0], "ddRed"], [LINE[0], LINE[1], "ddLine"], [LINE[1], 9, "ddGrey"]],
    cab: [[0, LINE[0], "ddRed"], [LINE[0], LINE[1], "ddLine"], [LINE[1], CAB.eave, "ddRed"], [CAB.eave, 9, "ddGrey"]],
    body: "ddRed", roof: "ddGrey", column: "ddSilver", lampBox: "ddGrey", numberMat: "ddNum", numberSide: "ddSilver", rails: "ddRail", beam: "ddBeam",
  },
  hokutosei: {
    title: "Hokutosei blue", number: "DD51 1093",
    palette: { ddBlue: paint("#1f3a86"), ddGold: { color: "#c9a55a", metallic: 0.4, roughness: 0.35 }, ddDark: paint("#3a3e44", 0.7), ddBeamDark: paint("#8b9095", 0.6) },
    hood: [[0, 2.41, "ddBlue"], [2.41, 2.45, "ddGold"], [2.45, LINE[0], "ddBlue"], [LINE[0], LINE[1], "ddGold"], [LINE[1], HOOD.top - 0.12, "ddBlue"], [HOOD.top - 0.12, 9, "ddDark"]],
    cab: [[0, 2.41, "ddBlue"], [2.41, 2.45, "ddGold"], [2.45, LINE[0], "ddBlue"], [LINE[0], LINE[1], "ddGold"], [LINE[1], CAB.eave, "ddBlue"], [CAB.eave, 9, "ddDark"]],
    body: "ddBlue", roof: "ddDark", column: "ddBlue", lampBox: "ddGold", numberMat: "ddGold", numberSide: "ddGold", rails: "ddRail", beam: "ddBeamDark", headboard: ["ddBlue", "ddRail"],
  },
};

// ---------------------------------------------------------------------------
// Shells

/** A rolled edge of radius r at the top: [y, inset] from the vertical wall to the crown. */
function roll(top: number, r: number, from: number): Array<[number, number]> {
  return [[from, 0], [top - r, 0], [top - r * 0.5, r * (1 - Math.cos(Math.PI / 6))], [top - r * 0.134, r * 0.5], [top, r]];
}
const lerp = (t: ReadonlyArray<readonly [number, number]>, y: number): number => {
  if (y <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) if (y <= t[i]![0]) return t[i - 1]![1] + ((t[i]![1] - t[i - 1]![1]) * (y - t[i - 1]![0])) / (t[i]![0] - t[i - 1]![0]);
  return t[t.length - 1]![1];
};

/** A hood section from x0 to x1 (|x|, toward end e), its roof edges rolled; `endR` rounds the drawn end's corners and top. */
function hoodShell(e: number, x0: number, x1: number, half: number, top: number, r: number, l: Dd51Livery, ends: readonly number[], endR = 0, endRollR = 0): ShellSpec {
  const side = roll(top, r, DECK);
  const len = (x1 - x0) / 2;
  const endRoll = endRollR > 0 ? roll(top, endRollR, DECK) : [[DECK, 0], [top, 0]] as Array<[number, number]>;
  const rc = endR;
  return {
    heights: [...new Set([...side, ...endRoll].map((p) => p[0]))].sort((a, b) => a - b),
    xc: e * (x0 + x1) / 2,
    tip: (y) => len - lerp(endRoll, y),
    hw: (y) => half - lerp(side, y),
    endPlan: (y) => {
      const w = half - lerp(side, y);
      if (rc <= 0) return [[0, 0], [w - 0.03, 0], [w, 0.03]];
      const k = Math.min(rc, w * 0.4);
      return [[0, 0], [w - k, 0], [w - k + k * 0.5, k * (1 - Math.cos(Math.PI / 6))], [w - k + k * 0.866, k * 0.5], [w, k]];
    },
    side: l.hood, end: l.hood, corner: "side", roof: l.roof, ends,
  };
}

function cabShell(l: Dd51Livery): ShellSpec {
  const prof: Array<[number, number]> = [[DECK, 0], [CAB.eave, 0], [CAB.eave + 0.1, 0.08], [CAB.eave + 0.2, 0.32], [CAB.top, 0.9]];
  return {
    heights: prof.map((p) => p[0]),
    xc: 0,
    tip: () => CAB.half,
    hw: (y) => CAB.w - lerp(prof, y),
    endPlan: (y) => { const w = CAB.w - lerp(prof, y); return [[0, 0], [w - 0.06, 0], [w, 0.06]]; },
    side: l.cab, end: l.cab, corner: "side", roof: l.roof,
  };
}

const hoodMain = (e: number, l: Dd51Livery) => hoodShell(e, HOOD.x0, HOOD.x1, HOOD.half, HOOD.top, HOOD.r, l, []);
const radiator = (e: number, l: Dd51Livery) => hoodShell(e, RAD.x0, RAD.x1, RAD.half, RAD.top, RAD.r, l, [-1, 1], RAD.endR, RAD.endRoll);

// ---------------------------------------------------------------------------
// Drawing helpers

const decal = (m: MeshBuilder, mat: string, at: Place, n: Vec3, u0: number, u1: number, v0: number, v1: number, d = 0.004) =>
  surfaceDecal(m, mat, at, n, [rect(Math.min(u0, u1), v0, Math.max(u0, u1), v1)], d);

/** A window: a rubber frame and its glass, rounded, on a surface. */
function pane(m: MeshBuilder, at: Place, n: Vec3, u0: number, u1: number, v0: number, v1: number, r = 0.07): void {
  const [a, b] = [Math.min(u0, u1), Math.max(u0, u1)];
  surfacePanel(m, "rubber", at, n, roundRect(a, b, v0, v1, r, 2), -0.01, 0.012);
  surfacePanel(m, "glass", at, n, roundRect(a + 0.05, b - 0.05, v0 + 0.05, v1 - 0.05, Math.max(0.01, r - 0.03), 2), -0.01, 0.018);
}

/** A U-shaped grab handle standing off a wall at (x, z = s * zw) from y0 to y1. */
function grab(m: MeshBuilder, mat: string, x: number, s: number, zw: number, y0: number, y1: number, off = 0.08): void {
  const z = s * (zw + off);
  m.rod(mat, [x, y0, z], [x, y1, z], 0.018, 6);
  for (const y of [y0, y1]) m.rod(mat, [x, y, s * (zw - 0.01)], [x, y, z], 0.015, 6, false);
}

// ---------------------------------------------------------------------------
// The model

export function buildDd51(l: Dd51Livery): MeshBuilder {
  const m = new MeshBuilder({ ...PALETTE, ...l.palette });
  m.scope("frame", () => frame(m, l));
  for (const e of [1, -1]) m.scope(e > 0 ? "hood 1" : "hood 2", () => hood(m, l, e));
  m.scope("cab", () => cab(m, l));
  m.scope("trucks", () => {
    m.scope("front truck", () => bogie(m, TRUCK_X, DT113));
    m.scope("middle truck", () => bogie(m, 0, TR106));
    m.scope("rear truck", () => bogie(m, -TRUCK_X, DT113));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}

function frame(m: MeshBuilder, l: Dd51Livery): void {
  const F = SILL - 0.25;
  m.scope("sills", () => {
    block(m, "ddFrame", -F, F, FRAME_BOTTOM, DECK - 0.04, -HALF, HALF);
    block(m, "ddWalk", -F, F, DECK - 0.04, DECK, -HALF + 0.005, HALF - 0.005);
    // the white edge of the running board along both sides
    for (const s of [-1, 1]) m.facets("ddEdge", [[-F, DECK - 0.13, s * (HALF + 0.004)], [F, DECK - 0.13, s * (HALF + 0.004)], [F, DECK, s * (HALF + 0.004)], [-F, DECK - 0.13, s * (HALF + 0.004)], [F, DECK, s * (HALF + 0.004)], [-F, DECK, s * (HALF + 0.004)]], [0, 0, s]);
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "end 1" : "end 2", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the light grey end beam, the end platform's plate on it
      m.scope("end beam", () => {
        block(m, l.beam, ...along(SILL - 0.28, SILL), BEAM_BOTTOM, DECK - 0.005, -HALF + 0.008, HALF - 0.008);
        block(m, "ddWalk", ...along(SILL - 0.27, SILL - 0.01), DECK - 0.005, DECK + 0.01, -HALF + 0.02, HALF - 0.02);
        // the skirt under the beam, set back a little
        block(m, "ddFrame", ...along(SILL - 0.27, SILL - 0.06), 0.2, BEAM_BOTTOM + 0.02, -1.2, 1.2);
      });
      m.scope("lamps", () => {
        for (const z of [-1.08, 1.08]) {
          m.sweep("black", "x", ngon(10, 0.12, 0, z, 1.02), e * SILL, ngon(10, 0.12, 0, z, 1.02), e * (SILL + 0.05));
          m.sweep("lampRed", "x", ngon(10, 0.085, 0, z, 1.02), e * (SILL + 0.05), ngon(10, 0.085, 0, z, 1.02), e * (SILL + 0.06));
        }
      });
      m.scope("coupler", () => knuckleCoupler(m, e, SILL, DD51_LENGTH / 2, 0.88));
      m.scope("hoses", () => {
        for (const z of [-0.45, 0.45, -0.75, 0.75]) m.loft("rubber", ngon(6, 0.03, 0, e * (SILL - 0.02), z), 0.48, ngon(6, 0.03, 0, e * (SILL + 0.2), z), 0.8);
        for (const z of [-0.45, 0.45, -0.75, 0.75]) block(m, "steel", ...along(SILL, SILL + 0.07), 0.8, 0.9, z - 0.04, z + 0.04);
      });
      // the corner steps under the end platform
      m.scope("steps", () => {
        for (const s of [-1, 1]) {
          const z = side(s, HALF - 0.55, HALF - 0.05);
          for (const y of [0.3, 0.68]) block(m, "ddBeam", ...along(SILL - 0.25, SILL - 0.03), y, y + 0.04, ...z);
          for (const zz of z) block(m, "ddBeam", ...along(SILL - 0.25, SILL - 0.03), 0.26, BEAM_BOTTOM + 0.01, zz - 0.02, zz + 0.02);
        }
      });
      // the walkway frames before the hood end: two tall loops with a cross bar, and the corner rails
      m.scope("end rails", () => {
        const x = e * (SILL - 0.12), top = DECK + 1.25;
        for (const s of [-1, 1]) {
          const [za, zb] = [s * 0.55, s * 1.3];
          m.rod(l.rails, [x, 0.55, za], [x, top, za], 0.022, 6);
          m.rod(l.rails, [x, 0.55, zb], [x, top, zb], 0.022, 6);
          m.rod(l.rails, [x, top, za], [x, top, zb], 0.022, 6, false);
          m.rod(l.rails, [x, DECK + 0.62, za], [x, DECK + 0.62, zb], 0.02, 6, false);
          m.rod(l.rails, [x, DECK + 0.2, zb], [x, top - 0.1, za], 0.018, 6, false);
          // the corner rail rising from the step to the hood corner
          const zc = s * (HALF - 0.04);
          m.rod(l.rails, [e * (SILL - 0.06), 0.4, zc], [e * (SILL - 0.06), DECK + 1.1, zc], 0.02, 6);
          m.rod(l.rails, [e * (SILL - 0.06), DECK + 1.1, zc], [e * (RAD.x1 + 0.05), DECK + 1.1, s * (RAD.half + 0.06)], 0.02, 6, false);
        }
        // the chain across the gap
        m.rod("black", [x, DECK + 0.95, -0.3], [x, DECK + 0.85, 0], 0.008, 4, false);
        m.rod("black", [x, DECK + 0.85, 0], [x, DECK + 0.95, 0.3], 0.008, 4, false);
      });
    });
}

function hood(m: MeshBuilder, l: Dd51Livery, e: number): void {
  const hs = hoodMain(e, l), rs = radiator(e, l);
  m.scope("hood", () => shell(m, hs));
  m.scope("radiator", () => shell(m, rs));
  const X = (d: number) => e * d;
  for (const s of [-1, 1]) {
    const sideAt = onSide(hs, s), n: Vec3 = [0, 0, s];
    const radAt = onSide(rs, s);
    m.scope(s > 0 ? "right side" : "left side", () => {
      // the radiator: mesh over its sides below and above the line, a grab handle on it
      m.scope("radiator mesh", () => {
        // two mesh panels side by side, below and above the line
        const mid = (RAD.x0 + RAD.x1) / 2;
        for (const [a, b] of [[RAD.x0 + 0.15, mid - 0.04], [mid + 0.04, RAD.x1 - 0.2]] as const) {
          decal(m, "ddMesh", radAt, n, X(a), X(b), DECK + 0.14, LINE[0] - 0.06);
          decal(m, "ddMesh", radAt, n, X(a), X(b), LINE[1] + 0.05, RAD.top - RAD.r - 0.02);
          for (let i = 0; i <= 4; i++) {
            const x = a + ((b - a) * i) / 4;
            decal(m, "black", radAt, n, X(x - 0.008), X(x + 0.008), DECK + 0.14, LINE[0] - 0.06, 0.007);
          }
        }
        grab(m, l.rails, X(RAD.x0 + 0.55), s, RAD.half, DECK + 0.3, DECK + 1.25);
      });
      // the side doors: seams with latches, and a louvre group over each door straddling the line
      m.scope("doors", () => {
        const x0 = BOX.x0 + 0.95, x1 = HOOD.x1 - 0.2, nd = 4, w = (x1 - x0) / nd;
        for (let i = 0; i <= nd; i++) {
          const x = x0 + i * w;
          decal(m, "ddSeam", sideAt, n, X(x - 0.01), X(x + 0.01), BOX.top + 0.06, HOOD.top - HOOD.r - 0.05);
          if (i < nd) {
            const xc = x + w / 2;
            decal(m, "black", sideAt, n, X(xc - 0.05), X(xc + 0.05), DECK + 1.0, DECK + 1.04);
            m.scope("louvre", () => {
              surfacePanel(m, "louvre", sideAt, n, rect(Math.min(X(xc - 0.16), X(xc + 0.16)), 2.35, Math.max(X(xc - 0.16), X(xc + 0.16)), 2.85), -0.01, 0.006);
              for (let k = 0; k < 6; k++) {
                const y = 2.39 + k * 0.075;
                decal(m, l.body === "ddBlue" ? "ddDark" : l.roof, sideAt, n, X(xc - 0.14), X(xc + 0.14), y, y + 0.025, 0.012);
              }
            });
          }
        }
        // the hood's seam to the radiator
        decal(m, "ddSeam", radAt, n, X(RAD.x0 + 0.03), X(RAD.x0 + 0.05), DECK + 0.1, RAD.top - RAD.r);
      });
      // the louvred intake at the cab end of the hood
      m.scope("intake", () => {
        surfacePanel(m, "louvre", sideAt, n, rect(Math.min(X(HOOD.x0 + 0.15), X(HOOD.x0 + 0.85)), 2.35, Math.max(X(HOOD.x0 + 0.15), X(HOOD.x0 + 0.85)), 2.83), -0.01, 0.008);
        for (let k = 0; k < 6; k++) decal(m, l.roof, sideAt, n, X(HOOD.x0 + 0.18), X(HOOD.x0 + 0.82), 2.38 + k * 0.075, 2.405 + k * 0.075, 0.014);
      });
      // the low box with its grilles beside the hood at the cab
      m.scope("grille box", () => {
        const [a, b] = [X(BOX.x0), X(BOX.x1)].sort((p, q) => p - q) as [number, number];
        block(m, l.body, a, b, DECK - 0.01, BOX.top, ...side(s, HOOD.half - 0.02, BOX.out));
        const np = 5, pw = (BOX.x1 - BOX.x0 - 0.2) / np;
        for (let i = 0; i < np; i++) {
          const x = BOX.x0 + 0.1 + i * pw;
          const zz = s * (BOX.out + 0.004);
          const [p, q] = [X(x + 0.04), X(x + pw - 0.04)].sort((u, v) => u - v) as [number, number];
          m.facets("louvre", [[p, DECK + 0.08, zz], [q, DECK + 0.08, zz], [q, BOX.top - 0.08, zz], [p, DECK + 0.08, zz], [q, BOX.top - 0.08, zz], [p, BOX.top - 0.08, zz]], [0, 0, s]);
        }
      });
    });
  }
  // the hood end: lamps in their housings at the top corners, the cut-out number between, the end doors
  m.scope("end", () => {
    const endAt = onEnd(rs, e), n: Vec3 = [e, 0, 0];
    const face = RAD.x1;
    const yl = RAD.top - 0.36;
    m.scope("headlights", () => {
      for (const z of [-0.72, 0.72]) {
        block(m, l.lampBox, ...(e > 0 ? [face - 0.05, face + 0.06] : [-face - 0.06, -face + 0.05]) as [number, number], yl - 0.17, yl + 0.17, z - 0.18, z + 0.18);
        m.sweep("rubber", "x", ngon(12, 0.15, 0, z, yl), e * (face + 0.06), ngon(12, 0.15, 0, z, yl), e * (face + 0.07));
        m.sweep("lampHead", "x", ngon(12, 0.12, 0, z, yl), e * (face + 0.07), ngon(12, 0.12, 0, z, yl), e * (face + 0.075));
      }
    });
    m.scope("number", () => endText(m, l.numberMat, l.number, e, face + 0.006, 0, RAD.top - 0.42, 0.13, 0.075, 0.03));
    if (l.headboard)
      m.scope("headboard", () => {
        const [disc, rim] = l.headboard!, y = DECK + 0.95;
        m.sweep(rim, "x", ngon(16, 0.33, 0, 0, y), e * (face + 0.04), ngon(16, 0.33, 0, 0, y), e * (face + 0.07));
        m.sweep(disc, "x", ngon(16, 0.29, 0, 0, y), e * (face + 0.07), ngon(16, 0.29, 0, 0, y), e * (face + 0.08));
        m.rod("steel", [e * (face + 0.02), y + 0.33, 0], [e * (face + 0.02), y + 0.45, 0], 0.02, 4);
      });
    m.scope("doors", () => {
      // the end hatch: two leaves, 0.9 m, off the centre line (toward +z at both ends)
      const zc = 0.3, y0 = DECK + 0.5, y1 = DECK + 1.58;
      for (const z of [zc - 0.45, zc, zc + 0.45]) decal(m, "ddSeam", endAt, n, z - 0.012, z + 0.012, y0, y1);
      for (const y of [y0, y1]) decal(m, "ddSeam", endAt, n, zc - 0.45, zc + 0.45, y - 0.012, y + 0.012);
      for (const z of [zc - 0.08, zc + 0.08]) decal(m, "black", endAt, n, z - 0.02, z + 0.02, y0 + 0.5, y0 + 0.64);
      // the small louvres under it
      for (const z of [zc - 0.33, zc + 0.33]) for (let k = 0; k < 4; k++) decal(m, "louvre", endAt, n, z - 0.08, z + 0.08, DECK + 0.1 + k * 0.08, DECK + 0.14 + k * 0.08);
    });
  });
  // the roof: the radiator fan, the engine's exhaust, a hatch
  m.scope("roof", () => {
    roofFan(m, e * (RAD.x0 + RAD.x1) / 2, 0, RAD.top, 0.45);
    exhaust(m, e * 4.6, 0, HOOD.top - 0.02, HOOD.top + 0.2, 0.3, 0.4);
    block(m, l.roof, e > 0 ? 2.6 : -3.6, e > 0 ? 3.6 : -2.6, HOOD.top - 0.02, HOOD.top + 0.04, -0.5, 0.5);
  });
}

function cab(m: MeshBuilder, l: Dd51Livery): void {
  const cs = cabShell(l);
  m.scope("shell", () => shell(m, cs));
  for (const e of [1, -1]) {
    const at = onEnd(cs, e), n: Vec3 = [e, 0, 0];
    m.scope(e > 0 ? "front" : "rear", () => {
      m.scope("windscreens", () => {
        for (const s of [-1, 1]) pane(m, at, n, s * SCREEN.z0, s * SCREEN.z1, SCREEN.y0, SCREEN.y1, 0.08);
      });
      m.scope("wipers", () => {
        for (const s of [-1, 1]) m.rod("black", [e * (CAB.half + 0.03), SCREEN.y1 - 0.05, s * 0.9], [e * (CAB.half + 0.03), SCREEN.y0 + 0.08, s * 0.65], 0.012, 4);
      });
      // the round column between the windscreens, from the hood roof up to the cab roof
      m.scope("column", () => {
        const r = 0.24, xc = e * (CAB.half + 0.06);
        const ring: Ring = [];
        for (let i = 0; i <= 8; i++) {
          const a = -Math.PI / 2 + (Math.PI * i) / 8;
          ring.push([xc + e * r * Math.cos(a), r * Math.sin(a) * (e > 0 ? 1 : -1)]);
        }
        ring.push([e * (CAB.half - 0.05), -r * (e > 0 ? -1 : 1)], [e * (CAB.half - 0.05), r * (e > 0 ? -1 : 1)]);
        const ccw = ring.reduce((acc, p, i) => { const q = ring[(i + 1) % ring.length]!; return acc + (p[0] * q[1] - q[0] * p[1]); }, 0) > 0;
        m.prism(l.column, ccw ? ring : [...ring].reverse(), HOOD.top - 0.05, CAB.top - 0.04);
      });
      // the sun visor over the windscreens
      m.scope("visor", () => block(m, l.roof, ...(e > 0 ? [CAB.half - 0.02, CAB.half + 0.12] : [-CAB.half - 0.12, -CAB.half + 0.02]) as [number, number], SCREEN.y1 + 0.06, SCREEN.y1 + 0.1, -1.38, 1.38));
    });
  }
  // the sides: point-symmetric, the door at one end and two windows at the other
  for (const s of [-1, 1]) {
    const at = onSide(cs, s), n: Vec3 = [0, 0, s];
    const d = s; // the door toward +X on the right side, toward -X on the left
    m.scope(s > 0 ? "right side" : "left side", () => {
      const dx1 = d * (CAB.half - 0.12), dx0 = d * (CAB.half - 0.78);
      m.scope("door", () => {
        const [a, b] = [Math.min(dx0, dx1), Math.max(dx0, dx1)];
        for (const [p, q] of [[a, a + 0.025], [b - 0.025, b]] as const) decal(m, "ddSeam", at, n, p, q, DECK + 0.08, 3.38);
        decal(m, "ddSeam", at, n, a, b, 3.36, 3.38);
        pane(m, at, n, a + 0.14, b - 0.14, 2.78, 3.28, 0.05);
        decal(m, "black", at, n, a + 0.06, a + 0.1, 2.0, 2.2);
        for (const x of [a - 0.1, b + 0.1]) grab(m, l.rails, x, s, CAB.w, DECK + 0.2, 3.1, 0.035);
      });
      m.scope("windows", () => {
        const w0 = -d * (CAB.half - 0.15);
        pane(m, at, n, w0, w0 + d * 0.78, 2.85, 3.45, 0.07);
        pane(m, at, n, w0 + d * 0.88, w0 + d * 1.58, 2.85, 3.45, 0.07);
        sideText(m, l.numberSide, l.number, s, CAB.w + 0.006, w0 + d * 0.8, 2.22, 0.2);
      });
      // the steps under the door
      m.scope("steps", () => {
        const [a, b] = [Math.min(dx0, dx1) + 0.05, Math.max(dx0, dx1) - 0.05];
        for (const y of [0.5, 0.84]) block(m, "ddBeam", a, b, y, y + 0.04, ...side(s, HALF - 0.3, HALF - 0.02));
        for (const x of [a, b]) block(m, "ddFrame", x - 0.02, x + 0.02, 0.46, FRAME_BOTTOM + 0.01, ...side(s, HALF - 0.3, HALF - 0.02));
      });
    });
  }
  // the roof: the horns, the signal flare tube, the antenna
  m.scope("roof", () => {
    horn(m, 1, 0.4, 0.35, CAB.top + 0.08);
    horn(m, -1, -0.4, -0.35, CAB.top + 0.08);
    m.prism("ddSilver", ngon(8, 0.04, 0, 0.9, -0.5), CAB.top - 0.12, CAB.top + 0.15);
    m.prism("black", ngon(6, 0.02, 0, -0.9, 0.55), CAB.top - 0.15, CAB.top + 0.25);
  });
}

function underframe(m: MeshBuilder): void {
  for (const e of [1, -1])
    m.scope(e > 0 ? "tank 1" : "tank 2", () => {
      const [a, b] = e > 0 ? [TANK.x0, TANK.x1] : [-TANK.x1, -TANK.x0];
      const sec: Ring = [[-1.2, FRAME_BOTTOM], [1.2, FRAME_BOTTOM], [1.2, TANK.y0 + 0.15], [1.05, TANK.y0], [-1.05, TANK.y0], [-1.2, TANK.y0 + 0.15]];
      m.sweep("ddFrame", "x", sec, a, sec, b);
      for (const s of [-1, 1]) block(m, "steel", (a + b) / 2 - 0.15, (a + b) / 2 + 0.15, 0.62, 0.78, ...side(s, 1.2, 1.24));
    });
}

// ---------------------------------------------------------------------------
// The distant model

export function dd51Lod(l: Dd51Livery, budget = 100): MeshBuilder {
  const shells: LodShell[] = [];
  for (const e of [1, -1]) {
    shells.push(czShellLod(hoodMain(e, l), { ends: [], side: lodBands(l.hood, DECK, HOOD.top), end: lodBands(l.hood, DECK, HOOD.top) }));
    shells.push(czShellLod(radiator(e, l), { ends: [e], side: lodBands(l.hood, DECK, RAD.top), end: lodBands(l.hood, DECK, RAD.top) }));
  }
  shells.push(czShellLod(cabShell(l), { side: lodBands(l.cab, DECK, CAB.top), end: lodBands(l.cab, DECK, CAB.top),
    endWindows: screen(SCREEN.z0, SCREEN.z1, SCREEN.y0, SCREEN.y1),
    sideWindows: sideWindows([{ u: [-CAB.half + 0.15, -CAB.half + 1.73], y: [2.85, 3.45] }], 0.3, true),
  }));
  const boxes: LocoBox[] = [
    { name: "frame", mat: "ddFrame", x: [-SILL, SILL], y: [FRAME_BOTTOM, DECK], w: HALF },
    ...[-1, 1].map((e): LocoBox => ({ name: "end beam", mat: l.beam, x: e > 0 ? [SILL - 0.28, SILL] : [-SILL, -SILL + 0.28], y: [BEAM_BOTTOM, FRAME_BOTTOM], w: HALF - 0.01, top: false, optional: 40 })),
    ...[-1, 1].map((e): LocoBox => ({ name: "column", mat: l.column, x: e > 0 ? [CAB.half - 0.05, CAB.half + 0.3] : [-CAB.half - 0.3, -CAB.half + 0.05], y: [HOOD.top, CAB.top - 0.04], w: 0.24, optional: 30 })),
    ...[-1, 1].map((e): LocoBox => ({ name: "fuel tank", mat: "ddFrame", x: e > 0 ? [TANK.x0, TANK.x1] : [-TANK.x1, -TANK.x0], y: [TANK.y0, FRAME_BOTTOM], w: 1.2, top: false, optional: 20 })),
  ];
  return locoLod({
    palette: { ...PALETTE, ...l.palette },
    shells,
    boxes,
    gear: [{ xc: TRUCK_X, half: DT113.frameHalf, top: DT113.frameTop }, { xc: 0, half: TR106.frameHalf, top: TR106.frameTop }, { xc: -TRUCK_X, half: DT113.frameHalf, top: DT113.frameTop }],
  }, budget);
}
