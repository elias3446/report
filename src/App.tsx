
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { MainNavigation } from "@/components/navigation/MainNavigation";
import Index from "./pages/Index";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ReportesPublicos from "./pages/ReportesPublicos";
import MapaReportes from "./pages/MapaReportes";
import ReporteDetalle from "./pages/ReporteDetalle";
import NuevoReporte from "./pages/NuevoReporte";
import AdminReportes from "./pages/admin/AdminReportes";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminCategorias from "./pages/admin/AdminCategorias";
import AdminEstados from "./pages/admin/AdminEstados";
import Dashboard from "./pages/Dashboard";
import MiPerfil from "./pages/MiPerfil";
import Notifications from "./pages/Notifications";
import Configuracion from "./pages/Configuracion";
import { Dashboard as AdminDashboard } from "./components/Dashboard";

const queryClient = new QueryClient();

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, hasProfile } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!user || hasProfile === false) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { user, hasProfile, loading } = useAuth();
  
  // Solo mostrar navegación si el usuario está autenticado y tiene perfil
  const shouldShowNavigation = user && hasProfile === true;
  const shouldShowAssistant = user && hasProfile === true;
  
  // Si estamos cargando, no mostrar navegación
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col w-full">
        <main className="flex-1">
          <Routes>
            <Route path="/*" element={<Index />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full">
      {shouldShowNavigation && <MainNavigation />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Rutas protegidas que requieren autenticación */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/mi-perfil" element={
            <ProtectedRoute>
              <MiPerfil />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/configuracion" element={
            <ProtectedRoute>
              <Configuracion />
            </ProtectedRoute>
          } />

          <Route path="/nuevo-reporte" element={
            <ProtectedRoute>
              <NuevoReporte />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/reportes-publicos" element={
            <ProtectedRoute>
              <ReportesPublicos />
            </ProtectedRoute>
          } />
          
          <Route path="/mapa-reportes" element={
            <ProtectedRoute>
              <MapaReportes />
            </ProtectedRoute>
          } />
          
          <Route path="/reporte/:id" element={
            <ProtectedRoute>
              <ReporteDetalle />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - también protegidas */}
          <Route path="/admin/reportes" element={
            <ProtectedRoute>
              <AdminReportes />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/usuarios" element={
            <ProtectedRoute>
              <AdminUsuarios />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/roles" element={
            <ProtectedRoute>
              <AdminRoles />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/categorias" element={
            <ProtectedRoute>
              <AdminCategorias />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/estados" element={
            <ProtectedRoute>
              <AdminEstados />
            </ProtectedRoute>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
