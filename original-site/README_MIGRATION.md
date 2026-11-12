# Atlas Endüstri Ağı — Orijinal Base44 arayüz geçişi, Neon Auth aşaması

43 Base44 sayfasından 42'si orijinal kaynak kodudur. `CommercialServices.jsx` büyük kaynak boyutu nedeniyle eksik, yalnızca o sayfada geçici orijinal ilk-hizmet karşılığı kullanılıyor.

## Kimlik doğrulama
Bu sürüm demo `admin` sahteciliğini kaldırır ve Neon Auth Better Auth `getSession`, `signUp.email`, `signIn.email`, `signOut` kullanır. E-posta doğrulaması açıktır. Kullanıcılar oturum açsa bile tümü `member` rolündedir; `admin` rolü ön yüzde asla verilmez. Backend yetkileri ve veri model eşleştirmeleri hazırlanana kadar özel veriler gösterilmez. Hesap taşınması / parola taşınması yapılmamıştır.

## Devam edenler
32 veri modeli, 13 Base44 fonksiyonu ve gerçek yetki politikaları henüz yeni sistemde eşleştirilmedi. 327 eski kayıt Neon'da `atlas_migration` şemasında özel erişimle saklanıyor; bu arayüz kullanıcılarına **asla** gönderilmez. Teklif, yönetici paneli, ihale işlemleri ve ücretli akış hâlâ tamamlanmadı.

## Güvenlik
Neon Auth URL halka açık konfigürasyondur; yönetici şifresi, veritabanı bağlantı dizesi veya Base44 tokenı tarayıcı paketine girmez. Önizleme ortamındaki bütün Base44 CRUD işlemleri engellenir.

## 12 Kasım 2026: Neon Data API/RLS 

Neon Data API yalnızca `atlas_app` şemasına açılmıştır. PostgreSQL RLS tüm kayıtlar için zorunlu ve yalnızca onaylanmış `auth.user_id()` sahibi kendi yeni kaydını görür. Legacy 327 Base44 kaydının `owner_auth_user_id` alanı boş tutulmuştur; oturum açan kullanıcılar bunları göremez. Public/anon rolünde tablo erişimi yoktur. Şimdilik kullanıcı kendi `Project`, `WorkRequest`, `Offer`, `WorkerProfile`, `Team`, `Company` kaydını oluşturabilir, listeleyebilir ve payload güncelleyebilir. Silme, toplu mutasyonlar, firma üyelikleri, başka kullanıcılara teklif/ihale gönderimi, iş akışları, yöneticiler ve 13 Base44 fonksiyonu etkin değildir. Kayıtların başka kullanıcılar veya firma ekipleriyle paylaşılabilmesi için ayrı iş kuralları ve yetkilendirme gereklidir.
