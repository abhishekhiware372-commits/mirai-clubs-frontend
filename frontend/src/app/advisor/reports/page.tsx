'use client';

import React, { useState } from 'react';
import { reportService } from '../../../lib/api/reports';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { StatCard } from '../../../components/ui/StatCard';
import { useToast } from '../../../context/ToastContext';
import { Download, Users, CheckCircle2, Award, FileText } from 'lucide-react';

export default function AdvisorReportsPage() {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await reportService.exportReportCSV('advisor_club_health');
      const a = document.createElement('a');
      a.href = res.blobUrl;
      a.download = res.filename;
      a.click();
      showToast('Advisor audit report exported successfully', 'success');
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
            MSOT Faculty Governance
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Club Health & Academic Rigor Audit
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Statistical distribution of student deliverables, rubrics, and attendance health.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          isLoading={isExporting}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Faculty Audit CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Club Health Index"
          value="96 / 100"
          subtitle="Top decile in MSOT"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Plan Approval Adherence"
          value="100%"
          subtitle="All sessions compliant with 7-day rule"
          icon={<FileText className="w-5 h-5" />}
          accentColor="cyan"
        />
        <StatCard
          title="Rubric Grade Avg"
          value="91.8 / 100"
          subtitle="Standard deviation: 4.2"
          icon={<Award className="w-5 h-5" />}
          accentColor="violet"
        />
        <StatCard
          title="Active Student Cohort"
          value="170 Students"
          subtitle="Across 2 managed clubs"
          icon={<Users className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>
    </div>
  );
}
