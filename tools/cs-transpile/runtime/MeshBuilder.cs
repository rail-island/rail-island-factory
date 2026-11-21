// The one hand-written seam of the C# transpiler pilot: what generator/threeBuilder.ts
// is to the JS model. The designs' `MeshBuilder` is the transpiled MeshCore plus
// ToModelNode, which builds the engine-neutral node tree from the triangle soups
// exactly as toGroup builds the THREE.Group: a mesh per material in name order, a
// node per part at its pivot (offset from its parent's), the clips and the userData.
// Named surfaces (UVs) and interiors are out of the pilot's scope and throw.

using System;
using System.Collections.Generic;
using System.Linq;
using RailIsland.Factory.Generated;

namespace RailIsland.Factory.Runtime;

/** The marker a transpiled constructor passes its base so the base does nothing; __ctor_X does the work. */
public sealed class JsCtor
{
    public static readonly JsCtor Skip = new();
    private JsCtor() { }
}

public class MeshBuilder : MeshCore
{
    public MeshBuilder(JsRecord<MaterialSpec> palette) : base(JsCtor.Skip) { __ctor_MeshBuilder(palette); }
    protected MeshBuilder(JsCtor skip) : base(skip) { }
    public void __ctor_MeshBuilder(JsRecord<MaterialSpec> palette) => __ctor_MeshCore(palette);

    public ModelNode ToModelNode(string name = "model")
    {
        var root = new ModelNode { name = name };
        var materials = groups.keys().sort();
        var standard = materials.map(mat =>
        {
            var spec = palette[mat];
            if (spec.surface != null) throw new NotSupportedException($"{mat}: named surfaces are outside the pilot");
            return new MaterialData
            {
                name = mat,
                color = spec.color,
                metalness = spec.metallic ?? 0,
                roughness = spec.roughness ?? 0.85,
                doubleSided = spec.doubleSided == true,
                jsMaterial = spec.jsMaterial,
                vertexColors = groups.get(mat).col != null,
                glass = spec.glass == true,
            };
        });
        var units = outputUnits(name);
        var holders = new Dictionary<int, ModelNode>();
        foreach (var unit in units)
        {
            int index = (int)unit.index;
            var holder = index >= 0 ? new ModelNode() : root;
            if (index >= 0)
            {
                var at = partOffset(unit.index);
                holder.name = unit.name;
                holder.position = new[] { at[0], at[1], at[2] };
                int parent = (int)parts[unit.index].parent;
                (parent >= 0 ? holders[parent] : root).children.Add(holder);
                holders[index] = holder;
            }
            for (int m = 0; m < (int)materials.length; m++)
            {
                var mat = materials[m];
                var g = groups.get(mat);
                var pos = new List<float>();
                var nrm = new List<float>();
                var col = new List<float>();
                for (int t = 0; t < (int)g.part.length; t++)
                {
                    if (g.part[t] != unit.index && (unit.index >= 0 || units.length > 1)) continue;
                    for (int k = 0; k < 9; k++)
                    {
                        // the JS model writes Float32Arrays: the same rounding of the same doubles
                        pos.Add((float)(g.pos[t * 9 + k] - unit.pivot[k % 3]));
                        nrm.Add((float)g.nrm[t * 9 + k]);
                        if (g.col != null) col.Add((float)g.col[t * 9 + k]);
                    }
                }
                if (pos.Count == 0) continue;
                holder.meshes.Add(new MeshData
                {
                    name = mat,
                    material = standard[m],
                    positions = pos.ToArray(),
                    normals = nrm.ToArray(),
                    colors = g.col != null ? col.ToArray() : null,
                });
            }
        }
        foreach (var clip in clips)
        {
            var times = clip.times.Select(t => (float)t).ToArray();
            root.animations.Add(new ClipData
            {
                name = clip.name,
                duration = clip.times[clip.times.length - 1],
                tracks = clip.tracks.Select(t => new ClipTrackData
                {
                    name = t.path == "rotation" ? $"{t.node}.quaternion" : $"{t.node}.{(t.path[0] == 's' ? t.path : "position")}",
                    times = times,
                    values = t.values.Select(v => (float)v).ToArray(),
                }).ToList(),
            });
        }
        var data = root.userData;
        if (rig != null) data["rig"] = rig;
        if (emitterList.length > 0) data["emitters"] = emitterList;
        if (water != null) data["fountain"] = water;
        var drives = clipDrives();
        if (drives != null) data["clipDrives"] = drives;
        var lampTable = lamps();
        if (lampTable != null) data["lamps"] = lampTable;
        if (parts.some(p => p.name.StartsWith("interior", StringComparison.Ordinal))) throw new NotSupportedException("interiors are outside the pilot");
        return root;
    }
}
