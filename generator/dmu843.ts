// The CD 843 diesel-electric railcar (Moravskoslezska vagonka Studenka,
// 1995-97) and the cars it runs with: the 943 driving trailer and the 043
// trailer. One design `veh-cd-843` whose `unit` picks the car: the 843 motor car
// with a cab at each end (default), the 943 driving trailer (cab at +X, gangway
// at -X) or the 043 trailer (gangways at both ends); `livery` paints every car in
// vlakosimdb's red and cream (default) or CD's current blue, read from photographs.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/cd-843/native
// (db/train/dmu/cd_843, dmu/843/cd_943 and cd_btn753-043): the 943's detailed
// XML section for all three (its roof raised to the 4.0 m roof line every native
// side view draws), the 843's own 24.1 m body and cab elevation, and windows,
// doors and paint from native pixel boxes, 0.1 m a pixel. vlakosimdb draws the
// 943 and 043 only 19.3 / 19.4 m long; their side layouts are stretched along x
// to the 843's 24.1 m body, which is the real cars' common length (25.2 m over
// the buffers). See docs/models/czech-dmus.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import type { Pt, Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import type { DoorMotion } from "./doors.ts";
import { block } from "./vehicleParts.ts";
import {
  Car, DMU_CATALOG, buffersBoth, cdSideLogo, clipY, endItems, endMarks, enumParam, exhaust, sideEmblem, sideItems, sideNumber, tankX, tractionNumber, underBoxes,
  DMU_PALETTE, type CarFrame, type EndItem, type PxBox, type SideItem,
} from "./dmuKit.ts";
import { lodSideBox } from "./lodKit.ts";
import type { Vec3 } from "./meshCore.ts";
import { bogieParts, dmuBody, fitUnit, roofPart, underPart } from "./lodUnits.ts";

export type Cd843Unit = "motorCar" | "drivingTrailer" | "trailer";
/** The paint of every car: vlakosimdb's red and cream (default) or CD's current blue (the Najbrt scheme). */
export type Cd843Livery = "red" | "cdBlue";

export const CD843_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    drivingTrailer: "Driving trailer",
    trailer: "Trailer",
  }),
  enumParam("livery", "Livery", {
    red: "Red and cream",
    cdBlue: "CD 843 blue",
  }),
];

/** The common body length (m), end wall to end wall: the 843's XML body; 25.2 m over the buffers. */
export const BODY_843 = 24.1;
export const LOB_843 = 25.2;

/** The running numbers: 843 024 and 943 002 are photographed (assets/cd-843/PHOTOS.md); 043 001 is the first of the class. */
export function cd843Number(unit: Cd843Unit, livery: Cd843Livery = "red"): string {
  if (livery === "cdBlue") return tractionNumber(...BLUE_NUMBERS[unit]);
  return unit === "motorCar" ? tractionNumber("843", "024") : unit === "drivingTrailer" ? tractionNumber("943", "002") : tractionNumber("043", "001");
}

/**
 * The blue cars' numbers, after their photographs (assets/cd-843/SOURCES.md): 843 007 and 943 010
 * (lettered 80-29 010); the trailer's "...29 007" is read as 043 007.
 */
const BLUE_NUMBERS: Record<Cd843Unit, [string, string]> = { motorCar: ["843", "007"], drivingTrailer: ["943", "010"], trailer: ["043", "007"] };

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });
const PALETTE: Record<string, MaterialSpec> = {
  red: c("#d60000"),
  cream: c("#ffffce"),
  roofGrey: c("#c6c6c6", 0.7),
  doorRed: c("#a11f1f"),
  darkRed: c("#840000"),
  skirtGrey: c("#848484", 0.7),
  yellow: c("#f2c40f"),
};

/** The 943's XML section, its roof above 3.2 m raised 1.5 times to the 3.95 m crown. */
const SECTION: Pt[] = [[-1.45, 0.8], [1.45, 0.8], [1.5, 0.9], [1.5, 3.2], [1.4, 3.5], [1.3, 3.65], [1.0, 3.8], [0.2, 3.95], [-0.2, 3.95], [-1.0, 3.8], [-1.3, 3.65], [-1.4, 3.5], [-1.5, 3.2], [-1.5, 0.9]];
const BANDS: Array<[number, number, string]> = [[0.8, 1.0, "red"], [1.0, 1.6, "cream"], [1.6, 3.2, "red"], [3.2, 4.0, "roofGrey"]];

/** A livery: its colours, the sides' bands, the doors', aprons' and markings' paint and the cab front. */
interface Paint843 {
  palette: Record<string, MaterialSpec>;
  bands: Array<[number, number, string]>;
  /** The side doors' paint, the apron under a cab and the lettering (emblem, number) on the sides. */
  door: string;
  apron: string;
  ink: string;
  /** The cab front's items on the 843 canvas, for the motor car or a driving trailer. */
  front: (motor: boolean) => readonly EndItem[];
  /** The roof headlamp box's housing over the cab windows: the paint of the end around it. */
  lampBox: string;
  /** CD's blue: the emblem with the wordmark (`Layout.logo`), the number under it and on the cab fronts. */
  logo?: true;
}

const PAINTS: Record<Cd843Livery, Paint843> = {
  red: { palette: PALETTE, bands: BANDS, door: "doorRed", apron: "red", ink: "letteringDark", front: () => CAB_FRONT, lampBox: "roofGrey" },
  // CD's current blue, read from photo-843-007-cd-blue.jpg, photo-943-010-cd-blue.jpg and
  // photo-043-liberec-cd-blue.jpg: white to the navy line under the windows, light blue to the eave
  // and over the cab fronts, the grey roof, navy doors and aprons
  cdBlue: {
    palette: {
      ...PALETTE,
      navy: c("#1f3a7a"),
      skyBlue: c("#3c97de"),
      white: c("#eef0f2"),
      roofGrey: c("#9a9ea2", 0.7),
    },
    bands: [[0.8, 1.58, "white"], [1.58, 1.74, "navy"], [1.74, 3.2, "skyBlue"], [3.2, 4.0, "roofGrey"]],
    door: "navy", apron: "navy", ink: "navy", front: (motor) => cabFrontBlue(motor), lampBox: "skyBlue", logo: true,
  },
};

interface Layout {
  key: string;
  kx: number;
  /** Body ends in source x and the canvas heights. */
  x0: number;
  x1: number;
  sideH: number;
  frontH: number;
  /** Which ends carry a cab: +1 the +X end. */
  cabs: number[];
  windows: SideItem[];
  doors: Array<{ door: PxBox; glass: PxBox[] }>;
  emblem: PxBox;
  number: PxBox;
  motor: boolean;
  /**
   * In CD's blue the emblem's box instead (near the -X end, as photographed), the "Ceske drahy"
   * wordmark after it where the car carries one, the running number small under them.
   */
  logo: { box: PxBox; wordmark: boolean };
}

/** A row offset: the 943/043 canvases are 6 m tall, the 843's 5 m - the same heights sit 10 rows lower. */
const LAYOUTS: Record<Cd843Unit, Layout> = {
  motorCar: {
    key: "cd_843", kx: 1, x0: 0, x1: 24.1, sideH: 5, frontH: 5, cabs: [-1, 1], motor: true,
    windows: [
      ...[0, 234].map((u): SideItem => ({ kind: "window", box: [u, 20, u + 6, 29], name: "cab window" })),
      { kind: "window", box: [44, 22, 51, 33], name: "toilet window" },
      ...[74, 90, 106, 122, 138, 192, 208].map((u): SideItem => ({ kind: "window", box: [u, 22, u + 13, 33], sash: 28 })),
      { kind: "window", box: [182, 26, 189, 33], name: "high window" },
    ],
    doors: [
      { door: [7, 20, 14, 41], glass: [[8, 21, 13, 29]] },
      { door: [226, 20, 233, 41], glass: [[227, 21, 232, 29]] },
      { door: [18, 20, 29, 41], glass: [[19, 26, 23, 33], [24, 26, 28, 33]] },
      { door: [61, 21, 70, 47], glass: [[63, 28, 68, 35]] },
      { door: [155, 21, 172, 47], glass: [[157, 28, 162, 35], [165, 28, 170, 35]] },
    ],
    emblem: [34, 35, 40, 39],
    number: [104, 35, 122, 38],
    logo: { box: [33, 35.5, 37, 38], wordmark: true },
  },
  drivingTrailer: {
    key: "cd_943", kx: BODY_843 / 19.3, x0: 0.2, x1: 19.5, sideH: 6, frontH: 6, cabs: [1], motor: false,
    windows: [
      ...[9, 25, 41, 82, 98, 114, 144, 160].map((u): SideItem => ({ kind: "window", box: [u, 31, u + 13, 42], sash: 37 })),
      { kind: "window", box: [70, 32, 75, 42], name: "narrow window" },
      { kind: "window", box: [189, 30, 195, 39], name: "cab window" },
    ],
    doors: [
      { door: [57, 29, 68, 56], glass: [[59, 33, 66, 44]] },
      { door: [130, 29, 141, 56], glass: [[132, 33, 139, 44]] },
      { door: [180, 29, 187, 51], glass: [[181, 30, 186, 39]] },
    ],
    emblem: [160, 44, 166, 48],
    number: [94, 44, 112, 47],
    logo: { box: [11, 45.5, 14, 48], wordmark: true },
  },
  trailer: {
    key: "cd_043", kx: BODY_843 / 19.4, x0: 0.3, x1: 19.7, sideH: 6, frontH: 6, cabs: [], motor: false,
    windows: [
      ...[10, 26, 42, 83, 99, 115, 145, 161, 177].map((u): SideItem => ({ kind: "window", box: [u, 31, u + 13, 42], sash: 37 })),
      { kind: "window", box: [71, 32, 76, 42], name: "narrow window" },
    ],
    doors: [
      { door: [58, 29, 69, 56], glass: [[60, 33, 67, 44]] },
      { door: [131, 29, 142, 56], glass: [[133, 33, 140, 44]] },
    ],
    emblem: [21, 44, 27, 48],
    number: [94, 44, 112, 47],
    logo: { box: [12, 45.5, 15, 48], wordmark: false },
  },
};

/** The 843 front (843_x_both, 5 m canvas) - the 943's x_inc is the same 10 rows lower. */
const CAB_FRONT: EndItem[] = [
  { kind: "window", box: [2, 17, 9, 29], name: "window", fw: 0.08 },
  { kind: "window", box: [21, 17, 28, 29], name: "window", fw: 0.08 },
  { kind: "panel", box: [11, 17, 19, 40], mat: "rubber", name: "door outline", proud: 0.006 },
  { kind: "panel", box: [12, 18, 18, 36.5], mat: "doorRed", name: "door leaf", proud: 0.009 },
  { kind: "window", box: [12.5, 18.5, 17.5, 28], name: "door window", fw: 0.05 },
  { kind: "panel", box: [0, 29, 11, 30], mat: "darkRed", name: "line" },
  { kind: "panel", box: [19, 29, 30, 30], mat: "darkRed", name: "line" },
  { kind: "panel", box: [0, 31, 11, 32], mat: "darkRed", name: "line" },
  { kind: "panel", box: [19, 31, 30, 32], mat: "darkRed", name: "line" },
  { kind: "lamp", box: [1, 34, 5, 40], name: "lamp" },
  { kind: "lamp", box: [25, 34, 29, 40], name: "lamp" },
  { kind: "lamp", box: [13, 37, 17, 39], name: "lamp", mat: "lampRed" },
];

/** The gangway end (943 x_dec, 6 m canvas): the end door with its two windows. */
const GANGWAY_END: EndItem[] = [
  { kind: "panel", box: [5, 26, 25, 47], mat: "rubber", name: "gangway" },
  { kind: "window", box: [8, 29, 13, 42], name: "door window", fw: 0.04 },
  { kind: "window", box: [17, 29, 22, 42], name: "door window", fw: 0.04 },
];

/** A car's frame: its native canvases, centred between its end walls. */
const frame843 = (L: Layout): CarFrame => ({ kx: L.kx, ky: 1, kz: 1, centre: (L.x0 + L.x1) / 2, sideH: L.sideH, frontH: L.frontH });

/** A car's body: the plan's corners chamfered 0.1 m. */
function body843(L: Layout, bands = BANDS): Volume {
  const xs = (b: number) => L.x0 + (b / BODY_843) * (L.x1 - L.x0); // body metres -> source x
  // the cab ends round the roof back 0.6 m from 3.55 m (the 843 XML's 0.8 m from 3.5 m)
  const cabTop = (e: number): Pt[] => {
    const tip = e > 0 ? L.x1 : L.x0;
    const back = xs(e > 0 ? BODY_843 - 0.6 : 0.6);
    return e > 0 ? [[back, 3.95], [tip, 3.55]] : [[tip, 3.55], [back, 3.95]];
  };
  const top: Pt[] = [...(L.cabs.includes(-1) ? cabTop(-1) : [[L.x0, 3.95] as Pt]), ...(L.cabs.includes(1) ? cabTop(1) : [[L.x1, 3.95] as Pt])];
  const r = 0.1 / L.kx; // the plan's corner chamfer, 0.1 m
  return { name: "body", section: SECTION, plan: [[L.x0, 1.4], [L.x0 + r, 1.5], [L.x1 - r, 1.5], [L.x1, 1.4]], top, bands };
}

/** A cab front's items on a canvas `frontH` tall (the 843 front sits 10 rows higher on a 6 m canvas). */
const cabFront = (frontH: number, items: readonly EndItem[] = CAB_FRONT): EndItem[] => items.map((it): EndItem => ({ ...it, box: [it.box[0], it.box[1] + 10 * (frontH - 5), it.box[2], it.box[3] + 10 * (frontH - 5)] }));

/**
 * The cab front in CD's blue (843 007, 943 010; on the 843 canvas): the windows and the door as
 * before, the door black down to the navy line only (the white below carries the emblem); the
 * lines gone; a red and a white lamp each side between the windows and the navy line; on the
 * motor car (`surround`) the windows and the door in one black surround.
 */
const cabFrontBlue = (surround: boolean): EndItem[] => [
  ...(surround ? [{ kind: "panel", box: [1.2, 16.2, 28.8, 29.8], mat: "black", name: "surround", proud: 0.0045 } as EndItem] : []),
  { kind: "window", box: [2, 17, 9, 29], name: "window", fw: 0.08 },
  { kind: "window", box: [21, 17, 28, 29], name: "window", fw: 0.08 },
  { kind: "panel", box: [11, 17, 19, 32.4], mat: "rubber", name: "door outline", proud: 0.006 },
  { kind: "panel", box: [12, 18, 18, 32], mat: "black", name: "door leaf", proud: 0.009 },
  { kind: "window", box: [12.5, 18.5, 17.5, 28], name: "door window", fw: 0.05 },
  { kind: "lamp", box: [0.8, 29.9, 3.2, 32.3], name: "lamp", mat: "lampRed" },
  { kind: "lamp", box: [3.4, 29.9, 5.8, 32.3], name: "lamp" },
  { kind: "lamp", box: [24.2, 29.9, 26.6, 32.3], name: "lamp" },
  { kind: "lamp", box: [26.8, 29.9, 29.2, 32.3], name: "lamp", mat: "lampRed" },
];

/** A door that stays shut: a cab or luggage door, not reaching the low entrance (native row 47) or narrower than 0.9 m. */
function shut843(d: { door: PxBox }): boolean {
  return d.door[3] < 47 || d.door[2] - d.door[0] < 9;
}

export function cd843(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD843_PARAMS, params);
  const unit = p.unit as Cd843Unit;
  const livery = p.livery as Cd843Livery;
  const paint = PAINTS[livery];
  const L = LAYOUTS[unit];
  const centre = (L.x0 + L.x1) / 2;
  const car = new Car(paint.palette, frame843(L));
  const m = car.m;
  const xs = (b: number) => L.x0 + (b / BODY_843) * (L.x1 - L.x0); // body metres -> source x
  // the passenger doors open through doorways, so an open one shows the interior (doors.ts)
  const body: Volume = car.volume(body843(L, paint.bands), car.doorways(L.doors.filter((d) => !shut843(d)).map((d) => d.door), 0.03));
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, L.windows));
        m.scope("doors", () =>
          L.doors.forEach((d, i) =>
            m.scope(`door ${i + 1}`, () => {
              // the passenger doors reach down to the low entrance (native row 47 or
              // more): sliding plug doors, a leaf per window, a single leaf sliding
              // toward the car's middle (doors.ts); the cab and luggage doors stay shut
              if (shut843(d)) {
                car.c.door(body, s, car.side(d.door), paint.door, { seam: 0.03 });
                d.glass.forEach((g, j) => m.scope(`glass ${j + 1}`, () => car.c.window(body, s, car.side(g), { fw: 0.04 })));
                return;
              }
              const motion: DoorMotion = d.glass.length > 1 ? { kind: "plug", leaves: 2 } : { kind: "plug", leaves: 1, toward: d.door[0] < 120 ? "high" : "low" };
              car.openingDoor(body, s, d.door, d.glass, paint.door, 0.03, motion, (j) => `glass ${j}`);
            }),
          ),
        );
        if (paint.logo) cdSideLogo(car, body, s, L.logo.box, paint.ink, { wordmark: L.logo.wordmark, number: cd843Number(unit, livery) });
        else {
          m.scope("emblem", () => sideEmblem(car, body, s, L.emblem, paint.ink));
          m.scope("running number", () => sideNumber(car, body, s, L.number, cd843Number(unit, livery), paint.ink));
        }
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      if (L.cabs.includes(e)) {
        m.scope("cab", () => endItems(car, body, e, cabFront(L.frontH, paint.front(L.motor))));
        if (paint.logo) {
          frontLogo(car, e, e > 0 ? L.x1 : L.x0, cd843Number(unit, livery), paint.ink);
          blueHood(car, e, L);
        }
        m.scope("top lamp", () => topLamp(car, e, e > 0 ? L.x1 : L.x0, paint.lampBox));
        m.scope("apron", () => apron(car, e, e > 0 ? L.x1 : L.x0, paint.apron));
      } else {
        const rows = L.frontH - 6;
        const items = GANGWAY_END.map((it): EndItem => ({ ...it, box: [it.box[0], it.box[1] + 10 * rows, it.box[2], it.box[3] + 10 * rows] }));
        m.scope("gangway", () => endItems(car, body, e, items));
      }
    });
  const lobHalf = LOB_843 / 2 / L.kx;
  m.scope("buffers", () => buffersBoth(car, [centre - lobHalf, centre + lobHalf], [L.x0, L.x1], 1.05));
  m.scope("running gear", () => {
    for (const [i, x] of [-8.6, 8.6].entries())
      m.scope(`bogie ${i + 1}`, () => {
        car.c.bogie(car.c.centre + x, 2.4, L.motor ? 0.46 : 0.42, 0.8);
        if (L.motor)
          m.scope("traction motors", () => {
            for (const d of [-0.62, 0.62]) block(m, "engine", x + d - 0.26, x + d + 0.26, 0.3, 0.66, -0.5, 0.5);
          });
      });
  });
  m.scope("underframe", () => {
    if (L.motor) {
      underBoxes(car, [
        { name: "power pack 1", x0: 5.6, x1: 8.4, y0: 0.3, y1: 0.79, hw: 1.15 },
        { name: "power pack 2", x0: 15.7, x1: 18.5, y0: 0.3, y1: 0.79, hw: 1.15 },
        { name: "rectifier", x0: 9.2, x1: 11.6, y0: 0.38, y1: 0.79, hw: 1.0 },
      ]);
      m.scope("fuel tank", () => tankX(car, 12.4, 14.6, 0.55, 0, 0.24));
    } else
      underBoxes(car, [
        { name: "equipment", x0: xs(9.0), x1: xs(13.0), y0: 0.4, y1: 0.79, hw: 1.0 },
        { name: "battery", x0: xs(14.0), x1: xs(15.6), y0: 0.45, y1: 0.79, hw: 0.8 },
      ]);
  });
  m.scope("roof equipment", () => {
    if (L.motor) {
      for (const [i, x] of [7.0, 17.1].entries()) {
        m.scope(`exhaust ${i + 1}`, () => exhaust(car, x, 0.45, 3.85, 4.12, 0.08));
      }
    }
    m.scope("air conditioning", () => block(m, "roofGrey", car.X(xs(11.2)), car.X(xs(12.9)), 3.86, 4.08, -0.6, 0.6));
  });
  return m;
}

/**
 * The roof headlamp box over a cab's windows (read from photo-843-007-cd-blue.jpg,
 * photo-943-010-cd-blue.jpg and photo-843-024-holasovice.jpg): 0.82 m wide and 0.3 m tall at the
 * top of the end, standing 6 cm out and reaching back into the roof's rounding; m along x, y, half width.
 */
export const LAMP_BOX_843 = { out: 0.06, back: 0.22, y0: 3.33, y1: 3.63, hw: 0.41 };

/** The roof headlamp box on cab end e at source x `tip`: a housing in `mat`, a black face with three lamps. */
function topLamp(car: Car, e: number, tip: number, mat: string): void {
  const m = car.m;
  const B = LAMP_BOX_843;
  const xf = car.X(tip) + e * B.out;
  const span = (a: number, b: number): [number, number] => [Math.min(a, b), Math.max(a, b)];
  block(m, mat, ...span(xf, car.X(tip) - e * B.back), B.y0, B.y1, -B.hw, B.hw);
  m.scope("face", () => block(m, "black", ...span(xf, xf + e * 0.01), B.y0 + 0.04, B.y1 - 0.04, -B.hw + 0.04, B.hw - 0.04));
  m.scope("lamps", () => {
    for (const z of [-0.22, 0, 0.22]) block(m, "lampWhite", ...span(xf + e * 0.01, xf + e * 0.02), B.y0 + 0.09, B.y1 - 0.09, z - 0.06, z + 0.06);
  });
}

/** The deep apron under a cab: red (the livery's `mat`) down to 0.38 m over a yellow edge, set 5 cm behind the end wall. */
function apron(car: Car, e: number, tip: number, mat: string): void {
  const x1 = car.X(tip) - e * 0.05;
  const x0 = x1 - e * 0.7;
  const [a, b] = [x0, x1].sort((p, q) => p - q) as [number, number];
  block(car.m, mat, a, b, 0.38, 0.81, -1.3, 1.3);
  block(car.m, "yellow", a + 0.01, b - 0.01, 0.3, 0.38, -1.29, 1.29);
}

/**
 * CD's blue on a cab front at source x `tip`: the light blue over the end above the eave, the
 * running number in white on the navy line left of the door, the emblem under the door.
 */
function frontLogo(car: Car, e: number, tip: number, number: string, ink: string): void {
  const m = car.m;
  const x = car.X(tip);
  // the light blue carried up over the roof's end above the eave, inside the end's outline
  m.scope("front top", () => {
    const k = 1.4 / 1.5;
    const ring = clipY(SECTION, 3.2 + 0.0025, 3.55 - 0.0025).map(([z, y]): Vec3 => [x + e * 0.0012, y, (z * k) - Math.sign(z) * 0.0025]);
    m.slab("skyBlue", ring, [-e * 0.0009, 0, 0]);
  });
  endMarks(car, e, x, ink, { number, numberLeft: 1.3, numberY: 1.605, emblemY: 1.24 });
}

/**
 * CD's blue over the roof's rounding down to a cab end (body843's last 0.6 m): a light blue skin
 * 4 mm over the shell above the eave, on the loft's own stations, so the cab front is light blue up
 * to where the roof levels out, as photographed.
 */
function blueHood(car: Car, e: number, L: Layout): void {
  const xs = (b: number) => L.x0 + (b / BODY_843) * (L.x1 - L.x0);
  const tip = e > 0 ? L.x1 : L.x0;
  const back = xs(e > 0 ? BODY_843 - 0.6 : 0.6);
  const r = 0.1 / L.kx;
  const hi = (x: number) => 3.95 - 0.4 * Math.abs(x - back) / Math.abs(tip - back);
  const k = (x: number) => (Math.abs(x - tip) >= r - 1e-9 ? 1 : (1.4 + (0.1 * Math.abs(x - tip)) / r) / 1.5);
  const line = SECTION.filter(([, y]) => y >= 3.2 - 1e-9);
  const ring = (x: number): Vec3[] => line.map(([z, y]): Vec3 => {
    const yy = Math.min(y, hi(x));
    const zz = z * k(x);
    const l = Math.hypot(zz, yy - 2.4);
    return [car.X(x), yy + (0.004 * (yy - 2.4)) / l, zz + (0.004 * zz) / l];
  });
  const rings = [back, tip - e * r, tip].map(ring);
  car.m.scope("hood", () => {
    for (let j = 0; j + 1 < rings.length; j++)
      for (let i = 0; i + 1 < line.length; i++) {
        const [a, b, c, d] = [rings[j]![i]!, rings[j + 1]![i]!, rings[j + 1]![i + 1]!, rings[j]![i + 1]!];
        // the quad is not planar: fold it along the diagonal that bulges out, so the skin covers the
        // shell whichever way the shell's own quad is split (a fixed diagonal let the shell show
        // through over half of the +X end)
        const out = (p: Vec3, q: Vec3) => Math.hypot((p[1] + q[1]) / 2 - 2.4, (p[2] + q[2]) / 2);
        const tris = out(a, c) >= out(b, d) ? [a, b, c, a, c, d] : [a, b, d, b, c, d];
        const mid: Vec3 = [0, (a[1] + c[1]) / 2 - 2.4, (a[2] + c[2]) / 2];
        // facets turns each triangle to face out
        car.m.facets("skyBlue", tris, mid);
      }
  });
}

/**
 * A car of the 843 family for distant views (lodUnits.ts): the body's section,
 * bands and the roof sloping to each cab, the cab fronts' windows and door as
 * one windscreen, the side window band, the deep red aprons under the cabs,
 * the bogies, the underframe equipment and the air conditioning; the cabs'
 * roof headlamp boxes are below what the 100 triangles keep.
 */
export function cd843Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD843_PARAMS, params);
  const unit = p.unit as Cd843Unit;
  const paint = PAINTS[p.livery as Cd843Livery];
  const L = LAYOUTS[unit];
  const f = frame843(L);
  const X = (x: number) => (x - f.centre) * L.kx;
  const xs = (b: number) => L.x0 + (b / BODY_843) * (L.x1 - L.x0);
  const body = dmuBody(f, body843(L, paint.bands), { items: L.windows, cabs: L.cabs, cabItems: cabFront(L.frontH, paint.front(L.motor)) });
  const half = 1.2 + (L.motor ? 0.46 : 0.42) + 0.2;
  return fitUnit({
    palette: { ...DMU_PALETTE, ...paint.palette },
    bodies: [body],
    parts: [
      ...bogieParts([[-8.6, half], [8.6, half]], 0.8),
      L.motor ? underPart(X(5.6), X(18.5), 0.3, 0.8, 1.15) : underPart(X(xs(9.0)), X(xs(15.6)), 0.4, 0.8, 1.0),
      ...L.cabs.map((e) => ({ optional: 30, draw: (m: MeshBuilder) => m.scope("apron", () => {
        const x1 = X(e > 0 ? L.x1 : L.x0) - e * 0.05;
        const [a, b] = [x1 - e * 0.7, x1].sort((p, q) => p - q) as [number, number];
        lodSideBox(m, paint.apron, [[a, 0.38], [b, 0.38], [b, 0.8], [a, 0.8]], -1.3, 1.3);
      }) })),
      roofPart("roofGrey", X(xs(11.2)), X(xs(12.9)), 0.6, 0.6, 3.86, 4.08),
    ],
  }, 100);
}

export const CD843_UNITS: readonly Cd843Unit[] = ["motorCar", "drivingTrailer", "trailer"];

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_843_GAME: GameProperties = {
  weight: 56,
  power: 423,
  maxspeed: 100,
  accel: null,
  // variants match the selection exactly: the trailers' figures again in every other livery
  variants: [undefined, "cdBlue"].flatMap((livery) => (["drivingTrailer", "trailer"] as const).map((unit) => ({
    params: { unit, ...(livery ? { livery } : {}) }, weight: 25, power: 0, maxspeed: 120,
  }))),
};

export const DMU843_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-cd-843", game: CD_843_GAME, title: "CD 843 / 943 / 043", build: cd843, buildLod: cd843Lod, params: CD843_PARAMS, catalog: DMU_CATALOG, references: "cd-843" },
];
