import { Link } from 'react-router-dom';
import { Wifi, WifiOff } from 'lucide-react';

interface NavbarProps {
  isOnline: boolean;
  checking: boolean;
}

export function Navbar({ isOnline, checking }: NavbarProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-12">
          {/* App Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-white text-xs sm:text-sm tracking-tight">
                سامانه پایش بازار اختیار معامله بورس تهران
              </span>
            </Link>
          </div>

          {/* Connection Status Badge (Pure Live Backend) */}
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] border ${
                checking
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : isOnline
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
              }`}
            >
              {checking ? (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
              ) : isOnline ? (
                <Wifi size={12} className="text-emerald-400" />
              ) : (
                <WifiOff size={12} className="text-rose-400" />
              )}
              <span className="font-medium">
                {checking
                  ? 'در حال بررسی اتصال...'
                  : isOnline
                    ? 'سرور متصل (FastAPI)'
                    : 'عدم اتصال سرور (۸۰۰۰)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
