// What a model page's Sounds panel is playing (src/SoundsPanel.tsx): every
// one-shot still ringing and the running engine loop, so that leaving the page
// (or stepping to the next model) stops all of it. The loop is ticked every 50 ms,
// 0.2 s ahead, as the game ticks it each frame. Like the sound catalog's own
// audition (rail-island-music src/audition.ts). No DOM: test/modelSounds.test.ts
// drives it over a stub context.

import type { LoopDesign, LoopVoice, OneShotDesign, SoundValues, Voice } from "../sounds/sounds.js";

export const HORIZON = 0.2;
export const TICK_MS = 50;
/** A press schedules this far (s) after now, so the first event is never late. */
const LEAD = 0.02;

export interface Timers {
  setInterval(fn: () => void, ms: number): unknown;
  clearInterval(id: unknown): void;
}

export interface Audition {
  playOnce(design: OneShotDesign, values: SoundValues): Voice;
  /** Start a loop, stopping one already running. */
  startLoop(design: LoopDesign, values: SoundValues): LoopVoice;
  /** New values for the running loop, if any. */
  set(values: SoundValues): void;
  stopLoop(): void;
  /** Stop everything still sounding: the loop and every one-shot. */
  stopAll(): void;
  /** Whether a loop is running. */
  looping(): boolean;
}

export function createAudition(ctx: BaseAudioContext, dest: AudioNode, timers: Timers = globalThis as unknown as Timers): Audition {
  const once = new Set<Voice>();
  let loop: LoopVoice | null = null;
  let timer: unknown = undefined;
  const prune = () => {
    for (const v of once) if (v.endsAt <= ctx.currentTime) once.delete(v);
  };
  const stopLoop = () => {
    if (timer !== undefined) timers.clearInterval(timer);
    timer = undefined;
    loop?.stop(ctx.currentTime);
    loop = null;
  };
  return {
    playOnce(design, values) {
      prune();
      const v = design.play(ctx, dest, ctx.currentTime + LEAD, values);
      once.add(v);
      return v;
    },
    startLoop(design, values) {
      stopLoop();
      const v = design.start(ctx, dest, ctx.currentTime + LEAD, values);
      loop = v;
      v.tick(ctx.currentTime, HORIZON);
      timer = timers.setInterval(() => v.tick(ctx.currentTime, HORIZON), TICK_MS);
      return v;
    },
    set(values) {
      loop?.set(values);
    },
    stopLoop,
    stopAll() {
      stopLoop();
      prune();
      for (const v of once) v.stop(ctx.currentTime);
      once.clear();
    },
    looping: () => loop !== null,
  };
}
