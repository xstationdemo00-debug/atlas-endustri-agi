import { useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import { ITEM_STATUS_META, meta } from '@/lib/tenderAnalysis';

export default function WorkItemRow({ item, onPatch, packageNames = [] }) {
  const [saving, setSaving] = useState(false);
  const status = meta(ITEM_STATUS_META, item.review_status);

  const change = async (patch) => {
    setSaving(true);
    try {
      await onPatch(item, patch);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className={'border-t border-border align-top ' + (item.review_status === 'excluded' ? 'opacity-55' : '')}>
      <td className="whitespace-nowrap px-3 py-2 text-xs font-semibold text-muted-foreground">{item.position_no || '—'}</td>
      <td className="px-3 py-2">
        <p className="text-sm font-medium text-foreground">{item.description}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {[item.code ? `Kod: ${item.code}` : '', item.category].filter(Boolean).join(' · ') || '—'}
        </p>
      </td>
      <td className="px-2 py-2">
        <input
          defaultValue={item.unit || ''}
          aria-label="Birim"
          onBlur={(e) => {
            const next = e.target.value.trim().slice(0, 12);
            if (next !== (item.unit || '')) change({ unit: next });
          }}
          className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
        />
      </td>
      <td className="px-2 py-2">
        <input
          defaultValue={item.quantity || ''}
          type="number"
          step="any"
          aria-label="Miktar"
          onBlur={(e) => {
            const next = Number(e.target.value || 0);
            if (next !== Number(item.quantity || 0)) change({ quantity: next });
          }}
          className="w-24 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
        />
      </td>
      <td className="max-w-52 px-3 py-2 text-xs text-muted-foreground">
        {packageNames.length ? packageNames.join(' · ') : <span className="font-semibold text-rose-700">Atanmamış</span>}
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
          {status.label}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-end gap-1">
          {item.review_status !== 'confirmed' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => change({ review_status: 'confirmed' })}
              title="Kalemi doğrula"
              className="rounded-md border border-emerald-200 p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
            >
              <Check size={13} />
            </button>
          )}
          {item.review_status !== 'excluded' ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => change({ review_status: 'excluded' })}
              title="Hariç tut"
              className="rounded-md border border-rose-200 p-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-40"
            >
              <X size={13} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => change({ review_status: 'pending' })}
              title="Geri al"
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}