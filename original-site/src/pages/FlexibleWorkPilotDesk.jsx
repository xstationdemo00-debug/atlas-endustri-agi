import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ClipboardCheck, FileCheck2, MonitorSmartphone, Save, ShieldAlert, Wallet } from 'lucide-react';

const CATEGORIES=[
  ['digital_catalog','Ürün / firma kataloğu'],
  ['document_formatting','Doküman düzenleme'],
  ['supplier_research','Tedarikçi ön araştırma'],
  ['technical_drawing','Teknik çizim'],
  ['translation','Çeviri ve yerelleştirme'],
  ['remote_assistance','Uzaktan işletme desteği'],
  ['craft_production','El emeği / evden üretim'],
  ['other','Diğer teslim odaklı hizmet'],
];
const MODES=[['mobile','Telefon'],['computer','Bilgisayar'],['either','Telefon veya bilgisayar'],['on_site','Sahada / yerel']];
const MODELS=[['undetermined','Hukuki model belirlenmedi'],['independent_service','Bağımsız hizmet / ticari teslim'],['employment_partner','Yetkili istihdam ortağı / iş sözleşmesi']];
const REVIEW=[
 ['approved_payer','Talep sahibi ve ödeme yükümlüsü doğrulandı'],
 ['work_scope_verified','Ücret, işin kapsamı ve kabul ölçütleri açık ve anlaşılır'],
 ['budget_verified','Gerçek iş bütçesi ve ödeme tutarı doğrulandı'],
 ['payment_route_verified','Güvenli ödeme, vergi ve faturalama düzeni incelendi'],
 ['contractual_model_reviewed','İlgili çalışma ve aracılık mevzuatı, sözleşme modeli incelendi'],
 ['privacy_reviewed','KVKK aydınlatması ve veri işleme yöntemi uygun'],
 ['complaint_route_defined','Ödeme itirazı ve insan destek süreci tanımlandı'],
];
const EMPTY={
 title:'',category:'digital_catalog',delivery_mode:'either',legal_model:'undetermined',
 requesting_company:'',scope:'',output_definition:'',acceptance_criteria:'',required_skills:'',
 estimated_hours:'',offered_gross_budget:'',tasks_quantity:1,deadline_note:'',
 approved_payer:false,work_scope_verified:false,budget_verified:false,
 payment_route_verified:false,contractual_model_reviewed:false,privacy_reviewed:false,
 complaint_route_defined:false,review_note:'',status:'draft',is_demo:false,public_visible:false,
 currency:'TRY',created_from:'admin',
};
const EXAMPLE={
 ...EMPTY,title:'ÖRNEK — 20 ürünün katalog açıklamasının düzenlenmesi',
 category:'digital_catalog',delivery_mode:'either',requesting_company:'ÖRNEK FİRMA (gerçek müşteri değil)',
 scope:'20 ürün açıklamasını kaynak metne uygun biçimde güncelleme; gizli müşteri verisi yok.',
 output_definition:'Teslim: 20 ürün için doğrulanabilir açıklama tablosu',
 acceptance_criteria:'Tüm alanlar dolu, yazım kontrolü tamam, kaynak dışı bilgi yok',
 required_skills:'Temel bilgisayar veya telefon kullanımı, Türkçe yazım',
 estimated_hours:5,offered_gross_budget:1000,tasks_quantity:1,
 deadline_note:'Örnek: kapsam onayı sonrası 3 gün',is_demo:true,
};
const format=(v)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(v)||0);
const valid=(v)=>Number.isFinite(Number(v))&&Number(v)>0;
function inspect(form){
 const missing=REVIEW.filter(([key])=>form[key]!==true).map(([key,label])=>label);
 const legalReady=form.legal_model!=='undetermined';
 const scopeReady=!!String(form.title||'').trim()&&!!String(form.scope||'').trim()
   &&!!String(form.output_definition||'').trim()&&!!String(form.acceptance_criteria||'').trim();
 const priceReady=valid(form.offered_gross_budget)&&valid(form.estimated_hours)&&Number.isInteger(Number(form.tasks_quantity))&&Number(form.tasks_quantity)>0;
 const eligible=legalReady&&scopeReady&&priceReady&&!missing.length&&!form.is_demo;
 return {missing,legalReady,scopeReady,priceReady,eligible,
  nominalHourly:priceReady?Number(form.offered_gross_budget)/(Number(form.estimated_hours)*Number(form.tasks_quantity)):null,
 };
}

export default function FlexibleWorkPilotDesk(){
 const {user}=useAuth();
 const admin=user?.role==='admin';
 const [records,setRecords]=useState([]);
 const [form,setForm]=useState(EMPTY);
 const [editing,setEditing]=useState('');
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const checklist=useMemo(()=>inspect(form),[form]);
 const set=(key,value)=>setForm(prev=>({...prev,[key]:value}));

 const load=async()=>{
  if(!admin){setLoading(false);return;}
  try{
   const out=await base44.entities.FlexibleWorkPilot.list('-created_date',100);
   setRecords(Array.isArray(out)?out:out?.items||[]);
  }catch(e){setError('Esnek görev kayıtları yüklenemedi. Yönetici yetkisi ve veri modeli kontrol edilmeli.');}
  finally{setLoading(false);}
 };
 useEffect(()=>{load();},[admin,user?.id]);

 const clear=()=>{setForm({...EMPTY});setEditing('');setError('');setMessage('');};
 const open=(row)=>{
  const clean={...EMPTY};
  Object.keys(EMPTY).forEach(key=>{if(row[key]!==undefined&&row[key]!==null)clean[key]=row[key];});
  setForm(clean);setEditing(row.id);setError('');setMessage('Taslak inceleme için açıldı; yayın veya ödeme yapılmaz.');
  window.scrollTo({top:0,behavior:'smooth'});
 };
 const save=async(event)=>{
  event.preventDefault();
  if(!admin||busy)return;
  setError('');setMessage('');
  if(!checklist.scopeReady||!checklist.priceReady){
   setError('Başlık, kapsam, çıktı, kabul koşulları, gerçekçi süre, pozitif brüt bütçe ve pozitif adet gereklidir.');
   return;
  }
  if(form.title.length>160||form.scope.length>2600||form.output_definition.length>1600||form.acceptance_criteria.length>1600){
   setError('Metin alanlarından biri izin verilen uzunluğu aşıyor.');return;
  }
  const values={
   ...form, title:form.title.trim(),scope:form.scope.trim(),output_definition:form.output_definition.trim(),
   acceptance_criteria:form.acceptance_criteria.trim(),requesting_company:form.requesting_company.trim(),
   required_skills:form.required_skills.trim(),deadline_note:form.deadline_note.trim(),
   review_note:form.review_note.trim(),estimated_hours:Number(form.estimated_hours),
   offered_gross_budget:Number(form.offered_gross_budget),tasks_quantity:Number(form.tasks_quantity),
   public_visible:false,
   status:checklist.eligible?'review_pending':'draft',
  };
  setBusy(true);
  try{
   if(editing) await base44.entities.FlexibleWorkPilot.update(editing,values);
   else await base44.entities.FlexibleWorkPilot.create(values);
   await load();setEditing('');setMessage('Pilot görev kaydı saklandı. Kamuya ilan açılmaz, başvuru veya ödeme başlatılmaz.');
  }catch(e){setError('Görev kaydı kaydedilemedi. Bağlantı veya yetkileri kontrol edin.');}
  finally{setBusy(false);}
 };

 return (
  <div className="mx-auto max-w-7xl space-y-5">
   <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Atlas Endüstri Ağı · Yeni pilot</p>
     <h1 className="mt-1 text-2xl font-black text-foreground">Esnek Kazanç — Yönetici Görev Tasarımı</h1>
     <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
      Telefon, bilgisayar veya yerel üretim için ücretli görevin kapsamını, karşılığını ve hukuki güvencelerini tasarlama alanı.
      Gerçek müşteri, bütçe ve ödeme yöntemi doğrulanmadan iş ilanı yayınlanmaz.
     </p>
    </div>
    <Link to="/esnek-kazanc" className="rounded-lg border border-border px-3 py-2 text-xs font-bold">Herkese açık tanıtım sayfası</Link>
   </header>
   <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
    {[
     ['Toplam taslak',records.length],
     ['Örnek kayıt',records.filter(x=>x.is_demo).length],
     ['İnceleme bekleyen',records.filter(x=>!x.is_demo&&x.status==='review_pending').length],
     ['Yayınlanan ücretli iş',0],
    ].map(([label,value])=>(
     <div key={label} className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums">{value}</p>
     </div>
    ))}
   </div>
   <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950">
    <ShieldAlert size={20} className="mt-1 shrink-0"/>
    <div>
     <strong>Güvenli tasarım aşaması.</strong> Bu sayfa görev ve ücretlendirme planı kaydeder; çalışan başvurusu, anlaşma,
     tahsilat veya ödeme gerçekleştirmez. İlk pilot yalnızca 18 yaş ve üzeri yetişkinlere yöneliktir.
     İşe yerleştirme hizmeti ve bağımsız ticari hizmet, uygun hukuki modele göre ayrı değerlendirilir.
     Çalışanlardan kayıt veya eşleşme ücreti alınmaz.
    </div>
   </div>
   <section className="rounded-xl border border-border bg-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
     <h2 className="flex items-center gap-2 text-base font-bold"><MonitorSmartphone size={18}/> Görev ve teslim şartları</h2>
     <div className="flex gap-2">
      <button type="button" onClick={()=>{setForm({...EXAMPLE});setEditing('');setMessage('Bu kurgu yalnızca örnektir; gerçek ödeme veya görev değildir.');}} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">Örnek doldur</button>
      <button type="button" onClick={clear} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">Temizle</button>
     </div>
    </div>
    {form.is_demo&&<p className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-950">ÖRNEK SENARYO — gerçek talep veya gelir değildir.</p>}
    <form onSubmit={save} className="mt-4 space-y-4">
     <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs font-bold">Görev adı *
       <input value={form.title} maxLength={160} required onChange={e=>set('title',e.target.value)} placeholder="Örn. 20 ürün katalog kaydı"
        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
      </label>
      <label className="block text-xs font-bold">İşi talep eden firma
       <input value={form.requesting_company} maxLength={180} onChange={e=>set('requesting_company',e.target.value)}
        placeholder="Firma doğrulanmadan yayınlanmaz" className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
      </label>
      <label className="block text-xs font-bold">İş türü
       <select value={form.category} onChange={e=>set('category',e.target.value)}
        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal">
        {CATEGORIES.map(([key,label])=><option key={key} value={key}>{label}</option>)}
       </select>
      </label>
      <label className="block text-xs font-bold">Hangi cihazla?
       <select value={form.delivery_mode} onChange={e=>set('delivery_mode',e.target.value)}
        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal">
        {MODES.map(([key,label])=><option key={key} value={key}>{label}</option>)}
       </select>
      </label>
      <label className="block text-xs font-bold sm:col-span-2">Çalışma / sözleşme modeli
       <select value={form.legal_model} onChange={e=>set('legal_model',e.target.value)}
        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal">
        {MODELS.map(([key,label])=><option key={key} value={key}>{label}</option>)}
       </select>
      </label>
      {[
       ['scope','İş kapsamı *','Gerçekte hangi hizmet verilecek?'],
       ['output_definition','Ölçülebilir teslim / çıktı *','Kaç dosya, hangi kalite ve format?'],
       ['acceptance_criteria','Teknik kabul ve revizyon sınırları *','Teslimi hangi objektif ölçüte göre kabul edeceğiz?'],
       ['required_skills','Gerekli beceriler','Gerçek, ölçülebilir beceri; aile durumu veya hassas kriter yok'],
      ].map(([key,label,hint])=>(
       <label key={key} className="block text-xs font-bold">{label}
        <textarea rows={2} required={['scope','output_definition','acceptance_criteria'].includes(key)}
         maxLength={key==='scope'?2600:1600} value={form[key]} onChange={e=>set(key,e.target.value)}
         placeholder={hint} className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"/>
       </label>
      ))}
     </div>
     <div className="grid gap-3 sm:grid-cols-3">
      {[
       ['tasks_quantity','Görev adedi',1],
       ['estimated_hours','Bir görev için tahmini saat',0.25],
       ['offered_gross_budget','Bir görev için önerilen brüt bedel (TL)',1],
      ].map(([key,label,min])=>(
       <label key={key} className="block text-xs font-bold">{label}
        <input type="number" min={min} step={key==='tasks_quantity'?'1':'any'} value={form[key]} onChange={e=>set(key,e.target.value)}
         className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
       </label>
      ))}
     </div>
     <label className="block text-xs font-bold">Teslim süresi / saat esnekliği
      <input maxLength={250} value={form.deadline_note} onChange={e=>set('deadline_note',e.target.value)}
       placeholder="Örn. 5 iş günü; gece çalışması zorunlu değil" className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
     </label>
     <div className="rounded-lg border border-border bg-background p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Wallet size={16}/> Gelir ve emek karşılığı görünürlüğü</h3>
      <p className="mt-2 text-sm">Bir görev brüt bedeli: <strong>{valid(form.offered_gross_budget)?format(form.offered_gross_budget):'Henüz belirtilmedi'}</strong></p>
      <p className="mt-1 text-sm">Tahmini saatlik brüt karşılık: <strong>{checklist.nominalHourly!==null?format(checklist.nominalHourly):'Hesaplanmadı'}</strong></p>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
       Saatlik karşılık yalnızca yaklaşık karşılaştırmadır; vergi, SGK, malzeme, ekipman, komisyon ve diğer giderler
       ayrıca açıklanmadan kişiye net kazanç vaat edilmez. Sözleşme türüne göre asgari çalışma şartları kontrol edilir.
      </p>
     </div>
     <div className="rounded-lg border border-border bg-background p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold"><FileCheck2 size={16}/> Yayın öncesi güvenlik ve hak kontrolü</h3>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
       İşaretlemeler sadece yönetici inceleme kaydıdır; otomatik ilan yayını veya ödeme yetkisi oluşturmaz.
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
       {REVIEW.map(([key,label])=>(
        <label key={key} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs leading-5">
         <input type="checkbox" className="mt-0.5" checked={form[key]===true} onChange={e=>set(key,e.target.checked)}/>
         {label}
        </label>
       ))}
      </div>
      <p className="mt-3 text-xs font-semibold">{checklist.eligible
       ? 'Kontrol listesi tamam: pilot ön incelemesine alınabilir. İlan ve ödeme hâlâ kapalı.'
       : 'Henüz inceleme için eksik kayıt var. Kamuya ilan açılmaz.'}</p>
      {!checklist.legalReady&&<p className="mt-1 text-xs text-amber-800">Çalışmanın hukuki modeli ayrıca belirlenmeli.</p>}
      {checklist.missing.length>0&&<p className="mt-1 text-[11px] text-muted-foreground">{checklist.missing.length} güvenlik koşulu tamamlanmadı.</p>}
     </div>
     <label className="block text-xs font-bold">Yönetici denetim notu
      <textarea rows={3} maxLength={2000} value={form.review_note} onChange={e=>set('review_note',e.target.value)}
       placeholder="Firma teyidi, ödeme/vergilendirme koşulu, itiraz usulü ve gerekli işlem"
       className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
     </label>
     {error&&<p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
     {message&&<p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{message}</p>}
     <button type="submit" disabled={!admin||busy||!checklist.scopeReady||!checklist.priceReady}
      className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
      <Save size={15} className="mr-2 inline"/>{busy?'Kaydediliyor...':editing?'Taslağı güncelle':'Pilot görev taslağını kaydet'}
     </button>
    </form>
   </section>
   <section className="rounded-xl border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 font-bold"><ClipboardCheck size={18}/> Tasarlanan pilot görevler</h2>
    <p className="mt-1 text-xs text-muted-foreground">Hazırlanan işler kamuya ilan edilmez; gerçek müşteri veya kazanılmış gelir sayılmaz.</p>
    {loading&&<p className="mt-3 text-xs text-muted-foreground">Kayıtlar yükleniyor…</p>}
    {!loading&&!records.length&&<p className="mt-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
      Henüz görev taslağı yok. Önce bir örnek senaryoyu inceleyebilirsin.
    </p>}
    <div className="mt-3 grid gap-2 md:grid-cols-2">
     {records.map(row=>(
      <article key={row.id} className="rounded-lg border border-border bg-background p-3">
       <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold">{row.title}</p>
        <span className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold">
         {row.is_demo?'DEMO':row.status==='review_pending'?'İncelemede':'Taslak'}
        </span>
       </div>
       <p className="mt-2 text-xs text-muted-foreground">{MODES.find(x=>x[0]===row.delivery_mode)?.[1]||'Cihaz belirtilmedi'} · {row.requesting_company||'Firma belirtilmedi'}</p>
       <p className="mt-2 text-xs">Önerilen görev bedeli: <strong>{format(row.offered_gross_budget)}</strong></p>
       <button type="button" onClick={()=>open(row)} className="mt-2 rounded-lg border border-border px-3 py-2 text-xs font-bold">İncele / düzenle</button>
      </article>
     ))}
    </div>
   </section>
  </div>
 );
}
