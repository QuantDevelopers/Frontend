import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Navbar } from './Navbar';

export function Layout() {
  const { state, recheck } = useHealthCheck();
  const { pathname } = useLocation();

  useEffect(() => window.scrollTo({ top: 0 }), [pathname]);

  return (
    <div className="min-h-screen">
      <Navbar health={state} onRecheck={recheck} />
      <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
