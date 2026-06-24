import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Trash2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { adminAccountsApi } from '@/api';
import { formatDate } from '@/lib/utils';
import type { MasterAdmin, MasterAdminRole } from '@/types';

const ROLE_BADGE: Record<MasterAdminRole, any> = {
  SUPER_ADMIN:      'error',
  SUPPORT_ADMIN:    'info',
  TECH_ADMIN:       'warning',
  MARKETING_ADMIN:  'default',
  FINANCE_ADMIN:    'secondary',
};

const createSchema = z.object({
  fullName: z.string().min(2, 'Name required'),
  email:    z.string().email('Invalid email'),
  role:     z.enum(['SUPER_ADMIN', 'SUPPORT_ADMIN', 'TECH_ADMIN', 'MARKETING_ADMIN', 'FINANCE_ADMIN']),
  password: z.string().min(10, 'Min 10 characters'),
});
type CreateForm = z.infer<typeof createSchema>;

export default function AdminAccountsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [serverError, setServerError] = useState('');

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['master-admins'],
    queryFn: () => adminAccountsApi.list().then(r => r.data).catch(() => []),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => adminAccountsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['master-admins'] });
      toast.success('Admin account created');
      setShowForm(false);
      reset();
    },
    onError: (err: any) => setServerError(err.response?.data?.error ?? 'Failed to create admin'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminAccountsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['master-admins'] }); toast.success('Admin removed'); },
    onError: () => toast.error('Failed to remove admin'),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'SUPPORT_ADMIN' },
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admin Accounts"
        subtitle="Manage who has access to this master admin panel"
        actions={
          <Button onClick={() => setShowForm(v => !v)} leftIcon={<Plus className="w-4 h-4" />} size="sm">
            Add Admin
          </Button>
        }
      />

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">New Admin Account</h3>
          {serverError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg mb-4 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{serverError}
            </div>
          )}
          <form onSubmit={handleSubmit(d => { setServerError(''); createMutation.mutate(d); })}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Jane Smith" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="admin@taskpilot.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select {...register('role')}
                className="h-9 w-full px-3 text-sm border border-input rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SUPPORT_ADMIN">Support Admin</option>
                <option value="TECH_ADMIN">Tech Admin</option>
                <option value="MARKETING_ADMIN">Marketing Admin</option>
                <option value="FINANCE_ADMIN">Finance Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="Min 10 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
              <Button type="submit" size="sm" loading={isSubmitting || createMutation.isPending}>Create Admin</Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Login</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(5)].map((_, j) => <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              ))
              : !(admins || []).length
                ? <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p>No admin accounts found</p>
                  </td></tr>
                : (admins as any[]).map((admin, i) => {
                  const displayName = admin.fullName ?? admin.name ?? '—';
                  return (
                    <tr key={admin.id} className={`border-b border-border hover:bg-muted/50 transition-colors ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={admin.avatar} name={displayName} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">{displayName}</p>
                            <p className="text-xs text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><Badge variant={ROLE_BADGE[admin.role as MasterAdminRole] ?? 'secondary'}>{admin.role?.replace(/_/g, ' ')}</Badge></td>
                      <td className="px-5 py-3 text-muted-foreground">{admin.lastLoginAt ? formatDate(admin.lastLoginAt, 'relative') : 'Never'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(admin.createdAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => { if (confirm(`Remove ${displayName}?`)) deleteMutation.mutate(admin.id); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
