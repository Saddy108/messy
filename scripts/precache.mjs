// After `vite build`: list every file in dist/ so the service worker can cache the whole app for offline use.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = 'dist';
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files.push('./' + relative(root, full).split(sep).join('/'));
  }
};
walk(root);
const skip = new Set(['./sw.js', './precache.json']);
writeFileSync(join(root, 'precache.json'), JSON.stringify(files.filter((f) => !skip.has(f))));
console.log(`precache: ${files.length} files`);
