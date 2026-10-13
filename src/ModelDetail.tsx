// One model as a page: the interactive 3D preview and the whole spec sheet, with
// arrows stepping through the CURRENT filtered and sorted list -- so "next" means
// next in what the visitor is looking at. Escape goes back; the arrow keys step.

import { For, Suspense, createEffect, lazy, onCleanup } from "solid-js";
import { COLUMNS, cellText, type Row } from "./catalogQuery";

// three, GLTFLoader and OrbitControls arrive only once somebody opens a model.
const ModelViewer = lazy(() => import("./ModelViewer").then((m) => ({ default: m.ModelViewer })));

export function ModelDetail(props: {
  record: Row;
  /** Position within the current list, 1-based; 0 when the model is filtered out. */
  index: number;
  total: number;
  onStep: (delta: number) => void;
  onClose: () => void;
}) {
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
          <ModelViewer record={props.record} />
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
      </div>
    </section>
  );
}
