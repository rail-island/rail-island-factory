// China Railway's SS1 "Shaoshan 1", the Co-Co AC electric locomotive Zhuzhou built
// from 1958 (as the 6Y1) to 1988 after the Soviet N60 (VL60), in the green and
// yellow of the museum's SS1 008 (assets/cr-ss1/SOURCES.md).
//
// Its own profile tables on the box locomotive kit (boxLocoKit.ts), not the generic
// world locomotive: the upright cab front with the windscreens leaning back, the
// rounded corners swept back into the sides, the roof's rim standing out over the
// face and the sides, the lower body tucking in under the lower stripe, and the body
// side skirted down to 0.82 m so that only the bottoms of the wheels show. The livery
// draws the light green upper body, the dark green lower body, the two yellow
// stripes and the yellow vee on the cab front framing the CR emblem. Each side has
// the narrow corner window, the cab window and the plain cab door at each end and the
// machine room's twelve louvre columns, two tiers of louvres or a louvre over a
// window, with two pressed ribs along the lower body. On the roof: the headlight on
// the cab roof's front, the braking-resistor housings behind the cabs, the walkway's
// railings and two single-arm pantographs over the bogies (the rear raised). The
// lamp housings stand out of the front, the red tubular pilot under each end, the
// main reservoirs between the bogies, an automatic coupler on the centre line.
//
// 20.368 m over the couplers, 19.4 m over the frame, 3.106 m wide (the body drawn
// 3.0 m, its rim 3.08 m, so the handrails stay in the UIC gauge), the roof 4.14 m above
// the rail, 1.25 m wheels, three-axle bogies 10.9 m apart
// of 4.6 m wheelbase (docs/models/china-locos.md).

import type { MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import { boxLocoLod, buildBoxLoco, type BogieSpec, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, sweepZ } from "./czElectricKit.ts";
import { block, plate, side } from "./vehicleParts.ts";

/**
 * The running number: the China Railway Museum's SS1 008, the photographs' unit in this
 * livery, whose plates read "Shaoshan 1 008" (the class in characters); the kit's
 * lettering draws digits only.
 */
export const SS1_NUMBER = "1008";
/** Half the length over the couplers. */
export const SS1_HALF = 20.368 / 2;

/** The body: the nose's centre line at the stripes, the half width, the skirt's foot. */
const N = 9.85;
const W = 1.5;
const Y0 = 0.82;
/** The paint: the lower stripe, the waist stripe, the eave with the roof's rim. */
const LOW = [1.36, 1.46] as const;
const WAIST = [2.45, 2.57] as const;
const EAVE = 3.66;
const RIM = 0.04;
const TOP = 4.14;
const BOGIE_X = 5.45;
const PANTO_X = 4.75;

const TIP = [
  [Y0, N - 0.22], [1.0, N - 0.07], [1.2, N], [WAIST[1], N], [2.8, N - 0.04], [3.62, N - 0.2], [EAVE, N - 0.21],
  [EAVE + 0.01, N - 0.21 + RIM], [EAVE + 0.07, N - 0.21 + RIM], [EAVE + 0.08, N - 0.26], [3.9, N - 0.36], [4.04, N - 0.58], [TOP, N - 0.88],
] as const;
const HW = [
  [Y0, W - 0.1], [1.0, W - 0.03], [1.2, W], [EAVE, W], [EAVE + 0.01, W + RIM], [EAVE + 0.07, W + RIM], [EAVE + 0.08, W - 0.02],
  [3.9, W - 0.15], [4.04, W - 0.42], [TOP, W - 0.8],
] as const;
/** The distant model's profiles: the same outline without the rim. */
const TIP_LOD = [[Y0, N - 0.22], [1.2, N], [WAIST[1], N], [EAVE, N - 0.21], [4.0, N - 0.5], [TOP, N - 0.88]] as const;
const HW_LOD = [[Y0, W - 0.1], [1.2, W], [EAVE, W], [4.0, W - 0.35], [TOP, W - 0.8]] as const;
/** The face is bowed a little and its corners round well back into the sides. */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.45, 0.03], [w * 0.7, 0.09], [w * 0.86, 0.19], [w * 0.96, 0.32], [w, 0.42]] as const;

/** The machine room's louvre columns, front to back: "g" two tiers of louvres, "w" a louvre over a window. */
const COLUMNS = "wgggwwwwgggw";
const ROOM = 6.85;

function machineRoom(): SideItem[] {
  const items: SideItem[] = [];
  const pitch = (2 * ROOM) / COLUMNS.length;
  [...COLUMNS].forEach((kind, i) => {
    const x1 = ROOM - i * pitch - 0.06, x0 = ROOM - (i + 1) * pitch + 0.06;
    items.push({ kind: "grille", name: `louvre ${i + 1} upper`, x: [x0, x1], y: [3.12, 3.56], slats: "h", pitch: 0.075, mat: "light" });
    items.push(kind === "g"
      ? { kind: "grille", name: `louvre ${i + 1} lower`, x: [x0, x1], y: [2.66, 3.06], slats: "h", pitch: 0.075, mat: "light" }
      : { kind: "window", name: `window ${i + 1}`, x: [x0 + 0.08, x1 - 0.08], y: [2.68, 3.04], mat: "rubber", r: 0.06 });
  });
  return items;
}

/** The vee on the front: its two arms and the light green inside it, with the emblem. */
function vee(): EndItem[] {
  const zc = W + 0.01, top = WAIST[1], foot = WAIST[0], point = 1.72, band = WAIST[1] - WAIST[0];
  const arm = (s: number): Ring => (s > 0
    ? [[0, point], [zc, foot], [zc, top], [0, point + band]]
    : [[-zc, foot], [0, point], [0, point + band], [-zc, top]]);
  const disc = (r: number, n = 20) => ngon(n, r, 0, 0, 2.32);
  return [
    { kind: "paint", name: "vee inside", z: [-zc, zc], y: [point + band, top], poly: [[-zc, top], [0, point + band], [zc, top]], mat: "light" },
    { kind: "paint", name: "vee left", z: [-zc, 0], y: [foot, top], poly: arm(-1), mat: "yellow", layer: 1 },
    { kind: "paint", name: "vee right", z: [0, zc], y: [foot, top], poly: arm(1), mat: "yellow", layer: 1 },
    { kind: "paint", name: "emblem ring", z: [-0.28, 0.28], y: [2.04, 2.6], poly: disc(0.28), mat: "white", layer: 1 },
    { kind: "paint", name: "emblem", z: [-0.245, 0.245], y: [2.075, 2.565], poly: disc(0.245), mat: "emblem", layer: 2 },
    // the CR mark: the rail's head over its web, in white
    { kind: "paint", name: "emblem rail head", z: [-0.13, 0.13], y: [2.39, 2.45], mat: "white", layer: 3 },
    { kind: "paint", name: "emblem rail web", z: [-0.03, 0.03], y: [2.17, 2.4], mat: "white", layer: 3 },
    { kind: "paint", name: "emblem rail foot", z: [-0.1, 0.1], y: [2.15, 2.2], mat: "white", layer: 3 },
  ];
}

/** The two three-axle bogies: 2.3 m between the axles, 1.25 m wheels. */
const BOGIES: BogieSpec[] = [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-2.3, 0, 2.3], wheelR: 0.625, frameTop: 0.9 }));

export function ss1Spec(full = true): LocoSpec {
  const bands = [[Y0, LOW[0], "dark"], [LOW[0], LOW[1], "yellow"], [LOW[1], WAIST[0], "dark"], [WAIST[0], WAIST[1], "yellow"], [WAIST[1], EAVE + 0.005, "light"], [EAVE + 0.005, 4.4, "roof"]] as const;
  // on the front the waist stripe gives way to the vee: dark up to the waist's top, light above
  const end = [[Y0, LOW[0], "dark"], [LOW[0], LOW[1], "yellow"], [LOW[1], WAIST[1], "dark"], [WAIST[1], EAVE + 0.005, "light"], [EAVE + 0.005, 4.4, "roof"]] as const;
  return {
    palette: {
      dark: c("#1f4a36", 0.55),
      light: c("#8fc48e", 0.55),
      yellow: c("#f0a828", 0.5),
      roof: c("#6f7273", 0.75),
      rib: c("#1a4030", 0.55),
      plate: c("#8c2a2e", 0.5),
      emblem: c("#a82a30", 0.45),
      red: c("#a8282e", 0.5),
      box: c("#4a4d50", 0.7),
      // the machine room's louvres: the body's light green, shadowed between the slats
      louvre: c("#557f5a", 0.6),
      boxLouvre: c("#6a6e72", 0.6),
      frame: c("#2a2c2e", 0.75),
      white: c("#efefea"),
    },
    y0: Y0,
    tip: full ? TIP : TIP_LOD,
    hw: full ? HW : HW_LOD,
    endPlan,
    corner: "end",
    // the distant model keeps the waist stripe and leaves out the lower one
    side: full ? bands : [[Y0, WAIST[0], "dark"], [WAIST[0], WAIST[1], "yellow"], [WAIST[1], EAVE, "light"], [EAVE, 4.4, "roof"]],
    end: full ? end : [[Y0, WAIST[1], "dark"], [WAIST[1], EAVE, "light"], [EAVE, 4.4, "roof"]],
    roof: "roof",
    buffers: SS1_HALF,
    beam: N - 0.1,
    centreCoupler: 0.88,
    frame: { y0: 0.66, y1: Y0, half: N - 0.3, hw: W - 0.2, mat: "frame" },
    // the full model draws its own bogies (ss1Bogie); the distant model takes the kit's blocks
    bogies: full ? [] : BOGIES,
    pantograph: { kind: "singleArm", x: PANTO_X, roofY: TOP, baseY: TOP + 0.3 },
    hvLine: { x: 1.2, y: TOP + 0.42, z: 0 },
    sideItems: [
      { kind: "window", name: "corner window", x: [8.85, 9.18], y: [2.8, 3.58], mat: "rubber", mirror: true, r: 0.08 },
      { kind: "window", name: "cab window", x: [8.0, 8.66], y: [2.74, 3.5], mat: "rubber", mirror: true, r: 0.06, bar: 3.12 },
      { kind: "door", name: "cab door", x: [7.0, 7.6], y: [1.62, 3.46], rails: true, mirror: true },
      { kind: "panel", name: "step recess", x: [7.08, 7.52], y: [1.06, 1.3], mat: "black", mirror: true },
      ...machineRoom(),
      { kind: "ribs", name: "ribs", x: [-ROOM, ROOM], y: [1.82, 2.2], pitch: 0.3, mat: "rib" },
      { kind: "plate", name: "number", x: [7.72, 8.62], y: [2.12, 2.34], mirror: true },
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [-1.2, -0.07], y: [2.84, 3.6], wiper: true },
      { kind: "window", name: "windscreen right", z: [0.07, 1.2], y: [2.84, 3.6], wiper: true },
      ...vee(),
      { kind: "plate", name: "number", z: [-1.28, -0.42], y: [1.3, 1.52] },
    ],
    // the full model draws the resistor housings with their sloped ends (resistorHousings)
    roofItems: [
      ...(full ? [] : [
        { name: "rear resistor housing", x: [-8.0, -6.0] as const, w: [0.92, 0.92] as const, y: [TOP - 0.15, 4.4] as const, mat: "box" },
        { name: "front resistor housing", x: [6.0, 8.0] as const, w: [0.92, 0.92] as const, y: [TOP - 0.15, 4.4] as const, mat: "box" },
      ]),
      { name: "main breaker", x: [-0.45, 0.45], w: [0.3, 0.24], y: [TOP - 0.02, TOP + 0.2], mat: "box" },
    ],
    underItems: [[-2.3, 2.3, 0.42, 0.66, 0.8]],
    number: SS1_NUMBER,
  };
}

/** The end's face x at height y and |z|, on end e. */
function faceX(e: number, y: number, z: number): number {
  const plan = endPlan(y, lerpTable(HW, y));
  return e * (lerpTable(TIP, y) - lerpTable(plan.map(([pz, b]) => [pz, b] as const), Math.abs(z)));
}

/** The lamp housings on the front: a box standing out of the face, the headlight outboard and the tail lamp inboard. */
function lamps(m: MeshBuilder, e: number): void {
  const [y0, y1] = [1.78, 2.1];
  const [z0, z1] = [0.78, 1.34];
  for (const s of [-1, 1])
    m.scope(s > 0 ? "lamp housing right" : "lamp housing left", () => {
      const zs = (a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a]);
      const back = faceX(e, y0, z1) - e * 0.02;
      const front = faceX(e, y0, z0) + e * 0.13;
      block(m, "dark", Math.min(back, front), Math.max(back, front), y0, y1, ...zs(z0, z1));
      // the bright bezel round the two lenses
      const face = front + e * 0.012;
      block(m, "rim", Math.min(front, face), Math.max(front, face), y0 + 0.02, y1 - 0.02, ...zs(z0 + 0.03, z1 - 0.03));
      for (const [z, mat] of [[1.17, "lampHead"], [0.94, "lampRed"]] as const) {
        const glass = ngon(10, 0.095, 0, s * z, (y0 + y1) / 2);
        m.sweep(mat, "x", glass, face, glass, face + e * 0.012);
      }
    });
}

/** The headlight on the front of the cab roof: a drum on a short pedestal, its lens facing ahead. */
function headlight(m: MeshBuilder, e: number): void {
  m.scope("roof headlight", () => {
    const y = 4.1, x0 = e * (N - 0.95), x1 = e * (N - 0.5);
    block(m, "roof", Math.min(x0, x1) + 0.06, Math.max(x0, x1) - 0.06, TOP - 0.06, y - 0.1, -0.1, 0.1);
    const drum = ngon(14, 0.2, 0, 0, y);
    m.sweep("box", "x", drum, x0, drum, x1);
    const lens = ngon(14, 0.16, 0, 0, y);
    m.sweep("lampHead", "x", lens, x1, lens, x1 + e * 0.02);
  });
}

/** The red handrails on the face under the windscreens. */
function faceRails(m: MeshBuilder, e: number): void {
  m.scope("face handrails", () => {
    const y = 2.68;
    for (const s of [-1, 1]) {
      const [za, zb] = [0.3, 1.05];
      const xa = faceX(e, y, za) + e * 0.06, xb = faceX(e, y, zb) + e * 0.06;
      m.rod("red", [xa, y, s * za], [xb, y, s * zb], 0.018, 6);
      for (const [z, x] of [[za, xa], [zb, xb]] as const) m.rod("red", [x - e * 0.07, y, s * z], [x, y, s * z], 0.015, 6, false);
    }
  });
}

/**
 * The tubular pilot under the end (SS1 008): three bent red tubes hung from the body's foot, the top
 * one just under it, round from the frame's corner to the centre line, on a deep red bottom plate;
 * posts at the corner, the bend and near the middle run from the plate up into the frame.
 */
export const SS1_PILOT = { tubes: [0.38, 0.55, 0.72], plate: [0.1, 0.3] as const, postTop: Y0 + 0.04 };
function pilot(m: MeshBuilder, e: number): void {
  m.scope("pilot", () => {
    // the plan of a tube: [x, |z|] from the frame's corner round to the centre line
    const plan = [[N - 0.45, 1.3], [N - 0.1, 1.24], [N + 0.12, 0.95], [N + 0.24, 0.45], [N + 0.27, 0]] as const;
    const P = SS1_PILOT;
    for (const [i, y] of P.tubes.entries()) {
      // the lower tubes stand a little further out, as the bent pilot leans forward to its plate
      const k = 0.02 * (P.tubes.length - 1 - i);
      for (const s of [-1, 1])
        for (let j = 1; j < plan.length; j++) {
          const [a, b] = [plan[j - 1]!, plan[j]!];
          m.rod("red", [e * (a[0] + k), y, s * a[1]], [e * (b[0] + k), y, s * b[1]], 0.03, 6, j === 1);
        }
    }
    // the bottom plate: a deep flat bar under the tubes' plan, standing a little ahead of them
    const ring: Ring = [...plan.map(([x, z]) => [x + 0.06, -z] as [number, number]), ...[...plan].reverse().slice(1).map(([x, z]) => [x + 0.06, z] as [number, number])]
      .map(([x, z]) => [e * x, e * z] as [number, number]);
    m.prism("red", ring, P.plate[0], P.plate[1]);
    // the posts from the plate up through the tubes into the frame (whose foot is the body's, 0.82 m)
    for (const s of [-1, 1]) for (const [x, z] of [plan[0]!, plan[2]!, plan[3]!]) m.rod("red", [e * (x + 0.02), P.plate[1], s * z], [e * (x + 0.02), P.postTop, s * z], 0.03, 6, false);
  });
}

/** The roof walkway's railings between the resistor housings. */
function railings(m: MeshBuilder): void {
  m.scope("roof railings", () => {
    const z = 1.0, y0 = 4.0, y1 = 4.36, x = 5.95;
    for (const s of [-1, 1]) {
      m.rod("steel", [-x, y1, s * z], [x, y1, s * z], 0.02, 6);
      for (let i = 0; i <= 8; i++) {
        const px = -x + (2 * x * i) / 8;
        m.rod("steel", [px, y0, s * z], [px, y1, s * z], 0.018, 6, false);
      }
    }
  });
}

/** The braking-resistor housing behind each cab: [x, y] from the cab end, tall at the cab and sloping down toward the middle. */
const HOUSING = { x: [6.0, 8.0] as const, slope: 6.9, y0: TOP - 0.15, low: 4.12, top: 4.5, w: 0.92 };

/**
 * The braking-resistor housings: a box behind each cab whose inner end slopes down
 * toward the roof's middle, louvres along that slope and along its sides.
 */
function resistorHousings(m: MeshBuilder): void {
  const H = HOUSING;
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front resistor housing" : "rear resistor housing", () => {
      // the side profile in (x, y), convex, swept across the roof
      const prof: Ring = [[H.x[0], H.y0], [H.x[1], H.y0], [H.x[1], H.top], [H.slope, H.top], [H.x[0], H.low]];
      const ring: Ring = (e > 0 ? prof : [...prof].reverse().map(([x, y]) => [-x, y] as [number, number]));
      m.sweep("box", "z", ring, -H.w, ring, H.w);
      m.scope("louvres", () => {
        // slats across the slope, standing just proud of it
        const [dx, dy] = [H.slope - H.x[0], H.top - H.low];
        const len = Math.hypot(dx, dy), [nx, ny] = [-dy / len, dx / len];
        for (let t = 0.12; t < 0.95; t += 0.14) {
          const [x, y] = [H.x[0] + dx * t - nx * 0.005, H.low + dy * t - ny * 0.005];
          const q: Ring = [[x, y], [x + dx * 0.06, y + dy * 0.06], [x + dx * 0.06 + nx * 0.03, y + dy * 0.06 + ny * 0.03], [x + nx * 0.03, y + ny * 0.03]]
            .map(([a, b]) => [e * a, b] as [number, number]);
          const qq = e > 0 ? q : [...q].reverse();
          m.sweep("boxLouvre", "z", qq, -H.w + 0.06, qq, H.w - 0.06);
        }
        for (const s of [-1, 1])
          for (let y = H.y0 + 0.2; y < H.top - 0.06; y += 0.08)
            block(m, "boxLouvre", e > 0 ? H.slope + 0.1 : -H.x[1] + 0.1, e > 0 ? H.x[1] - 0.1 : -H.slope - 0.1, y, y + 0.035, ...side(s, H.w - 0.005, H.w + 0.02));
      });
    });
}

/** The main reservoirs between the bogies, one along each side. */
function reservoirs(m: MeshBuilder): void {
  m.scope("main reservoirs", () => {
    for (const s of [-1, 1]) {
      const q = ngon(12, 0.2, 0, s * 1.0, 0.5);
      m.sweep("underframe", "x", q, -2.0, q, 2.0);
    }
  });
}

/**
 * A three-axle bogie as far as it shows under the skirt: the wheels and axles, the
 * axle boxes with their springs, the side frames dipping between the wheels, the
 * transoms and the bolster springs. Lighter than the kit's `bogie3`, whose motors and
 * coils the skirt would hide.
 */
function ss1Bogie(m: MeshBuilder, b: BogieSpec): void {
  m.bogie(() => {
    const { xc, wheelR: R, frameTop: ft } = b;
    const ay = R * Math.cos(Math.PI / 16);
    for (const dx of b.axles)
      m.scope("wheelset", () => {
        const x = xc + dx;
        m.sweep("steel", "z", ngon(6, 0.08, 0, x, ay), -0.84, ngon(6, 0.08, 0, x, ay), 0.84);
        for (const s of [-1, 1]) {
          sweepZ(m, "wheel", ngon(16, R, Math.PI / 16, x, ay), side(s, 0.665, 0.8));
          sweepZ(m, "bogie", ngon(10, R * 0.72, 0, x, ay), side(s, 0.8, 0.815));
          m.scope("axle box", () => block(m, "bogie", x - 0.17, x + 0.17, ay - 0.15, ay + 0.15, ...side(s, 0.84, 1.06)));
          m.scope("primary suspension", () => {
            for (const d of [-0.26, 0.26]) m.prism("spring", ngon(6, 0.075, 0, x + d, s * 0.96), ay - 0.05, ft - 0.15);
          });
        }
      });
    m.scope("frame", () => {
      const xs = [...b.axles].sort((p, q) => p - q);
      const L = xs[xs.length - 1]! + 0.6, F = -xs[0]! + 0.6;
      for (const s of [-1, 1]) {
        const top: Ring = [[-F, ft]], bottom: Ring = [[-F, ft - 0.18]];
        for (let i = 0; i + 1 < xs.length; i++) {
          const [p, q] = [xs[i]!, xs[i + 1]!];
          top.push([p + 0.35, ft], [p + 0.6, ft - 0.1], [q - 0.6, ft - 0.1], [q - 0.35, ft]);
          bottom.push([p + 0.3, ft - 0.18], [p + 0.55, ay - 0.12], [q - 0.55, ay - 0.12], [q - 0.3, ft - 0.18]);
        }
        top.push([L, ft]);
        bottom.push([L, ft - 0.18]);
        plate(m, "bogie", top.map(([u, v]) => [xc + u, v]), bottom.map(([u, v]) => [xc + u, v]), ...side(s, 0.9, 1.08));
      }
      for (const x of [xc - F + 0.06, xc + L - 0.06, ...xs.slice(1).map((q, i) => xc + (q + xs[i]!) / 2)]) block(m, "bogie", x - 0.07, x + 0.07, ft - 0.2, ft - 0.04, -0.9, 0.9);
    });
    m.scope("secondary suspension", () => {
      for (const s of [-1, 1]) {
        for (const d of [-0.55, 0.55]) m.prism("spring", ngon(8, 0.1, 0, xc + d, s * 1.17), ft - 0.42, ft + 0.02);
        block(m, "bogie", xc - 0.8, xc + 0.8, ft - 0.52, ft - 0.42, ...side(s, 1.0, 1.3));
      }
    });
  });
}

/** The SS1 in the green and yellow livery. */
export function crSs1(): MeshBuilder {
  const m = buildBoxLoco(ss1Spec());
  m.scope("bogies", () => {
    for (const b of BOGIES) m.scope(b.xc > 0 ? "front bogie" : "rear bogie", () => ss1Bogie(m, b));
  });
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => {
      lamps(m, e);
      headlight(m, e);
      faceRails(m, e);
      m.scope("lower end", () => pilot(m, e));
    });
  m.scope("roof equipment", () => { railings(m); resistorHousings(m); });
  m.scope("body", () => m.scope("equipment", () => reservoirs(m)));
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function crSs1Lod(): MeshBuilder {
  return boxLocoLod(ss1Spec(false));
}
