import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

// Login
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20_000 });
const adminBtn = page.locator('button, div[role="button"]').filter({ hasText: /admin/i }).first();
if (await adminBtn.count() > 0) { await adminBtn.click(); await page.waitForTimeout(300); }
await page.locator('button[type="submit"], button:has-text("Sign In")').first().click();
await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10_000 });
await page.waitForTimeout(1500);

// Enable dark mode via localStorage
await page.evaluate(() => {
  localStorage.setItem('theme', 'dark');
  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
});
await page.waitForTimeout(500);

// Screenshot Dashboard dark
await page.screenshot({ path: `${OUT}/dark-dashboard.png` });
console.log('dark-dashboard.png — URL:', page.url());

// Tickets dark
const ticketsNav = page.locator('aside a').filter({ hasText: /my tickets/i }).first();
if (await ticketsNav.count() > 0) { await ticketsNav.click(); await page.waitForTimeout(1500); }
await page.screenshot({ path: `${OUT}/dark-tickets.png` });
console.log('dark-tickets.png — URL:', page.url());

// Board dark
const boardNav = page.locator('aside a').filter({ hasText: /kanban board/i }).first();
if (await boardNav.count() > 0) {
  await boardNav.click();
  await page.waitForURL(url => url.href.includes('/board'), { timeout: 8_000 }).catch(() => {});
  await page.waitForTimeout(1500);
}
await page.screenshot({ path: `${OUT}/dark-board.png` });
console.log('dark-board.png — URL:', page.url());

await browser.close();
console.log('Dark mode screenshots done.');
