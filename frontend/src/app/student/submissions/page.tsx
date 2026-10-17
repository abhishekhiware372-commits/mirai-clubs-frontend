'use client';

import React, { useState, useEffect } from 'react';
import { submissionService } from '../../../lib/api/submissions';
import { Submission } from '../../../lib/api/types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import {
  UploadCloud,
  FileCheck2,
  Clock,
  Award,
  FileText,
  CheckCircle2,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function StudentSubmissionsPage() {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Evaluation details modal
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    async function loadSubs() {
      try {
        const list = await submissionService.getSubmissions();
        setSubmissions(list);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadSubs();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      showToast('Please select or specify a deliverable filename', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const newSub = await submissionService.uploadDeliverable({
        activity_id: 'act-01-live',
        file_name: fileName.trim(),
        file_size_kb: 2450,
        notes,
      });

      setSubmissions((prev) => [newSub, ...prev]);
      showToast('Deliverable artifact uploaded within the 48-hour window!', 'success');
      setShowUploadModal(false);
      setFileName('');
      setNotes('');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Problem 5 Artifact Registry
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Deliverables & Evaluation Rubrics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deliverables must be submitted within 48 hours of Club Day session conclusion.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowUploadModal(true)}
          leftIcon={<UploadCloud className="w-4 h-4" />}
        >
          Upload New Deliverable
        </Button>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {submissions.map((sub) => {
          const isEvaluated = sub.status === 'EVALUATED' && sub.evaluation;

          return (
            <Card key={sub.id} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        sub.status === 'EVALUATED'
                          ? 'success'
                          : sub.status === 'UNDER_REVIEW'
                          ? 'warning'
                          : 'cyan'
                      }
                      size="sm"
                    >
                      {sub.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">{sub.club_name}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{sub.activity_title}</h3>
                </div>

                <div className="text-left sm:text-right">
                  {sub.score !== undefined ? (
                    <div className="font-mono text-lg font-bold text-cyan-400">
                      {sub.score} / 100
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">Awaiting Evaluation</span>
                  )}
                  <span className="text-[11px] text-slate-500 font-mono block">
                    Submitted: {formatDate(sub.submitted_at)}
                  </span>
                </div>
              </div>

              {/* Artifact details */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-surface-elevated text-xs">
                <div className="flex items-center gap-2 text-slate-200 font-mono truncate">
                  <Paperclip className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="truncate">{sub.file_name}</span>
                  <span className="text-slate-500">({(sub.file_size_kb / 1024).toFixed(1)} MB)</span>
                </div>
                {sub.notes && (
                  <span className="text-slate-400 text-[11px] truncate hidden md:inline">
                    Notes: {sub.notes}
                  </span>
                )}
              </div>

              {/* Evaluator Rubric Feedback Preview */}
              {isEvaluated && sub.evaluation && (
                <div className="p-4 rounded-xl bg-surface-elevated/70 border border-surface-border space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-cyan-400" /> Faculty Evaluator Feedback ({sub.evaluation.evaluator_name})
                    </span>
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="text-cyan-400 hover:underline font-mono text-[11px]"
                    >
                      View Breakdown &rarr;
                    </button>
                  </div>
                  <p className="text-slate-300 italic leading-relaxed">&ldquo;{sub.evaluation.comments}&rdquo;</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="Upload Club Day Deliverable"
          description="Within 48-Hour Official Window (Due Oct 19, 23:59:59)"
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Activity Session *
              </label>
              <input
                type="text"
                disabled
                value="Club Day 08: Rapid B2B SaaS Prototyping & Pitch Clinic"
                className="w-full rounded-xl bg-surface border border-surface-border p-2.5 text-xs text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Deliverable Filename or Cloud Artifact URL *
              </label>
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. alex-chen-nextjs-saas-architecture.pdf"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Accepted formats: PDF, ZIP, GitHub URL (Max 15MB)
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Submission Notes & System Overview
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your architecture, database schema, or repository branch..."
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isUploading}>
                Upload & Verify Deliverable
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Rubric Breakdown Modal */}
      {selectedSubmission && selectedSubmission.evaluation && (
        <Modal
          isOpen={!!selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          title={`Rubric Breakdown: ${selectedSubmission.activity_title}`}
          description={`Evaluated by ${selectedSubmission.evaluation.evaluator_name} (${selectedSubmission.evaluation.evaluator_role})`}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-between font-mono">
              <span className="text-xs text-slate-400">Total Score</span>
              <span className="text-base font-bold text-cyan-400">
                {selectedSubmission.evaluation.total_score} / {selectedSubmission.evaluation.max_total_score}
              </span>
            </div>

            <div className="space-y-2.5">
              {selectedSubmission.evaluation.rubric_scores.map((c) => (
                <div key={c.criterion_name} className="p-3 rounded-xl bg-surface border border-surface-border text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-200">{c.criterion_name}</span>
                    <span className="font-mono text-cyan-300">
                      {c.score} / {c.max_score}
                    </span>
                  </div>
                  {c.feedback && <p className="text-[11px] text-slate-400 mt-1">{c.feedback}</p>}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedSubmission(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
