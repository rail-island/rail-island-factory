// The distant model (buildLod) of one design as a three-quarter PNG (detailed-vehicle skill).
//   pnpm exec tsx .agents/skills/detailed-vehicle/scripts/lod.mts <id> <out.png> [paramsJson]
import fs from "node:fs";
import path from "node:path";
const R = process.cwd();
const pngjs: any = (await import(path.join(R, "node_modules/pngjs/lib/png.js"))).default;
const PNG = pngjs.PNG ?? pngjs;
const { DESIGNS, toGlb } = await import(path.join(R, "generator/generate.ts"));
const { renderGlbThumb } = await import(path.join(R, "generator/renderGlbThumb.ts"));
const [id, out, pj] = process.argv.slice(2);
const d = DESIGNS.get(id!);
if (!d || !out) throw new Error("usage: lod.mts <id> <out.png> [paramsJson]");
fs.writeFileSync(out, PNG.sync.write(renderGlbThumb(toGlb(id!, d.buildLod(pj ? JSON.parse(pj) : undefined)), 512)));
