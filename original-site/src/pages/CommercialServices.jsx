import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Factory, FileSearch, Users, Wrench } from 'lucide-react';
import FirstPaidService from './FirstPaidService';

// Original CommercialServices source is over the Base44 Free export limit.
// This page uses the original Atlas service, form, colors and project sections.
const areas=[
  {icon:Factory,title:'Sanayi ve fason üretim',text:'Kaynaklı imalat, çelik konstrüksiyon, borulama ve üretim çözüm ortakları.',path:'/cozumler'},
  {icon:Wrench,title:'Teknik kapsam ve alt yükleniciler',text:'Teknik şartname, uygun üretim süreci ve fason imalat ön araştırması.',path:'/ilk-hizmet'},
  {icon:Users,title:'Nitelikli iş gücü',text:'Usta, ekip ve firmaları proje ihtiyaçları etrafında bir araya getirme.',path:'/register'},
  {icon:FileSearch,title:'İhale fırsatları',text:'Kaynağı belirtilen, ön kontrol yapılmış kamuya açık ihale özetleri.',path:'/ihaleler'},
  {icon:BadgeCheck,title:'Güvence ve doğrulama',text:'Onay ve belge kontrolleri tamamlanmadan taahhüt ya da ödeme başlatılmaz.',path:'/nasil-calisir'},
];
export default function CommercialServices(){
  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <section className="mx-auto max-w-6xl px-4 pt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-wider text-amber-700">Atlas Endüstri Ağı · Sanayi hizmetleri</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black sm:text-4xl">Sanayi projeleri, üretim çözümleri ve nitelikli iş gücü</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">Tedarikçi ve fason üretici araştırması, teknik iş kapsamı ve iş gücü ihtiyaçları için Atlas'ın mevcut hizmet bileşenlerinden yararlanın.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="#dogrudan-talep" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950">Ön talep oluştur <ArrowRight size={16}/></a>
          <Link to="/login" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold">Üye girişi</Link>
          <Link to="/nasil-calisir" className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold">Nasıl çalışır?</Link>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map(item=>{const Icon=item.icon;return <Link key={item.title} to={item.path} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-amber-400">
          <Icon className="h-6 w-6 text-amber-700"/>
          <h2 className="mt-3 text-sm font-bold">{item.title}</h2>
          <p className="mt-2 text-xs leading-6 text-slate-600">{item.text}</p>
        </Link>;})}
      </div>
    </section>
    <FirstPaidService/>
    <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs leading-6 text-slate-600">Ön başvuru ücretli sipariş, firmaların kesin uygunluğu veya iş bulma garantisi değildir. Yazılı kapsam ve yasal yükümlülükler esas alınır.</footer>
  </div>;
}
