/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AppLayout from './layouts/AppLayout';
import ChatPage from './pages/ChatPage';
import LedgerPage from './pages/LedgerPage';
import DebtorsPage from './pages/DebtorsPage';
import TaxCalendarPage from './pages/TaxCalendarPage';
import InventoryPage from './pages/InventoryPage';
import DocumentsPage from './pages/DocumentsPage';
import ForecastPage from './pages/ForecastPage';
import InvoicesPage from './pages/InvoicesPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/chat" replace />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="debtors" element={<DebtorsPage />} />
          <Route path="tax-calendar" element={<TaxCalendarPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="forecast" element={<ForecastPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}
