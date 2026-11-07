// What the site shows and plays of a model's sounds (docs/models/sounds.md):
// the design ids for the catalog's Sounds column, the slots of the variant on
// screen, and the controls each slot gets on the model page. Pure, no DOM:
// test/modelSounds.test.ts drives it. The site may import only types from
// generator/, so the slot rules are restated here and the test holds them to
// generator/soundMapping.ts.

import type { SoundMapping, SoundOverride, SoundSlot, SoundSlotName } from "../generator/soundTable.ts";
import type { SoundParam } from "../sounds/sounds.js";

export type { SoundMapping, SoundSlot, SoundSlotName };

/** The sound part of a record's game block. */
export interface GameSounds {
  sounds?: SoundMapping;
  variants?: Array<{ params: Record<string, string>; sounds?: SoundOverride }>;
}

export const SLOT_ORDER: readonly SoundSlotName[] = ["horn", "engine", "bell"];
export const SLOT_TITLES: Record<SoundSlotName, string> = { horn: "Horn", engine: "Engine", bell: "Bell" };

/** The parameters the game sets as it plays each slot (generator/soundMapping.ts RUNTIME_PARAMS). */
export const RUNTIME_PARAMS: Record<SoundSlotName, readonly string[]> = {
  horn: ["call"],
  engine: ["rpm", "load", "state", "rate", "intensity", "speed", "spin"],
  bell: [],
};

/** Where a design's page is on the sound catalog. */
export const SOUND_SITE = "https://sound.railisland.com";
export const soundPageUrl = (id: string) => `${SOUND_SITE}/?sound=${encodeURIComponent(id)}`;

/** Every design id a game block names, the default's slots first, then its variants'. */
export function soundIdsOf(game: GameSounds | undefined): string[] {
  const ids = new Set<string>();
  for (const slot of SLOT_ORDER) if (game?.sounds?.[slot]) ids.add(game.sounds[slot]!.id);
  for (const v of game?.variants ?? []) for (const slot of SLOT_ORDER) if (v.sounds?.[slot]) ids.add(v.sounds[slot]!.id);
  return [...ids];
}

/**
 * The slots of one parameter selection: the default's, with the variant whose
 * `params` equal `nonDefault` exactly applied (a slot replaced, or dropped by null).
 */
export function slotsFor(game: GameSounds | undefined, nonDefault: Record<string, string>): Array<[SoundSlotName, SoundSlot]> {
  const out: SoundMapping = { ...(game?.sounds ?? {}) };
  const key = JSON.stringify(Object.entries(nonDefault).sort());
  const variant = game?.variants?.find((v) => JSON.stringify(Object.entries(v.params).sort()) === key);
  for (const [slot, v] of Object.entries(variant?.sounds ?? {}) as Array<[SoundSlotName, SoundSlot | null]>) {
    if (v) out[slot] = v;
    else delete out[slot];
  }
  return SLOT_ORDER.filter((s) => out[s]).map((s) => [s, out[s]!]);
}

/** What a slot's panel offers: a button per call, sliders for an engine's drive (and its start and stop), or one Play. */
export type SlotControls =
  | { kind: "calls"; calls: Array<{ value: string; title: string }> }
  | {
      kind: "drive";
      sliders: Array<{ name: string; title: string; min: number; max: number; step: number; value: number }>;
      /** The engine starts and shuts down by its `state` (a diesel): Start plays its start, Stop its run-down. */
      states: boolean;
    }
  | { kind: "play" };

/** The call the player makes with the Horn button: it always sounds, so a slot never lists it. */
export const PLAYER_CALL = "player";

/**
 * The controls of a slot playing a design with `params`. A horn offers the calls
 * the game makes on it by itself (`calls`, the factory's mapping) and the
 * player's: a call the model does not list is silent in the game, so it gets no button.
 */
export function slotControls(slot: SoundSlotName, params: readonly SoundParam[], calls: readonly string[] = []): SlotControls {
  const runtime = params.filter((p) => RUNTIME_PARAMS[slot].includes(p.name));
  const call = runtime.find((p) => p.name === "call");
  if (call && call.kind === "choice") {
    return { kind: "calls", calls: call.values.filter((v) => v.value === PLAYER_CALL || calls.includes(v.value)).map((v) => ({ ...v })) };
  }
  if (slot === "engine") {
    return {
      kind: "drive",
      sliders: runtime.flatMap((p) => (p.kind === "number" ? [{ name: p.name, title: p.title, min: p.min, max: p.max, step: p.step, value: p.default }] : [])),
      states: runtime.some((p) => p.name === "state" && p.kind === "choice"),
    };
  }
  return { kind: "play" };
}

/** A pinned value as the panel lists it: "pitch 295 Hz". */
export function pinText(params: readonly SoundParam[], name: string, value: number | string): string {
  const p = params.find((x) => x.name === name);
  if (p?.kind === "choice") return `${name} ${p.values.find((v) => v.value === value)?.title ?? value}`;
  return `${name} ${value}${p?.kind === "number" && p.unit ? ` ${p.unit}` : ""}`;
}
