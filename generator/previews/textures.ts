// The texture library's site previews (docs/models/previews.md): one page per photo
// set, a slab and a block faced with it at four studs a repeat, untinted (its
// `swatch-*` surface). The site's 3D preview binds the photo; the thumbnail shows the
// photo's honest average colour.

import type { ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { TEXTURE_AVERAGE, type SurfaceId, type TextureName } from "../surfaces.ts";
import { Sketch } from "./sketch.ts";

function swatch(texture: string, lod: boolean): Sketch {
  const s = new Sketch();
  const avg = TEXTURE_AVERAGE[texture as TextureName] ?? "#808080";
  const rgb = [1, 3, 5].map((i) => parseInt(avg.slice(i, i + 2), 16)) as unknown as readonly [number, number, number];
  const mat = s.mat("surface", rgb, `swatch-${texture}` as SurfaceId);
  s.box(mat, { cx: 0, cy: 0.25, cz: 0, sx: 12, sy: 0.5, sz: 12 });
  if (!lod) s.box(mat, { cx: 1.5, cy: 0.5 + 2, cz: -1, sx: 4, sy: 4, sz: 4, yaw: 0.5 });
  return s;
}
export function texturePreview(_values: ParamValues | undefined, texture: string): MeshBuilder { return swatch(texture, false).build("swatch"); }
export function texturePreviewLod(_values: ParamValues | undefined, texture: string): MeshBuilder { return swatch(texture, true).build("swatch"); }
