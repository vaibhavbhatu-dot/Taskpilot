import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('[pageerror]', e.message));

// 1. Dark mode body check — toggle dark on /style-guide
await page.goto('http://localhost:5173/style-guide', { waitUntil: 'networkidle', timeout: 20_000 });
await page.waitForTimeout(800);
await page.evaluate(() => {
  localStorage.setItem('sg-dark-mode', 'dark');
  document.documentElement.classList.add('dark');
});
await page.waitForTimeout(400);
const bodyBg = await page.evaluate(() =>
  getComputedStyle(document.body).backgroundColor
);
console.log('Dark mode body bg (should NOT be #f8fafc):', bodyBg);
await page.screenshot({ path: `${OUT}/verify-dark-body.png` });

// 2. Layout page
await page.goto('http://localhost:5173/style-guide/foundations/layout', { waitUntil: 'networkidle', timeout: 15_000 });
await page.waitForTimeout(600);
console.log('Layout page URL:', page.url());
await page.screenshot({ path: `${OUT}/verify-layout-page.png` });

// 3. AI Suggestion page
await page.goto('http://localhost:5173/style-guide/components/ai-suggestion', { waitUntil: 'networkidle', timeout: 15_000 });
await page.waitForTimeout(600);
console.log('AI Suggestion page URL:', page.url());
await page.screenshot({ path: `${OUT}/verify-ai-suggestion-page.png` });

await browser.close();
console.log('Verification done.');
