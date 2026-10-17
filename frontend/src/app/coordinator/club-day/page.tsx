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
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
} from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function CoordinatorClubDayPage() {
  const { showToast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('Seminar Hall 3B, Tech City Campus');
  const [date, setDate] = useState('2026-10-31');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:30');
  const [deliverableName, setDeliverableName] = useState('');
  const [deliverableDesc, setDeliverableDesc] = useState('');
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

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic || !deliverableName) {
      showToast('Please fill in all mandatory activity plan fields', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const deadline = new Date(new Date(date).getTime() + 48 * 3600 * 1000).toISOString();
      const newAct = await activityService.createActivityPlan({
        club_id: 'club-nexcell',
        title,
        topic,
        description,
        venue,
        date,
        start_time: startTime,
        end_time: endTime,
        deliverable_name: deliverableName,
        deliverable_description: deliverableDesc,
        deliverable_deadline: deadline,
      });

      setActivities((prev) => [newAct, ...prev]);
      showToast('Activity plan submitted to Faculty Advisor Dr. Radha Nair (7-day rule logged)', 'success');
      setShowCreateModal(false);
      setTitle('');
      setTopic('');
      setDescription('');
      setDeliverableName('');
      setDeliverableDesc('');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT 7-Day Planning Rule
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Plan Club Day Sessions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Coordinators must submit activity plans 7 days prior to session for Faculty Advisor review.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Submit Next Club Day Plan
        </Button>
      </div>

      {/* Activity Plans List */}
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

              <div className="text-left sm:text-right text-xs font-mono text-slate-400">
                <div>Venue: {act.venue}</div>
                <div>Time: {act.start_time} - {act.end_time}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-elevated text-xs space-y-1 font-mono">
              <div className="text-cyan-300 font-semibold">
                Mandatory Deliverable: {act.deliverable_name}
              </div>
              <div className="text-slate-400 text-[11px]">{act.deliverable_description}</div>
              <div className="text-amber-400 text-[11px]">
                Submission Window: 48 hours post session
              </div>
            </div>

            {act.advisor_comments && (
              <div className="p-3 rounded-xl bg-surface-elevated/40 border border-surface-border text-xs text-slate-300">
                <span className="font-semibold text-cyan-400 block mb-0.5">Advisor Review Remarks:</span>
                <p className="italic leading-relaxed">{act.advisor_comments}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create Plan Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Submit 7-Day Club Day Activity Plan"
          description="Institutional policy requires plan submission 7 days in advance for faculty approval."
          maxWidth="2xl"
        >
          <form onSubmit={handleCreatePlan} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Activity Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Club Day 10: Serverless AI Workflows & Vector Embeddings"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Technical Topic & Agenda *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. pgvector, RAG architectures, and chunking strategies"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Session Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time *</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">End Time *</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Session Venue *</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase font-mono block">
                Deliverable Artifact Specification (48-Hour Deadline)
              </span>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deliverable Name *
                </label>
                <input
                  type="text"
                  required
                  value={deliverableName}
                  onChange={(e) => setDeliverableName(e.target.value)}
                  placeholder="e.g. pgvector Benchmark Python Script & Execution Log"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deliverable Description & Rubric Criteria
                </label>
                <textarea
                  rows={2}
                  value={deliverableDesc}
                  onChange={(e) => setDeliverableDesc(e.target.value)}
                  placeholder="Instructions for students on what artifacts to upload..."
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                rightIcon={<Send className="w-3.5 h-3.5" />}
              >
                Submit Plan to Faculty Advisor
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
