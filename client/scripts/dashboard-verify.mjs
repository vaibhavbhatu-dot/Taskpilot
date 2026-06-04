import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');
const errors = [];

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => errors.push('[pageerror] ' + e.message));
page.on('console', e => { if (e.type() === 'error') errors.push('[console.error] ' + e.text()); });

// ── 1. New user (newuser@newcompany.com) dashboard ─────────────────────────
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
await page.fill('input[type="email"]', 'newuser@newcompany.com');
await page.fill('input[type="password"]', 'password123');
await page.click('button[type="submit"]');
await page.waitForURL('**/', { timeout: 10000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/dash-new-01-onboarding-cards.png`, fullPage: true });
console.log('dash-01: new user dashboard captured');

// Check for welcome banner
const hasBanner = await page.locator('text=Welcome to TaskPilot').isVisible().catch(() => false);
const hasCards = await page.locator('text=Create your first ticket').isVisible().catch(() => false);
const hasProgress = await page.locator('text=0/4').isVisible().catch(() => false);
const hasNoLeakedTickets = !(await page.locator('text=CP-').isVisible().catch(() => false));
const hasNoLeakedActivity = !(await page.locator('text=Deepak').isVisible().catch(() => false));

console.log('  Welcome banner visible:', hasBanner ? '✓' : '✗');
console.log('  Checklist cards visible:', hasCards ? '✓' : '✗');
console.log('  Progress shows 0/4:', hasProgress ? '✓' : '✗');
console.log('  No leaked CP tickets:', hasNoLeakedTickets ? '✓' : '✗');
console.log('  No leaked demo user activity:', hasNoLeakedActivity ? '✓' : '✗');

// ── 2. Dismiss tour if active, then click "Create ticket" card ───────────
const tourActive = await page.locator('text=Skip tour').first().isVisible().catch(() => false);
if (tourActive) {
  await page.locator('text=Skip tour').first().click();
  await page.waitForTimeout(300);
  console.log('  Tour dismissed');
}

await page.locator('a', { hasText: 'Create your first ticket' }).first().click();
await page.waitForURL('**/tickets', { timeout: 8000 });
await page.waitForTimeout(500);
console.log('  Navigated to /tickets ✓');
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/dash-new-02-after-tickets.png` });
console.log('dash-02: back to dashboard after /tickets');

// ── 3. Admin user dashboard — should show NO onboarding section ─────────────
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 10000 });
await page.fill('input[type="email"]', 'admin@taskpilot.com');
await page.fill('input[type="password"]', 'admin123');
await page.click('button[type="submit"]');
await page.waitForURL('**/', { timeout: 10000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/dash-new-03-admin-no-onboarding.png`, fullPage: true });

const adminHasOnboarding = await page.locator('text=Welcome to TaskPilot, Arjun').isVisible().catch(() => false);
const adminHasCPTickets = await page.locator('text=CP-').isVisible().catch(() => false);
console.log('\nAdmin dashboard:');
console.log('  No onboarding section:', !adminHasOnboarding ? '✓' : '✗');
console.log('  CP tickets visible (their data):', adminHasCPTickets ? '✓' : '✗');

// ── Errors ───────────────────────────────────────────────────────────────────
console.log('\n── Console errors ──────────────────────');
console.log(errors.length ? errors.join('\n') : 'none');

await browser.close();
