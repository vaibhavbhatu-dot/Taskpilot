import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

// Login first
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20_000 });
const adminBtn = page.locator('button, div[role="button"]').filter({ hasText: /admin/i }).first();
if (await adminBtn.count() > 0) { await adminBtn.click(); await page.waitForTimeout(300); }
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10_000 });
await page.waitForTimeout(1500);

// /tickets
const ticketsNav = page.locator('aside a').filter({ hasText: /my tickets/i }).first();
if (await ticketsNav.count() > 0) { await ticketsNav.click(); await page.waitForTimeout(1200); }
await page.screenshot({ path: `${OUT}/badge-tickets.png` });
console.log('Tickets page captured');

// /board
const boardNav = page.locator('aside a').filter({ hasText: /kanban board/i }).first();
if (await boardNav.count() > 0) {
  await boardNav.click();
  await page.waitForURL(url => url.href.includes('/board'), { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(1200);
}
await page.screenshot({ path: `${OUT}/badge-board.png` });
console.log('Board page captured');

// /style-guide/components/badge (light mode)
await page.goto('http://localhost:5173/style-guide/components/badge', { waitUntil: 'networkidle', timeout: 15_000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/badge-styleguide.png` });
console.log('Style guide badge page captured');

await browser.close();
