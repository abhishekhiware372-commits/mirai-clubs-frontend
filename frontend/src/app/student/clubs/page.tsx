'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { clubService } from '../../../lib/api/clubs';
import { Club, Campus } from '../../../lib/api/types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CardSkeleton } from '../../../components/ui/LoadingSkeleton';
import { useToast } from '../../../context/ToastContext';
import {
  Compass,
  Building,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
} from 'lucide-react';

export default function StudentClubsPage() {
  const { showToast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Join Request Modal
  const [targetClub, setTargetClub] = useState<Club | null>(null);
  const [isPrimary, setIsPrimary] = useState<boolean>(true);
  const [statement, setStatement] = useState<string>('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, campList] = await Promise.all([
          clubService.getClubs(),
          clubService.getCampuses(),
        ]);
        setClubs(cList);
        setCampuses(campList);
      } catch {
        // quiet
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenJoinModal = (club: Club) => {
    setTargetClub(club);
    setIsPrimary(true);
    setStatement('');
  };

  const handleConfirmJoin = async () => {
    if (!targetClub) return;
    setIsSubmittingJoin(true);
    try {
      await clubService.requestToJoinClub(targetClub.id, {
        is_primary: isPrimary,
        statement,
      });

      // Update local state to reflect 'PENDING'
      setClubs((prev) =>
        prev.map((c) => (c.id === targetClub.id ? { ...c, membership_status: 'PENDING' } : c))
      );

      showToast(
        `Join request submitted for ${targetClub.name}. Coordinator notified for approval.`,
        'success'
      );
      setTargetClub(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit join request', 'error');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const filteredClubs = clubs.filter((club) => {
    const matchesCampus = selectedCampus === 'all' || club.campus_id === selectedCampus;
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCampus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Problem 5 Sanctioned Organizations
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Explore Institutional Clubs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mirai allows enrollment in up to two clubs (1 Primary Club + 1 Secondary Club).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan">Strict 4 Sanctioned Limit</Badge>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs by name or category..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="rounded-xl bg-surface-elevated border border-surface-border px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Campuses (4)</option>
            {campuses.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name.split(' - ')[1] || camp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredClubs.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8" />}
          title="No clubs match your criteria"
          description="Try selecting a different campus or clearing your search keywords."
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedCampus('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredClubs.map((club) => {
            const isMember = club.membership_status === 'APPROVED';
            const isPending = club.membership_status === 'PENDING';

            return (
              <Card key={club.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  {/* Top Bar: Category + Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="violet" size="sm">
                      {club.category}
                    </Badge>

                    {isMember && (
                      <Badge variant={club.is_primary ? 'cyan' : 'default'} size="sm">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {club.is_primary ? 'Primary Member' : 'Secondary Member'}
                      </Badge>
                    )}

                    {isPending && (
                      <Badge variant="warning" size="sm">
                        <Clock className="w-3 h-3 text-amber-400" /> Request Pending
                      </Badge>
                    )}

                    {!isMember && !isPending && (
                      <Badge variant="outline" size="sm">
                        Open for Enrollment
                      </Badge>
                    )}
                  </div>

                  {/* Club Details */}
                  <h3 className="text-base font-bold text-slate-100">{club.name}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {club.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-surface-border text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">
                        Campus Center
                      </span>
                      <span className="text-slate-300 font-medium truncate block">
                        {club.campus_name || 'Tech City, Bangalore'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">
                        Advisor
                      </span>
                      <span className="text-slate-300 font-medium truncate block">
                        {club.advisor_name || 'Dr. Radha Nair'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">
                        Capacity
                      </span>
                      <span className="text-slate-300 font-mono">
                        {club.member_count} / {club.capacity} Students
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">
                        Meeting Rules
                      </span>
                      <span className="text-slate-300 truncate block text-[11px]">
                        {club.meeting_rules || 'Weekly Club Day'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-surface-border flex items-center justify-between gap-3">
                  <Link
                    href={`/student/clubs/${club.id}`}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    View Club Details <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {!isMember && !isPending && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenJoinModal(club)}
                    >
                      Request to Join
                    </Button>
                  )}

                  {isPending && (
                    <Button variant="secondary" size="sm" disabled>
                      Pending Review
                    </Button>
                  )}

                  {isMember && (
                    <Button variant="outline" size="sm" disabled>
                      Enrolled
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Join Request Modal */}
      {targetClub && (
        <Modal
          isOpen={!!targetClub}
          onClose={() => setTargetClub(null)}
          title={`Request to Join: ${targetClub.name}`}
          description="Submitted requests are forwarded to the Student Coordinator and Faculty Advisor."
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Affiliation Tier *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrimary(true)}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    isPrimary
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200'
                      : 'bg-surface-elevated border-surface-border text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">Primary Club</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Your principal co-curricular focus and credit priority.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrimary(false)}
                  className={`p-3 rounded-xl border text-left text-xs transition ${
                    !isPrimary
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200'
                      : 'bg-surface-elevated border-surface-border text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold">Secondary Club</div>
                  <div className="text-[10px] opacity-80 mt-0.5">
                    Cross-disciplinary involvement and elective activities.
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Statement of Intent / Motivation (Optional)
              </label>
              <textarea
                rows={3}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Describe your interests or technical skills you'd like to develop..."
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-3 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setTargetClub(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmJoin}
                isLoading={isSubmittingJoin}
              >
                Submit Join Request
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
