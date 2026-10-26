// The DB 628, the two-car diesel railcar of the Deutsche Bundesbahn's branch
// lines: one design `veh-db-628` whose `unit` builds the 628.2 motor car (the
// default), its cab at +X and the short-coupled inner end at -X, or one of the
// n-Wagen coaches that run with it in the game's sets (Bn, ABn and the BDnrf
// driving trailer, dbNWagen.ts), in the mint-turquoise livery of the 1990s
// (vlakosimdb db_628, db_*iv, the default) or DB Regio's traffic red (db_628vr,
// db_*vr). vlakosimdb's two 628 folders are one body and layout in two paints,
// so they are the values of `livery`; it has no 928 driving trailer.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/db-628/native:
// the XML `alongx` box section (rounded at the roof edge after the photographs),
// the `alongz` elevation (the sloped cab front, the deep skirts beyond the
// bogies) and the windows, doors and paint laid from native pixel boxes, 0.1 m
// a pixel. The car is 22.70 m from the cab's buffers to the middle of the short
// coupling (the 628.2 set is 45.40 m over buffers). See docs/models/foreign-units.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import { Coach, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { blockX, centreCoupler, DMU_CATALOG, enumParam, slopePanel, tractionNumber } from "./emuParts.ts";
import { bOf, roofBox, sideBox, toBody, unitBogie, type PxBox, type SideMap } from "./unitParts.ts";
import { nWagen, type NWagenLivery, type NWagenVariant } from "./dbNWagen.ts";
import { LOD_GLASS } from "./lodKit.ts";
import { coachLod } from "./lodClassic.ts";
import { bogieParts, coachBody, fitUnit, roofPart, sideGlass, skirtParts, underPart } from "./lodUnits.ts";

export type Db628Livery = "mint" | "red";
export type Db628Unit = "motorCar" | NWagenVariant;

export const DB628_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    motorCar: "Motor car",
    bn: "Bn",
    abn: "ABn",
    bdnrf: "BDnrf",
  }),
  enumParam("livery", "Livery", {
    mint: "Mint",
    red: "Traffic red",
  }),
];

/** Source x 22.45 m (the middle of the short coupling) is body metre 0; the cab's buffers are at x -0.25 m. */
export const DB628_MAP: SideMap = { x0: 22.45, H: 5 };
/** Length from the cab's buffer faces to the middle of the short coupling: half the 628.2 set's 45.40 m. */
export const DB628_LENGTH = 22.7;
const B = (x: number) => bOf(DB628_MAP, x);
const box = (b: PxBox) => sideBox(DB628_MAP, b);

interface Livery {
  palette: Record<string, MaterialSpec>;
  /** The side's horizontal paint, bottom up. */
  bands: Array<[number, number, string]>;
  /** The cab front's paint below the windscreen. */
  nose: Array<[number, number, string]>;
  /** The door leaves: a colour, or "bands" for the body's own bands. */
  door: string;
  /** The first-class line over the windows (red livery). */
  firstClass?: PxBox;
  number: string;
  /** The running number's paint. */
  lettering: string;
}

// the native BMP colours (843_z_both, 843_x_both) of each livery
const LIVERIES: Record<Db628Livery, Livery> = {
  mint: {
    palette: {
      white: { color: "#f0f0f0", roughness: 0.5 },
      mint: { color: "#489088", roughness: 0.5 },
      paleBlue: { color: "#80b8d0", roughness: 0.5 },
      noseGrey: { color: "#d5d2cf", roughness: 0.5 },
    },
    bands: [[0.5, 1.5, "white"], [1.5, 1.8, "paleBlue"], [1.8, 3.1, "mint"], [3.1, 3.45, "white"], [3.45, 3.8, "roof"]],
    nose: [[0.5, 0.85, "skirtDark"], [0.85, 1.5, "noseGrey"], [1.5, 1.68, "paleBlue"], [1.68, 3.15, "mint"], [3.15, 3.45, "white"], [3.45, 3.8, "roof"]],
    door: "bands",
    number: tractionNumber("628", "289"),
    lettering: "lettering",
  },
  red: {
    palette: {
      white: { color: "#f0f0f0", roughness: 0.5 },
      red: { color: "#d00000", roughness: 0.5 },
      lightRed: { color: "#f00000", roughness: 0.5 },
      lowGrey: { color: "#606060", roughness: 0.6 },
      yellow: { color: "#ffc000", roughness: 0.5 },
    },
    bands: [[0.5, 1.1, "lowGrey"], [1.1, 1.3, "white"], [1.3, 3.0, "red"], [3.0, 3.1, "white"], [3.1, 3.45, "lightRed"], [3.45, 3.8, "roof"]],
    nose: [[0.5, 0.85, "skirtDark"], [0.85, 1.33, "lowGrey"], [1.33, 1.5, "white"], [1.5, 3.45, "red"], [3.45, 3.8, "roof"]],
    door: "white",
    firstClass: [64, 19, 97, 20],
    number: tractionNumber("628", "305"),
    lettering: "numeral",
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  roof: { color: "#7d7d7d", roughness: 0.75 },
  frame: { color: "#383838", roughness: 0.5 },
  glass: { color: "#4a4c58", metallic: 0.2, roughness: 0.15, glass: true },
  cabBlack: { color: "#1c1c1c", roughness: 0.5 },
  gangway: { color: "#5a595a", roughness: 0.7 },
  skirtDark: { color: "#2e2c2f", roughness: 0.8 },
  sign: { color: "#c8c8c8", roughness: 0.5 },
  dbRed: { color: "#e01e1e", roughness: 0.4 },
  lettering: { color: "#303030", roughness: 0.5 },
  numeral: { color: "#f4f4f4", roughness: 0.5 },
  lampWhite: { color: "#f3f5f6", roughness: 0.2, lamp: { role: "head" } },
  lampRed: { color: "#c8202c", roughness: 0.3, lamp: { role: "tail" } },
  coupler: { color: "#3a3c3f", metallic: 0.3, roughness: 0.5 },
  motor: { color: "#2e3033", roughness: 0.8 },
  engine: { color: "#3b3d40", roughness: 0.8 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
};

/** The XML box section with the roof edge rounded after the photographs (wall to 3.45 m, roof 3.8 m). */
export const DB628_SECTION: Pt[] = [[-1.45, 0.5], [1.45, 0.5], [1.5, 0.6], [1.5, 3.45], [1.42, 3.62], [1.2, 3.74], [0.8, 3.8], [-0.8, 3.8], [-1.2, 3.74], [-1.42, 3.62], [-1.5, 3.45], [-1.5, 0.6]];

/** A monotone elevation polyline (source x, y) with extra points where it crosses the bands' edges. */
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

/** Bogie centres (source x, the BMP's wheel columns 31/50 and 182/201), 1.9 m wheelbase, 770 mm wheels. */
export const DB628_BOGIES: [number, number] = [4.05, 19.15];
export const DB628_WHEELBASE = 1.9;

const WINDOWS: PxBox[] = [[38, 21, 50, 31], [66, 21, 78, 31], [83, 21, 95, 31], [100, 21, 112, 31], [117, 21, 129, 31], [134, 21, 146, 31], [151, 21, 163, 31], [168, 21, 180, 31], [185, 21, 197, 31]];
const DOORS: Array<{ door: PxBox; glass: PxBox[] }> = [
  { door: [17, 20, 28, 44], glass: [[19, 21, 26, 31], [19, 35.2, 26, 41]] },
  { door: [205, 20, 216, 44], glass: [[207, 21, 214, 31], [207, 35.2, 214, 41]] },
];

/** The n-Wagen paint of each 628 livery: the coaches' iv is the 628's mint, their vr its traffic red. */
export const DB628_COACH_LIVERY: Record<Db628Livery, NWagenLivery> = { mint: "iv", red: "vr" };

/** The motor car's volumes: the raked nose and the body behind it. */
function volumes628(L: Livery): { nose: Volume; body: Volume } {
  const nose: Volume = {
    name: "nose",
    section: DB628_SECTION,
    plan: toBody(DB628_MAP, [[0.9, 1.5], [0.5, 1.45], [0.2, 1.32]]),
    // stations where the slope crosses the paint edges keep every band's ring on the plane
    // stations where the slopes cross the paint edges keep every band's clamped ring on its plane
    top: toBody(DB628_MAP, withEdges([[0.2, 1.7], [0.9, 3.4]], L.nose)),
    bottom: toBody(DB628_MAP, withEdges([[0.2, 1.6], [0.4, 0.9], [0.9, 0.75]], L.nose)),
    bands: L.nose,
  };
  const body: Volume = {
    name: "body",
    section: DB628_SECTION,
    plan: [[B(22.1), 1.5], [B(0.9), 1.5]],
    top: toBody(DB628_MAP, [[22.1, 3.8], [2.2, 3.8], [0.9, 3.4]]),
    bottom: toBody(DB628_MAP, [[22.1, 0.55], [20.6, 0.55], [20.5, 0.8], [3.0, 0.8], [2.9, 0.55], [1.7, 0.55], [0.9, 0.75]]),
    bands: L.bands,
  };
  return { nose, body };
}

/** One car of the DB 628 set in one of its liveries: the 628.2 motor car or an n-Wagen coach. */
export function db628(params?: ParamValues): MeshBuilder {
  const p = resolveParams(DB628_PARAMS, params);
  const unit = p.unit as Db628Unit;
  const livery = p.livery as Db628Livery;
  if (unit !== "motorCar") return nWagen({ variant: unit, livery: DB628_COACH_LIVERY[livery] });
  const L = LIVERIES[livery];
  const c = new Coach({ ...PALETTE, ...L.palette }, DB628_LENGTH / 2);
  const m = c.m;
  const { nose, body } = volumes628(L);
  // the plug doors open through doorways, so an open one shows the interior (doors.ts)
  body.openings = [1, -1].flatMap((s) => DOORS.map((d) => c.doorOpening(s, box(d.door), 0.03)));
  m.scope("body", () => {
    m.scope("nose", () => c.volume(nose));
    c.volume(body);
    for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => sideWork(c, body, L, s));
  });
  m.scope("cab", () => cab(c));
  m.scope("rear end", () => innerEnd(c, body));
  m.scope("roof equipment", () => {
    m.scope("air conditioning", () => roofBox(m, "roof", c.X(B(18.0)), c.X(B(14.6)), 3.78, 1.6, 0.22));
    m.scope("radiator", () => roofBox(m, "roof", c.X(B(9.5)), c.X(B(7.2)), 3.78, 1.9, 0.3, 0.2));
    m.emit("smoke", [c.X(B(8.0)), 4.15, 0.55], 0.08);
    m.scope("exhaust", () => m.prism("cabBlack", ngon(10, 0.08, 0, c.X(B(8.0)), 0.55), 3.9, 4.15));
  });
  m.scope("running gear", () => {
    DB628_BOGIES.forEach((x, i) =>
      m.scope(`bogie ${i + 1}`, () => unitBogie(c, c.X(B(x)), { wb: DB628_WHEELBASE, r: 0.385, motor: i === 1, top: 0.8, air: true })),
    );
    m.scope("underframe", () => {
      // the engine and gearbox under the floor, the fuel tank and the battery boxes
      m.scope("engine", () => block(m, "engine", c.X(B(11.6)), c.X(B(8.0)), 0.3, 0.8, -0.95, 0.95));
      m.scope("fuel tank", () => block(m, "engine", c.X(B(15.2)), c.X(B(12.6)), 0.35, 0.8, -1.25, 1.25));
      m.scope("batteries", () => block(m, "skirtDark", c.X(B(7.2)), c.X(B(5.6)), 0.4, 0.8, -1.3, 1.3));
    });
  });
  return m;
}

/**
 * A car of the 628 set for distant views (lodUnits.ts): the motor car's raked
 * nose with its windscreen and nose paint, the body's section and bands, the
 * side window band, the skirts at the ends, the bogies, the underframe
 * equipment and the roof boxes; an n-Wagen coach through the classic coach
 * adapter (lodClassic.ts), recorded from its own builder.
 */
export function db628Lod(params?: ParamValues): MeshBuilder {
  const p = resolveParams(DB628_PARAMS, params);
  const unit = p.unit as Db628Unit;
  const livery = p.livery as Db628Livery;
  if (unit !== "motorCar") return coachLod(() => nWagen({ variant: unit, livery: DB628_COACH_LIVERY[livery] }));
  const L = LIVERIES[livery];
  const centre = DB628_LENGTH / 2;
  const X = (x: number) => B(x) - centre;
  const { nose, body } = volumes628(L);
  const place = (v: Volume) => ({ v, X: (b: number) => b - centre });
  const glass = [...WINDOWS, ...DOORS.map((d) => d.glass[0]!)].map(box).map((b) => ({ ...b, x0: b.x0 - centre, x1: b.x1 - centre }));
  const shell = coachBody([place(body), place(nose)], {
    y0: 0.8, main: 0, windows: sideGlass(glass, 0.6), frontWindows: [{ u: [fz(28.8), fz(1.2)], y: [fy(35), fy(22)], mat: LOD_GLASS }],
  });
  return fitUnit({
    palette: { ...PALETTE, ...L.palette },
    bodies: [shell],
    parts: [
      ...bogieParts(DB628_BOGIES.map((x) => [X(x), DB628_WHEELBASE / 2 + 0.385 + 0.2] as const), 0.8),
      ...skirtParts((body.bottom ?? []).map(([b, y]): Pt => [b - centre, y]), 0.8, 1.48, L.bands[0]![2]),
      underPart(X(15.2), X(7.2), 0.3, 0.8, 1.25),
      roofPart("roof", X(18.0), X(14.6), 0.8, 0.58, 3.78, 4.0),
      roofPart("roof", X(9.5), X(7.2), 0.95, 0.75, 3.78, 4.08),
    ],
  }, 100);
}

/** Windows, doors, paint lines and markings on side s. */
function sideWork(c: Coach, v: Volume, L: Livery, s: number): void {
  const m = c.m;
  m.scope("cab window", () => c.window(v, s, box([10, 21, 16, 31]), { fw: 0.08 }));
  m.scope("windows", () => WINDOWS.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.window(v, s, box(b), { fw: 0.08 }))));
  m.scope("doors", () =>
    DOORS.forEach((d, i) =>
      m.scope(`door ${i + 1}`, () => {
        // one plug leaf with its lights, as the native drawing paints it, sliding
        // toward the car's middle (doors.ts)
        c.door(v, s, box(d.door), L.door, {
          seam: 0.03,
          opens: { kind: "plug", leaves: 1, toward: i === 0 ? "high" : "low" },
          leafWork: (clip) =>
            d.glass.forEach((g, j) => {
              const w = clip(box(g));
              if (w) c.m.scope(`window ${j + 1}`, () => c.window(v, s, w, { fw: 0.06 }));
            }),
        });
      }),
    ),
  );
  m.scope("class numerals", () => {
    for (const [t, u] of [["2", 52], ["1", 64.5], ["2", 182]] as const) {
      const bb = box([u - 1, 22, u + 1, 28]);
      c.numeral(v, s, t, (bb.x0 + bb.x1) / 2, bb.y0, bb.y1 - bb.y0, 0.006, "numeral");
    }
  });
  if (L.firstClass) m.scope("first class line", () => c.sidePanel(v, "yellow", s, box(L.firstClass!), 0.004, 0.003));
  m.scope("fuel filler", () => c.sidePanel(v, "sign", s, box([59, 32, 64, 41]), 0.006, 0.004));
  m.scope("logo", () => c.sidePanel(v, "dbRed", s, box([79, 36, 82, 38]), 0.006, 0.004));
  m.scope("running number", () => {
    const n = box([84, 36, 121, 38]);
    c.inscription(v, s, (n.x0 + n.x1) / 2, [{ text: L.number, y: n.y0, h: n.y1 - n.y0 }], 0.006, L.lettering);
  });
}

/** Front-view pixel columns (843_x_both, 30 px across 3 m, seen from ahead of the +X end) to z. */
const fz = (u: number) => 1.5 - u / 10;
/** Front-view rows to height: the 60-row end BMPs are mapped onto 5 m (colorize texy 0..5), 1/12 m a row. */
const fy = (v: number) => 5 - v / 12;

/** The cab front: windscreen, lamps, logo, buffers and the screw coupling. */
function cab(c: Coach): void {
  const m = c.m;
  const X = (x: number) => c.X(B(x));
  const upper = { x0: X(0.2), y0: 1.7, x1: X(0.9), y1: 3.4 };
  const lower = { x0: X(0.4), y0: 0.9, x1: X(0.2), y1: 1.6 };
  // 843_x_both: the windscreen's black rows 22..35, the pillar at column 15
  m.scope("windscreen", () => {
    slopePanel(m, "cabBlack", 1, upper, fz(1.2), fz(28.8), fy(35), fy(22), 0.006, 0.01);
    slopePanel(m, "glass", 1, upper, fz(2), fz(28), fy(34.4), fy(22.8), 0.014, 0.006);
    slopePanel(m, "cabBlack", 1, upper, fz(15.5), fz(14.5), fy(34.4), fy(22.8), 0.02, 0.004);
  });
  // the photographs: the third headlight in the middle under the windscreen, the DB logo low between the lamps
  m.scope("centre lamp", () => {
    const ring = (r: number) => Array.from({ length: 12 }, (_, i): [number, number] => [Math.cos((i * Math.PI) / 6) * r, 1.9 + Math.sin((i * Math.PI) / 6) * r]);
    const at = (y: number) => upper.x0 + ((y - upper.y0) / (upper.y1 - upper.y0)) * (upper.x1 - upper.x0);
    for (const [mat, r, d0, d1] of [["white", 0.13, 0.004, 0.012], ["lampWhite", 0.09, 0.012, 0.02]] as const) {
      // a disc on the sloped front: each rim point pushed out along the slope's normal
      const n = [1.7, -0.7].map((v) => v / Math.hypot(1.7, 0.7)) as [number, number];
      const pts = ring(r).map(([z, y]): [number, number, number] => [at(y) + n[0] * d1, y + n[1] * d1, z]);
      m.slab(mat, pts, [-n[0] * (d1 - d0), -n[1] * (d1 - d0), 0]);
    }
  });
  m.scope("logo", () => {
    slopePanel(m, "white", 1, lower, fz(13.4), fz(16.6), 1.2, 1.38, 0.006, 0.004);
    slopePanel(m, "dbRed", 1, lower, fz(13.8), fz(16.2), 1.23, 1.35, 0.01, 0.003);
  });
  m.scope("lamps", () => {
    for (const [k, s] of [-1, 1].entries())
      m.scope(`lamp ${k + 1}`, () => {
        // a headlight and an inner tail light, low on the lower front
        slopePanel(m, "cabBlack", 1, lower, s * 0.62, s * 1.22, 1.16, 1.42, 0.006, 0.01);
        slopePanel(m, "lampWhite", 1, lower, s * 0.98, s * 1.18, 1.2, 1.38, 0.014, 0.006);
        slopePanel(m, "lampRed", 1, lower, s * 0.66, s * 0.84, 1.22, 1.36, 0.014, 0.006);
      });
  });
  m.scope("buffer beam", () => blockX(m, "skirtDark", X(0.95), X(0.36), 0.78, 1.22, -1.3, 1.3));
  m.scope("buffers", () => c.buffers(1, DB628_LENGTH, B(0.4), 1.03));
  m.scope("coupling", () => c.coupling(1, DB628_LENGTH, B(0.4), 1.03));
  m.scope("hoses", () => {
    for (const z of [-0.42, 0.42]) block(m, "rubber", X(0.42), X(0.3), 0.72, 0.98, z - 0.04, z + 0.04);
  });
  // the cab's ladder step under the cab door's side window (the BMP's column 12, rows 44..47)
  for (const s of [1, -1])
    m.scope(s > 0 ? "right step" : "left step", () => block(m, "skirtDark", X(1.6), X(1.0), 0.38, 0.42, ...side(s, 1.2, 1.46)));
}

/** The short-coupled inner end: the gangway and its door (843_x_a), the short coupler. */
function innerEnd(c: Coach, v: Volume): void {
  const m = c.m;
  const wall = B(22.1);
  const X = (b: number) => c.X(b);
  // 843_x_a: the gangway frame columns 7..23, rows 21..50; the door columns 9..21, rows 23..41
  m.scope("gangway", () => {
    for (const z of [-1, 1]) block(m, "gangway", X(0.05), X(wall) + 0.02, fy(50), fy(21), ...side(z, 0.62, 0.8));
    block(m, "gangway", X(0.05), X(wall) + 0.02, fy(23), fy(21), -0.62, 0.62);
    block(m, "gangway", X(0.05), X(wall) + 0.02, fy(50), fy(48), -0.62, 0.62);
  });
  m.scope("end door", () => {
    c.door(v, -1, { x0: fz(21), x1: fz(9), y0: fy(41), y1: fy(23) }, "white", { end: true, seam: 0.03 });
    for (const [a, b2] of [[10, 13], [17, 20]] as const) c.window(v, -1, { x0: fz(b2), x1: fz(a), y0: fy(32), y1: fy(25) }, { end: true, fw: 0.04 });
  });
  m.scope("tail lamps", () => {
    for (const z of [-1.2, 1.2]) {
      const lens = ngon(8, 0.05, 0, z, 1.25);
      m.sweep("lampRed", "x", lens, X(wall) - 0.002, lens, X(wall) - 0.03);
    }
  });
  m.scope("coupler", () => centreCoupler(m, -1, X(wall + 0.5), X(0), 0.95));
}

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const DB_628_GAME: GameProperties = {
  weight: 56,
  power: 423,
  maxspeed: 100,
  accel: null,
  variants: [
    { params: { livery: "red", unit: "abn" }, weight: 46, power: 0, maxspeed: 160 },
    { params: { unit: "abn" }, weight: 46, power: 0, maxspeed: 160 },
    { params: { livery: "red", unit: "bdnrf" }, weight: 46, power: 0, maxspeed: 160 },
    { params: { unit: "bdnrf" }, weight: 46, power: 0, maxspeed: 160 },
    { params: { livery: "red", unit: "bn" }, weight: 46, power: 0, maxspeed: 160 },
    { params: { unit: "bn" }, weight: 46, power: 0, maxspeed: 160 },
  ],
};

export const DB628_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-db-628", game: DB_628_GAME, title: "DB 628", build: db628, buildLod: db628Lod, params: DB628_PARAMS, catalog: DMU_CATALOG, references: ["db-628", "db-n-wagen"] },
];
