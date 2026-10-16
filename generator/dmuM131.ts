// The CSD M 131.1 "Hurvinek", the Tatra two-axle railcar of 1948-56, and the
// M 031 trailer vlakosimdb pairs it with: one design `veh-csd-m131` whose `unit`
// picks the motor car (default) or the trailer. Both share the rounded body; the
// trailer lacks the roof radiator, the exhausts and the engine.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/csd-m131/native
// (db/train/dmu/m131/csd_m131 and csd_m031): the XML section, the plan that
// rounds both ends in to 1.8 m and the elevation, windows, doors and lamps from
// native pixel boxes, 0.1 m a pixel, the length scaled to the published 12.1 m
// over the buffers. See docs/models/czech-dmus.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import { Car, DMU_CATALOG, buffersBoth, endItems, enumParam, exhaust, sideItems, sideNumber, underBoxes, type EndItem, type SideItem } from "./dmuKit.ts";

export type M131Unit = "motorCar" | "trailer";

export const M131_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car M 131.1",
    trailer: "Trailer M 031 (vlakosimdb)",
  }),
];

/** The published 12.1 m over the buffers over the XML's 11.5 m. */
export const K131 = 12.1 / 11.5;

/** M 131.1238 is preserved at Luzna u Rakovnika (assets/csd-m131/PHOTOS.md); the trailer's number follows vlakosimdb's M 031 label. */
export const M131_NUMBERS: Record<M131Unit, string> = { motorCar: "M 131.1238", trailer: "M 031.001" };

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });
const PALETTE: Record<string, MaterialSpec> = {
  red: c("#770000"),
  roofGrey: c("#a2a2a2", 0.7),
  doorRed: c("#550000"),
  yellow: c("#d9d900"),
  frameGrey: c("#808080", 0.5),
};

const SECTION: Pt[] = [[-1.4, 0.5], [1.4, 0.5], [1.5, 0.9], [1.5, 2.8], [1.4, 3.0], [1.3, 3.1], [1.1, 3.2], [0.4, 3.3], [-0.4, 3.3], [-1.1, 3.2], [-1.3, 3.1], [-1.4, 3.0], [-1.5, 2.8], [-1.5, 0.9]];
const PLAN: Pt[] = [[0.5, 0.9], [0.6, 1.1], [0.7, 1.2], [0.9, 1.3], [2.2, 1.5], [9.85, 1.5], [10.8, 1.3], [11.0, 1.2], [11.1, 1.1], [11.2, 0.9]];
const TOP: Pt[] = [[0.5, 2.8], [0.6, 3.0], [0.7, 3.1], [0.9, 3.2], [2.4, 3.3], [9.2, 3.3], [10.8, 3.2], [11.0, 3.1], [11.1, 3.0], [11.2, 2.8]];
const BOTTOM: Pt[] = [[0.5, 0.8], [0.6, 0.6], [1.0, 0.5], [1.1, 0.8], [10.6, 0.8], [10.7, 0.5], [11.1, 0.6], [11.2, 0.8]];

/** z_both, 140 x 50 px (14 x 5 m). */
const WINDOWS: SideItem[] = [
  ...[21, 35, 49, 63, 77].map((u): SideItem => ({ kind: "window", box: [u, 23, u + 9, 32], mat: "frameGrey" })),
  { kind: "window", box: [100, 23, 107, 32], mat: "frameGrey", name: "end window" },
];
const DOORS: Array<{ door: [number, number, number, number]; glass: [number, number, number, number] }> = [
  { door: [10, 23, 18, 42], glass: [12, 25, 16, 32] },
  { door: [90, 23, 98, 42], glass: [92, 25, 96, 32] },
];

/** x_both, 30 x 50 px: two windows, the end door with its window, a top lamp and the lamps either side. */
const FRONT: EndItem[] = [
  { kind: "window", box: [3, 23, 11, 32], mat: "frameGrey", name: "window" },
  { kind: "window", box: [19, 23, 27, 32], mat: "frameGrey", name: "window" },
  { kind: "lamp", box: [3.5, 36.5, 6.5, 39.5], name: "lamp" },
  { kind: "lamp", box: [23.5, 36.5, 26.5, 39.5], name: "lamp" },
  { kind: "lamp", box: [4, 34.5, 6, 36.2], name: "tail lamp", mat: "lampRed" },
  { kind: "lamp", box: [24, 34.5, 26, 36.2], name: "tail lamp", mat: "lampRed" },
  { kind: "panel", box: [5, 33.6, 10, 34.4], mat: "yellow", name: "stripe" },
  { kind: "panel", box: [20, 33.6, 25, 34.4], mat: "yellow", name: "stripe" },
];

export function m131(params?: ParamValues): MeshBuilder {
  const p = resolveParams(M131_PARAMS, params);
  const unit = p.unit as M131Unit;
  const motor = unit === "motorCar";
  const car = new Car(PALETTE, { kx: K131, ky: 1, kz: 1, centre: 5.85, sideH: 5, frontH: 5 });
  const m = car.m;
  const body = car.volume({ name: "body", section: SECTION, plan: PLAN, top: TOP, bottom: BOTTOM, bands: [[0.5, 2.9, "red"], [2.9, 3.3, "roofGrey"]] });
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, WINDOWS));
        m.scope("doors", () =>
          DOORS.forEach((d, i) =>
            m.scope(`door ${i + 1}`, () => {
              car.c.door(body, s, car.side(d.door), "doorRed", { seam: 0.025 });
              m.scope("glass", () => car.c.window(body, s, car.side(d.glass), { fw: 0.04, frame: "frameGrey" }));
            }),
          ),
        );
        m.scope("running number", () => sideNumber(car, body, s, [44, 33.5, 66, 35.5], M131_NUMBERS[unit], "yellow"));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      m.scope("end door", () => {
        // the end door stands 0.1 m proud of the rounded end (XML `dve`)
        const x = car.X(e > 0 ? 11.2 : 0.5);
        block(m, "doorRed", Math.min(x - e * 0.05, x + e * 0.1), Math.max(x - e * 0.05, x + e * 0.1), 0.9, 2.75, -0.3, 0.3);
      });
      m.scope("fittings", () => endItems(car, body, e, FRONT));
      m.scope("door window", () => {
        const x = car.X(e > 0 ? 11.2 : 0.5) + e * 0.1;
        block(m, "glass", Math.min(x, x + e * 0.01), Math.max(x, x + e * 0.01), 2.15, 2.6, -0.22, 0.22);
      });
      m.scope("top lamp", () => {
        const x = car.X(e > 0 ? 11.15 : 0.55);
        block(m, "lampWhite", Math.min(x, x + e * 0.08), Math.max(x, x + e * 0.08), 2.9, 3.15, -0.1, 0.1);
      });
    });
  m.scope("buffers", () => buffersBoth(car, [0.1, 11.6], [0.5, 11.2], 0.9));
  m.scope("running gear", () => {
    for (const [i, x] of [2.3, 9.0].entries()) m.scope(`axle ${i + 1}`, () => car.c.axle(car.sx(x), 0.45, 0.8));
  });
  if (motor) {
    m.scope("underframe", () =>
      underBoxes(car, [
        { name: "engine", x0: 3.7, x1: 6.0, y0: 0.3, y1: 0.79, hw: 0.9 },
        { name: "gearbox", x0: 7.1, x1: 7.7, y0: 0.25, y1: 0.79, hw: 0.5 },
      ]),
    );
    m.scope("roof equipment", () => {
      m.scope("radiator", () => block(m, "roofDark", car.X(2.6), car.X(9.5), 3.28, 3.5, -0.4, 0.4));
      for (const z of [-1.05, 1.05]) m.scope(z > 0 ? "right exhaust" : "left exhaust", () => exhaust(car, 1.75, z, 3.0, 3.5, 0.05));
    });
  } else m.scope("underframe", () => underBoxes(car, [{ name: "battery box", x0: 4.6, x1: 6.6, y0: 0.4, y1: 0.79, hw: 0.7, mat: "tank" }]));
  return m;
}

export const M131_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-csd-m131", title: "CSD M 131.1 Hurvinek", build: m131, params: M131_PARAMS, catalog: DMU_CATALOG, references: "csd-m131" },
];
