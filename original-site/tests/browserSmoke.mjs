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
  for (const route of ['/firmalar','/bildirimler','/projeler']) {
    await page.goto(base + '/#' + route,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(() => window.location.hash.startsWith('#/login'),{timeout:25000});
    const body=await page.locator('#root').innerText();
    assert.ok(body.includes('Atlas Endüstri Ağı'),'Unauthenticated route did not show sign-in');
    console.log('ATLAS_PRIVATE_ROUTE_REQUIRES_LOGIN',route);
  }
  await checkRoute('/hizmetler', 'services', 'Sanayi projeleri');
  const formButton=page.getByRole('button',{name:"Ön talebi Atlas'a kaydet"});
  await formButton.waitFor({timeout:20000});
  assert.equal(await formButton.isDisabled(),true,'No silent submission without consent');
  console.log('ATLAS_PUBLIC_SERVICE_FORM_VISIBLE_AND_CONSENT_GATED');
  await page.locator('input[type=checkbox]').last().check();
  assert.equal(await formButton.isDisabled(),true,'No submission with empty required fields');
  console.log('ATLAS_PUBLIC_SERVICE_VALIDATION_GATED');
  await checkRoute('/ihaleler', 'tenders', 'İhale ve proje fırsatları');
  await page.waitForFunction(
    () => { const text=document.querySelector('#root')?.innerText || ''; return text.includes('GASKİ') || text.includes('Fırsat listesine şu anda erişilemiyor.'); },
    { timeout: 35000 }
  );
  const tenderText = await page.locator('#root').innerText();
  assert.ok(tenderText.includes('GASKİ'), 'Tender content not loaded: '+tenderText.slice(-500));
  console.log('ATLAS_BROWSER_TENDER_DATA_VISIBLE');
  // Android viewport: prove the original public interface is usable without a desktop.
  await page.setViewportSize({ width: 393, height: 852 });
  await checkRoute('/register', 'android-register', 'Atlas Endüstri Ağı');
  await page.getByRole('button', { name: 'Kayıt ol' }).waitFor({ timeout: 15000 });
  console.log('ATLAS_ANDROID_REGISTER_VISIBLE');
  await checkRoute('/login', 'android-login', 'Atlas Endüstri Ağı');
  await page.getByRole('button', { name: 'Giriş yap' }).waitFor({ timeout: 15000 });
  console.log('ATLAS_ANDROID_LOGIN_VISIBLE');
  await checkRoute('/hizmetler', 'android-services', 'Sanayi projeleri');
  await page.getByRole('button', { name: "Ön talebi Atlas'a kaydet" }).waitFor({ timeout: 15000 });
  console.log('ATLAS_ANDROID_SERVICES_VISIBLE');
  await checkRoute('/ihaleler', 'android-tenders', 'İhale ve proje fırsatları');
  console.log('ATLAS_ANDROID_TENDERS_VISIBLE');

} finally {
  try { await page.screenshot({ path: '/tmp/atlas-original-browser-qa.png', fullPage: false }); } catch {}
  await browser.close();
}
