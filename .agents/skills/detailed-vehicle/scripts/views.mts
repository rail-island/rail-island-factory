// Headless views of one design for comparing it with photographs (detailed-vehicle skill).
// Run from a checkout root (the main checkout or a worktree with node_modules):
//   pnpm exec tsx .agents/skills/detailed-vehicle/scripts/views.mts <id> <outPrefix> [paramsJson]
// writes <outPrefix>-34.png (whole model), -side.png (orthographic side, nose left, the game's
// 32 px/m side framing), -front.png, -nose34.png, -nose-side.png (the last 7 m of the +X end).
// ZOOM=x0,x1,vx,vy,vz adds -zoom.png: the x range (model metres) seen from direction (vx, vy, vz);
// ZOOM=x0,x1,0.01,1,0.01 is a plan view from above. Parameter values are strings: '{"unit":"train","cars":"4"}'.
import fs from "node:fs";
import path from "node:path";
const R = process.cwd();
const pngjs: any = (await import(path.join(R, "node_modules/pngjs/lib/png.js"))).default;
const PNG = pngjs.PNG ?? pngjs;
const { designGlb } = await import(path.join(R, "generator/generate.ts"));
const { renderGlbThumb, renderGlbSideThumb, readTriangles } = await import(path.join(R, "generator/renderGlbThumb.ts"));
const { triBounds } = await import(path.join(R, "generator/glbTriangles.ts"));
const [id, out, pj] = process.argv.slice(2);
if (!id || !out) throw new Error("usage: views.mts <id> <outPrefix> [paramsJson]");
const glb = designGlb(id, pj ? JSON.parse(pj) : undefined);
const tris = readTriangles(glb);
const { min, max } = triBounds(tris);
console.log(id, "triangles", tris.length, "x", min[0].toFixed(2), max[0].toFixed(2), "top", max[1].toFixed(2), "width", (max[2] - min[2]).toFixed(2));
fs.mkdirSync(path.dirname(out), { recursive: true });
const w = (n: string, p: unknown) => fs.writeFileSync(`${out}-${n}.png`, PNG.sync.write(p));
w("34", renderGlbThumb(glb, 512));
w("side", renderGlbSideThumb(glb).png);
const nx: [number, number] = [max[0] - 7, max[0] + 0.5];
w("front", renderGlbThumb(glb, 512, { xRange: nx, view: [1, 0.25, 0.35] }));
w("nose34", renderGlbThumb(glb, 512, { xRange: nx, view: [0.7, 0.35, 0.9] }));
w("nose-side", renderGlbThumb(glb, 512, { xRange: nx, view: [0.02, 0.05, 1] }));
if (process.env.ZOOM) {
  const [x0, x1, vx, vy, vz] = process.env.ZOOM.split(",").map(Number);
  w("zoom", renderGlbThumb(glb, 512, { xRange: [x0!, x1!], view: [vx!, vy!, vz!] }));
}
