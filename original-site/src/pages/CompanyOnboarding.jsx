import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import CompanyIdentityFields from '@/components/company/CompanyIdentityFields';
import CompanyCapabilityFields from '@/components/company/CompanyCapabilityFields';
import CompanyDocumentsPanel from '@/components/company/CompanyDocumentsPanel';
import { getMyCompany } from '@/lib/tenant';
import { VERIFICATION_COPY, verificationProgress } from '@/lib/companyVerification';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send } from 'lucide-react';

const STEPS = ['Firma bilgileri', 'Üretim kabiliyetleri', 'Belgeler', 'Başvuru özeti'];
const EMPTY = {
  name: '', legal_name: '', type: 'subcontractor', tax_number: '', tax_office: '', city: '', district: '',
  address: '', phone: '', email: '', website: '', about: '', trades: '', employee_count: '',
  manufacturing_family: 'sheet_metal', capability_tags: [], material_tags: [], cooperation_opt_in: false,
};

const fillForm = (company, user) => ({
  ...EMPTY,
  name: company?.name || '',
  legal_name: company?.legal_name || '',
  type: company?.type || 'subcontractor',
  tax_number: company?.tax_number || '',
  tax_office: company?.tax_office || '',
  city: company?.city || '',
  district: company?.district || '',
  address: company?.address || '',
  phone: company?.phone || '',
  email: company?.email || user?.email || '',
  website: company?.website || '',
  about: company?.about || '',
  trades: (company?.trades || []).join(', '),
  employee_count: company?.employee_count ? String(company.employee_count) : '',
  manufacturing_family: company?.manufacturing_family || 'sheet_metal',
  capability_tags: company?.capability_tags || [],
  material_tags: company?.material_tags || [],
  cooperation_opt_in: !!company?.cooperation_opt_in,
});

export default function CompanyOnboarding() {
  const { user } = useAuth() || {};
  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadDocs = async (companyId) => {
    const page = await base44.entities.CompanyDocument.filter({ company_id: companyId }, { limit: 100 });
    setDocuments(page.items || []);
  };

  const load = async () => {
    const mine = await getMyCompany(user);
    setCompany(mine);
    setForm(fillForm(mine, user));
    if (mine?.id) await loadDocs(mine.id);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.id]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggle = (key, value) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }));

  const payload = () => ({
    name: form.name.trim(),
    legal_name: form.legal_name.trim(),
    type: form.type,
    tax_number: form.tax_number.trim(),
    tax_office: form.tax_office.trim(),
    country: 'Türkiye',
    city: form.city.trim(),
    district: form.district.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    website: form.website.trim(),
    about: form.about.trim(),
    trades: form.trades ? form.trades.split(',').map((item) => item.trim()).filter(Boolean) : [],
    employee_count: Number(form.employee_count) || 0,
    currency: 'TRY',
    owner_email: user?.email,
    manufacturing_family: form.manufacturing_family,
    capability_tags: form.capability_tags,
    material_tags: form.material_tags,
    cooperation_opt_in: !!form.cooperation_opt_in,
  });

  const saveDraft = async () => {
    if (company?.id) {
      await base44.entities.Company.update(company.id, payload());
      return company;
    }
    const created = await base44.entities.Company.create(payload());
    setCompany(created);
    return created;
  };

  const next = async () => {
    setError('');
    setNotice('');
    if (step === 0) {
      const missing = ['name', 'legal_name', 'tax_number', 'city', 'phone', 'email'].filter((key) => !String(form[key] || '').trim());
      if (missing.length) {
        setError('Zorunlu alanları doldurun: firma adı, ticari ünvan, vergi no, şehir, telefon ve firma e-postası.');
        return;
      }
    }
    if (step === 1 && form.capability_tags.length === 0) {
      setError('En az bir üretim kabiliyeti seçin.');
      return;
    }
    setSaving(true);
    try {
      await saveDraft();
      setStep((prev) => Math.min(STEPS.length - 1, prev + 1));
    } catch (err) {
      setError('Firma bilgileri kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const saved = await saveDraft();
      const response = await base44.functions.invoke('submitCompanyVerification', { company_id: saved.id });
      const result = response?.data ?? response;
      if (!result?.ok) throw new Error(result?.error || 'Başvuru gönderilemedi.');
      await load();
      setNotice('Başvurunuz alındı. Belgeler Atlas ekibi tarafından inceleniyor.');
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Başvuru gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="py-12 text-center text-sm text-muted-foreground">Firma kaydı yükleniyor...</p>;

  const progress = verificationProgress(company, documents);
  const status = company?.verification_status || 'pending';

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <PageHeader
        title="Firma kaydı ve doğrulama"
        description="Firmanızı Atlas Endüstri Ağı'na kaydedin. Bilgiler ve belgeler tamamlandığında başvuru incelemeye alınır."
        badge={<StatusBadge status={status} />}
      >
        <Link to="/firmalar" className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted">
          Firmalar
        </Link>
      </PageHeader>

      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((label, index) => (
          <button
            key={label}
            onClick={() => index < step && setStep(index)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${index === step ? 'bg-primary text-primary-foreground' : index < step ? 'bg-muted text-foreground' : 'bg-muted/50 text-muted-foreground'}`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        {step === 0 && <CompanyIdentityFields form={form} onChange={setField} />}
        {step === 1 && <CompanyCapabilityFields form={form} onChange={setField} onToggle={toggle} />}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Zorunlu belgeler firmanın ticari kimliğini doğrulamak için istenir. Her belge yönetici tarafından tek tek kontrol edilir.
            </p>
            <CompanyDocumentsPanel company={company} documents={documents} onChanged={() => loadDocs(company.id)} />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-bold text-foreground">{company?.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {company?.legal_name || 'Ticari ünvan yok'} · {company?.city || '—'} · {company?.email || '—'}
              </p>
            </div>
            <div className="space-y-1.5">
              {progress.steps.map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={13} className={item.done ? 'text-emerald-600' : 'text-muted-foreground'} />
                  <span className={item.done ? 'text-foreground' : 'font-medium text-destructive'}>{item.label}</span>
                </div>
              ))}
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
              {VERIFICATION_COPY[status]?.body} Doğrulama sonrası kapasite ve kalite belgeleri ayrıca teyit edilir; başvuru tek başına sözleşme veya iş garantisi oluşturmaz.
            </p>
            {status === 'in_review' || status === 'verified' ? (
              <p className="text-xs text-muted-foreground">
                {status === 'verified'
                  ? 'Firmanız doğrulandı. Bilgi güncellemeleriniz profilinize yansır.'
                  : 'Başvurunuz inceleniyor. Sonuç bildirim olarak gelecek.'}
              </p>
            ) : (
              <button
                onClick={submit}
                disabled={saving || !progress.complete}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Doğrulama başvurusunu gönder
              </button>
            )}
            {!progress.complete && (
              <p className="text-xs text-muted-foreground">Başvuruyu göndermek için eksik adımları tamamlayın.</p>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}
        {notice && <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-900">{notice}</p>}

        {step < 3 && (
          <div className="mt-4 flex justify-between gap-2 border-t border-border pt-3">
            <button
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0 || saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-40"
            >
              <ArrowLeft size={14} /> Geri
            </button>
            <button
              onClick={next}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {step === 2 ? 'Özete geç' : 'Kaydet ve devam et'} <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}