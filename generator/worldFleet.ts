// The world vehicle fleet (docs/specs/2026-11-05-world-vehicle-fleet.md,
// docs/models/world-fleet.md): every design built from a family kit's spec, the
// kit options each one uses, and the covering sample the catalog sweep checks in
// full (test/catalogCache.ts). The data checks of test/worldFleet.test.ts run on
// every one of them; `pnpm build` builds and checks them all.

import { cabinDatums, roofOf, type CabinSpec } from "./cabinKit.ts";
import { WORLD_CABIN_SPECS } from "./worldCabins.ts";
import { WORLD_BUS_SPECS } from "./worldBuses.ts";
import { busFeatures } from "./worldBusKit.ts";
import { proceduralId } from "./modelId.ts";
// the world ships
import { shipFeatures, shipLength } from "./hullKit.ts";
import { CARGO_SHIP_SPECS } from "./worldShipsCargo.ts";
import { SERVICE_SHIP_SPECS } from "./worldShipsService.ts";
import { PASSENGER_SHIP_SPECS } from "./worldShipsPassenger.ts";
import { SMALL_SHIP_SPECS } from "./worldShipsSmall.ts";
// the world aircraft (docs/models/world-aircraft.md)
import { aircraftFeatures } from "./airframeKit.ts";
import { airshipFeatures, rotorFeatures } from "./rotorKit.ts";
import { WORLD_JET_SPECS } from "./worldJets.ts";
import { WORLD_PROP_SPECS } from "./worldProps.ts";
import { ROTOR_SPECS, WORLD_ROTORCRAFT_SPECS, zeppelinNtSpec } from "./worldRotorcraft.ts";
import { coverageCombinations } from "./design.ts";
import type { WorldAircraft } from "./worldAircraft.ts";

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
  ...WORLD_BUS_SPECS.map((b) => {
    // the largest: the longest of its parameter combinations (an articulated length)
    const lengths = (b.params ?? []).flatMap((p) => p.values.map((v) => b.spec({ [p.name]: v.value }).length));
    const s = b.spec();
    return { id: proceduralId(b.id), family: "buses", features: busFeatures(s, (b.params ?? []).map((p) => p.name)), size: Math.max(s.length, ...lengths) * s.height };
  }),
  // the world ships: the largest is the longest
  ...[...CARGO_SHIP_SPECS, ...SERVICE_SHIP_SPECS, ...PASSENGER_SHIP_SPECS, ...SMALL_SHIP_SPECS].map((w) => {
    const s = w.spec();
    return { id: proceduralId(w.id), family: "ships", features: shipFeatures(s, (w.params ?? []).map((p) => p.name)), size: shipLength(s) };
  }),
  // the world aircraft: the options of every parameter combination; the largest by length times span
  ...[...WORLD_JET_SPECS, ...WORLD_PROP_SPECS, ...WORLD_ROTORCRAFT_SPECS].map((a) => aircraftEntry(a)),
];

/** A world aircraft's fleet entry: the kit options its combinations use (a float or ski variant's too). */
function aircraftEntry(a: WorldAircraft): FleetEntry {
  const names = (a.params ?? []).map((p) => p.name);
  const combos = coverageCombinations(a.params, a.finishParams);
  const features = new Set<string>();
  let size = 0;
  for (const p of combos) {
    if (a.spec) {
      const s = a.spec(p);
      aircraftFeatures(s, names).forEach((f) => features.add(f));
      size = Math.max(size, s.length * s.wing.span);
    } else if (ROTOR_SPECS[a.id]) {
      const s = ROTOR_SPECS[a.id]!(p);
      rotorFeatures(s, names).forEach((f) => features.add(f));
      size = Math.max(size, s.length * s.main.r * 2);
    } else {
      airshipFeatures(zeppelinNtSpec(p), names).forEach((f) => features.add(f));
      size = Math.max(size, 75.1 * 19.5);
    }
  }
  return { id: proceduralId(a.id), family: "aircraft", features: [...features], size };
}

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
