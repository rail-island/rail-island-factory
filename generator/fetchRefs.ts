// pnpm refs:fetch - downloads reference photographs from Wikimedia Commons into a
// model's assets/<name>/ folder and records them in its SOURCES.md
// (docs/models/world-fleet.md).
//
//   pnpm refs:fetch <name> --list "<Wikipedia article>"     lists the article's Commons files
//   pnpm refs:fetch <name> "File:<title>" ["File:<title>" ...] [--use "<what it informs>"]
//
// Each file is fetched as one of Commons' standard thumbnail widths (at most 1280 px on
// the long side) and
// re-encoded as a JPEG of about 250 KB or less (sharp); its author, licence and
// page URL come from the file's extmetadata. The rows are appended to the
// "## Photographs" table of SOURCES.md, which is created with the repository's
// heading if it is missing. Only freely licensed files are taken: a file whose
// licence is not CC0, public domain or CC BY / BY-SA is refused.
//
// The API is reached through en.wikipedia.org (Commons is its shared file
// repository) with curl, so the session's HTTPS proxy applies.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const API = "https://en.wikipedia.org/w/api.php";
const UA = "RailIslandFactory/0.1 (https://factory.railisland.com; reference photographs)";
/** The longest side a stored photograph keeps, px. */
export const REF_MAX_SIDE = 1280;
/** The size a stored photograph aims under, bytes. */
export const REF_MAX_BYTES = 260_000;

function get(url: string): Buffer {
  return execFileSync("curl", ["-sSfL", "--retry", "4", "--retry-delay", "6", "--max-time", "90", "-A", UA, url], { maxBuffer: 64 << 20 });
}

function api(params: Record<string, string>): any {
  const q = new URLSearchParams({ format: "json", formatversion: "2", ...params });
  return JSON.parse(get(`${API}?${q}`).toString("utf8"));
}

/** Plain text of an extmetadata value (it may hold HTML). */
const plain = (s: string | undefined): string => (s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/** Whether a licence name is one the factory may store and redistribute with attribution. */
export function freeLicence(name: string): boolean {
  return /^(cc0|cc[ -]by(-sa)?[ -]\d|public domain|pd\b|pd-|fal\b|free art licen[cs]e)/i.test(name.trim());
}

/** A file name for a Commons title: lower case, ascii, dashes, `photo-` first. */
export function refFileName(title: string): string {
  const base = title.replace(/^File:/i, "").replace(/\.[a-z0-9]+$/i, "");
  const slug = base.normalize("NFKD").replace(/[^\x00-\x7f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  return `photo-${slug}.jpg`;
}

interface Info { title: string; url: string; page: string; author: string; licence: string }

/** The thumbnail widths Wikimedia serves (https://w.wiki/GHai); other widths and originals are refused or rate-limited. */
const THUMB_WIDTHS = [330, 500, 960, 1280];

/** The widest standard thumbnail narrower than the original whose long side stays within REF_MAX_SIDE. */
export function thumbWidth(width: number, height: number): number {
  const fit = THUMB_WIDTHS.filter((w) => w < width && Math.max(w, (w * height) / width) <= REF_MAX_SIDE);
  return fit[fit.length - 1] ?? THUMB_WIDTHS[0]!;
}

function info(title: string): Info {
  const size = api({ action: "query", prop: "imageinfo", titles: title, iiprop: "size" }).query.pages[0]?.imageinfo?.[0];
  if (!size) throw new Error(`${title}: no such file on Commons`);
  const r = api({ action: "query", prop: "imageinfo", titles: title, iiprop: "url|extmetadata", iiurlwidth: String(thumbWidth(size.width, size.height)) });
  const page = r.query.pages[0];
  const ii = page?.imageinfo?.[0];
  if (!ii) throw new Error(`${title}: no such file on Commons`);
  const md = ii.extmetadata ?? {};
  return {
    title: page.title,
    url: ii.thumburl ?? ii.url,
    page: ii.descriptionurl,
    author: plain(md.Artist?.value) || "unknown",
    licence: plain(md.LicenseShortName?.value) || "unknown",
  };
}

/** Encodes a photo within REF_MAX_SIDE and, quality stepping down, about REF_MAX_BYTES. */
async function encode(src: Buffer): Promise<Buffer> {
  let out = Buffer.alloc(0);
  for (const quality of [82, 74, 66, 58, 50]) {
    out = await sharp(src).rotate().resize(REF_MAX_SIDE, REF_MAX_SIDE, { fit: "inside", withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (out.length <= REF_MAX_BYTES) break;
  }
  return out;
}

function sourcesHeading(name: string): string {
  return `# ${name} references\n\n**Covers** - provenance of the \`${name}\` model's references: photographs and published figures.\n**Code** - see the design that names \`references: "${name}"\`\n**See also** - [docs/models/world-fleet.md](../../docs/models/world-fleet.md)\n\n## Photographs\n\nDownloaded from Wikimedia Commons by \`pnpm refs:fetch\` as standard thumbnails, at most ${REF_MAX_SIDE} px on the long side.\n\n| file | original | URL | author | licence | use |\n|---|---|---|---|---|---|\n`;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const name = args.shift();
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error("usage: pnpm refs:fetch <name> (--list <article> | File:<title> ... [--use <text>])");
  if (args[0] === "--list") {
    const r = api({ action: "query", prop: "images", titles: args[1]!, imlimit: "100" });
    for (const im of r.query.pages[0]?.images ?? []) console.log(im.title);
    return;
  }
  const useAt = args.indexOf("--use");
  const use = useAt >= 0 ? args.splice(useAt, 2)[1]! : "shape, proportions and colours";
  const dir = join("assets", name);
  mkdirSync(dir, { recursive: true });
  const sources = join(dir, "SOURCES.md");
  let md = existsSync(sources) ? readFileSync(sources, "utf8") : sourcesHeading(name);
  for (const title of args) {
    const i = info(title.startsWith("File:") ? title : `File:${title}`);
    if (!freeLicence(i.licence)) throw new Error(`${i.title}: licence "${i.licence}" is not free; pick another file`);
    const file = refFileName(i.title);
    const bytes = await encode(get(i.url));
    writeFileSync(join(dir, file), bytes);
    const row = `| \`${file}\` | ${i.title.replace(/^File:/, "")} | ${i.page} | ${i.author.replace(/\|/g, "/")} | ${i.licence} | ${use} |\n`;
    if (!md.includes(`\`${file}\``)) md = md.includes("\n## Published figures") ? md.replace("\n## Published figures", `${row}\n## Published figures`) : md + row;
    console.log(`${file}  ${bytes.length} B  ${i.licence}  ${i.author}`);
  }
  writeFileSync(sources, md);
}

if (process.argv[1]?.endsWith("fetchRefs.ts")) main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
