import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

// Vite copies public/ wholesale. Keep the former Canvas snapshot in the repo for
// rollback, but never ship its 34 MB opinion projection now that all archive URLs
// redirect to the standalone site.
const retired = [
  join(ROOT, 'dist', 'data', 'constitutionalCourt-opinions'),
  join(ROOT, 'dist', 'notes-assets'),
];
for (const path of retired) {
  if (existsSync(path)) rmSync(path, { recursive: true });
  if (existsSync(path)) throw new Error(`retired public projection still exists: ${path}`);
}
console.log('retired public projections pruned: constitutional court + notes');
