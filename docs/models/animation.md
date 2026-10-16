# Animation

**Covers** - animated models: the mesh builder's animation clips and how they reach the GLB and the JS model, what plays each clip (`clipDrives`: a time loop or the distance travelled), the wind turbine's `wind` clip, the oil pumpjack's `pumping` mechanism, the steam locomotives' `running` clip (wheelsets, rods, Walschaerts valve gear), the timing contract for consumers, the site's Start and Stop buttons, and the tests.
**Code** - `generator/meshCore.ts` (`animate`, `AnimationClipSpec`, `ClipDrive`, `clipDrives`, `tube`), `generator/industry.ts` (`industrialWind`, `industrialOilPump`), `generator/pumpjack.ts`, `generator/meshBuilder.ts` (`toGlb`), `generator/threeBuilder.ts` (`toGroup`), `generator/steamGear.ts` (`RunningGear`, `N_SAMPLES`, `RUNNING_SPEED`, `RUNNING_CLIP`), `generator/glbPose.ts`, `src/ModelViewer.tsx`, `test/animation.test.ts`, `test/steam.test.ts`, `test/pumpjack.test.ts`, `test/jsModel.test.ts`
**See also** - [steam-locomotives.md](steam-locomotives.md), [vehicles.md](vehicles.md) (parts), [export.md](export.md), [js-format.md](js-format.md), [industry.md](industry.md), [../site/catalog-site.md](../site/catalog-site.md)

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
type ClipDrive = { drive: "time" } | { drive: "distance"; speed: number };
```

- **`time`** - loop at the clip's own duration, whatever the model does: the wind
  turbine's `wind`, the pumpjack's `pumping`. A consumer may vary phase and rate
  per instance so neighbours do not move in lockstep.
- **`distance`** - one loop covers `speed` x duration metres: play it at
  `timeScale = v / speed` for the model's signed speed `v` in m/s, so it runs
  backwards in reverse and stands still with the vehicle. The steam `running`
  clip is `distance` at `RUNNING_SPEED`.

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

## Timing contract

The clip's duration is the time the reference wheel takes to roll its
circumference at **`RUNNING_SPEED` = 5 m/s** (18 km/h): `pi * d / 5` seconds,
0.88 s for 1.4 m drivers. A consumer plays it in a loop at
`timeScale = speed / 5` (metres per second), and the wheels roll without
slipping at any speed; a stationary vehicle stops the action. The tender variant
runs at the same reference speed, so a locomotive and its tender stay in step.
The clip's `clipDrives` entry states exactly this: `distance` at 5 m/s.

## The site

`ModelViewer` reads the clips of the loaded model (`gltf.animations`, or the JS
model's `group.animations` for a non-default parameter choice) and, when there
are any, shows **Start** and **Stop** over the preview. Start plays every clip in
a loop through an `AnimationMixer` and runs a render loop only while it plays;
Stop halts the animation where it is (the render loop ends, the pose stays).
Another model or parameter choice stops it. Highlight and picking keep working,
on the moved parts.

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
static low-detail build. `test/jsModel.test.ts` checks that every design's JS model builds
the GLB's clips track for track.
