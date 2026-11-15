import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
for (const name of ["NewProjectDialog","WorkRequestDialog","CompanyDialog","WorkerProfileDialog"]) {
  test(name+' shows failed writes without closing its form', () => {
    const src=readFileSync(new URL('../src/components/'+name+'.jsx',import.meta.url),'utf8');
    assert.match(src,/const \[error, setError\] = useState\(''\)/);
    assert.match(src,/setError\(''\);\s*setSaving\(true\)/);
    assert.match(src,/catch \(err\) \{\s*setError\(/);
    assert.match(src,/role="alert"/);
    assert.match(src,/finally \{\s*setSaving\(false\)/);
  });
}
