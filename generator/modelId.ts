/** The sole ID convention for new models, filenames and saved-map references. */
export function proceduralId(id: string): string {
  if (/^proc-(building|vehicle|tree|woods)-[a-z0-9-]+$/.test(id)) return id;
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Invalid design name: ${id}`);
  return id.startsWith('veh-') ? `proc-vehicle-${id.slice(4)}` : `proc-building-${id.replace(/^bld-/, '')}`;
}
export function isProceduralId(id: string): boolean {
  return /^proc-(building|vehicle|tree|woods)-[a-z0-9-]+$/.test(id);
}
