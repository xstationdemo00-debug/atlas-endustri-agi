import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OfferDialog({ request, user, company }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    applicant_name: user?.full_name || '',
    applicant_type: 'company',
    team_size: '',
    amount: '',
    duration_days: '',
    notes: '',
  });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
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
      // Güvenli bildirim yetkisi: gerçek işveren adresi sunucuda doğrulanır.
      // Bildirim başarısız olursa oluşturulmuş teklif korunur.
      try { await base44.functions.invoke('notifyOfferSubmission', { offer_id: newOffer.id }); }
      catch (error) { console.warn('Teklif oluştu; güvenli bildirim ayrıca kontrol edilmeli.'); }
      setOpen(false);
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
              <Input required type="number" value={form.amount} onChange={set('amount')} placeholder="0" />
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