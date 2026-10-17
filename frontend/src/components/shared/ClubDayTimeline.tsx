import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  QrCode,
  Upload,
  FileCheck2,
  BarChart,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ClubDayTimelineProps {
  currentStage?: number; // 1 to 6
  activityTitle?: string;
  className?: string;
}

export function ClubDayTimeline({
  currentStage = 3,
  activityTitle = 'Club Day 08: Rapid B2B SaaS Prototyping',
  className,
}: ClubDayTimelineProps) {
  const stages = [
    {
      step: 1,
      name: '7 Days Before',
      title: 'Plan Submission & Approval',
      desc: 'Coordinator submits topic, venue, deliverable & deadline. Advisor approves or requests changes.',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      step: 2,
      name: '3 Days Before',
      title: 'Member Announcement',
      desc: 'Topic, venue & deliverable notified campus-wide to all registered club members.',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      step: 3,
      name: 'On Club Day',
      title: 'Live QR Attendance & Session',
      desc: '15-second rotating HMAC QR code. Backup code fallback. Mark presenters.',
      icon: <QrCode className="w-4 h-4" />,
    },
    {
      step: 4,
      name: 'Within 48 Hours',
      title: 'Deliverable Upload Window',
      desc: 'Students upload verified deliverable artifacts before hard deadline.',
      icon: <Upload className="w-4 h-4" />,
    },
    {
      step: 5,
      name: 'Within 5 Days',
      title: 'Rubric Evaluation',
      desc: 'Content, Presentation, and Participation rubric scoring and feedback.',
      icon: <FileCheck2 className="w-4 h-4" />,
    },
    {
      step: 6,
      name: 'End of Month',
      title: 'Institutional Report',
      desc: 'Monthly attendance %, submission statistics, highlights, and credit transcripts.',
      icon: <BarChart className="w-4 h-4" />,
    },
  ];

  return (
    <div className={cn('p-5 rounded-2xl bg-surface-card border border-surface-border', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Problem 5 Club Day Workflow
          </span>
          <h3 className="text-base font-bold text-slate-100 mt-0.5">{activityTitle}</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-surface-elevated px-3 py-1.5 rounded-xl border border-surface-border">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Stage {currentStage} of 6: Active</span>
        </div>
      </div>

      {/* Grid of stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {stages.map((stage) => {
          const isDone = stage.step < currentStage;
          const isCurrent = stage.step === currentStage;

          return (
            <div
              key={stage.step}
              className={cn(
                'relative p-4 rounded-xl border transition-all duration-150',
                isCurrent
                  ? 'bg-cyan-950/20 border-cyan-500/50 shadow-glow-cyan ring-1 ring-cyan-500/20'
                  : isDone
                  ? 'bg-surface-elevated/40 border-emerald-900/40 text-slate-300'
                  : 'bg-surface-elevated/20 border-surface-border/60 opacity-60 text-slate-400'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    'text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                    isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : isDone
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                      : 'bg-slate-800 text-slate-400'
                  )}
                >
                  {stage.name}
                </span>

                <div
                  className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center',
                    isCurrent
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  )}
                >
                  {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : stage.icon}
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-200">{stage.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{stage.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
