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
| C# generated | 2,280 lines | 4,478 lines |
| Shape classes (anonymous, merged unions) | 47 (24, 3) | 75 (42, 4) |
| Conversions between shape classes emitted | 20 | 45 |
| Builds compared | 20 | 22 |
| Identical (every Float32, material, clip, userData) | 20 | 22 |

No tolerance was needed: every number is bit-identical, `Math.sin`/`cos` included (.NET on glibc and
V8 agreed on every value these designs compute). The syntax-kind inventory (112 kinds) is in
`export/cs/transpile.json`.

Milliseconds per build, default parameters (one run of `pnpm cs:pilot --truck`, this container):

| Design | Triangles | Node | C# | Jint |
|---|---|---|---|---|
| windsock | 80 | 0.08 | 0.35 | 12.3 |
| windsock, LOD | 40 | 0.04 | 0.10 | 2.7 |
| pyramid | 2,480 | 1.62 | 3.94 | 103.8 |
| pyramid, LOD | 220 | 0.13 | 0.37 | 8.2 |
| truck | 4,936 | 4.13 | 7.02 | 211.2 |
| truck, LOD (fitted to 200) | 200 | 0.60 | 1.04 | 25.8 |

The transpiled C# is 1.7-4x slower than Node: every point is a list-backed `JsArray<double>`, `JsRt.Hypot`
allocates its arguments, every scope is a closure. Jint runs the unchanged JS bundle 25-50x slower than the
C# and about 50x slower than Node.

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

## How to test

**Automated coverage.** None in `pnpm test`, by the spec (the pilot adds no factory test). The pilot is
its own check: `pnpm cs:pilot` exits non-zero when any build differs from the JS model. No E2E test: there
is no user surface.

**Setup.** `pnpm install`; the .NET 8 SDK (`dotnet --version` 8.x; on Ubuntu 24.04
`apt-get install dotnet-sdk-8.0`); network to nuget.org for the first build (Jint).

**Steps.**
1. Run `pnpm cs:pilot`. Expect "transpiled 29 declarations from 6 modules", "compared 20 builds: 20
   identical, 0 different" and a timing table of four rows.
2. Run `pnpm cs:pilot --truck`. Expect "compared 22 builds: 22 identical" and six timing rows.
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
- A conversion between shape classes is a copy (45 in the truck run); any later identity test or mutation through one of them would diverge. None does in these designs, but nothing checks it.
- A JS value explicitly set to `undefined` on a field whose type admits `null` reads as present (null), not absent.
- A parameter default applies on `null` as well as `undefined`; JS applies it on `undefined` only.
- A closure that outlives its `for` loop iteration would see the shared C# loop variable, not JS's per-iteration binding; none in the pilot designs.
- userData's JSON key order is the class's field order, not the literal's (the comparison ignores order).
- `JsRt.As` and `JsJson` use reflection for generic arrays and records: not trimming- or NativeAOT-safe as written (Godot's iOS export).
- The C# is slower than Node; the runtime was written for correctness, not speed.

## Recommended follow-ups

1. Decide C# transpilation against the embedded Jint on these numbers: exact output either way; C# ~25-50x faster than Jint today; transpilation costs weeks plus upkeep.
2. If C#: support the survey's six largest kinds, then add a factory test that runs the transpiler over every design so new code stays inside the subset.
3. If C#: make points cheap (a struct or array-backed vector for fixed-length numeric tuples) and drop the per-call allocations in `JsRt.Hypot`; that is where the 1.7-4x goes.
4. Make the runtime reflection-free (generated converters instead of `JsRt.As`'s array path, generated JSON writers) before targeting NativeAOT.
5. Write the Godot adapter: `ModelNode` to `Node3D`/`ArrayMesh`, swapping each triangle's winding, `AnimationPlayer` for the clips.

## Changelog

No user-visible changes.
