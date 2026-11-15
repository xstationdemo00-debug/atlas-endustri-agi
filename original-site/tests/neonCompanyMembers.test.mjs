import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMembershipRows, memberCompany, canManageCompany } from '../src/lib/neonCompanyMembers.js';

test('owner is distinguished from membership-only access', () => {
  assert.equal(canManageCompany({id:'x',created_by_id:'u1'}, {id:'u1'}), true);
  assert.equal(canManageCompany({id:'x',created_by_id:'u1',is_member_view:true}, {id:'u1'}), false);
  assert.equal(canManageCompany({id:'x',created_by_id:'u1'}, {id:'u2'}), false);
});
test('invited members are never implicitly activated', () => {
  const rows=[{status:'invited',role:'member',company:{id:'a',name:'Firma A'}},
    {status:'active',role:'member',company:{id:'b',name:'Firma B',created_by_id:'owner'}}];
  assert.equal(memberCompany([rows[0]]),null);
  assert.deepEqual(memberCompany(rows),{id:'b',name:'Firma B',created_by_id:'owner',is_member_view:true,company_member_role:'member'});
  assert.equal(canManageCompany(memberCompany(rows),{id:'user'}),false);
  assert.deepEqual(normalizeMembershipRows({data:rows}),rows);
  assert.deepEqual(normalizeMembershipRows(null),[]);
});
