import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPANY_TYPES } from '@/lib/format';

export default function CompanyIdentityFields({ form, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Firma adı *</Label>
        <Input required value={form.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Örn. Anadolu Metal İmalat" />
      </div>
      <div>
        <Label>Ticari ünvan *</Label>
        <Input value={form.legal_name} onChange={(e) => onChange('legal_name', e.target.value)} placeholder="Anadolu Metal San. ve Tic. Ltd. Şti." />
      </div>
      <div>
        <Label>Firma tipi</Label>
        <Select value={form.type} onValueChange={(value) => onChange('type', value)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {COMPANY_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Vergi numarası *</Label>
        <Input value={form.tax_number} onChange={(e) => onChange('tax_number', e.target.value)} placeholder="10 haneli vergi no" />
      </div>
      <div>
        <Label>Vergi dairesi</Label>
        <Input value={form.tax_office} onChange={(e) => onChange('tax_office', e.target.value)} placeholder="Örn. Kocaeli" />
      </div>
      <div>
        <Label>Şehir *</Label>
        <Input value={form.city} onChange={(e) => onChange('city', e.target.value)} placeholder="Örn. Kocaeli" />
      </div>
      <div>
        <Label>İlçe</Label>
        <Input value={form.district} onChange={(e) => onChange('district', e.target.value)} />
      </div>
      <div>
        <Label>Telefon *</Label>
        <Input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="+90 ..." />
      </div>
      <div>
        <Label>Firma e-postası *</Label>
        <Input type="email" value={form.email} onChange={(e) => onChange('email', e.target.value)} placeholder="info@firma.com" />
      </div>
      <div>
        <Label>Web sitesi</Label>
        <Input value={form.website} onChange={(e) => onChange('website', e.target.value)} placeholder="https://" />
      </div>
      <div>
        <Label>Çalışan sayısı</Label>
        <Input type="number" min="0" value={form.employee_count} onChange={(e) => onChange('employee_count', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Adres</Label>
        <Textarea rows={2} value={form.address} onChange={(e) => onChange('address', e.target.value)} placeholder="Fabrika / merkez adresi" />
      </div>
    </div>
  );
}