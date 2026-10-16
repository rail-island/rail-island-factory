// Writes assets/<folder>/COMPARISON.md for each locomotive of the package
// (czElectricComparison.ts): the native landmark boxes against the actual GLB
// vertices of the default build, in percent of the native canvases. The first
// run also records the measurements as assets/<folder>/native/baseline.json,
// the initial model the later revisions are compared with.
//
//   pnpm exec tsx generator/czElectricReport.ts
import fs from "node:fs";
import { execSync } from "node:child_process";
import { COMPARED, compare, mae, type ComparisonRow } from "./czElectricComparison.ts";

const root = new URL("../", import.meta.url);
let revision = "working tree";
try {
  revision = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim();
} catch {
  // not a checkout
}
const f = (v: number) => v.toFixed(2);
for (const d of COMPARED) {
  const rows = compare(d);
  const baseFile = new URL(`assets/${d.folder}/native/baseline.json`, root);
  if (!fs.existsSync(baseFile)) fs.writeFileSync(baseFile, JSON.stringify(rows.map((r) => ({ id: r.id, delta: r.delta.map((v) => Math.round(v * 1000) / 1000) })), null, 2) + "\n");
  const baseline = JSON.parse(fs.readFileSync(baseFile, "utf8")) as Array<{ id: string; delta: number[] }>;
  const baseMae = baseline.reduce((s, r) => s + r.delta.reduce((a, v) => a + Math.abs(v), 0), 0) / (4 * baseline.length);
  const views = [...new Set(rows.map((r) => r.view))];
  const viewMae = (v: string, rs: ComparisonRow[]) => mae(rs.filter((r) => r.view === v));
  const lines = [
    `# ${d.title}: native landmark comparison`,
    "",
    `**Covers** - the default build of \`${d.id}\` against ${rows.length} boxes annotated on the native vlakosimdb BMPs (\`native/landmarks.json\`).`,
    `**Code** - \`generator/czElectricComparison.ts\`, \`generator/czElectricReport.ts\`, \`test/czElectrics.test.ts\``,
    "**See also** - [SOURCES.md](SOURCES.md), [docs/models/cz-electrics.md](../../docs/models/cz-electrics.md)",
    "",
    `Model revision: \`${revision}\` (measured when this file was written). Mapping: ${d.mapping}. Canvases: ${views.map((v) => `${v} ${d.canvas[v][0]} x ${d.canvas[v][1]} px (\`${d.files[v]}\`)`).join(", ")}.`,
    "",
    "Each vector is (left, top, width, height) in native pixels; percentages are 100*x/W, 100*y/H, 100*w/W, 100*h/H of the view's canvas, origin top left. Delta = model minus source in percentage points. MAE = sum(|delta|) / (4 * boxes). Model boxes are the bounds of the actual GLB vertices of the named scopes, occluded vertices included.",
    "",
    "| View | Boxes | MAE baseline (pp) | MAE now (pp) |",
    "|---|---:|---:|---:|",
    ...views.map((v) => {
      const ids = new Set(rows.filter((r) => r.view === v).map((r) => r.id));
      const b = baseline.filter((r) => ids.has(r.id));
      const bm = b.reduce((s, r) => s + r.delta.reduce((a, x) => a + Math.abs(x), 0), 0) / (4 * Math.max(1, b.length));
      return `| ${v} | ${ids.size} | ${f(bm)} | ${f(viewMae(v, rows))} |`;
    }),
    `| all | ${rows.length} | ${f(baseMae)} | ${f(mae(rows))} |`,
    "",
    "| ID | View | Element | Source px | Model px | Source % | Model % | Delta pp | Tolerance px | Note |",
    "|---|---|---|---|---|---|---|---|---:|---|",
    ...rows.map((r) =>
      `| ${r.id} | ${r.view} | ${r.nodes.join(", ")} | ${r.source.map(f).join(", ")} | ${r.model.map(f).join(", ")} | ${r.sourcePercent.map(f).join(", ")} | ${r.modelPercent.map(f).join(", ")} | ${r.delta.map(f).join(", ")} | ${r.tolerancePixels} | ${r.uncertainty} |`,
    ),
    "",
  ];
  fs.writeFileSync(new URL(`assets/${d.folder}/COMPARISON.md`, root), lines.join("\n"));
  console.log(`${d.id}: ${rows.length} boxes, MAE ${f(baseMae)} -> ${f(mae(rows))} pp`);
  for (const r of rows) {
    const worst = Math.max(...r.model.map((v, i) => Math.abs(v - r.source[i]!)));
    if (worst > r.tolerancePixels) console.log(`  ${r.id} off by ${worst.toFixed(2)} px (tolerance ${r.tolerancePixels}): source ${r.source.map(f)} model ${r.model.map(f)}`);
  }
}
