import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PilotReadinessPanel from '@/components/commercial/PilotReadinessPanel';
import PilotQualificationPanel from '@/components/commercial/PilotQualificationPanel';
import RevenuePilotSalesPanel from '@/components/commercial/RevenuePilotSalesPanel';
import FirstSalesOutreach from '@/components/commercial/FirstSalesOutreach';
import ContactCompliancePanel from '@/components/commercial/ContactCompliancePanel';
import SalesFollowUpDesk from '@/components/commercial/SalesFollowUpDesk';
import { ArrowUpRight, Banknote, Building2, ClipboardList, Plus, RefreshCw, ShieldAlert } from 'lucide-react';

const TYPES = [
  {value:'supplier_research',label:'Tedarikçi araştırması'},
  {value:'subcontractor_research',label:'Alt yüklenici araştırması'},
  {value:'procurement_scope',label:'Teknik talep / şartname analizi'},
  {value:'turkey_partnership',label:'Türkiye iş ortaklığı araştırması'},
  {value:'crossborder_partnership',label:'Uluslararası ticari ortak araştırması'},
  {value:'project_lifecycle',label:'Proje süreci ve çoklu çözüm analizi'},
  {value:'team_need_analysis',label:'Usta / ekip ihtiyacı ön analizi'},
];
const STATUS = [
  {value:'new',label:'Yeni talep'},
  {value:'qualified',label:'Kapsam netleşiyor'},
  {value:'quoted',label:'Teklif verildi'},
  {value:'won',label:'Sözleşmeli'},
  {value:'delivered',label:'Teslim edildi'},
  {value:'lost',label:'Kazanılamadı'},
  {value:'cancelled',label:'İptal'},
];
const EMPTY = {company_name:'',contact_name:'',contact_email:'',phone:'',city:'',trade:'',service_type:'supplier_research',description:''};
const fmt = (n) => new Intl.NumberFormat('tr-TR', {style:'currency',currency:'TRY',maximumFractionDigits:0}).format(Number(n)||0);
const known = (v) => TYPES.find(t=>t.value===v)?.label||v;

export default function CommercialDesk() {
  const {user} = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items,setItems] = useState([]);
  const [prospects,setProspects] = useState([]);
  const [form,setForm] = useState(EMPTY);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [expanded,setExpanded] = useState(false);

  async function load() {
    try {
      setError('');
      const [inquiries, leads] = await Promise.all([
        base44.entities.ServiceInquiry.list('-created_date',100),
        isAdmin ? base44.entities.B2BProspect.list('-created_date',100) : Promise.resolve([])
      ]);
      setItems(inquiries); setProspects(leads);
    } catch(e){setError('Talepler ya da satış adayları yüklenemedi. Yetki ve bağlantıyı kontrol edin.');}
  }
  useEffect(()=>{load();},[user?.id]);

  async function create(event) {
    event.preventDefault(); setBusy(true);setError('');setNotice('');
    try {
      await base44.entities.ServiceInquiry.create({...form});
      setForm(EMPTY);setExpanded(false);setNotice('Talep kaydedildi. Henüz müşteriye fiyat teklifi veya ödeme isteği gönderilmedi.');await load();
    } catch(e) {setError('Talep kaydedilemedi. Zorunlu alanları ve bağlantınızı kontrol edin.');}
    finally{setBusy(false);}
  }
  async function update(entry,patch) {
    if(!isAdmin)return;
    setBusy(true);setError('');setNotice('');
    try {await base44.entities.ServiceInquiry.update(entry.id,patch);await load();setNotice('Ticari kayıt güncellendi.');}
    catch(e){setError('Kayıt güncellenemedi. Yetki ve veri doğrulamasını kontrol edin.');}
    finally{setBusy(false);}
  }
  const live=items.filter(x=>!x.is_demo);
  const collected=live.reduce((sum,x)=>sum+(Number(x.collected_amount)||0),0);
  const contracted=live.filter(x=>x.status==='won'||x.status==='delivered').length;
  const quoted=live.filter(x=>x.status==='quoted').length;

  return <div className="mx-auto w-full max-w-7xl space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Atlas Endüstri Ağı / Ticari pilot</p><h1 className="mt-1 text-2xl font-extrabold">Gelir ve B2B talep merkezi</h1><p className="mt-2 text-sm text-muted-foreground">Tedarik, alt yüklenici araştırması ve teknik kapsam hizmetleri için gerçek talepleri ve tahsilatı takip edin.</p></div>
      <div className="flex flex-wrap gap-2"><Link to="/ilk-hizmet" className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold">İlk satılabilir hizmet <ArrowUpRight size={15}/></Link><button onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold"><RefreshCw size={14}/>Yenile</button></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[['Gerçek talepler',live.length,ClipboardList],['Teklif verilen',quoted,Building2],['Sözleşmeli',contracted,Building2],['Kaydedilen tahsilat',fmt(collected),Banknote]].map(([label,value,Icon])=><div key={label} className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between text-xs text-muted-foreground">{label}<Icon size={18}/></div><p className="mt-3 text-2xl font-black">{value}</p></div>)}
    </div>
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><ShieldAlert size={17} className="mr-2 inline"/>Burası ödeme işlemcisi değildir. Tahsilatı ancak gerçek banka kaydı ve fatura/sözleşme ile doğruladıktan sonra kaydedin. Örnek projeler gelir veya müşteri sayılmaz.</div>
    {isAdmin && <PilotReadinessPanel prospects={prospects} realRequests={live.length} />}
    {isAdmin && <SalesFollowUpDesk prospects={prospects} onChange={load} />}
    {isAdmin && <ContactCompliancePanel prospects={prospects} onChange={load} />}
    {isAdmin && <FirstSalesOutreach prospects={prospects} onChange={load} />}
    {isAdmin && <PilotQualificationPanel inquiries={items} />}
    {isAdmin && <RevenuePilotSalesPanel inquiries={items} />}
    {notice&&<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}
    {error&&<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</div>}
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">B2B hizmet talebi kaydı</h2><p className="text-xs text-muted-foreground">E-postadan gelen veya firmayla görüşülerek doğrulanan ticari ihtiyacı kayıt altına alın.</p></div><button type="button" onClick={()=>setExpanded(!expanded)} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950"><Plus size={16}/> Yeni talep</button></div>
      {expanded&&<form onSubmit={create} className="mt-5 grid gap-3 border-t pt-5 sm:grid-cols-2">
        {[['company_name','Firma adı *'],['contact_name','Yetkili kişi'],['contact_email','İş e-postası *'],['phone','Telefon'],['city','Şehir'],['trade','İş kolu']].map(([k,label])=><label key={k} className="block text-xs font-bold">{label}<input className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal" type={k==='contact_email'?'email':'text'} required={k==='company_name'||k==='contact_email'} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} maxLength={k==='description'?3500:180}/></label>)}
        <label className="block text-xs font-bold sm:col-span-2">Hizmet<select className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal" value={form.service_type} onChange={e=>setForm(p=>({...p,service_type:e.target.value}))}>{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
        <label className="block text-xs font-bold sm:col-span-2">İhtiyaç / iş kapsamı *<textarea rows={4} required minLength={15} maxLength={3500} className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></label>
        <button disabled={busy} type="submit" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">{busy?'Kaydediliyor...':'Talep kaydet'}</button>
      </form>}
    </section>
    <section className="space-y-3">
      <h2 className="font-bold">Gerçek ticari fırsatlar</h2>
      {live.length===0&&<div className="rounded-xl border border-dashed border-border bg-card p-8 text-center"><p className="font-semibold">Henüz gerçek müşteri talebi bulunmuyor.</p><p className="mt-2 text-sm text-muted-foreground">Hizmet sayfanızı firmalarla paylaşın. Gelen e-postaları doğruladıktan sonra buraya kaydedin.</p><Link to="/hizmetler" className="mt-3 inline-flex text-sm font-bold text-amber-700">B2B hizmet sayfasını görüntüle</Link></div>}
      {live.map(entry=><article key={entry.id} className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{entry.company_name}</h3><p className="mt-1 text-xs text-muted-foreground">{known(entry.service_type)} · {entry.city||'Şehir belirtilmedi'} · {entry.contact_email}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{STATUS.find(s=>s.value===entry.status)?.label||entry.status}</span></div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{entry.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">Teklif: {fmt(entry.quoted_amount)} · Tahsilat: {fmt(entry.collected_amount)}</p>
        {isAdmin&&<div className="mt-3 flex flex-wrap items-end gap-3 border-t pt-3">
          <label className="text-xs font-semibold">Aşama<select disabled={busy} value={entry.status} onChange={e=>update(entry,{status:e.target.value})} className="mt-1 block rounded-md border border-border bg-background px-2 py-2 text-xs">{STATUS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
          <form onSubmit={e=>{e.preventDefault();const amount=Number(e.currentTarget.elements.amount.value);if(!Number.isFinite(amount)||amount<0)return;update(entry,{quoted_amount:amount});}} className="flex items-end gap-2"><label className="text-xs font-semibold">Teklif bedeli (TL)<input name="amount" type="number" min="0" step="1" defaultValue={Number(entry.quoted_amount)||0} className="mt-1 block w-28 rounded-md border border-border bg-background px-2 py-2 text-xs"/></label><button disabled={busy} className="rounded-md border border-border px-2 py-2 text-xs font-bold">Kaydet</button></form>
        </div>}
      </article>)}
    </section>

    {isAdmin&&<section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Satış adayları / ticari takip</h2><p className="text-xs text-muted-foreground">Araştırılan firmalar müşterimiz değildir; ücretli iş ve tahsilat sayılmaz. Toplu ticari ileti öncesinde izin ve ret kontrolleri gereklidir.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">{prospects.filter(x=>!x.is_demo).length} aday</span></div>
      <div className="grid gap-3 lg:grid-cols-2">
        {prospects.filter(x=>!x.is_demo).map(p=><article key={p.id} className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-bold">{p.company_name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{p.city} · {p.sector}</p>
          <p className="mt-3 text-sm">{p.opportunity_fit}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <a href={p.source_url} target="_blank" rel="noreferrer" className="font-semibold text-amber-700 underline">Kaynak / İletişim</a>
            {p.phone&&<a href={'tel:'+p.phone.replace(/[^\d+]/g,'')} className="font-semibold underline">Telefon: {p.phone}</a>}
            {p.contact_email&&<span className="text-muted-foreground">{p.contact_email}</span>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
            <label className="text-xs font-semibold">Satış aşaması
              <select value={p.stage||'researched'} disabled={busy||p.opt_out} onChange={async(e)=>{setBusy(true);try{await base44.entities.B2BProspect.update(p.id,{stage:e.target.value});await load();}catch(err){setError('Satış kaydı güncellenemedi.');}finally{setBusy(false);}}} className="mt-1 block rounded-md border border-border bg-background p-2 text-xs">
                <option value="researched">Araştırıldı</option>
                <option value="draft_ready">Özelleştirilmiş e-posta taslağı hazır</option>
                <option value="contact_allowed">İletişim uygunluğu doğrulandı</option>
                <option value="contacted">İletişime geçildi</option>
                <option value="replied">Yanıt verdi</option>
                <option value="qualified">İhtiyaç doğrulandı</option>
                <option value="proposal_sent">Teklif gönderildi</option>
                <option value="won">Anlaşma yapıldı</option>
                <option value="lost">Sonuçlanmadı</option>
                <option value="blocked">İletişim reddi</option>
              </select>
            </label>
            {p.opt_out&&<span className="text-xs font-bold text-red-700">Ticari ileti göndermeyin</span>}
          </div>
        </article>)}
      </div>
    </section>}
    {isAdmin&&<p className="text-xs text-muted-foreground">Tahsil edilen tutar alanı otomatik oluşmaz. Doğrulanmış ödeme belgeleri ve yasal faturalandırma süreci hazır olduğunda yönetimsel kayda alınır.</p>}
  </div>;
}
