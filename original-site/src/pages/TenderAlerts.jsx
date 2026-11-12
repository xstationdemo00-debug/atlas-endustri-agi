import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Bell, Building2, CheckCircle2, CreditCard, ExternalLink, RefreshCw, ShieldAlert, Zap } from 'lucide-react';
const isoDate=()=>new Date().toISOString().slice(0,10);
export default function TenderAlerts(){
 const {user}=useAuth();
 const admin=user?.role==='admin';
 const [data,setData]=useState(null);
 const [companies,setCompanies]=useState([]);
 const [subscriptions,setSubscriptions]=useState([]);
 const [selected,setSelected]=useState('');
 const [form,setForm]=useState({invoice_reference:'',valid_until:'',payment_verified:false});
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [preview,setPreview]=useState(null);
 const norm=x=>Array.isArray(x)?x:x?.items||[];
 async function load(){
   if(!user?.id)return;
   setLoading(true);setError('');
   try{
     const tasks=[base44.functions.invoke('tenderMatches',{scope:'my'})];
     if(admin){
       tasks.push(base44.entities.Company.list('-created_date',250));
       tasks.push(base44.entities.TenderAlertSubscription.list('-created_date',250));
     }
     const [m,c,s]=await Promise.all(tasks);
     setData(m?.data??m);
     if(admin){
       const firms=norm(c).filter(x=>!x.is_demo&&x.verification_status==='verified');
       setCompanies(firms);setSubscriptions(norm(s));
       setSelected(previous=>firms.some(x=>x.id===previous)?previous:firms[0]?.id||'');
     }
   }catch(e){setError('Üyelik ve ihale bilgileri alınamadı.');}
   finally{setLoading(false);}
 }
 useEffect(()=>{load();},[user?.id,admin]);
 async function previewDispatch(confirm){
   setBusy(true);setError('');setNotice('');
   try{
    const x=await base44.functions.invoke('tenderMatches',{scope:'admin',confirm_delivery:confirm});
    const d=x?.data??x;
    if(!d?.ok)throw new Error(d?.error||'Eşleştirme başarısız.');
    setPreview(d);
    if(confirm){setNotice('Uygun üyeler için yalnızca uygulama içi bildirimler oluşturuldu.');await load();}
   }catch(e){setError(e.message||'Bildirim işlemi yapılamadı.');}
   finally{setBusy(false);}
 }
 async function addMembership(e){
   e.preventDefault();
   if(!selected||busy)return;
   setBusy(true);setError('');setNotice('');
   try{
     if(!form.invoice_reference.trim()||!form.valid_until)throw new Error('Fatura/ödeme referansı ve geçerlilik tarihi gerekir.');
     if(form.valid_until<isoDate())throw new Error('Üyelik son tarihi geçmiş olamaz.');
     if(!form.payment_verified)throw new Error('Gerçek ödeme ve fatura doğrulanmadan üyelik aktif edilemez.');
     const existing=subscriptions.find(x=>x.company_id===selected&&x.status==='active'&&x.payment_verified);
     if(existing)throw new Error('Bu firmanın zaten aktif doğrulanmış aboneliği var.');
     await base44.entities.TenderAlertSubscription.create({
       company_id:selected,plan_name:'Pilot ihale eşleştirme üyeliği',
       status:'active',payment_verified:true,payment_verified_at:new Date().toISOString(),
       valid_until:form.valid_until,invoice_reference:form.invoice_reference.trim(),is_demo:false
     });
     setForm({invoice_reference:'',valid_until:'',payment_verified:false});
     setNotice('Üyelik yalnızca yöneticinin yaptığı ödeme doğrulamasıyla aktifleştirildi.');
     await load();
   }catch(e){setError(e.message||'Üyelik oluşturulamadı.');}
   finally{setBusy(false);}
 }
 return <div className="mx-auto max-w-7xl space-y-5">
  <header><p className="text-xs font-bold uppercase text-amber-700">Atlas Endüstri Ağı</p><h1 className="mt-1 text-2xl font-black">Üyelere özel ihale eşleştirme</h1><p className="mt-2 text-sm text-muted-foreground">İş alanlarına ve imalat kabiliyetlerine uygun ihale ön araştırmaları; tercih, firma doğrulaması ve ücretli üyelik kontrolüyle sunulur.</p></header>
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><ShieldAlert size={18} className="mr-1 inline"/>İhale eşleşmesi teklif hakkı, ihale katılım yeterliği veya iş garantisi değildir. Resmî şartname ve güncel ilan ayrı kontrol edilir. E-posta ve WhatsApp toplu gönderimleri bu özellikte devre dışıdır.</div>
  {loading&&<p className="text-sm text-muted-foreground">Üyelik ve eşleşmeler yükleniyor...</p>}
  {error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
  {notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
  <div className="grid gap-3 sm:grid-cols-3">{[['Eşleşen ihale',data?.matches?.length||0],['Bildirim uygunluğu olan firma',data?.eligible_companies||0],['Üyelik durumu',data?.status==='active'?'Aktif':'Henüz aktif değil']].map(([name,value])=><div key={name} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{name}</p><p className="mt-2 text-xl font-black">{value}</p></div>)}</div>
  {data?.status!=='active'&&<div className="rounded-xl border border-border bg-card p-5"><h2 className="font-bold">Özel bildirimler henüz aktif değil</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Önce firma kaydı ve imalat kabiliyetleri, yönetici firma doğrulaması, firmanın bildirim tercihi ve belgeli ücretli üyelik gerekir. Üyelik için henüz çevrim içi ödeme altyapısı açılmadı.</p><div className="mt-4 flex flex-wrap gap-3"><Link to="/firmalar" className="rounded-lg border border-border px-4 py-2 text-sm font-bold">Firma profilim</Link><Link to="/ihaleler" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white">Ücretsiz ihale panosu</Link></div></div>}
  {(data?.matches||[]).length>0&&<section className="grid gap-3 md:grid-cols-2">{data.matches.map((m,i)=><div key={m.id+'-'+i} className="rounded-xl border border-border bg-card p-5"><span className="text-xs font-bold text-amber-700">{m.notice_reference} · Eşleşme {m.score}/100</span><h3 className="mt-2 font-bold">{m.title}</h3><p className="mt-2 text-xs text-muted-foreground">{m.company_name} · {m.city} · {m.deadline}</p><p className="mt-2 text-xs">{(m.reasons||[]).join(' · ')}</p><a href={m.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-amber-700 underline">Resmî kaynağı kontrol et <ExternalLink size={13}/></a></div>)}</section>}
  {admin&&<section className="space-y-4 rounded-xl border border-border bg-card p-5">
    <h2 className="flex items-center gap-2 text-lg font-bold"><Zap size={20}/> Yönetici · Ücretli üyelik ve bildirim denetimi</h2>
    <p className="text-sm text-muted-foreground">Şirket ve gerçek ödeme doğrulaması olmadan üyelik aktivasyonu yapılmaz. Bildirimler tekrar gönderimi önleyen kayıtlarla oluşturulur.</p>
    <div className="grid gap-4 lg:grid-cols-2">
     <form onSubmit={addMembership} className="space-y-3 rounded-lg border border-border p-4">
       <h3 className="font-bold">Doğrulanmış ücretli üyelik</h3><label className="block text-xs font-semibold">Doğrulanmış firma<select required value={selected} onChange={e=>setSelected(e.target.value)} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm"><option value="">Firma seçin</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
       <label className="block text-xs font-semibold">Fatura / ödeme doğrulama referansı<input value={form.invoice_reference} onChange={e=>setForm(p=>({...p,invoice_reference:e.target.value}))} required className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm" placeholder="Gerçek tahsilatın belgeli referansı"/></label>
       <label className="block text-xs font-semibold">Geçerlilik son tarihi<input type="date" required value={form.valid_until} onChange={e=>setForm(p=>({...p,valid_until:e.target.value}))} className="mt-1 block w-full rounded-md border border-border bg-background p-2 text-sm"/></label>
       <label className="flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5" checked={form.payment_verified} onChange={e=>setForm(p=>({...p,payment_verified:e.target.checked}))}/>Ödemenin gerçekten tahsil edildiğini ve yasal faturalama şartlarını kontrol ettim; yalnızca kanıtı olan üyeliği aktif ediyorum.</label>
       <button type="submit" disabled={busy||companies.length===0} className="w-full rounded-lg bg-slate-950 px-4 py-3 text-xs font-bold text-white disabled:opacity-40">Belge kontrollü üyeliği aktifleştir</button>
     </form>
     <div className="space-y-3 rounded-lg border border-border p-4">
       <h3 className="font-bold">Bildirim eşleştirmesini çalıştır</h3><p className="text-sm leading-6 text-muted-foreground">Sistem yalnızca onaylı, bildirimi kabul eden ve ücretli üyeliği teyit edilmiş şirketleri güncel tarihli ilanlarla karşılaştırır.</p>
       <button disabled={busy} onClick={()=>previewDispatch(false)} className="rounded-lg border border-border px-4 py-2 text-xs font-bold">Yeni eşleşmeleri önizle</button>
       {preview&&<p className="text-xs">Üye: {preview.eligible_companies||0} · Açık tarihli ilan: {preview.active_tenders??'—'} · Yeni eşleşme: {preview.pending_matches??'—'} · Gönderilen: {preview.created??0}</p>}
       <button disabled={busy||preview?.mode!=='preview'||!(preview.pending_matches>0)} onClick={()=>previewDispatch(true)} className="block rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-40">Önizlemeyi onayla ve uygulama içi bildir</button>
       <p className="text-xs text-muted-foreground">Otomatik zamanlayıcı bu Base44 planında aktif değil; bu panel, kayıt değiştikçe otomatik eşleştirme hesaplar ve yönetici onayıyla bildirim oluşturur. Dış kanallara kendiliğinden mesaj göndermez.</p>
     </div>
    </div>
    <p className="text-xs text-muted-foreground">Doğrulanmış şirketler: {companies.length} · Elle doğrulanmış abonelik kayıtları: {subscriptions.length} (demo hariç)</p>
  </section>}
 </div>;
}