'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { reportService } from '../../../lib/api/reports';
import { clubService } from '../../../lib/api/clubs';
import { eventService } from '../../../lib/api/events';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import {
  ShieldAlert,
  Building2,
  Users,
  Award,
  Sparkles,
  BarChart3,
  CheckCircle2,
  Calendar,
  Plus,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const data = await reportService.getDashboardStats('ADMIN');
      setStats(data);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-card via-surface-elevated to-surface-card border border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">
              EXECUTIVE DEAN CONSOLE
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              University-Wide Registry & Accreditation
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Program Manager Portal: {user?.full_name || 'Dr. Vikram Sen'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional oversight across Bangalore, NCR, Hyderabad, and Pune campuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/clubs">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Configure Club Registry
            </Button>
          </Link>
        </div>
      </div>

      {/* University Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Sanctioned Organizations"
          value="4 Sanctioned Clubs"
          subtitle="Strict MSOT Institutional Limit"
          icon={<Building2 className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Regional Campuses"
          value="4 Campuses"
          subtitle="BLR, NCR, HYD, PUN"
          icon={<Building2 className="w-5 h-5" />}
          accentColor="violet"
        />
        <StatCard
          title="Registered Students"
          value="2,420 Students"
          subtitle="Enrolled in active cohorts"
          icon={<Users className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Global Attendance Average"
          value="84.6%"
          subtitle="Across all Club Day sessions"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Verified Deliverables"
          value="1,240 Artifacts"
          subtitle="Evaluated with rubrics"
          icon={<Award className="w-5 h-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Cryptographic Certificates"
          value="382 Issued"
          subtitle="Tamper-proof SHA-256 signatures"
          icon={<Award className="w-5 h-5" />}
          accentColor="cyan"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/clubs">
          <Card hoverEffect className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">Club Registry</span>
              <Building2 className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xs text-slate-400">
              Create, edit, assign faculty advisors and coordinators, set capacity limits.
            </p>
          </Card>
        </Link>

        <Link href="/admin/campuses">
          <Card hoverEffect className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">Campus Directory</span>
              <Building2 className="w-4 h-4 text-violet-400" />
            </div>
            <p className="text-xs text-slate-400">
              Manage regional campuses and assign regional campus managers.
            </p>
          </Card>
        </Link>

        <Link href="/admin/reports">
          <Card hoverEffect className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-100 text-sm">System Reports</span>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400">
              Comprehensive institutional exports, zero-participation tracking, and audit trails.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
