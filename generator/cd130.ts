// The Skoda 57E / 79E box-cab 3 kV DC locomotives CSD E 469.3 / CD 123 and
// E 479.0 / CD 130 as one design with a `livery` parameter: the 123 rides on
// bogies with a 3.33 m wheelbase and carries diamond pantographs, the 130 on
// 3.20 m bogies with single-arm ones; body, cabs and roof are shared.
// Reconstructed from the native JT7 XML and BMPs of three vlakosimdb models
// (assets/cd-130/native) and photographs (assets/cd-130/*.jpg).
//
// Native coordinates: the side BMPs are 0.1 m a pixel, column px -> x =
// (79.5 - px) / 10 (the source's x flipped, so its raised "zadni" pantograph is
// at -X, the repository's rear), row r -> y = 6.0 - r / 10 (cd_130, cd_123) or
// 5.0 - r / 10 (cd_123-019-2). 17.21 m over the buffers, a 15.97 m body, 2.94 m
// wide, 8.17 m between the pivots, 1.25 m wheels (assets/cd-130/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { runningNumber, tubeX, type Band } from "./cd163.ts";
import {
  KIT_PALETTE, bogie, buffers, c, diamond, insulator, kinks, lerpTable, numberOn, onEnd, onSide, rect, roundRect, shell, singleArm,
  surfaceDecal, surfacePanel, type ShellSpec,
} from "./czElectricKit.ts";
import { czShellLod, locoLod, screen, sideWindows } from "./lodLocos.ts";

export interface Cd130Livery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/electric. */
  source: string;
  number: string;
  numberSource: string;
  palette: Record<string, MaterialSpec>;
  /** Bands from the frame's top (1.2 m) up, on the sides and on the ends. */
  side: readonly Band[];
  end: readonly Band[];
  /** The frame from 0.85 to 1.2 m. */
  frame: string;
  plough: string;
  /** The 123's diamond pantographs or the 130's single-arm ones. */
  pantograph: "diamond" | "singleArm";
  /** Half the bogie wheelbase: 1.665 m on the 123, 1.60 m on the 130. */
  halfBase: number;
}

const ROOF: Band = [3.5, 4.5, "roof"];
export const CD130_LIVERIES = {
  cd130: {
    title: "CD 130",
    source: "cd_130",
    number: runningNumber("130", "036"),
    numberSource: "130 036-7, photographed in this livery (photo-130-036-front.jpg)",
    palette: { green: c("#1d4a33"), cream: c("#ece8cf"), yellow: c("#e8ab1c") },
    side: [[1.2, 2.3, "green"], [2.3, 3.5, "cream"], ROOF],
    end: [[1.2, 1.5, "yellow"], [1.5, 2.3, "green"], [2.3, 3.5, "cream"], ROOF],
    frame: "green",
    plough: "green",
    pantograph: "singleArm",
    halfBase: 1.6,
  },
  cd123: {
    title: "CD 123",
    source: "cd_123",
    number: runningNumber("123", "008"),
    numberSource: "illustrative, a unit of the class (photographed as 123 008 in Praha-Smichov); the native plate does not resolve digits",
    palette: { green: c("#11512d"), pale: c("#bcd6bc"), yellow: c("#d4c624"), frameGrey: c("#7c7a7c", 0.7) },
    side: [[1.2, 1.4, "frameGrey"], [1.4, 1.5, "yellow"], [1.5, 2.3, "green"], [2.3, 2.5, "yellow"], [2.5, 3.5, "pale"], ROOF],
    end: [[1.2, 1.4, "frameGrey"], [1.4, 1.5, "yellow"], [1.5, 2.3, "green"], [2.3, 2.5, "yellow"], [2.5, 3.5, "pale"], ROOF],
    frame: "frameGrey",
    plough: "frameGrey",
    pantograph: "diamond",
    halfBase: 1.665,
  },
  cd123No019: {
    title: "CD 123 019",
    source: "cd_123-019-2",
    number: runningNumber("123", "019"),
    numberSource: "the vlakosimdb model's name",
    palette: { green: c("#0a5520"), light: c("#14a650"), salmon: c("#f0a8a4"), mist: c("#ccd9d2") },
    side: [[1.2, 1.3, "green"], [1.3, 1.4, "mist"], [1.4, 2.3, "green"], [2.3, 2.4, "salmon"], [2.4, 3.6, "light"], [3.6, 4.5, "roof"]],
    end: [[1.2, 1.3, "green"], [1.3, 1.4, "mist"], [1.4, 2.3, "green"], [2.3, 2.4, "salmon"], [2.4, 3.6, "light"], [3.6, 4.5, "roof"]],
    frame: "green",
    plough: "hazard",
    pantograph: "diamond",
    halfBase: 1.665,
  },
} as const satisfies Record<string, Cd130Livery>;

export const CD130_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd130",
  values: Object.entries(CD130_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];
export const CD130_NUMBER = CD130_LIVERIES.cd130.number;

// ---------------------------------------------------------------------------
// The body's profiles (XML alongx / alongy / alongz of cd_130 and cd_123-019-2)

export const BODY = 15.97 / 2; // the end walls
export const BUFFERS = 17.21 / 2; // the buffer heads' faces
const Y_FRAME = 0.85;
const Y_SHELL = 1.2;
const CROWN = 4.1;
// the end's centre line: vertical to 2.5 m, the windscreen raked back 0.15 m, the roof rolling over
const TIP: ReadonlyArray<readonly [number, number]> = [[1.2, BODY], [2.5, BODY], [3.5, BODY - 0.15], [3.7, BODY - 0.23], [3.85, BODY - 0.36], [3.98, BODY - 0.62], [4.1, BODY - 1.05]];
// half the width: 2.94 m up to the cant, the roof's curve to a 1.0 m flat crown
const HW: ReadonlyArray<readonly [number, number]> = [[1.2, 1.47], [3.5, 1.47], [3.7, 1.38], [3.85, 1.22], [3.98, 0.95], [4.1, 0.5]];
const tipX = (y: number) => lerpTable(TIP, y);
const hw = (y: number) => lerpTable(HW, y);
/** The end's plan: nearly flat over the middle, the corners rounded 0.45 m back (XML alongy). */
const endPlan = (y: number) => {
  const w = hw(y);
  return [[0, 0], [w * 0.55, 0.02], [w * 0.8, 0.08], [w * 0.92, 0.18], [w * 0.98, 0.3], [w, 0.45]] as const;
};
const BREAKS = kinks(TIP, HW);

function shellSpec(l: Cd130Livery): ShellSpec {
  return { heights: [Y_SHELL, ...BREAKS.filter((y) => y > Y_SHELL)], tip: tipX, hw, endPlan, side: l.side, end: l.end, corner: "end", roof: "roof" };
}

// ---------------------------------------------------------------------------
// The ends (native x_both: column u -> z = 1.5 - u / 10 seen from ahead)

function cabEnd(m: MeshBuilder, sp: ShellSpec, e: number, l: Cd130Livery): void {
  const at = onEnd(sp, e);
  const n: Vec3 = [e, 0, 0];
  const uB = sp.endPlan(3).map(([z]) => z).flatMap((z) => [z, -z]);
  m.scope("windscreen", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right pane" : "left pane", () => {
        const [a, b] = side(s, 0.24, 1.42);
        m.scope("rubber", () => surfacePanel(m, "rubber", at, n, roundRect(a, b, 2.62, 3.42, 0.08), -0.02, 0.016, uB, BREAKS));
        m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(a + 0.04, b - 0.04, 2.67, 3.37, 0.06), -0.01, 0.024, uB, BREAKS));
        // a wiper parked along the pane's lower edge
        m.scope("wiper", () => surfacePanel(m, "rubber", at, n, rect(s > 0 ? a + 0.15 : b - 0.75, 2.72, s > 0 ? a + 0.75 : b - 0.15, 2.745), 0.02, 0.035, uB, BREAKS));
      });
  });
  // the round headlight housing on the roof's leading edge (native rows 20-24, photographs)
  m.scope("headlight", () => {
    const Y = 3.78, R = 0.25; // photographs: a round housing 0.5 m across
    const x0 = tipX(3.95) - 0.3, x1 = tipX(Y) + 0.06;
    const q = ngon(14, R, 0, 0, Y);
    m.scope("housing", () => m.sweep("roof", "x", q, e * x0, q, e * x1));
    const lens = ngon(14, R * 0.72, 0, 0, Y);
    m.scope("lens", () => m.sweep("lampHead", "x", lens, e * (x1 - 0.01), lens, e * (x1 + 0.015)));
  });
  m.scope("lamps", () => {
    for (const [i, [z, mat, r]] of ([[0.9, "lampHead", 0.075], [0.6, "lampHead", 0.075], [0.25, "lampRed", 0.05], [-0.25, "lampRed", 0.05], [-0.6, "lampHead", 0.075], [-0.9, "lampHead", 0.075]] as const).entries()) m.scope(`lamp ${i + 1}`, () => {
      const rim = ngon(10, r + 0.025, 0, z, 2.1), lens = ngon(10, r, 0, z, 2.1);
      m.sweep("steel", "x", rim, e * (BODY - 0.01), rim, e * (BODY + 0.05));
      m.sweep(mat, "x", lens, e * (BODY + 0.05), lens, e * (BODY + 0.065));
    });
  });
  m.scope("number plate", () => {
    surfacePanel(m, "plate", at, n, rect(-0.45, 2.22, 0.45, 2.4), -0.01, 0.02, uB, BREAKS);
    // seen from ahead, +z is on the left: the number reads toward -z at the front
    numberOn(m, at, n, l.number, 0, 2.31, 0.11, 0.024, e > 0);
  });
  m.scope("handrails", () => {
    for (const z of [-1.25, 1.25]) {
      const y0 = 1.35, y1 = 2.25;
      m.prism("steel", ngon(6, 0.018, 0, e * (BODY + 0.08), z), y0, y1);
      for (const y of [y0, y1 - 0.02]) block(m, "steel", ...([e * BODY, e * (BODY + 0.1)].sort((a, b) => a - b) as [number, number]), y, y + 0.02, z - 0.015, z + 0.015);
    }
  });
  m.scope("lower end", () => {
    buffers(m, e, BODY, BUFFERS);
    // the plough under the buffer beam, its blades raked back to the sides
    m.scope("plough", () => {
      const a = e * (BODY + 0.12);
      const ring = (x0: number, w: number, back: number): Ring => (e > 0 ? [[x0, -w], [x0 - back, -w - 0.05], [x0 - back, w + 0.05], [x0, w]] : [[x0 + back, -w - 0.05], [x0, -w], [x0, w], [x0 + back, w + 0.05]]);
      m.loft(l.plough, ring(a, 1.1, 0.25), 0.3, ring(e > 0 ? a + 0.02 : a - 0.02, 1.35, 0.3), Y_FRAME, false);
      m.cap(l.plough, ring(a, 1.1, 0.25), 0.3, false);
    });
  });
}

// ---------------------------------------------------------------------------
// The sides (native z_both)

const px = (p: number) => (79.5 - p) / 10;
// the machine room's four windows: outer frame [x0, x1, y0, y1]
const WINDOWS: ReadonlyArray<readonly [number, number, number, number]> = [
  [px(48), px(38), 2.5, 3.3], [px(73), px(63), 2.5, 3.0], [px(97), px(87), 2.5, 3.0], [px(122), px(112), 2.5, 3.3],
];
const DOOR = [px(18.5), px(10.5)] as const; // 6.10 to 6.90 m
const DOOR_WINDOW = [px(18), px(12), 2.6, 3.4] as const;

function sides(m: MeshBuilder, sp: ShellSpec, l: Cd130Livery): void {
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      const at = onSide(sp, s);
      const n: Vec3 = [0, 0, s];
      m.scope("windows", () => {
        for (const [i, [x0, x1, y0, y1]] of WINDOWS.entries())
          m.scope(`window ${i + 1}`, () => {
            surfacePanel(m, "rim", at, n, roundRect(x0, x1, y0, y1, 0.05), -0.01, 0.014, [], BREAKS);
            m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, 0.04), -0.005, 0.022, [], BREAKS));
          });
      });
      m.scope("number plate", () => {
        surfacePanel(m, "plate", at, n, rect(-0.55, 1.6, 0.35, 1.9), -0.01, 0.02, [], BREAKS);
        numberOn(m, at, n, l.number, -0.1, 1.75, 0.13, 0.024, s < 0);
      });
      for (const e of [-1, 1])
        m.scope(e > 0 ? "front cab" : "rear cab", () => {
          const [d0, d1] = [e * DOOR[0], e * DOOR[1]].sort((a, b) => a - b) as [number, number];
          m.scope("door", () => {
            surfaceDecal(m, "rubber", at, n, [rect(d0, 1.25, d1, 1.27), rect(d0, 3.43, d1, 3.45), rect(d0, 1.27, d0 + 0.02, 3.43), rect(d1 - 0.02, 1.27, d1, 3.43)], 0.004);
            const [w0, w1] = [e * DOOR_WINDOW[0], e * DOOR_WINDOW[1]].sort((a, b) => a - b) as [number, number];
            m.scope("window", () => {
              surfacePanel(m, "rim", at, n, roundRect(w0, w1, DOOR_WINDOW[2], DOOR_WINDOW[3], 0.04), -0.01, 0.014, [], BREAKS);
              m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(w0 + 0.04, w1 - 0.04, DOOR_WINDOW[2] + 0.04, DOOR_WINDOW[3] - 0.04, 0.03), -0.005, 0.022, [], BREAKS));
            });
          });
          m.scope("handrails", () => {
            for (const x of [e * (DOOR[0] - 0.06), e * (DOOR[1] + 0.06)]) {
              const z = s * (1.47 + 0.05);
              m.prism("steel", ngon(6, 0.018, 0, x, z), 1.35, 3.2);
              for (const y of [1.35, 3.18]) block(m, "steel", x - 0.015, x + 0.015, y, y + 0.02, ...side(s, 1.46, 1.54));
            }
          });
          m.scope("steps", () => {
            const [x0, x1] = [e * 6.2, e * 6.8].sort((a, b) => a - b) as [number, number];
            for (const y of [0.35, 0.65]) block(m, "steel", x0, x1, y, y + 0.04, ...side(s, 1.3, 1.46));
            for (const x of [x0, x1 - 0.04]) block(m, "steel", x, x + 0.04, 0.35, Y_FRAME + 0.02, ...side(s, 1.4, 1.46));
          });
        });
    });
}

// ---------------------------------------------------------------------------
// Roof (native y_dec, XML roof clip) and running gear

const HUMP = 2.4; // the raised middle of the roof, native columns 55..103
const PANTO_X = 4.75;
function roofEquipment(m: MeshBuilder, l: Cd130Livery): void {
  m.scope("roof hump", () => {
    // sloped louvred sides up to a flat top at 4.4 m (XML roof clip, photographs)
    const ring = (w: number): Ring => [[HUMP, -w], [HUMP, w], [-HUMP, w], [-HUMP, -w]];
    m.loft("roof", ring(1.25), 3.85, ring(0.85), 4.4);
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right louvres" : "left louvres", () => {
        // slats on the slope: the slope runs from (1.25, 3.85) to (0.85, 4.4)
        const at = (x: number, t: number, d: number): Vec3 => {
          const z = 1.25 - 0.4 * t, y = 3.85 + 0.55 * t;
          const k = Math.hypot(0.4, 0.55);
          return [x, y + (d * 0.4) / k, s * (z + (d * 0.55) / k)];
        };
        const slats: Ring[] = [];
        for (const [a, b] of [[-2.1, -0.15], [0.15, 2.1]] as const)
          for (let x = a; x < b - 0.05; x += 0.15) slats.push(rect(x, 0.35, x + 0.07, 0.85));
        surfacePanel(m, "louvre", at, [0, 0.55, s * 0.4], rect(-2.15, 0.3, -0.1, 0.9), -0.005, 0.006);
        surfacePanel(m, "louvre", at, [0, 0.55, s * 0.4], rect(0.1, 0.3, 2.15, 0.9), -0.005, 0.006);
        surfaceDecal(m, "slat", at, [0, 0.55, s * 0.4], slats, 0.012);
      });
  });
  m.scope("pantographs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => {
        if (l.pantograph === "diamond") diamond(m, { xc: e * PANTO_X, roofY: CROWN, baseY: 4.36, raised: e < 0, raisedTop: 5.87 });
        else singleArm(m, { xc: e * PANTO_X, roofY: CROWN, baseY: 4.22, h: -e, raised: e < 0, raisedTop: 5.87 });
      });
  });
  m.scope("high voltage line", () => {
    for (const e of [-1, 1]) {
      insulator(m, e * 3.0, 0.45, CROWN - 0.01, 4.32);
      tubeX(m, "copper", 0.018, e * 3.0, 4.34, 0.45, e * (PANTO_X - 0.6), 4.34, 0.45, 6);
      tubeX(m, "copper", 0.018, e * 2.5, 4.42, 0.45, e * 3.0, 4.34, 0.45, 6);
    }
  });
}

function underframe(m: MeshBuilder, l: Cd130Livery): void {
  m.scope("frame", () => {
    const r: Ring = [[BODY, -1.3], [BODY - 0.2, -1.47], [-BODY + 0.2, -1.47], [-BODY, -1.3], [-BODY, 1.3], [-BODY + 0.2, 1.47], [BODY - 0.2, 1.47], [BODY, 1.3]];
    m.prism(l.frame, r, Y_FRAME, Y_SHELL, false);
    m.cap("underframe", r, Y_FRAME, false);
  });
  m.scope("equipment", () => {
    // the air reservoirs and the battery box between the bogies (XML rel, sand clips)
    for (const z of [-0.65, 0.65]) {
      const q = ngon(12, 0.2, 0, z, 0.6);
      m.sweep("steel", "x", q, -1.6, q, 0.2);
    }
    block(m, "underframe", 0.4, 1.6, 0.4, Y_FRAME, -1.1, 1.1);
  });
}

/** The Skoda 57E / 79E in one of its liveries (CD 130, 123, 123 019); the default is 130 036-7. */
export function cd130(params?: ParamValues): MeshBuilder {
  const { livery: key } = resolveParams(CD130_PARAMS, params);
  const l: Cd130Livery = CD130_LIVERIES[key as keyof typeof CD130_LIVERIES];
  const m = new MeshBuilder({ ...KIT_PALETTE, ...l.palette });
  const sp = shellSpec(l);
  m.scope("body", () => {
    m.scope("shell", () => shell(m, sp));
    underframe(m, l);
  });
  m.scope("sides", () => sides(m, sp, l));
  for (const e of [-1, 1]) m.scope(e > 0 ? "front cab" : "rear cab", () => cabEnd(m, sp, e, l));
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc: e * 4.085, halfBase: l.halfBase, wheelR: 0.625, frameTop: 0.86 }));
  });
  m.scope("roof equipment", () => roofEquipment(m, l));
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md, lodLocos.ts). */
export function cd130Lod(params?: ParamValues, budget = 100): MeshBuilder {
  const { livery: key } = resolveParams(CD130_PARAMS, params);
  const l: Cd130Livery = CD130_LIVERIES[key as keyof typeof CD130_LIVERIES];
  const shell = czShellLod(shellSpec(l), {
    endWindows: screen(0.24, 1.42, 2.62, 3.42),
    sideWindows: [
      ...sideWindows(WINDOWS.map(([x0, x1, y0, y1]) => ({ u: [x0, x1] as const, y: [y0, y1] as const }))),
      ...sideWindows([{ u: [DOOR_WINDOW[0], DOOR_WINDOW[1]], y: [DOOR_WINDOW[2], DOOR_WINDOW[3]] }], 0, true),
    ],
  });
  return locoLod({
    palette: { ...KIT_PALETTE, ...l.palette },
    shells: [shell],
    boxes: [
      { name: "frame", mat: l.frame, x: [-BODY, BODY], y: [Y_FRAME, Y_SHELL], w: 1.47, top: false, optional: 40 },
      { name: "roof hump", mat: "roof", x: [-HUMP, HUMP], y: [3.85, 4.4], w: [1.25, 0.85] },
    ],
    gear: [-1, 1].map((e) => ({ xc: e * 4.085, half: l.halfBase + 0.625 + 0.2, top: Y_FRAME })),
    pantographs: { x: PANTO_X, pair: true, roofY: CROWN, baseY: l.pantograph === "diamond" ? 4.36 : 4.22 },
  }, budget);
}
