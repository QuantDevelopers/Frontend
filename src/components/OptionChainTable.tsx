import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import type { DailyHistoryItem, Moneyness, OptionChainRow, OptionResponse } from '../types/api';
import { formatCount, formatPrice } from '../utils/formatters';
import { routes } from '../utils/routes';
import { MoneynessBadge } from './Badges';
import { Skeleton } from './ui/States';

interface OptionChainTableProps {
  rows: OptionChainRow[];
  spot?: number;
  quotes?: Map<string, DailyHistoryItem | undefined>;
  quotesLoading: boolean;
}

const ITM_BG: Record<'CALL' | 'PUT', string> = {
  CALL: 'bg-emerald-50/70',
  PUT: 'bg-rose-50/70',
};

function SideCells({
  contract,
  moneyness,
  quote,
  loading,
  side,
}: {
  contract?: OptionResponse;
  moneyness?: Moneyness;
  quote?: DailyHistoryItem;
  loading: boolean;
  side: 'CALL' | 'PUT';
}) {
  const bg = moneyness === 'ITM' ? ITM_BG[side] : '';
  if (!contract) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <td key={i} className={`text-center text-slate-300 ${bg}`}>—</td>
        ))}
      </>
    );
  }
  const symbolCell = (
    <td className={bg}>
      <Link to={routes.option(contract.symbol_fa)} className={`font-bold hover:underline ${side === 'CALL' ? 'text-emerald-700' : 'text-rose-700'}`}>
        {contract.symbol_fa}
      </Link>
    </td>
  );
  const value = (v: string) => (loading && !quote ? <Skeleton className="h-3.5 w-12" /> : v);
  const cells = [
    <td key="last" className={`num font-semibold text-slate-900 ${bg}`}>{value(formatPrice(quote?.close_price))}</td>,
    <td key="vol" className={`num text-slate-600 ${bg}`}>{value(quote ? formatCount(quote.volume) : '—')}</td>,
    <td key="oi" className={`num text-slate-600 ${bg}`}>{value(quote?.open_interest !== undefined ? formatCount(quote.open_interest) : '—')}</td>,
    <td key="m" className={`text-center ${bg}`}><MoneynessBadge value={moneyness} /></td>,
  ];
  // Calls read symbol → … → strike; puts mirror it so both sides meet at the strike column.
  return side === 'CALL' ? (
    <>
      {symbolCell}
      {cells}
    </>
  ) : (
    <>
      {[...cells].reverse()}
      {symbolCell}
    </>
  );
}

/** Classic two-sided option chain: Calls | Strike | Puts, with a spot-price marker row. */
export function OptionChainTable({ rows, spot, quotes, quotesLoading }: OptionChainTableProps) {
  const spotIndex = spot !== undefined ? rows.findIndex((r) => r.strike_price >= spot) : -1;

  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="table-base">
        <thead>
          <tr>
            <th colSpan={5} className="!bg-emerald-50 text-center !text-emerald-700">اختیار خرید (Call)</th>
            <th className="!bg-slate-100 text-center !text-slate-700">قیمت اعمال</th>
            <th colSpan={5} className="!bg-rose-50 text-center !text-rose-700">اختیار فروش (Put)</th>
          </tr>
          <tr>
            <th>نماد</th>
            <th>آخرین</th>
            <th>حجم</th>
            <th>موقعیت باز</th>
            <th className="text-center">وضعیت</th>
            <th className="text-center">ریال</th>
            <th className="text-center">وضعیت</th>
            <th>موقعیت باز</th>
            <th>حجم</th>
            <th>آخرین</th>
            <th>نماد</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const atm = r.call_moneyness === 'ATM' || r.put_moneyness === 'ATM';
            return (
              <Fragment key={`${r.expiration_date}-${r.strike_price}`}>
                {i === spotIndex && (
                  <tr className="!bg-transparent hover:!bg-transparent">
                    <td colSpan={11} className="!border-0 !p-0">
                      <div className="num border-y border-indigo-300 bg-indigo-50 py-0.5 text-center text-[11px] text-indigo-700">
                        قیمت پایه {formatPrice(spot)}
                      </div>
                    </td>
                  </tr>
                )}
                <tr>
                  <SideCells
                    side="CALL"
                    contract={r.call}
                    moneyness={r.call_moneyness}
                    quote={r.call ? quotes?.get(r.call.symbol_fa) : undefined}
                    loading={quotesLoading}
                  />
                  <td
                    className={`num text-center text-sm font-bold ${
                      atm ? 'bg-amber-100 text-amber-900' : 'bg-slate-50 text-slate-900'
                    }`}
                  >
                    {formatPrice(r.strike_price)}
                  </td>
                  <SideCells
                    side="PUT"
                    contract={r.put}
                    moneyness={r.put_moneyness}
                    quote={r.put ? quotes?.get(r.put.symbol_fa) : undefined}
                    loading={quotesLoading}
                  />
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
