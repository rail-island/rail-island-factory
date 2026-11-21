// The JavaScript keyed collections the transpiled code uses: a plain object used as
// a record (JsRecord, with JS's key order), Map (JsMap) and Set (JsSet), both in
// insertion order. Part of the C# transpiler pilot.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

namespace RailIsland.Factory.Runtime;

/**
 * A plain object used as a dictionary (`Record<string, T>`). Keys come back in JS's
 * order: integer-like keys ascending first, then the others in insertion order. A
 * missing key reads as default(T); the transpiler makes a record of numbers a
 * record of double?, so a missing key reads as undefined does.
 */
public sealed class JsRecord<T> : IEnumerable<KeyValuePair<string, T>>
{
    private readonly Dictionary<string, T> map = new();
    private readonly List<string> order = new();
    /** Whether an integer-like key was ever stored: only then do keys() need reordering. */
    private bool anyIndexKey;

    public T this[string key]
    {
        get => map.TryGetValue(key, out var v) ? v : default!;
        set
        {
            if (!map.ContainsKey(key))
            {
                order.Add(key);
                if (!anyIndexKey && key.Length > 0 && char.IsAsciiDigit(key[0])) anyIndexKey = IsIndex(key);
            }
            map[key] = value;
        }
    }

    public bool has(string key) => map.ContainsKey(key);

    public bool delete(string key)
    {
        if (!map.Remove(key)) return false;
        order.Remove(key);
        return true;
    }

    public JsArray<string> keys()
    {
        if (!anyIndexKey) return JsArray<string>.Of(order.ToArray());
        var ints = order.Where(IsIndex).OrderBy(k => uint.Parse(k));
        return new JsArray<string>(ints.Concat(order.Where(k => !IsIndex(k))));
    }

    public JsArray<T> values() => keys().map(k => map[k]);

    public JsArray<JsArray<object>> entries() => keys().map(k => JsArray<object>.Of(k, map[k]!));

    /** Object.entries of a record of strings: the pairs as string arrays. */
    public JsArray<JsArray<string>> stringEntries() => keys().map(k => JsArray<string>.Of(k, (string)(object)map[k]!));

    public double count => map.Count;

    public JsRecord<T> set(string key, T value) { this[key] = value; return this; }

    /** `{ ...a, ...b }`: copies every entry of `src` in (later keys win). */
    /** Object.assign(record, ...records). */
    public JsRecord<T> assignAll(JsArray<JsRecord<T>> sources)
    {
        foreach (var r in sources) if (r != null) assign(r);
        return this;
    }

    public JsRecord<T> assign(JsRecord<T> src)
    {
        foreach (var k in src.keys()) this[k] = src[k];
        return this;
    }

    public JsRecord<U> mapValues<U>(Func<T, U> f)
    {
        var o = new JsRecord<U>();
        foreach (var k in keys()) o[k] = f(map[k]);
        return o;
    }

    public JsRecord<T> copy() => new JsRecord<T>().assign(this);

    public static JsRecord<T> fromEntries(IEnumerable<JsArray<object>> entries)
    {
        var o = new JsRecord<T>();
        foreach (var e in entries) o[(string)e[0]] = JsRt.As<T>(e[1]);
        return o;
    }

    private static bool IsIndex(string k) =>
        k.Length > 0 && k.Length <= 10 && k.All(char.IsAsciiDigit) && (k == "0" || k[0] != '0') && ulong.Parse(k) < uint.MaxValue;

    public IEnumerator<KeyValuePair<string, T>> GetEnumerator()
    {
        foreach (var k in keys()) yield return new KeyValuePair<string, T>(k, map[k]);
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

/** A JS Map: insertion-ordered; iterates [key, value] entries. A missing key reads as default(V). */
public sealed class JsMap<K, V> : IEnumerable<JsArray<object>> where K : notnull
{
    private readonly Dictionary<K, V> map = new();
    private readonly List<K> order = new();

    public JsMap() { }

    public JsMap(IEnumerable<JsArray<object>> entries)
    {
        foreach (var e in entries) set(JsRt.As<K>(e[0]), JsRt.As<V>(e[1]));
    }

    public V get(K key) => map.TryGetValue(key, out var v) ? v : default!;
    public bool has(K key) => map.ContainsKey(key);

    public JsMap<K, V> set(K key, V value)
    {
        if (!map.ContainsKey(key)) order.Add(key);
        map[key] = value;
        return this;
    }

    public bool delete(K key)
    {
        if (!map.Remove(key)) return false;
        order.Remove(key);
        return true;
    }

    public double size => map.Count;
    public void clear() { map.Clear(); order.Clear(); }
    public JsArray<K> keys() => new(order);
    public JsArray<V> values() => new(order.Select(k => map[k]));
    public JsArray<JsArray<object>> entries() => new(order.Select(k => new JsArray<object>().add(k).add(map[k]!)));
    public void forEach(Action<V, K> f) { foreach (var k in order.ToList()) f(map[k], k); }

    public IEnumerator<JsArray<object>> GetEnumerator() => entries().GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

/** A JS Set: insertion-ordered. */
public sealed class JsSet<T> : IEnumerable<T> where T : notnull
{
    private readonly HashSet<T> set = new();
    private readonly List<T> order = new();

    public JsSet() { }
    public JsSet(IEnumerable<T> xs) { foreach (var x in xs) add(x); }

    public bool has(T x) => set.Contains(x);

    public JsSet<T> add(T x)
    {
        if (set.Add(x)) order.Add(x);
        return this;
    }

    public bool delete(T x)
    {
        if (!set.Remove(x)) return false;
        order.Remove(x);
        return true;
    }

    public double size => set.Count;
    public void clear() { set.Clear(); order.Clear(); }
    public JsArray<T> values() => new(order);
    public IEnumerator<T> GetEnumerator() => order.ToList().GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

/**
 * A JS WeakMap (a per-builder cache keyed by the MeshCore object): the entries go with
 * their key, so caches kept in module statics do not hold every builder ever made.
 */
public sealed class JsWeakMap<K, V> where K : class
{
    private sealed class Box { public V value = default!; }
    private readonly System.Runtime.CompilerServices.ConditionalWeakTable<K, Box> table = new();

    public V get(K key) => table.TryGetValue(key, out var b) ? b.value : default!;
    public bool has(K key) => table.TryGetValue(key, out _);
    public bool delete(K key) => table.Remove(key);

    public JsWeakMap<K, V> set(K key, V value)
    {
        table.AddOrUpdate(key, new Box { value = value });
        return this;
    }
}
