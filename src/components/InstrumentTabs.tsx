import type { ReactNode } from 'react';

interface TabDef<T extends string> {
  value: T;
  label: string;
}

interface InstrumentTabsProps<T extends string> {
  tabs: TabDef<T>[];
  value: T;
  onChange: (t: T) => void;
  children: ReactNode;
}

/** Underlined tab strip used by the instrument detail pages. */
export function InstrumentTabs<T extends string>({ tabs, value, onChange, children }: InstrumentTabsProps<T>) {
  return (
    <section className="card">
      <div role="tablist" className="scroll-thin flex gap-4 overflow-x-auto border-b border-slate-200 px-4">
        {tabs.map((t) => {
          const active = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(t.value)}
              className={`-mb-px shrink-0 border-b-2 py-3 text-[13px] ${
                active ? 'border-indigo-600 font-medium text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{children}</div>
    </section>
  );
}
