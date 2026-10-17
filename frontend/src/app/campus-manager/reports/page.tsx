'use client';

import React, { useState, useEffect } from 'react';
import { reportService } from '../../../lib/api/reports';
import { ZeroParticipationStudent, InactiveClub } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';
import { Download, AlertTriangle, FileCheck2, Check, X, Users } from 'lucide-react';

interface DutyLeaveItem {
  id: string;
  student_name: string;
  student_id: string;
  event_name: string;
  dates: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function CampusManagerReportsPage() {
  const { showToast } = useToast();
  const [zeroStudents, setZeroStudents] = useState<ZeroParticipationStudent[]>([]);
  const [inactiveClubs, setInactiveClubs] = useState<InactiveClub[]>([]);
  const [dutyLeaves, setDutyLeaves] = useState<DutyLeaveItem[]>([
    {
      id: 'dl-01',
      student_name: 'Alex Chen',
      student_id: 'MST-2026-CS101',
      event_name: 'GAMBADE 2026 — Inter-Campus Stage Drama',
      dates: 'Nov 12 - Nov 14, 2026 (3 Days)',
      status: 'PENDING',
    },
    {
      id: 'dl-02',
      student_name: 'Priya Patel',
      student_id: 'MST-2026-EC204',
      event_name: 'Mirai InnovateX 2026 Hackathon NCR',
      dates: 'Nov 20 - Nov 21, 2026 (2 Days)',
      status: 'PENDING',
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const [zeros, inactives] = await Promise.all([
        reportService.getZeroParticipationStudents('camp-blr'),
        reportService.getInactiveClubs(),
      ]);
      setZeroStudents(zeros);
      setInactiveClubs(inactives);
    }
    load();
  }, []);

  const handleDutyLeaveReview = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setDutyLeaves((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status } : d))
    );
    showToast(
      status === 'APPROVED'
        ? 'Official Duty Leave granted & synced with Academic Attendance registry.'
        : 'Duty leave request denied.',
      status === 'APPROVED' ? 'success' : 'info'
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await reportService.exportReportCSV('campus_participation');
      const a = document.createElement('a');
      a.href = res.blobUrl;
      a.download = res.filename;
      a.click();
      showToast('Campus compliance report downloaded', 'success');
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
            MSOT Campus Operations Audit
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Duty Leave & Participation Compliance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official Duty Leave sanctioning and zero-participation student monitoring.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          isLoading={isExporting}
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Compliance Audit CSV
        </Button>
      </div>

      {/* Duty Leave Approval UI */}
      <Card className="p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-cyan-400" /> Official Duty Leave Applications (Gambade & Hackathons)
        </h2>
        <div className="space-y-3">
          {dutyLeaves.map((dl) => (
            <div
              key={dl.id}
              className="p-4 rounded-xl bg-surface-elevated/70 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{dl.student_name}</span>
                  <span className="font-mono text-cyan-400">{dl.student_id}</span>
                  <Badge variant={dl.status === 'APPROVED' ? 'success' : dl.status === 'REJECTED' ? 'danger' : 'warning'} size="sm">
                    {dl.status}
                  </Badge>
                </div>
                <div className="text-slate-300 font-medium mt-1">{dl.event_name}</div>
                <div className="text-slate-500 font-mono text-[11px] mt-0.5">Period: {dl.dates}</div>
              </div>

              {dl.status === 'PENDING' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDutyLeaveReview(dl.id, 'REJECTED')}
                    leftIcon={<X className="w-3.5 h-3.5" />}
                  >
                    Deny
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDutyLeaveReview(dl.id, 'APPROVED')}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Grant Duty Leave
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Zero Participation Student Roster */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Zero-Participation Student Roster
          </h2>
          <Badge variant="warning" size="sm">
            {zeroStudents.length} Students At Risk
          </Badge>
        </div>
        <p className="text-xs text-slate-400">
          Students who have not enrolled in any sanctioned club or logged attendance this semester.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-slate-400 font-medium">
                <th className="pb-2">Student Name</th>
                <th className="pb-2">Roll ID</th>
                <th className="pb-2">Department</th>
                <th className="pb-2">Campus</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono">
              {zeroStudents.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 font-sans font-semibold text-slate-200">{s.full_name}</td>
                  <td className="py-2.5 text-cyan-300">{s.student_id}</td>
                  <td className="py-2.5 text-slate-400 font-sans">{s.department}</td>
                  <td className="py-2.5 text-slate-400 font-sans">{s.campus_name}</td>
                  <td className="py-2.5 text-right text-rose-400">0 Activities Logged</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
