import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { neonAuth, authFailure } from '@/lib/neonAuthClient';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function onSubmit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (!neonAuth) throw new Error('Giriş servisi henüz yapılandırılmamış.');
      authFailure(await neonAuth.signIn.email({ email:email.trim(), password }), 'E-posta veya parola hatalı.');
      const member = await checkUserAuth();
      if (!member) throw new Error('Oturum doğrulanamadı. E-posta doğrulamasını kontrol edin.');
      navigate('/', {replace: true});
    } catch (e) {setError(e.message || 'Giriş başarısız.');}
    finally {setBusy(false);}
  }
  return <main className="max-w-md mx-auto mt-12 rounded-xl bg-white shadow-lg border p-7 text-slate-900">
    <h1 className="text-2xl font-extrabold">Atlas Endüstri Ağı</h1>
    <p className="mt-1 mb-6 text-sm text-slate-600">Neon Auth ile güvenli üye girişi</p>
    <p className="mb-5 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Bu geçiş sürümünde giriş gerçek oturum açar; eski Base44 kayıtlarının tüm işlevleri henüz bağlı değildir.</p>
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-semibold">E-posta <input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} className="block mt-1 w-full rounded-md border border-slate-300 p-3"/></label>
      <label className="block text-sm font-semibold">Parola <input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="block mt-1 w-full rounded-md border border-slate-300 p-3"/></label>
      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button disabled={busy} className="w-full rounded-md bg-slate-900 px-4 py-3 text-white font-semibold disabled:opacity-60">{busy?'Giriş kontrol ediliyor…':'Giriş yap'}</button>
    </form>
    <p className="mt-4 text-sm">Hesabın yok mu? <Link className="underline font-semibold" to="/register">Üye ol</Link></p>
  </main>;
}
