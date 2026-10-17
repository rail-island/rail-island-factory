// The narrow layout: two lines per model -- what it is, then a wrapping row of
// labelled facts -- so nothing needs a sideways scroll on a phone. The stat row
// always shows triangles, vertices and JS size, plus the column being sorted by
// when that is something else, so a reorder never hides the number behind it.

import { For, Show } from "solid-js";
import { cellText, column, formatBytes, formatNumber, type Row } from "./catalogQuery";
import { Thumb } from "./Thumb";

const ALWAYS = ["triangles", "vertices", "jsBytes"];

export function ModelCards(props: { rows: readonly Row[]; sort: string; onOpen: (r: Row) => void }) {
  const extra = () => (ALWAYS.includes(props.sort) || props.sort === "title" ? undefined : column(props.sort));
  return (
    <ul class="factory-cards">
      <For each={props.rows}>
        {(r) => (
          <li>
            <button type="button" class="factory-card" onClick={() => props.onOpen(r)}>
              <Thumb record={r} />
              <span class="factory-card__body">
                <span class="factory-card__title">
                  {r.title}
                  <span class="factory-chip">{r.group}</span>
                </span>
                <span class="factory-card__facts">
                  <span>
                    <b>{formatNumber(r.triangles)}</b> tris
                  </span>
                  <span>
                    <b>{formatNumber(r.vertices)}</b> verts
                  </span>
                  <span>
                    <b>{formatBytes(r.jsBytes)}</b>
                  </span>
                  <Show when={extra()}>
                    {(c) => (
                      <span>
                        {c().label} <b>{cellText(r, c())}</b>
                      </span>
                    )}
                  </Show>
                </span>
              </span>
            </button>
          </li>
        )}
      </For>
    </ul>
  );
}
