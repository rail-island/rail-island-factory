// The CKD T 334.0 / CD 710 "rosnicka" (tree frog): a three-axle rod-coupled
// shunter with hydrodynamic transmission, as 710 620-6 in red with the yellow
// band. Reconstructed from the native JT7 XML and BMPs of vlakosimdb's
// cd_710.620-6 (assets/cd-710/native) and photographs (assets/cd-710/*.jpg).
//
// Native canvas: z_both 100 x 42 px for 10 x 4.2 m, 0.1 m a pixel: column px
// -> x = px / 10 - 4.5 (the source's x, centred on the 8.2 m frame), row r ->
// y = 4.2 - r / 10. The cab stands off centre toward +X. 9.44 m over the
// buffers, an 8.20 m frame, 2.0 + 2.2 m wheelbase, 1.00 m wheels
// (assets/cd-710/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { buffers, onEnd, onSide, rect, shell, surfaceDecal } from "./czElectricKit.ts";
import {
  DIESEL_PALETTE, axleGear, boxSpec, breaksOf, c, grille, hazardBeam, headlamp, numberText, pane, plate, railing, span, steps, tubeSeg,
  type BoxSpec,
} from "./smallDieselKit.ts";

/** 710 620-6: the vlakosimdb model's name; the check digit by the 1988 scheme. */
export const CD710_NUMBER = runningNumber("710", "620");

const PALETTE: Record<string, MaterialSpec> = {
  ...DIESEL_PALETTE,
  red: c("#8c0000"),
  yellow: c("#e6e600"),
  frameGrey: c("#6a6a6a", 0.7),
  roofGrey: c("#8a8a8a", 0.6),
};

export const BUFFERS = 9.44 / 2;
export const FRAME = 8.2 / 2;
const Y_FRAME = 0.9;
const Y_DECK = 1.2;
const px = (p: number) => p / 10 - 4.5;
/** The axles: the published 2.2 + 2.0 m, the longer gap toward -X as the native wheels have it, the last two on the native ones. */
export const AXLES = [-2.05, 0.15, 2.15] as const;

// Bands (native z_both rows 19-22): red, the yellow band 1.9..2.3 m, red
const BODY: Band[] = [[Y_DECK, 1.9, "red"], [1.9, 2.3, "yellow"], [2.3, 3.7, "red"]];

// XML box: the hood 2.0 m wide over 0.6..8.4 m, arched on top (2.5 -> 2.7 m), its ends leaning 0.2 m back at the top
const HOOD: BoxSpec = {
  x0: px(6), x1: px(84), hw: [[Y_DECK, 1.0], [2.5, 1.0], [2.6, 0.9], [2.7, 0.45]], inset: [[Y_DECK, 0], [2.6, 0.1], [2.7, 0.2]],
  chamfer: 0.12, side: BODY, end: BODY, roof: "red",
};
// XML cab: 3.0 m wide to 2.7 m, the roof arched to 3.6 m, the walls leaning 0.1 m in at the top
const CAB: BoxSpec = {
  x0: px(39), x1: px(62), hw: [[Y_DECK, 1.5], [2.7, 1.5], [3.3, 1.4], [3.4, 1.3], [3.5, 1.0], [3.6, 0.4]], inset: [[Y_DECK, 0], [2.7, 0], [3.6, 0.1]],
  chamfer: 0.06, side: BODY, end: BODY, roof: "red", corner: "end",
};
// XML umbrela: the sun roof over the cab, 0.1 m proud of its arch, 3.8..6.3 m
const SUNROOF: BoxSpec = {
  x0: px(37), x1: px(63), hw: [[3.38, 1.44], [3.46, 1.34], [3.56, 1.04], [3.7, 0.44]], chamfer: 0.04,
  side: [[3, 4, "roofGrey"]], end: [[3, 4, "roofGrey"]], roof: "roofGrey", bottom: "roofGrey",
};

function body(m: MeshBuilder): void {
  const hood = boxSpec(HOOD), cab = boxSpec(CAB);
  m.scope("hood", () => shell(m, hood));
  m.scope("cab", () => {
    m.scope("shell", () => shell(m, cab));
    m.scope("sun roof", () => shell(m, boxSpec(SUNROOF)));
    const br = breaksOf(CAB);
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const at = onSide(cab, s), n: Vec3 = [0, 0, s];
        // the narrow rear window, the door with its tall window, the front window (native z_both rows 9-14)
        const wins: Array<[number, number]> = [[40, 44], [46, 55], [57, 61]];
        for (const [i, [a, b]] of wins.entries()) m.scope(`window ${i + 1}`, () => pane(m, at, n, px(a), px(b), 2.7, 3.3, br, 0.04));
        m.scope("door", () => surfaceDecal(m, "rubber", at, n, [rect(px(45.6), 1.25, px(55.4), 1.27), rect(px(45.6), 1.27, px(45.6) + 0.02, 2.66), rect(px(55.4) - 0.02, 1.27, px(55.4), 2.66)], 0.004));
        m.scope("number plate", () => {
          plate(m, "plate", at, n, px(48), px(57), 2.35, 2.6, 0.02, br);
          numberText(m, "white", at, n, CD710_NUMBER, px(52.5), 2.475, 0.13, 0.024, s < 0);
        });
        m.scope("handrails", () => {
          for (const x of [px(45.6) - 0.07, px(55.4) + 0.07]) tubeSeg(m, "steel", [x, 1.35, s * 1.53], [x, 2.6, s * 1.53], 0.016);
        });
      });
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front windows" : "rear windows", () => {
        const at = onEnd(cab, e);
        for (const s of [-1, 1]) m.scope(s > 0 ? "right" : "left", () => pane(m, at, [e, 0, 0], ...side(s, 0.3, 1.3), 2.72, 3.3, br, 0.05));
      });
    m.scope("horn", () => m.prism("steel", ngon(8, 0.05, 0, px(45), 0), 3.6, 3.78));
  });
  // hood sides: louvred covers above the band and the door seams (photographs; native z_both row 17)
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right hood side" : "left hood side", () => {
      const at = onSide(hood, s), n: Vec3 = [0, 0, s];
      const louvres: Array<[number, number]> = [[-3.6, -3.1], [-3.0, -2.5], [-2.4, -1.9], [-1.8, -1.3], [-1.2, -0.7], [1.8, 2.3], [2.4, 2.9], [3.0, 3.5]];
      m.scope("louvres", () => {
        for (const [i, [a, b]] of louvres.entries()) m.scope(`louvre ${i + 1}`, () => grille(m, "slat", at, n, a, b, 2.33, 2.48, { pitch: 0.07, breaks: breaksOf(HOOD) }));
      });
      m.scope("door seams", () => {
        const seams = [-3.65, -2.45, -1.25, 1.75, 2.95].map((x) => rect(x, 1.3, x + 0.02, 1.88));
        surfaceDecal(m, "rubber", at, n, seams, 0.004);
      });
    });
  // the hood ends: the top lamp, two low lamps, doors, the plate (native x_both, photographs)
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const at = onEnd(hood, e), n: Vec3 = [e, 0, 0];
      const xe = FRAME - 0.2;
      m.scope("top lamp", () => headlamp(m, e, xe - 0.1, 0, 2.6, 0.11, "lampHead", 0.08));
      m.scope("lamps", () => {
        for (const z of [-0.8, 0.8]) m.scope(z > 0 ? "right" : "left", () => headlamp(m, e, xe, z, 1.42, 0.1));
      });
      m.scope("doors", () => surfaceDecal(m, "rubber", at, n, [rect(-0.02, 1.3, 0.02, 2.3), rect(-0.6, 1.3, -0.58, 2.3), rect(0.58, 1.3, 0.6, 2.3), rect(-0.6, 2.3, 0.6, 2.32)], 0.004));
      m.scope("number plate", () => {
        plate(m, "plate", at, n, -0.42, 0.42, 1.5, 1.72);
        numberText(m, "white", at, n, CD710_NUMBER, 0, 1.61, 0.11, 0.024, e > 0);
      });
    });
  m.emit("smoke", [-3.2, 2.95, 0], 0.1);
  m.scope("exhaust", () => m.prism("exhaust", ngon(10, 0.1, 0, -3.2, 0), 2.6, 2.95));
}

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => block(m, "frameGrey", -FRAME, FRAME, Y_FRAME, Y_DECK, -1.5, 1.5));
  m.scope("running gear", () => axleGear(m, { xs: AXLES, wheelR: 0.5, frameTop: Y_FRAME, frameX: [-FRAME + 0.32, FRAME - 0.32], rods: 0.2 }));
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      // the deep buffer beam in red and white stripes (native x_both rows 33-38)
      m.scope("buffer beam", () => hazardBeam(m, e, FRAME, 0.3, Y_FRAME, 1.5, 0.3, ["hazardRed", "hazardWhite"], 0.15));
      buffers(m, e, FRAME, BUFFERS, 1.05);
      m.scope("steps", () => {
        for (const s of [-1, 1]) steps(m, ...span(e * (FRAME - 0.75), e * (FRAME - 0.32)), s, 1.3, 1.5, [0.4, 0.7], Y_FRAME);
      });
    });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) steps(m, px(46), px(55), s, 1.3, 1.5, [0.4, 0.7], Y_FRAME);
  });
  m.scope("railings", () => {
    for (const s of [-1, 1]) {
      railing(m, [-3.95, -2.8, -1.65, CAB.x0 - 0.06], s, 1.45, Y_DECK, 1.95);
      railing(m, [CAB.x1 + 0.06, 2.9, 3.95], s, 1.45, Y_DECK, 1.95);
    }
    for (const e of [-1, 1]) {
      for (const s of [-1, 1]) {
        tubeSeg(m, "steel", [e * 3.95, 1.95, s * 1.45], [e * 3.95, 1.95, s * 1.1], 0.018);
        // the tall grab rails at the frame's corners (photographs)
        tubeSeg(m, "steel", [e * 4.02, Y_DECK, s * 1.2], [e * 4.02, 2.2, s * 1.2], 0.02);
      }
    }
  });
}

/** CD 710 620-6, the "rosnicka", in red with the yellow band. */
export function cd710(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => body(m));
  m.scope("underframe", () => underframe(m));
  return m;
}
