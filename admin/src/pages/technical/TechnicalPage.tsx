import { useState, useEffect } from 'react';
import { AlertTriangle, Activity, Layers, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { technicalApi } from '@/api';
import { formatDate, cn } from '@/lib/utils';

type Tab = 'health' | 'errors' | 'jobs';

const MOCK_HEALTH_SERVICES = [
  { name: 'Database',      status: 'checking' },
  { name: 'API Server',    status: 'online' },
  { name: 'Email Service', status: 'checking' },
  { name: 'Storage',       status: 'checking' },
];

const MOCK_JOBS = [
  { name: 'support-auto-close', schedule: 'Daily 09:00', status: 'active', lastRun: '—', nextRun: null },
  { name: 'db-backup',          schedule: 'Daily 02:00', status: 'active', lastRun: '—', nextRun: null },
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'healthy' || status === 'ok' || status === 'online' || status === 'active')
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'degraded' || status === 'checking')
    return <MinusCircle className="w-4 h-4 text-amber-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
}

export default function TechnicalPage() {
  const [tab, setTab] = useState<Tab>('health');

  // ── Health ──────────────────────────────────────────────
  const [health, setHealth]             = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthServices, setHealthServices] = useState(MOCK_HEALTH_SERVICES);

  // ── Errors ──────────────────────────────────────────────
  const [errors, setErrors]             = useState<any[]>([]);
  const [errorsLoading, setErrorsLoading] = useState(false);
  const [errorsFetched, setErrorsFetched] = useState(false);

  // ── Jobs ────────────────────────────────────────────────
  const [jobs, setJobs]                 = useState<any[]>([]);
  const [jobsLoading, setJobsLoading]   = useState(false);
  const [jobsFetched, setJobsFetched]   = useState(false);

  useEffect(() => {
    setHealthLoading(true);
    technicalApi.getHealth()
      .then(r => {
        setHealth(r.data);
        const d = r.data as any;
        setHealthServices([
          { name: 'Database',      status: typeof d.database === 'string' ? d.database : (d.database?.status ?? 'checking') },
          { name: 'API Server',    status: d.status === 'ok' || d.status === 'healthy' ? 'online' : 'degraded' },
          { name: 'Email Service', status: 'checking' },
          { name: 'Storage',       status: 'checking' },
        ]);
      })
      .catch(() => {
        setHealth(null);
        setHealthServices(MOCK_HEALTH_SERVICES);
      })
      .finally(() => setHealthLoading(false));
  }, []);

  useEffect(() => {
    if (tab === 'errors' && !errorsFetched) {
      setErrorsLoading(true);
      technicalApi.getErrors({ limit: 50 })
        .then(r => {
          const d = r.data as any;
          setErrors(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []));
        })
        .catch(() => setErrors([]))
        .finally(() => { setErrorsLoading(false); setErrorsFetched(true); });
    }
  }, [tab, errorsFetched]);

  useEffect(() => {
    if (tab === 'jobs' && !jobsFetched) {
      setJobsLoading(true);
      technicalApi.getJobs()
        .then(r => {
          const d = r.data as any;
          setJobs(Array.isArray(d) ? d : MOCK_JOBS);
        })
        .catch(() => setJobs(MOCK_JOBS))
        .finally(() => { setJobsLoading(false); setJobsFetched(true); });
    }
  }, [tab, jobsFetched]);

  const TABS: { id: Tab; label: string; icon: React.ComponentType<any> }[] = [
    { id: 'health', label: 'System Health',    icon: Activity },
    { id: 'errors', label: 'Error Logs',       icon: AlertTriangle },
    { id: 'jobs',   label: 'Background Jobs',  icon: Layers },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Technical" subtitle="System health, error logs, and background jobs" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Health Tab */}
      {tab === 'health' && (
        <div className="space-y-4">
          {healthLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {(healthServices || MOCK_HEALTH_SERVICES).map(svc => (
                  <Card key={svc.name} className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <StatusIcon status={svc.status} />
                      <h3 className="font-semibold text-foreground">{svc.name}</h3>
                    </div>
                    <Badge variant={
                      svc.status === 'online' || svc.status === 'ok' || svc.status === 'healthy' || svc.status === 'connected' ? 'success' :
                      svc.status === 'degraded' || svc.status === 'checking' ? 'warning' : 'error'
                    }>
                      {svc.status.toUpperCase()}
                    </Badge>
                    {health && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Uptime {Math.round((health as any).uptime ?? 0)}s
                      </p>
                    )}
                  </Card>
                ))}
              </div>

              {health && (
                <p className="text-xs text-muted-foreground px-1">
                  Last checked {formatDate(((health as any).checkedAt ?? (health as any).timestamp) as string, 'relative')}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Errors Tab */}
      {tab === 'errors' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Level</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Path</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {errorsLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(4)].map((_, j) => <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
                : !(errors || []).length
                  ? <tr><td colSpan={4} className="px-5 py-16 text-center text-muted-foreground">No error logs found</td></tr>
                  : (errors || []).map((err, i) => (
                    <tr key={err.id ?? i} className={`border-b border-border hover:bg-muted/50 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                      <td className="px-5 py-3">
                        <Badge variant={err.level === 'error' ? 'error' : err.level === 'warn' ? 'warning' : 'secondary'}>
                          {err.level ?? String(err.statusCode ?? '—')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-foreground max-w-md truncate">{err.message ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">{err.path ?? err.endpoint ?? '—'}</td>
                      <td className="px-5 py-3 text-muted-foreground">{err.createdAt ? formatDate(err.createdAt, 'relative') : (err.timestamp ?? '—')}</td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Jobs Tab */}
      {tab === 'jobs' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schedule</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Run</th>
              </tr>
            </thead>
            <tbody>
              {jobsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[...Array(4)].map((_, j) => <td key={j} className="px-5 py-3"><Skeleton className="h-4 w-full" /></td>)}
                  </tr>
                ))
                : !(jobs || []).length
                  ? <tr><td colSpan={4} className="px-5 py-16 text-center text-muted-foreground">No background jobs registered</td></tr>
                  : (jobs || []).map((job, i) => (
                    <tr key={job.name ?? i} className={`border-b border-border hover:bg-muted/50 ${i % 2 === 1 ? 'bg-muted/20' : ''}`}>
                      <td className="px-5 py-3 font-mono text-sm text-foreground">{job.name}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">{job.schedule ?? '—'}</td>
                      <td className="px-5 py-3">
                        <Badge variant={job.status === 'running' || job.status === 'active' ? 'success' : job.status === 'failed' ? 'error' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {job.lastRun === '—' || !job.lastRun ? '—' : formatDate(job.lastRun, 'relative')}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
