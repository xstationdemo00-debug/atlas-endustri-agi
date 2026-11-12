import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Ban, ClipboardCheck, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';

const stageLabel={
 researched:'Araştırıldı',draft_ready:'İletişim taslağı hazır',contact_allowed:'İç kontroller tamam',
 contacted:'İlk mesaj gönderildi',replied:'Yanıt geldi',qualified:'İhtiyaç doğrulandı',
 proposal_sent:'Teklif iletildi',won:'İş kazanıldı',lost:'Kapanmış',blocked:'İletişim durduruldu'
};
const mailLegal=(p)=>!p.opt_out && ['merchant','craftsman'].includes(p.recipient_business_type) &&
  p.iys_check_status==='permitted' && String(p.iys_evidence_ref||'').trim().length>=6 &&
  !!p.iys_checked_at;
const opts=[
 ['not_checked','İYS kontrolü yapılmadı'],
 ['permitted','Kontrol edildi; ret görünmüyor'],
 ['rejected','İYS üzerinden ret görüldü'],
 ['not_applicable','İlgili ileti için uygulanmaz (tanıtım izni sayılmaz)']
];
export default function ContactCompliancePanel({prospects=[],onChange}){
 const [id,setId]=useState('');
 const [kind,setKind]=useState('unknown');
 const [status,setStatus]=useState('not_checked');
 const [reference,setReference]=useState('');
 const [legalNote,setLegalNote]=useState('');
 const [confirmed,setConfirmed]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [onlyOutstanding,setOnlyOutstanding]=useState(true);
 const list=prospects.filter(p=>!p.is_demo)
   .filter(p=>!onlyOutstanding||((['contacted','contact_allowed'].includes(p.stage)&&!mailLegal(p))||(!p.opt_out&&!mailLegal(p))))
   .sort((a,b)=>{
    const rank=p=>p.opt_out?3:p.stage==='contacted'?0:p.stage==='draft_ready'?1:2;
    return rank(a)-rank(b) || String(a.company_name).localeCompare(String(b.company_name),'tr');
   });
 const selected=prospects.find(p=>p.id===id);
 useEffect(()=>{
   setKind(selected?.recipient_business_type||'unknown');
   setStatus(selected?.iys_check_status||'not_checked');
   setReference(selected?.iys_evidence_ref||'');
   setLegalNote(selected?.contact_legal_basis_note||'');
   setConfirmed(false);
   setError('');setMessage('');
 },[id]);
 const risky=prospects.filter(p=>!p.is_demo&&p.stage==='contacted'&&!mailLegal(p)&&!p.opt_out);
 const sendable=prospects.filter(p=>!p.is_demo&&mailLegal(p)&&['contact_allowed','draft_ready','researched'].includes(p.stage));
 const blocked=prospects.filter(p=>!p.is_demo&&p.opt_out);
 async function save(){
   if(!selected||busy)return;
   setError('');setMessage('');
   if(!confirmed){setError('Bu kayıt için dış kontrolün gerçekten yapıldığını teyit edin.');return;}
   if(!reference.trim()||reference.trim().length<6){setError('Dış kontrolden gelen, kişisel veri içermeyen kanıt veya kayıt referansı gerekli.');return;}
   if(kind==='unknown'){setError('Alıcının tacir/esnaf/diğer statüsünü gerçek kaynaktan doğrulayın.');return;}
   if(status==='not_checked'){setError('İYS durumunu kayıtlı bir dış kontrol sonucuyla belirleyin.');return;}
   if(status==='permitted'&&!['merchant','craftsman'].includes(kind)){setError('Tanıtım için tacir/esnaf statüsü dışında ayrıca hukuki onay/izin gerekir; bu ekran o izni doğrulamaz.');return;}
   if(status==='not_applicable'){setError('Tanıtım e-postasını İYS muafiyeti üzerinden otomatik serbest bırakmıyoruz; hukuki değerlendirme gerekir.');return;}
   const stamp=new Date().toISOString();
   const blockedNow=status==='rejected';
   const patch={
     recipient_business_type:kind,iys_check_status:status,
     iys_checked_at:stamp,iys_evidence_ref:reference.trim().slice(0,180),
     contact_legal_basis_note:legalNote.trim().slice(0,700)
   };
   if(blockedNow){patch.opt_out=true;patch.opt_out_at=stamp;patch.opt_out_source='İYS ret kontrolü';patch.stage='blocked';}
   setBusy(true);
   try{
     await base44.entities.B2BProspect.update(selected.id,patch);
     setMessage(blockedNow?'Ret işaretlendi. Bu firmaya yeni ticari ileti hazırlanmamalı.':'Dış kontrol kaydedildi. Tanıtım için son şirket ve iletişim uygunluk denetimi yine gereklidir.');
     await onChange?.();setConfirmed(false);
   }catch(e){setError('Kontrol kaydı kaydedilemedi. Yönetici yetkilerini ve bağlantıyı kontrol edin.');}
   finally{setBusy(false);}
 }
 async function stop(){
   if(!selected||busy)return;
   setError('');setMessage('');
   if(!confirmed){setError('Ret bildiriminin gerçekten ulaştığını veya firma isteğinin bulunduğunu doğrulayın.');return;}
   setBusy(true);
   try{
     await base44.entities.B2BProspect.update(selected.id,{
       opt_out:true,opt_out_at:new Date().toISOString(),
       opt_out_source:'Firma ret talebi (yönetici kaydı)',
       stage:'blocked'
     });
     setMessage('İletişim yasağı Atlas kaydında uygulandı. Gerekliyse İYS üzerinden ret bildirimi ayrıca yapılmalı.');
     await onChange?.();setConfirmed(false);
   }catch(e){setError('Ret kaydı uygulanamadı.');}
   finally{setBusy(false);}
 }
 return <section className="rounded-xl border border-border bg-card p-5">
   <div className="flex flex-wrap items-center justify-between gap-2">
     <h2 className="flex items-center gap-2 text-base font-extrabold"><ShieldCheck size={18}/> Ticari ileti · İYS ve ret kontrol masası</h2>
     <a target="_blank" rel="noopener noreferrer" href="https://iys.org.tr/"
       className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline">
       İYS resmî sitesi <ExternalLink size={13}/>
     </a>
   </div>
   <p className="mt-2 text-xs leading-6 text-muted-foreground">
     Bu ekran İYS'ye bağlı değildir ve kendi kendine yasal izin doğrulamaz. Tacir/esnaf statüsünü,
     adresin İYS kaydını ve ret durumunu <strong>haricen gerçekten</strong> kontrol edip
     referansıyla kaydetmelisin. Yanıtsız firmaya tekrar ticari mesaj göndermek serbest sayılmaz.
   </p>
   <div className="mt-3 grid grid-cols-3 gap-2">
    {[['Gönderilmiş, kontrol kanıtsız',risky.length],['Kayıtlı kontrolü uygun',sendable.length],['Ret / engel',blocked.length]].map(([label,n])=>
     <div key={label} className="rounded-lg bg-muted/60 p-3">
      <p className="text-[11px] leading-5 text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black">{n}</p>
     </div>
    )}
   </div>
   {risky.length>0&&<p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950">
    <AlertTriangle size={17} className="mt-0.5 shrink-0"/>
    {risky.length} firmaya mesaj gönderilmiş ama bağımsız İYS kontrolü kaydı bulunmuyor. Bu durum önceki gönderimlerin yasal uygunluğunu doğrulamaz; tekrar tanıtım göndermeden önce kontrol et.
   </p>}
   <div className="mt-4 flex items-center justify-between gap-3">
    <p className="text-xs font-bold">Firma ve ileti kontrolü</p>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={onlyOutstanding}
     onChange={e=>setOnlyOutstanding(e.target.checked)}/> İncelenecekleri göster</label>
   </div>
   <label className="mt-2 block text-xs font-bold">Firma kaydı
    <select value={id} onChange={e=>setId(e.target.value)}
      className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm font-normal">
      <option value="">Firma seç</option>
      {list.map(p=><option key={p.id} value={p.id}>{p.company_name} · {stageLabel[p.stage]||p.stage} · {p.iys_check_status==='permitted'?'İYS kontrol kayıtlı':'İYS açık'}</option>)}
    </select>
   </label>
   {selected&&<div className="mt-4 grid gap-3">
     <div className="rounded-lg bg-muted/40 p-3 text-xs leading-6">
       <strong>{selected.company_name}</strong> · {selected.contact_email||'E-posta kaydı yok'}
       <p>Son gönderim: {selected.last_contacted_at?new Date(selected.last_contacted_at).toLocaleDateString('tr-TR'):'Gönderim kaydı yok'} · Önceki ret: {selected.opt_out?'Evet':'Kayıtlı değil'}</p>
       <p>Gerçek İYS kontrolü: {selected.iys_checked_at?'Kayıtlı tarih var':'Henüz kaydedilmedi'}</p>
       {selected.opt_out&&<p className="font-semibold text-rose-700">Bu firmada ticari ileti durdurulmuş. Yeni gönderim yapma.</p>}
     </div>
     <div className="grid gap-3 sm:grid-cols-2">
       <label className="text-xs font-bold">Alıcının doğrulanmış hukuki niteliği
        <select value={kind} onChange={e=>setKind(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal">
         <option value="unknown">Doğrulanmadı</option>
         <option value="merchant">Tacir</option>
         <option value="craftsman">Esnaf</option>
         <option value="consumer">Diğer / gerçek kişi</option>
        </select>
       </label>
       <label className="text-xs font-bold">İYS durumu
        <select value={status} onChange={e=>setStatus(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal">
         {opts.map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select>
       </label>
     </div>
     <label className="text-xs font-bold">İYS sorgusu / doğrulama kanıtı referansı *
      <input value={reference} maxLength={180} onChange={e=>setReference(e.target.value)}
       placeholder="Yalnız gerçek kontrol referansı; kimlik numarası, şifre ve anahtar yazma"
       className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
     </label>
     <label className="text-xs font-bold">Hukuki dayanak ve kısa inceleme notu
      <textarea rows={2} value={legalNote} maxLength={700} onChange={e=>setLegalNote(e.target.value)}
       className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
     </label>
     <label className="flex items-start gap-2 text-xs leading-6">
      <input type="checkbox" className="mt-1" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
      <span>Harici kontrolü gerçekten yaptım; girilen hukuki durum, İYS bilgisi ve varsa ret bildirimi gerçeğe uygundur.</span>
     </label>
     {error&&<p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
     {message&&<p role="status" className="text-xs font-semibold text-emerald-800">{message}</p>}
     <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy||selected.opt_out} onClick={save}
       className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
       <ClipboardCheck size={14}/> Gerçek kontrol sonucunu kaydet
      </button>
      <button type="button" disabled={busy||selected.opt_out} onClick={stop}
       className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-900 disabled:opacity-40">
       <Ban size={14}/> Ret alındı — iletiyi durdur
      </button>
     </div>
   </div>}
  </section>;
}
