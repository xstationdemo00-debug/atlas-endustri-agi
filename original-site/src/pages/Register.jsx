import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { neonAuth, authFailure } from '@/lib/neonAuthClient';
import { useAuth } from '@/lib/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [name,setName] = useState(''); const [email,setEmail] = useState('');
  const [password,setPassword] = useState(''); const [confirm,setConfirm] = useState('');
  const [otp,setOtp] = useState(''); const [step,setStep] = useState('signup');
  const [error,setError] = useState(''); const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  async function signup(e){e.preventDefault();setError('');setMessage('');
    if(password.length<12){setError('En az 12 karakterli bir parola belirleyin.');return;}
    if(password!==confirm){setError('Parolalar eşleşmiyor.');return;}
    setBusy(true);
    try{if(!neonAuth)throw new Error('Giriş servisi yapılandırılmamış.');
      authFailure(await neonAuth.signUp.email({name:name.trim(),email:email.trim(),password}), 'Kayıt gerçekleştirilemedi.');
      setStep('otp');setMessage('E-postanıza gönderilen doğrulama kodunu girin.');
    }catch(err){setError(err.message||'Kayıt başarısız.');}finally{setBusy(false);}
  }
  async function verify(e){e.preventDefault();setBusy(true);setError('');
    try{
      if(!neonAuth?.emailOtp?.verifyEmail)throw new Error('E-posta doğrulama özelliği etkin değil.');
      authFailure(await neonAuth.emailOtp.verifyEmail({email:email.trim(),otp:otp.trim()}),'Doğrulama kodu geçersiz.');
      await checkUserAuth(); navigate('/login',{replace:true});
      setMessage('Doğrulama başarılı. Giriş yapabilirsiniz.');
    }catch(err){setError(err.message||'Doğrulama başarısız.');}finally{setBusy(false);}
  }
  return <main className="max-w-md mx-auto mt-12 rounded-xl bg-white border shadow-lg p-7 text-slate-900">
    <h1 className="text-2xl font-extrabold">Atlas Endüstri Ağı</h1>
    <p className="text-slate-600 mt-1 mb-5 text-sm">Doğrulanmış e-posta ile üye kaydı</p>
    <p className="mb-4 rounded bg-amber-50 p-3 text-xs text-amber-900">Üyelik oluşturulması, eski Base44 veri ve yetkilerinin aktarılmış olduğu anlamına gelmez. Ücret alınmaz.</p>
    {step==='signup' ? <form className="space-y-3" onSubmit={signup}>
      <label className="block text-sm">Ad soyad<input type="text" required minLength={2} maxLength={120} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" className="block mt-1 w-full rounded border p-3"/></label>
      <label className="block text-sm">E-posta<input type="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" className="block mt-1 w-full rounded border p-3"/></label>
      <label className="block text-sm">Parola (en az 12 karakter)<input type="password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="block mt-1 w-full rounded border p-3"/></label>
      <label className="block text-sm">Parola tekrar<input type="password" minLength={12} required value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" className="block mt-1 w-full rounded border p-3"/></label>
      <button disabled={busy} className="w-full rounded bg-slate-900 text-white p-3 disabled:opacity-60">{busy?'İşleniyor…':'Kayıt ol'}</button>
    </form> : <form className="space-y-3" onSubmit={verify}>
      <label className="block text-sm">E-posta doğrulama kodu<input type="text" inputMode="numeric" autoComplete="one-time-code" required minLength={4} maxLength={12} value={otp} onChange={e=>setOtp(e.target.value)} className="block mt-1 w-full rounded border p-3"/></label>
      <button disabled={busy} className="w-full rounded bg-slate-900 p-3 text-white disabled:opacity-60">{busy?'Doğrulanıyor…':'E-postayı doğrula'}</button>
    </form>}
    {message&&<p role="status" className="mt-3 text-sm text-green-800">{message}</p>}
    {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <p className="mt-4 text-sm">Zaten üye misin? <Link className="underline font-semibold" to="/login">Giriş yap</Link></p>
  </main>;
}
