# C# transpiler pilot

Spec: docs/specs/2026-11-21-csharp-transpiler-pilot.md
Date: 2026-11-21
Status: implemented
Area: tools/cs-transpile (new), package.json (`cs:pilot`), docs/guide/cs-transpiler.md, docs/guide/setup-and-build.md, docs/README.md

## What was done

`pnpm cs:pilot` transpiles the TypeScript a design's build reaches into C#, builds it with .NET 8,
compares every output with the JS model exactly and times both, as the spec planned. The reference is
[../guide/cs-transpiler.md](../guide/cs-transpiler.md).

- **Transpiler** (`tools/cs-transpile/transpile.ts`, about 2,100 lines): TypeScript compiler API and
  checker, reachability per declaration, the type mapping, shape classes, `coerce`, classes with
  `__ctor_<Name>`, and an error per unsupported construct with file and line.
- **Runtime** (`runtime/*.cs`, about 1,000 lines with the seam): `JsArray`, `JsRecord`, `JsMap`, `JsSet`,
  `JsRt` (`Math.round`, V8's `Math.hypot`, JS number formatting, stable sort, truthiness, equality,
  structural conversion), `ModelNode`. The one hand-written seam is `MeshBuilder.cs` (`ToModelNode`).
- **Generated API**: a class per design and an enum per parameter, e.g.
  `BuildingSkyPyramid.Build(SizeParam.Landmark, GlazingParam.Jade, lod: true)`.
- **Proof and timing** (`compare.ts`, `tool/Program.cs`): the JS bundle with the real three.js against
  the C#, every `coverageCombinations` value at both levels; timing in Node, C# and Jint 4.1.
- **Survey** (`--survey`): every one of the 1,074 designs transpiled at once, unsupported constructs
  counted by kind (`export/cs/survey.json`).

Results:

| | Windsock + pyramid | + American truck (stretch) |
|---|---|---|
| Declarations / modules reached | 29 / 6 | 96 / 11 (esbuild's bundle keeps 43) |
| C# generated | 2,290 lines | 4,484 lines |
| Shape classes (anonymous, merged unions) | 46 (23, 3) | 71 (38, 4) |
| Conversions between shape classes emitted | 4 | 24 |
| Builds compared | 20 | 22 |
| Identical (every Float32, material, clip, userData) | 20 | 22 |

No tolerance was needed: every number is bit-identical, `Math.sin`/`cos` included (.NET on glibc and
V8 agreed on every value these designs compute). The syntax-kind inventory (112 kinds) is in
`export/cs/transpile.json`.

Milliseconds per build, default parameters, steady state (after follow-up 1; Node and C# are medians
of three runs per side, each the median of five 200 ms rounds after 300 ms of warm-up; Jint one run):

| Design | Triangles | Node | C# | C# faster by | Jint |
|---|---|---|---|---|---|
| windsock | 80 | 0.051 | 0.035 | 1.45x | 5.5 |
| windsock, LOD | 40 | 0.030 | 0.018 | 1.71x | 1.6 |
| pyramid | 2,480 | 1.44 | 0.97 | 1.48x | 98 |
| pyramid, LOD | 220 | 0.098 | 0.073 | 1.33x | 11 |
| truck | 4,936 | 2.51 | 1.92 | 1.31x | 259 |
| truck, LOD (fitted to 200) | 200 | 0.46 | 0.27 | 1.71x | 22 |

In every row C#'s slowest run beat Node's fastest. Jint runs the unchanged JS bundle about 100x slower
than the C#. As first built, the C# was 1.7-4x slower than Node; follow-up 1 says what changed.

Semantic differences the comparison caught, each now handled in the transpiler:

1. **A copy instead of the object.** `this.groups.set(mat, (g = {...}))` converted the literal's own
   type into the map's class: the map held a copy, the first triangle of every material went into `g`.
   An assignment's value and a fresh literal type are no longer converted.
2. **null is not undefined.** `lodBlock(..., { end: null })` means "no end faces"; `{ end = side } = mats`
   defaults only when `end` is absent. Shape classes now track which fields were set.
3. **A merged union loses identity.** `new Set([o.part, o.win])` (`LodPart | LodRect`) became a merged
   class: the set held copies and `fitLod` never dropped a part. A union of named types is now `object`.
4. **`!` over a real null.** `const [a, b] = [bounds[i - 1]!, bounds[i]!]` then `a === null` (lodKit's
   `cells`): TypeScript types `a` as `number`. Such a local now stays `double?`, and a null test of a
   non-nullable C# value is an error, never a silent `false`.

**Survey of the whole catalog** (1,074 designs, 119 source modules, 44 s): 518 unsupported sites of 48
kinds in 179 files. The six largest kinds - `entries()` on arrays (103), `switch` fall-through (87),
rest parameters (39), `Math.hypot(...spread)` (36), array spreads of non-arrays (31), `push(...spread)`
(16) - are 60 %. Most are mechanical; a few need decisions (`WeakMap`, methods in object literals,
`for...of` over a string, `JSON.stringify`).

**Estimate for the whole catalog.** The pilot designs needed about 5 transpiler or runtime fixes after
they first transpiled; the truck, which reaches the LOD kit, needed 10 - and three of those were semantic
differences only the exact comparison found. Covering the 48 remaining kinds is about a week; making all
1,074 designs compile and compare identical, with heavy families (cab noses, lettering, slice bodies, the
hull kit, trees) each finding their own traps, is a further two to four weeks. Then it is maintenance:
every new idiom in the factory either fits the subset or extends the transpiler, which needs a guarding
test in the factory. These are judgements from the pilot's pace, not measurements.

Checks: `pnpm typecheck` and `pnpm build`'s `tsc` do not see `tools/` (the root tsconfig includes
`src`, `generator`, `test`); `pnpm exec tsc -p tools/cs-transpile` type-checks the tool, clean.
`pnpm test` passes (no factory file changed). `pnpm cs:pilot --truck` exits 0 with 22 of 22 identical.

## Follow-up changes

1. **"Make the C# runtime faster than Node."** Profiled (`dotnet-trace`, with tiering off for stable
   addresses) and measured allocations per build (`bench`'s `allocKb`: 7.6 MB for the truck at first).
   `JsArray` became a `T[]` with up to four elements inline (.NET 8 `InlineArray`), array literals are
   built at their exact size, iteration and `Hypot` allocate nothing, and `ToModelNode` fills exact-size
   buffers. The transpiler scalar-replaces `const` array literals read only by constant index, makes only
   overridden members virtual, iterates array literals as C# arrays, unifies an anonymous shape with a named
   class of the same fields, copies `{ ...src }` of the same class memberwise, reads a narrowed merged union
   in place and emits typed `ShapeConvert` methods instead of reflection. Both benchmarks now warm up for
   300 ms and report the median of five rounds. Still 22 of 22 identical; C# is 1.3-1.7x faster than Node.

## How to test

**Automated coverage.** None in `pnpm test`, by the spec (the pilot adds no factory test). The pilot is
its own check: `pnpm cs:pilot` exits non-zero when any build differs from the JS model. No E2E test: there
is no user surface.

**Setup.** `pnpm install`; the .NET 8 SDK (`dotnet --version` 8.x; on Ubuntu 24.04
`apt-get install dotnet-sdk-8.0`); network to nuget.org for the first build (Jint).

**Steps.**
1. Run `pnpm cs:pilot`. Expect "transpiled 29 declarations from 6 modules", "compared 20 builds: 20
   identical, 0 different" and a timing table of four rows.
2. Run `pnpm cs:pilot --truck`. Expect "compared 22 builds: 22 identical" and six timing rows with the
   C# column below the Node column (single runs are noisy; rerun if one row is close).
3. Open `export/cs/Generated/Designs.g.cs`: a class per design, an enum per parameter, `Build(...)`.
4. Open `export/cs/report.json`: `identical` equals `compared`; each result has `match: true`.
5. Run `pnpm cs:pilot --survey`. Expect 1,074 designs and about 518 unsupported sites by kind;
   `export/cs/survey.json` lists each with file and line.

**Also worth trying.**
- Break the runtime on purpose - make `JsRt.Round` round half to even - and rerun: the pyramid's
  comparison reports the first differing number and its path; restore it.
- `pnpm cs:pilot --no-run`, then `cd export/cs && dotnet run -c Release -- bench run/bench-jobs.json`
  after one full run, to time C# alone.

## What is missing

Nothing - the spec is implemented in full, the stretch truck included. Its `pose`/`renderJoint` stay out,
as the spec said.

## Known problems

- The spec named the pyramid `sky-pyramid`; its id is `proc-building-sky-pyramid`.
- Tuples are `JsArray<double>` (heterogeneous: `JsArray<object>`), not the spec's `double[]`/`ValueTuple`: one array type keeps every array method and spread working.
- A record or map of numbers holds `double?` (a missing key reads as undefined), beyond the spec's rules.
- A union of separately named object types is `object`, not a merged class as the spec proposed: merging copied the objects (difference 3).
- A conversion between shape classes is a copy (24 in the truck run); any later identity test or mutation through one of them would diverge. None does in these designs, but nothing checks it.
- A JS value explicitly set to `undefined` on a field whose type admits `null` reads as present (null), not absent.
- A parameter default applies on `null` as well as `undefined`; JS applies it on `undefined` only.
- A closure that outlives its `for` loop iteration would see the shared C# loop variable, not JS's per-iteration binding; none in the pilot designs.
- userData's JSON key order is the class's field order, not the literal's (the comparison ignores order).
- `JsRt.As` (its generic-array path, `Activator`) and `JsJson` still use reflection: not trimming- or NativeAOT-safe as written (Godot's iOS export); shape conversions no longer do.
- Timings on this shared container move 10-20 % between runs; the margins hold over three runs per side, but a single run can show less.

## Recommended follow-ups

1. Decide C# transpilation against the embedded Jint on these numbers: exact output either way; C# ~100x faster than Jint and faster than Node; transpilation costs weeks plus upkeep.
2. If C#: support the survey's six largest kinds, then add a factory test that runs the transpiler over every design so new code stays inside the subset.
3. If C# needs more speed: scalar-replace points passed between functions too (a struct for fixed-length numeric tuples, a signature change the transpiler would derive), and pre-size each material's buffers from the previous build.
4. Make the runtime reflection-free (generated converters instead of `JsRt.As`'s array path, generated JSON writers) before targeting NativeAOT.
5. Write the Godot adapter: `ModelNode` to `Node3D`/`ArrayMesh`, swapping each triangle's winding, `AnimationPlayer` for the clips.

## Changelog

No user-visible changes.
