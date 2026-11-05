// The world vehicle fleet (docs/specs/2026-11-05-world-vehicle-fleet.md,
// docs/models/world-fleet.md): every design built from a family kit's spec, the
// kit options each one uses, and the covering sample the catalog sweep checks in
// full (test/catalogCache.ts). The data checks of test/worldFleet.test.ts run on
// every one of them; `pnpm build` builds and checks them all.

import { cabinDatums, roofOf, type CabinSpec } from "./cabinKit.ts";
import { WORLD_CABIN_SPECS } from "./worldCabins.ts";
import { proceduralId } from "./modelId.ts";

/** A fleet design as the harness sees it: its id, the kit options it uses, a size to find the family's largest. */
export interface FleetEntry {
  id: string;
  family: string;
  features: readonly string[];
  size: number;
}

/** The kit options a cabin spec uses. */
export function cabinFeatures(s: CabinSpec, params: readonly string[]): string[] {
  const glassDecks = s.stations.filter(([, , m], i) => m === "glass" && (i === 0 || s.stations[i - 1]![2] !== "glass")).length;
  return [
    `hanger:${s.hanger.kind}`,
    ...(s.hanger.kind === "carriage" ? [s.hanger.track > 0 ? "track:double" : "track:single", s.hanger.yoke ? "yoke" : "no-yoke"] : []),
    `glazed-decks:${glassDecks}`,
    ...(s.deck ? ["top-deck"] : []),
    ...(s.corner >= Math.min(s.hx, s.hz) - 1e-9 ? ["plan:round"] : ["plan:rounded-rect"]),
    ...(s.doors.both ? ["doors:both"] : ["doors:one"]),
    ...(s.roofBoxes?.length ? ["roof-equipment"] : []),
    ...(s.stations[0]![2] === "glass" ? ["glass-floor"] : []),
    ...params.map((p) => `param:${p}`),
  ];
}

/** Every fleet design, family by family. */
export const WORLD_FLEET: readonly FleetEntry[] = [
  ...WORLD_CABIN_SPECS.map((c) => {
    const s = c.spec();
    return { id: proceduralId(c.id), family: "cabins", features: cabinFeatures(s, (c.params ?? []).map((p) => p.name)), size: 8 * s.hx * s.hz * cabinDatums(s).y1 + roofOf(s) };
  }),
];

/**
 * The covering sample of `entries`: greedily the design that adds the most kit
 * options not yet covered (ties to the earlier one), until every option of every
 * entry is covered, plus each family's largest design. Deterministic: the same
 * list gives the same sample.
 */
export function coverSample(entries: readonly FleetEntry[]): string[] {
  const picked = new Set<string>();
  const covered = new Set<string>();
  const key = (e: FleetEntry, f: string): string => `${e.family}/${f}`;
  for (;;) {
    let best: FleetEntry | null = null;
    let gain = 0;
    for (const e of entries) {
      if (picked.has(e.id)) continue;
      const g = e.features.filter((f) => !covered.has(key(e, f))).length;
      if (g > gain) { best = e; gain = g; }
    }
    if (!best) break;
    picked.add(best.id);
    for (const f of best.features) covered.add(key(best, f));
  }
  for (const family of new Set(entries.map((e) => e.family))) {
    const largest = entries.filter((e) => e.family === family).reduce((a, b) => (b.size > a.size ? b : a));
    picked.add(largest.id);
  }
  return entries.map((e) => e.id).filter((id) => picked.has(id));
}

/** The fleet designs the catalog sweep checks in full; `pnpm build` checks the rest. */
export const FLEET_SWEEP_SAMPLE: ReadonlySet<string> = new Set(coverSample(WORLD_FLEET));
