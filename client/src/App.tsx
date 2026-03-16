import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores';
import { authApi } from './api';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/layout/CommandPalette';

// Pages
import { LoginPage } from './pages/Login';
import { ProfileSetupPage } from './pages/ProfileSetup';
import { DashboardPage } from './pages/Dashboard';
import { TicketsPage } from './pages/Tickets';
import { TicketDetailPage } from './pages/TicketDetail';
import { BoardPage } from './pages/Board';
import { SprintPlanningPage } from './pages/SprintPlanning';
import { ActiveSprintPage } from './pages/ActiveSprint';
import { SprintReportsPage } from './pages/SprintReports';
import { TeamsPage } from './pages/Teams';
import { ProfilePage } from './pages/Profile';
import { AdminSettingsPage } from './pages/AdminSettings';
import { ActivityLog } from './pages/admin/ActivityLog';
import { NotificationsPage } from './pages/Notifications';
import { MembersPage } from './pages/Members';
import { ProjectsPage } from './pages/Projects';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected layout with sidebar and topbar
function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <div className="px-8 py-7">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

// Auth guard
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-[#64748B]">Loading ProjectHub...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

// Admin guard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { accessToken, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    async function initAuth() {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authApi.getMe();
        setAuth(data as any, accessToken);
      } catch {
        clearAuth();
      }
    }
    initAuth();
  }, []);

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/invite" element={<ProfileSetupPage />} />
            <Route path="/invite/:token" element={<ProfileSetupPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/sprints/planning" element={<SprintPlanningPage />} />
              <Route path="/sprints/active" element={<ActiveSprintPage />} />
              <Route path="/sprints/reports" element={<SprintReportsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/teams/:id" element={<TeamsPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/user/:id" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route
                path="/members"
                element={<AdminRoute><MembersPage /></AdminRoute>}
              />
              <Route
                path="/settings"
                element={<AdminRoute><AdminSettingsPage /></AdminRoute>}
              />
              <Route
                path="/activity"
                element={<AdminRoute><ActivityLog /></AdminRoute>}
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
