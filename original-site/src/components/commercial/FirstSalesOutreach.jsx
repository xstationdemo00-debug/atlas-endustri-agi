import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ClipboardCopy, MailCheck, SearchCheck, ShieldAlert, Target } from 'lucide-react';

const INDUSTRY={
 welding:'kaynaklı imalat',pipework:'proses borulama',assembly:'saha montajı',
 laser_cutting:'lazer kesim',bending:'sac büküm',machining:'talaşlı imalat',
 stainless_process:'paslanmaz proses',fabrication:'metal imalat'
};
const READY=['researched','draft_ready','contact_allowed'];
const verifiedForMarketing=p=>
  !p.opt_out&&
  ['merchant','craftsman'].includes(p.recipient_business_type)&&
  p.iys_check_status==='permitted'&&
  !!p.iys_checked_at&&String(p.iys_evidence_ref||'').trim().length>=6;
const score=(x)=>{
 let s=x.stage==='contact_allowed'?5:x.stage==='draft_ready'?3:1;
 if(x.contact_email)s+=3;
 if(x.website)s+=1;
 if(x.source_url)s+=1;
 if(String(x.city||'').includes('Ankara'))s+=2;
 if((x.capability_tags||[]).includes('welding'))s+=1;
 return s;
};
function draft(p){
 const skills=(p.capability_tags||[]).filter(x=>INDUSTRY[x]).slice(0,3).map(x=>INDUSTRY[x]);
 const skillDescription=skills.length?skills.join(', '):'endüstriyel üretim ve tedarik';
 return [
  'Konu: Sanayi tedarik ve fason üretim araştırma pilotu',
  '',
  'Merhaba,',
  '',
  'Atlas Endüstri Ağı olarak sanayi firmalarının belirli iş paketleri için üretici, fason atölye ve tedarikçi ön araştırması yapabilecek bir B2B hizmet pilotu hazırlıyoruz.',
  '',
  'Firmanızın kamuya açık bilgilerinde '+skillDescription+' alanları yer aldığı için ulaşmayı değerlendiriyoruz. Güncel işlerinizde uygun üretici/alt yüklenici araştırması veya teknik ihtiyaç karşılaştırması gereken bir konu varsa kısa bir ön görüşmede kapsamı netleştirebiliriz.',
  '',
  'Çalışmanın kapsamı, teslim edilecek rapor ve hizmet bedeli yazılı şekilde kararlaştırılmadan yükümlülük doğmaz. Mevcut ortaklık veya doğrulanmış kapasite iddiasında bulunmuyoruz.',
  '',
  'Pilot hizmet: https://atlas-endustri-agi.base44.app/ilk-hizmet',
  '',
  'Uygun değilse bildirmeniz yeterlidir; tekrar ticari ileti göndermeyiz.',
  '',
  'Atlas Endüstri Ağı'
 ].join('\n');
}
export default function FirstSalesOutreach({prospects=[],onChange}){
 const [confirmed,setConfirmed]=useState({});
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [busy,setBusy]=useState('');
 const eligible=prospects.filter(p=>!p.is_demo&&verifiedForMarketing(p)&&READY.includes(p.stage)&&p.contact_email&&p.source_url)
   .sort((a,b)=>score(b)-score(a)||String(a.company_name).localeCompare(String(b.company_name),'tr')).slice(0,8);
 const updated=async(p,stage)=>{
  if(busy)return;
  setMessage('');setError('');
  if(!verifiedForMarketing(p)){
   setError('Gerçek İYS kontrolü ve tacir/esnaf niteliği kaydedilmemiş. Önce iletişim kontrol masasına gidin.');
   return;
  }
  if(!confirmed[p.id]){
   setError('İşlemi kaydetmeden önce gerçek iletişim ve hukuki uygunluk kontrolünü işaretle.');return;
  }
  if(stage==='contact_allowed'&&!['researched','draft_ready'].includes(p.stage))return;
  if(stage==='contacted'&&p.stage!=='contact_allowed')return;
  setBusy(p.id);
  try{
   const patch=stage==='contacted'
    ?{stage,last_contacted_at:new Date().toISOString()}
    :{stage};
   await base44.entities.B2BProspect.update(p.id,patch);
   setConfirmed(q=>({...q,[p.id]:false}));
   setMessage(stage==='contacted'?'Gerçek gönderim beyanı üzerine iletişim kaydı güncellendi.':'İletişim uygunluğu iç kontrolü kaydedildi. Henüz mesaj gönderilmedi.');
   await onChange?.();
  }catch(e){setError('Firma iletişim kaydı güncellenemedi. Yetki veya bağlantıyı kontrol edin.');}
  finally{setBusy('');}
 };
 const copy=async(p)=>{
  if(!verifiedForMarketing(p)||p.stage!=='contact_allowed'){setError('Önce ticari ileti ve İYS uygunluğunu doğrulayın.');return;}
  setError('');setMessage('');
  try{await navigator.clipboard.writeText(draft(p));setMessage(p.company_name+' için mesaj taslağı kopyalandı. Bu işlem mesaj göndermez.');}
  catch{setError('Kopyalama yapılamadı. Tarayıcı iznini kontrol edin.');}
 };
 return (
  <section className="rounded-xl border border-border bg-card p-5">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <h2 className="flex items-center gap-2 text-base font-extrabold"><Target size={18}/> İlk müşteri kazanımı — 8 firma önceliği</h2>
     <p className="mt-1 max-w-3xl text-xs leading-6 text-muted-foreground">
      Yalnızca harici İYS kontrolü, tacir/esnaf statüsü ve kanıt referansı kayıtlı firmaları gösterir. Ön araştırma gerçek müşteri yerine geçmez.
      Hiçbir e-posta kendiliğinden gönderilmez.
     </p>
    </div>
    <a href="/#/ilk-hizmet" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-700 underline">Paylaşılabilir hizmet sayfası</a>
   </div>
   {error&&<p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-900">{error}</p>}
   {message&&<p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-950">{message}</p>}
   <div className="mt-4 grid gap-3 md:grid-cols-2">
    {eligible.map(p=>(
     <article key={p.id} className="rounded-lg border border-border p-4">
      <p className="text-sm font-extrabold">{p.company_name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{p.city||'Şehir kaydı yok'} · {p.stage==='contact_allowed'?'İletişim uygunluğu iç kontrolden geçti':p.stage==='draft_ready'?'Araştırma taslağı hazır':'Yalnızca araştırıldı'}</p>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{p.opportunity_fit||'İhtiyaç ve işbirliği talebi doğrulanmadı.'}</p>
      <div className="mt-2 flex flex-wrap gap-3">
       {p.source_url&&<a href={p.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-amber-700 underline"><SearchCheck size={13}/> Kaynağı incele</a>}
       {p.website&&<a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-700 underline">Firma sitesi</a>}
      </div>
      <p className="mt-3 text-xs text-foreground">Kayıtlı kurumsal iletişim: <span className="font-mono">{p.contact_email}</span></p>
      <label className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-[11px] leading-5">
       <input type="checkbox" className="mt-1" checked={confirmed[p.id]||false}
        onChange={e=>setConfirmed(q=>({...q,[p.id]:e.target.checked}))}/>
       <span>
        {p.stage==='contact_allowed'
         ?'Mesajı kendi hesabımdan gerçekten gönderdiğimi ve ret/iletişim tercihlerini kontrol ettiğimi doğruluyorum.'
         :'Firma kaynağını, iletişim bilgisinin güncelliğini, KVKK/İYS ticari ileti uygunluğunu ve ret tercihlerini kontrol ettim.'}
       </span>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
       {p.stage!=='contact_allowed'?(
        <button type="button" disabled={busy===p.id||!confirmed[p.id]} onClick={()=>updated(p,'contact_allowed')}
          className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-40">
         İletişim iç kontrolünü kaydet
        </button>
       ):(
        <>
         <button type="button" onClick={()=>copy(p)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold">
          <ClipboardCopy size={14}/> Tanıtım mesajını kopyala
         </button>
         <button type="button" disabled={!confirmed[p.id]||busy===p.id} onClick={()=>updated(p,'contacted')}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
          <MailCheck size={14}/> Gerçekten gönderildi
         </button>
        </>
       )}
      </div>
     </article>
    ))}
   </div>
   {!eligible.length&&<p className="mt-4 rounded-lg border border-dashed border-border p-4 text-xs">Kriterlere uygun kurumsal araştırma adayı bulunamadı. Firma verilerini doğrulayın.</p>}
   <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-amber-800">
    <ShieldAlert size={15} className="mt-0.5 shrink-0"/>
    Önce Ticari İleti / İYS Kontrol Masası'nda kanıtlı kontrol kaydedilmelidir. Bu panel asla İYS sorgusu yapmaz, ret almış firmaya mesaj hazırlamaz; otomatik gönderim yoktur.
   </p>
  </section>
 );
}
