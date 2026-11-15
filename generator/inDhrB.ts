// The Darjeeling Himalayan Railway B class (0-4-0ST, Sharp Stewart 1889 -,
// North British, Baldwin and Tindharia; 34 built), drawn on the steam kit
// (steamLoco.ts) from photographs of 785, 787, 788 'Tusker', 792 'Hawkeye',
// 795 and 19B (assets/dhr-b-class/SOURCES.md): a saddle tank engine without a
// tender -- the short smokebox with the tall chimney and the big headlamp on
// its bracket ahead of it, the saddle tank over the barrel with its filler, the
// tall dome behind the tank, the coal bunker round the firebox ahead of the
// cab (its side sheets cut away over the motion), the cab front's spectacle
// plate, the open cab under a long roof on two rear pillars with the rear
// headlamp on it, outside cylinders with Walschaerts valve gear driving the
// rear axle, the sanding platform over the front buffer beam with its sand box
// and rails, and the central buffer-couplers. Caledonian blue (NF Railway,
// since 1958) with white lines, red frames and beams, a brass-figured number
// plate on the cab side, "N F" on the bunker. See docs/models/india-trains.md.
//
// Every length is in metres along the locomotive from its front coupler head,
// y up from the rail top. The 610 mm gauge engine rides the game's standard
// wheelsets: its body is drawn at its real size, the frames, wheels and motion
// at the kit's standard-gauge planes (the motion stands just outside the body).

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Pt, Steam } from "./steamParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { boxShell, octagon, steamLodSpec } from "./lodSteam.ts";
import { fitLod, lodShell } from "./lodKit.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** The coupler heads (5.75 m over the central buffers); the buffer beams' outer faces. */
const END = 5.75;
const BEAM = [0.1, 5.65] as const;
/** Coupled axles: 26 in drivers, 5 ft 6 in wheelbase. */
const AXLES = [2.07, 3.75];
const DRIVER_D = 0.66;
/** The boiler: centre, barrel radius (the smokebox 4 cm more), the smokebox from its door, the barrel's end in the bunker. */
const BY = 1.48;
const BR = 0.43;
const SMOKEBOX = [0.5, 1.08] as const;
const CHIMNEY_X = 0.85;
const CHIMNEY_TOP = 3.05;
/** The saddle tank. */
const TANK = [1.05, 2.07] as const;
const TANK_HALF = 0.68;
const TANK_FOOT = 1.2;
const TANK_TOP = 2.3;
const DOME_X = 2.32;
/** The bunker round the firebox: its front, the cab's spectacle plate; its side sheets' foot over the motion and behind it. */
const BUNKER = [2.56, 4.05] as const;
const BUNKER_TOP = 1.98;
const SHEET_FOOT = 1.15;
const CUT = 3.32;
/** The body's half width (side sheets, spectacle plate), the running board's. */
const HALF = 1.08;
const BOARD_HALF = 0.97;
/** The footplate: the running board's top. */
const DECK = 0.86;
/** The cab: the side wings beside the spectacle plate, the waist-high sides, the low sides to the rear corner. */
const WING = 4.42;
const WAIST = 4.98;
const LOW_TOP = 1.36;
const REAR = BEAM[1] - 0.02;
/** The roof: its eaves, crown and length (it overhangs the rear beam). */
const ROOF = [3.96, 5.95] as const;
const EAVES = 2.85;
const CROWN = 2.95;
const ROOF_HALF = 1.14;

/** Livery: NF Railway Caledonian blue, white lines, red frames and buffer beams, black smokebox, wheels and fittings. */
function palette(): Record<string, MaterialSpec> {
  return {
    paint: mat("#2a5aa4", 0.5),
    frame: mat("#9c2420", 0.65),
    wheel: mat("#1d1e20", 0.65),
    beam: mat("#8a1f1b", 0.6),
    smokebox: mat("#1c1d22", 0.85),
    jacket: mat("#232427", 0.6),
    lining: mat("#eceae2", 0.5),
    roof: mat("#26272a", 0.8),
    plate: mat("#9b1b1c", 0.5),
    plateText: { color: "#d2ab52", metallic: 0.5, roughness: 0.35 },
    chrome: { color: "#c9cdd1", metallic: 0.6, roughness: 0.25 },
    // the motion in dull steel, as in service
    rod: { color: "#8e9399", metallic: 0.35, roughness: 0.45 },
    numberYellow: mat("#e3b53a", 0.45),
  };
}

/** The saddle tank's section: vertical sides, a round crown. */
const TANK_SEC: Pt[] = (() => {
  const right: Pt[] = [[TANK_HALF, TANK_FOOT], [TANK_HALF, 1.72], [0.64, 1.9], [0.56, 2.05], [0.44, 2.17], [0.29, 2.255], [0.14, 2.29], [0, TANK_TOP]];
  return [...right, ...right.slice(0, -1).reverse().map(([z, y]): Pt => [-z, y])];
})();
/** The tank's plan: its corners rounded at both ends. */
const TANK_PLAN: Pt[] = [[TANK[0], 0.5], [TANK[0] + 0.03, 0.6], [TANK[0] + 0.08, TANK_HALF], [TANK[1] - 0.08, TANK_HALF], [TANK[1] - 0.03, 0.6], [TANK[1], 0.5]];

/** Brass or white letters on a side face at |z| = face, centred at x, their foot at y. */
function sideText(t: Steam, matName: string, s: number, x: number, y: number, text: string, face: number, h: number): void {
  const w = h * 0.62, gap = h * 0.2;
  const width = strokeWidth(text, w, gap);
  const u0 = t.X(x) + (s > 0 ? -width / 2 : width / 2);
  t.m.facets(matName, strokeText(text, u0, y, h, w, gap, s < 0).map(([u, v]): Vec3 => [u, v, s * (face + 0.004)]), [0, 0, s]);
}

/** A thin strip on side s: a white line or a sheet's edge, `proud` off the face at |z| = face. */
function strip(t: Steam, matName: string, s: number, x0: number, x1: number, y0: number, y1: number, face: number, proud = 0.006): void {
  t.sideBox(matName, s, x0, x1, y0, y1, face - 0.004, face + proud);
}

function front(t: Steam, number: string): void {
  const m = t.m;
  m.scope("front buffer beam", () => {
    // a deep beam with the central buffer-coupler, its hook and the safety chains' eyes
    t.box("beam", BEAM[0], BEAM[0] + 0.14, 0.4, 0.78, -0.95, 0.95);
    t.box("black", 0, BEAM[0], 0.46, 0.66, -0.2, 0.2);
    t.box("steel", -0.02, 0.02, 0.5, 0.62, -0.12, 0.12);
    for (const z of [-0.55, 0.55]) t.box("steel", BEAM[0] - 0.04, BEAM[0], 0.42, 0.5, z - 0.05, z + 0.05);
  });
  m.scope("buffer beam figures", () => {
    const X = t.X(BEAM[0]) + 0.004;
    const h = 0.14, w = h * 0.58, gap = h * 0.18;
    const width = strokeWidth(number, w, gap);
    m.facets("numberYellow", strokeText(number, -0.42 + width / 2, 0.49, h, w, gap, true).map(([u, v]): Vec3 => [X, v, u]), [1, 0, 0]);
  });
  m.scope("sanding platform", () => {
    // the deck over the beam where the two sanders ride, the sand box across it and its lids
    t.box("black", BEAM[0], SMOKEBOX[0] + 0.15, 0.78, 0.83, -0.97, 0.97);
    t.box("smokebox", BEAM[0] + 0.08, SMOKEBOX[0] - 0.02, 0.83, 1.08, -0.62, 0.62);
    for (const z of [-0.32, 0.32]) t.box("steel", BEAM[0] + 0.12, SMOKEBOX[0] - 0.06, 1.08, 1.11, z - 0.22, z + 0.22);
    // the sand pipes down in front of the wheels
    for (const s of [-1, 1]) m.rod("black", [t.X(SMOKEBOX[0] - 0.05), 0.85, s * 0.72], [t.X(1.6), 0.25, s * 0.72], 0.025, 5);
  });
  m.scope("front handrails", () => {
    // the hoops at the platform's corners, up to the smokebox's middle
    for (const s of [-1, 1]) {
      const z = s * 0.93;
      const p: Vec3[] = [[t.X(BEAM[0] + 0.05), 0.83, z], [t.X(BEAM[0] + 0.05), 1.5, z], [t.X(SMOKEBOX[0] + 0.05), 1.5, z], [t.X(SMOKEBOX[0] + 0.05), 0.83, z]];
      for (let i = 0; i + 1 < p.length; i++) m.rod("steel", p[i]!, p[i + 1]!, 0.02, 6);
    }
  });
  m.scope("headlamp", () => {
    // the big electric headlamp ahead of the chimney on its bracket from the smokebox top
    const [x0, x1, y, r] = [0.34, 0.7, 2.6, 0.25];
    t.cylX("black", x0 + 0.03, x1, 0, y, r, 18);
    t.cylX("chrome", x0, x0 + 0.05, 0, y, r + 0.025, 18);
    const lens = ngon(18, r - 0.04, Math.PI / 18, 0, y);
    m.sweep("lampHead", "x", lens, t.X(x0) - 0.006, lens, t.X(x0) + 0.01);
    t.box("black", 0.48, 0.6, 1.9, y - r + 0.02, -0.04, 0.04);
    t.box("black", 0.42, 0.66, y - r - 0.02, y - r + 0.03, -0.14, 0.14);
    for (const s of [-1, 1]) m.rod("black", [t.X(0.5), y - r, s * 0.12], [t.X(0.7), 1.94, s * 0.2], 0.015, 5);
  });
}

function boilerFittings(t: Steam): void {
  const m = t.m;
  m.scope("chimney cap", () => {
    // the copper-capped lip of the tall chimney
    t.cylY("brass", CHIMNEY_X, 0, CHIMNEY_TOP - 0.07, CHIMNEY_TOP, 0.165, 14, false);
  });
  m.scope("tank filler", () => {
    t.cylY("paint", 1.3, 0, TANK_TOP - 0.03, TANK_TOP + 0.09, 0.17, 12);
    t.cylY("steel", 1.3, 0, TANK_TOP + 0.09, TANK_TOP + 0.12, 0.12, 12);
  });
  m.scope("tank lining", () => {
    // a white line round the foot of the tank sides
    for (const s of [-1, 1]) strip(t, "lining", s, TANK[0] + 0.12, TANK[1] - 0.12, 1.36, 1.39, TANK_HALF);
  });
  m.scope("tank handrails", () => {
    for (const s of [-1, 1]) {
      t.cylX("steel", TANK[0] + 0.15, TANK[1] - 0.15, s * (TANK_HALF + 0.07), 1.98, 0.018, 6);
      for (const x of [TANK[0] + 0.25, TANK[1] - 0.25]) t.sideBox("steel", s, x - 0.012, x + 0.012, 1.968, 1.992, 0.6, TANK_HALF + 0.06);
    }
  });
  m.scope("safety valves", () => {
    // Ramsbottom valves and the whistle on the dome
    for (const dz of [-0.07, 0.07]) t.cylY("brass", DOME_X, dz, 2.6, 2.74, 0.04, 8);
    t.cylY("brass", DOME_X + 0.18, 0, 2.4, 2.66, 0.03, 8);
  });
  m.scope("smokebox door", () => {
    // the door's hinge straps and the brass ring of the number boss
    t.cylX("brass", SMOKEBOX[0] - 0.09, SMOKEBOX[0] - 0.07, 0, BY, 0.1, 12);
  });
}

function bunkerAndCab(t: Steam, number: string): void {
  const m = t.m;
  m.scope("firebox", () => t.box("jacket", BUNKER[0] + 0.04, BUNKER[1], DECK, SHEET_FOOT + 0.05, -0.6, 0.6));
  // the coal heaped over the firebox's top, above the sheets' rim
  t.coal(BUNKER[0] + 0.06, BUNKER[1] - 0.04, BUNKER_TOP - 0.06, HALF - 0.06, 0.18);
  m.scope("bunker", () => {
    // front plate and the side sheets: high over the motion ahead of CUT, to the footplate behind it
    t.box("paint", BUNKER[0], BUNKER[0] + 0.04, SHEET_FOOT, BUNKER_TOP, -HALF, HALF);
    for (const s of [-1, 1]) {
      t.sideBox("paint", s, BUNKER[0], CUT, SHEET_FOOT, BUNKER_TOP, HALF - 0.04, HALF);
      t.sideBox("paint", s, CUT, BUNKER[1], DECK - 0.05, BUNKER_TOP, HALF - 0.04, HALF);
      // the beading along the top edge
      t.sideBox("black", s, BUNKER[0], WING, BUNKER_TOP, BUNKER_TOP + 0.03, HALF - 0.05, HALF + 0.01);
    }
  });
  m.scope("spectacle plate", () => {
    // the cab front above the bunker with its two windows, up to the roof
    const [x0, x1] = [BUNKER[1], BUNKER[1] + 0.04];
    t.box("paint", x0, x1, BUNKER_TOP + 0.03, EAVES, -HALF, -0.78);
    t.box("paint", x0, x1, BUNKER_TOP + 0.03, EAVES, 0.78, HALF);
    t.box("paint", x0, x1, BUNKER_TOP + 0.03, EAVES, -0.32, 0.32);
    for (const s of [-1, 1]) {
      t.sideBox("paint", s, x0, x1, BUNKER_TOP + 0.03, 2.2, 0.32, 0.78);
      t.sideBox("paint", s, x0, x1, 2.62, EAVES, 0.32, 0.78);
      t.sideBox("glass", s, x0 + 0.01, x1 - 0.01, 2.2, 2.62, 0.32, 0.78);
    }
    // the backhead below it: the firehole door and the gauges
    t.box("jacket", x1, x1 + 0.12, DECK, BUNKER_TOP, -0.55, 0.55);
    t.box("steel", x1 + 0.12, x1 + 0.14, 1.05, 1.3, -0.18, 0.18);
    for (const z of [-0.3, 0.3]) t.cylX("brass", x1 + 0.12, x1 + 0.16, z, 1.66, 0.07, 10);
    t.cylX("brass", x1 - 0.02, x1 + 0.3, 0.6, 2.72 - 0.25, 0.025, 6);
  });
  m.scope("cab sides", () => {
    for (const s of [-1, 1]) {
      // the wings beside the spectacle plate, up to the roof
      t.sideBox("paint", s, BUNKER[1], WING, DECK - 0.05, EAVES, HALF - 0.04, HALF);
      // waist-high behind them, then low to the rear corner
      t.sideBox("paint", s, WING, WAIST, DECK - 0.05, BUNKER_TOP, HALF - 0.04, HALF);
      t.sideBox("paint", s, WAIST, REAR, DECK - 0.05, LOW_TOP, HALF - 0.04, HALF);
      // the brass grab handle on the waist side
      t.sideBox("brass", s, WAIST - 0.06, WAIST - 0.03, 1.35, 1.75, HALF, HALF + 0.03);
    }
    // the cab's rear: the low sides' end plate, open above
    t.box("paint", REAR - 0.04, REAR + 0.01, DECK - 0.05, LOW_TOP, -HALF, -0.45);
    t.box("paint", REAR - 0.04, REAR + 0.01, DECK - 0.05, LOW_TOP, 0.45, HALF);
  });
  m.scope("lining", () => {
    for (const s of [-1, 1]) {
      // two white lines along the sheets' foot from the cut to the rear corner
      for (const y of [0.93, 1.02]) strip(t, "lining", s, CUT + 0.03, REAR - 0.03, y, y + 0.035, HALF);
      // a white line framing the bunker side
      strip(t, "lining", s, BUNKER[0] + 0.06, CUT - 0.06, SHEET_FOOT + 0.06, SHEET_FOOT + 0.09, HALF);
      strip(t, "lining", s, BUNKER[0] + 0.06, WING - 0.06, BUNKER_TOP - 0.1, BUNKER_TOP - 0.07, HALF);
      strip(t, "lining", s, BUNKER[0] + 0.06, BUNKER[0] + 0.09, SHEET_FOOT + 0.09, BUNKER_TOP - 0.1, HALF);
    }
  });
  m.scope("letters", () => {
    for (const s of [-1, 1]) {
      // "N F" read from outside on both sides: the N toward the front on the left (-z), toward the rear on the right
      sideText(t, "plateText", s, s < 0 ? 2.95 : 3.65, 1.5, "N", HALF, 0.14);
      sideText(t, "plateText", s, s < 0 ? 3.65 : 2.95, 1.5, "F", HALF, 0.14);
    }
  });
  m.scope("numbers", () => {
    for (const s of [-1, 1]) t.sidePlate(s, 4.68, 1.4, number, HALF, 0.13);
  });
  m.scope("roof", () => {
    // a thin, slightly arched roof overhanging front, sides and rear
    const sec: Pt[] = [[-ROOF_HALF, EAVES], [ROOF_HALF, EAVES], [ROOF_HALF, EAVES + 0.03], [ROOF_HALF * 0.55, CROWN - 0.01], [0, CROWN], [-ROOF_HALF * 0.55, CROWN - 0.01], [-ROOF_HALF, EAVES + 0.03]];
    t.section("roof", ROOF[0], ROOF[1], sec);
  });
  m.scope("roof pillars", () => {
    for (const s of [-1, 1]) t.cylY("black", REAR - 0.12, s * (HALF - 0.06), LOW_TOP, EAVES, 0.035, 8, false);
  });
  m.scope("rear headlamp", () => {
    // the lamp on the roof's rear edge, looking back
    const [x0, x1, y, r] = [5.86, 5.52, CROWN + 0.21, 0.2];
    t.cylX("black", x1, x0 - 0.03, 0, y, r, 14);
    t.cylX("chrome", x0 - 0.04, x0, 0, y, r + 0.02, 14);
    const lens = ngon(14, r - 0.03, Math.PI / 14, 0, y);
    m.sweep("lampHead", "x", lens, t.X(x0) - 0.01, lens, t.X(x0) + 0.006);
    t.box("black", 5.62, 5.8, CROWN - 0.03, y - r + 0.02, -0.06, 0.06);
  });
  m.scope("rear buffer beam", () => {
    t.box("beam", BEAM[1] - 0.14, BEAM[1], 0.4, DECK - 0.05, -0.95, 0.95);
    t.box("black", BEAM[1], END, 0.46, 0.66, -0.2, 0.2);
    t.box("steel", END - 0.02, END + 0.02, 0.5, 0.62, -0.12, 0.12);
  });
}

/** The engine's spec (the B class has no tender: both values of `unit` draw it). */
export function dhrBSpec(number = "779"): LocoSpec {
  return {
    title: "DHR B class",
    palette: palette(),
    heads: [0, END],
    beams: { front: false, rear: false },
    boiler: { x0: SMOKEBOX[0], x1: BUNKER[0], y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], n: 20 },
    chimney: { x: CHIMNEY_X, top: CHIMNEY_TOP, r: 0.13 },
    domes: [{ x: DOME_X, top: 2.62, r: 0.25 }],
    volumes: [{ name: "saddle tank", sec: TANK_SEC, plan: TANK_PLAN, bands: [[TANK_FOOT, TANK_TOP, "paint"]] }],
    runningBoard: { profile: [[1.72, DECK], [REAR, DECK]], half: BOARD_HALF, valance: 0.06, valanceMat: "frame" },
    frame: { x0: BEAM[0] + 0.14, x1: BEAM[1] - 0.14, top: DECK - 0.06 },
    gear: {
      wheels: AXLES.map((x) => ({ x, d: DRIVER_D, spokes: 10 })),
      // two outside cylinders 11 x 14 in under the smokebox; the main rods drive the rear axle
      engines: [{ coupled: [0, 1], main: 1, cylinder: { x0: 0.82, x1: 1.3, y: 0.6, r: 0.15 }, crank: 0.18, phase: 0.3, valveGear: true }],
      cylinderZ: 1.02, reference: 0, wheelMaterial: "wheel", cylinderMat: "smokebox",
    },
    extras: (t) => {
      front(t, number);
      boilerFittings(t);
      bunkerAndCab(t, number);
    },
  };
}

/** The distant model: the kit's (boiler, tank, dome, chimney, wheels) with the bunker and cab as boxes, the roof and the headlamp. */
export function dhrBLod(): MeshBuilder {
  const spec = dhrBSpec();
  const far: LocoSpec = {
    ...spec,
    prisms: [
      { name: "bunker", x0: BUNKER[0], x1: WAIST, half: [[HALF, DECK], [HALF, BUNKER_TOP]] },
      { name: "rear sides", x0: WAIST, x1: REAR, half: [[HALF, DECK], [HALF, LOW_TOP]] },
    ],
  };
  const lod = steamLodSpec(far, octagon);
  const xc = END / 2;
  const X = (x: number) => xc - x;
  const flat = (y0: number, y1: number, m: string) => [[y0, y1, m]] as Array<[number, number, string]>;
  lod.parts.push({ draw: (m) => m.scope("cab", () => {
    // the cab front and its wings as one block, the roof over the cab
    lodShell(m, { ...boxShell(X(WING), X(BUNKER[1]), [[BUNKER_TOP, HALF], [EAVES, HALF]], flat(BUNKER_TOP, EAVES, "paint")), ends: [1, -1] });
    lodShell(m, { ...boxShell(X(ROOF[1]), X(ROOF[0]), [[EAVES, ROOF_HALF], [CROWN, ROOF_HALF]], flat(EAVES, CROWN, "roof")), ends: [1, -1] });
  }) });
  lod.parts.push({ draw: (m) => m.scope("headlamp", () => {
    lodShell(m, { ...boxShell(X(0.7), X(0.36), [[2.35, 0.22], [2.85, 0.22]], flat(2.35, 2.85, "black")), ends: [1, -1] });
  }) });
  lod.parts.push({ optional: 40, draw: (m) => m.scope("buffer beams", () => {
    lodShell(m, { ...boxShell(X(BEAM[0] + 0.14), X(BEAM[0]), [[0.4, 0.95], [0.78, 0.95]], flat(0.4, 0.78, "beam")), ends: [1] });
    lodShell(m, { ...boxShell(X(BEAM[1]), X(BEAM[1] - 0.14), [[0.4, 0.95], [DECK - 0.04, 0.95]], flat(0.4, DECK - 0.04, "beam")), ends: [-1] });
  }) });
  return fitLod(lod, 100);
}
