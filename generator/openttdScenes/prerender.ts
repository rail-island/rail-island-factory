// The OpenTTD preview prerender (docs/site/openttd-export.md, "The preview scenes"):
// run once, by hand, to (re)make the scenes the model page's OpenTTD view draws a
// vehicle into. Never part of the build, the tests or CI.
//
//   pnpm exec tsx generator/openttdScenes/prerender.ts [--only <scene>] [--keep <dir> [--reuse]]
//
// It downloads OpenTTD 13.4 and OpenGFX 7.1 (GPL-2) into a cache directory, then,
// one OpenTTD game per scene (railway, road, harbour, airport):
//
//  1. writes a fresh OpenTTD personal directory: a config for a flat 128 x 128 map
//     of one town, the marker GRF (markers.ts), the scene AI (ai/RIScenes, its
//     "scene" setting naming the scene) and a game script that pays (game/RIMoney);
//  2. runs OpenTTD headless (null video) while the AI builds the scene round tile
//     (32, 32) - a new seed while the town stands in the way - and saves the game
//     on exit: the scene without vehicles; then loads that game, where the AI parks
//     the markers at their slots, and saves it again;
//  3. loads each save under Xvfb and screenshots the scene at normal zoom
//     ("normal") and at 4x ("big", zoom_min 4x);
//  4. reads the markers' anchor pixels (each part's own colour), and takes as the
//     scene's foreground every pixel of a marker's mask that the scene covers;
//  5. writes src/openttd/scenes/<scene>/: background-1x.png, background-4x.png,
//     foreground-1x.png, foreground-4x.png (palette PNGs) and placement.json,
//     cropped to the slots, and the two saves.
//
// Needs xvfb-run, curl, tar and unzip on PATH (Linux, x86-64).

import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import sharp from "sharp";
import { HEADINGS } from "../../src/openttd/projection.ts";
import { ANCHOR_COPIES, MASK, MASK_RGB, markerGrf, readAnchor, type MarkerKind, MARKER_KINDS } from "./markers.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const OUT = path.join(REPO, "src/openttd/scenes");
export const OPENTTD_VERSION = "13.4";
export const OPENGFX_VERSION = "7.1";
const CACHE = path.join(os.homedir(), ".cache", "rail-island-factory", `openttd-${OPENTTD_VERSION}`);
/** The screen OpenTTD runs at under Xvfb, normal-zoom pixels; "big" screenshots are 4 times it. */
const SCREEN = { width: 1280, height: 800 } as const;

/** The scene kinds: a vehicle's track picks one (src/openttd/scene.ts kindOf). */
export type SceneKind = "rail" | "electric" | "road" | "tram" | "harbour" | "airport";

/** The most vehicles a scene shows: a yard's 10 tracks, the harbour's 10 lanes, the airport's 10 small airports. */
export const SCENE_SLOTS = 10;

/**
 * Yard k's (1..10) north corner (ai/RIScenes/main.nut YardX, YardY): five a row,
 * far enough apart that no screenshot sees two. A yard's depots stand at x, its
 * tracks run x + 1 .. x + 20, a vehicle stops with its front at x + 17; slot s's
 * track is row y + k - 1 - s (slot 0 nearest the viewer).
 */
export function yardOrigin(k: number): [number, number] {
  return [20 + 50 * ((k - 1) % 5), 20 + 40 * Math.floor((k - 1) / 5)];
}
const YARD = { trackEnd: 20, stopAt: 17 } as const;

/** One prerender game: a scene kind, the AI's "scene" setting, its markers and its views. */
interface Game {
  kind: SceneKind;
  setting: number;
  marker: MarkerKind;
  /** Each screenshot: the scene's name, the tile it centres on, how many slots it holds. */
  views: Array<{ scene: string; centre: [number, number]; slots: number }>;
}

const yards = (kind: SceneKind): Game["views"] =>
  Array.from({ length: SCENE_SLOTS }, (_, i) => {
    const k = i + 1;
    const [x, y] = yardOrigin(k);
    return { scene: `${kind}-${k}`, centre: [x + 11, y + Math.floor(k / 2)] as [number, number], slots: k };
  });

/** The six games and their 42 views (ai/RIScenes/main.nut, its "scene" setting). */
export const GAMES: Game[] = [
  { kind: "rail", setting: 0, marker: "train", views: yards("rail") },
  { kind: "electric", setting: 1, marker: "train", views: yards("electric") },
  { kind: "road", setting: 2, marker: "bus", views: yards("road") },
  { kind: "tram", setting: 3, marker: "tram", views: yards("tram") },
  { kind: "harbour", setting: 4, marker: "ship", views: [{ scene: "harbour", centre: [30, 32], slots: SCENE_SLOTS }] },
  { kind: "airport", setting: 5, marker: "aircraft", views: [{ scene: "airport", centre: [27, 31], slots: SCENE_SLOTS }] },
];

/** One slot as the site reads it (placement.json). */
export interface PlacementSlot {
  /** The slot's number: 0 nearest the viewer, where the pack's default stands. */
  id: number;
  /** OpenTTD's Direction (N, NE, E, SE, S, SW, W, NW) the vehicle heads in. */
  direction: number;
  /** Tile units of straight track behind the slot's front: how long a vehicle may be drawn there. */
  maxLength: number;
  /**
   * Per zoom, the pixel of the image where OpenTTD anchors the sprite of a
   * full-length (8/8) head part at this slot (projection.ts spriteAnchor).
   */
  anchors: { "1x": [number, number]; "4x": [number, number] };
}

export interface Placement {
  version: 2;
  scene: string;
  kind: SceneKind;
  openttd: string;
  opengfx: string;
  sizes: { "1x": [number, number]; "4x": [number, number] };
  slots: PlacementSlot[];
}

// --- OpenTTD -----------------------------------------------------------------------

function download(url: string, file: string): void {
  if (fs.existsSync(file)) return;
  console.log(`downloading ${url}`);
  execFileSync("curl", ["-sSfL", "-o", `${file}.part`, url], { stdio: "inherit" });
  fs.renameSync(`${file}.part`, file);
}

/** The OpenTTD install, with OpenGFX in its baseset folder, downloaded once into CACHE. */
function openttd(): string {
  fs.mkdirSync(CACHE, { recursive: true });
  const dir = path.join(CACHE, `openttd-${OPENTTD_VERSION}-linux-generic-amd64`);
  if (!fs.existsSync(path.join(dir, "openttd"))) {
    const tar = path.join(CACHE, `openttd-${OPENTTD_VERSION}.tar.xz`);
    download(`https://cdn.openttd.org/openttd-releases/${OPENTTD_VERSION}/openttd-${OPENTTD_VERSION}-linux-generic-amd64.tar.xz`, tar);
    execFileSync("tar", ["xf", tar, "-C", CACHE]);
  }
  if (!fs.existsSync(path.join(dir, "baseset", `opengfx-${OPENGFX_VERSION}`))) {
    const zip = path.join(CACHE, `opengfx-${OPENGFX_VERSION}.zip`);
    download(`https://cdn.openttd.org/opengfx-releases/${OPENGFX_VERSION}/opengfx-${OPENGFX_VERSION}-all.zip`, zip);
    execFileSync("unzip", ["-o", "-q", zip, "-d", CACHE]);
    execFileSync("tar", ["xf", path.join(CACHE, `opengfx-${OPENGFX_VERSION}.tar`), "-C", path.join(dir, "baseset")]);
  }
  return dir;
}

const CONFIG = `[misc]
screenshot_format = png
display_opt = FULL_ANIMATION|FULL_DETAIL

[game_creation]
map_x = 8
map_y = 8
starting_year = 2000
land_generator = 1
tgen_smoothness = 0
variety = 0
tree_placer = 0
water_borders = 0
amount_of_rivers = 0
custom_sea_level = 1
custom_town_number = 1

[difficulty]
number_towns = 4
industry_density = 0
terrain_type = 0
quantity_sea_lakes = 4
max_loan = 2000000
vehicle_breakdowns = 0
disasters = false
max_no_competitors = 1
construction_cost = 0
# a permissive town council: no limit of two airports a town (the airport scene's ten)
town_council_tolerance = 3

[gui]
autosave = 0
autosave_on_exit = true
zoom_min = 0
sprite_zoom_min = 0
smooth_scroll = false

[station]
never_expire_airports = true

[vehicle]
train_acceleration_model = original
roadveh_acceleration_model = original
never_expire_vehicles = true

[newgrf]
markers.grf =

[ai_players]
RIScenes = start_date=0

[game_scripts]
RIMoney =
`;

/** A fresh OpenTTD personal directory with the config for a game, the marker GRF and the scripts. */
function personalDir(root: string, game: Game): string {
  const dir = path.join(root, `personal-${game.kind}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "newgrf"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(dir, "ai"), { recursive: true });
  fs.mkdirSync(path.join(dir, "game"), { recursive: true });
  fs.writeFileSync(path.join(dir, "openttd.cfg"), CONFIG.replace("start_date=0", `start_date=0,scene=${game.setting}`));
  fs.writeFileSync(path.join(dir, "newgrf", "markers.grf"), markerGrf());
  fs.cpSync(path.join(HERE, "ai", "RIScenes"), path.join(dir, "ai", "RIScenes"), { recursive: true });
  fs.cpSync(path.join(HERE, "game", "RIMoney"), path.join(dir, "game", "RIMoney"), { recursive: true });
  return dir;
}

function run(bin: string, dir: string, args: string[], until: () => boolean, timeoutMs: number, xvfb: boolean, onLog?: (log: string) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = xvfb ? "xvfb-run" : path.join(bin, "openttd");
    const argv = [
      ...(xvfb ? ["-a", "-s", `-screen 0 ${SCREEN.width}x${SCREEN.height}x24`, path.join(bin, "openttd")] : []),
      "-c", path.join(dir, "openttd.cfg"), "-x", "-s", "null", "-m", "null", ...args,
    ];
    const child = spawn(cmd, argv, { cwd: bin, env: { ...process.env, HOME: dir }, stdio: ["ignore", "pipe", "pipe"], detached: true });
    let log = "";
    child.stdout.on("data", (d) => (log += d));
    child.stderr.on("data", (d) => (log += d));
    const stop = () => {
      try {
        process.kill(-child.pid!, "SIGKILL");
      } catch {
        // already gone
      }
    };
    const timer = setTimeout(() => {
      stop();
      reject(new Error(`OpenTTD timed out\n${log.slice(-4000)}`));
    }, timeoutMs);
    const poll = setInterval(() => {
      if (until()) {
        clearInterval(poll);
        clearTimeout(timer);
        setTimeout(() => {
          stop();
          resolve();
        }, 500);
      }
    }, 250);
    child.on("exit", () => {
      clearInterval(poll);
      clearTimeout(timer);
      const scriptLog = log.split("\n").filter((l) => l.includes("RIScenes:")).join("\n");
      if (scriptLog) console.log(scriptLog);
      onLog?.(scriptLog);
      if (until()) resolve();
      else reject(new Error(`OpenTTD exited early\n${log.slice(-4000)}`));
    });
  });
}

/** A PNG that exists and has stopped growing. */
function written(file: string): boolean {
  if (!fs.existsSync(file)) return false;
  try {
    PNG.sync.read(fs.readFileSync(file));
    return true;
  } catch {
    return false;
  }
}

// --- images ------------------------------------------------------------------------

interface Image {
  width: number;
  height: number;
  data: Uint8Array;
}

function readPng(file: string): Image {
  const png = PNG.sync.read(fs.readFileSync(file));
  return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
}

/**
 * An image as a palette PNG: OpenGFX draws in 256 colours at most, so it is
 * lossless, and many times smaller than a true-colour one. Checked: every visible
 * pixel reads back the same.
 */
async function writePng(file: string, img: Image): Promise<void> {
  const raw = { raw: { width: img.width, height: img.height, channels: 4 as const } };
  const out = await sharp(Buffer.from(img.data), raw).png({ palette: true, colours: 256, dither: 0, effort: 10, compressionLevel: 9 }).toBuffer();
  const back = await sharp(out).ensureAlpha().raw().toBuffer();
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] === 0 && back[i + 3] === 0) continue;
    if (back[i] !== img.data[i] || back[i + 1] !== img.data[i + 1] || back[i + 2] !== img.data[i + 2] || back[i + 3] !== img.data[i + 3]) {
      throw new Error(`${file}: the palette PNG changes pixel ${i / 4} (over 256 colours?)`);
    }
  }
  fs.writeFileSync(file, out);
}

function crop(img: Image, x: number, y: number, w: number, h: number): Image {
  const out = new Uint8Array(w * h * 4);
  for (let row = 0; row < h; row++) {
    const sy = y + row;
    if (sy < 0 || sy >= img.height) continue;
    for (let col = 0; col < w; col++) {
      const sx = x + col;
      if (sx < 0 || sx >= img.width) continue;
      out.set(img.data.subarray((sy * img.width + sx) * 4, (sy * img.width + sx) * 4 + 4), (row * w + col) * 4);
    }
  }
  return { width: w, height: h, data: out };
}

/** Each marker part's anchor pixel in a screenshot: by slot, then part. */
function findAnchors(img: Image, zoom: number): Map<number, Map<number, { x: number; y: number; direction: number }>> {
  const out = new Map<number, Map<number, { x: number; y: number; direction: number }>>();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const a = readAnchor(img.data[i]!, img.data[i + 1]!, img.data[i + 2]!);
      if (!a) continue;
      if (!out.has(a.slot)) out.set(a.slot, new Map());
      const [cx, cy] = ANCHOR_COPIES[a.copy]!;
      out.get(a.slot)!.set(a.part, { x: x - cx * zoom, y: y - cy * zoom, direction: a.direction });
    }
  }
  return out;
}

/** Normal-zoom screen pixels of a tile-unit offset (projection.ts toScreen at zoom 1). */
const screen = (x: number, y: number, z = 0): [number, number] => [2 * (y - x), x + y - z];

// --- the prerender -----------------------------------------------------------------

async function main(): Promise<void> {
  const keep = process.argv.includes("--keep") ? process.argv[process.argv.indexOf("--keep") + 1]! : null;
  const root = keep ?? fs.mkdtempSync(path.join(os.tmpdir(), "ri-openttd-"));
  // --reuse (with --keep): analyse the screenshots a kept run left, without OpenTTD
  const reuse = keep !== null && process.argv.includes("--reuse");
  // --only <kind>: just that kind's game
  const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1]! : null;
  const bin = reuse ? "" : openttd();
  if (!only) {
    // the scenes this run makes replace every earlier one
    for (const d of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) fs.rmSync(path.join(OUT, d), { recursive: true, force: true });
  }
  for (const game of GAMES) {
    if (only && game.kind !== only) continue;
    const dir = reuse ? path.join(root, `personal-${game.kind}`) : personalDir(root, game);
    const shots = path.join(dir, "screenshot");
    const saves = [path.join(root, `${game.kind}-background.sav`), path.join(root, `${game.kind}-markers.sav`)];
    if (!reuse) {
      const exitSave = path.join(dir, "save", "autosave", "exit.sav");
      // 1: build the scene - a new game per seed until the map's town stands clear of it;
      // the game saves itself on exit
      let seed = 1;
      for (;; seed++) {
        if (seed > 60) throw new Error(`${game.kind}: no seed of 1..60 keeps the town out of the scene`);
        console.log(`${game.kind}: building the scene (seed ${seed})`);
        fs.rmSync(exitSave, { force: true });
        const log = await headless(bin, dir, ["-v", "null:ticks=9000", "-G", String(seed), "-g"]);
        if (log.includes("town in the way")) continue;
        if (!log.includes("scene built")) throw new Error(`${game.kind}: the AI did not finish the scene`);
        break;
      }
      fs.copyFileSync(exitSave, saves[0]!);
      // 2: load it, where the AI finds its scene built and parks the markers
      console.log(`${game.kind}: parking the markers`);
      fs.rmSync(exitSave, { force: true });
      // the aircraft take months to reach their terminals; headless ticks are cheap
      const log = await headless(bin, dir, ["-v", "null:ticks=40000", "-g", saves[0]!]);
      if (!log.includes("markers parked")) throw new Error(`${game.kind}: the AI did not park the markers`);
      fs.copyFileSync(exitSave, saves[1]!);
      // 3: the screenshots of every view, at normal zoom and 4x. A screenshot is drawn
      // from the view's last position on screen, which a scroll alone does not move
      // until the game next paints, but a zoom does: zoom in and out.
      for (const view of game.views) {
        for (const [save, n] of [["background", 0], ["markers", 1]] as const) {
          const base = `${view.scene}-${save}`;
          fs.writeFileSync(path.join(dir, "scripts", "game_start.scr"),
            `scrollto instant ${view.centre[0]} ${view.centre[1]}\nzoomto 1\nzoomto 2\nscreenshot normal ${base}-1x\nscreenshot big ${base}-4x\n`);
          console.log(`${view.scene}: screenshot of the ${save}`);
          await run(bin, dir, ["-v", "sdl", "-b", "32bpp-optimized", "-r", `${SCREEN.width}x${SCREEN.height}`, "-g", saves[n]!],
            () => written(path.join(shots, `${base}-1x.png`)) && written(path.join(shots, `${base}-4x.png`)), 300_000, true);
        }
      }
      fs.writeFileSync(path.join(dir, "scripts", "game_start.scr"), "");
    }
    // 4-5: anchors, foreground, crop, per view
    for (const view of game.views) {
      const placement = await analyse(game, view, shots);
      console.log(`${view.scene}: ${placement.sizes["4x"].join(" x ")} at 4x; ${placement.slots.map((sl) => `${sl.id} heading ${sl.direction}`).join(", ")}`);
    }
    fs.mkdirSync(path.join(OUT, "saves"), { recursive: true });
    for (const save of saves) if (fs.existsSync(save)) fs.copyFileSync(save, path.join(OUT, "saves", path.basename(save)));
  }
  if (!keep) fs.rmSync(root, { recursive: true, force: true });
}

/** A headless run (null video and blitter) to its tick count; the game saves on exit. Its script log. */
async function headless(bin: string, dir: string, args: string[]): Promise<string> {
  let log = "";
  await run(bin, dir, [...args.slice(0, 2), "-b", "null", "-d", "script=4", ...args.slice(2)], () => false, 900_000, false, (l) => (log = l)).catch((e: Error) => {
    if (!fs.existsSync(path.join(dir, "save", "autosave", "exit.sav"))) throw e;
  });
  return log;
}

async function analyse(game: Game, view: Game["views"][number], shots: string): Promise<Placement> {
  const name = view.scene;
  const shot = (save: string, zoom: string) => readPng(path.join(shots, `${name}-${save}-${zoom}.png`));
  const bg = { "1x": shot("background", "1x"), "4x": shot("background", "4x") };
  const mk = { "1x": shot("markers", "1x"), "4x": shot("markers", "4x") };
  const anchors = { "1x": findAnchors(mk["1x"], 1), "4x": findAnchors(mk["4x"], 4) };
  // A marker's parts stand 8 units apart along its heading (projection.ts): part p's
  // anchor is the head's moved by p of those steps backwards.
  const step = (direction: number, p: number, zoom: number): [number, number] => {
    const [hx, hy] = HEADINGS[direction]!;
    const [dx, dy] = screen(-8 * p * hx, -8 * p * hy);
    return [dx * zoom, dy * zoom];
  };
  /** A marker's head anchor at a zoom: its own pixel or, covered, any visible part's moved forward. */
  const headOf = (slot: number, zoom: 1 | 4): { x: number; y: number; direction: number } | null => {
    const parts = anchors[zoom === 1 ? "1x" : "4x"].get(slot);
    if (!parts?.size) return null;
    if (parts.has(0)) return parts.get(0)!;
    const [p, at] = [...parts.entries()].sort((a, b) => a[0] - b[0])[0]!;
    const [dx, dy] = step(at.direction, p, zoom);
    return { x: at.x - dx, y: at.y - dy, direction: at.direction };
  };
  interface Found { slot: number; direction: number; head: { "1x": { x: number; y: number }; "4x": { x: number; y: number } } }
  let worst = 0;
  const found: Found[] = Array.from({ length: view.slots }, (_, slot) => {
    const h1 = headOf(slot, 1);
    const h4 = headOf(slot, 4);
    if (!h1 || !h4) throw new Error(`${name}: marker ${game.marker} ${slot} not found (is it parked in view?)`);
    // check the spacing against every visible part
    for (const [p, at] of anchors["1x"].get(slot)!) {
      const [dx, dy] = step(h1.direction, p, 1);
      worst = Math.max(worst, Math.abs(h1.x + dx - at.x), Math.abs(h1.y + dy - at.y));
    }
    return { slot, direction: h1.direction, head: { "1x": h1, "4x": h4 } };
  });
  if (worst > 1) throw new Error(`${name}: marker parts stand up to ${worst} px off the 8-unit spacing`);
  // the masks: every marker part's rectangle about its anchor
  const parts = MARKER_KINDS[game.marker].parts;
  const rects = (zoom: 1 | 4, from: number, to: number): Array<[number, number, number, number]> => {
    const out: Array<[number, number, number, number]> = [];
    for (const f of found) {
      const head = f.head[zoom === 1 ? "1x" : "4x"];
      for (let p = from; p < to; p++) {
        const [dx, dy] = step(f.direction, p, zoom);
        out.push([head.x + dx + MASK.left * zoom, head.y + dy + MASK.top * zoom, MASK.width * zoom, MASK.height * zoom]);
      }
    }
    return out;
  };
  // the crop: a yard's whole tracks - 3 tiles ahead of the fronts (the labels' room,
  // the track's end) to the depots 17 tiles behind - or the harbour's and airport's
  // vehicles, with a tile's margin
  const linear = game.marker === "train" || game.marker === "bus" || game.marker === "tram";
  const extent = linear ? rects(1, -2 * (YARD.trackEnd - YARD.stopAt), 2 * YARD.stopAt + 1) : rects(1, 0, 1);
  const margin = linear ? 16 : 96;
  const x0 = Math.max(0, Math.floor(Math.min(...extent.map((r) => r[0])) - margin));
  const y0 = Math.max(0, Math.floor(Math.min(...extent.map((r) => r[1])) - margin));
  const x1 = Math.min(bg["1x"].width, Math.ceil(Math.max(...extent.map((r) => r[0] + r[2])) + margin));
  const y1 = Math.min(bg["1x"].height, Math.ceil(Math.max(...extent.map((r) => r[1] + r[3])) + margin));
  const box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  const dirOut = path.join(OUT, name);
  fs.mkdirSync(dirOut, { recursive: true });
  for (const [zoomName, zoom] of [["1x", 1], ["4x", 4]] as const) {
    const back = bg[zoomName];
    const mark = mk[zoomName];
    if (back.width !== mark.width || back.height !== mark.height) throw new Error(`${name}: the ${zoomName} shots differ in size`);
    // foreground: within a mask, whatever is not the mask (or an anchor) covers the vehicle
    const fg = new Uint8Array(back.data.length);
    for (const [rx, ry, rw, rh] of rects(zoom, 0, parts)) {
      for (let y = Math.max(0, ry); y < Math.min(back.height, ry + rh); y++) {
        for (let x = Math.max(0, rx); x < Math.min(back.width, rx + rw); x++) {
          const i = (y * back.width + x) * 4;
          const r = mark.data[i]!, g = mark.data[i + 1]!, b = mark.data[i + 2]!;
          if ((r === MASK_RGB[0] && g === MASK_RGB[1] && b === MASK_RGB[2]) || readAnchor(r, g, b)) continue;
          // the marker's pixel is not the scene's: something stands in front of it
          if (r === back.data[i] && g === back.data[i + 1] && b === back.data[i + 2]) fg.set([r, g, b, 255], i);
        }
      }
    }
    await writePng(path.join(dirOut, `background-${zoomName}.png`), crop(back, box.x * zoom, box.y * zoom, box.w * zoom, box.h * zoom));
    await writePng(path.join(dirOut, `foreground-${zoomName}.png`), crop({ ...back, data: fg }, box.x * zoom, box.y * zoom, box.w * zoom, box.h * zoom));
  }
  // A yard's markers stop where they happen to: a few units apart along their
  // tracks. Its slots line up instead - each one track behind the one ahead, its
  // front level with slot 0's - so the noses and labels form a line.
  const aligned = (f: Found, zoom: "1x" | "4x"): [number, number] => {
    const k = zoom === "1x" ? 1 : 4;
    if (!linear) return [f.head[zoom].x, f.head[zoom].y];
    const [dx, dy] = screen(0, -16 * f.slot);
    return [found[0]!.head[zoom].x + dx * k, found[0]!.head[zoom].y + dy * k];
  };
  const placement: Placement = {
    version: 2,
    scene: name,
    kind: game.kind,
    openttd: OPENTTD_VERSION,
    opengfx: OPENGFX_VERSION,
    sizes: { "1x": [box.w, box.h], "4x": [box.w * 4, box.h * 4] },
    slots: found.map((f) => ({
      id: f.slot,
      direction: f.direction,
      maxLength: linear ? 16 * (YARD.stopAt - 1) : 16,
      anchors: {
        "1x": [aligned(f, "1x")[0] - box.x, aligned(f, "1x")[1] - box.y],
        "4x": [aligned(f, "4x")[0] - box.x * 4, aligned(f, "4x")[1] - box.y * 4],
      },
    })),
  };
  fs.writeFileSync(path.join(dirOut, "placement.json"), `${JSON.stringify(placement, null, 2)}\n`);
  return placement;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
