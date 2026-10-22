// The end centres of a `rod` (MeshCore.rod) from its drawn vertices: the rod's
// two rings, split across the plane half way between the end points its source
// tree leaf records (rounded to the millimetre), each averaged -- exact, since a
// ring's points stand evenly round its centre.

type P = readonly number[];

export function rodEnds(points: readonly P[], a: P, b: P): [number[], number[]] {
  const unique = [...new Map(points.map((p) => [p.join(","), p])).values()];
  const axis = [0, 1, 2].map((k) => b[k]! - a[k]!);
  const mid = [0, 1, 2].map((k) => (a[k]! + b[k]!) / 2);
  const side = (p: P) => (p[0]! - mid[0]!) * axis[0]! + (p[1]! - mid[1]!) * axis[1]! + (p[2]! - mid[2]!) * axis[2]!;
  const mean = (ps: P[]) => [0, 1, 2].map((k) => ps.reduce((s, p) => s + p[k]!, 0) / ps.length);
  return [mean(unique.filter((p) => side(p) < 0)), mean(unique.filter((p) => side(p) > 0))];
}
