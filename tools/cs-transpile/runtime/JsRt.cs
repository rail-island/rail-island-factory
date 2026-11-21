// What the transpiled code needs of JavaScript where .NET behaves differently:
// number formatting (Number.prototype.toString, toFixed), Math.round and Math.hypot
// as V8 computes them, truthiness, strict equality, a stable sort, regular
// expressions, and the structural conversion between two shape classes.
// Part of the C# transpiler pilot (docs/specs/2026-11-21-csharp-transpiler-pilot.md).

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace RailIsland.Factory.Runtime;

/** `throw new Error(...)` of the TypeScript. */
public sealed class JsError : Exception
{
    public JsError(string message) : base(message) { }
}

/** The value of a generic `T` that TypeScript instantiated as void (`scope<void>`). */
public readonly struct JsVoid
{
    public static readonly JsVoid I = default;
}

/**
 * A class transpiled from a TypeScript object type (an interface, a type alias, an
 * anonymous shape): its fields by their JS names, so a spread or a structural
 * conversion can copy them without reflection. A null field is an absent key.
 */
public interface IJsObject
{
    /** The key is present: set, and for a field that cannot hold null, not null. */
    bool __has(string key);
    object? __get(string key);
    void __set(string key, object? value);
    IEnumerable<string> __keys();
    IJsObject __copy();
}

public static class JsRt
{
    // --- numbers ---------------------------------------------------------------------

    /** A double used as an array index or length: must be a non-negative integer. */
    public static int Index(double i)
    {
        if (i < 0 || i != Math.Floor(i) || i > int.MaxValue) throw new JsError($"bad index {Str(i)}");
        return (int)i;
    }

    /** Math.round: the nearest integer, a tie towards +infinity; -0 for -0.5 <= x < 0. */
    public static double Round(double x)
    {
        if (double.IsNaN(x) || double.IsInfinity(x)) return x;
        double r = Math.Floor(x);
        if (x - r >= 0.5) r += 1;
        if (r == 0 && (x < 0 || double.IsNegative(x))) return -0.0;
        return r;
    }

    /** Math.hypot as V8 computes it: scaled by the largest, Kahan-summed. */
    public static double Hypot(params double[] xs)
    {
        if (xs.Length == 0) return 0;
        double max = 0;
        bool nan = false;
        var abs = new double[xs.Length];
        for (int i = 0; i < xs.Length; i++)
        {
            double v = Math.Abs(xs[i]);
            abs[i] = v;
            if (double.IsNaN(v)) nan = true;
            else if (v > max) max = v;
        }
        if (double.IsPositiveInfinity(max)) return double.PositiveInfinity;
        if (nan) return double.NaN;
        if (max == 0) return 0;
        double sum = 0, compensation = 0;
        for (int i = 0; i < abs.Length; i++)
        {
            double n = abs[i] / max;
            double summand = n * n - compensation;
            double preliminary = sum + summand;
            compensation = (preliminary - sum) - summand;
            sum = preliminary;
        }
        return Math.Sqrt(sum) * max;
    }

    public static double Min(params double[] xs)
    {
        double m = double.PositiveInfinity;
        foreach (var x in xs) m = Math.Min(m, x);
        return m;
    }

    public static double Max(params double[] xs)
    {
        double m = double.NegativeInfinity;
        foreach (var x in xs) m = Math.Max(m, x);
        return m;
    }

    public static double Sign(double x) => double.IsNaN(x) ? double.NaN : x > 0 ? 1 : x < 0 ? -1 : x;
    public static double Trunc(double x) => Math.Truncate(x);
    public static bool IsFinite(double x) => double.IsFinite(x);
    public static bool IsInteger(double x) => double.IsFinite(x) && Math.Floor(x) == x;

    /** Number(x) / parseFloat of a numeric string. */
    public static double Num(string s) => double.TryParse(s.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var v) ? v : double.NaN;

    /** Number.prototype.toString(): the shortest round-trip digits, laid out by JS's rules. */
    public static string NumStr(double v)
    {
        if (double.IsNaN(v)) return "NaN";
        if (v == 0) return "0";
        if (double.IsPositiveInfinity(v)) return "Infinity";
        if (double.IsNegativeInfinity(v)) return "-Infinity";
        if (v < 0) return "-" + NumStr(-v);
        // .NET Core 3+ "R" gives the shortest round-trip digits; take them and the exponent
        string r = v.ToString("R", CultureInfo.InvariantCulture);
        int e = 0;
        int ePos = r.IndexOfAny(new[] { 'E', 'e' });
        if (ePos >= 0)
        {
            e = int.Parse(r[(ePos + 1)..], CultureInfo.InvariantCulture);
            r = r[..ePos];
        }
        int dot = r.IndexOf('.');
        string digits = dot >= 0 ? r.Remove(dot, 1) : r;
        int intLen = dot >= 0 ? dot : r.Length;
        int lead = 0;
        while (lead < digits.Length - 1 && digits[lead] == '0') { lead++; intLen--; }
        digits = digits[lead..].TrimEnd('0');
        if (digits.Length == 0) return "0";
        int k = digits.Length;
        int n = intLen + e; // the value is 0.digits * 10^n
        var sb = new StringBuilder();
        if (k <= n && n <= 21) sb.Append(digits).Append('0', n - k);
        else if (0 < n && n <= 21) sb.Append(digits, 0, n).Append('.').Append(digits, n, k - n);
        else if (-6 < n && n <= 0) sb.Append("0.").Append('0', -n).Append(digits);
        else
        {
            int exp = n - 1;
            sb.Append(digits[0]);
            if (k > 1) sb.Append('.').Append(digits, 1, k - 1);
            sb.Append('e').Append(exp < 0 ? '-' : '+').Append(Math.Abs(exp));
        }
        return sb.ToString();
    }

    /** x.toString(radix) for an integer (the only use: hex colours). */
    public static string toString(this double v, double radix)
    {
        if (radix == 10) return NumStr(v);
        if (!IsInteger(v)) throw new JsError("toString(radix) of a non-integer is not supported");
        long n = (long)Math.Abs(v);
        int b = (int)radix;
        if (n == 0) return "0";
        var sb = new StringBuilder();
        while (n > 0) { sb.Insert(0, "0123456789abcdefghijklmnopqrstuvwxyz"[(int)(n % b)]); n /= b; }
        return (v < 0 ? "-" : "") + sb;
    }

    public static string toString(this double v) => NumStr(v);

    /** toFixed: the exact value rounded half away from zero, as JS does. */
    public static string toFixed(this double v, double digits = 0)
    {
        if (!double.IsFinite(v) || Math.Abs(v) >= 1e21) return NumStr(v);
        string s = v.ToString("F" + (int)digits, CultureInfo.InvariantCulture);
        // JS writes -0.00 as "0.00"... but "-0.001".toFixed(2) is "-0.00": keep .NET's sign only for v < 0
        if (v == 0) s = s.TrimStart('-');
        return s;
    }

    // --- strings ---------------------------------------------------------------------

    /** ToString of any value, as a template literal or `+` with a string does. */
    public static string Str(object? v) => v switch
    {
        null => "undefined",
        string s => s,
        double d => NumStr(d),
        int i => NumStr(i),
        bool b => b ? "true" : "false",
        System.Collections.IEnumerable e => string.Join(",", e.Cast<object?>().Select(x => x is null ? "" : Str(x))),
        _ => v.ToString() ?? "",
    };

    public static string padStart(this string s, double n, string fill = " ")
    {
        int want = (int)n;
        if (s.Length >= want || fill.Length == 0) return s;
        var sb = new StringBuilder();
        while (sb.Length < want - s.Length) sb.Append(fill);
        return sb.ToString(0, want - s.Length) + s;
    }

    public static string padEnd(this string s, double n, string fill = " ")
    {
        int want = (int)n;
        if (s.Length >= want || fill.Length == 0) return s;
        var sb = new StringBuilder(s);
        while (sb.Length < want) sb.Append(fill);
        return sb.ToString(0, want);
    }

    public static bool startsWith(this string s, string p) => s.StartsWith(p, StringComparison.Ordinal);
    public static bool endsWith(this string s, string p) => s.EndsWith(p, StringComparison.Ordinal);
    public static bool includes(this string s, string p) => s.Contains(p, StringComparison.Ordinal);
    public static string toUpperCase(this string s) => s.ToUpperInvariant();
    public static string toLowerCase(this string s) => s.ToLowerInvariant();
    public static string repeat(this string s, double n) => string.Concat(Enumerable.Repeat(s, (int)n));
    public static JsArray<string> split(this string s, string sep) => new(s.Split(sep));
    public static string slice(this string s, double start, double? end = null)
    {
        int n = s.Length;
        int a = (int)start; if (a < 0) a = Math.Max(0, n + a); a = Math.Min(a, n);
        int b = end is null ? n : (int)end.Value; if (b < 0) b = Math.Max(0, n + b); b = Math.Min(b, n);
        return b > a ? s[a..b] : "";
    }
    public static double length(this string s) => s.Length;

    private static readonly ConcurrentDictionary<string, Regex> Regexes = new();

    /** /pattern/flags.test(s) */
    public static bool Test(string pattern, string flags, string s)
    {
        var re = Regexes.GetOrAdd(flags + "/" + pattern, _ =>
            new Regex(pattern, RegexOptions.ECMAScript | (flags.Contains('i') ? RegexOptions.IgnoreCase : 0)));
        return re.IsMatch(s);
    }

    // --- truthiness and equality -----------------------------------------------------

    public static bool Truthy(bool b) => b;
    public static bool Truthy(double d) => d != 0 && !double.IsNaN(d);
    public static bool Truthy(double? d) => d is double v && Truthy(v);
    public static bool Truthy(bool? b) => b == true;
    public static bool Truthy(string? s) => !string.IsNullOrEmpty(s);
    public static bool Truthy(object? o) => o switch
    {
        null => false,
        bool b => b,
        double d => Truthy(d),
        string s => s.Length > 0,
        _ => true,
    };

    /** `===` between values whose C# types are not both primitive. */
    public static bool Eq(object? a, object? b)
    {
        if (a is null || b is null) return a is null && b is null;
        if (a is double x && b is double y) return x == y;
        if (a is string s && b is string t) return s == t;
        if (a is bool p && b is bool q) return p == q;
        if (a.GetType().IsValueType || b.GetType().IsValueType) return a.Equals(b);
        return ReferenceEquals(a, b);
    }

    /** `a || b` in a value context: a if truthy, else b (evaluated only then). */
    public static T Or<T>(T a, Func<T> b) => Truthy(a) ? a : b();
    /** `a && b` in a value context. */
    public static T And<T>(T a, Func<T> b) => Truthy(a) ? b() : a;

    // --- arrays ----------------------------------------------------------------------

    /** A stable merge sort by a JS comparator (negative, zero or positive; NaN as zero). */
    public static List<T> StableSort<T>(List<T> items, Func<T, T, double> compare)
    {
        var a = items.ToArray();
        var tmp = new T[a.Length];
        for (int width = 1; width < a.Length; width *= 2)
        {
            for (int lo = 0; lo < a.Length; lo += 2 * width)
            {
                int mid = Math.Min(lo + width, a.Length), hi = Math.Min(lo + 2 * width, a.Length);
                int i = lo, j = mid, k = lo;
                while (i < mid && j < hi) tmp[k++] = compare(a[j], a[i]) < 0 ? a[j++] : a[i++];
                while (i < mid) tmp[k++] = a[i++];
                while (j < hi) tmp[k++] = a[j++];
            }
            (a, tmp) = (tmp, a);
        }
        return a.ToList();
    }

    /** `f(...tuple)`: the tuple's first element, and the tuple kept for the following arguments. */
    public static T First<T>(JsArray<T> tuple, out JsArray<T> keep)
    {
        keep = tuple;
        return tuple[0];
    }

    /** Array.from({ length: n }, (_, i) => f(i)). */
    public static JsArray<T> ArrayFrom<T>(double n, Func<double, T> f)
    {
        var o = new JsArray<T>();
        for (int i = 0; i < Index(n); i++) o.add(f(i));
        return o;
    }

    /** new Array<T>(n): n holes (default values until filled). */
    public static JsArray<T> NewArray<T>(double n) => new JsArray<T> { length = n };

    // --- objects ---------------------------------------------------------------------

    /** Builds an object literal: `init` assigns its spreads and fields in source order. */
    public static T Obj<T>(T o, Action<T> init)
    {
        init(o);
        return o;
    }

    /** `{ ...src }` into `target`: every key `src` has, that `target` has a field for. */
    public static void Assign(IJsObject target, object? src)
    {
        if (src is null) return;
        if (src is not IJsObject s) throw new JsError($"cannot spread a {src.GetType().Name} into {target.GetType().Name}");
        foreach (var k in s.__keys().ToList()) target.__set(k, s.__get(k));
    }

    /** The keys of a shape object (Object.keys), declaration order. */
    public static JsArray<string> Keys(IJsObject o) => new(o.__keys());

    /** Object.entries of a shape object. */
    public static JsArray<JsArray<object>> Entries(IJsObject o) => new(o.__keys().Select(k => new JsArray<object>().add(k).add(o.__get(k)!)));

    /**
     * A value as `T`: itself when it already is one; otherwise a structural copy
     * between two shape classes (an anonymous literal passed where an interface
     * is expected), or a numeric conversion.
     */
    public static T As<T>(object? v)
    {
        if (v is T t) return t;
        if (v is null) return default!;
        var target = typeof(T);
        if (v is IJsObject src && typeof(IJsObject).IsAssignableFrom(target))
        {
            var o = (IJsObject)Activator.CreateInstance(target)!;
            Assign(o, src);
            return (T)o;
        }
        if (target == typeof(double) || target == typeof(double?)) return (T)(object)Convert.ToDouble(v, CultureInfo.InvariantCulture);
        if (target.IsGenericType && target.GetGenericTypeDefinition() == typeof(JsArray<>) && v is System.Collections.IEnumerable items)
        {
            var arr = Activator.CreateInstance(target)!;
            var elem = target.GetGenericArguments()[0];
            var asElem = typeof(JsRt).GetMethod(nameof(As))!.MakeGenericMethod(elem);
            var add = target.GetMethod("add")!;
            foreach (var x in items) add.Invoke(arr, new[] { asElem.Invoke(null, new[] { x }) });
            return (T)arr;
        }
        throw new InvalidCastException($"cannot convert {v.GetType().Name} to {target.Name}");
    }

    /** `new (this.constructor)(args)`: another instance of the object's own class. */
    public static T NewLike<T>(T like, params object?[] args) where T : class =>
        (T)Activator.CreateInstance(like.GetType(), args)!;
}
