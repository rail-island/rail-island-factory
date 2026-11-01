// The sounds a model makes (docs/models/sounds.md): which rail-island-music
// design plays in each of its slots -- a vehicle's horn and engine, a building's
// bell -- with the character parameters pinned for it. The game drives the rest
// (a horn's call, an engine's revs and effort) from what it knows each frame.
//
// A design states the slots that differ from its default; a vehicle's other
// slots are derived here at export from its traction and weight (a ship's from
// its hull length), so every exported vehicle carries explicit sounds and the
// game holds no rule of its own about which vehicle sounds how.
//
// Pure, no `node:` imports: the designs are checked against the factory's
// committed copy of the music export (sounds/sounds.meta.json, refreshed by
// `pnpm import:sounds`), which is read as JSON.

import catalog from "../sounds/sounds.meta.json";
import legacySources from "./legacyCatalog.json";
import legacyTargets from "./legacyTargets.json";
import { proceduralId } from "./modelId.ts";
import { SOUND_TABLE, type DeclaredSounds } from "./soundTable.ts";
import { resolveParams, type ParamValues, type ProceduralDesign, type VehicleGameVariant } from "./design.ts";
import type { SoundMapping, SoundOverride, SoundSlot, SoundSlotName } from "./soundTable.ts";

/** The music export's format the factory reads (also checked by importSounds.ts). */
export const SOUNDS_FORMAT_SUPPORTED = 1;

/** sounds.meta.json, the parts the factory reads. */
export interface SoundsCatalog {
  format: number;
  sounds: Array<{
    id: string;
    title: string;
    kind: "oneShot" | "loop";
    params: Array<
      | { name: string; kind: "number"; min: number; max: number; default: number }
      | { name: string; kind: "choice"; values: Array<{ value: string }>; default: string }
    >;
  }>;
}

export const SOUNDS_CATALOG = catalog as SoundsCatalog;

/** Every slot, in the order the site and the export list them. */
export const SOUND_SLOTS: readonly SoundSlotName[] = ["horn", "engine", "bell"];

/** What each slot plays: a one-shot horn or bell, a loop engine. */
export const SLOT_KINDS: Record<SoundSlotName, "oneShot" | "loop"> = { horn: "oneShot", engine: "loop", bell: "oneShot" };

/**
 * The parameters the game sets on each slot as it plays: never pinned by a model.
 * A horn's call is why it sounds; an engine's revs, effort and whether it runs
 * (diesel: `state`) or its beat rate and effort (steam) follow the vehicle frame
 * by frame.
 */
export const RUNTIME_PARAMS: Record<SoundSlotName, readonly string[]> = {
  horn: ["call"],
  engine: ["rpm", "load", "state", "rate", "intensity"],
  bell: [],
};

/** The calls the game makes on a horn by itself; `player` is the player's and always sounds. */
export const AUTO_CALLS: readonly string[] = ["departure", "crossing", "tunnel"];

/** The slots a vehicle may have, and a building's. */
export const VEHICLE_SLOTS: readonly SoundSlotName[] = ["horn", "engine"];
export const BUILDING_SLOTS: readonly SoundSlotName[] = ["bell"];

/** What is wrong with one slot, against the imported designs; empty when it plays. */
export function slotProblems(slot: SoundSlotName, value: SoundSlot, sounds: SoundsCatalog = SOUNDS_CATALOG): string[] {
  const design = sounds.sounds.find((s) => s.id === value.id);
  if (!design) return [`${slot}: no sound design "${value.id}" (run \`pnpm import:sounds\`?)`];
  const out: string[] = [];
  if (design.kind !== SLOT_KINDS[slot]) out.push(`${slot}: "${value.id}" is a ${design.kind}, the slot plays a ${SLOT_KINDS[slot]}`);
  for (const [name, v] of Object.entries(value.params ?? {})) {
    if (RUNTIME_PARAMS[slot].includes(name)) {
      out.push(`${slot}: "${name}" is set by the game as it plays, not pinned`);
      continue;
    }
    const p = design.params.find((x) => x.name === name);
    if (!p) out.push(`${slot}: "${value.id}" has no parameter "${name}"`);
    else if (p.kind === "number" && (typeof v !== "number" || v < p.min || v > p.max)) out.push(`${slot}: "${name}" ${String(v)} is outside ${p.min}..${p.max}`);
    else if (p.kind === "choice" && !p.values.some((x) => x.value === v)) out.push(`${slot}: "${name}" has no value "${String(v)}"`);
  }
  if (value.calls) {
    const call = design.params.find((x) => x.name === "call");
    if (slot !== "horn" || !call || call.kind !== "choice") out.push(`${slot}: "${value.id}" has no call, so it takes no calls`);
    else {
      for (const c of value.calls) {
        if (!AUTO_CALLS.includes(c)) out.push(`${slot}: call "${c}" is not one the game makes by itself (${AUTO_CALLS.join(", ")})`);
        else if (!call.values.some((x) => x.value === c)) out.push(`${slot}: "${value.id}" has no call "${c}"`);
      }
      if (new Set(value.calls).size !== value.calls.length) out.push(`${slot}: a call is listed twice`);
    }
  }
  return out;
}

/** What soundTable.ts states for a design, if anything. */
export function declaredSounds(design: ProceduralDesign, table: Readonly<Record<string, DeclaredSounds>> = SOUND_TABLE): DeclaredSounds | undefined {
  return table[proceduralId(design.id)];
}

/**
 * Checks a design's stated sounds (soundTable.ts) and its variants' overrides:
 * known slots for a vehicle or a building, designs the factory's import has, of
 * the slot's kind, only character parameters pinned and within their ranges, and
 * variants that are real non-default selections. A design never states `sounds`
 * in its own `game` (that would rewrite every model of its module). Throws,
 * naming the design.
 */
export function checkDesignSounds(
  design: ProceduralDesign,
  vehicle: boolean,
  sounds: SoundsCatalog = SOUNDS_CATALOG,
  table: Readonly<Record<string, DeclaredSounds>> = SOUND_TABLE,
): void {
  const allowed = vehicle ? VEHICLE_SLOTS : BUILDING_SLOTS;
  const problems: string[] = [];
  const own = design.game as { sounds?: unknown; variants?: Array<{ sounds?: unknown }> } | undefined;
  if (own?.sounds || own?.variants?.some((v) => v.sounds)) problems.push("are stated in generator/soundTable.ts, not on the design");
  const check = (map: SoundOverride | undefined, where: string) => {
    for (const [slot, value] of Object.entries(map ?? {}) as Array<[SoundSlotName, SoundSlot | null]>) {
      if (!allowed.includes(slot)) {
        problems.push(`${where}${slot}: not a ${vehicle ? "vehicle" : "building"} slot (${allowed.join(", ")})`);
        continue;
      }
      if (value) problems.push(...slotProblems(slot, value, sounds).map((p) => where + p));
    }
  };
  const declared = declaredSounds(design, table);
  check(declared?.sounds, "");
  const specs = design.params ?? [];
  for (const v of declared?.variants ?? []) {
    const where = `variant ${JSON.stringify(v.params)}: `;
    try {
      const resolved = resolveParams(specs, v.params);
      for (const [name, value] of Object.entries(v.params)) {
        if (resolved[name] !== value || specs.find((s) => s.name === name)!.default === value) problems.push(`${where}"${name}" is not a non-default value that applies`);
      }
    } catch (e) {
      problems.push(`${where}${(e as Error).message}`);
    }
    if (!vehicle) problems.push(`${where}a building's bell has no variants`);
    check(v.sounds, where);
  }
  if (problems.length) throw new Error(`${design.id}: sounds ${problems.join("; ")} (docs/models/sounds.md)`);
}

/** The table's ids that name no design of `designs` (a typo, a retired model). */
export function unknownTableIds(designs: readonly ProceduralDesign[], table: Readonly<Record<string, DeclaredSounds>> = SOUND_TABLE): string[] {
  const ids = new Set(designs.map((d) => proceduralId(d.id)));
  return Object.keys(table).filter((id) => !ids.has(id));
}

// --- The derived defaults --------------------------------------------------
// The rules the game used to apply itself, moved here so a model's voice sits
// next to its weight: the heavier a locomotive, the deeper its horn or whistle
// and the bigger its diesel; the longer a ship, the deeper and longer its horn.

const HORN_PITCH_LIGHT = 370;
const HORN_PITCH_HEAVY = 220;
const WHISTLE_PITCH_LIGHT = 880;
const WHISTLE_PITCH_HEAVY = 520;
const HEAVY_TONNES = 140;
const LIGHT_TONNES = 40;
const SHIP_SMALL = 20;
const SHIP_BIG = 120;
/** The game draws a vehicle at 1.5 studs to the model's metre (its VehicleMotion SCALE). */
export const STUDS_PER_METRE = 1.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const heaviness = (tonnes: number) => clamp((tonnes - LIGHT_TONNES) / (HEAVY_TONNES - LIGHT_TONNES), 0, 1);

/** A steam locomotive whistles as it leaves a platform, before a crossing and at a tunnel mouth. */
export const STEAM_CALLS: readonly string[] = ["departure", "crossing", "tunnel"];
/** Every other rail vehicle leaves quietly: its horn sounds before a crossing and at a tunnel mouth. */
export const HORN_CALLS: readonly string[] = ["crossing", "tunnel"];

/**
 * A rail vehicle's horn: a steam locomotive whistles, everything else blows the
 * air horn; with the calls the game makes on it by itself.
 */
export function railHorn(steam: boolean, tonnes: number): SoundSlot {
  const t = heaviness(tonnes);
  return steam
    ? { id: "steam-whistle", params: { pitch: Math.round(lerp(WHISTLE_PITCH_LIGHT, WHISTLE_PITCH_HEAVY, t)) }, calls: [...STEAM_CALLS] }
    : { id: "loco-horn", params: { pitch: Math.round(lerp(HORN_PITCH_LIGHT, HORN_PITCH_HEAVY, t)) }, calls: [...HORN_CALLS] };
}

/** A diesel locomotive this heavy or heavier runs the mainline V12; a lighter one the shunter's six. */
export const MAINLINE_TONNES = 80;

/**
 * A rail diesel's engine: a railcar or a diesel unit (`group` "unit") runs the
 * railcar's underfloor six, a locomotive the shunter's six under MAINLINE_TONNES
 * and the mainline V12 from there; the heavier, the bigger and lower it fires
 * within its engine (`size`). The game sets `state`, `rpm` and `load`.
 */
export function dieselEngine(tonnes: number, group?: string): SoundSlot {
  const kind = group === "unit" ? "railcar" : tonnes < MAINLINE_TONNES ? "shunter" : "mainline";
  return { id: `diesel-engine-${kind}`, params: { size: Number(heaviness(tonnes).toFixed(2)) } };
}

/** A road vehicle's engine: a bus's turbocharged six, a truck's air-cooled V8, each as measured. */
export function roadEngine(group: string | undefined): SoundSlot | undefined {
  if (group === "bus") return { id: "diesel-engine-bus" };
  if (group === "truck") return { id: "diesel-engine-truck" };
  return undefined;
}

/** A ship's horn from its hull length in studs: a small boat toots high and short. */
export function shipHorn(hullStuds: number): SoundSlot {
  const t = clamp((hullStuds - SHIP_SMALL) / (SHIP_BIG - SHIP_SMALL), 0, 1);
  return { id: "ship-horn", params: { pitch: Math.round(lerp(196, 70, t)), seconds: Number(lerp(0.7, 2.2, t).toFixed(2)) } };
}

/** What the derivation reads of a vehicle besides its game properties. */
export interface SoundSource {
  category: string;
  /** The catalog group: a rail `unit` or `loco`, a road `bus` or `truck`. */
  group?: string;
  traction?: string;
  /** A ship's hull length on the game's map, in studs. */
  hullStuds?: number;
}

/**
 * The sounds derived for a vehicle weighing `weight` tonnes: every rail vehicle
 * has a horn (a consist sounds its first locomotive's, or its first car's), a
 * steam locomotive its exhaust beat and a diesel its engine (a railcar's, a
 * shunter's or a mainline one); a bus or a truck its diesel engine; a ship its
 * horn. Aircraft and cable cars get none: no designs fit them yet.
 */
export function derivedSounds(src: SoundSource, weight: number | null | undefined): SoundMapping {
  if (src.category === "Rail vehicles") {
    if (weight == null) return {};
    const steam = src.traction === "steam";
    const out: SoundMapping = { horn: railHorn(steam, weight) };
    if (steam) out.engine = { id: "steam-chuff" };
    else if (src.traction === "diesel") out.engine = dieselEngine(weight, src.group);
    return out;
  }
  if (src.category === "Road vehicles") {
    const engine = roadEngine(src.group);
    return engine ? { engine } : {};
  }
  if (src.category === "Ships" && src.hullStuds) return { horn: shipHorn(src.hullStuds) };
  return {};
}

const sameSlot = (a: SoundSlot | undefined, b: SoundSlot | undefined) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** The design's slots: the derived ones, each replaced by a stated one. */
function designSlots(design: ProceduralDesign, src: SoundSource, declared: SoundMapping): SoundMapping {
  const derived = derivedSounds(src, design.game?.weight);
  const out: SoundMapping = {};
  for (const slot of SOUND_SLOTS) {
    const v = declared[slot] ?? derived[slot];
    if (v) out[slot] = JSON.parse(JSON.stringify(v)) as SoundSlot;
  }
  return out;
}

/**
 * A design's game properties as exported, with its sounds: `game.sounds` holds
 * every slot of the default model (stated in soundTable.ts, or derived), and each
 * variant whose derived slots differ (a heavier livery's horn) or that the table
 * lists carries `sounds` with the slots that change -- null for one it drops. A
 * variant only the table lists is appended with its parameters and sounds alone.
 * A slot the design states is not re-derived per variant.
 */
export function withSounds<G extends { weight?: number | null; sounds?: SoundMapping; variants?: Array<VehicleGameVariant & { sounds?: SoundOverride }> }>(
  game: G | undefined,
  design: ProceduralDesign,
  src: SoundSource,
  table: Readonly<Record<string, DeclaredSounds>> = SOUND_TABLE,
): G | undefined {
  const stated = declaredSounds(design, table);
  const declared = stated?.sounds ?? {};
  const base = designSlots(design, src, declared);
  const key = (p: ParamValues) => JSON.stringify(Object.entries(p).sort());
  const overrideOf = (v: { params: ParamValues; weight?: number | null }): SoundOverride => {
    const own = stated?.variants?.find((x) => key(x.params) === key(v.params))?.sounds ?? {};
    const derived = derivedSounds(src, v.weight !== undefined ? v.weight : design.game?.weight);
    const sounds: SoundOverride = {};
    for (const slot of SOUND_SLOTS) {
      if (slot in own) sounds[slot] = own[slot] ?? null;
      else if (!declared[slot] && !sameSlot(derived[slot], base[slot])) sounds[slot] = derived[slot] ?? null;
    }
    return sounds;
  };
  const variants: Array<VehicleGameVariant & { sounds?: SoundOverride }> = (game?.variants ?? []).map((v) => {
    const sounds = overrideOf(v);
    const { sounds: _old, ...rest } = v;
    return Object.keys(sounds).length ? { ...rest, sounds } : rest;
  });
  for (const v of stated?.variants ?? []) {
    if (!variants.some((x) => key(x.params) === key(v.params))) variants.push({ params: { ...v.params }, sounds: overrideOf(v) });
  }
  if (!game && !Object.keys(base).length) return game;
  const out = { ...(game ?? {}), sounds: base } as G;
  if (variants.length) out.variants = variants as G["variants"];
  return out;
}

/**
 * A slot map with a variant's override applied: the game's and the site's view of
 * one parameter selection. `values` are the selection; a variant matches when its
 * `params` equal the selection's non-default values exactly.
 */
export function soundsFor(
  game: { sounds?: SoundMapping; variants?: Array<{ params: ParamValues; sounds?: SoundOverride }> } | undefined,
  nonDefault: ParamValues,
): SoundMapping {
  const out: SoundMapping = { ...(game?.sounds ?? {}) };
  const key = JSON.stringify(Object.entries(nonDefault).sort());
  const variant = game?.variants?.find((v) => JSON.stringify(Object.entries(v.params).sort()) === key);
  for (const [slot, v] of Object.entries(variant?.sounds ?? {}) as Array<[SoundSlotName, SoundSlot | null]>) {
    if (v) out[slot] = v;
    else delete out[slot];
  }
  return out;
}

/** Every design id a game block names, for the catalog's Sounds column. */
export function soundIdsOf(game: { sounds?: SoundMapping; variants?: Array<{ sounds?: SoundOverride }> } | undefined): string[] {
  const ids = new Set<string>();
  for (const slot of SOUND_SLOTS) if (game?.sounds?.[slot]) ids.add(game.sounds[slot]!.id);
  for (const v of game?.variants ?? []) for (const slot of SOUND_SLOTS) if (v.sounds?.[slot]) ids.add(v.sounds[slot]!.id);
  return [...ids];
}

// --- A ship's hull on the game's map ---------------------------------------

type LegacySource = { id: string; kind: string; category: string; sizeX: number; archived?: boolean };
type LegacyTarget = { designId: string };

/**
 * A ship's hull length on the game's map, in studs. A ship that stands in for an
 * old model is drawn at that model's length (the legacy table scales it along its
 * length, legacyMapping.ts), so its hull is the old model's; any other is its own
 * measured length at its `game.scale`. `measuredLength` sizes the model in metres.
 */
export function shipHullStuds(design: ProceduralDesign, measuredLength: () => number): number {
  const targets = legacyTargets as Record<string, LegacyTarget>;
  const primary = (legacySources as LegacySource[]).find(
    (s) => !s.archived && ["ship", "aircraft"].includes(s.category) && targets[s.id] !== undefined && proceduralId(targets[s.id]!.designId) === proceduralId(design.id),
  );
  const metres = primary ? primary.sizeX : measuredLength() * (design.game?.scale ?? 1);
  return Math.round(metres * STUDS_PER_METRE * 1e4) / 1e4;
}

/** The default parameter values of a design, for measuring it. */
export function defaultValues(design: ProceduralDesign): ParamValues {
  return resolveParams(design.params ?? []);
}
