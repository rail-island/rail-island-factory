// Orthographic comparison of actual GLB vertices with native vlakosimdb BMP
// landmarks for the mainline electrics package (docs/models/mainline-electrics.md),
// measured as czElectricComparison.ts measures the Czech electrics: each design
// keeps its annotated boxes in assets/<folder>/native/landmarks.json and its own
// mapping from the model's frame to the native canvases. Node-only.
import type { Vec3 } from "./meshCore.ts";
import type { ComparedDesign, View } from "./czElectricComparison.ts";
import { cd181 } from "./cd181.ts";
import { dnt184 } from "./dnt184.ts";
import { db111 } from "./db111.ts";
import { dr243 } from "./dr243.ts";
import { OBB1012_SCALE, obb1012 } from "./obb1012.ts";
import { OBB1040_SCALE, obb1040 } from "./obb1040.ts";

export { compare, landmarks, mae } from "./czElectricComparison.ts";

/** The front BMP at the +X end seen from ahead: column = 10 (1.5 - z), row = 10 (6 - y). */
const front = (p: Vec3): [number, number] => [10 * (1.5 - p[2]), 10 * (6 - p[1])];
const side = (centre: number, perMetre: number, rowsPerMetre = 10) => (p: Vec3): [number, number] => [centre - perMetre * p[0], rowsPerMetre * (6 - p[1])];
const design = (id: string, title: string, folder: string, build: () => ReturnType<ComparedDesign["build"]>, sideOf: (p: Vec3) => [number, number], width: number, files: Record<View, string>, mapping: string, height = 60): ComparedDesign => ({
  id, title, folder, build,
  project: (v, p) => (v === "x_front" ? front(p) : sideOf(p)),
  canvas: { x_front: [30, 60], z_right: [width, height] },
  files, mapping,
});

export const MAINLINE_COMPARED: readonly ComparedDesign[] = [
  design("veh-cd-180", "CD 181 105", "cd-181", () => cd181(), side(94, 10), 220,
    { x_front: "native/cd_181/x_both.bmp", z_right: "native/cd_181/z_dec.bmp" },
    "side column px = 94 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z)"),
  design("veh-dnt-184-5", "DNT 184 503", "dnt-184", () => dnt184(), side(101.5, 10), 204,
    { x_front: "native/dnt_184.5/x_both.bmp", z_right: "native/dnt_184.5/z_dec.bmp" },
    "side column px = 101.5 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z)"),
  design("veh-db-111", "DB 111 024", "db-111", () => db111(), side(83.65, 10), 170,
    { x_front: "native/db_111/x_both.bmp", z_right: "native/db_111/z_dec.bmp" },
    "side column px = 83.65 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z)"),
  design("veh-dr-243", "DR 243 864", "dr-243", () => dr243(), side(84, 10), 170,
    { x_front: "native/dr_243/x_both.bmp", z_right: "native/dr_243/z_dec.bmp" },
    "side column px = 84 - 10 x, row = 10 (6 - y); front column = 10 (1.5 - z)"),
  design("veh-obb-1012", "OBB 1012.001", "obb-1012", () => obb1012(), side(96.5, 1 / ((18 / 193) * OBB1012_SCALE), 58 / 6), 193,
    { x_front: "native/x_both.bmp", z_right: "native/z_both.bmp" },
    "side column px = 96.5 - x / 0.09923 (the native body scaled to the published 18.3 m), row = (6 - y) / 0.10345; front column = 10 (1.5 - z)", 58),
  design("veh-obb-1040", "OBB 1040 013", "obb-1040", () => obb1040(), side(65.5, -1 / (0.1 * OBB1040_SCALE)), 170,
    { x_front: "native/x_both.bmp", z_right: "native/z_both.bmp" },
    "side column px = 65.5 + x / 0.10504 (the native body scaled to the published 12.92 m over the buffers), row = 10 (6 - y); front column = 10 (1.5 - z)"),
];
