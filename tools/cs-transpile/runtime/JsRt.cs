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
    /** The field's TS type admits null: a null in it is a value (JSON writes it), not undefined. */
    bool __null(string key);
    IJsObject __copy();
}

public static class JsRt
{
    /** The default of a `string | null` parameter whose default is worked out in the body: "not passed". */
    public const string UndefinedString = "\u0000undefined\u0000";

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
    public static double Hypot(params double[] xs) => Hypot((ReadOnlySpan<double>)xs);

    // the common arities without a params array (same arithmetic, same results)
    public static double Hypot(double a, double b)
    {
        Span<double> s = stackalloc double[2] { a, b };
        return Hypot((ReadOnlySpan<double>)s);
    }

    public static double Hypot(double a, double b, double c)
    {
        Span<double> s = stackalloc double[3] { a, b, c };
        return Hypot((ReadOnlySpan<double>)s);
    }

    public static double Hypot(ReadOnlySpan<double> xs)
    {
        if (xs.Length == 0) return 0;
        double max = 0;
        bool nan = false;
        for (int i = 0; i < xs.Length; i++)
        {
            double v = Math.Abs(xs[i]);
            if (double.IsNaN(v)) nan = true;
            else if (v > max) max = v;
        }
        if (double.IsPositiveInfinity(max)) return double.PositiveInfinity;
        if (nan) return double.NaN;
        if (max == 0) return 0;
        double sum = 0, compensation = 0;
        for (int i = 0; i < xs.Length; i++)
        {
            double n = Math.Abs(xs[i]) / max;
            double summand = n * n - compensation;
            double preliminary = sum + summand;
            compensation = (preliminary - sum) - summand;
            sum = preliminary;
        }
        return Math.Sqrt(sum) * max;
    }

    // Math.hypot/min/max(...xs): the arguments gathered into one array
    public static double Hypot(JsArray<double> xs) => Hypot(xs.ToArray());
    public static double Min(JsArray<double> xs) => Min(xs.ToArray());
    public static double Max(JsArray<double> xs) => Max(xs.ToArray());

    public static double Min(double a, double b) => Math.Min(a, b);
    public static double Max(double a, double b) => Math.Max(a, b);
    public static double Min(double a, double b, double c) => Math.Min(Math.Min(a, b), c);
    public static double Max(double a, double b, double c) => Math.Max(Math.Max(a, b), c);

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

    /** Number.isFinite of any value: false for anything but a finite number. */
    public static bool IsFiniteNumber(object? x) => x is double d && double.IsFinite(d);
    /** Number.isNaN of any value: true only for the number NaN. */
    public static bool IsNaNNumber(object? x) => x is double d && double.IsNaN(d);

    /** Number(x) of any value, for the cases the factory passes: numbers, strings, booleans. */
    public static double ToNumber(object? x) => x switch
    {
        null => double.NaN,
        double d => d,
        string s => s.Trim().Length == 0 ? 0 : Num(s),
        bool b => b ? 1 : 0,
        _ => double.NaN,
    };

    /** ToInt32: the double modulo 2^32, as a signed 32-bit integer (what JS's bitwise operators read). */
    public static int ToInt32(double x)
    {
        if (!double.IsFinite(x)) return 0;
        double t = Math.Truncate(x) % 4294967296.0;
        if (t < 0) t += 4294967296.0;
        return unchecked((int)(uint)t);
    }

    /** ToUint32: the double modulo 2^32, unsigned (what >>> reads). */
    public static uint ToUint32(double x) => unchecked((uint)ToInt32(x));

    /** Math.imul: the low 32 bits of the product, signed. */
    public static double Imul(double a, double b) => unchecked(ToInt32(a) * ToInt32(b));

    /** parseInt(s, radix): leading whitespace and sign, then as many digits of the radix as there are; NaN for none. */
    public static double ParseInt(string s, double radix = 10)
    {
        s = s.TrimStart();
        int sign = 1, i = 0;
        if (i < s.Length && (s[i] == '+' || s[i] == '-')) { if (s[i] == '-') sign = -1; i++; }
        int r = (int)radix;
        if (r == 0) r = 10;
        if ((r == 16 || radix == 0) && i + 1 < s.Length && s[i] == '0' && (s[i + 1] == 'x' || s[i + 1] == 'X')) { r = 16; i += 2; }
        double v = 0;
        int start = i;
        for (; i < s.Length; i++)
        {
            char c = char.ToLowerInvariant(s[i]);
            int d = c >= '0' && c <= '9' ? c - '0' : c >= 'a' && c <= 'z' ? c - 'a' + 10 : 99;
            if (d >= r) break;
            v = v * r + d;
        }
        return i == start ? double.NaN : sign * v;
    }

    /** Object.is: like ===, but NaN is itself and -0 is not 0. */
    public static bool SameValue(object? a, object? b)
    {
        if (a is double x && b is double y) return double.IsNaN(x) ? double.IsNaN(y) : x == y && double.IsNegative(x) == double.IsNegative(y);
        return Eq(a, b);
    }

    /** for...of over a value whose C# type is not known: an array's elements, a Map's [key, value] pairs. */
    public static System.Collections.IEnumerable Iterate(object? v) => v as System.Collections.IEnumerable ?? throw new JsError($"cannot iterate a {v?.GetType().Name ?? "null"}");

    /** void x: x was evaluated; the value is undefined. */
    public static object? Void(object? _) => null;

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
        Span<char> digits = stackalloc char[66];
        int at = digits.Length;
        while (n > 0) { digits[--at] = "0123456789abcdefghijklmnopqrstuvwxyz"[(int)(n % b)]; n /= b; }
        if (v < 0) digits[--at] = '-';
        return new string(digits[at..]);
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
    /** A merged union's member copies (Narrowed), each pointing back at the object it was made from. */
    private static readonly System.Runtime.CompilerServices.ConditionalWeakTable<object, object> copyOf = new();
    private static readonly System.Runtime.CompilerServices.ConditionalWeakTable<object, object> sourceOf = new();

    /** The member copy of a merged union's object: made once per object and target class. */
    public static T Narrowed<T>(object src, Func<T> make) where T : class
    {
        if (copyOf.TryGetValue(src, out var c) && c is T t) return t;
        var made = make();
        copyOf.AddOrUpdate(src, made);
        sourceOf.AddOrUpdate(made, src);
        return made;
    }

    private static object Source(object o) => sourceOf.TryGetValue(o, out var s) ? s : o;

    public static bool Eq(object? a, object? b)
    {
        if (a is null || b is null) return a is null && b is null;
        if (ReferenceEquals(a, b)) return true;
        if (!a.GetType().IsValueType && !b.GetType().IsValueType && a is not string && b is not string) return ReferenceEquals(Source(a), Source(b));
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

    /** A stable merge sort of the first `n` items, in place, by a JS comparator (NaN as zero). */
    public static void StableSort<T>(T[] items, int n, Func<T, T, double> compare)
    {
        if (n < 2) return;
        var a = items;
        var tmp = new T[n];
        bool inTmp = false;
        for (int width = 1; width < n; width *= 2)
        {
            var src = inTmp ? tmp : a;
            var dst = inTmp ? a : tmp;
            for (int lo = 0; lo < n; lo += 2 * width)
            {
                int mid = Math.Min(lo + width, n), hi = Math.Min(lo + 2 * width, n);
                int i = lo, j = mid, k = lo;
                while (i < mid && j < hi) dst[k++] = compare(src[j], src[i]) < 0 ? src[j++] : src[i++];
                while (i < mid) dst[k++] = src[i++];
                while (j < hi) dst[k++] = src[j++];
            }
            inTmp = !inTmp;
        }
        if (inTmp) Array.Copy(tmp, items, n);
    }

    /** `a[i] ?? f()`: past the end, a hole or null reads as undefined, as in JS. */
    public static T ElemOr<T>(JsArray<T> a, double i, Func<T> f) => a != null && a.holds(i) ? a[i] : f();

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
        // a shape object, a record or a class instance: each key it has
        foreach (var (k, v) in KeyValues(src).ToList()) target.__set(k, v);
    }

    /** The keys of a shape object (Object.keys), declaration order. */
    public static JsArray<string> Keys(IJsObject o) => new(o.__keys());

    /** Object.values of a shape object, declaration order. */
    public static JsArray<object> Values(IJsObject o) => new(o.__keys().Select(k => o.__get(k)!));

    /** Object.assign(target, ...sources) for a shape object: every present key copied in, in order. */
    public static T AssignInto<T>(T target, params object?[] sources) where T : IJsObject
    {
        foreach (var s in sources) Assign(target, s);
        return target;
    }

    /** arr.flat(): one level. */
    public static JsArray<T> Flat<T>(JsArray<JsArray<T>> a)
    {
        var o = new JsArray<T>();
        foreach (var x in a) if (x != null) o.addAll(x);
        return o;
    }

    /** a[i] of an array whose C# type is not known here (a union, a type parameter): undefined outside it. */
    public static object? At(object? a, double i) => a is IJsIndexable x ? x.__at(i) : throw new JsError($"cannot index a {a?.GetType().Name ?? "null"}");

    /** const v = xs[i] that the code tests against undefined: null past the end. */
    public static T? ReadOrNull<T>(JsArray<T> a, double i) where T : struct => a.holds(i) ? a[i] : null;

    /** arr.find over numbers or booleans: the first match, or undefined (null) when none matches. */
    public static T? FindOrNull<T>(JsArray<T> a, Func<T, bool> f) where T : struct
    {
        for (int i = 0; i < (int)a.length; i++) if (f(a[i])) return a[i];
        return null;
    }

    public static T? FindOrNull<T>(JsArray<T> a, Func<T, double, bool> f) where T : struct
    {
        for (int i = 0; i < (int)a.length; i++) if (f(a[i], i)) return a[i];
        return null;
    }

    /** The characters of a string as JS iterates them: by code point. */
    public static JsArray<string> Chars(string s)
    {
        var o = new JsArray<string>();
        for (int i = 0; i < s.Length; i += char.IsSurrogatePair(s, i) ? 2 : 1) o.add(char.ConvertFromUtf32(char.ConvertToUtf32(s, i)));
        return o;
    }

    /** s.replace(/re/flags, replacement): the first match, or all with g; $1 and $& as JS reads them. */
    public static string Replace(string s, string pattern, string flags, string replacement)
    {
        var re = Regexes.GetOrAdd(flags + "/" + pattern, _ => new Regex(pattern, RegexOptions.ECMAScript | (flags.Contains('i') ? RegexOptions.IgnoreCase : 0)));
        string repl = replacement.Replace("$&", "$0");
        return flags.Contains('g') ? re.Replace(s, repl) : re.Replace(s, repl, 1);
    }

    /** s.replace(/re/flags, (match, g1, ...) => ...). */
    public static string Replace(string s, string pattern, string flags, Func<string, string> f) => ReplaceWith(s, pattern, flags, m => f(m.Value));
    public static string Replace(string s, string pattern, string flags, Func<string, string, string> f) => ReplaceWith(s, pattern, flags, m => f(m.Value, m.Groups.Count > 1 ? m.Groups[1].Value : null!));
    public static string Replace(string s, string pattern, string flags, Func<string, string, string, string> f) => ReplaceWith(s, pattern, flags, m => f(m.Value, m.Groups.Count > 1 ? m.Groups[1].Value : null!, m.Groups.Count > 2 ? m.Groups[2].Value : null!));

    private static string ReplaceWith(string s, string pattern, string flags, MatchEvaluator f)
    {
        var re = Regexes.GetOrAdd(flags + "/" + pattern, _ => new Regex(pattern, RegexOptions.ECMAScript | (flags.Contains('i') ? RegexOptions.IgnoreCase : 0)));
        return flags.Contains('g') ? re.Replace(s, f) : re.Replace(s, f, 1);
    }

    /** s.replace("a", "b"): the first occurrence only, as JS does with a string pattern. */
    public static string replace(this string s, string a, string b)
    {
        int i = s.IndexOf(a, StringComparison.Ordinal);
        return i < 0 ? s : s[..i] + b + s[(i + a.Length)..];
    }

    /**
     * localeCompare as JS's default (ICU root) collation orders the ids and names the factory
     * sorts: letters by their base letter first (case and accents aside), lower case before
     * upper on a tie, punctuation and digits before letters. An approximation of full ICU.
     */
    public static double localeCompare(this string a, string b)
    {
        static int Rank(char c) => char.IsLetter(c) ? 2 : char.IsDigit(c) ? 1 : 0;
        static string Fold(string s) => s.ToLowerInvariant();
        string fa = Fold(a), fb = Fold(b);
        for (int i = 0; i < Math.Min(fa.Length, fb.Length); i++)
        {
            int ra = Rank(fa[i]), rb = Rank(fb[i]);
            if (ra != rb) return ra < rb ? -1 : 1;
            if (fa[i] != fb[i]) return fa[i] < fb[i] ? -1 : 1;
        }
        if (fa.Length != fb.Length) return fa.Length < fb.Length ? -1 : 1;
        for (int i = 0; i < a.Length; i++) if (a[i] != b[i]) return char.IsLower(a[i]) ? -1 : 1;
        return 0;
    }

    /** "k" in o where o's C# type is object: a shape's present key, a record's key. */
    public static bool Has(object? o, string key) => o switch
    {
        IJsObject x => x.__has(key),
        null => throw new JsError($"cannot use 'in' on undefined"),
        _ => o.GetType().GetMethod("has") is { } m && (bool)m.Invoke(o, new object[] { key })!,
    };

    /** f.name: the name of the function a delegate holds (a module function's own name). */
    public static string FnName(Delegate f) => f.Method.Name.StartsWith('<') ? "" : f.Method.Name.TrimStart('@');

    /** a.b where a's C# type is object (a union of named types): the field read at run time. */
    public static object? Get(object? o, string key) => o switch
    {
        IJsObject x => x.__get(key),
        null => throw new JsError($"cannot read {key} of undefined"),
        _ => o.GetType().GetField(key)?.GetValue(o) ?? o.GetType().GetProperty(key)?.GetValue(o),
    };

    public static string replaceAll(this string s, string a, string b) => s.Replace(a, b, StringComparison.Ordinal);
    public static string trim(this string s) => s.Trim();
    public static double indexOf(this string s, string a) => s.IndexOf(a, StringComparison.Ordinal);
    public static string charAt(this string s, double i) => i >= 0 && i < s.Length ? s[(int)i].ToString() : "";
    public static string substring(this string s, double a, double? b = null)
    {
        int n = s.Length, x = Math.Clamp((int)a, 0, n), y = b is null ? n : Math.Clamp((int)b.Value, 0, n);
        return x <= y ? s[x..y] : s[y..x];
    }

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
        // a falsy value that is no T (false from `a && b`) read as a reference: undefined, falsy either way
        if (!target.IsValueType && (v is false || (v is double d0 && (d0 == 0 || double.IsNaN(d0))) || (v is string s0 && s0.Length == 0))) return default!;
        if (v is IJsObject src && typeof(IJsObject).IsAssignableFrom(target))
        {
            var o = (IJsObject)Activator.CreateInstance(target)!;
            Assign(o, src);
            return (T)o;
        }
        if (target == typeof(double) || target == typeof(double?)) return (T)(object)Convert.ToDouble(v, CultureInfo.InvariantCulture);
        if (target.IsGenericType && target.GetGenericTypeDefinition() == typeof(JsRecord<>))
        {
            // a shape object or another record read as a record
            var rec = Activator.CreateInstance(target)!;
            var elem = target.GetGenericArguments()[0];
            var asElem = typeof(JsRt).GetMethod(nameof(As))!.MakeGenericMethod(elem);
            var setter = target.GetProperty("Item")!;
            foreach (var (k, x) in KeyValues(v)) setter.SetValue(rec, asElem.Invoke(null, new[] { x }), new object[] { k });
            return (T)rec;
        }
        if (typeof(IJsObject).IsAssignableFrom(target) && target.GetConstructor(Type.EmptyTypes) != null)
        {
            // a record, or a class instance whose fields the shape names, read as a shape
            var o = (IJsObject)Activator.CreateInstance(target)!;
            foreach (var (k, x) in KeyValues(v)) o.__set(k, x);
            return (T)o;
        }
        if (target.IsGenericType && target.GetGenericTypeDefinition() == typeof(JsSet<>) && v is System.Collections.IEnumerable members)
        {
            var set = Activator.CreateInstance(target)!;
            var asT = typeof(JsRt).GetMethod(nameof(As))!.MakeGenericMethod(target.GetGenericArguments()[0]);
            var addM = target.GetMethod("add")!;
            foreach (var x in members) addM.Invoke(set, new[] { asT.Invoke(null, new[] { x }) });
            return (T)set;
        }
        if (target.IsGenericType && target.GetGenericTypeDefinition() == typeof(JsMap<,>) && v is System.Collections.IEnumerable pairs)
        {
            var map = Activator.CreateInstance(target)!;
            var ga = target.GetGenericArguments();
            var asK = typeof(JsRt).GetMethod(nameof(As))!.MakeGenericMethod(ga[0]);
            var asV = typeof(JsRt).GetMethod(nameof(As))!.MakeGenericMethod(ga[1]);
            var set = target.GetMethod("set")!;
            foreach (var e in pairs)
            {
                var pair = (IJsIndexable)e!;
                set.Invoke(map, new[] { asK.Invoke(null, new[] { pair.__at(0) }), asV.Invoke(null, new[] { pair.__at(1) }) });
            }
            return (T)map;
        }
        if (typeof(Delegate).IsAssignableFrom(target) && v is Delegate f) return (T)(object)AdaptDelegate(f, target);
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

    /** The keys and values of a shape object, a record or a class instance (its public fields). */
    private static IEnumerable<(string, object?)> KeyValues(object v)
    {
        if (v is IJsObject o)
        {
            foreach (var k in o.__keys().ToList()) yield return (k, o.__get(k));
            yield break;
        }
        var t = v.GetType();
        if (t.IsGenericType && t.GetGenericTypeDefinition() == typeof(JsRecord<>))
        {
            foreach (var e in (System.Collections.IEnumerable)v)
            {
                var et = e!.GetType();
                yield return ((string)et.GetProperty("Key")!.GetValue(e)!, et.GetProperty("Value")!.GetValue(e));
            }
            yield break;
        }
        foreach (var fi in t.GetFields()) if (!fi.IsStatic) yield return (fi.Name.TrimStart('@'), fi.GetValue(v));
    }

    /**
     * A function value as another delegate type: its parameters converted from the target's and the
     * extra ones dropped (TS lets a function with fewer parameters stand for a wider type), its result
     * converted to the target's. Built with expression trees.
     */
    private static Delegate AdaptDelegate(Delegate f, Type target)
    {
        var invoke = target.GetMethod("Invoke")!;
        var tps = invoke.GetParameters().Select(p => System.Linq.Expressions.Expression.Parameter(p.ParameterType)).ToArray();
        var fps = f.Method.GetParameters();
        var fInvoke = f.GetType().GetMethod("Invoke")!;
        var fParams = fInvoke.GetParameters();
        var asM = typeof(JsRt).GetMethod(nameof(As))!;
        var args = fParams.Select((p, i) => i < tps.Length
            ? (System.Linq.Expressions.Expression)System.Linq.Expressions.Expression.Call(asM.MakeGenericMethod(p.ParameterType), System.Linq.Expressions.Expression.Convert(tps[i], typeof(object)))
            : System.Linq.Expressions.Expression.Default(p.ParameterType)).ToArray();
        System.Linq.Expressions.Expression body = System.Linq.Expressions.Expression.Invoke(System.Linq.Expressions.Expression.Constant(f), args);
        if (invoke.ReturnType == typeof(void)) { }
        else if (fInvoke.ReturnType == typeof(void)) body = System.Linq.Expressions.Expression.Block(body, System.Linq.Expressions.Expression.Default(invoke.ReturnType));
        else body = System.Linq.Expressions.Expression.Call(asM.MakeGenericMethod(invoke.ReturnType), System.Linq.Expressions.Expression.Convert(body, typeof(object)));
        void _(object? __) { }
        _(fps);
        return System.Linq.Expressions.Expression.Lambda(target, body, tps).Compile();
    }

    /** A shape object (a palette written with named keys) as a record. */
    public static JsRecord<V> ShapeToRecord<V>(IJsObject? o)
    {
        if (o == null) return null!;
        var r = new JsRecord<V>();
        foreach (var k in o.__keys().ToList()) r[k] = As<V>(o.__get(k));
        return r;
    }

    /** A record as a shape object: each key the shape has, set through it. */
    public static T RecordToShape<T>(object? rec) where T : IJsObject, new()
    {
        if (rec == null) return default!;
        var o = new T();
        foreach (var (k, x) in KeyValues(rec)) o.__set(k, x);
        return o;
    }

    /** `new (this.constructor)(args)`: another instance of the object's own class. */
    public static T NewLike<T>(T like, params object?[] args) where T : class =>
        (T)Activator.CreateInstance(like.GetType(), args)!;
}
