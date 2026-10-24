# Animation

**Covers** - animated models: the mesh builder's animation clips and how they reach the GLB and the JS model, what plays each clip (`clipDrives`: a time loop, the distance travelled or a state), the wind turbine's `wind` clip, the oil pumpjack's `pumping` mechanism, the steam locomotives' `running` clip (wheelsets, rods, Walschaerts valve gear), the pantographs as `liftable` mechanisms (`state` clips) and the `rod` primitive they are drawn with, the collector heights they reach (`collector.ts`), the timing contract for consumers, the site's Start/Stop and Up/Down buttons, and the tests.
**Code** - `generator/meshCore.ts` (`animate`, `AnimationClipSpec`, `ClipDrive`, `clipDrives`, `tube`, `rod`, `sampleDraw`, `movingPart`, `drawRouted`), `generator/liftable.ts`, `generator/collector.ts`, `generator/cd163.ts` (`pushRod`), the pantograph builders (`czElectricKit.ts` `singleArm`/`diamond`, `cd150.ts`, `cd163.ts`, `cd230.ts`, `emuParts.ts`, `shinkansen0.ts`, `tramKit.ts`), `test/liftable.test.ts`, `test/pantographs.test.ts`, `generator/industry.ts` (`industrialWind`, `industrialOilPump`), `generator/pumpjack.ts`, `generator/meshBuilder.ts` (`toGlb`), `generator/threeBuilder.ts` (`toGroup`), `generator/steamGear.ts` (`RunningGear`, `N_SAMPLES`, `RUNNING_SPEED`, `RUNNING_CLIP`), `generator/glbPose.ts`, `src/ModelViewer.tsx`, `test/animation.test.ts`, `test/steam.test.ts`, `test/pumpjack.test.ts`, `test/jsModel.test.ts`
**See also** - [steam-locomotives.md](steam-locomotives.md), [doors.md](doors.md) (the `door` clips), [lamps.md](lamps.md), [vehicles.md](vehicles.md) (parts), [export.md](export.md), [js-format.md](js-format.md), [industry.md](industry.md), [../site/catalog-site.md](../site/catalog-site.md)

## Clips in the mesh builder

A model with parts (`MeshCore.part`: a node per part, translated to its pivot)
may add **animation clips** with `animate({ name, times, tracks, drive })`: shared
sample times from 0, and per track a part (`node`), a `path` - `rotation`
(x, y, z, w quaternions about the part's pivot) or `translation` (the node's
position; at rest, the pivot) - and one value per time. The call refuses an
unknown part, a part name three.js cannot bind (spaces, dots, colons, slashes,
brackets), a values count that does not match the times and times that do not
start at 0 and rise, and a clip without a valid `drive`.

## What plays a clip

Every clip states what advances it in a consumer, so the game plays any clip without
knowing any model or clip by name:

```ts
type ClipDrive = { drive: "time" } | { drive: "distance"; speed: number } | { drive: "state" } | { drive: "door"; side: "left" | "right" };
```

- **`time`** - loop at the clip's own duration, whatever the model does: the wind
  turbine's `wind`, the pumpjack's `pumping`. A consumer may vary phase and rate
  per instance so neighbours do not move in lockstep.
- **`distance`** - one loop covers `speed` x duration metres: play it at
  `timeScale = v / speed` for the model's signed speed `v` in m/s, so it runs
  backwards in reverse and stands still with the vehicle. The steam `running`
  clip is `distance` at `RUNNING_SPEED`.
- **`state`** - a pose between two states, not a loop: time 0 is one state, the
  clip's end the other (a pantograph folded at 0, raised at 1). The consumer
  scrubs the clip to a value it eases itself; the clip says nothing about how fast.
- **`door`** - a state clip of a vehicle's passenger doors on one `side`, shut at
  0 (the rest pose) and open at 1; a drive of its own so that a consumer that moves
  every `state` clip as a pantograph leaves the doors alone
  ([doors.md](doors.md)).

three.js keeps no extras on an `AnimationClip`, so the drives travel beside the
clips by clip name, as **`clipDrives`**: the GLB's scene `extras.clipDrives`
(GLTFLoader: `scene.userData.clipDrives`) and the JS model's `group.userData.clipDrives`.
A model without clips has neither.

- `toGlb` writes each clip as a glTF animation: one SCALAR time accessor (with
  its min and max) shared by a LINEAR sampler per track, channels targeting the
  part nodes. A model without clips has no `animations` key, so every existing
  GLB is byte-identical.
- `toGroup` (the JS model) puts the same clips in the group's `animations` as
  `THREE.AnimationClip`s of `QuaternionKeyframeTrack` and `VectorKeyframeTrack`
  bound to `<part>.quaternion` and `<part>.position` - what GLTFLoader returns
  for the GLB. The three.js namespace handed to an animated model's `build`
  therefore needs those three classes.
- `poseGlb(glb, k)` (`glbPose.ts`) returns the GLB with a clip applied at sample
  `k`, so the tools that read a GLB at rest (coplanar check, stats, renderers)
  can check any frame. The thumbnail, the source tree and the coplanar check of
  the build use the rest pose, sample 0.

## The wind turbine

`industry-wind-turbine` is two parts: `tower` and `rotor` (pivot on the hub's
axis, +Z). The `wind` clip turns the rotor one revolution in 6 s, clockwise seen
from the front, sampled at thirds of a turn; drive `time`.

## The oil pumpjack

`industry-oil-pump` (`pumpjack.ts`) is a conventional beam pump: the parts
`frame` (base, samson post, saddle, gear reducer, wellhead, ladder), `cranks`
(axle, a crank disc, crank pin and counterweight each side, pivot on the crank
axle above the reducer), `beam` (walking beam, horsehead and the equalizer bar,
pivot on the saddle bearing), `pitman-arms` (both arms, pivot on the crank pin)
and `polished-rod` (rod and carrier bar, pivot at its top under the horsehead).

- The clip **`pumping`** is one crank revolution in `PUMP_STROKE` = 6 s,
  `PUMP_SAMPLES` = 48 steps plus the closing sample; drive `time`.
- The rest pose is mid-stroke: the crank pin level ahead of the axle, under the
  equalizer, and the beam level. Per sample the beam's tilt is solved by Newton's
  method so the pitman arm keeps its rest length; the arm is translated with the
  pin and turned to the equalizer, and the polished rod rises and falls by the
  horsehead's arc (its radius times the tilt).
- The low-detail build stays one static mesh.

## The steam locomotives' running gear

`RunningGear` (`steamGear.ts`) turns a spec - wheels (source x, diameter,
spokes), engines (coupled wheels, the main driver, the cylinder, crank radius,
rest phase, Walschaerts or not) - into parts and the clip **`running`**: one
revolution of the reference wheel (the main driver; a tender's first axle) in
`N_SAMPLES` = 48 steps plus the closing sample.

- **Wheelsets** (`wheelset-1`, ...): axle, both wheels (tyre as a `tube`,
  hub, spokes or disc), and on a coupled wheel its crank pin and counterweight;
  the main driver also carries the return crank. Each turns about its axle,
  clockwise seen from the right (rolling forward). A smaller wheel turns
  `d_ref / d` times per cycle, rounded to a whole number of spoke pitches, and its
  tyre has twice the spokes in facets, so the loop closes on an identical pose.
- **Per engine side** (`-right`, `-left`, plus `-front`/`-rear` on the Mallet):
  `coupling-rod` (translated round the crank circle), `crosshead` (sliding),
  `main-rod`, and with valve gear `eccentric-rod`, `expansion-link` (turning on
  its trunnion), `radius-rod`, `combination-lever`, `union-link` and
  `valve-spindle`. Each rigid link is a part pivoted at one joint, translated and
  turned about Z each sample.
- **Kinematics**: the crank pin runs on its circle (the left side a quarter turn
  behind the right); the crosshead sits a main rod's length from it on the
  cylinder axis; the expansion-link foot is where a circle about the trunnion
  meets one about the return crank; the combination lever's lean and the spindle's
  position are solved by Newton's method so the radius rod and union link keep
  the lengths they have in mid gear. Every link keeps its length at every sample
  (`solvedPoses`, tested).
- The planes of the motion are fixed outward from the wheel (`Z` in
  `steamGear.ts`): tyre, spokes, counterweights, crank boss, coupling rod, main
  rod and crosshead, return crank, eccentric rod, link, radius rod, lever, union
  link - so no two moving faces share a plane in any frame.

## Pantographs: liftable mechanisms

Every pantograph a design draws raised - the working one; a two-pantograph
locomotive's other stays folded and static - is a **liftable mechanism**
(`liftable.ts`): the builder draws it at any lift from 0 (folded) to 1 (raised)
through the builder it is handed, and `liftable(m, "pantograph", draw)`

1. draws it at `LIFT_SAMPLES` + 1 = 9 lifts into scratch builders of the model's
   class and frame (`sampleDraw`; a `turned` car's frame too);
2. finds each triangle's rigid motion from its raised position to every sample
   (from an orthonormal frame on the triangle) and refuses a piece that stretches;
3. gathers the triangles that move alike into pieces; a piece that never moves
   stays where it is drawn (insulators, base frame, hinge shaft), every other
   becomes a part `pantograph<n>-<k>` (`movingPart`), a child of the part being
   drawn (a car of an articulated train) or a top-level node beside the body as a
   bogie is, pivoted where it moves least - on its hinge for an arm;
4. draws the raised pose for real with each triangle routed to its piece's part
   (`drawRouted`), so the rest pose, the thumbnail and the source tree are the
   raised pantograph;
5. adds the clip `pantograph<n>`: per part its rotation and translation at the 9
   lifts, times 0 .. 1, drive `state`.

A piece moves rigidly only if it keeps its shape, which a `sweep` along x does not:
its end rings stand vertical whatever the arm's slope. The arms are therefore drawn
with **`rod`**, a round rod whose rings stand square to its axis and are oriented
by the axis and +Z alone, so turning it about a Z axis moves it rigidly. A push
rod changes length as the arm lifts, so `pushRod` draws it as the drive's
cylinder and its piston rod, two rods that slide over each other. Each linkage
finds its knee by intersecting circles about the hinge and the head at every lift,
so its arms keep their lengths; the folded pose is the same equations at lift 0.

Each pantograph is 3 to 7 parts. The low-detail build draws its own static
pantographs and carries no clip. `test/pantographs.test.ts` checks every electric
design: the clips, the rest pose as the last sample, the train at least 0.5 m
lower with every collector folded, no z-fighting folded, nothing at low detail.

### Collector heights

A raised collector touches the game's wire, so every design raises it to one of
two heights over the railhead (`collector.ts`), whatever the prototype's own line:

| Constant | Height | What it is |
| --- | --- | --- |
| `RAIL_COLLECTOR_TOP` | 5.88 m | the underside of the game's contact wire: its centre 8.86 studs over the railhead, 0.08 studs thick, at 1.5 studs a metre - (8.86 - 0.04) / 1.5 |
| `TRAM_COLLECTOR_TOP` | 5.50 m | a tram's collector; the game hangs its trolley wire with its underside here |

The carbon strips' top stands exactly there - every railway locomotive and unit, the
Shinkansen 0 (no longer at its own 5.0 m line) and the TGVs included, every tram at
the tram height - and the builders take no height of their own: `singleArm`,
`diamond` and `lodPantograph` default to the railway one, `emuParts.pantograph`,
`cd150.ts`, `cd163.ts` and `cd230.ts` raise to it, and the trams pass
`TRAM_WIRE`. Each builder keeps its arm lengths and its folded pose, so only how far
it lifts changes. `test/pantographs.test.ts` checks every rail vehicle: the carbon's
top, and the model's, at its wire, and the low detail no higher.

## Timing contract

The clip's duration is the time the reference wheel takes to roll its
circumference at **`RUNNING_SPEED` = 5 m/s** (18 km/h): `pi * d / 5` seconds,
0.88 s for 1.4 m drivers. A consumer plays it in a loop at
`timeScale = speed / 5` (metres per second), and the wheels roll without
slipping at any speed; a stationary vehicle stops the action. The tender variant
runs at the same reference speed, so a locomotive and its tender stay in step.
The clip's `clipDrives` entry states exactly this: `distance` at 5 m/s.

## The site

`ModelViewer` reads the clips of the loaded model (the JS model's
`group.animations`) and sorts them by their drive (`userData.clipDrives`):

- the **looping** clips (time, distance: a steam locomotive's running gear, kept for
  any wheel motion to come) get **Start** and **Stop**. Start plays them in a loop
  through an `AnimationMixer`; Stop halts them where they are, the pose stays;
- the **`state`** clips (the pantographs) get **Up** and **Down**, which move every
  working collector toward raised or folded over 1.5 s from wherever it stands -
  the viewer sets each state action's time from one lift value, as the game drives
  the clip from a state. A model arrives raised, its rest pose.

A render loop runs only while something moves. Another model or parameter choice
drops the animation. Highlight and picking keep working, on the moved parts. An
electric vehicle stands under the game's wire there, so a raised collector can be
seen touching it ([../site/catalog-site.md](../site/catalog-site.md)).

## Tests

`test/animation.test.ts`: the glTF animation layout, no `animations` key without
clips, the `animate` guards (a missing or invalid drive among them), `clipDrives` in
the scene extras and the JS model's `userData`, the three.js clip driving the part through an
`AnimationMixer`, `poseGlb`, and the `tube` primitive's face orientation.
`test/steam.test.ts`: per design and parameter combination one `running` clip
whose duration follows the reference wheel, every part but `body` animated,
linear samplers on shared times, a closed loop, every wheelset turning forward a
whole number of spoke pitches per cycle; rod lengths kept at all samples; and at
four samples no z-fighting, no wheel below the rail beyond a facet's sagitta, and
the envelope; the clip's `distance` drive at `RUNNING_SPEED`.
`test/pumpjack.test.ts`: the pitman arm, beam tail and crank keep their lengths at
every sample, the beam rocks both ways and returns, one `time` clip on the four
moving parts, no z-fighting and nothing below ground at every sixth sample, and a
static low-detail build. The catalog sweep (`test/catalogSweep.ts`) checks that every design's JS model builds
the GLB's clips track for track.
