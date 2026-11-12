import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import ProjectCard from '@/components/ProjectCard';
import NewProjectDialog from '@/components/NewProjectDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMyCompany } from '@/lib/tenant';
import { HardHat } from 'lucide-react';

export default function Projects() {
  const { user } = useAuth() || {};
  const [projects, setProjects] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const load = async () => {
    setLoading(true);
    const [page, myCompany] = await Promise.all([
      base44.entities.Project.filter({}, { sort: '-created_date', limit: 100 }),
      getMyCompany(user),
    ]);
    setProjects(page.items || []);
    setCompany(myCompany);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchesStatus = status === 'all' || project.status === status;
      const text = `${project.title} ${project.company_name} ${project.city} ${project.trade}`.toLowerCase();
      return matchesStatus && text.includes(query.toLowerCase());
    });
  }, [projects, query, status]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <PageHeader
        title="Projeler"
        description="Sahadaki projeler, kadro durumu ve eşleşme ihtiyaçları."
      >
        <NewProjectDialog user={user} company={company} onCreated={load} />
      </PageHeader>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Proje, firma veya şehir ara" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm durumlar</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="open">Açık</SelectItem>
            <SelectItem value="matching">Ekip oluşuyor</SelectItem>
            <SelectItem value="staffed">Kadro tam</SelectItem>
            <SelectItem value="in_progress">Sahada</SelectItem>
            <SelectItem value="completed">Tamamlandı</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Projeler yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HardHat}
          title="Henüz proje yok"
          description="İlk proje talebini oluşturarak iş gücü ağını devreye al."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}