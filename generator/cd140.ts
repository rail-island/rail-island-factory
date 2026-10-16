// The Skoda 12E "bobina": CSD E 499.0 / CD 140, the first Czechoslovak series
// 3 kV DC Bo'Bo' locomotive, as unit 140 040 in its blue and light blue paint
// with the white "whiskers" on the noses. Reconstructed from the native JT7
// XML and BMPs of vlakosimdb's cd_140_040 (assets/cd-140/native) and
// photographs (assets/cd-140/*.jpg).
//
// The vlakosimdb model is 11 % too long (a 16.1 m body); its x is scaled by
// 0.9006 to the published 14.50 m body: side column px -> x = (85.5 - px) *
// 0.09006 m (the source's x flipped, so its raised pantograph is at -X), row r
// -> y = 6.0 - r / 10. 15.74 m over the buffers, 2.95 m wide, 8.17 m between
// the pivots, 3.33 m bogie wheelbase, 1.25 m wheels (assets/cd-140/SOURCES.md).

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, tubeX, type Band } from "./cd163.ts";
import {
  KIT_PALETTE, bogie, buffers, c, diamond, insulator, kinks, lerpTable, numberOn, onEnd, onSide, rect, roundRect, shell,
  surfaceDecal, surfacePanel, type ShellSpec,
} from "./czElectricKit.ts";

/** 140 040-?: the vlakosimdb model's name; the check digit by the 1988 scheme. */
export const CD140_NUMBER = runningNumber("140", "040");

const PALETTE = {
  ...KIT_PALETTE,
  blue: c("#08327a"),
  sky: c("#c0d8f0"),
  mist: c("#a8c0d8"),
  salmon: c("#d89078"),
  white: c("#f0f0f0"),
  frameBlue: c("#003060", 0.7),
  roof: { color: "#4a4b4c", roughness: 0.75 },
  roofBox: c("#5b5d5f", 0.7),
  redLine: c("#a83030"),
};

export const BODY = 14.5 / 2;
export const BUFFERS = 15.74 / 2;
const SX = 14.5 / 16.1; // the native x scale
const px = (p: number) => (85.5 - p) * 0.1 * SX;
const Y_FRAME = 0.8;
const Y_SHELL = 1.1;

// XML alongz (scaled): the end vertical to 2.3 m, raked 0.09 m to the cant, rolling into the roof
const TIP: ReadonlyArray<readonly [number, number]> = [[1.1, BODY], [2.3, BODY], [3.5, BODY - 0.09], [3.7, BODY - 0.18], [3.8, BODY - 0.27], [3.9, BODY - 0.54]];
// XML alongx: 2.95 m wide, the roof's curve to the crown at 3.9 m
const HW: ReadonlyArray<readonly [number, number]> = [[1.1, 1.475], [3.5, 1.475], [3.75, 1.4], [3.8, 1.3], [3.85, 1.0], [3.9, 0.3]];
const tipX = (y: number) => lerpTable(TIP, y);
const hw = (y: number) => lerpTable(HW, y);
/** The bowed nose of the XML plan: 0.09, 0.18 and 0.36 m back at |z| = 0.9, 1.3 and 1.5. */
const endPlan = (y: number) => {
  const w = hw(y), k = w / 1.475;
  return [[0, 0], [w * 0.35, 0.02 * k], [w * 0.61, 0.09 * k], [w * 0.8, 0.15 * k], [w * 0.88, 0.18 * k], [w * 0.95, 0.25 * k], [w, 0.36 * k]] as const;
};
const BREAKS = kinks(TIP, HW);

// Bands, native z_both rows: the stripes wrap round the corners (corner: "side")
const SIDE: Band[] = [
  [1.1, 2.2, "blue"], [2.2, 2.3, "white"], [2.3, 2.4, "salmon"], [2.4, 2.5, "mist"], [2.5, 2.8, "sky"], [2.8, 2.9, "blue"],
  [2.9, 3.1, "sky"], [3.1, 3.2, "blue"], [3.2, 3.5, "sky"], [3.5, 4.0, "blue"],
];
const END: Band[] = [[1.1, 2.2, "blue"], [2.2, 2.3, "white"], [2.3, 2.4, "salmon"], [2.4, 2.5, "mist"], [2.5, 3.5, "sky"], [3.5, 4.0, "blue"]];
const SPEC: ShellSpec = { heights: [Y_SHELL, ...BREAKS.filter((y) => y > Y_SHELL)], tip: tipX, hw, endPlan, side: SIDE, end: END, corner: "side", roof: "roof" };

// ---------------------------------------------------------------------------
// The ends (native x_both: column u -> z = 1.5 - u / 10 seen from ahead)

function cabEnd(m: MeshBuilder, e: number): void {
  const at = onEnd(SPEC, e);
  const n: Vec3 = [e, 0, 0];
  const uB = SPEC.endPlan(2).map(([z]) => z).flatMap((z) => [z, -z]);
  m.scope("windscreen", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right pane" : "left pane", () => {
        const [a, b] = side(s, 0.1, 1.22);
        m.scope("frame", () => surfacePanel(m, "rim", at, n, roundRect(a, b, 2.68, 3.42, 0.1), -0.02, 0.016, uB, BREAKS));
        m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(a + 0.1, b - 0.1, 2.78, 3.32, 0.07), -0.01, 0.024, uB, BREAKS));
        m.scope("wiper", () => surfacePanel(m, "rubber", at, n, rect(s > 0 ? a + 0.15 : b - 0.7, 2.83, s > 0 ? a + 0.7 : b - 0.15, 2.855), 0.02, 0.035, uB, BREAKS));
      });
  });
  // the white whiskers: a V from the white band down to the number plate, edged in the pale blue
  m.scope("whiskers", () => {
    m.scope("edge", () => surfacePanel(m, "mist", at, n, [[-0.94, 2.22], [0.94, 2.22], [0.15, 1.49], [-0.15, 1.49]], -0.004, 0.003, uB, BREAKS));
    m.scope("white", () => surfacePanel(m, "white", at, n, [[-0.8, 2.205], [0.8, 2.205], [0.1, 1.56], [-0.1, 1.56]], -0.004, 0.006, uB, BREAKS));
  });
  m.scope("number plate", () => {
    surfacePanel(m, "plate", at, n, rect(-0.45, 1.33, 0.45, 1.5), -0.01, 0.02, uB, BREAKS);
    numberOn(m, at, n, CD140_NUMBER, 0, 1.415, 0.1, 0.024, e > 0);
  });
  m.scope("lamps", () => {
    // the two round lamps low at the corners (XML light clips, photographs) and one over the windscreen
    for (const z of [0.95, -0.95])
      m.scope(z > 0 ? "right lamp" : "left lamp", () => {
        const x = tipX(1.55) - setback(z);
        const rim = ngon(12, 0.15, 0, z, 1.55), lens = ngon(12, 0.11, 0, z, 1.55);
        m.sweep("rim", "x", rim, e * (x - 0.02), rim, e * (x + 0.07));
        m.sweep("lampHead", "x", lens, e * (x + 0.07), lens, e * (x + 0.085));
      });
    m.scope("top lamp", () => {
      const top = ngon(12, 0.15, 0, 0, 3.66), lens = ngon(12, 0.11, 0, 0, 3.66);
      const x = tipX(3.66);
      m.sweep("rim", "x", top, e * (x - 0.05), top, e * (x + 0.1));
      m.sweep("lampHead", "x", lens, e * (x + 0.1), lens, e * (x + 0.115));
    });
  });
  m.scope("handrails", () => {
    for (const z of [-1.15, 1.15]) {
      const x = BODY - setback(z) + 0.08;
      m.prism("steel", ngon(6, 0.018, 0, e * x, z), 1.25, 2.1);
    }
  });
  m.scope("lower end", () => {
    buffers(m, e, BODY, BUFFERS, 1.0, "rect");
    m.scope("plough", () => {
      const a = e * (BODY + 0.1);
      const ring = (x0: number, w: number, back: number): Ring => (e > 0 ? [[x0, -w], [x0 - back, -w - 0.05], [x0 - back, w + 0.05], [x0, w]] : [[x0 + back, -w - 0.05], [x0, -w], [x0, w], [x0 + back, w + 0.05]]);
      m.loft("frameBlue", ring(a, 1.05, 0.22), 0.25, ring(e > 0 ? a + 0.02 : a - 0.02, 1.3, 0.3), Y_FRAME, false);
      m.cap("frameBlue", ring(a, 1.05, 0.22), 0.25, false);
      m.scope("stripe", () => block(m, "hazard", ...([e * (BODY + 0.1), e * (BODY + 0.125)].sort((p, q) => p - q) as [number, number]), 0.25, 0.32, -1.05, 1.05));
    });
  });
}
const setback = (z: number) => {
  const plan = endPlan(1.5);
  const az = Math.abs(z);
  for (let i = 1; i < plan.length; i++) if (az <= plan[i]![0]) return plan[i - 1]![1] + ((plan[i]![1] - plan[i - 1]![1]) * (az - plan[i - 1]![0])) / (plan[i]![0] - plan[i - 1]![0]);
  return plan[plan.length - 1]![1];
};

// ---------------------------------------------------------------------------
// The sides (native z_both)

const PORTHOLES = [40.5, 58.5, 76.5, 94.5, 112.5, 130.5].map(px);
const DOOR = [px(25), px(16)] as const;
const DOOR_WINDOW = [px(23.5), px(17.5)] as const;

function sides(m: MeshBuilder): void {
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      const at = onSide(SPEC, s);
      const n: Vec3 = [0, 0, s];
      m.scope("portholes", () => {
        for (const [i, x] of PORTHOLES.entries())
          m.scope(`porthole ${i + 1}`, () => {
            surfacePanel(m, "rim", at, n, ngon(16, 0.38, 0, x, 3.0), -0.01, 0.016, [], BREAKS);
            m.scope("glass", () => surfacePanel(m, "glass", at, n, ngon(16, 0.31, 0, x, 3.0), -0.005, 0.024, [], BREAKS));
          });
      });
      m.scope("red line", () => surfaceDecal(m, "redLine", at, n, [rect(px(140), 3.5, px(30), 3.56)], 0.003));
      m.scope("number plate", () => {
        surfacePanel(m, "plate", at, n, rect(0.35, 1.72, 1.2, 1.95), -0.01, 0.02, [], BREAKS);
        numberOn(m, at, n, CD140_NUMBER, 0.775, 1.835, 0.12, 0.024, s < 0);
      });
      for (const e of [-1, 1])
        m.scope(e > 0 ? "front cab" : "rear cab", () => {
          const [d0, d1] = [e * DOOR[0], e * DOOR[1]].sort((a, b) => a - b) as [number, number];
          m.scope("door", () => {
            surfaceDecal(m, "rubber", at, n, [rect(d0, 1.3, d1, 1.32), rect(d0, 3.46, d1, 3.48), rect(d0, 1.32, d0 + 0.02, 3.46), rect(d1 - 0.02, 1.32, d1, 3.46)], 0.004);
            const [w0, w1] = [e * DOOR_WINDOW[0], e * DOOR_WINDOW[1]].sort((a, b) => a - b) as [number, number];
            m.scope("window", () => {
              surfacePanel(m, "rim", at, n, roundRect(w0, w1, 2.62, 3.38, 0.05), -0.01, 0.014, [], BREAKS);
              m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(w0 + 0.05, w1 - 0.05, 2.67, 3.33, 0.04), -0.005, 0.022, [], BREAKS));
            });
          });
          m.scope("handrails", () => {
            for (const x of [e * (DOOR[0] - 0.08), e * (DOOR[1] + 0.08)]) {
              m.prism("steel", ngon(6, 0.018, 0, x, s * 1.53), 1.35, 3.1);
              for (const y of [1.35, 3.08]) block(m, "steel", x - 0.015, x + 0.015, y, y + 0.02, ...side(s, 1.46, 1.55));
            }
          });
          m.scope("steps", () => {
            const [x0, x1] = [e * (DOOR[1] + 0.02), e * (DOOR[0] - 0.02)].sort((a, b) => a - b) as [number, number];
            for (const y of [0.35, 0.65]) block(m, "steel", x0, x1, y, y + 0.04, ...side(s, 1.3, 1.46));
            for (const x of [x0, x1 - 0.04]) block(m, "steel", x, x + 0.04, 0.35, Y_FRAME + 0.02, ...side(s, 1.4, 1.46));
          });
        });
    });
}

// ---------------------------------------------------------------------------
// The roof: the long resistor box between the pantographs (XML roof clips, native y_dec)

const BOX = [px(140), px(30)] as const; // -4.9 .. 5.0 m
const UPPER = [px(116), px(55)] as const;
const PANTO_X = 3.8;
function roofEquipment(m: MeshBuilder): void {
  m.scope("resistor box", () => {
    const ring = (x0: number, x1: number, w: number): Ring => [[x1, -w], [x1, w], [x0, w], [x0, -w]];
    m.loft("roofBox", ring(BOX[0], BOX[1], 1.0), 3.8, ring(BOX[0], BOX[1], 1.0), 4.1);
    m.loft("roofBox", ring(UPPER[0], UPPER[1], 0.8), 4.1, ring(UPPER[0], UPPER[1], 0.8), 4.2);
    m.scope("slats", () => {
      // the louvred top between the pantographs (native y_dec, white slats)
      for (let i = 0; i < 15; i++) {
        const x = UPPER[0] + 0.25 + i * ((UPPER[1] - UPPER[0] - 0.5) / 14);
        block(m, "slat", x - 0.05, x + 0.05, 4.19, 4.23, -0.6, 0.6);
      }
    });
  });
  m.scope("pantographs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => diamond(m, { xc: e * PANTO_X, roofY: 4.1, baseY: 4.34, raised: e < 0, raisedTop: 5.87 }));
  });
  m.scope("high voltage line", () => {
    for (const e of [-1, 1]) {
      insulator(m, e * 2.6, 0.9, 4.1, 4.3);
      tubeX(m, "copper", 0.018, e * 2.6, 4.32, 0.9, e * (PANTO_X - 0.6), 4.32, 0.9, 6);
    }
    tubeX(m, "copper", 0.018, -2.6, 4.32, 0.9, 2.6, 4.32, 0.9, 6);
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const r: Ring = [[BODY, -1.2], [BODY - 0.25, -1.45], [-BODY + 0.25, -1.45], [-BODY, -1.2], [-BODY, 1.2], [-BODY + 0.25, 1.45], [BODY - 0.25, 1.45], [BODY, 1.2]];
    m.prism("frameBlue", r, Y_FRAME, Y_SHELL, false);
    m.cap("underframe", r, Y_FRAME, false);
  });
  m.scope("equipment", () => {
    // the compressor box and the air reservoirs between the bogies (XML pod clips)
    block(m, "underframe", px(96), px(75), 0.35, Y_FRAME, -1.0, 1.0);
    for (const z of [-0.7, 0.7]) {
      const q = ngon(12, 0.18, 0, z, 0.55);
      m.sweep("steel", "x", q, -1.5, q, -0.95);
    }
  });
}

/** CD 140 040, the Skoda 12E "bobina" in blue and light blue. */
export function cd140(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => {
    m.scope("shell", () => shell(m, SPEC));
    underframe(m);
  });
  m.scope("sides", () => sides(m));
  for (const e of [-1, 1]) m.scope(e > 0 ? "front cab" : "rear cab", () => cabEnd(m, e));
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc: e * 4.085, halfBase: 1.665, wheelR: 0.625, frameTop: 0.8 }));
  });
  m.scope("roof equipment", () => roofEquipment(m));
  return m;
}
