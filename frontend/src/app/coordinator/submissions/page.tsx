'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { submissionService } from '../../../lib/api/submissions';
import { Submission } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { UploadCloud, FileCheck2, Paperclip, ExternalLink } from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function CoordinatorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    async function load() {
      const list = await submissionService.getSubmissions();
      setSubmissions(list);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            Artifact Intake
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Deliverables Intake Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submitted artifacts awaiting evaluation within the 5-day grading window.
          </p>
        </div>

        <Link href="/coordinator/evaluations">
          <Button variant="primary" size="sm" leftIcon={<FileCheck2 className="w-4 h-4" />}>
            Open Evaluation Rubric
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {submissions.map((sub) => (
          <Card key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">{sub.user_name}</span>
                <span className="text-xs font-mono text-cyan-400">{sub.student_id}</span>
                <Badge
                  variant={sub.status === 'EVALUATED' ? 'success' : 'warning'}
                  size="sm"
                >
                  {sub.status.replace('_', ' ')}
                </Badge>
              </div>

              <div className="text-xs text-slate-300 font-medium">{sub.activity_title}</div>

              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5" /> {sub.file_name}
                </span>
                <span>Submitted: {formatDate(sub.submitted_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/coordinator/evaluations">
                <Button variant="outline" size="sm">
                  {sub.status === 'EVALUATED' ? 'Review Score' : 'Grade Deliverable'}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
