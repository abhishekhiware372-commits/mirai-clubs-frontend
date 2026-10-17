'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Role } from '../../lib/api/types';
import {
  LayoutDashboard,
  QrCode,
  CalendarDays,
  UploadCloud,
  GraduationCap,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function MobileNav({ role }: { role: Role | null }) {
  const pathname = usePathname();

  // Bottom action bar items based on role
  const getMobileItems = () => {
    if (role === 'STUDENT_COORDINATOR') {
      return [
        { label: 'Dash', href: '/coordinator/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Live QR', href: '/coordinator/attendance', icon: <QrCode className="w-5 h-5" />, highlight: true },
        { label: 'Plan Plan', href: '/coordinator/club-day', icon: <CalendarDays className="w-5 h-5" /> },
        { label: 'Requests', href: '/coordinator/requests', icon: <Users className="w-5 h-5" /> },
      ];
    }
    if (role === 'FACULTY_ADVISOR') {
      return [
        { label: 'Dash', href: '/advisor/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: 'Approve', href: '/advisor/activities', icon: <CheckCircle2 className="w-5 h-5" />, highlight: true },
        { label: 'Grade', href: '/advisor/evaluations', icon: <UploadCloud className="w-5 h-5" /> },
      ];
    }
    // Default student items
    return [
      { label: 'Home', href: '/student/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { label: 'Scan QR', href: '/student/attendance', icon: <QrCode className="w-5 h-5" />, highlight: true },
      { label: 'Club Day', href: '/student/club-day', icon: <CalendarDays className="w-5 h-5" /> },
      { label: 'Transcript', href: '/student/transcript', icon: <GraduationCap className="w-5 h-5" /> },
    ];
  };

  const items = getMobileItems();

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card/95 backdrop-blur-lg border-t border-surface-border px-2 py-1 shadow-2xl"
    >
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[10px] font-medium transition-all',
                item.highlight && !isActive && 'text-cyan-400 font-semibold',
                isActive
                  ? 'text-cyan-400 font-bold bg-cyan-950/40'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
