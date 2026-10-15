// A GLB posed at one sample of one of its animation clips: the animated nodes'
// translation and rotation replaced by the clip's values at that sample, the
// binary chunk unchanged. For checking an animated model frame by frame with the
// tools that read a GLB at rest (coplanar.ts, glbStats.ts, renderGlbThumb.ts).
// No `node:` imports.

import { parseGlb, readAccessor } from "./glbParse.ts";

interface AnimatedGltf {
  nodes: Array<Record<string, unknown>>;
  animations?: Array<{
    name?: string;
    channels: Array<{ sampler: number; target: { node: number; path: string } }>;
    samplers: Array<{ input: number; output: number }>;
  }>;
}

/** The number of samples of a GLB's clip `clip` (0 when it has none). */
export function sampleCount(glb: Uint8Array, clip = 0): number {
  const { json, bin } = parseGlb(glb);
  const a = (json as unknown as AnimatedGltf).animations?.[clip];
  if (!a) return 0;
  return readAccessor(json, bin, a.samplers[0]!.input).length;
}

/** The GLB with clip `clip` applied at sample `k`. */
export function poseGlb(glb: Uint8Array, k: number, clip = 0): Uint8Array {
  const { json, bin } = parseGlb(glb);
  const g = json as unknown as AnimatedGltf;
  const a = g.animations?.[clip];
  if (!a) throw new Error("the GLB has no such animation");
  for (const ch of a.channels) {
    const s = a.samplers[ch.sampler]!;
    const values = readAccessor(json, bin, s.output);
    const width = ch.target.path === "rotation" ? 4 : 3;
    g.nodes[ch.target.node]![ch.target.path] = values.slice(k * width, k * width + width);
  }
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
