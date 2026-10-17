---
name: railroad-vehicle
description: Create or change procedural railway vehicles, including electric and diesel locomotives, railcars, coaches and wagons. Apply rail dimensions, triangle budgets, bogie and coupling conventions, pantograph operating poses and headless validation. Use for railway vehicle work in this repository; also use vlakosimdb-transfer when reconstructing a vehicle from that database.
---

# Railroad vehicle

**Covers** - railway vehicle geometry, operating poses and verification.
**Code** - `generator/vehicles.ts`, `generator/cd150.ts`, `generator/cd163.ts`, `generator/cd163Family.ts`, `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `generator/bmoCoach.ts`, `generator/cdGreenWhiteCoach.ts`, `generator/wagons.ts`, `generator/wagonParts.ts`, `generator/steamLocos.ts`, `generator/steamLoco.ts`, `generator/steamParts.ts`, `generator/steamGear.ts`, `test/models.test.ts`, `test/steam.test.ts`, `test/cd150.test.ts`, `test/csdCoaches.test.ts`
**See also** - [vehicle reference](../../../docs/models/vehicles.md), [road-vehicle](../road-vehicle/SKILL.md), [vlakosimdb-transfer](../vlakosimdb-transfer/SKILL.md)

This skill follows the repository's road-vehicle workflow, with railway-specific
geometry, dimensions and roof equipment. Keep skill text and repository
documentation in English.

## Budget and model contract

- Aim at about **15,000 triangles per rail vehicle**. A small overflow is fine
  when it keeps a detail that matters (the tests cap it at 16,000); do not
  thin out a fine, visible pattern such as shutter slats just to get under 15k. There is no file-size budget. Spend detail on the silhouette,
  cab, running gear and recognizable roof equipment; keep round parts as coarse
  as their size allows (small lamps, tanks, axle boxes and pipes 6-12 sides,
  wheels and portholes 16-24), build a coil spring as one lofted tube with a
  top cap only (`coil` in `cd163.ts`), and drop faces hidden inside other parts.
- Use deterministic, non-indexed triangle soups with flat normals stored per
  face. Every component belongs to a meaningful `m.scope(...)`.
- Use stable `veh-` identifiers, never rename shipped models, and register the
  design in `VEHICLES`. Rail catalog entries use `category: "Rail vehicles"`
  and the appropriate group; CD 163 uses `loco`, the CSD coaches `coach`
  (`COACH_CATALOG`), the freight wagons `wagon` (`WAGON_CATALOG`). A wagon's
  load variants are one design with a `cargo` parameter (docs/models/wagons.md).
- State the vehicle's **game properties** on the design: `game: { weight, power,
  maxspeed, accel }` (tonnes, kW, km/h, m/s2; `null` where none, a coach's power
  0), plus `variants` for liveries or units whose figures differ. The build fails
  without them (docs/models/game-properties.md). Take real figures from the
  vehicle's sources, as the existing designs do.
- Draw every bogie (two or three axles close together) inside `m.bogie(() => ...)`
  and every wheelset in a scope named `wheelset` (or record it with
  `m.axleAt(x, y)`): the bogie becomes its own turning node and the rig's
  `supports` - where the game puts the vehicle on the track - are worked out from
  them (docs/models/vehicle-rig.md). A bogie under an articulated joint names the
  two sections it carries: `m.bogie(fn, { sections: [i, i + 1] })`. Otherwise a
  rigid locomotive or wagon remains one body node. Do not apply the road
  truck/trailer split to a train. If articulation is required, place pivots at
  the actual bogie or coupling rotation centres and verify clearance through the
  intended motion.

## Coordinates and proportions

- Metres, +X forward, +Y up, +Z right. Centre the vehicle across Z and place the
  wheel contact on Y = 0, the top of rail. For a polygonal wheel with a flat
  segment down, use axle height `radius * cos(pi / segmentCount)`.
- Establish length over buffers/couplers, body width and height, track gauge,
  wheel diameter, bogie centres and axle spacing from dependable references.
  Preserve mechanical constraints when a coarse texture suggests otherwise.
- The current repository envelope is 3.1 m wide and 4.7 m high for fixed body
  and roof equipment; these are project checks, not universal railway limits.
  Evaluate an extended pantograph separately against the operating envelope.
- Build the body from measured profiles, not just a rectangular box. Keep cab
  corner chamfers and both upper and lower face slopes where the prototype has
  them. Fit windows, plates, lamps and handrails to the actual supporting plane.
- Distinguish the two sides and both ends: portholes, shutters, doors and markings
  need not be symmetric. Keep wheels, axle boxes and suspension connected.
- Store photos, native source references and provenance under `assets/<name>/`
  (see "Reference images from the internet" below). For vlakosimdb input,
  follow its transfer skill and report measured residuals.
- Follow the livery's paint boundaries, not just the body edges: a colour band
  can step or drop (the CD 150's green skirt is lowered between the bogies).

## Reference images from the internet

Do not model from memory or from one source alone. Before modelling (and when
correcting proportions or livery), download a few reference images and commit
them with the model:

1. Search for at least two or three images: a side view, a front or three-quarter
   view, and ideally a bogie or drawing with dimensions. Prefer Wikimedia
   Commons and other sources with a clear free license (CC0, CC BY, CC BY-SA,
   public domain); note the licence and author for every file.
2. Pick images that match the modelled era and livery (number, emblem, colours).
3. Store them under `assets/<name>/` with descriptive lowercase names
   (`photo-150-222-side.jpg`, `drawing-bogie.png`). Downscale large photos to
   about 1600 px on the long side so the repository stays small.
4. Record each file in `assets/<name>/SOURCES.md`: original title, URL, author,
   licence and what it was used for.
5. Set `references: "<name>"` on the design in `VEHICLES`; the build copies the
   folder's images to `export/refs/<id>/` and the catalog site shows them on the
   model page's **Images** tab.
6. Commit and push the images with the model change (they are source material,
   not generated output).

Files the user uploads to `assets/_tmp/` (an inspiration GLB, a photo) are inputs for one model: `git mv` them into `assets/<name>/` in the same change and list them in `SOURCES.md` too.

If the network or licences make a download impossible, say so to the user and
list the references you would have used.

## Running numbers of Czech locomotives

Czech (and Slovak) traction units carry the CSD scheme valid since 1 January
1988, still used by CD: **`ABC DEF-G`**, a space after the third digit and a
hyphen before the check digit, e.g. `163 244-7`, `150 222-8`.

- **A** - kind of vehicle: 0 unpowered trailer of a unit, 1 electric locomotive
  DC (3 kV), 2 electric locomotive AC (25 kV 50 Hz), 3 multi-system electric
  locomotive, 4 DC electric unit, 5 AC electric unit, 6 multi-system electric
  unit, 7 diesel locomotive, 8 diesel railcar, 9 control car.
- **BC** - with A, the class (`150`, `163`, `754`); a class split by later
  rebuilds is written with a subclass, e.g. 150.2 for the 150 2xx units.
- **DEF** - serial number within the class; standard gauge starts at 001
  (801+ is broad gauge, 901+ and 951+ narrow gauge).
- **G** - check digit over the six digits: from the right, multiply alternately
  by 2 and 1 (rightmost digit by 2), add the digits of the products, and take
  the difference to the next multiple of ten (0 when the sum already is one).
  `163 244`: 8 + 4 + 4 + 3 + (1 + 2) + 1 = 23, so `-7`.

Before 1988 CSD used the Kryspin designation, e.g. `E 499.2` for the class 150:
a traction letter (E electric, T diesel), then the number of powered axles, a
speed code ((digit + 3) x 10 km/h), an axle-load code (digit + 10 t), and after
the dot the series. Newer vehicles also carry the 12-digit UIC/TSI number
(vehicle type, country code 54 for the Czech Republic, the national number and
its own check digit over all eleven digits); the models show the national number.

**Every model shows one full, valid running number** on its plates (side and
front), never just the class: choose a unit that existed in the modelled era
and livery, note it in `SOURCES.md`, keep it in one constant (`CD150_NUMBER`,
`NUMBER` in `cd163.ts`), and test its check digit.

**Coaches and wagons** carry their number on the body side, under the railway's
lettering ("CSD" with the caron, painted, not on plates): a 12-digit UIC number
(`51 54 19-41 068-0`; the check digit uses the same weights over the first eleven
digits) or, for older vehicles, the national number (class, district digit,
serial: `Ddk 6-3777`, no check digit). Prefer a number legible on a photograph of
the type; when none exists, use an illustrative number in the right format and
say so in `SOURCES.md` (`RUNNING_NUMBERS` in `csdCoaches.ts`).

**Variants of one body** (classes, window layouts) are one parametric design with
enum parameters, not separate models: the export holds the default build and the
JS model builds the others (docs/models/parameters.md). Paint schemes of one
locomotive body are a `livery` parameter whose values are data (`Cd163Livery`:
colour bands, optional cab bands, emblems, number); a sister class whose body
differs only in its machine-room sides reuses `cd163Body` with its own layout
rather than copying the builder (docs/models/loco-liveries.md).

## Steam locomotives and moving parts

Steam locomotives are a `LocoSpec` drawn by `buildLoco` (`steamLoco.ts`,
docs/models/steam-locomotives.md). A locomotive with a tender is one design with
the `unit` parameter (`locomotive` default, `tender`). Their wheelsets, rods and
valve gear are parts animated by the `running` clip (`steamGear.ts`,
docs/models/animation.md): keep each moving piece in its own z plane, keep
spoke counts so a tyre has twice the spokes in facets, and check posed frames
(`poseGlb`) for flicker as `test/steam.test.ts` does. A rigid vehicle without
moving parts stays one body node plus its bogie nodes.

## Electric locomotives and pantographs

**An electric locomotive with two pantographs must have one raised and the other
folded in its default displayed operating pose.** A specific user request for a
parked, maintenance or other operating state overrides this default.

1. Identify the source pantograph type and hinge orientation from photographs.
   On CD 150 and CD 163 the lower arm hinges toward the middle of the roof and
   the knee points to the nearer cab end; test it in both poses. Choose which end
   is active from references or operating direction; state the choice. For CD
   163, the rear (-X) pantograph is raised and the front (+X) one is folded.
2. Unfold the linkage around its pivots. Preserve arm lengths and joint
   continuity; do not stretch the folded assembly vertically or move only its
   collector head. Keep insulators and base frames anchored to the roof.
3. Keep the collector strips horizontal and the end horns correctly oriented.
   Check arms, push rods and electrical connections against the roof and each
   other in front, side and three-quarter views.
4. Use the consumer's contact-wire height when known. Otherwise choose and
   document a plausible display height. CD 163 currently reaches 5.74 m with
   its active collector, while the folded head is at 4.64 m. Those are model
   choices, not a universal contact-wire specification.
5. Test that there are two pantographs, exactly one raised, one folded, a level
   contact head and connected arms. Check fixed equipment against the 4.7 m
   envelope and the whole model against the separate operating limit (currently
   6.5 m in repository tests). Never weaken the fixed-body check just to let a
   raised collector pass.

## Build and review

1. Read the vehicle references and applicable repository instructions; download
   images from the internet first when `assets/<name>/` has no photos. Inspect
   original XML profiles when available; use native-image measurement tables
   when transferring from vlakosimdb.
2. Implement the design with `sweep`, `loft`, `block`, `slab` and named scopes.
   Keep fitted panels slightly embedded and proud of their support surfaces;
   fix every coplanar-overlap report rather than disabling the build guard.
3. Run `pnpm build:models`. Check the triangle count and inspect
   `export/thumbs/<id>.png`. Render front, side, rear and three-quarter views
   headlessly as needed; use orthographic projection for measurements.
4. Add or update meaningful regression checks for the changed geometry and
   operating pose. Run `pnpm typecheck`, `pnpm test` and `pnpm build`.
5. Update `docs/models/vehicles.md`, reference provenance and any relevant
   measurement table. Present the result, validation and remaining uncertainty
   to the user, with links to the views and comparison artifacts.
6. Follow repository Git instructions: commit and push to `master`; do not
   commit generated `export/` or `dist/`. Importing into the game is a separate
   action and requires the user's instruction.

## Low level of detail

Every design needs its own `buildLod` (docs/models/lod.md); a design without one
does not compile. Extend the family's LOD adapter (`generator/lod*.ts`) or build on
the shared kit (`generator/lodKit.ts`): silhouette first, colours as bands, then
windscreens and window bands in `LOD_GLASS`, running gear reaching the rail and the raised rear pantograph; keep every parameter combination within its budget, and review a full/LOD
contact sheet.
