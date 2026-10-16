// The CKD two-axle shunter "Male lego": CSD T 234.0 / CD 704 and its industrial
// sister T 238.0 (later 704.5), one body, so one design with a `livery`
// parameter. Reconstructed from the native JT7 XML and BMPs of vlakosimdb's
// cd_704 and csd_t238_0 (the two share every texture; assets/cd-704/native)
// and photographs (assets/cd-704/*.jpg).
//
// Native canvas: z_both 80 x 40 px for 8 x 4 m, 0.1 m a pixel: column px ->
// x = px / 10 - 3.75 (the source's x, centred), row r -> y = 4 - r / 10. The
// cab and the short hood are at +X. 7.50 m over the buffers, a 6.50 m frame,
// 3.20 m wheelbase, 1.00 m wheels (assets/cd-704/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { buffers, onEnd, onSide, shell, surfaceDecal, rect } from "./czElectricKit.ts";
import {
  DIESEL_PALETTE, axleGear, boxSpec, breaksOf, c, grille, headlamp, numberText, pane, plate, railing, rolled, span, steps, tubeSeg,
  type BoxSpec,
} from "./smallDieselKit.ts";

export interface Cd704Livery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/diesel. */
  source: string;
  number: string;
  numberSource: string;
}

export const CD704_LIVERIES = {
  cd704: {
    title: "CD 704 014, blue with a yellow band",
    source: "cd_704",
    number: runningNumber("704", "014"),
    numberSource: "illustrative, a unit photographed in 2025 (704 014-0); the native plate does not resolve digits",
  },
  t2380: {
    title: "CSD T 238.0 / 704 518, the industrial version",
    source: "csd_t238_0",
    number: runningNumber("704", "518"),
    numberSource: "a T 238.0 renumbered into the 704.5 series (Commons category CZ 704 518 - 0); the native textures are cd_704's",
  },
} as const satisfies Record<string, Cd704Livery>;

export const CD704_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd704",
  values: Object.entries(CD704_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];
export const CD704_NUMBER = CD704_LIVERIES.cd704.number;

const PALETTE: Record<string, MaterialSpec> = {
  ...DIESEL_PALETTE,
  blue: c("#10528c"),
  lightBlue: c("#1073bd"),
  yellow: c("#cead18"),
  plateYellow: c("#efd66b"),
  digits: c("#7a3020"),
  frameGrey: c("#5a5c5c", 0.7),
  roofGrey: c("#a6a6a6", 0.6),
};

export const BUFFERS = 7.5 / 2;
export const FRAME = 6.5 / 2;
const BEAM = 3.3;
const Y_DECK = 1.3;
const Y_FRAME = 1.2;
const px = (p: number) => p / 10 - 3.75;

// Bands (native z_both rows): blue to 1.6, the yellow band 1.6..2.2, blue above
const BODY: Band[] = [[Y_DECK, 1.6, "blue"], [1.6, 2.2, "yellow"], [2.2, 3.4, "blue"]];

// XML alongx / alongz: the hood 2.0 m wide to 2.6 m over the whole frame, the cab 2.8 m wide 3.9..5.8 m to 3.3 m
const HOOD: BoxSpec = { x0: -FRAME, x1: FRAME, hw: rolled(1.0, Y_DECK, 2.6, 0.1), side: BODY, end: BODY, roof: "blue" };
const CAB: BoxSpec = { x0: px(39), x1: px(58), hw: [[Y_DECK, 1.4], [3.32, 1.4]], side: BODY, end: BODY, roof: "blue", chamfer: 0.05 };
const CAB_X = [CAB.x0, CAB.x1] as const;

function body(m: MeshBuilder, l: Cd704Livery): void {
  const hood = boxSpec(HOOD), cab = boxSpec(CAB);
  m.scope("hood", () => shell(m, hood));
  m.scope("cab", () => {
    m.scope("shell", () => shell(m, cab));
    // the overhanging roof: flared 0.3 m in x and falling to 2.2 m across at the top (XML cab clips, native rows 4-6)
    m.scope("roof", () => {
      const ring = (x0: number, x1: number, w: number) => [[x1, -w], [x1, w], [x0, w], [x0, -w]] as Array<[number, number]>;
      m.loft("roofGrey", ring(CAB_X[0] + 0.02, CAB_X[1] - 0.02, 1.38), 3.3, ring(px(35), px(62), 1.46), 3.42, false);
      m.loft("roofGrey", ring(px(35), px(62), 1.46), 3.42, ring(px(35.5), px(61.5), 1.1), 3.6);
    });
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const at = onSide(cab, s), n: Vec3 = [0, 0, s];
        // three windows (native z_both columns 40-45, 47-51, 52-57, rows 7-13); the middle one is the door's
        for (const [i, [a, b]] of ([[40, 46], [47, 52.4], [52.6, 58]] as const).entries())
          m.scope(`window ${i + 1}`, () => pane(m, at, n, px(a), px(b), 2.6, 3.3));
        m.scope("door", () => surfaceDecal(m, "rubber", at, n, [rect(px(47), 1.36, px(52.4), 1.38), rect(px(47), 1.38, px(47) + 0.02, 2.58), rect(px(52.4) - 0.02, 1.38, px(52.4), 2.58)], 0.004));
        m.scope("number plate", () => {
          plate(m, "plateYellow", at, n, px(47), px(57), 1.6, 2.1);
          numberText(m, "digits", at, n, l.number, px(52), 1.85, 0.16, 0.024, s < 0);
        });
        m.scope("handrails", () => {
          for (const x of [px(47) - 0.08, px(52.4) + 0.08]) tubeSeg(m, "steel", [x, 1.4, s * 1.46], [x, 3.0, s * 1.46], 0.016);
        });
      });
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front windows" : "rear windows", () => {
        const at = onEnd(cab, e);
        for (const s of [-1, 1]) m.scope(s > 0 ? "right" : "left", () => pane(m, at, [e, 0, 0], ...side(s, 0.15, 1.3), 2.6, 3.3));
      });
    m.scope("horn", () => {
      m.prism("steel", ngon(8, 0.04, 0, px(37.5), 0), 3.6, 3.7);
      block(m, "steel", px(37.5) - 0.15, px(37.5) + 0.1, 3.66, 3.72, -0.05, 0.05);
    });
  });
  // hood sides: louvred doors (photographs; native z_both columns 6-34 and 60-68)
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right louvres" : "left louvres", () => {
      const at = onSide(hood, s), n: Vec3 = [0, 0, s];
      const panels: Array<[number, number]> = [[-3.1, -2.45], [-2.35, -1.7], [-1.6, -0.95], [-0.85, -0.2], [px(60), px(68)]];
      for (const [i, [a, b]] of panels.entries()) m.scope(`louvre ${i + 1}`, () => grille(m, "slat", at, n, a, b, 1.45, 2.45, { pitch: 0.09, breaks: breaksOf(HOOD) }));
    });
  // the hood ends: the radiator grille, the white lamp over the red one at each corner (native x_both)
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const at = onEnd(hood, e), n: Vec3 = [e, 0, 0];
      m.scope("grille", () => grille(m, "slat", at, n, -0.4, 0.4, 1.8, 2.2, { pitch: 0.08, across: true, breaks: breaksOf(HOOD) }));
      m.scope("lamps", () => {
        for (const z of [-0.8, 0.8]) {
          m.scope(z > 0 ? "right white" : "left white", () => headlamp(m, e, FRAME, z, 1.8, 0.09));
          m.scope(z > 0 ? "right red" : "left red", () => headlamp(m, e, FRAME, z, 1.5, 0.075, "lampRed", 0.05));
        }
      });
      m.scope("number plate", () => {
        plate(m, "plateYellow", at, n, -0.42, 0.42, 1.36, 1.58);
        numberText(m, "digits", at, n, l.number, 0, 1.47, 0.12, 0.024, e > 0);
      });
    });
  m.emit("smoke", [-2.0, 2.85, 0.35], 0.09);
  m.scope("exhaust", () => m.prism("exhaust", ngon(10, 0.09, 0, -2.0, 0.35), 2.55, 2.85));
}

function underframe(m: MeshBuilder): void {
  m.scope("deck", () => {
    block(m, "frameGrey", -FRAME, FRAME, Y_FRAME, Y_DECK, -1.4, 1.4);
  });
  m.scope("running gear", () => axleGear(m, { xs: [-1.6, 1.6], wheelR: 0.5, frameTop: Y_FRAME, frameX: [-FRAME + 0.21, FRAME - 0.21] }));
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const [a, b] = span(e * (FRAME - 0.2), e * BEAM);
      m.scope("buffer beam", () => {
        block(m, "frameGrey", a, b, 0.3, Y_FRAME, -1.38, 1.38);
        const [s0, s1] = span(e * BEAM, e * (BEAM + 0.012));
        m.scope("stripe", () => block(m, "hazardYellow", s0, s1, 0.3, 0.4, -1.38, 1.38));
      });
      buffers(m, e, BEAM, BUFFERS, 1.0);
      m.scope("steps", () => {
        for (const s of [-1, 1]) steps(m, ...span(e * (FRAME - 0.75), e * (FRAME - 0.2)), s, 1.2, 1.4, [0.45, 0.85], Y_FRAME);
      });
    });
  m.scope("cab steps", () => {
    for (const s of [-1, 1]) steps(m, px(47), px(52.4), s, 1.2, 1.4, [0.45, 0.85], Y_FRAME);
  });
  m.scope("railings", () => {
    for (const s of [-1, 1]) {
      railing(m, [-3.15, -2.0, -0.9, CAB_X[0] - 0.05], s, 1.36, Y_DECK, 2.35);
      railing(m, [CAB_X[1] + 0.05, 3.15], s, 1.36, Y_DECK, 2.35);
    }
    for (const e of [-1, 1]) tubeSeg(m, "steel", [e * 3.15, 2.35, -1.36], [e * 3.15, 2.35, -1.05], 0.018);
    for (const e of [-1, 1]) tubeSeg(m, "steel", [e * 3.15, 2.35, 1.05], [e * 3.15, 2.35, 1.36], 0.018);
  });
  m.scope("equipment", () => {
    // the fuel tank and the air reservoir between the axles
    block(m, "frameGrey", -0.9, 0.9, 0.42, Y_FRAME - 0.05, -0.9, 0.9);
    for (const z of [-0.6, 0.6]) {
      const q = ngon(10, 0.14, 0, z, 0.62);
      m.sweep("steel", "x", q, 0.95, q, 1.05);
    }
  });
}

/** The CKD shunter in one of its liveries; the default is CD 704 014. */
export function cd704(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(CD704_PARAMS, params);
  const l: Cd704Livery = CD704_LIVERIES[livery as keyof typeof CD704_LIVERIES];
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => body(m, l));
  m.scope("underframe", () => underframe(m));
  return m;
}
