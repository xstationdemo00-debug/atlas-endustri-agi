import test from 'node:test';
import assert from 'node:assert/strict';
import {canMarkSingleNotification,canMarkAllNotifications} from '../src/lib/neonNotifications.js';
test('single notification update allows only mark-read',()=>{
  assert.equal(canMarkSingleNotification({is_read:true}),true);
  assert.equal(canMarkSingleNotification({is_read:false}),false);
  assert.equal(canMarkSingleNotification({is_read:true,owner_auth_user_id:'spoof'}),false);
  assert.equal(canMarkSingleNotification(null),false);
});
test('batch notification read operation rejects arbitrary criteria',()=>{
  assert.equal(canMarkAllNotifications({is_read:false},{$set:{is_read:true}}),true);
  assert.equal(canMarkAllNotifications({},{$set:{is_read:true}}),false);
  assert.equal(canMarkAllNotifications({is_read:false},{$set:{is_read:true,owner_auth_user_id:'spoof'}}),false);
});
