import { chromium } from 'playwright-core';
import { resolve } from 'path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = resolve('scripts', 'shots');

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', e => console.error('[pageerror]', e.message));

// Login as new user
await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
await page.fill('input[type="email"]', 'newuser@newcompany.com');
await page.fill('input[type="password"]', 'password123');
await page.click('button[type="submit"]');
await page.waitForURL('**/', { timeout: 10000 });
await page.waitForTimeout(800);

// Dismiss tour if active
const tourActive = await page.locator('text=Skip tour').isVisible().catch(() => false);
if (tourActive) { await page.locator('text=Skip tour').click(); await page.waitForTimeout(300); }

// ── 1. Tickets page ──────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/tickets', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/empty-01-tickets.png`, fullPage: true });
const ticketsEmpty = await page.locator('text=No tickets yet').isVisible().catch(() => false);
const ticketsCTA = await page.locator('text=+ Create ticket').isVisible().catch(() => false);
console.log('Tickets empty state:', ticketsEmpty ? '✓' : '✗', '| CTA:', ticketsCTA ? '✓' : '✗');

// ── 2. Board page ─────────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/board', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/empty-02-board.png`, fullPage: true });
const boardEmpty = await page.locator('text=Your board is empty').isVisible().catch(() => false);
const boardCTA = await page.locator('text=Go to Tickets').isVisible().catch(() => false);
console.log('Board empty state:', boardEmpty ? '✓' : '✗', '| CTA:', boardCTA ? '✓' : '✗');

// ── 3. Sprint Planning ────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/sprints/planning', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/empty-03-sprint-planning.png`, fullPage: true });
const planningEmpty = await page.locator('text=Backlog is empty').isVisible().catch(() => false);
const planningCTA = await page.locator('text=Create a ticket').isVisible().catch(() => false);
console.log('Sprint Planning empty state:', planningEmpty ? '✓' : '✗', '| CTA:', planningCTA ? '✓' : '✗');

// ── 4. Active Sprint ──────────────────────────────────────────────────────────
await page.goto('http://localhost:5173/sprints/active', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/empty-04-active-sprint.png`, fullPage: true });
const sprintEmpty = await page.locator('text=Sprint is empty').isVisible().catch(() => false);
const sprintCTA = await page.locator('text=Go to Sprint Planning').isVisible().catch(() => false);
console.log('Active Sprint empty state:', sprintEmpty ? '✓' : '✗', '| CTA:', sprintCTA ? '✓' : '✗');

await browser.close();
console.log('\nDone.');
