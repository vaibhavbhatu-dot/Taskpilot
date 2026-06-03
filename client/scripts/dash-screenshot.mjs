import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT    = resolve('scripts', 'shots');
mkdirSync(OUT, { recursive: true });

async function loginAs(page, email, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15_000 });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(u => !u.href.includes('/login'), { timeout: 8_000 });
  await page.waitForTimeout(1800);
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const errors = [];

// ── Admin dashboard ────────────────────────────────────────────────────────
{
  const ctx  = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[admin] ${e.message}`));
  await loginAs(page, 'admin@taskpilot.com', 'admin123');
  await page.screenshot({ path: `${OUT}/dash-admin.png` });
  console.log('dash-admin.png captured');
  await ctx.close();
}

// ── Manager dashboard ──────────────────────────────────────────────────────
{
  const ctx  = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[manager] ${e.message}`));
  await loginAs(page, 'vikram@taskpilot.com', 'demo123');
  await page.screenshot({ path: `${OUT}/dash-manager.png` });
  console.log('dash-manager.png captured');
  await ctx.close();
}

// ── Member dashboard ───────────────────────────────────────────────────────
{
  const ctx  = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(`[member] ${e.message}`));
  await loginAs(page, 'rahul@taskpilot.com', 'demo123');
  await page.screenshot({ path: `${OUT}/dash-member.png` });
  console.log('dash-member.png captured');
  await ctx.close();
}

await browser.close();
if (errors.length) console.error('Errors:', errors);
else console.log('No page errors.');
