import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PACKAGE_TYPE_LABELS } from '@/lib/tenderAnalysis';

const INITIAL = { name: '', scope_description: '', discipline: '', work_package_type: 'other' };

export default function NewPackageForm({ disabled, onCreate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (disabled || submitting || !form.name.trim()) return;
    setSubmitting(true);
    try {
      const success = await onCreate({
        name: form.name.trim(),
        scope_description: form.scope_description.trim(),
        discipline: form.discipline.trim(),
        work_package_type: form.work_package_type,
      });
      if (success) {
        setForm(INITIAL);
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-3 rounded-xl border border-border bg-background p-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm font-bold text-foreground disabled:opacity-40"
      >
        <span className="flex items-center gap-2"><Plus size={16} />Yeni Paket Oluştur</span>
        {open ? <X size={16} /> : null}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-2 space-y-3 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">
            Yeni paket taslak olarak açılır. İş kalemlerini diğer paketlerdeki «Kalem Taşı» işlemiyle aktarın; boş paket onaylanamaz.
          </p>
          <label className="block text-xs font-semibold text-foreground">
            Paket adı *
            <input required maxLength={120} value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Örn. Endüstriyel Lojistik"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
          </label>
          <label className="block text-xs font-semibold text-foreground">
            İş paketi türü
            <select value={form.work_package_type}
              onChange={(event) => setForm((prev) => ({ ...prev, work_package_type: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
              {Object.entries(PACKAGE_TYPE_LABELS).map(([key, label]) => (
                <option value={key} key={key}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-foreground">
            Uzmanlık alanı
            <input maxLength={80} value={form.discipline}
              onChange={(event) => setForm((prev) => ({ ...prev, discipline: event.target.value }))}
              placeholder="Örn. Lojistik, metal imalat, inşaat"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
          </label>
          <label className="block text-xs font-semibold text-foreground">
            Kapsam açıklaması
            <textarea rows={3} maxLength={600} value={form.scope_description}
              onChange={(event) => setForm((prev) => ({ ...prev, scope_description: event.target.value }))}
              placeholder="Pakete dâhil işleri ve kapsam sınırlarını açıklayın."
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={disabled || submitting || !form.name.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">
              {submitting ? 'Oluşturuluyor...' : 'Taslak Paketi Kaydet'}
            </button>
            <button type="button" disabled={submitting} onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground">
              Vazgeç
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
