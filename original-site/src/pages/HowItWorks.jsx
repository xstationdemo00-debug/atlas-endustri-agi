import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bot, BriefcaseBusiness, Building2, Check, CheckCircle2, ChevronRight, ClipboardCheck, Factory, FileText, Globe2, HardHat, HelpCircle, LifeBuoy, Package, PlayCircle, ShieldAlert, Truck, Users, Wrench } from 'lucide-react';
import FirmVerificationGuide from '@/components/guide/FirmVerificationGuide';
import GuideModuleMap from '@/components/guide/GuideModuleMap';

const ROLES=[
 {id:'employer',title:'İşveren / proje sahibi',subtitle:'İhtiyacım var, çözüm arıyorum',Icon:Building2,steps:[
  {title:'İşini tanımla',desc:'Hangi işin yapılacağını, konumu, teknik kapsamı, miktarı ve hedef teslim tarihini belirle.',path:'/hizmetler#teklif',cta:'İhtiyaç formu'},
  {title:'Ön değerlendirme yaptır',desc:'İmalat, malzeme, yüklenici ve proje koordinasyonu seçenekleri araştırılır. İlk değerlendirme otomatik sözleşme değildir.',path:'/cozumler',cta:'Çoklu çözümleri gör'},
  {title:'Teklif ve çözüm seçeneğini incele',desc:'İş paketi, teknik kriterler, uygunluk belirsizlikleri ve ticari hizmetin yazılı kapsamı netleştirilir.',path:'/hizmetler#pilot-paket',cta:'Pilot hizmeti incele'},
  {title:'Süreci takip et',desc:'İleride doğrulanmış proje kayıtlarında iş programı, belgeler, kalite ve kabul aşamalarını izle; pilotta yazılı koordinasyon sunulur.',path:'/destek',cta:'Soru sor'}
 ]},
 {id:'manufacturer',title:'Üretici / fason imalatçı',subtitle:'Üretim yaparım, ortaklık arıyorum',Icon:Factory,steps:[
  {title:'Firma kaydını başlat',desc:'Ticari ünvan, vergi dairesi/no, şehir ve iletişim bilgilerini girerek firma dosyanı oluştur.',path:'/firma-kayit',cta:'Firma kaydı'},
  {title:'Kabiliyetlerini belirt',desc:'Faaliyet alanı, üretim ailesi, imalat yöntemleri, malzeme türleri ve bölge bilgilerini gir. Örneğin lazer kesim, büküm, MIG/MAG kaynak, talaşlı imalat veya montaj.',path:'/firma-kayit',cta:'Kabiliyet adımı'},
  {title:'Zorunlu belgeleri yükle',desc:'Vergi levhası, ticaret sicil gazetesi ve imza sirkülerini ekle. Dosyalar özel saklanır; yalnızca firma sahibi ve yetkili yönetici görür.',path:'/firma-kayit',cta:'Belge yükle'},
  {title:'İş paketine uygunluğunu değerlendir',desc:'İlgili proje ve fason işte teknik kapsamı, termin ve kapasiteyi teyit ederek ticari görüşmeye geç.',path:'/projeler',cta:'Proje bölümü'}
 ]},
 {id:'contractor',title:'Yüklenici / taahhüt firması',subtitle:'İş paketi veya taşeron arıyorum',Icon:HardHat,steps:[
  {title:'Proje ve kapsamı belirt',desc:'Saha, imalat, bakım veya montaj kapsamını, teknik standartları ve ihale/iş programı koşullarını topla.',path:'/hizmetler#teklif',cta:'Proje talebi'},
  {title:'Alt yüklenici ve üretici araştır',desc:'Aynı veya tamamlayıcı imalat yapan firma adayları teknik koşullara göre değerlendirilir.',path:'/cozumler',cta:'Çözüm modelleri'},
  {title:'Ticari uygunluğu netleştir',desc:'Firma yetkisi, kapasite, kalite, İSG ve sözleşme sorumlulukları kontrol edilir.',path:'/destek',cta:'Destek merkezi'},
  {title:'Proje aşamalarını yönet',desc:'Teklif, sözleşme, mobilizasyon, uygulama ve teslim kayıtları proje yönetimi yaklaşımıyla izlenebilir; bütün işlemler henüz üretim ortamına açılmamıştır.',path:'/cozumler',cta:'Süreç akışı'}
 ]},
 {id:'supplier',title:'Tedarikçi / lojistik',subtitle:'Malzeme ve hizmet sunuyorum',Icon:Truck,steps:[
  {title:'Firma kaydını ve belgelerini tamamla',desc:'Ürün gruplarını, malzeme niteliklerini ve hizmet bölgeni firma profiline ekle; vergi levhası, ticaret sicil ve imza sirkülerini yükle.',path:'/firma-kayit',cta:'Firma kaydı'},
  {title:'Proje gereksinimlerini anla',desc:'Malzeme standardı, miktar, kalite belgesi ve teslim programını netleştir.',path:'/cozumler',cta:'Proje aşamaları'},
  {title:'Tedarik araştırmasına katıl',desc:'Uygun talebe göre üretici veya tedarikçi adayları kıyaslanabilir; katılım iş veya sipariş garantisi değildir.',path:'/hizmetler#teklif',cta:'Tedarik çözümü'},
  {title:'Teslim ve kabul koşullarını belirle',desc:'Nakliye, depolama, teslim belgeleri ve ticari şartları ilgili taraflarla yazılı netleştir.',path:'/destek',cta:'Destek al'}
 ]},
 {id:'worker',title:'Usta / ekip',subtitle:'Yeteneğimi ve ekip kabiliyetimi göstermek istiyorum',Icon:Users,steps:[
  {title:'Mesleki profilini oluştur',desc:'Meslek, deneyim, çalışma bölgesi ve ekip yetkinliklerini doğru bilgilerinle tanımla.',path:'/register',cta:'Kayıt ol'},
  {title:'Belgelerini yönet',desc:'Mesleki yeterlilik ve İSG belge geçerliliklerini takip et. Hassas sağlık ve kimlik bilgilerini pilot sisteme yükleme.',path:'/belgeler',cta:'Belgeler'},
  {title:'Proje gereksinimlerini öğren',desc:'Projelerde aranan meslek, yetkinlik, süre ve koşulları anla. Örnek ilanları gerçek iş olarak değerlendirme.',path:'/projeler',cta:'Projeler'},
  {title:'Uygun yasal istihdam kanalını kullan',desc:'Platformun personel ihtiyacı ön analizi sunduğunu; fiilî işe aracılık veya geçici işçi sağlama için yetki gerektiğini bil.',path:'/destek',cta:'Sorularını ilet'}
 ]},
 {id:'international',title:'Uluslararası iş ortağı',subtitle:'Türkiye ve dış pazarlar arasında işbirliği arıyorum',Icon:Globe2,steps:[
  {title:'Hedef pazar ve iş kolunu belirt',desc:'Ülke, ürün veya proje türü, imalat standardı ve ticari işbirliği modelini tanımla.',path:'/hizmetler#teklif',cta:'İşbirliği talebi'},
  {title:'Ön araştırma ve uygunluk',desc:'Potansiyel alıcı, üretici veya yüklenici adayları ile belgeler, gümrük ve ihale koşulları incelenir.',path:'/cozumler',cta:'Yaklaşımımız'},
  {title:'Uzman gerektiren işleri ayır',desc:'Hukuk, vergi, ihracat ve uluslararası sözleşme soruları ilgili yetkili uzmanlara bırakılır; hazır partner ağı veya garanti sonuç iddia edilmez.',path:'/destek',cta:'Soru sor'},
  {title:'Pilot teklifi değerlendir',desc:'Araştırma kapsamı ve işbirliği hedefi netleşince koşullu, yazılı hizmet teklifi hazırlanabilir.',path:'/hizmetler#teklif',cta:'Teklif iste'}
 ]}
];

const STAGES=[
 {name:'Proje keşfi',detail:'Resmî ve ticari kaynaklardan fırsat araştırması',icon:'01'},
 {name:'İhtiyaç analizi',detail:'Kapsam, malzeme, belge, yetkinlik ve termin',icon:'02'},
 {name:'Çözüm oluşturma',detail:'Firma, üretici, yüklenici ve tedarikçi adayları',icon:'03'},
 {name:'Teklif ve anlaşma',detail:'Yazılı kapsam, maliyet, yetki ve sözleşme',icon:'04'},
 {name:'İmalat / saha',detail:'İlerleme, iş güvenliği, kalite ve koordinasyon',icon:'05'},
 {name:'Teslim / kabul',detail:'Kontrol, tutanak ve kapanış',icon:'06'}
];

export default function HowItWorks(){
 const [role,setRole]=useState('employer');
 const [step,setStep]=useState(0);
 const [showDetails,setShowDetails]=useState(false);
 const current=useMemo(()=>ROLES.find(x=>x.id===role)||ROLES[0],[role]);
 const next=()=>setStep(i=>Math.min(3,i+1));
 const previous=()=>setStep(i=>Math.max(0,i-1));
 return <div className="min-h-screen bg-slate-50 text-slate-900">
  <header className="bg-slate-950 px-4 py-4 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><Link to="/hizmetler" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-black text-slate-950">A</span><span><strong className="block text-sm">ATLAS ENDÜSTRİ AĞI</strong><span className="text-xs text-slate-300">Proje · Tedarik · İşbirliği</span></span></Link><div className="flex gap-2"><Link to="/destek" className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold">Yardım</Link><Link to="/hizmetler" className="rounded-lg border border-white/30 px-3 py-2 text-xs font-semibold">Hizmetler</Link></div></div></header>
  <main>
   <section className="bg-slate-950 px-4 pb-14 pt-11 text-white"><div className="mx-auto max-w-6xl"><span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300"><PlayCircle size={15}/> Yeni başlayanlar için rehber</span><h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">Atlas Endüstri Ağı nasıl çalışır?</h1><p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">İşveren, üretici, yüklenici, tedarikçi veya usta olmanız fark etmez. Sistem size uygun adımları gösterir; proje keşfi, ihtiyaç analizi, uygun çözüm araştırması ve süreç takibini aynı çatı altında toplamayı hedefler.</p><div className="mt-6 flex flex-wrap gap-3"><a href="#rolunu-sec" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-sm font-black text-slate-950">Rolümü seçip başla <ArrowRight size={16}/></a><a href="#firma-dogrulama-rehberi" className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Firma doğrulama adımları</a></div><p className="mt-4 text-xs text-slate-400">Bu tanıtım işlemleri gerçek proje, kayıt, başvuru veya sözleşme oluşturmaz.</p></div></section>
   <section className="mx-auto max-w-6xl px-4 py-11 sm:px-8"><h2 className="text-2xl font-black">Bir proje sistemde nasıl ilerler?</h2><p className="mt-2 text-sm text-slate-600">Uçtan uca hedeflediğimiz işleyişin kısa özeti:</p><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{STAGES.map(x=><div key={x.icon} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-extrabold text-amber-800">{x.icon}</span><h3 className="mt-3 font-bold">{x.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{x.detail}</p></div>)}</div></section>
   <section id="rolunu-sec" className="scroll-mt-6 border-y border-slate-200 bg-white px-4 py-11 sm:px-8"><div className="mx-auto max-w-6xl">
    <h2 className="text-2xl font-black">Sistemi hangi amaçla kullanacaksınız?</h2><p className="mt-2 text-sm text-slate-600">Bir rol seçin. Size uygun dört adımı, açıklamaları ve ilgili ekran bağlantılarını gösterelim.</p>
    <div role="group" aria-label="Kullanıcı rolünüz" className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ROLES.map(x=>{const Icon=x.Icon;const active=x.id===role;return <button key={x.id} type="button" onClick={()=>{setRole(x.id);setStep(0);setShowDetails(false);}} aria-pressed={active} className={'flex items-center gap-3 rounded-xl border p-4 text-left transition-colors '+(active?'border-amber-500 bg-amber-50 ring-1 ring-amber-400':'border-slate-200 bg-slate-50 hover:border-slate-400')}><span className={'rounded-lg p-2 '+(active?'bg-amber-200':'bg-white')}><Icon size={22}/></span><span className="min-w-0 flex-1"><strong className="block text-sm">{x.title}</strong><span className="mt-1 block text-xs leading-5 text-slate-600">{x.subtitle}</span></span>{active&&<CheckCircle2 size={19} className="shrink-0 text-amber-700"/>}</button>;})}</div>
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-5 text-white"><div><p className="text-xs font-bold text-amber-300">Size özel hızlı başlangıç</p><h3 className="mt-1 text-xl font-black">{current.title}</h3></div><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{step+1} / 4. adım</span></div>
      <div className="grid grid-cols-4 gap-2 px-5 pt-6">{current.steps.map((x,i)=><button key={i} type="button" onClick={()=>setStep(i)} aria-label={(i+1)+'. adıma git'} aria-current={i===step?'step':undefined} className={'h-2 rounded-full '+(i<=step?'bg-amber-500':'bg-slate-200')}/>)}</div>
      <div className="p-5 sm:p-7"><p className="text-xs font-extrabold uppercase tracking-wide text-amber-700">Adım {step+1}</p><h4 className="mt-2 text-xl font-black">{current.steps[step].title}</h4><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">{current.steps[step].desc}</p><div className="mt-6 flex flex-wrap gap-3"><Link to={current.steps[step].path} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white">{current.steps[step].cta} <ArrowRight size={16}/></Link><Link to="/destek" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">Bu adımı sor <HelpCircle size={16}/></Link></div></div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 sm:px-7"><button type="button" onClick={previous} disabled={step===0} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40"><ArrowLeft size={16}/> Önceki</button><span className="text-xs text-slate-500">Bilgilendirme turu</span><button type="button" onClick={step===3?()=>setStep(0):next} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950">{step===3?'Başa dön':'Sonraki'} <ArrowRight size={16}/></button></div>
    </div>
   </div></section>
   <FirmVerificationGuide />
   <GuideModuleMap />
   <section className="mx-auto max-w-6xl px-4 py-12 sm:px-8"><h2 className="text-2xl font-black">Bugün yapabilecekleriniz ve gelecek hedeflerimiz</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6"><h3 className="flex items-center gap-2 font-bold text-emerald-950"><CheckCircle2 size={20}/> Pilot olarak mevcut</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-800"><li>• Proje, tedarik ve işbirliği için talep göndermek</li><li>• Araştırma ve süreç yönetimi hizmetlerinin kapsamını incelemek</li><li>• Firma kaydı, zorunlu belge yükleme ve yönetici doğrulaması</li><li>• Firma/imalat kabiliyetlerini profilde tanımlamak ve eşleştirmede görünmek</li><li>• İhale fırsatlarını filtrelemek, eşleştirme ve bildirim tercihlerini yönetmek</li><li>• Destek talebi açmak ve Atlas Asistan'dan yönlendirme almak</li><li>• Yönetici tarafında fırsat, üretim benzerliği ve kontrol listesi değerlendirmeleri</li></ul></div><div className="rounded-xl border border-slate-200 bg-white p-6"><h3 className="flex items-center gap-2 font-bold"><Wrench size={20}/> Geliştirilmekte / gelecek hedefi</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><li>• Tüm firmalar için otomatik ve doğrulanmış proje eşleştirme</li><li>• Entegre ödeme, sözleşme ve gerçek zamanlı teslim takip otomasyonu</li><li>• Yetkili iş ortaklarıyla uygun personel çözümleri</li><li>• Uluslararası kapsamlı projeler ve taahhüt hizmetleri</li><li>• Yasal, teknik ve mali şartlar sağlandığında anahtar teslim iş üstlenme</li></ul></div></div>
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><ShieldAlert size={21} className="mt-1 shrink-0"/><p><strong>Önemli:</strong> Platform henüz pilot aşamadadır. Örnek projeler ve araştırma firmaları, kesinleşmiş işler veya doğrulanmış ortaklar değildir. İşçi yerleştirme, geçici işçi sağlama, kamu ihalesi üstlenme ve anahtar teslim taahhüt için gerekli izin, sözleşme, teknik ve mali koşullar ayrıca sağlanmalıdır.</p></div>
    <div className="mt-8 flex flex-wrap gap-3"><Link to="/hizmetler#teklif" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white">Proje / tedarik talebi bırak <ArrowRight size={16}/></Link><Link to="/destek" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-bold">Yardım ve iletişim <LifeBuoy size={16}/></Link></div>
   </section>
  </main>
  <div className="mx-auto max-w-6xl px-4 pb-6 text-sm"><Link to="/calisan-haklari" className="font-bold text-amber-700 underline">Çalışan ve usta haklarını koruyan sözleşme ilkelerimiz</Link></div>
  <footer className="bg-slate-950 px-4 py-7 text-center text-xs text-slate-300">Atlas Endüstri Ağı · Kullanım rehberi ve çoklu proje çözümleri · <Link to="/gizlilik" className="underline">Kişisel veri bilgilendirmesi</Link></footer>
 </div>;
}