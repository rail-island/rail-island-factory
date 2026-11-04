// The thumbnail layout: one row per model -- its title, id, pool and number of
// variants, then the thumbnails of its most representative variants
// (representativeVariants, at most MAX_SHOWN_VARIANTS), each rendered in the
// browser on demand (VariantThumb). The title opens the model; a thumbnail opens
// it at that variant.

import { For, Show } from "solid-js";
import { formatNumber, representativeVariants, shownId, variantCaption, variantCount, type Row } from "./catalogQuery";
import { variantLabel } from "./exportList";
import { VariantThumb } from "./VariantThumb";
import { Link } from "./Link";

export function ModelVariants(props: {
  rows: readonly Row[];
  onOpen: (r: Row, params?: Record<string, string>) => void;
  hrefOf: (r: Row, params?: Record<string, string>) => string;
}) {
  return (
    <ul class="factory-variants">
      <For each={props.rows}>
        {(r) => {
          const count = variantCount(r);
          const shown = representativeVariants(r);
          return (
            <li class="factory-variants__row">
              <Link class="factory-variants__head" href={props.hrefOf(r)} onNavigate={() => props.onOpen(r)}>
                <span class="factory-card__title">
                  {r.title}
                  <span class="factory-chip">{r.group}</span>
                </span>
                <Show when={shownId(r)}>{(id) => <span class="factory-rowid">{id()}</span>}</Show>
                <span class="factory-variants__count">
                  <b>{formatNumber(count)}</b> {count === 1 ? "variant" : "variants"}
                  <Show when={count > shown.length}>
                    <span class="factory-muted"> &middot; {shown.length} shown</span>
                  </Show>
                </span>
              </Link>
              <div class="factory-variants__tiles">
                <For each={shown}>
                  {(params) => (
                    <Link
                      class="factory-variants__tile"
                      title={variantLabel(r, { id: r.id, params }) || "Default variant"}
                      href={props.hrefOf(r, params)}
                      onNavigate={() => props.onOpen(r, params)}
                    >
                      <VariantThumb record={r} params={params} size="large" />
                      <Show when={count > 1}>
                        <span class="factory-variants__caption">{variantCaption(r, params)}</span>
                      </Show>
                    </Link>
                  )}
                </For>
              </div>
            </li>
          );
        }}
      </For>
    </ul>
  );
}
