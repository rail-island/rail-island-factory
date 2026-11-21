// The JavaScript array as the transpiled code uses it: indexed by double, with the
// Array.prototype methods the factory's code calls, under their JS names. Iteration
// is live and by index, as a JS for...of over an array is.
//
// Built for speed, since every point of a model is one (a Vec3 is a JsArray<double>
// of three, a ring corner one of two): up to four elements live inside the object
// itself (a .NET 8 inline array), so a point is one allocation, not an object and a
// buffer; a longer array moves to a T[] that doubles. Array literals are built at
// their exact size (`Of`), map/filter/slice write straight into the result, the
// enumerator is a struct, and the indexer's check is one comparison in the common case.
// Part of the C# transpiler pilot (docs/guide/cs-transpiler.md).

using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.CompilerServices;

namespace RailIsland.Factory.Runtime;

/** Four elements stored inline in the array object. */
[InlineArray(4)]
internal struct Small4<T>
{
    private T e0;
}

/** An array read without knowing its element type (a value TypeScript typed as a union or a type parameter). */
public interface IJsIndexable
{
    object __at(double i);
}

public sealed class JsArray<T> : IEnumerable<T>, IJsIndexable
{
    private const int SmallCapacity = 4;

    /** Null while the elements fit in `small`. */
    private T[]? buf;
    private Small4<T> small;
    private int count;

    public JsArray() { }

    public JsArray(int capacity)
    {
        if (capacity > SmallCapacity) buf = new T[capacity];
    }

    public JsArray(IEnumerable<T> source)
    {
        if (source is JsArray<T> a)
        {
            Reserve(a.count);
            a.Items.CopyTo(Store);
            count = a.count;
            return;
        }
        if (source is ICollection<T> c && c.Count > SmallCapacity)
        {
            buf = new T[c.Count];
            c.CopyTo(buf, 0);
            count = buf.Length;
            return;
        }
        foreach (var x in source) add(x);
    }

    /** Adopts `items` as the buffer, no copy: the caller hands it over. */
    private JsArray(T[] items) { buf = items; count = items.Length; }

    /** The storage, `count` used. */
    private Span<T> Store
    {
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        get => buf ?? (Span<T>)small;
    }

    /** The elements. */
    private Span<T> Items
    {
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        get => Store[..count];
    }

    // array literals at their exact size
    public static JsArray<T> Of() => new();

    public static JsArray<T> Of(T a)
    {
        var o = new JsArray<T> { count = 1 };
        o.small[0] = a;
        return o;
    }

    public static JsArray<T> Of(T a, T b)
    {
        var o = new JsArray<T> { count = 2 };
        o.small[0] = a;
        o.small[1] = b;
        return o;
    }

    public static JsArray<T> Of(T a, T b, T c)
    {
        var o = new JsArray<T> { count = 3 };
        o.small[0] = a;
        o.small[1] = b;
        o.small[2] = c;
        return o;
    }

    public static JsArray<T> Of(T a, T b, T c, T d)
    {
        var o = new JsArray<T> { count = 4 };
        o.small[0] = a;
        o.small[1] = b;
        o.small[2] = c;
        o.small[3] = d;
        return o;
    }

    public static JsArray<T> Of(params T[] items)
    {
        if (items.Length > SmallCapacity) return new JsArray<T>(items);
        var o = new JsArray<T> { count = items.Length };
        items.CopyTo(o.Store);
        return o;
    }

    public int Count => count;

    public double length
    {
        get => count;
        set
        {
            int n = JsRt.Index(value);
            if (n < count) Store[n..count].Clear();
            else Reserve(n);
            count = n;
        }
    }

    public T this[double i]
    {
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        get
        {
            int k = (int)i;
            if ((uint)k >= (uint)count || k != i) return Miss(i);
            return buf != null ? buf[k] : small[k];
        }
        set
        {
            int k = (int)i;
            if ((uint)k >= (uint)count || k != i)
            {
                k = JsRt.Index(i);
                if (k >= count)
                {
                    Reserve(k + 1);
                    count = k + 1;
                }
            }
            if (buf != null) buf[k] = value;
            else small[k] = value;
        }
    }

    /**
     * A read outside the array: JS gives undefined. An array of objects returns null, which
     * is what undefined is here; an array of numbers cannot hold it, so that read throws.
     */
    private T Miss(double i)
    {
        if (!typeof(T).IsValueType) return default!;
        throw new JsError($"array index {JsRt.NumStr(i)} out of range ({count}) of a number array");
    }

    private void Reserve(int n)
    {
        int capacity = buf?.Length ?? SmallCapacity;
        if (n <= capacity) return;
        // 16 first: a growing array (a material's positions) skips the smallest reallocations
        var next = new T[Math.Max(n, Math.Max(16, capacity * 2))];
        Items.CopyTo(next);
        if (buf == null) small = default;
        buf = next;
    }

    public T[] ToArray() => Items.ToArray();

    // --- building (array literals with spreads) -------------------------------------

    public JsArray<T> add(T x)
    {
        Reserve(count + 1);
        Store[count++] = x;
        return this;
    }

    public JsArray<T> addAll(IEnumerable<T> xs)
    {
        if (xs is JsArray<T> a)
        {
            // read the source first: it may be this array
            Reserve(count + a.count);
            a.Items.CopyTo(Store[count..]);
            count += a.count;
            return this;
        }
        foreach (var x in xs) add(x);
        return this;
    }

    // --- mutators --------------------------------------------------------------------

    public double push(T x) { add(x); return count; }

    public double push(T x, T y)
    {
        Reserve(count + 2);
        var s = Store;
        s[count++] = x;
        s[count++] = y;
        return count;
    }

    public double push(T x, T y, T z)
    {
        Reserve(count + 3);
        var s = Store;
        s[count++] = x;
        s[count++] = y;
        s[count++] = z;
        return count;
    }

    public double pushAll(IEnumerable<T> xs)
    {
        addAll(xs);
        return count;
    }

    public T pop()
    {
        if (count == 0) return default!;
        var s = Store;
        var x = s[--count];
        s[count] = default!;
        return x;
    }

    public T shift()
    {
        if (count == 0) return default!;
        var s = Store;
        var x = s[0];
        s[1..count].CopyTo(s);
        s[--count] = default!;
        return x;
    }

    public JsArray<T> reverse()
    {
        Items.Reverse();
        return this;
    }

    public JsArray<T> fill(T x)
    {
        Items.Fill(x);
        return this;
    }

    /** Stable, as Array.prototype.sort is (Array.Sort is not). */
    public JsArray<T> sort(Func<T, T, double> compare)
    {
        if (count < 2) return this;
        var a = ToArray();
        JsRt.StableSort(a, a.Length, compare);
        a.CopyTo(Store);
        return this;
    }

    /** The default sort: by the elements' string forms, UTF-16 code unit order. */
    public JsArray<T> sort() => sort((a, b) => string.CompareOrdinal(JsRt.Str(a), JsRt.Str(b)));

    // --- readers ---------------------------------------------------------------------

    public JsArray<U> map<U>(Func<T, U> f)
    {
        var o = new JsArray<U>(count);
        var src = Items;
        var dst = o.Store;
        for (int i = 0; i < src.Length; i++) dst[i] = f(src[i]);
        o.count = src.Length;
        return o;
    }

    public JsArray<U> map<U>(Func<T, double, U> f)
    {
        var o = new JsArray<U>(count);
        var src = Items;
        var dst = o.Store;
        for (int i = 0; i < src.Length; i++) dst[i] = f(src[i], i);
        o.count = src.Length;
        return o;
    }

    // callbacks that take no argument, or the array as a third: as JS passes (element, index, array)
    public JsArray<U> map<U>(Func<U> f) => map<U>((T _) => f());
    public JsArray<U> map<U>(Func<T, double, JsArray<T>, U> f) => map<U>((T x, double i) => f(x, i, this));
    public JsArray<U> flatMap<U>(Func<T, double, JsArray<T>, JsArray<U>> f) => flatMap<U>((T x, double i) => f(x, i, this));
    public JsArray<T> filter(Func<bool> f) => filter((T _) => f());
    public JsArray<T> filter(Func<T, double, JsArray<T>, bool> f) => filter((T x, double i) => f(x, i, this));
    public void forEach(Action f) => forEach((T _) => f());
    public void forEach(Action<T, double, JsArray<T>> f) => forEach((T x, double i) => f(x, i, this));
    public bool some(Func<T, double, JsArray<T>, bool> f) => some((T x, double i) => f(x, i, this));
    public bool every(Func<T, double, JsArray<T>, bool> f) => every((T x, double i) => f(x, i, this));
    public T find(Func<T, double, bool> f) { for (int i = 0; i < count; i++) if (f(this[i], i)) return this[i]; return default!; }
    public double findIndex(Func<T, double, bool> f) { for (int i = 0; i < count; i++) if (f(this[i], i)) return i; return -1; }
    public U reduce<U>(Func<U, T, double, JsArray<T>, U> f, U init) => reduce<U>((U acc, T x, double i) => f(acc, x, i, this), init);

    /** Whether `i` is an index this array holds a value at (a JS read there is not undefined). */
    public bool holds(double i)
    {
        int k = (int)i;
        return k == i && (uint)k < (uint)count && this[k] is not null;
    }

    public JsArray<U> flatMap<U>(Func<T, JsArray<U>> f)
    {
        var o = new JsArray<U>();
        for (int i = 0; i < count; i++) o.addAll(f(this[i]));
        return o;
    }

    public JsArray<U> flatMap<U>(Func<T, double, JsArray<U>> f)
    {
        var o = new JsArray<U>();
        for (int i = 0; i < count; i++) o.addAll(f(this[i], i));
        return o;
    }

    public JsArray<T> filter(Func<T, bool> f)
    {
        var o = new JsArray<T>(count);
        var dst = o.Store;
        int n = 0;
        foreach (var x in Items) if (f(x)) dst[n++] = x;
        o.count = n;
        return o;
    }

    public JsArray<T> filter(Func<T, double, bool> f)
    {
        var o = new JsArray<T>(count);
        var dst = o.Store;
        var src = Items;
        int n = 0;
        for (int i = 0; i < src.Length; i++) if (f(src[i], i)) dst[n++] = src[i];
        o.count = n;
        return o;
    }

    // callbacks may push into this array (as JS lets them): index access, re-read each step
    public void forEach(Action<T> f) { for (int i = 0; i < count; i++) f(this[i]); }
    public void forEach(Action<T, double> f) { for (int i = 0; i < count; i++) f(this[i], i); }

    public bool some(Func<T, bool> f) { for (int i = 0; i < count; i++) if (f(this[i])) return true; return false; }
    public bool some(Func<T, double, bool> f) { for (int i = 0; i < count; i++) if (f(this[i], i)) return true; return false; }
    public bool every(Func<T, bool> f) { for (int i = 0; i < count; i++) if (!f(this[i])) return false; return true; }
    public bool every(Func<T, double, bool> f) { for (int i = 0; i < count; i++) if (!f(this[i], i)) return false; return true; }

    public T find(Func<T, bool> f) { for (int i = 0; i < count; i++) if (f(this[i])) return this[i]; return default!; }
    public double findIndex(Func<T, bool> f) { for (int i = 0; i < count; i++) if (f(this[i])) return i; return -1; }

    public double indexOf(T x)
    {
        var s = Items;
        if (typeof(T) == typeof(double))
        {
            double v = (double)(object)x!;
            for (int i = 0; i < s.Length; i++) if ((double)(object)s[i]! == v) return i;
            return -1;
        }
        for (int i = 0; i < s.Length; i++) if (JsRt.Eq(s[i], x)) return i;
        return -1;
    }

    public bool includes(T x) => indexOf(x) >= 0;

    public U reduce<U>(Func<U, T, U> f, U init)
    {
        var acc = init;
        for (int i = 0; i < count; i++) acc = f(acc, this[i]);
        return acc;
    }

    public U reduce<U>(Func<U, T, double, U> f, U init)
    {
        var acc = init;
        for (int i = 0; i < count; i++) acc = f(acc, this[i], i);
        return acc;
    }

    /** reduce without an initial value: the first element is the start. */
    public T reduce(Func<T, T, T> f)
    {
        if (count == 0) throw new JsError("Reduce of empty array with no initial value");
        var acc = this[0];
        for (int i = 1; i < count; i++) acc = f(acc, this[i]);
        return acc;
    }

    public string join(string sep = ",")
    {
        var parts = new string[count];
        for (int i = 0; i < count; i++) parts[i] = this[i] is null ? "" : JsRt.Str(this[i]);
        return string.Join(sep, parts);
    }

    public JsArray<T> slice(double start = 0, double? end = null)
    {
        int s = Clamp(start, count);
        int e = end is null ? count : Clamp(end.Value, count);
        int n = Math.Max(0, e - s);
        var o = new JsArray<T>(n);
        Items.Slice(s, n).CopyTo(o.Store);
        o.count = n;
        return o;
    }

    public JsArray<T> concat(JsArray<T> other) => new JsArray<T>(count + other.count).addAll(this).addAll(other);

    public T at(double i)
    {
        int k = (int)Math.Truncate(i);
        if (k < 0) k += count;
        return k >= 0 && k < count ? this[k] : default!;
    }

    public JsArray<T> copy() => slice();

    object IJsIndexable.__at(double i) => at(i)!;

    /** splice(start, deleteCount, ...items): the removed elements; the array changed in place. */
    public JsArray<T> splice(double start, double? deleteCount = null, params T[] items)
    {
        int s = Clamp(start, count);
        int d = deleteCount is null ? count - s : Math.Max(0, Math.Min((int)Math.Truncate(deleteCount.Value), count - s));
        var removed = slice(s, s + d);
        var tail = Items[(s + d)..].ToArray();
        count = s;
        foreach (var x in items) add(x);
        foreach (var x in tail) add(x);
        return removed;
    }

    /** unshift(...items): inserted at the front, in order; the new length. */
    public double unshift(params T[] items)
    {
        var all = ToArray();
        count = 0;
        foreach (var x in items) add(x);
        foreach (var x in all) add(x);
        return count;
    }

    /** entries() of a number array: [index, value] pairs. */
    public JsArray<JsArray<double>> numberEntries()
    {
        var o = new JsArray<JsArray<double>>(count);
        for (int i = 0; i < count; i++) o.add(JsArray<double>.Of(i, (double)(object)this[i]!));
        return o;
    }

    /** entries(): [index, element] pairs, boxed. */
    public JsArray<JsArray<object>> entries()
    {
        var o = new JsArray<JsArray<object>>(count);
        for (int i = 0; i < count; i++) o.add(JsArray<object>.Of((double)i, this[i]!));
        return o;
    }

    /** keys(): the indexes. */
    public JsArray<double> indexes()
    {
        var o = new JsArray<double>(count);
        for (int i = 0; i < count; i++) o.add(i);
        return o;
    }

    private static int Clamp(double v, int n)
    {
        int k = (int)Math.Truncate(v);
        if (k < 0) k = Math.Max(0, n + k);
        return Math.Min(k, n);
    }

    /** Live and by index: an element pushed during the loop is visited, as in JS. No allocation. */
    public struct Enumerator : IEnumerator<T>
    {
        private readonly JsArray<T> a;
        private int i;

        internal Enumerator(JsArray<T> a) { this.a = a; i = -1; }
        public T Current => a[i];
        object IEnumerator.Current => Current!;
        public bool MoveNext() => ++i < a.count;
        public void Reset() => i = -1;
        public void Dispose() { }
    }

    public Enumerator GetEnumerator() => new(this);
    IEnumerator<T> IEnumerable<T>.GetEnumerator() => GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
