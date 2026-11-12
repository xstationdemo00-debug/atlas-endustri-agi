import { useState } from 'react';
import { Building2, ClipboardCheck, Search, ShieldAlert, Target } from 'lucide-react';

const PRIORITY_REGIONS = ['Ankara', 'Kocaeli', 'İstanbul', 'Bursa'];
const MANUFACTURING_TAGS = new Set([
  'welding', 'fabrication', 'pipework', 'structural_steel',
  'stainless_process', 'machining', 'assembly',
]);

function candidateScore(row) {
  let points = 0;
  const city = String(row.city || '');
  if (PRIORITY_REGIONS.some((region) => city.includes(region))) points += 3;
  if (row.contact_email) points += 2;
  if (row.phone) points += 1;
  if (row.source_url) points += 1;
  points += Math.min(4, (row.capability_tags || []).filter((x) => MANUFACTURING_TAGS.has(x)).length);
  if (row.stage === 'draft_ready') points += 1;
  return points;
}

const STAGE_LABEL = {
  researched: 'Araştırıldı', draft_ready: 'Taslak hazır',
  contact_allowed: 'İletişim uygunluğu kontrol edildi',
  contacted: 'İletişime geçildi', replied: 'Yanıt var',
  qualified: 'İhtiyaç doğrulandı', proposal_sent: 'Teklif gönderildi',
  won: 'Anlaşma yapıldı', lost: 'Sonuçlanmadı', blocked: 'Engellendi',
};

export default function PilotReadinessPanel({ prospects = [], realRequests = 0 }) {
  const [region, setRegion] = useState('all');
  const all = prospects.filter((x) => !x.is_demo);
  const contacted = all.filter((x) => ['contacted','replied','qualified','proposal_sent','won','lost'].includes(x.stage)).length;
  const qualified = all.filter((x) => ['qualified','proposal_sent','won'].includes(x.stage) || x.verification_level === 'company_confirmed' || x.verification_level === 'platform_verified').length;
  const joined = all.filter((x) => x.onboarded === true).length;
  const candidates = all
    .filter((x) => !x.opt_out && x.source_url && ['researched','draft_ready','contact_allowed'].includes(x.stage))
    .filter((x) => region === 'all' || String(x.city || '').includes(region))
    .sort((a, b) => candidateScore(b) - candidateScore(a) || String(a.company_name).localeCompare(String(b.company_name),'tr'))
    .slice(0, 10);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <Target size={18} /> İlk 90 gün — ticari pilot takip panosu
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Araştırma kaydı, firma görüşmesi, gerçek katılım ve ticari işbirliği birbirinden ayrı sayılır.
            Sıralama sadece ön inceleme önerisidir; uygunluk veya kapasite doğrulaması değildir.
          </p>
        </div>
        <label className="text-[11px] font-semibold text-muted-foreground">
          Ön inceleme bölgesi
          <select value={region} onChange={(event) => setRegion(event.target.value)}
            className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground">
            <option value="all">Türkiye geneli</option>
            {PRIORITY_REGIONS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['Araştırılmış aday', all.length, 'Araştırma; müşteri değil'],
          ['Görüşmeye geçilmiş', contacted + '/20', 'İlk pilot görüşme hedefi'],
          ['Firma katılımı', joined, 'Onaylı onboarding kaydı'],
          ['Gerçek ticari talep', realRequests + '/5', 'Nitelik ayrıca doğrulanmalı'],
        ].map(([label, value, help]) => (
          <div key={label} className="rounded-lg border border-border bg-background p-3">
            <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-black tabular-nums text-foreground">{value}</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{help}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-foreground">
        <ClipboardCheck size={14} /> İhtiyacı veya firma yeterliliği doğrulanmış kayıt: <strong>{qualified}</strong>
      </p>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <Search size={15} />
        <h3 className="text-sm font-bold text-foreground">Ön inceleme kısa listesi ({candidates.length})</h3>
      </div>
      {candidates.length ? (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {candidates.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-background p-3">
              <p className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Building2 size={13} /> {p.company_name}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {p.city || 'Konum kaydı yok'} · {STAGE_LABEL[p.stage] || 'Araştırma'} · {p.verification_level === 'web_researched' ? 'Web araştırması' : 'Firma doğrulama kontrolü'}
              </p>
              {(p.capability_tags || []).length > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Şirket kaynaklarında belirtilen süreçler: {(p.capability_tags || []).slice(0,5).join(', ')}
                </p>
              )}
              {p.source_url && (
                <a href={p.source_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 inline-block text-[11px] font-bold text-amber-700 underline">
                  Kaynak kaydını incele
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
          Bu bölgede kriterlere uygun araştırma kaydı görünmüyor.
        </p>
      )}
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-amber-800">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        Otomatik ileti gönderilmez. İletişim izni ve ret tercihleri kontrol edilir; firmayla görüşülmeden
        kapasitesi, işbirliği niyeti veya ticari uygunluğu doğrulanmış kabul edilmez.
      </p>
    </section>
  );
}
