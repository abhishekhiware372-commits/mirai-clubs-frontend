'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, getDashboardPathForRole } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  const { role } = useAuth();
  const returnPath = role ? getDashboardPathForRole(role) : '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-400 mb-4 shadow-xl">
        <ShieldAlert className="w-10 h-10" />
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Access Restricted</h1>
      <p className="text-xs text-slate-400 max-w-md mt-2 leading-relaxed">
        Your authenticated role (<code className="text-cyan-400 font-mono">{role || 'GUEST'}</code>) does
        not have institutional permissions to access this administrative boundary.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Link href={returnPath}>
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Return to Authorized Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
