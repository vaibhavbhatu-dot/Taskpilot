import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Login
await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 20_000 });
await page.waitForTimeout(800);
await page.locator('input[type="email"]').fill('admin@taskpilot.com');
await page.locator('input[type="password"]').fill('admin123');
await page.locator('button[type="submit"]').click();
await page.waitForURL(url => !url.href.includes('/login'), { timeout: 12_000 }).catch(() => {});
await page.waitForTimeout(2500);
console.log('Logged in →', page.url());

// Navigate to Tickets via sidebar
const ticketsLink = page.locator('aside a[href="/tickets"]').first();
if (await ticketsLink.count() > 0) {
  await ticketsLink.click();
  await page.waitForTimeout(2000);
}

// Click first ticket row
const firstRow = page.locator('tbody tr').first();
if (await firstRow.count() > 0) {
  await firstRow.click();
  await page.waitForTimeout(2000);
}

const info = await page.evaluate(() => ({
  url: window.location.pathname,
  isDetail: window.location.pathname.startsWith('/tickets/') && window.location.pathname.length > '/tickets/'.length,
  hasStatusSelect: !!document.querySelector('select'),
  title: document.querySelector('h1')?.textContent?.trim() ?? document.title,
}));

console.log('[BUG 5 — TicketDetail]', info.isDetail ? '✅ FIXED' : '❌ FAIL', info);
await page.screenshot({ path: `${OUT}/bugs-verify-05-ticket.png` });
await browser.close();
