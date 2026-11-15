import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, BadgeCheck, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CompanyVerificationCard from '@/components/company/CompanyVerificationCard';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import CompanyDialog from '@/components/CompanyDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { COMPANY_TYPES } from '@/lib/format';
import { getMyCompany } from '@/lib/tenant';
import { normalizeMembershipRows,canManageCompany } from '@/lib/neonCompanyMembers';

export default function Companies() {
  const { user } = useAuth() || {};
  const [companies, setCompanies] = useState([]);
  const [myCompany, setMyCompany] = useState(null);
  const [members, setMembers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteNotice, setInviteNotice] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [accepting, setAccepting] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [all, mine, ownInvitations] = await Promise.all([
        base44.entities.Company.list(), getMyCompany(user),
        base44.functions.invoke('myCompanyInvitations', {}),
      ]);
      setInvitations(normalizeMembershipRows(ownInvitations).filter(x => x.status === 'invited'));
      setCompanies(mine && !all.some(x => x.id === mine.id) ? [mine,...all] : all);
      setMyCompany(mine);
      if (mine && canManageCompany(mine,user) && mine.verification_status === 'verified') {
        const [list, docs] = await Promise.all([
          base44.entities.CompanyMember.filter({ company_id: mine.id }),
          base44.entities.CompanyDocument.filter({ company_id: mine.id }, { limit: 100 }),
        ]);
        setMembers(list);
        setDocuments(docs.items || []);
      } else {
        setMembers([]); setDocuments([]);
      }
    } catch(err) { setInviteError(err.message || 'Firma kayıtları yüklenemedi.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const invite = async (event) => {
    event.preventDefault();
    if (!inviteEmail || !myCompany || inviting) return;
    if (!canManageCompany(myCompany,user) || myCompany.verification_status !== 'verified') {
      setInviteError('Üye daveti için doğrulanmış firma sahibi olmanız gerekiyor.'); return;
    }
    setInviting(true);
    setInviteError('');setInviteNotice('');
    try {
      const res = await base44.functions.invoke('inviteCompanyMember', {
        company_id: myCompany.id,
        email: inviteEmail,
      });
      if (res?.data?.ok !== true) throw new Error(res?.data?.error || 'Davet doğrulanamadı.');
      setInviteEmail('');
      setInviteNotice(res.data.message || 'Davet kaydedildi; e-posta gönderilmedi.');
      await load();
    } catch (error) {
      setInviteError(error?.message || 'Güvenli davet işlemi tamamlanamadı.');
    } finally {
      setInviting(false);
    }
  };

  const acceptInvitation = async (id) => {
    setAccepting(id); setInviteError('');setInviteNotice('');
    try {
      const reply=await base44.functions.invoke('acceptCompanyInvitation',{invitation_id:id});
      if(reply?.data?.ok!==true)throw new Error('Davet doğrulanamadı.');
      setInviteNotice('Firma üyeliğiniz etkinleştirildi.');
      await load();
    } catch(err) { setInviteError(err?.message || 'Davet kabul edilemedi.'); }
    finally { setAccepting(null); }
  };

  const typeLabel = (value) => COMPANY_TYPES.find((item) => item.value === value)?.label || 'Firma';

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <PageHeader
        title="Firmalar"
        description="Ağdaki ana yükleniciler, alt yükleniciler ve tedarikçiler; kendi firma profiliniz ve ekibiniz."
      >
        {(!myCompany || canManageCompany(myCompany,user)) && <CompanyDialog user={user} company={myCompany} onSaved={load} />}
      </PageHeader>

      {!myCompany && !loading && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
          <p className="max-w-xl text-sm text-foreground/80">
            Henüz bir firma profiliniz yok. Firma kaydını tamamladığınızda proje açabilir, iş talebi yayınlayabilir
            ve teklifleri firmanız adına yönetebilirsiniz.
          </p>
          <Link to="/firma-kayit" className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90">
            Firma kaydını başlat
          </Link>
        </div>
      )}

      {invitations.length>0 && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-2" aria-label="Bekleyen firma davetleri">
          <h2 className="text-sm font-bold text-sky-950">Bekleyen firma üyeliği</h2>
          {invitations.map(item => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-sky-900">
              <span>{item.company_name} · {item.role==='manager'?'Yönetici yardımcısı':'Üye'}</span>
              <Button type="button" size="sm" disabled={accepting===item.id} onClick={()=>acceptInvitation(item.id)}>
                {accepting===item.id?'Doğrulanıyor...':'Daveti kabul et'}
              </Button>
            </div>
          ))}
        </section>
      )}
      {myCompany && (
        <section className="space-y-3">
          {canManageCompany(myCompany,user) && <CompanyVerificationCard company={myCompany} documents={documents} />}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-lg font-extrabold text-foreground">{myCompany.name}</h2>
                  <StatusBadge status={myCompany.verification_status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {typeLabel(myCompany.type)} · {myCompany.city || '—'} · {myCompany.employee_count || 0} çalışan
                </p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {canManageCompany(myCompany,user) ? 'Firma sahibi' : 'Firma üyesi'}: {user?.email}
              </span>
            </div>
            {myCompany.trades?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {myCompany.trades.map((trade) => (
                  <span key={trade} className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/70">{trade}</span>
                ))}
              </div>
            )}
            {canManageCompany(myCompany,user) && myCompany.verification_status==='verified' && <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Firma ekibi</p>
              <div className="mt-2 space-y-1.5">
                {members.length === 0 && <p className="text-xs text-muted-foreground">Henüz ekip üyesi eklenmedi.</p>}
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-xs">
                    <span className="text-foreground/80">{member.email}</span>
                    <StatusBadge status={member.status === 'active' ? 'verified' : 'pending'}
                      label={member.status === 'active' ? 'Aktif' : 'Davetli'} />
                  </div>
                ))}
              </div>
              <form onSubmit={invite} className="mt-2 flex gap-2">
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="ekip@firma.com" type="email" className="h-9" />
                <Button type="submit" size="sm" variant="outline" disabled={inviting}>
                  <UserPlus size={14} className="mr-1.5" /> {inviting ? 'Kontrol ediliyor' : 'Davet et'}
                </Button>
              </form>
              {inviteNotice && <p role="status" className="mt-2 text-xs text-emerald-700">{inviteNotice}</p>}
            </div>}
          </div>
        </section>
      )}

      <div>
        <h3 className="mb-2 font-heading text-sm font-bold text-foreground">Ağdaki firmalar</h3>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Firmalar yükleniyor...</p>
        ) : companies.length === 0 ? (
          <EmptyState icon={Building2} title="Kayıtlı firma yok" description="İlk firma profilini oluşturarak ağı başlat." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {companies.map((company) => (
              <div key={company.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-bold text-foreground">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{typeLabel(company.type)}</p>
                  </div>
                  {company.verification_status === 'verified' ? (
                    <BadgeCheck size={17} className="text-emerald-500" />
                  ) : (
                    <StatusBadge status={company.verification_status} />
                  )}
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} /> {company.city || '—'}
                </p>
                {company.about && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{company.about}</p>}
                {company.trades?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {company.trades.slice(0, 3).map((trade) => (
                      <span key={trade} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">{trade}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}