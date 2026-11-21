// The one hand-written seam of the C# transpiler pilot: what generator/threeBuilder.ts
// is to the JS model. The designs' `MeshBuilder` is the transpiled MeshCore plus
// ToModelNode, which builds the engine-neutral node tree from the triangle soups
// exactly as toGroup builds the THREE.Group: a mesh per material in name order, a
// node per part at its pivot (offset from its parent's), the clips and the userData.
// Named surfaces give a mesh box-projected UVs (surfaceUvs.ts) and a userData table;
// interior parts are built hidden, with the door clips that reveal them (interiorTable.ts).

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
                // exact-size buffers: count this unit's triangles first
                int tris = (int)g.part.length, mine = 0;
                bool all = !(unit.index >= 0 || units.length > 1);
                for (int t = 0; t < tris; t++) if (all || g.part[t] == unit.index) mine++;
                if (mine == 0) continue;
                var pos = new float[mine * 9];
                var nrm = new float[mine * 9];
                var col = g.col != null ? new float[mine * 9] : null;
                double px = unit.pivot[0], py = unit.pivot[1], pz = unit.pivot[2];
                int o = 0;
                for (int t = 0; t < tris; t++)
                {
                    if (!all && g.part[t] != unit.index) continue;
                    for (int k = 0; k < 9; k++)
                    {
                        // the JS model writes Float32Arrays: the same rounding of the same doubles
                        pos[o + k] = (float)(g.pos[t * 9 + k] - (k % 3 == 0 ? px : k % 3 == 1 ? py : pz));
                        nrm[o + k] = (float)g.nrm[t * 9 + k];
                        if (col != null) col[o + k] = (float)g.col[t * 9 + k];
                    }
                    o += 9;
                }
                var spec = palette[mat];
                holder.meshes.Add(new MeshData
                {
                    name = mat,
                    material = standard[m],
                    positions = pos,
                    normals = nrm,
                    colors = col,
                    uvs = spec.surfaceTile is double tile && tile != 0 ? BoxUvs(g.pos, g.part, unit.index, all, new[] { px, py, pz }, tile, mine) : null,
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
        // the materials that draw with a named surface, which the game binds a photo to
        var named = materials.filter(mat => palette[mat].surface != null);
        if (named.length > 0)
        {
            var surfaces = new JsRecord<string>();
            foreach (var mat in named) surfaces[mat] = palette[mat].surface;
            data["surfaces"] = surfaces;
        }
        Interiors(root);
        return root;
    }

    /**
     * surfaceUvs.ts boxUvs: per triangle, u,v from the two model axes its normal points least
     * along, in model coordinates (the position relative to the pivot, the pivot added back,
     * as the JS computes it), divided by the tile, then Float32.
     */
    private static float[] BoxUvs(JsArray<double> gpos, JsArray<double> gpart, double unit, bool all, double[] pivot, double tile, int tris)
    {
        var uv = new float[tris * 3 * 2];
        int o = 0;
        var p = new double[9];
        for (int t = 0; t < (int)gpart.length; t++)
        {
            if (!all && gpart[t] != unit) continue;
            for (int k = 0; k < 9; k++) p[k] = gpos[t * 9 + k] - pivot[k % 3];
            double ux = p[3] - p[0], uy = p[4] - p[1], uz = p[5] - p[2];
            double vx = p[6] - p[0], vy = p[7] - p[1], vz = p[8] - p[2];
            double nx = Math.Abs(uy * vz - uz * vy), ny = Math.Abs(uz * vx - ux * vz), nz = Math.Abs(ux * vy - uy * vx);
            for (int k = 0; k < 3; k++)
            {
                // the JS reads its Float32Array-bound numbers before the conversion: doubles
                double x = p[k * 3] + pivot[0], y = p[k * 3 + 1] + pivot[1], z = p[k * 3 + 2] + pivot[2];
                (double u, double v) = ny >= nx && ny >= nz ? (x, z) : nx >= nz ? (z, y) : (x, y);
                uv[o++] = (float)(u / tile);
                uv[o++] = (float)(v / tile);
            }
        }
        return uv;
    }

    /**
     * interiorTable.ts: each interior part (named `interior` or `interior-...`) hidden, and the
     * door clips of its car that reveal it, sorted, on userData.interiors.
     */
    private void Interiors(ModelNode root)
    {
        var table = new JsRecord<JsArray<string>>();
        foreach (var p in parts)
        {
            if (!JsRt.Test("^interior(-|$)", "", p.name)) continue;
            string car = p.parent >= 0 ? "-" + parts[p.parent].name : "";
            var names = clips.filter(c => c.drive.drive == "door" && c.name == $"doors-{c.drive.side}{car}").map(c => c.name).sort();
            if (names.length == 0) throw new JsError($"{p.name}: no door clip of its car reveals it");
            table[p.name] = names;
        }
        if (table.count == 0) return;
        foreach (var name in table.keys()) Find(root, name)!.visible = false;
        root.userData["interiors"] = table;
    }

    private static ModelNode? Find(ModelNode n, string name)
    {
        if (n.name == name) return n;
        foreach (var c in n.children) if (Find(c, name) is { } f) return f;
        return null;
    }
}
