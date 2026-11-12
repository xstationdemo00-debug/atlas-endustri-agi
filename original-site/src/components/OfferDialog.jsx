import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OfferDialog({ request, user, company, onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    applicant_name: user?.full_name || '',
    applicant_type: 'individual',
    team_size: '',
    amount: '',
    duration_days: '',
    notes: '',
  });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError(''); setSaving(true);
    try {
      if(form.applicant_type==='company' && !company?.id)
        throw new Error('Firma teklifi için önce firmanızı kaydedip doğrulatın.');
      const newOffer = await base44.entities.Offer.create({
        work_request_id: request.id,
        project_id: request.project_id,
        project_title: request.project_title,
        company_id: company?.id || '',
        company_name: company?.name || form.applicant_name,
        owner_email: request.owner_email,
        applicant_name: form.applicant_name || user?.full_name,
        applicant_email: user?.email,
        applicant_type: form.applicant_type,
        amount: Number(form.amount) || 0,
        currency: request.currency || 'TRY',
        duration_days: Number(form.duration_days) || 0,
        team_size: Number(form.team_size) || 1,
        notes: form.notes,
      });
      // Neon sunucusu doğrulanmış işverene bildirimi aynı işlem içinde yazar.
      if (!newOffer?.id) throw new Error('Teklif kaydı doğrulanamadı.');
      onCreated?.();
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Teklif güvenle gönderilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">Teklif ver</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teklif ver · {request.trade}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs text-amber-900 rounded bg-amber-50 border border-amber-200 p-2">Teklif göndermek sözleşme kurulması anlamına gelmez. İmzalı sözleşme, SGK ve İSG kontrolleri tamamlanmadan kabul işlemi yapılamaz.</p>
          {error && <p role="alert" className="text-sm rounded bg-red-50 border border-red-300 p-2 text-red-800">{error}</p>}
          <div>
            <Label>Teklif sahibi</Label>
            <Input required value={form.applicant_name} onChange={set('applicant_name')} placeholder="Ad Soyad / Firma" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Teklif tipi</Label>
              <Select value={form.applicant_type} onValueChange={(v) => setForm((p) => ({ ...p, applicant_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Firma</SelectItem>
                  <SelectItem value="team">Ekip</SelectItem>
                  <SelectItem value="individual">Bağımsız usta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kişi sayısı</Label>
              <Input type="number" min="1" value={form.team_size} onChange={set('team_size')} placeholder="1" />
            </div>
            <div>
              <Label>Toplam tutar ({request.currency})</Label>
              <Input required min="1" step="0.01" type="number" value={form.amount} onChange={set('amount')} placeholder="0" />
            </div>
            <div>
              <Label>Süre (gün)</Label>
              <Input type="number" value={form.duration_days} onChange={set('duration_days')} placeholder="0" />
            </div>
          </div>
          <div>
            <Label>Not</Label>
            <Textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Ekip yapısı, ekipman, referanslar" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Gönderiliyor...' : 'Teklifi gönder'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}