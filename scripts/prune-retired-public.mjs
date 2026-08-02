import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './dist-target.mjs';

// Vite copies public/ wholesale, so anything left under public/ from a retired
// page would still ship. The constitutional court's 34 MB opinion projection is
// no longer in this repo at all; notes-assets is the remaining case.
const retired = [
  join(DIST, 'notes-assets'),
];
for (const path of retired) {
  if (existsSync(path)) rmSync(path, { recursive: true });
  if (existsSync(path)) throw new Error(`retired public projection still exists: ${path}`);
}
console.log('retired public projections pruned: notes');
