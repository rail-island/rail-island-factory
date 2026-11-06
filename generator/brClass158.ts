// The British Rail Class 158 "Express Sprinter" (BREL Derby, 1989-92): a
// two-car diesel unit of 22.57 m aluminium cars on air-sprung bogies. Built for
// the series design `proc-vehicle-br-class-158` (ukUnits.ts), which keeps the
// series kit's parameters (`unit`: one car or the two-car unit; `livery`) and
// figures; the cars are drawn here on the railcar kit the Class 142 uses
// (dmuKit.ts, cabNose.ts): the flat cab front raked back from the lamps to the
// roof, its corners rounded in plan, the gangway door in its black frame between
// the two windscreens, each windscreen with the number panel and the lamp
// cluster below it in one black surround, the sloping valance and the coupler
// under it; the sides with the cab-side window, a double plug door at each end
// and nine saloon windows, the roof air-conditioning unit behind the cab, the
// engine, transmission, cooler and tanks between the bogies. Proportions and
// paint from the photographs and the diagram in assets/br-class-158/
// (SOURCES.md). See docs/models/uk-trains.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Pt, Volume } from "./csdCoachParts.ts";
import { COACH_PALETTE } from "./csdCoachParts.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { block } from "./vehicleParts.ts";
import { strokeText } from "./strokeFont.ts";
import { CabNose, inRoundRect, type NoseLayer, type NoseQuery } from "./cabNose.ts";
import { Car, DMU_PALETTE, sideItems, sideNumber, step, tankX, underBoxes, type CarFrame, type PxBox, type SideItem } from "./dmuKit.ts";
import { unitBogie } from "./unitParts.ts";
import { articulate } from "./tramKit.ts";
import { LOD_GLASS, type LodSections } from "./lodKit.ts";
import { bogieParts, dmuBody, fitUnit, noseEnd, paintOver, roofPart, shiftBody, turnBody, underPart, type UnitBody } from "./lodUnits.ts";

export type C158Livery = "regional" | "northern";
export type C158Unit = "endCar" | "train";

/** One car over its coupling planes (m). */
export const C158_CAR = 22.57;
/** Body length from the inner end wall to the cab face's foot; the couplers' reach beyond the cab face and the inner end. */
const LB = 21.9;
const FRONT = 0.33;
const INNER = 0.34;
/** The source x (0 at the inner end wall) of the car's centre between its coupling planes. */
const CENTRE = (LB + FRONT - INNER) / 2;
/** The bogies: centres 16.0 m apart about the car's centre, 2.6 m wheelbase, 0.84 m wheels. */
export const C158_BOGIES = 16.0;
const WHEELBASE = 2.6;
const WHEEL_R = 0.42;
const COUPLER_Y = 0.9;

/** The body's half width (2.70 m), its bottom, the eave (where the roof paint starts) and the crown. */
const HW = 1.35;
const BOTTOM = 0.98;
const EAVE = 3.05;
const CROWN = 3.81;
/** Where the cab nose meets the body, back from the face. */
const D_JOIN = 0.75;

// ---------------------------------------------------------------------------
// The liveries

interface Paint {
  palette: Record<string, MaterialSpec>;
  /** The sides' bands, bottom first; the last is the roof. */
  bands: Array<[number, number, string]>;
  roof: string;
  /** The door leaves' paint. */
  door: string;
  /** The cab front below this height (the valance and the lowest face), and its paint. */
  lowFront: readonly [number, string];
  /** The gangway door's light (a window in the leaf). */
  gangwayLight: boolean;
  /** A panel over the cab end of the sides, full height to the eave: its paint and its rear edge (source x, foot and top). */
  endPanel?: { mat: string; foot: number; top: number };
  /** The side number's ink and the running number. */
  ink: string;
  number: string;
}

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });

const PAINTS: Record<C158Livery, Paint> = {
  // Regional Railways Express, read from photo-class-158-dmu-158819-...jpg and the diagram:
  // light grey sides, the navy window band, a navy and a light blue line under it,
  // grey doors, the yellow end down to the valance
  regional: {
    palette: { rrGrey: c("#cdd0d2"), rrNavy: c("#1d2f6e"), rrBlue: c("#4f8fd0"), roofGrey: c("#6f7377", 0.6), doorGrey: c("#b9bdc0") },
    bands: [
      [BOTTOM, 1.6, "rrGrey"], [1.6, 1.67, "rrBlue"], [1.67, 1.71, "rrGrey"], [1.71, 1.75, "rrNavy"], [1.75, 1.84, "rrGrey"],
      [1.84, 2.8, "rrNavy"], [2.8, EAVE, "rrGrey"], [EAVE, 3.9, "roofGrey"],
    ],
    roof: "roofGrey", door: "doorGrey", lowFront: [0, "cabYellow"], gangwayLight: true, ink: "letteringDark", number: "158 819",
  },
  // Northern, read from photo-20230929-northern-158784-brough.jpg: white sides, the blue
  // panel over the cab end of the car back past the door, white door leaves, the yellow front
  // over a dark grey valance, the plain yellow gangway door
  northern: {
    palette: { nWhite: c("#e7e8e9"), nBlue: c("#2e2c7a"), roofGrey: c("#7d8084", 0.6), lowGrey: c("#4b4e52", 0.7) },
    bands: [[BOTTOM, EAVE, "nWhite"], [EAVE, 3.9, "roofGrey"]],
    roof: "roofGrey", door: "nWhite", lowFront: [1.32, "lowGrey"], gangwayLight: false, ink: "letteringDark", number: "158 784",
    endPanel: { mat: "nBlue", foot: 17.1, top: 16.7 },
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  cabYellow: c("#f2b51c"),
  numberWhite: c("#eef0ee", 0.4),
  bellows: c("#26272a", 0.95),
};

// ---------------------------------------------------------------------------
// The body (source metres: x from the inner end wall to the cab face)

/** A box in source metres as the kit's native pixels (the side canvas 4 m tall). */
const px = (x0: number, x1: number, y0: number, y1: number): PxBox => [x0 * 10, (4 - y1) * 10, x1 * 10, (4 - y0) * 10];

/** The section: the sides tucked in at the foot, upright to the cantrail, the roof's wide radius to the crown. */
const HALF: Pt[] = [[BOTTOM, 1.26], [1.1, 1.32], [1.25, HW], [3.0, HW], [3.22, 1.31], [3.45, 1.2], [3.62, 1.0], [3.74, 0.65], [3.8, 0.3], [CROWN, 0]];
/** The section as [z, y], round from the right side's foot, over the crown and down the left side. */
const SECTION: Pt[] = [
  ...HALF.slice(0, -1).map(([y, z]): Pt => [z, y]),
  [0, CROWN],
  ...HALF.slice(0, -1).reverse().map(([y, z]): Pt => [-z, y]),
];

const FRAME: CarFrame = { kx: 1, ky: 1, kz: 1, centre: CENTRE, sideH: 4, frontH: 4 };
/** The model x of the cab face. */
const X_TIP = LB - CENTRE;

/** The window row: the cab-side window, nine saloon windows between the doors (the diagram's). */
const SILL = 1.92;
const HEAD = 2.72;
const CAB_DOOR: [number, number] = [19.1, 20.1];
const INNER_DOOR: [number, number] = [1.15, 2.15];
const SALOON: [number, number] = [2.55, 18.65];
const WINDOWS: SideItem[] = [
  { kind: "window", box: px(20.45, 21.0, SILL, HEAD + 0.05), name: "cab-side window", fw: 0.05, mat: "rubber" },
  ...Array.from({ length: 9 }, (_, i): SideItem => {
    const pitch = (SALOON[1] - SALOON[0]) / 9;
    const x = SALOON[0] + pitch * (i + 0.5);
    return { kind: "window", box: px(x - 0.72, x + 0.72, SILL, HEAD), fw: 0.05, mat: "rubber" };
  }),
];
const DOOR_Y: [number, number] = [1.02, 2.98];
const doorBox = ([a, b]: [number, number]) => px(a, b, DOOR_Y[0], DOOR_Y[1]);
const doorGlass = ([a, b]: [number, number]) => [px(a + 0.12, (a + b) / 2 - 0.1, 1.85, 2.72), px((a + b) / 2 + 0.1, b - 0.12, 1.85, 2.72)];
const DOORS = [CAB_DOOR, INNER_DOOR];

function bodyVolume(p: Paint): Volume {
  return { name: "body", section: SECTION, plan: [[0, HW], [LB - D_JOIN, HW]], bands: p.bands };
}

/**
 * Paint laid on the side's facets `proud` off them between heights y0 and y1, from its front
 * edge to its rear edge, each edge source x at the foot (BOTTOM) and the eave (it may lean):
 * one slab per facet of the section.
 */
function facetPanel(car: Car, s: number, mat: string, front: readonly [number, number], rear: readonly [number, number], y0: number, y1: number, proud = 0.004): void {
  const pts = HALF.slice(0, -1);
  const zAt = (y: number) => {
    for (let i = 1; i < pts.length; i++) {
      const [ya, za] = pts[i - 1]!;
      const [yb, zb] = pts[i]!;
      if (y <= yb + 1e-9) return za + ((y - ya) / (yb - ya)) * (zb - za);
    }
    return pts[pts.length - 1]![1];
  };
  const at = (e: readonly [number, number], y: number) => e[0] + ((y - BOTTOM) / (EAVE - BOTTOM)) * (e[1] - e[0]);
  const ys = [y0, ...pts.map(([y]) => y).filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6), y1];
  for (let i = 1; i < ys.length; i++) {
    const [ya, yb] = [ys[i - 1]!, ys[i]!];
    const [za, zb] = [zAt(ya), zAt(yb)];
    // the facet's outward normal in the (z, y) plane
    const l = Math.hypot(yb - ya, zb - za);
    const [nz, ny] = [(yb - ya) / l, -(zb - za) / l];
    const P = (x: number, y: number, z: number): [number, number, number] => [car.X(x), y + ny * proud, s * (z + nz * proud)];
    car.m.slab(mat, [P(at(front, ya), ya, za), P(at(rear, ya), ya, za), P(at(rear, yb), yb, zb), P(at(front, yb), yb, zb)], [0, -ny * 0.003, -s * nz * 0.003]);
  }
}

// ---------------------------------------------------------------------------
// The cab end (d back from the face, lat to the viewer's right)

/** The face upright at the valance, then raked back as one plane from the lamps to the top, rounding into the roof. */
const PROFILE: Pt[] = [[BOTTOM, 0.03], [1.2, 0], [3.15, 0.2], [3.35, 0.29], [3.55, 0.42], [3.7, 0.57], [CROWN, D_JOIN]];
const CORNER: Pt[] = [[BOTTOM, 0.3], [3.0, 0.3], [3.45, 0.2], [CROWN, 0.05]];
const ROWS = [BOTTOM, 1.1, 1.25, 1.32, 1.5, 1.85, 2.1, 2.6, 3.0, 3.15, 3.35, 3.55, 3.7, CROWN];

/** Each windscreen's black surround (the number panel and the lamps below the glass), its pane; the gangway door. */
const MASK = { cx: 0.85, cy: 2.41, hw: 0.33, hh: 0.93, r: 0.13 };
const PANE = { a: 0.57, b: 1.13, y0: 2.08, y1: 3.24, r: 0.08 };
const GANGWAY = { hw: 0.47, y0: 1.22, y1: 3.32, bar: 0.11 };
const LAMP_Y = 1.66;

const onFace = (q: NoseQuery) => Math.abs(q.u) <= 2;

function layers(p: Paint): NoseLayer[] {
  // the yellow end wraps round the corners; the cab sides take the body's bands (or the end panel)
  const out: NoseLayer[] = p.bands.map(([y0, y1, mat]): NoseLayer => ({ mat, name: `${mat} side`, inside: (q) => !onFace(q) && q.y >= y0 && q.y < y1 }));
  if (p.endPanel) out.push({ mat: p.endPanel.mat, name: "cab side panel", inside: (q) => !onFace(q) && q.y < EAVE });
  const [low, lowMat] = p.lowFront;
  if (low > 0) out.push({ mat: lowMat, name: "low front", inside: (q) => onFace(q) && q.y < low });
  out.push({ mat: p.roof, name: "roof", inside: (q) => q.y >= 3.62 || (!onFace(q) && q.y >= EAVE) });
  for (const [i, sd] of [-1, 1].entries()) {
    out.push({ mat: "rubber", name: `surround ${i + 1}`, inside: (q) => onFace(q) && inRoundRect(q.lat, q.y, sd * MASK.cx, MASK.cy, MASK.hw, MASK.hh, MASK.r) });
    out.push({ mat: "glass", name: `pane ${i + 1}`, inside: (q) => onFace(q) && inRoundRect(q.lat, q.y, (sd * (PANE.a + PANE.b)) / 2, (PANE.y0 + PANE.y1) / 2, (PANE.b - PANE.a) / 2, (PANE.y1 - PANE.y0) / 2, PANE.r) });
  }
  return out;
}

function cabEnd(car: Car, p: Paint): void {
  const m = car.m;
  const e = 1;
  const n = new CabNose(m, {
    e, xTip: X_TIP, dJoin: D_JOIN, dSide: 0.32, profile: PROFILE, half: HALF, corner: CORNER, bulge: 0.04,
    rows: ROWS, base: "cabYellow", layers: layers(p), cols: [8, 4, 1, 1], capTop: p.roof, capBottom: "black",
  });
  m.scope("skin", () => n.draw());
  // the gangway door: its black frame standing off the face, the leaf recessed in it
  m.scope("gangway door", () => {
    const g = GANGWAY;
    const frame = (name: string, x0: number, x1: number, y0: number, y1: number) =>
      m.scope(name, () => n.plate("rubber", (x0 + x1) / 2, (y0 + y1) / 2, [[x0 - (x0 + x1) / 2, y0 - (y0 + y1) / 2], [x1 - (x0 + x1) / 2, y0 - (y0 + y1) / 2], [x1 - (x0 + x1) / 2, y1 - (y0 + y1) / 2], [x0 - (x0 + x1) / 2, y1 - (y0 + y1) / 2]], 0.07, 0.1));
    frame("frame left", -g.hw, -g.hw + g.bar, g.y0, g.y1);
    frame("frame right", g.hw - g.bar, g.hw, g.y0, g.y1);
    frame("frame top", -g.hw + g.bar, g.hw - g.bar, g.y1 - g.bar, g.y1);
    frame("frame bottom", -g.hw + g.bar, g.hw - g.bar, g.y0, g.y0 + g.bar);
    const leaf: Pt[] = [[-0.36, -0.94], [0.36, -0.94], [0.36, 0.94], [-0.36, 0.94]];
    m.scope("leaf", () => n.plate("cabYellow", 0, 2.27, leaf, 0.035, 0.06));
    if (p.gangwayLight) m.scope("light", () => n.plate("glass", 0, 2.45, [[-0.22, -0.45], [0.22, -0.45], [0.22, 0.45], [-0.22, 0.45]], 0.04, 0.01));
    m.scope("handle", () => n.plate("steel", 0.27, 2.1, [[-0.02, -0.1], [0.02, -0.1], [0.02, 0.1], [-0.02, 0.1]], 0.05, 0.02));
  });
  m.scope("lamps", () => {
    for (const s of [-1, 1])
      m.scope(s < 0 ? "left" : "right", () => {
        m.scope("head", () => n.lamp(s * 1.0, LAMP_Y, 0.075, "lampWhite", "frame", 12, 0.0));
        m.scope("marker", () => n.lamp(s * 0.84, LAMP_Y, 0.05, "lampWhite", "frame", 10, 0.0));
        m.scope("tail", () => n.lamp(s * 0.69, LAMP_Y, 0.055, "lampRed", "black", 10, 0.0));
      });
  });
  m.scope("running number", () => {
    const h = 0.11;
    n.decal("numberWhite", strokeText(p.number.replace(" ", ""), 0.62, 1.94, h, h * 0.58, h * 0.16), 0.005);
  });
  m.scope("wipers", () => {
    for (const s of [-1, 1]) {
      const a: Pt = [s * 0.8, 2.16];
      const b: Pt = [s * 1.0, 3.05];
      const t = 0.012;
      n.decal("black", [[a[0] - t, a[1]], [a[0] + t, a[1]], [b[0] + t, b[1]], [a[0] - t, a[1]], [b[0] + t, b[1]], [b[0] - t, b[1]]], 0.03);
    }
  });
  // the valance under the face, sloping back to its foot, the coupler in its pocket
  const x = (sx: number) => car.X(sx);
  const lowMat = p.lowFront[0] > 0 ? p.lowFront[1] : "cabYellow";
  m.scope("valance", () => {
    const poly: Array<[number, number]> = [[x(LB + 0.03), BOTTOM], [x(LB - 0.12), 0.56], [x(LB - 0.7), 0.56], [x(LB - 0.7), BOTTOM]];
    for (const [z0, z1] of [[-1.2, -0.42], [0.42, 1.2]] as const) m.sweep(lowMat, "z", poly, z0, poly, z1);
    const pocket: Array<[number, number]> = [[x(LB - 0.2), BOTTOM], [x(LB - 0.3), 0.6], [x(LB - 0.7), 0.6], [x(LB - 0.7), BOTTOM]];
    m.sweep("black", "z", pocket, -0.42, pocket, 0.42);
  });
  m.scope("coupler", () => coupler(m, e, x(LB + FRONT), x(LB - 0.3)));
}

/** A BSI coupler on end e: the head's face at model x `head`, its shank back to `back`. */
function coupler(m: MeshBuilder, e: number, head: number, back: number): void {
  const [a, b] = [head - e * 0.16, back].sort((p, q) => p - q) as [number, number];
  block(m, "coupler", a, b, COUPLER_Y - 0.06, COUPLER_Y + 0.06, -0.07, 0.07);
  const [h0, h1] = [head - e * 0.16, head].sort((p, q) => p - q) as [number, number];
  block(m, "coupler", h0, h1, COUPLER_Y - 0.14, COUPLER_Y + 0.14, -0.15, 0.15);
}

// ---------------------------------------------------------------------------
// A car

/** Draws one car, cab at +X and centred between its coupling planes, into `m`; `inner` draws its gangway (a lone car). */
function drawCar(m: MeshBuilder, livery: C158Livery, inner: boolean, place: (p: [number, number, number]) => [number, number, number] = (p) => p): void {
  const p = PAINTS[livery];
  const car = new Car(p.palette, FRAME, m);
  const body = car.volume(bodyVolume(p), car.doorways(DOORS.map(doorBox), 0.03));
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const ep = p.endPanel;
        if (ep) m.scope("end panel", () => {
          // round the cab door: ahead of it to the nose, behind it to the panel's leaning rear edge, over it
          const nose = LB - D_JOIN + 0.05;
          const [d0, d1] = [CAB_DOOR[0] - 0.02, CAB_DOOR[1] + 0.02];
          facetPanel(car, s, ep.mat, [nose, nose], [d1, d1], BOTTOM, EAVE);
          facetPanel(car, s, ep.mat, [d0, d0], [ep.foot, ep.top], BOTTOM, EAVE);
          facetPanel(car, s, ep.mat, [d1, d1], [d0, d0], DOOR_Y[1] + 0.03, EAVE);
        });
        m.scope("windows", () => sideItems(car, body, s, WINDOWS));
        for (const [i, d] of DOORS.entries())
          m.scope(`door ${i + 1}`, () => {
            car.openingDoor(body, s, doorBox(d), doorGlass(d), p.door, 0.03, { kind: "plug", leaves: 2 }, (j) => `light ${j}`, { fw: 0.04, frame: "rubber" });
            m.scope("step", () => step(car, s, px(d[0] + 0.05, d[1] - 0.05, 0.72, 0.76), HW));
          });
        m.scope("running number", () => sideNumber(car, body, s, px(3.0, 4.3, 1.3, 1.4), p.number, p.ink));
      });
  });
  m.scope("cab end", () => cabEnd(car, p));
  m.scope("inner end", () => {
    if (inner) m.scope("gangway", () => block(m, "rubber", car.X(-0.14), car.X(0.02), 1.15, 3.1, -0.55, 0.55));
    m.scope("coupler", () => coupler(m, -1, car.X(-INNER), car.X(0.3)));
  });
  m.scope("running gear", () => {
    for (const [i, d] of [-1, 1].entries())
      m.scope(`bogie ${i + 1}`, () => unitBogie(car.c, car.X(CENTRE + (d * C158_BOGIES) / 2), { wb: WHEELBASE, r: WHEEL_R, top: BOTTOM - 0.02, air: true }));
  });
  m.scope("underframe", () => {
    m.scope("solebars", () => { for (const s of [-1, 1]) block(m, "underframe", car.X(0.1), car.X(LB - 0.75), 0.86, BOTTOM + 0.01, ...(s > 0 ? [1.16, 1.24] : [-1.24, -1.16]) as [number, number]); });
    underBoxes(car, [
      { name: "batteries", x0: 4.6, x1: 5.9, y0: 0.5, y1: 0.97, hw: 0.75, mat: "grey" },
      { name: "engine", x0: 8.6, x1: 11.4, y0: 0.36, y1: 0.97, hw: 0.85 },
      { name: "transmission", x0: 11.4, x1: 12.6, y0: 0.42, y1: 0.97, hw: 0.55 },
      { name: "cooler", x0: 13.4, x1: 15.4, y0: 0.4, y1: 0.97, hw: 1.15, mat: "grey" },
      { name: "air conditioning plant", x0: 16.2, x1: 17.0, y0: 0.55, y1: 0.97, hw: 0.9, mat: "grey" },
    ]);
    m.scope("fuel tank", () => tankX(car, 6.2, 8.2, 0.68, 0.7, 0.28));
    m.scope("air tank", () => tankX(car, 6.4, 7.8, 0.76, -0.75, 0.2));
    m.scope("silencer", () => tankX(car, 11.5, 12.5, 0.72, 0.85, 0.17, "exhaust"));
  });
  m.scope("roof equipment", () => {
    // the air-conditioning unit behind the cab, its grille; the vents along the roof
    m.scope("air conditioning", () => {
      block(m, p.roof, car.X(17.6), car.X(19.6), CROWN - 0.12, CROWN + 0.1, -0.7, 0.7);
      for (let k = 0; k < 8; k++) {
        const xa = 17.75 + k * 0.23;
        block(m, "black", car.X(xa), car.X(xa + 0.12), CROWN + 0.1, CROWN + 0.115, -0.5, 0.5);
      }
    });
    m.scope("vents", () => { for (const d of [4.5, 9.0, 13.5]) block(m, "roofDark", car.X(d - 0.25), car.X(d + 0.25), CROWN - 0.06, CROWN + 0.04, -0.3, 0.3); });
    // the stack drawn through the builder's frame; its smoke placed where the car stands (an emitter is not moved by it)
    m.scope("exhaust", () => {
      m.emit("smoke", place([car.X(0.7), CROWN + 0.08, -0.6]), 0.07);
      m.prism("exhaust", ngon(8, 0.07, Math.PI / 8, car.X(0.7), -0.6), 3.6, CROWN + 0.08);
    });
  });
}

const builder = (livery: C158Livery) => new MeshBuilder({ ...INTERIOR_PALETTE, ...COACH_PALETTE, ...DMU_PALETTE, ...PALETTE, ...PAINTS[livery].palette });

/** The bellows between the two cars' gangways. */
const BELLOWS: Array<[number, number]> = [[-0.55, 1.15], [0.55, 1.15], [0.55, 3.1], [-0.55, 3.1]];

/** The Class 158: one car (default) or the two-car unit, in a livery. */
export function class158(unit: C158Unit, livery: C158Livery): MeshBuilder {
  const m = builder(livery);
  if (unit === "endCar") {
    drawCar(m, livery, true);
    return m;
  }
  const h = C158_CAR / 2;
  articulate({ m }, [
    { x0: INNER, x1: C158_CAR, draw: () => m.scope("car 1", () => m.moved(([x, y, z]) => [x + h, y, z], () => drawCar(m, livery, false, ([x, y, z]) => [x + h, y, z]))) },
    { x0: -C158_CAR, x1: -INNER, draw: () => m.scope("car 2", () => m.turned(0, () => m.moved(([x, y, z]) => [x + h, y, z], () => drawCar(m, livery, false, ([x, y, z]) => [-(x + h), y, -z])))) },
  ], COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, 10, [0]);
  return m;
}

// ---------------------------------------------------------------------------
// The distant model

function carLod(livery: C158Livery, inner: boolean): UnitBody {
  const p = PAINTS[livery];
  const face = paintOver([[BOTTOM, 3.62, "cabYellow"], [3.62, CROWN, p.roof]], [MASK.cy - MASK.hh, MASK.cy + MASK.hh, "rubber"]);
  const nose = noseEnd({ e: 1, xTip: X_TIP, profile: PROFILE, half: HALF, corner: CORNER, rows: ROWS }, face, [{ u: [-PANE.b, PANE.b], y: [PANE.y0, PANE.y1], mat: LOD_GLASS }]);
  const body = dmuBody(FRAME, bodyVolume(p), { y0: BOTTOM, items: WINDOWS, front: nose, gap: 1.0 });
  return inner ? body : { ...body, rear: { ...body.rear, hidden: true } };
}

const carParts = (livery: C158Livery, dx: number, turned: boolean, section?: number) => {
  const p = PAINTS[livery];
  const T = (x: number) => (turned ? -(x + dx) : x + dx);
  return [
    ...bogieParts([-1, 1].map((d) => [T((d * C158_BOGIES) / 2), WHEELBASE / 2 + WHEEL_R, section] as const), BOTTOM),
    underPart(T(8.6 - CENTRE), T(15.4 - CENTRE), 0.4, BOTTOM, 1.0, 50, section),
    roofPart(p.roof, T(17.6 - CENTRE), T(19.6 - CENTRE), 0.7, 0.7, CROWN - 0.12, CROWN + 0.1, section),
  ];
};

export function class158Lod(unit: C158Unit, livery: C158Livery): MeshBuilder {
  const palette = { ...DMU_PALETTE, ...PALETTE, ...PAINTS[livery].palette };
  if (unit === "endCar") return fitUnit({ palette, bodies: [carLod(livery, true)], parts: carParts(livery, 0, false) }, 100);
  const h = C158_CAR / 2;
  const b = carLod(livery, false);
  const sections: LodSections = {
    pivots: [[0, 0, 0], [0, COUPLER_Y, 0]],
    joints: [{ sections: [0, 1], front: INNER, rear: -INNER, profile: BELLOWS }],
    maxBendDeg: 10,
  };
  return fitUnit({
    palette,
    bodies: [{ ...shiftBody(b, h), section: 0 }, { ...turnBody(shiftBody(b, h), 0), section: 1 }],
    parts: [...carParts(livery, h, false, 0), ...carParts(livery, h, true, 1)],
    sections,
  }, 200);
}
