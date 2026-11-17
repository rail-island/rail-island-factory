// What the parade draws for the chains that do not run on the ground
// (docs/site/train-parade.md): a ship's or an aircraft's model turned to face the
// parade's way and moved onto its datum, a cable car cabin hung from its line's
// rope head, and the stations and the pylon a cable car line brings as scenery.
//
// Everything here works on built triangles (glbTriangles.ts `Tri`) and returns
// triangles in metres, in the parade's frame: nose at +X (drawn at the image's
// left edge, the way the chains run), +Y up from the view's datum.
//
// The stations and the pylon are the cable car station set's (sets/cableCarStation.ts),
// drawn as the line preview draws them (previews/cableCarLine.ts) but alone, in the
// game's studs, then scaled to metres: the game draws a vehicle at STUD_SCALE studs
// per model metre (cableCarLine.ts), so a stud is 1 / STUD_SCALE metres here.

import { cabinLine, cabinView, STUD_SCALE, type CabinLine } from "./cableCarLine.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import type { Tri, Vec3 } from "./glbTriangles.ts";
import { parseGlb } from "./glbParse.ts";
import { Sketch } from "./previews/sketch.ts";
import * as station from "./sets/cableCarStation.ts";
import type { MeshBuilder } from "./meshBuilder.ts";

/** Metres per stud of the game's cable car frame. */
export const M_PER_STUD = 1 / STUD_SCALE;

/** Metres between two pylons of a line on the strip. */
export const PYLON_SPACING_M = 60;

/** A point transform applied to a car's triangles (and its emitters) before the side view. */
export type PointMap = (p: Vec3) => Vec3;

/** Triangles moved by `map`, their normals by its rotation (`turn`, a yaw only, so lengths keep). */
export function mapTriangles(tris: readonly Tri[], map: PointMap, turn: PointMap): Tri[] {
  return tris.map((t) => ({ ...t, p: t.p.map(map) as Tri["p"], n: t.n.map(turn) as Tri["n"] }));
}

/** The turn about +Y by `deg` degrees, three.js's sense (as the game applies a catalog yaw). */
export function yawTurn(deg: number): PointMap {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return ([x, y, z]) => [x * c + z * s, y, -x * s + z * c];
}

/**
 * A ship's or an aircraft's turn into the parade's frame: the game's catalog yaw
 * (after which the vehicle faces -X, the game's forward), then half round, so its
 * nose is at +X as every chain's is.
 */
export function craftTurn(design: ProceduralDesign): PointMap {
  return yawTurn((design.catalog?.yaw ?? 0) + 180);
}

/** The height of a ship's waterline over its keel: `draftFrac` of the model's height. */
export function waterline(tris: readonly Tri[], draftFrac: number): number {
  let lo = Infinity, hi = -Infinity;
  for (const t of tris) for (const p of t.p) {
    if (p[1] < lo) lo = p[1];
    if (p[1] > hi) hi = p[1];
  }
  return lo + draftFrac * (hi - lo);
}

/**
 * The GLB with every node named `name` (and so all under it) emptied: an aircraft's
 * retractable gear, which the game hides in flight (the node `gear`,
 * docs/models/aircraft.md). The binary chunk is kept as it is.
 */
export function withoutNode(glb: Uint8Array, name: string): Uint8Array {
  const { json, bin } = parseGlb(glb);
  const nodes = (json as unknown as { nodes?: Array<Record<string, unknown>> }).nodes ?? [];
  let found = false;
  for (const n of nodes) {
    if (n.name !== name) continue;
    found = true;
    delete n.mesh;
    delete n.children;
  }
  if (!found) return glb;
  return writeGlb(json, bin);
}

function writeGlb(json: unknown, bin: Uint8Array): Uint8Array {
  let text = new TextEncoder().encode(JSON.stringify(json));
  const pad = (4 - (text.length % 4)) % 4;
  const padded = new Uint8Array(text.length + pad).fill(0x20);
  padded.set(text);
  text = padded;
  const out = new Uint8Array(12 + 8 + text.length + 8 + bin.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, out.length, true);
  view.setUint32(12, text.length, true);
  view.setUint32(16, 0x4e4f534a, true);
  out.set(text, 20);
  view.setUint32(20 + text.length, bin.length, true);
  view.setUint32(24 + text.length, 0x004e4942, true);
  out.set(bin, 28 + text.length);
  return out;
}

/** The height of a station type's rope head over its level, metres. */
export function ropeHeadM(type: string): number {
  return station.TYPE_META[type]!.ropeHeadY * M_PER_STUD;
}

/**
 * A cable car cabin hung from a line of station type `type`: the game's own frame
 * for it (cableCarLine.ts: the catalog's yaw, recentred and scaled to studs, the
 * rope datum at 0, the rope along +x), in metres, its rope datum at the rope head's
 * height over the station level.
 */
export function cabinHang(design: ProceduralDesign, params: ParamValues | undefined, type: string): { map: PointMap; turn: PointMap; line: CabinLine } {
  const line = cabinLine(design, params);
  const b = line.box, k = line.k;
  const turn = yawTurn(design.catalog?.yaw ?? 0);
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  const head = ropeHeadM(type);
  const map: PointMap = (p) => {
    const [rx, y, rz] = turn(p);
    return [(rx - cx) * k * M_PER_STUD, ((y - b.y0) * k - line.drop) * M_PER_STUD + head, (rz - cz) * k * M_PER_STUD];
  };
  return { map, turn, line };
}

/** The ropes the line draws for the cabin, as heights over the station level (metres), one per height and kind. */
export function ropeHeights(line: CabinLine, type: string): { kind: "haul" | "track"; yM: number }[] {
  const head = ropeHeadM(type);
  const out: { kind: "haul" | "track"; yM: number }[] = [];
  for (const r of line.ropes) {
    const yM = Math.round((head + r.dy * M_PER_STUD) * 1000) / 1000;
    if (!out.some((o) => o.kind === r.kind && o.yM === yM)) out.push({ kind: r.kind, yM });
  }
  return out.sort((a, b) => a.yM - b.yM || a.kind.localeCompare(b.kind));
}

const PAD: [number, number, number] = [150, 146, 138];

/**
 * A station of type `type` for the cabin's line, seen from the parade's side: at
 * the strip's `right` end it faces +X (its +Z, the line's side, toward the strip's
 * middle: the cabins come out of it), at the `left` end -X. Studs, as the set
 * draws it; `stationModel` scales it to metres.
 */
function stationSketch(type: string, line: CabinLine, circulating: boolean, end: "right" | "left"): Sketch {
  const meta = station.TYPE_META[type]!;
  const model = station.buildStation(type, cabinView(line, circulating));
  // the station's +Z (the line) toward +X at the right end, -X at the left end
  const yaw = end === "right" ? Math.PI / 2 : -Math.PI / 2;
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  const to = (x: number, y: number, z: number): Vec3 => [x * c + z * sn, y, -x * sn + z * c];
  const s = new Sketch();
  // the levelled footprint, a slab at the station's level
  s.box(s.mat("deck", PAD), { cx: 0, cy: -0.25, cz: 0, sx: meta.w, sy: 0.5, sz: meta.d, yaw });
  for (const b of model.boxes) {
    if (b.level === "low") continue;
    // what stands outside the footprint reaches far below its level: cut at it
    const sunk = !b.rotX && !b.rotZ && b.cy - b.sy / 2 < -0.5;
    if (sunk && b.cy + b.sy / 2 <= -0.5) continue;
    const y0 = sunk ? -0.5 : b.cy - b.sy / 2, y1 = b.cy + b.sy / 2;
    const [cx, cy, cz] = to(b.cx, (y0 + y1) / 2, b.cz);
    s.box(s.mat(b.material, b.color), { ...b, cx, cy, cz, sy: y1 - y0, yaw });
  }
  for (const sec of model.sectors) {
    if (sec.level === "low") continue;
    const mid = Math.atan2(sec.apexX, -sec.apexZ), r = (sec.rIn + sec.rOut) / 2, w = sec.rOut - sec.rIn;
    const steps = Math.max(4, Math.ceil((2 * sec.halfAngle) / 0.15));
    const path = Array.from({ length: steps + 1 }, (_, i) => {
      const a = mid - sec.halfAngle + (2 * sec.halfAngle * i) / steps;
      return to(sec.cx + Math.sin(a) * r, sec.cy, sec.cz - Math.cos(a) * r);
    });
    const y0 = sec.cy - sec.thick / 2, y1 = sec.cy + sec.thick / 2;
    s.sweep(s.mat(sec.material, sec.color), path, [[-w / 2, y0], [w / 2, y0], [w / 2, y1], [-w / 2, y1]], true);
  }
  return s;
}

/** The pylon of the cabin's line, its rope saddle at the station type's rope head. Studs. */
function pylonSketch(type: string, line: CabinLine): Sketch {
  const s = new Sketch();
  for (const b of station.buildPylon(station.TYPE_META[type]!.ropeHeadY, line.ropes)) {
    const y0 = Math.max(-0.5, b.y - b.sy / 2), y1 = b.y + b.sy / 2;
    if (y1 <= y0) continue;
    // the pylon's x runs across the line (the parade's Z), its z along it (X)
    s.box(s.mat(b.material, b.color), { cx: b.z, cy: (y0 + y1) / 2, cz: -b.x, sx: b.sz, sy: y1 - y0, sz: b.sx });
  }
  return s;
}

/** Scale built studs to metres: every point by M_PER_STUD (normals keep). */
export const studsToMetres: PointMap = (p) => [p[0] * M_PER_STUD, p[1] * M_PER_STUD, p[2] * M_PER_STUD];

/** A cable car line's scenery as builders in studs: both stations and the pylon, for the cabin `design` on station type `type`. */
export function lineScenery(design: ProceduralDesign, params: ParamValues | undefined, type: string, circulating: boolean): { right: MeshBuilder; left: MeshBuilder; pylon: MeshBuilder } {
  const line = cabinLine(design, params);
  return {
    right: stationSketch(type, line, circulating, "right").build("station"),
    left: stationSketch(type, line, circulating, "left").build("station"),
    pylon: pylonSketch(type, line).build("pylon"),
  };
}
