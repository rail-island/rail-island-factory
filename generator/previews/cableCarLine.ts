// The cable car line preview (docs/models/previews.md, "The cable car line"): a short
// line as the game builds it, so a cabin can be checked as it will look there -- flat
// ground, two stations of a chosen type facing each other, a pylon between them, the
// ropes the game draws for the chosen cabin (game.ropes) and the cabins running on them.
//
// The stations, the pylon and the platforms are the set module's, drawn for the cabin's
// own view (cableCarLine.ts: what the game measures of it). The cabins are parts moved
// by a `time` clip, `running`, sampled from the game's own kinematics (the webapp's
// core/rail/CableCar.ts): one cabin shuttles, two run a jig-back, more circulate round
// the wheels; a shuttling cabin waits DWELL at each end and ramps its speed; a big
// cabin stops ahead of the wheel (`cabinStop`). Each cabin hangs level, its rope datum
// on the rope, its platform side (+z) turned away from the line's centre.
//
// The game's frame: the line runs along +X from station A's head to station B's; a
// strand runs WHEEL_RADIUS each side, the outbound one on the right of +X (-Z).
//
// No node: imports: the JS model bundles this.

import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "../design.ts";
import { MeshBuilder, type MaterialSpec } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";
import * as station from "../sets/cableCarStation.ts";
import { cabinLine, cabinView, type CabinLine } from "../cableCarLine.ts";
import { CABLE_CABINS } from "../cableCabins.ts";
import { WORLD_CABINS } from "../worldCabins.ts";
import { LEGACY_VEHICLES } from "../legacyVehicles.ts";
import { LINE_COUNTS, LINE_STATIONS, lineCabinValue, lineStationValue } from "../cableCarLineIds.ts";
import { Sketch, type Rgb } from "./sketch.ts";

/** Every cable car cabin the catalog has, by the value the preview names it with. */
const CABINS: ReadonlyArray<{ value: string; design: ProceduralDesign }> = [...CABLE_CABINS, ...LEGACY_VEHICLES, ...WORLD_CABINS]
  .filter((d) => d.game?.ropeFrac !== undefined)
  .map((design) => ({ value: lineCabinValue(design.id), design }));

/** The cabins' names, at most 16 letters as a value title must be (the full title is on the cabin's page). */
const SHORT: Record<string, string> = {
  cablecarCabin: "Tramway car", cabinClassic: "Classic cabin", gondolaCabin: "Small gondola", chairliftChair: "Chairlift chair",
  doppelmayrOmega: "Omega IV", pomaFunitel: "Funitel", peak2Peak: "Peak 2 Peak", stanserhornCabrio: "Cabrio",
  titlisRotair: "Rotair", vanoiseExpress: "Vanoise Express", rooseveltIslandTram: "Roosevelt Island", sugarloafBondinho: "Sugarloaf",
  medellinMetrocable: "Metrocable", ngongPingCrystal: "Ngong Ping 360",
};


export const LINE_PARAMS: ParamSpec[] = [
  { name: "cabin", title: "Cabin", default: "doppelmayrOmega", preview: true, values: CABINS.map((c) => ({ value: c.value, title: SHORT[c.value] ?? c.design.title })) },
  { name: "station", title: "Station", default: "openGantry", preview: true, values: LINE_STATIONS.map((t) => ({ value: lineStationValue(t.type), title: t.title })) },
  {
    name: "cabins", title: "Cabins", default: "6", preview: true,
    values: LINE_COUNTS.map((c) => ({ ...c })),
  },
];

// --- the game's line (the webapp's core/rail/CableCar.ts) ---

/** The distance between the two rope heads, studs: two spans of the shortest the game allows. */
const LINE = 120;
const SAG_FRAC = 0.02;
const MAX_SAG = 6;
const ROPE_STEP = 12;
const DWELL = 10;
const LEG_RAMP = 0.25;
const LEG_PEAK = 1 / (1 - LEG_RAMP);
const ROPE_THICKNESS = 0.35;
const R = station.WHEEL_RADIUS;
const TURN_ARC = Math.PI * R;
/** The ground's top: the stations' and the pylon's level. */
const GROUND = 1;
/** Samples of the clip per second. */
const RATE = 8;

/** km/h to studs a second (the game's VehiclePhysics). */
const kmhToStuds = (kmh: number): number => (kmh * 30) / 80;

function legDistanceFrac(u: number): number {
  const t = Math.max(0, Math.min(1, u));
  if (t < LEG_RAMP) return (LEG_PEAK * t * t) / (2 * LEG_RAMP);
  if (t <= 1 - LEG_RAMP) return LEG_PEAK * (LEG_RAMP / 2 + (t - LEG_RAMP));
  const back = 1 - t;
  return 1 - (LEG_PEAK * back * back) / (2 * LEG_RAMP);
}

const mod = (a: number, n: number): number => ((a % n) + n) % n;

type Pose = { d: number; strand: 1 | -1; turn: { end: "A" | "B"; t: number } | null };

/** Where every cabin is at `clock`, as the game's cabinPosesAt (with the stop ahead of the wheel). */
function posesAt(clock: number, length: number, speed: number, count: number, stop: number): Pose[] {
  if (count >= 3) {
    const loop = 2 * length + 2 * TURN_ARC;
    return Array.from({ length: count }, (_, i) => {
      const u = mod(clock * speed + (i * loop) / count, loop);
      if (u < length) return { d: u, strand: 1, turn: null };
      if (u < length + TURN_ARC) return { d: length, strand: 1, turn: { end: "B", t: (u - length) / TURN_ARC } };
      if (u < 2 * length + TURN_ARC) return { d: 2 * length + TURN_ARC - u, strand: -1, turn: null };
      return { d: 0, strand: -1, turn: { end: "A", t: (u - 2 * length - TURN_ARC) / TURN_ARC } };
    });
  }
  const leg = length - 2 * stop;
  const travel = leg / speed;
  const period = 2 * (travel + DWELL);
  return Array.from({ length: count }, (_, i) => {
    const strand: 1 | -1 = i === 0 ? 1 : -1;
    const p = mod(clock + (i * period) / count, period);
    let f: number;
    if (p < DWELL) f = 0;
    else if (p < DWELL + travel) f = legDistanceFrac((p - DWELL) / travel);
    else if (p < 2 * DWELL + travel) f = 1;
    else f = 1 - legDistanceFrac((p - 2 * DWELL - travel) / travel);
    return { d: stop + f * leg, strand, turn: null };
  });
}

/** A path and its cumulative lengths. */
type Path = { pts: Vec3[]; cum: number[] };

function pathOf(pts: Vec3[]): Path {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1], pts[i]![2] - pts[i - 1]![2]));
  return { pts, cum };
}

function along(p: Path, d: number): Vec3 {
  const n = p.pts.length;
  if (d <= 0) return p.pts[0]!;
  if (d >= p.cum[n - 1]!) return p.pts[n - 1]!;
  let i = 1;
  while (p.cum[i]! < d) i++;
  const t = (d - p.cum[i - 1]!) / (p.cum[i]! - p.cum[i - 1]!);
  const a = p.pts[i - 1]!, b = p.pts[i]!;
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** The rope's centre line through its supports, each span sagging on a parabola. */
function centreLine(supports: Vec3[]): Vec3[] {
  const out: Vec3[] = [supports[0]!];
  for (let k = 0; k + 1 < supports.length; k++) {
    const a = supports[k]!, b = supports[k + 1]!;
    const span = Math.hypot(b[0] - a[0], b[2] - a[2]);
    const sag = Math.min(MAX_SAG, SAG_FRAC * span);
    const n = Math.max(1, Math.ceil(span / ROPE_STEP));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 4 * sag * t * (1 - t), a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out;
}

/** The scene's geometry, the game's frame: heads, strands, the pylon. */
interface Layout {
  type: string;
  line: CabinLine;
  count: number;
  stop: number;
  headY: number;
  headZ: number;
  headA: Vec3;
  headB: Vec3;
  centre: Vec3[];
  speed: number;
}

function layout(values: ParamValues | undefined): Layout {
  const v = resolveParams(LINE_PARAMS, values);
  const design = CABINS.find((c) => c.value === v.cabin)!.design;
  const line = cabinLine(design);
  const type = LINE_STATIONS.find((t) => lineStationValue(t.type) === v.station)!.type;
  const meta = station.TYPE_META[type]!;
  // a jig-back cabin runs one or two to a line, as the game's Cabins tab offers
  const asked = Number(v.cabins);
  const count = line.ropeway === "jigback" ? Math.min(2, asked) : asked;
  const headY = GROUND + meta.ropeHeadY;
  const headA: Vec3 = [-LINE / 2, headY, 0], headB: Vec3 = [LINE / 2, headY, 0];
  const view = cabinView(line, count >= 3);
  return {
    type, line, count, stop: station.cabinStop(view), headY, headZ: station.headOverhangFor(meta.d),
    headA, headB, centre: centreLine([headA, [0, headY, 0], headB]), speed: kmhToStuds(design.game?.maxspeed ?? 22),
  };
}

/** A strand: the centre line moved `off` studs to the right of +X (-Z), sharing its sag. */
const strand = (L: Layout, off: number, dy = 0): Path => pathOf(L.centre.map(([x, y, z]) => [x, y + dy, z - off] as Vec3));

/** The half circle round a head's wheel, radius `r`, from the outbound side (-Z) to the inbound one, bulging out past B or back past A. */
function arc(head: Vec3, end: "A" | "B", r: number, dy = 0, steps = 16): Vec3[] {
  const s = end === "B" ? 1 : -1;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (Math.PI * i) / steps;
    return [head[0] + s * Math.sin(a) * r, head[1] + dy, head[2] + s * -Math.cos(a) * r] as Vec3;
  });
}

/** A cabin's rope point and heading (the travel direction in plan) for a pose. */
function placeOf(L: Layout, p: Pose, paths: { out: Path; back: Path }): { at: Vec3; fwd: [number, number] } {
  if (p.turn) {
    const head = p.turn.end === "A" ? L.headA : L.headB;
    const s = p.turn.end === "B" ? 1 : -1;
    const a = Math.PI * p.turn.t;
    // as arc(): position on the circle, the tangent its derivative
    return { at: [head[0] + s * Math.sin(a) * R, head[1], head[2] - s * Math.cos(a) * R], fwd: [s * Math.cos(a), s * Math.sin(a)] };
  }
  const path = p.strand === 1 ? paths.out : paths.back;
  return { at: along(path, p.d), fwd: p.strand === 1 ? [1, 0] : [-1, 0] };
}

/** The yaw that hangs a cabin level with its +X along -travel and its platform side (+Z) to the right of travel: away from the line's centre. */
const yawOf = (fwd: [number, number]): number => Math.atan2(fwd[0], fwd[1]) + Math.PI / 2;

// --- drawing ---

const GRASS: Rgb = [112, 140, 78];
const PAD: Rgb = [150, 146, 138];
const ROPE: Rgb = [52, 50, 48];

/** One station of the line: the set module's boxes and sectors, turned so its +Z faces the other head. */
function drawStation(s: Sketch, L: Layout, end: "A" | "B", lod: boolean): void {
  const meta = station.TYPE_META[L.type]!;
  const model = station.buildStation(L.type, cabinView(L.line, L.count >= 3));
  const yaw = end === "A" ? Math.PI / 2 : -Math.PI / 2;
  const ox = end === "A" ? -LINE / 2 - L.headZ : LINE / 2 + L.headZ;
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  const to = (x: number, y: number, z: number): Vec3 => [ox + x * c + z * sn, GROUND + y, -x * sn + z * c];
  const shown = (level: station.StationLevel): boolean => (lod ? level !== "full" : level !== "low");
  const cut = -GROUND;
  s.box(s.mat("deck", PAD, "stop-concrete"), { cx: ox, cy: GROUND / 2 + 0.03, cz: 0, sx: meta.w, sy: GROUND + 0.06, sz: meta.d, yaw });
  for (const b of model.boxes) {
    if (!shown(b.level)) continue;
    const sunk = !b.rotX && !b.rotZ && b.cy - b.sy / 2 < cut;
    if (sunk && b.cy + b.sy / 2 <= cut) continue;
    const y0 = sunk ? cut : b.cy - b.sy / 2, y1 = b.cy + b.sy / 2;
    const [cx, cy, cz] = to(b.cx, (y0 + y1) / 2, b.cz);
    s.box(s.mat(b.material, b.color), { ...b, cx, cy, cz, sy: y1 - y0, yaw });
  }
  for (const sec of model.sectors) {
    if (!shown(sec.level)) continue;
    const mid = Math.atan2(sec.apexX, -sec.apexZ), r = (sec.rIn + sec.rOut) / 2, w = sec.rOut - sec.rIn;
    const steps = Math.max(4, Math.ceil((2 * sec.halfAngle) / 0.15));
    const path = Array.from({ length: steps + 1 }, (_, i) => {
      const a = mid - sec.halfAngle + (2 * sec.halfAngle * i) / steps;
      return to(sec.cx + Math.sin(a) * r, sec.cy, sec.cz - Math.cos(a) * r);
    });
    const y0 = GROUND + sec.cy - sec.thick / 2, y1 = GROUND + sec.cy + sec.thick / 2;
    s.sweep(s.mat(sec.material, sec.color), path, [[-w / 2, y0], [w / 2, y0], [w / 2, y1], [-w / 2, y1]], true);
  }
}

/** The pylon at mid-line, its rope at the heads' height, for the cabin's ropes. */
function drawPylon(s: Sketch, L: Layout, lod: boolean): void {
  station.buildPylon(L.headY - GROUND, L.line.ropes).forEach((b, i) => {
    if (lod && i >= 3) return;
    const y0 = Math.max(0, GROUND + b.y - b.sy / 2), y1 = GROUND + b.y + b.sy / 2;
    // the pylon's x runs across the line (the game's Z), its z along it
    s.box(s.mat(b.material, b.color), { cx: b.z, cy: (y0 + y1) / 2, cz: -b.x, sx: b.sz, sy: y1 - y0, sz: b.sx });
  });
}

/** The ropes the game draws for the cabin: each rope of each strand, a haul rope round both wheels. */
function drawRopes(s: Sketch, L: Layout, lod: boolean): void {
  const mat = s.mat("cable", ROPE);
  const run = (pts: readonly Vec3[]): void => {
    const p = lod ? [pts[0]!, pts[Math.floor(pts.length / 2)]!, pts[pts.length - 1]!] : pts;
    for (let i = 0; i + 1 < p.length; i++) s.bar(mat, p[i]!, p[i + 1]!, ROPE_THICKNESS);
  };
  for (const r of L.line.ropes) {
    // the platform side (+z) faces out on both strands: out at -(R + z), back at +(R + z)
    run(strand(L, R + r.z, r.dy).pts);
    run(strand(L, -(R + r.z), r.dy).pts);
    if (r.kind === "haul" && !lod) {
      run(arc(L.headB, "B", R + r.z, r.dy));
      run(arc(L.headA, "A", R + r.z, r.dy));
    }
  }
}

function sceneSketch(L: Layout, lod: boolean): Sketch {
  const s = new Sketch();
  const meta = station.TYPE_META[L.type]!;
  const halfX = LINE / 2 + L.headZ + meta.d / 2 + 6;
  const halfZ = Math.max(meta.w / 2, R + L.line.halfWidth + 10, station.armPlan(cabinView(L.line, false)).xOut + 4) + 6;
  s.box(s.mat("ground", GRASS), { cx: 0, cy: GROUND / 2, cz: 0, sx: 2 * halfX, sy: GROUND, sz: 2 * halfZ });
  drawStation(s, L, "A", lod);
  drawStation(s, L, "B", lod);
  drawPylon(s, L, lod);
  drawRopes(s, L, lod);
  return s;
}

type Groups = Map<string, { pos: number[] }>;

/** The triangles of a builder, per material. */
const groupsOf = (m: MeshBuilder): Groups => (m as unknown as { groups: Groups }).groups;
const paletteOf = (m: MeshBuilder): Record<string, MaterialSpec> => (m as unknown as { palette: Record<string, MaterialSpec> }).palette;

/** A cabin model's point in its hanging frame: recentred and scaled as the game does, the rope datum at the origin. */
function hangFrame(line: CabinLine, design: ProceduralDesign): (x: number, y: number, z: number) => Vec3 {
  const b = line.box, k = line.k;
  const yaw = ((design.catalog?.yaw ?? 0) * Math.PI) / 180;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  return (x, y, z) => {
    const rx = x * c + z * s, rz = -x * s + z * c;
    return [(rx - cx) * k, (y - b.y0) * k - line.drop, (rz - cz) * k];
  };
}

function lineModel(values: ParamValues | undefined): MeshBuilder {
  const L = layout(values);
  const v = resolveParams(LINE_PARAMS, values);
  const design = CABINS.find((c) => c.value === v.cabin)!.design;
  const scene = sceneSketch(L, false).build("line");
  const cabin = design.build();
  const palette: Record<string, MaterialSpec> = { ...paletteOf(scene) };
  for (const [name, spec] of Object.entries(paletteOf(cabin))) palette[`cabin:${name}`] = spec;
  const m = new MeshBuilder(palette);
  m.scope("line", () => {
    for (const [mat, g] of groupsOf(scene)) {
      for (let i = 0; i + 8 < g.pos.length; i += 9) m.tri(mat, [g.pos[i]!, g.pos[i + 1]!, g.pos[i + 2]!], [g.pos[i + 3]!, g.pos[i + 4]!, g.pos[i + 5]!], [g.pos[i + 6]!, g.pos[i + 7]!, g.pos[i + 8]!]);
    }
  });
  // the cabins' motion over one period of the line, sampled
  const paths = { out: strand(L, R), back: strand(L, -R) };
  const length = paths.out.cum[paths.out.cum.length - 1]!;
  const period = L.count >= 3 ? (2 * length + 2 * TURN_ARC) / L.speed : 2 * ((length - 2 * L.stop) / L.speed + DWELL);
  const n = Math.ceil(period * RATE);
  const times = Array.from({ length: n + 1 }, (_, i) => Math.round(((period * i) / n) * 1e4) / 1e4);
  const places = times.map((t) => posesAt(t, length, L.speed, L.count, L.stop).map((p) => placeOf(L, p, paths)));
  const frame = hangFrame(L.line, design);
  const tracks: Array<{ node: string; path: "translation" | "rotation"; values: number[] }> = [];
  for (let c = 0; c < L.count; c++) {
    const rest = places[0]![c]!;
    const yaw0 = yawOf(rest.fwd);
    const cy = Math.cos(yaw0), sy = Math.sin(yaw0);
    const pivot: Vec3 = [round(rest.at[0]), round(rest.at[1]), round(rest.at[2])];
    const name = `cabin${c}`;
    m.spin(name, pivot, () => {
      for (const [mat, g] of groupsOf(cabin)) {
        const pts: Vec3[] = [];
        for (let i = 0; i + 2 < g.pos.length; i += 3) {
          const [x, y, z] = frame(g.pos[i]!, g.pos[i + 1]!, g.pos[i + 2]!);
          pts.push([pivot[0] + x * cy + z * sy, pivot[1] + y, pivot[2] - x * sy + z * cy]);
        }
        for (let i = 0; i + 2 < pts.length; i += 3) m.tri(`cabin:${mat}`, pts[i]!, pts[i + 1]!, pts[i + 2]!);
      }
    });
    const tv: number[] = [], rv: number[] = [];
    let last: [number, number] = [0, 1];
    for (const pl of places) {
      const p = pl[c]!;
      tv.push(round(p.at[0]), round(p.at[1]), round(p.at[2]));
      // the turn from the rest heading about +Y, its sign kept continuous for the slerp
      const h = (yawOf(p.fwd) - yaw0) / 2;
      let q: [number, number] = [Math.sin(h), Math.cos(h)];
      if (q[0] * last[0] + q[1] * last[1] < 0) q = [-q[0], -q[1]];
      last = q;
      rv.push(0, round(q[0], 6), 0, round(q[1], 6));
    }
    tracks.push({ node: name, path: "translation", values: tv }, { node: name, path: "rotation", values: rv });
  }
  m.animate({ name: "running", times, tracks, drive: { drive: "time" } });
  return m;
}

const round = (v: number, d = 4): number => Math.round(v * 10 ** d) / 10 ** d + 0;

/** The distant level: the stations' and the pylon's low levels, the ropes span by span, each cabin as its box where it rests. */
function lineLod(values: ParamValues | undefined): MeshBuilder {
  const L = layout(values);
  const s = sceneSketch(L, true);
  const paths = { out: strand(L, R), back: strand(L, -R) };
  const length = paths.out.cum[paths.out.cum.length - 1]!;
  const b = L.line.box, k = L.line.k;
  const hl = ((b.x1 - b.x0) / 2) * k, hw = ((b.z1 - b.z0) / 2) * k, h = (b.y1 - b.y0) * k;
  const mat = s.mat("steel", [196, 60, 48]);
  for (const p of posesAt(0, length, L.speed, L.count, L.stop)) {
    const { at, fwd } = placeOf(L, p, paths);
    s.box(mat, { cx: at[0], cy: at[1] - L.line.drop + h / 2, cz: at[2], sx: 2 * hl, sy: h, sz: 2 * hw, yaw: yawOf(fwd) });
  }
  return s.build("line");
}

export function cableCarLinePreview(values?: ParamValues): MeshBuilder { return lineModel(values); }
export function cableCarLinePreviewLod(values?: ParamValues): MeshBuilder { return lineLod(values); }
