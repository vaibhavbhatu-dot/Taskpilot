import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.error('[pageerror]', e.message));

// 1 — Signup empty
await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/signup-01-empty.png`, fullPage: true });
console.log('signup-01 empty captured');

// 2 — Signup filled (triggers company auto-fill + password strength)
await page.fill('input[placeholder="Arjun Patel"]', 'Arjun Patel');
await page.fill('input[type="email"]', 'arjun@acmecorp.com');
await page.waitForTimeout(300);
await page.fill('input[placeholder="Min. 8 characters"]', 'Password123!');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/signup-02-filled.png`, fullPage: true });
console.log('signup-02 filled captured');

// 3 — Verify email page (seed sessionStorage)
await page.evaluate(() => {
  sessionStorage.setItem('signup_email', 'arjun@acmecorp.com');
  sessionStorage.setItem('dev_otp', '482910');
});
await page.goto('http://localhost:5173/verify-email', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/signup-03-verify.png`, fullPage: true });
console.log('signup-03 verify captured');

// 4 — Login page (check new signup link)
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/signup-04-login-link.png`, fullPage: true });
console.log('signup-04 login link captured');

await browser.close();
