import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.error('[pageerror]', e.message));

// Read the raw CSS custom property value from :root
async function getCSSVar(varName) {
  return page.evaluate(v =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim()
  , varName);
}

// Get computed bg of first button matching selector (or first blue-ish button)
async function findPrimaryBtnColor() {
  return page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      const bg = getComputedStyle(btn).backgroundColor;
      const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) {
        const [, r, g, b] = m.map(Number);
        // Blue-ish: B is the dominant channel and decently saturated
        if (b > 150 && b > r + 60 && b > g + 60) return { bg, r, g, b };
      }
    }
    return null;
  });
}

// ── Login ─────────────────────────────────────────────────────────────────
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 20_000 });
await page.waitForTimeout(1500);
const adminBtn = page.locator('button').filter({ hasText: /admin/i }).first();
if (await adminBtn.count() > 0) {
  await adminBtn.click();
  await page.waitForTimeout(300);
} else {
  await page.locator('input[type="email"]').first().fill('admin@taskpilot.com');
  await page.locator('input[type="password"]').first().fill('admin123');
}
await page.locator('button[type="submit"]').first().click();
await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10_000 }).catch(() => {});
await page.waitForTimeout(2000);
console.log('Logged in →', page.url());

// ── 1. Dashboard ──────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15_000 });
await page.waitForTimeout(1200);
const dashPrimary = await getCSSVar('--primary');
const dashBackground = await getCSSVar('--background');
const dashBodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const dashBtn = await findPrimaryBtnColor();
console.log('\n[DASHBOARD]');
console.log('  --primary CSS var:', dashPrimary);
console.log('  --background CSS var:', dashBackground);
console.log('  body computed bg:', dashBodyBg);
console.log('  first blue button:', dashBtn ? JSON.stringify(dashBtn) : 'none found');
await page.screenshot({ path: `${OUT}/blue-verify-01-dashboard.png` });

// ── 2. Tickets ────────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/tickets', { waitUntil: 'domcontentloaded', timeout: 15_000 });
await page.waitForTimeout(1200);
const ticketBtn = await findPrimaryBtnColor();
const ticketPrimary = await getCSSVar('--primary');
console.log('\n[TICKETS]');
console.log('  --primary CSS var:', ticketPrimary);
console.log('  first blue button:', ticketBtn ? JSON.stringify(ticketBtn) : 'none found');
await page.screenshot({ path: `${OUT}/blue-verify-02-tickets.png` });

// ── 3. Board ──────────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/board', { waitUntil: 'domcontentloaded', timeout: 15_000 });
await page.waitForTimeout(1500);
const boardBtn = await findPrimaryBtnColor();
const boardPrimary = await getCSSVar('--primary');
console.log('\n[BOARD]');
console.log('  --primary CSS var:', boardPrimary);
console.log('  first blue button:', boardBtn ? JSON.stringify(boardBtn) : 'none found');
await page.screenshot({ path: `${OUT}/blue-verify-03-board.png` });

// ── 4. Style Guide — Button page, light mode ──────────────────────────────
await page.goto('http://localhost:5173/style-guide', { waitUntil: 'domcontentloaded', timeout: 15_000 });
await page.waitForTimeout(1000);
// Ensure light mode
await page.evaluate(() => {
  localStorage.removeItem('sg-dark-mode');
  document.documentElement.classList.remove('dark');
});
await page.waitForTimeout(400);
const sgPrimary = await getCSSVar('--primary');
const sgBackground = await getCSSVar('--background');
const sgBodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const sgBtn = await findPrimaryBtnColor();
console.log('\n[STYLE-GUIDE light]');
console.log('  --primary CSS var:', sgPrimary);
console.log('  --background CSS var:', sgBackground);
console.log('  body computed bg:', sgBodyBg);
console.log('  first blue button:', sgBtn ? JSON.stringify(sgBtn) : 'none found');
await page.screenshot({ path: `${OUT}/blue-verify-04-styleguide-light.png` });

// ── 5. Dark mode ──────────────────────────────────────────────────────────
await page.evaluate(() => {
  localStorage.setItem('sg-dark-mode', 'dark');
  document.documentElement.classList.add('dark');
});
await page.waitForTimeout(600);
const darkPrimary = await getCSSVar('--primary');
const darkBackground = await getCSSVar('--background');
const darkBodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const darkBtn = await findPrimaryBtnColor();
console.log('\n[STYLE-GUIDE dark]');
console.log('  --primary CSS var:', darkPrimary, ' (expect: 217 91% 60%)');
console.log('  --background CSS var:', darkBackground, ' (expect: 222 47% 11%)');
console.log('  body computed bg:', darkBodyBg, ' (expect dark navy)');
console.log('  first blue button:', darkBtn ? JSON.stringify(darkBtn) : 'none found');
await page.screenshot({ path: `${OUT}/blue-verify-05-styleguide-dark.png` });

await browser.close();

// ─── PASS/FAIL checks ─────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════');
console.log('BLUE COLOR SYSTEM — VERIFICATION');
console.log('═══════════════════════════════════');

// CSS vars should be exactly what we set
const primaryLightOK = dashPrimary === '221 83% 53%';
const backgroundLightOK = dashBackground === '210 40% 98%';
const primaryDarkOK = darkPrimary === '217 91% 60%';
const backgroundDarkOK = darkBackground === '222 47% 11%';

// Body bg: #F8FAFC = rgb(248, 250, 252)
const bodyBgOK = sgBodyBg.includes('248, 250, 252') || sgBodyBg.includes('248,250,252');

// Dark body: navy — R < 30, G < 40, B < 60
const m = darkBodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
const darkNavyOK = m && +m[1] < 30 && +m[2] < 40 && +m[3] < 60;

// Any blue button found
const dashBlueOK = !!dashBtn;
const ticketBlueOK = !!ticketBtn;
const boardBlueOK = !!boardBtn;
const sgBlueOK = !!sgBtn;
const darkBlueOK = !!darkBtn;

const p = (ok, label) => console.log(`  ${ok ? '✅' : '❌'} ${label}`);

console.log('\nCSS Variables:');
p(primaryLightOK, `--primary light: "${dashPrimary}" (want: 221 83% 53%)`);
p(backgroundLightOK, `--background light: "${dashBackground}" (want: 210 40% 98%)`);
p(primaryDarkOK, `--primary dark: "${darkPrimary}" (want: 217 91% 60%)`);
p(backgroundDarkOK, `--background dark: "${darkBackground}" (want: 222 47% 11%)`);

console.log('\nComputed Colors:');
p(bodyBgOK, `Light body bg: ${sgBodyBg} (want #F8FAFC / rgb(248,250,252))`);
p(darkNavyOK, `Dark body bg: ${darkBodyBg} (want dark navy)`);

console.log('\nBlue Buttons Found:');
p(dashBlueOK, `/dashboard — blue button: ${dashBtn ? dashBtn.bg : 'NONE'}`);
p(ticketBlueOK, `/tickets — blue button: ${ticketBtn ? ticketBtn.bg : 'NONE'}`);
p(boardBlueOK, `/board — blue button: ${boardBtn ? boardBtn.bg : 'NONE'}`);
p(sgBlueOK, `/style-guide light — blue button: ${sgBtn ? sgBtn.bg : 'NONE'}`);
p(darkBlueOK, `/style-guide dark — blue button: ${darkBtn ? darkBtn.bg : 'NONE'}`);

const allPass = [primaryLightOK, backgroundLightOK, primaryDarkOK, backgroundDarkOK,
                 bodyBgOK, darkNavyOK, dashBlueOK, ticketBlueOK, boardBlueOK, sgBlueOK, darkBlueOK];
console.log(`\nVerdict: ${allPass.every(Boolean) ? '✅ PASS' : '❌ FAIL'} (${allPass.filter(Boolean).length}/${allPass.length} checks)`);
console.log('\nScreenshots saved to', OUT);
