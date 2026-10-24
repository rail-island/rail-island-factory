// The CD 810 two-axle railcar (CSD M 152.0, the "orchestrion"): one design
// `veh-cd-810` whose `livery` picks one of the four 810 paints vlakosimdb holds.
// Its rebuilt sister, the 812 "Esmeralda", and the 912 are their own design
// (dmu812.ts).
//
// The body's sides are reconstructed from the native vlakosimdb XML and BMPs in
// assets/cd-810/native (db/train/dmu/cd_810#1..#4): the XML section, windows,
// doors and markings laid from native pixel boxes (0.1 m a pixel), the length
// scaled to the published 13.103 m body. The cab ends follow photographs
// (assets/cd-810/PHOTOS.md) as one painted surface (cabNose.ts): the flat face
// with rounded corners, the two windscreens in their light rubber frames either
// side of a body-coloured pillar, the roof cap with the twin top lamps in their
// black housing, the protruding lamp housings on the lamp band, and the snow
// plough under the buffer beam with its yellow edge. See docs/models/czech-dmus.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Pt, Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block } from "./vehicleParts.ts";
import { emblem } from "./cd163.ts";
import { strokeText } from "./strokeFont.ts";
import { CabNose, inRoundRect, type NoseLayer, type NoseQuery } from "./cabNose.ts";
import {
  Car, DMU_CATALOG, buffersBoth, enumParam, exhaust, sideEmblem, sideItems, sideNumber, tractionNumber, underBoxes,
  DMU_PALETTE, type CarFrame, type PxBox, type SideItem,
} from "./dmuKit.ts";
import { LOD_GLASS } from "./lodKit.ts";
import { axleParts, dmuBody, fitUnit, noseEnd, paintOver, roofPart, underPart } from "./lodUnits.ts";

export type Cd810Livery = "red" | "yellowBand" | "blueWhite" | "ivoryBand";

export const CD810_PARAMS: readonly ParamSpec[] = [
  enumParam("livery", "Livery", {
    red: "Cream band",
    yellowBand: "Yellow band",
    blueWhite: "Blue and white",
    ivoryBand: "Ivory band",
  }),
];

/** The published 810 body (13.103 m) over the XML's 12.5 m; 13.97 m over the buffers. */
export const K810 = 13.103 / 12.5;

/** The running numbers: 810 225 is photographed in the yellow-band paint, 810 545 in the ivory band; the rest are illustrative. */
const NUMBERS: Record<Cd810Livery, string> = { red: "604", yellowBand: "225", blueWhite: "472", ivoryBand: "545" };

/** The running number a livery carries, e.g. `810 225-3`. */
export function cd810Number(livery: Cd810Livery): string {
  return tractionNumber("810", NUMBERS[livery]);
}

interface Paint {
  palette: Record<string, MaterialSpec>;
  /** Horizontal bands of the body's sides, heights in metres. */
  bands: Array<[number, number, string]>;
  /** The face: above the windscreens' sill, below it, the lamp band and an optional strip under it. */
  upper: string;
  lower: string;
  band: [number, number, string];
  strip?: [number, number, string];
  roof: string;
  /** The lamp housings' centre height, the number's foot and the lettering on the face. */
  lampY: number;
  numberY: number;
  ink: string;
  /** The emblem's colour on the lamp band. */
  emblemInk: string;
}

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });

/** The sill of the windscreens and of the side windows' band. */
const SILL = 1.97;

// the colours of the native z_dec / x_both BMPs; band heights from the photographs
const PAINTS: Record<Cd810Livery, Paint> = {
  red: {
    palette: { red: c("#b0080f"), cream: c("#f3eeb4"), roofGrey: c("#808780", 0.75), yellow: c("#f2d40c") },
    bands: [[0.4, 1.9, "red"], [1.9, 3.0, "cream"], [3.0, 3.4, "roofGrey"]],
    upper: "cream", lower: "red", band: [1.4, 1.7, "yellow"], roof: "roofGrey", lampY: 1.55, numberY: 1.27, ink: "lettering", emblemInk: "letteringDark",
  },
  yellowBand: {
    palette: { red: c("#c01810"), yellow: c("#f6dc12"), roofGrey: c("#808780", 0.75) },
    bands: [[0.4, 1.35, "red"], [1.35, SILL, "yellow"], [SILL, 3.0, "red"], [3.0, 3.4, "roofGrey"]],
    upper: "red", lower: "red", band: [1.35, SILL, "yellow"], roof: "roofGrey", lampY: 1.72, numberY: 1.39, ink: "letteringDark", emblemInk: "letteringDark",
  },
  blueWhite: {
    palette: { blue: c("#0a4f9a"), white: c("#eef0f2"), roofLight: c("#d0d7d0", 0.7), yellow: c("#f0d20f") },
    bands: [[0.4, 0.9, "blue"], [0.9, 1.9, "white"], [1.9, 3.0, "blue"], [3.0, 3.4, "roofLight"]],
    upper: "white", lower: "blue", band: [1.4, SILL, "yellow"], strip: [1.22, 1.4, "white"], roof: "roofLight", lampY: 1.72, numberY: 1.43, ink: "letteringDark", emblemInk: "letteringDark",
  },
  ivoryBand: {
    palette: { red: c("#b8141a"), ivory: c("#efe7c4"), roofGrey: c("#9a9a92", 0.75) },
    bands: [[0.4, 1.35, "red"], [1.35, SILL, "ivory"], [SILL, 3.0, "red"], [3.0, 3.4, "roofGrey"]],
    upper: "red", lower: "red", band: [1.35, SILL, "ivory"], roof: "roofGrey", lampY: 1.72, numberY: 1.39, ink: "letteringDark", emblemInk: "letteringDark",
  },
};

// ---------------------------------------------------------------------------
// The body: z_dec / z_inc 140 x 40 px (14 x 4 m); the XML body runs 0.4..12.9 m

/** The XML section (alongx base), source metres. */
const SECTION_810: Pt[] = [[-1.5, 0], [1.5, 0], [1.5, 3], [1.4, 3.15], [1.2, 3.2], [0, 3.3], [-1.2, 3.2], [-1.4, 3.15], [-1.5, 3]];
const HALF: Pt[] = [[0.7, 1.5], [3.0, 1.5], [3.15, 1.4], [3.2, 1.2], [3.3, 0]];

/** The model x of the +X end's face, and where the cab end meets the body, back from it. */
const X_TIP = (12.9 - 6.65) * K810;
/** The join is the end windows' front edge (source x 0.6 and 12.7), so no side panel straddles it. */
const JOIN_SRC = 0.6;
const D_JOIN = (JOIN_SRC - 0.4) * K810;

const WINDOWS_810: SideItem[] = [
  ...[7, 122].map((u): SideItem => ({ kind: "window", box: [u, 11, u + 5, 20], name: "end window", fw: 0.05 })),
  ...[22, 37, 52, 67, 82, 97].map((u): SideItem => ({ kind: "window", box: [u, 11, u + 14, 20], sash: 15 })),
];

/** The two folding doors and their windows. */
const DOORS_810: Array<{ door: PxBox; glass: PxBox }> = [
  { door: [13, 10, 21, 35], glass: [15, 12, 19, 20] },
  { door: [112, 10, 120, 35], glass: [114, 12, 118, 20] },
];

// ---------------------------------------------------------------------------
// The cab end (model metres; d back from the face, lat to the viewer's right)

/** The face upright to the sill, the windscreens raked back 75 mm, the roof cap rounding to the crown. */
const PROFILE: Pt[] = [[0.7, 0], [2.0, 0], [2.97, 0.075], [3.0, 0.08], [3.1, 0.1], [3.2, 0.13], [3.26, 0.17], [3.3, D_JOIN]];
const CORNER: Pt[] = [[0.7, 0.13], [3.0, 0.13], [3.3, 0.05]];
const ROWS = [0.7, 1.0, 1.4, 2.0, 2.97, 3.0, 3.07, 3.15, 3.2, 3.25, 3.3];

/** A windscreen pane: either side of the 0.14 m pillar, to 0.1 m short of the corners. */
const PANE = { inner: 0.07, outer: 1.32, y0: 2.06, y1: 2.94, r: 0.12 };
const inPane = (q: NoseQuery, s: number, inset: number): boolean => {
  const lat = s * q.lat;
  const cx = (PANE.inner + PANE.outer) / 2;
  return !q.side && inRoundRect(lat, q.y, cx, (PANE.y0 + PANE.y1) / 2, (PANE.outer - PANE.inner) / 2 - inset, (PANE.y1 - PANE.y0) / 2 - inset, PANE.r - inset);
};

function layers(p: Paint): NoseLayer[] {
  // the face proper; the corners take the sides' bands, the lamp band wraps round them
  const front = (q: NoseQuery) => Math.abs(q.u) <= 1;
  const out: NoseLayer[] = p.bands.map(([y0, y1, mat]): NoseLayer => ({ mat, name: `${mat} side`, inside: (q) => !front(q) && q.y >= y0 && q.y < y1 }));
  out.push(
    { mat: p.lower, name: "front lower", inside: (q) => front(q) && q.y < SILL },
    { mat: p.upper, name: "front upper", inside: (q) => front(q) && q.y >= SILL },
    { mat: p.band[2], name: "front band", inside: (q) => !q.side && q.y >= p.band[0] && q.y < p.band[1] },
  );
  if (p.strip) {
    const [y0, y1, mat] = p.strip;
    out.push({ mat, name: "front strip", inside: (q) => front(q) && q.y >= y0 && q.y < y1 });
  }
  out.push({ mat: p.roof, name: "roof", inside: (q) => q.y >= 3.0 && q.d >= 0.16 });
  for (const [i, s] of [-1, 1].entries()) {
    out.push({ mat: "frame", name: `pane ${i + 1} frame`, inside: (q) => inPane(q, s, 0) });
    out.push({ mat: "glass", name: `pane ${i + 1} glass`, inside: (q) => inPane(q, s, 0.045) });
  }
  return out;
}

function cabEnd(car: Car, e: number, p: Paint, number: string): void {
  const m = car.m;
  const n = new CabNose(m, {
    e, xTip: X_TIP, dJoin: D_JOIN, dSide: 0.15, profile: PROFILE, half: HALF, corner: CORNER,
    rows: ROWS, base: p.lower, layers: layers(p), cols: [6, 3, 1, 1], capTop: p.roof, capBottom: "black",
  });
  m.scope("skin", () => n.draw());
  // the snow plough under the buffer beam, its foot 60 mm ahead of the face
  m.scope("plough", () => {
    const plough = new CabNose(m, {
      e, xTip: X_TIP, dJoin: 0.35, dSide: 0.3, profile: [[0.18, -0.06], [0.28, -0.05], [0.6, -0.01], [0.74, 0.006]],
      half: [[0.18, 1.0], [0.45, 1.25], [0.74, 1.42]], corner: [[0.18, 0.55], [0.74, 0.35]],
      rows: [0.18, 0.28, 0.45, 0.74], base: p.lower, cols: [5, 3, 1, 1], capTop: p.lower, capBottom: "black",
      layers: [{ mat: "ploughEdge", name: "edge", inside: (q) => q.y < 0.28 }],
    });
    plough.draw();
    const x = e * (X_TIP - 0.35);
    m.scope("back", () => m.slab("black", [[x, 0.18, -0.95], [x, 0.18, 0.95], [x, 0.735, 1.41], [x, 0.735, -1.41]], [e * 0.01, 0, 0]));
  });
  m.scope("lamps", () => {
    for (const s of [-1, 1])
      m.scope(s < 0 ? "left" : "right", () => {
        const [lat, y] = [s * 1.13, p.lampY];
        m.scope("housing", () => n.plate(p.band[2], lat, y, [[-0.24, -0.15], [0.24, -0.15], [0.24, 0.15], [-0.24, 0.15]], 0.07, 0.09));
        m.scope("inner", () => n.lamp(s * 1.0, y, 0.085, "lampWhite", "frame", 12, 0.05));
        m.scope("outer", () => n.lamp(s * 1.26, y, 0.085, "lampRed", "frame", 12, 0.05));
      });
    m.scope("top", () => {
      const ring = Array.from({ length: 14 }, (_, i): [number, number] => [0.24 * Math.cos((2 * Math.PI * i) / 14), 0.1 * Math.sin((2 * Math.PI * i) / 14)]);
      m.scope("housing", () => n.plate("black", 0, 3.14, ring, 0.02, 0.06));
      for (const s of [-1, 1]) m.scope(s < 0 ? "left" : "right", () => n.lamp(s * 0.1, 3.14, 0.065, "lampWhite", "frame", 10, 0.0));
    });
  });
  m.scope("emblem", () => {
    const h = 0.13;
    const w = h * 1.5385;
    n.decal(p.emblemInk, emblem(-w / 2, p.lampY - h / 2, h, false));
  });
  m.scope("running number", () => {
    const h = 0.1;
    n.decal(p.ink, strokeText(number, -1.36, p.numberY, h, h * 0.58, h * 0.16));
  });
  m.scope("hoses", () => {
    for (const lat of [-0.45, -0.36, 0.36, 0.45]) {
      const x = e * (X_TIP + 0.05);
      m.prism(Math.abs(lat) > 0.4 ? "hoseRed" : "black", ngon(6, 0.025, 0, x, -e * lat), 0.42, 0.96);
    }
  });
  m.scope("wipers", () => {
    for (const s of [-1, 1]) {
      const a: [number, number] = [s * 0.68, 2.12];
      const b: [number, number] = [s * 0.42, 2.78];
      const t = 0.012;
      n.decal("black", [[a[0] - t, a[1]], [a[0] + t, a[1]], [b[0] + t, b[1]], [a[0] - t, a[1]], [b[0] + t, b[1]], [b[0] - t, b[1]]], 0.01);
    }
  });
}

/** The side's lettering: dark where it lies on a light band (1.4 to 1.6 m), white on red or blue. */
const sideInk = (p: Paint): string => {
  const [, , mat] = p.bands.find(([y0, y1]) => y0 <= 1.5 && 1.5 < y1)!;
  return mat === "red" || mat === "blue" ? "lettering" : "letteringDark";
};

/** The body between the cab ends; the floor at 0.8 m drops to 0.45 m at the steps. */
function body810(paint: Paint): Volume {
  const d = 0.01;
  return {
    name: "body",
    section: SECTION_810,
    plan: [[JOIN_SRC, 1.5], [13.3 - JOIN_SRC, 1.5]],
    bottom: [[JOIN_SRC, 0.7], [1.3 - d, 0.7], [1.3, 0.45], [2.1, 0.45], [2.1 + d, 0.7], [2.3, 0.8], [11.0, 0.8], [11.2 - d, 0.7], [11.2, 0.45], [12.0, 0.45], [12.0 + d, 0.7], [13.3 - JOIN_SRC, 0.7]],
    bands: paint.bands,
  };
}

/** The frame of the 810's native canvases. */
const FRAME_810: CarFrame = { kx: K810, ky: 1, kz: 1, centre: 6.65, sideH: 4, frontH: 4 };

function cd810Car(livery: Cd810Livery): MeshBuilder {
  const paint = PAINTS[livery];
  const car = new Car({ ...paint.palette, ploughEdge: c("#f2c40f"), hoseRed: c("#a5241e", 0.6) }, FRAME_810);
  const m = car.m;
  const body = car.volume(body810(paint));
  const number = cd810Number(livery);
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => sideItems(car, body, s, WINDOWS_810));
        m.scope("doors", () =>
          DOORS_810.forEach((dd, i) =>
            m.scope(`door ${i + 1}`, () => {
              // one leaf with its window, as the native drawing paints it, swinging
              // inward on the jamb toward the car's nearer end (doors.ts)
              car.c.door(body, s, car.side(dd.door), "bands", {
                seam: 0.03,
                opens: { kind: "swing", leaves: 1, from: i === 0 ? "low" : "high" },
                leafWork: (clip) => {
                  const w = clip(car.side(dd.glass));
                  if (w) car.c.m.scope("glass", () => car.c.window(body, s, w, { fw: 0.04 }));
                },
              });
            }),
          ),
        );
        m.scope("emblem", () => sideEmblem(car, body, s, s > 0 ? [32, 23, 38, 27] : [95, 23, 101, 27], sideInk(paint)));
        m.scope("running number", () => sideNumber(car, body, s, [60, 24, 70, 26], number, sideInk(paint)));
      });
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => cabEnd(car, e, paint, number));
  m.scope("buffers", () => buffersBoth(car, [6.65 - 6.985 / K810, 6.65 + 6.985 / K810], [0.4, 12.9], 1.0));
  m.scope("running gear", () => {
    for (const [i, x] of [-4.0, 4.0].entries())
      m.scope(`axle ${i + 1}`, () => car.c.axle(x + car.c.centre, 0.42, 0.8));
  });
  m.scope("underframe", () => {
    underBoxes(car, [
      { name: "engine", x0: 4.3, x1: 8.1, y0: 0.25, y1: 0.8, hw: 1.2 },
      { name: "gearbox", x0: 8.1, x1: 9.6, y0: 0.32, y1: 0.8, hw: 0.9 },
      { name: "fuel tank", x0: 3.0, x1: 4.3, y0: 0.4, y1: 0.79, hw: 1.0, mat: "tank" },
    ]);
  });
  m.scope("roof equipment", () => {
    m.scope("exhaust", () => exhaust(car, 4.8, 0, 3.25, 3.45, 0.09));
    m.scope("ventilator", () => block(m, "grey", car.X(8.2), car.X(8.6), 3.25, 3.42, -0.15, 0.15));
  });
  return m;
}

export function cd810(params?: ParamValues): MeshBuilder {
  const p = resolveParams(CD810_PARAMS, params);
  return cd810Car(p.livery as Cd810Livery);
}

/**
 * The 810 for distant views (lodUnits.ts): the body's section and bands, both
 * cab noses from their profile (the face upright to the sill, the windscreens
 * raked, the roof cap) painted in the livery's face colours with the lamp
 * band, the windscreens and the side window band, the two axles, the
 * underframe equipment and the ventilator.
 */
export function cd810Lod(params?: ParamValues): MeshBuilder {
  const livery = resolveParams(CD810_PARAMS, params).livery as Cd810Livery;
  const p = PAINTS[livery];
  const face = paintOver([[0.7, SILL, p.lower], [SILL, 3.0, p.upper], [3.0, 3.3, p.roof]], p.band, ...(p.strip ? [p.strip] : []));
  const screen = [{ u: [-PANE.outer, PANE.outer] as const, y: [PANE.y0, PANE.y1] as const, mat: LOD_GLASS }];
  const nose = (e: number) => noseEnd({ e, xTip: X_TIP, profile: PROFILE, half: HALF, corner: CORNER, rows: ROWS }, face, screen);
  const X = (x: number) => (x - FRAME_810.centre) * K810;
  const body = dmuBody(FRAME_810, body810(p), { y0: 0.7, items: WINDOWS_810, front: nose(1), rear: nose(-1) });
  return fitUnit({
    palette: { ...DMU_PALETTE, ...p.palette },
    bodies: [body],
    parts: [
      axleParts([[-4.0, 0.42], [4.0, 0.42]], 0.7),
      underPart(X(3.0), X(9.6), 0.25, 0.7, 1.2),
      roofPart("grey", X(8.2), X(8.6), 0.15, 0.15, 3.25, 3.42),
    ],
  }, 100);
}

export const DMU810_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-cd-810", game: { weight: 24, power: 155, maxspeed: 80, accel: null }, title: "CD 810", build: cd810, buildLod: cd810Lod, params: CD810_PARAMS, catalog: DMU_CATALOG, references: "cd-810" },
];
