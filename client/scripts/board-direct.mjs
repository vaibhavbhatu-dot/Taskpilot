import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', msg => { if (msg.type() === 'error') console.log('[console.error]', msg.text()); });
page.on('response', res => {
  if (res.url().includes('/api/auth') || res.url().includes('/api/me')) {
    console.log('[API]', res.request().method(), res.url(), '→', res.status());
  }
});

// Login
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20_000 });
const adminBtn = page.locator('button, div[role="button"]').filter({ hasText: /admin/i }).first();
if (await adminBtn.count() > 0) { await adminBtn.click(); await page.waitForTimeout(300); }
await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Sign in")').first().click();
try {
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10_000 });
  console.log('Logged in →', page.url());
} catch {
  console.log('Login timeout, current URL:', page.url());
}
await page.waitForTimeout(2000);

// Use client-side nav to preserve in-memory auth state
const boardLink = page.locator('aside a').filter({ hasText: /kanban board/i }).first();
if (await boardLink.count() > 0) {
  await boardLink.click();
  console.log('Clicked Kanban Board nav link');
} else {
  await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')));
  await page.goto('http://localhost:5173/board', { waitUntil: 'networkidle', timeout: 20_000 });
}
try {
  await page.waitForURL(url => url.href.includes('/board'), { timeout: 8_000 });
  console.log('Navigated to board:', page.url());
} catch {
  console.log('Board nav timeout, URL:', page.url());
}
await page.waitForTimeout(2500);
console.log('Board URL:', page.url());
await page.screenshot({ path: `${OUT}/board-direct.png` });
console.log('Board screenshot saved');

// Also open Create Ticket panel
const createBtn = page.locator('button').filter({ hasText: /create ticket/i }).first();
if (await createBtn.count() > 0) {
  await createBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/board-create-panel.png` });
  console.log('Board create panel screenshot saved');
}

await browser.close();
