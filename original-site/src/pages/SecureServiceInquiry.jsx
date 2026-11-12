import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import HumanVerification from '@/components/security/HumanVerification';
import { Building2, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react';

const SERVICES=[
  ['supplier_research','Üretici / tedarikçi araştırması'],
  ['subcontractor_research','Alt yüklenici araştırması'],
  ['procurement_scope','İhale ve teknik kapsam analizi'],
  ['turkey_partnership','Türkiye sanayi işbirliği'],
  ['crossborder_partnership','Uluslararası işbirliği ön araştırması'],
  ['project_lifecycle','Proje süreç ve verimlilik pilotu'],
  ['team_need_analysis','Ekip ve uzmanlık ihtiyacı analizi'],
];
const EMPTY={company_name:'',contact_name:'',phone:'',city:'',description:'',
  service_type:'supplier_research',consent:false,website_extra:''};
export default function SecureServiceInquiry(){
 const {user}=useAuth()||{};
 const [form,setForm]=useState(EMPTY);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [token,setToken]=useState('');
 const [attempt,setAttempt]=useState(0);
 const set=(key,value)=>setForm(p=>({...p,[key]:value}));
 const submit=async(e)=>{
  e.preventDefault();if(busy||!user?.email)return;
  setBusy(true);setError('');setSuccess('');
  try{
   const response=await base44.functions.invoke('submitServiceInquiry',{
     ...form,contact_email:user.email,turnstile_token:token
   });
   if(response?.data?.ok!==true)throw new Error(response?.data?.error||'Talep gönderilemedi.');
   setSuccess('Talep alındı. İnceleme için yönetim merkezine iletildi.');
   setForm(EMPTY);setToken('');setAttempt(n=>n+1);
  }catch(err){
   setError(err?.response?.data?.error||err?.message||'Talep gönderilemedi.');
  }finally{setBusy(false);}
 };
 return <main className="mx-auto max-w-3xl space-y-5 px-4 py-9">
  <Link to="/hizmetler" className="text-xs font-semibold text-amber-700 underline">Kurumsal hizmetlere dön</Link>
  <header>
   <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700"><ShieldCheck size={15}/> Atlas güvenli iletişim</p>
   <h1 className="mt-2 text-2xl font-black">Doğrulanmış hesapla hizmet talebi</h1>
   <p className="mt-2 text-sm leading-6 text-muted-foreground">
    Atlas hizmet taleplerini hesabınızın doğrulanmış e-posta adresiyle ilişkilendirir.
    Bu ekran ücretsizdir. Bütçe, iş veya firma ortaklığı garantisi oluşturmaz.
   </p>
  </header>
  <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-6 text-sky-950">
   <LockKeyhole size={16} className="mr-2 inline"/> Başvuru e-postası: <strong>{user?.email||'Giriş yapılıyor…'}</strong>
   <p>Hesap doğrulaması, sunucu hız sınırı ve etkinse CAPTCHA ile korunur. T.C. kimlik, banka kartı, sağlık veya şifre bilgisi göndermeyin.</p>
  </div>
  {success&&<div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950"><CheckCircle2 size={17}/>{success}</div>}
  {error&&<p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</p>}
  <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
   <label className="text-xs font-bold">Firma adı *
    <input required minLength={2} maxLength={120} value={form.company_name}
     onChange={e=>set('company_name',e.target.value)}
     className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
   </label>
   <label className="text-xs font-bold">Yetkili kişi *
    <input required minLength={2} maxLength={120} value={form.contact_name}
     onChange={e=>set('contact_name',e.target.value)}
     className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
   </label>
   <label className="text-xs font-bold">Şehir
    <input maxLength={80} value={form.city} onChange={e=>set('city',e.target.value)}
     className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
   </label>
   <label className="text-xs font-bold">Telefon (isteğe bağlı)
    <input type="tel" maxLength={40} value={form.phone} onChange={e=>set('phone',e.target.value)}
     className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
   </label>
   <label className="text-xs font-bold sm:col-span-2">Talep türü *
    <select value={form.service_type} required onChange={e=>set('service_type',e.target.value)}
     className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal">
      {SERVICES.map(([key,label])=><option key={key} value={key}>{label}</option>)}
    </select>
   </label>
   <label className="text-xs font-bold sm:col-span-2">İşin kapsamı ve beklentiniz *
    <textarea required minLength={25} rows={6} maxLength={3500} value={form.description}
     onChange={e=>set('description',e.target.value)}
     placeholder="İşin niteliği, gerekli teknik uzmanlık, hedef tarih, şantiye veya atölye koşulları..."
     className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
   </label>
   <label className="flex items-start gap-2 text-xs sm:col-span-2">
    <input type="checkbox" checked={form.consent} required onChange={e=>set('consent',e.target.checked)} className="mt-0.5"/>
    <span><Link to="/gizlilik" className="font-bold underline">Kişisel veri bilgilendirmesini</Link> okudum; bilgilerimin bu hizmet talebinin değerlendirilmesi amacıyla kullanılmasını kabul ediyorum.</span>
   </label>
   <label className="absolute left-[-9999px]" aria-hidden="true">Web sitesi
    <input value={form.website_extra} autoComplete="off" tabIndex={-1} onChange={e=>set('website_extra',e.target.value)}/>
   </label>
   <div className="sm:col-span-2"><HumanVerification key={attempt} action="service_inquiry" onToken={setToken}/></div>
   <button disabled={busy||!user?.email} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">
    {busy?'Kimlik ve talep doğrulanıyor…':'Güvenli talebi gönder'}
   </button>
   <p className="text-xs text-muted-foreground sm:col-span-2"><Building2 size={13} className="mr-1 inline"/> Gönderim bir satın alma, ekip yönlendirme veya fiyat garantisi oluşturmaz.</p>
  </form>
 </main>;
}
