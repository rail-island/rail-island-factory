// The OBB 1010/1110 (proc-vehicle-obb-1110), the Simmering-Graz-Pauker Co'Co' 15 kV
// 16.7 Hz electric locomotive of 1955-1961 (the 1110 the 110 km/h mountain version,
// ten rebuilt as 1110.500 with a rheostatic brake in 1974-75), on the box locomotive
// kit (boxLocoKit.ts) with its own profile, measured on the reference photographs
// (assets/obb-1110/SOURCES.md; docs/models/austria-trains.md):
//
// - the cab front: upright below the windscreens' sill line, the windscreen band
//   leaning back a little, the roof rounding down over the cab in a dome; in plan a
//   flat face with large round corners;
// - the section: upright walls 3.09 m wide up to the eave, the round roof shoulder;
// - the side: a door behind each cab, the grille and window rows between them drawn
//   from the photographs (three grilles, two windows, grille, window, grille, read
//   from the door at +x on the right side; turned about on the left side);
// - the big round headlights in pods, the top light on the roof dome, the one red
//   tail lamp, the winged-wheel emblem and the number;
// - the Co'Co' bogies 8.6 m apart (4.1 m wheelbase, 1.3 m wheels);
// - two liveries: fir green with the aluminium lines and the scissor pantographs as
//   delivered (1110.21 in 1964), and blood orange with the cream lines as the
//   preserved 1110.505, a 1110.500 with the brake resistor boxes over the cabs and
//   single-arm pantographs.

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type LocoSpec, type RoofBox, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, numberOn, onEnd, type ShellSpec } from "./czElectricKit.ts";
import { ELECTRIC_LOCO_CATALOG, tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (17.86 m). */
const HALF = 8.93;
/** The cab front's foremost line, |x|, from the skirt to the windscreens' sill. */
const N = 8.3;
/** The body's bottom: the skirt's lower edge. */
const Y0 = 1.0;
/** The eave (the walls' top), the roof's crown. */
const EAVE = 3.81;
const CROWN = 4.2;
/** The body's half width: 3.0 m over the walls, 3.09 m over the handrails. */
const W = 1.5;
/** The windscreens' sill and head. */
const SCREEN: readonly [number, number] = [2.88, 3.62];
/** The line under the windscreens, the whole way round (the sill's ledge on the front). */
const LINE: readonly [number, number] = [2.67, 2.8];
/** The lower line at the skirt's top. */
const LOW: readonly [number, number] = [1.46, 1.51];

/** The front's centre line [y, |x|], bottom first: upright, the windscreen band leaning back, the roof dome. */
const TIP: Table = [
  [Y0, N - 0.02], [LINE[1], N], [EAVE, N - 0.13], [3.95, N - 0.24], [4.08, N - 0.4], [4.16, N - 0.56], [CROWN, N - 0.72],
];
/** The half width [y, hw]: upright walls, the round roof shoulder. */
const HW: Table = [[Y0, 1.46], [1.4, W], [EAVE, W], [3.95, 1.455], [4.08, 1.37], [4.16, 1.25], [CROWN, 1.09]];
/** The corners' radius in plan. */
const R = 0.38;

/** The front's plan at height y and half width w: a flat face bowed a little, then the round corner. */
function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const flat = w - R;
  const out: Array<readonly [number, number]> = [[0, 0], [flat * 0.55, 0.008], [flat, 0.025]];
  for (const t of [30, 55, 75, 90]) {
    const a = (t * Math.PI) / 180;
    out.push([flat + R * Math.sin(a), 0.025 + R * (1 - Math.cos(a))]);
  }
  return out;
}

// --- liveries ----------------------------------------------------------------------

interface Livery1110 {
  title: string;
  palette: Record<string, MaterialSpec>;
  number: string;
  /** The 1110.500's brake resistors and single-arm pantographs, or the scissor pantographs as built. */
  brake: boolean;
}

const LIVERIES: Record<string, Livery1110> = {
  firGreen: {
    title: "Fir green",
    palette: {
      body: c("#2b4532", 0.5), slat: c("#22382a", 0.6), line: { color: "#b9bdb7", metallic: 0.6, roughness: 0.35 }, skirt: c("#1f2321", 0.7),
      roof: { color: "#8e918e", metallic: 0.3, roughness: 0.55 }, emblem: { color: "#c9ccc6", metallic: 0.6, roughness: 0.35 },
    },
    number: "1110.21",
    brake: false,
  },
  bloodOrange: {
    title: "Blood orange",
    palette: {
      body: c("#dd3f1e", 0.5), slat: c("#b8331a", 0.6), line: c("#ecdcb4", 0.55), skirt: c("#232325", 0.7),
      roof: { color: "#b7b9b6", metallic: 0.3, roughness: 0.55 }, emblem: c("#f0ece4", 0.5),
    },
    number: "1110.505",
    brake: true,
  },
};

export const OBB1110_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery1110 => LIVERIES[resolveParams(OBB1110_PARAMS, v).livery!]!;

const SIDE: readonly Band[] = [[Y0, LOW[0], "skirt"], [LOW[0], LOW[1], "line"], [LOW[1], LINE[0], "body"], [LINE[0], LINE[1], "line"], [LINE[1], EAVE, "body"], [EAVE, 4.3, "roof"]];

// --- the side ----------------------------------------------------------------------

/** The windows' and grilles' sill and head. */
const ROW: readonly [number, number] = [2.88, 3.62];
const GRILLE_Y: readonly [number, number] = [2.88, 3.66];
/** The side door behind each cab. */
const DOOR: readonly [number, number] = [6.55, 7.2];

/**
 * The row between the doors on the left side (-z), read from +x: three grilles,
 * two windows, a grille, a window, a grille (1110 003, St Michael 1994, and 1010.10;
 * the right side, 1110 023 and 505, is the same turned about).
 */
const ROW_ITEMS: ReadonlyArray<readonly ["window" | "grille", number, number]> = [
  ["grille", 4.38, 5.2], ["grille", 3.4, 4.22], ["grille", 2.42, 3.24],
  ["window", 0.25, 0.95], ["window", -1.75, -1.05],
  ["grille", -3.72, -2.95], ["window", -4.72, -4.05], ["grille", -5.85, -5.08],
];

function sideRow(): SideItem[] {
  const out: SideItem[] = [];
  for (const sd of [-1, 1])
    for (const [i, [kind, a, b]] of ROW_ITEMS.entries()) {
      const x: readonly [number, number] = sd < 0 ? [a, b] : [-b, -a];
      out.push(kind === "window"
        ? { kind: "window", name: `window ${i + 1}`, x, y: ROW, mat: "rim", r: 0.06, sides: [sd] }
        : { kind: "grille", name: `grille ${i + 1}`, x, y: GRILLE_Y, mat: "slat", slats: "h", pitch: 0.075, r: 0.03, sides: [sd] });
    }
  return out;
}

// --- the spec ----------------------------------------------------------------------

/** The headlights' centre |z| and height, the pod's radius. */
const HEAD: readonly [number, number] = [0.94, 2.14];
const POD_R = 0.25;

function spec(l: Livery1110): LocoSpec {
  const roofItems: RoofBox[] = l.brake
    ? [-1, 1].map((e): RoofBox => ({ name: e > 0 ? "front brake resistors" : "rear brake resistors", x: e > 0 ? [5.5, 7.5] : [-7.5, -5.5], w: [0.965, 0.9], y: [CROWN - 0.02, CROWN + 0.58], mat: "roof" }))
    : [];
  return {
    palette: {
      rim: c("#2a2c2e", 0.6), louvre: c("#1f2123", 0.85), slat: c("#3a3d40", 0.7), roofSlat: c("#8c8f8c", 0.6), beam: c("#232325", 0.75),
      bogie: c("#26272a", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      underframe: c("#26272a", 0.8), plate: c("#232325", 0.7),
      pantograph: { color: "#a32a1f", metallic: 0.2, roughness: 0.55 },
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: SIDE,
    end: SIDE,
    roof: "roof",
    buffers: HALF,
    beam: N - 0.02,
    bufferY: 1.06,
    bufferHead: "round",
    frame: { y0: 0.82, y1: Y0 + 0.02, half: N - 0.08, hw: 1.34, mat: "skirt" },
    bogies: [-4.3, 4.3].map((xc) => ({ xc, axles: [-2.05, 0, 2.05], wheelR: 0.65, frameTop: 0.98 })),
    pantograph: l.brake
      ? { kind: "singleArm", x: 4.55, roofY: CROWN, baseY: CROWN + 0.27 }
      : { kind: "diamond", x: 4.7, roofY: CROWN, baseY: CROWN + 0.3 },
    sideItems: [
      { kind: "door", name: "door", x: DOOR, y: [LOW[1], 3.74], win: [2.92, 3.62], rails: true, mirror: true },
      ...sideRow(),
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.17, 1.11], y: SCREEN, mat: "rim", wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.11, -0.17], y: SCREEN, mat: "rim", wiper: true },
      { kind: "lamp", name: "tail lamp", z: [0.88, 1.0], y: [1.64, 1.76], r: 0.055, mat: "lampRed" },
    ],
    roofItems,
    underItems: [[-1.9, 1.9, 0.45, 0.82, 1.15], [-1.4, 1.4, 0.32, 0.45, 0.85]],
    plough: "skirt",
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** The round headlights in their pods standing off the face, the top light on the roof dome. */
function headlights(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("headlights", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x0 = e * (sp.tip(HEAD[1]) - 0.02);
        for (const s of [-1, 1]) {
          const z = s * HEAD[0];
          const pod: Ring = ngon(16, POD_R, 0, z, HEAD[1]);
          const rim: Ring = ngon(16, POD_R - 0.03, 0, z, HEAD[1]);
          const lens: Ring = ngon(16, POD_R - 0.1, 0, z, HEAD[1]);
          m.scope(s > 0 ? "left pod" : "right pod", () => {
            m.sweep("body", "x", pod, x0, pod, x0 + e * 0.1, false);
            m.sweep("steel", "x", rim, x0 + e * 0.1, rim, x0 + e * 0.115);
            m.sweep("lampHead", "x", lens, x0 + e * 0.115, lens, x0 + e * 0.125);
          });
        }
        m.scope("top light", () => {
          const y = 4.02, xt = e * (sp.tip(y) - 0.12);
          const pod: Ring = ngon(12, 0.13, 0, 0, y);
          const lens: Ring = ngon(12, 0.1, 0, 0, y);
          m.sweep("steel", "x", pod, xt, pod, xt + e * 0.2);
          m.sweep("lampHead", "x", lens, xt + e * 0.2, lens, xt + e * 0.21);
        });
      });
  });
}

/** The winged wheel (OBB): a ring with the Umlaut dots, three tapering feathers each side, B and B above. */
function emblem(m: MeshBuilder, sp: ShellSpec, l: Livery1110): void {
  m.scope("emblem", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n = [e, 0, 0] as [number, number, number];
      const put = (mat: string, ring: Ring, d: number) => {
        const tris: Array<[number, number, number]> = [];
        for (let i = 1; i + 1 < ring.length; i++) for (const p of [ring[0]!, ring[i]!, ring[i + 1]!]) tris.push(at(p[0], p[1], d));
        // seen from ahead the ring must wind outward: reverse the triangles at the front
        m.facets(mat, e > 0 ? tris.reverse() : tris, n);
      };
      const cy = 2.2;
      m.scope(e > 0 ? "front" : "rear", () => {
        put("emblem", ngon(16, 0.13, 0, 0, cy), 0.006);
        put("body", ngon(16, 0.085, 0, 0, cy), 0.008);
        for (const s of [-1, 1]) {
          put("emblem", ngon(6, 0.022, 0, s * 0.05, cy + 0.17), 0.006);
          for (const [k, dy] of [[0, 0.06], [1, 0], [2, -0.06]] as const) {
            const x0 = s * 0.15, x1 = s * (0.72 - k * 0.12);
            const h = 0.022;
            const q: Ring = s > 0
              ? [[x0, cy + dy - h], [x1, cy + dy - h * 0.4], [x1, cy + dy + h * 0.4], [x0, cy + dy + h]]
              : [[x1, cy + dy - h * 0.4], [x0, cy + dy - h], [x0, cy + dy + h], [x1, cy + dy + h * 0.4]];
            put("emblem", q, 0.006);
          }
        }
        const lh = 0.14, lw = wordWidth("B", lh, { weight: 0.24 });
        for (const s of [-1, 1]) {
          const u = s * 0.16;
          const tris = letters("B", e > 0 ? u + lw / 2 : u - lw / 2, cy + 0.16, lh, e > 0, { weight: 0.24 });
          m.facets("emblem", tris.map(([a, b]) => at(a, b, 0.006)), n);
        }
        numberOn(m, at, n, l.number, 0, 1.78, 0.11, 0.006, e > 0);
      });
    }
  });
}

/** The roof line: busbars on post insulators from each pantograph to the main breaker in the middle. */
function roofLine(m: MeshBuilder, l: Livery1110): void {
  const y = CROWN + 0.36;
  const reach = l.brake ? 3.7 : 3.85;
  m.scope("roof line", () => {
    for (const x of [-2.9, -1.4, 1.4, 2.9]) insulator(m, x, 0.3, CROWN - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -reach, y, 0.3, reach, y, 0.3, 6);
    m.scope("main breaker", () => {
      block(m, "steel", -0.45, 0.45, CROWN - 0.01, CROWN + 0.14, -0.38, 0.38);
      insulator(m, -0.2, 0.3, CROWN + 0.13, y - 0.02);
      insulator(m, 0.2, -0.2, CROWN + 0.13, y - 0.02);
    });
  });
}

/** The 1110.500's brake resistor boxes: louvres along their sides and across their fronts. */
function resistorGrilles(m: MeshBuilder): void {
  m.scope("brake resistor grilles", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [5.75, 7.35] : [-7.35, -5.75];
        for (const s of [-1, 1]) {
          const z = s * 0.95;
          block(m, "louvre", a, b, CROWN + 0.08, CROWN + 0.5, ...(s > 0 ? [z - 0.01, z + 0.012] : [z - 0.012, z + 0.01]) as [number, number]);
          for (let x = a + 0.08; x < b - 0.05; x += 0.16) block(m, "roofSlat", x, x + 0.04, CROWN + 0.1, CROWN + 0.48, ...(s > 0 ? [z, z + 0.025] : [z - 0.025, z]) as [number, number]);
        }
        const xf = e * 7.5;
        block(m, "louvre", e > 0 ? xf - 0.01 : xf - 0.012, e > 0 ? xf + 0.012 : xf + 0.01, CROWN + 0.08, CROWN + 0.5, -0.7, 0.7);
        for (let yy = CROWN + 0.11; yy < CROWN + 0.48; yy += 0.07) block(m, "roofSlat", e > 0 ? xf : xf - 0.025, e > 0 ? xf + 0.025 : xf, yy, yy + 0.025, -0.68, 0.68);
      });
  });
}

/** The OBB 1110 in a livery. */
export function obb1110(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    headlights(m, sp);
    emblem(m, sp, l);
  });
  m.scope("roof equipment", () => {
    roofLine(m, l);
    if (l.brake) resistorGrilles(m);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function obb1110Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v)));
}

/** The design's registry entry (generator/atLocos.ts): 106 t, 4,000 kW, 110 km/h as a 1110. */
export const OBB1110_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-1110", title: "OBB 1110", build: obb1110, buildLod: obb1110Lod, params: OBB1110_PARAMS,
  game: { weight: 106, power: 4000, maxspeed: 110, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "obb-1110",
};

