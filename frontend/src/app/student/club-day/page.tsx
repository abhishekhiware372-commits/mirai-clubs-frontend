'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { activityService } from '../../../lib/api/activities';
import { Activity } from '../../../lib/api/types';
import { ClubDayTimeline } from '../../../components/shared/ClubDayTimeline';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import {
  CalendarDays,
  QrCode,
  UploadCloud,
  FileCheck2,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function StudentClubDayPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivities() {
      try {
        const acts = await activityService.getActivities();
        setActivities(acts);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, []);

  const liveActivity = activities.find((a) => a.id === 'act-01-live');
  const recentActivity = activities.find((a) => a.id === 'act-04-evaluated');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          MSOT Student Challenge Problem 5
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          Club Day Central Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete lifecycle: 7-day plan, 3-day notice, rotating QR attendance, 48-hour deliverable, 5-day evaluation.
        </p>
      </div>

      {/* Official 6-Stage Workflow Visualizer */}
      <ClubDayTimeline currentStage={3} activityTitle="Club Day 08: Rapid B2B SaaS Prototyping" />

      {/* Live Stage Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Today's Live Attendance */}
        <Card className="flex flex-col justify-between border-cyan-500/30 bg-surface-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="cyan" size="sm">
                Stage 3: Live On-Campus
              </Badge>
              <span className="text-xs font-mono text-cyan-300">14:00 - 16:30</span>
            </div>

            <h3 className="text-base font-bold text-slate-100">
              {liveActivity?.title || 'Club Day 08: Rapid B2B SaaS Prototyping'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scan the coordinator&apos;s 15-second rotating HMAC QR code to register verified attendance.
              Students who present during the session receive dual credit on their co-curricular transcript.
            </p>

            <div className="p-3 rounded-xl bg-surface-elevated text-xs text-slate-300 space-y-1.5 font-mono">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{liveActivity?.venue || 'Seminar Hall 3B, Tech City Campus'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rotation Window: 15 seconds</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border mt-4 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Checked in at 14:04
            </span>
            <Link href="/student/attendance">
              <Button variant="primary" size="sm" leftIcon={<QrCode className="w-3.5 h-3.5" />}>
                Attendance Terminal
              </Button>
            </Link>
          </div>
        </Card>

        {/* Card 2: 48-Hour Deliverable Upload Window */}
        <Card className="flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="warning" size="sm">
                Stage 4: 48-Hour Deliverable
              </Badge>
              <span className="text-xs font-mono text-amber-300">Due Oct 19, 23:59</span>
            </div>

            <h3 className="text-base font-bold text-slate-100">
              {liveActivity?.deliverable_name || 'GitHub Repository & 3-Slide Architecture Deck'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your working code link and PDF architecture summary. Submissions will be evaluated
              by Coordinator Rohan Sharma and Faculty Advisor Dr. Radha Nair within 5 days using the 3-part rubric.
            </p>

            <div className="p-3 rounded-xl bg-surface-elevated text-xs text-slate-300 space-y-1 font-mono">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate">File types: PDF, ZIP (Max 15 MB)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-border mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">1 artifact submitted</span>
            <Link href="/student/submissions">
              <Button variant="secondary" size="sm" leftIcon={<UploadCloud className="w-3.5 h-3.5" />}>
                Manage Deliverables
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
