import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleErrors = [];
const networkErrors = [];

page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('requestfailed', req => {
  networkErrors.push({ url: req.url(), failure: req.failure()?.errorText });
});
page.on('response', resp => {
  if (!resp.ok() && resp.url().includes('localhost:5000')) {
    networkErrors.push({ url: resp.url(), status: resp.status() });
  }
});

// ── Login via form ────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 20_000 });
await page.waitForTimeout(1000);
await page.locator('input[type="email"]').fill('admin@taskpilot.com');
await page.locator('input[type="password"]').fill('admin123');
await page.locator('button[type="submit"]').click();
await page.waitForURL(url => !url.href.includes('/login'), { timeout: 12_000 }).catch(() => {});
await page.waitForTimeout(3000);
console.log('After login →', page.url());

// ── 1. Dashboard ──────────────────────────────────────────────────────────
consoleErrors.length = 0;
networkErrors.length = 0;

// Wait for dashboard content to load (up to 8s)
const dashLoaded = await page.waitForFunction(() => {
  // Check if skeleton is gone (no skeleton pulse elements)
  const skeletons = document.querySelectorAll('.animate-pulse');
  // Check if there's real content (KPI cards or error state)
  const hasContent = document.querySelector('[class*="grid-cols-4"]') ||
                     document.querySelector('[class*="text-destructive"]') ||
                     document.querySelector('button[class*="bg-primary"]');
  return skeletons.length === 0 && !!hasContent;
}, {}, { timeout: 8000 }).catch(() => null);

const dashUrl = page.url();
const dashStillSkeleton = await page.evaluate(() =>
  !!document.querySelector('.animate-pulse')
);
const dashHasError = await page.evaluate(() =>
  document.body.innerText.includes('Failed to load dashboard')
);
const dashHasContent = await page.evaluate(() => {
  // Check for KPI number — a large number text in the card grid
  const grids = document.querySelectorAll('[class*="grid-cols-4"]');
  return grids.length > 0;
});

console.log('\n[DASHBOARD]');
console.log('  URL:', dashUrl);
console.log('  Still on skeleton:', dashStillSkeleton);
console.log('  Shows error state:', dashHasError);
console.log('  Shows content (KPI grid):', dashHasContent);
console.log('  Console errors:', consoleErrors.slice(0, 3));
console.log('  Network errors:', networkErrors.slice(0, 3));

await page.screenshot({ path: `${OUT}/loading-verify-01-dashboard.png` });

// ── 2. My Work (SPA navigation) ───────────────────────────────────────────
consoleErrors.length = 0;
networkErrors.length = 0;

const myWorkLink = page.locator('aside a[href="/my-work"]').first();
if (await myWorkLink.count() > 0) {
  await myWorkLink.click();
} else {
  await page.evaluate(() => window.history.pushState({}, '', '/my-work'));
}
await page.waitForTimeout(4000);

const myWorkUrl = page.url();
const myWorkError = await page.evaluate(() =>
  document.body.innerText.includes('Failed to load tasks')
);
const myWorkEmpty = await page.evaluate(() =>
  document.body.innerText.includes('No tasks due') ||
  document.body.innerText.includes('No tasks today') ||
  document.body.innerText.includes("You're all caught up")
);
const myWorkContent = await page.evaluate(() =>
  document.querySelectorAll('[class*="bg-card"][class*="border"]').length > 2
);
const myWorkLoading = await page.evaluate(() =>
  !!document.querySelector('.animate-pulse')
);

// Check what network errors occurred for my-work
const myWorkNetErrors = networkErrors.filter(e => e.url?.includes('my-work'));

console.log('\n[MY WORK]');
console.log('  URL:', myWorkUrl);
console.log('  Still loading (skeleton):', myWorkLoading);
console.log('  Shows "Failed to load tasks":', myWorkError);
console.log('  Shows empty state:', myWorkEmpty);
console.log('  Shows ticket content:', myWorkContent);
console.log('  My-work network errors:', myWorkNetErrors);
console.log('  All network errors:', networkErrors.slice(0, 5));
console.log('  Console errors:', consoleErrors.slice(0, 3));

await page.screenshot({ path: `${OUT}/loading-verify-02-mywork.png` });

await browser.close();

console.log('\n═══ VERDICT ═══');
const dashPass = !dashStillSkeleton && (dashHasContent || dashHasError);
const myWorkPass = !myWorkLoading && (myWorkContent || myWorkEmpty || myWorkError);
console.log(dashPass ? '✅' : '❌', 'Dashboard: exits skeleton and shows content or error state');
console.log(myWorkPass ? '✅' : '❌', 'My Work: exits loading and shows content, empty, or error state');
