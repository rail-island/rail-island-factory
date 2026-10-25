// The fixed props the game places on its structures (generator/props/,
// docs/models/props.md): the meta the game reads before building one and the
// material names the game reads its box material back from.
import { describe, expect, it } from "vitest";
import { PROP_DESIGNS, PREVIEW_DESIGNS, DESIGNS, BUILDINGS, ALL_VEHICLES } from "../generator/generate";
import { exportPropMeta } from "../generator/catalog";
import { FAR_PROPS, propMaterial } from "../generator/props/propKit";
import { PROPS as PORT_PROPS, CONTAINER_LIVERIES } from "../generator/sets/port";
import { TYPE_META as AIRPORT_TYPES } from "../generator/sets/airport";
import { CONTAINER_COLORS } from "../generator/props/portProps";
import { CROSSING_SIGNAL_LAMPS, RAIL_SIGNAL_LAMPS, SIGNAL_PROP_IDS, bufferStop, bufferStopLod, crossingSignal, crossingSignalLod, railSignal, railSignalLod } from "../generator/props/signalProps";
import { exportedText } from "../generator/text";

describe("the props", () => {
  it("are every model a set names and the signals the game places, listed apart from the buildings and vehicles", () => {
    const named = [
      ...Object.values(SIGNAL_PROP_IDS),
      ...Object.values(PORT_PROPS),
      ...Object.values(AIRPORT_TYPES).flatMap((t) => [t.windsock.prop, ...(t.tower ? [t.tower.prop] : [])]),
    ];
    const ids = PROP_DESIGNS.map((d) => d.id);
    for (const id of named) expect(ids).toContain(id);
    for (const id of ids) expect(named).toContain(id);
    for (const d of PROP_DESIGNS) {
      expect(DESIGNS.get(d.id)).toBe(d);
      expect(BUILDINGS).not.toContain(d);
      expect(ALL_VEHICLES).not.toContain(d);
    }
    for (const id of FAR_PROPS) expect(ids).toContain(id);
    expect(CONTAINER_COLORS.length).toBe(CONTAINER_LIVERIES);
  });

  it("carry no game text: the game never names a prop or a preview", () => {
    const keys = Object.keys(exportedText());
    for (const d of [...PROP_DESIGNS, ...PREVIEW_DESIGNS]) expect(keys.some((k) => k.startsWith(`model.${d.id}`))).toBe(false);
  });

  it("export their bounds and far flag in props.meta.json", () => {
    const bounds = new Map([["proc-prop-port-crane", { min: [-1, 0, -2.00004], max: [3, 30, 2] }]]);
    const meta = exportPropMeta(PROP_DESIGNS, bounds, FAR_PROPS);
    expect(meta.count).toBe(PROP_DESIGNS.length);
    const crane = meta.props.find((p) => p.id === "proc-prop-port-crane")!;
    expect(crane.prop).toEqual({ far: true, bounds: { min: [-1, 0, -2], max: [3, 30, 2] } });
    expect(crane.category).toBe("Props");
    expect(meta.props.find((p) => p.id === "proc-prop-port-bollard")!.prop.far).toBe(false);
  });

  it("name every material <kind>#<rrggbb>, the game's box material and colour", () => {
    expect(propMaterial("light", [255, 236, 178])).toBe("light#ffecb2");
    for (const d of PROP_DESIGNS) {
      const palette = (d.build() as unknown as { palette: Record<string, unknown> }).palette;
      for (const name of Object.keys(palette)) expect(name, d.id).toMatch(/^[a-z]+#[0-9a-f]{6}$/);
    }
  });
});

/** A builder's triangle corners per material, as the tests elsewhere read them. */
const drawnByMaterial = (m: { triangleCount(): number }): Map<string, { pos: number[] }> => (m as unknown as { groups: Map<string, { pos: number[] }> }).groups;

describe("the trackside signals", () => {
  // the game swaps each lamp's material on its own, so every lamp must be a material of its own
  it.each([
    ["rail signal", railSignal, railSignalLod, RAIL_SIGNAL_LAMPS],
    ["crossing signal", crossingSignal, crossingSignalLod, CROSSING_SIGNAL_LAMPS],
  ] as const)("the %s draws each lamp in its own material, at both levels of detail", (_name, build, lod, lamps) => {
    for (const m of [build(), lod()]) {
      const names = new Set(drawnByMaterial(m).keys());
      for (const l of lamps) expect(names).toContain(propMaterial(l.kind, l.color));
      expect(m.triangleCount()).toBeGreaterThan(0);
    }
    expect(build().triangleCount()).toBeLessThanOrEqual(1500);
  });

  it("draws the buffer stop without a lamp, standing on the rail tops the game lays under it", () => {
    for (const m of [bufferStop(), bufferStopLod()]) {
      expect([...drawnByMaterial(m).keys()].filter((k) => k.startsWith("lamp"))).toEqual([]);
      // no rails, sleepers or bed of its own: the game draws the track in the dead end's rail type
      const pos = m.positions();
      let minY = Infinity;
      for (let i = 1; i < pos.length; i += 3) minY = Math.min(minY, pos[i]!);
      expect(minY).toBeGreaterThan(1.528 - 0.258); // the rail foot
    }
  });

  it("lights the rail signal's lamps red over blue over green, the crossing's left of right", () => {
    const centreOf = (m: ReturnType<typeof railSignal>, name: string): [number, number] => {
      const p = drawnByMaterial(m).get(name)!.pos;
      let x = 0, y = 0;
      for (let i = 0; i < p.length; i += 3) { x += p[i]!; y += p[i + 1]!; }
      return [x / (p.length / 3), y / (p.length / 3)];
    };
    const rail = railSignal();
    const ys = RAIL_SIGNAL_LAMPS.map((l) => centreOf(rail, propMaterial(l.kind, l.color))[1]);
    expect(ys[0]).toBeGreaterThan(ys[1]!);
    expect(ys[1]).toBeGreaterThan(ys[2]!);
    const xing = crossingSignal();
    const xs = CROSSING_SIGNAL_LAMPS.map((l) => centreOf(xing, propMaterial(l.kind, l.color))[0]);
    expect(xs[0]).toBeLessThan(0);
    expect(xs[1]).toBeGreaterThan(0);
  });
});
