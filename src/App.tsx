// The whole site: the catalog of every model the factory builds, as the webapp's
// Creator lists the game's models -- a sortable table on a wide screen, cards on
// a narrow one, or a row of variant thumbnails per model; a search box, and a
// model page with an interactive 3D preview.
//
// All of its state is the URL - the page in its path, the rest in its query string
// (catalogQuery.ts parseView) - so the browser's back button walks it and a model or
// a category can be linked to. Every model, category and chip is a real link
// (Link.tsx), and the document head follows the view (pageMeta.ts,
// docs/site/seo-pages.md).

import { For, Match, Show, Switch, createEffect, createMemo, createResource, createSignal, onCleanup, onMount } from "solid-js";
import { COLUMNS, GROUPS, NO_CHIPS, chipLabel, chipMatches, chipRows, chipSlug, countryChips, parseView, prepareRows, queryRows, sectionHeading, sectionOf, sectionRows, shownId, viewUrl, type Column, type Row, type Section, type ViewState } from "./catalogQuery";
import { SITE_URL, categoryMeta, categoryTree, homeMeta, modelMeta, type PageMeta } from "./pageMeta";
import { Link } from "./Link";
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
  const [view, setView] = createSignal<ViewState>(parseView(location.search, location.pathname));
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
    // An old all-query link (`/?model=...`, `/?cat=...`) becomes its path form in place.
    const here = `${location.pathname}${location.search}`;
    if (viewUrl(view()) !== here) history.replaceState(null, "", viewUrl(view()));
    const onPop = () => show(parseView(location.search, location.pathname));
    window.addEventListener("popstate", onPop);
    onCleanup(() => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("popstate", onPop);
    });
  });

  // The page's scroll: a model page opens at its top, whatever the list was scrolled
  // to, and closing it returns to where the list was (manual, so the browser's own
  // restoration on Back does not fight it).
  let listScroll = 0;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const show = (next: ViewState) => {
    const was = !!view().model, now = !!next.model;
    if (!was && now) listScroll = window.scrollY;
    setView(next);
    if (was !== now) window.scrollTo(0, now ? 0 : listScroll);
  };

  /**
   * Change the view. Opening or closing a model is a new history entry (Back
   * returns to the list); typing and re-sorting replace the current one, so Back
   * does not replay every keystroke.
   */
  const update = (patch: Partial<ViewState>, push = false) => {
    const next = { ...view(), ...patch };
    show(next);
    const url = viewUrl(next);
    if (push) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
  };

  const open = createMemo(() => (view().model ? (rows() ?? []).find((r) => r.id === view().model) : undefined));
  // The list the page belongs to (docs/site/workshop.md): the catalog of confirmed
  // models, or the workshop of drafts. A model page is in its own model's section,
  // so a draft linked to directly steps through the workshop.
  const section = createMemo<Section>(() => {
    const record = open();
    return record ? sectionOf(record) : view().section;
  });
  const inSection = createMemo(() => sectionRows(rows() ?? [], section()));
  const counts = createMemo(() => ({ catalog: sectionRows(rows() ?? [], "catalog").length, workshop: sectionRows(rows() ?? [], "workshop").length }));
  const listed = createMemo(() => queryRows(inSection(), view().q, view().sort, view().dir, view()));
  // What each chip row offers, from every model of the section rather than the
  // searched ones, so the chips hold still while somebody types.
  const chips = createMemo(() => chipRows(inSection(), view()));
  // The country row filters on its own: it keeps its pick while the chips above change.
  const countries = createMemo(() => countryChips(inSection(), view(), view().country));

  // One chip per row: picking a chip replaces the row's pick, picking the picked
  // chip again clears it, and a change in a row clears every row below it.
  // The view state holds chip slugs (catalogQuery.ts chipSlug). Each chip is a link to
  // the view it picks; a new category page is a history entry of its own.
  const groupPick = (id: string | null): Partial<ViewState> => ({ group: id === null || view().group === id ? null : id, l2: null, l3: null });
  const l2Pick = (v: string | null): Partial<ViewState> => ({ l2: v === null || chipMatches(v, view().l2) ? null : chipSlug(v), l3: null });
  const l3Pick = (v: string | null): Partial<ViewState> => ({ l3: v === null || chipMatches(v, view().l3) ? null : chipSlug(v) });
  const countryPick = (v: string | null): Partial<ViewState> => ({ country: v === null || chipMatches(v, view().country) ? null : chipSlug(v) });
  const hrefOf = (patch: Partial<ViewState>) => viewUrl({ ...view(), ...patch });
  const pick = (patch: Partial<ViewState>) => update(patch, true);

  const onSort = (col: Column) => {
    const v = view();
    update({ sort: col.key, dir: v.sort === col.key ? (v.dir === "asc" ? "desc" : "asc") : col.dir });
  };
  // A node belongs to one model's tree: opening, closing or stepping drops it.
  const openPatch = (r: Row, params: Record<string, string> = {}): Partial<ViewState> => ({ model: r.id, tab: "specs", node: null, stage: "3d", params: { ...params } });
  // closing returns to the list of the model's own section
  const closePatch = (): Partial<ViewState> => ({ model: null, tab: "specs", node: null, stage: "3d", params: {}, section: section() });
  const onOpen = (r: Row, params: Record<string, string> = {}) => update(openPatch(r, params), true);
  const hrefOpen = (r: Row, params: Record<string, string> = {}) => hrefOf(openPatch(r, params));
  const onClose = () => update(closePatch(), true);
  const stepPatch = (delta: number): Partial<ViewState> | null => {
    const list = listed();
    if (list.length === 0) return null;
    const at = list.findIndex((r) => r.id === view().model);
    const next = list[(((at < 0 ? 0 : at + delta) % list.length) + list.length) % list.length]!;
    return { model: next.id, node: null, params: {} };
  };
  const onStep = (delta: number) => {
    const patch = stepPatch(delta);
    if (patch) update(patch);
  };
  const stepHref = (delta: number) => {
    const patch = stepPatch(delta);
    return patch ? hrefOf(patch) : viewUrl(view());
  };

  // The document head follows the page: its title, description and canonical URL
  // are the prerendered page's (pageMeta.ts), so a shared link and a crawler agree.
  const tree = createMemo(() => categoryTree(rows() ?? []));
  const meta = createMemo((): PageMeta => {
    const v = view();
    const all = rows();
    if (!all) return homeMeta();
    const record = open();
    if (record) return modelMeta(record, tree());
    if (v.group) return categoryMeta(v, tree(), queryRows(all, "", "title", "asc", v));
    return homeMeta();
  });
  createEffect(() => applyMeta(meta()));

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
    <div class="factory" classList={{ "factory--detail": !!open() }}>
      <header class="factory-bar">
        <a class="factory-bar__logo" href={PLAY_URL} target="_blank" rel="noopener" title="Play Rail Island">
          <img src={logoUrl} alt="Rail Island" width="40" height="40" />
        </a>
        {open() ? (
          <Link class="factory-btn factory-bar__back" href={hrefOf(closePatch())} onNavigate={onClose} aria-label="Back to the list">
            &larr;
          </Link>
        ) : null}
        <h1 class="factory-bar__title">{open()?.title ?? sectionHeading(section())}</h1>
        <Show when={open() && shownId(open()!)}>{(id) => <span class="factory-muted factory-bar__sub">{id()}</span>}</Show>
        {/* on a phone both buttons shrink to their icons (factory.css), the export keeping its count */}
        <a class="factory-bar__add" href={ADD_MODEL_URL} target="_blank" rel="noopener" aria-label="Add your model" title="Add your model">
          <PlusIcon />
          <span class="factory-bar__label">Add your model</span>
        </a>
        <button
          type="button"
          class="factory-bar__export"
          classList={{ "factory-bar__export--on": exportOpen() }}
          aria-pressed={exportOpen()}
          aria-label={`Export (${exportState().entries.length})`}
          title="Export"
          disabled={!exportLoaded()}
          onClick={() => setExportOpen(!exportOpen())}
        >
          <ExportIcon />
          <span class="factory-bar__label">Export</span>
          <span class="factory-bar__count">{exportState().entries.length}</span>
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
              <Link class="factory-link" href={hrefOf(closePatch())} onNavigate={onClose}>
                Back to the list
              </Link>
            </p>
          </Match>
          <Match when={open()}>
            {(record) => (
              <ModelDetail
                record={record()}
                index={listed().findIndex((r) => r.id === record().id) + 1}
                total={listed().length}
                onStep={onStep}
                stepHref={stepHref}
                onClose={onClose}
                tab={view().tab}
                node={view().node}
                onTab={(tab) => update({ tab })}
                onNode={(node) => update({ node })}
                stage={view().stage}
                onStage={(stage) => update({ stage })}
                params={view().params}
                onParams={(params) => update({ params, node: null })}
                exported={hasEntry(exportState().entries, entryFor(record(), view().params))}
                onAddExport={() => setExportState(addEntry(exportState(), entryFor(record(), view().params)))}
              />
            )}
          </Match>
          <Match when={true}>
            <div class="factory-toolbar">
              <div class="factory-sections" role="group" aria-label="Section">
                <For each={["catalog", "workshop"] as const}>
                  {(s) => (
                    <Link
                      class="factory-filter factory-section"
                      classList={{ "factory-filter--on": section() === s }}
                      aria-current={section() === s ? "page" : undefined}
                      href={hrefOf({ section: s })}
                      onNavigate={() => pick({ section: s })}
                    >
                      {s === "workshop" ? "Workshop" : "Catalog"} <span class="factory-section__count">{counts()[s]}</span>
                    </Link>
                  )}
                </For>
              </div>
              <Show when={section() === "workshop"}>
                <p class="factory-muted factory-sections__note">Drafts not yet confirmed: they are not exported to the game.</p>
              </Show>
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
                <Chip label="All" on={view().group === null} href={hrefOf({ ...NO_CHIPS })} onPick={() => pick({ ...NO_CHIPS })} />
                <For each={GROUPS.filter((g) => chips().groups.includes(g.id))}>
                  {(g) => <Chip label={g.label} on={view().group === g.id} href={hrefOf(groupPick(g.id))} onPick={() => pick(groupPick(g.id))} />}
                </For>
              </div>
              <Show when={chips().l2.length > 0}>
                <div class="factory-chips">
                  <Chip label="All" on={view().l2 === null} href={hrefOf(l2Pick(null))} onPick={() => pick(l2Pick(null))} />
                  <For each={chips().l2}>
                    {(s) => <Chip label={chipLabel(s)} on={chipMatches(s, view().l2)} href={hrefOf(l2Pick(s))} onPick={() => pick(l2Pick(s))} />}
                  </For>
                </div>
              </Show>
              <Show when={chips().l3.length > 0}>
                <div class="factory-chips">
                  <Chip label="All" on={view().l3 === null} href={hrefOf(l3Pick(null))} onPick={() => pick(l3Pick(null))} />
                  <For each={chips().l3}>
                    {(s) => <Chip label={chipLabel(s)} on={chipMatches(s, view().l3)} href={hrefOf(l3Pick(s))} onPick={() => pick(l3Pick(s))} />}
                  </For>
                </div>
              </Show>
              <Show when={countries().length > 0}>
                <div class="factory-chips factory-chips--country" aria-label="Country">
                  <Chip label="All countries" on={view().country === null} href={hrefOf(countryPick(null))} onPick={() => pick(countryPick(null))} />
                  <For each={countries()}>
                    {(s) => <Chip label={s} on={chipMatches(s, view().country)} href={hrefOf(countryPick(s))} onPick={() => pick(countryPick(s))} />}
                  </For>
                </div>
              </Show>
              <span class="factory-totals">
                <b>{listed().length}</b> models &middot; <b>{totalTris().toLocaleString("en-US")}</b> triangles
              </span>
            </div>
            {listed().length === 0 ? (
              <p class="factory-muted">{view().q ? `No model matches "${view().q}".` : "No model matches the chosen filter."}</p>
            ) : view().layout === "thumbs" ? (
              <ModelVariants rows={listed()} onOpen={onOpen} hrefOf={hrefOpen} />
            ) : wide() ? (
              <ModelTable rows={listed()} sort={view().sort} dir={view().dir} onSort={onSort} onOpen={onOpen} hrefOf={hrefOpen} />
            ) : (
              <ModelCards rows={listed()} sort={view().sort} onOpen={onOpen} hrefOf={hrefOpen} />
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

/** The app bar's "Add your model" icon: a plus. */
function PlusIcon() {
  return (
    <svg class="factory-bar__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  );
}

/** The app bar's "Export" icon: an arrow down into a tray. */
function ExportIcon() {
  return (
    <svg class="factory-bar__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M12 4v11M7 10l5 5 5-5M5 19h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  );
}

/** One filter chip: an outline while off, filled while on. A link to the view it picks. */
function Chip(props: { label: string; on: boolean; href: string; onPick: () => void }) {
  return (
    <Link class="factory-filter" classList={{ "factory-filter--on": props.on }} aria-current={props.on ? "page" : undefined} href={props.href} onNavigate={() => props.onPick()}>
      {props.label}
    </Link>
  );
}

/** Write a page's title, description and canonical URL into the document head. */
function applyMeta(m: PageMeta) {
  document.title = m.title;
  const url = `${SITE_URL}${m.path}`;
  const set = (selector: string, attr: string, value: string) => document.querySelector(selector)?.setAttribute(attr, value);
  set('meta[name="description"]', "content", m.description);
  set('link[rel="canonical"]', "href", url);
  set('meta[property="og:url"]', "content", url);
  set('meta[property="og:title"]', "content", m.heading);
  set('meta[property="og:description"]', "content", m.description);
}
