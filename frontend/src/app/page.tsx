'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getDashboardPathForRole } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && role) {
        router.replace(getDashboardPathForRole(role));
      } else {
        router.replace('/login');
      }
    }
  }, [user, role, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white text-lg shadow-xl mb-4 animate-pulse">
        MC
      </div>
      <h2 className="text-base font-bold text-slate-100">MIRAI CLUBS</h2>
      <p className="text-xs text-slate-400 mt-1">Directing to your authorized institutional dashboard...</p>
      <Loader2 className="w-5 h-5 animate-spin text-cyan-400 mt-4" />
    </div>
  );
}
