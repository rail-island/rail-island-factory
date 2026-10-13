// The whole site: the catalog of every model the factory builds, as the webapp's
// Creator lists the game's models -- a sortable table on a wide screen, cards on
// a narrow one, a search box, and a model page with an interactive 3D preview.
//
// All of its state is the URL's query string (catalogQuery.ts parseView), so the
// browser's back button walks it and a model page can be linked to.

import { Match, Switch, createMemo, createResource, createSignal, onCleanup, onMount } from "solid-js";
import { COLUMNS, parseView, prepareRows, queryRows, serializeView, type Column, type Row, type ViewState } from "./catalogQuery";
import type { ModelCatalog } from "../generator/catalog.ts";
import { ModelTable } from "./ModelTable";
import { ModelCards } from "./ModelCards";
import { ModelDetail } from "./ModelDetail";

async function loadCatalog(): Promise<Row[]> {
  const res = await fetch("/catalog.json");
  // `vite` serves index.html for a missing file, so check the type as well.
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) {
    throw new Error("The catalog is missing - run `pnpm build:models` first.");
  }
  return prepareRows(((await res.json()) as ModelCatalog).records);
}

export function App() {
  const [rows] = createResource(loadCatalog);
  const [view, setView] = createSignal<ViewState>(parseView(location.search));
  const [wide, setWide] = createSignal(true);

  onMount(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const onPop = () => setView(parseView(location.search));
    window.addEventListener("popstate", onPop);
    onCleanup(() => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("popstate", onPop);
    });
  });

  /**
   * Change the view. Opening or closing a model is a new history entry (Back
   * returns to the list); typing and re-sorting replace the current one, so Back
   * does not replay every keystroke.
   */
  const update = (patch: Partial<ViewState>, push = false) => {
    const next = { ...view(), ...patch };
    setView(next);
    const url = `${location.pathname}${serializeView(next)}`;
    if (push) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
  };

  const listed = createMemo(() => queryRows(rows() ?? [], view().q, view().sort, view().dir));
  const open = createMemo(() => (view().model ? (rows() ?? []).find((r) => r.id === view().model) : undefined));

  const onSort = (col: Column) => {
    const v = view();
    update({ sort: col.key, dir: v.sort === col.key ? (v.dir === "asc" ? "desc" : "asc") : col.dir });
  };
  // A node belongs to one model's tree: opening, closing or stepping drops it.
  const onOpen = (r: Row) => update({ model: r.id, tab: "specs", node: null }, true);
  const onClose = () => update({ model: null, tab: "specs", node: null }, true);
  const onStep = (delta: number) => {
    const list = listed();
    if (list.length === 0) return;
    const at = list.findIndex((r) => r.id === view().model);
    const next = list[(((at < 0 ? 0 : at + delta) % list.length) + list.length) % list.length]!;
    update({ model: next.id, node: null });
  };

  const totalTris = () => listed().reduce((s, r) => s + r.triangles, 0);

  return (
    <div class="factory">
      <header class="factory-bar">
        {open() ? (
          <button type="button" class="factory-btn factory-bar__back" onClick={onClose} aria-label="Back to the list">
            &larr;
          </button>
        ) : null}
        <h1 class="factory-bar__title">{open()?.title ?? "Rail Island Factory"}</h1>
        <span class="factory-muted factory-bar__sub">{open() ? open()!.id : "procedurally generated models"}</span>
      </header>
      <main class="factory-main">
        <Switch>
          <Match when={rows.error}>
            <p class="factory-error">{(rows.error as Error).message}</p>
          </Match>
          <Match when={rows.loading}>
            <p class="factory-muted">Loading the catalog...</p>
          </Match>
          <Match when={view().model && !open()}>
            <p class="factory-error">
              No model "{view().model}".{" "}
              <button type="button" class="factory-link" onClick={onClose}>
                Back to the list
              </button>
            </p>
          </Match>
          <Match when={open()}>
            {(record) => (
              <ModelDetail
                record={record()}
                index={listed().findIndex((r) => r.id === record().id) + 1}
                total={listed().length}
                onStep={onStep}
                onClose={onClose}
                tab={view().tab}
                node={view().node}
                onTab={(tab) => update({ tab })}
                onNode={(node) => update({ node })}
              />
            )}
          </Match>
          <Match when={true}>
            <div class="factory-toolbar">
              <input
                class="factory-search"
                type="search"
                placeholder="Search models"
                aria-label="Search models"
                value={view().q}
                onInput={(e) => update({ q: e.currentTarget.value })}
              />
              <div class="factory-sortctl">
                <select aria-label="Sort by" value={view().sort} onChange={(e) => update({ sort: e.currentTarget.value, dir: COLUMNS.find((c) => c.key === e.currentTarget.value)!.dir })}>
                  {COLUMNS.map((c) => (
                    <option value={c.key}>{c.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  class="factory-dir"
                  aria-label={view().dir === "asc" ? "Ascending" : "Descending"}
                  onClick={() => update({ dir: view().dir === "asc" ? "desc" : "asc" })}
                >
                  {view().dir === "asc" ? "\u25b2" : "\u25bc"}
                </button>
              </div>
              <span class="factory-totals">
                <b>{listed().length}</b> models &middot; <b>{totalTris().toLocaleString("en-US")}</b> triangles
              </span>
            </div>
            {listed().length === 0 ? (
              <p class="factory-muted">No model matches "{view().q}".</p>
            ) : wide() ? (
              <ModelTable rows={listed()} sort={view().sort} dir={view().dir} onSort={onSort} onOpen={onOpen} />
            ) : (
              <ModelCards rows={listed()} sort={view().sort} onOpen={onOpen} />
            )}
          </Match>
        </Switch>
      </main>
    </div>
  );
}
