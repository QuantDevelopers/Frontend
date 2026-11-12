import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useQuery } from '../hooks/useQuery';
import { api } from '../services/api';
import type { InstrumentSearchItem } from '../types/api';
import { formatPrice } from '../utils/formatters';
import { normalizePersianText } from '../utils/normalizePersian';
import { routes } from '../utils/routes';
import { ContractTypeBadge, MarketBadge } from './Badges';

export const instrumentPath = (item: InstrumentSearchItem) =>
  item.instrument_type === 'OPTION' ? routes.option(item.symbol_fa) : routes.underlying(item.symbol_fa);

/** Navbar search with live suggestions from GET /api/v1/instruments/search. */
export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const query = useDebounce(normalizePersianText(text.trim()), 250);

  const { data, loading } = useQuery(
    query ? `search:${query}:8` : null,
    () => api.search(query, 8),
    { ttl: 30_000 }
  );
  const items = data?.items ?? [];

  // "/" focuses the search from anywhere (except while typing in another field)
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setHighlight(-1);
  }, [query]);

  const go = (path: string) => {
    setOpen(false);
    setText('');
    inputRef.current?.blur();
    navigate(path);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      if (highlight >= 0 && items[highlight]) go(instrumentPath(items[highlight]));
      else if (text.trim()) go(routes.search(text.trim()));
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = open && text.trim().length > 0;

  return (
    <div className="relative w-full max-w-xs">
      <Search size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKeyDown}
        placeholder="جستجوی نماد…"
        aria-label="جستجوی ابزار"
        className="w-full rounded-md border border-slate-700 bg-slate-800 py-1.5 pl-8 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-slate-500 focus:outline-none"
      />
      {text && (
        <button
          type="button"
          onClick={() => setText('')}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-white"
          aria-label="پاک کردن"
        >
          <X size={14} />
        </button>
      )}

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-800 shadow-lg">
          {loading && items.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500">در حال جستجو…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-3 text-xs text-slate-500">نتیجه‌ای یافت نشد</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1 scroll-thin">
              {items.map((item, i) => (
                <li key={`${item.instrument_type}-${item.id}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => go(instrumentPath(item))}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-right ${
                      i === highlight ? 'bg-slate-100' : ''
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-slate-900">{item.symbol_fa}</span>
                      <span className="block truncate text-[11px] text-slate-500">{item.name_fa}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {item.instrument_type === 'OPTION' && item.contract_type ? (
                        <>
                          {item.strike_price !== undefined && (
                            <span className="num text-[11px] text-slate-500">{formatPrice(item.strike_price)}</span>
                          )}
                          <ContractTypeBadge type={item.contract_type} short />
                        </>
                      ) : (
                        <MarketBadge marketType={item.market_type || ''} />
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => go(routes.search(text.trim()))}
            className="block w-full border-t border-slate-100 px-4 py-2 text-right text-xs text-indigo-600 hover:bg-slate-50"
          >
            همه نتایج
          </button>
        </div>
      )}
    </div>
  );
}
