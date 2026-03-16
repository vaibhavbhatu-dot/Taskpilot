import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#E2E8F0]">
          <AlertCircle className="w-10 h-10 text-[#94A3B8]" strokeWidth={1.5} />
        </div>
        <h1 className="text-[48px] font-bold text-[#0F172A] leading-none mb-2">404</h1>
        <h2 className="text-[20px] font-semibold text-[#0F172A] mb-2">Page not found</h2>
        <p className="text-[14px] text-[#64748B] mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
