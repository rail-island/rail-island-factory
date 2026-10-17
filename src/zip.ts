// A store-only ZIP writer: the files as they are, no compression, every date
// 1980-01-01 so the same files always make the same bytes. Pure; no DOM.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

/** The CRC-32 a ZIP stores for a file. */
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** DOS date 1980-01-01, time 00:00. */
const DOS_DATE = (0 << 9) | (1 << 5) | 1;
const DOS_TIME = 0;
/** General purpose flag bit 11: the file names are UTF-8. */
const UTF8 = 0x0800;

/** The bytes of a ZIP archive holding `files` in order. Names must be unique. */
export function zipStore(files: ReadonlyArray<{ name: string; data: Uint8Array }>): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder();
  const names = new Set<string>();
  const entries = files.map((f) => {
    if (names.has(f.name)) throw new Error(`duplicate file name in ZIP: ${f.name}`);
    names.add(f.name);
    return { name: enc.encode(f.name), data: f.data, crc: crc32(f.data) };
  });
  const size = entries.reduce((s, e) => s + 30 + e.name.length + e.data.length + 46 + e.name.length, 22);
  const out = new Uint8Array(size);
  const view = new DataView(out.buffer);
  let p = 0;
  const u16 = (v: number) => { view.setUint16(p, v, true); p += 2; };
  const u32 = (v: number) => { view.setUint32(p, v >>> 0, true); p += 4; };
  const offsets: number[] = [];
  for (const e of entries) {
    offsets.push(p);
    u32(0x04034b50); u16(20); u16(UTF8); u16(0); u16(DOS_TIME); u16(DOS_DATE);
    u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length); u16(0);
    out.set(e.name, p); p += e.name.length;
    out.set(e.data, p); p += e.data.length;
  }
  const central = p;
  entries.forEach((e, i) => {
    u32(0x02014b50); u16(20); u16(20); u16(UTF8); u16(0); u16(DOS_TIME); u16(DOS_DATE);
    u32(e.crc); u32(e.data.length); u32(e.data.length); u16(e.name.length); u16(0); u16(0);
    u16(0); u16(0); u32(0); u32(offsets[i]!);
    out.set(e.name, p); p += e.name.length;
  });
  const centralSize = p - central;
  u32(0x06054b50); u16(0); u16(0); u16(entries.length); u16(entries.length); u32(centralSize); u32(central); u16(0);
  return out;
}
