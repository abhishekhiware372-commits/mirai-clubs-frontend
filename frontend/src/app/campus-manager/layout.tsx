'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from '../../components/layout/AppHeader';
import { RoleSidebar } from '../../components/layout/RoleSidebar';
import { MobileNav } from '../../components/layout/MobileNav';
import { Loader2 } from 'lucide-react';

export default function CampusManagerLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && role !== 'CAMPUS_MANAGER') {
      router.replace('/unauthorized');
    }
  }, [role, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (role !== 'CAMPUS_MANAGER') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100">
      <AppHeader onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <RoleSidebar
          role={role}
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <main className="flex-1 md:pl-64 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 min-w-0">
          {children}
        </main>
      </div>
      <MobileNav role={role} />
    </div>
  );
}
