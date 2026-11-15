// The caches a design's code keeps between builds (a cab face's skins and scans,
// seriesCab.ts): module-level maps that speed up building many combinations of one
// design. A standalone JS model that bundles any of them exports releaseCaches()
// (jsModel.ts), so a host that builds design after design in one process -- the
// game's asset build imports hundreds of modules and can never unload one -- empties
// them when it is done with a design instead of holding every module's caches to
// the end (docs/models/js-format.md, "Build caches").

const caches: Array<Map<unknown, unknown>> = [];

/** A new module-level cache, emptied by releaseCaches(). */
export function buildCache<K, V>(): Map<K, V> {
  const cache = new Map<K, V>();
  caches.push(cache as Map<unknown, unknown>);
  return cache;
}

/** Empties every build cache; later builds work their entries out afresh, to the same bytes. */
export function releaseCaches(): void {
  for (const cache of caches) cache.clear();
}

/** How many entries the build caches hold (tests). */
export function cachedEntries(): number {
  return caches.reduce((n, cache) => n + cache.size, 0);
}
