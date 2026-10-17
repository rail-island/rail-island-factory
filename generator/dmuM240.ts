// The CSD M 240.0 "Singrovka" (later CD/ZSSK 820), the Vagonka Tatra Studenka
// bogie railcar of 1959-64 with a cab at each end: one fixed design
// `veh-csd-m240`.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/csd-m240/native
// (db/train/dmu/csd_m240): the XML section, the plan that rounds both ends in to
// 1.2 m, the roof's elevation and the central skirt, windows, doors and lamps
// from native pixel boxes, 0.1 m a pixel, the length scaled to the published
// 18.5 m over the buffers. The XML's 0.1 m rake of the ends above 1.9 m is left
// out, so the end windows lie on the end's own plan. See docs/models/czech-dmus.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./csdCoachParts.ts";
import type { ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import { Car, DMU_CATALOG, DMU_PALETTE, buffersBoth, endItems, exhaust, sideItems, sideNumber, underBoxes, type CarFrame, type EndItem, type PxBox, type SideItem } from "./dmuKit.ts";
import type { Volume } from "./csdCoachParts.ts";
import { lodSideBox } from "./lodKit.ts";
import { bogieParts, dmuBody, fitUnit } from "./lodUnits.ts";

/** The published 18.5 m over the buffers over the XML's 19.0 m. */
export const K240 = 18.5 / 19.0;
/** M 240.0113 is preserved in running order (assets/csd-m240/PHOTOS.md). */
export const M240_NUMBER = "M 240.0113";

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });
const PALETTE: Record<string, MaterialSpec> = {
  red: c("#80080f"),
  cream: c("#f0f7bf"),
  roofCream: c("#d9dcae", 0.7),
  frameGrey: c("#c0c7c0", 0.45),
  doorGrey: c("#808080", 0.5),
  doorRed: c("#6e0710"),
};

const SECTION: Pt[] = [[-1.4, 0.5], [-1.3, 0.4], [1.3, 0.4], [1.4, 0.5], [1.5, 0.8], [1.5, 3.2], [1.4, 3.5], [1.2, 3.6], [0, 3.7], [-1.2, 3.6], [-1.4, 3.5], [-1.5, 3.2], [-1.5, 0.8]];
const PLAN: Pt[] = [[0.4, 0.6], [0.5, 1.1], [0.7, 1.4], [1.2, 1.5], [17.9, 1.5], [18.4, 1.4], [18.6, 1.1], [18.7, 0.6]];
const TOP: Pt[] = [[0.4, 3.2], [0.7, 3.4], [1.2, 3.6], [2.0, 3.7], [17.1, 3.7], [17.9, 3.6], [18.4, 3.4], [18.7, 3.2]];
/** The floor at 0.8 m, the end steps down to 0.5 m and the central skirt (XML 5.0..14.1 m) down to 0.4 m. */
const BOTTOM: Pt[] = [[0.4, 0.8], [0.5, 0.6], [0.6, 0.5], [1.1, 0.5], [1.3, 0.8], [5.0, 0.8], [5.3, 0.4], [13.8, 0.4], [14.1, 0.8], [17.8, 0.8], [18.0, 0.5], [18.5, 0.5], [18.6, 0.6], [18.7, 0.8]];

/** z_both, 191 x 40 px (19.1 x 4 m). */
const WINDOWS: SideItem[] = [
  { kind: "window", box: [7, 10, 11, 21], mat: "frameGrey", name: "cab window" },
  { kind: "window", box: [180, 10, 184, 21], mat: "frameGrey", name: "cab window" },
  ...[46, 170].map((u): SideItem => ({ kind: "window", box: [u, 10, u + 7, 21], mat: "frameGrey", name: "end window" })),
  { kind: "window", box: [70, 11, 74, 21], mat: "frameGrey", name: "narrow window" },
  ...[81, 97, 113, 138, 154].map((u): SideItem => ({ kind: "window", box: [u, 10, u + 13, 21], mat: "frameGrey", sash: 16 })),
];
const DOORS: Array<{ door: PxBox; glass: PxBox[] }> = [
  { door: [14, 10, 21, 32], glass: [[15, 11, 20, 20]] },
  { door: [24, 9, 36, 32], glass: [[26, 12, 29, 20], [31, 12, 34, 20]] },
  { door: [55, 10, 63, 32], glass: [[57, 12, 61, 20]] },
  { door: [128, 10, 136, 32], glass: [[130, 12, 134, 20]] },
];

/** x_both, 30 x 40 px. */
const FRONT: EndItem[] = [
  { kind: "window", box: [0.5, 10, 10, 21], mat: "frameGrey", name: "window" },
  { kind: "window", box: [20, 10, 29.5, 21], mat: "frameGrey", name: "window" },
  { kind: "panel", box: [10.5, 10, 19.5, 29], mat: "doorGrey", name: "door frame", proud: 0.006 },
  { kind: "panel", box: [11.2, 10.9, 18.8, 28.3], mat: "doorRed", name: "door leaf", proud: 0.009 },
  { kind: "window", box: [12, 11, 18, 18], mat: "frameGrey", name: "door window", fw: 0.04 },
  { kind: "lamp", box: [4, 24, 7, 27], name: "lamp" },
  { kind: "lamp", box: [23, 24, 26, 27], name: "lamp" },
];

/** The frame of the native canvases and the body. */
const FRAME_240: CarFrame = { kx: K240, ky: 1, kz: 1, centre: 9.55, sideH: 4, frontH: 4 };
const BODY_240: Volume = { name: "body", section: SECTION, plan: PLAN, top: TOP, bottom: BOTTOM, bands: [[0.4, 0.9, "cream"], [0.9, 1.85, "red"], [1.85, 3.25, "cream"], [3.25, 3.7, "roofCream"]] };

export function m240(): MeshBuilder {
  const car = new Car(PALETTE, FRAME_240);
  const m = car.m;
  const body = car.volume(BODY_240);
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, WINDOWS));
        m.scope("doors", () =>
          DOORS.forEach((d, i) =>
            m.scope(`door ${i + 1}`, () => {
              car.c.door(body, s, car.side(d.door), "bands", { seam: 0.025 });
              d.glass.forEach((g, j) => m.scope(`glass ${j + 1}`, () => car.c.window(body, s, car.side(g), { fw: 0.035, frame: "frameGrey" })));
            }),
          ),
        );
        m.scope("running number", () => sideNumber(car, body, s, [84, 24, 104, 27], M240_NUMBER, "cream"));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      endItems(car, body, e, FRONT);
      // the headlamp on the roof dome over the end door (x_both rows 4..8)
      m.scope("top lamp", () => {
        const x = car.X(e > 0 ? 18.7 - 0.02 : 0.42);
        block(m, "lampWhite", Math.min(x, x - e * 0.2), Math.max(x, x - e * 0.2), 3.22, 3.58, -0.2, 0.2);
      });
    });
  m.scope("buffers", () => buffersBoth(car, [0.05, 19.05], [0.4, 18.7], 0.9));
  m.scope("running gear", () => {
    // a trailing bogie under the -X end and the powered one (B') under the +X end
    m.scope("bogie 1", () => car.c.bogie(car.sx(3.2), 2.0, 0.45, 0.8));
    m.scope("bogie 2", () => {
      car.c.bogie(car.sx(15.9), 2.1, 0.45, 0.8);
      m.scope("final drives", () => {
        for (const d of [-0.5, 0.5]) block(m, "engine", car.X(15.9) + d - 0.17, car.X(15.9) + d + 0.17, 0.3, 0.62, -0.45, 0.45);
      });
    });
  });
  m.scope("underframe", () => underBoxes(car, [{ name: "air tanks", x0: 2.0, x1: 2.5, y0: 0.6, y1: 0.79, hw: 0.4, mat: "tank" }]));
  m.scope("roof equipment", () => {
    m.scope("ventilators", () => {
      for (const [i, x] of [2.85, 4.75, 6.65, 8.55, 10.45, 12.35, 14.25, 16.15].entries())
        m.scope(`ventilator ${i + 1}`, () => block(m, "frameGrey", car.X(x - 0.3), car.X(x + 0.3), 3.66, 3.82, -0.12, 0.12));
    });
    m.scope("exhaust", () => exhaust(car, 3.9, 1.32, 3.2, 3.75, 0.06));
  });
  return m;
}

/**
 * The M 240.0 for distant views (lodUnits.ts): the body with its rounded plan
 * and roof ends over the bogies, its low floor between them as a cream block,
 * the end windows and door as one windscreen, the side window band and the
 * bogies.
 */
export function m240Lod(): MeshBuilder {
  const X = (x: number) => (x - FRAME_240.centre) * K240;
  const body = dmuBody(FRAME_240, BODY_240, { y0: 0.8, items: WINDOWS, cabs: [-1, 1], cabItems: FRONT });
  return fitUnit({
    palette: { ...DMU_PALETTE, ...PALETTE },
    bodies: [body],
    parts: [
      ...bogieParts([[X(3.2), 1.65], [X(15.9), 1.7]], 0.8),
      { draw: (m) => m.scope("low floor", () => lodSideBox(m, "cream", [[X(5.0), 0.8], [X(5.3), 0.4], [X(13.8), 0.4], [X(14.1), 0.8]], -1.3, 1.3, false)) },
    ],
  }, 100);
}

export const M240_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-csd-m240", game: { weight: 37, power: 250, maxspeed: 70, accel: null }, title: "CSD M 240.0 Singrovka", build: m240, buildLod: m240Lod, catalog: DMU_CATALOG, references: "csd-m240" },
];
