'use client';

import React, { useState, useEffect } from 'react';
import { certificateService } from '../../../lib/api/certificates';
import { Certificate } from '../../../lib/api/types';
import { CertificatePreviewModal } from '../../../components/shared/CertificatePreviewModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Award, ShieldCheck, Download, Eye, Calendar, Sparkles } from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCerts() {
      try {
        const list = await certificateService.getCertificates();
        setCertificates(list);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadCerts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Cryptographic Credentials
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Certificates & Honors
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-resistant digital credentials with SHA-256 cryptographic signatures.
          </p>
        </div>

        <Badge variant="cyan" size="md">
          {certificates.length} Issued Credentials
        </Badge>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {certificates.map((cert) => (
          <Card key={cert.id} hoverEffect className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={cert.certificate_type === 'ACHIEVEMENT' ? 'violet' : 'cyan'}
                  size="sm"
                >
                  {cert.certificate_type}
                </Badge>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-100 leading-snug">{cert.title}</h3>
              <p className="text-xs text-slate-400">{cert.event_or_club_name}</p>

              <div className="p-3 rounded-xl bg-surface-elevated text-xs font-mono text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Certificate ID:</span>
                  <span className="text-slate-200">{cert.certificate_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Issued Date:</span>
                  <span className="text-slate-200">{formatDate(cert.issue_date)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCert(cert)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
                className="w-full"
              >
                Inspect & Verify Credential
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Certificate Modal */}
      <CertificatePreviewModal
        certificate={selectedCert}
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
}
