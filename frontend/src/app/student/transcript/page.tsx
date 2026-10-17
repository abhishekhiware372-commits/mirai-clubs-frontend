'use client';

import React, { useState, useEffect } from 'react';
import { certificateService } from '../../../lib/api/certificates';
import { CoCurricularTranscript } from '../../../lib/api/types';
import { TranscriptView } from '../../../components/shared/TranscriptView';
import { CardSkeleton } from '../../../components/ui/LoadingSkeleton';

export default function StudentTranscriptPage() {
  const [transcript, setTranscript] = useState<CoCurricularTranscript | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTranscript() {
      try {
        const data = await certificateService.getTranscript('MST-2026-CS101');
        setTranscript(data);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadTranscript();
  }, []);

  if (loading || !transcript) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TranscriptView transcript={transcript} />
    </div>
  );
}
