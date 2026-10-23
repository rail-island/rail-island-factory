// The city block types' site previews (docs/models/previews.md): a sample block of
// the type, grown from its data -- its pools and their mix, the presets a city builds
// of each building, its placement -- and baked into one model, every building drawn
// by its own design. A perimeter block lines its four frontages with buildings facing
// the streets round it; a single-building block stands one from its ring pool in the
// middle. The game's CityGen fits real lots to a real street plan and its facade
// numbers; this shows what a block of the type is made of.
//
// The pools' designs come from the modules that hold them, so each family of block
// types has its own source file (blocks*.ts) and bundles only its pools' code.

import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "../design.ts";
import { MeshBuilder, type MaterialSpec } from "../meshBuilder.ts";
import type { Vec3 } from "../meshCore.ts";
import { cityPresetsOf } from "../cityPresets.ts";
import { proceduralId } from "../modelId.ts";
import { surfaceMaterial } from "../surfaces.ts";
import * as blockType from "../sets/blockType.ts";

export const BLOCK_PARAMS: ParamSpec[] = [
  { name: "size", title: "Block size", default: "medium", preview: true, values: [{ value: "small", title: "40 studs" }, { value: "medium", title: "60 studs" }, { value: "large", title: "80 studs" }] },
  { name: "sample", title: "Sample", default: "1", preview: true, values: ["1", "2", "3"].map((v) => ({ value: v, title: `Sample ${v}` })) },
];
const SIZES: Record<string, number> = { small: 40, medium: 60, large: 80 };
/** The street round the block, and the gap kept between neighbouring buildings. */
const STREET = 8, GAP = 0.4;

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

interface Built { design: ProceduralDesign; model: MeshBuilder; scale: number; minX: number; maxX: number; minZ: number; maxZ: number; minY: number }

/** A building of `pool`, picked by its weight and preset, built at the chosen detail and measured. */
function pick(designs: readonly ProceduralDesign[], pool: string, random: () => number): Built | null {
  const choices = designs.flatMap((d) => (d.catalog?.group === pool ? cityPresetsOf(d.id, pool, d.game?.city).map((p) => ({ d, p })) : []));
  if (!choices.length) return null;
  const total = choices.reduce((t, c) => t + (c.p.weight ?? 1), 0);
  let r = random() * total;
  const choice = choices.find((c) => (r -= c.p.weight ?? 1) < 0) ?? choices[choices.length - 1]!;
  // the full model, measured; the distant block draws its massing from it (blockModel)
  const model = choice.d.build(choice.p.params);
  const pos = model.positions();
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, minY = Infinity;
  for (let i = 0; i < pos.length; i += 3) {
    minX = Math.min(minX, pos[i]!); maxX = Math.max(maxX, pos[i]!);
    minY = Math.min(minY, pos[i + 1]!);
    minZ = Math.min(minZ, pos[i + 2]!); maxZ = Math.max(maxZ, pos[i + 2]!);
  }
  return { design: choice.d, model, scale: choice.d.catalog?.defaultScale ?? 1, minX, maxX, minZ, maxZ, minY };
}

/** A building placed: turned `yaw` (its front, +Z, toward the street), its footprint's centre at (x, z). */
interface Placed { b: Built; yaw: number; x: number; z: number }

/** The pool a frontage slot draws from, by the block's mix. */
function poolOf(t: blockType.BlockTypeData, random: () => number): string {
  const total = t.pools.reduce((s, p) => s + p.weight, 0);
  let r = random() * total;
  return (t.pools.find((p) => (r -= p.weight) < 0) ?? t.pools[t.pools.length - 1]!).group;
}

function layout(designs: readonly ProceduralDesign[], type: string, size: number, random: () => number): Placed[] {
  const t = blockType.TYPE_META[type];
  if (!t) return [];
  const half = size / 2;
  if (t.placement === "single" || !t.pools.length) {
    const b = pick(designs, t.ringPools?.center ?? t.centerpiece ?? "hist_center", random);
    return b ? [{ b, yaw: 0, x: 0, z: 0 }] : [];
  }
  const out: Placed[] = [];
  // the north and south frontages run the block's full length; east and west fit between them
  let depthNS = 0;
  const sides = [
    { yaw: 0, along: [1, 0], out: [0, 1], length: size },
    { yaw: Math.PI, along: [-1, 0], out: [0, -1], length: size },
    { yaw: Math.PI / 2, along: [0, -1], out: [1, 0], length: 0 },
    { yaw: -Math.PI / 2, along: [0, 1], out: [-1, 0], length: 0 },
  ] as const;
  for (const [i, side] of sides.entries()) {
    const length = i < 2 ? side.length : size - 2 * (depthNS + GAP);
    let at = -length / 2;
    for (let tries = 0; tries < 24 && at < length / 2; tries++) {
      const b = pick(designs, poolOf(t, random), random);
      if (!b) break;
      const w = (b.maxX - b.minX) * b.scale, d = (b.maxZ - b.minZ) * b.scale;
      if (d > half || at + w > length / 2) continue;
      if (i < 2) depthNS = Math.max(depthNS, d);
      // the footprint's centre: along the frontage, set back from the street by half its depth
      const s = at + w / 2, back = half - d / 2;
      out.push({ b, yaw: side.yaw, x: side.along[0] * s + side.out[0] * back, z: side.along[1] * s + side.out[1] * back });
      at += w + GAP;
    }
  }
  return out;
}

type Groups = Map<string, { pos: number[]; col?: number[] }>;

function blockModel(designs: readonly ProceduralDesign[], values: ParamValues | undefined, type: string, lod: boolean): MeshBuilder {
  const p = resolveParams(BLOCK_PARAMS, values);
  const size = SIZES[p.size!]!;
  const placed = layout(designs, type, size, rng(Number(p.sample) * 7919 + type.length * 104729));
  // every building's materials, under its design's id, and the streets round the block
  const palette: Record<string, MaterialSpec> = {
    street: surfaceMaterial("road-asphalt", { color: "#3c3c40" }),
    kerb: surfaceMaterial("road-pavement", { color: "#9b9b96" }),
  };
  for (const { b } of placed) {
    const own = (b.model as unknown as { palette: Record<string, MaterialSpec> }).palette;
    for (const [name, spec] of Object.entries(own)) palette[`${b.design.id}:${name}`] = spec;
  }
  const m = new MeshBuilder(palette);
  // the lowest building on the ground (y = 0), the streets with it
  const lift = placed.length ? -Math.min(...placed.map(({ b }) => b.minY * b.scale)) : 0;
  const single = placed.length === 1 && placed[0]!.x === 0 && placed[0]!.z === 0;
  placed.forEach(({ b, yaw, x, z }, i) => {
    // a lone building keeps its own origin (moving it would round its near-coplanar
    // details together); a frontage one is placed by its footprint's centre
    const cx = single ? 0 : (b.minX + b.maxX) / 2, cz = single ? 0 : (b.minZ + b.maxZ) / 2;
    const c = Math.cos(yaw), s = Math.sin(yaw);
    // scale about the footprint's centre, turn so +Z faces the street, move to the slot
    const place = (px: number, py: number, pz: number): Vec3 => {
      const lx = (px - cx) * b.scale, lz = (pz - cz) * b.scale;
      return [x + lx * c + lz * s, py * b.scale + lift, z - lx * s + lz * c];
    };
    const groups = (b.model as unknown as { groups: Groups }).groups;
    if (lod) {
      // the distant block: each building's massing, a box over its footprint in its commonest material
      let main = "", most = -1;
      for (const [mat, g] of groups) if (g.pos.length > most) { most = g.pos.length; main = mat; }
      const name = `${b.design.id}:${main}`;
      const [x0, x1, z0, z1] = [b.minX, b.maxX, b.minZ, b.maxZ];
      const top = Math.max(...(b.model.positions().filter((_, k) => k % 3 === 1))) ;
      const at = (px: number, py: number, pz: number): Vec3 => place(px, py, pz);
      const c8 = [at(x0, b.minY, z0), at(x1, b.minY, z0), at(x1, top, z0), at(x0, top, z0), at(x0, b.minY, z1), at(x1, b.minY, z1), at(x1, top, z1), at(x0, top, z1)];
      m.scope(`building-${i}`, () => {
        for (const [a0, a1, a2, a3] of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2]] as const) m.quad(name, c8[a0]!, c8[a1]!, c8[a2]!, c8[a3]!);
      });
      return;
    }
    m.scope(`building-${i}`, () => {
      for (const [mat, g] of groups) {
        const name = `${b.design.id}:${mat}`;
        for (let k = 0; k < g.pos.length; k += 9) {
          const a = place(g.pos[k]!, g.pos[k + 1]!, g.pos[k + 2]!), bb = place(g.pos[k + 3]!, g.pos[k + 4]!, g.pos[k + 5]!), cc = place(g.pos[k + 6]!, g.pos[k + 7]!, g.pos[k + 8]!);
          if (g.col) m.triShaded(name, a, bb, cc, [[g.col[k]!, g.col[k + 1]!, g.col[k + 2]!], [g.col[k + 3]!, g.col[k + 4]!, g.col[k + 5]!], [g.col[k + 6]!, g.col[k + 7]!, g.col[k + 8]!]]);
          else m.tri(name, a, bb, cc);
        }
      }
    });
  });
  // the streets round the block, with a kerb strip on the block's side (round a lone
  // building bigger than the block, outside it)
  const reach = placed.reduce((r, { b }) => Math.max(r, ...[b.minX, b.maxX, b.minZ, b.maxZ].map((v) => Math.abs(v) * b.scale + 1)), 0);
  const half = single ? Math.max(size / 2, reach) : size / 2;
  m.scope("streets", () => {
    for (const [x0, x1, z0, z1, mat] of [
      [-half - STREET, half + STREET, half + 1, half + STREET, "street"], [-half - STREET, half + STREET, -half - STREET, -half - 1, "street"],
      [half + 1, half + STREET, -half - 1, half + 1, "street"], [-half - STREET, -half - 1, -half - 1, half + 1, "street"],
      [-half, half, half + 0.05, half + 1, "kerb"], [-half, half, -half - 1, -half - 0.05, "kerb"],
      [half + 0.05, half + 1, -half, half, "kerb"], [-half - 1, -half - 0.05, -half, half, "kerb"],
    ] as const) m.quad(mat, [x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [x1, 0, z0]);
  });
  return m;
}

/** The shared build functions of one family's block previews, over the designs of its pools. */
export function blockBuilders(raw: readonly ProceduralDesign[]): {
  build: (values: ParamValues | undefined, type: string) => MeshBuilder; buildLod: (values: ParamValues | undefined, type: string) => MeshBuilder;
} {
  // under their catalog ids, as the export knows them (generate.ts settles them; a
  // model's own bundle sees the source's short names), so a design's presets are found
  const designs = raw.map((d) => ({ ...d, id: proceduralId(d.id) }));
  return {
    build: (values, type) => blockModel(designs, values, type, false),
    buildLod: (values, type) => blockModel(designs, values, type, true),
  };
}
