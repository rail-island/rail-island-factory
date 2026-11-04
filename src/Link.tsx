// An in-site link: a real <a href> (a crawler follows it, a middle click or Ctrl+click
// opens it in a new tab, "Copy link" copies it) whose plain left click the app handles
// itself, without a page load (docs/site/seo-pages.md).

import type { JSX } from "solid-js";

/** Whether a click is a plain left click the app should take over (no modifier, no new tab). */
export function isPlainClick(e: MouseEvent): boolean {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.defaultPrevented;
}

export function Link(props: {
  href: string;
  onNavigate: () => void;
  class?: string;
  title?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
  classList?: Record<string, boolean>;
  children: JSX.Element;
}) {
  return (
    <a
      href={props.href}
      class={props.class}
      classList={props.classList}
      title={props.title}
      aria-label={props["aria-label"]}
      aria-current={props["aria-current"]}
      onClick={(e) => {
        if (!isPlainClick(e)) return;
        e.preventDefault();
        props.onNavigate();
      }}
    >
      {props.children}
    </a>
  );
}
