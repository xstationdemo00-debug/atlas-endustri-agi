# Atlas Endüstri Ağı — Orijinal Base44 arayüz geçişi, Neon Auth aşaması

43 Base44 sayfasından 42'si orijinal kaynak kodudur. `CommercialServices.jsx` büyük kaynak boyutu nedeniyle eksik, yalnızca o sayfada geçici orijinal ilk-hizmet karşılığı kullanılıyor.

## Kimlik doğrulama
Bu sürüm demo `admin` sahteciliğini kaldırır ve Neon Auth Better Auth `getSession`, `signUp.email`, `signIn.email`, `signOut` kullanır. E-posta doğrulaması açıktır. Kullanıcılar oturum açsa bile tümü `member` rolündedir; `admin` rolü ön yüzde asla verilmez. Backend yetkileri ve veri model eşleştirmeleri hazırlanana kadar özel veriler gösterilmez. Hesap taşınması / parola taşınması yapılmamıştır.

## Devam edenler
32 veri modeli, 13 Base44 fonksiyonu ve gerçek yetki politikaları henüz yeni sistemde eşleştirilmedi. 327 eski kayıt Neon'da `atlas_migration` şemasında özel erişimle saklanıyor; bu arayüz kullanıcılarına **asla** gönderilmez. Teklif, yönetici paneli, ihale işlemleri ve ücretli akış hâlâ tamamlanmadı.

## Güvenlik
Neon Auth URL halka açık konfigürasyondur; yönetici şifresi, veritabanı bağlantı dizesi veya Base44 tokenı tarayıcı paketine girmez. Önizleme ortamındaki bütün Base44 CRUD işlemleri engellenir.
