import { Link } from 'react-router-dom';
export default function PrivacyNotice() {
return <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
<div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
<Link className="text-sm font-bold text-amber-700 underline" to="/hizmetler">Atlas Endüstri Ağı hizmetlerine dön</Link>
<h1 className="mt-6 text-3xl font-black">Kişisel veri bilgilendirmesi — pilot talep formu</h1>
<p className="mt-3 text-sm leading-7 text-slate-700">Bu açıklama, Atlas Endüstri Ağı'nin ticari hizmet talebi ve destek başvuru formlarında paylaşılan bilgiler içindir. Atlas Endüstri Ağı henüz pilot aşamasındadır. Form aracılığıyla işçi/usta sağlık ve kimlik belgesi yüklenmemelidir.</p>
<section className="mt-7 space-y-4 text-sm leading-7 text-slate-700">
<p><strong>İrtibat ve sorumlu:</strong> Mustafa Ayhan (Atlas Endüstri Ağı pilot girişimi). İletişim: <a href="mailto:xstationdemo00@gmail.com" className="underline">xstationdemo00@gmail.com</a>.</p>
<p><strong>İşlenen bilgiler:</strong> Firma adı, ilgili kişinin adı, iş e-posta adresi, isteğe bağlı telefon ve şehir, talep edilen hizmet veya destek türü, isteğe bağlı geri arama talebi, destek konusu ve serbest metin olarak girilen iş veya soru kapsamı.</p>
<p><strong>Amaç:</strong> Talep veya destek başvurusunu incelemek, geri dönüş yapmak, ticari kapsamı ve muhtemel hizmet teklifini hazırlamak, gerektiğinde iletişim geçmişini takip etmek. Bu formdan otomatik olarak reklam e-postası gönderilmez.</p>
<p><strong>İşlemenin dayanağı:</strong> İlgili kişinin talebi üzerine sözleşme öncesi işlemlerin yürütülmesi ve uygun hallerde meşru menfaat gibi 6698 sayılı KVKK'daki ilgili hukuki sebepler; her durumun koşulları ayrıca değerlendirilir. Formdaki işaretleme pazarlama izni değildir.</p>
<p><strong>Hizmet sağlayıcı:</strong> Talep kayıtları Base44 altyapısında saklanır. Verilerin barındırıldığı bölge ve hizmet sağlayıcı alt işleyenlerine ilişkin uluslararası aktarım hususları ticari açılış öncesi ayrıca doğrulanmalıdır.</p>
<p><strong>Saklama süresi:</strong> Pilot teklif talepleri, yasal bir saklama yükümlülüğü veya devam eden sözleşmesel ilişki yoksa son iletişimden itibaren en fazla 6 ay içinde silinmek üzere gözden geçirilir. Silme talebinizi iletişim e-postasına iletebilirsiniz.</p>
<p><strong>Haklar:</strong> KVKK m. 11 kapsamındaki kişisel verilerinize ilişkin bilgi, düzeltme, silme ve diğer taleplerinizi yukarıdaki iletişim adresine gönderebilirsiniz.</p>
<p><strong>Güvenlik uyarısı:</strong> Kişisel kimlik numarası, sağlık bilgisi, banka veya kredi kartı bilgisi ya da hassas belge bu forma girilmemelidir. Bu sayfa ödeme veya sözleşme kurma aracı değildir.</p>
</section>
<p className="mt-8 text-xs text-slate-500">Pilot sürüm · 2 Kasım 2026 · Gizlilik ve KVKK hukuki uyum incelemesi devam etmektedir.</p>
</div></div>;
}