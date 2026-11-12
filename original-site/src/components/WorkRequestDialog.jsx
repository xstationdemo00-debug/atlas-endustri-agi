import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TRADES } from '@/lib/format';
import { Plus } from 'lucide-react';

export default function WorkRequestDialog({ project, onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trade: project.trade || 'Çelik konstrüksiyon',
    headcount: '',
    daily_rate: '',
    start_date: project.start_date || '',
    end_date: project.end_date || '',
    certificates_required: '',
    description: '',
  });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await base44.entities.WorkRequest.create({
        project_id: project.id,
        project_title: project.title,
        company_id: project.company_id,
        company_name: project.company_name,
        owner_email: project.owner_email,
        trade: form.trade,
        headcount: Number(form.headcount) || 1,
        filled_count: 0,
        daily_rate: Number(form.daily_rate) || 0,
        currency: project.currency || 'TRY',
        start_date: form.start_date,
        end_date: form.end_date,
        city: project.city,
        country: project.country,
        certificates_required: form.certificates_required
          ? form.certificates_required.split(',').map((item) => item.trim()).filter(Boolean)
          : [],
        description: form.description,
        status: 'open',
      });
      setOpen(false);
      onCreated?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus size={14} className="mr-1.5" /> İş talebi ekle</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni iş talebi</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Meslek</Label>
            <Select value={form.trade} onValueChange={(v) => setForm((p) => ({ ...p, trade: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRADES.map((trade) => <SelectItem key={trade} value={trade}>{trade}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Kişi sayısı</Label>
              <Input required type="number" min="1" value={form.headcount} onChange={set('headcount')} />
            </div>
            <div>
              <Label>Günlük ücret ({project.currency || 'TRY'})</Label>
              <Input type="number" value={form.daily_rate} onChange={set('daily_rate')} />
            </div>
            <div>
              <Label>Başlangıç</Label>
              <Input type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div>
              <Label>Bitiş</Label>
              <Input type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
          </div>
          <div>
            <Label>Aranan belgeler</Label>
            <Input value={form.certificates_required} onChange={set('certificates_required')} placeholder="İSG temel eğitim, MYK seviye 3" />
          </div>
          <div>
            <Label>Açıklama</Label>
            <Textarea rows={3} value={form.description} onChange={set('description')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : 'Talebi aç'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}