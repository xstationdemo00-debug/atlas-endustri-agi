import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TRADES } from '@/lib/format';
import { UserPlus } from 'lucide-react';

export default function WorkerProfileDialog({ user, profile, onSaved }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || user?.full_name || '',
    phone: profile?.phone || '',
    city: profile?.city || '',
    trade: profile?.trade || 'Çelik konstrüksiyon',
    experience_years: profile?.experience_years?.toString() || '',
    daily_rate: profile?.daily_rate?.toString() || '',
    bio: profile?.bio || '',
    is_team_leader: profile?.is_team_leader || false,
    team_size: profile?.team_size?.toString() || '1',
  });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      user_email: user?.email,
      full_name: form.full_name,
      phone: form.phone,
      city: form.city,
      country: 'Türkiye',
      trade: form.trade,
      experience_years: Number(form.experience_years) || 0,
      daily_rate: Number(form.daily_rate) || 0,
      currency: 'TRY',
      bio: form.bio,
      is_team_leader: form.is_team_leader,
      team_size: Number(form.team_size) || 1,
      availability: 'available',
    };
    try {
      if (profile?.id) {
        await base44.entities.WorkerProfile.update(profile.id, payload);
      } else {
        await base44.entities.WorkerProfile.create(payload);
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
        <Button size="sm" variant={profile ? 'outline' : 'default'}>
          <UserPlus size={14} className="mr-1.5" /> {profile ? 'Profilimi düzenle' : 'Profil oluştur'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usta profili</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Ad Soyad</Label>
              <Input required value={form.full_name} onChange={set('full_name')} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={set('phone')} placeholder="+90 5xx xxx xx xx" />
            </div>
            <div>
              <Label>Meslek</Label>
              <Select value={form.trade} onValueChange={(v) => setForm((p) => ({ ...p, trade: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRADES.map((trade) => <SelectItem key={trade} value={trade}>{trade}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Şehir</Label>
              <Input value={form.city} onChange={set('city')} placeholder="İstanbul" />
            </div>
            <div>
              <Label>Deneyim (yıl)</Label>
              <Input type="number" value={form.experience_years} onChange={set('experience_years')} />
            </div>
            <div>
              <Label>Günlük ücret (TRY)</Label>
              <Input type="number" value={form.daily_rate} onChange={set('daily_rate')} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Ekip lideriyim</p>
              <p className="text-xs text-muted-foreground">Kendi ekibinizle teklif verebiliyorsanız işaretleyin.</p>
            </div>
            <Switch
              checked={form.is_team_leader}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, is_team_leader: checked }))}
            />
          </div>
          {form.is_team_leader && (
            <div>
              <Label>Ekip büyüklüğü</Label>
              <Input type="number" min="1" value={form.team_size} onChange={set('team_size')} />
            </div>
          )}
          <div>
            <Label>Kısa tanıtım</Label>
            <Textarea rows={3} value={form.bio} onChange={set('bio')} placeholder="Uzmanlık alanları, tamamlanan sahalar" />
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