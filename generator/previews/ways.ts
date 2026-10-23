// The site previews of the ways and what lines them (docs/models/previews.md): one
// page per rail type -- its ballast bed, sleepers and rails, and on a wired type the
// catenary style's masts and wires -- per road type -- its whole cross-section from
// the factory's data: carriageway, shoulders, centre line, embedded tram tracks -- and
// per line decoration, the decoration set's modules along both sides of a road. Every
// surface carries the photo the game binds to it.

import { resolveParams, type ParamSpec, type ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import type { SurfaceId } from "../surfaces.ts";
import * as railType from "../sets/railType.ts";
import * as roadType from "../sets/roadType.ts";
import * as decoration from "../sets/decoration.ts";
import * as catenaryStyle from "../sets/catenaryStyle.ts";
import { Sketch, type Rgb, type V } from "./sketch.ts";

export const WAY_PARAMS: ParamSpec[] = [
  { name: "length", title: "Length", default: "short", preview: true, values: [{ value: "short", title: "40 studs" }, { value: "long", title: "80 studs" }] },
];
const lengthOf = (values: ParamValues | undefined): number => (resolveParams(WAY_PARAMS, values).length === "long" ? 80 : 40);

// the game's track measures (studs): the ballast bed's foot and slope, the sleepers,
// the rails and their gauge, the railhead, and the overhead wires above it
const BED_Y = 0.67, BED_SLOPE = 0.9;
const TIE = { spacing: 2.2, width: 3.6, height: 0.35, depth: 0.8 };
const GAUGE = 2.7, RAIL_W = 0.45, RAIL_H = 0.45;
const BALLAST: Rgb = [168, 160, 150], STEEL: Rgb = [120, 120, 130];
const CONTACT = 8.86, MESSENGER = 10.6, WIRE = 0.08, MAST_SPACING = 30;

/** One track along +X centred at lateral `z`: bed, sleepers (unless `bare`), rails; returns the railhead height. */
function track(s: Sketch, length: number, z: number, sleeper: { color: Rgb; surface: SurfaceId } | null, lod: boolean, bedTop = BED_Y + (0.8 * 2) / 3, bedWidth = 5): number {
  const half = bedWidth / 2;
  s.sweep(s.mat("ballast", BALLAST, "rail-ballast"), [[-length / 2, 0, z], [length / 2, 0, z]],
    [[half + BED_SLOPE, 0], [half, bedTop], [-half, bedTop], [-half - BED_SLOPE, 0]], true);
  if (sleeper && !lod) {
    const tie = s.mat("wood", sleeper.color, sleeper.surface);
    for (let x = -length / 2 + TIE.spacing / 2; x < length / 2; x += TIE.spacing) s.box(tie, { cx: x, cy: bedTop + TIE.height / 2, cz: z, sx: TIE.depth, sy: TIE.height, sz: TIE.width });
  }
  const railY = bedTop + TIE.height + RAIL_H / 2;
  if (!lod) for (const side of [-1, 1]) s.box(s.mat("steel", STEEL), { cx: 0, cy: railY, cz: z + side * GAUGE / 2, sx: length, sy: RAIL_H, sz: RAIL_W });
  return railY + RAIL_H / 2;
}

function railSketch(values: ParamValues | undefined, type: string, lod: boolean): Sketch {
  const length = lengthOf(values);
  const meta = railType.TYPE_META[type] ?? railType.TYPE_META.wooden_sleepers!;
  const s = new Sketch();
  const top = track(s, length, 0, { color: meta.sleeper.color, surface: meta.sleeper.material === "concrete" ? "rail-tie-concrete" : "rail-tie-wood" }, lod, BED_Y + meta.ballast.height, meta.ballast.width);
  if (meta.catenary && catenaryStyle.TYPE_META[meta.catenary]?.support === "mast") {
    for (let x = -length / 2 + 4; x <= length / 2; x += MAST_SPACING) {
      for (const p of catenaryStyle.mast(meta.catenary, { uprights: [-4], drops: [0], deck: false, groundY: 0, railTop: top, contact: CONTACT, messenger: MESSENGER, deckRise: 0, deckFootingWidth: 0, wire: WIRE })) {
        if (lod && p.material !== "column") continue;
        const mat = s.mat(p.material === "footing" ? "concrete" : "steel", p.material === "footing" ? [226, 224, 220] : [90, 105, 45], p.material === "footing" ? "rail-footing" : undefined);
        // the mast's cross-section is lateral (x) by height: turned to stand across the track (z)
        if (p.shape === "box") s.box(mat, { cx: x + p.along, cy: p.y, cz: p.x, sx: p.sz, sy: p.sy, sz: p.sx });
        else if (p.shape === "bar") s.bar(mat, [x, p.ay, p.ax], [x, p.by, p.bx], p.thick);
      }
    }
    if (!lod) for (const y of [top + CONTACT, top + MESSENGER]) s.box(s.mat("wire", [60, 60, 65]), { cx: 0, cy: y, cz: 0, sx: length, sy: WIRE, sz: WIRE });
  }
  return s;
}
export function railTypePreview(values: ParamValues | undefined, type: string): MeshBuilder { return railSketch(values, type, false).build("rail"); }
export function railTypePreviewLod(values: ParamValues | undefined, type: string): MeshBuilder { return railSketch(values, type, true).build("rail"); }

/** The road surfaces by photo set (the game's road surfaces). */
const ROAD_SURFACE: Record<string, SurfaceId> = { asphalt: "road-asphalt", cobblestone: "road-cobblestone", pavement: "road-pavement", gravel: "road-gravel" };
/** The road deck's top above the ground, and how far a shoulder sits below the carriageway. */
const DECK_TOP = 1.2, SHOULDER_DROP = 0.15;

/** One road of `type` along +X; returns the shoulder's top (what a guardrail is bolted to). */
function road(s: Sketch, length: number, type: string, lod: boolean): number {
  const t = roadType.TYPE_META[type] ?? roadType.TYPE_META.narrow_asphalt!;
  const carriage = t.width - 2 * t.shoulder.width;
  const surfaceMat = s.mat("pavement", t.surface.color, ROAD_SURFACE[t.surface.texture]);
  const shoulderMat = s.mat("kerb", t.shoulder.color, ROAD_SURFACE[t.shoulder.texture]);
  s.box(surfaceMat, { cx: 0, cy: DECK_TOP / 2, cz: 0, sx: length, sy: DECK_TOP, sz: carriage });
  for (const side of [-1, 1]) s.box(shoulderMat, { cx: 0, cy: (DECK_TOP - SHOULDER_DROP) / 2, cz: side * (carriage + t.shoulder.width) / 2, sx: length, sy: DECK_TOP - SHOULDER_DROP, sz: t.shoulder.width });
  if (!lod && t.centerLine) {
    const line = s.mat("paint", t.centerLine.color);
    for (let x = -length / 2; x + t.centerLine.dash <= length / 2; x += t.centerLine.dash + t.centerLine.gap) s.box(line, { cx: x + t.centerLine.dash / 2, cy: DECK_TOP + 0.04, cz: 0, sx: t.centerLine.dash, sy: 0.08, sz: t.centerLine.width });
  }
  for (const z of t.tramTracks) {
    if (t.trackOnly) track(s, length, z, { color: [101, 67, 33], surface: "tram-tie" }, lod, DECK_TOP - 0.3, 4);
    else if (!lod) for (const side of [-1, 1]) s.box(s.mat("steel", STEEL), { cx: 0, cy: DECK_TOP + 0.03, cz: z + side * GAUGE / 2, sx: length, sy: 0.06, sz: RAIL_W });
  }
  return DECK_TOP - SHOULDER_DROP;
}

function roadSketch(values: ParamValues | undefined, type: string, lod: boolean): Sketch {
  const s = new Sketch();
  road(s, lengthOf(values), type, lod);
  return s;
}
export function roadTypePreview(values: ParamValues | undefined, type: string): MeshBuilder { return roadSketch(values, type, false).build("road"); }
export function roadTypePreviewLod(values: ParamValues | undefined, type: string): MeshBuilder { return roadSketch(values, type, true).build("road"); }

// --- line decorations: the kind along both sides of a wide road ---

const DECORATION_COLORS: Record<decoration.DecorationMaterial, { color: Rgb; surface?: SurfaceId }> = {
  concrete: { color: [190, 188, 180], surface: "gallery-concrete" },
  wall: { color: [146, 156, 135] },
  metal: { color: [98, 107, 104] },
};

function decorationSketch(values: ParamValues | undefined, kind: string, lod: boolean): Sketch {
  const length = lengthOf(values);
  const s = new Sketch();
  const shoulderY = road(s, length, "wide_asphalt", lod);
  const env = decoration.TYPE_META[kind];
  // where the game stands the kind: a guardrail on the shoulder strip, the rest past the road's edge
  const reach = env?.anchor === "shoulder" ? 8 - 0.7 : 8 + (env?.margin ?? 3) * 0.5;
  const spacing = env?.spacing ?? 4;
  const trunk = s.mat("wood", [96, 72, 48]), crown = s.mat("foliage", [72, 112, 58]);
  const out: decoration.DecorationOut = {
    sweep(material, a, b, left, right, bottomA, topA, bottomB, topB, leftRise = 0, rightRise = 0) {
      const at = (c: decoration.Cross, side: number, y: number): V => [c.x - c.tz * side, y, c.z + c.tx * side];
      const ring = (c: decoration.Cross, bottom: number, top: number): V[] => [at(c, left, bottom + leftRise), at(c, right, bottom + rightRise), at(c, right, top + rightRise), at(c, left, top + leftRise)];
      const m = DECORATION_COLORS[material];
      s.rings(s.mat(material, m.color, m.surface), [ring(a, bottomA, topA), ring(b, bottomB, topB)]);
    },
    box(material, x, y, z, w, h, d, angle) {
      const m = DECORATION_COLORS[material];
      s.box(s.mat(material, m.color, m.surface), { cx: x, cy: y, cz: z, sx: w, sy: h, sz: d, yaw: angle });
    },
    tree(_side, x, z, ground) {
      s.pole(trunk, x, z, ground, ground + 3, 0.3, 6);
      s.box(crown, { cx: x, cy: ground + 5.5, cz: z, sx: 3.6, sy: 5, sz: 3.6 });
    },
  };
  for (let x = -length / 2; x + spacing <= length / 2 + 1e-6; x += spacing) {
    decoration.buildPiece(kind,
      { a: { x, y: 0, z: 0, tx: 1, tz: 0 }, b: { x: x + spacing, y: 0, z: 0, tx: 1, tz: 0 }, left: reach, right: -reach, leftVisible: true, rightVisible: true, side: env?.sides.includes("both") ? "both" : "left" },
      { heightAt: () => 0, detail: lod ? "low" : "high", shoulderY }, out);
  }
  return s;
}
export function decorationPreview(values: ParamValues | undefined, kind: string): MeshBuilder { return decorationSketch(values, kind, false).build("decoration"); }
export function decorationPreviewLod(values: ParamValues | undefined, kind: string): MeshBuilder { return decorationSketch(values, kind, true).build("decoration"); }
