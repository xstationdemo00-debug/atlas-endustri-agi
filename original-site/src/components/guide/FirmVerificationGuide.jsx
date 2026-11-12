import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, FileCheck2, ShieldAlert, Upload } from 'lucide-react';
import { DOCUMENT_TYPES } from '@/lib/companyVerification';

const STEPS = [
  {
    n: '01',
    title: 'Firma bilgileri',
    desc: 'Ticari ünvan, vergi dairesi ve vergi no, şehir, telefon ve e-posta girilir. Bu bilgiler firma profilinizin temelidir.',
    Icon: Building2,
  },
  {
    n: '02',
    title: 'Üretim kabiliyetleri',
    desc: 'Üretim ailesi, imalat yöntemleri, malzeme ve sektör etiketleri seçilir. Firma eşleştirmesi bu bilgilerle yapılır.',
    Icon: BadgeCheck,
  },
  {
    n: '03',
    title: 'Zorunlu belgeler',
    desc: 'Vergi levhası, ticaret sicil gazetesi ve imza sirküleri yüklenir. Dosyalar özel olarak saklanır; yalnızca firma sahibi ve yetkili yönetici erişebilir.',
    Icon: Upload,
  },
  {
    n: '04',
    title: 'İnceleme ve sonuç',
    desc: 'Başvuru "inceleniyor" durumuna geçer. Yönetici belgeleri tek tek onaylar, sonuç bildirim olarak gelir. Reddedilirse eksikler düzeltilip yeniden gönderilir.',
    Icon: FileCheck2,
  },
];

const OPTIONAL_DOCS = DOCUMENT_TYPES.filter((item) => !item.required);

export default function FirmVerificationGuide() {
  return (
    <section id="firma-dogrulama-rehberi" className="scroll-mt-6 border-y border-slate-200 bg-white px-4 py-11 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
          <BadgeCheck size={15} /> Firma kaydı ve doğrulama
        </span>
        <h2 className="mt-4 text-2xl font-black">Firma kaydı ve doğrulama nasıl işler?</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Üretici, yüklenici ve tedarikçi olarak ağda görünmek için dört adımı tamamlayın. Doğrulanmış firma
          kayıtları işbirliği paylaşımı tercihi açıksa firma eşleştirmesinde listelenir.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ n, title, desc, Icon }) => (
            <div key={n} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-extrabold text-amber-800">{n}</span>
                <Icon size={19} className="text-slate-500" />
              </div>
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="font-bold text-emerald-950">Zorunlu belgeler</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-800">
              {DOCUMENT_TYPES.filter((item) => item.required).map((item) => (
                <li key={item.value}>• {item.label}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-6 text-emerald-900">
              İsteğe bağlı belgeler: {OPTIONAL_DOCS.map((item) => item.label).join(', ')}. Bunlar başvuruyu
              engellemez, incelemede dikkate alınır.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
            <h3 className="flex items-center gap-2 font-bold"><ShieldAlert size={18} /> Doğrulama neyi kapsar?</h3>
            <p className="mt-3">
              Doğrulama; firma bilgileri ile vergi levhası, ticaret sicil ve imza sirküleri kontrolüdür. Boş kapasite,
              fiyat, termin veya iş garantisi değildir. Kapasite bilgisi ayrıca teyit edilir.
            </p>
            <p className="mt-2">
              Sağlık raporu, kimlik numarası ve banka bilgisi yüklemeyin. Belge erişimi firma sahibi ve yetkili
              yönetici ile sınırlıdır.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/firma-kayit" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white">
            Firma kaydını başlat <ArrowRight size={16} />
          </Link>
          <Link to="/dogrulanmis-ag" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">
            Doğrulanmış firma ağını gör
          </Link>
          <Link to="/firma-dogrulama" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold">
            Yönetici doğrulama masası
          </Link>
        </div>
      </div>
    </section>
  );
}