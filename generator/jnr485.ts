// JNR's 485 series limited express (1964) on the series kit (shinkansen.ts), its KuHa 481 driving
// trailer in the early bonnet form (the 0 and 100 numbers, the 151 series' nose): the long bonnet
// ahead of the raised cab - its vertical front with the red lamp boxes at the corners, the "whiskers"
// (the red block and its three cream lines along the bonnet's sides), the red "eyebrows" over the lamp
// boxes, the JNR wing emblem on the rounded top, the headboard and the red bumper band over a cream
// skirt and the red coupler cover - the cab standing above the body's roof with its two windscreens and
// its side windows, the big headlight pod on its roof, and the AU13 air conditioners along every roof.
// The bonnet is a cab face (seriesCab.ts); the raised cab is a second painted surface (cabNose.ts)
// standing on it. Measured on the photographs in assets/jnr-485/ (SOURCES.md), against the published
// figures: 21.0 / 20.5 m cars, 2.9 m wide, floor 1.23 m, the cab's top 3.88 m. See
// docs/models/jp-emus.md, "The 485 series". No `node:` imports.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { ngon } from "./meshCore.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { NoseShape } from "./carbodyKit.ts";
import type { SliceBody } from "./sliceBody.ts";
import { CabNose, inRoundRect, type NoseLayer, type NoseQuery } from "./cabNose.ts";
import { bodyHalf, edgeAt, type SeriesCabFace } from "./seriesCab.ts";
import { block } from "./vehicleParts.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";

const c = (hex: string, r = 0.4) => paint(hex, r);

/** Where the bonnet's face meets the body (the cab's rear wall), behind the tip. */
const D485 = 4.2;
/** The raised cab's own back, a little behind the body's front so that its rear wall stands clear of it. */
const CAB_BACK = 4.35;
/** The body: its bottom, the gutter (shoulder) and the roof's crown; the cab's top. */
const B485 = 0.91;
const S485_SHOULDER = 3.13;
const C485 = 3.45;
const CAB_TOP = 3.88;
/** The windscreen's foot (the seam between the bonnet's face and the raised cab) and head. */
const SCREEN = [3.13, 3.6] as const;

/**
 * The bonnet (photo-485-hitachi.jpg head-on, 197 px/m with the cab's top at 3.88 m and the bumper band's
 * top at 1.18 m; photo-jnr-ec-tc481-33.jpg along the side): the face upright from the bumper to the crease
 * at 2.43 m, then the hood rounding back over 2.7 m to the windscreen's foot at 3.13 m. Its plan is flat
 * across with rounded corners; above the crease the hood's top falls away to its sides (the bulge), so
 * that its shoulder line climbs along the side from the crease at the front to the cab.
 */
const BONNET: SeriesCabFace = {
  dJoin: D485, dSide: 1.2, first: 5.7, roofFrom: 9, reach: 0.24, wrap: true, cols: [8, 4, 1, 1], tolerance: 0.02,
  profile: [
    [0.91, 0.06], [1.01, 0.02], [1.18, 0], [1.27, 0.03], [1.97, 0.07], [2.24, 0.09], [2.43, 0.12], [2.55, 0.25], [2.65, 0.45], [2.75, 0.75],
    [2.85, 1.15], [2.95, 1.6], [3.05, 2.15], [3.13, 2.65], [3.3, 3.9], [C485, D485],
  ],
  corner: [[0.91, 0.3], [2.24, 0.3], [2.43, 0.36], [2.55, 0.48], [2.65, 0.58], [2.85, 0.62], [2.95, 0.58], [3.13, 0.45], [C485, 0.45]],
  bulge: [[0.91, 0.03], [2.43, 0.05], [2.55, 0.15], [2.65, 0.4], [2.75, 0.7], [2.85, 0.85], [2.95, 0.8], [3.05, 0.45], [3.13, 0.25], [C485, 0.25]],
  rows: [0.91, 1.01, 1.17, 1.27, 1.97, 2.24, 2.43, 2.55, 2.65, 2.75, 2.85, 2.95, 3.05, 3.13, 3.3, C485],
  // the red bumper band (the side's lower band), the face cream (or red) above it
  bands: (l) => [[0, l.bands[0]![1], l.bands[0]![2]], [l.bands[0]![1], 9, (l.bands[1] ?? l.bands[0]!)[2]]],
  // the headboard in its frame
  masks: [{ lat: [-0.6, 0.6], y: [1.58, 2.18], r: 0.13, mat: "boardFrame" }, { lat: [-0.55, 0.55], y: [1.62, 2.14], r: 0.1, mat: "board" }],
  panes: [],
  // the lamp boxes at the corners, painted round onto the sides (the whiskers' block)
  paint: [
    { mat: "beard", front: [[1.27, 0.12], [1.97, 0.12]], back: [[1.27, 3.7], [1.97, 3.7]] },
    ...[1.43, 1.6, 1.77].map((y) => ({ mat: "whisker", front: [[y, 0.2], [y + 0.04, 0.2]] as Pt[], back: [[y, 3.62], [y + 0.04, 3.62]] as Pt[] })),
    // the eyebrow's other half, round the corner and pointing back along the side
    { mat: "beard", front: [[2.06, 0.15], [2.26, 0.15]], back: [[2.06, 1.15], [2.26, 0.3]] },
  ],
  fields: [
    // the skirt's colour up to the bumper band across the front
    { mat: "apron", pts: [[-1.5, 0.9], [1.5, 0.9], [1.5, 1.0], [-1.5, 1.0]] },
    // the lamp boxes' red, round the corners to the whiskers
    { mat: "beard", pts: [[-1.46, 1.27], [-0.9, 1.27], [-0.9, 1.97], [-1.46, 1.97]] },
    { mat: "beard", pts: [[0.9, 1.27], [1.46, 1.27], [1.46, 1.97], [0.9, 1.97]] },
  ],
  decals: [
    // the red eyebrows over the lamp boxes: level below, pointing in
    { mat: "beard", pts: [[-1.44, 2.06], [-0.66, 2.06], [-1.44, 2.26]] },
    { mat: "beard", pts: [[1.44, 2.06], [1.44, 2.26], [0.66, 2.06]] },
    // the JNR wing emblem on the hood's top: a chevron of two wings meeting at its point, silver over white
    { mat: "emblem", pts: [[-0.42, 2.88], [-0.1, 2.72], [0, 2.8], [0, 2.86]], fine: 4 },
    { mat: "emblem", pts: [[0, 2.8], [0.1, 2.72], [0.42, 2.88], [0, 2.86]], fine: 4 },
    { mat: "emblemW", pts: [[-0.42, 2.88], [0, 2.5], [-0.1, 2.72]], fine: 4 },
    { mat: "emblemW", pts: [[0.1, 2.72], [0, 2.5], [0.42, 2.88]], fine: 4 },
  ],
  pods: [-1.1, 1.1].flatMap((lat) => [
    // the lamp box standing a little proud of the face, the head lamp over the tail lamp on it in chrome rings
    { lat, y: 1.62, w: 0.42, h: 0.7, r: 0.07, proud: 0.04, depth: 0.1, mat: "beard" },
    { lat, y: 1.77, w: 0.33, h: 0.33, proud: 0.065, depth: 0.05, mat: "beard", lamps: [[0, 0.14, "lampHead"]] as Array<readonly [number, number, string]> },
    { lat, y: 1.44, w: 0.2, h: 0.2, proud: 0.06, depth: 0.05, mat: "beard", lamps: [[0, 0.08, "lampRed"]] as Array<readonly [number, number, string]> },
  ]),
  // the distant model's end: the bonnet and the cab's front drawn as one
  lod: {
    profile: [[0.91, 0.06], [2.43, 0.12], [2.75, 0.75], [2.95, 1.65], [3.13, 2.8], [C485, 3.0]],
    corner: [[0.91, 0.3], [2.43, 0.3], [2.95, 0.5], [C485, 0.45]], rows: [0.91, 1.17, 1.97, 2.43, 2.75, 2.95, 3.13, C485], bulge: 0.1, glass: false,
  },
};

/** The raised cab's half widths by height: its sides leaning in to the roof, 2.16 m across at the gutter over the windscreens. */
const CAB_HALF: Pt[] = [[3.3, 1.38], [3.45, 1.32], [3.6, 1.23], [3.7, 1.15], [3.78, 1.06], [3.84, 0.96], [CAB_TOP, 0.75]];
/** Its centre line, [y, d behind the tip]: the windscreen raked 0.32 m back over its 0.47 m, the roof's front edge rounding over it. */
const CAB_PROFILE: Pt[] = [[SCREEN[0], 2.65], [SCREEN[1], 2.97], [3.66, 3.03], [3.75, 3.13], [3.8, 3.22], [3.84, 3.33], [3.87, 3.48], [CAB_TOP, 3.68]];
/** The cab's side window: its raked front edge ([y, d]) and its back, sill and head. */
const CAB_WINDOW = { front: [[3.2, 3.3], [3.56, 3.45]] as Pt[], back: 4.05, y: [3.2, 3.56] as const };

/** The cab above the body's gutter: windscreens, side windows, its grey roof, the closing wall behind and the headlight pod. */
function drawCab(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const at = (d: number) => X(d - D485);
  const body = bodyHalf(b, 0);
  const hb = edgeAt(body, SCREEN[0]);
  const half: Pt[] = [[SCREEN[0], hb], ...CAB_HALF];
  const screen = (q: NoseQuery) => Math.abs(q.u) <= 2;
  const inPane = (q: NoseQuery, g: number) => screen(q) && q.y >= SCREEN[0] - g && q.y <= SCREEN[1] + g && Math.abs(q.lat) <= 1.17 + g && (inRoundRect(Math.abs(q.lat), q.y, 0.61, (SCREEN[0] + SCREEN[1]) / 2, 0.56 + g, (SCREEN[1] - SCREEN[0]) / 2 + g, 0.06 + g));
  const sideWin = (q: NoseQuery, g: number) => Math.abs(q.lat) > 1.15 && q.y >= CAB_WINDOW.y[0] - g && q.y <= CAB_WINDOW.y[1] + g && q.d >= edgeAt(CAB_WINDOW.front, q.y) - g && q.d <= CAB_WINDOW.back + g;
  const layers: NoseLayer[] = [
    // the grey roof from the gutter over the windscreens
    { mat: "roofG", name: "roof", where: { y: [3.66, CAB_TOP] }, inside: (q) => q.y >= 3.66 },
    // the windscreens' rubber, round both panes and over the centre pillar
    { mat: "rubber", name: "windscreen rubber", where: { face: true, y: [SCREEN[0], SCREEN[1] + 0.03] }, inside: (q) => inPane(q, 0.03) },
    { mat: "cabGlass", name: "windscreen", where: { face: true, y: [SCREEN[0], SCREEN[1]] }, inside: (q) => inPane(q, 0) && Math.abs(q.lat) >= 0.05 },
    { mat: "rubber", name: "side window rubber", where: { y: [CAB_WINDOW.y[0] - 0.03, CAB_WINDOW.y[1] + 0.03] }, inside: (q) => sideWin(q, 0.03) },
    { mat: "cabGlass", name: "side window", where: { y: [CAB_WINDOW.y[0], CAB_WINDOW.y[1]] }, inside: (q) => sideWin(q, 0) },
  ];
  const n = new CabNose(m, {
    e: 1, xTip: at(0), dJoin: CAB_BACK, dSide: 3.7, profile: CAB_PROFILE, half,
    corner: [[SCREEN[0], 0.45], [SCREEN[1], 0.45], [CAB_TOP, 0.4]], bulge: [[SCREEN[0], 0.25], [SCREEN[1], 0.25], [CAB_TOP, 0.15]],
    rows: [SCREEN[0], 3.2, 3.3, 3.45, 3.56, SCREEN[1], 3.66, 3.68, 3.75, 3.8, 3.84, 3.87, CAB_TOP],
    base: "shell", layers, cols: [8, 4, 1, 1], tolerance: 0.02, capTop: "roofG", capBottom: "shell",
  });
  m.scope("skin", () => n.draw());
  // the wipers parked along the windscreens' foot
  m.scope("wipers", () => {
    const t = 0.012, tris: Pt[] = [];
    for (const [a, e] of [[[-0.15, 3.18], [-0.95, 3.2]], [[0.95, 3.18], [0.15, 3.2]]] as Array<[Pt, Pt]>)
      tris.push([a[0], a[1] - t], [e[0], e[1] - t], [e[0], e[1] + t], [a[0], a[1] - t], [e[0], e[1] + t], [a[0], a[1] + t]);
    n.decal("black", tris, 0.02);
  });
  // the cab's rear wall, from the gutter up to its roof, standing behind the body's front
  m.scope("rear wall", () => {
    // a centimetre inside the skin's edge, so that its rims lie in no plane of the skin
    const ys = [SCREEN[0], 3.3, 3.45, 3.6, 3.7, 3.78, 3.84, CAB_TOP - 0.01];
    const ring: Vec3[] = [...ys.map((y): Vec3 => [at(CAB_BACK), y, edgeAt(half, y) - 0.01]), ...[...ys].reverse().map((y): Vec3 => [at(CAB_BACK), y, 0.01 - edgeAt(half, y)])];
    m.slab("shell", ring, [0.02 * Math.sign(at(0) - at(1)), 0, 0]);
  });
  // the headlight pod on the cab's roof: a rounded housing, the lamp in its chrome ring between two grilles
  m.scope("roof lamp", () => {
    const k = Math.sign(at(0) - at(1));
    const sec: Array<[number, number]> = [[3.6, 3.86], [3.6, 4.14], [3.68, 4.24], [4.3, 4.24], [4.5, 4.12], [4.55, 3.86]];
    const pts: Vec3[] = sec.map(([d, y]): Vec3 => [at(d), y, 0.39]);
    m.scope("housing", () => m.slab("podGrey", pts, [0, 0, -0.78]));
    const xf = at(3.6);
    m.scope("bezel", () => m.sweep("frameSilver", "x", ngon(16, 0.15, 0, 0, 4.04), xf - k * 0.03, ngon(16, 0.15, 0, 0, 4.04), xf + k * 0.04));
    m.scope("lens", () => m.sweep("lampHead", "x", ngon(16, 0.115, 0, 0, 4.04), xf, ngon(16, 0.115, 0, 0, 4.04), xf + k * 0.046));
    // the louvred grilles either side of the lamp
    for (const z of [-0.27, 0.27]) m.scope("grille", () => {
      block(m, "black", Math.min(xf - k * 0.01, xf + k * 0.015), Math.max(xf - k * 0.01, xf + k * 0.015), 3.93, 4.17, z - 0.1, z + 0.1);
      for (const y of [3.98, 4.04, 4.1]) block(m, "podGrey", Math.min(xf - k * 0.005, xf + k * 0.025), Math.max(xf - k * 0.005, xf + k * 0.025), y, y + 0.02, z - 0.095, z + 0.095);
    });
  });
}

/** The skirt under the bonnet, [y, front d, half width, back d]: down to 0.44 m, its lower edge rising back to the leading bogie's wheels. */
const APRON: ReadonlyArray<readonly [number, number, number, number]> = [[0.44, 0.1, 1.25, 0.85], [0.7, 0.07, 1.28, 1.2], [B485, 0.06, 1.3, 1.4]];

/** The skirt, the red coupler cover over its front and the coupler's opening. */
function drawApron(m: MeshBuilder, X: (d: number) => number): void {
  const at = (d: number) => X(d - D485);
  const ring = ([, df, hw, back]: readonly [number, number, number, number]): Array<[number, number]> => {
    const r = 0.3, n = 4, pts: Array<[number, number]> = [];
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + r * (1 - Math.sin(t)), -(hw - r + r * Math.cos(t))]); }
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + r * (1 - Math.cos(t)), hw - r + r * Math.sin(t)]); }
    pts.push([back, hw], [back, -hw]);
    const out = pts.map(([d, z]): [number, number] => [at(d), z]);
    let area = 0;
    for (let i = 0; i < out.length; i++) { const [p, q] = [out[i]!, out[(i + 1) % out.length]!]; area += p[0] * q[1] - q[0] * p[1]; }
    return area > 0 ? out.reverse() : out;
  };
  m.scope("skirt", () => {
    const rings = APRON.map(ring);
    m.cap("apron", rings[0]!, APRON[0]![0], false);
    for (let i = 0; i + 1 < rings.length; i++) m.loft("apron", rings[i]!, APRON[i]![0], rings[i + 1]!, APRON[i + 1]![0], false);
  });
  // the coupler cover: a rounded red box standing 0.3 m proud of the skirt, its top at the bumper band
  m.scope("coupler cover", () => {
    const k = Math.sign(at(0) - at(1));
    const r = 0.12, hw = 0.43, y0 = 0.6, y1 = 1.1, out: Array<[number, number]> = [];
    for (const [cz, cy, a0] of [[hw - r, y1 - r, 0], [-(hw - r), y1 - r, 90], [-(hw - r), y0 + r, 180], [hw - r, y0 + r, 270]] as const)
      for (let j = 0; j <= 3; j++) { const a = ((a0 + 30 * j) * Math.PI) / 180; out.push([cz + r * Math.cos(a), cy + r * Math.sin(a)]); }
    const inner = out.map(([z, y]): [number, number] => [z * 0.9, (y - (y0 + y1) / 2) * 0.88 + (y0 + y1) / 2]);
    m.sweep("cover", "x", out, at(0.2), out, at(-0.12));
    m.sweep("cover", "x", out, at(-0.12), inner, at(-0.12) + k * 0.12);
  });
}

/** An AU13 air conditioner on the roof at x: a low housing with sloped ends and two grilles a side. */
function au13(m: MeshBuilder, x: number, roof: number): void {
  const [l, w, h, e] = [2.2, 0.98, 0.3, 0.3];
  const sec: Vec3[] = [[x - l / 2, roof - 0.12, w / 2], [x + l / 2, roof - 0.12, w / 2], [x + l / 2, roof + h - 0.12, w / 2], [x + l / 2 - e, roof + h, w / 2], [x - l / 2 + e, roof + h, w / 2], [x - l / 2, roof + h - 0.12, w / 2]];
  m.scope("housing", () => m.slab("acGrey", sec, [0, 0, -w]));
  for (const sd of [1, -1])
    for (const dx of [-0.45, 0.45]) m.scope("grille", () => block(m, "black", x + dx - 0.3, x + dx + 0.3, roof + 0.02, roof + h - 0.07, sd > 0 ? w / 2 : -w / 2 - 0.006, sd > 0 ? w / 2 + 0.006 : -w / 2));
}

/** The air conditioners' centres along a car's body (d from its front): four behind the cab, five on an intermediate car clear of the pantograph's place. */
const AC_END = [1.5, 5.1, 8.7, 12.3];
const AC_MIDDLE = [1.4, 4.7, 8.0, 11.3, 18.6];

function fittings485(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underfloor", () => block(m, "under", X(t1 - 2.6), X(Math.max(t0 + 2.6, 0.3)), B485 - 0.35, B485, -1.45 * 0.8, 1.45 * 0.8));
  m.scope("air conditioners", () => (car.end ? AC_END : AC_MIDDLE).forEach((d) => au13(m, X(d), C485)));
  if (!car.end) return;
  m.scope("cab", () => drawCab(m, b, X));
  m.scope("apron", () => drawApron(m, X));
}

/** The cars' doors and windows (d from the body's front): the windows 1.8 m apart, two seat rows each (photo-jnr-ec-tc481-33.jpg, photo-jnr-ec-m485-75.jpg). */
const LAYOUT_END: SeriesLayout = {
  doors: [[0.27, 0.97, 1], [14.2, 14.9, 1]],
  windows: Array.from({ length: 7 }, (_, i): [number, number] => [1.44 + 1.8 * i, 2.89 + 1.8 * i]),
};
const LAYOUT_MIDDLE: SeriesLayout = {
  doors: [[17.1, 17.8, 1]],
  windows: Array.from({ length: 9 }, (_, i): [number, number] => [0.8 + 1.8 * i, 2.22 + 1.8 * i]),
};

/** The face's and the cab's paint, by livery: the lamp boxes, whisker lines, skirt, headboard, emblem, coupler cover. */
const FACE_PAINT = (o: { beard: string; whisker: string; apron: string; shell: string; board: string }) => ({
  beard: c(o.beard), whisker: c(o.whisker), apron: c(o.apron), shell: c(o.shell), board: c(o.board, 0.3), cover: c(o.beard),
  boardFrame: c("#a9adb1", 0.35), emblem: { color: "#b8bcc0", metallic: 0.8, roughness: 0.25 }, emblemW: c("#f2f2ee", 0.3), acGrey: c("#9a9fa3", 0.6), podGrey: c("#b4b8bb", 0.45),
});

/**
 * JNR's limited express colours (Cream No. 4 and Red No. 2, photo-jnr-ec-m485-75.jpg at 107 px/m from the
 * axle's height): red up to 1.17 m, cream, the red window band from 1.94 to 2.83 m, cream to the gutter,
 * the grey roof. On the driving car the window band stops at the door behind the cab.
 */
const JNR_LIVERY: ShinkansenLivery = {
  title: "JNR express",
  palette: { cream: c("#e9dcbc"), red: c("#b0202a"), roofG: c("#8a8d90", 0.6), ...FACE_PAINT({ beard: "#b0202a", whisker: "#e9dcbc", apron: "#e9dcbc", shell: "#e9dcbc", board: "#f2f0e8" }) },
  bands: [[0, 1.17, "red"], [1.17, 1.94, "cream"], [1.94, 2.83, "red"], [2.83, 9, "cream"]], roof: "roofG", skirt: "red", number: "KUHA 481-26",
  // on the body only (the face's own bands paint the cab's sides)
  endSweeps: [{ mat: "cream", front: [[1.94, D485 - 0.01], [2.83, D485 - 0.01]], back: [[1.94, 4.47], [2.83, 4.47]] }],
};

/** JR Kyushu's "Red Express" (photo-jnr-ec-tc481-33.jpg, KuHa 481-33): red all over, the grey roof, white lines and lettering, the black headboard. */
const KYUSHU_LIVERY: ShinkansenLivery = {
  title: "JR Kyushu red",
  palette: { red: c("#c41e30"), white: c("#f2f2ef"), roofG: c("#8a8d90", 0.6), ...FACE_PAINT({ beard: "#c41e30", whisker: "#f2f2ef", apron: "#c41e30", shell: "#c41e30", board: "#1d1f22" }) },
  bands: [[0, 9, "red"]], roof: "roofG", skirt: "red", number: "KUHA 481-33",
  endLettering: [{ text: "RED EXPRESS", d: 6.0, y: 1.45, h: 0.22, mat: "white" }],
};

const NO_NOSE: NoseShape = { len: 0.1, tip: 1, power: 2, C: [[0, 3.6]], S: [[0, 3.3]], Y: [[0, 1.3]], A: [[0, 1.1]], B: [[0, 1.0]] };

export const S485: ShinkansenSeries = {
  endLength: 21.0, midLength: 20.5, W: 1.45, Y: 1.3, S: S485_SHOULDER, C: C485, lean: 0.97, B: B485, A: 0.95,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: BONNET,
  windows: [[2.03, 2.69]], windowW: 1.45, pitch: 1.8, door: [0.98, 3.0, 2.12, 2.85], doorW: 0.7, doorGlassW: 0.26,
  layout: { end: LAYOUT_END, middle: LAYOUT_MIDDLE },
  // the leading bogie under the cab (3.0 m behind the tip), 14.15 m bogie centres; the intermediate car's centred
  endBogies: [3.0 - D485, 3.0 - D485 + 14.15], midBogies: [2.925, 17.075],
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.1, pantograph: "diamond",
  // the distant model's raised cab (2 m long or more, so that it is never left out)
  lodRoof: { d: [2.7, 4.75], hw: 1.25, y: [S485_SHOULDER, CAB_TOP], mat: "shell" },
  fittings: fittings485,
  liveries: { jnr: JNR_LIVERY, kyushu: KYUSHU_LIVERY },
  weight: { end: 41, middle: 44 }, power: 480, maxspeed: 120,
};
