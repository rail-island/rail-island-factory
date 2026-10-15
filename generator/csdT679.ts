// The CKD T 679.0 (later CD/ZSR 776) "Pomeranc": a Co'Co' diesel-electric
// locomotive of 1962 to 1965, 27 built, orange with a cream roof. The vlakosimdb
// model csd_t_679 is this class, not the M62 (T 679.1, veh-cd-781): its textures
// show the full-width body with the long machine-room window and cream cab bands
// of the 776 (assets/csd-t679/SOURCES.md). Reconstructed from its native JT7 XML
// and BMPs (assets/csd-t679/native) and photographs.
//
// Source coordinates: x along the body from the side BMP's left edge (the body
// spans 0.6 .. 18.3 of a 19 m canvas), y up, z across. The drawing is 17.7 m long
// where the published locomotive is 18.0 m over the buffers, so Factory
// X = (x - 9.45) * K with K = 0.95 makes the body 16.8 m and leaves 0.6 m buffers.
// 9.56 m between the pivots, 2 x 2.0 m bogie wheelbase, 1.0 m wheels (published).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { runningNumber } from "./cd163.ts";
import {
  DIESEL_PALETTE, block, bogie, buffers, coupling, endWindscreen, faceLamp, facePlate, horn, lerpTable,
  paint, planBody, rect, side, sideDecal, sideGrille, sideHandrail, sidePanel, sidePlate, sideWindow,
  type Band, type BogieSpec, type PlanBody, type Wall,
} from "./dieselParts.ts";

const C = (hex: string) => paint(hex);

const PALETTE: Record<string, MaterialSpec> = {
  ...DIESEL_PALETTE,
  orange: C("#d66703"),
  cream: C("#c2c49d"),
  olive: C("#5e5e00"),
  silver: { color: "#c0c0c0", metallic: 0.3, roughness: 0.4 },
  blue: C("#1741a2"),
  bogieOlive: C("#6b6b2a"),
  skirt: C("#b8b590"),
  ladder: C("#ae5402"),
};

/** T 679.001 in the CSD numbering (a Kryspin number, no check digit). */
export const T679_NUMBER = "T 679.001";
/** The 1988 number the same locomotive took (with its check digit). */
export const T679_NUMBER_1988 = runningNumber("776", "001");

export const K = 0.95;
const CENTRE = 9.45;
const X = (sx: number) => (sx - CENTRE) * K;
/** XML alongz: the face leaning back from source x 0.6 at 1.3 m to 0.8 at 3.9 m, then the roof rolling over. */
const endX = (y: number) => lerpTable([[0.9, 0.6], [1.3, 0.6], [3.9, 0.8], [4.1, 0.9], [4.2, 1.1], [4.3, 1.9]], y);
/** XML alongx: upright sides to 3.9 m, the roof's corners rounded to 4.3 m. */
const half = (y: number) => lerpTable([[0.9, 1.5], [3.9, 1.5], [4.1, 1.4], [4.2, 1.2], [4.3, 0.15]], y);
const HEIGHTS = [0.9, 1.3, 3.9, 4.1, 4.2, 4.3];

// The cab sections (source columns 6..27): two cream bands under the windows (rows 15..16 and 19..21)
const SIDE: Band[] = [[0.9, 1.0, "silver"], [1.0, 1.2, "olive"], [1.2, 1.3, "silver"], [1.3, 3.9, "orange"], [3.9, 5, "cream"]];
const CAB: Band[] = [[0.9, 1.0, "silver"], [1.0, 1.2, "olive"], [1.2, 1.3, "silver"], [1.3, 2.2, "orange"], [2.2, 2.5, "cream"], [2.5, 2.7, "orange"], [2.7, 2.9, "cream"], [2.9, 3.9, "orange"], [3.9, 5, "cream"]];
// x_both: rows 31 silver, 32..33 olive, 25..30 orange, 19..24 cream, 17..18 orange, 15..16 cream, the windscreen, cream above
const FACE: Band[] = [[0.9, 1.0, "silver"], [1.0, 1.2, "olive"], [1.2, 1.3, "silver"], [1.3, 1.9, "orange"], [1.9, 2.5, "cream"], [2.5, 2.7, "orange"], [2.7, 5, "cream"]];

const BODY: PlanBody = {
  tip: (y) => (CENTRE - endX(y)) * K,
  half,
  // XML alongy: the corners chamfered 0.1 by 0.1 m
  end: (y) => [[0, 0], [0.004, half(y) - 0.1], [0.1, half(y)]],
  heights: HEIGHTS,
  face: FACE,
  side: SIDE,
  cab: CAB,
  cabX: (CENTRE - 2.8) * K,
  top: "cream",
};
const WALL: Wall = { half, breaks: [3.9, 4.1] };

/** The CSD T 679.0 "Pomeranc" as built, orange and cream. */
export function csdT6790(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => {
    m.scope("shell", () => planBody(m, BODY));
    m.scope("underside", () => {
      const t = BODY.tip(0.9);
      m.cap("underframe", [[t, -1.4], [t - 0.1, -1.5], [-(t - 0.1), -1.5], [-t, -1.4], [-t, 1.4], [-(t - 0.1), 1.5], [t - 0.1, 1.5], [t, 1.4]], 0.9, false);
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
    axles: [-2.0, 0, 2.0], wheelR: 0.5, frameHalf: 2.65, frameTop: 0.9, frameBottom: 0.6, frameZ: [0.92, 1.06],
    primary: "coil", secondary: [-1.0, 1.0], secondaryZ: 1.18, bolster: 0.9,
  };
  m.scope("bogies", () => {
    m.scope("rear bogie", () => bogie(m, -4.78, spec));
    m.scope("front bogie", () => bogie(m, 4.78, spec));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}

function roof(m: MeshBuilder): void {
  // the exhaust (XML "kom": source x 9.0 .. 9.4, z 0.7 .. 0.9, to 4.4 m) and roof hatches over the engine
  m.scope("exhaust", () => block(m, "exhaust", X(9.0), X(9.4), 4.2, 4.42, 0.65, 0.95));
  m.scope("hatches", () => {
    for (const [a, b] of [[5.9, 8.4], [10.4, 12.9]]) block(m, "cream", X(a), X(b), 4.25, 4.33, -0.75, 0.75);
    for (const x of [7.0, 11.6]) m.prism("grille", ngon(12, 0.32, 0, X(x), -0.95 * 0), 4.33, 4.36);
  });
  horn(m, 1, X(16.8), 0.4, 4.38);
  horn(m, -1, X(2.1), -0.4, 4.38);
}

function face(m: MeshBuilder, e: number): void {
  // rows 6 and 14 the blue frame (3.0 .. 3.8 m), the panes columns 0..13 and 16..29
  endWindscreen(m, BODY, e, { mat: "blue", u0: -1.5, u1: 1.5, y0: 2.95, y1: 3.8, r: 0.05 }, [["left pane", -1.42, -0.1, 3.03, 3.72], ["right pane", 0.1, 1.42, 3.03, 3.72]], 0.06);
  // the headlight on the roof's front (XML "light": +-0.2, 4.1 .. 4.3 m)
  m.scope("headlight", () => {
    const t = BODY.tip(4.15);
    const sec = ngon(10, 0.13, 0, 0, 4.22);
    m.scope("housing", () => m.sweep("cream", "x", sec, e * (t - 0.6), sec, e * (t + 0.12)));
    const lens = ngon(10, 0.1, 0, 0, 4.22);
    m.scope("lens", () => m.sweep("lampHead", "x", lens, e * (t + 0.12), lens, e * (t + 0.14)));
  });
  const faceX = BODY.tip(1.1);
  // rows 32..33: the lamps in the olive band (columns 5..6 and 23..24; moved inboard of the standard buffers, which the BMP draws lower)
  m.scope("lamps", () => {
    for (const u of [-0.55, 0.55]) m.scope("head lamp", () => faceLamp(m, e, faceX, -e * u, 1.1, 0.08, "lampHead"));
    for (const u of [-1.3, 1.3]) m.scope("tail lamp", () => faceLamp(m, e, faceX, -e * u, 1.1, 0.06, "lampRed"));
  });
  m.scope("number plate", () => facePlate(m, e, faceX, T679_NUMBER, 1.6, "white", "black"));
}

function lowerEnd(m: MeshBuilder, e: number): void {
  const beam = BODY.tip(0.9);
  buffers(m, e, beam, 9.0, 1.03, "round");
  coupling(m, e, beam, 1.03);
  // the cream skirt under the cab (XML base: from source x 0.6 at 0.9 m back to 1.1 at 0.1 m), rows 35..43
  m.scope("skirt", () => {
    const ring = (x: number, hw: number): Ring => (e > 0 ? [[x, -hw], [x - 0.5, -hw], [x - 0.5, hw], [x, hw]] : [[-x + 0.5, -hw], [-x, -hw], [-x, hw], [-x + 0.5, hw]]);
    m.loft("skirt", ring(beam - 0.45, 1.3), 0.12, ring(beam, 1.5), 0.9, false);
    m.cap("skirt", ring(beam - 0.45, 1.3), 0.12, false);
  });
}

function sides(m: MeshBuilder): void {
  const w = WALL;
  for (const s of [1, -1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      for (const [end, mirror] of [["left cab", false], ["right cab", true]] as const)
        m.scope(end, () => {
          const sx = (x: number) => X(mirror ? 2 * CENTRE - x : x);
          const span = (a: number, b: number): [number, number] => [Math.min(sx(a), sx(b)), Math.max(sx(a), sx(b))];
          // z_both rows 6..14, columns 7..10 and 12..16: two cab windows; the door 18..27, its window 20..25
          m.scope("cab windows", () => {
            m.scope("window 1", () => sideWindow(m, w, s, ...span(0.75, 1.05), 2.95, 3.75, "blue", 0.03));
            m.scope("window 2", () => sideWindow(m, w, s, ...span(1.2, 1.7), 2.95, 3.75, "blue", 0.03));
          });
          const [d0, d1] = span(1.8, 2.7);
          m.scope("door", () => {
            sideDecal(m, w, "rubber", s, [rect(d0, 1.4, d1, 1.42), rect(d0, 3.8, d1, 3.82), rect(d0, 1.42, d0 + 0.02, 3.8), rect(d1 - 0.02, 1.42, d1, 3.8)], 0.004);
            m.scope("window", () => sideWindow(m, w, s, d0 + 0.18, d1 - 0.18, 2.95, 3.72, "blue", 0.03));
          });
          m.scope("handrails", () => {
            for (const x of [d0 - 0.07, d1 + 0.07]) sideHandrail(m, w, s, x, 1.45, 3.3);
          });
          m.scope("steps", () => {
            for (const y of [0.45, 0.72]) block(m, "steel", d0 + 0.05, d1 - 0.05, y, y + 0.04, ...side(s, 1.25, 1.45));
            for (const x of [d0 + 0.05, d1 - 0.08]) block(m, "steel", x, x + 0.03, 0.45, 0.9, ...side(s, 1.41, 1.45));
          });
        });
      // the louvred intake (columns 30..50, rows 8..24: 1.9 .. 3.6 m), two panels
      m.scope("intake", () => {
        m.scope("left panel", () => sideGrille(m, w, s, X(3.0), X(4.0), 1.9, 3.6, "silver", 9, true));
        m.scope("right panel", () => sideGrille(m, w, s, X(4.0), X(5.0), 1.9, 3.6, "silver", 9, true));
      });
      // the machine room's long window (columns 58..130, rows 6..18: 2.5 .. 3.8 m), its mullions dark
      m.scope("machine room window", () => {
        m.scope("frame", () => sidePanel(m, w, "silver", s, rect(X(5.8), 2.55, X(13.1), 3.8), 0.012, 0.03));
        m.scope("glass", () => sidePanel(m, w, "grille", s, rect(X(5.9), 2.65, X(13.0), 3.7), 0.018, 0.012));
        m.scope("mullions", () => sideDecal(m, w, "louvre", s, [6.6, 7.4, 8.2, 9.0, 9.8, 10.6, 11.4, 12.2].map((x) => rect(X(x) - 0.02, 2.65, X(x) + 0.02, 3.7)), 0.024));
      });
      // the ladder (columns 155..160, rows 5..30) up to the roof
      m.scope("ladder", () => {
        const [a, b] = [X(15.5), X(16.1)];
        sideDecal(m, w, "ladder", s, [rect(a, 1.3, a + 0.04, 3.9), rect(b - 0.04, 1.3, b, 3.9), ...[1.6, 1.95, 2.3, 2.65, 3.0, 3.35, 3.7].map((y) => rect(a, y, b, y + 0.04))], 0.02);
      });
      // the plate at columns 91..98, rows 24..26 (1.7 .. 2.0 m)
      m.scope("number plate", () => sidePlate(m, w, s, T679_NUMBER, (X(9.1) + X(9.8)) / 2, 1.77, "white", "black"));
    });
}

function underframe(m: MeshBuilder): void {
  // the fuel tank between the bogies (z_both columns 74..114, rows 35..41; XML "box" 7.4 .. 11.5, 0.2 .. 0.9 m)
  m.scope("fuel tank", () => {
    const sec: Ring = [[-1.4, 0.35], [-1.25, 0.22], [1.25, 0.22], [1.4, 0.35], [1.45, 0.9], [-1.45, 0.9]];
    m.sweep("skirt", "x", sec, X(7.4), sec, X(11.5));
    for (const s of [-1, 1]) block(m, "steel", X(9.2), X(9.6), 0.5, 0.7, ...side(s, 1.42, 1.47));
  });
  m.scope("frame", () => block(m, "underframe", X(1.4), X(17.5), 0.75, 0.88, -1.25, 1.25));
}
