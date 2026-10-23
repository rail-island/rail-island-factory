// The fixed props the game places on its structures (generator/props/,
// docs/models/props.md): the loading gauge no shed may cross, the meta the game
// reads before building one, and the material names the game reads its box
// material back from.
import { describe, expect, it } from "vitest";
import { PROP_DESIGNS, PREVIEW_DESIGNS, DESIGNS, BUILDINGS, ALL_VEHICLES } from "../generator/generate";
import { exportPropMeta } from "../generator/catalog";
import { FAR_PROPS, propMaterial, separateCoplanar, type PropBox } from "../generator/props/propKit";
import { SHED_VALUES, STATION_DIMS, STATION_TYPES, headOverhangFor, intrudesOnCabin, shedBoxes } from "../generator/props/cableCarSheds";
import { TYPE_META as CABLE_CAR_TYPES } from "../generator/sets/cableCarStation";
import { PROPS as PORT_PROPS, CONTAINER_LIVERIES } from "../generator/sets/port";
import { TYPE_META as AIRPORT_TYPES } from "../generator/sets/airport";
import { CONTAINER_COLORS } from "../generator/props/portProps";
import { exportedText } from "../generator/text";

describe("cable car sheds", () => {
  it.each(STATION_TYPES)("%s stays out of the ring the cabins sweep round the wheel", (type) => {
    const dims = STATION_DIMS[type];
    const fouling = shedBoxes(type).filter((b) => intrudesOnCabin(dims.ropeHeadY, headOverhangFor(dims.d), b));
    expect(fouling).toEqual([]);
    // and the separation that keeps faces from flickering moves nothing into it
    expect(separateCoplanar(shedBoxes(type)).filter((b) => intrudesOnCabin(dims.ropeHeadY, headOverhangFor(dims.d), b))).toEqual([]);
  });

  it("would catch a box across the cabin's path", () => {
    const dims = STATION_DIMS.open_gantry;
    const across: PropBox = { cx: 0, cy: dims.ropeHeadY - 3, cz: headOverhangFor(dims.d) - 5, sx: 4, sy: 2, sz: 1, color: [0, 0, 0], material: "steel" };
    expect(intrudesOnCabin(dims.ropeHeadY, headOverhangFor(dims.d), across)).toBe(true);
  });

  it("is the shed every station type names, at the type's own size", () => {
    for (const type of STATION_TYPES) {
      expect(CABLE_CAR_TYPES[type]).toMatchObject({ ...STATION_DIMS[type], shed: { prop: "proc-prop-cablecar-shed", values: { type: SHED_VALUES[type] } } });
    }
  });
});

describe("the props", () => {
  it("are every model a set names, listed apart from the buildings and vehicles", () => {
    const named = [
      ...Object.values(CABLE_CAR_TYPES).map((t) => t.shed.prop),
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
