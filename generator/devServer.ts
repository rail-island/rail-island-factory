// The Vite plugin behind `pnpm dev`: the site's data served on demand
// (devExport.ts) instead of a built export folder, so the dev server starts
// without `pnpm build:models` and a model is built only when the page asks for
// it. The generator is loaded through Vite's SSR loader, warmed in the
// background once the server listens; an edited file under generator/ reloads
// it, drops the bundled JS models and reloads the page.
//
// Serve only: `pnpm build` still writes and ships the export folder.

import fs from "node:fs";
import path from "node:path";
import type { Connect, Plugin, ViteDevServer } from "vite";

type DevExport = typeof import("./devExport.ts");

const ENTRY = "/generator/devExport.ts";

export function devExport(): Plugin {
  let server: ViteDevServer;
  /** Bundled JS models by id, until the next change under generator/. */
  const js = new Map<string, Promise<string | null>>();
  const load = (): Promise<DevExport> => server.ssrLoadModule(ENTRY) as Promise<DevExport>;

  const handle: Connect.NextHandleFunction = (req, res, next) => {
    const url = decodeURIComponent((req.url ?? "").split("?")[0]!);
    const send = (type: string, body: string | Buffer | null): void => {
      if (body === null) {
        res.statusCode = 404;
        res.end();
        return;
      }
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "no-store");
      res.end(body);
    };
    const run = async (): Promise<boolean> => {
      let m: RegExpMatchArray | null;
      if (url === "/catalog.json") send("application/json", `${JSON.stringify((await load()).devCatalog())}\n`);
      else if ((m = url.match(/^\/js\/([^/]+)\.js$/))) {
        const id = m[1]!;
        let p = js.get(id);
        if (!p) {
          p = load().then((d) => d.devJs(id));
          p.catch(() => js.delete(id));
          js.set(id, p);
        }
        send("text/javascript", await p);
      } else if ((m = url.match(/^\/tree\/([^/]+)\.json$/))) send("application/json", (await load()).devTree(m[1]!));
      else if ((m = url.match(/^\/refs\/([^/]+)\/(.+)$/))) {
        const file = (await load()).devReference(m[1]!, m[2]!);
        send(`image/${path.extname(m[2]!).slice(1).toLowerCase().replace("jpg", "jpeg").replace("svg", "svg+xml")}`, file ? fs.readFileSync(file) : null);
      } else if (url.startsWith("/thumbs/")) send("", null); // the browser renders every thumbnail
      else return false;
      return true;
    };
    run().then(
      (handled) => handled || next(),
      (e: unknown) => {
        server.config.logger.error(`[dev-export] ${url}: ${e instanceof Error ? (e.stack ?? e.message) : String(e)}`);
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain");
        res.end(e instanceof Error ? e.message : String(e));
      },
    );
  };

  return {
    name: "dev-export",
    // the dev server only: not `vite preview`, not Vitest's own server
    apply: (_config, env) => env.command === "serve" && !env.isPreview && !process.env.VITEST,
    configureServer(s) {
      server = s;
      s.middlewares.use(handle);
      s.httpServer?.once("listening", () => void load().catch(() => {}));
      const generatorDir = path.join(s.config.root, "generator") + path.sep;
      const onChange = (file: string): void => {
        if (!file.startsWith(generatorDir)) return;
        js.clear();
        s.ws.send({ type: "full-reload" });
      };
      s.watcher.on("change", onChange);
      s.watcher.on("add", onChange);
      s.watcher.on("unlink", onChange);
    },
  };
}
