import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT    = resolve('scripts', 'shots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx     = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page    = await ctx.newPage();
const errors  = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', msg => { if (msg.type() === 'error') console.log('[console.error]', msg.text()); });
page.on('response', res => {
  if (res.url().includes('/api/auth/')) {
    console.log('[API]', res.request().method(), res.url(), '→', res.status());
  }
});

// ── Login — same pattern that works in live-screenshot.mjs ────────────────
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20_000 });

// Click the "Admin" demo-credential button (auto-fills email + password)
const adminBtn = page.locator('button, div[role="button"]').filter({ hasText: /^Admin$/ }).first();
if (await adminBtn.count() > 0) {
  await adminBtn.click();
  await page.waitForTimeout(500);
  console.log('Admin credential button clicked');
} else {
  // Fallback: type credentials directly using Playwright's keyboard
  await page.locator('input[type="email"]').first().click();
  await page.keyboard.type('admin@taskpilot.com');
  await page.locator('input[type="password"]').first().click();
  await page.keyboard.type('admin123');
  console.log('Typed credentials manually');
}

// Submit
await page.locator('button[type="submit"]').first().click();

// Wait for navigation away from login
try {
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10_000 });
  console.log('Logged in, URL:', page.url());
} catch {
  console.log('Still on login, URL:', page.url());
  // Try reading any error displayed
  const errText = await page.locator('[class*="error"], [class*="alert"]').first().textContent().catch(() => '');
  if (errText) console.log('Page error text:', errText);
}

await page.waitForTimeout(2500);

// ── Client-side navigate to Tickets (preserves in-memory auth state) ──────
const ticketsLink = page.locator('nav a, aside a').filter({ hasText: /ticket/i }).first();
if (await ticketsLink.count() > 0) {
  await ticketsLink.click();
  console.log('Clicked Tickets nav link');
} else {
  // Fallback: use history.pushState (no full reload)
  await page.evaluate(() => window.history.pushState({}, '', '/tickets'));
}
await page.waitForTimeout(2000);
await page.screenshot({ path: `${OUT}/tickets-parta.png` });
console.log('tickets-parta.png — URL:', page.url());

if (errors.length) console.error('Page errors:', errors.slice(0, 5));
else console.log('No page errors.');

await browser.close();
