import { useEffect, useMemo, useState } from 'react';
import { Search, Users, BadgeCheck, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import WorkerProfileDialog from '@/components/WorkerProfileDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMoney, TRADES } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function TeamPool() {
  const { user } = useAuth() || {};
  const [profiles, setProfiles] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('workers');
  const [query, setQuery] = useState('');
  const [trade, setTrade] = useState('all');

  const load = async () => {
    const [workerPage, teamPage] = await Promise.all([
      base44.entities.WorkerProfile.filter({}, { sort: '-created_date', limit: 100 }),
      base44.entities.Team.filter({}, { sort: '-created_date', limit: 100 }),
    ]);
    setProfiles(workerPage.items || []);
    setTeams(teamPage.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const myProfile = profiles.find((profile) => profile.user_email === user?.email);

  const filtered = useMemo(
    () =>
      profiles.filter((profile) => {
        const matchesTrade = trade === 'all' || profile.trade === trade;
        const text = `${profile.full_name} ${profile.trade} ${profile.city}`.toLowerCase();
        return matchesTrade && text.includes(query.toLowerCase());
      }),
    [profiles, trade, query]
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <PageHeader
        title="Ekip havuzu"
        description="Doğrulanmış ustalar, ekip liderleri ve sahaya hazır ekipler."
      >
        <WorkerProfileDialog user={user} profile={myProfile} onSaved={load} />
      </PageHeader>

      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {[
          { key: 'workers', label: `Ustalar (${profiles.length})` },
          { key: 'teams', label: `Ekipler (${teams.length})` },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition',
              tab === item.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'workers' ? (
        <>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Usta, meslek veya şehir ara" className="pl-9" />
            </div>
            <Select value={trade} onValueChange={setTrade}>
              <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm meslekler</SelectItem>
                {TRADES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Havuz yükleniyor...</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="Havuzda usta yok" description="Profil oluşturarak havuza katılabilirsin." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((profile) => (
                <div key={profile.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-heading text-sm font-bold text-foreground">{profile.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{profile.trade}</p>
                    </div>
                    {profile.verified && <BadgeCheck size={16} className="text-emerald-500" />}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin size={12} /> {profile.city || '—'}</span>
                    <span>{profile.experience_years || 0} yıl deneyim</span>
                    {profile.is_team_leader && <span className="rounded bg-accent/10 px-1.5 py-0.5 font-semibold text-accent">Ekip lideri · {profile.team_size}</span>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{formatMoney(profile.daily_rate, profile.currency)}<span className="text-xs font-normal text-muted-foreground">/gün</span></span>
                    <StatusBadge status={profile.availability === 'available' ? 'open' : 'pending'} label={profile.availability === 'available' ? 'Müsait' : 'Meşgul'} />
                  </div>
                  {profile.phone && <p className="mt-2 text-xs text-muted-foreground">{profile.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState icon={Users} title="Henüz ekip yok" description="Bir iş talebine yeterli teklif kabul edildiğinde ekip otomatik oluşur." />
            </div>
          ) : (
            teams.map((team) => {
              const percent = team.required_size ? Math.min(100, Math.round((team.size / team.required_size) * 100)) : 0;
              return (
                <div key={team.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-heading text-sm font-bold text-foreground">{team.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{team.project_title || 'Proje'} · {team.city || '—'}</p>
                    </div>
                    <StatusBadge status={team.status} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Lider: {team.leader_name || team.leader_email || '—'}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{team.size} / {team.required_size} kişi</span>
                    <span className="font-semibold text-foreground/80">{percent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}