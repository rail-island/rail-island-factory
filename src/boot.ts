// The page's first script, inlined into index.html as a classic script by the
// `inline-boot` plugin in vite.config.ts, so it runs before the stylesheet and the
// app bundle arrive. It does two things the app cannot do for itself:
//
// - while the bundle is still on its way, the loading line in #root says so, and
//   after SLOW_AFTER_MS it says the connection looks slow (a phone on a poor link
//   can take a minute; without this the page is just blank);
// - every script error, unhandled rejection and failed script or stylesheet load
//   is listed in an error box at the bottom of the page, so a phone without dev
//   tools shows why the page is empty.
//
// It must not import anything: it is compiled on its own, ahead of the bundle.
// main.tsx clears #root before rendering, which removes the loading line.

export const BOOT_STATUS_ID = "factory-boot";
export const BOOT_ERRORS_ID = "factory-boot-errors";
export const SLOW_AFTER_MS = 8000;
export const SLOW_TEXT = "Still loading - the connection looks slow. The page appears once its files arrive.";
const MAX_ERRORS = 10;

/** The fields of an error / unhandledrejection event this script reads. */
export interface BootErrorEvent {
  type: string;
  target?: unknown;
  message?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  error?: unknown;
  reason?: unknown;
}

function errorText(e: unknown): string {
  if (e instanceof Error) return e.message || e.name;
  return String(e);
}

/**
 * One line for the error box, or null for an event that is not worth showing:
 * a failed image (a missing thumbnail leaves the page usable) and the benign
 * "ResizeObserver loop" notice browsers raise as an error.
 */
export function describeError(ev: BootErrorEvent): string | null {
  if (ev.type === "unhandledrejection") return `Unhandled rejection: ${errorText(ev.reason)}`;
  const el = ev.target as { tagName?: string; src?: string; href?: string } | null | undefined;
  const tag = el && typeof el.tagName === "string" ? el.tagName.toUpperCase() : "";
  if (tag === "SCRIPT") return `Could not load script ${el!.src || "(inline)"}`;
  if (tag === "LINK") return `Could not load stylesheet ${el!.href || ""}`.trimEnd();
  if (tag !== "") return null;
  const message = ev.message || (ev.error !== undefined ? errorText(ev.error) : "Unknown error");
  if (message.includes("ResizeObserver loop")) return null;
  const where = ev.filename ? ` (${ev.filename}:${ev.lineno ?? 0}:${ev.colno ?? 0})` : "";
  return `${message}${where}`;
}

/** The slice of `window` the boot script uses, so the test can hand it a fake. */
export interface BootWindow {
  document: Document;
  location: { reload(): void };
  addEventListener(type: string, listener: (ev: Event) => void, capture?: boolean): void;
  setTimeout(handler: () => void, ms: number): unknown;
}

export function installBoot(win: BootWindow): void {
  const doc = win.document;
  const shown: string[] = [];

  win.setTimeout(() => {
    const status = doc.getElementById(BOOT_STATUS_ID);
    if (status) status.textContent = SLOW_TEXT;
  }, SLOW_AFTER_MS);

  const render = () => {
    let box = doc.getElementById(BOOT_ERRORS_ID);
    if (!box) {
      box = doc.createElement("div");
      box.id = BOOT_ERRORS_ID;
      box.setAttribute("role", "alert");
      doc.body.appendChild(box);
    }
    const head = doc.createElement("div");
    head.className = "factory-boot-errors__head";
    const title = doc.createElement("b");
    title.textContent = "Something went wrong";
    const reload = doc.createElement("button");
    reload.type = "button";
    reload.textContent = "Reload";
    reload.onclick = () => win.location.reload();
    const close = doc.createElement("button");
    close.type = "button";
    close.textContent = "Close";
    close.onclick = () => box!.remove();
    head.append(title, reload, close);
    const list = doc.createElement("ul");
    for (const line of shown) {
      const li = doc.createElement("li");
      li.textContent = line;
      list.append(li);
    }
    box.replaceChildren(head, list);
  };

  const report = (ev: Event) => {
    const line = describeError(ev as unknown as BootErrorEvent);
    if (line === null || shown.includes(line) || shown.length >= MAX_ERRORS) return;
    shown.push(line);
    // An error can fire while <body> is still being parsed (a stylesheet in
    // <head>); the box waits for it.
    if (doc.body) render();
    else doc.addEventListener("DOMContentLoaded", render);
  };

  // Capture phase: a failed <script>/<link> load does not bubble to window.
  win.addEventListener("error", report, true);
  win.addEventListener("unhandledrejection", report);
}
