'use client';

import React, { useState, useEffect } from 'react';
import { eventService } from '../../../lib/api/events';
import { Event } from '../../../lib/api/types';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Sparkles, Calendar, MapPin, Users } from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function CampusManagerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    async function load() {
      const all = await eventService.getEvents();
      setEvents(all);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
          Regional Venue & Logistics
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-0.5">
          Campus Event Logistics Oversight
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor auditorium scheduling, security arrangements, and inter-campus delegate arrivals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {events.map((ev) => (
          <Card key={ev.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={ev.event_type === 'FLAGSHIP' ? 'cyan' : 'violet'} size="sm">
                {ev.event_type}
              </Badge>
              <span className="text-xs font-mono text-cyan-300">
                {ev.current_registrations} / {ev.max_participants} Reg.
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100">{ev.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{ev.description}</p>

            <div className="p-3 rounded-xl bg-surface-elevated text-xs font-mono text-slate-300 space-y-1">
              <div>Schedule: {formatDate(ev.start_time)} - {formatDate(ev.end_time)}</div>
              <div>Venue: {ev.venue}</div>
              <div>Capacity: {ev.max_participants} Students</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
