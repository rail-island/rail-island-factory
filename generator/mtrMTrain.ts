// The MTR M-Train, the Metro-Cammell electric units of Hong Kong's urban lines
// (1979-, refurbished 1998-2001): one design `veh-mtr-m-train` whose `unit` picks
// the car - the A car with the driving cab (a motor car, the default and the
// train's "locomotive"), the B motor car, the C motor car with the pantograph and
// the D trailer, or the whole train, articulated: `cars` (3 .. 8) cars, an A car
// at each end (the rear one turned), each car a section on its own two bogies.
// `livery` is the refurbished silver body with the black cab mask and red band,
// or the 1979 look: the original front (the same silver as the sides) with its two red
// stripes, or the Disneyland Resort Line's - offered only on the cars that line ran:
// the A car drawn as its P cab car, the C car as its Q pantograph car and the
// train as P-Q..Q-P (four cars, P-Q+Q-P, by default), with three doors a side, Mickey-head windows and their
// own blue and yellow front.
//
// Modelled from photographs (assets/mtr-m-train/) and the published figures: the
// A and P cars 22.85 m and the others 22.0 m long, 3.11 m wide (narrowed to 3.06
// m), 3.7 m high, the floor 1.1 m above the rail, SF2100 bogies of 2.5 m
// wheelbase on 850 mm wheels. The bodies are lofted through vertical slices
// (sliceBody.ts): the flat-sided aluminium body, its lower edge curving in under
// the floor, the low roof arc, and on a cab car the face's corners rounded in
// plan and the crown curving down to it, by front style. See
// docs/models/mtr-m-train.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach } from "./csdCoachParts.ts";
import { resolveOfferedParams } from "./paramOffers.ts";
import { type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { centreCoupler, EMU_CATALOG, enumParam } from "./emuParts.ts";
import { unitBogie } from "./unitParts.ts";
import { diamond } from "./czElectricKit.ts";
import { LOD_GLASS, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, roofPart, sideGlass, turnBody, type UnitBody } from "./lodUnits.ts";
import { articulate } from "./tramKit.ts";
import { lerp, type Pt } from "./sliceLoft.ts";
import { drawShell, sideDecal, sideLettering, sidePane, sidePanel, sliceCabin, type SliceBody, type SliceDoorway } from "./sliceBody.ts";
import { openable, plugMove, LEAF_GAP } from "./doors.ts";
import { RAIL_COLLECTOR_TOP } from "./collector.ts";
import { strokeWidth } from "./strokeFont.ts";

/** What the design builds: one car, or a whole train. */
export type MtrUnit = "aCar" | "bCar" | "cCar" | "dCar" | "train";
/** The cars drawn: the urban A to D cars, and the Disneyland line's P and Q cars (the A and C cars in its livery). */
export type MtrCar = "aCar" | "bCar" | "cCar" | "dCar" | "pCar" | "qCar";
export type MtrLivery = "refurbished" | "retro" | "disneyland";
/** A cab car's front: the 1998 refurbished mask, the 1979 original glass-fibre front, the Disneyland line's. */
export type MtrFront = "refurbished" | "original" | "disney";

/** The urban train's car counts: an A car at each end and at least one C car (the pantograph) between them. */
export const MTR_CARS = [3, 4, 5, 6, 7, 8];
/** The units the Disneyland Resort Line ran: its P cab car (an A car), Q pantograph car (a C car) and its train (P-Q..Q-P, 3 .. 8 cars). */
const DRL_UNITS: MtrUnit[] = ["aCar", "cCar", "train"];
/** The urban lines' liveries. */
const URBAN_LIVERIES: MtrLivery[] = ["refurbished", "retro"];

/**
 * The car, then the livery, then the train's length. The Disneyland livery is
 * offered only on the cars that line ran (a value's `when`, design.ts): the A car,
 * the C car and the train - no B or D car. Its train comes in every length, a P
 * car at each end and Q cars between them.
 */
export const MTR_PARAMS: readonly ParamSpec[] = [
  {
    ...enumParam("unit", "Car", {
      aCar: "Cab car A",
      bCar: "Motor car B",
      cCar: "Pantograph car C",
      dCar: "Trailer D",
      train: "Full train",
    }),
    // the Disneyland cars, once units of their own, are the A and C cars and the train in the Disneyland livery
    retired: { pCar: { unit: "aCar", livery: "disneyland" }, qCar: { unit: "cCar", livery: "disneyland" }, drlTrain: { unit: "train", livery: "disneyland", cars: "4" } },
  },
  {
    name: "livery",
    title: "Livery",
    default: "refurbished",
    values: [
      { value: "refurbished", title: "Refurbished" },
      { value: "retro", title: "Retro (1979)" },
      { value: "disneyland", title: "Disneyland", when: { name: "unit", values: DRL_UNITS } },
    ],
  },
  {
    name: "cars",
    title: "Cars",
    default: "4",
    when: { name: "unit", values: ["train"] },
    values: MTR_CARS.map((n) => ({ value: String(n), title: `${n} cars` })),
  },
];

/** Body lengths (m): a cab car from its cab face, the others between their end walls. */
export const MTR_BODY = { cab: 22.85, middle: 22.0 } as const;
/** Half the 0.5 m between two bodies: each inner end's coupling plane. */
export const MTR_GAP = 0.25;
/** A cab car's front coupler face ahead of its cab face. */
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
/** The urban cars' door pitch, a door 1.4 m wide (55 in). */
const DOOR_PITCH = 4.5;
const DOOR_W = 1.4;

export const isCab = (car: MtrCar) => car === "aCar" || car === "pCar";
export const hasPantograph = (car: MtrCar) => car === "cCar" || car === "qCar";
const isDisney = (car: MtrCar) => car === "pCar" || car === "qCar";
const bodyLength = (car: MtrCar): number => (isCab(car) ? MTR_BODY.cab : MTR_BODY.middle);
/** Length over the coupling planes: a cab car's front coupler face to its rear plane. */
export const mtrLength = (car: MtrCar): number => bodyLength(car) + MTR_GAP + (isCab(car) ? MTR_FRONT_COUPLER : MTR_GAP);
/** The body's +X end behind the car's +X coupling plane. */
const frontOffset = (car: MtrCar): number => (isCab(car) ? MTR_FRONT_COUPLER : MTR_GAP);
/** Bogie centres, d metres back from the body's +X end. */
export function mtrBogies(car: MtrCar): [number, number] {
  const L = bodyLength(car);
  return [L / 2 - MTR_BOGIE_CENTRES / 2, L / 2 + MTR_BOGIE_CENTRES / 2];
}
/** A cab car's front: the Disneyland P car's own, the 1979 front with the retro livery, else the refurbished mask. */
export const mtrFront = (car: MtrCar, livery: MtrLivery): MtrFront => (isDisney(car) ? "disney" : livery === "retro" ? "original" : "refurbished");
/** The car drawn for a unit in a livery: the Disneyland livery's A car is the P car, its C car the Q car. */
export const mtrCarOf = (unit: Exclude<MtrUnit, "train">, livery: MtrLivery): MtrCar => (livery !== "disneyland" ? unit : unit === "aCar" ? "pCar" : "qCar");
/** The urban paint (and numbers) a livery stands for; the Disneyland cars carry their own. */
const urban = (livery: MtrLivery): "refurbished" | "retro" => (livery === "retro" ? "retro" : "refurbished");

/** The running numbers of the A164 set (assets/mtr-m-train/SOURCES.md), front to rear. */
export const MTR_SET_NUMBERS = ["A169", "C169", "D602", "B456", "C456", "D619", "C164", "A164"];
/** The Disneyland train's numbers for `n` cars: P503 ahead, P504 at the rear, the Q cars from Q503 on (four: the set P503-Q503+Q504-P504). */
export const mtrDrlNumbers = (n: number): string[] => ["P503", ...Array.from({ length: n - 2 }, (_, i) => `Q${503 + i}`), "P504"];
const LONE_NUMBER: Record<"refurbished" | "retro", Record<MtrCar, string>> = {
  refurbished: { aCar: "A164", bCar: "B456", cCar: "C169", dCar: "D602", pCar: "P503", qCar: "Q503" },
  retro: { aCar: "A161", bCar: "B442", cCar: "C161", dCar: "D601", pCar: "P503", qCar: "Q503" },
};

// --- paint schemes ------------------------------------------------------------------------------

export interface Scheme {
  palette: Record<string, MaterialSpec>;
  /** The cab face's red bands (bottom, top). */
  bands: Array<[number, number]>;
}

const c = (color: string, roughness = 0.4, metallic?: number): MaterialSpec => ({ color, roughness, ...(metallic !== undefined ? { metallic } : {}) });

export const MTR_SCHEMES: Record<"refurbished" | "retro" | "disney", Scheme> = {
  // the refurbished trains: brushed aluminium, the black glass-fibre mask and emergency door, the red band
  refurbished: {
    palette: { body: c("#e8eaec", 0.35, 0.2), mask: c("#26282b", 0.35), door: c("#1d1f22", 0.35), roof: c("#968a80", 0.8) },
    bands: [[1.72, 1.9]],
  },
  // the 1979 trains: unpainted aluminium sides, the front finished to match them (the same colour seen from the
  // front as from the side), a wide red stripe and a thin one under it
  retro: {
    palette: { body: c("#eceeef", 0.35, 0.2), mask: c("#eceeef", 0.35, 0.2), door: c("#e2e4e6", 0.35, 0.2), roof: c("#968a80", 0.8) },
    bands: [[1.36, 1.42], [1.5, 1.74]],
  },
  // the Disneyland Resort Line: white body, navy roof and front, its yellow edge, the red "smile" band
  disney: {
    palette: { body: c("#f1f0ea", 0.4), mask: c("#2c3a8f", 0.35), door: c("#25317a", 0.35), roof: c("#28306b", 0.7), yellow: c("#f2b51c", 0.4) },
    bands: [[1.72, 1.86]],
  },
};
const schemeOf = (car: MtrCar, livery: MtrLivery): Scheme => MTR_SCHEMES[isDisney(car) ? "disney" : urban(livery)];
const paletteOf = (s: Scheme) => ({ ...PALETTE, ...MTR_SCHEMES.disney.palette, ...s.palette });

const PALETTE: Record<string, MaterialSpec> = {
  glass: { ...c("#27323d", 0.12, 0.2), glass: true },
  cabGlass: { ...c("#1d252e", 0.1, 0.25), glass: true },
  frame: c("#8e9398", 0.35, 0.5),
  rubber: c("#1c1c1e", 0.9),
  seam: c("#151517", 0.9),
  red: c("#d1202f", 0.4),
  mickey: c("#c8283a", 0.4),
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

/** A front's plan corners (rounded to the full width this far back) and its crown curving down to the face's top. */
const FRONTS: Record<MtrFront, { corner: number; crown: Pt[] }> = {
  refurbished: { corner: 0.32, crown: [[0, 3.42], [0.06, 3.52], [0.14, 3.6], [0.3, 3.67], [0.6, MTR_HEIGHT]] },
  // the boxy 1979 front: tight corners, a near-square top
  original: { corner: 0.12, crown: [[0, 3.56], [0.05, 3.62], [0.14, 3.67], [0.3, MTR_HEIGHT]] },
  // the Disneyland front: rounder corners, the top curving further back
  disney: { corner: 0.38, crown: [[0, 3.38], [0.08, 3.5], [0.2, 3.6], [0.4, 3.67], [0.7, MTR_HEIGHT]] },
};
const faceTop = (f: MtrFront) => FRONTS[f].crown[0]![1];

function profile(car: MtrCar, front: MtrFront): SliceBody {
  const L = bodyLength(car);
  const cab = isCab(car);
  const { corner, crown } = FRONTS[front];
  const w = (d: number) => (cab && d < corner ? W - corner + Math.sqrt(Math.max(0, corner ** 2 - (corner - d) ** 2)) : W);
  const plan = Array.from({ length: 7 }, (_, i) => (corner * i) / 6);
  const keys = cab ? [...new Set([...plan, ...crown.map(([d]) => d), L])].sort((a, b) => a - b) : [0, L];
  return {
    length: L,
    B: () => BOTTOM,
    wl: (d) => Math.min(1.36, w(d) - 0.17),
    A: () => 1.02,
    wa: (d) => Math.min(1.47, w(d) - 0.06),
    Y: () => BELLY,
    w,
    S: () => SHOULDER,
    C: (d) => (cab ? lerp(crown, d) : MTR_HEIGHT),
    edges: () => [],
    lean: LEAN,
    arc: ARC,
    stations: keys,
  };
}

/** The paint of edge k of a slice (0 the bottom, 1 the lower edge, 2 the lower body, 3 the side, then the arc). */
const edgeMat = (k: number): string => (k === 0 ? "under" : k <= 3 ? "body" : "roof");

// --- the cars -------------------------------------------------------------------------------

/** A Disneyland window: the Mickey head's centre (d) on the side. */
interface Layout {
  /** Door spans (d0, d1). */
  doors: Array<[number, number]>;
  /** Window spans between the doors (and the cab's side window). */
  windows: Array<[number, number]>;
  /** The Disneyland cars' Mickey-head windows, their centres. */
  mickeys: number[];
  /** The 1979 front's cab door behind the corner (d0, d1). */
  cabDoor?: [number, number];
}

const MICKEY = { y: 2.3, r: 0.34, ear: 0.16, earDx: 0.31, earDy: 0.38 };

/**
 * The side layouts. An urban car: five doors 4.5 m apart, the last 2.0 m from the
 * inner end, a window midway between two doors, a cab car's side window behind
 * the corner (on the 1979 front its cab door instead). A Disneyland car: three
 * doors, the last 3.75 m from the inner end, as many Mickey-head windows between
 * them as fit at 1.45 m.
 */
export function mtrLayout(car: MtrCar, front: MtrFront = "refurbished"): Layout {
  const L = bodyLength(car);
  if (isDisney(car)) {
    const first = isCab(car) ? 3.6 : 3.75;
    const pitch = (L - 3.75 - first) / 2;
    const centres = [0, 1, 2].map((i) => first + i * pitch);
    const doors = centres.map((x): [number, number] => [x - DOOR_W / 2, x + DOOR_W / 2]);
    // the bays between and beyond the doors, each filled with heads at 1.45 m
    const bays: Array<[number, number]> = [[isCab(car) ? 1.7 : 0.25, doors[0]![0]], [doors[0]![1], doors[1]![0]], [doors[1]![1], doors[2]![0]], [doors[2]![1], L - 0.25]];
    const mickeys = bays.flatMap(([a, b]) => {
      const n = Math.floor((b - a - 0.3) / 1.45);
      return Array.from({ length: Math.max(0, n) }, (_, i) => (a + b) / 2 + (i - (n - 1) / 2) * 1.45);
    });
    return { doors, windows: isCab(car) ? [[0.62, 1.4]] : [], mickeys };
  }
  const centres = Array.from({ length: 5 }, (_, i) => L - 2.0 - (4 - i) * DOOR_PITCH);
  const doors = centres.map((x): [number, number] => [x - DOOR_W / 2, x + DOOR_W / 2]);
  const windows = centres.slice(0, -1).map((x): [number, number] => [x + DOOR_PITCH / 2 - 0.8, x + DOOR_PITCH / 2 + 0.8]);
  if (isCab(car) && front === "original") return { doors, windows, mickeys: [], cabDoor: [0.3, 1.0] };
  if (isCab(car)) windows.unshift([0.62, 1.55]);
  return { doors, windows, mickeys: [] };
}

/** A window: its frame, the glass, and its upper hopper's bar. */
function sideWindow(m: MeshBuilder, p: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, hopper: boolean): void {
  m.scope("frame", () => sidePanel(m, p, X, s, "frame", d0, d1, WIN[0], WIN[1], 0.006, 0.03));
  m.scope("glass", () => sidePanel(m, p, X, s, "glass", d0 + 0.05, d1 - 0.05, WIN[0] + 0.05, WIN[1] - 0.05, 0.011, 0.004));
  if (hopper) m.scope("hopper", () => sidePanel(m, p, X, s, "frame", d0 + 0.05, d1 - 0.05, 2.5, 2.54, 0.015, 0.004));
}

/** A disc's triangles in (d, y), `n` sides. */
const discTris = (cd: number, cy: number, r: number, n = 18): Pt[] =>
  Array.from({ length: n }, (_, i): Pt[] => {
    const [a, b] = [(2 * Math.PI * i) / n, (2 * Math.PI * (i + 1)) / n];
    return [[cd, cy], [cd + r * Math.cos(a), cy + r * Math.sin(a)], [cd + r * Math.cos(b), cy + r * Math.sin(b)]];
  }).flat();
/** An ellipse's triangles in (d, y). */
const ellipseTris = (cd: number, cy: number, rd: number, ry: number, n = 18): Pt[] =>
  discTris(0, 0, 1, n).map(([u, v]): Pt => [cd + u * rd, cy + v * ry]);

/** A Mickey-head window at d: the red rim behind, the head's glass, the ears' glass over it (each a plane of its own). */
function mickeyWindow(m: MeshBuilder, p: SliceBody, X: (d: number) => number, s: number, d: number): void {
  const { y, r, ear, earDx, earDy } = MICKEY;
  m.scope("rim", () => {
    sideDecal(m, p, X, s, "mickey", discTris(d, y, r + 0.035, 20), 0.004);
    for (const e of [-1, 1]) sideDecal(m, p, X, s, "mickey", discTris(d + e * earDx, y + earDy, ear + 0.035, 12), 0.006);
  });
  m.scope("glass", () => {
    sideDecal(m, p, X, s, "glass", discTris(d, y, r, 20), 0.008);
    for (const e of [-1, 1]) sideDecal(m, p, X, s, "glass", discTris(d + e * earDx, y + earDy, ear, 12), 0.01);
  });
}

/**
 * A double-leaf sliding door: the dark outline round the doorway cut through the
 * shell, and two leaves in the body's paint, each with its tall window (oval on a
 * Disneyland car), that step out a little and slide apart along the side (doors.ts).
 */
function sideDoor(m: MeshBuilder, p: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, oval: boolean): void {
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
        mm.scope("glass", () =>
          oval
            ? sideDecal(mm, p, X, s, "glass", ellipseTris((la + lb) / 2, 2.42, 0.2, 0.42), 0.013)
            : sidePanel(mm, p, X, s, "glass", la + 0.13, lb - 0.13, LEAF_WIN[0], LEAF_WIN[1], 0.013, 0.004),
        );
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

/**
 * A rectangle (z0..z1, y0..y1) with its corners rounded by r (`round`: which
 * corners - low z bottom, high z bottom, high z top, low z top); r may give each
 * corner its own radius in that order.
 */
function roundRect(z0: number, z1: number, y0: number, y1: number, r: number | [number, number, number, number], round = [true, true, true, true]): Pt[] {
  const out: Pt[] = [];
  const rs = typeof r === "number" ? [r, r, r, r] : r;
  const corners: Array<[number, number, number, number]> = [[z0 + rs[0], y0 + rs[0], Math.PI, rs[0]], [z1 - rs[1], y0 + rs[1], 1.5 * Math.PI, rs[1]], [z1 - rs[2], y1 - rs[2], 0, rs[2]], [z0 + rs[3], y1 - rs[3], 0.5 * Math.PI, rs[3]]];
  const sharp: Pt[] = [[z0, y0], [z1, y0], [z1, y1], [z0, y1]];
  corners.forEach(([cz, cy, a0, r], i) => {
    if (!round[i] || r <= 0) {
      out.push(sharp[i]!);
      return;
    }
    for (let k = 0; k <= 4; k++) {
      const a = a0 + (k / 4) * (Math.PI / 2);
      out.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  });
  // wound so that the face points +X
  return out.reverse();
}

const circle = (cz: number, cy: number, r: number, n = 12): Pt[] => Array.from({ length: n }, (_, i): Pt => [cz + r * Math.cos((-2 * Math.PI * i) / n), cy + r * Math.sin((-2 * Math.PI * i) / n)]);

/** The MTR roundel at (0, yc): the white disc, the red one, the mark's upright and bar. */
function roundel(m: MeshBuilder, xf: number, yc: number, proud: number): void {
  facePanel(m, xf, "white", circle(0, yc, 0.08, 16), proud, 0.003);
  facePanel(m, xf, "red", circle(0, yc, 0.062, 16), proud + 0.003, 0.003);
  facePanel(m, xf, "white", roundRect(-0.009, 0.009, yc - 0.05, yc + 0.05, 0.004), proud + 0.006, 0.002);
  facePanel(m, xf, "white", roundRect(-0.045, 0.045, yc - 0.008, yc + 0.008, 0.004), proud + 0.006, 0.002);
}

/** The bumper's head and tail lamps in their recesses and the anticlimber strip, every front. */
function bumper(m: MeshBuilder, xf: number, round: boolean): void {
  m.scope("bumper lamps", () => {
    // the Disneyland front: round headlamps in chrome rings near the corners, a small round tail lamp inboard
    if (round)
      for (const s of [1, -1]) {
        facePanel(m, xf, "frame", circle(s * 0.82, 1.14, 0.105, 16), 0.006, 0.02);
        facePanel(m, xf, "lampGlass", circle(s * 0.82, 1.14, 0.08, 16), 0.011, 0.004);
        facePanel(m, xf, "rubber", circle(s * 0.6, 1.14, 0.055, 12), 0.006, 0.02);
        facePanel(m, xf, "lampRed", circle(s * 0.6, 1.14, 0.04, 12), 0.011, 0.004);
      }
    else
    for (const s of [1, -1]) {
      const [z0, z1] = s > 0 ? [0.58, 1.0] : [-1.0, -0.58];
      facePanel(m, xf, "rubber", roundRect(z0, z1, 1.04, 1.22, 0.03), 0.006, 0.02);
      const [h0, h1] = s > 0 ? [0.64, 0.77] : [-0.77, -0.64];
      const [t0, t1] = s > 0 ? [0.83, 0.95] : [-0.95, -0.83];
      facePanel(m, xf, "lampGlass", roundRect(h0, h1, 1.07, 1.19, 0.01), 0.011, 0.004);
      facePanel(m, xf, "lampRed", roundRect(t0, t1, 1.08, 1.18, 0.01), 0.011, 0.004);
    }
  });
  m.scope("anticlimber", () => facePanel(m, xf, "rubber", roundRect(-1.0, 1.0, 1.26, 1.3, 0.01), 0.006, 0.03));
}

/** A windscreen pair either side of the centre door: rubber surround, the glass, a destination display in its top. */
function windscreens(m: MeshBuilder, xf: number, zIn: number, zOut: number, frame: string, r: number, display: boolean): void {
  m.scope("windscreens", () => {
    for (const s of [1, -1]) {
      const [z0, z1] = s > 0 ? [zIn, zOut] : [-zOut, -zIn];
      facePanel(m, xf, frame, roundRect(z0, z1, 1.98, 2.98, r), 0.009, 0.02);
      facePanel(m, xf, "cabGlass", roundRect(z0 + 0.03, z1 - 0.03, 2.01, display ? 2.77 : 2.95, r * 0.75), 0.014, 0.004);
      if (display) facePanel(m, xf, "display", roundRect(z0 + 0.05, z1 - 0.05, 2.8, 2.95, 0.01), 0.014, 0.004);
    }
  });
}

/**
 * A cab car's face, by front:
 * - refurbished: the black mask with the two windscreens and their displays, the
 *   black emergency door between them, the red band with the roundel, the
 *   silver header's two small lamps and round lamp;
 * - original (1979): the face in the sides' silver, the two narrow windscreens with
 *   their displays, the wide door between them, the wide and the thin red stripe
 *   across it, the round lamp over the door;
 * - disney: the navy front edged in yellow, the windscreens and the centre door's
 *   own window, the red "smile" band with the roundel.
 * Every front has the bumper's lamps and the anticlimber.
 */
function drawCabFace(m: MeshBuilder, S: Scheme, xf: number, front: MtrFront): void {
  if (front === "refurbished") {
    m.scope("mask", () => facePanel(m, xf, "mask", roundRect(-1.13, 1.13, 1.58, 3.1, 0.2, [true, true, false, false]), 0.004, 0.02));
    m.scope("emergency door", () => facePanel(m, xf, "door", roundRect(-0.47, 0.47, 1.36, 3.085, 0.02), 0.009, 0.02));
    windscreens(m, xf, 0.6, 1.05, "rubber", 0.04, true);
    m.scope("header lamps", () => {
      for (const z of [-0.3, 0.3]) facePanel(m, xf, "rubber", roundRect(z - 0.12, z + 0.12, 3.15, 3.33, 0.02), 0.006, 0.02);
      for (const z of [-0.3, 0.3]) facePanel(m, xf, "lampGlass", roundRect(z - 0.09, z + 0.09, 3.18, 3.3, 0.015), 0.011, 0.004);
      facePanel(m, xf, "frame", circle(0, 3.24, 0.07), 0.006, 0.02);
      facePanel(m, xf, "lampGlass", circle(0, 3.24, 0.05), 0.011, 0.004);
    });
  } else if (front === "original") {
    m.scope("face", () => facePanel(m, xf, "mask", roundRect(-1.3, 1.3, 1.03, 3.22, 0.1), 0.003, 0.02));
    m.scope("emergency door", () => {
      facePanel(m, xf, "seam", roundRect(-0.56, 0.56, 1.3, 3.17, 0.08), 0.006, 0.02);
      facePanel(m, xf, "door", roundRect(-0.54, 0.54, 1.32, 3.15, 0.07), 0.009, 0.02);
    });
    windscreens(m, xf, 0.7, 1.12, "frame", 0.09, true);
    m.scope("header lamp", () => {
      facePanel(m, xf, "rubber", circle(0, 3.38, 0.075), 0.004, 0.02);
      facePanel(m, xf, "lampGlass", circle(0, 3.38, 0.055), 0.009, 0.004);
    });
  } else {
    m.scope("mask", () => {
      facePanel(m, xf, "yellow", roundRect(-1.12, 1.12, 1.48, 3.26, 0.42, [true, true, false, false]), 0.003, 0.02);
      facePanel(m, xf, "mask", roundRect(-1.04, 1.04, 1.58, 3.24, 0.36, [true, true, false, false]), 0.006, 0.02);
    });
    m.scope("emergency door", () => {
      facePanel(m, xf, "door", roundRect(-0.5, 0.5, 1.62, 3.18, 0.04), 0.009, 0.02);
      // the centre door's large window
      facePanel(m, xf, "rubber", roundRect(-0.41, 0.41, 1.92, 3.06, 0.07), 0.012, 0.004);
      facePanel(m, xf, "cabGlass", roundRect(-0.38, 0.38, 1.95, 3.03, 0.055), 0.015, 0.004);
    });
    // the large side windscreens, rounded where they follow the mask's outer edge
    m.scope("windscreens", () => {
      for (const s of [1, -1]) {
        const [z0, z1] = s > 0 ? [0.56, 1.0] : [-1.0, -0.56];
        const outer = (r: number, k: number): [number, number, number, number] => (s > 0 ? [k, r, r * 0.8, k] : [r, k, k, r * 0.8]);
        facePanel(m, xf, "rubber", roundRect(z0, z1, 1.88, 3.1, outer(0.26, 0.05)), 0.009, 0.02);
        facePanel(m, xf, "cabGlass", roundRect(z0 + 0.03, z1 - 0.03, 1.91, 3.07, outer(0.23, 0.035)), 0.014, 0.004);
      }
    });
  }
  m.scope("bands", () => {
    // the Disneyland band: a short "smile" on the mask; the others across the face
    // the 1979 stripes run to the face's very edge, where their wrap round the corners takes over at the same offset (STRIPE_PROUD)
    const z = front === "disney" ? 0.9 : front === "original" ? W - FRONTS.original.corner : 1.08;
    const proud = front === "original" ? STRIPE_PROUD : 0.017;
    for (const [y0, y1] of S.bands) facePanel(m, xf, "red", roundRect(-z, z, y0, y1, front === "original" ? 0 : Math.min(0.08, (y1 - y0) / 2 - 0.001)), proud, 0.004);
  });
  if (front !== "original") {
    const [y0, y1] = S.bands[S.bands.length - 1]!;
    m.scope("roundel", () => roundel(m, xf, (y0 + y1) / 2, 0.021));
  }
  bumper(m, xf, front === "disney");
}

/** How far the 1979 stripes stand off the face and the corner: one offset, so the face's stripe meets its wrap. */
const STRIPE_PROUD = 0.012;

/**
 * The 1979 front's red stripes wrapping round the corners onto the sides, to the
 * cab door: strips laid STRIPE_PROUD off the corner's quarter circle in plan
 * (starting where the face's stripe ends, at the face's edge), then along the side.
 */
function stripeWrap(m: MeshBuilder, S: Scheme, X: (d: number) => number, s: number, to: number): void {
  const r = FRONTS.original.corner;
  const e = Math.sign(X(0) - X(1));
  // the side's lean: the slice's half width at y is w(d) times this
  const f = (y: number) => 1 - ((1 - LEAN) * (y - BELLY)) / (SHOULDER - BELLY);
  // stations: the corner's arc in angle (0 facing ahead), then the flat side to `to`
  const at = (k: number): { d: number; w: number; n: [number, number] } => {
    if (k <= 6) {
      const th = (k / 6) * (Math.PI / 2);
      return { d: r * (1 - Math.cos(th)), w: W - r + r * Math.sin(th), n: [Math.cos(th), Math.sin(th)] };
    }
    return { d: to, w: W, n: [0, 1] };
  };
  for (const [y0, y1] of S.bands)
    for (let k = 0; k < 7; k++) {
      const [a, b] = [at(k), at(k + 1)];
      const P = (q: typeof a, y: number): Vec3 => [X(q.d) + e * q.n[0] * STRIPE_PROUD, y, s * (q.w * f(y) + q.n[1] * STRIPE_PROUD)];
      const nx = (a.n[0] + b.n[0]) / 2, nz = (a.n[1] + b.n[1]) / 2;
      m.facets("red", [P(a, y0), P(b, y0), P(b, y1), P(a, y0), P(b, y1), P(a, y1)], [e * nx, 0, s * nz]);
    }
}

/** The Disneyland cab car's navy and yellow sweep along the lower side behind the front. */
function disneySweep(m: MeshBuilder, p: SliceBody, X: (d: number) => number, s: number): void {
  const len = 2.8;
  const strip = (mat: string, bottom: (t: number) => number, top: (t: number) => number, proud: number) => {
    const tris: Pt[] = [];
    const n = 8;
    for (let i = 0; i < n; i++) {
      const [ta, tb] = [i / n, (i + 1) / n];
      const [da, db] = [0.4 + len * ta, 0.4 + len * tb];
      tris.push([da, bottom(ta)], [db, bottom(tb)], [db, top(tb)], [da, bottom(ta)], [db, top(tb)], [da, top(ta)]);
    }
    sideDecal(m, p, X, s, mat, tris, proud);
  };
  // the yellow line over the navy, both tapering to a point behind the front
  strip("yellow", (t) => 1.3 + 0.12 * t, (t) => 1.58 - 0.13 * t, 0.004);
  strip("mask", (t) => 1.3 + 0.12 * t, (t) => 1.52 - 0.09 * t, 0.006);
  // the corner ahead of it: the sweep's start round the front's curve
  sidePane(m, p, X, s, "mask", [0, 0.4], [1.3, 1.52], 0.006, 4, 1);
  sidePane(m, p, X, s, "yellow", [0, 0.4], [1.52, 1.58], 0.006, 4, 1);
}

/**
 * A running number on the side (sideLettering). The shared stroke font has no Q
 * (and gains none: it is bundled into every lettered model), so a Disneyland Q
 * car's number is drawn as an O with the Q's tail laid over it here.
 */
function runningNumber(m: MeshBuilder, p: SliceBody, X: (d: number) => number, s: number, text: string, d: number, y: number, h: number): void {
  const q = text.startsWith("Q");
  const shown = q ? `O${text.slice(1)}` : text;
  sideLettering(m, p, X, s, shown, d, y, h, "lettering");
  if (!q) return;
  // the first glyph's cell as sideLettering lays it: its foot at y, from u0 along the reading direction
  const [w, gap, t] = [h * 0.58, h * 0.18, h * 0.13];
  const u0 = -strokeWidth(shown, w, gap) / 2;
  const dir = Math.sign(X(0) - X(1));
  const at = (cx: number, cy: number): Pt => [d - dir * s * (u0 + cx * w), y + cy * h];
  const [a, b] = [at(0.55, 0.25), at(0.92, -0.05)];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [nx, ny] = [(-(b[1] - a[1]) / len) * (t / 2), ((b[0] - a[0]) / len) * (t / 2)];
  const quad: Pt[] = [[a[0] + nx, a[1] + ny], [a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [a[0] + nx, a[1] + ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny]];
  sideDecal(m, p, X, s, "lettering", quad, 0.0045);
}

/** A low air-conditioning unit on the crown at d. */
function aircon(m: MeshBuilder, X: (d: number) => number, d: number): void {
  const [a, b] = [X(d + 1.2), X(d - 1.2)].sort((p, q) => p - q) as [number, number];
  block(m, "aircon", a, b, MTR_HEIGHT - 0.1, MTR_HEIGHT + 0.14, -0.78, 0.78);
  // the grille's darker lid
  block(m, "equipment", a + 0.3, b - 0.3, MTR_HEIGHT + 0.14, MTR_HEIGHT + 0.16, -0.55, 0.55);
}

/** A pantograph car's pantograph near its +X end; the raised collector reaches the game's contact wire, not the MTR's own line. */
const PANTOGRAPH_D = 3.2;
export const MTR_WIRE = RAIL_COLLECTOR_TOP;

function drawCar(coach: Coach, S: Scheme, car: MtrCar, front: MtrFront, X: (d: number) => number, gangway: boolean, number: string): void {
  const m = coach.m;
  const cab = isCab(car);
  const disney = isDisney(car);
  const p = profile(car, front);
  const lay = mtrLayout(car, front);
  // the doors' leaf boxes, the doorways into the car's cabin (doors.ts)
  const leaves: SliceDoorway[] = [1, -1].flatMap((s) => lay.doors.map(([a, b]) => ({ s, d0: a + SEAM, d1: b - SEAM, y0: DOOR_Y[0], y1: DOOR_Y[1] - SEAM })));
  m.scope("body", () => {
    m.scope("shell", () => {
      const cut = leaves.map((o) => ({ ...o, d0: o.d0 - 0.002, d1: o.d1 + 0.002, y0: o.y0 - 0.002, y1: o.y1 + 0.002 }));
      drawShell(m, p, X, (_d, k) => edgeMat(k), (d) => [[p.B(d), SHOULDER, "body"], [SHOULDER, p.C(d), "roof"]], { front: true, rear: true }, cut);
    });
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("doors", () => lay.doors.forEach(([a, b], i) => m.scope(`door ${i + 1}`, () => sideDoor(m, p, X, s, a, b, disney))));
        if (lay.windows.length) m.scope("windows", () => lay.windows.forEach(([a, b], i) => m.scope(`window ${i + 1}`, () => sideWindow(m, p, X, s, a, b, !disney && !(cab && i === 0 && !lay.cabDoor)))));
        if (lay.mickeys.length) m.scope("mickey windows", () => lay.mickeys.forEach((d, i) => m.scope(`window ${i + 1}`, () => mickeyWindow(m, p, X, s, d))));
        if (lay.cabDoor)
          m.scope("cab door", () => {
            const [a, b] = lay.cabDoor!;
            sidePanel(m, p, X, s, "seam", a, b, 1.16, 3.0, 0.004, 0.02);
            sidePanel(m, p, X, s, "body", a + 0.02, b - 0.02, 1.18, 2.98, 0.007, 0.003);
            sidePanel(m, p, X, s, "frame", a + 0.12, b - 0.12, 2.0, 2.72, 0.01, 0.003);
            sidePanel(m, p, X, s, "glass", a + 0.15, b - 0.15, 2.03, 2.69, 0.013, 0.003);
          });
        if (front === "original" && cab) m.scope("stripes", () => stripeWrap(m, S, X, s, 0.28));
        if (disney && cab) m.scope("sweep", () => disneySweep(m, p, X, s));
        // the running number on the body under the windows, between the second and third doors
        m.scope("running number", () => runningNumber(m, p, X, s, number, (lay.doors[1]![1] + lay.doors[2]![0]) / 2, 1.55, 0.1));
        // the rain gutter's rib where the roof starts
        m.scope("gutter", () => sidePanel(m, p, X, s, "frame", cab ? FRONTS[front].corner + 0.05 : 0.02, p.length - 0.02, SHOULDER - 0.05, SHOULDER - 0.02, 0.006, 0.02));
      });
    const panes = [1, -1].flatMap((s) => [
      ...lay.windows.map(([a, b]) => ({ s, d0: a + 0.05, d1: b - 0.05, y0: WIN[0] + 0.05, y1: WIN[1] - 0.05 })),
      ...lay.mickeys.map((d) => ({ s, d0: d - MICKEY.r, d1: d + MICKEY.r, y0: MICKEY.y - MICKEY.r, y1: MICKEY.y + MICKEY.r })),
    ]);
    sliceCabin(m, p, X, cab ? 1.65 : 0, p.length, leaves, panes);
  });
  if (cab) {
    m.scope("cab end", () => drawCabFace(m, S, X(0), front));
    m.scope("front coupler", () => centreCoupler(m, 1, X(0.9), X(-MTR_FRONT_COUPLER), COUPLER_Y));
  } else m.scope("front end", () => innerEnd(m, X, 1, 0, gangway));
  m.scope("rear end", () => innerEnd(m, X, -1, p.length, gangway));
  m.scope("roof equipment", () => {
    const units = hasPantograph(car) ? [p.length - 5.5, p.length / 2 - 1.0] : [5.5, p.length - 5.5];
    m.scope("air conditioning", () => units.forEach((d, i) => m.scope(`unit ${i + 1}`, () => aircon(m, X, d))));
    if (hasPantograph(car))
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

// --- the trains -----------------------------------------------------------------------------

export interface MtrSlot {
  car: MtrCar;
  number: string;
  lo: number;
  hi: number;
  turned: boolean;
}

/**
 * The urban train's formations, front first: the 8-car formation A-C+D+B-C+D+C-A
 * shortened from its middle - the two A cars at the ends, a C car (the
 * pantograph) behind the leading A and ahead of the trailing one.
 */
export const MTR_FORMATIONS: Record<number, MtrCar[]> = {
  3: ["aCar", "cCar", "aCar"],
  4: ["aCar", "cCar", "cCar", "aCar"],
  5: ["aCar", "cCar", "dCar", "cCar", "aCar"],
  6: ["aCar", "cCar", "dCar", "bCar", "cCar", "aCar"],
  7: ["aCar", "cCar", "dCar", "bCar", "cCar", "cCar", "aCar"],
  8: ["aCar", "cCar", "dCar", "bCar", "cCar", "dCar", "cCar", "aCar"],
};
/** The Disneyland Resort Line's train of `n` (3 .. 8) cars: a P cab car at each end, Q cars between (four: P-Q+Q-P, as it ran). */
export const mtrDrlFormation = (n: number): MtrCar[] => ["pCar", ...Array<MtrCar>(n - 2).fill("qCar"), "pCar"];

/** Cars front to back with their numbers and spans lo..hi over the coupling planes, the train centred on x = 0, the last one turned. */
function lay(cars: MtrCar[], numbers: string[]): MtrSlot[] {
  const total = cars.reduce((t, car) => t + mtrLength(car), 0);
  let hi = total / 2;
  return cars.map((car, i) => {
    const lo = hi - mtrLength(car);
    const out = { car, number: numbers[i]!, lo, hi, turned: i === cars.length - 1 };
    hi = lo;
    return out;
  });
}

/** The urban train of `n` (3 .. 8) cars, each car's running number from the A164 set (its cars of each letter in order). */
export function mtrTrain(n: number): MtrSlot[] {
  const cars = MTR_FORMATIONS[n]!;
  const used: Record<string, number> = {};
  const numbers = cars.map((car, i) => {
    const letter = car[0]!.toUpperCase();
    if (car === "aCar") return i === 0 ? "A169" : "A164";
    const list = MTR_SET_NUMBERS.filter((x) => x.startsWith(letter));
    const k = used[letter] ?? 0;
    used[letter] = k + 1;
    return list[k] ?? `${letter}${Number(list[list.length - 1]!.slice(1)) + k}`;
  });
  return lay(cars, numbers);
}

/** The Disneyland line's train of `n` cars (default four: P503-Q503+Q504-P504). */
export const mtrDrlTrain = (n = 4): MtrSlot[] => lay(mtrDrlFormation(n), mtrDrlNumbers(n));

/** The bellows' cross-section between two cars (z, y). */
const BELLOWS: Array<[number, number]> = [[-0.8, 1.02], [0.8, 1.02], [0.8, 3.2], [0.7, 3.3], [-0.7, 3.3], [-0.8, 3.2]];
const MAX_BEND_DEG = 10;

function train(slots: MtrSlot[], livery: MtrLivery): MeshBuilder {
  const coach = new Coach(paletteOf(schemeOf(slots[0]!.car, livery)), 0);
  const m = coach.m;
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = mtrLength(slot.car);
    const X = (d: number) => cx + len / 2 - frontOffset(slot.car) - d;
    const number = livery === "retro" && slot.car === "aCar" ? (k === 0 ? "A162" : "A161") : slot.number;
    const draw = () => drawCar(coach, schemeOf(slot.car, livery), slot.car, mtrFront(slot.car, livery), X, false, number);
    return {
      // a cab car's face is its own coupling plane's side; an inner end 0.25 m inside the plane
      x0: slot.lo + MTR_GAP,
      x1: slot.hi - (k === 0 ? 0 : MTR_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => (slot.turned ? m.turned(cx, draw) : draw())),
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND_DEG, slots.slice(0, -1).map((slot) => slot.lo));
  return m;
}

/** A train's `cars` cars: the Disneyland line's P-Q..Q-P, or the urban formation. */
const slotsOf = (livery: MtrLivery, cars: number): MtrSlot[] => (livery === "disneyland" ? mtrDrlTrain(cars) : mtrTrain(cars));

export function mtrMTrain(params?: ParamValues): MeshBuilder {
  const p = resolveOfferedParams(MTR_PARAMS, params);
  const livery = p.livery as MtrLivery;
  const unit = p.unit as MtrUnit;
  if (unit === "train") return train(slotsOf(livery, Number(p.cars)), livery);
  const car = mtrCarOf(unit, livery);
  const S = schemeOf(car, livery);
  const coach = new Coach(paletteOf(S), 0);
  const len = mtrLength(car);
  drawCar(coach, S, car, mtrFront(car, livery), (d) => len / 2 - frontOffset(car) - d, true, LONE_NUMBER[urban(livery)][car]);
  return coach.m;
}

// --- distant view ---------------------------------------------------------------------------

/** The distant model's budget: 100 triangles a car, 300 at most. */
export const MTR_LOD = 300;

function carLod(car: MtrCar, front: MtrFront, X: (d: number) => number, cx: number, turned: boolean, section: number | undefined, inside: { front: boolean; rear: boolean }): { body: UnitBody; parts: LodPart[] } {
  const cab = isCab(car);
  const T = (x: number) => (turned ? 2 * cx - x : x);
  const L = bodyLength(car);
  const sideBands: LodBand[] = [[BOTTOM, SHOULDER, "body"], [SHOULDER, MTR_HEIGHT, "roof"]];
  const hw: Array<readonly [number, number]> = [[BOTTOM, 1.36], [1.02, 1.47], [BELLY, W], [SHOULDER, W * LEAN], [3.55, 1.05], [MTR_HEIGHT, 0.3]];
  const flat = (d: number, hidden: boolean) => ({ tip: [[BOTTOM, X(d)]] as Array<readonly [number, number]>, ...(hidden ? { hidden: true } : {}) });
  const lay = mtrLayout(car, front);
  const boxes = [
    ...lay.windows.map(([a, b]) => ({ x0: X(b), x1: X(a), y0: WIN[0], y1: WIN[1] })),
    ...lay.mickeys.map((d) => ({ x0: X(d + MICKEY.r), x1: X(d - MICKEY.r), y0: MICKEY.y - MICKEY.r, y1: MICKEY.y + MICKEY.r })),
  ];
  const { corner } = FRONTS[front];
  const facePaint: LodBand[] =
    front === "original" ? [[BOTTOM, MTR_HEIGHT, "mask"]] : front === "disney" ? [[BOTTOM, 1.5, "body"], [1.5, MTR_HEIGHT, "mask"]] : [[BOTTOM, 1.58, "body"], [1.58, 3.1, "mask"], [3.1, MTR_HEIGHT, "body"]];
  let body: UnitBody = {
    y0: BOTTOM,
    hw,
    side: sideBands,
    roof: "roof",
    front: cab
      ? {
          tip: [[BOTTOM, X(0)], [faceTop(front), X(0)], [MTR_HEIGHT, X(0.6)]],
          setback: [[BOTTOM, corner], [MTR_HEIGHT, corner]],
          paint: facePaint,
          windows: [{ u: [-1.05, -0.6], y: [1.98, 2.95], mat: LOD_GLASS }, { u: [0.6, 1.05], y: [1.98, 2.95], mat: LOD_GLASS }],
        }
      : flat(0, inside.front),
    rear: flat(L, inside.rear),
    ...(boxes.length ? { windows: sideGlass(boxes, 0.6) } : {}),
    ...(section !== undefined ? { section } : {}),
  };
  if (turned) body = turnBody(body, cx);
  const bogies = mtrBogies(car).map((d) => [T(X(d)), MTR_WHEELBASE / 2 + WHEEL_R + 0.2, ...(section !== undefined ? [section] : [])] as const);
  const parts: LodPart[] = [
    ...bogieParts(bogies as unknown as ReadonlyArray<readonly [number, number, number?]>, BOTTOM).map((part) => (!cab && section !== undefined ? { ...part, optional: 5 } : part)),
    ...(hasPantograph(car) ? [{ ...roofPart("pantograph", T(X(PANTOGRAPH_D)) - 0.8, T(X(PANTOGRAPH_D)) + 0.8, 0.5, 0.5, MTR_HEIGHT, MTR_WIRE, section), optional: 8 }] : []),
  ];
  return { body, parts };
}

/**
 * The M-Train for distant views (lodUnits.ts): the body's section, the sides and
 * the roof, the windows; a cab car's flat face with its rounded corners, its
 * front's paint and the windscreens; the bogies, a pantograph car's pantograph as
 * a block. A train keeps the full model's sections, 100 triangles a car, 300 at most.
 */
export function mtrMTrainLod(params?: ParamValues): MeshBuilder {
  const p = resolveOfferedParams(MTR_PARAMS, params);
  const livery = p.livery as MtrLivery;
  const unit = p.unit as MtrUnit;
  if (unit !== "train") {
    const car = mtrCarOf(unit, livery);
    const len = mtrLength(car);
    const { body, parts } = carLod(car, mtrFront(car, livery), (d) => len / 2 - frontOffset(car) - d, 0, false, undefined, { front: false, rear: false });
    return fitUnit({ palette: paletteOf(schemeOf(car, livery)), bodies: [body], parts }, 100);
  }
  const slots = slotsOf(livery, Number(p.cars));
  const n = slots.length;
  const built = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const len = mtrLength(slot.car);
    return carLod(slot.car, mtrFront(slot.car, livery), (d) => cx + len / 2 - frontOffset(slot.car) - d, cx, slot.turned, k, slot.turned ? { front: false, rear: k > 0 } : { front: k > 0, rear: k < n - 1 });
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
  return fitUnit({ palette: paletteOf(schemeOf(slots[0]!.car, livery)), bodies: built.map((b) => b.body), parts: built.flatMap((b) => b.parts), sections }, Math.min(MTR_LOD, 100 * n));
}

// --- what the game needs ----------------------------------------------------------------------

/**
 * A, B, C, P and Q cars are motor cars with four 85 kW traction motors (340 kW);
 * D cars are trailers. 80 km/h in service, 1.0 m/s2. The car weights are
 * estimates (the sources publish none): 37 t a cab or pantograph car, 36 t B, 27 t D.
 */
const CAR_WEIGHT: Record<MtrCar, number> = { aCar: 37, bCar: 36, cCar: 37, dCar: 27, pCar: 37, qCar: 37 };
const CAR_POWER: Record<MtrCar, number> = { aCar: 340, bCar: 340, cCar: 340, dCar: 0, pCar: 340, qCar: 340 };
const sum = (cars: MtrCar[], t: Record<MtrCar, number>) => cars.reduce((a, car) => a + t[car], 0);

function mtrGame(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const livery of URBAN_LIVERIES) {
    const base: ParamValues = livery === "refurbished" ? {} : { livery };
    for (const unit of ["bCar", "cCar", "dCar"] as const) variants.push({ params: { ...base, unit }, weight: CAR_WEIGHT[unit], power: CAR_POWER[unit] });
    for (const n of MTR_CARS) {
      const cars = MTR_FORMATIONS[n]!;
      variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" }, weight: sum(cars, CAR_WEIGHT), power: sum(cars, CAR_POWER) });
    }
  }
  // the Disneyland livery's P car is as the A car (the default's figures); its Q car and its train of every length
  variants.push({ params: { unit: "cCar", livery: "disneyland" }, weight: CAR_WEIGHT.qCar, power: CAR_POWER.qCar });
  for (const n of MTR_CARS) {
    const cars = mtrDrlFormation(n);
    variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), unit: "train", livery: "disneyland" }, weight: sum(cars, CAR_WEIGHT), power: sum(cars, CAR_POWER) });
  }
  return { weight: CAR_WEIGHT.aCar, power: CAR_POWER.aCar, maxspeed: 80, accel: 1.0, variants };
}

export const MTR_M_TRAIN_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-mtr-m-train", game: mtrGame(), title: "MTR M-Train", build: mtrMTrain, buildLod: mtrMTrainLod, lodTriangles: MTR_LOD, params: MTR_PARAMS, catalog: EMU_CATALOG, references: "mtr-m-train" },
];
