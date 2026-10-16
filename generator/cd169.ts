// The Skoda 85E "Asynchron": CSD E 499.5 / CD 169 001, the 1987 prototype of a
// 3 kV DC Bo'Bo' locomotive with asynchronous traction motors, in its red
// paint with the white-blue-white stripe. One unit was built, so the design
// has no parameters. Reconstructed from the native JT7 XML and BMPs of
// vlakosimdb's cd_169 (assets/cd-169/native) and photographs of the preserved
// shell (assets/cd-169/*.jpg).
//
// The vlakosimdb body is 17.2 m long; its x is scaled by 0.971 to the
// published 16.70 m: side column px -> x = (90 - px) * 0.0971 m (the source's x
// flipped, so its raised "zadni" pantograph is at -X), row r -> y = 6.0 - r /
// 10. 18.00 m over the buffers, 2.94 m wide, 8.70 m between the pivots, 2.50 m
// bogie wheelbase, 1.25 m wheels (assets/cd-169/SOURCES.md).

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, tubeX, type Band } from "./cd163.ts";
import {
  KIT_PALETTE, bogie, buffers, c, insulator, kinks, lerpTable, numberOn, onEnd, onSide, rect, roundRect, shell, singleArm,
  surfaceDecal, surfacePanel, type ShellSpec,
} from "./czElectricKit.ts";

/** 169 001-4, the only unit. */
export const CD169_NUMBER = runningNumber("169", "001");

const PALETTE = {
  ...KIT_PALETTE,
  red: c("#cf1410"),
  rib: c("#e8403a"),
  bumper: c("#2a2a2c", 0.7),
  stripeWhite: c("#d6d6d6"),
  stripeBlue: c("#1020b0"),
  roof: { color: "#5e6062", roughness: 0.75 },
  grille: c("#3a3c3e", 0.8),
};

export const BODY = 16.7 / 2;
export const BUFFERS = 18.0 / 2;
const SX = 16.7 / 17.2;
const px = (p: number) => (90 - p) * 0.1 * SX;
const Y_SHELL = 0.8;
// XML alongz: the skirt 0.1 m in below 1.3 m, the buffer band vertical to 1.9 m,
// the long raked windscreen 1.0 m back by 3.7 m, the roof's leading edge
const TIP: ReadonlyArray<readonly [number, number]> = [[0.8, BODY - 0.1], [1.3, BODY - 0.1], [1.5, BODY], [1.9, BODY], [3.7, BODY - 0.97], [3.9, BODY - 1.36]];
// XML alongx: 2.94 m wide, the roof edge chamfered from 3.5 m
const HW: ReadonlyArray<readonly [number, number]> = [[0.8, 1.47], [3.5, 1.47], [3.7, 1.37], [3.9, 1.17]];
const tipX = (y: number) => lerpTable(TIP, y);
const hw = (y: number) => lerpTable(HW, y);
/** XML alongy: a flat face with 0.2 m corner chamfers. */
const endPlan = (y: number) => {
  const w = hw(y);
  return [[0, 0], [w - 0.2, 0], [w, 0.2]] as const;
};
const BREAKS = kinks(TIP, HW);
const SIDE: Band[] = [[0.8, 4.0, "red"]];
const END: Band[] = [[0.8, 1.5, "red"], [1.5, 1.9, "bumper"], [1.9, 4.0, "red"]];
const SPEC: ShellSpec = { heights: [Y_SHELL, ...BREAKS.filter((y) => y > Y_SHELL)], tip: tipX, hw, endPlan, side: SIDE, end: END, corner: "end", roof: "roof", bottom: "underframe" };

// ---------------------------------------------------------------------------
// The ends (native x_both: column u -> z = 1.5 - u / 10 seen from ahead)

function cabEnd(m: MeshBuilder, e: number): void {
  const at = onEnd(SPEC, e);
  const n: Vec3 = [e, 0, 0];
  const uB = [-1.27, 1.27];
  m.scope("windscreen", () => {
    // the native rows 26-34 on the raked face, two panes about a narrow pillar
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right pane" : "left pane", () => {
        const [a, b] = side(s, 0.06, 1.27);
        m.scope("rubber", () => surfacePanel(m, "rubber", at, n, roundRect(a, b, 2.55, 3.45, 0.08), -0.02, 0.016, uB, BREAKS));
        m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(a + 0.05, b - 0.05, 2.6, 3.4, 0.06), -0.01, 0.024, uB, BREAKS));
        m.scope("wiper", () => surfacePanel(m, "rubber", at, n, rect(s > 0 ? a + 0.15 : b - 0.75, 2.66, s > 0 ? a + 0.75 : b - 0.15, 2.685), 0.02, 0.035, uB, BREAKS));
      });
  });
  m.scope("roof vent", () => surfacePanel(m, "grille", at, n, roundRect(-0.5, 0.5, 3.6, 3.88, 0.03), -0.01, 0.02, uB, BREAKS));
  // the twin headlight under the windscreen (native rows 35-38) and the number
  // plate in the dark band between the lamps (photographs of 169 001-5)
  m.scope("headlight", () => {
    surfacePanel(m, "rim", at, n, roundRect(-0.32, 0.32, 2.1, 2.5, 0.05), -0.01, 0.03, uB, BREAKS);
    for (const z of [-0.14, 0.14]) m.scope("lens", () => surfacePanel(m, "lampHead", at, n, ngon(12, 0.1, 0, z, 2.3), -0.005, 0.04, uB, BREAKS));
  });
  m.scope("number plate", () => {
    surfacePanel(m, "plate", at, n, rect(-0.5, 1.6, 0.5, 1.8), -0.01, 0.02, uB, BREAKS);
    numberOn(m, at, n, CD169_NUMBER, 0, 1.7, 0.11, 0.024, e > 0);
  });
  m.scope("lamps", () => {
    // four round lamps in the dark buffer band: red outside, white inside
    for (const [i, [z, mat]] of ([[1.22, "lampRed"], [0.92, "lampHead"], [-0.92, "lampHead"], [-1.22, "lampRed"]] as const).entries()) m.scope(`lamp ${i + 1}`, () => {
      const rim = ngon(12, 0.12, 0, z, 1.7), lens = ngon(12, 0.09, 0, z, 1.7);
      m.sweep("rim", "x", rim, e * (BODY - 0.02), rim, e * (BODY + 0.04));
      m.sweep(mat, "x", lens, e * (BODY + 0.04), lens, e * (BODY + 0.055));
    });
  });
  m.scope("lower end", () => {
    buffers(m, e, BODY - 0.1, BUFFERS, 1.03, "rect");
    m.scope("plough", () => {
      const a = e * (BODY - 0.05);
      const ring = (x0: number, w: number, back: number): Ring => (e > 0 ? [[x0, -w], [x0 - back, -w - 0.05], [x0 - back, w + 0.05], [x0, w]] : [[x0 + back, -w - 0.05], [x0, -w], [x0, w], [x0 + back, w + 0.05]]);
      m.loft("red", ring(a, 1.15, 0.25), 0.25, ring(e > 0 ? a + 0.05 : a - 0.05, 1.35, 0.35), Y_SHELL + 0.01, false);
      m.cap("red", ring(a, 1.15, 0.25), 0.25, false);
    });
  });
}

// ---------------------------------------------------------------------------
// The sides (native z_both)

const RIBBED: ReadonlyArray<readonly [number, number]> = [[px(151), px(115)], [px(113), px(67)], [px(65), px(28)]];
const GRILLES = RIBBED;
const DOOR = [px(24.5), px(16.5)] as const;

function sides(m: MeshBuilder): void {
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      const at = onSide(SPEC, s);
      const n: Vec3 = [0, 0, s];
      m.scope("ribs", () => {
        const ribs: Ring[] = [];
        for (const [x0, x1] of RIBBED) for (let y = 2.08; y < 3.3; y += 0.2) ribs.push(rect(x0, y, x1, y + 0.09));
        for (const [i, r] of ribs.entries()) m.scope(`rib ${i + 1}`, () => surfacePanel(m, "rib", at, n, r, -0.004, 0.012));
      });
      m.scope("roof grilles", () => {
        for (const [i, [x0, x1]] of GRILLES.entries()) m.scope(`grille ${i + 1}`, () => surfacePanel(m, "grille", at, n, rect(x0, 3.41, x1, 3.89), -0.01, 0.012, [], BREAKS));
      });
      m.scope("stripe", () => {
        m.scope("white", () => surfaceDecal(m, "stripeWhite", at, n, [rect(px(151), 1.5, px(25), 1.9)], 0.003));
        m.scope("blue", () => surfaceDecal(m, "stripeBlue", at, n, [rect(px(151), 1.6, px(25), 1.8)], 0.006));
        for (const e of [-1, 1]) {
          const [x0, x1] = [e * 7.0, e * (BODY - 0.2)].sort((a, b) => a - b) as [number, number];
          m.scope("bumper", () => surfaceDecal(m, "bumper", at, n, [rect(x0, 1.5, x1, 1.9)], 0.003));
        }
      });
      m.scope("number plate", () => {
        surfacePanel(m, "plate", at, n, rect(-0.49, 2.0, 0.58, 2.3), -0.01, 0.024, [], BREAKS);
        numberOn(m, at, n, CD169_NUMBER, 0.045, 2.15, 0.13, 0.028, s < 0);
      });
      // one door each side, diagonally across (native z_both: the door at one end, a window and the maker's roundel at the other)
      const e = s;
      m.scope("door", () => {
        const [d0, d1] = [e * DOOR[0], e * DOOR[1]].sort((a, b) => a - b) as [number, number];
        surfaceDecal(m, "rubber", at, n, [rect(d0, 1.25, d1, 1.27), rect(d0, 3.2, d1, 3.22), rect(d0, 1.27, d0 + 0.02, 3.2), rect(d1 - 0.02, 1.27, d1, 3.2)], 0.004);
        m.scope("window", () => {
          surfacePanel(m, "rim", at, n, roundRect(d0 + 0.1, d1 - 0.1, 2.55, 3.18, 0.04), -0.01, 0.014, [], BREAKS);
          m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(d0 + 0.14, d1 - 0.14, 2.59, 3.14, 0.03), -0.005, 0.022, [], BREAKS));
        });
      });
      m.scope("door handrails", () => {
        const [d0, d1] = [e * DOOR[0], e * DOOR[1]].sort((a, b) => a - b) as [number, number];
        for (const x of [d0 - 0.06, d1 + 0.06]) m.prism("steel", ngon(6, 0.018, 0, x, s * 1.52), 1.1, 3.0);
        for (const y of [0.35, 0.6]) block(m, "steel", d0 + 0.02, d1 - 0.02, y, y + 0.04, ...side(s, 1.3, 1.46));
      });
      m.scope("cab window", () => {
        const [w0, w1] = [e * px(160), e * px(156)].sort((a, b) => a - b) as [number, number];
        surfacePanel(m, "rim", at, n, roundRect(w0, w1, 2.65, 3.25, 0.05), -0.01, 0.014, [], BREAKS);
        m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(w0 + 0.04, w1 - 0.04, 2.69, 3.21, 0.04), -0.005, 0.022, [], BREAKS));
      });
      m.scope("roundel", () => surfacePanel(m, "white", at, n, ngon(14, 0.36, 0, e * px(166), 2.85), -0.005, 0.01, [], BREAKS));
    });
}

// ---------------------------------------------------------------------------
// Roof (XML roof clip 6.9..11.1 m, native y_dec) and running gear

const PANTO_X = 4.05;
function roofEquipment(m: MeshBuilder): void {
  m.scope("roof cover", () => {
    const X = 2.04;
    const ring = (w: number): Ring => [[X, -w], [X, w], [-X, w], [-X, -w]];
    m.loft("roof", ring(1.15), 3.89, ring(0.8), 4.3);
    for (const s of [-1, 1]) m.scope(s > 0 ? "right vent" : "left vent", () => block(m, "grille", -1.7, 1.7, 3.95, 4.2, ...side(s, 0.98, 1.06)));
  });
  m.scope("pantographs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => singleArm(m, { xc: e * PANTO_X, roofY: 3.9, baseY: 4.05, h: -e, raised: e < 0, raisedTop: 5.87 }));
  });
  m.scope("high voltage line", () => {
    for (const e of [-1, 1]) {
      insulator(m, e * 2.6, 0.5, 3.89, 4.15);
      tubeX(m, "copper", 0.018, e * 2.6, 4.17, 0.5, e * (PANTO_X - 0.6), 4.17, 0.5, 6);
      tubeX(m, "copper", 0.018, e * 2.6, 4.17, 0.5, e * 2.04, 4.25, 0.5, 6);
    }
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("equipment", () => {
    // the converter's box between the bogies (XML base clip 7.8..9.6 m, 0.3..0.9 m)
    block(m, "underframe", px(96), px(78), 0.3, Y_SHELL + 0.01, -1.1, 1.1);
    for (const z of [-0.75, 0.75]) {
      const q = ngon(12, 0.18, 0, z, 0.55);
      m.sweep("steel", "x", q, 1.2, q, 2.2);
    }
  });
}

/** CD 169 001, the Skoda 85E prototype. */
export function cd169(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => {
    m.scope("shell", () => shell(m, SPEC));
    underframe(m);
  });
  m.scope("sides", () => sides(m));
  for (const e of [-1, 1]) m.scope(e > 0 ? "front cab" : "rear cab", () => cabEnd(m, e));
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc: e * 4.35, halfBase: 1.25, wheelR: 0.625, frameTop: 0.76 }));
  });
  m.scope("roof equipment", () => roofEquipment(m));
  return m;
}
