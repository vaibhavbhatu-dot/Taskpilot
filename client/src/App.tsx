import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores';
import { authApi } from './api';
import { Spinner } from '@/design-system';
import { ProductTour, TOUR_STEPS } from './components/ui/product-tour';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { CommandPalette } from './components/layout/CommandPalette';

// Pages
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { VerifyEmailPage } from './pages/VerifyEmail';
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
import { MyWorkPage } from './pages/MyWork';
import { BacklogPage } from './pages/Backlog';
import { NotFoundPage } from './pages/NotFound';
import { OnboardingProfilePage } from './pages/onboarding/Profile';
import { OnboardingWorkspacePage } from './pages/onboarding/Workspace';
import { StyleGuideRouter } from './style-guide';
import { Toaster } from './components/ui/sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Passive checklist tracker — no UI, just marks items done after dwell time
function ChecklistTracker() {
  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!user?.onboardingCompleted) return;
    const key = `checklist_${user.id}`;
    const getCompleted = () => { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } };
    const markDone = (id: string) => {
      const updated = { ...getCompleted(), [id]: true };
      localStorage.setItem(key, JSON.stringify(updated));
    };

    const path = location.pathname;
    const completed = getCompleted();
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    if (path === '/tickets'       && !completed.create_ticket) timeouts.push(setTimeout(() => markDone('create_ticket'), 30000));
    if (path === '/board'         && !completed.move_ticket)   timeouts.push(setTimeout(() => markDone('move_ticket'),   20000));
    if (path === '/members'       && !completed.invite_member) timeouts.push(setTimeout(() => markDone('invite_member'), 15000));
    if (path.includes('/sprints') && !completed.start_sprint)  timeouts.push(setTimeout(() => markDone('start_sprint'),  20000));

    return () => timeouts.forEach(clearTimeout);
  }, [location.pathname, user]);

  return null;
}

// Protected layout with sidebar and topbar
function AppLayout() {
  const { user } = useAuthStore();
  const [tourActive, setTourActive] = useState(() => {
    return !localStorage.getItem('tour_completed');
  });

  const showTour = !!user?.onboardingCompleted && tourActive;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="px-8 py-7">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <ChecklistTracker />
      <ProductTour
        steps={TOUR_STEPS}
        isActive={showTour}
        onComplete={() => setTourActive(false)}
        onSkip={() => setTourActive(false)}
      />
    </div>
  );
}

// Auth guard
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading TaskPilot...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

// Onboarding guard — auth check without AppLayout
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
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
            {/* Developer tools — no auth guard */}
            <Route path="/style-guide/*" element={<StyleGuideRouter />} />

            {/* Onboarding — auth-guarded but no sidebar */}
            <Route path="/onboarding/profile" element={<OnboardingGuard><OnboardingProfilePage /></OnboardingGuard>} />
            <Route path="/onboarding/workspace" element={<OnboardingGuard><OnboardingWorkspacePage /></OnboardingGuard>} />

            {/* Convenience redirect */}
            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/invite" element={<ProfileSetupPage />} />
            <Route path="/invite/:token" element={<ProfileSetupPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/my-work" element={<MyWorkPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route path="/board" element={<BoardPage />} />
              <Route path="/backlog" element={<BacklogPage />} />
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

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster richColors position="bottom-right" />
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
