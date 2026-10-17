'use client';

import React, { useState, useEffect } from 'react';
import { clubService } from '../../../lib/api/clubs';
import { Campus } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Building2, MapPin, Users, Plus } from 'lucide-react';

export default function AdminCampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);

  useEffect(() => {
    async function load() {
      const list = await clubService.getCampuses();
      setCampuses(list);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
            MSOT Multi-Campus Infrastructure
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
            Campus Centers Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mirai School of Technology regional facilities across 4 technology hubs.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {campuses.map((camp) => (
          <Card key={camp.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="cyan" size="sm">{camp.code}</Badge>
              <span className="text-xs font-mono text-emerald-400">Accredited Center</span>
            </div>

            <h2 className="text-base font-bold text-slate-100">{camp.name}</h2>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{camp.location}</span>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Sanctioned Clubs: {camp.club_count || 4}</span>
              <span>Enrolled Students: {camp.student_count || 850}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
