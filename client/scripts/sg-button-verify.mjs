import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

// Navigate to button page (correct route)
await page.goto('http://localhost:5173/style-guide/components/button', { waitUntil: 'domcontentloaded', timeout: 15_000 });
await page.waitForTimeout(1200);

// Read CSS vars
const primary    = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim());
const background = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--background').trim());
const bodyBg     = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

// Find blue button — also dump first 6 button colors for debugging
const btnInfo = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const allColors = buttons.slice(0, 8).map(b => ({
    bg: getComputedStyle(b).backgroundColor,
    cls: b.className.slice(0, 60)
  }));
  for (const btn of buttons) {
    const bg = getComputedStyle(btn).backgroundColor;
    const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) {
      const [, r, g, b] = m.map(Number);
      if (b > 150 && b > r + 60 && b > g + 60) return { found: true, bg, allColors };
    }
  }
  return { found: false, allColors };
});

console.log('[STYLE-GUIDE /components/button — LIGHT]');
console.log('  --primary:', primary, ' (want: 221 83% 53%)');
console.log('  --background:', background, ' (want: 210 40% 98%)');
console.log('  body bg:', bodyBg, ' (want: rgb(248,250,252))');
console.log('  blue btn found:', btnInfo.found, btnInfo.found ? btnInfo.bg : '');
console.log('  first 8 button colors:');
btnInfo.allColors.forEach((b, i) => console.log(`    [${i}] ${b.bg}  cls: ${b.cls}`));
await page.screenshot({ path: `${OUT}/blue-verify-04-styleguide-light.png` });

// Dark mode toggle
await page.evaluate(() => {
  localStorage.setItem('sg-dark-mode', 'dark');
  document.documentElement.classList.add('dark');
});
await page.waitForTimeout(600);

const darkPrimary = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim());
const darkBg      = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const darkBtnInfo = await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  for (const btn of buttons) {
    const bg = getComputedStyle(btn).backgroundColor;
    const m = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) {
      const [, r, g, b] = m.map(Number);
      if (b > 150 && b > r + 60 && b > g + 60) return { found: true, bg };
    }
  }
  return { found: false };
});

console.log('\n[STYLE-GUIDE dark]');
console.log('  --primary:', darkPrimary, ' (want: 217 91% 60%)');
console.log('  body bg:', darkBg, ' (want dark navy ~rgb(15,23,42))');
console.log('  blue btn found:', darkBtnInfo.found, darkBtnInfo.found ? darkBtnInfo.bg : '');
await page.screenshot({ path: `${OUT}/blue-verify-05-styleguide-dark.png` });

await browser.close();

// Final checks
const primaryOK    = primary === '221 83% 53%';
const bgOK         = background === '210 40% 98%';
const bodyBgOK     = bodyBg.includes('248, 250, 252') || bodyBg.includes('248,250,252');
const darkPrimOK   = darkPrimary === '217 91% 60%';
const mDark        = darkBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
const darkNavyOK   = mDark && +mDark[1] < 30 && +mDark[2] < 40 && +mDark[3] < 60;

console.log('\n═══ STYLE-GUIDE RESULTS ═══');
console.log(primaryOK  ? '✅' : '❌', '--primary light correct');
console.log(bgOK       ? '✅' : '❌', '--background light correct');
console.log(bodyBgOK   ? '✅' : '❌', 'body bg = #F8FAFC');
console.log(btnInfo.found ? '✅' : '❌', 'blue button found (light)');
console.log(darkPrimOK ? '✅' : '❌', '--primary dark correct');
console.log(darkNavyOK ? '✅' : '❌', 'dark body = navy');
console.log(darkBtnInfo.found ? '✅' : '❌', 'blue button found (dark)');
console.log('\nScreenshots:', OUT);
