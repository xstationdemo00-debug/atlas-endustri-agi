import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ArrowRight, ArrowUpRight, CheckCircle2, ClipboardCheck, ExternalLink, FileText, Plus, RefreshCw, ShieldAlert } from 'lucide-react';

const PHASES=[
 ['discovery','Fırsat keşfi'],['qualification','Ön yeterlik'],['solution_design','Çözüm ve ortaklar'],
 ['proposal','Teklif / fizibilite'],['contracting','Sözleşme'],['mobilization','Mobilizasyon'],
 ['execution','Uygulama'],['acceptance','Teslim ve kabul'],['closed','Kapanış']
];
const MODES=[
 ['undecided','Belirlenmedi'],['research_consultancy','Araştırma / süreç desteği (pilot)'],
 ['supplier_matching','Ticari tedarik / üretici araştırması (pilot)'],
 ['subcontractor_package','Alt yüklenici iş paketi (koşullu)'],
 ['licensed_staffing_partner','Yetkili istihdam/işgücü ortağı (lisanslı)'],
 ['prime_contract_future','Atlas ana yüklenici / anahtar teslim (gelecek hedef)']
];
const TYPES=[
 ['public_tender','Kamu ihalesi'],['private_rfq','Özel sektör RFQ'],
 ['market_intelligence','Pazar/proje araştırması'],['subcontract_package','Alt iş paketi'],['direct_request','Doğrudan talep']
];
const BUYERS=[
 ['central_government','Merkezi idare'],['municipality','Belediye'],
 ['public_enterprise','Kamu işletmesi'],['private_company','Özel şirket'],
 ['international_institution','Uluslararası kuruluş'],['other','Diğer']
];
const TASKS=[
 ['discovery','İlanın asıl kaynağını ve referansını doğrula','platform'],
 ['qualification','Yeterlik, teknik şartname ve teminatı incele','legal_finance'],
 ['qualification','Alt yüklenici ve İŞKUR/İSG mevzuatını değerlendir','legal_finance'],
 ['solution_design','Benzer imalat/üretici araştırması yap','platform'],
 ['solution_design','Malzeme, tedarik ve lojistik paketlerini karşılaştır','supplier'],
 ['proposal','Teknik ve mali fizibiliteyle teklif kararı ver','contractor'],
 ['contracting','Ticari temsil, sözleşme ve sigorta kontrolü','legal_finance'],
 ['mobilization','İSG, kalite ve saha başlangıcını denetle','hse'],
 ['execution','Kalite, maliyet ve iş programını izle','quality'],
 ['acceptance','Teslim tutanağını ve kabulü doğrula','quality'],
 ['closed','Hakediş, garanti ve tahsilat kapanışı','legal_finance']
];
const STATUS=[['todo','Bekliyor'],['in_progress','Çalışılıyor'],['blocked','Engel var'],['done','Tamamlandı']];
const initial={
 title:'',buyer_name:'',buyer_type:'private_company',opportunity_type:'market_intelligence',
 source_platform:'',source_url:'',notice_reference:'',country:'Türkiye',city:'',description:'',
 deadline:'',industry:'',solution_mode:'undecided'
};
const label=(arr,value)=>arr.find(x=>x[0]===value)?.[1]||value||'Belirlenmedi';

export default function ProjectLifecycle(){
 const {user}=useAuth();
 const admin=user?.role==='admin';
 const [list,setList]=useState([]);
 const [tasks,setTasks]=useState([]);
 const [selected,setSelected]=useState('');
 const [form,setForm]=useState(initial);
 const [open,setOpen]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 async function load(){
   if(!admin){setLoading(false);return;}
   setLoading(true);
   try{
    const [opps,t]=await Promise.all([
      base44.entities.ProjectOpportunity.list('-created_date',250),
      base44.entities.OpportunityTask.list('-created_date',700)
    ]);
    const records=Array.isArray(opps)?opps:opps?.items||[];
    setList(records);
    setTasks(Array.isArray(t)?t:t?.items||[]);
    setSelected(previous=>records.some(x=>x.id===previous)?previous:records[0]?.id||'');
   }catch(e){setError('Proje kayıtlarına erişilemiyor. Giriş/yetkileri kontrol edin.');}
   finally{setLoading(false);}
 }
 useEffect(()=>{load();},[user?.id,admin]);
 const current=list.find(x=>x.id===selected);
 const checklist=tasks.filter(t=>t.opportunity_id===selected);
 const phaseIndex=Math.max(0,PHASES.findIndex(x=>x[0]===current?.process_stage));
 const complete=checklist.filter(x=>x.status==='done').length;
 const pastOpen=checklist.filter(x=>x.phase===current?.process_stage&&x.status!=='done');
 async function update(data,message='Kayıt güncellendi.'){
  if(!current||busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   await base44.entities.ProjectOpportunity.update(current.id,data);
   await load();setNotice(message);
  }catch(e){setError('Değişiklik kaydedilemedi.');}
  finally{setBusy(false);}
 }
 async function create(e){
  e.preventDefault();if(busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   const u=new URL(form.source_url);
   if(u.protocol!=='https:')throw new Error('Kaynak HTTPS olmalı.');
   if(list.some(x=>form.notice_reference?.trim()?x.notice_reference===form.notice_reference.trim()&&x.source_platform===form.source_platform:x.source_url===u.href))throw new Error('İlan numarası/kaynak daha önce kaydedildi.');
   const created=await base44.entities.ProjectOpportunity.create({
    ...form,source_url:u.href,verification_status:'unverified',
    process_stage:'discovery',bid_decision:'not_decided',public_visible:false,
    is_demo:false,risk_level:'unknown',readiness:'unassessed'
   });
   if(!created?.id)throw new Error('Proje kaydı oluşturulamadı.');
   const res=await Promise.allSettled(TASKS.map(([phase,title,responsible_role])=>
    base44.entities.OpportunityTask.create({opportunity_id:created.id,phase,title,responsible_role,status:'todo',is_demo:false})
   ));
   setOpen(false);setForm(initial);await load();setSelected(created.id);
   const missing=res.filter(x=>x.status==='rejected').length;
   setNotice(missing?'Fırsat eklendi; '+missing+' kontrol maddesi oluşturulamadı.':'Araştırma kaydı ve 11 kontrol maddesi oluşturuldu.');
  }catch(e){setError(e.message||'Fırsat kaydedilemedi.');}
  finally{setBusy(false);}
 }
 async function updateTask(t,status){
  if(busy)return;
  setBusy(true);setError('');setNotice('');
  try{await base44.entities.OpportunityTask.update(t.id,{status});await load();}
  catch(e){setError('Kontrol maddesi güncellenemedi.');}
  finally{setBusy(false);}
 }
 function advance(){
  if(!current)return;
  const next=PHASES[phaseIndex+1]?.[0];
  if(!next)return;
  if(current.verification_status==='unverified'){setError('Önce ilan kaynağını doğrulayın.');return;}
  if(pastOpen.length){setError('Mevcut aşamada tamamlanmamış '+pastOpen.length+' kontrol maddesi var.');return;}
  if(PHASES.findIndex(x=>x[0]===next)>=3&&current.bid_decision!=='pursue'){setError('Önce ticari değerlendirme kararı verin.');return;}
  if(['contracting','mobilization','execution','acceptance','closed'].includes(next)&&!current.procurement_eligibility_verified){setError('Ticari/ihale ön yeterliği doğrulanmadı.');return;}
  if(['mobilization','execution','acceptance','closed'].includes(next)&&!(current.commercial_entity_ready&&current.written_agreement_verified&&current.counterparty_verified&&current.legal_review_verified)){setError('Ticari yetki, sözleşme ve hukuk kontrolleri eksik.');return;}
  if(['execution','acceptance','closed'].includes(next)&&!current.hse_qa_plan_verified){setError('İSG ve kalite planı doğrulanmadı.');return;}
  if(next==='closed'&&!current.completion_accepted){setError('Teslim/kabul belgesi doğrulanmadı.');return;}
  update({process_stage:next,last_reviewed_at:new Date().toISOString()},'Kontroller sonrası yeni aşamaya geçildi.');
 }
 if(!admin)return <div className="rounded-xl border border-border bg-card p-8"><ShieldAlert size={25}/><h1 className="mt-3 text-xl font-bold">Proje Fırsat ve Operasyon Merkezi</h1><p className="mt-2 text-sm text-muted-foreground">İç proje değerlendirmeleri yalnız yöneticiye açıktır. Yayımlanmış ilanlara herkese açık ihale panosundan ulaşabilirsiniz.</p><Link to="/ihaleler" className="mt-4 inline-block font-bold text-amber-700 underline">İhale panosunu aç</Link></div>;
 return <div className="mx-auto max-w-7xl space-y-5 pb-10">
  <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-amber-700">Atlas Endüstri Ağı · İç operasyon</p><h1 className="mt-1 text-2xl font-black">Proje Fırsat ve Operasyon Merkezi</h1><p className="mt-2 text-sm text-muted-foreground">Kaynak kontrolünden teklif, sözleşme, imalat, teslim ve kabul aşamalarına kadar proje değerlendirme.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={load} className="rounded-lg border border-border px-3 py-2 text-sm"><RefreshCw size={16} className="mr-1 inline"/>Yenile</button><Link to="/ihale-yayinlari" className="rounded-lg border border-border px-3 py-2 text-sm font-bold">İhale yayınları</Link><button type="button" onClick={()=>setOpen(x=>!x)} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950"><Plus size={15} className="mr-1 inline"/>Fırsat ekle</button></div></header>
  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><ShieldAlert size={17} className="mr-2 inline"/>Bunlar yalnızca araştırma ve operasyon kayıtlarıdır. İhaleye teklif verildiği, sözleşme kazanıldığı veya ticari yetkilerin tamamlandığı anlamına gelmez.</div>
  <div className="grid grid-cols-3 gap-3">{[['Fırsat kayıtları',list.filter(x=>!x.is_demo).length],['Teklif değerlendirmesi',list.filter(x=>x.process_stage==='proposal'&&!x.is_demo).length],['Kamuya açık ilan',list.filter(x=>x.public_visible&&!x.is_demo).length]].map(([title,count])=><div key={title} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{title}</p><p className="mt-2 text-3xl font-black">{count}</p></div>)}</div>
  {open&&<form onSubmit={create} className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
   <h2 className="text-lg font-bold sm:col-span-2">Kaynaklı yeni fırsat</h2>
   {[
    ['title','Proje/ilan başlığı *'],['buyer_name','İşveren/idare'],['source_platform','İlan kaynağı *'],
    ['source_url','İlanın HTTPS bağlantısı *'],['notice_reference','İhale kayıt no/İKN'],
    ['country','Ülke'],['city','Şehir'],['industry','Sektör']
   ].map(([key,title])=><label key={key} className="text-xs font-semibold">{title}<input required={['title','source_platform','source_url'].includes(key)} type={key==='source_url'?'url':'text'} value={form[key]} onChange={e=>setForm(x=>({...x,[key]:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border bg-background p-2.5 text-sm"/></label>)}
   <label className="text-xs font-semibold">İşveren türü<select value={form.buyer_type} onChange={e=>setForm(x=>({...x,buyer_type:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border bg-background p-2.5 text-sm">{BUYERS.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
   <label className="text-xs font-semibold">Fırsat türü<select value={form.opportunity_type} onChange={e=>setForm(x=>({...x,opportunity_type:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border bg-background p-2.5 text-sm">{TYPES.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
   <label className="text-xs font-semibold">İhale tarihi<input type="date" value={form.deadline} onChange={e=>setForm(x=>({...x,deadline:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border bg-background p-2.5 text-sm"/></label>
   <label className="text-xs font-semibold sm:col-span-2">Ön değerlendirme açıklaması<textarea rows={3} value={form.description} onChange={e=>setForm(x=>({...x,description:e.target.value}))} className="mt-1 block w-full rounded-lg border border-border bg-background p-2.5 text-sm"/></label>
   <button type="submit" disabled={busy} className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2">Yalnız iç araştırma kaydı oluştur</button>
  </form>}
  {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
  {notice&&<p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
  <div className="grid gap-5 lg:grid-cols-3">
   <section className="space-y-2"><h2 className="text-lg font-bold">Proje fırsatları ({list.length})</h2>{loading&&<p className="text-sm text-muted-foreground">Yükleniyor...</p>}{list.map(x=><button key={x.id} type="button" onClick={()=>{setSelected(x.id);setError('');setNotice('');}} className={'block w-full rounded-xl border p-4 text-left '+(x.id===selected?'border-amber-500 bg-amber-50':'border-border bg-card')}><strong className="block text-sm">{x.title}</strong><span className="mt-2 block text-xs text-muted-foreground">{x.buyer_name||x.city||'Bölge belirtilmedi'} · {x.notice_reference||'Referans eksik'}</span><span className="mt-2 inline-flex gap-2 text-xs font-semibold">{label(PHASES,x.process_stage)} {x.public_visible&&<span className="text-emerald-700">· İlan panosunda</span>}{x.is_demo&&<span className="text-amber-700">· TEST</span>}</span></button>)}</section>
   <section className="space-y-4 lg:col-span-2">
    {!current?<div className="rounded-xl border border-dashed border-border bg-card p-8"><p className="font-bold">Fırsat kaydı seçin</p><p className="mt-2 text-sm text-muted-foreground">Kaynakları kontrol etmek ve proje aşamalarını yönetmek için araştırma kaydı oluşturun.</p></div>:<>
     <article className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-xl font-black">{current.title}</h2>
      <p className="mt-2 text-xs text-muted-foreground">{current.notice_reference} · {current.city} · {label(BUYERS,current.buyer_type)}</p>
      <p className="mt-3 text-sm text-muted-foreground">{current.description}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold"><a href={current.official_source_url||current.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-700 underline">İlan kaynağı <ExternalLink size={13}/></a><Link to="/ihale-yayinlari" className="text-amber-700 underline">Kamuya açık ilan yönetimi</Link></div>
      <div className="mt-5 grid grid-cols-9 gap-1">{PHASES.map(([stage],i)=><span key={stage} title={label(PHASES,stage)} className={'rounded p-2 text-center text-xs font-bold '+(i<=phaseIndex?'bg-amber-500 text-slate-900':'bg-slate-100 text-slate-600')}>{i+1}</span>)}</div><p className="mt-2 text-sm font-bold">{label(PHASES,current.process_stage)}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
       <label className="text-xs font-bold">Kaynak doğrulaması<select disabled={busy} value={current.verification_status||'unverified'} onChange={e=>update({verification_status:e.target.value})} className="mt-1 block w-full rounded-lg border border-border bg-background p-2.5 text-sm"><option value="unverified">Kontrol edilmedi</option><option value="source_checked">Kaynak kontrol edildi</option><option value="requirements_checked">Şartlar kontrol edildi</option><option value="bid_eligible">Yeterlik teyit edildi</option></select></label>
       <label className="text-xs font-bold">İhale/teklif kararı<select disabled={busy} value={current.bid_decision||'not_decided'} onChange={e=>update({bid_decision:e.target.value})} className="mt-1 block w-full rounded-lg border border-border bg-background p-2.5 text-sm"><option value="not_decided">Karar verilmedi</option><option value="monitor">İzle</option><option value="pursue">Teklif araştır</option><option value="no_bid">Teklif verme</option></select></label>
       <label className="text-xs font-bold sm:col-span-2">Çözüm modeli<select disabled={busy} value={current.solution_mode||'undecided'} onChange={e=>update({solution_mode:e.target.value})} className="mt-1 block w-full rounded-lg border border-border bg-background p-2.5 text-sm">{MODES.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
      </div>
      <p className="mt-3 text-xs text-amber-700">Bir çözüm modelini seçmek, o hizmetin yetkilendirildiği veya sözleşme alındığı anlamına gelmez.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{[
       ['procurement_eligibility_verified','İhale/ticari yeterlik'],['commercial_entity_ready','Şirket/temsil yetkisi'],
       ['counterparty_verified','Karşı taraf doğrulaması'],['written_agreement_verified','Yazılı sözleşme'],
       ['legal_review_verified','Hukuki inceleme'],['hse_qa_plan_verified','İSG/kalite planı'],
       ['completion_accepted','Teslim ve kabul belgesi']
      ].map(([k,title])=><label key={k} className="flex items-center gap-2 rounded-md border border-border p-2 text-xs"><input disabled={busy} type="checkbox" checked={!!current[k]} onChange={e=>update({[k]:e.target.checked})}/>{title}</label>)}</div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Aşamalar sırayla ilerler. Mevcut aşamada {pastOpen.length} açık kontrol var.</span><button disabled={busy||phaseIndex===PHASES.length-1} onClick={advance} className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Sonraki aşama <ArrowRight size={13} className="ml-1 inline"/></button></div>
     </article>
     <article className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-bold"><ClipboardCheck size={17}/> Proje kontrol listesi</h3><span className="text-xs font-bold">{complete}/{checklist.length} tamamlandı</span></div><div className="mt-4 space-y-2">{[...checklist].sort((a,b)=>PHASES.findIndex(x=>x[0]===a.phase)-PHASES.findIndex(x=>x[0]===b.phase)).map(t=><div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{t.title}</p><p className="mt-1 text-xs text-muted-foreground">{label(PHASES,t.phase)} · {t.responsible_role}</p></div><select disabled={busy} value={t.status||'todo'} onChange={e=>updateTask(t,e.target.value)} className="rounded-md border border-border bg-background p-2 text-xs">{STATUS.map(([v,name])=><option key={v} value={v}>{name}</option>)}</select></div>)}</div>{checklist.length===0&&<p className="text-sm text-muted-foreground">Kontrol listesi bulunmuyor.</p>}</article>
    </>}
   </section>
  </div>
 </div>;
}
