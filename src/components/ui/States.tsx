import type { ReactNode } from 'react';
import type { ApiError } from '../../services/http';

function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-400 border-t-transparent ${className}`}
      aria-hidden
    />
  );
}

export function Loading({ label = 'در حال بارگذاری…', className = 'py-12' }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-slate-500 ${className}`} role="status">
      <Spinner className="h-4 w-4" />
      {label}
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-slate-200 ${className}`} />;
}

interface ErrorStateProps {
  error: ApiError | Error | null;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export function ErrorState({ error, onRetry, title, className = 'py-12' }: ErrorStateProps) {
  const network = !!(error && 'isNetworkError' in error && error.isNetworkError);
  return (
    <div className={`px-4 text-center text-sm ${className}`}>
      <p className="font-medium text-rose-700">
        {title ?? (network ? 'سرور در دسترس نیست' : 'خطا در دریافت داده')}
      </p>
      {error?.message && <p className="mt-1 text-xs text-slate-500">{error.message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-3">
          تلاش مجدد
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, action, className = 'py-12' }: EmptyStateProps) {
  return (
    <div className={`px-4 text-center text-sm text-slate-500 ${className}`}>
      <p>{title}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
