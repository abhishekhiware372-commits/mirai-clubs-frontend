'use client';

import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { User, Mail, Building, GraduationCap, Phone, ShieldCheck } from 'lucide-react';

export default function StudentProfilePage() {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          Student Information System
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          Student Profile Dossier
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Institutional identity and enrolled co-curricular credentials.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-surface-border">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-2xl font-bold text-cyan-300 font-mono">
            {user?.full_name ? user.full_name.charAt(0) : 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">{user?.full_name || 'Alex Chen'}</h2>
              <Badge variant="cyan" size="sm">
                Verified Student
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Student ID: {user?.student_id || 'MST-2026-CS101'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surface-elevated space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Institutional Email
            </span>
            <span className="text-slate-200 font-medium">{user?.email || 'alex.chen@student.mirai.edu'}</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Campus Center</span>
            <span className="text-slate-200 font-medium">
              {user?.campus_name || 'Mirai Main Campus - Tech City, Bangalore'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Department & Track</span>
            <span className="text-slate-200 font-medium">
              {user?.department || 'Computer Science & AI'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Academic Year</span>
            <span className="text-slate-200 font-medium">{user?.year || '2nd Year (Semester 3)'}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Accreditation Status:
          </span>
          <span className="text-emerald-400 font-bold">Good Standing • Co-Curricular Certified</span>
        </div>
      </Card>
    </div>
  );
}
