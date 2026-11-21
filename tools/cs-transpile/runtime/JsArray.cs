// The JavaScript array as the transpiled code uses it: a growable list indexed by
// double, with the Array.prototype methods the factory's code calls, under their JS
// names. Iteration is live and by index, as a JS for...of over an array is.
// Part of the C# transpiler pilot (docs/specs/2026-11-21-csharp-transpiler-pilot.md).

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace RailIsland.Factory.Runtime;

public sealed class JsArray<T> : IEnumerable<T>
{
    public readonly List<T> items;

    public JsArray() { items = new List<T>(); }
    public JsArray(IEnumerable<T> source) { items = new List<T>(source); }

    public double length
    {
        get => items.Count;
        set
        {
            int n = JsRt.Index(value);
            if (n < items.Count) items.RemoveRange(n, items.Count - n);
            while (items.Count < n) items.Add(default!);
        }
    }

    public T this[double i]
    {
        get
        {
            int k = JsRt.Index(i);
            if (k >= items.Count) throw new JsError($"array index {k} out of range ({items.Count})");
            return items[k];
        }
        set
        {
            int k = JsRt.Index(i);
            while (items.Count <= k) items.Add(default!);
            items[k] = value;
        }
    }

    // --- building (array literals and spreads) --------------------------------------

    public JsArray<T> add(T x) { items.Add(x); return this; }
    public JsArray<T> addAll(IEnumerable<T> xs) { items.AddRange(xs); return this; }

    // --- mutators --------------------------------------------------------------------

    public double push(T x) { items.Add(x); return items.Count; }
    public double push(T x, T y) { items.Add(x); items.Add(y); return items.Count; }
    public double push(T x, T y, T z) { items.Add(x); items.Add(y); items.Add(z); return items.Count; }
    public double pushAll(IEnumerable<T> xs) { items.AddRange(xs.ToList()); return items.Count; }

    public T pop()
    {
        if (items.Count == 0) return default!;
        var x = items[^1];
        items.RemoveAt(items.Count - 1);
        return x;
    }

    public T shift()
    {
        if (items.Count == 0) return default!;
        var x = items[0];
        items.RemoveAt(0);
        return x;
    }

    public JsArray<T> reverse() { items.Reverse(); return this; }

    public JsArray<T> fill(T x)
    {
        for (int i = 0; i < items.Count; i++) items[i] = x;
        return this;
    }

    /** Stable, as Array.prototype.sort is (List.Sort is not). */
    public JsArray<T> sort(Func<T, T, double> compare)
    {
        var sorted = JsRt.StableSort(items, compare);
        items.Clear();
        items.AddRange(sorted);
        return this;
    }

    /** The default sort: by the elements' string forms, UTF-16 code unit order. */
    public JsArray<T> sort()
    {
        return sort((a, b) => string.CompareOrdinal(JsRt.Str(a), JsRt.Str(b)));
    }

    // --- readers ---------------------------------------------------------------------

    public JsArray<U> map<U>(Func<T, U> f)
    {
        var o = new List<U>(items.Count);
        for (int i = 0; i < items.Count; i++) o.Add(f(items[i]));
        return new JsArray<U>(o);
    }

    public JsArray<U> map<U>(Func<T, double, U> f)
    {
        var o = new List<U>(items.Count);
        for (int i = 0; i < items.Count; i++) o.Add(f(items[i], i));
        return new JsArray<U>(o);
    }

    public JsArray<U> flatMap<U>(Func<T, JsArray<U>> f)
    {
        var o = new JsArray<U>();
        for (int i = 0; i < items.Count; i++) o.items.AddRange(f(items[i]).items);
        return o;
    }

    public JsArray<U> flatMap<U>(Func<T, double, JsArray<U>> f)
    {
        var o = new JsArray<U>();
        for (int i = 0; i < items.Count; i++) o.items.AddRange(f(items[i], i).items);
        return o;
    }

    public JsArray<T> filter(Func<T, bool> f) => new(items.Where(f));
    public JsArray<T> filter(Func<T, double, bool> f) => new(items.Where((x, i) => f(x, i)));

    public void forEach(Action<T> f) { for (int i = 0; i < items.Count; i++) f(items[i]); }
    public void forEach(Action<T, double> f) { for (int i = 0; i < items.Count; i++) f(items[i], i); }

    public bool some(Func<T, bool> f) { for (int i = 0; i < items.Count; i++) if (f(items[i])) return true; return false; }
    public bool some(Func<T, double, bool> f) { for (int i = 0; i < items.Count; i++) if (f(items[i], i)) return true; return false; }
    public bool every(Func<T, bool> f) { for (int i = 0; i < items.Count; i++) if (!f(items[i])) return false; return true; }
    public bool every(Func<T, double, bool> f) { for (int i = 0; i < items.Count; i++) if (!f(items[i], i)) return false; return true; }

    public T find(Func<T, bool> f) { for (int i = 0; i < items.Count; i++) if (f(items[i])) return items[i]; return default!; }
    public double findIndex(Func<T, bool> f) { for (int i = 0; i < items.Count; i++) if (f(items[i])) return i; return -1; }

    public double indexOf(T x) { for (int i = 0; i < items.Count; i++) if (JsRt.Eq(items[i], x)) return i; return -1; }
    public bool includes(T x) => indexOf(x) >= 0;

    public U reduce<U>(Func<U, T, U> f, U init)
    {
        var acc = init;
        for (int i = 0; i < items.Count; i++) acc = f(acc, items[i]);
        return acc;
    }

    public U reduce<U>(Func<U, T, double, U> f, U init)
    {
        var acc = init;
        for (int i = 0; i < items.Count; i++) acc = f(acc, items[i], i);
        return acc;
    }

    /** reduce without an initial value: the first element is the start. */
    public T reduce(Func<T, T, T> f)
    {
        if (items.Count == 0) throw new JsError("Reduce of empty array with no initial value");
        var acc = items[0];
        for (int i = 1; i < items.Count; i++) acc = f(acc, items[i]);
        return acc;
    }

    public string join(string sep = ",") => string.Join(sep, items.Select(x => x is null ? "" : JsRt.Str(x)));

    public JsArray<T> slice(double start = 0, double? end = null)
    {
        int n = items.Count;
        int s = Clamp(start, n);
        int e = end is null ? n : Clamp(end.Value, n);
        return new JsArray<T>(e > s ? items.GetRange(s, e - s) : new List<T>());
    }

    public JsArray<T> concat(JsArray<T> other) => new JsArray<T>(items).addAll(other.items);

    public T at(double i)
    {
        int k = (int)Math.Truncate(i);
        if (k < 0) k += items.Count;
        return k >= 0 && k < items.Count ? items[k] : default!;
    }

    public JsArray<T> copy() => new(items);

    private static int Clamp(double v, int n)
    {
        int k = (int)Math.Truncate(v);
        if (k < 0) k = Math.Max(0, n + k);
        return Math.Min(k, n);
    }

    // live, index-based: an element pushed during the loop is visited, as in JS
    public IEnumerator<T> GetEnumerator()
    {
        for (int i = 0; i < items.Count; i++) yield return items[i];
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
