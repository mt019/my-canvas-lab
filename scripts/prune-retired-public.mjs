import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './site-config.mjs';

// Vite copies public/ wholesale. Keep the former Canvas snapshot in the repo for
// rollback, but never ship its 34 MB opinion projection now that all archive URLs
// redirect to the standalone site.
const retired = join(ROOT, 'dist', 'data', 'constitutionalCourt-opinions');
if (existsSync(retired)) rmSync(retired, { recursive: true });

if (existsSync(retired)) throw new Error(`retired public projection still exists: ${retired}`);
console.log('retired public projection pruned: dist/data/constitutionalCourt-opinions');
