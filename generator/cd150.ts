// CD 150, reconstructed from the native JT7 XML and BMPs in assets/cd-150.
// Source coordinates: (x, y, z) -> (x - 8.5, y, -z), metres.
// No runtime textures or sibling database dependency. See assets/cd-150/SOURCES.md.
import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import { block, side } from "./vehicleParts.ts";
import {
  CD163_PALETTE,
  lettering,
  letteringWidth,
  emblem,
  tubeX,
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
function body(m: MeshBuilder): void {
  m.scope("shell", () => {
    m.cap("underframe", shellRing(1.2), 1.2, false);
    const bands: Array<[number, number, string]> = [
      [1.2, 1.6, "green"],
      [1.6, 1.9, "green"],
      [1.9, 2.6, "cream"],
      [2.6, 2.7, "cream"],
      [2.7, 3.7, "cream"],
    ];
    for (const [a, b, mat] of bands)
      m.loft(mat, shellRing(a), a, shellRing(b), b, false);
    m.loft("roof", shellRing(3.7), 3.7, plan(7, 1.42, 1.42), 3.9, false);
    m.loft("roof", plan(7, 1.42, 1.42), 3.9, plan(5.8, 1.3, 1.3), 4.2);
  });
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      m.scope("ribs", () => {
        for (let y = 2.05; y < 3.55; y += 0.24)
          sideBox(m, "rib", s, -5.8, y, 5.8, y + 0.075, 0.008);
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
        const w = letteringWidth(CD150_NUMBER, 0.08, 0.025);
        m.facets(
          "white",
          lettering(
            CD150_NUMBER,
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
      // The green side skirt drops between the bogies: 0.6 m above rail over
      // x=-1.1..1.1, rising at the native slope (0.3 m per 0.4 m) into the body.
      m.scope("skirt", () =>
        sidePanel(
          m,
          "green",
          s,
          [
            [-1.1, 0.6],
            [1.1, 0.6],
            [2.03, 1.3],
            [-2.03, 1.3],
          ],
          0.003,
          0.04,
        ),
      );
      m.scope("emblem", () => {
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
function cab(m: MeshBuilder, e: number): void {
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
    endPanel(m, "lampHead", e, rect(-0.2, 3.6, 0.2, 3.8), 0.045);
    for (const s of [-1, 1])
      for (const [i, z] of [s * 0.95, s * 1.25].entries())
        m.scope(`${s > 0 ? "right" : "left"} marker ${i}`, () => {
          endPanel(m, "yellow", e, ngon(16, 0.125, 0, z, 1.4), 0.045);
          endPanel(
            m,
            i === 0 ? "lampHead" : "lampRed",
            e,
            ngon(16, 0.095, 0, z, 1.4),
            0.055,
          );
        });
  });
  m.scope("number plate", () => {
    m.scope("housing", () =>
      endPanel(m, "plate", e, rect(-0.5, 1.4, 0.5, 1.7), 0.035),
    );
    const w = letteringWidth(CD150_NUMBER, 0.075, 0.022);
    m.facets(
      "white",
      lettering(
        CD150_NUMBER,
        e > 0 ? w / 2 : -w / 2,
        1.45,
        0.2,
        0.075,
        0.022,
        e > 0,
      ).map(([z, y]) => [e * (frontX(y, e) + 0.045), y, z]),
      [e, 0, 0],
    );
  });
  m.scope("emblem", () => {
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
        sideBox(m, "cream", s, x0 + 0.08, 1.75, x1 - 0.08, 3.44, 0.035);
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
  m.scope("buffers", () => {
    for (const z of [-0.875, 0.875]) {
      const q = ngon(12, 0.12, 0, z, 1);
      m.sweep("steel", "x", q, e * 7.85, q, e * 8.35);
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
        block(
          m,
          "bogie",
          x - 0.2,
          x + 0.2,
          ay - 0.14,
          ay + 0.16,
          ...side(s, 0.84, 1.06),
        );
        for (const d of [-0.38, 0.38]) {
          for (let k = 0; k < 4; k++)
            m.prism(
              "spring",
              ngon(10, 0.085, 0, x + d, s * 0.98),
              0.63 + k * 0.045,
              0.65 + k * 0.045,
            );
        }
      }
    });
  for (const s of [-1, 1]) {
    block(m, "bogie", xc - 2.15, xc + 2.15, 0.82, 1.02, ...side(s, 0.92, 1.13));
    block(m, "bogie", xc - 0.5, xc + 0.5, 0.5, 0.85, ...side(s, 0.94, 1.17));
  }
  block(m, "bogie", xc - 0.4, xc + 0.4, 0.86, 1.22, -0.94, 0.94);
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
export function cd150(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => body(m));
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => cab(m, e));
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
      m.scope("rear pantograph", () => pantograph(m, -4.25, -1, true));
      m.scope("front pantograph", () => pantograph(m, 4.25, 1, false));
    });
    m.scope("high voltage line", () => {
      for (const x of [-2.6, 2.6])
        m.prism("insulator", ngon(10, 0.07, 0, x, -0.6), 4.19, 4.45);
      tubeX(m, "copper", 0.018, -4.1, 4.45, -0.6, 4.1, 4.45, -0.6);
    });
  });
  return m;
}
