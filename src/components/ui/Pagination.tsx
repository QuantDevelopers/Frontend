import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../../types/api';
import { formatCount, toPersianDigits } from '../../utils/formatters';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.totalItems === 0) return null;
  const from = (meta.currentPage - 1) * meta.pageSize + 1;
  const to = Math.min(meta.currentPage * meta.pageSize, meta.totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
      <span className="num">
        نمایش {formatCount(from)} تا {formatCount(to)} از {formatCount(meta.totalItems)} مورد
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn-secondary px-2"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(meta.currentPage - 1)}
          aria-label="صفحه قبل"
        >
          <ChevronRight size={14} />
        </button>
        <span className="num min-w-[72px] text-center font-medium text-slate-700">
          صفحه {toPersianDigits(meta.currentPage)} از {toPersianDigits(Math.max(meta.totalPages, 1))}
        </span>
        <button
          type="button"
          className="btn-secondary px-2"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.currentPage + 1)}
          aria-label="صفحه بعد"
        >
          <ChevronLeft size={14} />
        </button>
      </div>
    </div>
  );
}
