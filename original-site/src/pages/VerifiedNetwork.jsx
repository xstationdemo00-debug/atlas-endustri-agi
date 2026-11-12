import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Factory, RefreshCw, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { rankManufacturingMatches, CAPABILITY_LABELS, FAMILY_LABELS } from '@/lib/industrialMatching';

export default function VerifiedNetwork(){
 const {user}=useAuth();
 const [companies,setCompanies]=useState([]);
 const [selected,setSelected]=useState('');
 const [same,setSame]=useState(true);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const load=async()=>{
   setLoading(true);setError('');
   try{
     const response=await base44.functions.invoke('verifiedPartnerDirectory',{});
     const data=response?.data||response;
     if(!data?.ok)throw new Error(data?.error||'Onaylı ağ şu an kullanılamıyor.');
     const rows=Array.isArray(data.companies)?data.companies:[];
     setCompanies(rows);setSelected(prev=>rows.some(x=>x.id===prev)?prev:rows[0]?.id||'');
   }catch(e){setError('Doğrulanmış firma ağı getirilemedi. Giriş yetkinizi veya bağlantınızı kontrol edin.');}
   finally{setLoading(false);}
 };
 useEffect(()=>{if(user?.id)load();},[user?.id]);
 const source=companies.find(x=>x.id===selected);
 const matches=useMemo(()=>source?rankManufacturingMatches(source,companies,{requireSameFamily:same,limit:25}):[],[source,companies,same]);
 return <div className="mx-auto max-w-6xl space-y-5">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-amber-700">Atlas Endüstri Ağı</p><h1 className="mt-1 text-2xl font-extrabold">Doğrulanmış üretici ağı</h1><p className="mt-2 text-sm text-muted-foreground">Benzer imalat kabiliyetleri üzerinden, paylaşım izni vermiş firmalara yönelik B2B eşleştirme.</p></div><button type="button" onClick={load} className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold"><RefreshCw size={16} className="mr-2 inline"/>Yenile</button></div>
   <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Onaylı ve işbirliği paylaşımı açık firma</p><p className="mt-2 text-3xl font-black">{companies.length}</p></div>
   <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><ShieldAlert size={17} className="mr-2 inline"/>Yalnızca yönetici tarafından doğrulanmış ve üretim bilgilerini paylaşmaya izin vermiş kayıtlar görünür. İşbirliği veya boş üretim kapasitesi garanti edilmez. Araştırma aşamasındaki firma listesi burada paylaşılmaz.</div>
   {error&&<p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">{error}</p>}
   {loading&&<p className="text-sm text-muted-foreground">Firmalar yükleniyor...</p>}
   {!loading&&companies.length===0&&<div className="rounded-xl border border-dashed border-border bg-card p-7"><h2 className="font-bold">Henüz onaylı işbirliği üyesi bulunmuyor</h2><p className="mt-2 text-sm text-muted-foreground">Firma profilinizde üretim kabiliyetlerinizi kaydedin ve işbirliği paylaşım tercihinizi seçin. Yetkili doğrulamasının ardından katılımcılarla eşleştirme başlayacaktır.</p><Link className="mt-4 inline-block text-sm font-bold text-amber-700 underline" to="/firmalar">Firma profilimi aç</Link></div>}
   {companies.length>0&&<div className="rounded-xl border border-border bg-card p-5"><h2 className="font-bold">Eşleştirme</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="text-sm font-semibold">Firmanızı seçin<select className="mt-1 block w-full rounded-md border border-border bg-background p-3 text-sm" value={selected} onChange={e=>setSelected(e.target.value)}>{companies.map(x=><option key={x.id} value={x.id}>{x.company_name}</option>)}</select></label><label className="flex items-center gap-2 self-end rounded-lg border border-border px-3 py-3 text-sm"><input type="checkbox" checked={same} onChange={e=>setSame(e.target.checked)}/> Aynı üretim ailesine öncelik ver</label></div>{source&&<p className="mt-3 text-xs text-muted-foreground">{FAMILY_LABELS[source.manufacturing_family]||source.manufacturing_family||'Üretim ailesi bilinmiyor'} · {(source.capability_tags||[]).map(x=>CAPABILITY_LABELS[x]||x).join(', ')}</p>}</div>}
   {companies.length>0&&<section className="grid gap-3 md:grid-cols-2">{matches.map(({company,match})=><article key={company.id} className="rounded-xl border border-border bg-card p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">{company.company_name}</h3><p className="mt-1 text-xs text-muted-foreground">{company.city} · {match.category}</p></div><span className="rounded-lg bg-muted px-2 py-1 text-sm font-black">{match.score}/100</span></div><ul className="mt-3 space-y-1 text-sm">{match.reasons.map((reason,i)=><li key={i} className="flex gap-1.5"><CheckCircle2 size={15} className="mt-1 shrink-0 text-emerald-600"/>{reason}</li>)}</ul><p className="mt-3 text-xs text-amber-700">Gerçek iş paketi için belge, kapasite ve termin teyidi gerekir.</p></article>)}</section>}
   {companies.length>0&&matches.length===0&&<p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">Bu koşullarda eşleşme bulunamadı. Üretim ailesi filtresini kaldırabilir veya firma profil bilgilerinizi güncelleyebilirsiniz.</p>}
 </div>;
}
