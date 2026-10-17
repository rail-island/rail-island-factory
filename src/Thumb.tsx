// A model's build-rendered thumbnail. Lazy and explicitly sized, so the rows do
// not reflow as pictures stream in. A road or rail vehicle's is a side view
// (wide and short, `thumbSide`), given a wider box than the square three-quarter
// view of everything else.

import type { CatalogRecord } from "./catalogQuery";

export function Thumb(props: { record: CatalogRecord }) {
  return (
    <img
      class={props.record.thumbSide ? "factory-thumb factory-thumb--side" : "factory-thumb"}
      src={`/${props.record.thumbUrl}`}
      alt=""
      loading="lazy"
      decoding="async"
      width={props.record.thumbSide ? "144" : "96"}
      height="60"
    />
  );
}
