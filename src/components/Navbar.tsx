import { Link, NavLink } from 'react-router-dom';
import type { HealthState } from '../hooks/useHealthCheck';
import { routes } from '../utils/routes';
import { GlobalSearch } from './GlobalSearch';
import { HealthBadge } from './HealthBadge';

const NAV_ITEMS = [
  { to: routes.dashboard, label: 'داشبورد', end: true },
  { to: routes.instruments, label: 'ابزارها', end: false },
  { to: routes.charts, label: 'نمودار', end: false },
  { to: routes.optionChain(), label: 'زنجیره اختیار', end: false },
  { to: routes.dataQuality, label: 'کیفیت داده', end: false },
];

interface NavbarProps {
  health: HealthState;
  onRecheck: () => void;
}

export function Navbar({ health, onRecheck }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link to={routes.dashboard} className="shrink-0 text-sm font-bold">
          بازار اختیار معامله
        </Link>

        <nav className="hidden h-full items-stretch gap-1 lg:flex">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center border-b-2 px-2.5 text-[13px] ${
                  isActive ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          <GlobalSearch />
          <HealthBadge state={health} onClick={onRecheck} />
        </div>
      </div>

      <nav className="scroll-thin flex gap-4 overflow-x-auto border-t border-slate-800 px-4 py-2 lg:hidden">
        {NAV_ITEMS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `shrink-0 text-xs ${isActive ? 'text-white' : 'text-slate-400'}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
