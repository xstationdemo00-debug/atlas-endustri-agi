import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPANY_TYPES } from '@/lib/format';
import { CAPABILITY_LABELS, MATERIAL_LABELS, FAMILY_LABELS } from '@/lib/industrialMatching';
import { Building2, Pencil } from 'lucide-react';

export default function CompanyDialog({ user, company, onSaved }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: company?.name || '',
    legal_name: company?.legal_name || '',
    type: company?.type || 'subcontractor',
    tax_number: company?.tax_number || '',
    city: company?.city || '',
    phone: company?.phone || '',
    email: company?.email || user?.email || '',
    website: company?.website || '',
    about: company?.about || '',
    trades: (company?.trades || []).join(', '),
    employee_count: company?.employee_count?.toString() || '',
    manufacturing_family: company?.manufacturing_family || 'sheet_metal',
    capability_tags: company?.capability_tags || [],
    material_tags: company?.material_tags || [],
    cooperation_opt_in: !!company?.cooperation_opt_in,
    tender_alert_opt_in: !!company?.tender_alert_opt_in,
    tender_alert_interest_sectors: company?.tender_alert_interest_sectors || [],
  });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const toggle = (key,value) => setForm(prev => ({...prev,[key]:prev[key].includes(value) ? prev[key].filter(x=>x!==value) : [...prev[key],value]}));
  useEffect(()=>{
    if(!open)return;
    setForm(p=>({
      ...p,
      name:company?.name || '', legal_name:company?.legal_name || '',type:company?.type || 'subcontractor',
      tax_number:company?.tax_number || '',city:company?.city || '',phone:company?.phone || '',
      email:company?.email || user?.email || '',website:company?.website || '',about:company?.about || '',
      trades:(company?.trades || []).join(', '),employee_count:company?.employee_count?.toString() || '',
      manufacturing_family:company?.manufacturing_family || 'sheet_metal',
      capability_tags:company?.capability_tags || [],material_tags:company?.material_tags || [],
      cooperation_opt_in:!!company?.cooperation_opt_in,
      tender_alert_opt_in:!!company?.tender_alert_opt_in,
      tender_alert_interest_sectors:company?.tender_alert_interest_sectors || []
    }));
  },[open,company?.id]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      legal_name: form.legal_name,
      type: form.type,
      tax_number: form.tax_number,
      country: 'Türkiye',
      city: form.city,
      phone: form.phone,
      email: form.email,
      website: form.website,
      about: form.about,
      trades: form.trades ? form.trades.split(',').map((t) => t.trim()).filter(Boolean) : [],
      employee_count: Number(form.employee_count) || 0,
      currency: 'TRY',
      owner_email: user?.email,
      manufacturing_family: form.manufacturing_family,
      capability_tags: form.capability_tags,
      material_tags: form.material_tags,
      cooperation_opt_in: !!form.cooperation_opt_in,
      tender_alert_opt_in: !!form.tender_alert_opt_in,
      tender_alert_interest_sectors: form.tender_alert_interest_sectors,
      tender_alert_channels: ['in_app'],
    };
    try {
      if (company?.id) {
        await base44.entities.Company.update(company.id, payload);
      } else {
        await base44.entities.Company.create(payload);
      }
      setOpen(false);
      await onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={company ? 'outline' : 'default'} className={company ? '' : 'bg-accent text-accent-foreground hover:bg-accent/90'}>
          {company ? <Pencil size={14} className="mr-1.5" /> : <Building2 size={14} className="mr-1.5" />}
          {company ? 'Firmayı düzenle' : 'Firma oluştur'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Firma bilgileri' : 'Firma profili oluştur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Firma adı</Label>
              <Input required value={form.name} onChange={set('name')} />
            </div>
            <div>
              <Label>Ünvan</Label>
              <Input value={form.legal_name} onChange={set('legal_name')} placeholder="Ticari ünvan" />
            </div>
            <div>
              <Label>Firma tipi</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPES.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vergi no</Label>
              <Input value={form.tax_number} onChange={set('tax_number')} />
            </div>
            <div>
              <Label>Şehir</Label>
              <Input value={form.city} onChange={set('city')} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input type="email" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <Label>Çalışan sayısı</Label>
              <Input type="number" value={form.employee_count} onChange={set('employee_count')} />
            </div>
          </div>
          <div>
            <Label>Uzmanlık alanları</Label>
            <Input value={form.trades} onChange={set('trades')} placeholder="Çelik konstrüksiyon, Montaj" />
          </div>
          <div className="rounded-lg border border-border p-3">
            <Label>Üretim / imalat ailesi</Label>
            <select className="mt-2 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" value={form.manufacturing_family} onChange={set('manufacturing_family')}>
              {Object.entries(FAMILY_LABELS).map(([value,label])=><option key={value} value={value}>{label}</option>)}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">Benzer üretici eşleştirmesinde önce bu üretim ailesi dikkate alınır.</p>
          </div>
          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Doğrulanacak üretim kabiliyetleri</legend>
            <div className="grid gap-2 sm:grid-cols-2">{Object.entries(CAPABILITY_LABELS).map(([value,label])=>
              <label key={value} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.capability_tags.includes(value)} onChange={()=>toggle('capability_tags',value)}/>{label}</label>)}
            </div>
          </fieldset>
          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-semibold">İşlediğiniz malzeme türleri</legend>
            <div className="grid gap-2 sm:grid-cols-2">{Object.entries(MATERIAL_LABELS).map(([value,label])=>
              <label key={value} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.material_tags.includes(value)} onChange={()=>toggle('material_tags',value)}/>{label}</label>)}
            </div>
          </fieldset>
          <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <input className="mt-0.5" type="checkbox" checked={form.cooperation_opt_in} onChange={e=>setForm(p=>({...p,cooperation_opt_in:e.target.checked}))}/>
            İşbirliği eşleştirmesi için doğrulandıktan sonra üretim kabiliyetlerimin diğer uygun firmalarla paylaşılmasını istiyorum. Bu işaretleme ticari elektronik ileti pazarlama izni veya otomatik sözleşme oluşturmaz.
          </label>
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-950">İhale ve proje fırsatı bildirim tercihleri</p>
            <label className="flex items-start gap-2 text-xs leading-5 text-amber-950">
              <input type="checkbox" checked={form.tender_alert_opt_in} onChange={e=>setForm(p=>({...p,tender_alert_opt_in:e.target.checked}))} className="mt-1"/>
              Firmamın doğrulaması ve ücretli üyelik aktivasyonu tamamlanırsa, kabiliyetlerimle eşleşen ilanlar için yalnızca uygulama içi bildirim almak istiyorum. İstediğim zaman kapatabilirim. Bu, e-posta/WhatsApp pazarlama izni değildir.
            </label>
            <fieldset>
              <legend className="text-xs font-semibold text-amber-950">Öncelikli iş alanları (isteğe bağlı)</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries({
                welding:'Kaynaklı imalat',machining:'CNC / talaşlı',piping:'Borulama',
                industrial_maintenance:'Bakım',mechanical_installation:'Mekanik montaj',
                coating:'Boya / kaplama',material_supply:'Malzeme tedariği',
                structural_steel:'Çelik konstrüksiyon'
              }).map(([id,name])=><label key={id} className="flex gap-2 text-xs"><input type="checkbox" checked={form.tender_alert_interest_sectors.includes(id)} onChange={()=>toggle('tender_alert_interest_sectors',id)}/>{name}</label>)}</div>
            </fieldset>
            <p className="text-xs text-amber-900">İhale listesi herkesin kullanımına açıktır; özel bildirimler yalnızca doğrulanmış, katılım tercihi bulunan ve ödeme kontrolü tamamlanmış firmalara yöneliktir.</p>
          </div>
          <div>
            <Label>Firma hakkında</Label>
            <Textarea rows={3} value={form.about} onChange={set('about')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}