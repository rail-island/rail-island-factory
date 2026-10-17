// The JNR / JR KiHa 40, the 1977-82 single-car diesel railcar with a cab at each
// end, in the form JR Hokkaido runs it (KiHa 40 1700 / 1800): one parametric
// design `veh-jr-kiha40` whose `livery` picks the JR Hokkaido paint (the
// default, the photo in assets/jr-kiha40), the all-over JNR vermilion
// ("tarako") or the JNR general cream and red.
//
// Modelled from the photo and the published dimensions in metres (no vlakosimdb
// source): 20.8 m body, 21.3 m over the couplers, 2.9 m wide, roof at 3.65 m,
// bogie centres 14.3 m apart, 2.1 m wheelbase, 860 mm wheels. The body is lofted by
// the coach builder through the railcar kit (dmuKit.ts) with a unit frame, so the
// kit's "pixel" boxes are decimetres: the helpers sb() and fb() take metres. The
// prototype runs on the 1,067 mm Cape gauge; like every factory vehicle it is
// drawn on the game's standard-gauge wheelsets. See docs/models/jr-kiha40.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import { centreCoupler } from "./emuParts.ts";
import { Car, DMU_CATALOG, endItems, enumParam, exhaust, handrails, sideItems, sideNumber, step, underBoxes, type EndItem, type PxBox, type SideItem } from "./dmuKit.ts";

/** Body length (m) between the end faces; the couplers add 0.25 m at each end. */
export const KIHA40_BODY = 20.8;
export const KIHA40_OVER_COUPLERS = 21.3;
/** Bogie centres along the body (source x, 0 at the -X end face). */
export const KIHA40_BOGIES = [3.25, 17.55] as const;
export const KIHA40_WHEELBASE = 2.1;
export const KIHA40_WHEEL_R = 0.43;

export const KIHA40_PARAMS: readonly ParamSpec[] = [
  enumParam("livery", "Livery", {
    hokkaido: "JR Hokkaido",
    tarako: "JNR vermilion",
    jnr: "JNR cream-red",
  }),
];
export type Kiha40Livery = "hokkaido" | "tarako" | "jnr";

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });

/** Body paint bands from the solebar (1.0 m) to the roof (3.65 m), and the livery's colours. */
const LIVERIES: Record<Kiha40Livery, { palette: Record<string, MaterialSpec>; bands: Array<[number, number, string]>; number: string }> = {
  hokkaido: {
    palette: { body: c("#e9e7dc"), green: c("#78c84a"), blue: c("#2b3fae") },
    bands: [[1.0, 1.85, "body"], [1.85, 1.91, "blue"], [1.91, 2.12, "green"], [2.12, 3.22, "body"], [3.22, 3.3, "blue"], [3.3, 3.42, "body"], [3.42, 3.66, "roof"]],
    number: "40 1800",
  },
  tarako: {
    palette: { body: c("#d4614a") },
    bands: [[1.0, 3.42, "body"], [3.42, 3.66, "roof"]],
    number: "40 545",
  },
  jnr: {
    palette: { body: c("#e6d8b0"), red: c("#a8343a") },
    bands: [[1.0, 2.15, "body"], [2.15, 3.02, "red"], [3.02, 3.42, "body"], [3.42, 3.66, "roof"]],
    number: "40 2022",
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  roof: c("#77797a", 0.8),
  signFace: c("#f2f4f2", 0.4),
  signText: c("#3c8a3a", 0.5),
  plough: c("#1d1e20", 0.7),
  hazard: c("#d9b51e", 0.5),
  vent: c("#8f9294", 0.7),
};

/** The section: vertical sides, the roof's shoulders and its crown (z, y). */
const SECTION: Pt[] = [[-1.4, 1.0], [1.4, 1.0], [1.45, 1.1], [1.45, 3.26], [1.4, 3.4], [1.22, 3.52], [0.7, 3.62], [0, 3.66], [-0.7, 3.62], [-1.22, 3.52], [-1.4, 3.4], [-1.45, 3.26], [-1.45, 1.1]];
/** The plan: flat ends with rounded corners. */
const PLAN: Pt[] = [[0, 1.3], [0.04, 1.4], [0.1, 1.45], [20.7, 1.45], [20.76, 1.4], [20.8, 1.3]];
/** The roof falls to the end faces over the last 0.3 m. */
const TOP: Pt[] = [[0, 3.5], [0.12, 3.62], [0.3, 3.66], [20.5, 3.66], [20.68, 3.62], [20.8, 3.5]];

/** A side box in metres (source x, y) as the kit's decimetre box. */
const sb = (x0: number, x1: number, y0: number, y1: number): PxBox => [x0 * 10, (4 - y1) * 10, x1 * 10, (4 - y0) * 10];
/** An end box in metres (z seen from outside the end, y). */
const fb = (z0: number, z1: number, y0: number, y1: number): PxBox => [(1.5 - z1) * 10, (4 - y1) * 10, (1.5 - z0) * 10, (4 - y0) * 10];

/** Ten passenger windows between the doors, 1.55 m apart, with the Hokkaido double sash. */
const WINDOWS: SideItem[] = [
  ...[0.35, 20.45 - 0.6].map((x): SideItem => ({ kind: "window", box: sb(x, x + 0.6, 2.05, 2.85), mat: "rubber", name: "cab window", fw: 0.04 })),
  ...Array.from({ length: 10 }, (_, i): SideItem => {
    const x = 10.4 + (i - 4.5) * 1.55;
    return { kind: "window", box: sb(x - 0.36, x + 0.36, 2.18, 2.98), mat: "frame", sash: (4 - 2.58) * 10, fw: 0.05 };
  }),
];
/** The two doors on each side, right behind the cabs. */
const DOORS: Array<[number, number]> = [[1.15, 2.1], [18.7, 19.65]];

/** The cab end, seen from outside: two windows, the gangway door, lamps and the destination sign. */
const FRONT: EndItem[] = [
  { kind: "window", box: fb(0.52, 1.3, 2.45, 3.2), mat: "rubber", name: "window", fw: 0.045 },
  { kind: "window", box: fb(-1.3, -0.52, 2.45, 3.2), mat: "rubber", name: "window", fw: 0.045 },
  { kind: "panel", box: fb(-0.31, 0.31, 3.38, 3.56), mat: "rubber", name: "destination sign", proud: 0.006 },
  { kind: "panel", box: fb(-0.27, 0.27, 3.41, 3.53), mat: "signFace", name: "destination sign face", proud: 0.012 },
  { kind: "panel", box: fb(-0.2, 0.2, 3.45, 3.49), mat: "signText", name: "destination sign text", proud: 0.016 },
  { kind: "lamp", box: fb(1.07, 1.21, 2.2, 2.34), mat: "lampRed", name: "tail lamp" },
  { kind: "lamp", box: fb(-1.21, -1.07, 2.2, 2.34), mat: "lampRed", name: "tail lamp" },
  { kind: "panel", box: fb(0.6, 0.72, 2.2, 2.32), mat: "hazard", name: "marker plate" },
  { kind: "panel", box: fb(-0.72, -0.6, 2.2, 2.32), mat: "hazard", name: "marker plate" },
  { kind: "panel", box: fb(0.6, 0.72, 1.6, 1.72), mat: "hazard", name: "marker plate" },
  { kind: "panel", box: fb(-0.72, -0.6, 1.6, 1.72), mat: "hazard", name: "marker plate" },
];

function kiha40Car(livery: Kiha40Livery): MeshBuilder {
  const paint = LIVERIES[livery];
  const car = new Car({ ...PALETTE, ...paint.palette }, { kx: 1, ky: 1, kz: 1, centre: KIHA40_BODY / 2, sideH: 4, frontH: 4 });
  const m = car.m;
  const body = car.volume({ name: "body", section: SECTION, plan: PLAN, top: TOP, bands: paint.bands });
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, WINDOWS));
        m.scope("doors", () =>
          DOORS.forEach(([x0, x1], i) =>
            m.scope(`door ${i + 1}`, () => {
              car.c.door(body, s, car.side(sb(x0, x1, 1.02, 2.92)), "bands", { seam: 0.025 });
              m.scope("glass", () => car.c.window(body, s, car.side(sb(x0 + 0.2, x1 - 0.2, 2.1, 2.78)), { fw: 0.035, frame: "rubber" }));
              m.scope("handrails", () => handrails(car, body, s, [(x0 - 0.08) * 10, (x1 + 0.08) * 10], (4 - 2.5) * 10, (4 - 1.3) * 10));
              m.scope("step", () => step(car, s, sb(x0 + 0.05, x1 - 0.05, 0.72, 0.76), 1.45));
            }),
          ),
        );
        m.scope("running number", () => sideNumber(car, body, s, sb(9.3, 11.5, 1.45, 1.67), paint.number, livery === "tarako" ? "lettering" : "letteringDark"));
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      endItems(car, body, e, FRONT);
      // the side stripe under the roof stops at the cab's corners (the photo)
      if (livery === "hokkaido") m.scope("forehead", () => car.c.endPanel(body, "body", e, car.front(fb(-1.38, 1.38, 3.2, 3.32), e), 0.003, 0.002));
      m.scope("gangway door", () => car.c.door(body, e, car.front(fb(-0.42, 0.42, 1.45, 3.25), e), "bands", { end: true, seam: 0.025 }));
      m.scope("gangway door glass", () => car.c.window(body, e, car.front(fb(-0.28, 0.28, 2.6, 3.1), e), { end: true, fw: 0.035, frame: "rubber" }));
      const xf = car.X(e > 0 ? KIHA40_BODY : 0);
      m.scope("headlights", () => {
        for (const z of [-1.0, 1.0]) {
          const housing = ngon(16, 0.115, 0, z, 3.47);
          const lens = ngon(16, 0.085, 0, z, 3.47);
          m.sweep("rubber", "x", housing, xf - e * 0.03, housing, xf + e * 0.05);
          m.sweep("lampWhite", "x", lens, xf + e * 0.05, lens, xf + e * 0.065);
        }
      });
      m.scope("buffer beam", () => block(m, "body", Math.min(xf, xf + e * 0.08), Math.max(xf, xf + e * 0.08), 1.0, 1.42, -1.38, 1.38));
      m.scope("coupler", () => centreCoupler(m, e, car.X(e > 0 ? KIHA40_BODY - 1.2 : 1.2), e * (KIHA40_OVER_COUPLERS / 2), 0.88));
      m.scope("snow plough", () => {
        const [a, b] = [xf - e * 0.3, xf + e * 0.04].sort((p, q) => p - q) as [number, number];
        block(m, "plough", a, b, 0.14, 0.99, -1.25, -0.35);
        block(m, "plough", a, b, 0.14, 0.99, 0.35, 1.25);
        block(m, "plough", a, b, 0.14, 0.52, -0.35, 0.35);
      });
    });
  m.scope("running gear", () => {
    KIHA40_BOGIES.forEach((x, i) => m.scope(`bogie ${i + 1}`, () => car.c.bogie(x, KIHA40_WHEELBASE, KIHA40_WHEEL_R, 1.0)));
  });
  m.scope("underframe", () =>
    underBoxes(car, [
      { name: "engine", x0: 7.2, x1: 10.0, y0: 0.42, y1: 0.99, hw: 0.85 },
      { name: "transmission", x0: 10.3, x1: 11.6, y0: 0.5, y1: 0.99, hw: 0.6 },
      { name: "fuel tank", x0: 12.2, x1: 14.0, y0: 0.5, y1: 0.99, hw: 1.05, mat: "tank" },
      { name: "air tanks", x0: 5.0, x1: 6.6, y0: 0.62, y1: 0.99, hw: 1.1, mat: "tank" },
      { name: "battery box", x0: 14.5, x1: 15.6, y0: 0.55, y1: 0.99, hw: 1.15 },
    ]),
  );
  m.scope("roof equipment", () => {
    m.scope("radiator", () => {
      block(m, "vent", car.X(14.2), car.X(16.2), 3.55, 3.86, -0.75, 0.75);
      for (let i = 0; i < 9; i++) block(m, "roofDark", car.X(14.3 + i * 0.22), car.X(14.4 + i * 0.22), 3.86, 3.88, -0.7, 0.7);
    });
    m.scope("ventilators", () => {
      for (const [i, x] of [3.0, 4.6, 6.2, 7.8, 9.4, 11.0, 12.6, 18.0].entries())
        m.scope(`ventilator ${i + 1}`, () => block(m, "vent", car.X(x - 0.3), car.X(x + 0.3), 3.6, 3.8, -0.26, 0.26));
    });
    m.scope("exhaust", () => exhaust(car, 16.8, 0.35, 3.55, 3.98, 0.07));
  });
  return m;
}

export function kiha40(params?: ParamValues): MeshBuilder {
  const p = resolveParams(KIHA40_PARAMS, params);
  return kiha40Car(p.livery as Kiha40Livery);
}

export const KIHA40_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-jr-kiha40", title: "JR KiHa 40", build: kiha40, params: KIHA40_PARAMS, finishParams: ["livery"], catalog: DMU_CATALOG, references: "jr-kiha40" },
];
