// The model page's Source tab: the procedural source tree of the model -- named
// scopes down to the MeshBuilder calls that drew the triangles -- and the
// selected node's arguments and extent. Selecting a node highlights it in the 3D
// preview; a click on the model selects the leaf under it, and the tree opens
// and scrolls to it. The tree file and its meaning: generator/sourceTree.ts.

import { For, Show, createEffect, createMemo, createSignal, on } from "solid-js";
import {
  ancestorIds, argLabel, formatArg, formatShare, formatSize, isLeaf, materialColor, nodeLabel,
  type TreeIndex, type TreeNode,
} from "./sourceTreeView";
import { formatNumber } from "./catalogQuery";

export function SourceTreePanel(props: {
  index: TreeIndex;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  let list!: HTMLDivElement;
  // Open scopes; the root starts open. Reset whenever another model's tree arrives.
  const [open, setOpen] = createSignal<ReadonlySet<string>>(new Set([""]));
  createEffect(on(() => props.index.tree.id, () => setOpen(new Set([""]))));

  const node = createMemo(() => (props.selected != null ? props.index.byId.get(props.selected) : undefined));

  // A selection made in the 3D preview may sit deep inside closed scopes: open
  // them, then bring the row into view once it has rendered.
  createEffect(
    on(node, (n) => {
      if (!n) return;
      setOpen((prev) => {
        const next = new Set(prev);
        for (const id of ancestorIds(n.id)) next.add(id);
        return next;
      });
      requestAnimationFrame(() => {
        const row = list.querySelector(`[data-node="${CSS.escape(n.id)}"]`);
        row?.scrollIntoView({ block: "nearest" });
      });
    }),
  );

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const Row = (rowProps: { node: TreeNode; depth: number }) => {
    const n = () => rowProps.node;
    const scope = () => !isLeaf(n());
    const expanded = () => open().has(n().id);
    return (
      <>
        <div
          class="factory-tree__row"
          classList={{ "factory-tree__row--selected": props.selected === n().id }}
          style={{ "padding-left": `${rowProps.depth * 14}px` }}
          data-node={n().id}
          role="treeitem"
          aria-level={rowProps.depth + 1}
          aria-selected={props.selected === n().id}
          aria-expanded={scope() ? expanded() : undefined}
        >
          <Show when={scope()} fallback={<span class="factory-tree__caret" />}>
            <button
              type="button"
              class="factory-tree__caret"
              aria-label={expanded() ? "Collapse" : "Expand"}
              onClick={() => toggle(n().id)}
            >
              {expanded() ? "▾" : "▸"}
            </button>
          </Show>
          <button type="button" class="factory-tree__label" onClick={() => props.onSelect(n().id)}>
            <Show when={!scope()}>
              <Swatch color={materialColor(props.index.tree, (n() as { material: string }).material)} />
            </Show>
            <span class="factory-tree__name">{nodeLabel(n())}</span>
            <span class="factory-tree__count">{formatNumber(n().triangles)}</span>
          </button>
        </div>
        <Show when={scope() && expanded()}>
          <For each={(n() as { children: TreeNode[] }).children}>{(c) => <Row node={c} depth={rowProps.depth + 1} />}</For>
        </Show>
      </>
    );
  };

  return (
    <div class="factory-source">
      <Show
        when={node()}
        fallback={<p class="factory-muted factory-source__hint">Select a part in the tree or click the model.</p>}
      >
        {(sel) => <NodeDetail node={sel()} index={props.index} onClear={() => props.onSelect(null)} />}
      </Show>
      <div class="factory-tree" role="tree" aria-label="Procedural source" ref={list}>
        <Row node={props.index.tree.root} depth={0} />
      </div>
    </div>
  );
}

function Swatch(props: { color: string | null }) {
  return <span class="factory-swatch" style={{ background: props.color ?? "transparent" }} aria-hidden="true" />;
}

function NodeDetail(props: { node: TreeNode; index: TreeIndex; onClear: () => void }) {
  const leaf = () => (isLeaf(props.node) ? props.node : null);
  const tree = () => props.index.tree;
  return (
    <div class="factory-node">
      <div class="factory-node__head">
        <div>
          <div class="factory-node__title">{nodeLabel(props.node)}</div>
          <div class="factory-muted factory-node__id">{props.node.id || "(whole model)"}</div>
        </div>
        <button type="button" class="factory-btn" onClick={() => props.onClear()} aria-label="Clear the selection">
          &times;
        </button>
      </div>
      <dl class="factory-specs">
        <Show when={leaf()}>
          {(l) => (
            <>
              <div class="factory-spec">
                <dt>Call</dt>
                <dd>{l().kind}</dd>
              </div>
              <div class="factory-spec">
                <dt>Material</dt>
                <dd>
                  <Swatch color={materialColor(tree(), l().material)} /> {l().material}
                </dd>
              </div>
              <For each={Object.entries(l().args)}>
                {([key, value]) => (
                  <div class="factory-spec">
                    <dt>{argLabel(key)}</dt>
                    <dd>{formatArg(value)}</dd>
                  </div>
                )}
              </For>
            </>
          )}
        </Show>
        <Show when={!leaf()}>
          <div class="factory-spec">
            <dt>Parts</dt>
            <dd>{(props.node as { children: TreeNode[] }).children.length}</dd>
          </div>
        </Show>
        <div class="factory-spec">
          <dt>Triangles</dt>
          <dd>
            {formatNumber(props.node.triangles)} ({formatShare(props.node.triangles, tree().triangles)})
          </dd>
        </div>
        <Show when={formatSize(props.node)}>
          {(size) => (
            <>
              <div class="factory-spec">
                <dt>Size (w x d x h)</dt>
                <dd>{size()}</dd>
              </div>
              <div class="factory-spec">
                <dt>Height span</dt>
                <dd>
                  {props.node.min![1]} .. {props.node.max![1]} m
                </dd>
              </div>
            </>
          )}
        </Show>
      </dl>
    </div>
  );
}
