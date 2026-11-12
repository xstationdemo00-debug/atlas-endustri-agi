import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Banknote, ClipboardCheck, Copy, FileText, RefreshCw, ShieldAlert } from 'lucide-react';

const CATEGORIES={
 supplier_research:'Tedarikçi / üretici araştırması',
 subcontractor_research:'Fason imalatçı / alt yüklenici araştırması',
 procurement_scope:'Teknik kapsam ön değerlendirmesi'
};
const STAGES=[
 ['draft','Hazırlık'],
 ['ready_for_manual_quote','Teklif taslağı hazır'],
 ['quote_shared','Teklif müşteriye iletildi'],
 ['agreement_pending','Sözleşme / mutabakat bekliyor'],
 ['contracted','Sözleşme kuruldu'],
 ['delivered','Hizmet teslim edildi'],
 ['paid','Tahsilat doğrulandı'],
 ['lost','Olumsuz sonuç / kapandı']
];
const CHECKS=[
 ['buyer_identity_checked','Talep sahibi ve firma yetkilisi doğrulandı'],
 ['buyer_scope_confirmed','İş kapsamı ve teslim ölçütleri müşteriyle netleşti'],
 ['fair_pay_checked','Emek karşılığı ve gerçek maliyet hesaplandı'],
 ['legal_seller_checked','Hukuken hizmet sunabilecek taraf doğrulandı'],
 ['invoicing_route_confirmed','Mevzuata uygun fatura ve ödeme yolu doğrulandı']
];
const EMPTY={
 scope:'',deliverables:'',verification_method:'',exclusions:'',
 target_candidate_count:'3',estimated_hours:'',fair_labor_cost:'',out_of_pocket_cost:'',
 quoted_gross_amount:'',offer_valid_until:'',next_step:'',next_step_date:'',
 legal_seller_note:'',quote_shared_reference:'',agreed_delivery_date:'',
 invoice_reference:'',payment_reference:'',evidence_note:'',
 buyer_identity_checked:false,buyer_scope_confirmed:false,fair_pay_checked:false,
 legal_seller_checked:false,invoicing_route_confirmed:false,
 agreement_evidence_confirmed:false,signed_scope_evidence_confirmed:false,
 delivery_evidence_confirmed:false,payment_evidence_confirmed:false,
 status:'draft'
};
const toNum=(v)=>v===''?0:Number(v);
const format=(v)=>new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(v)||0);
const str=(v)=>String(v??'').trim();
const permittedStages=(f,canOffer)=>{
 const list=['draft'];
 if(canOffer){
   list.push('ready_for_manual_quote');
   if(str(f.quote_shared_reference))list.push('quote_shared','agreement_pending');
   if(str(f.quote_shared_reference)&&f.agreement_evidence_confirmed&&f.signed_scope_evidence_confirmed)
     list.push('contracted');
   if(list.includes('contracted')&&f.delivery_evidence_confirmed&&str(f.evidence_note))list.push('delivered');
   if(list.includes('delivered')&&f.payment_evidence_confirmed&&str(f.invoice_reference)&&str(f.payment_reference))list.push('paid');
 }
 list.push('lost');
 return list;
};
export default function RevenuePilotSalesPanel({inquiries=[]}){
 const real=inquiries.filter(x=>!x.is_demo);
 const [records,setRecords]=useState([]);
 const [selected,setSelected]=useState('');
 const [form,setForm]=useState(EMPTY);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState('');
 const [error,setError]=useState('');
 const [copied,setCopied]=useState(false);
 const inquiry=real.find(x=>x.id===selected);
 const old=records.find(x=>x.inquiry_id===selected);
 const allChecks=CHECKS.every(([k])=>form[k]===true);
 const hours=toNum(form.estimated_hours),labor=toNum(form.fair_labor_cost),
   cost=toNum(form.out_of_pocket_cost),amount=toNum(form.quoted_gross_amount);
 const canOffer=allChecks&&hours>0&&labor>0&&cost>=0&&amount>=labor+cost&&
   str(form.scope).length>=20&&str(form.deliverables).length>=15&&
   str(form.verification_method).length>=10&&str(form.legal_seller_note).length>=8;
 const stages=permittedStages(form,canOffer);
 const currentStage=stages.includes(form.status)?form.status:'draft';
 const stats={
   drafts:records.filter(x=>!x.is_demo&&x.status==='draft').length,
   quoted:records.filter(x=>!x.is_demo&&['quote_shared','agreement_pending','contracted','delivered','paid'].includes(x.status)).length,
   contracts:records.filter(x=>!x.is_demo&&['contracted','delivered','paid'].includes(x.status)).length,
   paid:records.filter(x=>!x.is_demo&&x.status==='paid').length
 };
 async function refresh(){
  setLoading(true);
  try{
   const response=await base44.entities.RevenuePilotQuote.list('-created_date',100);
   setRecords(Array.isArray(response)?response:response?.items||[]);
  }catch(e){setError('Satış pilot kayıtları yüklenemedi. Yönetici yetkisi veya bağlantıyı kontrol et.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{refresh();},[]);
 useEffect(()=>{
  const record=records.find(x=>x.inquiry_id===selected);
  const next={...EMPTY};
  if(record){
   for(const key of Object.keys(next)){
     if(record[key]!==undefined&&record[key]!==null)next[key]=String(key).endsWith('_checked')||key==='agreement_evidence_confirmed'||key==='signed_scope_evidence_confirmed'||key==='delivery_evidence_confirmed'||key==='payment_evidence_confirmed'?record[key]:record[key];
   }
  }else{
   const request=real.find(x=>x.id===selected);
   if(request)next.scope=request.description||'';
  }
  setForm(next);setCopied(false);
 },[selected,records]);
 const set=(key,value)=>{setNotice('');setForm(prev=>({...prev,[key]:value}));};
 const save=async(e)=>{
  e.preventDefault();if(!inquiry||busy)return;
  setError('');setNotice('');
  if(!str(form.scope)||!str(form.deliverables)||!str(form.next_step)){setError('Kapsam, teslim çıktıları ve sonraki adım zorunludur.');return;}
  if([hours,labor,cost,amount,toNum(form.target_candidate_count)].some(v=>!Number.isFinite(v)||v<0)){
    setError('Sayılar sıfır veya pozitif olmalıdır.');return;
  }
  if(!stages.includes(form.status)){setError('Bu aşamaya geçmek için tüm önceki doğrulama koşulları tamamlanmalı.');return;}
  if(form.status==='paid'&&(!str(form.payment_reference)||!str(form.invoice_reference))){
    setError('Tahsilat için gerçek ödeme ve fatura referansı gerekli.');return;
  }
  const payload={
   inquiry_id:inquiry.id,company_name:str(inquiry.company_name).slice(0,180),
   service_type:CATEGORIES[inquiry.service_type]?inquiry.service_type:'supplier_research',
   ...Object.fromEntries(Object.entries(form).filter(([k])=>!['target_candidate_count','estimated_hours','fair_labor_cost','out_of_pocket_cost','quoted_gross_amount'].includes(k)).map(([k,v])=>[k,typeof v==='string'?v.trim().slice(0,['scope','deliverables'].includes(k)?2000:1000):v])),
   target_candidate_count:toNum(form.target_candidate_count),estimated_hours:hours,
   fair_labor_cost:labor,out_of_pocket_cost:cost,quoted_gross_amount:amount,
   status:form.status,is_demo:false,currency:'TRY'
  };
  setBusy(true);
  try{
   if(old)await base44.entities.RevenuePilotQuote.update(old.id,payload);
   else await base44.entities.RevenuePilotQuote.create(payload);
   setNotice('Satış süreci kaydedildi. Bu işlem müşteriye teklif veya ödeme isteği göndermez.');
   await refresh();
  }catch(err){setError('Satış kaydı kaydedilemedi. İzinleri ve veri alanlarını kontrol edin.');}
  finally{setBusy(false);}
 };
 const draft=()=>{
  if(!inquiry||!canOffer)return'';
  return ['ATLAS ENDÜSTRİ AĞI — TİCARİ HİZMET TEKLİF TASLAĞI',
   'Firma: '+str(inquiry.company_name),'Hizmet: '+CATEGORIES[inquiry.service_type],
   'Kapsam: '+str(form.scope),'Somut teslim çıktıları: '+str(form.deliverables),
   'Araştırma / doğrulama yöntemi: '+str(form.verification_method),
   'Hedef aday firma sayısı: '+form.target_candidate_count,
   'Kapsam dışı: '+str(form.exclusions||'Sözleşmede ayrıca belirtilecektir.'),
   'Önerilen hizmet tutarı (brüt): '+format(amount),
   'Teklif geçerlilik tarihi: '+(form.offer_valid_until||'Mutabakatla belirlenecek'),
   'Not: Bu metin yalnızca yönetici tarafından hazırlanmış taslaktır. İşin kapsamı, hizmeti sunan hukuki taraf, sözleşme, faturalama ve ödeme şartları yazılı olarak kabul edilmeden iş başlatılmaz. Kapasite/sonuç garantisi verilmez.'].join('\n\n');
 };
 const copy=async()=>{
  try{await navigator.clipboard.writeText(draft());setCopied(true);}
  catch{setError('Kopyalama izni verilmedi; teklif metnini elle aktarın.');}
 };
 return <section className="space-y-4 rounded-xl border border-border bg-card p-5">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><h2 className="flex items-center gap-2 text-lg font-extrabold"><Banknote size={19}/> İlk gelir — satış ve teklif kontrol masası</h2>
    <p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">
     Sadece gerçek firma talebinden taslak hazırla; emek maliyeti, hukuki hizmet tarafı, fatura yöntemi ve sözleşme doğrulanmadan ödeme aşamasına geçme.
     Bu ekran ödeme almıyor veya otomatik e-posta göndermiyor.
    </p></div>
   <button onClick={refresh} type="button" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold"><RefreshCw size={14}/> Yenile</button>
  </div>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
   {[['Taslak',stats.drafts],['Teklif iletilmiş',stats.quoted],['Sözleşmeli',stats.contracts],['Ödemesi teyitli',stats.paid]].map(([label,val])=>(
    <div key={label} className="rounded-lg bg-muted/50 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black">{val}</p></div>
   ))}
  </div>
  {!real.length?(
   <div className="rounded-xl border border-dashed border-border p-5">
    <p className="text-sm font-bold">Henüz gerçek müşteri talebi yok.</p>
    <p className="mt-2 text-xs leading-6 text-muted-foreground">İlk satış adımı, firmanın ihtiyacını doğrulanmış bir talep olarak kaydetmek. Demo kayıtlarını teklif veya gelir gibi göstermiyoruz.</p>
    <Link to="/ilk-hizmet" className="mt-3 inline-flex rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950">İlk satılabilir hizmet sayfasını aç</Link>
   </div>
  ):(
   <form className="space-y-4" onSubmit={save}>
    <label className="block text-xs font-bold">Gerçek kurumsal talep
     <select value={selected} onChange={e=>{setSelected(e.target.value);setError('');setNotice('');}}
      className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm font-normal">
      <option value="">Gerçek firma talebi seç</option>
      {real.map(x=><option key={x.id} value={x.id}>{x.company_name} · {CATEGORIES[x.service_type]||x.service_type} · {x.status||'new'}</option>)}
     </select>
    </label>
    {inquiry&&<>
     <div className="grid gap-3 sm:grid-cols-2">
      {[
       ['scope','Doğrulanmış iş kapsamı *','Malzeme, üretim süreci, ihtiyaç ve işin sınırları'],
       ['deliverables','Teslim edilecek rapor / çıktı *','Firma araştırma tablosu, kaynak ve eşleştirme ölçütleri'],
       ['verification_method','Araştırma ve doğrulama yöntemi','Web kaynağı, firma yanıtı, kapasite / belge doğrulama soruları'],
       ['exclusions','Kapsam dışındaki işler','Mühendislik tasdiki, fiyat ve kapasite garantisi vb.'],
       ['legal_seller_note','Hukuken hizmet sağlayacak taraf','Sözleşme tarafı, gerçek kişi veya yetkili iş ortağı; sahte şirket beyanı yok'],
       ['next_step','Sıradaki somut işlem *','Firma araması, kapsam yazısı, müşteri teyidi'],
      ].map(([key,label,placeholder])=><label key={key} className="block text-xs font-bold">{label}
       <textarea rows={key==='scope'?3:2} value={form[key]} maxLength={2000} onChange={e=>set(key,e.target.value)}
        placeholder={placeholder} className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
      </label>)}
     </div>
     <div className="grid gap-3 sm:grid-cols-3">
      {[
       ['target_candidate_count','Hedef firma adayı','1'],
       ['estimated_hours','İş yükü (saat)','0.5'],
       ['fair_labor_cost','Adil emek maliyeti (TL)','1'],
       ['out_of_pocket_cost','Diğer gerçek masraf (TL)','1'],
       ['quoted_gross_amount','Teklif brüt bedeli (TL)','1'],
      ].map(([key,label,step])=><label key={key} className="block text-xs font-bold">{label}
        <input type="number" min={0} step={step} value={form[key]} onChange={e=>set(key,e.target.value)}
         className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
      </label>)}
      {[['offer_valid_until','Teklif geçerlilik tarihi'],['next_step_date','Sonraki takip'],['agreed_delivery_date','Mutabık kalınan teslim']].map(([key,label])=>
       <label key={key} className="block text-xs font-bold">{label}
        <input type="date" value={form[key]} onChange={e=>set(key,e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
       </label>)}
     </div>
     <p className="rounded-lg bg-muted/50 p-3 text-xs leading-6">
      Önerilen brüt tutar: <strong>{format(amount)}</strong> · Emek + masraf: <strong>{format(labor+cost)}</strong>
      {amount>0&&amount<labor+cost&&<span className="ml-1 font-bold text-rose-700">Uyarı: emek ve masrafın altında teklif verilemez.</span>}
      <span className="block text-muted-foreground">Bunlar yönetici tarafından girilen tutarlardır; piyasa rayici veya müşteri onayı değildir. Vergi, SGK, sözleşme ve fiyatlandırma ayrıca değerlendirilir.</span>
     </p>
     <fieldset className="rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-bold">Teklif öncesi zorunlu beş kontrol</legend>
      <div className="grid gap-2 sm:grid-cols-2">{CHECKS.map(([key,label])=>(
       <label key={key} className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs leading-5">
        <input type="checkbox" className="mt-1" checked={form[key]===true} onChange={e=>set(key,e.target.checked)}/>{label}
       </label>
      ))}</div>
     </fieldset>
     <div className="grid gap-3 sm:grid-cols-2">
      {[['quote_shared_reference','Teklifin gerçekten iletildiği kanal ve tarih'],['invoice_reference','Gerçek fatura / belge referansı'],['payment_reference','Gerçek tahsilat banka/makbuz referansı'],['evidence_note','İş teslim / kabul kanıtının konumu']].map(([key,label])=>
       <label key={key} className="block text-xs font-bold">{label}
        <input type="text" maxLength={800} value={form[key]} onChange={e=>set(key,e.target.value)}
         className="mt-1 w-full rounded-lg border border-border bg-background p-2.5 text-sm font-normal"/>
       </label>)}
     </div>
     <fieldset className="rounded-lg border border-border p-3">
      <legend className="px-1 text-sm font-bold">İleri aşamalar için kanıt kontrolleri</legend>
      <div className="grid gap-2 sm:grid-cols-2">{[
       ['agreement_evidence_confirmed','Müşterinin yazılı kabulü görüldü'],
       ['signed_scope_evidence_confirmed','Sözleşme ve kesin kapsam kontrol edildi'],
       ['delivery_evidence_confirmed','Teslim ve müşteri kabul kanıtı kaydedildi'],
       ['payment_evidence_confirmed','Gerçek tahsilat belgesi ve fatura doğrulandı']
      ].map(([key,label])=><label key={key} className="flex items-start gap-2 p-2 text-xs"><input type="checkbox" checked={form[key]===true} onChange={e=>set(key,e.target.checked)} className="mt-0.5"/>{label}</label>)}</div>
     </fieldset>
     <label className="block text-xs font-bold">Satış aşaması (yalnızca önkoşulları tamamlananlar açılır)
      <select value={currentStage} onChange={e=>set('status',e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm font-normal">
       {STAGES.map(([key,label])=><option key={key} value={key} disabled={!stages.includes(key)}>{label}{!stages.includes(key)?' — koşullar eksik':''}</option>)}
      </select>
     </label>
     {!canOffer&&<p className="flex items-start gap-2 text-xs font-semibold text-amber-800"><ShieldAlert size={16} className="shrink-0"/> Yazılı fiyat teklifine geçmeden önce beş kontrol, hukuki taraf, teslim çıktısı, maliyet ve kapsam tamamlanmalı.</p>}
     {error&&<p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
     {notice&&<p role="status" className="text-xs font-semibold text-emerald-700">{notice}</p>}
     <div className="flex flex-wrap gap-2">
      <button type="submit" disabled={busy} className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
       {busy?'Kaydediliyor...':old?'Satış durumunu güncelle':'Satış kaydı oluştur'}
      </button>
      <button type="button" onClick={copy} disabled={!canOffer} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-bold disabled:opacity-50">
       <Copy size={14}/>{copied?'Taslak kopyalandı':'Yazılı teklif taslağını kopyala'}
      </button>
     </div>
     <p className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
       <FileText size={14} className="mt-0.5 shrink-0"/> Kopyalama, gönderim değildir; otomatik ödeme veya fatura oluşturulmaz. Sözleşmesiz hizmet veya kayıtsız tahsilat başlatmayın.
     </p>
    </>}
   </form>
  )}
  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-950">
   <ClipboardCheck size={16} className="mr-1 inline"/> İlk satış odağı: firmadan gerçek talep, net teknik çıktı, adil emek bedeli, yazılı sözleşme ve ölçülebilir teslim. Kayıtlı ödeme görünmeden gelir yazılmaz.
  </div>
 </section>;
}
