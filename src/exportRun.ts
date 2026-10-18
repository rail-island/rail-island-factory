// Running an export: the export list's model variants built in the browser from
// their JS modules and written as one file -- a GRF for OpenTTD (sprites drawn
// with WebGL, encoded by openttd/grf.ts) or a ZIP of GLBs (three's
// GLTFExporter). Lazily imported by the export panel, so three and the exporters
// load only when somebody exports.

import { Box3, type Object3D } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { CatalogRecord } from "./catalogQuery";
import { glbFileName, safeName, type ExportEntry } from "./exportList";
import { loadModel } from "./modelModule";
import { encodeGrf, type GrfPart, type GrfVehicle } from "./openttd/grf";
import { zoomImages } from "./openttd/pixels";
import { spriteViews, type ModelBox } from "./openttd/projection";
import { assignIds, grfIdOf, openttdFeature, partKey, partLengths, resolveVehicle, type OpenttdFeature } from "./openttd/properties";
import { SpriteRenderer } from "./openttd/spriteRenderer";
import { zipStore } from "./zip";

export type ExportFormat = "grf" | "zip";

export interface ExportProgress {
  done: number;
  total: number;
  label: string;
}

export interface ExportResult {
  fileName: string;
  blob: Blob;
  /** Entries the format could not take, by title, with why. */
  skipped: string[];
}

/** The rendered supersampling: each 4x pixel is the mean of 2 x 2 samples (on top of the canvas's MSAA). */
const SUPERSAMPLE = 2;

/** Let the page paint and the Cancel button answer between pieces of work. */
function yieldToPage(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => (signal.aborted ? reject(new DOMException("Export cancelled", "AbortError")) : resolve()), 0);
  });
}

function disposeModel(obj: Object3D): void {
  obj.traverse((o) => {
    const mesh = o as { geometry?: { dispose: () => void }; material?: unknown };
    mesh.geometry?.dispose?.();
    const mat = mesh.material;
    if (Array.isArray(mat)) for (const m of mat) (m as { dispose?: () => void }).dispose?.();
    else if (mat) (mat as { dispose?: () => void }).dispose?.();
  });
}

function boxOf(obj: Object3D): ModelBox {
  obj.updateMatrixWorld(true);
  const b = new Box3().setFromObject(obj);
  return { min: [b.min.x, b.min.y, b.min.z], max: [b.max.x, b.max.y, b.max.z] };
}

/** A ZIP of one GLB per entry, built at the entry's parameter values. */
export async function exportZip(
  entries: readonly ExportEntry[], records: ReadonlyMap<string, CatalogRecord>, name: string,
  onProgress: (p: ExportProgress) => void, signal: AbortSignal,
): Promise<ExportResult> {
  const exporter = new GLTFExporter();
  const files: Array<{ name: string; data: Uint8Array }> = [];
  const skipped: string[] = [];
  for (const [i, e] of entries.entries()) {
    const r = records.get(e.id);
    onProgress({ done: i, total: entries.length, label: r?.title ?? e.id });
    await yieldToPage(signal);
    if (!r) {
      skipped.push(`${e.id}: no longer in the catalog`);
      continue;
    }
    const { object } = await loadModel(r, e.params);
    const glb = (await exporter.parseAsync(object, { binary: true, animations: object.animations })) as ArrayBuffer;
    disposeModel(object);
    files.push({ name: glbFileName(e), data: new Uint8Array(glb) });
  }
  onProgress({ done: entries.length, total: entries.length, label: "Packing" });
  return { fileName: `${safeName(name)}.zip`, blob: new Blob([zipStore(files)], { type: "application/zip" }), skipped };
}

/** One vehicle the GRF holds, measured: its record, values, parts and box. */
interface Planned {
  record: CatalogRecord;
  entry: ExportEntry;
  feature: OpenttdFeature;
  lengths: number[];
  box: ModelBox;
}

/** An OpenTTD GRF of every vehicle entry; buildings and cable cars are skipped. */
export async function exportGrf(
  entries: readonly ExportEntry[], records: ReadonlyMap<string, CatalogRecord>, name: string,
  onProgress: (p: ExportProgress) => void, signal: AbortSignal,
): Promise<ExportResult> {
  const skipped: string[] = [];
  const planned: Planned[] = [];
  // First pass: which entries are vehicles, and how many parts each becomes.
  for (const e of entries) {
    const r = records.get(e.id);
    if (!r) {
      skipped.push(`${e.id}: no longer in the catalog`);
      continue;
    }
    const feature = openttdFeature(r);
    if (!feature) {
      skipped.push(`${r.title}: OpenTTD has no vehicle of this kind`);
      continue;
    }
    await yieldToPage(signal);
    const { object } = await loadModel(r, e.params);
    const box = boxOf(object);
    disposeModel(object);
    planned.push({ record: r, entry: e, feature, box, lengths: partLengths(box.max[0] - box.min[0], feature) });
  }
  if (planned.length === 0) throw new Error("The export list holds no vehicle OpenTTD can take.");
  // Local ids per vehicle type, from every part's key.
  const ids = new Map<OpenttdFeature, Map<string, number>>();
  for (const f of ["train", "road", "ship", "aircraft"] as const) {
    ids.set(f, assignIds(planned.filter((p) => p.feature === f).flatMap((p) => p.lengths.map((_, i) => partKey(p.entry.id, p.entry.params, i)))));
  }
  // Second pass: draw every part's 8 directions.
  const renderer = new SpriteRenderer();
  const vehicles: GrfVehicle[] = [];
  try {
    for (const [i, p] of planned.entries()) {
      onProgress({ done: i, total: planned.length, label: p.record.title });
      await yieldToPage(signal);
      const { object } = await loadModel(p.record, p.entry.params);
      SpriteRenderer.prepare(object);
      const views = spriteViews(p.feature, p.box, p.lengths, p.record.game?.draftFrac ?? 0);
      const parts: GrfPart[] = [];
      for (const [k, dirs] of views.entries()) {
        parts.push({
          id: ids.get(p.feature)!.get(partKey(p.entry.id, p.entry.params, k))!,
          length: p.lengths[k]!,
          directions: dirs.map((view) => zoomImages(renderer.render(object, view, SUPERSAMPLE), view, SUPERSAMPLE)),
        });
      }
      disposeModel(object);
      vehicles.push({ vehicle: resolveVehicle(p.record, p.entry.params), parts });
    }
  } finally {
    renderer.dispose();
  }
  onProgress({ done: planned.length, total: planned.length, label: "Encoding" });
  await yieldToPage(signal);
  const bytes = encodeGrf({
    grfid: grfIdOf(name),
    name,
    description: `Rail Island Factory models (factory.railisland.com): ${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"}.`,
    vehicles,
  });
  return { fileName: `${safeName(name)}.grf`, blob: new Blob([bytes], { type: "application/octet-stream" }), skipped };
}
