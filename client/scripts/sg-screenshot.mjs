import { chromium } from 'playwright-core';
import { spawn }    from 'child_process';
import { mkdirSync } from 'fs';
import { resolve }  from 'path';

const CHROME_EXE  = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SHOTS_DIR   = resolve('scripts', 'shots');
mkdirSync(SHOTS_DIR, { recursive: true });

// ── 1. Start Vite dev server ───────────────────────────────────────────────
const vite = spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  detached: false,
});

vite.stdout.on('data', d => process.stdout.write(d));
vite.stderr.on('data', d => process.stderr.write(d));

// Poll via HTTP until Vite responds
await new Promise((res, rej) => {
  const deadline = Date.now() + 45_000;
  async function poll() {
    if (Date.now() > deadline) { rej(new Error('Vite start timeout')); return; }
    try {
      const r = await fetch('http://localhost:5173/', { signal: AbortSignal.timeout(1000) });
      if (r.status < 500) { res(); return; }
    } catch { /* not ready yet */ }
    setTimeout(poll, 400);
  }
  poll();
});
console.log('Vite ready.');

// ── 2. Find the StyleGuide route ───────────────────────────────────────────
const browser = await chromium.launch({
  executablePath: CHROME_EXE,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const ctx  = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

// Collect JS errors
const jsErrors = [];
page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
page.on('pageerror', err => jsErrors.push(err.message));

await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30_000 });
await page.screenshot({ path: `${SHOTS_DIR}/00-landing.png` });
console.log('Landing screenshot taken.');

// Try common style-guide paths
let found = false;
for (const p of ['/style-guide', '/styleguide', '/design-system', '/design', '/sg']) {
  await page.goto(`http://localhost:5173${p}`, { waitUntil: 'networkidle', timeout: 10_000 })
    .catch(() => {});
  const url = page.url();
  // If we landed somewhere that's not a redirect back to root, call it found
  if (!url.endsWith('/') && !url.endsWith('/login') || await page.locator('h1, h2').filter({ hasText: /design|style|component/i }).count() > 0) {
    const hasHeadings = await page.locator('h2').count();
    if (hasHeadings > 2) { found = true; break; }
  }
}

if (!found) {
  // Print all nav links to help find the path
  const links = await page.$$eval('a', as => as.map(a => ({ text: a.textContent?.trim(), href: a.href })));
  console.log('Links:', JSON.stringify(links.slice(0, 30), null, 2));
  console.log('Could not find style guide route automatically. Check 00-landing.png');
} else {
  console.log('Found style guide at:', page.url());
  await page.screenshot({ path: `${SHOTS_DIR}/01-sg-top.png` });
}

// ── 3. Scroll to Product Components ───────────────────────────────────────
const scrolled = await page.evaluate(() => {
  const h2s = [...document.querySelectorAll('h2, h3, [class*="section"] h2')];
  const tgt  = h2s.find(el => el.textContent?.includes('Product Component'));
  if (!tgt) return false;
  tgt.scrollIntoView({ behavior: 'instant', block: 'start' });
  return true;
});
console.log('Scrolled to Product Components:', scrolled);
await page.waitForTimeout(1000);
await page.screenshot({ path: `${SHOTS_DIR}/02-product-light.png` });
console.log('Light mode screenshot: 02-product-light.png');

// ── 4. Toggle dark mode ────────────────────────────────────────────────────
const toggled = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const btn = btns.find(b => /dark|light|moon|sun/i.test(b.textContent || b.getAttribute('aria-label') || ''));
  if (!btn) return false;
  btn.click();
  return true;
});
console.log('Dark mode toggled:', toggled);
await page.waitForTimeout(600);

await page.evaluate(() => {
  const h2s = [...document.querySelectorAll('h2')];
  const tgt  = h2s.find(el => el.textContent?.includes('Product Component'));
  if (tgt) tgt.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS_DIR}/03-product-dark.png` });
console.log('Dark mode screenshot: 03-product-dark.png');

// ── 5. Scroll to AISuggestionChip / StatCard ──────────────────────────────
await page.evaluate(() => {
  const all = [...document.querySelectorAll('p, h3, [class*="label"]')];
  const tgt = all.find(el => el.textContent?.includes('AISuggestionChip'));
  if (tgt) tgt.scrollIntoView({ behavior: 'instant', block: 'start' });
});
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS_DIR}/04-ai-statcard-dark.png` });
console.log('AI+StatCard dark screenshot: 04-ai-statcard-dark.png');

// ── 6. Toggle back to light ────────────────────────────────────────────────
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const btn = btns.find(b => /dark|light|moon|sun/i.test(b.textContent || b.getAttribute('aria-label') || ''));
  if (btn) btn.click();
});
await page.waitForTimeout(600);
await page.screenshot({ path: `${SHOTS_DIR}/05-ai-statcard-light.png` });
console.log('AI+StatCard light screenshot: 05-ai-statcard-light.png');

// ── 7. Report errors ───────────────────────────────────────────────────────
if (jsErrors.length) {
  console.error('\n⚠ JS/console errors detected:');
  jsErrors.forEach(e => console.error(' ', e));
} else {
  console.log('\n✓ No JS errors detected.');
}

await browser.close();
vite.kill();
console.log('\nDone. Screenshots in:', SHOTS_DIR);
