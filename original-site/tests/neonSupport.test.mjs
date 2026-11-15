import test from 'node:test';
import assert from 'node:assert/strict';
import {supportRpcArgs,adminSupportArgs,normalizeSupportTicket} from '../src/lib/neonSupport.js';

const ticket={name:'Test Usta',category:'platform_help',subject:'Teknik yardım',description:'Test açıklaması oldukça uzun bir örnek içeriktir.',
  consent_confirmed:true,callback_requested:false};
test('support RPC accepts verified-user form with consent',()=>{
 const x=supportRpcArgs(ticket);
 assert.equal(x.p_name,'Test Usta');
 assert.equal(x.p_category,'platform_help');
 assert.equal(x.p_consent_confirmed,true);
 assert.equal('contact_email' in x,false);
});
test('support RPC rejects missing consent, insufficient detail and bad category',()=>{
 assert.throws(()=>supportRpcArgs({...ticket,consent_confirmed:false}));
 assert.throws(()=>supportRpcArgs({...ticket,description:'kısa'}));
 assert.throws(()=>supportRpcArgs({...ticket,category:'administrator'}));
});
test('support callback requires phone',()=>{
 assert.throws(()=>supportRpcArgs({...ticket,callback_requested:true,phone:''}));
});
test('admin updates use explicit allowlists and keep untouched values',()=>{
 const old={id:'00000000-0000-0000-0000-000000000001',status:'new',priority:'normal',assigned_group:'platform',internal_note:''};
 const p=adminSupportArgs(old,{status:'triaging'});
 assert.equal(p.p_status,'triaging');assert.equal(p.p_priority,'normal');
 assert.throws(()=>adminSupportArgs(old,{status:'deleted'}));
});
test('support list normalizes created_date expected by original screen',()=>{
 assert.equal(normalizeSupportTicket({created_at:'2026-11-15T20:00:00Z'}).created_date,'2026-11-15T20:00:00Z');
});
