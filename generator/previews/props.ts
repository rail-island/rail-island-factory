// The site previews of the parts a set module draws to the game's measure and the
// game places itself (docs/models/previews.md), filed with the Props: a cable-car
// pylon of a chosen height, and each catenary style's support -- a railway mast
// beside one track or a portal over two, a tram pole over a double street line --
// with a short run of the wires it holds.

import { resolveParams, type ParamSpec, type ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import * as cableCarStation from "../sets/cableCarStation.ts";
import * as catenaryStyle from "../sets/catenaryStyle.ts";
import { Sketch, type Rgb } from "./sketch.ts";

// --- the cable-car pylon ---

export const PYLON_PARAMS: ParamSpec[] = [
  { name: "height", title: "Height", default: "24", preview: true, values: ["12", "24", "40"].map((v) => ({ value: v, title: `${v} studs` })) },
];

/** A pylon of the chosen height, its sunk mast cut off at the ground. */
function pylonSketch(values: ParamValues | undefined, lod: boolean): Sketch {
  const s = new Sketch();
  const boxes = cableCarStation.buildPylon(Number(resolveParams(PYLON_PARAMS, values).height));
  boxes.forEach((b, i) => {
    if (lod && i >= 3) return;
    const y0 = Math.max(0, b.y - b.sy / 2), y1 = b.y + b.sy / 2;
    s.box(s.mat(b.material, b.color), { cx: b.x, cy: (y0 + y1) / 2, cz: b.z, sx: b.sx, sy: y1 - y0, sz: b.sz });
  });
  return s;
}
export function pylonPreview(values?: ParamValues): MeshBuilder { return pylonSketch(values, false).build("pylon"); }
export function pylonPreviewLod(values?: ParamValues): MeshBuilder { return pylonSketch(values, true).build("pylon"); }

// --- the catenary styles' supports ---

export const MAST_PARAMS: ParamSpec[] = [
  // the planner chooses: a mast beside a lone track, a portal over a corridor
  { name: "support", title: "Over", default: "trackside", preview: true, values: [{ value: "trackside", title: "One track" }, { value: "portal", title: "Two tracks" }] },
];
// the game's heights (studs): the railhead above the ground, the contact and messenger
// wires above it, the wire's thickness
const RAIL_TOP = 1.56, CONTACT = 8.86, MESSENGER = 10.6, WIRE = 0.08;
/** The ground sits this high so a footing sunk below it still stands on the preview's floor. */
const GROUND = 0.4;
/** The wires run this far either side of the support. */
const RUN = 6;
const COLORS: Record<catenaryStyle.CatenaryMaterial, Rgb> = { column: [90, 105, 45], footing: [226, 224, 220], insulator: [120, 95, 55], wire: [60, 60, 65] };

function supportSketch(values: ParamValues | undefined, style: string, lod: boolean): Sketch {
  const s = new Sketch();
  const wires: Array<[number, number]> = [];
  let parts: catenaryStyle.CatenaryPart[];
  if (catenaryStyle.TYPE_META[style]?.support === "pole") {
    const offsets = [-4, 4];
    parts = catenaryStyle.pole(style, { offset: 7.6, offsets, groundY: GROUND, trackYs: offsets.map(() => GROUND), wireLift: RAIL_TOP + CONTACT, deck: false, deckRise: 0, wire: WIRE });
    for (const x of offsets) wires.push([x, GROUND + RAIL_TOP + CONTACT]);
  } else {
    const portal = resolveParams(MAST_PARAMS, values).support === "portal";
    const drops = portal ? [0, 8] : [0];
    parts = catenaryStyle.mast(style, {
      uprights: portal ? [-4, 12] : [4], drops, deck: false, groundY: GROUND,
      railTop: RAIL_TOP, contact: CONTACT, messenger: MESSENGER, deckRise: 0, deckFootingWidth: 0, wire: WIRE,
    });
    for (const x of drops) wires.push([x, GROUND + RAIL_TOP + CONTACT], [x, GROUND + RAIL_TOP + MESSENGER]);
  }
  for (const p of parts) {
    if (lod && (p.material === "wire" || p.material === "insulator")) continue;
    const mat = s.mat(p.material === "footing" ? "concrete" : "steel", COLORS[p.material], p.material === "footing" ? "rail-footing" : undefined);
    if (p.shape === "box") {
      if (lod && p.sy < 0.5) continue;
      s.box(mat, { cx: p.x, cy: p.y, cz: p.along, sx: p.sx, sy: p.sy, sz: p.sz });
    } else if (p.shape === "bar") s.bar(mat, [p.ax, p.ay, 0], [p.bx, p.by, 0], p.thick);
    else s.pole(mat, p.x, 0, p.y0, p.y1, (p.radius + p.bottomRadius) / 2);
  }
  if (!lod) for (const [x, y] of wires) s.box(s.mat("wire", COLORS.wire), { cx: x, cy: y, cz: 0, sx: WIRE, sy: WIRE, sz: 2 * RUN });
  return s;
}
export function catenaryPreview(values: ParamValues | undefined, style: string): MeshBuilder { return supportSketch(values, style, false).build("support"); }
export function catenaryPreviewLod(values: ParamValues | undefined, style: string): MeshBuilder { return supportSketch(values, style, true).build("support"); }
