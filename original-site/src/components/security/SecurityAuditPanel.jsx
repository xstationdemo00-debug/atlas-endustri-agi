import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardList, RefreshCw, ShieldAlert } from 'lucide-react';

const ACTIONS={
  company_member_invited:'Firma üyeliği daveti',
  offer_accept:'Teklif kabul kararı',
  offer_reject:'Teklif ret kararı',
  offer_shortlist:'Teklif kısa liste kararı',
};
const formatDate=(value)=>{
  if(!value)return 'Tarih yok';
  const d=new Date(value);
  return Number.isFinite(d.getTime())?d.toLocaleString('tr-TR',{dateStyle:'short',timeStyle:'short'}):'Tarih belirtilmedi';
};
export default function SecurityAuditPanel(){
 const [events,setEvents]=useState([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const reload=async()=>{
  setLoading(true);setError('');
  try{
    const result=await base44.entities.SecurityAuditEvent.list('-created_date',60);
    setEvents(Array.isArray(result)?result:result?.items||[]);
  }catch(e){setError('Güvenlik işlem kayıtları okunamadı. Yetkileri ve bağlantıyı kontrol edin.');}
  finally{setLoading(false);}
 };
 useEffect(()=>{reload();},[]);
 return (
  <section className="rounded-xl border border-border bg-card p-5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h2 className="flex items-center gap-2 text-base font-extrabold"><ClipboardList size={18}/> Kritik işlem kayıtları</h2>
    <button type="button" onClick={reload} disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-40">
      <RefreshCw size={14}/>{loading?'Yükleniyor':'Yenile'}
    </button>
   </div>
   <p className="mt-2 text-xs leading-5 text-muted-foreground">
    Firma üyesi davetleri ve sunucuda yetkilendirilmiş teklif kararları kaydedilir.
    Yalnızca yönetici görebilir. Bu ilk sürüm tüm olayları izlemez;
    kayıtlar değiştirilemez nitelikte adli kayıt sistemi değildir.
   </p>
   {error&&<p role="alert" className="mt-3 text-xs text-rose-700">{error}</p>}
   {!loading&&!error&&!events.length&&
     <p className="mt-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
       Henüz kaydedilmiş kritik işlem yok. Bu durum geçmişte hiç işlem yapılmadığını kanıtlamaz.
     </p>}
   {events.length>0&&(
    <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-border">
     <table className="w-full min-w-[560px] text-left text-xs">
      <thead className="sticky top-0 bg-muted/80">
       <tr><th className="px-3 py-2">Zaman</th><th className="px-3 py-2">İşlem</th><th className="px-3 py-2">Sonuç</th><th className="px-3 py-2">Referans</th></tr>
      </thead>
      <tbody>
       {events.map(row=>(
        <tr key={row.id} className="border-t border-border">
         <td className="px-3 py-2 whitespace-nowrap">{formatDate(row.occurred_at||row.created_date)}</td>
         <td className="px-3 py-2">{ACTIONS[row.action]||row.action}</td>
         <td className="px-3 py-2">{row.outcome==='success'?'Tamamlandı':row.outcome||'—'}</td>
         <td className="px-3 py-2 font-mono">{row.resource_type} · {String(row.resource_id||'').slice(0,10)}…</td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   )}
   <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
    <ShieldAlert className="mt-0.5 shrink-0" size={13}/>
    Hesap güvenliği, şüpheli giriş ve veri yedekleme için Base44 platform kayıtları ve bağımsız denetim altyapısı da gereklidir.
   </p>
  </section>
 );
}
