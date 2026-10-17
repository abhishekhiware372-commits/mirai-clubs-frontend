'use client';

import React, { useState, useEffect } from 'react';
import { clubService } from '../../../lib/api/clubs';
import { Club, Campus } from '../../../lib/api/types';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import { Plus, Edit2, Building2, Users, CheckCircle2, Sliders } from 'lucide-react';

export default function AdminClubsPage() {
  const { showToast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Create/Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Entrepreneurship' | 'Sports' | 'Technology' | 'Cultural'>('Technology');
  const [campusId, setCampusId] = useState('camp-blr');
  const [capacity, setCapacity] = useState(100);
  const [meetingRules, setMeetingRules] = useState('');
  const [advisorName, setAdvisorName] = useState('Dr. Radha Nair');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'PROBATION'>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [cList, campList] = await Promise.all([
        clubService.getClubs(),
        clubService.getCampuses(),
      ]);
      setClubs(cList);
      setCampuses(campList);
    }
    load();
  }, []);

  const handleOpenCreate = () => {
    setEditingClub(null);
    setName('');
    setDescription('');
    setCategory('Technology');
    setCampusId('camp-blr');
    setCapacity(100);
    setMeetingRules('Every Saturday 10:00 AM');
    setAdvisorName('Dr. Radha Nair');
    setStatus('ACTIVE');
    setShowModal(true);
  };

  const handleOpenEdit = (club: Club) => {
    setEditingClub(club);
    setName(club.name);
    setDescription(club.description);
    setCategory(club.category as any);
    setCampusId(club.campus_id);
    setCapacity(club.capacity);
    setMeetingRules(club.meeting_rules || '');
    setAdvisorName(club.advisor_name || 'Dr. Radha Nair');
    setStatus(club.status);
    setShowModal(true);
  };

  const handleSaveClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a club name', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      if (editingClub) {
        const updated = await clubService.updateClub(editingClub.id, {
          name,
          description,
          category,
          campus_id: campusId,
          capacity,
          meeting_rules: meetingRules,
          status,
        });
        setClubs((prev) => prev.map((c) => (c.id === editingClub.id ? updated : c)));
        showToast('Club updated in official institutional registry.', 'success');
      } else {
        const created = await clubService.createClub({
          name,
          description,
          category,
          campus_id: campusId,
          capacity,
          meeting_rules: meetingRules,
        });
        setClubs((prev) => [...prev, created]);
        showToast('New club sanctioned and registered in MSOT ledger.', 'success');
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Problem 5 Club Registry
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Club Registry & Accreditation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure sanctioned clubs, assign faculty advisors, define meeting rules, and enforce capacity limits.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Sanction New Club
        </Button>
      </div>

      {/* Clubs Registry Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-border text-slate-400 font-medium">
              <th className="pb-3">Club Name</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Campus</th>
              <th className="pb-3">Faculty Advisor</th>
              <th className="pb-3">Enrollment / Cap</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {clubs.map((club) => (
              <tr key={club.id} className="hover:bg-surface-elevated/40 transition">
                <td className="py-3 font-semibold text-slate-200">{club.name}</td>
                <td className="py-3">
                  <Badge variant="violet" size="sm">{club.category}</Badge>
                </td>
                <td className="py-3 text-slate-300">{club.campus_name || 'Tech City, Bangalore'}</td>
                <td className="py-3 text-slate-300">{club.advisor_name || 'Dr. Radha Nair'}</td>
                <td className="py-3 font-mono text-cyan-300">
                  {club.member_count} / {club.capacity}
                </td>
                <td className="py-3">
                  <Badge variant={club.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                    {club.status}
                  </Badge>
                </td>
                <td className="py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(club)}
                    leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    className="h-7 text-xs"
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingClub ? `Edit Club: ${editingClub.name}` : 'Sanction New Student Organization'}
          description="Institutional configuration enforces capacity rules and faculty supervisor assignment."
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveClub} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Club Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kaizen — Technology Club"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Charter, mission, and student project focus..."
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Entrepreneurship">Entrepreneurship</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Campus *</label>
                <select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {campuses.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name.split(' - ')[1] || camp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Capacity *</label>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value) || 100)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Faculty Advisor *
                </label>
                <input
                  type="text"
                  required
                  value={advisorName}
                  onChange={(e) => setAdvisorName(e.target.value)}
                  placeholder="e.g. Dr. Radha Nair"
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PROBATION">PROBATION</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Meeting Rules & Venue</label>
              <input
                type="text"
                value={meetingRules}
                onChange={(e) => setMeetingRules(e.target.value)}
                placeholder="e.g. Every Friday 4:30 PM at Campus Innovation Hub"
                className="w-full rounded-xl bg-surface-elevated border border-surface-border p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSaving}>
                {editingClub ? 'Save Changes' : 'Sanction Club'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
