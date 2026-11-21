// The C# transpiler pilot (docs/specs/2026-11-21-csharp-transpiler-pilot.md): turns
// the generator's TypeScript a design's build reaches into C#, using the TypeScript
// checker for every type decision.
//
// - Reachability is per declaration, from the designs' build and LOD functions (and
//   MeshCore, which the hand-written seam extends): a module's other code is left out.
// - Every expression is emitted with its C# type, then converted to the C# mapping of
//   its (narrowed) TypeScript type (`coerce`): double? to double after a narrowing, a
//   tuple element out of a JsArray<object>, one shape class into another.
// - Object types become classes: an interface or type alias by its name, an
//   anonymous shape by its fields (interned), a union of object types merged.
// - A construct outside the supported subset is an error naming file, line and
//   kind; the transpiler reports every one before failing.
// Node-only; run with tsx (main.ts).

import ts from "typescript";
import path from "node:path";

interface Out {
  code: string;
  cs: string;
}

interface DataField {
  js: string;
  cs: string;
  /** The TS type admits null as a value of its own: a field set to null is present, unlike one left out. */
  nullable?: boolean;
}

interface DataClass {
  name: string;
  /** Every field, the base class's included. */
  fields: DataField[];
  origin: string;
  /** The class an interface extends (`interface Variant extends FillCandidate`): the C# base class. */
  base?: string;
}

/** Per C# member: the local names in use (C# forbids a local hiding another in the same member). */
interface MemberContext {
  used: Set<string>;
  temps: number;
  /** Inside a lambda whose delegate returns JsVoid (a generic T TypeScript made void). */
  voidAsUnit: boolean;
  /** The C# type a `return` converts to in the function body being emitted (a lambda's target's), or null. */
  retCs: string | null;
  /** Inside a switch case (not in a loop within it): the label its `break` jumps to. */
  breakLabel: string | null;
  /** The enclosing class's C# name, for `this` types. */
  className: string | null;
}

const VALUE_TYPES = new Set(["double", "bool", "float", "int"]);

const CS_KEYWORDS = new Set(`abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while value var dynamic`.split(" "));

/** Names the runtime owns: a generated type must not take them. */
const RESERVED_TYPES = new Set(["JsArray", "JsRecord", "JsMap", "JsSet", "JsRt", "JsError", "JsVoid", "IJsObject", "JsCtor", "MeshBuilder", "ModelNode", "MeshData", "MaterialData", "ClipData", "ClipTrackData", "JsJson", "Math", "Object", "String", "Action", "Func", "Exception"]);

const MATH: Record<string, string> = {
  floor: "global::System.Math.Floor", ceil: "global::System.Math.Ceiling", abs: "global::System.Math.Abs", sqrt: "global::System.Math.Sqrt",
  sin: "global::System.Math.Sin", cos: "global::System.Math.Cos", tan: "global::System.Math.Tan", atan: "global::System.Math.Atan",
  atan2: "global::System.Math.Atan2", asin: "global::System.Math.Asin", acos: "global::System.Math.Acos", exp: "global::System.Math.Exp",
  log: "global::System.Math.Log", log2: "global::System.Math.Log2", log10: "global::System.Math.Log10", pow: "global::System.Math.Pow", cbrt: "global::System.Math.Cbrt",
  round: "JsRt.Round", hypot: "JsRt.Hypot", min: "JsRt.Min", max: "JsRt.Max", sign: "JsRt.Sign", trunc: "JsRt.Trunc",
};
const MATH_CONST: Record<string, string> = { PI: "global::System.Math.PI", E: "global::System.Math.E", SQRT2: "1.4142135623730951", SQRT1_2: "0.7071067811865476" };

export class TranspileError extends Error {}

export interface TranspileResult {
  /** File name -> C# source. */
  files: Map<string, string>;
  /** Syntax kind -> how many nodes of it the transpiled declarations hold. */
  inventory: Map<string, number>;
  /** The generator files (relative to generator/) declarations were taken from. */
  modules: string[];
  /** How many anonymous shapes became classes, and how many conversions between shape classes were emitted. */
  stats: { declarations: number; dataClasses: number; anonymousShapes: number; mergedUnions: number; conversions: number; lines: number };
}

export interface Entry {
  /** generator/-relative module. */
  source: string;
  /** Exported functions to start from. */
  names: string[];
}

export class Transpiler {
  readonly program: ts.Program;
  readonly checker: ts.TypeChecker;
  private readonly generatorDir: string;
  /** The files the seam replaces: their classes map to the runtime's MeshBuilder. */
  private readonly seamFiles: Set<string>;
  private readonly errors: string[] = [];
  private readonly inventory = new Map<string, number>();

  /** Reached top-level statements, in a deterministic order once sorted. */
  private readonly reached = new Set<ts.Statement>();
  private readonly queue: ts.Statement[] = [];

  private readonly dataClasses = new Map<string, DataClass>();
  private readonly typeNameOf = new Map<ts.Symbol, string>();
  private readonly shapeNames = new Map<string, string>();
  private readonly usedTypeNames = new Set<string>();
  private readonly pendingData: Array<() => void> = [];
  private readonly classNames = new Map<ts.ClassDeclaration, string>();
  private anonymousShapes = 0;
  /** The subclasses generated for object literals standing for a class (duckLiteral). */
  private readonly duckClasses: string[] = [];
  private duckCount = 0;
  /** Anonymous shapes whose fields are being worked out, and the names handed out for them meanwhile. */
  private readonly anonInProgress = new Map<ts.Type, string>();
  private readonly provisionalUsed = new Set<string>();
  /** Instantiated generic aliases by their text ("Partial<ShinkansenSeries>"). */
  private readonly instantiationNames = new Map<string, string>();
  /** The shape-to-shape conversions emitted ("From|To"), each a generated ShapeConvert method. */
  private readonly converters = new Set<string>();
  /** Classes merged from a union of shapes: a narrowing to one member reads the merged object itself. */
  private readonly mergedNames = new Set<string>();
  /**
   * Member names some reached subclass declares: only those are virtual. The rest are
   * plain methods the JIT can inline (tri, quad, cap on every triangle).
   */
  private readonly overridden = new Set<string>();
  private mergedUnions = 0;
  private conversions = 0;

  /**
   * Local names, C# types and scalarized locals, keyed by the declaration (keyOf): the checker
   * can hand out two symbol objects for one declaration (a constructor's parameter).
   */
  private readonly localNames = new Map<ts.Node | ts.Symbol, string>();
  /** Locals whose C# type is wider than their TS type: `const a = x!` where x is a nullable number. */
  private readonly localCs = new Map<ts.Node | ts.Symbol, string>();
  /** Locals replaced by scalars: `const u = [a, b, c]` read only as u[0], u[1], u[2] -> u__0, u__1, u__2. */
  private readonly scalarized = new Map<ts.Node | ts.Symbol, string[]>();
  private ctx: MemberContext = { used: new Set(), temps: 0, voidAsUnit: false, retCs: null, breakLabel: null, className: null };

  constructor(generatorDir: string, tsconfig: string) {
    this.generatorDir = generatorDir;
    const config = ts.readConfigFile(tsconfig, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(tsconfig));
    const roots = parsed.fileNames.filter((f) => f.startsWith(generatorDir));
    this.program = ts.createProgram(roots, { ...parsed.options, noEmit: true });
    this.checker = this.program.getTypeChecker();
    this.seamFiles = new Set(["meshBuilder.ts", "threeBuilder.ts"].map((f) => path.join(generatorDir, f)));
  }

  // --- reachability --------------------------------------------------------------------

  private sourceFile(rel: string): ts.SourceFile {
    const sf = this.program.getSourceFile(path.join(this.generatorDir, rel));
    if (!sf) throw new TranspileError(`no source file ${rel}`);
    return sf;
  }

  private topLevel(node: ts.Node): ts.Statement | null {
    let n: ts.Node = node;
    while (n.parent && !ts.isSourceFile(n.parent)) n = n.parent;
    return n.parent && ts.isSourceFile(n.parent) ? (n as ts.Statement) : null;
  }

  private inGenerator(node: ts.Node): boolean {
    const f = node.getSourceFile().fileName;
    return f.startsWith(this.generatorDir) && !this.seamFiles.has(f);
  }

  private enqueue(stmt: ts.Statement): void {
    if (this.reached.has(stmt)) return;
    // types are emitted on demand, as the type mapping meets them
    if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt) || ts.isImportDeclaration(stmt) || ts.isExportDeclaration(stmt)) return;
    this.reached.add(stmt);
    this.queue.push(stmt);
  }

  private resolve(sym: ts.Symbol | undefined): ts.Symbol | undefined {
    if (sym && sym.flags & ts.SymbolFlags.Alias) return this.checker.getAliasedSymbol(sym);
    return sym;
  }

  /** The symbol an identifier refers to; for `{ x }` shorthand, the variable x, not the property. */
  private symbolOf(id: ts.Identifier): ts.Symbol | undefined {
    if (ts.isShorthandPropertyAssignment(id.parent) && id.parent.name === id) return this.checker.getShorthandAssignmentValueSymbol(id.parent);
    return this.checker.getSymbolAtLocation(id);
  }

  private walkReach(node: ts.Node): void {
    if (ts.isIdentifier(node)) {
      const sym = this.resolve(this.symbolOf(node));
      for (const d of sym?.declarations ?? []) {
        if (!this.inGenerator(d)) continue;
        const top = this.topLevel(d);
        if (top) this.enqueue(top);
      }
    }
    ts.forEachChild(node, (c) => this.walkReach(c));
  }

  /** The C# method an exported entry function is: its declaring module's class and its own name. */
  entryTarget(source: string, name: string): { moduleClass: string; name: string } {
    const sf = this.sourceFile(source);
    const sym = this.checker.getSymbolAtLocation(sf);
    const exp = sym && this.checker.getExportsOfModule(sym).find((s) => s.name === name);
    const decl = this.resolve(exp)?.declarations?.[0];
    if (!decl) throw new TranspileError(`${source}: no export ${name}`);
    const own = (decl as ts.NamedDeclaration).name;
    return { moduleClass: this.moduleClass(decl.getSourceFile().fileName), name: Transpiler.escape(own && ts.isIdentifier(own) ? own.text : name) };
  }

  /** The top-level statements one design reaches, fresh (for the survey's per-design count). */
  reachFrom(entries: Entry[], extraClasses: Array<{ source: string; name: string }>): ts.Statement[] {
    this.reached.clear();
    this.queue.length = 0;
    return this.reach(entries, extraClasses);
  }

  /** A statement's file (relative to generator/) and its first and last line, 1-based. */
  span(s: ts.Statement): { file: string; from: number; to: number } {
    const sf = s.getSourceFile();
    return {
      file: path.relative(this.generatorDir, sf.fileName),
      from: sf.getLineAndCharacterOfPosition(s.getStart()).line + 1,
      to: sf.getLineAndCharacterOfPosition(s.getEnd()).line + 1,
    };
  }

  /** Every top-level statement the entries reach, in file and position order. */
  reach(entries: Entry[], extraClasses: Array<{ source: string; name: string }>): ts.Statement[] {
    const find = (source: string, name: string): ts.Statement => {
      const sf = this.sourceFile(source);
      const sym = this.checker.getSymbolAtLocation(sf);
      const exp = sym && this.checker.getExportsOfModule(sym).find((s) => s.name === name);
      const decl = this.resolve(exp)?.declarations?.[0];
      const top = decl && this.topLevel(decl);
      if (!top) throw new TranspileError(`${source}: no export ${name}`);
      return top;
    };
    for (const c of extraClasses) this.enqueue(find(c.source, c.name));
    for (const e of entries) for (const n of e.names) this.enqueue(find(e.source, n));
    while (this.queue.length) this.walkReach(this.queue.shift()!);
    const files = this.program.getSourceFiles();
    const fileIndex = new Map(files.map((f, i) => [f.fileName, i]));
    return [...this.reached].sort((a, b) => {
      const fa = a.getSourceFile().fileName, fb = b.getSourceFile().fileName;
      return fa === fb ? a.pos - b.pos : fa < fb ? -1 : 1;
    }).filter((s) => fileIndex.has(s.getSourceFile().fileName));
  }

  // --- errors and inventory ------------------------------------------------------------

  private where(node: ts.Node): string {
    const sf = node.getSourceFile();
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart());
    return `${path.relative(this.generatorDir, sf.fileName)}:${line + 1}:${character + 1}`;
  }

  private fail(node: ts.Node, what: string): Out {
    this.errors.push(`${this.where(node)}: unsupported ${what} (${ts.SyntaxKind[node.kind]}): ${node.getText().slice(0, 100).replace(/\s+/g, " ")}`);
    return { code: "default!", cs: "object" };
  }

  private count(node: ts.Node): void {
    const k = ts.SyntaxKind[node.kind]!;
    this.inventory.set(k, (this.inventory.get(k) ?? 0) + 1);
    ts.forEachChild(node, (c) => this.count(c));
  }

  // --- names ---------------------------------------------------------------------------

  /**
   * A JS name as a C# identifier: a keyword gets `@`; a key that is no identifier at all
   * (`"bridge-timber"`, a quoted key of a table) becomes one, with a hash of the key so two
   * keys never meet on one name.
   */
  static escape(name: string): string {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return CS_KEYWORDS.has(name) ? `@${name}` : name;
    let h = 0x811c9dc5;
    for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 0x01000193) >>> 0;
    return `${/^[0-9]/.test(name) ? "_" : ""}${name.replace(/[^A-Za-z0-9_]/g, "_")}__${h.toString(16).slice(0, 6)}`;
  }

  /** A shape field's backing field. */
  static backing(js: string): string {
    return `_${Transpiler.escape(js).replace(/^@/, "")}`;
  }

  private moduleClass(file: string): string {
    const rel = path.relative(this.generatorDir, file).replace(/\.ts$/, "");
    return `Mod_${rel.replace(/[^A-Za-z0-9]/g, "_")}`;
  }

  private uniqueTypeName(base: string): string {
    let name = base.replace(/[^A-Za-z0-9_]/g, "_");
    if (RESERVED_TYPES.has(name)) name = `${name}_`;
    let n = name;
    for (let i = 2; this.usedTypeNames.has(n); i++) n = `${name}_${i}`;
    this.usedTypeNames.add(n);
    return n;
  }

  private className(decl: ts.ClassDeclaration): string {
    if (this.seamFiles.has(decl.getSourceFile().fileName)) return "MeshBuilder";
    let n = this.classNames.get(decl);
    if (!n) {
      n = this.uniqueTypeName(decl.name?.text ?? "Anon");
      this.classNames.set(decl, n);
    }
    return n;
  }

  /** What the local maps key on: the symbol's declaration, else the symbol. */
  private keyOf(sym: ts.Symbol): ts.Node | ts.Symbol {
    return sym.valueDeclaration ?? sym.declarations?.[0] ?? sym;
  }

  /** The C# name of a local (variable, parameter, local function): unique within the member. */
  private localName(sym: ts.Symbol, js: string): string {
    let n = this.localNames.get(this.keyOf(sym));
    if (n) return n;
    const base = Transpiler.escape(js);
    n = base;
    for (let i = 2; this.ctx.used.has(n); i++) n = `${js}_${i}`;
    this.ctx.used.add(n);
    this.localNames.set(this.keyOf(sym), n);
    return n;
  }

  private declName(id: ts.Identifier): string {
    const sym = this.checker.getSymbolAtLocation(id);
    if (!sym) throw new TranspileError(`${this.where(id)}: no symbol`);
    return this.localName(sym, id.text);
  }

  private temp(): string {
    return `__t${++this.ctx.temps}`;
  }

  private member<R>(className: string | null, fn: () => R): R {
    const saved = this.ctx;
    this.ctx = { used: new Set(), temps: 0, voidAsUnit: false, retCs: null, breakLabel: null, className };
    try {
      return fn();
    } finally {
      this.ctx = saved;
    }
  }

  // --- types ---------------------------------------------------------------------------

  private isVoidLike(t: ts.Type): boolean {
    return !!(t.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Null));
  }

  /** The C# type of a TypeScript type. `element`: as a record's or a map's value (value types nullable). */
  cs(t: ts.Type, node?: ts.Node): string {
    const f = t.flags;
    if (f & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Never)) return "object";
    if (f & ts.TypeFlags.Void) return "void";
    if (f & ts.TypeFlags.NonPrimitive) return "object"; // the `object` type
    if (f & (ts.TypeFlags.Undefined | ts.TypeFlags.Null)) return "object";
    if (f & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) return "bool";
    if (f & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)) return "double";
    if (f & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral | ts.TypeFlags.TemplateLiteral)) return "string";
    if (t.isUnion()) {
      const parts = t.types.filter((x) => !this.isVoidLike(x));
      const optional = parts.length !== t.types.length;
      // void | undefined (what an optional call f?.() of a void function returns): void
      if (!parts.length) return t.types.some((x) => x.flags & ts.TypeFlags.Void) ? "void" : "object";
      const base = this.unionCs(parts, t, node);
      return optional && VALUE_TYPES.has(base) ? `${base}?` : base;
    }
    if (f & ts.TypeFlags.TypeParameter) {
      // <T extends { s: number }>: shape classes are not related in C#, so T is its constraint
      const shapeBound = this.shapeConstraint(t);
      if (shapeBound) return shapeBound;
      if ((t as { isThisType?: boolean }).isThisType) {
        const c = t.getConstraint() ?? this.checker.getBaseConstraintOfType(t);
        return c ? this.cs(c, node) : this.ctx.className ?? "object";
      }
      return t.symbol.name;
    }
    if (f & ts.TypeFlags.Object) return this.objectCs(t as ts.ObjectType, node);
    if (f & ts.TypeFlags.Intersection) {
      const it = t as ts.IntersectionType;
      // a branded or widened intersection: its object part
      const objs = it.types.filter((x) => x.flags & ts.TypeFlags.Object);
      if (objs.length === 1) return this.cs(objs[0]!, node);
      // one member indexes by string (Object.assign({}, record, ...)): a record
      const indexed = objs.map((x) => this.checker.getIndexInfosOfType(x)[0]).find((x) => x);
      if (indexed) return `JsRecord<${this.elementCs(indexed.type, node)}>`;
      if (objs.length === it.types.length) return this.dataClass(t as unknown as ts.ObjectType, node);
    }
    throw new TranspileError(`unsupported type ${this.checker.typeToString(t)}${node ? ` at ${this.where(node)}` : ""}`);
  }

  private kindOf(t: ts.Type): "number" | "string" | "bool" | "object" | "param" | "other" {
    const f = t.flags;
    if (f & (ts.TypeFlags.Number | ts.TypeFlags.NumberLiteral)) return "number";
    if (f & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral | ts.TypeFlags.TemplateLiteral)) return "string";
    if (f & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) return "bool";
    if (f & ts.TypeFlags.Object) return "object";
    if (f & ts.TypeFlags.TypeParameter) return "param";
    return "other";
  }

  private unionCs(parts: ts.Type[], whole: ts.Type, node?: ts.Node): string {
    const kinds = new Set(parts.map((p) => this.kindOf(p)));
    if (kinds.size === 1) {
      const k = [...kinds][0]!;
      if (k === "number") return "double";
      if (k === "string") return "string";
      if (k === "bool") return "bool";
      if (k === "param" && parts.length === 1) return this.cs(parts[0]!, node);
      if (k === "object") {
        const each = parts.map((p) => this.cs(p, node));
        if (new Set(each).size === 1) return each[0]!;
        if (each.every((c) => c.startsWith("JsArray<"))) {
          const elems = new Set(each.map((c) => c.slice(8, -1)));
          return elems.size === 1 ? each[0]! : "JsArray<object>";
        }
        if (parts.every((p) => this.isDataType(p))) {
          // a union of separately named types holds existing objects (a Set of parts and windows):
          // a merged class would copy them and lose their identity, so it stays an object
          const named = parts.filter((p) => p.aliasSymbol || (p.symbol && p.symbol.flags & ts.SymbolFlags.Interface));
          if (named.length > 1) return "object";
          return this.mergedClass(parts, whole);
        }
      }
    }
    return "object";
  }

  private isDataType(t: ts.Type): boolean {
    if (!(t.flags & ts.TypeFlags.Object)) return false;
    const o = t as ts.ObjectType;
    if (this.checker.isArrayType(o) || this.checker.isTupleType(o)) return false;
    if (o.getCallSignatures().length) return false;
    if (o.symbol && o.symbol.flags & ts.SymbolFlags.Class) return false;
    if (this.checker.getIndexInfosOfType(o).length) return false;
    return true;
  }

  private typeArgs(t: ts.Type): readonly ts.Type[] {
    return this.checker.getTypeArguments(t as ts.TypeReference);
  }

  private elementCs(t: ts.Type, node?: ts.Node): string {
    const c = this.cs(t, node);
    return VALUE_TYPES.has(c) ? `${c}?` : c;
  }

  /** A type argument as C# accepts it: void becomes JsVoid. */
  typeArgCs(t: ts.Type, node?: ts.Node): string {
    const c = this.cs(t, node);
    return c === "void" ? "JsVoid" : c;
  }

  private objectCs(t: ts.ObjectType, node?: ts.Node): string {
    if (this.checker.isTupleType(t)) {
      const elems = this.typeArgs(t).map((e) => this.cs(e, node));
      const set = new Set(elems);
      return `JsArray<${set.size === 1 ? elems[0] : "object"}>`;
    }
    if (this.checker.isArrayType(t)) return `JsArray<${this.typeArgCs(this.typeArgs(t)[0]!, node)}>`;
    const sym = t.symbol ?? t.aliasSymbol;
    const lib = sym?.declarations?.some((d) => d.getSourceFile().hasNoDefaultLib || /node_modules[\\/](typescript|@types)/.test(d.getSourceFile().fileName));
    if (sym && lib) {
      const args = this.typeArgs(t);
      switch (sym.name) {
        case "Map": case "ReadonlyMap": return `JsMap<${this.cs(args[0]!, node)}, ${this.elementCs(args[1]!, node)}>`;
        case "Set": case "ReadonlySet": return `JsSet<${this.cs(args[0]!, node)}>`;
        case "IterableIterator": case "Iterable": case "MapIterator": case "SetIterator": case "ArrayIterator": case "IteratorObject": case "Generator":
          return `JsArray<${this.typeArgCs(args[0]!, node)}>`;
        case "ReadonlyArray": case "Array": case "ArrayLike": return `JsArray<${this.typeArgCs(args[0]!, node)}>`;
        // a numeric buffer: a number array (Float64Array stores doubles as they are)
        case "Float64Array": return "JsArray<double>";
        case "WeakMap": return `JsWeakMap<${this.cs(args[0]!, node)}, ${this.elementCs(args[1]!, node)}>`;
        case "RegExp": return "global::System.Text.RegularExpressions.Regex";
        case "Error": return "JsError";
        default: break;
      }
    }
    const calls = t.getCallSignatures();
    if (calls.length && !t.getProperties().length) return this.funcCs(calls[0]!, node);
    if (t.symbol && t.symbol.flags & ts.SymbolFlags.Class) {
      const decl = t.symbol.declarations?.find(ts.isClassDeclaration);
      if (decl) return this.className(decl);
    }
    const index = this.checker.getIndexInfosOfType(t);
    const props = t.getProperties();
    // a type made of one class's members (Pick<MeshBuilder, "quad" | "tri">) is that class: its values are its instances
    if (props.length && !index.length) {
      const owners = props.map((p) => p.declarations?.[0]?.parent).filter((o): o is ts.ClassDeclaration => !!o && ts.isClassDeclaration(o));
      if (owners.length === props.length) {
        const seam = owners.find((o) => this.seamFiles.has(o.getSourceFile().fileName));
        return seam ? "MeshBuilder" : this.className(owners[0]!);
      }
    }
    if (props.length && !index.length && props.every((p) => this.checker.getTypeOfSymbol(p).getCallSignatures().length) && props.every((p) => this.meshCoreMembers().has(p.name))) return "MeshBuilder";
    if (index.length && !props.length) return `JsRecord<${this.elementCs(index[0]!.type, node)}>`;
    // a Record over a finite key union (Record<LampRole, ...>): a record, not a shape
    const isRecordAlias = (x: ts.Type | undefined): boolean => !!x && (x.aliasSymbol?.name === "Record" || ((x.aliasSymbol?.name === "Readonly" || x.aliasSymbol?.name === "Partial") && isRecordAlias(x.aliasTypeArguments?.[0])));
    if (props.length && ((t as ts.ObjectType).objectFlags & ts.ObjectFlags.Mapped) && isRecordAlias(t)) {
      const each = new Set(props.map((p) => this.cs(this.checker.getTypeOfSymbol(p), node)));
      if (each.size === 1) return `JsRecord<${this.elementCs(this.checker.getTypeOfSymbol(props[0]!), node)}>`;
    }
    if (index.length) throw new TranspileError(`unsupported type with both an index signature and fields: ${this.checker.typeToString(t)}${node ? ` at ${this.where(node)}` : ""}`);
    return this.dataClass(t, node);
  }

  private funcCs(sig: ts.Signature, node?: ts.Node): string {
    const params = sig.getParameters().map((p) => {
      const decl = p.valueDeclaration;
      if (decl && ts.isParameter(decl) && decl.dotDotDotToken) throw new TranspileError(`rest parameter in a function type${node ? ` at ${this.where(node)}` : ""}`);
      const c = this.typeArgCs(this.checker.getTypeOfSymbol(p), node);
      // an optional parameter may be left out: the delegate passes null for it, and the function takes its default
      return decl && ts.isParameter(decl) && (decl.questionToken || decl.initializer) && VALUE_TYPES.has(c) ? `${c}?` : c;
    });
    const ret = this.cs(sig.getReturnType(), node);
    if (ret === "void") return params.length ? `global::System.Action<${params.join(", ")}>` : "global::System.Action";
    return `global::System.Func<${[...params, ret].join(", ")}>`;
  }

  private fieldsOf(t: ts.Type, node?: ts.Node): DataField[] {
    return t.getProperties().map((p) => {
      const pt = this.checker.getTypeOfSymbol(p);
      // a shape class is not generic: a field of a type parameter, or of a generic function, holds it as object
      let c = this.withoutTypeParams(pt, this.cs(pt, node));
      if (c === "void") c = "object";
      // an optional field of a value type may be absent
      if (p.flags & ts.SymbolFlags.Optional && VALUE_TYPES.has(c)) c = `${c}?`;
      const nullable = pt.isUnion() && pt.types.some((x) => x.flags & ts.TypeFlags.Null);
      return { js: p.name, cs: c, ...(nullable ? { nullable } : {}) };
    });
  }

  private dataClass(t: ts.ObjectType, node?: ts.Node): string {
    const named = t.aliasSymbol ?? (t.symbol && t.symbol.flags & ts.SymbolFlags.Interface ? t.symbol : undefined);
    if (named && !t.aliasTypeArguments?.length) {
      const known = this.typeNameOf.get(named);
      if (known) return known;
      const name = this.uniqueTypeName(named.name);
      this.typeNameOf.set(named, name);
      const fields = this.fieldsOf(t, node);
      const base = this.interfaceBase(named, fields, node);
      this.dataClasses.set(name, { name, fields, origin: this.originOf(named), ...(base ? { base } : {}) });
      // an anonymous shape with exactly these fields is this class ({ ...spec } of a MaterialSpec)
      const key = this.shapeKey(fields);
      if (!this.shapeNames.has(key)) this.shapeNames.set(key, name);
      return name;
    }
    // an instantiated generic alias (Partial<ShinkansenSeries>): one class per instantiation, named
    // before its fields are worked out - its fields may lead back to it, through fresh type objects
    if (named && t.aliasTypeArguments?.length) {
      const text = this.checker.typeToString(t);
      const known = this.instantiationNames.get(text);
      if (known) return known;
      const name = this.uniqueTypeName(`${named.name}_${t.aliasTypeArguments.map((a) => this.checker.typeToString(a)).join("_")}`);
      this.instantiationNames.set(text, name);
      this.dataClasses.set(name, { name, fields: this.fieldsOf(t, node), origin: this.originOf(named) });
      return name;
    }
    // an anonymous shape: one class per distinct field list. A shape whose fields lead back to
    // itself (a series with its trailer section's spread) is named before its fields are worked out.
    const pending = this.anonInProgress.get(t);
    if (pending) {
      this.provisionalUsed.add(pending);
      return pending;
    }
    const props = t.getProperties().map((p) => p.name);
    const provisional = this.uniqueTypeName(`Shape_${props.slice(0, 4).join("_") || "empty"}`);
    this.anonInProgress.set(t, provisional);
    let fields: DataField[];
    try {
      fields = this.fieldsOf(t, node);
    } finally {
      this.anonInProgress.delete(t);
    }
    const key = this.shapeKey(fields);
    const known = this.shapeNames.get(key);
    const referenced = this.provisionalUsed.has(provisional);
    if (known && !referenced) {
      this.usedTypeNames.delete(provisional);
      return known;
    }
    if (!known) this.shapeNames.set(key, provisional);
    this.anonymousShapes++;
    this.dataClasses.set(provisional, { name: provisional, fields, origin: node ? this.where(node) : "inferred" });
    return provisional;
  }

  /** `c` with the type parameters of `t` (or of its generic call signature) replaced by object. */
  private withoutTypeParams(t: ts.Type, c: string): string {
    const names = new Set<string>();
    const collect = (x: ts.Type): void => {
      if (x.flags & ts.TypeFlags.TypeParameter && !(x as { isThisType?: boolean }).isThisType) names.add(x.symbol.name);
      if (x.isUnion() || x.isIntersection()) x.types.forEach(collect);
    };
    collect(t);
    for (const sig of t.getCallSignatures()) for (const tp of sig.getTypeParameters() ?? []) names.add(tp.symbol.name);
    for (const n of names) c = c.replace(new RegExp(`(?<![\\w.])${n}(?![\\w])`, "g"), "object");
    return c;
  }

  private meshCoreNames: Set<string> | null = null;

  /** The member names of MeshCore: a shape type made of its methods ({ tri(...) }) stands for a builder. */
  private meshCoreMembers(): Set<string> {
    if (!this.meshCoreNames) {
      const sf = this.program.getSourceFile(path.join(this.generatorDir, "meshCore.ts"));
      const cls = sf?.statements.find((st): st is ts.ClassDeclaration => ts.isClassDeclaration(st) && st.name?.text === "MeshCore");
      this.meshCoreNames = new Set((cls?.members ?? []).map((m) => m.name?.getText() ?? "").filter(Boolean));
    }
    return this.meshCoreNames;
  }

  /**
   * The C# base class of an interface extending exactly one other (`Variant extends FillCandidate`),
   * when every field of the base keeps its C# type: a Variant passed as a FillCandidate is then the
   * same object, and reads back as a Variant. Null for anything else.
   */
  private interfaceBase(sym: ts.Symbol, fields: DataField[], node?: ts.Node): string | undefined {
    const decl = sym.declarations?.find(ts.isInterfaceDeclaration);
    const ext = decl?.heritageClauses?.filter((h) => h.token === ts.SyntaxKind.ExtendsKeyword).flatMap((h) => [...h.types]) ?? [];
    if (ext.length !== 1) return undefined;
    let base: string;
    try {
      base = this.cs(this.checker.getTypeAtLocation(ext[0]!), node);
    } catch {
      return undefined;
    }
    const b = this.dataClasses.get(base);
    if (!b) return undefined;
    const mine = new Map(fields.map((f) => [f.js, f]));
    return b.fields.every((f) => mine.get(f.js)?.cs === f.cs && !!mine.get(f.js)?.nullable === !!f.nullable) ? base : undefined;
  }

  /** Whether `sub` is `sup` or derives from it. */
  private derives(sub: string, sup: string): boolean {
    for (let c: string | undefined = sub; c; c = this.dataClasses.get(c)?.base) if (c === sup) return true;
    return false;
  }

  /** The class whose own fields hold `js` (up the base chain from `cls`), and its index there. */
  private ownerOf(cls: string, js: string): { cls: string; index: number } {
    const d = this.dataClasses.get(cls)!;
    const own = this.ownFields(d);
    const i = own.findIndex((f) => f.js === js);
    if (i >= 0 || !d.base) return { cls, index: i };
    return this.ownerOf(d.base, js);
  }

  /** A class's own fields: those its base does not have. */
  private ownFields(d: DataClass): DataField[] {
    if (!d.base) return d.fields;
    const inherited = new Set(this.dataClasses.get(d.base)!.fields.map((f) => f.js));
    return d.fields.filter((f) => !inherited.has(f.js));
  }

  /** What makes two shapes one class: their field names, C# types and null-ness. */
  private shapeKey(fields: DataField[]): string {
    return fields.map((f) => `${f.js}:${f.cs}${f.nullable ? "|null" : ""}`).sort().join(";");
  }

  private mergedClass(parts: ts.Type[], whole: ts.Type): string {
    const alias = whole.aliasSymbol;
    if (alias) {
      const known = this.typeNameOf.get(alias);
      if (known) return known;
    }
    const byName = new Map<string, { cs: Set<string>; count: number; nullable: boolean }>();
    for (const p of parts) {
      for (const f of this.fieldsOf(p)) {
        const e = byName.get(f.js) ?? { cs: new Set(), count: 0, nullable: false };
        e.cs.add(f.cs.replace(/\?$/, ""));
        e.count++;
        e.nullable ||= !!f.nullable;
        byName.set(f.js, e);
      }
    }
    const fields: DataField[] = [...byName].map(([js, e]) => {
      let c = e.cs.size === 1 ? [...e.cs][0]! : "object";
      if (VALUE_TYPES.has(c)) c = `${c}?`; // absent in some members, or optional
      return { js, cs: c, ...(e.nullable ? { nullable: true } : {}) };
    });
    const key = `union|${fields.map((f) => `${f.js}:${f.cs}`).sort().join(";")}`;
    const known = this.shapeNames.get(key);
    if (known) {
      if (alias) this.typeNameOf.set(alias, known);
      return known;
    }
    const name = this.uniqueTypeName(alias ? alias.name : `Union_${fields.map((f) => f.js).slice(0, 3).join("_")}`);
    if (alias) this.typeNameOf.set(alias, name);
    this.shapeNames.set(key, name);
    this.mergedNames.add(name);
    this.mergedUnions++;
    this.dataClasses.set(name, { name, fields, origin: alias ? this.originOf(alias) : "union" });
    return name;
  }

  private originOf(sym: ts.Symbol): string {
    const d = sym.declarations?.[0];
    return d ? this.where(d) : sym.name;
  }

  private flushData(): void {
    while (this.pendingData.length) this.pendingData.shift()!();
  }

  private isDataClassName(cs: string): boolean {
    return this.dataClasses.has(cs);
  }

  /** The C# type of a node's TypeScript type at that location (narrowed). */
  private tsCs(node: ts.Node): string {
    return this.cs(this.checker.getTypeAtLocation(node), node);
  }

  // --- coercion ------------------------------------------------------------------------

  /** Converts `code` of C# type `from` to C# type `to`. */
  coerce(code: string, from: string, to: string): string {
    if (from === to || to === "void" || from === "void") return code;
    if (from === "null") return VALUE_TYPES.has(to) ? `default(${to})` : "null";
    if (to === "object") return VALUE_TYPES.has(from) || from.endsWith("?") || from === "string" ? `((object)(${code}))` : code;
    if (from === "object") {
      if (VALUE_TYPES.has(to) || to.endsWith("?")) return `((${to})(${code}))`;
      return `JsRt.As<${to}>(${code})`;
    }
    if (`${from}?` === to) return code; // double -> double?: implicit
    if (`${to}?` === from) return to === "double" ? `(${code} ?? double.NaN)` : to === "bool" ? `(${code} ?? false)` : `((${to})(${code}))`; // a narrowed double?
    if (to === "JsVoid" || from === "JsVoid") return code;
    const arr = /^JsArray<(.*)>$/;
    // a Set where an array is wanted ([...new Set(xs)]): its values in insertion order
    const fs = from.match(/^JsSet<(.*)>$/);
    if (fs && arr.test(to)) return this.coerce(`new JsArray<${fs[1]}>(${code})`, `JsArray<${fs[1]}>`, to);
    const fa = from.match(arr), ta = to.match(arr);
    if (fa && ta) {
      this.conversions++;
      return `(${code}).map<${ta[1]}>((${fa[1]} __e) => ${this.coerce("__e", fa[1]!, ta[1]!)})`;
    }
    const rec = /^JsRecord<(.*)>$/;
    const fr = from.match(rec), tr = to.match(rec);
    if (fr && tr) {
      this.conversions++;
      return `(${code}).mapValues<${tr[1]}>((${fr[1]} __v) => ${this.coerce("__v", fr[1]!, tr[1]!)})`;
    }
    // a class instance where a shape of its fields is expected ({ m } of a Tram): its fields read out
    if (this.isClassName(from) && this.isDataClassName(to)) {
      this.conversions++;
      return `JsRt.As<${to}>(${code})`;
    }
    // a Map or Set of one element type read as one of a related type: converted at run time (a copy)
    if (/^Js(Map|Set)</.test(from) && /^Js(Map|Set)</.test(to)) {
      this.conversions++;
      return `JsRt.As<${to}>(${code})`;
    }
    // a literal with named keys used as a record (a palette), and back
    const toRec = to.match(/^JsRecord<(.*)>$/);
    if (toRec && this.isDataClassName(from)) {
      this.conversions++;
      return `JsRt.ShapeToRecord<${toRec[1]}>(${code})`;
    }
    if (from.startsWith("JsRecord<") && this.isDataClassName(to)) {
      this.conversions++;
      return `JsRt.RecordToShape<${to}>(${code})`;
    }
    if (this.isDataClassName(from) && this.isDataClassName(to) && this.derives(from, to)) return code;
    if (this.isDataClassName(from) && this.isDataClassName(to) && this.derives(to, from)) return `JsRt.As<${to}>(${code})`;
    if (this.isDataClassName(from) && this.isDataClassName(to)) {
      this.conversions++;
      // a generated converter: the present fields copied as they are typed, no reflection
      this.converters.add(`${from}|${to}`);
      return `ShapeConvert.${from}__${to}(${code})`;
    }
    const delegate = /^global::System\.(Func|Action)(?:<(.*)>)?$/;
    const fd = from.match(delegate), td = to.match(delegate);
    if (fd && td) {
      // an adapter lambda: C# delegates do not convert the way TS function types assign
      const fargs = fd[2] ? this.splitAll(fd[2]) : [];
      const targs = td[2] ? this.splitAll(td[2]) : [];
      const fret = fd[1] === "Func" ? fargs.pop()! : "void";
      const tret = td[1] === "Func" ? targs.pop()! : "void";
      if (fargs.length <= targs.length) {
        this.conversions++;
        const names = targs.map((_, i) => `__a${i}`);
        const argList = fargs.map((t, i) => this.coerce(names[i]!, targs[i]!, t)).join(", ");
        // `(f)(x)` would read as a cast: a plain name is called as it is, anything else through Invoke
        const call = /^[\w.@]+$/.test(code) ? `${code}(${argList})` : `(${code}).Invoke(${argList})`;
        const body = tret === "void" ? call : this.coerce(call, fret, tret);
        return `((${to})((${targs.map((t, i) => `${t} ${names[i]}`).join(", ")}) => ${body}))`;
      }
    }
    // classes (an `as` downcast, a subclass to its base), type parameters
    return `((${to})(object)(${code}))`;
  }

  // --- emission: modules ---------------------------------------------------------------

  transpile(entries: Entry[], extraClasses: Array<{ source: string; name: string }>): TranspileResult {
    const stmts = this.reach(entries, extraClasses);
    for (const s of stmts) this.count(s);
    for (const s of stmts) {
      if (!ts.isClassDeclaration(s) || !this.baseClassDecl(s)) continue;
      for (const m of s.members) if (m.name && !ts.isConstructorDeclaration(m)) this.overridden.add(m.name.getText());
    }
    // { tri(...) { } } as unknown as MeshBuilder: the members such a literal supplies are overridden (duckLiteral)
    const scan = (n: ts.Node): void => {
      if (ts.isObjectLiteralExpression(n)) {
        let to = "";
        let up: ts.Node = n.parent;
        while (ts.isParenthesizedExpression(up) || (ts.isAsExpression(up) && up.type.kind === ts.SyntaxKind.UnknownKeyword)) up = up.parent;
        try {
          to = ts.isAsExpression(up) ? this.cs(this.checker.getTypeFromTypeNode(up.type), up) : "";
          if (!to) {
            const ctxT = this.checker.getContextualType(n);
            to = ctxT ? this.cs(ctxT, n) : "";
          }
        } catch {
          to = "";
        }
        if (this.isClassName(to)) for (const p of n.properties) if (p.name) this.overridden.add(p.name.getText());
      }
      ts.forEachChild(n, scan);
    };
    for (const s of stmts) scan(s);
    const modules = new Map<string, string[]>();
    const classes: string[] = [];
    for (const s of stmts) {
      const file = s.getSourceFile().fileName;
      try {
        if (ts.isClassDeclaration(s)) {
          classes.push(this.emitClass(s));
          continue;
        }
        const out = modules.get(file) ?? [];
        modules.set(file, out);
        if (ts.isFunctionDeclaration(s)) out.push(this.emitFunctionDecl(s, true));
        else if (ts.isVariableStatement(s)) out.push(this.emitModuleVars(s));
        else this.fail(s, "top-level statement");
      } catch (e) {
        if (e instanceof TranspileError) this.errors.push(e.message);
        else this.errors.push(`${this.where(s)}: transpiler failure in this declaration: ${(e as Error).message}`);
      }
    }
    this.flushData();
    if (this.errors.length) throw new TranspileError(`${this.errors.length} unsupported construct(s):\n${this.errors.join("\n")}`);
    const header = "// Generated by tools/cs-transpile from generator/*.ts - do not edit.\n#nullable disable\n#pragma warning disable CS0108, CS0162, CS0168, CS0219, CS0649, CS1717, CS8981\nusing System.Collections.Generic;\nusing RailIsland.Factory.Runtime;\n\nnamespace RailIsland.Factory.Generated;\n\n";
    const files = new Map<string, string>();
    const mod = [...modules].map(([file, members]) => `public static partial class ${this.moduleClass(file)}\n{\n${members.join("\n\n")}\n}\n`).join("\n");
    files.set("Modules.g.cs", header + mod);
    files.set("Classes.g.cs", header + [...classes, ...this.duckClasses].join("\n"));
    files.set("Convert.g.cs", header + this.emitConverters());
    files.set("Types.g.cs", header + [...this.dataClasses.values()].sort((a, b) => a.name.localeCompare(b.name)).map((d) => this.emitDataClass(d)).join("\n"));
    const lines = [...files.values()].reduce((n, s) => n + s.split("\n").length, 0);
    const moduleFiles = [...new Set(stmts.map((s) => path.relative(this.generatorDir, s.getSourceFile().fileName)))].sort();
    return {
      files,
      inventory: new Map([...this.inventory].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
      modules: moduleFiles,
      stats: { declarations: stmts.length, dataClasses: this.dataClasses.size, anonymousShapes: this.anonymousShapes, mergedUnions: this.mergedUnions, conversions: this.conversions, lines },
    };
  }

  /**
   * A shape class: a property per field over a backing field, each setter marking the
   * field present. A field whose TS type admits null keeps "set to null" apart from
   * "left out" (`{ end: null }` against `{}`), as JS's destructuring defaults, `in`,
   * spreads and JSON.stringify tell them apart; for the others null is absence.
   */
  private emitDataClass(d: DataClass): string {
    // a derived class declares its own fields; the IJsObject members chain to the base's
    const f = this.ownFields(d);
    const derived = !!d.base;
    const mod = derived ? "override" : "virtual";
    const words = Math.max(1, Math.ceil(f.length / 64));
    const esc = (js: string) => Transpiler.escape(js);
    const bit = (i: number) => `${(1n << BigInt(i % 64)).toString()}UL`;
    const word = (i: number) => `__p_${d.name}_${Math.floor(i / 64)}`;
    // a field that is always set reads as present; any other is present once written, even with
    // undefined (`{ ...s, lowWell: undefined }` overrides s.lowWell): the presence bit
    const has = (x: DataField, i: number) => (VALUE_TYPES.has(x.cs) && !x.nullable ? "true" : `(${word(i)} & ${bit(i)}) != 0`);
    const fallback = (call: string, none: string) => (derived ? `base.${call}` : none);
    const lines = [
      `/** From ${d.origin}. */`,
      `public partial class ${d.name} : ${derived ? d.base : "IJsObject"}`,
      "{",
      `    internal ulong ${Array.from({ length: words }, (_, k) => `__p_${d.name}_${k}`).join(", ")};`,
      ...f.map((x, i) => {
        const b = Transpiler.backing(x.js);
        return `    internal ${x.cs} ${b};\n    public ${x.cs} ${esc(x.js)} { get => ${b}; set { ${b} = value; ${word(i)} |= ${bit(i)}; } }`;
      }),
      `    public ${mod} bool __has(string __k) => __k switch { ${f.map((x, i) => `${this.str(x.js)} => ${has(x, i)}, `).join("")}_ => ${fallback("__has(__k)", "false")} };`,
      `    public ${mod} object __get(string __k) => __k switch { ${f.map((x) => `${this.str(x.js)} => this.${Transpiler.backing(x.js)}, `).join("")}_ => ${fallback("__get(__k)", "null")} };`,
      `    public ${mod} void __set(string __k, object __v) { switch (__k) { ${f.map((x) => `case ${this.str(x.js)}: this.${esc(x.js)} = JsRt.As<${x.cs}>(__v); break; `).join("")}default: ${derived ? "base.__set(__k, __v); " : ""}break; } }`,
      `    public ${mod} bool __null(string __k) => __k switch { ${f.filter((x) => x.nullable).map((x) => `${this.str(x.js)} => true, `).join("")}_ => ${fallback("__null(__k)", "false")} };`,
      `    public ${mod} IEnumerable<string> __keys() { ${derived ? "foreach (var __b in base.__keys()) yield return __b; " : ""}${f.map((x, i) => (has(x, i) === "true" ? `yield return ${this.str(x.js)}; ` : `if (${has(x, i)}) yield return ${this.str(x.js)}; `)).join("")}yield break; }`,
      `    public ${mod} bool __delete(string __k) { switch (__k) { ${f.map((x, i) => `case ${this.str(x.js)}: this.${Transpiler.backing(x.js)} = default; ${word(i)} &= ~${bit(i)}; return true; `).join("")}} return ${fallback("__delete(__k)", "true")}; }`,
      ...(derived ? [] : [`    public IJsObject __copy() => (IJsObject)MemberwiseClone();`]),
      `    public ${derived ? "new " : ""}${d.name} copy() => (${d.name})MemberwiseClone();`,
      "}",
    ];
    return lines.join("\n") + "\n";
  }

  /** Whether field `x` (index `i`) of a shape object `o` is present, read off its backing field. */
  private presentOn(o: string, x: DataField, i: number, cls?: string): string {
    if (x.nullable || !VALUE_TYPES.has(x.cs)) {
      // the presence bit lives in the class that declares the field
      const at = cls ? this.ownerOf(cls, x.js) : { cls: "", index: i };
      return `(${o}.__p_${at.cls}_${Math.floor(at.index / 64)} & ${(1n << BigInt(at.index % 64)).toString()}UL) != 0`;
    }
    return VALUE_TYPES.has(x.cs) ? "true" : `${o}.${Transpiler.backing(x.js)} != null`;
  }

  /**
   * One method per shape-to-shape conversion: a new object of the target class with
   * each present field of the source the target also has, converted to its type. A
   * field's conversion may ask for another converter; they are emitted until none is new.
   */
  private emitConverters(): string {
    const done = new Set<string>();
    const methods: string[] = [];
    for (let pending = [...this.converters]; pending.length; pending = [...this.converters].filter((c) => !done.has(c))) {
      for (const pair of pending.sort()) {
        done.add(pair);
        const [from, to] = pair.split("|") as [string, string];
        const src = this.dataClasses.get(from)!.fields;
        const dst = new Map(this.dataClasses.get(to)!.fields.map((f) => [f.js, f]));
        const lines = src.flatMap((x, i) => {
          const y = dst.get(x.js);
          if (!y) return [];
          return [`        if (${this.presentOn("a", x, i, from)}) b.${Transpiler.escape(x.js)} = ${this.coerce(`a.${Transpiler.backing(x.js)}`, x.cs, y.cs)};`];
        });
        methods.push(`    public static ${to} ${from}__${to}(${from} a)\n    {\n        if (a == null) return null;\n        var b = new ${to}();\n${lines.join("\n")}\n        return b;\n    }`);
      }
    }
    return `/** Conversions between shape classes, as transpile.ts emits them (coerce). */\npublic static class ShapeConvert\n{\n${methods.join("\n\n")}\n}\n`;
  }

  private emitModuleVars(s: ts.VariableStatement): string {
    const out: string[] = [];
    for (const d of s.declarationList.declarations) {
      if (!ts.isIdentifier(d.name)) {
        out.push(this.member(null, () => this.moduleDestructuring(d)));
        continue;
      }
      const init = d.initializer && this.skipParens(d.initializer);
      const isConst = !!(s.declarationList.flags & ts.NodeFlags.Const);
      if (init && isConst && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
        out.push(this.member(null, () => this.emitFunctionLike(init, Transpiler.escape(d.name.getText()), "    public static ")));
        continue;
      }
      out.push(this.member(null, () => {
        const sym = this.checker.getSymbolAtLocation(d.name)!;
        const rec = this.recordLiteral(d.initializer);
        if (rec) this.localCs.set(this.keyOf(sym), rec);
        const c = rec ?? this.cs(this.checker.getTypeOfSymbol(sym), d);
        const value = init ? this.exprTo(init, c) : VALUE_TYPES.has(c) ? `default(${c})` : "null";
        return `    public static ${c} ${Transpiler.escape(d.name.getText())} = ${value};`;
      }));
    }
    return out.join("\n");
  }

  /**
   * `const [A, B] = [0.5, 0.85]` at module level: a static field per name. From an array
   * literal each takes its element; otherwise they read a hidden field holding the value.
   */
  private moduleDestructuring(d: ts.VariableDeclaration): string {
    const lit = d.initializer && this.skipParensKeepAs(d.initializer);
    const out: string[] = [];
    if (ts.isArrayBindingPattern(d.name) && lit && ts.isArrayLiteralExpression(lit) && !lit.elements.some(ts.isSpreadElement)) {
      d.name.elements.forEach((b, i) => {
        if (ts.isOmittedExpression(b) || !ts.isIdentifier(b.name) || b.dotDotDotToken) {
          if (!ts.isOmittedExpression(b)) out.push(this.fail(b, "nested module-level destructuring").code);
          return;
        }
        const c = this.cs(this.checker.getTypeAtLocation(b), b);
        const el = lit.elements[i];
        const value = el ? this.exprTo(el, c) : b.initializer ? this.exprTo(b.initializer, c) : "default";
        out.push(`    public static ${c} ${Transpiler.escape(b.name.text)} = ${value};`);
      });
      return out.join("\n");
    }
    const hidden = `__destructured${++this.ctx.temps}_${d.getStart()}`;
    const src = this.expr(d.initializer!);
    out.push(`    private static readonly ${src.cs} ${hidden} = ${src.code};`);
    const t = `${hidden}`;
    for (const line of this.destructure(d.name, t, src.cs)) {
      const m = line.match(/^(.+?) (\S+) = (.*);$/);
      out.push(m ? `    public static ${m[1]} ${m[2]} = ${m[3]};` : `    // ${line}`);
    }
    return out.join("\n");
  }

  private skipParens(e: ts.Expression): ts.Expression {
    while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isTypeAssertionExpression(e)) {
      if (ts.isAsExpression(e) && !this.isConstAssertion(e)) break;
      e = e.expression;
    }
    return e;
  }

  private isConstAssertion(e: ts.AsExpression): boolean {
    return ts.isTypeReferenceNode(e.type) && e.type.typeName.getText() === "const";
  }

  private emitFunctionDecl(fd: ts.FunctionDeclaration, top: boolean): string {
    if (!fd.body || !fd.name) return this.fail(fd, "function without body or name").code;
    if (top) return this.member(null, () => this.emitFunctionLike(fd, Transpiler.escape(fd.name!.text), "    public static "));
    return this.emitFunctionLike(fd, this.declName(fd.name), "");
  }

  // --- emission: functions -------------------------------------------------------------

  private signatureOf(fn: ts.SignatureDeclaration): ts.Signature {
    const sig = this.checker.getSignatureFromDeclaration(fn);
    if (!sig) throw new TranspileError(`${this.where(fn)}: no signature`);
    return sig;
  }

  private returnCs(fn: ts.SignatureDeclaration): string {
    return this.cs(this.signatureOf(fn).getReturnType(), fn);
  }

  private typeParams(fn: ts.SignatureDeclaration): string {
    const kept = this.keptTypeParams(fn);
    return kept.length ? `<${kept.map((p) => p.name.text).join(", ")}>` : "";
  }

  /** The shape class a type parameter's constraint maps to, when it is one (not a class); else null. */
  private shapeConstraint(t: ts.Type): string | null {
    if ((t as { isThisType?: boolean }).isThisType) return null;
    const c = t.getConstraint();
    if (!c) return null;
    try {
      const cs = this.cs(c);
      return this.isDataClassName(cs) ? cs : null;
    } catch {
      return null;
    }
  }

  /** The type parameters C# keeps: those not constrained to a shape (shapeConstraint). */
  private keptTypeParams(fn: ts.SignatureDeclaration): ts.TypeParameterDeclaration[] {
    return (fn.typeParameters ?? []).filter((p) => !this.shapeConstraint(this.checker.getTypeAtLocation(p)));
  }

  /** `where T : MeshBuilder` for a type parameter constrained to a class (`<M extends MeshCore>`). */
  private constraints(fn: ts.SignatureDeclaration): string {
    const out: string[] = [];
    for (const p of this.keptTypeParams(fn)) {
      if (!p.constraint) continue;
      let c: string;
      try {
        c = this.cs(this.checker.getTypeFromTypeNode(p.constraint), p);
      } catch {
        continue;
      }
      const isClass = [...this.classNames.values()].includes(c) || c === "MeshBuilder" || this.isDataClassName(c);
      if (isClass) out.push(` where ${p.name.text} : ${c}`);
    }
    return out.join("");
  }

  /**
   * The parameter list, and the statements the body starts with: a destructured
   * parameter's bindings, a default that is no compile-time constant.
   */
  private params(fn: ts.SignatureDeclaration): { list: string; prologue: string[]; names: string[] } {
    const list: string[] = [];
    const prologue: string[] = [];
    const names: string[] = [];
    let optionalSeen = false;
    for (const p of fn.parameters) {
      if (p.dotDotDotToken) {
        // ...rest: C# params, wrapped as the JsArray the body expects
        if (!ts.isIdentifier(p.name)) {
          this.fail(p, "destructured rest parameter");
          continue;
        }
        const rc = this.cs(this.checker.getTypeAtLocation(p), p);
        const re = rc.match(/^JsArray<(.*)>$/)?.[1];
        if (!re) {
          this.fail(p, `rest parameter of ${rc}`);
          continue;
        }
        const name = this.declName(p.name);
        names.push(`${name}__rest`);
        list.push(`params ${re}[] ${name}__rest`);
        prologue.push(`${rc} ${name} = JsArray<${re}>.Of(${name}__rest);`);
        continue;
      }
      const t = this.checker.getTypeAtLocation(p);
      let c = this.cs(t, p);
      if (c === "void") c = "object";
      const optional = !!p.questionToken || !!p.initializer;
      if (optional) optionalSeen = true;
      if (!ts.isIdentifier(p.name)) {
        const name = this.temp();
        names.push(name);
        list.push(`${c} ${name}${optional ? " = default" : ""}`);
        prologue.push(...this.destructure(p.name, name, c));
        continue;
      }
      const name = this.declName(p.name);
      names.push(name);
      if (!p.initializer) {
        list.push(`${c} ${name}${p.questionToken || optionalSeen ? (VALUE_TYPES.has(c) ? " = null" : " = null") : ""}`.replace(/^(double|bool) (\S+) = null$/, "$1? $2 = null"));
        continue;
      }
      const constant = this.constantDefault(p.initializer, c);
      if (constant !== null) {
        list.push(`${c} ${name} = ${constant}`);
        continue;
      }
      // a default the C# signature cannot hold: null in, the default worked out in the body
      const raw = `${name}__arg`;
      names[names.length - 1] = raw;
      // a string parameter that may be null (`top: string | null = mat`): an explicit null stays null,
      // only a left-out argument takes the default - told apart by a sentinel default
      if (c === "string" && t.isUnion() && t.types.some((x) => x.flags & ts.TypeFlags.Null)) {
        list.push(`string ${raw} = JsRt.UndefinedString`);
        prologue.push(`string ${name} = ${raw} == JsRt.UndefinedString ? ${this.exprTo(p.initializer, c)} : ${raw};`);
        continue;
      }
      const nullable = VALUE_TYPES.has(c) ? `${c}?` : c;
      list.push(`${nullable} ${raw} = null`);
      prologue.push(`${c} ${name} = ${raw} ?? ${this.exprTo(p.initializer, c)};`);
    }
    return { list: list.join(", "), prologue, names };
  }

  private constantDefault(e: ts.Expression, c: string): string | null {
    const x = this.skipParens(e);
    if (ts.isNumericLiteral(x) || (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(x.operand))) return this.exprTo(x, c);
    if (ts.isStringLiteral(x) || ts.isNoSubstitutionTemplateLiteral(x)) return this.exprTo(x, c);
    if (x.kind === ts.SyntaxKind.TrueKeyword || x.kind === ts.SyntaxKind.FalseKeyword) return c === "bool" || c === "bool?" ? x.getText() : null;
    if (x.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(x) && x.text === "undefined")) return "null";
    return null;
  }

  /** A function declaration, method or const arrow function as a C# method or local function. */
  private emitFunctionLike(fn: ts.SignatureDeclaration & { body?: ts.ConciseBody }, name: string, prefix: string): string {
    const ret = this.returnCs(fn);
    // a local function inside a unit lambda returns what it declares, not JsVoid
    const savedUnit = this.ctx.voidAsUnit;
    this.ctx.voidAsUnit = false;
    try {
      const { list, prologue } = this.params(fn);
      const head = `${prefix}${ret} ${name}${this.typeParams(fn)}(${list})${this.constraints(fn)}`;
      if (!fn.body) return `${head};`;
      const body = this.functionBody(fn.body, ret, prologue, "    ".repeat(prefix ? 2 : 1));
      return `${head}\n${body}`;
    } finally {
      this.ctx.voidAsUnit = savedUnit;
    }
  }

  private functionBody(body: ts.ConciseBody, ret: string, prologue: string[], indent: string, unit = false): string {
    const savedBreak = this.ctx.breakLabel;
    const savedUnit = this.ctx.voidAsUnit;
    const savedRet = this.ctx.retCs;
    this.ctx.breakLabel = null;
    this.ctx.voidAsUnit = unit;
    this.ctx.retCs = ret;
    try {
      return this.functionBodyInner(body, ret, prologue, indent);
    } finally {
      this.ctx.breakLabel = savedBreak;
      this.ctx.voidAsUnit = savedUnit;
      this.ctx.retCs = savedRet;
    }
  }

  private functionBodyInner(body: ts.ConciseBody, ret: string, prologue: string[], indent: string): string {
    const inner = indent + "    ";
    const lines = prologue.map((p) => inner + p);
    if (ts.isBlock(body)) {
      for (const s of body.statements) lines.push(this.stmt(s, inner));
    } else if (ret === "void") {
      lines.push(`${inner}${this.exprStatement(body)};`);
    } else {
      lines.push(`${inner}return ${this.exprTo(body, ret)};`);
    }
    if (this.ctx.voidAsUnit && ts.isBlock(body)) lines.push(`${inner}return JsVoid.I;`);
    else if (ret !== "void" && ts.isBlock(body)) {
      // TypeScript proved every path returns (an exhaustive switch); C# cannot see that
      const last = body.statements[body.statements.length - 1];
      if (!last || !(ts.isReturnStatement(last) || ts.isThrowStatement(last))) lines.push(`${inner}throw new JsError("no value returned");`);
    }
    return `${indent}{\n${lines.join("\n")}\n${indent}}`;
  }

  /** A lambda (an arrow function or function expression used as a value). */
  /** `c` with `fn`'s own type parameters read as object: a C# lambda cannot be generic. */
  private withoutOwnTypeParams(fn: ts.SignatureDeclaration, c: string): string {
    for (const tp of fn.typeParameters ?? []) c = c.replace(new RegExp(`(?<![\\w.])${tp.name.text}(?![\\w])`, "g"), "object");
    return c;
  }

  /** A delegate type's parameter types and return type (void for an Action), or null. */
  private delegateShape(cs: string): { params: string[]; ret: string } | null {
    const m = cs.match(/^global::System\.(Func|Action)(?:<(.*)>)?$/);
    if (!m) return null;
    const args = m[2] ? this.splitAll(m[2]) : [];
    const ret = m[1] === "Func" ? args.pop()! : "void";
    return { params: args, ret };
  }

  /**
   * A lambda. With `target` (the delegate it becomes), its parameters take the target's
   * types - converted to the TS types inside, as `(m: this) => ...` called with a generic
   * T needs - and parameters the target has beyond the lambda's are discarded: TypeScript
   * lets `() => y` stand for `(x, z) => number`.
   */
  private lambda(fn: ts.ArrowFunction | ts.FunctionExpression, unit = false, target?: string): Out {
    const sig = this.signatureOf(fn);
    let ret = this.cs(sig.getReturnType(), fn);
    const shape = target ? this.delegateShape(target) : null;
    if (shape && shape.ret !== "void" && shape.ret !== "JsVoid" && ret !== "void") ret = shape.ret;
    if (shape && shape.ret === "void") ret = "void";
    const saved = this.ctx.voidAsUnit;
    this.ctx.voidAsUnit = (unit || shape?.ret === "JsVoid") && ret === "void";
    try {
      const { list, prologue, names } = this.params(fn);
      let typed = list.replace(/ = [^,]+/g, "");
      if (shape && !fn.parameters.some((p) => p.dotDotDotToken) && shape.params.length >= fn.parameters.length) {
        const own = fn.parameters.map((p) => {
          const c = this.withoutOwnTypeParams(fn, this.cs(this.checker.getTypeAtLocation(p), p));
          return c === "void" ? "object" : c;
        });
        const entries: string[] = [];
        const conv: string[] = [];
        shape.params.forEach((tt, i) => {
          if (i >= own.length) {
            entries.push(`${tt} __d${i}`);
            return;
          }
          if (tt === own[i]) {
            entries.push(`${own[i]} ${names[i]}`);
            return;
          }
          entries.push(`${tt} ${names[i]}__in`);
          const init = fn.parameters[i]!.initializer;
          // a default parameter: the target's delegate passes null (an argument left out) for it
          if (init && (tt.endsWith("?") || !VALUE_TYPES.has(tt))) conv.push(`${own[i]} ${names[i]} = ${names[i]}__in != null ? ${this.coerce(`${names[i]}__in`, tt, own[i]!)} : ${this.exprTo(init, own[i]!)};`);
          else conv.push(`${own[i]} ${names[i]} = ${this.coerce(`${names[i]}__in`, tt, own[i]!)};`);
        });
        typed = entries.join(", ");
        prologue.unshift(...conv);
      }
      if (!ts.isBlock(fn.body) && !prologue.length) {
        if (this.ctx.voidAsUnit) return { code: `(${typed}) => { ${this.exprStatement(fn.body)}; return JsVoid.I; }`, cs: this.lambdaCs(fn, "JsVoid") };
        // a void body is a statement (an `a && b()` becomes an if): in a block
        const body = ret === "void" ? `{ ${this.exprStatement(fn.body)}; }` : this.exprTo(fn.body, ret);
        return { code: `(${typed}) => ${body}`, cs: this.lambdaCs(fn, ret) };
      }
      const unitBody = this.ctx.voidAsUnit;
      const body = this.functionBody(fn.body, ret, prologue, "", unitBody);
      if (unitBody) ret = "JsVoid";
      return { code: `(${typed}) =>\n${body}`, cs: this.lambdaCs(fn, ret) };
    } finally {
      this.ctx.voidAsUnit = saved;
    }
  }

  private lambdaCs(fn: ts.SignatureDeclaration, ret: string): string {
    const params = fn.parameters.map((p) => this.typeArgCs(this.checker.getTypeAtLocation(p), p));
    if (ret === "void") return params.length ? `global::System.Action<${params.join(", ")}>` : "global::System.Action";
    return `global::System.Func<${[...params, ret].join(", ")}>`;
  }

  // --- emission: classes ---------------------------------------------------------------

  private baseClassDecl(c: ts.ClassDeclaration): ts.ClassDeclaration | null {
    const ext = c.heritageClauses?.find((h) => h.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
    if (!ext) return null;
    const sym = this.resolve(this.checker.getSymbolAtLocation(ext.expression));
    return sym?.declarations?.find(ts.isClassDeclaration) ?? null;
  }

  private hasBaseMember(c: ts.ClassDeclaration, name: string): boolean {
    for (let b = this.baseClassDecl(c); b; b = this.baseClassDecl(b)) {
      if (b.members.some((m) => m.name && m.name.getText() === name)) return true;
    }
    return false;
  }

  private emitClass(c: ts.ClassDeclaration): string {
    const name = this.className(c);
    const baseDecl = this.baseClassDecl(c);
    const base = baseDecl ? this.className(baseDecl) : null;
    const out: string[] = [];
    const fields: string[] = [];
    const fieldInits: string[] = [];
    const statics: string[] = [];
    const ctor = c.members.find(ts.isConstructorDeclaration);
    const accessors = new Map<string, { get?: ts.GetAccessorDeclaration; set?: ts.SetAccessorDeclaration }>();

    for (const m of c.members) {
      if (ts.isPropertyDeclaration(m)) {
        const pn = Transpiler.escape(m.name.getText());
        const sym = this.checker.getSymbolAtLocation(m.name)!;
        let ft = this.cs(this.checker.getTypeOfSymbol(sym), m);
        if (m.questionToken && VALUE_TYPES.has(ft)) ft = `${ft}?`;
        const isStatic = m.modifiers?.some((x) => x.kind === ts.SyntaxKind.StaticKeyword);
        if (isStatic) {
          statics.push(this.member(name, () => `    public static ${ft} ${pn}${m.initializer ? ` = ${this.exprTo(m.initializer, ft)}` : ""};`));
          continue;
        }
        fields.push(`    public ${ft} ${pn};`);
        if (m.initializer) fieldInits.push(this.member(name, () => `        this.${pn} = ${this.exprTo(m.initializer!, ft)};`));
      } else if (ts.isMethodDeclaration(m)) {
        const isStatic = m.modifiers?.some((x) => x.kind === ts.SyntaxKind.StaticKeyword);
        const mn = Transpiler.escape(m.name.getText());
        const mod = isStatic ? "public static " : this.hasBaseMember(c, m.name.getText()) ? "public override " : this.overridden.has(m.name.getText()) ? "public virtual " : "public ";
        out.push(this.member(name, () => this.emitFunctionLike(m, mn, `    ${mod}`)));
      } else if (ts.isGetAccessorDeclaration(m) || ts.isSetAccessorDeclaration(m)) {
        const e = accessors.get(m.name.getText()) ?? {};
        if (ts.isGetAccessorDeclaration(m)) e.get = m;
        else e.set = m;
        accessors.set(m.name.getText(), e);
      } else if (ts.isConstructorDeclaration(m) || ts.isSemicolonClassElement(m)) {
        // below
      } else {
        this.fail(m, "class member");
      }
    }
    for (const [an, { get, set }] of accessors) {
      const t = get ? this.returnCs(get) : this.cs(this.checker.getTypeAtLocation(set!.parameters[0]!), set);
      out.push(this.member(name, () => {
        const parts: string[] = [];
        if (get) parts.push(`        get\n${this.functionBody(get.body!, t, [], "        ")}`);
        if (set) {
          const p = set.parameters[0]!;
          const pn = this.declName(p.name as ts.Identifier);
          parts.push(`        set\n${this.functionBody(set.body!, "void", [`${t} ${pn} = value;`], "        ")}`);
        }
        const mod = this.hasBaseMember(c, an) ? "override " : this.overridden.has(an) ? "virtual " : "";
        return `    public ${mod}${t} ${Transpiler.escape(an)}\n    {\n${parts.join("\n")}\n    }`;
      }));
    }

    // constructors: the C# one only forwards to __ctor_<name>, which runs the TS body
    // (code before super() included), the base's __ctor and the field initializers
    const ctorCode = this.member(name, () => {
      let paramList = "";
      let callArgs = "";
      const body: string[] = [];
      const fieldsCall = `        __fields_${name}();`;
      if (ctor) {
        const { list, prologue, names } = this.params(ctor);
        paramList = list;
        callArgs = names.join(", ");
        body.push(...prologue.map((p) => `        ${p}`));
        // parameter properties
        const paramProps = ctor.parameters.filter((p) => ts.getModifiers(p)?.some((x) => [ts.SyntaxKind.PublicKeyword, ts.SyntaxKind.PrivateKeyword, ts.SyntaxKind.ProtectedKeyword, ts.SyntaxKind.ReadonlyKeyword].includes(x.kind)));
        for (const p of paramProps) {
          const pn = (p.name as ts.Identifier).text;
          const ft = this.cs(this.checker.getTypeAtLocation(p), p);
          fields.push(`    public ${ft} ${Transpiler.escape(pn)};`);
        }
        const propAssigns = paramProps.map((p) => `        this.${Transpiler.escape((p.name as ts.Identifier).text)} = ${this.declName(p.name as ts.Identifier)};`);
        let superSeen = false;
        if (!base) {
          body.push(fieldsCall, ...propAssigns);
          superSeen = true;
        }
        for (const s of ctor.body!.statements) {
          if (ts.isExpressionStatement(s) && ts.isCallExpression(s.expression) && s.expression.expression.kind === ts.SyntaxKind.SuperKeyword) {
            const baseCtor = this.baseCtorParams(baseDecl!);
            const args = s.expression.arguments.map((a, i) => this.exprTo(a, baseCtor[i] ?? "object")).join(", ");
            body.push(`        __ctor_${base}(${args});`, fieldsCall, ...propAssigns);
            superSeen = true;
            continue;
          }
          body.push(this.stmt(s, "        "));
        }
        if (!superSeen) this.fail(ctor, "constructor without super()");
      } else if (base) {
        const ps = this.baseCtorParamDecl(baseDecl!);
        paramList = ps.list;
        callArgs = ps.names.join(", ");
        body.push(`        __ctor_${base}(${ps.names.join(", ")});`, fieldsCall);
      } else {
        body.push(fieldsCall);
      }
      const baseInit = base ? " : base(JsCtor.Skip)" : "";
      const skipCtor = base ? `    protected ${name}(JsCtor skip) : base(skip) { }` : `    protected ${name}(JsCtor skip) { }`;
      return [
        `    public ${name}(${paramList})${baseInit} { __ctor_${name}(${callArgs}); }`,
        skipCtor,
        `    public void __ctor_${name}(${paramList.replace(/(\w+)__arg = null/g, "$1__arg = null")})\n    {\n${body.join("\n")}\n    }`,
      ].join("\n");
    });
    const fieldsMethod = `    private void __fields_${name}()\n    {\n${fieldInits.join("\n")}\n    }`;
    const head = `public partial class ${name}${base ? ` : ${base}` : ""}`;
    return `${head}\n{\n${[...statics, ...fields].join("\n")}\n\n${ctorCode}\n\n${fieldsMethod}\n\n${out.join("\n\n")}\n}\n`;
  }

  /** The C# types of a class's constructor parameters (for super(...) arguments). */
  private baseCtorParams(c: ts.ClassDeclaration): string[] {
    if (this.seamFiles.has(c.getSourceFile().fileName)) return ["JsRecord<MaterialSpec>"];
    const ctor = c.members.find(ts.isConstructorDeclaration);
    if (!ctor) {
      const b = this.baseClassDecl(c);
      return b ? this.baseCtorParams(b) : [];
    }
    return ctor.parameters.map((p) => this.cs(this.checker.getTypeAtLocation(p), p));
  }

  private baseCtorParamDecl(c: ts.ClassDeclaration): { list: string; names: string[] } {
    const types = this.baseCtorParams(c);
    const names = types.map((_, i) => `a${i}`);
    return { list: types.map((t, i) => `${t} ${names[i]}`).join(", "), names };
  }

  // --- emission: statements ------------------------------------------------------------

  private stmt(s: ts.Statement, ind: string): string {
    // a `break` inside a loop is the loop's, even within a switch case
    const loop = ts.isIterationStatement(s, false);
    const saved = this.ctx.breakLabel;
    if (loop) this.ctx.breakLabel = null;
    try {
      return this.stmtInner(s, ind);
    } catch (e) {
      this.errors.push(e instanceof TranspileError ? e.message : `${this.where(s)}: transpiler failure: ${(e as Error).message}`);
      return `${ind}/* error */`;
    } finally {
      if (loop) this.ctx.breakLabel = saved;
    }
  }

  private block(s: ts.Statement, ind: string): string {
    if (ts.isBlock(s)) return `${ind}{\n${s.statements.map((x) => this.stmt(x, ind + "    ")).join("\n")}\n${ind}}`;
    return `${ind}{\n${this.stmt(s, ind + "    ")}\n${ind}}`;
  }

  private stmtInner(s: ts.Statement, ind: string): string {
    if (ts.isExpressionStatement(s)) return `${ind}${this.exprStatement(s.expression)};`;
    if (ts.isVariableStatement(s)) return this.varDecls(s.declarationList, ind);
    if (ts.isReturnStatement(s)) {
      if (!s.expression) return `${ind}return${this.ctx.voidAsUnit ? " JsVoid.I" : ""};`;
      const fn = ts.findAncestor(s, ts.isFunctionLike) as ts.SignatureDeclaration | undefined;
      const ret = this.ctx.retCs ?? (fn && !ts.isClassStaticBlockDeclaration(fn) ? this.returnCs(fn) : "object");
      if (ret === "void") return `${ind}{ ${this.exprStatement(s.expression)}; return${this.ctx.voidAsUnit ? " JsVoid.I" : ""}; }`;
      return `${ind}return ${this.exprTo(s.expression, ret)};`;
    }
    if (ts.isIfStatement(s)) {
      let out = `${ind}if (${this.cond(s.expression)})\n${this.block(s.thenStatement, ind)}`;
      if (s.elseStatement) {
        out += ts.isIfStatement(s.elseStatement) ? `\n${ind}else ${this.stmt(s.elseStatement, ind).trimStart()}` : `\n${ind}else\n${this.block(s.elseStatement, ind)}`;
      }
      return out;
    }
    if (ts.isBlock(s)) return this.block(s, ind);
    if (ts.isForStatement(s)) return this.forStmt(s, ind);
    if (ts.isForOfStatement(s)) return this.forOf(s, ind);
    if (ts.isWhileStatement(s)) return `${ind}while (${this.cond(s.expression)})\n${this.block(s.statement, ind)}`;
    if (ts.isDoStatement(s)) return `${ind}do\n${this.block(s.statement, ind)}\n${ind}while (${this.cond(s.expression)});`;
    if (ts.isThrowStatement(s)) return `${ind}throw ${this.expr(s.expression).code};`;
    if (ts.isTryStatement(s)) {
      let out = `${ind}try\n${this.block(s.tryBlock, ind)}`;
      if (s.catchClause) {
        const v = s.catchClause.variableDeclaration;
        const vn = v && ts.isIdentifier(v.name) ? this.declName(v.name) : null;
        out += `\n${ind}catch (global::System.Exception${vn ? ` ${vn}` : ""})\n${this.block(s.catchClause.block, ind)}`;
      }
      if (s.finallyBlock) out += `\n${ind}finally\n${this.block(s.finallyBlock, ind)}`;
      return out;
    }
    if (ts.isBreakStatement(s) && !s.label) return this.ctx.breakLabel ? `${ind}goto ${this.ctx.breakLabel};` : `${ind}break;`;
    if (ts.isContinueStatement(s) && !s.label) return `${ind}continue;`;
    if (ts.isEmptyStatement(s)) return `${ind};`;
    if (ts.isFunctionDeclaration(s)) return this.indentBlock(this.emitFunctionDecl(s, false), ind);
    if (ts.isSwitchStatement(s)) return this.switchStmt(s, ind);
    if (ts.isTypeAliasDeclaration(s) || ts.isInterfaceDeclaration(s)) return `${ind}// type ${s.name.text}: a class of its own`;
    return `${ind}${this.fail(s, "statement").code};`;
  }

  private indentBlock(code: string, ind: string): string {
    return code.split("\n").map((l) => ind + l).join("\n");
  }

  /**
   * A switch as labels and gotos, which is what a JS switch is: the subject is compared
   * with each case in order (=== , a default last), control jumps to the first match's
   * label and runs on through the following cases until a `break` (`goto` the end) - so
   * fall-through, a default in the middle and `continue` of an enclosing loop all behave
   * as in JS. A C# switch would forbid the fall-through.
   */
  private switchStmt(s: ts.SwitchStatement, ind: string): string {
    const n = ++this.ctx.temps;
    const subject = `__sw${n}`;
    const end = `__sw${n}_end`;
    const st = this.expr(s.expression);
    const clauses = s.caseBlock.clauses;
    const label = (i: number) => `__sw${n}_c${i}`;
    const lines = [`${ind}{`, `${ind}    var ${subject} = ${st.code};`];
    clauses.forEach((c, i) => {
      if (!ts.isCaseClause(c)) return;
      const v = this.expr(c.expression);
      const prim = (x: string) => ["double", "bool", "string"].includes(x);
      const test = prim(st.cs) && st.cs === v.cs ? `${subject} == ${v.code}` : `JsRt.Eq(${subject}, ${v.code})`;
      lines.push(`${ind}    if (${test}) goto ${label(i)};`);
    });
    const def = clauses.findIndex((c) => ts.isDefaultClause(c));
    lines.push(`${ind}    goto ${def >= 0 ? label(def) : end};`);
    const saved = this.ctx.breakLabel;
    this.ctx.breakLabel = end;
    try {
      clauses.forEach((c, i) => {
        lines.push(`${ind}    ${label(i)}:`, `${ind}    {`, ...c.statements.map((x) => this.stmt(x, ind + "        ")), `${ind}    }`);
      });
    } finally {
      this.ctx.breakLabel = saved;
    }
    lines.push(`${ind}    ${end}: ;`, `${ind}}`);
    return lines.join("\n");
  }

  private varDecls(list: ts.VariableDeclarationList, ind: string): string {
    const isConst = !!(list.flags & ts.NodeFlags.Const);
    return list.declarations.map((d) => {
      const init = d.initializer && this.skipParens(d.initializer);
      if (ts.isIdentifier(d.name) && init && isConst && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
        // a const arrow function: a local function (defaults, recursion, no delegate type)
        return this.indentBlock(this.emitFunctionLike(init, this.declName(d.name), ""), ind);
      }
      if (ts.isArrayBindingPattern(d.name) && init && ts.isArrayLiteralExpression(init) && init.elements.length >= d.name.elements.length && !init.elements.some(ts.isSpreadElement) && d.name.elements.every((b) => ts.isBindingElement(b) && ts.isIdentifier(b.name) && !b.dotDotDotToken && !b.initializer)) {
        // const [a, b] = [x, y]: element by element, through temps (the right side reads the old values)
        const temps = d.name.elements.map((b, i) => {
          const el = init.elements[i]!;
          const be = b as ts.BindingElement;
          const sym = this.checker.getSymbolAtLocation(be.name)!;
          const asserted = this.assertedNullable(el);
          const c = asserted ? asserted.cs : this.cs(this.checker.getTypeAtLocation(be), be);
          if (asserted) this.localCs.set(this.keyOf(sym), c);
          return { t: this.temp(), c, value: asserted ? asserted.code : this.exprTo(el, c), name: this.declName(be.name as ts.Identifier) };
        });
        return [...temps.map((x) => `${ind}var ${x.t} = ${x.value};`), ...temps.map((x) => `${ind}${x.c} ${x.name} = ${x.t};`)].join("\n");
      }
      if (!ts.isIdentifier(d.name)) {
        const t = this.temp();
        const src = this.expr(d.initializer!);
        return [`${ind}var ${t} = ${src.code};`, ...this.destructure(d.name, t, src.cs).map((x) => ind + x)].join("\n");
      }
      const sym = this.checker.getSymbolAtLocation(d.name)!;
      const width = this.scalarizable(d, list);
      if (width) {
        const lit = this.skipParensKeepAs(d.initializer!) as ts.ArrayLiteralExpression;
        const arr = this.cs(this.checker.getTypeOfSymbol(sym), d);
        const elem = arr.match(/^JsArray<(.*)>$/)?.[1] ?? "object";
        const base = this.declName(d.name);
        const names = lit.elements.map((_, i) => `${base}__${i}`);
        this.scalarized.set(this.keyOf(sym), names);
        // evaluated in order into the scalars, as the literal would be
        return lit.elements.map((el, i) => `${ind}${elem} ${names[i]} = ${this.exprTo(el, elem)};`).join("\n");
      }
      // const next = xs[i + 1]; if (next === undefined) ...: a read past the end that the code tests
      const oor = this.testedArrayRead(d, sym);
      if (oor) {
        this.localCs.set(this.keyOf(sym), oor.cs);
        return `${ind}${oor.cs} ${this.declName(d.name)} = ${oor.code};`;
      }
      const asserted = this.assertedNullable(d.initializer);
      if (asserted) {
        this.localCs.set(this.keyOf(sym), asserted.cs);
        return `${ind}${asserted.cs} ${this.declName(d.name)} = ${asserted.code};`;
      }
      const rec = this.recordLiteral(d.initializer) ?? this.classView(d.initializer);
      if (rec) this.localCs.set(this.keyOf(sym), rec);
      const c = rec ?? this.cs(this.checker.getTypeOfSymbol(sym), d);
      const name = this.declName(d.name);
      if (!d.initializer) return `${ind}${c} ${name} = ${VALUE_TYPES.has(c) ? `default(${c})` : "default"};`;
      return `${ind}${c} ${name} = ${this.exprTo(d.initializer, c)};`;
    }).join("\n");
  }

  /** Declarations binding a destructuring pattern from `src` (a temp of C# type `srcCs`). */
  private destructure(pattern: ts.BindingName, src: string, srcCs: string): string[] {
    const out: string[] = [];
    if (ts.isArrayBindingPattern(pattern)) {
      const elem = srcCs.match(/^JsArray<(.*)>$/)?.[1] ?? "object";
      pattern.elements.forEach((e, i) => {
        if (ts.isOmittedExpression(e)) return;
        if (e.dotDotDotToken) {
          if (!ts.isIdentifier(e.name)) {
            out.push(`${this.fail(e, "nested rest pattern").code};`);
            return;
          }
          const rc = this.cs(this.checker.getTypeAtLocation(e), e);
          out.push(`${rc} ${this.declName(e.name)} = ${this.coerce(`${src}.slice(${i})`, srcCs, rc)};`);
          return;
        }
        // an element whose C# type is not known to be an array: indexed at run time
        const access = srcCs === "object" ? `JsRt.At(${src}, ${i}.0)` : `${src}[${i}]`;
        if (ts.isIdentifier(e.name)) {
          const c = this.cs(this.checker.getTypeAtLocation(e), e);
          // an element that may be missing (a shorter tuple of a union): read as undefined
          let value = c === `${elem}?` && VALUE_TYPES.has(elem) && srcCs !== "object" ? `JsRt.ReadOrNull(${src}, ${i}.0)` : this.coerce(access, elem, c);
          if (e.initializer) value = `(${src}.length > ${i} ? ${value} : ${this.exprTo(e.initializer, c)})`;
          out.push(`${c} ${this.declName(e.name)} = ${value};`);
        } else {
          const t = this.temp();
          out.push(`var ${t} = ${access};`, ...this.destructure(e.name, t, elem));
        }
      });
      return out;
    }
    for (const e of (pattern as ts.ObjectBindingPattern).elements) {
      if (e.dotDotDotToken) {
        // a fresh object with the fields the rest type has (the others are not copied)
        const rc = this.cs(this.checker.getTypeAtLocation(e), e);
        if (!this.isDataClassName(rc) || !ts.isIdentifier(e.name)) {
          out.push(`${this.fail(e, "rest element").code};`);
          continue;
        }
        out.push(`${rc} ${this.declName(e.name)} = JsRt.Obj(new ${rc}(), (${rc} __r) => JsRt.Assign(__r, ${src}));`);
        continue;
      }
      const key = (e.propertyName ?? e.name).getText();
      const field = this.isDataClassName(srcCs) ? `${src}.${Transpiler.escape(key)}` : srcCs.startsWith("JsRecord<") ? `${src}["${key}"]` : `${src}.${Transpiler.escape(key)}`;
      const fieldCs = this.fieldCs(srcCs, key);
      if (ts.isIdentifier(e.name)) {
        const c = this.cs(this.checker.getTypeAtLocation(e), e);
        let value = this.coerce(field, fieldCs, c);
        // the default applies when the key is absent (undefined), not when it holds null
        // (a field that cannot hold null: its null is undefined, whether present or not)
        const nullField = this.dataClasses.get(srcCs)?.fields.find((x) => x.js === key)?.nullable;
        if (e.initializer && VALUE_TYPES.has(fieldCs)) {
          // a field that is always set: its default never applies
        } else if (e.initializer) value = this.isDataClassName(srcCs) && nullField ? `(${src}.__has(${this.str(key)}) ? ${value} : ${this.exprTo(e.initializer, c)})` : `(${field} ?? ${this.exprTo(e.initializer, c)})`;
        out.push(`${c} ${this.declName(e.name)} = ${value};`);
      } else {
        const t = this.temp();
        out.push(`var ${t} = ${field};`, ...this.destructure(e.name, t, fieldCs));
      }
    }
    return out;
  }

  private fieldCs(classCs: string, key: string): string {
    const d = this.dataClasses.get(classCs);
    if (d) return d.fields.find((f) => f.js === key)?.cs ?? "object";
    const rec = classCs.match(/^JsRecord<(.*)>$/);
    return rec ? rec[1]! : "object";
  }

  private forStmt(s: ts.ForStatement, ind: string): string {
    let init = "";
    let hoisted = "";
    if (s.initializer) {
      if (ts.isVariableDeclarationList(s.initializer)) {
        const decls = s.initializer.declarations.map((d) => {
          if (!ts.isIdentifier(d.name)) throw new TranspileError(`${this.where(d)}: destructuring in a for initializer`);
          const sym = this.checker.getSymbolAtLocation(d.name)!;
          const c = this.cs(this.checker.getTypeOfSymbol(sym), d);
          return { c, name: this.declName(d.name), value: d.initializer ? this.exprTo(d.initializer, c) : `default(${c})` };
        });
        if (new Set(decls.map((d) => d.c)).size === 1) init = `${decls[0]!.c} ${decls.map((d) => `${d.name} = ${d.value}`).join(", ")}`;
        else hoisted = decls.map((d) => `${ind}${d.c} ${d.name} = ${d.value};\n`).join("");
      } else {
        init = this.commaList(s.initializer).join(", ");
      }
    }
    const cond = s.condition ? this.cond(s.condition) : "";
    const inc = s.incrementor ? this.commaList(s.incrementor).join(", ") : "";
    const loop = `${hoisted ? ind + "    " : ind}for (${init}; ${cond}; ${inc})\n${this.block(s.statement, hoisted ? ind + "    " : ind)}`;
    return hoisted ? `${ind}{\n${hoisted.replace(/^/gm, "    ")}${loop}\n${ind}}` : loop;
  }

  private commaList(e: ts.Expression): string[] {
    if (ts.isBinaryExpression(e) && e.operatorToken.kind === ts.SyntaxKind.CommaToken) return [...this.commaList(e.left), ...this.commaList(e.right)];
    return [this.exprStatement(e)];
  }

  private forOf(s: ts.ForOfStatement, ind: string): string {
    const entries = this.entriesLoop(s, ind);
    if (entries !== null) return entries;
    const lit = this.skipParensKeepAs(s.expression);
    let src = this.expr(s.expression);
    // a string iterates its characters (code points)
    if (src.cs === "string") src = { code: `JsRt.Chars(${src.code})`, cs: "JsArray<string>" };
    if (src.cs === "object") src = { code: `JsRt.Iterate(${src.code})`, cs: "object" };
    if (ts.isArrayLiteralExpression(lit) && !lit.elements.some(ts.isSpreadElement) && src.cs.startsWith("JsArray<")) {
      // nothing else can see the literal, so a plain C# array: one allocation, the same order
      const elem = src.cs.slice(8, -1);
      src = { code: `new ${elem}[] { ${lit.elements.map((el) => this.exprTo(el, elem)).join(", ")} }`, cs: src.cs };
    }
    const elem = this.iterElement(src.cs, s.expression);
    const decl = s.initializer;
    if (!ts.isVariableDeclarationList(decl)) return `${ind}${this.fail(s, "for-of without a declaration").code};`;
    const binding = decl.declarations[0]!.name;
    if (ts.isIdentifier(binding)) {
      const c = this.cs(this.checker.getTypeAtLocation(binding), binding);
      const name = this.declName(binding);
      if (c === elem) return `${ind}foreach (${c} ${name} in ${src.code})\n${this.block(s.statement, ind)}`;
      const t = this.temp();
      const body = ts.isBlock(s.statement) ? s.statement.statements : [s.statement];
      return `${ind}foreach (${elem} ${t} in ${src.code})\n${ind}{\n${ind}    ${c} ${name} = ${this.coerce(t, elem, c)};\n${body.map((x) => this.stmt(x, ind + "    ")).join("\n")}\n${ind}}`;
    }
    const t = this.temp();
    const body = ts.isBlock(s.statement) ? s.statement.statements : [s.statement];
    return `${ind}foreach (${elem} ${t} in ${src.code})\n${ind}{\n${this.destructure(binding, t, elem).map((x) => `${ind}    ${x}`).join("\n")}\n${body.map((x) => this.stmt(x, ind + "    ")).join("\n")}\n${ind}}`;
  }

  /**
   * `for (const [i, x] of a.entries())`: an index loop over `a`, the length read each step
   * (an array iterator is live), `i` the index and `x` the element - no pair per step.
   */
  private entriesLoop(s: ts.ForOfStatement, ind: string): string | null {
    const call = this.skipParensKeepAs(s.expression);
    if (!ts.isCallExpression(call) || call.arguments.length || !ts.isPropertyAccessExpression(call.expression) || call.expression.name.text !== "entries") return null;
    const decl = s.initializer;
    if (!ts.isVariableDeclarationList(decl)) return null;
    const pattern = decl.declarations[0]!.name;
    if (!ts.isArrayBindingPattern(pattern) || pattern.elements.length > 2 || pattern.elements.some((e) => ts.isBindingElement(e) && (e.dotDotDotToken || e.initializer))) return null;
    const arr = this.expr(call.expression.expression);
    if (!arr.cs.startsWith("JsArray<")) return null;
    const elem = arr.cs.slice(8, -1);
    const a = this.temp();
    const k = this.temp();
    const head: string[] = [];
    const [iEl, xEl] = pattern.elements;
    if (iEl && ts.isBindingElement(iEl) && ts.isIdentifier(iEl.name)) head.push(`double ${this.declName(iEl.name)} = ${k};`);
    if (xEl && ts.isBindingElement(xEl)) {
      if (ts.isIdentifier(xEl.name)) {
        const c = this.cs(this.checker.getTypeAtLocation(xEl), xEl);
        head.push(`${c} ${this.declName(xEl.name)} = ${this.coerce(`${a}[${k}]`, elem, c)};`);
      } else {
        const t = this.temp();
        head.push(`var ${t} = ${a}[${k}];`, ...this.destructure(xEl.name, t, elem));
      }
    }
    const body = ts.isBlock(s.statement) ? s.statement.statements : [s.statement];
    const saved = this.ctx.breakLabel;
    this.ctx.breakLabel = null;
    try {
      return [`${ind}{`, `${ind}    var ${a} = ${arr.code};`, `${ind}    for (int ${k} = 0; ${k} < ${a}.Count; ${k}++)`, `${ind}    {`, ...head.map((h) => `${ind}        ${h}`), ...body.map((x) => this.stmt(x, ind + "        ")), `${ind}    }`, `${ind}}`].join("\n");
    } finally {
      this.ctx.breakLabel = saved;
    }
  }

  /** What iterating a C# value yields. */
  private iterElement(cs: string, node: ts.Node): string {
    let m = cs.match(/^JsArray<(.*)>$/) ?? cs.match(/^JsSet<(.*)>$/);
    if (m) return m[1]!;
    if (cs.startsWith("JsMap<")) return "JsArray<object>";
    m = cs.match(/^JsRecord<(.*)>$/);
    if (m) throw new TranspileError(`${this.where(node)}: for-of over a record`);
    // a value TypeScript types as a union of iterables (a Map or []): iterated at run time
    if (cs === "object") return "object";
    throw new TranspileError(`${this.where(node)}: for-of over ${cs}`);
  }

  // --- emission: expressions -----------------------------------------------------------

  /** An expression whose value is discarded (an expression statement, a for incrementor). */
  private exprStatement(e: ts.Expression): string {
    const x = ts.isParenthesizedExpression(e) ? e.expression : e;
    // a, b as a statement: both, in order
    if (ts.isBinaryExpression(x) && x.operatorToken.kind === ts.SyntaxKind.CommaToken) return `{ ${this.exprStatement(x.left)}; ${this.exprStatement(x.right)}; }`;
    // void x (a "used" marker): x evaluated, the value dropped
    if (ts.isVoidExpression(x)) return ts.isIdentifier(x.expression) || ts.isLiteralExpression(x.expression) ? "{ }" : this.exprStatement(x.expression);
    if (ts.isBinaryExpression(x) && x.operatorToken.kind === ts.SyntaxKind.EqualsToken && (ts.isArrayLiteralExpression(x.left) || ts.isObjectLiteralExpression(x.left))) {
      return this.destructuringAssign(x.left, x.right);
    }
    if (ts.isBinaryExpression(x) && (x.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || x.operatorToken.kind === ts.SyntaxKind.BarBarToken)) {
      const neg = x.operatorToken.kind === ts.SyntaxKind.BarBarToken ? "!" : "";
      return `if (${neg}(${this.cond(x.left)})) { ${this.exprStatement(x.right)}; }`;
    }
    if (ts.isConditionalExpression(x)) return `if (${this.cond(x.condition)}) { ${this.exprStatement(x.whenTrue)}; } else { ${this.exprStatement(x.whenFalse)}; }`;
    const out = this.expr(x);
    // C# accepts only calls, assignments, increments and `new` as statements
    if (ts.isCallExpression(x) || ts.isNewExpression(x) || ts.isPostfixUnaryExpression(x) || ts.isPrefixUnaryExpression(x) && (x.operator === ts.SyntaxKind.PlusPlusToken || x.operator === ts.SyntaxKind.MinusMinusToken) || (ts.isBinaryExpression(x) && x.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && x.operatorToken.kind <= ts.SyntaxKind.LastAssignment)) {
      return out.code.replace(/^\((.*)\)$/s, (all, inner) => (this.balanced(inner) ? inner : all));
    }
    if (out.code === "null" || out.code === "default" || out.code === "default!") return "{ }";
    return `_ = ${out.code}`;
  }

  private balanced(s: string): boolean {
    let depth = 0;
    for (const ch of s) {
      if (ch === "(") depth++;
      else if (ch === ")" && --depth < 0) return false;
    }
    return depth === 0;
  }

  /** `[a, b] = [x, y]` and `[this.h, this.p] = tuple`: through temps. */
  private destructuringAssign(left: ts.ArrayLiteralExpression | ts.ObjectLiteralExpression, right: ts.Expression): string {
    if (!ts.isArrayLiteralExpression(left)) return this.fail(left, "object destructuring assignment").code;
    const targets = left.elements.map((el) => this.lvalue(el));
    const r = this.skipParens(right);
    if (ts.isArrayLiteralExpression(r) && r.elements.length === left.elements.length) {
      const temps = r.elements.map((el, i) => {
        const t = this.temp();
        return { t, code: `var ${t} = ${this.exprTo(el, targets[i]!.cs)};` };
      });
      return `{ ${temps.map((x) => x.code).join(" ")} ${targets.map((tg, i) => `${tg.code} = ${temps[i]!.t};`).join(" ")} }`;
    }
    const src = this.expr(right);
    const t = this.temp();
    const elem = src.cs.match(/^JsArray<(.*)>$/)?.[1] ?? "object";
    return `{ var ${t} = ${src.code}; ${targets.map((tg, i) => `${tg.code} = ${this.coerce(`${t}[${i}]`, elem, tg.cs)};`).join(" ")} }`;
  }

  /** An assignment target and its C# type. */
  private lvalue(e: ts.Expression): Out {
    const x = this.expr(e, true);
    return x;
  }

  /** An expression converted to the C# type `to`. */
  exprTo(e: ts.Expression, to: string): string {
    const x = this.skipParensKeepAs(e);
    if (ts.isObjectLiteralExpression(x)) {
      const out = this.objectLiteral(x, to);
      return this.coerce(out.code, out.cs, to);
    }
    if (ts.isArrayLiteralExpression(x)) {
      const out = this.arrayLiteral(x, to);
      return this.coerce(out.code, out.cs, to);
    }
    if (ts.isArrowFunction(x) || ts.isFunctionExpression(x)) {
      const out = this.lambda(x, /Func<.*JsVoid>$/.test(to) || to === "global::System.Func<JsVoid>", this.delegateShape(to) ? to : undefined);
      // parenthesized: a lambda is no operand of ?? or ?: in C# without them
      return `(${out.code})`;
    }
    if (to === "bool" || to === "bool?") {
      const t = this.tsCs(x);
      if (t !== "bool" && t !== "bool?") return this.cond(x);
    }
    const out = this.expr(x);
    return this.coerce(out.code, out.cs, to);
  }

  private skipParensKeepAs(e: ts.Expression): ts.Expression {
    while (ts.isParenthesizedExpression(e) || ts.isSatisfiesExpression(e) || (ts.isAsExpression(e) && this.isConstAssertion(e))) e = e.expression;
    return e;
  }

  /** A condition: JS truthiness, made a C# bool. */
  cond(e: ts.Expression): string {
    const x = this.skipParensKeepAs(e);
    if (ts.isPrefixUnaryExpression(x) && x.operator === ts.SyntaxKind.ExclamationToken) return `!(${this.cond(x.operand)})`;
    if (ts.isBinaryExpression(x)) {
      const k = x.operatorToken.kind;
      if (k === ts.SyntaxKind.AmpersandAmpersandToken) return `(${this.cond(x.left)} && ${this.cond(x.right)})`;
      if (k === ts.SyntaxKind.BarBarToken) return `(${this.cond(x.left)} || ${this.cond(x.right)})`;
    }
    const out = this.expr(x);
    if (out.cs === "bool") return out.code;
    return `JsRt.Truthy(${out.code})`;
  }

  /** An expression with its C# type converted to the C# mapping of its TS type. */
  expr(e: ts.Expression, lvalue = false): Out {
    const raw = this.exprRaw(e, lvalue);
    if (lvalue || raw.cs === "null" || raw.cs === "module") return raw;
    // a local kept wider than its TS type (`const a = x!` over a value that is really null): not narrowed
    // back here - each use converts it to what it needs, and an untyped slot keeps the null
    if (ts.isIdentifier(e)) {
      const sym = this.resolve(this.symbolOf(e));
      if (sym && this.localCs.has(this.keyOf(sym))) return raw;
      // a constant built from a record spread is the record, not the shape of its named keys
      const decl = sym?.valueDeclaration;
      if (raw.cs.startsWith("JsRecord<") && decl && ts.isVariableDeclaration(decl) && this.recordLiteral(decl.initializer)) return raw;
    }
    // a class instance viewed by its fields (`this as { m }`) stays the class instance
    if (ts.isAsExpression(e) && this.classView(e)) return raw;
    // literals, functions and `new` already have the type they are built with (new Map() its declared one)
    if (ts.isObjectLiteralExpression(e) || ts.isArrayLiteralExpression(e) || ts.isArrowFunction(e) || ts.isFunctionExpression(e) || ts.isNewExpression(e)) return raw;
    // an assignment's value is the target's: converting it would store one object and hand on a copy
    if (ts.isBinaryExpression(e) && e.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && e.operatorToken.kind <= ts.SyntaxKind.LastAssignment) return raw;
    const t = this.checker.getTypeAtLocation(e);
    // a literal's own (fresh) type never asks for a conversion of a value already built as its contextual class
    if (t.flags & ts.TypeFlags.Object && (t as ts.ObjectType).objectFlags & ts.ObjectFlags.ObjectLiteral && this.isDataClassName(raw.cs)) return raw;
    let want: string;
    try {
      want = this.cs(t, e);
    } catch {
      return raw;
    }
    if (want === "void") return raw;
    // a merged union narrowed to one of its members (`"spire" in s`): the same object, read as it is
    if (this.mergedNames.has(raw.cs) && this.isDataClassName(want) && want !== raw.cs) {
      const has = new Set(this.dataClasses.get(raw.cs)!.fields.map((f) => f.js));
      if (this.dataClasses.get(want)!.fields.every((f) => has.has(f.js))) return raw;
    }
    return { code: this.coerce(raw.code, raw.cs, want), cs: want };
  }

  private exprRaw(e: ts.Expression, lvalue: boolean): Out {
    this.flushData();
    switch (e.kind) {
      case ts.SyntaxKind.NumericLiteral: return { code: this.num(Number((e as ts.NumericLiteral).text)), cs: "double" };
      case ts.SyntaxKind.StringLiteral:
      case ts.SyntaxKind.NoSubstitutionTemplateLiteral: return { code: this.str((e as ts.StringLiteral).text), cs: "string" };
      case ts.SyntaxKind.TrueKeyword: return { code: "true", cs: "bool" };
      case ts.SyntaxKind.FalseKeyword: return { code: "false", cs: "bool" };
      case ts.SyntaxKind.NullKeyword: return { code: "null", cs: "null" };
      case ts.SyntaxKind.ThisKeyword: return { code: "this", cs: this.ctx.className ?? "object" };
      case ts.SyntaxKind.SuperKeyword: return { code: "base", cs: "object" };
      default: break;
    }
    if (ts.isIdentifier(e)) return this.identifier(e);
    if (ts.isParenthesizedExpression(e)) {
      const inner = this.expr(e.expression, lvalue);
      return { code: `(${inner.code})`, cs: inner.cs };
    }
    if (ts.isAsExpression(e) || ts.isTypeAssertionExpression(e)) {
      if (ts.isAsExpression(e) && this.isConstAssertion(e)) return this.exprRaw(e.expression, lvalue);
      const to = this.cs(this.checker.getTypeFromTypeNode(e.type), e);
      let lit: ts.Expression = e.expression;
      while (ts.isParenthesizedExpression(lit) || ts.isAsExpression(lit)) lit = lit.expression;
      if (ts.isObjectLiteralExpression(lit) && this.isClassName(to)) return this.duckLiteral(lit, to);
      const inner = this.expr(e.expression);
      // `this as { m: MeshBuilder }`: a view of a class instance by fields it has, which the code may
      // write through (a builder swapped for a scratch one) - the same object, not a copy
      if (this.isClassName(inner.cs) && this.isDataClassName(to)) {
        const fields = this.dataClasses.get(to)!.fields;
        const own = this.checker.getApparentType(this.checker.getTypeAtLocation(e.expression));
        if (fields.every((f) => own.getProperty(f.js))) return inner;
      }
      return { code: this.coerce(inner.code, inner.cs, to), cs: to };
    }
    if (ts.isSatisfiesExpression(e)) return this.exprRaw(e.expression, lvalue);
    if (ts.isNonNullExpression(e)) {
      const inner = this.exprRaw(e.expression, lvalue);
      return inner;
    }
    if (ts.isTemplateExpression(e)) {
      const parts: string[] = [];
      if (e.head.text) parts.push(this.str(e.head.text));
      for (const span of e.templateSpans) {
        parts.push(this.strOf(span.expression));
        if (span.literal.text) parts.push(this.str(span.literal.text));
      }
      return { code: parts.length ? `(${parts.join(" + ")})` : `""`, cs: "string" };
    }
    if (ts.isPropertyAccessExpression(e)) return this.propertyAccess(e);
    if (ts.isElementAccessExpression(e)) return this.elementAccess(e);
    if (ts.isCallExpression(e)) return this.call(e);
    if (ts.isNewExpression(e)) return this.newExpr(e);
    if (ts.isBinaryExpression(e)) return this.binary(e);
    if (ts.isPrefixUnaryExpression(e)) return this.prefix(e);
    if (ts.isPostfixUnaryExpression(e)) {
      const op = e.operator === ts.SyntaxKind.PlusPlusToken ? "++" : "--";
      return { code: `${this.expr(e.operand, true).code}${op}`, cs: "double" };
    }
    if (ts.isConditionalExpression(e)) {
      const c = this.tsCs(e);
      // method groups have no type of their own in a C# conditional: each branch as the delegate
      const branch = (x: ts.Expression) => (this.delegateShape(c) ? `((${c})(${this.exprTo(x, c)}))` : this.exprTo(x, c));
      return { code: `(${this.cond(e.condition)} ? ${branch(e.whenTrue)} : ${branch(e.whenFalse)})`, cs: c };
    }
    if (ts.isObjectLiteralExpression(e)) return this.objectLiteral(e, null);
    if (ts.isArrayLiteralExpression(e)) return this.arrayLiteral(e, null);
    if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) {
      const out = this.lambda(e, false);
      return { code: `(${out.code})`, cs: out.cs };
    }
    if (ts.isDeleteExpression(e)) {
      const target = this.skipParensKeepAs(e.expression);
      if (ts.isElementAccessExpression(target)) {
        const obj = this.expr(target.expression);
        if (obj.cs.startsWith("JsRecord<") || obj.cs.startsWith("JsMap<")) return { code: `${obj.code}.delete(${this.exprTo(target.argumentExpression, "string")})`, cs: "bool" };
      }
      if (ts.isPropertyAccessExpression(target)) {
        const obj = this.expr(target.expression);
        if (this.isDataClassName(obj.cs)) return { code: `${obj.code}.__delete(${this.str(target.name.text)})`, cs: "bool" };
      }
      return this.fail(e, "delete of anything but a record key or a shape field");
    }
    if (ts.isVoidExpression(e)) return { code: `JsRt.Void(${this.expr(e.expression).code})`, cs: "null" };
    if (ts.isRegularExpressionLiteral(e)) return this.fail(e, "regular expression outside .test() and .replace()");
    return this.fail(e, "expression");
  }

  private num(v: number): string {
    if (Number.isNaN(v)) return "double.NaN";
    if (!Number.isFinite(v)) return v > 0 ? "double.PositiveInfinity" : "double.NegativeInfinity";
    const s = String(v);
    // a C# literal with a point or an exponent is a double; 1 would be an int (1 / 2 == 0)
    return /[.e]/.test(s) ? s : `${s}.0`;
  }

  private str(s: string): string {
    return JSON.stringify(s).replace(/\\u2028/g, "\\u2028");
  }

  /** A value as a string, as a template literal or `+` with a string converts it. */
  private strOf(e: ts.Expression): string {
    const out = this.expr(e);
    if (out.cs === "string") return out.code;
    return `JsRt.Str(${out.code})`;
  }

  private identifier(e: ts.Identifier): Out {
    if (e.text === "undefined") return { code: "null", cs: "null" };
    if (e.text === "Infinity") return { code: "double.PositiveInfinity", cs: "double" };
    if (e.text === "NaN") return { code: "double.NaN", cs: "double" };
    const shorthand = ts.isShorthandPropertyAssignment(e.parent) && e.parent.name === e;
    const sym = this.resolve(shorthand ? this.checker.getShorthandAssignmentValueSymbol(e.parent) : this.checker.getSymbolAtLocation(e));
    if (!sym) return this.fail(e, "identifier without a symbol");
    const decl = sym.valueDeclaration ?? sym.declarations?.[0];
    if (!decl) return this.fail(e, "identifier without a declaration");
    // a class used as a value: its name
    if (ts.isClassDeclaration(decl)) return { code: this.className(decl), cs: "object" };
    // import * as kit from "./kit.ts": the module's static class
    if (ts.isSourceFile(decl)) return { code: this.moduleClass(decl.fileName), cs: "module" };
    const top = this.topLevel(decl);
    const declaredCs = () => this.cs(this.checker.getTypeOfSymbol(sym), e);
    const moduleLevel = (top as ts.Node | null) === decl || (!!top && ts.isVariableStatement(top) && (ts.isVariableDeclaration(decl) || ts.isBindingElement(decl)) && !ts.findAncestor(decl, (n) => ts.isFunctionLike(n) || n === top));
    if (moduleLevel || (top && ts.isVariableStatement(top) && decl.parent?.parent === top)) {
      if (!this.inGenerator(decl)) return this.fail(e, "a global outside the supported set");
      const mod = this.moduleClass(decl.getSourceFile().fileName);
      const init = ts.isVariableDeclaration(decl) && decl.initializer ? this.skipParens(decl.initializer) : null;
      const isMethod = ts.isFunctionDeclaration(decl) || (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)));
      // a module constant built from a record spread is a record, wherever it is read from first
      const rec = !isMethod && ts.isVariableDeclaration(decl) ? this.recordLiteral(decl.initializer) : null;
      return { code: `${mod}.${Transpiler.escape(sym.name)}`, cs: isMethod ? this.methodGroupCs(decl, init) : rec ?? this.localCs.get(this.keyOf(sym)) ?? declaredCs() };
    }
    const local = this.localNames.get(this.keyOf(sym)) ?? this.localName(sym, sym.name);
    const init = ts.isVariableDeclaration(decl) && decl.initializer ? this.skipParens(decl.initializer) : null;
    if (ts.isFunctionDeclaration(decl) || (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) && decl.parent.flags & ts.NodeFlags.Const)) {
      return { code: local, cs: this.methodGroupCs(decl, init) };
    }
    return { code: local, cs: this.localCs.get(this.keyOf(sym)) ?? declaredCs() };
  }

  /**
   * Whether a `const` array-literal local can live as scalars: every use is a read of a
   * constant in-range index (`u[1]`), never the array itself (passed, returned, iterated,
   * assigned into, captured as a whole). Its elements are then one local each - the same
   * values and arithmetic, and no array allocated (every triangle's edge and normal vectors).
   */
  private scalarizable(d: ts.VariableDeclaration, list: ts.VariableDeclarationList): number {
    if (!(list.flags & ts.NodeFlags.Const) || !ts.isIdentifier(d.name) || !d.initializer) return 0;
    const init = this.skipParensKeepAs(d.initializer);
    if (!ts.isArrayLiteralExpression(init) || !init.elements.length || init.elements.some(ts.isSpreadElement)) return 0;
    const n = init.elements.length;
    const sym = this.checker.getSymbolAtLocation(d.name);
    const scope = ts.findAncestor(d, (x) => ts.isBlock(x) || ts.isSourceFile(x));
    if (!sym || !scope) return 0;
    let ok = true;
    const visit = (node: ts.Node): void => {
      if (!ok) return;
      const ns = ts.isIdentifier(node) && node !== d.name ? this.symbolOf(node) : undefined;
      if (ns && this.keyOf(ns) === this.keyOf(sym)) {
        const p = node.parent;
        const read = ts.isElementAccessExpression(p) && p.expression === node && ts.isNumericLiteral(p.argumentExpression) && Number(p.argumentExpression.text) < n && Number.isInteger(Number(p.argumentExpression.text));
        const written = read && ((ts.isBinaryExpression(p.parent) && p.parent.left === p && p.parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && p.parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment) || ts.isPrefixUnaryExpression(p.parent) || ts.isPostfixUnaryExpression(p.parent));
        if (!read || written) ok = false;
      }
      ts.forEachChild(node, visit);
    };
    visit(scope);
    return ok ? n : 0;
  }

  /**
   * `const next = xs[i + 1]` from a number array, `next` later tested against undefined or
   * null in its scope: the read may be past the end, where JS gives undefined, so the local
   * is nullable and reads null there. Null when the pattern does not apply.
   */
  private testedArrayRead(d: ts.VariableDeclaration, sym: ts.Symbol): Out | null {
    const init = d.initializer && this.skipParensKeepAs(d.initializer);
    if (!init || !ts.isElementAccessExpression(init) || init.questionDotToken) return null;
    const scope = ts.findAncestor(d, ts.isBlock);
    if (!scope) return null;
    let tested = false;
    const visit = (n: ts.Node): void => {
      if (tested) return;
      if (ts.isBinaryExpression(n) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(n.operatorToken.kind)) {
        const sides = [n.left, n.right].map((x) => this.skipParens(x));
        if (sides.some((x) => this.isNullish(x)) && sides.some((x) => { const xs = ts.isIdentifier(x) ? this.symbolOf(x) : undefined; return !!xs && this.keyOf(xs) === this.keyOf(sym); })) tested = true;
      }
      ts.forEachChild(n, visit);
    };
    visit(scope);
    if (!tested) return null;
    const arr = this.expr(init.expression);
    const elem = arr.cs.match(/^JsArray<(.*)>$/)?.[1];
    if (!elem || !VALUE_TYPES.has(elem)) return null;
    return { code: `JsRt.ReadOrNull(${arr.code}, ${this.exprTo(init.argumentExpression, "double")})`, cs: `${elem}?` };
  }

  /**
   * An initializer `x!` whose value is a nullable number or boolean: TypeScript's `!`
   * drops null as well as undefined, and some code asserts a value that is really null
   * and then tests it (lodKit's cells). The local keeps the nullable C# type.
   */
  private assertedNullable(init: ts.Expression | undefined): Out | null {
    if (!init) return null;
    const x = this.skipParensKeepAs(init);
    if (!ts.isNonNullExpression(x)) return null;
    const raw = this.exprRaw(x.expression, false);
    return raw.cs.endsWith("?") && VALUE_TYPES.has(raw.cs.slice(0, -1)) ? raw : null;
  }

  private methodGroupCs(decl: ts.Node, init: ts.Expression | null): string {
    const fn = (ts.isFunctionDeclaration(decl) ? decl : init) as ts.SignatureDeclaration;
    const ret = this.returnCs(fn);
    return this.lambdaCs(fn, ret);
  }

  /** The C# type of a member as declared (before any narrowing at the use). */
  private declaredMemberCs(sym: ts.Symbol, node: ts.Node): string {
    const decl = sym.valueDeclaration ?? sym.declarations?.[0];
    if (decl && (ts.isMethodDeclaration(decl) || ts.isMethodSignature(decl))) return "object";
    let c = this.cs(this.checker.getTypeOfSymbol(sym), node);
    if (sym.flags & ts.SymbolFlags.Optional && VALUE_TYPES.has(c)) c = `${c}?`;
    return c;
  }

  private propertyAccess(e: ts.PropertyAccessExpression): Out {
    const name = e.name.text;
    const q = e.questionDotToken ? "?." : ".";
    // Math.PI and the other constants
    if (ts.isIdentifier(e.expression) && e.expression.text === "Math" && MATH_CONST[name]) return { code: MATH_CONST[name]!, cs: "double" };
    if (ts.isIdentifier(e.expression) && e.expression.text === "Number") {
      if (name === "EPSILON") return { code: "double.Epsilon * 0 + 2.220446049250313E-16", cs: "double" };
      if (name === "POSITIVE_INFINITY") return { code: "double.PositiveInfinity", cs: "double" };
      if (name === "MAX_SAFE_INTEGER") return { code: "9007199254740991.0", cs: "double" };
    }
    // map.keys().next().value: a fresh iterator's first value
    if (name === "value" && ts.isCallExpression(e.expression) && !e.expression.arguments.length && ts.isPropertyAccessExpression(e.expression.expression) && e.expression.expression.name.text === "next") {
      const it = this.expr(e.expression.expression.expression);
      if (it.cs.startsWith("JsArray<")) return { code: `${it.code}.at(0)`, cs: it.cs.slice(8, -1) };
    }
    // patching a class's methods at run time (lodClassic's recordCoach) has no C# equivalent yet
    if (name === "prototype") return this.fail(e, "a class prototype patched at run time");
    const obj = this.expr(e.expression);
    const chained = !!e.questionDotToken || ts.isOptionalChain(e);
    const num = chained ? "double?" : "double";
    if (name === "length" && (obj.cs.startsWith("JsArray<"))) return { code: `${obj.code}${q}length`, cs: num };
    if (name === "length" && obj.cs === "string") return { code: chained ? `((double?)${obj.code}?.Length)` : `((double)${obj.code}.Length)`, cs: num };
    if (name === "size" && (obj.cs.startsWith("JsMap<") || obj.cs.startsWith("JsSet<"))) return { code: `${obj.code}${q}size`, cs: num };
    if (obj.cs.startsWith("JsRecord<")) return { code: `${obj.code}${q.replace(".", "")}["${name}"]`.replace("?[", "?["), cs: obj.cs.slice(9, -1) };
    // C#'s ?. lifts a number to double?, here or anywhere earlier in the chain
    const lift = (c: string) => ((e.questionDotToken || ts.isOptionalChain(e)) && VALUE_TYPES.has(c) ? `${c}?` : c);
    // f.name of a function value: the name of the function it holds
    if (name === "name" && this.delegateShape(obj.cs)) return { code: `JsRt.FnName(${obj.code})`, cs: "string" };
    // a value whose C# type is object (a union of named types): the property looked up at run time
    if (obj.cs === "object") return { code: `JsRt.Get(${obj.code}, ${this.str(name)})`, cs: "object" };
    // a shape class's field: its C# type as declared there (a merged union's is nullable)
    if (this.isDataClassName(obj.cs)) return { code: `${obj.code}${q}${Transpiler.escape(name)}`, cs: lift(this.fieldCs(obj.cs, name)) };
    const sym = this.checker.getSymbolAtLocation(e.name);
    const memberCs = sym ? this.declaredMemberCs(sym, e) : "object";
    return { code: `${obj.code}${q}${Transpiler.escape(name)}`, cs: lift(memberCs) };
  }

  private elementAccess(e: ts.ElementAccessExpression): Out {
    if (ts.isIdentifier(e.expression) && ts.isNumericLiteral(e.argumentExpression)) {
      const sym = this.checker.getSymbolAtLocation(e.expression);
      const names = sym && this.scalarized.get(this.keyOf(sym));
      if (names) {
        const arr = this.cs(this.checker.getTypeOfSymbol(sym!), e);
        return { code: names[Number(e.argumentExpression.text)]!, cs: arr.match(/^JsArray<(.*)>$/)?.[1] ?? "object" };
      }
    }
    const obj = this.expr(e.expression);
    const q = e.questionDotToken ? "?" : "";
    const arg = this.skipParensKeepAs(e.argumentExpression);
    const m = obj.cs.match(/^JsArray<(.*)>$/);
    if (m) return { code: `${obj.code}${q}[${this.exprTo(arg, "double")}]`, cs: q && VALUE_TYPES.has(m[1]!) ? `${m[1]}?` : m[1]! };
    const r = obj.cs.match(/^JsRecord<(.*)>$/);
    if (r) return { code: `${obj.code}${q}[${this.exprTo(arg, "string")}]`, cs: r[1]! };
    if (obj.cs === "string") return { code: `JsRt.Str(${obj.code}[(int)(${this.exprTo(arg, "double")})])`, cs: "string" };
    if (this.isDataClassName(obj.cs)) {
      if (ts.isStringLiteral(arg)) return { code: `${obj.code}${q}.${Transpiler.escape(arg.text)}`, cs: this.fieldCs(obj.cs, arg.text) };
      return { code: `${obj.code}${q}.__get(${this.exprTo(arg, "string")})`, cs: "object" };
    }
    // a class member by a string key (c.m["palette"])
    if (ts.isStringLiteral(arg) && /^[A-Za-z_]\w*$/.test(arg.text) && !obj.cs.startsWith("Js") && obj.cs !== "object") return { code: `${obj.code}${q}.${Transpiler.escape(arg.text)}`, cs: this.tsCs(e) };
    // an object whose C# type does not say it is an array (a union, a type parameter): index it at run time
    return { code: `JsRt.At(${obj.code}, ${this.exprTo(arg, "double")})`, cs: "object" };
  }

  // --- calls ---------------------------------------------------------------------------

  /** Whether a callee is a function value (a delegate in C#), not a declared function or method. */
  private isDelegateCallee(callee: ts.Expression): boolean {
    const id = ts.isPropertyAccessExpression(callee) ? callee.name : ts.isIdentifier(callee) ? callee : null;
    if (!id) return true;
    const sym = this.resolve(this.checker.getSymbolAtLocation(id));
    const d = sym?.valueDeclaration;
    if (!d) return false;
    // a method of a class is a method; one of an object literal or a type is a function-valued field
    if (ts.isMethodDeclaration(d) || ts.isMethodSignature(d)) return !ts.isClassDeclaration(d.parent) && !ts.isClassExpression(d.parent);
    if (ts.isFunctionDeclaration(d) || ts.isClassDeclaration(d)) return false;
    if (ts.isVariableDeclaration(d) && d.initializer && d.parent.flags & ts.NodeFlags.Const) {
      const init = this.skipParens(d.initializer);
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return false; // a local function / static method
    }
    return true;
  }

  private args(call: ts.CallExpression | ts.NewExpression): string[] {
    const out = this.argsGiven(call);
    // a delegate has no optional parameters: the ones TypeScript let the call leave out are passed as default
    if (ts.isCallExpression(call) && this.isDelegateCallee(call.expression)) {
      const params = this.checker.getResolvedSignature(call)?.getParameters() ?? [];
      for (let i = out.length; i < params.length; i++) {
        const d = params[i]!.valueDeclaration;
        if (d && ts.isParameter(d) && d.dotDotDotToken) break;
        out.push("default");
      }
    }
    return out;
  }

  private argsGiven(call: ts.CallExpression | ts.NewExpression): string[] {
    const sig = this.checker.getResolvedSignature(call);
    const decl = sig?.getDeclaration();
    const params = sig?.getParameters() ?? [];
    const out: string[] = [];
    let slot = 0;
    const args = call.arguments ?? [];
    const restAt = params.findIndex((p) => {
      const d = p.valueDeclaration;
      return !!d && ts.isParameter(d) && !!d.dotDotDotToken;
    });
    for (let ai = 0; ai < args.length; ai++) {
      const a = args[ai]!;
      if (restAt >= 0 && slot >= restAt) {
        // the arguments the rest parameter takes: one by one, or as one array when any is spread
        const rc = this.cs(this.checker.getTypeOfSymbol(params[restAt]!), a);
        const re = rc.match(/^JsArray<(.*)>$/)?.[1] ?? "object";
        const rest = args.slice(ai);
        if (rest.some(ts.isSpreadElement)) out.push(`${this.collect(rest, re)}.ToArray()`);
        else out.push(...rest.map((x) => this.exprTo(x, re)));
        break;
      }
      if (ts.isSpreadElement(a)) {
        const t = this.checker.getTypeAtLocation(a.expression);
        if (!this.checker.isTupleType(t)) {
          out.push(this.fail(a, "spread argument of a non-tuple").code);
          continue;
        }
        const n = this.typeArgs(t).length;
        const src = this.expr(a.expression);
        const elem = src.cs.match(/^JsArray<(.*)>$/)?.[1] ?? "object";
        const keep = this.temp();
        for (let k = 0; k < n; k++, slot++) {
          const p = params[slot];
          let pc = p ? this.cs(this.checker.getTypeOfSymbol(p), a) : elem;
          if (pc === "void") pc = "object";
          const item = k === 0 ? `JsRt.First(${src.code}, out var ${keep})` : `${keep}[${k}]`;
          out.push(this.coerce(item, elem, pc));
        }
        continue;
      }
      out.push(this.argument(a, slot, params, decl));
      slot++;
    }
    return out;
  }

  private argument(a: ts.Expression, i: number, params: readonly ts.Symbol[], decl: ts.SignatureDeclaration | ts.JSDocSignature | undefined): string {
    {
      const p = params[i];
      if (!p) return this.expr(a).code;
      const pdecl = p.valueDeclaration;
      // a transpiled, non-generic callee: its C# parameter type as declared (a `this` type is its class), not as instantiated here
      // an argument that may be undefined, to a parameter with a constant default: JS then takes the default
      if (pdecl && ts.isParameter(pdecl) && pdecl.initializer && this.inGenerator(pdecl) && !this.isDelegateCallee((a.parent as ts.CallExpression).expression ?? a)) {
        const own = this.cs(this.checker.getTypeAtLocation(pdecl), a);
        const constant = this.constantDefault(pdecl.initializer, own);
        const at = this.tsCs(a);
        const argType = this.checker.getTypeAtLocation(a);
        const mayBeUndefined = argType.isUnion() && argType.types.some((x) => x.flags & ts.TypeFlags.Undefined);
        if (constant !== null && constant !== "null" && (at === `${own}?` || (!VALUE_TYPES.has(own) && mayBeUndefined))) return `(${this.exprTo(a, at)} ?? ${constant})`;
      }
      const declared = pdecl && ts.isParameter(pdecl) && this.inGenerator(pdecl) && decl && !(decl as ts.SignatureDeclaration).typeParameters?.length;
      let pc = this.cs(declared ? this.checker.getTypeAtLocation(pdecl) : this.checker.getTypeOfSymbol(p), a);
      if (pc === "void") pc = "object";
      if (pdecl && ts.isParameter(pdecl) && (pdecl.questionToken || pdecl.initializer) && VALUE_TYPES.has(pc)) pc = `${pc}?`;
      const x = this.skipParensKeepAs(a);
      if ((ts.isArrowFunction(x) || ts.isFunctionExpression(x)) && decl && this.returnsTypeParam(decl, i)) return this.lambda(x, true).code;
      if (decl && this.returnsTypeParam(decl, i)) {
        const f = this.expr(a);
        const act = f.cs.match(/^global::System\.Action(?:<(.*)>)?$/);
        if (act) {
          const ps = act[1] ? this.splitAll(act[1]) : [];
          const names = ps.map((_, k) => `__u${k}`);
          const call = /^[\w.@]+$/.test(f.code) ? `${f.code}(${names.join(", ")})` : `(${f.code}).Invoke(${names.join(", ")})`;
          return `((${ps.map((t, k) => `${t} ${names[k]}`).join(", ")}) => { ${call}; return JsVoid.I; })`;
        }
        return f.code;
      }
      return this.exprTo(a, pc);
    }
  }

  /** Arguments with spreads among them, gathered in order into one JsArray<elem>. */
  private collect(args: readonly ts.Expression[], elem: string): string {
    const parts = args.map((x) => {
      if (!ts.isSpreadElement(x)) return `.add(${this.exprTo(x, elem)})`;
      const src = this.expr(x.expression);
      return `.addAll(${this.coerce(src.code, src.cs, `JsArray<${elem}>`)})`;
    });
    return `new JsArray<${elem}>()${parts.join("")}`;
  }

  /** Whether the declared parameter `i` is a function returning a type parameter of `decl` (a generic T a void lambda fills). */
  private returnsTypeParam(decl: ts.SignatureDeclaration | ts.JSDocSignature, i: number): boolean {
    if (!ts.isFunctionLike(decl) || !("parameters" in decl)) return false;
    const p = (decl as ts.SignatureDeclaration).parameters[i];
    const tn = p?.type;
    if (!tn || !ts.isFunctionTypeNode(tn) || !ts.isTypeReferenceNode(tn.type)) return false;
    const tps = (decl as ts.SignatureDeclaration).typeParameters?.map((t) => t.name.text) ?? [];
    return tps.includes(tn.type.typeName.getText());
  }

  private call(e: ts.CallExpression): Out {
    const out = this.callInner(e);
    // in an optional chain (a?.b.f()), C# lifts a number or boolean result to its nullable form
    return ts.isOptionalChain(e) && VALUE_TYPES.has(out.cs) ? { code: out.code, cs: `${out.cs}?` } : out;
  }

  private callInner(e: ts.CallExpression): Out {
    // f?.(x): called only when f is there
    if (e.questionDotToken) {
      const f = this.expr(e.expression);
      return { code: `(${f.code})?.Invoke(${this.args(e).join(", ")})`, cs: this.callResultCs(e) };
    }
    const callee = e.expression;
    const resultCs = (): string => {
      const c = this.tsCs(e);
      return c;
    };
    if (ts.isPropertyAccessExpression(callee)) {
      const name = callee.name.text;
      const target = callee.expression;
      // Math.*, Object.*, Array.*, Number.*, JSON.*
      if (ts.isIdentifier(target) && this.isGlobal(target)) return this.globalCall(target.text, name, e);
      // a regular expression literal's .test(s)
      if (ts.isRegularExpressionLiteral(target) && name === "test") {
        const lit = target.text;
        const end = lit.lastIndexOf("/");
        return { code: `JsRt.Test(${this.str(lit.slice(1, end))}, ${this.str(lit.slice(end + 1))}, ${this.exprTo(e.arguments[0]!, "string")})`, cs: "bool" };
      }
      if (target.kind === ts.SyntaxKind.SuperKeyword) return { code: `base.${Transpiler.escape(name)}(${this.args(e).join(", ")})`, cs: resultCs() };
      const obj = this.expr(target);
      const q = callee.questionDotToken ? "?." : ".";
      if (obj.cs.startsWith("JsArray<")) return this.arrayCall(obj, name, e, q);
      if (obj.cs.startsWith("JsMap<") || obj.cs.startsWith("JsSet<") || obj.cs.startsWith("JsWeakMap<")) return this.collectionCall(obj, name, e, q);
      // a regular expression: s.replace(/x/g, ...)
      if (obj.cs === "string" && (name === "replace" || name === "replaceAll") && e.arguments[0] && ts.isRegularExpressionLiteral(e.arguments[0])) {
        const lit = e.arguments[0].text;
        const end = lit.lastIndexOf("/");
        const r = e.arguments[1]!;
        const rf = this.skipParensKeepAs(r);
        const repl = ts.isArrowFunction(rf) || ts.isFunctionExpression(rf) ? this.lambdaTo(rf, "string") : this.exprTo(r, "string");
        return { code: `JsRt.Replace(${obj.code}, ${this.str(lit.slice(1, end))}, ${this.str(lit.slice(end + 1))}, ${repl})`, cs: "string" };
      }
      // a record of functions: p.Y(d)
      if (obj.cs.startsWith("JsRecord<global::System.")) return { code: `${obj.code}[${this.str(name)}](${this.args(e).join(", ")})`, cs: this.callResultCs(e) };
      if (obj.cs === "string" || obj.cs === "double") {
        if (name === "toString" && !e.arguments.length) return { code: obj.cs === "string" ? obj.code : `JsRt.NumStr(${obj.code})`, cs: "string" };
        const args = e.arguments.map((a) => this.expr(a).code);
        return { code: `${obj.code}${q}${name}(${args.join(", ")})`, cs: resultCs() };
      }
      if (obj.cs.startsWith("JsRecord<")) return this.fail(e, `a method of a record (${name})`);
      // f.bind(x): the transpiled function reads no `this`, so the function itself
      if (name === "bind" && this.delegateShape(obj.cs)) return obj;
      if (name === "prototype" || (ts.isPropertyAccessExpression(target) && target.name.text === "prototype")) return this.fail(e, "a class prototype patched at run time");
      const sym = this.checker.getSymbolAtLocation(callee.name);
      const decl = sym?.valueDeclaration;
      // a member TS narrowed to a function (typeof x.f === "function") whose C# field is wider: through the delegate
      const member = this.expr(callee);
      if (this.delegateShape(member.cs) && (obj.cs === "object" || (this.isDataClassName(obj.cs) && !this.delegateShape(this.fieldCs(obj.cs, name))))) {
        return { code: `(${member.code}).Invoke(${this.args(e).join(", ")})`, cs: this.callResultCs(e) };
      }
      const call = `${obj.code}${q}${Transpiler.escape(name)}${this.typeArgsOf(e)}(${this.args(e).join(", ")})`;
      if (decl && (ts.isPropertyDeclaration(decl) || ts.isPropertySignature(decl) || ts.isParameter(decl))) {
        // a field holding a function
        return { code: call, cs: this.callResultCs(e) };
      }
      return { code: call, cs: this.callResultCs(e) };
    }
    if (ts.isIdentifier(callee)) {
      if (this.isGlobal(callee)) return this.globalFunction(callee.text, e);
      // a declared function is called as it is; a function value (narrowed from a union) through its delegate type
      const delegate = this.isDelegateCallee(callee);
      const fn = delegate ? this.expr(callee) : this.identifier(callee);
      return { code: `${fn.code}${delegate ? "" : this.typeArgsOf(e)}(${this.args(e).join(", ")})`, cs: this.callResultCs(e) };
    }
    // (() => ...)(): a lambda called where it stands, through its delegate type
    const inner = this.skipParensKeepAs(callee);
    if (ts.isArrowFunction(inner) || ts.isFunctionExpression(inner)) {
      const f = this.lambda(inner, false);
      return { code: `((${f.cs})(${f.code}))(${this.args(e).join(", ")})`, cs: this.callResultCs(e) };
    }
    const fn = this.expr(callee);
    return { code: `(${fn.code}).Invoke(${this.args(e).join(", ")})`, cs: this.callResultCs(e) };
  }

  /**
   * `<A, B>` for a call of a generic transpiled function, worked out by matching its declared
   * parameter and return types against the call's (C# cannot infer through a lambda as TS does);
   * empty when the callee is not generic or a type parameter stays unknown.
   */
  private typeArgsOf(e: ts.CallExpression): string {
    const sig = this.checker.getResolvedSignature(e);
    const decl = sig?.getDeclaration() as ts.SignatureDeclaration | undefined;
    const tps = decl ? this.keptTypeParams(decl) : undefined;
    if (!decl || !tps?.length || !(this.inGenerator(decl) || this.seamFiles.has(decl.getSourceFile().fileName))) return "";
    const bound = new Map<string, ts.Type>();
    const unify = (d: ts.Type, a: ts.Type, depth = 0): void => {
      if (depth > 6) return;
      if (d.flags & ts.TypeFlags.TypeParameter) {
        if (!bound.has(d.symbol.name)) bound.set(d.symbol.name, a);
        return;
      }
      if (d.isUnion()) {
        const rest = d.types.filter((x) => !this.isVoidLike(x));
        if (rest.length === 1) unify(rest[0]!, a.isUnion() ? (a.types.find((x) => !this.isVoidLike(x)) ?? a) : a, depth + 1);
        return;
      }
      if ((this.checker.isArrayType(d) || this.checker.isTupleType(d)) && (this.checker.isArrayType(a) || this.checker.isTupleType(a))) {
        const da = this.typeArgs(d), aa = this.typeArgs(a);
        if (da.length && aa.length) unify(da[0]!, aa[0]!, depth + 1);
        return;
      }
      const ds = d.getCallSignatures()[0], as = a.getCallSignatures()[0];
      if (ds && as) {
        ds.getParameters().forEach((p, i) => {
          const q = as.getParameters()[i];
          if (q) unify(this.checker.getTypeOfSymbol(p), this.checker.getTypeOfSymbol(q), depth + 1);
        });
        unify(ds.getReturnType(), as.getReturnType(), depth + 1);
        return;
      }
      if (d.aliasSymbol && d.aliasSymbol === a.aliasSymbol) (d.aliasTypeArguments ?? []).forEach((x, i) => a.aliasTypeArguments?.[i] && unify(x, a.aliasTypeArguments[i]!, depth + 1));
      const dr = d as ts.TypeReference, ar = a as ts.TypeReference;
      if (dr.target && dr.target === ar.target) this.typeArgs(d).forEach((x, i) => this.typeArgs(a)[i] && unify(x, this.typeArgs(a)[i]!, depth + 1));
    };
    decl.parameters.forEach((p, i) => {
      const arg = e.arguments[i];
      if (!arg || ts.isSpreadElement(arg) || p.dotDotDotToken) return;
      unify(this.checker.getTypeAtLocation(p), this.checker.getTypeAtLocation(arg));
    });
    const declRet = this.checker.getSignatureFromDeclaration(decl)?.getReturnType();
    if (declRet) unify(declRet, this.checker.getTypeAtLocation(e));
    if (!tps.every((tp) => bound.has(tp.name.text))) return "";
    try {
      return `<${tps.map((tp) => this.typeArgCs(bound.get(tp.name.text)!, e)).join(", ")}>`;
    } catch {
      return "";
    }
  }

  /** What a call to a transpiled function returns in C#: its declared return type, generic T as instantiated. */
  private callResultCs(e: ts.CallExpression): string {
    return this.callResultCsInner(e);
  }

  private callResultCsInner(e: ts.CallExpression): string {
    const sig = this.checker.getResolvedSignature(e);
    const decl = sig?.getDeclaration();
    if (decl && ts.isFunctionLike(decl) && (decl as ts.SignatureDeclaration).type && ts.isTypeReferenceNode((decl as ts.SignatureDeclaration).type!)) {
      const tps = (decl as ts.SignatureDeclaration).typeParameters?.map((t) => t.name.text) ?? [];
      if (tps.includes((decl as ts.SignatureDeclaration).type!.getText())) return this.typeArgCs(this.checker.getTypeAtLocation(e), e);
    }
    if (decl && ts.isFunctionLike(decl)) {
      const declared = this.checker.getSignatureFromDeclaration(decl as ts.SignatureDeclaration);
      if (declared && !(decl as ts.SignatureDeclaration).typeParameters?.length) return this.cs(declared.getReturnType(), e);
    }
    return this.tsCs(e);
  }

  private isGlobal(id: ts.Identifier): boolean {
    const sym = this.checker.getSymbolAtLocation(id);
    const decl = sym?.declarations?.[0];
    return !!decl && !this.inGenerator(decl) && !this.seamFiles.has(decl.getSourceFile().fileName);
  }

  private globalFunction(name: string, e: ts.CallExpression): Out {
    const a = e.arguments;
    switch (name) {
      case "String": return { code: this.strOf(a[0]!), cs: "string" };
      case "Number": return { code: this.tsCs(a[0]!) === "string" ? `JsRt.Num(${this.exprTo(a[0]!, "string")})` : this.exprTo(a[0]!, "double"), cs: "double" };
      case "parseFloat": return { code: `JsRt.Num(${this.exprTo(a[0]!, "string")})`, cs: "double" };
      case "isNaN": return { code: `double.IsNaN(${this.exprTo(a[0]!, "double")})`, cs: "bool" };
      case "isFinite": return { code: `double.IsFinite(${this.exprTo(a[0]!, "double")})`, cs: "bool" };
      case "Boolean": return { code: this.cond(a[0]!), cs: "bool" };
      case "parseInt": return { code: `JsRt.ParseInt(${this.exprTo(a[0]!, "string")}${a[1] ? `, ${this.exprTo(a[1], "double")}` : ""})`, cs: "double" };
      case "Array": {
        // Array(n) without new: n holes
        const c = this.tsCs(e);
        return { code: `JsRt.NewArray<${c.slice(8, -1)}>(${this.exprTo(a[0]!, "double")})`, cs: c };
      }
      default: return this.fail(e, `global function ${name}`);
    }
  }

  private globalCall(ns: string, name: string, e: ts.CallExpression): Out {
    const a = e.arguments;
    if (ns === "Math" && name === "imul") return { code: `JsRt.Imul(${this.exprTo(a[0]!, "double")}, ${this.exprTo(a[1]!, "double")})`, cs: "double" };
    if (ns === "Math") {
      const f = MATH[name];
      if (!f) return this.fail(e, `Math.${name}`);
      if (a.some(ts.isSpreadElement)) {
        // Math.max(x, ...ys): every argument in order, as one array
        if (name !== "min" && name !== "max" && name !== "hypot") return this.fail(e, `Math.${name}(...spread)`);
        const only = a.length === 1 ? (a[0] as ts.SpreadElement).expression : null;
        const arr = only ? this.exprTo(only, "JsArray<double>") : this.collect(a, "double");
        return { code: `${f}(${arr})`, cs: "double" };
      }
      return { code: `${f}(${a.map((x) => this.exprTo(x, "double")).join(", ")})`, cs: "double" };
    }
    if (ns === "Number") {
      if (name === "isFinite") return { code: `JsRt.IsFinite(${this.exprTo(a[0]!, "double")})`, cs: "bool" };
      if (name === "isInteger") return { code: `JsRt.IsInteger(${this.exprTo(a[0]!, "double")})`, cs: "bool" };
      if (name === "isNaN") return this.tsCs(a[0]!) === "double" ? { code: `double.IsNaN(${this.exprTo(a[0]!, "double")})`, cs: "bool" } : { code: `JsRt.IsNaNNumber(${this.expr(a[0]!).code})`, cs: "bool" };
    }
    if (ns === "JSON" && name === "stringify" && a.length === 1) return { code: `JsJson.Stringify(${this.expr(a[0]!).code})`, cs: "string" };
    // JSON.stringify(v, (key, value) => ...): the replacer applied to every value, as JS applies it
    if (ns === "JSON" && name === "stringify" && a.length === 2) {
      const f = this.skipParensKeepAs(a[1]!);
      if (ts.isArrowFunction(f) || ts.isFunctionExpression(f)) return { code: `JsJson.Stringify(${this.expr(a[0]!).code}, ${this.lambda(f, false, "global::System.Func<string, object, object>").code})`, cs: "string" };
    }
    if (ns === "Object" && name === "is") return { code: `JsRt.SameValue(${this.exprTo(a[0]!, "object")}, ${this.exprTo(a[1]!, "object")})`, cs: "bool" };
    if (ns === "Object") {
      const src = a[0] && this.expr(a[0]);
      const result = this.tsCs(e);
      switch (name) {
        case "keys":
          if (src!.cs.startsWith("JsRecord<")) return { code: `${src!.code}.keys()`, cs: "JsArray<string>" };
          if (this.isDataClassName(src!.cs)) return { code: `JsRt.Keys(${src!.code})`, cs: "JsArray<string>" };
          break;
        case "values":
          if (src!.cs.startsWith("JsRecord<")) return { code: `${src!.code}.values()`, cs: `JsArray<${src!.cs.slice(9, -1)}>` };
          if (this.isDataClassName(src!.cs)) return { code: `JsRt.Values(${src!.code})`, cs: "JsArray<object>" };
          break;
        case "entries":
          // a record of strings gives string pairs as they are, not boxed and converted back
          if (src!.cs === "JsRecord<string>" && result === "JsArray<JsArray<string>>") return { code: `${src!.code}.stringEntries()`, cs: result };
          if (src!.cs.startsWith("JsRecord<")) return { code: `${src!.code}.entries()`, cs: "JsArray<JsArray<object>>" };
          if (this.isDataClassName(src!.cs)) return { code: `JsRt.Entries(${src!.code})`, cs: "JsArray<JsArray<object>>" };
          break;
        case "fromEntries": {
          const rec = result.match(/^JsRecord<(.*)>$/);
          if (rec) return { code: `JsRecord<${rec[1]}>.fromEntries(${this.coerce(src!.code, src!.cs, "JsArray<JsArray<object>>")})`, cs: result };
          break;
        }
        case "freeze": return src!;
        case "assign": {
          // Object.assign(target, ...sources): every source's keys copied in, in order; the target returned
          let target = src!;
          // Object.assign({}, ...records): the empty target is a record of the sources' kind
          const firstRec = a.slice(1).map((x) => {
            const c2 = this.tsCs(ts.isSpreadElement(x) ? x.expression : x);
            return ts.isSpreadElement(x) ? c2.match(/^JsArray<(JsRecord<.*>)>$/)?.[1] : c2.startsWith("JsRecord<") ? c2 : undefined;
          }).find((c2) => c2);
          const t0 = this.skipParensKeepAs(a[0]!);
          if (firstRec && ts.isObjectLiteralExpression(t0) && !t0.properties.length) target = { code: `new ${firstRec}()`, cs: firstRec };
          const rec = target.cs.match(/^JsRecord<(.*)>$/);
          const sources = a.slice(1).map((x) => {
            if (ts.isSpreadElement(x)) {
              const s2 = this.expr(x.expression);
              return rec ? `.assignAll(${this.coerce(s2.code, s2.cs, `JsArray<${target.cs}>`)})` : `.assignAllObjects(${s2.code})`;
            }
            if (rec && ts.isObjectLiteralExpression(this.skipParensKeepAs(x))) return `.assign(${this.exprTo(x, target.cs)})`;
            const s2 = this.expr(x);
            return rec ? `.assign(${this.coerce(s2.code, s2.cs, target.cs)})` : `.assignObject(${s2.code})`;
          });
          if (rec) return { code: `(${target.code})${sources.join("")}`, cs: target.cs };
          return { code: `JsRt.AssignInto(${target.code}${a.slice(1).map((x) => `, ${ts.isSpreadElement(x) ? `${this.expr(x.expression).code}.ToArray()` : this.expr(x).code}`).join("")})`, cs: target.cs };
        }
        default: break;
      }
      return this.fail(e, `Object.${name}`);
    }
    if (ns === "Array") {
      if (name === "from" && a.length === 2 && ts.isObjectLiteralExpression(a[0]!)) {
        const len = (a[0] as ts.ObjectLiteralExpression).properties.find((p) => p.name?.getText() === "length");
        const f = this.skipParensKeepAs(a[1]!);
        if (len && ts.isPropertyAssignment(len) && (ts.isArrowFunction(f) || ts.isFunctionExpression(f))) {
          const elem = this.tsCs(e).match(/^JsArray<(.*)>$/)![1]!;
          const idx = f.parameters[1];
          const iName = idx && ts.isIdentifier(idx.name) ? this.declName(idx.name) : this.temp();
          const body = ts.isBlock(f.body) ? this.functionBody(f.body, elem, [], "") : this.exprTo(f.body, elem);
          return { code: `JsRt.ArrayFrom<${elem}>(${this.exprTo(len.initializer, "double")}, (double ${iName}) => ${body})`, cs: `JsArray<${elem}>` };
        }
      }
      if (name === "from" && a.length === 2 && ts.isObjectLiteralExpression(a[0]!)) {
        // Array.from({ length: n }, f) with a function value: f(undefined, i)
        const len = (a[0] as ts.ObjectLiteralExpression).properties.find((p) => p.name?.getText() === "length");
        const elem = this.tsCs(e).match(/^JsArray<(.*)>$/)![1]!;
        const f = this.expr(a[1]!);
        const shape = this.delegateShape(f.code === "" ? "" : f.cs);
        if (len && ts.isPropertyAssignment(len) && shape) {
          const call = (args: string) => (/^[\w.@]+$/.test(f.code) ? `${f.code}(${args})` : `(${f.code}).Invoke(${args})`);
          const args = shape.params.length >= 2 ? `default, ${this.coerce("__i", "double", shape.params[1]!)}` : shape.params.length === 1 ? "default" : "";
          return { code: `JsRt.ArrayFrom<${elem}>(${this.exprTo(len.initializer, "double")}, (double __i) => ${this.coerce(call(args), shape.ret, elem)})`, cs: `JsArray<${elem}>` };
        }
      }
      if (name === "from" && a.length === 1) {
        const c = this.tsCs(e);
        const src = this.expr(a[0]!);
        return { code: `new ${c}(${src.code})`, cs: c };
      }
      if (name === "isArray") return { code: `(${this.expr(a[0]!).code} is global::System.Collections.IEnumerable)`, cs: "bool" };
    }
    return this.fail(e, `${ns}.${name}`);
  }

  private arrayCall(obj: Out, name: string, e: ts.CallExpression, q: string): Out {
    const elem = obj.cs.slice(8, -1);
    const a = e.arguments;
    const self = `${obj.code}${q}`;
    switch (name) {
      case "push": {
        if (a.length === 1 && ts.isSpreadElement(a[0]!)) return { code: `${self}pushAll(${this.exprTo(a[0].expression, obj.cs)})`, cs: "double" };
        // every argument is evaluated before anything is pushed: gather them, then append
        if (a.some(ts.isSpreadElement)) return { code: `${self}pushAll(${this.collect(a, elem)})`, cs: "double" };
        if (a.length <= 3) return { code: `${self}push(${a.map((x) => this.exprTo(x, elem)).join(", ")})`, cs: "double" };
        return { code: `${self}pushAll(new ${obj.cs}()${a.map((x) => `.add(${this.exprTo(x, elem)})`).join("")})`, cs: "double" };
      }
      case "map": case "flatMap": {
        const result = this.tsCs(e);
        const u = result.slice(8, -1);
        const f = this.skipParensKeepAs(a[0]!);
        let fn: string;
        if (ts.isArrowFunction(f) || ts.isFunctionExpression(f)) fn = this.lambdaTo(f, name === "map" ? u : result, [elem, "double"]);
        else fn = this.callback(a[0]!, [elem], name === "map" ? u : result);
        return { code: `${self}${name}<${u}>(${fn})`, cs: result };
      }
      case "reduce": {
        const result = this.tsCs(e);
        if (a.length < 2) {
          const f1 = this.skipParensKeepAs(a[0]!);
          const fn1 = ts.isArrowFunction(f1) || ts.isFunctionExpression(f1) ? this.lambdaTo(f1, elem) : this.expr(a[0]!).code;
          return { code: this.coerce(`${self}reduce(${fn1})`, elem, result), cs: result };
        }
        const f = this.skipParensKeepAs(a[0]!);
        const fn = ts.isArrowFunction(f) || ts.isFunctionExpression(f) ? this.lambdaTo(f, result) : this.expr(a[0]!).code;
        return { code: `${self}reduce<${result}>(${fn}, ${this.exprTo(a[1]!, result)})`, cs: result };
      }
      case "filter": case "some": case "every": case "find": case "findIndex": {
        const f = this.skipParensKeepAs(a[0]!);
        const fn = this.callback(a[0]!, [elem], "bool");
        void f;
        // find on numbers or booleans: no match is undefined, not 0 or false
        if (name === "find" && VALUE_TYPES.has(elem) && !self.endsWith("?.")) return { code: `JsRt.FindOrNull(${obj.code}, ${fn})`, cs: `${elem}?` };
        const cs = name === "filter" ? obj.cs : name === "find" ? elem : name === "findIndex" ? "double" : "bool";
        return { code: `${self}${name}(${fn})`, cs };
      }
      case "forEach": {
        const f = this.skipParensKeepAs(a[0]!);
        const fn = ts.isArrowFunction(f) || ts.isFunctionExpression(f) ? this.lambdaTo(f, "void") : this.expr(a[0]!).code;
        return { code: `${self}forEach(${fn})`, cs: "void" };
      }
      case "sort": {
        if (!a.length) return { code: `${self}sort()`, cs: obj.cs };
        const f = this.skipParensKeepAs(a[0]!);
        const fn = ts.isArrowFunction(f) || ts.isFunctionExpression(f) ? this.lambdaTo(f, "double") : this.expr(a[0]!).code;
        return { code: `${self}sort(${fn})`, cs: obj.cs };
      }
      case "includes": case "indexOf": return { code: `${self}${name}(${this.exprTo(a[0]!, elem)})`, cs: name === "includes" ? "bool" : "double" };
      case "join": return { code: `${self}join(${a.length ? this.exprTo(a[0]!, "string") : ""})`, cs: "string" };
      case "slice": return { code: `${self}slice(${a.map((x) => this.exprTo(x, "double")).join(", ")})`, cs: obj.cs };
      case "concat": return { code: `${self}${a.map((x) => `concat(${this.exprTo(x, obj.cs)})`).join(".")}`, cs: obj.cs };
      case "reverse": case "pop": case "shift": return { code: `${self}${name}()`, cs: name === "reverse" ? obj.cs : elem };
      case "fill": return { code: `${self}fill(${this.exprTo(a[0]!, elem)})`, cs: obj.cs };
      case "flat": {
        if (a.length || !elem.startsWith("JsArray<")) return this.fail(e, "flat of anything but an array of arrays, one level");
        return { code: `JsRt.Flat(${obj.code})`, cs: elem };
      }
      case "splice": return { code: `${self}splice(${a.map((x, i) => this.exprTo(x, i < 2 ? "double" : elem)).join(", ")})`, cs: obj.cs };
      case "unshift": return { code: `${self}unshift(${a.map((x) => this.exprTo(x, elem)).join(", ")})`, cs: "double" };
      case "at": return { code: `${self}at(${this.exprTo(a[0]!, "double")})`, cs: elem };
      // [index, element] pairs: numbers when the elements are, else boxed pairs
      case "entries": return elem === "double" ? { code: `${self}numberEntries()`, cs: "JsArray<JsArray<double>>" } : { code: `${self}entries()`, cs: "JsArray<JsArray<object>>" };
      case "keys": return { code: `${self}indexes()`, cs: "JsArray<double>" };
      default: return this.fail(e, `array method ${name}`);
    }
  }

  /**
   * A built-in function passed as a value (`xs.map(Math.abs)`, `.every(Number.isFinite)`,
   * `.map(Number)`): a lambda over the delegate's parameters calling it with the number
   * arguments it reads (Math.abs reads one, Math.max all the numbers given). Null when `e`
   * is no built-in function.
   */
  private builtinAsValue(e: ts.Expression, params: string[], ret: string): string | null {
    const x = this.skipParensKeepAs(e);
    let ns = "", name = "";
    if (ts.isIdentifier(x) && this.isGlobal(x)) name = x.text;
    else if (ts.isPropertyAccessExpression(x) && ts.isIdentifier(x.expression) && this.isGlobal(x.expression)) [ns, name] = [x.expression.text, x.name.text];
    else return null;
    const names = params.map((_, i) => `__b${i}`);
    const head = `(${params.map((t, i) => `${t} ${names[i]}`).join(", ")})`;
    const num = (i: number) => this.coerce(names[i]!, params[i]!, "double");
    const nums = params.map((t, i) => (t === "double" || t === "double?" ? num(i) : null)).filter((v): v is string => v !== null);
    let body: string | null = null;
    if (ns === "Math" && MATH[name]) body = `${MATH[name]}(${(name === "max" || name === "min" || name === "hypot" ? nums : nums.slice(0, name === "atan2" || name === "pow" ? 2 : 1)).join(", ")})`;
    else if (ns === "" && name === "Number") body = params[0] === "string" ? `JsRt.Num(${names[0]})` : params[0] === "object" ? `JsRt.ToNumber(${names[0]})` : num(0);
    else if (ns === "" && name === "String") body = `JsRt.Str(${names[0]})`;
    else if (ns === "" && name === "Boolean") body = `JsRt.Truthy(${names[0]})`;
    else if (ns === "Number" && name === "isFinite") body = params[0] === "double" ? `JsRt.IsFinite(${names[0]})` : `JsRt.IsFiniteNumber(${names[0]})`;
    else if (ns === "Number" && name === "isInteger") body = `JsRt.IsInteger(${num(0)})`;
    if (body === null) return null;
    return `${head} => ${ret === "double" || ret === "bool" || ret === "string" ? body : this.coerce(body, name === "isFinite" || name === "isInteger" || name === "Boolean" ? "bool" : name === "String" ? "string" : "double", ret)}`;
  }

  /** A callback argument: a lambda typed `params -> ret`, a built-in function, or the function value as it is. */
  private callback(arg: ts.Expression, params: string[], ret: string): string {
    const f = this.skipParensKeepAs(arg);
    if (ts.isArrowFunction(f) || ts.isFunctionExpression(f)) return this.lambdaTo(f, ret, params);
    const builtin = this.builtinAsValue(arg, params, ret);
    if (builtin) return builtin;
    // a function value (a local function, a module function): an adapter to the callback's types
    let fv = this.expr(arg);
    const ax = this.skipParensKeepAs(arg);
    const decl = ts.isIdentifier(ax) ? this.resolve(this.checker.getSymbolAtLocation(ax))?.valueDeclaration : undefined;
    const fnDecl = decl && (ts.isFunctionDeclaration(decl) ? decl : ts.isVariableDeclaration(decl) && decl.initializer && (ts.isArrowFunction(this.skipParens(decl.initializer)) || ts.isFunctionExpression(this.skipParens(decl.initializer))) ? (this.skipParens(decl.initializer) as ts.SignatureDeclaration) : undefined);
    if (fnDecl && this.keptTypeParams(fnDecl).length) {
      // inSection<P>(p: P): P passed for LodPart elements: P is LodPart
      const tpNames = this.keptTypeParams(fnDecl).map((t) => t.name.text);
      const bind = new Map<string, string>();
      fnDecl.parameters.forEach((p, i) => {
        const tn = p.type && ts.isTypeReferenceNode(p.type) ? p.type.typeName.getText() : "";
        if (tpNames.includes(tn) && params[i]) bind.set(tn, params[i]!);
      });
      if (tpNames.every((n) => bind.has(n))) {
        let cs = fv.cs;
        for (const [n, c] of bind) cs = cs.replace(new RegExp(`(?<![\\w.])${n}(?![\\w])`, "g"), c);
        fv = { code: `${fv.code}<${tpNames.map((n) => bind.get(n)).join(", ")}>`, cs };
      }
    }
    const shape = this.delegateShape(fv.cs);
    if (!shape || shape.params.length > params.length) return fv.code;
    const names = params.map((_, i) => `__f${i}`);
    const callArgs = shape.params.map((t, i) => this.coerce(names[i]!, params[i]!, t)).join(", ");
    const call = /^[\w.@]+(<[\w.<>, ]+>)?$/.test(fv.code) ? `${fv.code}(${callArgs})` : `(${fv.code}).Invoke(${callArgs})`;
    const body = ret === "void" ? `{ ${call}; }` : this.coerce(call, shape.ret, ret);
    return `((${params.map((t, i) => `${t} ${names[i]}`).join(", ")}) => ${body})`;
  }

  /** A callback with its body converted to `ret` (a lambda's own inference may differ). */
  private lambdaTo(f: ts.ArrowFunction | ts.FunctionExpression, ret: string, params?: string[]): string {
    // the callback's parameter types known (an array's element): a lambda typed by them
    if (params && f.parameters.length <= params.length && !f.parameters.some((p) => p.dotDotDotToken)) {
      const own = f.parameters.map((p) => this.cs(this.checker.getTypeAtLocation(p), p));
      const target = params.slice(0, f.parameters.length);
      if (own.some((c, i) => c !== target[i])) {
        const shape = `global::System.${ret === "void" ? "Action" : "Func"}<${[...target, ...(ret === "void" ? [] : [ret])].join(", ")}>`.replace("Action<>", "Action");
        return this.lambda(f, false, shape).code;
      }
    }
    const saved = this.ctx.voidAsUnit;
    this.ctx.voidAsUnit = false;
    try {
      const { list, prologue } = this.params(f);
      const typed = list.replace(/ = [^,]+/g, "");
      if (!ts.isBlock(f.body) && !prologue.length) {
        if (ret === "void") return `(${typed}) => { ${this.exprStatement(f.body)}; }`;
        const body = ret === "bool" ? this.cond(f.body) : this.exprTo(f.body, ret);
        return `(${typed}) => ${body}`;
      }
      return `(${typed}) =>\n${this.functionBodyTo(f.body, ret, prologue)}`;
    } finally {
      this.ctx.voidAsUnit = saved;
    }
  }

  private functionBodyTo(body: ts.ConciseBody, ret: string, prologue: string[]): string {
    if (!ts.isBlock(body)) return `{\n${prologue.join("\n")}\n${ret === "void" ? this.exprStatement(body) + ";" : `return ${ret === "bool" ? this.cond(body) : this.exprTo(body, ret)};`}\n}`;
    // a block: its own return statements convert to the function's declared type
    return this.functionBody(body, ret, prologue, "");
  }

  private collectionCall(obj: Out, name: string, e: ts.CallExpression, q: string): Out {
    const a = e.arguments;
    const self = `${obj.code}${q}`;
    const isMap = obj.cs.startsWith("JsMap<") || obj.cs.startsWith("JsWeakMap<");
    const inner = obj.cs.slice(obj.cs.indexOf("<") + 1, -1);
    const [k, v] = isMap ? this.splitTypeArgs(inner) : [inner, inner];
    switch (name) {
      case "get": return { code: `${self}get(${this.exprTo(a[0]!, k!)})`, cs: v! };
      case "has": case "delete": return { code: `${self}${name}(${this.exprTo(a[0]!, k!)})`, cs: "bool" };
      case "set": return { code: `${self}set(${this.exprTo(a[0]!, k!)}, ${this.exprTo(a[1]!, v!)})`, cs: obj.cs };
      case "add": return { code: `${self}add(${this.exprTo(a[0]!, k!)})`, cs: obj.cs };
      case "keys": return { code: `${self}keys()`, cs: `JsArray<${k}>` };
      case "clear": return { code: `${self}clear()`, cs: "void" };
      case "values": return { code: `${self}values()`, cs: `JsArray<${v}>` };
      case "entries": return { code: `${self}entries()`, cs: "JsArray<JsArray<object>>" };
      case "forEach": {
        const f = this.skipParensKeepAs(a[0]!);
        return { code: `${self}forEach(${ts.isArrowFunction(f) || ts.isFunctionExpression(f) ? this.lambdaTo(f, "void") : this.expr(a[0]!).code})`, cs: "void" };
      }
      default: return this.fail(e, `${isMap ? "Map" : "Set"}.${name}`);
    }
  }

  /** A C# type argument list split at its top-level commas. */
  private splitAll(s: string): string[] {
    const out: string[] = [];
    let depth = 0, start = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "<") depth++;
      else if (s[i] === ">") depth--;
      else if (s[i] === "," && depth === 0) {
        out.push(s.slice(start, i).trim());
        start = i + 1;
      }
    }
    out.push(s.slice(start).trim());
    return out;
  }

  private splitTypeArgs(s: string): string[] {
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === "<") depth++;
      else if (s[i] === ">") depth--;
      else if (s[i] === "," && depth === 0) return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    }
    return [s];
  }

  private newExpr(e: ts.NewExpression): Out {
    let c = this.tsCs(e);
    const ctxType = this.checker.getContextualType(e);
    if (ctxType && /^Js(Map|Set)<object/.test(c)) {
      try {
        const cc = this.cs(ctxType, e);
        if (cc.startsWith(c.slice(0, 5))) c = cc;
      } catch {
        // keep the expression's own type
      }
    }
    const callee = e.expression;
    const a = e.arguments ?? [];
    if (ts.isIdentifier(callee) && this.isGlobal(callee)) {
      switch (callee.text) {
        case "Map": return { code: a.length ? `new ${c}(${this.coerce(this.expr(a[0]!).code, this.expr(a[0]!).cs, "JsArray<JsArray<object>>")})` : `new ${c}()`, cs: c };
        case "Set": return { code: a.length ? `new ${c}(${this.exprTo(a[0]!, `JsArray<${c.slice(6, -1)}>`)})` : `new ${c}()`, cs: c };
        case "Array": return { code: `JsRt.NewArray<${c.slice(8, -1)}>(${this.exprTo(a[0]!, "double")})`, cs: c };
        case "Error": return { code: `new JsError(${a.length ? this.strOf(a[0]!) : '""'})`, cs: "JsError" };
        case "WeakMap": return { code: `new ${c}()`, cs: c };
        // a zero-filled number buffer
        case "Float64Array": return { code: a.length && this.tsCs(a[0]!) === "double" ? `JsRt.NewArray<double>(${this.exprTo(a[0]!, "double")})` : `new JsArray<double>(${a.length ? this.exprTo(a[0]!, "JsArray<double>") : ""})`, cs: "JsArray<double>" };
        default: return this.fail(e, `new ${callee.text}`);
      }
    }
    // new (this.constructor as ...)(args): another instance of the object's own class
    let inner: ts.Expression = callee;
    while (ts.isParenthesizedExpression(inner) || ts.isAsExpression(inner)) inner = inner.expression;
    if (ts.isPropertyAccessExpression(inner) && inner.name.text === "constructor") {
      return { code: `JsRt.NewLike(${this.expr(inner.expression).code}, ${a.map((x) => this.expr(x).code).join(", ")})`, cs: c };
    }
    const fn = this.exprRaw(callee, false);
    return { code: `new ${fn.code}(${this.args(e).join(", ")})`, cs: c };
  }

  // --- operators -----------------------------------------------------------------------

  private binary(e: ts.BinaryExpression): Out {
    const k = e.operatorToken.kind;
    const op = e.operatorToken.getText();
    const S = ts.SyntaxKind;
    if (k === S.PlusToken) {
      if (this.tsCs(e) === "string") return { code: `(${this.strOf(e.left)} + ${this.strOf(e.right)})`, cs: "string" };
      return { code: `(${this.exprTo(e.left, "double")} + ${this.exprTo(e.right, "double")})`, cs: "double" };
    }
    if ([S.MinusToken, S.AsteriskToken, S.SlashToken, S.PercentToken].includes(k)) return { code: `(${this.exprTo(e.left, "double")} ${op} ${this.exprTo(e.right, "double")})`, cs: "double" };
    if (k === S.AsteriskAsteriskToken) return { code: `global::System.Math.Pow(${this.exprTo(e.left, "double")}, ${this.exprTo(e.right, "double")})`, cs: "double" };
    if ([S.LessThanToken, S.GreaterThanToken, S.LessThanEqualsToken, S.GreaterThanEqualsToken].includes(k)) {
      const lc = this.tsCs(e.left);
      if (lc === "string") return { code: `(string.CompareOrdinal(${this.exprTo(e.left, "string")}, ${this.exprTo(e.right, "string")}) ${op} 0)`, cs: "bool" };
      return { code: `(${this.exprTo(e.left, "double")} ${op} ${this.exprTo(e.right, "double")})`, cs: "bool" };
    }
    if ([S.EqualsEqualsEqualsToken, S.ExclamationEqualsEqualsToken, S.EqualsEqualsToken, S.ExclamationEqualsToken].includes(k)) return this.equality(e);
    if (k === S.AmpersandAmpersandToken || k === S.BarBarToken) {
      const c = this.tsCs(e);
      if (c === "bool") return { code: `(${this.cond(e.left)} ${k === S.AmpersandAmpersandToken ? "&&" : "||"} ${this.cond(e.right)})`, cs: "bool" };
      const f = k === S.AmpersandAmpersandToken ? "And" : "Or";
      // a && b with `a` an object or undefined (never 0 or ""): b when a is there, else undefined
      const lt = this.checker.getTypeAtLocation(e.left);
      const objectLeft = (lt.isUnion() ? lt.types : [lt]).every((x) => this.isVoidLike(x) || this.kindOf(x) === "object");
      if (f === "And" && objectLeft && this.tsCs(e.left) !== c) return { code: `(${this.cond(e.left)} ? ${this.exprTo(e.right, c)} : default(${c}))`, cs: c };
      return { code: `JsRt.${f}<${c}>(${this.exprTo(e.left, c)}, () => ${this.exprTo(e.right, c)})`, cs: c };
    }
    if (k === S.QuestionQuestionToken) {
      const c = this.tsCs(e);
      const le = this.skipParensKeepAs(e.left);
      const target = ts.isNonNullExpression(le) ? le.expression : le;
      if (ts.isElementAccessExpression(target) && !target.questionDotToken) {
        const arr = this.expr(target.expression);
        if (arr.cs.startsWith("JsArray<")) {
          // past the end (or a hole) reads as undefined, as in JS: then the right side
          const elem = arr.cs.slice(8, -1);
          return { code: this.coerce(`JsRt.ElemOr(${arr.code}, ${this.exprTo(target.argumentExpression, "double")}, () => ${this.exprTo(e.right, elem)})`, elem, c), cs: c };
        }
      }
      const left = this.exprRaw(e.left, false);
      // a number TypeScript calls never nullish: the left side as it is
      if (VALUE_TYPES.has(left.cs)) return { code: this.coerce(left.code, left.cs, c), cs: c };
      const nullable = VALUE_TYPES.has(c) ? `${c}?` : c;
      const l = left.cs === nullable || left.cs === "null" ? left.code : this.coerce(left.code, left.cs, nullable);
      // two different C# types meeting as object (a Map ?? []): both sides as object
      if (c === "object") return { code: `((object)(${l}) ?? (object)(${this.exprTo(e.right, c)}))`, cs: c };
      return { code: `(${l} ?? ${this.exprTo(e.right, c)})`, cs: c };
    }
    if (k === S.InKeyword) {
      const obj = this.expr(e.right);
      if (!ts.isStringLiteral(e.left)) {
        const key = this.exprTo(e.left, "string");
        if (obj.cs.startsWith("JsRecord<")) return { code: `${obj.code}.has(${key})`, cs: "bool" };
        if (this.isDataClassName(obj.cs)) return { code: `${obj.code}.__has(${key})`, cs: "bool" };
        if (obj.cs === "object") return { code: `JsRt.Has(${obj.code}, ${key})`, cs: "bool" };
        return this.fail(e, "`in` with a computed key on a non-object");
      }
      if (obj.cs.startsWith("JsRecord<")) return { code: `${obj.code}.has(${this.str(e.left.text)})`, cs: "bool" };
      if (obj.cs === "object") return { code: `JsRt.Has(${obj.code}, ${this.str(e.left.text)})`, cs: "bool" };
      // a shape: the field is present (an absent key is null)
      return { code: `${obj.code}.__has(${this.str(e.left.text)})`, cs: "bool" };
    }
    if (k === S.InstanceOfKeyword) return { code: `(${this.expr(e.left).code} is ${this.cs(this.checker.getTypeAtLocation(e.right), e)})`, cs: "bool" };
    if (k >= S.FirstAssignment && k <= S.LastAssignment) return this.assignment(e);
    if (k === S.CommaToken) return this.fail(e, "comma operator");
    const int32 = this.int32(k, this.exprTo(e.left, "double"), () => this.exprTo(e.right, "double"));
    if (int32) return { code: int32, cs: "double" };
    return this.fail(e, `operator ${op}`);
  }

  /**
   * A bitwise operator as JS computes it: operands through ToInt32 (ToUint32 for >>>, a shift
   * count mod 32), the result a double again. Null for any other operator.
   */
  private int32(k: ts.SyntaxKind, l: string, r: () => string): string | null {
    const S = ts.SyntaxKind;
    const i = (x: string) => `JsRt.ToInt32(${x})`;
    const sh = (x: string) => `(int)(JsRt.ToUint32(${x}) & 31)`;
    switch (k) {
      case S.AmpersandToken: case S.AmpersandEqualsToken: return `((double)(${i(l)} & ${i(r())}))`;
      case S.BarToken: case S.BarEqualsToken: return `((double)(${i(l)} | ${i(r())}))`;
      case S.CaretToken: case S.CaretEqualsToken: return `((double)(${i(l)} ^ ${i(r())}))`;
      case S.LessThanLessThanToken: case S.LessThanLessThanEqualsToken: return `((double)(${i(l)} << ${sh(r())}))`;
      case S.GreaterThanGreaterThanToken: case S.GreaterThanGreaterThanEqualsToken: return `((double)(${i(l)} >> ${sh(r())}))`;
      case S.GreaterThanGreaterThanGreaterThanToken: case S.GreaterThanGreaterThanGreaterThanEqualsToken: return `((double)(JsRt.ToUint32(${l}) >> ${sh(r())}))`;
      default: return null;
    }
  }

  private isNullish(e: ts.Expression): boolean {
    const x = this.skipParens(e);
    return x.kind === ts.SyntaxKind.NullKeyword || (ts.isIdentifier(x) && x.text === "undefined");
  }

  private equality(e: ts.BinaryExpression): Out {
    const neg = e.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken || e.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken;
    const op = neg ? "!=" : "==";
    const tyof = ts.isTypeOfExpression(e.left) ? e.left : ts.isTypeOfExpression(e.right) ? e.right : null;
    const tag = tyof === e.left ? e.right : e.left;
    if (tyof && ts.isStringLiteral(tag)) {
      const v = this.exprRaw(tyof.expression, false).code;
      const test: Record<string, string> = {
        number: `(${v} is double)`, string: `(${v} is string)`, boolean: `(${v} is bool)`, undefined: `(${v} == null)`,
        function: `(${v} is global::System.Delegate)`, object: `(${v} != null && !(${v} is double || ${v} is string || ${v} is bool || ${v} is global::System.Delegate))`,
      };
      const t = test[tag.text];
      if (!t) return this.fail(e, `typeof ... === "${tag.text}"`);
      return { code: neg ? `!${t}` : t, cs: "bool" };
    }
    if (this.isNullish(e.right) || this.isNullish(e.left)) {
      const side = this.isNullish(e.right) ? e.left : e.right;
      const lit = this.skipParens(this.isNullish(e.right) ? e.right : e.left);
      const strict = e.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken || e.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken;
      const sx = this.skipParensKeepAs(side);
      if (strict && ts.isPropertyAccessExpression(sx) && !sx.questionDotToken) {
        const obj = this.expr(sx.expression);
        const field = this.dataClasses.get(obj.cs)?.fields.find((x) => x.js === sx.name.text);
        if (field?.nullable) {
          // undefined is absence, null a value of its own
          const present = `${obj.code}.__has(${this.str(sx.name.text)})`;
          const test = lit.kind === ts.SyntaxKind.NullKeyword ? `(${present} && ${obj.code}.${Transpiler.escape(sx.name.text)} == null)` : `!${present}`;
          return { code: neg ? `!${test}` : test, cs: "bool" };
        }
      }
      const raw = this.exprRaw(side, false);
      if (VALUE_TYPES.has(raw.cs)) return this.fail(e, `a null test of a ${raw.cs} (the TS type says it cannot be null)`);
      return { code: `(${raw.code} ${op} null)`, cs: "bool" };
    }
    // `trucks[i] !== false` past the end: the read is undefined, unequal to the literal
    const literal = (x: ts.Expression) => [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NumericLiteral].includes(this.skipParens(x).kind);
    const read = (x: ts.Expression, other: ts.Expression): Out => {
      const ix = this.skipParens(x);
      if (literal(other) && ts.isElementAccessExpression(ix) && !ix.questionDotToken) {
        const arr = this.expr(ix.expression);
        const elem = arr.cs.match(/^JsArray<(.*)>$/)?.[1];
        if (elem && VALUE_TYPES.has(elem)) return { code: `JsRt.ReadOrNull(${arr.code}, ${this.exprTo(ix.argumentExpression, "double")})`, cs: `${elem}?` };
      }
      return this.expr(x);
    };
    const l = read(e.left, e.right), r = read(e.right, e.left);
    const prim = (c: string) => ["double", "bool", "string", "double?", "bool?"].includes(c);
    if (prim(l.cs) && prim(r.cs) && l.cs.replace("?", "") === r.cs.replace("?", "")) return { code: `(${l.code} ${op} ${r.code})`, cs: "bool" };
    return { code: `${neg ? "!" : ""}JsRt.Eq(${l.code}, ${r.code})`, cs: "bool" };
  }

  private assignment(e: ts.BinaryExpression): Out {
    const S = ts.SyntaxKind;
    const k = e.operatorToken.kind;
    if (k === S.EqualsToken && (ts.isArrayLiteralExpression(e.left) || ts.isObjectLiteralExpression(e.left))) {
      return { code: this.destructuringAssign(e.left, e.right), cs: "void" };
    }
    const target = this.expr(e.left, true);
    const tc = target.cs;
    if (k === S.EqualsToken && ts.isElementAccessExpression(e.left)) {
      const obj = this.expr(e.left.expression);
      if (this.isDataClassName(obj.cs) && !ts.isStringLiteral(e.left.argumentExpression)) return { code: `${obj.code}.__set(${this.exprTo(e.left.argumentExpression, "string")}, ${this.exprTo(e.right, "object")})`, cs: "void" };
    }
    if (k === S.EqualsToken) return { code: `(${target.code} = ${this.exprTo(e.right, tc)})`, cs: tc };
    if (k === S.QuestionQuestionEqualsToken) return { code: `(${target.code} ??= ${this.exprTo(e.right, tc.replace(/\?$/, ""))})`, cs: tc };
    if (k === S.PlusEqualsToken && (tc === "string")) return { code: `(${target.code} += ${this.strOf(e.right)})`, cs: tc };
    const op = e.operatorToken.getText();
    if ([S.PlusEqualsToken, S.MinusEqualsToken, S.AsteriskEqualsToken, S.SlashEqualsToken, S.PercentEqualsToken].includes(k)) {
      return { code: `(${target.code} ${op} ${this.exprTo(e.right, "double")})`, cs: tc };
    }
    // x ^= y and the other bitwise assignments: x = x ^ y, through int32
    const value = this.int32(k, target.code, () => this.exprTo(e.right, "double"));
    if (value) return { code: `(${target.code} = ${value})`, cs: tc };
    return this.fail(e, `assignment ${op}`);
  }

  private prefix(e: ts.PrefixUnaryExpression): Out {
    const S = ts.SyntaxKind;
    switch (e.operator) {
      case S.ExclamationToken: return { code: `!(${this.cond(e.operand)})`, cs: "bool" };
      case S.MinusToken: return { code: `(-${this.exprTo(e.operand, "double")})`, cs: "double" };
      case S.PlusToken: return { code: this.tsCs(e.operand) === "string" ? `JsRt.Num(${this.exprTo(e.operand, "string")})` : this.exprTo(e.operand, "double"), cs: "double" };
      case S.PlusPlusToken: return { code: `++${this.expr(e.operand, true).code}`, cs: "double" };
      case S.MinusMinusToken: return { code: `--${this.expr(e.operand, true).code}`, cs: "double" };
      case S.TildeToken: return { code: `((double)~JsRt.ToInt32(${this.exprTo(e.operand, "double")}))`, cs: "double" };
      default: return this.fail(e, "unary operator");
    }
  }

  // --- literals ------------------------------------------------------------------------

  /** The class of `x as { m: MeshBuilder }` when x is a class instance having those fields (a view to write through), else null. */
  private classView(e: ts.Expression | undefined): string | null {
    const x = e && this.skipParens(e);
    if (!x || !ts.isAsExpression(x) || this.isConstAssertion(x)) return null;
    let to: string;
    let from: string;
    try {
      to = this.cs(this.checker.getTypeFromTypeNode(x.type), x);
      from = this.tsCs(x.expression);
    } catch {
      return null;
    }
    if (!this.isClassName(from) || !this.isDataClassName(to)) return null;
    const own = this.checker.getApparentType(this.checker.getTypeAtLocation(x.expression));
    return this.dataClasses.get(to)!.fields.every((f) => own.getProperty(f.js)) ? from : null;
  }

  /** Whether a C# type name is a transpiled class or the seam's MeshBuilder (not a shape class). */
  private isClassName(cs: string): boolean {
    return cs === "MeshBuilder" || [...this.classNames.values()].includes(cs);
  }

  private meshCoreDecl(): ts.ClassDeclaration | undefined {
    const sf = this.program.getSourceFile(path.join(this.generatorDir, "meshCore.ts"));
    return sf?.statements.find((st): st is ts.ClassDeclaration => ts.isClassDeclaration(st) && st.name?.text === "MeshCore");
  }

  /** The declaration of method `name` a class (or MeshBuilder, through MeshCore) has, up its bases. */
  private classMethod(cls: string, name: string): ts.MethodDeclaration | undefined {
    let decl: ts.ClassDeclaration | null | undefined = cls === "MeshBuilder" ? this.meshCoreDecl() : [...this.classNames].find(([, n]) => n === cls)?.[0];
    while (decl) {
      if (this.seamFiles.has(decl.getSourceFile().fileName)) decl = this.meshCoreDecl();
      const m = decl?.members.find((x): x is ts.MethodDeclaration => ts.isMethodDeclaration(x) && x.name.getText() === name);
      if (m) return m;
      decl = decl ? this.baseClassDecl(decl) : null;
    }
    return undefined;
  }

  /**
   * An object literal standing for a class instance (`{ tri(...) {...} } as unknown as MeshBuilder`,
   * a recorder or a mirroring wrapper): an instance of a generated subclass whose overrides call the
   * literal's functions, held as delegates. Its other members are the base's, on an object that never
   * ran its constructor - as the literal has none of them either.
   */
  private duckLiteral(lit: ts.ObjectLiteralExpression, cls: string): Out {
    const name = `Duck_${++this.duckCount}`;
    const members: string[] = [];
    const inits: string[] = [];
    for (const p of lit.properties) {
      const key = p.name?.getText() ?? "";
      const init = ts.isPropertyAssignment(p) ? this.skipParensKeepAs(p.initializer) : null;
      const fn = ts.isMethodDeclaration(p) ? (p as unknown as ts.FunctionExpression) : init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) ? (init as ts.FunctionExpression) : null;
      const base = key ? this.classMethod(cls, key) : undefined;
      if (!fn || !base) {
        this.fail(p, `a member of a literal standing for ${cls} that is no method of it`);
        continue;
      }
      // the override's signature is the base method's, as emitted
      const sig = this.member(cls, () => {
        const { list, names } = this.params(base);
        return { list: list.replace(/ = [^,]+/g, ""), names, ret: this.returnCs(base), tps: this.typeParams(base) };
      });
      const tpNames = (base.typeParameters ?? []).map((t) => t.name.text);
      const plain = (c: string) => tpNames.reduce((x, n) => x.replace(new RegExp(`(?<![\\w.])${n}(?![\\w])`, "g"), "object"), c);
      const types = sig.list ? this.splitAll(sig.list).map((x) => x.replace(/^params /, "").replace(/ \S+$/, "")) : [];
      const fieldTypes = types.map(plain);
      const fieldRet = sig.ret === "void" ? "void" : plain(sig.ret);
      const delegate = fieldRet === "void" ? (fieldTypes.length ? `global::System.Action<${fieldTypes.join(", ")}>` : "global::System.Action") : `global::System.Func<${[...fieldTypes, fieldRet].join(", ")}>`;
      const args = sig.names.map((n, i) => this.coerce(n, types[i]!, fieldTypes[i]!)).join(", ");
      const call = `this.__${key}(${args})`;
      const body = sig.ret === "void" ? `${call};` : `return ${this.coerce(call, fieldRet, sig.ret)};`;
      members.push(`    public ${delegate} __${key};`, `    public override ${sig.ret} ${Transpiler.escape(key)}${sig.tps}(${sig.list}) { ${body} }`);
      inits.push(`__${key} = ${this.lambda(fn, false, delegate).code}`);
    }
    this.duckClasses.push(`/** An object literal standing for ${cls}. */\npublic sealed class ${name} : ${cls}\n{\n    public ${name}() : base(JsCtor.Skip) { }\n${members.join("\n")}\n}\n`);
    return { code: `new ${name} { ${inits.join(", ")} }`, cs: cls };
  }

  /**
   * The record type an object literal is when it spreads a record (`{ ...KIT_PALETTE, dfBlue: ... }`
   * with KIT_PALETTE a Record<string, MaterialSpec>): TypeScript types it by its named keys
   * only, but it holds every key of the record too, so it is a record. Null otherwise.
   */
  private recordLiteral(e: ts.Expression | undefined): string | null {
    const x = e && this.skipParensKeepAs(e);
    if (!x || !ts.isObjectLiteralExpression(x)) return null;
    for (const p of x.properties) {
      if (!ts.isSpreadAssignment(p)) continue;
      let c: string;
      try {
        c = this.tsCs(p.expression);
      } catch {
        continue;
      }
      if (c.startsWith("JsRecord<")) return c;
      // a constant itself spread from a record (`{ ...PALETTE, claret }`, PALETTE = { ...TRAM_PALETTE })
      const inner = ts.isIdentifier(p.expression) ? this.resolve(this.symbolOf(p.expression))?.valueDeclaration : undefined;
      if (inner && ts.isVariableDeclaration(inner) && inner.initializer !== x) {
        const r = this.recordLiteral(inner.initializer);
        if (r) return r;
      }
    }
    return null;
  }

  /** The C# class an object literal builds: its contextual type's, else its own. */
  private literalClass(e: ts.ObjectLiteralExpression, want: string | null): string {
    if (want && want !== "object" && (this.isDataClassName(want) || want.startsWith("JsRecord<"))) return want;
    const ctxType = this.checker.getContextualType(e);
    if (ctxType) {
      try {
        const c = this.cs(ctxType, e);
        if (this.isDataClassName(c) || c.startsWith("JsRecord<")) {
          if (c.startsWith("JsRecord<")) return c;
          const fields = new Set(this.dataClasses.get(c)!.fields.map((f) => f.js));
          const keys = e.properties.filter((p) => !ts.isSpreadAssignment(p)).map((p) => p.name?.getText() ?? "");
          if (keys.every((k) => fields.has(k))) return c;
        }
      } catch {
        // an unsupported contextual type: fall back to the literal's own
      }
    }
    return this.tsCs(e);
  }

  private objectLiteral(e: ts.ObjectLiteralExpression, want: string | null): Out {
    // a record wanted (a Record<string, MaterialSpec> return) is built as that: the first spread's
    // narrower value type would drop the other values' fields
    const c = (want?.startsWith("JsRecord<") && this.recordLiteral(e) ? want : null) ?? this.recordLiteral(e) ?? this.literalClass(e, want);
    if (this.isClassName(c)) return this.duckLiteral(e, c);
    const record = c.match(/^JsRecord<(.*)>$/);
    const o = `__o${++this.ctx.temps}`;
    const assigns: string[] = [];
    const simple: string[] = [];
    let needsInit = false;
    const fieldOf = (key: string) => (record ? record[1]! : this.fieldCs(c, key));
    const set = (key: string, value: string) => (record ? `${o}[${this.str(key)}] = ${value};` : `${o}.${Transpiler.escape(key)} = ${value};`);
    // { ...src, a: x } where src is already this class: start from a copy of it (memberwise,
    // presence included) instead of a new object filled key by key
    let baseCopy: string | null = null;
    const first = e.properties[0];
    if (!record && first && ts.isSpreadAssignment(first) && !ts.isObjectLiteralExpression(this.skipParensKeepAs(first.expression)) && !ts.isConditionalExpression(this.skipParensKeepAs(first.expression))) {
      const src = this.expr(first.expression);
      if (src.cs === c) baseCopy = `(${src.code}?.copy() ?? new ${c}())`;
    }
    const inline = (lit: ts.ObjectLiteralExpression, guard: string | null): void => {
      const inner: string[] = [];
      const outer = assigns.length;
      for (const p of lit.properties) {
        if (ts.isPropertyAssignment(p) && !ts.isComputedPropertyName(p.name)) inner.push(set(p.name.getText().replace(/^["']|["']$/g, ""), this.exprTo(p.initializer, fieldOf(p.name.getText().replace(/^["']|["']$/g, "")))));
        else if (ts.isShorthandPropertyAssignment(p)) inner.push(set(p.name.text, this.exprTo(p.name, fieldOf(p.name.text))));
        else if (ts.isSpreadAssignment(p)) {
          // a spread inside the spread literal, in its place
          const before = assigns.length;
          spread(p.expression);
          inner.push(...assigns.splice(before));
        } else this.fail(p, "property in a spread literal");
      }
      void outer;
      assigns.push(guard ? `if (${guard}) { ${inner.join(" ")} }` : inner.join(" "));
    };
    const spread = (expr: ts.Expression): void => {
      const x = this.skipParensKeepAs(expr);
      if (ts.isObjectLiteralExpression(x)) {
        inline(x, null);
        return;
      }
      if (ts.isConditionalExpression(x)) {
        const wt = this.skipParensKeepAs(x.whenTrue), wf = this.skipParensKeepAs(x.whenFalse);
        if (ts.isObjectLiteralExpression(wt) && ts.isObjectLiteralExpression(wf)) {
          const t = `__c${++this.ctx.temps}`;
          assigns.push(`var ${t} = ${this.cond(x.condition)};`);
          inline(wt, t);
          if (wf.properties.length) inline(wf, `!${t}`);
          return;
        }
      }
      // `...(o.front ?? fallback)`: each side copied as the object it is - the union type of the
      // whole would convert o.front to the narrower shape both share, and drop its other keys
      if (!record && ts.isBinaryExpression(x) && x.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
        const l = this.expr(x.left), r = this.expr(x.right);
        assigns.push(`JsRt.Assign(${o}, ((object)(${l.code}) ?? (object)(${r.code})));`);
        return;
      }
      if (!record && ts.isConditionalExpression(x)) {
        const wt = this.expr(x.whenTrue), wf = this.expr(x.whenFalse);
        assigns.push(`JsRt.Assign(${o}, (${this.cond(x.condition)} ? (object)(${wt.code}) : (object)(${wf.code})));`);
        return;
      }
      const src = this.expr(expr);
      if (record) assigns.push(`${o}.assign(${this.coerce(src.code, src.cs, c)});`);
      else assigns.push(`JsRt.Assign(${o}, ${src.code});`);
    };
    for (const p of e.properties) {
      if (baseCopy !== null && p === first) {
        needsInit = true;
        continue;
      }
      if (ts.isSpreadAssignment(p)) {
        needsInit = true;
        const x = this.skipParensKeepAs(p.expression);
        // ...(cond ? { a } : {}) and ...{ a }: the fields themselves, so absent stays absent
        if (ts.isObjectLiteralExpression(x)) {
          inline(x, null);
          continue;
        }
        if (ts.isConditionalExpression(x)) {
          const wt = this.skipParensKeepAs(x.whenTrue), wf = this.skipParensKeepAs(x.whenFalse);
          if (ts.isObjectLiteralExpression(wt) && ts.isObjectLiteralExpression(wf)) {
            const cnd = this.cond(x.condition);
            if (wf.properties.length) {
              const t = `__c${++this.ctx.temps}`;
              assigns.push(`var ${t} = ${cnd};`);
              inline(wt, t);
              inline(wf, `!${t}`);
            } else {
              inline(wt, cnd);
            }
            continue;
          }
        }
        spread(p.expression);
        continue;
      }
      let key: string;
      let value: ts.Expression;
      if (ts.isPropertyAssignment(p)) {
        if (ts.isComputedPropertyName(p.name)) {
          if (!record) {
            this.fail(p, "computed key in a shape literal");
            continue;
          }
          needsInit = true;
          assigns.push(`${o}[${this.exprTo(p.name.expression, "string")}] = ${this.exprTo(p.initializer, record[1]!)};`);
          continue;
        }
        key = ts.isStringLiteral(p.name) || ts.isNumericLiteral(p.name) ? p.name.text : p.name.getText();
        value = p.initializer;
      } else if (ts.isShorthandPropertyAssignment(p)) {
        key = p.name.text;
        value = p.name;
      } else {
        if (ts.isMethodDeclaration(p) && !ts.isComputedPropertyName(p.name)) {
          // { box(x) { ... } }: the field holding the function
          needsInit = true;
          const mk = p.name.getText();
          assigns.push(set(mk, this.lambda(p as unknown as ts.FunctionExpression, false, this.delegateShape(fieldOf(mk)) ? fieldOf(mk) : undefined).code));
          continue;
        }
        this.fail(p, "object literal member");
        continue;
      }
      const v = this.exprTo(value, fieldOf(key));
      if (needsInit) assigns.push(set(key, v));
      else simple.push(record ? `[${this.str(key)}] = ${v}` : `${Transpiler.escape(key)} = ${v}`);
    }
    let created = `new ${c}${simple.length ? ` { ${simple.join(", ")} }` : "()"}`;
    if (baseCopy !== null) created = baseCopy;
    if (!assigns.length && !simple.length) return { code: created, cs: c };
    if (!assigns.length && baseCopy === null) return { code: created, cs: c };
    if (baseCopy !== null && simple.length) assigns.unshift(...simple.map((x) => `${o}.${x};`));
    return { code: `JsRt.Obj(${created}, (${c} ${o}) => { ${assigns.join(" ")} })`, cs: c };
  }

  private arrayLiteral(e: ts.ArrayLiteralExpression, want: string | null): Out {
    let c = want && want.startsWith("JsArray<") ? want : null;
    if (!c) {
      const ctxType = this.checker.getContextualType(e);
      try {
        const cc = ctxType ? this.cs(ctxType, e) : null;
        if (cc && cc.startsWith("JsArray<")) c = cc;
      } catch {
        c = null;
      }
    }
    c ??= this.tsCs(e);
    if (!c.startsWith("JsArray<")) c = "JsArray<object>";
    const elem = c.slice(8, -1);
    // no spread: one call at the exact size (JsArray.Of), the common case of every point drawn
    if (!e.elements.some(ts.isSpreadElement)) return { code: `${c}.Of(${e.elements.map((el) => this.exprTo(el, elem)).join(", ")})`, cs: c };
    const parts = e.elements.map((el) => {
      if (ts.isSpreadElement(el)) {
        const src = this.expr(el.expression);
        if (src.cs.startsWith("JsMap<")) return `.addAll(${this.coerce(`${src.code}.entries()`, "JsArray<JsArray<object>>", `JsArray<${elem}>`)})`;
        if (src.cs === "string") return `.addAll(${this.coerce(`JsRt.Chars(${src.code})`, "JsArray<string>", `JsArray<${elem}>`)})`;
        return `.addAll(${this.coerce(src.code, src.cs, c!)})`;
      }
      return `.add(${this.exprTo(el, elem)})`;
    });
    return { code: `new ${c}()${parts.join("")}`, cs: c };
  }

  /** Errors collected while emitting (for the report). */
  get problems(): readonly string[] {
    return this.errors;
  }
}
