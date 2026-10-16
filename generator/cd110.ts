// The Skoda centre-cab shunters, the "zehlicka" (flat iron): CSD E 458.0 / CD
// 110 (3 kV DC, resistor control), E 458.1 / CD 111 (DC, pulse control) and
// S 458.0 / CD 210 (25 kV AC) share the mechanical part -- frame, hoods, cab
// and bogies -- so they are one design with a `livery` parameter; the 210 adds
// its main breaker on the cab roof. Reconstructed from the native JT7 XML and
// BMPs of three vlakosimdb models (assets/cd-110/native) and photographs
// (assets/cd-110/*.jpg).
//
// The geometry follows the most detailed source, cd_110 046-0 (a 14.4 by 6 m
// canvas, 0.1 m a pixel): column px -> x = (72 - px) / 10 (the source's x
// flipped), row r -> y = 6.0 - r / 10. 14.40 m over the buffers, a 13.16 m
// frame, 3.0 m wide, 6.30 m between the pivots, 2.80 m bogie wheelbase,
// 1.05 m wheels (assets/cd-110/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, tubeX, type Band } from "./cd163.ts";
import {
  KIT_PALETTE, bogie, buffers, c, insulator, lerpTable, numberOn, onEnd, onSide, rect, roundRect, shell, singleArm,
  surfaceDecal, surfacePanel, type ShellSpec,
} from "./czElectricKit.ts";

export interface Cd110Livery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/electric. */
  source: string;
  number: string;
  numberSource: string;
  palette: Record<string, MaterialSpec>;
  /** The hoods' and the lower cab's bands (from the deck at 1.4 m up). */
  hood: readonly Band[];
  /** The hood ends' bands. */
  hoodEnd: readonly Band[];
  /** The cab's colour above the hoods (3.2 m up): the windows' band. */
  cabTop: string;
  frame: string;
  /** The 210's main breaker and AC roof line on the cab roof. */
  acRoof: boolean;
}

const BODY: Band = [1.4, 3.3, "body"];
export const CD110_LIVERIES = {
  cd110: {
    title: "CD 110 046, red, cream cab",
    source: "cd_110 046-0",
    number: runningNumber("110", "046"),
    numberSource: "the vlakosimdb model's name",
    palette: { body: c("#8e1208"), cream: c("#d6d3b8"), beam: c("#d2c418") },
    hood: [[1.4, 2.3, "body"], [2.3, 2.6, "cream"], [2.6, 3.3, "body"]],
    hoodEnd: [[1.4, 2.2, "body"], [2.2, 2.6, "cream"], [2.6, 3.3, "body"]],
    cabTop: "cream",
    frame: "frame",
    acRoof: false,
  },
  cd111: {
    title: "CD 111 006, green, orange ends",
    source: "cd_111",
    number: runningNumber("111", "006"),
    numberSource: "illustrative, a unit of the class (photographed as 111 006-3); the native plate does not resolve digits",
    palette: { body: c("#2f7428"), cream: c("#e6e49a"), orange: c("#f07c08"), beam: c("#d2c418") },
    hood: [BODY],
    hoodEnd: [[1.4, 2.1, "body"], [2.1, 2.5, "orange"], [2.5, 3.3, "body"]],
    cabTop: "cream",
    frame: "frameGrey",
    acRoof: false,
  },
  cd210: {
    title: "CD 210 021, blue, cream band",
    source: "cd_210",
    number: runningNumber("210", "021"),
    numberSource: "illustrative, a unit of the class (photographed as 210 021 in Plzen); the native plate does not resolve digits",
    palette: { body: c("#1c3a8c"), cream: c("#efeca4"), beam: c("#d2c418") },
    hood: [[1.4, 2.1, "body"], [2.1, 2.5, "cream"], [2.5, 3.3, "body"]],
    hoodEnd: [[1.4, 2.1, "body"], [2.1, 2.5, "cream"], [2.5, 3.3, "body"]],
    cabTop: "cream",
    frame: "frameGrey",
    acRoof: true,
  },
} as const satisfies Record<string, Cd110Livery>;

export const CD110_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd110",
  values: Object.entries(CD110_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];
export const CD110_NUMBER = CD110_LIVERIES.cd110.number;

const SHARED: Record<string, MaterialSpec> = { frameGrey: c("#4c4f4c", 0.7) };

// ---------------------------------------------------------------------------
// The profiles (XML alongx / alongy / alongz of cd_110 046-0, flipped and centred)

export const FRAME = 13.16 / 2;
export const BUFFERS = 14.4 / 2;
const Y_FRAME = 0.9;
const Y_DECK = 1.4;
const CAB = 1.4; // the cab's lower front and rear walls
const CAB_TOP = 4.3;
const HOOD_W = 1.1;

// the hoods: 2.2 m wide, their outer ends leaning out from 5.80 m at the deck to 5.95 m at the roof, a cambered top
const hoodSpec = (e: number, l: Cd110Livery): ShellSpec => ({
  heights: [Y_DECK, 3.1, 3.22],
  xc: e * 2.9,
  tip: (y) => lerpTable([[Y_DECK, 2.9], [3.1, 3.03], [3.22, 3.04]], y),
  hw: (y) => lerpTable([[Y_DECK, HOOD_W], [3.1, HOOD_W], [3.22, 0.35]], y),
  endPlan: (y) => {
    const w = lerpTable([[Y_DECK, HOOD_W], [3.1, HOOD_W], [3.22, 0.35]], y);
    return [[0, 0], [w - 0.04, 0], [w, 0.04]];
  },
  side: l.hood, end: l.hoodEnd, corner: "end", roof: "body", ends: [e],
});
// beside the cab, full width: the low cabinets with the ramp falling to the hood (XML roof clip 2.1..5.8 m) ...
const cabinetSpec = (e: number, l: Cd110Livery): ShellSpec => ({
  heights: [Y_DECK, 2.0, 2.6],
  xc: e * 2.05,
  tip: (y) => lerpTable([[Y_DECK, 3.05], [2.0, 3.05], [2.6, 1.55]], y),
  hw: () => 1.49,
  endPlan: () => [[0, 0], [1.45, 0], [1.49, 0.04]],
  side: l.hood, end: l.hood, corner: "end", roof: "body", ends: [e],
});
// ... and the full-width block under the cab's front windows (XML roof clip 4.65..5.8 m)
const blockSpec = (e: number, l: Cd110Livery): ShellSpec => ({
  heights: [Y_DECK, 3.05, 3.2],
  xc: e * 0.9,
  tip: (y) => lerpTable([[Y_DECK, 1.65], [3.05, 1.33], [3.2, 1.3]], y),
  hw: (y) => lerpTable([[Y_DECK, 1.48], [3.05, 1.48], [3.2, 0.5]], y),
  endPlan: (y) => {
    const w = lerpTable([[Y_DECK, 1.48], [3.05, 1.48], [3.2, 0.5]], y);
    return [[0, 0], [w - 0.03, 0], [w, 0.03]];
  },
  side: l.hood, end: l.hood, corner: "end", roof: "body", ends: [e],
});
// the cab: full width to 3.2 m, the upper cab leaning in to the roof (XML cab clip)
const CAB_TIP: ReadonlyArray<readonly [number, number]> = [[Y_DECK, CAB], [3.2, CAB], [CAB_TOP, 1.2]];
const CAB_HW: ReadonlyArray<readonly [number, number]> = [[Y_DECK, 1.5], [3.2, 1.5], [CAB_TOP, 1.3]];
const cabSpec = (l: Cd110Livery): ShellSpec => ({
  heights: [Y_DECK, 3.2, CAB_TOP],
  tip: (y) => lerpTable(CAB_TIP, y),
  hw: (y) => lerpTable(CAB_HW, y),
  endPlan: (y) => {
    const w = lerpTable(CAB_HW, y);
    return [[0, 0], [w - 0.06, 0], [w, 0.06]];
  },
  side: [...l.hood.filter(([a]) => a < 3.2).map(([a, b, m]): Band => [a, Math.min(b, 3.2), m]), [3.2, 4.4, l.cabTop]],
  end: [...l.hood.filter(([a]) => a < 3.2).map(([a, b, m]): Band => [a, Math.min(b, 3.2), m]), [3.2, 4.4, l.cabTop]],
  corner: "end", roof: "roof",
});
const CAB_BREAKS = [3.2];

// ---------------------------------------------------------------------------

function cab(m: MeshBuilder, l: Cd110Livery): void {
  const sp = cabSpec(l);
  m.scope("shell", () => shell(m, sp));
  m.scope("roof", () => block(m, "roof", -1.32, 1.32, CAB_TOP - 0.02, CAB_TOP + 0.05, -1.42, 1.42));
  // two windows over each hood (native x_both rows 17-26) and four on each side (z_both rows 18-27)
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front windows" : "rear windows", () => {
      const at = onEnd(sp, e);
      for (const s of [-1, 1])
        m.scope(s > 0 ? "right" : "left", () => {
          const [a, b] = side(s, 0.04, 1.25);
          surfacePanel(m, "rim", at, [e, 0, 0], roundRect(a, b, 3.3, 4.2, 0.05), -0.01, 0.014, [], CAB_BREAKS);
          m.scope("glass", () => surfacePanel(m, "glass", at, [e, 0, 0], roundRect(a + 0.05, b - 0.05, 3.35, 4.15, 0.04), -0.005, 0.022, [], CAB_BREAKS));
        });
    });
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      const at = onSide(sp, s);
      const n: Vec3 = [0, 0, s];
      m.scope("windows", () => {
        for (const [i, [x0, x1]] of ([[-1.12, -0.78], [-0.7, -0.1], [0.1, 0.7], [0.78, 1.12]] as const).entries())
          m.scope(`window ${i + 1}`, () => {
            surfacePanel(m, "rim", at, n, roundRect(x0, x1, 3.3, 4.2, 0.05), -0.01, 0.014, [], CAB_BREAKS);
            m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(x0 + 0.05, x1 - 0.05, 3.35, 4.15, 0.04), -0.005, 0.022, [], CAB_BREAKS));
          });
      });
      // the cab door (native z_both columns 63-71), its handrails
      m.scope("door", () => {
        surfaceDecal(m, "rubber", at, n, [rect(0.1, 1.45, 0.9, 1.47), rect(0.1, 1.47, 0.12, 3.12), rect(0.88, 1.47, 0.9, 3.12), rect(0.1, 3.12, 0.9, 3.14)], 0.004);
        for (const x of [0.02, 0.98]) m.prism("steel", ngon(6, 0.016, 0, x, s * 1.53), 1.5, 3.0);
      });
      m.scope("number plate", () => {
        surfacePanel(m, "plate", at, n, rect(-1.2, 2.2, -0.3, 2.5), -0.01, 0.02, [], CAB_BREAKS);
        numberOn(m, at, n, l.number, -0.75, 2.35, 0.13, 0.024, s < 0);
      });
    });
}

function hood(m: MeshBuilder, e: number, l: Cd110Livery): void {
  const sp = hoodSpec(e, l);
  m.scope("hood", () => shell(m, sp));
  m.scope("cabinets", () => shell(m, cabinetSpec(e, l)));
  m.scope("cab block", () => shell(m, blockSpec(e, l)));
  // louvres on the hood sides (native z_both rows 30-46, photographs)
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right louvres" : "left louvres", () => {
      const hoodAt = onSide(sp, s);
      const cabAt: (x: number, y: number, d: number) => Vec3 = (x, y, d) => [x, y, s * (1.49 + d)];
      const blockAt: (x: number, y: number, d: number) => Vec3 = (x, y, d) => [x, y, s * (1.48 + d)];
      // [surface, x0, x1, y0, y1]: native columns 20-47 over the cream band, 27-47 under it, 49-56 on the block by the cab
      const panels: Array<[typeof hoodAt, number, number, number, number]> = [
        [hoodAt, 2.5, 3.1, 2.68, 3.08], [hoodAt, 3.2, 3.8, 2.68, 3.08], [hoodAt, 3.9, 4.5, 2.68, 3.08], [hoodAt, 4.6, 5.2, 2.68, 3.08],
        [hoodAt, 5.35, 5.8, 2.68, 3.08], [cabAt, 2.5, 3.1, 2.0, 2.55], [cabAt, 3.2, 3.8, 2.0, 2.45], [cabAt, 3.9, 4.5, 1.6, 2.2],
        [blockAt, 1.5, 2.2, 1.5, 3.0],
      ];
      for (const [i, [at, a, b, y0, y1]] of panels.entries()) {
        const [x0, x1] = [e * a, e * b].sort((p, q) => p - q) as [number, number];
        m.scope(`louvre ${i + 1}`, () => {
          surfacePanel(m, "rim", at, [0, 0, s], rect(x0, y0, x1, y1), -0.01, 0.012);
          surfacePanel(m, "louvre", at, [0, 0, s], rect(x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04), -0.005, 0.016);
          const slats: Ring[] = [];
          for (let x = x0 + 0.08; x < x1 - 0.08; x += 0.09) slats.push(rect(x, y0 + 0.05, x + 0.04, y1 - 0.05));
          surfaceDecal(m, "body", at, [0, 0, s], slats, 0.022);
        });
      }
    });
  // the hood end: twin top lamps, two marker lamps, the number plate, a door (native x_both)
  const at = onEnd(sp, e);
  const n: Vec3 = [e, 0, 0];
  m.scope("hood end", () => {
    m.scope("door", () => surfaceDecal(m, "rubber", at, n, [rect(-1.0, 1.5, 1.0, 1.52), rect(-1.0, 2.66, 1.0, 2.68), rect(-1.0, 1.52, -0.98, 2.66), rect(0.98, 1.52, 1.0, 2.66)], 0.004));
    m.scope("headlamp", () => {
      surfacePanel(m, "rim", at, n, roundRect(-0.85, -0.35, 2.92, 3.1, 0.04), -0.01, 0.03);
      for (const z of [-0.72, -0.48]) {
        const x = 2.9 + sp.tip(3.01) + 0.03;
        const lens = ngon(10, 0.07, 0, z, 3.01);
        m.sweep("lampHead", "x", lens, e * (x - 0.01), lens, e * (x + 0.012));
      }
    });
    m.scope("lamps", () => {
      for (const z of [0.85, -0.85])
        m.scope(z > 0 ? "right lamp" : "left lamp", () => {
        const y = 1.55, x = 2.9 + sp.tip(y);
        const rim = ngon(12, 0.11, 0, z, y), lens = ngon(12, 0.08, 0, z, y);
        m.sweep("rim", "x", rim, e * (x - 0.01), rim, e * (x + 0.06));
        m.sweep("lampHead", "x", lens, e * (x + 0.06), lens, e * (x + 0.072));
        });
    });
    m.scope("number plate", () => {
      surfacePanel(m, "plate", at, n, rect(-0.4, 1.6, 0.4, 1.9), -0.01, 0.02);
      numberOn(m, at, n, l.number, 0, 1.75, 0.1, 0.024, e > 0);
    });
  });
}

function frame(m: MeshBuilder, l: Cd110Livery): void {
  m.scope("frame", () => {
    const r: Ring = [[FRAME, -1.3], [FRAME - 0.2, -1.5], [-FRAME + 0.2, -1.5], [-FRAME, -1.3], [-FRAME, 1.3], [-FRAME + 0.2, 1.5], [FRAME - 0.2, 1.5], [FRAME, 1.3]];
    m.prism(l.frame, r, Y_FRAME, Y_DECK, false);
    m.cap("roof", r, Y_DECK);
    m.cap("underframe", r, Y_FRAME, false);
  });
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      buffers(m, e, FRAME, BUFFERS, 1.06);
      const [b0, b1] = [e * (FRAME - 0.2), e * (FRAME + 0.06)].sort((a, b) => a - b) as [number, number];
      m.scope("plough", () => block(m, "beam", b0, b1, 0.3, Y_FRAME + 0.02, -1.25, 1.25));
      m.scope("railings", () => {
        // posts at the frame's corners, rails across the end and back along the hood
        const x = e * (FRAME - 0.12);
        for (const z of [-1.35, 1.35]) m.prism("steel", ngon(6, 0.022, 0, x, z), Y_DECK, 2.45);
        tubeX(m, "steel", 0.02, x, 2.45, -1.35, x, 2.45, 1.35, 6);
        for (const s of [-1, 1]) tubeX(m, "steel", 0.02, x, 2.45, s * 1.35, e * 5.2, 2.45, s * 1.35, 6);
        for (const s of [-1, 1]) m.prism("steel", ngon(6, 0.022, 0, e * 5.2, s * 1.35), Y_DECK, 2.45);
      });
      m.scope("steps", () => {
        for (const s of [-1, 1]) {
          const [x0, x1] = [e * (FRAME - 0.7), e * (FRAME - 0.15)].sort((a, b) => a - b) as [number, number];
          for (const y of [0.4, 0.7]) block(m, "steel", x0, x1, y, y + 0.04, ...side(s, 1.3, 1.48));
          for (const xx of [x0, x1 - 0.04]) block(m, "steel", xx, xx + 0.04, 0.4, Y_FRAME + 0.02, ...side(s, 1.42, 1.48));
        }
      });
    });
  m.scope("equipment", () => {
    for (const z of [-0.7, 0.7]) {
      const q = ngon(12, 0.18, 0, z, 0.62);
      m.sweep("steel", "x", q, -1.2, q, 1.2);
    }
  });
}

function roofEquipment(m: MeshBuilder, l: Cd110Livery): void {
  m.scope("pantographs", () => {
    m.scope("pantograph", () => singleArm(m, { xc: 0, roofY: CAB_TOP + 0.05, baseY: CAB_TOP + 0.2, h: 1, raised: true, raisedTop: 5.87, lower: 1.25, upper: 1.1 }));
  });
  if (l.acRoof)
    m.scope("main breaker", () => {
      // the 210's AC breaker and its line beside the pantograph (photographs)
      for (const x of [-0.95, -0.35]) insulator(m, x, -0.95, CAB_TOP + 0.04, 4.5);
      tubeX(m, "breaker", 0.07, -1.05, 4.56, -0.95, -0.25, 4.56, -0.95, 10);
      tubeX(m, "copper", 0.016, -0.25, 4.56, -0.95, 0.4, 4.4, -0.5, 6);
    });
}

/** The centre-cab shunter in one of its liveries (CD 110, 111, 210); the default is 110 046-0. */
export function cd110(params?: ParamValues): MeshBuilder {
  const { livery: key } = resolveParams(CD110_PARAMS, params);
  const l: Cd110Livery = CD110_LIVERIES[key as keyof typeof CD110_LIVERIES];
  const m = new MeshBuilder({ ...KIT_PALETTE, ...SHARED, ...l.palette });
  m.scope("cab", () => cab(m, l));
  for (const e of [-1, 1]) m.scope(e > 0 ? "front hood" : "rear hood", () => hood(m, e, l));
  m.scope("underframe", () => frame(m, l));
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc: e * 3.15, halfBase: 1.4, wheelR: 0.525, frameTop: 0.86 }));
  });
  m.scope("roof equipment", () => roofEquipment(m, l));
  return m;
}
