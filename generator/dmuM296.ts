// The CSD M 296.1 "hydra", the Vagonka Studenka diesel-hydraulic express
// railcar of 1969-70, renumbered CD 853 in 1988 and rebuilt as the CD 854 from
// 1997: one design `veh-csd-m296` whose `variant` picks the M 296.1 in its CSD
// paint (default), the CD 853 or the rebuilt CD 854. All three share the body;
// the 854 has its own window layout and paint.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/csd-m296/native
// (db/train/dmu/csd_m296, csd_853 and cd_854): the M 296's XML section, plan and
// elevation for all three (vlakosimdb's 853 and 854 XML is a plain box of the
// same size), windows, doors, the roof radiator and lamps from native pixel
// boxes, 0.1 m a pixel, the length scaled to the published 24.79 m over the
// buffers and the bogies set to the published 17.2 m pivots and 2.4 m wheelbase.
// See docs/models/czech-dmus.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import {
  Car, DMU_CATALOG, buffersBoth, endItems, enumParam, exhaust, sideEmblem, sideItems, sideNumber, tractionNumber, underBoxes,
  type EndItem, type PxBox, type SideItem,
} from "./dmuKit.ts";

export type M296Variant = "m296" | "cd853" | "cd854";

export const M296_PARAMS: readonly ParamSpec[] = [
  enumParam("variant", "Vehicle", {
    m296: "CSD M 296.1 (1969)",
    cd853: "CD 853 (renumbered, 1988)",
    cd854: "CD 854 (rebuilt, 1997)",
  }),
];

/** The published 24.79 m over the buffers over the XML's 24.6 m. */
export const K296 = 24.79 / 24.6;
/** The source x of the car's centre (XML buffers at 0.15 and 24.75 m). */
const CENTRE = 12.45;
/** Published bogie pivots and wheelbase (m). */
export const M296_PIVOTS = 17.2;
export const M296_WHEELBASE = 2.4;

/** M 296.1028 and 853 029 / 854 032 are photographed (assets/csd-m296/PHOTOS.md). */
export function m296Number(v: M296Variant): string {
  return v === "m296" ? "M 296.1028" : v === "cd853" ? tractionNumber("853", "029") : tractionNumber("854", "032");
}

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });

interface Paint {
  palette: Record<string, MaterialSpec>;
  bands: Array<[number, number, string]>;
}

// native z_both colours
const PAINTS: Record<M296Variant, Paint> = {
  m296: {
    palette: { red: c("#b0080f"), cream: c("#ffffbf"), roofGrey: c("#909090", 0.7), frameGrey: c("#c0c7c0", 0.45), doorRed: c("#8a0a10") },
    bands: [[0.9, 2.0, "red"], [2.0, 3.2, "cream"], [3.2, 3.3, "red"], [3.3, 4.1, "roofGrey"]],
  },
  cd853: {
    palette: { red: c("#b50808"), cream: c("#ffffbd"), roofGrey: c("#909090", 0.7), frameGrey: c("#c6c6c6", 0.45), doorRed: c("#8c0808") },
    bands: [[0.9, 2.0, "red"], [2.0, 3.2, "cream"], [3.2, 3.3, "red"], [3.3, 4.1, "roofGrey"]],
  },
  cd854: {
    palette: { red: c("#d60000"), cream: c("#ffffce"), roofGrey: c("#acacac", 0.7), frameGrey: c("#c5c5c5", 0.45), doorRed: c("#a51919") },
    bands: [[0.9, 1.25, "red"], [1.25, 1.85, "cream"], [1.85, 3.3, "red"], [3.3, 4.1, "roofGrey"]],
  },
};

const SECTION: Pt[] = [[-1.1, 0.3], [1.1, 0.3], [1.5, 0.5], [1.5, 3.2], [1.4, 3.6], [1.2, 3.8], [0.8, 4.0], [0, 4.1], [-0.8, 4.0], [-1.2, 3.8], [-1.4, 3.6], [-1.5, 3.2], [-1.5, 0.5]];
const PLAN: Pt[] = [[0.6, 0.8], [0.7, 1.2], [0.9, 1.4], [1.2, 1.5], [23.6, 1.5], [24.0, 1.4], [24.2, 1.2], [24.3, 0.8]];
const TOP: Pt[] = [[0.6, 3.2], [0.7, 3.6], [0.9, 3.9], [1.3, 4.1], [23.5, 4.1], [23.9, 4.0], [24.1, 3.8], [24.3, 3.2]];
const BOTTOM: Pt[] = [[0.6, 0.9], [24.3, 0.9]];

interface Layout {
  windows: SideItem[];
  doors: Array<{ door: PxBox; glass: PxBox[] }>;
  number: PxBox;
  emblem?: PxBox;
}

/** The M 296's z_both (250 x 50 px, the body from column 6); the 853's is the same layout 6 columns to the left. */
const LAYOUT_296: Layout = {
  windows: [
    ...[28, 56, 111, 129, 147, 165, 183, 201].map((u): SideItem => ({ kind: "window", box: [u, 20, u + 13, 30], mat: "frameGrey", sash: 25 })),
    { kind: "window", box: [88, 20, 95, 30], mat: "frameGrey", name: "small window" },
    { kind: "window", box: [228, 19, 234, 29], mat: "frameGrey", name: "cab window" },
  ],
  doors: [
    { door: [15, 19, 21, 39], glass: [[16, 20, 20, 29]] },
    { door: [71, 20, 84, 39], glass: [[73, 21, 76, 29], [79, 21, 82, 29]] },
    { door: [93.5, 18.5, 101.5, 40], glass: [[95.5, 21, 99.5, 29]] },
    { door: [216, 18.5, 224, 40], glass: [[218.5, 20, 222.5, 29]] },
  ],
  number: [120, 34, 142, 37],
};

/** The 854's z_both, shifted 6 columns to the M 296's frame. */
const shift = (b: PxBox): PxBox => [b[0] + 6, b[1], b[2] + 6, b[3]];
const LAYOUT_854: Layout = {
  windows: [
    ...[22, 50, 106, 123, 141, 159, 177, 195].map((u): SideItem => ({ kind: "window", box: shift([u, 19, u + 13, 30]), mat: "frameGrey" })),
    { kind: "window", box: shift([82, 20, 89, 30]), mat: "frameGrey", name: "small window" },
    { kind: "window", box: shift([3, 19, 7, 29]), mat: "frameGrey", name: "cab window" },
    { kind: "window", box: shift([230, 19, 234, 29]), mat: "frameGrey", name: "cab window" },
  ],
  doors: [
    { door: shift([9, 19, 16, 39]), glass: [shift([10.5, 20.5, 14.5, 28.5])] },
    { door: shift([65, 19, 78, 33]), glass: [shift([66.5, 21.5, 70.5, 29.5]), shift([72.5, 21.5, 76.5, 29.5])] },
    { door: shift([92, 18, 101, 45]), glass: [shift([94.5, 21.5, 98.5, 32.5])] },
    { door: shift([212, 18, 221, 45]), glass: [shift([214.5, 21.5, 218.5, 32.5])] },
    { door: shift([221.5, 19, 228, 39]), glass: [shift([222.5, 20.5, 227, 28.5])] },
  ],
  number: shift([120, 33, 142, 36]),
  emblem: shift([30, 32, 38, 36]),
};

/** The M 296's x_dec (30 x 50 px): two side panes, the gangway door pair, the top lamp and two lamp housings. */
const FRONT: EndItem[] = [
  { kind: "window", box: [0.5, 18.5, 8, 29], mat: "frameGrey", name: "window" },
  { kind: "window", box: [22, 18.5, 29.5, 29], mat: "frameGrey", name: "window" },
  { kind: "panel", box: [8.5, 18, 21.5, 31], mat: "rubber", name: "gangway door", proud: 0.006 },
  { kind: "window", box: [9.5, 19, 14.5, 29], mat: "frameGrey", name: "door window", fw: 0.04 },
  { kind: "window", box: [15.5, 19, 20.5, 29], mat: "frameGrey", name: "door window", fw: 0.04 },
  { kind: "panel", box: [10, 34, 20, 38], mat: "black", name: "coupling plate" },
  { kind: "lamp", box: [2, 33, 8, 36], name: "lamp" },
  { kind: "lamp", box: [22, 33, 28, 36], name: "lamp" },
];

export function m296(params?: ParamValues): MeshBuilder {
  const p = resolveParams(M296_PARAMS, params);
  const variant = p.variant as M296Variant;
  const paint = PAINTS[variant];
  const L = variant === "cd854" ? LAYOUT_854 : LAYOUT_296;
  const car = new Car(paint.palette, { kx: K296, ky: 1, kz: 1, centre: CENTRE, sideH: 5, frontH: 5 });
  const m = car.m;
  const body = car.volume({ name: "body", section: SECTION, plan: PLAN, top: TOP, bottom: BOTTOM, bands: paint.bands });
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, L.windows));
        m.scope("doors", () =>
          L.doors.forEach((d, i) =>
            m.scope(`door ${i + 1}`, () => {
              car.c.door(body, s, car.side(d.door), "doorRed", { seam: 0.025 });
              d.glass.forEach((g, j) => m.scope(`glass ${j + 1}`, () => car.c.window(body, s, car.side(g), { fw: 0.035, frame: "frameGrey" })));
            }),
          ),
        );
        if (L.emblem) m.scope("emblem", () => sideEmblem(car, body, s, L.emblem!, "letteringDark"));
        m.scope("running number", () => sideNumber(car, body, s, L.number, m296Number(variant), variant === "cd854" ? "letteringDark" : "cream"));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      endItems(car, body, e, FRONT);
      // the headlamp in the roof dome over the windows
      m.scope("top lamp", () => {
        const x = car.X(e > 0 ? 24.3 - 0.06 : 0.66);
        block(m, "lampWhite", Math.min(x, x + e * 0.1), Math.max(x, x + e * 0.1), 3.3, 3.5, -0.14, 0.14);
      });
    });
  m.scope("buffers", () => buffersBoth(car, [0.15, 24.75], [0.6, 24.3], 1.0));
  m.scope("running gear", () => {
    // the powered bogie under the radiator end (-X), the trailing one under +X
    for (const [i, x] of [-M296_PIVOTS / 2, M296_PIVOTS / 2].entries())
      m.scope(`bogie ${i + 1}`, () => {
        car.c.bogie(car.c.centre + x, M296_WHEELBASE, i === 0 ? 0.46 : 0.42, 0.9);
        if (i === 0) m.scope("final drives", () => {
          for (const d of [-0.5, 0.5]) block(m, "engine", x + d - 0.17, x + d + 0.17, 0.3, 0.66, -0.45, 0.45);
        });
      });
  });
  m.scope("underframe", () =>
    underBoxes(car, [
      { name: "engine", x0: 6.1, x1: 8.0, y0: 0.3, y1: 0.89, hw: 1.1 },
      { name: "transmission", x0: 8.2, x1: 8.9, y0: 0.55, y1: 0.89, hw: 0.8 },
      { name: "fuel tank", x0: 11.8, x1: 13.6, y0: 0.3, y1: 0.89, hw: 1.0, mat: "tank" },
      { name: "heater", x0: 14.3, x1: 15.0, y0: 0.5, y1: 0.89, hw: 0.7 },
      { name: "battery boxes", x0: 15.0, x1: 17.1, y0: 0.3, y1: 0.89, hw: 1.0 },
    ]),
  );
  m.scope("roof equipment", () => {
    m.scope("radiator", () => {
      block(m, "roofDark", car.X(2.3), car.X(5.2), 4.0, 4.18, -0.75, 0.75);
      for (let i = 0; i < 6; i++) block(m, "black", car.X(2.45 + i * 0.47), car.X(2.75 + i * 0.47), 4.18, 4.2, -0.65, 0.65);
    });
    m.scope("exhaust", () => exhaust(car, 10.15, 0, 4.05, 4.25, 0.1));
  });
  return m;
}

export const M296_VARIANTS: readonly M296Variant[] = ["m296", "cd853", "cd854"];

export const M296_DESIGNS: ProceduralDesign[] = [
  { id: "veh-csd-m296", title: "CSD M 296.1 / CD 853 / 854", build: m296, params: M296_PARAMS, catalog: DMU_CATALOG, references: "csd-m296" },
];
