// The CD 843 diesel-electric railcar (Moravskoslezska vagonka Studenka,
// 1995-97) and the cars it runs with: the 943 driving trailer and the 043
// trailer. One design `veh-cd-843` whose `unit` picks the car: the 843 motor car
// with a cab at each end (default), the 943 driving trailer (cab at +X, gangway
// at -X) or the 043 trailer (gangways at both ends).
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
import type { Pt, Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import {
  Car, DMU_CATALOG, buffersBoth, endItems, enumParam, exhaust, sideEmblem, sideItems, sideNumber, tankX, tractionNumber, underBoxes,
  type EndItem, type PxBox, type SideItem,
} from "./dmuKit.ts";

export type Cd843Unit = "motorCar" | "drivingTrailer" | "trailer";

export const CD843_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car 843 (two cabs)",
    drivingTrailer: "Driving trailer 943 (cab)",
    trailer: "Trailer 043",
  }),
];

/** The common body length (m), end wall to end wall: the 843's XML body; 25.2 m over the buffers. */
export const BODY_843 = 24.1;
export const LOB_843 = 25.2;

/** The running numbers: 843 024 and 943 002 are photographed (assets/cd-843/PHOTOS.md); 043 001 is the first of the class. */
export function cd843Number(unit: Cd843Unit): string {
  return unit === "motorCar" ? tractionNumber("843", "024") : unit === "drivingTrailer" ? tractionNumber("943", "002") : tractionNumber("043", "001");
}

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
  { kind: "lamp", box: [1, 35, 5, 39], name: "lamp" },
  { kind: "lamp", box: [25, 35, 29, 39], name: "lamp" },
  { kind: "lamp", box: [13, 37, 17, 39], name: "lamp", mat: "lampRed" },
];

/** The gangway end (943 x_dec, 6 m canvas): the end door with its two windows. */
const GANGWAY_END: EndItem[] = [
  { kind: "panel", box: [5, 26, 25, 47], mat: "rubber", name: "gangway" },
  { kind: "window", box: [8, 29, 13, 42], name: "door window", fw: 0.04 },
  { kind: "window", box: [17, 29, 22, 42], name: "door window", fw: 0.04 },
];

export function cd843(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD843_PARAMS, params);
  const unit = p.unit as Cd843Unit;
  const L = LAYOUTS[unit];
  const centre = (L.x0 + L.x1) / 2;
  const car = new Car(PALETTE, { kx: L.kx, ky: 1, kz: 1, centre, sideH: L.sideH, frontH: L.frontH });
  const m = car.m;
  const xs = (b: number) => L.x0 + (b / BODY_843) * (L.x1 - L.x0); // body metres -> source x
  // the cab ends round the roof back 0.6 m from 3.55 m (the 843 XML's 0.8 m from 3.5 m)
  const cabTop = (e: number): Pt[] => {
    const tip = e > 0 ? L.x1 : L.x0;
    const back = xs(e > 0 ? BODY_843 - 0.6 : 0.6);
    return e > 0 ? [[back, 3.95], [tip, 3.55]] : [[tip, 3.55], [back, 3.95]];
  };
  const top: Pt[] = [...(L.cabs.includes(-1) ? cabTop(-1) : [[L.x0, 3.95] as Pt]), ...(L.cabs.includes(1) ? cabTop(1) : [[L.x1, 3.95] as Pt])];
  const r = 0.1 / L.kx; // the plan's corner chamfer, 0.1 m
  const body: Volume = car.volume({
    name: "body",
    section: SECTION,
    plan: [[L.x0, 1.4], [L.x0 + r, 1.5], [L.x1 - r, 1.5], [L.x1, 1.4]],
    top,
    bands: BANDS,
  });
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, L.windows));
        m.scope("doors", () =>
          L.doors.forEach((d, i) =>
            m.scope(`door ${i + 1}`, () => {
              car.c.door(body, s, car.side(d.door), "doorRed", { seam: 0.03 });
              d.glass.forEach((g, j) => m.scope(`glass ${j + 1}`, () => car.c.window(body, s, car.side(g), { fw: 0.04 })));
            }),
          ),
        );
        m.scope("emblem", () => sideEmblem(car, body, s, L.emblem, "letteringDark"));
        m.scope("running number", () => sideNumber(car, body, s, L.number, cd843Number(unit), "letteringDark"));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      if (L.cabs.includes(e)) {
        const rows = L.frontH - 5; // the 843 front sits 10 rows higher on a 6 m canvas
        const items = CAB_FRONT.map((it): EndItem => ({ ...it, box: [it.box[0], it.box[1] + 10 * rows, it.box[2], it.box[3] + 10 * rows] }));
        m.scope("cab", () => endItems(car, body, e, items));
        m.scope("apron", () => apron(car, e, e > 0 ? L.x1 : L.x0));
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

/** The deep apron under a cab: red down to 0.38 m over a yellow edge, set 5 cm behind the end wall. */
function apron(car: Car, e: number, tip: number): void {
  const x1 = car.X(tip) - e * 0.05;
  const x0 = x1 - e * 0.7;
  const [a, b] = [x0, x1].sort((p, q) => p - q) as [number, number];
  block(car.m, "red", a, b, 0.38, 0.81, -1.3, 1.3);
  block(car.m, "yellow", a + 0.01, b - 0.01, 0.3, 0.38, -1.29, 1.29);
}

export const CD843_UNITS: readonly Cd843Unit[] = ["motorCar", "drivingTrailer", "trailer"];

export const DMU843_DESIGNS: ProceduralDesign[] = [
  { id: "veh-cd-843", title: "CD 843 / 943 / 043", build: cd843, params: CD843_PARAMS, catalog: DMU_CATALOG, references: "cd-843" },
];
