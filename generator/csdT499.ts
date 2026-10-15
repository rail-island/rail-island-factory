// The CKD T 499.0 (CD 759) "Kyklop": the two Bo'Bo' express diesel-electric
// prototypes of 1974, named after the big headlight in the middle of each face.
// Reconstructed from the native JT7 XML and BMPs of the vlakosimdb model
// csd_t499 (assets/csd-t499/native) and photographs of T 499.0002 in its
// restored yellow and blue (assets/csd-t499/*.jpg).
//
// Source coordinates: x along the body from the side BMP's left edge (the body
// spans 0.5 .. 17.0 of an 18 m canvas), y up, z across; Factory X = x - 8.75.
// 17.84 m over the buffers, 3.09 m wide, 10.0 m between the pivots, 2.6 m bogie
// wheelbase, 1.0 m wheels (published; assets/csd-t499/SOURCES.md).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import {
  DIESEL_PALETTE, along, block, bogie, buffers, coupling, endPanel, endWindscreen, facePlate, horn, lerpTable,
  paint, planBody, plough, rect, roofFan, side, sideDecal, sideGrille, sideHandrail, sidePlate, sideWindow, tankX,
  type Band, type BogieSpec, type PlanBody, type Wall,
} from "./dieselParts.ts";

const C = (hex: string) => paint(hex);

const PALETTE: Record<string, MaterialSpec> = {
  ...DIESEL_PALETTE,
  yellow: C("#cd9c13"),
  louvreYellow: C("#a8800c"),
  blue: C("#00004f"),
  navy: C("#000036"),
  roofGrey: C("#b5b5b5"),
  frameBlack: C("#252525"),
  olive: C("#917b02"),
};

/** T 499.0002 in its CSD numbering (photographed in this livery); as CD 759 002-9 from 1988. */
export const T499_NUMBER = "T 499.0002";

const CENTRE = 8.75;
const X = (sx: number) => sx - CENTRE;
/** XML alongz: the face raked back from source x 0.5 at 2.0 m to 0.8 at 4.1 m, tucked in to 0.6 at 1.5 m. */
const endX = (y: number) => lerpTable([[1.0, 0.6], [1.5, 0.6], [2.0, 0.5], [3.4, 0.65], [3.8, 0.72], [4.0, 0.77], [4.1, 0.8]], y);
/** XML alongx: upright sides to 3.4 m, the roof rolling in to the crown at 4.1 m. */
const half = (y: number) => lerpTable([[1.0, 1.5], [3.4, 1.5], [3.8, 1.0], [4.0, 0.6], [4.1, 0.05]], y);
const HEIGHTS = [1.0, 1.5, 2.0, 3.4, 3.6, 3.8, 4.0, 4.1];

const FACE: Band[] = [[1.0, 1.5, "frameBlack"], [1.5, 2.0, "navy"], [2.0, 5, "yellow"]];
const SIDE: Band[] = [[1.0, 1.5, "frameBlack"], [1.5, 2.0, "navy"], [2.0, 3.4, "blue"], [3.4, 5, "roofGrey"]];
const CAB: Band[] = [[1.0, 1.5, "frameBlack"], [1.5, 2.0, "navy"], [2.0, 3.4, "yellow"], [3.4, 5, "roofGrey"]];

const BODY: PlanBody = {
  tip: (y) => CENTRE - endX(y),
  half,
  // the face's corners curve back 0.15 m (photographs)
  end: (y) => [[0, 0], [0.04, half(y) * 0.6], [0.15, half(y)]],
  heights: HEIGHTS,
  face: FACE,
  side: SIDE,
  cab: CAB,
  cabX: CENTRE - 2.45,
  top: "roofGrey",
};
const WALL: Wall = { half, breaks: [3.4, 3.6] };

/** The T 499.0 "Kyklop" in the yellow and blue of T 499.0002. */
export function csdT499(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => {
    m.scope("shell", () => planBody(m, BODY));
    m.scope("underside", () => {
      const t = BODY.tip(1.0);
      m.cap("underframe", [[t, -1.5], [-t, -1.5], [-t, 1.5], [t, 1.5]], 1.0, false);
    });
    m.scope("roof", () => roof(m));
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => {
      m.scope("face", () => face(m, e));
      m.scope("lower end", () => lowerEnd(m, e));
    });
  m.scope("sides", () => sides(m));
  const spec: BogieSpec = {
    axles: [-1.3, 1.3], wheelR: 0.5, frameHalf: 1.95, frameTop: 0.95, frameBottom: 0.6, frameZ: [0.92, 1.06],
    primary: "coil", secondary: [-0.4, 0.4], secondaryZ: 1.18, bolster: 1.0,
  };
  m.scope("bogies", () => {
    m.scope("rear bogie", () => bogie(m, -5.0, spec));
    m.scope("front bogie", () => bogie(m, 5.0, spec));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}

function roof(m: MeshBuilder): void {
  // the raised roof over the machine room (XML "roof" clip, source x 2.6 .. 14.9, to 4.3 m)
  const q: Ring = [[-1.18, 3.6], [1.18, 3.6], [0.9, 4.1], [0.6, 4.2], [0.2, 4.28], [-0.2, 4.28], [-0.6, 4.2], [-0.9, 4.1]];
  m.scope("machine room roof", () => m.sweep("roofGrey", "x", q, X(2.6), q, X(14.9)));
  // the cooler fans (native roof BMP, source x 2.8 .. 4.6 and 13.4 .. 15.2)
  m.scope("fans", () => {
    for (const x of [3.2, 4.3, 13.2, 14.3]) roofFan(m, X(x), 0, 4.27, 0.38);
  });
  m.scope("exhaust", () => block(m, "exhaust", X(8.3), X(9.2), 4.26, 4.4, -0.3, 0.3));
  horn(m, 1, X(15.8), 0.3, 4.2);
  horn(m, -1, X(1.7), -0.3, 4.2);
}

function face(m: MeshBuilder, e: number): void {
  // x_both rows 17..23: the panes, columns 1..14 and 16..29 (2.7 .. 3.3 m)
  endWindscreen(m, BODY, e, null, [["left pane", -1.42, -0.08, 2.68, 3.32], ["right pane", 0.08, 1.42, 2.68, 3.32]], 0.05);
  // row 25: the grab bars under the panes (columns 2..9 and 20..27)
  m.scope("grab bars", () => {
    for (const [a, b] of [[-1.3, -0.6], [0.6, 1.3]]) endPanel(m, BODY, "olive", e, [[a, 2.48], [b, 2.48], [b, 2.52], [a, 2.52]], 0.04, 0.07);
  });
  // rows 25..29, columns 12..17: the "Kyklop" headlight in the middle of the face
  m.scope("headlight", () => {
    const ring = (r: number) => ngon(16, r, 0, 0, 2.3).map(([a, b]) => [a, b] as [number, number]);
    m.scope("rim", () => endPanel(m, BODY, "steel", e, ring(0.25), -0.02, 0.06));
    m.scope("lens", () => endPanel(m, BODY, "lampHead", e, ring(0.19), -0.01, 0.075));
  });
  // rows 32..33: red lamps at columns 2..3, white ones at 5..6, in the navy band
  m.scope("lamps", () => {
    for (const [u, mat, r] of [[-1.25, "lampRed", 0.07], [-0.9, "lampHead", 0.08], [0.9, "lampHead", 0.08], [1.25, "lampRed", 0.07]] as const) {
      const ring = (rr: number) => ngon(10, rr, 0, u, 1.72).map(([a, b]) => [a, b] as [number, number]);
      m.scope(mat === "lampRed" ? "tail lamp" : "head lamp", () => {
        m.scope("rim", () => endPanel(m, BODY, "navy", e, ring(r + 0.04), -0.02, 0.05));
        m.scope("lens", () => endPanel(m, BODY, mat, e, ring(r), -0.01, 0.065));
      });
    }
  });
  const beam = CENTRE - 0.6;
  m.scope("number plate", () => facePlate(m, e, beam, T499_NUMBER, 1.35));
}

function lowerEnd(m: MeshBuilder, e: number): void {
  const beam = CENTRE - 0.6;
  m.scope("buffer beam", () => block(m, "frameBlack", ...along(e, beam - 0.7, beam), 0.75, 1.0, -1.45, 1.45));
  buffers(m, e, beam, 8.92, 1.03, "rect");
  coupling(m, e, beam, 1.03);
  // rows 43..46: the plough (0.3 .. 0.7 m), its white edge in the photographs
  plough(m, e, "frameBlack", beam - 0.02, 0.6, 0.2, 0.75, 1.2, 1.45, 0.25);
}

function sides(m: MeshBuilder): void {
  const w = WALL;
  for (const s of [1, -1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      for (const [end, mirror] of [["left cab", false], ["right cab", true]] as const)
        m.scope(end, () => {
          const sx = (x: number) => X(mirror ? 2 * CENTRE - x : x);
          const span = (a: number, b: number): [number, number] => [Math.min(sx(a), sx(b)), Math.max(sx(a), sx(b))];
          // z_both rows 17..21: the cab window columns 9..13; the door 14..23 with its window 17..20
          m.scope("cab window", () => sideWindow(m, w, s, ...span(0.9, 1.4), 2.8, 3.3, "rubber", 0.04));
          const [d0, d1] = span(1.5, 2.3);
          m.scope("door", () => {
            sideDecal(m, w, "louvreYellow", s, [rect(d0, 1.62, d1, 1.64), rect(d0, 3.36, d1, 3.38), rect(d0, 1.64, d0 + 0.02, 3.36), rect(d1 - 0.02, 1.64, d1, 3.36)], 0.004);
            m.scope("window", () => sideWindow(m, w, s, d0 + 0.18, d1 - 0.18, 2.8, 3.3, "rubber", 0.04));
          });
          m.scope("handrails", () => {
            for (const x of [d0 - 0.07, d1 + 0.07]) sideHandrail(m, w, s, x, 1.7, 3.1);
          });
          m.scope("steps", () => {
            for (const y of [0.5, 0.8]) block(m, "steel", d0 + 0.05, d1 - 0.05, y, y + 0.04, ...side(s, 1.25, 1.45));
            for (const x of [d0 + 0.05, d1 - 0.08]) block(m, "steel", x, x + 0.03, 0.5, 1.0, ...side(s, 1.41, 1.45));
          });
          // the yellow louvred bay behind the cab, its edge leaning (columns 25..57, rows 16..29)
          m.scope("yellow bay", () => {
            const q: Ring = [[sx(2.4), 2.0], [sx(5.6), 2.0], [sx(5.2), 3.4], [sx(2.4), 3.4]];
            sideDecal(m, w, "yellow", s, [mirror ? [...q].reverse() : q], 0.003);
            const [g0, g1] = span(2.55, 5.0);
            sideGrille(m, w, s, g0, g1, 2.08, 3.32, "louvreYellow", 9);
          });
        });
      // the machine room's windows: columns 58, 78, 85, 102 (0.5 m), rows 17..21
      m.scope("windows", () => {
        [5.8, 7.8, 8.5, 10.2].forEach((x, i) => m.scope(`window ${i + 1}`, () => sideWindow(m, w, s, X(x), X(x + 0.5), 2.8, 3.3, "rubber", 0.04)));
      });
      // the louvres on the roof's cant (columns 61..114 and 128..144, rows 10..14)
      m.scope("cant louvres", () => {
        const qs: Ring[] = [];
        for (const [a, b] of [[6.1, 7.0], [7.2, 8.0], [8.3, 9.1], [9.4, 10.2], [10.8, 11.5], [12.8, 14.4]]) qs.push(rect(X(a), 3.5, X(b), 3.58));
        sideDecal(m, { half, breaks: [] }, "louvre", s, qs, 0.004);
      });
      m.scope("number plate", () => sidePlate(m, w, s, T499_NUMBER, X(8.75), 2.4));
    });
}

function underframe(m: MeshBuilder): void {
  // the fuel tank between the bogies (XML "box" clip, source x 6.3 .. 11.2, 0.3 .. 1.0 m)
  m.scope("fuel tank", () => {
    const sec: Ring = [[-1.3, 0.5], [-1.15, 0.32], [1.15, 0.32], [1.3, 0.5], [1.3, 1.0], [-1.3, 1.0]];
    m.sweep("tank", "x", sec, X(6.3), sec, X(11.2));
    for (const s of [-1, 1]) block(m, "steel", X(8.6), X(8.9), 0.6, 0.8, ...side(s, 1.3, 1.34));
  });
  m.scope("air reservoirs", () => {
    for (const s of [-1, 1]) tankX(m, "spring", X(11.4), X(12.0), s * 0.7, 0.75, 0.2);
  });
}
