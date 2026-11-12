import { createAuthClient } from '@neondatabase/auth';

// Public endpoint only: no DATABASE_URL, no secret or admin key in browser code.
const baseUrl = import.meta.env.VITE_NEON_AUTH_URL;
export const neonAuth = baseUrl ? createAuthClient(baseUrl) : null;

export function authFailure(result, fallback = 'Kimlik doğrulama başarısız.') {
  if (result?.error) {
    const code = result.error.code || '';
    const message = result.error.message || '';
    throw new Error(message || code || fallback);
  }
  return result?.data ?? result;
}
