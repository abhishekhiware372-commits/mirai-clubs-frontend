'use client';

import React, { useState } from 'react';
import { attendanceService } from '../../lib/api/attendance';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  Keyboard,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export function QRAttendanceScanner({
  activityId = 'act-01-live',
  onCheckInSuccess,
}: {
  activityId?: string;
  onCheckInSuccess?: () => void;
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'camera' | 'code'>('camera');
  const [codeInput, setCodeInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [checkInResult, setCheckInResult] = useState<{
    status: 'SUCCESS' | 'LATE' | 'ERROR';
    message: string;
    timestamp?: string;
  } | null>(null);

  const handleSimulatedScan = async (sampleToken: string) => {
    setIsSubmitting(true);
    setCheckInResult(null);
    try {
      const res = await attendanceService.studentCheckIn({
        activity_id: activityId,
        token: sampleToken,
      });

      if (res.status === 'LATE') {
        setCheckInResult({
          status: 'LATE',
          message: res.message,
          timestamp: new Date().toLocaleTimeString(),
        });
        showToast(res.message, 'warning');
      } else {
        setCheckInResult({
          status: 'SUCCESS',
          message: res.message,
          timestamp: new Date().toLocaleTimeString(),
        });
        showToast(res.message, 'success');
      }
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (err: any) {
      setCheckInResult({
        status: 'ERROR',
        message: err.message || 'Check-in failed. Please scan current QR or notify Coordinator.',
      });
      showToast(err.message || 'Check-in rejected by server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim() || codeInput.trim().length < 6) {
      showToast('Please enter the valid 6-digit backup attendance code', 'warning');
      return;
    }

    setIsSubmitting(true);
    setCheckInResult(null);
    try {
      const res = await attendanceService.studentCheckIn({
        activity_id: activityId,
        backup_code: codeInput.trim(),
      });

      setCheckInResult({
        status: res.status === 'LATE' ? 'LATE' : 'SUCCESS',
        message: res.message,
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast(res.message, res.status === 'LATE' ? 'warning' : 'success');
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (err: any) {
      setCheckInResult({
        status: 'ERROR',
        message: err.message || 'Verification failed. Code rejected by server.',
      });
      showToast(err.message || 'Invalid code', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-surface-border">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-cyan-400" /> Rotating QR Check-In Terminal
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified anti-proxy dual-factor attendance client
          </p>
        </div>
        <Badge variant="cyan" size="sm">
          Active Session
        </Badge>
      </div>

      {/* Tabs: Camera Simulation vs Manual Code Fallback */}
      <div className="flex gap-2 p-1 bg-surface-elevated rounded-xl border border-surface-border mb-5">
        <button
          onClick={() => {
            setActiveTab('camera');
            setCheckInResult(null);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'camera'
              ? 'bg-cyan-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5" /> Camera Scanner
        </button>
        <button
          onClick={() => {
            setActiveTab('code');
            setCheckInResult(null);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'code'
              ? 'bg-cyan-600 text-white font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" /> Backup Code Fallback
        </button>
      </div>

      {/* Tab 1: Simulated Viewfinder Camera */}
      {activeTab === 'camera' && (
        <div className="space-y-4">
          <div className="relative aspect-video max-h-56 w-full rounded-xl bg-slate-950 border-2 border-dashed border-cyan-500/40 flex flex-col items-center justify-center overflow-hidden">
            {/* Viewfinder crosshairs */}
            <div className="w-40 h-40 border-2 border-cyan-400 rounded-lg relative flex items-center justify-center animate-pulse">
              <span className="text-[10px] text-cyan-300 font-mono bg-slate-900/80 px-2 py-0.5 rounded">
                Point at rotating QR
              </span>
            </div>
            <div className="absolute bottom-2 text-[10px] text-slate-400 font-mono">
              Cryptographic Token Window: 15 seconds
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              Simulate Scan Against Server:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSimulatedScan('MRX-8942-F9')}
                isLoading={isSubmitting}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Scan Valid On-Time QR
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimulatedScan('MRX-EXPIRED-TOKEN')}
                isLoading={isSubmitting}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Test Expired Token Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manual Code Fallback */}
      {activeTab === 'code' && (
        <form onSubmit={handleManualCodeSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Enter 6-Digit Session Backup Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 741920"
              className="w-full text-center text-2xl font-mono tracking-widest rounded-xl bg-surface-elevated border border-surface-border p-3 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Test code from session screen: <code className="text-amber-400">741920</code>
            </span>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isSubmitting}
          >
            Verify & Confirm Check-In
          </Button>
        </form>
      )}

      {/* Verified Status Banner */}
      {checkInResult && (
        <div
          className={`mt-4 p-4 rounded-xl border flex items-start gap-3 animate-in fade-in ${
            checkInResult.status === 'SUCCESS'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : checkInResult.status === 'LATE'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {checkInResult.status === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {checkInResult.status === 'LATE' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {checkInResult.status === 'ERROR' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}

          <div>
            <div className="text-xs font-bold uppercase tracking-wider font-mono">
              {checkInResult.status === 'SUCCESS'
                ? 'Check-In Confirmed (On-Time)'
                : checkInResult.status === 'LATE'
                ? 'Check-In Confirmed (Late Window)'
                : 'Check-In Rejected'}
            </div>
            <div className="text-xs mt-0.5 leading-relaxed">{checkInResult.message}</div>
            {checkInResult.timestamp && (
              <div className="text-[10px] opacity-75 mt-1 font-mono">
                Server Timestamp: {checkInResult.timestamp}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
