// The OBB 2043 (proc-vehicle-obb-2043), the Jenbacher B'B' diesel-hydraulic of 1964-1977
// (Jenbach DH 1500; 77 built, the series 2043.05 - 77 one metre longer than the four of the
// pre-series), on the box locomotive kit (boxLocoKit.ts) with its own profile, measured on
// the reference photographs (assets/obb-2043/SOURCES.md; docs/models/austria-trains.md):
//
// - the cab front: upright and flat below the line under the windscreens, the windscreen
//   panel leaning back above it, the roof edge rounded down to it, the corners rounded in
//   plan; the two windscreens side by side, the round headlights with the tail lamps over
//   them low on the face, the top headlight between two small lamps in a housing on the
//   roof edge;
// - the section: upright walls 3.0 m wide up to the line under the windows, leaning in a
//   little above it, the roof's rounded shoulders;
// - the side, the same on both sides: the cab side window and the door with its narrow
//   window at each end, the machine room's row of ten windows from the "1" end's door
//   toward the "2" end, the radiator grille and the red louvre under the row's start;
// - the exhaust stack on the roof behind the "2" end's cab, the engine room hatch;
// - the bogies 8.0 m apart (2.5 m wheelbase, 950 mm wheels), the fuel tank between them;
// - two liveries: blood orange with the ivory lines and the ivory roof (2043 005-4, the
//   "Pflatsch" emblem), and traffic red with the light grey band and the dark grey cab cap
//   (2043 043-5).

import { ngon, type MeshBuilder, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onEnd, onSide, type ShellSpec } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, tubeX, type Band } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** The length over the buffers (15.76 m, the series 2043.05 - 77) and half of it. */
export const OBB2043_LENGTH = 15.76;
const HALF = OBB2043_LENGTH / 2;
/** The cab front's |x| (the body 14.5 m long, the buffers 0.63 m). */
const N = 7.25;
/** The body's bottom (the frame's lower edge), the half width (3.0 m). */
const Y0 = 0.8;
const W = 1.5;
/** The line under the windows, all the way round (the face leans back above it). */
const LINE: readonly [number, number] = [2.74, 2.8];
/** The lower ivory line / the light grey band (from the frame's top). */
const LOW = 1.36;
const BAND_TOP = 1.8;
/** The eave (the walls' top) and the crown. */
const EAVE = 3.66;
const CROWN = 4.08;
/** The windscreens' sill and head. */
const SCREEN: readonly [number, number] = [2.84, 3.5];
/** The traffic red's red line at the top of the cab cap. */
const CAP_LINE: readonly [number, number] = [3.57, 3.64];

/** The front's centre line [y, |x|], bottom first: upright to the line, leaning back above it, the roof edge rounded. */
const TIP: Table = [
  [Y0, N], [LINE[1], N], [EAVE, N - 0.17],
  [3.8, N - 0.25], [3.92, N - 0.36], [4.0, N - 0.5], [4.05, N - 0.66], [CROWN, N - 0.84],
];
/** The half width [y, hw]: upright to the line, a little tumblehome above, the roof's round shoulder. */
const HW: Table = [[Y0, W], [LINE[1], W], [EAVE, W - 0.1], [3.8, W - 0.16], [3.92, W - 0.25], [4.0, W - 0.42], [4.05, W - 0.6], [CROWN, W - 0.8]];

/** The front's plan at height y and half width w: flat across, the corners rounded (wider above the line). */
function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = y <= LINE[1] + 0.01 ? 0.26 : 0.26 + 0.16 * Math.min(1, (y - LINE[1]) / (EAVE - LINE[1]));
  const f = w - r;
  const out: Array<readonly [number, number]> = [[0, 0], [f * 0.5, 0.004], [f, 0.012]];
  for (const a of [22.5, 45, 67.5, 90]) {
    const t = (a * Math.PI) / 180;
    out.push([f + r * Math.sin(t), 0.012 + r * (1 - Math.cos(t))]);
  }
  return out;
}

/** Where the side wall ends at height y (the corner's back edge). */
const wallEnd = (y: number) => lerpTable(TIP, y) - 0.05 - (y <= LINE[1] + 0.01 ? 0.26 : 0.42);

// --- liveries ----------------------------------------------------------------------

interface Livery2043 {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  /** The emblems' and the numbers' material. */
  ink: string;
  number: string;
  sidePaint: readonly SideItem[];
}

/** The Pflatsch: two slanted strokes and the diagonal between them, about (cu, cy), s its scale. */
function pflatsch(cu: number, cy: number, s: number): Ring[] {
  const p = (pts: Array<[number, number]>): Ring => pts.map(([u, v]) => [cu + u * s, cy + v * s] as [number, number]);
  return [
    p([[-0.05, 0.08], [0.3, 0.08], [0.36, 0.22], [0.01, 0.22]]),
    p([[-0.36, -0.22], [0.01, -0.22], [0.07, -0.08], [-0.3, -0.08]]),
    p([[-0.06, -0.09], [0.08, -0.09], [0.1, 0.09], [-0.04, 0.09]]),
  ];
}

/** The cab cap's sweep onto the side, from behind the door to the corner (front half; mirrored). */
const capSweep = (y0: number, y1: number): Ring => [[5.08, y0], [wallEnd(y0), y0], [wallEnd(y1), y1], [5.08, y1]];

const FRAME = c("#2d2f31", 0.75);

const LIVERIES: Record<string, Livery2043> = {
  // 2043 005-4 (Koetschach-Mauthen): blood orange, the ivory lines at the frame and under the windows, the ivory roof
  bloodOrange: {
    title: "Blood orange",
    palette: { body: c("#de5a2e"), ivory: c("#ebe2c4", 0.55), roof: c("#ddd4b6", 0.7), frameGrey: FRAME, hatch: c("#d3caac", 0.75), mirror: c("#de5a2e"), lampHousing: c("#de5a2e"), pod: c("#de5a2e") },
    side: [[Y0, LOW, "frameGrey"], [LOW, LOW + 0.06, "ivory"], [LOW + 0.06, LINE[0], "body"], [LINE[0], LINE[1], "ivory"], [LINE[1], EAVE, "body"], [EAVE, 4.2, "roof"]],
    end: [[Y0, LOW, "frameGrey"], [LOW, LOW + 0.06, "ivory"], [LOW + 0.06, LINE[0], "body"], [LINE[0], LINE[1], "ivory"], [LINE[1], EAVE, "body"], [EAVE, 4.2, "roof"]],
    ink: "ivory",
    number: "2043 005-4",
    sidePaint: [],
  },
  // 2043 043-5 (Wels): traffic red, the light grey band at the lamps, the dark grey cab cap with the red line over it
  trafficRed: {
    title: "Traffic red",
    palette: { body: c("#d42a24"), light: c("#cfd0cb", 0.55), cap: c("#62666a", 0.6), roof: c("#6a6e71", 0.75), frameGrey: c("#45484b", 0.75), hatch: c("#5d6063", 0.8), mirror: c("#d42a24"), lampHousing: c("#62666a", 0.6), pod: c("#cfd0cb", 0.55) },
    side: [[Y0, LOW, "frameGrey"], [LOW, BAND_TOP, "light"], [BAND_TOP, EAVE, "body"], [EAVE, 4.2, "roof"]],
    end: [[Y0, LOW, "frameGrey"], [LOW, BAND_TOP, "light"], [BAND_TOP, LINE[0], "body"], [LINE[0], CAP_LINE[0], "cap"], [CAP_LINE[0], CAP_LINE[1], "body"], [CAP_LINE[1], 4.2, "roof"]],
    ink: "white",
    number: "2043 043-5",
    sidePaint: [
      { kind: "paint", name: "cab cap", x: [5.08, wallEnd(LINE[0])], y: [LINE[0], CAP_LINE[0]], poly: capSweep(LINE[0], CAP_LINE[0]), mat: "cap", mirror: true },
    ],
  },
};

export const OBB2043_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery2043 => LIVERIES[resolveParams(OBB2043_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The machine room's ten windows, 0.945 m apart, from the "2" end's grilles to the "1" end's door. */
const PITCH = 0.945;
const ROW_START = -4.34;
const OPENING_W = 0.86;
const ROW_Y: readonly [number, number] = [2.83, 3.61];
/** The side emblem's centre: on the cab side under the cab window, at both ends. */
const SIDE_EMBLEM: readonly [number, number] = [6.3, 2.3];

function openings(): SideItem[] {
  const out: SideItem[] = [];
  for (let k = 0; k < 10; k++) {
    const x = ROW_START + k * PITCH;
    out.push({ kind: "window", name: `room window ${k + 1}`, x: [x, x + OPENING_W], y: ROW_Y, mat: "frameLight", r: 0.08 });
  }
  return out;
}

function spec(l: Livery2043): LocoSpec {
  const ink = l.ink;
  const sideEmblem: SideItem[] = [-1, 1].flatMap((e) => pflatsch(e * SIDE_EMBLEM[0], SIDE_EMBLEM[1], 0.62).map((poly, i): SideItem => ({
    kind: "paint", name: `emblem ${e > 0 ? "front" : "rear"} ${i + 1}`, x: [Math.min(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[0]))],
    y: [Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[1]))], poly, mat: ink, layer: 1 + (i === 2 ? 1 : 0),
  })));
  const frontEmblem = pflatsch(0, 2.24, 0.88).map((poly, i): EndItem => ({
    kind: "paint", name: `emblem ${i + 1}`, z: [Math.min(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[0]))],
    y: [Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[1]))], poly, mat: ink, layer: 1 + (i === 2 ? 1 : 0),
  }));
  return {
    palette: {
      rim: c("#2c2e31", 0.6), louvre: c("#26282b", 0.85), slat: c("#3b3e42", 0.7), beam: c("#26272a", 0.75),
      bogie: c("#2a2b2d", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      underframe: c("#2a2b2d", 0.8), white: c("#f2f2ee", 0.5), exhaust: c("#3a3a3a", 0.85), louvreRed: c("#b8401f", 0.7), frameLight: c("#c8cbcd", 0.45),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: "roof",
    buffers: HALF,
    beam: N,
    bufferY: 1.06,
    frame: { y0: Y0 - 0.02, y1: Y0 + 0.02, half: N - 0.1, hw: W - 0.1, mat: "frameGrey" },
    bogies: [-4.0, 4.0].map((xc) => ({ xc, axles: [-1.25, 1.25], wheelR: 0.475, frameTop: 0.74 })),
    sideItems: [
      ...l.sidePaint,
      { kind: "window", name: "cab window", x: [5.98, 6.52], y: [2.84, 3.6], mat: "rim", r: 0.08, mirror: true },
      { kind: "door", name: "door", x: [5.19, 5.85], y: [LOW + 0.08, 3.64], win: [2.84, 3.58], rails: true, mirror: true },
      ...openings(),
      // under the row's start at the "2" end: the radiator grille and the red louvre beside it
      { kind: "grille", name: "radiator grille", x: [-4.34, -3.27], y: [1.72, 2.42], mat: "slat", slats: "v", pitch: 0.06, r: 0.04 },
      { kind: "grille", name: "louvre", x: [-3.21, -2.31], y: [1.72, 2.33], mat: "louvreRed", slats: "h", pitch: 0.06, r: 0.02 },
      ...sideEmblem,
    ],
    endItems: [
      ...frontEmblem,
      { kind: "window", name: "windscreen left", z: [0.13, 1.1], y: SCREEN, mat: "rim", wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.1, -0.13], y: SCREEN, mat: "rim", wiper: true },
      { kind: "grille", name: "horn grille", z: [-0.06, 0.06], y: [1.42, 1.72], mat: "slat" },
    ],
    roofItems: [
      // the engine room hatch over the engine, a small hatch at the "2" end, the fan cover at the "1" end
      { name: "engine room hatch", x: [-3.1, 0.15], w: [0.85, 0.8], y: [CROWN - 0.02, CROWN + 0.12], mat: "hatch" },
      { name: "small hatch", x: [-4.35, -3.95], w: [0.5, 0.45], y: [CROWN - 0.02, CROWN + 0.08], mat: "hatch" },
      { name: "fan cover", x: [1.95, 2.65], w: [0.42, 0.38], y: [CROWN - 0.02, CROWN + 0.08], mat: "hatch" },
    ],
    // the fuel tank and the battery boxes between the bogies
    underItems: [[-2.15, 2.15, 0.42, Y0, 1.2], [-2.6, -2.15, 0.5, Y0, 1.1]],
    plough: "frameGrey",
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** The running numbers: on the front under the emblem and on each side amidships. */
function numbers(m: MeshBuilder, sp: ShellSpec, l: Livery2043): void {
  const style = { weight: 0.16, width: 0.55 };
  m.scope("numbers", () => {
    const fh = 0.11, fw = wordWidth(l.number, fh, style);
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      // seen from ahead +z is on the reader's left: at the front the text reads toward -z
      const tris = letters(l.number, e > 0 ? fw / 2 : -fw / 2, 1.9 - fh / 2, fh, e > 0, style);
      m.scope(e > 0 ? "front" : "rear", () => m.facets(l.ink, tris.map(([u, v]) => at(u, v, 0.008)), [e, 0, 0]));
    }
    const sh = 0.1, sw = wordWidth(l.number, sh, style);
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      // centred at x = 0.85; on the right side (+z) the reader's right is +x
      const tris = letters(l.number, sd > 0 ? 0.85 - sw / 2 : -(0.85 + sw / 2), 1.8, sh, sd < 0, style);
      m.scope(sd > 0 ? "right" : "left", () => m.facets(l.ink, tris.map(([u, v]) => at(u, v, 0.008)), [0, 0, sd]));
    }
  });
}

/** The top headlight between two small lamps, in a housing on the roof edge over the windscreens. */
function topLamps(m: MeshBuilder): void {
  const yc = 3.93;
  m.scope("top lamps", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x1 = N - 0.15, x0 = x1 - 0.6;
        const q: Ring = [[-0.44, 3.72], [0.44, 3.72], [0.44, 4.08], [0.38, 4.15], [-0.38, 4.15], [-0.44, 4.08]];
        m.sweep("lampHousing", "x", q, e * (e > 0 ? x0 : x1), q, e * (e > 0 ? x1 : x0));
        for (const [z, r, mat] of [[0, 0.11, "lampHead"], [0.27, 0.07, "lampHead"], [-0.27, 0.07, "lampRed"]] as const) {
          tubeX(m, "rim", r + 0.025, e * (x1 - 0.01), yc, z, e * (x1 + 0.02), yc, z, 12);
          tubeX(m, mat, r, e * (x1 + 0.02), yc, z, e * (x1 + 0.03), yc, z, 12);
        }
      });
  });
}

/** The lamp housings standing off the face: the headlight with the tail lamp over it, at each corner. */
function lampPods(m: MeshBuilder): void {
  // a stadium in (z, y): round at the headlight below and at the tail lamp above
  const pod = (z: number): Ring => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= 6; i++) { const a = Math.PI + (i * Math.PI) / 6; out.push([z + 0.15 * Math.cos(a), 1.55 + 0.15 * Math.sin(a)]); }
    for (let i = 0; i <= 6; i++) { const a = (i * Math.PI) / 6; out.push([z + 0.1 * Math.cos(a), 1.85 + 0.1 * Math.sin(a)]); }
    return out;
  };
  m.scope("lamp pods", () => {
    for (const e of [-1, 1])
      for (const z of [-0.86, 0.86])
        m.scope(`${e > 0 ? "front" : "rear"} ${z > 0 ? "right" : "left"}`, () => {
          const q = pod(z);
          const out = (d: number) => e * (N + d);
          m.sweep("pod", "x", q, Math.min(out(-0.02), out(0.06)), q, Math.max(out(-0.02), out(0.06)));
          for (const [y, r, mat] of [[1.55, 0.1, "lampHead"], [1.85, 0.055, "lampRed"]] as const) {
            tubeX(m, "rim", r + 0.02, out(0.055), y, z, out(0.07), y, z, 12);
            tubeX(m, mat, r, out(0.07), y, z, out(0.078), y, z, 12);
          }
        });
  });
}

/** The grab rail across the front over the line, in the body colour. */
function grabRails(m: MeshBuilder): void {
  const y = 2.62, x = N + 0.06;
  m.scope("grab rails", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        m.rod("mirror", [e * x, y, -1.2], [e * x, y, 1.2], 0.016, 6);
        for (const z of [-1.15, 1.15]) m.rod("mirror", [e * (x - 0.08), y, z], [e * x, y, z], 0.012, 6);
        // the upright handrails at the face's corners
        for (const z of [-1.32, 1.32]) {
          m.rod("steel", [e * x, 1.5, z], [e * x, 2.6, z], 0.016, 6);
          for (const hy of [1.5, 2.6]) m.rod("steel", [e * (x - 0.1), hy, z], [e * x, hy, z], 0.012, 6);
        }
      });
  });
}

/** The OBB 2043 in a livery. */
export function obb2043(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    numbers(m, sp, l);
    topLamps(m);
    lampPods(m);
    grabRails(m);
  });
  // the exhaust stack behind the "2" end's cab, off the centre line
  m.scope("roof equipment", () => {
    const [x, z, top] = [-5.55, -0.5, CROWN + 0.32];
    m.emit("smoke", [x, top, z], 0.13);
    m.scope("exhaust", () => {
      m.prism("roof", ngon(12, 0.16, 0, x, z), CROWN - 0.15, top - 0.02);
      m.prism("exhaust", ngon(12, 0.11, 0, x, z), top - 0.02, top);
    });
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function obb2043Lod(v?: ParamValues): MeshBuilder {
  const s = spec(liveryOf(v));
  const tip: Table = [[Y0, N], [LINE[1], N], [EAVE, N - 0.17], [3.95, N - 0.42], [CROWN, N - 0.84]];
  const hw: Table = [[Y0, W], [LINE[1], W], [EAVE, W - 0.1], [3.95, W - 0.33], [CROWN, W - 0.8]];
  // the machine room's ten windows as one band
  const row: SideItem = { kind: "window", name: "room windows", x: [ROW_START, ROW_START + 9 * PITCH + OPENING_W], y: ROW_Y };
  // the thin ivory lines left out (the body colour across), so the window band stays within the budget
  const thin = (bands: readonly Band[]): Band[] => bands.map(([a, b, mat]): Band => [a, b, b - a < 0.1 ? "body" : mat]);
  return boxLocoLod({ ...s, tip, hw, side: thin(s.side), end: thin(s.end), roofItems: [], underItems: [], sideItems: [row] });
}

/** The design's registry entry (generator/atLocos.ts): 70 t, 1,104 kW, 110 km/h (the series). */
export const OBB2043_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-2043", title: "OBB 2043", build: obb2043, buildLod: obb2043Lod, params: OBB2043_PARAMS,
  game: { weight: 70, power: 1104, maxspeed: 110, accel: null }, catalog: DIESEL_LOCO_CATALOG, references: "obb-2043",
};
