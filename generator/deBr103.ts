// The DB class 103 express electric locomotive (proc-vehicle-db-103) on the box
// locomotive kit (boxLocoKit.ts) with its own profile, measured on the reference
// photographs (assets/db-103/SOURCES.md; docs/models/germany-trains.md):
//
// - the low, rounded nose: upright below the waist, leaning back over the
//   bonnet to the two-piece windscreen raked about 40 degrees, the cab roof a
//   dome; in plan a slightly bowed face whose corners round 0.5 - 0.9 m back
//   into the sides, so the windscreen's ends wrap into the corners;
// - the section: the lower body upright down to a skirt at 0.86 m that hides
//   the bogie frames, the upper walls leaning in above the waist;
// - the side: the cab window and the cab door behind the cab joint, then the
//   machine room's five bays of two windows each, the body joints;
// - the lower headlights in teardrop housings standing out of the face, the top
//   headlight, the number plate between the lower lamps; the buffers coming out
//   of the red front (no buffer beam);
// - the grey roof hood over the machine room with its louvres, the single-arm
//   pantographs on tall insulators near the cabs, the Co'Co' bogies;
// - three liveries: TEE (beige over purple red, the red stripe round the nose,
//   the cream line over the grey skirt), orient red (the light grey bib) and
//   traffic red (the white front band, the grey skirt).
//
// Only the production locomotives with the longer cab (103 216 - 245, 20.2 m
// over the buffers) are drawn; the numbers are those of photographed ones.

import { ngon, type MeshBuilder, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, kinks, lerpTable, onEnd, onSide, roundRect, setbackAt, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import type { Band } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (20.2 m, 103 216 - 245). */
const HALF = 10.1;
/** The nose's foremost point (at the lower headlights), |x|. */
const N = 9.48;
/** The skirt's bottom: the shell's lowest edge on the sides and the ends. */
const Y0 = 0.86;
/** The cab roof's crown. */
const CROWN = 3.81;
/** The waist: the top of the red lower body on the sides. */
const WAIST = 1.76;
/** The red stripe round the nose (TEE). */
const STRIPE: readonly [number, number] = [1.81, 1.94];
/** The windscreen's sill and head. */
const SCREEN: readonly [number, number] = [2.87, 3.42];
/** The lower headlights: |z|, y. */
const LAMP = { z: 0.88, y: 1.59 } as const;
/** The cab's rear joint on the side, |x|. */
const CAB_JOINT = 6.4;

/** The nose's centre line [y, |x|], bottom first. */
const TIP: Table = [
  // the face nearly upright (about 6 degrees) from the skirt to the sill, the windscreen about 30 degrees,
  // the roof's full height 1.4 m behind the sill (the user's true side view of 103 113-7)
  [Y0, N - 0.06], [1.25, N], [1.6, N], [1.94, N - 0.05], [2.6, N - 0.15],
  [SCREEN[0], N - 0.2], [SCREEN[1], N - 0.52], [3.6, N - 0.78], [3.72, N - 1.1], [CROWN, N - 1.6],
];
/** The half width [y, hw]: the skirt, the widest at the waist, the upper walls leaning in, the roof's curve. */
const HW: Table = [[Y0, 1.51], [1.2, 1.522], [WAIST, 1.53], [2.0, 1.525], [3.42, 1.42], [3.6, 1.3], [3.72, 1.1], [3.78, 0.85], [CROWN, 0.6]];
/** The nose corner's width across (m of z) and its depth back into the side (m of x), by height. */
const CORNER_Z: Table = [[Y0, 0.5], [1.94, 0.55], [SCREEN[0], 0.55], [SCREEN[1], 0.6], [CROWN, 0.5]];
const CORNER_X: Table = [[Y0, 0.45], [1.6, 0.5], [1.94, 0.62], [SCREEN[0], 0.95], [SCREEN[1], 0.7], [3.72, 0.7], [CROWN, 0.6]];
/** How far the face's middle bows ahead of the corners' start. */
const BOW = 0.05;
const ANGLES = [15, 30, 45, 60, 75, 90].map((a) => (a * Math.PI) / 180);

/** The end's plan at height y and half width w: a bowed middle, then an elliptic corner. */
function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const rz = Math.min(lerpTable(CORNER_Z, y), w * 0.9);
  const cx = lerpTable(CORNER_X, y);
  const flat = w - rz;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + rz * Math.sin(a), BOW + (cx - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the flat side wall ends at height y (the nose corner begins). */
const wallEnd = (y: number) => lerpTable(TIP, y) - lerpTable(CORNER_X, y);
/** The side wall's end over a height span, less a margin. */
const wallEndOver = (y0: number, y1: number, margin = 0.005) => Math.min(...[0, 0.25, 0.5, 0.75, 1].map((t) => wallEnd(y0 + t * (y1 - y0)))) - margin;

// --- liveries ----------------------------------------------------------------------

interface Logo {
  /** The frame, the field inside it and the letters. */
  frame: string;
  field: string;
  text: string;
}

interface Br103Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  /** The cab roofs' colour (the crown). */
  roof: string;
  number: string;
  sidePaint: readonly SideItem[];
  endPaint: readonly EndItem[];
  /** The DB emblem on the front (centre, height) and on the sides. */
  frontLogo: Logo & { y: number };
  sideLogo: Logo;
}

const GREY_SKIRT = c("#4b4f52", 0.6);
const HOOD = c("#5d6164", 0.75);
/** The 103's pantographs, insulator frames and roof line in red (TEE and orient red). */
const RED_PANTOGRAPH: MaterialSpec = { color: "#a3261f", metallic: 0.15, roughness: 0.6 };

/** The red stripe round the nose continued along the cab's side to its joint (TEE). */
const cabStripe: SideItem = { kind: "paint", name: "cab stripe", x: [CAB_JOINT, wallEndOver(STRIPE[0], STRIPE[1])], y: STRIPE, mat: "red", mirror: true };

const LIVERIES: Record<string, Br103Livery> = {
  tee: {
    title: "TEE",
    palette: { red: c("#7c1c2a"), beige: c("#dccb9d"), grey: GREY_SKIRT, plate: c("#7c1c2a"), roof: HOOD, pantograph: RED_PANTOGRAPH },
    // the purple red lower body down to the skirt's edge, the cream line in it 0.27 m up, beige above (103 113-7)
    side: [[Y0, 1.13, "red"], [1.13, 1.17, "beige"], [1.17, WAIST, "red"], [WAIST, 4.0, "beige"]],
    // the front red up to the waist, the beige line, the red stripe, beige above
    end: [[Y0, WAIST, "red"], [WAIST, STRIPE[0], "beige"], [STRIPE[0], STRIPE[1], "red"], [STRIPE[1], 4.0, "beige"]],
    roof: "beige",
    number: "103 245-7",
    sidePaint: [cabStripe],
    endPaint: [],
    frontLogo: { frame: "red", field: "beige", text: "red", y: 2.18 },
    sideLogo: { frame: "beige", field: "red", text: "beige" },
  },
  orientRed: {
    title: "Orient red",
    palette: { red: c("#c3352b"), bib: c("#d9dbd7"), white: c("#efefea"), plate: c("#c3352b"), roof: HOOD, pantograph: RED_PANTOGRAPH },
    side: [[Y0, 4.0, "red"]],
    end: [[Y0, 4.0, "red"]],
    roof: "red",
    number: "103 228-3",
    sidePaint: [],
    // the light grey bib under the windscreen, its lower edge dipping to a shallow point
    endPaint: [{ kind: "paint", name: "bib", z: [-1.2, 1.2], y: [1.9, 2.84], mat: "bib", poly: [[-1.2, 2.14], [-0.6, 1.99], [0, 1.9], [0.6, 1.99], [1.2, 2.14], [1.2, 2.84], [-1.2, 2.84]] }],
    frontLogo: { frame: "red", field: "bib", text: "red", y: 2.33 },
    sideLogo: { frame: "white", field: "red", text: "white" },
  },
  trafficRed: {
    title: "Traffic red",
    palette: { red: c("#e2001a"), white: c("#f1f1ef"), grey: c("#55595c", 0.6), plate: c("#e2001a"), roof: HOOD },
    side: [[Y0, 1.15, "grey"], [1.15, 4.0, "red"]],
    end: [[Y0, 4.0, "red"]],
    roof: "red",
    number: "103 233-3",
    sidePaint: [],
    // the white band across the front, the emblem on it
    endPaint: [{ kind: "paint", name: "front band", z: [-1.22, 1.22], y: [1.98, 2.3], mat: "white" }],
    frontLogo: { frame: "red", field: "white", text: "red", y: 2.14 },
    sideLogo: { frame: "white", field: "red", text: "white" },
  },
};

export const BR103_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Br103Livery => LIVERIES[resolveParams(BR103_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The machine room's five window bays: their centres and half width; the two rows. */
const BAYS = { centres: [-3.76, -1.88, 0, 1.88, 3.76], half: 0.87, rows: [[2.02, 2.56], [2.6, 3.19]] as const };
/** The body joints between the machine room's panels and behind the cabs. */
const JOINTS = [-CAB_JOINT, -2.82, 2.82, CAB_JOINT];

/** The DB emblem's outer size: width, height. */
const FRONT_LOGO = [0.56, 0.36] as const;
const SIDE_LOGO = [0.36, 0.23] as const;

/** The emblem's frame and field as rounded outlines (u across, v up) about (cu, cy). */
function logoRings(cu: number, cy: number, [w, h]: readonly [number, number]): [Ring, Ring] {
  const t = h * 0.12;
  return [
    roundRect(cu - w / 2, cu + w / 2, cy - h / 2, cy + h / 2, h * 0.18),
    roundRect(cu - w / 2 + t, cu + w / 2 - t, cy - h / 2 + t, cy + h / 2 - t, h * 0.12),
  ];
}

function sideLogo(cx: number, cy: number, l: Logo): SideItem[] {
  const [frame, field] = logoRings(cx, cy, SIDE_LOGO);
  const x = [cx - SIDE_LOGO[0] / 2, cx + SIDE_LOGO[0] / 2] as const, y = [cy - SIDE_LOGO[1] / 2, cy + SIDE_LOGO[1] / 2] as const;
  return [
    { kind: "paint", name: "emblem frame", x, y, poly: frame, mat: l.frame, layer: 2 },
    { kind: "paint", name: "emblem field", x, y, poly: field, mat: l.field, layer: 3 },
  ];
}

function frontLogo(cy: number, l: Logo): EndItem[] {
  const [frame, field] = logoRings(0, cy, FRONT_LOGO);
  const z = [-FRONT_LOGO[0] / 2, FRONT_LOGO[0] / 2] as const, y = [cy - FRONT_LOGO[1] / 2, cy + FRONT_LOGO[1] / 2] as const;
  return [
    { kind: "paint", name: "emblem frame", z, y, poly: frame, mat: l.frame, layer: 2 },
    { kind: "paint", name: "emblem field", z, y, poly: field, mat: l.field, layer: 3 },
  ];
}

function spec(l: Br103Livery): LocoSpec {
  const windows: SideItem[] = [];
  BAYS.centres.forEach((cx, i) =>
    // the louvred panes: light grey with two silver louvre bars each (the kit's grille), square cornered
    BAYS.rows.forEach(([y0, y1], j) => windows.push({ kind: "grille", name: `machine room window ${i + 1}${j ? " upper" : " lower"}`, x: [cx - BAYS.half, cx + BAYS.half], y: [y0, y1], mat: "rim", slats: "h", pitch: (y1 - y0) / 3 })));
  const joints: SideItem[] = JOINTS.map((x, i) => ({ kind: "paint", name: `body joint ${i + 1}`, x: [x - 0.012, x + 0.012], y: [Math.abs(x) > 5 ? 1.2 : WAIST + 0.02, 3.5], mat: "groove", layer: 1 }));
  return {
    palette: {
      groove: c("#3a3536", 0.7), rim: c("#a7acae", 0.4), louvre: c("#8e9395", 0.55), hoodLouvre: c("#2e3134", 0.8),
      // the running gear dark, as on the photographs
      bogie: c("#262729", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: l.roof,
    buffers: HALF,
    beam: N - 0.12,
    bufferY: 1.03,
    // hidden in the body: the skirt hangs below the underframe's sides
    frame: { y0: 0.88, y1: 0.95, half: 8.9, hw: 1.2, mat: "underframe" },
    bogies: [-5.7, 5.7].map((xc) => ({ xc, axles: [-2.25, 0, 2.25], wheelR: 0.625, frameTop: 0.875 })),
    pantograph: { kind: "singleArm", x: 5.7, roofY: CROWN, baseY: CROWN + 0.27 },
    hvLine: { x: 4.45, y: 4.03, z: 0 },
    sideItems: [
      { kind: "door", name: "cab door", x: [5.3, 6.0], y: [1.2, 3.35], rails: true, mirror: true },
      ...windows,
      ...joints,
      ...l.sidePaint,
      ...sideLogo(0, 1.54, l.sideLogo),
      { kind: "plate", name: "number", x: [-0.42, 0.42], y: [1.24, 1.36] },
    ],
    endItems: [
      ...l.endPaint,
      { kind: "paint", name: "windscreen pillar", z: [-0.03, 0.03], y: SCREEN, mat: "rim", layer: 1 },
      { kind: "window", name: "windscreen left", z: [0.012, 0.99], y: SCREEN, mat: "rim", wiper: true },
      { kind: "window", name: "windscreen right", z: [-0.99, -0.012], y: SCREEN, mat: "rim", wiper: true },
      { kind: "lamp", name: "top headlight", z: [-0.1, 0.1], y: [2.56, 2.76], r: 0.085 },
      ...frontLogo(l.frontLogo.y, l.frontLogo),
      { kind: "plate", name: "number", z: [-0.36, 0.36], y: [1.5, 1.68] },
    ],
    roofItems: [{ name: "roof hood", x: [-4.95, 4.95], w: [1.22, 0.8], y: [3.6, 3.95], mat: "roof" }],
    underItems: [[-2.55, 2.55, 0.42, 0.86, 1.2], [-1.6, 1.6, 0.3, 0.42, 0.9]],
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** A quad facing `out`. */
function facing(m: MeshBuilder, mat: string, q: readonly [Vec3, Vec3, Vec3, Vec3], out: Vec3): void {
  const [a, b, cc] = q;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0) m.quad(mat, q[0], q[1], q[2], q[3]);
  else m.quad(mat, q[3], q[2], q[1], q[0]);
}

/** The cab side window: its rear edge upright, its front edge following the nose corner, the corners cut. */
const CAB_WINDOW = { x: 6.8, y: [2.84, 3.46] as const, margin: 0.1, cut: 0.06, round: 0.16 };

function cabWindowRing(inset: number, e: number): Ring {
  const [y0, y1] = [CAB_WINDOW.y[0] + inset, CAB_WINDOW.y[1] - inset];
  const x0 = CAB_WINDOW.x + inset;
  const [fb, ft] = [wallEnd(CAB_WINDOW.y[0]) - CAB_WINDOW.margin - inset, wallEnd(CAB_WINDOW.y[1]) - CAB_WINDOW.margin - inset];
  const k = CAB_WINDOW.cut;
  // the top front corner rounded about a centre R in from the front edge and the head
  const R = CAB_WINDOW.round;
  const fr = fb + ((ft - fb) * (y1 - R - y0)) / (y1 - y0);
  const arc = [0, 30, 60, 90].map((a) => [fr - R + R * Math.cos((a * Math.PI) / 180), y1 - R + R * Math.sin((a * Math.PI) / 180)] as [number, number]);
  const ring: Ring = [[x0 + k, y0], [fb - k, y0], [fb, y0 + k], ...arc, [x0 + k, y1], [x0, y1 - k], [x0, y0 + k]];
  return e > 0 ? ring : ring.map(([u, v]) => [-u, v] as [number, number]).reverse();
}

function cabWindows(m: MeshBuilder, sp: ShellSpec): void {
  const vB = kinks(TIP, HW);
  m.scope("cab windows", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          m.scope("frame", () => surfacePanel(m, "rim", at, n, cabWindowRing(0, e), -0.01, 0.014, [], vB));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, cabWindowRing(0.04, e), -0.005, 0.022, [], vB));
        });
  });
}

/** "DB" in the emblems' fields, front and rear, on both sides. */
function emblemLetters(m: MeshBuilder, sp: ShellSpec, l: Br103Livery): void {
  const word = (h: number) => ({ h, w: wordWidth("DB", h, { weight: 0.2 }) });
  m.scope("emblem letters", () => {
    const f = word(FRONT_LOGO[1] * 0.56);
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      // seen from ahead +z is on the reader's left: read toward -z at the front
      const tris = letters("DB", e > 0 ? f.w / 2 : -f.w / 2, l.frontLogo.y - f.h / 2, f.h, e > 0, { weight: 0.2 });
      m.scope(e > 0 ? "front" : "rear", () => m.facets(l.frontLogo.text, tris.map(([u, v]) => at(u, v, 0.0115)), [e, 0, 0]));
    }
    const s = word(SIDE_LOGO[1] * 0.56);
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      // on the right side (+z) the reader's right is +x
      const tris = letters("DB", sd > 0 ? -s.w / 2 : s.w / 2, 1.54 - s.h / 2, s.h, sd < 0, { weight: 0.2 });
      m.scope(sd > 0 ? "right" : "left", () => m.facets(l.sideLogo.text, tris.map(([u, v]) => at(u, v, 0.0115)), [0, 0, sd]));
    }
  });
}

/**
 * The lower headlights' housings: a short drum standing out of the face with the
 * lamp in a bright rim, and a tapering tail lying along the face out into the
 * corner (the 103's teardrop lamp housings).
 */
function lampHousings(m: MeshBuilder, sp: ShellSpec): void {
  const faceX = (z: number, y: number) => sp.tip(y) - setbackAt(sp, y, z);
  const { z: lz, y: ly } = LAMP;
  m.scope("lamp housings", () => {
    for (const e of [-1, 1])
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "right" : "left"}`, () => {
          const z = s * lz;
          const f = faceX(lz, ly);
          const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
          const drum = ngon(12, 0.15, 0, z, ly);
          const [d0, d1] = along(f - 0.08, f + 0.1);
          m.sweep("red", "x", drum, d0, drum, d1);
          const rim = ngon(12, 0.13, 0, z, ly);
          const [r0, r1] = along(f + 0.09, f + 0.108);
          m.scope("rim", () => m.sweep("rim", "x", rim, r0, rim, r1));
          const lens = ngon(12, 0.105, 0, z, ly);
          const [l0, l1] = along(f + 0.1, f + 0.116);
          m.scope("lens", () => m.sweep("lampHead", "x", lens, l0, lens, l1));
          // the tail: rings in (x, y) swept outward along z, following the face
          const ring = (zz: number, r: number, ahead: number): Ring => ngon(8, r, 0, e * (faceX(zz, ly) + ahead), ly);
          const zs = [lz, 1.1, 1.33];
          m.scope("tail", () => {
            m.sweep("red", "z", ring(zs[0]!, 0.13, -0.035), s * zs[0]!, ring(zs[1]!, 0.085, -0.03), s * zs[1]!, false);
            m.sweep("red", "z", ring(zs[1]!, 0.085, -0.03), s * zs[1]!, ring(zs[2]!, 0.025, -0.01), s * zs[2]!);
          });
        });
  });
}

/** The louvres along both slopes of the grey roof hood. */
function hoodLouvres(m: MeshBuilder): void {
  const [w0, w1] = [1.22, 0.8], [y0, y1] = [3.6, 3.95];
  const len = Math.hypot(w0 - w1, y1 - y0);
  const n = [(y1 - y0) / len, (w0 - w1) / len] as const; // outward (z, y) on the +z slope
  const pt = (x: number, y: number, s: number, d: number): Vec3 => {
    const w = w0 + ((y - y0) * (w1 - w0)) / (y1 - y0);
    return [x, y + d * n[1], s * (w + d * n[0])];
  };
  m.scope("hood louvres", () => {
    for (const s of [-1, 1])
      for (let i = 0; i < 6; i++) {
        const x0 = -4.65 + i * 1.57, x1 = x0 + 1.37;
        m.scope(`${s > 0 ? "right" : "left"} ${i + 1}`, () => {
          const [ya, yb] = [3.77, 3.91];
          facing(m, "hoodLouvre", [pt(x0, ya, s, 0.006), pt(x1, ya, s, 0.006), pt(x1, yb, s, 0.006), pt(x0, yb, s, 0.006)], [0, n[1], s * n[0]]);
        });
      }
  });
}

/** The DB 103 in a livery. */
export function db103(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    lampHousings(m, sp);
    cabWindows(m, sp);
    emblemLetters(m, sp, l);
  });
  m.scope("roof equipment", () => hoodLouvres(m));
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function db103Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v)));
}
