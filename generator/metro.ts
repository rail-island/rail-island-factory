// The Metrovagonmash 81-71 metro car as Prague ran it on standard gauge,
// reconstructed from vlakosimdb db/train/metro/mmz (m_mmz_81-71l, the head car,
// and m_mmz_81-71v, the middle car; the native XML and BMPs in
// assets/metro-81-71/native): the body lofted from the XML profiles, doors,
// windows and the ribbed lower sides from boxes measured on z_both.bmp, the
// drawing mapped onto the published 19.21 m over the couplers, 2.7 m width and
// 3.65 m height (tramKit.ts). A rigid car: one node, no rig. Current comes from
// a third rail through shoes on the bogies. See docs/models/trams.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { Tram, type Pt, type PxBox, type SourceVolume, type TramMap } from "./tramKit.ts";

/** The game-catalog fields of the metro: rail vehicles in their own pool. */
export const METRO_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "metro",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

export type MetroUnit = "headCar" | "middleCar";

export const METRO_PARAMS: readonly ParamSpec[] = [{
  name: "unit",
  title: "Unit",
  values: [
    { value: "headCar", title: "Head car" },
    { value: "middleCar", title: "Middle car" },
  ],
  default: "headCar",
}];

/** 780 mm wheels, 2.1 m bogie wheelbase, 12.6 m between the bogie pivots. */
export const METRO_WHEEL_R = 0.39;
export const METRO_WHEELBASE = 2.1;
export const METRO_PIVOTS = 12.6;
/** Prague's fleet number of the car shown (head car; the middle car carries its own). */
export const METRO_NUMBERS: Record<MetroUnit, string> = { headCar: "3072", middleCar: "3172" };

/** Both cars' drawings (20 by 6 m canvases) onto 19.21 m over the couplers, 2.7 m and 3.65 m (assets/metro-81-71/SOURCES.md). */
export const METRO_MAP: TramMap = { c: 10.0, kx: 19.21 / 20, ky: 3.65 / 3.7, kz: 2.7 / 3.0, side: 6, end: 6 };

const SECTION: Pt[] = [[-1.5, 0.7], [1.5, 0.7], [1.5, 3.1], [1.4, 3.3], [1.3, 3.4], [1.1, 3.5], [0.6, 3.6], [0.3, 3.7], [-0.3, 3.7], [-0.6, 3.6], [-1.1, 3.5], [-1.3, 3.4], [-1.4, 3.3], [-1.5, 3.1]];

interface MetroCar {
  body: SourceVolume;
  ends: [number, number];
  /** Couplers: head x at the front and the rear (source). */
  couplers: [number, number];
  /** Source x of the bogie pivots: the published 12.6 m apart about the drawing's own bogie midpoint (12.7 m apart in the drawing before scaling). */
  bogies: [number, number];
  doors: PxBox[];
  windows: PxBox[];
  /** The cab's side door (head car only). */
  cabDoor?: PxBox;
}

/** The bogie pivots (source x), the published distance apart about the drawing's midpoint between its bogies, `c`. */
const pivots = (c: number): [number, number] => [c - METRO_PIVOTS / 2 / METRO_MAP.kx, c + METRO_PIVOTS / 2 / METRO_MAP.kx];

const CARS: Record<MetroUnit, MetroCar> = {
  headCar: {
    body: {
      plan: [[0.4, 1.1], [0.5, 1.3], [0.6, 1.4], [0.8, 1.5], [19.3, 1.5], [19.5, 1.4], [19.6, 1.3], [19.7, 1.1]],
      top: [[0.4, 3.1], [0.5, 3.3], [0.6, 3.4], [0.8, 3.5], [1.4, 3.7], [18.5, 3.7], [19.3, 3.6], [19.5, 3.5], [19.6, 3.3], [19.7, 3.1]],
      bottom: [[0.4, 0.8], [0.5, 0.7], [1.3, 0.7], [1.5, 0.8], [1.7, 1.0], [19.7, 1.0]],
    },
    ends: [0.4, 19.7],
    couplers: [0, 20],
    bogies: pivots(10.1),
    doors: [[23, 29, 38, 48], [70, 29, 85, 48], [117, 29, 132, 48], [164, 29, 179, 48]],
    windows: [[45, 29, 63, 39], [92, 29, 110, 39], [139, 29, 157, 39], [187, 29, 194, 39]],
    cabDoor: [9, 29, 17, 48],
  },
  middleCar: {
    body: {
      plan: [[0.3, 1.1], [0.4, 1.3], [0.5, 1.4], [0.7, 1.5], [19.1, 1.5], [19.3, 1.4], [19.4, 1.3], [19.5, 1.1]],
      top: [[0.3, 3.1], [0.5, 3.5], [0.9, 3.7], [18.8, 3.7], [19.2, 3.6], [19.3, 3.5], [19.5, 3.1]],
      bottom: [[0.3, 1.0], [19.5, 1.0]],
    },
    ends: [0.3, 19.5],
    couplers: [0, 19.8],
    bogies: pivots(9.95),
    doors: [[21, 29, 36, 48], [68, 29, 83, 48], [115, 29, 130, 48], [162, 29, 177, 48]],
    windows: [[7, 29, 14, 39], [43, 29, 61, 39], [90, 29, 108, 39], [137, 29, 155, 39], [184, 29, 191, 39]],
  },
};

/** Underfloor equipment boxes between the bogies (source x0, x1, bottom y), from the XML. */
const EQUIPMENT: Array<[number, number, number]> = [[6.3, 7.0, 0.6], [7.0, 7.8, 0.3], [7.8, 10.8, 0.4], [10.8, 11.5, 0.3], [11.6, 12.0, 0.4], [12.1, 12.5, 0.5], [12.7, 13.4, 0.3], [13.4, 13.7, 0.4], [13.9, 14.2, 0.5]];

export function metro8171(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(METRO_PARAMS, params).unit as MetroUnit;
  const car = CARS[unit];
  const head = unit === "headCar";
  const t = new Tram({
    silver: { color: "#c3c8cc", metallic: 0.4, roughness: 0.4 },
    rib: { color: "#9ea4a9", metallic: 0.4, roughness: 0.45 },
    doorRed: { color: "#cf2a2a", roughness: 0.5 },
    doorYellow: { color: "#e5bf1d", roughness: 0.5 },
    mask: { color: "#3f4245", roughness: 0.6 },
    shoe: { color: "#d5b51c", roughness: 0.6 },
  }, { ...METRO_MAP, c: (car.couplers[0] + car.couplers[1]) / 2 });
  const m = t.m;
  const [a, b] = car.ends;
  // silver above a ribbed lower side, the roof grey over 3.4 m
  const bands: Array<[number, number, string]> = [[0, 1.9, "rib"], [1.9, 3.4, "silver"], [3.4, 3.8, "roof"]];
  const cabBands: Array<[number, number, string]> = [[0, 1.55, "mask"], [1.55, 1.9, "silver"], [1.9, 2.95, "glass"], [2.95, 3.4, "silver"], [3.4, 3.8, "roof"]];
  const vols = head
    ? [t.vol("cab", SECTION, car.body, a, 0.75, cabBands), t.vol("saloon", SECTION, car.body, 0.75, b, bands)]
    : [t.vol("saloon", SECTION, car.body, a, b, bands)];
  const saloon = vols[vols.length - 1]!;
  m.scope("body", () => vols.forEach((v) => m.scope(v.name, () => t.volume(v))));
  for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => {
    // the ribs of the stainless lower side: light strips over the darker band
    m.scope("ribs", () => {
      // between the doors (and the cab door): a rib never runs under a door's seam
      const stops = [...(car.cabDoor ? [car.cabDoor] : []), ...car.doors].map((d) => [d[0], d[2]] as const);
      const spans: Array<[number, number]> = [];
      let from = head ? 18 : 6;
      for (const [d0, d1] of stops) {
        if (d0 - from > 1) spans.push([from, d0 - 0.3]);
        from = Math.max(from, d1 + 0.3);
      }
      spans.push([from, head ? 196 : 193]);
      for (const [u0, u1] of spans) for (let r = 41; r <= 47; r += 2) t.paint(saloon, s, "silver", [u0, r, u1, r + 1]);
    });
    m.scope("windows", () => t.windows(saloon, s, car.windows, { frame: "frame", fw: 0.06 }));
    m.scope("doors", () =>
      car.doors.forEach((d, i) =>
        m.scope(`door ${i + 1}`, () => {
          t.door(saloon, s, t.box(d), "doorRed");
          const mid = (d[0] + d[2]) / 2;
          t.paint(saloon, s, "doorYellow", [d[0] + 1, 39, d[2] - 1, 41], 0.014);
          for (const [u0, u1] of [[d[0] + 1, mid - 0.5], [mid + 0.5, d[2] - 1]] as const)
            m.scope("light", () => t.window(saloon, s, t.box([u0, 30, u1, 39]), { frame: "seam", fw: 0.04 }));
        }),
      ),
    );
    if (car.cabDoor) m.scope("cab door", () => {
      t.door(saloon, s, t.box(car.cabDoor!), "silver");
      t.window(saloon, s, t.box([10, 30, 16, 38]), { frame: "frame", fw: 0.04 });
    });
    m.scope("fleet number", () => t.inscription(saloon, s, t.fx(head ? 3.3 : 2.9), [{ text: METRO_NUMBERS[unit], y: t.fy(2.05), h: 0.13 }], 0.006, "marking"));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => {
    const v = e > 0 ? vols[0]! : saloon;
    if (head && e > 0) {
      m.scope("lamps", () => {
        for (const u of [6, 24]) t.lamp(v, e, u, 50, 0.09, "lampHead");
        for (const u of [9, 21]) t.lamp(v, e, u, 50, 0.05, "lampRed");
      });
      m.scope("windscreen pillar", () => t.endPaint(v, e, "mask", [14, 30, 16, 45], 0.03));
    } else {
      // an intercar end: the gangway door between two windows
      m.scope("end door", () => {
        t.endPaint(v, e, "frame", [11, 24, 19, 49], 0.006);
        t.endPaint(v, e, "glass", [12, 25, 18, 32], 0.012);
      });
      m.scope("end windows", () => {
        for (const [u0, u1] of [[2, 8], [22, 28]] as const) t.endPaint(v, e, "glass", [u0, 25, u1, 32], 0.006);
      });
    }
    m.scope("coupler", () => t.coupler(e, t.fx(e > 0 ? a + 0.6 : b - 0.6), t.fx(e > 0 ? car.couplers[0] : car.couplers[1]), t.fy(0.85)));
  });
  m.scope("roof equipment", () => {
    for (const x of [4.5, 10, 15.5]) m.scope("vent", () => t.roofBox("roofBox", x - 0.4, x + 0.4, 3.66, 3.76, 0.25, 0.03));
  });
  m.scope("underframe", () => {
    for (const [x0, x1, y0] of EQUIPMENT) m.scope("equipment box", () => block(m, "underframe", t.fx(x1), t.fx(x0), t.fy(y0), t.fy(1.0) - 0.004, -1.2, 1.2));
  });
  m.scope("running gear", () => {
    car.bogies.forEach((x, i) => m.scope(`bogie ${i + 1}`, () => {
      t.bogie(t.fx(x), METRO_WHEELBASE, METRO_WHEEL_R, t.fy(1.0));
      // the third-rail shoes, one each side, on beams from the axle boxes
      const ay = METRO_WHEEL_R * Math.cos(Math.PI / 24);
      m.scope("current collectors", () => {
        for (const s of [-1, 1]) {
          block(m, "bogie", t.fx(x) - 0.06, t.fx(x) + 0.06, ay - 0.08, ay + 0.02, ...side(s, 1.06, 1.36));
          block(m, "shoe", t.fx(x) - 0.18, t.fx(x) + 0.18, 0.13, 0.2, ...side(s, 1.24, 1.42));
          block(m, "shoe", t.fx(x) - 0.04, t.fx(x) + 0.04, 0.2, ay - 0.08, ...side(s, 1.3, 1.36));
        }
      });
    }));
  });
  return m;
}

export const METRO_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-metro-81-71", game: { weight: 35, power: 300, maxspeed: 80, accel: null }, title: "Metro 81-71", build: metro8171, params: METRO_PARAMS, catalog: METRO_CATALOG, references: "metro-81-71" },
];
