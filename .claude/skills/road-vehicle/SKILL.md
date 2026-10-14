---
name: road-vehicle
description: Model or change a procedural road vehicle (truck, articulated truck with trailer, bus, van, car) in generator/vehicles.ts - the budgets it must meet (about 10k triangles, about 300 kB GLB), the truck/trailer split at the coupling's rotation point for an articulated vehicle, the conventions, and how to check the result headlessly. Use whenever a road vehicle model is added or changed in this repository.
---

# Road vehicle

How to add or change a road vehicle in `generator/vehicles.ts`. The reference
for the code is `docs/models/vehicles.md`; this skill is the checklist.

## Budgets

| | limit | enforced by |
|---|---|---|
| triangles | about **10,000** (hard cap 10,000) | `test/models.test.ts` |
| GLB size | about **300 kB** (hard cap 300 kB) | `test/models.test.ts` |

Vehicles are written as compact GLBs (indexed, vertices shared, no normals -
flat normals are computed by the loader, as glTF requires), so the size budget
is reachable at the triangle budget. Spend triangles where they read from the
game's camera - wheels, the front, the silhouette - not on parts under the body.
Check both numbers in the `pnpm build:models` output and in `export/catalog.json`
(`triangles`, `glbBytes`).

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
  gear sits behind the tractor's rear wheels.

A rigid vehicle (bus, van, box truck) has no parts and is written as one node.

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

## Steps

1. Look at the references in `assets/<name>/` (photos; render a reference GLB
   with `pnpm exec tsx generator/renderGlbThumb.ts <glb> <out.png> 512`).
2. Write or change the design in `vehicles.ts`; add a new one to `VEHICLES`.
3. `pnpm build:models` - read the triangle count; fix any z-fighting report.
4. Look at `export/thumbs/<id>.png`, and render more views (side, front, rear,
   top) from a scratch copy of `renderGlbThumb.ts` with a different `VIEW_DIR`.
   For an articulated vehicle also check the trailer swung: rotate the trailer
   node and confirm it clears the tractor.
5. `pnpm typecheck`, `pnpm test`, `pnpm build`.
6. Update `docs/models/vehicles.md` (the designs table, anything new), commit
   and push to `master`.
