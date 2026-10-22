// The CD 812 "Esmeralda" (the one CD 810 Pars nova rebuilt in 2001 with
// laminate cab noses) and its 912 driving trailer: one design `veh-cd-812`
// whose `unit` picks the motor car (812 613-8) or the driving trailer (912 001-5).
//
// The bodies' sides follow the native vlakosimdb XML and BMPs in
// assets/cd-812/native (db/train/dmu/812/cd_812.613 and cd_912.001): windows,
// doors and markings laid from native pixel boxes (0.1 m a pixel), lengths
// scaled to the published 14.47 m over the buffers. The cab noses do not:
// vlakosimdb's 30 px front is far from the real face, so the noses are drawn
// from photographs (assets/cd-812/PHOTOS.md) as a painted surface (cabNose.ts):
// the raked windscreen with its silver roof cap, the silver lamp mask wrapping
// into the corners with its four lamps and the CD emblem, the white livery
// sweeping down over the corner, and the grey apron with its yellow edge. See
// docs/models/czech-dmus.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import { ngon } from "./meshBuilder.ts";
import type { Pt, Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import { emblem } from "./cd163.ts";
import { strokeText } from "./strokeFont.ts";
import { CabNose, inRoundRect, type NoseLayer, type NoseQuery, type NoseSpec } from "./cabNose.ts";
import {
  Car, DMU_CATALOG, enumParam, exhaust, sideEmblem, sideItems, sideNumber, tractionNumber, underBoxes,
  DMU_PALETTE, type CarFrame, type PxBox, type SideItem,
} from "./dmuKit.ts";
import { LOD_GLASS } from "./lodKit.ts";
import { axleParts, dmuBody, fitUnit, noseEnd, roofPart } from "./lodUnits.ts";

export type Cd812Unit = "motorCar" | "drivingTrailer";

export const CD812_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    drivingTrailer: "Driving trailer",
  }),
];

/** The published 812 length over the buffers (14.47 m) over the XML's 15.0 m. */
export const K812 = 14.47 / 15.0;

/** The running numbers, both photographed (assets/cd-812/PHOTOS.md). */
export function cd812Number(unit: Cd812Unit): string {
  return unit === "motorCar" ? tractionNumber("812", "613") : tractionNumber("912", "001");
}

const c = (color: string, roughness = 0.5, metallic = 0): MaterialSpec => ({ color, roughness, ...(metallic ? { metallic } : {}) });

const PALETTE: Record<string, MaterialSpec> = {
  green: c("#4fb444"),
  white: c("#f1f2ef"),
  greyLine: c("#7b8186"),
  skirtGrey: c("#c2c6c8", 0.6),
  silver: c("#b9bdbf", 0.35, 0.35),
  silverDark: c("#6d7275", 0.5, 0.2),
  apronYellow: c("#f0c419"),
  signBlack: c("#202020", 0.6),
  display: c("#141516", 0.4),
  lampClear: { ...c("#d9dcdd", 0.15, 0.3), lamp: { role: "head" } },
  hoseRed: c("#a5241e", 0.6),
};

// ---------------------------------------------------------------------------
// The body: z_dec = z_inc 160 x 60 px (16 x 6 m); source x 0..15 m over the buffers

/** The source x of the nose tip (the XML plan's end) and its model x. */
const TIP_SRC = 0.5;
const X_TIP = (7.5 - TIP_SRC) * K812;
/** Where the nose meets the body, back from the tip (model metres), and its source x. */
const D_JOIN = 1.2;
const JOIN_SRC = TIP_SRC + D_JOIN / K812;

/** The body section: the skirt tucked in below 1.2 m, the roof rounding from 3.45 m. */
const SECTION: Pt[] = [[-1.38, 0.5], [1.38, 0.5], [1.5, 1.2], [1.5, 3.45], [1.4, 3.6], [0.6, 3.7], [-0.6, 3.7], [-1.4, 3.6], [-1.5, 3.45], [-1.5, 1.2]];
const HALF: Pt[] = [[0.5, 1.38], [1.2, 1.5], [3.45, 1.5], [3.6, 1.4], [3.7, 0.6]];

/** The skirt at 0.5 m, cut up to 1.0 m over the wheels (source x). */
const BOTTOM: Pt[] = [[JOIN_SRC, 0.5], [2.8, 0.5], [3.0, 1.0], [3.7, 1.0], [3.9, 0.5], [11.1, 0.5], [11.3, 1.0], [12.0, 1.0], [12.2, 0.5], [15 - JOIN_SRC, 0.5]];

/** The livery's horizontal heights on the body. */
const SKIRT_TOP = 1.12;
const LINE_TOP = 1.19;
const WHITE_TOP = 1.9;

interface Layout {
  windows: SideItem[];
  doors: Array<{ door: PxBox; glass: PxBox[] }>;
}

const LAYOUT_812: Layout = {
  windows: [31, 46, 61, 76, 91, 106].map((u): SideItem => ({ kind: "window", box: [u, 30, u + 13, 39] })),
  doors: [
    { door: [18, 28, 28, 55], glass: [[20, 32, 26, 42]] },
    { door: [122, 28, 132, 55], glass: [[124, 32, 130, 42]] },
  ],
};

const LAYOUT_912: Layout = {
  windows: [
    { kind: "window", box: [18, 30, 27, 39] },
    { kind: "window", box: [29, 30, 42, 39] },
    { kind: "window", box: [46, 34, 59, 43], name: "low window" },
    { kind: "window", box: [91, 34, 104, 43], name: "low window" },
    { kind: "window", box: [108, 30, 121, 39] },
    { kind: "window", box: [123, 30, 132, 39] },
  ],
  doors: [{ door: [65, 28, 84, 56], glass: [[67, 32, 73, 42], [76, 32, 82, 42]] }],
};

// ---------------------------------------------------------------------------
// The nose (model metres; d back from the tip, lat to the viewer's right)

/** The centreline face: the apron upright, the mask raked, the windscreen at about 21 degrees, the roof rounding. */
const PROFILE: Pt[] = [[0.5, 0.03], [0.75, 0.0], [1.2, 0.0], [1.5, 0.03], [2.26, 0.15], [2.3, 0.17], [3.38, 0.6], [3.5, 0.76], [3.6, 0.93], [3.66, 1.07], [3.7, 1.2]];
const CORNER: Pt[] = [[0.5, 0.45], [1.2, 0.36], [2.3, 0.36], [3.4, 0.3], [3.7, 0.2]];
const ROWS = [0.5, 0.75, 1.2, 1.5, 1.9, 2.26, 2.3, 2.85, 3.38, 3.45, 3.5, 3.55, 3.6, 3.63, 3.66, 3.7];

/** The windscreen: its bottom edge, half width and the top edge falling toward the corners. */
const WS = { y0: 2.28, half: 1.3, top: (lat: number) => 3.4 - 0.22 * (lat / 1.3) ** 2, r: 0.12 };
function inWindscreen(q: NoseQuery, inset: number): boolean {
  const al = Math.abs(q.lat);
  if (q.side || al > WS.half - inset || q.y < WS.y0 + inset || q.y > WS.top(q.lat) - inset) return false;
  // rounded corners: r at the top, half that at the bottom
  const cx = WS.half - WS.r;
  const top = WS.top(cx) - WS.r;
  if (al > cx && q.y > top) return Math.hypot(al - cx, q.y - top) <= WS.r - inset;
  const rb = WS.r / 2;
  if (al > WS.half - rb && q.y < WS.y0 + rb) return Math.hypot(al - (WS.half - rb), q.y - (WS.y0 + rb)) <= rb - inset;
  return true;
}

/** The top edge of the white band: level over the face, sweeping up the cab side to the body's line. */
function whiteTop(q: NoseQuery): number {
  const au = Math.abs(q.u);
  if (au <= 1) return 1.32;
  if (!q.side) return 1.32 + 0.08 * (au - 1);
  const t = Math.min(1, Math.max(0, (q.d - 0.45) / (D_JOIN - 0.45)));
  return 1.4 + (WHITE_TOP - 1.4) * t ** 1.7;
}

/** The silver lamp mask: a rounded rectangle wrapping into the corners. */
const MASK = { cy: 1.91, hx: 1.25, hy: 0.355, r: 0.22 };

const LAYERS: NoseLayer[] = [
  { mat: "white", name: "white sweep", inside: (q) => q.y >= LINE_TOP && q.y < whiteTop(q) },
  { mat: "greyLine", name: "grey line", inside: (q) => q.y >= SKIRT_TOP && q.y < LINE_TOP },
  { mat: "skirtGrey", name: "skirt", inside: (q) => q.y < SKIRT_TOP },
  { mat: "black", name: "coupling slot", inside: (q) => !q.side && Math.abs(q.lat) < 0.07 && q.y < 0.85 },
  { mat: "silver", name: "mask", inside: (q) => !q.side && inRoundRect(q.lat, q.y, 0, MASK.cy, MASK.hx, MASK.hy, MASK.r) },
  { mat: "silverDark", name: "mask shade", inside: (q) => !q.side && Math.abs(q.lat) < MASK.hx - 0.16 && q.y > MASK.cy + MASK.hy - 0.05 && q.y < MASK.cy + MASK.hy - 0.015 },
  { mat: "silver", name: "roof cap", inside: (q) => !q.side && Math.abs(q.lat) < WS.half - 0.02 && q.y > WS.top(q.lat) + 0.03 && q.d < 1.0 },
  { mat: "black", name: "windscreen frame", inside: (q) => inWindscreen(q, 0) },
  { mat: "glass", name: "windscreen glass", inside: (q) => inWindscreen(q, 0.05) },
  // the cab side window behind the corner, its front edge on the corner where the face rakes back
  { mat: "black", name: "cab window frame", inside: (q) => q.side && q.d >= 0.66 && q.d <= 1.12 && inRoundRect(q.d, q.y, 0.89, 2.6, 0.23, 0.48, 0.1) },
  { mat: "glass", name: "cab window glass", inside: (q) => q.side && q.d >= 0.7 && q.d <= 1.08 && inRoundRect(q.d, q.y, 0.89, 2.6, 0.19, 0.44, 0.08) },
];

const APRON_LAYERS: NoseLayer[] = [
  { mat: "apronYellow", name: "yellow edge", inside: (q) => !q.side && Math.abs(q.lat) < 1.0 && q.y < 0.4 },
  { mat: "black", name: "coupling slot", inside: (q) => !q.side && Math.abs(q.lat) < 0.07 && q.y > 0.4 },
];

function nose(car: Car, e: number, number: string): void {
  const m = car.m;
  const spec: NoseSpec = {
    e, xTip: X_TIP, dJoin: D_JOIN, dSide: 0.45, profile: PROFILE, half: HALF, corner: CORNER, bulge: 0.04,
    rows: ROWS, base: "green", layers: LAYERS, cols: [6, 3, 1, 2], capTop: "green", capBottom: "black",
  };
  const n = new CabNose(m, spec);
  m.scope("skin", () => n.draw());
  // the apron under the skin, from 0.24 m: tucked 5 mm inside it at the top
  m.scope("apron", () => {
    const apron = new CabNose(m, {
      e, xTip: X_TIP, dJoin: 0.7, dSide: 0.55, profile: [[0.24, 0.08], [0.32, 0.035], [0.5, 0.034], [0.56, 0.036]],
      half: [[0.24, 1.28], [0.5, 1.375], [0.56, 1.38]], corner: [[0.24, 0.55], [0.56, 0.5]], bulge: 0.04,
      rows: [0.24, 0.32, 0.5, 0.56], base: "skirtGrey", layers: APRON_LAYERS, cols: [5, 3, 1, 1], capBottom: "black", capTop: "skirtGrey",
    });
    apron.draw();
    const x = e * (X_TIP - 0.7);
    m.scope("back", () => m.slab("black", [[x, 0.24, -1.27], [x, 0.24, 1.27], [x, 0.555, 1.37], [x, 0.555, -1.37]], [e * 0.01, 0, 0]));
  });
  m.scope("lamps", () => {
    for (const s of [-1, 1]) {
      m.scope(s < 0 ? "upper left" : "upper right", () => n.lamp(s * 1.0, 2.08, 0.1, "lampClear"));
      m.scope(s < 0 ? "lower left" : "lower right", () => n.lamp(s * 0.98, 1.75, 0.085, "lampWhite"));
      m.scope(s < 0 ? "tail left" : "tail right", () => n.plate("lampRed", s * 1.3, 0.86, [[-0.06, -0.035], [0.06, -0.035], [0.06, 0.035], [-0.06, 0.035]], 0.01, 0.03));
    }
    m.scope("top", () => n.lamp(0, 3.52, 0.07, "lampWhite", "frame", 10));
  });
  m.scope("emblem", () => {
    const h = 0.17;
    const w = h * 1.5385;
    n.decal("signBlack", emblem(-w / 2, MASK.cy - h / 2 + 0.03, h, false));
    n.plate("signBlack", 0, MASK.cy - 0.24, [[-0.025, -0.045], [0.025, -0.045], [0.025, 0.045], [-0.025, 0.045]], 0.004, 0.01);
  });
  m.scope("running number", () => {
    const h = 0.13;
    const w = h * 0.58;
    const gap = h * 0.16;
    n.decal("signBlack", strokeText(number, -1.18, 1.37, h, w, gap));
  });
  m.scope("wiper", () => n.decal("black", [[-0.95, 2.36], [0.15, 2.36], [0.15, 2.38], [-0.95, 2.36], [0.15, 2.38], [-0.95, 2.38]], 0.06));
  // the mirrors folded against the cab sides, inside the 3.1 m envelope
  m.scope("mirrors", () => {
    for (const s of [-1, 1]) {
      const x = e * (X_TIP - 0.64);
      block(m, "black", Math.min(x, x - e * 0.22), Math.max(x, x - e * 0.22), 2.48, 2.76, ...(s > 0 ? [1.49, 1.545] : [-1.545, -1.49]) as [number, number]);
    }
  });
  m.scope("hoses", () => {
    for (const lat of [-0.42, -0.32, 0.32, 0.42]) {
      const z = -e * lat;
      const x = e * (X_TIP - 0.02);
      m.prism(lat * lat > 0.12 ? "hoseRed" : "black", ngon(6, 0.025, 0, x, z), 0.42, 0.98);
    }
  });
}

/** The frame of the native canvases and the body between the noses. */
const FRAME_812: CarFrame = { kx: K812, ky: 1, kz: 1, centre: 7.5, sideH: 6, frontH: 6 };
const BODY_812: Volume = {
  name: "body",
  section: SECTION,
  plan: [[JOIN_SRC, 1.5], [15 - JOIN_SRC, 1.5]],
  bottom: BOTTOM,
  bands: [[0.5, SKIRT_TOP, "skirtGrey"], [SKIRT_TOP, LINE_TOP, "greyLine"], [LINE_TOP, WHITE_TOP, "white"], [WHITE_TOP, 3.7, "green"]],
};

function esmeralda(unit: Cd812Unit): MeshBuilder {
  const trailer = unit === "drivingTrailer";
  const car = new Car(PALETTE, FRAME_812);
  const m = car.m;
  const L = trailer ? LAYOUT_912 : LAYOUT_812;
  const body: Volume = car.volume(BODY_812);
  const number = cd812Number(unit);
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, L.windows));
        m.scope("doors", () =>
          L.doors.forEach((dd, i) =>
            m.scope(`door ${i + 1}`, () => {
              car.c.door(body, s, car.side(dd.door), "green", { seam: 0.03 });
              dd.glass.forEach((g, j) => m.scope(`glass ${j + 1}`, () => car.c.window(body, s, car.side(g), { fw: 0.04 })));
            }),
          ),
        );
        m.scope("emblem", () => sideEmblem(car, body, s, [47, 42, 55, 47], "signBlack"));
        if (!trailer) m.scope("display", () => sideItems(car, body, s, [{ kind: "panel", box: [76, 41, 88, 45], mat: "display", name: "board" }]));
        m.scope("running number", () => sideNumber(car, body, s, trailer ? [104, 44, 114, 45.3] : [98, 44, 108, 45.3], number, "signBlack"));
      });
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => nose(car, e, number));
  m.scope("buffers", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front buffers" : "rear buffers", () => {
        car.c.buffers(e, car.sx(e > 0 ? 15 : 0), car.sx(e > 0 ? 14.38 : 0.62), 1.03);
        m.scope("coupling", () => car.c.coupling(e, car.sx(e > 0 ? 15 : 0), car.sx(e > 0 ? 14.38 : 0.62), 1.03));
      });
  });
  m.scope("running gear", () => {
    for (const [i, x] of [3.35, 11.6].entries()) m.scope(`axle ${i + 1}`, () => car.c.axle(car.sx(x), 0.42, 1.0));
  });
  m.scope("underframe", () => {
    underBoxes(car, [
      { name: "tanks", x0: 4.35, x1: 4.9, y0: 0.56, y1: 0.97, hw: 1.2 },
      { name: "boxes", x0: 8.8, x1: 10.8, y0: 0.56, y1: 0.97, hw: 1.2 },
      ...(trailer ? [] : [{ name: "engine", x0: 5.0, x1: 8.6, y0: 0.56, y1: 0.97, hw: 1.0 }]),
    ]);
  });
  if (!trailer)
    m.scope("roof equipment", () => {
      m.scope("exhaust", () => exhaust(car, 5.2, 0.35, 3.66, 3.85, 0.08));
      m.scope("cooler", () => block(m, "grey", car.X(8.4), car.X(10.0), 3.68, 3.8, -0.6, 0.6));
    });
  return m;
}

export function cd812(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD812_PARAMS, params);
  return esmeralda(p.unit as Cd812Unit);
}

/**
 * The 812 / 912 for distant views (lodUnits.ts): the body's section and bands,
 * both noses from their profile (the upright apron, the raked mask and
 * windscreen, the rounding roof) painted skirt grey, white, green and the
 * silver mask and roof cap, the windscreens and the side window band, the
 * two axles and the motor car's cooler.
 */
export function cd812Lod(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(CD812_PARAMS, params).unit as Cd812Unit;
  const face: Array<[number, number, string]> = [[0.5, SKIRT_TOP, "skirtGrey"], [SKIRT_TOP, LINE_TOP, "greyLine"], [LINE_TOP, 1.32, "white"], [1.32, MASK.cy - MASK.hy, "green"], [MASK.cy - MASK.hy, 3.7, "silver"]];
  const screen = [{ u: [-WS.half, WS.half] as const, y: [2.26, WS.top(0.8)] as const, mat: LOD_GLASS }];
  const nose = (e: number) => noseEnd({ e, xTip: X_TIP, profile: PROFILE, half: HALF, corner: CORNER, bulge: 0.04, rows: ROWS }, face, screen);
  const X = (x: number) => (x - FRAME_812.centre) * K812;
  const L = unit === "drivingTrailer" ? LAYOUT_912 : LAYOUT_812;
  const body = dmuBody(FRAME_812, BODY_812, { y0: 0.5, items: L.windows, front: nose(1), rear: nose(-1) });
  return fitUnit({
    palette: { ...DMU_PALETTE, ...PALETTE },
    bodies: [body],
    parts: [
      axleParts([[X(3.35), 0.42], [X(11.6), 0.42]], 0.5),
      ...(unit === "motorCar" ? [roofPart("grey", X(8.4), X(10.0), 0.6, 0.6, 3.68, 3.8)] : []),
    ],
  }, 100);
}

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_812_GAME: GameProperties = {
  weight: 20.7,
  power: 240,
  maxspeed: 80,
  accel: null,
  variants: [
    { params: { unit: "drivingTrailer" }, power: 0 },
  ],
};

export const DMU812_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-cd-812", game: CD_812_GAME, title: "CD 812 / 912 Esmeralda", build: cd812, buildLod: cd812Lod, params: CD812_PARAMS, catalog: DMU_CATALOG, references: "cd-812" },
];
