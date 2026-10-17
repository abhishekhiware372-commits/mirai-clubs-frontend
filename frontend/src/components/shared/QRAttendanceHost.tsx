'use client';

import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../lib/api/attendance';
import { AttendanceSession, AttendanceRecord } from '../../lib/api/types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import {
  QrCode,
  RefreshCw,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit3,
  PowerOff,
  AlertTriangle,
} from 'lucide-react';

export function QRAttendanceHost({ activityId = 'act-01-live' }: { activityId?: string }) {
  const { showToast } = useToast();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15);
  const [currentToken, setCurrentToken] = useState<string>('MRX-8942-F9');
  const [backupCode, setBackupCode] = useState<string>('741920');
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);

  // Correction Modal State
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<'PRESENT' | 'LATE' | 'EXCUSED' | 'ABSENT'>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [isSavingCorrection, setIsSavingCorrection] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsSessionLoading(true);
      try {
        let current = await attendanceService.getActiveSession(activityId);
        if (!current) {
          current = await attendanceService.startSession(activityId, 45);
        }
        setSession(current);
        setCurrentToken(current.current_token);
        setBackupCode(current.backup_code);

        const list = await attendanceService.getAttendees(activityId);
        setAttendees(list);
      } catch (err: any) {
        showToast(err.message || 'Failed to initialize session', 'error');
      } finally {
        setIsSessionLoading(false);
      }
    }
    loadData();
  }, [activityId, showToast]);

  // 15-second rotation countdown timer
  useEffect(() => {
    if (!session || !session.is_active) return;

    const interval = setInterval(async () => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Trigger QR refresh
          rotateQR();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const rotateQR = async () => {
    if (!session) return;
    setIsRotating(true);
    try {
      const qrData = await attendanceService.getCurrentQR(session.id);
      setCurrentToken(qrData.token);
      setBackupCode(qrData.backup_code);
      setSecondsRemaining(15);
    } catch {
      // quiet
    } finally {
      setIsRotating(false);
    }
  };

  const handleTogglePresenter = async (recordId: string, currentStatus: boolean) => {
    try {
      const updated = await attendanceService.togglePresenter(recordId, !currentStatus);
      setAttendees((prev) => prev.map((r) => (r.id === recordId ? updated : r)));
      showToast(
        !currentStatus ? 'Marked student as Presenter (+1 Merit Point)' : 'Removed presenter mark',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update presenter status', 'error');
    }
  };

  const handleOpenCorrection = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setCorrectionStatus(record.status);
    setCorrectionReason('');
  };

  const handleSaveCorrection = async () => {
    if (!selectedRecord) return;
    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      showToast('Please provide a mandatory justification reason (min 5 chars)', 'warning');
      return;
    }
    setIsSavingCorrection(true);
    try {
      const updated = await attendanceService.correctAttendance(
        selectedRecord.id,
        correctionStatus,
        correctionReason
      );
      setAttendees((prev) => prev.map((r) => (r.id === selectedRecord.id ? updated : r)));
      showToast('Attendance corrected and recorded in immutable audit log', 'success');
      setSelectedRecord(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to correct attendance', 'error');
    } finally {
      setIsSavingCorrection(false);
    }
  };

  const handleCloseSession = async () => {
    if (!session) return;
    try {
      await attendanceService.closeSession(session.id);
      setSession((prev) => (prev ? { ...prev, is_active: false } : null));
      showToast('Attendance session successfully concluded.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to close session', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Header Banner */}
      <div className="p-5 rounded-2xl bg-surface-card border border-surface-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> 15S ROTATING HMAC
            </span>
            <span className="text-xs text-slate-400">Anti-Proxy Protocol</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            Live QR Attendance Control Room
          </h2>
          <p className="text-xs text-slate-400">
            Tokens expire dynamically every 15 seconds. Screenshot sharing will be rejected by the server.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session?.is_active ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCloseSession}
              leftIcon={<PowerOff className="w-4 h-4" />}
            >
              Conclude Session
            </Button>
          ) : (
            <Badge variant="warning">Session Concluded</Badge>
          )}
        </div>
      </div>

      {/* Main Grid: QR Display Card + Real-time Attendee List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Rotating QR Visualizer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-surface-card border border-surface-border flex flex-col items-center text-center relative overflow-hidden">
            {/* Countdown Progress Ring Bar */}
            <div className="w-full mb-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                <Clock className="w-3.5 h-3.5" />
                <span>Rotation: {secondsRemaining}s</span>
              </div>
              <button
                onClick={rotateQR}
                disabled={isRotating}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                title="Force refresh token"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} /> Force Rotate
              </button>
            </div>

            {/* Simulated High-Res SVG QR Code */}
            <div className="relative p-5 rounded-2xl bg-white shadow-2xl flex items-center justify-center">
              <div className="w-56 h-56 flex flex-col items-center justify-center border-4 border-slate-900 rounded-lg p-2 bg-slate-50">
                {/* SVG pattern representing dynamic QR */}
                <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corner finder marks */}
                  <rect x="0" y="0" width="28" height="28" rx="4" />
                  <rect x="4" y="4" width="20" height="20" fill="white" />
                  <rect x="8" y="8" width="12" height="12" />

                  <rect x="72" y="0" width="28" height="28" rx="4" />
                  <rect x="76" y="4" width="20" height="20" fill="white" />
                  <rect x="80" y="8" width="12" height="12" />

                  <rect x="0" y="72" width="28" height="28" rx="4" />
                  <rect x="4" y="76" width="20" height="20" fill="white" />
                  <rect x="8" y="80" width="12" height="12" />

                  {/* Dynamic pattern blocks changing with token */}
                  <rect x="34" y="10" width="8" height="8" />
                  <rect x="46" y="10" width="14" height="6" />
                  <rect x="34" y="24" width="6" height="12" />
                  <rect x="46" y="24" width="18" height="8" />

                  <rect x="12" y="34" width="12" height="6" />
                  <rect x="12" y="46" width="6" height="14" />
                  <rect x="24" y="46" width="10" height="8" />

                  {/* Central seed token dots */}
                  <rect x="38" y="38" width="24" height="24" rx="2" fill="#0284c7" />
                  <text x="50" y="52" fill="white" fontSize="8" fontWeight="bold" textAnchor="middle">
                    MSOT
                  </text>

                  <rect x="68" y="34" width="8" height="10" />
                  <rect x="82" y="34" width="12" height="6" />
                  <rect x="68" y="50" width="16" height="8" />
                  <rect x="88" y="50" width="8" height="16" />

                  <rect x="34" y="68" width="8" height="8" />
                  <rect x="46" y="68" width="16" height="6" />
                  <rect x="34" y="82" width="18" height="8" />
                  <rect x="58" y="82" width="10" height="10" />
                  <rect x="74" y="74" width="20" height="18" />
                </svg>
              </div>

              {/* Status pill overlay */}
              <div className="absolute -bottom-3 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-mono shadow-md">
                {currentToken}
              </div>
            </div>

            {/* Offline / Camera Failure Backup Code */}
            <div className="mt-8 p-3 rounded-xl bg-surface-elevated/70 border border-surface-border w-full text-center">
              <span className="text-[11px] text-slate-400 block">
                Camera Malfunction Fallback Code:
              </span>
              <span className="text-xl font-mono font-bold text-amber-300 tracking-widest mt-0.5 block">
                {backupCode}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Announce code only if projector fails or mobile camera is damaged
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Attendee Log & Coordinator Quick Taps */}
        <div className="lg:col-span-7">
          <div className="p-5 rounded-2xl bg-surface-card border border-surface-border">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">Live Attendee Roster</h3>
              </div>
              <Badge variant="cyan" size="sm">
                {attendees.length} Checked In
              </Badge>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400 font-medium">
                    <th className="pb-2.5">Student</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Method</th>
                    <th className="pb-2.5">Presenter</th>
                    <th className="pb-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {attendees.map((record) => (
                    <tr key={record.id} className="hover:bg-surface-elevated/40 transition">
                      <td className="py-3">
                        <div className="font-semibold text-slate-200">{record.user_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{record.student_id}</div>
                      </td>
                      <td className="py-3">
                        {record.status === 'PRESENT' && <Badge variant="success">On-Time</Badge>}
                        {record.status === 'LATE' && <Badge variant="warning">Late</Badge>}
                        {record.status === 'EXCUSED' && <Badge variant="info">Excused</Badge>}
                        {record.status === 'ABSENT' && <Badge variant="danger">Absent</Badge>}
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-400">
                        {record.method === 'QR_SCAN' ? 'QR Scan' : record.method === 'BACKUP_CODE' ? 'Code Fallback' : 'Manual Override'}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleTogglePresenter(record.id, record.is_presenter)}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium border transition flex items-center gap-1 ${
                            record.is_presenter
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-surface-elevated text-slate-400 border-surface-border hover:text-slate-200'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {record.is_presenter ? 'Presenter' : 'Mark'}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCorrection(record)}
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                          className="h-7 text-xs"
                        >
                          Correct
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Correction Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Correct Attendance: ${selectedRecord.user_name}`}
          description="Every manual status change creates an immutable audit log with supervisor credentials."
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                New Attendance Status
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['PRESENT', 'LATE', 'EXCUSED', 'ABSENT'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setCorrectionStatus(st)}
                    className={`py-2 rounded-xl text-xs font-medium border transition ${
                      correctionStatus === st
                        ? 'bg-cyan-600 text-white border-cyan-400'
                        : 'bg-surface-elevated text-slate-300 border-surface-border hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Mandatory Justification Reason *
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="e.g. Student presented medical pass or confirmed projector glitch..."
                rows={3}
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCorrection}
                isLoading={isSavingCorrection}
              >
                Save & Log Audit
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
