// The woods types (generator/woods.ts) on the site: one card per type with its
// grove -- the type's distribution function run over a small patch and rendered at
// build time (export/thumbs/woods-<name>.png), at its default parameters -- its
// stable name, its parameters (density first, with their values), and the swatch and
// forest-floor colours the game tints the ground with. Shown above the tree species
// when the Trees chip is picked.

import { For, Show, createResource } from "solid-js";
import type { WoodsMeta } from "../generator/woodsExport.ts";

async function loadWoods(): Promise<WoodsMeta | null> {
  const res = await fetch("/woods.meta.json");
  if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return null;
  return (await res.json()) as WoodsMeta;
}

const rgb = (c: { r: number; g: number; b: number }) => `rgb(${c.r}, ${c.g}, ${c.b})`;

export function WoodsGallery() {
  const [meta] = createResource(loadWoods);
  return (
    <Show when={meta()}>
      {(m) => (
        <section class="factory-woods" aria-label="Woods types">
          <h2 class="factory-woods__title">Woods types</h2>
          <p class="factory-muted">
            What the game plants on a cell painted with each type: up to {m().maxTreesPerCell} trees a cell, denser inside a
            wood, smaller at its edge, gathered into groves.
          </p>
          <div class="factory-cards">
            <For each={m().woods}>
              {(w) => (
                <figure class="factory-card factory-woods__card">
                  <img src={`thumbs/woods-${w.name}.png`} alt={`${w.label} grove`} loading="lazy" width="256" height="256" />
                  <figcaption>
                    <b>{w.label}</b>
                    <span class="factory-muted">{w.name}</span>
                    <span class="factory-woods__params">
                      <For each={w.params}>
                        {(p) => (
                          <span>
                            {p.title}: {p.values.map((v) => (v.value === p.default ? `${v.title} (default)` : v.title)).join(", ")}
                          </span>
                        )}
                      </For>
                    </span>
                    <span class="factory-woods__swatches">
                      <span class="factory-woods__swatch" style={{ background: rgb(w.swatch) }} title="Swatch" />
                      <span class="factory-woods__swatch" style={{ background: rgb(w.floor) }} title="Forest floor" />
                    </span>
                  </figcaption>
                </figure>
              )}
            </For>
          </div>
          <h2 class="factory-woods__title">Tree species</h2>
        </section>
      )}
    </Show>
  );
}
