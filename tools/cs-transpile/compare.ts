// The C# transpiler pilot's proof and timing (docs/specs/2026-11-21-csharp-transpiler-pilot.md):
// every parameter combination the factory's tests build (coverageCombinations), at full
// and low detail, is built twice - by the design's JS bundle (bundleDesign, the export's
// standalone model) with the real three.js, and by the transpiled C# - and the two
// dumps are compared exactly: node tree, materials in order, every position, normal
// and colour (as Float32, as both write them), clips and userData. Then both, and the
// JS bundle inside Jint, are timed. Writes export/cs/report.json.
// Node-only; run through main.ts.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import { DESIGNS, designSource } from "../../generator/generate.ts";
import { bundleDesign } from "../../generator/jsModel.ts";
import { OUT_DIR, combinations, dotnet } from "./common.ts";

interface Job {
  id: string;
  values: Record<string, string>;
  lod: boolean;
  file: string;
}

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

type Build = (three: typeof THREE, values?: Record<string, string>, lod?: boolean) => THREE.Group;

function dumpMaterial(m: THREE.MeshStandardMaterial): Json {
  return {
    name: m.name,
    color: `#${m.color.getHexString()}`,
    metalness: m.metalness,
    roughness: m.roughness,
    doubleSided: m.side === THREE.DoubleSide,
    vertexColors: !!m.vertexColors,
    glass: !!m.userData.glass,
    ...(m.transparent ? { jsMaterial: { transparent: true, opacity: m.opacity, depthWrite: m.depthWrite } } : {}),
  };
}

/** A built JS group as the C# console dumps a ModelNode (Program.cs WriteNode). */
export function dumpGroup(o: THREE.Object3D, root = true): Json {
  const meshes = o.children.filter((c): c is THREE.Mesh => (c as THREE.Mesh).isMesh).map((m) => {
    const g = m.geometry;
    const color = g.getAttribute("color");
    return {
      name: m.name,
      material: dumpMaterial(m.material as THREE.MeshStandardMaterial),
      position: Array.from(g.getAttribute("position").array as Float32Array),
      normal: Array.from(g.getAttribute("normal").array as Float32Array),
      ...(color ? { color: Array.from(color.array as Float32Array) } : {}),
    };
  });
  const userData: Record<string, Json> = JSON.parse(JSON.stringify(o.userData));
  delete userData.lod;
  return {
    name: o.name,
    position: [o.position.x, o.position.y, o.position.z],
    meshes,
    children: o.children.filter((c) => !(c as THREE.Mesh).isMesh).map((c) => dumpGroup(c, false)),
    animations: (root ? o.animations : []).map((a) => ({
      name: a.name,
      duration: a.duration,
      tracks: a.tracks.map((t) => ({ name: t.name, times: Array.from(t.times), values: Array.from(t.values) })),
    })),
    userData,
  };
}

/** The first difference between two dumps (path, and for a number array how many entries differ), or null. */
export function diff(a: Json, b: Json, at = "$"): string | null {
  if (typeof a === "number" && typeof b === "number") return a === b ? null : `${at}: ${a} (js) vs ${b} (cs)`;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${at}: length ${a.length} (js) vs ${b.length} (cs)`;
    if (a.every((x) => typeof x === "number")) {
      let n = 0;
      let first = -1;
      let worst = 0;
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          n++;
          if (first < 0) first = i;
          worst = Math.max(worst, Math.abs((a[i] as number) - (b[i] as number)));
        }
      }
      return n ? `${at}: ${n} of ${a.length} numbers differ, first [${first}] ${a[first]} (js) vs ${b[first]} (cs), largest difference ${worst}` : null;
    }
    for (let i = 0; i < a.length; i++) {
      const d = diff(a[i]!, b[i]!, `${at}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
    // key order is not compared: JSON.stringify keeps a literal's order, the C# class its declaration order
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    for (const k of keys) {
      if (!(k in a)) return `${at}.${k}: absent (js) vs ${JSON.stringify(b[k]).slice(0, 80)} (cs)`;
      if (!(k in b)) return `${at}.${k}: ${JSON.stringify(a[k]).slice(0, 80)} (js) vs absent (cs)`;
      const d = diff(a[k]!, b[k]!, `${at}.${k}`);
      if (d) return d;
    }
    return null;
  }
  return a === b ? null : `${at}: ${JSON.stringify(a)} (js) vs ${JSON.stringify(b)} (cs)`;
}

function triangles(g: THREE.Object3D): number {
  let n = 0;
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) n += m.geometry.getAttribute("position").count / 3;
  });
  return n;
}

/**
 * Milliseconds per build: warmed up for 300 ms, then the median of five rounds of at
 * least 200 ms each (as Program.cs Bench does), so a burst of noise moves one round only.
 */
function bench(run: () => void): { ms: number; runs: number } {
  for (const w0 = performance.now(); performance.now() - w0 < 300;) run();
  const rounds: number[] = [];
  let runs = 0;
  for (let r = 0; r < 5; r++) {
    const t0 = performance.now();
    let n = 0;
    while (n < 3 || performance.now() - t0 < 200) {
      run();
      n++;
    }
    rounds.push((performance.now() - t0) / n);
    runs += n;
  }
  rounds.sort((a, b) => a - b);
  return { ms: rounds[2]!, runs };
}

const fileOf = (id: string, i: number, lod: boolean) => `${id}__${i}${lod ? "__lod" : ""}.json`;

export async function runPilot(ids: string[]): Promise<void> {
  const runDir = path.join(OUT_DIR, "run");
  const bundleDir = path.join(OUT_DIR, "bundles");
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(runDir, "cs"), { recursive: true });
  fs.mkdirSync(bundleDir, { recursive: true });

  const jobs: Job[] = [];
  const builds = new Map<string, Build>();
  for (const id of ids) {
    const js = await bundleDesign(DESIGNS.get(id)!, designSource(id));
    const file = path.join(bundleDir, `${id}.js`);
    fs.writeFileSync(file, js);
    builds.set(id, (await import(`${pathToFileURL(file).href}?v=${Date.now()}`)).default as Build);
    combinations(id).forEach((values, i) => {
      for (const lod of [false, true]) jobs.push({ id, values, lod, file: fileOf(id, i, lod) });
    });
  }
  fs.writeFileSync(path.join(runDir, "jobs.json"), JSON.stringify(jobs));

  console.log(`building the C# project (dotnet build -c Release) ...`);
  dotnet(["build", "-c", "Release", "-v", "q", "-nologo"], { quiet: true });
  const dll = path.join("bin", "Release", "net8.0", "RailIsland.Models.dll");
  dotnet([dll, "dump", path.join(runDir, "jobs.json"), path.join(runDir, "cs")], { quiet: true });

  const results: Array<{ file: string; id: string; lod: boolean; values: Record<string, string>; triangles: number; match: boolean; difference: string | null }> = [];
  for (const j of jobs) {
    const group = builds.get(j.id)!(THREE, j.values, j.lod);
    const js = dumpGroup(group);
    const cs = JSON.parse(fs.readFileSync(path.join(runDir, "cs", j.file), "utf8")) as Json;
    const d = cs && typeof cs === "object" && "error" in cs ? `C# threw: ${String((cs as Record<string, Json>).error).split("\n")[0]}` : diff(js, cs);
    results.push({ file: j.file, id: j.id, lod: j.lod, values: j.values, triangles: triangles(group), match: d === null, difference: d });
  }
  const matched = results.filter((r) => r.match).length;
  console.log(`compared ${results.length} builds: ${matched} identical, ${results.length - matched} different`);
  for (const r of results.filter((x) => !x.match).slice(0, 12)) console.log(`  ${r.file}: ${r.difference}`);

  // timing: the default combination of each design, both levels (every job would take minutes in Jint)
  const timed = jobs.filter((j) => j.file.includes("__0"));
  fs.writeFileSync(path.join(runDir, "bench-jobs.json"), JSON.stringify(timed));
  const node = timed.map((j) => ({ file: j.file, ...bench(() => builds.get(j.id)!(THREE, j.values, j.lod)) }));
  const csBench = JSON.parse(dotnet([dll, "bench", path.join(runDir, "bench-jobs.json")], { quiet: true })) as Array<{ file: string; ms: number; runs: number; triangles: number }>;
  const jint = JSON.parse(dotnet([dll, "jint", path.join(runDir, "bench-jobs.json"), bundleDir], { quiet: true })) as Array<{ file: string; ms: number; runs: number; triangles: number }>;
  const timing = timed.map((j, i) => ({ file: j.file, triangles: csBench[i]!.triangles, jintTriangles: jint[i]!.triangles, nodeMs: node[i]!.ms, csMs: csBench[i]!.ms, jintMs: jint[i]!.ms }));
  console.log("ms per build (default parameters): file, triangles, Node, C#, Jint");
  for (const t of timing) console.log(`  ${t.file.padEnd(48)} ${String(t.triangles).padStart(6)}  ${t.nodeMs.toFixed(2).padStart(8)}  ${t.csMs.toFixed(2).padStart(8)}  ${t.jintMs.toFixed(1).padStart(8)}`);

  const transpile = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "transpile.json"), "utf8"));
  fs.writeFileSync(path.join(OUT_DIR, "report.json"), `${JSON.stringify({ transpile, compared: results.length, identical: matched, results, timing }, null, 2)}\n`);
  if (matched !== results.length) process.exitCode = 1;
}
