'use client';

import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../../lib/api/attendance';
import { AttendanceRecord } from '../../../lib/api/types';
import { QRAttendanceScanner } from '../../../components/shared/QRAttendanceScanner';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function StudentAttendancePage() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    async function loadHistory() {
      try {
        const records = await attendanceService.getAttendees('act-01-live');
        setHistory(records.filter((r) => r.user_id === 'usr-stud-01'));
      } catch {
        // quiet
      }
    }
    loadHistory();
  }, []);

  const refreshHistory = async () => {
    try {
      const records = await attendanceService.getAttendees('act-01-live');
      setHistory(records.filter((r) => r.user_id === 'usr-stud-01'));
    } catch {
      // quiet
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          Dual-Factor Verification
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          Club Day Attendance Terminal
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Attendance requires scanning the 15-second rotating HMAC QR code presented by your Student Coordinator.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Scanner & Code Fallback */}
        <div className="lg:col-span-7">
          <QRAttendanceScanner
            activityId="act-01-live"
            onCheckInSuccess={refreshHistory}
          />
        </div>

        {/* Right: Attendance Verification Log */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> My Verified Attendance Record
            </h3>

            {history.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
                You have not checked in for today&apos;s session yet. Scan the rotating QR code on the left.
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-xl bg-surface-elevated/70 border border-surface-border text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{record.activity_title}</span>
                      <Badge variant={record.status === 'PRESENT' ? 'success' : 'warning'} size="sm">
                        {record.status === 'PRESENT' ? 'Verified On-Time' : 'Late Check-In'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Method: {record.method === 'QR_SCAN' ? 'Rotating QR' : 'Backup Code'}</span>
                      <span>{new Date(record.check_in_time).toLocaleTimeString()}</span>
                    </div>

                    {record.is_presenter && (
                      <div className="pt-1 flex items-center gap-1.5 text-amber-300 font-mono text-[11px]">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Presenter Merit Credit Awarded</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
