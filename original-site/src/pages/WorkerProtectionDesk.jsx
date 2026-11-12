import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle2, ClipboardCheck, Plus, RefreshCw, ShieldAlert } from 'lucide-react';

const CHECKS=[
 ['employer_identity_checked','İstihdam eden gerçek işveren / yetki doğrulandı'],
 ['lawful_work_model_checked','İŞKUR, alt yüklenici, geçici işçi veya doğrudan istihdam modeli hukuken kontrol edildi'],
 ['worker_terms_disclosed','Çalışan iş koşullarını yazılı gördü'],
 ['wages_and_payday_written','Yevmiye/maaş (brüt/net), ödeme günü, kesintiler yazılı'],
 ['min_wage_and_overtime_checked','Asgari ücret ve mesai ödeme uygunluğu'],
 ['working_hours_rest_checked','Çalışma, dinlenme, hafta tatili düzeni'],
 ['sgk_entry_confirmed','SGK işe giriş doğrulandı (yasal istisna ve süreler kontrol edilerek)'],
 ['job_risk_assessment_checked','İşe/sahaya özel İSG risk değerlendirmesi'],
 ['safety_training_checked','İSG eğitimi/işe uygunluk kontrolü'],
 ['equipment_and_ppe_checked','Koruyucu donanım ve saha ekipmanı sorumlusu'],
 ['lodging_travel_terms_checked','Yol/yemek/konaklama varsa yazılı şartları'],
 ['no_worker_fee_confirmed','Çalışandan yasa dışı aracılık/hizmet bedeli alınmıyor'],
 ['worker_copy_and_grievance_checked','Sözleşme nüshası, itiraz ve şikâyet kanalı'],
 ['signed_contract_evidence_checked','Gerçek taraflarca imzalanmış iş sözleşmesi kanıtı teyit edildi'],
 ['employer_contract_evidence_checked','İşveren/alt yüklenici ticari sözleşme ve sorumluluklar teyit edildi'],
 ['authorized_partner_or_is_kur_checked','İşe aracılık söz konusuysa geçerli İŞKUR yetkisi teyit edildi (doğrudan istihdamsa kapsam değerlendirmesi belgelendi)'],
 ['legal_advice_recorded','Hukuk ve bordro/SGK uzman incelemesi tamamlandı']
];
const STATUS=[['draft','Taslak'],['legal_review','Hukuki değerlendirme'],['documents_pending','Eksik kanıt/belge'],['ready_for_signature','İmzaya hazırlık'],['evidence_checked','İmzalı ve kontrol edilmiş (iç kayıt)'],['blocked','İşlem durduruldu']];
export default function WorkerProtectionDesk(){
 const {user}=useAuth();
 const admin=user?.role==='admin';
 const [cases,setCases]=useState([]);
 const [offers,setOffers]=useState([]);
 const [selected,setSelected]=useState('');
 const [draft,setDraft]=useState({case_title:'',project_reference:'',contracting_employer:'',work_model:'daily_wage',manager_note:'',offer_id:'',work_request_id:'',worker_case_ref:''});
 const [open,setOpen]=useState(false);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){
  if(!admin){setLoading(false);return;}
  setError('');setLoading(true);
  try{
    const [raw,ot]=await Promise.all([
      base44.entities.WorkerProtectionReview.list('-created_date',150),
      base44.entities.Offer.list('-created_date',250)
    ]);
    const list=Array.isArray(raw)?raw:raw?.items||[];
    setCases(list);setSelected(old=>list.some(x=>x.id===old)?old:list[0]?.id||'');
    const incoming=Array.isArray(ot)?ot:ot?.items||[];
    setOffers(incoming.filter(x=>!x.is_demo&&x.status!=='withdrawn'&&x.work_request_id));
  }
  catch(e){setError('Çalışan koruma kayıtları yüklenemedi.');}finally{setLoading(false);}
 }
 useEffect(()=>{load();},[user?.id,admin]);
 const current=cases.find(x=>x.id===selected);
 const complete=current?CHECKS.filter(([k])=>current[k]===true).length:0;
 const verified=current&&complete===CHECKS.length&&!!current.contracting_employer&&!!current.worker_case_ref&&!!current.offer_id&&!!current.work_request_id&&!current.is_demo;
 async function patch(payload,msg='İç değerlendirme güncellendi.'){
  if(!current||busy)return;
  setBusy(true);setError('');setNotice('');
  try{await base44.entities.WorkerProtectionReview.update(current.id,payload);await load();setNotice(msg);}
  catch(e){setError('Değişiklik kaydedilemedi.');}finally{setBusy(false);}
 }
 async function create(e){
  e.preventDefault();if(busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   if(draft.case_title.trim().length<5)throw new Error('En az 5 karakterli iş paketi adı gerekli.');
   if(!draft.offer_id || !draft.work_request_id)throw new Error('Gerçek bir teklif/iş talebi seçilmeli. Sahte veya demo kayıt için işe başlatma dosyası oluşturulamaz.');
   if(!/^[A-Za-z0-9_-]{4,30}$/.test(draft.worker_case_ref))throw new Error('Kişisel veri içermeyen en az dört karakterli farklı çalışan dosya kodu girin.');
   if(cases.some(x=>x.offer_id===draft.offer_id && x.worker_case_ref===draft.worker_case_ref))throw new Error('Aynı teklif ve çalışan referansı için zaten dosya var.');
   const x=await base44.entities.WorkerProtectionReview.create({...draft,status:'draft',is_demo:false});
   setSelected(x.id);setOpen(false);setDraft({case_title:'',project_reference:'',contracting_employer:'',work_model:'daily_wage',manager_note:'',offer_id:'',work_request_id:'',worker_case_ref:''});
   await load();setSelected(x.id);setNotice('Yalnızca iç hukuki kontrol kaydı oluşturuldu; çalışan atanmadı.');
  }catch(e){setError(e.message||'Kayıt oluşturulamadı.');}finally{setBusy(false);}
 }
 function setStatus(value){
  if(['ready_for_signature','evidence_checked'].includes(value)){
    if(!verified){setError('Eksik kontrol varsa sözleşme/çalışma onayına geçilemez. Hukuk, İŞKUR, SGK, imza ve İSG kontrollerini tamamlayın.');return;}
  }
  patch({status:value,...(value==='evidence_checked'?{evidence_reviewed_at:new Date().toISOString()}:{} )},'İç inceleme aşaması güncellendi. Resmî imza/SGK bildirimi kendiliğinden yapılmadı.');
 }
 if(!admin)return <div className="rounded-xl border border-border bg-card p-7"><ShieldAlert/><h1 className="mt-3 text-lg font-bold">Çalışan Koruma Kontrolü</h1><p className="mt-2 text-sm text-muted-foreground">Bu işlem kayıtları yalnız yetkili yönetimce görülür.</p><Link to="/calisan-haklari" className="mt-4 inline-block text-sm font-bold text-amber-700 underline">Çalışan hakları ilkeleri</Link></div>;
 return <div className="mx-auto max-w-7xl space-y-5">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-amber-700">Atlas Endüstri Ağı · Emek güvencesi</p><h1 className="mt-1 text-2xl font-black">Çalışan Sözleşme ve Hak Koruma Kontrolü</h1><p className="mt-2 text-sm text-muted-foreground">Maaşlı veya yevmiyeli her gerçek görevlendirme için önceden işveren, bordro, ücret, sigorta, sözleşme ve İSG kontrol kaydı.</p></div><div className="flex gap-2"><button onClick={load} className="rounded-lg border border-border px-3 py-2 text-sm"><RefreshCw size={16} className="mr-1 inline"/>Yenile</button><button onClick={()=>setOpen(x=>!x)} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950"><Plus size={16} className="mr-1 inline"/>Ön kontrol aç</button></div></div>
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert size={17} className="mr-1 inline"/>Atlas hâlen işe aracılık/geçici işçi sağlama yetkisine sahip olduğunu iddia etmiyor. Bu ekran yalnız iç kontrol listesidir; imza, SGK bildirimi, ruhsat veya hukuk görüşünün kendisi değildir. Çalışanın hassas kimlik ve sağlık belgesini bu pilot ekrana yüklemeyin.</div>
  <div className="grid grid-cols-3 gap-3">{[['İnceleme kaydı',cases.length],['Eksik/engelli',cases.filter(x=>x.status!=='evidence_checked').length],['Tüm kontroller tamam',cases.filter(x=>CHECKS.every(([k])=>x[k]===true)&&x.status==='evidence_checked'&&!x.is_demo).length]].map(([name,count])=><div key={name} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{name}</p><p className="mt-2 text-2xl font-black">{count}</p></div>)}</div>
  {open&&<form onSubmit={create} className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"><h2 className="font-bold sm:col-span-2">Yeni iş paketi ön kontrol kaydı</h2>
   <label className="text-xs font-semibold">Gerçek teklif / iş talebi
    <select required value={draft.offer_id} onChange={e=>{
      const offer=offers.find(x=>x.id===e.target.value);
      setDraft(x=>({...x,offer_id:offer?.id||'',work_request_id:offer?.work_request_id||'',project_reference:offer?.project_title||x.project_reference}));
    }} className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm">
      <option value="">Gerçek teklif seçin</option>
      {offers.map(x=><option key={x.id} value={x.id}>{x.project_title||'Teklif'} · {x.applicant_name||x.applicant_type} · {x.team_size||1} kişi</option>)}
    </select>
   </label>
   <label className="text-xs font-semibold">Her çalışan için ayrı anonim iç referans
    <input required maxLength={30} placeholder="ORN-PROJE12-USTA01 (isim/TC no değil)" value={draft.worker_case_ref} onChange={e=>setDraft(x=>({...x,worker_case_ref:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border p-3 text-sm"/>
   </label>
   <label className="text-xs font-semibold">İş paketi / kontrol adı<input required minLength={5} value={draft.case_title} onChange={e=>setDraft(x=>({...x,case_title:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border p-3 text-sm"/></label>
   <label className="text-xs font-semibold">Proje referansı<input value={draft.project_reference} onChange={e=>setDraft(x=>({...x,project_reference:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border p-3 text-sm"/></label>
   <label className="text-xs font-semibold">Gerçek işveren/ticari unvan<input value={draft.contracting_employer} onChange={e=>setDraft(x=>({...x,contracting_employer:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border p-3 text-sm"/></label>
   <label className="text-xs font-semibold">Çalışma modeli<select value={draft.work_model} onChange={e=>setDraft(x=>({...x,work_model:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border p-3 text-sm"><option value="daily_wage">Yevmiyeli</option><option value="monthly_salary">Aylık maaşlı</option><option value="other">Diğer / hukuk incelemesi</option></select></label>
   <label className="text-xs font-semibold sm:col-span-2">İlk not<textarea rows={2} value={draft.manager_note} onChange={e=>setDraft(x=>({...x,manager_note:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border p-3 text-sm"/></label>
   <button type="submit" disabled={busy||offers.length===0} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-40 sm:col-span-2">İç taslak oluştur — işe başlatma değil</button>
  </form>}
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
  {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
  <div className="grid gap-5 lg:grid-cols-3"><section className="space-y-2">{loading&&<p className="text-sm text-muted-foreground">Kayıtlar yükleniyor...</p>}{cases.map(x=><button type="button" key={x.id} onClick={()=>{setSelected(x.id);setError('');}} className={'block w-full rounded-xl border p-4 text-left '+(x.id===selected?'border-amber-400 bg-amber-50':'border-border bg-card')}><strong className="block text-sm">{x.case_title}</strong><span className="mt-2 block text-xs text-muted-foreground">{x.contracting_employer||'İşveren belirlenmedi'} · {x.work_model==='daily_wage'?'Yevmiyeli':'Aylık/diğer'}</span><span className="mt-2 block text-xs">{x.status||'draft'}</span></button>)}{!loading&&cases.length===0&&<p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Henüz gerçek görevlendirme veya sözleşme kontrol kaydı oluşturulmadı. Gerçek teklif olmadan kayıt açılmaz.</p>}</section>
  <section className="lg:col-span-2">{current?<div className="rounded-xl border border-border bg-card p-5"><h2 className="text-xl font-bold">{current.case_title}</h2><p className="mt-2 text-xs text-muted-foreground">{current.project_reference||'Proje referansı yok'} · {current.contracting_employer||'Gerçek işveren belirtilmedi'} · Çalışan iç dosya: {current.worker_case_ref||'Yok'}</p>
   <div className="mt-5 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">Sözleşme ve emek hakları kontrolü</h3><span className="rounded-lg bg-muted px-3 py-2 text-xs font-bold">{complete}/{CHECKS.length} madde</span></div>
   <div className="mt-4 grid gap-2">{CHECKS.map(([key,title])=><label key={key} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm"><input type="checkbox" disabled={busy} className="mt-1" checked={current[key]===true} onChange={e=>patch({[key]:e.target.checked},'İlgili kanıtın yönetici tarafından kontrol edildiği işaretlendi. Gerçek belge ayrıca incelenmeli.')}/>{title}</label>)}</div>
   <label className="mt-5 block text-sm font-bold">İç süreç durumu<select disabled={busy} value={current.status||'draft'} onChange={e=>setStatus(e.target.value)} className="mt-2 block w-full rounded-lg border border-border bg-background p-3 text-sm">{STATUS.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
   {!verified&&<p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><ShieldAlert size={15} className="mr-1 inline"/>Kontroller tamamlanmadığından imzaya/işe başlatmaya uygun değil. Gerekli uzman ve yasal koşullar doğrulanmadan fiilî görevlendirme yapılmamalı.</p>}
   <div className="mt-5 flex flex-wrap gap-3"><Link to="/calisan-haklari" className="text-sm font-bold text-amber-700 underline">Çalışan hakları ilkeleri</Link><Link to="/destek" className="text-sm font-bold text-amber-700 underline">Hak ihlali desteği</Link></div>
  </div>:<div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">Soldan bir kontrol kaydı seçin veya yeni ön kontrol oluşturun.</div>}</section></div>
 </div>;
}