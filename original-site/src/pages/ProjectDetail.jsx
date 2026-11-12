import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, MapPin, CalendarDays, BedDouble, Truck, ShieldCheck, Users, Wallet,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import OfferList from '@/components/OfferList';
import WorkRequestDialog from '@/components/WorkRequestDialog';
import { formatDate, formatMoney } from '@/lib/format';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth() || {};
  const [project, setProject] = useState(null);
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [projectRecord, requestPage, offerPage, teamPage] = await Promise.all([
      base44.entities.Project.get(id).catch(() => null),
      base44.entities.WorkRequest.filter({ project_id: id }),
      base44.entities.Offer.filter({ project_id: id }),
      base44.entities.Team.filter({ project_id: id }),
    ]);
    setProject(projectRecord);
    setRequests(requestPage || []);
    setOffers(offerPage || []);
    setTeams(teamPage || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [id, user?.id]);

  const updateStatus = async (status) => {
    await base44.entities.Project.update(id, { status });
    await load();
  };

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Proje yükleniyor...</p>;
  if (!project) {
    return <EmptyState icon={Building2} title="Proje bulunamadı" description="Bu proje kaldırılmış veya erişiminiz yok." action={<Link to="/projeler" className="text-sm font-semibold text-accent">Projelere dön</Link>} />;
  }

  const isOwner = project.created_by_id === user?.id;
  const needs = project.headcount_needed || 0;
  const filled = project.headcount_filled || 0;
  const percent = needs ? Math.min(100, Math.round((filled / needs) * 100)) : 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <Link to="/projeler" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={15} /> Projelere dön
      </Link>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-lg font-extrabold text-foreground sm:text-xl">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Building2 size={13} /> {project.company_name || '—'}</span>
              <span className="inline-flex items-center gap-1"><MapPin size={13} /> {project.city || '—'}, {project.country}</span>
              <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {formatDate(project.start_date)} – {formatDate(project.end_date)}</span>
              <span className="inline-flex items-center gap-1"><Wallet size={13} /> {formatMoney(project.budget_amount, project.currency)}</span>
            </div>
          </div>
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              {project.status === 'draft' && user?.role === 'admin' && (
                <button onClick={() => updateStatus('open')} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                  Yayınla
                </button>
              )}
              {project.status === 'draft' && user?.role !== 'admin' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">Yayına alma için firma ve proje doğrulaması gerekiyor.</p>}
              {project.status !== 'draft' && <WorkRequestDialog project={project} onCreated={load} />}
            </div>
          )}
        </div>

        {(project.work_package_type || project.technical_scope || project.quantity || project.technical_standards || project.delivery_terms) && (
          <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
            <div><strong>İş paketi:</strong> {({industrial_fabrication:'Fason / kaynaklı imalat',material_supply:'Endüstriyel malzeme',mechanical_installation:'Mekanik montaj ve borulama',turnkey_project:'Anahtar teslim taahhüt',maintenance_shutdown:'Bakım / duruş',industrial_logistics:'Sanayi lojistiği',other:'Diğer'})[project.work_package_type]||'Belirtilmedi'}</div>
            {project.quantity&&<div><strong>Miktar / ölçü:</strong> {project.quantity}</div>}
            {project.technical_scope&&<div className="sm:col-span-2"><strong>Teknik kapsam:</strong> {project.technical_scope}</div>}
            {project.technical_standards&&<div className="sm:col-span-2"><strong>Standart ve belgeler:</strong> {project.technical_standards}</div>}
            {project.delivery_terms&&<div className="sm:col-span-2"><strong>Teslim koşulları:</strong> {project.delivery_terms}</div>}
          </div>
        )}
        {project.description && (
          <p className="mt-4 text-sm leading-relaxed text-foreground/80">{project.description}</p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Kadro</p>
            <p className="mt-1 text-sm font-bold text-foreground">{filled} / {needs}</p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Truck size={11} /> Ulaşım</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{project.transport ? 'Sağlanıyor' : 'Yok'}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"><BedDouble size={11} /> Konaklama</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{project.accommodation ? 'Sağlanıyor' : 'Yok'}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1"><ShieldCheck size={11} /> İSG</p>
            <p className="mt-1 text-xs font-medium text-foreground/80">{project.isg_requirements || 'Belirtilmedi'}</p>
          </div>
        </div>

        {project.certifications_required?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.certifications_required.map((cert) => (
              <span key={cert} className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">{cert}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-heading text-sm font-bold text-foreground">İş talepleri</h3>
          {requests.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Bu proje için iş talebi açılmamış.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{request.trade}</p>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.filled_count || 0}/{request.headcount} kişi · {formatMoney(request.daily_rate, request.currency)}/gün · {request.city}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-foreground">Teklifler</h3>
            <span className="text-xs text-muted-foreground">{offers.length} teklif</span>
          </div>
          <OfferList offers={offers} canDecide={isOwner && project.status !== 'draft'} onDecided={load} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="flex items-center gap-1.5 font-heading text-sm font-bold text-foreground">
          <Users size={15} /> Oluşan ekipler
        </h3>
        {teams.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Kadro tamamlandığında ekip otomatik oluşturulur.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {teams.map((team) => (
              <div key={team.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{team.name}</p>
                  <StatusBadge status={team.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {team.size}/{team.required_size} kişi · Lider: {team.leader_name || team.leader_email || '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}