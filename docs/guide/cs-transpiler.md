# The C# transpiler pilot

**Covers** - `pnpm cs:pilot`: the pilot that transpiles the TypeScript a design's build reaches into C#,
the C# runtime it targets, the hand-written `MeshBuilder` seam, how its output is proved equal to the JS
model, its timing against Node and Jint, and the whole-catalog survey.
**Code** - `tools/cs-transpile/` (`main.ts`, `transpile.ts`, `inputs.ts`, `compare.ts`, `common.ts`,
`runtime/*.cs`, `tool/Program.cs`, `tool/RailIsland.Models.csproj`)
**See also** - [../specs/2026-11-21-csharp-transpiler-pilot.md](../specs/2026-11-21-csharp-transpiler-pilot.md),
[../impl/2026-11-21-csharp-transpiler-pilot.md](../impl/2026-11-21-csharp-transpiler-pilot.md),
[../models/js-format.md](../models/js-format.md), [setup-and-build.md](setup-and-build.md)

## What it is

A spike, not a product: it answers whether the factory's models could ship as C# (for a Godot
consumer) by transpiling the TypeScript itself rather than running the JS model in an embedded engine.
It touches nothing the game imports: no file in `generator/`, no export the webapp reads, no test in
`pnpm test`. It writes only to the gitignored `export/cs/`. It needs the .NET 8 SDK (`dotnet`).

```bash
pnpm cs:pilot                # the windsock and the pyramid tower: transpile, build, compare, time
pnpm cs:pilot --truck        # the same with the American truck (parts, steered wheels, a rig, the LOD kit)
pnpm cs:pilot --no-run       # transpile and write the C# project only
pnpm cs:pilot --survey       # every design, transpiled only: what the supported subset does not cover yet
pnpm cs:pilot --ids=a,b      # the full run (transpile, build, compare, time) for any designs
pnpm cs:pilot --fixtures     # each supported construct (fixtures/constructs.ts) in Node and in C#, compared
```

## What it writes

| Path | What |
|---|---|
| `export/cs/Generated/Modules.g.cs` | a static class per generator module (`Mod_skyscrapers`): its reached functions and module constants |
| `export/cs/Generated/Classes.g.cs` | the reached TS classes (`MeshCore`, `TowerMesh`) |
| `export/cs/Generated/Types.g.cs` | a class per object type: interfaces and type aliases by name, anonymous shapes and merged unions by their fields |
| `export/cs/Generated/Convert.g.cs` | `ShapeConvert`: a method per conversion between two shape classes the code needs |
| `export/cs/Generated/Designs.g.cs` | the API: a class per design (`BuildingSkyPyramid`), an enum per parameter, `Build(...)` and `BuildWith(values, lod)` returning a `ModelNode` |
| `export/cs/Runtime/*.cs` | the runtime, copied from `tools/cs-transpile/runtime/` |
| `export/cs/Program.cs`, `RailIsland.Models.csproj` | the dump and bench console |
| `export/cs/transpile.json` | the designs, their esbuild bundle modules, the modules the transpiler reached, the syntax-kind inventory and the counts |
| `export/cs/report.json` | every comparison and the timing |
| `export/cs/survey.json` | the survey: unsupported constructs by kind and file, each with its location, and `clean`: the designs nothing unsupported is reached from |
| `export/cs-fixtures/` | the fixtures' C# project: the transpiled `fixtures/constructs.ts`, the runtime and a console printing each case's JSON |
| `export/cs/bundles/<id>.js`, `export/cs/run/` | the JS bundles compared against, the jobs and the C# dumps |

## How it transpiles

- **Reachability** is per declaration, starting from each design's `build` and `buildLod` and from
  `MeshCore`: an identifier's declaration in `generator/` pulls in its top-level statement (a whole class
  for a member). A module's other code is never looked at. `inputs.ts` lists the modules esbuild keeps for
  the same entry, for comparison: the truck's bundle keeps 43 modules, the transpiler needs 11.
- **The seam.** Symbols of `meshBuilder.ts` and `threeBuilder.ts` are not transpiled. The designs'
  `MeshBuilder` is `runtime/MeshBuilder.cs`: the transpiled `MeshCore` plus `ToModelNode`, which does what
  `toGroup` does with three.js - a mesh per material in name order, a node per part at its pivot, the
  clips and the userData - into the engine-neutral `ModelNode`. Named surfaces and interiors throw.
- **Types** come from the TypeScript checker. `number` is `double`; string literal unions are `string`;
  `T | undefined` of a number is `double?`; arrays and tuples are `JsArray<T>` (a heterogeneous tuple
  `JsArray<object>`); `Map`/`Set` are `JsMap`/`JsSet`; `Record<string, T>` (and a `Record` over a finite
  key union) is `JsRecord<T>`, whose number values are `double?` so a missing key reads as undefined;
  function types are `Func`/`Action`; a generic `T` that TypeScript instantiates as `void` is `JsVoid`.
- **Object types** become classes implementing `IJsObject`: an interface or type alias by its name, an
  anonymous shape interned by its field list, an intersection as one class. A union of anonymous shapes
  (`LodMass`, `ClipDrive`) is merged into one class with every field; a union of separately named types
  (`LodPart | LodRect`) stays `object`, because its values are existing objects whose identity matters.
  An anonymous shape with exactly a named class's fields is that class (`{ ...spec }` of a `MaterialSpec`).
- **Every expression** is emitted with its C# type and then converted to the C# mapping of its narrowed
  TS type (`coerce`): `double?` to `double` after a narrowing, a tuple element out of `JsArray<object>`, a
  delegate through an adapter lambda, one shape class into another (a generated `ShapeConvert` method, a
  copy of the present fields). An object literal takes its contextual type's class, so most copies never
  happen; an assignment's value and a literal's own fresh type are never converted (that would store one
  object and hand on a copy), and a merged union narrowed to one of its members is read in place.
- **Presence.** A shape class's fields are properties whose setters mark them present. A field whose TS
  type admits `null` keeps "set to null" apart from "left out" (`{ end: null }` against `{}`), so a
  destructuring default, `in`, `=== undefined`, a spread and JSON follow JS; for other fields null is absence.
- **Classes**: a TS constructor may run code before `super()`, which a C# constructor cannot, so each class
  gets `__ctor_<Name>` (the TS body, with `super(...)` calling the base's `__ctor`) and `__fields_<Name>` (the
  field initializers); the C# constructor only forwards to it, passing `JsCtor.Skip` to its base.
- **Locals** are renamed to be unique within their C# member (C# forbids a local hiding another); a `const`
  arrow function becomes a local function (default parameters, recursion). A default parameter that is no
  compile-time constant becomes a `null` default worked out in the body. `const a = x!` over a nullable
  number keeps the local nullable: TypeScript's `!` drops `null` too, and `lodKit.ts`'s `cells` tests
  such a value for null.
- **A tuple spread into arguments** (`m.box(mat, ...side(s, a, b), y0, y1)`) keeps the tuple in an
  `out var` for the following positions (`JsRt.First`).
- **`switch`** is labels and `goto`, as a JS switch is: the cases are compared in order (`===`, a
  default last), control jumps to the first match and runs on until a `break`, which is `goto` the end - so
  fall-through, a default between cases and a `continue` of an enclosing loop behave as in JS (a C# switch
  forbids fall-through). A `break` inside a loop within a case stays the loop's.
- **`for (const [i, x] of a.entries())`** is an index loop over `a` that reads its length each step (an
  array iterator is live); elsewhere `entries()` gives pairs, numbers for a number array, else boxed.
- **Rest parameters** are C# `params E[]`, wrapped as the `JsArray` the body uses; a call with spreads
  among the rest arguments passes them gathered into one array.
- **`Math.hypot`/`min`/`max` and `push` with spreads** gather every argument in order into one array
  first - JS evaluates them all before pushing, so `b.push(...b, ...b)` reads `b` twice before it grows.
- **A literal that spreads a record** (`{ ...KIT_PALETTE, dfBlue: ... }`) is a record, though TypeScript
  types it by its named keys; the variable holding it is typed so too.
- **A type made of one class's members** (`Pen = Pick<MeshBuilder, "quad" | "tri">`) is that class.
- **A key that is no identifier** (`"bridge-timber"`) is a field with a sanitized name and a hash of the key.
- **A read past an array's end** gives null for an array of objects, as JS gives undefined; for an array
  of numbers, which cannot hold it, it throws - except `a[i] ?? b`, which reads it as JS does.
- **Unsupported constructs** are errors naming file, line and kind; all are reported before it fails.

## Speed

The generated C# is faster than the same design's JS bundle in Node: 1.3-1.7x in steady state across
the pilot designs (`report.json`'s `timing`; on this container, medians of three runs per side, the
American truck 1.92 ms against 2.51 ms). What makes it so, in the order it mattered:

- **`JsArray<T>`** keeps up to four elements inside the object (a .NET 8 inline array), so a point - a
  `Vec3` of three, a ring corner of two - is one allocation, not an object and a buffer; a longer array
  moves to a `T[]` that doubles (16 first). Array literals are one `JsArray.Of(...)` call at their exact
  size; `map`, `filter` and `slice` write straight into the result; the enumerator is a struct.
- **Scalar replacement**: a `const` array literal read only as `x[<constant>]` (a triangle's edge
  vectors `u`, `v` and normal `n`) becomes one local per element, with no array at all.
- **Non-virtual members**: only a member some reached subclass declares is `virtual`, so the JIT can
  inline `tri`, `quad` and `cap`. `for (const p of [a, b, c])` walks a plain C# array.
- **No reflection in conversions** (`ShapeConvert`), `{ ...src }` of the same class is a memberwise
  `copy()`, a merged union is read in place when narrowed, a record of strings gives string pairs.
- `ToModelNode` fills exact-size `float[]` buffers; `Math.hypot` with two or three arguments allocates
  nothing; `JsRecord.keys()` sorts integer-like keys only when it has one.

Timing method, both sides alike: 300 ms of warm-up (the JIT's tiers settle), then the median of five
rounds of at least 200 ms. Times on a shared container move by 10-20 % between runs, so compare several.
`bench` also reports the bytes a build allocates (`allocKb`). The GC's defaults are kept: a larger young
generation or non-concurrent collection changed nothing beyond the noise.

## The runtime

`runtime/JsRt.cs` holds what .NET does differently from JS: `Math.round` (a tie towards +infinity),
`Math.hypot` as V8 computes it (scaled by the largest, Kahan-summed), number to string by JS's rules
(shortest round-trip digits, exponent past 1e21 or below 1e-6), `toString(16)`, `toFixed`, truthiness,
strict equality, a stable merge sort (`List.Sort` is not stable), regular expressions in ECMAScript mode
and the structural conversion. `JsArray<T>` iterates live by index, as a JS `for...of` does;
`JsRecord<T>` returns integer-like keys first, as JS objects do.

## Fixtures

`fixtures/constructs.ts` holds one function per supported construct and its edge cases (live iteration,
fall-through, a default between cases, `continue` from a switch, a spread of an array into itself, rest
arguments with spreads). `pnpm cs:pilot --fixtures` transpiles it into its own small project
(`export/cs-fixtures/`), runs every function in Node and in C# and compares the JSON each returns. Add a case
whenever the transpiler learns a construct; it checks the construct without a design that needs it.

## How it is proved

`compare.ts` builds every combination `coverageCombinations` gives (the factory tests' sample), at full
and low detail, twice: through the design's JS bundle (`bundleDesign`) with the real three.js, and through
the transpiled C#. The dumps are compared exactly: the node tree, each material, every position, normal and
colour as Float32 (both write Float32), the clips and the userData (key order aside). `report.json` lists
each comparison and the first difference of any that differ. Then the default combination of each design
is timed in Node, in C# and as the JS bundle inside Jint 4.1 (with a three.js stub), as "Speed" describes.
