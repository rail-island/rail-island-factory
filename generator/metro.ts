// The Metrovagonmash 81-71 metro car as Prague ran it on standard gauge,
// reconstructed from vlakosimdb db/train/metro/mmz (m_mmz_81-71l, the head car,
// and m_mmz_81-71v, the middle car; the native XML and BMPs in
// assets/metro-81-71/native): the body lofted from the XML profiles, doors,
// windows and the ribbed lower sides from boxes measured on z_both.bmp, the
// drawing mapped onto the published 19.21 m over the couplers, 2.7 m width and
// 3.65 m height (tramKit.ts). A rigid car: one node, no rig. Current comes from
// a third rail through shoes on the bogies. See docs/models/trams.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { MaterialSpec } from "./meshCore.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { Tram, type Pt, type PxBox, type SourceVolume, type TramMap } from "./tramKit.ts";
import { tramLod } from "./lodTrams.ts";

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
export type MetroLivery = "prague" | "budapest";

export const METRO_PARAMS: readonly ParamSpec[] = [{
  name: "unit",
  title: "Unit",
  values: [
    { value: "headCar", title: "Head car" },
    { value: "middleCar", title: "Middle car" },
  ],
  default: "headCar",
}, {
  name: "livery",
  title: "Livery",
  values: [
    { value: "prague", title: "Prague" },
    { value: "budapest", title: "Budapest" },
  ],
  default: "prague",
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

/**
 * A livery's paint (assets/metro-81-71/PHOTOS.md): `silver` the body, `rib` the
 * side ribs, `trim` the sill moulding and the gutter, `doorRed` the door leaves,
 * `doorYellow` the band across them (none where the livery has no band), `mask`
 * the cab front, `roof` the roof.
 */
interface MetroPaint {
  palette: Record<string, MaterialSpec>;
  doorBand: boolean;
}

const COMMON: Record<string, MaterialSpec> = {
  shoe: { color: "#d5b51c", roughness: 0.6 },
  sign: { color: "#e9ebe6", roughness: 0.4 },
  anticlimber: { color: "#7f8487", metallic: 0.2, roughness: 0.6 },
};

export const METRO_LIVERIES: Record<MetroLivery, MetroPaint> = {
  // Prague: the stainless-look silver body, red doors with a yellow band, the dark cab mask
  prague: {
    palette: {
      ...COMMON,
      silver: { color: "#c3c8cc", metallic: 0.4, roughness: 0.4 },
      rib: { color: "#8f959a", metallic: 0.4, roughness: 0.45 },
      trim: { color: "#e1e4e6", metallic: 0.6, roughness: 0.3 },
      doorRed: { color: "#cf2a2a", roughness: 0.5 },
      doorYellow: { color: "#e5bf1d", roughness: 0.5 },
      mask: { color: "#2b2d30", roughness: 0.6 },
      roof: { color: "#8e9496", roughness: 0.75 },
    },
    doorBand: true,
  },
  // Budapest (the M3's Soviet cars): blue all over, roof, vents and doors too, dark grey mouldings and window frames
  budapest: {
    palette: {
      ...COMMON,
      silver: { color: "#2f66ad", roughness: 0.5 },
      rib: { color: "#244f88", roughness: 0.55 },
      trim: { color: "#4b4f54", metallic: 0.3, roughness: 0.5 },
      doorRed: { color: "#2c62a8", roughness: 0.5 },
      doorYellow: { color: "#2c62a8", roughness: 0.5 },
      mask: { color: "#2a5c9f", roughness: 0.55 },
      roof: { color: "#2b5e9f", roughness: 0.7 },
      roofBox: { color: "#26548f", roughness: 0.7 },
      frame: { color: "#3d4247", metallic: 0.2, roughness: 0.5 },
    },
    doorBand: false,
  },
};

/** The body is one colour, the roof grey over 3.4 m; the head car's cab is the mask above its apron. */
const BANDS: Array<[number, number, string]> = [[0, 3.4, "silver"], [3.4, 3.8, "roof"]];
const CAB_BANDS: Array<[number, number, string]> = [[0, 1.3, "silver"], [1.3, 3.4, "mask"], [3.4, 3.8, "roof"]];
/** The roof's row of ventilators (source x). */
const VENTS = [3.0, 5.6, 8.2, 10.8, 13.4, 16.0];
/** The side ribs (source heights of their feet): five on the lower side, four in the piers between the windows. */
const LOWER_RIBS = [1.1, 1.25, 1.4, 1.55, 1.7];
const PIER_RIBS = [2.27, 2.47, 2.67, 2.87];
const RIB_H = 0.035;
/** The sill moulding (source heights), under the windows from end to end but for the doors. */
const MOULDING: [number, number] = [1.95, 2.06];
/** Where the fleet number sits (source x), clear of doors and windows, under the moulding. */
const NUMBER_X: Record<MetroUnit, number> = { headCar: 4.15, middleCar: 3.95 };

/** Spans along the side (source px) from `from` to `to` that keep 0.3 px clear of every box in `stops`. */
function spansBetween(stops: PxBox[], from: number, to: number): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let at = from;
  for (const d of [...stops].sort((p, q) => p[0] - q[0])) {
    if (d[0] - 0.3 - at > 0.5) spans.push([at, d[0] - 0.3]);
    at = Math.max(at, d[2] + 0.3);
  }
  if (to - at > 0.5) spans.push([at, to]);
  return spans;
}

/**
 * A car of the 81-71 for distant views, by the tram kit's adapter (lodTrams.ts):
 * the body with its rounded ends, the head car's cab paint and windscreen
 * band, the side window bands, the roof vents and the bogies.
 */
export function metro8171Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(METRO_PARAMS, params);
  const unit = p.unit as MetroUnit;
  const car = CARS[unit];
  const head = unit === "headCar";
  const [a, b] = car.ends;
  return tramLod({
    map: { ...METRO_MAP, c: (car.couplers[0] + car.couplers[1]) / 2 },
    palette: METRO_LIVERIES[p.livery as MetroLivery].palette,
    section: SECTION,
    body: car.body,
    bodies: [[a, b]],
    cabs: head ? [0.75, b] : [a, b],
    main: BANDS,
    cab: head ? CAB_BANDS : BANDS,
    glass: ["glass"],
    windows: { right: car.windows, left: car.windows },
    roofBoxes: [4.5, 10, 15.5].map((x) => ({ x: [x - 0.4, x + 0.4] as [number, number], y: [3.66, 3.76] as [number, number], half: 0.25, optional: true })),
    pantographs: [],
    bogies: car.bogies.map((x) => ({ x, wb: METRO_WHEELBASE, r: METRO_WHEEL_R, top: 1.0 })),
    wire: 5.5,
  }, 100);
}

export function metro8171(params?: ParamValues): MeshBuilder {
  const p = resolveParams(METRO_PARAMS, params);
  const unit = p.unit as MetroUnit;
  const livery = METRO_LIVERIES[p.livery as MetroLivery];
  const car = CARS[unit];
  const head = unit === "headCar";
  const t = new Tram(livery.palette, { ...METRO_MAP, c: (car.couplers[0] + car.couplers[1]) / 2 });
  const m = t.m;
  const [a, b] = car.ends;
  const vols = head
    ? [t.vol("cab", SECTION, car.body, a, 0.75, CAB_BANDS), t.vol("saloon", SECTION, car.body, 0.75, b, BANDS)]
    : [t.vol("saloon", SECTION, car.body, a, b, BANDS)];
  const saloon = vols[vols.length - 1]!;
  // the saloon's doorways on both sides, so the doors sliding into the wall show the interior (doors.ts)
  saloon.openings = [1, -1].flatMap((s) => car.doors.map((d) => t.doorOpening(s, t.box(d))));
  m.scope("body", () => vols.forEach((v) => m.scope(v.name, () => t.volume(v))));
  // where the side's ribs and moulding run: from behind the cab (or the end's rounding) to the far end
  const [from, to] = head ? [18, 196] : [6, 193];
  const doorStops: PxBox[] = [...(car.cabDoor ? [car.cabDoor] : []), ...car.doors];
  // a strip along the side over source px u0..u1, its foot at source height y, h metres tall
  const strip = (s: number, mat: string, u0: number, u1: number, y: number, h: number, proud: number, depth: number) =>
    t.sidePanel(saloon, mat, s, { x0: t.fx(u1 / 10), x1: t.fx(u0 / 10), y0: t.fy(y), y1: t.fy(y) + h }, proud, depth);
  for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => {
    // the corrugated sides: raised ribs over the lower side and in the piers between the windows
    m.scope("ribs", () => {
      for (const [u0, u1] of spansBetween(doorStops, from, to)) for (const y of LOWER_RIBS) strip(s, "rib", u0, u1, y, RIB_H, 0.008, 0.012);
      for (const [u0, u1] of spansBetween([...doorStops, ...car.windows], from, to))
        for (const y of PIER_RIBS) strip(s, "rib", u0, u1, y, RIB_H, 0.008, 0.012);
    });
    m.scope("moulding", () => {
      for (const [u0, u1] of spansBetween(doorStops, head ? 8 : from, to)) strip(s, "trim", u0, u1, MOULDING[0], t.fy(MOULDING[1]) - t.fy(MOULDING[0]), 0.016, 0.03);
    });
    m.scope("gutter", () => strip(s, "trim", head ? 8 : from, to, 3.12, 0.045, 0.02, 0.03));
    m.scope("windows", () => t.windows(saloon, s, car.windows, { frame: "frame", fw: 0.06 }));
    m.scope("doors", () =>
      car.doors.forEach((d, i) =>
        m.scope(`door ${i + 1}`, () => {
          // two leaves sliding apart into pockets in the wall, the band and a light riding on each (doors.ts)
          const mid = (d[0] + d[2]) / 2;
          t.door(saloon, s, t.box(d), "doorRed", {
            opens: { kind: "pocket", leaves: 2 },
            leafWork: (clip) => {
              const band = livery.doorBand ? clip(t.box([d[0] + 1, 39, d[2] - 1, 41])) : null;
              if (band) t.sidePanel(saloon, "doorYellow", s, band, 0.014, 0.003);
              for (const [u0, u1] of [[d[0] + 1, mid - 0.5], [mid + 0.5, d[2] - 1]] as const) {
                const w = clip(t.box([u0, 30, u1, 39]));
                // a shallow frame: the leaf slides behind the skin, clear of the cabin wall
                if (w) t.m.scope("light", () => t.window(saloon, s, w, { frame: "seam", fw: 0.04, depth: 0.012 }));
              }
            },
          });
        }),
      ),
    );
    if (car.cabDoor) m.scope("cab door", () => {
      t.door(saloon, s, t.box(car.cabDoor!), "silver");
      t.window(saloon, s, t.box([10, 30, 16, 38]), { frame: "frame", fw: 0.04 });
    });
    m.scope("fleet number", () => t.inscription(saloon, s, t.fx(NUMBER_X[unit]), [{ text: METRO_NUMBERS[unit], y: t.fy(1.79), h: 0.12 }], 0.006, "marking"));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => {
    const v = e > 0 ? vols[0]! : saloon;
    if (head && e > 0) {
      // the cab front: the wide windscreen with the destination sign, the driver's window, the lamps low on the mask
      m.scope("windscreens", () => {
        for (const w of [[4, 30, 17, 39], [18, 30, 26, 39]] as PxBox[]) {
          t.endPaint(v, e, "seam", [w[0] - 0.4, w[1] - 0.4, w[2] + 0.4, w[3] + 0.4], 0.004);
          t.endPaint(v, e, "glass", w, 0.008);
        }
      });
      m.scope("destination sign", () => t.endPaint(v, e, "sign", [6, 36.6, 15, 38.4], 0.012));
      m.scope("lamps", () => {
        for (const u of [5, 25]) t.lamp(v, e, u, 45, 0.09, "lampHead");
        for (const u of [8.5, 21.5]) t.lamp(v, e, u, 45, 0.05, "lampRed");
      });
      m.scope("anticlimber", () => block(m, "anticlimber", t.fx(a + 0.02), t.fx(a) + 0.1, t.fy(0.74), t.fy(0.95), -1.0, 1.0));
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
    for (const x of VENTS) m.scope("vent", () => t.roofBox("roofBox", x - 0.35, x + 0.35, 3.66, 3.76, 0.25, 0.03));
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
  { id: "proc-vehicle-metro-81-71", game: { weight: 35, power: 300, maxspeed: 80, accel: null }, title: "Metro 81-71", build: metro8171, buildLod: metro8171Lod, params: METRO_PARAMS, catalog: METRO_CATALOG, references: "metro-81-71" },
];
