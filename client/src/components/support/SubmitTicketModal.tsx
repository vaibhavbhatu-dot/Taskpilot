import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Modal,
  Button,
  FormField,
  Input,
  Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  cn,
} from '@/design-system';
import { supportApi } from '../../api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'BUG',     label: 'Bug report' },
  { value: 'FEATURE', label: 'Feature request' },
  { value: 'ACCOUNT', label: 'Account issue' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'OTHER',   label: 'Other' },
];

export function SubmitTicketModal({ open, onClose }: Props) {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ category: '', subject: '', description: '' });
  const [fileName, setFileName]       = useState<string | null>(null);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]     = useState<string | null>(null);

  function reset() {
    setForm({ category: '', subject: '', description: '' });
    setFileName(null);
    setErrors({});
    setIsSubmitting(false);
    setSubmitted(null);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      reset();
      onClose();
    }
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.category)                          e.category    = 'Please select a category';
    if (!form.subject.trim())                    e.subject     = 'Subject is required';
    if (form.subject.trim().length > 100)        e.subject     = 'Subject must be 100 characters or fewer';
    if (!form.description.trim())                e.description = 'Description is required';
    if (form.description.trim().length < 20)     e.description = 'Please describe the issue in at least 20 characters';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setIsSubmitting(true);
    try {
      const metadata = {
        browser:   navigator.userAgent,
        page:      window.location.pathname,
        timestamp: new Date().toISOString(),
      };
      const res = await supportApi.createTicket({ ...form, metadata });
      setSubmitted(res.data.ticketNumber);
    } catch {
      toast.error('Failed to submit ticket', { description: 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={submitted ? undefined : 'Submit a support ticket'}
      description={submitted ? undefined : 'Describe your issue and we\'ll get back to you within 24 hours.'}
      size="md"
    >
      {submitted ? (
        // ── Success state ──────────────────────────────────────────────
        <div className="flex flex-col items-center py-8 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#F0FDF4] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">Ticket submitted!</h3>
            <p className="text-sm text-[#64748B] mt-1">
              Your ticket number is{' '}
              <span className="font-mono font-bold text-[#2563EB]">{submitted}</span>
            </p>
            <p className="text-xs text-[#94A3B8] mt-2">
              Check your email for confirmation. We'll respond within 24 hours.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => { reset(); onClose(); navigate('/support/my-tickets'); }}
            >
              Track ticket →
            </Button>
          </div>
        </div>
      ) : (
        // ── Form ──────────────────────────────────────────────────────
        <div className="space-y-4">
          {/* Category */}
          <FormField label="Category" required error={errors.category}>
            <Select
              value={form.category}
              onValueChange={(val) => {
                setForm((f) => ({ ...f, category: val }));
                setErrors((e) => ({ ...e, category: '' }));
              }}
            >
              <SelectTrigger className={cn(errors.category && 'border-destructive')}>
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {/* Subject */}
          <FormField label="Subject" required error={errors.subject}>
            <Input
              value={form.subject}
              onChange={(e) => {
                setForm((f) => ({ ...f, subject: e.target.value }));
                setErrors((ex) => ({ ...ex, subject: '' }));
              }}
              placeholder="Brief description of the issue"
              maxLength={100}
              variant={errors.subject ? 'error' : 'default'}
            />
          </FormField>

          {/* Description */}
          <FormField label="Description" required error={errors.description}>
            <Textarea
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }));
                setErrors((ex) => ({ ...ex, description: '' }));
              }}
              placeholder="Describe your issue in detail..."
              rows={5}
              className={cn(errors.description && 'border-destructive')}
            />
          </FormField>

          {/* Attachment */}
          <div>
            <p className="text-sm font-medium text-foreground mb-1.5">Attachment <span className="text-muted-foreground font-normal">(optional)</span></p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            {fileName ? (
              <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border border-border text-sm">
                <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate text-foreground">{fileName}</span>
                <button
                  type="button"
                  onClick={() => { setFileName(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 text-sm text-muted-foreground transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Attach file (image or PDF, max 5MB)
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => { reset(); onClose(); }}>
              Cancel
            </Button>
            <Button variant="default" loading={isSubmitting} onClick={handleSubmit}>
              Submit ticket
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
