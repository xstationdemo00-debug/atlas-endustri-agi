import { cn } from '@/lib/utils';

const STATUS_MAP = {
  draft: { label: 'Taslak', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  open: { label: 'Açık', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  matching: { label: 'Ekip oluşuyor', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  staffed: { label: 'Kadro tam', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  in_progress: { label: 'Sahada', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  completed: { label: 'Tamamlandı', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  cancelled: { label: 'İptal', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  submitted: { label: 'Gönderildi', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  shortlisted: { label: 'Kısa listede', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Kabul edildi', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  withdrawn: { label: 'Geri çekildi', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  pending: { label: 'Beklemede', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { label: 'İncelemede', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  verified: { label: 'Doğrulandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  forming: { label: 'Kuruluyor', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready: { label: 'Hazır', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  deployed: { label: 'Sahada', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export default function StatusBadge({ status, label, className }) {
  const item = STATUS_MAP[status] || {
    label: status || '—',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        item.className,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label || item.label}
    </span>
  );
}