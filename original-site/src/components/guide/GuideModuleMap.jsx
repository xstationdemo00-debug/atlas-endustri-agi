import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const GROUPS = [
  {
    title: 'Giriş yapmadan',
    note: 'Kayıt olmadan okunabilir',
    items: [
      { to: '/hizmetler', label: 'Ücretli hizmetler ve pilot paket' },
      { to: '/cozumler', label: 'Çoklu çözüm modelleri' },
      { to: '/ihaleler', label: 'İhale fırsat panosu' },
      { to: '/calisan-haklari', label: 'Çalışan ve usta hakları' },
      { to: '/destek', label: 'Destek merkezi ve talep formu' },
      { to: '/gizlilik', label: 'Kişisel veri bilgilendirmesi' },
    ],
  },
  {
    title: 'Kayıt sonrası · operasyon',
    note: 'Firma profili ve doğrulama ile birlikte açılır',
    items: [
      { to: '/firma-kayit', label: 'Firma kaydı ve doğrulama' },
      { to: '/firmalar', label: 'Firma profili ve ekip üyeleri' },
      { to: '/projeler', label: 'Projeler ve iş paketleri' },
      { to: '/is-talepleri', label: 'İş talepleri' },
      { to: '/teklifler', label: 'Teklifler' },
      { to: '/ekip-havuzu', label: 'Usta ve ekip havuzu' },
      { to: '/belgeler', label: 'Belgeler ve İSG' },
      { to: '/eslestirme', label: 'Firma eşleştirme' },
      { to: '/dogrulanmis-ag', label: 'Doğrulanmış firma ağı' },
      { to: '/ihale-bildirimleri', label: 'İhale eşleştirmelerim' },
      { to: '/proje-merkezi', label: 'Proje kontrol merkezi' },
    ],
  },
  {
    title: 'Yönetici masası',
    note: 'Yetkili hesaplarla sınırlı',
    items: [
      { to: '/firma-dogrulama', label: 'Firma doğrulama masası' },
      { to: '/ihale-yayinlari', label: 'İhale yayın yönetimi' },
      { to: '/destek-merkezi', label: 'Destek talepleri' },
      { to: '/ticari-talepler', label: 'Kazanç merkezi' },
      { to: '/lansman-hazirlik', label: 'Yasal hazırlık listesi' },
      { to: '/calisan-koruma', label: 'Sözleşme ve çalışan güvencesi' },
      { to: '/raporlar', label: 'Raporlar' },
    ],
  },
];

export default function GuideModuleMap() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-11 sm:px-8">
      <h2 className="text-2xl font-black">Bugün açık olan bölümler</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Rehberdeki her adımın karşılığı olan ekranlar aşağıda. Bağlantıya bastığınızda giriş gerekiyorsa
        oturum sayfasına yönlendirilirsiniz.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {GROUPS.map((group) => (
          <div key={group.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold">{group.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{group.note}</p>
            <ul className="mt-3 space-y-1.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="group flex items-start gap-1.5 text-sm text-slate-700 hover:text-amber-800">
                    <ArrowRight size={14} className="mt-1 shrink-0 text-slate-400 group-hover:text-amber-700" />
                    <span className="leading-6">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}