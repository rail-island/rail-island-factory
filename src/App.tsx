// The whole site: the catalog of every model the factory builds, as the webapp's
// Creator lists the game's models -- a sortable table on a wide screen, cards on
// a narrow one, or a row of variant thumbnails per model; a search box, and a
// model page with an interactive 3D preview.
//
// All of its state is the URL's query string (catalogQuery.ts parseView), so the
// browser's back button walks it and a model page can be linked to.

import { For, Match, Show, Switch, createEffect, createMemo, createResource, createSignal, onCleanup, onMount } from "solid-js";
import { COLUMNS, GROUPS, chipLabel, chipRows, parseView, prepareRows, queryRows, serializeView, shownId, type Column, type Row, type ViewState } from "./catalogQuery";
import type { ModelCatalog } from "../generator/catalog.ts";
import { ModelTable } from "./ModelTable";
import { ModelCards } from "./ModelCards";
import { ModelVariants } from "./ModelVariants";
import { ModelDetail } from "./ModelDetail";
import { ExportPanel } from "./ExportPanel";
import { EMPTY_EXPORT, addEntry, entryFor, hasEntry, loadExport, saveExport, type ExportState } from "./exportList";
import logoUrl from "./rail-island-logo.webp";

/** Where the "Add your model" link goes: the repository's README, written for a first-time contributor. */
const ADD_MODEL_URL = "https://github.com/rail-island/rail-island-factory#readme";
/** Where the Rail Island logo in the app bar goes: the game itself. */
const PLAY_URL = "https://play.railisland.com";
/** The footer's links: the game's home page and this repository. */
const HOME_URL = "https://www.railisland.com";
const REPO_URL = "https://github.com/rail-island/rail-island-factory";

async function loadCatalog(): Promise<Row[]> {
  const res = await fetch("/catalog.json");
  // `vite` serves index.html for a missing file, so check the type as well.
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) {
    throw new Error("The catalog is missing - run `pnpm build:models` first.");
  }
  return prepareRows(((await res.json()) as ModelCatalog).records);
}

export function App() {
  const [rows, { mutate }] = createResource(loadCatalog);
  const [view, setView] = createSignal<ViewState>(parseView(location.search));
  const [wide, setWide] = createSignal(true);
  // The export list (exportList.ts): read from storage once the catalog lands, written back on every change.
  const [exportState, setExportState] = createSignal<ExportState>(EMPTY_EXPORT);
  const [exportLoaded, setExportLoaded] = createSignal(false);
  const [exportDropped, setExportDropped] = createSignal(0);
  const [exportOpen, setExportOpen] = createSignal(false);
  createEffect(() => {
    const list = rows();
    if (!list || exportLoaded()) return;
    const { state, dropped } = loadExport(list);
    setExportState(state);
    setExportDropped(dropped);
    setExportLoaded(true);
  });
  createEffect(() => {
    if (exportLoaded()) saveExport(exportState());
  });

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

  const listed = createMemo(() => queryRows(rows() ?? [], view().q, view().sort, view().dir, view()));
  // What each chip row offers, from every model rather than the searched ones, so
  // the chips hold still while somebody types.
  const chips = createMemo(() => chipRows(rows() ?? [], view()));

  // One chip per row: picking a chip replaces the row's pick, picking the picked
  // chip again clears it, and a change in a row clears every row below it.
  const pickGroup = (id: string | null) => update({ group: view().group === id ? null : id, l2: null, l3: null });
  const pickL2 = (id: string | null) => update({ l2: view().l2 === id ? null : id, l3: null });
  const pickL3 = (id: string | null) => update({ l3: view().l3 === id ? null : id });
  const open = createMemo(() => (view().model ? (rows() ?? []).find((r) => r.id === view().model) : undefined));

  const onSort = (col: Column) => {
    const v = view();
    update({ sort: col.key, dir: v.sort === col.key ? (v.dir === "asc" ? "desc" : "asc") : col.dir });
  };
  // A node belongs to one model's tree: opening, closing or stepping drops it.
  const onOpen = (r: Row, params: Record<string, string> = {}) => update({ model: r.id, tab: "specs", node: null, params: { ...params } }, true);
  const onClose = () => update({ model: null, tab: "specs", node: null, params: {} }, true);
  const onStep = (delta: number) => {
    const list = listed();
    if (list.length === 0) return;
    const at = list.findIndex((r) => r.id === view().model);
    const next = list[(((at < 0 ? 0 : at + delta) % list.length) + list.length) % list.length]!;
    update({ model: next.id, node: null, params: {} });
  };

  // `pnpm dev` lists every model unmeasured (generator/devExport.ts): measure them
  // from their JS models in the browser, the open model first, then as listed.
  if (import.meta.env.DEV) {
    let started = false;
    createEffect(() => {
      if (started || !rows()?.some((r) => r.pending)) return;
      started = true;
      void import("./devCatalog").then(({ measurePending }) =>
        measurePending(
          (skip) => {
            const wanted = (r: Row | undefined) => r?.pending && !skip.has(r.id);
            const opened = open();
            return wanted(opened) ? opened : (listed().find(wanted) ?? (rows() ?? []).find(wanted));
          },
          (measured) => mutate((list) => list?.map((r) => measured.get(r.id) ?? r)),
        ),
      );
    });
  }

  const totalTris = () => listed().reduce((s, r) => s + r.triangles, 0);

  return (
    <div class="factory">
      <header class="factory-bar">
        <a class="factory-bar__logo" href={PLAY_URL} target="_blank" rel="noopener" title="Play Rail Island">
          <img src={logoUrl} alt="Rail Island" width="40" height="40" />
        </a>
        {open() ? (
          <button type="button" class="factory-btn factory-bar__back" onClick={onClose} aria-label="Back to the list">
            &larr;
          </button>
        ) : null}
        <h1 class="factory-bar__title">{open()?.title ?? "Rail Island Factory"}</h1>
        <Show when={open() && shownId(open()!)}>{(id) => <span class="factory-muted factory-bar__sub">{id()}</span>}</Show>
        <a class="factory-bar__add" href={ADD_MODEL_URL} target="_blank" rel="noopener">
          Add your model
        </a>
        <button
          type="button"
          class="factory-bar__export"
          classList={{ "factory-bar__export--on": exportOpen() }}
          aria-pressed={exportOpen()}
          disabled={!exportLoaded()}
          onClick={() => setExportOpen(!exportOpen())}
        >
          Export ({exportState().entries.length})
        </button>
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
                params={view().params}
                onParams={(params) => update({ params, node: null })}
                exported={hasEntry(exportState().entries, entryFor(record(), view().params))}
                onAddExport={() => setExportState(addEntry(exportState(), entryFor(record(), view().params)))}
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
              <div class="factory-layout" role="group" aria-label="Layout">
                <button
                  type="button"
                  class="factory-filter"
                  classList={{ "factory-filter--on": view().layout === "table" }}
                  aria-pressed={view().layout === "table"}
                  onClick={() => update({ layout: "table" })}
                >
                  Table
                </button>
                <button
                  type="button"
                  class="factory-filter"
                  classList={{ "factory-filter--on": view().layout === "thumbs" }}
                  aria-pressed={view().layout === "thumbs"}
                  onClick={() => update({ layout: "thumbs" })}
                >
                  Thumbnails
                </button>
              </div>
              <div class="factory-chips">
                <Chip label="All" on={view().group === null} onPick={() => pickGroup(null)} />
                <For each={GROUPS.filter((g) => chips().groups.includes(g.id))}>
                  {(g) => <Chip label={g.label} on={view().group === g.id} onPick={() => pickGroup(g.id)} />}
                </For>
              </div>
              <Show when={chips().l2.length > 0}>
                <div class="factory-chips">
                  <Chip label="All" on={view().l2 === null} onPick={() => update({ l2: null, l3: null })} />
                  <For each={chips().l2}>{(s) => <Chip label={chipLabel(s)} on={view().l2 === s} onPick={() => pickL2(s)} />}</For>
                </div>
              </Show>
              <Show when={chips().l3.length > 0}>
                <div class="factory-chips">
                  <Chip label="All" on={view().l3 === null} onPick={() => update({ l3: null })} />
                  <For each={chips().l3}>{(s) => <Chip label={chipLabel(s)} on={view().l3 === s} onPick={() => pickL3(s)} />}</For>
                </div>
              </Show>
              <span class="factory-totals">
                <b>{listed().length}</b> models &middot; <b>{totalTris().toLocaleString("en-US")}</b> triangles
              </span>
            </div>
            {listed().length === 0 ? (
              <p class="factory-muted">{view().q ? `No model matches "${view().q}".` : "No model matches the chosen filter."}</p>
            ) : view().layout === "thumbs" ? (
              <ModelVariants rows={listed()} onOpen={onOpen} />
            ) : wide() ? (
              <ModelTable rows={listed()} sort={view().sort} dir={view().dir} onSort={onSort} onOpen={onOpen} />
            ) : (
              <ModelCards rows={listed()} sort={view().sort} onOpen={onOpen} />
            )}
          </Match>
        </Switch>
      </main>
      <footer class="factory-footer">
        <a href={HOME_URL} target="_blank" rel="noopener">
          www.railisland.com
        </a>
        <span aria-hidden="true">&middot;</span>
        <a href={REPO_URL} target="_blank" rel="noopener">
          Rail Island Factory on GitHub
        </a>
      </footer>
      <Show when={exportOpen() && exportLoaded()}>
        <ExportPanel
          rows={rows() ?? []}
          state={exportState()}
          onState={setExportState}
          dropped={exportDropped()}
          onDismissDropped={() => setExportDropped(0)}
          onClose={() => setExportOpen(false)}
        />
      </Show>
    </div>
  );
}

/** One filter chip: an outline while off, filled while on. */
function Chip(props: { label: string; on: boolean; onPick: () => void }) {
  return (
    <button type="button" class="factory-filter" classList={{ "factory-filter--on": props.on }} aria-pressed={props.on} onClick={() => props.onPick()}>
      {props.label}
    </button>
  );
}
