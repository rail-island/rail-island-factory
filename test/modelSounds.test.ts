// The site's side of a model's sounds (src/modelSounds.ts, src/soundAudition.ts):
// the Sounds column, the slots of a variant, each slot's controls, and stopping
// what a page plays. The slot rules restate generator/soundMapping.ts's, held to
// them here.

import { describe, expect, it } from "vitest";
import { RUNTIME_PARAMS as GEN_RUNTIME, SOUND_SLOTS, soundIdsOf as genSoundIds, soundsFor } from "../generator/soundMapping.ts";
import { RUNTIME_PARAMS, SLOT_ORDER, pinText, slotControls, slotsFor, soundIdsOf, soundPageUrl, type GameSounds } from "../src/modelSounds.ts";
import { createAudition } from "../src/soundAudition.ts";
import { column, prepareRows, queryRows, type CatalogRecord } from "../src/catalogQuery.ts";
import { soundById } from "../sounds/sounds.js";
import type { LoopDesign, OneShotDesign } from "../sounds/sounds.js";

const GAME: GameSounds = {
  sounds: { horn: { id: "loco-horn", params: { pitch: 300 } }, engine: { id: "diesel-engine", params: { size: 0.5 } } },
  variants: [
    { params: { livery: "red" }, sounds: { horn: { id: "loco-horn", params: { pitch: 250 } } } },
    { params: { livery: "mute", unit: "b" }, sounds: { horn: null } },
  ],
};

describe("the slot rules", () => {
  it("match the generator's", () => {
    expect(RUNTIME_PARAMS).toEqual(GEN_RUNTIME);
    expect(SLOT_ORDER).toEqual(SOUND_SLOTS);
    expect(soundIdsOf(GAME)).toEqual(genSoundIds(GAME));
  });
});

describe("a variant's slots", () => {
  it("apply the variant matching the selection exactly, in slot order", () => {
    expect(slotsFor(GAME, {})).toEqual([["horn", GAME.sounds!.horn], ["engine", GAME.sounds!.engine]]);
    expect(slotsFor(GAME, { livery: "red" })[0]![1].params).toEqual({ pitch: 250 });
    expect(slotsFor(GAME, { unit: "b", livery: "mute" }).map(([s]) => s)).toEqual(["engine"]);
    expect(slotsFor(GAME, { livery: "blue" })).toEqual(slotsFor(GAME, {}));
    expect(slotsFor(undefined, {})).toEqual([]);
    // the generator's view of the same selection
    for (const sel of [{}, { livery: "red" }, { livery: "mute", unit: "b" }] as Array<Record<string, string>>) expect(Object.fromEntries(slotsFor(GAME, sel))).toEqual(soundsFor(GAME, sel));
  });
});

describe("a slot's controls", () => {
  it("give a horn its calls, an engine its drive, a ship's horn and a bell a Play", () => {
    const calls = slotControls("horn", soundById("loco-horn")!.params);
    expect(calls.kind).toBe("calls");
    expect(calls.kind === "calls" && calls.calls.map((c) => c.value)).toEqual(["departure", "crossing", "tunnel", "player"]);
    const diesel = slotControls("engine", soundById("diesel-engine")!.params);
    expect(diesel.kind === "drive" && diesel.sliders.map((s) => s.name)).toEqual(["rpm", "load"]);
    const steam = slotControls("engine", soundById("steam-chuff")!.params);
    expect(steam.kind === "drive" && steam.sliders.map((s) => s.name)).toEqual(["rate", "intensity"]);
    expect(slotControls("horn", soundById("ship-horn")!.params)).toEqual({ kind: "play" });
    expect(slotControls("bell", soundById("big-ben")!.params)).toEqual({ kind: "play" });
  });

  it("list pinned values with their unit or choice title, and link the design's page", () => {
    expect(pinText(soundById("loco-horn")!.params, "pitch", 295)).toBe("pitch 295 Hz");
    expect(pinText(soundById("big-ben")!.params, "chime", "quarters")).toBe("chime Westminster Quarters, then the hour");
    expect(soundPageUrl("big-ben")).toBe("https://sound.railisland.com/?sound=big-ben");
  });
});

describe("the catalog's Sounds column", () => {
  const rec = (id: string, game?: GameSounds) => ({ id, title: id, category: "Rail vehicles", group: "loco", author: "", license: "", source: "", game }) as unknown as CatalogRecord;
  const rows = prepareRows([rec("a", GAME), rec("b", { sounds: { horn: { id: "steam-whistle" } } }), rec("c")]);

  it("lists the design ids, and the search finds a model by them", () => {
    expect(column("sounds")!.value(rows[0]!)).toBe("loco-horn, diesel-engine");
    expect(column("sounds")!.value(rows[2]!)).toBeNull();
    expect(queryRows(rows, "diesel-engine", "title", "asc").map((r) => r.id)).toEqual(["a"]);
    expect(queryRows(rows, "steam-whistle", "title", "asc").map((r) => r.id)).toEqual(["b"]);
  });
});

describe("the page's audition", () => {
  function stub() {
    const param = () => ({ value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {}, cancelScheduledValues: () => {}, setTargetAtTime: () => {} });
    const stops: number[] = [];
    const node = () => ({ connect: (t: unknown) => t, disconnect: () => {}, frequency: param(), detune: param(), gain: param(), Q: param(), type: "", buffer: null, loop: false, start: () => {}, stop: (at: number) => stops.push(at) });
    const ctx = { sampleRate: 48000, currentTime: 1, createGain: node, createBiquadFilter: node, createOscillator: node, createBufferSource: node, createBuffer: (_c: number, n: number) => ({ getChannelData: () => new Float32Array(n) }) } as unknown as BaseAudioContext;
    return { ctx, dest: node() as unknown as AudioNode, stops };
  }

  it("ticks a running engine and stops it and every ringing horn at once", () => {
    const { ctx, dest } = stub();
    const timers: Array<() => void> = [];
    let cleared = 0;
    const a = createAudition(ctx, dest, { setInterval: (fn) => (timers.push(fn), timers.length), clearInterval: () => void cleared++ });
    a.playOnce(soundById("loco-horn") as OneShotDesign, { call: "departure" });
    a.startLoop(soundById("diesel-engine") as LoopDesign, { rpm: 0.5 });
    expect(a.looping()).toBe(true);
    timers[0]!();
    a.stopAll();
    expect(a.looping()).toBe(false);
    expect(cleared).toBe(1);
  });
});
