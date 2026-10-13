// A model's build-rendered thumbnail. Lazy and explicitly sized, so the rows do
// not reflow as pictures stream in.

import type { CatalogRecord } from "./catalogQuery";

export function Thumb(props: { record: CatalogRecord }) {
  return (
    <img
      class="factory-thumb"
      src={`/${props.record.thumbUrl}`}
      alt=""
      loading="lazy"
      decoding="async"
      width="96"
      height="60"
    />
  );
}
