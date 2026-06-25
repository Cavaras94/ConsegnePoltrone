import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Consegne from './pages/Consegne';
import ConsegnaDetail from './pages/ConsegnaDetail';
import Lavori from './pages/Lavori';
import LavoroDetail from './pages/LavoroDetail';
import Calendario from './pages/Calendario';
import Squadre from './pages/Squadre';
import Report from './pages/Report';
import Utenti from './pages/Utenti';
import type { Role } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PrivateRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />

        {/* Consegne */}
        <Route path="consegne" element={<Consegne />} />
        <Route path="consegne/:id" element={<ConsegnaDetail />} />

        {/* Installazioni */}
        <Route path="lavori" element={
          <PrivateRoute allowedRoles={['Admin', 'Manager', 'Caposquadra']}><Lavori /></PrivateRoute>
        } />
        <Route path="lavori/calendario" element={
          <PrivateRoute allowedRoles={['Admin', 'Manager', 'Caposquadra']}><Calendario /></PrivateRoute>
        } />
        <Route path="lavori/:id" element={
          <PrivateRoute allowedRoles={['Admin', 'Manager', 'Caposquadra']}><LavoroDetail /></PrivateRoute>
        } />
        <Route path="squadre" element={
          <PrivateRoute allowedRoles={['Admin', 'Manager']}><Squadre /></PrivateRoute>
        } />

        {/* Admin & Manager */}
        <Route path="report" element={
          <PrivateRoute allowedRoles={['Admin', 'Manager']}><Report /></PrivateRoute>
        } />
        <Route path="utenti" element={
          <PrivateRoute allowedRoles={['Admin']}><Utenti /></PrivateRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
