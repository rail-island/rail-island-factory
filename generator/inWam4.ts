// The WAM-4 (CLW's 25 kV AC Co-Co of 1971) on the box locomotive kit (boxLocoKit.ts),
// with its own profile tables and skin items in place of the generic `flat` nose of
// worldLocoKit.ts: the upright flat cab face with rounded vertical corners and a rounded
// head into the cab roof, two windscreens behind vertical guard bars, the headlight pod
// with its twin lamps and visor on the cab roof's front edge between the horns, the
// marker lamp boxes at the cream band's foot, the cream band across face and sides with
// the red lightning bolts and the shed's roundel on the face, the lattice cowcatcher;
// on the sides a narrow cab window ahead of the cab door, then the machine room's tall
// louvres and portholes (one louvre, a porthole, a double louvre, a porthole from each
// end); the cast trimount bogies (the short axle gap outward); two single-arm (Faiveley)
// pantographs over the bogies, the roof resistor boxes beside them, the roof bar between.
// Measured on the photographs of assets/ir-wam4/ (SOURCES.md). See
// docs/models/india-trains.md.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, onEnd, onSide, type ShellSpec } from "./czElectricKit.ts";
import { letters, wordWidth } from "./letters.ts";
import { enumParam } from "./emuParts.ts";
import type { Band } from "./cd163.ts";

// --- measures (m) -----------------------------------------------------------------------

/** Length over buffers 18.794 m, body width 3.18 m. */
const HALF = 9.395;
/** The body's end (the buffers stand 0.65 m proud of it). */
const N = 8.75;
const W = 1.59;
const Y0 = 1.35;
const ROOF = 4.15;
/** The face is upright to 3.86 m, then rounds back into the cab roof. */
const TIP: ReadonlyArray<readonly [number, number]> = [[Y0, N], [3.86, N], [3.98, N - 0.07], [4.08, N - 0.22], [ROOF, N - 0.45]];
/** The sides are upright to 3.72 m, the cant rail rounds into the roof. */
const HW: ReadonlyArray<readonly [number, number]> = [[Y0, W], [3.72, W], [3.9, W - 0.07], [4.04, W - 0.22], [ROOF, W - 0.5]];
/** The face is flat, its vertical corners rounded (about 0.2 m). */
const endPlan = (_y: number, w: number): ReadonlyArray<readonly [number, number]> => [[0, 0], [w * 0.84, 0.015], [w * 0.95, 0.07], [w, 0.19]];
/** Cast trimount bogies: centres 10.0 m apart, axles 2.15 m and 1.88 m apart (the short gap outward), wheels 1,092 mm. */
const PIVOT = 5.0, WHEEL_R = 0.546;
const AXLES = (e: number): number[] => [-2.015, e * 0.135, 2.015];
const PANTO_X = 5.3;
/** The silver roof paint comes down over the rounded cant rail and the face's head. */
const ROOF_EDGE = 3.88;
/** The windscreens: sill, head, inner and outer edge. */
const SCREEN = { y: [3.07, 3.78] as const, z0: 0.08, z1: 1.22 };
/** The marker lamp boxes: centre height and |z|. */
const LAMP = { y: 2.1, z: 0.93 };

// --- liveries -----------------------------------------------------------------------------

interface Livery {
  title: string;
  number: string;
  /** The body colour, the band colour, the number's colour. */
  body: string;
  band: string;
  letter: string;
  /** The band: [y0, y1]; the maroon scheme's cream band, the blue scheme's cream upper body. */
  bandY: readonly [number, number];
  /** The maroon scheme: the bolts and the silver line over the buffer beam. */
  maroon: boolean;
}

/** The keys are stored in saved maps: never rename them. */
const LIVERIES: Record<string, Livery> = {
  // the Bhilai scheme: sky blue below, off-white above with a vee on the face (21206)
  blue: { title: "IR blue", number: "21206", body: "#3a86c8", band: "#e9e6d8", letter: "#2a5f9e", bandY: [2.36, 9], maroon: false },
  // the red-maroon body with the cream band and the red lightning bolts (Arakkonam, Vijayawada: 21219, 21319)
  maroon: { title: "Maroon, cream", number: "21219", body: "#a83826", band: "#ecd59c", letter: "#b33a28", bandY: [2.06, 2.82], maroon: true },
};

export const WAM4_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];

// --- the spec -----------------------------------------------------------------------------

/** A triangle, counter-clockwise in (u, v). */
function tri(a: readonly [number, number], b: readonly [number, number], d: readonly [number, number]): Ring {
  const cross = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
  return cross > 0 ? [[...a], [...b], [...d]] : [[...a], [...d], [...b]];
}

/** The machine room on one side, front half (drawn mirrored at the rear and on both sides). */
function roomItems(): SideItem[] {
  const louvre = (name: string, x: readonly [number, number]): SideItem => ({ kind: "grille", name, x, y: [2.2, 3.6], slats: "h", pitch: 0.115, mat: "slat", mirror: true, r: 0.03 });
  const port = (name: string, x: number): SideItem => ({ kind: "window", name, x: [x - 0.26, x + 0.26], y: [2.94, 3.46], mat: "rubber", mirror: true, r: 0.26 });
  return [
    louvre("louvre 1", [5.39, 6.02]),
    port("porthole 1", 4.0),
    louvre("louvre 2a", [1.95, 2.58]),
    louvre("louvre 2b", [2.63, 3.26]),
    port("porthole 2", 1.2),
  ];
}

function spec(l: Livery): LocoSpec {
  const palette: Record<string, MaterialSpec> = {
    body: c(l.body), band: c(l.band), letter: c(l.letter), dark: c("#2f3133", 0.7),
    silver: c("#c9cbc8", 0.5), roof: { color: "#9ea2a3", roughness: 0.65 }, white: c("#f1f0ea"),
  };
  const [b0, b1] = l.bandY;
  const side: Band[] = l.maroon
    ? [[Y0, 1.48, "body"], [1.48, 1.56, "silver"], [1.56, b0, "body"], [b0, b1, "band"], [b1, ROOF_EDGE, "body"], [ROOF_EDGE, 9, "roof"]]
    : [[Y0, b0, "body"], [b0, ROOF_EDGE, "band"], [ROOF_EDGE, 9, "roof"]];
  const end: Band[] = side;
  const sideItems: SideItem[] = [
    { kind: "door", name: "cab door", x: [6.5, 7.15], y: [1.72, 3.75], rails: true, mirror: true },
    // the narrow cab side window ahead of the door
    { kind: "window", name: "cab window", x: [7.35, 7.85], y: [2.9, 3.58], mat: "rubber", mirror: true, r: 0.06 },
    ...roomItems(),
  ];
  const lampBox = (s: number): EndItem[] => {
    const z: [number, number] = s > 0 ? [LAMP.z - 0.13, LAMP.z + 0.13] : [-LAMP.z - 0.13, -LAMP.z + 0.13];
    const zc = s * LAMP.z;
    return [
      { kind: "paint", name: `marker box ${s > 0 ? "right" : "left"}`, z, y: [LAMP.y - 0.19, LAMP.y + 0.19], mat: "silver", layer: 3 },
      { kind: "lamp", name: `marker lamp ${s > 0 ? "right" : "left"}`, z: [zc - 0.06, zc + 0.06], y: [LAMP.y + 0.03, LAMP.y + 0.15], r: 0.055 },
      { kind: "lamp", name: `tail lamp ${s > 0 ? "right" : "left"}`, z: [zc - 0.06, zc + 0.06], y: [LAMP.y - 0.15, LAMP.y - 0.03], r: 0.055, mat: "lampRed" },
    ];
  };
  // seen from outside, u to the viewer's right: the bolts lean down to the roundel
  const bolt = (s: number): EndItem[] => {
    const p = (u: number, v: number): [number, number] => [s * u, v];
    return [
      { kind: "paint", name: `bolt ${s > 0 ? "right" : "left"} upper`, z: [-1, 1], y: [2.4, 2.8], mat: "body", layer: 1, poly: tri(p(0.74, 2.79), p(0.58, 2.79), p(0.35, 2.41)) },
      { kind: "paint", name: `bolt ${s > 0 ? "right" : "left"} lower`, z: [-1, 1], y: [2.1, 2.6], mat: "body", layer: 2, poly: tri(p(0.52, 2.54), p(0.33, 2.46), p(0.21, 2.12)) },
    ];
  };
  const endItems: EndItem[] = [
    { kind: "window", name: "windscreen left", z: [SCREEN.z0, SCREEN.z1], y: SCREEN.y, wiper: true },
    { kind: "window", name: "windscreen right", z: [-SCREEN.z1, -SCREEN.z0], y: SCREEN.y, wiper: true },
    ...lampBox(-1), ...lampBox(1),
    ...(l.maroon
      ? [...bolt(-1), ...bolt(1), { kind: "paint", name: "roundel ring", z: [-0.2, 0.2], y: [2.17, 2.57], mat: "dark", layer: 1, poly: ngon(16, 0.2, 0, 0, 2.37).reverse() } as EndItem,
        { kind: "paint", name: "roundel", z: [-0.18, 0.18], y: [2.19, 2.55], mat: "white", layer: 2, poly: ngon(16, 0.18, 0, 0, 2.37).reverse() } as EndItem]
      // the blue scheme's off-white vee into the blue
      : [{ kind: "paint", name: "vee", z: [-0.86, 0.86], y: [2.13, 2.36], mat: "band", layer: 1, poly: tri([-0.86, b0], [0.86, b0], [0, 2.13]) } as EndItem]),
  ];
  return {
    palette,
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side,
    end,
    roof: "roof",
    buffers: HALF,
    beam: N,
    bufferY: 1.105,
    frame: { y0: Y0 - 0.38, y1: Y0, half: N, hw: W - 0.05, mat: "body" },
    bogies: [-1, 1].map((e) => ({ xc: e * PIVOT, axles: AXLES(e), wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 })),
    pantograph: { kind: "singleArm", x: PANTO_X, roofY: ROOF + 0.06, baseY: ROOF + 0.3 },
    hvLine: { x: 0.9, y: ROOF + 0.5, z: 0.25 },
    sideItems,
    endItems,
    roofItems: [
      // the roof walkway, the resistor boxes inboard of the pantographs, the cab roofs' ventilators
      { name: "roof walkway", x: [-6.6, 6.6], w: [W - 0.55, W - 0.6], y: [ROOF - 0.01, ROOF + 0.06], mat: "roof" },
      { name: "front resistor box", x: [1.7, 4.2], w: [0.55, 0.52], y: [ROOF + 0.05, ROOF + 0.5], mat: "slat" },
      { name: "rear resistor box", x: [-4.2, -1.7], w: [0.55, 0.52], y: [ROOF + 0.05, ROOF + 0.5], mat: "slat" },
      { name: "front cab vent", x: [7.0, 7.6], w: [0.4, 0.36], y: [ROOF - 0.01, ROOF + 0.12], mat: "roof" },
      { name: "rear cab vent", x: [-7.6, -7.0], w: [0.4, 0.36], y: [ROOF - 0.01, ROOF + 0.12], mat: "roof" },
    ],
    // the transformer tank and the compressor boxes between the bogies
    underItems: [[-2.6, 2.6, Y0 - 0.95, Y0 - 0.38, W - 0.45]],
    number: l.number,
  };
}

// --- details the kit does not draw ----------------------------------------------------------

const span = (e: number, a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);

/** The guards over the windscreens: vertical bars in a frame, 5 cm proud of the glass. */
function screenGuards(m: MeshBuilder, e: number): void {
  const [y0, y1] = [SCREEN.y[0] - 0.02, SCREEN.y[1] + 0.02];
  const x = (e > 0 ? 1 : -1) * (N + 0.05);
  for (const s of [-1, 1])
    m.scope(s > 0 ? "guard left" : "guard right", () => {
      const za = s * (SCREEN.z0 - 0.01), zb = s * (SCREEN.z1 + 0.01);
      const n = 6;
      for (let i = 0; i <= n; i++) {
        const z = za + ((zb - za) * i) / n;
        const r = i === 0 || i === n ? 0.022 : 0.008;
        m.prism("steel", ngon(4, r, Math.PI / 4, x, z), y0, y1);
      }
      for (const y of [y0 + 0.015, y1 - 0.015]) {
        const sec = ngon(4, 0.018, Math.PI / 4, x, y);
        m.sweep("steel", "z", sec, Math.min(za, zb), sec, Math.max(za, zb));
      }
      // the brackets back to the face
      for (const z of [za, zb]) for (const y of [y0 + 0.05, y1 - 0.05]) {
        const sec = ngon(4, 0.014, Math.PI / 4, z, y);
        const [a, b] = span(e, N - 0.01, N + 0.05);
        m.sweep("steel", "x", sec, a, sec, b);
      }
    });
}

/** The marker lamp boxes' hoods standing 8 cm off the face. */
function lampHoods(m: MeshBuilder, e: number): void {
  for (const s of [-1, 1]) {
    const z = s * LAMP.z;
    const [a, b] = span(e, N - 0.01, N + 0.09);
    m.prism("silver", [[b, z + 0.14], [b, z - 0.14], [a, z - 0.14], [a, z + 0.14]], LAMP.y + 0.19, LAMP.y + 0.22);
    for (const zz of [z - 0.14, z + 0.14]) m.prism("silver", [[b, zz + 0.012], [b, zz - 0.012], [a, zz - 0.012], [a, zz + 0.012]], LAMP.y - 0.19, LAMP.y + 0.19);
  }
}

/** The lattice cowcatcher under the buffer beam: a top beam, upright bars, rails across. */
function cowcatcher(m: MeshBuilder, e: number): void {
  const [yb, yt] = [0.14, Y0 - 0.4];
  const [xb, xt] = [N + 0.34, N + 0.24];
  const at = (y: number) => xb + ((xt - xb) * (y - yb)) / (yt - yb);
  m.scope("top beam", () => {
    const sec: Ring = [[-1.3, yt - 0.03], [1.3, yt - 0.03], [1.3, Y0 - 0.36], [-1.3, Y0 - 0.36]];
    const [a, b] = span(e, N - 0.2, xt + 0.06);
    m.sweep("dark", "x", sec, a, sec, b);
  });
  m.scope("bars", () => {
    const n = 11;
    for (let i = 0; i < n; i++) {
      const z = -1.2 + (2.4 * i) / (n - 1);
      const ring = (y: number): Ring => ngon(4, i === 0 || i === n - 1 ? 0.04 : 0.022, Math.PI / 4, e * at(y), z);
      m.loft("dark", ring(yb), yb, ring(yt), yt);
    }
  });
  m.scope("rails", () => {
    for (const y of [yb + 0.03, 0.36, 0.58, 0.8]) {
      const sec = ngon(4, 0.028, Math.PI / 4, e * (at(y) + 0.03), y);
      m.sweep("dark", "z", sec, -1.25, sec, 1.25);
    }
  });
}

/** The headlight pod on the cab roof's front edge (twin lamps under a visor) and the horns beside it. */
function roofFront(m: MeshBuilder, e: number): void {
  const box = (x0: number, x1: number, w: number, y0: number, y1: number, mat: string) => {
    const [a, b] = span(e, x0, x1);
    m.prism(mat, [[b, w], [b, -w], [a, -w], [a, w]], y0, y1);
  };
  const xf = N - 0.3, xb = N - 0.9;
  m.scope("headlight pod", () => {
    box(xb, xf - 0.05, 0.3, ROOF - 0.15, ROOF + 0.05, "roof");
    // the housing: a drum lying along x, its face round
    const drum = ngon(12, 0.29, Math.PI / 12, 0, ROOF + 0.3);
    const [d0, d1] = span(e, xb + 0.05, xf);
    m.sweep("roof", "x", drum, d0, drum, d1);
    // the visor over the lamps
    const visor: Ring = [[-0.32, ROOF + 0.5], [0.32, ROOF + 0.5], [0.32, ROOF + 0.6], [-0.32, ROOF + 0.6]];
    const [v0, v1] = span(e, xf - 0.4, xf + 0.18);
    m.sweep("roof", "x", visor, v0, visor, v1);
    m.scope("bezel", () => {
      const bez = ngon(12, 0.24, Math.PI / 12, 0, ROOF + 0.3);
      const [z0, z1] = span(e, xf, xf + 0.02);
      m.sweep("dark", "x", bez, z0, bez, z1);
    });
    for (const z of [-0.11, 0.11]) {
      const lens = ngon(10, 0.09, 0, z, ROOF + 0.3);
      const [l0, l1] = span(e, xf + 0.02, xf + 0.04);
      m.sweep("lampHead", "x", lens, l0, lens, l1);
    }
  });
  m.scope("horns", () => {
    for (const z of [-0.7, 0.7]) {
      const x0 = N - 0.85, x1 = N - 0.35;
      const [s0, s1] = span(e, x0, x0 + 0.1);
      m.prism("dark", [[s1, z + 0.05], [s1, z - 0.05], [s0, z - 0.05], [s0, z + 0.05]], ROOF - 0.12, ROOF + 0.12);
      const stem = ngon(8, 0.04, 0, z, ROOF + 0.16), bell = ngon(8, 0.08, 0, z, ROOF + 0.16);
      const [t0, t1] = span(e, x0, x1 - 0.14), [b0, b1] = span(e, x1 - 0.14, x1);
      m.sweep("dark", "x", stem, t0, stem, t1);
      m.sweep("dark", "x", e > 0 ? stem : bell, b0, e > 0 ? bell : stem, b1);
    }
  });
}

/** The roof resistor boxes' side slats, the bar's post insulators and the circuit breaker. */
function roofGear(m: MeshBuilder): void {
  m.scope("roof gear", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front resistor slats" : "rear resistor slats", () => {
      for (let i = 0; i < 7; i++) {
        const x = e * (1.9 + i * 0.35);
        for (const s of [-1, 1]) {
          const [z0, z1] = s > 0 ? [0.53, 0.56] : [-0.56, -0.53];
          m.prism("louvre", [[x + 0.1, z1], [x + 0.1, z0], [x - 0.1, z0], [x - 0.1, z1]], ROOF + 0.1, ROOF + 0.45);
        }
      }
    });
    for (const x of [-0.45, 0.45]) m.scope("insulator", () => {
      m.prism("insulator", ngon(8, 0.045, 0, x, 0.25), ROOF + 0.06, ROOF + 0.48);
      for (const f of [0.14, 0.24, 0.34]) m.prism("insulator", ngon(8, 0.08, Math.PI / 8, x, 0.25), ROOF + f, ROOF + f + 0.03);
    });
    m.scope("circuit breaker", () => {
      m.prism("dark", ngon(8, 0.13, Math.PI / 8, 0, -0.35), ROOF + 0.06, ROOF + 0.24);
      m.prism("insulator", ngon(8, 0.06, 0, 0, -0.35), ROOF + 0.24, ROOF + 0.55);
    });
  });
}

/** The running number painted on each side's band, and on the face above the roundel or the vee. */
function numbers(m: MeshBuilder, sp: ShellSpec, l: Livery): void {
  const style = { weight: 0.17, width: 0.62, gap: 0.12 };
  const [h, y] = l.maroon ? [0.44, 2.22] : [0.4, 2.6];
  const w = wordWidth(l.number, h, style);
  for (const sd of [-1, 1]) {
    const at = onSide(sp, sd);
    const x = 0;
    const tris = letters(l.number, sd > 0 ? x - w / 2 : x + w / 2, y, h, sd < 0, style);
    m.scope(sd > 0 ? "right" : "left", () => m.facets("letter", tris.map(([u, v]) => at(u, v, 0.0115)), [0, 0, sd]));
  }
  // on the face: the class over the number (maroon) or beside it (blue), the zone and the shed beside the lamps
  const face: Array<[string, number, number, number, string]> = l.maroon
    ? [["WAM-4", 0, 2.88, 0.14, "band"], [l.number, 0, 2.6, 0.17, "letter"], ["SR", -0.62, 1.7, 0.15, "band"], ["AJJ", 0.62, 1.7, 0.15, "band"]]
    : [["WAM-4 " + l.number, 0, 2.84, 0.15, "letter"], ["SECR", -0.62, 1.78, 0.12, "white"], ["BHILAI", 0.62, 1.78, 0.12, "white"]];
  for (const e of [-1, 1]) {
    const at = onEnd(sp, e);
    m.scope(e > 0 ? "front" : "rear", () => {
      for (const [text, uc, y0, h, mat] of face) {
        const w = wordWidth(text, h, style);
        // seen from ahead, the reader's right is -z at the front
        const u = e > 0 ? -uc : uc;
        const tris = letters(text, e > 0 ? u + w / 2 : u - w / 2, y0, h, e > 0, style);
        m.facets(mat, tris.map(([a, b]) => at(a, b, 0.0115)), [e, 0, 0]);
      }
    });
  }
}

/** The jumper cables hanging over the roundel, standing 6 cm off the face. */
function jumpers(m: MeshBuilder, e: number): void {
  for (const z of [-0.09, 0.09]) {
    const x = e * (N + 0.06);
    m.prism("black", ngon(6, 0.025, 0, x, z), 1.4, 2.62);
    const [a, b] = span(e, N - 0.01, N + 0.06);
    m.sweep("black", "x", ngon(6, 0.03, 0, z, 2.6), a, ngon(6, 0.03, 0, z, 2.6), b);
  }
}

const livery = (v?: ParamValues): Livery => LIVERIES[resolveParams(WAM4_PARAMS, v).livery!]!;

export function irWam4(v?: ParamValues): MeshBuilder {
  const l = livery(v);
  const sp = spec(l);
  const m = buildBoxLoco(sp);
  m.scope("lettering", () => numbers(m, shellOf(sp), l));
  m.scope("cab details", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        m.scope("screen guards", () => screenGuards(m, e));
        m.scope("lamp hoods", () => lampHoods(m, e));
        if (l.maroon) m.scope("jumpers", () => jumpers(m, e));
        m.scope("cowcatcher", () => cowcatcher(m, e));
        roofFront(m, e);
      });
  });
  roofGear(m);
  // the shell's underside beside the frame, which stands 5 cm in from the sides
  m.scope("underside", () => {
    const [H, w, k] = [N - 0.01, W - 0.01, 0.17];
    const r: Ring = [[H, -w + k], [H - k, -w], [-H + k, -w], [-H, -w + k], [-H, w - k], [-H + k, w], [H - k, w], [H, w - k]];
    m.cap("dark", r, Y0, false);
  });
  return m;
}

/** The distant model: the colour fields without the silver line, the roof colour down to the roof's rounding. */
export function irWam4Lod(v?: ParamValues): MeshBuilder {
  const l = livery(v);
  const [b0, b1] = l.bandY;
  const bands: Band[] = l.maroon ? [[Y0, b0, "body"], [b0, b1, "band"], [b1, 9, "body"]] : [[Y0, b0, "body"], [b0, 9, "band"]];
  const sp = spec(l);
  return boxLocoLod({ ...sp, tip: [[Y0, N], [3.9, N], [ROOF, N - 0.45]], hw: [[Y0, W], [3.8, W], [ROOF, W - 0.5]], endPlan: (_y, w) => [[0, 0], [w, 0.1]], side: bands, end: bands, roofItems: [] });
}
