// The cable car cabin kit (docs/models/cabin-kit.md): a whole cabin - its body,
// glazing, doors, roof, open top deck and the hanger up to the rope - built from
// one typed `CabinSpec`, and its low level of detail from the same spec.
//
// Axes as the small gondola's (cableCabins.ts): metres, the rope along x
// (the game's yaw 0), the platform side +z, y up, the cabin's underside at y 0.
// The body is a lofted shell over rounded-rectangle plan rings, one band per
// pair of stations in the lower one's material. The hanger is one of four kinds:
//
// - `grip`     a detachable gondola's arm and grip on one haul rope at z 0;
// - `funitel`  a frame over the roof with two grips on each of two haul ropes at z +-gap/2;
// - `carriage` an aerial tramway's, a 3S or bicable cabin's: a hanger arm (and a
//              yoke on the roof) up to a carriage whose sheaves ride two track ropes
//              at z +-track, the haul rope clamped under it at z 0;
// - `side`     two hangers beside the cabin (an open-top cabin's) up to two carriages,
//              one on each track rope at z +-track.
//
// No rope is drawn on a cabin: the game draws every rope (`cabinRopes(spec)` says
// where they run). `cabinDatums(spec)` gives the rope and sill heights and the model's height
// range analytically, so the design's ropeFrac and boardFrac are stated from the
// spec and tested against the built model (test/cabinKit.test.ts).

import { MeshBuilder, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block } from "./vehicleParts.ts";
import { bar, disc, roundRect, shell, type Station } from "./cableCabins.ts";
import { cabinLod, lodBar, lodPlanRect } from "./lodAir.ts";
import { LOD_GLASS, lodBlock } from "./lodKit.ts";
import type { LodBand } from "./lodKit.ts";

/** The materials every cabin may use; a spec's palette adds or overrides colours. */
export const CABIN_KIT_PALETTE: Record<string, MaterialSpec> = {
  glass: { color: "#1b2429", metallic: 0.3, roughness: 0.06, glass: true },
  frame: { color: "#24272b", metallic: 0.25, roughness: 0.5 },
  steel: { color: "#b4b9bd", metallic: 0.38, roughness: 0.42 },
  dark: { color: "#3c4046", metallic: 0.35, roughness: 0.5 },
  rubber: { color: "#2a2b2d", metallic: 0.02, roughness: 0.9 },
  deck: { color: "#8b8f93", metallic: 0.1, roughness: 0.8 },
  lamp: { color: "#f2eccd", roughness: 0.3 },
};

/** The materials the LOD paints as its one glass. */
const GLASSY = new Set(["glass"]);

export type CabinHanger =
  | { kind: "grip"; rope: number }
  | { kind: "funitel"; rope: number; gap: number; gripX: number }
  | { kind: "carriage"; rope: number; /** half the track ropes' spacing; 0 for one track rope (a bicable) */ track: number; length: number; sheaves: number; arm: { w: number; d: number; top: number }; yoke?: { hx: number; hz: number; h: number } }
  | { kind: "side"; rope: number; track: number; length: number; sheaves: number; attach: number };

export interface CabinSpec {
  /** Half length along the rope, half width across it, and the plan's corner radius at the outer line. */
  hx: number;
  hz: number;
  corner: number;
  /** The shell's stations, bottom first: height, inset from the outer line, material of the band above. */
  stations: Station[];
  /** The door sill: the boarding platform's level. */
  sill: number;
  /** The window band the posts stand in (each post follows the skin from y0 to y1). */
  glass: { y0: number; y1: number };
  /** Window posts: x on the long (+-z) sides, z on the ends (+-x). */
  posts: { xs: readonly number[]; zs: readonly number[]; mat: string; w?: number };
  /** Doors on the platform side (+z) and, if `both`, on -z too: x0..x1 from the sill to y1. */
  doors: { x: ReadonlyArray<readonly [number, number]>; y1: number; mat: string; both?: boolean };
  /** Roof equipment: x0, x1, y1, z0, z1, material (each stands on the roof). */
  roofBoxes?: ReadonlyArray<readonly [number, number, number, number, number, string]>;
  /** An open top deck on the roof: its railing height and post pitch. */
  deck?: { rail: number; pitch: number; mat: string };
  hanger: CabinHanger;
  /** Materials the spec adds (its colours). */
  palette: Record<string, MaterialSpec>;
}

/** The top of the shell. */
export const roofOf = (s: CabinSpec): number => s.stations[s.stations.length - 1]![0];

/** The running gear's sizes: a gondola grip's wheels and a carriage's sheaves. */
const SHEAVE_R = 0.24;
const GRIP_WHEEL_R = 0.145;

/** How far a carriage's haul rope runs under its track ropes, metres. */
export const HAUL_GAP = 0.3;

/**
 * One rope a cabin hangs from or is hauled by, as the game draws it
 * (docs/models/world-cabins.md, "Ropes"): `z` across the rope (the cabin's +z, the
 * platform side) and `dy` up from the rope datum, metres. A haul rope goes round the
 * stations' bull wheels; a track rope is fixed and ends at each station.
 */
export interface CabinRope { kind: "haul" | "track"; z: number; dy: number }

/** The ropes a spec's cabin hangs from: none of them is drawn on the model, the game draws them. */
export function cabinRopes(s: CabinSpec): CabinRope[] {
  const h = s.hanger;
  switch (h.kind) {
    case "grip": return [{ kind: "haul", z: 0, dy: 0 }];
    case "funitel": return [{ kind: "haul", z: -h.gap / 2, dy: 0 }, { kind: "haul", z: h.gap / 2, dy: 0 }];
    case "carriage": return [
      ...(h.track > 0 ? [{ kind: "track" as const, z: -h.track, dy: 0 }, { kind: "track" as const, z: h.track, dy: 0 }] : [{ kind: "track" as const, z: 0, dy: 0 }]),
      { kind: "haul", z: 0, dy: -HAUL_GAP },
    ];
    case "side": return [{ kind: "track", z: -h.track, dy: 0 }, { kind: "track", z: h.track, dy: 0 }];
  }
}

/** The rope, sill and height range a spec's cabin is built to (y0 is always 0). */
export function cabinDatums(s: CabinSpec): { rope: number; sill: number; y0: number; y1: number; ropeFrac: number; boardFrac: number } {
  const h = s.hanger;
  const rail = s.deck ? roofOf(s) + s.deck.rail + 0.03 : roofOf(s);
  // the highest point: a grip's running wheels, a carriage's sheave rims
  const top = h.kind === "grip" || h.kind === "funitel" ? h.rope + 0.51 + GRIP_WHEEL_R : h.rope + 0.035 + 2 * SHEAVE_R + 0.03;
  const y1 = Math.max(top, rail);
  const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;
  return { rope: h.rope, sill: s.sill, y0: 0, y1, ropeFrac: r4(h.rope / y1), boardFrac: r4(s.sill / y1) };
}

/** The shell's outer surface at height y: its inset from the outer line (interpolated between stations). */
function insetAt(s: CabinSpec, y: number): number {
  const st = s.stations;
  for (let i = 0; i + 1 < st.length; i++) {
    const [y0, d0] = st[i]!;
    const [y1, d1] = st[i + 1]!;
    if (y >= y0 && y <= y1 && y1 > y0) return d0 + ((d1 - d0) * (y - y0)) / (y1 - y0);
  }
  return st[st.length - 1]![1];
}

const ring = (s: CabinSpec) => (d: number): Ring => roundRect(s.hx - d, s.hz - d, Math.max(s.corner - d, 0.02), 6);

function body(m: MeshBuilder, s: CabinSpec): void {
  m.scope("shell", () => shell(m, s.stations, ring(s)));
  const g = s.glass;
  const r = (s.posts.w ?? 0.09) / 2;
  // a point on the long side `side` (+-z) at x, y, or on the end `side` (+-x) at z, y; on the skin
  const onSide = (side: number, x: number, y: number): Vec3 => [x, y, side * (s.hz - insetAt(s, y))];
  const onEnd = (side: number, z: number, y: number): Vec3 => [side * (s.hx - insetAt(s, y)), y, z];
  m.scope("window posts", () => {
    // each post a bar laid on the glazing, following its lean, half proud of it
    for (const side of [-1, 1]) {
      for (const x of s.posts.xs) bar(m, s.posts.mat, onSide(side, x, g.y0), onSide(side, x, g.y1), r);
      for (const z of s.posts.zs) bar(m, s.posts.mat, onEnd(side, z, g.y0), onEnd(side, z, g.y1), r);
    }
  });
  m.scope("doors", () => {
    const y0 = s.sill + 0.02;
    const y1 = s.doors.y1;
    for (const side of s.doors.both ? [1, -1] : [1]) {
      for (const [x0, x1] of s.doors.x) {
        m.scope(`door ${x0.toFixed(2)}`, () => {
          // the frame: two jambs and the header, and the leaves' meeting joint
          bar(m, s.doors.mat, onSide(side, x0, y0), onSide(side, x0, y1), 0.04);
          bar(m, s.doors.mat, onSide(side, x1, y0), onSide(side, x1, y1), 0.04);
          bar(m, s.doors.mat, onSide(side, x0 - 0.03, y1), onSide(side, x1 + 0.03, y1), 0.04);
          bar(m, s.doors.mat, onSide(side, (x0 + x1) / 2, y0), onSide(side, (x0 + x1) / 2, y1 - 0.04), 0.018);
          // the sill plate passengers step over
          const z = side * (s.hz - insetAt(s, s.sill));
          block(m, "steel", x0, x1, s.sill - 0.04, s.sill, Math.min(z, z + side * 0.06), Math.max(z, z + side * 0.06));
        });
      }
    }
  });
}

function roof(m: MeshBuilder, s: CabinSpec): void {
  const y0 = roofOf(s) - 0.02;
  if (s.roofBoxes) m.scope("equipment", () => {
    for (const [x0, x1, y1, z0, z1, mat] of s.roofBoxes!) block(m, mat, x0, x1, y0, y1, z0, z1);
  });
  if (s.deck) m.scope("top deck", () => {
    const d = s.deck!;
    const top = roofOf(s);
    const rx = s.hx - insetAt(s, top) - 0.12;
    const rz = s.hz - insetAt(s, top) - 0.12;
    const yr = top + d.rail;
    // posts round the edge, a top rail and a mid rail on every side
    const nx = Math.max(1, Math.round((2 * rx) / d.pitch));
    const nz = Math.max(1, Math.round((2 * rz) / d.pitch));
    const pts: Array<[number, number]> = [];
    for (let i = 0; i <= nx; i++) pts.push([-rx + (2 * rx * i) / nx, -rz], [-rx + (2 * rx * i) / nx, rz]);
    for (let i = 1; i < nz; i++) pts.push([-rx, -rz + (2 * rz * i) / nz], [rx, -rz + (2 * rz * i) / nz]);
    for (const [x, z] of pts) bar(m, d.mat, [x, top - 0.02, z], [x, yr, z], 0.03, 6);
    for (const y of [yr, top + d.rail * 0.5]) {
      const r = y === yr ? 0.035 : 0.022;
      bar(m, d.mat, [-rx - 0.03, y, -rz], [rx + 0.03, y, -rz], r, 6);
      bar(m, d.mat, [-rx - 0.03, y, rz], [rx + 0.03, y, rz], r, 6);
      bar(m, d.mat, [-rx, y, -rz - 0.03], [-rx, y, rz + 0.03], r, 6);
      bar(m, d.mat, [rx, y, -rz - 0.03], [rx, y, rz + 0.03], r, 6);
    }
  });
}

/** A detachable grip on a haul rope along x at (y rope, z zc): body, jaws, spring box, carriage and running wheels. */
function grip(m: MeshBuilder, x: number, rope: number, zc: number): void {
  m.scope("body", () => block(m, "frame", x - 0.46, x + 0.46, rope - 0.24, rope - 0.08, zc - 0.13, zc + 0.13));
  m.scope("jaws", () => {
    for (const s of [-1, 1]) disc(m, "steel", "x", zc, rope, 0.085, x + (s > 0 ? 0.18 : -0.42), x + (s > 0 ? 0.42 : -0.18), 10);
  });
  m.scope("spring box", () => block(m, "steel", x - 0.26, x + 0.26, rope - 0.16, rope + 0.3, zc + 0.12, zc + 0.24));
  m.scope("carriage", () => block(m, "steel", x - 0.52, x + 0.52, rope + 0.28, rope + 0.36, zc - 0.04, zc + 0.3));
  m.scope("running wheels", () => {
    for (const dx of [-0.33, 0.33]) {
      disc(m, "frame", "z", x + dx, rope + 0.51, GRIP_WHEEL_R, zc - 0.02, zc + 0.1, 14);
      disc(m, "steel", "z", x + dx, rope + 0.51, 0.05, zc + 0.1, zc + 0.16, 8);
    }
  });
}

/** A carriage on a track rope along x at (y rope, z zc): beam, sheaves riding on the rope, and the rope's piece. */
function carriage(m: MeshBuilder, rope: number, zc: number, length: number, sheaves: number): void {
  const yc = rope + 0.035 + SHEAVE_R; // the sheaves' axle: their tread on the rope
  const sgn = zc > 0 ? 1 : -1; // the beam on the sheaves' inner side
  m.scope("beam", () => block(m, "dark", -length / 2, length / 2, yc - 0.1, yc + 0.04, Math.min(zc - sgn * 0.17, zc - sgn * 0.1), Math.max(zc - sgn * 0.17, zc - sgn * 0.1)));
  for (let i = 0; i < sheaves; i++) {
    const x = -length / 2 + 0.3 + ((length - 0.6) * i) / Math.max(1, sheaves - 1);
    m.scope(`sheave ${i}`, () => {
      disc(m, "dark", "z", x, yc, SHEAVE_R, zc - 0.06, zc + 0.06, 16);
      disc(m, "steel", "z", x, yc, SHEAVE_R + 0.03, zc - 0.03, zc + 0.03, 20);
      disc(m, "steel", "z", x, yc, 0.05, zc - 0.1, zc - 0.06, 8);
    });
  }
}

function hanger(m: MeshBuilder, s: CabinSpec): void {
  const h = s.hanger;
  const top = roofOf(s) - 0.02;
  switch (h.kind) {
    case "grip": {
      m.scope("plate", () => block(m, "steel", -0.24, 0.24, top, top + 0.08, -0.24, 0.24));
      m.scope("arm", () => block(m, "steel", -0.09, 0.09, top + 0.06, h.rope - 0.22, -0.09, 0.09));
      m.scope("collar", () => block(m, "frame", -0.14, 0.14, top + 0.12, top + 0.26, -0.14, 0.14));
      m.scope("grip", () => grip(m, 0, h.rope, 0));
      break;
    }
    case "funitel": {
      const yf = top + 0.35;
      m.scope("frame", () => {
        for (const x of [-h.gripX, h.gripX]) {
          block(m, "steel", x - 0.08, x + 0.08, top, yf + 0.12, -0.08, 0.08);
          block(m, "steel", x - 0.08, x + 0.08, yf, yf + 0.12, -h.gap / 2, h.gap / 2);
          for (const zs of [-1, 1]) block(m, "steel", x - 0.08, x + 0.08, yf, h.rope - 0.22, zs * h.gap / 2 - 0.08, zs * h.gap / 2 + 0.08);
        }
        block(m, "steel", -h.gripX, h.gripX, yf, yf + 0.1, -0.06, 0.06);
      });
      for (const zs of [-1, 1]) m.scope(zs > 0 ? "right grips" : "left grips", () => {
        for (const x of [-h.gripX, h.gripX]) grip(m, x, h.rope, zs * h.gap / 2);
      });
      break;
    }
    case "carriage": {
      if (h.yoke) m.scope("yoke", () => block(m, "steel", -h.yoke!.hx, h.yoke!.hx, top, top + h.yoke!.h, -h.yoke!.hz, h.yoke!.hz));
      const y0 = top + (h.yoke?.h ?? 0) - 0.02;
      const yb = h.rope + 0.035 + SHEAVE_R - 0.1; // the carriage beams' underside
      m.scope("arm", () => {
        // a plated arm tapering to its head under the carriage
        const a = h.arm;
        m.loft("steel", roundRect(a.w / 2, a.d / 2, 0.06, 2), y0, roundRect(a.top / 2, a.d / 2 * 0.8, 0.05, 2), h.rope - 0.45, true);
        m.cap("steel", roundRect(a.w / 2, a.d / 2, 0.06, 2), y0, false);
      });
      m.scope("head", () => block(m, "dark", -h.length / 2 + 0.2, h.length / 2 - 0.2, h.rope - 0.47, yb - 0.02, -Math.max(h.track, 0.3) + 0.05, Math.max(h.track, 0.3) - 0.05));
      m.scope("haul rope clamp", () => block(m, "dark", -0.3, 0.3, h.rope - 0.4, h.rope - 0.2, -0.12, 0.12));
      for (const zs of h.track > 0 ? [-1, 1] : [1]) m.scope(zs > 0 ? "right carriage" : "left carriage", () => {
        block(m, "dark", -h.length / 2 + 0.2, h.length / 2 - 0.2, yb - 0.02, yb + 0.06, zs * h.track - (h.track > 0 ? zs : -1) * 0.25 - 0.06, zs * h.track - (h.track > 0 ? zs : -1) * 0.25 + 0.06);
        carriage(m, h.rope, zs * h.track, h.length, h.sheaves);
      });
      break;
    }
    case "side": {
      for (const zs of [-1, 1]) m.scope(zs > 0 ? "right hanger" : "left hanger", () => {
        const zw = zs * (s.hz - insetAt(s, h.attach));
        const zt = zs * h.track;
        const yb = h.rope + 0.035 + SHEAVE_R - 0.1;
        // a bracket on the cabin's side, a post up beside it to the carriage
        block(m, "steel", -0.6, 0.6, h.attach - 0.15, h.attach + 0.15, Math.min(zw - zs * 0.02, zt), Math.max(zw - zs * 0.02, zt));
        block(m, "steel", -0.12, 0.12, h.attach, yb, zt - 0.12, zt + 0.12);
        block(m, "dark", -h.length / 2 + 0.2, h.length / 2 - 0.2, yb - 0.08, yb + 0.06, zt - zs * 0.16 - 0.06, zt - zs * 0.16 + 0.06);
        carriage(m, h.rope, zt, h.length, h.sheaves);
      });
      break;
    }
  }
}

/** Builds a cabin from its spec. */
export function buildCabin(s: CabinSpec): MeshBuilder {
  const m = new MeshBuilder({ ...CABIN_KIT_PALETTE, ...s.palette });
  m.scope("body", () => body(m, s));
  m.scope("roof", () => roof(m, s));
  m.scope("hanger", () => hanger(m, s));
  return m;
}

// ---------------------------------------------------------------------------
// the low level of detail: the shell as plan rings in its colour bands, the
// glazing in the one LOD glass, the hanger and running gear as coarse blocks

/** The shell's paint by height for the LOD: runs of one material, glass as LOD_GLASS. */
function lodBands(s: CabinSpec): LodBand[] {
  const out: LodBand[] = [];
  const st = s.stations;
  for (let i = 0; i + 1 < st.length; i++) {
    const [y0, , mat] = st[i]!;
    const y1 = st[i + 1]![0];
    if (y1 - y0 < 1e-6) continue;
    // detail materials never reach a LOD: the glazing is the LOD glass, the rubber bumper dark frame
    const m = GLASSY.has(mat) ? LOD_GLASS : mat === "rubber" ? "frame" : mat;
    const last = out[out.length - 1];
    if (last && last[2] === m) out[out.length - 1] = [last[0], y1, m];
    else out.push([y0, y1, m]);
  }
  return out;
}

/**
 * The stations for the LOD: the belly, the outer line at the belly's top, the
 * glazing's top and the roof (cabinLod adds a ring at every band edge).
 */
function lodStations(s: CabinSpec): Array<[number, number]> {
  const st = s.stations;
  const at = (y: number): [number, number] => [y, insetAt(s, y)];
  const belly = st.find(([, d]) => d <= 1e-9) ?? st[1]!;
  const out: Array<[number, number]> = [[st[0]![0], st[0]![1]], [belly[0], 0], at(s.glass.y1), [roofOf(s), st[st.length - 1]![1]]];
  return out.filter((p, i) => i === 0 || p[0] > out[i - 1]![0] + 1e-6);
}

export function buildCabinLod(s: CabinSpec): MeshBuilder {
  const h = s.hanger;
  const top = roofOf(s);
  const { y1 } = cabinDatums(s);
  const bands = lodBands(s);
  const rail = s.deck ? { y: top + s.deck.rail, mat: s.deck.mat } : null;
  return cabinLod({
    palette: { ...CABIN_KIT_PALETTE, ...s.palette },
    body: {
      ring: (d, detail) => lodPlanRect(s.hx - d, s.hz - d, detail === 0 ? Math.max(s.corner - d, 0) * 0.6 : 0),
      details: 2,
      stations: lodStations(s),
      bands,
      top: rail ? "deck" : bands[bands.length - 1]![2],
      bottom: bands[0]![2],
    },
    parts: [
      { draw: (m) => {
        switch (h.kind) {
          case "grip":
            lodBar(m, "steel", [0, top - 0.05, 0], [0, h.rope - 0.22, 0], 0.12);
            lodBlock(m, -0.46, 0.46, h.rope - 0.24, y1, -0.13, 0.3, { side: "frame", bottom: "frame" });
            break;
          case "funitel":
            lodBlock(m, -h.gripX - 0.08, h.gripX + 0.08, top - 0.02, top + 0.47, -h.gap / 2, h.gap / 2, { side: "steel" });
            for (const zs of [-1, 1]) {
              lodBlock(m, -h.gripX - 0.46, h.gripX + 0.46, h.rope - 0.24, y1, zs * h.gap / 2 - 0.13, zs * h.gap / 2 + 0.13, { side: "frame", bottom: "frame" });
              for (const x of [-h.gripX, h.gripX]) lodBar(m, "steel", [x, top + 0.47, zs * h.gap / 2], [x, h.rope - 0.24, zs * h.gap / 2], 0.1);
            }
            break;
          case "carriage": {
            const yy = top + (h.yoke?.h ?? 0);
            if (h.yoke) lodBlock(m, -h.yoke.hx, h.yoke.hx, top - 0.02, yy, -h.yoke.hz, h.yoke.hz, { side: "steel" });
            lodBlock(m, -h.arm.w / 2, h.arm.w / 2, yy - 0.02, h.rope - 0.45, -h.arm.d / 2, h.arm.d / 2, { side: "steel" });
            lodBlock(m, -h.length / 2, h.length / 2, h.rope - 0.47, y1, -h.track - 0.06, h.track + 0.06, { side: "dark", bottom: "dark" });
            break;
          }
          case "side":
            for (const zs of [-1, 1]) {
              const zt = zs * h.track;
              lodBlock(m, -0.12, 0.12, h.attach, h.rope, zt - 0.12, zt + 0.12, { side: "steel" });
              lodBlock(m, -h.length / 2, h.length / 2, h.rope - 0.1, y1, zt - 0.22, zt + 0.08, { side: "dark", bottom: "dark" });
              lodBlock(m, -0.6, 0.6, h.attach - 0.15, h.attach + 0.15, Math.min(zs * (s.hz - 0.05), zt), Math.max(zs * (s.hz - 0.05), zt), { side: "steel" });
            }
            break;
        }
      } },
      ...(rail ? [{ optional: 1, draw: (m: MeshBuilder) => {
        // the top deck's railing as four thin rails at its height
        const rx = s.hx - insetAt(s, top) - 0.12;
        const rz = s.hz - insetAt(s, top) - 0.12;
        for (const zs of [-1, 1]) lodBar(m, rail.mat, [-rx, rail.y, zs * rz], [rx, rail.y, zs * rz], 0.04, 3);
        for (const xs of [-1, 1]) lodBar(m, rail.mat, [xs * rx, rail.y, -rz], [xs * rx, rail.y, rz], 0.04, 3);
      } }] : []),
    ],
  });
}
