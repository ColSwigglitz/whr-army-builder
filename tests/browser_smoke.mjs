import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

try {
  const response = await page.goto('http://127.0.0.1:8080/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  assert.ok(response?.ok(), `Landing page returned HTTP ${response?.status()}`);

  await page.waitForSelector('#armySelectionScreen', { state: 'visible', timeout: 10000 });
  await page.waitForSelector('.development-banner', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll('#armyCards .army-card').length > 0, null, { timeout: 15000 });

  const title = await page.title();
  assert.match(title, /WHR Army Builder/i, 'Unexpected page title');

  const cardCount = await page.locator('#armyCards .army-card').count();
  assert.ok(cardCount > 0, 'No army books rendered on landing page');

  // Opening the first army is our most useful anonymous runtime smoke test: it
  // exercises bootstrap, army data loading, the builder render path and all of
  // the release/dev extension loaders without requiring a Supabase login.
  const firstCard = page.locator('#armyCards .army-card').first();
  await firstCard.click();
  await page.waitForSelector('#builderScreen', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#unitBrowser', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => {
    const browser = document.querySelector('#unitBrowser');
    return browser && !/loading army data/i.test(browser.textContent || '') && (browser.textContent || '').trim().length > 20;
  }, null, { timeout: 15000 });

  const faction = (await page.locator('#factionName').textContent())?.trim();
  assert.ok(faction && !/loading/i.test(faction), 'Faction did not finish loading');

  // Give asynchronously-loaded development layers a moment to initialise.
  await page.waitForTimeout(2000);
  assert.deepEqual(pageErrors, [], `Uncaught browser errors:\n${pageErrors.join('\n')}`);

  console.log(`PASS  Browser landing page rendered ${cardCount} army books`);
  console.log(`PASS  Opened army builder for ${faction}`);
  console.log('PASS  No uncaught browser JavaScript errors');
} finally {
  await browser.close();
}
