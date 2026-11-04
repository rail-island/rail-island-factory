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

/** What kind of track a slot stands on: the site picks a vehicle's slots by it. */
export type SlotTrack = "rail" | "electric" | "road" | "tram" | "water" | "air";

interface SlotSpec {
  marker: MarkerKind;
  slot: number;
  track: SlotTrack;
  /** Tile units of straight track behind the slot's front: how long a vehicle may be drawn there. */
  maxLength: number;
}

interface SceneSpec {
  slots: SlotSpec[];
}

/** The four scenes, one game each, the AI builds (ai/RIScenes/main.nut, its "scene" setting in this order), with their slots. */
export const SCENES: Record<string, SceneSpec> = {
  railway: {
    slots: [
      { marker: "train", slot: 0, track: "rail", maxLength: 16 * 17 },
      { marker: "train", slot: 1, track: "electric", maxLength: 16 * 17 },
      { marker: "train", slot: 2, track: "rail", maxLength: 16 * 19 },
      { marker: "train", slot: 3, track: "electric", maxLength: 16 * 19 },
      { marker: "train", slot: 4, track: "rail", maxLength: 16 * 18 },
      { marker: "train", slot: 5, track: "electric", maxLength: 16 * 18 },
    ],
  },
  road: {
    slots: [
      { marker: "bus", slot: 0, track: "road", maxLength: 16 * 15 },
      { marker: "bus", slot: 1, track: "road", maxLength: 16 * 19 },
      { marker: "tram", slot: 2, track: "tram", maxLength: 16 * 15 },
      { marker: "tram", slot: 3, track: "tram", maxLength: 16 * 19 },
    ],
  },
  harbour: {
    slots: [
      { marker: "ship", slot: 0, track: "water", maxLength: 16 },
      { marker: "ship", slot: 1, track: "water", maxLength: 16 },
    ],
  },
  airport: {
    slots: [
      { marker: "aircraft", slot: 0, track: "air", maxLength: 16 },
      { marker: "aircraft", slot: 1, track: "air", maxLength: 16 },
    ],
  },
};

/** One slot as the site reads it (placement.json). */
export interface PlacementSlot {
  id: string;
  /** OpenTTD's Direction (N, NE, E, SE, S, SW, W, NW) the vehicle heads in. */
  direction: number;
  track: SlotTrack;
  maxLength: number;
  /**
   * Per zoom, the pixel of the image where OpenTTD anchors the sprite of a
   * full-length (8/8) head part at this slot (projection.ts spriteAnchor).
   */
  anchors: { "1x": [number, number]; "4x": [number, number] };
}

export interface Placement {
  version: 1;
  scene: string;
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
map_x = 7
map_y = 7
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

[gui]
autosave = 0
autosave_on_exit = true
zoom_min = 0
sprite_zoom_min = 0
smooth_scroll = false

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

/** A fresh OpenTTD personal directory with the config for scene `scene`, the marker GRF and the scripts. */
function personalDir(root: string, scene: number): string {
  const dir = path.join(root, `personal-${scene}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, "newgrf"), { recursive: true });
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(dir, "ai"), { recursive: true });
  fs.mkdirSync(path.join(dir, "game"), { recursive: true });
  fs.writeFileSync(path.join(dir, "openttd.cfg"), CONFIG.replace("start_date=0", `start_date=0,scene=${scene}`));
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
  const bin = openttd();
  // --reuse (with --keep): analyse the screenshots a kept run left, without OpenTTD
  const reuse = keep !== null && process.argv.includes("--reuse");
  // --only <scene>: just that scene
  const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1]! : null;
  for (const [k, [name, scene]] of Object.entries(SCENES).entries()) {
    if (only && name !== only) continue;
    if (reuse && fs.existsSync(path.join(root, `personal-${k}`, "screenshot", `${name}-markers-4x.png`))) {
      const placement = await analyse(name, scene, path.join(root, `personal-${k}`, "screenshot"));
      console.log(`${name}: ${placement.slots.map((sl) => `${sl.id} heading ${sl.direction}`).join(", ")}`);
      continue;
    }
    const dir = personalDir(root, k);
    const exitSave = path.join(dir, "save", "autosave", "exit.sav");
    const saves = [path.join(root, `${name}-background.sav`), path.join(root, `${name}-markers.sav`)];
    // 1: build the scene - a new game per seed until the map's town stands clear of it;
    // the game saves itself on exit
    let seed = 1;
    for (;; seed++) {
      if (seed > 40) throw new Error(`${name}: no seed of 1..40 keeps the town out of the scene`);
      console.log(`${name}: building the scene (seed ${seed})`);
      fs.rmSync(exitSave, { force: true });
      const log = await headless(bin, dir, ["-v", "null:ticks=6000", "-G", String(seed), "-g"]);
      if (log.includes("town in the way")) continue;
      if (!log.includes("scene built")) throw new Error(`${name}: the AI did not finish the scene`);
      break;
    }
    fs.copyFileSync(exitSave, saves[0]!);
    // 2: load it, where the AI finds its scene built and parks the markers
    console.log(`${name}: parking the markers`);
    fs.rmSync(exitSave, { force: true });
    const log = await headless(bin, dir, ["-v", "null:ticks=6000", "-g", saves[0]!]);
    if (!log.includes("markers parked")) throw new Error(`${name}: the AI did not park the markers`);
    fs.copyFileSync(exitSave, saves[1]!);
    // 3: the screenshots, centred on the scene's tile (32, 32)
    const shots = path.join(dir, "screenshot");
    for (const [save, n] of [["background", 0], ["markers", 1]] as const) {
      const base = `${name}-${save}`;
      // a screenshot is drawn from the view's last position on screen, which a scroll
      // alone does not move until the game next paints, but a zoom does: zoom in and out
      fs.writeFileSync(path.join(dir, "scripts", "game_start.scr"),
        `scrollto instant 32 32\nzoomto 1\nzoomto 2\nscreenshot normal ${base}-1x\nscreenshot big ${base}-4x\n`);
      console.log(`${name}: screenshot of the ${save}`);
      await run(bin, dir, ["-v", "sdl", "-b", "32bpp-optimized", "-r", `${SCREEN.width}x${SCREEN.height}`, "-g", saves[n]!],
        () => written(path.join(shots, `${base}-1x.png`)) && written(path.join(shots, `${base}-4x.png`)), 300_000, true);
      fs.writeFileSync(path.join(dir, "scripts", "game_start.scr"), "");
    }
    // 4-5: anchors, foreground, crop
    const placement = await analyse(name, scene, shots);
    fs.mkdirSync(path.join(OUT, name), { recursive: true });
    for (const save of saves) fs.copyFileSync(save, path.join(OUT, name, path.basename(save).replace(`${name}-`, "scene-")));
    console.log(`${name}: seed ${seed}; ${placement.slots.map((sl) => `${sl.id} heading ${sl.direction}`).join(", ")}`);
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

async function analyse(name: string, scene: SceneSpec, shots: string): Promise<Placement> {
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
  interface Found { spec: SlotSpec; direction: number; head: { "1x": { x: number; y: number }; "4x": { x: number; y: number } } }
  let worst = 0;
  const found: Found[] = scene.slots.map((spec) => {
    const h1 = headOf(spec.slot, 1);
    const h4 = headOf(spec.slot, 4);
    if (!h1 || !h4) throw new Error(`${name}: marker ${spec.marker} ${spec.slot} not found (is it parked in view?)`);
    // check the spacing against every visible part
    for (const [p, at] of anchors["1x"].get(spec.slot)!) {
      const [dx, dy] = step(h1.direction, p, 1);
      worst = Math.max(worst, Math.abs(h1.x + dx - at.x), Math.abs(h1.y + dy - at.y));
    }
    return { spec, direction: h1.direction, head: { "1x": h1, "4x": h4 } };
  });
  if (worst > 1) throw new Error(`${name}: marker parts stand up to ${worst} px off the 8-unit spacing`);
  // the masks: every marker part's rectangle about its anchor
  const rects = (zoom: 1 | 4): Array<[number, number, number, number]> => {
    const out: Array<[number, number, number, number]> = [];
    for (const f of found) {
      const head = f.head[zoom === 1 ? "1x" : "4x"];
      for (let p = 0; p < MARKER_KINDS[f.spec.marker].parts; p++) {
        const [dx, dy] = step(f.direction, p, zoom);
        out.push([head.x + dx + MASK.left * zoom, head.y + dy + MASK.top * zoom, MASK.width * zoom, MASK.height * zoom]);
      }
    }
    return out;
  };
  // the crop: every head's mask, widened, within the shot
  const heads = found.map((f) => f.head["1x"]);
  const margin = 120;
  const x0 = Math.max(0, Math.min(...heads.map((h) => h.x)) - 2 * margin);
  const y0 = Math.max(0, Math.min(...heads.map((h) => h.y)) - 2 * margin);
  const x1 = Math.min(bg["1x"].width, Math.max(...heads.map((h) => h.x)) + 2 * margin);
  const y1 = Math.min(bg["1x"].height, Math.max(...heads.map((h) => h.y)) + margin);
  const box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  const dirOut = path.join(OUT, name);
  fs.mkdirSync(dirOut, { recursive: true });
  for (const [zoomName, zoom] of [["1x", 1], ["4x", 4]] as const) {
    const back = bg[zoomName];
    const mark = mk[zoomName];
    if (back.width !== mark.width || back.height !== mark.height) throw new Error(`${name}: the ${zoomName} shots differ in size`);
    // foreground: within a mask, whatever is not the mask (or an anchor) covers the vehicle
    const fg = new Uint8Array(back.data.length);
    for (const [rx, ry, rw, rh] of rects(zoom)) {
      for (let y = Math.max(0, ry); y < Math.min(back.height, ry + rh); y++) {
        for (let x = Math.max(0, rx); x < Math.min(back.width, rx + rw); x++) {
          const i = (y * back.width + x) * 4;
          const r = mark.data[i]!, g = mark.data[i + 1]!, b = mark.data[i + 2]!;
          if ((r === MASK_RGB[0] && g === MASK_RGB[1] && b === MASK_RGB[2]) || readAnchor(r, g, b)) continue;
          // the marker's pixel is not the scene's: something stands in front of it
          if (r === back.data[i] && g === back.data[i + 1] && b === back.data[i + 2]) {
            fg.set([r, g, b, 255], i);
          }
        }
      }
    }
    await writePng(path.join(dirOut, `background-${zoomName}.png`), crop(back, box.x * zoom, box.y * zoom, box.w * zoom, box.h * zoom));
    await writePng(path.join(dirOut, `foreground-${zoomName}.png`), crop({ ...back, data: fg }, box.x * zoom, box.y * zoom, box.w * zoom, box.h * zoom));
  }
  const placement: Placement = {
    version: 1,
    scene: name,
    openttd: OPENTTD_VERSION,
    opengfx: OPENGFX_VERSION,
    sizes: { "1x": [box.w, box.h], "4x": [box.w * 4, box.h * 4] },
    slots: found.map((f) => ({
      id: `${f.spec.marker}-${f.spec.slot}`,
      direction: f.direction,
      track: f.spec.track,
      maxLength: f.spec.maxLength,
      anchors: {
        "1x": [f.head["1x"].x - box.x, f.head["1x"].y - box.y],
        "4x": [f.head["4x"].x - box.x * 4, f.head["4x"].y - box.y * 4],
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
