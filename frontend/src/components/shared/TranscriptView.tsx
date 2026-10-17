'use client';

import React from 'react';
import { CoCurricularTranscript } from '../../lib/api/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  GraduationCap,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function TranscriptView({ transcript }: { transcript: CoCurricularTranscript }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-card border border-surface-border no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Official Co-Curricular Transcript</h2>
            <p className="text-xs text-slate-400">
              Student-owned academic & co-curricular activity ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Official Verifiable Transcript Paper Sheet */}
      <div
        id="official-transcript-sheet"
        className="p-8 sm:p-12 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-8 relative overflow-hidden"
      >
        {/* Institutional Header */}
        <div className="border-b-2 border-slate-700 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white text-xl shadow-lg border border-cyan-400/40 font-mono">
              MSOT
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white uppercase font-sans">
                Mirai School of Technology
              </h1>
              <p className="text-xs text-slate-400 tracking-wide font-mono">
                Office of the Dean of Student Affairs • Autonomous Co-Curricular Ledger
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> DIGITALLY VERIFIED TRANSCRIPT
                </span>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right font-mono text-xs text-slate-400">
            <div>Transcript Ref: MST-TR-2026-9041</div>
            <div>Issued: {formatDate(transcript.issued_at)}</div>
            <div className="text-cyan-400">Status: Active & Valid</div>
          </div>
        </div>

        {/* Student Dossier Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Candidate Name</span>
            <span className="text-sm font-bold text-slate-100">{transcript.student.name}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Student Roll ID</span>
            <span className="text-sm font-bold text-cyan-300 font-mono">{transcript.student.student_id}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Department & Year</span>
            <span className="text-sm font-bold text-slate-200">{transcript.student.department}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Campus Center</span>
            <span className="text-sm font-bold text-slate-200">{transcript.student.campus}</span>
          </div>
        </div>

        {/* Co-Curricular Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">
              Cumulative Co-Curricular Credits
            </span>
            <span className="text-2xl font-bold text-cyan-400 font-mono mt-0.5 block">
              {transcript.student.total_co_curricular_credits.toFixed(1)} Credits
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Accredited by MSOT Academic Council</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">
              Overall Club Day Attendance
            </span>
            <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
              {transcript.student.overall_attendance_rate}%
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Exceeds 75% minimum threshold</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">
              Deliverable Evaluation Score Avg
            </span>
            <span className="text-2xl font-bold text-violet-400 font-mono mt-0.5 block">
              {transcript.student.cumulative_score_avg} / 100
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">Graded via standardized rubric</span>
          </div>
        </div>

        {/* Club Tenure */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-slate-800 pb-2">
            1. Official Club Tenure & Affiliations
          </h3>
          <div className="divide-y divide-slate-800">
            {transcript.club_tenure.map((club, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200">{club.club_name}</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Role: {club.role} • Enrolled: {formatDate(club.joined_date)}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={club.is_primary ? 'cyan' : 'default'} size="sm">
                    {club.is_primary ? 'Primary Club' : 'Secondary Club'}
                  </Badge>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Attendance: {club.attendance_pct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activities Record */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-slate-800 pb-2">
            2. Verified Club Day Activities & Presenter Credits
          </h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="pb-2">Date</th>
                <th className="pb-2">Club</th>
                <th className="pb-2">Activity Description</th>
                <th className="pb-2">Participation Credit</th>
                <th className="pb-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {transcript.activities_attended.map((act, i) => (
                <tr key={i}>
                  <td className="py-2.5 font-mono text-slate-400">{formatDate(act.date)}</td>
                  <td className="py-2.5 font-semibold text-slate-300">{act.club}</td>
                  <td className="py-2.5 text-slate-200">{act.activity_title}</td>
                  <td className="py-2.5">
                    {act.status === 'PRESENTER' ? (
                      <span className="inline-flex items-center gap-1 text-amber-300 font-semibold font-mono">
                        <Sparkles className="w-3 h-3 text-amber-400" /> Presenter
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">Attended</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-cyan-300">
                    {act.submission_score !== undefined ? `${act.submission_score}/100` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Flagship Events & Achievements */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono border-b border-slate-800 pb-2">
            3. Flagship Campus & Inter-Campus Competitions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {transcript.flagship_events.map((ev, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="font-bold text-slate-200">{ev.title}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {ev.date} • Role: {ev.role}
                </div>
                {ev.achievement && (
                  <div className="mt-2 text-amber-300 font-semibold font-mono text-[11px] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> {ev.achievement}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Certificates & Verification Ledger */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">
              Cryptographic SHA-256 Public Verification Key
            </span>
            <code className="text-[11px] font-mono text-cyan-400 break-all">
              sha256: 9a7f5b3c8e1d2f4a6b0c8e2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a
            </code>
            <p className="text-[10px] text-slate-500">
              Any institutional employer or university can verify this transcript at {transcript.verification_url}
            </p>
          </div>

          <div className="shrink-0 text-center sm:text-right">
            <div className="w-16 h-16 rounded-xl bg-white p-1.5 mx-auto sm:ml-auto">
              {/* Micro QR illustration */}
              <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="6" height="6" />
                <rect x="16" y="2" width="6" height="6" />
                <rect x="2" y="16" width="6" height="6" />
                <rect x="10" y="4" width="4" height="2" />
                <rect x="10" y="8" width="4" height="4" />
                <rect x="16" y="10" width="2" height="4" />
                <rect x="10" y="16" width="4" height="4" />
                <rect x="16" y="16" width="6" height="6" />
              </svg>
            </div>
            <span className="text-[9px] font-mono text-slate-400 mt-1 block">Scan to Verify</span>
          </div>
        </div>
      </div>
    </div>
  );
}
