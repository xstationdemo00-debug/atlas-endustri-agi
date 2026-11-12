import { useState } from 'react';
import { ClipboardCopy, Mail, ShieldCheck } from 'lucide-react';

const RECIPIENT='xstationdemo00@gmail.com';
const clean=v=>String(v??'').trim().slice(0,450);
const TYPES=[
  ['supplier_research','Tedarikçi / üretici ön araştırması'],
  ['subcontractor_research','Fason imalatçı / alt yüklenici ön araştırması'],
  ['procurement_scope','Teknik iş kapsamı ön değerlendirme'],
];
const SUBJECT='Atlas Endüstri Ağı | B2B pilot hizmet ön talebi';
function message(f){
 return [
  'ATLAS ENDÜSTRİ AĞI — ÖN TALEP',
  '',
  'Firma / işletme adı: '+clean(f.company),
  'İlgili kişi: '+clean(f.person),
  'Şehir / bölge: '+clean(f.location),
  'Talep türü: '+(TYPES.find(x=>x[0]===f.type)?.[1]||''),
  'İş kolu ve malzeme: '+clean(f.trade),
  'İhtiyaç / araştırılacak konu: '+clean(f.need),
  '',
  'Lütfen yalnızca genel iş kapsamıyla dönüş yapın. Teknik çizim, gizli şartname, kimlik veya finansal bilgi ilk e-postaya eklenmemiştir.',
  'Başlangıç paketi (2.900 TL) yalnız standart kapsam için tanıtım bedelidir: bir iş kalemi, bir bölge, en çok üç araştırma adayı ve 2–4 sayfalık ön rapor. Nihai bedel, vergiler, teslim tarihi ve hizmeti sunacak hukuki taraf yazılı teklif/sözleşmeyle netleşir.',
  '',
  'Bu e-posta ücretli sipariş, satın alma taahhüdü veya ödeme talimatı değildir.'
 ].join('\n');
}
export default function PublicEmailInquiry(){
 const [form,setForm]=useState({company:'',person:'',location:'',type:'supplier_research',trade:'',need:''});
 const [notice,setNotice]=useState('');
 const set=(key,v)=>{setForm(x=>({...x,[key]:v}));setNotice('');};
 const ready=clean(form.company).length>=2&&clean(form.person).length>=2&&clean(form.need).length>=15;
 const email='mailto:'+RECIPIENT+'?subject='+encodeURIComponent(SUBJECT)+'&body='+encodeURIComponent(message(form));
 const copy=async()=>{
  if(!ready)return;
  try{await navigator.clipboard.writeText('Konu: '+SUBJECT+'\n\n'+message(form));setNotice('Ön talep metni kopyalandı. Mesajı kendi e-posta hesabınızdan göndermeniz gerekiyor.');}
  catch{setNotice('Otomatik kopyalama başarısız oldu. E-posta uygulamanızdan göndermeyi deneyin.');}
 };
 return <section id="dogrudan-talep" className="mx-auto max-w-6xl px-4 py-10">
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
   <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700"><Mail size={16}/> Hesap açmadan ilk temas</p>
   <h2 className="mt-2 text-2xl font-black text-slate-950">Firmanızın ihtiyacını kısa bir e-postayla gönderin</h2>
   <p className="mt-2 max-w-3xl text-xs leading-6 text-slate-600">
    Bu ekran e-postanızı otomatik göndermez veya verilerinizi Atlas veritabanına yazmaz.
    Alanları doldurunca telefonunuzun veya bilgisayarınızın e-posta uygulaması hazırlanır; gönderme kararını siz verirsiniz.
    İsterseniz doğrulanmış hesapla <a href="/#/guvenli-talep" className="font-bold underline">güvenli formu</a> da kullanabilirsiniz.
   </p>
   <div className="mt-5 grid gap-3 sm:grid-cols-2">
    {[
     ['company','Firma / işletme adı *','Firmanızın ticari adı'],
     ['person','İlgili kişi *','Ad ve soyad'],
     ['location','Bölge / şehir','Örn. Ankara veya Kocaeli'],
     ['trade','İş kolu / malzeme','Örn. paslanmaz boru, lazer kesim'],
    ].map(([key,label,placeholder])=><label key={key} className="block text-xs font-bold">
     {label}<input value={form[key]} maxLength={140} placeholder={placeholder}
      onChange={e=>set(key,e.target.value)}
      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"/>
    </label>)}
    <label className="block text-xs font-bold sm:col-span-2">Araştırma hizmeti
     <select value={form.type} onChange={e=>set('type',e.target.value)}
      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal">
      {TYPES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select>
    </label>
    <label className="block text-xs font-bold sm:col-span-2">İşin genel kapsamı * (en az 15 karakter)
     <textarea rows={4} value={form.need} maxLength={450} onChange={e=>set('need',e.target.value)}
      placeholder="Hangi üretim veya tedarik problemini çözmeye çalışıyorsunuz? Genel kapsamı belirtin; gizli çizim veya kişisel veri göndermeyin."
      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal"/>
    </label>
   </div>
   <div className="mt-4 flex flex-wrap gap-2">
    <a href={ready?email:undefined} aria-disabled={!ready}
     onClick={e=>{if(!ready)e.preventDefault();}}
     className={'inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold '+(ready?'bg-amber-400 text-slate-950':'pointer-events-none bg-slate-200 text-slate-500')}>
     <Mail size={17}/> E-posta uygulamamı aç
    </a>
    <button type="button" onClick={copy} disabled={!ready}
     className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-xs font-bold disabled:opacity-40">
     <ClipboardCopy size={16}/> Mesajı kopyala
    </button>
   </div>
   {notice&&<p role="status" className="mt-3 text-xs font-medium text-emerald-800">{notice}</p>}
   <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-slate-600">
    <ShieldCheck size={15} className="mt-0.5 shrink-0"/>
    Alıcı: {RECIPIENT}. Ön başvuru ve kapsam görüşmesi ücretsizdir. Yalnızca yazılı kapsam, sözleşme ve yasal faturalama yolu netleşince ücretli çalışma başlayabilir.
   </p>
  </div>
 </section>;
}
