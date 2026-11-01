// The sounds the factory states by hand (docs/models/sounds.md): every slot that
// is not derived from a vehicle's traction, weight and hull -- the bells of the
// churches, cathedrals and towers, and any vehicle whose horn or engine differs
// from its derived one. Keyed by the exported model id (`proc-...`); a vehicle may list per-variant
// overrides keyed by the variant's non-default parameters, as `game.variants`.
//
// Kept apart from the designs on purpose: a design module is bundled into each of
// its models' JS files, so a sound stated there would rewrite every model of that
// module (all eight towers for Big Ben's bell) though none of them changed. Read
// by the export only (soundMapping.ts), never by a model.

import type { ParamValues } from "./design.ts";

// The sound types live here, not in design.ts: design.ts is bundled into every
// model's JS file, and even a type added there changes how esbuild names the
// minified identifiers of all of them.

/** A sound role the game knows how to drive. */
export type SoundSlotName = "horn" | "engine" | "bell";

/**
 * One slot of a model's sounds: a rail-island-music design id, and the values of
 * its character parameters (pitch, size, strikes, ...) pinned for this model. The
 * game sets the runtime ones (a horn's call, an engine's revs) itself.
 */
export interface SoundSlot {
  id: string;
  params?: Record<string, number | string>;
}

/** Which sound plays in each slot: horn and engine for a vehicle, bell for a building. */
export type SoundMapping = Partial<Record<SoundSlotName, SoundSlot>>;

/** A variant's change to the slots: a slot replaced, or removed with null. */
export type SoundOverride = Partial<Record<SoundSlotName, SoundSlot | null>>;

export interface DeclaredSounds {
  /** The design's slots that are not derived, or that replace a derived one. */
  sounds?: SoundMapping;
  /** A variant's slots, by its non-default parameters; null drops a slot. */
  variants?: Array<{ params: ParamValues; sounds: SoundOverride }>;
}

export const SOUND_TABLE: Readonly<Record<string, DeclaredSounds>> = {
  // The bells: the bigger the church, the deeper its bell.
  "proc-building-baroque-church": { sounds: { bell: { id: "church-bell", params: { pitch: 440, strikes: 3 } } } },
  "proc-building-church-vrchlabi": { sounds: { bell: { id: "church-bell", params: { pitch: 494, strikes: 3 } } } },
  "proc-building-twin-tower-baroque-church": { sounds: { bell: { id: "church-bell", params: { pitch: 392, strikes: 4, interval: 1.8 } } } },
  "proc-building-st-nicholas-church": { sounds: { bell: { id: "church-bell", params: { pitch: 330, strikes: 4 } } } },
  "proc-building-st-basils-cathedral": { sounds: { bell: { id: "church-bell", params: { pitch: 262, strikes: 5, interval: 1.4 } } } },
  "proc-building-prague-castle-st-vitus": { sounds: { bell: { id: "church-bell", params: { pitch: 220, strikes: 4, interval: 3, ring: 1.4 } } } },
  "proc-building-notre-dame": { sounds: { bell: { id: "notre-dame-bell" } } },
  "proc-building-tower-bell": { sounds: { bell: { id: "church-bell", params: { pitch: 587, strikes: 3 } } } },
  "proc-building-tower-bigben": { sounds: { bell: { id: "big-ben", params: { chime: "quarters" } } } },
};
