import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
          <AlertCircle className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <h1 className="text-[48px] font-bold text-foreground leading-none mb-2">404</h1>
        <h2 className="text-[20px] font-semibold text-foreground mb-2">Page not found</h2>
        <p className="text-[14px] text-muted-foreground mb-8">
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
