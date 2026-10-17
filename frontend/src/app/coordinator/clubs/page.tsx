'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { clubService } from '../../../lib/api/clubs';
import { Club } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Building, Users, Calendar, ArrowRight } from 'lucide-react';

export default function CoordinatorClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    async function load() {
      const all = await clubService.getClubs();
      // Coordinator Rohan Sharma is assigned to Nexcell and Malhar
      setClubs(all.filter((c) => c.slug === 'nexcell' || c.slug === 'malhar'));
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          Leadership Assignment
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          My Assigned Clubs
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Student coordinator management scope across sanctioned organizations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {clubs.map((club) => (
          <Card key={club.id} hoverEffect className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="cyan" size="sm">
                  {club.category}
                </Badge>
                <Badge variant="success" size="sm">
                  ACTIVE
                </Badge>
              </div>

              <h2 className="text-base font-bold text-slate-100">{club.name}</h2>
              <p className="text-xs text-slate-400 line-clamp-2">{club.description}</p>

              <div className="p-3 rounded-xl bg-surface-elevated text-xs space-y-1 font-mono text-slate-300">
                <div>Campus: {club.campus_name}</div>
                <div>Enrolled: {club.member_count} / {club.capacity} Students</div>
                <div>Cadence: {club.meeting_rules}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between gap-2">
              <Link href="/coordinator/attendance">
                <Button variant="primary" size="sm">
                  Host Live Session
                </Button>
              </Link>
              <Link href="/coordinator/requests">
                <Button variant="outline" size="sm">
                  Review Roster
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
