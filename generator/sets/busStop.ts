// The bus and tram stop types (docs/models/sets.md): what stands on ONE side of the
// road at a stop. The game binds a stop to a road segment, finds its pose and grade,
// and builds this side twice, once on each kerb, so both platforms match and their
// signs face approaching traffic.
//
// The side's frame: x runs along the direction a bus travels past this kerb, z
// outward from the road's centreline, y up; the origin is on the road surface at
// the stop, so `lateral` (half the road's width plus a margin) is where the kerb
// is. A box's axes are the side's (x along, z outward) unless it says otherwise.
//
// Tags the game resolves against the road: every box follows the road's grade,
// except each `level` group -- furniture (a bench, a bin) the game lifts level above
// the highest point of its footprint, its `supports` stretched down to the road.
//
// Pure data, no imports: bundled into export/sets/busStop.js for the game.

export type BusStopMaterial = "column" | "sign" | "frame" | "glass" | "roof" | "bench" | "pavement";
export type Rgb = [number, number, number];

/** One box of a stop side. */
export interface SideBox {
  x: number; y: number; z: number;
  sx: number; sy: number; sz: number;
  color: Rgb;
  material: BusStopMaterial;
  /** "world": the box keeps the world's X/Z axes (a square post); "sign": it faces along the road. */
  axes?: "world" | "sign";
  /** Near-only detail the far level drops; false marks a box as part of the silhouette. */
  detail?: boolean;
}

/** A furniture group the game sets level: indices into `boxes`. */
export interface SideLevel { parts: number[]; supports: number[] }

export interface SideBuild { boxes: SideBox[]; level: SideLevel[] }

/** The types, in picker order. */
export const TYPES: readonly string[] = ["shelter", "canopy", "cargo"];

// --- dimensions (studs) ---
const COLUMN_HEIGHT = 5.0;
const COLUMN_THICKNESS = 0.4;
const EDGE_MARGIN = 1.0;
const SIGN_WIDTH = 1.8;
const SIGN_HEIGHT = 1.0;
const SIGN_THICKNESS = 0.12;
const SHELTER_LENGTH = 6.0;
const SHELTER_DEPTH = 3.0;
const SHELTER_HEIGHT = 4.0;
const SHELTER_POST_THICKNESS = 0.3;
const SHELTER_GLASS_THICKNESS = 0.12;
const SHELTER_ROOF_THICKNESS = 0.3;
const SHELTER_ROOF_OVERHANG = 0.4;
const BENCH_HEIGHT = 0.7;
const BENCH_THICKNESS = 0.25;
const BENCH_DEPTH = 0.8;
const BENCH_LEG_THICKNESS = 0.18;
const SHELTER_BEFORE_OFFSET = 7.0;
/** The raised platform's thickness: everything but the platform stands on it. */
export const PAVEMENT_THICKNESS = 0.4;
const PAVEMENT_DEPTH_MARGIN = 0.8;
const PAVEMENT_LENGTH_MARGIN = 1.5;
/** How far beyond the road's edge the kerb stands. */
export const KERB_MARGIN: number = EDGE_MARGIN;

// --- colours (RGB 0-255) ---
const COLUMN_COLOR: Rgb = [200, 170, 40];
const SIGN_COLOR: Rgb = [40, 80, 200];
const FRAME_COLOR: Rgb = [60, 65, 70];
const GLASS_COLOR: Rgb = [180, 205, 225];
const ROOF_COLOR: Rgb = [45, 50, 55];
const BENCH_COLOR: Rgb = [120, 85, 50];
const PAVEMENT_COLOR: Rgb = [170, 170, 165];
/** How see-through the shelter glass is. */
export const GLASS_TRANSPARENCY = 0.55;

type Out = { boxes: SideBox[]; level: SideLevel[] };

const range = (from: number, to: number): number[] => Array.from({ length: to - from }, (_, i) => from + i);

// thin raised rectangular pavement under the shelter, on the road surface
function buildPavement(o: Out, lateral: number): void {
  const dNear = Math.max(lateral - EDGE_MARGIN, 0.5);
  const dFar = lateral + SHELTER_DEPTH + PAVEMENT_DEPTH_MARGIN;
  const upstreamEnd = -SHELTER_BEFORE_OFFSET - SHELTER_LENGTH / 2 - PAVEMENT_LENGTH_MARGIN;
  const downstreamEnd = PAVEMENT_LENGTH_MARGIN;
  o.boxes.push({
    x: (upstreamEnd + downstreamEnd) / 2, y: PAVEMENT_THICKNESS / 2, z: (dNear + dFar) / 2,
    sx: downstreamEnd - upstreamEnd, sy: PAVEMENT_THICKNESS, sz: dFar - dNear, color: PAVEMENT_COLOR, material: "pavement",
  });
}

// glass-and-steel passenger shelter, opening toward the road
function buildShelter(o: Out, lateral: number): void {
  const out = o.boxes;
  const y0 = PAVEMENT_THICKNESS;
  const cx = -SHELTER_BEFORE_OFFSET;
  const cz = lateral + SHELTER_DEPTH / 2;
  const halfL = SHELTER_LENGTH / 2;
  const halfD = SHELTER_DEPTH / 2;
  out.push({ x: cx, y: y0 + SHELTER_HEIGHT + SHELTER_ROOF_THICKNESS / 2, z: cz,
    sx: SHELTER_LENGTH + SHELTER_ROOF_OVERHANG, sy: SHELTER_ROOF_THICKNESS, sz: SHELTER_DEPTH + SHELTER_ROOF_OVERHANG, color: ROOF_COLOR, material: "roof" });
  // glass back wall, away from the road
  out.push({ x: cx, y: y0 + SHELTER_HEIGHT / 2, z: cz + halfD, sx: SHELTER_LENGTH, sy: SHELTER_HEIGHT, sz: SHELTER_GLASS_THICKNESS, color: GLASS_COLOR, material: "glass" });
  for (const s of [-1, 1]) {
    out.push({ x: cx + halfL * s, y: y0 + SHELTER_HEIGHT / 2, z: cz, sx: SHELTER_GLASS_THICKNESS, sy: SHELTER_HEIGHT, sz: SHELTER_DEPTH, color: GLASS_COLOR, material: "glass" });
  }
  for (const sl of [-1, 1]) {
    for (const sd of [-1, 1]) {
      out.push({ x: cx + halfL * sl, y: y0 + SHELTER_HEIGHT / 2, z: cz + halfD * sd,
        sx: SHELTER_POST_THICKNESS, sy: SHELTER_HEIGHT, sz: SHELTER_POST_THICKNESS, color: FRAME_COLOR, material: "frame", axes: "world" });
    }
  }
  // bench against the back wall, on four legs
  const benchStart = out.length;
  const benchLength = SHELTER_LENGTH * 0.8;
  const inset = halfD - BENCH_DEPTH / 2 - SHELTER_GLASS_THICKNESS;
  out.push({ x: cx, y: y0 + BENCH_HEIGHT, z: cz + inset, sx: benchLength, sy: BENCH_THICKNESS, sz: BENCH_DEPTH, color: BENCH_COLOR, material: "bench" });
  const legHeight = BENCH_HEIGHT - BENCH_THICKNESS / 2;
  for (const sl of [-1, 1]) {
    for (const sd of [-1, 1]) {
      out.push({ x: cx + (benchLength / 2 - BENCH_LEG_THICKNESS) * sl, y: y0 + legHeight / 2, z: cz + inset + (BENCH_DEPTH / 2 - BENCH_LEG_THICKNESS) * sd,
        sx: BENCH_LEG_THICKNESS, sy: legHeight, sz: BENCH_LEG_THICKNESS, color: BENCH_COLOR, material: "bench", axes: "world" });
    }
  }
  o.level.push({ parts: range(benchStart, out.length), supports: range(benchStart + 1, out.length) });
}

// one column and its sign, facing along the road toward oncoming traffic
function buildColumn(o: Out, lateral: number, cargo: boolean): void {
  const y0 = PAVEMENT_THICKNESS;
  o.boxes.push({ x: 0, y: y0 + COLUMN_HEIGHT / 2, z: lateral, sx: COLUMN_THICKNESS, sy: COLUMN_HEIGHT, sz: COLUMN_THICKNESS, color: COLUMN_COLOR, material: "column", axes: "world" });
  o.boxes.push({ x: 0, y: y0 + COLUMN_HEIGHT - SIGN_HEIGHT, z: lateral, sx: SIGN_WIDTH, sy: SIGN_HEIGHT, sz: SIGN_THICKNESS,
    color: cargo ? [230, 153, 42] : SIGN_COLOR, material: "sign", axes: "sign" });
}

// the furniture, described in the side's own travel/outward frame
function buildFittings(o: Out, lateral: number, type: string): void {
  const out = o.boxes;
  const y0 = PAVEMENT_THICKNESS;
  const put = (x: number, y: number, z: number, sx: number, sy: number, sz: number, material: BusStopMaterial, color: Rgb, detail = true): void => {
    out.push({ x, y: y0 + y, z: lateral + z, sx, sy, sz, color, material, detail });
  };
  const accent: Rgb = type === "cargo" ? [230, 153, 42] : type === "canopy" ? [37, 133, 128] : [55, 113, 182];
  // kerb, tactile boarding strip and individual paving joints
  put(-5.5, -0.25, -0.85, 13, 0.5, 0.25, "pavement", [215, 211, 192]);
  put(-5.5, 0.025, -0.5, 12.6, 0.05, type === "cargo" ? 0.18 : 0.5, "sign", type === "cargo" ? accent : [226, 190, 79]);
  for (let x = -11; x < 1; x += 1) put(x, 0.012, 1.6, 0.035, 0.02, 4, "pavement", [142, 148, 146]);
  // timetable case and a white bus pictogram on both faces of the stop flag
  put(0, 2.35, 0.24, 0.16, 1.15, 0.68, "frame", FRAME_COLOR);
  put(0.09, 2.35, 0.24, 0.025, 0.98, 0.54, "sign", [239, 235, 216]);
  for (const side of [-1, 1]) {
    put(side * 0.075, 4.05, 0, 0.025, 0.46, 0.95, "sign", [239, 244, 240]);
    put(side * 0.095, 4.15, 0, 0.025, 0.16, 0.68, "sign", accent);
    for (const z of [-0.3, 0.3]) put(side * 0.095, 3.79, z, 0.025, 0.13, 0.17, "frame", FRAME_COLOR);
  }
  if (type === "shelter") {
    put(-7, 4.12, 1.5, 6.5, 0.24, 3.45, "roof", accent, false);
    // split glazing, safety bands, a backrest and slatted seat
    for (const x of [-8, -6]) put(x, 2, 3, 0.1, 4, 0.14, "frame", FRAME_COLOR);
    put(-7, 1.8, 2.91, 5.8, 0.12, 0.035, "sign", [225, 237, 229]);
    const benchStart = out.length;
    put(-7, 1.3, 2.75, 4.8, 0.65, 0.14, "bench", BENCH_COLOR);
    for (let x = -9.2; x < -4.7; x += 0.35) put(x, 0.84, 2.5, 0.025, 0.035, 0.75, "frame", FRAME_COLOR);
    o.level.push({ parts: range(benchStart, out.length), supports: [] });
  } else if (type === "canopy") {
    // a broad municipal canopy with timber soffit and a solid service wall
    put(-6.7, 4.7, 1.4, 8.8, 0.3, 4.2, "roof", accent, false);
    put(-6.7, 4.49, 1.4, 8.3, 0.12, 3.7, "bench", BENCH_COLOR);
    put(-6.7, 1.9, 3.1, 8, 3.8, 0.2, "pavement", [206, 198, 178], false);
    for (const x of [-10.5, -2.9]) put(x, 2.3, 2.8, 0.3, 4.6, 0.3, "frame", FRAME_COLOR, false);
    for (const x of [-8.5, -4.8]) {
      const benchStart = out.length;
      put(x, 0.9, 2.1, 2.6, 0.2, 0.9, "bench", BENCH_COLOR);
      put(x, 1.4, 2.5, 2.6, 0.6, 0.14, "bench", BENCH_COLOR);
      for (const dx of [-0.9, 0.9]) put(x + dx, 0.4, 2.1, 0.15, 0.8, 0.7, "frame", FRAME_COLOR);
      o.level.push({ parts: range(benchStart, out.length), supports: range(benchStart + 2, out.length) });
    }
    put(-6.7, 3.3, 2.93, 2.4, 0.7, 0.08, "sign", FRAME_COLOR);
    for (let x = -7.5; x < -5.8; x += 0.3) put(x, 3.3, 2.88, 0.18, 0.12, 0.025, "sign", [238, 189, 69]);
  } else {
    // cargo: a saved visual type for future trucks
    put(-7.1, 0.5, 1.8, 7, 1, 2.6, "pavement", [133, 140, 143], false);
    put(-7.1, 4.5, 1.9, 8.2, 0.25, 3.6, "roof", [80, 91, 99], false);
    for (const x of [-10.7, -3.5]) put(x, 2.2, 3.2, 0.3, 4.4, 0.3, "frame", accent, false);
    put(-7.1, 0.65, 0.43, 7, 0.35, 0.1, "sign", accent);
    for (let x = -10.3; x < -3.6; x += 0.55) put(x, 0.65, 0.36, 0.25, 0.35, 0.06, "frame", FRAME_COLOR);
    for (const x of [-9, -6.3]) {
      put(x, 1.1, 1.9, 1.9, 0.2, 1.6, "bench", [113, 82, 49]);
      put(x, 1.85, 1.9, 1.65, 1.3, 1.4, "bench", [184, 142, 91], false);
      for (const dx of [-0.6, 0.6]) put(x + dx, 1.85, 1.17, 0.12, 1.3, 0.07, "bench", [112, 85, 53]);
    }
  }
  // litter bin, lid, and shelter lighting
  if (type !== "cargo") {
    const binStart = out.length;
    put(-1.8, 0.65, 2.4, 0.65, 1.3, 0.65, "frame", [68, 81, 79]);
    put(-1.8, 1.35, 2.4, 0.75, 0.12, 0.75, "roof", accent);
    o.level.push({ parts: [binStart, binStart + 1], supports: [binStart] });
    put(-7, type === "canopy" ? 4.38 : 3.9, 1.4, 2.6, 0.06, 0.2, "sign", [250, 237, 190]);
  }
}

/**
 * Everything one side of a stop of `type` is built from, `lateral` studs out from
 * the road's centreline: the platform, the shelter (the glass type only), the
 * fittings, then the stop flag. An unknown type builds as the glass shelter.
 */
export function buildSide(type: string, lateral: number): SideBuild {
  const t = TYPES.includes(type) ? type : "shelter";
  const o: Out = { boxes: [], level: [] };
  buildPavement(o, lateral);
  if (t === "shelter") buildShelter(o, lateral);
  buildFittings(o, lateral, t);
  buildColumn(o, lateral, t === "cargo");
  return o;
}
