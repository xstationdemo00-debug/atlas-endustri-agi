import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../src/components/security/HumanVerification.jsx',import.meta.url),'utf8');
test('Atlas independent captcha config replaces missing Base44 function',()=>{
 assert.ok(src.includes('/api/captcha-config'));
 assert.ok(!src.includes('/functions/publicCaptchaConfig'));
 assert.ok(src.includes('doğrulanmış üyelik'));
 assert.ok(src.includes('config?.enabled'));
});
