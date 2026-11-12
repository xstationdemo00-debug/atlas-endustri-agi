import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BookOpen, BriefcaseBusiness, Clock3, FileText, HeartHandshake, Laptop, Scale, ShieldCheck, Smartphone, Wallet, Wrench } from 'lucide-react';

const WAYS = [
  { icon:Smartphone, title:'Telefondan yapılabilecek işler', description:'Onaylı katalog güncelleme, basit ürün listesi hazırlama ve belirlenmiş dijital görevler. Uygunluk gerçek talebe ve veri güvenliğine bağlıdır.' },
  { icon:Laptop, title:'Bilgisayardan uzmanlık işleri', description:'Çizim, teknik dokümantasyon, çeviri, tasarım, ürün araştırması ve işletme süreç desteği. Her işin ölçülebilir teslimi olmalıdır.' },
  { icon:Wrench, title:'Evden üretim ve yerel hizmetler', description:'El emeği ürünler ve üretici işbirlikleri; malzeme, kalite, vergi ve teslim koşulları netleştirilmeden satış vaadi oluşturulmaz.' },
  { icon:BriefcaseBusiness, title:'Sahada ve sanayide çalışma', description:'Firma ve proje gereksinimlerine göre ayrı bir hukuki modelde ele alınır. İstihdam aracılığı izinleri doğrulanmadan başlatılmaz.' },
];
const PROCESS = [
  { name:'Gerçek talebi doğrula', description:'Görev, talep eden taraf, teknik kapsam ve gerçekten ayrılmış bütçe kontrol edilir.' },
  { name:'İşi şeffaf tarif et', description:'Teslim çıktısı, tahmini süre, brüt bedel, vergisel durum ve ödeme koşulları önceden gösterilir.' },
  { name:'Uygun yetkinliği eşleştir', description:'Kişi cihaz, zaman, meslek ve tercihine göre fırsatları değerlendirir; ücret ödeyerek sıraya girmez.' },
  { name:'Teslimi denetle', description:'İşin kabul ölçütleri baştan bellidir. Keyfî reddetme ve ücretsiz tekrar iş talepleri incelenir.' },
  { name:'Ödemeyi ve itirazı izlet', description:'Sözleşmeye uygun ödeme kanıtı ve itiraz kanalı olmadan iş tamamlandı sayılmaz.' },
];
export default function FlexibleEarnings() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
          <Link to="/hizmetler" className="text-sm font-black tracking-wider">ATLAS ENDÜSTRİ AĞI</Link>
          <Link to="/hizmetler" className="rounded-lg border border-white/30 px-3 py-2 text-xs font-bold">Kurumsal hizmetler</Link>
        </div>
      </header>
      <main>
        <section className="bg-slate-950 px-4 pb-12 pt-12 text-white sm:px-8">
          <div className="mx-auto max-w-6xl">
            <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-300">
              Yeni program tasarımı · Henüz başvuru/ücretli iş ilanı açılmadı
            </span>
            <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight sm:text-5xl">
              Atlas Esnek Kazanç ve Dayanışma Ağı
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200">
              Evden, telefondan, bilgisayardan veya bulunduğunuz yerde becerilerinizle değer üretmeye imkân sağlayabilecek
              bir görev ve üretim modeli tasarlıyoruz. Öğrenciler, evden çalışmak isteyenler ve iş arayan yetişkinler için
              eşit, güvenli ve saygılı fırsatlar hedefliyoruz.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#model" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-extrabold text-slate-950">
                Modeli incele <ArrowRight size={16}/>
              </a>
              <a href="#guvence" className="rounded-lg border border-white/40 px-4 py-3 text-sm font-bold text-white">
                Çalışan güvenceleri
              </a>
            </div>
          </div>
        </section>
        <section id="model" className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <div className="flex items-start gap-3">
            <HeartHandshake className="mt-1 shrink-0 text-amber-700" size={24}/>
            <div>
              <h2 className="text-2xl font-black">İşin türü değil, emeğin değeri önemli.</h2>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-600">
                Maddi güçlük yaşayan birinin durumunu pazarlık konusu yapmayacağız.
                Herkes için anlaşılabilir iş kapsamı, karşılığı belirli ücret, makul teslim süresi ve itiraz hakkı temel ilkedir.
                İş bulma garantisi, aynı gün gelir veya hazır görev vaadimiz yoktur.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {WAYS.map(({icon:Icon,title,description})=>(
              <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
                <Icon size={23} className="text-amber-700"/>
                <h3 className="mt-3 text-base font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="border-y border-slate-200 bg-white px-4 py-12 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-2"><BookOpen size={21} className="text-amber-700"/><h2 className="text-2xl font-black">Bir görev nasıl ilerleyecek?</h2></div>
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {PROCESS.map((step,i)=>(
                <div key={step.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black text-amber-700">ADIM {i+1}</p>
                  <h3 className="mt-2 text-sm font-extrabold">{step.name}</h3>
                  <p className="mt-2 text-xs leading-6 text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="guvence" className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          <h2 className="flex items-center gap-2 text-2xl font-black"><ShieldCheck size={23} className="text-emerald-700"/> Altı çalışma güvencesi</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {[
              ['Katılım için ücret yok','Çalışanlardan üyelik, eşleşme veya görev görme ücreti alınmaz.'],
              ['Önce bedel ve teslim koşulu','Görevin tutarı, tahmini süresi, kapsamı, kabul koşulları ve ödeme süreci baştan açıklanır.'],
              ['Ücretsiz deneme çalışması yok','Gerçek iş çıktısı sağlayan ücretsiz test veya sınırsız revizyon istenmez.'],
              ['Veriler korunur','Kimlik, banka ve özel yaşam bilgileri hazırlık aşamasında talep edilmez; KVKK süreçleri tamamlanmalıdır.'],
              ['İtiraz ve insan incelemesi','Ödeme, kalite ve kötüye kullanım anlaşmazlıklarında insan incelemesi mekanizması oluşturulacaktır.'],
              ['Güvenlik ve hukuki sınırlar','İlk pilot 18 yaş ve üzeri yetişkinlere yöneliktir. Gerekli mevzuat, vergi, sözleşme ve ödeme altyapıları tamamlanmadan işler yayına alınmaz.'],
            ].map(([title,description])=>(
              <div key={title} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <BadgeCheck size={18} className="mt-0.5 shrink-0 text-emerald-700"/>
                <div><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-6 text-slate-600">{description}</p></div>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-amber-200 bg-amber-50 px-4 py-10 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="flex items-center gap-2 text-xl font-black"><Scale size={20}/> Pilot hazırlık durumu</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-800">
              Bu sayfa çalışma modelini tanıtır; halihazırda ücretli görev, doğrulanmış gelir,
              işe yerleştirme hizmeti veya otomatik ödeme sunmaz. Gerçek ilan açılması için görev sağlayıcısının,
              bütçenin, ödeme yönteminin, veri koruma süreçlerinin ve hukuki modelin ayrı ayrı doğrulanması gereklidir.
              Vergi ve sosyal güvenlik statüsü işin niteliğine göre değerlendirilir.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/hizmetler" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-extrabold text-white">
                Kurumsal iş talebi ve proje araştırması <ArrowRight size={16}/>
              </Link>
              <Link to="/gizlilik" className="rounded-lg border border-slate-400 px-4 py-3 text-sm font-bold">Gizlilik bilgileri</Link>
            </div>
            <p className="mt-3 text-xs text-slate-700">Çalışmak isteyen kişiler için ayrı başvuru, profil ve ödeme akışı henüz açılmadı. Bu aşamada hassas belge göndermeyin.</p>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-600">
        Atlas Endüstri Ağı · Adil kazanç için doğrulanmış iş, güvenli süreç ve şeffaflık
      </footer>
    </div>
  );
}
