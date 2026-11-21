// Dev helper: screenshot a page with all stages unlocked. Usage: node scripts/shot.mjs <url> <out.png> [w] [h] [clickText...]
import { chromium } from '@playwright/test';
const [,, url, out, w = '412', h = '900', ...clicks] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: Number(h) } });
p.on('console', (m) => { if (m.type() === 'error') console.log('console.error:', m.text()); });
p.on('pageerror', (e) => console.log('pageerror:', e.message));
await p.addInitScript(() => {
  const ids = Array.from({ length: 13 }, (_, i) => 'stage-' + String(i + 1).padStart(2, '0'));
  const lessons = {}; const testedOut = {};
  ids.forEach((id) => { lessons[id + '-boss'] = { stars: 3, best: 3, at: 1 }; testedOut[id] = true; });
  if (!localStorage.getItem('p2k:v1')) localStorage.setItem('p2k:v1', JSON.stringify({ v: 2, lessons, testedOut }));
});
await p.goto(url);
await p.waitForTimeout(1200);
for (const c of clicks) { await p.getByText(c, { exact: false }).first().click(); await p.waitForTimeout(900); }
await p.screenshot({ path: out });
await b.close();
