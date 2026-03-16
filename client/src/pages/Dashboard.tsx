import { useAuthStore } from '../stores';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { ManagerDashboard } from '../components/dashboard/ManagerDashboard';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';

export function DashboardPage() {
  const { user } = useAuthStore();

  const roleLabel = user?.role === 'ADMIN' ? 'Organization' :
    user?.role === 'MANAGER' ? 'Team' : 'Personal';

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-[13px] text-[#64748B] mt-1">{roleLabel} Overview</p>
        </div>
      </div>

      {user?.role === 'ADMIN' && <AdminDashboard />}
      {user?.role === 'MANAGER' && <ManagerDashboard />}
      {(user?.role === 'MEMBER' || !user?.role) && <MemberDashboard />}
    </div>
  );
}
