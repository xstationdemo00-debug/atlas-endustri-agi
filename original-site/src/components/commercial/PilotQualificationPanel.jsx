import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ClipboardCheck, FileCheck2, ShieldAlert } from 'lucide-react';

const CHECKS = [
  ['buyer_confirmed','Talebin firmadan geldiği ve yetkilisi teyit edildi'],
  ['scope_confirmed','İş kapsamı ve teknik gereklilikler firma ile doğrulandı'],
  ['budget_confirmed','Bütçe ve ödeme sorumluluğu teyit edildi'],
  ['safety_checked','İSG, işçi hakları, gerekli belge ve saha riskleri incelendi'],
  ['acceptance_checked','Kalite ölçütleri ve işin kabul koşulları açık'],
  ['legal_checked','Sözleşme, ticari model ve yetkilendirme kontrol edildi'],
];
const EMPTY = {
  scope:'', technical_deliverable:'', needed_capabilities:'',
  baseline_duration_days:'', desired_duration_days:'', budget_note:'',
  location_note:'', next_action:'', next_action_date:'', internal_note:'',
  buyer_confirmed:false, scope_confirmed:false, budget_confirmed:false,
  safety_checked:false, acceptance_checked:false, legal_checked:false,
};
const safeValue = (value) => String(value ?? '').trim();
const numberOrZero = (value) => value === '' ? 0 : Number(value);
const validOptionalDay = (value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0);

export default function PilotQualificationPanel({ inquiries = [] }) {
  const real = inquiries.filter((row) => !row.is_demo);
  const [records, setRecords] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selected = real.find((row) => row.id === selectedId) || null;
  const matched = records.find((row) => row.inquiry_id === selectedId);
  const done = CHECKS.filter(([key]) => form[key] === true).length;
  const ready = done === CHECKS.length && !!safeValue(form.scope) &&
    !!safeValue(form.technical_deliverable) && !!safeValue(form.needed_capabilities) &&
    !!safeValue(form.next_action) && !!safeValue(form.budget_note);
  const qualifiedCount = records.filter((row) => row.status === 'ready_for_proposal').length;

  const load = async () => {
    try {
      const res = await base44.entities.PilotQualification.list('-created_date', 100);
      setRecords(Array.isArray(res) ? res : res?.items || []);
    } catch {
      setError('Pilot nitelendirme kayıtları yüklenemedi; yönetici erişimini kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const source = records.find((row) => row.inquiry_id === selectedId);
    const inquiry = real.find((row) => row.id === selectedId);
    const next = { ...EMPTY };
    if (source) {
      for (const key of Object.keys(EMPTY)) {
        if (source[key] !== null && source[key] !== undefined) next[key] = source[key];
      }
    } else if (inquiry) {
      next.scope = inquiry.description || '';
      next.location_note = inquiry.city || '';
    }
    setForm(next);
  }, [selectedId, records]);

  const save = async (event) => {
    event.preventDefault();
    if (!selected || selected.is_demo || saving) return;
    setError('');
    setNotice('');
    if (!safeValue(form.scope) || !safeValue(form.technical_deliverable) || !safeValue(form.next_action)) {
      setError('İş kapsamı, teslim ölçütü ve sıradaki işlem zorunludur.');
      return;
    }
    if (!validOptionalDay(form.baseline_duration_days) || !validOptionalDay(form.desired_duration_days)) {
      setError('Süreler pozitif sayı olmalı veya boş bırakılmalıdır.');
      return;
    }
    const payload = {
      inquiry_id: selected.id,
      company_name: safeValue(selected.company_name).slice(0,180),
      scope: safeValue(form.scope).slice(0,2500),
      technical_deliverable: safeValue(form.technical_deliverable).slice(0,1800),
      needed_capabilities: safeValue(form.needed_capabilities).slice(0,1400),
      baseline_duration_days: numberOrZero(form.baseline_duration_days),
      desired_duration_days: numberOrZero(form.desired_duration_days),
      budget_note: safeValue(form.budget_note).slice(0,900),
      location_note: safeValue(form.location_note).slice(0,500),
      next_action: safeValue(form.next_action).slice(0,900),
      next_action_date: safeValue(form.next_action_date).slice(0,10),
      internal_note: safeValue(form.internal_note).slice(0,1500),
      ...Object.fromEntries(CHECKS.map(([key]) => [key, form[key] === true])),
      status: ready ? 'ready_for_proposal' : done ? 'qualification' : 'draft',
      is_demo: false,
    };
    setSaving(true);
    try {
      if (matched) await base44.entities.PilotQualification.update(matched.id, payload);
      else await base44.entities.PilotQualification.create(payload);
      await load();
      setNotice(ready
        ? 'Ön kontrol tamamlandı; teklif hazırlığı için değerlendirilebilir. Henüz teklif veya sözleşme oluşturulmadı.'
        : 'Nitelendirme taslağı kaydedildi. Açık kontroller tamamlanmadan teklif hazırlığına geçilmez.');
    } catch {
      setError('Pilot kaydı kaydedilemedi. Veri ve yönetici yetkisini kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <ClipboardCheck size={18} /> İlk gerçek pilot — talep nitelendirme
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
            Gelen kurumsal talebi teknik kapsam, hedef süre, maliyet koşulları ve çalışan güvenceleriyle ön incele.
            Bu kayıt iş sözleşmesi, otomatik fiyat teklifi veya kapasite garantisi oluşturmaz.
          </p>
        </div>
        <p className="text-xs font-bold text-foreground">
          {qualifiedCount} teklif ön incelemesine hazır · {real.length} gerçek talep
        </p>
      </div>
      {loading && <p className="mt-3 text-xs text-muted-foreground">Pilot kayıtları yükleniyor…</p>}
      {!real.length ? (
        <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-4">
          <p className="text-sm font-semibold">Henüz doğrulanacak gerçek hizmet talebi yok.</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Mevcut iki örnek talebi gerçek müşteri gibi kullanmıyoruz. İlk adım, bir firmadan belirli kapsamı olan
            iş talebi almak ve ancak o talep üzerinden pilot oluşturmak.
          </p>
          <Link to="/hizmetler" className="mt-3 inline-flex text-xs font-bold text-amber-700 underline">
            Talep gönderme sayfasını görüntüle
          </Link>
        </div>
      ) : (
        <form onSubmit={save} className="mt-4 space-y-3">
          <label className="block text-xs font-bold text-foreground">İncelenecek gerçek talep
            <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setError(''); setNotice(''); }}
              className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal">
              <option value="">Gerçek firma talebi seçin</option>
              {real.map((row) => (
                <option value={row.id} key={row.id}>
                  {row.company_name} · {row.city || 'Konum yok'} · {row.status || 'new'}
                </option>
              ))}
            </select>
          </label>
          {selected && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['scope','Kapsam / firma ihtiyacı','Şartnamedeki işin miktarı ve sınırları'],
                  ['technical_deliverable','Teknik teslim ve kabul kriteri','Hangi çıktı, hangi tolerans ve testlere göre kabul edilecek?'],
                  ['needed_capabilities','Gereken ekip ve uzmanlık','Meslek, ekipman, sertifika, malzeme ve kişi sayısı'],
                  ['budget_note','Bütçe ve ödeme koşulları','Varsayımları ve teyitli rakamları ayrı belirt'],
                  ['location_note','İşin yeri ve lojistik','Konaklama, ulaşım ve saha koşulları'],
                  ['next_action','Bir sonraki somut işlem','Firma görüşmesi, keşif, doküman talebi vb.'],
                ].map(([key,label,hint]) => (
                  <label key={key} className="block text-xs font-bold text-foreground">
                    {label}
                    <textarea value={form[key]} rows={key === 'scope' ? 3 : 2}
                      onChange={(e) => setForm((old) => ({...old, [key]:e.target.value}))}
                      maxLength={key === 'scope' ? 2500 : key === 'technical_deliverable' ? 1800 : 1400}
                      placeholder={hint}
                      className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal" />
                  </label>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['baseline_duration_days','Önceki/normal süre (gün)'],
                  ['desired_duration_days','Hedef süre (gün)'],
                ].map(([key,label]) => (
                  <label key={key} className="block text-xs font-bold">{label}
                    <input type="number" min="0" step="any" value={form[key]}
                      onChange={(e) => setForm(old => ({...old,[key]:e.target.value}))}
                      className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"/>
                  </label>
                ))}
                <label className="block text-xs font-bold">Sonraki kontrol tarihi
                  <input type="date" value={form.next_action_date}
                    onChange={(e) => setForm(old => ({...old,next_action_date:e.target.value}))}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"/>
                </label>
              </div>
              {Number(form.baseline_duration_days) > 0 && Number(form.desired_duration_days) > 0 && (
                <p className="rounded-lg bg-muted/60 p-3 text-xs text-foreground">
                  Firma hedefi: {form.desired_duration_days} gün · karşılaştırma süresi: {form.baseline_duration_days} gün.
                  Süre farkı teknik ve İSG değerlendirmesi olmadan gerçek kazanım sayılmaz.
                </p>
              )}
              <div className="rounded-lg border border-border bg-background p-3">
                <h3 className="flex items-center gap-2 text-sm font-bold"><FileCheck2 size={16}/> Teklif öncesi doğrulama ({done}/{CHECKS.length})</h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {CHECKS.map(([key,label]) => (
                    <label key={key} className="flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-xs leading-5">
                      <input type="checkbox" checked={form[key] === true}
                        onChange={(e) => setForm(old => ({...old,[key]:e.target.checked}))}
                        className="mt-1 shrink-0"/>
                      {label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs font-semibold">
                  {ready ? 'Ön koşullar tamamlandı: teklif için insan incelemesine hazır.' :
                    'Henüz teklif ön incelemesi için eksikler var. Teknik, hukuki ve ticari kontroller korunur.'}
                </p>
              </div>
              <label className="block text-xs font-bold">Yönetici notu
                <textarea value={form.internal_note} rows={2} maxLength={1500}
                  onChange={(e)=>setForm(old=>({...old,internal_note:e.target.value}))}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"/>
              </label>
              {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
              {notice && <p role="status" className="text-xs font-semibold text-emerald-700">{notice}</p>}
              <button type="submit" disabled={saving} className="rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">
                {saving ? 'Kaydediliyor...' : matched ? 'Pilot incelemesini güncelle' : 'Pilot inceleme taslağı oluştur'}
              </button>
              <p className="flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
                <ShieldAlert size={13} className="mt-0.5 shrink-0"/>
                Teklif hazır kararı otomatik iş/işçi yerleştirme, kamu taahhüdü, kazanç veya ödeme anlamına gelmez.
              </p>
            </>
          )}
        </form>
      )}
    </section>
  );
}
