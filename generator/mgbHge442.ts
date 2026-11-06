// The Matterhorn Gotthard Bahn's HGe 4/4 II, the Bo'Bo' rack and adhesion
// electric locomotive of 1985-1990 (FO 101-108, BVZ 1-5), in the Furka-Oberalp
// red with the striped FO logo, as FO 105 (assets/mgb-hge442/SOURCES.md).
//
// Its own profile tables on the box locomotive kit (boxLocoKit.ts), not the
// generic world locomotive: the cab front leaning back from the waist, a grey
// skirt standing slightly proud of it, the cab roof rounded down to the front
// with the top headlight on the slope, and the higher machine-room roof (the
// three aluminium roof elements) whose sloped sides carry the louvres. The side
// walls are ribbed and have no machine-room openings; each side has one cab door,
// diagonally opposite the other side's, and the FO logo's seven bars lie between
// the ribs on the half away from the door. Centre couplers, no side buffers.
//
// 14.776 m over the couplers, bogie pivots 7.26 m apart, a 2.98 m bogie wheelbase.
// The body keeps its metre-gauge width on the game's standard-gauge wheelsets; the
// rack pinions are not drawn (docs/models/switzerland-trains.md).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { boxLocoLod, buildBoxLoco, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";

/** The running number the model carries (the Commons photograph's unit). */
export const HGE442_NUMBER = "105";
/** Half the length over the couplers. */
export const HGE442_HALF = 14.776 / 2;

const RED = c("#cc1426");
const Y0 = 0.95;
const SKIRT = 1.12;
const EAVE = 3.08;
const CAB_ROOF = 3.38;
/** The machine-room roof: from |x| = ROOM_X, its sloped sides from (ROOM_W, CAB_ROOF - 0.01) up to (ROOM_TOP_W, ROOM_TOP). */
const ROOM_X = 4.65;
const ROOM_W = 1.0;
const ROOM_TOP_W = 0.78;
const ROOM_TOP = 3.6;
const PANTO_X = 3.75;

/** The end's centre line [y, |x|]: the skirt, upright to 1.6 m, leaning back to the eave, the cab roof rounding down. */
const TIP = [[Y0, 6.9], [SKIRT, 6.9], [SKIRT + 0.04, 6.86], [1.6, 6.84], [EAVE, 6.5], [3.2, 6.4], [3.3, 6.22], [CAB_ROOF, 5.95]] as const;
/** The half width: upright side walls, the roof's shoulder rounded. */
const HW = [[Y0, 1.32], [EAVE, 1.32], [3.2, 1.27], [3.3, 1.17], [CAB_ROOF, 1.0]] as const;
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.6, 0.02], [w * 0.9, 0.07], [w, 0.18]] as const;

// the side ribs (the kit's 0.07 m ribs at this pitch) and the FO logo's bars in the flats between them
const RIB0 = 1.3;
const RIB_PITCH = 0.165;
const RIB_TOP = 3.0;
/** The flat between rib k and rib k + 1, inset from both. */
const flat = (k: number): [number, number] => [RIB0 + k * RIB_PITCH + 0.08, RIB0 + (k + 1) * RIB_PITCH - 0.01];

/**
 * The FO logo on side sd, on the half away from that side's door: seven bars
 * between the ribs, the F's (top two and the middle two full, the third and the
 * last two short) and the O's (the top and bottom two full, the middle three
 * split). Read from the side, the F comes first.
 */
function logo(sd: number): SideItem[] {
  // u along the reading direction from the logo's start; seen from +z reading runs toward +x
  const x = (u0: number, u1: number): [number, number] => {
    const a = 0.1 + u0, b = 0.1 + u1;
    return sd > 0 ? [a, b] : [-b, -a];
  };
  const F = 1.5, GAP = 0.3, O = 1.53, SHORT = 0.62, HOLE = 0.24;
  const o0 = F + GAP, oMid = o0 + O / 2;
  const items: SideItem[] = [];
  for (let row = 0; row < 7; row++) {
    const y = flat(8 - row);
    const add = (name: string, u0: number, u1: number) => items.push({ kind: "paint", name: `logo ${name} ${row + 1}`, x: x(u0, u1), y, mat: "white", sides: [sd] });
    add("F", 0, row === 2 || row >= 5 ? SHORT : F);
    if (row >= 2 && row <= 4) {
      add("O left", o0, oMid - HOLE / 2);
      add("O right", oMid + HOLE / 2, o0 + O);
    } else add("O", o0, o0 + O);
  }
  return items;
}

/** The side items of side sd (+1 right): the door near the rear on the right, near the front on the left. */
function sideItems(sd: number): SideItem[] {
  const doorEnd = -sd; // +1: the door is at the front
  const door: [number, number] = doorEnd > 0 ? [3.78, 4.48] : [-4.48, -3.78];
  const ribs: [number, number] = doorEnd > 0 ? [-5.0, 3.62] : [-3.62, 5.0];
  return [
    { kind: "door", name: "cab door", x: door, y: [SKIRT, 2.95], win: [1.55, 2.82], rails: true, sides: [sd] },
    { kind: "ribs", name: "ribs", x: ribs, y: [RIB0, RIB_TOP], pitch: RIB_PITCH, mat: "rib", sides: [sd] },
    ...logo(sd),
  ];
}

export function hge442Spec(): LocoSpec {
  return {
    palette: {
      paint: RED,
      grey: c("#868a8e", 0.6),
      roof: { color: "#8f9396", roughness: 0.7 },
      alu: { color: "#a9adb0", metallic: 0.3, roughness: 0.5 },
      // the numbers are white figures painted on the red, not on a plate
      plate: RED,
      // the ribs' tops, a shade darker so the pressed side reads
      rib: c("#b51022"),
      frame: c("#3a3c3f", 0.75),
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: [[Y0, SKIRT, "grey"], [SKIRT, EAVE, "paint"], [EAVE, 4.4, "roof"]],
    end: [[Y0, SKIRT, "grey"], [SKIRT, EAVE, "paint"], [EAVE, 4.4, "roof"]],
    roof: "roof",
    buffers: HGE442_HALF,
    beam: 6.86,
    centreCoupler: 0.8,
    frame: { y0: 0.74, y1: Y0, half: 6.86, hw: 1.285, mat: "grey" },
    bogies: [-3.63, 3.63].map((xc) => ({ xc, axles: [-1.49, 1.49], wheelR: 0.47, frameTop: 0.7 })),
    pantograph: { kind: "singleArm", x: PANTO_X, roofY: ROOM_TOP, baseY: ROOM_TOP + 0.12 },
    hvLine: { x: 1.4, y: 3.86, z: 0 },
    sideItems: [
      { kind: "window", name: "cab window", x: [5.2, 6.15], y: [2.15, 2.88], mat: "rim", mirror: true, r: 0.06 },
      { kind: "plate", name: "number", x: [5.3, 5.95], y: [1.86, 2.06], mirror: true },
      ...sideItems(1),
      ...sideItems(-1),
    ],
    endItems: [
      // the asymmetric windscreen: the driver's pane (left, seen from ahead) wider
      { kind: "window", name: "windscreen left", z: [-1.2, -0.05], y: [2.26, 3.02], mat: "rim", wiper: true },
      { kind: "window", name: "windscreen right", z: [0.09, 1.15], y: [2.26, 3.02], mat: "rim", wiper: true },
      { kind: "paint", name: "sill", z: [-1.24, 1.24], y: [2.15, 2.19], mat: "frame" },
      { kind: "lamp", name: "top headlight", z: [-0.1, 0.1], y: [3.14, 3.3], r: 0.075 },
      { kind: "lamp", name: "headlight left", z: [0.68, 0.92], y: [1.3, 1.54], r: 0.1 },
      { kind: "lamp", name: "headlight right", z: [-0.92, -0.68], y: [1.3, 1.54], r: 0.1 },
      { kind: "lamp", name: "tail lamp left", z: [1.04, 1.16], y: [1.36, 1.48], r: 0.05, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.16, -1.04], y: [1.36, 1.48], r: 0.05, mat: "lampRed" },
      { kind: "plate", name: "number", z: [-0.95, -0.3], y: [1.86, 2.08] },
    ],
    roofItems: [{ name: "roof elements", x: [-ROOM_X, ROOM_X], w: [ROOM_W, ROOM_TOP_W], y: [CAB_ROOF - 0.01, ROOM_TOP], mat: "alu" }],
    // the transformer and the tanks between the bogies
    underItems: [[-1.4, 1.4, 0.3, 0.74, 0.95]],
    number: HGE442_NUMBER,
  };
}

/**
 * The louvres on the roof elements' sloped sides: four panels a side, each a dark
 * panel with slats along it, between the joints of the elements.
 */
function louvres(m: MeshBuilder): void {
  const y0 = CAB_ROOF - 0.01, dz = ROOM_TOP_W - ROOM_W, dy = ROOM_TOP - y0, l = Math.hypot(dz, dy);
  const panels: Array<[number, number]> = [[-4.5, -2.35], [-2.25, -0.1], [0.1, 2.25], [2.35, 4.5]];
  m.scope("louvres", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        // the slope's outward normal and a point at fraction t up it
        const n: Vec3 = [0, -dz / l, (sd * dy) / l];
        const at = (x: number, t: number, d: number): Vec3 => [x, y0 + t * dy + n[1] * d, sd * (ROOM_W + t * dz) + n[2] * d];
        const into: Vec3 = [0, -n[1] * 0.02, -n[2] * 0.02];
        for (const [i, [x0, x1]] of panels.entries())
          m.scope(`panel ${i + 1}`, () => {
            m.slab("louvre", [at(x0, 0.12, 0.006), at(x1, 0.12, 0.006), at(x1, 0.9, 0.006), at(x0, 0.9, 0.006)], into);
            for (const t of [0.3, 0.5, 0.7])
              m.slab("slat", [at(x0 + 0.03, t - 0.03, 0.014), at(x1 - 0.03, t - 0.03, 0.014), at(x1 - 0.03, t + 0.03, 0.014), at(x0 + 0.03, t + 0.03, 0.014)], into);
          });
      });
  });
}

/** The HGe 4/4 II in the FO red as FO 105. */
export function mgbHge442(): MeshBuilder {
  const m = buildBoxLoco(hge442Spec());
  m.scope("roof equipment", () => louvres(m));
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function mgbHge442Lod(): MeshBuilder {
  return boxLocoLod(hge442Spec());
}
