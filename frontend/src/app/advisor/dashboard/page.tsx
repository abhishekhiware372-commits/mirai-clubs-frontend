'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { reportService } from '../../../lib/api/reports';
import { activityService } from '../../../lib/api/activities';
import { Activity, DashboardStats } from '../../../lib/api/types';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import {
  CheckCircle2,
  FileCheck2,
  Award,
  Calendar,
  Building,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function AdvisorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashStats, acts] = await Promise.all([
          reportService.getDashboardStats('FACULTY_ADVISOR'),
          activityService.getActivities(),
        ]);
        setStats(dashStats);
        setActivities(acts);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingPlan = activities.find((a) => a.approval_status === 'PENDING_APPROVAL');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-card via-surface-elevated to-surface-card border border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">
              FACULTY GOVERNANCE
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              Department of Computer Science & AI
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Faculty Advisor Portal: {user?.full_name || 'Dr. Radha Nair'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Overseeing Nexcell (Entrepreneurship) and Kaizen (Technology).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/advisor/activities">
            <Button variant="primary" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Review Activity Plans
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Clubs"
          value="2 Clubs"
          subtitle="Nexcell & Kaizen"
          icon={<Building className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Plans Awaiting Approval"
          value="1 Pending"
          subtitle="7-day rule compliance"
          icon={<Calendar className="w-5 h-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Pending Rubric Evaluations"
          value="2 Deliverables"
          subtitle="Customer Discovery Matrix"
          icon={<FileCheck2 className="w-5 h-5" />}
          accentColor="violet"
        />
        <StatCard
          title="Issued Certificates"
          value="24 Awarded"
          subtitle="SHA-256 Verified"
          icon={<Award className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Pending 7-Day Plan Callout */}
      {pendingPlan && (
        <Card className="p-5 border-amber-500/40 bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-amber-300 font-mono uppercase">
                Action Required: 7-Day Activity Plan Review
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">{formatDate(pendingPlan.date)}</span>
          </div>

          <h3 className="text-base font-bold text-slate-100">{pendingPlan.title}</h3>
          <p className="text-xs text-slate-300">{pendingPlan.topic}</p>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400 font-mono">
              Submitted by Coordinator Rohan Sharma
            </span>
            <Link href="/advisor/activities">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Review & Decide
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
