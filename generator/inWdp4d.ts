// The Indian Railways WDP-4D (EMD JT46PACe, DLW / BLW 2010 - 2017), drawn on its
// own from photographs (assets/ir-wdp4d/): the twin-cab passenger diesel of the
// WDP-4 family. A full-width cab at each end, its face upright to the screens,
// the two big screens behind their barred guards raked back under the arched
// roof, the twin headlight between the lamps of the yellow band, the third lamp
// at the crown and the horn box over it; between the cabs the narrow hood with
// walkways and handrails along both sides, its top flared out to the cab's width
// over the radiator behind cab 2 (the big side grilles under the overhang) and
// over the equipment section behind cab 1 (its two round roof hatches); the deep
// frame, the headstocks with side buffers and the centre buffer coupler; the
// HTSC Co-Co bogies, the fuel tank and a box between them. The 2010s livery of
// the photos: the hood blue with a yellow and a white band, the cabs white with
// the yellow band carried round and narrowing to a point on the face, the blue
// band at the cab's foot. +X is cab 1 (the GT46PAC's original "F" end), -X
// cab 2 by the radiator. The hood unit kit (usHoodKit.ts) lends its painted
// sweeps, decals, lettering and the coupler. docs/models/india-trains.md.

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block, bogie, buffers, exhaust, extrude, horn, paint, roofFan, side, tankX, type BogieSpec } from "./dieselParts.ts";
import { lodBands, LOD_GLASS, type LodBand } from "./lodKit.ts";
import { locoLod, sideWindows, type LocoBox } from "./lodLocos.ts";
import { US_PALETTE, decalX, decalZ, endText, knuckleCoupler, paintedSweep, sideText, type Paint } from "./usHoodKit.ts";

// ---------------------------------------------------------------------------
// Measures. Published (IR's parameter table, the WDP-4 family): 19.964 m over
// the headstocks, 21.244 m over the buffers, 3.127 m wide over the walkways,
// 4.201 m high, 1,092 mm wheels, 123 t. Along the side of 40086, a
// one-dimensional projective fit on the headstocks and the two bogie frames
// (the far end about a fifth smaller): cab 2 1.95 m long, the radiator
// section to 4.79 m behind the middle, the hood to 3.51 m ahead of it, the
// equipment section with its hatches at 4.12 and 5.71 m, cab 1 from 7.79 m;
// the bogie centres +-6.35 m, axles 2.06 m apart; the fuel tank -2.88 to -0.34
// m, the box 1.32 - 2.84 m, the exhaust 2.6 m behind the middle. On the
// head-on face of 40517 (216 px/m from the face's 2.95 m; the buffer centres
// 1.956 m apart at 1.105 m): the cab's foot 1.6 m, the eaves 3.86 m and the
// arched roof's crown 4.12 m, the screens 2.93 - 3.74 m, 1.24 m wide each
// either side of a 0.16 m pillar, the twin headlight at 2.68 m, the marker
// lamps at 2.45 m, the yellow band 2.31 - 2.56 m at the corners narrowing to a
// point 0.35 m from the middle, the blue foot band to 1.98 m, the number plates
// 2.08 - 2.26 m, the horn box to 4.37 m.

const HEAD = 19.964 / 2; // the headstock faces and the cab faces over them
const BUFFER = 21.244 / 2; // the buffer heads and the coupler face
const DECK = 1.6, SILL = 1.2, DECK_HALF = 3.127 / 2;
const CAB = { len1: 2.19, len2: 1.95, half: 1.475, eave: 3.86, top: 4.12, upright: 2.9, rake: 0.22, rakeTop: 3.8 };
/** The cab's section: [y, half width] up the side and over the arched roof. */
const CAB_HW: ReadonlyArray<readonly [number, number]> = [[DECK, CAB.half], [CAB.eave - 0.06, CAB.half], [CAB.eave + 0.04, 1.43], [3.98, 1.33], [4.06, 1.1], [CAB.top, 0.72]];
const HOOD = { x0: -4.79, x1: 3.51, half: 1.1, top: 4.05, r: 0.15 };
/** The flared sections: x span, where the overhang starts and ends (y), its half width, the top. */
const RAD = { x0: -HEAD + CAB.len2, x1: HOOD.x0, y0: 2.88, y1: 3.25, half: 1.45, top: 4.1 };
const EQUIP = { x0: HOOD.x1, x1: HEAD - CAB.len1, y0: 3.5, y1: 3.72, half: 1.42, top: 4.07 };
const EXHAUST_X = -2.6;
const WHEEL_R = 1.092 / 2;
const TRUCK_C = 6.35;
const BUFFER_Y = 1.105, BUFFER_SPACING = 1.956;
const NUMBER = "40086";

const TRUCK: BogieSpec = {
  axles: [-2.06, 0, 2.06], wheelR: WHEEL_R, frameHalf: 2.8, frameTop: 1.12, frameBottom: 0.6,
  frameZ: [0.92, 1.06], primary: "coil", secondary: [-0.95, 0.95], secondaryZ: 1.12, bolster: SILL,
};

// ---------------------------------------------------------------------------
// Paint: the blue hood with the yellow and white bands, the white cabs

const PALETTE = {
  ...US_PALETTE,
  wBlue: paint("#2357ad"),
  wWhite: paint("#ecebe2"),
  wYellow: paint("#f0b21a"),
  wRed: paint("#c2262d"),
  wFrame: paint("#232527", 0.8),
  radGrille: paint("#9a9fa3", 0.6),
};

const HOOD_BANDS: Band[] = [[0, 2.31, "wBlue"], [2.31, 2.58, "wYellow"], [2.58, 2.86, "wWhite"], [2.86, 9, "wBlue"]];
const CAB_SIDE: Band[] = [[0, 1.82, "wBlue"], [1.82, 2.31, "wWhite"], [2.31, 2.58, "wYellow"], [2.58, 9, "wWhite"]];
const CAB_FACE: Band[] = [[0, 1.98, "wBlue"], [1.98, 9, "wWhite"]];
const CAB_CORNER: Band[] = [[0, 1.98, "wBlue"], [1.98, 2.31, "wWhite"], [2.31, 2.58, "wYellow"], [2.58, 9, "wWhite"]];
/** The chamfer of the face's upright corners. */
const CORNER = 0.12;

/** The cab of end e: its x span (rear wall, face). */
const cabX = (e: number): [number, number] => (e > 0 ? [HEAD - CAB.len1, HEAD] : [-HEAD + CAB.len2, -HEAD]);
/** The face's x at height y on end e (upright, raked back over the screens, then rounding to the crown). */
function faceX(e: number, y: number): number {
  const d = y <= CAB.upright ? 0
    : y <= CAB.rakeTop ? (CAB.rake * (y - CAB.upright)) / (CAB.rakeTop - CAB.upright)
    : CAB.rake + 0.3 * ((y - CAB.rakeTop) / (CAB.top - CAB.rakeTop)) ** 1.5;
  return e * (HEAD - d);
}
const bandAt = (bands: readonly Band[], y: number): string => bands.find((b) => y >= b[0] && y < b[1])?.[2] ?? bands[bands.length - 1]![2];

/** The cab's heights: its section's corners, the bands' edges and the face's breaks. */
const CAB_YS = [...new Set([...CAB_HW.map((p) => p[0]), 1.82, 1.98, 2.31, 2.58, CAB.upright, CAB.rakeTop, 3.96, 4.05])].sort((a, b) => a - b);
function cabHalf(y: number): number {
  for (let i = 1; i < CAB_HW.length; i++) {
    const [y0, h0] = CAB_HW[i - 1]!, [y1, h1] = CAB_HW[i]!;
    if (y <= y1 + 1e-9) return h0 + ((h1 - h0) * (y - y0)) / (y1 - y0);
  }
  return CAB_HW[CAB_HW.length - 1]![1];
}

// ---------------------------------------------------------------------------

export function buildWdp4d(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("frame", () => frame(m));
  m.scope("hood", () => hood(m));
  for (const e of [1, -1]) m.scope(e > 0 ? "cab 1" : "cab 2", () => cab(m, e));
  m.scope("walkways", () => walkways(m));
  m.scope("trucks", () => {
    m.scope("front truck", () => bogie(m, TRUCK_C, TRUCK));
    m.scope("rear truck", () => bogie(m, -TRUCK_C, TRUCK));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}

function frame(m: MeshBuilder): void {
  m.scope("deck", () => {
    block(m, "walk", -HEAD, HEAD, DECK - 0.04, DECK, -DECK_HALF, DECK_HALF);
    const sill: Ring = [[-DECK_HALF, SILL], [DECK_HALF, SILL], [DECK_HALF, DECK - 0.04], [-DECK_HALF, DECK - 0.04]];
    m.sweep("wFrame", "x", sill, -HEAD, sill, HEAD);
    // the white edge of the walkway
    for (const sd of [-1, 1]) decalZ(m, "wWhite", sd * (DECK_HALF + 0.004), sd, -HEAD + 0.03, HEAD - 0.03, DECK - 0.12, DECK - 0.04);
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the headstock: a deep plate across the end below the cab, the pilot leaning back under it
      m.scope("headstock", () => block(m, "wFrame", ...along(HEAD - 0.34, HEAD), 0.7, SILL, -DECK_HALF + 0.02, DECK_HALF - 0.02));
      m.scope("pilot", () => {
        const sec: Ring = e > 0 ? [[HEAD - 0.4, 0.14], [HEAD - 0.12, 0.14], [HEAD, 0.7], [HEAD - 0.4, 0.7]] : [[-HEAD + 0.4, 0.14], [-HEAD + 0.4, 0.7], [-HEAD, 0.7], [-HEAD + 0.12, 0.14]];
        m.sweep("wFrame", "z", sec, -1.35, sec, 1.35);
      });
      m.scope("buffers", () => buffers(m, e, HEAD, BUFFER, BUFFER_Y, "round", BUFFER_SPACING));
      m.scope("coupler", () => knuckleCoupler(m, e, HEAD, BUFFER, BUFFER_Y - 0.2));
      m.scope("hoses", () => {
        for (const z of [-0.45, 0.45]) m.loft("hose", ngon(6, 0.03, 0, e * (HEAD - 0.02), z), 0.55, ngon(6, 0.03, 0, e * (HEAD + 0.16), z), 0.95);
      });
      // the steps under the cab's front corners, the grab irons beside them
      m.scope("steps", () => {
        for (const sd of [-1, 1]) {
          const z: [number, number] = side(sd, DECK_HALF - 0.55, DECK_HALF - 0.04);
          for (const y of [0.5, 0.86, 1.22]) block(m, "steel", ...along(HEAD - 0.85, HEAD - 0.42), y, y + 0.03, ...z);
          for (const zz of z) block(m, "wFrame", ...along(HEAD - 0.87, HEAD - 0.4), 0.44, SILL, zz - 0.025, zz + 0.025);
          for (const xx of [HEAD - 0.92, HEAD - 0.35]) m.rod("handrail", [e * xx, DECK + 0.25, sd * (CAB.half + 0.06)], [e * xx, DECK + 1.25, sd * (CAB.half + 0.06)], 0.016, 6);
        }
      });
    });
}

function hood(m: MeshBuilder): void {
  const p: Paint = { bands: HOOD_BANDS, roofFrom: HOOD.top - HOOD.r * 0.5, roof: "wBlue" };
  const sec = [[-HOOD.half, DECK], [HOOD.half, DECK], [HOOD.half, HOOD.top - HOOD.r], [HOOD.half - HOOD.r, HOOD.top], [-(HOOD.half - HOOD.r), HOOD.top], [-HOOD.half, HOOD.top - HOOD.r]] as const;
  m.scope("long hood", () => paintedSweep(m, "x", sec, HOOD.x0, HOOD.x1, p, []));
  // the flared sections: the hood's width up to the overhang, the cab's width over it
  const flare = (f: typeof RAD) => [[-HOOD.half, DECK], [HOOD.half, DECK], [HOOD.half, f.y0], [f.half, f.y1], [f.half, f.top - 0.08], [f.half - 0.08, f.top], [-(f.half - 0.08), f.top], [-f.half, f.top - 0.08], [-f.half, f.y1], [-HOOD.half, f.y0]] as const;
  m.scope("radiator", () => {
    paintedSweep(m, "x", flare(RAD), RAD.x0, RAD.x1, { bands: HOOD_BANDS, roofFrom: RAD.top - 0.04, roof: "wBlue" }, [1]);
    // the radiator cores under the overhang, below the white band, in four frames
    for (const sd of [-1, 1]) {
      const zz = sd * (HOOD.half + 0.006);
      const n = 4, x0 = RAD.x0 + 0.15, x1 = RAD.x1 - 0.1, w = (x1 - x0) / n;
      for (let i = 0; i < n; i++) {
        const a = x0 + i * w + 0.05, b = x0 + (i + 1) * w - 0.05;
        decalZ(m, "radGrille", zz, sd, a, b, DECK + 0.1, 2.56);
        for (let x = a + 0.08; x < b - 0.04; x += 0.11) decalZ(m, "louvre", zz + sd * 0.004, sd, x, x + 0.025, DECK + 0.14, 2.52);
      }
    }
    for (const x of [-7.25, -5.6]) roofFan(m, x, 0, RAD.top, 0.62);
  });
  m.scope("equipment section", () => {
    paintedSweep(m, "x", flare(EQUIP), EQUIP.x0, EQUIP.x1, { bands: HOOD_BANDS, roofFrom: EQUIP.top - 0.04, roof: "wBlue" }, [-1]);
    for (const sd of [-1, 1]) {
      const zz = sd * (HOOD.half + 0.006);
      // the intake grille just behind the hood, the vent slots under the overhang
      decalZ(m, "radGrille", zz, sd, EQUIP.x0 + 0.1, EQUIP.x0 + 0.85, DECK + 0.4, 2.9);
      for (let y = DECK + 0.48; y < 2.85; y += 0.1) decalZ(m, "louvre", zz + sd * 0.004, sd, EQUIP.x0 + 0.15, EQUIP.x0 + 0.8, y, y + 0.03);
      for (let i = 0; i < 4; i++) {
        const a = EQUIP.x0 + 1.05 + i * 0.75;
        decalZ(m, "louvre", zz, sd, a, a + 0.55, EQUIP.y0 - 0.3, EQUIP.y0 - 0.1);
      }
    }
    // the two round hatches on the roof
    for (const x of [4.12, 5.71]) {
      m.prism("wBlue", ngon(16, 0.5, 0, x, 0), EQUIP.top - 0.02, EQUIP.top + 0.1);
      m.prism("wBlue", ngon(16, 0.38, 0, x, 0), EQUIP.top + 0.1, EQUIP.top + 0.14);
    }
  });
  m.scope("exhaust", () => exhaust(m, EXHAUST_X, 0, HOOD.top - 0.02, HOOD.top + 0.16, 0.55, 0.7));
  // the hood doors: seams and latches down each side
  m.scope("doors", () => {
    const x0 = HOOD.x0 + 0.1, x1 = HOOD.x1 - 0.1;
    const n = Math.round((x1 - x0) / 1.2);
    const w = (x1 - x0) / n;
    for (const sd of [-1, 1])
      for (let i = 0; i <= n; i++) {
        const x = x0 + i * w;
        decalZ(m, "black", sd * (HOOD.half + 0.004), sd, x - 0.012, x + 0.012, DECK + 0.15, HOOD.top - HOOD.r - 0.12);
        if (i < n) decalZ(m, "black", sd * (HOOD.half + 0.004), sd, x + w / 2 - 0.05, x + w / 2 + 0.05, DECK + 0.95, DECK + 1.0);
      }
  });
  m.scope("lettering", () => {
    // red letters on a white panel over both bands
    for (const sd of [-1, 1]) {
      decalZ(m, "wWhite", sd * (HOOD.half + 0.005), sd, -1.6, 1.8, 2.31, 2.86);
      sideText(m, "wRed", "INDIAN RAILWAYS", sd, HOOD.half + 0.009, 0.1, 2.4, 0.36, 0.16, 0.06);
    }
  });
}

/** The cab's shell: plan rectangles stacked by height (the raked face, the arched roof), each face painted by its band. */
function cabShell(m: MeshBuilder, e: number, xr: number): void {
  const ctr: Vec3 = [(xr + e * HEAD) / 2, 2.8, 0];
  const quad = (mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let n: Vec3 = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
    const mid = [(a[0] + c[0]) / 2 - ctr[0], (a[1] + c[1]) / 2 - ctr[1], (a[2] + c[2]) / 2 - ctr[2]];
    if (n[0] * mid[0]! + n[1] * mid[1]! + n[2] * mid[2]! < 0) n = [-n[0], -n[1], -n[2]];
    m.facets(mat, [a, b, c, a, c, d], n);
  };
  for (let i = 0; i + 1 < CAB_YS.length; i++) {
    const y0 = CAB_YS[i]!, y1 = CAB_YS[i + 1]!, ym = (y0 + y1) / 2;
    const h0 = cabHalf(y0), h1 = cabHalf(y1), f0 = faceX(e, y0), f1 = faceX(e, y1);
    const roofy = ym > CAB.eave;
    const sideMat = roofy ? "wWhite" : bandAt(CAB_SIDE, ym);
    // the face's corners chamfered by CORNER, the yellow band carried round them
    const b0 = f0 - e * CORNER, b1 = f1 - e * CORNER;
    const cornerMat = roofy ? "wWhite" : bandAt(CAB_CORNER, ym);
    for (const sd of [-1, 1]) {
      quad(sideMat, [xr, y0, sd * h0], [b0, y0, sd * h0], [b1, y1, sd * h1], [xr, y1, sd * h1]);
      quad(cornerMat, [b0, y0, sd * h0], [f0, y0, sd * (h0 - CORNER)], [f1, y1, sd * (h1 - CORNER)], [b1, y1, sd * h1]);
    }
    quad(roofy ? "wWhite" : bandAt(CAB_FACE, ym), [f0, y0, -(h0 - CORNER)], [f0, y0, h0 - CORNER], [f1, y1, h1 - CORNER], [f1, y1, -(h1 - CORNER)]);
    quad(sideMat, [xr, y0, -h0], [xr, y0, h0], [xr, y1, h1], [xr, y1, -h1]);
  }
  const yt = CAB.top, ht = cabHalf(yt), ft = faceX(e, yt), bt = ft - e * CORNER;
  quad("wWhite", [xr, yt, -ht], [bt, yt, -ht], [bt, yt, ht], [xr, yt, ht]);
  quad("wWhite", [bt, yt, -ht], [ft, yt, -(ht - CORNER)], [ft, yt, ht - CORNER], [bt, yt, ht]);
}

function cab(m: MeshBuilder, e: number): void {
  const [xr] = cabX(e);
  const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
  m.scope("shell", () => cabShell(m, e, xr));
  // the yellow band on the face: full height at the corners, narrowing to a point toward the headlights
  m.scope("face band", () => {
    const x = e * (HEAD + 0.004);
    const pts: Vec3[] = [];
    for (const sd of [-1, 1]) pts.push([x, 2.31, sd * (CAB.half - CORNER)], [x, 2.31, sd * 0.35], [x, 2.58, sd * (CAB.half - CORNER)]);
    m.facets("wYellow", pts, [e, 0, 0]);
  });
  // the screens on the raked part, each behind its guard of upright bars, under a sun visor
  m.scope("windscreen", () => {
    const ya = 2.93, yb = 3.74;
    const n: Vec3 = [e * (CAB.rakeTop - CAB.upright), CAB.rake, 0];
    const q = (d: number, za: number, zb: number, y0: number, y1: number): Vec3[] => {
      const pts: Vec3[] = [[faceX(e, y0) + e * d, y0, za], [faceX(e, y0) + e * d, y0, zb], [faceX(e, y1) + e * d, y1, zb], [faceX(e, y1) + e * d, y1, za]];
      return [pts[0]!, pts[1]!, pts[2]!, pts[0]!, pts[2]!, pts[3]!];
    };
    for (const sd of [-1, 1]) {
      const [z0, z1] = side(sd, 0.08, 1.32);
      m.facets("black", q(0.005, z0, z1, ya, yb), n);
      m.facets("glass", q(0.01, z0 + 0.05, z1 - 0.05, ya + 0.05, yb - 0.05), n);
      const guard: Vec3[] = [];
      for (let k = 1; k < 12; k++) {
        const z = z0 + ((z1 - z0) * k) / 12;
        guard.push(...q(0.04, z - 0.008, z + 0.008, ya + 0.04, yb - 0.04));
      }
      guard.push(...q(0.04, z0 + 0.03, z1 - 0.03, ya + 0.02, ya + 0.05), ...q(0.04, z0 + 0.03, z1 - 0.03, yb - 0.05, yb - 0.02));
      m.facets("steel", guard, n);
    }
    // the visor over both screens
    const xv = Math.abs(faceX(e, yb + 0.04));
    block(m, "wWhite", ...along(xv - 0.02, xv + 0.1), yb + 0.03, yb + 0.08, -1.36, 1.36);
  });
  m.scope("headlights", () => {
    const y = 2.68;
    block(m, "black", ...along(HEAD - 0.002, HEAD + 0.07), y - 0.15, y + 0.15, -0.32, 0.32);
    for (const z of [-0.14, 0.14]) {
      extrude(m, "steel", "x", ngon(12, 0.13, 0, z, y), along(HEAD + 0.07, HEAD + 0.11));
      extrude(m, "lampHead", "x", ngon(12, 0.1, 0, z, y), along(HEAD + 0.11, HEAD + 0.12));
    }
    // the marker lamps at the band's corners
    for (const z of [-1.12, 1.12]) {
      block(m, "black", ...along(HEAD - 0.002, HEAD + 0.05), 2.35, 2.55, z - 0.11, z + 0.11);
      extrude(m, "lampHead", "x", ngon(10, 0.075, 0, z, 2.45), along(HEAD + 0.05, HEAD + 0.07));
    }
    // the tail lamps low on the face
    for (const z of [-1.2, 1.2]) extrude(m, "lampRed", "x", ngon(8, 0.06, 0, z, 1.78), along(HEAD - 0.002, HEAD + 0.03));
    // the third headlight at the crown, the horn box on the roof with its trumpets
    const yl = 3.92, xl = Math.abs(faceX(e, yl));
    block(m, "black", ...along(xl - 0.2, xl + 0.06), yl - 0.11, yl + 0.11, -0.13, 0.13);
    extrude(m, "lampHead", "x", ngon(10, 0.08, 0, 0, yl), along(xl + 0.06, xl + 0.075));
    block(m, "grille", ...along(HEAD - 1.2, HEAD - 0.5), CAB.top - 0.06, CAB.top + 0.22, -0.6, 0.6);
    for (const z of [-0.2, 0, 0.2]) horn(m, e, e * (HEAD - 0.75), z, CAB.top + 0.36);
  });
  m.scope("number plates", () => {
    const x = HEAD + 0.004;
    // seen from ahead: the class on the left, the number on the right
    endText(m, "wRed", "WDP4D", e, x, 0.72 * e, 2.1, 0.15, 0.09, 0.03);
    endText(m, "wRed", NUMBER, e, x, -0.68 * e, 2.1, 0.15, 0.09, 0.03);
  });
  m.scope("rear windows", () => {
    for (const sd of [-1, 1]) {
      decalX(m, "rubber", xr - e * 0.004, -e, ...side(sd, HOOD.half + 0.08, CAB.half - 0.08), 2.95, 3.7);
      decalX(m, "glass", xr - e * 0.008, -e, ...side(sd, HOOD.half + 0.11, CAB.half - 0.11), 2.98, 3.67);
    }
  });
  // the side window (three panes), the running number on a white patch in the band
  m.scope("side windows", () => {
    const xa = e * (HEAD - 0.6), xb = xr + e * 0.15;
    const [x0, x1] = [Math.min(xa, xb), Math.max(xa, xb)];
    for (const sd of [-1, 1]) {
      const zz = sd * (CAB.half + 0.004);
      decalZ(m, "rubber", zz, sd, x0, x1, 2.73, 3.67);
      const w = (x1 - x0) / 3;
      for (let k = 0; k < 3; k++) decalZ(m, "glass", zz + sd * 0.004, sd, x0 + k * w + 0.04, x0 + (k + 1) * w - 0.04, 2.78, 3.62);
      const xn = (x0 + x1) / 2;
      decalZ(m, "wWhite", zz, sd, xn - 0.5, xn + 0.5, 2.31, 2.58);
      sideText(m, "wRed", NUMBER, sd, CAB.half + 0.008, xn, 2.35, 0.2);
      sideText(m, "wRed", "WDP4D", sd, CAB.half + 0.006, xn, 2.06, 0.14);
    }
  });
}

function walkways(m: MeshBuilder): void {
  const y = DECK + 1.0, yMid = DECK + 0.5, z = DECK_HALF - 0.03;
  const a = -HEAD + CAB.len2 + 0.12, b = HEAD - CAB.len1 - 0.12;
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      const zc = sd * z;
      tubeX(m, "wBlue", 0.022, a, y, zc, b, y, zc, 6);
      tubeX(m, "wBlue", 0.016, a, yMid, zc, b, yMid, zc, 6);
      const n = Math.round((b - a) / 1.45);
      for (let i = 0; i <= n; i++) m.prism("wBlue", ngon(6, 0.024, 0, a + ((b - a) * i) / n, zc), DECK, y);
    });
}

function underframe(m: MeshBuilder): void {
  m.scope("fuel tank", () => {
    const x0 = -2.88, x1 = -0.34, top = SILL, y0 = 0.4, half = 1.3;
    const sec: Ring = [[-half, top], [half, top], [half, y0 + 0.3], [half - 0.3, y0], [-(half - 0.3), y0], [-half, y0 + 0.3]];
    m.sweep("wFrame", "x", sec, x0, sec, x1);
    for (const sd of [-1, 1]) block(m, "steel", x1 - 0.5, x1 - 0.35, top - 0.3, top - 0.12, ...side(sd, half, half + 0.04));
  });
  m.scope("equipment box", () => block(m, "wFrame", 1.32, 2.84, 0.6, SILL, -1.2, 1.2));
  m.scope("air reservoirs", () => {
    for (const sd of [-1, 1]) tankX(m, "tank", -0.2, 1.2, sd * 0.8, SILL - 0.24, 0.22);
  });
}

// ---------------------------------------------------------------------------
// The distant model

export function buildWdp4dLod(budget = 100): MeshBuilder {
  const bands = (src: readonly Band[], y1: number, roof: string): LodBand[] => [...lodBands(src, DECK, y1 - 0.12), [y1 - 0.12, y1, roof]];
  // one hood between the cabs; the flared tops over the radiator and the equipment section as boxes
  const hx0 = RAD.x0, hx1 = EQUIP.x1;
  const hoodShell = {
    y0: DECK, xc: (hx0 + hx1) / 2, tip: [[DECK, (hx1 - hx0) / 2], [HOOD.top, (hx1 - hx0) / 2]] as const,
    hw: [[DECK, HOOD.half], [HOOD.top - 0.12, HOOD.half], [HOOD.top, HOOD.half - 0.15]] as const,
    side: bands(HOOD_BANDS, HOOD.top, "wBlue"), roof: "wBlue", ends: [] as number[],
  };
  const cabShellLod = (e: number) => {
    const [xr] = cabX(e);
    const face = { tip: [[DECK, e * HEAD], [CAB.upright, e * HEAD], [CAB.top, faceX(e, CAB.top)]] as const, paint: bands(CAB_FACE, CAB.eave, "wWhite") };
    const rear = { tip: [[DECK, xr], [CAB.top, xr]] as const };
    const xa = e * (HEAD - 0.6), xb = xr + e * 0.15;
    return {
      y0: DECK, hw: [[DECK, CAB.half], [CAB.eave, CAB.half], [CAB.top, 1.0]] as const,
      side: bands(CAB_SIDE, CAB.eave, "wWhite"), end: bands(CAB_FACE, CAB.eave, "wWhite"), roof: "wWhite",
      ...(e > 0 ? { front: face, rear } : { front: rear, rear: face }),
      endWindows: [-1, 1].map((sd) => ({ u: sd > 0 ? [0.08, 1.32] as const : [-1.32, -0.08] as const, y: [2.93, 3.74] as const, mat: LOD_GLASS, ends: [e], optional: 0.3 })),
      sideWindows: sideWindows([{ u: [Math.min(xa, xb), Math.max(xa, xb)], y: [2.73, 3.67] }]),
    };
  };
  const boxes: LocoBox[] = [
    { name: "frame", mat: "wFrame", x: [-HEAD, HEAD], y: [SILL, DECK], w: DECK_HALF },
    { name: "radiator top", mat: "wBlue", x: [RAD.x0, RAD.x1], y: [RAD.y1, RAD.top], w: RAD.half, optional: 40 },
    { name: "equipment top", mat: "wBlue", x: [EQUIP.x0, EQUIP.x1], y: [EQUIP.y1, EQUIP.top], w: EQUIP.half, optional: 40 },
    { name: "fuel tank", mat: "wFrame", x: [-2.88, -0.34], y: [0.4, SILL], w: 1.3, top: false, optional: 35 },
    ...[-1, 1].map((e): LocoBox => ({ name: "headstock", mat: "wFrame", x: e > 0 ? [HEAD - 0.4, HEAD] : [-HEAD, -HEAD + 0.4], y: [0.14, SILL], w: DECK_HALF - 0.02, top: false, optional: 30 })),
  ];
  return locoLod({
    palette: PALETTE,
    shells: [hoodShell, cabShellLod(1), cabShellLod(-1)],
    boxes,
    gear: [-1, 1].map((e) => ({ xc: e * TRUCK_C, half: TRUCK.frameHalf, top: TRUCK.frameTop })),
  }, budget);
}
