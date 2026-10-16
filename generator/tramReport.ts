// Writes the measured comparison of every tram and metro transfer
// (tramComparison.ts) to assets/<folder>/COMPARISON.md. Node only:
//
//   pnpm exec tsx generator/tramReport.ts [--baseline] [key ...]
//
// --baseline stores the current model boxes as native/<key>/baseline.json (the
// first authored geometry, before any optimization); the report then lists the
// baseline's mean absolute error beside the current one.

import fs from "node:fs";
import { execSync } from "node:child_process";
import { TRAM_TRANSFERS, tramComparison, tramNativeFile, worstTramPixels, type TramComparisonRow } from "./tramComparison.ts";
import { meanAbsoluteError } from "./csdCoachComparison.ts";

const ROOT = new URL("../", import.meta.url);
const f2 = (v: number): string => v.toFixed(2);
const box = (b: number[]): string => b.map((v) => (Math.round(v * 10) / 10).toString()).join(", ");

function revision(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

/** The baseline rows' deltas, recomputed against today's annotations. */
function baselineMae(key: string, rows: TramComparisonRow[]): number | null {
  const file = tramNativeFile(TRAM_TRANSFERS.find((t) => t.key === key)!, "baseline.json");
  if (!fs.existsSync(file)) return null;
  const base = JSON.parse(fs.readFileSync(file, "utf8")) as { rows: Array<{ id: string; model: number[] }> };
  const deltas = rows.map((r) => {
    const m = base.rows.find((b) => b.id === r.id)?.model ?? r.model;
    const scale = [r.canvas[0], r.canvas[1], r.canvas[0], r.canvas[1]];
    return { delta: m.map((x, i) => (100 * x) / scale[i]! - r.sourcePercent[i]!) };
  });
  return meanAbsoluteError(deltas);
}

export function tramReport(key: string): string {
  const tr = TRAM_TRANSFERS.find((t) => t.key === key)!;
  const rows = tramComparison(key);
  const { c, kx, ky, kz } = tr.map;
  const views = [...new Set(rows.map((r) => r.view))];
  const lines = [
    `### ${tr.title} - \`${tr.source}\``,
    "",
    `Model \`${tr.id}\`${tr.params ? ` (${Object.entries(tr.params).map(([k, v]) => `${k} ${v}`).join(", ")})` : ""}. Map: X = (${f2(c)} - x) * ${kx.toFixed(4)}, Y = y * ${ky.toFixed(4)}, Z = -z * ${kz.toFixed(4)} (source metres).`,
    `Canvases: ${views.map((v) => `\`${v}.bmp\` ${rows.find((r) => r.view === v)!.canvas.join(" x ")} px`).join(", ")}, 0.1 source m a pixel, origin top left.`,
    "",
    "| id | view | element | source box px | model box px | source x / y / w / h % | model x / y / w / h % | delta pp | worst px | tol px | uncertainty |",
    "|---|---|---|---|---|---|---|---|---|---:|---|",
  ];
  for (const r of rows) {
    const mb = [r.model[0]!, r.model[1]!, r.model[0]! + r.model[2]!, r.model[1]! + r.model[3]!];
    lines.push(`| ${r.id} | ${r.view} | ${r.element} | ${box(r.box)} | ${box(mb)} | ${r.sourcePercent.map(f2).join(" / ")} | ${r.modelPercent.map(f2).join(" / ")} | ${r.delta.map(f2).join(" / ")} | ${f2(worstTramPixels(r))} | ${r.tolerancePixels} | ${r.uncertainty} |`);
  }
  const mae = meanAbsoluteError(rows);
  const base = baselineMae(key, rows);
  lines.push("", `Mean absolute error over x, y, w, h of all ${rows.length} boxes: **${mae.toFixed(3)} pp**${base === null ? "" : ` (first authored geometry: ${base.toFixed(3)} pp)`}.`, "");
  for (const v of views) {
    const vr = rows.filter((r) => r.view === v);
    lines.push(`- \`${v}\`: ${vr.length} boxes, MAE ${meanAbsoluteError(vr).toFixed(3)} pp (one pixel is ${f2(100 / vr[0]!.canvas[0])} pp across, ${f2(100 / vr[0]!.canvas[1])} pp up).`);
  }
  lines.push("");
  return lines.join("\n");
}

if (process.argv[1] && process.argv[1].endsWith("tramReport.ts")) {
  const args = process.argv.slice(2);
  const baseline = args.includes("--baseline");
  const keys = args.filter((a) => a !== "--baseline");
  const folders = new Map<string, string[]>();
  for (const tr of TRAM_TRANSFERS) {
    if (keys.length && !keys.includes(tr.key)) continue;
    if (baseline) {
      const rows = tramComparison(tr.key).map((r) => ({ id: r.id, model: r.model.map((v) => Math.round(v * 1000) / 1000) }));
      fs.writeFileSync(tramNativeFile(tr, "baseline.json"), JSON.stringify({ note: "Model boxes (px) of the first authored geometry", rows }, null, 1) + "\n");
    }
    folders.set(tr.folder, [...(folders.get(tr.folder) ?? []), tramReport(tr.key)]);
  }
  for (const [folder, sections] of folders) {
    const out = new URL(`assets/${folder}/COMPARISON.md`, ROOT);
    const head = [
      `# ${TRAM_TRANSFERS.find((t) => t.folder === folder)!.title} - native comparison`,
      "",
      "**Covers** - the measured comparison of the default build with its vlakosimdb drawing: native pixel boxes against the model's orthographic extents.",
      "**Code** - `generator/tramComparison.ts`, `generator/tramReport.ts`, `generator/trams.ts`, `generator/metro.ts`, `generator/tramKit.ts`",
      "**See also** - [trams.md](../../docs/models/trams.md), [SOURCES.md](SOURCES.md), [PHOTOS.md](PHOTOS.md)",
      "",
      "Each model box is the orthographic extent of the named source-tree scopes at rest, mapped back onto the drawing's canvas through the design's map, so the comparison is of proportions after the drawing has been scaled onto the published dimensions.",
      "Percentages: x% = 100 x / W, y% = 100 y / H, w% = 100 w / W, h% = 100 h / H; delta = model - source in percentage points; MAE is the mean of |delta| over x, y, w and h of every box.",
      `Generated by \`pnpm exec tsx generator/tramReport.ts\` at model revision \`${revision()}\`.`,
      "",
    ];
    fs.writeFileSync(out, [...head, ...sections].join("\n"));
    console.log(`wrote ${out.pathname}`);
  }
}
