// The wide layout: a comparison grid. Headers sort, as the toolbar's <select>
// does; both drive the same state. The whole row opens the model.

import { For } from "solid-js";
import { COLUMNS, cellText, type Column, type Row, type SortDir } from "./catalogQuery";
import { Thumb } from "./Thumb";

const TABLE_COLUMNS = COLUMNS.filter((c) => c.table);

function ariaSort(active: boolean, dir: SortDir): "ascending" | "descending" | "none" {
  return !active ? "none" : dir === "asc" ? "ascending" : "descending";
}

export function ModelTable(props: {
  rows: readonly Row[];
  sort: string;
  dir: SortDir;
  onSort: (col: Column) => void;
  onOpen: (r: Row) => void;
}) {
  return (
    <div class="factory-tablewrap">
      <table class="factory-table">
        <thead>
          <tr>
            <th scope="col" class="factory-table__thumbcol">
              <span class="factory-sr">Preview</span>
            </th>
            <For each={TABLE_COLUMNS}>
              {(c) => (
                <th scope="col" class={c.type === "text" ? "" : "factory-num"} aria-sort={ariaSort(props.sort === c.key, props.dir)}>
                  <button type="button" onClick={() => props.onSort(c)}>
                    {c.label}
                    {c.unit ? <span class="factory-unit"> {c.unit}</span> : null}
                    <span class="factory-caret" aria-hidden="true">
                      {props.sort === c.key ? (props.dir === "asc" ? "\u25b2" : "\u25bc") : ""}
                    </span>
                  </button>
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(r) => (
              <tr onClick={() => props.onOpen(r)} tabindex="0" onKeyDown={(e) => e.key === "Enter" && props.onOpen(r)}>
                <td class="factory-table__thumbcol">
                  <Thumb record={r} />
                </td>
                <For each={TABLE_COLUMNS}>
                  {(c) =>
                    c.key === "title" ? (
                      <th scope="row">
                        {r.title}
                        <span class="factory-rowid">{r.id}</span>
                      </th>
                    ) : (
                      <td class={c.type === "text" ? "" : "factory-num"}>{cellText(r, c)}</td>
                    )
                  }
                </For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
