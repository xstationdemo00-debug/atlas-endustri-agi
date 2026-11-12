import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import { STATUS_LABELS } from '@/lib/labels';

function BarList({ title, rows, keyField }) {
  const max = Math.max(1, ...rows.map((row) => row.count || 0));
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="font-heading text-sm font-bold text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Veri yok.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <div key={row[keyField]}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground/80">
                  {STATUS_LABELS[row[keyField]] || row[keyField] || '—'}
                </span>
                <span className="text-muted-foreground">{row.count}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(((row.count || 0) / max) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth() || {};
  const [data, setData] = useState({ projects: [], offers: [], cities: [], companies: [], totals: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [projects, offers, cities, companies, projectCount, workerCount] = await Promise.all([
        base44.entities.Project.aggregate({ query: {}, groupBy: 'status' }),
        base44.entities.Offer.aggregate({ query: {}, groupBy: 'status' }),
        base44.entities.Project.aggregate({ query: {}, groupBy: 'city' }),
        base44.entities.Company.aggregate({ query: {}, groupBy: 'verification_status' }),
        base44.entities.Project.count(),
        base44.entities.WorkerProfile.count(),
      ]);
      setData({
        projects: projects.rows || [],
        offers: offers.rows || [],
        cities: (cities.rows || []).sort((a, b) => b.count - a.count).slice(0, 6),
        companies: companies.rows || [],
        totals: { projects: projectCount, workers: workerCount },
      });
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <PageHeader
        title="Raporlar"
        description="Proje, teklif ve doğrulama durumlarının özeti; bölge kırılımlı iş gücü dağılımı."
      />

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Raporlar hazırlanıyor...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Toplam proje', value: data.totals.projects },
              { label: 'Havuzdaki usta', value: data.totals.workers },
              { label: 'Bekleyen firma', value: data.companies.find((row) => row.verification_status === 'pending')?.count || 0 },
              { label: 'Kabul edilen teklif', value: data.offers.find((row) => row.status === 'accepted')?.count || 0 },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-heading text-2xl font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <BarList title="Proje durumları" rows={data.projects} keyField="status" />
            <BarList title="Teklif durumları" rows={data.offers} keyField="status" />
            <BarList title="Şehir bazlı projeler" rows={data.cities} keyField="city" />
            <BarList title="Firma doğrulama" rows={data.companies} keyField="verification_status" />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <BarChart3 size={15} className="mt-0.5 shrink-0 text-accent" />
            Raporlar yalnızca erişim yetkiniz olan kayıtları kapsar. Ülke ve bölge bazlı kırılımlar
            yeni pazarlar açıldıkça genişler.
          </div>
        </>
      )}
    </div>
  );
}