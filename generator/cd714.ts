// The CD 714 (CKD, 1994-1997): T 444.1 / 735 hood locomotives rebuilt with a
// new off-centre cab and a Tatra diesel engine, in the blue hood, red cab and
// red ends with the white V the 714.0 wore. Reconstructed from the native JT7
// XML and BMPs of vlakosimdb's cd_714 (assets/cd-714/native) and photographs
// (assets/cd-714/*.jpg).
//
// Native canvas: z_both 140 x 50 px for 14 x 5 m, 0.1 m a pixel: column px ->
// x = px / 10 - 7.0 (the source's x, centred), row r -> y = 5 - r / 10. The
// cab and the short hood are at +X. 14.24 m over the buffers, 7.60 m between
// the pivots, 2.40 m bogie wheelbase, 1.00 m wheels (assets/cd-714/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { bogie, buffers, onEnd, onSide, rect, shell, surfaceDecal } from "./czElectricKit.ts";
import {
  DIESEL_PALETTE, boxSpec, breaksOf, c, faceAt, grille, headlamp, numberText, pane, plate, railing, rolled, span, steps, tubeSeg,
  type BoxSpec,
} from "./smallDieselKit.ts";

/** 714 017-1: illustrative, a 714.0 photographed in this paint (assets/cd-714/PHOTOS.md). */
export const CD714_NUMBER = runningNumber("714", "017");

const PALETTE: Record<string, MaterialSpec> = {
  ...DIESEL_PALETTE,
  blue: c("#1a1a86"),
  red: c("#e00808"),
  white: c("#f2f2f2"),
  plateBlue: c("#003a8c"),
  frameGrey: c("#8c8c8c", 0.7),
  roofGrey: c("#a5a5a5", 0.6),
};

export const BUFFERS = 14.24 / 2;
export const PIVOT = 3.8;
const FRAME = 6.65; // the frame's ends (XML base 0.3..13.6 m, the corners chamfered)
const Y_FRAME = 1.1;
const Y_DECK = 1.5;
const px = (p: number) => p / 10 - 7.0;

const BLUE: Band[] = [[Y_DECK, 3.3, "blue"]];
const RED: Band[] = [[Y_DECK, 4.3, "red"]];

// XML base: the hood 2.0 m wide over 0.7..13.2 m, 1.5..3.2 m, a rolled top; red ends
const HOOD: BoxSpec = { x0: px(7), x1: px(132), hw: rolled(1.0, Y_DECK, 3.2, 0.12), side: BLUE, end: RED, corner: "end", roof: "blue" };
// XML cab: 3.0 m wide to 3.0 m, leaning in to 2.6 m at 3.8 m, over 7.7..9.8 m
const CAB: BoxSpec = { x0: px(77), x1: px(98), hw: [[Y_DECK, 1.5], [3.0, 1.5], [3.8, 1.32]], side: RED, end: RED, roof: "red", chamfer: 0.05 };

function body(m: MeshBuilder): void {
  const hood = boxSpec(HOOD), cab = boxSpec(CAB);
  m.scope("hood", () => shell(m, hood));
  m.scope("cab", () => {
    m.scope("shell", () => shell(m, cab));
    // the roof flares out to 7.3..10.2 m and falls to 2.2 m across at 4.2 m (XML cab clips, native rows 8-9)
    m.scope("roof", () => {
      const ring = (x0: number, x1: number, w: number) => [[x1, -w], [x1, w], [x0, w], [x0, -w]] as Array<[number, number]>;
      m.loft("roofGrey", ring(CAB.x0 + 0.03, CAB.x1 - 0.03, 1.3), 3.8, ring(px(72), px(103), 1.4), 3.98, false);
      m.loft("roofGrey", ring(px(72), px(103), 1.4), 3.98, ring(px(72.5), px(102.5), 1.1), 4.2);
    });
    const br = breaksOf(CAB);
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const at = onSide(cab, s), n: Vec3 = [0, 0, s];
        // three windows over the door (native z_both columns 78-96, rows 12-18)
        for (const [i, [a, b]] of ([[78, 84.4], [84.6, 90.4], [90.6, 97]] as const).entries())
          m.scope(`window ${i + 1}`, () => pane(m, at, n, px(a), px(b), 3.1, 3.76, br, 0.04));
        m.scope("door", () => surfaceDecal(m, "rubber", at, n, [rect(px(84), 1.55, px(91), 1.57), rect(px(84), 1.57, px(84) + 0.02, 3.05), rect(px(91) - 0.02, 1.57, px(91), 3.05)], 0.004));
        m.scope("number plate", () => {
          plate(m, "plateBlue", at, n, px(83), px(92), 2.2, 2.4, 0.02, br);
          numberText(m, "white", at, n, CD714_NUMBER, px(87.5), 2.3, 0.12, 0.024, s < 0);
        });
        m.scope("handrails", () => {
          for (const x of [px(84) - 0.07, px(91) + 0.07]) tubeSeg(m, "steel", [x, 1.6, s * 1.53], [x, 3.0, s * 1.53], 0.016);
        });
      });
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front windows" : "rear windows", () => {
        const at = onEnd(cab, e);
        for (const s of [-1, 1]) m.scope(s > 0 ? "right" : "left", () => pane(m, at, [e, 0, 0], ...side(s, 0.12, 1.28), 3.2, 3.74, br, 0.05));
      });
  });
  // the louvred hood sides: a row of tall grilles (native z_both, the lighter blue columns; photographs)
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right louvres" : "left louvres", () => {
      const at = onSide(hood, s), n: Vec3 = [0, 0, s];
      const panels: Array<[number, number]> = [[-6.05, -5.2], [-5.0, -4.15], [-3.95, -3.1], [-2.9, -2.05], [-1.85, -1.0], [-0.8, 0.0], [px(100), px(112)], [px(113), px(125)]];
      for (const [i, [a, b]] of panels.entries())
        m.scope(`louvre ${i + 1}`, () => grille(m, "slat", at, n, a, b, 1.7, 3.0, { pitch: 0.09, breaks: breaksOf(HOOD) }));
    });
  // the hood ends: red with the white V, the grille in it, two lamps over two red ones (native x_both, photographs)
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const at = onEnd(hood, e), n: Vec3 = [e, 0, 0];
      const xe = e > 0 ? HOOD.x1 : -HOOD.x0;
      // the V: outer edges from the top corners to the middle at 2.1 m, inner edges to 2.5 m
      m.scope("white v", () => surfaceDecal(m, "white", at, n, [
        [[-0.96, 2.98], [-0.5, 2.98], [0, 2.5], [0, 2.1]],
        [[0, 2.1], [0, 2.5], [0.5, 2.98], [0.96, 2.98]],
      ], 0.004));
      m.scope("grille", () => grille(m, "slat", at, n, -0.3, 0.3, 2.62, 3.0, { pitch: 0.075, across: true }));
      m.scope("lamps", () => {
        for (const z of [-0.8, 0.8]) {
          m.scope(z > 0 ? "right white" : "left white", () => headlamp(m, e, xe, z, 2.0, 0.1));
          m.scope(z > 0 ? "right red" : "left red", () => headlamp(m, e, xe, z, 1.7, 0.08, "lampRed", 0.05));
        }
        m.scope("top", () => {
          for (const z of [-0.12, 0.12]) headlamp(m, e, xe - 0.02, z, 3.1, 0.045, "lampHead", 0.04);
        });
      });
    });
  m.emit("smoke", [px(77), 4.4, 0], 0.18);
  m.scope("exhaust", () => m.prism("exhaust", ngon(12, 0.18, 0, px(77), 0), 3.15, 4.4));
}

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const r: Array<[number, number]> = [[FRAME, -1.3], [FRAME - 0.6, -1.5], [-FRAME + 0.6, -1.5], [-FRAME, -1.3], [-FRAME, 1.3], [-FRAME + 0.6, 1.5], [FRAME - 0.6, 1.5], [FRAME, 1.3]];
    m.prism("frameGrey", r, Y_FRAME, Y_DECK, false);
    m.cap("frameGrey", r, Y_DECK);
    m.cap("underframe", r, Y_FRAME, false);
  });
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc: e * PIVOT, halfBase: 1.2, wheelR: 0.5, frameTop: 1.0 }));
  });
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      buffers(m, e, FRAME, BUFFERS, 1.0);
      // the blue plate on the frame end (native x_both rows 36-38)
      m.scope("number plate", () => {
        const at = faceAt(e, FRAME), n: Vec3 = [e, 0, 0];
        plate(m, "plateBlue", at, n, -0.4, 0.4, 1.2, 1.42);
        numberText(m, "white", at, n, CD714_NUMBER, 0, 1.31, 0.12, 0.024, e > 0);
      });
      m.scope("plough", () => {
        const [a, b] = span(e * (FRAME - 0.3), e * (FRAME + 0.05));
        block(m, "frameGrey", a, b, 0.3, Y_FRAME, -1.25, 1.25);
        const [c0, c1] = span(e * (FRAME - 0.25), e * (FRAME + 0.1));
        block(m, "hazardYellow", c0, c1, 0.1, 0.3, -1.3, 1.3);
      });
      m.scope("steps", () => {
        for (const s of [-1, 1]) steps(m, ...span(e * (FRAME - 1.1), e * (FRAME - 0.6)), s, 1.3, 1.48, [0.5, 0.85], Y_FRAME);
      });
    });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) steps(m, px(84), px(91), s, 1.3, 1.48, [0.5, 0.85], Y_FRAME);
  });
  m.scope("railings", () => {
    for (const s of [-1, 1]) {
      railing(m, [-6.45, -5.1, -3.75, -2.4, -1.05, CAB.x0 - 0.06], s, 1.45, Y_DECK, 2.7);
      railing(m, [CAB.x1 + 0.06, 4.45, 5.6, 6.45], s, 1.45, Y_DECK, 2.7);
    }
    for (const e of [-1, 1]) for (const s of [-1, 1]) tubeSeg(m, "steel", [e * 6.45, 2.7, s * 1.45], [e * 6.45, 2.7, s * 1.1], 0.018);
  });
  m.scope("fuel tank", () => {
    // between the bogies (native z_both columns 53-79, rows 39-46)
    block(m, "underframe", px(53), px(79), 0.4, Y_FRAME, -1.1, 1.1);
    for (const s of [-1, 1]) block(m, "frameGrey", px(56), px(76), 0.55, 0.95, ...side(s, 1.1, 1.13));
  });
}

/** CD 714 017-1 with the blue hood, red cab and the white V on red ends. */
export function cd714(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => body(m));
  m.scope("underframe", () => underframe(m));
  return m;
}
