// The C# transpiler pilot's console (tools/cs-transpile, copied into export/cs/):
//
//   dotnet run -- dump  <jobs.json> <outDir>   one JSON dump per job (compare.ts reads them)
//   dotnet run -- bench <jobs.json>            ms per build of each job, transpiled C#
//   dotnet run -- jint  <jobs.json> <bundles>  ms per build of each job, the JS bundle in Jint
//
// A job is { "id", "values": { name: value }, "lod": bool, "file": "<dump name>" }.

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using Jint;
using RailIsland.Factory.Generated;
using RailIsland.Factory.Runtime;

namespace RailIsland.Factory;

public sealed class Job
{
    public string id { get; set; } = "";
    public Dictionary<string, string> values { get; set; } = new();
    public bool lod { get; set; }
    public string file { get; set; } = "";
}

public static class Program
{
    public static int Main(string[] args)
    {
        var jobs = JsonSerializer.Deserialize<List<Job>>(File.ReadAllText(args[1]))!;
        switch (args[0])
        {
            case "dump": Dump(jobs, args[2]); return 0;
            case "bench": Console.WriteLine(Bench(jobs, Run)); return 0;
            case "jint": Console.WriteLine(Bench(jobs, JintRunner(args[2]))); return 0;
            default: Console.Error.WriteLine($"unknown command {args[0]}"); return 2;
        }
    }

    private static JsRecord<string> Values(Job j)
    {
        var p = new JsRecord<string>();
        foreach (var (k, v) in j.values) p[k] = v;
        return p;
    }

    private static double Run(Job j)
    {
        var node = DesignTable.ById[j.id](Values(j), j.lod);
        return Triangles(node);
    }

    private static double Triangles(ModelNode n) => n.meshes.Sum(m => m.positions.Length / 9) + n.children.Sum(Triangles);

    private static void Dump(List<Job> jobs, string outDir)
    {
        Directory.CreateDirectory(outDir);
        foreach (var j in jobs)
        {
            var sb = new StringBuilder();
            try
            {
                WriteNode(sb, DesignTable.ById[j.id](Values(j), j.lod));
            }
            catch (Exception e)
            {
                sb.Clear();
                sb.Append("{\"error\":");
                JsJson.WriteString(sb, e.ToString());
                sb.Append('}');
            }
            File.WriteAllText(Path.Combine(outDir, j.file), sb.ToString());
        }
    }

    private static void Floats(StringBuilder sb, float[] xs)
    {
        sb.Append('[');
        for (int i = 0; i < xs.Length; i++)
        {
            if (i > 0) sb.Append(',');
            sb.Append(JsRt.NumStr(xs[i]));
        }
        sb.Append(']');
    }

    private static void WriteNode(StringBuilder sb, ModelNode n)
    {
        sb.Append("{\"name\":");
        JsJson.WriteString(sb, n.name);
        sb.Append(",\"position\":[").Append(string.Join(",", n.position.Select(JsRt.NumStr))).Append("],\"meshes\":[");
        for (int i = 0; i < n.meshes.Count; i++)
        {
            var m = n.meshes[i];
            if (i > 0) sb.Append(',');
            sb.Append("{\"name\":");
            JsJson.WriteString(sb, m.name);
            sb.Append(",\"material\":{\"name\":");
            JsJson.WriteString(sb, m.material.name);
            sb.Append(",\"color\":");
            JsJson.WriteString(sb, m.material.color.ToLowerInvariant());
            sb.Append(",\"metalness\":").Append(JsRt.NumStr(m.material.metalness));
            sb.Append(",\"roughness\":").Append(JsRt.NumStr(m.material.roughness));
            sb.Append(",\"doubleSided\":").Append(m.material.doubleSided ? "true" : "false");
            sb.Append(",\"vertexColors\":").Append(m.material.vertexColors ? "true" : "false");
            sb.Append(",\"glass\":").Append(m.material.glass ? "true" : "false");
            if (m.material.jsMaterial != null) { sb.Append(",\"jsMaterial\":"); JsJson.Write(sb, m.material.jsMaterial); }
            sb.Append("},\"position\":");
            Floats(sb, m.positions);
            sb.Append(",\"normal\":");
            Floats(sb, m.normals);
            if (m.colors != null) { sb.Append(",\"color\":"); Floats(sb, m.colors); }
            sb.Append('}');
        }
        sb.Append("],\"children\":[");
        for (int i = 0; i < n.children.Count; i++)
        {
            if (i > 0) sb.Append(',');
            WriteNode(sb, n.children[i]);
        }
        sb.Append("],\"animations\":[");
        for (int i = 0; i < n.animations.Count; i++)
        {
            var a = n.animations[i];
            if (i > 0) sb.Append(',');
            sb.Append("{\"name\":");
            JsJson.WriteString(sb, a.name);
            sb.Append(",\"duration\":").Append(JsRt.NumStr(a.duration)).Append(",\"tracks\":[");
            for (int k = 0; k < a.tracks.Count; k++)
            {
                var t = a.tracks[k];
                if (k > 0) sb.Append(',');
                sb.Append("{\"name\":");
                JsJson.WriteString(sb, t.name);
                sb.Append(",\"times\":");
                Floats(sb, t.times);
                sb.Append(",\"values\":");
                Floats(sb, t.values);
                sb.Append('}');
            }
            sb.Append("]}");
        }
        sb.Append("],\"userData\":");
        JsJson.Write(sb, n.userData);
        sb.Append('}');
    }

    /** Milliseconds per build of each job: warmed up, then repeated for a fixed time. */
    private static string Bench(List<Job> jobs, Func<Job, double> run)
    {
        var results = new List<object>();
        foreach (var j in jobs)
        {
            // warmed up for 300 ms (the JIT's tiers settle), then the median of five rounds of
            // at least 200 ms each, as compare.ts times Node
            double tris = run(j);
            for (var w = Stopwatch.StartNew(); w.ElapsedMilliseconds < 300;) tris = run(j);
            var rounds = new List<double>();
            int n = 0;
            for (int r = 0; r < 5; r++)
            {
                var round = Stopwatch.StartNew();
                int k = 0;
                while (k < 3 || round.ElapsedMilliseconds < 200) { run(j); k++; }
                rounds.Add(round.Elapsed.TotalMilliseconds / k);
                n += k;
            }
            rounds.Sort();
            long before = GC.GetAllocatedBytesForCurrentThread();
            run(j);
            double allocKb = (GC.GetAllocatedBytesForCurrentThread() - before) / 1024.0;
            results.Add(new { j.file, ms = rounds[2], runs = n, triangles = tris, allocKb });
        }
        return JsonSerializer.Serialize(results);
    }

    private const string ThreeStub = @"
class Obj3 {
  constructor() { this.name = ''; this.children = []; this.userData = {}; this.animations = []; this.visible = true;
    this.position = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }; }
  add(c) { this.children.push(c); }
}
globalThis.__THREE = {
  Group: class extends Obj3 {},
  Mesh: class extends Obj3 { constructor(g, m) { super(); this.geometry = g; this.material = m; } },
  BufferGeometry: class { constructor() { this.attributes = {}; } setAttribute(n, a) { this.attributes[n] = a; } },
  BufferAttribute: class { constructor(array, size) { this.array = array; this.itemSize = size; } },
  MeshStandardMaterial: class { constructor(o) { Object.assign(this, o); this.userData = {}; } },
  DoubleSide: 2,
  AnimationClip: class { constructor(name, duration, tracks) { this.name = name; this.duration = duration; this.tracks = tracks; } },
  QuaternionKeyframeTrack: class { constructor(name, times, values) { this.name = name; this.times = times; this.values = values; } },
  VectorKeyframeTrack: class { constructor(name, times, values) { this.name = name; this.times = times; this.values = values; } },
};
globalThis.__triangles = (g) => {
  let n = 0;
  const walk = (o) => { if (o.geometry) n += o.geometry.attributes.position.array.length / 9; o.children.forEach(walk); };
  walk(g);
  return n;
};
";

    /** Runs a job's JS bundle (the export's standalone model) in Jint with a three.js stub. */
    private static Func<Job, double> JintRunner(string bundleDir)
    {
        var engines = new Dictionary<string, (Jint.Engine engine, Jint.Native.JsValue build)>();
        return j =>
        {
            if (!engines.TryGetValue(j.id, out var e))
            {
                var engine = new Jint.Engine();
                engine.Execute(ThreeStub);
                engine.Modules.Add("model", File.ReadAllText(Path.Combine(bundleDir, j.id + ".js")));
                var ns = engine.Modules.Import("model");
                e = (engine, ns.Get("default"));
                engines[j.id] = e;
            }
            var values = e.engine.Evaluate($"JSON.parse({JsonSerializer.Serialize(JsonSerializer.Serialize(j.values))})");
            var group = e.engine.Invoke(e.build, e.engine.GetValue("__THREE"), values, j.lod);
            return e.engine.Invoke("__triangles", group).AsNumber();
        };
    }
}
