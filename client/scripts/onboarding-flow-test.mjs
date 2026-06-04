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

// ── 1. Signup ─────────────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle', timeout: 15000 });
await page.fill('input[placeholder="Arjun Patel"]', 'Test User');
await page.fill('input[type="email"]', 'test@example.com');
await page.waitForTimeout(300);
await page.fill('input[placeholder="Min. 8 characters"]', 'Password123!');
await page.waitForTimeout(150);
const pwdInputs = await page.locator('input[type="password"]').all();
if (pwdInputs[1]) await pwdInputs[1].fill('Password123!');
await page.click('button[type="submit"]');
await page.waitForURL('**/verify-email', { timeout: 10000 });
console.log('✓ Step 1: Signup → navigated to /verify-email');

// ── 2. Verify email (000000 bypass) ───────────────────────────────────────────
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/ob-01-verify.png`, fullPage: true });
const boxes = await page.locator('input[type="text"][maxlength="1"]').all();
for (let i = 0; i < 6; i++) { await boxes[i].click(); await boxes[i].type('0'); await page.waitForTimeout(60); }
await page.waitForURL('**/onboarding/profile', { timeout: 10000 });
console.log('✓ Step 2: OTP 000000 → navigated to /onboarding/profile');
await page.screenshot({ path: `${OUT}/ob-02-profile-page.png`, fullPage: true });

// ── 3. Profile page ────────────────────────────────────────────────────────────
await page.waitForTimeout(500);

// Type designation and check AI suggestion
await page.fill('input[placeholder="e.g. Frontend Developer"]', 'Engineering Manager');
await page.waitForTimeout(500);

const aiChipVisible = await page.locator('text=Based on your title').isVisible().catch(() => false);
console.log('  AI role suggestion chip visible:', aiChipVisible ? '✓' : '✗');
await page.screenshot({ path: `${OUT}/ob-03-profile-ai-suggest.png`, fullPage: true });

// Accept AI suggestion (MANAGER)
if (aiChipVisible) {
  await page.locator('text=Based on your title').locator('..').locator('button').first().click();
  await page.waitForTimeout(200);
}

// Click Continue
await page.locator('button', { hasText: 'Continue' }).click();
await page.waitForURL('**/onboarding/workspace', { timeout: 10000 });
console.log('✓ Step 3: Profile saved → navigated to /onboarding/workspace');

// ── 4. Workspace — Q1: Software team ──────────────────────────────────────────
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/ob-04-ws-q1.png`, fullPage: true });
await page.locator('button', { hasText: 'Software team' }).click();
await page.waitForTimeout(400);
console.log('✓ Step 4: Selected "Software team" → Q2');

// ── 5. Workspace — Q2: Sprints ─────────────────────────────────────────────────
await page.screenshot({ path: `${OUT}/ob-05-ws-q2.png` });
await page.locator('button', { hasText: 'We use sprints' }).click();
await page.waitForTimeout(400);
console.log('✓ Step 5: Selected "We use sprints" → Q3');

// ── 6. Workspace — Q3: Team size ───────────────────────────────────────────────
await page.screenshot({ path: `${OUT}/ob-06-ws-q3.png` });
await page.locator('button', { hasText: '2–5' }).click();
await page.waitForTimeout(400);
console.log('✓ Step 6: Selected "2–5" → generating...');

// ── 7. Loading animation ────────────────────────────────────────────────────────
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/ob-07-ws-generating.png` });
const loadingMsg = await page.locator('text=Setting up').isVisible().catch(() =>
  page.locator('text=Creating').isVisible().catch(() => false));
console.log('  Loading animation visible:', loadingMsg ? '✓' : '(already transitioned)');

// ── 8. Wait for "Workspace is ready!" ─────────────────────────────────────────
await page.waitForSelector('text=Your workspace is ready', { timeout: 15000 });
await page.screenshot({ path: `${OUT}/ob-08-ws-done.png`, fullPage: true });
console.log('✓ Step 7: "Workspace is ready!" shown');

// ── 9. Go to workspace ────────────────────────────────────────────────────────
await page.locator('button', { hasText: 'Go to my workspace' }).click();
await page.waitForURL('**/', { timeout: 8000 });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/ob-09-dashboard.png`, fullPage: true });
const url = page.url();
console.log('✓ Step 8: Navigated to dashboard:', url);

// Check project appears in sidebar
const hasProdProject = await page.locator('text=Product Development').first().isVisible().catch(() => false);
const hasProjGeneral = await page.locator('text=Product').first().isVisible().catch(() => false);
console.log('  "Product Development" visible on dashboard:', (hasProdProject || hasProjGeneral) ? '✓' : '✗ (may need page refresh)');

// ── Summary ────────────────────────────────────────────────────────────────────
console.log('\n── Console errors ──────────────────────');
console.log(errors.length ? errors.join('\n') : 'none');

await browser.close();
