import type { HealthState } from '../hooks/useHealthCheck';

const CONFIG: Record<HealthState, { label: string; dot: string }> = {
  checking: { label: 'در حال بررسی', dot: 'bg-slate-400' },
  online: { label: 'متصل', dot: 'bg-emerald-400' },
  degraded: { label: 'دیتابیس قطع', dot: 'bg-amber-400' },
  offline: { label: 'قطع', dot: 'bg-rose-400' },
};

/** Backend status from GET /health; click to re-check. */
export function HealthBadge({ state, onClick }: { state: HealthState; onClick?: () => void }) {
  const c = CONFIG[state];
  return (
    <button
      type="button"
      onClick={onClick}
      title="وضعیت سرور"
      className="inline-flex shrink-0 items-center gap-1.5 text-xs text-slate-300 hover:text-white"
    >
      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
      <span className="hidden sm:inline">{c.label}</span>
    </button>
  );
}
