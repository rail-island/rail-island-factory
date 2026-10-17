// A contact sheet: many thumbnails on one labelled PNG, so a model's variants (or
// a set of models, or before/after renders) can be sent to the user as a single
// image (AGENTS.md, "Show the user the model"). Headless, pure Node (pngjs).
//
//   pnpm exec tsx generator/contactSheet.ts <out.png> [--variants | --vary a,b]
//       [--view auto|3q|side] [--cols N] [--cell PX] [--no-labels] <source>...
//
// A source is a design id (`proc-vehicle-cd-150`), a prefix of ids (`proc-vehicle-cd-1*`),
// a design with parameters (`proc-building-x?variant=b&roof=red`), or a .glb or .png file.
// `--variants` expands each plain design id into the combinations the tests build
// (coverageCombinations); `--vary a,b` instead combines only the named parameters,
// the others at their defaults - fewer tiles, about one change. `--view auto` (the default) uses the build's choice: the
// side view for road and rail vehicles, the three-quarter view for everything else.
// Side views on one sheet share one scale, so their lengths compare.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { coverageCombinations, paramApplies, resolveParams, type ParamValues, type ProceduralDesign } from "./design.ts";
import { renderGlbSideThumb, renderGlbThumb, type GlbSource } from "./renderGlbThumb.ts";

/** One image on the sheet. `side` tiles share one scale. */
export interface SheetTile {
  label: string;
  png: PNG;
  side?: boolean;
}

export interface SheetOptions {
  /** Columns; default: up to 4 for three-quarter views, 1 or 2 for side views. */
  cols?: number;
  /** The width of a cell in pixels (a three-quarter tile fits a cell-sized square). */
  cell?: number;
}

/** The default cell width: a 512 px three-quarter view shrunk a little, or a 25 m vehicle side on at full scale. */
export function defaultCell(anySide: boolean): number {
  return anySide ? 800 : 384;
}

const PAD = 12;
const FONT_SCALE = 2;
const ADVANCE = 6 * FONT_SCALE;
const LINE_H = 9 * FONT_SCALE;
const SHEET_BG: Rgb = [0xe4, 0xe7, 0xeb];
const CARD_BG: Rgb = [0xff, 0xff, 0xff];
const TEXT: Rgb = [0x22, 0x26, 0x2b];

type Rgb = [number, number, number];

/** Lay `tiles` out in a grid, each with its label under it, on an opaque background. */
export function composeSheet(tiles: readonly SheetTile[], opts: SheetOptions = {}): PNG {
  if (tiles.length === 0) throw new Error("a contact sheet needs at least one image");
  const anySide = tiles.some((t) => t.side);
  const cell = opts.cell ?? defaultCell(anySide);
  const sideWidest = Math.max(1, ...tiles.filter((t) => t.side).map((t) => t.png.width));
  const sideScale = Math.min(1, cell / sideWidest);
  const scaled = tiles.map((t) => {
    const k = t.side ? sideScale : Math.min(1, cell / t.png.width, cell / t.png.height);
    return resample(t.png, k);
  });
  const lines = tiles.map((t) => (t.label ? wrap(t.label, Math.max(1, Math.floor(cell / ADVANCE))) : []));
  const cols = Math.max(1, Math.min(tiles.length, opts.cols ?? (anySide ? (tiles.length > 6 ? 2 : 1) : 4)));
  const rows: number[][] = [];
  for (let i = 0; i < tiles.length; i += cols) rows.push(tiles.slice(i, i + cols).map((_, j) => i + j));
  const rowImageH = rows.map((r) => Math.max(...r.map((i) => scaled[i]!.height)));
  const rowLabelH = rows.map((r) => Math.max(...r.map((i) => lines[i]!.length)) * LINE_H);

  const width = cols * cell + (cols + 1) * PAD;
  const height = rows.reduce((h, _, r) => h + rowImageH[r]! + PAD + rowLabelH[r]! + 2 * PAD, PAD);
  const out = new PNG({ width, height });
  fillRect(out, 0, 0, width, height, SHEET_BG);
  let y = PAD;
  rows.forEach((r, ri) => {
    const cardH = rowImageH[ri]! + PAD + rowLabelH[ri]! + PAD;
    r.forEach((i, ci) => {
      const x = PAD + ci * (cell + PAD);
      fillRect(out, x, y, cell, cardH, CARD_BG);
      const img = scaled[i]!;
      // bottom-aligned, so side views stand on one rail line
      blitOver(out, img, x + Math.floor((cell - img.width) / 2), y + rowImageH[ri]! - img.height);
      lines[i]!.forEach((line, li) => drawText(out, line, x + 4, y + rowImageH[ri]! + PAD + li * LINE_H, TEXT));
    });
    y += cardH + PAD;
  });
  return out;
}

/** Split `label` into lines of at most `perLine` characters, preferring breaks after a space or a dash. */
export function wrap(label: string, perLine: number): string[] {
  const out: string[] = [];
  let rest = label;
  while (rest.length > perLine) {
    const head = rest.slice(0, perLine);
    const cut = Math.max(head.lastIndexOf(" "), head.lastIndexOf("-"));
    const at = cut > 0 ? cut + 1 : perLine;
    out.push(rest.slice(0, at).trimEnd());
    rest = rest.slice(at).trimStart();
  }
  out.push(rest);
  return out;
}

/** Shrink `src` by `k` (<= 1) with an area average over premultiplied alpha. */
function resample(src: PNG, k: number): PNG {
  if (k >= 1) return src;
  const w = Math.max(1, Math.round(src.width * k));
  const h = Math.max(1, Math.round(src.height * k));
  const sx = src.width / w;
  const sy = src.height / h;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    const y0 = y * sy, y1 = y0 + sy;
    for (let x = 0; x < w; x++) {
      const x0 = x * sx, x1 = x0 + sx;
      let r = 0, g = 0, b = 0, a = 0, area = 0;
      for (let py = Math.floor(y0); py < Math.min(src.height, Math.ceil(y1)); py++) {
        const wy = Math.min(y1, py + 1) - Math.max(y0, py);
        for (let px = Math.floor(x0); px < Math.min(src.width, Math.ceil(x1)); px++) {
          const wgt = wy * (Math.min(x1, px + 1) - Math.max(x0, px));
          const o = (py * src.width + px) * 4;
          const al = src.data[o + 3]! / 255;
          r += src.data[o]! * al * wgt;
          g += src.data[o + 1]! * al * wgt;
          b += src.data[o + 2]! * al * wgt;
          a += al * wgt;
          area += wgt;
        }
      }
      const o = (y * w + x) * 4;
      out.data[o] = a > 0 ? Math.round(r / a) : 0;
      out.data[o + 1] = a > 0 ? Math.round(g / a) : 0;
      out.data[o + 2] = a > 0 ? Math.round(b / a) : 0;
      out.data[o + 3] = Math.round((a / area) * 255);
    }
  }
  return out;
}

function fillRect(png: PNG, x: number, y: number, w: number, h: number, c: Rgb): void {
  for (let py = Math.max(0, y); py < Math.min(png.height, y + h); py++) {
    for (let px = Math.max(0, x); px < Math.min(png.width, x + w); px++) {
      const o = (py * png.width + px) * 4;
      png.data[o] = c[0];
      png.data[o + 1] = c[1];
      png.data[o + 2] = c[2];
      png.data[o + 3] = 255;
    }
  }
}

/** Draw `src` over the opaque `dst` at (x, y), alpha-blended. */
function blitOver(dst: PNG, src: PNG, x: number, y: number): void {
  for (let sy = 0; sy < src.height; sy++) {
    const dy = y + sy;
    if (dy < 0 || dy >= dst.height) continue;
    for (let sx = 0; sx < src.width; sx++) {
      const dx = x + sx;
      if (dx < 0 || dx >= dst.width) continue;
      const s = (sy * src.width + sx) * 4;
      const d = (dy * dst.width + dx) * 4;
      const a = src.data[s + 3]! / 255;
      for (let c = 0; c < 3; c++) dst.data[d + c] = Math.round(src.data[s + c]! * a + dst.data[d + c]! * (1 - a));
    }
  }
}

/** A 5x7 pixel font: upper case, digits and the punctuation of ids and parameters. */
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "10001", "11001", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "/": ["00000", "00001", "00010", "00100", "01000", "10000", "00000"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "*": ["00000", "00100", "10101", "01110", "10101", "00100", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

/** Draw `text` with its top-left corner at (x, y); lower case is drawn as upper case. */
export function drawText(png: PNG, text: string, x: number, y: number, c: Rgb): void {
  [...text.toUpperCase()].forEach((ch, i) => {
    const glyph = GLYPHS[ch] ?? GLYPHS["?"]!;
    glyph.forEach((row, gy) => {
      for (let gx = 0; gx < 5; gx++) {
        if (row[gx] === "1") fillRect(png, x + i * ADVANCE + gx * FONT_SCALE, y + gy * FONT_SCALE, FONT_SCALE, FONT_SCALE, c);
      }
    });
  });
}

/** What one tile is drawn from: a design (with parameters) or a file. */
export interface SheetSource {
  label: string;
  id?: string;
  params?: ParamValues;
  file?: string;
}

/** The label of a design variant: the parameters that differ from the defaults, or "(default)". */
function variantLabel(design: ProceduralDesign, params: ParamValues): string {
  const defaults = resolveParams(design.params ?? []);
  const changed = Object.entries(params).filter(([k, v]) => defaults[k] !== v).map(([k, v]) => `${k}=${v}`);
  return `${design.id} ${changed.length ? changed.join(" ") : "(default)"}`;
}

/**
 * Every combination of the parameters named in `vary`, the others at their
 * defaults (the defaults first). Throws on a name the design does not have.
 */
export function varyCombinations(design: ProceduralDesign, vary: readonly string[]): ParamValues[] {
  const specs = design.params ?? [];
  for (const name of vary) {
    if (!specs.some((s) => s.name === name)) throw new Error(`"${design.id}" has no parameter "${name}"`);
  }
  let out: ParamValues[] = [resolveParams(specs)];
  for (const s of specs) {
    if (!vary.includes(s.name)) continue;
    const ordered = [s.default, ...s.values.map((v) => v.value).filter((v) => v !== s.default)];
    out = out.flatMap((combo) =>
      paramApplies(s, combo) ? ordered.map((v) => resolveParams(specs, { ...combo, [s.name]: v })) : [combo]);
  }
  const seen = new Set<string>();
  return out.filter((c) => !seen.has(JSON.stringify(c)) && !!seen.add(JSON.stringify(c)));
}

/**
 * Turn the command line's sources into tiles to draw, in order. `variants` is
 * true for every combination the tests build, or the parameters to vary.
 * Throws on an unknown id or parameter.
 */
export function expandSources(
  args: readonly string[],
  designs: ReadonlyMap<string, ProceduralDesign>,
  variants: boolean | readonly string[] = false,
): SheetSource[] {
  const out: SheetSource[] = [];
  const addDesign = (design: ProceduralDesign) => {
    if (variants !== false && design.params?.length) {
      const combos = variants === true
        ? coverageCombinations(design.params, design.finishParams)
        : varyCombinations(design, variants);
      for (const params of combos) {
        out.push({ label: variantLabel(design, params), id: design.id, params });
      }
    } else {
      out.push({ label: design.id, id: design.id });
    }
  };
  for (const arg of args) {
    const lower = arg.toLowerCase();
    if (lower.endsWith(".png") || lower.endsWith(".glb")) {
      out.push({ label: path.basename(arg), file: arg });
    } else if (arg.includes("?")) {
      const [id, query] = arg.split("?", 2) as [string, string];
      const design = designs.get(id);
      if (!design) throw new Error(`no procedural model "${id}"`);
      const given = Object.fromEntries(new URLSearchParams(query));
      const params = resolveParams(design.params ?? [], given);
      out.push({ label: variantLabel(design, params), id, params });
    } else if (arg.endsWith("*")) {
      const prefix = arg.slice(0, -1);
      const matched = [...designs.values()].filter((d) => d.id.startsWith(prefix));
      if (matched.length === 0) throw new Error(`no procedural model starts with "${prefix}"`);
      matched.forEach(addDesign);
    } else {
      const design = designs.get(arg);
      if (!design) throw new Error(`no procedural model "${arg}"`);
      addDesign(design);
    }
  }
  return out;
}

/** More tiles than this make one image too small to judge in a chat. */
const MANY = 24;

const USAGE =
  "usage: tsx generator/contactSheet.ts <out.png> [--variants | --vary a,b] [--view auto|3q|side] [--cols N] [--cell PX] [--no-labels] <id | id* | id?k=v | file.png | file.glb>...";

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const opts: SheetOptions = {};
  let view = "auto";
  let variants: boolean | string[] = false;
  let labels = true;
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--variants") variants = true;
    else if (a === "--vary") variants = (argv[++i] ?? "").split(",").filter(Boolean);
    else if (a === "--view") view = argv[++i] ?? "";
    else if (a === "--no-labels") labels = false;
    else if (a === "--cols") opts.cols = Number(argv[++i]);
    else if (a === "--cell") opts.cell = Number(argv[++i]);
    else rest.push(a);
  }
  const [outArg, ...sourceArgs] = rest;
  if (!outArg || sourceArgs.length === 0 || !["auto", "3q", "side"].includes(view)) {
    console.error(USAGE);
    process.exit(1);
  }
  const { DESIGNS, designGlb, designUsesSideView } = await import("./generate.ts");
  const sources = expandSources(sourceArgs, DESIGNS, variants);
  if (sources.length > MANY) {
    console.warn(`${sources.length} images: too many to read in one chat image; narrow it with --vary or split the sheet`);
  }
  const isSide = (s: SheetSource) =>
    view === "side" || (view === "auto" && s.id !== undefined && designUsesSideView(s.id));
  const cell = opts.cell ?? defaultCell(sources.some(isSide));
  const tiles: SheetTile[] = sources.map((s) => {
    const side = isSide(s);
    if (!labels) s = { ...s, label: "" };
    if (s.file?.toLowerCase().endsWith(".png")) return { label: s.label, png: PNG.sync.read(fs.readFileSync(s.file)), side };
    const glb: GlbSource = s.file ?? designGlb(s.id!, s.params);
    return { label: s.label, png: side ? renderGlbSideThumb(glb).png : renderGlbThumb(glb, cell), side };
  });
  const png = composeSheet(tiles, { ...opts, cell });
  fs.mkdirSync(path.dirname(outArg), { recursive: true });
  fs.writeFileSync(outArg, PNG.sync.write(png));
  console.log(`wrote ${outArg} (${png.width}x${png.height}, ${tiles.length} images)`);
}
