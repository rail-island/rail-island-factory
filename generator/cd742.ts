// The CKD hood locomotives of the T 448.0 / T 466.2 family: CD 742 (T 466.2,
// "bangladeska"), its heavier industrial sister 740 (T 448.0) and the ten
// 743 (T 466.3). One body -- a frame on two Bo bogies, the cab near one end, a
// tall narrow hood either side -- so one design with a `variant` parameter: the
// Viamont 742.507 (the default), the Viamont 740.627 with the 740's low and
// wider short hood, and the CD Cargo 743 002. Reconstructed from the native JT7
// XML and BMPs of vlakosimdb's viamont_742.507, viamont_740.627 and
// cd_743_002 (assets/cd-742/native) and photographs (assets/cd-742/*.jpg).
//
// The body follows viamont_742.507 (a 14 x 5 m canvas, 0.1 m a pixel): column
// px -> x = 6.7 - px / 10 (the source's x flipped, so the cab is at +X), and
// the source heights above the 1.8 m deck scaled by 0.9286 so the cab roof
// stands at 4.40 m (the published height, 4.47 m, includes the horn): native
// y = 1.8 + (y - 1.8) / 0.9286. 13.60 m over the buffers, 6.70 m between the
// pivots, 2.40 m bogie wheelbase, 1.00 m wheels (assets/cd-742/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { bogie, buffers, onEnd, onSide, rect, shell, surfaceDecal } from "./czElectricKit.ts";
import {
  DIESEL_PALETTE, boxSpec, breaksOf, c, faceAt, grille, hazardBeam, headlamp, numberText, pane, plate, railing, span, steps, tubeSeg,
  type BoxSpec,
} from "./smallDieselKit.ts";

/** Model height of a native (viamont_742.507) height. */
export const Y = (yn: number): number => (yn <= 1.8 ? yn : 1.8 + (yn - 1.8) * ((4.4 - 1.8) / (4.6 - 1.8)));
/** Native height of a model height. */
export const nativeY = (y: number): number => (y <= 1.8 ? y : 1.8 + ((y - 1.8) * (4.6 - 1.8)) / (4.4 - 1.8));
/** Model x of a native viamont_742.507 column. */
const px = (p: number) => 6.7 - p / 10;

export interface Cd742Variant {
  title: string;
  /** The vlakosimdb directory under db/train/loco/diesel. */
  source: string;
  number: string;
  numberSource: string;
  palette: Record<string, MaterialSpec>;
  /** Hood and cab sides, low first (model heights). */
  body: readonly Band[];
  /** The hood ends' and the cab's front and back. */
  end: readonly Band[];
  frame: string;
  /** The 740's short hood: low (to native 3.2 m) and 2.3 m wide. */
  lowShortHood: boolean;
  /** The plough's two colours. */
  plough: readonly [string, string];
  /** Diagonal stripes painted over the light blue band of the hood sides: [x at its foot, x at its top, width] (the 743's, native columns 56-76). */
  stripes?: ReadonlyArray<readonly [number, number, number]>;
  stripe?: string;
}

const yb = (a: number, b: number, m: string): Band => [Y(a), Y(b), m];

const VIAMONT_PALETTE = { body: c("#e8e800"), black: c("#161616", 0.6), paleYellow: c("#f0f060"), frameYellow: c("#d8d800", 0.6), plateBlack: c("#202020") };
// native z_dec rows: yellow over 4.1 m, black 3.3..4.1, yellow 2.1..3.3, black 1.8..2.1, the yellow frame
const VIAMONT_BODY: Band[] = [yb(1.8, 2.1, "black"), yb(2.1, 3.3, "body"), yb(3.3, 4.1, "black"), yb(4.1, 4.7, "body")];
const VIAMONT_END: Band[] = [yb(1.8, 2.1, "black"), yb(2.1, 3.4, "body"), yb(3.4, 4.1, "black"), yb(4.1, 4.7, "body")];

export const CD742_VARIANTS = {
  viamont742: {
    title: "Viamont 742",
    source: "viamont_742.507",
    number: runningNumber("742", "507"),
    numberSource: "the vlakosimdb model's name; the check digit by the 1988 scheme",
    palette: VIAMONT_PALETTE, body: VIAMONT_BODY, end: VIAMONT_END, frame: "frameYellow", lowShortHood: false,
    plough: ["hazardBlack", "hazardYellow"],
  },
  viamont740: {
    title: "Viamont 740",
    source: "viamont_740.627",
    number: runningNumber("740", "627"),
    numberSource: "the vlakosimdb model's name; the check digit by the 1988 scheme",
    palette: VIAMONT_PALETTE, body: VIAMONT_BODY, end: VIAMONT_END, frame: "frameYellow", lowShortHood: true,
    plough: ["hazardBlack", "hazardYellow"],
  },
  cd743: {
    title: "CD 743",
    source: "cd_743_002",
    number: runningNumber("743", "002"),
    numberSource: "the vlakosimdb model's name; the check digit by the 1988 scheme",
    palette: { body: c("#63adef"), black: c("#314294"), white: c("#e6e6e6"), redLine: c("#c54242"), frameGrey: c("#7b7b7b", 0.7), plateBlack: c("#314294") },
    // native cd_743_002 rows, its 1.6..4.3 m mapped onto the 742's 1.8..4.6 m: white to 2.4, the red line, light blue, dark blue over 3.6
    body: [[1.8, 2.63, "white"], [2.63, 2.73, "redLine"], [2.73, 3.66, "body"], [3.66, 4.5, "black"]],
    end: [[1.8, 2.63, "white"], [2.63, 2.73, "redLine"], [2.73, 3.66, "body"], [3.66, 4.5, "black"]],
    frame: "frameGrey", lowShortHood: false, plough: ["hazardRed", "hazardWhite"],
    stripes: [[-0.35, -1.15, 1.3]], stripe: "white",
  },
} as const satisfies Record<string, Cd742Variant>;

export const CD742_PARAMS: readonly ParamSpec[] = [{
  name: "variant",
  title: "Variant",
  default: "viamont742",
  values: Object.entries(CD742_VARIANTS).map(([value, v]) => ({ value, title: v.title })),
}];
export const CD742_NUMBER = CD742_VARIANTS.viamont742.number;

export const BUFFERS = 13.6 / 2;
export const PIVOT = 3.35;
const FRAME = 6.4; // XML base 0.3..13.1 m
const Y_FRAME = 1.2;
const Y_DECK = 1.8;
const TOP = Y(4.6);
/** The cab (XML cab 2.0..4.4 m): x range. */
export const CAB_X = [px(44), px(20)] as const;

// XML box: the hoods 2.0 m wide (0.4..13.0 m), rounded to 1.8 m at the top
const hoodHw = (w: number, top: number) => [[Y_DECK, w], [top - 0.09, w], [top, w - 0.1]] as const;
// XML cab: 3.0 m wide to 3.05 m, then leaning in to 2.7 m at 4.3 and rounded to 1.8 m at 4.6
const CAB_HW = [[Y_DECK, 1.5], [Y(3.05), 1.5], [Y(4.3), 1.35], [Y(4.45), 1.15], [TOP, 0.9]] as const;

function specs(v: Cd742Variant) {
  const longHood: BoxSpec = { x0: px(130), x1: CAB_X[0], hw: hoodHw(1.0, TOP), side: v.body, end: v.end, corner: "end", roof: v.body[v.body.length - 1]![2], ends: [-1] };
  const shortHood: BoxSpec = v.lowShortHood
    ? { x0: CAB_X[1], x1: px(5), hw: hoodHw(1.15, Y(3.2)), side: v.body, end: v.end, corner: "end", roof: "body", ends: [1] }
    : { x0: CAB_X[1], x1: px(4), hw: hoodHw(1.0, TOP), side: v.body, end: v.end, corner: "end", roof: v.body[v.body.length - 1]![2], ends: [1] };
  const cab: BoxSpec = { x0: CAB_X[0], x1: CAB_X[1], hw: CAB_HW, side: v.body, end: v.end, corner: "end", roof: v.body[v.body.length - 1]![2], chamfer: 0.06 };
  return { longHood, shortHood, cab };
}

function body(m: MeshBuilder, v: Cd742Variant): void {
  const { longHood, shortHood, cab } = specs(v);
  const lh = boxSpec(longHood), sh = boxSpec(shortHood), cb = boxSpec(cab);
  m.scope("long hood", () => shell(m, lh));
  m.scope("short hood", () => shell(m, sh));
  m.scope("cab", () => {
    m.scope("shell", () => shell(m, cb));
    const br = breaksOf(cab);
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const at = onSide(cb, s), n: Vec3 = [0, 0, s];
        // three tall windows (native z_dec columns 22-25, 30-33, 38-41, rows 9-19); the middle one is the door's
        for (const [i, [a, b]] of ([[42, 38], [34, 30], [26, 22]] as const).entries())
          m.scope(`window ${i + 1}`, () => pane(m, at, n, px(a), px(b), Y(3.0), Y(4.1), br, 0.05));
        m.scope("door", () => surfaceDecal(m, "rubber", at, n, [rect(px(34), Y_DECK + 0.05, px(29), Y_DECK + 0.07), rect(px(34), Y_DECK + 0.07, px(34) + 0.02, Y(2.75)), rect(px(29) - 0.02, Y_DECK + 0.07, px(29), Y(2.75))], 0.004));
        m.scope("number plate", () => {
          plate(m, "plateBlack", at, n, px(37), px(27), Y(2.3), Y(2.6), 0.02, br);
          numberText(m, "white", at, n, v.number, px(32), Y(2.45), 0.14, 0.024, s < 0);
        });
        m.scope("handrails", () => {
          for (const x of [px(34) - 0.07, px(29) + 0.07]) tubeSeg(m, "steel", [x, Y_DECK + 0.1, s * 1.53], [x, Y(3.2), s * 1.53], 0.016);
        });
      });
    // the front and rear windows (native viamont_740.627 x_inc: two panes 0.3..0.9 m off the middle, rows 10-16)
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front windows" : "rear windows", () => {
        const at = onEnd(cb, e);
        for (const s of [-1, 1]) m.scope(s > 0 ? "right" : "left", () => pane(m, at, [e, 0, 0], ...side(s, 0.28, 0.92), Y(3.4), Y(4.1), br, 0.05));
      });
    m.scope("horn", () => {
      m.prism("steel", ngon(8, 0.05, 0, (CAB_X[0] + CAB_X[1]) / 2, 0), TOP - 0.02, 4.47);
    });
  });
  // hood sides: louvred doors in the upper half (native z_dec rows 12-28, photographs)
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right louvres" : "left louvres", () => {
      const at = onSide(lh, s), n: Vec3 = [0, 0, s];
      const br = breaksOf(longHood);
      const doors: Array<[number, number]> = [[px(124), px(113)], [px(112), px(101)], [px(97), px(91)], [px(90), px(84)], [px(83), px(77)], [px(76), px(70)], [px(69), px(63)], [px(62), px(56)], [px(55), px(50)]];
      for (const [i, [a, b]] of doors.entries())
        m.scope(`louvre ${i + 1}`, () => grille(m, "slat", at, n, Math.min(a, b), Math.max(a, b), Y(3.45), Y(4.0), { pitch: 0.09, breaks: br }));
      if (v.stripes)
        m.scope("stripes", () => {
          const polys: Ring[] = v.stripes!.map(([x0, x1, w]): Ring => [[x0, 2.73], [x0 + w, 2.73], [x1 + w, 3.66], [x1, 3.66]]);
          surfaceDecal(m, v.stripe!, at, n, polys, 0.004);
        });
    });
  // the hood ends: the top lamp, two lamps over a red and a white one, the grille (native x_both, photographs)
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const sp = e > 0 ? sh : lh;
      const spec = e > 0 ? shortHood : longHood;
      const at = onEnd(sp, e), n: Vec3 = [e, 0, 0];
      const xe = e > 0 ? spec.x1 : -spec.x0;
      const low = e > 0 && v.lowShortHood;
      m.scope("grille", () => grille(m, "slat", at, n, -0.4, 0.4, Y(1.85), Y(2.4), { pitch: 0.08, across: true }));
      m.scope("top lamp", () => headlamp(m, e, xe, 0, low ? Y(2.95) : Y(4.3), 0.18, "lampHead", 0.06));
      m.scope("lamps", () => {
        for (const z of [-0.85, 0.85]) {
          m.scope(z > 0 ? "right" : "left", () => headlamp(m, e, xe, z, Y(2.9), 0.1));
          m.scope(z > 0 ? "right red" : "left red", () => headlamp(m, e, xe, z, Y(2.15), 0.07, "lampRed", 0.04));
          m.scope(z > 0 ? "right white" : "left white", () => headlamp(m, e, xe, z, Y(1.95), 0.07, "lampHead", 0.04));
        }
      });
    });
  m.emit("smoke", [px(60), TOP + 0.08, 0], 0.12);
  m.scope("exhaust", () => m.prism("exhaust", ngon(10, 0.12, 0, px(60), 0), TOP - 0.05, TOP + 0.08));
}

function underframe(m: MeshBuilder, v: Cd742Variant): void {
  m.scope("frame", () => {
    const r: Ring = [[FRAME, -1.3], [FRAME - 0.3, -1.5], [-FRAME + 0.3, -1.5], [-FRAME, -1.3], [-FRAME, 1.3], [-FRAME + 0.3, 1.5], [FRAME - 0.3, 1.5], [FRAME, 1.3]];
    m.prism(v.frame, r, Y_FRAME, Y_DECK, false);
    m.cap(v.frame, r, Y_DECK);
    m.cap("underframe", r, Y_FRAME, false);
  });
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc: e * PIVOT, halfBase: 1.2, wheelR: 0.5, frameTop: 1.0 }));
  });
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      buffers(m, e, FRAME, BUFFERS, 1.05);
      m.scope("plough", () => hazardBeam(m, e, FRAME - 0.1, 0.1, 0.7, 1.45, 0.35, v.plough, 0.15));
      m.scope("number plate", () => {
        const at = faceAt(e, FRAME), n: Vec3 = [e, 0, 0];
        plate(m, "plateBlack", at, n, -0.4, 0.4, 1.4, 1.62);
        numberText(m, "white", at, n, v.number, 0, 1.51, 0.12, 0.024, e > 0);
      });
      m.scope("steps", () => {
        for (const s of [-1, 1]) steps(m, ...span(e * (FRAME - 0.75), e * (FRAME - 0.2)), s, 1.3, 1.48, [0.25, 0.75, 1.25], Y_FRAME);
      });
    });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) steps(m, px(34), px(29), s, 1.3, 1.48, [0.5, 1.0], Y_FRAME);
  });
  m.scope("railings", () => {
    for (const s of [-1, 1]) {
      railing(m, [-6.2, -5.1, -4.0, -2.9, -1.8, -0.7, 0.4, 1.5, CAB_X[0] - 0.06], s, 1.45, Y_DECK, Y(2.8));
      railing(m, [CAB_X[1] + 0.06, 5.6, 6.2], s, 1.45, Y_DECK, Y(2.8));
    }
    for (const e of [-1, 1]) for (const s of [-1, 1]) tubeSeg(m, "steel", [e * 6.2, Y(2.8), s * 1.45], [e * 6.2, Y(2.8), s * 1.2], 0.018);
  });
  m.scope("fuel tank", () => {
    // XML under: between the bogies, 5.4..8.0 m
    block(m, "underframe", px(80), px(54), 0.4, Y_FRAME, -1.35, 1.35);
    for (const s of [-1, 1]) block(m, v.frame, px(78), px(56), 0.6, 1.0, ...side(s, 1.35, 1.38));
  });
}

/** The hood locomotive in one of its variants; the default is Viamont 742 507. */
export function cd742(params?: ParamValues): MeshBuilder {
  const { variant } = resolveParams(CD742_PARAMS, params);
  const v: Cd742Variant = CD742_VARIANTS[variant as keyof typeof CD742_VARIANTS];
  const m = new MeshBuilder({ ...DIESEL_PALETTE, ...v.palette });
  m.scope("body", () => body(m, v));
  m.scope("underframe", () => underframe(m, v));
  return m;
}
