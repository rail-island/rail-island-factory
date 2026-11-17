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
import { resolveParams, type CatalogFields, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { articulate, Tram, TRAM_PALETTE, type Pt, type PxBox, type SourceVolume, type TramMap } from "./tramKit.ts";
import { tramLod } from "./lodTrams.ts";
import { LOD_GLASS, type LodSections } from "./lodKit.ts";
import { bogieParts, coachBody, fitUnit, sideGlass, turnBody, type UnitBody } from "./lodUnits.ts";

/** The game-catalog fields of the metro: rail vehicles in their own pool. */
export const METRO_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "metro",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** The cars; the design's `unit` also offers the full train ("train", `cars` long). */
export type MetroUnit = "headCar" | "middleCar";
/** The full train's car counts: a head car at each end, 0 .. 6 middle cars between. */
export const METRO_MIN_CARS = 2;
export const METRO_MAX_CARS = 8;
export type MetroLivery = "prague" | "budapest";

export const METRO_PARAMS: readonly ParamSpec[] = [{
  name: "unit",
  title: "Unit",
  values: [
    { value: "headCar", title: "Head car" },
    { value: "middleCar", title: "Middle car" },
    { value: "train", title: "Full train" },
  ],
  default: "headCar",
}, {
  name: "cars",
  title: "Cars",
  values: Array.from({ length: METRO_MAX_CARS - METRO_MIN_CARS + 1 }, (_, i) => ({ value: String(i + METRO_MIN_CARS), title: `${i + METRO_MIN_CARS} cars` })),
  default: "4",
  when: { name: "unit", values: ["train"] },
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
/** The corner radii (metres) of the side windows and of the lights in the doors, rounded as the photographs show them. */
const WINDOW_ROUND = 0.14;
const LIGHT_ROUND = 0.11;
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
  if (p.unit === "train") return metroTrainLod(Number(p.cars), METRO_LIVERIES[p.livery as MetroLivery]);
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

/** A car's tram builder, centred between its coupling planes; drawing into `m` (a train's builder) when given. */
function carTram(unit: MetroUnit, livery: MetroPaint, m?: MeshBuilder): Tram {
  const car = CARS[unit];
  const t = new Tram(livery.palette, { ...METRO_MAP, c: (car.couplers[0] + car.couplers[1]) / 2 });
  // a train's later cars draw into the first car's builder (the same palette)
  if (m) (t as unknown as { m: MeshBuilder }).m = m;
  return t;
}

export function metro8171(params?: ParamValues): MeshBuilder {
  const p = resolveParams(METRO_PARAMS, params);
  const livery = METRO_LIVERIES[p.livery as MetroLivery];
  if (p.unit === "train") return metroTrainModel(Number(p.cars), livery);
  const unit = p.unit as MetroUnit;
  const t = carTram(unit, livery);
  drawMetroCar(t, unit, livery);
  return t.m;
}

/** Draws one car, cab (if any) toward +X, centred between its coupling planes, through `t`. */
function drawMetroCar(t: Tram, unit: MetroUnit, livery: MetroPaint): void {
  const car = CARS[unit];
  const head = unit === "headCar";
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
    m.scope("windows", () => t.windows(saloon, s, car.windows, { frame: "frame", fw: 0.06, round: WINDOW_ROUND }));
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
                if (w) t.m.scope("light", () => t.window(saloon, s, w, { frame: "seam", fw: 0.04, depth: 0.012, round: LIGHT_ROUND }));
              }
            },
          });
        }),
      ),
    );
    if (car.cabDoor) m.scope("cab door", () => {
      t.door(saloon, s, t.box(car.cabDoor!), "silver");
      t.window(saloon, s, t.box([10, 30, 16, 38]), { frame: "frame", fw: 0.04, round: LIGHT_ROUND });
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
}

// ---------------------------------------------------------------------------
// The full train

/** A car over its coupling planes (m). */
export const METRO_CAR_LENGTH: Record<MetroUnit, number> = {
  headCar: (CARS.headCar.couplers[1] - CARS.headCar.couplers[0]) * METRO_MAP.kx,
  middleCar: (CARS.middleCar.couplers[1] - CARS.middleCar.couplers[0]) * METRO_MAP.kx,
};

/** The coupler's height, the hinge of the train's joints. */
const COUPLER_Y = 0.85 * METRO_MAP.ky;
/** The bellows over a gap between two cars: round the end door, inside the rounded corners. */
const METRO_BELLOWS: Array<[number, number]> = [[-0.5, 1.1], [0.5, 1.1], [0.5, 3.3], [-0.5, 3.3]];
const METRO_MAX_BEND = 10;
/** The distant model's cap: 100 triangles a car up to five cars. */
export const METRO_LOD = 500;

/** A car of a train: its span lo..hi over its coupling planes (model x) and whether it is turned. */
export interface MetroSlot {
  car: MetroUnit;
  lo: number;
  hi: number;
  turned: boolean;
}

/**
 * The cars of a train of `n`, front first: a head car at each end, the rear
 * one turned, middle cars between them (none in the two-car train). Each with
 * its span over its coupling planes, the train centred on x = 0.
 */
export function metroTrain(n: number): MetroSlot[] {
  if (!Number.isInteger(n) || n < METRO_MIN_CARS || n > METRO_MAX_CARS) throw new Error(`a metro 81-71 train of ${n} cars`);
  const cars = Array.from({ length: n }, (_, i): MetroUnit => (i === 0 || i === n - 1 ? "headCar" : "middleCar"));
  let hi = cars.reduce((t, car) => t + METRO_CAR_LENGTH[car], 0) / 2;
  return cars.map((car, i) => {
    const lo = hi - METRO_CAR_LENGTH[car];
    const out = { car, lo, hi, turned: i === n - 1 };
    hi = lo;
    return out;
  });
}

/** A car's end walls (its body's ends) as model x about its centre: the front (+X) and the rear one. */
function walls(unit: MetroUnit): [front: number, rear: number] {
  const car = CARS[unit];
  const c = (car.couplers[0] + car.couplers[1]) / 2;
  return [(c - car.ends[0]) * METRO_MAP.kx, (c - car.ends[1]) * METRO_MAP.kx];
}

/** A slot's end walls in the train, x0 (rear) and x1 (front). */
function slotWalls(slot: MetroSlot): [x0: number, x1: number] {
  const cx = (slot.lo + slot.hi) / 2;
  const [front, rear] = walls(slot.car);
  return slot.turned ? [cx - front, cx - rear] : [cx + rear, cx + front];
}

/** The train as one articulated vehicle: each car a section hinged at the coupling plane ahead of it, a bellows over each gap. */
function metroTrainModel(n: number, livery: MetroPaint): MeshBuilder {
  const slots = metroTrain(n);
  const first = carTram(slots[0]!.car, livery);
  const m = first.m;
  const sections = slots.map((slot, k) => {
    const t = k === 0 ? first : carTram(slot.car, livery, m);
    const cx = (slot.lo + slot.hi) / 2;
    const [x0, x1] = slotWalls(slot);
    return {
      x0,
      x1,
      draw: () => m.scope(`car ${k + 1}`, () => {
        // the car drawn about its own centre, moved to its place (and turned about it)
        const draw = () => m.moved(([x, y, z]) => [x + cx, y, z], () => drawMetroCar(t, slot.car, livery));
        if (slot.turned) m.turned(cx, draw);
        else draw();
      }),
    };
  });
  articulate({ m }, sections, COUPLER_Y, { profile: METRO_BELLOWS, folds: 3, depth: 0.03 }, METRO_MAX_BEND, slots.slice(0, -1).map((slot) => slot.lo));
  return m;
}

/** A car of the train from afar, section k: the body from its volumes (`inner` its ends hidden under the bellows, before a turn), the side windows and windscreen, the bogies. */
function metroCarLod(slot: MetroSlot, k: number, livery: MetroPaint, inner: { front: boolean; rear: boolean }) {
  const car = CARS[slot.car];
  const head = slot.car === "headCar";
  const t = carTram(slot.car, livery);
  const cx = (slot.lo + slot.hi) / 2;
  const [a, b] = car.ends;
  const vols = head
    ? [t.vol("cab", SECTION, car.body, a, 0.75, CAB_BANDS), t.vol("saloon", SECTION, car.body, 0.75, b, BANDS)]
    : [t.vol("saloon", SECTION, car.body, a, b, BANDS)];
  const windows = sideGlass(car.windows.map((w) => { const q = t.box(w); return { ...q, x0: q.x0 + cx, x1: q.x1 + cx }; }), 0.35);
  const screen = t.endBox([4, 30, 26, 39]);
  let body: UnitBody = coachBody(vols.map((v) => ({ v, X: (x: number) => x + cx })), {
    main: vols.length - 1, roof: "roof", windows, section: k,
    ...(head ? { frontWindows: [{ u: [screen.x0, screen.x1] as const, y: [screen.y0, screen.y1] as const, mat: LOD_GLASS }] } : {}),
  });
  body = { ...body, front: { ...body.front, hidden: inner.front || undefined }, rear: { ...body.rear, hidden: inner.rear || undefined } };
  if (slot.turned) body = turnBody(body, cx);
  const T = (x: number) => (slot.turned ? cx - x : cx + x);
  const bogies = bogieParts(car.bogies.map((x) => [T(t.fx(x)), METRO_WHEELBASE / 2 + METRO_WHEEL_R + 0.15, k] as const), t.fy(1.0));
  // the middle cars' bogies give way first
  return { body, parts: head ? bogies : bogies.map((part) => ({ ...part, optional: 5 })) };
}

function metroTrainLod(n: number, livery: MetroPaint): MeshBuilder {
  const slots = metroTrain(n);
  // in each car's own frame (before a turn): only a head car's cab end shows
  const built = slots.map((slot, k) => metroCarLod(slot, k, livery, { front: slot.car !== "headCar", rear: true }));
  const w = slots.map(slotWalls);
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, COUPLER_Y, 0])),
    joints: slots.slice(0, -1).map((_, i) => ({ sections: [i, i + 1] as [number, number], front: w[i]![0], rear: w[i + 1]![1], profile: METRO_BELLOWS })),
    maxBendDeg: METRO_MAX_BEND,
    material: "bellows",
  };
  return fitUnit({ palette: { ...TRAM_PALETTE, ...livery.palette }, bodies: built.map((c) => c.body), parts: built.flatMap((c) => c.parts), sections }, Math.min(METRO_LOD, 100 * n));
}

// ---------------------------------------------------------------------------
// What the game needs

/** Every car is a motor car: 35 t and 300 kW each (the design's figures), the train their sums. */
const CAR_WEIGHT = 35;
const CAR_POWER = 300;

function metroGame(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const livery of Object.keys(METRO_LIVERIES) as MetroLivery[]) {
    const base: ParamValues = livery === "prague" ? {} : { livery };
    for (let n = METRO_MIN_CARS; n <= METRO_MAX_CARS; n++)
      // the default four cars are named by the unit alone
      variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" }, weight: n * CAR_WEIGHT, power: n * CAR_POWER });
  }
  return { weight: CAR_WEIGHT, power: CAR_POWER, maxspeed: 80, accel: null, variants };
}

export const METRO_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-metro-81-71", game: metroGame(), title: "Metro 81-71", build: metro8171, buildLod: metro8171Lod, lodTriangles: METRO_LOD, params: METRO_PARAMS, catalog: METRO_CATALOG, references: "metro-81-71" },
];
