import { Link } from 'react-router-dom';
import { VERIFICATION_COPY, verificationProgress } from '@/lib/companyVerification';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

const ICONS = {
  pending: Clock,
  in_review: Clock,
  verified: CheckCircle2,
  rejected: XCircle,
};

export default function CompanyVerificationCard({ company, documents = [] }) {
  const status = company?.verification_status || 'pending';
  const copy = VERIFICATION_COPY[status] || VERIFICATION_COPY.pending;
  const progress = verificationProgress(company, documents);
  const Icon = ICONS[status] || Clock;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Icon size={18} className={status === 'verified' ? 'mt-0.5 text-emerald-600' : 'mt-0.5 text-accent'} />
          <div>
            <h2 className="font-heading text-sm font-extrabold text-foreground">{copy.title}</h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">{copy.body}</p>
            {status === 'rejected' && company?.verification_note && (
              <p className="mt-1.5 text-xs font-medium text-destructive">{company.verification_note}</p>
            )}
          </div>
        </div>
        <Link
          to="/firma-kayit"
          className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
        >
          {status === 'rejected' ? 'Belgeleri düzelt' : status === 'verified' ? 'Firma bilgilerini güncelle' : 'Başvuruyu tamamla'}
        </Link>
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Doğrulama adımları · {progress.doneCount}/{progress.total}
        </p>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {progress.steps.map((step) => (
            <div key={step.key} className="flex items-center gap-1.5 text-xs">
              {step.done ? (
                <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle size={13} className="shrink-0 text-amber-600" />
              )}
              <span className={step.done ? 'text-muted-foreground line-through' : 'font-medium text-foreground'}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}