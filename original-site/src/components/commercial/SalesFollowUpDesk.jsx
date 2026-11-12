import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CalendarCheck2, ClipboardCheck, Inbox, RefreshCw, ShieldAlert } from 'lucide-react';

const WORKFLOW=['contacted','replied','qualified','proposal_sent','won','lost'];
const REPLY_KINDS=[
 ['interested','İlgilendi / görüşmek istiyor'],
 ['needs_details','Ek teknik bilgi istedi'],
 ['not_now','Şu an gündeminde değil'],
 ['declined','İlgilenmediğini belirtti'],
 ['other','Diğer gerçek yanıt']
];
const getToday=()=>{
 const d=new Date();
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
};
const formatDate=v=>{
 if(!v)return 'Belirlenmedi';
 const d=new Date(v);
 return Number.isFinite(d.getTime())?d.toLocaleDateString('tr-TR'):'Belirlenmedi';
};
const EMPTY={next_action:'',next_action_date:'',reply_kind:'',reply_evidence_ref:'',last_reply_summary:''};

export default function SalesFollowUpDesk({prospects=[],onChange}){
 const [selectedId,setSelectedId]=useState('');
 const [form,setForm]=useState(EMPTY);
 const [proof,setProof]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [success,setSuccess]=useState('');
 const [showAll,setShowAll]=useState(false);
 const relevant=useMemo(()=>prospects.filter(p=>!p.is_demo&&WORKFLOW.includes(p.stage))
   .sort((a,b)=>{
    const aa=a.next_action_date||'9999-12-31',bb=b.next_action_date||'9999-12-31';
    return aa.localeCompare(bb)||String(b.last_contacted_at||'').localeCompare(String(a.last_contacted_at||''));
   }),[prospects]);
 const today=getToday();
 const summary={
   contacted:relevant.filter(x=>x.stage==='contacted').length,
   replied:relevant.filter(x=>['replied','qualified','proposal_sent','won'].includes(x.stage)).length,
   due:relevant.filter(x=>x.next_action_date&&x.next_action_date<=today).length,
   unplanned:relevant.filter(x=>!x.next_action_date&&x.stage==='contacted').length
 };
 const rows=showAll?relevant:relevant.slice(0,20);
 const current=relevant.find(x=>x.id===selectedId);
 useEffect(()=>{
  setForm(current?{
   next_action:current.next_action||'',
   next_action_date:current.next_action_date||'',
   reply_kind:current.reply_kind||'',
   reply_evidence_ref:current.reply_evidence_ref||'',
   last_reply_summary:current.last_reply_summary||''
  }:EMPTY);
  setProof(false);setError('');setSuccess('');
 },[selectedId,current?.last_reply_at,current?.next_action_date,current?.stage]);
 const updateForm=(key,value)=>{setForm(p=>({...p,[key]:value}));setError('');setSuccess('');};
 const saveNext=async()=>{
  if(!current||busy)return;
  setError('');setSuccess('');
  if(current.opt_out){setError('Bu firmadan iletişim reddi kaydedilmiş. Yeni ticari takip planı oluşturulamaz.');return;}
  if(form.next_action.trim().length<8||!/^\d{4}-\d{2}-\d{2}$/.test(form.next_action_date)){
   setError('Somut sonraki adımı ve YYYY-AA-GG şeklinde takip tarihini girin.');return;
  }
  setBusy(true);
  try{
   await base44.entities.B2BProspect.update(current.id,{
    next_action:form.next_action.trim().slice(0,350),
    next_action_date:form.next_action_date
   });
   setSuccess('Takip planı kaydedildi. Bu işlem otomatik mesaj veya takvim daveti göndermez.');
   await onChange?.();
  }catch(e){setError('Takip planı kaydedilemedi. Yönetici yetkisi ve bağlantıyı kontrol edin.');}
  finally{setBusy(false);}
 };
 const saveReply=async()=>{
  if(!current||busy)return;
  setError('');setSuccess('');
  if(current.opt_out){setError('Firma ret/ileti kesme kaydı nedeniyle ayrıca incelenmeli.');return;}
  if(!proof){setError('Gerçek yanıtı mesajdan veya arama kaydından doğruladığını onaylamalısın.');return;}
  if(!form.reply_kind||form.reply_evidence_ref.trim().length<6||form.last_reply_summary.trim().length<15){
   setError('Yanıt türü, gerçek kanıt referansı ve en az 15 karakterlik görüşme özeti gerekiyor.');return;
  }
  setBusy(true);
  try{
   await base44.entities.B2BProspect.update(current.id,{
    reply_kind:form.reply_kind,
    reply_evidence_ref:form.reply_evidence_ref.trim().slice(0,180),
    last_reply_summary:form.last_reply_summary.trim().slice(0,500),
    last_reply_at:new Date().toISOString(),
    stage:'replied'
   });
   setSuccess('Gerçek firma yanıtı kanıt referansıyla kaydedildi. Henüz satış veya müşteri sözleşmesi sayılmaz.');
   setProof(false);
   await onChange?.();
  }catch(e){setError('Yanıt kaydı güncellenemedi.');}
  finally{setBusy(false);}
 };
 return <section className="rounded-xl border border-border bg-card p-5">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div>
    <h2 className="flex items-center gap-2 text-lg font-extrabold"><CalendarCheck2 size={19}/> Firma yanıtları ve takip masası</h2>
    <p className="mt-2 text-xs leading-6 text-muted-foreground">
     Gönderilmiş ilk temasları, gerçek yanıtları ve sonraki somut aksiyonları yönet.
     Otomatik ticari ileti, toplu takip mesajı veya sahte yanıt kaydı oluşturulmaz.
    </p>
   </div>
   <button type="button" onClick={()=>onChange?.()} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold"><RefreshCw size={14}/> Yenile</button>
  </div>
  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
   {[
    ['Yanıt beklenen',summary.contacted],
    ['Yanıt veya ileri aşama',summary.replied],
    ['Takip tarihi geldi',summary.due],
    ['Takip tarihi yok',summary.unplanned]
   ].map(([label,n])=><div key={label} className="rounded-lg bg-muted/60 p-3">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="mt-1 text-xl font-black">{n}</p>
   </div>)}
  </div>
  {!relevant.length&&<p className="mt-4 rounded-lg border border-dashed border-border p-4 text-xs">
   Henüz gönderim veya görüşme kaydı yok. Araştırılmış firmaları otomatik olarak temas kurulmuş saymıyoruz.
  </p>}
  {relevant.length>0&&<>
   <div className="mt-4 overflow-x-auto rounded-xl border border-border">
    <table className="w-full min-w-[620px] text-left text-xs">
     <thead className="bg-muted/60"><tr>
      <th className="p-3">Firma</th><th className="p-3">Durum</th>
      <th className="p-3">İlk temas</th><th className="p-3">Sonraki adım</th>
      <th className="p-3">Kayıt</th>
     </tr></thead>
     <tbody>{rows.map(p=><tr key={p.id} className="border-t border-border">
      <td className="p-3 font-semibold">{p.company_name}</td>
      <td className="p-3">{p.opt_out?'İleti engellendi':p.stage==='contacted'?'Yanıt bekleniyor':p.stage==='replied'?'Yanıt alındı':p.stage}</td>
      <td className="p-3">{formatDate(p.last_contacted_at)}</td>
      <td className="p-3">
       {p.next_action_date?(p.next_action_date<=today?'Takip tarihi geldi: ':'')+p.next_action_date:'Planlanmadı'}
      </td>
      <td className="p-3">
       <button type="button" onClick={()=>setSelectedId(p.id)} className="font-bold text-amber-700 underline">Aç</button>
      </td>
     </tr>)}</tbody>
    </table>
   </div>
   {relevant.length>20&&<button type="button" onClick={()=>setShowAll(x=>!x)} className="mt-2 text-xs font-bold underline">
     {showAll?'İlk 20 firmayı göster':'Tüm ilgili firmaları göster'}
   </button>}
   <div className="mt-4 rounded-xl border border-border p-4">
    <label className="block text-xs font-bold">Firma seçimi
     <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}
      className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal">
      <option value="">Firma seç</option>
      {relevant.map(p=><option key={p.id} value={p.id}>{p.company_name} · {p.stage}</option>)}
     </select>
    </label>
    {current&&<>
     <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs leading-6">
      <strong>İletişim:</strong> {current.contact_email||'Kayıt yok'} · <strong>Son yanıt:</strong> {formatDate(current.last_reply_at)}
      <span className="block">İYS kontrolü: {current.iys_check_status==='permitted'?'Kayıtlı kontrol mevcut':'Doğrulanmamış / uygun değil'} — yeni ticari mesaj göndermeden önce uygunluğu kontrol et.</span>
      {current.opt_out&&<strong className="block text-rose-700">Firma iletişimden çıkmış. Takip mesajı gönderme.</strong>}
     </p>
     <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block text-xs font-bold">Sıradaki somut aksiyon
       <input type="text" value={form.next_action} maxLength={350}
        placeholder="Örn. Gelen teknik soruya yanıt için doküman kontrolü"
        onChange={e=>updateForm('next_action',e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
      </label>
      <label className="block text-xs font-bold">Takip tarihi
       <input type="date" value={form.next_action_date} onChange={e=>updateForm('next_action_date',e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
      </label>
     </div>
     <button type="button" onClick={saveNext} disabled={busy||current.opt_out}
      className="mt-3 rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-40">
      <ClipboardCheck size={14} className="mr-1 inline"/> Takip planını kaydet
     </button>
     <div className="mt-5 border-t border-border pt-4">
      <h3 className="flex items-center gap-2 text-sm font-bold"><Inbox size={16}/> Gerçek firma yanıtını kaydet</h3>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
       Yalnızca okunmuş bir e-posta, resmî telefon görüşmesi veya başka doğrulanabilir yanıt varsa kullan.
       Başka firmaların yanıtını buraya taşıma. Kanıt referansına şifre, kişisel kimlik numarası veya gizli belge ekleme.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
       <label className="block text-xs font-bold">Gerçek yanıtın konusu
        <select value={form.reply_kind} onChange={e=>updateForm('reply_kind',e.target.value)}
         className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal">
         <option value="">Yanıt türünü seç</option>
         {REPLY_KINDS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select>
       </label>
       <label className="block text-xs font-bold">Gerçek mesaj / arama kayıt referansı
        <input value={form.reply_evidence_ref} maxLength={180}
         onChange={e=>updateForm('reply_evidence_ref',e.target.value)}
         placeholder="Gmail mesaj kimliği veya görüşme referansı"
         className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
       </label>
      </div>
      <label className="mt-3 block text-xs font-bold">Yanıtın kısa özeti
       <textarea value={form.last_reply_summary} rows={3} maxLength={500}
        onChange={e=>updateForm('last_reply_summary',e.target.value)}
        placeholder="Gerçekte sorulan/teyit edilen ihtiyaç veya ret, sadece iş için gerekli bilgiler"
        className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
      </label>
      <label className="mt-3 flex items-start gap-2 text-xs leading-6">
       <input type="checkbox" className="mt-1" checked={proof} onChange={e=>setProof(e.target.checked)}/>
       <span>Bu firmadan gerçek yanıt geldiğini, kayıt referansını ve özetini bizzat doğruladım.</span>
      </label>
      <button type="button" onClick={saveReply} disabled={busy||current.opt_out}
       className="mt-3 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">
       Yanıtı doğrulanmış olarak kaydet
      </button>
     </div>
     {error&&<p role="alert" className="mt-3 text-xs font-semibold text-rose-700">{error}</p>}
     {success&&<p role="status" className="mt-3 text-xs font-semibold text-emerald-700">{success}</p>}
    </>}
   </div>
  </>}
  <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-amber-800">
   <ShieldAlert size={14} className="mt-0.5 shrink-0"/>
   Takip tarihi sadece yönetici planlamasıdır, otomatik hatırlatma değildir. Yeni tanıtım veya tekrar mesajı için İYS, ret ve diğer hukuki kontroller ayrıca gerekir.
  </p>
 </section>;
}
