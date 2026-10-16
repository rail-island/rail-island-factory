// The TGV, the French high-speed train: one design `veh-tgv` whose `unit`
// picks the car - the power car with its nose at +X (the default), the end
// coach that couples to a power car (R1 / R8) or an intermediate coach - and
// whose `livery` picks the TGV Sud-Est (PSE) in its original orange, white and
// grey, or the TGV Atlantique in silver and blue. A set is power car, end
// coach, intermediate coaches, end coach and power car, every car facing the
// same way as the first power car, the last end coach and power car turned.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/tgv/native:
// the PSE power car (db/train/emu/tgv/tgv_loco: its model is a baked polygon
// list, so its shapes are read from the simplemodel `source.xml` beside it),
// the PSE coaches tgv_vag#1 (22 m) and tgv_vag#2 (19 m), and the Atlantique
// cars tgv_at_loco, tgv_at_ch1 and tgv_at_ch2, which repeat those shapes in
// another paint. The two power cars share every XML section and the nose; they
// differ in the roof behind the raised machine-room roof (the Atlantique's
// raised roof runs 2.1 m further back, its pantograph stands 0.5 m further
// back) and in the paint, so the power car follows the livery there.
//
// The coaches are articulated: neighbouring coaches share a Jacobs bogie under
// their joint. Each coach is built as one car that carries the bogie under its
// -X joint (the end coach also its own bogie at the power car), so a set
// coupled in one direction has one bogie at every joint. Lengths are the
// published ones: power car 22.15 m over couplers, end coach 21.845 m from its
// coupler to the joint, intermediate coach 18.7 m between joints; widths 2.814 m
// and 2.904 m, heights 4.10 m and 3.42 m. See docs/models/foreign-units.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import { coil } from "./cd163.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { centreCoupler, EMU_CATALOG, enumParam, pantograph, slopePanel } from "./emuParts.ts";
import { bOf, sideBox, toBody, unitBogie, type PxBox, type SideMap } from "./unitParts.ts";

export type TgvUnit = "powerCar" | "endCoach" | "coach";
export type TgvLivery = "pse" | "atlantique";

export const TGV_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    powerCar: "Power car (cab, pantograph)",
    endCoach: "End coach (R1 / R8, couples to a power car)",
    coach: "Intermediate coach (articulated)",
  }),
  enumParam("livery", "Livery", {
    pse: "TGV Sud-Est: orange, white and grey (vlakosimdb tgv_loco, tgv_vag#1, tgv_vag#2)",
    atlantique: "TGV Atlantique: silver and blue (vlakosimdb tgv_at_loco, tgv_at_ch1, tgv_at_ch2)",
  }),
];

/** Power car: the XML's 21.9 m (nose tip 0.1 m to the coupler 22.0 m) stretched to 22.15 m, 2.814 m wide. */
export const TGV_POWER_LENGTH = 22.15;
const K_X_POWER = TGV_POWER_LENGTH / 21.9;
const K_Z_POWER = 2.814 / 3.0;
/** The power car's XML height is the published 4.10 m. */
export const TGV_K_Y_POWER = 1;
/** End coach: coupler (XML x 0) to the joint (21.6 m), stretched to 21.845 m. */
export const TGV_END_LENGTH = 21.845;
const K_X_END = TGV_END_LENGTH / 21.6;
/** Intermediate coach: joint to joint, XML 0.15 .. 18.65 m, stretched to 18.7 m. */
export const TGV_COACH_LENGTH = 18.7;
const K_X_COACH = TGV_COACH_LENGTH / 18.5;
/** The coaches are 3.42 m high against the XML's 3.6 m roof, 2.904 m wide. */
export const TGV_K_Y_COACH = 3.42 / 3.6;
const K_Z_COACH = 2.904 / 3.0;

export const TGV_MAPS: Record<TgvUnit, SideMap> = {
  powerCar: { x0: 22.0, H: 6, k: K_X_POWER },
  endCoach: { x0: 21.6, H: 5, k: K_X_END, kY: TGV_K_Y_COACH },
  coach: { x0: 18.65, H: 5, k: K_X_COACH, kY: TGV_K_Y_COACH },
};

export function tgvLength(unit: TgvUnit): number {
  return unit === "powerCar" ? TGV_POWER_LENGTH : unit === "endCoach" ? TGV_END_LENGTH : TGV_COACH_LENGTH;
}

interface Livery {
  palette: Record<string, MaterialSpec>;
  /** The power car's nose and cab, its body, the coaches (bottom up, source heights). */
  nose: Array<[number, number, string]>;
  body: Array<[number, number, string]>;
  coach: Array<[number, number, string]>;
  /** The power car's roof behind the cab (source x, y). */
  roof: Pt[];
  /** The raised pantograph's source x and the roof it stands on. */
  pantograph: [number, number];
  /** The PSE's machine room has vertical louvres in its grey band; the Atlantique's blue band is plain. */
  louvres: boolean;
}

// the native BMP colours (tgv_z_dec, tvgvag1_z_both, tgvvag2_z_both of each livery)
const LIVERIES: Record<TgvLivery, Livery> = {
  pse: {
    palette: {
      orange: { color: "#ff8000", roughness: 0.45 },
      orangeLight: { color: "#ffa747", roughness: 0.45 },
      orangeLine: { color: "#f57600", roughness: 0.45 },
      orangeLow: { color: "#ce6100", roughness: 0.55 },
      orangeSkirt: { color: "#a04f00", roughness: 0.6 },
      white: { color: "#f5f5f5", roughness: 0.45 },
      band: { color: "#4a4a4a", roughness: 0.5 },
      coachBand: { color: "#404040", roughness: 0.5 },
      roof: { color: "#808080", roughness: 0.7 },
    },
    nose: [[0.2, 0.9, "orangeLow"], [0.9, 1.1, "orangeLine"], [1.1, 1.5, "white"], [1.5, 4.1, "orange"]],
    body: [[0.2, 0.9, "orangeLow"], [0.9, 1.1, "orangeLine"], [1.1, 1.5, "white"], [1.5, 2.7, "band"], [2.7, 2.8, "white"], [2.8, 3.4, "orangeLight"], [3.4, 4.1, "roof"]],
    coach: [[0.2, 0.4, "orangeSkirt"], [0.4, 0.9, "orangeLow"], [0.9, 1.1, "orangeLine"], [1.1, 1.5, "white"], [1.5, 2.7, "coachBand"], [2.7, 2.8, "white"], [2.8, 3.4, "orangeLight"], [3.4, 4.1, "roof"]],
    // source.xml: the raised machine-room roof to 16.4 m, the pantograph's well at 3.7 m behind it
    roof: [[5.8, 3.65], [6.2, 3.9], [11.7, 3.9], [13.2, 4.1], [16.4, 4.1], [16.45, 3.7], [21.9, 3.7]],
    pantograph: [19.0, 3.7],
    louvres: true,
  },
  atlantique: {
    palette: {
      silver: { color: "#c0c0c0", roughness: 0.35, metallic: 0.3 },
      white: { color: "#f5f5f5", roughness: 0.45 },
      blue: { color: "#3068af", roughness: 0.45 },
      coachBlue: { color: "#316bad", roughness: 0.45 },
      roof: { color: "#7f787f", roughness: 0.7 },
    },
    nose: [[0.2, 4.1, "silver"]],
    body: [[0.2, 1.4, "silver"], [1.4, 1.5, "white"], [1.5, 2.7, "blue"], [2.7, 2.8, "white"], [2.8, 3.4, "silver"], [3.4, 4.1, "roof"]],
    coach: [[0.2, 1.4, "silver"], [1.4, 1.5, "white"], [1.5, 2.7, "coachBlue"], [2.7, 2.8, "white"], [2.8, 3.4, "silver"], [3.4, 4.1, "roof"]],
    // tgv_at_loco: the raised roof to 18.5 m, 3.9 m behind it
    roof: [[5.8, 3.65], [6.2, 3.9], [11.7, 3.9], [13.2, 4.1], [18.5, 4.1], [18.55, 3.9], [21.9, 3.9]],
    pantograph: [19.5, 3.9],
    louvres: false,
  },
};

const PALETTE: Record<string, MaterialSpec> = {
  glass: { color: "#5f6670", metallic: 0.2, roughness: 0.15 },
  cabGlass: { color: "#202830", metallic: 0.2, roughness: 0.12 },
  frame: { color: "#292929", roughness: 0.5 },
  seam: { color: "#404040", roughness: 0.8 },
  louvre: { color: "#161616", roughness: 0.8 },
  lettering: { color: "#c9c9c9", roughness: 0.5 },
  lampWhite: { color: "#f3f5f6", roughness: 0.2 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  pantograph: { color: "#5a5d63", metallic: 0.2, roughness: 0.6 },
  carbon: { color: "#2b2b2b", roughness: 0.8 },
  insulator: { color: "#c8c8c0", roughness: 0.4 },
  coupler: { color: "#3a3c3f", metallic: 0.3, roughness: 0.5 },
  motor: { color: "#2e3033", roughness: 0.8 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  equipment: { color: "#2f282f", roughness: 0.8 },
};

/** The XML alongx section (both clips, the body to 3.5 m and the roof to 4.1 m), widths scaled. */
const SECTION = (kz: number, ky: number): Pt[] => {
  const half: Pt[] = [[1.1, 0], [1.5, 0.9], [1.5, 2.6], [1.4, 3.4], [1.3, 3.5], [1.2, 3.9], [0.9, 4.1]];
  const right = half.map(([z, y]): Pt => [z * kz, y * ky]);
  return [...right.map(([z, y]): Pt => [-z, y]).reverse(), ...right];
};
const POWER_SECTION = SECTION(K_Z_POWER, 1);
const COACH_SECTION = SECTION(K_Z_COACH, TGV_K_Y_COACH);

/** A polyline (source x, y) with extra stations where it crosses the bands' edges. */
function withEdges(pts: Pt[], bands: Array<[number, number, string]>): Pt[] {
  const out = [...pts];
  for (const [y] of bands.slice(1))
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, ya] = pts[i]!;
      const [xb, yb] = pts[i + 1]!;
      if ((y - ya) * (y - yb) < -1e-9) out.push([xa + ((y - ya) / (yb - ya)) * (xb - xa), y]);
    }
  return out;
}

const scaleBands = (bands: Array<[number, number, string]>, ky: number) => bands.map(([a, b, m]): [number, number, string] => [a * ky, b * ky, m]);

/** Power car bogies (the BMP's wheel columns, 14.0 m apart as published), 3.0 m wheelbase, 920 mm wheels. */
export const TGV_POWER_BOGIES: [number, number] = [5.1, 19.1];
/** The trailers' bogies: 3.0 m wheelbase, 920 mm wheels; the end coach's own bogie at XML x 3.05 m. */
export const TGV_TRAILER_WHEELBASE = 3.0;
const END_BOGIE_X = 3.05;

/** A car of the TGV. */
export function tgv(params?: ParamValues): MeshBuilder {
  const p = resolveParams(TGV_PARAMS, params);
  const unit = p.unit as TgvUnit;
  const L = LIVERIES[p.livery as TgvLivery];
  return unit === "powerCar" ? powerCar(L) : trailer(unit, L);
}

function powerCar(L: Livery): MeshBuilder {
  const map = TGV_MAPS.powerCar;
  const c = new Coach({ ...PALETTE, ...L.palette }, TGV_POWER_LENGTH / 2);
  const m = c.m;
  const B = (x: number) => bOf(map, x);
  const X = (x: number) => c.X(B(x));
  const box = (b: PxBox) => sideBox(map, b);
  const halfPlan = (pts: Pt[]) => toBody(map, pts.map(([x, h]): Pt => [x, h * K_Z_POWER]));
  const [b1, b2] = TGV_POWER_BOGIES;
  // source.xml alongy: the pointed nose plan; alongz: the nose cone, the windscreen's slope, the roof
  const nose: Volume = {
    name: "nose",
    section: POWER_SECTION,
    plan: halfPlan([[0.1, 0.12], [0.2, 0.6], [0.6, 1.0], [1.8, 1.4], [2.6, 1.5]]),
    top: toBody(map, withEdges([[0.1, 1.3], [1.3, 2.1], [2.6, 2.6]], L.nose)),
    bottom: toBody(map, withEdges([[0.1, 1.24], [0.4, 0.9], [0.9, 0.6], [2.6, 0.6]], L.nose)),
    bands: L.nose,
  };
  const cab: Volume = {
    name: "cab",
    section: POWER_SECTION,
    plan: halfPlan([[2.6, 1.5], [5.8, 1.5]]),
    top: toBody(map, withEdges([[2.6, 2.6], [3.8, 3.4], [4.4, 3.6], [5.8, 3.65]], L.nose)),
    bottom: toBody(map, [[2.6, 0.6], [3.0, 0.6], [3.05, 0.95], [5.8, 0.95]]),
    bands: L.nose,
  };
  const body: Volume = {
    name: "body",
    section: POWER_SECTION,
    plan: halfPlan([[5.8, 1.5], [21.9, 1.5]]),
    top: toBody(map, L.roof),
    // the skirts down to 0.2 m between the bogies and behind the rear one
    bottom: toBody(map, [[5.8, 0.95], [b1 + 2.0, 0.95], [b1 + 2.3, 0.2], [b2 - 2.3, 0.2], [b2 - 2.0, 0.95], [21.1, 0.95], [21.4, 0.2], [21.9, 0.2]]),
    bands: L.body,
  };
  m.scope("body", () => {
    m.scope("nose", () => c.volume(nose));
    m.scope("cab section", () => c.volume(cab));
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("cab windows", () => c.window(cab, s, box([38, 28, 49, 34]), { frame: "frame", glass: "cabGlass", fw: 0.04 }));
        m.scope("cab door", () => c.door(body, s, box([58.5, 30, 64, 47]), "bands", { seam: 0.025 }));
        m.scope("louvres", () => {
          // the machine room's vertical louvres in the band (columns 65..170 and 204..209)
          if (L.louvres)
            for (const [a, b] of [[65, 170], [204, 210]] as const) {
            c.sidePanel(body, "louvre", s, box([a, 33.5, b, 44.5]), 0.004, 0.02);
            for (let u = a + 0.5; u < b - 1; u += 2) c.sidePanel(body, "band", s, box([u, 34, u + 1, 44]), 0.008, 0.003);
          }
          // the raised roof's side grille (rows 22..26)
          c.sidePanel(body, "louvre", s, box([64, 22.4, 134, 25.8]), 0.006, 0.02);
        });
        m.scope("lettering", () => {
          const b = box([179, 33.5, 204, 40.5]);
          c.inscription(body, s, (b.x0 + b.x1) / 2, [{ text: "TGV", y: b.y0, h: b.y1 - b.y0 }], 0.012, "lettering");
        });
      });
  });
  m.scope("cab", () => {
    // the windscreen on the cab's slope, the lamps on the nose cone's top
    const screen = { x0: X(2.6), y0: 2.6, x1: X(3.8), y1: 3.4 };
    const cone = { x0: X(0.1), y0: 1.3, x1: X(1.3), y1: 2.1 };
    m.scope("windscreen", () => {
      slopePanel(m, "frame", 1, screen, -1.25, 1.25, 2.66, 3.36, 0.006, 0.01);
      slopePanel(m, "cabGlass", 1, screen, -1.18, 1.18, 2.7, 3.32, 0.014, 0.006);
    });
    m.scope("lamps", () => {
      for (const [k, s] of [-1, 1].entries())
        m.scope(`lamp ${k + 1}`, () => {
          slopePanel(m, "frame", 1, cone, s * 0.18, s * 0.66, 1.62, 1.8, 0.006, 0.01);
          slopePanel(m, "lampWhite", 1, cone, s * 0.36, s * 0.62, 1.65, 1.77, 0.014, 0.006);
          slopePanel(m, "lampRed", 1, cone, s * 0.22, s * 0.32, 1.66, 1.76, 0.014, 0.006);
        });
      slopePanel(m, "louvre", 1, cone, -0.14, 0.14, 1.64, 1.78, 0.008, 0.006);
    });
    // the skirt under the nose (source.xml: 0.7 .. 3.2 m, down to 0.2 m)
    m.scope("plough", () => c.sideSweep(L.nose[0]![2], [[B(2.95), 0.2], [B(0.75), 0.2], [B(1.3), 0.6], [B(2.95), 0.6]].map(([b, y]): Pt => [b, y]), -1.05 * K_Z_POWER, 1.05 * K_Z_POWER));
  });
  m.scope("rear end", () => {
    const wall = B(21.9);
    m.scope("coupler", () => centreCoupler(m, -1, c.X(wall + 0.9), c.X(0), 1.0));
    m.scope("end door", () => c.door(body, -1, { x0: -0.35, x1: 0.35, y0: 1.1, y1: 3.0 }, "bands", { end: true, seam: 0.025 }));
  });
  m.scope("roof equipment", () => {
    const [px, roof] = L.pantograph;
    m.scope("pantographs", () => m.scope("pantograph", () => pantograph(m, { x: X(px), roof, hinge: -1, raised: true, rise: 1.0 })));
  });
  m.scope("running gear", () => {
    TGV_POWER_BOGIES.forEach((x, i) => m.scope(`bogie ${i + 1}`, () => unitBogie(c, X(x), { wb: 3.0, r: 0.46, motor: true, top: 0.9, frame: 1.0 })));
    m.scope("transformer", () => block(m, "equipment", X(15.2), X(9.0), 0.3, 0.9, -1.05, 1.05));
  });
  return m;
}

interface TrailerLayout {
  windows: PxBox[];
  doors: Array<{ box: PxBox; glass: PxBox }>;
  louvre?: PxBox;
}

const TRAILERS: Record<"endCoach" | "coach", TrailerLayout> = {
  // tvgvag1_z_both: the vestibule's two doors by the power car end, six windows
  endCoach: {
    windows: [[79, 26, 83, 32], [90, 26, 104, 32], [111, 26, 125, 32], [132, 26, 146, 32], [153, 26, 167, 32], [174, 26, 188, 32]],
    doors: [{ box: [20, 18, 31, 41], glass: [24, 26, 28, 32] }, { box: [53, 18, 64, 41], glass: [56, 26, 60, 32] }],
    louvre: [1, 12.5, 8, 35],
  },
  // tgvvag2_z_both: six windows and the door at the -X joint
  coach: {
    windows: [[29, 26, 43, 32], [49, 26, 64, 32], [70, 26, 85, 32], [91, 26, 106, 32], [112, 26, 127, 32], [133, 26, 147, 32]],
    doors: [{ box: [152, 18, 163, 41], glass: [156, 26, 160, 32] }],
  },
};

function trailer(unit: "endCoach" | "coach", L: Livery): MeshBuilder {
  const map = TGV_MAPS[unit];
  const T = TRAILERS[unit];
  const length = tgvLength(unit);
  const ky = TGV_K_Y_COACH;
  const c = new Coach({ ...PALETTE, ...L.palette }, length / 2);
  const m = c.m;
  const B = (x: number) => bOf(map, x);
  const box = (b: PxBox) => sideBox(map, b);
  const bands = scaleBands(L.coach, ky);
  // the body's ends (source x): the end coach from its coupler end (0.1) to the joint wall (21.3)
  const [front, rear] = unit === "endCoach" ? [0.1, 21.3] : [0.3, 18.5];
  // openings over the bogies: the shared one at each joint, the end coach's own one at 3.05 m
  const reach = TGV_TRAILER_WHEELBASE / 2 + 0.46 + 0.12;
  const bJoint = reach;
  const bFront = unit === "endCoach" ? B(END_BOGIE_X) : length;
  // over the bogies the body stands on 1.0 m (source), clear of the 920 mm wheels
  const bottom: Pt[] = [
    [B(rear), 1.0 * ky],
    [bJoint, 1.0 * ky],
    [bJoint + 0.3, 0.2 * ky],
    [bFront - reach - 0.3, 0.2 * ky],
    [bFront - reach, 1.0 * ky],
    ...(unit === "endCoach" ? ([[bFront + reach, 1.0 * ky], [bFront + reach + 0.2, 0.2 * ky], [B(front), 0.2 * ky]] as Pt[]) : ([[B(front), 1.0 * ky]] as Pt[])),
  ];
  const top: Pt[] | undefined = unit === "endCoach" ? toBody(map, [[0.1, 4.1], [2.4, 4.1], [4.8, 3.8], [5.3, 3.6], [21.3, 3.6]]) : undefined;
  const body: Volume = {
    name: "body",
    section: COACH_SECTION,
    plan: [[B(rear), 1.5 * K_Z_COACH], [B(front), 1.5 * K_Z_COACH]],
    ...(top ? { top } : { top: [[B(rear), 3.6 * ky], [B(front), 3.6 * ky]] as Pt[] }),
    bottom: bottom.sort((a, b) => a[0] - b[0]),
    bands,
  };
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        m.scope("windows", () => T.windows.forEach((w, i) => m.scope(`window ${i + 1}`, () => c.window(body, s, box(w), { frame: "frame", fw: 0.06 }))));
        m.scope("doors", () =>
          T.doors.forEach((d, i) =>
            m.scope(`door ${i + 1}`, () => {
              c.door(body, s, box(d.box), "bands", { seam: 0.025 });
              c.window(body, s, box(d.glass), { frame: "frame", fw: 0.04 });
            }),
          ),
        );
        if (T.louvre)
          m.scope("fairing louvres", () => {
            const lb = box(T.louvre!);
            c.sidePanel(body, "louvre", s, lb, 0.004, 0.02);
            for (let x = lb.x0 + 0.05; x < lb.x1 - 0.1; x += 0.2) c.sidePanel(body, "frame", s, { ...lb, x0: x, x1: x + 0.1, y0: lb.y0 + 0.05, y1: lb.y1 - 0.05 }, 0.008, 0.003);
          });
      });
  });
  // the joints: bellows to the joint plane, the articulation's coupler; the end coach's coupler to the power car
  const gangway = (e: number, wall: number, face: number) =>
    m.scope("gangway", () => {
      const [a, b] = [c.X(wall) - e * 0.02, c.X(face)].sort((p, q) => p - q) as [number, number];
      for (const z of [-1, 1]) block(m, "rubber", a, b, 1.1 * ky, 3.4 * ky, ...side(z, 0.5, 0.75));
      block(m, "rubber", a, b, 3.2 * ky, 3.4 * ky, -0.5, 0.5);
    });
  m.scope("rear end", () => gangway(-1, B(rear), 0));
  m.scope("front end", () => {
    if (unit === "coach") gangway(1, B(front), length);
    else {
      gangway(1, B(front), length - 0.02);
      m.scope("coupler", () => centreCoupler(m, 1, c.X(B(front) - 0.9), c.X(length), 1.0));
    }
  });
  m.scope("running gear", () => {
    // half of each shared Jacobs bogie: the next coach carries the other half
    m.scope("rear jacobs half", () => jacobsHalf(c, c.X(0), 1));
    if (unit === "coach") m.scope("front jacobs half", () => jacobsHalf(c, c.X(length), -1));
    if (unit === "endCoach") m.scope("bogie", () => unitBogie(c, c.X(B(END_BOGIE_X)), { wb: TGV_TRAILER_WHEELBASE, r: 0.46, motor: true, top: 0.88 * ky, air: true, frame: 1.0 }));
    m.scope("underframe", () => {
      const mid = (B(rear) + B(front)) / 2;
      for (const d of [-1.4, 0, 1.4]) block(m, "equipment", c.X(mid + d - 0.55), c.X(mid + d + 0.55), 0.25, 0.86 * ky, -0.95, 0.95);
    });
  });
  return m;
}

/**
 * Half a Jacobs bogie at a joint (Factory x `xj`), reaching into the car along
 * d: one wheelset 1.5 m from the joint, its axle boxes and primary coils, the
 * side frame and the bolster up to the joint plane, and the air spring beside
 * it. Two coupled coaches' halves make the whole bogie, 3.0 m wheelbase on
 * 920 mm wheels, centred on the joint; nothing crosses the joint plane.
 */
function jacobsHalf(c: Coach, xj: number, d: number): void {
  const m = c.m;
  const r = 0.46;
  const ay = r * Math.cos(Math.PI / 24);
  const xw = xj + d * TGV_TRAILER_WHEELBASE / 2;
  const span = (a: number, b: number) => [xj + d * a, xj + d * b].sort((p, q) => p - q) as [number, number];
  m.scope("wheelset", () => c.wheelset(xw, r));
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      block(m, "bogie", ...span(0.002, 1.5 - 0.25), ay - 0.08, ay + 0.12, ...side(s, 0.93, 1.07));
      block(m, "bogie", ...span(1.5 - 0.25, 1.5 + 0.42), ay + 0.06, ay + 0.24, ...side(s, 0.93, 1.07));
      block(m, "bogie", ...span(1.5 - 0.16, 1.5 + 0.16), ay - 0.12, ay + 0.06, ...side(s, 0.9, 1.1));
      for (const k of [-0.24, 0.24]) coil(m, "spring", xw + k, s * 1.0, ay - 0.02, ay + 0.06, 0.06, 1, 8);
      // the air spring under the joint's bolster, beside the joint plane
      const bag = [xj + d * 0.32, s * 1.0] as const;
      m.prism("rubber", ngon(10, 0.18, 0, bag[0], bag[1]), ay + 0.12, 0.72 * TGV_K_Y_COACH + 0.06);
    }
    block(m, "bogie", ...span(0.002, 0.55), 0.72 * TGV_K_Y_COACH + 0.06, 0.88 * TGV_K_Y_COACH, -1.05, 1.05);
    block(m, "bogie", ...span(0.6, 0.72), ay - 0.06, ay + 0.1, -0.93, 0.93);
  });
  m.scope("brakes", () => {
    const [a, b] = span(1.5 - r - 0.1, 1.5 - r - 0.02);
    for (const s of [-1, 1]) block(m, "underframe", a, b, ay - 0.07, ay + 0.07, ...side(s, 0.56, 0.74));
  });
}

export const TGV_DESIGNS: ProceduralDesign[] = [
  { id: "veh-tgv", title: "TGV", build: tgv, params: TGV_PARAMS, catalog: EMU_CATALOG, references: "tgv" },
];

export type { Box };
