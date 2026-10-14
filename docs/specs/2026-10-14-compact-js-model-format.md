# Compact JS model format

Status: agreed
Date: 2026-10-14
Area: generator (build/export, a new bundling step), export folder, catalog.json, catalog site (size display)

## Context of the change

Every model is a TypeScript function over `MeshBuilder` primitives
(`generator/meshBuilder.ts`: `tri`, `quad`, `cap`, `loft`, `prism`, `spire`,
`sweep`, `part`). The builder collects a flat-shaded triangle soup per material
and `toGlb` writes it as a GLB with positions and normals (9 + 9 floats per
triangle, no index buffer). Measured sizes of the current export:

| Model | GLB | gzip -9 of GLB |
|---|---|---|
| veh-american-truck (4936 tris) | 365 KB | 31 KB |
| sky-brick-residential | 219 KB | 17 KB |
| sky-twin-towers | 215 KB | 21 KB |
| sky-bullet | 155 KB | 28 KB |
| sky-pyramid | 37 KB | 4 KB |

The soup is far more redundant than the file size suggests: a model is a few
hundred primitive calls. `MeshBuilder` already records every outermost
primitive call as a leaf of the source tree (`generator/sourceTree.ts`,
`export/tree/<id>.json`), but that record is lossy for this purpose: a
`loft`/`prism`/`cap`/`spire` leaf keeps only the ring length, not the ring
points, and values are rounded to the millimetre.

Repository constraints that bind this change: output is deterministic (no
timestamps, no unordered iteration); a design's GLB bytes must not change unless
the design changed; `src/` may import only types from `generator/`; `export/`
is generated and gitignored; model ids are never renamed.

No database or persistent user storage is involved. The new artifact is a
generated, gitignored file per model under `export/`.

## User request

Brainstorm: try to create a format of 3D objects. This format produces a single
JS file, ideally without dependencies, which contains code creating the 3D
model. The purpose is to provide a more compact format than GLB files.

## Decisions

### What should the single JS file contain to rebuild the model?
| Option | What it means |
|---|---|
| Replay of primitive calls (Recommended) | The file holds the recorded box/prism/loft/spire/sweep calls as compact numeric data plus a small embedded runtime that re-implements those primitives. Smallest; keeps the model procedural. The runtime must produce the same triangles as the generator (parity test); each new primitive must exist in both places. |
| Quantised mesh data | Final triangles: deduplicated, quantised vertices, index buffer, per-material ranges, plus a tiny decoder. Works for any primitive, but only 3-6x smaller than GLB, about equal to gzipped GLB. |
| Hybrid | Primitive replay, with a quantised-mesh fallback for parts not expressible as primitives. Most flexible, most code. |

**Answer: Replay of primitive calls (Recommended)** - superseded by the round 2 answer "Bundle each design's real code" below.

### What does the generated JS produce, and what may it depend on?
| Option | What it means |
|---|---|
| Plain typed arrays, zero dependencies (Recommended) | Module returns per-material arrays; any engine wraps them. |
| Arrays plus optional three.js helper | Core arrays plus a helper receiving THREE as an argument. |
| Builds a three.js Group directly | The module builds a `THREE.Group` itself. |

**Answer: Builds a three.js Group directly. Without imports, the three.js module should be passed as a parameter.** The
file has no `import` statements; the caller hands the `THREE` namespace to the
exported function, which returns a `THREE.Group` (meshes, materials, parts as
child nodes).

### How does the JS format relate to the existing GLB export?
| Option | What it means |
|---|---|
| Additional output next to GLB (Recommended) | build:models also writes export/js/<id>.js; GLBs, thumbnails, meta files unchanged. |
| Replaces GLB for the site only | Site preview loads JS; GLBs stay for the game. |
| Replaces GLB everywhere | JS is the only output; breaks the game import contract and GLB tooling. |

**Answer: Additional output next to GLB (Recommended)**

### How exact must the replayed model be compared with the GLB?
Offered: within 1 mm with recomputed normals; bit-exact floats; looser 1 cm.

**Answer: "Could you just format algorithms into JS. So that should produce the same output, in smaller size"** - the user wants the
algorithms shipped, not an approximation of the result; same output, smaller file.

### How much should this change deliver?
| Option | What it means |
|---|---|
| Format + generator output + parity test + size report (Recommended) | Format, export/js for all 11 models, a parity test, a size comparison. |
| Prototype for the truck only | Quick experiment, no general build integration. |
| Full: plus site previews from JS | Site viewer loads the JS format. |

**Answer: Format + generator output + parity test + size report (Recommended)** - extended by the reporting answer below: the sizes are shown in the site UI, but the site viewer still loads GLBs.

### Your fidelity answer sounds like: ship the design algorithms themselves as JS. Is that right, and how should the code be produced?
| Option | What it means |
|---|---|
| Bundle each design's real code, minified (Recommended) | A build step bundles each design plus only the MeshBuilder parts it needs, swaps the GLB writer for a three.js Group builder, minifies. Same floats and triangles as the GLB. |
| Keep recorded-call replay | Data plus embedded runtime; needs a lossless call record. |
| Both, compare sizes | Two encodings, report both. |

**Answer: Bundle each design's real code, minified (Recommended)** - this replaces the round 1 replay answer. Measured before tree-shaking per model: the whole vehicles module minified is 15 KB (6 KB gzip), all ten skyscrapers 16 KB (6 KB gzip), against 365 KB for the truck GLB and 1.5 MB for all GLBs.

### Where does the file live and what is its shape?
| Option | What it means |
|---|---|
| export/js/<id>.js, ES module, default export build(THREE) (Recommended) | No imports; `build(THREE)` returns a THREE.Group, one Mesh per material (MeshStandardMaterial), vehicle parts as named child Groups at their pivots, base at y = 0, metres. |
| Classic script setting a global | Script-tag loadable, global state. |

**Answer: export/js/<id>.js, ES module, default export build(THREE) (Recommended)**

### Should the size comparison appear anywhere beyond the build log?
| Option | What it means |
|---|---|
| Build log + catalog.json fields, no site UI (Recommended) | Table in the log; catalog.json gains jsUrl and jsBytes. |
| Build log and docs only | catalog.json unchanged. |

**Answer: "Should be visible in site UI"** - the build log table, the catalog.json fields and the docs numbers all stay, and the catalog site shows the JS size (and gzip) next to the GLB size.

## High-level plan

1. **Bundled output.** For each design, a build step produces a self-contained ES module: the design's code and the used
   MeshBuilder primitives, with the GLB writer replaced by a writer that builds a three.js Group from the injected
   `THREE`. Minified, deterministic, written only when its text changed, removed when the design is dropped. Runs as part
   of `pnpm build:models`, after the existing guards.
2. **Parity.** A test loads each generated module with a stub or real three.js and compares the Group's triangle soup
   (positions, normals, materials, part nodes) with the model's GLB; a mismatch fails. This is the guarantee that the
   shipped algorithms equal the generator.
3. **Reporting.** The build logs GLB, gzip GLB, JS, gzip JS per model; `catalog.json` records gain the JS url and sizes;
   the site cards and model page show them. Docs (`models/export.md`, `site/catalog-site.md`) gain the format and the
   measured numbers.

Depends on: 1 before 2 and 3.

## Database and persistent storage

Nothing is stored for users or the game. New generated, gitignored artifacts: `export/js/<id>.js` per model (UTF-8 ES
module, one per design, lifetime of the build, deleted with its design) and new fields in `export/catalog.json`
(`jsUrl`, `jsBytes`, `jsGzipBytes`; written by the build, read by the site, regenerated every run, `version` of the file
decided at implementation). No migration.

## Architecture decisions

- **Ship the algorithm, not the result.** Chosen over recorded-call replay and quantised meshes: output is identical by
  construction, no second implementation of the primitives to keep in sync, and the measured code size is already far
  below GLB size. Cost: the module is code, so it runs whatever the design does at load time (cheap here) and
  designs must stay free of Node-only imports.
- **Injected `THREE`.** No `import`, so the file works with any three.js copy and any bundler, and adds no dependency.
  Cost: the consumer must pass a THREE version with the used classes (Group, Mesh, BufferGeometry, MeshStandardMaterial).
- **Additional to GLB.** The game import contract, thumbnails and z-fighting guard are untouched; the format is judged
  on measured numbers before any further commitment.
- **Per-model bundles, not a shared runtime.** Matches "single JS file"; the duplicated primitive code per file is the
  price, small after minification and tree-shaking.

## Weaknesses and risks

- The existing modules mix the builder with the GLB writer and source-tree recording; separating them so tree-shaking
  removes the writer and the recorder is likely, and the primitives' recording code must not leak into the output.
  Likelihood medium, mitigation: the parity test plus a size assertion in the report.
- Gzip makes the gap smaller than the raw numbers suggest (truck GLB 31 KB gzipped vs perhaps 5 KB of JS); the site
  shows both so the claim stays honest.
- Normals, vertex winding and colour space (sRGB hex vs linear baseColorFactor) must match what the GLB path produces;
  covered only by the parity test.
- A bundler step enters the generator; esbuild is already present through Vite but is not a direct dependency
  (open question: add it explicitly).
- Executing a downloaded JS file is a trust decision for any consumer; the files come only from this repository's build.

## Out of scope

- Loading models from JS in the site's 3D viewer, or in the game.
- Replacing or deprecating GLBs; any change to `skyscrapers.meta.json` / `vehicles.meta.json`.
- Mesh compression formats (Draco, meshopt), textures, animation.
- Publishing to the game (a separate, standalone step).

## Database and persistent storage

Nothing new is stored by users or the game. The only new artifact is a
generated file per model in the gitignored `export/` folder (exact path decided
in a later round).

## Architecture decisions

To be written after the remaining rounds.

## Weaknesses and risks

- Parity: the embedded runtime re-implements the primitives, so it can drift
  from `MeshBuilder`; needs a test comparing replayed triangles to the GLB soup.
- The current source-tree record is lossy (ring points, millimetre rounding);
  a replay record must be lossless enough, which touches the recording code.

## Out of scope

To be written after the remaining rounds.
