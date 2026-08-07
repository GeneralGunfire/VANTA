/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import ScrollToTop from './components/ScrollToTop';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import AppLayout from './layouts/AppLayout';
import ChatPage from './pages/ChatPage';
import BriefPage from './pages/BriefPage';
import AskPage from './pages/AskPage';
import LedgerPage from './pages/LedgerPage';
import DebtorsPage from './pages/DebtorsPage';
import TaxCalendarPage from './pages/TaxCalendarPage';
import InventoryPage from './pages/InventoryPage';
import DocumentsPage from './pages/DocumentsPage';
import ForecastPage from './pages/ForecastPage';
import InvoicesPage from './pages/InvoicesPage';
import BusinessRecordPage from './pages/BusinessRecordPage';
import SuppliersPage from './pages/SuppliersPage';
import TimelinePage from './pages/TimelinePage';
import WhatIfPage from './pages/WhatIfPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import RecentlyDeletedPage from './pages/RecentlyDeletedPage';
import DataPrivacyPage from './pages/DataPrivacyPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    // Respects the OS-level "reduce motion" preference across every motion/react
    // animation in the app — a global switch rather than checking it per component.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/chat" replace />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="brief" element={<BriefPage />} />
            <Route path="ask" element={<AskPage />} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="debtors" element={<DebtorsPage />} />
            <Route path="tax-calendar" element={<TaxCalendarPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="business-record" element={<BusinessRecordPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="timeline" element={<TimelinePage />} />
            <Route path="what-if" element={<WhatIfPage />} />
            <Route path="business-profile" element={<BusinessProfilePage />} />
            <Route path="recently-deleted" element={<RecentlyDeletedPage />} />
            <Route path="data-privacy" element={<DataPrivacyPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="bottom-right" />
      </BrowserRouter>
    </MotionConfig>
  );
}
