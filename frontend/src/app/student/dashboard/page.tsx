'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { reportService } from '../../../lib/api/reports';
import { activityService } from '../../../lib/api/activities';
import { clubService } from '../../../lib/api/clubs';
import { Activity, Club, DashboardStats } from '../../../lib/api/types';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { CardSkeleton } from '../../../components/ui/LoadingSkeleton';
import {
  Compass,
  QrCode,
  CalendarDays,
  Award,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashStats, allClubs, acts] = await Promise.all([
          reportService.getDashboardStats('STUDENT'),
          clubService.getClubs(),
          activityService.getActivities(),
        ]);
        setStats(dashStats);
        setMyClubs(allClubs.filter((c) => c.membership_status === 'APPROVED'));
        setActivities(acts);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const liveActivity = activities.find((a) => a.id === 'act-01-live');
  const upcomingActivity = activities.find((a) => a.id === 'act-02-upcoming');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-card via-surface-elevated to-surface-card border border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="sm">
              SEMESTER 3
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              Roll ID: {user?.student_id || 'MST-2026-CS101'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Welcome back, {user?.full_name || 'Alex Chen'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Mirai School of Technology • {user?.department || 'Computer Science & AI'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/student/attendance">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<QrCode className="w-4 h-4" />}
              className="shadow-glow-cyan"
            >
              Scan Live QR Check-In
            </Button>
          </Link>
          <Link href="/student/transcript">
            <Button variant="outline" size="sm" leftIcon={<GraduationCap className="w-4 h-4" />}>
              View Transcript
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Club Day Callout (if in progress) */}
      {liveActivity && (
        <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0 mt-0.5">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  Club Day Session Live Now
                </span>
                <span className="text-xs text-slate-400">15-Second Rotating Check-In Active</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1">{liveActivity.title}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {liveActivity.venue}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> {liveActivity.start_time} - {liveActivity.end_time}
                </span>
              </div>
            </div>
          </div>

          <Link href="/student/attendance">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Open Scanner
            </Button>
          </Link>
        </div>
      )}

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Enrolled Clubs"
          value={myClubs.length}
          subtitle="1 Primary, 1 Secondary"
          icon={<Compass className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats?.attendance_pct || 92.5}%`}
          subtitle="Minimum 75% requirement"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
          trend={{ value: '+4.2%', isPositive: true }}
        />
        <StatCard
          title="Deliverable Score Avg"
          value={`${stats?.average_score || 94.0} / 100`}
          subtitle="Rubric evaluated credits"
          icon={<Award className="w-5 h-5" />}
          accentColor="violet"
        />
        <StatCard
          title="Co-Curricular Credits"
          value="18.0 Credits"
          subtitle="MSOT Transcript Accredited"
          icon={<GraduationCap className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Secondary Grid: My Clubs & Next Club Day Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: My Enrolled Clubs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" /> My Sanctioned Clubs
            </h3>
            <Link href="/student/clubs" className="text-xs text-cyan-400 hover:underline">
              Browse All (4)
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myClubs.map((club) => (
              <Card key={club.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={club.is_primary ? 'cyan' : 'default'} size="sm">
                      {club.is_primary ? 'Primary Club' : 'Secondary Club'}
                    </Badge>
                    <span className="text-[11px] font-mono text-emerald-400">Enrolled</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{club.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{club.description}</p>
                </div>

                <div className="pt-3 border-t border-surface-border mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Capacity: {club.member_count}/{club.capacity}</span>
                  <Link href={`/student/clubs/${club.id}`} className="text-cyan-400 hover:underline">
                    View &rarr;
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Next Club Day & Upcoming Events */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-400" /> Next Club Day Notice
            </h3>
            <Link href="/student/club-day" className="text-xs text-cyan-400 hover:underline">
              Club Day Hub
            </Link>
          </div>

          {upcomingActivity ? (
            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="warning" size="sm">
                  7-Day Plan Pending Approval
                </Badge>
                <span className="text-xs font-mono text-slate-400">{formatDate(upcomingActivity.date)}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-200">{upcomingActivity.title}</h4>
              <p className="text-xs text-slate-400">{upcomingActivity.topic}</p>

              <div className="p-3 rounded-xl bg-surface-elevated text-xs text-slate-300 space-y-1 font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{upcomingActivity.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate">Deliverable: {upcomingActivity.deliverable_name}</span>
                </div>
              </div>
            </Card>
          ) : (
            <div className="p-6 rounded-xl border border-surface-border text-center text-xs text-slate-400">
              No upcoming activity announced yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
