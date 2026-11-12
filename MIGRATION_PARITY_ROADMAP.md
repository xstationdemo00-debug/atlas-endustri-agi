# Atlas Endüstri Ağı — Base44 → Render/Neon özellik eşitliği yol haritası
Güncelleme: 12 Kasım 2026. **Atlas Earth ayrı projedir: dokunulmaz.**

## Kesin hedef ve bitiş ölçütü
Orijinal Base44 uygulamasının tasarımını, 43 sayfasını, tüm menüleri, 32 veri modelini,
13 sunucu işlevini, kimlik doğrulamayı, firma/üyelik yetkilerini, teklif–proje–ihale
akışlarını ve gerekli dosya/bildirim işlemlerini Render/Neon'da **gerçekten çalışır** duruma
getirmek. Kopya/yeniden tasarlanan bir pilot nihai ürün değildir.
Kullanıcı yolları (aç → kayıt → değişiklik → başka oturumda gör → izin kontrolü)
uçtan uca geçmeden görev "tamamlandı" denemez.

## Doğrulanan durum
- Orijinal kaynak arşivi: 238 dosyanın 237'si. Eksik olan büyük **src/pages/CommercialServices.jsx**;
  mevcut arayüzde bu sayfanın geçici karşılığı var, özgünüyle aynı değil.
- Orijinal React arayüzü ayrı Render statik serviste: **Live**, menü yönlendirmesi hash tabanlı.
- Neon Auth (Better Auth) açık; e-posta doğrulaması ve trusted origins yapılandırıldı.
  Base44 kullanıcı şifreleri/oturumları transfer edilmedi.
- Neon'da 327 eski kayıt aktarıldı; sahiplik eşleştirmesi yapılmadığı için kayıtlar
  kullanıcı oturumlarından görünmez. Bu bir **güvenlik kuralıdır**, eksik kayıt değil.
- Sahiplik kontrollü yeni CRUD altyapısı yalnızca Project, WorkRequest, Offer,
  WorkerProfile, Team ve Company için taslak kayıtlarla sınırlı.
  Bu bir uçtan uca iş akışı testi yerine geçmez.
- Yalnızca kaynak-kontrolünden geçmiş ve yayımlanabilir ilanları dönen
  `/api/tenders` Render API'si var. Tarih ve kaynak geçerliliği yeniden kontrol edilmeli.
- Mevcut bağımsız pilot / orijinal önizleme ayrı kalır; eski Base44 sitesi kapatılmaz.

## Kritik kalan bloklar (tamamlanmış DEĞİL)
1. [ ] **Orijinal kaynak eşitliği:** CommercialServices.jsx dosyasını güvenilir biçimde
       elde et veya mevcut ekranın işlevsel eşitliğini karşılaştırmalı doğrula.
2. [ ] **Giriş ve hesap:** e-posta doğrulamalı gerçek kayıt/giriş/çıkış ve parola sıfırlama
       testleri; mevcut Base44 kullanıcılarının güvenli yeniden daveti.
3. [ ] **Firma/çoklu kullanıcı yetkileri:** CompanyMember, şirket doğrulaması, roller,
       organizasyon sahipliği, çalışan görüntüleme, RLS ve yönetici onayı.
4. [ ] **Proje → iş talebi → teklif → karar → bildirim:** farklı firmalar ve taraflar
       arasında izinli veri paylaşımı ve tüm durum geçişleri.
5. [ ] **İhale işlemleri:** yayımlama/onay, teknik şartname ve iş paketi, analiz,
       eşleştirme ve bildirim/abonelik.
6. [ ] **Belgeler/İSG:** dosya yükleme/indirme, erişim, depolama, silme ve audit.
7. [ ] **Ticari panel:** 1 iş kalemi / bölge, en çok 3 aday, 2–4 sayfalık rapor,
       başlangıç 2.900 TL; ödeme/fatura ancak yasal yükümlülükler tamamlanınca.
8. [ ] **Yönetim:** raporlama, destek, güvenlik, üyelik daveti ve doğrulama masaları.
9. [ ] **Kaynak özellikleri:** 13 orijinal backend fonksiyonunun eşdeğerlerini gerçek
       kimlik doğrulama ve sunucu tarafı kontrolle taşı.
10. [ ] **Tam kabul:** 43 sayfa, 32 şema, 13 fonksiyon ve kritik role-journey testleri
       için PASS/FAIL kanıtı; örnek değil gerçek kontrollü akışlar; geri dönüş planı.

## Orijinal 13 Base44 fonksiyonu (henüz birebir taşınmadı)
- industryGuide
- publicCaptchaConfig
- notifyOfferSubmission
- decideOffer
- analyzeTenderDocument
- submitServiceInquiry
- verifiedPartnerDirectory
- tenderMatches
- submitSupportTicket
- inviteCompanyMember
- submitCompanyVerification
- linkTenderTechnicalDocument
- listPublishedTenders

## Güvenlik ve yürütme kuralları
- GitHub hâlâ Public; sırlar, gerçek kişi kayıtları, müşteri belgeleri, DB URL'leri
  veya e-posta/telefon listeleri depoya işlenmez. Gizli kod/özel veri dağıtımı
  öncesi depo görünürlüğü ve erişimden emin ol.
- Uygulamada "admin" rolünü yalnızca tarayıcı verisine dayanarak tanımlama.
  Backend'de roller, RLS, ekip/firma sınırları, erişim kayıtları zorunlu.
- UI düğmesi, yanlış veya eksik işlemi başarılı göstermemeli.
- Artifaktların ve kodun testleri, canlı HTTP kontrolü ve DB sonuç doğrulaması olmadan
  hiçbir modülü çalışır sayma.
- Atlas Earth ve eski Base44 sitesi güvenli nihai geçişe kadar ayrı kalır.

## Son teknik düzeltme
Base44 orijinal kodundaki `filter()` kullanımları bazı sayfalarda `page.items`,
bazılarında doğrudan dizi bekliyor. Adaptör bu iki tüketimi uyumlu hale getirir;
şirket sahipliği için `created_by_id` alanını gerçek Neon oturumunun kullanıcı
kimliğiyle eşler. Bu **yalnızca** yeni sahip olunan kayıtların ekranlara düşmesine
yardımcı olur, bütün modüllerin tamamlandığını göstermez.
