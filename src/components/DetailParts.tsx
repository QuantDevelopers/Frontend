import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** Small labelled value used in instrument header KPI strips. */
export function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="num mt-1 truncate text-sm font-bold text-slate-800">{value}</p>
      {sub && <p className="num mt-0.5 truncate text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600">
      <ArrowRight size={14} />
      {label}
    </Link>
  );
}
