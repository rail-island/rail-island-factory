// A tender locomotive for the steam kit (steamLoco.ts) stated in a few
// measures: the wheel arrangement and wheel sizes, the boiler, the smoke
// deflectors, the coupler and the paint give the engine's and its tender's
// LocoSpec - axles, cylinders and valve gear, frames, running boards, the cab
// and firebox, domes, lamps and numbers. The steam locomotives of the eight
// countries' families are drawn with it (docs/models/world-steam.md).
//
// Every length is in metres along the locomotive from its front buffer heads.

import type { MaterialSpec } from "./meshBuilder.ts";
import type { LocoSpec } from "./steamLoco.ts";
import type { Steam } from "./steamParts.ts";
import { knuckleCoupler } from "./usHoodKit.ts";

export interface WorldSteam {
  title: string;
  /** Axles: leading, coupled, trailing; their wheels' diameters. */
  lead: number;
  coupled: number;
  trail: number;
  leadD: number;
  coupledD: number;
  trailD: number;
  /** The boiler's radius and the smoke deflectors: big (Wagner), small (Witte) or none. */
  boilerR: number;
  deflectors: "wagner" | "witte" | "none";
  /** The highest the chimney and the cab roof may reach (the loading gauge: 4.65 m UIC, 4.3 m British). */
  top: number;
  /** The coupler: buffers and a screw coupling (European, Indian) or an automatic knuckle (Chinese, American-built). */
  coupler: "buffers" | "knuckle";
  /** Half width of the cab and the running boards. */
  half: number;
  /** The domes on the boiler (1 - 3) and whether the firebox is a square Belpaire. */
  domes: number;
  belpaire?: boolean;
  /** An early engine without Walschaerts valve gear (the Rocket): the cylinders drive the wheels directly. */
  noValveGear?: boolean;
  /** An open footplate without a cab (the Rocket). */
  noCab?: boolean;
  palette: { paint: string; wheel: string; frame: string; smokebox?: string };
  /** The tender: its length over the buffers, its axles (4 on two bogies, else rigid) and wheel diameter. */
  tender: { length: number; axles: number; d: number };
  number: string;
}

const mat = (hex: string, r: number): MaterialSpec => ({ color: hex, roughness: r });

/** The engine's axle positions, front first: leading, coupled, trailing. */
function axles(s: WorldSteam): { lead: number[]; coupled: number[]; trail: number[] } {
  const lead: number[] = [];
  let x = 1.15 + s.leadD / 2;
  for (let i = 0; i < s.lead; i++) { lead.push(x); x += Math.max(s.leadD + 0.35, 2.0); }
  x = (s.lead ? lead[lead.length - 1]! + s.leadD / 2 + 0.75 : 1.6) + s.coupledD / 2;
  const coupled: number[] = [];
  for (let i = 0; i < s.coupled; i++) { coupled.push(x); x += s.coupledD + 0.2; }
  const trail: number[] = [];
  x = coupled[coupled.length - 1]! + s.coupledD / 2 + 0.75 + s.trailD / 2;
  for (let i = 0; i < s.trail; i++) { trail.push(x); x += s.trailD + 0.4; }
  return { lead, coupled, trail };
}

function frontCoupler(s: WorldSteam, t: Steam, x: number): void {
  if (s.coupler !== "knuckle") return;
  t.m.scope("front beam", () => {
    t.box("frame", x + 0.15, x + 0.4, 0.75, 1.15, -1.3, 1.3);
    knuckleCoupler(t.m, 1, t.X(x) - 0.6, t.X(x), 0.88);
  });
}

export function steamEngineSpec(s: WorldSteam): LocoSpec {
  const a = axles(s);
  const all = [...a.lead, ...a.coupled, ...a.trail];
  const lastWheel = all[all.length - 1]!;
  const lastD = s.trail ? s.trailD : s.coupledD;
  const end = lastWheel + lastD / 2 + 1.1;
  const y = Math.max(2.5, s.coupledD + 0.95 + (s.boilerR - 0.85) * 0.5);
  const r = s.boilerR;
  // the kit's smokebox saddle is 1.5 r wide: its sides must not lie on the frame plates' outer faces (|z| 0.52 - 0.6)
  if (r * 0.75 >= 0.52 && r * 0.75 <= 0.6) throw new Error(`${s.title}: boiler radius ${r} puts the saddle's sides on the frames`);
  const rb = Math.max(1.52, s.coupledD + 0.23);
  const cab0 = s.noCab ? end - 0.9 : end - 2.7;
  const chimneyX = 1.9;
  const span = cab0 - 1.5 - 3.2;
  const domeX = Array.from({ length: s.domes }, (_, i) => 3.2 + span * ((i + 0.5) / s.domes));
  const roofY = Math.min(s.top - 0.25, y + r + 0.55);
  const cylX = s.lead ? (a.lead[0]! + a.lead[a.lead.length - 1]!) / 2 : a.coupled[0]! - s.coupledD / 2 - 0.7;
  const defTop = y + r * 0.95;
  const deflectors = s.deflectors === "none" ? undefined
    : s.deflectors === "wagner"
      ? { outlines: [[[0.9, rb + 0.05], [3.0, rb + 0.05], [3.0, defTop], [1.25, defTop], [0.9, defTop - 0.4]]] as Array<Array<[number, number]>>, z: s.half - 0.12 }
      : { outlines: [[[1.0, y - 0.1], [2.6, y - 0.1], [2.6, defTop], [1.3, defTop], [1.0, defTop - 0.25]]] as Array<Array<[number, number]>>, z: r + 0.1 };
  const firebox: Array<[number, number]> = s.belpaire
    ? [[r + 0.1, rb], [r + 0.1, y + r * 0.85], [r - 0.05, y + r + 0.05], [0, y + r + 0.1]]
    : [[r + 0.05, rb], [r + 0.05, y + 0.3], [r * 0.85, y + r * 0.6], [r * 0.5, y + r * 0.9], [0, y + r]];
  return {
    title: s.title,
    palette: { paint: mat(s.palette.paint, 0.55), wheel: mat(s.palette.wheel, 0.6), frame: mat(s.palette.frame, 0.65), ...(s.palette.smokebox ? { smokebox: mat(s.palette.smokebox, 0.85) } : {}) },
    heads: [0, end + 0.5],
    beams: s.coupler === "buffers" ? { y0: 0.72, y1: 1.3, length: [0.55, 0.3], half: Math.min(1.45, s.half - 0.04) } : { front: false, rear: false },
    boiler: { x0: 1.0, x1: cab0, y, r, smokebox: 1.5, bands: domeX.map((x) => x - 0.9) },
    chimney: { x: chimneyX, top: Math.min(s.top - 0.05, y + r + 0.95), r: 0.3 },
    domes: domeX.map((x) => ({ x, top: Math.min(s.top - 0.1, y + r + 0.65), r: 0.4 })),
    valves: { x: cab0 - 0.8, top: Math.min(s.top - 0.2, y + r + 0.45) },
    handrail: { x0: 2.2, x1: cab0 - 1.6, y: y + r * 0.25 },
    runningBoard: { profile: [[0.45, 1.33], [1.3, 1.33], [1.9, rb], [end, rb]], half: s.half - 0.08, valance: 0.08 },
    frame: { x0: 0.55, x1: end, top: Math.min(rb - 0.08, y - r - 0.05) },
    ...(s.noCab ? {} : { cab: {
      x0: cab0, x1: end, half: [[s.half, rb], [s.half, roofY - 0.3], [s.half - 0.2, roofY - 0.05], [s.half * 0.55, roofY + 0.12], [0, roofY + 0.17]], roofY: roofY - 0.05,
      windows: [{ x0: cab0 + 0.3, x1: cab0 + 1.1, y0: roofY - 1.05, y1: roofY - 0.45 }, { x0: cab0 + 1.3, x1: cab0 + 2.1, y0: roofY - 1.05, y1: roofY - 0.45 }],
      front: [{ z0: 0.75, z1: s.half - 0.25, y0: roofY - 0.95, y1: roofY - 0.45 }, { z0: -(s.half - 0.25), z1: -0.75, y0: roofY - 0.95, y1: roofY - 0.45 }],
    } }),
    prisms: [{ name: "firebox", x0: cab0 - 1.5, x1: cab0, half: firebox }],
    ...(deflectors ? { deflectors } : {}),
    bogies: [
      ...(s.lead ? [{ x0: a.lead[0]! - s.leadD / 2 - 0.2, x1: a.lead[a.lead.length - 1]! + s.leadD / 2 + 0.2, y: s.leadD * 0.62 }] : []),
      ...(s.trail ? [{ x0: a.trail[0]! - s.trailD / 2 - 0.2, x1: a.trail[a.trail.length - 1]! + s.trailD / 2 + 0.2, y: s.trailD * 0.62 }] : []),
    ],
    gear: {
      wheels: [
        ...a.lead.map((x) => ({ x, d: s.leadD, spokes: 10, outsideBoxes: true })),
        ...a.coupled.map((x) => ({ x, d: s.coupledD, spokes: s.coupledD > 1.6 ? 20 : 16 })),
        ...a.trail.map((x) => ({ x, d: s.trailD, spokes: 12 })),
      ],
      engines: [{
        coupled: a.coupled.map((_, i) => s.lead + i), main: s.lead + Math.min(s.coupled - 1, Math.floor(s.coupled / 2)),
        cylinder: { x0: cylX - 0.5, x1: cylX + 0.5, y: 1.05, r: 0.32 }, crank: Math.min(0.36, s.coupledD * 0.2), phase: 0.3, valveGear: !s.noValveGear,
      }],
      cylinderZ: Math.min(1.12, s.half - 0.36), reference: s.lead, wheelMaterial: "wheel",
    },
    ...(s.coupler === "buffers" ? { lamps: { front: [[0.56, 1.3, 0.85], [0.56, 1.3, -0.85]], rear: [[end + 0.45, 1.3, 0.7], [end + 0.45, 1.3, -0.7]] } } : {}),
    number: s.noCab ? { text: s.number, front: [0.98, y] } : { text: s.number, side: [cab0 + 1.35, rb + 0.4, s.half], front: [0.98, y] },
    extras: (t) => {
      frontCoupler(s, t, 0);
      if (s.coupler === "knuckle") t.m.scope("drawbar", () => t.box("frame", end, end + 0.5, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

export function steamTenderSpec(s: WorldSteam): LocoSpec {
  const L = s.tender.length;
  const d = s.tender.d;
  const n = s.tender.axles;
  const body = L - 0.6;
  const wheels = n === 4
    ? [0.9, 0.9 + 1.7, body - 0.9 - 1.7, body - 0.9]
    : Array.from({ length: n }, (_, i) => 1.0 + d / 2 + ((body - 2.0 - d) * i) / Math.max(1, n - 1));
  const tankTop = Math.min(s.top - 0.9, 3.0);
  return {
    title: `${s.title} tender`,
    palette: { paint: mat(s.palette.paint, 0.55), wheel: mat(s.palette.wheel, 0.6), frame: mat(s.palette.frame, 0.65) },
    heads: [-0.3, L - 0.3],
    beams: s.coupler === "buffers" ? { y0: 0.75, y1: 1.3, length: [0.3, 0.62], half: Math.min(1.45, s.half - 0.04) } : { front: false, rear: false },
    frame: { x0: 0, x1: body, top: 1.2 },
    prisms: [
      { name: "tank", x0: 0, x1: body, half: [[s.half - 0.08, 1.2], [s.half - 0.08, tankTop - 0.2], [s.half - 0.25, tankTop]] },
      { name: "coal bunker", x0: 0.5, x1: body * 0.55, half: [[s.half - 0.25, tankTop], [s.half - 0.35, tankTop + 0.45]] },
    ],
    coal: { x0: 0.6, x1: body * 0.55 - 0.1, y: tankTop + 0.4, half: s.half - 0.5, rise: 0.25 },
    ...(n === 4 ? { bogies: [{ x0: 0.2, x1: 3.3, y: 0.6 }, { x0: body - 3.3, x1: body - 0.2, y: 0.6 }] } : {}),
    gear: { wheels: wheels.map((x) => ({ x, d, spokes: 10 })), engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[body + 0.05, 1.3, 0.7], [body + 0.05, 1.3, -0.7]] },
    ...(s.coupler === "knuckle" ? {
      extras: (t: Steam) => t.m.scope("rear beam", () => { t.box("frame", body - 0.15, body, 0.75, 1.15, -1.3, 1.3); knuckleCoupler(t.m, -1, -t.X(L - 0.3) - 0.6, -t.X(L - 0.3), 0.88); }),
    } : {}),
  };
}
