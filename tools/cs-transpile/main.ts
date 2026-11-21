// The C# transpiler pilot's driver (docs/specs/2026-11-21-csharp-transpiler-pilot.md):
//
//   pnpm cs:pilot [--truck] [--no-run]
//   pnpm cs:pilot --survey     every design, transpiled only: what is not covered yet
//   pnpm cs:pilot --ids=a,b    the same run for any designs
//   pnpm cs:pilot --fixtures   each supported construct (fixtures/constructs.ts) in Node and C#, compared
//
// 1. lists each pilot design's tree-shaken modules (esbuild metafile),
// 2. transpiles what the designs reach (transpile.ts) into export/cs/Generated,
//    copies the runtime and generates the typed API (one class per design, one enum
//    per parameter) and the dump/bench console,
// 3. builds it with dotnet, dumps every combination the factory's tests build
//    (coverageCombinations) at both levels of detail, compares them with the JS
//    bundles' output (compare.ts) and times C#, Node and Jint (report.json).
// Node-only; run with tsx. Writes only to the gitignored export/cs/.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DESIGNS } from "../../generator/generate.ts";
import type { ParamSpec } from "../../generator/design.ts";
import { bundleInputs, pilotDesign, GENERATOR_DIR, type PilotDesign } from "./inputs.ts";
import { Transpiler, TranspileError } from "./transpile.ts";
import { HERE, OUT_DIR, ROOT } from "./common.ts";


export const PILOT_IDS = ["proc-prop-airport-windsock", "proc-building-sky-pyramid"];
export const STRETCH_IDS = ["proc-vehicle-american-truck"];

const pascal = (s: string): string => s.split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join("");
const enumMember = (v: string): string => (/^[0-9]/.test(v) ? `V${pascal(v)}` : pascal(v)) || "Empty";

/** The C# class name of a design's API: its id without `proc-`, PascalCase. */
export const apiClass = (id: string): string => pascal(id.replace(/^proc-/, ""));

function designApi(d: PilotDesign, specs: readonly ParamSpec[], build: { moduleClass: string; name: string }, lodFn: { moduleClass: string; name: string }, bound: string | undefined): string {
  const cls = apiClass(d.id);
  // a design bound to one value of a shared build function passes it after the values (design.ts `bound`)
  const callArgs = (takes: boolean) => [takes || bound !== undefined ? "values" : "", bound !== undefined ? JSON.stringify(bound) : ""].filter(Boolean).join(", ");
  const enums = specs.map((s) => {
    const name = `${pascal(s.name)}Param`;
    return {
      spec: s,
      name,
      code: `    public enum ${name} { ${s.values.map((v) => enumMember(v.value)).join(", ")} }\n    private static readonly string[] ${name}Values = { ${s.values.map((v) => JSON.stringify(v.value)).join(", ")} };`,
    };
  });
  const args = enums.map((e) => `${e.name} ${Transpiler.escape(e.spec.name)} = ${e.name}.${enumMember(e.spec.default)}`);
  const sets = enums.map((e) => `        p["${e.spec.name}"] = ${e.name}Values[(int)${Transpiler.escape(e.spec.name)}];`);
  return `/** ${d.id}: ${DESIGNS.get(d.id)!.title}. */
public static class ${cls}
{
    public const string Id = ${JSON.stringify(d.id)};
${enums.map((e) => e.code).join("\n")}

    /** Builds the model with these parameters; \`lod\` builds its low level of detail. */
    public static ModelNode Build(${[...args, "bool lod = false"].join(", ")})
    {
        var p = new JsRecord<string>();
${sets.join("\n")}
        return BuildWith(p, lod);
    }

    /** Builds the model from parameter values by name, as the JS model's build(THREE, values, lod) does. */
    public static ModelNode BuildWith(JsRecord<string> values, bool lod = false)
    {
        MeshBuilder m = lod ? ${lodFn.moduleClass}.${lodFn.name}(${callArgs(d.lodArgs)}) : ${build.moduleClass}.${build.name}(${callArgs(d.buildArgs)});
        return m.ToModelNode(Id);
    }
}
`;
}


export interface TranspileReport {
  designs: Array<{ id: string; source: string; bundleModules: string[] }>;
  modules: string[];
  inventory: Record<string, number>;
  stats: Record<string, number>;
}

/** Transpiles the designs and writes the C# project. Throws TranspileError listing every unsupported construct. */
export async function writeProject(ids: string[]): Promise<TranspileReport> {
  const designs = ids.map(pilotDesign);
  const bundles = await Promise.all(designs.map(bundleInputs));
  const t = new Transpiler(GENERATOR_DIR, path.join(ROOT, "tsconfig.json"));
  const result = t.transpile(
    designs.map((d) => ({ source: d.source, names: [d.build, d.buildLod] })),
    [{ source: "meshCore.ts", name: "MeshCore" }],
  );
  fs.rmSync(path.join(OUT_DIR, "Generated"), { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT_DIR, "Generated"), { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "Runtime"), { recursive: true });
  for (const [name, code] of result.files) fs.writeFileSync(path.join(OUT_DIR, "Generated", name), code);
  const api = designs.map((d) => designApi(d, DESIGNS.get(d.id)!.params ?? [], t.entryTarget(d.source, d.build), t.entryTarget(d.source, d.buildLod), DESIGNS.get(d.id)!.bound)).join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "Generated", "Designs.g.cs"), `// Generated by tools/cs-transpile: one class per design, one enum per parameter.\n#nullable disable\nusing RailIsland.Factory.Runtime;\n\nnamespace RailIsland.Factory.Generated;\n\n${api}\n/** Every transpiled design by id, for the dump and bench tool. */\npublic static class DesignTable\n{\n    public static readonly System.Collections.Generic.Dictionary<string, System.Func<JsRecord<string>, bool, ModelNode>> ById = new()\n    {\n${designs.map((d) => `        [${JSON.stringify(d.id)}] = ${apiClass(d.id)}.BuildWith,`).join("\n")}\n    };\n}\n`);
  for (const f of fs.readdirSync(path.join(HERE, "runtime"))) fs.copyFileSync(path.join(HERE, "runtime", f), path.join(OUT_DIR, "Runtime", f));
  fs.copyFileSync(path.join(HERE, "tool", "Program.cs"), path.join(OUT_DIR, "Program.cs"));
  fs.copyFileSync(path.join(HERE, "tool", "RailIsland.Models.csproj"), path.join(OUT_DIR, "RailIsland.Models.csproj"));
  const report: TranspileReport = {
    designs: designs.map((d, i) => ({ id: d.id, source: d.source, bundleModules: bundles[i]! })),
    modules: result.modules,
    inventory: Object.fromEntries(result.inventory),
    stats: { ...result.stats },
  };
  fs.writeFileSync(path.join(OUT_DIR, "transpile.json"), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

/**
 * Transpiles every design of the catalog at once, without writing or compiling, and
 * counts what the supported subset does not cover yet, by kind: the measured basis of
 * the pilot's estimate for the whole catalog (docs/impl/2026-11-21-csharp-transpiler-pilot.md).
 */
export function survey(): void {
  const designs = [...DESIGNS.keys()].sort().map(pilotDesign);
  const entries = new Map<string, Set<string>>();
  for (const d of designs) {
    const names = entries.get(d.source) ?? new Set<string>();
    names.add(d.build);
    names.add(d.buildLod);
    entries.set(d.source, names);
  }
  const t = new Transpiler(GENERATOR_DIR, path.join(ROOT, "tsconfig.json"));
  const t0 = performance.now();
  let errors: string[] = [];
  let stats: Record<string, number> = {};
  let modules = 0;
  try {
    const r = t.transpile([...entries].map(([source, names]) => ({ source, names: [...names].sort() })), [{ source: "meshCore.ts", name: "MeshCore" }]);
    stats = r.stats;
    modules = r.modules.length;
  } catch (e) {
    if (!(e instanceof TranspileError)) throw e;
    errors = [...new Set(e.message.split("\n").slice(1))];
  }
  // per design: clean when no error lies in a declaration it reaches
  const where = errors.map((line) => {
    const m = line.match(/^([^:]+):(\d+):\d+:/) ?? line.match(/ at ([^:]+):(\d+):\d+$/);
    return m ? { file: m[1]!, line: Number(m[2]) } : null;
  });
  const clean: string[] = [];
  for (const d of designs) {
    const spans = t.reachFrom([{ source: d.source, names: [d.build, d.buildLod] }], [{ source: "meshCore.ts", name: "MeshCore" }]).map((x) => t.span(x));
    const dirty = where.some((w) => w !== null && spans.some((sp) => sp.file === w.file && w.line >= sp.from && w.line <= sp.to));
    if (!dirty) clean.push(d.id);
  }
  const kinds = new Map<string, number>();
  const files = new Map<string, number>();
  for (const line of errors) {
    const kind = line.replace(/^[^:]+:\d+:\d+: /, "").replace(/ at [^ ]+:\d+:\d+$/, "").replace(/\): .*/, ")").replace(/(unsupported type ).*/, "$1...").replace(/(transpiler failure[^:]*): .*/, "$1");
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
    const file = line.match(/^([^:]+):\d+:\d+:/)?.[1] ?? line.match(/ at ([^:]+):\d+:\d+$/)?.[1] ?? "?";
    files.set(file, (files.get(file) ?? 0) + 1);
  }
  const out = {
    designs: designs.length,
    sourceModules: entries.size,
    seconds: Math.round((performance.now() - t0) / 100) / 10,
    unsupported: errors.length,
    byKind: Object.fromEntries([...kinds].sort((a, b) => b[1] - a[1])),
    filesWithErrors: files.size,
    cleanDesigns: clean.length,
    errorsWithoutLocation: where.filter((w) => w === null).length,
    byFile: Object.fromEntries([...files].sort((a, b) => b[1] - a[1]).slice(0, 40)),
    ...(modules ? { modules, stats } : {}),
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "survey.json"), `${JSON.stringify({ ...out, errors, clean }, null, 2)}\n`);
  console.log(JSON.stringify(out, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes("--survey")) {
  survey();
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes("--fixtures")) {
  const { runFixtures } = await import("./fixtures.ts");
  if (!(await runFixtures())) process.exitCode = 1;
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // --ids a,b,c: any designs instead of the pilot's
  const listed = process.argv.find((a) => a.startsWith("--ids="))?.slice(6).split(",").filter(Boolean);
  const ids = listed?.length ? listed : [...PILOT_IDS, ...(process.argv.includes("--truck") ? STRETCH_IDS : [])];
  try {
    const report = await writeProject(ids);
    console.log(`transpiled ${report.stats.declarations} declarations from ${report.modules.length} modules into ${report.stats.lines} lines of C# (${OUT_DIR})`);
    console.log(`classes: ${report.stats.dataClasses} shape classes (${report.stats.anonymousShapes} anonymous, ${report.stats.mergedUnions} merged unions), ${report.stats.conversions} conversions between shapes`);
  } catch (e) {
    if (e instanceof TranspileError) {
      console.error(e.message);
      process.exit(1);
    }
    throw e;
  }
  if (!process.argv.includes("--no-run")) {
    const { runPilot } = await import("./compare.ts");
    await runPilot(ids);
  }
}
