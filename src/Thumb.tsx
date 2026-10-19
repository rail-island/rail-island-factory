// A model's build-rendered thumbnail. Lazy and explicitly sized, so the rows do
// not reflow as pictures stream in. A road or rail vehicle's is a side view
// (wide and short, `thumbSide`), given a wider box than the square three-quarter
// view of everything else. Under `pnpm dev` there are no thumbnail files: the
// default variant is rendered in the browser instead (VariantThumb).

import type { CatalogRecord } from "./catalogQuery";
import { VariantThumb } from "./VariantThumb";

export function Thumb(props: { record: CatalogRecord }) {
  if (import.meta.env.DEV) return <VariantThumb record={props.record} params={{}} size="small" />;
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
