# Exported text

**Covers** - the text the game shows from the factory in its 14 languages: which strings are
exported and under which keys, the phrasebooks in `text/` keyed by the English, verbatim
proper-noun titles, overrides, the export files, the gap check and who fixes gaps.
**Code** - `generator/text.ts`, `generator/textGaps.ts`, `text/<code>.json`, `text/verbatim.json`,
`test/text.test.ts`, `.agents/skills/translate-text/`
**See also** - [sets.md](sets.md), [parameters.md](parameters.md), [export.md](export.md), the
game's `docs/architecture/i18n.md`

## What is exported

Every string the game shows from the factory, with its English where it is authored:

| Key | English from |
|---|---|
| `model.<id>` | the title of a design a game meta lists: a building, village house, vehicle or character (not trees, woods groves, props or previews) |
| `model.<id>.param.<name>`, `model.<id>.param.<name>.<value>` | its parameter and value titles |
| `set.<set>.<id>`, `set.<set>.<id>.desc` | the set registry's type name and description |
| `set.<set>.group.<id>`, `.desc` | a set group (a road family) |
| `woods.<name>`, `woods.<name>.param...` | a woods type's label and parameters |
| `woods.variant.<key>` | a woods variant that keeps its old type name (`NAMED_WOODS_VARIANTS`) |
| `species.<key>` | `SPECIES_LABELS` |
| `category.<name>` | `CATEGORY_LABELS`, the building picker's tabs |
| `traction.<name>` | `TRACTION_LABELS` |

The site UI itself stays English, as do OpenTTD names and the GLB ZIP.

## Phrasebooks

`text/<code>.json` (13 files, every language but English) holds
`{ "phrases": { "<English>": "<translation>" }, "overrides": { "<key>": "<translation>" } }`.
A phrase translates every key with that English; an override translates one key differently
(a value whose grammar follows its parameter). Keying by the English is the fingerprint: a
reworded English has no phrase yet and shows as missing, and the old phrase shows as stale.

`text/verbatim.json` lists English strings that are names and are copied unchanged into every
language - a class designation ("CD 754"), a brand ("Mercedes-Benz Citaro"), "Big Ben". A string
with no letter at all (a number) is verbatim without a listing. Descriptive titles are
translated.

## Export and checks

A whole export writes `export/text/<code>.json` for all 14 languages: every key, sorted, with
English where a translation is missing. The model build never waits for translations.

`test/text.test.ts` fails on a missing translation, a stale phrase, an unused override or a
verbatim entry nothing exports; the game's import refuses an export with gaps and an export
whose language list differs from its own. `pnpm exec tsx generator/textGaps.ts` prints the gaps
(`--sort` rewrites the files sorted); the `translate-text` skill closes them, and every model
skill ends with it.
