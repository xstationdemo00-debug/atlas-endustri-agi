import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeById,normalizePublicWorkRequest,normalizeIncomingOffer,offerRpcArgs } from '../src/lib/neonWorkflows.js';
test('published job only exposes safe, explicitly mapped fields',()=>{
  const out=normalizePublicWorkRequest({id:'1',project_title:'A',trade:'Kaynakçı',headcount:3,certificates_required:['ISO 9606'],
    owner_email:'do-not-leak@invalid.test',phone:'secret',owner_auth_user_id:'private',payload:{secret:'private'}});
  assert.equal(out.id,'1');assert.equal(out.headcount,3);
  assert.equal(out.owner_email,undefined);assert.equal(out.phone,undefined);
  assert.equal(out.owner_auth_user_id,undefined);assert.equal(out.payload,undefined);
  assert.equal(out.publication_status,'approved');
});
test('own records take precedence over public duplicate',()=>{
 const values=mergeById([{id:'a',source:'private'}],[{id:'a',source:'public'},{id:'b'}]);
 assert.deepEqual(values,[{id:'a',source:'private'},{id:'b'}]);
});
test('incoming offer retains verified owner routing field',()=>{
 const row=normalizeIncomingOffer({id:'o1',payload:{status:'submitted',amount:2300},
   owner_auth_user_id:'applicant-1',request_owner_auth_user_id:'owner-2'});
 assert.equal(row.status,'submitted');
 assert.equal(row.created_by_id,'applicant-1');
 assert.equal(row.request_owner_auth_user_id,'owner-2');
});
test('offer RPC only forwards controlled fields and approved company id',()=>{
 const out=offerRpcArgs({work_request_id:'11111111-1111-1111-1111-111111111111',amount:'2900',
  applicant_name:'Örnek Usta',applicant_type:'individual',
  applicant_email:'forged@example.com',owner_email:'forged@example.com',notes:'Kaynak işi'});
 assert.equal(out.p_amount,2900);assert.equal(out.p_applicant_type,'individual');
 assert.equal(out.p_company_id,null);
 assert.equal(out.applicant_email,undefined);assert.equal(out.owner_email,undefined);
 assert.throws(()=>offerRpcArgs({...out,applicant_type:'company',work_request_id:'id',applicant_name:'X'}));
});
