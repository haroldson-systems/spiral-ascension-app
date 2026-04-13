
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ModulePage from "./pages/ModulePage.tsx";
import SpiralLessonPage from "./pages/SpiralLessonPage";
import PracticeDetail from "./pages/PracticeDetail";
import PracticeEntryDetail from "./pages/PracticeEntryDetail";
import AdminPractices from "./pages/AdminPractices";
import MoonSyncTrackerPage from "./pages/MoonSyncTrackerPage";
import VaultPage from "./pages/VaultPage";
import MaintenancePage from "./pages/MaintenancePage";
import BillingSuccessPage from "./pages/BillingSuccessPage";
import BillingCancelPage from "./pages/BillingCancelPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutCancelPage from "./pages/CheckoutCancelPage";
import SubscribePage from "./pages/SubscribePage";
import AuthPage from "./pages/AuthPage";
import EntryPage from "./pages/EntryPage";
import { AppAccessGate } from "./components/AppAccessGate";


const queryClient = new QueryClient();
const envMaintenanceModeEnabled = String(import.meta.env.VITE_MAINTENANCE_MODE ?? "").toLowerCase() === "true";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash) {
      requestAnimationFrame(() => {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        window.scrollTo(0, 0);
      });
      return;
    }

    if (navigationType === 'POP') {
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
}

function MaintenanceGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const siteSettingsQuery = useSiteSettings();
  const adminPaths = ["/admin"];
  const isAdminPath = adminPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const maintenanceModeEnabled =
    envMaintenanceModeEnabled || Boolean(siteSettingsQuery.data?.maintenanceMode);

  if (isAdminPath) {
    return <>{children}</>;
  }

  if (envMaintenanceModeEnabled) {
    return <MaintenancePage />;
  }

  if (siteSettingsQuery.isPending || siteSettingsQuery.isError || !maintenanceModeEnabled) {
    return <>{children}</>;
  }

  return <MaintenancePage />;
}

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <MaintenanceGate>
            <Routes>
              <Route path="/subscribe" element={<SubscribePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/checkout/cancel" element={<CheckoutCancelPage />} />

              <Route path="/billing/success" element={<BillingSuccessPage />} />
              <Route path="/billing/cancel" element={<BillingCancelPage />} />

              <Route path="/admin" element={<AdminPractices />} />

              <Route path="/" element={<EntryPage />} />
              <Route path="/app" element={<AppAccessGate><Index /></AppAccessGate>} />

              {/* MoonSync full tracker */}
              <Route path="/moonsync" element={<AppAccessGate><MoonSyncTrackerPage /></AppAccessGate>} />

              {/* Vault - dedicated page */}
              <Route path="/vault" element={<AppAccessGate><VaultPage /></AppAccessGate>} />

              <Route path="/practice/:id" element={<AppAccessGate><PracticeDetail /></AppAccessGate>} />
              <Route path="/practice-entry/:id" element={<AppAccessGate><PracticeEntryDetail /></AppAccessGate>} />

              {/* NEW MODULE PAGE ROUTE */}
              <Route path="/module/:id" element={<AppAccessGate><ModulePage /></AppAccessGate>} />
              <Route path="/module/:id/tier/:tier" element={<AppAccessGate><SpiralLessonPage /></AppAccessGate>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </MaintenanceGate>

        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
