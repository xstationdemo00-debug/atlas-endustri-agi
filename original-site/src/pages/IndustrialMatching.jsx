import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Building2, Factory, Filter, MapPin, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { rankManufacturingMatches, CAPABILITY_LABELS, FAMILY_LABELS } from '@/lib/industrialMatching';

export default function IndustrialMatching(){
  const {user}=useAuth();
  const isAdmin=user?.role==='admin';
  const [items,setItems]=useState([]);
  const [selected,setSelected]=useState('');
  const [same,setSame]=useState(true);
  const [city,setCity]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  async function load(){
    if(!isAdmin){setLoading(false);return;}
    setLoading(true);setError('');
    try{
      const data=await base44.entities.B2BProspect.list('-created_date',200);
      const list=Array.isArray(data)?data:data?.items||[];
      setItems(list);
      setSelected(prev=>list.some(x=>x.id===prev)?prev:list[0]?.id||'');
    }catch(e){setError('Firma adayları yüklenemedi. Yönetici erişimini kontrol edin.');}
    finally{setLoading(false);}
  }
  useEffect(()=>{load();},[isAdmin]);
  const source=items.find(x=>x.id===selected);
  const matches=useMemo(()=>source?rankManufacturingMatches(source,items,{requireSameFamily:same,city,limit:50}):[],[items,source,same,city]);
  if(!isAdmin)return <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8"><ShieldAlert className="text-amber-600"/><h1 className="mt-3 text-xl font-bold">Firma eşleştirme yönetimi</h1><p className="mt-2 text-sm text-muted-foreground">Araştırma aşamasındaki firma adayları yalnızca yetkili ekibin erişimine açıktır. Doğrulanmış kurum eşleştirmesi pilot genişlemesiyle sunulacaktır.</p><Link className="mt-5 inline-block text-sm font-bold text-amber-700 underline" to="/hizmetler">B2B hizmet talebi bırak</Link></div>;
  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Atlas Endüstri Ağı · İç operasyon</p><h1 className="mt-1 text-2xl font-extrabold">Üretim benzerliği ile firma eşleştirme</h1><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Önce aynı veya benzer imalat, sonra tamamlayıcı üretim. Eşleşme bir öneridir; müşteri onayı, kapasite ve kalite belgesi doğrulaması değildir.</p></div>
      <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold"><RefreshCw size={15}/> Yenile</button>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Araştırılan firma adayı</p><p className="mt-2 text-3xl font-black">{items.filter(x=>!x.is_demo).length}</p></div>
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Seçili firma için eşleşme</p><p className="mt-2 text-3xl font-black">{matches.length}</p></div>
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Doğrulanmış işbirliği</p><p className="mt-2 text-3xl font-black">{items.filter(x=>x.cooperation_opt_in&&x.verification_level==='platform_verified').length}</p></div>
    </div>
    {error&&<div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-2"><Filter size={17}/><h2 className="font-bold">Eşleştirme koşulları</h2></div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-bold">Kaynak firma
          <select className="mt-2 block w-full rounded-lg border border-border bg-background p-3 text-sm font-normal" value={selected} onChange={e=>setSelected(e.target.value)} disabled={loading}>
            {items.filter(x=>!x.is_demo).map(x=><option key={x.id} value={x.id}>{x.company_name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold">Bölge filtresi
          <select className="mt-2 block w-full rounded-lg border border-border bg-background p-3 text-sm font-normal" value={city} onChange={e=>setCity(e.target.value)}>
            <option value="">Türkiye geneli</option><option>Ankara</option><option>Bursa</option><option>Kocaeli</option><option>İstanbul</option>
          </select>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm font-semibold">
          <input type="checkbox" checked={same} onChange={e=>setSame(e.target.checked)} className="h-4 w-4"/>
          Önce aynı üretim ailesi
        </label>
      </div>
      {source&&<div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground"><Factory size={16}/><span><strong>{source.company_name}</strong> · {FAMILY_LABELS[source.manufacturing_family]||'Üretim bilgisi sınırlı'} · {(source.capability_tags||[]).map(x=>CAPABILITY_LABELS[x]||x).join(', ')}</span></div>}
    </div>
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"><ShieldAlert size={17} className="mr-2 inline"/>Bu listede yalnızca kamuya açık kaynaklardan araştırılmış firmalar bulunuyor. Bu firmalar Atlas Endüstri Ağı'na kayıt olmuş, işbirliğini kabul etmiş veya üretim kapasitesini teyit etmiş değildir. Ticari ileti ve eşleştirme öncesinde ayrıca izin ve uygunluk kontrolü yapılmalıdır.</div>
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2"><Sparkles size={19} className="text-amber-600"/><h2 className="text-lg font-bold">Benzer imalat adayları</h2></div>
      {loading&&<p className="text-sm text-muted-foreground">Araştırılan firmalar yükleniyor...</p>}
      {!loading&&matches.length===0&&<div className="rounded-xl border border-dashed border-border bg-card p-7 text-center text-sm text-muted-foreground">Bu üretim/bölge koşullarında doğrulanabilir ortak süreç eşleşmesi bulunamadı. Filtreleri değiştirebilir veya yeni firmalar araştırabiliriz.</div>}
      <div className="grid gap-3 lg:grid-cols-2">
        {matches.map(({company,match})=><article className="rounded-xl border border-border bg-card p-5 shadow-sm" key={company.id}>
          <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-bold">{company.company_name}</h3><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={13}/>{company.city||'Bölge belirtilmedi'} · {match.category}</p></div><span className="h-fit rounded-full bg-muted px-3 py-1 text-sm font-extrabold">{match.score}/100</span></div>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">Eşleşme gerekçesi</p>
          <ul className="mt-2 space-y-1 text-sm">{match.reasons.map((reason,i)=><li key={i}>• {reason}</li>)}</ul>
          <p className="mt-3 border-t border-border pt-3 text-xs text-amber-700">İlk tarama · Üretim kapasitesi ve ortaklık isteği teyit edilmedi.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">
            {company.source_url&&<a href={company.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-amber-700 underline">Resmî bilgi kaynağı <ArrowUpRight size={12}/></a>}
            {company.phone&&<a href={'tel:'+String(company.phone).replace(/[^\d+]/g,'')} className="underline">Firma telefonu</a>}
          </div>
        </article>)}
      </div>
    </section>
  </div>;
}
