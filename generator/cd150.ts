// CD 150, reconstructed from the native JT7 XML and BMPs in assets/cd-150.
// Source coordinates: (x, y, z) -> (x - 8.5, y, -z), metres.
// No runtime textures or sibling database dependency. See assets/cd-150/SOURCES.md.
import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import {
  CD163_PALETTE,
  bandAt,
  bandPieces,
  coil,
  lettering,
  letteringWidth,
  emblem,
  runningNumber,
  splitHeights,
  tubeX,
  type Band,
} from "./cd163.ts";

const PALETTE = {
  ...CD163_PALETTE,
  green: { color: "#126d38", roughness: 0.6 },
  cream: { color: "#cacdac", roughness: 0.6 },
  rib: { color: "#a6ae78", roughness: 0.7 },
  roof: { color: "#707b78", roughness: 0.75 },
  cooler: { color: "#afc2b0", roughness: 0.7 },
  pantograph: { color: "#c79912", metallic: 0.25, roughness: 0.6 },
};

// Running number in the 1988 CSD/CD scheme: class 150, serial 222 (the CD-era
// 150.2 subclass), check digit 8 (see docs/models/vehicles.md, "Running numbers").
export const CD150_NUMBER = "150 222-8";

/**
 * A livery of the CD 150 body. The CD 151 and the ZSR 350 (Skoda 66E and 55E)
 * share the 150's body and are drawn on it in their own paint; see
 * docs/models/loco-liveries.md.
 */
export interface Cd150Livery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/electric. */
  source: string;
  number: string;
  numberSource: string;
  palette?: Record<string, MaterialSpec>;
  /** The body's colour bands from 1.2 to 3.7 m, low first; a band's fourth entry is its ribs' material. */
  bands: readonly Band[];
  /** Bands painted over the cab sections and the ends, when they differ from the machine room's. */
  cabBands?: readonly Band[];
  /** The cab doors' bands; by default the cab's bands. */
  door?: readonly Band[];
  /** The side skirt and the apron over the buffer beam. */
  skirt: string;
  sideEmblem: boolean;
  frontEmblem: boolean;
}

const c = (color: string, roughness = 0.6): MaterialSpec => ({ color, roughness });

export const CD150_LIVERIES = {
  cd150: {
    title: "CD 150 222, cream and green",
    source: "cd_150",
    number: CD150_NUMBER,
    numberSource: "a CD-era 150.2 unit; the native plate does not resolve digits",
    bands: [[1.2, 1.9, "green"], [1.9, 3.7, "cream", "rib"]],
    door: [[0, 9, "cream"]],
    skirt: "green",
    sideEmblem: true,
    frontEmblem: true,
  },
  cd151: {
    title: "CD 151 012, cream and dark green",
    source: "cd_151",
    number: runningNumber("151", "012"),
    numberSource: "illustrative, a unit of the class",
    palette: { green: c("#0d4a26"), cream: c("#d2d2b0"), rib: c("#b4b48a", 0.7) },
    // rows 43-50 green, 25-42 cream
    bands: [[1.2, 1.7, "green"], [1.7, 3.7, "cream", "rib"]],
    skirt: "green",
    sideEmblem: true,
    frontEmblem: true,
  },
  cd151Cez: {
    title: "CD 151 CEZ, blue advertising livery",
    source: "cd_151_cez",
    number: runningNumber("151", "019"),
    numberSource: "illustrative; the advertising artwork itself is not modelled",
    palette: { cezBlue: c("#17336f", 0.5), logo: c("#eeeeee", 0.5) },
    bands: [[1.2, 3.7, "cezBlue"]],
    skirt: "cezBlue",
    sideEmblem: true,
    frontEmblem: true,
  },
  zsr350: {
    title: "ZSR 350 016, cream and blue, yellow cab stripe",
    source: "zsr_350",
    number: runningNumber("350", "016"),
    numberSource: "illustrative, a unit of the class",
    palette: { zsrBlue: c("#1f3ab8", 0.5), cream: c("#e6e3b6"), zsrYellow: c("#e8d020", 0.5) },
    // rows 35-49 blue, 25-34 cream; the cabs add a yellow stripe at rows 41-45
    bands: [[1.2, 2.5, "zsrBlue"], [2.5, 3.7, "cream"]],
    cabBands: [[1.2, 1.4, "zsrBlue"], [1.4, 1.9, "zsrYellow"], [1.9, 2.5, "zsrBlue"], [2.5, 3.7, "cream"]],
    skirt: "zsrBlue",
    sideEmblem: false,
    frontEmblem: false,
  },
  zsr350No001: {
    title: "ZSR 350 001, pearl and dark grey, yellow cab ends",
    source: "zsr_350_001",
    number: runningNumber("350", "001"),
    numberSource: "the vlakosimdb model's name",
    palette: { darkGrey: c("#444a44"), pearl: c("#ece8de", 0.5), zsrYellow: c("#d8d020", 0.5) },
    // rows 45-50 dark grey, 34-44 pearl, 25-33 dark grey; the cabs yellow at rows 35-42
    bands: [[1.2, 1.5, "darkGrey"], [1.5, 2.6, "pearl"], [2.6, 3.7, "darkGrey"]],
    cabBands: [[1.2, 1.5, "darkGrey"], [1.5, 1.7, "pearl"], [1.7, 2.5, "zsrYellow"], [2.5, 2.6, "pearl"], [2.6, 3.7, "darkGrey"]],
    skirt: "darkGrey",
    sideEmblem: false,
    frontEmblem: false,
  },
  zsr350No002: {
    title: "ZSR 350 002, red and white",
    source: "zsr_350_002",
    number: runningNumber("350", "002"),
    numberSource: "the vlakosimdb model's name",
    palette: { red: c("#b8121a", 0.5), pearl: c("#e0e0e0", 0.5) },
    // rows 43-50 red, 35-42 white, 25-34 red
    bands: [[1.2, 1.7, "red"], [1.7, 2.5, "pearl"], [2.5, 3.7, "red"]],
    skirt: "red",
    sideEmblem: false,
    frontEmblem: false,
  },
  zsr350No003: {
    title: "ZSR 350 003, blue, yellow band",
    source: "zsr_350_003",
    number: runningNumber("350", "003"),
    numberSource: "the vlakosimdb model's name",
    palette: { zsrBlue: c("#1048b8", 0.5), lemon: c("#dcd84a", 0.5) },
    // rows 43-50 blue, 36-42 yellow, 25-35 blue
    bands: [[1.2, 1.7, "zsrBlue"], [1.7, 2.4, "lemon"], [2.4, 3.7, "zsrBlue"]],
    skirt: "zsrBlue",
    sideEmblem: false,
    frontEmblem: false,
  },
  zsr350No004: {
    title: "ZSR 350 004, dark blue, white cab ends",
    source: "zsr_350_004",
    number: runningNumber("350", "004"),
    numberSource: "the vlakosimdb model's name",
    palette: { navy: c("#14148a", 0.5), pearl: c("#ece8ec", 0.5), skyBlue: c("#1a7ec0", 0.5), darkGrey: c("#404840") },
    // rows 47-50 sky blue, 43-46 white, 25-42 navy; the cabs white at rows 35-43, navy at 44-46
    bands: [[1.2, 1.3, "skyBlue"], [1.3, 1.7, "pearl"], [1.7, 3.7, "navy"]],
    cabBands: [[1.2, 1.3, "skyBlue"], [1.3, 1.6, "navy"], [1.6, 2.5, "pearl"], [2.5, 3.7, "darkGrey"]],
    skirt: "skyBlue",
    sideEmblem: false,
    frontEmblem: false,
  },
} as const satisfies Record<string, Cd150Livery>;

export const CD150_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd150",
  values: Object.entries(CD150_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];

// Source plan tapers from 3.0 m across the machine room to 2.8 m at the noses.
function halfWidth(x: number): number {
  return 1.5 - (0.1 * Math.max(0, Math.abs(x) - 5.8)) / 2.2;
}
function plan(end: number, hw: number, middleHW = 1.5): Ring {
  return [
    [end, -hw],
    [5.8, -middleHW],
    [-5.8, -middleHW],
    [-end, -hw],
    [-end, hw],
    [-5.8, middleHW],
    [5.8, middleHW],
    [end, hw],
  ];
}
function frontX(y: number, e: number): number {
  const nose = e > 0 ? 2.7 : 2.6;
  if (y < 1.6) return 7.6 + (y - 1.2) * 0.75;
  if (y < 1.9) return 7.9 + (y - 1.6) / 3;
  if (y <= nose) return 8;
  return 8 - (y - nose) / (3.9 - nose);
}
function shellRing(y: number): Ring {
  const r = plan(8, 1.4);
  return r.map(([x, z]) => [
    Math.abs(x) === 8 ? Math.sign(x) * frontX(y, Math.sign(x)) : x,
    z,
  ]);
}
// Panels follow the actual sloping supporting plane, with small embedded backs.
function endPanel(
  m: MeshBuilder,
  mat: string,
  e: number,
  q: Ring,
  d: number,
  depth = 0.035,
): void {
  // Clip panels at changes of body slope so their interiors stay on the skin.
  const clip = (ring: Ring, h: number, above: boolean): Ring => {
    const out: Ring = [];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!,
        b = ring[(i + 1) % ring.length]!;
      const inside = (p: readonly number[]) =>
        above ? p[1]! >= h : p[1]! <= h;
      if (inside(a)) out.push(a);
      if (inside(a) !== inside(b)) {
        const t = (h - a[1]) / (b[1] - a[1]);
        out.push([a[0] + t * (b[0] - a[0]), h]);
      }
    }
    return out;
  };
  let rings = [q];
  for (const h of [1.6, 1.9, e > 0 ? 2.7 : 2.6])
    rings = rings.flatMap((r) => {
      if (
        Math.min(...r.map((p) => p[1])) >= h ||
        Math.max(...r.map((p) => p[1])) <= h
      )
        return [r];
      return [clip(r, h, false), clip(r, h, true)];
    });
  for (const ring of rings)
    m.slab(
      mat,
      ring.map(([z, y]) => [e * (frontX(y, e) + d), y, z]),
      [-e * depth, 0, 0],
    );
}
function sidePanel(
  m: MeshBuilder,
  mat: string,
  s: number,
  q: Ring,
  d: number,
  depth = 0.035,
): void {
  m.slab(
    mat,
    q.map(([x, y]) => [x, y, s * (halfWidth(x) + d)]),
    [0, 0, -s * depth],
  );
}
function rect(x0: number, y0: number, x1: number, y1: number): Ring {
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}
function sideBox(
  m: MeshBuilder,
  mat: string,
  s: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  d: number,
): void {
  sidePanel(m, mat, s, rect(x0, y0, x1, y1), d);
}
function grille(
  m: MeshBuilder,
  s: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  cooler = false,
): void {
  const draw = (
    mat: string,
    a: number,
    b: number,
    c: number,
    d: number,
    off: number,
  ) => {
    if (cooler && s < 0) {
      const q = rect(a, b, c, d);
      m.slab(
        mat,
        q.map(([x, y]) => [
          x,
          y,
          -(1.495 - (Math.max(0, y - 3.8) * 0.295) / 0.8) - off,
        ]),
        [0, 0, 0.035],
      );
    } else sideBox(m, mat, s, a, b, c, d, off);
  };
  m.scope("housing", () => draw("roof", x0, y0, x1, y1, 0.022));
  draw("louvre", x0 + 0.045, y0 + 0.045, x1 - 0.045, y1 - 0.045, 0.035);
  for (let y = y0 + 0.12; y + 0.025 < y1 - 0.045; y += 0.13)
    draw("slat", x0 + 0.05, y, x1 - 0.05, y + 0.025, 0.05);
}
function body(m: MeshBuilder, livery: Cd150Livery): void {
  const { bands } = livery;
  m.scope("shell", () => {
    m.cap("underframe", shellRing(1.2), 1.2, false);
    // split where the cab profile kinks and where the colours change
    const hs = splitHeights(bands, 1.2, 3.7, [1.6, 1.9, 2.6, 2.7]);
    for (let i = 1; i < hs.length; i++) {
      const [a, b] = [hs[i - 1]!, hs[i]!];
      m.loft(bandAt(bands, (a + b) / 2)[2], shellRing(a), a, shellRing(b), b, false);
    }
    m.loft("roof", shellRing(3.7), 3.7, plan(7, 1.42, 1.42), 3.9, false);
    m.loft("roof", plan(7, 1.42, 1.42), 3.9, plan(5.8, 1.3, 1.3), 4.2);
  });
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      m.scope("ribs", () => {
        for (let y = 2.05; y < 3.55; y += 0.24) {
          const band = bandAt(bands, y);
          sideBox(m, band[3] ?? band[2], s, -5.8, y, 5.8, y + 0.075, 0.008);
        }
      });
      if (s > 0)
        m.scope("machine room grilles", () => {
          for (const [i, [a, b]] of [
            [-5.5, -2.6],
            [2.6, 5.5],
          ].entries())
            m.scope(`bank ${i + 1}`, () => {
              grille(m, s, a, b, 1.9, 3.5);
              sideBox(
                m,
                "roof",
                s,
                (a + b) / 2 - 0.025,
                1.93,
                (a + b) / 2 + 0.025,
                3.47,
                0.05,
              );
            });
        });
      else
        m.scope("machine room windows", () => {
          for (const [i, x] of [-4.7, -1.7, 0.8, 3.8].entries())
            m.scope(`window ${i + 1}`, () => {
              sideBox(m, "rubber", s, x, 2.7, x + 0.9, 3.3, 0.022);
              sideBox(m, "glass", s, x + 0.06, 2.75, x + 0.84, 3.25, 0.04);
            });
        });
      m.scope("number plate", () => {
        sideBox(m, "plate", s, -0.5, 2.0, 0.5, 2.3, 0.028);
        const w = letteringWidth(livery.number, 0.08, 0.025);
        m.facets(
          "white",
          lettering(
            livery.number,
            s < 0 ? w / 2 : -w / 2,
            2.05,
            0.2,
            0.08,
            0.025,
            s < 0,
          ).map(([x, y]) => [x, y, s * 1.534]),
          [0, 0, s],
        );
      });
      // The green side skirt covers the frame down to 0.9 m above rail (native
      // side BMPs and photographs: only the lower wheels show below it), stops at
      // the cab-door steps, and drops to 0.6 m between the bogies over
      // x=-1.1..1.1 at the native slope (0.3 m per 0.4 m).
      m.scope("skirt", () => {
        for (const [a, b] of [
          [-7.35, -6.95],
          [-5.85, 5.85],
          [6.95, 7.35],
        ])
          sidePanel(m, livery.skirt, s, rect(a!, 0.9, b!, 1.3), 0.003, 0.04);
        sidePanel(
          m,
          livery.skirt,
          s,
          [
            [-1.1, 0.6],
            [1.1, 0.6],
            [1.5, 0.92],
            [-1.5, 0.92],
          ],
          0.003,
          0.04,
        );
      });
      if (livery.sideEmblem) m.scope("emblem", () => {
        const x = s > 0 ? 3.3 : -4;
        m.facets(
          "logo",
          emblem(x, 1.3, 0.35, s < 0).map(([u, v]) => [u, v, s * 1.525]),
          [0, 0, s],
        );
      });
    });
  m.scope("cooler", () => {
    m.scope("painted skirt", () =>
      sideBox(m, "cooler", 1, -2.21, 2.7, 2.21, 3.81, 0.016),
    );
    // XML vent clips: asymmetric cross-section; long side at source -Z.
    const q: Ring = [
      [-1.495, 3.5],
      [1.495, 3.5],
      [1.495, 3.8],
      [1.2, 4.6],
      [0.8, 4.6],
      [0.2, 4.3],
      [-0.2, 4.2],
      [-0.4, 4.1],
      [-1.4, 4.1],
      [-1.495, 3.8],
    ];
    const section = q.map(([z, y]) => [-z, y] as [number, number]);
    m.sweep("cooler", "x", section, -2.215, section, 2.215);
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right grilles" : "left grilles", () => {
        const y1 = s > 0 ? 3.6 : 4.5;
        const y0 = s > 0 ? 2.9 : 3.7;
        const boxes =
          s > 0
            ? [
                [63, 70],
                [70, 77],
                [77, 84],
                [85, 92],
                [92, 99],
                [99, 106],
              ]
            : [
                [64, 75],
                [74, 85],
                [85, 96],
                [95, 106],
              ];
        for (const [i, [a, b]] of boxes.entries())
          m.scope(`panel ${i + 1}`, () =>
            grille(
              m,
              s,
              a! / 10 - 8.5,
              b! / 10 - 8.5,
              y0,
              s > 0 ? y1 : 4.59,
              true,
            ),
          );
      });
  });
}
function cab(m: MeshBuilder, e: number, livery: Cd150Livery): void {
  m.scope("windscreen", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "right pane" : "left pane", () => {
        const [a, b] = side(s, 0.1, 1.38);
        endPanel(m, "rubber", e, rect(a, 2.8, b, 3.6), 0.025);
        const [c, d] = side(s, 0.15, 1.33);
        endPanel(m, "glass", e, rect(c, 2.84, d, 3.55), 0.04);
        endPanel(
          m,
          "rubber",
          e,
          [
            [s * 0.33, 2.86],
            [s * 0.36, 2.86],
            [s * 1.12, 3.44],
            [s * 1.09, 3.46],
          ],
          0.052,
          0.008,
        );
      });
  });
  m.scope("lamps", () => {
    // Photographs: a dark housing on the cab roof edge with two round lenses.
    m.scope("headlight", () => {
      endPanel(m, "rubber", e, rect(-0.3, 3.62, 0.3, 3.86), 0.03);
      m.scope("lenses", () => {
        for (const z of [-0.13, 0.13])
          endPanel(m, "lampHead", e, ngon(16, 0.08, 0, z, 3.74), 0.045);
      });
    });
    // Photographs: chrome-rimmed pairs level with the plate, just below the
    // cream/green boundary (the coarse BMP puts them 0.35 m lower).
    for (const s of [-1, 1])
      for (const [i, z] of [s * 0.87, s * 1.13].entries())
        m.scope(`${s > 0 ? "right" : "left"} marker ${i}`, () => {
          endPanel(m, "steel", e, ngon(16, 0.125, 0, z, 1.75), 0.045);
          endPanel(
            m,
            i === 0 ? "lampHead" : "lampRed",
            e,
            ngon(16, 0.095, 0, z, 1.75),
            0.055,
          );
        });
  });
  m.scope("number plate", () => {
    m.scope("housing", () =>
      endPanel(m, "plate", e, rect(-0.5, 1.64, 0.5, 1.87), 0.035),
    );
    const w = letteringWidth(livery.number, 0.07, 0.02);
    m.facets(
      "white",
      lettering(
        livery.number,
        e > 0 ? w / 2 : -w / 2,
        1.675,
        0.16,
        0.07,
        0.02,
        e > 0,
      ).map(([z, y]) => [e * (frontX(y, e) + 0.045), y, z]),
      [e, 0, 0],
    );
  });
  if (livery.frontEmblem) m.scope("emblem", () => {
    m.facets(
      "logo",
      emblem(e > 0 ? 0.3 : -0.3, 2.02, 0.38, e > 0).map(([z, y]) => [
        e * 8.02,
        y,
        z,
      ]),
      [e, 0, 0],
    );
  });
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      const x0 = e > 0 ? 5.9 : -6.9,
        x1 = x0 + 1.0;
      m.scope("door", () => {
        sideBox(m, "roof", s, x0, 1.6, x1, 3.5, 0.02);
        for (const [y0, y1, mat] of bandPieces(livery.door ?? livery.cabBands ?? livery.bands, 1.75, 3.44))
          sideBox(m, mat, s, x0 + 0.08, y0, x1 - 0.08, y1, 0.035);
        m.scope("glass", () =>
          sideBox(m, "glass", s, x0 + 0.2, 2.7, x1 - 0.2, 3.4, 0.052),
        );
        sideBox(m, "underframe", s, x0 + 0.22, 1.94, x1 - 0.15, 2.0, 0.06);
      });
      m.scope("steps", () => {
        for (const y of [0.65, 0.95, 1.25, 1.5])
          block(
            m,
            "steel",
            x0 + 0.18,
            x1 - 0.1,
            y,
            y + 0.045,
            ...side(s, 1.25, 1.55),
          );
      });
      m.scope("handrails", () => {
        for (const x of [x0 - 0.05, x1 + 0.05])
          m.prism(
            "steel",
            ngon(8, 0.018, 0, x, s * (halfWidth(x) + 0.025)),
            1.75,
            2.85,
          );
      });
    });
  // Photographs: the green front wraps down to the buffer beam.
  m.scope("apron", () =>
    block(
      m,
      livery.skirt,
      ...([e * 7.74, e * 7.84].sort((a, b) => a - b) as [number, number]),
      0.8,
      1.22,
      -1.36,
      1.36,
    ),
  );
  m.scope("buffers", () => {
    for (const z of [-0.875, 0.875]) {
      const q = ngon(12, 0.12, 0, z, 1);
      m.sweep("steel", "x", q, e * 7.8, q, e * 8.35);
      block(
        m,
        "underframe",
        ...([e * 8.33, e * 8.4].sort((a, b) => a - b) as [number, number]),
        0.8,
        1.2,
        z - 0.35,
        z + 0.35,
      );
    }
    block(
      m,
      "underframe",
      ...([e * 7.8, e * 8.3].sort((a, b) => a - b) as [number, number]),
      0.88,
      1.08,
      -0.06,
      0.06,
    );
  });
}
// The running gear follows the photographs (assets/cd-150): spoked wheels,
// axle boxes between paired primary coils on an equaliser, a side frame that
// drops between the axles to carry the large secondary coils on a spring
// plank, nose-hung traction motors, brake cylinders and sandboxes.
function bogie(m: MeshBuilder, xc: number): void {
  const r = 0.625,
    ay = r * Math.cos(Math.PI / 24);
  for (const dx of [-1.65, 1.65])
    m.scope("wheelset", () => {
      const x = xc + dx,
        axle = ngon(10, 0.08, 0, x, ay);
      m.sweep("steel", "z", axle, -1.02, axle, 1.02);
      for (const s of [-1, 1]) {
        const wheel = ngon(24, r, Math.PI / 24, x, ay),
          disc = ngon(20, 0.48, 0, x, ay);
        const [w0, w1] = side(s, 0.665, 0.8);
        m.sweep("steel", "z", wheel, w0, wheel, w1);
        const [a, b] = side(s, 0.79, 0.825);
        m.sweep("wheel", "z", disc, a, disc, b);
        // Photographs: cast spoked wheel centres, ten spokes and a hub.
        m.scope("spokes", () => {
          const [c, d] = side(s, 0.825, 0.845);
          const hub = ngon(12, 0.13, 0, x, ay);
          m.sweep("steel", "z", hub, c, hub, d);
          for (let k = 0; k < 10; k++) {
            const t = (k * Math.PI) / 5,
              u = [Math.cos(t), Math.sin(t)],
              n = [-u[1]! * 0.025, u[0]! * 0.025];
            const q: Ring = [0.12, 0.47].flatMap((r, j) =>
              (j === 0 ? [1, -1] : [-1, 1]).map(
                (sg) =>
                  [x + u[0]! * r + sg * n[0]!, ay + u[1]! * r + sg * n[1]!] as [
                    number,
                    number,
                  ],
              ),
            );
            m.sweep("steel", "z", q, c, q, d);
          }
        });
        m.scope("axle box", () => {
          const box = ngon(8, 0.15, Math.PI / 8, x, ay);
          const [c, d] = side(s, 0.835, 1.06);
          m.sweep("bogie", "z", box, c, box, d);
          block(m, "bogie", x - 0.17, x + 0.17, ay + 0.06, ay + 0.2, ...side(s, 0.87, 1.04)); // the guide under the frame
          block(m, "underframe", x - 0.05, x + 0.05, ay - 0.05, ay + 0.05, ...side(s, 1.06, 1.08)); // its cover
        });
        m.scope("primary suspension", () => {
          // the equaliser under the box, a coil at either end of it
          block(m, "bogie", x - 0.5, x + 0.5, ay - 0.13, ay - 0.05, ...side(s, 0.92, 1.04));
          for (const d of [-0.38, 0.38])
            coil(m, "spring", x + d, s * 0.98, ay - 0.05, 0.84, 0.085, 2, 8);
        });
      }
      // the traction motor, nose-hung toward the bogie's centre
      const motor = ngon(12, 0.34, 0, x - Math.sign(dx) * 0.6, 0.6);
      m.sweep("bogie", "z", motor, -0.55, motor, 0.55);
    });
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      // the side frame in profile: level over the axle boxes, dropped between them
      const top: Ring = [[-2.15, 1.02], [-1.15, 1.02], [-0.8, 0.86], [0.8, 0.86], [1.15, 1.02], [2.15, 1.02]];
      const bottom: Ring = [[-2.15, 0.84], [-1.25, 0.84], [-0.85, 0.5], [0.85, 0.5], [1.25, 0.84], [2.15, 0.84]];
      plate(
        m,
        "bogie",
        top.map(([u, v]) => [xc + u, v]),
        bottom.map(([u, v]) => [xc + u, v]),
        ...side(s, 0.92, 1.1),
      );
      // the spring plank under the dropped centre, out to the secondary coils
      block(m, "bogie", xc - 0.55, xc + 0.55, 0.42, 0.52, ...side(s, 0.94, 1.38));
    }
    for (const x of [xc - 0.55, xc + 0.55])
      block(m, "bogie", x - 0.08, x + 0.08, 0.7, 0.9, -0.92, 0.92); // transoms
    for (const x of [xc - 2.1, xc + 2.1])
      block(m, "bogie", x - 0.05, x + 0.05, 0.78, 0.98, -1.0, 1.0); // headstocks
  });
  m.scope("secondary suspension", () => {
    for (const s of [-1, 1]) {
      for (const d of [-0.3, 0.3])
        coil(m, "spring", xc + d, s * 1.2, 0.52, 0.94, 0.14, 3);
      // the body's bracket over the coils
      block(m, "underframe", xc - 0.5, xc + 0.5, 0.92, 0.96, ...side(s, 1.0, 1.4));
    }
  });
  m.scope("brake cylinders", () => {
    for (const s of [-1, 1])
      for (const d of [-0.95, 0.95]) {
        const cyl = ngon(8, 0.1, Math.PI / 8, xc + d, 0.72);
        const [z0, z1] = side(s, 0.6, 0.9);
        m.sweep("spring", "z", cyl, z0, cyl, z1);
      }
  });
  m.scope("sandboxes", () => {
    for (const o of [-1, 1]) {
      const x = xc + o * 2.3;
      for (const s of [-1, 1]) {
        block(m, "bogie", x - 0.1, x + 0.1, 0.56, 0.9, ...side(s, 0.62, 0.9));
        m.prism("underframe", ngon(6, 0.02, 0, x - o * 0.06, s * 0.74), 0.12, 0.58);
      }
    }
  });
}
function pantograph(
  m: MeshBuilder,
  xc: number,
  h: number,
  raised: boolean,
): void {
  const base = 4.35,
    arm = 1.66,
    rise = raised ? 0.92 : 0.12;
  const dx = Math.sqrt(arm * arm - rise * rise),
    hinge = xc + h * 0.65,
    knee = hinge - h * dx;
  m.scope("base", () => {
    for (const d of [-0.55, 0.55])
      for (const z of [-0.46, 0.46]) {
        m.prism("insulator", ngon(10, 0.07, 0, xc + d, z), 4.19, base);
      }
    for (const z of [-0.46, 0.46])
      block(
        m,
        "pantograph",
        xc - 0.7,
        xc + 0.7,
        base - 0.01,
        base + 0.05,
        z - 0.03,
        z + 0.03,
      );
  });
  m.scope("arms", () => {
    for (const s of [-1, 1]) {
      tubeX(
        m,
        "pantograph",
        0.035,
        hinge,
        base,
        s * 0.46,
        knee,
        base + rise,
        s * 0.2,
      );
      tubeX(
        m,
        "pantograph",
        0.028,
        knee,
        base + rise,
        s * 0.2,
        hinge,
        base + 2 * rise,
        s * 0.46,
      );
    }
  });
  m.scope("head", () => {
    for (const d of [-0.12, 0.12]) {
      block(
        m,
        "carbon",
        hinge + d - 0.03,
        hinge + d + 0.03,
        base + 2 * rise,
        base + 2 * rise + 0.05,
        -0.65,
        0.65,
      );
      for (const s of [-1, 1]) {
        const a = ngon(8, 0.02, 0, hinge + d, base + 2 * rise + 0.02),
          b = ngon(8, 0.02, 0, hinge + d, base + 2 * rise - 0.08);
        m.sweep("pantograph", "z", a, s * 0.65, b, s * 0.9);
      }
    }
  });
}
/** Where a livery's cab paint begins: clear of the ribs and the skirt, ahead of the doors. */
const CAB_X = 5.85;

/**
 * A livery's cab paint (`cabBands`): a one-sided skin 3 mm off the shell over
 * the tapered cab sides and the end at `e`, split where the profile kinks and
 * the colours change.
 */
function cabPaint(m: MeshBuilder, e: number, bands: readonly Band[]): void {
  const line = (y: number): Vec3[] => {
    const fx = frontX(y, e);
    // the side runs from (5.8, 1.5) to the end's corner (fx, 1.4)
    const z = 1.5 - (0.1 * (CAB_X - 5.8)) / (fx - 5.8);
    const pts: Array<[number, number]> = [[CAB_X, -z], [fx, -1.4], [fx, 1.4], [CAB_X, z]];
    return pts.map(([x, zz]): Vec3 => [e * x, y, zz]);
  };
  const hs = splitHeights(bands, 1.2, 3.69, [1.6, 1.9, e > 0 ? 2.7 : 2.6]);
  for (let i = 1; i < hs.length; i++) {
    const [y0, y1] = [hs[i - 1]!, hs[i]!];
    const mat = bandAt(bands, (y0 + y1) / 2)[2];
    const [lo, hi] = [line(y0), line(y1)];
    for (let k = 0; k + 1 < lo.length; k++) {
      const quad = [lo[k]!, lo[k + 1]!, hi[k + 1]!, hi[k]!];
      const [a, b, d] = [quad[0]!, quad[1]!, quad[3]!];
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
      let n: Vec3 = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
      const l = Math.hypot(...n);
      n = [n[0] / l, n[1] / l, n[2] / l];
      // away from a point on the axis inside the cab
      const [cx, cz] = [(a[0] + b[0]) / 2 - e * 6.5, (a[2] + b[2]) / 2];
      if (n[0] * cx + n[2] * cz < 0) n = [-n[0], -n[1], -n[2]];
      const q = quad.map((p): Vec3 => [p[0] + n[0] * 0.003, p[1] + n[1] * 0.003, p[2] + n[2] * 0.003]);
      m.facets(mat, [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!], n);
    }
  }
}

/** The CD 150 in one of its liveries (CD 150, CD 151, ZSR 350); the default is 150 222-8. */
export function cd150(params?: ParamValues): MeshBuilder {
  const { livery: key } = resolveParams(CD150_PARAMS, params);
  const livery: Cd150Livery = CD150_LIVERIES[key as keyof typeof CD150_LIVERIES];
  const m = new MeshBuilder({ ...PALETTE, ...livery.palette });
  m.scope("body", () => body(m, livery));
  if (livery.cabBands) m.scope("cab paint", () => { for (const e of [-1, 1]) cabPaint(m, e, livery.cabBands!); });
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => cab(m, e, livery));
  m.scope("bogies", () => {
    for (const [name, x] of [
      ["rear bogie", -4.25],
      ["front bogie", 4.15],
    ] as const)
      m.scope(name, () => bogie(m, x));
  });
  m.scope("underframe", () => {
    block(m, "underframe", -7.8, 7.8, 0.94, 1.25, -1.35, 1.35);
    block(m, "bogie", -1, 1, 0.35, 0.95, -1.3, 1.3);
    for (const e of [-1, 1]) {
      const tank = ngon(16, 0.25, 0, e * 7.25, 0.56);
      m.sweep("steel", "z", tank, -1.15, tank, 1.15);
    }
  });
  m.scope("roof equipment", () => {
    m.scope("pantographs", () => {
      m.scope("rear pantograph", () => pantograph(m, -4.25, 1, true));
      m.scope("front pantograph", () => pantograph(m, 4.25, -1, false));
    });
    m.scope("high voltage line", () => {
      for (const x of [-2.6, 2.6])
        m.prism("insulator", ngon(10, 0.07, 0, x, -0.6), 4.19, 4.45);
      tubeX(m, "copper", 0.018, -4.1, 4.45, -0.6, 4.1, 4.45, -0.6);
    });
  });
  return m;
}
