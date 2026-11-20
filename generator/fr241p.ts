// The SNCF 241 P (2'D1' h4v, a four-cylinder de Glehn compound Mountain), the 35
// express engines Schneider built at Le Creusot in 1948-52 from the PLM 241 C 1,
// as the preserved 241 P 17 runs today (owned by the town of Le Creusot): dark
// green with red lining, black smokebox, deflectors and front, red buffer beam
// lettered "241.P.17", with its 34 P tender on two bogies, drawn on the steam kit
// (steamLoco.ts). Matched to the photographs in assets/sncf-241p/SOURCES.md
// (Schneider's works photograph of the class, 241 P 17 at Paris-Est and at Dole,
// 241 P 16 in the Cite du Train at Mulhouse, 241 P 30 stripped at the AJECTA in
// 2023, 241 P 5 at Nantes in 1969) and the published figures (engine 17.17 m over
// buffers, engine and tender 27.12 m, width 2.97 m, height 4.28 m, coupled
// wheelbase 6.30 m, total engine wheelbase 13.46 m, engine and tender wheelbase
// 23.50 m, wheels 1,020 / 2,020 / 1,350 mm, smokebox 3 m long, LP cylinders 674 x
// 700 mm outside, HP 446 x 650 mm inside, 131.4 t engine, 84.8 t tender 34 P,
// 4,000 hp indicated (2,940 kW), 120 km/h in service).
//
// What makes it a 241 P and not a generic Mountain: the tall black smoke
// deflectors standing on the full width of the engine with their upper third
// folded in toward the chimney, the stepped valance under them (the running board
// drops from 2.15 m to a ledge at 1.75 m under the smokebox and then down the steep
// front apron to the beam), the round headlamps on that apron, the heavy studded
// smokebox front ring with the SNCF roundel on the door, the double chimney's
// oblong casing over the smokebox's front half, the ACFI feed-water heater drum
// lying on the boiler behind it, the long dome casing, the big outside LP
// cylinders set over the bogie's rear axle with their piston valve chests on top
// and the rods driving the second coupled axle, the cab whose front sweeps down in
// a curve onto the firebox, and the flat-sided 34 P tender with its raised coal
// space at the front and its cast Y-frame bogies.
//
// Scales: every photograph is a perspective view, measured along the wheels by a
// 1-D projective fit of the four coupled axles (2.10 m pitch, the 6.30 m fixed
// wheelbase) and the front buffer heads: the works photograph about 90 px/m at
// the bogie down to 41 px/m at the fourth driver, the AJECTA view 104 px/m
// (vertical, on the bogie wheel) to 52 px/m. The two fits put the front bogie
// axle 2.8 and 3.2 m behind the buffer heads; the published wheelbases (13.46 m
// engine, 23.50 m engine and tender, a 9.95 m tender) put it at 2.3 m; 2.5 m is
// used. Positions along the engine (deflectors 2.2 - 4.72 m, chimney 3.0 m, feed
// water heater 4.2 - 6.0 m, dome casing 6.8 - 9.4 m, cab 14.35 m) are the mean of
// both fits measured from the first driver, the parts on the centre line moved
// 0.2 m rearward for parallax.
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import { mirrored, type Pt, type Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { block } from "./vehicleParts.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** 241 P 17's dark green, the black of its front end and frames, the red lining and beam. */
const GREEN = "#203d33";
const BLACK = "#18191b";
const RED = "#b9232b";

const PALETTE: Record<string, MaterialSpec> = {
  paint: mat(GREEN, 0.4),
  wheel: mat(BLACK, 0.6),
  frame: mat(BLACK, 0.7),
  black: mat("#161719", 0.65),
  lining: mat(RED, 0.5),
  beam: mat("#c4252c", 0.5),
  beamText: mat("#efece4", 0.5),
  smokebox: mat("#141517", 0.55),
  roof: mat("#1f2022", 0.8),
  // the tyres dark worn steel, as on 241 P 17: the wheels read black, only the rods bright
  tyre: { color: "#55595e", metallic: 0.4, roughness: 0.45 },
  rod: { color: "#b9bec3", metallic: 0.45, roughness: 0.3 },
  steel: { color: "#8c9197", metallic: 0.45, roughness: 0.4 },
  chrome: { color: "#c9ced2", metallic: 0.7, roughness: 0.2 },
  brass: { color: "#c49a48", metallic: 0.6, roughness: 0.3 },
  plate: mat(RED, 0.45),
  plateText: { color: "#d6d8d4", metallic: 0.5, roughness: 0.35 },
  roundel: mat("#c92a2f", 0.45),
  white: mat("#ece9e1", 0.55),
  crestBlue: mat("#2f5aa8", 0.5),
  crestGold: mat("#d9b23c", 0.45),
};

export const SNCF241P_NUMBER = "241 P 17";

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title and the measures the table lists. */
export const SNCF241P_WORLD: { base: WorldSteam } = {
  base: { top: 4.65, coupler: "buffers", half: 1.5, title: "SNCF 241 P", lead: 2, coupled: 4, trail: 1, leadD: 1.02, coupledD: 2.02, trailD: 1.35, boilerR: 1.0, deflectors: "wagner", domes: 1, palette: { paint: GREEN, wheel: BLACK, frame: BLACK, smokebox: "#141517" }, tender: { length: 9.95, axles: 4, d: 1.0 }, number: SNCF241P_NUMBER },
};

// --- the engine: 17.17 m; axles 2.5 + 2.1 + 1.65 + 3 x 2.1 + 3.41 (13.46 m) ---

const LEAD = [2.5, 4.6];
const COUPLED = [6.25, 8.35, 10.45, 12.55];
const TRAIL = 15.96;
/** The engine's rear head; the tender's front head meets it. */
const END = 17.17;
/** Boiler centre and barrel radius (4.09 m over the smokebox, under the 4.27 m chimney: the photographs show air between the barrel and the board); the running board's top. */
const BY = 3.15;
const BR = 0.9;
const RB = 2.15;
/** The ledge under the smokebox front, and where the board steps up from it to RB. */
const LEDGE = 1.75;
const STEP = [2.55, 2.95] as const;
/** The 3 m smokebox from its front ring at 2.0 m; the firebox from 11.7 m; the cab. */
const SMOKEBOX = [2.0, 5.0] as const;
const FIREBOX = 11.7;
const CAB0 = 14.35;
const CAB1 = 16.95;
/** The cab's front curves down onto the firebox over its first HOOD metres. */
const HOOD = 0.6;
/** The running board's half width (2.97 m over the deflectors and valances). */
const HALF = 1.44;
/** The running board: beam top, the steep apron, the ledge under the smokebox, the step up behind the deflectors' foot. */
const BOARD: Pt[] = [[0.62, 1.32], [0.85, 1.32], [1.25, LEDGE], [STEP[0], LEDGE], [STEP[1], RB], [CAB1 - 0.02, RB]];

/** The cab's right half section: its sheets 0.15 m below the running board, a round roof. */
const CAB_HALF: Pt[] = [[1.45, RB - 0.15], [1.45, 3.85], [1.33, 4.08], [0.88, 4.2], [0, 4.23]];
/** The cab's top at x over its curved front (the full section from CAB0 + HOOD). */
const hoodTop = (x: number): number => {
  const u = Math.min(1, Math.max(0, (CAB0 + HOOD - x) / HOOD));
  return 3.5 + 0.73 * Math.sqrt(1 - u * u);
};

/**
 * The smoke deflectors: front and rear edge, the foot following the board's step,
 * the fold at y FOLD where the plate turns in, its top; the plane |z| below the fold
 * and at the top.
 */
const DEF = { x0: 2.2, x1: 4.72, fold: 3.4, top: 4.05, z0: 1.425, z1: 1.12, r: 0.18 };

/** A rounded corner's points from angle a0 over a quarter turn, radius r about (cx, cy). */
function arc(cx: number, cy: number, r: number, a0: number, seg = 3): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= seg; i++) {
    const a = a0 + (i / seg) * (Math.PI / 2);
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}

/** A flat panel through the (x, y) outline on side s at |z| = z, `d` thick inward. */
function sidePlate(t: Steam, matName: string, s: number, outline: Pt[], z: number, d = 0.02): void {
  t.m.slab(matName, outline.map(([x, y]): Vec3 => [t.X(x), y, s * z]), [0, 0, -s * d]);
}

/** A thin lining strip along the polyline `pts` (x, y), `w` tall, on side s just proud of |z| = z. */
function liningAlong(t: Steam, s: number, pts: Pt[], w: number, z: number): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [xa, ya] = pts[i]!;
    const [xb, yb] = pts[i + 1]!;
    if (Math.hypot(xb - xa, yb - ya) < 1e-6) continue;
    // the strip's half width measured square to the segment
    const L = Math.hypot(xb - xa, yb - ya);
    const [nx, ny] = [(-(yb - ya) / L) * (w / 2), ((xb - xa) / L) * (w / 2)];
    sidePlate(t, "lining", s, [[xa - nx, ya - ny], [xb - nx, yb - ny], [xb + nx, yb + ny], [xa + nx, ya + ny]], z + 0.004, 0.008);
  }
}

function deflectors(t: Steam): void {
  const m = t.m;
  const { x0, x1, fold, top, z0, z1, r } = DEF;
  // the lower plate (vertical) in two convex pieces, its foot on the board's step
  const lowA: Pt[] = [[x0, LEDGE], [STEP[0], LEDGE], [STEP[1], RB], [STEP[1], fold], [x0, fold]];
  const lowB: Pt[] = [[STEP[1], RB], [x1, RB], [x1, fold], [STEP[1], fold]];
  // the upper plate leaning in, its front top corner rounded
  const up: Pt[] = [[x0, fold], [x1, fold], [x1, top], ...arc(x0 + r, top - r, r, Math.PI / 2)];
  const zAt = (y: number): number => (y <= fold ? z0 : z0 + ((y - fold) / (top - fold)) * (z1 - z0));
  m.scope("smoke deflectors", () => {
    for (const s of [-1, 1]) {
      sidePlate(t, "black", s, lowA, z0 + 0.025, 0.025);
      sidePlate(t, "black", s, lowB, z0 + 0.025, 0.025);
      // the folded top: the plate's outward normal tilts up as it leans in
      const [dz, dy] = [z1 - z0, top - fold];
      const L = Math.hypot(dz, dy);
      const [ny, nz] = [-dz / L, dy / L];
      const at = ([x, y]: Pt, off: number): Vec3 => [t.X(x), y + ny * off, s * (zAt(y) + nz * off)];
      m.slab("black", up.map((p) => at(p, 0.025)), [0, -ny * 0.025, -s * nz * 0.025]);
      // red lining round the lower panel, 6 cm in from its edges (241 P 16 and 17)
      const i = 0.07;
      liningAlong(t, s, [[x0 + i, fold - i], [x0 + i, LEDGE + i], [STEP[0] - 0.03, LEDGE + i], [STEP[1] - 0.03, RB + i], [x1 - i, RB + i], [x1 - i, fold - i], [x0 + i, fold - i]], 0.025, z0 + 0.025);
      // two stays from the plate's inside to the smokebox
      for (const x of [2.7, 4.3]) m.rod("black", [t.X(x), 3.75, s * (zAt(3.75) - 0.01)], [t.X(x), BY + 0.4, s * (BR * 0.9)], 0.022, 6);
    }
  });
}

/** The red lining along the running board's valance: its top and bottom edges. */
function valanceLining(t: Steam): void {
  t.m.scope("valance lining", () => {
    for (const s of [-1, 1]) {
      const pts = BOARD.slice(1);
      liningAlong(t, s, pts.map(([x, y]): Pt => [x, y - 0.06]), 0.025, HALF - 0.005);
      liningAlong(t, s, pts.map(([x, y]): Pt => [x, y - 0.165]), 0.025, HALF - 0.005);
    }
  });
}

function front(t: Steam): void {
  const m = t.m;
  const X0 = t.X(SMOKEBOX[0]);
  const R = BR + 0.04;
  m.scope("smokebox front", () => {
    // the heavy front ring round the door, 30 studs on its face
    m.tube("smokebox", "x", 0, BY, R + 0.03, R * 0.8, X0 - 0.01, X0 + 0.09, 24, Math.PI / 24);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const [z, y] = [Math.cos(a) * R * 0.92, BY + Math.sin(a) * R * 0.92];
      block(m, "smokebox", X0 + 0.09, X0 + 0.115, y - 0.025, y + 0.025, z - 0.025, z + 0.025);
    }
    // the dished door standing out of the ring
    const rings = [[0, 0.8], [0.05, 0.74], [0.1, 0.6], [0.13, 0.4], [0.145, 0.18]] as const;
    const N = 18;
    for (let i = 0; i + 1 < rings.length; i++) {
      const [da, ra] = rings[i]!;
      const [db, rb] = rings[i + 1]!;
      m.sweep("smokebox", "x", ngon(N, R * ra, Math.PI / N, 0, BY), X0 + 0.07 + da, ngon(N, R * rb, Math.PI / N, 0, BY), X0 + 0.07 + db, i === rings.length - 2);
    }
    // the two dart handles from the centre boss toward the hinges' side (seen on every 241 P)
    const c: Vec3 = [X0 + 0.23, BY, 0];
    m.tube("steel", "x", 0, BY, 0.07, 0.03, X0 + 0.2, X0 + 0.25, 10);
    for (const dy of [0.42, -0.42]) m.rod("steel", c, [X0 + 0.16, BY + dy, -0.62], 0.018, 6);
    // the SNCF roundel high on the door's left (seen from ahead)
    const [rz, ry] = [0.44, BY + 0.36];
    m.sweep("white", "x", ngon(16, 0.16, 0, rz, ry), X0 + 0.13, ngon(16, 0.16, 0, rz, ry), X0 + 0.2);
    m.sweep("roundel", "x", ngon(16, 0.13, 0, rz, ry), X0 + 0.2, ngon(16, 0.13, 0, rz, ry), X0 + 0.205);
    const h = 0.11;
    const w = h * 0.5;
    const tw = strokeWidth("SN", w, h * 0.12);
    m.facets("white", strokeText("SN", rz + tw / 2, ry - h / 2, h, w, h * 0.12, true).map(([u, v]): Vec3 => [X0 + 0.209, v, u]), [1, 0, 0]);
  });
  m.scope("feed pump", () => {
    // the ACFI feed pump standing on the ledge beside the smokebox front, left seen from ahead
    t.cylY("black", 1.75, 1.08, LEDGE, 2.75, 0.15, 10);
    t.cylY("black", 1.75, 1.08, 2.75, 2.9, 0.19, 10);
  });
  m.scope("headlamps", () => {
    // the round electric headlamps on the apron, above the buffers
    for (const z of [-0.98, 0.98]) {
      const [x, y] = [0.95, 1.62];
      t.cylX("black", x, x + 0.24, z, y, 0.13, 12);
      m.tube("chrome", "x", z, y, 0.145, 0.105, t.X(x) - 0.002, t.X(x) + 0.04, 12);
      const lens = ngon(12, 0.11, 0, z, y);
      m.sweep("lampHead", "x", lens, t.X(x) - 0.004, lens, t.X(x) + 0.02);
    }
  });
  m.scope("crest", () => {
    // 241 P 17's Le Creusot crest on the apron: a blue shield under a gold band, on the slope
    const [xa, ya, xb, yb] = [0.85, 1.32, 1.25, LEDGE];
    const L = Math.hypot(xb - xa, yb - ya);
    const along = (k: number): Pt => [xa + ((xb - xa) * k) / L, ya + ((yb - ya) * k) / L];
    // the slope's outward normal (model X forward, y up)
    const [nX, nY] = [(yb - ya) / L, (xb - xa) / L];
    const P = (k: number, z: number, off: number): Vec3 => { const [x, y] = along(k); return [t.X(x) + nX * off, y + nY * off, z]; };
    const shield = (k0: number, k1: number, hw: number): Vec3[] => [P(k0 + 0.08, -hw * 0.55, 0.006), P(k0, 0, 0.006), P(k0 + 0.08, hw * 0.55, 0.006), P(k1, hw, 0.006), P(k1, -hw, 0.006)];
    m.slab("crestBlue", shield(0.06, 0.44, 0.19), [-nX * 0.004, -nY * 0.004, 0]);
    m.slab("crestGold", [P(0.44, -0.19, 0.006), P(0.44, 0.19, 0.006), P(0.55, 0.19, 0.006), P(0.55, -0.19, 0.006)], [-nX * 0.004, -nY * 0.004, 0]);
  });
  m.scope("buffer heads", () => {
    // 241 P 17's broad oval buffer heads over the kit's round ones
    for (const z of [-0.875, 0.875]) {
      const oval: Array<[number, number]> = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        oval.push([z + Math.cos(a) * 0.25, 1.06 + Math.sin(a) * 0.18]);
      }
      m.sweep("steel", "x", oval, t.X(0.04), oval, t.X(-0.012));
    }
  });
  m.scope("beam lettering", () => {
    // "241.P.17" in white across the beam's middle, the SNCF roundel at its right end (seen from ahead)
    const X = t.X(0.62) + 0.008;
    const h = 0.17;
    const w = h * 0.5;
    const gap = h * 0.16;
    // "241.P" left of the coupling hook, "17" right of it (Paris-Est and Dole photos)
    for (const [text, zc] of [["241.P", 0.4], ["17", -0.36]] as const) {
      const width = strokeWidth(text, w, gap);
      m.facets("beamText", strokeText(text, zc + width / 2, 0.97, h, w, gap, true).map(([u, v]): Vec3 => [X, v, u]), [1, 0, 0]);
    }
    m.sweep("white", "x", ngon(14, 0.12, 0, -1.25, 1.05), X - 0.008, ngon(14, 0.12, 0, -1.25, 1.05), X + 0.002);
    m.sweep("roundel", "x", ngon(14, 0.095, 0, -1.25, 1.05), X + 0.002, ngon(14, 0.095, 0, -1.25, 1.05), X + 0.006);
  });
}

function engineExtras(t: Steam): void {
  const m = t.m;
  deflectors(t);
  valanceLining(t);
  front(t);
  m.scope("chimney casing", () => {
    // the double chimney's oblong casing over the smokebox's front half, its rim
    t.dome(3.0, BY + BR * 0.8, 4.2, 0.33, 1.0, "smokebox");
    t.dome(3.0, 4.14, 4.25, 0.36, 1.06, "smokebox");
  });
  m.scope("feed-water heater", () => {
    // the ACFI drum lying on the boiler behind the chimney, on two cradles, its pipe down the right side
    t.cylX("black", 4.2, 6.0, 0, BY + BR + 0.05, 0.17, 14);
    for (const x of [4.5, 5.7]) t.box("black", x - 0.06, x + 0.06, BY + BR - 0.08, BY + BR + 0.02, -0.18, 0.18);
    m.rod("black", [t.X(5.9), BY + BR + 0.1, -0.2], [t.X(6.4), BY + 0.4, -(BR + 0.05)], 0.05, 8);
  });
  m.scope("steam pipes", () => {
    // the big pipes from the smokebox down behind the deflectors to the LP valve chests
    for (const s of [-1, 1]) {
      m.rod("black", [t.X(4.3), BY + 0.1, s * (BR + 0.02)], [t.X(4.1), RB + 0.02, s * 1.2], 0.09, 8);
      m.rod("black", [t.X(4.8), BY + 0.3, s * (BR - 0.05)], [t.X(4.55), RB + 0.02, s * 1.05], 0.07, 8);
    }
  });
  m.scope("boiler pipes", () => {
    // the pipes along the boiler's sides, the lubricators on the board
    for (const s of [-1, 1]) {
      for (const [dy, r] of [[0.5, 0.035], [0.68, 0.025]] as const) {
        const z = s * Math.sqrt(Math.max(0, (BR + 0.06) ** 2 - dy * dy));
        t.cylX("black", SMOKEBOX[1], FIREBOX + 1.2, z, BY + dy, r, 6);
      }
      for (const x of [7.1, 7.6]) t.sideBox("black", s, x - 0.2, x + 0.2, RB, RB + 0.38, 1.05, 1.32);
    }
  });
  m.scope("cab", () => {
    // the cab's curved front over the firebox: the full section clipped by the hood line
    t.volume({
      sec: mirrored(CAB_HALF),
      plan: [[CAB0, 1.45], [CAB0 + HOOD, 1.45]],
      top: [0, 0.25, 0.5, 0.7, 0.85, 1].map((k): Pt => [CAB0 + HOOD * k, hoodTop(CAB0 + HOOD * k)]),
      bands: [[RB - 0.15, 4.25, "paint"]],
    });
    for (const s of [-1, 1]) {
      // the front side window, its front edge raked along the hood
      sidePlate(t, "glass", s, [[CAB0 + 0.16, 3.02], [CAB0 + 1.0, 3.02], [CAB0 + 1.0, 3.74], [CAB0 + 0.42, 3.74]], 1.456, 0.02);
      // red lining round the cab side's lower panel
      liningAlong(t, s, [[CAB0 + 0.08, RB - 0.05], [CAB0 + 0.08, 2.9], [CAB1 - 0.1, 2.9], [CAB1 - 0.1, RB - 0.05]], 0.025, 1.45);
    }
  });
  m.scope("trailing truck", () => {
    // the Delta truck's outside frame round the trailing axle
    for (const s of [-1, 1]) t.sideBox("black", s, TRAIL - 0.8, TRAIL + 0.55, 0.55, 0.85, 1.0, 1.08);
  });
}

function engine(): LocoSpec {
  return {
    title: "SNCF 241 P",
    palette: PALETTE,
    heads: [0, END],
    beams: { y0: 0.78, y1: 1.3, length: [0.62, 0.3], half: 1.45 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], n: 24 },
    chimney: { x: 3.0, top: 4.27, r: 0.22 },
    // the long dome casing over the sandbox and regulator
    domes: [{ x: 8.1, top: 4.25, r: 0.48, len: 2.6 }],
    valves: { x: 12.3, top: 4.2 },
    handrail: { x0: 5.2, x1: 14.1, y: BY + 0.2 },
    runningBoard: { profile: BOARD, half: HALF, valance: 0.15, mat: "black", valanceMat: "paint" },
    frame: { x0: 2.15, x1: CAB1, top: RB - 0.1 },
    cab: {
      x0: CAB0 + HOOD, x1: CAB1, half: CAB_HALF, roofY: 3.85,
      // the rear side window (the front one is on the curved front, drawn in extras)
      windows: [{ x0: 15.6, x1: 16.55, y0: 3.02, y1: 3.74 }],
    },
    // the round-topped firebox behind the barrel, down to the running board
    prisms: [{ name: "firebox", x0: FIREBOX, x1: CAB0, half: [[BR + 0.04, RB], [BR + 0.04, BY + 0.25], [BR * 0.86, BY + BR * 0.6], [BR * 0.5, BY + BR * 0.9], [0, BY + BR + 0.03]] }],
    bogies: [
      { x0: LEAD[0]! - 0.6, x1: LEAD[1]! + 0.55, y: 0.55 },
    ],
    gear: {
      wheels: [
        ...LEAD.map((x) => ({ x, d: 1.02, spokes: 11 })),
        ...COUPLED.map((x) => ({ x, d: 2.02, spokes: 18 })),
        { x: TRAIL, d: 1.35, spokes: 14, outsideBoxes: true },
      ],
      // the two outside LP cylinders over the bogie's rear axle, 674 x 700 mm, driving the second coupled axle
      engines: [{ coupled: [2, 3, 4, 5], main: 3, cylinder: { x0: 3.25, x1: 4.45, y: 1.35, r: 0.4 }, crank: 0.35, phase: 0.3, valveGear: true }],
      cylinderZ: 1.03, reference: 3, wheelMaterial: "wheel", cylinderMat: "black", cylinderCoverMat: "black",
      cylinderDressing: (mm, s, c) => {
        // the piston valve chest on top, and the cladding box over the cylinder's rear half
        mm.sweep("black", "x", ngon(14, 0.24, Math.PI / 14, c.z, c.y + 0.5), c.x0 + 0.05, ngon(14, 0.24, Math.PI / 14, c.z, c.y + 0.5), c.x1 - 0.05);
        const [a, b] = [Math.abs(c.z) - 0.3, Math.abs(c.z) + c.r + 0.02];
        block(mm, "black", c.x0 - 0.04, c.x0 + 0.55, c.y - c.r - 0.04, RB - 0.06, Math.min(s * a, s * b), Math.max(s * a, s * b));
      },
    },
    lamps: { front: [], rear: [[CAB1 - 0.05, RB, 0.7], [CAB1 - 0.05, RB, -0.7]] },
    number: { text: SNCF241P_NUMBER, side: [16.05, 2.55, CAB_HALF[0]![0]] },
    extras: engineExtras,
  };
}

// --- the 34 P tender: 9.95 m, two bogies, axles 1.12 / 3.02 / 6.93 / 8.83 m (23.50 m from the engine's first axle) ---

const T_AXLES = [1.12, 3.02, 6.93, 8.83];
const T_END = 9.95;
const TANK = [0.4, 9.55] as const;
const TANK_FOOT = 1.5;
const TANK_TOP = 3.35;
const T_HALF = 1.45;
/** The raised coal space over the front, its sides leaning in. */
const BUNKER = [0.4, 6.1] as const;
const BUNKER_TOP = 3.95;

function tenderExtras(t: Steam): void {
  const m = t.m;
  m.scope("tank lining", () => {
    for (const s of [-1, 1]) {
      // red lining along the tank's foot and round its side panel
      liningAlong(t, s, [[TANK[0] + 0.05, TANK_FOOT + 0.06], [TANK[1] - 0.05, TANK_FOOT + 0.06]], 0.03, T_HALF);
      liningAlong(t, s, [[TANK[0] + 0.2, TANK_FOOT + 0.22], [TANK[1] - 0.2, TANK_FOOT + 0.22], [TANK[1] - 0.2, TANK_TOP - 0.2], [TANK[0] + 0.2, TANK_TOP - 0.2], [TANK[0] + 0.2, TANK_FOOT + 0.22]], 0.022, T_HALF);
      // the frame under the tank
      t.sideBox("black", s, 0.38, 9.57, 1.0, TANK_FOOT, T_HALF - 0.2, T_HALF - 0.08);
      // the red plate near the front, ladder rungs at the rear corner
      t.sideBox("plate", s, 1.0, 1.4, 2.65, 2.88, T_HALF - 0.004, T_HALF + 0.014);
      t.sideBox("steel", s, 9.3, 9.34, TANK_FOOT, 3.2, T_HALF, T_HALF + 0.05);
    }
  });
  m.scope("tank top", () => {
    // the water filler on the rear deck and the toolboxes on the bunker's front
    t.cylY("black", 8.2, 0, TANK_TOP, TANK_TOP + 0.2, 0.28, 12);
    t.box("black", BUNKER[0] + 0.05, BUNKER[0] + 0.6, BUNKER_TOP - 0.05, BUNKER_TOP + 0.12, -1.1, 1.1);
  });
}

/** The 34 P's cast bogie frames: the Y-shaped side frames and the axleboxes, on each truck. */
function tenderTruck(t: Steam, f: { x0: number; x1: number; y: number }): void {
  const xm = (f.x0 + f.x1) / 2;
  for (const s of [-1, 1]) {
    const z = s * 1.0;
    t.m.rod("black", [t.X(f.x0 + 0.25), 0.55, z], [t.X(xm), 0.85, z], 0.05, 6);
    t.m.rod("black", [t.X(f.x1 - 0.25), 0.55, z], [t.X(xm), 0.85, z], 0.05, 6);
    for (const x of [f.x0 + 0.6, f.x1 - 0.6]) t.sideBox("steel", s, x - 0.14, x + 0.14, 0.32, 0.68, 0.98, 1.1);
  }
}

function tender(): LocoSpec {
  return {
    title: "SNCF 241 P tender",
    palette: PALETTE,
    heads: [0, T_END],
    beams: { y0: 0.78, y1: 1.3, length: [0.3, 0.62], half: 1.44 },
    frame: { x0: 0.35, x1: 9.6, top: TANK_FOOT - 0.08 },
    volumes: [{
      name: "tank",
      sec: mirrored([[T_HALF, TANK_FOOT], [T_HALF, TANK_TOP - 0.1], [T_HALF - 0.1, TANK_TOP], [0, TANK_TOP + 0.02]]),
      plan: [[TANK[0], T_HALF], [TANK[1], T_HALF]],
      bands: [[TANK_FOOT, TANK_TOP - 0.04, "paint"], [TANK_TOP - 0.04, TANK_TOP + 0.02, "roof"]],
    }],
    // the coal space's raised sides leaning in, standing on the tank top
    prisms: [{ name: "coal space", x0: BUNKER[0] + 0.02, x1: BUNKER[1], half: [[T_HALF - 0.08, TANK_TOP], [T_HALF - 0.2, BUNKER_TOP]] }],
    coal: { x0: BUNKER[0] + 0.6, x1: BUNKER[1] - 0.1, y: BUNKER_TOP - 0.05, half: T_HALF - 0.3, rise: 0.25 },
    bogies: [{ x0: T_AXLES[0]! - 0.6, x1: T_AXLES[1]! + 0.6, y: 0.6 }, { x0: T_AXLES[2]! - 0.6, x1: T_AXLES[3]! + 0.6, y: 0.6 }],
    drawOnTruckFrame: tenderTruck,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.0, spokes: 0, outsideBoxes: true })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[9.45, 1.3, 0.85], [9.45, 1.3, -0.85]] },
    extras: tenderExtras,
  };
}

/** The 241 P's engine or tender spec, by the `unit` parameter's value. */
export function sncf241pSpec(unit: string): LocoSpec {
  return unit === "tender" ? tender() : engine();
}

/**
 * The distant model's spec: the deflectors as the kit's flat plates (the LOD adapter draws spec
 * deflectors, not extras) in black, no firebox prism (the barrel reaches the cab), like ns3700LodSpec.
 */
export function sncf241pLodSpec(unit: string): LocoSpec {
  const s = sncf241pSpec(unit);
  if (unit === "tender") return s;
  // the adapter draws deflectors and cylinders in "paint": black here, the green named apart for the boiler, domes, cab and valance
  const green = "green";
  return {
    ...s,
    palette: { ...s.palette, paint: s.palette.black!, [green]: s.palette.paint! },
    boiler: { ...s.boiler!, paint: green } as LocoSpec["boiler"],
    domes: s.domes!.map((d) => ({ ...d, mat: green })),
    cab: { ...s.cab!, mat: green },
    runningBoard: { ...s.runningBoard!, valanceMat: green },
    prisms: [],
    deflectors: { outlines: [[[DEF.x0, LEDGE], [DEF.x1, RB], [DEF.x1, DEF.top], [DEF.x0 + 0.15, DEF.top], [DEF.x0, DEF.top - 0.15]]], z: DEF.z0 } };
}
