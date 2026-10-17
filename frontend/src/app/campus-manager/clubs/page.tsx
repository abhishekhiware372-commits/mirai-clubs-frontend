'use client';

import React, { useState, useEffect } from 'react';
import { clubService } from '../../../lib/api/clubs';
import { Club } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import { Building2, Users, ShieldCheck, PowerOff } from 'lucide-react';

export default function CampusManagerClubsPage() {
  const { showToast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    async function load() {
      const all = await clubService.getClubs({ campus_id: 'camp-blr' });
      setClubs(all);
    }
    load();
  }, []);

  const handleToggleStatus = (clubId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'PROBATION' : 'ACTIVE';
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, status: nextStatus as any } : c))
    );
    showToast(`Club status updated to ${nextStatus}`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            Campus Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Campus Club Oversight
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Maintain room allocations, faculty advisor supervision, and active health standings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {clubs.map((club) => (
          <Card key={club.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="cyan" size="sm">{club.category}</Badge>
              <Badge variant={club.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                {club.status}
              </Badge>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-100">{club.name}</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{club.description}</p>
            </div>

            <div className="p-3 rounded-xl bg-surface-elevated text-xs font-mono text-slate-300 space-y-1">
              <div>Faculty Advisor: {club.advisor_name || 'Dr. Radha Nair'}</div>
              <div>Capacity: {club.member_count} / {club.capacity} Students</div>
              <div>Cadence: {club.meeting_rules}</div>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between">
              <span className="text-xs text-slate-400">Institutional Sanction: Verified</span>
              <Button
                variant={club.status === 'ACTIVE' ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleToggleStatus(club.id, club.status)}
              >
                {club.status === 'ACTIVE' ? 'Place on Probation' : 'Reactivate Club'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
