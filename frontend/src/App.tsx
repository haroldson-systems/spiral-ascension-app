
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ModulePage from "./pages/ModulePage.tsx";
import SpiralLessonPage from "./pages/SpiralLessonPage";
import PracticeDetail from "./pages/PracticeDetail";
import PracticeEntryDetail from "./pages/PracticeEntryDetail";
import AdminPractices from "./pages/AdminPractices";
import MoonSyncTrackerPage from "./pages/MoonSyncTrackerPage";
import VaultPage from "./pages/VaultPage";


const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
  <Route path="/" element={<Index />} />

  {/* MoonSync full tracker */}
  <Route path="/moonsync" element={<MoonSyncTrackerPage />} />

  {/* Vault — dedicated page */}
  <Route path="/vault" element={<VaultPage />} />

  <Route path="/practice/:id" element={<PracticeDetail />} />
  <Route path="/practice-entry/:id" element={<PracticeEntryDetail />} />
  <Route path="/admin" element={<AdminPractices />} />

  {/* NEW MODULE PAGE ROUTE */}
  <Route path="/module/:id" element={<ModulePage />} />
  <Route path="/module/:id/tier/:tier" element={<SpiralLessonPage />} />

  <Route path="*" element={<NotFound />} />
</Routes>

        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
