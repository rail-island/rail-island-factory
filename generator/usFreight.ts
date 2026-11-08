// North American freight cars and the San Francisco cable car: a cupola
// caboose, a 50 ft boxcar and a double-stack well car (its `cargo` single by
// default, double reaching the US double-stack gauge), and the Powell Street
// cable car. Boxes drawn with the hood kit's painted sweeps (usHoodKit.ts),
// US trucks and knuckle couplers. See docs/models/us-freight.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { decalX, decalZ, endText, knuckleCoupler, paintedSweep, sideText, US_PALETTE } from "./usHoodKit.ts";
import { WAGON_CATALOG } from "./wagons.ts";
import { coil, extrude } from "./dieselParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { TRAM_CATALOG } from "./trams.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, type UnitBody } from "./lodUnits.ts";
import type { LodPart } from "./lodKit.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;
const COUPLER_Y = 0.88;

// ---------------------------------------------------------------------------
// Cupola caboose: two steel cupola cabooses measured from photographs
// (assets/us-caboose/SOURCES.md). The livery chooses the car as photographed, at
// one length over the couplers. Along a side, u runs from the viewer's left.
//
// santaFe - Santa Fe Ce-3 999457, side-on at 104 px/m (33 in wheels, the 5 ft 6 in
//   truck wheelbase): the cupola offset toward the -x end, two windows a side, the
//   yellow stripe, the roof walk, the roof carried out over both platforms. The
//   cross herald is left out; "ATSF" and the number in white, the end grab irons
//   painted white. The other side is drawn alike (mirrored across the car).
// unionPacific - UP 25687, side-on at 49.8 px/m (its roof's length taken as the
//   Santa Fe car's): the cupola centred, three windows a side (the other side the
//   same turned end for end), no roof walk, the roof, railings and ladders red.

export const CABOOSE_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "santaFe",
  values: [{ value: "santaFe", title: "Santa Fe" }, { value: "unionPacific", title: "Union Pacific" }],
}];

/** A side window: centre u, width, sill and head. */
interface CbWindow { u: number; w: number; y0: number; y1: number }
interface CabooseCar {
  /** |x| of the end walls, the side's eave and the roof's crown. */
  body: number; eave: number; crown: number;
  /** The truck centres at +-centre. */
  centre: number;
  cupola: { x0: number; x1: number; half: number; top: number; window: CbWindow; endWindow: number };
  /** The right side's windows; the left side has them turned end for end (`turned`) or mirrored across. */
  windows: readonly CbWindow[];
  turned: boolean;
  walk: boolean;
  /** The stove pipe: x, z, top. */
  stack: readonly [number, number, number];
  /** The end door's centre (times the end's sign) and the end window beside it, if any. */
  door: number;
  endWindow?: number;
  /** The ladder's corner (times the end's sign). */
  ladder: number;
}
interface CbLine { text: string; u: number; y: number; h: number; width: number }
interface CabooseLivery {
  car: CabooseCar;
  body: string; roof: string; rail: string; ladder: string; text: string; frame: string;
  /** The platforms' deck. */
  deck: string;
  palette: Record<string, MaterialSpec>;
  stripe?: readonly [number, number, string];
  lines: readonly CbLine[];
  endNumber?: string;
  cupolaNumber?: string;
}

export const CABOOSE_LENGTH = ft(36, 5);
/** The end sills (the platforms' outer edge), the platform deck, the body's bottom, its half width. */
const CB = { sill: Math.round((CABOOSE_LENGTH / 2 - 0.485) * 1000) / 1000, deck: 1.12, bottom: 0.9, half: 1.45 };

const SANTA_FE_CE3: CabooseCar = {
  body: 4.34, eave: 3.07, crown: 3.22, centre: 2.84,
  cupola: { x0: -3.48, x1: -1.74, half: 1.22, top: 4.35, window: { u: -2.7, w: 0.92, y0: 3.53, y1: 4.01 }, endWindow: 0.7 },
  windows: [{ u: -1.45, w: 0.48, y0: 1.97, y1: 2.63 }, { u: 1.57, w: 0.48, y0: 1.97, y1: 2.63 }],
  turned: false, walk: true, stack: [-0.34, -0.5, 4.38], door: 0.35, ladder: 1.18,
};
const UNION_PACIFIC_CA: CabooseCar = {
  body: 4.06, eave: 3.09, crown: 3.22, centre: 2.9,
  cupola: { x0: -1.24, x1: 1.24, half: 1.25, top: 4.24, window: { u: 0.34, w: 1.08, y0: 3.31, y1: 3.96 }, endWindow: 1.2 },
  windows: [{ u: -2.46, w: 0.48, y0: 1.85, y1: 2.49 }, { u: -0.98, w: 0.38, y0: 1.82, y1: 2.24 }, { u: 2.86, w: 0.4, y0: 1.75, y1: 2.35 }],
  turned: true, walk: false, stack: [1.91, -0.35, 4.46], door: -0.3, endWindow: 0.65, ladder: 1.18,
};

const CABOOSE_LIVERIES: Record<string, CabooseLivery> = {
  santaFe: {
    car: SANTA_FE_CE3, body: "cabRed", roof: "cabRed", rail: "cabWhite", ladder: "cabRed", text: "cabWhite", frame: "black", deck: "cabRed",
    palette: { cabRed: paint("#9e2a23"), cabWhite: paint("#ecebe6"), cabYellow: paint("#e3b025") },
    stripe: [1.8, 1.85, "cabYellow"],
    lines: [{ text: "ATSF", u: 0, y: 1.51, h: 0.22, width: 1.18 }, { text: "999457", u: 0, y: 1.15, h: 0.23, width: 1.35 }],
    endNumber: "999457", cupolaNumber: "457",
  },
  unionPacific: {
    car: UNION_PACIFIC_CA, body: "upYellow", roof: "upRed", rail: "upRed", ladder: "upRed", text: "upRed", frame: "black", deck: "walk",
    palette: { upYellow: paint("#f4b92a"), upRed: paint("#b5202b") },
    lines: [{ text: "UNION PACIFIC", u: 0.29, y: 2.39, h: 0.56, width: 3.92 }, { text: "UP 25687", u: 0.27, y: 1.14, h: 0.42, width: 2.35 }],
  },
};

/** A rounded rectangle (u, v) as a convex ring, its corners `seg` facets each. */
function cbRound(u0: number, u1: number, v0: number, v1: number, r: number, seg = 3): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const corners: Array<[number, number, number]> = [[u1 - r, v0 + r, -Math.PI / 2], [u1 - r, v1 - r, 0], [u0 + r, v1 - r, Math.PI / 2], [u0 + r, v0 + r, Math.PI]];
  for (const [cu, cv, a0] of corners) for (let i = 0; i <= seg; i++) { const a = a0 + (i / seg) * (Math.PI / 2); out.push([cu + r * Math.cos(a), cv + r * Math.sin(a)]); }
  return out;
}

/** A flat convex ring (x, y) laid on the side z facing s. */
function cbSidePane(m: MeshBuilder, mat: string, ring: ReadonlyArray<readonly [number, number]>, z: number, s: number): void {
  const pts: Vec3[] = [];
  for (let i = 1; i + 1 < ring.length; i++) pts.push([ring[0]![0], ring[0]![1], z], [ring[i]![0], ring[i]![1], z], [ring[i + 1]![0], ring[i + 1]![1], z]);
  m.facets(mat, pts, [0, 0, s]);
}

/** A window on the side z = s * zw centred at x: its frame, the glass, `panes` panes split by a mullion. */
function cbWindow(m: MeshBuilder, frame: string, x: number, w: CbWindow, s: number, zw: number, panes = 1, r = 0.06): void {
  cbSidePane(m, frame, cbRound(x - w.w / 2 - 0.04, x + w.w / 2 + 0.04, w.y0 - 0.04, w.y1 + 0.04, r + 0.03), s * (zw + 0.004), s);
  const pw = (w.w - (panes - 1) * 0.05) / panes;
  for (let k = 0; k < panes; k++) {
    const a = x - w.w / 2 + k * (pw + 0.05);
    cbSidePane(m, "glass", cbRound(a, a + pw, w.y0, w.y1, panes > 1 ? 0.02 : r), s * (zw + 0.008), s);
  }
}

/** Text of `width` metres centred at u on side s (x = u on the right side, -u on the left when the layout turns). */
const cbFit = (text: string, width: number): [number, number] => {
  const n = [...text].length, w = width / (n + 0.3 * (n - 1));
  return [w, 0.3 * w];
};

export function caboose(params?: ParamValues): MeshBuilder {
  const l = CABOOSE_LIVERIES[resolveParams(CABOOSE_PARAMS, params).livery!]!;
  const c = l.car, H = CB.half, cu = c.cupola;
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  const xOf = (u: number, s: number): number => (c.turned ? s * u : u);
  m.scope("underframe", () => {
    block(m, l.frame, -CB.sill + 0.02, CB.sill - 0.02, 0.6, CB.bottom + 0.02, -0.22, 0.22);
    // the side sills under the body's sheets
    for (const s of [-1, 1]) block(m, l.frame, -c.body + 0.02, c.body - 0.02, 0.72, CB.bottom + 0.02, ...side(s, H - 0.12, H - 0.04));
    for (const e of [1, -1]) block(m, l.frame, e * c.centre - 0.2, e * c.centre + 0.2, 0.7, CB.bottom + 0.02, -1.25, 1.25);
    m.scope("brake gear", () => {
      // the reservoir and brake cylinder under the left side, the AB valve, the rod to the hand brake
      m.sweep(l.frame, "x", ngon(10, 0.2, 0, -0.75, 0.6), 0.45, ngon(10, 0.2, 0, -0.75, 0.6), 1.6);
      block(m, l.frame, -0.8, -0.45, 0.45, CB.bottom, -1.0, -0.62);
      m.sweep(l.frame, "x", ngon(8, 0.14, 0, -0.5, 0.62), -1.7, ngon(8, 0.14, 0, -0.5, 0.62), -1.15);
      m.rod("steel", [-1.7, 0.62, -0.5], [-CB.sill + 0.3, 0.7, -0.3], 0.02, 4);
    });
    // the tool box hung under the right side
    m.scope("tool box", () => block(m, l.body, -0.67, 0.31, 0.27, CB.bottom, 0.85, 1.32));
  });
  m.scope("platforms", () => {
    for (const e of [1, -1]) {
      const ax = (a: number, b: number): [number, number] => [Math.min(e * a, e * b), Math.max(e * a, e * b)];
      block(m, l.deck, ...ax(c.body, CB.sill - 0.01), CB.deck - 0.06, CB.deck, -1.42, 1.42);
      block(m, l.body, ...ax(CB.sill - 0.18, CB.sill), 0.74, CB.deck - 0.06, -1.4, 1.4);
      block(m, l.frame, ...ax(c.body - 0.02, CB.sill - 0.18), 0.8, CB.deck - 0.06, -1.1, 1.1);
      // the steps at the four corners: two hangers and three treads
      for (const s of [-1, 1])
        m.scope("steps", () => {
          const z = side(s, 1.12, 1.42), [a, b] = ax(c.body + 0.04, CB.sill - 0.03);
          block(m, l.body, a, a + 0.03, 0.2, CB.deck - 0.06, ...z);
          block(m, l.body, b - 0.03, b, 0.2, CB.deck - 0.06, ...z);
          // the risers behind the treads
          block(m, l.body, a + 0.03, b - 0.03, 0.2, CB.deck - 0.06, ...side(s, 1.12, 1.14));
          for (const t of [0.88, 0.59, 0.3]) {
            block(m, l.body, a + 0.03, b - 0.03, t - 0.035, t, ...side(s, 1.13, 1.38));
            block(m, l.rail, a + 0.03, b - 0.03, t - 0.035, t, ...side(s, 1.38, 1.41));
          }
        });
    }
  });
  m.scope("body", () => {
    paintedSweep(m, "x", [[-H, CB.bottom], [H, CB.bottom], [H, c.eave - 0.03], [-H, c.eave - 0.03]], -c.body, c.body, { bands: [[0, 9, l.body]], roofFrom: 99, roof: l.body });
    m.scope("roof", () => {
      const rh = H + 0.05;
      const sec: Array<[number, number]> = [[-rh, c.eave - 0.06], [rh, c.eave - 0.06], [rh, c.eave], [0.75, c.crown - 0.04], [0, c.crown], [-0.75, c.crown - 0.04], [-rh, c.eave]];
      m.sweep(l.roof, "x", sec, -CB.sill, sec, CB.sill);
      // the overhang's fascia over each platform
      for (const e of [1, -1]) {
        const [a, b] = e > 0 ? [c.body + 0.01, CB.sill - 0.001] : [-CB.sill + 0.001, -c.body - 0.01];
        block(m, l.roof, ...(e > 0 ? [CB.sill - 0.06, CB.sill - 0.001] : [-CB.sill + 0.001, -CB.sill + 0.06]) as [number, number], c.eave - 0.2, c.eave - 0.06, -rh, rh);
        // the Santa Fe's hooded overhang: its sides dropped like the end
        if (c.walk) for (const s of [-1, 1]) block(m, l.roof, a, b, c.eave - 0.2, c.eave - 0.06, ...side(s, rh - 0.04, rh - 0.001));
      }
      if (c.walk)
        m.scope("roof walk", () => {
          const y = c.crown + 0.03;
          block(m, "walk", -CB.sill + 0.05, CB.sill - 0.05, y, y + 0.04, -0.28, 0.28);
          for (let x = -CB.sill + 0.3; x < CB.sill; x += 0.95) if (x < cu.x0 - 0.1 || x > cu.x1 + 0.1) block(m, "walk", x - 0.04, x + 0.04, c.crown - 0.04, y, -0.24, 0.24);
          // the cross boards at each end out to the ladders
          for (const e of [1, -1]) {
            const [a, b] = e > 0 ? [CB.sill - 0.55, CB.sill - 0.08] : [-CB.sill + 0.08, -CB.sill + 0.55];
            block(m, "walk", a, b, y + 0.001, y + 0.041, -1.3, -0.28);
            block(m, "walk", a, b, y + 0.001, y + 0.041, 0.28, 1.3);
            for (const z of [-1.0, 1.0]) block(m, "walk", a + 0.1, b - 0.1, c.eave + 0.02, y, z - 0.04, z + 0.04);
          }
        });
    });
    m.scope("cupola", () => {
      paintedSweep(m, "x", [[-cu.half, c.eave - 0.03], [cu.half, c.eave - 0.03], [cu.half, cu.top - 0.07], [-cu.half, cu.top - 0.07]], cu.x0, cu.x1, { bands: [[0, 9, l.body]], roofFrom: 99, roof: l.body });
      block(m, l.roof, cu.x0 - 0.06, cu.x1 + 0.06, cu.top - 0.07, cu.top, -cu.half - 0.06, cu.half + 0.06);
      for (const s of [-1, 1]) {
        cbWindow(m, "steel", xOf(cu.window.u, s), cu.window, s, cu.half, 2, 0.03);
        // the grab rail along the roof's edge
        const z = s * (cu.half - 0.08), y = cu.top + 0.12;
        m.rod(l.rail, [cu.x0 + 0.08, y, z], [cu.x1 - 0.08, y, z], 0.016, 6);
        for (const x of [cu.x0 + 0.08, cu.x1 - 0.08]) m.rod(l.rail, [x, cu.top, z], [x, y, z], 0.014, 4, false);
      }
      for (const e of [1, -1]) {
        const xf = e > 0 ? cu.x1 : cu.x0, w = cu.endWindow;
        const outer = l.cupolaNumber && e < 0;
        if (outer) {
          // the outer end: the car number and a louvred vent
          endText(m, l.text, l.cupolaNumber!, e, -xf + 0.004, -0.42, cu.window.y0 - 0.02, 0.32, 0.17, 0.05);
          decalX(m, "louvre", xf - 0.004, e, 0.25, 0.85, cu.window.y0 - 0.1, cu.window.y1);
        } else {
          decalX(m, "rubber", xf + e * 0.004, e, -w / 2 - 0.04, w / 2 + 0.04, cu.window.y0 - 0.04, cu.window.y1 + 0.04);
          for (const k of [-1, 1]) decalX(m, "glass", xf + e * 0.008, e, Math.min(k * 0.025, k * w / 2), Math.max(k * 0.025, k * w / 2), cu.window.y0, cu.window.y1);
        }
      }
      if (!c.walk)
        m.scope("signal lamps", () => {
          // the two-lamp rear signal on each side of the cupola
          for (const s of [-1, 1]) {
            const x = xOf(-0.75, s);
            block(m, "black", x - 0.1, x + 0.1, cu.window.y0 + 0.02, cu.window.y1 - 0.02, ...side(s, cu.half, cu.half + 0.1));
            for (const y of [cu.window.y0 + 0.17, cu.window.y1 - 0.17]) m.sweep("lampRed", "z", ngon(8, 0.065, 0, x, y), s * (cu.half + 0.1), ngon(8, 0.065, 0, x, y), s * (cu.half + 0.12));
          }
        });
    });
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        for (const w of c.windows) cbWindow(m, "steel", xOf(w.u, s), w, s, H);
        if (l.stripe) decalZ(m, l.stripe[2], s * (H + 0.003), s, -c.body + 0.01, c.body - 0.01, l.stripe[0], l.stripe[1]);
        for (const t of l.lines) {
          const [w, gap] = cbFit(t.text, t.width);
          // drawn twice, a stroke's width apart, for the letters' weight
          for (const d of [0, 0.02]) sideText(m, l.text, t.text, s, H + 0.006, xOf(t.u, s) + d, t.y, t.h, w, gap);
        }
        // the grab irons curving down each corner to the steps
        for (const e of [1, -1]) {
          const z = s * (H + 0.06);
          const pts: Vec3[] = [[e * (c.body - 0.05), 1.82, z], [e * (c.body - 0.09), 1.5, z], [e * (c.body - 0.2), 1.2, z], [e * (c.body - 0.34), 1.0, z]];
          for (let i = 0; i + 1 < pts.length; i++) m.rod(l.rail, pts[i]!, pts[i + 1]!, 0.017, 6, false);
          for (const p of [pts[0]!, pts[3]!]) m.rod(l.rail, [p[0], p[1], s * H], p, 0.014, 4, false);
        }
      });
    for (const e of [1, -1])
      m.scope(e > 0 ? "front end" : "rear end", () => {
        const x = e * c.body;
        const ax = (a: number, b: number): [number, number] => [Math.min(x + e * a, x + e * b), Math.max(x + e * a, x + e * b)];
        const zd = e * c.door;
        // the end door, its window and handle; the window beside it
        const dt = CB.deck + 1.65;
        block(m, l.body, ...ax(-0.01, 0.03), CB.deck, dt, zd - 0.37, zd + 0.37);
        // the door's frame line
        for (const [z0, z1, y0, y1] of [[zd - 0.4, zd - 0.37, CB.deck, dt + 0.03], [zd + 0.37, zd + 0.4, CB.deck, dt + 0.03], [zd - 0.37, zd + 0.37, dt, dt + 0.03]] as const)
          decalX(m, "rubber", x + e * 0.004, e, z0, z1, y0, y1);
        decalX(m, "rubber", x + e * 0.034, e, zd - 0.19, zd + 0.19, dt - 0.82, dt - 0.1);
        decalX(m, "glass", x + e * 0.038, e, zd - 0.15, zd + 0.15, dt - 0.78, dt - 0.14);
        m.rod("steel", [x + e * 0.03, CB.deck + 1.0, zd + 0.27], [x + e * 0.1, CB.deck + 1.0, zd + 0.27], 0.02, 4, false);
        if (c.endWindow !== undefined) {
          const zw = -e * c.endWindow;
          decalX(m, "rubber", x + e * 0.004, e, zw - 0.26, zw + 0.26, 1.81, 2.49);
          decalX(m, "glass", x + e * 0.008, e, zw - 0.22, zw + 0.22, 1.85, 2.45);
        }
        if (l.endNumber) endText(m, l.text, l.endNumber, e, c.body + 0.004, zd, dt + 0.05, 0.11, 0.07, 0.02);
        // the ladder at one corner, through the roof's overhang to the roof, its rails bent over as grab hoops
        m.scope("ladder", () => {
          const zl = e * c.ladder, xl = x + e * 0.14;
          for (const k of [-1, 1]) {
            const z = zl + k * 0.2;
            m.rod(l.ladder, [xl, CB.deck, z], [xl, c.crown + 0.42, z], 0.022, 6, false);
            m.rod(l.ladder, [xl, c.crown + 0.42, z], [xl - e * 0.22, c.crown + 0.42, z], 0.022, 6, false);
            m.rod(l.ladder, [xl - e * 0.22, c.crown + 0.42, z], [xl - e * 0.3, c.eave + 0.06, z], 0.022, 6, false);
          }
          for (let y = CB.deck + 0.3; y < c.eave - 0.1; y += 0.33) m.rod(l.ladder, [xl, y, zl - 0.2], [xl, y, zl + 0.2], 0.016, 4, false);
          for (const y of [CB.deck + 0.6, c.eave - 0.4]) m.rod(l.ladder, [xl, y, zl], [x, y, zl], 0.015, 4, false);
        });
        // the end railing with its gate posts, the corner posts down to the steps
        m.scope("railing", () => {
          const xr = e * (CB.sill - 0.06);
          for (const sd of [-1, 1]) {
            for (const y of [CB.deck + 0.5, CB.deck + 0.95]) m.rod(l.rail, [xr, y, sd * 1.4], [xr, y, sd * 0.45], 0.02, 6);
            m.rod(l.rail, [xr, 0.3, sd * 1.4], [xr, CB.deck + 0.95, sd * 1.4], 0.022, 6);
            m.rod(l.rail, [xr, CB.deck, sd * 0.45], [xr, CB.deck + 0.95, sd * 0.45], 0.02, 6, false);
          }
        });
        // the marker lamps at the end's upper corners: white ahead, red behind
        for (const sd of [-1, 1]) {
          const z = sd * (H - 0.18);
          block(m, "black", ...ax(0, 0.16), c.eave - 0.58, c.eave - 0.32, z - 0.1, z + 0.1);
          decalX(m, e > 0 ? "lampHead" : "lampRed", x + e * 0.165, e, z - 0.06, z + 0.06, c.eave - 0.51, c.eave - 0.39);
        }
        if (e < 0)
          m.scope("hand brake", () => {
            // the brake wheel on its staff at the end railing
            const zb = e * 0.85, yb = CB.deck + 0.9, xb = e * (CB.sill - 0.14);
            m.rod("black", [xb, 0.75, zb], [xb, yb, zb], 0.025, 6);
            m.tube(l.rail, "x", zb, yb, 0.24, 0.21, xb - 0.015, xb + 0.015, 12);
            for (let t = 0; t < 3; t++) {
              const a = Math.PI / 2 + (t * 2 * Math.PI) / 3;
              m.rod(l.rail, [xb, yb, zb], [xb, yb + Math.sin(a) * 0.215, zb + Math.cos(a) * 0.215], 0.014, 4, false);
            }
          });
      });
    m.scope("stove pipe", () => {
      const [sx, sz, top] = c.stack;
      m.emit("smoke", [sx, top, sz], 0.1);
      m.prism("exhaust", ngon(8, 0.1, 0, sx, sz), c.crown - 0.1, top - 0.08);
      m.prism("exhaust", ngon(8, 0.14, 0, sx, sz), top - 0.08, top);
    });
  });
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => bxTruck(m, c.centre)));
    m.scope("rear truck", () => m.bogie(() => bxTruck(m, -c.centre)));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front coupler" : "rear coupler", () => knuckleCoupler(m, e, CB.sill, CABOOSE_LENGTH / 2, COUPLER_Y));
  return m;
}

export function cabooseLod(params?: ParamValues): MeshBuilder {
  const l = CABOOSE_LIVERIES[resolveParams(CABOOSE_PARAMS, params).livery!]!;
  const c = l.car, cu = c.cupola;
  const side: LodBand[] = l.stripe ? [[CB.bottom, l.stripe[0], l.body], [l.stripe[0], l.stripe[1], l.stripe[2]], [l.stripe[1], c.crown, l.body]] : [[CB.bottom, c.crown, l.body]];
  // the end walls at +-body, the roof carried out to the sills over the platforms
  const tip = (e: number): Array<readonly [number, number]> => [[CB.bottom, e * c.body], [c.eave - 0.07, e * c.body], [c.eave - 0.06, e * CB.sill], [c.crown, e * CB.sill]];
  const body: UnitBody = {
    y0: CB.bottom, hw: [[CB.bottom, CB.half], [c.eave, CB.half + 0.05], [c.crown, 0.7]], side, roof: l.roof, front: { tip: tip(1) }, rear: { tip: tip(-1) },
    windows: c.windows.map((w) => ({ u: [w.u - w.w / 2, w.u + w.w / 2] as const, y: [w.y0, w.y1] as const, mat: LOD_GLASS, optional: 2 })),
  };
  const cupola: UnitBody = { y0: c.eave - 0.1, hw: [[c.eave - 0.1, cu.half], [cu.top, cu.half]], side: [[c.eave - 0.1, cu.top, l.body]], roof: l.roof, front: { tip: [[c.eave - 0.1, cu.x1]] }, rear: { tip: [[c.eave - 0.1, cu.x0]] } };
  const parts: LodPart[] = bogieParts([[c.centre, 1.3], [-c.centre, 1.3]], CB.bottom);
  return fitUnit({ palette: { ...US_PALETTE, ...l.palette }, bodies: [body, cupola], parts }, 100);
}

// ---------------------------------------------------------------------------
// 50 ft boxcar: a 1970s 70-ton Plate C car with exterior posts, a diagonal-panel
// roof and improved Dreadnaught ends, measured from assets/us-boxcar/ (Railbox
// 33646 side-on at 57.3 px/m, SP 245516 at 63 px/m). The livery chooses the
// car's doors: Southern Pacific's Hydra-Cushion car has a 16 ft double door,
// Railbox's car a 10 ft single door, painted black. Along a side, u runs from the
// viewer's left to right (x = s * u), so both sides read alike.

export const BOXCAR_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "boxcarRed",
  values: [{ value: "boxcarRed", title: "Boxcar red" }, { value: "railbox", title: "Railbox" }],
}];
type BxUV = [number, number];
/** One painted mark on the sides: triangles in (u, v), a material, and a layer (0.003 m apart). */
interface BxMark { mat: string; tris: BxUV[]; layer?: number; /** Off the sheathing by this much instead (the side sill), not repeated on the posts. */ z?: number }
interface BoxcarLivery {
  body: string; door: string;
  palette: Record<string, MaterialSpec>;
  /** Door leaves [u0, u1], the door track's reach, the edge the lock bars stand at (per leaf). */
  leaves: ReadonlyArray<readonly [number, number]>; track: readonly [number, number]; locks: readonly number[];
  /** The exterior posts' |u| from the door outward (the first is the door post); the door's ribs. */
  posts: readonly number[]; ribs: number;
  marks: () => BxMark[];
}
export const BOXCAR_LENGTH = ft(55, 4);
const BX = { sill: 7.95, body: 7.85, half: 1.44, bottom: 0.86, sheet: 1.02, eave: 4.42, ridge: ft(15, 1), centre: ft(40, 6) / 2, post: 0.11, doorIn: 0.115, doorOut: 0.14, doorTop: 4.3, doorFoot: 0.98 };
const bxPosts = (first: number, pitch: number, n: number): number[] => Array.from({ length: n }, (_, i) => Math.round((first + i * pitch) * 1000) / 1000);

/** Bars along polylines in (u, v), `stroke` wide, as triangles (strokeText's construction). */
function bxBars(lines: ReadonlyArray<ReadonlyArray<BxUV>>, stroke: number): BxUV[] {
  const out: BxUV[] = [];
  for (const line of lines)
    for (let j = 1; j < line.length; j++) {
      const [[x0, y0], [x1, y1]] = [line[j - 1]!, line[j]!];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const [dx, dy] = [((x1 - x0) / len) * (stroke / 2), ((y1 - y0) / len) * (stroke / 2)];
      const q: BxUV[] = [[x0 - dx - dy, y0 - dy + dx], [x0 - dx + dy, y0 - dy - dx], [x1 + dx + dy, y1 + dy - dx], [x1 + dx - dy, y1 + dy + dx]];
      for (const k of [0, 1, 2, 0, 2, 3]) out.push(q[k]!);
    }
  return out;
}

/** Railbox's lower-case letters: centre lines in a unit cell (x-height 0 .. 1, ascenders to 1.5). */
const BX_GLYPHS: Record<string, BxUV[][]> = {
  r: [[[0.15, 0.15], [0.15, 0.85], [0.88, 0.85]]],
  a: [[[0.15, 0.85], [0.85, 0.85], [0.85, 0.15], [0.15, 0.15], [0.15, 0.5], [0.85, 0.5]]],
  i: [[[0.5, 0.15], [0.5, 0.85]], [[0.5, 1.15], [0.5, 1.3]]],
  l: [[[0.5, 0.15], [0.5, 1.4]]],
  b: [[[0.15, 1.5], [0.15, 0.15], [0.85, 0.15], [0.85, 0.85], [0.15, 0.85]]],
  o: [[[0.15, 0.15], [0.85, 0.15], [0.85, 0.85], [0.15, 0.85], [0.15, 0.15]]],
  x: [[[0.12, 0.15], [0.88, 0.85]], [[0.12, 0.85], [0.88, 0.15]]],
  n: [[[0.15, 0.15], [0.15, 0.85], [0.85, 0.85], [0.85, 0.15]]],
  e: [[[0.85, 0.15], [0.15, 0.15], [0.15, 0.85], [0.85, 0.85], [0.85, 0.5], [0.15, 0.5]]],
  t: [[[0.4, 1.3], [0.4, 0.15], [0.8, 0.15]], [[0.1, 0.85], [0.8, 0.85]]],
  d: [[[0.85, 1.5], [0.85, 0.15], [0.15, 0.15], [0.15, 0.85], [0.85, 0.85]]],
  y: [[[0.15, 0.85], [0.15, 0.15], [0.85, 0.15]], [[0.85, 0.85], [0.85, -0.5], [0.15, -0.5]]],
};
/** One glyph in the box u0 .. u1, x-height xh from v0, leaning `slant` (u per v). */
const bxGlyph = (ch: string, u0: number, u1: number, v0: number, xh: number, stroke: number, slant = 0.22): BxUV[] =>
  bxBars(BX_GLYPHS[ch]!.map((l) => l.map(([a, b]): BxUV => [u0 + a * (u1 - u0) + b * xh * slant, v0 + b * xh])), stroke);
/** A glyph's counter (the hole of a heavy a, b or o): cell fractions a0 .. a1 by b0 .. b1, leaning as the glyph. */
const bxCounter = (u0: number, u1: number, v0: number, xh: number, a0: number, a1: number, b0: number, b1: number, slant = 0.22): BxUV[] => {
  const P = (a: number, b: number): BxUV => [u0 + a * (u1 - u0) + b * xh * slant, v0 + b * xh];
  return [P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b0), P(a1, b1), P(a0, b1)];
};
/** A lower-case word centred at uc. */
const bxWord = (word: string, uc: number, v0: number, xh: number, w: number, gap: number, stroke: number): BxUV[] => {
  const u0 = uc - (word.length * w + (word.length - 1) * gap) / 2;
  return [...word].flatMap((ch, i) => bxGlyph(ch, u0 + i * (w + gap), u0 + i * (w + gap) + w, v0, xh, stroke));
};
/** Upper-case text (the stroke font) centred at uc. */
const bxText = (text: string, uc: number, v0: number, h: number, w: number, gap: number, stroke = h * 0.15): BxUV[] =>
  strokeText(text, uc - strokeWidth(text, w, gap) / 2, v0, h, w, gap, false, stroke);
const bxRect = (u0: number, u1: number, v0: number, v1: number): BxUV[] => [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]];

/** Southern Pacific's Hydra-Cushion car (SP 245516): white road name right of the door, yellow cushion slogan left. */
function spMarks(): BxMark[] {
  return [
    { mat: "bxWhite", tris: [...bxText("SOUTHERN", 5.15, 3.22, 0.58, 0.36, 0.11, 0.1), ...bxText("PACIFIC", 5.15, 2.48, 0.55, 0.3, 0.1, 0.1)] },
    { mat: "safety", tris: bxText("HYDRA-CUSHION", -5.37, 3.37, 0.52, 0.27, 0.08, 0.09) },
    { mat: "bxWhite", tris: [...bxText("S P", -6.42, 2.62, 0.2, 0.25, 0.14), ...bxText("245516", -6.13, 2.15, 0.22, 0.21, 0.09)] },
    // the data panel and the conspicuity reflectors on the sill
    { mat: "bxWhite", tris: [...bxText("LD LMT", -3.9, 1.55, 0.07, 0.05, 0.02, 0.012), ...bxText("LT WT", -3.95, 1.43, 0.07, 0.05, 0.02, 0.012)] },
    { mat: "safety", tris: [...bxRect(-4.25, -3.75, 0.9, 0.97), ...bxRect(2.55, 3.05, 0.9, 0.97)], z: 0.053 },
    { mat: "safety", tris: [...bxRect(-7.38, -7.32, 1.25, 1.65), ...bxRect(7.5, 7.56, 1.25, 1.65)] },
  ];
}

/** Railbox (RBOX 33646): the "rail box" lettering and its outline logo, "next load", the X, "any road". */
function railboxMarks(): BxMark[] {
  const row1: Array<[string, number, number]> = [["r", -6.75, -6.28], ["a", -5.89, -5.45], ["i", -4.95, -4.67], ["l", -4.06, -3.78]];
  const row2: Array<[string, number, number]> = [["b", -4.15, -3.66], ["o", -3.28, -2.79], ["x", -2.44, -1.92]];
  // the outline logo under "rai", traced from the photograph
  const logo: BxUV[] = [[-6.33, 3.53], [-4.67, 3.53], [-4.8, 3.17], [-5.48, 3.17], [-5.4, 3.39], [-5.78, 3.39], [-5.94, 2.89], [-6.57, 2.89], [-6.33, 3.53]];
  // the X: two blue strokes crossing, a red chevron inside each side
  const [xc, yc] = [4.92, 3.57];
  return [
    {
      mat: "bxBlack", tris: [
        ...row1.flatMap(([c, a, b]) => bxGlyph(c, a, b, 3.63, 0.23, 0.1)),
        ...row2.flatMap(([c, a, b]) => bxGlyph(c, a, b, 3.25, 0.19, 0.095)),
        ...bxBars([logo], 0.04),
        ...bxText("RB OX", -5.24, 2.43, 0.3, 0.2, 0.08, 0.04), ...bxText("33 646", -5.24, 2.09, 0.25, 0.16, 0.06, 0.035),
        ...bxWord("next", 4.04, 3.6, 0.1, 0.09, 0.04, 0.03), ...bxWord("load", 4.04, 3.44, 0.1, 0.09, 0.04, 0.03),
        ...bxWord("any", 5.78, 3.6, 0.1, 0.09, 0.04, 0.03), ...bxWord("road", 5.78, 3.44, 0.1, 0.09, 0.04, 0.03),
        ...bxText("LD LMT", -6.1, 1.62, 0.07, 0.05, 0.02, 0.012), ...bxText("LT WT", -6.15, 1.5, 0.07, 0.05, 0.02, 0.012),
      ],
    },
    // the counters of a, b and o, in the body's paint over the heavy strokes
    { mat: "bxYellow", layer: 1, tris: [...bxCounter(-5.89, -5.45, 3.63, 0.23, 0.35, 0.65, 0.58, 0.74), ...bxCounter(-4.15, -3.66, 3.25, 0.19, 0.33, 0.67, 0.38, 0.62), ...bxCounter(-3.28, -2.79, 3.25, 0.19, 0.3, 0.7, 0.38, 0.62)] },
    { mat: "rbBlue", layer: 2, tris: bxBars([[[xc - 0.27, yc + 0.21], [xc + 0.27, yc - 0.21]], [[xc - 0.27, yc - 0.21], [xc + 0.27, yc + 0.21]]], 0.075) },
    { mat: "rbRed", layer: 1, tris: bxBars([[[xc - 0.29, yc + 0.11], [xc - 0.05, yc], [xc - 0.29, yc - 0.11]], [[xc + 0.29, yc + 0.11], [xc + 0.05, yc], [xc + 0.29, yc - 0.11]]], 0.05) },
    // the white consolidated stencil and the ACI label near the right end
    { mat: "bxWhite", tris: [...bxRect(5.6, 6.02, 1.45, 1.74), ...bxRect(5.7, 5.92, 1.2, 1.36)] },
  ];
}

const BOXCAR_LIVERIES: Record<string, BoxcarLivery> = {
  boxcarRed: {
    body: "bxRed", door: "bxRed", palette: { bxRed: paint("#7b2b22", 0.7), bxWhite: paint("#e8e6df") },
    leaves: [[-2.58, 0], [0, 2.58]], track: [-5.2, 5.2], locks: [-0.1, 0.1], posts: bxPosts(2.66, 0.775, 7), ribs: 13, marks: spMarks,
  },
  railbox: {
    body: "bxYellow", door: "rbDoor", palette: { bxYellow: paint("#e9b92a", 0.6), bxBlack: paint("#1f2022"), rbDoor: paint("#2c2e31", 0.8), bxWhite: paint("#e8e6df"), rbRed: paint("#c0322c"), rbBlue: paint("#2c4f9c") },
    leaves: [[-1.615, 1.615]], track: [-1.615, 4.88], locks: [-1.5], posts: bxPosts(1.81, 0.87, 7), ribs: 16, marks: railboxMarks,
  },
};

/** The part of triangle soup `tris` between u = a and u = b, as triangles. */
function bxClipU(tris: readonly BxUV[], a: number, b: number): BxUV[] {
  const out: BxUV[] = [];
  const cut = (poly: BxUV[], keep: (u: number) => boolean, at: number): BxUV[] => {
    const r: BxUV[] = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!, q = poly[(i + 1) % poly.length]!;
      if (keep(p[0])) r.push(p);
      if (keep(p[0]) !== keep(q[0])) {
        const t = (at - p[0]) / (q[0] - p[0]);
        r.push([at, p[1] + (q[1] - p[1]) * t]);
      }
    }
    return r;
  };
  for (let i = 0; i + 2 < tris.length; i += 3) {
    const us = [tris[i]![0], tris[i + 1]![0], tris[i + 2]![0]];
    if (Math.max(...us) <= a || Math.min(...us) >= b) continue;
    const poly = cut(cut([tris[i]!, tris[i + 1]!, tris[i + 2]!], (u) => u >= a, a), (u) => u <= b, b);
    for (let j = 1; j + 1 < poly.length; j++) out.push(poly[0]!, poly[j]!, poly[j + 1]!);
  }
  return out;
}

/** A point on the roof: along x, t from the eave (0) to the ridge (1) on side s, lifted off the sheet. */
function bxRoof(x: number, t: number, s: number, lift = 0): Vec3 {
  const d = BX.ridge - BX.eave, l = Math.hypot(d, BX.half);
  return [x, BX.eave + d * t + lift * (BX.half / l), s * (BX.half * (1 - t) + lift * (d / l))];
}

/** A 70-ton three-piece freight truck at xc (33 in wheels, 5 ft 8 in wheelbase): cast side frames with their spring nests, roller bearings, the bolster. */
function bxTruck(m: MeshBuilder, xc: number): void {
  const N = 20, r = ft(0, 16.5), a = ft(5, 8) / 2;
  const ay = r * Math.cos(Math.PI / N);
  for (const dx of [-a, a])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -0.95, axle, 0.95);
      for (const s of [-1, 1]) {
        extrude(m, "steel", "z", ngon(N, r, Math.PI / N, x, ay), side(s, 0.665, 0.8));
        extrude(m, "wheel", "z", ngon(16, r * 0.8, 0, x, ay), side(s, 0.8, 0.815));
        m.scope("roller bearing", () => {
          extrude(m, "spring", "z", ngon(10, 0.11, 0, x, ay), side(s, 0.95, 1.12));
          extrude(m, "bogie", "z", ngon(10, 0.075, 0, x, ay), side(s, 1.12, 1.15));
          block(m, "bogie", x - 0.13, x + 0.13, ay + 0.1, ay + 0.15, ...side(s, 0.94, 1.08));
        });
      }
    });
  m.scope("side frames", () => {
    for (const s of [-1, 1]) {
      const z = side(s, 0.95, 1.07);
      for (const k of [-1, 1]) {
        const X = (u: number): number => xc + k * u;
        const piece = (pts: BxUV[]): void => extrude(m, "bogie", "z", (k > 0 ? pts : [...pts].reverse()).map(([u, y]): [number, number] => [X(u), y]), z);
        // the pedestal over the bearing, the top chord rising to the column, the tension member under it
        piece([[a - 0.2, ay + 0.15], [a + 0.17, ay + 0.15], [a + 0.24, ay + 0.2], [a + 0.24, ay + 0.27], [a - 0.2, ay + 0.3]]);
        piece([[0.4, 0.62], [a - 0.2, ay + 0.15], [a - 0.2, ay + 0.3], [0.4, 0.79]]);
        piece([[0.4, 0.2], [a - 0.18, ay + 0.02], [a - 0.18, ay + 0.15], [0.4, 0.33]]);
        piece([[0.28, 0.2], [0.4, 0.2], [0.4, 0.79], [0.28, 0.79]]);
        // the pedestal jaws round the bearing adapter
        for (const j of [-1, 1]) block(m, "bogie", Math.min(X(a + j * 0.14), X(a + j * 0.19)), Math.max(X(a + j * 0.14), X(a + j * 0.19)), ay + 0.04, ay + 0.15, ...z);
      }
      block(m, "bogie", xc - 0.28, xc + 0.28, 0.2, 0.32, ...z);
      block(m, "bogie", xc - 0.28, xc + 0.28, 0.72, 0.79, ...z);
      // the spring nest in the window
      m.scope("springs", () => { for (const d of [-0.17, 0, 0.17]) coil(m, "spring", xc + d, s * 1.01, 0.32, 0.5, 0.075, 2, 6); });
    }
  });
  m.scope("bolster", () => {
    block(m, "bogie", xc - 0.24, xc + 0.24, 0.5, 0.7, -1.09, 1.09);
    // the friction wedges beside it in each window
    for (const s of [-1, 1]) for (const d of [-1, 1]) block(m, "spring", Math.min(xc + d * 0.24, xc + d * 0.28), Math.max(xc + d * 0.24, xc + d * 0.28), 0.54, 0.7, ...side(s, 0.96, 1.08));
  });
  m.scope("brake beams", () => { for (const d of [-1, 1]) block(m, "bogie", xc + d * 0.43 - 0.04, xc + d * 0.43 + 0.04, 0.36, 0.46, -0.86, 0.86); });
}

/** A ring in (x, z) wound as ngon winds, for prism and cap. */
function bxCcw(r: Array<[number, number]>): Array<[number, number]> {
  const area = (q: ReadonlyArray<readonly [number, number]>): number => q.reduce((a, p, i) => { const n = q[(i + 1) % q.length]!; return a + p[0] * n[1] - n[0] * p[1]; }, 0);
  return area(r) * area(ngon(4, 1, 0, 0, 0) as Array<[number, number]>) < 0 ? [...r].reverse() : r;
}

/** A grab iron: a bar from p to q standing `off` out along n, with its two legs. */
function bxGrab(m: MeshBuilder, p: Vec3, q: Vec3, n: Vec3, off: number): void {
  const o = (v: Vec3): Vec3 => [v[0] + n[0] * off, v[1] + n[1] * off, v[2] + n[2] * off];
  m.rod("handrail", o(p), o(q), 0.016, 6);
  for (const v of [p, q]) m.rod("handrail", v, o(v), 0.014, 4, false);
}

export function boxcar(params?: ParamValues): MeshBuilder {
  const l = BOXCAR_LIVERIES[resolveParams(BOXCAR_PARAMS, params).livery!]!;
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  const H = BX.half;
  const posts = [...l.posts.map((p) => -p), ...l.posts].sort((a, b) => a - b);
  m.scope("underframe", () => {
    block(m, "black", -BX.body, BX.body, BX.bottom - 0.06, BX.bottom, -1.4, 1.4);
    block(m, "black", -BX.sill, BX.sill, 0.6, BX.bottom - 0.06, -0.3, 0.3);
    for (const e of [1, -1]) block(m, "black", e * BX.centre - 0.22, e * BX.centre + 0.22, 0.7, BX.bottom - 0.06, -1.3, 1.3);
    for (const x of [-3.6, -1.2, 1.2, 3.6]) block(m, "black", x - 0.08, x + 0.08, 0.66, BX.bottom - 0.06, -1.35, 1.35);
    m.scope("brake gear", () => {
      // the reservoir, the AB valve and the brake cylinder hung under one side
      m.sweep("black", "x", ngon(10, 0.17, 0, 0.75, 0.56), -2.7, ngon(10, 0.17, 0, 0.75, 0.56), -1.5);
      block(m, "black", -1.25, -0.9, 0.42, 0.74, 0.5, 0.85);
      m.sweep("black", "x", ngon(10, 0.14, 0, -0.75, 0.6), 0.4, ngon(10, 0.14, 0, -0.75, 0.6), 1.05);
      m.rod("steel", [1.05, 0.6, -0.75], [5.4, 0.62, -0.4], 0.02, 4);
    });
  });
  m.scope("body", () => {
    const sec: Array<[number, number]> = [[-H, BX.bottom], [H, BX.bottom], [H, BX.eave], [0, BX.ridge], [-H, BX.eave]];
    paintedSweep(m, "x", sec, -BX.body, BX.body, { bands: [[0, 9, l.body]], roofFrom: BX.eave + 0.01, roof: l.body });
    m.scope("roof", () => {
      // the diagonal-panel roof: seam caps across, a raised diagonal in each panel, chevrons seen from above
      const n = 10, pitch = (2 * BX.body) / n;
      for (const s of [-1, 1])
        for (let i = 0; i < n; i++) {
          const x0 = -BX.body + i * pitch, x1 = x0 + pitch;
          const dep = (v: Vec3, w: Vec3): Vec3 => [w[0] - v[0], w[1] - v[1], w[2] - v[2]];
          if (i > 0) m.slab(l.body, [bxRoof(x0 - 0.045, 0, s, 0.035), bxRoof(x0 + 0.045, 0, s, 0.035), bxRoof(x0 + 0.045, 1, s, 0.035), bxRoof(x0 - 0.045, 1, s, 0.035)], dep(bxRoof(0, 0, s, 0.035), bxRoof(0, 0, s, -0.01)));
          m.slab(l.body, [bxRoof(x0 + 0.14, 0.08, s, 0.025), bxRoof(x0 + 0.42, 0.08, s, 0.025), bxRoof(x1 - 0.14, 0.92, s, 0.025), bxRoof(x1 - 0.42, 0.92, s, 0.025)], dep(bxRoof(0, 0, s, 0.025), bxRoof(0, 0, s, -0.01)));
        }
      for (const s of [-1, 1]) block(m, l.body, -BX.body - 0.03, BX.body + 0.03, BX.eave - 0.07, BX.eave + 0.02, ...side(s, H - 0.02, H + 0.12));
    });
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        const X = (u: number): number => s * u;
        const span = (u0: number, u1: number): [number, number] => [Math.min(X(u0), X(u1)), Math.max(X(u0), X(u1))];
        block(m, l.body, -BX.body, BX.body, BX.bottom, BX.sheet, ...side(s, H, H + 0.05));
        // a hat-section post at u: its outer face 2f wide standing d out
        const hat = (u: number): { f: number; d: number } => (Math.abs(Math.abs(u) - l.posts[0]!) < 1e-6 ? { f: 0.05, d: BX.post + 0.01 } : { f: 0.03, d: BX.post });
        m.scope("posts", () => {
          for (const u of posts) {
            const door = Math.abs(Math.abs(u) - l.posts[0]!) < 1e-6;
            const { f, d } = hat(u), w = door ? 0.1 : 0.075;
            const ring = bxCcw([[X(u - w), s * (H - 0.01)], [X(u + w), s * (H - 0.01)], [X(u + w), s * (H + 0.012)], [X(u + f), s * (H + d)], [X(u - f), s * (H + d)], [X(u - w), s * (H + 0.012)]]);
            m.prism(l.body, ring, BX.sheet, BX.eave - 0.07);
            m.cap(l.body, ring, BX.sheet, false);
          }
          // the corner posts
          for (const e of [-1, 1]) block(m, l.body, ...span(e * (BX.body - 0.08), e * (BX.body + 0.04)), BX.bottom, BX.eave - 0.07, ...side(s, H - 0.08, H + 0.08));
        });
        m.scope("door", () => {
          const zf = H + BX.doorOut;
          for (const [u0, u1] of l.leaves) {
            block(m, l.door, ...span(u0, u1), BX.doorFoot, BX.doorTop, ...side(s, H + BX.doorIn, zf));
            // the leaf's frame and its horizontal corrugations, pressed out with sloping edges
            for (const [a, b] of [[u0, u0 + 0.1], [u1 - 0.1, u1]] as const) block(m, l.door, ...span(a, b), BX.doorFoot, BX.doorTop, ...side(s, zf, zf + 0.035));
            block(m, l.door, ...span(u0 + 0.1, u1 - 0.1), BX.doorTop - 0.14, BX.doorTop, ...side(s, zf, zf + 0.035));
            block(m, l.door, ...span(u0 + 0.1, u1 - 0.1), BX.doorFoot, BX.doorFoot + 0.14, ...side(s, zf, zf + 0.035));
            const y0 = BX.doorFoot + 0.18, step = (BX.doorTop - 0.18 - y0) / l.ribs;
            for (let i = 0; i < l.ribs; i++) {
              const [ya, yb] = [y0 + i * step + step * 0.12, y0 + (i + 1) * step - step * 0.12];
              const rib: Array<[number, number]> = [[s * zf, ya], [s * (zf + 0.03), ya + 0.035], [s * (zf + 0.03), yb - 0.035], [s * zf, yb]];
              m.sweep(l.door, "x", rib, X(u0 + 0.1), rib, X(u1 - 0.1));
            }
          }
          // the lock bars with their handles, the top track and the bottom track the door rolls on, the door stops
          const zl = H + 0.185;
          for (const u of l.locks) {
            m.rod("steel", [X(u), BX.doorFoot + 0.15, s * zl], [X(u), BX.doorTop - 0.15, s * zl], 0.014, 6);
            for (const y of [BX.doorFoot + 0.15, BX.doorTop - 0.15]) m.rod("steel", [X(u), y, s * (zf + 0.03)], [X(u), y, s * zl], 0.016, 4, false);
            m.rod("steel", [X(u), 1.7, s * zl], [X(u + Math.sign(u) * 0.25), 1.55, s * zl], 0.014, 4);
          }
          block(m, "steel", ...span(l.track[0] - 0.05, l.track[1] + 0.05), BX.doorTop, BX.eave - 0.075, ...side(s, H, H + 0.17));
          block(m, l.body, ...span(l.track[0] - 0.05, l.track[1] + 0.05), BX.doorFoot - 0.06, BX.doorFoot, ...side(s, H + 0.05, H + 0.15));
          for (const u of l.track) block(m, "black", ...span(u - 0.045, u + 0.045), BX.doorFoot - 0.02, BX.doorFoot + 0.12, ...side(s, H + 0.055, H + BX.doorIn));
        });
        m.scope("lettering", () => {
          for (const k of l.marks()) {
            const lay = 0.003 * (1 + (k.layer ?? 0));
            const put = (tris: readonly BxUV[], z: number): void => m.facets(k.mat, tris.map(([u, v]): Vec3 => [X(u), v, s * z]), [0, 0, s]);
            if (k.z !== undefined) { put(k.tris, H + k.z); continue; }
            put(k.tris, H + lay);
            // the same marks on the outer faces of the posts they cross
            for (const u of posts) {
              const { f, d } = hat(u), w = d > BX.post ? 0.1 : 0.075;
              const on = bxClipU(k.tris, u - f, u + f);
              if (on.length) put(on, H + d + lay);
              // and on its two sloping flanks, so a letter runs on unbroken
              for (const g of [-1, 1]) {
                const [a, b] = g < 0 ? [u - w, u - f] : [u + f, u + w];
                const fl = bxClipU(k.tris, a, b);
                const zOf = (p: number): number => H + 0.012 + (d - 0.012) * (g < 0 ? (p - a) / (b - a) : (b - p) / (b - a)) + lay;
                if (fl.length) m.facets(k.mat, fl.map(([p, v]): Vec3 => [X(p), v, s * zOf(p)]), [0, 0, s]);
              }
            }
          }
        });
        m.scope("ladders", () => {
          // the side ladders' rungs between the corner post and the last post, the sill steps under them
          const last = l.posts[l.posts.length - 1]!, zr = H + 0.17;
          for (const e of [-1, 1]) {
            const [ua, ub] = [e * (BX.body - 0.03), e * last];
            for (const y of [1.12, 1.6, 2.08, 2.56]) {
              m.rod("handrail", [X(ua), y, s * zr], [X(ub), y, s * zr], 0.016, 6);
              m.rod("handrail", [X(ua), y, s * (H + 0.08)], [X(ua), y, s * zr], 0.014, 4, false);
              m.rod("handrail", [X(ub), y, s * (H + BX.post)], [X(ub), y, s * zr], 0.014, 4, false);
            }
            const st = [X(e * (BX.body - 0.12)), X(e * (BX.body - 0.47))];
            for (const x of st) m.rod("handrail", [x, BX.bottom, s * (H + 0.06)], [x, 0.45, s * (H + 0.1)], 0.018, 4, false);
            m.rod("handrail", [st[0]!, 0.45, s * (H + 0.1)], [st[1]!, 0.45, s * (H + 0.1)], 0.02, 4);
          }
        });
      });
    for (const e of [1, -1])
      m.scope(e > 0 ? "front end" : "rear end", () => {
        const x = e * BX.body;
        const ax = (a: number, b: number): [number, number] => [Math.min(x + e * a, x + e * b), Math.max(x + e * a, x + e * b)];
        // the improved Dreadnaught end: six broad ribs, the end sill and the striker
        m.scope("corrugations", () => {
          const pitch = (BX.eave - 0.1 - (BX.sheet + 0.04)) / 6;
          for (let i = 0; i < 6; i++) {
            const y0 = BX.sheet + 0.04 + i * pitch, y1 = y0 + pitch * 0.8;
            const ring: Array<[number, number]> = [[x - e * 0.01, y0], [x + e * 0.04, y0], [x + e * 0.1, y0 + 0.06], [x + e * 0.13, y0 + 0.14], [x + e * 0.13, y1 - 0.14], [x + e * 0.1, y1 - 0.06], [x + e * 0.04, y1], [x - e * 0.01, y1]];
            extrude(m, l.body, "z", e > 0 ? ring : [...ring].reverse(), [-1.34, 1.34]);
          }
        });
        block(m, l.body, ...ax(0, 0.12), 0.64, BX.sheet, -1.4, 1.4);
        block(m, "knuckle", ...ax(0.12, 0.18), 0.66, 1.06, -0.26, 0.26);
        // the end ladder at the right-hand corner seen from the end
        const zl = -e * 1.18;
        for (const y of [1.12, 1.6, 2.08, 2.56, 3.04]) bxGrab(m, [x + e * 0.13, y, zl - 0.2], [x + e * 0.13, y, zl + 0.2], [e, 0, 0], 0.1);
        if (e < 0)
          m.scope("hand brake", () => {
            // the B end: the vertical brake wheel, its housing, the brake step under it and the chain down to the gear
            const zb = 0.5, yb = 3.1;
            block(m, "black", ...ax(0.13, 0.28), yb - 0.48, yb - 0.1, zb - 0.16, zb + 0.16);
            m.tube("black", "x", zb, yb, 0.28, 0.25, ...ax(0.34, 0.37), 12);
            for (const t of [0, 1, 2]) {
              const ang = Math.PI / 2 + (t * 2 * Math.PI) / 3;
              m.rod("black", [x + e * 0.355, yb, zb], [x + e * 0.355, yb + Math.sin(ang) * 0.255, zb + Math.cos(ang) * 0.255], 0.015, 4, false);
            }
            m.rod("black", [x + e * 0.28, yb, zb], [x + e * 0.37, yb, zb], 0.04, 6);
            block(m, "steel", ...ax(0.13, 0.44), 2.02, 2.06, zb - 0.45, zb + 0.45);
            for (const z of [zb - 0.4, zb + 0.4]) m.rod("steel", [x + e * 0.13, 1.8, z], [x + e * 0.42, 2.02, z], 0.015, 4, false);
            m.rod("steel", [x + e * 0.2, yb - 0.48, zb], [x + e * 0.2, 1.02, zb], 0.015, 4, false);
          });
      });
  });
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => bxTruck(m, BX.centre)));
    m.scope("rear truck", () => m.bogie(() => bxTruck(m, -BX.centre)));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front coupler" : "rear coupler", () => knuckleCoupler(m, e, BX.sill, BOXCAR_LENGTH / 2, COUPLER_Y));
  return m;
}

export function boxcarLod(params?: ParamValues): MeshBuilder {
  const l = BOXCAR_LIVERIES[resolveParams(BOXCAR_PARAMS, params).livery!]!;
  const body: UnitBody = {
    y0: BX.bottom, hw: [[BX.bottom, BX.half + 0.1], [BX.eave, BX.half + 0.1], [BX.ridge, 0.3]], side: [[BX.bottom, BX.ridge, l.body]], roof: l.body,
    front: { tip: [[BX.bottom, BX.body + 0.08]] }, rear: { tip: [[BX.bottom, -BX.body - 0.08]] },
    windows: l.door === l.body ? [] : l.leaves.map(([u0, u1]) => ({ u: [u0, u1] as const, y: [BX.doorFoot, BX.doorTop] as const, mat: l.door })),
  };
  const parts: LodPart[] = bogieParts([[BX.centre, 1.3], [-BX.centre, 1.3]], BX.bottom);
  return fitUnit({ palette: { ...US_PALETTE, ...l.palette }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// Double-stack well car: a stand-alone 40 ft car of TTX's DTTX 45xxxx series (the
// Gunderson "Husky-Stack" type), measured from assets/us-well-car/ (DTTX 455501
// side-on at 43.9 px/m: the 40 ft container's 12.19 m over 535 px). Deep side
// girders round an open well whose floor is cross-bearers with X braces; the
// girders' bottoms slope up to the end structures over the trucks, which carry the
// perforated walkways, the container guides, the end ladders and, on the B end
// (-x), the brake wheel on its stand. Along a side, u runs from the viewer's left
// to right (x = s * u), so both sides read alike.

export const WELL_PARAMS: readonly ParamSpec[] = [{
  name: "cargo", title: "Cargo", default: "single",
  values: [{ value: "empty", title: "Empty" }, { value: "single", title: "Single stack" }, { value: "double", title: "Double stack" }],
}];
export const WELL_LENGTH = ft(63, 6);
/**
 * The car's measures (m): the end sills, the well's ends, the girders' deep bottom
 * and where it slopes up to the bottom over the trucks, the top chord, the end
 * structure's underside, the girders' outer and inner faces and the chord's reach.
 */
const WL = {
  sill: 8.85, well: 6.3, flat: 6.15, slope: 6.95, deck: 0.36, bottom: 0.2, high: 0.68, chord: 1.03, top: 1.25, endUnder: 0.9,
  outer: 1.5, inner: 1.34, chordOut: 1.56, chordIn: 1.28, centre: ft(52) / 2,
};
/** An ISO 40 ft high-cube container: 12.19 by 2.44 by 2.9 m. */
const CONTAINER = { len: 12.19, half: 1.22, h: 2.9 };
const WC_PALETTE: Record<string, MaterialSpec> = {
  ...US_PALETTE, wcYellow: paint("#d9aa3e", 0.7), wcGrate: paint("#9c9a92", 0.6), wcRed: paint("#b5262c", 0.6),
  cBlue: paint("#24508f", 0.6), cRed: paint("#9a2d22", 0.6), cWhite: paint("#ecebe6", 0.5),
};

/** A quad in (u, v) as two triangles. */
const wcRect = (u0: number, u1: number, v0: number, v1: number): BxUV[] => [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]];

/** A plain plate along z (its outline in x, y, convex) from z0 to z1. */
function wcPlate(m: MeshBuilder, mat: string, pts: Array<[number, number]>, z0: number, z1: number): void {
  const area = pts.reduce((a, p, i) => { const n = pts[(i + 1) % pts.length]!; return a + p[0] * n[1] - n[0] * p[1]; }, 0);
  extrude(m, mat, "z", area > 0 ? pts : [...pts].reverse(), [z0, z1]);
}

/** A perforated walkway plate: x0 .. x1 by z0 .. z1 on top of y, its holes `pitch` apart. */
function wcGrating(m: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, pitch: number): void {
  block(m, "wcGrate", x0, x1, y, y + 0.025, z0, z1);
  const nx = Math.floor((x1 - x0) / pitch), nz = Math.floor((z1 - z0) / pitch);
  const ox = x0 + (x1 - x0 - (nx - 1) * pitch) / 2, oz = z0 + (z1 - z0 - (nz - 1) * pitch) / 2, r = pitch * 0.22;
  const pts: Vec3[] = [];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const [x, z] = [ox + i * pitch + ((j % 2) * pitch) / 2, oz + j * pitch];
      if (x + r > x1 - 0.02) continue;
      pts.push([x - r, y + 0.028, z - r], [x + r, y + 0.028, z + r], [x + r, y + 0.028, z - r], [x - r, y + 0.028, z - r], [x - r, y + 0.028, z + r], [x + r, y + 0.028, z + r]);
    }
  m.facets("black", pts, [0, 1, 0]);
}

/** The side girder on side s: the deep plate, its bottom flange, the top chord, the stiffeners inside. */
function wcGirder(m: MeshBuilder, s: number): void {
  const z = side(s, WL.inner, WL.outer);
  // the plate: the deep middle with its sloping ends, the shallow parts over the trucks
  wcPlate(m, "wcYellow", [[-WL.slope, WL.high], [-WL.flat, WL.bottom], [WL.flat, WL.bottom], [WL.slope, WL.high], [WL.slope, WL.chord], [-WL.slope, WL.chord]], ...z);
  for (const e of [1, -1]) wcPlate(m, "wcYellow", [[e * WL.slope, WL.high], [e * WL.sill, WL.high], [e * WL.sill, WL.chord], [e * WL.slope, WL.chord]], ...z);
  // the bottom flange following the plate's lower edge
  const edge: Array<[number, number]> = [[-WL.sill, WL.high], [-WL.slope, WL.high], [-WL.flat, WL.bottom], [WL.flat, WL.bottom], [WL.slope, WL.high], [WL.sill, WL.high]];
  for (let i = 0; i + 1 < edge.length; i++) {
    const [[xa, ya], [xb, yb]] = [edge[i]!, edge[i + 1]!];
    wcPlate(m, "wcYellow", [[xa, ya], [xb, yb], [xb, yb + 0.03], [xa, ya + 0.03]], ...side(s, WL.inner - 0.08, WL.outer + 0.02));
  }
  // the top chord: a box section wider than the plate, its lip along the outside
  block(m, "wcYellow", -WL.sill, WL.sill, WL.chord, WL.top, ...side(s, WL.chordIn, WL.chordOut));
  block(m, "wcYellow", -WL.sill, WL.sill, WL.chord - 0.04, WL.chord, ...side(s, WL.outer, WL.chordOut));
  // the end posts outside where the slope meets the shallow part, and at the end sill
  for (const e of [1, -1])
    for (const x of [WL.slope, WL.sill - 0.05]) block(m, "wcYellow", e * x - 0.05, e * x + 0.05, WL.high, WL.chord - 0.04, ...side(s, WL.outer, WL.outer + 0.018));
  // the stiffeners on the inner face, at the floor's cross-bearers
  for (const x of WC_BEARERS) {
    const yb = Math.abs(x) > WL.flat ? WL.bottom + ((Math.abs(x) - WL.flat) / (WL.slope - WL.flat)) * (WL.high - WL.bottom) : WL.bottom;
    block(m, "wcYellow", x - 0.05, x + 0.05, yb + 0.03, WL.chord, ...side(s, WL.inner - 0.06, WL.inner));
  }
}
/** The well floor's cross-bearers (x), the container's corners resting on the outer two. */
const WC_BEARERS = [-6.05, -4.03, -2.02, 0, 2.02, 4.03, 6.05];

/** The well floor: cross-bearers between the girders, X braces in each bay, the container pedestals. */
function wcFloor(m: MeshBuilder): void {
  const zi = WL.inner - 0.06;
  for (const x of WC_BEARERS) block(m, "wcYellow", x - 0.1, x + 0.1, WL.bottom + 0.02, WL.deck - 0.04, -zi, zi);
  for (let i = 0; i + 1 < WC_BEARERS.length; i++) {
    const [xa, xb] = [WC_BEARERS[i]! + 0.1, WC_BEARERS[i + 1]! - 0.1];
    for (const k of [-1, 1]) m.rod("wcYellow", [xa, WL.bottom + 0.06, -k * zi], [xb, WL.bottom + 0.06, k * zi], 0.035, 4);
  }
  // the container pedestals at the 40 ft corners, their locating cones (inter-box connectors)
  for (const e of [1, -1])
    for (const sd of [-1, 1]) {
      const [x, z] = [e * (CONTAINER.len / 2 - 0.09), sd * (CONTAINER.half - 0.08)];
      block(m, "wcYellow", x - 0.17, x + 0.17, WL.deck - 0.04, WL.deck - 0.005, z - 0.14, z + 0.14);
      m.prism("black", ngon(4, 0.05, Math.PI / 4, x, z), WL.deck - 0.005, WL.deck + 0.06);
    }
}

/** The end structure on end e: the well's end wall, the box over the truck, walkways, guides, ladders, steps. */
function wcEnd(m: MeshBuilder, e: number): void {
  const ax = (a: number, b: number): [number, number] => [Math.min(e * a, e * b), Math.max(e * a, e * b)];
  const zi = WL.inner;
  // the well's end wall, the box over the truck, the body bolster, the draft sill and the end sill
  block(m, "wcYellow", ...ax(WL.well, WL.well + 0.25), WL.bottom + 0.05, WL.top, -zi, zi);
  block(m, "wcYellow", ...ax(WL.well + 0.25, WL.sill), WL.endUnder, WL.top, -zi, zi);
  block(m, "wcYellow", ...ax(WL.centre - 0.25, WL.centre + 0.25), 0.82, WL.endUnder, -1.25, 1.25);
  block(m, "wcYellow", ...ax(WL.centre + 0.4, WL.sill), 0.66, WL.endUnder, -0.28, 0.28);
  block(m, "wcYellow", ...ax(WL.sill, WL.sill + 0.06), 0.62, WL.top, -WL.outer, WL.outer);
  // the walkways: across the well's end, across the car's end, the chord tops along the well's end
  wcGrating(m, ...ax(WL.well - 0.05, WL.well + 0.6), -WL.chordOut, WL.chordOut, WL.top, 0.11);
  wcGrating(m, ...ax(WL.sill - 0.55, WL.sill + 0.06), -WL.chordOut, WL.chordOut, WL.top, 0.11);
  for (const sd of [-1, 1]) wcGrating(m, ...ax(WL.well - 1.7, WL.well - 0.05), ...side(sd, WL.chordIn, WL.chordOut), WL.top, 0.09);
  // the raised box between them, its sloped cover over the bolster
  const [xa, xb] = [WL.well + 0.6, WL.sill - 0.55];
  wcPlate(m, "wcYellow", [[e * xa, WL.top], [e * xb, WL.top], [e * (xb - 0.12), WL.top + 0.16], [e * (xa + 0.12), WL.top + 0.16]], -1.0, 1.0);
  // the container guides at the well's corners: an angle standing on the walkway, both legs flared outward at the top
  for (const sd of [-1, 1]) {
    const [y0, y1, y2] = [WL.top + 0.025, WL.top + 0.33, WL.top + 0.48];
    block(m, "wcYellow", ...ax(WL.well - 0.02, WL.well + 0.02), y0, y1, ...side(sd, 0.95, 1.32));
    block(m, "wcYellow", ...ax(WL.well - 0.38, WL.well - 0.02), y0, y1, ...side(sd, 1.28, 1.32));
    const P = (x: number, y: number, z: number): Vec3 => [e * x, y, sd * z];
    m.slab("wcYellow", [P(WL.well - 0.02, y1, 0.95), P(WL.well - 0.02, y1, 1.32), P(WL.well + 0.1, y2, 1.4), P(WL.well + 0.1, y2, 0.95)], [e * 0.04, 0, 0]);
    m.slab("wcYellow", [P(WL.well - 0.38, y1, 1.28), P(WL.well - 0.02, y1, 1.28), P(WL.well + 0.1, y2, 1.4), P(WL.well - 0.38, y2, 1.4)], [0, 0, sd * 0.04]);
  }
  // the train line's angle cock and air hose beside the coupler
  m.rod("steel", [e * (WL.sill + 0.06), 0.72, e * 0.42], [e * (WL.sill + 0.2), 0.72, e * 0.42], 0.03, 6);
  m.rod("hose", [e * (WL.sill + 0.2), 0.72, e * 0.42], [e * (WL.sill + 0.45), 0.5, e * 0.3], 0.03, 6);
  // the end ladders at both corners, their stiles reaching up as grab irons, the sill steps below
  const xl = e * (WL.sill + 0.12);
  for (const sd of [-1, 1]) {
    const [za, zb] = [sd * 1.06, sd * 1.42];
    for (const z of [za, zb]) {
      m.rod("handrail", [xl, 0.42, z], [xl, 2.25, z], 0.02, 6);
      for (const y of [0.9, 2.1]) m.rod("handrail", [e * (WL.sill + 0.06), y, z], [xl, y, z], 0.016, 4, false);
    }
    for (const y of [0.42, 0.75, 1.6, 1.95, 2.25]) m.rod("handrail", [xl, y, za], [xl, y, zb], 0.016, 6);
    // the side's sill step and the grab iron over it
    const xs = e * (WL.sill - 0.35);
    for (const x of [xs - 0.2, xs + 0.2]) m.rod("handrail", [x, WL.high, sd * (WL.outer - 0.02)], [x, 0.4, sd * (WL.outer + 0.06)], 0.018, 4, false);
    m.rod("handrail", [xs - 0.2, 0.4, sd * (WL.outer + 0.06)], [xs + 0.2, 0.4, sd * (WL.outer + 0.06)], 0.02, 4);
    bxGrab(m, [xs - 0.25, 1.0, sd * WL.outer], [xs + 0.25, 1.0, sd * WL.outer], [0, 0, sd], 0.07);
  }
  if (e < 0)
    m.scope("hand brake", () => {
      // the B end: the brake wheel on its stand, the housing, the chain down to the gear; the reservoir and valve beside it
      const [zb, yb] = [0.45, 2.2];
      block(m, "wcYellow", ...ax(WL.sill - 0.25, WL.sill - 0.05), WL.top + 0.025, yb - 0.25, zb - 0.12, zb + 0.12);
      block(m, "black", ...ax(WL.sill - 0.05, WL.sill + 0.08), yb - 0.3, yb + 0.08, zb - 0.15, zb + 0.15);
      m.tube("black", "x", zb, yb, 0.28, 0.25, ...ax(WL.sill + 0.12, WL.sill + 0.15), 14);
      for (const t of [0, 1, 2]) {
        const ang = Math.PI / 2 + (t * 2 * Math.PI) / 3;
        m.rod("black", [e * (WL.sill + 0.135), yb, zb], [e * (WL.sill + 0.135), yb + Math.sin(ang) * 0.255, zb + Math.cos(ang) * 0.255], 0.015, 4, false);
      }
      m.rod("black", [e * (WL.sill + 0.08), yb, zb], [e * (WL.sill + 0.16), yb, zb], 0.04, 6);
      m.rod("steel", [e * (WL.sill + 0.02), yb - 0.3, zb], [e * (WL.sill + 0.02), 0.95, zb + 0.2], 0.012, 4, false);
      m.sweep("black", "z", ngon(10, 0.17, 0, e * (WL.centre - 0.1), WL.top + 0.17), -1.1, ngon(10, 0.17, 0, e * (WL.centre - 0.1), WL.top + 0.17), -0.3);
      block(m, "black", ...ax(WL.centre + 0.25, WL.centre + 0.6), WL.top + 0.025, WL.top + 0.4, -0.95, -0.6);
    });
}

/** TTX's mark: the T T and the X with its chevron half, from u0, v0 .. v0 + h. */
function wcTtx(u0: number, v0: number, h: number): BxUV[] {
  const w = h * 1.05, st = h * 0.24;
  const T = (u: number): BxUV[] => [...wcRect(u, u + w, v0 + h - st, v0 + h), ...wcRect(u + w / 2 - st / 2, u + w / 2 + st / 2, v0, v0 + h - st)];
  const ux = u0 + 2 * w + 0.04;
  return [...T(u0), ...T(u0 + w + 0.02), ...bxBars([[[ux + st / 2, v0 + h - st / 2], [ux + w - st / 2, v0 + st / 2]], [[ux + st / 2, v0 + st / 2], [ux + w - st / 2, v0 + h - st / 2]]], st)];
}

/** The side lettering of DTTX 455501, both sides alike: the well's size, the reporting marks, the TTX mark, the data. */
function wcMarks(): Array<{ mat: string; tris: BxUV[]; layer?: number }> {
  return [
    { mat: "black", tris: [...bxText("40", -6.26, 0.47, 0.38, 0.2, 0.05, 0.08), ...wcRect(-5.19, -2.62, 0.8, 1.0)] },
    { mat: "cWhite", layer: 1, tris: [...bxText("DTTX", -4.8, 0.82, 0.16, 0.14, 0.05, 0.034), ...bxText("455501", -3.42, 0.82, 0.16, 0.12, 0.034, 0.034)] },
    { mat: "wcRed", tris: wcTtx(2.24, 0.58, 0.4) },
    { mat: "black", tris: [
      ...bxText("FORWARD THINKING", 2.92, 0.49, 0.05, 0.07, 0.02, 0.009),
      ...bxText("LD LMT", 4.6, 0.86, 0.06, 0.04, 0.015, 0.01), ...bxText("LT WT", 4.6, 0.76, 0.06, 0.04, 0.015, 0.01),
      ...bxText("LOAD ONLY 40 FT CONTAINERS", -3.9, 0.66, 0.05, 0.035, 0.012, 0.008),
    ] },
    // the consolidated stencil, its white outline, and the conspicuity reflectors along the bottom
    { mat: "cWhite", tris: [...wcRect(5.92, 6.39, 0.54, 0.56), ...wcRect(5.92, 6.39, 0.79, 0.81), ...wcRect(5.92, 5.94, 0.54, 0.81), ...wcRect(6.37, 6.39, 0.54, 0.81), ...wcRect(6.145, 6.165, 0.56, 0.79)] },
    { mat: "safety", tris: [...wcRect(-4.5, -4.2, 0.3, 0.4), ...wcRect(-0.15, 0.15, 0.3, 0.4), ...wcRect(4.2, 4.5, 0.3, 0.4), ...wcRect(-8.6, -8.3, 0.73, 0.83), ...wcRect(8.3, 8.6, 0.73, 0.83)] },
  ];
}

/** A 40 ft high-cube container from y0: corrugated sides and blind end, the door end at -x with its locking bars, corner castings, its marks. */
function container(m: MeshBuilder, y0: number, mat: string, number: string): void {
  const { len, half, h } = CONTAINER;
  const [x0, x1, y1] = [-len / 2, len / 2, y0 + h];
  const post = 0.17, d = 0.036;
  // the body behind the panels, the roof, the top and bottom side rails, the corner posts
  block(m, mat, x0 + 0.03, x1 - 0.05, y0 + 0.02, y1 - 0.02, -(half - 0.05), half - 0.05);
  block(m, mat, x0 + post, x1 - post, y1 - 0.04, y1 - 0.012, -(half - 0.05), half - 0.05);
  // the roof's shallow ribs across
  for (let i = 0; i < 21; i++) { const x = x0 + 0.5 + i * ((len - 1.0) / 20); block(m, mat, x - 0.05, x + 0.05, y1 - 0.012, y1 - 0.005, -(half - 0.06), half - 0.06); }
  for (const s of [-1, 1]) {
    block(m, mat, x0, x1, y0, y0 + 0.16, ...side(s, half - 0.06, half));
    block(m, mat, x0, x1, y1 - 0.11, y1, ...side(s, half - 0.06, half));
    for (const x of [x0, x1 - post]) block(m, mat, x, x + post, y0, y1, ...side(s, half - post, half));
  }
  for (const x of [x0, x1 - 0.12]) {
    block(m, mat, x, x + 0.12, y0, y0 + 0.14, -(half - post), half - post);
    block(m, mat, x, x + 0.12, y1 - 0.2, y1, -(half - post), half - post);
  }
  // the corrugations: trapezoids pressed in, 0.278 m pitch
  const corr = (a: number, b: number): Array<[number, number]> => {
    const n = Math.round((b - a) / 0.278), p = (b - a) / n, out: Array<[number, number]> = [];
    for (let i = 0; i < n; i++) { const q = a + i * p; out.push([q, 0], [q + p * 0.26, 0], [q + p * 0.38, d], [q + p * 0.88, d], [q + p, 0]); }
    return out;
  };
  const [ya, yb] = [y0 + 0.16, y1 - 0.11];
  for (const s of [-1, 1]) {
    const pts = corr(x0 + post, x1 - post);
    for (let i = 0; i + 1 < pts.length; i++) {
      const [[ua, da], [ub, db]] = [pts[i]!, pts[i + 1]!];
      if (ua === ub && da === db) continue;
      const P = (u: number, dd: number, y: number): Vec3 => [u, y, s * (half - dd)];
      if (s > 0) m.quad(mat, P(ua, da, ya), P(ub, db, ya), P(ub, db, yb), P(ua, da, yb));
      else m.quad(mat, P(ub, db, ya), P(ua, da, ya), P(ua, da, yb), P(ub, db, yb));
    }
  }
  {
    // the blind end at +x: corrugated across
    const pts = corr(-(half - post), half - post);
    const [yc, yd] = [y0 + 0.14, y1 - 0.2];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [[ua, da], [ub, db]] = [pts[i]!, pts[i + 1]!];
      if (ua === ub && da === db) continue;
      const P = (u: number, dd: number, y: number): Vec3 => [x1 - dd, y, -u];
      m.quad(mat, P(ua, da, yc), P(ub, db, yc), P(ub, db, yd), P(ua, da, yd));
    }
  }
  m.scope("doors", () => {
    // two leaves set in the frame, three ribs each, the hinges, four locking bars with their keepers and handles
    const [yc, yd] = [y0 + 0.14, y1 - 0.2];
    for (const s of [-1, 1]) {
      const [za, zb] = side(s, 0.005, half - post);
      block(m, mat, x0 + 0.03, x0 + 0.06, yc, yd, za, zb);
      for (const t of [0.25, 0.5, 0.75]) block(m, mat, x0 + 0.015, x0 + 0.03, yc + 0.08, yd - 0.08, s * (0.03 + t * (half - post - 0.06)) - 0.04, s * (0.03 + t * (half - post - 0.06)) + 0.04);
      for (const y of [yc + 0.25, yc + 0.95, yd - 0.95, yd - 0.25]) block(m, "steel", x0 - 0.015, x0, y - 0.06, y + 0.06, ...side(s, half - post - 0.06, half - post + 0.04));
      for (const zc of [0.32, 0.82]) {
        const z = s * zc;
        m.rod("steel", [x0 - 0.035, yc + 0.02, z], [x0 - 0.035, yd - 0.02, z], 0.017, 6);
        for (const y of [yc + 0.03, yd - 0.03]) block(m, "steel", x0 - 0.06, x0, y - 0.04, y + 0.04, z - 0.04, z + 0.04);
        for (const y of [yc + 0.4, yd - 0.4]) block(m, "steel", x0 - 0.05, x0, y - 0.02, y + 0.02, z - 0.035, z + 0.035);
        m.rod("steel", [x0 - 0.035, y0 + 1.15, z], [x0 - 0.06, y0 + 1.0, z - s * 0.28], 0.014, 4);
      }
    }
  });
  m.scope("corner castings", () => {
    // the eight castings standing a little proud, their apertures on the side, end and top faces
    for (const [xa, ex] of [[x0, -1], [x1, 1]] as const)
      for (const [ya2, ey] of [[y0, -1], [y1, 1]] as const)
        for (const s of [-1, 1]) {
          const xc = xa - ex * 0.089, yc = ya2 - ey * 0.059, zc = s * (half - 0.081);
          block(m, mat, xc - 0.095, xc + 0.095, yc - 0.064, yc + 0.064, zc - 0.087, zc + 0.087);
          decalZ(m, "black", s * (half + 0.009), s, xc - 0.06, xc + 0.06, yc - 0.03, yc + 0.03);
          decalX(m, "black", xa + ex * 0.009, ex, zc - 0.03, zc + 0.03, yc - 0.03, yc + 0.03);
        }
  });
  m.scope("marks", () => {
    // the owner's code and number near the door end, the high-cube stripes at the top corners
    for (const s of [-1, 1]) {
      const zw = half + 0.003;
      sideText(m, "cWhite", number, s, zw, x0 + 1.4, y1 - 0.42, 0.14);
      for (const xe of [x0 + 0.25, x1 - 0.85])
        for (let i = 0; i < 6; i++) {
          const xa = xe + i * 0.1;
          m.facets(i % 2 ? "black" : "hazard", [[xa, y1 - 0.105, s * zw], [xa + 0.1, y1 - 0.105, s * zw], [xa + 0.1, y1 - 0.005, s * zw], [xa, y1 - 0.105, s * zw], [xa + 0.1, y1 - 0.005, s * zw], [xa, y1 - 0.005, s * zw]], [0, 0, s]);
        }
    }
    m.facets("cWhite", bxText(number, -0.55, y1 - 0.55, 0.09, 0.045, 0.02, 0.014).map(([u, v]): Vec3 => [x0 + 0.012, v, u]), [-1, 0, 0]);
  });
}

/** Inter-box connectors between the lower box's top castings and the upper's bottom ones. */
function wcIbcs(m: MeshBuilder, y: number): void {
  for (const ex of [-1, 1]) for (const s of [-1, 1]) block(m, "black", ex * (CONTAINER.len / 2 - 0.089) - 0.07, ex * (CONTAINER.len / 2 - 0.089) + 0.07, y, y + 0.02, s * (CONTAINER.half - 0.081) - 0.06, s * (CONTAINER.half - 0.081) + 0.06);
}

export function wellCar(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(WELL_PARAMS, params);
  const m = new MeshBuilder(WC_PALETTE);
  m.scope("car", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        wcGirder(m, s);
        m.scope("lettering", () => {
          for (const k of wcMarks()) {
            const z = s * (WL.outer + 0.003 * (1 + (k.layer ?? 0)));
            m.facets(k.mat, k.tris.map(([u, v]): Vec3 => [s * u, v, z]), [0, 0, s]);
          }
        });
      });
    m.scope("floor", () => wcFloor(m));
    for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => wcEnd(m, e));
  });
  if (cargo !== "empty")
    m.scope("containers", () => {
      m.scope("lower", () => container(m, WL.deck, "cBlue", "RIXU 401235 0"));
      if (cargo === "double")
        m.scope("upper", () => {
          wcIbcs(m, WL.deck + CONTAINER.h);
          container(m, WL.deck + CONTAINER.h + 0.02, "cRed", "RIXU 512870 3");
        });
    });
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => bxTruck(m, WL.centre)));
    m.scope("rear truck", () => m.bogie(() => bxTruck(m, -WL.centre)));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front coupler" : "rear coupler", () => knuckleCoupler(m, e, WL.sill + 0.06, WELL_LENGTH / 2, COUPLER_Y));
  return m;
}

export function wellCarLod(params?: ParamValues): MeshBuilder {
  const { cargo } = resolveParams(WELL_PARAMS, params);
  // the girders and end structures as one box, the containers standing out of the well on it, the trucks
  const body: UnitBody = { y0: WL.bottom, hw: [[WL.bottom, WL.outer], [WL.top, WL.outer]], side: [[WL.bottom, WL.top, "wcYellow"]], roof: "wcYellow", front: { tip: [[WL.bottom, WL.sill]] }, rear: { tip: [[WL.bottom, -WL.sill]] }, windows: [] };
  const [x0, x1] = [-CONTAINER.len / 2, CONTAINER.len / 2];
  const boxes: Array<[number, string]> = cargo === "empty" ? [] : cargo === "single" ? [[WL.deck, "cBlue"]] : [[WL.deck, "cBlue"], [WL.deck + CONTAINER.h + 0.02, "cRed"]];
  const parts: LodPart[] = [
    ...bogieParts([[WL.centre, 1.3], [-WL.centre, 1.3]], WL.endUnder),
    ...boxes.map(([y0, mat]): LodPart => ({ draw: (m) => m.scope("containers", () => block(m, mat, x0, x1, Math.max(y0, WL.top - 0.1), y0 + CONTAINER.h, -CONTAINER.half, CONTAINER.half)) })),
  ];
  return fitUnit({ palette: WC_PALETTE, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// San Francisco cable car: the single-ended Powell Street car (an open grip section ahead of
// the closed saloon, an open rear platform behind it; turned on turntables) and the longer,
// double-ended California Street car (open grip sections at both ends of the saloon).
// Measured from the photographs in assets/sf-cable-car/SOURCES.md; +X is the Powell car's grip end.

import { letters, wordWidth } from "./letters.ts";
import type { Table } from "./lodKit.ts";

export const CABLE_CAR_PARAMS: readonly ParamSpec[] = [{
  name: "livery", title: "Livery", default: "powell",
  values: [{ value: "powell", title: "Powell Street" }, { value: "california", title: "California St" }],
}];

/** One line's car: its length over the fenders, its saloon, its trucks and its paint. */
interface CableLine {
  length: number;
  /** The closed saloon's ends (model x). */
  saloon: readonly [number, number];
  /** The -X end: false for the Powell car's open rear platform, true for the California car's second grip section. */
  doubleEnded: boolean;
  /** The trucks' centres (model x). */
  trucks: readonly [number, number];
  number: string;
  /** The dash panels' colour. */
  dash: string;
  palette: Record<string, MaterialSpec>;
}

const CABLE_COMMON: Record<string, MaterialSpec> = {
  ccTrim: paint("#a5cad0"), ccFrame: paint("#c08b3c", 0.45), ccWood: paint("#94612f", 0.6), ccDeck: paint("#4e3d2e", 0.85),
  ccRoof: paint("#a08259", 0.8), ccCeiling: paint("#b98a4b", 0.6), ccPanel: paint("#ebe4cf"), ccGold: { color: "#c9a14a", metallic: 0.4, roughness: 0.4 },
  ccPole: paint("#f1efe7", 0.35), ccStep: paint("#b9c2c4", 0.8), ccFender: paint("#e3ddcc", 0.6), ccAd: paint("#c9dde1", 0.5),
  ccClere: { color: "#8a6a3a", metallic: 0, roughness: 0.15, glass: true },
  brass: { color: "#b8913a", metallic: 0.45, roughness: 0.35 },
};
const CABLE_LINES: Record<string, CableLine> = {
  // Powell car 5 side-on (50.6 px/m over 27 ft 6 in): the grip section 3.0 m from the front, the saloon 4.17 m, the rear platform 1.2 m
  powell: { length: ft(27, 6), saloon: [-3.0, 1.17], doubleEnded: false, trucks: [2.2, -2.25], number: "24", dash: "ccDash", palette: { ccBody: paint("#6a1b23"), ccDash: paint("#ece8dc", 0.45) } },
  // a California car (30 ft 3 in): two grip sections of 2.6 m round a 3.9 m saloon
  california: { length: ft(30, 3), saloon: [-1.95, 1.95], doubleEnded: true, trucks: [2.55, -2.55], number: "55", dash: "ccBody", palette: { ccBody: paint("#7a1c25"), ccDash: paint("#7a1c25") } },
};
/** The Powell car's length; the California car's is in CABLE_CAR_LENGTHS. */
export const CABLE_CAR_LENGTH = CABLE_LINES.powell!.length;
export const CABLE_CAR_LENGTHS: Record<string, number> = { powell: CABLE_LINES.powell!.length, california: CABLE_LINES.california!.length };

/** Heights over the rail and the half width (8 ft over the body). */
const CH = {
  half: ft(4), sill: 0.3, band: 0.42, floor: 0.655, belt: 1.32, head: 2.36, eave: 2.47, dash0: 0.55, dash1: 1.38, cap: 1.43,
  roofHalf: 1.3, deck: 2.65, clereHalf: 0.72, clere: 2.97, top: 3.11, step: 0.36,
};

/** Text `h` high on a vertical plane: u along `along` from `at` (centred), v up; the ampersand is drawn here. */
function cableText(m: MeshBuilder, mat: string, text: string, at: Vec3, along: Vec3, normal: Vec3, y0: number, h: number): void {
  const style = { width: 0.62, weight: 0.15, gap: 0.14 };
  const amp = h * 0.62 * 0.8;
  const runs = text.split("&");
  const width = runs.reduce((t, r) => t + (r ? wordWidth(r, h, style) : 0), 0) + (runs.length - 1) * (amp + 2 * style.gap * h);
  let u = -width / 2;
  const put = (uv: Array<[number, number]>) => m.facets(mat, uv.map(([a, v]): Vec3 => [at[0] + along[0] * a, v, at[2] + along[2] * a]), normal);
  runs.forEach((r, i) => {
    if (i > 0) {
      u += style.gap * h;
      // the ampersand: a loop over a diagonal tail
      const pts: Array<[number, number]> = [[0.95, 0], [0.3, 0.62], [0.22, 0.8], [0.32, 1], [0.6, 1], [0.7, 0.85], [0.6, 0.66], [0.12, 0.34], [0.08, 0.14], [0.25, 0], [0.55, 0], [0.95, 0.38]];
      const t = style.weight * h;
      const tris: Array<[number, number]> = [];
      for (let k = 0; k + 1 < pts.length; k++) {
        const a: [number, number] = [u + pts[k]![0] * amp, y0 + pts[k]![1] * h], b: [number, number] = [u + pts[k + 1]![0] * amp, y0 + pts[k + 1]![1] * h];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        const nx = (-(b[1] - a[1]) / len) * (t / 2), ny = ((b[0] - a[0]) / len) * (t / 2);
        tris.push([a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] + nx, a[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]);
      }
      put(tris);
      u += amp + style.gap * h;
    }
    if (r) {
      put(letters(r, u, y0, h, false, style));
      u += wordWidth(r, h, style);
    }
  });
}
/** Text on the side z = s * z, reading left to right from outside. */
const cableSideText = (m: MeshBuilder, mat: string, text: string, s: number, z: number, xc: number, y0: number, h: number) => cableText(m, mat, text, [xc, 0, s * z], [s, 0, 0], [0, 0, s], y0, h);
/** Text on the +X end face x = x, reading left to right from outside (toward -z). */
const cableEndText = (m: MeshBuilder, mat: string, text: string, x: number, zc: number, y0: number, h: number) => cableText(m, mat, text, [x, 0, zc], [0, 0, -1], [1, 0, 0], y0, h);

/** A rectangle's outline of strips `w` wide on the +X face x = x (lining). */
function liningX(m: MeshBuilder, mat: string, x: number, z0: number, z1: number, y0: number, y1: number, w: number): void {
  decalX(m, mat, x, 1, z0, z1, y0, y0 + w);
  decalX(m, mat, x, 1, z0, z1, y1 - w, y1);
  decalX(m, mat, x, 1, z0, z0 + w, y0 + w, y1 - w);
  decalX(m, mat, x, 1, z1 - w, z1, y0 + w, y1 - w);
}
/** The same on the side z = z facing s. */
function liningZ(m: MeshBuilder, mat: string, z: number, s: number, x0: number, x1: number, y0: number, y1: number, w: number): void {
  decalZ(m, mat, z, s, x0, x1, y0, y0 + w);
  decalZ(m, mat, z, s, x0, x1, y1 - w, y1);
  decalZ(m, mat, z, s, x0, x0 + w, y0 + w, y1 - w);
  decalZ(m, mat, z, s, x1 - w, x1, y0 + w, y1 - w);
}

/** A window with a segmental arched head on the side z = s * z: glass from y0 to y1, the arch rising `rise`. */
function archZ(m: MeshBuilder, mat: string, z: number, s: number, x0: number, x1: number, y0: number, y1: number, rise: number): void {
  const pts: Array<[number, number]> = [[x0, y0], [x1, y0]];
  const n = 6, xm = (x0 + x1) / 2, hw = (x1 - x0) / 2;
  for (let i = 0; i <= n; i++) {
    const t = 1 - (2 * i) / n;
    pts.push([xm + t * hw, y1 - rise + rise * (1 - t * t)]);
  }
  const tris: Vec3[] = [];
  for (let i = 1; i + 1 < pts.length; i++) for (const p of [pts[0]!, pts[i]!, pts[i + 1]!]) tris.push([p[0], p[1], s * z]);
  m.facets(mat, tris, [0, 0, s]);
}

/** A white grab pole standing off a post at x on side s, with brass brackets. */
function grabPole(m: MeshBuilder, x: number, s: number, y0: number, y1: number): void {
  const z = s * (CH.half + 0.05);
  m.rod("ccPole", [x, y0, z], [x, y1, z], 0.019, 6);
  for (const y of [y0 + 0.05, y1 - 0.05]) m.rod("brass", [x, y, z], [x, y, s * (CH.half - 0.01)], 0.012, 4);
}

/** A small four-wheel truck: wheelsets, side frames with axle boxes and springs, the pine track brakes. */
function cableTruck(m: MeshBuilder, xc: number): void {
  const r = 0.27, N = 16;
  const ay = r * Math.cos(Math.PI / N);
  for (const dx of [-0.62, 0.62])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.06, 0, x, ay);
      m.sweep("steel", "z", axle, -0.86, axle, 0.86);
      for (const s of [-1, 1]) {
        const tread = ngon(N, r, Math.PI / N, x, ay), disc = ngon(12, r * 0.8, 0, x, ay);
        const [t0, t1] = side(s, 0.665, 0.8), [d0, d1] = side(s, 0.8, 0.82);
        m.sweep("steel", "z", tread, t0, tread, t1);
        m.sweep("wheel", "z", disc, d0, disc, d1);
      }
    });
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      // the side frame: a bar over the axle boxes, the boxes and their springs
      block(m, "bogie", xc - 0.9, xc + 0.9, ay + 0.14, ay + 0.24, ...side(s, 0.84, 0.92));
      for (const dx of [-0.62, 0.62]) {
        block(m, "bogie", xc + dx - 0.13, xc + dx + 0.13, ay - 0.1, ay + 0.1, ...side(s, 0.81, 0.95));
        block(m, "spring", xc + dx - 0.07, xc + dx + 0.07, ay + 0.1, ay + 0.14, ...side(s, 0.85, 0.91));
      }
    }
    for (const dx of [-0.3, 0.3]) block(m, "bogie", xc + dx - 0.06, xc + dx + 0.06, ay + 0.12, ay + 0.22, -0.84, 0.84);
    block(m, "bogie", xc - 0.2, xc + 0.2, ay + 0.22, CH.floor - 0.1, -0.5, 0.5);
  });
  m.scope("track brakes", () => {
    // the pine blocks pressed on the rails between the wheels
    for (const s of [-1, 1]) {
      block(m, "ccWood", xc - 0.24, xc + 0.24, 0.025, 0.13, ...side(s, 0.64, 0.79));
      block(m, "steel", xc - 0.2, xc + 0.2, 0.13, ay + 0.14, ...side(s, 0.69, 0.74));
    }
  });
}

/** An open grip section on the +X side from the saloon end xa to the end wall xb: the outward-facing benches, posts, poles and brackets. */
function gripSection(m: MeshBuilder, xa: number, xb: number, posts: readonly number[]): void {
  const W = CH.half;
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right bench" : "left bench", () => {
      // the bench: its panelled front facing out, the seat, the slatted back along the middle
      block(m, "ccWood", xa + 0.06, xb - 0.06, CH.floor - 0.005, 1.08, ...side(s, W - 0.44, W - 0.04));
      for (let x = xa + 0.1; x + 0.5 < xb - 0.1; x += 0.62) decalZ(m, "ccFrame", s * (W - 0.04 + 0.004), s, x + 0.04, x + 0.5, CH.floor + 0.08, 1.0);
      block(m, "ccWood", xa + 0.05, xb - 0.05, 1.07, 1.12, ...side(s, W - 0.5, W - 0.01));
      block(m, "ccWood", xa + 0.08, xb - 0.08, 1.12, 1.66, ...side(s, W - 0.56, W - 0.5));
      for (const y of [1.24, 1.38, 1.52]) decalZ(m, "ccDeck", s * (W - 0.5 + 0.004), s, xa + 0.1, xb - 0.1, y, y + 0.025);
      // the posts holding the roof, the white grab poles and the iron brackets under the eave
      for (const x of posts) {
        block(m, "ccFrame", x - 0.04, x + 0.04, CH.floor, CH.head + 0.02, ...side(s, W - 0.07, W));
        grabPole(m, x + 0.09, s, 0.8, 2.16);
        for (const d of [-1, 1]) if (x + d * 0.24 > xa && x + d * 0.24 < xb) m.rod("black", [x + d * 0.03, 2.2, s * (W - 0.035)], [x + d * 0.24, CH.head + 0.01, s * (W - 0.035)], 0.012, 4);
      }
      // the eave rail along the open side
      block(m, "ccBody", xa, xb, CH.head + 0.02, CH.eave + 0.005, ...side(s, W - 0.06, W));
    });
}

/** The +X end of the car, its dash's face at x = xe: the dash, the glazed end (or the corner posts), the bumper, the fender and the lamp. */
function cableEnd(m: MeshBuilder, l: CableLine, line: string, xe: number, half: number, glazed: boolean, lamp: string): void {
  const W = CH.half;
  m.scope("dash", () => {
    block(m, l.dash, xe - 0.06, xe, CH.dash0, CH.dash1, -W, W);
    block(m, "ccFrame", xe - 0.09, xe + 0.015, CH.dash1, CH.cap, -W - 0.015, W + 0.015);
    const f = xe + 0.004, f2 = xe + 0.008;
    liningX(m, line === "powell" ? "ccBody" : "ccGold", f, -W + 0.05, W - 0.05, CH.dash0 + 0.05, CH.dash1 - 0.05, 0.018);
    if (line === "powell") {
      // the destination sign (left), the number over the lamp, an advertisement (right)
      decalX(m, "ccBody", f, 1, 0.42, 1.08, 0.66, 1.27);
      cableEndText(m, "ccGold", "POWELL", f2, 0.75, 1.14, 0.08);
      cableEndText(m, "ccGold", "AND", f2, 0.75, 1.03, 0.06);
      cableEndText(m, "ccGold", "MARKET", f2, 0.75, 0.92, 0.08);
      cableEndText(m, "ccGold", "BAY & TAYLOR", f2, 0.75, 0.77, 0.055);
      decalX(m, "black", f, 1, -1.08, -0.42, 0.66, 1.27);
      decalX(m, "ccAd", f2, 1, -1.05, -0.45, 0.69, 1.24);
      cableEndText(m, "ccGold", l.number, f, 0.0, 1.17, 0.13);
    } else {
      // the cream scrolls: VAN NESS AVE. CALIFORNIA over the lamp, & MARKET and STREETS beside it
      decalX(m, "ccPanel", f, 1, -1.05, 1.05, 1.08, 1.27);
      cableEndText(m, "ccBody", "VAN NESS AVE. CALIFORNIA", f2, 0, 1.13, 0.085);
      decalX(m, "ccPanel", f, 1, 0.24, 1.05, 0.72, 0.9);
      cableEndText(m, "ccBody", "& MARKET", f2, 0.64, 0.77, 0.085);
      decalX(m, "ccPanel", f, 1, -1.05, -0.24, 0.72, 0.9);
      cableEndText(m, "ccBody", "STREETS", f2, -0.64, 0.77, 0.085);
      cableEndText(m, "ccGold", l.number, f, 0.68, 0.96, 0.09);
    }
    m.scope(lamp === "lampHead" ? "headlamp" : "tail lamp", () => {
      m.sweep("brass", "x", ngon(12, 0.12, 0, 0, 0.98), xe, ngon(12, 0.12, 0, 0, 0.98), xe + 0.05);
      m.sweep(lamp, "x", ngon(12, 0.085, 0, 0, 0.98), xe + 0.05, ngon(12, 0.085, 0, 0, 0.98), xe + 0.065);
    });
  });
  m.scope("bumper", () => {
    block(m, "black", xe - 0.05, half - (glazed ? 0.05 : 0), 0.36, CH.dash0, -W + 0.04, W - 0.04);
    if (glazed) {
      const pan: Array<[number, number]> = [[xe - 0.3, 0.1], [half - 0.03, 0.1], [half, 0.15], [half, 0.33], [xe - 0.3, 0.33]];
      m.scope("fender", () => m.sweep("ccFender", "z", pan, -0.78, pan, 0.78));
    }
  });
  if (glazed)
    m.scope("end windows", () => {
      // three windows over the dash between maroon posts, framed in varnished wood, seen from both sides
      block(m, "ccBody", xe - 0.07, xe - 0.02, CH.cap, CH.eave + 0.01, -W, W);
      for (const zc of [-0.77, 0, 0.77])
        for (const e of [1, -1]) {
          const x = e > 0 ? xe - 0.02 : xe - 0.07;
          decalX(m, "ccFrame", x + e * 0.004, e, zc - 0.36, zc + 0.36, CH.cap + 0.04, CH.head - 0.02);
          decalX(m, "glass", x + e * 0.008, e, zc - 0.31, zc + 0.31, CH.cap + 0.09, CH.head - 0.07);
        }
    });
  else
    m.scope("corner posts", () => {
      for (const s of [-1, 1]) {
        block(m, "ccBody", xe - 0.09, xe - 0.01, CH.cap, CH.eave + 0.01, ...side(s, W - 0.08, W));
        grabPole(m, xe - 0.05, s, 0.8, 2.16);
      }
      block(m, "ccBody", xe - 0.07, xe - 0.02, CH.head + 0.02, CH.eave + 0.005, -W, W);
    });
}

/** The roof over the whole car: the lower roof with its rounded ends, the clerestory with its small windows and its hooded ends. */
function cableRoof(m: MeshBuilder, half: number): void {
  const R = CH.roofHalf, xr = half - 0.02, xc = half - 0.75;
  // the lower roof's camber: the thin maroon fascia, then rising to the clerestory's foot
  const lower = (hw: number): Array<[number, number]> => [[-hw, CH.eave], [hw, CH.eave], [hw, CH.eave + 0.04], [hw - 0.12, CH.eave + 0.11], [hw - 0.4, CH.deck], [-(hw - 0.4), CH.deck], [-(hw - 0.12), CH.eave + 0.11], [-hw, CH.eave + 0.04]];
  m.scope("lower roof", () => {
    paintedSweep(m, "x", lower(R), -xr + 0.3, xr - 0.3, { bands: [[0, CH.eave + 0.045, "ccBody"]], roofFrom: CH.eave + 0.045, roof: "ccRoof" }, []);
    for (const e of [1, -1]) {
      // the ends round off in plan
      const [a, b] = e > 0 ? [xr - 0.3, xr] : [-xr, -xr + 0.3];
      m.sweep("ccRoof", "x", lower(e > 0 ? R : R - 0.06), a, lower(e > 0 ? R - 0.06 : R), b);
    }
    const y = CH.eave - 0.002;
    m.facets("ccCeiling", [[-xr, y, -R], [xr, y, R], [xr, y, -R], [-xr, y, -R], [-xr, y, R], [xr, y, R]], [0, -1, 0]);
  });
  m.scope("clerestory", () => {
    block(m, "ccFrame", -xc, xc, CH.deck - 0.06, CH.clere, -CH.clereHalf, CH.clereHalf);
    const n = Math.round((2 * xc) / 0.42);
    const p = (2 * xc) / n;
    for (const s of [-1, 1])
      for (let i = 0; i < n; i++) decalZ(m, "ccClere", s * (CH.clereHalf + 0.004), s, -xc + i * p + 0.06, -xc + (i + 1) * p - 0.06, CH.deck + 0.05, CH.clere - 0.06);
    // the window across each end of the clerestory, under its hood
    for (const e of [1, -1]) decalX(m, "ccClere", e * (xc + 0.004), e, -0.52, 0.52, CH.deck + 0.06, CH.clere - 0.06);
    const top: Array<[number, number]> = [[-0.8, CH.clere], [0.8, CH.clere], [0.8, CH.clere + 0.04], [0.62, CH.top], [-0.62, CH.top], [-0.8, CH.clere + 0.04]];
    m.sweep("ccRoof", "x", top, -xc, top, xc);
    // the hoods: the clerestory's roof running on over each end and curving down
    const yb = CH.clere - 0.01;
    const crown = (hw: number, t: number): Array<[number, number]> => [[-hw, yb], [hw, yb], [hw, Math.max(yb + 0.03, t - 0.07)], [hw - 0.18, t], [-(hw - 0.18), t], [-hw, Math.max(yb + 0.03, t - 0.07)]];
    const stations: Array<[number, number, number]> = [[0, 0.8, CH.top], [0.16, 0.8, CH.top - 0.025], [0.3, 0.79, CH.top - 0.075], [0.4, 0.77, yb + 0.06]];
    for (const e of [1, -1])
      for (let i = 0; i + 1 < stations.length; i++) {
        const [d0, h0, t0] = stations[i]!, [d1, h1, t1] = stations[i + 1]!;
        m.sweep("ccRoof", "x", crown(h0, t0), e * (xc + d0), crown(h1, t1), e * (xc + d1));
      }
  });
}

/** The saloon: its sides by height, four arched windows a side, the end bulkheads with their doors. */
function saloon(m: MeshBuilder, l: CableLine): void {
  const W = CH.half;
  const [x0, x1] = l.saloon;
  paintedSweep(m, "x", [[-W, CH.band], [W, CH.band], [W, CH.eave + 0.02], [-W, CH.eave + 0.02]], x0, x1, { bands: [[0, 0.64, "ccTrim"], [0.64, CH.belt, "ccBody"], [CH.belt, CH.head, "ccFrame"], [CH.head, 9, "ccBody"]], roofFrom: 9, roof: "ccBody" });
  const len = x1 - x0, n = 4, p = (len - 0.36) / n;
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      const z = W + 0.004, z2 = W + 0.008;
      for (let i = 0; i < n; i++) {
        const a = x0 + 0.18 + i * p;
        archZ(m, "glass", z2, s, a + 0.07, a + p - 0.07, CH.belt + 0.07, CH.head - 0.05, 0.12);
      }
      // cream pilasters between the windows and a cream strip over them
      for (let i = 0; i <= n; i++) decalZ(m, "ccPanel", s * z, s, x0 + 0.18 + i * p - 0.035, x0 + 0.18 + i * p + 0.035, CH.belt + 0.02, CH.head - 0.03);
      decalZ(m, "ccPanel", s * z, s, x0 + 0.18 - 0.035, x1 - 0.18 + 0.035, CH.head - 0.03, CH.head + 0.03);
      // the lower panel: gold lining, the car number toward the grip end, an advertisement frame
      liningZ(m, "ccGold", s * z, s, x0 + 0.1, x1 - 0.1, 0.7, CH.belt - 0.06, 0.016);
      const ad0 = l.doubleEnded ? x0 + 0.6 : x0 + 0.35, ad1 = l.doubleEnded ? x1 - 0.6 : x1 - 1.25;
      decalZ(m, "ccPanel", s * z, s, ad0, ad1, 0.8, 1.2);
      decalZ(m, "ccAd", s * z2, s, ad0 + 0.04, ad1 - 0.04, 0.84, 1.16);
      const nx = l.doubleEnded ? s * (x1 - 0.32) : x1 - 0.6;
      cableSideText(m, "ccGold", l.number, s, z2, nx, 0.92, 0.16);
      // the railway's name on a cream label along the blue band
      decalZ(m, "ccPanel", s * z, s, x0 + 0.25, x1 - 0.25, 0.465, 0.6);
      cableSideText(m, "black", "SAN FRANCISCO MUNICIPAL RAILWAY", s, z2, (x0 + x1) / 2, 0.495, 0.075);
    });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front bulkhead" : "rear bulkhead", () => {
      // the end wall's door and two windows, seen from the open section
      const x = (e > 0 ? x1 : x0) + e * 0.004, x2 = x + e * 0.004;
      decalX(m, "ccFrame", x, e, -0.38, 0.38, CH.floor + 0.02, CH.head - 0.04);
      decalX(m, "glass", x2, e, -0.3, 0.3, CH.belt, CH.head - 0.1);
      for (const zc of [-0.82, 0.82]) {
        decalX(m, "ccFrame", x, e, zc - 0.3, zc + 0.3, CH.belt - 0.04, CH.head - 0.04);
        decalX(m, "glass", x2, e, zc - 0.25, zc + 0.25, CH.belt + 0.02, CH.head - 0.1);
      }
    });
}

export function cableCar(params?: ParamValues): MeshBuilder {
  const line = resolveParams(CABLE_CAR_PARAMS, params).livery!;
  const l = CABLE_LINES[line]!;
  const half = l.length / 2, xe = half - 0.14, W = CH.half;
  const [x0, x1] = l.saloon;
  const m = new MeshBuilder({ ...US_PALETTE, ...CABLE_COMMON, ...l.palette });
  m.scope("underframe", () => {
    // the deck, the side sills, the blue risers under the open sections, the running boards on their brackets
    block(m, "ccDeck", -xe + 0.02, xe - 0.02, CH.floor - 0.1, CH.floor, -W + 0.07, W - 0.07);
    for (const s of [-1, 1]) block(m, "black", -xe, xe, CH.sill, CH.band, ...side(s, W - 0.12, W));
    const open: Array<[number, number]> = [[x1, xe], [-xe, x0]];
    for (const [a, b] of open)
      for (const s of [-1, 1]) {
        block(m, "ccTrim", a === -xe ? a + 0.06 : a, b === xe ? b - 0.06 : b, CH.band, CH.floor + 0.005, ...side(s, W - 0.06, W));
        block(m, "ccStep", a + 0.05, b - 0.05, CH.step - 0.05, CH.step, ...side(s, W - 0.03, W + 0.3));
        decalZ(m, "ccPanel", s * (W + 0.004), s, a + 0.4, b - 0.4, CH.band + 0.09, CH.band + 0.13);
        for (const x of [a + 0.3, (a + b) / 2, b - 0.3]) block(m, "black", x - 0.03, x + 0.03, CH.step - 0.12, CH.step - 0.05, ...side(s, W - 0.02, W + 0.22));
        const y = CH.step + 0.003;
        m.facets("black", [[a + 0.05, y, s * (W + 0.12)], [b - 0.05, y, s * (W + 0.12)], [b - 0.05, y, s * (W + 0.2)], [a + 0.05, y, s * (W + 0.12)], [b - 0.05, y, s * (W + 0.2)], [a + 0.05, y, s * (W + 0.2)]], [0, 1, 0]);
      }
  });
  m.scope("saloon", () => saloon(m, l));
  // the posts as car 5 shows them: 0.65, 1.4 and 2.2 m behind the Powell car's front and one at the saloon
  const posts = (xa: number): number[] => [xa + 0.08, ...[0.27, 0.54, 0.8].map((t) => xa + (xe - xa) * t)];
  m.scope("front grip section", () => gripSection(m, x1, xe - 0.07, posts(x1)));
  m.scope("front end", () => cableEnd(m, l, line, xe, half, true, "lampHead"));
  if (l.doubleEnded) {
    m.scope("rear grip section", () => m.turned(0, () => gripSection(m, -x0, xe - 0.07, posts(-x0))));
    m.scope("rear end", () => m.turned(0, () => cableEnd(m, l, line, xe, half, true, "lampHead")));
  } else {
    m.scope("rear platform", () => {
      // the conductor's open platform: posts at the saloon, the brake wheel, the folding gate on the left
      for (const s of [-1, 1]) {
        block(m, "ccBody", x0 - 0.1, x0, CH.floor, CH.eave + 0.01, ...side(s, W - 0.08, W));
        grabPole(m, x0 - 0.15, s, 0.8, 2.16);
        block(m, "ccBody", -xe, x0, CH.head + 0.02, CH.eave + 0.005, ...side(s, W - 0.06, W));
      }
      const bx = -xe + 0.3, bz = 0.55;
      m.rod("steel", [bx, CH.floor, bz], [bx, 1.12, bz], 0.03, 6);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, b = ((i + 1) / 8) * Math.PI * 2;
        m.rod("black", [bx + 0.17 * Math.cos(a), 1.14, bz + 0.17 * Math.sin(a)], [bx + 0.17 * Math.cos(b), 1.14, bz + 0.17 * Math.sin(b)], 0.014, 4);
      }
      m.rod("black", [bx - 0.17, 1.14, bz], [bx + 0.17, 1.14, bz], 0.012, 4);
      const gz = -(W + 0.03), g0 = -xe + 0.12, g1 = x0 - 0.12;
      for (const y of [0.78, 1.85]) m.rod("black", [g0, y, gz], [g1, y, gz], 0.015, 4);
      const k = 4, d = (g1 - g0) / k;
      for (let i = 0; i < k; i++) {
        m.rod("black", [g0 + i * d, 0.78, gz], [g0 + (i + 1) * d, 1.85, gz], 0.01, 4);
        m.rod("black", [g0 + (i + 1) * d, 0.78, gz], [g0 + i * d, 1.85, gz], 0.01, 4);
      }
    });
    m.scope("rear end", () => m.turned(0, () => cableEnd(m, l, line, xe, half, false, "lampRed")));
  }
  m.scope("roof", () => {
    cableRoof(m, half);
    m.scope("roof lamp", () => {
      for (const e of l.doubleEnded ? [1, -1] : [1]) {
        const x = e * (half - 0.5);
        m.prism("black", ngon(8, 0.04, 0, x, 0), CH.top - 0.12, CH.top - 0.02);
        m.loft("black", ngon(10, 0.12, 0, x, 0), CH.top - 0.02, ngon(10, 0.04, 0, x, 0), CH.top + 0.07);
      }
    });
    if (line === "powell")
      m.scope("route boards", () => {
        // the board standing on the roof's edge over the grip section and the saloon's front: POWELL & MASON STS.
        for (const s of [-1, 1]) {
          block(m, "ccPanel", -1.4, 2.35, CH.eave + 0.1, CH.eave + 0.4, ...side(s, 1.04, 1.075));
          liningZ(m, "ccFrame", s * (1.075 + 0.004), s, -1.4, 2.35, CH.eave + 0.1, CH.eave + 0.4, 0.02);
          cableSideText(m, "black", "POWELL & MASON STS.", s, 1.075 + 0.008, 0.475, CH.eave + 0.18, 0.15);
        }
      });
    else
      m.scope("letterboards", () => {
        // the eave boards: VAN NESS AVENUE, CALIFORNIA STREET, MARKET STREET in gold
        for (const s of [-1, 1]) {
          block(m, "ccBody", -half + 0.45, half - 0.45, CH.eave - 0.12, CH.eave + 0.05, ...side(s, CH.roofHalf - 0.02, CH.roofHalf + 0.01));
          ["VAN NESS AVENUE", "CALIFORNIA STREET", "MARKET STREET"].forEach((t, i) => cableSideText(m, "ccGold", t, s, CH.roofHalf + 0.014, s * (i - 1) * 2.9, CH.eave - 0.09, 0.11));
        }
      });
  });
  m.scope("grip", () => {
    // the grip lever in the middle of the front grip section, the wheel and track brake levers beside it, the grip's shank through the slot
    const gx = (x1 + xe) / 2 - 0.15;
    block(m, "steel", gx - 0.28, gx + 0.28, CH.floor, CH.floor + 0.14, -0.05, 0.05);
    m.rod("steel", [gx, CH.floor + 0.1, 0], [gx + 0.12, 1.95, 0], 0.025, 6);
    m.rod("black", [gx + 0.12, 1.95, -0.07], [gx + 0.12, 1.95, 0.07], 0.022, 6);
    for (const z of [0.22, -0.22]) m.rod("steel", [gx + 0.38, CH.floor, z], [gx + 0.3, z > 0 ? 1.62 : 1.5, z], 0.02, 6);
    block(m, "black", gx - 0.06, gx + 0.06, 0.1, CH.floor - 0.1, -0.03, 0.03);
    // the California car's second set of brake levers at the other end
    if (l.doubleEnded) for (const z of [0.22, -0.22]) m.rod("steel", [-gx - 0.38, CH.floor, z], [-gx - 0.3, z > 0 ? 1.62 : 1.5, z], 0.02, 6);
  });
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => cableTruck(m, l.trucks[0])));
    m.scope("rear truck", () => m.bogie(() => cableTruck(m, l.trucks[1])));
  });
  return m;
}

export function cableCarLod(params?: ParamValues): MeshBuilder {
  const l = CABLE_LINES[resolveParams(CABLE_CAR_PARAMS, params).livery!]!;
  const half = l.length / 2, W = CH.half, xe = half - 0.14;
  const [x0, x1] = l.saloon;
  // one body: the open sections' benches under a dark opening, the saloon's maroon panel and varnished window band,
  // the lower roof and the clerestory
  const top: LodBand[] = [[CH.head, CH.eave, "ccBody"], [CH.eave, CH.top, "ccRoof"]];
  const side: LodBand[] = [[CH.sill, 0.64, "ccTrim"], [0.64, 1.12, "ccWood"], [1.12, CH.head, LOD_GLASS], ...top];
  const saloon: LodBand[] = [[CH.sill, 0.64, "ccTrim"], [0.64, CH.belt, "ccBody"], [CH.belt, CH.head, "ccFrame"], ...top];
  const endPaint: LodBand[] = [[CH.sill, CH.dash1, l.dash], [CH.dash1, CH.head, LOD_GLASS], ...top];
  const tip = (e: number): Table => [[CH.sill, e * xe], [CH.eave, e * xe], [CH.eave + 0.01, e * (half - 0.02)], [CH.deck, e * (half - 0.02)], [CH.deck + 0.01, e * (half - 0.75)], [CH.top, e * (half - 0.75)]];
  const body: UnitBody = {
    y0: CH.sill, hw: [[CH.sill, W], [CH.eave, W], [CH.eave + 0.01, CH.roofHalf], [CH.deck, CH.roofHalf - 0.4], [CH.deck + 0.01, CH.clereHalf], [CH.top, 0.62]], side, roof: "ccRoof",
    front: { tip: tip(1), paint: endPaint }, rear: { tip: tip(-1), paint: l.doubleEnded ? endPaint : [[CH.sill, CH.dash1, l.dash], ...side.slice(2)] },
    cabs: [{ x0, x1, side: saloon }],
  };
  const parts: LodPart[] = bogieParts([[l.trucks[0], 0.9], [l.trucks[1], 0.9]], CH.sill);
  return fitUnit({ palette: { ...US_PALETTE, ...CABLE_COMMON, ...l.palette }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------

const wagonGame = (weight: number, variants: GameProperties["variants"] = []): GameProperties => ({ weight, power: 0, maxspeed: 113, accel: null, ...(variants.length ? { variants } : {}) });

export const US_FREIGHT: ProceduralDesign[] = [
  { id: "proc-vehicle-us-caboose", title: "Cupola caboose", build: caboose, buildLod: cabooseLod, params: CABOOSE_PARAMS, finishParams: ["livery"], game: wagonGame(22), catalog: WAGON_CATALOG, loadingGauge: "us", references: "us-caboose" },
  { id: "proc-vehicle-us-boxcar", title: "50 ft boxcar", build: boxcar, buildLod: boxcarLod, params: BOXCAR_PARAMS, finishParams: ["livery"], game: wagonGame(30), catalog: WAGON_CATALOG, loadingGauge: "us", references: "us-boxcar" },
  { id: "proc-vehicle-us-well-car", title: "Double-stack well car", build: wellCar, buildLod: wellCarLod, params: WELL_PARAMS, game: wagonGame(32, [{ params: { cargo: "empty" }, weight: 22 }, { params: { cargo: "double" }, weight: 42 }]), catalog: WAGON_CATALOG, loadingGauge: "usDoubleStack", references: "us-well-car" },
  { id: "proc-vehicle-sf-cable-car", title: "San Francisco cable car", build: cableCar, buildLod: cableCarLod, params: CABLE_CAR_PARAMS, game: { weight: 7, power: 40, maxspeed: 15, accel: null }, catalog: TRAM_CATALOG, loadingGauge: "us", references: "sf-cable-car" },
];
