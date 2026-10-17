'use client';

import React, { useState, useEffect } from 'react';
import { activityService } from '../../../lib/api/activities';
import { Activity } from '../../../lib/api/types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  FileText,
  Calendar,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function AdvisorActivitiesPage() {
  const { showToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [advisorComments, setAdvisorComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadActivities() {
      try {
        const acts = await activityService.getActivities();
        setActivities(acts);
      } catch {
        // quiet
      }
    }
    loadActivities();
  }, []);

  const handleOpenReview = (act: Activity) => {
    setSelectedActivity(act);
    setDecisionAction('APPROVE');
    setAdvisorComments(
      act.approval_status === 'PENDING_APPROVAL'
        ? 'Plan reviewed and approved by Faculty Advisor. Approved for announcement to registered club members.'
        : act.advisor_comments || ''
    );
  };

  const handleConfirmReview = async () => {
    if (!selectedActivity) return;
    if (decisionAction === 'REQUEST_CHANGES' && (!advisorComments.trim() || advisorComments.length < 5)) {
      showToast('Please provide detailed feedback when requesting plan changes', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await activityService.reviewActivityPlan(
        selectedActivity.id,
        decisionAction,
        advisorComments
      );

      setActivities((prev) =>
        prev.map((a) => (a.id === selectedActivity.id ? updated : a))
      );

      showToast(
        decisionAction === 'APPROVE'
          ? 'Activity plan approved! Session will be announced 3 days prior.'
          : decisionAction === 'REQUEST_CHANGES'
          ? 'Changes requested. Coordinator notified.'
          : 'Activity plan rejected.',
        decisionAction === 'APPROVE' ? 'success' : 'info'
      );

      setSelectedActivity(null);
    } catch (err: any) {
      showToast(err.message || 'Review submission failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          Faculty Quality Gate
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          Activity Plan Approvals & Oversight
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review coordinator 7-day proposals before campus announcement: topic validity, venue reservation, and deliverable rubric.
        </p>
      </div>

      <div className="space-y-4">
        {activities.map((act) => (
          <Card key={act.id} className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      act.approval_status === 'APPROVED'
                        ? 'success'
                        : act.approval_status === 'CHANGES_REQUESTED'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {act.approval_status.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">{formatDate(act.date)}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{act.title}</h3>
                <p className="text-xs text-slate-300 mt-0.5">{act.topic}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => handleOpenReview(act)}>
                  Review & Approve
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-slate-400">
              <div>Venue: <span className="text-slate-200">{act.venue}</span></div>
              <div>Timing: <span className="text-slate-200">{act.start_time} - {act.end_time}</span></div>
              <div>Deliverable: <span className="text-cyan-300">{act.deliverable_name}</span></div>
              <div>Deadline: <span className="text-amber-400">48h Window</span></div>
            </div>

            {act.advisor_comments && (
              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border text-xs text-slate-300">
                <span className="font-semibold text-cyan-400 block mb-0.5">Advisor Decision:</span>
                <p className="italic leading-relaxed">{act.advisor_comments}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Review Modal */}
      {selectedActivity && (
        <Modal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={`Review Plan: ${selectedActivity.title}`}
          description="Evaluate the technical rigor and deliverable rubric before student notification."
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-elevated space-y-2 text-xs">
              <div className="font-bold text-slate-200 text-sm">{selectedActivity.topic}</div>
              <p className="text-slate-400 leading-relaxed">{selectedActivity.description}</p>
              <div className="pt-2 border-t border-surface-border font-mono text-[11px] text-cyan-300">
                Deliverable Artifact: {selectedActivity.deliverable_name}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Advisor Determination *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionAction('APPROVE')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                    decisionAction === 'APPROVE'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-surface-elevated border-surface-border text-slate-400'
                  }`}
                >
                  Approve Plan
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionAction('REQUEST_CHANGES')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                    decisionAction === 'REQUEST_CHANGES'
                      ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                      : 'bg-surface-elevated border-surface-border text-slate-400'
                  }`}
                >
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionAction('REJECT')}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition ${
                    decisionAction === 'REJECT'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-surface-elevated border-surface-border text-slate-400'
                  }`}
                >
                  Reject Plan
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Faculty Advisor Comments & Instructions *
              </label>
              <textarea
                rows={3}
                value={advisorComments}
                onChange={(e) => setAdvisorComments(e.target.value)}
                placeholder="Remarks regarding curriculum alignment, laboratory access, or deliverable adjustments..."
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedActivity(null)}>
                Cancel
              </Button>
              <Button
                variant={decisionAction === 'APPROVE' ? 'primary' : decisionAction === 'REQUEST_CHANGES' ? 'secondary' : 'danger'}
                size="sm"
                onClick={handleConfirmReview}
                isLoading={isSubmitting}
              >
                Submit Official Determination
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
