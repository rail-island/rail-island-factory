// The city block types' site previews (docs/models/previews.md): a sample block of
// the type, filled by the SAME fill the game's city generator runs
// (sets/blockType.ts: rollBlockParams, fillRun, touchingSides) over a flat block
// cut by the game's streets -- a rectangular lattice block, an annular sector of a
// radial city or an irregular one -- with the game's street widths, the spacing's
// setback and the type's paving. The buildings are the city variants the game may
// stand (cityVariants.ts), coloured by the block's scheme and drawn with party walls
// where they stand wall to wall; every one is baked into the one model by its own
// design.
//
// The pools' designs come from the modules that hold them, so each family of block
// types has its own source file (blocks*.ts) and bundles only its pools' code.

import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "../design.ts";
import { MeshBuilder, type MaterialSpec } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";
import { cityColours, cityShapes, extentOf, heightBand, partySidesOf } from "../cityVariants.ts";
import { proceduralId } from "../modelId.ts";
import { surfaceMaterial } from "../surfaces.ts";
import * as blockType from "../sets/blockType.ts";

const AUTO = "auto";
const title = (v: string): string => v[0]!.toUpperCase() + v.slice(1);
export const BLOCK_PARAMS: ParamSpec[] = [
  { name: "shape", title: "Block shape", default: "rect", preview: true, values: [
    { value: "rect", title: "Lattice block" }, { value: "radial", title: "Radial sector" }, { value: "irregular", title: "Irregular block" },
  ] },
  { name: "size", title: "Block size", default: "town", preview: true, values: [
    { value: "village", title: "Village, 64" }, { value: "town", title: "Town, 72" }, { value: "city", title: "City, 80" },
  ] },
  { name: "spacing", title: "Spacing", default: AUTO, preview: true, values: [AUTO, ...Object.keys(blockType.SPACINGS)].map((v) => ({ value: v, title: title(v) })) },
  { name: "colour", title: "Colour scheme", default: AUTO, preview: true, values: [AUTO, ...blockType.PALETTES].map((v) => ({ value: v, title: title(v) })) },
  { name: "height", title: "Building height", default: AUTO, preview: true, values: [AUTO, ...blockType.BLOCK_HEIGHTS].map((v) => ({ value: v, title: title(v) })) },
  { name: "sample", title: "Sample", default: "1", preview: true, values: ["1", "2", "3"].map((v) => ({ value: v, title: `Sample ${v}` })) },
];
/** The game's city types' block pitch (studs between street centrelines) and lot density (its cityTypes.json). */
const PITCH: Record<string, number> = { village: 64, town: 72, city: 80 };
const DENSITY: Record<string, number> = { village: 0.75, town: 0.8, city: 0.85 };
/** The game's side street: a narrow road's deck (the roadType set's narrow width). */
const ROAD = 8;
/** The game's frontage retry step (one terrain cell) and the clearance behind a frontage. */
const RETRY = 4, BACK_GAP = 2;
/** The heights the ground, the streets over it and the buildings over both stand at, so none fights another. */
const STREET_Y = 0.01, SPOKE_Y = 0.015, LIFT = 0.02;
/** The inner radius of the radial sample's ring street. */
const RADIAL_R0 = 44;

/** A small seeded generator: the same block for the same sample. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P2 = { x: number; z: number };

/** One city variant a preview may stand: its design and shape values, sized, as a fill candidate. */
interface Variant extends blockType.FillCandidate {
  design: ProceduralDesign;
  shape: ParamValues;
}

/** The candidates of every design in the pools: each city shape of each, measured. */
function candidates(designs: readonly ProceduralDesign[], groups: readonly string[]): Map<string, Variant[]> {
  const out = new Map<string, Variant[]>();
  for (const d of designs) {
    const group = d.catalog?.group;
    if (!group || !groups.includes(group)) continue;
    const scale = d.catalog?.defaultScale ?? 1;
    const colours = cityColours(d);
    const party = partySidesOf(d.params);
    for (const shape of cityShapes(d, group, d.game?.city)) {
      const [w, , dd] = extentOf(d.build(shape).positions());
      const band = heightBand(d, group, shape);
      const list = out.get(group) ?? [];
      list.push({
        key: `${d.id}?${JSON.stringify(shape)}`, group, w: w * scale, d: dd * scale, design: d, shape,
        ...(band ? { band } : {}), ...(party.length ? { party } : {}), ...(colours.length ? { colours } : {}),
      });
      out.set(group, list);
    }
  }
  return out;
}

/** A building stood: its variant, the values it is built with, and its footprint. */
interface Stood { v: Variant; values: ParamValues; print: blockType.Footprint }

/** A frontage of the sample block: a run, and where a building `w` x `d` at `at` along it stands. */
interface Frontage {
  run: blockType.FillRun;
  /** The footprint of a building starting `at` along the frontage. */
  place: (at: number, w: number, d: number) => blockType.Footprint;
  /** How far along the frontage a world point lies. */
  alongOf: (p: P2) => number;
}

/** Degrees that turn a building's front (+Z) toward direction (fx, fz): front(rot) = (sin rot, cos rot). */
const rotFacing = (fx: number, fz: number): number => (Math.atan2(fx, fz) * 180) / Math.PI;

function corners(f: blockType.Footprint): P2[] {
  const r = (f.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => {
    const mx = (u! * f.w) / 2, mz = (v! * f.d) / 2;
    return { x: f.x + mx * c + mz * s, z: f.z - mx * s + mz * c };
  });
}

/** Whether two convex quads overlap by more than a hair (shared walls do not count). */
function overlap(a: P2[], b: P2[]): boolean {
  for (const poly of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const p = poly[i]!, q = poly[(i + 1) % 4]!;
      const nx = -(q.z - p.z), nz = q.x - p.x, len = Math.hypot(nx, nz) || 1;
      const proj = (pts: P2[]): [number, number] => {
        let lo = Infinity, hi = -Infinity;
        for (const t of pts) { const v = (t.x * nx + t.z * nz) / len; lo = Math.min(lo, v); hi = Math.max(hi, v); }
        return [lo, hi];
      };
      const [a0, a1] = proj(a), [b0, b1] = proj(b);
      if (a1 <= b0 + 0.02 || b1 <= a0 + 0.02) return false;
    }
  }
  return true;
}

/** The sample block's outline (street centrelines) and its frontages, by shape. */
function sampleBlock(shape: string, pitch: number, setback: number): { outline: P2[]; arcs?: { r0: number; r1: number; a0: number; a1: number }; inside: (p: P2) => boolean; frontages: Frontage[]; depthOf: (f: Frontage) => number } {
  const offset = ROAD / 2 + setback;
  if (shape === "radial") {
    const r0 = RADIAL_R0, r1 = r0 + pitch, span = pitch / (r0 + pitch / 2);
    const a0 = Math.PI / 2 - span / 2, a1 = Math.PI / 2 + span / 2;
    const at = (r: number, a: number): P2 => ({ x: Math.cos(a) * r, z: Math.sin(a) * r - (r0 + pitch / 2) });
    const outline: P2[] = [];
    for (let i = 0; i <= 16; i++) outline.push(at(r0, a0 + ((a1 - a0) * i) / 16));
    for (let i = 16; i >= 0; i--) outline.push(at(r1, a0 + ((a1 - a0) * i) / 16));
    const thickness = r1 - r0;
    const inside = (p: P2): boolean => {
      const x = p.x, z = p.z + r0 + pitch / 2, r = Math.hypot(x, z), a = Math.atan2(z, x);
      return r >= r0 + ROAD / 2 - 1e-6 && r <= r1 - ROAD / 2 + 1e-6 && Math.abs(Math.sin(a - a0)) * r >= ROAD / 2 - 1e-6 && Math.abs(Math.sin(a1 - a)) * r >= ROAD / 2 - 1e-6 && a >= a0 && a <= a1;
    };
    // a ring frontage walks the circle of its building line, buildings tangent to it
    const ring = (rRoad: number, side: 1 | -1): Frontage => {
      const rLine = rRoad + side * offset;
      const ang0 = a0 + offset / rRoad, ang1 = a1 - offset / rRoad;
      return {
        run: { length: Math.max(0, (ang1 - ang0) * rRoad), depthLimit: Math.max(0, thickness - offset - BACK_GAP) },
        place: (s, w, d) => {
          const a = ang0 + (s + w / 2) / rRoad, rc = rLine + side * (d / 2);
          const c = at(rc, a);
          return { x: c.x, z: c.z, rot: rotFacing(-side * Math.cos(a), -side * Math.sin(a)), w, d };
        },
        alongOf: (p) => (Math.atan2(p.z + r0 + pitch / 2, p.x) - ang0) * rRoad,
      };
    };
    // a spoke frontage walks a straight radial street, buildings facing it
    const spoke = (a: number, inward: 1 | -1): Frontage => {
      const ux = Math.cos(a), uz = Math.sin(a);
      const nx = -uz * inward, nz = ux * inward;
      const start = r0 + offset, len = r1 - offset - start;
      const origin = at(start, a);
      return {
        run: { length: Math.max(0, len), depthLimit: Math.max(0, Math.min(thickness, (r0 + pitch / 2) * span) / 2 - setback) },
        place: (s, w, d) => ({ x: origin.x + ux * (s + w / 2) + nx * (offset + d / 2), z: origin.z + uz * (s + w / 2) + nz * (offset + d / 2), rot: rotFacing(-nx, -nz), w, d }),
        alongOf: (p) => (p.x - origin.x) * ux + (p.z - origin.z) * uz,
      };
    };
    const frontages = [ring(r0, 1), ring(r1, -1), spoke(a0, 1), spoke(a1, -1)];
    return { outline, arcs: { r0, r1, a0, a1 }, inside, frontages, depthOf: (f) => f.run.depthLimit };
  }
  const h = pitch / 2;
  const outline: P2[] = shape === "irregular"
    ? [{ x: -h, z: -h * 0.85 }, { x: h * 0.9, z: -h }, { x: h * 1.1, z: h * 0.75 }, { x: -h * 0.15, z: h * 1.1 }, { x: -h * 0.95, z: h * 0.55 }]
    : [{ x: -h, z: -h }, { x: h, z: -h }, { x: h, z: h }, { x: -h, z: h }];
  // the area inside every street's deck: on the inner side of each edge by half a road
  const edges = outline.map((a, i) => {
    const b = outline[(i + 1) % outline.length]!;
    const len = Math.hypot(b.x - a.x, b.z - a.z), tx = (b.x - a.x) / len, tz = (b.z - a.z) / len;
    return { a, b, len, tx, tz, nx: -tz, nz: tx }; // counter-clockwise in (x, z): the block lies to the left
  });
  const inside = (p: P2): boolean => edges.every((e) => (p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz >= ROAD / 2 - 1e-6);
  const frontages: Frontage[] = edges.map((e) => {
    const len = e.len - 2 * offset;
    const origin = { x: e.a.x + e.tx * offset, z: e.a.z + e.tz * offset };
    // how deep the block reaches from this street's middle, as the game's block tool measures it
    let reach = 0;
    const mx = e.a.x + e.tx * e.len / 2, mz = e.a.z + e.tz * e.len / 2;
    for (let d = offset + 2; d < 400; d += 2) {
      if (!inside({ x: mx + e.nx * d, z: mz + e.nz * d })) break;
      reach = d - offset;
    }
    return {
      run: { length: Math.max(0, len), depthLimit: Math.max(0, Math.min(reach / 2 + 4, reach) - BACK_GAP) },
      place: (s, w, d) => ({ x: origin.x + e.tx * (s + w / 2) + e.nx * (offset + d / 2), z: origin.z + e.tz * (s + w / 2) + e.nz * (offset + d / 2), rot: rotFacing(-e.nx, -e.nz), w, d }),
      alongOf: (p) => (p.x - origin.x) * e.tx + (p.z - origin.z) * e.tz,
    };
  });
  return { outline, inside, frontages, depthOf: (f) => f.run.depthLimit };
}

/** The buildings of a sample block of `type`, with the parameters it was filled with. */
export function layout(designs: readonly ProceduralDesign[], type: string, values: ParamValues | undefined): { stood: Stood[]; params: blockType.BlockParams; block: ReturnType<typeof sampleBlock>; ground: string | null } {
  const p = resolveParams(BLOCK_PARAMS, values);
  const t = blockType.TYPE_META[type];
  const random = rng(Number(p.sample) * 7919 + type.length * 104729);
  const fixed: Partial<blockType.BlockParams> = {};
  for (const name of blockType.BLOCK_PARAM_NAMES) if (p[name] && p[name] !== AUTO) fixed[name] = p[name]!;
  const params = blockType.rollBlockParams(type, random, {}, fixed);
  const sp = blockType.spacingOf(params);
  const pitch = PITCH[p.size!] ?? 72;
  const block = sampleBlock(p.shape!, pitch, sp.setback);
  const stood: Stood[] = [];
  if (!t) return { stood, params, block, ground: null };
  const groups = [...t.pools.map((x) => x.group), ...(t.centerpiece ? [t.centerpiece] : []), ...(t.ringPools ? [t.ringPools.center] : [])];
  const pools = candidates(designs, groups);
  const fits = (f: blockType.Footprint): boolean => corners(f).every((c) => block.inside(c)) && !stood.some((s) => overlap(corners(s.print), corners(f)));
  const stand = (v: Variant, colours: Record<string, string>, print: blockType.Footprint): void => {
    stood.push({ v, values: { ...v.shape, ...colours }, print });
  };
  const centre = (): P2 => {
    let x = 0, z = 0;
    for (const q of block.outline) { x += q.x; z += q.z; }
    return { x: x / block.outline.length, z: z / block.outline.length };
  };
  const keyOf = (c: blockType.FillCandidate, colours: Readonly<Record<string, string>>): string => `${c.key}|${JSON.stringify(colours)}`;
  // a single building (a landmark) or a centrepiece (a tower), in the middle, facing the first street
  const middle = (group: string, pickLargest: boolean): void => {
    const list = [...(pools.get(group) ?? [])].sort((a, b) => (pickLargest ? b.w * b.d - a.w * a.d : 0) || (a.key < b.key ? -1 : 1));
    if (!pickLargest) for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [list[i], list[j]] = [list[j]!, list[i]!]; }
    const c = centre();
    const f0 = block.frontages[0]!.place(0, 1, 1);
    for (const v of list) {
      const print = { x: c.x, z: c.z, rot: f0.rot, w: v.w, d: v.d };
      if (!fits(print)) continue;
      stand(v, blockType.chooseColours(v, params.colour, random, keyOf), print);
      return;
    }
  };
  if (t.placement === "single") {
    middle(t.ringPools?.center ?? "hist_center", true);
  } else {
    if (t.centerpiece) middle(t.centerpiece, false);
    const ctx: blockType.FillContext = { typeId: type, params, pools, density: DENSITY[p.size!] ?? 0.8, random, retryStep: RETRY, keyOf };
    for (const fr of block.frontages) {
      // a building joins the block the moment the walk stands it, so the next one is checked against it
      const mine: number[] = [];
      const placed = blockType.fillRun(fr.run, ctx, (at, c, _key) => {
        const print = fr.place(at, c.w, c.d);
        if (!corners(print).every((q) => block.inside(q))) return false;
        const hit = stood.find((s) => overlap(corners(s.print), corners(print)));
        if (hit) {
          const far = Math.max(...corners(hit.print).map((q) => fr.alongOf(q)));
          return far > at ? { skipTo: far, party: !!hit.v.party?.length } : false;
        }
        mine.push(stood.length);
        stand(c as Variant, {}, print);
        return true;
      });
      placed.forEach((pl, i) => Object.assign(stood[mine[i]!]!.values, pl.colours));
    }
  }
  // the walls they share, drawn blank where the design can
  const touched = blockType.touchingSides(stood.map((s) => s.print));
  stood.forEach((s, i) => Object.assign(s.values, blockType.partyValues(touched[i]!, s.v.party)));
  return { stood, params, block, ground: t.ground };
}

type Groups = Map<string, { pos: number[]; col?: number[] }>;

function blockModel(designs: readonly ProceduralDesign[], values: ParamValues | undefined, type: string, lod: boolean): MeshBuilder {
  const { stood, block, ground } = layout(designs, type, values);
  const palette: Record<string, MaterialSpec> = {
    street: surfaceMaterial("road-asphalt", { color: "#3c3c40" }),
    ground: ground === "pavement" ? surfaceMaterial("road-pavement", { color: "#9b9b96" }) : { color: ground === "concrete" ? "#8a8a84" : "#6f8f4a" },
  };
  const built = stood.map((s) => {
    const model = s.v.design.build(s.values);
    const own = (model as unknown as { palette: Record<string, MaterialSpec> }).palette;
    for (const [name, spec] of Object.entries(own)) palette[`${s.v.design.id}:${name}`] = spec;
    return { s, model, scale: s.v.design.catalog?.defaultScale ?? 1 };
  });
  const m = new MeshBuilder(palette);
  built.forEach(({ s, model, scale }, i) => {
    const pos = model.positions();
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, minY = Infinity, top = -Infinity;
    for (let k = 0; k < pos.length; k += 3) {
      minX = Math.min(minX, pos[k]!); maxX = Math.max(maxX, pos[k]!);
      minY = Math.min(minY, pos[k + 1]!); top = Math.max(top, pos[k + 1]!);
      minZ = Math.min(minZ, pos[k + 2]!); maxZ = Math.max(maxZ, pos[k + 2]!);
    }
    // the footprint's centre at the print's, scaled, turned so +Z faces the street, on the ground
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    const r = (s.print.rot * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
    const place = (px: number, py: number, pz: number): Vec3 => {
      const lx = (px - cx) * scale, lz = (pz - cz) * scale;
      return [s.print.x + lx * c + lz * sn, (py - minY) * scale + LIFT, s.print.z - lx * sn + lz * c];
    };
    const groups = (model as unknown as { groups: Groups }).groups;
    if (lod) {
      // the distant block: each building's massing, a box over its footprint in its commonest material
      let main = "", most = -1;
      for (const [mat, g] of groups) if (g.pos.length > most) { most = g.pos.length; main = mat; }
      const name = `${s.v.design.id}:${main}`;
      const c8 = [place(minX, minY, minZ), place(maxX, minY, minZ), place(maxX, top, minZ), place(minX, top, minZ),
        place(minX, minY, maxZ), place(maxX, minY, maxZ), place(maxX, top, maxZ), place(minX, top, maxZ)];
      m.scope(`building-${i}`, () => {
        for (const [a0, a1, a2, a3] of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2]] as const) m.quad(name, c8[a0]!, c8[a1]!, c8[a2]!, c8[a3]!);
      });
      return;
    }
    m.scope(`building-${i}`, () => {
      for (const [mat, g] of groups) {
        const name = `${s.v.design.id}:${mat}`;
        for (let k = 0; k < g.pos.length; k += 9) {
          const a = place(g.pos[k]!, g.pos[k + 1]!, g.pos[k + 2]!), bb = place(g.pos[k + 3]!, g.pos[k + 4]!, g.pos[k + 5]!), cc = place(g.pos[k + 6]!, g.pos[k + 7]!, g.pos[k + 8]!);
          if (g.col) m.triShaded(name, a, bb, cc, [[g.col[k]!, g.col[k + 1]!, g.col[k + 2]!], [g.col[k + 3]!, g.col[k + 4]!, g.col[k + 5]!], [g.col[k + 6]!, g.col[k + 7]!, g.col[k + 8]!]]);
          else m.tri(name, a, bb, cc);
        }
      }
    });
  });
  // the block's ground and the streets round it, a hair apart so they never fight
  m.scope("ground and streets", () => {
    const y = 0;
    if (block.arcs) {
      const { r0, r1, a0, a1 } = block.arcs;
      const oz = r0 + (r1 - r0) / 2;
      const at = (r: number, a: number): Vec3 => [Math.cos(a) * r, y, Math.sin(a) * r - oz];
      const strip = (mat: string, ra: number, rb: number, b0: number, b1: number): void => {
        for (let i = 0; i < 16; i++) {
          const u0 = b0 + ((b1 - b0) * i) / 16, u1 = b0 + ((b1 - b0) * (i + 1)) / 16;
          m.quad(mat, at(ra, u0), at(ra, u1), at(rb, u1), at(rb, u0));
        }
      };
      strip("ground", r0, r1, a0, a1);
      const street = (ra: number, rb: number, b0: number, b1: number): void => {
        for (let i = 0; i < 16; i++) {
          const u0 = b0 + ((b1 - b0) * i) / 16, u1 = b0 + ((b1 - b0) * (i + 1)) / 16;
          const lift = (p: Vec3): Vec3 => [p[0], STREET_Y, p[2]];
          m.quad("street", lift(at(ra, u0)), lift(at(ra, u1)), lift(at(rb, u1)), lift(at(rb, u0)));
        }
      };
      street(r0 - ROAD / 2, r0 + ROAD / 2, a0 - ROAD / r0, a1 + ROAD / r0);
      street(r1 - ROAD / 2, r1 + ROAD / 2, a0 - ROAD / r1, a1 + ROAD / r1);
      for (const a of [a0, a1]) {
        const nx = -Math.sin(a), nz = Math.cos(a), h = ROAD / 2;
        const p0 = at(r0, a), p1 = at(r1, a);
        m.quad("street", [p0[0] - nx * h, SPOKE_Y, p0[2] - nz * h], [p0[0] + nx * h, SPOKE_Y, p0[2] + nz * h], [p1[0] + nx * h, SPOKE_Y, p1[2] + nz * h], [p1[0] - nx * h, SPOKE_Y, p1[2] - nz * h]);
      }
      return;
    }
    const o = block.outline;
    for (let i = 1; i < o.length - 1; i++) m.tri("ground", [o[0]!.x, y, o[0]!.z], [o[i + 1]!.x, y, o[i + 1]!.z], [o[i]!.x, y, o[i]!.z]);
    o.forEach((a, i) => {
      const b = o[(i + 1) % o.length]!;
      const len = Math.hypot(b.x - a.x, b.z - a.z), tx = (b.x - a.x) / len, tz = (b.z - a.z) / len;
      const nx = -tz * (ROAD / 2), nz = tx * (ROAD / 2), ex = tx * (ROAD / 2), ez = tz * (ROAD / 2);
      m.quad("street", [a.x - ex - nx, STREET_Y, a.z - ez - nz], [a.x - ex + nx, STREET_Y, a.z - ez + nz], [b.x + ex + nx, STREET_Y, b.z + ez + nz], [b.x + ex - nx, STREET_Y, b.z + ez - nz]);
    });
  });
  return m;
}

/** The shared build functions of one family's block previews, over the designs of its pools. */
export function blockBuilders(raw: readonly ProceduralDesign[]): {
  build: (values: ParamValues | undefined, type: string) => MeshBuilder; buildLod: (values: ParamValues | undefined, type: string) => MeshBuilder;
} {
  // under their catalog ids, as the export knows them (generate.ts settles them; a
  // model's own bundle sees the source's short names), so a design's city variants are found
  const designs = raw.map((d) => ({ ...d, id: proceduralId(d.id) }));
  return {
    build: (values, type) => blockModel(designs, values, type, false),
    buildLod: (values, type) => blockModel(designs, values, type, true),
  };
}
