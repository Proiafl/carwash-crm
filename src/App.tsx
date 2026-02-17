import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Servicios from "./pages/Servicios";
import Inventario from "./pages/Inventario";
import Finanzas from "./pages/Finanzas";
import Personal from "./pages/Personal";
import Configuracion from "./pages/Configuracion";
import Ordenes from "./pages/Ordenes";
import CheckInWizard from "./pages/CheckIn";
import StatusMonitor from "./pages/CheckIn/Step5Status"; // Separate route
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      {/* Public QR Check-in Routes */}
      <Route path="/checkin" element={<CheckInWizard />} />
      <Route path="/checkin/monitor/:orderId" element={<StatusMonitor />} />

      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/app/ordenes" element={<ProtectedRoute><Ordenes /></ProtectedRoute>} />
      <Route path="/app/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/app/servicios" element={<ProtectedRoute><Servicios /></ProtectedRoute>} />
      <Route path="/app/inventario" element={<ProtectedRoute><Inventario /></ProtectedRoute>} />
      <Route path="/app/finanzas" element={<ProtectedRoute><Finanzas /></ProtectedRoute>} />
      <Route path="/app/personal" element={<ProtectedRoute><Personal /></ProtectedRoute>} />
      <Route path="/app/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
