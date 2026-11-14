// The Prussian P 8 (2'C h2), DR class 38.10-40, with its Prussian 2'2' T 21.5
// tender, drawn on the steam kit (steamLoco.ts) from the side-on photograph of
// 38 3650, photographs of 2455 Posen and 38 3199 in Prussian green and of
// 38 1772 in DR black (assets/kpev-p8/SOURCES.md) and the published figures
// (18,585 mm over buffers, wheelbase 2,200 + 1,570 + 2 x 2,290 = 8,350 mm and
// 15,565 mm with the tender, drivers 1,750 mm, chimney 4,550 mm, roof 4,150 mm,
// width 2,900 mm): the boiler on 2.8 m with its long smokebox and tall chimney,
// the dome, sand box and dome on the barrel, the feed-water heater's drums on
// the running boards, the high running board on 1.9 m sweeping down to the
// buffer beam, the leading bogie with the outside cylinders between its axles,
// the cab with its pointed "Windschneide" front, its single side window, open
// entrance and arched roof, and the tender's tank with the flared coal rails.
// KPEV green (2455 Posen): green boiler, cab, cylinders and tender, black
// smokebox and running board, red-brown frames, wheels and beams, no smoke
// deflectors. DR black (38 1772): black with red frames and wheels and the small
// Wagner deflectors beside the smokebox the DR fitted.
// See docs/models/world-steam.md.
//
// Every length is in metres along the locomotive from its front buffer heads
// (the tender: from its own front buffer heads), y up from the rail top.

import { ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { LocoSpec } from "./steamLoco.ts";
import { mirrored, type Pt, type Steam } from "./steamParts.ts";
import type { WorldSteam } from "./steamWorld.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** The livery keys (stored in saved maps): Prussian green, DR black. */
export type P8Livery = "kpev" | "drBlack";

/** The colours of each livery: upper works, frames/wheels/beams, smokebox, roof. */
const COLOURS: Record<P8Livery, { paint: string; red: string; smokebox: string; roof: string; plate: string; plateText: MaterialSpec }> = {
  // 2455 Posen and 38 3199: a dark Prussian green, red-brown frames and wheels, brass figures on black plates
  kpev: { paint: "#2b4733", red: "#86362a", smokebox: "#1c1d20", roof: "#34383a", plate: "#141416", plateText: { color: "#c9a447", metallic: 0.45, roughness: 0.35 } },
  // 38 1772: black, the DR's bright red frames and wheels, white figures on black plates
  drBlack: { paint: "#1d1e20", red: "#a51a1f", smokebox: "#1c1d22", roof: "#26272a", plate: "#141416", plateText: mat("#dcd9cf", 0.45) },
};

function palette(l: P8Livery): Record<string, MaterialSpec> {
  const c = COLOURS[l];
  return {
    paint: mat(c.paint, 0.5),
    wheel: mat(c.red, 0.6),
    frame: mat(c.red, 0.65),
    red: mat(c.red, 0.65),
    beam: mat(c.red, 0.6),
    smokebox: mat(c.smokebox, 0.85),
    black: mat("#18181a", 0.75),
    roof: mat(c.roof, 0.8),
    plate: mat(c.plate, 0.5),
    plateText: c.plateText,
    coal: { color: "#3a3b3e", metallic: 0.15, roughness: 0.6 },
    coalLump: { color: "#5a5b60", metallic: 0.2, roughness: 0.45 },
    steel: { color: "#3e4146", metallic: 0.3, roughness: 0.55 },
    doorRing: { color: "#45484d", metallic: 0.35, roughness: 0.5 },
    // the deflectors' sheet a little glossier than the smokebox behind them, as 38 1772's show it
    sheet: mat(l === "drBlack" ? "#3a3d42" : c.paint, 0.35),
    // the tyres dark, as the photographs show them (the kit's are bright)
    tyre: { color: "#4b4e53", metallic: 0.35, roughness: 0.45 },
    copper: { color: "#a8673f", metallic: 0.5, roughness: 0.4 },
    // the cab's open entrance, seen into the dark cab
    opening: mat("#0c0c0d", 0.9),
  };
}

const NUMBERS: Record<P8Livery, string> = { kpev: "2455 POSEN", drBlack: "38 1772" };

/** The design's entry in WORLD_STEAM (worldSteamLocos.ts): its title, the measures the table lists, and its liveries. */
export const P8_WORLD: { base: WorldSteam; liveries: Record<P8Livery, { title: string; palette: WorldSteam["palette"]; number: string }> } = {
  base: { top: 4.65, coupler: "buffers", half: 1.5, title: "Prussian P 8", lead: 2, coupled: 3, trail: 0, leadD: 1.0, coupledD: 1.75, trailD: 0, boilerR: 0.82, deflectors: "none", domes: 3, palette: { paint: COLOURS.kpev.paint, wheel: COLOURS.kpev.red, frame: COLOURS.kpev.red, smokebox: COLOURS.kpev.smokebox }, tender: { length: 7.435, axles: 4, d: 1.0 }, number: NUMBERS.kpev },
  liveries: {
    kpev: { title: "KPEV green", palette: { paint: COLOURS.kpev.paint, wheel: COLOURS.kpev.red, frame: COLOURS.kpev.red, smokebox: COLOURS.kpev.smokebox }, number: NUMBERS.kpev },
    drBlack: { title: "DR black", palette: { paint: COLOURS.drBlack.paint, wheel: COLOURS.drBlack.red, frame: COLOURS.drBlack.red, smokebox: COLOURS.drBlack.smokebox }, number: NUMBERS.drBlack },
  },
};

// --- the engine (38 3650 side-on at 52.8 px/m; the axles from the published wheelbase) ---

/** The bogie's axles 2.2 m apart, 1.57 m to the first driver, the drivers 2.29 m apart. */
const LEAD = [1.5, 3.7];
const COUPLED = [5.27, 7.56, 9.85];
/** The engine's rear head; the tender's front head meets it (18.585 m over both). */
const END = 11.15;
/** Boiler centre, radius over the lagging (barrel top 3.62 m); the running board's top. */
const BY = 2.8;
const BR = 0.82;
const RB = 1.9;
/** The smokebox from its door to its rear ring. */
const SMOKEBOX = [1.17, 2.95] as const;
/** The cab sides from 9.6 m to the engine's end; the pointed front 0.32 m ahead at the centre line. */
const CAB0 = 9.6;
const CAB1 = 11.1;
const WEDGE = 0.32;
const HALF = 1.42;
/** The cab's right half section: the sheets from the running board up under the roof sheet. */
const CAB_HALF: Pt[] = [[1.45, RB], [1.45, 3.75], [1.3, 3.88], [0.8, 4.03], [0, 4.09]];
/** The roof sheet over it: the eaves 4 cm out, 5 cm thick. */
const ROOF_OUT: Pt[] = [[1.52, 3.7], [1.37, 3.97], [0.85, 4.14], [0, 4.2]];
const ROOF_IN: Pt[] = [[1.5, 3.67], [1.33, 3.92], [0.82, 4.09], [0, 4.15]];

/** The cab front's source x at |z|: its two faces meet at the centre line, WEDGE ahead of the side sheets. */
const cabFront = (z: number, at = CAB0) => at - WEDGE * (1 - Math.min(1, Math.abs(z) / 1.45));

/** A face of quads/triangles, wound so it looks along `out` (model axes). */
function face(m: Steam["m"], mt: string, p: Vec3[], out: Vec3): void {
  const [a, b, c] = p as [Vec3, Vec3, Vec3];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const q = n[0]! * out[0] + n[1]! * out[1] + n[2]! * out[2] < 0 ? [...p].reverse() : p;
  for (let i = 1; i + 1 < q.length; i++) m.tri(mt, q[0]!, q[i]!, q[i + 1]!);
}

/**
 * The cab: the side sheets and roof crown swept from the pointed front to the
 * rear, the two front faces, the rear wall, the roof sheet with its overhang.
 */
function cab(t: Steam): void {
  const m = t.m;
  const P = (x: number, z: number, y: number): Vec3 => [t.X(x), y, z];
  m.scope("cab", () => {
    m.scope("sheets", () => {
      for (const s of [-1, 1]) {
        for (let i = 0; i + 1 < CAB_HALF.length; i++) {
          const [a, b] = [CAB_HALF[i]!, CAB_HALF[i + 1]!];
          const out: Vec3 = [0, a[0] - b[0], s * (b[1] - a[1])];
          face(m, "paint", [P(cabFront(a[0]), s * a[0], a[1]), P(CAB1, s * a[0], a[1]), P(CAB1, s * b[0], b[1]), P(cabFront(b[0]), s * b[0], b[1])], out);
        }
        // the front face on this side: a plane from the corner to the centre line
        const poly = [[0, RB] as Pt, ...CAB_HALF];
        const n: Vec3 = [1.45, 0, s * WEDGE];
        face(m, "paint", poly.map(([z, y]) => P(cabFront(z), s * z, y)), n);
      }
      // the rear wall toward the tender
      face(m, "paint", mirrored(CAB_HALF).map(([z, y]) => P(CAB1, z, y)), [-1, 0, 0]);
      // the floor's underside
      face(m, "paint", [P(cabFront(1.45), -1.45, RB), P(CAB1, -1.45, RB), P(CAB1, 1.45, RB), P(cabFront(1.45), 1.45, RB)], [0, -1, 0]);
    });
    m.scope("roof", () => {
      const front = (z: number) => cabFront(z) - 0.1;
      const rear = 11.5;
      for (const s of [-1, 1]) {
        for (let i = 0; i + 1 < ROOF_OUT.length; i++) {
          const [a, b] = [ROOF_OUT[i]!, ROOF_OUT[i + 1]!];
          face(m, "roof", [P(front(a[0]), s * a[0], a[1]), P(rear, s * a[0], a[1]), P(rear, s * b[0], b[1]), P(front(b[0]), s * b[0], b[1])], [0, a[0] - b[0], s * (b[1] - a[1])]);
          const [c, d] = [ROOF_IN[i]!, ROOF_IN[i + 1]!];
          face(m, "roof", [P(front(c[0]), s * c[0], c[1]), P(rear, s * c[0], c[1]), P(rear, s * d[0], d[1]), P(front(d[0]), s * d[0], d[1])], [0, -(c[0] - d[0]), -s * (d[1] - c[1])]);
          // the front and rear edges
          face(m, "roof", [P(front(a[0]), s * a[0], a[1]), P(front(b[0]), s * b[0], b[1]), P(front(d[0]), s * d[0], d[1]), P(front(c[0]), s * c[0], c[1])], [1.45, 0, s * WEDGE]);
          face(m, "roof", [P(rear, s * a[0], a[1]), P(rear, s * b[0], b[1]), P(rear, s * d[0], d[1]), P(rear, s * c[0], c[1])], [-1, 0, 0]);
        }
        // the eaves' edge
        const [a, c] = [ROOF_OUT[0]!, ROOF_IN[0]!];
        face(m, "roof", [P(front(a[0]), s * a[0], a[1]), P(rear, s * a[0], a[1]), P(rear, s * c[0], c[1]), P(front(c[0]), s * c[0], c[1])], [0, -0.3, s]);
      }
      // the lantern along the crown
      t.box("roof", 9.95, 11.05, 4.17, 4.29, -0.32, 0.32);
    });
    m.scope("windows", () => {
      const sec = mirrored(CAB_HALF);
      for (const s of [-1, 1]) {
        // the side window, and the open entrance at the rear
        t.sidePanel(sec, "glass", s, 9.86, 10.42, 2.86, 3.56);
        t.sidePanel(sec, "opening", s, 10.6, 11.02, 2.0, 3.56);
        // the front window in each face, its top rounded
        const ring = ngon(10, 1, Math.PI / 10, 0, 0).map(([a, b]): Pt => [1.1 + a * 0.2, 3.3 + Math.max(-0.28, Math.min(0.28, b * 0.34))]);
        const pts = ring.map(([z, y]): Vec3 => P(cabFront(z) - 0.008, s * z, y));
        const n = Math.hypot(1.45, WEDGE);
        m.slab("glass", pts, [(-1.45 / n) * 0.02, 0, (-s * WEDGE / n) * 0.02]);
      }
    });
    m.scope("cab steps", () => {
      for (const s of [-1, 1]) for (const y of [1.0, 1.45]) t.sideBox("black", s, 10.62, 11.0, y - 0.03, y, 1.3, 1.5);
      for (const s of [-1, 1]) t.sideBox("black", s, 10.6, 10.63, 0.95, RB - 0.05, 1.32, 1.48);
    });
  });
}

/** The round dome, the sand box and the second dome (38 3650, 38 3199, 2455). */
const DOMES = [
  { x: 4.26, top: 4.3, r: 0.45 },
  { x: 5.16, top: 4.13, r: 0.36, len: 0.86 },
  { x: 6.1, top: 4.3, r: 0.45 },
];

/** The two round domes with their rounded caps, and the sand box between them. */
function domes(t: Steam): void {
  const m = t.m;
  m.scope("domes", () => {
    for (const d of [DOMES[0]!, DOMES[2]!]) {
      const n = 16;
      const y0 = BY + BR * 0.8;
      const cap = 0.3;
      const shoulder = d.top - cap;
      // the foot flared over the barrel, the drum, then the cap in three rings
      const ring = (r: number) => ngon(n, r, Math.PI / n, t.X(d.x), 0);
      m.loft("paint", ring(d.r + 0.07), y0, ring(d.r), BY + BR + 0.04, false);
      m.loft("paint", ring(d.r), BY + BR + 0.04, ring(d.r), shoulder, false);
      const steps = [0, 35, 65, 85].map((deg) => (deg * Math.PI) / 180);
      for (let i = 0; i + 1 < steps.length; i++) {
        const [a, b] = [steps[i]!, steps[i + 1]!];
        m.loft("paint", ring(d.r * Math.cos(a)), shoulder + cap * Math.sin(a), ring(d.r * Math.cos(b)), shoulder + cap * Math.sin(b), i + 2 === steps.length);
      }
    }
    const b = DOMES[1]!;
    t.dome(b.x, BY + BR * 0.8, b.top, b.r, b.len);
    // the small feed dome with its check valves behind the chimney (38 3199, 38 1772)
    t.dome(3.15, BY + BR * 0.8, 3.92, 0.17);
  });
}

/** The small Wagner plates the DR fitted beside the smokebox (38 1772). */
const WAGNER: Pt[] = [[0.72, 2.47], [2.5, 2.47], [2.5, 3.32], [2.4, 3.4], [0.82, 3.4], [0.72, 3.3]];
const WAGNER_Z = 1.18;

function engineExtras(l: P8Livery) {
  return (t: Steam): void => {
    const m = t.m;
    cab(t);
    domes(t);
    m.scope("feed-water heater", () => {
      // the heater's drums on the running boards beside the barrel, their ends rounded
      for (const s of [-1, 1]) {
        t.cylX("paint", 3.35, 5.2, s * 1.04, RB + 0.27, 0.26, 12);
        t.cylX("paint", 3.28, 3.35, s * 1.04, RB + 0.27, 0.2, 12);
        t.cylX("paint", 5.2, 5.27, s * 1.04, RB + 0.27, 0.2, 12);
        // its straps down to the board
        for (const x of [3.7, 4.85]) t.sideBox("black", s, x - 0.03, x + 0.03, RB, RB + 0.3, 1.28, 1.31);
      }
    });
    m.scope("air pump", () => {
      // the Knorr pump on the left running board ahead of the cab, its pipes up to the boiler
      t.cylY("smokebox", 7.15, -1.05, RB, 2.65, 0.15, 10);
      t.cylY("smokebox", 7.15, -1.05, 2.65, 2.95, 0.11, 10);
      t.cylY("smokebox", 7.5, -1.08, RB, 2.4, 0.1, 8);
    });
    m.scope("boiler pipes", () => {
      // the feed pipes from the heater forward to the check valves on the barrel, copper on the green engine
      const pipe = l === "kpev" ? "copper" : "paint";
      for (const s of [-1, 1]) {
        m.rod(pipe, [t.X(5.25), RB + 0.4, s * 1.0], [t.X(5.6), BY + 0.25, s * 0.82], 0.03, 6);
        const z = Math.sqrt(BR * BR - 0.25 * 0.25) + 0.05;
        t.cylX(pipe, 3.0, 9.1, s * z, BY - 0.25, 0.028, 6);
      }
    });
    m.scope("frame top", () => {
      // the red plate frames' top edge under the running board and the horn guides
      for (const s of [-1, 1]) {
        for (const x of [COUPLED[0]! + 1.145, COUPLED[1]! + 1.145]) t.sideBox("red", s, x - 0.07, x + 0.07, 1.0, 1.72, 0.6, 0.66);
        // the frames' front end over the bogie, from the buffer beam up the ramp
        t.sideBox("red", s, 0.8, 1.1, 1.3, 1.45, 0.6, 0.66);
      }
    });
    m.scope("valve chests", () => {
      // the piston valves' chests over the cylinders, reaching up to the running board
      for (const s of [-1, 1]) t.sideBox("paint", s, 2.0, 3.0, 1.3, RB - 0.04, 0.86, 1.36);
    });
    m.scope("smokebox door wheel", () => {
      m.tube("doorRing", "x", 0, BY, BR + 0.06, BR * 0.93, t.X(SMOKEBOX[0]) - 0.01, t.X(SMOKEBOX[0]) + 0.035, 24);
      t.cylX("steel", SMOKEBOX[0] - 0.11, SMOKEBOX[0] - 0.075, 0, BY + 0.05, 0.13, 12);
    });
    m.scope("front plate", () => {
      // the plate under the smokebox door down to the ramp
      t.box("black", 1.12, 1.16, 1.5, RB - 0.04, -1.05, 1.05);
    });
    m.scope("sand pipes", () => {
      // from the sand box down past the boiler to ahead of the first and second drivers
      for (const s of [-1, 1]) for (const xb of [COUPLED[0]! - 0.95, COUPLED[1]! - 0.95]) {
        const mid: Vec3 = [t.X((5.16 + xb) / 2), BY, s * (BR + 0.05)];
        m.rod("paint", [t.X(5.16), BY + 0.62, s * 0.5], mid, 0.018, 6);
        m.rod("paint", mid, [t.X(xb), RB + 0.04, s * 0.96], 0.018, 6);
      }
    });
    if (l === "drBlack") {
      m.scope("smoke deflectors", () => {
        for (const s of [-1, 1]) {
          t.deflector(s, WAGNER, WAGNER_Z, "sheet");
          // the stays to the smokebox
          for (const x of [1.3, 2.3]) t.sideBox("paint", s, x - 0.03, x + 0.03, 2.95, 3.0, BR + 0.02, WAGNER_Z);
          // the top edge turned in
          const pts: Vec3[] = [[t.X(0.82), 3.4, s * (WAGNER_Z + 0.02)], [t.X(2.4), 3.4, s * (WAGNER_Z + 0.02)], [t.X(2.4), 3.46, s * (WAGNER_Z - 0.1)], [t.X(0.82), 3.46, s * (WAGNER_Z - 0.1)]];
          m.slab("sheet", pts, [0, -0.02, 0]);
        }
      });
    } else {
      m.scope("numbers", () => {
        // Posen's brass plate on the smokebox's flanks: "2455" over "POSEN"
        for (const s of [-1, 1]) {
          const face = BR + 0.045;
          const [x, y] = [2.05, BY - 0.12];
          t.sideBox("plate", s, x - 0.3, x + 0.3, y, y + 0.26, face - 0.03, face);
          const big = 0.13, small = 0.05;
          const wb = strokeWidth("2455", big * 0.58, big * 0.18);
          const ws = strokeWidth("POSEN", small * 0.58, small * 0.18);
          const tx = (text: string, w: number, h: number, v: number) => {
            const u0 = t.X(x) + (s > 0 ? -w / 2 : w / 2);
            m.facets("plateText", strokeText(text, u0, v, h, h * 0.58, h * 0.18, s < 0).map(([u, vv]): Vec3 => [u, vv, s * (face + 0.004)]), [0, 0, s]);
          };
          tx("2455", wb, big, y + 0.1);
          tx("POSEN", ws, small, y + 0.03);
        }
      });
    }
  };
}

function engine(l: P8Livery): LocoSpec {
  const dr = l === "drBlack";
  return {
    title: "Prussian P 8",
    palette: palette(l),
    heads: [0, END],
    beams: { y0: 0.78, y1: 1.47, length: [0.62, 0.3], half: 1.44 },
    boiler: { x0: SMOKEBOX[0], x1: CAB0, y: BY, r: BR, smokebox: SMOKEBOX[1] - SMOKEBOX[0], bands: [4.78, 6.62, 8.1], band: "black", n: 24 },
    chimney: { x: 2.25, top: 4.55, r: 0.25 },
    valves: { x: 8.95, top: 4.2 },
    handrail: { x0: 3.1, x1: 9.2, y: BY + 0.42 },
    // from the buffer beam's top up the curved ramp to the high board, on to the cab
    runningBoard: { profile: [[0.62, 1.5], [0.98, 1.5], [1.2, 1.55], [1.38, 1.66], [1.5, 1.79], [1.56, RB], [END - 0.05, RB]], half: HALF, valance: 0.12, valanceMat: "red" },
    frame: { x0: 0.8, x1: END - 0.3, top: 1.72 },
    // the narrow firebox under the barrel's rear, down to the running board
    prisms: [{ name: "firebox", x0: 8.1, x1: CAB0, half: [[0.85, RB], [0.85, BY], [0.74, BY + 0.42], [0.43, BY + 0.72], [0, BY + 0.84]] }],
    bogies: [{ x0: LEAD[0]! - 0.55, x1: LEAD[1]! + 0.55, y: 0.55 }],
    bogieFrameMat: "red",
    gear: {
      wheels: [
        ...LEAD.map((x) => ({ x, d: 1.0, spokes: 12, outsideBoxes: true })),
        ...COUPLED.map((x) => ({ x, d: 1.75, spokes: 18 })),
      ],
      // two cylinders 575 x 630 mm between the bogie's axles; the main rods drive the middle coupled axle
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 1.95, x1: 3.05, y: 0.98, r: 0.36 }, crank: 0.315, phase: 0.3, valveGear: true }],
      cylinderZ: 1.08, reference: 3, wheelMaterial: "wheel", cylinderCoverMat: "paint",
    },
    lamps: { front: [[0.9, 1.58, 0.86], [0.9, 1.58, -0.86], [SMOKEBOX[0] - 0.13, 3.6, 0]], rear: [[END - 0.32, 1.5, 0.75], [END - 0.32, 1.5, -0.75]] },
    ...(dr ? { number: { text: NUMBERS.drBlack, side: [9.95, 2.25, CAB_HALF[0]![0]] as [number, number, number], front: [SMOKEBOX[0] - 0.075, 2.42] as [number, number] } } : {}),
    extras: engineExtras(l),
  };
}

// --- the Prussian 2'2' T 21.5 tender: 7.435 m over its buffers, bogies of 1.8 m wheelbase ---

const T_AXLES = [0.9, 2.7, 4.12, 5.92];
const T_END = 18.585 - END;
/** The tank and its top; the coal rails standing on it, flaring out to their top at 3.94 m. */
const TANK = [0.25, 6.8] as const;
const TANK_FOOT = 1.25;
const TANK_TOP = 3.18;
const T_HALF = 1.45;
const RAILS = [1.2, 6.55] as const;
const RAILS_TOP = 3.94;
const RAILS_HALF: Pt[] = [[1.36, TANK_TOP - 0.01], [1.36, 3.66], [1.47, RAILS_TOP - 0.03], [1.45, RAILS_TOP]];

function tenderExtras(l: P8Livery) {
  return (t: Steam): void => {
    const m = t.m;
    m.scope("sole bars", () => {
      for (const s of [-1, 1]) t.sideBox("red", s, 0.3, 6.95, 1.0, TANK_FOOT + 0.02, T_HALF - 0.14, T_HALF - 0.02);
    });
    m.scope("coal rail ribs", () => {
      // the stays along the rails' foot
      for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
        const x = RAILS[0] + 0.3 + i * ((RAILS[1] - RAILS[0] - 0.6) / 6);
        t.sideBox("paint", s, x - 0.025, x + 0.025, TANK_TOP - 0.01, 3.62, 1.36, 1.41);
      }
    });
    m.scope("tank seams", () => {
      // the riveted seam running diagonally up the tank side (2455, 38 3650)
      for (const s of [-1, 1]) {
        const z = s * (T_HALF + 0.004);
        for (const [a, b] of [[[0.5, 1.4], [3.4, 2.85]], [[3.4, 2.85], [6.75, 2.85]]] as Array<[Pt, Pt]>) {
          const pts: Vec3[] = [[t.X(a[0]), a[1], z], [t.X(b[0]), b[1], z], [t.X(b[0]), b[1] + 0.03, z], [t.X(a[0]), a[1] + 0.03, z]];
          m.slab("black", pts, [0, 0, -s * 0.004]);
        }
      }
    });
    m.scope("coal lumps", () => {
      const [y, half, rise] = [RAILS_TOP - 0.1, 1.28, 0.28];
      const top = (z: number) => {
        const a = Math.abs(z) / half;
        return a <= 0.3 ? y + rise : a <= 0.75 ? y + rise - ((a - 0.3) / 0.45) * 0.4 * rise : y + 0.6 * rise - ((a - 0.75) / 0.25) * 0.6 * rise;
      };
      for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) {
        const x = RAILS[0] + 0.4 + i * ((RAILS[1] - RAILS[0] - 0.8) / 8) + (j % 2) * 0.12;
        const z = (j - 2) * half * 0.36 + ((i * 7 + j * 3) % 5 - 2) * 0.03;
        const r = 0.09 + ((i * 3 + j * 5) % 4) * 0.02;
        const h = top(z);
        m.spire("coalLump", ngon(4, r, (i + j) * 0.7, t.X(x), z), h - 0.05, h + r * 0.5);
      }
    });
    m.scope("front lockers", () => {
      // the tool lockers either side of the coal door, toward the cab
      for (const s of [-1, 1]) t.sideBox("paint", s, TANK[0] + 0.02, RAILS[0] - 0.02, TANK_TOP - 0.01, 3.7, 0.75, T_HALF - 0.06);
      t.box("black", TANK[0] + 0.05, TANK[0] + 0.1, TANK_TOP - 0.01, 3.5, -0.7, 0.7);
    });
    m.scope("tool box", () => {
      // the long round box across the rear wall, the number below it
      t.cylZ("paint", TANK[1] + 0.17, 2.95, -1.0, 1.0, 0.17, 12);
      for (const z of [-0.8, 0.8]) t.box("black", TANK[1] + 0.005, TANK[1] + 0.14, 2.75, 2.8, z - 0.03, z + 0.03);
    });
    m.scope("water filler", () => t.cylY("paint", 6.68, 0, TANK_TOP - 0.02, TANK_TOP + 0.12, 0.2, 10));
    m.scope("rear ladder", () => {
      for (const z of [-0.35, 0.35]) m.rod("steel", [t.X(TANK[1] + 0.06), 1.35, z], [t.X(TANK[1] + 0.06), TANK_TOP, z], 0.018, 6);
      for (let i = 0; i < 5; i++) m.rod("steel", [t.X(TANK[1] + 0.06), 1.5 + i * 0.32, -0.35], [t.X(TANK[1] + 0.06), 1.5 + i * 0.32, 0.35], 0.014, 6);
    });
    m.scope("numbers", () => t.endPlate(-1, TANK[1], 2.42, l === "kpev" ? "2455" : NUMBERS.drBlack));
  };
}

/** The Prussian tender bogies' plate side frames outside the wheels, their axle boxes and leaf springs. */
function tenderTruck(t: Steam, b: { x0: number; x1: number; y: number }): void {
  const axles = T_AXLES.filter((x) => x > b.x0 && x < b.x1);
  for (const s of [-1, 1]) {
    t.sideBox("red", s, b.x0 + 0.05, b.x1 - 0.05, 0.62, 0.86, 1.0, 1.05);
    for (const x of axles) {
      t.sideBox("red", s, x - 0.15, x + 0.15, 0.36, 0.7, 1.05, 1.12);
      t.sideBox("steel", s, x - 0.42, x + 0.42, 0.86, 0.94, 1.02, 1.1);
    }
  }
}

function tender(l: P8Livery): LocoSpec {
  return {
    title: "Prussian P 8 tender",
    palette: palette(l),
    heads: [0, T_END],
    beams: { y0: 0.8, y1: 1.3, length: [0.3, 0.62], half: 1.44 },
    frame: { x0: 0.3, x1: 6.95, top: TANK_FOOT + 0.01 },
    prisms: [
      { name: "tank", x0: TANK[0], x1: TANK[1], half: [[T_HALF, TANK_FOOT], [T_HALF, TANK_TOP - 0.05], [T_HALF - 0.05, TANK_TOP]] },
      { name: "coal rails", x0: RAILS[0], x1: RAILS[1], half: RAILS_HALF },
    ],
    coal: { x0: RAILS[0] + 0.08, x1: RAILS[1] - 0.08, y: RAILS_TOP - 0.1, half: 1.28, rise: 0.28 },
    bogies: [{ x0: T_AXLES[0]! - 0.55, x1: T_AXLES[1]! + 0.55, y: 0.6 }, { x0: T_AXLES[2]! - 0.55, x1: T_AXLES[3]! + 0.55, y: 0.6 }],
    bogieFrameMat: "red",
    drawOnTruckFrame: tenderTruck,
    gear: { wheels: T_AXLES.map((x) => ({ x, d: 1.0, spokes: 10 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    // two lamps either side of the number on the rear wall
    lamps: { front: [], rear: [[TANK[1] + 0.23, 2.3, 1.02], [TANK[1] + 0.23, 2.3, -1.02]] },
    extras: tenderExtras(l),
  };
}

/** The P 8's engine or tender spec, by the `unit` and `livery` parameters' values. */
export function p8Spec(unit: string, livery: string): LocoSpec {
  const l: P8Livery = livery === "drBlack" ? "drBlack" : "kpev";
  return unit === "tender" ? tender(l) : engine(l);
}

/** The spec its distant model is drawn from: the cab as a prism from its pointed front's middle. */
export function p8LodSpec(unit: string, livery: string): LocoSpec {
  const s = p8Spec(unit, livery);
  if (unit === "tender") return s;
  const dr = livery === "drBlack";
  return { ...s, domes: DOMES, ...(dr ? { deflectors: { outlines: [WAGNER], z: WAGNER_Z } } : {}), cab: { x0: CAB0 - WEDGE / 2, x1: CAB1, half: CAB_HALF, roofY: 3.72, windows: [{ x0: 9.86, x1: 10.42, y0: 2.86, y1: 3.56 }] } };
}
