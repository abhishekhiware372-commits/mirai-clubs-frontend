'use client';

import React, { useState } from 'react';
import { reportService } from '../../../lib/api/reports';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { StatCard } from '../../../components/ui/StatCard';
import { useToast } from '../../../context/ToastContext';
import { BarChart3, Download, Users, CheckCircle2, Award, Calendar } from 'lucide-react';

export default function CoordinatorReportsPage() {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await reportService.exportReportCSV('club_activity');
      const a = document.createElement('a');
      a.href = res.blobUrl;
      a.download = res.filename;
      a.click();
      showToast('Club activities report downloaded as CSV', 'success');
    } catch (err: any) {
      showToast(err.message || 'Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Monthly Analytics
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Club Performance & Attendance Report
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Month-end audit: Attendance %, submission statistics, rubric averages, and presenter credits.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          isLoading={isExporting}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export CSV Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Membership"
          value="78 Members"
          subtitle="Nexcell Capacity: 100"
          icon={<Users className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Monthly Attendance"
          value="88.2%"
          subtitle="4 Sessions Conducted"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Deliverable Submissions"
          value="92.0%"
          subtitle="On-time 48h rate"
          icon={<Award className="w-5 h-5" />}
          accentColor="violet"
        />
        <StatCard
          title="Presenter Badges"
          value="14 Credits"
          subtitle="Dual co-curricular transcript credits"
          icon={<Award className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Session-by-Session Breakdown */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-100">Semester 3 Session History</h3>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-border text-slate-400 font-medium">
              <th className="pb-2">Session Title</th>
              <th className="pb-2">Date</th>
              <th className="pb-2">Attendees</th>
              <th className="pb-2">Deliverables</th>
              <th className="pb-2 text-right">Avg Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border font-mono">
            <tr>
              <td className="py-2.5 font-sans font-semibold text-slate-200">Club Day 08: Rapid B2B SaaS Prototyping</td>
              <td className="py-2.5 text-slate-400">Oct 17, 2026</td>
              <td className="py-2.5 text-cyan-300">52 (84%)</td>
              <td className="py-2.5 text-slate-300">34 pending</td>
              <td className="py-2.5 text-right text-slate-400">In Progress</td>
            </tr>
            <tr>
              <td className="py-2.5 font-sans font-semibold text-slate-200">Club Day 07: Customer Discovery & Validation</td>
              <td className="py-2.5 text-slate-400">Oct 03, 2026</td>
              <td className="py-2.5 text-cyan-300">64 (91%)</td>
              <td className="py-2.5 text-emerald-400">58 evaluated</td>
              <td className="py-2.5 text-right font-bold text-cyan-400">93.4 / 100</td>
            </tr>
            <tr>
              <td className="py-2.5 font-sans font-semibold text-slate-200">Club Day 06: Lean Canvas & Market Sizing</td>
              <td className="py-2.5 text-slate-400">Sep 19, 2026</td>
              <td className="py-2.5 text-cyan-300">60 (88%)</td>
              <td className="py-2.5 text-emerald-400">56 evaluated</td>
              <td className="py-2.5 text-right font-bold text-cyan-400">91.8 / 100</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
