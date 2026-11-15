// The WAP-7 / WAG-9 (CLW's three-phase Co-Co of the ABB 6FRA lineage) on the box
// locomotive kit (boxLocoKit.ts), with its own profile tables and skin items in
// place of the generic `raked` nose of worldLocoKit.ts: the upright cab face
// leaning back 0.4 m to the windscreens' head, the hipped cab roof behind it,
// two windscreens behind their stone guards with a centre pillar, the twin
// headlamp and the marker lamps on the waist stripe, the headlight pod and the
// horns on the cab roof, the open-bar plough, one large cab side window ahead of
// the door, the painted "INDIAN RAILWAYS",
// the sides' louvre panels (point-symmetric: one side's rear-end pattern is the
// other side's front-end one), two single-arm pantographs over the bogies with
// the roof bar between them, the transformer tank between the Co-Co bogies.
// Measured on the photographs of assets/ir-wap7/ (SOURCES.md). See
// docs/models/india-trains.md.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onSide, type ShellSpec } from "./czElectricKit.ts";
import { letters, wordWidth } from "./letters.ts";
import { enumParam } from "./emuParts.ts";
import type { Band } from "./cd163.ts";

// --- measures (m) -----------------------------------------------------------------------

/** Length over buffers 20.562 m, body width 3.152 m. */
const HALF = 10.28;
/** The body's end at the sill (the buffers stand 0.63 m proud of it). */
const N = 9.65;
const W = 1.575;
const Y0 = 1.3;
const ROOF = 4.18;
/** The face's foot (the dark band's top under the face), the windscreens' head, the hip's foot. */
const FOOT = 1.72, HEAD = 3.78, HIP = 3.92;
/** The end's centre line [y, |x|]: upright below the face, the face leaning 0.4 m back, the hipped roof. */
const TIP: ReadonlyArray<readonly [number, number]> = [[Y0, N], [FOOT, N], [HEAD, N - 0.4], [HIP, N - 0.5], [ROOF, N - 1.45]];
const HW: ReadonlyArray<readonly [number, number]> = [[Y0, W], [3.7, W], [4.04, W - 0.18], [ROOF, W - 0.42]];
/** The face is nearly flat, its upright corners rounded. */
const endPlan = (_y: number, w: number): ReadonlyArray<readonly [number, number]> => [[0, 0], [w * 0.75, 0.02], [w * 0.93, 0.07], [w, 0.17]];
/** Bogie centres 11.5 m, axles 1.8 m apart, wheels 1,092 mm. */
const PIVOT = 5.75, BASE = 1.8, WHEEL_R = 0.546;
const PANTO_X = 4.8;
/** The windscreens: sill, head, the centre pillar's half width, the outer edge. */
const SCREEN = { y: [2.84, 3.71] as const, z0: 0.1, z1: 1.25 };
/** The waist stripe on side and face. */
const STRIPE: readonly [number, number] = [2.22, 2.48];

// --- liveries -----------------------------------------------------------------------------

interface Livery { title: string; number: string; body: string; stripe: string; letter: string }

/** The keys are stored in saved maps: never rename them. */
const LIVERIES: Record<string, Livery> = {
  // the white body with the red waist stripe (Ghaziabad, Lallaguda, Royapuram ... 30262, 39231, 39342)
  redWhite: { title: "Red and white", number: "30201", body: "#efeee8", stripe: "#c0312b", letter: "#3a3f45" },
  // the early dark blue scheme with a cream stripe
  blue: { title: "IR blue", number: "30351", body: "#1d3f80", stripe: "#e8dcc0", letter: "#e8dcc0" },
  // the WAG-9's brown with the yellow stripe
  wag9: { title: "WAG-9 brown", number: "31001", body: "#6b3a22", stripe: "#f2c31a", letter: "#f2c31a" },
};

export const WAP7_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];

// --- the spec -----------------------------------------------------------------------------

/** Mirror a side item's x span to the other end (point symmetry: the left side is the right one turned about). */
const turned = (it: SideItem): SideItem => ({ ...it, name: `${it.name} (left)`, x: [-it.x[1], -it.x[0]], sides: [-1] });

/** The machine room's louvre panels on the right side (+z), front +x. */
function roomItems(): SideItem[] {
  const g = (name: string, x: readonly [number, number], y: readonly [number, number]): SideItem => ({ kind: "grille", name, x, y, slats: "h", pitch: 0.11, mat: "slat", sides: [1], r: 0.03 });
  const right: SideItem[] = [
    // a pair of small louvres over a pair of larger ones across the stripe, 3.0 - 4.5 m behind the rear cab's end
    g("rear upper louvre a", [-6.6, -5.93], [3.03, 3.62]),
    g("rear upper louvre b", [-5.87, -5.2], [3.03, 3.62]),
    g("rear lower louvre a", [-6.6, -5.93], [1.95, 2.7]),
    g("rear lower louvre b", [-5.87, -5.2], [1.95, 2.7]),
    // the narrow louvre near the middle
    g("middle louvre", [-2.4, -1.78], [2.55, 3.66]),
    // the large four-pane louvre 3.6 - 5.0 m behind the front cab's end
    g("front louvre 1", [4.65, 5.32], [2.47, 3.08]),
    g("front louvre 2", [5.38, 6.05], [2.47, 3.08]),
    g("front louvre 3", [4.65, 5.32], [3.14, 3.75]),
    g("front louvre 4", [5.38, 6.05], [3.14, 3.75]),
  ];
  return [...right, ...right.map(turned)];
}

function spec(l: Livery): LocoSpec {
  const palette: Record<string, MaterialSpec> = {
    body: c(l.body), stripe: c(l.stripe), letter: c(l.letter), dark: c("#3b3d40", 0.7),
    roof: { color: "#8e9294", roughness: 0.7 }, plate: c("#3a3b3d", 0.6),
  };
  const side: Band[] = [[Y0, STRIPE[0], "body"], [STRIPE[0], STRIPE[1], "stripe"], [STRIPE[1], 9, "body"]];
  const end: Band[] = [[Y0, FOOT, "dark"], [FOOT, STRIPE[0], "body"], [STRIPE[0], STRIPE[1], "stripe"], [STRIPE[1], 9, "body"]];
  const sy = (STRIPE[0] + STRIPE[1]) / 2;
  const sideItems: SideItem[] = [
    { kind: "door", name: "cab door", x: [7.5, 8.15], y: [FOOT, 3.82], win: [2.97, 3.66], rails: true, mirror: true },
    // one large cab side window ahead of the door, its corners rounded
    { kind: "window", name: "cab window", x: [8.22, 8.94], y: [2.88, 3.68], mat: "rubber", mirror: true, r: 0.12 },
    ...roomItems(),
    { kind: "plate", name: "number", x: [-0.5, 0.5], y: [1.86, 2.06] },
  ];
  const endItems: EndItem[] = [
    { kind: "window", name: "windscreen left", z: [SCREEN.z0, SCREEN.z1], y: SCREEN.y, wiper: true },
    { kind: "window", name: "windscreen right", z: [-SCREEN.z1, -SCREEN.z0], y: SCREEN.y, wiper: true },
    // the twin headlamp in its housing on the stripe, the marker lamps (white over red) at its ends
    { kind: "paint", name: "headlamp housing", z: [-0.27, 0.27], y: [sy - 0.17, sy + 0.17], mat: "dark", layer: 1 },
    { kind: "lamp", name: "headlight left", z: [0.03, 0.21], y: [sy - 0.09, sy + 0.09], r: 0.085 },
    { kind: "lamp", name: "headlight right", z: [-0.21, -0.03], y: [sy - 0.09, sy + 0.09], r: 0.085 },
    { kind: "paint", name: "marker housing left", z: [0.96, 1.2], y: [sy - 0.21, sy + 0.21], mat: "dark", layer: 1 },
    { kind: "paint", name: "marker housing right", z: [-1.2, -0.96], y: [sy - 0.21, sy + 0.21], mat: "dark", layer: 1 },
    { kind: "lamp", name: "marker lamp left", z: [1.02, 1.14], y: [sy + 0.04, sy + 0.16], r: 0.055 },
    { kind: "lamp", name: "marker lamp right", z: [-1.14, -1.02], y: [sy + 0.04, sy + 0.16], r: 0.055 },
    { kind: "lamp", name: "tail lamp left", z: [1.02, 1.14], y: [sy - 0.16, sy - 0.04], r: 0.055, mat: "lampRed" },
    { kind: "lamp", name: "tail lamp right", z: [-1.14, -1.02], y: [sy - 0.16, sy - 0.04], r: 0.055, mat: "lampRed" },
    { kind: "plate", name: "number", z: [-1.2, -0.5], y: [1.88, 2.04] },
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
    frame: { y0: Y0 - 0.35, y1: Y0, half: N, hw: W - 0.05, mat: "dark" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: [-BASE, 0, BASE], wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 })),
    pantograph: { kind: "singleArm", x: PANTO_X, roofY: ROOF + 0.07, baseY: ROOF + 0.24 },
    hvLine: { x: 1.4, y: ROOF + 0.42, z: 0.32 },
    sideItems,
    endItems,
    roofItems: [
      // the roof hatches between the cabs, the cab roofs' air-conditioning units, the machine-room fan box
      { name: "roof hatches", x: [-7.0, 7.0], w: [W - 0.5, W - 0.56], y: [ROOF - 0.01, ROOF + 0.07], mat: "roof" },
      { name: "front cab cooler", x: [7.15, 7.95], w: [0.62, 0.56], y: [ROOF - 0.01, ROOF + 0.17], mat: "roof" },
      { name: "rear cab cooler", x: [-7.95, -7.15], w: [0.62, 0.56], y: [ROOF - 0.01, ROOF + 0.17], mat: "roof" },
      { name: "fan box", x: [0.4, 1.7], w: [0.45, 0.42], y: [ROOF + 0.06, ROOF + 0.32], mat: "slat" },
    ],
    underItems: [[-2.3, 2.3, Y0 - 0.8, Y0 - 0.35, W - 0.5]],
    number: l.number,
  };
}

// --- details the kit does not draw ----------------------------------------------------------

/** The face's x (front, +) at height y and z. */
function faceX(y: number, z: number): number {
  const w = lerpTable(HW, y);
  const plan = endPlan(y, w);
  let set = plan[plan.length - 1]![1];
  for (let i = 1; i < plan.length; i++) {
    const [z0, d0] = plan[i - 1]!, [z1, d1] = plan[i]!;
    if (Math.abs(z) <= z1) { set = d0 + ((d1 - d0) * (Math.abs(z) - z0)) / (z1 - z0); break; }
  }
  return lerpTable(TIP, y) - set;
}

/** A thin bar from (y0) to (y1) standing `off` proud of the face at z, leaning with it. */
function faceBar(m: MeshBuilder, e: number, z: number, y0: number, y1: number, off: number, r: number): void {
  const ring = (y: number): Ring => ngon(4, r, Math.PI / 4, e * (faceX(y, z) + off), z);
  m.loft("steel", ring(y0), y0, ring(y1), y1);
}

/** The stone guards over the windscreens: a frame and vertical bars, 6 cm proud of the glass. */
function screenGuards(m: MeshBuilder, e: number): void {
  const [y0, y1] = [SCREEN.y[0] - 0.03, SCREEN.y[1] + 0.03];
  for (const s of [-1, 1])
    m.scope(s > 0 ? "guard left" : "guard right", () => {
      const za = s * (SCREEN.z0 - 0.02), zb = s * (SCREEN.z1 + 0.02);
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const z = za + ((zb - za) * i) / n;
        faceBar(m, e, z, y0, y1, 0.07, i === 0 || i === n ? 0.02 : 0.007);
      }
      for (const y of [y0, (y0 + y1) / 2, y1]) {
        const x = e * (faceX(y, s * (SCREEN.z0 + SCREEN.z1) / 2) + 0.07);
        const sec = ngon(4, 0.016, Math.PI / 4, x, y);
        m.sweep("steel", "z", sec, Math.min(za, zb), sec, Math.max(za, zb));
      }
      // the brackets back to the face
      for (const z of [za, zb]) for (const y of [y0 + 0.05, y1 - 0.05]) {
        const x0 = faceX(y, z) - 0.02, x1 = faceX(y, z) + 0.07;
        const sec = ngon(4, 0.015, Math.PI / 4, z, y);
        m.sweep("steel", "x", sec, e > 0 ? x0 : -x1, sec, e > 0 ? x1 : -x0);
      }
    });
}

/** The handrail looped round the lamps: two posts and the bar across over the stripe. */
function lampRail(m: MeshBuilder, e: number): void {
  const [y0, y1, z] = [1.9, 2.68, 1.27];
  for (const s of [-1, 1]) faceBar(m, e, s * z, y0, y1, 0.07, 0.016);
  const x = e * (faceX(y1, 0) + 0.07);
  const sec = ngon(6, 0.016, 0, x, y1);
  m.sweep("steel", "z", sec, -z - 0.016, sec, z + 0.016);
  for (const s of [-1, 1]) for (const y of [y0 + 0.04, y1 - 0.04]) {
    const x0 = faceX(y, s * z) - 0.02, x1 = faceX(y, s * z) + 0.07;
    const b = ngon(4, 0.012, Math.PI / 4, s * z, y);
    m.sweep("steel", "x", b, e > 0 ? x0 : -x1, b, e > 0 ? x1 : -x0);
  }
}

/** The open-bar plough under the buffer beam: a top beam, posts leaning forward to the foot, rails across. */
function plough(m: MeshBuilder, e: number): void {
  const [yb, yt] = [0.17, Y0 - 0.37];
  const [xb, xt] = [N + 0.5, N + 0.3];
  const at = (y: number) => xb + ((xt - xb) * (y - yb)) / (yt - yb);
  m.scope("top beam", () => {
    const sec: Ring = [[-1.2, yt - 0.02], [1.2, yt - 0.02], [1.2, Y0 - 0.33], [-1.2, Y0 - 0.33]];
    const [a, b] = e > 0 ? [N - 0.2, xt + 0.06] : [-(xt + 0.06), -(N - 0.2)];
    m.sweep("dark", "x", sec, a, sec, b);
  });
  m.scope("posts", () => {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const z = -1.08 + (2.16 * i) / (n - 1);
      const ring = (y: number): Ring => ngon(4, 0.035, Math.PI / 4, e * at(y), z);
      m.loft("dark", ring(yb), yb, ring(yt), yt);
    }
  });
  m.scope("rails", () => {
    for (const y of [yb + 0.03, 0.42, 0.66]) {
      const sec = ngon(4, 0.03, Math.PI / 4, e * (at(y) + 0.03), y);
      m.sweep("dark", "z", sec, -1.15, sec, 1.15);
    }
  });
}

/** The painted "INDIAN RAILWAYS" on each side between the louvres (point-symmetric, as the panels). */
function sideLettering(m: MeshBuilder, sp: ShellSpec): void {
  const text = "INDIAN RAILWAYS", h = 0.48, y = 3.1, style = { weight: 0.19, width: 0.6, gap: 0.14 };
  const w = wordWidth(text, h, style);
  for (const sd of [-1, 1]) {
    const x = sd * 0.6;
    const at = onSide(sp, sd);
    // on the right side (+z) the reader's right is +x
    const tris = letters(text, sd > 0 ? x - w / 2 : x + w / 2, y, h, sd < 0, style);
    m.scope(sd > 0 ? "right" : "left", () => m.facets("letter", tris.map(([u, v]) => at(u, v, 0.0115)), [0, 0, sd]));
  }
}

/** The headlight pod on the cab roof's front edge and the two horns beside it. */
function roofFront(m: MeshBuilder, e: number): void {
  const xf = N - 1.12, xb = N - 1.62;
  const box = (x0: number, x1: number, w: number, y0: number, y1: number, mat: string) => {
    const [a, b] = e > 0 ? [x0, x1] : [-x1, -x0];
    const ring: Ring = [[b, w], [b, -w], [a, -w], [a, w]];
    m.prism(mat, ring, y0, y1);
  };
  m.scope("headlight pod", () => {
    box(xb, xf, 0.2, ROOF - 0.14, ROOF + 0.12, "roof");
    box(xb + 0.1, xf - 0.02, 0.13, ROOF + 0.12, ROOF + 0.38, "dark");
    const lens = ngon(10, 0.085, 0, 0, ROOF + 0.25);
    const [l0, l1] = e > 0 ? [xf - 0.05, xf + 0.01] : [-xf - 0.01, -xf + 0.05];
    m.sweep("lampHead", "x", lens, l0, lens, l1);
  });
  m.scope("horns", () => {
    for (const z of [-0.55, 0.55]) {
      const x0 = N - 1.55, x1 = N - 1.18;
      const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      const [s0, s1] = span(x0, x0 + 0.08);
      m.prism("dark", [[s1, z + 0.04], [s1, z - 0.04], [s0, z - 0.04], [s0, z + 0.04]], ROOF - 0.02, ROOF + 0.13);
      const stem = ngon(8, 0.035, 0, z, ROOF + 0.17), bell = ngon(8, 0.065, 0, z, ROOF + 0.17);
      const [t0, t1] = span(x0, x1 - 0.12), [b0, b1] = span(x1 - 0.12, x1);
      m.sweep("dark", "x", stem, t0, stem, t1);
      m.sweep("dark", "x", e > 0 ? stem : bell, b0, e > 0 ? bell : stem, b1);
    }
  });
}

/** The roof bar's extra post insulators and the main circuit breaker beside it. */
function roofGear(m: MeshBuilder): void {
  m.scope("roof gear", () => {
    for (const x of [-0.6, 0.0]) m.scope("insulator", () => {
      m.prism("insulator", ngon(8, 0.045, 0, x, 0.32), ROOF + 0.06, ROOF + 0.38);
      for (const f of [0.12, 0.21]) m.prism("insulator", ngon(8, 0.075, Math.PI / 8, x, 0.32), ROOF + f, ROOF + f + 0.03);
    });
    m.scope("circuit breaker", () => {
      m.prism("dark", ngon(8, 0.11, Math.PI / 8, -0.3, -0.3), ROOF + 0.06, ROOF + 0.22);
      m.prism("insulator", ngon(8, 0.06, 0, -0.3, -0.3), ROOF + 0.22, ROOF + 0.5);
    });
  });
}

const livery = (v?: ParamValues): Livery => LIVERIES[resolveParams(WAP7_PARAMS, v).livery!]!;

export function irWap7(v?: ParamValues): MeshBuilder {
  const sp = spec(livery(v));
  const m = buildBoxLoco(sp);
  m.scope("lettering", () => sideLettering(m, shellOf(sp)));
  m.scope("cab details", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        m.scope("stone guards", () => screenGuards(m, e));
        m.scope("lamp rail", () => lampRail(m, e));
        m.scope("plough", () => plough(m, e));
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

export function irWap7Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(livery(v)));
}
