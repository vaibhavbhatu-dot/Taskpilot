import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../../stores';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.slice(-3).map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onRemove: (id: string) => void;
}

function Toast({ id, type, message, onRemove }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  const config = {
    success: {
      bgCls:   'bg-[hsl(var(--color-success))]/10',
      border:  'hsl(var(--color-success))',
      textCls: 'text-[hsl(var(--color-success))]',
      icon:    <CheckCircle className="w-4 h-4 flex-shrink-0 text-[hsl(var(--color-success))]" />,
    },
    error: {
      bgCls:   'bg-destructive/10',
      border:  'hsl(var(--destructive))',
      textCls: 'text-destructive',
      icon:    <AlertCircle className="w-4 h-4 flex-shrink-0 text-destructive" />,
    },
    info: {
      bgCls:   'bg-[hsl(var(--color-info))]/10',
      border:  'hsl(var(--color-info))',
      textCls: 'text-[hsl(var(--color-info))]',
      icon:    <Info className="w-4 h-4 flex-shrink-0 text-[hsl(var(--color-info))]" />,
    },
    warning: {
      bgCls:   'bg-[hsl(var(--color-warning))]/10',
      border:  'hsl(var(--color-warning))',
      textCls: 'text-[hsl(var(--color-warning))]',
      icon:    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[hsl(var(--color-warning))]" />,
    },
  }[type];

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl min-w-[280px] max-w-[360px] animate-slide-up shadow-lg ${config.bgCls}`}
      style={{ borderLeft: `3px solid ${config.border}` }}
    >
      {config.icon}
      <span className={`flex-1 text-[13px] font-medium ${config.textCls}`}>
        {message}
      </span>
      <button
        onClick={() => onRemove(id)}
        className="p-0.5 rounded hover:bg-black/10 transition-colors flex-shrink-0"
      >
        <X className={`w-3.5 h-3.5 ${config.textCls}`} />
      </button>
    </div>
  );
}
