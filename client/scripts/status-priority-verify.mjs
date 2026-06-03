import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.error('[pageerror]', e.message));

// ── Login via form (SPA stays alive after) ────────────────────────────────
await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 20_000 });
await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill('admin@taskpilot.com');
await page.locator('input[type="password"]').fill('admin123');
await page.locator('button[type="submit"]').click();
await page.waitForURL(url => !url.href.includes('/login'), { timeout: 12_000 }).catch(() => {});
await page.waitForTimeout(2000);
console.log('After login →', page.url());

// ── Navigate to /tickets via sidebar link (SPA nav, no full reload) ───────
const ticketsLink = page.locator('aside a[href="/tickets"], nav a[href="/tickets"]').first();
if (await ticketsLink.count() > 0) {
  await ticketsLink.click();
  await page.waitForTimeout(2000);
} else {
  // Fallback: use React Router via pushState
  await page.evaluate(() => window.history.pushState({}, '', '/tickets'));
  await page.waitForTimeout(2000);
}
console.log('Tickets URL:', page.url());

const rowCount = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
console.log('Ticket rows:', rowCount);

// Check: no badge pill in status/priority columns
const badgeCheck = await page.evaluate(() => {
  const rows = document.querySelectorAll('tbody tr');
  const found = [];
  rows.forEach((row, ri) => {
    if (ri > 4) return;
    const cells = row.querySelectorAll('td');
    [3, 4].forEach(ci => {
      const cell = cells[ci];
      if (!cell) return;
      cell.querySelectorAll('span').forEach(s => {
        const cls = s.className;
        const bg = getComputedStyle(s).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && !cls.includes('w-2')) {
          found.push({ row: ri, col: ci, cls: cls.slice(0, 60), bg });
        }
      });
    });
  });
  return found;
});

// Check: priority dot pattern
const dotCheck = await page.evaluate(() => {
  const dots = Array.from(document.querySelectorAll('tbody td span'))
    .filter(s => s.className.includes('w-2') && s.className.includes('h-2') && s.className.includes('rounded-full'));
  return {
    count: dots.length,
    samples: dots.slice(0, 3).map(d => ({ style: d.getAttribute('style'), text: d.nextElementSibling?.textContent?.trim() }))
  };
});

// Check: status text styling
const statusCheck = await page.evaluate(() => {
  const rows = document.querySelectorAll('tbody tr');
  const results = [];
  rows.forEach((row, i) => {
    if (i >= 3) return;
    const statusTd = row.querySelectorAll('td')[3];
    if (!statusTd) return;
    const span = statusTd.querySelector('span');
    if (!span) return;
    const st = getComputedStyle(span);
    results.push({
      text: span.textContent?.trim().slice(0, 25),
      bg: st.backgroundColor,
      border: st.borderWidth,
      textTransform: st.textTransform,
    });
  });
  return results;
});

console.log('\n[TICKETS]');
console.log('  Badge spans with bg:', badgeCheck.length, badgeCheck.length === 0 ? '✅' : '❌', badgeCheck[0] ?? '');
console.log('  Priority dots:', dotCheck.count, dotCheck.count > 0 ? '✅' : '❌');
console.log('  Dot samples:', dotCheck.samples);
console.log('  Status cells:', statusCheck);

await page.screenshot({ path: `${OUT}/status-priority-01-tickets.png` });

// ── Navigate to /board via sidebar ────────────────────────────────────────
const boardLink = page.locator('aside a[href="/board"]').first();
if (await boardLink.count() > 0) {
  await boardLink.click();
  await page.waitForTimeout(2000);
}
console.log('\nBoard URL:', page.url());

const boardDotCheck = await page.evaluate(() => {
  const dots = Array.from(document.querySelectorAll('span'))
    .filter(s => s.className.includes('w-2') && s.className.includes('h-2') && s.className.includes('rounded-full'));
  return {
    count: dots.length,
    samples: dots.slice(0, 3).map(d => ({ style: d.getAttribute('style'), text: d.nextElementSibling?.textContent?.trim() }))
  };
});

console.log('[BOARD]');
console.log('  Priority dots:', boardDotCheck.count, boardDotCheck.count > 0 ? '✅' : '❌');
console.log('  Dot samples:', boardDotCheck.samples);

await page.screenshot({ path: `${OUT}/status-priority-02-board.png` });

await browser.close();

console.log('\n═══════════ FINAL VERDICT ═══════════');
const checks = [
  [badgeCheck.length === 0, 'No badge backgrounds in tickets'],
  [dotCheck.count > 0, `Priority dots in tickets (${dotCheck.count})`],
  [statusCheck.every(s => s.textTransform === 'uppercase' || s.bg === 'rgba(0, 0, 0, 0)'), 'Status is plain uppercase text'],
  [boardDotCheck.count > 0, `Priority dots in board (${boardDotCheck.count})`],
];
checks.forEach(([pass, label]) => console.log(pass ? '✅' : '❌', label));
const verdict = checks.every(([p]) => p);
console.log(verdict ? '\nVerdict: ✅ PASS' : '\nVerdict: ❌ FAIL');
