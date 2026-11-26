// The Chains tab (docs/site/chains.md): the supply chain the catalog describes. On a
// wide screen a graph in three bands - raw materials and their producers, the
// processors with their recipes, the consumers - with mail as a loop of its own; on
// a phone a list of chains, each step expandable. A node opens cards in a panel beside
// the graph (in place on a phone): a commodity the vehicles that may carry it, an
// industry or a town its building designs. Everything comes from
// chains.ts, laid out from the records' numbers.

import { For, Show, createMemo, createSignal } from "solid-js";
import { nodeCards, touches, type ChainGraph, type ChainNode, type ChainDrawing, type CardGroup } from "./chains";
import type { Row } from "./catalogQuery";
import { Link } from "./Link";
import { Thumb } from "./Thumb";

/** How many vehicles a group shows before its "Show all" button. */
const VEHICLES_SHOWN = 12;

export interface ChainsProps {
  graph: ChainGraph;
  rows: readonly Row[];
  /** The graph on a wide screen, the list of chains on a narrow one. */
  wide: boolean;
  /** The selected node's id (`?chain=`), or null. */
  selected: string | null;
  onSelect: (id: string | null) => void;
  /** The URL that selects a node (null: none). */
  hrefSelect: (id: string | null) => string;
  onOpen: (r: Row) => void;
  hrefOpen: (r: Row) => string;
}

export function ChainsView(props: ChainsProps) {
  const selectedNode = createMemo(() => (props.selected ? props.graph.nodes.get(props.selected) : undefined));
  return (
    <section class="factory-chains" aria-label="Supply chains">
      <p class="factory-muted factory-chains__intro">
        How the game's commodities flow: what makes each one, which recipes turn it into another, and who takes it in the end.
        <Show when={!props.wide}> Open a commodity to see the vehicles that may carry it, or an industry to see its building designs.</Show>
      </p>
      <Show when={props.wide} fallback={<ChainList {...props} />}>
        <div class="factory-chains__layout">
          <div class="factory-chains__main">
            <div class="factory-chains__graph">
              <Drawing
                graph={props.graph}
                nodes={[...props.graph.nodes.values()].filter((n) => n.commodityKind !== "town")}
                edges={props.graph.edges}
                width={props.graph.width}
                height={props.graph.height}
                bands={props.graph.bands}
                label="The supply chain"
                selected={props.selected}
                onSelect={props.onSelect}
                hrefSelect={props.hrefSelect}
              />
            </div>
            <Show when={props.graph.mail}>
              {(mail) => (
                <div class="factory-chains__mail">
                  <h2 class="factory-chains__heading">Mail</h2>
                  <p class="factory-muted factory-chains__note">Outside the industry chain: homes, shops and offices send mail to each other.</p>
                  <Drawing
                    graph={props.graph}
                    nodes={mail().nodes.map((b) => ({ ...props.graph.nodes.get(b.id)!, ...b }))}
                    edges={mail().edges}
                    width={mail().width}
                    height={mail().height}
                    bands={[]}
                    label="Mail between towns"
                    selected={props.selected}
                    onSelect={props.onSelect}
                    hrefSelect={props.hrefSelect}
                  />
                </div>
              )}
            </Show>
          </div>
          <aside class="factory-chains__panel" aria-label="The picked node">
            <Show
              when={selectedNode()}
              fallback={
                <p class="factory-muted factory-chains__hint">
                  Pick a commodity to see the vehicles that may carry it, or an industry or a town to see its building designs.
                </p>
              }
            >
              {(node) => <NodeCards {...props} node={node()} />}
            </Show>
          </aside>
        </div>
      </Show>
    </section>
  );
}

/** One drawing: positioned boxes over an SVG of curves. */
function Drawing(props: {
  graph: ChainGraph;
  nodes: ChainNode[];
  edges: ChainDrawing["edges"];
  width: number;
  height: number;
  bands: ChainGraph["bands"];
  label: string;
  selected: string | null;
  onSelect: (id: string | null) => void;
  hrefSelect: (id: string | null) => string;
}) {
  const pad = 12;
  const top = () => (props.bands.length ? 28 : 0);
  return (
    <div class="factory-chains__canvas" role="group" aria-label={props.label} style={{ width: `${props.width + 2 * pad}px`, height: `${props.height + top() + pad}px` }}>
      <For each={props.bands}>
        {(b) => (
          <div class="factory-chains__band" style={{ left: `${b.x + pad}px`, width: `${b.w}px` }}>
            <span class="factory-chains__band-title">{b.title}</span>
          </div>
        )}
      </For>
      <svg class="factory-chains__edges" width={props.width + 2 * pad} height={props.height + top() + pad} aria-hidden="true">
        <defs>
          <marker id="factory-chain-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path class="factory-chains__arrow" d="M0 0L8 4L0 8z" />
          </marker>
          <marker id="factory-chain-arrow-on" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
            <path class="factory-chains__arrow factory-chains__arrow--on" d="M0 0L8 4L0 8z" />
          </marker>
        </defs>
        <g transform={`translate(${pad} ${top()})`}>
          <For each={props.edges}>
            {(e) => (
              <path
                class="factory-chains__edge"
                classList={{ "factory-chains__edge--on": touches(e, props.selected) }}
                d={e.path}
                marker-end={touches(e, props.selected) ? "url(#factory-chain-arrow-on)" : "url(#factory-chain-arrow)"}
              >
                <title>{`${props.graph.nodes.get(e.from)?.title ?? e.from} -> ${props.graph.nodes.get(e.to)?.title ?? e.to}`}</title>
              </path>
            )}
          </For>
        </g>
      </svg>
      <For each={props.nodes}>
        {(n) => (
          <Link
            class={`factory-chains__node factory-chains__node--${n.kind}`}
            classList={{
              "factory-chains__node--on": props.selected === n.id,
              "factory-chains__node--empty": n.empty,
              "factory-chains__node--draft": n.draft,
              [`factory-chains__node--${n.commodityKind ?? ""}`]: !!n.commodityKind,
            }}
            aria-current={props.selected === n.id ? "page" : undefined}
            href={props.hrefSelect(props.selected === n.id ? null : n.id)}
            onNavigate={() => props.onSelect(props.selected === n.id ? null : n.id)}
            title={[n.title, ...n.lines].join("\n")}
          >
            <span class="factory-chains__pos" style={{ left: `${n.x + pad}px`, top: `${n.y + top()}px`, width: `${n.w}px`, height: `${n.h}px` }}>
              <span class="factory-chains__title">{n.title}</span>
              <For each={n.lines}>{(l) => <span class="factory-chains__line">{l}</span>}</For>
            </span>
          </Link>
        )}
      </For>
    </div>
  );
}

/** The phone's list: one chain after another, each step a button that opens its cards in place. */
function ChainList(props: ChainsProps) {
  // a step shared by several chains (the towns) opens in the chain it was opened from; from a link, in the first
  const [from, setFrom] = createSignal<string | null>(null);
  const openIn = (chainId: string) => {
    const id = props.selected;
    if (!id) return false;
    const where = from();
    const first = props.graph.chains.find((c) => c.steps.includes(id))?.id;
    return (where && props.graph.chains.some((c) => c.id === where && c.steps.includes(id)) ? where : first) === chainId;
  };
  return (
    <ol class="factory-chainlist">
      <For each={props.graph.chains}>
        {(chain) => (
          <li class="factory-chainlist__chain">
            <h2 class="factory-chainlist__title">{chain.title}</h2>
            <ol class="factory-chainlist__steps">
              <For each={chain.steps}>
                {(id) => {
                  const n = props.graph.nodes.get(id)!;
                  const open = () => props.selected === id && openIn(chain.id);
                  return (
                    <li class="factory-chainlist__step">
                      <Link
                        class={`factory-chainlist__button factory-chains__node--${n.kind}`}
                        classList={{ "factory-chainlist__button--on": open(), "factory-chains__node--empty": n.empty, "factory-chains__node--draft": n.draft }}
                        aria-current={open() ? "page" : undefined}
                        href={props.hrefSelect(open() ? null : id)}
                        onNavigate={() => {
                          setFrom(chain.id);
                          props.onSelect(open() ? null : id);
                        }}
                      >
                        <span class="factory-chains__title">{n.title}</span>
                        <For each={n.lines}>{(l) => <span class="factory-chains__line">{l}</span>}</For>
                      </Link>
                      <Show when={open()}>
                        <NodeCards {...props} node={n} />
                      </Show>
                    </li>
                  );
                }}
              </For>
            </ol>
          </li>
        )}
      </For>
    </ol>
  );
}

/** A node's cards: its building designs, then each commodity's vehicles. */
export function NodeCards(props: ChainsProps & { node: ChainNode }) {
  const byId = createMemo(() => new Map(props.rows.map((r) => [r.id, r])));
  const groups = createMemo(() => nodeCards(props.graph, props.node.id));
  return (
    <section class="factory-chaincards" aria-label={props.node.title}>
      <Show when={props.wide}>
        <div class="factory-chaincards__head">
          <h2 class="factory-chains__heading">{props.node.title}</h2>
          <Link class="factory-link" href={props.hrefSelect(null)} onNavigate={() => props.onSelect(null)}>
            Close
          </Link>
        </div>
      </Show>
      <For each={groups()}>{(g) => <CardGroupView group={g} byId={byId()} onOpen={props.onOpen} hrefOpen={props.hrefOpen} />}</For>
    </section>
  );
}

function CardGroupView(props: { group: CardGroup; byId: Map<string, Row>; onOpen: (r: Row) => void; hrefOpen: (r: Row) => string }) {
  const [all, setAll] = createSignal(false);
  const cards = () => [
    ...(props.group.buildings ?? []).map((c) => ({ ...c, tonnes: undefined as number | undefined })),
    ...(props.group.vehicles ?? []),
  ];
  const shown = () => (props.group.vehicles && !all() ? cards().slice(0, VEHICLES_SHOWN) : cards());
  return (
    <div class="factory-chaincards__group">
      <h3 class="factory-chaincards__title">
        {props.group.title} <span class="factory-section__count">{cards().length}</span>
      </h3>
      <Show when={cards().length} fallback={<p class="factory-muted factory-chaincards__empty">{props.group.empty}</p>}>
        <ul class="factory-chaincards__list">
          <For each={shown()}>
            {(c) => {
              const row = props.byId.get(c.id);
              return (
                <li>
                  <Show when={row} fallback={<span class="factory-chaincard">{c.title}</span>}>
                    {(r) => (
                      <Link class="factory-chaincard" href={props.hrefOpen(r())} onNavigate={() => props.onOpen(r())}>
                        <Thumb record={r()} />
                        <span class="factory-chaincard__body">
                          <span class="factory-chaincard__title">{c.title}</span>
                          <span class="factory-muted factory-chaincard__line">{c.line}</span>
                          <Show when={c.draft}>
                            <span class="factory-draft factory-chaincard__draft" title="Not yet confirmed into the catalog: not exported to the game">
                              Workshop draft
                            </span>
                          </Show>
                        </span>
                      </Link>
                    )}
                  </Show>
                </li>
              );
            }}
          </For>
        </ul>
        <Show when={props.group.vehicles && cards().length > VEHICLES_SHOWN}>
          <button type="button" class="factory-btn factory-chaincards__more" onClick={() => setAll(!all())}>
            {all() ? "Show fewer" : `Show all ${cards().length}`}
          </button>
        </Show>
      </Show>
    </div>
  );
}
