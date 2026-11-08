// The EMD GP9 (1954), drawn on its own from photographs (assets/emd-gp9/): the
// high short hood with its end faces (twin headlights between the two number
// boards, class lights, the ladder of grab irons), the cab with its single
// sliding side window and tall windscreens beside the short hood, the long hood's
// doors, louvres and the three radiator grilles under the two roof fans, the
// dynamic brake blister on the roads that ordered it, the frame dropping between
// the trucks, single-rail walkways, corner steps, and the Blomberg B trucks with
// their journal-box coils and elliptic bolster springs. The measures come from
// the published figures and a near side-on photograph of UP 211 (52 px/m);
// docs/models/us-diesels.md. usDiesels.ts registers the design and keeps its
// builder names; the hood unit kit (usHoodKit.ts) lends its sweeps, decals,
// lettering, coupler and the distant model.

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { coil, tubeX, type Band } from "./cd163.ts";
import { block, exhaust, extrude, horn, paint, plate, roofFan, side, tankX } from "./dieselParts.ts";
import { US_PALETTE, decalX, decalZ, endText, knuckleCoupler, paintedSweep, sideText, usHoodLod, type Paint, type UsHoodSpec, type UsLivery } from "./usHoodKit.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;

// ---------------------------------------------------------------------------
// Measures. Published: 56 ft 2 in over the couplers, 31 ft truck centres, 9 ft
// wheelbase, 40 in wheels, hood 13 ft 11 in and cab 14 ft 6 in over the rail.
// Measured on UP 211's side (truck centres as the scale): the long hood's end
// 7.70 m behind the middle, the cab 2.96 - 4.82 m, the short hood's face at
// 6.65 m, the deck 1.58 m and the sill's foot 1.15 m over the rail.

export const GP9_BODY: UsHoodSpec = {
  length: ft(56, 2), endSill: 8.0, deck: 1.58, sillBottom: 1.15, deckHalf: 1.56,
  hood: { x0: -7.7, x1: 2.96, half: 1.08, top: ft(13, 11), r: 0.08 },
  front: { kind: "highHood", x0: 4.82, x1: 6.65 },
  cab: { x0: 2.96, x1: 4.82, half: 1.53, top: ft(14, 6), kind: "classic" },
  radiator: { x0: -6.33, x1: -4.06, kind: "grilles", fans: [-5.78, -4.6], fanR: 0.55 },
  exhaustX: -1.1,
  trucks: {
    centre: ft(31) / 2, sideFrame: "blomberg",
    spec: { axles: [-ft(4, 6), ft(4, 6)], wheelR: ft(0, 20), frameHalf: 1.72, frameTop: 0.98, frameBottom: 0.36, frameZ: [0.92, 1.06], primary: "coil", secondary: [], secondaryZ: 1.0, bolster: 1.15 },
  },
  tank: { x0: -0.7, x1: 2.75, y0: 0.5, half: 1.2 },
  ditchLights: false,
};

/** The generator's two louvre columns behind the cab (UP 211). */
const GP9_GEN_LOUVRES: ReadonlyArray<readonly [number, number]> = [[0.97, 1.42], [1.47, 1.92]];

/** The step wells cut into the side sills at each corner: length from the end sill, inner wall's |z|. */
const GP9_WELL = { len: 0.72, z: 0.94 };

/** The dynamic brake blister over the engine (PRR 7048, ATSF 2879): x span, rise over the hood. */
const GP9_BLISTER = { x0: -3.36, x1: 0.7, rise: 0.45, half: 0.95 };

// ---------------------------------------------------------------------------
// Paint

export interface Gp9Livery extends UsLivery {
  /** The dynamic brake blister over the engine. */
  dynamicBrake: boolean;
  /** The railroad's name: centre along the long hood, letter width and gap. */
  letterX: number;
  letterW: number;
  letterGap: number;
  /** The running number under the cab's side window: base above the deck, height. */
  cabNumber: readonly [number, number];
  /** The number boards' face and figures. */
  board: string;
  boardText: string;
  /** The end railings and the steps' grab irons (often in safety paint). */
  endRails: string;
  /** A small running number on the long hood's rear corner: x centre, base above the deck, height. */
  hoodNumber?: readonly [number, number, number];
}

const C = {
  upYellow: paint("#f4b92a"), upGrey: paint("#9fa2a3"), upRed: paint("#b5202b"), upTruck: paint("#6b6e70", 0.8),
  prrGreen: paint("#1e2d24"), prrBuff: paint("#d6b768"), prrSafety: paint("#e2b833"),
  atsfBlue: paint("#1f3d7a"), atsfYellow: paint("#f1c21c"),
  truckBlack: paint("#242527", 0.85), boardDark: paint("#1d1e20", 0.5), brass: paint("#b8953a", 0.35),
};
const pick = (...names: Array<keyof typeof C>) => Object.fromEntries(names.map((n) => [n, C[n]]));

/** Union Pacific as on UP 211: armour yellow to the red stripe 2 m over the deck, harbour mist grey above, grey frame. */
function unionPacific(): Gp9Livery {
  const bands: Band[] = [[0, 3.49, "upYellow"], [3.49, 3.56, "upRed"], [3.56, 9, "upGrey"]];
  return {
    title: "Union Pacific", railroad: "UNION PACIFIC", letterH: 0.33, letterY: 1.22, number: "150",
    palette: pick("upYellow", "upGrey", "upRed", "upTruck"),
    body: bands, cab: bands, ends: bands, roof: "upGrey",
    frame: "upGrey", sillStripe: [0.03, 0.16, "upRed"], trucks: "upTruck", pilot: "upGrey",
    letter: "upRed", numberMat: "upRed", rails: "upYellow",
    dynamicBrake: false, letterX: -3.62, letterW: 0.2, letterGap: 0.19, cabNumber: [0.1, 0.27],
    board: "numberBoard", boardText: "black", endRails: "upYellow", hoodNumber: [-6.85, 0.69, 0.28],
  };
}

/** Pennsylvania as on 7048 and 7000: Brunswick green all over, buff letters spaced wide, safety-yellow end rails. */
function pennsylvania(): Gp9Livery {
  return {
    title: "Pennsylvania", railroad: "PENNSYLVANIA", letterH: 0.3, letterY: 1.27, number: "7006",
    palette: pick("prrGreen", "prrBuff", "prrSafety", "truckBlack", "boardDark"),
    body: [[0, 9, "prrGreen"]], roof: "prrGreen", frame: "prrGreen",
    trucks: "truckBlack", pilot: "prrGreen", letter: "prrBuff", numberMat: "prrBuff", rails: "prrGreen",
    dynamicBrake: true, letterX: -1.62, letterW: 0.19, letterGap: 0.31, cabNumber: [0.9, 0.31],
    board: "boardDark", boardText: "white", endRails: "prrSafety",
  };
}

/** Santa Fe's 1960s freight scheme as on 2879: blue, yellow hood ends, a yellow stripe along the hoods and cab, yellow sill. */
function santaFe(): Gp9Livery {
  const bands: Band[] = [[0, 3.5, "atsfBlue"], [3.5, 3.56, "atsfYellow"], [3.56, 9, "atsfBlue"]];
  return {
    title: "Santa Fe", railroad: "SANTA FE", letterH: 0.72, letterY: 0.66, number: "2894",
    palette: pick("atsfBlue", "atsfYellow", "truckBlack", "boardDark"),
    body: bands, cab: bands, ends: [[0, 9, "atsfYellow"]], roof: "atsfBlue",
    frame: "truckBlack", sillStripe: [0, 0.43, "atsfYellow"], trucks: "truckBlack", pilot: "truckBlack",
    letter: "atsfYellow", numberMat: "atsfYellow", rails: "atsfYellow",
    dynamicBrake: true, letterX: -3.75, letterW: 0.46, letterGap: 0.2, cabNumber: [1.18, 0.3],
    board: "boardDark", boardText: "white", endRails: "atsfYellow",
  };
}

export const GP9_PAINT: Record<string, Gp9Livery> = {
  unionPacific: unionPacific(),
  pennsylvania: pennsylvania(),
  santaFe: santaFe(),
};

// ---------------------------------------------------------------------------
// Helpers

function matAt(bands: readonly Band[], y: number): string {
  for (const b of bands) if (y >= b[0] - 1e-9 && y < b[1] - 1e-9) return b[2];
  return bands[bands.length - 1]![2];
}

/** The section of a hood: a box with chamfered roof corners, `half` wide, `top` high, from the deck. */
function hoodSection(deck: number, half: number, top: number, r: number): Array<[number, number]> {
  return [[-half, deck], [half, deck], [half, top - r], [half - r, top], [-(half - r), top], [-half, top - r]];
}

/** Louvres on the side wall z = s * zw: a dark recess with body-painted slats across it. */
function louvres(m: MeshBuilder, bands: readonly Band[], s: number, zw: number, x0: number, x1: number, y0: number, y1: number, pitch = 0.075): void {
  decalZ(m, "louvre", s * (zw + 0.004), s, x0, x1, y0, y1);
  for (let y = y0 + pitch * 0.6; y < y1 - pitch * 0.3; y += pitch) decalZ(m, matAt(bands, y), s * (zw + 0.008), s, x0 + 0.02, x1 - 0.02, y, y + pitch * 0.45);
}

/** A grab iron standing off a vertical face: the bar from a to b with two legs back to the face (offset `back`). */
function grab(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, back: Vec3): void {
  m.rod(mat, a, b, 0.016, 4);
  for (const p of [a, b]) m.rod(mat, p, [p[0] + back[0], p[1] + back[1], p[2] + back[2]], 0.014, 4, false);
}

// ---------------------------------------------------------------------------
// The design

export function buildGp9(l: Gp9Livery): MeshBuilder {
  const s = GP9_BODY;
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette, brass: C.brass });
  m.scope("frame", () => frame(m, s, l));
  m.scope("long hood", () => longHood(m, s, l));
  m.scope("front", () => shortHood(m, s, l));
  m.scope("cab", () => cab(m, s, l));
  m.scope("walkways", () => walkways(m, s, l));
  m.scope("trucks", () => {
    m.scope("front truck", () => blomberg(m, s.trucks.centre, l));
    m.scope("rear truck", () => blomberg(m, -s.trucks.centre, l));
  });
  m.scope("underframe", () => underframe(m, s, l));
  return m;
}

/** The distant model: the kit's hood unit LOD on the GP9's measured body. */
export function gp9Lod(l: Gp9Livery): MeshBuilder {
  return usHoodLod(GP9_BODY, l);
}

function frame(m: MeshBuilder, s: UsHoodSpec, l: Gp9Livery): void {
  const L = s.endSill;
  m.scope("deck", () => {
    block(m, "walk", -L, L, s.deck - 0.04, s.deck, -s.deckHalf, s.deckHalf);
    // the centre sill full length; the side sills stop at the step wells cut into each corner
    const core: Ring = [[-GP9_WELL.z, s.sillBottom], [GP9_WELL.z, s.sillBottom], [GP9_WELL.z, s.deck - 0.04], [-GP9_WELL.z, s.deck - 0.04]];
    m.sweep(l.frame, "x", core, -L, core, L);
    for (const sd of [-1, 1]) {
      const [z0, z1] = side(sd, GP9_WELL.z, s.deckHalf);
      const sill: Ring = [[z0, s.sillBottom], [z1, s.sillBottom], [z1, s.deck - 0.04], [z0, s.deck - 0.04]];
      m.sweep(l.frame, "x", sill, -L + GP9_WELL.len, sill, L - GP9_WELL.len);
    }
  });
  // the side sill drops 0.22 m deeper between the trucks, sloping up at each end
  m.scope("sill drop", () => {
    const b = s.sillBottom;
    const prof: Ring = [[-2.95, b + 0.02], [2.9, b + 0.02], [2.62, b - 0.22], [-2.67, b - 0.22]];
    for (const sd of [-1, 1]) {
      const [a0, a1] = side(sd, s.deckHalf - 0.09, s.deckHalf - 0.005);
      m.sweep(l.frame, "z", prof, a0, prof, a1);
    }
  });
  if (l.sillStripe)
    m.scope("sill stripe", () => {
      const [a, b, mat] = l.sillStripe!;
      for (const sd of [-1, 1]) decalZ(m, mat, sd * (s.deckHalf + 0.004), sd, -L + GP9_WELL.len + 0.01, L - GP9_WELL.len - 0.01, s.deck - b, s.deck - a);
    });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the pilot plate between the step wells, leaning back to the rail clearance
      m.scope("pilot", () => {
        const foot = 0.17, top = s.sillBottom;
        const sec: Ring = e > 0
          ? [[L - 0.32, foot], [L - 0.1, foot], [L, top], [L - 0.32, top]]
          : [[-L + 0.32, foot], [-L + 0.32, top], [-L, top], [-L + 0.1, foot]];
        m.sweep(l.pilot, "z", sec, -0.9, sec, 0.9);
      });
      m.scope("coupler", () => knuckleCoupler(m, e, L, s.length / 2, 0.88));
      m.scope("hoses", () => {
        for (const z of [-0.42, 0.42]) {
          const x0 = e * (L - 0.02), x1 = e * (L + 0.18);
          m.loft("hose", ngon(6, 0.03, 0, x0, z), 0.5, ngon(6, 0.03, 0, x1, z), 0.82);
        }
        // the multiple-unit hoses and the jumper receptacle on the end sill
        for (const z of [-0.68, 0.68]) m.loft("rubber", ngon(6, 0.025, 0, e * (L - 0.02), z), 0.62, ngon(6, 0.025, 0, e * (L + 0.1), z), 0.95);
        block(m, "black", ...along(L - 0.01, L + 0.06), s.sillBottom + 0.08, s.sillBottom + 0.22, 0.25, 0.4);
      });
      // the corner steps: three treads between two stringers hung in each step well
      m.scope("steps", () => {
        const w = GP9_WELL.len;
        for (const sd of [-1, 1]) {
          const z: [number, number] = side(sd, GP9_WELL.z + 0.02, s.deckHalf - 0.03);
          for (const y of [0.46, 0.82, 1.18]) block(m, "steel", ...along(L - w + 0.05, L - 0.05), y, y + 0.03, ...z);
          for (const xx of [L - w + 0.04, L - 0.04]) block(m, l.frame, ...along(xx - 0.02, xx + 0.02), 0.4, s.deck - 0.04, ...z);
          // the grab irons each side of the well, up to the railing
          for (const xx of [L - w - 0.02, L - 0.02]) m.rod(l.endRails, [e * xx, 0.58, sd * (s.deckHalf + 0.02)], [e * xx, s.deck + 0.98, sd * (s.deckHalf + 0.02)], 0.018, 6);
        }
      });
    });
}

/** A hood end face at x = e * xf: twin headlights between the two number boards, class lights, the ladder. */
function hoodEnd(m: MeshBuilder, s: UsHoodSpec, l: Gp9Livery, e: number, xf: number): void {
  const top = s.hood.top;
  const x = e * xf;
  const out = (d: number): [number, number] => (e > 0 ? [xf - 0.002, xf + d] : [-xf - d, -xf + 0.002]);
  m.scope("lamps", () => {
    for (const y of [top - 0.25, top - 0.5]) {
      extrude(m, "black", "x", ngon(10, 0.13, 0, 0, y), out(0.09));
      extrude(m, "lampHead", "x", ngon(10, 0.1, 0, 0, y), e > 0 ? [xf + 0.09, xf + 0.1] : [-xf - 0.1, -xf - 0.09]);
    }
  });
  m.scope("number boards", () => {
    const y0 = top - 0.56, y1 = top - 0.3;
    for (const sd of [-1, 1]) {
      const [z0, z1] = side(sd, 0.2, 0.92);
      block(m, "black", ...out(0.035), y0 - 0.025, y1 + 0.025, z0 - 0.025, z1 + 0.025);
      decalX(m, l.board, e * (xf + 0.038), e, z0, z1, y0, y1);
      endText(m, l.boardText, l.number, e, xf + 0.042, sd * 0.56, y0 + 0.06, 0.15, 0.085, 0.03);
    }
  });
  m.scope("class lights", () => {
    for (const sd of [-1, 1]) extrude(m, "lampRed", "x", ngon(8, 0.055, 0, sd * 0.86, top - 0.15), out(0.06));
  });
  m.scope("ladder", () => {
    const zc = e * 0.5;
    for (let i = 0; i < 5; i++) {
      const y = top - 0.74 - i * 0.33;
      grab(m, l.rails, [x + e * 0.07, y, zc - 0.18], [x + e * 0.07, y, zc + 0.18], [-e * 0.07, 0, 0]);
    }
  });
}

function longHood(m: MeshBuilder, s: UsHoodSpec, l: Gp9Livery): void {
  const h = s.hood, r = s.radiator, top = h.top;
  const p: Paint = { bands: l.body, ends: l.ends, roofFrom: top - h.r * 0.5, roof: l.roof };
  m.scope("hood", () => paintedSweep(m, "x", hoodSection(s.deck, h.half, top, h.r), h.x0, h.x1, p, [-1]));
  m.scope("radiator grilles", () => {
    // three square grilles high on each side at the rear, under the two fans
    const w = (r.x1 - r.x0 - 0.16) / 3;
    for (const sd of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const x0 = r.x0 + i * (w + 0.08);
        decalZ(m, "louvre", sd * (h.half + 0.004), sd, x0, x0 + w, top - 0.54, top - 0.1);
        for (let k = 1; k < 6; k++) decalZ(m, "grille", sd * (h.half + 0.008), sd, x0 + (w * k) / 6 - 0.012, x0 + (w * k) / 6 + 0.012, top - 0.52, top - 0.12);
        decalZ(m, "grille", sd * (h.half + 0.008), sd, x0 + 0.02, x0 + w - 0.02, top - 0.33, top - 0.31);
      }
  });
  m.scope("louvres", () => {
    for (const sd of [-1, 1]) {
      const zw = h.half;
      // the battery box vent at the rear corner
      louvres(m, l.body, sd, zw, -6.42, -6.01, 2.71, 3.18);
      // the engine room's louvred doors: three columns of two panels
      for (let i = 0; i < 3; i++) {
        const x0 = -1.17 + i * 0.587;
        louvres(m, l.body, sd, zw, x0 + 0.06, x0 + 0.527, 2.93, 3.42);
        louvres(m, l.body, sd, zw, x0 + 0.06, x0 + 0.527, 2.36, 2.85);
      }
      // the generator's louvres behind the cab and the air intake grille above them
      for (let i = 0; i < 2; i++) louvres(m, l.body, sd, zw, GP9_GEN_LOUVRES[i]![0], GP9_GEN_LOUVRES[i]![1], 2.06, 2.96);
      decalZ(m, "louvre", sd * (zw + 0.004), sd, 0.95, 1.75, 3.68, 4.08);
      for (let k = 1; k < 7; k++) decalZ(m, "grille", sd * (zw + 0.008), sd, 0.95 + k * 0.114 - 0.012, 0.95 + k * 0.114 + 0.012, 3.7, 4.06);
    }
  });
  m.scope("fans", () => {
    for (const x of r.fans) roofFan(m, x, 0, top, r.fanR);
  });
  const db = l.dynamicBrake;
  if (db)
    m.scope("dynamic brake", () => {
      const b = GP9_BLISTER;
      const t = top + b.rise;
      const prof: Array<[number, number]> = [[b.x0, top], [b.x1, top], [b.x1, top + 0.22], [b.x1 - 0.42, t], [b.x0 + 0.28, t], [b.x0, top + 0.18]];
      paintedSweep(m, "z", prof, -b.half, b.half, { bands: l.body, ends: l.body, roofFrom: t - 0.02, roof: l.roof }, [-1, 1]);
      // the grids' air intake along each side and the blower fan on top
      for (const sd of [-1, 1]) {
        decalZ(m, "louvre", sd * (b.half + 0.004), sd, b.x0 + 0.55, b.x1 - 0.75, top + 0.06, t - 0.08);
        for (let x = b.x0 + 0.65; x < b.x1 - 0.8; x += 0.16) decalZ(m, "grille", sd * (b.half + 0.008), sd, x, x + 0.03, top + 0.08, t - 0.1);
      }
      roofFan(m, b.x0 + 0.9, 0, t, 0.42);
    });
  m.scope("exhaust", () => {
    const y0 = db ? top + GP9_BLISTER.rise - 0.02 : top - 0.02;
    exhaust(m, s.exhaustX, 0, y0, y0 + (db ? 0.16 : 0.24), 0.3, 0.62);
  });
  // the hood doors: a seam between each pair and a latch near each door's top
  m.scope("doors", () => {
    const edges: number[] = [];
    for (let k = -10; k <= 6; k++) edges.push(-1.17 + k * 0.587);
    for (const sd of [-1, 1]) {
      const zz = sd * (h.half + 0.004);
      for (const x of edges) {
        const gen = GP9_GEN_LOUVRES.some(([a, b]) => x > a - 0.02 && x < b + 0.02);
        if (gen) {
          decalZ(m, "black", zz, sd, x - 0.01, x + 0.01, s.deck + 0.1, 2.0);
          decalZ(m, "black", zz, sd, x - 0.01, x + 0.01, 3.02, 3.52);
        } else decalZ(m, "black", zz, sd, x - 0.01, x + 0.01, s.deck + 0.1, 3.52);
      }
      for (let i = 0; i + 1 < edges.length; i++) {
        const xc = (edges[i]! + edges[i + 1]!) / 2;
        if (xc > -1.2 && xc < 0.6) continue; // the louvred doors carry their latches below the panels
        decalZ(m, "black", zz, sd, xc - 0.06, xc + 0.06, 3.3, 3.35);
      }
    }
  });
  m.scope("lettering", () => {
    for (const sd of [-1, 1]) sideText(m, l.letter, l.railroad, sd, h.half + 0.012, l.letterX, s.deck + l.letterY, l.letterH, l.letterW, l.letterGap);
    if (l.hoodNumber) for (const sd of [-1, 1]) sideText(m, l.numberMat, l.number, sd, h.half + 0.012, l.hoodNumber[0], s.deck + l.hoodNumber[1], l.hoodNumber[2]);
  });
  m.scope("rear headlight", () => hoodEnd(m, s, l, -1, -h.x0));
}

function shortHood(m: MeshBuilder, s: UsHoodSpec, l: Gp9Livery): void {
  const f = s.front as { x0: number; x1: number };
  const h = s.hood, top = h.top;
  m.scope("short hood", () => paintedSweep(m, "x", hoodSection(s.deck, h.half, top, h.r), f.x0, f.x1, { bands: l.body, ends: l.ends, roofFrom: top - h.r * 0.5, roof: l.roof }, [1]));
  m.scope("doors", () => {
    for (const sd of [-1, 1]) {
      const zz = sd * (h.half + 0.004);
      for (const x of [f.x0 + 0.1, 5.72, f.x1 - 0.1]) decalZ(m, "black", zz, sd, x - 0.01, x + 0.01, s.deck + 0.1, 3.52);
      for (const xc of [(f.x0 + 5.72) / 2 + 0.05, (5.72 + f.x1) / 2]) decalZ(m, "black", zz, sd, xc - 0.06, xc + 0.06, 3.3, 3.35);
      louvres(m, l.body, sd, h.half, f.x0 + 0.22, f.x0 + 0.62, s.deck + 0.28, s.deck + 0.72);
    }
  });
  m.scope("headlight", () => hoodEnd(m, s, l, 1, f.x1));
  m.scope("horn", () => {
    block(m, "horn", 6.05, 6.15, top, top + 0.1, -0.05, 0.05);
    horn(m, 1, 6.1, 0.12, top + 0.22);
    horn(m, -1, 6.1, -0.12, top + 0.22);
  });
  m.scope("bell", () => {
    block(m, "black", 5.36, 5.44, top, top + 0.12, -0.55, -0.47);
    m.loft("brass", ngon(10, 0.13, 0, 5.4, -0.51), top + 0.12, ngon(10, 0.08, 0, 5.4, -0.51), top + 0.3);
    m.cap("brass", ngon(10, 0.13, 0, 5.4, -0.51), top + 0.12, false);
  });
}

function cab(m: MeshBuilder, s: UsHoodSpec, l: Gp9Livery): void {
  const c = s.cab, h = s.hood;
  const bands = l.cab ?? l.body;
  const wall: Paint = { bands, ends: bands, roofFrom: c.top - 0.12, roof: l.cabRoof ?? l.roof };
  const sec: Array<[number, number]> = [[-c.half, s.deck], [c.half, s.deck], [c.half, c.top - 0.26], [c.half - 0.07, c.top - 0.13], [c.half - 0.32, c.top - 0.04], [0.5, c.top], [-0.5, c.top], [-(c.half - 0.32), c.top - 0.04], [-(c.half - 0.07), c.top - 0.13], [-c.half, c.top - 0.26]];
  m.scope("shell", () => paintedSweep(m, "x", sec, c.x0, c.x1, wall));
  // the drip rail along each eave
  m.scope("gutter", () => {
    for (const sd of [-1, 1]) block(m, l.cabRoof ?? l.roof, c.x0 - 0.03, c.x1 + 0.03, c.top - 0.29, c.top - 0.25, ...side(sd, c.half - 0.01, c.half + 0.035));
  });
  // tall windscreens either side of the short hood, the rear windows either side of the long hood
  m.scope("windscreen", () => {
    for (const sd of [-1, 1]) {
      const [z0, z1] = side(sd, h.half + 0.07, c.half - 0.07);
      decalX(m, "rubber", c.x1 + 0.004, 1, z0, z1, 3.05, 4.08);
      decalX(m, "glass", c.x1 + 0.008, 1, z0 + 0.035, z1 - 0.035, 3.09, 4.04);
    }
    // wipers hanging from the windscreens' heads
    for (const sd of [-1, 1]) m.rod("black", [c.x1 + 0.02, 4.0, sd * 1.31], [c.x1 + 0.02, 3.62, sd * 1.24], 0.008, 4);
  });
  m.scope("rear windows", () => {
    for (const sd of [-1, 1]) {
      const [z0, z1] = side(sd, h.half + 0.07, c.half - 0.07);
      decalX(m, "rubber", c.x0 - 0.004, -1, z0, z1, 3.15, 4.0);
      decalX(m, "glass", c.x0 - 0.008, -1, z0 + 0.035, z1 - 0.035, 3.19, 3.96);
    }
  });
  // the sliding side window in two panes under a sun visor, the running number under it
  m.scope("side windows", () => {
    const xa = c.x0 + 0.57, xb = c.x0 + 1.55, xm = (xa + xb) / 2;
    for (const sd of [-1, 1]) {
      const zz = sd * (c.half + 0.004);
      decalZ(m, "rubber", zz, sd, xa, xb, 3.08, 3.82);
      decalZ(m, "glass", zz + sd * 0.004, sd, xa + 0.05, xm - 0.02, 3.13, 3.77);
      decalZ(m, "glass", zz + sd * 0.004, sd, xm + 0.02, xb - 0.05, 3.13, 3.77);
      block(m, matAt(bands, 3.9), xa - 0.06, xb + 0.06, 3.87, 3.9, ...side(sd, c.half - 0.01, c.half + 0.09));
      sideText(m, l.numberMat, l.number, sd, c.half + 0.008, xm, s.deck + l.cabNumber[0], l.cabNumber[1]);
    }
  });
  // grab irons up the cab's corners
  m.scope("grab irons", () => {
    for (const sd of [-1, 1])
      for (const x of [c.x0 + 0.1, c.x1 - 0.1]) {
        const z = sd * (c.half + 0.06);
        m.rod(l.rails, [x, s.deck + 0.35, z], [x, s.deck + 1.6, z], 0.016, 4);
        for (const y of [s.deck + 0.35, s.deck + 1.6]) m.rod(l.rails, [x, y, z], [x, y, sd * c.half], 0.014, 4, false);
      }
  });
}

function walkways(m: MeshBuilder, s: UsHoodSpec, l: Gp9Livery): void {
  const y = s.deck + 0.98, z = s.deckHalf - 0.03, L = s.endSill;
  // one rail on stanchions about every 1.25 m: behind the cab to the rear steps, beside the short hood to the front steps
  const runs: Array<[number, number]> = [[-L + 0.02, s.cab.x0 - 0.12], [s.cab.x1 + 0.12, L - 0.02]];
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      for (const [a, b] of runs) {
        const zc = sd * z;
        tubeX(m, l.rails, 0.02, a, y, zc, b, y, zc, 6);
        const n = Math.max(1, Math.round((b - a) / 1.25));
        for (let i = 0; i <= n; i++) {
          const x = a + ((b - a) * i) / n;
          if (Math.abs(Math.abs(x) - (L - 0.02)) < 0.05) continue; // the step's grab iron holds the end
          m.prism(l.rails, ngon(6, 0.022, 0, x, zc), s.deck, y);
        }
      }
      // the rail rising to the cab's rear corner
      m.rod(l.rails, [s.cab.x0 - 0.12, y, sd * z], [s.cab.x0 - 0.05, s.deck + 1.45, sd * z], 0.02, 6);
    });
  // the end railings across each platform, open over the coupler
  m.scope("end rails", () => {
    for (const e of [1, -1]) {
      const x = e * (L - 0.06);
      for (const sd of [-1, 1]) {
        m.rod(l.endRails, [x, y, sd * 0.5], [x, y, sd * (s.deckHalf + 0.02)], 0.02, 6);
        m.rod(l.endRails, [x, s.deck + 0.5, sd * 0.5], [x, s.deck + 0.5, sd * (s.deckHalf + 0.02)], 0.016, 6);
        m.prism(l.endRails, ngon(6, 0.022, 0, x, sd * 0.5), s.deck, y);
      }
    }
  });
}

/** A Blomberg B truck centred at xc: cast side frames with journal-box pedestals, coils beside each box, elliptic bolster springs. */
function blomberg(m: MeshBuilder, xc: number, l: Gp9Livery): void {
  const b = GP9_BODY.trucks.spec;
  const mat = l.trucks;
  m.bogie(() => {
    const N = 20;
    const R = b.wheelR, ay = R * Math.cos(Math.PI / N);
    const [fz0, fz1] = b.frameZ;
    for (const dx of b.axles)
      m.scope("wheelset", () => {
        const x = xc + dx;
        const axle = ngon(8, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -0.9, axle, 0.9);
        for (const sd of [-1, 1]) {
          extrude(m, "steel", "z", ngon(N, R, Math.PI / N, x, ay), side(sd, 0.665, 0.8));
          extrude(m, "wheel", "z", ngon(16, R * 0.82, 0, x, ay), side(sd, 0.8, 0.815));
        }
      });
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right frame" : "left frame", () => {
        const z = side(sd, fz0, fz1);
        // the top member, stepping down over the journal boxes at the ends
        const topO: Ring = [[-b.frameHalf, 0.86], [-1.15, 0.86], [-0.95, b.frameTop], [0.95, b.frameTop], [1.15, 0.86], [b.frameHalf, 0.86]];
        const topI: Ring = [[-b.frameHalf, 0.72], [-1.15, 0.72], [-0.95, 0.8], [0.95, 0.8], [1.15, 0.72], [b.frameHalf, 0.72]];
        plate(m, mat, topO.map(([x, y]) => [xc + x, y] as [number, number]), topI.map(([x, y]) => [xc + x, y] as [number, number]), ...z);
        // the arch under the bolster window, from the inner pedestals down to the spring plank
        const archO: Ring = [[-1.12, ay - 0.06], [-0.62, b.frameBottom], [0.62, b.frameBottom], [1.12, ay - 0.06]];
        const archI: Ring = [[-0.98, ay + 0.06], [-0.55, b.frameBottom + 0.1], [0.55, b.frameBottom + 0.1], [0.98, ay + 0.06]];
        plate(m, mat, archO.map(([x, y]) => [xc + x, y] as [number, number]), archI.map(([x, y]) => [xc + x, y] as [number, number]), ...z);
        // the window's columns
        for (const d of [-1, 1]) block(m, mat, xc + d * 0.62 - 0.06, xc + d * 0.62 + 0.06, b.frameBottom + 0.1, 0.8, ...z);
        for (const dx of b.axles) {
          const x = xc + dx;
          // the pedestal jaws each side of the journal box and the box with its lid
          for (const d of [-1, 1]) block(m, mat, x + d * 0.2 - 0.035, x + d * 0.2 + 0.035, ay - 0.22, 0.72, ...z);
          block(m, "bogie", x - 0.16, x + 0.16, ay - 0.2, ay + 0.2, ...side(sd, 0.82, fz1 + 0.03));
          extrude(m, "spring", "z", ngon(8, 0.11, Math.PI / 8, x, ay), side(sd, fz1 + 0.03, fz1 + 0.06));
          // the equaliser under the box and the coils standing on it each side
          block(m, mat, x - 0.4, x + 0.4, ay - 0.27, ay - 0.21, ...side(sd, fz0 + 0.02, fz1 - 0.02));
          for (const d of [-1, 1]) coil(m, "spring", x + d * 0.3, sd * ((fz0 + fz1) / 2), ay - 0.21, 0.72, 0.065, 2, 6);
          // the brake cylinder on the frame's outer face between box and window
          const bx = x - Math.sign(dx) * 0.5;
          extrude(m, "spring", "z", ngon(8, 0.08, Math.PI / 8, bx, 0.9), side(sd, fz1, fz1 + 0.12));
        }
        // the elliptic springs in the window, leaves stacked under the bolster
        const leaves = [0.32, 0.44, 0.54, 0.54, 0.44, 0.32];
        leaves.forEach((hw, i) => {
          const y = b.frameBottom + 0.12 + i * 0.05;
          block(m, "spring", xc - hw, xc + hw, y, y + 0.035, ...side(sd, fz0 + 0.02, fz1 - 0.02));
        });
      });
    m.scope("bolster", () => block(m, mat, xc - 0.28, xc + 0.28, 0.8, 1.06, -fz0 + 0.02, fz0 - 0.02));
    m.scope("transoms", () => {
      for (const d of [-1, 1]) block(m, mat, xc + d * 1.0 - 0.08, xc + d * 1.0 + 0.08, 0.62, 0.78, -fz0 + 0.02, fz0 - 0.02);
    });
    m.scope("traction motors", () => {
      for (const dx of b.axles) {
        const motor = ngon(10, 0.27, 0, xc + dx + (dx > 0 ? -0.5 : 0.5), ay + 0.04);
        m.sweep("bogie", "z", motor, -0.5, motor, 0.5);
      }
    });
  });
}

function underframe(m: MeshBuilder, s: UsHoodSpec, l: Gp9Livery): void {
  const t = s.tank;
  m.scope("fuel tank", () => {
    const top = s.sillBottom - 0.02, hw = t.half;
    const sec: Ring = [[-hw, top], [hw, top], [hw, t.y0 + 0.28], [hw - 0.1, t.y0 + 0.09], [hw - 0.3, t.y0], [-(hw - 0.3), t.y0], [-(hw - 0.1), t.y0 + 0.09], [-hw, t.y0 + 0.28]];
    m.sweep(l.frame, "x", sec, t.x0, sec, t.x1);
    for (const sd of [-1, 1]) {
      block(m, "steel", t.x1 - 0.5, t.x1 - 0.35, top - 0.3, top - 0.12, ...side(sd, hw, hw + 0.04));
      decalZ(m, "white", sd * (hw + 0.004), sd, (t.x0 + t.x1) / 2 - 0.25, (t.x0 + t.x1) / 2 + 0.25, top - 0.32, top - 0.2);
    }
  });
  m.scope("air reservoirs", () => {
    for (const sd of [-1, 1]) tankX(m, "tank", -2.9, -0.85, sd * 0.6, 0.66, 0.24);
  });
}
