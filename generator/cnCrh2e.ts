// The CRH2E (CSR Sifang, 2008): the 16-car sleeper unit of the CRH2 family, the first batch CRH2-121E
// to 126E (CRH2E-2121 to 2126 since 2014) with the original E2-1000 nose - not the later CRH2E "NG"
// (2461 - 2465) with the CRH2G's nose. Drawn on the series kit (shinkansen.ts) with the CRH2A's
// measured cab face (cnCrh2a.ts) and its own: the "phoenix eye" lamps on the bonnet's flanks (the
// CRH2B's and CRH2E's), the crew door in place of the CRH2A's cab side window, the blue band ending
// in a point under the CRH mark, the seat car's layout at the ends and the soft sleeper's ten
// compartment windows. See docs/models/china-units.md, "The CRH2E's body".
//
// Measured on assets/cr-crh2e/ (SOURCES.md): photo-crh2e-2132-bjx-...jpg nearly side-on (the end
// car's left side and the second car, a projective fit along the side through the tip, the joint
// 25.7 m back and the second car's windows at a 2.0 m pitch), photo-car-15-of-crh2e-2134-...jpg (a
// soft sleeper square to the camera, 46 px/m), photo-crh2e-2122-...jpg and photo-crh2e-2127-...jpg
// (the right side; front three-quarter: the eye lamps), photo-crh2-126e-...jpg (a first-batch unit).
// Published: 25.7 m end cars and 25.0 m intermediate cars, 3.38 m wide (3.27 m in the gauge), 3.7 m
// high, 2.5 m wheelbase; 8M8T, 9,600 kW (300 kW motors), 250 km/h; 13 soft sleepers of ten
// four-berth compartments, two seat cars at the ends and a dining car (car 8).
// Heights over the rail, d behind the nose's tip.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { bodyHalf, type SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { CRH2A } from "./cnCrh2a.ts";
import { c } from "./seriesHelpers.ts";
import { block } from "./vehicleParts.ts";

/** The CRH2A's face, joining the body 9.2 m behind the tip. */
const A_FACE = CRH2A.cabFace!;
const J = A_FACE.dJoin;
/** The side's blue band just under the windows (the sleeper car's photo: 1.78 - 1.93 m). */
const BAND: readonly [number, number] = [1.8, 1.96];
/** The passenger door behind the crew door, as the CRH2A's. */
const DOOR: readonly [number, number] = [9.45, 10.35];
/** The crew door just ahead of it, still on the face's cab side: 0.65 m wide, its window high in the leaf. */
const CREW: readonly [number, number] = [8.15, 8.8];
const CREW_Y: readonly [number, number] = [1.3, 3.12];
/** Where the band ends in a point under the CRH mark, and where it reaches its full height. */
const BAND_POINT = 5.2;
const BAND_FULL = 7.0;

/**
 * The phoenix-eye lamp on each flank of the bonnet: a dark almond rising toward the rear, from its
 * front point 1.74 m up 1.25 m behind the tip to its rear point 1.97 m up 2.25 m back (side-on
 * photograph), its lens a lighter almond inside it.
 */
const EYE = { front: [[1.74, 1.25], [1.81, 1.38], [1.9, 1.68], [1.97, 2.25]] as Pt[], back: [[1.74, 1.25], [1.78, 1.6], [1.86, 1.98], [1.97, 2.25]] as Pt[] };
const LENS = { front: [[1.775, 1.42], [1.83, 1.55], [1.9, 1.82], [1.935, 2.07]] as Pt[], back: [[1.775, 1.42], [1.8, 1.68], [1.86, 1.92], [1.935, 2.07]] as Pt[] };

export const CRH2E_FACE: SeriesCabFace = {
  ...A_FACE,
  // no cab side window (the CRH2A's): the eye lamps; the crew door is drawn on the face by the fittings
  paint: [
    { mat: "lampEye", ...EYE },
    { mat: "lampLens", ...LENS },
  ],
};

/** A table's value at x (linear, clamped). */
function at(t: readonly Pt[], x: number): number {
  if (x <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) if (x <= t[i]![0]) { const [a, b] = [t[i - 1]!, t[i]!]; return a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]); }
  return t[t.length - 1]![1];
}

/**
 * The face's half width at height y, d behind the tip, on its cab side behind the nose's corner: the
 * straight run flaring from the inset face (cabNose.ts planInset) out to the body's side at dSide, as
 * the face's own grid draws it there.
 */
function faceLat(half: readonly Pt[], y: number, d: number): number {
  const hwBody = at(half, y), inset = at(A_FACE.planInset ?? [[0, 0]], y);
  const dA = at(A_FACE.profile, y) + at(A_FACE.cornerDepth!, y), dS = Math.min(Math.max(dA, A_FACE.dSide ?? J / 2), J);
  if (d >= dS || dS - dA < 1e-6) return hwBody;
  return hwBody - inset * (1 - Math.max(0, d - dA) / (dS - dA));
}

/**
 * The crew door on the face's cab side, both sides: its outline in thin dark strips and its window
 * high in the leaf, standing a few millimetres off the face (drawn here: as the face's paint its
 * vertical edges would cost thousands of triangles).
 */
function crewDoor(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const half = bodyHalf(b, 0), off = 0.006;
  const ys = (y0: number, y1: number): number[] => [...new Set([y0, ...A_FACE.rows.filter((y) => y > y0 + 0.01 && y < y1 - 0.01), y1])];
  const P = (sd: number, y: number, d: number): Vec3 => [X(d - J), y, sd * (faceLat(half, y, d) + off)];
  // a patch between d0 and d1 over the heights, facing out on side sd
  const patch = (mat: string, sd: number, d0: number, d1: number, y0: number, y1: number): void => {
    const h = ys(y0, y1);
    for (let i = 0; i + 1 < h.length; i++) {
      const [a, e] = [h[i]!, h[i + 1]!];
      const q: Vec3[] = [P(sd, a, d0), P(sd, a, d1), P(sd, e, d1), P(sd, e, d0)];
      if (sd > 0) m.quad(mat, q[0]!, q[1]!, q[2]!, q[3]!);
      else m.quad(mat, q[3]!, q[2]!, q[1]!, q[0]!);
    }
  };
  const t = 0.022;
  for (const sd of [1, -1]) {
    patch("seam", sd, CREW[0], CREW[0] + t, CREW_Y[0], CREW_Y[1]);
    patch("seam", sd, CREW[1] - t, CREW[1], CREW_Y[0], CREW_Y[1]);
    patch("seam", sd, CREW[0] + t, CREW[1] - t, CREW_Y[0], CREW_Y[0] + t);
    patch("seam", sd, CREW[0] + t, CREW[1] - t, CREW_Y[1] - t, CREW_Y[1]);
    patch("cabGlass", sd, 8.34, 8.61, 2.38, 2.95);
  }
}

const WHITE = "#f1f2f0";
const BLUE = "#2350a8";

/** The CRH livery of the first batch: white, the blue band under the windows ending in a point under the CRH mark ahead of the crew door. */
const LIVERY: ShinkansenLivery = {
  title: "CRH blue",
  palette: {
    white: c(WHITE), blue: c(BLUE), roofG: c("#e1e3e4", 0.6), skirtG: c("#ebeceb", 0.5), cabMask: c("#1d1f22", 0.3), seam: c("#4a4e54", 0.6),
    lampStrip: c("#c4cad0", 0.25), roofBox: c("#c9cdd0", 0.5), roofTrough: c("#8f9498", 0.6), panCover: c("#c0c4c7", 0.45),
    canopyGlass: { color: "#3c4652", metallic: 0.3, roughness: 0.08, glass: true },
    // the eye lamps: a dark housing, a pale lens
    lampEye: c("#202328", 0.25), lampLens: { color: "#b9c1c8", metallic: 0.2, roughness: 0.1, glass: true },
    // the skirt panels between the bogies and their grilles
    underG: c("#cfd2d3", 0.55), grille: c("#55595d", 0.6),
  },
  bands: [[0, BAND[0], "white"], [BAND[0], BAND[1], "blue"], [BAND[1], 9, "white"]],
  roof: "roofG", skirt: "skirtG", number: "CRH2E-2122",
  endSweeps: [
    // the band on the cab side: its top edge falling forward to the point at its foot
    { mat: "blue", front: [[BAND[0], BAND_POINT], [BAND[1], BAND_FULL]], back: [[BAND[0], J + 0.3], [BAND[1], J + 0.3]], face: true },
  ],
};

/** The seat car's large windows (one for two rows of seats, 1.5 m wide, 1.92 m apart) behind the doors and a short one, then the blank rear end. */
const endWindows: Array<[number, number]> = [...Array.from({ length: 5 }, (_, i): [number, number] => [11.35 + 1.92 * i - J, 12.85 + 1.92 * i - J]), [20.93 - J, 21.7 - J]];

/** The intermediate car's body: 25.0 m over the couplers less the gaps. */
const MID_BODY = 25.0 - 0.5;
/** d on the sleeper's body from e, measured from its rear (door) end's coupling plane. */
const fromRear = (e0: number, e1: number): [number, number] => [MID_BODY + 0.25 - e1, MID_BODY + 0.25 - e0];
/**
 * The soft sleeper (car 15's photograph, both sides alike within the measurement): one door at its rear
 * end, a display high over the first window, ten compartment windows 1.22 m wide at a 1.99 m pitch, a
 * short window at the front end.
 */
const sleeperWindows: Array<[number, number]> = [...Array.from({ length: 10 }, (_, i) => fromRear(2.52 + 1.99 * i, 3.74 + 1.99 * i)), fromRear(22.25, 22.97)].reverse();

export const CRH2E: ShinkansenSeries = {
  ...CRH2A,
  cabFace: CRH2E_FACE,
  // the windows' rounded corners (every photograph)
  windowCornerR: 0.08,
  layout: {
    end: { doors: [[DOOR[0] - J, DOOR[1] - J, 1]], windows: endWindows },
    middle: { doors: [[...fromRear(0.45, 1.3), -1]], windows: sleeperWindows },
  },
  // the destination displays high over the first window
  sidePanels: {
    end: [{ d: [11.5, 12.1], y: [2.9, 3.06], kind: "window" }],
    middle: [{ d: (([a, b]) => [a + 0.25, b + 0.25] as const)(fromRear(2.85, 3.46)), y: [2.95, 3.11], kind: "window" }],
  },
  // the Tp cars 4 and 13 of sixteen carry the pantographs: in eight cars the fourth and fifth
  pantographCars: (n) => (n === 8 ? [3, 4] : undefined),
  liveries: { crh: LIVERY },
  fittings: (m, b, X, car) => {
    CRH2A.fittings!(m, b, X, car);
    if (car.end) m.scope("crew door", () => crewDoor(m, b, X));
    // the skirts between the bogies: light grey panels down to 0.3 m with dark grilles (over the CRH2A's dark box)
    m.scope("skirt panels", () => {
      const [x0, x1] = [X(car.trucks[1]! - 2.6) - 0.02, X(car.trucks[0]! + 2.6) + 0.02], [y0, y1] = [CRH2A.B - 0.36, CRH2A.B - 0.01], z = 1.4;
      block(m, "underG", x0, x1, y0, y1, -z, z);
      const n = 4, len = 1.2, pitch = (x1 - x0) / n;
      for (let i = 0; i < n; i++) {
        const xc = x0 + pitch * (i + 0.5);
        for (const sd of [1, -1]) block(m, "grille", xc - len / 2, xc + len / 2, y0 + 0.06, y1 - 0.08, sd > 0 ? z : -z - 0.01, sd > 0 ? z + 0.01 : -z);
      }
    });
  },
  // 9,600 kW from eight motor cars of sixteen, given as each car's share
  weight: { end: 46, middle: 45 }, power: 600, maxspeed: 250,
};
