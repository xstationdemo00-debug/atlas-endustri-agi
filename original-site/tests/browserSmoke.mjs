import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = 'https://atlas-endustri-orijinal-arayuz.onrender.com';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message.slice(0, 240)));

async function checkRoute(hash, label, expectedText) {
  await page.goto(base + '/#' + hash, { waitUntil: 'domcontentloaded', timeout: 60000 });
  try {
    await page.waitForFunction(() => {
      const root = document.querySelector('#root');
      return root && root.textContent && root.textContent.trim().length > 40;
    }, { timeout: 45000 });
  } catch(e) {
    console.error('BLANK_REACT_ROOT', label, 'errors:', pageErrors.slice(-10));
    throw e;
  }
  const text = await page.locator('#root').innerText();
  console.log('ATLAS_BROWSER_ROOT_RENDERED', label, 'characters', text.length);
  assert.ok(text.includes(expectedText), 'Expected '+expectedText+' in '+label+'; got: '+text.slice(0, 650));
  if (pageErrors.length) {
    console.error('REACT_PAGE_ERRORS', pageErrors.slice(-10));
    throw new Error('JavaScript runtime errors found in '+label);
  }
}
try {
  await checkRoute('/login', 'login', 'Atlas Endüstri Ağı');
  await checkRoute('/ihaleler', 'tenders', 'İhale ve proje fırsatları');
  await page.waitForFunction(
    () => { const text=document.querySelector('#root')?.innerText || ''; return text.includes('GASKİ') || text.includes('Fırsat listesine şu anda erişilemiyor.'); },
    { timeout: 35000 }
  );
  const tenderText = await page.locator('#root').innerText();
  assert.ok(tenderText.includes('GASKİ'), 'Tender content not loaded: '+tenderText.slice(-500));
  console.log('ATLAS_BROWSER_TENDER_DATA_VISIBLE');
} finally {
  try { await page.screenshot({ path: '/tmp/atlas-original-browser-qa.png', fullPage: false }); } catch {}
  await browser.close();
}
