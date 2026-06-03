import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));

// Colors page (default redirect)
await page.goto('http://localhost:5173/style-guide', { waitUntil: 'networkidle', timeout: 20_000 });
await page.waitForTimeout(1200);
console.log('URL after redirect:', page.url());
await page.screenshot({ path: `${OUT}/sg-new-colors.png` });

// Button page
await page.goto('http://localhost:5173/style-guide/components/button', { waitUntil: 'networkidle', timeout: 10_000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/sg-new-button.png` });
console.log('Button page captured');

// Show source toggle test
const showBtn = page.locator('button').filter({ hasText: /show source/i }).first();
if (await showBtn.count() > 0) {
  await showBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/sg-new-button-source.png` });
  console.log('Source toggle works');
}

// Badge page
await page.goto('http://localhost:5173/style-guide/components/badge', { waitUntil: 'networkidle', timeout: 10_000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/sg-new-badge.png` });
console.log('Badge page captured');

await browser.close();
console.log('All screenshots saved.');
