import { useAuthStore } from '../stores';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { ManagerDashboard } from '../components/dashboard/ManagerDashboard';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';
import { PageHeader } from '../components/ui/PageHeader';

export function DashboardPage() {
  const { user } = useAuthStore();
  const subtitle = user?.role === 'ADMIN' ? 'Organization overview' : user?.role === 'MANAGER' ? 'Team overview' : 'Personal overview';

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={subtitle} />
      {user?.role === 'ADMIN' && <AdminDashboard />}
      {user?.role === 'MANAGER' && <ManagerDashboard />}
      {(user?.role === 'MEMBER' || !user?.role) && <MemberDashboard />}
    </div>
  );
}
