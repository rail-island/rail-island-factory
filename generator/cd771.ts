// The CKD T 669.1 (CD 770 / 771) "Cmelak": a Co'Co' diesel-electric hood unit
// for heavy shunting and freight, the CME3 of the Soviet railways, with an
// offset cab between a short and a long hood and walkways all round. One
// design with a `livery` parameter for three vlakosimdb models ("cd 771",
// cd_771.235, cd_771.421), reconstructed from their native JT7 XML and BMPs
// (assets/cd-771/native) and photographs (assets/cd-771/*.jpg).
//
// Source coordinates (cd_771.235): x along the frame from the side BMP's left
// edge -- the buffers 0 .. 17.6 of an 18 m canvas, the short hood at the left --
// y up, z across. The drawing is 17.6 m over the buffers where the published
// locomotive is 17.24 m, so Factory X = (x - 8.8) * K with K = 0.98, the short
// hood toward +X. 8.66 m between the pivots, 2 x 2.0 m bogie wheelbase, 1.05 m
// wheels, 3.15 m over the walkways (published; the model keeps 3.1 m).

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { runningNumber, tubeX } from "./cd163.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { DIESEL_PALETTE, block, bogie, buffers, coupling, extrude, paint, side, tankX, type BogieSpec } from "./dieselParts.ts";

export interface Cd771Livery {
  title: string;
  source: string;
  number: string;
  numberSource: string;
  palette: Record<string, MaterialSpec>;
  /** The hoods' sides by height (1.7 .. 4.4 m) and their roofs. */
  hood: ReadonlyArray<readonly [number, number, string]>;
  hoodRoof: string;
  cab: string;
  cabRoof: string;
  /** The band across the cab under its windows. */
  cabBand?: readonly [number, number, string];
  frame: string;
  rails: string;
}

const C = (hex: string) => paint(hex);

export const CD771_LIVERIES = {
  cd771: {
    title: "CD 771, green with the white band",
    source: "cd 771",
    number: runningNumber("771", "131"),
    numberSource: "illustrative, a unit of the class (771 131-0, photo-771-131.jpg); the native plate does not resolve digits",
    palette: { green: C("#2e5b00"), white: C("#f2f2ee"), red: C("#b7322f"), lightGreen: C("#4f9d00") },
    // "cd 771" z_both rows 8..16 white (3.1 .. 3.9 m of its 4.7 m canvas), green below and above
    hood: [[1.7, 3.1, "green"], [3.1, 3.9, "white"], [3.9, 4.6, "green"]],
    hoodRoof: "lightGreen",
    cab: "green",
    cabRoof: "lightGreen",
    frame: "red",
    rails: "handrail",
  },
  cd771No235: {
    title: "CD 771 235, green with the cream band",
    source: "cd_771.235",
    number: runningNumber("771", "235"),
    numberSource: "the vlakosimdb model's name",
    palette: { green: C("#006300"), darkGreen: C("#334a2b"), cream: C("#cec69c"), red: C("#a50022") },
    // cd_771.235 z_both rows 24..29 cream (3.0 .. 3.6 m), rows 22..23 and 30..32 dark green
    hood: [[1.7, 2.7, "green"], [2.7, 3.0, "darkGreen"], [3.0, 3.6, "cream"], [3.6, 3.8, "darkGreen"], [3.8, 4.6, "green"]],
    hoodRoof: "green",
    cab: "green",
    cabRoof: "green",
    frame: "red",
    rails: "handrail",
  },
  cd771No421: {
    title: "CD 771 421, red with the grey roof",
    source: "cd_771.421",
    number: runningNumber("771", "421"),
    numberSource: "the vlakosimdb model's name",
    palette: { red: C("#ad1515"), lightRed: C("#c6524a"), roofGrey: C("#6b6b6b"), frameGrey: C("#5a5a5a") },
    hood: [[1.7, 3.8, "red"], [3.8, 3.9, "lightRed"], [3.9, 4.6, "red"]],
    hoodRoof: "roofGrey",
    cab: "red",
    cabRoof: "roofGrey",
    frame: "frameGrey",
    rails: "handrail",
  },
} as const satisfies Record<string, Cd771Livery>;

export const CD771_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd771No235",
  values: Object.entries(CD771_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];

export const CD771_NUMBER = CD771_LIVERIES.cd771No235.number;

export const K = 0.98;
const CENTRE = 8.8;
/** Source x (short hood at the left, 0 .. 17.6) to Factory x (short hood toward +X). */
const X = (sx: number) => (CENTRE - sx) * K;
const span = (a: number, b: number): [number, number] => [Math.min(X(a), X(b)), Math.max(X(a), X(b))];

const DECK = 1.7; // the walkway's top (XML alongx base, z_both row 43)
const HOOD_TOP = 4.4;
/** XML alongx: the hoods 2.0 m wide, their roofs chamfered from 4.2 m. */
const HOOD: Ring = [[-1.0, DECK], [1.0, DECK], [1.0, 3.8], [0.9, 4.2], [0.6, HOOD_TOP], [-0.6, HOOD_TOP], [-0.9, 4.2], [-1.0, 3.8]];
/** XML alongx "cab": 3.0 m wide, the roof rolling to 4.6 m. */
const CAB: Ring = [[-1.5, DECK], [1.5, DECK], [1.5, 3.9], [1.4, 4.2], [1.3, 4.3], [1.1, 4.4], [0.8, 4.5], [0, 4.6], [-0.8, 4.5], [-1.1, 4.4], [-1.3, 4.3], [-1.4, 4.2], [-1.5, 3.9]];
// the hoods (source x) and the cab (3.1 .. 5.2, its roof 3.0 .. 5.3)
const SHORT_HOOD: [number, number] = [1.0, 3.1];
const LONG_HOOD: [number, number] = [5.2, 16.6];
const CAB_X: [number, number] = [3.1, 5.2];

export function cd771(params?: ParamValues): MeshBuilder {
  const { livery: key } = resolveParams(CD771_PARAMS, params);
  const l: Cd771Livery = CD771_LIVERIES[key as keyof typeof CD771_LIVERIES];
  const m = new MeshBuilder({ ...DIESEL_PALETTE, ...l.palette });
  m.scope("frame", () => frame(m, l));
  m.scope("short hood", () => hood(m, l, SHORT_HOOD, 1));
  m.scope("long hood", () => hood(m, l, LONG_HOOD, -1));
  m.scope("cab", () => cab(m, l));
  m.scope("walkways", () => walkways(m, l));
  const spec: BogieSpec = {
    axles: [-2.0, 0, 2.0], wheelR: 0.525, frameHalf: 2.75, frameTop: 1.05, frameBottom: 0.68, frameZ: [0.92, 1.06],
    primary: "coil", secondary: [-1.0, 1.0], secondaryZ: 1.18, bolster: 1.25,
  };
  m.scope("bogies", () => {
    m.scope("short hood bogie", () => bogie(m, 4.33, spec));
    m.scope("long hood bogie", () => bogie(m, -4.33, spec));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}

function frame(m: MeshBuilder, l: Cd771Livery): void {
  // the main frame and walkway deck, 1.25 .. 1.7 m, between the end plates at source 0.4 and 17.2
  const [x0, x1] = span(0.45, 17.15);
  m.scope("deck", () => block(m, l.frame, x0, x1, 1.25, DECK, -1.55, 1.55));
  for (const e of [1, -1])
    m.scope(e > 0 ? "short hood end" : "long hood end", () => {
      const face = e > 0 ? X(0.4) : X(17.2) * -1;
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the end plate and buffer beam (XML "p": 0.4 .. 1.7 m), the buffers (XML "n", 0.8 .. 1.2 m)
      m.scope("end plate", () => block(m, l.frame, ...along(face - 0.12, face), 0.32, DECK, -1.5, 1.5));
      m.scope("hazard stripes", () => {
        const pts: Vec3[] = [];
        for (let i = -5; i <= 5; i++) {
          const z = i * 0.27;
          for (const [a, b, c] of [[0, 1, 2], [0, 2, 3]] as const) {
            const q: Vec3[] = [[face + 0.004, 0.5, z - 0.06], [face + 0.004, 0.5, z + 0.06], [face + 0.004, 0.75, z + 0.16], [face + 0.004, 0.75, z + 0.04]];
            pts.push(...[q[a]!, q[b]!, q[c]!].map((p): Vec3 => [e * p[0], p[1], p[2]]));
          }
        }
        m.facets("hazard", pts, [e, 0, 0]);
      });
      buffers(m, e, face, 8.625, 1.0, "round");
      coupling(m, e, face, 1.0);
      m.scope("lamps", () => {
        for (const z of [-0.95, 0.95]) {
          const rim = ngon(10, 0.1, 0, z, 1.45), lens = ngon(10, 0.07, 0, z, 1.45);
          extrude(m, "black", "x", rim, along(face, face + 0.05));
          extrude(m, e > 0 ? "lampHead" : "lampRed", "x", lens, along(face + 0.05, face + 0.07));
        }
      });
      // the end steps at the corners (XML "s": 0.4 .. 0.8 m from the end, every 0.4 m)
      m.scope("steps", () => {
        for (const s of [-1, 1]) {
          for (const y of [0.5, 0.9]) block(m, "steel", ...along(face - 0.45, face - 0.05), y, y + 0.04, ...side(s, 1.1, 1.49));
          block(m, "steel", ...along(face - 0.45, face - 0.05), 0.48, DECK - 0.02, ...side(s, 1.5, 1.54));
        }
      });
    });
}

function hood(m: MeshBuilder, l: Cd771Livery, [a, b]: [number, number], e: number): void {
  const [x0, x1] = span(a, b);
  // the sides painted by height: one sweep per band, cut from the hood's section
  for (const [y0, y1, mat] of l.hood) {
    const lo = Math.max(y0, DECK), hi = Math.min(y1, 3.8);
    if (hi <= lo) continue;
    m.scope(`band ${mat}`, () => {
      for (const s of [-1, 1]) m.sweep(mat, "x", [[s * 0.99, lo], [s * 1.0, lo], [s * 1.0, hi], [s * 0.99, hi]], x0, [[s * 0.99, lo], [s * 1.0, lo], [s * 1.0, hi], [s * 0.99, hi]], x1, false);
    });
  }
  // the core, its roof and its ends (the ends take the colour of the band at their height: the lower one)
  const core: Ring = HOOD.map(([z, y]): [number, number] => [Math.abs(z) === 1.0 ? z * 0.99 : z, y]);
  m.scope("core", () => m.sweep(l.hood[0]![2], "x", core, x0, core, x1));
  m.scope("roof", () => {
    const r: Ring = [[-1.0, 3.8], [1.0, 3.8], [0.9, 4.2], [0.6, HOOD_TOP], [-0.6, HOOD_TOP], [-0.9, 4.2]];
    m.sweep(l.hoodRoof, "x", r.map(([z, y]) => [z * 1.005, y + 0.003]), x0, r.map(([z, y]) => [z * 1.005, y + 0.003]), x1, false);
  });
  // louvred doors along the sides (z_both: columns 61..141 of the long hood, rows 21..41)
  m.scope("doors", () => {
    const n = Math.max(1, Math.round((x1 - x0) / 1.15));
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++)
      for (const s of [-1, 1]) {
        const xa = x0 + i * w + 0.06, xb = x0 + (i + 1) * w - 0.06;
        const zz = s * 1.006;
        m.facets("louvre", [[xa, 1.85, zz], [xb, 1.85, zz], [xb, 1.87, zz], [xa, 1.85, zz], [xb, 1.87, zz], [xa, 1.87, zz]], [0, 0, s]);
        for (let y = 2.95; y < 3.7; y += 0.12) {
          const q: Vec3[] = [[xa + 0.1, y, zz + s * 0.004], [xb - 0.1, y, zz + s * 0.004], [xb - 0.1, y + 0.05, zz + s * 0.004], [xa + 0.1, y + 0.05, zz + s * 0.004]];
          m.facets("louvre", [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!], [0, 0, s]);
        }
        const seam: Vec3[] = [[xb + 0.05, 1.85, zz], [xb + 0.07, 1.85, zz], [xb + 0.07, 3.75, zz], [xb + 0.05, 3.75, zz]];
        if (i < n - 1) m.facets("louvre", [seam[0]!, seam[1]!, seam[2]!, seam[0]!, seam[2]!, seam[3]!], [0, 0, s]);
      }
  });
  // the end: the roof's cap over the face with the headlight (XML "box": to 0.7 / 16.9), a radiator grille below
  const endX = e > 0 ? x1 : x0;
  const out = (d: number) => endX + e * d;
  m.scope("end", () => {
    const cap: Ring = [[-1.0, 4.1], [1.0, 4.1], [0.9, 4.25], [0.6, HOOD_TOP], [-0.6, HOOD_TOP], [-0.9, 4.25]];
    m.scope("cap", () => m.sweep(l.hoodRoof, "x", cap, Math.min(endX, out(0.3)), cap, Math.max(endX, out(0.3))));
    const lens = ngon(12, 0.13, 0, 0, 4.25);
    m.scope("headlight", () => m.sweep("lampHead", "x", lens, Math.min(out(0.3), out(0.32)), lens, Math.max(out(0.3), out(0.32))));
    m.scope("grille", () => {
      block(m, "grille", Math.min(endX, out(0.02)), Math.max(endX, out(0.02)), 2.8, 3.8, -0.95, 0.95);
      for (let y = 2.88; y < 3.75; y += 0.1) block(m, "louvre", Math.min(out(0.01), out(0.03)), Math.max(out(0.01), out(0.03)), y, y + 0.04, -0.9, 0.9);
    });
    m.scope("number plate", () => {
      const text = l.number;
      const w = strokeWidth(text, 0.055, 0.016);
      block(m, "plate", Math.min(endX, out(0.025)), Math.max(endX, out(0.025)), 2.0, 2.2, -(w / 2 + 0.05), w / 2 + 0.05);
      m.facets("white", strokeText(text, -w / 2, 2.035, 0.13, 0.055, 0.016, false).map(([u, v]): Vec3 => [out(0.03), v, -e * u]), [e, 0, 0]);
    });
  });
}

function cab(m: MeshBuilder, l: Cd771Livery): void {
  const [x0, x1] = span(...CAB_X);
  const [r0, r1] = span(3.0, 5.3);
  m.scope("body", () => m.sweep(l.cab, "x", CAB.filter(([, y]) => y <= 3.9 + 1e-9), x0, CAB.filter(([, y]) => y <= 3.9 + 1e-9), x1));
  m.scope("roof", () => {
    const r = CAB.filter(([, y]) => y >= 3.9 - 1e-9);
    m.sweep(l.cabRoof, "x", r, r0, r, r1);
  });
  // the front and rear windows beside the hoods (x_both rows 22..30, columns 0..4: |z| 1.0 .. 1.5, 3.0 .. 3.8 m)
  m.scope("end windows", () => {
    for (const x of [x0, x1])
      for (const s of [-1, 1]) {
        const e = x === x1 ? 1 : -1;
        // named as seen from ahead of that end
        m.scope(`${e > 0 ? "front" : "rear"} ${s * e > 0 ? "left" : "right"}`, () => {
          block(m, "rubber", x + (e > 0 ? -0.01 : -0.02), x + (e > 0 ? 0.02 : 0.01), 3.0, 3.8, ...side(s, 1.04, 1.44));
          block(m, "glass", x + (e > 0 ? -0.005 : -0.03), x + (e > 0 ? 0.03 : 0.005), 3.04, 3.76, ...side(s, 1.08, 1.4));
        });
      }
  });
  // the side windows (z_both columns 34..48, rows 22..30: two panes, 3.0 .. 3.8 m)
  m.scope("side windows", () => {
    const [a, b] = span(3.4, 4.9);
    for (const s of [-1, 1])
      for (const [p, q] of [[a, (a + b) / 2], [(a + b) / 2, b]] as const) {
        block(m, "rubber", p + 0.02, q - 0.02, 3.0, 3.8, ...side(s, 1.49, 1.52));
        block(m, "glass", p + 0.06, q - 0.06, 3.04, 3.76, ...side(s, 1.5, 1.525));
      }
  });
  m.scope("horn", () => block(m, "horn", X(4.15) - 0.1, X(4.15) + 0.1, 4.6, 4.68, -0.06, 0.06));
}

function walkways(m: MeshBuilder, l: Cd771Livery): void {
  // stanchions every 1.2 m along each side (z_both: rails at 2.2 and 2.7 m, rows 33 and 38), and across the ends
  const ys = [2.2, 2.7];
  for (const s of [-1, 1])
    m.scope(s > 0 ? "right rail" : "left rail", () => {
      for (const [a, b] of [[0.6, 2.95], [5.4, 17.0]] as const) {
        const [x0, x1] = span(a, b);
        for (const y of ys) tubeX(m, l.rails, 0.018, x0, y, s * 1.5, x1, y, s * 1.5, 6);
        const n = Math.max(1, Math.round((x1 - x0) / 1.2));
        for (let i = 0; i <= n; i++) {
          const x = x0 + ((x1 - x0) * i) / n;
          m.prism(l.rails, ngon(6, 0.018, 0, x, s * 1.5), DECK, 2.7);
        }
      }
    });
  m.scope("end rails", () => {
    for (const sx of [0.55, 17.05])
      for (const s of [-1, 1])
        for (const y of ys) m.sweep(l.rails, "z", ngon(6, 0.018, 0, X(sx), y), s * 0.9, ngon(6, 0.018, 0, X(sx), y), s * 1.5);
  });
}

function underframe(m: MeshBuilder): void {
  // the fuel tank between the bogies (XML "box"/"bb": source x 7.7 .. 9.9, 0.3 .. 1.2 m)
  m.scope("fuel tank", () => {
    const sec: Ring = [[-1.4, 0.45], [-1.25, 0.32], [1.25, 0.32], [1.4, 0.45], [1.45, 1.25], [-1.45, 1.25]];
    const [a, b] = span(7.7, 9.9);
    m.sweep("tank", "x", sec, a, sec, b);
    for (const s of [-1, 1]) block(m, "steel", (a + b) / 2 - 0.15, (a + b) / 2 + 0.15, 0.7, 0.9, ...side(s, 1.44, 1.48));
  });
  m.scope("air reservoirs", () => {
    for (const s of [-1, 1]) tankX(m, "spring", X(10.6), X(10.0), s * 0.7, 0.95, 0.22);
  });
}
