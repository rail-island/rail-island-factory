// One model as a page: the interactive 3D preview and the whole spec sheet, with
// arrows stepping through the CURRENT filtered and sorted list -- so "next" means
// next in what the visitor is looking at. Escape goes back; the arrow keys step.
//
// The side panel has two tabs: the spec list, and the procedural source tree
// (SourceTreePanel), fetched from tree/<id>.json only once that tab is open.

import { For, Match, Suspense, Switch, createEffect, createMemo, createResource, lazy, onCleanup } from "solid-js";
import { COLUMNS, cellText, type DetailTab, type Row } from "./catalogQuery";
import { indexTree, type SourceTree } from "./sourceTreeView";
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
}) {
  const [tree] = createResource(() => (props.tab === "source" ? props.record.id : false), loadTree);
  // Only this model's tree: after a step the previous one lingers until the next lands.
  const index = createMemo(() => {
    const t = tree.error ? undefined : tree();
    return t && t.id === props.record.id ? indexTree(t) : null;
  });

  createEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
      else if (e.key === "ArrowLeft") props.onStep(-1);
      else if (e.key === "ArrowRight") props.onStep(1);
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  const specs = () => COLUMNS.filter((c) => c.key !== "title");

  return (
    <section class="factory-detail" aria-label={props.record.title}>
      <div class="factory-detail__stage">
        <Suspense fallback={<div class="factory-viewer factory-viewer--pending" />}>
          <ModelViewer
            record={props.record}
            tree={props.tab === "source" ? index() : null}
            selected={props.node}
            onPick={props.onNode}
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
        <div class="factory-tabs" role="tablist">
          <For each={[["specs", "Specs"], ["source", "Source"]] as const}>
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
                      {cellText(props.record, c)}
                      {c.unit ? ` ${c.unit}` : ""}
                    </dd>
                  </div>
                )}
              </For>
            </dl>
          </Match>
          <Match when={tree.error}>
            <p class="factory-error">{(tree.error as Error).message}</p>
          </Match>
          <Match when={index()}>{(ix) => <SourceTreePanel index={ix()} selected={props.node} onSelect={props.onNode} />}</Match>
          <Match when={true}>
            <p class="factory-muted">Loading the source tree...</p>
          </Match>
        </Switch>
      </div>
    </section>
  );
}
