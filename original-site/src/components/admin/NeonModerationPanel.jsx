import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// The checklists are also enforced in SQL, not just by this interface.
const CHECKS={
  Company:[['identity_checked','Kurumsal kimlik doğrulandı'],['registration_checked','Vergi / ticari tescil belgesi incelendi']],
  Project:[['scope_checked','İşin gerçek kapsamı yazılı doğrulandı'],['technical_checked','Teknik veriler ve firma yetkisi doğrulandı']],
  WorkRequest:[['legal_model_checked','İşin yasal faaliyet modeli incelendi'],['safety_checked','İSG / SGK gereklilikleri kontrol edildi'],
    ['written_terms_checked','Ücret, süre ve sözleşme şartları yazılı kontrol edildi'],
    ['no_unlicensed_placement','İzinsiz personel aracılığı faaliyeti bulunmadığı doğrulandı']],
};
const LABELS={Company:'Firma',Project:'Proje',WorkRequest:'İş talebi'};
export default function NeonModerationPanel(){
 const {user}=useAuth()||{};
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const [busy,setBusy]=useState(null),[notes,setNotes]=useState({}),[checks,setChecks]=useState({});
 const load=useCallback(async()=>{
   setLoading(true);setError('');
   try{
     const result=await base44.functions.invoke('adminReviewQueue',{});
     if(!Array.isArray(result))throw new Error('Bekleyen kayıtlar alınamadı.');
     setItems(result);
   }catch(e){setItems([]);setError(e.message||'Yönetici kayıtları alınamadı.');}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{if(user?.role==='admin')void load();},[user?.id,user?.role,load]);
 const toggle=(id,key,value)=>setChecks(prev=>({...prev,[id]:{...(prev[id]||{}),[key]:value}}));
 const decision=async(row,action)=>{
   setBusy(row.id);setError('');
   try{
     await base44.functions.invoke('adminModerateRecord',{
       record_id:row.id,decision:action,checks:checks[row.id]||{},note:(notes[row.id]||'').trim()
     });
     await load();
   }catch(e){setError(e.message||'Yönetici incelemesi tamamlanamadı.');}
   finally{setBusy(null);}
 };
 if(user?.role!=='admin')return null;
 return <section className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-4" aria-label="Atlas Neon onay kuyruğu">
   <header>
    <h2 className="font-heading text-base font-bold">Firma · Proje · İş Talebi Onay Kuyruğu</h2>
    <p className="text-xs text-muted-foreground mt-1">
      Bu işlemler Neon Auth yöneticisi tarafından sunucuda denetlenir. Belge kontrolü yapılmadan kayıt yayımlanamaz.
      Eski Base44 kayıtları bu kuyruğa otomatik alınmaz.
    </p>
    <button type="button" onClick={load} className="mt-2 rounded border px-3 py-1.5 text-xs" disabled={loading||!!busy}>Listeyi yenile</button>
   </header>
   {error&&<p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
   {loading?<p className="text-sm">Kayıtlar alınıyor...</p>:items.length===0?
     <p className="text-sm text-muted-foreground">İnceleme bekleyen yeni kayıt bulunmuyor.</p>:
     <div className="space-y-3">{items.map(row=>{
       const required=CHECKS[row.entity_type]||[],confirmed=checks[row.id]||{};
       const note=(notes[row.id]||'').trim();
       const ready=note.length>=20&&required.every(([key])=>confirmed[key]===true);
       return <article key={row.id} className="rounded-lg border border-border p-3 space-y-2">
         <div className="flex flex-wrap items-center justify-between gap-2">
           <h3 className="text-sm font-bold">{LABELS[row.entity_type]||row.entity_type}: {row.name||'İsimsiz kayıt'}</h3>
           <span className="rounded bg-muted px-2 py-1 text-xs">{row.status}</span>
         </div>
         <p className="text-xs text-muted-foreground">{row.city||'Şehir belirtilmedi'} · {row.description||'Kapsam açıklaması yok'}</p>
         {row.entity_type==='Company' && <p className="text-xs">Vergi kayıt sonu: {String(row.tax_number||'').length>=4?'••••'+String(row.tax_number).slice(-4):'Belirtilmemiş'}</p>}
         <fieldset className="space-y-2">
           <legend className="text-xs font-semibold">Yayın öncesi zorunlu kontroller</legend>
           {required.map(([key,label])=><label key={key} className="flex gap-2 items-start text-xs">
             <input type="checkbox" checked={confirmed[key]===true} onChange={e=>toggle(row.id,key,e.target.checked)}/>
             <span>{label}</span>
           </label>)}
         </fieldset>
         <label className="block text-xs font-medium">İnceleme gerekçesi (en az 20 karakter)
          <textarea value={notes[row.id]||''} onChange={e=>setNotes(prev=>({...prev,[row.id]:e.target.value}))}
            rows={2} maxLength={1000} className="mt-1 block w-full rounded border bg-background p-2 text-sm" placeholder="Kontrol edilen belgeleri ve karar gerekçesini yazın"/>
         </label>
         <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy===row.id||!ready}
             onClick={()=>decision(row,'approve')} className="rounded bg-slate-900 text-white px-3 py-2 text-xs disabled:opacity-50">Kontroller tamamlandı · Onayla</button>
          <button type="button" disabled={busy===row.id||note.length<20}
             onClick={()=>decision(row,'reject')} className="rounded border border-red-400 px-3 py-2 text-xs text-red-800 disabled:opacity-50">Gerekçeyle reddet</button>
         </div>
       </article>;
     })}</div>
   }
 </section>;
}
