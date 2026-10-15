# Vehicle rig

**Covers** - what of a road vehicle the game may move after loading it: the steered front wheels, an articulated vehicle's sections and the joints (bellows) between them; how they are laid out as GLB nodes, the `rig` that names them in the GLB, the meta entry and the JS model, the pose and joint functions the JS model exports, and the model page's Pose sliders.
**Code** - `generator/rig.ts`, `generator/trucks.ts` (`steered`), `generator/meshCore.ts` (`part` with a parent), `generator/meshBuilder.ts` (`toGlb`), `generator/threeBuilder.ts` (`toGroup`), `generator/vehicleParts.ts` (`steeredWheels`), `generator/busAssembly.ts`, `generator/jsModel.ts`, `generator/catalog.ts` (`MetaEntry.rig`), `src/catalogQuery.ts` (`poseControls`, `poseOf`, `steerLockDeg`), `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `test/rig.test.ts`
**See also** - [vehicles.md](vehicles.md), [buses.md](buses.md), [js-format.md](js-format.md), [export.md](export.md), [../site/catalog-site.md](../site/catalog-site.md)

## The idea

The game already animates models by moving named nodes rather than playing clips:
it spins the wind turbine's rotor by writing one Euler angle on a node whose origin
sits on the rotation axis, and it poses an articulated bus as a hinged chain of
section nodes with a bellows re-skinned between them every frame
(rail-island-webapp, `render/SpinController.ts` and `models/ArticulatedBus.ts`).
A factory vehicle is built for exactly that: everything that moves is its own node,
and a `rig` says which.

| What | Nodes | How it moves |
|---|---|---|
| steered wheels | `wheel-front-left`, `wheel-front-right` (a second steered axle's `wheel-front-2-left`, ...), children of the front body's node | each turns about its own +Y; its origin is the wheel's centre (on the steering axis) |
| sections | `section0`, `section1`, ... (the American truck: `truck`, `trailer`) | section i turns about its origin, the hinge with section i - 1, which section i - 1 carries |
| joints | `joint0`, ... between sections i and i + 1 | not rigid: re-drawn between the two sections wherever they are (`renderJoint`) |

A rigid vehicle has a body node (`body` for a bus and the mixer) holding the steered
wheels and no sections. A semi-truck is two sections (tractor and trailer, hinged at
the king pin) and no joint. Every road vehicle has a rig - the American truck, the
three trucks reproduced from the game ([trucks.md](trucks.md)) and the buses
([buses.md](buses.md)); the rail, air and water vehicles have none.

## The rig

`VehicleRig` (`generator/rig.ts`), metres and the model frame (+X forward, +Y up, +Z
right), limits in degrees:

```ts
interface VehicleRig {
  steer?: { axles: Array<{ nodes: [atMinusZ, atPlusZ]; wheelbase }>; maxAngleDeg; track };
  sections?: Array<{ node; pivot: [x, y, z] }>;      // front first; pivot = the node's rest origin
  joints?: Array<{ node; sections: [front, rear]; front; rear; profile: Array<[z, y]>; folds; depth; material }>;
  maxBendDeg?: number;
}
```

- `steer.axles` lists the steered axles front first (one, or two on the 8x4 mixer),
  each with its two wheel nodes - the one at -Z first - and its `wheelbase`, from the
  axle back to the axle the vehicle turns about (a tandem's middle; an articulated
  bus's front-section axle). `maxAngleDeg` is the front axle's **inner** wheel's lock;
  `track` is the distance between an axle's two steering axes.
- `sections[i].pivot` is section i's hinge with the section ahead (`[0, 0, 0]` for the
  first). For a bus it is the middle of the gap the joint covers, 0.6 m above the
  road; for the truck the king pin.
- A joint is described, not stored: its front and rear faces' x, its inner (valley)
  cross-section, the number of outer ridges and their depth. The GLB holds its rest
  pose, drawn by the same function the game calls.

The rig travels three ways, all the default build's: the GLB's **scene extras**
(`scenes[0].extras.rig`, which three's GLTFLoader puts in `scene.userData.rig`), the
JS model's group (`group.userData.rig`, for any parameter combination) and the
vehicle's **meta entry** (`vehicles.meta.json`, `rig`). A model without one has no
`rig` key and unchanged bytes.

## Parts with a parent

The nodes are the mesh builder's parts ([vehicles.md](vehicles.md)). A part may name
a parent - an earlier part - and is then its child node, translated by its pivot
less the parent's:

```ts
m.part("truck", [0, 0, 0], () => tractor(m));
steeredWheels(m, "truck", FRONT_AXLE, AXLE_Y, (s, z0, z1) => wheel(m, FRONT_AXLE, z0, z1, s), [0.86, 1.16]);
m.part("trailer", PIVOT, () => trailer(m));
```

The parts after a parent must all be its descendants until the last one is drawn, so
the drawing order is the node tree's depth-first order - the order the GLB numbers a
material's triangles in, which the source tree's ranges rely on
([source-tree.md](source-tree.md)). `part()` throws otherwise. Each part is still a
top-level scope of the source tree.

## Steering

Every steered wheel aims at one turning centre on the line of the axle the vehicle
turns about (Ackermann): `steerAngles(steer, angle)` gives each axle's pair of Y
rotations, the -Z wheel first, for the angle of a virtual wheel midway along the
front axle - positive counter-clockwise from above, toward -Z, which is a left turn in
the factory's frame (the reproduced trucks, authored with +Z left, turn right; their
nodes are named for their own frame). The inner wheels turn tighter, and a second
steered axle, nearer the turning line, less than the first. `steerLock(steer)` is
the largest such angle, the one that brings the front inner wheel to `maxAngleDeg`. A wheel only ever
turns about its own vertical, so nothing else of it moves: the tyre, disc and hub
stay round its centre. The front wheel arches are long enough for the tyre at lock.

## The hinged chain and the joint

`pose(group, { steer, bend }, rig?)` poses a built model in place - the GLB's scene
or the JS group, both carry the nodes and the rig:

1. turns the steered wheels (`steerAngles`);
2. keeps section 0 where it is and lays every section behind it out as a chain: the
   hinge of section i is where section i - 1 now carries it, and section i's yaw is
   section i - 1's plus `bend[i - 1]` (radians, + counter-clockwise from above);
3. re-draws every joint (`renderJoint`). `pose(group, {})` is the rest pose.

The game is expected to pose the sections itself, on the road, as it does today; it
then calls `renderJoint(group, i)` for each joint. That reads the two section nodes'
**world matrices**, so it works however they got there - nested, re-parented into
wrappers, scaled - and writes the joint mesh's positions and normals in place: the
triangle count never changes, so nothing is re-allocated per frame.

`jointTriangles(joint, sections, ma, mb)` is the joint itself, three.js-free: rings
of the cross-section stacked from the front face (t = 0) to the rear face (t = 1),
the odd ones grown outward by `depth` (the ridges, so the accordion reads without a
texture). Every vertex rides **both** sections: its position under the front
section's matrix and under the rear section's, blended by its t. The rings at the two
faces therefore move exactly with their sections, and the ones between fan out on
the outside of a bend and close up on the inside - at any yaw, pitch or roll, with no
gap. This is the game's bellows skin (each vertex rides its section) with the
vertices between the faces blended instead of snapped, a corrugated rubber
material in place of the three textured quads, and any number of sections - a
three-section tram is two joints.

## In the JS model

A rigged model's module (`export/js/<id>.js`, [js-format.md](js-format.md))
exports, beside `build` and `params`:

```js
import build, { pose, renderJoint, steerAngles, steerLock, jointTriangles } from "./veh-karosa-long.js";
const bus = build(THREE, { variant: "b961" });
pose(bus, { steer: 0.3, bend: [-0.5] });  // radians
// or: pose the sections yourself, then
renderJoint(bus, 0);
```

## On the site

A rigged model's page has a **Pose** block above the tabs: a Steering slider
(plus or minus the steering lock, degrees) and one per hinge - "Trailer" for a
semi-truck, "Joint" for a two-section bus, "Joint 1", "Joint 2" beyond. Moving one fetches
the model's JS module once and calls its `pose()` on the preview (the GLB at the
default parameters, the JS build otherwise); Reset returns to rest. The pose is not
in the URL, and the thumbnail, specs and source tree stay the rest pose's. The slider
limits come from the catalog record's `rig` (`poseControls`); `steerLockDeg` repeats
`steerLock`'s formula because the site may import only types from `generator/`, and a
test holds the two equal.

## Tests

`test/rig.test.ts`: Ackermann angles meet at one centre and reach the lock, a second
steered axle aimed at the same centre; a joint stays sealed to both sections under
arbitrary matrices and winds outward; every road vehicle is rigged, its steered
wheels are children of the front body, mirrored and `track` apart, axles front first;
`pose()` on the JS module turns every wheel by `steerAngles` and keeps every hinge
where both of its sections put it; every semi-trailer swings clear of its tractor;
the site's sliders and units.
`test/jsModel.test.ts` checks the JS group's node nesting and `userData.rig` against
the GLB's nodes and scene extras; `test/export.test.ts` the meta entries' `rig`.
