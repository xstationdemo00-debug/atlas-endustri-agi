import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CAPABILITY_LABELS, MATERIAL_LABELS, FAMILY_LABELS } from '@/lib/industrialMatching';

export default function CompanyCapabilityFields({ form, onChange, onToggle }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Üretim / imalat ailesi</Label>
        <select
          className="mt-1 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          value={form.manufacturing_family}
          onChange={(e) => onChange('manufacturing_family', e.target.value)}
        >
          {Object.entries(FAMILY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-semibold">Üretim kabiliyetleri *</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(CAPABILITY_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.capability_tags.includes(value)} onChange={() => onToggle('capability_tags', value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-semibold">İşlenen malzeme türleri</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(MATERIAL_LABELS).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.material_tags.includes(value)} onChange={() => onToggle('material_tags', value)} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <Label>Uzmanlık alanları</Label>
        <Input value={form.trades} onChange={(e) => onChange('trades', e.target.value)} placeholder="Çelik konstrüksiyon, Montaj" />
      </div>
      <div>
        <Label>Firma hakkında</Label>
        <Textarea rows={3} value={form.about} onChange={(e) => onChange('about', e.target.value)} placeholder="Kapasite, makine parkuru, referans işler" />
      </div>
      <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
        <input className="mt-0.5" type="checkbox" checked={form.cooperation_opt_in} onChange={(e) => onChange('cooperation_opt_in', e.target.checked)} />
        Doğrulama sonrası üretim kabiliyetlerimin işbirliği eşleştirmesinde diğer uygun firmalarla paylaşılmasını istiyorum.
      </label>
    </div>
  );
}