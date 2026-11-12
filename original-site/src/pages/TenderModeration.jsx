import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle2, ExternalLink, Filter, RefreshCw, ShieldAlert } from 'lucide-react';

const allowedHosts=new Set(['ekap.kik.gov.tr','gaski.gov.tr','www.gaski.gov.tr','ted.europa.eu','ungm.org','www.ungm.org','ecepp.ebrd.com','projects.worldbank.org']);
function safeLink(s){try{const u=new URL(s);return u.protocol==='https:'&&allowedHosts.has(u.hostname)?u.href:'';}catch{return '';}}
function initialForm(x){return {title:x.title||'',public_summary:x.public_summary||'',official_source_url:x.official_source_url||x.source_url||'',deadline:x.deadline||'',deadline_time:x.deadline_time||'',city:x.city||'',industry:x.industry||''};}
export default function TenderModeration(){
 const {user}=useAuth();
 const admin=user?.role==='admin';
 const [list,setList]=useState([]);
 const [selected,setSelected]=useState('');
 const [form,setForm]=useState({});
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 async function load(){
   if(!admin){setLoading(false);return;}
   setLoading(true);setError('');
   try{
    const r=await base44.entities.ProjectOpportunity.list('-created_date',300);
    const rows=Array.isArray(r)?r:r?.items||[];
    setList(rows);
    const currentId=rows.some(x=>x.id===selected)?selected:rows[0]?.id||'';
    setSelected(currentId);
    const current=rows.find(x=>x.id===currentId);
    setForm(current?initialForm(current):{});
   }catch(e){setError('İhale kayıtları yüklenemedi.');}finally{setLoading(false);}
 }
 useEffect(()=>{load();},[user?.id,admin]);
 const current=list.find(x=>x.id===selected);
 const published=list.filter(x=>x.public_visible&&!x.is_demo).length;
 const awaiting=list.filter(x=>!x.public_visible&&!x.is_demo).length;
 function select(id){setSelected(id);setNotice('');setError('');setForm(initialForm(list.find(x=>x.id===id)||{}));}
 const valid=!!(current&&!current.is_demo&&/^\d{4}\/\d{3,8}$/.test(current.notice_reference||'')&&/^\d{4}-\d{2}-\d{2}$/.test(form.deadline||'')&&/^([01]\d|2[0-3]):[0-5]\d$/.test(form.deadline_time||'')&&form.public_summary?.trim().length>=30&&safeLink(form.official_source_url));
 async function save(makeVisible){
  if(!current||busy)return;
  if(makeVisible&&!valid){setError('Yayın için gerçek İKN, doğrulanmış resmî HTTPS bağlantısı, son tarih/saat ve açıklama gerekli. Test kaydı yayımlanamaz.');return;}
  setBusy(true);setNotice('');setError('');
  try{
   const patch={...form};
   if(makeVisible){
    patch.verification_status='source_checked';
    patch.public_visible=true;
    patch.publication_checked_at=new Date().toISOString();
   }
   await base44.entities.ProjectOpportunity.update(current.id,patch);
   await load();
   setNotice(makeVisible?'İlan halka açık fırsat panosuna gönderildi. Resmî kaynak değişikliklerini izlemeniz gerekir.':'İlan taslağı kaydedildi.');
  }catch(e){setError('Kayıt güncellenemedi. Erişim ve alanları kontrol edin.');}
  finally{setBusy(false);}
 }
 async function unpublish(){
  if(!current||busy)return;
  setBusy(true);setNotice('');setError('');
  try{await base44.entities.ProjectOpportunity.update(current.id,{public_visible:false});await load();setNotice('İlan halka açık panodan kaldırıldı.');}
  catch(e){setError('Yayından kaldırma başarısız.');}finally{setBusy(false);}
 }
 if(!admin)return <div className="rounded-xl border border-border bg-card p-8"><ShieldAlert/><h1 className="mt-3 text-xl font-bold">İhale yayın yönetimi</h1><p className="mt-2 text-sm text-muted-foreground">Bu alan yalnızca yetkili yöneticiye açıktır.</p></div>;
 return <div className="mx-auto max-w-7xl space-y-5 pb-10">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-amber-700">Atlas Endüstri Ağı · Kaynak denetimi</p><h1 className="mt-1 text-2xl font-black">İhale yayını kontrol merkezi</h1><p className="mt-2 text-sm text-muted-foreground">Fırsat Radarı'ndan gelen taslaklar önce doğrulanır. Yalnızca seçilen ilanların özet bilgileri kamuya açılır.</p></div><div className="flex gap-2"><button onClick={load} className="rounded-lg border border-border bg-card px-3 py-2 text-sm"><RefreshCw size={16} className="mr-1 inline"/>Yenile</button><a href="/ihaleler" target="_blank" rel="noreferrer" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">Canlı panoya git</a></div></div>
  <div className="grid gap-3 sm:grid-cols-3">{[['Araştırılan fırsat',list.filter(x=>!x.is_demo).length],['Yayımlanan',published],['Doğrulama bekleyen',awaiting]].map(([name,value])=><div key={name} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{name}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div>
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert size={17} className="mr-1 inline"/>Bir ilanı yayımlamak, Atlas'ın ihaleye katılmaya yetkili olduğunu veya ilanın hâlen açık kaldığını göstermez. İlan numarası, resmî metin, tarih, zeyilname/iptal ve şartnameyi yayın öncesi ve periyodik olarak kontrol edin.</div>
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}{notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
  <div className="grid gap-5 lg:grid-cols-3">
   <div className="space-y-2">{loading&&<p className="text-sm text-muted-foreground">Yükleniyor...</p>}{list.map(x=><button key={x.id} type="button" onClick={()=>select(x.id)} className={'block w-full rounded-xl border p-3 text-left '+(x.id===selected?'border-amber-400 bg-amber-50':'border-border bg-card')}><strong className="block text-sm">{x.title}</strong><span className="mt-2 block text-xs text-muted-foreground">{x.notice_reference||'Referans yok'} · {x.city||'Bölge belirsiz'}</span><span className={'mt-2 inline-block rounded-full px-2 py-1 text-xs font-bold '+(x.public_visible?'bg-emerald-100 text-emerald-900':'bg-slate-100 text-slate-600')}>{x.is_demo?'TEST':x.public_visible?'Yayında':'Araştırma / taslak'}</span></button>)}</div>
   <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
    {!current?<p className="text-sm text-muted-foreground">Henüz fırsat kaydı yok. Proje kontrol merkezinden araştırma kaydı ekleyebilirsiniz.</p>:<>
    <h2 className="text-lg font-bold">Halka açık ilan bilgileri</h2>
    <p className="mt-2 text-sm text-muted-foreground">İKN: {current.notice_reference||'Eksik'} · Kaynak: {current.source_platform}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-bold sm:col-span-2">İlan başlığı<input className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm" value={form.title||''} maxLength={230} onChange={e=>setForm(x=>({...x,title:e.target.value}))}/></label>
      <label className="text-xs font-bold sm:col-span-2">Kamuya açık kısa özet<textarea className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm" value={form.public_summary||''} rows={3} maxLength={600} onChange={e=>setForm(x=>({...x,public_summary:e.target.value}))}/></label>
      <label className="text-xs font-bold sm:col-span-2">Resmî kaynak bağlantısı (HTTPS)<input className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm" type="url" value={form.official_source_url||''} onChange={e=>setForm(x=>({...x,official_source_url:e.target.value}))}/></label>
      <label className="text-xs font-bold">İhale/son teklif tarihi<input className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm" type="date" value={form.deadline||''} onChange={e=>setForm(x=>({...x,deadline:e.target.value}))}/></label>
      <label className="text-xs font-bold">Türkiye yerel saati<input className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm" type="time" value={form.deadline_time||''} onChange={e=>setForm(x=>({...x,deadline_time:e.target.value}))}/></label>
      <label className="text-xs font-bold">Şehir<input className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm" value={form.city||''} onChange={e=>setForm(x=>({...x,city:e.target.value}))}/></label>
      <label className="text-xs font-bold">Sektör<input className="mt-1 block w-full rounded-lg border border-border bg-background p-3 text-sm" value={form.industry||''} onChange={e=>setForm(x=>({...x,industry:e.target.value}))}/></label>
    </div>
    <p className="mt-3 text-xs text-muted-foreground">Yayın kontrolü: {valid?'Temel alanlar mevcut; resmî belgenin güncelliğini ayrıca doğrulayın.':'Yayın için İKN, tarih ve saat, resmî adres ve açıklama gereklidir.'}</p>
    <div className="mt-5 flex flex-wrap gap-2"><button disabled={busy} onClick={()=>save(false)} className="rounded-lg border border-border px-4 py-3 text-xs font-bold">Taslağı kaydet</button><button disabled={busy||!valid} onClick={()=>save(true)} className="rounded-lg bg-emerald-700 px-4 py-3 text-xs font-bold text-white disabled:opacity-40"><CheckCircle2 size={14} className="mr-1 inline"/>Kaynak doğrulandı — yayımla</button><button disabled={busy||!current.public_visible} onClick={unpublish} className="rounded-lg border border-red-300 px-4 py-3 text-xs font-bold text-red-700 disabled:opacity-40">Yayından kaldır</button></div>
    {safeLink(form.official_source_url)&&<a href={safeLink(form.official_source_url)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-700 underline">Resmî kaynağı incele <ExternalLink size={13}/></a>}
    </>}
   </div>
  </div>
 </div>;
}
