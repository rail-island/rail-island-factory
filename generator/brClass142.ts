// The British Rail Class 142 "Pacer" (BREL Derby and Leyland, 1985-87): a
// two-car diesel unit whose cars are Leyland National bus bodies, widened to
// 2.80 m, on four-wheeled wagon underframes. Built for the series design
// `proc-vehicle-br-class-142` (ukUnits.ts), which keeps the series kit's
// parameters (`unit`: one car or the two-car unit; `livery`) and figures; the
// cars are drawn here on the two-axle railcar kit the CD 810 uses (dmuKit.ts,
// cabNose.ts): the straight bus sides with their window row and the double
// door behind the cab, the flat yellow cab front with the black surround over
// the three windscreens and the destination blind, the lamp clusters low on the
// face, buffers and a coupling on the buffer beam, single axles 9.0 m apart in
// horn guides on coil springs with dampers and brake blocks, the underframe's
// engine, cooler and tanks between them, the roof
// pod and the exhaust at the inner end. Proportions and paint from the
// photographs in assets/br-class-142/ (SOURCES.md). See docs/models/uk-trains.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Pt, Volume } from "./csdCoachParts.ts";
import { COACH_PALETTE } from "./csdCoachParts.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { block } from "./vehicleParts.ts";
import { coil } from "./cd163.ts";
import { strokeText } from "./strokeFont.ts";
import { CabNose, inRoundRect, type NoseLayer, type NoseQuery } from "./cabNose.ts";
import { Car, DMU_PALETTE, sideItems, sideNumber, step, tankX, underBoxes, type CarFrame, type PxBox, type SideItem } from "./dmuKit.ts";
import { articulate } from "./tramKit.ts";
import { LOD_GLASS, type LodSections } from "./lodKit.ts";
import { axleParts, dmuBody, fitUnit, noseEnd, paintOver, roofPart, shiftBody, turnBody, underPart, type UnitBody } from "./lodUnits.ts";

export type C142Livery = "provincial" | "northern" | "walesTeal" | "provincialBlue" | "metro" | "walesWrap";
export type C142Unit = "endCar" | "train";

/** One car over its coupling planes (m): the buffers at the cab end, the bar coupling at the inner end. */
export const C142_CAR = 15.45;
/** Body length from the inner end wall to the cab face; the buffers' and the inner coupling's reach. */
const LB = 14.65;
const BUFFERS = 0.55;
const INNER = 0.25;
/** The source x (0 at the inner end wall) of the car's centre between its coupling planes. */
const CENTRE = (LB + BUFFERS - INNER) / 2;
/** The axles: 9.0 m apart about the car's centre, wheels 0.84 m. */
export const C142_WHEELBASE = 9.0;
const WHEEL_R = 0.42;
const COUPLER_Y = 1.0;

/**
 * The body's half width: the real 2.80 m narrowed to 2.74 m so the window frames, standing
 * 33 mm proud, stay within the W6a gauge's 2.82 m (loadingGauge.ts "uk").
 */
const HW = 1.37;
/** The body's bottom, the eave (top of the side paint) and the crown. */
const BOTTOM = 0.95;
const EAVE = 3.15;
const CROWN = 3.7;
/** The doorway's front (inner-end) edge, source x. */
const DOOR_FRONT = 11.0;
/** Where the cab nose meets the body, back from the face. */
const D_JOIN = 0.55;

// ---------------------------------------------------------------------------
// The liveries

interface Paint {
  palette: Record<string, MaterialSpec>;
  /** The sides' bands, bottom first; the last is the roof. */
  bands: Array<[number, number, string]>;
  roof: string;
  /** The door leaves' paint. */
  door: string;
  /**
   * Paint laid over the bands on the flat of both sides (1.08 to 3.12 m): convex polygons in
   * source x and height, each a scope of its name - a panel, a sweep, a livery's triangles.
   */
  shapes?: ReadonlyArray<{ name: string; mat: string; pts: readonly Pt[]; layer?: number }>;
  /** The cab sides' paint from this height to the eave, over the bands (a panel reaching the cab). */
  cabSide?: readonly [number, string];
  /** The side number's ink and the running number. */
  ink: string;
  number: string;
}

const c = (color: string, roughness = 0.5): MaterialSpec => ({ color, roughness });

/** The flat of the sides, where `shapes` lie. */
const FLAT: readonly [number, number] = [1.1, 3.1];
/** The doorway end of the side ahead of the door, to the cab nose. */
const AHEAD: readonly [number, number] = [12.42, LB - D_JOIN + 0.05];

/**
 * Arriva's white panel from the door to the cab: its foot sweeping down toward the cab as a
 * parabola (convex, so one polygon), from `hi` at the door to `lo` where the cab begins.
 */
function sweepPanel(lo: number, hi: number, n = 10): Pt[] {
  const [x0, x1] = AHEAD;
  const foot = Array.from({ length: n + 1 }, (_, i): Pt => {
    const x = x1 - ((x1 - x0) * i) / n;
    const t = (x1 - x) / (x1 - x0);
    return [x, lo + (hi - lo) * t * t];
  });
  return [[x0, FLAT[1]], [x1, FLAT[1]], ...foot];
}

/** West Yorkshire Metro's triangles: upright ones and inverted ones between them along the saloon. */
function metroTriangles(): Array<{ name: string; mat: string; pts: Pt[] }> {
  const [y0, y1] = [FLAT[0], 2.95];
  const w = 2.0;
  const out: Array<{ name: string; mat: string; pts: Pt[] }> = [];
  for (let k = 0; k < 5; k++) {
    const a = 0.4 + k * w;
    out.push({ name: `triangle up ${k + 1}`, mat: "lime", pts: [[a, y0], [a + w, y0], [a + w / 2, y1]] });
    if (k < 4) out.push({ name: `triangle down ${k + 1}`, mat: "leaf", pts: [[a + w / 2, y1], [a + w / 2 + w, y1], [a + w, y0]] });
  }
  return out;
}

const rect = (x0: number, x1: number, y0: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

const WALES_PALETTE = { teal: c("#0f8c9c"), white: c("#eef0ee"), lineYellow: c("#f0c020"), doorPale: c("#c4d9e0"), roofDark: c("#5d6265", 0.6) };

const PAINTS: Record<C142Livery, Paint> = {
  // the series kit's first scheme: chocolate below, cream at the windows
  provincial: {
    palette: { brown: c("#7a4a2a"), cream: c("#e6dcc0"), roofGrey: c("#7d8084", 0.6) },
    bands: [[BOTTOM, 1.75, "brown"], [1.75, 2.8, "cream"], [2.8, EAVE, "brown"], [EAVE, 3.8, "roofGrey"]],
    roof: "roofGrey", door: "brown", ink: "lettering", number: "142 001",
  },
  // Northern: the navy skirt, the silver sides
  northern: {
    palette: { navy: c("#262262"), silver: c("#d0d3d4"), roofGrey: c("#7d8084", 0.6) },
    bands: [[BOTTOM, 1.45, "navy"], [1.45, EAVE, "silver"], [EAVE, 3.8, "roofGrey"]],
    roof: "roofGrey", door: "navy", ink: "letteringDark", number: "142 096",
  },
  // Arriva Trains Wales (later under Transport for Wales), read from
  // photo-142080-at-cardiff-central-29805614596.jpg: teal sides, the yellow
  // line under the windows, the white panel from the door to the cab with its
  // sweep down toward the cab, pale door leaves, the dark roof
  walesTeal: {
    palette: WALES_PALETTE,
    bands: [[BOTTOM, 1.7, "teal"], [1.7, 1.74, "lineYellow"], [1.74, EAVE, "teal"], [EAVE, 3.8, "roofDark"]],
    roof: "roofDark", door: "doorPale", ink: "letteringDark", number: "142 080",
    shapes: [{ name: "panel", mat: "white", pts: sweepPanel(1.36, 1.7) }], cabSide: [1.36, "white"],
  },
  // BR Provincial's blue, read from photo-castleford-railway-station-geograph-org-uk-332898.jpg
  // (142 088): light blue at the windows, the white line under them, dark blue below, a light
  // blue line at the foot, the pale roof
  provincialBlue: {
    palette: { darkBlue: c("#1f3f8f"), lightBlue: c("#8fb0d8"), white: c("#eef0ee"), doorGrey: c("#9aa6b4"), roofPale: c("#c9cdd0", 0.6) },
    bands: [[BOTTOM, 1.1, "lightBlue"], [1.1, 1.72, "darkBlue"], [1.72, 1.8, "white"], [1.8, EAVE, "lightBlue"], [EAVE, 3.8, "roofPale"]],
    roof: "roofPale", door: "doorGrey", ink: "lettering", number: "142 088",
  },
  // West Yorkshire Metro (Arriva Trains Northern), read from photo-wakefield-kirkgate-2.jpg:
  // teal with lime and leaf-green triangles along the saloon, the dark roof
  metro: {
    palette: { teal: c("#1497a6"), lime: c("#a6cf3a"), leaf: c("#3faa4c"), roofDark: c("#5d6265", 0.6) },
    bands: [[BOTTOM, EAVE, "teal"], [EAVE, 3.8, "roofDark"]],
    roof: "roofDark", door: "teal", ink: "lettering", number: "142 066",
    shapes: metroTriangles(),
  },
  // Transport for Wales' wrapped Arriva teal, read from
  // photo-142075-to-cardiff-central-at-treforest-48476252042.jpg: the navy wrap along the
  // saloon under the windows with its white line, the white panel ahead of the door
  walesWrap: {
    palette: { ...WALES_PALETTE, wrapNavy: c("#1d2440") },
    bands: [[BOTTOM, EAVE, "teal"], [EAVE, 3.8, "roofDark"]],
    roof: "roofDark", door: "doorPale", ink: "letteringDark", number: "142 075",
    shapes: [
      { name: "panel", mat: "white", pts: sweepPanel(1.36, 1.7) },
      { name: "wrap", mat: "wrapNavy", pts: rect(0.3, DOOR_FRONT - 0.15, 1.18, 1.82) },
      { name: "wrap line", mat: "white", pts: rect(0.5, DOOR_FRONT - 0.35, 1.3, 1.33), layer: 1 },
    ],
    cabSide: [1.36, "white"],
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  cabYellow: c("#f2b51c"),
  destGlass: { color: "#3a3f44", metallic: 0.1, roughness: 0.2, glass: true },
  hoseRed: c("#a5241e", 0.6),
  bellows: c("#26272a", 0.95),
};

// ---------------------------------------------------------------------------
// The body (source metres: x from the inner end wall to the cab face, 0.1 m a native pixel)

/** A box in source metres as the kit's native pixels (the side canvas 4 m tall). */
const px = (x0: number, x1: number, y0: number, y1: number): PxBox => [x0 * 10, (4 - y1) * 10, x1 * 10, (4 - y0) * 10];

/** The bus body's section: straight sides tucked in at the foot, the shallow roof on small shoulders. */
const SECTION: Pt[] = [
  [-1.33, BOTTOM], [1.33, BOTTOM], [HW, 1.08], [HW, 3.12], [1.33, 3.3], [1.21, 3.46], [0.83, 3.62], [0, CROWN],
  [-0.83, 3.62], [-1.21, 3.46], [-1.33, 3.3], [-HW, 3.12], [-HW, 1.08],
];
const HALF: Pt[] = [[BOTTOM, 1.33], [1.08, HW], [3.12, HW], [3.3, 1.33], [3.46, 1.21], [3.62, 0.83], [CROWN, 0]];

const FRAME: CarFrame = { kx: 1, ky: 1, kz: 1, centre: CENTRE, sideH: 4, frontH: 4 };
/** The model x of the cab face. */
const X_TIP = LB - CENTRE;

/** The window row: the cab-side window ahead of the door, seven saloon windows behind it, their hoppers on top. */
const SILL = 1.85;
const HEAD = 2.75;
const SASH = (4 - 2.52) * 10;
const DOOR: [number, number] = [DOOR_FRONT, 12.35];
const WINDOWS: SideItem[] = [
  { kind: "window", box: px(12.6, 13.85, SILL, HEAD), name: "cab-side window", fw: 0.06, mat: "rubber" },
  ...Array.from({ length: 7 }, (_, i): SideItem => {
    const pitch = (DOOR[0] - 0.4 - 0.35) / 7;
    const x = 0.35 + pitch * (i + 0.5);
    return { kind: "window", box: px(x - 0.63, x + 0.63, SILL, HEAD), sash: SASH, fw: 0.06, mat: "rubber" };
  }),
];
/** The double door: two leaves, each with its tall light. */
const DOOR_BOX = px(DOOR[0], DOOR[1], 0.98, 2.98);
const DOOR_GLASS = [px(DOOR[0] + 0.09, (DOOR[0] + DOOR[1]) / 2 - 0.07, 1.28, 2.8), px((DOOR[0] + DOOR[1]) / 2 + 0.07, DOOR[1] - 0.09, 1.28, 2.8)];

function bodyVolume(p: Paint): Volume {
  return { name: "body", section: SECTION, plan: [[0, HW], [LB - D_JOIN, HW]], bands: p.bands };
}

// ---------------------------------------------------------------------------
// The cab end (d back from the face, lat to the viewer's right)

/** The face upright from the buffer beam to the windscreens' sill, then leaning back over the blind into the roof. */
const PROFILE: Pt[] = [[BOTTOM, 0.05], [1.2, 0], [1.95, 0], [2.95, 0.07], [3.15, 0.1], [3.3, 0.15], [3.46, 0.24], [3.62, 0.38], [CROWN, D_JOIN]];
const CORNER: Pt[] = [[BOTTOM, 0.18], [3.12, 0.18], [3.46, 0.12], [CROWN, 0.05]];
const ROWS = [BOTTOM, 1.08, 1.2, 1.5, 1.95, 2.5, 2.95, 3.12, 3.3, 3.46, 3.62, CROWN];

/**
 * The black surround over the windscreens and the blind; the three panes (the driver's, the
 * centre one and the second man's, photo-castleford-...jpg and photo-142075-...jpg); the blind.
 */
const MASK = { cy: 2.6, hw: 1.22, hh: 0.66, r: 0.12 };
const PANE = { outer: 1.12, y0: 2.02, y1: 2.86, r: 0.06 };
const PANES: ReadonlyArray<readonly [number, number]> = [[-PANE.outer, -0.44], [-0.36, 0.36], [0.44, PANE.outer]];
const BLIND = { hw: 0.5, y0: 2.96, y1: 3.18 };
const LAMP_Y = 1.42;

const inPane = (q: NoseQuery, [a, b]: readonly [number, number]): boolean =>
  !q.side && inRoundRect(q.lat, q.y, (a + b) / 2, (PANE.y0 + PANE.y1) / 2, (b - a) / 2, (PANE.y1 - PANE.y0) / 2, PANE.r);

function layers(p: Paint): NoseLayer[] {
  // the yellow end wraps round the corners; the cab sides take the body's bands
  const end = (q: NoseQuery) => Math.abs(q.u) <= 2;
  const out: NoseLayer[] = p.bands.map(([y0, y1, mat]): NoseLayer => ({ mat, name: `${mat} side`, inside: (q) => !end(q) && q.y >= y0 && q.y < y1 }));
  if (p.cabSide) {
    const [y0, mat] = p.cabSide;
    out.push({ mat, name: "cab side panel", inside: (q) => !end(q) && q.y >= y0 && q.y < EAVE });
  }
  out.push(
    { mat: p.roof, name: "roof", inside: (q) => q.y >= 3.3 || (!end(q) && q.y >= EAVE) },
    { mat: "rubber", name: "surround", inside: (q) => Math.abs(q.u) <= 1 && inRoundRect(q.lat, q.y, 0, MASK.cy, MASK.hw, MASK.hh, MASK.r) },
    { mat: "destGlass", name: "blind", inside: (q) => Math.abs(q.u) <= 1 && Math.abs(q.lat) < BLIND.hw && q.y >= BLIND.y0 && q.y < BLIND.y1 },
  );
  PANES.forEach((pane, i) => out.push({ mat: "glass", name: `pane ${i + 1}`, inside: (q) => inPane(q, pane) }));
  return out;
}

function cabEnd(car: Car, p: Paint, number: string): void {
  const m = car.m;
  const e = 1;
  const n = new CabNose(m, {
    e, xTip: X_TIP, dJoin: D_JOIN, dSide: 0.2, profile: PROFILE, half: HALF, corner: CORNER,
    rows: ROWS, base: "cabYellow", layers: layers(p), cols: [6, 3, 1, 1], capTop: p.roof, capBottom: "black",
  });
  m.scope("skin", () => n.draw());
  m.scope("lamps", () => {
    for (const s of [-1, 1])
      m.scope(s < 0 ? "left" : "right", () => {
        const plate: Pt[] = [[-0.2, -0.09], [0.2, -0.09], [0.2, 0.09], [-0.2, 0.09]];
        m.scope("housing", () => n.plate("black", s * 1.0, LAMP_Y, plate, 0.012, 0.03));
        m.scope("head", () => n.lamp(s * 0.9, LAMP_Y, 0.07, "lampWhite", "frame", 12, 0.0));
        m.scope("marker", () => n.lamp(s * 1.1, LAMP_Y, 0.06, "lampWhite", "frame", 10, 0.0));
        m.scope("tail", () => n.lamp(s * 1.1, LAMP_Y + 0.2, 0.045, "lampRed", "black", 8, 0.0));
      });
  });
  m.scope("horn grille", () => {
    const bars: Pt[] = [];
    for (let k = 0; k < 6; k++) {
      const a = 0.26 + k * 0.05;
      bars.push([a, 1.36], [a + 0.022, 1.36], [a + 0.022, 1.56], [a, 1.36], [a + 0.022, 1.56], [a, 1.56]);
    }
    n.decal("black", bars, 0.005);
  });
  m.scope("running number", () => {
    const h = 0.08;
    n.decal("letteringDark", strokeText(number.replace(" ", ""), 0.72, 1.6, h, h * 0.58, h * 0.16), 0.005);
  });
  m.scope("wipers", () => {
    for (const s of [-1, 1]) {
      const a: Pt = [s * 0.95, 2.08];
      const b: Pt = [s * 0.6, 2.76];
      const t = 0.012;
      n.decal("black", [[a[0] - t, a[1]], [a[0] + t, a[1]], [b[0] + t, b[1]], [a[0] - t, a[1]], [b[0] + t, b[1]], [b[0] - t, b[1]]], 0.03);
    }
  });
  // the buffer beam under the face, the buffers and the coupling on it, the life guards below
  const x = (sx: number) => car.X(sx);
  m.scope("buffer beam", () => block(m, "black", x(LB - 0.25), x(LB + 0.12), 0.58, 1.12, -1.25, 1.25));
  m.scope("buffers", () => {
    car.c.buffers(e, car.sx(LB + BUFFERS), car.sx(LB + 0.12), 1.0);
    m.scope("coupling", () => car.c.coupling(e, car.sx(LB + BUFFERS), car.sx(LB + 0.12), COUPLER_Y));
  });
  m.scope("life guards", () => { for (const s of [-1, 1]) block(m, "black", x(LB + 0.02), x(LB + 0.1), 0.16, 0.6, ...(s > 0 ? [0.55, 0.75] : [-0.75, -0.55]) as [number, number]); });
  m.scope("hoses", () => {
    for (const lat of [-0.5, -0.4, 0.4, 0.5]) m.prism(Math.abs(lat) > 0.45 ? "hoseRed" : "black", ngon(6, 0.025, 0, x(LB + 0.16), -e * lat), 0.5, 0.95);
  });
}

// ---------------------------------------------------------------------------
// A car

/**
 * One axle at model x `x`, as photographed (photo-142075-...jpg): the wheelset, and on each side
 * the axle box between its horn guides, the coil spring from it up to the solebar, a damper
 * leaning in from the solebar, the brake blocks on the tread either side and their hangers.
 */
function axleGear(m: MeshBuilder, x: number, car: Car): void {
  const r = WHEEL_R;
  const ay = r * Math.cos(Math.PI / 24);
  m.scope("wheelset", () => car.c.wheelset(x, r));
  m.scope("suspension", () => {
    for (const s of [-1, 1]) {
      const z = (a: number, b: number) => (s > 0 ? [a, b] : [-b, -a]) as [number, number];
      m.scope("axle box", () => block(m, "bogie", x - 0.15, x + 0.15, ay - 0.13, ay + 0.13, ...z(0.86, 1.08)));
      m.scope("horn guides", () => { for (const d of [-0.2, 0.2]) block(m, "underframe", x + d - 0.03, x + d + 0.03, ay - 0.2, 0.82, ...z(0.9, 1.04)); });
      m.scope("spring", () => coil(m, "steel", x, s * 0.98, ay + 0.13, 0.8, 0.11, 4, 10));
      m.scope("damper", () => {
        m.rod("black", [x + 0.32, ay + 0.02, s * 0.98], [x + 0.55, 0.81, s * 0.98], 0.04, 8);
        m.rod("steel", [x + 0.32, ay + 0.02, s * 0.98], [x + 0.4, 0.3 + ay, s * 0.98], 0.025, 6);
      });
      m.scope("brakes", () => {
        for (const d of [-1, 1]) {
          const xb = x + d * (r + 0.05);
          block(m, "underframe", xb - 0.04, xb + 0.04, ay - 0.14, ay + 0.14, ...z(0.68, 0.79));
          m.rod("underframe", [xb, ay + 0.12, s * 0.735], [xb + d * 0.08, 0.82, s * 0.735], 0.022, 6);
        }
      });
    }
  });
}

/** Draws one car, cab at +X and centred between its coupling planes, into `m`; `inner` draws its gangway and coupling bar (a lone car). */
function drawCar(m: MeshBuilder, livery: C142Livery, inner: boolean): void {
  const p = PAINTS[livery];
  const car = new Car(p.palette, FRAME, m);
  const body = car.volume(bodyVolume(p), car.doorways([DOOR_BOX], 0.03));
  m.scope("body", () => {
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        // the livery's polygons on the flat of the side, each 2 mm prouder than the one before it overlaps
        for (const sh of p.shapes ?? [])
          m.scope(sh.name, () => m.slab(sh.mat, sh.pts.map(([x, y]): [number, number, number] => [car.X(x), y, s * (HW + 0.004 + 0.002 * (sh.layer ?? 0))]), [0, 0, -s * 0.003]));
        m.scope("windows", () => sideItems(car, body, s, WINDOWS));
        m.scope("door", () => car.openingDoor(body, s, DOOR_BOX, DOOR_GLASS, p.door, 0.03, { kind: "plug", leaves: 2 }, (j) => `light ${j}`, { fw: 0.04, frame: "rubber" }));
        m.scope("step", () => step(car, s, px(DOOR[0] + 0.05, DOOR[1] - 0.05, 0.7, 0.74), HW));
        m.scope("running number", () => sideNumber(car, body, s, px(12.7, 13.75, 1.5, 1.6), p.number, p.ink));
      });
  });
  m.scope("cab end", () => cabEnd(car, p, p.number));
  m.scope("inner end", () => {
    if (inner) m.scope("gangway", () => block(m, "rubber", car.X(-0.12), car.X(0.02), 1.0, 2.95, -0.6, 0.6));
    m.scope("coupling bar", () => block(m, "coupler", car.X(-INNER), car.X(0.05), 0.92, 1.08, -0.09, 0.09));
  });
  m.scope("running gear", () => {
    for (const [i, d] of [-1, 1].entries()) m.scope(`axle ${i + 1}`, () => axleGear(m, car.X(CENTRE + (d * C142_WHEELBASE) / 2), car));
  });
  m.scope("underframe", () => {
    m.scope("solebars", () => { for (const s of [-1, 1]) block(m, "underframe", car.X(0.1), car.X(LB - 0.3), 0.8, 0.97, ...(s > 0 ? [1.22, 1.32] : [-1.32, -1.22]) as [number, number]); });
    underBoxes(car, [
      { name: "batteries", x0: 0.5, x1: 1.8, y0: 0.5, y1: 0.97, hw: 0.75, mat: "grey" },
      { name: "engine", x0: 5.2, x1: 7.8, y0: 0.35, y1: 0.97, hw: 0.85 },
      { name: "gearbox", x0: 7.8, x1: 8.8, y0: 0.45, y1: 0.97, hw: 0.5 },
      { name: "cooler", x0: 9.0, x1: 10.6, y0: 0.42, y1: 0.97, hw: 1.15, mat: "grey" },
    ]);
    m.scope("fuel tank", () => tankX(car, 4.0, 5.1, 0.69, 0.7, 0.28));
    m.scope("air tank", () => tankX(car, 4.0, 5.1, 0.76, -0.75, 0.2));
    m.scope("silencer", () => tankX(car, 7.85, 8.75, 0.7, 0.85, 0.17, "exhaust"));
    m.scope("conduits", () => { for (const s of [-1, 1]) block(m, "grey", car.X(4.0), car.X(10.7), 0.86, 0.92, ...(s > 0 ? [1.12, 1.2] : [-1.2, -1.12]) as [number, number]); });
    m.scope("brake cylinders", () => { for (const d of [-1, 1]) tankX(car, CENTRE + d * (C142_WHEELBASE / 2 - 1.3) - 0.22, CENTRE + d * (C142_WHEELBASE / 2 - 1.3) + 0.22, 0.78, 0.45, 0.11, "underframe"); });
  });
  m.scope("roof equipment", () => {
    m.scope("pod", () => block(m, p.roof, car.X(2.4), car.X(6.6), 3.55, 3.8, -0.62, 0.62));
    m.scope("vents", () => { for (const d of [3.0, 6.0]) block(m, "roofDark", car.X(d - 0.25), car.X(d + 0.25), 3.79, 3.84, -0.35, 0.35); });
    // the stack and its smoke, both through the builder's frame (the car's place in the train)
    m.scope("exhaust", () => {
      m.emit("smoke", [car.X(0.55), 3.86, -0.95], 0.07);
      m.prism("exhaust", ngon(8, 0.07, Math.PI / 8, car.X(0.55), -0.95), 3.45, 3.86);
    });
  });
}

const builder = (livery: C142Livery) => new MeshBuilder({ ...INTERIOR_PALETTE, ...COACH_PALETTE, ...DMU_PALETTE, ...PALETTE, ...PAINTS[livery].palette });

/** A two-car unit's section spans and hinge: the front car on x > 0, the rear one turned on x < 0. */
const BELLOWS: Array<[number, number]> = [[-0.6, 1.0], [0.6, 1.0], [0.6, 2.95], [-0.6, 2.95]];

/** The Class 142: one car (default) or the two-car unit, in a livery. */
export function class142(unit: C142Unit, livery: C142Livery): MeshBuilder {
  const m = builder(livery);
  if (unit === "endCar") {
    drawCar(m, livery, true);
    return m;
  }
  const h = C142_CAR / 2;
  articulate({ m }, [
    { x0: INNER, x1: C142_CAR, draw: () => m.scope("car 1", () => m.moved(([x, y, z]) => [x + h, y, z], () => drawCar(m, livery, false))) },
    { x0: -C142_CAR, x1: -INNER, draw: () => m.scope("car 2", () => m.turned(0, () => m.moved(([x, y, z]) => [x + h, y, z], () => drawCar(m, livery, false)))) },
  ], COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, 10, [0]);
  return m;
}

// ---------------------------------------------------------------------------
// The distant model

function carLod(livery: C142Livery, inner: boolean): UnitBody {
  const p = PAINTS[livery];
  const face = paintOver([[BOTTOM, 3.3, "cabYellow"], [3.3, CROWN, p.roof]], [MASK.cy - MASK.hh, MASK.cy + MASK.hh, "rubber"]);
  const nose = noseEnd({ e: 1, xTip: X_TIP, profile: PROFILE, half: HALF, corner: CORNER, rows: ROWS }, face, [{ u: [-PANE.outer, PANE.outer], y: [PANE.y0, PANE.y1], mat: LOD_GLASS }]);
  const body = dmuBody(FRAME, bodyVolume(p), { y0: BOTTOM, items: WINDOWS, front: nose, gap: 1.0 });
  return inner ? body : { ...body, rear: { ...body.rear, hidden: true } };
}

const carParts = (livery: C142Livery, dx: number, turned: boolean, section?: number) => {
  const p = PAINTS[livery];
  const T = (x: number) => (turned ? -(x + dx) : x + dx);
  const sec = section !== undefined ? { section } : {};
  return [
    { ...axleParts([[T(-C142_WHEELBASE / 2), WHEEL_R], [T(C142_WHEELBASE / 2), WHEEL_R]], BOTTOM), ...sec },
    underPart(T(5.2 - CENTRE), T(10.6 - CENTRE), 0.4, BOTTOM, 1.0, 50, section),
    roofPart(p.roof, T(2.4 - CENTRE), T(6.6 - CENTRE), 0.62, 0.62, 3.55, 3.8, section),
  ];
};

export function class142Lod(unit: C142Unit, livery: C142Livery): MeshBuilder {
  const palette = { ...DMU_PALETTE, ...PALETTE, ...PAINTS[livery].palette };
  if (unit === "endCar") return fitUnit({ palette, bodies: [carLod(livery, true)], parts: carParts(livery, 0, false) }, 100);
  const h = C142_CAR / 2;
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
