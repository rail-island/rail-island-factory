// The MTR M-Train, the Metro-Cammell electric units of Hong Kong's urban lines
// (1979-, refurbished 1998-2001): one design `veh-mtr-m-train` whose `unit` picks
// the car - the A car with the driving cab (a motor car, the default and the
// train's "locomotive"), the B motor car, the C motor car with the pantograph and
// the D trailer - or the whole train, articulated: `cars` (3 .. 8) cars, an A car
// at each end (the rear one turned), each car a section on its own two bogies.
// `livery` is the refurbished silver body with the black cab mask and red band,
// or the white, red-striped look of the 1979 trains (the 2024 anniversary train).
//
// Modelled from photographs (assets/mtr-m-train/) and the published figures: the
// A car 22.85 m and the others 22.0 m long, 3.11 m wide (narrowed to 3.06 m), 3.7 m
// high, the floor 1.1 m above the rail, five double-leaf sliding doors a side,
// SF2100 bogies of 2.5 m wheelbase on 850 mm wheels. The bodies are lofted through
// vertical slices (sliceBody.ts): the flat-sided aluminium body, its lower edge
// curving in under the floor, the low roof arc, and on the A car the cab end's
// rounded corners and the crown curving down to the flat face. See
// docs/models/mtr-m-train.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach } from "./csdCoachParts.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { centreCoupler, EMU_CATALOG, enumParam } from "./emuParts.ts";
import { unitBogie } from "./unitParts.ts";
import { diamond } from "./czElectricKit.ts";
import { LOD_GLASS, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, roofPart, sideGlass, turnBody, type UnitBody } from "./lodUnits.ts";
import { articulate } from "./tramKit.ts";
import { lerp, type Pt } from "./sliceLoft.ts";
import { drawShell, sideLettering, sidePanel, sliceCabin, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { openable, plugMove, LEAF_GAP } from "./doors.ts";
import { RAIL_COLLECTOR_TOP } from "./collector.ts";

/** What the design builds: one car, or the whole train. */
export type MtrUnit = "aCar" | "bCar" | "cCar" | "dCar" | "train";
export type MtrCar = Exclude<MtrUnit, "train">;
export type MtrLivery = "refurbished" | "retro";

/** The train's car counts: an A car at each end and at least one C car (the pantograph) between them. */
export const MTR_CARS = [3, 4, 5, 6, 7, 8];

export const MTR_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    aCar: "Cab car A",
    bCar: "Motor car B",
    cCar: "Pantograph car C",
    dCar: "Trailer D",
    train: "Full train",
  }),
  {
    ...enumParam("cars", "Cars", Object.fromEntries(MTR_CARS.map((n) => [String(n), `${n} cars`]))),
    default: "4",
    when: { name: "unit", values: ["train"] },
  },
  enumParam("livery", "Livery", {
    refurbished: "Refurbished",
    retro: "Retro (1979)",
  }),
];

/** Body lengths (m): the A car from its cab face, the others between their end walls. */
export const MTR_BODY = { aCar: 22.85, middle: 22.0 } as const;
/** Half the 0.5 m between two bodies: each inner end's coupling plane. */
export const MTR_GAP = 0.25;
/** The A car's front coupler face ahead of its cab face. */
export const MTR_FRONT_COUPLER = 0.35;
/** Bogie centres, symmetric about the body's middle (scaled from the photographs). */
export const MTR_BOGIE_CENTRES = 15.6;
export const MTR_WHEELBASE = 2.5;
const WHEEL_R = 0.425;
/** The crown above the rail. */
export const MTR_HEIGHT = 3.7;
/** Half the body width: 3.06 m, inside the repository envelope (the real car is 3.11 m). */
const W = 1.53;
const COUPLER_Y = 0.85;
/** The body's bottom, the floor (1.1 m, level with the platforms). */
const BOTTOM = 0.92;
/** Window sills and heads, between the doors and in the door leaves. */
const WIN: [number, number] = [1.98, 2.78];
const LEAF_WIN: [number, number] = [1.98, 2.86];
/** A door's outline box (y), and the outline's width round the leaves. */
const DOOR_Y: [number, number] = [1.1, 3.04];
const SEAM = 0.02;
/** The door pitch along the car, a door 1.4 m wide (55 in). */
const DOOR_PITCH = 4.5;
const DOOR_W = 1.4;

const isCab = (car: MtrCar) => car === "aCar";
const bodyLength = (car: MtrCar): number => (isCab(car) ? MTR_BODY.aCar : MTR_BODY.middle);
/** Length over the coupling planes: the A car's front coupler face to its rear plane. */
export const mtrLength = (car: MtrCar): number => bodyLength(car) + MTR_GAP + (isCab(car) ? MTR_FRONT_COUPLER : MTR_GAP);
/** The body's +X end behind the car's +X coupling plane. */
const frontOffset = (car: MtrCar): number => (isCab(car) ? MTR_FRONT_COUPLER : MTR_GAP);
/** Bogie centres, d metres back from the body's +X end. */
export function mtrBogies(car: MtrCar): [number, number] {
  const L = bodyLength(car);
  return [L / 2 - MTR_BOGIE_CENTRES / 2, L / 2 + MTR_BOGIE_CENTRES / 2];
}

/** The running numbers of the A164 set (assets/mtr-m-train/SOURCES.md), front to rear; a lone car takes the first of its letter. */
export const MTR_SET_NUMBERS = ["A169", "C169", "D602", "B456", "C456", "D619", "C164", "A164"];
const LONE_NUMBER: Record<MtrLivery, Record<MtrCar, string>> = {
  refurbished: { aCar: "A164", bCar: "B456", cCar: "C169", dCar: "D602" },
  retro: { aCar: "A161", bCar: "B442", cCar: "C161", dCar: "D601" },
};

// --- liveries ----------------------------------------------------------------------------------

interface Livery {
  palette: Record<string, MaterialSpec>;
  /** The cab face's red bands across the mask (bottom, top). */
  bands: Array<[number, number]>;
}

const c = (color: string, roughness = 0.4, metallic?: number): MaterialSpec => ({ color, roughness, ...(metallic !== undefined ? { metallic } : {}) });

const LIVERIES: Record<MtrLivery, Livery> = {
  // the refurbished trains: brushed aluminium, the black glass-fibre mask and emergency door, the red band
  refurbished: {
    palette: { body: c("#b9bdc1", 0.35, 0.55), mask: c("#26282b", 0.35), door: c("#1d1f22", 0.35), roof: c("#6b5f57", 0.8) },
    bands: [[1.72, 1.9]],
  },
  // the 1979 trains' white cab end with the wide red stripe and the thin one under it (the 2024 anniversary train)
  retro: {
    palette: { body: c("#e6e6e2", 0.4), mask: c("#efefeb", 0.35), door: c("#efefeb", 0.35), roof: c("#6b5f57", 0.8) },
    bands: [[1.5, 1.55], [1.6, 1.84]],
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  glass: { ...c("#27323d", 0.12, 0.2), glass: true },
  cabGlass: { ...c("#1d252e", 0.1, 0.25), glass: true },
  frame: c("#8e9398", 0.35, 0.5),
  rubber: c("#1c1c1e", 0.9),
  seam: c("#151517", 0.9),
  red: c("#d1202f", 0.4),
  white: c("#f4f4f2", 0.4),
  display: { ...c("#3a2410", 0.3), lamp: { role: "head" } },
  lampGlass: { ...c("#e8e2c4", 0.15), lamp: { role: "head" } },
  lampRed: { ...c("#c8202c", 0.3), lamp: { role: "tail" } },
  under: c("#2a2c2f", 0.85),
  equipment: c("#33363a", 0.8),
  motor: c("#2e3033", 0.8),
  bellows: c("#2a2b2d", 0.9),
  coupler: c("#2a2b2d", 0.6, 0.3),
  aircon: c("#7a7068", 0.7),
  lettering: c("#202124", 0.5),
  pantograph: c("#5a5d63", 0.6, 0.2),
  carbon: c("#2b2b2b", 0.8),
  steel: c("#6d7176", 0.5, 0.5),
  insulator: c("#c8c8c0", 0.4),
};

// --- the body: vertical slices ------------------------------------------------------------------

/** Segments of the roof's quarter arc. */
const ARC = 7;
/** The side stands almost upright from the belly to the shoulder. */
const LEAN = 0.992;
/** The belly (the lower body curves in under it) and the shoulder, where the roof arc starts. */
const BELLY = 1.2;
const SHOULDER = 3.28;
/** The cab end's corners: rounded in plan to the full width this far back. */
const CORNER = 0.32;
/** The cab end's crown curving down to the face's top. */
const CAB_C: Pt[] = [[0, 3.42], [0.06, 3.52], [0.14, 3.6], [0.3, 3.67], [0.6, MTR_HEIGHT]];
const FACE_TOP = 3.42;

function profile(car: MtrCar): SliceBody {
  const L = bodyLength(car);
  const cab = isCab(car);
  const w = (d: number) => (cab && d < CORNER ? W - CORNER + Math.sqrt(Math.max(0, CORNER ** 2 - (CORNER - d) ** 2)) : W);
  const keys = cab ? [0, 0.02, 0.06, 0.12, 0.2, 0.26, CORNER, 0.45, 0.6, L] : [0, L];
  return {
    length: L,
    B: () => BOTTOM,
    wl: (d) => Math.min(1.36, w(d) - 0.17),
    A: () => 1.02,
    wa: (d) => Math.min(1.47, w(d) - 0.06),
    Y: () => BELLY,
    w,
    S: () => SHOULDER,
    C: (d) => (cab ? lerp(CAB_C, d) : MTR_HEIGHT),
    edges: () => [],
    lean: LEAN,
    arc: ARC,
    stations: keys,
  };
}

/** The paint of edge k of a slice (0 the bottom, 1 the lower edge, 2 the lower body, 3 the side, then the arc). */
const edgeMat = (k: number): string => (k === 0 ? "under" : k <= 3 ? "body" : "roof");

// --- the cars -------------------------------------------------------------------------------

interface Layout {
  /** Door spans (d0, d1). */
  doors: Array<[number, number]>;
  /** Window spans between the doors (and the cab's side window). */
  windows: Array<[number, number]>;
}

/** Five doors 4.5 m apart, the last 2.0 m from the inner end; a window midway between two doors, the cab's side window behind the corner. */
export function mtrLayout(car: MtrCar): Layout {
  const L = bodyLength(car);
  const centres = Array.from({ length: 5 }, (_, i) => L - 2.0 - (4 - i) * DOOR_PITCH);
  const doors = centres.map((x): [number, number] => [x - DOOR_W / 2, x + DOOR_W / 2]);
  const windows = centres.slice(0, -1).map((x): [number, number] => [x + DOOR_PITCH / 2 - 0.8, x + DOOR_PITCH / 2 + 0.8]);
  if (isCab(car)) windows.unshift([0.62, 1.55]);
  return { doors, windows };
}

/** A window: its frame, the glass, and its upper hopper's bar. */
function sideWindow(m: MeshBuilder, p: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, hopper: boolean): void {
  m.scope("frame", () => sidePanel(m, p, X, s, "frame", d0, d1, WIN[0], WIN[1], 0.006, 0.03));
  m.scope("glass", () => sidePanel(m, p, X, s, "glass", d0 + 0.05, d1 - 0.05, WIN[0] + 0.05, WIN[1] - 0.05, 0.011, 0.004));
  if (hopper) m.scope("hopper", () => sidePanel(m, p, X, s, "frame", d0 + 0.05, d1 - 0.05, 2.5, 2.54, 0.015, 0.004));
}

/**
 * A double-leaf sliding door: the dark outline round the doorway cut through the
 * shell, and two leaves in the body's paint, each with its tall window, that step
 * out a little and slide apart along the side (doors.ts).
 */
function sideDoor(m: MeshBuilder, p: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number): void {
  const [y0, y1] = DOOR_Y;
  m.scope("outline", () => {
    sidePanel(m, p, X, s, "seam", d0, d0 + SEAM, y0, y1, 0.004, 0.03);
    sidePanel(m, p, X, s, "seam", d1 - SEAM, d1, y0, y1, 0.004, 0.03);
    sidePanel(m, p, X, s, "seam", d0 + SEAM, d1 - SEAM, y1 - SEAM, y1, 0.004, 0.03);
  });
  const [a, b] = [d0 + SEAM, d1 - SEAM];
  const half = (b - a - LEAF_GAP) / 2;
  const leaves: Array<[number, number, number]> = [
    // each leaf slides toward its own jamb by its width (d0's leaf toward smaller d)
    [a, a + half, X(a) - X(a + half)],
    [b - half, b, X(b) - X(b - half)],
  ];
  openable(m, (mm, o) =>
    leaves.forEach(([la, lb, slide], i) =>
      mm.moved(plugMove(o, s, slide, 0.03), () => {
        mm.scope("leaf", () => sidePanel(mm, p, X, s, "body", la, lb, y0 + 0.005, y1 - SEAM - 0.005, 0.008, 0.004));
        mm.scope("glass", () => sidePanel(mm, p, X, s, "glass", la + 0.13, lb - 0.13, LEAF_WIN[0], LEAF_WIN[1], 0.013, 0.004));
        // the rubber edge where the two leaves meet, on the first one
        if (i === 0) mm.scope("edge", () => sidePanel(mm, p, X, s, "rubber", lb - 0.012, lb + LEAF_GAP + 0.006, y0 + 0.005, y1 - SEAM - 0.005, 0.0105, 0.004));
      }),
    ),
  );
}

/** The fittings at an inner end at d `wall` (e: +1 the +X end): the end door, a gangway frame (a lone car) and the coupler. */
function innerEnd(m: MeshBuilder, X: (d: number) => number, e: number, wall: number, gangway: boolean): void {
  const face = e > 0 ? -MTR_GAP : wall + MTR_GAP;
  m.scope("end door", () => {
    const [a, b] = [X(wall), X(wall) + e * 0.012].sort((q, r) => q - r) as [number, number];
    block(m, "rubber", a, b, 1.12, 3.05, -0.45, 0.45);
  });
  if (gangway)
    m.scope("gangway", () => {
      const [a, b] = [X(wall) - e * 0.02, X(face) - e * 0.01].sort((q, r) => q - r) as [number, number];
      for (const z of [-1, 1]) block(m, "rubber", a, b, 1.02, 3.3, ...side(z, 0.62, 0.82));
      block(m, "rubber", a, b, 3.12, 3.3, -0.62, 0.62);
    });
  m.scope("coupler", () => centreCoupler(m, e, X(wall + e * 0.9), X(face), COUPLER_Y));
}

/** A flat panel on the cab face (the plane x = xf), polygon (z, y), `proud` off it and `depth` deep. */
function facePanel(m: MeshBuilder, xf: number, mat: string, poly: Pt[], proud: number, depth: number): void {
  m.slab(mat, poly.map(([z, y]): Vec3 => [xf + proud, y, z]), [-depth, 0, 0]);
}

/** A rectangle (z0..z1, y0..y1) with its corners rounded by r (`round`: which corners, bottom-left, bottom-right, top-right, top-left seen from ahead). */
function roundRect(z0: number, z1: number, y0: number, y1: number, r: number, round = [true, true, true, true]): Pt[] {
  const out: Pt[] = [];
  const corners: Array<[number, number, number]> = [[z0 + r, y0 + r, Math.PI], [z1 - r, y0 + r, 1.5 * Math.PI], [z1 - r, y1 - r, 0], [z0 + r, y1 - r, 0.5 * Math.PI]];
  const sharp: Pt[] = [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];
  corners.forEach(([cz, cy, a0], i) => {
    if (!round[i]) {
      out.push(sharp[i]!);
      return;
    }
    for (let k = 0; k <= 4; k++) {
      const a = a0 + (k / 4) * (Math.PI / 2);
      out.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  });
  // wound so that the face points +X: z increases to the viewer's left; reverse for +X normal
  return out.reverse();
}

/**
 * The A car's cab face: the mask with the two windscreens and their displays, the
 * emergency door between them, the red bands with the MTR roundel, the header's
 * two small lamps and the round lamp, the bumper's head and tail lamps, the
 * anticlimber strip.
 */
function drawCabFace(m: MeshBuilder, L: Livery, xf: number): void {
  m.scope("mask", () => facePanel(m, xf, "mask", roundRect(-1.13, 1.13, 1.58, 3.1, 0.2, [true, true, false, false]), 0.004, 0.02));
  m.scope("emergency door", () => facePanel(m, xf, "door", roundRect(-0.47, 0.47, 1.36, 3.085, 0.02), 0.009, 0.02));
  m.scope("windscreens", () => {
    for (const s of [1, -1]) {
      const [z0, z1] = s > 0 ? [0.6, 1.05] : [-1.05, -0.6];
      facePanel(m, xf, "rubber", roundRect(z0, z1, 1.98, 2.98, 0.04), 0.009, 0.02);
      facePanel(m, xf, "cabGlass", roundRect(z0 + 0.03, z1 - 0.03, 2.01, 2.77, 0.03), 0.014, 0.004);
      facePanel(m, xf, "display", roundRect(z0 + 0.05, z1 - 0.05, 2.8, 2.95, 0.01), 0.014, 0.004);
    }
  });
  m.scope("bands", () => {
    for (const [y0, y1] of L.bands) facePanel(m, xf, "red", roundRect(-1.08, 1.08, y0, y1, Math.min(0.08, (y1 - y0) / 2 - 0.001)), 0.017, 0.004);
  });
  m.scope("roundel", () => {
    const [y0, y1] = L.bands[L.bands.length - 1]!;
    const yc = (y0 + y1) / 2;
    const disc = (r: number): Pt[] => Array.from({ length: 16 }, (_, i): Pt => [r * Math.cos((-2 * Math.PI * i) / 16), yc + r * Math.sin((-2 * Math.PI * i) / 16)]);
    facePanel(m, xf, "white", disc(0.08), 0.021, 0.003);
    facePanel(m, xf, "red", disc(0.062), 0.024, 0.003);
    // the roundel's mark: the upright and the bar
    facePanel(m, xf, "white", roundRect(-0.009, 0.009, yc - 0.05, yc + 0.05, 0.004), 0.027, 0.002);
    facePanel(m, xf, "white", roundRect(-0.045, 0.045, yc - 0.008, yc + 0.008, 0.004), 0.027, 0.002);
  });
  m.scope("header lamps", () => {
    for (const z of [-0.3, 0.3]) facePanel(m, xf, "rubber", roundRect(z - 0.12, z + 0.12, 3.15, 3.33, 0.02), 0.006, 0.02);
    for (const z of [-0.3, 0.3]) facePanel(m, xf, "lampGlass", roundRect(z - 0.09, z + 0.09, 3.18, 3.3, 0.015), 0.011, 0.004);
    facePanel(m, xf, "frame", Array.from({ length: 12 }, (_, i): Pt => [0.07 * Math.cos((-2 * Math.PI * i) / 12), 3.24 + 0.07 * Math.sin((-2 * Math.PI * i) / 12)]), 0.006, 0.02);
    facePanel(m, xf, "lampGlass", Array.from({ length: 12 }, (_, i): Pt => [0.05 * Math.cos((-2 * Math.PI * i) / 12), 3.24 + 0.05 * Math.sin((-2 * Math.PI * i) / 12)]), 0.011, 0.004);
  });
  m.scope("bumper lamps", () => {
    for (const s of [1, -1]) {
      const [z0, z1] = s > 0 ? [0.58, 1.0] : [-1.0, -0.58];
      facePanel(m, xf, "rubber", roundRect(z0, z1, 1.04, 1.22, 0.03), 0.006, 0.02);
      const [h0, h1] = s > 0 ? [0.64, 0.77] : [-0.77, -0.64];
      const [t0, t1] = s > 0 ? [0.83, 0.95] : [-0.95, -0.83];
      facePanel(m, xf, "lampGlass", roundRect(h0, h1, 1.07, 1.19, 0.01), 0.011, 0.004);
      facePanel(m, xf, "lampRed", roundRect(t0, t1, 1.08, 1.18, 0.01), 0.011, 0.004);
    }
  });
  m.scope("anticlimber", () => facePanel(m, xf, "rubber", roundRect(-1.1, 1.1, 1.26, 1.3, 0.01), 0.006, 0.03));
}

/** A low air-conditioning unit on the crown at d. */
function aircon(m: MeshBuilder, X: (d: number) => number, d: number): void {
  const [a, b] = [X(d + 1.2), X(d - 1.2)].sort((p, q) => p - q) as [number, number];
  block(m, "aircon", a, b, MTR_HEIGHT - 0.1, MTR_HEIGHT + 0.14, -0.78, 0.78);
  // the grille's darker lid
  block(m, "equipment", a + 0.3, b - 0.3, MTR_HEIGHT + 0.14, MTR_HEIGHT + 0.16, -0.55, 0.55);
}

/** The C car's pantograph near its +X end; the raised collector reaches the game's contact wire, not the MTR's own line. */
const PANTOGRAPH_D = 3.2;
export const MTR_WIRE = RAIL_COLLECTOR_TOP;

function drawCar(coach: Coach, L: Livery, car: MtrCar, X: (d: number) => number, gangway: boolean, number: string): void {
  const m = coach.m;
  const cab = isCab(car);
  const p = profile(car);
  const lay = mtrLayout(car);
  // the doors' leaf boxes, the doorways into the car's cabin (doors.ts)
  const leaves: SliceDoorway[] = [1, -1].flatMap((s) => lay.doors.map(([a, b]) => ({ s, d0: a + SEAM, d1: b - SEAM, y0: DOOR_Y[0], y1: DOOR_Y[1] - SEAM })));
  m.scope("body", () => {
    m.scope("shell", () => {
      const cut = leaves.map((o) => ({ ...o, d0: o.d0 - 0.002, d1: o.d1 + 0.002, y0: o.y0 - 0.002, y1: o.y1 + 0.002 }));
      drawShell(m, p, X, (_d, k) => edgeMat(k), (d) => [[p.B(d), SHOULDER, "body"], [SHOULDER, p.C(d), "roof"]], { front: true, rear: true }, cut);
    });
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("doors", () => lay.doors.forEach(([a, b], i) => m.scope(`door ${i + 1}`, () => sideDoor(m, p, X, s, a, b))));
        m.scope("windows", () => lay.windows.forEach(([a, b], i) => m.scope(`window ${i + 1}`, () => sideWindow(m, p, X, s, a, b, !(cab && i === 0)))));
        // the running number on the body under the middle window
        m.scope("running number", () => sideLettering(m, p, X, s, number, p.length / 2 - DOOR_PITCH / 2 + (cab ? 0.425 : 0), 1.55, 0.1, "lettering"));
        // the rain gutter's rib where the roof starts
        m.scope("gutter", () => sidePanel(m, p, X, s, "frame", cab ? CORNER + 0.05 : 0.02, p.length - 0.02, SHOULDER - 0.05, SHOULDER - 0.02, 0.006, 0.02));
      });
    const panes = [1, -1].flatMap((s) => lay.windows.map(([a, b]) => ({ s, d0: a + 0.05, d1: b - 0.05, y0: WIN[0] + 0.05, y1: WIN[1] - 0.05 })));
    sliceCabin(m, p, X, cab ? 1.65 : 0, p.length, leaves, panes);
  });
  if (cab) {
    m.scope("cab end", () => drawCabFace(m, L, X(0)));
    m.scope("front coupler", () => centreCoupler(m, 1, X(0.9), X(-MTR_FRONT_COUPLER), COUPLER_Y));
  } else m.scope("front end", () => innerEnd(m, X, 1, 0, gangway));
  m.scope("rear end", () => innerEnd(m, X, -1, p.length, gangway));
  m.scope("roof equipment", () => {
    const units = car === "cCar" ? [p.length - 5.5, p.length / 2 - 1.0] : [5.5, p.length - 5.5];
    m.scope("air conditioning", () => units.forEach((d, i) => m.scope(`unit ${i + 1}`, () => aircon(m, X, d))));
    if (car === "cCar")
      m.scope("pantographs", () => m.scope("pantograph", () => diamond(m, { xc: X(PANTOGRAPH_D), roofY: MTR_HEIGHT - 0.03, baseY: MTR_HEIGHT + 0.22, raised: true, raisedTop: MTR_WIRE })));
  });
  m.scope("running gear", () => {
    mtrBogies(car).forEach((d, i) => m.scope(`bogie ${i + 1}`, () => unitBogie(coach, X(d), { wb: MTR_WHEELBASE, r: WHEEL_R, motor: car !== "dCar", air: true, top: BOTTOM - 0.02, frame: 1.0 })));
    m.scope("underframe", () => {
      const [b1, b2] = mtrBogies(car);
      for (const [a, b] of [[b1 + 2.1, b1 + 5.6], [b1 + 6.1, b2 - 6.1], [b2 - 5.6, b2 - 2.1]] as const) {
        const [x0, x1] = [X(b), X(a)].sort((q, r) => q - r) as [number, number];
        block(m, "equipment", x0, x1, 0.42, BOTTOM + 0.01, -1.1, 1.1);
      }
    });
  });
}

// --- the train ------------------------------------------------------------------------------

export interface MtrSlot {
  car: MtrCar;
  number: string;
  lo: number;
  hi: number;
  turned: boolean;
}

/**
 * The cars of a train of `n` (3 .. 8), front first: the 8-car urban formation
 * A-C+D+B-C+D+C-A shortened from its middle - the two A cars at the ends, a C car
 * (the pantograph) behind the leading A and ahead of the trailing one, the 4-car
 * train A-C+C-A as the Disneyland line's sets. Each with its running number from
 * the A164 set and its span lo..hi over the coupling planes, the train centred on
 * x = 0.
 */
export const MTR_FORMATIONS: Record<number, MtrCar[]> = {
  3: ["aCar", "cCar", "aCar"],
  4: ["aCar", "cCar", "cCar", "aCar"],
  5: ["aCar", "cCar", "dCar", "cCar", "aCar"],
  6: ["aCar", "cCar", "dCar", "bCar", "cCar", "aCar"],
  7: ["aCar", "cCar", "dCar", "bCar", "cCar", "cCar", "aCar"],
  8: ["aCar", "cCar", "dCar", "bCar", "cCar", "dCar", "cCar", "aCar"],
};

export function mtrTrain(n: number): MtrSlot[] {
  const cars = MTR_FORMATIONS[n]!;
  // numbers: the set's cars of each letter in order, the trailing A car the set's last
  const pool = (letter: string) => MTR_SET_NUMBERS.filter((x) => x.startsWith(letter));
  const used: Record<string, number> = {};
  const numbers = cars.map((car, i) => {
    const letter = car[0]!.toUpperCase();
    if (car === "aCar") return i === 0 ? "A169" : "A164";
    const list = pool(letter);
    const k = used[letter] ?? 0;
    used[letter] = k + 1;
    return list[k] ?? `${letter}${Number(list[list.length - 1]!.slice(1)) + k}`;
  });
  const total = cars.reduce((t, car) => t + mtrLength(car), 0);
  let hi = total / 2;
  return cars.map((car, i) => {
    const lo = hi - mtrLength(car);
    const out = { car, number: numbers[i]!, lo, hi, turned: i === n - 1 };
    hi = lo;
    return out;
  });
}

/** The bellows' cross-section between two cars (z, y). */
const BELLOWS: Array<[number, number]> = [[-0.8, 1.02], [0.8, 1.02], [0.8, 3.2], [0.7, 3.3], [-0.7, 3.3], [-0.8, 3.2]];
const MAX_BEND_DEG = 10;

function train(n: number, L: Livery, livery: MtrLivery): MeshBuilder {
  const slots = mtrTrain(n);
  const coach = new Coach({ ...PALETTE, ...L.palette }, 0);
  const m = coach.m;
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = mtrLength(slot.car);
    const X = (d: number) => cx + len / 2 - frontOffset(slot.car) - d;
    const number = livery === "retro" && slot.car === "aCar" ? (k === 0 ? "A162" : "A161") : slot.number;
    return {
      // an A car's cab end is its own coupling plane's side; its inner end 0.25 m inside the plane
      x0: slot.lo + MTR_GAP,
      x1: slot.hi - (k === 0 ? 0 : MTR_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => (slot.turned ? m.turned(cx, () => drawCar(coach, L, slot.car, X, false, number)) : drawCar(coach, L, slot.car, X, false, number))),
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND_DEG, slots.slice(0, -1).map((slot) => slot.lo));
  return m;
}

export function mtrMTrain(params?: ParamValues): MeshBuilder {
  const p = resolveParams(MTR_PARAMS, params);
  const livery = p.livery as MtrLivery;
  const L = LIVERIES[livery];
  const unit = p.unit as MtrUnit;
  if (unit === "train") return train(Number(p.cars), L, livery);
  const coach = new Coach({ ...PALETTE, ...L.palette }, 0);
  const len = mtrLength(unit);
  drawCar(coach, L, unit, (d) => len / 2 - frontOffset(unit) - d, true, LONE_NUMBER[livery][unit]);
  return coach.m;
}

// --- distant view ---------------------------------------------------------------------------

/** The distant model's budget: 100 triangles a car, 300 at most. */
export const MTR_LOD = 300;

function carLod(car: MtrCar, X: (d: number) => number, cx: number, turned: boolean, section: number | undefined, inside: { front: boolean; rear: boolean }): { body: UnitBody; parts: LodPart[] } {
  const cab = isCab(car);
  const T = (x: number) => (turned ? 2 * cx - x : x);
  const L = bodyLength(car);
  const sideBands: LodBand[] = [[BOTTOM, SHOULDER, "body"], [SHOULDER, MTR_HEIGHT, "roof"]];
  const hw: Array<readonly [number, number]> = [[BOTTOM, 1.36], [1.02, 1.47], [BELLY, W], [SHOULDER, W * LEAN], [3.55, 1.05], [MTR_HEIGHT, 0.3]];
  const flat = (d: number, hidden: boolean) => ({ tip: [[BOTTOM, X(d)]] as Array<readonly [number, number]>, ...(hidden ? { hidden: true } : {}) });
  const boxes = mtrLayout(car).windows.map(([a, b]) => ({ x0: X(b), x1: X(a), y0: WIN[0], y1: WIN[1] }));
  let body: UnitBody = {
    y0: BOTTOM,
    hw,
    side: sideBands,
    roof: "roof",
    front: cab
      ? {
          tip: [[BOTTOM, X(0)], [FACE_TOP, X(0)], [MTR_HEIGHT, X(0.6)]],
          setback: [[BOTTOM, CORNER], [MTR_HEIGHT, CORNER]],
          paint: [[BOTTOM, 1.58, "body"], [1.58, 3.1, "mask"], [3.1, MTR_HEIGHT, "body"]],
          windows: [{ u: [-1.05, -0.6], y: [1.98, 2.95], mat: LOD_GLASS }, { u: [0.6, 1.05], y: [1.98, 2.95], mat: LOD_GLASS }],
        }
      : flat(0, inside.front),
    rear: flat(L, inside.rear),
    windows: sideGlass(boxes, 0.6),
    ...(section !== undefined ? { section } : {}),
  };
  if (turned) body = turnBody(body, cx);
  const bogies = mtrBogies(car).map((d) => [T(X(d)), MTR_WHEELBASE / 2 + WHEEL_R + 0.2, ...(section !== undefined ? [section] : [])] as const);
  const parts: LodPart[] = [
    ...bogieParts(bogies as unknown as ReadonlyArray<readonly [number, number, number?]>, BOTTOM).map((part) => (!cab && section !== undefined ? { ...part, optional: 5 } : part)),
    ...(car === "cCar" ? [{ ...roofPart("pantograph", T(X(PANTOGRAPH_D)) - 0.8, T(X(PANTOGRAPH_D)) + 0.8, 0.5, 0.5, MTR_HEIGHT, MTR_WIRE, section), optional: 8 }] : []),
  ];
  return { body, parts };
}

/**
 * The M-Train for distant views (lodUnits.ts): the body's section, the silver
 * sides and the roof, the window band; the A car's flat face with its rounded
 * corners, the mask and the windscreens; the bogies, a C car's pantograph as a
 * block. The train keeps the full model's sections, 100 triangles a car, 300 at most.
 */
export function mtrMTrainLod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(MTR_PARAMS, params);
  const L = LIVERIES[p.livery as MtrLivery];
  const palette = { ...PALETTE, ...L.palette };
  const unit = p.unit as MtrUnit;
  if (unit !== "train") {
    const len = mtrLength(unit);
    const { body, parts } = carLod(unit, (d) => len / 2 - frontOffset(unit) - d, 0, false, undefined, { front: false, rear: false });
    return fitUnit({ palette, bodies: [body], parts }, 100);
  }
  const n = Number(p.cars);
  const slots = mtrTrain(n);
  const built = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = mtrLength(slot.car);
    return carLod(slot.car, (d) => cx + len / 2 - frontOffset(slot.car) - d, cx, slot.turned, k, slot.turned ? { front: false, rear: k > 0 } : { front: k > 0, rear: k < n - 1 });
  });
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, COUPLER_Y, 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({
      sections: [i, i + 1] as [number, number],
      front: slot.lo + MTR_GAP,
      rear: slots[i + 1]!.hi - MTR_GAP,
      profile: [[-0.8, 1.02], [0.8, 1.02], [0.8, 3.3], [-0.8, 3.3]] as Array<[number, number]>,
    })),
    maxBendDeg: MAX_BEND_DEG,
  };
  return fitUnit({ palette, bodies: built.map((b) => b.body), parts: built.flatMap((b) => b.parts), sections }, Math.min(MTR_LOD, 100 * n));
}

// --- what the game needs ----------------------------------------------------------------------

/**
 * A, B and C cars are motor cars with four 85 kW traction motors (340 kW); D cars
 * are trailers. 80 km/h in service, 1.0 m/s2. The car weights are estimates (the
 * sources publish none): A 37 t, B 36 t, C 37 t, D 27 t.
 */
const CAR_WEIGHT: Record<MtrCar, number> = { aCar: 37, bCar: 36, cCar: 37, dCar: 27 };
const CAR_POWER: Record<MtrCar, number> = { aCar: 340, bCar: 340, cCar: 340, dCar: 0 };

function mtrGame(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const livery of Object.keys(LIVERIES) as MtrLivery[]) {
    const base: ParamValues = livery === "refurbished" ? {} : { livery };
    for (const unit of ["bCar", "cCar", "dCar"] as const) variants.push({ params: { ...base, unit }, weight: CAR_WEIGHT[unit], power: CAR_POWER[unit] });
    for (const n of MTR_CARS) {
      const cars = MTR_FORMATIONS[n]!;
      variants.push({
        params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" },
        weight: cars.reduce((t, car) => t + CAR_WEIGHT[car], 0),
        power: cars.reduce((t, car) => t + CAR_POWER[car], 0),
      });
    }
  }
  return { weight: CAR_WEIGHT.aCar, power: CAR_POWER.aCar, maxspeed: 80, accel: 1.0, variants };
}

export const MTR_M_TRAIN_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-mtr-m-train", game: mtrGame(), title: "MTR M-Train", build: mtrMTrain, buildLod: mtrMTrainLod, lodTriangles: MTR_LOD, params: MTR_PARAMS, catalog: EMU_CATALOG, references: "mtr-m-train" },
];
