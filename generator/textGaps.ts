// `pnpm exec tsx generator/textGaps.ts [--sort]`: what the phrasebooks in text/ lack
// (docs/models/text.md, the translate-text skill). Prints, per language, the English
// strings with no translation, the stale phrases and the unused overrides; prints
// nothing when every language is complete. --sort rewrites every phrasebook sorted.
import fs from "node:fs";
import path from "node:path";
import { TEXT_DIR, TRANSLATED_LOCALES, exportedText, readPhrasebook, readVerbatim, textGaps } from "./text.ts";

const text = exportedText();
const verbatim = readVerbatim();
const sortKeys = (o: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]!]));

let gaps = 0;
for (const locale of TRANSLATED_LOCALES) {
  const book = readPhrasebook(locale);
  if (process.argv.includes("--sort")) {
    fs.writeFileSync(path.join(TEXT_DIR, `${locale}.json`), `${JSON.stringify({ phrases: sortKeys(book.phrases), overrides: sortKeys(book.overrides) }, null, 1)}\n`);
  }
  const g = textGaps(locale, text, book, verbatim);
  const n = g.missing.length + g.stale.length + g.unusedOverrides.length;
  if (!n) continue;
  gaps += n;
  console.log(`${locale}: ${g.missing.length} missing, ${g.stale.length} stale, ${g.unusedOverrides.length} unused overrides`);
  for (const en of g.missing) console.log(`  missing  ${JSON.stringify(en)}`);
  for (const en of g.stale) console.log(`  stale    ${JSON.stringify(en)}`);
  for (const key of g.unusedOverrides) console.log(`  override ${key}`);
}
if (process.argv.includes("--sort") && fs.existsSync(path.join(TEXT_DIR, "verbatim.json"))) {
  fs.writeFileSync(path.join(TEXT_DIR, "verbatim.json"), `${JSON.stringify([...verbatim].sort(), null, 1)}\n`);
}
process.exitCode = gaps ? 1 : 0;
