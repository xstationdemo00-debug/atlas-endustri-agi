import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, ClipboardList, Factory, FileCheck2, SearchCheck, ShieldCheck, Wrench } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import PublicEmailInquiry from '@/components/commercial/PublicEmailInquiry';

const PACKAGES=[
  {icon:SearchCheck,title:'Tedarikçi ön araştırması',type:'Tedarikçi / üretici araştırması',
   description:'Firmanın verdiği teknik ihtiyaç için uygun olabilecek tedarikçi veya üreticileri kaynaklarıyla karşılaştıran masa başı araştırma.',
   outputs:['İş kapsamı ve teknik ihtiyaç listesi','Kapsama göre seçilecek sayıda araştırılmış firma adayı','Üretim kabiliyeti / malzeme / konum karşılaştırması','Eksik bilgi ve firma tarafından ayrıca doğrulanması gerekenler']},
  {icon:Factory,title:'Fason üretim / alt yüklenici ön araştırması',type:'Fason üretici araştırması',
   description:'Lazer kesim, büküm, kaynak, borulama veya talaşlı imalat gibi işlerde farklı üretim yeteneklerinin araştırılması.',
   outputs:['İş paketi ve süreç gereksinimleri','Uygun olabilecek üretim atölyelerinin kaynaklı ön listesi','Malzeme ve proses uyumu için karşılaştırma','Keşif, kalite belgeleri ve kapasite doğrulama soruları']},
  {icon:FileCheck2,title:'Teknik kapsam ön değerlendirme',type:'Teknik talep inceleme',
   description:'İmalat veya tedarik talebinin eksik teknik bilgilerini, risklerini ve satın alma için gerekli soruları önceden belirleme.',
   outputs:['Talebin kapsam ve teslim çıktı matrisi','Netleştirilmesi gereken teknik sorular','Tahmini iş adımları / tedarik grupları','Bağımsız mühendislik onayı gerektiren noktaların işaretlenmesi']},
];
const STEPS=['Talebi ve teknik kapsamı alıyoruz','Kapsamı, teslimatları ve adil emek maliyetini netleştiriyoruz','Uygun hukuki/faturalama koşulları sağlandığında yazılı teklif sunuyoruz','Müşteri onayı ve sözleşme sonrasında araştırmayı yürütüyoruz','Kaynaklı raporu teslim edip kabul ve ödeme kayıtlarını doğruluyoruz'];
export default function FirstPaidService(){
 const {user}=useAuth()||{};
 const link=user?.email?'/guvenli-talep':'/register?returnTo=%2Fguvenli-talep';
 return <div className="min-h-screen bg-slate-50 text-slate-900">
  <header className="bg-slate-950 px-4 py-5 text-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
   <Link to="/" className="text-sm font-black tracking-wider">ATLAS ENDÜSTRİ AĞI</Link>
   <Link to="/hizmetler" className="text-xs font-bold text-amber-300 underline">Diğer hizmetler</Link>
  </div></header>
  <main>
   <section className="bg-slate-950 px-4 pb-12 pt-10 text-white">
    <div className="mx-auto max-w-6xl">
     <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-amber-300"><Wrench size={16}/> İlk ticari hizmet pilotu</p>
     <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight sm:text-4xl">Sanayi firmanızın doğru üreticiye ve tedarikçiye ulaşması için araştırma desteği</h1>
     <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Tedarikçi, fason atölye ve teknik kapsam ihtiyacını somut araştırma raporuna dönüştürmek için ön talep alıyoruz. Bu bir ön araştırma hizmetidir; doğrulanmış kapasite, fiyat, ortaklık veya satın alma sonucu garanti edilmez.</p>
     <p className="mt-3 max-w-3xl text-xs leading-6 text-amber-100">Atlas'ın çıkış noktası nitelikli insan emeğidir. Kaynakçı, imalatçı, borucu ve montaj ekiplerinin bilgi, beceri ve deneyimini görünür kılan; adil ve şeffaf sanayi iş birliklerini geliştiren bir ağ kurmayı hedefliyoruz. Bu hedef, mevcut pilot ön araştırma hizmetinden ayrı olarak aşamalı biçimde geliştirilecektir.</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
      <a href="#dogrudan-talep" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950">Ücretsiz ön talep gönder <ArrowRight size={17}/></a>
      {!user?.email&&<Link to="/login?returnTo=%2Fguvenli-talep" className="rounded-xl border border-white/40 px-4 py-3 text-xs font-bold">Hesabım var, giriş yap</Link>}
     </div>
     <p className="mt-3 text-xs text-slate-400">Üyelik olmadan e-postayla ilk temasa geçebilirsiniz; kayıtlı kullanıcılar güvenli formu da kullanabilir.</p>
     <div className="mt-6 max-w-3xl rounded-xl border border-amber-300/30 bg-amber-400/10 p-4">
      <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">İlk pilot paket · tanıtım başlangıç bedeli</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-3"><strong className="text-3xl font-black text-white">2.900 TL</strong><span className="text-xs text-slate-300">Standart kapsam için açıklanan başlangıç bedeli</span></div>
      <p className="mt-2 text-xs leading-6 text-slate-200">Tek iş kalemi, tek bölge, en fazla 3 araştırılmış üretici/tedarikçi adayı ve kaynaklarıyla 2–4 sayfalık ön araştırma raporu.</p>
      <p className="mt-2 text-[11px] leading-5 text-slate-300">Bu fiyat otomatik satış veya kesin ücret taahhüdü değildir; nihai tutar, vergiler, sözleşme tarafı ve teslim şartları yazılı mutabakatla netleşir. İşçi veya ustalardan ücret alınmaz.</p>
     </div>
    </div>
   </section>
   <section className="mx-auto max-w-6xl px-4 py-10">
    <h2 className="text-2xl font-black">İlk aşamada sunmayı hedeflediğimiz hizmetler</h2>
    <p className="mt-2 text-sm text-slate-600">Kapsamı kontrol edilebilir, raporlanabilir masa başı çalışmalarla başlıyoruz.</p>
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
     {PACKAGES.map(({icon:Icon,title,description,outputs})=>(
      <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
       <Icon size={22} className="text-amber-700"/><h3 className="mt-3 text-lg font-black">{title}</h3>
       <p className="mt-3 text-xs leading-6 text-slate-600">{description}</p>
       <h4 className="mt-5 text-xs font-extrabold uppercase tracking-wide">Beklenen çıktılar</h4>
       <ul className="mt-3 space-y-3">{outputs.map(x=><li key={x} className="flex items-start gap-2 text-xs leading-5"><BadgeCheck size={15} className="mt-0.5 shrink-0 text-amber-700"/>{x}</li>)}</ul>
      </article>
     ))}
    </div>
   </section>
   <section className="bg-white px-4 py-10"><div className="mx-auto max-w-6xl">
    <h2 className="text-xl font-black">Talep nasıl teklif ve hizmete dönüşecek?</h2>
    <ol className="mt-5 grid gap-3 md:grid-cols-5">{STEPS.map((x,i)=><li key={x} className="rounded-xl border border-slate-200 p-4">
     <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-black">{i+1}</span>
     <p className="mt-3 text-xs leading-6">{x}</p>
    </li>)}</ol>
    <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950">
     <ShieldCheck size={17} className="mr-2 inline"/> İş kapsamı, hizmeti üstlenecek taraf, sözleşme ve usulüne uygun faturalama doğrulanmadan ücretli sipariş veya ödeme alınmaz. İşçi ve ustalardan iş bulma ücreti alınmaz. Proje/ihale uygunluğu ilgili mevzuata tabidir.
    </p>
   </div></section>
   <section className="border-y border-slate-200 bg-white px-4 py-12">
    <div className="mx-auto max-w-6xl">
     <p className="text-xs font-extrabold uppercase tracking-widest text-amber-700">Atlas Endüstri Ağı · Uzak vadeli vizyon</p>
     <h2 className="mt-3 max-w-4xl text-2xl font-black leading-tight sm:text-3xl">
      Bugün bir iş kalemini araştırıyoruz. Peki yarın sanayinin bütün üretim kabiliyetleri erişilebilir bir ağda buluşabilir mi?
     </h2>
     <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
      Atlas'ın misyonu; sanayideki gerçek proje ihtiyaçlarıyla üretici, tedarikçi ve uzmanlıkları daha şeffaf biçimde buluşturmak.
      Küçük atölyelerin de fırsatları görebilmesini, adil sözleşmeleri ve çalışanların haklarını temel ilke sayıyoruz. Nitelikli iş gücünün gelişimini; mesleki eğitim, beceri ve belge doğrulaması ile daha adil iş fırsatlarına erişimi uzun vadeli hedeflerimiz arasında tutuyoruz.
      Bugün sunulan hizmet bir ön araştırma pilotudur; aşağıdaki başlıklar şirketleşme, finansman, izinler ve saha doğrulamalarıyla gelişebilecek hedeflerdir.
     </p>
     <div className="mt-6 grid gap-3 md:grid-cols-3">
      {[
       {year:'2029',term:'3 yıllık hedef',title:'Doğrulanmış sanayi ağı',
        detail:'Türkiye genelinde teknik kabiliyetleri ve sektörleri doğrulanmış firmalar arasında proje bazlı bağlantıların temelini oluşturmak.'},
       {year:'2031',term:'5 yıllık hedef',title:'Birleşen iş süreçleri',
        detail:'Tedarik ve alt yüklenici ön araştırmasını; proje kapsamı, ekipman, teknik danışmanlık ve yetkili ortaklar üzerinden eğitim destekleriyle bağlamak.'},
       {year:'2036',term:'10 yıllık hedef',title:'Sınır ötesi endüstri ekosistemi',
        detail:'Türkiye’den uluslararası pazarlara uzanabilecek, proje keşfinden teslim ve kabule kadar paydaşların karar almasını destekleyen yapıyı geliştirmek.'}
      ].map(x=><article key={x.year} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
       <p className="text-xs font-extrabold text-amber-700">{x.term}</p>
       <p className="mt-1 text-3xl font-black text-slate-950">{x.year}</p>
       <h3 className="mt-3 text-sm font-extrabold">{x.title}</h3>
       <p className="mt-2 text-xs leading-6 text-slate-600">{x.detail}</p>
      </article>)}
     </div>
     <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-950">
      Bunlar bugün sağlandığı iddia edilen iş, ortaklık, garanti, çalışan yerleştirme veya kapasite değildir.
      Atlas henüz pilot girişimdir. İlgi duyan sanayi firmaları ilk çalışma alanının ve işbirliği koşullarının şekillenmesine görüşleriyle katkıda bulunabilir.
     </p>
     <a href="#dogrudan-talep" className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-amber-800 underline">
      İlk pilot ihtiyacınızı paylaşın <ArrowRight size={15}/>
     </a>
    </div>
   </section>
   <PublicEmailInquiry />
   <section className="mx-auto max-w-6xl px-4 py-11">
    <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-slate-950 px-6 py-8 text-white">
     <div><p className="flex items-center gap-2 text-xs font-bold uppercase text-amber-300"><ClipboardList size={15}/> İlk müşteri pilotu</p>
      <h2 className="mt-2 text-xl font-black">İhtiyacınızı tarif edin; kapsamı birlikte netleştirelim.</h2>
      <p className="mt-3 max-w-xl text-xs leading-6 text-slate-300">Teknik çizim, kimlik, banka bilgisi veya ticari sırları ilk talep formuna eklemeyin. Gizli dokümanların paylaşımı uygun sözleşme ve güvenli belge süreci sonrasındadır.</p>
     </div>
     <a href="#dogrudan-talep" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-extrabold text-slate-950">Üyelik olmadan ön talep gönder <ArrowRight size={16}/></a>
    </div>
   </section>
  </main>
 </div>;
}
