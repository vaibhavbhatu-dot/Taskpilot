import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuthStore } from './stores/authStore';
import { authApi } from './api';
import { AppLayout } from './components/layout/AppLayout';
import { Spinner } from './components/ui/Spinner';

// Pages
import LoginPage          from './pages/auth/LoginPage';
import DashboardPage      from './pages/dashboard/DashboardPage';
import OrganisationsPage  from './pages/organisations/OrganisationsPage';
import UsersPage          from './pages/users/UsersPage';
import SupportPage        from './pages/support/SupportPage';
import TechnicalPage      from './pages/technical/TechnicalPage';
import ConfigPage         from './pages/config/ConfigPage';
import AdminAccountsPage  from './pages/admin-accounts/AdminAccountsPage';
import AuditLogsPage      from './pages/audit-logs/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

// ── AppInitializer ────────────────────────────────────────────────────────────

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { token, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    async function init() {
      if (!token) { setLoading(false); return; }
      try {
        const res = await authApi.me();
        setAuth(res.data, token);
      } catch {
        clearAuth();
      }
    }
    init();
  }, []);

  return <>{children}</>;
}

// ── ProtectedRoute ────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-primary" />
          <p className="text-sm text-muted-foreground">Loading Admin Panel…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected — inside AppLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"           element={<DashboardPage />} />
              <Route path="/organisations"       element={<OrganisationsPage />} />
              <Route path="/users"               element={<UsersPage />} />
              <Route path="/support"             element={<SupportPage />} />
              <Route path="/support/triage"      element={<SupportPage />} />
              <Route path="/technical"           element={<TechnicalPage />} />
              <Route path="/technical/health"    element={<TechnicalPage />} />
              <Route path="/technical/errors"    element={<TechnicalPage />} />
              <Route path="/technical/jobs"      element={<TechnicalPage />} />
              <Route path="/config"              element={<ConfigPage />} />
              <Route path="/config/flags"        element={<ConfigPage />} />
              <Route path="/config/email"        element={<ConfigPage />} />
              <Route path="/admin-accounts"      element={<AdminAccountsPage />} />
              <Route path="/audit-logs"          element={<AuditLogsPage />} />

              {/* Phase 2 stubs — redirect to dashboard for now */}
              <Route path="/analytics/*"         element={<Navigate to="/dashboard" replace />} />
              <Route path="/billing/*"           element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster richColors position="bottom-right" />
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
