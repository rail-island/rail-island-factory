// The DB V 100.20 / class 212: the Deutsche Bundesbahn's centre-cab B'B'
// diesel-hydraulic branch-line locomotive (MaK and others, 1962-1966). One body
// in three paint schemes, so one design with a `livery` parameter: the old red
// (altrot) with cream lines (the default), ocean blue and beige, and traffic red
// with white. Reconstructed from the native JT7 XML and BMPs of vlakosimdb's
// db_212, db_212bb and db_212nr (the same geometry, assets/db-212/native) and
// photographs (assets/db-212/*.jpg).
//
// Native canvas: z_both 140 x 50 px for 14 x 5 m, 0.1 m a pixel: column px ->
// x = px / 10 - 6.05 (the source's x, centred on the hoods), row r -> y =
// 5 - r / 10. The cab stands 0.75 m off the middle toward +X. 12.30 m over the
// buffers (212 022 on), 6.00 m between the pivots, 2.20 m bogie wheelbase,
// 0.95 m wheels (assets/db-212/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { bogie, buffers, onEnd, onSide, rect, shell, surfaceDecal } from "./czElectricKit.ts";
import {
  DIESEL_PALETTE, boxSpec, breaksOf, c, faceAt, grille, headlamp, numberText, pane, plate, railing, span, steps, tubeSeg, wallAt,
  type BoxSpec,
} from "./smallDieselKit.ts";

export interface Db212Livery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/diesel. */
  source: string;
  number: string;
  numberSource: string;
  palette: Record<string, MaterialSpec>;
  /** The line along the hood sides at 2.9..3.0 m (native row 20), or none. */
  sideLine: string;
  /** The line across the hood ends and the cab front at that height. */
  endLine: string;
}

export const DB212_LIVERIES = {
  oldRed: {
    title: "DB 212 325, old red with cream lines",
    source: "db_212",
    number: runningNumber("212", "325"),
    numberSource: "illustrative, a unit photographed in the old red in 2019 (212 325-5); the DB computer number's check digit is the same scheme",
    palette: { body: c("#c61414"), line: c("#e7e7ad"), frameLine: c("#f4f0bc") },
    sideLine: "line", endLine: "line",
  },
  oceanBlue: {
    title: "DB 212 364, ocean blue and beige",
    source: "db_212bb",
    number: runningNumber("212", "364"),
    numberSource: "illustrative, a unit photographed in ocean blue and beige in 1993 (212 364)",
    palette: { body: c("#104058"), line: c("#e7e7ad"), frameLine: c("#f4f0bc") },
    sideLine: "line", endLine: "line",
  },
  trafficRed: {
    title: "DB 212 376, traffic red",
    source: "db_212nr",
    number: runningNumber("212", "376"),
    numberSource: "illustrative, a unit photographed in traffic red (212 376-8)",
    palette: { body: c("#e8000a"), line: c("#f8f8f8"), frameLine: c("#f8f8f8") },
    sideLine: "body", endLine: "line",
  },
} as const satisfies Record<string, Db212Livery>;

export const DB212_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "oldRed",
  values: Object.entries(DB212_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];
export const DB212_NUMBER = DB212_LIVERIES.oldRed.number;

const SHARED: Record<string, MaterialSpec> = { frameBlack: c("#1d1d1d", 0.7), roofGrey: c("#5b5b5b", 0.7), plateBlack: c("#1d1d1d") };

export const BUFFERS = 12.3 / 2;
export const PIVOT = 3.0;
const FRAME = 5.6; // XML fahr 0.3..11.7 m, native frame line columns 4-115
const Y_FRAME = 1.0;
const Y_DECK = 1.5;
const px = (p: number) => p / 10 - 6.05;
/** The cab: native z_both columns 54-82 (the XML haus clip, 5.6..8.0 m, is narrower than its texture and the photographs). */
export const CAB_X = [px(54.5), px(82.5)] as const;

function specs(l: Db212Livery) {
  const sideBands: Band[] = [[Y_DECK, 2.9, "body"], [2.9, 3.0, l.sideLine], [3.0, 4.5, "body"]];
  const endBands: Band[] = [[Y_DECK, 2.9, "body"], [2.9, 3.0, l.endLine], [3.0, 4.5, "body"]];
  // XML base: the hoods 2.0 m wide to 3.2 m at the ends and 3.3 m over most of their length, rolled at the top
  const hood = (x0: number, x1: number, ends: number[]): BoxSpec => ({
    x0, x1, hw: [[Y_DECK, 1.0], [3.12, 1.0], [3.22, 0.9], [3.28, 0.6]], inset: [[Y_DECK, 0], [3.1, 0], [3.28, 0.25]],
    side: sideBands, end: endBands, corner: "side", roof: "body", ends, chamfer: 0.06,
  });
  // XML haus: 3.0 m wide to 3.2 m, the window band leaning 0.2 m in to 3.8 m
  const cab: BoxSpec = {
    x0: CAB_X[0], x1: CAB_X[1], hw: [[Y_DECK, 1.5], [3.2, 1.5], [3.8, 1.32]], inset: [[Y_DECK, 0], [3.2, 0], [3.8, 0.2]],
    side: sideBands, end: endBands, corner: "end", roof: "roofGrey", chamfer: 0.08,
  };
  return {
    longHood: hood(px(6), CAB_X[0], [-1]), shortHood: hood(CAB_X[1], px(115), [1]), cab,
  };
}

function body(m: MeshBuilder, l: Db212Livery): void {
  const sp = specs(l);
  const lh = boxSpec(sp.longHood), sh = boxSpec(sp.shortHood), cb = boxSpec(sp.cab);
  m.scope("long hood", () => shell(m, lh));
  m.scope("short hood", () => shell(m, sh));
  m.scope("cab", () => {
    m.scope("shell", () => shell(m, cb));
    // the overhanging roof: out to 5.1..8.4 m at 4.2 m, its top at 4.3 m (XML haus, native rows 7-11)
    m.scope("roof", () => {
      const ring = (x0: number, x1: number, w: number): Ring => [[x1, -w], [x1, w], [x0, w], [x0, -w]];
      m.loft("roofGrey", ring(CAB_X[0] + 0.21, CAB_X[1] - 0.21, 1.31), 3.8, ring(px(51), px(85), 1.42), 4.18, false);
      m.loft("roofGrey", ring(px(51), px(85), 1.42), 4.18, ring(px(52), px(84), 1.2), 4.3);
    });
    const br = breaksOf(sp.cab);
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const at = onSide(cb, s), n: Vec3 = [0, 0, s];
        // three windows on the leaning band (native z_both columns 59-76, rows 12-17)
        for (const [i, [a, b]] of ([[59, 63.4], [63.6, 69.4], [69.6, 76.5]] as const).entries())
          m.scope(`window ${i + 1}`, () => pane(m, at, n, px(a), px(b), 3.22, 3.78, br, 0.04));
        m.scope("door", () => surfaceDecal(m, "rubber", at, n, [rect(px(63), 1.55, px(69), 1.57), rect(px(63), 1.57, px(63) + 0.02, 3.15), rect(px(69) - 0.02, 1.57, px(69), 3.15)], 0.004));
        m.scope("number plate", () => {
          plate(m, "plateBlack", at, n, px(66), px(76), 2.55, 2.75, 0.02, br);
          numberText(m, "white", at, n, l.number, px(71), 2.65, 0.12, 0.024, s < 0);
        });
        m.scope("handrails", () => {
          for (const x of [px(63) - 0.07, px(69) + 0.07]) tubeSeg(m, "steel", [x, 1.6, s * 1.53], [x, 3.1, s * 1.53], 0.016);
        });
      });
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front windows" : "rear windows", () => {
        const at = onEnd(cb, e);
        for (const s of [-1, 1]) m.scope(s > 0 ? "right" : "left", () => pane(m, at, [e, 0, 0], ...side(s, 0.2, 1.1), 3.2, 3.78, br, 0.06));
      });
  });
  // hood sides: doors with louvres (photographs)
  for (const [name, spec, b] of [["long hood", sp.longHood, lh], ["short hood", sp.shortHood, sh]] as const)
    for (const s of [-1, 1])
      m.scope(`${name} ${s > 0 ? "right" : "left"} doors`, () => {
        const at = onSide(b, s), n: Vec3 = [0, 0, s];
        const x0 = spec.x0 + 0.25, x1 = spec.x1 - 0.25;
        const k = Math.max(1, Math.round((x1 - x0) / 1.0));
        const w = (x1 - x0) / k;
        const seams: Ring[] = [];
        for (let i = 0; i <= k; i++) seams.push(rect(x0 + i * w - 0.01, 1.6, x0 + i * w + 0.01, 2.85));
        surfaceDecal(m, "rubber", at, n, seams, 0.004);
        for (let i = 0; i < k; i++) m.scope(`louvre ${i + 1}`, () => grille(m, "slat", at, n, x0 + i * w + 0.12, x0 + (i + 1) * w - 0.12, 2.45, 2.8, { pitch: 0.06, across: true }));
      });
  // the hood ends: the radiator grille, two white lamps over two red, the top lamp (native x_both, photographs)
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const spec = e > 0 ? sp.shortHood : sp.longHood;
      const at = onEnd(e > 0 ? sh : lh, e), n: Vec3 = [e, 0, 0];
      const xe = e > 0 ? spec.x1 : -spec.x0;
      m.scope("grille", () => grille(m, "slat", at, n, -0.55, 0.55, 1.52, 2.9, { pitch: 0.07 }));
      m.scope("top lamp", () => headlamp(m, e, xe - 0.05, 0, 3.08, 0.1, "lampHead", 0.06));
      m.scope("lamps", () => {
        for (const z of [-0.85, 0.85]) {
          m.scope(z > 0 ? "right white" : "left white", () => headlamp(m, e, xe, z, 2.0, 0.1));
          m.scope(z > 0 ? "right red" : "left red", () => headlamp(m, e, xe, z, 1.7, 0.08, "lampRed", 0.05));
        }
      });
    });
  m.emit("smoke", [-1.6, 3.42, 0], 0.1);
  m.scope("exhaust", () => m.prism("exhaust", ngon(10, 0.1, 0, -1.6, 0), 3.25, 3.42));
}

function underframe(m: MeshBuilder, l: Db212Livery): void {
  m.scope("frame", () => {
    block(m, "frameBlack", -FRAME, FRAME, Y_FRAME, Y_DECK, -1.5, 1.5);
    // the light line round the frame's top edge (native row 35)
    m.scope("line", () => {
      for (const s of [-1, 1]) surfaceDecal(m, "frameLine", wallAt(s, 1.5), [0, 0, s], [rect(-FRAME, Y_DECK - 0.1, FRAME, Y_DECK)], 0.003);
      for (const e of [-1, 1]) surfaceDecal(m, "frameLine", faceAt(e, FRAME), [e, 0, 0], [rect(-1.5, Y_DECK - 0.1, 1.5, Y_DECK)], 0.003);
    });
  });
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc: e * PIVOT, halfBase: 1.1, wheelR: 0.475, frameTop: 0.95 }));
  });
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      buffers(m, e, FRAME, BUFFERS, 1.05);
      m.scope("number plate", () => {
        const pa = faceAt(e, FRAME), n: Vec3 = [e, 0, 0];
        plate(m, "plateBlack", pa, n, -0.42, 0.42, 1.17, 1.37);
        numberText(m, "white", pa, n, l.number, 0, 1.27, 0.11, 0.024, e > 0);
      });
      m.scope("buffer beam", () => {
        const [a, b] = span(e * (FRAME - 0.25), e * FRAME);
        block(m, "frameBlack", a, b, 0.55, Y_FRAME, -1.4, 1.4);
      });
      m.scope("steps", () => {
        for (const s of [-1, 1]) steps(m, ...span(e * (FRAME - 0.7), e * (FRAME - 0.25)), s, 1.3, 1.48, [0.45, 0.85], Y_FRAME);
      });
    });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) steps(m, px(63), px(69), s, 1.3, 1.48, [0.45, 0.85], Y_FRAME);
  });
  m.scope("railings", () => {
    for (const s of [-1, 1]) {
      railing(m, [-5.5, -4.0, -2.5, -1.0, CAB_X[0] - 0.06], s, 1.45, Y_DECK, 2.5);
      railing(m, [CAB_X[1] + 0.06, 3.4, 5.5], s, 1.45, Y_DECK, 2.5);
    }
  });
  m.scope("tanks", () => {
    // the fuel tank and the air reservoirs between the bogies (photographs)
    block(m, "frameBlack", -1.3, 1.3, 0.45, Y_FRAME, -1.1, 1.1);
    for (const z of [-1.2, 1.2]) {
      const q = ngon(10, 0.15, 0, z, 0.75);
      m.sweep("steel", "x", q, -1.25, q, 1.25);
    }
  });
}

/** The V 100.20 in one of its liveries; the default is 212 325 in old red. */
export function db212(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(DB212_PARAMS, params);
  const l: Db212Livery = DB212_LIVERIES[livery as keyof typeof DB212_LIVERIES];
  const m = new MeshBuilder({ ...DIESEL_PALETTE, ...SHARED, ...l.palette });
  m.scope("body", () => body(m, l));
  m.scope("underframe", () => underframe(m, l));
  return m;
}
