import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('Atlas original service entry reuses original business service components',()=>{
  const s=read('../src/pages/CommercialServices.jsx');
  assert.ok(s.includes('FirstPaidService'));
  assert.ok(s.includes("path:'/cozumler'"));
  assert.ok(s.includes("path:'/ihaleler'"));
  assert.ok(!s.includes('Orijinal Base44 hizmetler sayfasının büyük kaynak dosyası arşivde bulunamadı.'));
});
test('Atlas service intake sends to independent DB only with consent and confirms saved record',()=>{
  const s=read('../src/components/commercial/PublicEmailInquiry.jsx');
  assert.ok(s.includes('ATLAS_INTAKE'));
  assert.ok(s.includes('consent:true'));
  assert.ok(s.includes('result.reference')||s.includes('data.reference'));
  assert.ok(s.includes('res.ok'));
  assert.ok(s.includes('setError('));
  assert.ok(s.includes('onClick={submit}'));
  assert.ok(s.includes('disabled={!ready||!consent||busy}'));
});
