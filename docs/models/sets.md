# Sets

**Covers** - the set registry: every content set the factory owns besides the models (the
game's structure types, rail and road types, block types, catenary styles), its frozen ids,
picker order, default and retired aliases, which sets are collectible, what "landed" means,
the per-set meta files and modules the export writes, and the tests that pin them.
**Code** - `generator/sets/registry.ts`, `generator/sets/setsExport.ts`, `generator/sets/<set>.ts`,
`test/sets.test.ts`
**See also** - [text.md](text.md), [export.md](export.md), [woods.md](woods.md), the game's
`docs/tooling/factory-import.md` and `docs/architecture/sets.md`, the spec
`../specs/2026-10-23-factory-structures-and-textures.md`

## The registry

`SETS` lists one `SetDef` per set:

| Field | Meaning |
|---|---|
| `set` | the set's name (`bridge`, `station`, `roadType`, ...) |
| `collectible` | the game's collection kind (`structure:<kind>:<type>` D1 keys) when its types are rewards |
| `phase` | the spec phase that moves the set's definitions into the factory |
| `landed` | whether the definitions live in the factory yet (see below) |
| `defaultId` | what an unknown stored id draws as, after the aliases |
| `retired` | old id -> shipped id it now draws as |
| `types` | `{ id, label, description? }` in picker order; the English is the source of the exported text |
| `groups` | named groups the picker shows together (road families) |

Ids are stored in the game's saved maps, D1 collection keys, tool prefs and simulations, so
they follow the model-id rule: **never rename a shipped id**. A removed type is retired with an
alias onto the type it should draw as; `resolveSetId` resolves a stored id through the list,
the aliases and the default, which is the game's one unknown-id policy (the stored id itself is
kept verbatim on save).

| Set | Collectible | Phase |
|---|---|---|
| `blockType` | no | 2 |
| `busStop`, `cableCarStation`, `port`, `airport` | yes | 3 |
| `decoration`, `tunnelPortal`, `railType`, `roadType` | no | 4 |
| `dam` | yes | 4 |
| `station`, `roadStation` | yes | 5 |
| `bridge` | yes | 6 |
| `catenaryStyle` | no | 7 |

## Landed sets

Until a set lands, the game's own code draws its types, so `test/sets.test.ts` holds its ids to
exactly the game's list: a new id would reach the picker with nothing to draw it. A landed set
has a source module `generator/sets/<set>.ts` - pure, deterministic, no `node:` imports - which
the export bundles standalone; the set may then grow, and still never loses a shipped id.

## The export

`generateSets` (a whole export only) writes `export/sets/`:

- `<set>.meta.json` for every set: `set`, `collectible`, `landed`, `defaultId`, `retired`,
  `types` (`{ id, ...TYPE_META[id] }`, no English), `groups` (`{ id, types }`) and, once
  landed, `module`. A landed module may export `TYPE_META`, per-type data the game reads
  without running it (a shed's size).
- `<set>.js` for a landed set: one minified ESM file with no imports, platform neutral, so the
  game imports it synchronously from core code, Vitest and the headless simulations (never the
  Worker, which reads the metas only).

The game's `pnpm import:factory` mirrors the folder into `db/procedural/sets/` and generates the
TypeScript id unions and lists it derives its pickers, collection and gating from.
