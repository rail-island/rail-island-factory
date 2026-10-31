// A one-quad design that sets passenger-view hints (generator/passengerHints.ts), for
// test/viewerPassenger.test.ts to bundle as a JS model (generator/jsModel.ts).

import { MeshBuilder } from "../../generator/meshBuilder.ts";
import { setPassenger } from "../../generator/passengerHints.ts";

function quad(): MeshBuilder {
  const m = new MeshBuilder({ deck: { color: "#a0a0a0" } });
  m.quad("deck", [0, 0, 0], [0, 0, 4], [4, 0, 4], [4, 0, 0]);
  return m;
}

export function passengerFixture(): MeshBuilder {
  const m = quad();
  setPassenger(m, { eye: 2.55, tracks: [{ x: 2, z0: 0, z1: 4, top: 0.5 }] });
  return m;
}

export function passengerFixtureLod(): MeshBuilder {
  const m = quad();
  setPassenger(m, { eye: 2.55 });
  return m;
}
