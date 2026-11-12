import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SecurityAuditPanel from '@/components/security/SecurityAuditPanel';
import EncryptedTenderBackupPanel from '@/components/security/EncryptedTenderBackupPanel';
import { Fingerprint, KeyRound, LockKeyhole, ShieldAlert, ShieldCheck, Smartphone, MailCheck, Activity, DatabaseBackup } from 'lucide-react';

const MFA_URL='/auth/mfa?app_id=6ae8583432c3a0d63a7b7938&security=1';
const NOTES=[
  ['Giriş ve e-posta kodu','Hesap açılışında Base44 e-posta doğrulama kodu kullanılır.'],
  ['Sunucu kimlik kontrolü','Hizmet ve destek talepleri giriş yapan, e-postası doğrulanmış hesaplarla sınırlandırıldı.'],
  ['Veri yetkileri','Kritik firma, ihale, teklif ve yönetim kayıtları için Base44 satır ve alan düzeyinde erişim kuralları kullanılır.'],
  ['Tarayıcı güvenliği','Başka sitelerin Atlas’ı çerçeveye yerleştirmesi engellenir; gereksiz tarayıcı özellikleri kısıtlanır.'],
  ['Başvuru sınırları','Honeypot, boyut kontrolü, aynı hesap için tekrar/limit ve geçerli alan kontrolleri uygulanır.'],
];
export default function SecurityCenter(){
  const [captcha,setCaptcha]=useState(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    fetch('/functions/publicCaptchaConfig',{method:'POST',cache:'no-store'})
      .then(r=>{if(!r.ok)throw Error('CAPTCHA konfigürasyon kontrolü yapılamadı.');return r.json();})
      .then(d=>{if(active)setCaptcha(d.enabled===true);})
      .catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[]);
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
          <ShieldCheck size={16}/> Atlas Endüstri Ağı · Yönetici
        </p>
        <h1 className="mt-2 text-2xl font-black">Çok Katmanlı Güvenlik Merkezi</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Güvenlik kontrollerinin ve bekleyen kurulumların durumunu izle. Hiçbir sistem sıfır saldırı riski garantisi vermez.
        </p>
      </header>
      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-emerald-950"><MailCheck size={18}/> E-posta doğrulaması</h2>
          <p className="mt-2 text-xs leading-6 text-emerald-950">
            Kayıt akışında tek kullanımlık e-posta kodu bulunur. Hizmet ve destek formlarında sunucu oturum ve hesap e-postası kontrolü yapılır.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-amber-950"><Smartphone size={18}/> Yönetici SMS / Authenticator doğrulaması</h2>
          <p className="mt-2 text-xs leading-6 text-amber-950">
            Base44 hesap güvenlik akışında SMS ve doğrulayıcı uygulama seçenekleri bulunur. Bu yönetici hesabında
            kurulumu tamamlanmış mı otomatik olarak teyit edemiyoruz. Telefonun sahibi kendi hesabıyla doğrulama yapmalıdır.
          </p>
          <a href={MFA_URL} className="mt-3 inline-flex rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">
            <KeyRound size={14} className="mr-2"/> İkinci doğrulamayı yönet
          </a>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold"><Fingerprint size={18}/> Cloudflare Turnstile CAPTCHA</h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            {captcha===true?'Doğrulama yapılandırıldı. Başvurularda insan kontrolü zorunludur.':
             captcha===false?'CAPTCHA entegrasyon kodu hazır ancak henüz etkin değil. Site anahtarı ve gizli anahtar tanımlanmalı.':
             'CAPTCHA durumu kontrol ediliyor…'}
          </p>
          <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
            Base44 uygulama sırlarına ATLAS_TURNSTILE_SITE_KEY ve ATLAS_TURNSTILE_SECRET_KEY adlarıyla
            Cloudflare Turnstile anahtarları eklenmeli. Gizli anahtarı asla sohbet içinde veya kaynak kodunda paylaşmayın.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold"><DatabaseBackup size={18}/> Yedek, olay kaydı ve geri yükleme</h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Kaynak kod sürüm geçmişi ve bazı kritik firma/teklif işlemleri için yönetici işlem kaydı bulunuyor.
            Teknik ihalelere yönelik manuel şifreli yedek indirme ve yerel dosya doğrulaması eklendi.
            Otomatik tam veri yedeği, veritabanı geri yükleme tatbikatı, değiştirilemez denetim günlüğü
            ve güvenlik olayı uyarıları henüz tamamlanmadı.
          </p>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-extrabold">Etkin koruma katmanları</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {NOTES.map(([title,description])=>(
            <div key={title} className="flex items-start gap-2 rounded-lg border border-border bg-background p-3">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-700"/>
              <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
            </div>
          ))}
        </div>
      </section>
      <SecurityAuditPanel />
      <EncryptedTenderBackupPanel />
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="flex items-center gap-2 font-bold text-amber-950"><ShieldAlert size={17}/> Lansman öncesinde zorunlu kontroller</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-6 text-amber-950">
          <li>Yönetici hesabının doğrulayıcı uygulama veya SMS ile MFA kurulumunun bizzat test edilmesi.</li>
          <li>Cloudflare Turnstile anahtarlarının eklenmesi ve geçersiz/tekrar token senaryolarının test edilmesi.</li>
          <li>Normal kullanıcıyla yönetici ekranı, API, veri okuma-yazma ve dosya erişim testleri.</li>
          <li>Veritabanı yedeğinin ayrı ortamda saklanması; geri yükleme tatbikatı ve olay izleme.</li>
          <li>Güncel paket güvenlik taraması, kimlik/veri saklama süreleri ve KVKK kontrolleri.</li>
        </ul>
        {error&&<p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
      </section>
      <div className="flex flex-wrap gap-2">
        <Link to="/yonetim" className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold">Kurumsal yönetim</Link>
        <Link to="/guvenli-talep" className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold">Doğrulanmış başvuru formu</Link>
      </div>
    </div>
  );
}
