import test from 'node:test';
import assert from 'node:assert/strict';
import { createAuthClient } from '@neondatabase/auth';

test('pinned Neon Auth client exposes a real session and JWT retrieval method', () => {
  const client=createAuthClient('https://example.invalid/neondb/auth');
  const methods={
    signInEmail: typeof client.signIn?.email,
    signUpEmail: typeof client.signUp?.email,
    getSession: typeof client.getSession,
    getJWTToken: typeof client.getJWTToken,
    token: typeof client.token,
  };
  console.log('NEON_PINNED_SDK_SURFACE',JSON.stringify(methods));
  assert.equal(methods.getSession,'function');
  assert.equal(methods.signInEmail,'function');
  assert.ok(methods.getJWTToken==='function' || methods.token==='function','No browser JWT retrieval method exposed');
});
