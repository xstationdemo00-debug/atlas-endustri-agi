import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SECTORS, TRADES, CURRENCIES } from '@/lib/format';
import { Plus } from 'lucide-react';

const initial = {
  title: '',
  company_name: '',
  sector: 'Enerji',
  trade: 'Çelik konstrüksiyon',
  city: '',
  country: 'Türkiye',
  start_date: '',
  end_date: '',
  budget_amount: '',
  currency: 'TRY',
  headcount_needed: '',
  description: '',
  work_package_type: 'industrial_fabrication',
  technical_scope: '',
  technical_standards: '',
  quantity: '',
  delivery_terms: '',
  bid_deadline: '',
  matching_priority: 'same_manufacturing',
  isg_requirements: '',
  contact_name: '',
  contact_phone: '',
};

export default function NewProjectDialog({ user, company, onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...initial, company_name: company?.name || '' });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await base44.entities.Project.create({
        ...form,
        budget_amount: Number(form.budget_amount) || 0,
        headcount_needed: Number(form.headcount_needed) || 0,
        company_id: company?.id || '',
        company_name: form.company_name || company?.name || '',
        owner_email: user?.email || '',
        is_demo: !!company?.is_demo,
        document_review_required: true,
      });
      setForm({ ...initial, company_name: company?.name || '' });
      setOpen(false);
      onCreated?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={15} className="mr-1.5" /> Yeni proje
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni proje talebi</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950">Bu kayıt önce <strong>Taslak</strong> olarak oluşturulur. Gerçek proje veya ticari taahhüt yayınlanmadan önce firma yetkisi, teknik bilgiler ve uygunluk belgeleri yönetici tarafından kontrol edilmelidir.</div>
          <div>
            <Label>Proje adı</Label>
            <Input required value={form.title} onChange={set('title')} placeholder="Örn. Anadolu RES Faz II" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Firma</Label>
              <Input value={form.company_name} onChange={set('company_name')} placeholder="Firma adı" />
            </div>
            <div>
              <Label>Sektör</Label>
              <Select value={form.sector} onValueChange={(v) => setForm((p) => ({ ...p, sector: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ana meslek</Label>
              <Select value={form.trade} onValueChange={(v) => setForm((p) => ({ ...p, trade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRADES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Şehir</Label>
              <Input value={form.city} onChange={set('city')} placeholder="Eskişehir" />
            </div>
            <div>
              <Label>Başlangıç</Label>
              <Input type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div>
              <Label>Bitiş</Label>
              <Input type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
            <div>
              <Label>Bütçe</Label>
              <Input type="number" value={form.budget_amount} onChange={set('budget_amount')} placeholder="0" />
            </div>
            <div>
              <Label>Para birimi</Label>
              <Select value={form.currency} onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gerekli personel</Label>
              <Input type="number" value={form.headcount_needed} onChange={set('headcount_needed')} placeholder="0" />
            </div>
            <div>
              <Label>İletişim kişisi</Label>
              <Input value={form.contact_name} onChange={set('contact_name')} placeholder="Ad Soyad" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">İş paketi türü
              <select value={form.work_package_type} onChange={set('work_package_type')} className="mt-2 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                <option value="industrial_fabrication">Fason / kaynaklı imalat</option>
                <option value="material_supply">Endüstriyel malzeme tedariği</option>
                <option value="mechanical_installation">Borulama ve mekanik montaj</option>
                <option value="turnkey_project">Anahtar teslim taahhüt</option>
                <option value="maintenance_shutdown">Bakım / duruş işleri</option>
                <option value="industrial_logistics">Sanayi lojistiği</option>
                <option value="other">Diğer proje türü</option>
              </select>
            </label>
            <label className="text-sm font-medium">Eşleştirme önceliği
              <select value={form.matching_priority} onChange={set('matching_priority')} className="mt-2 block h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                <option value="same_manufacturing">Aynı / benzer imalat öncelikli</option>
                <option value="related_process">Tamamlayıcı süreç</option>
                <option value="open">Açık tedarik araştırması</option>
              </select>
            </label>
            <div><Label>Miktar / ölçü / iş büyüklüğü</Label><Input value={form.quantity} onChange={set('quantity')} placeholder="Örn. 120 adet, 15 ton, 300 m"/></div>
            <div><Label>Teklif son tarihi</Label><Input type="date" value={form.bid_deadline} onChange={set('bid_deadline')}/></div>
          </div>
          <div><Label>Teknik iş kapsamı ve malzeme</Label><Textarea rows={3} value={form.technical_scope} onChange={set('technical_scope')} placeholder="Teknik resim, proses, imalat yöntemi, malzeme, kalite beklentileri"/></div>
          <div><Label>Standart / belge gereklilikleri</Label><Textarea rows={2} value={form.technical_standards} onChange={set('technical_standards')} placeholder="Örn. EN 1090, ISO 3834, WPS/PQR (uygunsa)"/></div>
          <div><Label>Teslim, lojistik ve taahhüt koşulları</Label><Textarea rows={2} value={form.delivery_terms} onChange={set('delivery_terms')} placeholder="Teslim noktası, nakliye, montaj kapsamı, proje programı"/></div>
          <div>
            <Label>Açıklama</Label>
            <Textarea rows={3} value={form.description} onChange={set('description')} placeholder="Saha, kapsam ve beklentiler" />
          </div>
          <div>
            <Label>İSG gereklilikleri</Label>
            <Textarea rows={2} value={form.isg_requirements} onChange={set('isg_requirements')} placeholder="Yüksekte çalışma sertifikası, tam donanım vb." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Taslak proje kaydet'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}