---
name: railroad-vehicle
description: Create or change procedural railway vehicles, including electric and diesel locomotives, railcars, coaches and wagons. Apply rail dimensions, triangle budgets, bogie and coupling conventions, pantograph operating poses and headless validation. Use for railway vehicle work in this repository; also use vlakosimdb-transfer when reconstructing a vehicle from that database.
---

# Railroad vehicle

**Covers** - railway vehicle geometry, operating poses and verification.
**Code** - `generator/vehicles.ts`, `generator/cd163.ts`, `test/models.test.ts`
**See also** - [vehicle reference](../../../docs/models/vehicles.md), [road-vehicle](../road-vehicle/SKILL.md), [vlakosimdb-transfer](../vlakosimdb-transfer/SKILL.md)

This skill follows the repository's road-vehicle workflow, with railway-specific
geometry, dimensions and roof equipment. Keep skill text and repository
documentation in English.

## Budget and model contract

- At most **25,000 triangles per rail vehicle**, as enforced by the current
  repository tests. There is no file-size budget. Spend detail on the silhouette,
  cab, running gear and recognizable roof equipment.
- Use deterministic, non-indexed triangle soups with flat normals stored per
  face. Every component belongs to a meaningful `m.scope(...)`.
- Use stable `veh-` identifiers, never rename shipped models, and register the
  design in `VEHICLES`. Rail catalog entries use `category: "Rail vehicles"`
  and the appropriate group; CD 163 uses `loco`.
- A rigid locomotive or wagon remains one node unless its consumer explicitly
  needs articulated parts. Do not apply the road truck/trailer split to a train.
  If articulation is required, place pivots at the actual bogie or coupling
  rotation centres and verify clearance through the intended motion.

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
- Store photos, native source references and provenance under `assets/<name>/`.
  For vlakosimdb input, follow its transfer skill and report measured residuals.

## Electric locomotives and pantographs

**An electric locomotive with two pantographs must have one raised and the other
folded in its default displayed operating pose.** A specific user request for a
parked, maintenance or other operating state overrides this default.

1. Identify the source pantograph type and hinge orientation. Choose which end
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

1. Read the vehicle references and applicable repository instructions. Inspect
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
