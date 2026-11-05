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
  /**
   * A horn's calls the game makes by itself (values of its design's `call`):
   * `departure`, `crossing`, `tunnel`. A call not listed is silent -- the game
   * plays nothing. The player's own Horn (`player`) always sounds and is never
   * listed.
   */
  calls?: string[];
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

  // The electrics whose motors differ from the derived ones (a locomotive's
  // resistors, a unit's converters, a high-speed train's wind).
  // Three-phase asynchronous motors: the converters, not a resistor locomotive's notches.
  "proc-vehicle-cd-169": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-obb-1012": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-vectron": { sounds: { engine: { id: "electric-engine-converter" } } },
  // The converter tones were measured in an ICE: it is the reference, not a high-speed train's wind.
  "proc-vehicle-ice-1": { sounds: { engine: { id: "electric-engine-converter" } } },
  // A 1960s unit with resistor control and a camshaft controller.
  "proc-vehicle-cd-451": { sounds: { engine: { id: "electric-engine-resistor" } } },

  // The world buses with electric traction (worldBuses.ts): battery buses and the modern
  // trolleybuses run on inverters; the Skoda 14Tr and 15Tr on resistor control.
  "proc-vehicle-mb-ecitaro": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-volvo-7900e": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-van-hool-exquicity": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-byd-k9": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-solaris-trollino": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-skoda-14tr": { sounds: { engine: { id: "electric-engine-resistor" } } },
  "proc-vehicle-skoda-15tr": { sounds: { engine: { id: "electric-engine-resistor" } } },
  // The world ships whose horn is a steam whistle (worldShips*.ts): the steamships, the
  // deeper the bigger. The sailing ships and rowed craft keep the derived ship's horn (a
  // foghorn): rail-island-music has no ship's bell yet.
  "proc-vehicle-ship-liberty": { sounds: { horn: { id: "steam-whistle", params: { pitch: 420 } } } },
  "proc-vehicle-ship-victory": { sounds: { horn: { id: "steam-whistle", params: { pitch: 420 } } } },
  "proc-vehicle-ship-ideal-x": { sounds: { horn: { id: "steam-whistle", params: { pitch: 430 } } } },
  "proc-vehicle-ship-seawise-giant": { sounds: { horn: { id: "steam-whistle", params: { pitch: 400 } } } },
  "proc-vehicle-ship-lng-moss": { sounds: { horn: { id: "steam-whistle", params: { pitch: 400 } } } },
  "proc-vehicle-ship-olympic": { sounds: { horn: { id: "steam-whistle", params: { pitch: 400 } } } },
  "proc-vehicle-ship-ss-united-states": { sounds: { horn: { id: "steam-whistle", params: { pitch: 400 } } } },
  "proc-vehicle-ship-normandie": { sounds: { horn: { id: "steam-whistle", params: { pitch: 400 } } } },
  "proc-vehicle-ship-ss-great-britain": { sounds: { horn: { id: "steam-whistle", params: { pitch: 500 } } } },
  "proc-vehicle-ship-swiss-paddle": { sounds: { horn: { id: "steam-whistle", params: { pitch: 560 } } } },
  "proc-vehicle-ship-elbe-paddle": { sounds: { horn: { id: "steam-whistle", params: { pitch: 580 } } } },
  "proc-vehicle-ship-sternwheeler": { sounds: { horn: { id: "steam-whistle", params: { pitch: 450 } } } },
  "proc-vehicle-ship-laker": { sounds: { horn: { id: "steam-whistle", params: { pitch: 420 } } } },

  // The world trucks with electric traction (worldTrucks.ts): the battery Tesla Semi and the
  // fuel cell Hyundai Xcient run on inverters; the rest keep the derived truck diesel.
  "proc-vehicle-tesla-semi": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-hyundai-xcient": { variants: [{ params: { variant: "fuelCell" }, sounds: { engine: { id: "electric-engine-converter" } } }] },
  // The world buses, later batches (worldBuses2.ts): the battery buses on inverters, the
  // ZiU-9 trolleybus on resistor control.
  "proc-vehicle-solaris-urbino-12e": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-ziu-9": { sounds: { engine: { id: "electric-engine-resistor" } } },
  "proc-vehicle-kyiv-12": { sounds: { engine: { id: "electric-engine-resistor" } } },
  "proc-vehicle-hess-lightram": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-proterra-catalyst": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-hyundai-elec-city": { sounds: { engine: { id: "electric-engine-converter" } } },
  "proc-vehicle-yutong-e12": { sounds: { engine: { id: "electric-engine-converter" } } },
  // The world trams (worldTramsWorld.ts): every tram rings the derived tram bell; the
  // steam tram's engine whistles and beats like a small locomotive, its trailer is silent.
  // No design fits a horse's hooves or a cable's hum yet.
  "proc-vehicle-steam-tram": {
    sounds: { horn: { id: "steam-whistle", params: { pitch: 880 }, calls: ["departure", "crossing"] }, engine: { id: "steam-chuff" } },
    variants: [{ params: { unit: "trailer" }, sounds: { horn: null, engine: null } }],
  },
};
