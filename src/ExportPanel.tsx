// The export panel: the model variants added from model pages, the set's name,
// the format (a GRF for OpenTTD or a ZIP of GLBs) and the Export button. Opened
// from the app bar's "Export (n)" button over the listing or a model page.
//
// The export itself (exportRun.ts) is a lazy import, so three's exporters and
// the GRF encoder load only when somebody exports. It runs one model at a time
// with a progress line and can be cancelled; entries the chosen format cannot
// take (a building or a cable car in a GRF) are marked here and reported after.

import { For, Show, createMemo, createSignal, onCleanup } from "solid-js";
import type { Row } from "./catalogQuery";
import { removeEntry, variantLabel, type ExportState } from "./exportList";
import type { ExportFormat, ExportProgress } from "./exportRun";
import { openttdFeature } from "./openttd/properties";
import { Thumb } from "./Thumb";

/** Hand a finished file to the browser as a download. */
function download(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function ExportPanel(props: {
  rows: readonly Row[];
  state: ExportState;
  onState: (s: ExportState) => void;
  /** Saved entries dropped on load (their model or variant is gone); 0 for none. */
  dropped: number;
  onDismissDropped: () => void;
  onClose: () => void;
}) {
  const [format, setFormat] = createSignal<ExportFormat>("grf");
  const [progress, setProgress] = createSignal<ExportProgress | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [report, setReport] = createSignal<{ fileName: string; skipped: string[] } | null>(null);
  let abort: AbortController | null = null;
  onCleanup(() => abort?.abort());

  const byId = createMemo(() => new Map(props.rows.map((r) => [r.id, r])));
  /** Whether the chosen format can take an entry: a GRF holds vehicles only. */
  const fits = (id: string): boolean => {
    const r = byId().get(id);
    return !!r && (format() === "zip" || openttdFeature(r) !== null);
  };
  const usable = () => props.state.entries.filter((e) => fits(e.id)).length;

  const run = async () => {
    setError(null);
    setReport(null);
    abort = new AbortController();
    const signal = abort.signal;
    setProgress({ done: 0, total: props.state.entries.length, label: "Loading the exporter" });
    try {
      const mod = await import("./exportRun");
      const go = format() === "grf" ? mod.exportGrf : mod.exportZip;
      const result = await go(props.state.entries, byId(), props.state.name, setProgress, signal);
      download(result.blob, result.fileName);
      setReport({ fileName: result.fileName, skipped: result.skipped });
    } catch (e) {
      setError(signal.aborted ? "Export cancelled." : (e as Error).message || String(e));
    } finally {
      setProgress(null);
      abort = null;
    }
  };

  return (
    <aside class="factory-export" aria-label="Export">
      <div class="factory-export__head">
        <h2>Export</h2>
        <button type="button" class="factory-btn" onClick={() => props.onClose()} aria-label="Close the export panel">
          &times;
        </button>
      </div>
      <Show when={props.dropped > 0}>
        <p class="factory-export__notice">
          {props.dropped === 1 ? "1 saved entry was" : `${props.dropped} saved entries were`} dropped: the model or its variant no longer exists.{" "}
          <button type="button" class="factory-link" onClick={() => props.onDismissDropped()}>
            OK
          </button>
        </p>
      </Show>
      <label class="factory-param">
        <span>Set name</span>
        <input
          class="factory-search"
          type="text"
          value={props.state.name}
          onInput={(e) => props.onState({ ...props.state, name: e.currentTarget.value })}
        />
      </label>
      <Show
        when={props.state.entries.length > 0}
        fallback={<p class="factory-muted">The export is empty. Open a model and press "Add to export" to add the variant on screen.</p>}
      >
        <ul class="factory-export__list">
          <For each={props.state.entries}>
            {(e) => {
              const r = () => byId().get(e.id);
              return (
                <li class="factory-export__item" classList={{ "factory-export__item--off": !fits(e.id) }}>
                  <Show when={r()}>{(rec) => <Thumb record={rec()} />}</Show>
                  <span class="factory-export__name">
                    {r()?.title ?? e.id}
                    <span class="factory-rowid">{variantLabel(r(), e) || "Default variant"}</span>
                    <Show when={!fits(e.id)}>
                      <span class="factory-rowid">Not in a GRF: OpenTTD has no vehicle of this kind</span>
                    </Show>
                  </span>
                  <button
                    type="button"
                    class="factory-btn"
                    aria-label={`Remove ${r()?.title ?? e.id} from the export`}
                    disabled={progress() !== null}
                    onClick={() => props.onState(removeEntry(props.state, e))}
                  >
                    &times;
                  </button>
                </li>
              );
            }}
          </For>
        </ul>
      </Show>
      <fieldset class="factory-params">
        <legend>Format</legend>
        <label class="factory-export__choice">
          <input type="radio" name="export-format" checked={format() === "grf"} onChange={() => setFormat("grf")} />
          <span>GRF for OpenTTD <span class="factory-muted">(vehicles only)</span></span>
        </label>
        <label class="factory-export__choice">
          <input type="radio" name="export-format" checked={format() === "zip"} onChange={() => setFormat("zip")} />
          <span>ZIP of GLB files</span>
        </label>
      </fieldset>
      <Show
        when={progress()}
        fallback={
          <button type="button" class="factory-btn factory-export__go" disabled={usable() === 0} onClick={() => void run()}>
            Export {format() === "grf" ? ".grf" : ".zip"} ({usable()} {usable() === 1 ? "model" : "models"})
          </button>
        }
      >
        {(p) => (
          <div class="factory-export__progress" aria-live="polite">
            <progress max={p().total || 1} value={p().done} />
            <span class="factory-muted">
              {p().done} of {p().total}: {p().label}
            </span>
            <button type="button" class="factory-btn" onClick={() => abort?.abort()}>
              Cancel
            </button>
          </div>
        )}
      </Show>
      <Show when={error()}>{(msg) => <p class="factory-error">{msg()}</p>}</Show>
      <Show when={report()}>
        {(rep) => (
          <div class="factory-export__report">
            <p>Saved {rep().fileName}.</p>
            <Show when={rep().skipped.length > 0}>
              <p class="factory-muted">Skipped:</p>
              <ul>
                <For each={rep().skipped}>{(s) => <li class="factory-muted">{s}</li>}</For>
              </ul>
            </Show>
          </div>
        )}
      </Show>
      <p class="factory-muted factory-export__foot">
        The list stays in this browser. A GRF goes into OpenTTD's <code>newgrf</code> folder and needs the 32bpp blitter, which OpenTTD picks itself.
      </p>
    </aside>
  );
}
