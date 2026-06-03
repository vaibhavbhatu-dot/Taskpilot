import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const CHROME  = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT     = resolve('scripts', 'shots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx     = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page    = await ctx.newPage();

await page.goto('http://localhost:5173/style-guide', { waitUntil: 'networkidle', timeout: 20_000 });

// Toggle dark mode
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  btns.find(b => /dark|light|moon|sun/i.test(b.textContent + b.getAttribute('aria-label')))?.click();
});
await page.waitForTimeout(500);

const sections = [
  { id: 'tokens',   file: 'dark-tokens.png'   },
  { id: 'buttons',  file: 'dark-buttons.png'  },
  { id: 'cards',    file: 'dark-cards.png'    },
  { id: 'feedback', file: 'dark-feedback.png' },
  { id: 'product',  file: 'dark-product.png'  },
];

for (const { id, file } of sections) {
  await page.evaluate(id => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, id);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${file}` });
  console.log(`captured ${file}`);
}

// Also get the page header with new title + badge
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/dark-header.png` });
console.log('captured dark-header.png');

await browser.close();
console.log('Done.');
