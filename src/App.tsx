import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { AuthProvider, RequireAuth } from "@/lib/auth";
import DashboardLayout from "@/layouts/DashboardLayout";
import Analysis from "@/pages/Analysis";
import Sensors from "@/pages/Sensors";
import DetailedReport from "@/pages/DetailedReport";
import Maintainence from "@/pages/Maintainence";
import Inventory from "@/pages/Inventory";
import { WaterDataProvider } from "@/providers/WaterDataProvider";
import { InventoryProvider } from "@/providers/InventoryProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <WaterDataProvider>
            <InventoryProvider>
              <Toaster />
              <Sonner position="top-center" richColors />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
                  <Route path="/" element={<Navigate to="/login" replace />} />
                  <Route path="/dashboard" element={<Index />} />
                  <Route path="/analysis" element={<Analysis />} />
                  <Route path="/report" element={<DetailedReport />} />
                  <Route path="/sensors" element={<Sensors />} />
                  <Route path="/maintainence" element={<Maintainence />} />
                  <Route path="/inventory" element={<Inventory />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </InventoryProvider>
          </WaterDataProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
