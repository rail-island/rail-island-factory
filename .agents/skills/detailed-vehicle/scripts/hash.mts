// Byte hashes of designs, to prove a kit change leaves the other designs unchanged (detailed-vehicle skill).
// From a checkout root: pnpm exec tsx .agents/skills/detailed-vehicle/scripts/hash.mts <out.txt> [ids...|--kit]
// One row per design and parameter set (the defaults, then each other value of each enum parameter alone):
// the GLB's and the distant model's hashes. --kit: every design whose module imports (at any depth) one of
// the shared kit files in KIT. Compare two runs (before/after, or two checkouts) with `diff`.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const R = process.cwd();
const gen = await import(path.join(R, "generator/generate.ts"));
const { designGlb, DESIGNS, toGlb, designSource } = gen;
const [out, ...args] = process.argv.slice(2);
const KIT = (process.env.KIT ?? "shinkansen,seriesCab,cabNose,usTransit,worldCoaches,carbodyKit,lodUnits,sliceBody").split(",");
let ids: string[];
if (args[0] === "--kit") {
  const memo = new Map<string, boolean>();
  const uses = (file: string, seen = new Set<string>()): boolean => {
    if (memo.has(file)) return memo.get(file)!;
    if (seen.has(file)) return false;
    seen.add(file);
    const base = path.basename(file).replace(/\.ts$/, "");
    if (KIT.includes(base)) { memo.set(file, true); return true; }
    let txt = "";
    try { txt = fs.readFileSync(file, "utf8"); } catch { return false; }
    let r = false;
    for (const m of txt.matchAll(/from\s+"(\.[^"]+)"/g)) {
      let p = path.resolve(path.dirname(file), m[1]!);
      if (!p.endsWith(".ts")) p += ".ts";
      if (uses(p, seen)) { r = true; break; }
    }
    memo.set(file, r);
    return r;
  };
  ids = [...DESIGNS.keys()].filter((id: string) => {
    let s: string; try { s = designSource(id); } catch { return false; }
    const f = path.isAbsolute(s) ? s : path.join(R, s.startsWith("generator") ? s : path.join("generator", s));
    return uses(f.endsWith(".ts") ? f : f + ".ts");
  });
  ids.sort();
} else ids = args;
const h = (b: Uint8Array) => crypto.createHash("sha256").update(b).digest("hex").slice(0, 16);
const lines: string[] = [];
for (const id of ids) {
  const d = DESIGNS.get(id);
  if (!d) { lines.push(`${id}\tMISSING`); continue; }
  const sets: any[] = [undefined];
  for (const p of d.params ?? []) for (const v of p.values) if (v.value !== p.default) sets.push({ [p.name]: v.value });
  for (const ps of sets) {
    let a: string, b: string;
    try { a = h(designGlb(id, ps)); } catch (e: any) { a = "ERR:" + String(e.message).slice(0, 60); }
    try { b = h(toGlb(id, d.buildLod(ps))); } catch (e: any) { b = "ERR:" + String(e.message).slice(0, 60); }
    lines.push(`${id}\t${ps ? JSON.stringify(ps) : "{}"}\t${a}\t${b}`);
  }
}
fs.writeFileSync(out!, lines.join("\n") + "\n");
console.log(ids.length, "designs", lines.length, "rows");
