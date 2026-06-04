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

// ── 1. Full signup + onboarding flow ─────────────────────────────────────────
console.log('Running full signup → onboarding flow...');

// Signup
await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle', timeout: 15000 });
await page.fill('input[placeholder="Arjun Patel"]', 'Test User');
await page.fill('input[type="email"]', 'test@example.com');
await page.waitForTimeout(200);
await page.fill('input[placeholder="Min. 8 characters"]', 'Password123!');
const pwdInputs = await page.locator('input[type="password"]').all();
if (pwdInputs[1]) await pwdInputs[1].fill('Password123!');
await page.click('button[type="submit"]');
await page.waitForURL('**/verify-email', { timeout: 10000 });

// Verify
await page.waitForSelector('input[type="text"][maxlength="1"]', { timeout: 10000 });
const boxes = await page.locator('input[type="text"][maxlength="1"]').all();
for (let i = 0; i < 6; i++) { await boxes[i].click(); await boxes[i].type('0'); await page.waitForTimeout(80); }
await page.waitForURL('**/onboarding/profile', { timeout: 12000 });

// Profile — skip
await page.locator('button', { hasText: 'Skip for now' }).click();
await page.waitForURL('**/onboarding/workspace', { timeout: 8000 });

// Workspace — Software → Sprints → Solo
await page.locator('button', { hasText: 'Software team' }).click();
await page.waitForTimeout(300);
await page.locator('button', { hasText: 'We use sprints' }).click();
await page.waitForTimeout(300);
await page.locator('button', { hasText: 'Just me' }).click();
await page.waitForSelector('text=Your workspace is ready', { timeout: 15000 });
await page.locator('button', { hasText: 'Go to my workspace' }).click();
await page.waitForURL('**/', { timeout: 8000 });
await page.waitForTimeout(1200);
console.log('✓ Arrived at dashboard');

// ── 2. Tour auto-starts ───────────────────────────────────────────────────────
await page.screenshot({ path: `${OUT}/tour-01-dashboard-tour.png`, fullPage: false });

const overlayExists = await page.locator('[style*="z-index: 9200"]').count().catch(() => 0);
const tooltipVisible = await page.locator('text=Your command center').isVisible().catch(() => false);
const skipBtnVisible = await page.locator('text=Skip tour').first().isVisible().catch(() => false);
const progressDot = await page.locator('div.bg-\\[\\#2563EB\\]').first().isVisible().catch(() => false);

console.log('✓ Step 2: Tour tooltip:');
console.log('  Tooltip "Your command center" visible:', tooltipVisible ? '✓' : '✗');
console.log('  Skip tour button visible:', skipBtnVisible ? '✓' : '✗');

// ── 3. Click Next → step 2 (Tickets) ─────────────────────────────────────────
await page.locator('button', { hasText: 'Next →' }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/tour-02-tickets-step.png` });
const ticketsTooltip = await page.locator('text=All your work lives here').isVisible().catch(() => false);
console.log('  After Next → "All your work lives here" visible:', ticketsTooltip ? '✓' : '✗');

// ── 4. Click Next twice more → step 4 (Sprints) ──────────────────────────────
await page.locator('button', { hasText: 'Next →' }).click();
await page.waitForTimeout(300);
await page.locator('button', { hasText: 'Next →' }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/tour-03-sprints-step.png` });
const sprintsTooltip = await page.locator('text=Plan in sprints').isVisible().catch(() => false);
console.log('  After 2× Next → "Plan in sprints" visible:', sprintsTooltip ? '✓' : '✗');

// ── 5. Skip tour ──────────────────────────────────────────────────────────────
await page.locator('text=Skip tour').first().click();
await page.waitForTimeout(300);
const tourGone = !(await page.locator('text=Plan in sprints').isVisible().catch(() => false));
await page.screenshot({ path: `${OUT}/tour-04-after-skip.png` });
console.log('  After skip — tour dismissed:', tourGone ? '✓' : '✗');

// ── 6. Checklist in sidebar ───────────────────────────────────────────────────
const checklistVisible = await page.locator('text=Get started').isVisible().catch(() => false);
console.log('\n✓ Step 3: Checklist:');
console.log('  "Get started" visible in sidebar:', checklistVisible ? '✓' : '✗');

await page.screenshot({ path: `${OUT}/tour-05-checklist.png` });

// Click the "Get started" toggle to expand
// Checklist starts expanded — items should be visible already
const item1 = await page.locator('text=Create your first ticket').isVisible().catch(() => false);
const item2 = await page.locator('text=Move a ticket on the board').isVisible().catch(() => false);
const item3 = await page.locator('text=Invite a team member').isVisible().catch(() => false);
const item4 = await page.locator('text=Check your active sprint').isVisible().catch(() => false);
console.log('  4 checklist items visible:', (item1 && item2 && item3 && item4) ? '✓' : `✗ (1:${item1} 2:${item2} 3:${item3} 4:${item4})`);
await page.screenshot({ path: `${OUT}/tour-06-checklist-expanded.png` });

// Test collapse/expand toggle
if (checklistVisible) {
  await page.locator('button', { hasText: 'Get started' }).click();
  await page.waitForTimeout(200);
  const collapsedOk = !(await page.locator('text=Create your first ticket').isVisible().catch(() => false));
  console.log('  Toggle collapses checklist:', collapsedOk ? '✓' : '✗');
  // Re-expand
  await page.locator('button', { hasText: 'Get started' }).click();
  await page.waitForTimeout(200);
}

// ── 7. Navigate to tickets ─────────────────────────────────────────────────────
await page.locator('a', { hasText: 'Create your first ticket' }).first().click();
await page.waitForURL('**/tickets', { timeout: 8000 });
await page.waitForTimeout(500);
const onTicketsPage = page.url().includes('/tickets');
console.log('  Checklist link → /tickets:', onTicketsPage ? '✓' : '✗');
await page.screenshot({ path: `${OUT}/tour-07-tickets-navigate.png` });

// ── 8. Console errors ─────────────────────────────────────────────────────────
console.log('\n── Console errors ──────────────────────');
console.log(errors.length ? errors.join('\n') : 'none');

await browser.close();
