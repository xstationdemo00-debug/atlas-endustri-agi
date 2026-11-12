import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Check, X, Globe2, Plus, Plug } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notify } from '@/lib/tenant';
import NeonModerationPanel from '@/components/admin/NeonModerationPanel';

export default function Admin() {
  const { user } = useAuth() || {};
  const [companies, setCompanies] = useState([]);
  const [regions, setRegions] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({ country: '', city: '', currency: 'TRY', language: 'tr', currency_code: 'TRY' });

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    const [companyList, regionList, integrationList] = await Promise.all([
      base44.entities.Company.list(),
      base44.entities.Region.list(),
      base44.entities.IntegrationSetting.list(),
    ]);
    setCompanies(companyList);
    setRegions(regionList);
    setIntegrations(integrationList);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const decide = async (company, status) => {
    await base44.entities.Company.update(company.id, {
      verification_status: status,
      verification_note: status === 'verified' ? 'Kurumsal yönetim tarafından doğrulandı.' : 'Belgeler yetersiz.',
    });
    await notify({
      email: company.owner_email,
      title: status === 'verified' ? 'Firmanız doğrulandı' : 'Firma doğrulaması reddedildi',
      body: `${company.name} kurumsal doğrulama durumu güncellendi.`,
      type: 'system',
      link: '/firmalar',
    });
    await load();
  };

  const addRegion = async (event) => {
    event.preventDefault();
    await base44.entities.Region.create({ ...region, is_active: true, timezone: 'Europe/Istanbul' });
    setRegion({ country: '', city: '', currency: 'TRY', language: 'tr', currency_code: 'TRY' });
    await load();
  };

  const toggleIntegration = async (integration) => {
    await base44.entities.IntegrationSetting.update(integration.id, {
      status: integration.status === 'active' ? 'paused' : 'active',
    });
    await load();
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <EmptyState
          icon={ShieldAlert}
          title="Yönetici yetkisi gerekli"
          description="Firma doğrulama, bölge ve entegrasyon ayarları yalnızca kurumsal yöneticiler tarafından yönetilir."
        />
      </div>
    );
  }

  const pending = []; // Do not confuse owner's company list with the real Neon approval queue.

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <PageHeader
        title="Kurumsal yönetim"
        description="Doğrulanmış hesaplarla yönetim ve kontrollü onay süreçleri. Eski Base44 yönetim işlevlerinin tamamı henüz taşınmadı."
      />

      <NeonModerationPanel />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground">Firma doğrulama</h3>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            {loading
              ? 'Yükleniyor...'
              : pending.length === 0
                ? 'Bekleyen doğrulama başvurusu yok.'
                : `${pending.length} firma bilgi veya inceleme bekliyor.`}{' '}
            Başvurularda ticari bilgiler ve zorunlu belgeler tek tek kontrol edilir.
          </p>
        </div>
        <Link to="/firma-dogrulama" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90">
          Doğrulama masasını aç
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 font-heading text-sm font-bold text-foreground">
            <Globe2 size={15} /> Ülke ve bölgeler
          </h3>
          <div className="mt-3 space-y-1.5">
            {regions.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                <span className="text-foreground/80">{item.country}{item.city ? ` · ${item.city}` : ''}</span>
                <span className="text-muted-foreground">{item.currency_code || item.currency} · {item.language}</span>
              </div>
            ))}
            {regions.length === 0 && <p className="text-xs text-muted-foreground">Henüz bölge tanımlanmadı.</p>}
          </div>
          <form onSubmit={(event)=>event.preventDefault()} className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Ülke</Label>
                <Input required value={region.country} onChange={(e) => setRegion((p) => ({ ...p, country: e.target.value }))} placeholder="Türkiye" />
              </div>
              <div>
                <Label className="text-xs">Şehir / bölge</Label>
                <Input value={region.city} onChange={(e) => setRegion((p) => ({ ...p, city: e.target.value }))} placeholder="İstanbul" />
              </div>
              <div>
                <Label className="text-xs">Para birimi</Label>
                <Select value={region.currency_code} onValueChange={(v) => setRegion((p) => ({ ...p, currency_code: v, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['TRY', 'USD', 'EUR', 'GBP', 'AED'].map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Dil</Label>
                <Select value={region.language} onValueChange={(v) => setRegion((p) => ({ ...p, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['tr', 'en', 'de', 'ar'].map((code) => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" size="sm" variant="outline" disabled title="Bölge yönetimi taşınıyor"><Plus size={14} className="mr-1" /> Bölge ekle</Button>
          </form>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="flex items-center gap-1.5 font-heading text-sm font-bold text-foreground">
            <Plug size={15} /> Entegrasyonlar
          </h3>
          <div className="mt-3 space-y-2">
            {integrations.map((integration) => (
              <div key={integration.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                  <StatusBadge status={integration.status} />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{integration.description}</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => toggleIntegration(integration)} disabled title="Entegrasyon yönetimi taşınıyor">
                  {integration.status === 'active' ? 'Duraklat' : 'Etkinleştir'}
                </Button>
              </div>
            ))}
            {integrations.length === 0 && (
              <p className="text-xs text-muted-foreground">ATLAS Earth gibi entegrasyonlar burada tanımlanır.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}