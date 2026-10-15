// The page's boot script (src/boot.ts): the slow-loading line and the error box
// that show why a page is still empty on a device without dev tools.

import { describe, expect, it } from "vitest";
import { BOOT_ERRORS_ID, BOOT_STATUS_ID, SLOW_AFTER_MS, SLOW_TEXT, describeError, installBoot, type BootWindow } from "../src/boot";

describe("describeError", () => {
  it("names a script or stylesheet that failed to load", () => {
    expect(describeError({ type: "error", target: { tagName: "SCRIPT", src: "https://x/assets/index-1.js" } })).toBe(
      "Could not load script https://x/assets/index-1.js",
    );
    expect(describeError({ type: "error", target: { tagName: "LINK", href: "https://x/assets/index-1.css" } })).toBe(
      "Could not load stylesheet https://x/assets/index-1.css",
    );
  });

  it("gives a script error its message and location", () => {
    expect(describeError({ type: "error", target: {}, message: "boom", filename: "a.js", lineno: 3, colno: 7 })).toBe("boom (a.js:3:7)");
  });

  it("describes an unhandled rejection", () => {
    expect(describeError({ type: "unhandledrejection", reason: new Error("fetch failed") })).toBe("Unhandled rejection: fetch failed");
  });

  it("skips failed images and the benign ResizeObserver notice", () => {
    expect(describeError({ type: "error", target: { tagName: "IMG", src: "t.png" } })).toBeNull();
    expect(describeError({ type: "error", message: "ResizeObserver loop completed with undelivered notifications." })).toBeNull();
  });
});

// Just enough DOM for installBoot.
class FakeEl {
  id = "";
  className = "";
  type = "";
  textContent = "";
  onclick: (() => void) | null = null;
  children: FakeEl[] = [];
  attrs: Record<string, string> = {};
  constructor(readonly tagName: string, readonly doc: FakeDoc) {}
  setAttribute(k: string, v: string) { this.attrs[k] = v; }
  appendChild(c: FakeEl) { this.children.push(c); this.doc.byId(c); return c; }
  append(...c: FakeEl[]) { this.children.push(...c); }
  replaceChildren(...c: FakeEl[]) { this.children = c; }
  remove() { this.doc.removed.add(this.id); }
  text(): string { return this.textContent + this.children.map((c) => c.text()).join("|"); }
}
class FakeDoc {
  ids = new Map<string, FakeEl>();
  removed = new Set<string>();
  body = new FakeEl("BODY", this);
  createElement(tag: string) { return new FakeEl(tag.toUpperCase(), this); }
  getElementById(id: string) { return this.removed.has(id) ? null : (this.ids.get(id) ?? null); }
  byId(el: FakeEl) { if (el.id) this.ids.set(el.id, el); }
  addEventListener() {}
}

function boot() {
  const doc = new FakeDoc();
  const status = doc.createElement("p");
  status.id = BOOT_STATUS_ID;
  status.textContent = "Loading...";
  doc.byId(status);
  const listeners: Record<string, (ev: unknown) => void> = {};
  const timers: { fn: () => void; ms: number }[] = [];
  const win = {
    document: doc as unknown as Document,
    location: { reload() {} },
    addEventListener: (type: string, fn: (ev: Event) => void) => { listeners[type] = fn as (ev: unknown) => void; },
    setTimeout: (fn: () => void, ms: number) => { timers.push({ fn, ms }); return 0; },
  } satisfies BootWindow;
  installBoot(win);
  return { doc, status, listeners, timers };
}

describe("installBoot", () => {
  it("says the connection is slow when the app has not replaced the loading line", () => {
    const { status, timers } = boot();
    expect(timers.map((t) => t.ms)).toEqual([SLOW_AFTER_MS]);
    timers[0]!.fn();
    expect(status.textContent).toBe(SLOW_TEXT);
  });

  it("does nothing once the app has rendered", () => {
    const { doc, timers } = boot();
    doc.removed.add(BOOT_STATUS_ID);
    expect(() => timers[0]!.fn()).not.toThrow();
  });

  it("lists failed loads in one error box, once each", () => {
    const { doc, listeners } = boot();
    const fail = { type: "error", target: { tagName: "SCRIPT", src: "/assets/index-1.js" } };
    listeners.error!(fail);
    listeners.error!(fail);
    listeners.unhandledrejection!({ type: "unhandledrejection", reason: "nope" });
    const box = doc.getElementById(BOOT_ERRORS_ID)!;
    expect(doc.body.children).toEqual([box]);
    const lines = box.children[1]!.children.map((li) => li.textContent);
    expect(lines).toEqual(["Could not load script /assets/index-1.js", "Unhandled rejection: nope"]);
  });
});
