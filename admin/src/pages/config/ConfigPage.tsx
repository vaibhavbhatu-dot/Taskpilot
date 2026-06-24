import { useState } from 'react';
import { Flag, Mail, ToggleLeft, ToggleRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type Tab = 'flags' | 'email';

const FEATURE_FLAGS = [
  { key: 'ai_triage',           label: 'AI Triage',            description: 'Auto-classify support tickets using AI', enabled: true,  env: 'production' },
  { key: 'master_admin_panel',  label: 'Master Admin Panel',   description: 'This panel (always on)',                 enabled: true,  env: 'all' },
  { key: 'analytics_dashboard', label: 'Analytics Dashboard',  description: 'Phase 2 growth analytics',              enabled: false, env: 'staging' },
  { key: 'billing_module',      label: 'Billing Module',       description: 'Plans and subscriptions page',           enabled: false, env: 'staging' },
  { key: 'impersonation',       label: 'User Impersonation',   description: 'Allow admins to login as any user',      enabled: false, env: 'production' },
];

const EMAIL_TEMPLATES = [
  { key: 'ticket_confirmation',    name: 'Ticket Confirmation',  description: 'Sent to user when ticket is created' },
  { key: 'admin_new_ticket_alert', name: 'New Ticket Alert',     description: 'Sent to admin when new ticket arrives' },
  { key: 'admin_reply_notification', name: 'Admin Reply',        description: 'Sent to user when admin replies' },
  { key: 'ticket_resolved',        name: 'Ticket Resolved',      description: 'Sent to user when ticket is resolved' },
  { key: 'auto_close_warning',     name: 'Auto Close Warning',   description: 'Sent 5 days before auto-close' },
  { key: 'invite_user',            name: 'User Invitation',      description: 'Sent when user is invited to organisation' },
  { key: 'verify_email',           name: 'Email Verification',   description: 'Sent for email verification' },
];

export default function ConfigPage() {
  const [tab, setTab]     = useState<Tab>('flags');
  const [flags, setFlags] = useState(FEATURE_FLAGS);

  function toggleFlag(key: string) {
    setFlags(prev => (prev || []).map(f => f.key === key ? { ...f, enabled: !f.enabled } : f));
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Configuration" subtitle="Feature flags and email templates" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {[
          { id: 'flags' as Tab, label: 'Feature Flags',   icon: Flag },
          { id: 'email' as Tab, label: 'Email Templates', icon: Mail },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Feature Flags */}
      {tab === 'flags' && (
        <div className="space-y-3">
          {!(flags || []).length ? (
            <p className="text-sm text-muted-foreground px-1">No feature flags configured yet</p>
          ) : (
            (flags || []).map(flag => (
              <div key={flag.key} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-foreground">{flag.label}</p>
                    <Badge variant="secondary">{flag.env}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                </div>
                <button
                  onClick={() => toggleFlag(flag.key)}
                  className={cn('flex-shrink-0 transition-colors', flag.enabled ? 'text-primary' : 'text-muted-foreground')}
                  title={flag.enabled ? 'Disable' : 'Enable'}
                >
                  {flag.enabled
                    ? <ToggleRight className="w-8 h-8" />
                    : <ToggleLeft  className="w-8 h-8" />
                  }
                </button>
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground px-1">
            Note: Toggles are local only — backend feature flag API not yet built.
          </p>
        </div>
      )}

      {/* Email Templates */}
      {tab === 'email' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!(EMAIL_TEMPLATES || []).length ? (
            <p className="text-sm text-muted-foreground">No email templates found</p>
          ) : (
            (EMAIL_TEMPLATES || []).map(tmpl => (
              <Card key={tmpl.key} className="p-5 hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{tmpl.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{tmpl.description}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
