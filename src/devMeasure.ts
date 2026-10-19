// `pnpm dev` only (generator/devExport.ts): the dev catalog's records come
// unmeasured (`pending`), and the page measures each from its JS model -- the
// counts, the bounding box, the JS sizes and hash, the rig and a vehicle's
// side frame -- one model at a time, so the list fills in while it is in use.
// Every thumbnail is then rendered in the browser (VariantThumb), keyed on the
// measured JS hash. A measurement is kept in localStorage under the model's id
// and JS hash, so a reload rebuilds only the models whose code changed.
//
// The counts, box, rig and side frame are the build's (generator/glbStats.ts,
// test/devExport.test.ts); the gzip size is at the browser's level, and there is
// no thumbnail size.

import { Box3, type Mesh, type Object3D } from "three";
import type { CatalogRecord } from "./catalogQuery";
import { THREE_SUBSET, jsModuleWithSource } from "./modelModule";

/** Bump when what is measured, or how, changes: part of every cache key. */
const MEASURE_VERSION = 1;
const CACHE_PREFIX = "factory-dev-measure";
/** The side frame's fixed height window and margin, metres (generator/renderGlbThumb.ts). */
const SIDE_BOTTOM_M = -0.3;
const SIDE_TOP_M = 5.7;
const SIDE_MARGIN_M = 0.3;

type Measured = Pick<
  CatalogRecord,
  "jsBytes" | "jsGzipBytes" | "jsHash" | "triangles" | "vertices" | "primitives" | "materials" | "sizeX" | "sizeY" | "sizeZ" | "rig" | "thumbSide"
>;

const mm = (v: number): number => Math.round(v * 1000) / 1000;
const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;

async function sha16(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

async function gzipBytes(text: string): Promise<number> {
  if (typeof CompressionStream === "undefined") return 0;
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

function readCache(key: string): Measured | null {
  try {
    const text = localStorage.getItem(key);
    return text ? (JSON.parse(text) as Measured) : null;
  } catch {
    return null;
  }
}

function writeCache(id: string, key: string, m: Measured): void {
  try {
    // one entry per model: drop the ones of its older builds
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(`${CACHE_PREFIX}|${id}|`) && k !== key) localStorage.removeItem(k);
    }
    localStorage.setItem(key, JSON.stringify(m));
  } catch {
    // storage full or blocked: the figures are shown, only not kept
  }
}

function dispose(root: Object3D): void {
  root.traverse((o) => {
    const mesh = o as Partial<Mesh>;
    mesh.geometry?.dispose();
    const m = mesh.material;
    if (Array.isArray(m)) m.forEach((x) => x.dispose());
    else m?.dispose();
  });
}

/** The default build's figures, from the model's JS module. */
export function measureBuild(record: CatalogRecord, object: Object3D): Omit<Measured, "jsBytes" | "jsGzipBytes" | "jsHash"> {
  object.updateMatrixWorld(true);
  let triangles = 0;
  let vertices = 0;
  let primitives = 0;
  const materials = new Set<string>();
  object.traverse((o) => {
    const mesh = o as Partial<Mesh>;
    const pos = mesh.geometry?.getAttribute("position");
    if (!mesh.isMesh || !mesh.geometry || !pos) return;
    triangles += (mesh.geometry.index?.count ?? pos.count) / 3;
    vertices += pos.count;
    primitives += 1;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (m) materials.add(m.name || m.uuid);
  });
  const box = new Box3().setFromObject(object, true);
  const empty = box.isEmpty();
  const min = empty ? [0, 0, 0] : box.min.toArray();
  const max = empty ? [0, 0, 0] : box.max.toArray();
  const rig = object.userData.rig as CatalogRecord["rig"];
  return {
    triangles,
    vertices,
    primitives,
    materials: materials.size,
    sizeX: mm(max[0]! - min[0]!),
    sizeY: mm(max[1]! - min[1]!),
    sizeZ: mm(max[2]! - min[2]!),
    rig: rig ? (JSON.parse(JSON.stringify(rig)) as CatalogRecord["rig"]) : undefined,
    thumbSide: record.thumbSide
      ? { widthM: r4(max[0]! - min[0]! + 2 * SIDE_MARGIN_M), heightM: r4(SIDE_TOP_M - SIDE_BOTTOM_M), bottomM: SIDE_BOTTOM_M }
      : undefined,
  };
}

/** The record with its figures measured and `pending` dropped. */
export async function measureRecord(record: CatalogRecord): Promise<CatalogRecord> {
  const { mod, text } = await jsModuleWithSource(`/${record.jsUrl}`);
  const jsHash = await sha16(text);
  const key = `${CACHE_PREFIX}|${record.id}|${jsHash}|v${MEASURE_VERSION}`;
  let measured = readCache(key);
  if (!measured) {
    const object = mod.default(THREE_SUBSET, {}, false);
    try {
      measured = { jsBytes: new TextEncoder().encode(text).length, jsGzipBytes: await gzipBytes(text), jsHash, ...measureBuild(record, object) };
    } finally {
      dispose(object);
    }
    writeCache(record.id, key, measured);
  }
  const { pending: _pending, rig: _rig, thumbSide: _side, ...rest } = record;
  return {
    ...rest,
    ...measured,
    ...(measured.rig ? { rig: measured.rig } : {}),
    ...(measured.thumbSide ? { thumbSide: measured.thumbSide } : {}),
  } as CatalogRecord;
}
