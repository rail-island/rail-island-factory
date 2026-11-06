// The offshore production platform (docs/models/industry.md, "Offshore platform"): a
// steel jacket standing in the sea, a cellar deck and a main deck, the living quarters
// with their lifeboat station, the process and power modules, a workover derrick over
// the wells, a pedestal crane, a flare boom over the sea and a helideck cantilevered off
// the quarters' corner - the helicopter stop the game reads from `game.helipad`
// (docs/models/game-properties.md, "Helipads"). Real-size metres, +Y up; y = 0 is the
// waterline, where the jacket's legs stand (the factory's ground datum).
//
// No node: imports: bundled into the standalone JS model (re-exported by industry.ts).

import { MeshBuilder, ngon, rect, type Ring } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import { lodBox } from "./lodPrimitives.ts";

type V3 = [number, number, number];

const PALETTE = {
  splash: { color: "#2f3436", roughness: 0.9 },
  jacket: { color: "#d9a62c", roughness: 0.7 },
  girder: { color: "#c99a2e", roughness: 0.7 },
  deck: { color: "#6b7378", roughness: 0.9 },
  grate: { color: "#5f666a", roughness: 0.9 },
  rail: { color: "#e8c23a" },
  fender: { color: "#1d1f21", roughness: 0.95 },
  vessel: { color: "#d7d8d2", roughness: 0.6 },
  pipe: { color: "#8c949a", metallic: 0.4 },
  pump: { color: "#3e6b8e" },
  module: { color: "#d4d5cf", roughness: 0.7 },
  moduleBlue: { color: "#5b7f9c", roughness: 0.7 },
  louvre: { color: "#4b5257", metallic: 0.3 },
  dark: { color: "#262b2f" },
  lq: { color: "#eeece5", roughness: 0.7 },
  lqTrim: { color: "#b8322b" },
  window: { color: "#2c3a44", metallic: 0.4 },
  lifeboat: { color: "#f07a1e", roughness: 0.5 },
  lifeboatTop: { color: "#f4f2ea" },
  davit: { color: "#e8eae6", metallic: 0.3 },
  derrick: { color: "#cdb98c", roughness: 0.7 },
  crane: { color: "#c2352b", roughness: 0.6 },
  craneWhite: { color: "#efefe9" },
  wire: { color: "#30353a" },
  steel: { color: "#59626a", metallic: 0.45 },
  flare: { color: "#c9c9c4", metallic: 0.3 },
  container1: { color: "#2d6aa3" },
  container2: { color: "#c0452f" },
  container3: { color: "#3f8a4e" },
  sock: { color: "#f26a1b" },
  // the touchdown surface (GameProperties.helipad): drawn in nothing else
  helipad: { color: "#47594d", roughness: 0.85 },
  helipadNet: { color: "#7a7f67", roughness: 1 },
  helipadPaint: { color: "#f1f0ea" },
  helipadMark: { color: "#e8b428" },
  helipadLight: { color: "#3cc85a" },
  net: { color: "#3a3f3c", roughness: 1 },
};

type Mat = keyof typeof PALETTE;
const model = (): MeshBuilder => new MeshBuilder(PALETTE);

/** The jacket's top (the cellar deck's underside) and the two decks' plate tops. */
const JACKET_TOP = 20;
const CELLAR = 20.65;
const MAIN = 27.65;
/** The legs' plan positions at the jacket's top; at the waterline they stand 10 % further out (the batter). */
const LEG_X = [-21, -7, 7, 21] as const;
const LEG_Z = [-13, 13] as const;
/** The topsides' plan: x [-24, 24], z [-16, 16]. */
const TOP_W = 48;
const TOP_D = 32;
/** The living quarters' plan and storeys. */
const LQ = { x0: 8, x1: 24, z0: -16, z1: 2, storey: 3.2, storeys: 3 } as const;
const LQ_ROOF = MAIN + LQ.storey * LQ.storeys;
/** The utility module beside the quarters, two storeys: the helideck's other support. */
const UTIL = { x0: 12, x1: 24, z0: 2, z1: 14, top: MAIN + 2 * LQ.storey } as const;

/** The helideck: a square deck `side` across (a large pad, HELIPAD_D.large 26 m), cantilevered off the quarters' corner. */
export const PLATFORM_HELIDECK = { x: 25.5, z: 8.5, side: 27, y0: 39.2, y1: 39.7 } as const;

/** The flare boom's root and tip, and the crane boom's pivot and tip. */
const FLARE_ROOT: V3 = [-24, 30, -5];
const FLARE_TIP: V3 = (() => {
  const a = (32 * Math.PI) / 180, l = 36;
  return [FLARE_ROOT[0] - l * Math.cos(a), FLARE_ROOT[1] + l * Math.sin(a), FLARE_ROOT[2]];
})();
const CRANE = { x: -4, z: 13.5 } as const;
const BOOM_ROOT: V3 = [CRANE.x, 35.6, CRANE.z + 2.2];
const BOOM_TIP: V3 = (() => {
  const a = (58 * Math.PI) / 180, l = 30, hx = -0.33, hz = 0.944;
  return [BOOM_ROOT[0] + l * Math.cos(a) * hx, BOOM_ROOT[1] + l * Math.sin(a), BOOM_ROOT[2] + l * Math.cos(a) * hz];
})();

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const lerp3 = (a: V3, b: V3, t: number): V3 => add(a, mul(sub(b, a), t));
const unit = (a: V3): V3 => mul(a, 1 / Math.hypot(a[0], a[1], a[2]));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A leg's centre at height y: battered 1:10 in, from 110 % of its top position at the waterline. */
function legAt(x: number, z: number, y: number): V3 {
  const k = 1.1 - (0.1 * y) / JACKET_TOP;
  return [x * k, y, z * k];
}

/**
 * A lattice boom from `a` to `b`: `corners` chords round its axis (3: two below, one
 * above; 4: a square), `w0` and `w1` the chords' offset from the axis at either end,
 * a diagonal lacing in each of `n` bays on every face.
 */
function lattice(m: MeshBuilder, mat: Mat, a: V3, b: V3, corners: 3 | 4, w0: number, w1: number, n: number, r: number): void {
  const ax = unit(sub(b, a));
  const s = unit(cross(ax, [0, 1, 0]));
  const u = cross(s, ax);
  const offs: Array<[number, number]> = corners === 3 ? [[-1, -0.6], [1, -0.6], [0, 1]] : [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const at = (t: number, k: number): V3 => {
    const w = w0 + (w1 - w0) * t;
    const [os, ou] = offs[k]!;
    return add(lerp3(a, b, t), add(mul(s, os * w), mul(u, ou * w)));
  };
  for (let k = 0; k < corners; k++) m.rod(mat, at(0, k), at(1, k), r * 1.3, 4);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < corners; k++) {
      const j = (k + 1) % corners;
      m.rod(mat, i % 2 ? at(i / n, k) : at(i / n, j), i % 2 ? at((i + 1) / n, j) : at((i + 1) / n, k), r, 4, false);
    }
  }
}

function jacket(m: MeshBuilder): void {
  m.scope("jacket", () => {
    m.scope("legs", () => {
      for (const x of LEG_X) for (const z of LEG_Z) {
        const ring = (y: number): Ring => { const [lx, , lz] = legAt(x, z, y); return ngon(12, 0.9, 0, lx, lz); };
        m.loft("splash", ring(0), 0, ring(4), 4, false);
        m.loft("jacket", ring(4), 4, ring(JACKET_TOP), JACKET_TOP, false);
      }
    });
    m.scope("bracing", () => {
      const panels: Array<[[number, number], [number, number]]> = [];
      for (const z of LEG_Z) for (let i = 0; i + 1 < LEG_X.length; i++) panels.push([[LEG_X[i]!, z], [LEG_X[i + 1]!, z]]);
      for (const x of LEG_X) panels.push([[x, LEG_Z[0]], [x, LEG_Z[1]]]);
      const levels = [1.5, 10.5, 19.4];
      for (const [[ax, az], [bx, bz]] of panels) {
        for (let l = 0; l + 1 < levels.length; l++) {
          const ya = levels[l]!, yb = levels[l + 1]!;
          m.rod("jacket", legAt(ax, az, ya), legAt(bx, bz, yb), 0.35, 6, false);
          m.rod("jacket", legAt(bx, bz, ya), legAt(ax, az, yb), 0.35, 6, false);
          m.rod("jacket", legAt(ax, az, ya), legAt(bx, bz, ya), 0.38, 6, false);
        }
      }
    });
    m.scope("conductors and risers", () => {
      for (const x of [1.1, 3.5, 5.9]) for (const z of [-1.2, 1.2]) m.rod("pipe", [x, 0, z], [x, JACKET_TOP, z], 0.32, 8, false);
      for (const y of [1.5, 10.5]) {
        for (const z of [-2.1, 2.1]) m.box("jacket", 3.5, z, 6.8, 0.4, y - 0.2, y + 0.2);
        m.rod("jacket", legAt(7, 0, y), [6.9, y, 0], 0.3, 6, false);
        m.rod("jacket", legAt(-7, 0, y), [0.1, y, 0], 0.3, 6, false);
      }
      for (const x of [-11, -12.4]) m.rod("pipe", [x, 0, -14.9], [x, JACKET_TOP, -14.9], 0.42, 8, false);
    });
    m.scope("boat landing", () => {
      m.box("grate", 0, 15.4, 12, 2.4, 2.6, 2.9);
      for (const s of [-1, 1]) m.rod("jacket", [s * 4, 2.3, 16], legAt(s * 7, 13, 2.3), 0.25, 6);
      for (const x of [-4.5, 0, 4.5]) m.rod("fender", [x, 0, 16.9], [x, 4.2, 16.9], 0.3, 8);
      // the ladder up to the cellar deck
      for (const s of [-1, 1]) m.box("rail", s * 0.4, 16.35, 0.08, 0.08, 2.9, CELLAR + 1.1);
      for (let y = 3.6; y < CELLAR; y += 1.2) m.box("rail", 0, 16.35, 0.72, 0.06, y, y + 0.06);
    });
  });
}

/** Handrail posts every `step` along a straight edge and two bars. */
function railing(m: MeshBuilder, a: [number, number], b: [number, number], y: number, step: number): void {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(len / step));
  for (let i = 0; i <= n; i++) m.box("rail", a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, 0.09, 0.09, y, y + 1.1);
  const cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
  const alongX = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
  for (const h of [0.5, 1.02]) m.box("rail", cx, cz, alongX ? len : 0.08, alongX ? 0.08 : len, y + h, y + h + 0.08);
}

function decks(m: MeshBuilder): void {
  m.scope("decks", () => {
    m.scope("cellar deck", () => {
      lodBox(m, "girder", 0, 0, TOP_W, TOP_D, JACKET_TOP, CELLAR - 0.05);
      m.box("deck", 0, 0, TOP_W - 0.4, TOP_D - 0.4, CELLAR - 0.05, CELLAR);
      const hx = TOP_W / 2 - 0.2, hz = TOP_D / 2 - 0.2;
      railing(m, [-hx, hz], [hx, hz], CELLAR, 6);
      railing(m, [-hx, -hz], [hx, -hz], CELLAR, 6);
      railing(m, [-hx, -hz + 0.2], [-hx, hz - 0.2], CELLAR, 6);
      railing(m, [hx, -hz + 0.2], [hx, hz - 0.2], CELLAR, 6);
    });
    m.scope("deck legs", () => {
      for (const x of LEG_X) for (const z of LEG_Z) m.prism("jacket", ngon(12, 0.8, 0, x, z), CELLAR, MAIN - 0.65, false);
    });
    m.scope("main deck", () => {
      lodBox(m, "girder", 0, 0, TOP_W, TOP_D, MAIN - 0.65, MAIN - 0.05);
      m.box("deck", 0, 0, TOP_W - 0.4, TOP_D - 0.4, MAIN - 0.05, MAIN);
      const hx = TOP_W / 2 - 0.2, hz = TOP_D / 2 - 0.2;
      railing(m, [-hx, hz], [hx, hz], MAIN, 4);
      railing(m, [-hx, -hz], [LQ.x0 - 0.6, -hz], MAIN, 4);
      railing(m, [-hx, -hz + 0.2], [-hx, hz - 0.2], MAIN, 4);
    });
  });
}

function cellarPlant(m: MeshBuilder): void {
  m.scope("cellar deck plant", () => {
    m.scope("separators", () => {
      for (const z of [-9.5, -5]) {
        const ring = ngon(12, 1.5, 0, z, CELLAR + 1.9);
        m.sweep("vessel", "x", ring, -20, ring, -8);
        for (const x of [-18, -10]) m.box("jacket", x, z, 0.5, 2.4, CELLAR, CELLAR + 1.0);
      }
    });
    m.scope("pumps and tanks", () => {
      for (const x of [2, 6, 10]) m.box("pump", x, -10, 2.4, 1.6, CELLAR, CELLAR + 1.6);
      m.prism("vessel", ngon(14, 1.8, 0, 15, 8), CELLAR, CELLAR + 4.4);
      m.prism("vessel", ngon(14, 1.8, 0, 15, 2), CELLAR, CELLAR + 4.4);
    });
    m.scope("headers", () => {
      for (const z of [-13.6, -12.9]) m.rod("pipe", [-22, 25.4, z], [22, 25.4, z], 0.25, 6);
      m.rod("pipe", [-8, CELLAR + 1.9, -7.2], [-8, 25.4, -12.9], 0.2, 6);
    });
  });
}

/** A storey's row of windows along one face of the quarters, `n` of them between u0 and u1. */
function windows(m: MeshBuilder, face: "x0" | "x1" | "z0" | "z1", u0: number, u1: number, y: number): void {
  const n = Math.max(1, Math.round((u1 - u0) / 2));
  for (let i = 0; i < n; i++) {
    const u = u0 + ((u1 - u0) * (i + 0.5)) / n;
    if (face === "z1") m.box("window", u, LQ.z1 + 0.03, 1.1, 0.06, y + 1, y + 2.1);
    else if (face === "z0") m.box("window", u, LQ.z0 - 0.03, 1.1, 0.06, y + 1, y + 2.1);
    else if (face === "x1") m.box("window", LQ.x1 + 0.03, u, 0.06, 1.1, y + 1, y + 2.1);
    else m.box("window", LQ.x0 - 0.03, u, 0.06, 1.1, y + 1, y + 2.1);
  }
}

/** A lifeboat (a totally enclosed survival craft) hanging at (x, y, z), its length along Z. */
function lifeboat(m: MeshBuilder, x: number, y: number, z: number): void {
  const L = 7.6, end = 1.6;
  const sec = (k: number): Ring => ngon(10, 1, Math.PI / 10).map(([px, py]) => [x + px * 1.4 * k, y + py * 1.3 * (0.6 + 0.4 * k)] as [number, number]);
  m.sweep("lifeboat", "z", sec(0.35), z - L / 2, sec(1), z - L / 2 + end);
  m.sweep("lifeboat", "z", sec(1), z - L / 2 + end, sec(1), z + L / 2 - end, false);
  m.sweep("lifeboat", "z", sec(1), z + L / 2 - end, sec(0.45), z + L / 2);
  m.box("lifeboatTop", x, z + 0.6, 1.1, 2.2, y + 1.05, y + 1.75);
  m.box("lifeboatTop", x, z - 2.2, 0.9, 1.2, y + 1.05, y + 1.5);
}

function quarters(m: MeshBuilder): void {
  m.scope("living quarters", () => {
    const cx = (LQ.x0 + LQ.x1) / 2, cz = (LQ.z0 + LQ.z1) / 2, w = LQ.x1 - LQ.x0, d = LQ.z1 - LQ.z0;
    m.scope("block", () => {
      m.box("lq", cx, cz, w, d, MAIN, LQ_ROOF);
      for (let s = 1; s < LQ.storeys; s++) m.box("lqTrim", cx, cz, w + 0.08, d + 0.08, MAIN + s * LQ.storey - 0.12, MAIN + s * LQ.storey + 0.13);
      m.box("lqTrim", cx, cz, w + 0.1, d + 0.1, LQ_ROOF - 0.35, LQ_ROOF + 0.25);
    });
    m.scope("windows", () => {
      for (let s = 0; s < LQ.storeys; s++) {
        const y = MAIN + s * LQ.storey;
        windows(m, "x1", LQ.z0 + 0.5, LQ.z1 - 0.5, y);
        windows(m, "x0", LQ.z0 + 0.5, LQ.z1 - 0.5, y);
        windows(m, "z0", LQ.x0 + 0.5, LQ.x1 - 0.5, y);
        if (s === LQ.storeys - 1) windows(m, "z1", LQ.x0 + 0.5, LQ.x1 - 0.5, y);
        else windows(m, "z1", LQ.x0 + 0.5, UTIL.x0 - 0.3, y);
      }
    });
    m.scope("utility module", () => {
      m.box("module", (UTIL.x0 + UTIL.x1) / 2, (UTIL.z0 + UTIL.z1) / 2, UTIL.x1 - UTIL.x0, UTIL.z1 - UTIL.z0, MAIN, UTIL.top);
      for (const z of [5, 11]) m.box("louvre", UTIL.x1 + 0.04, z, 0.08, 3, MAIN + 1, MAIN + 4.4);
      m.box("dark", 18, UTIL.z1 + 0.04, 1.4, 0.08, MAIN, MAIN + 2.3);
    });
    m.scope("lifeboat station", () => {
      const yw = MAIN + LQ.storey;
      m.box("grate", LQ.x1 + 1.5, -9.4, 3, 13, yw - 0.25, yw);
      for (const z of [-15, -3.8]) m.rod("steel", [LQ.x1, yw - 2.6, z], [LQ.x1 + 2.9, yw - 0.3, z], 0.12, 6);
      railing(m, [LQ.x1 + 2.9, -15.7], [LQ.x1 + 2.9, -3.1], yw, 3);
      for (const bz of [-12.6, -6.2]) {
        lifeboat(m, LQ.x1 + 5, yw + 0.8, bz);
        for (const dz of [-2.7, 2.7]) {
          const z = bz + dz;
          m.rod("davit", [LQ.x1 + 2.2, yw, z], [LQ.x1 + 2.2, yw + 4.8, z], 0.16, 6);
          m.rod("davit", [LQ.x1 + 2.2, yw + 4.8, z], [LQ.x1 + 5, yw + 4.2, z], 0.14, 6);
          m.rod("wire", [LQ.x1 + 5, yw + 4.2, z], [LQ.x1 + 5, yw + 2.1, z], 0.04, 3);
        }
      }
    });
    m.scope("windsock", () => {
      const x = LQ.x0 + 0.8, z = LQ.z0 + 0.8;
      m.rod("steel", [x, LQ_ROOF, z], [x, LQ_ROOF + 4, z], 0.07, 6);
      m.sweep("sock", "x", ngon(8, 0.42, 0, z, LQ_ROOF + 3.6), x + 0.1, ngon(8, 0.16, 0, z, LQ_ROOF + 3.6), x + 2.4);
    });
  });
}

/**
 * The helideck: a square deck PLATFORM_HELIDECK.side across on a beam grid, borne by
 * the quarters' roof and the utility module and cantilevered beyond them on struts.
 * Its touchdown surface is the material `helipad`; on it the landing net, the white
 * perimeter line, the yellow touchdown circle and the white "H"; green lights round the
 * edge, the safety net round the rim and the stair down to the quarters' roof.
 */
function helideck(m: MeshBuilder): void {
  const { x: cx, z: cz, side, y0, y1 } = PLATFORM_HELIDECK;
  const half = side / 2;
  const beam = y0 - 0.7;
  m.scope("helideck", () => {
    m.scope("supports", () => {
      for (const x of [14, 22]) {
        m.box("steel", x, -3.5, 0.7, 0.7, LQ_ROOF, beam, 0, false);
        for (const z of [4, 12]) m.box("steel", x, z, 0.7, 0.7, UTIL.top, beam, 0, false);
      }
      for (const z of [-3.5, 4, 12, 20]) m.box("steel", cx, z, side - 0.4, 0.6, beam, y0);
      for (const x of [14, 22, 30, 37.5]) m.box("steel", x, cz, 0.5, side - 0.4, beam + 0.05, y0 - 0.05);
      // the cantilever struts from the main deck's +X and +Z edges
      for (const z of [-3.5, 4, 12]) m.rod("steel", [LQ.x1 + 0.3, MAIN + 0.6, z], [37.5, beam, z], 0.3, 8);
      for (const x of [14, 22]) m.rod("steel", [x, MAIN + 0.6, TOP_D / 2 - 0.4], [x, beam, 20], 0.3, 8);
      m.rod("steel", [TOP_W / 2 - 0.4, MAIN + 0.6, TOP_D / 2 - 0.4], [37.5, beam, 20], 0.3, 8);
      m.cap("steel", rect(side, side, cx, cz), y0, false);
    });
    m.scope("deck", () => m.box("helipad", cx, cz, side, side, y0, y1));
    m.scope("markings", () => {
      m.box("helipadNet", cx, cz, 15, 15, y1, y1 + 0.02);
      const e = 0.4;
      for (const sg of [-1, 1]) {
        m.box("helipadPaint", cx, cz + sg * (half - 0.45), side - 0.5, e, y1, y1 + 0.03);
        m.box("helipadPaint", cx + sg * (half - 0.45), cz, e, side - 1.7, y1, y1 + 0.03);
      }
      // the touchdown and positioning circle: twenty yellow segments, a metre wide
      const r = 6.75;
      const chord = 2 * r * Math.tan(Math.PI / 20) + 0.05;
      for (let i = 0; i < 20; i++) {
        const a = (i * Math.PI) / 10;
        m.box("helipadMark", cx + r * Math.cos(a), cz + r * Math.sin(a), 1, chord, y1, y1 + 0.04, -a);
      }
      // the white "H", 4 m by 6 m
      for (const sg of [-1, 1]) m.box("helipadPaint", cx + sg * 1.625, cz, 0.75, 6, y1, y1 + 0.05);
      m.box("helipadPaint", cx, cz, 2.5, 0.75, y1, y1 + 0.06);
    });
    m.scope("perimeter lights", () => {
      const inset = half - 0.5;
      for (let i = 0; i < 6; i++) {
        const t = -inset + (2 * inset * i) / 5;
        for (const sg of [-1, 1]) {
          m.box("helipadLight", cx + t, cz + sg * inset, 0.35, 0.35, y1, y1 + 0.3);
          if (i > 0 && i < 5) m.box("helipadLight", cx + sg * inset, cz + t, 0.35, 0.35, y1, y1 + 0.3);
        }
      }
    });
    m.scope("rim net", () => {
      for (const sg of [-1, 1]) {
        m.box("net", cx, cz + sg * (half + 0.75), side + 3, 1.5, y0 + 0.1, y0 + 0.25);
        m.box("net", cx + sg * (half + 0.75), cz, 1.5, side, y0 + 0.1, y0 + 0.25);
        m.box("steel", cx, cz + sg * (half + 1.55), side + 3.2, 0.1, y0, y0 + 0.45);
        m.box("steel", cx + sg * (half + 1.55), cz, 0.1, side + 3, y0, y0 + 0.45);
      }
    });
    m.scope("stair", () => {
      const x0 = cx - half - 1.65;
      m.slab("grate", [[x0, y0 + 0.1, -4.4], [LQ.x0 + 1.2, LQ_ROOF + 0.2, -4.4], [LQ.x0 + 1.2, LQ_ROOF + 0.2, -3.2], [x0, y0 + 0.1, -3.2]], [0, -0.2, 0]);
    });
  });
}

function modules(m: MeshBuilder): void {
  m.scope("process modules", () => {
    m.scope("separation module", () => {
      m.box("module", -8, -9.5, 14, 11, MAIN, 34);
      for (const x of [-12, -8, -4]) m.box("louvre", x, -3.96, 2.6, 0.08, MAIN + 1.2, 32.8);
      m.box("dark", -14.2, -3.96, 1.2, 0.08, MAIN, MAIN + 2.4);
      for (const x of [-11, -5]) {
        m.box("steel", x, -11, 3.2, 3.2, 34, 35.4);
        m.prism("louvre", ngon(12, 1.1, 0, x, -11), 35.4, 35.6);
      }
    });
    m.scope("power module", () => {
      m.box("moduleBlue", -18, 8, 10, 10, MAIN, 33);
      m.box("dark", -13, 6, 0.08, 1.6, MAIN, MAIN + 2.4);
      for (const x of [-20, -16]) {
        m.prism("steel", ngon(12, 0.8, 0, x, 5.5), 33, 37.5, false);
        m.cap("dark", ngon(12, 0.8, 0, x, 5.5), 37.2);
      }
    });
    m.scope("scrubbers", () => {
      for (const z of [-8, -12.5]) {
        m.prism("vessel", ngon(12, 1.1, 0, -21, z), MAIN, 33, false);
        m.spire("vessel", ngon(12, 1.1, 0, -21, z), 33, 33.7);
      }
    });
    m.scope("containers", () => {
      m.box("container1", -10, 9, 6.1, 2.4, MAIN, MAIN + 2.6);
      m.box("container2", -10, 12, 6.1, 2.4, MAIN, MAIN + 2.6);
      m.box("container3", 1.5, 11, 2.4, 6.1, MAIN, MAIN + 2.6);
    });
  });
}

function derrick(m: MeshBuilder): void {
  m.scope("workover derrick", () => {
    const cx = 3.5, floor = 31, top = 52;
    m.box("module", cx, 0, 8, 8, MAIN, floor);
    const leg = (sx: number, sz: number, y: number): V3 => {
      const k = 3.6 - (2.5 * (y - floor)) / (top - floor);
      return [cx + sx * k, y, sz * k];
    };
    const corners: Array<[number, number]> = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const [sx, sz] of corners) m.rod("derrick", leg(sx, sz, floor), leg(sx, sz, top), 0.24, 4);
    const levels = [floor, 35.2, 39.4, 43.6, 47.8, top];
    for (let l = 1; l < levels.length; l++) {
      for (let k = 0; k < 4; k++) {
        const [ax, az] = corners[k]!, [bx, bz] = corners[(k + 1) % 4]!;
        m.rod("derrick", leg(ax, az, levels[l]!), leg(bx, bz, levels[l]!), 0.14, 4, false);
        const up = (l + k) % 2 === 0;
        m.rod("derrick", leg(ax, az, levels[l - 1]!), leg(bx, bz, levels[l]!), 0.11, 4, false);
        if (up) m.rod("derrick", leg(bx, bz, levels[l - 1]!), leg(ax, az, levels[l]!), 0.11, 4, false);
      }
    }
    m.box("steel", cx, 0, 2.8, 2.8, top, top + 1.4);
    m.box("derrick", cx, 0, 8.6, 8.6, floor, floor + 0.3);
  });
}

function crane(m: MeshBuilder): void {
  m.scope("pedestal crane", () => {
    const { x, z } = CRANE;
    m.prism("crane", ngon(14, 1.2, 0, x, z), MAIN, 34);
    m.prism("steel", ngon(14, 1.6, 0, x, z), 34, 34.5, false);
    m.box("crane", x, z, 4.5, 5.2, 34.5, 37.2);
    m.box("craneWhite", x + 2.95, z + 1.2, 1.4, 2.4, 34.5, 36.9);
    m.box("window", x + 2.95, z + 2.43, 1.1, 0.06, 35.6, 36.6);
    const apex: V3 = [x, 42, z - 1];
    for (const s of [-1, 1]) m.rod("crane", [x + s * 1.6, 37.2, z - 2.2], apex, 0.18, 6);
    lattice(m, "crane", BOOM_ROOT, BOOM_TIP, 4, 0.75, 0.35, 8, 0.1);
    m.rod("wire", apex, BOOM_TIP, 0.05, 3);
    m.rod("wire", BOOM_TIP, [BOOM_TIP[0], 44, BOOM_TIP[2]], 0.05, 3);
    m.box("craneWhite", BOOM_TIP[0], BOOM_TIP[2], 0.8, 0.8, 42.8, 44);
  });
}

function flare(m: MeshBuilder): void {
  m.scope("flare boom", () => {
    lattice(m, "flare", FLARE_ROOT, FLARE_TIP, 3, 1.1, 0.55, 9, 0.12);
    // the boom's root on the main deck edge and its strut from the cellar deck
    m.box("steel", FLARE_ROOT[0] + 0.6, FLARE_ROOT[2], 1.4, 3, MAIN, FLARE_ROOT[1] - 0.4);
    m.rod("steel", [-TOP_W / 2 + 0.5, CELLAR, FLARE_ROOT[2]], lerp3(FLARE_ROOT, FLARE_TIP, 0.35), 0.28, 8);
    // the tip: a platform and the flare stack, burning
    const [tx, ty, tz] = FLARE_TIP;
    m.box("grate", tx, tz, 2.4, 2.4, ty - 0.5, ty - 0.3);
    const mouth = ty + 2.6;
    m.prism("flare", ngon(10, 0.6, 0, tx, tz), ty - 0.5, mouth, false);
    m.cap("dark", ngon(10, 0.6, 0, tx, tz), mouth - 0.4);
    m.emit("flame", [tx, mouth, tz], 0.6, { height: 8, color: "#ff8a2a" });
  });
}

/** The offshore platform at full detail. */
export function offshorePlatform(_p?: ParamValues): MeshBuilder {
  const m = model();
  return m.scope("Offshore platform", () => {
    jacket(m);
    decks(m);
    cellarPlant(m);
    quarters(m);
    helideck(m);
    modules(m);
    derrick(m);
    crane(m);
    flare(m);
    return m;
  });
}

/**
 * The low level of detail: the eight battered legs and two X braces, the two decks
 * with the space between them, the quarters, the modules, the derrick, the crane and
 * flare booms as plates, the lifeboats and the helideck on its strut plate.
 */
export function offshorePlatformLod(_p?: ParamValues): MeshBuilder {
  const m = model();
  for (const x of LEG_X) for (const z of LEG_Z) {
    const ring = (y: number): Ring => { const [lx, , lz] = legAt(x, z, y); return ngon(4, 1.1, Math.PI / 4, lx, lz); };
    m.loft("jacket", ring(0), 0, ring(JACKET_TOP), JACKET_TOP, false);
  }
  for (const z of LEG_Z) {
    const s = Math.sign(z);
    const a = legAt(LEG_X[0], z, 1.5), b = legAt(LEG_X[3], z, 19.4), c = legAt(LEG_X[3], z, 1.5), d = legAt(LEG_X[0], z, 19.4);
    const t: V3 = [0, 0, s * 0.4];
    m.slab("jacket", [a, add(a, [0, 1, 0]), add(b, [0, 0, 0]), add(b, [0, -1, 0])], t);
    m.slab("jacket", [c, add(c, [0, 1, 0]), add(d, [0, 0, 0]), add(d, [0, -1, 0])], t);
  }
  lodBox(m, "girder", 0, 0, TOP_W, TOP_D, JACKET_TOP, CELLAR);
  m.box("module", 0, 0, TOP_W - 4, TOP_D - 4, CELLAR, MAIN - 0.65, 0, false);
  lodBox(m, "girder", 0, 0, TOP_W, TOP_D, MAIN - 0.65, MAIN);
  m.box("lq", (LQ.x0 + LQ.x1) / 2, (LQ.z0 + LQ.z1) / 2, LQ.x1 - LQ.x0, LQ.z1 - LQ.z0, MAIN, LQ_ROOF);
  m.box("module", (UTIL.x0 + UTIL.x1) / 2, (UTIL.z0 + UTIL.z1) / 2, UTIL.x1 - UTIL.x0, UTIL.z1 - UTIL.z0, MAIN, UTIL.top);
  m.box("module", -8, -9.5, 14, 11, MAIN, 34);
  m.box("moduleBlue", -18, 8, 10, 10, MAIN, 33);
  m.box("module", 3.5, 0, 8, 8, MAIN, 31);
  m.loft("derrick", ngon(4, 5, Math.PI / 4, 3.5, 0), 31, ngon(4, 1.6, Math.PI / 4, 3.5, 0), 53.4);
  for (const bz of [-12.6, -6.2]) m.box("lifeboat", LQ.x1 + 5, bz, 2.8, 7.6, MAIN + LQ.storey - 0.5, MAIN + LQ.storey + 2.1);
  m.prism("crane", ngon(6, 1.4, 0, CRANE.x, CRANE.z), MAIN, 37.2);
  const boom = (a: V3, b: V3, w: number, mat: Mat): void => {
    const s = mul(unit(cross(unit(sub(b, a)), [0, 1, 0])), w);
    m.slab(mat, [sub(a, s), add(a, s), add(b, s), sub(b, s)], [0, -1.2, 0]);
  };
  boom(BOOM_ROOT, BOOM_TIP, 0.75, "crane");
  boom(FLARE_ROOT, FLARE_TIP, 1.1, "flare");
  m.prism("flare", ngon(6, 0.6, 0, FLARE_TIP[0], FLARE_TIP[2]), FLARE_TIP[1] - 0.5, FLARE_TIP[1] + 2.6);
  const { x: cx, z: cz, side, y0, y1 } = PLATFORM_HELIDECK;
  lodBox(m, "helipad", cx, cz, side, side, y0, y1);
  m.slab("steel", [[LQ.x1, MAIN, -3.5], [LQ.x1, MAIN, TOP_D / 2], [37.5, y0 - 0.1, 20], [37.5, y0 - 0.1, -3.5]], [0, -0.4, 0]);
  return m;
}
