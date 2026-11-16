import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchJsonWithWarmup } from '../src/lib/fetchWithWarmup.js';
test('free Render cold-start: retries safe GET then succeeds', async () => {
  const statuses=[503,503,200],waits=[],warnings=[];
  const result=await fetchJsonWithWarmup('/api/health',{},{
    fetchImpl:async()=>{const status=statuses.shift();return {ok:status===200,status,json:async()=>({database:'ready'})}},
    sleep:async(ms)=>waits.push(ms),onRetry:i=>warnings.push(i)
  });
  assert.equal(result.database,'ready');
  assert.deepEqual(waits,[4000,8000]);
  assert.deepEqual(warnings,[1,2]);
});
test('validation failure is not retried',async()=>{
 let calls=0;
 await assert.rejects(fetchJsonWithWarmup('/api/health',{},{
  fetchImpl:async()=>{calls++;return {ok:false,status:400}},
  sleep:async()=>{}
 }),/400/);
 assert.equal(calls,1);
});
test('POST never retried, even if server is down',async()=>{
 await assert.rejects(fetchJsonWithWarmup('/api/inquiries',{method:'POST'},{fetchImpl:async()=>{throw new Error('should not call')}}),/yalnızca GET/);
});
test('unavailable cold start stops after bounded attempts',async()=>{
 let calls=0;
 await assert.rejects(fetchJsonWithWarmup('/api/health',{},{
  attempts:3,fetchImpl:async()=>{calls++;return {ok:false,status:503}},sleep:async()=>{}
 }),/503/);
 assert.equal(calls,3);
});
