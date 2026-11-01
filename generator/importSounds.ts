// `pnpm import:sounds`: replace the factory's copy of the game's sound designs in
// sounds/ with a fresh export from the sibling rail-island-music repository
// (docs/models/sounds.md).
//
// The music repository owns every sound's code. The factory only maps its models
// onto those designs (`game.sounds`) and plays them on a model's page, so it keeps
// a committed copy of what music's `pnpm build:music` writes into export/sounds/:
//
//   sounds.js          every design as ONE ES module
//   sounds.meta.json   every design's id, title, kind, params and metrics
//   sounds.d.ts        the contract and the module's exports
//
// The script runs that build in the sibling checkout (unless --skip-build) and
// MIRRORS the three files onto sounds/. Nothing else needs the music checkout:
// the build checks the mapping against the copy and the site bundles it.
//
// The checkout is looked for at ../rail-island-music, or wherever MUSIC_DIR points.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
// Not imported from soundMapping.ts: that module reads the copy this script writes.
const SOUNDS_FORMAT_SUPPORTED = 1;
type SoundsCatalog = { format: number; sounds: Array<{ id: string }> };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
export const SOUNDS_TARGET = path.join(REPO_ROOT, "sounds");
export const SOUNDS_FILES = ["sounds.js", "sounds.meta.json", "sounds.d.ts"] as const;

function fail(message: string): never {
  console.error(`import:sounds: ${message}`);
  process.exit(1);
}

function main(): void {
  const source = path.resolve(process.env.MUSIC_DIR ?? path.join(REPO_ROOT, "..", "rail-island-music"));
  const pkgPath = path.join(source, "package.json");
  if (!fs.existsSync(pkgPath)) fail(`no rail-island-music checkout at ${source} (or set MUSIC_DIR)`);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { name?: string; scripts?: Record<string, string> };
  if (pkg.name !== "rail-island-music" || !pkg.scripts?.["build:music"]) {
    fail(`${source} is not a rail-island-music checkout with a \`build:music\` script`);
  }
  if (!process.argv.includes("--skip-build")) {
    console.log(`import:sounds: building ${source}`);
    execFileSync("pnpm", ["build:music"], { cwd: source, stdio: "inherit" });
  }
  const exportDir = path.join(source, "export", "sounds");
  for (const f of SOUNDS_FILES) if (!fs.existsSync(path.join(exportDir, f))) fail(`the export has no sounds/${f}`);
  const meta = JSON.parse(fs.readFileSync(path.join(exportDir, "sounds.meta.json"), "utf8")) as SoundsCatalog;
  if (meta.format !== SOUNDS_FORMAT_SUPPORTED) fail(`format ${meta.format}, the factory reads format ${SOUNDS_FORMAT_SUPPORTED}`);

  const before = fs.existsSync(path.join(SOUNDS_TARGET, "sounds.meta.json"))
    ? (JSON.parse(fs.readFileSync(path.join(SOUNDS_TARGET, "sounds.meta.json"), "utf8")) as SoundsCatalog).sounds.map((s) => s.id)
    : [];
  fs.rmSync(SOUNDS_TARGET, { recursive: true, force: true });
  fs.mkdirSync(SOUNDS_TARGET, { recursive: true });
  for (const f of SOUNDS_FILES) fs.copyFileSync(path.join(exportDir, f), path.join(SOUNDS_TARGET, f));
  const after = meta.sounds.map((s) => s.id);
  const gone = before.filter((id) => !after.includes(id));
  const added = after.filter((id) => !before.includes(id));
  if (gone.length) console.log(`import:sounds: removed ${gone.join(", ")}`);
  if (added.length) console.log(`import:sounds: added ${added.join(", ")}`);
  console.log(`import:sounds: ${after.length} sounds -> sounds/ (run \`pnpm build:models\` to check the mapping against them)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
