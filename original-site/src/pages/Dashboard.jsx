import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, HardHat, ClipboardList, FileText, Users, ShieldCheck, BookOpenCheck, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatCard from '@/components/StatCard';
import PriorityProjects from '@/components/dashboard/PriorityProjects';
import OfferFeed from '@/components/dashboard/OfferFeed';
import RegionalLoad from '@/components/dashboard/RegionalLoad';
import NotificationFeed from '@/components/dashboard/NotificationFeed';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';

export default function Dashboard() {
  const { user } = useAuth() || {};
  const [stats, setStats] = useState({ projects: 0, requests: 0, offers: 0, workers: 0, pending: 0 });
  const [projects, setProjects] = useState([]);
  const [offers, setOffers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guideVisible, setGuideVisible] = useState(() => { try {return localStorage.getItem('atlas_guide_dismissed_v1')!=='1';}catch{return true;} });
  const closeGuide=()=>{setGuideVisible(false);try{localStorage.setItem('atlas_guide_dismissed_v1','1');}catch{}};

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [openProjects, openRequests, offerCount, workerCount, pendingCompanies, projectPage, offerPage, notificationPage, cityAgg] =
        await Promise.all([
          base44.entities.Project.count({ status: { $in: ['open', 'matching', 'staffed', 'in_progress'] } }),
          base44.entities.WorkRequest.count({ status: 'open' }),
          base44.entities.Offer.count(),
          base44.entities.WorkerProfile.count(),
          base44.entities.Company.count({ verification_status: 'pending' }),
          base44.entities.Project.filter({}, { sort: '-created_date', limit: 4 }),
          base44.entities.Offer.filter({}, { sort: '-created_date', limit: 4 }),
          base44.entities.Notification.filter({}, { sort: '-created_date', limit: 3 }),
          base44.entities.Project.aggregate({ query: {}, groupBy: 'city' }),
        ]);

      setStats({
        projects: openProjects,
        requests: openRequests,
        offers: offerCount,
        workers: workerCount,
        pending: pendingCompanies,
      });
      setProjects(projectPage.items || []);
      setOffers(offerPage.items || []);
      setNotifications(notificationPage.items || []);
      setCities(
        (cityAgg.rows || [])
          .filter((row) => row.city)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((row) => ({ name: row.city, value: row.count }))
      );
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const displayProjects = projects.map((project) => ({
    ...project,
    start: formatDate(project.start_date),
    filled: project.headcount_filled || 0,
    needed: project.headcount_needed || 0,
  }));

  const displayOffers = offers.map((offer) => ({
    ...offer,
    company: offer.company_name || offer.applicant_name,
    project: offer.project_title,
    amount: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: offer.currency || 'TRY', maximumFractionDigits: 0 }).format(offer.amount || 0),
  }));

  const displayNotifications = notifications.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    time: formatDate(item.created_date),
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-extrabold text-foreground sm:text-2xl">
            Merhaba{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Türkiye geneli proje, iş gücü ve teklif hareketleri tek ekranda.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/is-talepleri">İş talepleri</Link>
          </Button>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/projeler">
              <Plus size={15} className="mr-1.5" /> Yeni proje
            </Link>
          </Button>
        </div>
      </div>

      {guideVisible && <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-3"><BookOpenCheck className="shrink-0 text-amber-700" size={25}/><div><h2 className="text-sm font-extrabold text-amber-950">Atlas'a ilk defa mı geldiniz?</h2><p className="mt-1 text-xs text-amber-950">Rolünüzü seçip sistemin dört basit adımda nasıl çalıştığını öğrenin.</p></div></div>
        <div className="flex items-center gap-2"><Link to="/nasil-calisir" className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white">Hızlı rehbere başla</Link><button type="button" onClick={closeGuide} aria-label="Tanıtımı gizle" title="Tanıtımı gizle" className="rounded-md p-2 text-slate-700 hover:bg-amber-100"><X size={17}/></button></div>
      </section>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard icon={HardHat} label="Açık proje" value={stats.projects} hint="Yayında olan projeler" />
        <StatCard icon={ClipboardList} label="İş talebi" value={stats.requests} hint="Açık pozisyon talepleri" tone="accent" />
        <StatCard icon={FileText} label="Teklif" value={stats.offers} hint="Erişiminiz olan teklifler" />
        <StatCard icon={Users} label="Ekip havuzu" value={stats.workers.toLocaleString('tr-TR')} hint="Kayıtlı usta profili" tone="success" />
        <StatCard icon={ShieldCheck} label="Doğrulama" value={stats.pending} hint="Firma doğrulaması bekliyor" tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Panel yükleniyor...
            </div>
          ) : displayProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <p className="font-heading text-sm font-bold text-foreground">Henüz proje yok</p>
              <p className="mt-1 text-xs text-muted-foreground">İlk projeyi oluşturarak iş gücü ağını devreye alın.</p>
              <Button asChild size="sm" className="mt-3 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/projeler">Proje oluştur</Link>
              </Button>
            </div>
          ) : (
            <PriorityProjects projects={displayProjects} />
          )}
          {displayOffers.length > 0 && <OfferFeed offers={displayOffers} />}
        </div>
        <div className="space-y-4">
          {cities.length > 0 && <RegionalLoad regions={cities} />}
          {displayNotifications.length > 0 && <NotificationFeed notifications={displayNotifications} />}
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-4">
            <h3 className="font-heading text-sm font-bold text-foreground">ATLAS Earth entegrasyonu</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              Meteorolojik karar desteği için hazır altyapı. Rüzgâr, yağış ve saha uygunluk verisi
              bağlandığında proje takvimi otomatik uyarı üretecek.
            </p>
            <span className="mt-2 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Planlı
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}