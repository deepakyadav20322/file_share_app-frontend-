import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import TransferPage from "./transfer/TransferPage";
import ReceivePage from "./transfer/ReceivePage";
import AboutPage from "./transfer/AboutPage";
import ContactPage from "./transfer/ContactPage";
import PrivacyPage from "./transfer/PrivacyPage";
import TermsPage from "./transfer/TermsPage";
import TransparencyPage from "./transfer/TransparencyPage";
import AdminConfigPage from "./transfer/AdminConfigPage";
import NotFoundPage from "./transfer/NotFoundPage";
import AdminOnly from "./transfer/AdminOnly";
import AdminMessagesPage from "./transfer/AdminMessagesPage";
import ScrollManager from "./ScrollManager";

// Admin-only page, loaded on demand so regular visitors never download it.
const ArchitecturePage = lazy(() => import("./transfer/ArchitecturePage"));

// Change VITE_DEFAULT_HOME in .env to decide which page "/" opens.
const home = import.meta.env.VITE_DEFAULT_HOME === "classic" ? "/classic" : "/transfer";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/receive/:key" element={<ReceivePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/transparency" element={<TransparencyPage />} />
        <Route path="/admin/config" element={<AdminConfigPage />} />
        <Route path="/admin/messages" element={<AdminOnly><AdminMessagesPage /></AdminOnly>} />
        {/* Admin only: opened from the admin page. */}
        <Route
          path="/admin/architecture"
          element={
            <AdminOnly>
              <Suspense fallback={<div className="min-h-screen bg-paper" />}>
                <ArchitecturePage />
              </Suspense>
            </AdminOnly>
          }
        />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/classic" element={<App />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
