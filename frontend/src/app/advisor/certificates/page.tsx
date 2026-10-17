'use client';

import React, { useState } from 'react';
import { certificateService } from '../../../lib/api/certificates';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../context/ToastContext';
import { Award, ShieldCheck, Send } from 'lucide-react';

export default function AdvisorCertificatesPage() {
  const { showToast } = useToast();
  const [studentName, setStudentName] = useState('Alex Chen');
  const [studentRollNo, setStudentRollNo] = useState('MST-2026-CS101');
  const [title, setTitle] = useState('Certificate of Distinction in Venture Prototyping');
  const [clubName, setClubName] = useState('Nexcell — Entrepreneurship Club');
  const [certType, setCertType] = useState<'PARTICIPATION' | 'ACHIEVEMENT' | 'COORDINATOR_HONOR'>('ACHIEVEMENT');
  const [isIssuing, setIsIssuing] = useState(false);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    try {
      const cert = await certificateService.issueCertificate({
        student_id: 'usr-stud-01',
        student_name: studentName,
        student_roll_no: studentRollNo,
        title,
        event_or_club_name: clubName,
        certificate_type: certType,
      });

      showToast(`Credential issued successfully! Cert ID: ${cert.certificate_number}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Issuance failed', 'error');
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          Institutional Credential Engine
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          Issue Verifiable Co-Curricular Certificates
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Digitally signed certificates are bound to the student&apos;s co-curricular transcript with cryptographic SHA-256 verification.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleIssue} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Student Roll / Mains ID *
              </label>
              <input
                type="text"
                required
                value={studentRollNo}
                onChange={(e) => setStudentRollNo(e.target.value)}
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Certificate Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Sanctioned Club / Event *
              </label>
              <input
                type="text"
                required
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Award Classification *
              </label>
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value as any)}
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="ACHIEVEMENT">Achievement / Distinction</option>
                <option value="PARTICIPATION">Active Participation</option>
                <option value="COORDINATOR_HONOR">Leadership / Coordinator Honor</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-surface-border font-mono text-xs text-slate-400 space-y-1">
            <span className="text-cyan-400 font-semibold block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cryptographic Ledger Pipeline
            </span>
            <p className="text-[11px] text-slate-500">
              The platform generates an immutable SHA-256 fingerprint from the certificate serial, recipient identity, and faculty key.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isIssuing}
              leftIcon={<Award className="w-4 h-4" />}
            >
              Sign & Issue Credential
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
