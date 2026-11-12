import { Link } from 'react-router-dom';
import { ArrowUpRight, Bot, CheckCircle2, ShieldAlert, MessageCircle, ClipboardCheck } from 'lucide-react';

const STEPS = [
  ['Meta Business Agent testini tamamla', 'WhatsApp Business içinde “AI\'nızı test edin” ekranı görüldü. Buradan personel, firma ve ihale başvurusu senaryoları herhangi bir müşteriye mesaj göndermeden denenebilir.'],
  ['Gerçek müşteri yanıtını doğrula', 'Yapay Zekâ Yanıtları açık mı, yanlış yanıtları nasıl düzeltiyor ve insan desteğine nasıl geçiyor? Test sonucu görülmeden canlı otomatik cevap aktif kabul edilmez.'],
  ['Bilgi ve gizlilik kurallarını kontrol et', 'İşçiden ücret alınmayacak; iş, fiyat, teknik uygunluk veya sözleşme garantisi verilmeyecek. Kişisel veriler, izin ve erişim sınırları denetlenir.'],
  ['Atlas web sitesiyle ayrı entegrasyonu planla', 'WhatsApp Business içindeki Meta Business Agent ile web sitesinin veri tabanı farklı sistemlerdir. API, webhook, yönetici yetkisi ve kayıt aktarımı ayrıca kurulmalıdır.'],
  ['Başvuru ve insan desteği akışını doğrula', 'Usta, firma ve ihale bilgi talebi ayrı sınıflandırılır; yalnızca onaylı bilgiler paylaşılır. Kritik kararlar insana devredilir; takip ve bildirimler bağımsız test edilir.'],
];

export default function WhatsAppSetup() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <p className="text-xs font-bold uppercase text-amber-700">Atlas Endüstri Ağı · Destek altyapısı</p>
        <h1 className="mt-1 text-2xl font-black">WhatsApp Business ve Atlas Asistan</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          WhatsApp Business uygulaması ve Meta Business Agent test ekranı mevcut.
          Müşteriye otomatik yanıtın çalışması ve Atlas web sitesine veri aktarımı farklı işlemlerdir; ikisi de ayrıca doğrulanır.
        </p>
      </header>

      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
        <ShieldAlert className="mt-1 shrink-0" size={20} />
        <div>
          <strong>Web sitesiyle WhatsApp API bağlantısı henüz doğrulanmadı.</strong>
          <p className="mt-1">
            Meta Business Agent'ın kendi WhatsApp test arayüzü kullanılabilir; bu, Atlas veritabanına otomatik
            kayıt açıldığı veya canlı müşterilere AI yanıtının etkin olduğu anlamına gelmez. Bu yetenekler test edilmeden aktif gösterilmez.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['WhatsApp Business', 'Uygulama kurulu'],
          ['Meta Business Agent', 'Test ekranı bulundu'],
          ['Atlas web sitesi API aktarımı', 'Henüz kurulmadı'],
        ].map(([title, status]) => (
          <div key={title} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-3 text-sm font-bold text-foreground">{status}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={18} />
          <h2 className="text-lg font-bold">Test ve entegrasyon yol haritası</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {STEPS.map(([title, description], i) => (
            <div key={title} className="rounded-lg border border-border p-4">
              <p className="text-xs font-extrabold text-amber-700">AŞAMA {i + 1}</p>
              <h3 className="mt-2 font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="https://whatsappbusiness.com/developers/developer-hub/" target="_blank" rel="noreferrer"
             className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white">
            WhatsApp resmî geliştirici merkezi <ArrowUpRight size={15} className="ml-1 inline" />
          </a>
          <Link to="/destek" className="rounded-lg border border-border px-4 py-3 text-sm font-bold">
            Atlas web destek merkezi
          </Link>
        </div>
      </section>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2"><MessageCircle size={18}/><h2 className="font-bold">Hedeflenen çalışma akışı</h2></div>
        <p className="mt-3 text-sm leading-7">
          Müşteri WhatsApp'tan mesaj gönderir → işletme asistanı yalnızca doğrulanmış bilgileri paylaşır →
          gerekirse yöneticinin incelemesine yönlendirir. Atlas web sitesine otomatik başvuru kaydı ve
          takip numarası aktarımı ise ayrı, güvenli bir entegrasyon tamamlandıktan sonra devreye alınabilir.
        </p>
      </div>
    </div>
  );
}
