import type { ReactNode } from 'react';
import { Skeleton } from './States';

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  loading?: boolean;
}

export function StatCard({ label, value, unit, hint, loading }: StatCardProps) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-6 w-20" />
      ) : (
        <p className="num mt-1 text-xl font-bold text-slate-900">
          {value}
          {unit && <span className="mr-1 text-xs font-normal text-slate-400">{unit}</span>}
        </p>
      )}
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
