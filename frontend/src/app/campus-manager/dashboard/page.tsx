'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { reportService } from '../../../lib/api/reports';
import { clubService } from '../../../lib/api/clubs';
import { eventService } from '../../../lib/api/events';
import { Club, Event, ZeroParticipationStudent, InactiveClub } from '../../../lib/api/types';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  FileCheck2,
} from 'lucide-react';

export default function CampusManagerDashboardPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [zeroStudents, setZeroStudents] = useState<ZeroParticipationStudent[]>([]);
  const [inactiveClubs, setInactiveClubs] = useState<InactiveClub[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [cList, zeros, inactives] = await Promise.all([
          clubService.getClubs({ campus_id: 'camp-blr' }),
          reportService.getZeroParticipationStudents('camp-blr'),
          reportService.getInactiveClubs(),
        ]);
        setClubs(cList);
        setZeroStudents(zeros);
        setInactiveClubs(inactives);
      } catch {
        // quiet
      }
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
              CAMPUS REGIONAL OPERATIONS
            </Badge>
            <span className="text-xs text-slate-400 font-mono">
              Center: Mirai Main Campus - Tech City, Bangalore
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-1">
            Campus Manager: {user?.full_name || 'Anita Desai'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Regional oversight of student co-curricular engagement, club health, and official duty leave requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/campus-manager/reports">
            <Button variant="primary" size="sm" leftIcon={<FileCheck2 className="w-4 h-4" />}>
              Duty Leave & Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Campus Clubs"
          value={clubs.length}
          subtitle="Operating in Tech City"
          icon={<Building2 className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Student Participation"
          value="78.2%"
          subtitle="665 of 850 students active"
          icon={<Users className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Zero-Participation Cohort"
          value={`${zeroStudents.length} Students`}
          subtitle="Need counselor outreach"
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Duty Leave Applications"
          value="4 Pending"
          subtitle="Gambade & Hackathon passes"
          icon={<FileCheck2 className="w-5 h-5" />}
          accentColor="violet"
        />
      </div>

      {/* Regional Inactive Clubs Warning */}
      {inactiveClubs.length > 0 && (
        <Card className="p-5 border-amber-500/40 bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 font-mono uppercase flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Inactive Club Warning Notice
            </span>
            <Badge variant="warning" size="sm">
              Action Required
            </Badge>
          </div>
          <p className="text-xs text-slate-300">
            2 student organizations have not logged a verified Club Day activity plan within the last 45 days.
            Institutional policy requires either reactivation or probation review.
          </p>
          <div className="divide-y divide-amber-900/40 pt-2">
            {inactiveClubs.map((club) => (
              <div key={club.id} className="py-2 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-200">{club.name} ({club.campus_name})</span>
                <span className="text-amber-400">{club.days_inactive} days without session</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Campus Clubs Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" /> Active Campus Clubs
          </h3>
          <Link href="/campus-manager/clubs" className="text-xs text-cyan-400 hover:underline">
            View Details &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clubs.map((club) => (
            <Card key={club.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-sm">{club.name}</span>
                <Badge variant="success" size="sm">
                  HEALTHY
                </Badge>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{club.description}</p>
              <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Enrolled: {club.member_count} / {club.capacity}</span>
                <span className="text-cyan-400">{club.meeting_rules}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
