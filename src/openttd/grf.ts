// The OpenTTD NewGRF encoder: resolved vehicles and their rendered sprites in, the
// bytes of a `.grf` file out. Pure TypeScript -- no DOM, no three -- so Vitest
// drives it in node and the same bytes come out for the same input.
//
// It writes GRF container version 2 (docs/site/openttd-export.md): the header
// signature, the data section of pseudo sprites (the "actions") with references
// into the sprite section, and the sprite section with each sprite's 32bpp
// images at OpenTTD's three zoom levels. Only the subset of NewGRF the export
// needs is here, laid out as nmlc 0.9 lays out the equivalent NML:
//
//   Action 14  INFO: palette and the 32bpp blitter request
//   Action 8   GRF id, name, description (GRF version 8)
//   Action 0   global: the rail type and cargo translation tables
//   per vehicle:
//     Action 0  the head's properties, then each articulated part's
//     Action 4  the name
//     Action 1  one sprite set of 8 directions per part
//     Action 2  a basic set per part; for an articulated vehicle the callback
//               switch (var 0C) and the articulated-part switch (var 10)
//     Action 3  the graphics of the head and each part

import type { OpenttdCargoClass, OpenttdClimate } from "../../generator/design.ts";
import { MAX_PARTS, type OpenttdFeature, type ResolvedVehicle } from "./properties";

/** OpenTTD's zoom levels as the GRF container numbers them. */
export const GRF_ZOOM = { normal: 0, in4x: 1, in2x: 2 } as const;
export type GrfZoom = (typeof GRF_ZOOM)[keyof typeof GRF_ZOOM];

/** One 32bpp image of a sprite at one zoom level. */
export interface GrfImage {
  zoom: GrfZoom;
  width: number;
  height: number;
  /** Where the image's top-left pixel lies relative to the vehicle's position, in this zoom's pixels. */
  xOffs: number;
  yOffs: number;
  /** width * height pixels, RGBA, not premultiplied. */
  rgba: Uint8Array;
}

/** One part of a vehicle: its local id, its length in eighths and its 8 directions' images. */
export interface GrfPart {
  id: number;
  /** 1..8. */
  length: number;
  /** Indexed by OpenTTD's Direction (N, NE, E, SE, S, SW, W, NW); each holds the zoom levels' images. */
  directions: GrfImage[][];
}

/** One exported vehicle: its figures and its parts, the head first. */
export interface GrfVehicle {
  vehicle: ResolvedVehicle;
  parts: GrfPart[];
}

export interface GrfSet {
  /** Four bytes. */
  grfid: Uint8Array;
  name: string;
  description: string;
  vehicles: GrfVehicle[];
}

const FEATURE_BYTE: Record<OpenttdFeature, number> = { train: 0x00, road: 0x01, ship: 0x02, aircraft: 0x03 };
const CLIMATE_BIT: Record<OpenttdClimate, number> = { temperate: 1, arctic: 2, tropical: 4, toyland: 8 };
const CARGO_CLASS_BIT: Record<OpenttdCargoClass, number> = {
  passengers: 0, mail: 1, express: 2, armoured: 3, bulk: 4, piece: 5, liquid: 6, refrigerated: 7, hazardous: 8, covered: 9,
};
/** Running cost base tables (the "running_cost_base" sprite numbers). */
const RUNNING_COST = { steam: 0x4c30, diesel: 0x4c36, electric: 0x4c3c, road: 0x4c48 } as const;
/** A train's engine class (property 19). */
const ENGINE_CLASS = { steam: 0x00, diesel: 0x08, electric: 0x28 } as const;
/** The container version 2 signature. */
const SIGNATURE = [0x00, 0x00, 0x47, 0x52, 0x46, 0x82, 0x0d, 0x0a, 0x1a, 0x0a];
/** Sprite colour components: RGB and alpha. */
const TYPE_RGBA = 0x03;
/** The default loading speed OpenTTD's own vehicles use. */
const LOADING_SPEED = 5;
/**
 * The coefficient of tractive effort, 0.3 in 1/256ths as nmlc writes it: the share
 * of a powered vehicle's weight its wheels pull with. OpenTTD leaves a GRF's new
 * engine at 0, and with realistic acceleration an engine with no tractive effort
 * barely moves whatever its power.
 */
const TRACTIVE_EFFORT = 0x4d;

/** A growable little-endian byte buffer. */
class Bytes {
  private buf = new Uint8Array(256);
  length = 0;
  private room(n: number): void {
    if (this.length + n <= this.buf.length) return;
    let size = this.buf.length * 2;
    while (size < this.length + n) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.length));
    this.buf = next;
  }
  u8(v: number): this {
    this.room(1);
    this.buf[this.length++] = v & 0xff;
    return this;
  }
  u16(v: number): this {
    return this.u8(v).u8(v >>> 8);
  }
  u32(v: number): this {
    return this.u16(v & 0xffff).u16(v >>> 16);
  }
  /** An extended byte: a value under 0xFF as one byte, else 0xFF and a word. */
  ext(v: number): this {
    return v < 0xff ? this.u8(v) : this.u8(0xff).u16(v);
  }
  bytes(b: ArrayLike<number>): this {
    this.room(b.length);
    this.buf.set(b, this.length);
    this.length += b.length;
    return this;
  }
  /** A four-character label. */
  label(s: string): this {
    for (let i = 0; i < 4; i++) this.u8(s.charCodeAt(i));
    return this;
  }
  /** A zero-terminated string: plain ASCII as it is, anything else UTF-8 marked as Unicode (the "Thorn" prefix). */
  str(s: string): this {
    if (!/^[\x20-\x7e]*$/.test(s)) this.bytes([0xc3, 0x9e]);
    return this.bytes(new TextEncoder().encode(s)).u8(0);
  }
  done(): Uint8Array<ArrayBuffer> {
    return this.buf.slice(0, this.length);
  }
}

/** Days from 1 January of year 0 to 1 January of `year`, OpenTTD's long date format. */
export function daysSinceYearZero(year: number): number {
  if (year <= 0) return 0;
  const y = year - 1;
  return 365 * year + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + 1;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, Math.round(v)));

/**
 * GRF sprite compression: literal runs (a count byte, 1..127, then the bytes)
 * and back references (a byte whose top five bits hold minus the length, 3..16,
 * and whose low three bits with the next byte hold the distance, 1..2047). A
 * transparent run of pixels repeats at a distance of 4 and packs 16 bytes in 2.
 */
export function grfCompress(src: Uint8Array): Uint8Array {
  const out = new Bytes();
  const n = src.length;
  const head = new Int32Array(1 << 16).fill(-1);
  const prev = new Int32Array(n).fill(-1);
  let lit = 0;
  const flush = (end: number): void => {
    let start = end - lit;
    while (lit > 0) {
      const k = Math.min(127, lit);
      out.u8(k).bytes(src.subarray(start, start + k));
      start += k;
      lit -= k;
    }
  };
  const hashAt = (p: number): number => ((src[p]! << 8) ^ (src[p + 1]! << 4) ^ src[p + 2]!) & 0xffff;
  const insert = (p: number): void => {
    if (p + 2 >= n) return;
    const h = hashAt(p);
    prev[p] = head[h]!;
    head[h] = p;
  };
  let i = 0;
  while (i < n) {
    let bestLen = 0;
    let bestOff = 0;
    const maxLen = Math.min(16, n - i);
    const tryAt = (cand: number): void => {
      const off = i - cand;
      if (off < 1 || off > 2047) return;
      let len = 0;
      while (len < maxLen && src[cand + len] === src[i + len]) len++;
      if (len > bestLen) {
        bestLen = len;
        bestOff = off;
      }
    };
    if (maxLen >= 3) {
      if (i >= 4) tryAt(i - 4);
      let cand = i + 2 < n ? head[hashAt(i)]! : -1;
      for (let depth = 0; cand >= 0 && depth < 24 && bestLen < maxLen; depth++) {
        if (i - cand > 2047) break;
        tryAt(cand);
        cand = prev[cand]!;
      }
    }
    if (bestLen >= 3) {
      flush(i);
      out.u8(((-bestLen * 8) & 0xf8) | (bestOff >> 8)).u8(bestOff & 0xff);
      for (let k = 0; k < bestLen; k++) insert(i + k);
      i += bestLen;
    } else {
      insert(i);
      lit++;
      i++;
      if (lit === 127) flush(i);
    }
  }
  flush(i);
  return out.done();
}

/** The inverse of grfCompress (and of any valid GRF compression): what OpenTTD reads. */
export function grfDecompress(src: Uint8Array, size: number): Uint8Array {
  const dest = new Uint8Array(size);
  let d = 0;
  let s = 0;
  while (d < size) {
    const code = (src[s++]! << 24) >> 24;
    if (code >= 0) {
      const len = code === 0 ? 0x80 : code;
      if (d + len > size) throw new Error("corrupt sprite: literal overrun");
      dest.set(src.subarray(s, s + len), d);
      s += len;
      d += len;
    } else {
      const off = ((code & 7) << 8) | src[s++]!;
      const len = -(code >> 3);
      if (off < 1 || off > d || d + len > size) throw new Error("corrupt sprite: bad back reference");
      for (let k = 0; k < len; k++, d++) dest[d] = dest[d - off]!;
    }
  }
  if (s !== src.length) throw new Error("corrupt sprite: trailing bytes");
  return dest;
}

/** The labels a list of vehicles uses, in first-use order, `first` leading. */
function labelTable(labels: Iterable<string>, first: string): string[] {
  const out = [first];
  for (const l of labels) if (!out.includes(l)) out.push(l);
  return out;
}

function climateMask(cs: readonly OpenttdClimate[]): number {
  return cs.reduce((m, c) => m | CLIMATE_BIT[c], 0);
}

function refitClassMask(cs: readonly OpenttdCargoClass[]): number {
  return cs.reduce((m, c) => m | (1 << CARGO_CLASS_BIT[c]), 0);
}

/**
 * An Action 0 for one id: `props` is a list of [property, writer] pairs, written
 * in order.
 */
function action0(feature: number, id: number, props: Array<[number, (b: Bytes) => void]>): Uint8Array {
  const b = new Bytes().u8(0x00).u8(feature).u8(props.length).u8(1).ext(id);
  for (const [prop, write] of props) {
    b.u8(prop);
    write(b);
  }
  return b.done();
}

const B = (v: number) => (b: Bytes) => void b.u8(v);
const W = (v: number) => (b: Bytes) => void b.u16(v);
const D = (v: number) => (b: Bytes) => void b.u32(v);

/** The head's properties for its vehicle type. */
function headProps(v: ResolvedVehicle, length: number, articulated: boolean, cargoIndex: number, railIndex: number): Array<[number, (b: Bytes) => void]> {
  const common: Array<[number, (b: Bytes) => void]> = [
    [0x06, B(climateMask(v.climates))],
  ];
  const lifes: Array<[number, (b: Bytes) => void]> = [
    [0x04, B(clamp(v.modelLife, 1, 255))],
    [0x03, B(clamp(v.vehicleLife, 1, 255))],
    [0x02, B(clamp(v.reliabilityDecay, 0, 255))],
    [0x07, B(LOADING_SPEED)],
  ];
  const date = D(daysSinceYearZero(v.introYear));
  const refits = refitClassMask(v.refitClasses);
  const hp = v.power / 0.745699872;
  switch (v.feature) {
    case "train": {
      const tons = clamp(v.weight, 0, 0xffff);
      const props: Array<[number, (b: Bytes) => void]> = [
        ...common, [0x2a, date], ...lifes,
        [0x05, B(railIndex)],
        [0x09, W(clamp(v.speed, 0, 0xffff))],
        [0x0b, W(clamp(hp, 0, 0xffff))],
        [0x16, B(tons & 0xff)],
        [0x24, B(tons >> 8)],
      ];
      if (v.traction) props.push([0x0e, D(RUNNING_COST[v.traction])], [0x19, B(ENGINE_CLASS[v.traction])]);
      props.push(
        [0x0d, B(clamp(v.runningCostFactor, 0, 255))],
        [0x17, B(clamp(v.costFactor, 0, 255))],
        [0x14, B(clamp(v.capacity, 0, 255))],
        [0x15, B(cargoIndex)],
        [0x28, W(refits)],
        [0x1d, D(0)],
        [0x29, W(0)],
        [0x1d, D(0)],
        [0x1f, B(TRACTIVE_EFFORT)],
        [0x21, B(8 - length)],
        [0x12, B(0xfd)],
      );
      if (articulated) props.push([0x1e, B(0x10)]);
      return props;
    }
    case "road": {
      const props: Array<[number, (b: Bytes) => void]> = [
        ...common, [0x1f, date], ...lifes,
        [0x08, B(clamp(v.speed * 2, 1, 255))],
        [0x13, B(clamp(hp / 10, 0, 255))],
        [0x14, B(clamp(v.weight * 4, 0, 255))],
        [0x0a, D(RUNNING_COST.road)],
        [0x09, B(clamp(v.runningCostFactor, 0, 255))],
        [0x11, B(clamp(v.costFactor, 0, 255))],
        [0x0f, B(clamp(v.capacity, 0, 255))],
        [0x10, B(cargoIndex)],
        [0x18, B(TRACTIVE_EFFORT)],
        [0x23, B(8 - length)],
        [0x0e, B(0xff)],
        [0x1d, W(refits)],
        [0x16, D(0)],
      ];
      if (v.tram) props.push([0x1c, B(0x01)]);
      if (articulated) props.push([0x17, B(0x10)]);
      return props;
    }
    case "ship":
      return [
        ...common, [0x1a, date], ...lifes,
        [0x0b, B(clamp(v.speed * 2, 1, 255))],
        [0x0f, B(clamp(v.runningCostFactor, 0, 255))],
        [0x0a, B(clamp(v.costFactor, 0, 255))],
        [0x0d, W(clamp(v.capacity, 0, 0xffff))],
        [0x0c, B(cargoIndex)],
        [0x08, B(0xff)],
        [0x18, W(refits)],
        [0x11, D(0)],
      ];
    case "aircraft":
      return [
        ...common, [0x1a, date], ...lifes,
        [0x0c, B(clamp(Math.floor(v.speed / 12.8), 1, 255))],
        [0x0e, B(clamp(v.runningCostFactor, 0, 255))],
        [0x0b, B(clamp(v.costFactor, 0, 255))],
        [0x0f, W(clamp(v.capacity, 0, 0xffff))],
        [0x11, B(clamp(v.capacity / 15, 0, 255))],
        [0x09, B(0x02)],
        [0x0a, B(v.largeAircraft ? 0x01 : 0x00)],
        [0x08, B(0xff)],
        // An aircraft has no default-cargo property: OpenTTD takes the first refittable
        // cargo and disables an aircraft that has none, so passengers are always refittable.
        [0x18, W(refits | (1 << CARGO_CLASS_BIT.passengers))],
        [0x13, D(0)],
      ];
  }
}

/** A hidden articulated part: no climate (never offered on its own), its length, the head's rail type. */
function partProps(feature: OpenttdFeature, length: number, railIndex: number): Array<[number, (b: Bytes) => void]> {
  if (feature === "train") {
    return [[0x06, B(0)], [0x05, B(railIndex)], [0x0b, W(0)], [0x14, B(0)], [0x21, B(8 - length)], [0x12, B(0xfd)]];
  }
  return [[0x06, B(0)], [0x0f, B(0)], [0x23, B(8 - length)], [0x0e, B(0xff)]];
}

/** Encode a whole set: the bytes of the `.grf` file. */
export function encodeGrf(set: GrfSet): Uint8Array<ArrayBuffer> {
  if (set.grfid.length !== 4) throw new Error("a GRF id has four bytes");
  /** The data section: pseudo sprites, and real-sprite references by sprite id. */
  const data: Array<{ kind: "pseudo"; bytes: Uint8Array } | { kind: "ref"; id: number }> = [];
  const sprites: GrfImage[][] = [];
  const push = (bytes: Uint8Array) => void data.push({ kind: "pseudo", bytes });

  push(
    new Bytes()
      .u8(0x14)
      .u8(0x43).label("INFO")
      .u8(0x42).label("PALS").u16(1).u8(0x44)
      .u8(0x42).label("BLTR").u16(1).u8(0x33)
      .u8(0)
      .u8(0)
      .done(),
  );
  push(new Bytes().u8(0x08).u8(0x08).bytes(set.grfid).str(set.name).str(set.description).done());

  const cargos = labelTable(set.vehicles.map((v) => v.vehicle.cargo), "PASS");
  const rails = labelTable(set.vehicles.filter((v) => v.vehicle.feature === "train").map((v) => v.vehicle.railType), "RAIL");
  const table = (prop: number, labels: string[]) => {
    const b = new Bytes().u8(0x00).u8(0x08).u8(1).u8(labels.length).ext(0).u8(prop);
    for (const l of labels) b.label(l);
    return b.done();
  };
  push(table(0x12, rails));
  push(table(0x09, cargos));

  for (const { vehicle: v, parts } of set.vehicles) {
    if (parts.length === 0 || parts.length > MAX_PARTS) throw new Error(`${v.name}: a vehicle has 1 to ${MAX_PARTS} parts`);
    const feat = FEATURE_BYTE[v.feature];
    const articulated = parts.length > 1;
    if (articulated && (v.feature === "ship" || v.feature === "aircraft")) throw new Error(`${v.name}: only trains and road vehicles articulate`);
    const head = parts[0]!;
    const cargoIndex = cargos.indexOf(v.cargo);
    const railIndex = v.feature === "train" ? rails.indexOf(v.railType) : 0;
    push(action0(feat, head.id, headProps(v, head.length, articulated, cargoIndex, railIndex)));
    for (const p of parts.slice(1)) push(action0(feat, p.id, partProps(v.feature, p.length, railIndex)));
    push(new Bytes().u8(0x04).u8(feat).u8(0x7f).u8(1).ext(head.id).str(v.name).done());

    // Action 1: one set of 8 directions per part, then the sprites themselves.
    push(new Bytes().u8(0x01).u8(feat).u8(parts.length).u8(0xff).u16(8).done());
    for (const p of parts) {
      if (p.directions.length !== 8) throw new Error(`${v.name}: a part has 8 directions`);
      for (const images of p.directions) {
        sprites.push(images);
        data.push({ kind: "ref", id: sprites.length });
      }
    }
    // Action 2: a basic set per part, the same images loaded and loading.
    parts.forEach((_, i) => push(new Bytes().u8(0x02).u8(feat).u8(i).u8(1).u8(1).u16(i).u16(i).done()));
    let headSet = 0;
    if (articulated) {
      // var 10 (the part index asked for, from 1): the next part's id, or "no more parts".
      const artic = new Bytes().u8(0x02).u8(feat).u8(0xfe).u8(0x89).u8(0x10).u8(0x00).u32(0xff).u8(parts.length - 1);
      parts.slice(1).forEach((p, k) => artic.u16(0x8000 | p.id).u32(k + 1).u32(k + 1));
      push(artic.u16(0xffff).done());
      // var 0C (the callback): 16, the articulated-part callback, goes to the switch above; drawing to set 0.
      push(new Bytes().u8(0x02).u8(feat).u8(0xff).u8(0x89).u8(0x0c).u8(0x00).u32(0xffff).u8(1).u16(0xfe).u32(0x16).u32(0x16).u16(0).done());
      headSet = 0xff;
    }
    // Action 3: the head's graphics, then each part's own set.
    push(new Bytes().u8(0x03).u8(feat).u8(1).ext(head.id).u8(0).u16(headSet).done());
    parts.slice(1).forEach((p, i) => push(new Bytes().u8(0x03).u8(feat).u8(1).ext(p.id).u8(0).u16(i + 1).done()));
  }

  const out = new Bytes().bytes(SIGNATURE);
  // The data section: the compression byte, the sprite count, the entries, a terminator.
  const body = new Bytes().u8(0x00);
  body.u32(4).u8(0xff).u32(data.length);
  for (const e of data) {
    if (e.kind === "pseudo") body.u32(e.bytes.length).u8(0xff).bytes(e.bytes);
    else body.u32(4).u8(0xfd).u32(e.id);
  }
  body.u32(0);
  out.u32(body.length).bytes(body.done());
  // The sprite section: every image of every sprite id, then a terminator.
  sprites.forEach((images, k) => {
    for (const img of images) {
      if (img.width < 1 || img.height < 1 || img.rgba.length !== img.width * img.height * 4) {
        throw new Error(`sprite ${k + 1}: a ${img.width}x${img.height} image needs ${img.width * img.height * 4} bytes`);
      }
      const packed = grfCompress(img.rgba);
      out.u32(k + 1).u32(10 + packed.length)
        .u8(TYPE_RGBA).u8(img.zoom)
        .u16(img.height).u16(img.width).u16(img.xOffs & 0xffff).u16(img.yOffs & 0xffff)
        .bytes(packed);
    }
  });
  out.u32(0);
  return out.done();
}
