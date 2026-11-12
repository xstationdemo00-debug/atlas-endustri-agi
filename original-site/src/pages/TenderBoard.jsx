import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpenCheck, Building2, CalendarClock, ClipboardCheck, ExternalLink, Factory, Filter, Globe2, HardHat, MapPin, RefreshCw, Search, ShieldAlert, SlidersHorizontal, Wrench } from 'lucide-react';

const official=[
 {title:'EKAP · Türkiye kamu ihaleleri',url:'https://ekap.kik.gov.tr/ekap/ortak/ihalearama/index.html',scope:'Türkiye'},
 {title:'TED · Avrupa Birliği ihaleleri',url:'https://ted.europa.eu/en/',scope:'Avrupa Birliği'},
 {title:'UNGM · BM tedarik ilanları',url:'https://www.ungm.org/public/notice',scope:'Uluslararası'},
 {title:'EBRD ECEPP · Proje alımları',url:'https://ecepp.ebrd.com/',scope:'Avrupa ve çevre ülkeler'},
 {title:'Dünya Bankası · Tedarik projeleri',url:'https://projects.worldbank.org/en/projects-operations/procurement',scope:'Küresel'}
];
const sectors={
machining:'CNC / talaşlı imalat',industrial_maintenance:'Endüstriyel bakım',mechanical_installation:'Mekanik montaj',
piping:'Borulama',welding:'Kaynaklı imalat',coating:'Yüzey işlemleri / boya',structural_steel:'Çelik konstrüksiyon',
construction:'Yapım işleri',industrial_equipment:'Endüstriyel ekipman',material_supply:'Malzeme tedariği'
};
const dateFmt=new Intl.DateTimeFormat('tr-TR',{year:'numeric',month:'long',day:'numeric'});
function formatDate(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return 'Belirtilmedi';const [y,m,d]=s.split('-').map(Number);return dateFmt.format(new Date(Date.UTC(y,m-1,d,12)));}
const buyerType={municipality:'Belediye / bağlı idare',central_government:'Devlet / merkezi idare',public_enterprise:'Kamu işletmesi',private_company:'Özel sektör',international_institution:'Uluslararası kurum'};
const PUBLIC_NOTE='Bu ilanlar kaynak kontrolü yapılmış ön araştırma kayıtlarıdır; canlı ihale beslemesi veya kesin güncel açık ihale durumu değildir. Zeyilname, iptal, teklif tarihi, ihale yöntemi ve katılım/yeterlik koşullarını resmî kaynaktan mutlaka doğrulayın. Atlas, ilanı veren kurum veya ihaleyi üstlenen taraf değildir.';
export default function TenderBoard(){
 const [tenders,setTenders]=useState([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [search,setSearch]=useState('');
 const [city,setCity]=useState('all');
 const [sector,setSector]=useState('all');
 const [visibility,setVisibility]=useState('future');
 const [updatedAt,setUpdatedAt]=useState('');
 async function load(){
  setLoading(true);setError('');
  try{
   const api='https://atlas-endustri-agi-independent.onrender.com/api/tenders';
   const res=await fetch(api,{method:'GET',cache:'no-store',credentials:'omit',headers:{Accept:'application/json'}});
   const data=await res.json();
   if(!res.ok||!data.ok||!Array.isArray(data.tenders))throw new Error('İhale verileri alınamadı.');
   setTenders(data.tenders);
   setUpdatedAt(data.generated_at||'');
  }catch(e){setError('Fırsat listesine şu anda erişilemiyor. Lütfen resmî kaynak portallarını kullanın.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{load();},[]);
 const cities=useMemo(()=>[...new Set(tenders.map(x=>x.city).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr')),[tenders]);
 const upcoming=tenders.filter(x=>!x.deadline_passed);
 const history=tenders.filter(x=>x.deadline_passed);
 const filtered=useMemo(()=>tenders.filter(x=>{
   if(visibility==='future'&&x.deadline_passed)return false;
   if(visibility==='past'&&!x.deadline_passed)return false;
   if(city!=='all'&&x.city!==city)return false;
   if(sector!=='all'&&!x.related_sectors?.includes(sector))return false;
   const q=search.toLocaleLowerCase('tr-TR').trim();
   if(q&&!([x.title,x.buyer_name,x.notice_reference,x.industry,x.city,x.public_summary].join(' ').toLocaleLowerCase('tr-TR').includes(q)))return false;
   return true;
 }),[tenders,search,city,sector,visibility]);
 return <div className="min-h-screen bg-slate-50 text-slate-900">
  <header className="bg-slate-950 px-4 py-4 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Link to="/hizmetler" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-lg font-black text-slate-950">A</span><span><strong className="block text-sm">ATLAS ENDÜSTRİ AĞI</strong><small className="text-xs text-slate-300">Proje · Tedarik · İşbirliği</small></span></Link><Link to="/nasil-calisir" className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold">Sistem rehberi</Link></div></header>
  <section className="bg-slate-950 px-4 pb-11 pt-11 text-white"><div className="mx-auto max-w-6xl">
   <span className="inline-flex items-center gap-2 rounded-full border border-amber-600/60 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300"><Search size={14}/> Proje keşif radarı · pilot</span>
   <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">İhale ve proje fırsatları, tek ekranda.</h1>
   <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">Sanayi, mekanik imalat, su ve enerji altyapısı, kaynaklı işler, bakım, malzeme ve taahhüt alanlarıyla ilgili kamu fırsatlarını araştırıyor; resmî ilan bağlantılarıyla birlikte gösteriyoruz. Firmalar kendi iş kabiliyetine uygun ilanları kolayca inceleyebilir.</p>
   <div className="mt-7 flex flex-wrap gap-3"><a href="#liste" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950">Fırsatları incele <ArrowRight size={17}/></a><Link to="/hizmetler#teklif" className="rounded-lg border border-white/40 px-5 py-3 text-sm font-bold">Proje desteği iste</Link></div>
  </div></section>
  <main>
   <section className="mx-auto max-w-6xl px-4 py-8">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
     {[['Kaynaklı ilan kaydı',tenders.length],['Tarihi yaklaşan',upcoming.length],['Geçmiş tarihliler',history.length]].map(([name,count])=><div key={name} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-600">{name}</p><p className="mt-2 text-3xl font-black">{loading?'—':count}</p></div>)}
    </div>
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950"><ShieldAlert className="mt-0.5 shrink-0" size={19}/><p>{PUBLIC_NOTE}</p></div>
   </section>
   <section id="liste" className="mx-auto max-w-6xl scroll-mt-5 px-4 pb-12">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-black">Araştırılan ihaleler</h2><p className="mt-1 text-sm text-slate-600">Önce iş kabiliyetinize ve bölgenize göre filtreleyin.</p></div><button onClick={load} type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"><RefreshCw size={16}/> Listeyi yenile</button></div>
    <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
     <label className="text-xs font-bold">İlan / İKN / kurum ara <span className="relative mt-2 block"><Search size={17} className="absolute left-3 top-3 text-slate-500"/><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Örn. CNC, 2026/..., GASKİ" className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm font-normal outline-none focus:border-amber-500"/></span></label>
     <label className="text-xs font-bold">Şehir<select value={city} onChange={e=>setCity(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal"><option value="all">Tüm şehirler</option>{cities.map(x=><option key={x}>{x}</option>)}</select></label>
     <label className="text-xs font-bold">İmalat / iş alanı<select value={sector} onChange={e=>setSector(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal"><option value="all">Tüm iş alanları</option>{Object.entries(sectors).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
     <label className="text-xs font-bold">İhale tarihi<select value={visibility} onChange={e=>setVisibility(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-normal"><option value="future">Tarihi henüz geçmeyenler</option><option value="all">Tüm kayıtlar</option><option value="past">Tarihi geçenler</option></select></label>
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{loading?'Yükleniyor...':filtered.length+' sonuç gösteriliyor'}</span><span>İlan tarihleri Türkiye yerel saati · Güncel durum için asıl kaynağa bakın</span></div>
    {error&&<p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!loading&&!error&&filtered.length===0&&<div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><Filter size={28} className="mx-auto text-slate-500"/><h3 className="mt-3 font-bold">Bu ölçütlerde ilan bulunamadı</h3><p className="mt-2 text-sm text-slate-600">Şehir, sektör veya tarih filtresini değiştirin. Bu, resmî portallarda başka ilan bulunmadığı anlamına gelmez.</p><button onClick={()=>{setSearch('');setCity('all');setSector('all');setVisibility('future');}} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold">Filtreleri temizle</button></div>}
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
     {filtered.map(x=><article key={x.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs"><span className={'rounded-full px-3 py-1 font-bold '+(x.deadline_passed?'bg-slate-100 text-slate-700':'bg-amber-100 text-amber-900')}>{x.deadline_passed?'İhale tarihi geçti':'İhale tarihi yaklaşan'}</span><span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Kaynağı kontrol edildi</span></div>
      <h3 className="mt-3 text-lg font-black leading-6">{x.title}</h3>
      <p className="mt-2 flex items-start gap-2 text-sm text-slate-600"><Building2 size={16} className="mt-0.5 shrink-0"/>{x.buyer_name}</p>
      <p className="mt-3 text-sm leading-6 text-slate-700">{x.public_summary}</p>
      <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 text-xs sm:grid-cols-2"><div className="flex items-center gap-2"><CalendarClock size={15} className="text-amber-700"/><span><strong>İhale:</strong> {formatDate(x.deadline)} {x.deadline_time}</span></div><div className="flex items-center gap-2"><MapPin size={15} className="text-amber-700"/><span>{x.city}, {x.country}</span></div><div className="sm:col-span-2"><strong>İKN:</strong> {x.notice_reference}</div><div className="sm:col-span-2"><strong>Alan:</strong> {x.industry}</div></div>
      <div className="mt-3 flex flex-wrap gap-1.5">{(x.related_sectors||[]).slice(0,4).map(s=><span key={s} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">{sectors[s]||s}</span>)}</div>
      <p className="mt-4 text-[11px] leading-5 text-slate-500">Kaynak kontrol tarihi: {x.publication_checked_at?formatDate(x.publication_checked_at.slice(0,10)):'Belirtilmedi'}. Bu tarih sonradan değişmiş olabilir; iptal, değişiklik ve uygunluk durumunu yeniden inceleyin.</p>
      <div className="mt-auto flex flex-wrap gap-2 pt-5"><a href={x.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-xs font-bold text-white hover:bg-slate-800">{x.source_url.includes('ekap.kik.gov.tr')?'EKAP’ta İKN ile ara':'Resmî ilanı incele'} <ExternalLink size={14}/></a><Link to={'/hizmetler?ikn='+encodeURIComponent(x.notice_reference)+'#teklif'} className="inline-flex items-center gap-2 rounded-lg border border-amber-500 px-4 py-3 text-xs font-bold text-amber-900 hover:bg-amber-50">Bu iş için çözüm araştır <ArrowRight size={14}/></Link></div>
     </article>)}
    </div>
   </section>
   <section className="border-t border-slate-200 bg-white px-4 py-12"><div className="mx-auto max-w-6xl"><h2 className="flex items-center gap-2 text-2xl font-black"><Globe2 size={25} className="text-amber-700"/> Türkiye ve uluslararası resmî kaynaklar</h2><p className="mt-2 max-w-3xl text-sm text-slate-600">Atlas'taki liste seçilmiş bir ön araştırmadır. Bütün ilanları ve güncel değişiklikleri görmek için doğrudan resmî kaynakları kullanın.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{official.map(x=><a href={x.url} target="_blank" rel="noopener noreferrer" key={x.url} className="rounded-xl border border-slate-200 p-4 hover:border-amber-400"><strong className="flex items-center justify-between gap-2 text-sm">{x.title} <ArrowUpRight size={15}/></strong><span className="mt-2 block text-xs text-slate-500">{x.scope}</span></a>)}</div></div></section>
  </main><footer className="bg-slate-950 px-4 py-7 text-center text-xs text-slate-300">Atlas Endüstri Ağı · Bağımsız fırsat araştırma panosu · <Link to="/destek" className="underline">Destek</Link> · <Link to="/hizmetler" className="underline">Hizmetler</Link></footer>
 </div>;
}