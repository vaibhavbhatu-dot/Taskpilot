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
page.on('requestfailed', r => errors.push('[reqfail] ' + r.url() + ' — ' + r.failure()?.errorText));

// ── STEP 1: Fill the signup form ─────────────────────────────────────────────
await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/flow-01-signup-blank.png`, fullPage: true });
console.log('flow-01: signup page blank');

await page.fill('input[placeholder="Arjun Patel"]', 'Test User');
await page.fill('input[type="email"]', 'test@example.com');
await page.waitForTimeout(300); // let company auto-fill trigger
await page.fill('input[placeholder="Min. 8 characters"]', 'Password123!');
await page.waitForTimeout(150);
// Fill confirm password (second password field)
const pwdInputs = await page.locator('input[type="password"]').all();
if (pwdInputs[1]) await pwdInputs[1].fill('Password123!');
await page.waitForTimeout(300);

await page.screenshot({ path: `${OUT}/flow-02-signup-filled.png`, fullPage: true });
console.log('flow-02: signup form filled');

// ── STEP 2: Submit ────────────────────────────────────────────────────────────
await page.click('button[type="submit"]');
await page.waitForTimeout(2000); // wait for API + navigation

const afterSubmitUrl = page.url();
console.log('URL after submit:', afterSubmitUrl);
await page.screenshot({ path: `${OUT}/flow-03-after-submit.png`, fullPage: true });
console.log('flow-03: after submit captured, url =', afterSubmitUrl);

if (!afterSubmitUrl.includes('/verify-email')) {
  console.log('WARNING: did not navigate to /verify-email');
  await browser.close();
  console.log('\nConsole errors:', errors.length ? errors : 'none');
  process.exit(0);
}

// ── STEP 3: Verify email page inspection ────────────────────────────────────
// Check dev OTP banner
const devOtp = await page.evaluate(() => sessionStorage.getItem('dev_otp'));
const bannerVisible = await page.locator('text=Dev mode').isVisible().catch(() => false);
const otpBoxes = await page.locator('input[type="text"][maxlength="1"]').count();
const stepperStep2 = await page.locator('text=Verify').first().isVisible().catch(() => false);

console.log('\n── Checklist ──────────────────────────────');
console.log('Dev OTP in sessionStorage:', devOtp ?? '(none)');
console.log('Dev banner visible:', bannerVisible);
console.log('OTP boxes count:', otpBoxes);
console.log('Stepper "Verify" label visible:', stepperStep2);

await page.screenshot({ path: `${OUT}/flow-04-verify-page.png`, fullPage: true });
console.log('flow-04: verify page captured');

// ── STEP 4: Enter 000000 and submit ─────────────────────────────────────────
const boxes = await page.locator('input[type="text"][maxlength="1"]').all();
const digits = ['0','0','0','0','0','0'];
for (let i = 0; i < boxes.length; i++) {
  await boxes[i].click();
  await boxes[i].type(digits[i]);
  await page.waitForTimeout(80);
}
await page.waitForTimeout(2500); // auto-submit fires + API round-trip

const afterOtpUrl = page.url();
console.log('URL after 000000 entry:', afterOtpUrl);
await page.screenshot({ path: `${OUT}/flow-05-after-otp.png`, fullPage: true });
console.log('flow-05: after OTP captured, url =', afterOtpUrl);

// ── Report ────────────────────────────────────────────────────────────────────
console.log('\n── Console errors ──────────────────────────');
if (errors.length === 0) {
  console.log('none');
} else {
  errors.forEach(e => console.log(e));
}

await browser.close();
