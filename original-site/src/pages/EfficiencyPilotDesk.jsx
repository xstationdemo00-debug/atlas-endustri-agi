import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { DEFAULT_SHARES, SAVING_GATES, calculateEfficiency } from '@/lib/efficiencyPilot';
import { Calculator, CheckCircle2, ClipboardCheck, Factory, FileCheck2, RotateCcw, Save, ShieldAlert, Timer, Users } from 'lucide-react';

const INITIAL = {
  title:'', scope:'', project_reference:'', region:'',
  employer_type:'private_company', baseline_total_cost:'', actual_total_cost:'',
  planned_days:'', actual_days:'', accepted_work_units:'', worker_count:'',
  employer_share_pct:DEFAULT_SHARES.employer, workers_share_pct:DEFAULT_SHARES.workers,
  contractor_share_pct:DEFAULT_SHARES.contractor, atlas_share_pct:DEFAULT_SHARES.atlas,
  scope_verified:false, quality_accepted:false, hse_verified:false,
  wages_paid_verified:false, overtime_paid_verified:false,
  evidence_verified:false, agreement_verified:false, public_legal_clearance:false,
  status:'draft', review_note:'', is_demo:false,
};
const DEMO = {
  ...INITIAL, title:'ÖRNEK — Endüstriyel bakım ve montaj pilotu',
  scope:'Örnek: aynı kapsam, kabul ve ücret yükümlülükleriyle işin tamamlanması',
  region:'Ankara', baseline_total_cost:'1000000', actual_total_cost:'900000',
  planned_days:'30', actual_days:'26', accepted_work_units:'1',
  worker_count:'10', is_demo:true,
};
const CURRENCY = new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2});
const NUMBERS = new Intl.NumberFormat('tr-TR',{maximumFractionDigits:1});
const currency = (v) => CURRENCY.format(Number(v)||0);
const FIELD_NAMES = [
  ['baseline_total_cost','Başlangıç toplam maliyeti (TL)','Sözleşmeli planlanan bütün giderler'],
  ['actual_total_cost','Gerçekleşen toplam maliyet (TL)','Tüm zorunlu giderler dahil; bonus dağıtılmadan önce'],
  ['planned_days','Planlanan süre (gün)','Kalite ve kabul hedefi aynı olmalı'],
  ['actual_days','Gerçekleşen süre (gün)','Sadece daha kısa sürmesi hakediş üretmez'],
  ['worker_count','Çalışan sayısı','Ek pay için yalnızca senaryo hesabında kullanılır'],
  ['accepted_work_units','Kabul edilen iş birimi (isteğe bağlı)','m², kg, adet vb. aynı teknik kapsam'],
];
const SHARE_FIELDS = [
  ['employer_share_pct','İşveren','employer'],
  ['workers_share_pct','Çalışanlar','workers'],
  ['contractor_share_pct','Uygulayıcı firma','contractor'],
  ['atlas_share_pct','Atlas koordinasyon','atlas'],
];
const STEPS = [
  ['Kapsamı sabitle','Başlangıç iş paketini, miktarları, teknik şartnameyi, ücret/İSG gerekliliklerini ve proje planını kaydet.'],
  ['Süreç kayıplarını azalt','Malzeme ve ekip beklemeleri, tekrar işçilik, hazırlıksız başlangıç ve gecikme nedenlerini izle.'],
  ['Belgeli sonuçları karşılaştır','Gerçekleşen maliyeti ve süreyi aynı kapsamdaki başlangıçla karşılaştır; kalite ve kabulü doğrula.'],
  ['Adil kazancı sözleşmeyle kararlaştır','Normal ücretler korunurken ek verimlilik payını çalışanlar dahil tarafların mutabakatıyla ayrıca değerlendir.'],
];

export default function EfficiencyPilotDesk() {
  const {user} = useAuth();
  const admin = user?.role === 'admin';
  const [form,setForm] = useState(INITIAL);
  const [records,setRecords] = useState([]);
  const [editingId,setEditingId] = useState('');
  const [busy,setBusy] = useState(false);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const calc = calculateEfficiency(form);
  const set = (key,value) => setForm(old=>({...old,[key]:value}));
  async function loadRecords() {
    if (!admin) {setLoading(false);return;}
    try {
      const r = await base44.entities.EfficiencyPilot.list('-created_date',100);
      setRecords(Array.isArray(r)?r:r?.items||[]);
    } catch (e) {
      setError('Pilot kayıtları yüklenemedi. Yönetici yetkisi veya veri modeli kontrol edilmeli.');
    } finally {setLoading(false);}
  }
  useEffect(()=>{loadRecords();},[admin,user?.id]);

  const reset = () => {setForm({...INITIAL});setEditingId('');setError('');setNotice('');};
  const example = () => {setForm({...DEMO});setEditingId('');setError('');setNotice('Bu yalnızca varsayımsal hesap örneğidir; gerçek proje veya tasarruf değildir.');};
  const edit = (row) => {
    const next = {...INITIAL};
    for (const k of Object.keys(INITIAL)) {
      if (row[k] !== undefined && row[k] !== null) next[k] = row[k];
    }
    setForm(next);
    setEditingId(row.id);
    setError('');
    setNotice('Kayıt inceleme için açıldı; herhangi bir ödeme veya sözleşme işlemi yapılmaz.');
    window.scrollTo({top:0,behavior:'smooth'});
  };
  async function save(event) {
    event.preventDefault();
    if (!admin || busy) return;
    setError('');setNotice('');
    if (!form.title.trim() || !calc.validCosts || !calc.validDays || !calc.validWorkerCount || !calc.shareValid) {
      setError('Proje adı, geçerli maliyet ve süre, pozitif tam sayı çalışan sayısı ve toplamı %100 olan pay oranları gerekli.');
      return;
    }
    if (form.title.length > 180 || form.scope.length > 2500) {
      setError('Proje adı veya kapsam alanı çok uzun.');
      return;
    }
    const values = {
      ...form,
      title:form.title.trim(),scope:form.scope.trim().slice(0,2500),
      project_reference:form.project_reference.trim().slice(0,150),
      region:form.region.trim().slice(0,120),
      review_note:form.review_note.trim().slice(0,2000),
      baseline_total_cost:Number(form.baseline_total_cost),
      actual_total_cost:Number(form.actual_total_cost),
      planned_days:Number(form.planned_days),
      actual_days:Number(form.actual_days),
      worker_count:Number(form.worker_count),
      accepted_work_units:Number(form.accepted_work_units)||0,
      employer_share_pct:Number(form.employer_share_pct),
      workers_share_pct:Number(form.workers_share_pct),
      contractor_share_pct:Number(form.contractor_share_pct),
      atlas_share_pct:Number(form.atlas_share_pct),
      status:calc.reviewEligible?'review_pending':'draft',
    };
    setBusy(true);
    try {
      if (editingId) await base44.entities.EfficiencyPilot.update(editingId,values);
      else await base44.entities.EfficiencyPilot.create(values);
      await loadRecords();
      setEditingId('');
      setNotice('Pilot taslağı kaydedildi. Tasarruf doğrulanmış gelir, çalışan primi veya ödeme yetkisi değildir.');
    } catch (e) {setError('Kayıt kaydedilemedi. Lütfen bağlantıyı ve yönetici erişimini kontrol edin.');}
    finally {setBusy(false);}
  }
  const real = records.filter(x=>!x.is_demo);
  const pendingReview = real.filter(x=>x.status==='review_pending');
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-amber-700">Atlas Endüstri Ağı · Operasyonel verimlilik</p>
          <h1 className="mt-1 text-2xl font-black text-foreground">Verimlilik ve Adil Kazanç Motoru</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Daha hızlı çalışma baskısı yerine; doğru planlama, daha az bekleme, teknik kabul ve güvenli çalışma
            üzerinden ölçülebilir tasarruf. Çalışanların temel hakları tasarruf kalemi değildir.
          </p>
        </div>
        <Link to="/ticari-talepler" className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold">Ticari pilot merkezi</Link>
      </header>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['Gerçek pilot taslağı',real.length,Factory],
          ['Sözleşme incelemesi bekleyen',pendingReview.length,ClipboardCheck],
          ['Otomatik ödeme',0,ShieldAlert],
          ['Model', 'V1 Pilot',Calculator],
        ].map(([label,val,Icon])=>(
          <div key={label} className="rounded-xl border border-border bg-card p-3">
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground"><Icon size={13}/>{label}</p>
            <p className="mt-2 text-xl font-black tabular-nums">{val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-950">
        <ShieldAlert size={16} className="mr-2 inline" />
        <strong>Yönetici pilotu — herhangi bir ödeme talimatı değildir.</strong>
        Hesaplamalar yalnızca tahmini karşılaştırmadır. İşçilik, SGK, fazla mesai, İSG, kalite ve garanti
        giderlerini azaltmak veya eksik ödemek tasarruf değildir. Kamu projelerinde özel sektör pay
        dağıtımı uygulanmaz; önce sözleşme ve mevzuat incelemesi gerekir.
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold"><Calculator size={18}/> Pilot senaryosu ve maliyet hesabı</h2>
          <div className="flex gap-2">
            <button type="button" onClick={example} className="rounded-md border border-border px-3 py-2 text-xs font-bold">Örnek yükle</button>
            <button type="button" onClick={reset} className="rounded-md border border-border px-3 py-2 text-xs font-bold"><RotateCcw size={13} className="mr-1 inline"/>Temizle</button>
          </div>
        </div>
        {form.is_demo && <p className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs font-bold text-sky-900">ÖRNEK SENARYO — gerçek tasarruf, iş veya müşteri değildir.</p>}
        <form onSubmit={save} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['title','Proje / pilot adı *',180],
              ['project_reference','Proje veya iş paketi referansı',150],
              ['region','İl / bölge',120],
            ].map(([key,label,max])=>(
              <label key={key} className="block text-xs font-bold text-foreground">{label}
                <input value={form[key]} onChange={event=>set(key,event.target.value)} maxLength={max}
                  required={key==='title'} placeholder={key==='title'?'Örn. Çelik imalat ve montaj pilotu':''}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
              </label>
            ))}
            <label className="block text-xs font-bold text-foreground">İşveren türü
              <select value={form.employer_type} onChange={event=>set('employer_type',event.target.value)}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal">
                <option value="private_company">Özel şirket</option>
                <option value="public_institution">Kamu kurumu / kamu ihalesi</option>
              </select>
            </label>
            <label className="block text-xs font-bold sm:col-span-2">Sabit iş kapsamı ve teknik kabul hedefi
              <textarea rows={2} maxLength={2500} value={form.scope}
                onChange={event=>set('scope',event.target.value)}
                placeholder="Aynı miktar, kalite, malzeme, işçilik ve İSG koşulları karşılaştırılmalı."
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FIELD_NAMES.map(([key,label,help])=>(
              <label key={key} className="block text-xs font-bold text-foreground">{label}
                <input type="number" min={key==='accepted_work_units'?'0':'0.01'}
                  step={key==='worker_count'?'1':'any'}
                  value={form[key]} onChange={event=>set(key,event.target.value)}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
                <span className="mt-1 block text-[10px] font-normal leading-4 text-muted-foreground">{help}</span>
              </label>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Maliyet farkı (dağıtım öncesi)</p>
              <p className={'mt-2 text-lg font-black tabular-nums '+(calc.rawSaving!==null&&calc.rawSaving<0?'text-rose-700':'text-foreground')}>
                {calc.validCosts?currency(calc.rawSaving):'—'}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">Pozitif fark otomatik hakediş değildir.</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="flex items-center gap-1 text-xs text-muted-foreground"><Timer size={13}/> Süre farkı</p>
              <p className="mt-2 text-lg font-black">{calc.validDays?NUMBERS.format(calc.daysSaved)+' gün':'—'}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Kalite ve İSG doğrulanmadan başarı sayılmaz.</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Sözleşme incelemesine uygunluk</p>
              <p className="mt-2 text-sm font-black">{calc.reviewEligible?'Kontrol için hazırlanabilir':'Henüz uygun değil'}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{calc.publicProject?'Kamu için özel paylaşım kilitli':calc.missingGates.length+' doğrulama adımı bekliyor'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold"><Users size={16}/> Varsayımsal ek kazanç paylaşımı</h3>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              Oranlar birlikte %100 olmalı. Çalışan payı temel ücrete ilavedir. Sözleşme ve ödeme yükümlülüğü oluşturmaz.
              Atlas payı varsa ayrı ticari hizmet bedeli olarak hukuken değerlendirilir.
            </p>
            {calc.publicProject ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-950">
                Kamu projesi seçili: tasarruf dağıtımı hesaplanmaz. Kamu sözleşmesi, ihale ve bütçe mevzuatı ayrıca değerlendirilmeli.
              </p>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {SHARE_FIELDS.map(([field,label,key])=>(
                    <label key={field} className="text-[11px] font-semibold text-muted-foreground">{label} (%)
                      <input type="number" min="0" max="100" step="0.1" value={form[field]}
                        onChange={event=>set(field,event.target.value)}
                        className="mt-1 block w-full rounded-md border border-border bg-card px-2 py-2 text-sm text-foreground"/>
                      <span className="mt-1 block text-xs font-bold text-foreground">
                        {calc.projections?currency(calc.projections[key]):'—'}
                      </span>
                    </label>
                  ))}
                </div>
                <p className={'mt-2 text-xs font-semibold '+(calc.shareValid?'text-emerald-700':'text-rose-700')}>
                  Toplam pay oranı: {Number.isFinite(calc.shareSum)?NUMBERS.format(calc.shareSum)+'%':'Geçersiz'} {calc.shareValid?'':'· %100 olmalı'}
                </p>
                {calc.projections && calc.validWorkerCount && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Çalışan payı eşit bölünse kişi başı varsayımsal ek tutar:
                    <strong className="ml-1">{currency(calc.projections.workers/Number(form.worker_count))}</strong>.
                    Gerçek dağılım toplu/kişisel sözleşme ve eşit davranma ilkelerine göre ayrıca kararlaştırılmalı.
                  </p>
                )}
                {calc.projections && !calc.reviewEligible && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
                    Bunlar sadece hesaplanan senaryo tutarlarıdır; koşullar sağlanmadığından dağıtılabilir kazanç değildir.
                  </p>
                )}
              </>
            )}
          </div>

          <section className="rounded-xl border border-border bg-background p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold"><FileCheck2 size={16}/> Kalite, güvenlik ve çalışan hakları kapısı</h3>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">Kutucukları işaretlemek resmî doğrulama yerine geçmez; yöneticinin belgeyle teyit etmesi gerekir.</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {SAVING_GATES.map(gate=>(
                <label key={gate.key} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs leading-5">
                  <input type="checkbox" checked={form[gate.key]===true}
                    onChange={event=>set(gate.key,event.target.checked)} className="mt-1"/>
                  {gate.label}
                </label>
              ))}
            </div>
            {calc.publicProject && (
              <label className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs">
                <input type="checkbox" checked={form.public_legal_clearance===true}
                  onChange={event=>set('public_legal_clearance',event.target.checked)} className="mt-1"/>
                İlgili kamu kurumunun ihale/sözleşme ve bütçe yönünden hukuki değerlendirmesi yapıldı (işaretlemek paylaşımı açmaz).
              </label>
            )}
            <label className="mt-3 block text-xs font-bold">Yönetici inceleme notu
              <textarea rows={3} value={form.review_note} onChange={event=>set('review_note',event.target.value)}
                maxLength={2000} placeholder="Belge numaraları, maliyet hesabının varsayımları, bekleme nedenleri, işçilik ve kalite kontrol..."
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-normal"/>
            </label>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {calc.reviewEligible
                ? 'Ön koşullar işaretli. Yine de bağımsız sözleşme incelemesi, yönetici kararı ve hukuki onay gerekir.'
                : 'Sözleşme ön incelemesine hazır değil. Eksikler tamamlanmadan çalışan payı veya ticari gelir beyan edilmez.'}
            </p>
          </section>

          {error&&<p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-900">{error}</p>}
          {notice&&<p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">{notice}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={!admin||busy||!calc.validCosts||!calc.validDays||!calc.shareValid||!calc.validWorkerCount||!form.title.trim()}
              className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
              <Save size={15} className="mr-2 inline"/>{busy?'Kaydediliyor...':editingId?'Pilot kaydını güncelle':'Pilot taslağı kaydet'}
            </button>
            <span className="text-[11px] text-muted-foreground">Taslak kaydı ödeme veya hakediş oluşturmaz.</span>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-bold">Yol haritası: verimlilikten adil paylaşıma</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {STEPS.map(([title,body],i)=>(
            <div key={title} className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] font-extrabold text-amber-700">AŞAMA {i+1}</p>
              <p className="mt-1 text-sm font-bold">{title}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-bold"><ClipboardCheck size={16}/> Kayıtlı pilot senaryoları</h2>
        <p className="mt-1 text-xs text-muted-foreground">Demo kayıtlar gerçek iş, tasarruf, çalışan ödemesi veya pilot başarısı sayılmaz.</p>
        {loading&&<p className="mt-3 text-xs text-muted-foreground">Kayıtlar yükleniyor…</p>}
        {!loading&&!records.length&&<p className="mt-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Henüz kayıtlı senaryo yok. Örnek yükle ile hesaplamayı deneyebilirsin.</p>}
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {records.map(row=>{
            const result=calculateEfficiency(row);
            return <article key={row.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold">{row.title}</p>
                <span className="rounded-md border border-border px-2 py-1 text-[10px] font-semibold">{row.is_demo?'DEMO':row.status==='review_pending'?'İnceleme bekliyor':'Taslak'}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{row.region||'Bölge belirtilmedi'} · {row.employer_type==='public_institution'?'Kamu':'Özel sektör'}</p>
              <p className="mt-2 text-xs">Hesap farkı: <strong>{result.validCosts?currency(result.rawSaving):'Hesaplanmadı'}</strong> · Süre: {result.validDays?NUMBERS.format(result.daysSaved)+' gün':'—'}</p>
              <button type="button" onClick={()=>edit(row)}
                className="mt-2 rounded-lg border border-border px-3 py-2 text-xs font-bold">Kaydı incele / düzenle</button>
            </article>;
          })}
        </div>
      </section>
    </div>
  );
}
