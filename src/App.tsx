import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { InstrumentsPage } from './pages/InstrumentsPage';
import { InstrumentDetailPage } from './pages/InstrumentDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { useHealthCheck } from './hooks/useHealthCheck';

export default function App() {
  const { isOnline, checking } = useHealthCheck();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Layout isOnline={isOnline} checking={checking} />
          }
        >
          <Route
            index
            element={<InstrumentsPage isOnline={isOnline} />}
          />
          <Route
            path="/instruments"
            element={<InstrumentsPage isOnline={isOnline} />}
          />
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
          <Route
            path="/data-quality"
            element={<DataQualityPage />}
          />
          <Route
            path="/instruments/:insCode"
            element={<InstrumentDetailPage />}
          />
          {/* Fallback route */}
          <Route
            path="*"
            element={<InstrumentsPage isOnline={isOnline} />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
