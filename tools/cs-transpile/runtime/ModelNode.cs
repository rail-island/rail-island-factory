// What a transpiled design builds: an engine-neutral node tree, the same data the
// JS model's THREE.Group carries (docs/models/js-format.md) - a node per part,
// positioned at its pivot, a mesh per material in material-name order, non-indexed
// triangle soups with flat normals, the clips and the userData. A Godot adapter
// (not part of the pilot) turns it into Node3D / ArrayMesh, swapping each
// triangle's winding: Godot's front faces are clockwise, three.js's counter-clockwise.

using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;

namespace RailIsland.Factory.Runtime;

public sealed class MaterialData
{
    public string name = "";
    /** sRGB hex, as the palette states it. */
    public string color = "";
    public double metalness;
    public double roughness;
    public bool doubleSided;
    public bool vertexColors;
    /** The see-through options (MaterialSpec.jsMaterial), as the JS model hands them to three.js. */
    public JsRecord<object>? jsMaterial;
    public bool glass;
}

public sealed class MeshData
{
    public string name = "";
    public MaterialData material = new();
    public float[] positions = System.Array.Empty<float>();
    public float[] normals = System.Array.Empty<float>();
    public float[]? colors;
}

public sealed class ClipTrackData
{
    /** "node.quaternion", "node.position" or "node.scale", as three.js binds it. */
    public string name = "";
    public float[] times = System.Array.Empty<float>();
    public float[] values = System.Array.Empty<float>();
}

public sealed class ClipData
{
    public string name = "";
    public double duration;
    public List<ClipTrackData> tracks = new();
}

public sealed class ModelNode
{
    public string name = "";
    public double[] position = { 0, 0, 0 };
    public List<MeshData> meshes = new();
    public List<ModelNode> children = new();
    public List<ClipData> animations = new();
    /** rig, emitters, fountain, clipDrives, lamps: the transpiled values, serialized by JsJson. */
    public SortedDictionary<string, object> userData = new(System.StringComparer.Ordinal);
}

/** JSON.stringify of the transpiled values: shape objects, arrays, records, numbers as JS prints them. */
public static class JsJson
{
    public static string Stringify(object? v)
    {
        var sb = new StringBuilder();
        Write(sb, v);
        return sb.ToString();
    }

    public static void Write(StringBuilder sb, object? v)
    {
        switch (v)
        {
            case null: sb.Append("null"); break;
            case string s: WriteString(sb, s); break;
            case bool b: sb.Append(b ? "true" : "false"); break;
            case double d: sb.Append(double.IsFinite(d) ? JsRt.NumStr(d) : "null"); break;
            case float f: sb.Append(double.IsFinite(f) ? JsRt.NumStr(f) : "null"); break;
            case int i: sb.Append(i.ToString(CultureInfo.InvariantCulture)); break;
            case IJsObject o:
                WriteObject(sb, o.__keys().Select(k => new KeyValuePair<string, object?>(k, o.__get(k))), keepNulls: true);
                break;
            case IDictionary<string, object> dict:
                WriteObject(sb, dict.Select(kv => new KeyValuePair<string, object?>(kv.Key, kv.Value)));
                break;
            case System.Collections.IEnumerable e when IsRecord(e):
                WriteObject(sb, RecordEntries(e));
                break;
            case System.Collections.IEnumerable e:
                sb.Append('[');
                bool first = true;
                foreach (var x in e)
                {
                    if (!first) sb.Append(',');
                    first = false;
                    Write(sb, x);
                }
                sb.Append(']');
                break;
            default: WriteString(sb, v.ToString() ?? ""); break;
        }
    }

    private static bool IsRecord(object e) => e.GetType().IsGenericType && e.GetType().GetGenericTypeDefinition() == typeof(JsRecord<>);

    private static IEnumerable<KeyValuePair<string, object?>> RecordEntries(System.Collections.IEnumerable e)
    {
        foreach (var kv in e)
        {
            var t = kv!.GetType();
            yield return new KeyValuePair<string, object?>((string)t.GetProperty("Key")!.GetValue(kv)!, t.GetProperty("Value")!.GetValue(kv));
        }
    }

    private static void WriteObject(StringBuilder sb, IEnumerable<KeyValuePair<string, object?>> fields, bool keepNulls = false)
    {
        sb.Append('{');
        bool first = true;
        foreach (var (k, val) in fields)
        {
            // JSON.stringify drops undefined; a shape's present null key (IJsObject.__keys) is written
            if (val is null && !keepNulls) continue;
            if (!first) sb.Append(',');
            first = false;
            WriteString(sb, k);
            sb.Append(':');
            Write(sb, val);
        }
        sb.Append('}');
    }

    public static void WriteString(StringBuilder sb, string s)
    {
        sb.Append('"');
        foreach (var c in s)
        {
            switch (c)
            {
                case '"': sb.Append("\\\""); break;
                case '\\': sb.Append("\\\\"); break;
                case '\n': sb.Append("\\n"); break;
                case '\r': sb.Append("\\r"); break;
                case '\t': sb.Append("\\t"); break;
                default:
                    if (c < 0x20) sb.Append("\\u").Append(((int)c).ToString("x4"));
                    else sb.Append(c);
                    break;
            }
        }
        sb.Append('"');
    }
}
