---
name: road-vehicle
description: Model or change a procedural road vehicle (truck, articulated truck with trailer, bus, articulated bus, van, car) in generator/vehicles.ts or generator/buses.ts - the triangle budget it must meet (about 10k triangles), the steered front wheels every road vehicle has as parts, the truck/trailer split at the coupling's rotation point, an articulated bus's sections and joints, the conventions, and how to check the result headlessly. Use whenever a road vehicle model is added or changed in this repository.
---

# Road vehicle

How to add or change a road vehicle in `generator/vehicles.ts`. The reference
for the code is `docs/models/vehicles.md`; this skill is the checklist.

## Budget

About **10,000 triangles** per vehicle (hard cap 10,000, enforced by
`test/models.test.ts`). There is no file-size budget. Spend triangles where they
read from the game's camera - wheels, the front, the silhouette - not on parts
under the body. The count is in the `pnpm build:models` output and in
`export/catalog.json` (`triangles`).

Vehicles are written like the skyscrapers: non-indexed triangle soups with flat
normals stored per face (tested), so no consumer has to compute them.

## Articulated vehicles (truck + trailer)

An articulated vehicle - a tractor with a semi-trailer - is **one model with two
named parts**, divided at the coupling's rotation point:

- `truck` - the tractor, drawn inside `m.part("truck", [0, 0, 0], ...)`; its
  node stays at the model origin;
- `trailer` - everything that swings, drawn inside
  `m.part("trailer", pivot, ...)`, where `pivot` is the **rotation point**: the
  king pin on the fifth wheel. The trailer's node is translated to the pivot and
  its mesh is local to it, so the game turns the trailer by rotating that node
  about its own vertical (Y) axis.

Both are drawn in world coordinates in `vehicles.ts`; `MeshBuilder.toGlb` does
the split. Every triangle must sit in a part once parts are used. Rules:

- the pivot lies on the vehicle's centre line (z = 0), at the fifth wheel's top;
- the trailer front must **clear the tractor when it swings**: the distance from
  the pivot to the trailer's front corners must be less than the distance from
  the pivot to anything on the tractor above the fifth wheel (the sleeper's
  back); keep at least 10 cm;
- nothing of the trailer reaches into the tractor, and the trailer's landing
  gear sits behind the tractor's rear wheels;
- everything of the trailer **below the fifth wheel's top** (frame rails, landing
  gear, pipes) stays outside the circle the tractor's rear corners, mudguards and
  mudflaps sweep about the pivot, or the trailer cuts them at a few degrees of
  bend; `test/rig.test.ts` swings every semi to its `maxBendDeg` and checks it
  triangle against triangle.

## Steered front wheels (every road vehicle)

The two front wheels are **parts of their own inside the front body's part**, so
the game can steer them by turning a node, as it spins the wind turbine's rotor:

- draw the body as a part first (`m.part("body", [0, 0, 0], ...)`; the truck's is
  `truck`, an articulated bus's `section0`), leaving the front axle's beam in it;
- then `steeredWheels(m, "body", axleX, axleY, drawWheel, [zInner, zOuter])`
  (`vehicleParts.ts`): it draws `wheel-front-left` and `wheel-front-right` as
  child parts with their pivots at the wheel centres;
- set `m.rig = { steer: { axles: [{ nodes, wheelbase }], maxAngleDeg, track }, ... }`
  (`rig.ts`), `nodes` the pair `steeredWheels()` returns (the -Z wheel first, always
  named `-left`); the inner wheel's lock is about 40 degrees for a truck, 50 for a bus;
- check the tyre at lock clears the fender or arch: a tyre only turns about its
  own vertical, so its farthest point stays `hypot(r, width / 2)` from its centre;
  inboard it swings in toward the engine or frame, which must stay narrower than
  the tyre's path at lock (`test/rig.test.ts` checks every road vehicle at lock).

A rigid vehicle (bus, van, box truck) is then the body part with the two wheels in
it, and no sections.

## Articulated buses (sections + joints)

An articulated bus is `section0`, `section1`, ... hinged in the middle of each
gap, and a `joint<i>` part per gap drawn by `drawJoint()` -- the bellows the game
re-draws between the sections with `renderJoint()`. Use `assembleBus()`
(`busAssembly.ts`), which lays out the parts and the rig; see
`docs/models/buses.md` and `docs/models/vehicle-rig.md`. Check the bend on the
model page's Joint slider headlessly with a posed render (Steps, 4).

## Conventions

- Metres, **+X forward**, +Y up, +Z to the right; centred on z = 0; the wheels
  stand on y = 0 (a tyre is a 16-gon with a flat side down: axle at
  `WHEEL_R * cos(pi / 16)`).
- Real proportions: at most 2.6 m wide plus mirrors (tested at 2.7 m), at most
  4.115 m high (13 ft 6 in), longer than twice its width.
- Build mostly from `sweep` (a profile pushed along x or z), `block` (a closed
  box) and `plate` (a bent sheet, e.g. a fender); vertical cylinders are
  `prism`s. Every part in a named `m.scope(...)`.
- No z-fighting: details are sunk a centimetre or two into the face they sit on
  and stand a centimetre or more proud of it, never flush with a face of another
  material. The build refuses a flickering model.
- Ids start with `veh-` and are never renamed once shipped (saved maps store
  them). Reference photos and an inspiration GLB go under `assets/<name>/`.

## Reference images from the internet

Model from real photos, not memory. Before modelling a new vehicle (or when
correcting one), download a few reference images and commit them:

1. Find at least two or three images: a side view, a front or three-quarter view,
   and the rear or a dimension drawing if available. Prefer Wikimedia Commons and
   other sources with a clear free license (CC0, CC BY, CC BY-SA, public domain).
2. Save them under `assets/<name>/` with descriptive lowercase names, downscaled
   to about 1600 px on the long side.
3. Record each file (title, URL, author, licence, use) in `assets/<name>/SOURCES.md`.
4. Set `references: "<name>"` on the design in `VEHICLES`; the build copies the
   images to `export/refs/<id>/` and the site shows them on the model page's
   **Images** tab.
5. Commit and push the images together with the model change.

Files the user uploads to `assets/_tmp/` (an inspiration GLB, a photo) are inputs for one model: `git mv` them into `assets/<name>/` in the same change and list them in `SOURCES.md` too.

If downloading is not possible, tell the user and list what you would have used.

## Steps

1. Download reference images if `assets/<name>/` has none (above). Look at the
   references in `assets/<name>/` (photos; render a reference GLB file, or any
   design by id, with `pnpm exec tsx generator/renderGlbThumb.ts <glb | id> <out.png> 512`).
2. Write or change the design in `vehicles.ts`; add a new one to `VEHICLES`, with
   its game properties - `game: { weight, power, maxspeed, accel }` (tonnes, kW,
   km/h, m/s2; `null` where none). The build fails without them
   (docs/models/game-properties.md).
3. `pnpm build:models` - read the triangle count; fix any z-fighting report.
4. Look at `export/thumbs/<id>.png`, and render more views (side, front, rear,
   top) from a scratch copy of `renderGlbThumb.ts` with a different `VIEW_DIR`.
   Also render it posed: build the JS module (`bundleDesign`), call its
   `pose(group, { steer, bend })` and rasterize the group's triangles with back
   faces culled (as three.js does) -- the steered wheels at lock, and for an
   articulated vehicle the trailer or rear section swung, clear of the front one
   and, for a bus, the bellows sealed.
5. `pnpm typecheck`, `pnpm test`, `pnpm build`.
   Send the user the rendered views in the chat (AGENTS.md, "Show the user the model").
6. Update `docs/models/vehicles.md` (the designs table, anything new), commit
   and push to `master`.
