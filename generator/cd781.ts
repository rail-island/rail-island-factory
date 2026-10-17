// The Luhansk M62 Co'Co' diesel-electric locomotive as CSD T 679.1 / CD 781
// "Sergej" ("Taigatrommel"): one design with a `livery` parameter for the two
// vlakosimdb models cd_781 and cd_781_462. Reconstructed from their native JT7
// XML and BMPs (assets/cd-781/native) and photographs (assets/cd-781/*.jpg).
//
// Source coordinates: x along the body from the side BMP's left edge (the body
// spans 0.5 .. 17.1 of an 18 m canvas), y up, z across; Factory X = x - 8.8.
// 17.55 m over the buffers, 2.95 m wide, 8.6 m between the bogie pivots, 2 x 2.1 m
// bogie wheelbase, 1.05 m wheels (published; assets/cd-781/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { runningNumber } from "./cd163.ts";
import {
  DIESEL_PALETTE, along, block, bogie, buffers, coupling, endPanel, endWindscreen, exhaust, faceLamp, facePlate, horn, lerpTable,
  paint, planBody, plough, rect, side, sideDecal, sideGrille, sideHandrail, sidePlate, sideWindow, tankX,
  type Band, type BogieSpec, type PlanBody, type Wall,
} from "./dieselParts.ts";

export interface Cd781Livery {
  title: string;
  source: string;
  number: string;
  numberSource: string;
  palette: Record<string, MaterialSpec>;
  face: readonly Band[];
  side: readonly Band[];
  cab: readonly Band[];
  /** A painted sweep on the cab sides, rising from the band to the nose: [x from the end, y] outline. */
  sweep?: { mat: string; outline: ReadonlyArray<readonly [number, number]> };
  frame: string;
  plough: string;
  roof: string;
}

const C = (hex: string) => paint(hex);

export const CD781_LIVERIES = {
  cd781: {
    title: "CD 781",
    source: "cd_781",
    number: runningNumber("781", "529"),
    numberSource: "781 529-3, photographed in red (photo-781-529-side.jpg); the native plate does not resolve digits",
    palette: { red: C("#9c1821"), yellow: C("#d6ce29"), silver: C("#c6c6ad"), roofGrey: C("#9a9a88"), darkRed: C("#841821") },
    // native x_both rows 21..22 a bright strip, 26..31 the yellow band; z_both rows 26..31
    face: [[1.2, 1.7, "red"], [1.7, 1.8, "darkRed"], [1.8, 2.4, "yellow"], [2.4, 2.7, "red"], [2.7, 2.9, "silver"], [2.9, 3.75, "red"], [3.75, 5, "roofGrey"]],
    side: [[1.2, 1.7, "red"], [1.7, 1.8, "darkRed"], [1.8, 2.4, "yellow"], [2.4, 3.65, "red"], [3.65, 5, "roofGrey"]],
    cab: [[1.2, 1.7, "red"], [1.7, 1.8, "darkRed"], [1.8, 2.4, "yellow"], [2.4, 3.65, "red"], [3.65, 5, "roofGrey"]],
    frame: "red",
    plough: "grey",
    roof: "roofGrey",
  },
  cd781No462: {
    title: "CD 781 462",
    source: "cd_781_462",
    number: runningNumber("781", "462"),
    numberSource: "the vlakosimdb model's name",
    palette: { red: C("#ce1829"), cream: C("#e7e7ce"), roofGrey: C("#a5a594"), orange: C("#ff9428") },
    // x_both rows 24..33 cream, 34 grey; z_both rows 30..34 cream (1.5 .. 2.0 m), the sweep up the cab
    face: [[1.2, 1.6, "red"], [1.6, 2.6, "cream"], [2.6, 3.75, "red"], [3.75, 5, "roofGrey"]],
    side: [[1.2, 1.5, "red"], [1.5, 2.0, "cream"], [2.0, 3.65, "red"], [3.65, 5, "roofGrey"]],
    cab: [[1.2, 1.5, "red"], [1.5, 2.0, "cream"], [2.0, 3.65, "red"], [3.65, 5, "roofGrey"]],
    sweep: { mat: "cream", outline: [[0, 2.0], [2.2, 2.0], [0.4, 2.85], [0, 2.85]] },
    frame: "red",
    plough: "orange",
    roof: "roofGrey",
  },
} as const satisfies Record<string, Cd781Livery>;

export const CD781_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd781",
  values: Object.entries(CD781_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];

export const CD781_NUMBER = CD781_LIVERIES.cd781.number;

const CENTRE = 8.8;
const X = (sx: number) => sx - CENTRE;
const HALF = 1.475;
/** XML alongz: the face upright to 2.9 m at source x 0.5, the windscreen raked back to 0.7 at 3.8, the roof rolling to 2.1 at 4.3 m. */
const endX = (y: number) => lerpTable([[1.2, 0.5], [2.9, 0.5], [3.75, 0.68], [4.05, 0.95], [4.25, 1.45], [4.4, 2.3]], y);
/** XML alongx: upright sides to 3.5 m, a deep curved roof; 2.95 m wide (published). */
const half = (y: number) => lerpTable([[1.2, HALF], [3.55, HALF], [3.8, 1.42], [4.05, 1.25], [4.25, 0.95], [4.4, 0.45]], y);
const HEIGHTS = [1.2, 2.9, 3.55, 3.75, 3.8, 4.05, 4.25, 4.4];

function body(l: Cd781Livery): PlanBody {
  return {
    tip: (y) => CENTRE - endX(y),
    half,
    // XML alongy: corners rounded back 0.2 m
    end: (y) => [[0, 0], [0.02, 0.8], [0.08, half(y) - 0.25], [0.2, half(y)]],
    heights: HEIGHTS,
    face: l.face,
    side: l.side,
    cab: l.cab,
    cabX: CENTRE - 3.1,
    top: l.roof,
  };
}

export function cd781(params?: ParamValues): MeshBuilder {
  const { livery: key } = resolveParams(CD781_PARAMS, params);
  const l: Cd781Livery = CD781_LIVERIES[key as keyof typeof CD781_LIVERIES];
  const m = new MeshBuilder({ ...DIESEL_PALETTE, grey: C("#808080"), silver: C("#c6c6ad"), darkSeam: C("#5a0c12"), ...l.palette });
  const pb = body(l);
  const wall: Wall = { half, breaks: [3.55, 3.8] };
  m.scope("body", () => {
    m.scope("shell", () => planBody(m, pb));
    m.scope("frame", () => {
      const t = CENTRE - 0.5;
      const r: Ring = [[t, -1.3], [t - 0.2, -HALF], [-(t - 0.2), -HALF], [-t, -1.3], [-t, 1.3], [-(t - 0.2), HALF], [t - 0.2, HALF], [t, 1.3]];
      m.cap("underframe", r, 1.2, false);
      m.prism("underframe", r.map(([x, z]) => [x * 0.995, z * 0.92]), 1.0, 1.2, false);
    });
    m.scope("roof", () => roof(m, l));
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => {
      m.scope("face", () => face(m, pb, e, l));
      m.scope("lower end", () => lowerEnd(m, e, l));
    });
  m.scope("sides", () => sides(m, wall, l));
  const spec: BogieSpec = {
    axles: [-2.1, 0, 2.1], wheelR: 0.525, frameHalf: 2.75, frameTop: 1.02, frameBottom: 0.66, frameZ: [0.92, 1.06],
    primary: "coil", secondary: [-1.05, 1.05], secondaryZ: 1.18, bolster: 1.0,
  };
  m.scope("bogies", () => {
    m.scope("rear bogie", () => bogie(m, -4.3, spec));
    m.scope("front bogie", () => bogie(m, 4.3, spec));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}

function roof(m: MeshBuilder, l: Cd781Livery): void {
  // the raised section over the engine (XML alongz, source x 6.1 .. 9.6, to 4.5 m) with its louvres (native roof BMP)
  const q: Ring = [[-0.85, 4.32], [0.85, 4.32], [0.7, 4.5], [-0.7, 4.5]];
  m.scope("engine hatch", () => {
    m.sweep(l.roof, "x", q, X(6.1), q, X(9.6));
    for (let x = 6.3; x < 9.4; x += 0.5) block(m, "louvre", X(x), X(x + 0.38), 4.5, 4.505, -0.6, 0.6);
  });
  // the cooler's roof grille (y_dec columns 120..141) and the exhaust box (104..115)
  m.scope("cooler grille", () => {
    block(m, "grille", X(12.0), X(14.1), 4.3, 4.42, -0.75, 0.75);
    for (let x = 12.1; x < 14.0; x += 0.42) block(m, "louvre", X(x), X(x + 0.32), 4.42, 4.425, -0.68, 0.68);
  });
  exhaust(m, X(10.95), 0, 4.32, 4.52, 0.9, 0.55);
  horn(m, 1, X(15.0), 0.0, 4.48);
  horn(m, -1, X(2.6), 0.0, 4.48);
}

function face(m: MeshBuilder, pb: PlanBody, e: number, l: Cd781Livery): void {
  // x_both: surround rows 13..20 (2.9 .. 3.7 m), glass rows 14..19, panes columns 2..13 and 16..27
  endWindscreen(m, pb, e, null, [["left pane", -1.4, -0.01, 2.92, 3.68], ["right pane", 0.01, 1.4, 2.92, 3.68]], 0.14);
  m.scope("headlight", () => {
    // rows 8..11, columns 12..17: the headlight on the roof's slope, 3.8 .. 4.2 m
    // an oval 0.6 by 0.4 m seen from ahead: the round lamp foreshortened on the slope
    const ring = (r: number) => ngon(12, r, 0, 0, 0).map(([a, b]) => [a * 1.5, 4.0 + b] as [number, number]);
    m.scope("housing", () => endPanel(m, pb, "grey", e, ring(0.2), -0.05, 0.06));
    m.scope("lens", () => endPanel(m, pb, "lampHead", e, ring(0.14), -0.02, 0.08));
  });
  m.scope("handrails", () => {
    for (const u of [-1.0, 1.0]) endPanel(m, pb, "handrail", e, [[u - 0.02, 1.9], [u + 0.02, 1.9], [u + 0.02, 2.55], [u - 0.02, 2.55]], 0.03, 0.06);
  });
  const faceX = CENTRE - 0.5;
  // rows 34..35: white lamps at columns 2..4; the red ones outboard (photographs); the plate columns 11..18
  m.scope("lamps", () => {
    for (const u of [-1.12, 1.12]) m.scope("head lamp", () => faceLamp(m, e, faceX, -e * u, 1.48, 0.1, "lampHead"));
    for (const u of [-1.34, 1.34]) m.scope("tail lamp", () => faceLamp(m, e, faceX, -e * u, 1.48, 0.06, "lampRed"));
  });
  m.scope("number plate", () => facePlate(m, e, faceX, l.number, 1.48));
}

function lowerEnd(m: MeshBuilder, e: number, l: Cd781Livery): void {
  const beam = CENTRE - 0.5;
  m.scope("buffer beam", () => block(m, l.frame, ...along(e, beam - 0.6, beam), 0.85, 1.2, -1.42, 1.42));
  buffers(m, e, beam, 8.775, 1.03, "round");
  coupling(m, e, beam, 1.03);
  // rows 42..45: the plough, 0.4 .. 0.8 m, under the beam
  plough(m, e, l.plough, beam - 0.02, 0.5, 0.4, 0.8, 1.45, 1.47);
}

function sides(m: MeshBuilder, w: Wall, l: Cd781Livery): void {
  for (const s of [1, -1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      for (const [end, mirror] of [["left cab", false], ["right cab", true]] as const)
        m.scope(end, () => {
          const sx = (x: number) => X(mirror ? 2 * CENTRE - x : x);
          const span = (a: number, b: number): [number, number] => [Math.min(sx(a), sx(b)), Math.max(sx(a), sx(b))];
          // z_both: the cab window columns 11..19 (two sliding panes), rows 15..20; the door 22..29 with its window 24..27
          m.scope("cab window", () => {
            const [a, b] = span(1.1, 2.0);
            sideWindow(m, w, s, a, (a + b) / 2, 2.9, 3.5, "silver", 0.04);
            sideWindow(m, w, s, (a + b) / 2, b, 2.9, 3.5, "silver", 0.04);
          });
          const [d0, d1] = span(2.2, 3.0);
          m.scope("door", () => {
            sideDecal(m, w, "darkSeam", s, [rect(d0, 1.72, d1, 1.74), rect(d0, 3.5, d1, 3.52), rect(d0, 1.74, d0 + 0.02, 3.5), rect(d1 - 0.02, 1.74, d1, 3.5)], 0.004);
            m.scope("window", () => sideWindow(m, w, s, d0 + 0.18, d1 - 0.18, 2.95, 3.42, "rubber", 0.06));
          });
          m.scope("handrails", () => {
            for (const x of [d0 - 0.07, d1 + 0.07]) sideHandrail(m, w, s, x, 1.8, 3.3);
          });
          m.scope("steps", () => {
            for (const y of [0.55, 0.85]) block(m, "steel", d0 + 0.05, d1 - 0.05, y, y + 0.04, ...side(s, 1.25, 1.45));
            for (const x of [d0 + 0.05, d1 - 0.08]) block(m, "steel", x, x + 0.03, 0.55, 1.2, ...side(s, 1.41, 1.45));
          });
          if (l.sweep)
            m.scope("sweep", () => {
              const q = l.sweep!.outline.map(([dx, y]): [number, number] => [sx(0.5 + dx), y]);
              const ring: Ring = mirror ? q : [...q].reverse();
              sideDecal(m, w, l.sweep!.mat, s, [ring], 0.003);
            });
        });
      // the machine room's windows: columns 33, 50, 60, 70, 80, 90, 100 (0.6 m glass), rows 16..19
      m.scope("windows", () => {
        [3.3, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0].forEach((x, i) => m.scope(`window ${i + 1}`, () => sideWindow(m, w, s, X(x), X(x + 0.62), 2.98, 3.42, "rubber", 0.08)));
      });
      // the radiator louvres: columns 120..145, rows 15..25 (2.4 .. 3.5 m), two panels
      m.scope("radiator", () => {
        m.scope("left panel", () => sideGrille(m, w, s, X(12.0), X(13.3), 2.4, 3.5, "grille", 12));
        m.scope("right panel", () => sideGrille(m, w, s, X(13.3), X(14.6), 2.4, 3.5, "grille", 12));
      });
      m.scope("intake", () => sideGrille(m, w, s, X(4.15), X(4.75), 2.95, 3.4, "grille", 5));
      m.scope("number plate", () => sidePlate(m, w, s, l.number, X(8.6), 2.6));
    });
}

function underframe(m: MeshBuilder): void {
  // the fuel tank: z_both columns 76..100, rows 37..45 (0.4 .. 1.3 m)
  m.scope("fuel tank", () => {
    const sec: Ring = [[-1.2, 0.6], [-1.05, 0.42], [1.05, 0.42], [1.2, 0.6], [1.2, 1.0], [-1.2, 1.0]];
    m.sweep("tank", "x", sec, X(7.6), sec, X(10.0));
    for (const s of [-1, 1]) block(m, "steel", X(8.7), X(9.0), 0.65, 0.85, ...side(s, 1.2, 1.24));
  });
  m.scope("air reservoirs", () => {
    // long cylinders under the body's sides over the bogies (photographs)
    for (const s of [-1, 1]) for (const [a, b] of [[1.9, 6.5], [11.1, 15.7]]) tankX(m, "spring", X(a), X(b), s * 1.24, 1.08, 0.13, 10);
  });
  m.scope("battery boxes", () => {
    for (const s of [-1, 1]) block(m, "underframe", X(6.8), X(7.5), 0.6, 1.0, ...side(s, 0.5, 1.2));
  });
}
