import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import HumanVerification from '@/components/security/HumanVerification';
import { ArrowRight, Bot, CheckCircle2, ClipboardList, Mail, MessageCircle, PhoneCall, ShieldAlert, Wrench, XCircle } from 'lucide-react';

const TYPES=[
 ['platform_help','Platform kullanımı ve teknik sorun','Üyelik, giriş, ekran veya işlem adımı'],
 ['project_process','Proje / taahhüt süreci','Fırsat, iş paketi, şartname, termin ve aşamalar'],
 ['supplier_matching','Üretici / tedarikçi eşleştirme','İmalat, malzeme, fason, lojistik ve işbirliği'],
 ['offer_contract','Teklif ve sözleşme süreci','Teknik teklif, kapsam, ön yeterlik, sözleşme adımları'],
 ['membership','Firma, usta ve ekip profili','Hesap, firma doğrulama, yetkinlik ve belge süreçleri'],
 ['international','Uluslararası işbirliği','Yurt dışı tedarik, uygunluk ve iş geliştirme'],
 ['billing','Ücretli pilot hizmet','Ön teklif, kapsam ve faturalama soruları'],
 ['worker_rights','Çalışan hakları ve sözleşme güvenliği','SGK, ücret, yevmiye, İSG ve işveren sorumlulukları'],
 ['other','Diğer soru','İlgili kategoriye daha sonra yönlendirilir']
];
const FAQ=[
 ['Çalışan hakları ve günlük yevmiye nasıl korunur?','Yevmiyeli veya maaşlı fark etmeksizin işin hukuki niteliğine uygun işveren, SGK, ücret ve ödeme günü, mesai, iş güvenliği ve yazılı sözleşme kontrolü gerekir. Atlas pilotta doğrudan işe aracılık yapmaz; çalışan hakları sayfasına bakınız.'],
 ['Firma veya proje nasıl eklenir?','Kurumsal hesaptan Firma ve Projeler alanları kullanılır. Projeler önce taslak açılır; yayımlanmadan önce yetki, teknik kapsam ve gerekli belgeler kontrol edilir.'],
 ['Uygun üretici ya da alt yüklenici nasıl bulunur?','Talep edilen imalat süreci, malzeme, bölge ve proje şartları belirlenir. Sistem benzer faaliyetleri puanlayabilir; ancak kapasite, kalite belgeleri ve ticari uygunluk ayrıca teyit edilir.'],
 ['Teklif veya hizmet ücreti nasıl belirlenir?','İş kapsamına göre yazılı teklif hazırlanır. Pilot araştırma hizmetinin başlangıç fiyatı 2.900 TL olarak ilan edilmiştir; kesin fiyat, vergi ve teslim koşulları ayrıca görüşülür.'],
 ['İşçi veya ekip temin ediliyor mu?','Pilot dönemde personel/ekip ihtiyacı ve mesleki gereklilik analizi yapılır. İşçi yerleştirme veya geçici işçi sağlama hizmeti, gerekli İŞKUR izinleri veya yetkili partner modeli olmadan sunulmaz.'],
 ['Telefonla hemen görüşebilir miyim?','Şu anda sürekli açık çağrı merkezi yok. Öncelikle Atlas Asistan ve destek kayıt sistemi kullanılır. Gerekli ticari görüşmelerde uygunluk durumuna göre geri arama planlanabilir; anında dönüş garantisi verilmez.'],
 ['Uluslararası proje desteği sunuluyor mu?','Uluslararası alanda kaynak ve işbirliği ön araştırması hedefleniyor. İhracat, gümrük, sözleşme ve yeterlik gereklilikleri ilgili uzmanlarca doğrulanmadan işlem veya sonuç garantisi verilmez.']
];
const DEFAULT={name:'',company_name:'',contact_email:'',phone:'',category:'platform_help',subject:'',description:'',callback_requested:false,consent_confirmed:false,website_extra:''};
const EMAIL='xstationdemo00@gmail.com';

export default function SupportHub(){
 const {user}=useAuth()||{};
 const [token,setToken]=useState('');
 const [captchaAttempt,setCaptchaAttempt]=useState(0);
 const [form,setForm]=useState(DEFAULT);
 const [busy,setBusy]=useState(false);
 const [result,setResult]=useState(null);
 const [error,setError]=useState('');
 const [expanded,setExpanded]=useState(-1);
 const set=(key,value)=>setForm(x=>({...x,[key]:value}));
 const send=async(e)=>{
  e.preventDefault();if(busy)return;
  setBusy(true);setError('');setResult(null);
  try{
   if(!user?.email)throw new Error('Destek göndermek için e-posta doğrulanmış hesabınıza giriş yapın.');
   const response=await base44.functions.invoke('submitSupportTicket',{
     ...form,contact_email:user.email,turnstile_token:token
   });
   const data=response?.data||{};
   if(data.ok!==true)throw new Error(data.error||'Destek kaydı oluşturulamadı.');
   setResult(data.ticket_code);
   setForm(DEFAULT);setToken('');setCaptchaAttempt(x=>x+1);
  }catch(err){setError(err?.response?.data?.error||err.message||'Destek talebi gönderilemedi.');}
  finally{setBusy(false);}
 };
 return <div className="min-h-screen bg-slate-50 text-slate-900">
  <header className="bg-slate-950 px-4 py-4 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-2"><div><p className="text-sm font-black tracking-wide">ATLAS ENDÜSTRİ AĞI</p><p className="text-xs text-slate-300">Destek ve süreç rehberi</p></div><Link to="/hizmetler" className="rounded-lg border border-white/40 px-3 py-2 text-xs font-semibold">Hizmetler</Link></div></header>
  <main>
   <section className="bg-slate-950 px-4 pb-11 pt-9 text-white"><div className="mx-auto max-w-6xl"><span className="text-xs font-bold uppercase tracking-wider text-amber-300">Atlas destek merkezi · Pilot</span><h1 className="mt-3 text-3xl font-black sm:text-4xl">Sorunuza doğru yerden başlayın.</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">Proje, tedarik, firma eşleştirme ve platform adımlarında önce rehber ve asistanımızı kullanın. Çözülemeyen konularda takip numaralı destek talebi bırakın. Her konuda anlık uzman veya telefon desteği sunduğumuzu iddia etmiyoruz.</p><div className="mt-5"><Link to="/nasil-calisir" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-extrabold text-slate-950">Önce sistemi tanı <ArrowRight size={15}/></Link></div></div></section>
   <section className="border-b border-slate-200 bg-amber-50 px-4 py-4"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm"><div><strong>WhatsApp Business API hazırlanıyor.</strong><p className="mt-1 text-xs text-slate-700">Resmî işletme numarası henüz bağlanmadı; şu anda Atlas Asistan ve takip numaralı destek formu aktiftir.</p></div><Link to="/calisan-haklari" className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-950">Çalışan güvencesi ilkeleri</Link></div></section>
   <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
    <div className="rounded-xl border border-slate-200 bg-white p-5"><Bot className="text-amber-600"/><h2 className="mt-3 font-bold">1. Atlas Asistan</h2><p className="mt-2 text-sm leading-6 text-slate-600">Sayfanın sağ altındaki Atlas Asistan'a sorabilirsiniz. Süreçleri açıklayıp ilgili sayfalara yönlendirir; kesin uzman görüşü yerine geçmez.</p></div>
    <div className="rounded-xl border border-slate-200 bg-white p-5"><ClipboardList className="text-amber-600"/><h2 className="mt-3 font-bold">2. Destek kaydı</h2><p className="mt-2 text-sm leading-6 text-slate-600">Çözülemeyen konuyu ve iletişim adresini iletin. Takip numaranızı saklayın; ihtiyaca göre e-posta üzerinden dönüş yapılır.</p><a href="#destek-formu" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700">Destek talebi aç <ArrowRight size={14}/></a></div>
    <div className="rounded-xl border border-slate-200 bg-white p-5"><PhoneCall className="text-amber-600"/><h2 className="mt-3 font-bold">3. Gerekirse geri arama</h2><p className="mt-2 text-sm leading-6 text-slate-600">Önemli proje ve ticari konularda geri arama isteği bırakabilirsiniz. Sürekli açık çağrı hattı yok; tarih veya cevap süresi garanti edilmez.</p></div>
   </section>
   <section className="mx-auto max-w-6xl px-4 pb-10"><h2 className="text-2xl font-black">Sık sorulan sorular</h2><div className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
    {FAQ.map(([q,a],i)=><div key={i}><button type="button" onClick={()=>setExpanded(expanded===i?-1:i)} aria-expanded={expanded===i} className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-bold">{q}<span className="text-xl text-amber-700">{expanded===i?'−':'+'}</span></button>{expanded===i&&<p className="px-4 pb-4 text-sm leading-7 text-slate-600">{a}</p>}</div>)}
   </div></section>
   <section className="border-y border-slate-200 bg-white px-4 py-12" id="destek-formu"><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-5">
    <div className="lg:col-span-2"><h2 className="text-2xl font-black">Destek talebi aç</h2><p className="mt-3 text-sm leading-7 text-slate-600">Konuya göre kayıt oluşturup değerlendirme kuyruğuna alacağız. Gerekirse yazılım, ticari süreç veya uzman iş ortağı kategorisine yönlendirilecek. Henüz sürekli çalışan ayrı destek ekibimiz bulunmuyor.</p><p className="mt-5 text-sm"><Mail size={16} className="mr-2 inline"/><a href={'mailto:'+EMAIL} className="font-semibold underline">{EMAIL}</a></p><p className="mt-5 flex gap-2 rounded-lg bg-amber-50 p-4 text-xs leading-6 text-amber-950"><ShieldAlert className="mt-1 shrink-0" size={16}/>Sözleşme, hukuki görüş, mühendislik onayı ve acil saha/iş güvenliği sorunlarında bu form tek başına yeterli değildir. İlgili yetkili kurum, işveren veya profesyonele doğrudan başvurun.</p></div>
    <div className="lg:col-span-3">
     {result&&<div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 font-bold text-emerald-900"><CheckCircle2 size={18}/>Destek talebiniz kaydedildi.</p><p className="mt-2 text-sm text-emerald-900">Takip numarası: <strong className="select-all">{result}</strong></p><p className="mt-1 text-xs text-emerald-900">Bu numarayı saklayın. Talebiniz değerlendirme kuyruğuna alındı. E-postayla dönüş yapılabilir; kesin cevap süresi taahhüt edilmez.</p></div>}
     {error&&<p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error} <a href={'mailto:'+EMAIL} className="underline">E-posta ile ulaş</a></p>}
     {user?.email ? (<form onSubmit={send} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
      <label className="text-sm font-semibold">İlgili kişi *<input required maxLength={100} value={form.name} onChange={e=>set('name',e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal" placeholder="Ad soyad"/></label>
      <label className="text-sm font-semibold">Firma / ekip<input maxLength={140} value={form.company_name} onChange={e=>set('company_name',e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal" placeholder="Varsa firma adı"/></label>
      <label className="text-sm font-semibold">Doğrulanmış e-posta *<input type="email" required readOnly value={user.email} className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-100 p-3 text-sm font-normal"/></label>
      <label className="text-sm font-semibold">Telefon (isteğe bağlı)<input type="tel" maxLength={35} value={form.phone} onChange={e=>set('phone',e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal" placeholder="Geri arama için gerekli"/></label>
      <label className="text-sm font-semibold sm:col-span-2">Destek kategorisi *<select required value={form.category} onChange={e=>set('category',e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal">{TYPES.map(([key,title])=><option key={key} value={key}>{title}</option>)}</select></label>
      <label className="text-sm font-semibold sm:col-span-2">Konu başlığı *<input required minLength={5} maxLength={140} value={form.subject} onChange={e=>set('subject',e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal" placeholder="Örn. Teknik şartname yüklemesi hakkında"/></label>
      <label className="text-sm font-semibold sm:col-span-2">Sorunuz veya yaşadığınız sorun *<textarea rows={5} required minLength={25} maxLength={2500} value={form.description} onChange={e=>set('description',e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3 text-sm font-normal" placeholder="Ne yapmak istiyorsunuz? Hangi aşamada sorun oluştu?"/></label>
      <label className="flex items-start gap-2 text-xs leading-6 sm:col-span-2"><input type="checkbox" className="mt-1" checked={form.callback_requested} onChange={e=>set('callback_requested',e.target.checked)}/><span>Gerekli görülürse telefonla geri aranmak istiyorum. Bu seçenek anlık görüşme veya kesin geri dönüş taahhüdü değildir.</span></label>
      <label className="flex items-start gap-2 text-xs leading-6 sm:col-span-2"><input type="checkbox" className="mt-1" required checked={form.consent_confirmed} onChange={e=>set('consent_confirmed',e.target.checked)}/><span><Link to="/gizlilik" className="font-bold underline">Kişisel veri bilgilendirmesini</Link> okudum. İletişim bilgilerimin bu destek başvurusunu değerlendirmek amacıyla kullanılmasını kabul ediyorum. Bu pazarlama izni değildir.</span></label>
      <label className="absolute left-[-10000px]" aria-hidden="true">Web sitesi<input type="text" autoComplete="off" tabIndex={-1} value={form.website_extra} onChange={e=>set('website_extra',e.target.value)}/></label>
      <div className="sm:col-span-2"><HumanVerification key={captchaAttempt} action="support_ticket" onToken={setToken}/></div>
      <button disabled={busy} type="submit" className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-extrabold text-white disabled:opacity-50 sm:col-span-2">{busy?'Kaydediliyor...':'Destek talebi oluştur'}</button>
      <p className="text-xs leading-5 text-slate-500 sm:col-span-2">Bu formda kimlik, sağlık raporu, banka kartı, şifre veya gizli teknik çizim paylaşmayın. Sistem bir çağrı merkezi değildir.</p>
     </form>) : (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
       <p className="font-bold">Destek talebi için doğrulanmış hesap gerekiyor.</p>
       <p className="mt-2 leading-6">E-posta koduyla hesabını doğrula ve giriş yap. Bu önlem sahte başvuruların ve başkalarının e-postasıyla işlem yapılmasının önüne geçmek için eklendi.</p>
       <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/login?returnTo=%2Fdestek" className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-bold text-white">Giriş yap</Link>
        <Link to="/register?returnTo=%2Fdestek" className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-bold">E-posta ile kayıt ol</Link>
       </div>
      </div>
     )}
    </div>
   </div></section>
  </main>
  <footer className="bg-slate-950 px-4 py-7 text-center text-xs text-slate-300">Atlas Endüstri Ağı · Pilot Destek Merkezi · <Link className="underline" to="/hizmetler">Hizmetler</Link></footer>
 </div>;
}
