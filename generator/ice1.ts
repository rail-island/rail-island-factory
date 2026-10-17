// The ICE 1, Deutsche Bahn's first high-speed train (1989-1993): one design
// `veh-ice-1` whose `unit` picks the car - the class 401 power car with its cab
// at +X (the default), a class 802 intermediate coach, or the class 804
// restaurant car with its raised roof. A train is two power cars, one facing
// each way, with nine to twelve intermediate cars between them.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/ice-1/native
// (db/train/emu/ice/ice loco, ice car, ice restaurant): the XML `alongx`
// sections, the `alongz` elevations (the power car's sloped nose and its
// skirts, the restaurant's raised roof) and the windows, doors, grilles and the
// red stripe laid from native pixel boxes, 0.1 m a pixel. Lengths are the
// published ones (power car 20.56 m, coaches 26.40 m over couplers), width
// 3.02 m, heights 3.84 m and 4.295 m; bogie pivots 11.46 m on the
// power car (published) and 19.0 m on the coaches. See docs/models/foreign-units.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { centreCoupler, EMU_CATALOG, enumParam, pantograph, slopePanel } from "./emuParts.ts";
import { bOf, roofBox, sideBox, spacedLetters, unitBogie, type PxBox, type SideMap } from "./unitParts.ts";

export type Ice1Unit = "powerCar" | "coach" | "restaurant";

export const ICE1_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    powerCar: "Power car",
    coach: "Coach",
    restaurant: "Restaurant car",
  }),
];

/** The power car's BMPs are 38 rows for its 3.84 m: rows are scaled by 3.84 / 3.8. */
export const ICE1_K_Y = 3.84 / 3.8;

const PALETTE: Record<string, MaterialSpec> = {
  white: { color: "#f4f4f2", roughness: 0.45 },
  red: { color: "#e3000f", roughness: 0.45 },
  pink: { color: "#ffbfbf", roughness: 0.5 },
  skirt: { color: "#c0c0c0", roughness: 0.6 },
  band: { color: "#5a5a5a", roughness: 0.5 },
  glass: { color: "#141414", metallic: 0.2, roughness: 0.12 },
  cabGlass: { color: "#26303a", metallic: 0.2, roughness: 0.12 },
  frame: { color: "#3a3a3a", roughness: 0.5 },
  seam: { color: "#b0b0a0", roughness: 0.7 },
  grille: { color: "#808080", roughness: 0.7 },
  slat: { color: "#5a5a5a", roughness: 0.7 },
  roofGrey: { color: "#c0c0c0", roughness: 0.6 },
  platform: { color: "#b0b0a0", roughness: 0.7 },
  lettering: { color: "#c0c0c0", roughness: 0.5 },
  lampYellow: { color: "#f2f0c8", roughness: 0.2 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  pantograph: { color: "#5a5d63", metallic: 0.2, roughness: 0.6 },
  carbon: { color: "#2b2b2b", roughness: 0.8 },
  insulator: { color: "#c8c8c0", roughness: 0.4 },
  coupler: { color: "#3a3c3f", metallic: 0.3, roughness: 0.5 },
  motor: { color: "#2e3033", roughness: 0.8 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  equipment: { color: "#3b3d40", roughness: 0.8 },
};

/** The train's published 3.02 m (the power car is given as "up to 3.07 m"; with its fittings the 3.1 m envelope holds). */
const POWER_K_Z = 3.02 / 3.0;
const COACH_K_Z = 3.02 / 3.0;
/** The XML section (alongx), its width scaled; the restaurant's roof rises to 4.3 m. */
const section = (kz: number, roof: Pt[]): Pt[] => {
  const half: Pt[] = [[1.0, 0], [1.3, 0.4], [1.5, 0.9], [1.5, 3.3], [1.3, 3.6], ...roof];
  const right = half.map(([z, y]): Pt => [z * kz, y]);
  return [...right.map(([z, y]): Pt => [-z, y]).reverse(), ...right].filter((p, i, a) => i === 0 || p[0] !== a[i - 1]![0] || p[1] !== a[i - 1]![1]);
};
const POWER_SECTION = section(POWER_K_Z, [[0.9, 3.8]]);
const COACH_SECTION = section(COACH_K_Z, [[0.9, 3.8]]);
const RESTAURANT_SECTION = section(COACH_K_Z, [[0.7, 4.3]]);

/** The paint: grey skirts, white, the pale pink line under the red stripe (rows 26..27 of the power car, 31..32 of the coaches). */
const powerBands = (): Array<[number, number, string]> => [[0.1, 0.5, "skirt"], [0.5, 1.11, "white"], [1.11, 1.21, "pink"], [1.21, 1.52, "red"], [1.52, 3.8, "white"]];
const coachBands = (top: number): Array<[number, number, string]> => [[0.1, 0.5, "skirt"], [0.5, 1.1, "white"], [1.1, 1.2, "pink"], [1.2, 1.5, "red"], [1.5, top, "white"]];

interface CarLayout {
  key: string;
  map: SideMap;
  length: number;
  section: Pt[];
  kZ: number;
}

/** Power car: the nose tip at source x 0 is +X, 20.55 m from the rear coupler face; the front logo makes the 20.56 m. */
const POWER_MAP: SideMap = { x0: 20.55, H: 3.8, kY: ICE1_K_Y };
/** Coaches: 26.4 m over the couplers, source x 0 .. 26.4. */
const COACH_MAP: SideMap = { x0: 26.4, H: 4.3 };

const LAYOUTS: Record<Ice1Unit, CarLayout> = {
  powerCar: { key: "ice_loco", map: POWER_MAP, length: 20.56, section: POWER_SECTION, kZ: POWER_K_Z },
  coach: { key: "ice_car", map: COACH_MAP, length: 26.4, section: COACH_SECTION, kZ: COACH_K_Z },
  restaurant: { key: "ice_restaurant", map: COACH_MAP, length: 26.4, section: RESTAURANT_SECTION, kZ: COACH_K_Z },
};

export const ICE1_MAPS: Record<Ice1Unit, SideMap> = { powerCar: POWER_MAP, coach: COACH_MAP, restaurant: COACH_MAP };
export function ice1Length(unit: Ice1Unit): number {
  return LAYOUTS[unit].length;
}

/** Power car bogies: 11.46 m apart (published), centred on vlakosimdb's (2.6..6.8, 15.1..19.5); 3.0 m wheelbase, 1040 mm wheels. */
export const ICE1_POWER_BOGIES: [number, number] = [5.27, 16.73];
/** Coach bogies: 19.0 m apart on the 26.4 m car, 2.5 m wheelbase, 920 mm wheels. */
export const ICE1_COACH_BOGIES: [number, number] = [3.7, 22.7];

/** A car of the ICE 1. */
export function ice1(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(ICE1_PARAMS, params).unit as Ice1Unit;
  return unit === "powerCar" ? powerCar() : coach(unit);
}

/** A polyline (source x, y) with extra stations where it crosses the bands' edges. */
function withEdges(pts: Pt[], bands: Array<[number, number, string]>): Pt[] {
  const out = [...pts];
  for (const [y] of bands.slice(1))
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, ya] = pts[i]!;
      const [xb, yb] = pts[i + 1]!;
      if ((y - ya) * (y - yb) < -1e-9) out.push([xa + ((y - ya) / (yb - ya)) * (xb - xa), y]);
    }
  return out;
}

function powerCar(): MeshBuilder {
  const L = LAYOUTS.powerCar;
  const c = new Coach(PALETTE, L.length / 2);
  const m = c.m;
  const B = (x: number) => bOf(L.map, x);
  const asc = (pts: Pt[]) => pts.map(([x, y]): Pt => [B(x), y]).sort((a, b) => a[0] - b[0]);
  const box = (b: PxBox) => sideBox(L.map, b);
  const bands = powerBands();
  const [b1, b2] = ICE1_POWER_BOGIES;
  const body: Volume = {
    name: "body",
    section: L.section,
    // the XML plan's rounded nose (half widths 1.1, 1.3, 1.5 at 0, 0.1, 0.3 m)
    plan: asc([[0, 1.1 * POWER_K_Z], [0.1, 1.3 * POWER_K_Z], [0.3, 1.5 * POWER_K_Z], [20.5, 1.5 * POWER_K_Z]]),
    top: asc(withEdges([[0, 1.4], [0.3, 1.8], [2.5, 3.6], [3.3, 3.8], [20.5, 3.8]], bands)),
    // the nose's undercut, the skirts down to 0.1 m and open over the bogies
    bottom: asc(withEdges([[0, 0.9], [0.4, 0.3], [0.9, 0.1], [b1 - 2.07, 0.1], [b1 - 2.02, 0.5], [b1 + 2.02, 0.5], [b1 + 2.07, 0.1], [b2 - 2.07, 0.1], [b2 - 2.02, 0.5], [b2 + 2.02, 0.5], [b2 + 2.07, 0.1], [20.5, 0.1]], bands)),
    bands,
  };
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab window", () => c.window(body, s, box([19, 9, 23, 13]), { frame: "frame", glass: "cabGlass", fw: 0.05 }));
        m.scope("grilles", () => ([[35, 7, 48, 13], [49, 7, 62, 13], [160, 7, 173, 14], [174, 7, 187, 14]] as PxBox[]).forEach((g, i) => m.scope(`grille ${i + 1}`, () => grille(c, body, s, box(g)))));
        m.scope("door", () => c.door(body, s, box([62, 14, 71, 28]), "bands", { seam: 0.02 }));
        m.scope("logo", () => {
          c.sidePanel(body, "white", s, box([178.5, 23.2, 185.5, 26.8]), 0.006, 0.004);
          c.sidePanel(body, "red", s, box([179.5, 23.8, 184.5, 26.2]), 0.01, 0.003);
        });
        m.scope("lettering", () => {
          const b = box([90, 7, 112, 20]);
          spacedLetters(c, body, s, "ICE", b, "lettering", 0.006);
        });
      });
  });
  m.scope("cab", () => {
    const X = (x: number) => c.X(B(x));
    const slope = { x0: X(0.3), y0: 1.8, x1: X(2.5), y1: 3.6 };
    const lower = { x0: X(0), y0: 1.4, x1: X(0.3), y1: 1.8 };
    const face = { x0: X(0), y0: 0.9, x1: X(0), y1: 1.4 };
    m.scope("windscreen", () => {
      slopePanel(m, "frame", 1, slope, -1.18, 1.18, 2.3, 3.32, 0.006, 0.01);
      slopePanel(m, "cabGlass", 1, slope, -1.12, 1.12, 2.36, 3.26, 0.014, 0.006);
    });
    // x_inc rows 21..22: the headlights (columns 3..10, 21..28) and the grille between them
    m.scope("lamps", () => {
      for (const [k, s] of [-1, 1].entries())
        m.scope(`lamp ${k + 1}`, () => {
          slopePanel(m, "frame", 1, lower, s * 0.55, s * 1.25, 1.52, 1.74, 0.006, 0.01);
          slopePanel(m, "lampYellow", 1, lower, s * 0.83, s * 1.17, 1.55, 1.71, 0.014, 0.006);
          slopePanel(m, "lampRed", 1, lower, s * 0.61, s * 0.77, 1.57, 1.69, 0.014, 0.006);
        });
      slopePanel(m, "frame", 1, lower, -0.4, 0.4, 1.56, 1.7, 0.008, 0.01);
      for (const y of [1.585, 1.625, 1.665]) slopePanel(m, "grille", 1, lower, -0.36, 0.36, y, y + 0.018, 0.012, 0.004);
    });
    m.scope("logo", () => {
      slopePanel(m, "white", 1, face, -0.28, 0.28, 1.23, 1.39, 0.006, 0.004);
      slopePanel(m, "red", 1, face, -0.22, 0.22, 1.26, 1.36, 0.01, 0.003);
    });
  });
  m.scope("rear end", () => {
    const wall = B(20.5);
    m.scope("end door", () => c.door(body, -1, { x0: -0.35, x1: 0.35, y0: 1.2, y1: 3.0 }, "white", { end: true, seam: 0.02 }));
    m.scope("tail lamps", () => {
      for (const z of [-1.0, 1.0]) {
        const lens = ngon(10, 0.07, 0, z, 1.65);
        m.sweep("lampRed", "x", lens, c.X(wall) - 0.002, lens, c.X(wall) - 0.03);
      }
    });
    m.scope("coupler", () => centreCoupler(m, -1, c.X(wall + 0.9), c.X(0), 1.0));
  });
  m.scope("roof equipment", () => {
    const X = (x: number) => c.X(B(x));
    m.scope("hatches", () => {
      roofBox(m, "roofGrey", X(3.6), X(6.3), 3.79, 1.4, 0.05, 0.05);
      roofBox(m, "roofGrey", X(6.8), X(14.5), 3.79, 1.4, 0.05, 0.05);
    });
    m.scope("platform", () => roofBox(m, "platform", X(14.5), X(19.7), 3.79, 1.6, 0.04, 0.03));
    m.scope("pantographs", () => m.scope("pantograph", () => pantograph(m, { x: X(17.4), roof: 3.83, hinge: -1, raised: true, rise: 1.2 })));
  });
  m.scope("running gear", () => {
    ICE1_POWER_BOGIES.forEach((x, i) => m.scope(`bogie ${i + 1}`, () => unitBogie(c, c.X(B(x)), { wb: 3.0, r: 0.52, motor: true, top: 0.6, frame: 1.0 })));
    m.scope("transformer", () => block(m, "equipment", c.X(B(12.6)), c.X(B(9.4)), 0.25, 0.5, -1.1, 1.1));
  });
  return m;
}

function coach(unit: "coach" | "restaurant"): MeshBuilder {
  const L = LAYOUTS[unit];
  const c = new Coach(PALETTE, L.length / 2);
  const m = c.m;
  const B = (x: number) => bOf(L.map, x);
  const asc = (pts: Pt[]) => pts.map(([x, y]): Pt => [B(x), y]).sort((a, b) => a[0] - b[0]);
  const box = (b: PxBox) => sideBox(L.map, b);
  const roof = unit === "restaurant" ? 4.3 : 3.8;
  const bands = coachBands(roof);
  const [b1, b2] = ICE1_COACH_BOGIES;
  const body: Volume = {
    name: "body",
    section: L.section,
    plan: asc([[0.15, 1.5 * L.kZ], [26.25, 1.5 * L.kZ]]),
    // the restaurant's raised roof (XML: 3.8 m at the ends, 4.3 m from 2.0 to 24.4 m)
    ...(unit === "restaurant" ? { top: asc([[0.15, 3.8], [2.0, 4.3], [24.4, 4.3], [26.25, 3.8]]) } : {}),
    bottom: asc([[0.15, 0.1], [b1 - 1.85, 0.1], [b1 - 1.8, 0.5], [b1 + 1.8, 0.5], [b1 + 1.85, 0.1], [b2 - 1.85, 0.1], [b2 - 1.8, 0.5], [b2 + 1.8, 0.5], [b2 + 1.85, 0.1], [26.25, 0.1]]),
    bands,
  };
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => coachSide(c, body, unit, s, box));
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const wall = e > 0 ? B(0.15) : B(26.25);
      const face = e > 0 ? L.length : 0;
      m.scope("gangway", () => {
        const [a, b] = [c.X(wall) - e * 0.02, c.X(face) - e * 0.01].sort((p, q) => p - q) as [number, number];
        for (const z of [-1, 1]) block(m, "rubber", a, b, 1.15, 3.35, ...side(z, 0.5, 0.72));
        block(m, "rubber", a, b, 3.15, 3.35, -0.5, 0.5);
        block(m, "rubber", a, b, 1.15, 1.3, -0.5, 0.5);
      });
      m.scope("coupler", () => centreCoupler(m, e, c.X(wall - e * 0.9), c.X(face), 0.95));
    });
  m.scope("running gear", () => {
    ICE1_COACH_BOGIES.forEach((x, i) => m.scope(`bogie ${i + 1}`, () => unitBogie(c, c.X(B(x)), { wb: 2.5, r: 0.46, top: 0.55, air: true, frame: 1.0 })));
    m.scope("underframe", () => {
      block(m, "equipment", c.X(B(15.8)), c.X(B(10.6)), 0.2, 0.5, -1.0, 1.0);
    });
  });
  return m;
}

/** A coach's side: the dark window band and its glass, the doors, the logo; the restaurant's dining windows, clerestory and kitchen door. */
function coachSide(c: Coach, v: Volume, unit: "coach" | "restaurant", s: number, box: (b: PxBox) => Box): void {
  const m = c.m;
  const glass = (b: PxBox) => c.sidePanel(v, "glass", s, box(b), 0.014, 0.004);
  if (unit === "coach") {
    m.scope("window band", () => c.sidePanel(v, "band", s, box([15, 13, 250, 22]), 0.006, 0.02));
    m.scope("windows", () =>
      ([[23, 27], [35, 39], [45, 60], [66, 81], [87, 102], [108, 123], [129, 144], [150, 165], [171, 186], [192, 207], [213, 228], [234, 247]] as const).forEach(([a, b], i) =>
        m.scope(`window ${i + 1}`, () => glass([a, 14, b, 21])),
      ),
    );
  } else {
    const dining: Array<[number, number]> = [[22, 37], [43, 58], [64, 79], [165, 180], [186, 201], [207, 222], [228, 243]];
    m.scope("window bands", () => {
      c.sidePanel(v, "band", s, box([21, 13, 80, 22]), 0.006, 0.02);
      c.sidePanel(v, "band", s, box([164, 13, 244, 22]), 0.006, 0.02);
    });
    m.scope("windows", () => dining.forEach(([a, b], i) => m.scope(`window ${i + 1}`, () => glass([a, 14, b, 21]))));
    // rows 3..5: the clerestory lights in the raised roof's sides
    m.scope("clerestory", () => dining.forEach(([a, b], i) => m.scope(`light ${i + 1}`, () => c.sidePanel(v, "glass", s, box([a, 3, b, 5]), 0.01, 0.004))));
    m.scope("kitchen door", () => {
      c.door(v, s, box([151, 9, 160, 36]), "bands", { seam: 0.02 });
      glass([153, 12, 158, 23]);
    });
    m.scope("restaurant stripe", () => c.sidePanel(v, "red", s, box([95, 15, 138, 17]), 0.006, 0.003));
  }
  m.scope("doors", () =>
    ([[4, 13], [252, 261]] as const).forEach(([a, b], i) =>
      m.scope(`door ${i + 1}`, () => {
        c.door(v, s, box([a, 9, b, 36]), "bands", { seam: 0.02 });
        glass([a + 2, 12, b - 2, 23]);
      }),
    ),
  );
  m.scope("logo", () => {
    c.sidePanel(v, "white", s, box([40.5, 28.2, 47.5, 31.8]), 0.006, 0.004);
    c.sidePanel(v, "red", s, box([41.5, 28.8, 46.5, 31.2]), 0.01, 0.003);
  });
}

/** A grille: a frame and horizontal slats. */
function grille(c: Coach, v: Volume, s: number, b: Box): void {
  c.sidePanel(v, "grille", s, b, 0.006, 0.02);
  const n = Math.max(2, Math.round((b.y1 - b.y0) / 0.1));
  for (let i = 0; i < n; i++) {
    const y0 = b.y0 + 0.04 + ((b.y1 - b.y0 - 0.08) * i) / n;
    c.sidePanel(v, "slat", s, { x0: b.x0 + 0.04, x1: b.x1 - 0.04, y0, y1: y0 + ((b.y1 - b.y0 - 0.08) / n) * 0.5 }, 0.012, 0.006);
  }
}

export const ICE1_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-ice-1", title: "ICE 1", build: ice1, params: ICE1_PARAMS, catalog: EMU_CATALOG, references: "ice-1" },
];
