import type { ReactNode } from 'react';
import type { ContractType, Moneyness } from '../types/api';
import type { OptionResponse } from '../types/api';
import { CONTRACT_TYPE_LABEL, MONEYNESS_LABEL, STATUS_LABEL, contractStatus, marketLabel } from '../utils/market';
import { CopyButton } from './CopyButton';

type Tone = 'slate' | 'indigo' | 'sky' | 'emerald' | 'rose' | 'amber' | 'violet';

const TONE_CLASS: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export function Badge({ tone = 'slate', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

export function MarketBadge({ marketType }: { marketType: string }) {
  const label = marketLabel(marketType);
  return <Badge tone={label === 'فرابورس' ? 'violet' : 'sky'}>{label}</Badge>;
}

export function ContractTypeBadge({ type, short }: { type: ContractType; short?: boolean }) {
  return (
    <Badge tone={type === 'CALL' ? 'emerald' : 'rose'}>
      {short ? (type === 'CALL' ? 'خرید' : 'فروش') : CONTRACT_TYPE_LABEL[type]}
    </Badge>
  );
}

const MONEYNESS_TONE: Record<Moneyness, Tone> = { ITM: 'emerald', ATM: 'amber', OTM: 'slate' };

export function MoneynessBadge({ value }: { value?: Moneyness | null }) {
  if (!value) return <span className="text-slate-300">—</span>;
  return (
    <Badge tone={MONEYNESS_TONE[value]} title={MONEYNESS_LABEL[value]}>
      {value}
    </Badge>
  );
}

export function StatusBadge({ contract }: { contract: OptionResponse }) {
  const key = contractStatus(contract);
  return <Badge tone={key === 'ACTIVE' ? 'emerald' : key === 'EXPIRED' ? 'slate' : 'rose'}>{STATUS_LABEL[key] ?? key}</Badge>;
}

/** insCode / ISIN chip in monospace LTR with copy-to-clipboard. Rule 7.1: insCode is the primary key. */
export function CodeChip({ value, placeholder = 'ثبت نشده' }: { value?: string | null; placeholder?: string }) {
  if (!value) return <span className="text-xs text-amber-600">{placeholder}</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-0.5 ring-1 ring-inset ring-slate-200">
      <span className="ltr select-all font-mono text-[11px] tracking-wide text-slate-700">{value}</span>
      <CopyButton text={value} />
    </span>
  );
}
