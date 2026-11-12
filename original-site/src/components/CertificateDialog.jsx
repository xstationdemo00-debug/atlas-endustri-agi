import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Plus, FileText, X } from 'lucide-react';

export default function CertificateDialog({ user, company, onSaved }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    type: 'mesleki',
    issuer: '',
    document_number: '',
    valid_until: '',
  });

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (file && file.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu 10 MB sınırını aşıyor.');
      return;
    }
    setSaving(true);
    try {
      let fileUri = '';
      if (file) {
        const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
        fileUri = uploaded.file_uri;
      }
      await base44.entities.Certificate.create({
        ...form,
        user_email: user?.email,
        owner_name: user?.full_name,
        company_id: company?.id || '',
        file_uri: fileUri,
        file_name: file?.name || '',
        status: 'pending',
      });
      setForm({ name: '', type: 'mesleki', issuer: '', document_number: '', valid_until: '' });
      setFile(null);
      setOpen(false);
      await onSaved?.();
    } catch (err) {
      setError('Belge yüklenemedi. Lütfen dosyayı kontrol edip tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus size={14} className="mr-1.5" /> Belge ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni belge</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Belge adı</Label>
            <Input required value={form.name} onChange={set('name')} placeholder="İSG temel eğitim sertifikası" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Tür</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mesleki">Mesleki yeterlilik</SelectItem>
                  <SelectItem value="isg">İSG</SelectItem>
                  <SelectItem value="saglik">Sağlık raporu</SelectItem>
                  <SelectItem value="diger">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Geçerlilik bitişi</Label>
              <Input type="date" value={form.valid_until} onChange={set('valid_until')} />
            </div>
            <div>
              <Label>Veren kurum</Label>
              <Input value={form.issuer} onChange={set('issuer')} />
            </div>
            <div>
              <Label>Belge no</Label>
              <Input value={form.document_number} onChange={set('document_number')} />
            </div>
          </div>
          <div>
            <Label>Dosya</Label>
            {file ? (
              <div className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText size={14} className="shrink-0 text-accent" />
                  <span className="truncate text-foreground">{file.name}</span>
                  <span className="shrink-0 text-muted-foreground">{(file.size / 1048576).toFixed(1)} MB</span>
                </span>
                <button type="button" onClick={() => setFile(null)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-muted-foreground hover:border-accent">
                <Upload size={15} />
                PDF veya görsel seçin
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    setError('');
                    setFile(e.target.files?.[0] || null);
                  }}
                />
              </label>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">
              PDF, JPG, PNG veya WEBP · en fazla 10 MB · belgeler özel olarak saklanır, yalnızca yetkili kullanıcılar görüntüler.
            </p>
            {error && <p className="mt-1 text-[11px] font-medium text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Yükleniyor...' : 'Belgeyi kaydet'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}