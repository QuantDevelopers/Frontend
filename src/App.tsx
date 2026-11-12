import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { InstrumentsPage } from './pages/InstrumentsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OptionChainPage } from './pages/OptionChainPage';
import { OptionDetailPage } from './pages/OptionDetailPage';
import { SearchPage } from './pages/SearchPage';
import { UnderlyingDetailPage } from './pages/UnderlyingDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="instruments" element={<InstrumentsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="underlyings/:symbol" element={<UnderlyingDetailPage />} />
          <Route path="options/:symbol" element={<OptionDetailPage />} />
          <Route path="option-chain" element={<OptionChainPage />} />
          <Route path="option-chain/:symbol" element={<OptionChainPage />} />
          <Route path="data-quality" element={<DataQualityPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
