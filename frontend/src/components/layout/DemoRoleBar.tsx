'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

export function DemoRoleBar() {
  const { role, quickLoginAsRole, user } = useAuth();

  return (
    <aside
      aria-label="Institutional Role Bar"
      className="bg-slate-950/95 border-b border-slate-800/80 px-4 py-1.5 text-xs text-slate-300 relative z-40"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
            <ShieldCheck className="w-3 h-3 text-cyan-400" /> MSOT CHALLENGE PROBLEM 5
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Mirai School of Technology • Club Activities Tracker
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
          <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-slate-400" /> Switch Role:
          </span>

          <button
            onClick={() => quickLoginAsRole('student')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              role === 'STUDENT'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Student
          </button>

          <button
            onClick={() => quickLoginAsRole('coordinator')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              role === 'STUDENT_COORDINATOR'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Coordinator
          </button>

          <button
            onClick={() => quickLoginAsRole('advisor')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              role === 'FACULTY_ADVISOR'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Advisor
          </button>

          <button
            onClick={() => quickLoginAsRole('campus-manager')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              role === 'CAMPUS_MANAGER'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Campus Manager
          </button>

          <button
            onClick={() => quickLoginAsRole('admin')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              role === 'ADMIN'
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </aside>
  );
}
