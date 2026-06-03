import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT    = resolve('scripts', 'shots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const ctx  = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

// ── 1. Login page ──────────────────────────────────────────────────────────
await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 20_000 });
await page.screenshot({ path: `${OUT}/app-01-login.png` });
console.log('01 login page captured');

// Click the "Admin" demo-credential button (fills email+password automatically)
const adminBtn = page.locator('button, div[role="button"]').filter({ hasText: /admin/i }).first();
if (await adminBtn.count() > 0) {
  await adminBtn.click();
  await page.waitForTimeout(300);
  console.log('Clicked Admin demo-credential button');
} else {
  // Fall back to manual fill
  await page.locator('input[type="email"], input[name="email"]').first().fill('admin@taskpilot.com');
  await page.locator('input[type="password"]').first().fill('admin123');
}

// Submit
await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Sign in")').first().click();

// Wait for navigation away from /login
try {
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10_000 });
  console.log('Logged in → ', page.url());
} catch {
  // Maybe password didn't work — try demo123
  console.log('First creds failed, trying demo123…');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.locator('input[type="email"], input[name="email"]').first().fill('admin@taskpilot.com');
  await page.locator('input[type="password"]').first().fill('demo123');
  await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Sign in")').first().click();
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 8_000 }).catch(() => {});
  console.log('After retry → ', page.url());
}

await page.waitForTimeout(2000);

// ── 2. Dashboard ───────────────────────────────────────────────────────────
await page.screenshot({ path: `${OUT}/app-02-dashboard.png` });
console.log('02 dashboard captured — ', page.url());

// ── 3. Tickets page ────────────────────────────────────────────────────────
const ticketsNav = page.locator('nav a, aside a').filter({ hasText: /ticket/i }).first();
if (await ticketsNav.count() > 0) {
  await ticketsNav.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/app-03-tickets.png` });
  console.log('03 tickets page captured');
}

// ── 4. Board page ──────────────────────────────────────────────────────────
const boardNav = page.locator('nav a, aside a').filter({ hasText: /board/i }).first();
if (await boardNav.count() > 0) {
  await boardNav.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/app-04-board.png` });
  console.log('04 board page captured');
}

// ── 5. Members page ────────────────────────────────────────────────────────
const membersNav = page.locator('nav a, aside a').filter({ hasText: /member/i }).first();
if (await membersNav.count() > 0) {
  await membersNav.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${OUT}/app-05-members.png` });
  console.log('05 members page captured');
}

if (errors.length) console.error('Page errors:', errors.slice(0, 5));
else console.log('No page errors detected.');

await browser.close();
console.log('\nAll screenshots saved to', OUT);
