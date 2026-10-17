'use client';

import React, { useState, useEffect } from 'react';
import { clubService } from '../../../lib/api/clubs';
import { JoinRequest } from '../../../lib/api/types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useToast } from '../../../context/ToastContext';
import { Users, CheckCircle2, XCircle, Clock, Check, X } from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function CoordinatorRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequests() {
      try {
        const list = await clubService.getJoinRequests();
        setRequests(list);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      await clubService.reviewJoinRequest(id, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      showToast(
        status === 'APPROVED' ? 'Membership approved & student enrolled' : 'Membership request rejected',
        status === 'APPROVED' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err.message || 'Review failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const pastRequests = requests.filter((r) => r.status !== 'PENDING');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Admissions Roster
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Club Membership Applications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review student join requests and confirm primary/secondary affiliation capacities.
          </p>
        </div>

        <Badge variant="cyan" size="md">
          {pendingRequests.length} Pending Actions
        </Badge>
      </div>

      {/* Pending Queue */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" /> Pending Approval Queue ({pendingRequests.length})
        </h2>

        {pendingRequests.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8 text-emerald-400" />}
            title="All caught up!"
            description="There are no pending membership requests waiting for coordinator review."
          />
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{req.user_name}</span>
                    <span className="text-xs font-mono text-cyan-400">{req.student_id}</span>
                    <Badge variant={req.is_primary ? 'cyan' : 'default'} size="sm">
                      {req.is_primary ? 'Primary Club Choice' : 'Secondary Choice'}
                    </Badge>
                  </div>

                  <div className="text-xs text-slate-400">
                    {req.user_department} • {req.user_year} • Applied for: <span className="text-slate-200 font-semibold">{req.club_name}</span>
                  </div>

                  {req.statement && (
                    <div className="p-3 rounded-xl bg-surface-elevated/70 border border-surface-border text-xs text-slate-300 italic">
                      &ldquo;{req.statement}&rdquo;
                    </div>
                  )}

                  <div className="text-[10px] text-slate-500 font-mono">
                    Submitted: {formatDate(req.submitted_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReview(req.id, 'REJECTED')}
                    isLoading={processingId === req.id}
                    leftIcon={<X className="w-3.5 h-3.5" />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReview(req.id, 'APPROVED')}
                    isLoading={processingId === req.id}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Approve Member
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Reviewed Requests */}
      {pastRequests.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-surface-border">
          <h2 className="text-sm font-bold text-slate-400">Recent Reviewed Applications</h2>
          <div className="space-y-2">
            {pastRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 rounded-xl bg-surface-elevated/40 border border-surface-border flex items-center justify-between text-xs text-slate-400"
              >
                <div>
                  <span className="font-semibold text-slate-300">{req.user_name}</span> ({req.student_id}) — {req.club_name}
                </div>
                <Badge variant={req.status === 'APPROVED' ? 'success' : 'danger'} size="sm">
                  {req.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
