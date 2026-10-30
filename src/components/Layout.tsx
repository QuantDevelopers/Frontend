import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

interface LayoutProps {
  isOnline: boolean;
  checking: boolean;
}

export function Layout({ isOnline, checking }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased">
      <Navbar isOnline={isOnline} checking={checking} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-3.5">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto text-xs text-slate-400 py-2.5 text-center">
        سامانه پایش بازار اختیار معامله بورس تهران
      </footer>
    </div>
  );
}
