'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '../../lib/api/types';
import {
  LayoutDashboard,
  Users,
  Compass,
  CalendarDays,
  QrCode,
  Sparkles,
  UploadCloud,
  Award,
  GraduationCap,
  Bell,
  CheckCircle2,
  FileText,
  Building2,
  Sliders,
  BarChart3,
  UserCog,
  FileCheck2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export function RoleSidebar({
  role,
  isOpen,
  onClose,
}: {
  role: Role | null;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const getNavItems = (): NavItem[] => {
    switch (role) {
      case 'STUDENT':
        return [
          { label: 'Overview', href: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Explore Clubs', href: '/student/clubs', icon: <Compass className="w-4 h-4" /> },
          { label: 'Club Day Hub', href: '/student/club-day', icon: <CalendarDays className="w-4 h-4" />, badge: 'Live' },
          { label: 'Attendance & QR', href: '/student/attendance', icon: <QrCode className="w-4 h-4" /> },
          { label: 'Campus Events', href: '/student/events', icon: <Sparkles className="w-4 h-4" /> },
          { label: 'Deliverables', href: '/student/submissions', icon: <UploadCloud className="w-4 h-4" /> },
          { label: 'Certificates', href: '/student/certificates', icon: <Award className="w-4 h-4" /> },
          { label: 'Official Transcript', href: '/student/transcript', icon: <GraduationCap className="w-4 h-4" />, badge: 'Official' },
          { label: 'Notifications', href: '/student/notifications', icon: <Bell className="w-4 h-4" /> },
        ];

      case 'STUDENT_COORDINATOR':
        return [
          { label: 'Quick Dashboard', href: '/coordinator/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Host Live QR Check-In', href: '/coordinator/attendance', icon: <QrCode className="w-4 h-4" />, badge: '15s Active' },
          { label: 'Plan Club Day', href: '/coordinator/club-day', icon: <CalendarDays className="w-4 h-4" /> },
          { label: 'Membership Requests', href: '/coordinator/requests', icon: <Users className="w-4 h-4" />, badge: '3 Pending' },
          { label: 'Assigned Clubs', href: '/coordinator/clubs', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Submissions Queue', href: '/coordinator/submissions', icon: <UploadCloud className="w-4 h-4" /> },
          { label: 'Rubric Evaluations', href: '/coordinator/evaluations', icon: <FileCheck2 className="w-4 h-4" /> },
          { label: 'Club Reports', href: '/coordinator/reports', icon: <BarChart3 className="w-4 h-4" /> },
        ];

      case 'FACULTY_ADVISOR':
        return [
          { label: 'Advisor Overview', href: '/advisor/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: '7-Day Plan Approvals', href: '/advisor/activities', icon: <CheckCircle2 className="w-4 h-4" />, badge: '1 New' },
          { label: 'Rubric Evaluations', href: '/advisor/evaluations', icon: <FileCheck2 className="w-4 h-4" /> },
          { label: 'Issue Certificates', href: '/advisor/certificates', icon: <Award className="w-4 h-4" /> },
          { label: 'Club Reports', href: '/advisor/reports', icon: <BarChart3 className="w-4 h-4" /> },
        ];

      case 'CAMPUS_MANAGER':
        return [
          { label: 'Campus Overview', href: '/campus-manager/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Campus Clubs', href: '/campus-manager/clubs', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Event Oversight', href: '/campus-manager/events', icon: <Sparkles className="w-4 h-4" /> },
          { label: 'Zero-Participation & Reports', href: '/campus-manager/reports', icon: <BarChart3 className="w-4 h-4" />, badge: 'Duty Leave' },
        ];

      case 'ADMIN':
      default:
        return [
          { label: 'Admin Overview', href: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: 'Club Registry', href: '/admin/clubs', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Campuses', href: '/admin/campuses', icon: <Building2 className="w-4 h-4" /> },
          { label: 'Flagship Events', href: '/admin/events', icon: <Sparkles className="w-4 h-4" /> },
          { label: 'System Reports', href: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
          { label: 'User Directory', href: '/admin/users', icon: <UserCog className="w-4 h-4" /> },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-16 bottom-0 left-0 w-64 bg-surface/95 border-r border-surface-border p-4 flex flex-col justify-between z-40 transition-transform duration-200 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="space-y-6">
          {/* Role Scope Label */}
          <div className="px-3 py-2 rounded-xl bg-surface-card border border-surface-border">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              Active Portal
            </span>
            <div className="text-xs font-bold text-cyan-400 mt-0.5 tracking-tight flex items-center justify-between">
              <span>{role?.replace('_', ' ') || 'STUDENT'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group select-none',
                    isActive
                      ? 'bg-cyan-600/15 text-cyan-300 border border-cyan-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-surface-elevated/70 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'transition-colors',
                        isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      )}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold',
                        isActive
                          ? 'bg-cyan-500/30 text-cyan-200'
                          : 'bg-surface-elevated text-slate-300 border border-surface-border'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Institutional Footer Seal */}
        <div className="p-3 rounded-xl bg-surface-card/60 border border-surface-border text-center">
          <div className="text-[11px] font-semibold text-slate-300">Mirai School of Tech</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Problem 5 Challenge Ready</div>
        </div>
      </aside>
    </>
  );
}
