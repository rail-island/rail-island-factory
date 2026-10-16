// One model as a page: the interactive 3D preview and the whole spec sheet, with
// arrows stepping through the CURRENT filtered and sorted list -- so "next" means
// next in what the visitor is looking at. Escape goes back; the arrow keys step,
// unless a slider or a select has the focus (pageKey).
//
// The side panel has up to three tabs: the spec list, the procedural source tree
// (SourceTreePanel), fetched from tree/<id>.json only once that tab is open, and
// the source images the model was made from (refs/<id>/..., listed in the catalog
// record), shown only for a model that has any.
//
// A rigged vehicle (steered wheels, an articulated body) gets a Pose block: a
// slider for the steering and one per hinge, which pose the preview through the
// model's own JS module -- the code the game is to call.
//
// A parametric model gets a Parameters block above the tabs: a <select> per enum
// parameter. Choosing a value rebuilds the preview from the model's JS module
// (ModelViewer); the source tree describes the default build, so its highlight
// and picking pause while another value is chosen.

import { For, Match, Show, Suspense, Switch, createEffect, createMemo, createResource, createSignal, lazy, on, onCleanup } from "solid-js";
import {
  COLUMNS, effectiveParams, formatBytes, isDefaultParams, nonDefaultParams, pageKey, poseControls, poseOf,
  type DetailTab, type PoseValues, type Row,
} from "./catalogQuery";
import { indexTree, type SourceTree } from "./sourceTreeView";
import { FileCell } from "./ModelTable";
import { SourceTreePanel } from "./SourceTreePanel";

// three, GLTFLoader and OrbitControls arrive only once somebody opens a model.
const ModelViewer = lazy(() => import("./ModelViewer").then((m) => ({ default: m.ModelViewer })));

async function loadTree(id: string): Promise<SourceTree> {
  const res = await fetch(`/tree/${encodeURIComponent(id)}.json`);
  // `vite` serves index.html for a missing file, so check the type as well.
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) {
    throw new Error("This model has no source tree - run `pnpm build:models`.");
  }
  return (await res.json()) as SourceTree;
}

export function ModelDetail(props: {
  record: Row;
  /** Position within the current list, 1-based; 0 when the model is filtered out. */
  index: number;
  total: number;
  onStep: (delta: number) => void;
  onClose: () => void;
  tab: DetailTab;
  /** The selected source-tree node, or null. */
  node: string | null;
  onTab: (tab: DetailTab) => void;
  onNode: (id: string | null) => void;
  /** The chosen parameter values (from the URL), and the setter, which keeps only non-defaults. */
  params: Record<string, string>;
  onParams: (params: Record<string, string>) => void;
}) {
  const [lod, setLod] = createSignal(false);
  const [triangles, setTriangles] = createSignal<number>();
  const values = createMemo(() => effectiveParams(props.record, props.params));
  const atDefaults = createMemo(() => isDefaultParams(props.record, values()));
  const choose = (name: string, value: string) => props.onParams(nonDefaultParams(props.record, { ...values(), [name]: value }));
  // A rigged model's pose: slider values in degrees, back to rest for every new model.
  const controls = createMemo(() => poseControls(props.record));
  const [pose, setPose] = createSignal<PoseValues>({});
  createEffect(on(() => props.record.id, () => setPose({})));
  const posed = createMemo(() => (controls().length ? poseOf(props.record, pose()) : null));
  const [tree] = createResource(() => (props.tab === "source" ? props.record.id : false), loadTree);
  // Only this model's tree: after a step the previous one lingers until the next lands.
  const index = createMemo(() => {
    const t = tree.error ? undefined : tree();
    return t && t.id === props.record.id ? indexTree(t) : null;
  });

  createEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = pageKey(e.key, e.target);
      if (action === "close") props.onClose();
      else if (action !== null) props.onStep(action);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  const specs = () => COLUMNS.filter((c) => c.key !== "title");
  // An export built before source images existed has no list.
  const references = () => props.record.references ?? [];
  const tabs = () =>
    ([["specs", "Specs"], ["source", "Source"], ["references", "Images"]] as const).filter(
      ([tab]) => tab !== "references" || references().length > 0 || props.tab === "references",
    );

  return (
    <section class="factory-detail" aria-label={props.record.title}>
      <div class="factory-detail__stage">
        <Suspense fallback={<div class="factory-viewer factory-viewer--pending" />}>
          <ModelViewer
            record={props.record}
            lod={lod()}
            onTriangles={setTriangles}
            params={values()}
            tree={props.tab === "source" && atDefaults() && !lod() ? index() : null}
            selected={props.node}
            onPick={props.onNode}
            pose={posed()}
          />
        </Suspense>
      </div>
      <div class="factory-detail__specs">
        <div class="factory-detail__nav">
          <button type="button" class="factory-btn" onClick={() => props.onStep(-1)} disabled={props.total < 2} aria-label="Previous model">
            &larr;
          </button>
          <span class="factory-muted">{props.index > 0 ? `${props.index} of ${props.total}` : `not in the current list`}</span>
          <button type="button" class="factory-btn" onClick={() => props.onStep(1)} disabled={props.total < 2} aria-label="Next model">
            &rarr;
          </button>
        </div>
        <label class="factory-param">
          <span>Low level of detail</span>
          <input type="checkbox" checked={lod()} onChange={(e) => setLod(e.currentTarget.checked)} />
        </label>
        <p class="factory-muted" aria-live="polite">Preview: {triangles() ?? "..."} triangles{lod() ? " (LOD)" : " (full detail)"}</p>
        <Show when={(props.record.params ?? []).length > 0}>
          <fieldset class="factory-params">
            <legend>Parameters</legend>
            <For each={(props.record.params ?? []).filter((p) => values()[p.name] !== undefined)}>
              {(p) => (
                <label class="factory-param">
                  <span>{p.title}</span>
                  <select id={`param-${p.name}`} value={values()[p.name]} onChange={(e) => choose(p.name, e.currentTarget.value)}>
                    <For each={p.values}>{(v) => <option value={v.value}>{v.value === p.default ? `${v.title} (default)` : v.title}</option>}</For>
                  </select>
                </label>
              )}
            </For>
            <Show when={!atDefaults()}>
              <p class="factory-muted factory-params__note">Built in the browser from the JS model; the GLB, thumbnail and source tree are the defaults.</p>
            </Show>
          </fieldset>
        </Show>
        <Show when={controls().length > 0 && !lod()}>
          <fieldset class="factory-params factory-pose">
            <legend>Pose</legend>
            <For each={controls()}>
              {(c) => (
                <label class="factory-param factory-pose__row">
                  <span>{c.label}</span>
                  <input
                    type="range"
                    id={`pose-${c.key}`}
                    min={-c.max}
                    max={c.max}
                    step="1"
                    value={pose()[c.key] ?? 0}
                    onInput={(e) => setPose({ ...pose(), [c.key]: Number(e.currentTarget.value) })}
                  />
                  <output for={`pose-${c.key}`} class="factory-pose__value">{`${pose()[c.key] ?? 0}\u00b0`}</output>
                </label>
              )}
            </For>
            <div class="factory-pose__foot">
              <p class="factory-muted factory-params__note">Posed by the model's JS module (pose, renderJoint), as the game would; + turns counter-clockwise seen from above.</p>
              <button type="button" class="factory-btn" onClick={() => setPose({})} disabled={Object.values(pose()).every((v) => v === 0)}>
                Reset
              </button>
            </div>
          </fieldset>
        </Show>
        <div class="factory-tabs" role="tablist">
          <For each={tabs()}>
            {([tab, label]) => (
              <button
                type="button"
                role="tab"
                class="factory-tab"
                classList={{ "factory-tab--active": props.tab === tab }}
                aria-selected={props.tab === tab}
                onClick={() => props.onTab(tab)}
              >
                {label}
              </button>
            )}
          </For>
        </div>
        <Switch>
          <Match when={props.tab === "specs"}>
            <img class="factory-detail__thumb" src={`/${props.record.thumbUrl}`} alt={`${props.record.title} thumbnail`} width="160" height="160" />
            <dl class="factory-specs">
              <For each={specs()}>
                {(c) => (
                  <div class="factory-spec">
                    <dt>{c.label}</dt>
                    <dd>
                      <FileCell row={props.record} col={c} />
                      {c.unit ? ` ${c.unit}` : ""}
                    </dd>
                  </div>
                )}
              </For>
            </dl>
          </Match>
          <Match when={props.tab === "references"}>
            <Show when={references().length > 0} fallback={<p class="factory-muted">This model has no source images.</p>}>
              <ul class="factory-refs">
                <For each={references()}>
                  {(ref) => (
                    <li class="factory-ref">
                      <a href={`/${ref.url}`} target="_blank" rel="noopener" title="Open full size">
                        <img
                          src={`/${ref.url}`}
                          alt={ref.name}
                          loading="lazy"
                          class={/\.(bmp|gif)$/i.test(ref.name) ? "factory-ref__img factory-ref__img--pixel" : "factory-ref__img"}
                        />
                      </a>
                      <span class="factory-ref__name">{ref.name}</span>
                      <span class="factory-muted">{formatBytes(ref.bytes)}</span>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </Match>
          <Match when={tree.error}>
            <p class="factory-error">{(tree.error as Error).message}</p>
          </Match>
          <Match when={index()}>
            {(ix) => (
              <>
                <Show when={!atDefaults() || lod()}>
                  <p class="factory-muted">The source tree is the default build's; highlight and picking return with the default parameters and full detail.</p>
                </Show>
                <SourceTreePanel index={ix()} selected={props.node} onSelect={props.onNode} />
              </>
            )}
          </Match>
          <Match when={true}>
            <p class="factory-muted">Loading the source tree...</p>
          </Match>
        </Switch>
      </div>
    </section>
  );
}
