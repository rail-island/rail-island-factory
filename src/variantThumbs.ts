// Model variant thumbnails, rendered in the browser on demand and kept in
// IndexedDB: the thumbnail view's rows and the export panel show each variant as
// it is, where the build ships only the default's picture.
//
// A request goes memory -> IndexedDB -> render. Renders run one at a time
// (thumbRender.ts, lazily imported, so three loads only when one is needed), in
// the order asked; a request dropped before its turn (its row scrolled away) is
// skipped. The cache is a PURE cache in its own database: losing it costs
// render time and nothing else, so every IndexedDB failure (none, quota, a
// blocked open) answers "not cached" and the variant is rendered. Keys carry the
// model's JS hash (variantThumbKey), so a rebuilt model gets new keys; old ones
// age out with the least recently written past MAX_RECORDS.

import { variantThumbKey, type CatalogRecord } from "./catalogQuery";

export const THUMB_DB = "factory-variant-thumbs";
const DB_VERSION = 1;
const STORE = "thumbs";
const AGE_INDEX = "at";
/** The cache's cap, in thumbnails (a few tens of kB each). */
const MAX_RECORDS = 4000;
/** Trim the cache after this many writes. */
const TRIM_EVERY = 50;

interface ThumbRecord {
  key: string;
  blob: Blob;
  at: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
let writes = 0;

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let r: IDBOpenDBRequest;
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      r = indexedDB.open(THUMB_DB, DB_VERSION);
    } catch {
      return resolve(null);
    }
    r.onupgradeneeded = () => {
      const db = r.result;
      if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
      db.createObjectStore(STORE, { keyPath: "key" }).createIndex(AGE_INDEX, "at");
    };
    r.onsuccess = () => {
      const db = r.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    r.onerror = () => resolve(null);
    r.onblocked = () => resolve(null);
  });
  return dbPromise;
}

async function readCached(key: string): Promise<Blob | null> {
  try {
    const db = await open();
    if (!db) return null;
    const rec = (await req(db.transaction(STORE, "readonly").objectStore(STORE).get(key))) as ThumbRecord | undefined;
    return rec?.blob ?? null;
  } catch {
    return null;
  }
}

async function writeCached(key: string, blob: Blob): Promise<void> {
  try {
    const db = await open();
    if (!db) return;
    await req(db.transaction(STORE, "readwrite").objectStore(STORE).put({ key, blob, at: Date.now() } satisfies ThumbRecord));
    if (++writes % TRIM_EVERY === 0) await trim(db);
  } catch {
    // quota or a closed database: the thumbnail is shown, only not kept
  }
}

/** Drop the oldest records past MAX_RECORDS. */
async function trim(db: IDBDatabase): Promise<void> {
  const store = db.transaction(STORE, "readwrite").objectStore(STORE);
  let extra = (await req(store.count())) - MAX_RECORDS;
  if (extra <= 0) return;
  const cursor = store.index(AGE_INDEX).openKeyCursor();
  await new Promise<void>((resolve, reject) => {
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (!c || extra <= 0) return resolve();
      store.delete(c.primaryKey);
      extra--;
      c.continue();
    };
    cursor.onerror = () => reject(cursor.error);
  });
}

/** Object URLs of the thumbnails shown in this visit, by key: a row scrolled back shows at once. */
const urls = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

interface Job {
  record: CatalogRecord;
  params: Record<string, string>;
  /** Whether anybody still wants it; a job nobody wants is skipped. */
  wanted: () => boolean;
  resolve: (blob: Blob) => void;
  reject: (e: unknown) => void;
}

const queue: Job[] = [];
let running = false;

async function drain(): Promise<void> {
  if (running) return;
  running = true;
  try {
    let renderer: typeof import("./thumbRender") | null = null;
    for (let job = queue.shift(); job; job = queue.shift()) {
      if (!job.wanted()) {
        job.reject(new DOMException("Not needed any more.", "AbortError"));
        continue;
      }
      try {
        renderer ??= await import("./thumbRender");
        job.resolve(await renderer.renderVariantThumb(job.record, job.params));
      } catch (e) {
        job.reject(e);
      }
      // give the page a frame between renders
      await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    running = false;
  }
}

/** The number of components currently waiting for each key. */
const wanters = new Map<string, number>();

/**
 * A variant's thumbnail as an object URL. `release` says the caller no longer
 * needs it: a render nobody needs any more is skipped when its turn comes.
 */
export function variantThumb(record: CatalogRecord, params: Record<string, string>): { url: Promise<string>; release: () => void } {
  const key = variantThumbKey(record, params);
  wanters.set(key, (wanters.get(key) ?? 0) + 1);
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    const n = (wanters.get(key) ?? 1) - 1;
    if (n > 0) wanters.set(key, n);
    else wanters.delete(key);
  };
  const ready = urls.get(key);
  if (ready) return { url: Promise.resolve(ready), release };
  let p = pending.get(key);
  if (!p) {
    p = (async () => {
      let blob = await readCached(key);
      if (!blob) {
        blob = await new Promise<Blob>((resolve, reject) => {
          queue.push({ record, params, wanted: () => wanters.has(key), resolve, reject });
          void drain();
        });
        void writeCached(key, blob);
      }
      const url = URL.createObjectURL(blob);
      urls.set(key, url);
      return url;
    })();
    pending.set(key, p);
    void p.finally(() => pending.delete(key)).catch(() => {});
  }
  return { url: p, release };
}
