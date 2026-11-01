// A model's Sounds block on its page (docs/site/catalog-site.md, "Sounds"): each
// slot of the variant on screen -- a vehicle's horn and engine, a building's bell --
// with its design, the values pinned for this model and the controls to hear it
// the way the game plays it: a horn's calls, an engine's drive on sliders while it
// runs, a bell's toll. The designs are the factory's copy of the game's sounds
// (sounds/sounds.js, `pnpm import:sounds`), loaded the first time a page with
// sounds opens. Leaving the page, stepping to another model or choosing another
// variant stops whatever still sounds.

import { For, Show, createEffect, createMemo, createResource, createSignal, on, onCleanup } from "solid-js";
import type { LoopDesign, OneShotDesign, SoundDesign, SoundValues } from "../sounds/sounds.js";
import { SLOT_TITLES, pinText, slotControls, slotsFor, soundPageUrl, type GameSounds, type SoundSlot, type SoundSlotName } from "./modelSounds";
import { createAudition, type Audition } from "./soundAudition";

const loadSounds = () => import("../sounds/sounds.js");

let output: { ctx: AudioContext; out: AudioNode } | null = null;
/** One AudioContext for the site, made on the first press (browsers start it only on a gesture). */
function audio(): { ctx: AudioContext; out: AudioNode } {
  if (!output) {
    const ctx = new AudioContext();
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    output = { ctx, out: comp };
  }
  if (output.ctx.state === "suspended") void output.ctx.resume();
  return output;
}

export function SoundsPanel(props: { id: string; game: GameSounds | undefined; nonDefault: Record<string, string> }) {
  const slots = createMemo(() => slotsFor(props.game, props.nonDefault));
  const [mod] = createResource(() => (slots().length ? true : false), loadSounds);
  let audition: Audition | null = null;
  const [running, setRunning] = createSignal(false);
  const stop = () => {
    audition?.stopAll();
    setRunning(false);
  };
  // Another model or another variant: what the old one played stops.
  createEffect(on([() => props.id, () => JSON.stringify(props.nonDefault)], stop, { defer: true }));
  onCleanup(stop);

  const play = (design: SoundDesign, values: SoundValues) => {
    if (!audition) {
      const { ctx, out } = audio();
      audition = createAudition(ctx, out);
    }
    if (design.kind === "oneShot") audition.playOnce(design as OneShotDesign, values);
    else {
      audition.startLoop(design as LoopDesign, values);
      setRunning(true);
    }
  };

  return (
    <Show when={slots().length > 0}>
      <fieldset class="factory-params factory-sounds">
        <legend>Sounds</legend>
        <Show when={mod()} fallback={<p class="factory-muted">{mod.error ? "The sounds did not load." : "Loading the sounds..."}</p>}>
          {(m) => (
            <For each={slots()}>
              {([slot, value]) => (
                <SlotRow slot={slot} value={value} design={m().soundById(value.id)} running={running()} onPlay={play} onSet={(v) => audition?.set(v)} onStop={stop} />
              )}
            </For>
          )}
        </Show>
        <p class="factory-muted factory-params__note">Played the way the game plays them; the game sets a horn's call and an engine's drive itself.</p>
      </fieldset>
    </Show>
  );
}

function SlotRow(props: {
  slot: SoundSlotName;
  value: SoundSlot;
  design: SoundDesign | undefined;
  running: boolean;
  onPlay: (design: SoundDesign, values: SoundValues) => void;
  onSet: (values: SoundValues) => void;
  onStop: () => void;
}) {
  const pins = () => props.value.params ?? {};
  const controls = createMemo(() => (props.design ? slotControls(props.slot, props.design.params, props.value.calls) : null));
  const [drive, setDrive] = createSignal<Record<string, number>>({});
  const driveValues = (): SoundValues => {
    const c = controls();
    const base = c?.kind === "drive" ? Object.fromEntries(c.sliders.map((s) => [s.name, s.value])) : {};
    return { ...pins(), ...base, ...drive() };
  };
  return (
    <div class="factory-sound">
      <div class="factory-sound__head">
        <span class="factory-sound__slot">{SLOT_TITLES[props.slot]}</span>
        <a href={soundPageUrl(props.value.id)} target="_blank" rel="noopener" title="Open on the sound catalog">
          {props.design?.title ?? props.value.id}
        </a>
        <span class="factory-rowid">{props.value.id}</span>
      </div>
      <Show when={Object.keys(pins()).length > 0}>
        <p class="factory-muted factory-sound__pins">
          {Object.entries(pins())
            .map(([k, v]) => pinText(props.design?.params ?? [], k, v))
            .join(", ")}
        </p>
      </Show>
      <Show when={props.design} fallback={<p class="factory-error">The factory's sounds have no "{props.value.id}": run `pnpm import:sounds`.</p>}>
        {(d) => (
          <div class="factory-sound__controls">
            <Show when={controls()?.kind === "calls" && controls()}>
              {(c) => (
                <For each={(c() as { calls: Array<{ value: string; title: string }> }).calls}>
                  {(call) => (
                    <button type="button" class="factory-btn" onClick={() => props.onPlay(d(), { ...pins(), call: call.value })}>
                      {call.title}
                    </button>
                  )}
                </For>
              )}
            </Show>
            <Show when={controls()?.kind === "play"}>
              <button type="button" class="factory-btn" onClick={() => props.onPlay(d(), pins())}>
                Play
              </button>
            </Show>
            <Show when={controls()?.kind === "drive" && controls()}>
              {(c) => (
                <>
                  <button type="button" class="factory-btn" onClick={() => (props.running ? props.onStop() : props.onPlay(d(), driveValues()))}>
                    {props.running ? "Stop" : "Start"}
                  </button>
                  <For each={(c() as { sliders: Array<{ name: string; title: string; min: number; max: number; step: number; value: number }> }).sliders}>
                    {(s) => (
                      <label class="factory-param factory-pose__row">
                        <span>{s.title}</span>
                        <input
                          type="range"
                          min={s.min}
                          max={s.max}
                          step={s.step}
                          value={drive()[s.name] ?? s.value}
                          onInput={(e) => {
                            setDrive({ ...drive(), [s.name]: Number(e.currentTarget.value) });
                            props.onSet(driveValues());
                          }}
                        />
                        <output class="factory-pose__value">{drive()[s.name] ?? s.value}</output>
                      </label>
                    )}
                  </For>
                </>
              )}
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
}
