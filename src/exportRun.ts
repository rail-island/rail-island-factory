// Running an export: the export list's model variants built in the browser from
// their JS modules and written as one file -- a GRF for OpenTTD (sprites drawn
// with WebGL, encoded by openttd/grf.ts) or a ZIP of GLBs (three's
// GLTFExporter). Lazily imported by the export panel, so three and the exporters
// load only when somebody exports.

import { Box3, Group, type Object3D } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import type { CatalogRecord } from "./catalogQuery";
import { glbFileName, safeName, type ExportEntry } from "./exportList";
import { loadModel } from "./modelModule";
import { encodeGrf, GRF_ZOOM, type GrfImage, type GrfPart, type GrfVehicle } from "./openttd/grf";
import { zoomImages } from "./openttd/pixels";
import { spriteViews, type ModelBox } from "./openttd/projection";
import {
  assignIds, blockSize, grfIdBytes, MAX_PARTS, oneClickItems, openttdFeature, partKey, partLengths, presetBaseId, resolveItem, shares,
  type ExportCar, type ExportItem, type OpenttdFeature,
} from "./openttd/properties";
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

/** One car of a vehicle the GRF holds, measured: its values, box and parts. */
interface PlannedCar {
  car: ExportCar;
  box: ModelBox;
  lengths: number[];
}

/** One vehicle the GRF holds, measured: its item, type and cars. */
interface Planned {
  item: ExportItem;
  feature: OpenttdFeature;
  cars: PlannedCar[];
}

/** A car's model, built at its values; a turned car is wrapped and turned about its vertical axis. */
async function carModel(r: CatalogRecord, car: ExportCar): Promise<{ object: Object3D; dispose: () => void }> {
  const { object } = await loadModel(r, car.params);
  if (!car.turned) return { object, dispose: () => disposeModel(object) };
  const turned = new Group();
  turned.rotation.y = Math.PI;
  turned.add(object);
  return { object: turned, dispose: () => disposeModel(object) };
}

/**
 * An OpenTTD GRF of every vehicle entry; buildings and cable cars are skipped.
 * `grfid` is the low 16 bits of its GRF id, the user's (0x8000..0xFFFF). An entry
 * that is one of its model's presets keeps that preset's ids from the table.
 */
export async function exportGrf(
  entries: readonly ExportEntry[], records: ReadonlyMap<string, CatalogRecord>, name: string, grfid: number,
  onProgress: (p: ExportProgress) => void, signal: AbortSignal,
): Promise<ExportResult> {
  const skipped: string[] = [];
  const items: ExportItem[] = [];
  for (const e of entries) {
    const r = records.get(e.id);
    if (!r) {
      skipped.push(`${e.id}: no longer in the catalog`);
      continue;
    }
    if (!openttdFeature(r)) {
      skipped.push(`${r.title}: OpenTTD has no vehicle of this kind`);
      continue;
    }
    const baseId = presetBaseId(r, e.params);
    items.push({ record: r, key: { ...e.params }, cars: [{ params: { ...e.params } }], ...(baseId !== undefined ? { baseId } : {}) });
  }
  if (items.length === 0) throw new Error("The export list holds no vehicle OpenTTD can take.");
  const bytes = await buildGrf(items, {
    grfid: grfIdBytes(grfid),
    name,
    description: (n) => `Rail Island Factory models (factory.railisland.com): ${n} vehicle${n === 1 ? "" : "s"}.`,
  }, onProgress, signal);
  return { fileName: `${safeName(name)}.grf`, blob: new Blob([bytes], { type: "application/octet-stream" }), skipped };
}

/**
 * The one-click download of one model (docs/site/openttd-export.md): a GRF of its
 * presets and formations, grouped under its default in OpenTTD's purchase list,
 * named after the model, its GRF id from the model id.
 */
export async function exportModelGrf(
  record: CatalogRecord, onProgress: (p: ExportProgress) => void, signal: AbortSignal,
): Promise<ExportResult> {
  if (!openttdFeature(record)) throw new Error(`${record.title}: OpenTTD has no vehicle of this kind`);
  const ids = record.openttd?.ids;
  if (!ids) throw new Error(`${record.title}: the catalog gives it no OpenTTD ids`);
  const items = oneClickItems(record);
  const bytes = await buildGrf(items, {
    grfid: grfIdBytes(ids.grf),
    name: record.title,
    description: (n) => `${record.title} from Rail Island Factory (factory.railisland.com/#/model/${record.id}): ${n} vehicle${n === 1 ? "" : "s"}.`,
  }, onProgress, signal);
  return { fileName: `${safeName(record.id)}.grf`, blob: new Blob([bytes], { type: "application/octet-stream" }), skipped: [] };
}

/** Measure, draw and encode the items: the bytes of the GRF. */
async function buildGrf(
  items: readonly ExportItem[], meta: { grfid: Uint8Array; name: string; description: (vehicles: number) => string },
  onProgress: (p: ExportProgress) => void, signal: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> {
  // First pass: every car's box, and how many parts it becomes.
  const planned: Planned[] = [];
  for (const item of items) {
    const feature = openttdFeature(item.record)!;
    const cars: PlannedCar[] = [];
    for (const car of item.cars) {
      await yieldToPage(signal);
      const { object, dispose } = await carModel(item.record, car);
      const box = boxOf(object);
      dispose();
      cars.push({ car, box, lengths: partLengths(box.max[0] - box.min[0], feature) });
    }
    const total = cars.reduce((n, c) => n + c.lengths.length, 0);
    if (total > MAX_PARTS) throw new Error(`${item.record.title}: ${total} parts, over OpenTTD's ${MAX_PARTS}`);
    planned.push({ item, feature, cars });
  }
  // Local ids per vehicle type: a table block's consecutive ids for a preset or
  // formation, every other part's key hashed above the table's range.
  const keysOf = (p: Planned): string[] => {
    const n = p.cars.reduce((k, c) => k + c.lengths.length, 0);
    return Array.from({ length: n }, (_, i) => partKey(p.item.record.id, p.item.key, i));
  };
  for (const p of planned) {
    const n = p.cars.reduce((k, c) => k + c.lengths.length, 0);
    if (p.item.baseId !== undefined && n > blockSize(p.item)) {
      throw new Error(`${p.item.record.title}: ${n} parts, over the ${blockSize(p.item)} ids the table reserves for it`);
    }
  }
  const hashed = new Map<OpenttdFeature, Map<string, number>>();
  for (const f of ["train", "road", "ship", "aircraft"] as const) {
    hashed.set(f, assignIds(planned.filter((p) => p.feature === f && p.item.baseId === undefined).flatMap(keysOf)));
  }
  const partId = (p: Planned, k: number): number =>
    p.item.baseId !== undefined ? p.item.baseId + k : hashed.get(p.feature)!.get(partKey(p.item.record.id, p.item.key, k))!;
  // Second pass: draw every part's 8 directions.
  const renderer = new SpriteRenderer();
  const vehicles: GrfVehicle[] = [];
  try {
    for (const [i, p] of planned.entries()) {
      onProgress({ done: i, total: planned.length, label: p.item.formation ? `${p.item.record.title} (${p.item.formation})` : p.item.record.title });
      const { vehicle, cars } = resolveItem(p.item);
      const parts: GrfPart[] = [];
      for (const [c, pc] of p.cars.entries()) {
        await yieldToPage(signal);
        const { object, dispose } = await carModel(p.item.record, pc.car);
        SpriteRenderer.prepare(object);
        const views = spriteViews(p.feature, pc.box, pc.lengths, p.item.record.game?.draftFrac ?? 0);
        const carFigures = cars[c]!;
        const split = shares(carFigures.capacity, views.length);
        for (const [k, dirs] of views.entries()) {
          parts.push({
            id: partId(p, parts.length),
            length: pc.lengths[k]!,
            directions: dirs.map((view) => zoomImages(renderer.render(object, view, SUPERSAMPLE), view, SUPERSAMPLE)),
            ...(views.length > 1 || p.cars.length > 1 ? { capacity: split[k]!, cargo: carFigures.cargo, refitClasses: carFigures.refitClasses } : {}),
            ...(c > 0 && k === 0 ? { weight: carFigures.weight } : {}),
          });
        }
        dispose();
      }
      const parent = p.item.variantOf;
      vehicles.push({ vehicle, parts, ...(parent !== undefined && parent !== i ? { variantOf: vehicles[parent]!.parts[0]!.id } : {}) });
    }
  } finally {
    renderer.dispose();
  }
  onProgress({ done: planned.length, total: planned.length, label: "Encoding" });
  await yieldToPage(signal);
  return encodeGrf({ grfid: meta.grfid, name: meta.name, description: meta.description(vehicles.length), vehicles });
}

/** One part of a vehicle drawn for the OpenTTD preview: its eighths and, per direction asked for, its normal and 4x images. */
export interface PreviewPart {
  length: number;
  images: Map<number, { "1x": GrfImage; "4x": GrfImage }>;
}

/**
 * The sprites the GRF would hold for one item, drawn for the OpenTTD preview
 * (OpenttdPreview.tsx): only the directions its scene's slots need, the normal
 * and 4x images of each - the very pixels the export writes.
 */
export async function previewSprites(item: ExportItem, directions: readonly number[], signal: AbortSignal): Promise<PreviewPart[]> {
  const feature = openttdFeature(item.record);
  if (!feature) throw new Error(`${item.record.title}: OpenTTD has no vehicle of this kind`);
  const renderer = new SpriteRenderer();
  const out: PreviewPart[] = [];
  try {
    for (const car of item.cars) {
      await yieldToPage(signal);
      const { object, dispose } = await carModel(item.record, car);
      const box = boxOf(object);
      const lengths = partLengths(box.max[0] - box.min[0], feature);
      SpriteRenderer.prepare(object);
      const views = spriteViews(feature, box, lengths, item.record.game?.draftFrac ?? 0);
      for (const [k, dirs] of views.entries()) {
        const images = new Map<number, { "1x": GrfImage; "4x": GrfImage }>();
        for (const d of directions) {
          const zooms = zoomImages(renderer.render(object, dirs[d]!, SUPERSAMPLE), dirs[d]!, SUPERSAMPLE);
          images.set(d, { "1x": zooms.find((z) => z.zoom === GRF_ZOOM.normal)!, "4x": zooms.find((z) => z.zoom === GRF_ZOOM.in4x)! });
        }
        out.push({ length: lengths[k]!, images });
      }
      dispose();
    }
  } finally {
    renderer.dispose();
  }
  return out;
}
