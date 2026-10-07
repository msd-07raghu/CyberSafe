import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="text-cyan-400 animate-spin" />
      </div>
    );
  }

  return session ? <DashboardPage /> : <LoginPage />;
}
