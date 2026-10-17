'use client';

import React from 'react';
import { Certificate } from '../../lib/api/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Award, ShieldCheck, Download, ExternalLink, Calendar, Building } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function CertificatePreviewModal({
  certificate,
  isOpen,
  onClose,
}: {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!certificate) return null;

  const handleDownloadAttempt = () => {
    // Open print view or direct download
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified Institutional Certificate"
      description="Cryptographically signed credential issued by Mirai School of Technology."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Certificate Decorative Parchment / Canvas Preview */}
        <div className="relative p-8 rounded-2xl bg-gradient-to-br from-slate-950 via-[#0a101f] to-slate-900 border-2 border-cyan-500/30 shadow-2xl text-center space-y-5 overflow-hidden">
          {/* Subtle watermark crest */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
            <span className="text-[120px] font-black font-mono tracking-widest text-cyan-400">
              MSOT
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center font-bold text-white text-xs font-mono">
              MC
            </div>
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-bold">
              Mirai School of Technology
            </span>
          </div>

          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
              Official Award of Recognition
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 font-serif tracking-tight">
              {certificate.title}
            </h2>
          </div>

          <div className="max-w-md mx-auto text-xs text-slate-300 leading-relaxed">
            This certifies that{' '}
            <span className="font-bold text-cyan-300 text-sm block my-1">
              {certificate.student_name}
            </span>
            (Student ID: <code className="font-mono text-slate-200">{certificate.student_roll_no}</code>) has
            successfully demonstrated exemplary excellence and participation in{' '}
            <span className="font-semibold text-slate-100">{certificate.event_or_club_name}</span>.
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 px-4">
            <div className="text-left">
              <span className="block text-[10px] text-slate-500">Date Awarded</span>
              <span className="text-slate-200">{formatDate(certificate.issue_date)}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-500">Credential ID</span>
              <span className="text-cyan-400 font-bold">{certificate.certificate_number}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic Verification Ledger Panel */}
        <div className="p-4 rounded-xl bg-surface-elevated/70 border border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Tamper-Proof Cryptographic Verification
            </span>
            <Badge variant="success" size="sm">
              SHA-256 Validated
            </Badge>
          </div>

          <div className="p-2.5 rounded-lg bg-surface border border-surface-border font-mono text-[11px] text-slate-300 break-all select-all">
            {certificate.verification_hash}
          </div>

          <p className="text-[11px] text-slate-500">
            This credential is permanently registered on the MSOT student co-curricular ledger and can be
            independently confirmed by external institutions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadAttempt}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export / Print Certificate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
