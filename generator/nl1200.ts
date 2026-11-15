// The NS class 1200 (proc-vehicle-ns-1200, Werkspoor / Heemaf 1951 - 1953 to a
// Baldwin-Westinghouse design): a Co'Co' 1,500 V DC electric with an American
// body, on the box locomotive kit (boxLocoKit.ts) for the cab and the machine
// room, with its own "bulldog" noses, skirts and cast bogies. Matched to the
// photographs in assets/ns-1200 (SOURCES.md; docs/models/netherlands-trains.md):
// the museum's 1201 (side three-quarter, turquoise), 1201 at Amersfoort (front
// three-quarter), the works photos of 1207 (nose close-up) and 1222 (head-on),
// 1211, 1220 and 1208 (yellow and grey) and 1218 (the shape, red-brown), and the
// published figures (18.086 m over the buffers, 108 t, rail to roof 4.064 m):
//
// - each end: the low nose ("bulldog") 1.8 m long in front of the cab, its flat
//   face with rounded corners, its top rounding over and rising gently back to
//   the cab; the nose door in the middle of the face, the two headlights low on
//   either side, the marker lamps at the top corners; the deep buffer beam
//   standing 0.3 m proud of the face with the buffers and the screw coupling;
// - the cab front behind the nose raked back, with the two wide windscreens;
// - each side: the cab window (two panes) with a vent below it, the cab door
//   with its narrow window right behind it over the bogie's middle axle, the
//   machine-room grilles (`blue`) or windows (`yellowGrey`) next to it, the
//   long blank middle; the skirts: the nose's down to the beam, the middle one
//   between the bogies hanging below the body;
// - the two cast Co bogies with their swing equalizers under the axle boxes
//   (pivots 9.2 m apart, axles 1.75 m apart, 1,100 mm wheels);
// - the two large diamond pantographs over the cabs (the rear raised) and the
//   roof line between them;
// - `blue`: the turquoise as delivered in 1951 (the museum's 1201 restored): the
//   pale turquoise with the navy line that runs round the nose into rings round
//   the headlights, the red buffer beam with the number, the winged emblem on the
//   nose door, the number roundel in the middle of each side;
// - `yellowGrey`: NS's yellow and grey of the 1970s (1220; 1208, 1211): the
//   yellow nose face and cab front, the grey nose sides and body, the yellow band
//   along the top of the sides (the doors grey), the black NS logo and the white
//   number near one end of each side, the black number on the nose door, the
//   added top lamp and the paired lamps and red tail lights on the face.

import type { MaterialSpec, MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type BogieSpec, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, numberOn, onSide, rect, roundRect, surfacePanel, sweepZ, type Place } from "./czElectricKit.ts";
import { coil, tubeX, type Band } from "./cd163.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (18.086 m), the buffer beam's face, the nose's face. */
const BUF = 9.043;
const BEAM = 8.42;
const NF = 8.12;
/** The nose's length and the cab front's foot behind it. */
const NOSE_LEN = 1.8;
const NC = NF - NOSE_LEN;
/** The body's bottom (over the bogies), the sides' top, the roof's crown (4.064 m over the rail). */
const Y0 = 1.5;
const SIDE_TOP = 3.8;
const CROWN = 4.06;
/** The body's half width. */
const W = 1.49;
/** The nose top: at the face's rounding and at the cab. */
const NT_F = 3.56;
const NT_C = 3.6;
/** The nose's radii: its face's vertical corners, the face's top edge, the top's long edges. */
const RC = 0.25;
const RT = 0.3;
const RS = 0.3;
/** The buffer beam: bottom, the red band's top (blue), top. */
const BEAM_Y: readonly [number, number, number] = [0.75, 1.31, 1.68];
/** The windscreens' sill and head. */
const SCREEN: readonly [number, number] = [3.63, 3.965];

/** The half width: upright sides, the roof curving to a broad crown. */
const HW: Table = [[Y0, W], [SIDE_TOP, W], [3.87, W - 0.03], [3.93, W - 0.09], [3.99, W - 0.2], [4.03, W - 0.36], [4.05, W - 0.6], [CROWN, W - 0.85]];
/** The cab front: upright inside the nose, raked back from the nose top to the roof. */
const TIP_CAB: Table = [[Y0, NC], [NT_C, NC], [3.97, NC - 0.32], [4.01, NC - 0.38], [4.04, NC - 0.46], [CROWN, NC - 0.6]];
/** The distant model's end: the nose and the cab front in one profile. */
const TIP_LOD: Table = [[Y0, NF], [NT_F - RT, NF], [NT_F - 0.12, NF - 0.03], [NT_F - 0.03, NF - 0.12], [NT_F, NF - RT], [NT_C, NC], ...TIP_CAB.slice(2)];

const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);
/** The end's plan: square corners under the nose top (the nose covers them), 0.2 m round on the cab above. */
function cabPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(y <= NT_C + 1e-6 ? 0.01 : 0.2, w * 0.5);
  const flat = w - r;
  return [[0, 0], [flat, 0], ...ANGLES.map((a) => [flat + r * Math.sin(a), r * (1 - Math.cos(a))] as const)];
}
/** The distant model's plan: the nose's round corners below the nose top. */
function lodPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(y <= NT_C + 1e-6 ? RC : 0.2, w * 0.5);
  const flat = w - r;
  return [[0, 0], [flat, 0], ...ANGLES.map((a) => [flat + r * Math.sin(a), r * (1 - Math.cos(a))] as const)];
}

// --- liveries ------------------------------------------------------------------------

interface Ns1200Livery {
  title: string;
  /** The turquoise of 1951 (navy line, red beam) or the yellow and grey. */
  turquoise: boolean;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  roof: string;
  /** The nose's colour, its sides' (when they differ), the skirts', the beam's (bottom, top). */
  nose: string;
  noseSide?: string;
  skirt: string;
  beam: readonly [string, string];
  bogie: string;
  number: string;
}

/** The navy line (blue): its bottom and top. */
const LINE: readonly [number, number] = [2.15, 2.22];
/** The yellow band along the top of the sides (yellowGrey): its bottom. */
const BAND_Y = 3.05;

const LIVERIES: Record<string, Ns1200Livery> = {
  blue: {
    title: "NS blue",
    turquoise: true,
    palette: { turq: c("#9dbcab", 0.45), navy: c("#1f2f6b", 0.5), roofT: c("#8ea698", 0.7), red: c("#cc3320", 0.55), brass: { color: "#b8955a", metallic: 0.6, roughness: 0.35 }, bogieT: c("#7c8582", 0.65) },
    side: [[Y0, LINE[0], "turq"], [LINE[0], LINE[1], "navy"], [LINE[1], CROWN, "turq"]],
    end: [[Y0, CROWN, "turq"]],
    roof: "roofT",
    nose: "turq",
    skirt: "turq",
    beam: ["red", "turq"],
    bogie: "bogieT",
    number: "1201",
  },
  yellowGrey: {
    title: "NS yellow, grey",
    turquoise: false,
    palette: { grey: c("#56606a", 0.55), yellow: c("#ffc917", 0.5), roofG: c("#41474d", 0.7), logo: c("#1c1d20", 0.6), apron: c("#3a3e42", 0.7), bogieG: c("#2f3235", 0.7) },
    side: [[Y0, BAND_Y, "grey"], [BAND_Y, 3.85, "yellow"], [3.85, CROWN, "roofG"]],
    end: [[Y0, 3.99, "yellow"], [3.99, CROWN, "roofG"]],
    roof: "roofG",
    nose: "yellow",
    noseSide: "grey",
    skirt: "grey",
    beam: ["apron", "apron"],
    bogie: "bogieG",
    number: "1220",
  },
};

export const NS1200_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Ns1200Livery => LIVERIES[resolveParams(NS1200_PARAMS, v).livery!]!;

// --- the cab and the machine room on the kit ----------------------------------------------

/** The cab door (front half; mirrored to the rear) over the bogie's middle axle, its narrow window. */
const DOOR: readonly [number, number] = [4.3, 4.97];
/** The bogies' pivots, the axles about them, the wheels' radius. */
const BOGIE_X = 4.6;
const AXLES = [-1.75, 0, 1.75];
const WHEEL_R = 0.55;
const FRAME_TOP = 1.02;
/** The pantographs' |x| over the cabs. */
const PANTO_X = 4.7;
/** The NS logo and the side number (yellowGrey): |x| of their centre, near the end on the reader's left. */
const LOGO_X = 1.9;
const LOGO_W = 1.0;
const LOGO_H = 0.4;

function sideItems(l: Ns1200Livery): SideItem[] {
  const items: SideItem[] = [
    { kind: "window", name: "cab window front pane", x: [5.62, 6.1], y: [3.02, 3.62], mat: "rubber", r: 0.06, mirror: true },
    { kind: "window", name: "cab window rear pane", x: [5.07, 5.58], y: [3.02, 3.62], mat: "rubber", r: 0.06, mirror: true },
    { kind: "grille", name: "cab vent", x: [5.86, 6.0], y: [2.8, 2.94], mat: "slat", slats: "h", pitch: 0.045, mirror: true },
    { kind: "door", name: "cab door", x: DOOR, y: [Y0 + 0.05, 3.62], rails: true, mirror: true },
    { kind: "window", name: "cab door window", x: [4.66, 4.86], y: [2.95, 3.45], mat: "rubber", r: 0.04, mirror: true },
  ];
  if (l.turquoise) {
    // the machine room's louvred panels: three over two at each end
    for (const [i, x] of ([[3.66, 4.2], [3.08, 3.62], [2.5, 3.04]] as const).entries())
      items.push({ kind: "grille", name: `upper grille ${i + 1}`, x, y: [2.9, 3.45], mat: "slat", slats: "h", pitch: 0.085, r: 0.02, mirror: true });
    for (const [i, x] of ([[3.37, 4.2], [2.5, 3.33]] as const).entries())
      items.push({ kind: "grille", name: `lower grille ${i + 1}`, x, y: [2.5, 2.84], mat: "slat", slats: "h", pitch: 0.1, r: 0.02, mirror: true });
    // the number roundel on the line in the middle of the side
    items.push(
      { kind: "paint", name: "roundel", x: [-0.13, 0.13], y: [2.055, 2.315], mat: "navy", layer: 1, poly: ngon(14, 0.13, 0, 0, 2.185) },
      { kind: "paint", name: "roundel field", x: [-0.1, 0.1], y: [2.085, 2.285], mat: "rim", layer: 2, poly: ngon(14, 0.1, 0, 0, 2.185) },
    );
  } else {
    items.push(
      { kind: "window", name: "machine room window", x: [2.62, 4.18], y: [3.15, 3.62], mat: "rubber", r: 0.05, mirror: true },
      { kind: "window", name: "lower window 1", x: [3.42, 4.18], y: [2.72, 2.98], mat: "rubber", r: 0.04, mirror: true },
      { kind: "window", name: "lower window 2", x: [2.62, 3.38], y: [2.72, 2.98], mat: "rubber", r: 0.04, mirror: true },
      // the doors stay grey through the yellow band
      { kind: "paint", name: "door grey", x: DOOR, y: [BAND_Y - 0.01, 3.66], mat: "grey", layer: 1, mirror: true },
    );
  }
  return items;
}

function endItems(): EndItem[] {
  return [
    { kind: "window", name: "windscreen left", z: [0.07, 1.22], y: SCREEN, mat: "rubber", wiper: true },
    { kind: "window", name: "windscreen right", z: [-1.22, -0.07], y: SCREEN, mat: "rubber", wiper: true },
  ];
}

function spec(l: Ns1200Livery): LocoSpec {
  return {
    palette: {
      rim: { color: "#c3c7c9", metallic: 0.5, roughness: 0.35 }, slat: c("#5d6265", 0.6), louvre: c("#2b2e31", 0.8), seam: c("#2a2d30", 0.8),
      frame: c("#33363a", 0.75), bogie: c("#3a3d40", 0.75), steel: c("#4a4d51", 0.5), spring: c("#2f3133", 0.7), wheel: c("#36383b", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP_CAB,
    hw: HW,
    endPlan: cabPlan,
    corner: "side",
    side: l.side,
    end: l.end,
    roof: l.roof,
    buffers: BUF,
    beam: BEAM,
    bufferY: 1.06,
    bufferHead: "rect",
    frame: { y0: 1.28, y1: Y0, half: NF - 0.1, hw: 1.38, mat: "frame" },
    // drawn here (coBogie), the kit's only for the distant model
    bogies: [],
    pantograph: { kind: "diamond", x: PANTO_X, roofY: CROWN, baseY: CROWN + 0.32 },
    sideItems: sideItems(l),
    endItems: endItems(),
    roofItems: [{ name: "roof hatch", x: [-3.0, 3.0], w: [0.5, 0.44], y: [CROWN - 0.02, CROWN + 0.07], mat: l.roof }],
    underItems: [[-1.9, 1.9, 0.84, 1.28, 1.12]],
    number: l.number,
  };
}

// --- the noses ------------------------------------------------------------------------

/** How far a round edge of radius r sets the surface back at distance d from its start. */
const inset = (r: number, d: number): number => (d >= r ? 0 : r - Math.sqrt(r * r - (r - d) * (r - d)));
/** The distances behind the face where the nose's sections are taken. */
const NOSE_D = [0, 0.012, 0.04, 0.085, 0.145, 0.21, RC, RT, NOSE_LEN];
/** The nose's half width and top at distance d behind the face. */
const noseW = (d: number) => W - inset(RC, d);
const noseTop = (d: number) => (d < RT ? NT_F - inset(RT, d) : NT_F + ((NT_C - NT_F) * (d - RT)) / (NOSE_LEN - RT));

/** The nose's cross-section (z, y): upright sides, the top's long edges rounded. */
function section(w: number, top: number): Ring {
  const out: Array<[number, number]> = [[-w, Y0], [w, Y0]];
  for (let i = 0; i <= 4; i++) {
    const a = (i * Math.PI) / 8;
    out.push([w - RS + RS * Math.cos(a), top - RS + RS * Math.sin(a)]);
  }
  for (let i = 4; i >= 0; i--) {
    const a = (i * Math.PI) / 8;
    out.push([-(w - RS + RS * Math.cos(a)), top - RS + RS * Math.sin(a)]);
  }
  return out;
}

/** The nose's plan from the face's centre out round the corner and back along the side: (d behind the face, z). */
const PERIM: ReadonlyArray<readonly [number, number]> = [[0, 0], ...NOSE_D.filter((d) => d <= RC).map((d) => [d, noseW(d)] as const), [NOSE_LEN, W]];
const PERIM_U: number[] = PERIM.reduce<number[]>((acc, p, i) => (i === 0 ? [0] : [...acc, acc[i - 1]! + Math.hypot(p[0] - PERIM[i - 1]![0], p[1] - PERIM[i - 1]![1])]), []);
/** Where the corner ends and the straight side begins, and the whole run. */
const U_SIDE = PERIM_U[PERIM_U.length - 2]!;
const U_END = PERIM_U[PERIM_U.length - 1]!;
/** The segment normals (d, z) of the plan, outward. */
const segN = (i: number): [number, number] => {
  const [a, b] = [PERIM[i]!, PERIM[i + 1]!];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
};

/** A place on the nose's face and sides at end e, side s: u along the plan from the face's centre. */
function onNose(e: number, s: number): Place {
  return (u, y, dd) => {
    let i = 0;
    while (i < PERIM_U.length - 2 && u > PERIM_U[i + 1]! + 1e-9) i++;
    const t = (u - PERIM_U[i]!) / (PERIM_U[i + 1]! - PERIM_U[i]!);
    const [a, b] = [PERIM[i]!, PERIM[i + 1]!];
    let n = segN(i);
    // at a vertex, the mean of the two segments' normals
    if (t < 1e-6 && i > 0) { const m = segN(i - 1); n = [(n[0] + m[0]) / 2, (n[1] + m[1]) / 2]; }
    if (t > 1 - 1e-6 && i < PERIM.length - 2) { const m = segN(i + 1); n = [(n[0] + m[0]) / 2, (n[1] + m[1]) / 2]; }
    const d = a[0] + t * (b[0] - a[0]) + n[0] * dd;
    const z = a[1] + t * (b[1] - a[1]) + n[1] * dd;
    return [e * (NF - d), y, s * z];
  };
}
/** A place on the flat face of end e: u = z. */
const onFace = (e: number): Place => (z, y, dd) => [e * (NF + dd), y, z];

/** Paint on a surface, `layer` deep. */
const paintOn = (m: MeshBuilder, mat: string, at: Place, n: Vec3, poly: Ring, layer: number, uB: readonly number[] = []) => {
  const d = 0.003 + 0.002 * layer;
  surfacePanel(m, mat, at, n, poly, d - 0.002, d, uB);
};

/** A lamp on the face: rim and lens. */
function lamp(m: MeshBuilder, at: Place, n: Vec3, z: number, y: number, r: number, lens = "lampHead"): void {
  m.scope("rim", () => surfacePanel(m, "rim", at, n, ngon(12, r + 0.03, 0, z, y), -0.01, 0.025));
  m.scope("lens", () => surfacePanel(m, lens, at, n, ngon(12, r, 0, z, y), -0.005, 0.035));
}

/** The NS logo's strokes about its centre (u right, v up), as in nl1100.ts. */
function logoTris(u0: number, v0: number, flip: boolean): Array<[number, number]> {
  const t = LOGO_H * 0.17;
  const a = LOGO_W / 2, b = LOGO_H / 2 - t / 2, k = a - LOGO_H * 0.42;
  const lines: Array<Array<readonly [number, number]>> = [
    [[a - 0.06, 0.03], [k + 0.01, b], [-k, b], [-a, 0.0], [-k + 0.05, -b + 0.12]],
    [[-a + 0.06, -0.03], [-k - 0.01, -b], [k, -b], [a, 0.0], [k - 0.05, b - 0.12]],
    [[-a + 0.2, 0.06], [-0.08, 0.06], [0.08, -0.06], [a - 0.2, -0.06]],
  ];
  const out: Array<[number, number]> = [];
  for (const line of lines)
    for (let i = 1; i < line.length; i++) {
      const [p, q] = [line[i - 1]!, line[i]!];
      const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
      const ux = (dx / len) * t * 0.5, uy = (dy / len) * t * 0.5, nx = -uy, ny = ux;
      const pts: Array<[number, number]> = [[p[0] - ux + nx, p[1] - uy + ny], [q[0] + ux + nx, q[1] + uy + ny], [q[0] + ux - nx, q[1] + uy - ny], [p[0] - ux - nx, p[1] - uy - ny]];
      const P = pts.map(([u, v]) => [u0 + (flip ? -u : u), v0 + v] as [number, number]);
      out.push(...(flip ? [P[0]!, P[2]!, P[1]!, P[0]!, P[3]!, P[2]!] : [P[0]!, P[1]!, P[2]!, P[0]!, P[2]!, P[3]!]));
    }
  return out;
}

/** One nose at end e: the shell, its paint and its fittings. */
function nose(m: MeshBuilder, l: Ns1200Livery, e: number): void {
  const X = (d: number) => e * (NF - d);
  m.scope("shell", () => {
    for (let i = 1; i < NOSE_D.length; i++) {
      const [d0, d1] = [NOSE_D[i - 1]!, NOSE_D[i]!];
      m.sweep(l.nose, "x", section(noseW(d0), noseTop(d0)), X(d0), section(noseW(d1), noseTop(d1)), X(d1), false);
    }
    // the face: the front section, fan-triangulated
    const f = section(noseW(0), noseTop(0)).map(([z, y]): Vec3 => [X(0), y, z]);
    const pts: Vec3[] = [];
    for (let i = 1; i + 1 < f.length; i++) pts.push(f[0]!, f[i]!, f[i + 1]!);
    m.facets(l.nose, pts, [e, 0, 0]);
  });
  const face = onFace(e);
  const fn: Vec3 = [e, 0, 0];
  // seen from ahead the reader's right is -z at the front, +z at the rear
  const rz = (z: number) => -e * z;
  const flip = e > 0;
  m.scope("paint", () => {
    for (const s of [-1, 1]) {
      const at = onNose(e, s);
      const n: Vec3 = [e, 0, s];
      m.scope(s > 0 ? "right" : "left", () => {
        if (l.noseSide) paintOn(m, l.noseSide, at, n, rect(U_SIDE + 0.005, Y0, U_END, 3.22), 0);
        if (l.turquoise) {
          // the navy line from the side round the corner into the headlight's ring
          paintOn(m, "navy", at, n, rect(1.02 + 0.16, LINE[0], U_END, LINE[1]), 0, PERIM_U);
        }
      });
    }
  });
  m.scope("fittings", () => {
    for (const s of [-1, 1]) {
      const z = s * 1.0;
      m.scope(s > 0 ? "right" : "left", () => {
        if (l.turquoise) {
          paintOn(m, "navy", face, fn, ngon(16, 0.2, 0, z, 2.02), 1);
          paintOn(m, "turq", face, fn, ngon(16, 0.155, 0, z, 2.02), 2);
          m.scope("headlight", () => lamp(m, face, fn, z, 2.02, 0.115));
          m.scope("marker lamp", () => lamp(m, face, fn, s * 0.98, 3.04, 0.065));
        } else {
          m.scope("lamp upper", () => lamp(m, face, fn, z * 0.98, 2.25, 0.08));
          m.scope("headlight", () => lamp(m, face, fn, z * 0.98, 1.95, 0.095));
          m.scope("tail lamp", () => lamp(m, face, fn, s * 1.2, 1.95, 0.045, "lampRed"));
        }
        // the grab rail beside the door
        const zr = s * 0.52, xr = e * (NF + 0.07);
        m.scope("grab rail", () => {
          m.rod("steel", [xr, 1.9, zr], [xr, 3.12, zr], 0.016, 6);
          for (const y of [1.95, 3.07]) block(m, "steel", ...(e > 0 ? [NF - 0.01, NF + 0.07] as [number, number] : [-NF - 0.07, -NF + 0.01] as [number, number]), y - 0.012, y + 0.012, zr - 0.012, zr + 0.012);
        });
        // the round lamp high on the nose's side
        const at = onNose(e, s);
        const u = U_SIDE + 0.32;
        m.scope("side lamp", () => {
          surfacePanel(m, "rim", at, [0, 0, s], ngon(12, 0.08, 0, u, 3.0), -0.01, 0.014);
          surfacePanel(m, "glass", at, [0, 0, s], ngon(12, 0.05, 0, u, 3.0), -0.005, 0.022);
        });
      });
    }
    // the nose door: a panel with its seams, rounded at the top
    m.scope("door", () => {
      const door = roundRect(-0.42, 0.42, 1.74, 3.2, 0.08);
      surfacePanel(m, l.nose, face, fn, door, -0.005, 0.008);
      for (const q of [rect(-0.415, 1.745, 0.415, 1.76), rect(-0.415, 1.76, -0.4, 3.1), rect(0.4, 1.76, 0.415, 3.1), rect(-0.34, 3.18, 0.34, 3.195)])
        surfacePanel(m, "seam", face, fn, q, 0.006, 0.01);
      if (l.turquoise) m.scope("louvre", () => {
        const [za, zb] = [rz(0.02), rz(0.3)].sort((a, b) => a - b) as [number, number];
        surfacePanel(m, "louvre", face, fn, rect(za, 2.82, zb, 3.05), 0.006, 0.011);
        for (const y of [2.86, 2.92, 2.98]) surfacePanel(m, l.nose, face, fn, rect(za + 0.02, y, zb - 0.02, y + 0.03), 0.01, 0.016);
      });
    });
    if (l.turquoise) {
      m.scope("emblem", () => {
        paintOn(m, "brass", face, fn, [[-0.3, 2.5], [0.3, 2.5], [0.24, 2.6], [-0.24, 2.6]], 4);
        paintOn(m, "brass", face, fn, ngon(14, 0.1, 0, 0, 2.52), 5);
        paintOn(m, "red", face, fn, ngon(14, 0.065, 0, 0, 2.52), 6);
        paintOn(m, "brass", face, fn, rect(-0.065, 2.64, 0.065, 2.78), 4);
      });
    } else {
      m.scope("top lamp", () => lamp(m, face, fn, 0, 3.08, 0.07));
      m.scope("number", () => {
        const h = 0.2, w = wordWidth(l.number, h, { weight: 0.18 });
        const tris = letters(l.number, flip ? w / 2 : -w / 2, 2.02, h, flip, { weight: 0.18 });
        m.facets("logo", tris.map(([u, v]) => face(u, v, 0.012)), fn);
      });
    }
  });
  // the buffer beam, 0.3 m proud of the face, and the skirts down to it on the nose's sides
  m.scope("buffer beam", () => {
    const [a, b] = e > 0 ? [NF - 0.5, BEAM] : [-BEAM, -NF + 0.5];
    block(m, l.beam[0], a, b, BEAM_Y[0], BEAM_Y[1], -1.47, 1.47);
    block(m, l.beam[1], a, b, BEAM_Y[1], BEAM_Y[2], -1.47, 1.47);
    if (l.turquoise) {
      const at: Place = (z, y, dd) => [e * (BEAM + dd), y, z];
      m.scope("number", () => numberOn(m, at, fn, l.number, 0, 1.12, 0.17, 0.004, flip));
    }
  });
  m.scope("nose skirts", () => {
    const x0 = NF - 1.25, r = 0.35;
    const q: Array<[number, number]> = [[NF - 0.3, Y0 + 0.02], [x0, Y0 + 0.02], [x0, 0.8 + r]];
    for (let i = 1; i <= 3; i++) {
      const a = Math.PI + (i * Math.PI) / 6;
      q.push([x0 + r + r * Math.cos(a), 0.8 + r + r * Math.sin(a)]);
    }
    q.push([NF - 0.3, 0.8]);
    const ring: Ring = q.map(([x, y]) => [e * x, y]);
    for (const s of [-1, 1]) m.sweep(l.skirt, "z", ring, s * (W - 0.075), ring, s * (W - 0.004));
  });
}

// --- the body's skirt between the bogies -----------------------------------------------

function middleSkirt(m: MeshBuilder, l: Ns1200Livery): void {
  const x1 = 4.95, r = 0.3, yb = 1.22;
  const q: Array<[number, number]> = [[-x1, Y0 + 0.02]];
  for (let i = 0; i <= 3; i++) { const a = Math.PI - (i * Math.PI) / 6; q.push([-x1 + r + r * Math.cos(a), yb + r - r * Math.sin(a)]); }
  for (let i = 3; i >= 0; i--) { const a = (i * Math.PI) / 6; q.push([x1 - r + r * Math.cos(a), yb + r - r * Math.sin(a)]); }
  q.push([x1, Y0 + 0.02]);
  m.scope("skirts", () => {
    for (const s of [-1, 1]) m.sweep(l.skirt, "z", q, s * (W - 0.075), q, s * (W - 0.004));
  });
}

// --- the bogies ---------------------------------------------------------------------------

/** A cast Co bogie: three wheelsets, the side frame with its pedestals, swing equalizers under the axle boxes with their spring nests, the bolster. */
function coBogie(m: MeshBuilder, xc: number, mat: string): void {
  m.bogie(() => {
    const N = 16;
    const ay = WHEEL_R * Math.cos(Math.PI / N);
    const ft = FRAME_TOP;
    for (const dx of AXLES)
      m.scope("wheelset", () => {
        const x = xc + dx;
        const axle = ngon(8, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -1.0, axle, 1.0);
        for (const s of [-1, 1]) {
          sweepZ(m, "steel", ngon(N, WHEEL_R, Math.PI / N, x, ay), side(s, 0.665, 0.8));
          sweepZ(m, "wheel", ngon(12, WHEEL_R * 0.8, 0, x, ay), side(s, 0.8, 0.82));
          m.scope("axle box", () => sweepZ(m, mat, ngon(8, 0.15, Math.PI / 8, x, ay), side(s, 0.84, 1.06)));
        }
        const motor = ngon(8, 0.27, 0, x + (dx > 0 ? -1 : 1) * 0.47, ay + 0.02);
        m.sweep(mat, "z", motor, -0.55, motor, 0.55);
      });
    m.scope("frame", () => {
      const L = 2.4;
      const top: Array<[number, number]> = [[-L, ft]], bottom: Array<[number, number]> = [[-L, ft - 0.2]];
      for (const a of AXLES) {
        top.push([a - 0.3, ft], [a - 0.24, ft], [a + 0.24, ft], [a + 0.3, ft]);
        bottom.push([a - 0.3, ft - 0.26], [a - 0.24, ay + 0.16], [a + 0.24, ay + 0.16], [a + 0.3, ft - 0.26]);
      }
      top.push([L, ft]);
      bottom.push([L, ft - 0.2]);
      for (const s of [-1, 1]) plate(m, mat, top.map(([u, v]) => [xc + u, v]), bottom.map(([u, v]) => [xc + u, v]), ...side(s, 0.97, 1.1));
      // the end transoms and the bolster across
      for (const x of [xc - L + 0.06, xc + L - 0.06]) block(m, mat, x - 0.06, x + 0.06, ft - 0.2, ft - 0.03, -0.97, 0.97);
      block(m, mat, xc - 0.32, xc + 0.32, ft - 0.3, ft - 0.04, -1.18, 1.18);
      // the brake cylinders on the frame's ends
      for (const s of [-1, 1]) for (const k of [-1, 1]) m.sweep("steel", "x", ngon(6, 0.09, 0, s * 0.92, ft + 0.06), xc + k * 1.95, ngon(6, 0.09, 0, s * 0.92, ft + 0.06), xc + k * 2.3);
    });
    m.scope("equalizers", () => {
      for (const s of [-1, 1])
        for (let i = 0; i + 1 < AXLES.length; i++) {
          const [a, b] = [xc + AXLES[i]!, xc + AXLES[i + 1]!];
          const top: Ring = [[a, ay + 0.04], [a + 0.36, ay - 0.2], [b - 0.36, ay - 0.2], [b, ay + 0.04]];
          const bottom: Ring = [[a, ay - 0.06], [a + 0.33, ay - 0.3], [b - 0.33, ay - 0.3], [b, ay - 0.06]];
          plate(m, mat, top, bottom, ...side(s, 1.07, 1.14));
          const mid = (a + b) / 2;
          for (const d of [-0.2, 0.2]) coil(m, "spring", mid + d, s * 1.105, ay - 0.2, ft - 0.26, 0.075, 2, 6);
        }
    });
  });
}

// --- roof ------------------------------------------------------------------------------------

/** The roof line: a busbar on post insulators between the pantographs. */
function roofLine(m: MeshBuilder): void {
  const y = CROWN + 0.36;
  m.scope("roof line", () => {
    for (const x of [-2.4, 2.4]) insulator(m, x, 0.3, CROWN + 0.06, y - 0.02);
    tubeX(m, "copper", 0.02, -3.6, y, 0.3, 3.6, y, 0.3, 6);
  });
}

/** The NS logo and the white number near the reader's left end of each side (yellowGrey). */
function sideMarks(m: MeshBuilder, l: Ns1200Livery, s: LocoSpec): void {
  const sp = shellOf(s);
  m.scope("side marks", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const x = -sd * LOGO_X;
        const tris = logoTris(x, 3.38, sd < 0);
        m.facets("logo", tris.map(([u, v]) => at(u, v, 0.009)), [0, 0, sd]);
        numberOn(m, at, [0, 0, sd], l.number, x, 2.42, 0.36, 0.006, sd < 0);
      });
  });
}

/** The NS 1200 in a livery. */
export function ns1200(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  m.scope("body", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front nose" : "rear nose", () => nose(m, l, e));
    middleSkirt(m, l);
    if (!l.turquoise) sideMarks(m, l, s);
  });
  m.scope("bogies", () => {
    for (const xc of [-BOGIE_X, BOGIE_X]) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => coBogie(m, xc, l.bogie));
  });
  m.scope("roof equipment", () => roofLine(m));
  return m;
}

/** The distant model: the kit's box locomotive with the nose in its profile, the same paint and running gear. */
export function ns1200Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const bogies: BogieSpec[] = [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: AXLES, wheelR: WHEEL_R, frameTop: FRAME_TOP }));
  return boxLocoLod({ ...s, tip: TIP_LOD, endPlan: lodPlan, bogies, frame: { ...s.frame, y0: 1.0 } });
}
