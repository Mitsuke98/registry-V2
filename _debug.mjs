import { chromium } from 'playwright';

const shotDir = process.env.SHOT_DIR || '.';
let shotIdx = 0;
async function shot(page, name) {
  shotIdx++;
  const p = `${shotDir}/${String(shotIdx).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: p, fullPage: false });
  console.log('SCREENSHOT', name, '->', p);
}

const browser = await chromium.launch();
const page = await browser.newPage();

page.on('console', msg => console.log(`[console.${msg.type()}]`, msg.text()));
page.on('pageerror', err => console.log('[pageerror]', err.message));
page.on('requestfailed', req => console.log('[requestfailed]', req.url(), req.failure()?.errorText));

console.log('=== NAV: landing ===');
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' });
await page.getByText('Alex Vancealex@vance.comEnd User', { exact: false }).click().catch(async () => {
  await page.locator('text=Alex Vance').first().click();
});
await page.waitForTimeout(500);
console.log('URL after login click:', page.url());
await shot(page, 'after-login');

console.log('=== NAV: /catalog ===');
await page.goto('http://localhost:5183/#/catalog', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
console.log('URL:', page.url());
await shot(page, 'catalog-all');

// --- STEP: click Servers facet ---
console.log('=== CLICK: Servers facet ===');
await page.getByRole('button', { name: /^servers$/i }).click();
await page.waitForTimeout(300);
console.log('URL after Servers facet click:', page.url());
await shot(page, 'catalog-servers');

// Grab first card text to identify it later
const firstCardName = await page.locator('.grid h3').first().textContent().catch(() => null);
console.log('First card name on Servers facet:', firstCardName);

console.log('=== CLICK: first server card ===');
await page.locator('.grid h3').first().click();
await page.waitForTimeout(500);
console.log('URL after clicking card:', page.url());
await shot(page, 'detail-page');

console.log('=== BACK ===');
await page.goBack();
await page.waitForTimeout(500);
console.log('URL after Back:', page.url());
await shot(page, 'after-back-servers');

// Repeat back-test from Agents facet
console.log('=== CLICK: Agents facet ===');
await page.goto('http://localhost:5183/#/catalog', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^agents$/i }).click();
await page.waitForTimeout(300);
console.log('URL after Agents facet click:', page.url());
await page.locator('.grid h3').first().click();
await page.waitForTimeout(500);
console.log('URL after clicking agent card:', page.url());
await page.goBack();
await page.waitForTimeout(500);
console.log('URL after Back from agent detail:', page.url());
await shot(page, 'after-back-agents');

// Repeat back-test from Skills facet
console.log('=== CLICK: Skills facet ===');
await page.goto('http://localhost:5183/#/catalog', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^skills$/i }).click();
await page.waitForTimeout(300);
console.log('URL after Skills facet click:', page.url());
await page.locator('.grid h3').first().click();
await page.waitForTimeout(500);
console.log('URL after clicking skill card:', page.url());
await page.goBack();
await page.waitForTimeout(500);
console.log('URL after Back from skill detail:', page.url());
await shot(page, 'after-back-skills');

// --- Capabilities toggle test ---
console.log('=== NAV: /catalog fresh for Capabilities toggle test ===');
await page.goto('http://localhost:5183/#/catalog', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

console.log('=== TOGGLE: Assets <-> Capabilities x5 rapid ===');
for (let i = 0; i < 5; i++) {
  await page.getByRole('button', { name: /^capabilities$/i }).click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: /^assets$/i }).click();
  await page.waitForTimeout(150);
}
console.log('Rapid toggle done, URL:', page.url());
await shot(page, 'after-rapid-toggle');

console.log('=== CLICK: Capabilities (settle) ===');
await page.getByRole('button', { name: /^capabilities$/i }).click();
await page.waitForTimeout(500);
console.log('URL after Capabilities click:', page.url());
await shot(page, 'capabilities-tools');

const toolsRowCount = await page.locator('table tbody tr').count();
console.log('Rows in Tools table:', toolsRowCount);
const toolsBodyText = await page.locator('table tbody').first().textContent().catch(() => '(no table found)');
console.log('Tools tbody text snippet:', (toolsBodyText || '').slice(0, 300));

console.log('=== CLICK: Resources tab ===');
await page.getByRole('button', { name: /^resources$/i }).click();
await page.waitForTimeout(400);
await shot(page, 'capabilities-resources');
const resRowCount = await page.locator('table tbody tr').count();
console.log('Rows in Resources table:', resRowCount);

console.log('=== CLICK: Prompts tab ===');
await page.getByRole('button', { name: /^prompts$/i }).click();
await page.waitForTimeout(400);
await shot(page, 'capabilities-prompts');
const promptRowCount = await page.locator('table tbody tr').count();
console.log('Rows in Prompts table:', promptRowCount);

// Click into a tool capability row and test back
console.log('=== CLICK: Tools tab then first tool row ===');
await page.getByRole('button', { name: /^tools$/i }).click();
await page.waitForTimeout(400);
const toolLink = page.locator('table tbody tr a').first();
const toolLinkText = await toolLink.textContent().catch(() => null);
console.log('First tool link text:', toolLinkText);
await toolLink.click();
await page.waitForTimeout(500);
console.log('URL after clicking tool capability row:', page.url());
await shot(page, 'capability-tool-detail');
await page.goBack();
await page.waitForTimeout(500);
console.log('URL after Back from tool capability detail:', page.url());
await shot(page, 'after-back-from-tool-capability');

await browser.close();
console.log('=== DONE ===');
