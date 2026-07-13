import { chromium } from 'playwright';

const shotDir = process.env.SHOT_DIR || '.';
let shotIdx = 0;
async function shot(page, name) {
  shotIdx++;
  const p = `${shotDir}/${String(shotIdx).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: p });
  console.log('SCREENSHOT', name, '->', p);
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', msg => console.log(`[console.${msg.type()}]`, msg.text()));
page.on('pageerror', err => console.log('[pageerror]', err.message));

await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' });
await page.locator('text=Alex Vance').first().click();
await page.waitForTimeout(400);
await page.goto('http://localhost:5183/#/catalog', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);

// Enumerate ALL buttons with their exact text and bounding boxes
const buttons = await page.locator('button').all();
console.log('Total <button> elements on /catalog:', buttons.length);
for (let i = 0; i < buttons.length; i++) {
  const text = (await buttons[i].textContent() || '').trim();
  if (/servers|agents|skills|prompts|all assets/i.test(text)) {
    const box = await buttons[i].boundingBox();
    console.log(`button[${i}] text="${text}" box=${JSON.stringify(box)}`);
  }
}

console.log('=== clicking exact-text "servers" tab button (case-sensitive, no other matches) ===');
const serversTab = page.locator('button', { hasText: /^servers$/ });
console.log('serversTab match count:', await serversTab.count());
await serversTab.first().click();
await page.waitForTimeout(400);
console.log('URL after click:', page.url());
await shot(page, 'servers-tab-click');

// Instrument: read which tab element currently has the "active" class-ish (text-primary)
const activeTabText = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button'));
  const active = btns.find(b => b.className.includes('text-primary') && b.className.includes('border-primary'));
  return active ? active.textContent : null;
});
console.log('Active tab (by class) after click:', activeTabText);

await browser.close();
