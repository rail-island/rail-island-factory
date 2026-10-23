// `pnpm sets:pins`: rewrite test/fixtures/set-pins.json from the cases in
// pinCases.ts, naming the cases whose hash moved. Run it when a redraw of a shipped
// set type is meant (docs/models/sets.md); the game's import then flags the same.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setPins } from "./pinCases.ts";

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "test", "fixtures", "set-pins.json");
const prev = fs.existsSync(FILE) ? (JSON.parse(fs.readFileSync(FILE, "utf8")) as Record<string, Record<string, string>>) : {};
const next = setPins();
for (const [set, cases] of Object.entries(next)) {
  const moved = Object.keys(cases).filter((k) => prev[set]?.[k] !== undefined && prev[set]![k] !== cases[k]);
  if (moved.length) console.log(`  ${set}: redraws ${moved.join(", ")}`);
}
fs.writeFileSync(FILE, `${JSON.stringify(next, null, 2)}\n`);
console.log(`set pins: ${Object.keys(next).join(", ")}`);
