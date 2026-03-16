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
      bg: '#F0FDF4',
      border: '#22C55E',
      text: '#166534',
      icon: <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />,
    },
    error: {
      bg: '#FEF2F2',
      border: '#EF4444',
      text: '#991B1B',
      icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    },
    info: {
      bg: '#EFF6FF',
      border: '#3B82F6',
      text: '#1E40AF',
      icon: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
    },
    warning: {
      bg: '#FFFBEB',
      border: '#F59E0B',
      text: '#92400E',
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />,
    },
  }[type];

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl min-w-[280px] max-w-[360px] animate-slide-up"
      style={{
        backgroundColor: config.bg,
        borderLeft: `3px solid ${config.border}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      {config.icon}
      <span className="flex-1 text-[13px] font-medium" style={{ color: config.text }}>
        {message}
      </span>
      <button
        onClick={() => onRemove(id)}
        className="p-0.5 rounded hover:bg-black/10 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" style={{ color: config.text }} />
      </button>
    </div>
  );
}
