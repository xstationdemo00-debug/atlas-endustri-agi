import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle2, ClipboardList, Mail, PhoneCall, RefreshCw, ShieldAlert } from 'lucide-react';

const CAT={platform_help:'Platform / teknik',project_process:'Proje süreci',supplier_matching:'Tedarik / eşleştirme',offer_contract:'Teklif / sözleşme',membership:'Üyelik / firma',international:'Uluslararası',billing:'Pilot hizmet / ücret',other:'Diğer'};
const STATES=[['new','Yeni'],['triaging','İnceleniyor'],['awaiting_details','Bilgi bekleniyor'],['referred','Uzman desteği değerlendiriliyor'],['resolved','Yanıtlandı / çözüldü'],['closed','Kapatıldı']];
const GROUPS=[['platform','Platform yönetimi'],['commercial','Ticari ve proje'],['technical_partner','Teknik uzman (ileride)'],['legal_partner','Hukuk uzmanı (ileride)'],['finance_partner','Mali müşavir (ileride)']];
const escapeMail=(s)=>encodeURIComponent(s||'');
export default function SupportDesk(){
 const {user}=useAuth();
 const isAdmin=user?.role==='admin';
 const [tickets,setTickets]=useState([]);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [filter,setFilter]=useState('open');
 const [notes,setNotes]=useState({});
 async function load(){
  if(!isAdmin){setLoading(false);return;}
  setLoading(true);setError('');
  try{
    const response=await base44.entities.SupportTicket.list('-created_date',200);
    const list=Array.isArray(response)?response:response?.items||[];
    setTickets(list);
  }catch(e){setError('Destek kayıtları yüklenemedi. Yönetici yetkisini kontrol edin.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{load();},[user?.id,isAdmin]);
 async function update(ticket,patch){
  setBusy(true);setError('');setNotice('');
  try{await base44.entities.SupportTicket.update(ticket.id,patch);await load();setNotice('Destek kaydı güncellendi. Bu işlem kendiliğinden müşteriye e-posta göndermez.');}
  catch(e){setError('Güncelleme başarısız.');}
  finally{setBusy(false);}
 }
 const filtered=tickets.filter(t=>{
   if(t.is_demo)return filter==='demo';
   if(filter==='open')return !['closed','resolved'].includes(t.status);
   if(filter==='callback')return t.callback_requested&&!['closed','resolved'].includes(t.status);
   if(filter==='closed')return ['closed','resolved'].includes(t.status);
   return filter==='all';
 });
 const counts={open:tickets.filter(t=>!t.is_demo&&!['closed','resolved'].includes(t.status)).length,callback:tickets.filter(t=>!t.is_demo&&t.callback_requested&&!['closed','resolved'].includes(t.status)).length,all:tickets.filter(t=>!t.is_demo).length,demo:tickets.filter(t=>t.is_demo).length};
 if(!isAdmin)return <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8"><ShieldAlert/><h1 className="mt-3 text-xl font-bold">Destek talepleri yönetimi</h1><p className="mt-2 text-sm text-muted-foreground">İletişim bilgilerini yalnızca yetkili yönetici görebilir.</p></div>;
 return <div className="mx-auto max-w-7xl space-y-5">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-extrabold uppercase text-amber-700">Atlas Endüstri Ağı · Destek operasyonu</p><h1 className="mt-1 text-2xl font-black">Destek talepleri</h1><p className="mt-2 text-sm text-muted-foreground">Önce dijital rehber, sonra kayıtlı değerlendirme; gerekli durumda randevulu görüşme. Uzman partnerlere otomatik iletim yapılmaz.</p></div><button onClick={load} className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold"><RefreshCw size={16} className="mr-1 inline"/>Yenile</button></div>
   <div className="grid gap-3 sm:grid-cols-4">
   {[['Açık',counts.open],['Geri arama isteyen',counts.callback],['Gerçek destek kayıtları',counts.all],['Test kayıtları',counts.demo]].map(([k,v])=><div key={k} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-2 text-3xl font-black">{v}</p></div>)}
   </div>
   <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><ShieldAlert size={16} className="mr-1 inline"/>Şu anda ayrı destek personeli veya 7/24 çağrı merkezi yok. Teknik, hukuki veya mali uzman ataması gerçekte sözleşmeli bir uzman olmadığı sürece yapılmış sayılmaz. Yanıt ve geri arama süresi garanti edilmiyor.</div>
   <div className="flex flex-wrap gap-2">{[['open','Açık'],['callback','Geri arama'],['closed','Yanıtlanan/kapalı'],['all','Tüm gerçek'],['demo','Test kayıtları']].map(([v,label])=><button key={v} type="button" onClick={()=>setFilter(v)} className={'rounded-lg border px-3 py-2 text-xs font-bold '+(v===filter?'bg-slate-950 text-white':'bg-card')}>{label}</button>)}</div>
   {notice&&<p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
   {error&&<p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
   {loading&&<p className="text-sm text-muted-foreground">Yükleniyor...</p>}
   {!loading&&filtered.length===0&&<div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Bu filtrede destek kaydı bulunmuyor.</div>}
   <div className="grid gap-3">{filtered.map(t=><article key={t.id} className="rounded-xl border border-border bg-card p-5">
    <div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold text-amber-700">{t.ticket_code||'Destek talebi'} · {CAT[t.category]||t.category}</p><h2 className="mt-1 text-base font-bold">{t.subject}</h2><p className="mt-1 text-xs text-muted-foreground">{t.company_name||t.name} · {t.created_date?new Date(t.created_date).toLocaleString('tr-TR'):'Tarih yok'}</p></div><span className="h-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold">{STATES.find(x=>x[0]===t.status)?.[1]||t.status}</span></div>
    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-muted-foreground">{t.description}</p>
    <div className="mt-4 flex flex-wrap gap-3 border-t pt-3 text-sm">
      <a className="inline-flex items-center gap-1 font-semibold text-amber-700 underline" href={'mailto:'+t.contact_email+'?subject='+escapeMail('Atlas Endüstri Ağı · '+(t.ticket_code||'Destek talebi')+' · '+t.subject)}><Mail size={14}/>E-posta yanıtı hazırla</a>
      {t.phone&&<span className="inline-flex items-center gap-1"><PhoneCall size={14}/>{t.phone}{t.callback_requested?' · Geri arama istiyor':''}</span>}
    </div>
    <div className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2">
     <label className="text-xs font-bold">İşlem durumu<select disabled={busy} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm" value={t.status||'new'} onChange={e=>update(t,{status:e.target.value})}>{STATES.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label>
     <label className="text-xs font-bold">Sorumlu alan<select disabled={busy} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm" value={t.assigned_group||'platform'} onChange={e=>update(t,{assigned_group:e.target.value})}>{GROUPS.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label>
     <form className="md:col-span-2" onSubmit={e=>{e.preventDefault();update(t,{internal_note:notes[t.id]??t.internal_note??''});}}>
      <label className="block text-xs font-bold">İç değerlendirme notu (müşteriye otomatik gönderilmez)<textarea rows={2} maxLength={2500} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm" value={notes[t.id]??t.internal_note??''} onChange={e=>setNotes(x=>({...x,[t.id]:e.target.value}))}/></label>
      <button disabled={busy} className="mt-2 rounded-md border border-border px-3 py-2 text-xs font-bold">Notu kaydet</button>
     </form>
    </div>
   </article>)}</div>
  </div>;
}
