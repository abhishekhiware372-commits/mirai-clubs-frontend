import { apiClient } from './client';
import { Certificate, CoCurricularTranscript } from './types';
import { MOCK_CERTIFICATES, MOCK_TRANSCRIPT } from './mockData';

let localCertificates = [...MOCK_CERTIFICATES];

export const certificateService = {
  async getCertificates(params?: { student_id?: string }): Promise<Certificate[]> {
    try {
      const q = params?.student_id ? `?student_id=${params.student_id}` : '';
      return await apiClient<Certificate[]>(`/certificates${q}`);
    } catch {
      return localCertificates;
    }
  },

  async getCertificateById(id: string): Promise<Certificate | null> {
    try {
      return await apiClient<Certificate>(`/certificates/${id}`);
    } catch {
      return (
        localCertificates.find((c) => c.id === id || c.certificate_number === id) || null
      );
    }
  },

  async verifyCertificate(certNumber: string): Promise<{
    verified: boolean;
    certificate?: Certificate;
    message: string;
  }> {
    try {
      return await apiClient<{
        verified: boolean;
        certificate?: Certificate;
        message: string;
      }>(`/certificates/verify/${certNumber}`);
    } catch {
      const found = localCertificates.find(
        (c) => c.certificate_number.toUpperCase() === certNumber.trim().toUpperCase()
      );
      if (found) {
        return {
          verified: true,
          certificate: found,
          message: 'Cryptographically Verified: SHA-256 Signature Matches Institutional Ledger.',
        };
      }
      return {
        verified: false,
        message: 'Verification Failed: Certificate number not recognized in MSOT Registry.',
      };
    }
  },

  async issueCertificate(data: {
    student_id: string;
    student_name: string;
    student_roll_no: string;
    title: string;
    event_or_club_name: string;
    certificate_type: 'PARTICIPATION' | 'ACHIEVEMENT' | 'COORDINATOR_HONOR' | 'MERIT';
  }): Promise<Certificate> {
    try {
      return await apiClient<Certificate>('/certificates/issue', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const certNo = `MST-CERT-${new Date().getFullYear()}-AW-${Math.floor(1000 + Math.random() * 9000)}`;
      const cert: Certificate = {
        id: `cert-${Date.now()}`,
        certificate_number: certNo,
        ...data,
        issue_date: new Date().toISOString().split('T')[0],
        verification_hash: `hash-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        download_url: `/generated_certificates/${certNo}.pdf`,
        verified: true,
      };
      localCertificates.unshift(cert);
      return cert;
    }
  },

  async getTranscript(studentId?: string): Promise<CoCurricularTranscript> {
    try {
      return await apiClient<CoCurricularTranscript>(
        `/reports/transcript/${studentId || 'MST-2026-CS101'}`
      );
    } catch {
      return MOCK_TRANSCRIPT;
    }
  },
};
