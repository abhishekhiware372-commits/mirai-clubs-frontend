'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { reportService } from '../../../lib/api/reports';
import { clubService } from '../../../lib/api/clubs';
import { activityService } from '../../../lib/api/activities';
import { DashboardStats, JoinRequest, Activity } from '../../../lib/api/types';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import {
  QrCode,
  CalendarDays,
  Users,
  UploadCloud,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function CoordinatorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashStats, reqs, acts] = await Promise.all([
          reportService.getDashboardStats('STUDENT_COORDINATOR'),
          clubService.getJoinRequests(),
          activityService.getActivities(),
        ]);
        setStats(dashStats);
        setRequests(reqs.filter((r) => r.status === 'PENDING'));
        setActivities(acts);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-card via-surface-elevated to-surface-card border border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">
              LEADERSHIP DESK
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              Assigned: Nexcell & Malhar
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Coordinator Portal: {user?.full_name || 'Rohan Sharma'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimized for rapid mobile actions during Club Day operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/coordinator/attendance">
            <Button
              variant="primary"
              size="md"
              leftIcon={<QrCode className="w-5 h-5 animate-pulse" />}
              className="shadow-glow-cyan"
            >
              Host Live Rotating QR
            </Button>
          </Link>
        </div>
      </div>

      {/* Rapid Action Buttons (Mobile-First 1-Tap Bar) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/coordinator/attendance">
          <Card hoverEffect className="p-4 text-center border-cyan-500/30 bg-cyan-950/20">
            <QrCode className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-100">Live QR Session</div>
            <div className="text-[10px] text-cyan-300 font-mono mt-0.5">15s Active HMAC</div>
          </Card>
        </Link>

        <Link href="/coordinator/club-day">
          <Card hoverEffect className="p-4 text-center">
            <CalendarDays className="w-6 h-6 text-violet-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-100">Plan Next Session</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">7-Day Plan Rule</div>
          </Card>
        </Link>

        <Link href="/coordinator/requests">
          <Card hoverEffect className="p-4 text-center relative">
            {requests.length > 0 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] font-mono">
                {requests.length}
              </span>
            )}
            <Users className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-100">Join Requests</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">1-Tap Review</div>
          </Card>
        </Link>

        <Link href="/coordinator/evaluations">
          <Card hoverEffect className="p-4 text-center">
            <FileCheck2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-100">Grade Submissions</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Rubric Scoring</div>
          </Card>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Live Session"
          value="38 Checked In"
          subtitle="Club Day 08 Running"
          icon={<QrCode className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Pending Join Requests"
          value={requests.length}
          subtitle="Waiting coordinator review"
          icon={<Users className="w-5 h-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Submissions Queue"
          value="2 Pending"
          subtitle="Within 5-day window"
          icon={<UploadCloud className="w-5 h-5" />}
          accentColor="violet"
        />
        <StatCard
          title="Average Attendance"
          value="86.4%"
          subtitle="Campus benchmark: 75%"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Quick Pending Requests Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" /> Pending Membership Applications
          </h3>
          <Link href="/coordinator/requests" className="text-xs text-cyan-400 hover:underline">
            View All ({requests.length}) &rarr;
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 rounded-xl border border-surface-border text-center text-xs text-slate-400">
            No pending join requests at this time.
          </div>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 2).map((req) => (
              <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-xs">{req.user_name}</span>
                    <Badge variant={req.is_primary ? 'cyan' : 'default'} size="sm">
                      {req.is_primary ? 'Primary Choice' : 'Secondary Choice'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{req.statement}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/coordinator/requests">
                    <Button variant="primary" size="sm">
                      Review Application
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
