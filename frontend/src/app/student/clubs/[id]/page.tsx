'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { clubService } from '../../../../lib/api/clubs';
import { activityService } from '../../../../lib/api/activities';
import { Club, Activity } from '../../../../lib/api/types';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Card } from '../../../../components/ui/Card';
import { Modal } from '../../../../components/ui/Modal';
import { useToast } from '../../../../context/ToastContext';
import {
  ArrowLeft,
  Building,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Mail,
  UserCheck,
} from 'lucide-react';
import { formatDate } from '../../../../lib/utils';

export default function ClubDetailPage() {
  const params = useParams();
  const clubId = params.id as string;
  const { showToast } = useToast();

  const [club, setClub] = useState<Club | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Join modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isPrimary, setIsPrimary] = useState(true);
  const [statement, setStatement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadClub() {
      try {
        const [c, acts] = await Promise.all([
          clubService.getClubById(clubId),
          activityService.getActivities({ club_id: clubId }),
        ]);
        setClub(c);
        setActivities(acts);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadClub();
  }, [clubId]);

  const handleJoin = async () => {
    if (!club) return;
    setIsSubmitting(true);
    try {
      await clubService.requestToJoinClub(club.id, { is_primary: isPrimary, statement });
      setClub((prev) => (prev ? { ...prev, membership_status: 'PENDING' } : null));
      showToast('Join request submitted successfully', 'success');
      setShowJoinModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading club profile...</div>;
  }

  if (!club) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-100">Club Not Found</h2>
        <Link href="/student/clubs">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Clubs
          </Button>
        </Link>
      </div>
    );
  }

  const isMember = club.membership_status === 'APPROVED';
  const isPending = club.membership_status === 'PENDING';

  return (
    <div className="space-y-6">
      <Link
        href="/student/clubs"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to all clubs
      </Link>

      {/* Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-surface-card via-surface-elevated to-surface-card border border-surface-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="violet" size="md">
            {club.category}
          </Badge>
          {isMember ? (
            <Badge variant={club.is_primary ? 'cyan' : 'default'}>
              {club.is_primary ? 'Primary Affiliation' : 'Secondary Affiliation'}
            </Badge>
          ) : isPending ? (
            <Badge variant="warning">Request Pending Approval</Badge>
          ) : (
            <Button variant="primary" size="sm" onClick={() => setShowJoinModal(true)}>
              Request to Join Club
            </Button>
          )}
        </div>

        <h1 className="text-xl sm:text-3xl font-bold text-slate-100">{club.name}</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          {club.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-surface-border text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Campus</span>
            <span className="text-slate-200 font-semibold">{club.campus_name || 'Tech City, Bangalore'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Faculty Advisor</span>
            <span className="text-slate-200 font-semibold">{club.advisor_name || 'Dr. Radha Nair'}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Enrollment</span>
            <span className="text-slate-200 font-mono">
              {club.member_count} / {club.capacity} Students
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Meeting Cadence</span>
            <span className="text-slate-200 truncate block">{club.meeting_rules || 'Weekly Friday'}</span>
          </div>
        </div>
      </div>

      {/* Club Activities Schedule */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-400" /> Club Day Sessions & Activities
        </h2>

        {activities.length === 0 ? (
          <div className="p-8 rounded-xl border border-surface-border text-center text-xs text-slate-400">
            No scheduled activities currently posted.
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => (
              <Card key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={act.approval_status === 'APPROVED' ? 'success' : 'warning'} size="sm">
                      {act.approval_status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs font-mono text-slate-400">{formatDate(act.date)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">{act.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{act.topic}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {act.venue}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {act.start_time} - {act.end_time}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <Link href="/student/attendance">
                    <Button variant="outline" size="sm">
                      Attendance Hub
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Join Request Modal */}
      {showJoinModal && (
        <Modal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          title={`Join ${club.name}`}
          description="Submit affiliation preference for coordinator review."
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Affiliation Tier
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrimary(true)}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    isPrimary
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200'
                      : 'bg-surface-elevated border-surface-border text-slate-400'
                  }`}
                >
                  <div className="font-bold">Primary Club</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Principal credit focus</div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrimary(false)}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    !isPrimary
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200'
                      : 'bg-surface-elevated border-surface-border text-slate-400'
                  }`}
                >
                  <div className="font-bold">Secondary Club</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Elective engagement</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Statement of Intent
              </label>
              <textarea
                rows={3}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="What project or goals do you wish to pursue in this club?"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowJoinModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleJoin} isLoading={isSubmitting}>
                Submit Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
