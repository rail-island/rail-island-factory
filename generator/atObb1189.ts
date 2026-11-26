// The BBO 1100.1 / OBB 1189 (proc-vehicle-obb-1189, BBC Vienna and Floridsdorf,
// 1926/27), the "Austrian crocodile": a (1'C)(C1') rod-drive electric for the
// Arlberg and Tauern ramps, measured on the reference photographs
// (assets/obb-1189/SOURCES.md; docs/models/austria-trains.md):
//
// - the centre body on the box locomotive kit (boxLocoKit.ts): 6.84 m long, 3.0 m
//   wide, its cab ends chamfered at the corners (a narrow window on each chamfer),
//   two front windows with the headlight between them, the roof running out 0.4 m
//   over each end as a visor; per side the cab doors at the ends, two windows with
//   a grille and a low vent under each, the number plate between them, on the
//   right side the vertical louvre over it; the slatted grille box under the body;
// - the hoods (their own shells): 5.35 m from the cab to their front, 2.5 m wide
//   and 2.72 m high, the top falling 0.3 m to the front over its last 1.4 m, three louvres
//   and the round cover on each side, the two headlights on the front's top
//   corners and the number plate between them; the black frame band along the
//   hood's foot, the hood's skirt arching over the first driver and down to 1.1 m;
// - the running gear, each half a rigid frame: the leading pony axle (870 mm, an
//   Adams axle, its own turning unit) 2.0 m ahead of three coupled drivers of
//   1,350 mm spaced 3.85 m and 1.71 m, the jackshaft 2.27 m behind the outer driver
//   and 1.1 m up, its crank driving the coupling rod through a vertical link;
//   wheelbase 17.7 m in all, 20.4 m over the buffers;
// - two red diamond pantographs over the cab ends (the rear raised), the roof line;
// - three liveries: OBB fir green (1189.05, 1955-1979), the OBB brown of 1953-55
//   (1189.08) and the blood orange 1189.02 wore from 1971.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { KIT_PALETTE, c, kinks, lerpTable, onEnd, onSide, rect, shell, surfacePanel, sweepZ, type ShellSpec } from "./czElectricKit.ts";
import { ELECTRIC_LOCO_CATALOG, type Band } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";
import { block, side } from "./vehicleParts.ts";
import { fitLod, lodBogie, lodPantograph, lodRoofBox, lodSideBox, windowBands, type LodPart, type LodShell } from "./lodKit.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (20.4 m), the buffer beam's face. */
const HALF = 10.2;
const BEAM = 9.75;

// --- the centre body ------------------------------------------------------------------

/** The cab ends' |x|, the body's bottom, the eave, the roof's crown and half width (3.0 m). */
const CAB = 3.42;
const Y0 = 1.55;
const EAVE = 3.62;
const CROWN = 3.85;
const W = 1.5;
/** The corners' chamfer: across and back along the side. */
const CHAMFER = 0.45;
/** The end's centre line [y, |x|]: the upright end, the roof's visor 0.4 m ahead of it. */
const TIP: Table = [[Y0, CAB], [EAVE, CAB], [3.65, CAB + 0.4], [3.72, CAB + 0.4], [3.78, CAB + 0.3], [CROWN, CAB + 0.06]];
/** The half width: upright walls, the gutter, the roof's shoulder. */
const HW: Table = [[Y0, W], [EAVE, W], [3.65, W + 0.04], [3.72, W + 0.04], [3.78, W - 0.06], [CROWN, W - 0.36]];
const PLAN = (_y: number, w: number) => [[0, 0], [w - CHAMFER, 0], [w, CHAMFER]] as const;

/** The side's layout (right side, front half; mirrored to the rear). */
const DOOR = [1.92, 2.58] as const;
const DOOR_Y = [Y0 + 0.06, 3.56] as const;
const DOOR_WIN = [2.82, 3.5] as const;
const WINDOW = [0.85, 1.45] as const;
const WIN_Y = [2.9, 3.52] as const;
/** The front windows: taller than wide. */
const FRONT_WIN = { z: [0.24, 0.86] as const, y: [2.88, 3.55] as const };
const GRILLE_Y = [2.1, 2.5] as const;
const VENT_Y = [1.64, 1.84] as const;
const PLATE = { x: [-0.34, 0.34] as const, y: [2.06, 2.26] as const };
/** The slatted grille box under the body. */
const UNDER = { x: 1.97, y: [1.3, 1.53] as const, z: 1.47 };

// --- the hoods ---------------------------------------------------------------------------

/** The hood's front |x|, its shell's centre and half length (its inner end hidden in the cab). */
const HOOD_FRONT = 8.75;
const HOOD_XC = 4.625;
const HOOD_HALF = HOOD_FRONT - HOOD_XC;
const HOOD_Y0 = 1.72;
/** The skirt's lower edge ahead of the first driver, the frame band's foot behind it. */
const SKIRT_Y = 1.1;
const BAND_Y = 1.28;
const HOOD_TOP = 2.72;
const HOOD_W = 1.25;
/** The top falls to the front from |x| 7.35 in a long curve. */
const HOOD_TIP: Table = [[HOOD_Y0, HOOD_HALF], [2.3, HOOD_HALF], [2.42, HOOD_HALF - 0.04], [2.52, HOOD_HALF - 0.13], [2.6, HOOD_HALF - 0.32], [2.67, HOOD_HALF - 0.75], [HOOD_TOP, HOOD_HALF - 1.4]];
const HOOD_HW: Table = [[HOOD_Y0, HOOD_W], [2.6, HOOD_W], [2.67, HOOD_W - 0.04], [2.7, HOOD_W - 0.11], [HOOD_TOP, HOOD_W - 0.25]];
const HOOD_PLAN = (_y: number, w: number) => [[0, 0], [w * 0.8, 0.005], [w * 0.93, 0.03], [w, 0.1]] as const;
/** The hood's skirt ahead of the first driver, its lower edge arching over the driver ([x, y], front end). */
const SKIRT: Ring = [[HOOD_FRONT, HOOD_Y0], [6.95, HOOD_Y0], [7.3, 1.62], [7.55, 1.45], [7.7, 1.25], [7.8, SKIRT_Y], [HOOD_FRONT, SKIRT_Y]];
/** The hood's louvres on each side: x span (front end) and y span. */
const HOOD_LOUVRES = [{ x: [3.68, 4.2], y: [2.1, 2.4] }, { x: [6.15, 6.7], y: [1.8, 2.34] }, { x: [7.4, 8.3], y: [2.02, 2.2] }] as const;
/** The round cover low on the hood's side. */
const COVER = { x: 7.9, y: 1.72, r: 0.38 };

// --- the running gear -----------------------------------------------------------------

/** Each half's axles from the centre: the coupled drivers (outer first), the pony; the jackshaft. */
const DRIVERS = [6.86, 3.01, 1.3] as const;
const PONY = 8.85;
const DRIVER_R = 0.675;
const PONY_R = 0.435;
const JACK = { x: 4.59, y: 1.1 };
/** The crank radius and the right side's crank angle (the left leads by 90 degrees). */
const CRANK = 0.3;
const PHI = Math.PI / 6;
const SPOKES = 12;

/** The diamond pantographs over the cab ends, the roof line's insulators. */
const PANTO_X = 2.95;
const LINE_X = 1.6;

// --- liveries -------------------------------------------------------------------------

interface Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  number: string;
  /** A light line along the body side under the windows (the blood orange's). */
  line?: string;
}

const RUNNING: Record<string, MaterialSpec> = {
  black: c("#1d1e20", 0.75), wheel: c("#1d1e20", 0.7), tyre: c("#4d5052", 0.45), rod: c("#a3302a", 0.55),
  roof: c("#8a8e8d", 0.75), pantograph: { color: "#a1282a", metallic: 0.2, roughness: 0.6 },
  plate: c("#1c1d1f", 0.5), rubber: c("#1a1b1d", 0.8), underframe: c("#1d1e20", 0.75), bogie: c("#1d1e20", 0.75),
  silver: c("#d6d6cf", 0.45), lampHead: { color: "#f4f1e4", metallic: 0.3, roughness: 0.2 },
};

const LIVERIES: Record<string, Livery> = {
  // 1189.05 in RAL 6009 fir green (Wien Heiligenstadt 1985, Strasshof); 1189.09 at Ampflwang
  green: { title: "Green", palette: { paint: c("#2f4a37"), slat: c("#2f4a37") }, number: "1189.05" },
  // the brown 1189.05 and 08 wore from 1953 to 1955 (the German article; no photograph)
  brown: { title: "Brown", palette: { paint: c("#553722"), slat: c("#553722") }, number: "1189.08" },
  // 1189.02, painted blood orange in June 1971 (Attnang-Puchheim 1980)
  bloodOrange: { title: "Blood orange", palette: { paint: c("#c4471f"), slat: c("#c4471f"), line: c("#e9dcbc") }, number: "1189.02", line: "line" },
};

export const OBB1189_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery => LIVERIES[resolveParams(OBB1189_PARAMS, v).livery!]!;

const SIDE: readonly Band[] = [[Y0, EAVE, "paint"], [EAVE, 4.0, "roof"]];
const HOOD_BANDS: readonly Band[] = [[HOOD_Y0, 3.0, "paint"]];

function spec(l: Livery): LocoSpec {
  const sideItems: SideItem[] = [
    { kind: "door", name: "cab door", x: DOOR, y: DOOR_Y, win: DOOR_WIN, mirror: true },
    { kind: "window", name: "window", x: WINDOW, y: WIN_Y, mat: "rubber", r: 0.08, mirror: true },
    { kind: "grille", name: "grille", x: WINDOW, y: GRILLE_Y, slats: "v", pitch: 0.07, mat: "slat", mirror: true },
    { kind: "paint", name: "vent", x: [WINDOW[0] + 0.03, WINDOW[1] - 0.03], y: VENT_Y, mat: "louvre", mirror: true },
    { kind: "paint", name: "middle vent", x: [-0.4, 0.4], y: VENT_Y, mat: "louvre" },
    { kind: "grille", name: "louvre", x: [-0.45, 0.45], y: [2.75, 3.42], slats: "v", pitch: 0.09, mat: "slat", sides: [1] },
    { kind: "plate", name: "number plate", x: PLATE.x, y: PLATE.y },
    ...(l.line ? [{ kind: "paint" as const, name: "line", x: [-CAB + CHAMFER + 0.02, CAB - CHAMFER - 0.02] as const, y: [2.8, 2.86] as const, mat: l.line }] : []),
  ];
  const endItems: EndItem[] = [
    { kind: "window", name: "front window left", z: FRONT_WIN.z, y: FRONT_WIN.y, wiper: true },
    { kind: "window", name: "front window right", z: [-FRONT_WIN.z[1], -FRONT_WIN.z[0]], y: FRONT_WIN.y, wiper: true },
    { kind: "window", name: "corner window left", z: [1.13, 1.4], y: [2.95, 3.5] },
    { kind: "window", name: "corner window right", z: [-1.4, -1.13], y: [2.95, 3.5] },
    { kind: "lamp", name: "top headlight", z: [-0.09, 0.09], y: [3.38, 3.56], r: 0.09 },
  ];
  return {
    palette: { ...RUNNING, ...l.palette },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan: PLAN,
    corner: "end",
    side: SIDE,
    end: SIDE,
    roof: "roof",
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.04,
    frame: { y0: 1.34, y1: Y0 + 0.02, half: CAB - 0.1, hw: 1.2, mat: "black" },
    bogies: [],
    pantograph: { kind: "diamond", x: PANTO_X, roofY: CROWN, baseY: CROWN + 0.3 },
    hvLine: { x: LINE_X, y: CROWN + 0.25, z: 0 },
    sideItems,
    endItems,
    roofItems: [{ name: "main switch", x: [-0.45, 0.45], w: [0.32, 0.28], y: [CROWN - 0.02, CROWN + 0.18], mat: "roof" }],
    number: l.number,
  };
}

// --- the hoods ------------------------------------------------------------------------

function hoodShell(e: number): ShellSpec {
  return {
    heights: kinks(HOOD_TIP, HOOD_HW),
    tip: (y) => lerpTable(HOOD_TIP, y),
    hw: (y) => lerpTable(HOOD_HW, y),
    endPlan: (y) => HOOD_PLAN(y, lerpTable(HOOD_HW, y)),
    side: HOOD_BANDS, end: HOOD_BANDS, corner: "end", roof: "paint",
    xc: e * HOOD_XC,
    ends: [e],
  };
}

/** A louvre: the dark opening and its slats as small hoods in the body colour. */
function louvre(m: MeshBuilder, at: (u: number, v: number, d: number) => Vec3, n: Vec3, u: readonly [number, number], v: readonly [number, number], vB: readonly number[]): void {
  m.scope("opening", () => surfacePanel(m, "louvre", at, n, rect(u[0], v[0], u[1], v[1]), -0.006, 0.006, [], vB));
  m.scope("slats", () => {
    const pts: Vec3[] = [], lips: Vec3[] = [];
    const [a, b] = [u[0] + 0.02, u[1] - 0.02];
    for (let y = v[0] + 0.03; y + 0.04 <= v[1] - 0.01; y += 0.09) {
      const [p, q, r, t] = [at(a, y, 0.06), at(b, y, 0.06), at(b, y + 0.05, 0.01), at(a, y + 0.05, 0.01)];
      pts.push(p, q, r, p, r, t);
      const [p0, q0] = [at(a, y, 0.006), at(b, y, 0.006)];
      lips.push(p0, q0, q, p0, q, p);
    }
    m.facets("paint", pts, [n[0] * 0.8, 0.6, n[2] * 0.8]);
    m.facets("paint", lips, [0, -1, 0]);
  });
}

function hood(m: MeshBuilder, e: number, l: Livery): void {
  const sp = hoodShell(e);
  const vB = kinks(HOOD_TIP, HOOD_HW);
  m.scope("shell", () => shell(m, sp));
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right side" : "left side", () => {
      const at = onSide(sp, sd);
      const n: Vec3 = [0, 0, sd];
      const X = (x: number) => e * x;
      const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      m.scope("skirt", () => m.slab("paint", SKIRT.map(([x, y]): Vec3 => [X(x), y, sd * HOOD_W]), [0, 0, -sd * 0.03]));
      for (const [i, lv] of HOOD_LOUVRES.entries()) m.scope(`louvre ${i + 1}`, () => louvre(m, at, n, span(lv.x[0], lv.x[1]), lv.y, vB));
      m.scope("round cover", () => {
        // its dark rim, then the cover standing proud of it
        const rim = ngon(12, COVER.r + 0.03, 0, X(COVER.x), COVER.y);
        m.slab("black", rim.map(([x, y]): Vec3 => [x, y, sd * (HOOD_W + 0.028)]), [0, 0, -sd * 0.03]);
        const ring = ngon(12, COVER.r, 0, X(COVER.x), COVER.y);
        m.slab("paint", ring.map(([x, y]): Vec3 => [x, y, sd * (HOOD_W + 0.05)]), [0, 0, -sd * 0.06]);
        m.slab("black", [[X(COVER.x) - 0.04, COVER.y + COVER.r - 0.02], [X(COVER.x) + 0.04, COVER.y + COVER.r - 0.02], [X(COVER.x) + 0.04, COVER.y - COVER.r + 0.02], [X(COVER.x) - 0.04, COVER.y - COVER.r + 0.02]].map(([x, y]): Vec3 => [x, y, sd * (HOOD_W + 0.065)]), [0, 0, -sd * 0.02]);
      });
      m.scope("handrail", () => {
        const z = sd * (HOOD_W + 0.06);
        m.rod("steel", [X(3.75), 2.58, z], [X(6.6), 2.58, z], 0.016, 6);
        for (const x of [3.8, 5.2, 6.55]) m.rod("steel", [X(x), 2.58, sd * (HOOD_W - 0.01)], [X(x), 2.58, z], 0.014, 4);
      });
    });
  const at = onEnd(sp, e);
  const n: Vec3 = [e, 0, 0];
  m.scope("front", () => {
    m.scope("number plate", () => {
      surfacePanel(m, "plate", at, n, rect(-0.4, 2.12, 0.4, 2.3), -0.01, 0.02, [], vB);
      const h = 0.11, w = wordWidth(l.number, h, { weight: 0.14 });
      const tris = letters(l.number, e > 0 ? w / 2 : -w / 2, 2.21 - h / 2, h, e > 0, { weight: 0.14 });
      m.facets("white", tris.map(([u, v]) => at(u, v, 0.024)), n);
    });
    m.scope("headlights", () => {
      for (const z of [-0.88, 0.88]) {
        const x0 = e * (HOOD_FRONT - 0.25), x1 = e * (HOOD_FRONT + 0.2);
        const body = ngon(12, 0.19, 0, z, 2.38);
        m.sweep("paint", "x", body, Math.min(x0, x1), body, Math.max(x0, x1));
        const lens = ngon(12, 0.15, 0, z, 2.38);
        const [l0, l1] = [e * (HOOD_FRONT + 0.2), e * (HOOD_FRONT + 0.22)];
        m.sweep("lampHead", "x", lens, Math.min(l0, l1), lens, Math.max(l0, l1));
      }
    });
    m.scope("handrails", () => {
      for (const z of [-1.08, 1.08]) {
        const x = e * (HOOD_FRONT + 0.08);
        m.rod("steel", [x, 1.45, z], [x, 2.15, z], 0.018, 6);
        for (const y of [1.5, 2.1]) m.rod("steel", [e * (HOOD_FRONT - 0.01), y, z], [x, y, z], 0.014, 6);
      }
    });
  });
  m.scope("skirt front", () => {
    const [a, b] = e > 0 ? [HOOD_FRONT - 0.03, HOOD_FRONT] : [-HOOD_FRONT, -HOOD_FRONT + 0.03];
    block(m, "paint", a, b, SKIRT_Y, HOOD_Y0, -HOOD_W + 0.03, HOOD_W - 0.03);
  });
  m.scope("frame band", () => {
    // the main frame's side under the hood, flush with it, between the cab and the skirt
    const [a, b] = e > 0 ? [CAB - 0.5, 7.05] : [-7.05, -CAB + 0.5];
    block(m, "black", a, b, BAND_Y, HOOD_Y0 + 0.02, -HOOD_W + 0.01, HOOD_W - 0.01);
  });
  m.scope("front step box", () => {
    const [a, b] = e > 0 ? [HOOD_FRONT - 0.05, HOOD_FRONT + 0.5] : [-HOOD_FRONT - 0.5, -HOOD_FRONT + 0.05];
    block(m, "black", a, b, 1.02, 1.62, -0.95, 0.95);
  });
  m.scope("buffer beam", () => {
    const [a, b] = e > 0 ? [BEAM - 0.22, BEAM] : [-BEAM, -BEAM + 0.22];
    block(m, "black", a, b, 0.78, 1.3, -1.45, 1.45);
    const [f0, f1] = e > 0 ? [HOOD_FRONT + 0.45, BEAM - 0.21] : [-BEAM + 0.21, -HOOD_FRONT - 0.45];
    for (const s of [-1, 1]) block(m, "black", f0, f1, 1.0, 1.26, ...side(s, 0.95, 1.05));
  });
}

// --- the centre body's extras -------------------------------------------------------------

function bodyExtras(m: MeshBuilder, l: Livery): void {
  const sp = shellOf(spec(l));
  m.scope("handrails", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        for (const x of [DOOR[0] - 0.07, DOOR[1] + 0.07]) {
          const z = sd * (W + 0.03);
          m.rod("steel", [e * x, 1.95, z], [e * x, 3.3, z], 0.016, 6);
          for (const y of [2.0, 3.25]) m.rod("steel", [e * x, y, sd * (W - 0.01)], [e * x, y, z], 0.013, 4);
        }
  });
  m.scope("lettering", () => {
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      const h = 0.13, w = wordWidth("OBB", h, { weight: 0.14 }), wo = wordWidth("O", h, { weight: 0.14 });
      const u0 = sd > 0 ? -w / 2 : w / 2;
      const tris = letters("OBB", u0, 2.36, h, sd < 0, { weight: 0.14 });
      // the umlaut's two dots over the O
      const oc = u0 + (sd > 0 ? wo / 2 : -wo / 2), dy = 2.36 + h + 0.025, r = 0.012;
      for (const du of [-0.27 * wo, 0.27 * wo]) tris.push([oc + du - r, dy], [oc + du + r, dy], [oc + du + r, dy + 2 * r], [oc + du - r, dy], [oc + du + r, dy + 2 * r], [oc + du - r, dy + 2 * r]);
      m.facets("white", tris.map(([u, v]) => at(u, v, 0.004)), [0, 0, sd]);
    }
  });
  m.scope("grille box", () => {
    for (const sd of [-1, 1]) {
      const [y0, y1] = UNDER.y;
      block(m, "black", -UNDER.x, UNDER.x, y0, y1, ...side(sd, 1.15, UNDER.z - 0.05));
      for (let k = 0; k < 5; k++) {
        const y = y0 + 0.025 + k * 0.045;
        block(m, "silver", -UNDER.x + 0.04, UNDER.x - 0.04, y, y + 0.025, ...side(sd, UNDER.z - 0.05, UNDER.z - 0.02));
      }
      for (const x of [-UNDER.x, UNDER.x]) block(m, "silver", x - 0.04, x + 0.04, y0, y1, ...side(sd, UNDER.z - 0.05, UNDER.z));
      for (const x of [-0.6, 0.6]) {
        // the Y-shaped stay: its stem and two arms
        const z0 = sd * UNDER.z, d: Vec3 = [0, 0, -sd * 0.03];
        const q = (pts: Array<[number, number]>) => m.slab("silver", pts.map(([u, v]): Vec3 => [x + u, v, z0]), d);
        q([[-0.02, y0], [0.02, y0], [0.02, y0 + 0.1], [-0.02, y0 + 0.1]]);
        q([[-0.02, y0 + 0.1], [0.02, y0 + 0.1], [-0.12, y1], [-0.16, y1]]);
        q([[-0.02, y0 + 0.1], [0.02, y0 + 0.1], [0.16, y1], [0.12, y1]]);
      }
    }
  });
}

// --- the running gear ---------------------------------------------------------------------

const axleY = (r: number, n: number) => r * Math.cos(Math.PI / n);

/** A spoked wheel on side s: tyre, hub, spokes; its outer face at |z| 0.8. */
function spokedWheel(m: MeshBuilder, s: number, x: number, ay: number, R: number, spokes: number, mat: string): void {
  const n = spokes * 2;
  const ri = R - Math.max(0.06, R * 0.085);
  m.scope("tyre", () => m.tube("tyre", "z", x, ay, R, ri, ...side(s, 0.665, 0.8), n, -Math.PI / 2 + Math.PI / n));
  const hubR = Math.max(0.11, R * 0.2);
  m.scope("hub", () => sweepZ(m, mat, ngon(8, hubR, 0, x, ay), side(s, 0.68, 0.82)));
  m.scope("spokes", () => {
    const w0 = Math.min(0.05, R * 0.075), w1 = w0 * 0.7, r0 = hubR - 0.02, r1 = ri + 0.015;
    for (let k = 0; k < spokes; k++) {
      const ang = ((k + 0.5) / spokes) * Math.PI * 2;
      const u = [Math.cos(ang), Math.sin(ang)], v = [-u[1]!, u[0]!];
      const P = (r: number, w: number): Vec3 => [x + u[0]! * r + v[0]! * w, ay + u[1]! * r + v[1]! * w, s * 0.79];
      // the outer face and the two long walls (the ends hide in the hub and the tyre)
      const [a, b, cc, d] = [P(r0, -w0), P(r1, -w1), P(r1, w1), P(r0, w0)];
      const back = (p: Vec3): Vec3 => [p[0], p[1], s * 0.72];
      m.facets(mat, [a, b, cc, a, cc, d], [0, 0, s]);
      m.facets(mat, [a, b, back(b), a, back(b), back(a)], [-v[0]!, -v[1]!, 0]);
      m.facets(mat, [d, cc, back(cc), d, back(cc), back(d)], [v[0]!, v[1]!, 0]);
    }
  });
}

/** A wheelset: the axle and its two wheels. */
function wheelset(m: MeshBuilder, x: number, R: number, spokes: number): void {
  const ay = axleY(R, spokes * 2);
  m.scope("wheelset", () => {
    const axle = ngon(8, 0.08, 0, x, ay);
    m.sweep("steel", "z", axle, -0.7, axle, 0.7);
    for (const s of [-1, 1]) spokedWheel(m, s, x, ay, R, spokes, "wheel");
  });
}

/** A crank pin's position: about (x, y) at angle phi. */
const pinAt = (x: number, y: number, phi: number): [number, number] => [x + CRANK * Math.cos(phi), y + CRANK * Math.sin(phi)];

/** A flat bar from A to B on side s between |z| z0 and z1, with round bosses at both ends. */
function bar(m: MeshBuilder, mat: string, s: number, A: readonly [number, number], B: readonly [number, number], w: number, z0: number, z1: number): void {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  const u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L], v = [-u[1]!, u[0]!];
  const zo = s * z1;
  const pts: Vec3[] = [[A[0] - v[0]! * w, A[1] - v[1]! * w, zo], [B[0] - v[0]! * w, B[1] - v[1]! * w, zo], [B[0] + v[0]! * w, B[1] + v[1]! * w, zo], [A[0] + v[0]! * w, A[1] + v[1]! * w, zo]];
  m.slab(mat, pts, [0, 0, -s * (z1 - z0)]);
  for (const p of [A, B]) sweepZ(m, mat, ngon(8, w * 1.35, 0, p[0], p[1]), side(s, z0 - 0.004, z1 + 0.004));
}

/** One half's coupled drivers, jackshaft, rods and frame (e = +1 front half): one turning unit. */
function driveUnit(m: MeshBuilder, e: number): void {
  const ay = axleY(DRIVER_R, SPOKES * 2);
  m.bogie(() => {
    for (const d of DRIVERS) wheelset(m, e * d, DRIVER_R, SPOKES);
    m.scope("frame", () => {
      const [x0, x1] = e > 0 ? [0.45, 8.1] : [-8.1, -0.45];
      for (const s of [-1, 1]) block(m, "black", x0, x1, ay + 0.05, 1.24, ...side(s, 0.5, 0.56));
      for (const x of [0.5, 5.3, 8.05]) block(m, "black", e * x - 0.06, e * x + 0.06, 0.9, 1.2, -0.52, 0.52);
    });
    m.scope("jackshaft", () => {
      const jx = e * JACK.x;
      const shaft = ngon(10, 0.13, 0, jx, JACK.y);
      m.sweep("black", "z", shaft, -0.82, shaft, 0.82);
      // the gear case of the jackshaft's wheel and the motor's pinion, between the frame and the wheels
      for (const s of [-1, 1]) {
        sweepZ(m, "black", ngon(12, 0.4, 0, jx, JACK.y), side(s, 0.57, 0.63));
        sweepZ(m, "black", ngon(10, 0.3, 0, e * (JACK.x + 1.28), 1.12), side(s, 0.57, 0.63));
      }
    });
    m.scope("rods", () => {
      for (const s of [-1, 1]) {
        const phi = s > 0 ? PHI : PHI + Math.PI / 2;
        const pins = DRIVERS.map((d) => pinAt(e * d, ay, phi));
        for (const [i, d] of DRIVERS.entries())
          m.scope(`crank ${i + 1}`, () => {
            // the counterweight opposite the pin, the boss and the pin
            const cw: Ring = [];
            for (let k = 0; k <= 6; k++) {
              const a = phi + Math.PI - 0.8 + (1.6 * k) / 6;
              cw.push([e * d + Math.cos(a) * (DRIVER_R - 0.1), ay + Math.sin(a) * (DRIVER_R - 0.1)]);
            }
            cw.push([e * d, ay]);
            m.slab("wheel", cw.map(([x, y]): Vec3 => [x, y, s * 0.81]), [0, 0, -s * 0.05]);
            sweepZ(m, "wheel", ngon(8, 0.12, 0, pins[i]![0], pins[i]![1]), side(s, 0.76, 0.86));
            sweepZ(m, "steel", ngon(6, 0.05, 0, pins[i]![0], pins[i]![1]), side(s, 0.85, 0.99));
          });
        m.scope("jackshaft crank", () => {
          sweepZ(m, "wheel", ngon(16, 0.3, 0, e * JACK.x, JACK.y), side(s, 0.8, 0.86));
          const q = pinAt(e * JACK.x, JACK.y, phi);
          sweepZ(m, "steel", ngon(6, 0.05, 0, q[0], q[1]), side(s, 0.85, 0.99));
          // the vertical link from the jackshaft's crank down to the coupling rod (parallel motion)
          bar(m, "rod", s, q, [q[0], ay + CRANK * Math.sin(phi) - 0.12], 0.055, 0.88, 0.93);
        });
        m.scope("coupling rod", () => {
          // outer driver to the middle one, middle to the inner one
          bar(m, "rod", s, pins[0]!, pins[1]!, 0.05, 0.93, 0.97);
          bar(m, "rod", s, pins[1]!, pins[2]!, 0.045, 0.88, 0.92);
        });
      }
    });
  });
}

/** The leading pony axle: an Adams axle in its own yoke, its own turning unit. */
function ponyUnit(m: MeshBuilder, e: number): void {
  const ay = axleY(PONY_R, 16);
  m.bogie(() => {
    wheelset(m, e * PONY, PONY_R, 8);
    m.scope("yoke", () => {
      for (const s of [-1, 1]) {
        block(m, "black", e * PONY - 0.42, e * PONY + 0.42, ay + 0.12, ay + 0.24, ...side(s, 0.5, 0.58));
        sweepZ(m, "black", ngon(8, 0.13, Math.PI / 8, e * PONY, ay), side(s, 0.5, 0.6));
      }
    });
  });
}

/** The OBB 1189 in a livery. */
export function obb1189(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const m = buildBoxLoco(spec(l));
  m.scope("body", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front hood" : "rear hood", () => hood(m, e, l));
    bodyExtras(m, l);
  });
  m.scope("running gear", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front half" : "rear half", () => {
        ponyUnit(m, e);
        driveUnit(m, e);
      });
  });
  return m;
}

// --- low level of detail ------------------------------------------------------------

/** The distant model: the centre body, both hoods, the frame, the running gear and the pantographs. */
export function obb1189Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const centre: LodShell = {
    y0: Y0, tip: [[Y0, CAB], [EAVE, CAB], [3.7, CAB + 0.4], [CROWN, CAB + 0.06]], hw: [[Y0, W], [EAVE, W], [3.7, W + 0.04], [CROWN, W - 0.36]],
    setback: [[Y0, CHAMFER], [CROWN, CHAMFER]],
    side: SIDE, end: SIDE, roof: "roof",
    sideWindows: windowBands([{ u: WINDOW, y: WIN_Y }], 0).map((w) => ({ ...w, mirror: true, optional: 2 })),
    endWindows: windowBands([{ u: [-FRONT_WIN.z[1], FRONT_WIN.z[1]], y: FRONT_WIN.y }], 0.4),
  };
  const hoods: LodShell[] = [-1, 1].map((e) => ({
    y0: HOOD_Y0, tip: [[HOOD_Y0, HOOD_HALF], [2.42, HOOD_HALF - 0.04], [2.6, HOOD_HALF - 0.32], [HOOD_TOP, HOOD_HALF - 1.4]], hw: [[HOOD_Y0, HOOD_W], [2.6, HOOD_W], [HOOD_TOP, HOOD_W - 0.25]],
    xc: e * HOOD_XC, ends: [e], side: HOOD_BANDS, end: HOOD_BANDS, roof: "paint",
  }));
  const p = s.pantograph!;
  const parts: LodPart[] = [
    { optional: 40, draw: (m) => m.scope("frame", () => lodSideBox(m, "black", [[-BEAM, 0.8], [BEAM, 0.8], [BEAM, 1.3], [-BEAM, 1.3]], -1.3, 1.3)) },
    { draw: (m) => m.scope("running gear", () => {
      for (const e of [-1, 1]) lodBogie(m, e * 4.6, 4.7, 1.3);
    }) },
    { draw: (m) => m.scope("raised pantograph", () => lodPantograph(m, { x: -p.x, roofY: p.roofY, baseY: p.baseY, h: 1, raised: true })) },
    { optional: 0, draw: (m) => m.scope("folded pantograph", () => lodPantograph(m, { x: p.x, roofY: p.roofY, baseY: p.baseY, h: -1, raised: false })) },
    { optional: 5, draw: (m) => m.scope("main switch", () => lodRoofBox(m, "roof", -0.45, 0.45, 0.32, 0.28, CROWN - 0.02, CROWN + 0.18)) },
  ];
  return fitLod({ palette: { ...KIT_PALETTE, ...s.palette }, shells: [centre, ...hoods], parts }, 100);
}

/** The registry entry (generator/atLocos.ts): 116 t, the 1,740 kW continuous rating, 75 km/h (the 1100.1 series). */
export const OBB1189_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-1189", title: "OBB 1189 Krokodil", build: obb1189, buildLod: obb1189Lod, params: OBB1189_PARAMS,
  game: { weight: 116, power: 1740, maxspeed: 75, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "obb-1189",
};
