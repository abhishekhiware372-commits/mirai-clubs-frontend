'use client';

import React, { useState, useEffect } from 'react';
import { reportService } from '../../../lib/api/reports';
import { clubService } from '../../../lib/api/clubs';
import { Campus, ZeroParticipationStudent, InactiveClub } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';
import { Download, Filter, BarChart3, Users, Building, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedReportType, setSelectedReportType] = useState('institutional_audit');
  const [zeroStudents, setZeroStudents] = useState<ZeroParticipationStudent[]>([]);
  const [inactiveClubs, setInactiveClubs] = useState<InactiveClub[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const [campList, zeros, inactives] = await Promise.all([
        clubService.getCampuses(),
        reportService.getZeroParticipationStudents(),
        reportService.getInactiveClubs(),
      ]);
      setCampuses(campList);
      setZeroStudents(zeros);
      setInactiveClubs(inactives);
    }
    load();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await reportService.exportReportCSV(selectedReportType);
      const a = document.createElement('a');
      a.href = res.blobUrl;
      a.download = res.filename;
      a.click();
      showToast(`Exported ${selectedReportType} as official CSV ledger.`, 'success');
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
            MSOT Institutional Audit
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            System Reports & Accreditation Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Export cross-campus co-curricular statistics, attendance audits, and inactive club investigations.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          isLoading={isExporting}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Official CSV
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Filter By Campus:</span>
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="rounded-xl bg-surface-elevated border border-surface-border px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Regional Campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-300">Report Focus:</span>
          <select
            value={selectedReportType}
            onChange={(e) => setSelectedReportType(e.target.value)}
            className="rounded-xl bg-surface-elevated border border-surface-border px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="institutional_audit">Institutional Ledger Audit</option>
            <option value="student_participation">Student Participation & Credits</option>
            <option value="club_health">Club Day Adherence & Health</option>
            <option value="zero_participation">Zero-Participation Risk Cohort</option>
            <option value="inactive_clubs">Inactive Club Sanctions</option>
          </select>
        </div>
      </Card>

      {/* Zero Participation Investigation Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Institutional Zero-Participation Investigation
          </h2>
          <Badge variant="warning">{zeroStudents.length} Students</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-slate-400 font-medium">
                <th className="pb-2">Student Name</th>
                <th className="pb-2">Student ID</th>
                <th className="pb-2">Institutional Email</th>
                <th className="pb-2">Campus</th>
                <th className="pb-2 text-right">Intervention Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono">
              {zeroStudents.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 font-sans font-semibold text-slate-200">{s.full_name}</td>
                  <td className="py-2.5 text-cyan-300">{s.student_id}</td>
                  <td className="py-2.5 text-slate-400">{s.email}</td>
                  <td className="py-2.5 font-sans text-slate-300">{s.campus_name}</td>
                  <td className="py-2.5 text-right text-amber-400 font-sans">Counselor Alert Sent</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
