# Rail bogies and articulated trains (factory part)

Status: agreed
Date: 2026-10-16
Area: rail vehicle generators, rig export (`vehicles.meta.json`, GLB extras, JS modules), TGV model

## Context of the change

The full specification - context, every decision with its options, storage and
risks - lives in the game repository:
`rail-island-webapp/docs/specs/2026-10-16-rail-bogies-and-articulated-trains.md`.
This file records only the factory's share of it.

Today bogies are named scopes inside one `vehicle` node; only steam locos (animated
wheelsets) and the KT8D5 / KT4 / GT4 trams (`section<i>` / `joint<i>` parts plus a
`rig`) export nodes. `vehicles.meta.json` carries no pivot, bogie or axle data. The
TGV (`proc-vehicle-tgv`, `generator/tgv.ts`) exports `unit` = `powerCar` | `endCoach`
| `coach`; every coach is a rigid car with half a Jacobs bogie at each joint.

## User request

I want to make turning bogies for trams and trains. They should be everywhere there
are now two or three axles close together (i.e. four-axle or six-axle vehicles).
For articulated trams a bogie under the joint must be supported too. Moreover, the
position of a car is now computed from some fixed points - these points should be
defined per vehicle by the factory. Also change the TGV model - the intermediate
coaches can form a set (trainset), parametrized by length. The bogie is between
two coaches. Leave the power car as it is, only turn the intermediate coaches into
a set. You also have to implement articulated trains - the same as trams.

## Decisions

Recorded in full in the webapp spec. The ones the factory carries out:

- Bogies turn and define the body position; every rail vehicle exports
  `rig.supports: [{ x, node?, axles, sections }]`.
- Four- and six-axle vehicles (and Bo'Bo'Bo') get one node per bogie, pivoted at its
  centre. Two-axle vehicles and steam locos export their outermost axles as node-less
  supports.
- A section may have 0, 1 or 2 supports; a support under a joint carries two sections.
- The KT8D5's two middle bogies become supports under the joints.
- TGV: new `unit=set` with a car-count parameter 1-6, default 1. N cars = end coach
  + (N-2) intermediate coaches + turned end coach, a Jacobs bogie node under each
  joint; 1 car = one coach with a full bogie at both ends; 2 cars = two end coaches
  with one Jacobs bogie. The power car stays as it is.
- `unit=coach` / `unit=endCoach` leave the selectable values; the game aliases stored
  keys to `unit=set` with one car at render time, so the factory must keep the set of
  one car buildable and the old ids unrenamed.
- No wheel spin on bogies; no articulated train other than the TGV set.

## High-level plan

1. Bogie builders emit a node per bogie and a support; rigid vehicles get a
   one-section rig. `vehicle-rig.md`, `vehicles.md` and the `railroad-vehicle` skill
   document the rule; a test over every rail design asserts supports exist and each
   bogie node's pivot lies between its wheelsets.
2. The articulated trams move to supports; KT8D5 joint bogies become joint nodes.
3. The TGV set as above, with sections, joints and Jacobs bogie nodes.

## Database and persistent storage

No database. The `vehicles.meta.json` rig gains `supports` (see the webapp spec for
the field types); the TGV `unit` param gains `set` and a car-count param appears.
Regenerated on every build.

## Architecture decisions

See the webapp spec: one `supports` list instead of separate pivots and bogies; the
TGV set as a `unit` value instead of a new id.

## Weaknesses and risks

Every rail GLB changes bytes (expected: the designs change); the bogie builder
refactor spans about ten families. See the webapp spec for the rest.

## Out of scope

Wheel spin on bogies, other articulated trains, running physics, and publishing to
the game (a separate import step).
