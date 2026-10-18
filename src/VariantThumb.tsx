// A model variant's thumbnail, rendered in the browser (variantThumbs.ts) once
// the box scrolls into view, and released when it scrolls away or unmounts
// before its turn. Until it lands the box holds its place, so the rows do not
// reflow; a vehicle's side view keeps its scale -- one height for every
// vehicle, the width following the image -- as the build's side thumbnails do.

import { Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import type { CatalogRecord } from "./catalogQuery";
import { variantThumb } from "./variantThumbs";

export function VariantThumb(props: {
  record: CatalogRecord;
  params: Record<string, string>;
  /** "small" is the listing's 96 x 60 / 144 x 60 box; "large" the thumbnail view's tile. */
  size: "small" | "large";
  title?: string;
}) {
  let box!: HTMLSpanElement;
  const [visible, setVisible] = createSignal(false);
  const [url, setUrl] = createSignal<string | null>(null);
  const [failed, setFailed] = createSignal(false);

  onMount(() => {
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)), { rootMargin: "200px" });
    io.observe(box);
    onCleanup(() => io.disconnect());
  });

  createEffect(() => {
    const record = props.record;
    const params = props.params;
    if (!visible()) return;
    setUrl(null);
    setFailed(false);
    const req = variantThumb(record, params);
    let live = true;
    req.url.then(
      (u) => live && setUrl(u),
      (e: unknown) => live && !(e instanceof DOMException && e.name === "AbortError") && setFailed(true),
    );
    onCleanup(() => {
      live = false;
      req.release();
    });
  });

  const cls = () =>
    ["factory-vthumb", `factory-vthumb--${props.size}`, props.record.thumbSide ? "factory-vthumb--side" : ""].filter(Boolean).join(" ");
  // a large side view's placeholder width: the default's frame, before the variant's own image lands
  const placeholderWidth = () => {
    const side = props.record.thumbSide;
    if (!side || props.size !== "large") return undefined;
    return `${Math.min(480, Math.round((side.widthM / side.heightM) * 90))}px`;
  };

  return (
    <span ref={box} class={cls()} style={url() ? undefined : { width: placeholderWidth() }} title={props.title}>
      <Show when={url()} fallback={<span class="factory-vthumb__wait" classList={{ "factory-vthumb__wait--failed": failed() }} aria-hidden="true">{failed() ? "!" : ""}</span>}>
        {(u) => <img src={u()} alt="" decoding="async" />}
      </Show>
    </span>
  );
}
