// The MUV 69 (motorovy univerzalni vozik, Moravskoslezske vagonky, from 1969):
// the two-axle track motor car of the Czech and Slovak railways' permanent-way
// gangs -- a short cab at one end and a flat loading deck behind it -- in the
// red and cream of the vlakosimdb model. Reconstructed from the native JT7 XML
// and BMPs of vlakosimdb's muv_69 (assets/muv-69/native) and photographs
// (assets/muv-69/*.jpg).
//
// The native model is coarse: a 6.0 m deck at 0.8 m and a cab only 2.4 m high.
// Lengths follow it (62 px for 6 m, 0.0968 m a pixel): column px -> source x =
// px * 6 / 62, model x = 3.05 - source x (flipped, so the cab is at +X). The
// heights follow the photographs: the deck at 1.05 m and the cab roof at
// 2.95 m, the native heights above the deck stretched by 1.1875 (native y =
// 0.8 + (y - 1.05) / 1.1875) and below it by 1.3125. 6.76 m over the couplers
// (assets/muv-69/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import type { Band } from "./cd163.ts";
import { buffers, onEnd, onSide, rect, shell, surfaceDecal } from "./czElectricKit.ts";
import {
  DIESEL_PALETTE, axleGear, boxSpec, breaksOf, c, headlamp, pane, span, steps, tubeSeg, wallAt,
  type BoxSpec,
} from "./smallDieselKit.ts";

const PALETTE: Record<string, MaterialSpec> = {
  ...DIESEL_PALETTE,
  cream: c("#f2e9c2"),
  red: c("#b51829"),
  frameBlack: c("#313131", 0.75),
  olive: c("#737308"),
  deck: c("#4a4640", 0.85),
  roofGrey: c("#c8c2a8", 0.6),
};

/** Model height of a native muv_69 height. */
export const Y = (yn: number): number => (yn <= 0.8 ? yn * (1.05 / 0.8) : 1.05 + (yn - 0.8) * 1.1875);
/** Native height of a model height. */
export const nativeY = (y: number): number => (y <= 1.05 ? y * (0.8 / 1.05) : 0.8 + (y - 1.05) / 1.1875);
/** Model x of a native column. */
const px = (p: number) => 3.05 - (p * 6) / 62;

export const COUPLERS = 6.76 / 2;
const FRAME = 2.95; // XML base 0.1..6.0 m
const Y_FRAME = 0.75;
const Y_DECK = 1.05;
/** The axles under the native wheels (columns 15 and 53.5): 3.73 m apart, the front one under the cab. */
export const AXLES = [px(53.5), px(15)] as const;
export const WHEEL_R = 0.28;

// the cab: native z_dec red to 1.6 m, cream above (photographs: red to just under the windows)
const BANDS: Band[] = [[Y_DECK, Y(1.6), "red"], [Y(1.6), 3.2, "cream"]];
// XML base clip: the cab 0.1..2.5 m, its front raked 0.3 m back from 1.6 m to the roof
const CAB: BoxSpec = {
  x0: px(25.8), x1: FRAME, hw: [[Y_DECK, 1.4], [2.8, 1.4], [2.905, 1.3], [2.95, 1.15]], inset: [[Y_DECK, 0], [Y(1.6), 0], [2.95, 0.3]],
  side: BANDS, end: BANDS, corner: "end", roof: "roofGrey", chamfer: 0.08,
};

function cab(m: MeshBuilder): void {
  const sp = boxSpec(CAB);
  const br = breaksOf(CAB);
  m.scope("shell", () => shell(m, sp));
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      const at = onSide(sp, s), n: Vec3 = [0, 0, s];
      // the side windows (native z_dec columns 5-11, 13-20, 22-23, rows 27-32)
      const wins: Array<[number, number]> = [[12, 5], [21, 13], [24, 22]];
      for (const [i, [a, b]] of wins.entries()) m.scope(`window ${i + 1}`, () => pane(m, at, n, px(a), px(b), Y(1.7), Y(2.3), br, 0.05));
      m.scope("door", () => surfaceDecal(m, "rubber", at, n, [rect(px(21.2), Y_DECK + 0.05, px(12), Y_DECK + 0.07), rect(px(21.2), Y_DECK + 0.07, px(21.2) + 0.02, Y(2.35)), rect(px(12) - 0.02, Y_DECK + 0.07, px(12), Y(2.35)), rect(px(21.2), Y(2.35), px(12), Y(2.35) + 0.02)], 0.004));
      m.scope("handrail", () => tubeSeg(m, "steel", [px(12) + 0.06, 1.3, s * 1.44], [px(12) + 0.06, 2.3, s * 1.44], 0.016));
    });
  // the windscreen and the rear windows (native x_inc / x_dec rows 27-32)
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front windows" : "rear windows", () => {
      const at = onEnd(sp, e);
      for (const s of [-1, 1]) m.scope(s > 0 ? "right" : "left", () => pane(m, at, [e, 0, 0], ...side(s, 0.05, 1.35), Y(1.7), Y(2.3), br, 0.05));
    });
  m.scope("lamps", () => {
    // the yellow beacon and two lamps on the roof front (photographs), two lamps low on the cab front
    m.prism("hazardYellow", ngon(10, 0.1, 0, FRAME - 0.7, 0), 2.94, 3.1);
    for (const z of [-0.75, 0.75]) {
      m.scope(z > 0 ? "right top" : "left top", () => headlamp(m, 1, FRAME - 0.42, z, 3.0, 0.07, "lampHead", 0.06));
      m.scope(z > 0 ? "right low" : "left low", () => headlamp(m, 1, FRAME, z, Y(1.2), 0.08));
    }
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    block(m, "frameBlack", -FRAME, FRAME, Y_FRAME, Y_DECK - 0.02, -1.35, 1.35);
    // the olive line along the frame (native row 43, columns 3-59)
    m.scope("line", () => {
      for (const s of [-1, 1]) surfaceDecal(m, "olive", wallAt(s, 1.35), [0, 0, s], [rect(px(60), Y(0.6), px(3), Y(0.7))], 0.003);
    });
  });
  m.scope("deck", () => {
    // the loading deck behind the cab, its plates and the stake pockets along its edges
    block(m, "deck", -FRAME, CAB.x0, Y_DECK - 0.02, Y_DECK, -1.35, 1.35);
    for (const s of [-1, 1])
      for (let x = -FRAME + 0.3; x < CAB.x0 - 0.2; x += 0.75) block(m, "frameBlack", x, x + 0.1, Y_FRAME + 0.05, Y_DECK - 0.04, ...side(s, 1.35, 1.42));
    block(m, "frameBlack", -FRAME, -FRAME + 0.06, Y_DECK, Y_DECK + 0.15, -1.35, 1.35);
  });
  m.scope("running gear", () => axleGear(m, { xs: AXLES, wheelR: WHEEL_R, frameTop: Y_FRAME, frameX: [-FRAME + 0.25, FRAME - 0.25] }));
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const [a, b] = span(e * (FRAME - 0.2), e * FRAME);
      m.scope("buffer beam", () => block(m, "frameBlack", a, b, 0.5, Y_FRAME, -1.35, 1.35));
      buffers(m, e, FRAME, COUPLERS, 0.9);
      m.scope("steps", () => {
        for (const s of [-1, 1]) steps(m, ...span(e * (FRAME - 0.75), e * (FRAME - 0.3)), s, 1.2, 1.36, [0.45], Y_FRAME);
      });
    });
  m.scope("engine box", () => {
    // the engine and the hydraulic tank under the deck (photographs)
    block(m, "frameBlack", px(40), px(28), 0.35, Y_FRAME, -0.9, 0.9);
    const q: Ring = ngon(10, 0.2, 0, 0.6, 0.5);
    m.sweep("steel", "x", q, px(46), q, px(41));
  });
}

/** The MUV 69 track motor car in red and cream, with an empty deck. */
export function muv69(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("cab", () => cab(m));
  m.scope("underframe", () => underframe(m));
  return m;
}

