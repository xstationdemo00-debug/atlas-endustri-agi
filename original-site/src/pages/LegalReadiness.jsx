import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, ClipboardCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
const STATUSES=[['todo','Yapılacak'],['in_review','Uzman incelemesi'],['in_progress','Üzerinde çalışılıyor'],['done','Belgesiyle tamamlandı'],['not_applicable','Gerekli değil (gerekçeli)']];
const PRIORITIES={critical:'Kritik',high:'Yüksek',normal:'Orta'};
export default function LegalReadiness(){
 const {user}=useAuth();
 const admin=user?.role==='admin';
 const [rows,setRows]=useState([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 async function load(){
  if(!admin)return;
  setError('');
  try{const result=await base44.entities.LaunchComplianceTask.list('priority',100);setRows(Array.isArray(result)?result:result?.items||[]);}
  catch(e){setError('Yasal hazırlık kayıtları yüklenemedi.');}
 }
 useEffect(()=>{load();},[admin,user?.id]);
 async function update(item,field,value){
  if(!admin||busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   await base44.entities.LaunchComplianceTask.update(item.id,{[field]:value});
   await load();
   setNotice('Yasal hazırlık kaydı güncellendi. Bu işlem resmî başvuru veya uzman onayı oluşturmaz.');
  }catch(e){setError('Kayıt güncellenemedi.');}
  finally{setBusy(false);}
 }
 if(!admin)return <div className="rounded-xl border bg-card p-8"><ShieldAlert/><h1 className="mt-4 font-bold">Yasal hazırlık yönetimi</h1><p className="mt-2 text-sm text-muted-foreground">Bu bölüm yalnızca sistem yöneticisine açıktır.</p></div>;
 const done=rows.filter(x=>x.status==='done').length;
 const pendingCritical=rows.filter(x=>x.priority==='critical'&&x.status!=='done').length;
 return <div className="mx-auto max-w-7xl space-y-5">
  <header><p className="text-xs font-bold uppercase text-amber-700">Atlas Endüstri Ağı · Kurumsal hazırlık</p><h1 className="mt-1 text-2xl font-black">Pilot Lansman ve Yasal Hazırlık</h1><p className="mt-2 text-sm text-muted-foreground">İşletme, vergi, sözleşme, KVKK, İYS ve proje taahhüdüne geçiş hazırlıklarını kaynaklarıyla yönetir.</p></header>
  <div className="grid gap-3 sm:grid-cols-3">{[['Toplam hazırlık',rows.length],['Belgesiyle tamamlanan',done],['Kritik açık konu',pendingCritical]].map(([name,count])=><div key={name} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{name}</p><p className="mt-2 text-3xl font-black">{count}</p></div>)}</div>
  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert size={18} className="mr-2 inline"/>Web sitesinin yayında olması, işletme tescili, vergi kaydı, İŞKUR izni, sigorta, ihaleye katılım veya ticari hizmet yetkisi anlamına gelmez. Ücretli sözleşme ve tahsilat öncesi ilgili kritik maddeler fiilen tamamlanmalı; burada kutuyu işaretlemek tek başına yeterli değildir.</div>
  <div className="flex flex-wrap justify-between gap-3"><Link to="/hizmetler" className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-semibold">Pilot hizmet sayfası <ArrowUpRight size={15}/></Link><button onClick={load} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-semibold"><RefreshCw size={16}/> Yenile</button></div>
  {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
  {notice&&<p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
  <div className="space-y-3">{rows.map(item=><article className="rounded-xl border bg-card p-4 sm:p-5" key={item.id}>
   <div className="flex flex-wrap items-start justify-between gap-3"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-wide text-amber-700">{item.category} · {PRIORITIES[item.priority]||item.priority} öncelik</p><h2 className="mt-1 text-base font-bold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></div><span className={'rounded-full px-3 py-1 text-xs font-bold '+(item.status==='done'?'bg-emerald-100 text-emerald-900':'bg-muted')}>{STATUSES.find(x=>x[0]===item.status)?.[1]||'Yapılacak'}</span></div>
   <div className="mt-4 flex flex-wrap gap-3 text-xs"><span>Sorumlu uzman: {item.responsible||'Atanmadı'}</span>{item.blocks_paid_operations&&<span className="font-bold text-amber-700">Ücretli operasyon ön koşulu</span>}{item.official_url&&<a href={item.official_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-amber-700 underline">Resmî kaynak <ArrowUpRight size={12}/></a>}</div>
   <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2"><label className="text-xs font-bold">Hazırlık durumu<select className="mt-1 block w-full rounded-md border bg-background p-2 text-sm" disabled={busy} value={item.status||'todo'} onChange={e=>update(item,'status',e.target.value)}>{STATUSES.map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label><form className="md:col-span-2" onSubmit={e=>{e.preventDefault();update(item,'notes',e.currentTarget.elements.note.value);}}><label className="text-xs font-bold">İnceleme notu<textarea name="note" key={item.id+'-'+item.updated_date} defaultValue={item.notes||''} rows={2} maxLength={2500} className="mt-1 block w-full rounded-md border bg-background p-2 text-sm" placeholder="Belge, uzman görüşü, başvuru numarası ve tarih..."/></label><button disabled={busy} className="mt-2 rounded-lg border px-3 py-2 text-xs font-bold">Notu kaydet</button></form></div>
  </article>)}</div>
  {rows.length===0&&!error&&<p className="rounded-xl border p-6 text-sm text-muted-foreground">Yasal hazırlık kaydı bulunamadı.</p>}
 </div>;
}
